import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { products } from "@/lib/products";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type SitemapEntry = {
  path: string;
  lastModified?: string | null;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

const staticPages: SitemapEntry[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/boutique/", changeFrequency: "daily", priority: 0.9 },
  { path: "/nouveautes/", changeFrequency: "weekly", priority: 0.8 },
  { path: "/bestsellers/", changeFrequency: "weekly", priority: 0.8 },
  { path: "/promotions/", changeFrequency: "daily", priority: 0.8 },
  { path: "/ecomedia/", changeFrequency: "daily", priority: 0.7 },
  { path: "/guide-des-tailles/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/a-propos/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/aide/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/nous-contacter/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/retours/", changeFrequency: "monthly", priority: 0.5 },
  { path: "/ecoclub/", changeFrequency: "monthly", priority: 0.5 },
  { path: "/carrieres/", changeFrequency: "monthly", priority: 0.4 },
  { path: "/boutiques/", changeFrequency: "monthly", priority: 0.4 },
  { path: "/conditions/", changeFrequency: "yearly", priority: 0.3 },
  { path: "/conditions-utilisation/", changeFrequency: "yearly", priority: 0.3 },
  { path: "/politique-confidentialite/", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies/", changeFrequency: "yearly", priority: 0.3 },
];

const fallbackCategorySlugs = ["homme", "femme", "chaussures", "accessoires"];

function xmlEscape(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[character]!);
}

function validLastModified(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function renderEntry(entry: SitemapEntry): string {
  const lastModified = validLastModified(entry.lastModified);
  return [
    "  <url>",
    `    <loc>${xmlEscape(new URL(entry.path, `${SITE_URL}/`).toString())}</loc>`,
    ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
    ...(entry.changeFrequency ? [`    <changefreq>${entry.changeFrequency}</changefreq>`] : []),
    ...(typeof entry.priority === "number" ? [`    <priority>${entry.priority.toFixed(1)}</priority>`] : []),
    "  </url>",
  ].join("\n");
}

export const revalidate = 3600;

export async function GET() {
  const entries = new Map<string, SitemapEntry>();
  const add = (entry: SitemapEntry) => entries.set(entry.path, entry);
  staticPages.forEach(add);
  fallbackCategorySlugs.forEach((slug) => add({ path: `/${slug}/`, changeFrequency: "weekly", priority: 0.8 }));
  products.forEach((product) => add({
    path: `/produit/${encodeURIComponent(product.slug)}/`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  try {
    const supabase = createServerSupabaseClient();
    const [productsResult, postsResult, pagesResult, categoriesResult] = await Promise.all([
      supabase.from("products").select("slug,updated_at").eq("active", true).order("updated_at", { ascending: false }).limit(5000),
      supabase.from("ecomedia_posts").select("slug,created_at,updated_at").eq("is_published", true).order("created_at", { ascending: false }).limit(1000),
      supabase.from("pages").select("slug,updated_at").eq("active", true).limit(1000),
      supabase.from("categories").select("slug,updated_at").eq("active", true).limit(1000),
    ]);

    for (const product of productsResult.data ?? []) {
      if (product.slug) add({ path: `/produit/${encodeURIComponent(product.slug)}/`, lastModified: product.updated_at, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const post of postsResult.data ?? []) {
      if (post.slug) add({ path: `/ecomedia/${encodeURIComponent(post.slug)}/`, lastModified: post.updated_at ?? post.created_at, changeFrequency: "weekly", priority: 0.6 });
    }
    for (const page of pagesResult.data ?? []) {
      if (page.slug) add({ path: `/${encodeURIComponent(page.slug)}/`, lastModified: page.updated_at, changeFrequency: "monthly", priority: 0.5 });
    }
    for (const category of categoriesResult.data ?? []) {
      if (category.slug) add({ path: `/${encodeURIComponent(category.slug)}/`, lastModified: category.updated_at, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {
    // Keep the static catalogue discoverable if the content service is unavailable.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...entries.values()].map(renderEntry).join("\n")}\n</urlset>`;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
