import { NextRequest, NextResponse } from "next/server";
import { calculateCouponDiscount, calculateCouponPricing } from "@/lib/coupon-pricing";
import { calculateCheckoutTotal } from "@/lib/checkout-total";
import { enforceRateLimit } from "@/lib/api-security";
import { loyaltyTierForPoints } from "@/lib/loyalty";
import {
  PAYMENT_SETTING_KEYS,
  paymentMethodAvailability,
  paymentMethodsFromSettings,
  type PaymentProvider,
} from "@/lib/payment-methods";
import { getCustomerUser } from "@/lib/request-auth";
import { shippingConfigFromSettings } from "@/lib/shipping-config";
import { resolveShippingQuote, type ShippingZoneRule } from "@/lib/shipping-zones";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { colorSizeStockFromTags, sizeStockFromTags } from "@/lib/product-inventory";

type QuoteItem = {
  slug: string;
  quantity: number;
  price?: number;
  color?: string;
  size?: string;
};

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, "checkout:quote", 60, 60_000);
  if (blocked) return blocked;
  const body = (await request.json().catch(() => null)) as {
    city?: unknown;
    email?: unknown;
    couponId?: unknown;
    paymentProvider?: unknown;
    items?: QuoteItem[];
  } | null;
  const city = typeof body?.city === "string" ? body.city.trim().slice(0, 100) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const couponId = typeof body?.couponId === "string" ? body.couponId.trim().slice(0, 100) : "";
  const paymentProvider =
    body?.paymentProvider === "cod" || body?.paymentProvider === "paypal"
      ? (body.paymentProvider as PaymentProvider)
      : null;
  const items = body?.items;
  if (
    !city ||
    !Array.isArray(items) ||
    !items.length ||
    items.length > 50 ||
    items.some(
      (item) =>
        !item ||
        typeof item.slug !== "string" ||
        !item.slug.trim() ||
        item.slug.length > 160 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20 ||
        (item.color !== undefined && (typeof item.color !== "string" || item.color.length > 80)) ||
        (item.size !== undefined && (typeof item.size !== "string" || item.size.length > 80)),
    )
  ) {
    return NextResponse.json(
      { error: "Le panier ou l’adresse de livraison est invalide.", code: "INVALID_CHECKOUT" },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();
  const slugs = [...new Set(items.map((item) => item.slug.trim()))];
  const [{ data: products, error: productsError }, { data: zones, error: zonesError }, { data: settingRows, error: settingsError }] =
    await Promise.all([
      supabase.from("products").select("*").in("slug", slugs).eq("active", true),
      supabase
        .from("shipping_zones")
        .select("id,name,cities,standard_rate,free_threshold,estimated_days,sort_order,active")
        .eq("active", true),
      supabase
        .from("settings")
        .select("key,value")
        .in("key", [
          "shipping_cost",
          "free_shipping_threshold",
          "shipping_estimated_days",
          "enable_coupons",
          "enable_ecoclub",
          "enable_cod",
          "enable_paypal",
          ...PAYMENT_SETTING_KEYS,
        ]),
    ]);
  if (productsError || zonesError || settingsError) {
    return NextResponse.json(
      { error: "Impossible de calculer la commande pour le moment.", code: "QUOTE_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const productBySlug = new Map<string, Record<string, unknown>>();
  for (const product of products ?? []) {
    productBySlug.set(String(product.slug), product as Record<string, unknown>);
  }
  if (slugs.some((slug) => !productBySlug.has(slug))) {
    const unavailableSlug = slugs.find((slug) => !productBySlug.has(slug));
    return NextResponse.json(
      {
        error: "Un article du panier n’est plus disponible.",
        code: "PRODUCT_UNAVAILABLE",
        details: { slug: unavailableSlug },
      },
      { status: 409 },
    );
  }

  let priceChanged = false;
  const requestedBySlug = new Map<string, number>();
  const requestedByColor = new Map<string, number>();
  const requestedBySize = new Map<string, number>();
  const requestedByVariant = new Map<string, number>();
  for (const item of items) {
    requestedBySlug.set(
      item.slug,
      (requestedBySlug.get(item.slug) ?? 0) + item.quantity,
    );
    if (item.color) {
      const key = `${item.slug}\u0000${item.color}`;
      requestedByColor.set(key, (requestedByColor.get(key) ?? 0) + item.quantity);
    }
    if (item.size) {
      const key = `${item.slug}\u0000${item.size}`;
      requestedBySize.set(key, (requestedBySize.get(key) ?? 0) + item.quantity);
    }
    if (item.color && item.size) {
      const key = `${item.slug}\u0000${item.color}\u0000${item.size}`;
      requestedByVariant.set(key, (requestedByVariant.get(key) ?? 0) + item.quantity);
    }
  }
  for (const item of items) {
    const product = productBySlug.get(item.slug)!;
    const price = Number(product.price);
    const stock = Number(product.stock);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Le prix d’un article est indisponible.", code: "PRICE_UNAVAILABLE" },
        { status: 409 },
      );
    }
    if (Number.isFinite(Number(item.price)) && Math.abs(Number(item.price) - price) > 0.01) {
      priceChanged = true;
    }
    if (
      Number.isFinite(stock) &&
      stock >= 0 &&
      (requestedBySlug.get(item.slug) ?? item.quantity) > stock
    ) {
      return NextResponse.json(
        {
          error: `Stock insuffisant pour « ${String(product.name ?? item.slug)} ».`,
          code: "OUT_OF_STOCK",
          details: {
            slug: item.slug,
            productName: String(product.name ?? item.slug),
            requestedQuantity: requestedBySlug.get(item.slug) ?? item.quantity,
            availableQuantity: stock,
          },
        },
        { status: 409 },
      );
    }
    const colorStock =
      product.color_stock &&
      typeof product.color_stock === "object" &&
      !Array.isArray(product.color_stock)
        ? (product.color_stock as Record<string, unknown>)
        : null;
    if (item.color && colorStock && item.color in colorStock) {
      const available = Number(colorStock[item.color]);
      const requested = requestedByColor.get(`${item.slug}\u0000${item.color}`) ?? item.quantity;
      if (Number.isFinite(available) && requested > available) {
        return NextResponse.json(
          {
            error: `La couleur choisie pour « ${String(product.name ?? item.slug)} » est épuisée.`,
            code: "OUT_OF_STOCK",
            details: {
              slug: item.slug,
              productName: String(product.name ?? item.slug),
              requestedQuantity: requested,
              availableQuantity: available,
              color: item.color,
            },
          },
          { status: 409 },
        );
      }
    }
    const sizeStock = sizeStockFromTags(product.tags);
    const variantStock = colorSizeStockFromTags(product.tags);
    if (Object.keys(variantStock).length > 0) {
      const available = item.color && item.size ? variantStock[item.color]?.[item.size] ?? 0 : 0;
      const requested = item.color && item.size ? requestedByVariant.get(`${item.slug}\u0000${item.color}\u0000${item.size}`) ?? item.quantity : item.quantity;
      if (!item.color || !item.size || requested > available) {
        return NextResponse.json({ error: `Cette combinaison couleur/taille n’est plus disponible pour « ${String(product.name ?? item.slug)} ».`, code: "OUT_OF_STOCK", details: { slug: item.slug, color: item.color, size: item.size, requestedQuantity: requested, availableQuantity: available } }, { status: 409 });
      }
    }
    if (item.size && item.size in sizeStock) {
      const requested = requestedBySize.get(`${item.slug}\u0000${item.size}`) ?? item.quantity;
      const available = sizeStock[item.size];
      if (requested > available) {
        return NextResponse.json(
          {
            error: `La taille choisie pour « ${String(product.name ?? item.slug)} » est épuisée.`,
            code: "OUT_OF_STOCK",
            details: { slug: item.slug, productName: String(product.name ?? item.slug), requestedQuantity: requested, availableQuantity: available, size: item.size },
          },
          { status: 409 },
        );
      }
    }
  }

  const pricing = calculateCouponPricing(
    items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
    productBySlug,
  );
  const settings = Object.fromEntries(
    (settingRows ?? []).map((row) => [row.key, row.value]),
  );
  let couponDiscount = 0;
  if (couponId) {
    if (settings.enable_coupons === "false") {
      return NextResponse.json(
        { error: "Les codes promotionnels sont désactivés.", code: "COUPON_DISABLED" },
        { status: 409 },
      );
    }
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .eq("active", true)
      .single();
    const value = Number(coupon?.value);
    const valid =
      coupon &&
      ["percent", "fixed"].includes(coupon.type) &&
      Number.isFinite(value) &&
      value > 0 &&
      (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
      (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
      (coupon.min_order === null ||
        pricing.eligibleSubtotal >= Number(coupon.min_order));
    if (!valid) {
      return NextResponse.json(
        { error: "Le code promotionnel n’est plus valide.", code: "COUPON_INVALID" },
        { status: 409 },
      );
    }
    couponDiscount = calculateCouponDiscount(
      coupon.type,
      value,
      pricing.eligibleSubtotal,
    );
  }

  let loyaltyDiscount = 0;
  const customer = await getCustomerUser(request);
  if (
    settings.enable_ecoclub !== "false" &&
    customer?.email?.toLowerCase() === email
  ) {
    const { data: points } = await supabase
      .from("user_points")
      .select("points")
      .eq("email", email)
      .maybeSingle();
    const percent = loyaltyTierForPoints(Number(points?.points ?? 0)).discountPercent;
    loyaltyDiscount = Math.round(
      ((pricing.subtotal - couponDiscount) * percent) / 100,
    );
  }
  const discount = couponDiscount + loyaltyDiscount;
  const shipping = resolveShippingQuote(
    city,
    pricing.subtotal,
    (zones ?? []) as ShippingZoneRule[],
    shippingConfigFromSettings(settings),
  );
  const method = paymentProvider
    ? paymentMethodsFromSettings(settings).find(
        (candidate) => candidate.provider === paymentProvider,
      )
    : undefined;
  const availability = method
    ? paymentMethodAvailability(method, city, pricing.subtotal)
    : { available: false, reason: "" };
  const paymentFee = method && availability.available ? method.fee : 0;
  const total = calculateCheckoutTotal({
    subtotal: pricing.subtotal,
    shipping: shipping.cost,
    paymentFee,
    discount,
  });

  return NextResponse.json(
    {
      currency: "MAD",
      subtotal: pricing.subtotal,
      couponDiscount,
      loyaltyDiscount,
      discount,
      shipping: shipping.cost,
      paymentFee,
      taxes: 0,
      taxesIncluded: true,
      total,
      estimatedDays: shipping.estimatedDays,
      zoneName: shipping.zoneName,
      priceChanged,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
