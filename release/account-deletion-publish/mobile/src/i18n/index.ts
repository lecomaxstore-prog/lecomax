import { usePreferences } from "@/stores/preferences";
import { localeFor, translate, type TranslationKey, type TranslationParams } from "./translate";

export type { TranslationKey, TranslationParams } from "./translate";

/** Subscribe in each component (including memoized cards), without remounting navigation or forms. */
export function useLocale() {
  return usePreferences((state) => state.language);
}

/** Read at call time so alerts and asynchronous callbacks use the current language. */
export function msg(key: TranslationKey, params?: TranslationParams) {
  return translate(usePreferences.getState().language, key, params);
}

export function currentLocale() {
  return localeFor(usePreferences.getState().language);
}
