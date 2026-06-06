import HeroBanner from "@/components/HeroBanner";
import CategoryTiles from "@/components/CategoryTiles";
import ProductRail from "@/components/ProductRail";
import OurProductsGrid from "@/components/OurProductsGrid";
import ScrollReveal from "@/components/ScrollReveal";
import Testimonials from "@/components/Testimonials";
import Image from "next/image";
import Link from "next/link";
import { products as staticProducts, type CardProduct } from "@/lib/products";
import { getDbProducts } from "@/lib/db-server";

export const dynamic = "force-dynamic";

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

      {/* ── Homme / Femme banners ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-12">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <ScrollReveal direction="up">
            <Link href="/homme" className="relative block aspect-[2/3] overflow-hidden bg-neutral-900 group">
              <Image
                src="/images/pages%20images/homme.png"
                alt="Collection Homme"
                fill
                sizes="(min-width: 768px) 50vw, 50vw"
                className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 md:p-8 text-white">
                <p className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-white/60 font-bold mb-1.5">Collection</p>
                <h3 className="h-display text-2xl md:text-4xl">Homme</h3>
                <span className="inline-flex items-center gap-2 mt-3 md:mt-5 bg-[#3ecf4c] text-black px-4 md:px-5 py-2 md:py-2.5 font-black uppercase text-[10px] md:text-[11px] tracking-[0.15em] group-hover:bg-[#34b841] transition-colors">
                  Explorer
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </Link>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={100}>
            <Link href="/femme" className="relative block aspect-[2/3] overflow-hidden bg-neutral-900 group">
              <Image
                src="/images/pages%20images/femme.png"
                alt="Collection Femme"
                fill
                sizes="(min-width: 768px) 50vw, 50vw"
                className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 md:p-8 text-white">
                <p className="text-[9px] md:text-[10px] uppercase tracking-[0.35em] text-white/60 font-bold mb-1.5">Collection</p>
                <h3 className="h-display text-2xl md:text-4xl">Femme</h3>
                <span className="inline-flex items-center gap-2 mt-3 md:mt-5 bg-[#3ecf4c] text-black px-4 md:px-5 py-2 md:py-2.5 font-black uppercase text-[10px] md:text-[11px] tracking-[0.15em] group-hover:bg-[#34b841] transition-colors">
                  Explorer
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

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
