import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité | L'ecomax",
  description: "Comment L'ecomax collecte, utilise et protège vos données personnelles.",
  alternates: { canonical: "/politique-confidentialite/" },
};

const sections = [
  {
    id: "responsable", num: "01", title: "Responsable du traitement",
    body: "L'ecomax est responsable du traitement de vos données personnelles collectées via ce site. Pour toute question relative à vos données personnelles, vous pouvez nous contacter à contact@lecomax.com.",
    items: null, footer: null,
  },
  {
    id: "donnees", num: "02", title: "Données collectées", body: null,
    items: ["Informations d'identité : prénom, nom","Coordonnées : adresse email, numéro de téléphone, adresse postale","Données de transaction : historique des commandes, méthodes de paiement","Données de navigation : adresse IP, cookies, pages visitées"],
    footer: null,
  },
  {
    id: "finalites", num: "03", title: "Finalités du traitement", body: null,
    items: ["Traiter et livrer vos commandes","Gérer votre compte client","Vous envoyer des confirmations et notifications de commande","Améliorer notre site et nos services","Communications commerciales (sous réserve de votre consentement)","Prévenir la fraude et assurer la sécurité"],
    footer: null,
  },
  {
    id: "base-legale", num: "04", title: "Base légale", body: null,
    items: ["Exécution du contrat (traitement et suivi des commandes)","Votre consentement (communications marketing)","Notre intérêt légitime (amélioration du service, prévention de la fraude)","Respect d'obligations légales (comptabilité, facturation)"],
    footer: null,
  },
  {
    id: "conservation", num: "05", title: "Durée de conservation", body: null,
    items: ["Données de compte : tant que votre compte est actif","Données de transaction : 10 ans (obligations légales)","Données de navigation : 13 mois maximum"],
    footer: null,
  },
  {
    id: "partage", num: "06", title: "Partage des données",
    body: "Vos données peuvent être partagées avec nos prestataires de services (transporteurs, prestataires de paiement, hébergeurs). Ces partenaires sont contractuellement tenus à la confidentialité. Nous ne vendons jamais vos données personnelles à des tiers.",
    items: null, footer: null,
  },
  {
    id: "cookies", num: "07", title: "Cookies",
    body: "Notre site utilise des cookies pour améliorer votre expérience, mémoriser vos préférences et analyser notre trafic. Les cookies publicitaires ne sont déposés qu'avec votre consentement explicite.",
    items: null, footer: null,
  },
  {
    id: "droits", num: "08", title: "Vos droits", body: null,
    items: ["Droit d'accès à vos données personnelles","Droit de rectification des données inexactes","Droit à l'effacement (droit à l'oubli)","Droit à la limitation du traitement","Droit à la portabilité des données","Droit d'opposition au traitement"],
    footer: "Pour exercer ces droits, contactez-nous à contact@lecomax.com en joignant une copie de votre pièce d'identité.",
  },
  {
    id: "securite", num: "09", title: "Sécurité des données",
    body: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé. Les transmissions de données sensibles sont systématiquement chiffrées via protocole SSL/TLS.",
    items: null, footer: null,
  },
  {
    id: "modifications", num: "10", title: "Modifications de la politique",
    body: "Nous nous réservons le droit de modifier la présente politique à tout moment. Toute modification sera publiée sur cette page accompagnée de sa date d'entrée en vigueur.",
    items: null, footer: null,
  },
];

export default function PolitiqueConfidentialitePage() {
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
            <span className="text-white/60">Confidentialité</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-px h-8 bg-[#3ecf4c]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3ecf4c]">Document légal</span>
              </div>
              <h1 className="font-black text-white leading-[1.02] mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)", letterSpacing: "-0.03em" }}>
                Politique de<br />confidentialité
              </h1>
              <p className="text-white/45 text-[15px] max-w-sm leading-relaxed">
                La protection de vos données personnelles est une priorité absolue pour L&apos;ecomax.
              </p>
            </div>

            {/* meta card */}
            <div className="shrink-0 border border-white/10 bg-white/[0.04] px-6 py-5 lg:min-w-[220px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Informations</p>
              <div className="space-y-2.5">
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Version</span>
                  <span className="text-white font-bold">1.3</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Mise à jour</span>
                  <span className="text-white font-bold">28 avr. 2026</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Juridiction</span>
                  <span className="text-white font-bold">Maroc</span>
                </div>
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Articles</span>
                  <span className="text-white font-bold">{sections.length}</span>
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
        <div className="flex gap-14">

          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-5">Sommaire</p>
              <ul className="space-y-px">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex items-center gap-3 text-[12px] text-neutral-400 hover:text-black transition-colors py-1.5 group"
                    >
                      <span className="text-[10px] font-black text-neutral-300 group-hover:text-[#3ecf4c] transition-colors tabular-nums w-5 shrink-0">
                        {s.num}
                      </span>
                      <span className="group-hover:translate-x-0.5 transition-transform">{s.title}</span>
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-neutral-100">
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Des questions ?{" "}
                  <a href="mailto:contact@lecomax.com" className="text-[#3ecf4c] hover:underline font-semibold">
                    Contactez-nous
                  </a>
                </p>
              </div>
            </div>
          </aside>

          {/* Articles */}
          <div className="flex-1 min-w-0">
            <div className="divide-y divide-neutral-100">
              {sections.map((s) => (
                <div key={s.id} id={s.id} className="py-10 first:pt-0 scroll-mt-24">
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="text-[11px] font-black text-[#3ecf4c] tabular-nums shrink-0 leading-none">ART. {s.num}</span>
                    <h2 className="font-black text-[17px] text-black leading-tight tracking-tight">{s.title}</h2>
                  </div>

                  {s.body && (
                    <p className="text-[14px] text-neutral-500 leading-[1.8] pl-[calc(2.75rem)]">{s.body}</p>
                  )}

                  {s.items && (
                    <ul className="space-y-3 pl-[calc(2.75rem)]">
                      {s.items.map((item: string) => (
                        <li key={item} className="flex items-start gap-3 text-[14px] text-neutral-500 leading-relaxed">
                          <span className="mt-2.5 w-4 h-px bg-[#3ecf4c] shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.footer && (
                    <div className="mt-5 pl-[calc(2.75rem)]">
                      <div className="border-l-2 border-[#3ecf4c] pl-4 py-1">
                        <p className="text-[13px] text-neutral-500 leading-relaxed">{s.footer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-4 border-t-2 border-neutral-950 pt-10">
              <div className="bg-neutral-950 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3ecf4c] mb-2">Exercer vos droits</p>
                  <p className="font-black text-white text-[20px] leading-tight mb-1">Une question sur vos données ?</p>
                  <p className="text-white/40 text-[13px]">Notre DPO répond sous 48h ouvrées.</p>
                </div>
                <a
                  href="mailto:contact@lecomax.com"
                  className="shrink-0 bg-[#3ecf4c] text-black font-black text-[11px] uppercase tracking-[0.18em] px-7 py-3.5 hover:bg-[#32b83d] transition-colors"
                >
                  contact@lecomax.com
                </a>
              </div>
            </div>

            {/* nav links */}
            <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-neutral-100">
              <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Retour à l&apos;accueil
              </Link>
              <Link href="/conditions-utilisation" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
                Conditions d&apos;utilisation →
              </Link>
              <Link href="/cookies" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
                Cookies →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
