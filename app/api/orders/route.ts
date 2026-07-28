import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getCustomerUser, isAdminRequest } from "@/lib/request-auth";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";
import { calculateCouponDiscount, calculateCouponPricing } from "@/lib/coupon-pricing";
import { couponStateAfterUse } from "@/lib/coupon-redemption";
import { calculateCheckoutTotal } from "@/lib/checkout-total";
import { shippingConfigFromSettings } from "@/lib/shipping-config";
import { resolveShippingQuote, type ShippingZoneRule } from "@/lib/shipping-zones";
import { verifyPayPalCapture } from "@/lib/paypal-server";
import { resolveProductVariantImage } from "@/lib/product-variant-image";
import { colorPricesFromTags } from "@/lib/product-variant-pricing";
import { loyaltyTierForPoints } from "@/lib/loyalty";
import { enforceRateLimit } from "@/lib/api-security";
import {
  PAYMENT_SETTING_KEYS,
  paymentMethodAvailability,
  paymentMethodsFromSettings,
} from "@/lib/payment-methods";
import { sizeStockFromTags } from "@/lib/product-inventory";

// Use service role key server-side so RLS doesn't block order insertion
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lecomax.com";
const EMAIL_LOGO_URL = `${SITE_URL}/images/email%20image/email%20image.png`;
const EMAIL_LOGO_CONTENT_ID = "lecomax-store-logo";

function formatInvoiceMoney(value: number) {
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MAD`;
}

function generateOrderNumber(): string {
  return `ECO-${Math.floor(100000 + Math.random() * 900000)}`;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/[<>\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength)
    : "";
}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeRecoveryPhone(value: unknown) {
  if (typeof value !== "string") return null;
  let phone = value.trim().replace(/[\s().-]/g, "");
  if (phone.startsWith("00212")) phone = `0${phone.slice(5)}`;
  else if (phone.startsWith("+212")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("212")) phone = `0${phone.slice(3)}`;
  return /^0[67]\d{8}$/.test(phone) ? phone : null;
}

function missingAbandonedCartTokenColumn(error: { message: string; code?: string } | null) {
  if (!error) return false;
  return (error.code === "42703" || error.code === "PGRST204") && /cart_token/i.test(error.message);
}

// GET /api/orders — list all orders (admin), or GET /api/orders?order_number=ECO-XXXXXX (single order lookup)
export async function GET(req: NextRequest) {
  const admin = await isAdminRequest(req);
  const user = admin ? null : await getCustomerUser(req);
  if (!admin && !user?.email) return NextResponse.json({ error: "Session expirée ou non autorisée." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const order_number = searchParams.get("order_number");
  const email = searchParams.get("email");
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");
  const orderSource = searchParams.get("order_source");

  // Single order lookup by order_number
  if (order_number) {
    if (!admin) return NextResponse.json({ error: "Utilisez le suivi de commande avec votre numéro et votre e-mail." }, { status: 403 });
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, tracking_number, total, created_at, customer, items")
      .eq("order_number", order_number)
      .single();
    if (error || !data) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    return NextResponse.json({ order: data });
  }

  // List orders filtered by customer email (for client dashboard)
  let query = supabase.from("orders").select("id, order_number, status, total, created_at, customer, items, tracking_number, payment_method, payment_status", { count: "exact" }).order("created_at", { ascending: false });
  const safeEmail = admin ? email : user!.email!;
  if (safeEmail) query = query.eq("customer->>email", safeEmail.toLowerCase());
  if (status && status !== "all") query = query.eq("status", status);
  if (admin && ["website", "mobile_app"].includes(orderSource ?? "")) {
    query = query.eq("order_source", orderSource);
  }
  if (limit) query = query.limit(parseInt(limit));
  query = query.abortSignal(AbortSignal.timeout(12_000));

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { "X-Total-Count": String(count ?? data?.length ?? 0) },
  });
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  const blocked = enforceRateLimit(req, "orders:create", 12, 60_000);
  if (blocked) return blocked;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer, items, total, shipping, payment_fee, payment_provider, paypal_order_id, paypal_capture_id, coupon_id, discount, notes, abandoned_cart_token } = body as {
    customer: {
      name: string;
      phone: string;
      email: string;
      city: string;
      address: string;
    };
    items: {
      slug: string;
      name: string;
      price: number;
      qty: number;
      image: string;
      size?: string;
      color?: string;
    }[];
    total: number;
    shipping?: number;
    payment_fee?: number;
    payment_provider?: "cod" | "paypal";
    paypal_order_id?: string;
    paypal_capture_id?: string;
    coupon_id?: string | null;
    discount?: number;
    notes?: string;
    abandoned_cart_token?: string | null;
  };
  const rawIdempotencyKey = req.headers.get("idempotency-key") ?? "";
  const idempotencyKey = /^[A-Za-z0-9_-]{16,120}$/.test(rawIdempotencyKey)
    ? rawIdempotencyKey
    : null;
  const orderSource = req.headers.get("x-lecomax-client") === "mobile_app"
    ? "mobile_app"
    : "website";
  if (rawIdempotencyKey && !idempotencyKey) {
    return NextResponse.json({ error: "Clé d’idempotence invalide." }, { status: 400 });
  }
  if (idempotencyKey) {
    const { data: existingOrder, error: lookupError } = await supabase
      .from("orders")
      .select("id,order_number,total")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (lookupError && !["42703", "PGRST204"].includes(lookupError.code ?? "")) {
      console.error("Order idempotency lookup failed:", lookupError);
      return NextResponse.json({ error: "Impossible de sécuriser cette commande." }, { status: 503 });
    }
    if (lookupError && orderSource === "mobile_app") {
      console.error("Mobile order idempotency migration is missing.");
      return NextResponse.json(
        {
          error: "La création sécurisée des commandes mobiles est momentanément indisponible.",
          code: "ORDER_IDEMPOTENCY_MIGRATION_REQUIRED",
        },
        { status: 503 },
      );
    }
    if (existingOrder) {
      return NextResponse.json({ ...existingOrder, duplicate: true }, { status: 200 });
    }
  }

  // Validate and normalize all browser-provided order data.
  if (!customer?.name || !customer?.phone || !customer?.city || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Champs manquants (customer, items)." }, { status: 400 });
  }
  if (!Number.isFinite(total) || total <= 0 || total > 1_000_000) {
    return NextResponse.json({ error: "Total invalide." }, { status: 400 });
  }
  if (items.length > 50 || items.some((item) =>
    !item || !cleanText(item.slug, 160) || !cleanText(item.name, 200) ||
    !Number.isFinite(item.price) || item.price <= 0 || item.price > 1_000_000 ||
    !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20
  )) {
    return NextResponse.json({ error: "Un ou plusieurs articles sont invalides." }, { status: 400 });
  }

  customer.name = cleanText(customer.name, 100);
  customer.phone = cleanText(customer.phone, 30);
  customer.email = cleanText(customer.email, 254).toLowerCase();
  customer.city = cleanText(customer.city, 100);
  customer.address = cleanText(customer.address, 300);
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  for (const item of items) {
    item.slug = cleanText(item.slug, 160);
    item.name = cleanText(item.name, 200);
    item.image = cleanText(item.image, 500);
    item.size = cleanText(item.size, 50) || undefined;
    item.color = cleanText(item.color, 50) || undefined;
  }

  // Re-read products server-side. Prices and stock sent by a browser are never authoritative.
  const slugs = [...new Set(items.map((item) => item.slug))];
  const { data: databaseProducts, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("slug", slugs)
    .eq("active", true);
  if (productsError) {
    console.error("Order product verification error:", productsError);
    return NextResponse.json({ error: "Impossible de vérifier les articles pour le moment." }, { status: 503 });
  }
  const productBySlug = new Map<string, Record<string, unknown>>();
  for (const product of databaseProducts ?? []) productBySlug.set(String(product.slug), product as Record<string, unknown>);

  const requestedBySlug = new Map<string, number>();
  const requestedByColor = new Map<string, number>();
  const requestedBySize = new Map<string, number>();
  for (const item of items) {
    requestedBySlug.set(item.slug, (requestedBySlug.get(item.slug) ?? 0) + item.qty);
    if (item.color) {
      const key = `${item.slug}\u0000${item.color}`;
      requestedByColor.set(key, (requestedByColor.get(key) ?? 0) + item.qty);
    }
    if (item.size) {
      const key = `${item.slug}\u0000${item.size}`;
      requestedBySize.set(key, (requestedBySize.get(key) ?? 0) + item.qty);
    }
  }

  for (const item of items) {
    const product = productBySlug.get(item.slug);
    const variantPrices = colorPricesFromTags(product?.tags);
    const authoritativePrice = Number(item.color && variantPrices[item.color]?.price !== undefined
      ? variantPrices[item.color].price
      : product?.price);
    if (!product || !Number.isFinite(authoritativePrice) || authoritativePrice <= 0) {
      return NextResponse.json({ error: `L'article « ${item.name} » n'est plus disponible.` }, { status: 409 });
    }
    const stock = Number(product.stock);
    if (Number.isFinite(stock) && stock >= 0 && (requestedBySlug.get(item.slug) ?? item.qty) > stock) {
      return NextResponse.json({ error: `Stock insuffisant pour « ${item.name} ».` }, { status: 409 });
    }
    const colorStock = product.color_stock && typeof product.color_stock === "object" && !Array.isArray(product.color_stock)
      ? product.color_stock as Record<string, unknown>
      : null;
    const variantStock = item.color && colorStock && item.color in colorStock
      ? Number(colorStock[item.color])
      : null;
    const requestedColorQuantity = item.color ? (requestedByColor.get(`${item.slug}\u0000${item.color}`) ?? item.qty) : item.qty;
    if (variantStock !== null && Number.isFinite(variantStock) && requestedColorQuantity > variantStock) {
      return NextResponse.json({ error: `La couleur choisie pour « ${item.name} » est épuisée ou insuffisante.` }, { status: 409 });
    }
    const sizeStock = sizeStockFromTags(product.tags);
    const requestedSizeQuantity = item.size ? (requestedBySize.get(`${item.slug}\u0000${item.size}`) ?? item.qty) : item.qty;
    if (item.size && item.size in sizeStock && requestedSizeQuantity > sizeStock[item.size]) {
      return NextResponse.json({ error: `La taille choisie pour « ${item.name} » est épuisée ou insuffisante.` }, { status: 409 });
    }
    item.price = authoritativePrice;
    item.name = cleanText(product.name, 200) || item.name;
    const serverImage = cleanText(resolveProductVariantImage({
      slug: item.slug,
      color: item.color,
      fallback: item.image,
      colors: product.colors,
      images: product.images,
    }), 500);
    if (serverImage) item.image = serverImage;
  }

  const safeNotes = cleanText(notes, 1000) || null;
  const calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const couponPricing = calculateCouponPricing(
    items.map((item) => ({ slug: item.slug, quantity: item.qty })),
    productBySlug
  );
  const { data: featureRows } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", [
      "enable_coupons",
      "enable_ecoclub",
      "enable_cod",
      "enable_paypal",
      "checkout_minimum_order",
      ...PAYMENT_SETTING_KEYS,
    ]);
  const featureSettings = Object.fromEntries((featureRows ?? []).map((row) => [row.key, String(row.value ?? "")]));
  const minimumOrder = Number(featureSettings.checkout_minimum_order ?? 0);
  if (Number.isFinite(minimumOrder) && minimumOrder > 0 && calculatedSubtotal < minimumOrder) {
    return NextResponse.json({ error: `Le montant minimum de commande est de ${minimumOrder} MAD.` }, { status: 409 });
  }

  let couponDiscount = 0;
  let couponUsage: {
    id: string;
    usedCount: number;
    maxUses: number | null;
  } | null = null;
  if (coupon_id) {
    if (featureSettings.enable_coupons === "false") {
      return NextResponse.json({ error: "Les codes promotionnels sont désactivés." }, { status: 409 });
    }
    const { data: coupon } = await supabase.from("coupons").select("*").eq("id", coupon_id).eq("active", true).single();
    const couponValue = Number(coupon?.value);
    const couponValid = coupon &&
      ["percent", "fixed"].includes(coupon.type) &&
      Number.isFinite(couponValue) && couponValue > 0 &&
      (coupon.type !== "percent" || couponValue <= 100) &&
      (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
      (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
      couponPricing.eligibleSubtotal > 0 &&
      (coupon.min_order === null || couponPricing.eligibleSubtotal >= Number(coupon.min_order));
    if (!couponValid) return NextResponse.json({ error: "Le code promotionnel n'est plus valide." }, { status: 409 });
    couponUsage = {
      id: String(coupon.id),
      usedCount: Number(coupon.used_count ?? 0),
      maxUses: coupon.max_uses === null ? null : Number(coupon.max_uses),
    };
    couponDiscount = calculateCouponDiscount(
      coupon.type,
      couponValue,
      couponPricing.eligibleSubtotal
    );
  }

  let loyaltyPercent = 0;
  const customerUser = await getCustomerUser(req);
  if (featureSettings.enable_ecoclub !== "false" && customerUser?.email?.toLowerCase() === customer.email) {
    const { data: pointRecord } = await supabase.from("user_points").select("points").eq("email", customer.email).single();
    const points = Number(pointRecord?.points ?? 0);
    loyaltyPercent = loyaltyTierForPoints(points).discountPercent;
  }
  const loyaltyDiscount = Math.round((calculatedSubtotal - couponDiscount) * loyaltyPercent / 100);
  const safeDiscount = couponDiscount + loyaltyDiscount;

  const [{ data: zones }, { data: settingRows }] = await Promise.all([
    supabase.from("shipping_zones").select("id,name,cities,standard_rate,free_threshold,estimated_days,sort_order,active").eq("active", true),
    supabase.from("settings").select("key, value").in("key", ["shipping_cost", "free_shipping_threshold", "shipping_estimated_days"]),
  ]);
  const settings = Object.fromEntries((settingRows ?? []).map((row) => [row.key, row.value]));
  const shippingConfig = shippingConfigFromSettings(settings);
  const shippingQuote = resolveShippingQuote(
    customer.city,
    calculatedSubtotal,
    (zones ?? []) as ShippingZoneRule[],
    shippingConfig,
  );
  const shippingRate = shippingQuote.cost;
  const safeShipping = shippingQuote.cost;

  if (Math.abs(Number(shipping ?? 0) - safeShipping) > 0.01 || Math.abs(Number(discount ?? 0) - safeDiscount) > 0.01) {
    return NextResponse.json({ error: "Les frais ou la remise ont changé. Actualisez la page puis réessayez." }, { status: 409 });
  }
  const provider = payment_provider === "paypal" ? "paypal" : payment_provider === "cod" ? "cod" : null;
  if (!provider) return NextResponse.json({ error: "Mode de paiement invalide." }, { status: 400 });
  const paymentMethod = paymentMethodsFromSettings(featureSettings).find(
    (method) => method.provider === provider,
  );
  if (!paymentMethod) {
    return NextResponse.json({ error: "Mode de paiement indisponible." }, { status: 409 });
  }
  const paymentAvailability = paymentMethodAvailability(
    paymentMethod,
    customer.city,
    calculatedSubtotal,
  );
  if (!paymentAvailability.available) {
    return NextResponse.json(
      { error: paymentAvailability.reason || "Mode de paiement indisponible." },
      { status: 409 },
    );
  }
  const safePaymentFee = paymentMethod.fee;
  if (Math.abs(Number(payment_fee ?? 0) - safePaymentFee) > 0.01) {
    return NextResponse.json(
      { error: "Les frais du moyen de paiement ont changé. Actualisez puis réessayez." },
      { status: 409 },
    );
  }
  const expectedTotal = calculateCheckoutTotal({
    subtotal: calculatedSubtotal,
    shipping: safeShipping,
    paymentFee: safePaymentFee,
    discount: safeDiscount,
  });
  if (Math.abs(expectedTotal - total) > 0.01) {
    return NextResponse.json({ error: "Le total de la commande a changé. Actualisez la page puis réessayez." }, { status: 409 });
  }

  if (provider === "cod" && featureSettings.enable_cod === "false") {
    return NextResponse.json({ error: "Le paiement à la livraison est temporairement désactivé." }, { status: 409 });
  }
  if (provider === "paypal" && featureSettings.enable_paypal === "false") {
    return NextResponse.json({ error: "Le paiement PayPal est temporairement désactivé." }, { status: 409 });
  }

  let paymentReference: string | null = null;
  let paymentStatus = provider === "paypal" ? "captured" : "pending";
  let paymentCurrency: string | null = null;
  let paymentAmount: number | null = null;

  if (provider === "paypal") {
    try {
      const verified = await verifyPayPalCapture({
        orderId: cleanText(paypal_order_id, 64),
        captureId: cleanText(paypal_capture_id, 64),
        expectedMad: expectedTotal,
      });
      paymentReference = verified.captureId;
      paymentCurrency = verified.currency;
      paymentAmount = Number(verified.amount);
    } catch (verificationError) {
      const reason = verificationError instanceof Error ? verificationError.message : "PAYPAL_VERIFICATION_FAILED";
      console.error("PayPal capture verification failed:", reason);
      const unavailable = ["PAYPAL_NOT_CONFIGURED", "PAYPAL_AUTH_FAILED"].includes(reason);
      return NextResponse.json(
        { error: unavailable ? "La vérification PayPal est momentanément indisponible." : "Le paiement PayPal n'a pas pu être vérifié." },
        { status: unavailable ? 503 : 422 },
      );
    }

    const { data: existingOrder, error: existingError } = await supabase
      .from("orders")
      .select("id,order_number")
      .eq("payment_reference", paymentReference)
      .maybeSingle();
    if (existingError) {
      console.error("PayPal idempotency lookup failed:", existingError);
      return NextResponse.json({ error: "Impossible de sécuriser ce paiement PayPal." }, { status: 503 });
    }
    if (existingOrder) {
      return NextResponse.json({ ...existingOrder, duplicate: true });
    }
  }

  const order_number = generateOrderNumber();
  const isPayPal = provider === "paypal";
  const displayPaymentMethod = isPayPal ? "PayPal" : "Paiement à la livraison";

  const orderInsert = {
    order_number,
    customer,
    items,
    total: expectedTotal,
    payment_method: displayPaymentMethod,
    payment_reference: paymentReference,
    payment_status: paymentStatus,
    payment_currency: paymentCurrency,
    payment_amount: paymentAmount,
    status: isPayPal ? "confirmed" : "pending",
    tracking_number: null,
    notes: safeNotes,
    created_at: new Date().toISOString(),
    order_source: orderSource,
    idempotency_key: idempotencyKey,
  };
  let inventoryReserved = false;
  const inventoryPayload = items.map(({ slug, qty, color, size }) => ({ slug, qty, color: color || null, size: size || null }));
  const { error: reservationError } = await supabase.rpc("reserve_order_inventory", {
    p_items: inventoryPayload,
  });
  if (reservationError) {
    const migrationPending = ["PGRST202", "42883"].includes(reservationError.code ?? "");
    if (!migrationPending) {
      const unavailable = /INSUFFICIENT_(PRODUCT|VARIANT)_STOCK/.test(reservationError.message);
      console.error("Inventory reservation failed:", reservationError.message);
      return NextResponse.json(
        { error: unavailable ? "Un article ou une variante vient d’être épuisé. Actualisez votre panier." : "Impossible de réserver le stock pour le moment." },
        { status: unavailable ? 409 : 503 },
      );
    }
    if (orderSource === "mobile_app") {
      console.error("Atomic inventory migration is missing for mobile checkout.");
      return NextResponse.json(
        {
          error: "La réservation sécurisée du stock est momentanément indisponible.",
          code: "ATOMIC_INVENTORY_MIGRATION_REQUIRED",
        },
        { status: 503 },
      );
    }
    // Additive deployment compatibility: the legacy path remains available
    // only until the inventory migration reaches the database.
    console.warn("Atomic inventory migration is pending; using the legacy stock path.");
  } else {
    inventoryReserved = true;
  }
  let { data, error } = await supabase.from("orders").insert(orderInsert).select("id, order_number").single();

  // Preserve website checkout compatibility while a deployment is waiting for
  // the additive migration above. Mobile idempotency becomes active as soon as
  // the migration is applied.
  if (error && orderSource === "website" && ["42703", "PGRST204"].includes(error.code ?? "")) {
    const { order_source: _source, idempotency_key: _key, ...legacyInsert } = orderInsert;
    ({ data, error } = await supabase.from("orders").insert(legacyInsert).select("id, order_number").single());
  }

  if (error) {
    if (inventoryReserved) {
      await supabase.rpc("release_order_inventory", { p_items: inventoryPayload });
      inventoryReserved = false;
    }
    if (error.code === "23505" && idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id,order_number")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existingOrder) return NextResponse.json({ ...existingOrder, duplicate: true });
    }
    if (isPayPal && error.code === "23505" && paymentReference) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id,order_number")
        .eq("payment_reference", paymentReference)
        .maybeSingle();
      if (existingOrder) return NextResponse.json({ ...existingOrder, duplicate: true });
    }
    console.error("Order insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "La commande n’a pas pu être créée." }, { status: 500 });
  }

  if (featureSettings.enable_ecoclub !== "false") {
    const { error: loyaltyReservationError } = await supabase.rpc("reserve_order_loyalty_points", {
      p_order_id: data.id,
    });
    if (loyaltyReservationError) {
      console.error("EcoClub pending points reservation failed:", loyaltyReservationError.message);
    }
  }

  // A successfully created order is no longer abandoned. The random token is
  // a capability identifier and never exposes customer data by itself.
  const abandonedCartToken = cleanText(abandoned_cart_token, 36);
  if (UUID_PATTERN.test(abandonedCartToken)) {
    let { error: cleanupError } = await supabase
      .from("abandoned_carts")
      .delete()
      .eq("cart_token", abandonedCartToken);
    if (missingAbandonedCartTokenColumn(cleanupError)) {
      const recoveryPhone = normalizeRecoveryPhone(customer.phone);
      const recoveryEmail = customer.email || null;
      if (recoveryPhone) {
        ({ error: cleanupError } = await supabase.from("abandoned_carts").delete().eq("phone", recoveryPhone));
      } else if (recoveryEmail) {
        ({ error: cleanupError } = await supabase.from("abandoned_carts").delete().eq("email", recoveryEmail));
      } else {
        cleanupError = null;
      }
    }
    if (cleanupError) console.error("Abandoned cart cleanup after order failed:", cleanupError);
  }

  await broadcastAdminPushNotification({
    eventKey: `order:${data.id}`,
    title: `Nouvelle commande · ${order_number}`,
    body: `${customer.name} · ${total.toFixed(0)} MAD · ${items.length} article${items.length > 1 ? "s" : ""}`,
    url: "/admin/orders/",
    tag: `admin-order-${data.id}`,
    requireInteraction: true,
  }).catch((pushError) => console.error("Admin order push failed:", pushError));

  // Backward-compatible fallback used only while the additive inventory RPC
  // migration has not reached the database yet.
  if (!inventoryReserved && orderSource === "website") {
    for (const item of items) {
      if (!item.slug) continue;
      const { data: prod } = await supabase
        .from("products")
        .select("stock, color_stock, slug")
        .eq("slug", item.slug)
        .single();
      if (!prod || typeof prod.stock !== "number") continue;
      const updates: Record<string, unknown> = { stock: Math.max(0, prod.stock - item.qty) };
      if (item.color && prod.color_stock && typeof prod.color_stock === "object") {
        const cs = prod.color_stock as Record<string, number>;
        if (typeof cs[item.color] === "number") {
          updates.color_stock = { ...cs, [item.color]: Math.max(0, cs[item.color] - item.qty) };
        }
      }
      await supabase.from("products").update(updates).eq("slug", item.slug);
    }
  }

  // Consume the coupon only after the order exists. The database function uses
  // one conditional UPDATE, so one-use codes become inactive immediately and
  // concurrent requests cannot increment beyond max_uses.
  if (couponUsage) {
    const { data: consumedCoupon, error: consumeError } = await supabase.rpc(
      "consume_coupon_use",
      { p_coupon_id: couponUsage.id },
    );
    if (consumeError && ["PGRST202", "42883"].includes(consumeError.code ?? "")) {
      // Additive deployment fallback until the migration reaches production.
      const fallbackState = couponStateAfterUse(
        couponUsage.usedCount,
        couponUsage.maxUses,
      );
      const { data: fallbackCoupon, error: fallbackError } = await supabase
        .from("coupons")
        .update({
          used_count: fallbackState.usedCount,
          active: fallbackState.active,
        })
        .eq("id", couponUsage.id)
        .eq("active", true)
        .eq("used_count", couponUsage.usedCount)
        .select("id")
        .maybeSingle();
      if (fallbackError || !fallbackCoupon) {
        console.error(
          "Coupon redemption fallback failed:",
          fallbackError?.message ?? "COUPON_ALREADY_CONSUMED",
        );
      }
    } else if (consumeError || !consumedCoupon) {
      console.error(
        "Atomic coupon redemption failed:",
        consumeError?.message ?? "COUPON_ALREADY_CONSUMED",
      );
    }
  }

  // EcoClub points are reserved now and released atomically when delivered.
  // See /api/orders/[id]/route.ts PUT handler.

  if (resend && customer.email) {
    const invoiceNumber = `FAC-${order_number}`;
    const invoiceDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryFee = safeShipping;
    const invoiceDiscount = safeDiscount;

    const itemRowsHtml = items.map((i, idx) => {
      const imgSrc = i.image?.startsWith("http") ? i.image : `${SITE_URL}${i.image}`;
      const lineTotal = formatInvoiceMoney(i.price * i.qty);
      const cleanSize = i.size?.replace(/^taille\s*:?\s*/i, "");
      const pills = [
        cleanSize ? `<span style="display:inline-block;font-size:10px;font-weight:700;color:#4b5563;background:#f3f4f6;padding:4px 8px;border-radius:999px;margin:3px 4px 0 0;">Taille&nbsp; ${cleanSize}</span>` : "",
        i.color ? `<span style="display:inline-block;font-size:10px;font-weight:700;color:#4b5563;background:#f3f4f6;padding:4px 8px;border-radius:999px;margin:3px 4px 0 0;">Couleur&nbsp; ${i.color}</span>` : "",
        `<span class="mobile-qty" style="display:none;font-size:10px;font-weight:800;color:#047857;background:#ecfdf5;padding:4px 8px;border-radius:999px;margin:3px 4px 0 0;">Qt&eacute;&nbsp; &times;${i.qty}</span>`,
        `<span class="mobile-price" style="display:none;font-size:10px;font-weight:900;color:#0c1a12;background:#dcfce7;padding:4px 8px;border-radius:999px;margin:3px 4px 0 0;">${lineTotal}</span>`,
      ].join("");
      return `
      <tr style="background:#ffffff;">
        <td class="hide-mobile" style="padding:16px 10px;color:#d1d5db;font-weight:800;font-size:10px;border-bottom:1px solid #edf0ed;width:24px;">${String(idx + 1).padStart(2, "0")}</td>
        <td class="product-cell" style="padding:16px 10px;border-bottom:1px solid #edf0ed;">
          <table class="product-layout" width="100%" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;"><tr>
            <td class="product-image-cell" style="width:58px;vertical-align:top;">
              <img class="product-image" src="${imgSrc}" alt="${i.name}" width="58" height="62" style="width:58px;height:62px;object-fit:cover;border-radius:12px;border:1px solid #e5e7eb;background:#f7f8f7;display:block;" />
            </td>
            <td class="product-content" style="padding-left:12px;vertical-align:middle;overflow-wrap:anywhere;word-break:break-word;">
              <p class="product-name" style="margin:0 0 4px;font-size:13px;font-weight:800;color:#111827;line-height:1.35;overflow-wrap:anywhere;word-break:break-word;">${i.name}</p>
              ${pills}
            </td>
          </tr></table>
        </td>
        <td class="hide-mobile" style="padding:16px 10px;text-align:right;font-weight:800;font-size:12px;color:#374151;border-bottom:1px solid #edf0ed;">${i.qty}</td>
        <td class="hide-mobile" style="padding:16px 10px;text-align:right;font-size:11px;color:#9ca3af;border-bottom:1px solid #edf0ed;white-space:nowrap;">${formatInvoiceMoney(i.price)}</td>
        <td class="line-total" style="padding:16px 10px;text-align:right;font-weight:900;font-size:13px;color:#0c1a12;border-bottom:1px solid #edf0ed;white-space:nowrap;">${lineTotal}</td>
      </tr>`;
    }).join("");

    resend.emails.send({
      from: "L'ecomax <noreply@lecomax.com>",
      replyTo: "contact@lecomax.com",
      to: customer.email,
      subject: `Commande ${order_number} confirmée | Merci pour votre confiance | L'ecomax`,
      attachments: [
        {
          path: EMAIL_LOGO_URL,
          filename: "lecomax-store-logo.png",
          contentId: EMAIL_LOGO_CONTENT_ID,
        },
      ],
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Facture ${invoiceNumber}</title>
  <style>
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    .mobile-qty { display: none !important; }
    .mobile-price { display: none !important; }
    @media only screen and (max-width: 620px) {
      .email-shell { padding: 10px 8px 24px !important; }
      .invoice-card { width: 100% !important; max-width: 100% !important; border-radius: 18px !important; }
      .mobile-px { padding-left: 20px !important; padding-right: 20px !important; }
      .logo-wrap { padding: 22px 20px 0 !important; }
      .store-logo { width: 66px !important; height: 66px !important; border-radius: 17px !important; }
      .header-col, .party-col, .meta-cell, .footer-col { display: block !important; width: auto !important; text-align: left !important; }
      .header-right { padding-top: 22px !important; text-align: left !important; }
      .invoice-number { font-size: 24px !important; }
      .party-col { padding: 22px 20px !important; border-right: 0 !important; }
      .party-customer { border-top: 1px solid #edf0ed !important; }
      .meta-cell { padding: 15px 20px !important; border-right: 0 !important; border-bottom: 1px solid #e5e7eb !important; }
      .articles-wrap { padding: 24px 14px 0 !important; }
      .items-table { width: 100% !important; table-layout: fixed !important; border-radius: 14px !important; }
      .hide-mobile { display: none !important; }
      .mobile-qty { display: inline-block !important; }
      .mobile-price { display: inline-block !important; }
      .product-cell { padding: 14px 8px !important; }
      .product-image-cell { width: 62px !important; }
      .product-image { width: 62px !important; height: 68px !important; }
      .product-layout { width: 100% !important; table-layout: fixed !important; }
      .product-content, .product-name { min-width: 0 !important; overflow-wrap: anywhere !important; word-break: break-word !important; white-space: normal !important; }
      .line-total { display: none !important; }
      .totals-wrap { padding: 18px 18px 26px !important; }
      .totals-table { width: 100% !important; }
      .grand-total-value { font-size: 20px !important; }
      .footer-col { padding-bottom: 14px !important; }
      .footer-center { text-align: left !important; }
      .footer-right { text-align: left !important; padding-bottom: 0 !important; }
      .trust-cell { display: block !important; width: auto !important; padding: 4px 0 !important; text-align: left !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Votre commande ${order_number} est bien enregistr&eacute;e. Retrouvez votre facture et tous les d&eacute;tails ici.</div>
<table class="email-shell" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee;padding:36px 16px;">
<tr><td align="center">
<table class="invoice-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-radius:10px;overflow:hidden;box-shadow:0 20px 60px rgba(12,26,18,.10);">

  <!-- TOP ACCENT BAR -->
  <tr><td style="height:4px;background:linear-gradient(90deg,#166534,#16a34a,#3ecf4c,#4ade80);border-radius:8px 8px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- STORE LOGO -->
  <tr><td class="logo-wrap" style="background:#0c1a12;padding:26px 44px 0;text-align:center;">
    <a href="${SITE_URL}" style="display:inline-block;text-decoration:none;">
      <img class="store-logo" src="cid:${EMAIL_LOGO_CONTENT_ID}" alt="L'ecomax" width="76" height="76" style="display:block;width:76px;height:76px;border:0;border-radius:19px;object-fit:cover;box-shadow:0 12px 34px rgba(0,0,0,.28);" />
    </a>
  </td></tr>

  <!-- DARK HEADER -->
  <tr><td class="mobile-px" style="background:#0c1a12;padding:20px 44px 32px;border-radius:0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="header-col" style="vertical-align:top;">
        <!-- Logo text -->
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1;font-family:'Helvetica Neue',Arial,sans-serif;">L&apos;eco</td>
          <td style="font-size:28px;font-weight:900;color:#4ade80;letter-spacing:-1px;line-height:1;font-family:'Helvetica Neue',Arial,sans-serif;">max</td>
        </tr></table>
        <p style="margin:6px 0 0;font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;">BOUTIQUE EN LIGNE · MAROC</p>
        <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,0.35);line-height:1.8;">contact@lecomax.com<br>lecomax.com<br>Maroc</p>
      </td>
      <td class="header-col header-right" style="vertical-align:top;text-align:right;">
        <span style="display:inline-block;padding:4px 12px;border:1px solid rgba(74,222,128,0.3);border-radius:5px;font-size:9px;font-weight:700;color:#4ade80;letter-spacing:3px;background:rgba(74,222,128,0.08);">&#9679; FACTURE</span>
        <p class="invoice-number" style="margin:14px 0 0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1;">${invoiceNumber}</p>
        <p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.4);line-height:2;">
          Date : <span style="color:rgba(255,255,255,0.7);font-weight:500;">${invoiceDate}</span><br>
          Commande : <span style="color:rgba(255,255,255,0.7);font-weight:500;">#${order_number}</span>
        </p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="height:1px;background:linear-gradient(90deg,rgba(74,222,128,0.6),rgba(74,222,128,0.05));font-size:0;">&nbsp;</td></tr></table>
  </td></tr>

  <!-- ORDER CONFIRMATION -->
  <tr><td class="mobile-px" style="background:#ecfdf3;padding:18px 44px;border-bottom:1px solid #ccefd6;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="width:42px;vertical-align:middle;">
        <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#16a34a;color:#fff;font-size:17px;font-weight:900;">&#10003;</span>
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0;font-size:13px;font-weight:900;color:#0f5132;">Commande bien enregistr&eacute;e</p>
        <p style="margin:4px 0 0;font-size:11px;line-height:1.5;color:#4b7a61;">Merci ${customer.name}. Notre &eacute;quipe pr&eacute;pare maintenant votre commande avec soin.</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- PARTIES: DE / FACTURÉ À -->
  <tr><td style="background:#fff;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="party-col" style="padding:26px 36px;width:50%;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;vertical-align:top;border-left:3px solid #3ecf4c;">
        <p style="margin:0 0 12px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2.5px;text-transform:uppercase;">DE</p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:16px;font-weight:900;color:#111827;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">L&apos;eco</td>
          <td style="font-size:16px;font-weight:900;color:#3ecf4c;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">max</td>
        </tr></table>
        <p style="margin:10px 0 0;font-size:12px;color:#6b7280;line-height:1.9;">contact@lecomax.com<br>lecomax.com<br>Maroc</p>
      </td>
      <td class="party-col party-customer" style="padding:26px 36px;width:50%;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 12px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2.5px;text-transform:uppercase;">FACTUR&#201; &#192;</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#111827;text-transform:capitalize;">${customer.name}</p>
        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.9;">${customer.phone}<br>${customer.email}<br>${customer.address}<br>${customer.city}, Maroc</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- META: STATUT / PAIEMENT / LIVRAISON -->
  <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="meta-cell" style="padding:18px 28px;width:33%;border-right:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">STATUT</p>
        <span style="display:inline-block;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:800;">&#10003; Commande re&ccedil;ue</span>
      </td>
      <td class="meta-cell" style="padding:18px 28px;width:33%;border-right:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">PAIEMENT</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#111827;">${displayPaymentMethod}</p>
      </td>
      <td class="meta-cell" style="padding:18px 28px;width:33%;vertical-align:top;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">LIVRAISON</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#111827;">Partout au Maroc</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- ARTICLES TABLE -->
  <tr><td class="articles-wrap" style="background:#fff;padding:30px 36px 0;">
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
      <td style="font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2.5px;text-transform:uppercase;">ARTICLES COMMAND&#201;S</td>
      <td style="padding-left:8px;"><span style="display:inline-block;font-size:9px;font-weight:700;color:#fff;background:#3ecf4c;border-radius:99px;padding:1px 7px;">${items.length}</span></td>
    </tr></table>
    <table class="items-table" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ebe8;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#f9fafb;">
          <th class="hide-mobile" style="padding:9px 10px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:24px;">#</th>
          <th style="padding:9px 12px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">Produit</th>
          <th class="hide-mobile" style="padding:9px 10px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:30px;">Qt&#233;</th>
          <th class="hide-mobile" style="padding:9px 10px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:90px;">Prix unit.</th>
          <th class="hide-mobile" style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:90px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRowsHtml}</tbody>
    </table>
  </td></tr>

  <!-- TOTALS -->
  <tr><td class="totals-wrap" style="background:#fff;padding:22px 36px 30px;">
    <table class="totals-table" cellpadding="0" cellspacing="0" style="margin-left:auto;width:300px;">
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#9ca3af;border-bottom:1px dashed #f3f4f6;">Sous-total articles</td>
        <td style="padding:6px 0;font-size:12px;font-weight:700;color:#374151;text-align:right;border-bottom:1px dashed #f3f4f6;">${formatInvoiceMoney(itemsTotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#9ca3af;border-bottom:1px dashed #f3f4f6;">Frais de livraison</td>
        <td style="padding:6px 0;font-size:12px;font-weight:700;color:${deliveryFee === 0 ? "#16a34a" : "#374151"};text-align:right;border-bottom:1px dashed #f3f4f6;">${deliveryFee === 0 ? "Gratuit" : formatInvoiceMoney(deliveryFee)}</td>
      </tr>
      ${invoiceDiscount > 0 ? `<tr>
        <td style="padding:6px 0;font-size:12px;color:#16a34a;border-bottom:1px dashed #f3f4f6;">Remise appliqu&eacute;e</td>
        <td style="padding:6px 0;font-size:12px;font-weight:800;color:#16a34a;text-align:right;border-bottom:1px dashed #f3f4f6;">&minus; ${formatInvoiceMoney(invoiceDiscount)}</td>
      </tr>` : ""}
      <tr><td colspan="2" style="padding-top:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1a12;border-radius:10px;border:1px solid rgba(74,222,128,0.15);">
          <tr>
            <td style="padding:16px 18px;vertical-align:middle;">
              <p style="margin:0;font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">TOTAL &#192; PAYER</p>
              <p style="margin:3px 0 0;font-size:9px;color:rgba(255,255,255,0.35);">Toutes taxes comprises</p>
            </td>
            <td style="padding:16px 18px;text-align:right;vertical-align:middle;">
              <p class="grand-total-value" style="margin:0;font-size:22px;font-weight:900;color:#4ade80;letter-spacing:-0.5px;line-height:1;">${formatInvoiceMoney(total)}</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- TRACKING & SUPPORT -->
  <tr><td class="mobile-px" style="background:#ffffff;padding:0 36px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9efe0;border-radius:14px;background:#f7fff9;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;font-size:14px;font-weight:900;color:#0c1a12;">Nous restons avec vous jusqu&rsquo;&agrave; la livraison</p>
        <p style="margin:6px auto 16px;max-width:420px;font-size:11px;line-height:1.6;color:#6b7280;">Consultez l&rsquo;avancement de votre commande &agrave; tout moment avec votre num&eacute;ro <strong style="color:#374151;">${order_number}</strong>.</p>
        <a href="${SITE_URL}/suivre-commande/" style="display:inline-block;background:#0c1a12;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 22px;font-size:11px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;box-shadow:0 8px 18px rgba(12,26,18,.14);">Suivre ma commande &nbsp;&#8594;</a>
        <p style="margin:15px 0 0;font-size:10px;color:#9ca3af;">Une question ? R&eacute;pondez simplement &agrave; cet e-mail.</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:22px 44px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td class="footer-col" style="vertical-align:middle;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:14px;font-weight:900;color:#111827;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">L&apos;eco</td>
          <td style="font-size:14px;font-weight:900;color:#3ecf4c;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">max</td>
        </tr></table>
        <p style="margin:3px 0 0;font-size:10px;color:#9ca3af;">contact@lecomax.com · lecomax.com</p>
      </td>
      <td class="footer-col footer-center" style="text-align:center;vertical-align:middle;">
        <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;">Merci pour votre confiance !</p>
      </td>
      <td class="footer-col footer-right" style="text-align:right;vertical-align:middle;">
        <p style="margin:0;font-size:10px;color:#9ca3af;">&#201;mise le ${invoiceDate}</p>
        <p style="margin:2px 0 0;font-size:10px;color:#9ca3af;">R&#233;f : ${invoiceNumber}</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #e5e7eb;padding-top:14px;"><tr>
      <td class="trust-cell" style="font-size:10px;color:#9ca3af;">&#10003; Retours accept&#233;s sous 30 jours</td>
      <td class="trust-cell" style="font-size:10px;color:#9ca3af;text-align:center;">&#10003; Livraison ${shippingRate.toFixed(0)} MAD</td>
      <td class="trust-cell" style="font-size:10px;color:#9ca3af;text-align:right;">&#10003; Paiement s&#233;curis&#233;</td>
    </tr></table>
  </td></tr>

  <!-- BOTTOM BAR -->
  <tr><td style="background:#0c1a12;padding:12px 44px;border-radius:0 0 8px 8px;text-align:center;">
    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.3);">Document g&#233;n&#233;r&#233; automatiquement · L&apos;ecomax &copy; ${new Date().getFullYear()} · Maroc</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
    }).catch((err) => console.error("Email send error:", err));
  }

  // Notify admin of the new order
  if (resend) {
    const adminItemsHtml = items
      .map((i) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;">${i.name}${i.color ? ` — ${i.color}` : ""}${i.size ? ` (${i.size})` : ""}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:#6b7280;">×${i.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;font-weight:700;color:#111;">${(i.price * i.qty).toFixed(0)} MAD</td></tr>`)
      .join("");

    resend.emails.send({
      from: "LECOMAX <noreply@lecomax.com>",
      replyTo: "contact@lecomax.com",
      to: process.env.ADMIN_EMAIL || "contact@lecomax.com",
      subject: `🛒 Nouvelle commande ${order_number} — ${total.toFixed(0)} MAD`,
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111;padding:20px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.2em;text-transform:uppercase;">LECOMAX — Admin</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#fff;">🛒 Nouvelle commande reçue</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">N° commande</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111;">${order_number}</p>
                </td>
                <td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Total</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111;">${total.toFixed(0)} MAD</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:14px 18px;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Client</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111;">${customer.name}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${customer.phone}${customer.email ? ` · ${customer.email}` : ""}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${customer.address}, ${customer.city}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Paiement : ${displayPaymentMethod}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Articles</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;margin-bottom:24px;overflow:hidden;">${adminItemsHtml}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f3f4f6;">
            <a href="https://lecomax.com/admin/orders" style="display:inline-block;background:#111;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.05em;">Voir dans l'admin →</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch((err) => console.error("Admin notification error:", err));
  }

  return NextResponse.json({ order_number: data.order_number, id: data.id }, { status: 201 });
}
