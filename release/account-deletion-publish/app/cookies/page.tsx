import Link from "next/link";

export const metadata = {
  title: "Politique de Cookies | L'ecomax",
  description: "Comment L'ecomax utilise les cookies pour améliorer votre expérience.",
  alternates: { canonical: "/cookies/" },
};

const cookieTypes = [
  {
    num: "01",
    name: "Cookies essentiels",
    tag: "Toujours actifs",
    essential: true,
    desc: "Indispensables au fonctionnement du site. Ils permettent de conserver votre panier, votre session de connexion et vos préférences de base. Ces cookies ne peuvent pas être désactivés.",
    examples: ["Panier d'achat", "Session utilisateur", "Sécurité (CSRF)", "Paramètres de langue"],
  },
  {
    num: "02",
    name: "Cookies de performance",
    tag: "Opt-in",
    essential: false,
    desc: "Nous aident à comprendre comment les visiteurs interagissent avec notre site. Les données sont collectées de façon anonyme et nous permettent d'améliorer continuellement nos services.",
    examples: ["Pages vues", "Temps de visite", "Sources de trafic", "Taux de rebond"],
  },
  {
    num: "03",
    name: "Cookies de préférences",
    tag: "Opt-in",
    essential: false,
    desc: "Permettent au site de mémoriser vos choix pour vous offrir une expérience personnalisée lors de vos prochaines visites.",
    examples: ["Catégories consultées", "Produits favoris", "Historique récent", "Ordre personnalisé"],
  },
  {
    num: "04",
    name: "Données comportementales",
    tag: "Opt-in",
    essential: false,
    desc: "Enregistrent des signaux d'achat limités afin d'améliorer le catalogue et les recommandations. Cette collecte reste inactive tant que vous ne l'avez pas autorisée.",
    examples: ["Produits consultés", "Recherches", "Ajouts au panier", "Engagement sur les pages"],
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative w-full bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(62,207,76,0.06) 0%, transparent 60%)" }} />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-16 lg:pt-20 lg:pb-28">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-10">
            <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
            <span className="text-white/15">/</span>
            <span className="text-white/40">Légal</span>
            <span className="text-white/15">/</span>
            <span className="text-white/60">Cookies</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-px h-8 bg-[#3ecf4c]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3ecf4c]">Document légal</span>
              </div>
              <h1 className="font-black text-white leading-[1.02] mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)", letterSpacing: "-0.03em" }}>
                Politique de<br />cookies
              </h1>
              <p className="text-white/45 text-[15px] max-w-sm leading-relaxed">
                Nous utilisons des cookies pour vous offrir la meilleure expérience possible. Voici comment et pourquoi.
              </p>
            </div>

            <div className="shrink-0 border border-white/10 bg-white/[0.04] px-6 py-5 lg:min-w-[220px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Informations</p>
              <div className="space-y-2.5">
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Mise à jour</span>
                  <span className="text-white font-bold">Avr. 2026</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Types</span>
                  <span className="text-white font-bold">{cookieTypes.length} catégories</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Durée max.</span>
                  <span className="text-white font-bold">13 mois</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Données vendues</span>
                  <span className="text-[#3ecf4c] font-bold">Jamais</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14 sm:h-20 lg:h-24 block">
            <path d="M0,45 C200,90 400,10 720,50 C1000,85 1250,15 1440,45 L1440,90 L0,90 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-20">

        {/* What is a cookie */}
        <div className="pb-12 mb-12 border-b border-neutral-100">
          <div className="flex items-baseline gap-4 mb-5">
            <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0">§ 01</span>
            <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">Qu&apos;est-ce qu&apos;un cookie ?</h2>
          </div>
          <p className="text-[14px] text-neutral-500 leading-[1.8] pl-[calc(2.75rem)] max-w-3xl">
            Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette ou mobile) lors de votre visite sur notre site.
            Il permet de mémoriser vos préférences, d&apos;analyser notre trafic et d&apos;améliorer votre expérience d&apos;achat.
            Les cookies ne contiennent aucune information personnelle sensible et ne peuvent pas exécuter de programmes.
          </p>
        </div>

        {/* Cookie types */}
        <div className="mb-14">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0">§ 02</span>
            <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">Cookies que nous utilisons</h2>
          </div>

          <div className="pl-[calc(2.75rem)] divide-y divide-neutral-100 border border-neutral-100">
            {cookieTypes.map((c) => (
              <div key={c.name} className="p-7">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-[11px] font-black tabular-nums text-neutral-300">{c.num}</span>
                  <h3 className="font-black text-[15px] text-black">{c.name}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 ${c.essential ? "bg-[#3ecf4c] text-black" : "bg-neutral-100 text-neutral-500"}`}>
                    {c.tag}
                  </span>
                </div>
                <p className="text-[14px] text-neutral-500 leading-relaxed mb-4">{c.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {c.examples.map((ex) => (
                    <span key={ex} className="text-[11px] font-semibold border border-neutral-200 text-neutral-400 px-3 py-1">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-14">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0">§ 03</span>
            <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">Durée de conservation</h2>
          </div>
          <div className="pl-[calc(2.75rem)] grid sm:grid-cols-2 gap-px bg-neutral-200">
            <div className="bg-white p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400 mb-2">Cookies de session</p>
              <p className="font-black text-[15px] text-black mb-2">Temporaires</p>
              <p className="text-[13px] text-neutral-500 leading-relaxed">Supprimés automatiquement à la fermeture de votre navigateur.</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400 mb-2">Cookies persistants</p>
              <p className="font-black text-[15px] text-black mb-2">Jusqu&apos;à <span className="text-[#3ecf4c]">13 mois</span></p>
              <p className="text-[13px] text-neutral-500 leading-relaxed">Conservés sur votre appareil pour une durée maximale définie par chaque cookie.</p>
            </div>
          </div>
        </div>

        {/* Manage */}
        <div className="mb-14">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0">§ 04</span>
            <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">Gérer vos cookies</h2>
          </div>
          <div className="pl-[calc(2.75rem)]">
            <p className="text-[14px] text-neutral-500 leading-[1.8] mb-6 max-w-2xl">
              Vous pouvez à tout moment modifier vos préférences cookies via les paramètres de votre navigateur.
              La désactivation de certains cookies peut affecter le fonctionnement du site.
            </p>
            <div className="grid sm:grid-cols-4 gap-px bg-neutral-200">
              {["Chrome", "Firefox", "Safari", "Edge"].map((browser) => (
                <div key={browser} className="bg-white p-5">
                  <p className="font-black text-[13px] text-black mb-1">{browser}</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">Paramètres<br />→ Confidentialité</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="border-t-2 border-neutral-950 pt-10">
          <div className="bg-neutral-950 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3ecf4c] mb-2">Contact</p>
              <p className="font-black text-white text-[20px] leading-tight mb-1">Des questions sur nos cookies ?</p>
              <p className="text-white/40 text-[13px]">Notre équipe répond sous 48h ouvrées.</p>
            </div>
            <a
              href="mailto:contact@lecomax.com"
              className="shrink-0 bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-[0.18em] px-7 py-3.5 hover:bg-[#32b83d] transition-colors"
            >
              contact@lecomax.com
            </a>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-neutral-100">
          <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour à l&apos;accueil
          </Link>
          <Link href="/politique-confidentialite" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Confidentialité →</Link>
          <Link href="/conditions-utilisation" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Conditions →</Link>
        </div>

      </div>
    </div>
  );
}
