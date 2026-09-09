const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../src');
const changed = new Set();
function edit(file, fn) {
  const target = path.join(root, file), before = fs.readFileSync(target, 'utf8'), after = fn(before);
  if (after !== before) { fs.writeFileSync(target, after); changed.add(file); }
}
const additions = {
  'support.return': ['Retour', 'Return'],
  'support.orderSubject': ['Commande {{number}}', 'Order {{number}}'],
  'support.topicRequest': ['Demande : {{topic}}', 'Request: {{topic}}'],
  'search.closeFilters': ['Fermer les filtres', 'Close filters'],
  'common.andSeparator': [' et ', ' and '],
  'common.loadingUppercase': ['CHARGEMENT…', 'LOADING…'],
  'deleteAccount.confirmationPhrase': ['supprimer mon compte', 'remove my account'],
  'deleteAccount.confirmationHint': ['Saisissez « {{phrase}} » pour confirmer', 'Enter “{{phrase}}” to confirm'],
  'deleteAccount.requestSaved': ['Votre demande de suppression a été enregistrée. Votre compte reste actif jusqu’à son traitement.', 'Your deletion request has been received. Your account will remain active until your request is processed.'],
  'errors.tryAgain': ['Impossible de terminer cette action. Veuillez réessayer.', 'We couldn’t complete this action. Please try again.'],
  'errors.rateLimit': ['Trop de tentatives. Patientez un moment avant de réessayer.', 'Too many attempts. Please wait a moment and try again.'],
  'auth.emailNotConfirmed': ['Confirmez votre adresse e-mail avant de vous connecter.', 'Confirm your email address before signing in.'],
  'auth.emailAlreadyRegistered': ['Un compte utilise déjà cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.', 'An account already uses this email address. Sign in or reset your password.'],
  'orders.paid': ['Payé', 'Paid'],
  'orders.failed': ['Échec du paiement', 'Payment failed'],
  'orders.refunded': ['Remboursé', 'Refunded'],
  'orders.cod': ['Paiement à la livraison', 'Cash on delivery'],
};
for (const [index, language] of ['fr', 'en'].entries()) edit(`i18n/locales/${language}.json`, text => {
  const catalog = JSON.parse(text);
  for (const [key, values] of Object.entries(additions)) catalog[key] = values[index];
  if (language === 'en') {
    catalog['common.accountEyebrow'] = 'MY ACCOUNT';
    for (const key of Object.keys(catalog)) catalog[key] = catalog[key].replace(/Shipping address/g, 'Delivery address').replace(/shipping address/g, 'delivery address').replace(/Sold out/g, 'Out of stock').replace(/SOLD OUT/g, 'OUT OF STOCK');
  }
  return JSON.stringify(catalog, null, 2) + '\n';
});
for (const file of ['app/notifications.tsx', 'app/orders.tsx', 'app/order-tracking.tsx', 'app/support.tsx', 'screens/support-chat-screen.tsx', 'components/product-reviews.tsx']) edit(file, text => text.replace('import { msg, useLocale }', 'import { currentLocale, msg, useLocale }').replaceAll('"fr-FR"', 'currentLocale()').replaceAll("'fr-FR'", 'currentLocale()'));
edit('app/order-tracking.tsx', text => text.replace('  useLocale();', '  const language = useLocale();').replace('[order],', '[order, language],'));
edit('lib/format.ts', text => 'import { currentLocale } from "@/i18n";\n' + text.replace('new Intl.NumberFormat("fr-MA",', 'new Intl.NumberFormat(currentLocale(),'));
edit('components/price.tsx', text => 'import { useLocale } from "@/i18n";\n' + text.replace('  const previousPrice', '  useLocale();\n  const previousPrice'));
edit('components/category-card.tsx', text => text.replace('}) {\n  return', '}) {\n  useLocale();\n  return'));
edit('components/app-gate.tsx', text => text.replace('"CHARGEMENT…"', 'msg("common.loadingUppercase")'));
edit('app/support.tsx', text => text.replace('`Commande ${orderNumber}`', 'msg("support.orderSubject", { number: orderNumber })').replace('["Commande", "Livraison", "Retour", "Autre"]', '[msg("support.order"), msg("support.delivery"), msg("support.return"), msg("support.other")]').replace('`Demande : ${topic}`', 'msg("support.topicRequest", { topic })'));
edit('app/(tabs)/cart.tsx', text => text.replace('messages.join(" et ")', 'messages.join(msg("common.andSeparator"))'));
edit('app/(tabs)/search.tsx', text => text.replace('`${cartTotal.toFixed(2).replace(".", ",")} Dhs`', 'money(cartTotal)').replace('`${filtersOpen ? msg("scanner.close") : msg("search.open")} les filtres`', 'filtersOpen ? msg("search.closeFilters") : msg("homeSearchBar.openProductFilters")'));
// Zod must resolve messages when validation runs, after saved preferences hydrate.
for (const file of ['app/auth.tsx', 'screens/checkout-screen.tsx']) edit(file, text => text.replace(/(\.min\(\d+, |\.email\(|z\.email\()(msg\("[^"]+"\))\)/g, '$1{ error: () => $2 })'));
for (const file of ['components/launch-intro.tsx', 'components/onboarding-gate.tsx']) edit(file, text => text.replace('  useLocale();', '  const language = useLocale();').replace('[settingsQuery.data],', '[settingsQuery.data, language],'));
edit('app/delete-account.tsx', text => text.replace('import { useT } from "@/lib/i18n";\n', '').replace('  const { translate: tr } = useT();', '  const confirmationPhrase = msg("deleteAccount.confirmationPhrase");').replace('confirmation === CONFIRMATION', 'confirmation === confirmationPhrase').replace('const result = await apiRequest', 'await apiRequest').replace('JSON.stringify({ confirmation })', 'JSON.stringify({ confirmation: CONFIRMATION })').replace('setMessage(result.message)', 'setMessage(msg("deleteAccount.requestSaved"))').replace('{CONFIRMATION}</Text>', '{confirmationPhrase}</Text>').replace('msg("deleteAccount.enterRemoveMyAccountToConfirm")', 'msg("deleteAccount.confirmationHint", { phrase: confirmationPhrase })').replace('placeholder="remove my account"', 'placeholder={confirmationPhrase}'));
// Failed storage reads must release the existing splash using device language.
edit('stores/preferences.ts', text => text.replace('onRehydrateStorage: () => (state) => state?.setHydrated(true),', 'onRehydrateStorage: (initialState) => (state) => (state ?? initialState).setHydrated(true),'));
fs.mkdirSync(path.resolve(__dirname, '../out/localization'), { recursive: true });
fs.writeFileSync(path.resolve(__dirname, '../out/localization/second-audit-changed.json'), JSON.stringify([...changed], null, 2));
console.log([...changed].join('\n'));
