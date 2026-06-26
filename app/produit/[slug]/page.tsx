import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMAD, getProduct, products, type Product } from "@/lib/products";
import { getDbProductRaw } from "@/lib/db-server";
import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import { ProductColorProvider } from "@/components/ProductColorContext";
import ProductCarousel from "@/components/ProductCarousel";
import ReviewSection from "@/components/ReviewSection";
import ProductAccordion from "@/components/ProductAccordion";
import ShareButtons from "@/components/ShareButtons";


export const dynamic = "force-dynamic";

const PRODUCT_SITE_URL = "https://lecomax.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (product) {
    const name = product.displayName ?? product.name;
    const desc = product.description
      ? product.description.slice(0, 155) + (product.description.length > 155 ? "…" : "")
      : `Achetez ${name} sur L'ecomax. Livraison 35 MAD partout au Maroc. Paiement à la livraison.`;
    const imgUrl = product.image
      ? product.image.startsWith("http")
        ? product.image
        : `${PRODUCT_SITE_URL}${product.image}`
      : `${PRODUCT_SITE_URL}/ecomax-hero-banner.jpg.png`;
    const title = `${name} — Acheter au Maroc | L'ecomax`;
    return {
      title,
      description: desc,
      keywords: [name, product.category, "L'ecomax", "acheter Maroc", "livraison Maroc", "paiement à la livraison", `${product.category} Maroc`],
      alternates: { canonical: `${PRODUCT_SITE_URL}/produit/${slug}/` },
      openGraph: {
        type: "website",
        locale: "fr_MA",
        url: `${PRODUCT_SITE_URL}/produit/${slug}/`,
        title,
        description: desc,
        images: [{ url: imgUrl, width: 800, height: 800, alt: name }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [imgUrl],
      },
    };
  }
  // Try DB product
  try {
    const { getDbProductRaw: getDb } = await import("@/lib/db-server");
    const dbProd = await getDb(slug);
    if (dbProd) {
      const img = (dbProd.images ?? [])[0];
      const imgUrl = img
        ? img.startsWith("http") ? img : `${PRODUCT_SITE_URL}${img}`
        : `${PRODUCT_SITE_URL}/ecomax-hero-banner.jpg.png`;
      const desc = dbProd.description
        ? dbProd.description.slice(0, 155) + (dbProd.description.length > 155 ? "…" : "")
        : `Achetez ${dbProd.name} sur L'ecomax. Livraison 35 MAD partout au Maroc. Paiement à la livraison.`;
      const dbTitle = `${dbProd.name} — Acheter au Maroc | L'ecomax`;
      return {
        title: dbTitle,
        description: desc,
        keywords: [dbProd.name, dbProd.category, "L'ecomax", "acheter Maroc", "livraison Maroc", "paiement à la livraison", `${dbProd.category} Maroc`],
        alternates: { canonical: `${PRODUCT_SITE_URL}/produit/${slug}/` },
        openGraph: {
          type: "website",
          locale: "fr_MA",
          url: `${PRODUCT_SITE_URL}/produit/${slug}/`,
          title: dbTitle,
          description: desc,
          images: [{ url: imgUrl, width: 800, height: 800, alt: dbProd.name }],
        },
        twitter: {
          card: "summary_large_image",
          title: dbTitle,
          description: desc,
          images: [imgUrl],
        },
      };
    }
  } catch { /* */ }
  return { title: "Produit | L'ecomax" };
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
function ratingFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = 4.3 + (h % 7) / 10;
  const count = 2 + (h % 5); // deterministic count, consistent with ProductCard
  return { rating: Math.round(rating * 10) / 10, count };
}

function stockFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return 3 + (h % 5); // 3–7 units
}

/* ── Dynamic features by product type ── */
function getFeatures(subCategory: string): string[] {
  const sub = subCategory.toLowerCase();
  if (sub === "audio" || sub.includes("couteur") || sub.includes("casque")) {
    return [
      "Connexion Bluetooth 5.3",
      "Autonomie jusqu'à 30h",
      "Réduction de bruit active (ANC)",
      "Charge rapide USB-C",
      "Compatible iOS & Android",
    ];
  }
  if (sub === "gaming" || sub.includes("manette")) {
    return [
      "Sticks à effet Hall (No Drift garanti)",
      "Connexion sans fil 2.4GHz + Bluetooth 5.0",
      "Compatible iOS, Switch, PC, Android, Steam Deck",
      "Gâchettes progressives à effet Hall",
      "Éclairage RGB personnalisable",
      "Batterie 1800 mAh rechargeable",
      "Station de charge incluse",
      "Boutons entièrement remappables",
      "Autonomie jusqu'à 20h",
      "Charge USB-C rapide",
      "Non compatible Xbox et PS5",
    ];
  }
  if (sub === "sacs" || sub.includes("sac")) {
    return [
      "Dos rembourré ergonomique",
      "Port USB intégré",
      "Compartiment laptop 15,6\"",
      "Matière polyester imperméable",
      "Sangles réglables",
    ];
  }
  if (sub === "tech") {
    return ["Compatibilité universelle", "Matériaux certifiés", "Garantie 1 an"];
  }
  if (sub === "running") {
    return [
      "Semelle amorti responsive",
      "Tige en mesh respirant",
      "Système de laçage sécurisé",
      "Grip multisurface",
      "Drop 8mm",
    ];
  }
  if (sub === "lifestyle" || sub.includes("sneaker")) {
    return [
      "Tige en cuir synthétique premium",
      "Semelle en caoutchouc vulcanisé",
      "Doublure textile",
      "Semelle intérieure amovible",
    ];
  }
  if (sub === "vestes" || sub.includes("bomber") || sub.includes("coupe")) {
    return [
      "Coupe regular fit",
      "Fermeture zippée premium",
      "Poches zippées latérales",
      "Matière polyester recyclé",
      "Bandes élastiques aux poignets",
    ];
  }
  if (sub === "sweats" || sub.includes("hoodie")) {
    return [
      "Tissu molleton brosse intérieure",
      "Coupe oversize",
      "Poche kangourou",
      "Cordon de serrage réglable",
      "100% coton bio",
    ];
  }
  return [
    "Qualité premium",
    "Finitions soignées",
    "Matières sélectionnées",
    "Confort durable",
  ];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try static first, then fall back to DB
  let product: Product | null = getProduct(slug) ?? null;

  if (!product) {
    const dbProd = await getDbProductRaw(slug);
    if (!dbProd) notFound();
    // Convert API product to Product-compatible shape
    product = {
      slug: dbProd.slug,
      name: dbProd.name,
      category: dbProd.category as "homme" | "femme" | "chaussures" | "accessoires",
      subCategory: dbProd.brand ?? dbProd.category,
      price: dbProd.price,
      oldPrice: dbProd.original_price ?? undefined,
      colors: (dbProd.colors as string[]) ?? [],
      sizes: (dbProd.sizes as string[]) ?? [],
      image: (dbProd.images ?? [])[0] ?? "",
      gallery: (dbProd.images ?? []).slice(1),
      badge: dbProd.featured ? "Nouveau" : undefined,
      description: dbProd.description ?? "",
      video: dbProd.video ?? undefined,
      descriptionImages: (dbProd.description_images as string[] | null) ?? undefined,
      outOfStockColors: (dbProd.tags as string[] | null)
        ?.filter((t: string) => t.startsWith("__oos:"))
        .map((t: string) => t.replace("__oos:", "")) ?? undefined,
      sizeGuideType: (() => {
        const guideTag = (dbProd.tags as string[] | null)?.find((t: string) => t.startsWith("__guide:"));
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
    const { createClient } = await import("@supabase/supabase-js");
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: revData } = await supa
      .from("reviews")
      .select("rating")
      .eq("product_slug", slug);
    if (revData && revData.length > 0) {
      reviewCount = revData.length;
      reviewRating = Math.round((revData.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / revData.length) * 10) / 10;
    }
  } catch { /* use fallback */ }

  const displayRating = reviewRating;
  const displayReviewCount = reviewCount;

  // Fetch color_stock and stock from DB
  let realStock: number | null = null;
  try {
    const { createClient: createClient2 } = await import("@supabase/supabase-js");
    const supa2 = createClient2(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: stockData } = await supa2
      .from("products")
      .select("color_stock, stock")
      .eq("slug", slug)
      .single();
    if (stockData?.color_stock && typeof stockData.color_stock === "object") {
      const cs = stockData.color_stock as Record<string, number>;
      const dbOos = Object.entries(cs).filter(([, qty]) => qty === 0).map(([color]) => color);
      if (dbOos.length > 0) {
        const existing = product.outOfStockColors ?? [];
        product = { ...product, outOfStockColors: [...new Set([...existing, ...dbOos])] };
      }
    }
    if (typeof stockData?.stock === "number" && stockData.stock >= 0) {
      realStock = stockData.stock;
    }
  } catch { /* non-critical */ }

  const SITE_URL = "https://lecomax.com";
  const onSale = !!(product.oldPrice && product.oldPrice > product.price);
  const discount = onSale
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : undefined;

  // Product structured data (schema.org)
  const productImgUrl = product.image
    ? product.image.startsWith("http") ? product.image : `${SITE_URL}${product.image.startsWith("/") ? "" : "/"}${product.image}`
    : undefined;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.displayName ?? product.name,
    "description": product.description ?? `Achetez ${product.name} sur L'ecomax.`,
    ...(productImgUrl ? { "image": productImgUrl } : {}),
    "sku": product.slug,
    "brand": { "@type": "Brand", "name": "L'ecomax" },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "MAD",
      "availability": "https://schema.org/InStock",
      "url": `${SITE_URL}/produit/${product.slug}/`,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      "seller": { "@type": "Organization", "name": "L'ecomax", "url": SITE_URL },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 35,
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
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY",
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 5,
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
        "returnFees": "https://schema.org/FreeReturn",
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
  const features = (product.specs && product.specs.length > 0) ? product.specs : getFeatures(product.subCategory);
  // Gender-aware related: femme products only show femme, homme only homme
  const productGender =
    product.slug.includes("femme") || product.name.toLowerCase().includes("femme") || product.category === "femme"
      ? "femme"
      : product.slug.includes("homme") || product.name.toLowerCase().includes("homme") || product.category === "homme"
      ? "homme"
      : null;
  const related = products
    .filter((p) => {
      if (p.category !== product.category || p.slug === product.slug) return false;
      if (productGender === "femme")
        return p.slug.includes("femme") || p.name.toLowerCase().includes("femme");
      if (productGender === "homme")
        return p.slug.includes("homme") || p.name.toLowerCase().includes("homme");
      return true;
    })
    .slice(0, 4);
  const allImages = [product.image, ...product.gallery];

  // Auto-build colorImages for DB products — map each color to its corresponding image
  const resolvedColorImages: Record<string, string> | undefined =
    product.colorImages ??
    (product.colors.length > 0
      ? Object.fromEntries(product.colors.map((c, i) => [c, allImages[i] ?? allImages[0]]))
      : undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Product JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      {/* BreadcrumbList JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

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
          video={product.video}
        />

        {/* ── Info panel ── */}
        <div className="lg:sticky lg:top-24 self-start min-w-0">

          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">
            {product.subCategory}
          </p>

          <h1 className={`h-display leading-[1.05] ${
            (product.displayName ?? product.name).length > 35
              ? "text-2xl md:text-[1.7rem]"
              : "text-3xl md:text-[2.2rem]"
          }`}>
            {product.displayName ?? product.name}
          </h1>

          {/* Rating + stock */}
          {(() => {
            const rating = displayRating;
            const count = displayReviewCount;
            const full = Math.round(rating);
            return (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {count > 0 && (
                  <>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24"
                          fill={s <= full ? "#facc15" : "none"}
                          stroke={s <= full ? "#facc15" : "#d4d4d4"}
                          strokeWidth="1.5">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[12px] font-bold">{rating}</span>
                    <span className="text-[12px] text-neutral-400">({count} avis)</span>
                    <span className="text-neutral-200">·</span>
                  </>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  En stock
                </span>
              </div>
            );
          })()}

          {/* Spec chips */}
          {product.specs && product.specs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {product.specs.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-800 hover:bg-black hover:text-white hover:border-black transition-all duration-200 cursor-default"
                >
                  <svg width="7" height="7" viewBox="0 0 8 8" className="shrink-0">
                    <circle cx="4" cy="4" r="4" fill="#3ecf4c" />
                  </svg>
                  {s}
                </span>
              ))}
            </div>
          )}

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
            Taxes incluses · Livraison 35 MAD partout au Maroc
          </p>

          <div className="w-full h-px bg-neutral-100 my-6" />

          {/* Urgency / scarcity signal */}
          {(() => {
            const stock = realStock === 0 ? null : (product.urgencyStock ?? (realStock !== null && realStock > 0 ? realStock : stockFor(product.slug)));
            if (!stock) return null;
            return (
              <div className="flex items-center gap-2 py-2.5 px-3.5 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-[12px] text-amber-800 font-semibold">
                  Plus que <strong>{stock} en stock</strong> — commandez vite !
                </span>
              </div>
            );
          })()}

          {/* Size + Add to cart */}
          <ProductActions product={product} colorImages={resolvedColorImages} />

          <div className="w-full h-px bg-neutral-100 my-6" />

          {/* Delivery badges */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-start gap-2.5 bg-neutral-50 rounded-xl p-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-neutral-500">
                <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div>
                <p className="font-black text-[12px] uppercase">Livraison 35 MAD</p>
                <p className="text-neutral-400 text-[11px] mt-0.5">Partout au Maroc · 2-4 jours</p>
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

    </div>
  );
}
