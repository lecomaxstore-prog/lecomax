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
      "Connexion sans fil 2.4GHz + Bluetooth",
      "Compatible PC, PS4/PS5, Mobile",
      "Vibrations HD double moteur",
      "Autonomie jusqu'à 20h",
      "Charge USB-C",
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

      <ProductColorProvider defaultColor={product.colors[0] ?? ""}>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">

        {/* ── Gallery ── */}
        <ProductGallery
          images={allImages}
          name={product.name}
          badge={product.badge}
          discount={discount}
          colors={product.colors}
          colorImages={product.colorImages}
          video={product.video}
        />

        {/* ── Info panel ── */}
        <div className="lg:sticky lg:top-24 self-start">

          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">
            {product.subCategory}
          </p>

          <h1 className="h-display text-3xl md:text-[2.2rem] leading-[1.05]">
            {product.name}
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
            Taxes incluses · Livraison calculée à la caisse
          </p>

          <div className="w-full h-px bg-neutral-100 my-6" />

          {/* Size + Add to cart */}
          <ProductActions product={product} />

          <div className="w-full h-px bg-neutral-100 my-6" />

          {/* Delivery badges */}          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-start gap-3 border border-neutral-100 p-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div>
                <p className="font-black text-[12px] uppercase">Livraison gratuite</p>
                <p className="text-neutral-400 text-[11px] mt-0.5">Dès 500 MAD</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border border-neutral-100 p-3.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              <div>
                <p className="font-black text-[12px] uppercase">Retours 30 jours</p>
                <p className="text-neutral-400 text-[11px] mt-0.5">Retours gratuits</p>
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
    </div>
  );
}
