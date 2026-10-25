import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { ecomediaGuides } from "@/lib/ecomedia-guides";
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
  { path: "/suppression-compte/", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies/", changeFrequency: "yearly", priority: 0.3 },
];

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


export const revalidate = 300;
export async function GET() {
  const entries: SitemapEntry[] = [...staticPages, ...ecomediaGuides.map(guide => ({ path: '/ecomedia/' + guide.slug + '/', lastModified: guide.updatedAt }))];
  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.map(renderEntry).join('\n') + '</urlset>';
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=300' } });
}
