"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ReturnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
  </svg>
);
const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const topics = [
  { id: "commandes", icon: <CartIcon />, label: "Commandes", desc: "Passer, modifier, annuler" },
  { id: "livraison", icon: <TruckIcon />, label: "Livraison", desc: "Délais, frais, zones" },
  { id: "retours",   icon: <ReturnIcon />, label: "Retours", desc: "Politique, procédure" },
  { id: "paiement",  icon: <CardIcon />, label: "Paiement", desc: "Modes, sécurité" },
  { id: "compte",    icon: <UserIcon />, label: "Mon compte", desc: "Inscription, connexion" },
  { id: "ecoclub",   icon: <StarIcon />, label: "ecoClub", desc: "Points, avantages" },
];

const faqGroups = [
  {
    id: "commandes",
    label: "Commandes",
    faqs: [
      { q: "Comment passer une commande ?", a: "Parcourez nos produits, ajoutez vos articles au panier, puis suivez les étapes de validation. Vous recevrez un e-mail de confirmation dès que votre commande sera enregistrée." },
      { q: "Puis-je modifier ou annuler ma commande ?", a: "Les commandes peuvent être modifiées ou annulées dans l'heure suivant leur passage. Passé ce délai, contactez notre service client et nous ferons notre possible." },
      { q: "Comment suivre ma commande ?", a: "Une fois votre commande expédiée, vous recevrez un e-mail avec un numéro de suivi. Vous pouvez aussi consulter l'état de votre commande sur la page Suivre la commande." },
    ],
  },
  {
    id: "livraison",
    label: "Livraison",
    faqs: [
      { q: "Quels sont les délais de livraison ?", a: "La livraison standard prend 3 à 5 jours ouvrables partout au Maroc. Les frais de livraison sont de 35 MAD (offerts dès 500 MAD d'achats)." },
      { q: "Livrez-vous à Sidi Bennour ?", a: "Oui, nous livrons dans toute la province de Doukkala-Abda y compris Sidi Bennour, El Jadida et les communes avoisinantes. Vous pouvez aussi passer en boutique." },
      { q: "Puis-je changer l'adresse de livraison ?", a: "Oui, vous pouvez modifier l'adresse de livraison avant l'expédition de votre commande. Contactez notre support dès que possible." },
    ],
  },
  {
    id: "retours",
    label: "Retours",
    faqs: [
      { q: "Comment retourner un article ?", a: "Vous disposez de 30 jours après réception pour retourner un article dans son état d'origine avec ses étiquettes. Connectez-vous à votre compte pour initier le retour." },
      { q: "Quand serai-je remboursé ?", a: "Une fois le retour reçu et validé, votre remboursement est traité sous 5 à 7 jours ouvrés sur le moyen de paiement d'origine." },
      { q: "Les frais de retour sont-ils à ma charge ?", a: "Les frais de retour sont à votre charge sauf en cas d'erreur de notre part ou de produit défectueux, auquel cas nous prenons tout en charge." },
    ],
  },
  {
    id: "paiement",
    label: "Paiement",
    faqs: [
      { q: "Quels modes de paiement acceptez-vous ?", a: "Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et le paiement à la livraison (cash). Tous les paiements en ligne sont sécurisés SSL/TLS." },
      { q: "Le paiement en ligne est-il sécurisé ?", a: "Absolument. Toutes les transactions sont chiffrées via SSL/TLS. Nous ne stockons jamais vos données de carte bancaire." },
      { q: "Puis-je payer à la livraison ?", a: "Oui, le paiement en espèces à la livraison (cash on delivery) est disponible partout au Maroc. Préparez le montant exact si possible." },
    ],
  },
  {
    id: "compte",
    label: "Mon compte",
    faqs: [
      { q: "Comment créer un compte ?", a: "Cliquez sur l'icône profil en haut de page et sélectionnez « Créer un compte ». Renseignez votre email et choisissez un mot de passe sécurisé." },
      { q: "J'ai oublié mon mot de passe.", a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ? ». Un email de réinitialisation vous sera envoyé dans les minutes suivantes." },
    ],
  },
  {
    id: "ecoclub",
    label: "ecoClub",
    faqs: [
      { q: "Comment fonctionne le programme ecoClub ?", a: "Chaque achat vous rapporte des points. 10 MAD dépensés = 1 point. Dès 100 points, profitez de réductions exclusives et d'avant-premières." },
      { q: "Comment voir mes points ?", a: "Vos points sont visibles dans votre espace compte, section ecoClub. Ils sont mis à jour automatiquement après chaque commande validée." },
    ],
  },
];

export default function AidePage() {
  const [activeGroup, setActiveGroup] = useState("commandes");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const current = faqGroups.find((g) => g.id === activeGroup)!;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero – split layout ── */}
      <div className="relative flex flex-col lg:flex-row w-full" style={{ minHeight: "78vh" }}>

        {/* Mobile: full-bleed background photo */}
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="/images/pages/carrieres.png"
            alt="Centre d'aide L'ecomax"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-neutral-950/65 to-neutral-950/85" />
        </div>

        {/* Left – dark text panel */}
        <div className="relative z-10 w-full lg:w-[46%] shrink-0 bg-transparent lg:bg-neutral-950 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 py-24 lg:py-28">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-10">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">Centre d&apos;aide</span>
          </nav>

          <h1 className="font-black text-[clamp(3.5rem,8vw,7rem)] uppercase tracking-tighter leading-none mb-6 drop-shadow-lg text-white">
            Centre<br />
            <span className="text-[#3ecf4c]">d&apos;aide</span>
          </h1>

          <p className="text-white/50 text-sm sm:text-base max-w-xs leading-relaxed mb-10">
            Trouvez rapidement des réponses à vos questions.<br />
            Notre équipe est aussi disponible 7j/7.
          </p>

          {/* Mobile: compact topic list */}
          <div className="flex flex-col gap-3 lg:hidden">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveGroup(t.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                  activeGroup === t.id
                    ? "border-[#3ecf4c] bg-[#3ecf4c]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  {t.icon}
                </div>
                <div className="text-left">
                  <p className="font-black text-[11px] uppercase tracking-widest text-white leading-none mb-0.5">{t.label}</p>
                  <p className="text-white/40 text-[11px]">{t.desc}</p>
                </div>
                <svg className="ml-auto text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Right – store photo with categories overlay */}
        <div className="hidden lg:block relative flex-1">
          <Image
            src="/images/pages/carrieres.png"
            alt="Boutique L'ecomax"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-neutral-950/55" />
          {/* Vertical divider light */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          {/* Category list */}
          <div className="absolute inset-0 flex flex-col justify-center px-10 xl:px-16">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveGroup(t.id);
                  document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex items-center gap-5 py-5 border-b border-white/10 last:border-none hover:pl-2 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  activeGroup === t.id ? "bg-[#3ecf4c]/25" : "bg-white/10 group-hover:bg-white/15"
                }`}>
                  {t.icon}
                </div>
                <div className="text-left">
                  <p className={`font-black text-[13px] uppercase tracking-widest leading-none mb-0.5 transition-colors ${
                    activeGroup === t.id ? "text-[#3ecf4c]" : "text-white"
                  }`}>{t.label}</p>
                  <p className="text-white/45 text-[12px]">{t.desc}</p>
                </div>
                <svg className={`ml-auto shrink-0 transition-colors ${
                  activeGroup === t.id ? "text-[#3ecf4c]" : "text-white/20 group-hover:text-white/50"
                }`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq-section" className="max-w-5xl mx-auto px-6 pt-12 pb-16">
        <div className="border border-neutral-100 rounded-2xl overflow-hidden">
          {/* Tab header */}
          <div className="flex overflow-x-auto border-b border-neutral-100 bg-neutral-50">
            {faqGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setActiveGroup(g.id); setOpenFaq(null); }}
                className={`px-5 py-3.5 text-[12px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                  activeGroup === g.id
                    ? "border-[#3ecf4c] text-black"
                    : "border-transparent text-neutral-400 hover:text-black"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* FAQ list */}
          <div className="divide-y divide-neutral-50">
            {current.faqs.map((faq) => (
              <div key={faq.q}>
                <button
                  onClick={() => setOpenFaq(openFaq === faq.q ? null : faq.q)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className="font-bold text-[15px] pr-6">{faq.q}</span>
                  <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-lg font-black transition-all ${
                    openFaq === faq.q ? "bg-[#3ecf4c] border-[#3ecf4c] text-black" : "border-neutral-200 text-neutral-400"
                  }`}>
                    {openFaq === faq.q ? "−" : "+"}
                  </span>
                </button>
                {openFaq === faq.q && (
                  <div className="px-6 pb-5">
                    <p className="text-[14px] text-neutral-500 leading-relaxed max-w-2xl">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c] mb-2">Contact direct</p>
            <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight mb-2">
              Vous n&apos;avez pas trouvé<br />votre réponse ?
            </h2>
            <p className="text-white/50 text-sm max-w-md">
              Notre équipe répond en moins de 2h. Choisissez votre canal préféré.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://wa.me/212699289568"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-black text-[12px] uppercase tracking-widest px-6 py-3.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href="mailto:support@lecomax.com"
              className="flex items-center justify-center gap-2 bg-[#3ecf4c] text-black font-black text-[12px] uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-[#32b83d] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
