import { usePreferences } from "@/stores/preferences";
import { legacyKeys } from "@/i18n/legacy-keys";
import { msg } from "@/i18n";
import { translate } from "@/i18n/translate";
import type { Language } from "@/lib/language-policy";

type Copy = { [K in keyof typeof legacyKeys]: string };
function makeCopy(language: Language): Copy {
  return Object.fromEntries(Object.entries(legacyKeys).map(([key, value]) => [key, translate(language, value)])) as Copy;
}
const copy = { fr: makeCopy("fr"), en: makeCopy("en") };
export function useT() {
  const language = usePreferences((state) => state.language);
  return { t: copy[language], language, rtl: false, translate: msg };
}
