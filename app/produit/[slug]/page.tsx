import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMAD, getProduct, products, type CardProduct, type Product } from "@/lib/products";
import { getDbProductRaw, getDbProducts } from "@/lib/db-server";
import { rankSimilarProducts } from "@/lib/product-recommendations";
import ProductActions from "@/components/ProductActions";
import { colorPricesFromTags } from "@/lib/product-variant-pricing";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import { ProductColorProvider } from "@/components/ProductColorContext";
import ProductCarousel from "@/components/ProductCarousel";
import ReviewSection from "@/components/ReviewSection";
import RatingSummaryPopover from "@/components/RatingSummaryPopover";
import LowStockReveal from "@/components/LowStockReveal";
import ProductAccordion from "@/components/ProductAccordion";
import ShareButtons from "@/components/ShareButtons";
import NewsletterSection from "@/components/NewsletterSection";
import { getServerShippingConfig } from "@/lib/shipping-config-server";
import { calculateShipping, formatShippingAmount, shippingSummary } from "@/lib/shipping-config";
import { colorSizeStockFromTags } from "@/lib/product-inventory";
import { catalogAvailability } from "@/mobile/src/lib/catalog-availability";
import { inferProductBrand, serializeJsonLd } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getProductShareData } from "@/lib/product-share";
import { colorImageMapFromTags, legacyColorImageMap, primaryColorImages } from "@/lib/product-color-images";


export const dynamic = "force-dynamic";

const PRODUCT_SITE_URL = "https://lecomax.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shippingConfig = await getServerShippingConfig();
  const shareProduct = await getProductShareData(slug);
  if (!shareProduct) return { title: "Produit | L'ecomax" };

  const price = formatMAD(shareProduct.price);
  const availability = shareProduct.stock === 0 ? "Rupture de stock" : "En stock";
  const canonicalUrl = `${PRODUCT_SITE_URL}/produit/${encodeURIComponent(slug)}/`;
  const socialImageUrl = `${PRODUCT_SITE_URL}/api/og/product/${encodeURIComponent(slug)}`;
  const title = `${shareProduct.name} — ${price} | L'ecomax`;
  const productSummary = shareProduct.description.trim().replace(/\s+/g, " ").slice(0, 85);
  const description = `${price} · ${availability} · ${shippingSummary(shippingConfig)} Paiement à la livraison.${productSummary ? ` ${productSummary}` : ""}`.slice(0, 190);

  return {
    title,
    description,
    keywords: [shareProduct.name, shareProduct.category, "L'ecomax", "acheter Maroc", "livraison Maroc", "paiement à la livraison", `${shareProduct.category} Maroc`],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "fr_MA",
      siteName: "L'ecomax",
      url: canonicalUrl,
      title,
      description,
      images: [{ url: socialImageUrl, width: 1200, height: 630, type: "image/png", alt: `${shareProduct.name} — ${price}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImageUrl],
    },
    other: {
      "product:price:amount": String(shareProduct.price),
      "product:price:currency": "MAD",
      "product:availability": shareProduct.stock === 0 ? "out of stock" : "in stock",
      "product:condition": "new",
      "product:retailer_item_id": shareProduct.slug,
      "twitter:label1": "Prix",
      "twitter:data1": price,
      "twitter:label2": "Disponibilité",
      "twitter:data2": availability,
    },
  };
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

/* ── Color name → CSS hex ── */
const colorMap: Record<string, string> = {
  "Noir": "#0a0a0a",
  "Blanc": "#f5f5f5",
  "Blanc casse": "#fafaf5",
  "Gris": "#9ca3af",
  "Gris chine": "#d1d5db",
  "Gris fonce": "#4b5563",
  "Gris anthracite": "#374151",
  "Bleu": "#3b82f6",
  "Bleu marine": "#1e3a5f",
  "Bleu nuit": "#1e2a4a",
  "Bleu ciel": "#7dd3fc",
  "Navy": "#1e3a5f",
  "Rouge": "#dc2626",
  "Bordeaux": "#7c1035",
  "Rose": "#f9a8d4",
  "Rose poudre": "#fcd5ce",
  "Corail": "#fb7185",
  "Vert": "#22c55e",
  "Vert militaire": "#4a5c3a",
  "Vert sauge": "#7c9a6f",
  "Kaki": "#8b7355",
  "Caramel": "#d4a574",
  "Beige": "#f5f0e8",
  "Champagne": "#f7e7ce",
  "Lilas": "#c4b5fd",
  "Mauve": "#a78bfa",
  "Violet": "#8b5cf6",
  "Marine": "#1e3a5f",
};
const getColorHex = (name: string) =>
  colorMap[name.split("/")[0].trim()] ?? "#e5e7eb";

/* ── Deterministic star rating fallback (used only if no DB reviews) ── */

/* ── Dynamic features by product type ── */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shippingConfig = await getServerShippingConfig();

  // Supabase is the shared source of truth for the website, mobile app and
  // admin. Deleted products must not reappear from the bundled catalogue.
  const dbProd = await getDbProductRaw(slug);
  if (dbProd?.active === false) notFound();
  let product: Product | null = null;

  if (dbProd) {
    // Convert the live product to the website's Product-compatible shape.
    const dbTags = (dbProd.tags as string[] | null) ?? [];
    product = {
      slug: dbProd.slug,
      stock: dbProd.stock,
      color_stock: dbProd.color_stock ?? undefined,
      tags: dbTags,
      preorder_enabled: dbProd.preorder_enabled === true,
      preorder_estimated_at: dbProd.preorder_estimated_at,
      preorder_message: dbProd.preorder_message,
      name: dbProd.name,
      brand: dbProd.brand ?? undefined,
      category: dbProd.category as "homme" | "femme" | "chaussures" | "accessoires",
      subCategory: dbProd.brand ?? dbProd.category,
      price: dbProd.price,
      oldPrice: dbProd.original_price ?? undefined,
      colors: (dbProd.colors as string[]) ?? [],
      colorPrices: colorPricesFromTags(dbTags),
      colorImageGalleries: colorImageMapFromTags(dbTags),
      sizes: (dbProd.sizes as string[]) ?? [],
      image: (dbProd.images ?? [])[0] || "",
      gallery: (dbProd.images ?? []).filter(Boolean).slice(1),
      badge: dbProd.featured ? "Nouveau" : undefined,
      description: dbProd.description ?? "",
      video: dbProd.video ?? undefined,
      descriptionImages: (dbProd.description_images as string[] | null) ?? undefined,
      // Extract __detail:Key:Value tags as product specs for the accordion
      specs: dbTags
        .filter((t: string) => t.startsWith("__detail:"))
        .map((t: string) => {
          const parts = t.slice("__detail:".length).split(":");
          return `${parts[0]}: ${parts.slice(1).join(":")}`;
        }),
      outOfStockColors: dbTags
        .filter((t: string) => t.startsWith("__oos:"))
        .map((t: string) => t.replace("__oos:", "")),
      sizeGuideType: (() => {
        const guideTag = dbTags.find((t: string) => t.startsWith("__guide:"));
        if (guideTag === "__guide:shoes") return "shoes";
        if (guideTag === "__guide:clothing") return "clothing";
        return undefined;
      })(),
    };
  }

  if (!product) notFound();

  // Fetch real review stats from DB
  let reviewRating = 0;
  let reviewCount = 0;
  try {
    const supa = createServerSupabaseClient();
    const { data: revData } = await supa
      .from("reviews")
      .select("rating").eq("verified_purchase", true)
      .eq("product_slug", slug);
    if (revData && revData.length > 0) {
      reviewCount = revData.length;
      reviewRating = Math.round((revData.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / revData.length) * 10) / 10;
    }
  } catch { /* use fallback */ }

  const displayRating = reviewRating;
  const displayReviewCount = reviewCount;

  // Use the same live snapshot for prices, sizes and stock. A second query
  // listing optional preorder columns fails on stores using the legacy schema.
  let realStock: number | null = null;
  try {
    const stockData = dbProd;
    if (typeof stockData?.stock === "number" && stockData.stock >= 0) {
      realStock = stockData.stock;
    }
    if (stockData) {
      const dbColors = Array.isArray(stockData.colors) && stockData.colors.length > 0
        ? stockData.colors as string[]
        : product.colors;
      const availability = catalogAvailability(stockData);
      const tags = Array.isArray(stockData.tags) ? stockData.tags as string[] : [];
      const colorSizeStock = colorSizeStockFromTags(tags);
      const dbSizes = Array.isArray(stockData.sizes) && stockData.sizes.length > 0
        ? stockData.sizes as string[]
        : product.sizes;
      product = {
        ...product,
        price: typeof stockData.price === "number" ? stockData.price : product.price,
        oldPrice: typeof stockData.original_price === "number"
          ? stockData.original_price
          : undefined,
        colors: dbColors,
        sizes: dbSizes,
        stock: realStock ?? undefined,
        color_stock: stockData.color_stock ?? undefined,
        tags,
        preorder_enabled: stockData.preorder_enabled === true,
        preorder_estimated_at: stockData.preorder_estimated_at,
        preorder_message: stockData.preorder_message,
        outOfStockColors: availability.out_of_stock_colors,
        outOfStockSizes: availability.out_of_stock_sizes,
        colorSizes: availability.color_sizes,
        colorPrices: availability.color_prices,
        colorSizeStock,
      };
    }
  } catch { /* non-critical */ }

  const SITE_URL = "https://lecomax.com";
  const onSale = !!(product.oldPrice && product.oldPrice > product.price);
  const discount = onSale
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : undefined;

  // Product structured data (schema.org)
  const productImages = [product.image, ...product.gallery]
    .filter((image): image is string => Boolean(image))
    .map((image) => image.startsWith("http") ? image : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`);
  const productBrand = inferProductBrand(product.displayName ?? product.name, product.brand);
  const merchantShippingCost = calculateShipping(product.price, shippingConfig);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.displayName ?? product.name,
    "description": product.description ?? `Achetez ${product.name} sur L'ecomax.`,
    "url": `${SITE_URL}/produit/${product.slug}/`,
    ...(productImages.length > 0 ? { "image": productImages } : {}),
    "sku": product.slug,
    ...(productBrand ? { "brand": { "@type": "Brand", "name": productBrand } } : {}),
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "MAD",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": realStock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "url": `${SITE_URL}/produit/${product.slug}/`,
      "seller": { "@type": "Organization", "name": "L'ecomax", "url": SITE_URL },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": merchantShippingCost,
          "currency": "MAD",
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "MA",
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY",
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 4,
            "unitCode": "DAY",
          },
        },
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "MA",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
      },
    },
    ...(reviewCount > 0 ? {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": displayRating,
      "reviewCount": displayReviewCount,
      "bestRating": 5,
      "worstRating": 1,
    },
    } : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": product.category.charAt(0).toUpperCase() + product.category.slice(1), "item": `${SITE_URL}/${product.category}/` },
      { "@type": "ListItem", "position": 3, "name": product.displayName ?? product.name, "item": `${SITE_URL}/produit/${product.slug}/` },
    ],
  };
  const features = (product.specs && product.specs.length > 0) ? product.specs : [];
  // Combine the static catalogue with every active database product so future
  // additions are immediately eligible for recommendations. Live DB fields
  // override static card data while the richer static taxonomy is preserved.
  const dbRecommendationProducts = await getDbProducts({ activeOnly: true });
  const recommendationCatalogue = new Map<string, CardProduct & { subCategory?: string; description?: string }>();
  for (const catalogueProduct of products) recommendationCatalogue.set(catalogueProduct.slug, catalogueProduct);
  for (const dbProduct of dbRecommendationProducts) {
    const staticProduct = recommendationCatalogue.get(dbProduct.slug);
    recommendationCatalogue.set(dbProduct.slug, {
      ...staticProduct,
      ...dbProduct,
      subCategory: staticProduct?.subCategory,
      description: staticProduct?.description,
    });
  }
  const related = rankSimilarProducts(product, [...recommendationCatalogue.values()], 4);
  const allImages = [product.image, ...product.gallery].filter(Boolean);

  // Only build image-based color swatches when there are real uploaded images.
  // If we used a placeholder, the swatch would show a gray no-image thumbnail.
  const hasRealImages = allImages.some(
    (img) => img && !img.includes("no-image") && !img.includes("placeholder")
  );
  const explicitColorGalleries = product.colorImageGalleries && Object.keys(product.colorImageGalleries).length > 0
    ? product.colorImageGalleries
    : undefined;
  const resolvedColorImageGalleries = explicitColorGalleries ?? (
    product.colors.length > 0 && hasRealImages
      ? legacyColorImageMap(product.colors, allImages, product.colorImages)
      : undefined
  );
  const resolvedColorImages = primaryColorImages(resolvedColorImageGalleries);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Product JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }} />
      {/* BreadcrumbList JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-neutral-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-black transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={`/${product.category}`} className="hover:text-black transition-colors capitalize">{product.category}</Link>
        {product.subCategory && product.subCategory.toLowerCase() !== product.category.toLowerCase() && (
          <>
            <span>/</span>
            <span className="text-neutral-600 truncate max-w-[100px]">{product.subCategory}</span>
          </>
        )}
        <span>/</span>
        <span className="text-black font-medium truncate max-w-[180px]">{product.name}</span>
      </nav>

      <ProductColorProvider defaultColor={
        product.colors.find(c => !(product.outOfStockColors ?? []).includes(c)) ?? product.colors[0] ?? ""
      }>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">

        {/* ── Gallery ── */}
        <ProductGallery
          images={allImages}
          name={product.name}
          badge={product.badge}
          discount={discount}
          colors={product.colors}
          colorImages={resolvedColorImages}
          colorImageGalleries={resolvedColorImageGalleries}
          video={product.video}
        />

        {/* ── Info panel ── */}
        <div className="lg:sticky lg:top-24 self-start min-w-0">

          <div className="product-summary-enter relative z-[60] mb-3 flex min-h-7 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="h-px w-7 shrink-0 bg-[#3ecf4c]" />
              <p className="truncate text-[10px] font-black uppercase tracking-[0.32em] text-neutral-400">
                {product.subCategory}
              </p>
            </div>
            {displayReviewCount > 0 && (
              <RatingSummaryPopover
                productSlug={product.slug}
                rating={displayRating}
                reviewCount={displayReviewCount}
              />
            )}
          </div>

          <h1 className={`product-summary-enter h-display max-w-2xl leading-[.98] tracking-[-.035em] [animation-delay:.08s] ${
            (product.displayName ?? product.name).length > 35
              ? "text-[1.75rem] sm:text-[2rem] lg:text-[2.35rem]"
              : "text-[2rem] sm:text-[2.35rem] lg:text-[2.75rem]"
          }`}>
            {product.displayName ?? product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mt-5">
            <span className={`text-2xl font-black ${onSale ? "text-red-600" : ""}`}>
              {formatMAD(product.price)}
            </span>
            {onSale && (
              <>
                <span className="text-neutral-400 line-through text-[15px]">
                  {formatMAD(product.oldPrice!)}
                </span>
                <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5">
                  -{discount}%
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Taxes incluses · Livraison {formatShippingAmount(shippingConfig.cost)} MAD partout au Maroc
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="18" cy="18" r="2" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-4 text-neutral-900">
                  Livraison estimée <span className="font-extrabold text-emerald-700">sous {shippingConfig.estimatedDays}</span>
                </p>
                <p className="mt-0.5 text-[10px] leading-4 text-neutral-400">Partout au Maroc · Suivi de commande inclus</p>
              </div>
            </div>
            <LowStockReveal stock={realStock} />
          </div>

          <div className="w-full h-px bg-neutral-100 my-6" />

          {/* Size + Add to cart */}
          <div data-product-selection>
            <ProductActions
              product={product}
              colorImages={resolvedColorImages}
              colorImageGalleries={resolvedColorImageGalleries}
            />
          </div>

          <div className="w-full h-px bg-neutral-100 my-6" />

          {/* Delivery badges */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-start gap-2.5 bg-neutral-50 rounded-xl p-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-neutral-500">
                <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div>
                <p className="font-black text-[12px] uppercase">Livraison {formatShippingAmount(shippingConfig.cost)} MAD</p>
                <p className="text-neutral-400 text-[11px] mt-0.5">Partout au Maroc · {shippingConfig.estimatedDays}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-neutral-50 rounded-xl p-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-neutral-500">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              <div>
                <p className="font-black text-[12px] uppercase">Retours 30 jours</p>
                <p className="text-neutral-400 text-[11px] mt-0.5">Retours simples et gratuits</p>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <ShareButtons
            url={`${SITE_URL}/produit/${product.slug}`}
            title={product.displayName ?? product.name}
          />
        </div>
      </div>
      </ProductColorProvider>

      {/* ── Full-width accordions ── */}
      <ProductAccordion
        description={product.description}
        features={features}
        descriptionImages={product.descriptionImages ?? (product.descriptionImage ? [product.descriptionImage] : [])}
        productSlug={product.slug}
      />

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-neutral-100 pt-12">
          <h2 className="h-display text-2xl md:text-3xl mb-2">Vous aimerez aussi</h2>
          <div className="w-8 h-[3px] bg-black mb-8" />
          <ProductCarousel products={related} />
        </section>
      )}

      <div className="mt-16">
        <NewsletterSection />
      </div>

    </div>
  );
}
