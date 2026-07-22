import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "@/lib/admin-session";
import { revalidatePath } from "next/cache";
import { shippingConfigFromSettings } from "@/lib/shipping-config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PUBLIC_SETTING_KEYS = [
  "store_name", "store_email", "store_phone", "store_address", "store_city", "currency",
  "whatsapp_number", "logo_image", "shipping_cost", "free_shipping_threshold", "shipping_estimated_days",
  "checkout_minimum_order", "checkout_notice", "enable_reviews", "enable_coupons", "enable_newsletter",
  "checkout_contact_title", "checkout_contact_subtitle", "checkout_delivery_title", "checkout_delivery_subtitle",
  "checkout_payment_title", "checkout_payment_subtitle", "checkout_button_label", "checkout_trust_title",
  "checkout_trust_delivery", "checkout_trust_payment", "checkout_trust_returns", "checkout_terms_note", "checkout_show_reassurance",
  "enable_wishlist", "enable_ecoclub", "enable_cod", "enable_paypal", "maintenance_mode",
  "facebook_url", "instagram_url", "tiktok_url", "youtube_url",
  "announcement_enabled", "announcement_1", "announcement_2", "announcement_3", "announcement_4", "announcement_5",
  "announcement_background", "announcement_accent", "announcement_text_color", "announcement_speed",
  "announcement_pause_hover", "announcement_show_icons", "announcement_uppercase", "announcement_mobile_enabled",
];

// GET /api/settings
export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const isAdmin = Boolean(session && await verifySessionToken(session));
  let query = supabase.from("settings").select("key, value");
  if (!isAdmin) query = query.in("key", PUBLIC_SETTING_KEYS);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

// POST /api/settings  (upsert all keys) — admin only
export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (!session || !(await verifySessionToken(session))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // body is expected to be Record<string, string>
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Format de paramètres invalide" }, { status: 400 });
  }
  const values = body as Record<string, unknown>;
  const shippingCost = Number(values.shipping_cost);
  const freeThreshold = Number(values.free_shipping_threshold);
  if ("shipping_cost" in values && (!Number.isFinite(shippingCost) || shippingCost < 0)) {
    return NextResponse.json({ error: "Les frais de livraison doivent être un nombre positif." }, { status: 400 });
  }
  if ("free_shipping_threshold" in values && (!Number.isFinite(freeThreshold) || freeThreshold < 0)) {
    return NextResponse.json({ error: "Le seuil de livraison gratuite doit être un nombre positif." }, { status: 400 });
  }
  if ("shipping_estimated_days" in values && (typeof values.shipping_estimated_days !== "string" || !values.shipping_estimated_days.trim() || values.shipping_estimated_days.length > 80)) {
    return NextResponse.json({ error: "Le délai de livraison doit contenir entre 1 et 80 caractères." }, { status: 400 });
  }
  if ("checkout_minimum_order" in values) {
    const minimum = Number(values.checkout_minimum_order);
    if (!Number.isFinite(minimum) || minimum < 0 || minimum > 1000000) {
      return NextResponse.json({ error: "Le minimum de commande est invalide." }, { status: 400 });
    }
  }
  if ("checkout_notice" in values && (typeof values.checkout_notice !== "string" || values.checkout_notice.length > 240)) {
    return NextResponse.json({ error: "Le message du checkout doit contenir au maximum 240 caractères." }, { status: 400 });
  }
  const checkoutTextLimits: Record<string, number> = {
    checkout_contact_title: 80, checkout_contact_subtitle: 140,
    checkout_delivery_title: 80, checkout_delivery_subtitle: 140,
    checkout_payment_title: 80, checkout_payment_subtitle: 140,
    checkout_button_label: 40, checkout_trust_title: 80,
    checkout_trust_delivery: 60, checkout_trust_payment: 60,
    checkout_trust_returns: 60, checkout_terms_note: 180,
  };
  for (const [key, limit] of Object.entries(checkoutTextLimits)) {
    if (key in values && (typeof values[key] !== "string" || !String(values[key]).trim() || String(values[key]).length > limit)) {
      return NextResponse.json({ error: `Le champ ${key} est invalide.` }, { status: 400 });
    }
  }
  const announcementMessages = [1, 2, 3, 4, 5].map((index) => `announcement_${index}`);
  for (const key of announcementMessages) {
    if (key in values && (typeof values[key] !== "string" || String(values[key]).length > 160)) {
      return NextResponse.json({ error: "Chaque annonce doit contenir au maximum 160 caractères." }, { status: 400 });
    }
  }
  const booleanKeys = ["announcement_enabled", "announcement_pause_hover", "announcement_show_icons", "announcement_uppercase", "announcement_mobile_enabled", "enable_reviews", "enable_coupons", "enable_newsletter", "enable_wishlist", "enable_ecoclub", "enable_cod", "enable_paypal", "checkout_show_reassurance", "maintenance_mode"];
  for (const key of booleanKeys) {
    if (key in values && values[key] !== "true" && values[key] !== "false" && values[key] !== true && values[key] !== false) {
      return NextResponse.json({ error: `Valeur invalide pour ${key}.` }, { status: 400 });
    }
  }
  for (const key of ["announcement_background", "announcement_accent", "announcement_text_color"]) {
    if (key in values && !/^#[0-9a-f]{6}$/i.test(String(values[key]))) {
      return NextResponse.json({ error: "Les couleurs doivent utiliser le format hexadécimal #RRGGBB." }, { status: 400 });
    }
  }
  if ("announcement_speed" in values) {
    const speed = Number(values.announcement_speed);
    if (!Number.isFinite(speed) || speed < 12 || speed > 120) {
      return NextResponse.json({ error: "La vitesse doit être comprise entre 12 et 120 secondes." }, { status: 400 });
    }
  }
  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, shipping: shippingConfigFromSettings(values) });
}
