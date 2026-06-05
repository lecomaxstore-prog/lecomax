import Link from "next/link";

const topics = [
  {
    label: "Commandes",
    desc: "Passer, modifier, annuler",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    label: "Livraison",
    desc: "Délais, frais, zones",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    label: "Retours",
    desc: "Politique, procédure",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
      </svg>
    ),
  },
  {
    label: "Paiement",
    desc: "Modes, sécurité",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    label: "Mon compte",
    desc: "Inscription, connexion",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
      </svg>
    ),
  },
  {
    label: "ecoClub",
    desc: "Points, avantages",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
];

const faqs = [
  {
    question: "Comment passer une commande ?",
    answer:
      "Parcourez nos produits, ajoutez vos articles au panier, puis suivez les étapes de validation. Vous recevrez un e-mail de confirmation dès que votre commande sera enregistrée.",
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer:
      "La livraison standard prend 3 à 5 jours ouvrables au Maroc. Les frais de livraison sont de 35 MAD. La livraison est gratuite pour Sidi Bennour.",
  },
  {
    question: "Comment retourner un article ?",
    answer:
      "Vous disposez de 30 jours après réception pour retourner un article. L'article doit être dans son état d'origine avec ses étiquettes. Contactez notre service client pour initier le retour.",
  },
  {
    question: "Quels modes de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard), le paiement à la livraison (cash), et le virement bancaire. Tous les paiements en ligne sont sécurisés.",
  },
  {
    question: "Comment suivre ma commande ?",
    answer:
      "Une fois votre commande expédiée, vous recevrez un e-mail avec un numéro de suivi. Vous pouvez aussi consulter l'état de votre commande sur la page Suivre la commande.",
  },
  {
    question: "Puis-je modifier ou annuler ma commande ?",
    answer:
      "Les commandes peuvent être modifiées ou annulées dans l'heure suivant leur passage. Passé ce délai, contactez notre service client et nous ferons notre possible.",
  },
];

export default function AidePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-14">
        <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-400 mb-3">Support</p>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">
          Centre d&apos;aide
        </h1>
        <div className="w-12 h-[3px] bg-black mt-4 mb-4" />
        <p className="text-neutral-500 text-[15px]">
          Comment pouvons-nous vous aider ?
        </p>
      </div>

      {/* Topic cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-16">
        {topics.map((t) => (
          <div
            key={t.label}
            className="group border border-neutral-200 p-5 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer"
          >
            <span className="text-neutral-700 group-hover:text-black transition-colors">
              {t.icon}
            </span>
            <p className="font-black text-[13px] uppercase tracking-wide mt-4 mb-1">{t.label}</p>
            <p className="text-neutral-400 text-[12px]">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
          Questions fréquentes
        </h2>
        <div className="w-8 h-[3px] bg-black mb-8" />
        <div className="divide-y divide-neutral-100">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-bold text-[15px] pr-6">{faq.question}</span>
                <span className="flex-shrink-0 w-6 h-6 border border-neutral-200 flex items-center justify-center text-neutral-400 group-open:bg-black group-open:border-black group-open:text-white transition-all text-lg leading-none select-none">
                  +
                </span>
              </summary>
              <p className="mt-4 text-neutral-500 text-[14px] leading-relaxed pr-10">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-neutral-950 text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="font-black text-xl uppercase tracking-wide mb-1">
            Besoin d&apos;aide supplémentaire ?
          </p>
          <p className="text-white/50 text-[14px]">
            Notre équipe répond en moins de 2h, 7j/7.
          </p>
        </div>
        <a
          href="mailto:contact@lecomax.com"
          className="self-start md:self-auto bg-white text-black px-6 py-3.5 font-black uppercase text-[12px] tracking-wider hover:bg-neutral-100 transition-colors whitespace-nowrap inline-flex items-center gap-2"
        >
          Contacter le support
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>

    </div>
  );
}
