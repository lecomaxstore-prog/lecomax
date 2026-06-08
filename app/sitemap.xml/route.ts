import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SITE_URL = "https://lecomax.com";

const categorySlugs = ["homme", "femme", "chaussures", "accessoires"];

const staticPages = [
  { path: "", priority: 1.0, changeFreq: "daily" },
  { path: "/boutique", priority: 0.9, changeFreq: "daily" },
  { path: "/nouveautes", priority: 0.8, changeFreq: "weekly" },
  { path: "/bestsellers", priority: 0.8, changeFreq: "weekly" },
  { path: "/promotions", priority: 0.8, changeFreq: "daily" },
  { path: "/guide-des-tailles", priority: 0.5, changeFreq: "monthly" },
  { path: "/a-propos", priority: 0.5, changeFreq: "monthly" },
  { path: "/aide", priority: 0.5, changeFreq: "monthly" },
  { path: "/suivre-commande", priority: 0.5, changeFreq: "monthly" },
  { path: "/retours", priority: 0.4, changeFreq: "monthly" },
  { path: "/conditions", priority: 0.3, changeFreq: "yearly" },
  { path: "/confidentialite", priority: 0.3, changeFreq: "yearly" },
  { path: "/cookies", priority: 0.3, changeFreq: "yearly" },
];

export const revalidate = 3600; // revalidate every hour

export async function GET() {
  const now = new Date().toISOString();

  const entries: string[] = [];

  // Static pages
  for (const p of staticPages) {
    entries.push(`  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changeFreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
  }

  // Category pages
  for (const slug of categorySlugs) {
    entries.push(`  <url>
    <loc>${SITE_URL}/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // Product pages from Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (data) {
      for (const p of data) {
        if (p.slug) {
          entries.push(`  <url>
    <loc>${SITE_URL}/produit/${p.slug}</loc>
    <lastmod>${p.updated_at ?? now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
      }
    }
  } catch {
    // Non-fatal — sitemap still works without product URLs
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
