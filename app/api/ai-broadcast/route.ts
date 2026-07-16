import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM = `You are a WhatsApp marketing copywriter for L'ecomax, a Moroccan e-commerce store selling fashion, tech, and sports products.
Write short, punchy WhatsApp marketing messages in French.
Rules:
- Keep it under 3 sentences for the main body
- Use 1-2 relevant emojis max
- Sound human and warm, not spammy
- Never include a URL or phone number (the template wraps the message)
- Reply with ONLY the message body text, no quotes, no explanations`;

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "ai:broadcast", limit: 15 });
  if (blocked) return blocked;
  try {
    const input = await req.json() as { subject?: unknown; template?: unknown };
    const subject = typeof input.subject === "string" ? input.subject.trim().slice(0, 500) : "";
    const template = typeof input.template === "string" ? input.template : "general";

    if (!subject?.trim()) {
      return NextResponse.json({ error: "subject required" }, { status: 400 });
    }

    const safeTemplate = ["promo", "newproduct", "general"].includes(template) ? template : "general";
    const userPrompt = safeTemplate === "promo"
      ? `Write a WhatsApp promotion message body about: "${subject}". Mention the deal/discount clearly.`
      : safeTemplate === "newproduct"
      ? `Write a WhatsApp new product announcement body about: "${subject}". Create excitement about the product.`
      : `Write a WhatsApp message body about: "${subject}".`;

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const message = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
