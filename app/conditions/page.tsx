import { RETURN_POLICY } from "@/lib/return-policy";
export const metadata = {
  title: "Conditions Générales de Vente | L'ecomax",
  description: "Conditions générales de vente de L'ecomax : commandes, prix, livraison, paiement et retours au Maroc.",
  alternates: { canonical: "/conditions/" },
};

export default function ConditionsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-black text-3xl uppercase tracking-tight mb-2">Conditions Générales de Vente</h1>
      <div className="w-10 h-[3px] bg-black mb-10" />

      <div className="space-y-10 text-[14px] text-neutral-700 leading-[1.8]">

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">1. Objet</h2>
          <p>
            Les présentes conditions générales de vente régissent l&apos;ensemble des transactions effectuées sur le site L&apos;ecomax. En passant commande sur notre site, vous acceptez sans réserve les présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">2. Produits</h2>
          <p>
            Les produits proposés à la vente sont décrits avec la plus grande précision possible. Les photographies et visuels des produits sont donnés à titre illustratif et ne sont pas contractuels. L&apos;ecomax se réserve le droit de modifier à tout moment son catalogue de produits.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">3. Prix</h2>
          <p>
            Les prix sont indiqués en dirhams marocains (MAD) toutes taxes comprises. L&apos;ecomax se réserve le droit de modifier ses prix à tout moment. Les produits sont facturés au prix en vigueur au moment de la validation de la commande.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">4. Commandes</h2>
          <p>
            Toute commande passée sur le site vaut acceptation des présentes conditions générales de vente. L&apos;ecomax se réserve le droit d&apos;annuler ou de refuser toute commande d&apos;un client avec lequel il existerait un litige relatif au paiement d&apos;une commande antérieure.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">5. Livraison</h2>
          <p>
            Les commandes sont livrées à l&apos;adresse indiquée lors de la validation. Les délais de livraison sont donnés à titre indicatif. L&apos;ecomax ne saurait être tenu responsable des retards causés par le transporteur ou par des circonstances indépendantes de sa volonté.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">6. Retours et Remboursements</h2>
          <p>
            {RETURN_POLICY.description} Les articles doivent être non utilisés dans leur emballage d&apos;origine. {RETURN_POLICY.fees}
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">7. Responsabilité</h2>
          <p>
            L&apos;ecomax ne saurait être tenu pour responsable des dommages de toute nature, directs ou indirects, résultant de l&apos;utilisation du site ou des produits commandés. L&apos;ecomax ne garantit pas que le site sera exempt d&apos;anomalies, d&apos;erreurs ou de bugs.
          </p>
        </section>

        <section>
          <h2 className="font-black text-[13px] uppercase tracking-widest text-black mb-3">8. Droit Applicable</h2>
          <p>
            Les présentes conditions générales de vente sont soumises au droit marocain. En cas de litige, les tribunaux compétents de Casablanca seront seuls compétents.
          </p>
        </section>

        <p className="text-neutral-400 text-[12px] pt-4 border-t border-neutral-100">
          Dernière mise à jour : avril 2026
        </p>
      </div>
    </main>
  );
}
