export type Product = {
  slug: string;
  name: string;
  displayName?: string;
  specs?: string[];
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
    slug: "a-sac-bandouliere-antivol-code",
    name: "Sac Bandoulière Anti-Vol Homme — Verrou à Code Numérique, Finitions Dorées",
    displayName: "Sac Bandoulière Anti-Vol — Verrou à Code",
    specs: ["Verrou à code numérique", "Technologie anti-vol", "Finitions métalliques dorées", "Sangle réglable", "Port USB compatible", "Tissu durable"],
    category: "accessoires",
    subCategory: "Sacs",
    price: 99,
    badge: "Nouveau",
    colors: ["Noir"],
    sizes: ["Taille unique"],
    image: "/images/products/Sac%20bandouli%C3%A8re/1.avif",
    gallery: [
      "/images/products/Sac%20bandouli%C3%A8re/2.avif",
      "/images/products/Sac%20bandouli%C3%A8re/3.avif",
      "/images/products/Sac%20bandouli%C3%A8re/4.avif",
    ],
    descriptionImages: [
      "/images/products/Sac%20bandouli%C3%A8re/descption/1.avif",
      "/images/products/Sac%20bandouli%C3%A8re/descption/2.avif",
      "/images/products/Sac%20bandouli%C3%A8re/descption/3.avif",
      "/images/products/Sac%20bandouli%C3%A8re/descption/4.avif",
    ],
    sizeGuideType: "none",
    description: "Sac bandoulière anti-vol pour hommes avec verrou à code numérique et technologie anti-vol avancée. Sangle réglable, finitions métalliques dorées élégantes, tissu durable résistant aux rayures. Compartiments zippés organisés et port USB intégré. Idéal pour la moto, le voyage, la salle de sport et l'usage quotidien.",
  },
  {
    slug: "a-sac-banane-pu-polyvalent",
    name: "Sac Banane Polyvalent PU — Ceinture / Bandoulière / Épaule / Poitrine",
    displayName: "Sac Banane PU — Multiport Réglable",
    specs: ["Matériau PU premium", "4 façons de porter", "Fermeture éclair lisse", "Maille respirante", "Plusieurs poches", "Léger & voyage"],
    category: "accessoires",
    subCategory: "Sacs",
    price: 69,
    badge: "Bestseller",
    colors: ["Noir", "Gris"],
    sizes: ["Taille unique"],
    colorImages: {
      "Noir": "/images/products/Sac%20banane/1.avif",
      "Gris": "/images/products/Sac%20banane/2.avif",
    },
    image: "/images/products/Sac%20banane/1.avif",
    gallery: [
      "/images/products/Sac%20banane/2.avif",
      "/images/products/Sac%20banane/3.avif",
      "/images/products/Sac%20banane/4.avif",
      "/images/products/Sac%20banane/5.avif",
    ],
    descriptionImages: [
      "/images/products/Sac%20banane/descption%20images/1.avif",
      "/images/products/Sac%20banane/descption%20images/2.avif",
      "/images/products/Sac%20banane/descption%20images/6.avif",
      "/images/products/Sac%20banane/descption%20images/7.avif",
    ],
    sizeGuideType: "none",
    description: "Sac banane polyvalent en matériau PU de qualité premium. Réglable pour se porter à la taille, en bandoulière, à l'épaule ou sur la poitrine. Fermeture éclair ultra-lisse, plusieurs poches organisées et dos en maille respirante pour un confort optimal. Idéal pour le voyage, la randonnée et le quotidien.",
  },
  {
    slug: "a-lenovo-k3-pro-enceinte",
    name: "Lenovo K3 PRO — Enceinte Bluetooth HiFi Son Stéréo Cinéma",
    displayName: "Lenovo K3 PRO — Enceinte HiFi Stéréo",
    specs: ["Son stéréo HiFi", "Léger & portable", "Qualité cinéma", "Bluetooth"],
    category: "accessoires",
    subCategory: "Audio",
    price: 99,
    badge: "Nouveau",
    colors: ["Édition Standard"],
    sizes: ["Taille unique"],
    image: "/images/products/Lenovo%20K3%20PRO/1.avif",
    gallery: [
      "/images/products/Lenovo%20K3%20PRO/2.avif",
      "/images/products/Lenovo%20K3%20PRO/3.avif",
      "/images/products/Lenovo%20K3%20PRO/4.avif",
      "/images/products/Lenovo%20K3%20PRO/5.avif",
    ],
    descriptionImages: [
      "/images/products/Lenovo%20K3%20PRO/descption%20images/1.avif",
      "/images/products/Lenovo%20K3%20PRO/descption%20images/2.avif",
      "/images/products/Lenovo%20K3%20PRO/descption%20images/3.avif",
      "/images/products/Lenovo%20K3%20PRO/descption%20images/4.avif",
    ],
    video: "https://goods-vod.kwcdn.com/goods-video/3ccdd98e1c3a4c8c5425ae7b9fe3fe1f3f607509.f30.mp4",
    sizeGuideType: "none",
    description: "L'enceinte Lenovo K3 PRO délivre un son stéréo HiFi à qualité cinéma dans un format ultra-léger et portable. Idéale pour écouter de la musique, regarder des films ou prendre des appels en déplacement. Connexion Bluetooth simple et rapide, autonomie longue durée.",
  },
  {
    slug: "a-manette-sans-fil-rgb-v2",
    name: "Manette de Jeu Sans Fil Interactive (No Drift) — iOS / Switch / PC / Android / Steam Deck · RGB · Batterie 1800mAh · V2 Noir",
    displayName: "Manette Sans Fil No Drift V2 — RGB · 1800mAh",
    specs: ["No Drift Hall Effect", "iOS · Switch · PC · Android · Steam Deck", "RGB Personnalisable", "Batterie 1800 mAh", "Station de charge incluse", "Boutons remappables"],
    category: "accessoires",
    subCategory: "Gaming",
    price: 499,
    badge: "Nouveau",
    colors: ["Noir"],
    sizes: ["Taille unique"],
    image: "/images/products/Manette%20de%20Jeu%20Sans%20Fil/1.avif",
    gallery: [
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/2.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/3.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/4.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/5.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/6.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/7.avif",
    ],
    descriptionImages: [
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/description/1.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/description/2.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/description/3.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/description/4.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/description/5.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/description/6.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/description/7.avif",
    ],
    video: "https://goods-vod.kwcdn.com/goods-video/0aebee3d158c144c141ed5725db238e6a0325743.f30.mp4",
    sizeGuideType: "none",
    description: "Manette gaming sans fil avec technologie No Drift (sticks à effet Hall) pour une précision maximale sans dérive. Compatible iOS, Nintendo Switch, PC, Android et Steam Deck. Éclairage RGB personnalisable, gâchettes progressives à effet Hall, boutons remappables, batterie 1800 mAh avec station de charge incluse. Non compatible Xbox et PS5.",
  },
  {
    slug: "a-genai-tws-hd",
    name: "GENAI Écouteurs Stéréo HD Sans Fil TWS",
    category: "accessoires",
    subCategory: "Audio",
    price: 149,
    colors: ["Blanc", "Noir"],
    sizes: ["Taille unique"],
    badge: "Bestseller",
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
    hero: "/images/pages images/homme.png",
    description: "Vestes, bombers, sweats et hoodies pour hommes. Du casual au sport.",
  },
  {
    slug: "femme",
    label: "Femme",
    hero: "/images/pages images/femme.png",
    description: "Vestes, bombers et hoodies pour femmes. Style et confort au quotidien.",
  },
  {
    slug: "chaussures",
    label: "Chaussures",
    hero: "/images/pages images/chaussures.png",
    description: "Running, trail et lifestyle — la chaussure parfaite pour chaque usage.",
  },
  {
    slug: "accessoires",
    label: "Accessoires",
    hero: "/images/pages images/accessoires.png",
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
      (p.images ?? []).find((url) => !!url) ??
      "/images/placeholder.png",
    colors: (p.colors as string[]) ?? [],
    sizes: (p.sizes as string[]) ?? [],
    badge: p.featured ? "Nouveau" : undefined,
  };
}
