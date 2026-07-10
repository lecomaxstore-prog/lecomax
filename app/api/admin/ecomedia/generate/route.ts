import { NextResponse } from "next/server";
import OpenAI from "openai";
import { verifySessionToken } from "@/lib/admin-session";
import { NextRequest } from "next/server";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, type, lang = "fr" } = await req.json();
  if (!topic) return NextResponse.json({ error: "topic requis" }, { status: 400 });

  const langInstructions: Record<string, string> = {
    fr: "Réponds en français.",
    ar: "أجب باللغة العربية.",
    en: "Reply in English.",
  };

  const typeHints: Record<string, string> = {
    image: "post image produit",
    video_upload: "post vidéo produit",
    video_url: "post vidéo externe (YouTube/TikTok)",
    text: "post texte/actualité",
    product: "annonce produit avec lien d'achat",
    promotion: "post promotion / offre spéciale / réduction",
  };

  const typeContext = type && typeHints[type] ? `Type de post : ${typeHints[type]}.` : "";

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en marketing digital et community manager pour L'ecomax, une boutique en ligne marocaine vendant chaussures de sport, vêtements, écouteurs Bluetooth, enceintes et accessoires gaming. Livraison 35 MAD au Maroc, paiement à la livraison.

Tu vas créer du contenu pour Ecomedia — la plateforme communautaire de L'ecomax (style Instagram/TikTok).

Règles :
- Ton accrocheur, direct, moderne
- Adapté au public marocain
- Pas de hashtags génériques
- Emojis appropriés mais pas excessifs
- ${langInstructions[lang] || langInstructions.fr}`,
        },
        {
          role: "user",
          content: `${typeContext}
Sujet/Idée : ${topic}

Génère un post Ecomedia complet en JSON avec ce format exact :
{
  "title": "Titre accrocheur court (max 60 chars)",
  "content": "Description engageante (2-4 phrases max, avec emojis)",
  "cta_text": "Texte du bouton d'action (ex: Acheter maintenant, Voir le produit, Découvrir...)",
  "type_suggestion": "image|video_url|text|product|promotion"
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, rien d'autre.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    // Extract JSON even if wrapped in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? "{}");

    return NextResponse.json({
      title: parsed.title ?? "",
      content: parsed.content ?? "",
      cta_text: parsed.cta_text ?? "",
      type_suggestion: parsed.type_suggestion ?? "text",
    });
  } catch (err) {
    console.error("Ecomedia AI error:", err);
    return NextResponse.json({ error: "Erreur IA. Vérifiez votre clé GROQ_API_KEY." }, { status: 500 });
  }
}
