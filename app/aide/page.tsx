"use client";
import { useState } from "react";
import Link from "next/link";
import { useSettings, getWhatsAppHref } from "@/lib/use-settings";
import { shippingConfigFromSettings, formatShippingAmount } from "@/lib/shipping-config";
import { serializeJsonLd } from "@/lib/seo";

const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ReturnIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
  </svg>
);
const CardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const StarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      { q: "Quels sont les délais de livraison ?", a: "La livraison standard prend généralement 2 à 5 jours ouvrables partout au Maroc. Les frais de livraison sont de 35 MAD (offerts dès 500 MAD d'achats)." },
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
  const siteSettings = useSettings();
  const shippingConfig = shippingConfigFromSettings(siteSettings);
  const [activeGroup, setActiveGroup] = useState("commandes");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const visibleFaqGroups = faqGroups
    .filter((group) => group.id !== "ecoclub" || siteSettings.enable_ecoclub !== "false")
    .map((group) => group.id !== "livraison" ? group : {
      ...group,
      faqs: group.faqs.map((faq) => faq.q !== "Quels sont les délais de livraison ?" ? faq : {
        ...faq,
        a: `La livraison standard prend ${shippingConfig.estimatedDays} partout au Maroc. Les frais de livraison sont de ${formatShippingAmount(shippingConfig.cost)} MAD${shippingConfig.freeThreshold > 0 ? ` (offerts dès ${formatShippingAmount(shippingConfig.freeThreshold)} MAD d'achats)` : ""}.`,
      }),
    });
  const current = visibleFaqGroups.find((g) => g.id === activeGroup) ?? visibleFaqGroups[0];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": visibleFaqGroups.flatMap((g) =>
      g.faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />

      {/* ── Hero – deep navy gradient with wave bottom ── */}
      <div className="relative w-full overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1128 0%, #0c1a2e 40%, #081420 100%)" }}>
        {/* Very subtle green tint right */}
        <div className="absolute right-0 top-0 w-[55%] h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 45%, rgba(62,207,76,0.07) 0%, transparent 55%)" }} />
        {/* Blue depth — bottom left */}
        <div className="absolute left-[-10%] bottom-[-10%] w-[60%] h-[70%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(20,60,160,0.18) 0%, transparent 60%)" }} />

        <div className="relative max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 pt-20 pb-36 lg:pt-28 lg:pb-44">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-10">
            <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
            <span className="text-white/15">/</span>
            <span className="text-white/60">Centre d&apos;aide</span>
          </nav>

          <span className="inline-flex items-center gap-2 text-[11px] font-semibold bg-white/[0.07] border border-white/15 text-white/70 px-4 py-2 rounded-full w-fit mb-8">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3ecf4c]"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Centre d&apos;aide
          </span>

          <h1 className="font-black leading-[1.05] mb-6 text-white" style={{ fontSize: "clamp(2.8rem,5.5vw,5rem)", letterSpacing: "-0.03em" }}>
            Trouvez l&apos;aide dont<br />
            vous avez <span className="text-[#3ecf4c]">besoin.</span>
          </h1>

          <p className="text-white/45 text-base max-w-md leading-relaxed mb-10">
            Notre centre d&apos;aide couvre toutes vos questions — commandes, livraison, retours et plus encore. Notre équipe est disponible 7j/7.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 bg-[#3ecf4c] text-black font-black text-[13px] uppercase tracking-widest px-7 py-3.5 rounded-full hover:bg-[#32b83d] transition-colors"
            >
              Consulter la FAQ
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <Link
              href="/nous-contacter/"
              className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/20 text-white font-black text-[13px] uppercase tracking-widest px-7 py-3.5 rounded-full hover:bg-white/14 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14 sm:h-18 lg:h-24 block">
            <path d="M0,45 C200,90 400,10 720,50 C1000,85 1250,15 1440,45 L1440,90 L0,90 Z" fill="#ffffff"/>
          </svg>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq-section" className="max-w-5xl mx-auto px-6 pt-16 pb-20">

        {/* Section label */}
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400 mb-8">Questions fréquentes</p>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* Left: topic sidebar */}
          <div className="lg:w-56 shrink-0">
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-1 lg:pb-0">
              {topics.filter((topic) => topic.id !== "ecoclub" || siteSettings.enable_ecoclub !== "false").map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveGroup(t.id); setOpenFaq(null); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left whitespace-nowrap lg:whitespace-normal transition-all ${
                    activeGroup === t.id
                      ? "bg-[#3ecf4c]/8 text-neutral-900"
                      : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    activeGroup === t.id ? "bg-[#3ecf4c]/15 text-[#3ecf4c]" : "bg-neutral-100 text-neutral-400"
                  }`}>
                    {t.icon}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className={`font-black text-[12px] uppercase tracking-wider leading-none mb-0.5 ${
                      activeGroup === t.id ? "text-neutral-900" : "text-neutral-500"
                    }`}>{t.label}</p>
                    <p className="text-neutral-400 text-[11px]">{t.desc}</p>
                  </div>
                  <span className="lg:hidden font-black text-[11px] uppercase tracking-wide">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: accordion */}
          <div className="flex-1">
            {/* Active topic label */}
            {(() => {
              const t = topics.find((t) => t.id === activeGroup)!;
              return (
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
                  <div className="w-9 h-9 rounded-xl bg-[#3ecf4c]/10 flex items-center justify-center text-[#3ecf4c] shrink-0">{t.icon}</div>
                  <div>
                    <p className="font-black text-base uppercase tracking-wide text-neutral-900 leading-none mb-0.5">{t.label}</p>
                    <p className="text-neutral-400 text-[12px]">{t.desc}</p>
                  </div>
                </div>
              );
            })()}

            <div className="divide-y divide-neutral-100">
              {current.faqs.map((faq, i) => (
                <div key={faq.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.q ? null : faq.q)}
                    className="w-full flex items-center justify-between py-5 text-left group"
                  >
                    <div className="flex items-start gap-4 pr-6">
                      <span className="text-[11px] font-black text-neutral-300 tabular-nums mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className={`font-semibold text-[15px] leading-snug transition-colors ${
                        openFaq === faq.q ? "text-[#3ecf4c]" : "text-neutral-800 group-hover:text-neutral-950"
                      }`}>{faq.q}</span>
                    </div>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      openFaq === faq.q
                        ? "bg-[#3ecf4c] text-black"
                        : "bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200"
                    }`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-200 ${
                        openFaq === faq.q ? "rotate-45" : ""
                      }`}><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                  </button>
                  {openFaq === faq.q && (
                    <div className="pb-6 pl-8">
                      <p className="text-[14px] text-neutral-500 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact CTA ── */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#3ecf4c] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] inline-block" />
              Contact direct
            </span>
            <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight mb-3 leading-tight">
              Vous n&apos;avez pas trouvé<br />votre réponse ?
            </h2>
            <p className="text-white/40 text-sm max-w-sm leading-relaxed">
              Notre équipe répond en moins de 2h. Choisissez votre canal préféré.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={getWhatsAppHref(siteSettings)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-black text-[12px] uppercase tracking-widest px-6 py-3.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href="mailto:contact@lecomax.com"
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
