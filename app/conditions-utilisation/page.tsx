import Link from "next/link";

export const metadata = {
  title: "Conditions d'utilisation | L'ecomax",
  description: "Les conditions générales d'utilisation du site L'ecomax.",
};

const sections = [
  {
    id: "acceptation",
    num: "01",
    title: "Acceptation des conditions",
    body: "En accédant et en utilisant lecomax.com, vous acceptez d'être lié par les présentes conditions générales d'utilisation. Si vous n'acceptez pas l'intégralité de ces conditions, veuillez cesser d'utiliser ce site immédiatement.",
    items: null,
  },
  {
    id: "utilisation",
    num: "02",
    title: "Utilisation du site",
    body: "Le site L'ecomax est destiné exclusivement à un usage personnel et non commercial. Vous vous engagez à ne pas l'utiliser à des fins illégales, frauduleuses ou contraires aux présentes conditions. Vous êtes seul responsable de toutes les activités réalisées sous votre compte.",
    items: null,
  },
  {
    id: "compte",
    num: "03",
    title: "Compte utilisateur",
    body: "Pour accéder à certaines fonctionnalités, la création d'un compte est requise. Vous êtes responsable de la confidentialité de vos identifiants et devez nous informer sans délai de toute utilisation non autorisée de votre compte.",
    items: null,
  },
  {
    id: "commandes",
    num: "04",
    title: "Commandes et paiements",
    items: [
      "Toutes les informations fournies lors d'une commande doivent être exactes et complètes",
      "Nous nous réservons le droit d'annuler une commande en cas de rupture de stock, d'erreur de prix ou de suspicion de fraude",
      "Les prix sont exprimés en Dirhams marocains (MAD), TVA incluse",
      "Toutes les transactions sont sécurisées via protocole SSL/TLS",
    ],
    body: null,
  },
  {
    id: "livraison",
    num: "05",
    title: "Livraison",
    items: [
      "Délai de livraison estimé : 3 à 5 jours ouvrables sur l'ensemble du territoire marocain",
      "Frais de livraison : 35 MAD — offerts à partir de 500 MAD d'achats",
      "L'ecomax ne saurait être tenu responsable des retards imputables aux transporteurs",
      "Service disponible dans toutes les régions du Maroc",
    ],
    body: null,
  },
  {
    id: "retours",
    num: "06",
    title: "Retours et remboursements",
    items: [
      "Délai de retour : 30 jours à compter de la réception, article non utilisé dans son emballage d'origine",
      "Remboursement effectué sous 5 à 7 jours ouvrables après validation du retour",
      "Les frais de retour sont à la charge du client, sauf en cas de défaut imputable à L'ecomax",
      "Échange possible contre une autre taille ou coloris sous réserve de disponibilité",
    ],
    body: null,
  },
  {
    id: "propriete",
    num: "07",
    title: "Propriété intellectuelle",
    body: "L'ensemble des contenus publiés sur ce site — textes, photographies, logos, vidéos et éléments graphiques — est la propriété exclusive de L'ecomax ou de ses partenaires. Toute reproduction, distribution ou exploitation sans autorisation écrite préalable est strictement prohibée.",
    items: null,
  },
  {
    id: "responsabilite",
    num: "08",
    title: "Limitation de responsabilité",
    body: "L'ecomax ne saurait être tenu responsable de tout dommage direct ou indirect résultant de l'utilisation ou de l'impossibilité d'utiliser ce site, y compris les pertes de données, interruptions de service ou tout préjudice commercial.",
    items: null,
  },
  {
    id: "modifications",
    num: "09",
    title: "Modification des conditions",
    body: "L'ecomax se réserve le droit de modifier les présentes conditions à tout moment. Les modifications entrent en vigueur dès leur publication sur le site. Il appartient à l'utilisateur de les consulter régulièrement.",
    items: null,
  },
  {
    id: "droit",
    num: "10",
    title: "Droit applicable",
    body: "Les présentes conditions générales d'utilisation sont régies par le droit marocain. Tout litige relatif à leur interprétation ou exécution sera soumis à la compétence exclusive des tribunaux de Casablanca, Maroc.",
    items: null,
  },
];

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative w-full bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(62,207,76,0.06) 0%, transparent 60%)" }} />

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-16 lg:pt-20 lg:pb-28">
          {/* breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-10">
            <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
            <span className="text-white/15">/</span>
            <span className="text-white/40">Légal</span>
            <span className="text-white/15">/</span>
            <span className="text-white/60">Conditions</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-px h-8 bg-[#3ecf4c]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3ecf4c]">Document légal</span>
              </div>
              <h1 className="font-black text-white leading-[1.02] mb-4" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)", letterSpacing: "-0.03em" }}>
                Conditions<br />d&apos;utilisation
              </h1>
              <p className="text-white/45 text-[15px] max-w-sm leading-relaxed">
                Veuillez lire attentivement ces conditions avant d&apos;utiliser notre site ou de passer une commande.
              </p>
            </div>

            {/* meta card */}
            <div className="shrink-0 border border-white/10 bg-white/[0.04] px-6 py-5 lg:min-w-[220px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Informations</p>
              <div className="space-y-2.5">
                <div className="flex justify-between gap-8 text-[12px]">
                  <span className="text-white/40">Version</span>
                  <span className="text-white font-bold">2.1</span>
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
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-4 border-t-2 border-neutral-950 pt-10">
              <div className="bg-neutral-950 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3ecf4c] mb-2">Contact</p>
                  <p className="font-black text-white text-[20px] leading-tight mb-1">Une question juridique ?</p>
                  <p className="text-white/40 text-[13px]">Notre équipe répond sous 2h, 7j/7.</p>
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
              <Link href="/politique-confidentialite" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
                Politique de confidentialité →
              </Link>
              <Link href="/retours" className="text-[12px] font-bold text-neutral-400 hover:text-black transition-colors">
                Politique de retours →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
