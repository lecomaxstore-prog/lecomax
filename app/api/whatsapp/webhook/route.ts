import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type OpenAI from "openai";
import { getStoreAssistantContext } from "@/lib/store-assistant-context";

import { getGroqClient } from "@/lib/groq-client";

// ─── Clients ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Helpers ────────────────────────────────────────────────────────────────
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "lecomax_webhook_token";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

/** Phrases that trigger live-agent escalation (multi-language). */
const ESCALATION_PATTERNS = [
  /\b(agent|human|person|personne|quelqu[''']un|vrai|réel|live|real)\b/i,
  /\b(agent humain|live agent|parler à quelqu|talk to (a |an )?(human|person|agent))\b/i,
  /\b(مساعدة بشرية|تحدث مع شخص|وكيل|إنسان)\b/i,
  /\b(واحد حقيقي|شخص حقيقي|خدمة بشرية)\b/i,
];

function wantsHuman(text: string): boolean {
  return ESCALATION_PATTERNS.some((p) => p.test(text));
}

async function sendWhatsAppMessage(to: string, body: string) {
  await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WA_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );
}

async function getAIReply(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const businessContext = await getStoreAssistantContext();
  const systemPrompt = `You are Eco, the friendly AI assistant for L'ecomax — a Moroccan online store (lecomax.com) selling fashion, sports shoes, clothing, earphones, Bluetooth speakers, and gaming accessories.

Store info:
- ${businessContext}
- Free returns within 30 days

LANGUAGE RULE: Detect the customer's language and ALWAYS reply in that exact language (French / English / Arabic / Darija).

ESCALATION RULE: If you cannot answer confidently, say you'll connect the customer to a live agent and add the exact phrase: "[ESCALATE]" at the END of your reply.

Style: Warm, helpful, concise (under 120 words). No long paragraphs. Use natural line breaks.`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10), // last 10 turns for context
    { role: "user", content: userMessage },
  ];

  const completion = await getGroqClient().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.6,
    max_tokens: 250,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

// ─── GET — webhook verification ─────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─── POST — receive incoming messages ───────────────────────────────────────
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entry = (body as Record<string, unknown>)?.entry as unknown[];
  if (!Array.isArray(entry)) return NextResponse.json({ ok: true });

  for (const e of entry as Record<string, unknown>[]) {
    const changes = e?.changes as Record<string, unknown>[];
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = change?.value as Record<string, unknown>;
      const messages = value?.messages as Record<string, unknown>[];
      const contacts = value?.contacts as Record<string, unknown>[];

      if (!Array.isArray(messages)) continue;

      for (const msg of messages) {
        if (msg.type !== "text") continue; // only handle text for now

        const waMessageId = msg.id as string;
        const fromPhone = msg.from as string;
        const text = (msg.text as Record<string, string>)?.body || "";
        const contactName =
          (contacts?.[0]?.profile as Record<string, string>)?.name || fromPhone;

        // ── 1. Upsert conversation ──
        const { data: convRow } = await supabase
          .from("whatsapp_conversations")
          .upsert(
            { phone: fromPhone, name: contactName, last_message: text, last_at: new Date().toISOString() },
            { onConflict: "phone", ignoreDuplicates: false }
          )
          .select("id, status, unread_count")
          .single();

        if (!convRow) continue;

        // Avoid duplicate processing
        const { data: existing } = await supabase
          .from("whatsapp_messages")
          .select("id")
          .eq("wa_message_id", waMessageId)
          .maybeSingle();
        if (existing) continue;

        // ── 2. Save inbound message ──
        await supabase.from("whatsapp_messages").insert({
          conversation_id: convRow.id,
          direction: "in",
          body: text,
          sent_by: "client",
          wa_message_id: waMessageId,
        });

        // Increment unread
        await supabase
          .from("whatsapp_conversations")
          .update({ unread_count: (convRow.unread_count || 0) + 1, last_message: text, last_at: new Date().toISOString() })
          .eq("id", convRow.id);

        // ── 3. If escalated → notify, don't auto-reply ──
        if (convRow.status === "escalated") {
          // Agent handles it; no bot reply
          continue;
        }

        // ── 4. Check if user explicitly requests human ──
        if (wantsHuman(text)) {
          const escalationMsg =
            "Je vous mets en relation avec un de nos agents. Vous serez pris en charge très prochainement. 🙏";
          await sendWhatsAppMessage(fromPhone, escalationMsg);
          await supabase.from("whatsapp_messages").insert({
            conversation_id: convRow.id,
            direction: "out",
            body: escalationMsg,
            sent_by: "ai",
          });
          await supabase
            .from("whatsapp_conversations")
            .update({ status: "escalated" })
            .eq("id", convRow.id);
          continue;
        }

        // ── 5. Get conversation history for context ──
        const { data: history } = await supabase
          .from("whatsapp_messages")
          .select("direction, body, sent_by")
          .eq("conversation_id", convRow.id)
          .order("timestamp", { ascending: true })
          .limit(20);

        const chatHistory: { role: "user" | "assistant"; content: string }[] =
          (history || [])
            .filter((m) => m.direction !== null)
            .map((m) => ({
              role: m.direction === "in" ? "user" : "assistant",
              content: m.body,
            }));

        // ── 6. Generate AI reply ──
        let aiReply = "";
        try {
          aiReply = await getAIReply(text, chatHistory);
        } catch {
          aiReply = "Désolé, je rencontre un problème technique. Un agent va vous répondre sous peu. [ESCALATE]";
        }

        // ── 7. Check for escalation flag in AI reply ──
        const shouldEscalate = aiReply.includes("[ESCALATE]");
        const cleanReply = aiReply.replace("[ESCALATE]", "").trim();

        await sendWhatsAppMessage(fromPhone, cleanReply);
        await supabase.from("whatsapp_messages").insert({
          conversation_id: convRow.id,
          direction: "out",
          body: cleanReply,
          sent_by: "ai",
        });

        if (shouldEscalate) {
          await supabase
            .from("whatsapp_conversations")
            .update({ status: "escalated" })
            .eq("id", convRow.id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
