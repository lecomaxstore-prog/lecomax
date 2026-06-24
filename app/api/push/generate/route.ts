import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// POST /api/push/generate — AI-generate notification content
export async function POST(req: NextRequest) {
  let body: { prompt?: string; type?: string; lang?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type ?? "promo";
  const context = body.prompt?.trim() ?? "";
  const lang = body.lang ?? "fr";

  const systemPrompt = `Tu es un expert en marketing e-commerce pour L'ecomax, une boutique en ligne marocaine qui vend des chaussures, vêtements, accessoires tech (écouteurs TWS, enceintes bluetooth, accessoires gaming) et articles de sport.

Tu génères des notifications push mobiles courtes, percutantes et efficaces en ${lang === "ar" ? "arabe darija marocain (translittéré en lettres latines ou en arabe)" : "français"}.

Règles :
- Titre : max 55 caractères, accrocheur, avec un emoji si pertinent
- Message : max 120 caractères, bénéfice clair + urgence
- URL : chemin relatif du site (ex: /boutique, /promotions, /nouveautes, /ecoclub)
- Ton : décontracté mais professionnel, adapté au public marocain jeune
- Ne jamais mentir, rester crédible`;

  const userPrompt = `Génère une notification push de type "${type}"${context ? ` avec ce contexte : "${context}"` : ""}.

Réponds UNIQUEMENT avec un objet JSON (sans markdown, sans backticks) dans ce format exact :
{
  "title": "...",
  "body": "...",
  "url": "...",
  "icon": "/favicon.png"
}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error: ${res.status} — ${err.substring(0, 200)}`);
    }

    const completion = await res.json();
    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";

    // Extract JSON from response (handles edge cases like trailing text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);
    if (!result.title || !result.body) throw new Error("Missing fields in response");

    return NextResponse.json({
      title: String(result.title).substring(0, 60),
      body: String(result.body).substring(0, 200),
      url: String(result.url ?? "/"),
      icon: String(result.icon ?? "/favicon.png"),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI error" },
      { status: 500 }
    );
  }
}
