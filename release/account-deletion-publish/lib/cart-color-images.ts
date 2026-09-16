/**
 * Lightweight slug→color→image map for cart display.
 * Only products that have multiple color variants need entries here.
 */
export const cartColorImages: Record<string, Record<string, string>> = {
  "c-baasploa-course-homme": {
    "Jaune": "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Yellow.avif",
    "Bleu":  "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Blue.avif",
    "Gris":  "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/grey.avif",
  },
  "c-chaussons-interieur-femme": {
    "Blanc": "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/1%20blanc.avif",
    "Rose":  "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/1%20rose.avif",
  },
  "c-chaussons-mode-femme": {
    "Kaki":  "/images/products/Chaussons%20de%20mode%20pour%20femme/1%20kaki.avif",
    "Blanc": "/images/products/Chaussons%20de%20mode%20pour%20femme/1%20blanc.avif",
  },
  "c-chaussons-fleurs-femme": {
    "Gris Clair": "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/1%20gris%20clair.avif",
    "Kaki":       "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/1%20kaki.avif",
  },
  "a-sac-banane-pu-polyvalent": {
    "Noir": "/images/products/Sac%20banane/1.avif",
    "Gris": "/images/products/Sac%20banane/2.avif",
  },
  "a-lenovo-gm2-pro": {
    "Blanc": "/images/products/lenovo%20gm2%20pro/1.avif",
    "Noir":  "/images/products/lenovo%20gm2%20pro/2.avif",
  },
  "a-lenovo-lp40-pro": {
    "Blanc": "/images/products/lenovo%20lp40%20pro/1.avif",
    "Noir":  "/images/products/lenovo%20lp40%20pro/2.avif",
  },
  "a-genai-tws-hd": {
    "Blanc": "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/1%20white.avif",
    "Noir":  "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/2%20black.avif",
  },
};

/** Returns the correct image for a cart item given its slug and selected color. */
export function getCartImage(slug: string, color: string, fallback: string): string {
  return cartColorImages[slug]?.[color] ?? fallback;
}
