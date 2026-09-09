import { readFileSync, writeFileSync } from 'node:fs';
let path='app/checkout/page.tsx', text=readFileSync(path,'utf8');
text=text.replace('import { useSettings }','import { useCartCalculation } from "@/lib/use-cart-calculation";\nimport { useSettings }');
text=text.replace('  const { items, total, clear } = useCart();','  const { items, total: localSubtotal, clear } = useCart();');
const anchor='  const shippingConfig = shippingConfigFromSettings(siteSettings);';
text=text.replace(anchor,`  const serverPricing = useCartCalculation({
    items: items.map(item => ({ slug: item.slug, quantity: item.quantity, price: item.price, color: item.color, size: item.size })),
    city: form.ville, email: form.email, couponId: couponApplied?.id, paymentProvider: payment === "paypal" ? "paypal" : "cod",
  }, siteSettings);
  const calculation = serverPricing.quote;
  const total = calculation?.subtotal ?? localSubtotal;
${anchor}`);
text=text.replace('const shipping = shippingQuote?.cost ?? calculateShipping(total, shippingConfig);','const shipping = calculation?.shipping ?? 0;');
text=text.replace('const shippingReady = !form.ville.trim() || (!shippingQuoteLoading && shippingQuote !== null);','const shippingReady = Boolean(calculation) && !serverPricing.loading;');
text=text.replace('const couponDiscount = couponApplied?.discount ?? 0;','const couponDiscount = calculation?.couponDiscount ?? 0;');
text=text.replace(/const loyaltyDiscountAmount = .*?;/,'const loyaltyDiscountAmount = calculation?.loyaltyDiscount ?? 0;');
text=text.replace('const discount = couponDiscount + loyaltyDiscountAmount;','const discount = calculation?.discount ?? 0;');
text=text.replace(/const paymentFee =\s*payment === "paypal" \? paypalMethod\?\.fee \?\? 0 : codMethod\?\.fee \?\? 0;/,'const paymentFee = calculation?.paymentFee ?? 0;');
text=text.replace('const grandTotal = Math.max(0, total + shipping + paymentFee - discount);','const grandTotal = calculation?.total ?? 0;');
// Replace the old shipping-only request with the central result.
const a=text.indexOf('  useEffect(() => {\n    const city = form.ville.trim();',text.indexOf(anchor));
const b=text.indexOf('  // Keep paypalDataRef',a);
if(a<0||b<0) throw new Error('Checkout effect anchors missing');
text=text.slice(0,a)+`  useEffect(() => {
    setShippingQuoteLoading(serverPricing.loading);
    setShippingQuote(calculation ? { cost: calculation.shipping, freeThreshold: calculation.freeThreshold,
      estimatedDays: calculation.estimatedDays, zoneName: calculation.zoneName, zoneId: null } : null);
    if (serverPricing.error) setOrderError(serverPricing.error);
  }, [calculation, serverPricing.loading, serverPricing.error]);

`+text.slice(b);
// Existing reconciliation branches refetch the full calculation.
text=text.replaceAll('setShippingQuoteRevision((value) => value + 1)', 'serverPricing.refresh()');
writeFileSync(path,text);

path='mobile/src/services/orders.ts'; text=readFileSync(path,'utf8');
const start=text.indexOf('export type CheckoutQuote = {'), end=text.indexOf('export type CustomerOrder',start);
text=text.slice(0,start)+'export type CheckoutQuote = import("../../../lib/commerce-contract").CartCalculation;\n'+text.slice(end);
text=text.replace('    paymentProvider: "cod" | "paypal";','    paymentProvider?: "cod" | "paypal";');
// The checkout caller must have shown a server quote; no local financial fallback.
const c=text.indexOf('  const localSubtotal ='), d=text.indexOf('  const order =',c);
text=text.slice(0,c)+`  if (!confirmedPricing) throw new Error("Veuillez vérifier le montant de la commande avant de confirmer.");
  const shipping = confirmedPricing.shipping;
  const discount = confirmedPricing.discount;
  const safePaymentFee = confirmedPricing.paymentFee;
`+text.slice(d);
text=text.replace(/total:\s*confirmedPricing\?\.total \?\?\s*Math.max\(0, subtotal \+ shipping \+ safePaymentFee - discount\),/,'total: confirmedPricing.total,');
writeFileSync(path,text);

path='mobile/src/app/(tabs)/cart.tsx'; text=readFileSync(path,'utf8');
text=text.replace('getShippingQuote, type ShippingQuote','getCheckoutQuote, type ShippingQuote, type CheckoutQuote');
text=text.replace('  const [shippingQuote, setShippingQuote]', '  const [calculation, setCalculation] = useState<CheckoutQuote>();\n  const [shippingQuote, setShippingQuote]');
const e=text.indexOf('  const configuredShipping ='), f=text.indexOf('\n  useEffect(() => {',e);
text=text.slice(0,e)+`  const shipping = calculation?.shipping ?? 0;
  const discount = calculation?.discount ?? 0;
  const total = calculation?.total ?? 0;
`+text.slice(f);
text=text.replace('if (!activeAddress?.city || !cart.length) return;', 'if (!cart.length) { setCalculation(undefined); return; }');
text=text.replace('      setShippingLoading(true);', '      setShippingLoading(true);\n      setCalculation(undefined);');
text=text.replace('const quote = await getShippingQuote(activeAddress.city, subtotal);\n        if (active) setShippingQuote(quote);', `const quote = await getCheckoutQuote(cart, { city: activeAddress?.city ?? "", email: "", couponId: appliedCoupon?.id });
        if (active) { setCalculation(quote); setShippingQuote({ cost: quote.shipping, estimatedDays: quote.estimatedDays, zoneName: quote.zoneName }); }`);
text=text.replace('[activeAddress?.city, cart.length, subtotal]', '[activeAddress?.city, cart, appliedCoupon?.id, settingsQuery.dataUpdatedAt]');
text=text.replace('value={money(total)}','value={calculation ? money(total) : "—"}');
text=text.replace('value={shipping === 0 ? msg("checkoutScreen.freeUppercase") : money(shipping)}','value={!calculation ? "—" : shipping === 0 ? msg("checkoutScreen.freeUppercase") : money(shipping)}');
writeFileSync(path,text);
