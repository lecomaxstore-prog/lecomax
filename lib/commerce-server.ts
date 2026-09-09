import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "./supabase-server";
import { getCustomerUser } from "./request-auth";
import { databaseAvailability } from "./preorder";
import { colorPricesFromTags } from "./product-variant-pricing";
import { calculateCouponDiscount, calculateCouponPricing } from "./coupon-pricing";
import { loyaltyTierForPoints } from "./loyalty";
import { paymentMethodsFromSettings, paymentMethodAvailability, PAYMENT_SETTING_KEYS } from "./payment-methods";
import { shippingConfigFromSettings } from "./shipping-config";
import { resolveShippingQuote, type ShippingZoneRule } from "./shipping-zones";
import { storeSettings, STORE_SETTING_KEYS, validateStoreSettings } from "./store-settings";
import { calculateCheckoutTotal } from "./checkout-total";
import { roundMoney } from "./money";
import type { CartCalculation, CartRequestItem } from "./commerce-contract";

export class CommerceError extends Error {
  constructor(public code: string, message: string, public status = 409, public details?: unknown) { super(message); }
}
export const COMMERCE_SETTING_KEYS = [...new Set([...STORE_SETTING_KEYS, ...PAYMENT_SETTING_KEYS,
  "enable_cod", "enable_paypal", "enable_coupons", "enable_ecoclub"])];

/** Uncached authoritative read. Database failures must never become successful quotes. */
export async function loadCommerceConfiguration() {
  const db = createServerSupabaseClient();
  const [settingsResult, zonesResult] = await Promise.all([
    db.from("settings").select("key,value,updated_at").in("key", COMMERCE_SETTING_KEYS).order("key"),
    db.from("shipping_zones").select("id,name,cities,standard_rate,free_threshold,estimated_days,sort_order,active").eq("active", true).order("id"),
  ]);
  if (settingsResult.error || zonesResult.error) throw new CommerceError("SETTINGS_UNAVAILABLE", "Les paramètres de la boutique sont momentanément indisponibles.", 503);
  const raw = Object.fromEntries((settingsResult.data ?? []).map(row => [row.key, row.value]));
  const settings: Record<string, string> = { ...raw, ...storeSettings(raw) };
  const invalid = validateStoreSettings(settings);
  if (invalid) throw new CommerceError("INVALID_STORE_CONFIGURATION", invalid, 503);
  const zones = (zonesResult.data ?? []) as ShippingZoneRule[];
  const version = createHash("sha256").update(JSON.stringify([settingsResult.data, zones])).digest("hex");
  return { settings, zones, version, rawSettings: raw };
}

export async function calculateCart(request: NextRequest, input: {
  items?: CartRequestItem[]; city?: unknown; email?: unknown; couponId?: unknown; paymentProvider?: unknown;
}) {
  const items = input.items;
  if (!Array.isArray(items) || !items.length || items.length > 50 || items.some(item => !item ||
    typeof item.slug !== "string" || !item.slug.trim() || item.slug.length > 160 ||
    !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20 ||
    [item.color, item.size].some(value => value !== undefined && (typeof value !== "string" || value.length > 80)))) {
    throw new CommerceError("INVALID_CHECKOUT", "Le panier est invalide.", 400);
  }
  const city = typeof input.city === "string" ? input.city.trim().slice(0, 100) : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase().slice(0, 254) : "";
  const provider = input.paymentProvider;
  if (provider !== undefined && provider !== null && provider !== "cod" && provider !== "paypal") throw new CommerceError("INVALID_PAYMENT_METHOD", "Mode de paiement invalide.", 400);
  const db = createServerSupabaseClient();
  const slugs = [...new Set(items.map(item => item.slug.trim()))];
  const [config, productsResult, customer] = await Promise.all([
    loadCommerceConfiguration(), db.from("products").select("*").in("slug", slugs).eq("active", true), getCustomerUser(request),
  ]);
  if (productsResult.error) throw new CommerceError("PRODUCTS_UNAVAILABLE", "Le catalogue est momentanément indisponible.", 503);
  const { settings, zones } = config;
  if (settings.maintenance_mode === "true") throw new CommerceError("CHECKOUT_MAINTENANCE", "Les commandes sont momentanément suspendues.");
  const products = new Map<string, Record<string, unknown>>((productsResult.data ?? []).map(p => [String(p.slug), p]));
  let priceChanged = false;
  const quantities = new Map<string, number>();
  for (const item of items) {
    const key = JSON.stringify([item.slug.trim(), item.color, item.size]);
    quantities.set(key, (quantities.get(key) ?? 0) + item.quantity);
  }
  const lines: CartCalculation["items"] = items.map(item => {
    const slug = item.slug.trim(), product = products.get(slug);
    if (!product) throw new CommerceError("PRODUCT_UNAVAILABLE", "Un article n’est plus disponible.", 409, { slug });
    const availability = databaseAvailability(product, { ...item, quantity: quantities.get(JSON.stringify([slug, item.color, item.size]))! });
    if (availability.status === "OUT_OF_STOCK" || availability.status === "INVALID_VARIANT" ||
      (availability.fulfillment_type === "PREORDER" && settings.preorder_enabled === "false")) {
      throw new CommerceError("PREORDER_UNAVAILABLE", "La quantité ou la variante demandée n’est plus disponible.", 409, { slug, availableQuantity: availability.availableQuantity });
    }
    const prices = colorPricesFromTags(product.tags);
    const price = Number(item.color && prices[item.color]?.price !== undefined ? prices[item.color].price : product.price);
    if (!Number.isFinite(price) || price <= 0) throw new CommerceError("PRICE_UNAVAILABLE", "Prix indisponible.");
    if (item.price !== undefined && (!Number.isFinite(item.price) || Math.abs(item.price - price) > 0.001)) priceChanged = true;
    return { ...item, slug, price, fulfillment_type: availability.fulfillment_type as "STANDARD" | "PREORDER",
      preorder_estimated_at: availability.preorder_estimated_at ?? null, preorder_message: availability.preorder_message ?? null };
  });
  const pricing = calculateCouponPricing(lines, products);
  const subtotal = roundMoney(pricing.subtotal);
  if (provider && (subtotal < Number(settings.checkout_minimum_order) ||
    (Number(settings.checkout_maximum_order) > 0 && subtotal > Number(settings.checkout_maximum_order)))) {
    throw new CommerceError("ORDER_LIMIT", `Le montant des articles doit être compris entre ${settings.checkout_minimum_order} et ${Number(settings.checkout_maximum_order) || "∞"} MAD.`);
  }
  let couponDiscount = 0;
  let coupon: Record<string, unknown> | null = null;
  if (input.couponId) {
    if (typeof input.couponId !== "string" || input.couponId.length > 100) throw new CommerceError("COUPON_INVALID", "Code promotionnel invalide.", 400);
    if (settings.enable_coupons === "false") throw new CommerceError("COUPON_DISABLED", "Les codes promotionnels sont désactivés.");
    const result = await db.from("coupons").select("*").eq("id", input.couponId).eq("active", true).maybeSingle();
    if (result.error) throw new CommerceError("COUPON_UNAVAILABLE", "Impossible de vérifier le code promotionnel.", 503);
    const c = result.data;
    if (!c || !["percent", "fixed"].includes(c.type) || !Number.isFinite(Number(c.value)) || Number(c.value) <= 0 ||
      (c.type === "percent" && Number(c.value) > 100) ||
      (c.starts_at && new Date(c.starts_at).getTime() > Date.now()) ||
      (c.expires_at && !(new Date(c.expires_at).getTime() >= Date.now())) ||
      (c.max_uses !== null && Number(c.used_count ?? 0) >= Number(c.max_uses)) ||
      pricing.eligibleSubtotal <= 0 || pricing.eligibleSubtotal < Number(c.min_order ?? 0)) throw new CommerceError("COUPON_INVALID", "Le code promotionnel n’est plus valide.");
    coupon = c;
    couponDiscount = roundMoney(calculateCouponDiscount(c.type, Number(c.value), pricing.eligibleSubtotal));
  }
  let loyaltyDiscount = 0;
  if (settings.enable_ecoclub !== "false" && customer?.email?.toLowerCase() === email) {
    const pointsResult = await db.from("user_points").select("points").eq("email", email).maybeSingle();
    if (pointsResult.error) throw new CommerceError("LOYALTY_UNAVAILABLE", "Impossible de vérifier la remise fidélité.", 503);
    loyaltyDiscount = Math.round((subtotal - couponDiscount) * loyaltyTierForPoints(Number(pointsResult.data?.points ?? 0)).discountPercent / 100);
  }
  const shipping = resolveShippingQuote(city, subtotal, settings.free_shipping_enabled === "false" ? zones.map(zone => ({ ...zone, free_threshold: 0 })) : zones, shippingConfigFromSettings(settings));
  const method = provider ? paymentMethodsFromSettings(settings).find(m => m.provider === provider) : undefined;
  if (provider && (!method || !paymentMethodAvailability(method, city, subtotal).available)) throw new CommerceError("PAYMENT_UNAVAILABLE", "Ce mode de paiement n’est pas disponible pour cette commande.");
  const paymentFee = roundMoney(method?.fee ?? 0);
  const discount = roundMoney(couponDiscount + loyaltyDiscount);
  const taxesIncluded = settings.tax_included !== "false";
  const rate = settings.tax_enabled === "true" ? Number(settings.tax_rate) / 100 : 0;
  const taxes = roundMoney(Math.max(0, subtotal - discount) * (taxesIncluded ? rate / (1 + rate) : rate));
  const quote: CartCalculation = { items: lines, currency: settings.currency, subtotal, couponDiscount, loyaltyDiscount, discount,
    shipping: roundMoney(shipping.cost), paymentFee, taxes, taxesIncluded,
    total: calculateCheckoutTotal({ subtotal, discount, shipping: shipping.cost, paymentFee, taxes: taxesIncluded ? 0 : taxes }),
    estimatedDays: shipping.estimatedDays, zoneName: shipping.zoneName, freeThreshold: shipping.freeThreshold, priceChanged, settingsVersion: config.version };
  return { quote, config, coupon, products };
}
