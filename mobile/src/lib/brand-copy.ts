/** Shared marketplace identity for website and app. Campaign-specific copy stays editable. */
export const BRAND_COPY = {
  fr: {
    tagline: "Sublimez votre quotidien.",
    eyebrow: "Marketplace lifestyle · Maroc",
    description: "Des trouvailles et des essentiels pour tous les univers de votre quotidien.",
  },
  en: {
    tagline: "Elevate your everyday.",
    eyebrow: "Lifestyle marketplace · Morocco",
    description: "Discover finds and essentials for every part of your everyday life.",
  },
} as const;

const legacyTaglines = new Set([
  "sport.tech.style", "move more.live better",
  "bougez plus.vivez mieux", "votre vie.vos envies",
]);

/** Upgrade previous generic slogans without replacing custom campaign headlines. */
export function marketplaceHeadline(value: string | null | undefined, language: keyof typeof BRAND_COPY) {
  const normalized = value?.trim().replace(/\s+/g, " ")
    .replace(/\s*\.\s*/g, ".").replace(/\.$/, "").toLowerCase();
  return !normalized || legacyTaglines.has(normalized) ? BRAND_COPY[language].tagline : value!;
}
