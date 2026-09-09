import { readFileSync, writeFileSync } from 'node:fs';
const path = 'app/api/orders/route.ts';
let text = readFileSync(path,'utf8');
const replaceBetween = (start,end,value) => {
  const a=text.indexOf(start), b=text.indexOf(end,a);
  if(a<0||b<0) throw new Error('Missing edit anchor '+start);
  text=text.slice(0,a)+value+text.slice(b);
};
text='import { calculateCart, CommerceError, COMMERCE_SETTING_KEYS } from "@/lib/commerce-server";\n'+text;
replaceBetween('  // Re-read products server-side.', '  for (const item of items) {\n    const product', `  // Quote and order use the same fresh server calculation.
  let commerce: Awaited<ReturnType<typeof calculateCart>>;
  try {
    commerce = await calculateCart(req, { city: customer.city, email: customer.email,
      couponId: coupon_id, paymentProvider: payment_provider,
      items: items.map(item => ({ slug: item.slug, quantity: item.qty, color: item.color, size: item.size, price: item.price })) });
  } catch (error) {
    const known = error instanceof CommerceError;
    return NextResponse.json({ error: known ? error.message : "Calcul indisponible.", code: known ? error.code : "QUOTE_UNAVAILABLE", details: known ? error.details : undefined }, { status: known ? error.status : 503 });
  }
  const productBySlug = commerce.products;

`);
replaceBetween('  const calculatedSubtotal =', '  let paymentReference:', `  const { quote: calculation } = commerce;
  const featureSettings = commerce.config.settings;
  const calculatedSubtotal = calculation.subtotal;
  const safeDiscount = calculation.discount;
  const safeShipping = calculation.shipping;
  const shippingRate = safeShipping;
  const safePaymentFee = calculation.paymentFee;
  const expectedTotal = calculation.total;
  const provider = payment_provider === "paypal" ? "paypal" : payment_provider === "cod" ? "cod" : null;
  if (!provider) return NextResponse.json({ error: "Mode de paiement invalide.", code: "INVALID_PAYMENT_METHOD" }, { status: 400 });
  const submitted = [shipping ?? 0, discount ?? 0, payment_fee ?? 0, total];
  const expected = [safeShipping, safeDiscount, safePaymentFee, expectedTotal];
  if (calculation.priceChanged || submitted.some((value, index) => !Number.isFinite(value) || Math.abs(Number(value) - expected[index]) > 0.001)) {
    return NextResponse.json({ error: "Le total de votre commande a été mis à jour. Vérifiez le nouveau montant avant de confirmer.", code: "CART_CHANGED", calculation }, { status: 409 });
  }

`);
text=text.replace('    total: expectedTotal,','    total: expectedTotal,\n    pricing_snapshot: { ...calculation, store: { name: featureSettings.store_name, email: featureSettings.store_email, phone: featureSettings.store_phone, address: featureSettings.store_address } },');
text=text.replace('supabase.rpc("create_order_with_inventory", { p_order: orderInsert })',`supabase.rpc("create_commerce_order", { p_order: orderInsert,
    p_settings: commerce.config.rawSettings, p_setting_keys: COMMERCE_SETTING_KEYS,
    p_zones: commerce.config.zones, p_coupon: commerce.coupon })`);
text=text.replace('/STOCK|UNAVAILABLE|VARIANT|FULFILLMENT_CHANGED|PRICE_CHANGED/', '/STOCK|UNAVAILABLE|VARIANT|FULFILLMENT_CHANGED|PRICE_CHANGED|CONFIGURATION_CHANGED|COUPON/');
replaceBetween('  // Consume the coupon only after the order exists.', '  // EcoClub points are reserved now', '  // Coupon redemption is part of create_commerce_order and rolls back with inventory.\n\n');
for(const line of [
'import { calculateCouponDiscount, calculateCouponPricing } from "@/lib/coupon-pricing";\n',
'import { couponStateAfterUse } from "@/lib/coupon-redemption";\n',
'import { calculateCheckoutTotal } from "@/lib/checkout-total";\n',
'import { shippingConfigFromSettings } from "@/lib/shipping-config";\n',
'import { resolveShippingQuote, type ShippingZoneRule } from "@/lib/shipping-zones";\n',
'import { loyaltyTierForPoints } from "@/lib/loyalty";\n',
]) text=text.replace(line,'');
text=text.replace(/import \{\s*PAYMENT_SETTING_KEYS,\s*paymentMethodAvailability,\s*paymentMethodsFromSettings,\s*\} from "@\/lib\/payment-methods";\n/,'');
writeFileSync(path,text);
