import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM = `You are generating realistic fake customer reviews in French for L'ecomax, a Moroccan e-commerce store selling fashion, tech, and sports products.
Generate a complete review as a JSON object with these fields:
- name: a realistic Moroccan/French customer full name (e.g. "Karim Alaoui", "Sara Benali", "Mohamed Raji")
- title: a short punchy review title (5-8 words)
- text: 2-3 sentences, casual and genuine, not marketing-speak

Match the star rating (5 = very happy, 4 = happy, 3 = okay).
Reply with ONLY valid JSON, no markdown fences, no explanations.
Example: {"name":"Yasmine Tazi","title":"Super rapide et bien emballé","text":"Commande reçue en 2 jours, vraiment impressionnée par la rapidité. Le produit correspond exactement aux photos. Je recommande sans hésiter !"}`;

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "ai:review", limit: 15 });
  if (blocked) return blocked;
  try {
    const input = await req.json() as { rating?: unknown; hint?: unknown };
    const numericRating = Number(input.rating ?? 5);
    const stars = Number.isInteger(numericRating) && numericRating >= 1 && numericRating <= 5 ? numericRating : 5;
    const hint = typeof input.hint === "string" ? input.hint.trim().slice(0, 500) : "";

    const userPrompt = `Generate a ${stars}-star review.${hint ? ` The customer bought: ${hint}.` : ""}`;

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
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: { name?: string; title?: string; text?: string } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { text: raw }; }
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
