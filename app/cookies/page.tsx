import Link from "next/link";

export const metadata = {
  title: "Politique de Cookies | L'ecomax",
  description: "Comment L'ecomax utilise les cookies pour améliorer votre expérience.",
};

const cookieTypes = [
  {
    icon: "⚙️",
    name: "Cookies essentiels",
    tag: "Toujours actifs",
    tagColor: "bg-[#3ecf4c] text-black",
    desc: "Indispensables au fonctionnement du site. Ils permettent de conserver votre panier, votre session de connexion et vos préférences de base. Ces cookies ne peuvent pas être désactivés.",
    examples: ["Panier d'achat", "Session utilisateur", "Sécurité (CSRF)", "Paramètres de langue"],
  },
  {
    icon: "📊",
    name: "Cookies de performance",
    tag: "Opt-in",
    tagColor: "bg-neutral-100 text-neutral-600",
    desc: "Nous aident à comprendre comment les visiteurs interagissent avec notre site. Les données sont collectées de façon anonyme et nous permettent d'améliorer continuellement le site.",
    examples: ["Pages vues", "Temps de visite", "Sources de trafic", "Taux de rebond"],
  },
  {
    icon: "🎯",
    name: "Cookies de préférences",
    tag: "Opt-in",
    tagColor: "bg-neutral-100 text-neutral-600",
    desc: "Permettent au site de mémoriser vos choix pour vous offrir une expérience personnalisée lors de vos prochaines visites.",
    examples: ["Taille favorite", "Couleur préférée", "Historique récent", "Newsletter"],
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/50">Légal</span>
            <span>/</span>
            <span className="text-white/70">Cookies</span>
          </nav>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-[#3ecf4c] text-black px-3 py-1 rounded-full">
            Légal
          </span>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mt-5 mb-5">
            Politique de<br />
            <span className="text-[#3ecf4c]">cookies</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl leading-relaxed">
            Nous utilisons des cookies pour vous offrir la meilleure expérience possible.
            Voici comment et pourquoi.
          </p>
          <p className="text-white/30 text-xs mt-5 font-mono">Dernière mise à jour : avril 2026</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20 space-y-14">

        {/* What is a cookie */}
        <section>
          <div className="border border-neutral-100 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#3ecf4c]/10 rounded-xl flex items-center justify-center text-xl">🍪</div>
              <h2 className="font-black text-xl uppercase tracking-tight">Qu&apos;est-ce qu&apos;un cookie ?</h2>
            </div>
            <p className="text-[14px] text-neutral-600 leading-relaxed max-w-3xl">
              Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette ou mobile) lors de votre visite sur notre site.
              Il permet de mémoriser vos préférences, d&apos;analyser notre trafic et d&apos;améliorer votre expérience d&apos;achat.
              Les cookies ne contiennent aucune information personnelle sensible et ne peuvent pas lancer de programmes.
            </p>
          </div>
        </section>

        {/* Cookie types */}
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Types</p>
          <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight mb-8">Cookies que nous utilisons</h2>
          <div className="space-y-5">
            {cookieTypes.map((c) => (
              <div key={c.name} className="border border-neutral-100 rounded-2xl p-7 hover:border-neutral-200 transition-colors">
                <div className="flex flex-wrap items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-xl shrink-0">{c.icon}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-black text-[16px]">{c.name}</h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${c.tagColor}`}>
                        {c.tag}
                      </span>
                    </div>
                    <p className="text-[14px] text-neutral-600 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {c.examples.map((ex) => (
                    <span key={ex} className="text-[11px] font-semibold bg-neutral-50 border border-neutral-100 text-neutral-500 px-3 py-1 rounded-full">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Duration */}
        <section className="bg-neutral-50 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#3ecf4c]/10 rounded-xl flex items-center justify-center text-xl">⏱️</div>
            <h2 className="font-black text-xl uppercase tracking-tight">Durée de conservation</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-neutral-100">
              <p className="font-black text-[13px] uppercase tracking-wide mb-1">Cookies de session</p>
              <p className="text-[14px] text-neutral-600">Supprimés automatiquement à la fermeture de votre navigateur.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-neutral-100">
              <p className="font-black text-[13px] uppercase tracking-wide mb-1">Cookies persistants</p>
              <p className="text-[14px] text-neutral-600">Conservés sur votre appareil pour une durée maximale de <strong>13 mois</strong>.</p>
            </div>
          </div>
        </section>

        {/* Manage */}
        <section className="border border-neutral-100 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#3ecf4c]/10 rounded-xl flex items-center justify-center text-xl">⚙️</div>
            <h2 className="font-black text-xl uppercase tracking-tight">Gérer vos cookies</h2>
          </div>
          <p className="text-[14px] text-neutral-600 leading-relaxed mb-5">
            Vous pouvez à tout moment modifier vos préférences cookies via les paramètres de votre navigateur.
            Notez que la désactivation de certains cookies peut affecter le fonctionnement du site.
          </p>
          <div className="grid sm:grid-cols-4 gap-3">
            {["Chrome", "Firefox", "Safari", "Edge"].map((browser) => (
              <div key={browser} className="bg-neutral-50 rounded-xl p-4 text-center border border-neutral-100">
                <p className="font-black text-[13px]">{browser}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Paramètres → Confidentialité</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-neutral-950 text-white p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-1">Questions ?</p>
            <p className="font-black text-[18px]">Contactez-nous</p>
            <p className="text-white/50 text-sm mt-1">On répond sous 48h ouvrées.</p>
          </div>
          <a href="mailto:contact@lecomax.com" className="shrink-0 bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#32b83d] transition-colors">
            contact@lecomax.com
          </a>
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-neutral-100">
          <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour à l&apos;accueil
          </Link>
          <Link href="/politique-confidentialite" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Confidentialité →</Link>
          <Link href="/conditions-utilisation" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Conditions →</Link>
        </div>

      </div>
    </div>
  );
}
