import { getProductShareData } from "@/lib/product-share";
import { getProductOgPng } from "@/lib/product-og-cache";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 300;

// Render new slugs on demand; don't rasterize the catalogue on every build.
export function generateStaticParams() { return []; }

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductShareData(slug);
  if (!product) return new Response("Produit introuvable", { status: 404 });
  const png = await getProductOgPng(product);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
