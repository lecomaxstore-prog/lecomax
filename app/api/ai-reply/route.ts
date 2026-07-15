import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerShippingConfig } from "@/lib/shipping-config-server";
import { shippingSummary } from "@/lib/shipping-config";

// Groq — free tier, no billing required. Models: llama-3.3-70b-versatile, llama-3.1-8b-instant
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const shippingConfig = await getServerShippingConfig();
    const { subject, message, from } = await req.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a customer support agent for L'ecomax, a Moroccan online store selling sports shoes, clothing, earphones, bluetooth speakers, and gaming accessories. ${shippingSummary(shippingConfig)} Estimated delivery: ${shippingConfig.estimatedDays}. Cash on delivery and free returns within 30 days. WhatsApp: +212699289568. Email: contact@lecomax.com.

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

