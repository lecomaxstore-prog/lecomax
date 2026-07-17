import "server-only";

import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { DEFAULT_SHIPPING_CONFIG, shippingConfigFromSettings, type ShippingConfig } from "@/lib/shipping-config";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const loadServerShippingConfig = unstable_cache(async (): Promise<ShippingConfig> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_SHIPPING_CONFIG;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("settings")
      .select("key,value")
      .in("key", ["shipping_cost", "free_shipping_threshold", "shipping_estimated_days"]);
    if (error) return DEFAULT_SHIPPING_CONFIG;
    return shippingConfigFromSettings(Object.fromEntries((data ?? []).map((row) => [row.key, row.value])));
  } catch {
    return DEFAULT_SHIPPING_CONFIG;
  }
}, ["server-shipping-config"], { revalidate: 60 });

export async function getServerShippingConfig(): Promise<ShippingConfig> {
  return loadServerShippingConfig();
}

export async function withShippingMetadata(metadata: Metadata): Promise<Metadata> {
  const config = await getServerShippingConfig();
  const replace = (value: unknown): string | undefined => typeof value === "string"
    ? value.replace(/35 MAD/g, `${config.cost} MAD`)
    : undefined;
  return {
    ...metadata,
    description: replace(metadata.description),
    openGraph: metadata.openGraph ? { ...metadata.openGraph, description: replace(metadata.openGraph.description) } : metadata.openGraph,
    twitter: metadata.twitter ? { ...metadata.twitter, description: replace(metadata.twitter.description) } : metadata.twitter,
  };
}
