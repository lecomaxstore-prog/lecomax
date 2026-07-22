import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "ai:newsletter", limit: 15 });
  if (blocked) return blocked;
  const input = await req.json().catch(() => null) as { goal?: unknown; productNames?: unknown; tone?: unknown } | null;
  const goal = typeof input?.goal === "string" ? input.goal.trim().slice(0, 600) : "";
  const productNames = Array.isArray(input?.productNames) ? input.productNames.map(String).slice(0, 12) : [];
  const tone = ["premium", "friendly", "urgent"].includes(String(input?.tone)) ? String(input?.tone) : "premium";
  if (!goal) return NextResponse.json({ error: "Décrivez l'objectif de la campagne." }, { status: 400 });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Tu es le directeur CRM de L'ecomax, boutique marocaine mode, sport et tech. Rédige en français naturel, professionnel, crédible, sans fausses promesses et avec au maximum un emoji. Retourne uniquement un JSON avec subject, preheader, eyebrow, heading, body, ctaLabel, sectionTitle." },
        { role: "user", content: `Objectif: ${goal}\nTon: ${tone}\nProduits sélectionnés: ${productNames.join(", ") || "aucun"}. Le sujet doit faire moins de 60 caractères, le preheader moins de 100, le body 2 à 4 phrases et le CTA moins de 30 caractères.` },
      ],
    }),
  });
  if (!response.ok) return NextResponse.json({ error: "L'assistant IA est temporairement indisponible." }, { status: 502 });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  try {
    const generated = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return NextResponse.json(generated);
  } catch { return NextResponse.json({ error: "Réponse IA invalide." }, { status: 502 }); }
}
