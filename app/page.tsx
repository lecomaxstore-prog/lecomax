import dynamic from "next/dynamic";
import HeroBanner from "@/components/HeroBanner";
import CategoryTiles from "@/components/CategoryTiles";
import ProductRail from "@/components/ProductRail";
import Image from "next/image";
import Link from "next/link";

// Lazy-load heavy below-fold components — keeps initial JS bundle small
const OurProductsGrid = dynamic(() => import("@/components/OurProductsGrid"));
const ScrollReveal = dynamic(() => import("@/components/ScrollReveal"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
import { products as staticProducts, type CardProduct } from "@/lib/products";
import { getDbProducts } from "@/lib/db-server";

export const revalidate = 60; // ISR — revalidate every 60 seconds

export default async function HomePage() {
  // Merge DB products with static, DB products appear first
  const dbProducts = await getDbProducts({ activeOnly: true });
  const dbSlugs = new Set(dbProducts.map((p) => p.slug));
  const allProducts: CardProduct[] = [
    ...dbProducts,
    ...(staticProducts as CardProduct[]).filter((p) => !dbSlugs.has(p.slug)),
  ];

  const newArrivals = allProducts.filter((p) => p.badge === "Nouveau");
  const bestSellers = allProducts.filter((p) => p.badge === "Bestseller");
  // Fall back: if no featured in DB, show first 4 DB products as "nouveautés"
  const featuredForRail = (newArrivals.length > 0 ? newArrivals : dbProducts).slice(0, 8);
  const bestSellersForRail = bestSellers.length > 0 ? bestSellers : dbProducts.slice(0, 8);

  return (
    <>
      <HeroBanner />

      <ProductRail
        title="Nouveautés"
        products={featuredForRail}
        cta={{ label: "Tout voir", href: "/nouveautes" }}
      />

      <CategoryTiles />

      <OurProductsGrid products={allProducts} />

      <ProductRail
        title="Bestsellers"
        products={bestSellersForRail}
        cta={{ label: "Tout voir", href: "/bestsellers" }}
      />

      {/* ── Promo strip ─────────────────────────────────────────── */}
      <ScrollReveal direction="scale">
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <Image
          src="/images/promotion%20section%20photo.png"
          alt="Promotion L'ecomax"
          fill
          sizes="100vw"
          className="object-cover object-[center_15%] opacity-90"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold mb-4">
              Offre limitée
            </p>
            <h2 className="h-display text-4xl md:text-[5.5rem] max-w-xl leading-[0.88]">
              Jusqu&apos;à&nbsp;
              <span className="text-[#3ecf4c]">−40%</span>
              <br />sur une sélection
            </h2>
          </div>
          <div className="flex flex-col gap-5 md:items-end">
            <p className="text-white/50 max-w-xs text-[13px] leading-relaxed md:text-right">
              Réductions exceptionnelles sur des incontournables.
              Tant qu&apos;il y en a.
            </p>
            <Link
              href="/promotions"
              className="self-start md:self-auto bg-[#3ecf4c] text-black px-8 py-4 font-black uppercase text-[11px] tracking-[0.18em] hover:bg-[#34b841] active:scale-[0.97] transition-all inline-flex items-center gap-2.5"
            >
              Voir les promos
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ProductRail
        title="En promotion"
        products={allProducts.filter((p) => p.oldPrice)}
        cta={{ label: "Voir les promos", href: "/promotions" }}
      />

      <Testimonials />

      {/* ── ecoClub ─────────────────────────────────────────────── */}      <ScrollReveal direction="up">      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold mb-4">
            ecoClub
          </p>
          <h2 className="h-display text-4xl md:text-[3.5rem]">
            Plus que des<br/>récompenses
          </h2>
          <p className="mt-5 text-neutral-500 max-w-lg text-[14px] leading-relaxed">
            Adhérez gratuitement et profitez d&apos;avantages exclusifs : accès
            anticipé aux nouveautés, livraison gratuite, et invitations à des
            événements.
          </p>
          <ul className="mt-6 space-y-3">
            {["Accès anticipé aux nouveautés", "Livraison gratuite permanente", "Offres membres exclusives"].map(b => (
              <li key={b} className="flex items-center gap-3 text-[13px] text-neutral-600">
                <span className="w-5 h-5 shrink-0 bg-black text-white flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link
            href="/connexion"
            className="inline-flex items-center gap-2.5 mt-8 bg-black text-white px-8 py-4 font-black uppercase text-[11px] tracking-[0.18em] hover:bg-neutral-800 active:scale-[0.97] transition-all"
          >
            Rejoindre l&apos;ecoClub
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden group">
          <Image
            src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80"
            alt="Communauté ecoClub"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          />
          {/* Minimal overlay */}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
        </div>
      </section>
      </ScrollReveal>
    </>
  );
}
