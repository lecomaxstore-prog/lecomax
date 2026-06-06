import Link from "next/link";

export const metadata = {
  title: "Conditions d'utilisation | L'ecomax",
  description: "Les conditions générales d'utilisation du site L'ecomax.",
};

const sections = [
  {
    id: "acceptation", icon: "✅", title: "Acceptation des conditions",
    body: "En accédant et en utilisant lecomax.com, vous acceptez d'être lié par les présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser ce site.",
    items: null,
  },
  {
    id: "utilisation", icon: "🖥️", title: "Utilisation du site",
    body: "Le site L'ecomax est destiné à un usage personnel et non commercial. Vous vous engagez à ne pas utiliser ce site à des fins illégales. Vous êtes responsable de toutes les activités réalisées sous votre compte.",
    items: null,
  },
  {
    id: "compte", icon: "👤", title: "Compte utilisateur",
    body: "Pour accéder à certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos identifiants et de nous informer de toute utilisation non autorisée.",
    items: null,
  },
  {
    id: "commandes", icon: "🛒", title: "Commandes et paiements",
    items: ["Toutes les informations fournies doivent être exactes et complètes","Nous pouvons annuler une commande pour rupture de stock, erreur de prix ou suspicion de fraude","Les prix sont en Dirhams marocains (MAD) TVA incluse","Le paiement est sécurisé (SSL/TLS)"],
    body: null,
  },
  {
    id: "livraison", icon: "🚚", title: "Livraison",
    items: ["Délais de livraison : 3 à 5 jours ouvrables au Maroc","Frais de port : 35 MAD (offerts dès 500 MAD d'achats)","Nous ne sommes pas responsables des retards causés par les transporteurs","Livraison disponible dans tout le Maroc"],
    body: null,
  },
  {
    id: "retours", icon: "↩️", title: "Retours et remboursements",
    items: ["30 jours pour retourner un article non utilisé dans son emballage d'origine","Remboursement sous 5 à 7 jours ouvrables après validation du retour","Les frais de retour sont à votre charge sauf défaut de notre part","Échange possible contre une autre taille ou couleur"],
    body: null,
  },
  {
    id: "propriete", icon: "©️", title: "Propriété intellectuelle",
    body: "Tout le contenu de ce site (textes, images, logos, vidéos) est la propriété exclusive de L'ecomax. Toute reproduction ou utilisation sans autorisation écrite préalable est strictement interdite.",
    items: null,
  },
  {
    id: "responsabilite", icon: "⚠️", title: "Limitation de responsabilité",
    body: "L'ecomax ne saurait être tenu responsable de tout dommage direct ou indirect résultant de l'utilisation ou de l'impossibilité d'utiliser ce site, y compris les pertes de données ou interruptions de service.",
    items: null,
  },
  {
    id: "modifications", icon: "📝", title: "Modification des conditions",
    body: "L'ecomax se réserve le droit de modifier ces conditions à tout moment. Les modifications prennent effet dès leur publication. Il est de votre responsabilité de les consulter régulièrement.",
    items: null,
  },
  {
    id: "droit", icon: "⚖️", title: "Droit applicable",
    body: "Les présentes conditions sont régies par le droit marocain. Tout litige sera soumis aux tribunaux compétents de Casablanca, Maroc.",
    items: null,
  },
];

export default function ConditionsUtilisationPage() {
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
            <span className="text-white/70">Conditions</span>
          </nav>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-[#3ecf4c] text-black px-3 py-1 rounded-full">
            Légal
          </span>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mt-5 mb-5">
            Conditions<br />
            <span className="text-[#3ecf4c]">d&apos;utilisation</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl leading-relaxed">
            Veuillez lire attentivement ces conditions avant d&apos;utiliser notre site ou de passer une commande.
          </p>
          <p className="text-white/30 text-xs mt-5 font-mono">Dernière mise à jour : 28 avril 2026</p>
        </div>
      </div>

      {/* Quick info bar */}
      <div className="border-b border-neutral-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap gap-6">
          {[
            { icon: "🔒", text: "Paiement sécurisé" },
            { icon: "🚚", text: "Livraison 3–5 jours" },
            { icon: "↩️", text: "Retour 30 jours" },
            { icon: "🇲🇦", text: "Droit marocain" },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-[12px] text-neutral-500 font-medium">
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex gap-12">

          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Sommaire</p>
              <ul className="space-y-1">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex items-center gap-2 text-[12px] text-neutral-400 hover:text-black transition-colors py-1 group">
                      <span className="w-5 h-5 bg-neutral-100 group-hover:bg-[#3ecf4c] group-hover:text-black text-neutral-500 rounded-full flex items-center justify-center text-[10px] font-black transition-all">
                        {i + 1}
                      </span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="space-y-5">
              {sections.map((s, i) => (
                <div key={s.id} id={s.id} className="border border-neutral-100 rounded-2xl p-6 sm:p-8 hover:border-neutral-200 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#3ecf4c]/10 rounded-xl flex items-center justify-center text-lg shrink-0">{s.icon}</div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c]">Article {i + 1}</span>
                      <h2 className="font-black text-[16px] text-black leading-tight">{s.title}</h2>
                    </div>
                  </div>
                  {s.body && <p className="text-[14px] text-neutral-600 leading-relaxed">{s.body}</p>}
                  {s.items && (
                    <ul className="space-y-2 mt-2">
                      {s.items.map((item: string) => (
                        <li key={item} className="flex items-start gap-3 text-[14px] text-neutral-600">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3ecf4c] shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 rounded-2xl bg-neutral-950 text-white p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-1">Des questions ?</p>
                <p className="font-black text-[18px]">On est là pour vous aider</p>
                <p className="text-white/50 text-sm mt-1">Réponse garantie sous 2h, 7j/7.</p>
              </div>
              <a href="mailto:support@lecomax.com" className="shrink-0 bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#32b83d] transition-colors">
                support@lecomax.com
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-neutral-100">
              <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Retour à l&apos;accueil
              </Link>
              <Link href="/politique-confidentialite" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Confidentialité →</Link>
              <Link href="/retours" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Politique de retours →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
