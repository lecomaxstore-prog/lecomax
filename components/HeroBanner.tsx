import Image from "next/image";
import Link from "next/link";

export default function HeroBanner({
  heroImage,
  heroImageMobile,
  shippingCost,
}: {
  heroImage?: string;
  heroImageMobile?: string;
  shippingCost?: string;
}) {
  const desktopSrc = heroImage || "/images/hero secrtion/hero section web version.png";
  const mobileSrc = heroImageMobile || "/images/hero secrtion/hero section mobile version.png";
  const shippingLabel = shippingCost ? `Livraison ${shippingCost} MAD` : "Livraison 35 MAD";

  return (
    <>
      {/* Desktop hero */}
      <section className="hidden md:block w-full overflow-hidden relative">
        <Image
          src={desktopSrc}
          alt="L'ecomax — Hero"
          width={1920}
          height={900}
          priority
          className="w-full h-auto object-cover"
          unoptimized={desktopSrc.startsWith("http")}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent flex items-center">
          <div className="max-w-7xl mx-auto px-10 lg:px-16 w-full">
            <p className="text-[11px] uppercase tracking-[0.4em] font-black mb-5" style={{ color: "#3ecf4c" }}>
              Boutique en ligne · Maroc
            </p>
            <h1 className="h-display text-6xl lg:text-7xl xl:text-8xl text-white leading-[0.88] mb-6">
              Sport.<br />
              <span style={{ color: "#3ecf4c" }}>Tech.</span><br />
              Style.
            </h1>
            <p className="text-white/65 text-[15px] mb-9 max-w-xs leading-relaxed">
              {shippingLabel} · Retours gratuits 30 j · Paiement à la livraison
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/boutique"
                className="inline-flex items-center gap-3 font-black uppercase tracking-[0.15em] text-[11px] px-8 py-4 transition-colors"
                style={{ background: "#3ecf4c", color: "#000" }}
              >
                Découvrir la collection
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/promotions"
                className="inline-flex items-center gap-2 font-bold text-[11px] uppercase tracking-[0.12em] text-white/80 hover:text-white transition-colors border border-white/30 hover:border-white px-6 py-4"
              >
                Voir les promos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile hero */}
      <section className="md:hidden w-full overflow-hidden relative">
        <Image
          src={mobileSrc}
          alt="L'ecomax — Hero"
          width={1080}
          height={1350}
          priority
          className="w-full h-auto object-cover"
          unoptimized={mobileSrc.startsWith("http")}
        />

      </section>
    </>
  );
}
