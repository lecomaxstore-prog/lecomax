import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calculateCouponDiscount,
  calculateCouponPricing,
  type CouponCartLine,
} from "@/lib/coupon-pricing";
import { enforceRateLimit } from "@/lib/api-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const blocked = enforceRateLimit(req, "coupons:validate", 40, 60_000);
  if (blocked) return blocked;
  const { data: featureSetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "enable_coupons")
    .maybeSingle();
  if (featureSetting?.value === "false") {
    return NextResponse.json({ error: "Les codes promo sont temporairement désactivés" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const { code, items } = body as { code?: unknown; items?: CouponCartLine[] };
  const normalizedCode = typeof code === "string" ? code.toUpperCase().trim().slice(0, 80) : "";
  if (!normalizedCode) return NextResponse.json({ error: "Code requis" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 || items.some((item) =>
    !item || typeof item.slug !== "string" || !item.slug.trim() || item.slug.length > 160 ||
    !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20
  )) {
    return NextResponse.json({ error: "Le contenu du panier est invalide" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalizedCode)
    .eq("active", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "Code invalide ou inactif" }, { status: 404 });

  const couponValue = Number(data.value);
  if (!["percent", "fixed"].includes(data.type) || !Number.isFinite(couponValue) || couponValue <= 0 || (data.type === "percent" && couponValue > 100)) {
    return NextResponse.json({ error: "Ce code promo est mal configuré" }, { status: 409 });
  }

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Ce code promo a expiré" }, { status: 400 });
  }

  // Check max uses
  if (data.max_uses !== null && data.used_count >= data.max_uses) {
    return NextResponse.json({ error: "Ce code promo a atteint son nombre d'utilisations maximum" }, { status: 400 });
  }

  const slugs = [...new Set(items.map((item) => item.slug.trim()))];
  const { data: databaseProducts, error: productsError } = await supabase
    .from("products")
    .select("slug,price,original_price")
    .in("slug", slugs)
    .eq("active", true);
  if (productsError) {
    console.error("Coupon product verification error:", productsError);
    return NextResponse.json({ error: "Impossible de vérifier le panier pour le moment" }, { status: 503 });
  }

  const productBySlug = new Map<string, Record<string, unknown>>();
  for (const product of databaseProducts ?? []) productBySlug.set(String(product.slug), product as Record<string, unknown>);
  if (slugs.some((slug) => !productBySlug.has(slug))) {
    return NextResponse.json({ error: "Un article du panier n'est plus disponible" }, { status: 409 });
  }

  const pricing = calculateCouponPricing(items, productBySlug);
  if (pricing.eligibleSubtotal <= 0) {
    return NextResponse.json({
      error: "Ce code ne s'applique pas aux articles déjà en promotion",
      excluded_items_count: pricing.excludedItemsCount,
    }, { status: 400 });
  }

  // The minimum is checked against coupon-eligible merchandise only.
  if (data.min_order !== null && pricing.eligibleSubtotal < Number(data.min_order)) {
    return NextResponse.json({ error: `Minimum de ${data.min_order} MAD requis sur les articles hors promotion` }, { status: 400 });
  }

  const discount = calculateCouponDiscount(data.type, couponValue, pricing.eligibleSubtotal);

  return NextResponse.json({
    id: data.id,
    code: data.code,
    type: data.type,
    value: data.value,
    discount,
    eligible_subtotal: pricing.eligibleSubtotal,
    excluded_subtotal: pricing.excludedSubtotal,
    excluded_items_count: pricing.excludedItemsCount,
  });
}
