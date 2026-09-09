import { NextRequest, NextResponse } from "next/server";
import { getStoreAssistantContext } from "@/lib/store-assistant-context";

import { protectAdminMutation } from "@/lib/api-security";
import { getGroqClient } from "@/lib/groq-client";

// Groq — free tier, no billing required. Models: llama-3.3-70b-versatile, llama-3.1-8b-instant
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "ai:reply", limit: 20 });
  if (blocked) return blocked;
  try {
    const businessContext = await getStoreAssistantContext();
    const body = await req.json() as Record<string, unknown>;
    const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 5_000) : "";
    const from = typeof body.from === "string" ? body.from.trim().slice(0, 160) : "";
    if (message.length < 2) return NextResponse.json({ error: "Message requis" }, { status: 400 });

    const completion = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a customer support agent for L'ecomax, a Moroccan online store selling sports shoes, clothing, earphones, bluetooth speakers, and gaming accessories. ${businessContext}

CRITICAL LANGUAGE RULE — You MUST detect the language of the customer's message and reply in EXACTLY that same language:
- Customer writes in English → you reply in English
- Customer writes in French → you reply in French
- Customer writes in Arabic → you reply in Arabic (العربية)
- Customer writes in Moroccan Darija → you reply in Darija
- Any other language → reply in that language
NEVER reply in a different language than the customer used. This is mandatory.

Writing rules:
- Address the customer's concern directly with a helpful, concrete solution
- Professional but warm tone, not overly formal
- Maximum 150 words
- Do NOT start with "Dear [name]" — start directly with the reply
- Sign off with "L'équipe L'ecomax"`,
        },
        {
          role: "user",
          content: `From: ${from || "customer"}
Subject: ${subject || "(no subject)"}
Message: ${message}

[REMINDER: Detect the language of the message above and reply in that SAME language only]`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI reply error:", err);
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}

