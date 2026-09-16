import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServerShippingConfig } from "@/lib/shipping-config-server";
import { calculateShipping, formatShippingAmount } from "@/lib/shipping-config";

const SITE_URL = "https://lecomax.com";
const SHOP_NAME = "L'ecomax";
const CURRENCY = "MAD";

// Ensure image URL is absolute and uses a crawlable format
function imgUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, `${SITE_URL}/`);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
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

function normalizedProductText(product: Record<string, unknown>) {
  return [product.name, product.description, product.category, ...(Array.isArray(product.tags) ? product.tags : [])]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// product_type is the merchant's own taxonomy. Google can then assign its
// continuously evolving Google Product Category without an inaccurate override.
function merchantProductType(product: Record<string, unknown>) {
  const text = normalizedProductText(product);
  if (/chausson|basket|chaussure|running|sneaker/.test(text)) return "Mode > Chaussures";
  if (/sac a dos|backpack/.test(text)) return "Bagages et sacs > Sacs à dos";
  if (/valise|bagage/.test(text)) return "Bagages et sacs > Valises";
  if (/sac banane/.test(text)) return "Bagages et sacs > Sacs banane";
  if (/sac bandouliere/.test(text)) return "Bagages et sacs > Sacs bandoulière";
  if (/ecouteur|casque|tws/.test(text)) return "Électronique > Audio > Écouteurs";
  if (/enceinte|haut-parleur/.test(text)) return "Électronique > Audio > Enceintes";
  if (/manette|gamepad|gaming/.test(text)) return "Électronique > Gaming > Manettes";
  return String(product.category || "Catalogue L'ecomax");
}

export const revalidate = 3600; // regenerate every hour

export async function GET() {
  const shippingConfig = await getServerShippingConfig();
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

  const items = products.flatMap((p) => {
    const link = `${SITE_URL}/produit/${p.slug}/`;
    const mainImg = imgUrl(p.images?.[0]);
    const currentPrice = Number(p.price);
    if (!p.id || !p.slug || !p.name || !mainImg || !Number.isFinite(currentPrice) || currentPrice <= 0) {
      return [];
    }
    const additionalImgs: string[] = (p.images?.slice(1, 11) ?? [])
      .map(imgUrl)
      .filter(Boolean) as string[];

    // Determine availability
    const totalStock = p.stock ?? 0;
    const colorStockValues = Object.values(p.color_stock ?? {}) as number[];
    const hasStock =
      totalStock > 0 || colorStockValues.some((s) => (s as number) > 0);
    const availability = hasStock ? "in stock" : "out of stock";

    const brand = p.brand || SHOP_NAME;

    const title = escapeXml(p.name ?? "");
    const desc = escapeXml(
      String(p.description || `${p.name} disponible sur L'ecomax.`).slice(0, 5000)
    );
    const originalPrice = Number(p.original_price);
    const onSale = Number.isFinite(originalPrice) && originalPrice > currentPrice;
    const shippingCost = calculateShipping(currentPrice, shippingConfig);

    const xml = `    <item>
      <g:id>${escapeXml(String(p.id).slice(0, 50))}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(mainImg)}</g:image_link>
      ${additionalImgs.map((u) => `<g:additional_image_link>${escapeXml(u)}</g:additional_image_link>`).join("\n      ")}
      <g:availability>${availability}</g:availability>
      <g:price>${onSale ? price(originalPrice) : price(currentPrice)}</g:price>
      ${onSale ? `<g:sale_price>${price(currentPrice)}</g:sale_price>` : ""}
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>false</g:identifier_exists>
      <g:product_type>${escapeXml(merchantProductType(p))}</g:product_type>
      <g:shipping>
        <g:country>MA</g:country>
        <g:service>Standard</g:service>
        <g:price>${shippingCost.toFixed(2)} ${CURRENCY}</g:price>
      </g:shipping>
    </item>`;

    return [xml];
  });

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${SHOP_NAME} — Boutique en ligne Maroc</title>
    <link>${SITE_URL}</link>
    <description>Chaussures de sport, vêtements tendance, écouteurs sans fil et accessoires gaming. Livraison ${formatShippingAmount(shippingConfig.cost)} MAD partout au Maroc.</description>
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
