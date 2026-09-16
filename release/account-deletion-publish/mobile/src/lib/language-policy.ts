export type Language = "fr" | "en";

export function deviceLanguage(locales: readonly { languageCode?: string | null; languageTag?: string }[]): Language {
  const locale = locales[0];
  const code = (locale?.languageCode || locale?.languageTag || "").toLowerCase().split(/[-_]/)[0];
  return code === "en" ? "en" : "fr";
}

export function resolveLanguage(saved: unknown, device: Language): Language {
  return saved === "fr" || saved === "en" ? saved : device;
}
