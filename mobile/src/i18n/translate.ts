import fr from "./locales/fr.json";
import en from "./locales/en.json";
import type { Language } from "../lib/language-policy";

export type TranslationKey = keyof typeof fr;
export type TranslationParams = Readonly<Record<string, string | number>>;
const catalogs: Record<Language, Record<TranslationKey, string>> = { fr, en };

export function pluralCategory(language: Language, count: number): Intl.LDMLPluralRule {
  if (typeof Intl.PluralRules === "function") return new Intl.PluralRules(language).select(count);
  // Android Hermes does not provide PluralRules on every supported runtime.
  // These are the cardinal rules for the two languages shipped by this app.
  const value = Math.abs(count);
  if (language === "en") return value === 1 ? "one" : "other";
  if (value < 2) return "one";
  if (Number.isInteger(value) && value % 1_000_000 === 0) return "many";
  return "other";
}

export function translate(language: Language, key: TranslationKey, params: TranslationParams = {}): string {
  const pluralKey = typeof params.count === "number"
    ? `${key}_${pluralCategory(language, params.count)}`
    : key;
  const dictionary: Readonly<Record<string, string>> = catalogs[language];
  const fallback: Readonly<Record<string, string>> = fr;
  const template = dictionary[pluralKey] ?? dictionary[key] ?? fallback[pluralKey] ?? fallback[key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    params[name] === undefined ? placeholder : String(params[name]));
}

export const localeFor = (language: Language) => language === "en" ? "en-GB" : "fr-MA";
