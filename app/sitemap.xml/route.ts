import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { sitemapDb, sitemapTables, SITEMAP_PAGE_SIZE, xmlEscape } from "@/lib/sitemap-data";

export const revalidate = 300;
export const dynamic = "force-static";

export async function GET() {
  try {
    const db = sitemapDb();
    const sections = await Promise.all(Object.entries(sitemapTables).map(async ([kind, config]) => {
      const { count, error } = await db.from(config.table).select("id", { count: "exact", head: true }).eq(config.active, true);
      if (error || count === null) throw new Error("CATALOGUE_UNAVAILABLE");
      return Array.from({ length: Math.ceil(count / SITEMAP_PAGE_SIZE) }, (_, page) => SITE_URL + '/sitemaps/' + kind + '/' + page + '/');
    }));
    const urls = [SITE_URL + '/sitemaps/static/', ...sections.flat()];
    const xml = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(url => '<sitemap><loc>' + xmlEscape(url) + '</loc></sitemap>').join('') + '</sitemapindex>';
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" } });
  } catch {
    // Never publish a successful but incomplete sitemap or revive deleted seed products.
    return new NextResponse("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
  }
}
