import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aide & FAQ | L'ecomax — Questions Fréquentes",
  description:
    "Trouvez les réponses à vos questions : livraison au Maroc, retours, paiement à la livraison, suivi de commande et compte client. Service client L'ecomax.",
  keywords: [
    "aide lecomax",
    "FAQ boutique Maroc",
    "livraison Maroc délai",
    "retours gratuits Maroc",
    "paiement livraison Maroc",
    "suivi commande Maroc",
  ],
  alternates: { canonical: "https://lecomax.com/aide/" },
  openGraph: {
    title: "Aide & FAQ | L'ecomax",
    description:
      "Réponses à toutes vos questions sur la livraison, les retours et le paiement chez L'ecomax.",
    url: "https://lecomax.com/aide",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment passer une commande sur L'ecomax ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Parcourez nos produits, ajoutez vos articles au panier, puis suivez les étapes de validation. Vous recevrez un e-mail de confirmation dès que votre commande sera enregistrée." }
    },
    {
      "@type": "Question",
      "name": "Quels sont les délais de livraison au Maroc ?",
      "acceptedAnswer": { "@type": "Answer", "text": "La livraison standard prend 3 à 5 jours ouvrables partout au Maroc. Les frais de livraison sont de 35 MAD (offerts dès 500 MAD d'achats)." }
    },
    {
      "@type": "Question",
      "name": "Livrez-vous à Sidi Bennour ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui, nous livrons dans toute la province de Doukkala-Abda y compris Sidi Bennour, El Jadida et les communes avoisinantes." }
    },
    {
      "@type": "Question",
      "name": "Comment retourner un article acheté sur L'ecomax ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Vous disposez de 30 jours après réception pour retourner un article dans son état d'origine avec ses étiquettes. Connectez-vous à votre compte pour initier le retour." }
    },
    {
      "@type": "Question",
      "name": "Quand serai-je remboursé après un retour ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Une fois le retour reçu et validé, votre remboursement est traité sous 5 à 7 jours ouvrés sur le moyen de paiement d'origine." }
    },
    {
      "@type": "Question",
      "name": "Quels modes de paiement acceptez-vous ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et le paiement à la livraison (cash). Tous les paiements en ligne sont sécurisés SSL/TLS." }
    },
    {
      "@type": "Question",
      "name": "Le paiement à la livraison est-il disponible ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui, le paiement en espèces à la livraison (cash on delivery) est disponible partout au Maroc." }
    },
    {
      "@type": "Question",
      "name": "Comment fonctionne le programme ecoClub ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Chaque achat vous rapporte des points. 10 MAD dépensés = 1 point. Dès 100 points, profitez de réductions exclusives et d'avant-premières." }
    },
    {
      "@type": "Question",
      "name": "Puis-je modifier ou annuler ma commande ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Les commandes peuvent être modifiées ou annulées dans l'heure suivant leur passage. Passé ce délai, contactez notre service client." }
    },
    {
      "@type": "Question",
      "name": "Comment suivre ma commande L'ecomax ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Une fois votre commande expédiée, vous recevrez un e-mail avec un numéro de suivi. Vous pouvez aussi consulter l'état sur la page Suivre la commande de lecomax.com." }
    },
  ],
};

export default function AideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
