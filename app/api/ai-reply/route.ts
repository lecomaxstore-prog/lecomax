import { NextResponse } from "next/server";
import OpenAI from "openai";

// Groq — free tier, no billing required. Models: llama-3.3-70b-versatile, llama-3.1-8b-instant
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const { subject, message, from } = await req.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu es l'agent du service client de L'ecomax, une boutique en ligne marocaine qui vend des chaussures de sport, vêtements, écouteurs, enceintes bluetooth et accessoires gaming. Livraison 35 MAD partout au Maroc, paiement à la livraison, retours gratuits sous 30 jours. WhatsApp: +212699289568. Email: contact@lecomax.com.

Rédige une réponse professionnelle, chaleureuse et concise en français (ou dans la langue du message si ce n'est pas le français). 
- Réponds directement au point soulevé
- Sois utile et propose une solution concrète
- Ton de voix: professionnel mais chaleureux, pas trop formel
- Maximum 150 mots
- Ne mets pas de salutation type "Cher(e) [nom]" car l'expéditeur remplira ça
- Commence directement par la réponse
- Signe avec "L'équipe L'ecomax"`,
        },
        {
          role: "user",
          content: `De: ${from || "client"}
Sujet: ${subject || "(pas de sujet)"}
Message: ${message}`,
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

