import { NextResponse } from "next/server";
import OpenAI from "openai";

// Extract useful text from a product page HTML
function extractPageText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
  return text.slice(0, 6000);
}

// Extract product images from HTML — handles AliExpress, Temu, Amazon, etc.
function extractProductImages(html: string, baseUrl: string): string[] {
  const imgs: Set<string> = new Set();
  const origin = new URL(baseUrl).origin;

  // 1. JSON-LD structured data (best quality)
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const images = item.image ?? item.images ?? [];
        const imgList = Array.isArray(images) ? images : [images];
        for (const img of imgList) {
          const src = typeof img === "string" ? img : img?.url ?? img?.contentUrl;
          if (src && src.startsWith("http")) imgs.add(src);
        }
      }
    } catch {}
  }

  // 2. Open Graph / Twitter meta images
  const ogMatches = html.matchAll(/<meta[^>]*(?:property=["']og:image["']|name=["']twitter:image["'])[^>]*content=["']([^"']+)["'][^>]*>/gi);
  for (const m of ogMatches) {
    if (m[1].startsWith("http")) imgs.add(m[1]);
  }
  const ogMatches2 = html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property=["']og:image["']|name=["']twitter:image["'])[^>]*>/gi);
  for (const m of ogMatches2) {
    if (m[1].startsWith("http")) imgs.add(m[1]);
  }

  // 3. AliExpress-specific: "imageModule" in inline JSON
  const aliMatch = html.match(/"imageModule"\s*:\s*\{[^}]*"imagePathList"\s*:\s*(\[[^\]]+\])/);
  if (aliMatch) {
    try {
      const list = JSON.parse(aliMatch[1]) as string[];
      list.forEach(u => { if (u.startsWith("http")) imgs.add(u); });
    } catch {}
  }

  // 4. Temu-specific: "img_url" in inline JSON
  const temuMatches = html.matchAll(/"img_url"\s*:\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi);
  for (const m of temuMatches) imgs.add(m[1]);

  // 5. Large <img> tags — filter out icons/logos (must be > 200px or no size attr)
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const m of imgMatches) {
    let src = m[1];
    if (!src.startsWith("http") && src.startsWith("/")) src = `${origin}${src}`;
    if (!src.startsWith("http")) continue;
    // Skip obvious non-product images
    if (/logo|icon|avatar|banner|badge|sprite|pixel|tracking|1x1|gif$/i.test(src)) continue;
    // Prefer larger images
    const widthMatch = m[0].match(/width=["']?(\d+)/);
    const w = widthMatch ? parseInt(widthMatch[1]) : 300;
    if (w >= 200) imgs.add(src);
  }

  // Return max 8 unique images
  return [...imgs].slice(0, 8);
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured. Add OPENAI_API_KEY to your environment variables." }, { status: 503 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { url } = await req.json();
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch the product page
  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Impossible de charger cette page. Vérifiez l'URL ou copiez manuellement le texte du produit." }, { status: 422 });
  }

  const pageText = extractPageText(html);
  if (!pageText || pageText.length < 50) {
    return NextResponse.json({ error: "Page vide ou inaccessible." }, { status: 422 });
  }

  // Extract images from HTML
  const images = extractProductImages(html, url);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en e-commerce spécialisé dans la création de fiches produits en français pour une boutique marocaine de sport, tech et mode (L'ecomax). 
Analyse le texte d'une page produit et génère une fiche produit structurée en JSON.
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans explication.`,
        },
        {
          role: "user",
          content: `Voici le texte extrait d'une page produit : 

${pageText}

Génère une fiche produit en JSON avec exactement ces champs :
{
  "name": "Nom du produit court et accrocheur en français (max 60 caractères)",
  "description": "Description commerciale en français, 2-4 phrases, mettant en avant les avantages pour le client marocain. Ton professionnel et vendeur.",
  "brand": "Marque du produit (ou vide si inconnue)",
  "price": "Prix suggéré en MAD (nombre entier, estimer si nécessaire basé sur le prix original)",
  "category": "une valeur parmi: homme, femme, chaussures, accessoires",
  "tags": "mots-clés séparés par virgules (max 5 tags pertinents)",
  "colors": "couleurs disponibles séparées par virgules (ex: Noir, Blanc, Rouge)",
  "sizes": "tailles disponibles séparées par virgules si applicable (ex: S, M, L, XL ou 38, 39, 40)"
}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    // Clean potential markdown fences
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(jsonStr);

    // Merge extracted images into the result
    return NextResponse.json({ ...result, images });
  } catch (err) {
    return NextResponse.json({ error: "Erreur IA. Vérifiez votre clé OpenAI." }, { status: 500 });
  }
}
