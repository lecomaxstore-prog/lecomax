export type Product = {
  preorder_enabled?: boolean;
  preorder_estimated_at?: string | null;
  preorder_message?: string | null;
  slug: string;
  name: string;
  displayName?: string;
  /** Manufacturer or consumer-facing brand. Omit when it is not known. */
  brand?: string;
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
  /** Ordered image galleries keyed by the exact color label. */
  colorImageGalleries?: Record<string, string[]>;
  colorPrices?: Record<string, { price: number; originalPrice?: number }>;
  colorSizes?: Record<string, string[]>;
  outOfStockColors?: string[];
  outOfStockSizes?: string[];
  colorSizeStock?: Record<string, Record<string, number>>;
  video?: string;
  sizeGuideType?: "clothing" | "shoes" | "none";
  urgencyStock?: number;
  /** Live database inventory. Undefined means the product only has static catalogue data. */
  stock?: number;
  color_stock?: Record<string, number>;
  tags?: string[];
};

/* ─────────────────────────── CHAUSSURES ────────────────────────── */
const chaussures: Product[] = [
  {
    slug: "c-baasploa-course-homme",
    name: "Baskets de running Baasploa pour homme — Respirantes et légères",
    specs: ["Tige en mesh respirant", "Ultra-léger & flexible", "Semelle amorti souple", "Grip multisurface", "Idéal course & marche", "Design tendance sport"],
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
  {
    slug: "c-chaussons-interieur-femme",
    name: "Chaussons d’intérieur pour femme — Semelles épaisses",
    displayName: "Chaussons d’intérieur pour femme — Semelles épaisses",
    specs: [
      "Semelles épaisses confortables",
      "Ultra-légères & durables",
      "Tissu doux printemps-automne",
      "Usage intérieur",
      "Antidérapantes",
      "Design féminin tendance",
    ],
    category: "femme",
    subCategory: "Chaussons",
    price: 69,
    oldPrice: 89,
    badge: "Promo",
    colors: ["Blanc", "Rose"],
    sizes: ["37", "39"],
    colorSizes: {
      "Blanc": ["39"],
    },
    outOfStockColors: ["Rose"],
    image: "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/1%20blanc.avif",
    gallery: [
      "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/2%20blanc.avif",
      "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/3%20blanc.avif",
      "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/1%20rose.avif",
      "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/2%20rose.avif",
      "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/3%20rose.avif",
    ],
    colorImages: {
      "Blanc": "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/1%20blanc.avif",
      "Rose":  "/images/products/Chaussons%20d%27int%C3%A9rieur%20pour%20femme/1%20rose.avif",
    },
    video: "https://goods-vod.kwcdn.com/goods-video/52c9701b5ad421a16359b2952200d0e353dc7ce0.f30.mp4",
    sizeGuideType: "shoes",
    description: "Chaussons d'intérieur pour femme légers avec semelles épaisses, confortables et durables pour une utilisation intérieure. Idéaux pour le printemps et l'automne, ces chaussons offrent un confort optimal à la maison avec leur semelle épaisse antidérapante et leur tissu doux.",
  },
  {
    slug: "c-chaussons-mode-femme-peluche",
    name: "Chaussons en peluche pour femme — Lanières croisées",
    displayName: "Chaussons en peluche pour femme — Lanières croisées",
    specs: [
      "Peluche douce & chaleureuse",
      "Lanières croisées élégantes",
      "Semelles épaisses antidérapantes",
      "Ultra-légères & confortables",
      "Design mode tendance",
      "Usage intérieur",
    ],
    category: "femme",
    subCategory: "Chaussons",
    price: 69,
    oldPrice: 89,
    badge: "Promo",
    colors: ["Kaki", "Blanc"],
    sizes: ["39", "41", "44"],
    colorSizes: {
      "Kaki": ["44"],
    },
    outOfStockColors: ["Blanc"],
    image: "/images/products/Chaussons%20de%20mode%20pour%20femme/1%20kaki.avif",
    gallery: [
      "/images/products/Chaussons%20de%20mode%20pour%20femme/2%20kaki.avif",
      "/images/products/Chaussons%20de%20mode%20pour%20femme/1%20blanc.avif",
      "/images/products/Chaussons%20de%20mode%20pour%20femme/2%20blanc.avif",
    ],
    colorImages: {
      "Kaki":  "/images/products/Chaussons%20de%20mode%20pour%20femme/1%20kaki.avif",
      "Blanc": "/images/products/Chaussons%20de%20mode%20pour%20femme/1%20blanc.avif",
    },
    sizeGuideType: "shoes",
    urgencyStock: 6,
    description: "Chaussons de mode pour femme en peluche douce avec lanières croisées élégantes. Semelles épaisses antidérapantes pour un confort optimal en intérieur. Design tendance coupe-vent pour un style féminin moderne à la maison.",
  },
  {
    slug: "c-chaussons-exterieur-poils-femme",
    name: "Chaussons fourrés pour femme à cœur brodé — Automne/Hiver",
    displayName: "Chaussons fourrés pour femme — Cœur brodé",
    specs: [
      "Poils doux & moelleux",
      "Décoration cœur brodé",
      "Semelle plate confortable",
      "Bout ouvert tendance",
      "Usage extérieur & intérieur",
      "Idéal automne/hiver",
    ],
    category: "femme",
    subCategory: "Chaussons",
    price: 89,
    colors: [],
    sizes: ["37", "39"],
    outOfStockSizes: ["39"],
    image: "/images/products/Chaussons%20d%27ext%C3%A9rieur%20%C3%A0%20poils%20pour%20femme/1.avif",
    gallery: [
      "/images/products/Chaussons%20d%27ext%C3%A9rieur%20%C3%A0%20poils%20pour%20femme/2.avif",
      "/images/products/Chaussons%20d%27ext%C3%A9rieur%20%C3%A0%20poils%20pour%20femme/3.avif",
    ],
    descriptionImages: [
      "/images/products/Chaussons%20d%27ext%C3%A9rieur%20%C3%A0%20poils%20pour%20femme/descption%20iamges/1.avif",
      "/images/products/Chaussons%20d%27ext%C3%A9rieur%20%C3%A0%20poils%20pour%20femme/descption%20iamges/2.avif",
      "/images/products/Chaussons%20d%27ext%C3%A9rieur%20%C3%A0%20poils%20pour%20femme/descption%20iamges/3.avif",
    ],
    sizeGuideType: "shoes",
    urgencyStock: 6,
    description: "Chaussons d'extérieur à poils pour femme, idéaux pour l'automne et l'hiver. Design tendance avec décoration cœur brodée, semelle plate confortable et bout ouvert. Utilisables en intérieur comme en extérieur pour un style chic au quotidien.",
  },
  {
    slug: "c-chaussons-fleurs-rose-femme",
    name: "Chaussons fleuris pour femme — Confort intérieur",
    displayName: "Chaussons fleuris pour femme — Confort intérieur",
    specs: [
      "Décoration florale tendance",
      "Tissu doux & confortable",
      "Semelle épaisse antidérapante",
      "Légères & résistantes",
      "Design féminin moderne",
      "Usage intérieur & extérieur",
    ],
    category: "femme",
    subCategory: "Chaussons",
    price: 69,
    oldPrice: 89,
    badge: "Promo",
    colors: ["Gris Clair", "Kaki"],
    sizes: ["39", "43"],
    colorSizes: {
      "Gris Clair": ["43"],
    },
    outOfStockColors: ["Kaki"],
    outOfStockSizes: ["39"],
    image: "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/1%20gris%20clair.avif",
    gallery: [
      "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/2%20gris%20clair.avif",
      "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/1%20kaki.avif",
      "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/2%20kaki.avif",
    ],
    colorImages: {
      "Gris Clair": "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/1%20gris%20clair.avif",
      "Kaki":       "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/1%20kaki.avif",
    },
    descriptionImages: [
      "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/descption%20images/1.avif",
      "/images/products/Chaussons%20%C3%A0%20fleurs%20de%20rose/descption%20images/2.avif",
    ],
    video: "https://goods-vod.kwcdn.com/goods-video/23a93596d41219b9e867740f8b67917d26b78635gs2CV.f30.mp4",
    sizeGuideType: "shoes",
    urgencyStock: 6,
    description: "Chaussons à fleurs de rose pour femme, alliant style et confort. Tissu doux avec décoration florale tendance, semelle épaisse antidérapante pour un maintien optimal. Idéaux en intérieur comme en extérieur pour toutes les saisons.",
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
    name: "Sac bandoulière antivol pour homme — Verrou à code",
    displayName: "Sac bandoulière antivol — Verrou à code",
    specs: ["Verrou à code numérique", "Technologie anti-vol", "Finitions métalliques dorées", "Sangle réglable", "Port USB compatible", "Tissu durable"],
    category: "accessoires",
    subCategory: "Sacs",
    price: 99,
    badge: "Nouveau",
    colors: ["Noir / Doré"],
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
    name: "Sac banane polyvalent en PU — Ceinture, bandoulière et poitrine",
    displayName: "Sac banane en PU — Port polyvalent",
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
    name: "Enceinte Bluetooth Lenovo K3 Pro — Son stéréo Hi-Fi",
    displayName: "Enceinte Lenovo K3 Pro — Bluetooth Hi-Fi",
    specs: ["Son stéréo HiFi", "Léger & portable", "Qualité cinéma", "Bluetooth"],
    category: "accessoires",
    subCategory: "Audio",
    price: 99,
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
    name: "Manette sans fil RGB anti-drift — iOS, Switch, PC et Android",
    displayName: "Manette sans fil anti-drift — RGB · 1 800 mAh",
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
    slug: "a-lenovo-gm2-pro-ecouteurs",
    name: "Écouteurs Bluetooth Lenovo GM2 Pro — Son immersif et faible latence",
    displayName: "Écouteurs Lenovo GM2 Pro — Bluetooth gaming",
    specs: ["Bluetooth 5.3", "Son immersif stéréo", "Autonomie prolongée", "Micro HD intégré", "Contrôle tactile", "Compatible iOS & Android"],
    category: "accessoires",
    subCategory: "Audio",
    price: 99,
    colors: ["Blanc", "Noir"],
    sizes: ["Taille unique"],
    image: "/images/products/lenovo%20gm2%20pro/1.avif",
    gallery: [
      "/images/products/lenovo%20gm2%20pro/2.avif",
      "/images/products/lenovo%20gm2%20pro/3.avif",
      "/images/products/lenovo%20gm2%20pro/4.avif",
      "/images/products/lenovo%20gm2%20pro/5.avif",
      "/images/products/lenovo%20gm2%20pro/6.avif",
    ],
    colorImages: {
      "Blanc": "/images/products/lenovo%20gm2%20pro/1.avif",
      "Noir":  "/images/products/lenovo%20gm2%20pro/2.avif",
    },
    descriptionImages: [
      "/images/products/lenovo%20gm2%20pro/descption%20images/1.avif",
      "/images/products/lenovo%20gm2%20pro/descption%20images/2.avif",
      "/images/products/lenovo%20gm2%20pro/descption%20images/3.avif",
      "/images/products/lenovo%20gm2%20pro/descption%20images/4.avif",
      "/images/products/lenovo%20gm2%20pro/descption%20images/5.avif",
    ],
    video: "https://goods-vod.kwcdn.com/goods-video/53a2a9805ab14b81505bb8ddce94629d75ccb5ae.f30.mp4",
    sizeGuideType: "none",
    description: "Les Lenovo GM2 PRO sont des écouteurs sans fil ergonomiques conçus pour une expérience sonore immersive. Leur design anatomique assure un maintien parfait pendant le sport ou les longues sessions d'écoute. Bluetooth 5.3 pour une connexion stable, autonomie prolongée avec boîtier de charge compact, micro HD intégré pour des appels clairs et contrôle tactile intuitif. Compatibles avec tous les téléphones et tablettes iOS & Android.",
  },
  {
    slug: "a-lenovo-lp40-pro-ecouteurs",
    name: "Écouteurs Bluetooth Lenovo LP40 Pro — Sport et gaming",
    displayName: "Écouteurs Lenovo LP40 Pro — Sport et gaming",
    specs: ["Bluetooth 5.3", "Faible latence gaming", "Autonomie longue durée", "Double micro HD", "Contrôle tactile", "Compatible iOS & Android"],
    category: "accessoires",
    subCategory: "Audio",
    price: 99,
    colors: ["Blanc", "Noir"],
    sizes: ["Taille unique"],
    image: "/images/products/lenovo%20lp40%20pro/1.avif",
    gallery: [
      "/images/products/lenovo%20lp40%20pro/2.avif",
      "/images/products/lenovo%20lp40%20pro/3.avif",
      "/images/products/lenovo%20lp40%20pro/4.avif",
    ],
    colorImages: {
      "Blanc": "/images/products/lenovo%20lp40%20pro/1.avif",
      "Noir":  "/images/products/lenovo%20lp40%20pro/2.avif",
    },
    descriptionImages: [
      "/images/products/lenovo%20lp40%20pro/descption%20images/1.avif",
      "/images/products/lenovo%20lp40%20pro/descption%20images/2.avif",
      "/images/products/lenovo%20lp40%20pro/descption%20images/3.avif",
    ],
    video: "https://goods-vod.kwcdn.com/goods-video/d926517e16931faf9e74e461d94cc9c7c3e4ed30.f30.mp4",
    sizeGuideType: "none",
    description: "Les LP40Pro sont des écouteurs Bluetooth sans fil authentiques conçus pour le sport et le gaming. Avec leur faible latence, ils offrent une synchronisation audio parfaite pour les jeux et les vidéos. Leur autonomie longue durée et leur boîtier de charge compact vous accompagnent toute la journée. Double microphone HD pour des appels nets, contrôle tactile intuitif et compatibilité universelle avec tous les téléphones et tablettes iOS & Android.",
  },
  {
    slug: "a-genai-tws-hd",
    name: "Écouteurs Bluetooth GENAI TWS — Stéréo HD sans fil",
    specs: ["Son stéréo HD haute fidélité", "Connexion Bluetooth stable", "Contrôle tactile volume", "Longue autonomie", "Micro intégré appels", "Compatible iOS & Android"],
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
  brand?: string;
  active?: boolean;
  preorder_enabled?: boolean;
  preorder_estimated_at?: string | null;
  preorder_message?: string | null;
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
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  /** Live database inventory. Undefined is reserved for static fallback products. */
  stock?: number;
};

/** Convert an API/Supabase product to the CardProduct format */
export function apiToCard(p: {
  active?: boolean;
  preorder_enabled?: boolean;
  preorder_estimated_at?: string | null;
  preorder_message?: string | null;
  slug: string;
  name: string;
  category: string;
  price: number;
  original_price?: number | null;
  images?: string[] | null;
  colors?: string[] | null;
  sizes?: string[] | null;
  featured?: boolean;
  created_at?: string;
  brand?: string | null;
  stock?: number | null;
}): CardProduct {
  return {
    active: p.active,
    slug: p.slug,
    name: p.name,
    brand: p.brand?.trim() || undefined,
    category: p.category,
    price: p.price,
    oldPrice: p.original_price ?? undefined,
    image:
      (p.images ?? []).find((url) => !!url) ??
      "/images/placeholder.png",
    colors: (p.colors as string[]) ?? [],
    sizes: (p.sizes as string[]) ?? [],
    badge: p.featured && isNewArrivalEligible(p) ? "Nouveau" : undefined,
    createdAt: p.created_at,
    preorder_enabled: p.preorder_enabled === true,
    preorder_estimated_at: p.preorder_estimated_at ?? null,
    preorder_message: p.preorder_message ?? null,
    stock: typeof p.stock === "number" ? p.stock : undefined,
  };
}

/** Restored Lenovo catalogue items must not be promoted as new arrivals. */
export function isNewArrivalEligible(product: { slug: string; name: string; brand?: string | null }): boolean {
  return !/\blenovo\b/i.test(`${product.brand ?? ""} ${product.slug} ${product.name}`);
}
