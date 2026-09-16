"use client";

import { useShippingConfig } from "@/lib/use-settings";
import { formatShippingAmount } from "@/lib/shipping-config";

export default function ShippingTermsItem() {
  const config = useShippingConfig();
  return (
    <>
      Frais de livraison : {formatShippingAmount(config.cost)} MAD
      {config.freeThreshold > 0
        ? ` — offerts à partir de ${formatShippingAmount(config.freeThreshold)} MAD d'achats`
        : ""}
    </>
  );
}
