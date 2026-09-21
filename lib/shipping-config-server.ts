import "server-only";

import type { Metadata } from "next";
import { cache } from "react";
import { DEFAULT_SHIPPING_CONFIG, shippingConfigFromSettings, type ShippingConfig } from "@/lib/shipping-config";
import { getStorefrontSettings } from "@/lib/storefront-settings-server";

export const getServerShippingConfig = cache(async (): Promise<ShippingConfig> => {
  try {
    return shippingConfigFromSettings(await getStorefrontSettings());
  } catch {
    return DEFAULT_SHIPPING_CONFIG;
  }
});

export async function withShippingMetadata(metadata: Metadata): Promise<Metadata> {
  const config = await getServerShippingConfig();
  const replace = (value: unknown): string | undefined => typeof value === "string"
    ? value.replace(/\{\{shipping\}\}/g, `${config.cost} MAD`)
    : undefined;
  return {
    ...metadata,
    description: replace(metadata.description),
    openGraph: metadata.openGraph ? { ...metadata.openGraph, description: replace(metadata.openGraph.description) } : metadata.openGraph,
    twitter: metadata.twitter ? { ...metadata.twitter, description: replace(metadata.twitter.description) } : metadata.twitter,
  };
}
