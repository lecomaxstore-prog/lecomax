export type Product = {
  slug: string;
  name: string;
  category: "homme" | "femme" | "chaussures" | "accessoires";
  subCategory: string;
  price: number;
  oldPrice?: number;
  colors: string[];
  sizes: string[];
  image: string;
  gallery: string[];
  badge?: "Nouveau" | "Exclu membre" | "Promo" | "Bestseller";
  description: string;
  descriptionImage?: string;
  descriptionImages?: string[];
  colorImages?: Record<string, string>;
  colorSizes?: Record<string, string[]>;
  video?: string;
  sizeGuideType?: "clothing" | "shoes" | "none";
};

/* ─────────────────────────── CHAUSSURES ────────────────────────── */
const chaussures: Product[] = [
  {
    slug: "c-baasploa-course-homme",
    name: "Baasploa Baskets de Course Respirantes Homme",
    category: "chaussures",
    subCategory: "Running",
    price: 249,
    oldPrice: 349,
    badge: "Nouveau",
    colors: ["Jaune", "Bleu", "Gris"],
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
    image: "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Yellow.avif",
    gallery: [
      "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Blue.avif",
      "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/grey.avif",
    ],
    descriptionImage: "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/discption%20yellow%20and%20blue%20%20image.avif",
    colorImages: {
      "Jaune": "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Yellow.avif",
      "Bleu":  "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Blue.avif",
      "Gris":  "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/grey.avif",
    },
    colorSizes: {
      "Jaune": ["45"],
      "Bleu":  ["44"],
      "Gris":  ["44"],
    },
    video: "https://goods-vod.kwcdn.com/goods-video/ee9eeea66a636eb7c84ad443fc2f90558be85d05.f30.mp4",
    description: "Chaussures de marche décontractées et respirantes pour hommes. Baskets tendance ultra-légères, idéales pour la course, la marche et le tennis au quotidien. Semelle souple et aérée pour un confort toute la journée.",
  },
];

/* ───────────────────────────── HOMME ──────────────────────────── */
const homme: Product[] = [];

/* ───────────────────────────── FEMME ──────────────────────────── */
const femme: Product[] = [];

/* ────────────────────────── ACCESSOIRES ────────────────────────── */
const accessoires: Product[] = [
  {
    slug: "a-genai-tws-hd",
    name: "GENAI Écouteurs Stéréo HD Sans Fil TWS",
    category: "accessoires",
    subCategory: "Audio",
    price: 149,
    colors: ["Blanc", "Noir"],
    sizes: ["Taille unique"],
    badge: "Nouveau",
    image: "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/1%20white.avif",
    gallery: [
      "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/2%20black.avif",
    ],
    descriptionImages: [
      "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/1%20description.avif",
      "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/2%20description.avif",
    ],
    colorImages: {
      "Blanc": "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/1%20white.avif",
      "Noir":  "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/2%20black.avif",
    },
    description: "Mini écouteurs sans fil TWS avec son stéréo HD haute fidélité. Contrôle tactile du volume intégré, longue autonomie avec boîtier de charge compact. Idéals pour le sport, les déplacements et le quotidien. Connexion Bluetooth stable, ajustement confortable dans l'oreille et microphone intégré pour les appels.",
  },
];

export const products: Product[] = [
  ...chaussures,
  ...homme,
  ...femme,
  ...accessoires,
];

/* ─── Category metadata ─── */
export const categories = [
  {
    slug: "homme",
    label: "Homme",
    hero: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1920&q=80",
    description: "Vestes, bombers, sweats et hoodies pour hommes. Du casual au sport.",
  },
  {
    slug: "femme",
    label: "Femme",
    hero: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1920&q=80",
    description: "Vestes, bombers et hoodies pour femmes. Style et confort au quotidien.",
  },
  {
    slug: "chaussures",
    label: "Chaussures",
    hero: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1920&q=80",
    description: "Running, trail et lifestyle — la chaussure parfaite pour chaque usage.",
  },
  {
    slug: "accessoires",
    label: "Accessoires",
    hero: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1920&q=80",
    description: "Manettes gaming, ecouteurs, sacs a dos et accessoires tech.",
  },
] as const;

/* ─── Helpers ─── */
export type CategorySlug = (typeof categories)[number]["slug"];

export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const getProduct = (slug: string) =>
  products.find((p) => p.slug === slug);

export const productsByCategory = (cat: string) =>
  products.filter((p) => p.category === cat);

export const subCategoriesFor = (cat: string): string[] => {
  const subs = [...new Set(products.filter((p) => p.category === cat).map((p) => p.subCategory))];
  return subs;
};

export const featured = products.filter(
  (p) => p.badge === "Nouveau" || p.badge === "Bestseller"
);

export const formatMAD = (n: number) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(n);

// ─── Normalised card type accepted by ProductCard / ProductRail ───────────────
export type CardProduct = {
  slug: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  oldPrice?: number;
  image: string;
  colors: string[];
  sizes: string[];
  badge?: string;
};

/** Convert an API/Supabase product to the CardProduct format */
export function apiToCard(p: {
  slug: string;
  name: string;
  category: string;
  price: number;
  original_price?: number | null;
  images?: string[] | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  featured?: boolean;
  brand?: string | null;
}): CardProduct {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    oldPrice: p.original_price ?? undefined,
    image:
      (p.images ?? [])[0] ??
      "https://placehold.co/400x500/f5f5f5/888888/png?text=Photo",
    colors: (p.colors as string[]) ?? [],
    sizes: (p.sizes as string[]) ?? [],
    badge: p.featured ? "Nouveau" : undefined,
  };
}
