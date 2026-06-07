import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité | L'ecomax",
  description: "Comment L'ecomax collecte, utilise et protège vos données personnelles.",
};

const sections = [
  {
    id: "responsable", icon: "🏢", title: "Responsable du traitement",
    body: "L'ecomax est responsable du traitement de vos données personnelles collectées via ce site. Pour toute question relative à vos données, vous pouvez nous contacter à privacy@lecomax.com.",
    items: null, footer: null,
  },
  {
    id: "donnees", icon: "📋", title: "Données collectées", body: null,
    items: ["Informations d'identité : prénom, nom","Coordonnées : email, téléphone, adresse postale","Données de transaction : historique des commandes, méthodes de paiement","Données de navigation : adresse IP, cookies, pages visitées"],
    footer: null,
  },
  {
    id: "finalites", icon: "🎯", title: "Finalités du traitement", body: null,
    items: ["Traiter et livrer vos commandes","Gérer votre compte client","Vous envoyer des confirmations et notifications","Améliorer notre site et nos services","Communications commerciales (avec votre consentement)","Prévenir la fraude et assurer la sécurité"],
    footer: null,
  },
  {
    id: "base-legale", icon: "⚖️", title: "Base légale", body: null,
    items: ["Exécution du contrat (traitement des commandes)","Votre consentement (communications marketing)","Notre intérêt légitime (amélioration du service, sécurité)","Respect d'obligations légales (comptabilité, facturation)"],
    footer: null,
  },
  {
    id: "conservation", icon: "🗓️", title: "Durée de conservation", body: null,
    items: ["Données de compte : tant que votre compte est actif","Données de transaction : 10 ans (obligations légales)","Données de navigation : 13 mois maximum"],
    footer: null,
  },
  {
    id: "partage", icon: "🤝", title: "Partage des données",
    body: "Vos données peuvent être partagées avec nos prestataires (transporteurs, paiement, hébergeurs). Ces partenaires sont contractuellement tenus au secret. Nous ne vendons jamais vos données personnelles à des tiers.",
    items: null, footer: null,
  },
  {
    id: "cookies", icon: "🍪", title: "Cookies",
    body: "Notre site utilise des cookies pour améliorer votre expérience, mémoriser vos préférences et analyser notre trafic. Les cookies publicitaires ne sont déposés qu'avec votre consentement.",
    items: null, footer: null,
  },
  {
    id: "droits", icon: "🔐", title: "Vos droits", body: null,
    items: ["Droit d'accès à vos données","Droit de rectification","Droit à l'effacement (droit à l'oubli)","Droit à la limitation du traitement","Droit à la portabilité","Droit d'opposition"],
    footer: "Pour exercer ces droits, contactez-nous à privacy@lecomax.com avec une copie de votre pièce d'identité.",
  },
  {
    id: "securite", icon: "🛡️", title: "Sécurité",
    body: "Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données. Les transmissions de données sensibles sont chiffrées via SSL/TLS.",
    items: null, footer: null,
  },
  {
    id: "modifications", icon: "📝", title: "Modifications",
    body: "Nous nous réservons le droit de modifier cette politique à tout moment. Les modifications seront publiées sur cette page avec la date de mise à jour.",
    items: null, footer: null,
  },
];

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1128 0%, #0c1a2e 40%, #081420 100%)" }}>
        <div className="absolute right-0 top-0 w-[55%] h-full pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 45%, rgba(62,207,76,0.07) 0%, transparent 55%)" }} />
        <div className="absolute left-[-10%] bottom-[-10%] w-[60%] h-[70%] pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(20,60,160,0.18) 0%, transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 pt-20 pb-36 lg:pt-24 lg:pb-44">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-10">
            <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
            <span className="text-white/15">/</span>
            <span className="text-white/40">Légal</span>
            <span className="text-white/15">/</span>
            <span className="text-white/60">Confidentialité</span>
          </nav>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold bg-white/[0.07] border border-white/15 text-white/70 px-4 py-2 rounded-full w-fit mb-8">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3ecf4c]"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Légal &amp; Confidentialité
          </span>
          <h1 className="font-black leading-[1.05] mb-6 text-white" style={{ fontSize: "clamp(2.6rem,5vw,4.5rem)", letterSpacing: "-0.03em" }}>
            Politique de<br /><span className="text-[#3ecf4c]">confidentialité</span>
          </h1>
          <p className="text-white/45 text-base max-w-md leading-relaxed mb-3">
            La protection de vos données personnelles est une priorité absolue pour L&apos;ecomax.
          </p>
          <p className="text-white/25 text-xs font-mono">Dernière mise à jour : 28 avril 2026</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14 sm:h-18 lg:h-24 block">
            <path d="M0,45 C200,90 400,10 720,50 C1000,85 1250,15 1440,45 L1440,90 L0,90 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-b border-neutral-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap gap-6">
          {[
            { icon: "🔒", text: "Chiffrement SSL/TLS" },
            { icon: "🇲🇦", text: "Conforme droit marocain" },
            { icon: "🚫", text: "Aucune vente de données" },
            { icon: "✉️", text: "privacy@lecomax.com" },
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
                  {s.footer && (
                    <p className="mt-4 text-[13px] text-neutral-500 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">{s.footer}</p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 rounded-2xl bg-neutral-950 text-white p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-1">Exercer vos droits</p>
                <p className="font-black text-[18px]">Vous avez des questions ?</p>
                <p className="text-white/50 text-sm mt-1">Notre DPO répond sous 48h ouvrées.</p>
              </div>
              <a href="mailto:privacy@lecomax.com" className="shrink-0 bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#32b83d] transition-colors">
                privacy@lecomax.com
              </a>
            </div>

            {/* Footer links */}
            <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-neutral-100">
              <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Retour à l&apos;accueil
              </Link>
              <Link href="/conditions-utilisation/" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Conditions d&apos;utilisation →</Link>
              <Link href="/cookies/" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">Cookies →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
