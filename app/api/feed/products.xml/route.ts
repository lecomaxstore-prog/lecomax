import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SITE_URL = "https://lecomax.com";
const SHOP_NAME = "L'ecomax";
const CURRENCY = "MAD";

// Map L'ecomax categories → Google product taxonomy IDs (fr)
const GOOGLE_CATEGORY: Record<string, string> = {
  chaussures: "Vêtements et accessoires > Chaussures",
  homme:      "Vêtements et accessoires > Vêtements",
  femme:      "Vêtements et accessoires > Vêtements",
  accessoires: "Électronique",
};

// Ensure image URL is absolute and uses a crawlable format
function imgUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const url = raw.startsWith("http") ? raw : `${SITE_URL}${raw}`;
  return url;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function price(val: number) {
  return `${val.toFixed(2)} ${CURRENCY}`;
}

export const revalidate = 3600; // regenerate every hour

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error || !products) {
    return new NextResponse("Failed to fetch products", { status: 500 });
  }

  const items = products.map((p) => {
    const link = `${SITE_URL}/produit/${p.slug}/`;
    const mainImg = imgUrl(p.images?.[0]);
    const additionalImgs: string[] = (p.images?.slice(1, 11) ?? [])
      .map(imgUrl)
      .filter(Boolean) as string[];

    // Determine availability
    const totalStock = p.stock ?? 0;
    const colorStockValues = Object.values(p.color_stock ?? {}) as number[];
    const hasStock =
      totalStock > 0 || colorStockValues.some((s) => (s as number) > 0);
    const availability = hasStock ? "in stock" : "out of stock";

    // Colors & sizes
    const colors: string[] = p.colors ?? [];
    const sizes: string[] = p.sizes ?? [];
    const brand = p.brand || SHOP_NAME;

    const googleCategory = GOOGLE_CATEGORY[p.category] ?? "Vêtements et accessoires";

    const title = escapeXml(p.name ?? "");
    const desc = escapeXml(
      (p.description ?? "").slice(0, 5000)
    );

    let xml = `    <item>
      <g:id>${escapeXml(p.slug)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      ${mainImg ? `<g:image_link>${imgUrl(mainImg)}</g:image_link>` : ""}
      ${additionalImgs.map((u) => `<g:additional_image_link>${u}</g:additional_image_link>`).join("\n      ")}
      <g:availability>${availability}</g:availability>
      <g:price>${p.original_price ? price(p.original_price) : price(p.price)}</g:price>
      ${p.original_price ? `<g:sale_price>${price(p.price)}</g:sale_price>` : ""}
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:product_type>${escapeXml(p.category)}</g:product_type>
      ${colors.length > 0 ? `<g:color>${escapeXml(colors[0])}</g:color>` : ""}
      ${sizes.filter((s) => s !== "Taille unique").length > 0
        ? `<g:size>${escapeXml(sizes[0])}</g:size>`
        : ""}
      <g:shipping>
        <g:country>MA</g:country>
        <g:service>Standard</g:service>
        <g:price>35.00 ${CURRENCY}</g:price>
      </g:shipping>
    </item>`;

    return xml;
  });

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${SHOP_NAME} — Boutique en ligne Maroc</title>
    <link>${SITE_URL}</link>
    <description>Chaussures de sport, vêtements tendance, écouteurs sans fil et accessoires gaming. Livraison 35 MAD partout au Maroc.</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
