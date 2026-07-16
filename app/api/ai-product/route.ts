import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { protectAdminMutation } from "@/lib/api-security";

export const runtime = "nodejs";

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  const ipv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  if (isIP(ipv4) !== 4) return false;
  const [a, b] = ipv4.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

async function safeProductUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2_000) return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
  if (url.hostname === "localhost" || isIP(url.hostname) && isPrivateAddress(url.hostname)) return null;
  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) return null;
  } catch { return null; }
  return url.toString();
}

// Extract product info directly from URL for sites with bot protection (Temu, AliExpress)
function extractFromUrl(url: string): { title: string; images: string[] } {
  try {
    const u = new URL(url);
    const images: string[] = [];

    // Temu: extract top_gallery_url param
    const galleryUrl = u.searchParams.get("top_gallery_url");
    if (galleryUrl) images.push(decodeURIComponent(galleryUrl));

    // Extract title from URL path slug (works for Temu, AliExpress, Amazon)
    const pathParts = u.pathname.split("/").filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || "";
    const title = decodeURIComponent(slug)
      .replace(/[-_]/g, " ")
      .replace(/\.(html|htm)$/i, "")
      .replace(/g-\d+$/, "") // Remove Temu product ID suffix
      .trim()
      .substring(0, 200);

    return { title, images };
  } catch {
    return { title: "", images: [] };
  }
}

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

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "ai:product", limit: 10 });
  if (blocked) return blocked;
  let input: { url?: unknown };
  try { input = await req.json() as { url?: unknown }; } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const url = await safeProductUrl(input.url);
  if (!url) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch the product page
  let html = "";
  let fetchFailed = false;
  try {
    const res = await fetch(url, {
      redirect: "error",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok || !res.headers.get("content-type")?.toLowerCase().includes("text/html")) throw new Error("invalid response");
    const declaredLength = Number(res.headers.get("content-length") || 0);
    if (declaredLength > 2_000_000) throw new Error("response too large");
    html = (await res.text()).slice(0, 2_000_000);
  } catch {
    fetchFailed = true;
  }

  let pageText = extractPageText(html);
  const urlInfo = extractFromUrl(url);
  const htmlImages = html ? extractProductImages(html, url) : [];
  const allImages = [...new Set([...urlInfo.images, ...htmlImages])].slice(0, 8);

  // If page fetch failed or returned empty, use URL-extracted title
  if (fetchFailed || pageText.length < 50) {
    if (!urlInfo.title) {
      return NextResponse.json({ error: "Impossible de charger cette page. Copiez le titre du produit manuellement." }, { status: 422 });
    }
    pageText = `Produit: ${urlInfo.title}`;
  }

  // --- Try OpenAI if key is available ---
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(jsonStr);
      return NextResponse.json({ ...result, images: allImages });
    } catch {
      // OpenAI failed — fall through to basic extraction
    }
  }

  // --- Fallback: return URL-extracted info without AI ---
  // Clean up the title from the URL slug
  const cleanTitle = urlInfo.title
    .replace(/\s+g-\d+$/, "")
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .substring(0, 80);

  return NextResponse.json({
    name: cleanTitle || "",
    description: "",
    brand: "",
    price: "",
    category: "accessoires",
    tags: "",
    colors: "",
    sizes: "",
    images: allImages,
    _noAi: true,
  });
}
