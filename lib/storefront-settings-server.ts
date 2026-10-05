import "server-only";

import { cache } from "react";
import { createPublicSupabaseClient } from "./supabase-server";

// Only public presentation settings: never cache sessions or checkout decisions here.
const loadSettings = async (): Promise<Record<string, string>> => {
  const { data, error } = await createPublicSupabaseClient(["store-settings"]).from("settings").select("key,value").in("key", [
    "store_name", "seo_title", "seo_description", "favicon_image", "og_image",
    "hero_image", "hero_image_mobile", "shipping_cost", "free_shipping_threshold",
    "free_shipping_enabled", "shipping_estimated_days",
    "business_hours", "store_phone", "store_email", "whatsapp_number",
  ]);
  if (error) throw error; // A transient failure must not replace the last good cache entry.
  return Object.fromEntries((data ?? []).map(row => [row.key, String(row.value ?? "")]));
};

// Share the read across root metadata, layout, page metadata and homepage.
// Persist successful HTTP responses in the public client's fetch cache, rather
// than throwing Supabase errors inside an unstable_cache background callback.
// Cold-cache failures reach the callers' existing defaults and remain retryable.
export const getStorefrontSettings = cache(loadSettings);
