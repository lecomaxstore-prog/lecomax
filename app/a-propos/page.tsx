import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

const SITE_URL = "https://lecomax.com";

export const metadata: Metadata = {
  title: "À Propos de L'ecomax | Boutique Marocaine — Sidi Bennour",
  description:
    "Découvrez L'ecomax, marque marocaine fondée à Sidi Bennour en 2026. Mode, sneakers et accessoires tech à prix juste. Livraison partout au Maroc.",
  alternates: { canonical: "/a-propos/" },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: `${SITE_URL}/a-propos/`,
    title: "À Propos de L'ecomax | Boutique Marocaine — Sidi Bennour",
    description:
      "L'ecomax est une marque marocaine née à Sidi Bennour en 2026. Mode, sneakers et accessoires tech à prix juste.",
    images: [
      {
        url: `${SITE_URL}/ecomax-hero-banner.jpg.png`,
        width: 1200,
        height: 630,
        alt: "L'ecomax — Boutique Marocaine Sidi Bennour",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "À Propos de L'ecomax | Boutique Marocaine",
    description: "L'ecomax est une marque marocaine née à Sidi Bennour en 2026.",
    images: [`${SITE_URL}/ecomax-hero-banner.jpg.png`],
  },
};

export default function AProposPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "À Propos de L'ecomax",
    "url": `${SITE_URL}/a-propos/`,
    "description": "L'ecomax est une boutique en ligne marocaine fondée à Sidi Bennour en 2026, spécialisée dans la mode, les sneakers et les accessoires tech.",
    "inLanguage": "fr-MA",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "À Propos", "item": `${SITE_URL}/a-propos/` },
      ],
    },
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative text-white overflow-hidden h-screen flex items-end">
        <Image
          src="/images/pages/L'ecomax c'est quoi.png"
          alt="L'ecomax — boutique à Sidi Bennour"
          fill
          className="object-cover"
          style={{ objectPosition: "65% 30%" }}
          priority
        />
        {/* Mobile: strong bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10 sm:hidden" />
        {/* Desktop: left + bottom gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/10 hidden sm:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent hidden sm:block" />

        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 sm:px-12 pb-12 sm:pb-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 sm:mb-10">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/50">À Propos</span>
          </nav>

          <div className="sm:max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#3ecf4c] mb-4 sm:mb-5">
              <span className="w-5 h-px bg-[#3ecf4c] shrink-0" />
              Fondée en 2026 · Sidi Bennour, Maroc
            </p>
            <h1 className="font-black text-[clamp(2.4rem,8vw,6rem)] uppercase tracking-tighter leading-[0.92] mb-5 sm:mb-7">
              L&apos;ecomax<br />
              <span className="text-[#3ecf4c]">c&apos;est quoi ?</span>
            </h1>
            <p className="text-white/65 text-sm sm:text-base max-w-sm sm:max-w-md leading-relaxed mb-7 sm:mb-10">
              Une jeune marque marocaine née de la passion du style et du mouvement.
              On est là pour vous habiller — simplement, bien, et à prix juste.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/boutique"
                className="inline-flex items-center gap-2 bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#2db83a] transition-colors">
                Découvrir la boutique →
              </Link>
              <Link href="/nous-contacter"
                className="inline-flex items-center gap-2 border border-white/25 text-white font-black text-[11px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 right-6 sm:right-12 z-10 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[9px] uppercase tracking-[0.25em] text-white font-bold" style={{writingMode:"vertical-rl"}}>Scroll</span>
          <div className="w-px h-10 bg-white/50" />
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────── */}
      <section className="bg-[#3ecf4c]">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-12 py-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-black/10">
            {[
              { value: "2026", label: "Année de création" },
              { value: "Sidi Bennour", label: "Origine" },
              { value: "30+", label: "Modèles" },
              { value: "7j/7", label: "Support client" },
            ].map((s) => (
              <div key={s.label} className="py-5 px-4 sm:px-8 text-center">
                <p className="font-black text-black text-[17px] sm:text-[20px] leading-tight">{s.value}</p>
                <p className="text-black/55 text-[10px] uppercase tracking-[0.18em] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 sm:px-12 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-5">
              <span className="w-6 h-px bg-neutral-300" />Notre histoire
            </p>
            <h2 className="font-black text-[clamp(2rem,4vw,3.5rem)] uppercase tracking-tighter leading-tight mb-8">
              Tout commence<br />par une idée simple
            </h2>
            <div className="space-y-4 text-neutral-500 leading-relaxed text-[15px]">
              <p>
                L&apos;ecomax est né à Sidi Bennour d&apos;un constat simple : il est difficile de trouver de bonnes
                sneakers et des vêtements de qualité à des prix raisonnables dans notre région.
                Alors on a décidé de le faire nous-mêmes.
              </p>
              <p>
                Fondée en 2026, notre boutique est la première étape d&apos;une aventure qui ne fait que commencer.
                Chaque produit est soigneusement sélectionné pour sa durabilité, son confort et son style.
              </p>
            </div>
            <Link href="/boutiques"
              className="inline-flex items-center gap-2 mt-8 bg-black text-white font-black text-[11px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors">
              Voir notre boutique →
            </Link>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-neutral-950 rounded-3xl overflow-hidden aspect-square flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3ecf4c]/15 to-transparent" />
              <span className="font-black text-[200px] text-white/[0.04] select-none leading-none relative z-10">L</span>
              {/* Corner labels */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Est.</p>
                  <p className="text-white font-black text-2xl leading-none">2026</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Origine</p>
                  <p className="text-[#3ecf4c] font-black text-sm leading-tight">Sidi<br />Bennour</p>
                </div>
              </div>
              {/* Green accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#3ecf4c]" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-5 -right-5 bg-[#3ecf4c] rounded-2xl px-5 py-4 shadow-xl">
              <p className="font-black text-black text-[10px] uppercase tracking-widest">100%</p>
              <p className="font-black text-black text-lg leading-none">Marocain</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────── */}
      <section className="bg-neutral-950 py-20 sm:py-28">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-12">
          <div className="mb-14">
            <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#3ecf4c] mb-4">
              <span className="w-6 h-px bg-[#3ecf4c]" />Ce qu&apos;on défend
            </p>
            <h2 className="font-black text-[clamp(2rem,4vw,3.5rem)] uppercase tracking-tighter leading-tight text-white">
              Nos valeurs
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-px bg-neutral-800">
            {[
              {
                num: "01",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                ),
                title: "Authenticité",
                desc: "Uniquement des produits authentiques garantis d'origine. Zéro compromis sur la qualité.",
              },
              {
                num: "02",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                ),
                title: "Prix justes",
                desc: "La qualité ne devrait pas être réservée à une élite. Nos prix sont pensés pour être accessibles à tous.",
              },
              {
                num: "03",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                ),
                title: "Service humain",
                desc: "Une vraie équipe derrière chaque commande. On répond, on résout, on s'améliore chaque jour.",
              },
            ].map((v) => (
              <div key={v.title} className="bg-neutral-950 p-8 sm:p-10 group hover:bg-neutral-900 transition-colors">
                <div className="flex items-start justify-between mb-8">
                  <span className="text-neutral-700 font-black text-[11px] tracking-widest">{v.num}</span>
                  <div className="text-[#3ecf4c] group-hover:scale-110 transition-transform">{v.icon}</div>
                </div>
                <h3 className="font-black text-white text-xl uppercase tracking-tight mb-3">{v.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NUMBERS ──────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-12">
          <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 mb-16 justify-center">
            <span className="w-6 h-px bg-neutral-300" />Où on en est<span className="w-6 h-px bg-neutral-300" />
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-12 text-center">
            {[
              { value: "2026", label: "Année de création" },
              { value: "30+", label: "Modèles sélectionnés" },
              { value: "1", label: "Boutique physique" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-none text-black">{stat.value}</p>
                <div className="w-8 h-[2px] bg-[#3ecf4c] mx-auto my-3" />
                <p className="text-neutral-400 text-[11px] sm:text-sm uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION BANNER ───────────────────────────── */}
      <section className="bg-[#3ecf4c] py-16 sm:py-20 overflow-hidden relative">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-12 relative z-10">
          <p className="font-black text-[clamp(1.5rem,4vw,3rem)] uppercase tracking-tighter leading-tight text-black max-w-3xl">
            &ldquo;Habiller le Maroc simplement, bien, et à prix juste — telle est notre mission.&rdquo;
          </p>
          <p className="text-black/50 text-sm mt-4 font-semibold">— L&apos;équipe L&apos;ecomax, Sidi Bennour 2026</p>
        </div>
        {/* Decorative huge text */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 font-black text-[160px] text-black/5 select-none leading-none pointer-events-none">
          LEM
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="bg-neutral-950 py-20 sm:py-28">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#3ecf4c] mb-5">
                <span className="w-6 h-px bg-[#3ecf4c]" />L&apos;équipe
              </p>
              <h2 className="font-black text-[clamp(2rem,4vw,3.5rem)] uppercase tracking-tighter leading-tight text-white mb-6">
                On est juste<br />au début.
              </h2>
              <p className="text-white/50 text-[15px] leading-relaxed max-w-md">
                L&apos;ecomax grandit avec vous. Retrouvez-nous en boutique à Sidi Bennour ou contactez-nous directement.
                On est toujours à l&apos;écoute.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a href="https://wa.me/212699289568" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <p className="text-white font-black text-[13px] uppercase tracking-wide">WhatsApp</p>
                  <p className="text-white/40 text-[11px]">Réponse en moins de 2h</p>
                </div>
                <svg className="ml-auto text-white/20 group-hover:text-[#25D366] transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </a>

              <a href="mailto:contact@lecomax.com"
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <p className="text-white font-black text-[13px] uppercase tracking-wide">E-mail</p>
                  <p className="text-white/40 text-[11px]">contact@lecomax.com</p>
                </div>
                <svg className="ml-auto text-white/20 group-hover:text-white transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </a>

              <Link href="/nous-contacter"
                className="flex items-center gap-4 p-5 rounded-2xl bg-[#3ecf4c]/10 border border-[#3ecf4c]/20 hover:bg-[#3ecf4c]/20 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-[#3ecf4c] flex items-center justify-center shrink-0 text-black">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-[13px] uppercase tracking-wide">Formulaire de contact</p>
                  <p className="text-white/40 text-[11px]">Envoyez-nous un message</p>
                </div>
                <svg className="ml-auto text-white/20 group-hover:text-[#3ecf4c] transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>

              <Link href="/carrieres"
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <div>
                  <p className="text-white font-black text-[13px] uppercase tracking-wide">Rejoindre l&apos;équipe</p>
                  <p className="text-white/40 text-[11px]">Voir les postes ouverts</p>
                </div>
                <svg className="ml-auto text-white/20 group-hover:text-white transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
