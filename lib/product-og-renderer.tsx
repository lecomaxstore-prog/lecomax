import { ImageResponse } from "next/og";
import type { ProductShareData } from "./product-share";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { unstable_cache } from "next/cache";
import { productShareCopy } from "./product-share-copy";



const formatPrice = (price: number) => `${Number.isInteger(price) ? price : price.toFixed(2)} MAD`;

// Price/stock changes require a new PNG, but not another source-image conversion.
// Contain the photograph so shoes and sleeves are never cropped.
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
      .resize(640, 640, { fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 86, progressive: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}, ["product-og-photo-v2"], { revalidate: 3600 });

async function socialSafeProductImage(image: string, fallbackUrl: string) {
  try {
    return await resizedProductImage(image, fallbackUrl);
  } catch {
    return fallbackUrl;
  }
}

export async function renderProductOgImage(product: ProductShareData) {
  const photo = await socialSafeProductImage(product.image, product.imageUrl);
  const { name } = productShareCopy(product);
  const available = typeof product.stock === "number" && product.stock > 0;
  const availability = available ? "Disponible" : product.preorderEnabled ? "En précommande" : product.stock === 0 ? "Actuellement épuisé" : "À découvrir en ligne";
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#F4F1E9", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 570, height: 630, padding: "46px 48px", background: "#123C32", color: "#FFFFFF" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 3 }}>L’ECOMAX<span style={{ color: "#D7C49A", marginLeft: 8 }}>.</span></div>
        <div style={{ display: "flex", marginTop: 46, color: "#D7C49A", fontSize: 17, letterSpacing: 3, textTransform: "uppercase" }}>{product.category}</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: name.length > 52 ? 39 : 48, lineHeight: 1.12, fontWeight: 700, letterSpacing: -1 }}>{name}</div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 26, gap: 18 }}>
          <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>{formatPrice(product.price)}</span>
          {product.oldPrice && product.oldPrice > product.price ? <span style={{ fontSize: 22, color: "#C0CDC5", textDecoration: "line-through" }}>{formatPrice(product.oldPrice)}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: "auto", fontSize: 17, color: "#DAE4DC" }}>
          <span style={{ display: "flex", width: 7, height: 7, borderRadius: 4, background: "#D7C49A", marginRight: 10 }} />{availability}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 20, borderTop: "1px solid #48665B", fontSize: 22, fontWeight: 700 }}>Découvrir la pièce <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D7C49A" strokeWidth="1.5"><path d="M4 12h16M14 6l6 6-6 6" /></svg></div>
      </div>
      <div style={{ display: "flex", position: "relative", flexDirection: "column", width: 630, padding: "28px 28px 20px" }}>
        <div style={{ display: "flex", position: "relative", width: 574, height: 530, background: "#FFFFFF", borderRadius: 24, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
          <img src={photo} alt={product.name} width={540} height={510} style={{ objectFit: "contain" }} />
          {product.discount ? <div style={{ position: "absolute", display: "flex", top: 20, right: 20, padding: "12px 18px", borderRadius: 24, background: "#123C32", color: "#FFFFFF", fontSize: 22, fontWeight: 700 }}>-{product.discount}%</div> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, padding: "0 8px", color: "#506056", fontSize: 16, letterSpacing: 2 }}><span>LE STYLE, À VOTRE FAÇON.</span><span>lecomax.com</span></div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400" } },
  );
}
