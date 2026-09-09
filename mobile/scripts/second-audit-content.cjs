const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../src');
const changedFile = path.resolve(__dirname, '../out/localization/second-audit-changed.json');
const changed = new Set(JSON.parse(fs.readFileSync(changedFile, 'utf8')));
function edit(file, fn) { const target = path.join(root, file), before = fs.readFileSync(target, 'utf8'), after = fn(before); if (before !== after) { fs.writeFileSync(target, after); changed.add(file); } }
const pairs = {
  'common.emailExample': ['nom@exemple.com', 'name@example.com'], 'common.orUppercase': ['OU', 'OR'],
  'common.subtotal': ['Sous-total', 'Subtotal'], 'homeSignupOffer.signUp': ['Inscris-toi,', 'Sign up,'],
  'counts.items': ['{{count}} articles', '{{count}} items'], 'counts.items_one': ['{{count}} article', '{{count}} item'], 'counts.items_other': ['{{count}} articles', '{{count}} items'],
  'counts.productCount': ['{{count}} produits', '{{count}} products'], 'counts.productCount_one': ['{{count}} produit', '{{count}} product'], 'counts.productCount_other': ['{{count}} produits', '{{count}} products'],
  'wishlist.removedCount': ['{{count}} articles supprimés du catalogue', '{{count}} items removed from the catalog'], 'wishlist.removedCount_one': ['{{count}} article supprimé du catalogue', '{{count}} item removed from the catalog'], 'wishlist.removedCount_other': ['{{count}} articles supprimés du catalogue', '{{count}} items removed from the catalog'],
  'delivery.days': ['{{range}} jours', '{{range}} days'], 'delivery.days_one': ['{{range}} jour', '{{range}} day'], 'delivery.days_other': ['{{range}} jours', '{{range}} days'],
  'delivery.businessDays': ['{{range}} jours ouvrables', '{{range}} business days'], 'delivery.businessDays_one': ['{{range}} jour ouvrable', '{{range}} business day'], 'delivery.businessDays_other': ['{{range}} jours ouvrables', '{{range}} business days'],
  'payment.codDescription': ['Payez à la réception de votre commande', 'Pay when your order arrives'], 'payment.paypalDescription': ['Paiement en ligne rapide et sécurisé', 'Fast, secure online payment'],
  'coupon.expired': ['Ce code promo a expiré', 'This promotion code has expired'], 'coupon.invalid': ['Code invalide ou inactif', 'This promotion code is invalid or inactive'],
  'coupon.disabled': ['Les codes promo sont temporairement désactivés', 'Promotion codes are temporarily unavailable'], 'coupon.usedUp': ["Ce code promo a atteint son nombre d'utilisations maximum", 'This promotion code has reached its usage limit'],
  'coupon.saleExcluded': ["Ce code ne s'applique pas aux articles déjà en promotion", 'This code cannot be used on sale items'], 'coupon.minimum': ['Minimum de {{amount}} MAD requis sur les articles hors promotion', 'Spend at least MAD {{amount}} on non-sale items to use this code'],
};
for (const [key, values] of Object.entries({ men: ['Homme', 'Men'], women: ['Femme', 'Women'], shoes: ['Chaussures', 'Shoes'], accessories: ['Accessoires', 'Accessories'], electronics: ['Électronique', 'Electronics'], clothing: ['Vêtements', 'Clothing'], perfumes: ['Parfums', 'Perfumes'], white: ['Blanc', 'White'], pink: ['Rose', 'Pink'], black: ['Noir', 'Black'], grey: ['Gris', 'Grey'], yellow: ['Jaune', 'Yellow'], blue: ['Bleu', 'Blue'], green: ['Vert', 'Green'], red: ['Rouge', 'Red'], brown: ['Marron', 'Brown'], purple: ['Violet', 'Purple'], standard: ['Édition Standard', 'Standard Edition'] })) pairs[`catalogContent.${key}`] = values;
for (const [i, language] of ['fr', 'en'].entries()) edit(`i18n/locales/${language}.json`, t => {
  const c = JSON.parse(t); for (const [key, values] of Object.entries(pairs)) c[key] = values[i];
  c['checkoutScreen.qty'] = i ? '· Qty ' : '· Qté ';
  c['checkoutScreen.qtyUppercase'] = i ? 'QTY ' : 'QTÉ ';
  c['homeSignupOffer.enjoy'] = i ? 'get ' : 'profite de ';
  if (i) { c['productCard.productSoldOut'] = 'Product out of stock'; c['topic.productCurrentlySoldOut'] = 'Product currently out of stock'; c['product.soldOut'] = ', out of stock'; c['product.thisVariantIsCurrentlySoldOut'] = 'This variant is currently out of stock.'; }
  return JSON.stringify(c, null, 2) + '\n';
});
for (const file of fs.readdirSync(root, { recursive: true }).filter(f => f.endsWith('.tsx'))) edit(file, t => t
  .replaceAll('placeholder="nom@exemple.com"', 'placeholder={msg("common.emailExample")}').replaceAll('placeholder="vous@exemple.com"', 'placeholder={msg("common.emailExample")}')
  .replace('placeholder: "nom@exemple.com",', 'get placeholder() { return msg("common.emailExample"); },')
  .replace('>OU</Text>', '>{msg("common.orUppercase")}</Text>')
  .replace('Inscris-toi,{"\\n"}', '{msg("homeSignupOffer.signUp")}{"\\n"}')
  .replaceAll('label="Sous-total"', 'label={msg("common.subtotal")}')
  .replace(/\{itemCount\} article\{itemCount (?:> 1 \? "s" : ""|=== 1 \? "" : "s")\}/g, '{msg("counts.items", { count: itemCount })}')
  .replace(/\{order.items.length\} article\s*\{order.items.length > 1 \? "s" : ""\}/, '{msg("counts.items", { count: order.items.length })}')
  .replace('{count} produit{count > 1 ? "s" : ""}', '{msg("counts.productCount", { count })}')
  .replace(/\{split.removed.length\} article\s*\{split.removed.length > 1 \? "s" : ""\} \{msg\("wishlist.removed"\)\}\{split.removed.length > 1 \? "s" : ""\} \{msg\("wishlist.fromTheCatalog"\)\}/, '{msg("wishlist.removedCount", { count: split.removed.length })}'));
// Translate display values only, retaining originals for filtering and API payloads.
for (const file of ['components/category-card.tsx', 'components/category-shortcuts.tsx', 'app/(tabs)/catalog.tsx', 'app/(tabs)/search.tsx', 'app/(tabs)/cart.tsx', 'app/(tabs)/wishlist.tsx', 'app/product/[slug].tsx', 'app/info/[topic].tsx', 'screens/checkout-screen.tsx', 'app/order-confirmation.tsx', 'app/orders.tsx']) edit(file, t => {
  let next = t.replaceAll('name: category.label', 'name: localizedContent(category.label)').replaceAll('{category.label}', '{localizedContent(category.label)}');
  if (/catalog|search/.test(file)) next = next.replaceAll('{item.label}', '{localizedContent(item.label)}').replaceAll('name: item.label', 'name: localizedContent(item.label)').replaceAll('{item.label.toUpperCase()}', '{localizedContent(item.label).toUpperCase()}');
  next = next.replaceAll('[line.color, line.size]', '[localizedContent(line.color), line.size]').replaceAll('{selectedColor}</Text>', '{localizedContent(selectedColor)}</Text>').replaceAll('{color}</Text>', '{localizedContent(color)}</Text>').replaceAll('{option}</Text>', '{localizedContent(option)}</Text>');
  next = next.replaceAll('${item.color}', '${localizedContent(item.color)}').replaceAll('${label} ${option}', '${label} ${localizedContent(option)}');
  next = next.replaceAll('estimate: settingsMap.shipping_estimated_days?.trim() || msg("orderConfirmation.25BusinessDays")', 'estimate: localizedContent(settingsMap.shipping_estimated_days?.trim()) || msg("orderConfirmation.25BusinessDays")').replaceAll('value={params.estimatedDays ||', 'value={localizedContent(params.estimatedDays) ||').replaceAll('estimate={shippingQuote?.estimatedDays || estimate}', 'estimate={localizedContent(shippingQuote?.estimatedDays || estimate)}');
  if (file === 'screens/checkout-screen.tsx') next = next.replaceAll('${method.title}', '${localizedContent(method.title)}').replaceAll('{method.title}', '{localizedContent(method.title)}').replaceAll('${method.description}', '${localizedContent(method.description)}').replaceAll('method.unavailableReason ||', 'localizedContent(method.unavailableReason) ||');
  return next === t ? t : 'import { localizedContent } from "@/i18n/content";\n' + next;
});
edit('app/order-tracking.tsx', t => 'import { orderStatusLabel } from "@/i18n/content";\n' + t.replace('{order.status_label}', '{orderStatusLabel(order.status)}'));
edit('app/orders.tsx', t => t.replace('import { localizedContent }', 'import { localizedContent, paymentStatusLabel }').replace('order.payment_method || "—"', 'order.payment_method === "cod" ? msg("orders.cod") : order.payment_method === "paypal" ? "PayPal" : "—"').replace('order.payment_status || msg("orders.pendingText")', 'paymentStatusLabel(order.payment_status)').replace('label: status || msg("orders.inProgress")', 'label: msg("orders.inProgress")'));
fs.writeFileSync(changedFile, JSON.stringify([...changed, 'i18n/content.ts'], null, 2));
