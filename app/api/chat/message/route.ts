import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const ESCALATION_PATTERNS = [
  /\b(agent|human|person|personne|quelqu[''']un|vrai|réel|live|real)\b/i,
  /\b(agent humain|live agent|parler à quelqu|talk to (a |an )?(human|person|agent))\b/i,
  /\b(مساعدة بشرية|تحدث مع شخص|وكيل|إنسان)\b/i,
  /\b(واحد حقيقي|شخص حقيقي|خدمة بشرية)\b/i,
  /\b(parler à un (humain|agent|conseiller|vendeur))\b/i,
  /\b(quelqu.*humain|un vrai agent)\b/i,
];

function wantsHuman(text: string): boolean {
  return ESCALATION_PATTERNS.some((p) => p.test(text));
}

const SYSTEM_PROMPT = `You are Eco, the friendly AI assistant for L'ecomax — a Moroccan online store (lecomax.com) selling fashion, sports shoes, clothing, earphones, Bluetooth speakers, and gaming accessories.

Store info:
- Delivery: 35 MAD anywhere in Morocco, cash on delivery (COD)
- Free returns within 30 days
- Email: contact@lecomax.com
- Working hours: 9h–20h

LANGUAGE RULE: Detect the customer's language and ALWAYS reply in that exact language (French / English / Arabic / Darija).

ESCALATION RULE: ONLY add "[ESCALATE]" at the very end if the customer EXPLICITLY asks to speak with a human agent. Do NOT add [ESCALATE] for product questions, order questions, or anything you can answer yourself.

Style: Warm, helpful, concise (under 100 words). No long paragraphs. Answer confidently.`;

/** POST /api/chat/message — visitor sends a message */
export async function POST(req: Request) {
  const { session_id, body } = await req.json();
  if (!session_id || !body?.trim()) {
    return NextResponse.json({ error: "session_id and body required" }, { status: 400 });
  }

  // Load session
  const { data: session, error: sessErr } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", session_id)
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Store visitor message
  await supabase.from("chat_messages").insert({
    session_id,
    direction: "in",
    body: body.trim(),
    sent_by: "visitor",
  });

  // Update last_message on session
  await supabase.from("chat_sessions").update({
    last_message: body.trim(),
    last_at: new Date().toISOString(),
    unread_count: session.unread_count + 1,
  }).eq("id", session_id);

  // If already escalated to agent — just store, admin will reply
  if (session.status === "escalated") {
    return NextResponse.json({ status: "escalated", reply: null });
  }

  // Check if user wants human before calling AI
  if (wantsHuman(body)) {
    await supabase.from("chat_sessions").update({ status: "escalated" }).eq("id", session_id);
    const escalationMsg = detectEscalationResponse(body);
    await supabase.from("chat_messages").insert({
      session_id,
      direction: "out",
      body: escalationMsg,
      sent_by: "ai",
    });
    return NextResponse.json({ status: "escalated", reply: escalationMsg });
  }

  // Get conversation history for context
  const { data: history } = await supabase
    .from("chat_messages")
    .select("direction, body, sent_by")
    .eq("session_id", session_id)
    .order("timestamp", { ascending: true })
    .limit(20);

  const chatHistory: OpenAI.ChatCompletionMessageParam[] = (history || [])
    .filter((m) => m.sent_by !== "agent")
    .slice(-12)
    .map((m) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.body,
    }));

  // Call Groq AI
  let aiReply = "";
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: "user", content: body.trim() },
      ],
      temperature: 0.65,
      max_tokens: 220,
    });
    aiReply = completion.choices[0]?.message?.content?.trim() || "";
  } catch {
    aiReply = "Je rencontre un problème technique. Un agent va vous aider. [ESCALATE]";
  }

  // Check if AI decided to escalate
  const shouldEscalate = aiReply.includes("[ESCALATE]");
  const cleanReply = aiReply.replace("[ESCALATE]", "").trim();

  // Store AI reply
  await supabase.from("chat_messages").insert({
    session_id,
    direction: "out",
    body: cleanReply,
    sent_by: "ai",
  });

  if (shouldEscalate) {
    await supabase.from("chat_sessions").update({ status: "escalated" }).eq("id", session_id);
  }

  await supabase.from("chat_sessions").update({
    last_message: cleanReply,
    last_at: new Date().toISOString(),
  }).eq("id", session_id);

  return NextResponse.json({
    status: shouldEscalate ? "escalated" : "ai",
    reply: cleanReply,
  });
}

function detectEscalationResponse(text: string): string {
  const lower = text.toLowerCase();
  if (/arabic|عربي|عربية/.test(lower) || /[\u0600-\u06FF]/.test(text)) {
    return "سأقوم بتحويلك الآن إلى أحد وكلائنا البشريين. يرجى الانتظار قليلاً، سيرد عليك قريباً.";
  }
  if (/english|anglais/.test(lower)) {
    return "I'm connecting you to a live agent now. Please wait a moment — someone will be with you shortly.";
  }
  return "Je vous connecte maintenant à un agent. Veuillez patienter un instant, quelqu'un vous répondra bientôt.";
}
