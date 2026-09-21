import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "./supabase-server";

// Only public presentation settings: never cache sessions or checkout decisions here.
const loadSettings = unstable_cache(async (): Promise<Record<string, string>> => {
  const { data, error } = await createServerSupabaseClient().from("settings").select("key,value").in("key", [
    "store_name", "seo_title", "seo_description", "favicon_image", "og_image",
    "hero_image", "hero_image_mobile", "shipping_cost", "free_shipping_threshold",
    "free_shipping_enabled", "shipping_estimated_days",
  ]);
  if (error) throw error; // A transient failure must not replace the last good cache entry.
  return Object.fromEntries((data ?? []).map(row => [row.key, String(row.value ?? "")]));
}, ["storefront-presentation-settings-v1"], { revalidate: 300, tags: ["store-settings"] });

// Share the read across root metadata, layout, page metadata and homepage.
export const getStorefrontSettings = cache(loadSettings);
