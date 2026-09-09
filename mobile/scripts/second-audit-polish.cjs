const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../src');
const changedFile = path.resolve(__dirname, '../out/localization/second-audit-changed.json');
const changed = new Set(JSON.parse(fs.readFileSync(changedFile, 'utf8')));
function edit(file, fn) { const target = path.join(root, file), before = fs.readFileSync(target, 'utf8'), after = fn(before); if (before !== after) { fs.writeFileSync(target, after); changed.add(file); } }
for (const [i, language] of ['fr', 'en'].entries()) edit(`i18n/locales/${language}.json`, t => { const c = JSON.parse(t); c['profile.checkInboxForReset'] = i ? 'Check your inbox for the password reset link.' : 'Consultez votre boîte e-mail pour retrouver le lien de réinitialisation.'; c['payment.minimum'] = i ? 'Available for orders of MAD {{amount}} or more' : 'Disponible dès {{amount}} MAD'; c['payment.maximum'] = i ? 'Available for orders up to MAD {{amount}}' : 'Disponible jusqu’à {{amount}} MAD'; return JSON.stringify(c, null, 2) + '\n'; });
edit('app/(tabs)/account.tsx', t => 'import { localizedContent } from "@/i18n/content";\n' + t.replaceAll('settings.app_club_cta_label?.trim()', 'localizedContent(settings.app_club_cta_label?.trim())').replaceAll('settings.app_club_description?.trim()', 'localizedContent(settings.app_club_description?.trim())'));
edit('app/info/[topic].tsx', t => t.replace('values.shipping_estimated_days?.trim()', 'localizedContent(values.shipping_estimated_days?.trim())').replace('{color}\n', '{localizedContent(color)}\n').replace('                  0 MAD', '                  {money(0)}'));
edit('app/info/[topic].tsx', t => 'import { money } from "@/lib/format";\n' + t);
edit('app/product/[slug].tsx', t => t.replace('${item}${selected', '${localizedContent(item)}${selected').replace('{item}\n', '{localizedContent(item)}\n').replace('{product.brand || product.category}', '{product.brand || localizedContent(product.category)}').replace('{product.category}', '{localizedContent(product.category)}'));
edit('app/(tabs)/wishlist.tsx', t => t.replace('{option}\n', '{localizedContent(option)}\n'));
for (const file of ['components/product-card.tsx', 'components/search-product-card.tsx', 'components/promotion-card.tsx', 'components/home-promotion-section.tsx', 'components/wishlist-product-card.tsx']) edit(file, t => {
  const next = t.replaceAll('(product.brand || product.category).toUpperCase()', '(product.brand || localizedContent(product.category)).toUpperCase()').replaceAll('product.category.toUpperCase()', 'localizedContent(product.category).toUpperCase()');
  return next === t ? t : 'import { localizedContent } from "@/i18n/content";\n' + next;
});
for (const file of ['components/rating.tsx', 'components/product-reviews.tsx', 'components/search-product-card.tsx']) edit(file, t => 'import { formatNumber } from "@/lib/format";\n' + t.replace(/\b(value|average|review.rating)\.toFixed\(1\)/g, 'formatNumber($1, { minimumFractionDigits: 1, maximumFractionDigits: 1 })').replace('(product.rating ?? 0).toFixed(1)', 'formatNumber(product.rating ?? 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })'));
edit('components/home-promotion-section.tsx', t => t.replace('{msg("homePromotionSection.youSave")}', '{msg("homePromotionSection.youSave")}{" "}'));
fs.writeFileSync(changedFile, JSON.stringify([...changed, 'lib/app-launch-config.ts'], null, 2));
