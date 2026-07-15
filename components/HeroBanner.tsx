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
      <section className="hidden md:block w-full min-h-[620px] max-h-[820px] h-[calc(100svh-97px)] overflow-hidden relative bg-neutral-950">
        <Image
          src={desktopSrc}
          alt="L'ecomax — Hero"
          priority
          fill
          sizes="100vw"
          className="hero-image w-full h-full object-cover object-center"
          unoptimized={desktopSrc.startsWith("http")}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.78)_0%,rgba(0,0,0,.47)_34%,rgba(0,0,0,.08)_68%,rgba(0,0,0,.03)_100%)] flex items-center">
          <div className="max-w-7xl mx-auto px-10 lg:px-16 w-full">
            <p className="hero-eyebrow text-[11px] uppercase tracking-[0.4em] font-black mb-5 flex items-center gap-3" style={{ color: "#3ecf4c" }}>
              <span className="block w-8 h-px bg-[#3ecf4c]" />
              Boutique en ligne · Maroc
            </p>
            <h1 className="hero-headline h-display text-6xl lg:text-7xl xl:text-8xl text-white leading-[0.88] mb-6">
              Sport.<br />
              <span style={{ color: "#3ecf4c" }}>Tech.</span><br />
              Style.
            </h1>
            <p className="hero-sub text-white/70 text-[15px] mb-8 max-w-sm leading-relaxed">
              {shippingLabel} · Retours gratuits 30 j · Paiement à la livraison
            </p>
            <div className="hero-ctas flex items-center gap-3">
              <Link
                href="/boutique"
                className="group inline-flex items-center gap-3 font-black uppercase tracking-[0.15em] text-[11px] px-8 py-4 hover:bg-white active:scale-[.98] transition-all"
                style={{ background: "#3ecf4c", color: "#000" }}
              >
                Découvrir la collection
                <svg className="group-hover:translate-x-1 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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
            <div className="hero-sub flex items-center gap-5 mt-8 text-[10px] font-bold uppercase tracking-[.14em] text-white/55">
              <span className="flex items-center gap-2"><span className="text-[#3ecf4c]">✓</span> Livraison nationale</span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-2"><span className="text-[#3ecf4c]">✓</span> Achat sécurisé</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile hero */}
      <section className="md:hidden w-full min-h-[calc(100svh-60px)] overflow-hidden relative bg-neutral-950">
        <Image
          src={mobileSrc}
          alt="L'ecomax — Hero"
          priority
          fill
          sizes="100vw"
          className="hero-image w-full h-full object-cover object-[center_38%]"
          unoptimized={mobileSrc.startsWith("http")}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.06)_25%,rgba(0,0,0,.18)_52%,rgba(0,0,0,.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-28 text-white">
          <p className="hero-eyebrow text-[9px] font-black uppercase tracking-[.34em] text-[#3ecf4c] mb-3">
            Boutique en ligne · Maroc
          </p>
          <h1 className="hero-headline h-display text-[3.25rem] leading-[.88] tracking-[-.03em] mb-4">
            Sport. <span className="text-[#3ecf4c]">Tech.</span><br />Style.
          </h1>
          <p className="hero-sub text-[12px] leading-relaxed text-white/70 mb-5">
            {shippingLabel} · Paiement à la livraison
          </p>
          <div className="hero-ctas grid grid-cols-[1fr_auto] gap-2.5">
            <Link href="/boutique" className="flex items-center justify-center gap-2 bg-[#3ecf4c] text-black px-5 py-4 text-[10px] font-black uppercase tracking-[.14em] active:scale-[.98] transition-transform">
              Découvrir la collection
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/promotions" aria-label="Voir les promotions" className="flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-sm px-4 text-[10px] font-black uppercase tracking-[.12em] active:bg-white/20">
              Promos
            </Link>
          </div>
          <div className="hero-sub flex justify-between mt-4 text-[9px] font-bold uppercase tracking-[.1em] text-white/55">
            <span><span className="text-[#3ecf4c]">✓</span> Retours 30 jours</span>
            <span><span className="text-[#3ecf4c]">✓</span> Achat sécurisé</span>
          </div>
        </div>
      </section>
    </>
  );
}
