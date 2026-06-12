import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM = `You are a satisfied customer writing a product review in French for L'ecomax, a Moroccan e-commerce store selling fashion, tech, and sports products.
Write a short, natural, authentic-sounding customer review.
Rules:
- 2-3 sentences maximum
- Casual and genuine tone, not marketing-speak
- Match the star rating (5 = very happy, 4 = happy, 3 = okay, etc.)
- Mention the product/order experience naturally
- Reply with ONLY the review text, no quotes, no labels, no explanations`;

export async function POST(req: NextRequest) {
  try {
    const { name, rating, hint } = await req.json() as { name?: string; rating: number; hint?: string };

    const userPrompt = `Write a ${rating}-star review from a customer${name?.trim() ? ` named "${name.trim().split(" ")[0]}"` : ""}.${hint ? ` Context: ${hint}` : ""}`;

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
        max_tokens: 120,
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
