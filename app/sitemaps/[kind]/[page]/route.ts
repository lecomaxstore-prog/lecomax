import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { sitemapDb, sitemapTables, SITEMAP_PAGE_SIZE, xmlEscape, type SitemapKind } from "@/lib/sitemap-data";

export const revalidate = 300;
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string; page: string }> }) {
  const { kind, page } = await params;
  if (!Object.hasOwn(sitemapTables, kind) || !/^(0|[1-9]\d{0,5})$/.test(page)) return new NextResponse("Not found", { status: 404 });
  try {
    const config = sitemapTables[kind as SitemapKind];
    const offset = Number(page) * SITEMAP_PAGE_SIZE;
    const db = sitemapDb();
    const query = (columns: string) => db.from(config.table).select(columns).eq(config.active, true).order("id").range(offset, offset + SITEMAP_PAGE_SIZE - 1);
    let result = await query("slug,updated_at");
    // Legacy category schemas have created_at only. Do not invent modification
    // dates or turn a missing optional column into a broken sitemap.
    if (result.error?.code === "42703" && result.error.message.includes("updated_at")) {
      result = await query("slug");
    }
    const { data, error } = result;
    if (error || !data) throw new Error("CATALOGUE_UNAVAILABLE");
    if (!data.length && offset > 0) return new NextResponse("Not found", { status: 404 });
    const entries = (data as unknown as { slug: string; updated_at?: string }[]).filter(row => row.slug).map(row => {
      const date = row.updated_at ? new Date(row.updated_at) : null;
      const lastmod = date && Number.isFinite(date.getTime()) ? `<lastmod>${date.toISOString()}</lastmod>` : "";
      return `<url><loc>${xmlEscape(`${SITE_URL}${config.prefix}${encodeURIComponent(row.slug)}/`)}</loc>${lastmod}</url>`;
    });
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" } });
  } catch {
    return new NextResponse("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
  }
}
