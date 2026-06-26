import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://yddqwgdgeljkzfsmtein.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZHF3Z2RnZWxqa3pmc210ZWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNDM5MywiZXhwIjoyMDkyODkwMzkzfQ.76uWpxv2hnt665DmOf0xjYnm61Nbot0FWB5Bf9XCTnQ"
);

const rows = [
  { key: "store_name",              value: "L'ECOMAX" },
  { key: "store_email",             value: "contact@lecomax.com" },
  { key: "store_phone",             value: "" },
  { key: "store_city",              value: "Casablanca" },
  { key: "store_address",           value: "" },
  { key: "currency",                value: "MAD" },
  { key: "whatsapp_number",         value: "212699289568" },
  { key: "shipping_cost",           value: "35" },
  { key: "free_shipping_threshold", value: "500" },
  { key: "instagram_url",           value: "https://www.instagram.com/lecomaxcom" },
  { key: "facebook_url",            value: "https://www.facebook.com/lecomaxcom" },
  { key: "tiktok_url",              value: "https://www.tiktok.com/@lecomaxcom" },
  { key: "maintenance_mode",        value: "false" },
  { key: "favicon_image",           value: "/favicon.png" },
  { key: "logo_image",              value: "/images/lecomax logo.png" },
  { key: "hero_image",              value: "/images/hero secrtion/hero section web version.png" },
  { key: "hero_image_mobile",       value: "/images/hero secrtion/hero section mobile version.png" },
  { key: "email_banner_image",      value: "/images/email image/email image.png" },
  { key: "og_image",                value: "/images/lecomax logo.png" },
].map(r => ({ ...r, updated_at: new Date().toISOString() }));

const { error } = await sb.from("settings").upsert(rows, { onConflict: "key" });
if (error) {
  console.error("ERROR:", error.message);
  process.exit(1);
} else {
  console.log(`✅  All ${rows.length} settings synced to Supabase`);
}
