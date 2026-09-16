export const metadata = {
  title: "Politique de Confidentialité | L'ecomax",
};

export default function ConfidentialitePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-black text-3xl uppercase tracking-tight mb-2">Politique de Confidentialité</h1>
      <div className="w-10 h-[3px] bg-black mb-10" />

      <div className="space-y-10 text-[14px] text-neutral-700 leading-[1.8]">

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">1. Collecte des Données</h2>
          <p>
            L&apos;ecomax collecte uniquement les données personnelles nécessaires au traitement de vos commandes : nom, prénom, adresse de livraison, numéro de téléphone et adresse e-mail. Ces informations sont recueillies lors de votre passage en caisse et ne sont jamais revendues à des tiers.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">2. Utilisation des Données</h2>
          <p>
            Vos données personnelles sont utilisées exclusivement pour :
          </p>
          <ul className="mt-3 space-y-1 list-none pl-0">
            {[
              "Traiter et expédier vos commandes",
              "Vous envoyer des confirmations et mises à jour de commande",
              "Répondre à vos demandes de service client",
              "Améliorer notre site et nos services",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-[3px]">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">3. Conservation des Données</h2>
          <p>
            Vos données sont conservées pendant la durée nécessaire à la finalité pour laquelle elles ont été collectées, et au maximum pendant 3 ans après votre dernier achat, conformément à la réglementation en vigueur.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">4. Partage des Données</h2>
          <p>
            Vos données peuvent être partagées avec nos prestataires logistiques uniquement dans le but d&apos;assurer la livraison de vos commandes. Nous ne vendons ni ne louons vos données à des tiers à des fins commerciales.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">5. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, destruction ou divulgation. Toutes les transactions sont sécurisées via HTTPS.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">6. Vos Droits</h2>
          <p>
            Conformément à la loi marocaine 09-08 relative à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@lecomax.com" className="underline hover:text-black transition-colors">contact@lecomax.com</a>.
          </p>
        </section>

        <p className="text-neutral-400 text-[12px] pt-4 border-t border-neutral-100">
          Dernière mise à jour : avril 2026
        </p>
      </div>
    </main>
  );
}
