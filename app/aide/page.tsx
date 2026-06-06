"use client";
import { useState } from "react";
import Link from "next/link";

const topics = [
  { icon: "🛒", label: "Commandes", desc: "Passer, modifier, annuler", href: "#commandes" },
  { icon: "🚚", label: "Livraison", desc: "Délais, frais, zones", href: "#livraison" },
  { icon: "↩️", label: "Retours", desc: "Politique, procédure", href: "#retours" },
  { icon: "💳", label: "Paiement", desc: "Modes, sécurité", href: "#paiement" },
  { icon: "👤", label: "Mon compte", desc: "Inscription, connexion", href: "#compte" },
  { icon: "⭐", label: "ecoClub", desc: "Points, avantages", href: "#ecoclub" },
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

      {/* Hero */}
      <div className="bg-neutral-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/70">Centre d&apos;aide</span>
          </nav>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-[#3ecf4c] text-black px-3 py-1 rounded-full">
            Support
          </span>
          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none mt-5 mb-5">
            Centre<br />
            <span className="text-[#3ecf4c]">d&apos;aide</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl">
            Trouvez rapidement des réponses à vos questions. Notre équipe est aussi disponible 7j/7.
          </p>
        </div>
      </div>

      {/* Topic cards */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {topics.map((t) => (
            <button
              key={t.label}
              onClick={() => setActiveGroup(t.href.replace("#", ""))}
              className={`group border rounded-2xl p-4 text-left hover:border-[#3ecf4c] transition-all ${
                activeGroup === t.href.replace("#", "")
                  ? "border-[#3ecf4c] bg-[#3ecf4c]/5"
                  : "border-neutral-100"
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="font-black text-[13px] uppercase tracking-wide mt-3 mb-0.5">{t.label}</p>
              <p className="text-neutral-400 text-[11px] leading-tight">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
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
