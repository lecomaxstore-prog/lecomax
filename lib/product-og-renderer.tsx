import { ImageResponse } from "next/og";
import type { ProductShareData } from "./product-share";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { unstable_cache } from "next/cache";



const formatPrice = (price: number) => `${Number.isInteger(price) ? price : price.toFixed(2)} MAD`;

// Price/stock changes require a new PNG, but not another source-image conversion.
// Keep the same crop, encoding and pixels as the original renderer.
const resizedProductImage = unstable_cache(async (image: string, fallbackUrl: string) => {
    let source: Buffer;
    if (image.startsWith("/")) {
      const publicDirectory = path.resolve(process.cwd(), "public");
      const pathname = decodeURIComponent(new URL(image, "https://lecomax.com").pathname);
      const localPath = path.resolve(publicDirectory, `.${pathname}`);
      if (!localPath.startsWith(`${publicDirectory}${path.sep}`)) throw new Error("Invalid product image path");
      source = await readFile(localPath);
    } else {
      const response = await fetch(fallbackUrl, { next: { revalidate: 3600 } });
      if (!response.ok) throw new Error("Unable to fetch product image");
      source = Buffer.from(await response.arrayBuffer());
    }

    const jpeg = await sharp(source)
      .rotate()
      .resize(620, 620, { fit: "cover", position: "centre" })
      .jpeg({ quality: 86, progressive: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}, ["product-og-photo-v1"], { revalidate: 3600 });

async function socialSafeProductImage(image: string, fallbackUrl: string) {
  try {
    return await resizedProductImage(image, fallbackUrl);
  } catch {
    return fallbackUrl;
  }
}

export async function renderProductOgImage(product: ProductShareData) {
  const available = product.stock !== 0;
  const productPhoto = await socialSafeProductImage(product.image, product.imageUrl);
  const displayName = product.name.length > 88 ? `${product.name.slice(0, 85).trim()}…` : product.name;
  const titleFontSize = displayName.length > 72 ? 36 : displayName.length > 54 ? 41 : 46;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#f6f8f6",
          color: "#090b09",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", width: 12, background: "#3ecf4c" }} />
        <div style={{ position: "absolute", left: -120, bottom: -190, display: "flex", width: 500, height: 500, borderRadius: 250, background: "rgba(62,207,76,.10)" }} />

        <div style={{ display: "flex", flexDirection: "column", width: "56%", padding: "48px 42px 42px 58px" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 31, fontWeight: 900, letterSpacing: -1.5 }}>
            <span>L&apos;eco</span>
            <span style={{ display: "flex", marginLeft: 8, color: "#3ecf4c" }}>max</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 38, color: "#16952d", fontSize: 15, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }}>
            <span style={{ display: "flex", width: 34, height: 3, marginRight: 12, background: "#3ecf4c" }} />
            {product.category}
          </div>

          <div style={{ display: "flex", marginTop: 18, maxWidth: 600, fontSize: titleFontSize, lineHeight: 1.02, fontWeight: 900, letterSpacing: -1.8 }}>
            {displayName}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 28 }}>
            <span style={{ display: "flex", color: product.discount ? "#dc2626" : "#090b09", fontSize: 52, fontWeight: 900, letterSpacing: -2 }}>
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price ? (
              <span style={{ display: "flex", marginLeft: 18, color: "#929792", fontSize: 24, textDecoration: "line-through" }}>
                {formatPrice(product.oldPrice)}
              </span>
            ) : null}
            {product.discount ? (
              <span style={{ display: "flex", marginLeft: 15, padding: "8px 11px", borderRadius: 8, background: "#dc2626", color: "white", fontSize: 18, fontWeight: 900 }}>
                -{product.discount}%
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
            <span style={{ display: "flex", alignItems: "center", padding: "11px 15px", borderRadius: 999, background: available ? "#e8faec" : "#fff0f0", color: available ? "#16782a" : "#c92b2b", fontSize: 14, fontWeight: 800 }}>
              <span style={{ display: "flex", width: 8, height: 8, marginRight: 8, borderRadius: 4, background: available ? "#3ecf4c" : "#ef4444" }} />
              {available ? "En stock" : "Rupture de stock"}
            </span>
            <span style={{ display: "flex", alignItems: "center", padding: "11px 15px", borderRadius: 999, border: "1px solid #dce2dc", background: "white", color: "#4d554e", fontSize: 14, fontWeight: 700 }}>
              Livraison partout au Maroc
            </span>
            <span style={{ display: "flex", alignItems: "center", padding: "11px 15px", borderRadius: 999, border: "1px solid #dce2dc", background: "white", color: "#4d554e", fontSize: 14, fontWeight: 700 }}>
              Paiement à la livraison
            </span>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "44%", height: "100%", padding: 34, background: "linear-gradient(145deg,#eafbed,#ffffff 68%)" }}>
          <div style={{ position: "absolute", right: 32, top: 30, display: "flex", padding: "10px 15px", borderRadius: 999, background: "rgba(8,12,9,.88)", color: "white", fontSize: 14, fontWeight: 800, letterSpacing: 1.5 }}>
            LECOMAX.COM
          </div>
          <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", borderRadius: 28, border: "1px solid rgba(18,80,31,.10)", background: "white", boxShadow: "0 28px 60px rgba(18,55,27,.16)" }}>
            <img
              src={productPhoto}
              alt={product.name}
              width="500"
              height="560"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
