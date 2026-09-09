const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../src');
const changesFile = path.resolve(__dirname, '../out/localization/second-audit-changed.json');
const changed = new Set(JSON.parse(fs.readFileSync(changesFile, 'utf8')));
function edit(file, fn) { const target = path.join(root, file), before = fs.readFileSync(target, 'utf8'), after = fn(before); if (before !== after) { fs.writeFileSync(target, after); changed.add(file); } }
edit('lib/format.ts', t => t + '\nexport const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>\n  new Intl.NumberFormat(currentLocale(), options).format(value);\n');
edit('app/(tabs)/search.tsx', t => t.replace('import { imageUrl }', 'import { imageUrl, money }'));
for (const file of ['components/app-update-gate.tsx', 'screens/support-chat-screen.tsx']) edit(file, t => 'import { formatNumber } from "@/lib/format";\n' + t);
edit('screens/support-chat-screen.tsx', t => t.replace(/return 'Aujourd[^']*';/, 'return msg("supportChatScreen.today");'));
for (const file of ['components/launch-intro.tsx', 'components/onboarding-gate.tsx']) edit(file, t => t.replace('useEffect, useMemo,', 'useEffect,').replace('const language = useLocale();', 'useLocale();').replace(/useMemo\(\s*\(\) => appLaunchConfigFromSettings\(settingsQuery.data\),\s*\[settingsQuery.data, language\],\s*\)/, 'appLaunchConfigFromSettings(settingsQuery.data)'));
edit('app/order-tracking.tsx', t => t.replace('useMemo, useState', 'useState').replace('const language = useLocale();', 'useLocale();').replace(/const createdAt = useMemo\(\s*\(\) =>\s*order\s*\? ([^\n]+)\s*: "",\s*\[order, language\],\s*\);/, 'const createdAt = order ? $1 : "";'));
edit('components/checkout-progress.tsx', t => t.replace('const steps = [msg("common.cart"), msg("support.delivery"), msg("checkoutProgress.payment")] as const;', 'const steps = ["common.cart", "support.delivery", "checkoutProgress.payment"] as const;').replaceAll('steps[step - 1]', 'msg(steps[step - 1])'));
for (const file of ['app/profile.tsx', 'components/campaign-hero.tsx', 'components/product-card.tsx']) edit(file, t => t.replace('import { useT } from "@/lib/i18n";\n', '').replace('  const { translate: tr } = useT();\n', ''));
edit('app/(tabs)/account.tsx', t => t.replace('translate: tr, ', '').replace(', translate: tr', ''));
edit('app/(tabs)/wishlist.tsx', t => t.replace('palette, typography, ui', 'palette, typography'));
for (const file of ['app/support-chat.tsx', 'lib/i18n.ts']) edit(file, t => t.replace(/^\uFEFF/, ''));
// Localize SDK and cached request errors at the UI boundary, preserving business
// details for messages present in either catalog and falling back for unknown prose.
for (const file of fs.readdirSync(root, { recursive: true }).filter(f => f.endsWith('.tsx'))) edit(file, text => {
  const updated = text.replace(/\b((?:\w+\.)*(?:error|reason))\.message\b/g, 'localizedError($1)');
  return updated !== text ? 'import { localizedError } from "@/i18n/errors";\n' + updated : text;
});
edit('app/auth.tsx', t => t.replace(/localizedError\(result.error\) === "Invalid login credentials"\s*\? msg\("auth.incorrectEmailAddressOrPassword"\)\s*: localizedError\(result.error\)/, 'localizedError(result.error)').replace('error?.message ||\n        msg("auth.resetEmailSent", { email })', 'error ? localizedError(error) : msg("auth.resetEmailSent", { email })'));
edit('lib/api-client.ts', t => 'import { localizedError } from "@/i18n/errors";\n' + t.replace('if (typeof payload?.error === "string" && payload.error.trim()) return payload.error.trim();', 'if (typeof payload?.error === "string" && payload.error.trim()) {\n    const translated = localizedError(payload.error);\n    if (translated !== msg("errors.tryAgain")) return translated;\n  }').replace('if (status === 401)', 'if (status === 429) return msg("errors.rateLimit");\n  if (status === 401)'));
for (const language of ['fr', 'en']) edit(`i18n/locales/${language}.json`, t => {
  const catalog = JSON.parse(t);
  catalog['supportChatScreen.today'] = language === 'fr' ? 'Aujourd’hui' : 'Today';
  catalog['notifications.theEasProjectIsNotConfiguredForNotifications'] = language === 'fr' ? 'Les notifications ne sont pas disponibles pour le moment.' : 'Notifications are currently unavailable.';
  return JSON.stringify(catalog, null, 2) + '\n';
});
fs.writeFileSync(changesFile, JSON.stringify([...changed, 'i18n/errors.ts'], null, 2));
