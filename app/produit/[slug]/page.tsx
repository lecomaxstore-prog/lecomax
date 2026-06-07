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
import NewsletterSection from "@/components/NewsletterSection";

export const dynamic = "force-dynamic";

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

/* ── Deterministic star rating (matches ProductCard) ── */
function ratingFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = 4.3 + (h % 7) / 10;
  const count = 2 + (h % 5);
  return { rating: Math.round(rating * 10) / 10, count };
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

  const onSale = !!(product.oldPrice && product.oldPrice > product.price);
  const discount = onSale
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : undefined;
  const features = getFeatures(product.subCategory);
  const related = products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 4);
  const allImages = [product.image, ...product.gallery];

  // Auto-build colorImages for DB products that have multiple colors matching multiple images
  const resolvedColorImages: Record<string, string> | undefined =
    product.colorImages ??
    (product.colors.length > 1
      ? Object.fromEntries(product.colors.map((c, i) => [c, allImages[i] ?? allImages[0]]))
      : undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-neutral-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-black transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={`/${product.category}`} className="hover:text-black transition-colors capitalize">{product.category}</Link>
        <span>/</span>
        <span className="text-neutral-600">{product.subCategory}</span>
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
            const { rating, count } = ratingFor(product.slug);
            const full = Math.round(rating);
            return (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
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
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-[0.08em] px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:border-[#3ecf4c] hover:text-black hover:bg-[#3ecf4c]/5 transition-colors duration-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] shrink-0" />
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

          {/* Size + Add to cart */}
          <ProductActions product={product} />

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

      {/* ── Newsletter ── */}
      <NewsletterSection />
    </div>
  );
}
