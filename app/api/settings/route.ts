import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "@/lib/admin-session";
import { revalidatePath } from "next/cache";
import { shippingConfigFromSettings } from "@/lib/shipping-config";
import {
  PAYMENT_SETTING_KEYS,
  validatePaymentSetting,
} from "@/lib/payment-methods";
import {
  APP_INTRO_SETTING_KEYS,
  validateAppIntroSettings,
} from "@/lib/app-intro-settings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PUBLIC_SETTING_KEYS = [
  "store_name",
  "store_email",
  "store_phone",
  "store_address",
  "store_city",
  "currency",
  "whatsapp_number",
  "logo_image",
  "shipping_cost",
  "free_shipping_threshold",
  "shipping_estimated_days",
  "checkout_minimum_order",
  "checkout_notice",
  "enable_reviews",
  "enable_coupons",
  "enable_newsletter",
  "checkout_contact_title",
  "checkout_contact_subtitle",
  "checkout_delivery_title",
  "checkout_delivery_subtitle",
  "checkout_payment_title",
  "checkout_payment_subtitle",
  "checkout_button_label",
  "checkout_trust_title",
  "checkout_trust_delivery",
  "checkout_trust_payment",
  "checkout_trust_returns",
  "checkout_terms_note",
  "checkout_show_reassurance",
  "enable_wishlist",
  "enable_ecoclub",
  "enable_cod",
  "enable_paypal",
  ...PAYMENT_SETTING_KEYS,
  "maintenance_mode",
  "app_minimum_version",
  "app_latest_version",
  "app_force_update",
  "app_store_url",
  "app_support_contact",
  "app_notifications_enabled",
  "app_club_title",
  "app_club_description",
  "app_club_cta_label",
  "app_club_cta_destination",
  "app_wishlist_section_title",
  "app_wishlist_recommendations_enabled",
  "app_wishlist_recommendations_title",
  "app_wishlist_recommendation_slugs",
  "app_wishlist_promotional_label",
  "app_wishlist_default_sort",
  "app_cache_version",
  "app_popular_searches",
  "app_home_promotions",
  "app_home_new_arrivals",
  "app_home_products",
  "app_home_welcome_offer",
  "app_onboarding_enabled",
  "app_onboarding_version",
  "app_onboarding_title",
  "app_onboarding_message",
  ...APP_INTRO_SETTING_KEYS,
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "youtube_url",
  "announcement_enabled",
  "announcement_1",
  "announcement_2",
  "announcement_3",
  "announcement_4",
  "announcement_5",
  "announcement_background",
  "announcement_accent",
  "announcement_text_color",
  "announcement_speed",
  "announcement_pause_hover",
  "announcement_show_icons",
  "announcement_uppercase",
  "announcement_mobile_enabled",
];

// GET /api/settings
export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const isAdmin = Boolean(session && (await verifySessionToken(session)));
  let query = supabase.from("settings").select("key, value");
  if (!isAdmin) query = query.in("key", PUBLIC_SETTING_KEYS);
  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

// POST /api/settings  (upsert all keys) — admin only
export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const adminEmail = session ? await verifySessionToken(session) : null;
  if (!adminEmail) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // body is expected to be Record<string, string>
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Format de paramètres invalide" },
      { status: 400 },
    );
  }
  const values = body as Record<string, unknown>;
  const introError = validateAppIntroSettings(values);
  if (introError) {
    return NextResponse.json({ error: introError }, { status: 400 });
  }
  for (const key of PAYMENT_SETTING_KEYS) {
    if (!(key in values)) continue;
    const paymentError = validatePaymentSetting(key, values[key]);
    if (paymentError) {
      return NextResponse.json({ error: paymentError }, { status: 400 });
    }
  }
  const shippingCost = Number(values.shipping_cost);
  const freeThreshold = Number(values.free_shipping_threshold);
  if (
    "shipping_cost" in values &&
    (!Number.isFinite(shippingCost) || shippingCost < 0)
  ) {
    return NextResponse.json(
      { error: "Les frais de livraison doivent être un nombre positif." },
      { status: 400 },
    );
  }
  if (
    "free_shipping_threshold" in values &&
    (!Number.isFinite(freeThreshold) || freeThreshold < 0)
  ) {
    return NextResponse.json(
      { error: "Le seuil de livraison gratuite doit être un nombre positif." },
      { status: 400 },
    );
  }
  if (
    "shipping_estimated_days" in values &&
    (typeof values.shipping_estimated_days !== "string" ||
      !values.shipping_estimated_days.trim() ||
      values.shipping_estimated_days.length > 80)
  ) {
    return NextResponse.json(
      {
        error: "Le délai de livraison doit contenir entre 1 et 80 caractères.",
      },
      { status: 400 },
    );
  }
  if ("checkout_minimum_order" in values) {
    const minimum = Number(values.checkout_minimum_order);
    if (!Number.isFinite(minimum) || minimum < 0 || minimum > 1000000) {
      return NextResponse.json(
        { error: "Le minimum de commande est invalide." },
        { status: 400 },
      );
    }
  }
  if (
    "checkout_notice" in values &&
    (typeof values.checkout_notice !== "string" ||
      values.checkout_notice.length > 240)
  ) {
    return NextResponse.json(
      {
        error:
          "Le message du checkout doit contenir au maximum 240 caractères.",
      },
      { status: 400 },
    );
  }
  const checkoutTextLimits: Record<string, number> = {
    checkout_contact_title: 80,
    checkout_contact_subtitle: 140,
    checkout_delivery_title: 80,
    checkout_delivery_subtitle: 140,
    checkout_payment_title: 80,
    checkout_payment_subtitle: 140,
    checkout_button_label: 40,
    checkout_trust_title: 80,
    checkout_trust_delivery: 60,
    checkout_trust_payment: 60,
    checkout_trust_returns: 60,
    checkout_terms_note: 180,
    app_club_title: 60,
    app_club_description: 160,
    app_club_cta_label: 40,
    app_club_cta_destination: 500,
    app_wishlist_section_title: 60,
    app_wishlist_recommendations_title: 80,
    app_wishlist_promotional_label: 30,
  };
  for (const [key, limit] of Object.entries(checkoutTextLimits)) {
    if (
      key in values &&
      (typeof values[key] !== "string" ||
        !String(values[key]).trim() ||
        String(values[key]).length > limit)
    ) {
      return NextResponse.json(
        { error: `Le champ ${key} est invalide.` },
        { status: 400 },
      );
    }
  }
  const announcementMessages = [1, 2, 3, 4, 5].map(
    (index) => `announcement_${index}`,
  );
  for (const key of announcementMessages) {
    if (
      key in values &&
      (typeof values[key] !== "string" || String(values[key]).length > 160)
    ) {
      return NextResponse.json(
        { error: "Chaque annonce doit contenir au maximum 160 caractères." },
        { status: 400 },
      );
    }
  }
  const booleanKeys = [
    "announcement_enabled",
    "announcement_pause_hover",
    "announcement_show_icons",
    "announcement_uppercase",
    "announcement_mobile_enabled",
    "enable_reviews",
    "enable_coupons",
    "enable_newsletter",
    "enable_wishlist",
    "enable_ecoclub",
    "enable_cod",
    "enable_paypal",
    "checkout_show_reassurance",
    "maintenance_mode",
    "app_force_update",
    "app_home_promotions",
    "app_home_new_arrivals",
    "app_home_products",
    "app_home_welcome_offer",
    "app_onboarding_enabled",
    "app_intro_enabled",
    "app_notifications_enabled",
    "app_wishlist_recommendations_enabled",
  ];
  for (const key of booleanKeys) {
    if (
      key in values &&
      values[key] !== "true" &&
      values[key] !== "false" &&
      values[key] !== true &&
      values[key] !== false
    ) {
      return NextResponse.json(
        { error: `Valeur invalide pour ${key}.` },
        { status: 400 },
      );
    }
  }
  for (const key of ["app_minimum_version", "app_latest_version"]) {
    if (key in values && !/^\d+\.\d+\.\d+$/.test(String(values[key]))) {
      return NextResponse.json(
        { error: `La version ${key} doit utiliser le format 1.2.3.` },
        { status: 400 },
      );
    }
  }
  if (
    "app_wishlist_recommendation_slugs" in values &&
    (typeof values.app_wishlist_recommendation_slugs !== "string" ||
      values.app_wishlist_recommendation_slugs.length > 3000)
  ) {
    return NextResponse.json(
      { error: "La liste des recommandations Favoris est invalide." },
      { status: 400 },
    );
  }
  if (
    "app_wishlist_default_sort" in values &&
    !["recommended", "price-asc", "price-desc", "newest", "rating"].includes(
      String(values.app_wishlist_default_sort),
    )
  ) {
    return NextResponse.json(
      { error: "Le tri par défaut des Favoris est invalide." },
      { status: 400 },
    );
  }
  if ("app_store_url" in values && String(values.app_store_url).length > 500) {
    return NextResponse.json(
      { error: "L’URL de mise à jour est trop longue." },
      { status: 400 },
    );
  }
  if (
    "app_popular_searches" in values &&
    String(values.app_popular_searches).length > 240
  ) {
    return NextResponse.json(
      {
        error:
          "Les recherches populaires doivent contenir au maximum 240 caractères.",
      },
      { status: 400 },
    );
  }
  for (const key of ["app_onboarding_title", "app_onboarding_message"]) {
    if (
      key in values &&
      String(values[key]).length > (key.endsWith("title") ? 80 : 180)
    ) {
      return NextResponse.json(
        { error: `Le contenu ${key} est trop long.` },
        { status: 400 },
      );
    }
  }
  for (const key of [
    "announcement_background",
    "announcement_accent",
    "announcement_text_color",
  ]) {
    if (key in values && !/^#[0-9a-f]{6}$/i.test(String(values[key]))) {
      return NextResponse.json(
        {
          error: "Les couleurs doivent utiliser le format hexadécimal #RRGGBB.",
        },
        { status: 400 },
      );
    }
  }
  if ("announcement_speed" in values) {
    const speed = Number(values.announcement_speed);
    if (!Number.isFinite(speed) || speed < 12 || speed > 120) {
      return NextResponse.json(
        { error: "La vitesse doit être comprise entre 12 et 120 secondes." },
        { status: 400 },
      );
    }
  }
  const auditedKeys = [
    "shipping_cost",
    "free_shipping_threshold",
    "shipping_estimated_days",
    "enable_cod",
    "enable_paypal",
    ...PAYMENT_SETTING_KEYS,
  ].filter((key) => key in values);
  const { data: previousAuditRows } = auditedKeys.length
    ? await supabase.from("settings").select("key,value").in("key", auditedKeys)
    : { data: [] as Array<{ key: string; value: unknown }> };
  const previousAuditValues = Object.fromEntries(
    (previousAuditRows ?? []).map((row) => [row.key, String(row.value ?? "")]),
  );

  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("settings")
    .upsert(rows, { onConflict: "key" });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const changedKeys = auditedKeys.filter(
    (key) => previousAuditValues[key] !== String(values[key] ?? ""),
  );
  if (changedKeys.length) {
    const paymentChanged = changedKeys.some(
      (key) =>
        key.startsWith("payment_") ||
        key === "enable_cod" ||
        key === "enable_paypal",
    );
    const deliveryChanged = changedKeys.some(
      (key) =>
        key.startsWith("shipping_") || key === "free_shipping_threshold",
    );
    const changes = Object.fromEntries(
      changedKeys.map((key) => [
        key,
        {
          before: previousAuditValues[key] ?? null,
          after: String(values[key] ?? ""),
        },
      ]),
    );
    const { error: auditError } = await supabase
      .from("admin_commerce_settings_audit")
      .insert({
        admin_email: adminEmail,
        area:
          paymentChanged && deliveryChanged
            ? "payment_delivery"
            : paymentChanged
              ? "payment"
              : "delivery",
        changed_keys: changedKeys,
        changes,
      });
    if (auditError) {
      console.error("Commerce settings audit write failed:", auditError.message);
    }
  }
  revalidatePath("/", "layout");
  return NextResponse.json({
    success: true,
    shipping: shippingConfigFromSettings(values),
  });
}
