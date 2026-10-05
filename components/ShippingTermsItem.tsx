"use client";

import { useShippingConfig } from "@/lib/use-settings";
import { formatShippingAmount } from "@/lib/shipping-config";

export default function ShippingTermsItem({ estimate = false }: { estimate?: boolean }) {
  const config = useShippingConfig();
  if (estimate) return <>Délai de livraison estimé : {config.estimatedDays} sur l’ensemble du territoire marocain</>;
  return (
    <>
      Frais de livraison : {formatShippingAmount(config.cost)} MAD
      {config.freeThreshold > 0
        ? ` — offerts à partir de ${formatShippingAmount(config.freeThreshold)} MAD d'achats`
        : ""}
    </>
  );
}
