import {readFileSync,writeFileSync} from 'node:fs';
let path='app/checkout/page.tsx',text=readFileSync(path,'utf8');
text=text.replace('import { useCartCalculation }','import { useCartCalculation, commerceAuthHeaders }');
text=text.replace('"Idempotency-Key": orderKey()','...await commerceAuthHeaders(), "Idempotency-Key": orderKey()');
text=text.replace('"Idempotency-Key": orderKey({ items: its, form: f, payment: "paypal" })','...await commerceAuthHeaders(), "Idempotency-Key": orderKey({ items: its, form: f, payment: "paypal" })');
text=text.replace('paypalDataRef.current = { form, items, subtotal:', 'paypalDataRef.current = { form, items: items.map(item => ({ ...item, price: calculation?.items.find(line => line.slug === item.slug && line.color === item.color && line.size === item.size)?.price ?? item.price })), subtotal:');
const anchor=text.indexOf('items: items.map((i) => ({',text.indexOf('    setLoading(true);',text.indexOf('async function handle')));
// Only submitted line prices are replaced; product displays and event logging stay intact.
text=text.replace('            price: i.price,\n            qty:', '            price: calculation?.items.find(line => line.slug === i.slug && line.color === i.color && line.size === i.size)?.price ?? i.price,\n            qty:');
text=text.replace('      if (!res.ok) {\n        setOrderError', '      if (!res.ok) {\n        if (res.status === 409) serverPricing.refresh();\n        setOrderError');
writeFileSync(path,text);
path='mobile/src/services/orders.ts';text=readFileSync(path,'utf8');
text=text.replace('price: product.price, qty: quantity', 'price: confirmedPricing.items.find(item => item.slug === product.slug && item.color === color && item.size === size)?.price ?? product.price, qty: quantity');
text=text.replace('export type ShippingQuote = { cost: number;', 'export type ShippingQuote = { cost: number;');
writeFileSync(path,text);
for(const path of ['app/api/shipping/route.ts','app/api/shipping/[id]/route.ts']) {
  let text=readFileSync(path,'utf8');
  text='import { requireSettingsPermission } from "@/lib/admin-settings-access";\n'+text;
  text=text.replace('import { revalidatePath }','import { revalidatePath, revalidateTag }');
  text=text.replaceAll('  revalidatePath("/checkout");','  revalidatePath("/checkout");\n  revalidateTag("store-settings");');
  text=text.replace(/(export async function (?:POST|PUT|DELETE)[^\n]+\{\r?\n)/g,'$1  const denied = await requireSettingsPermission(req, "shipping.edit");\n  if (denied) return denied;\n');
  writeFileSync(path,text);
}
path='app/api/orders/route.ts';text=readFileSync(path,'utf8');
text=text.replace('return NextResponse.json({ order_number: data.order_number, id: data.id, items: data.items }','return NextResponse.json({ order_number: data.order_number, id: data.id, items: data.items, pricing_snapshot: data.pricing_snapshot, total: expectedTotal }');
text=text.replaceAll('replyTo: "contact@lecomax.com"','replyTo: featureSettings.store_email');
// Escape settings before interpolating into HTML, exactly as customer text must be escaped.
text=text.replace('  const safeNotes =', '  const storeEmailHtml = featureSettingsPlaceholder;\n  const safeNotes =');
text=text.replace('  const storeEmailHtml = featureSettingsPlaceholder;\n','');
text=text.replace('  const featureSettings = commerce.config.settings;', '  const featureSettings = commerce.config.settings;\n  const storeEmailHtml = featureSettings.store_email.replace(/[&<>"\']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\\"": "&quot;", "\'": "&#39;" }[c] ?? c));');
text=text.replaceAll('>contact@lecomax.com<br>','>${storeEmailHtml}<br>').replaceAll('>contact@lecomax.com ·','>${storeEmailHtml} ·');
text=text.replace('      ${invoiceDiscount > 0 ?', '      ${safePaymentFee > 0 ? `<tr><td>Frais de paiement</td><td style="text-align:right">${formatInvoiceMoney(safePaymentFee)}</td></tr>` : ""}\n      ${calculation.taxes > 0 ? `<tr><td>Taxes ${calculation.taxesIncluded ? "incluses" : ""}</td><td style="text-align:right">${formatInvoiceMoney(calculation.taxes)}</td></tr>` : ""}\n      ${invoiceDiscount > 0 ?');
writeFileSync(path,text);
