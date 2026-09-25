/** Versioned, public JPEG for social crawlers and messaging link previews. */
export const OFFICIAL_SOCIAL_IMAGE = "/images/social/lecomax-share-v3.jpg";
export const SOCIAL_TITLE = "L’ecomax — Sublimez votre quotidien.";
export const SOCIAL_DESCRIPTION = "Découvrez notre sélection mode, tech et lifestyle. Livraison partout au Maroc. Explorez la boutique sur lecomax.com.";
export const SOCIAL_IMAGE_METADATA = {
  url: OFFICIAL_SOCIAL_IMAGE,
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "L’ecomax — Sublimez votre quotidien. Mode, tech et lifestyle sur fond vert profond.",
};

/** Upgrade built-in artwork while preserving a merchant's custom share image. */
export function resolveSocialImage(configuredImage?: string | null): string {
  const image = configuredImage?.trim();
  if (!image) return OFFICIAL_SOCIAL_IMAGE;
  const path = image.replace(/^https?:\/\/(?:www\.)?lecomax\.com/i, "").split(/[?#]/)[0];
  return path === "/images/social/lecomax-premium-v1.jpg"
    || path === "/images/social/lecomax-share-v2.jpg"
    || path === "/images/lecomax logo.png"
    || path.includes("ecomax-hero-banner")
    ? OFFICIAL_SOCIAL_IMAGE : image;
}
