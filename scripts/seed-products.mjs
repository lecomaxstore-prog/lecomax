// scripts/seed-products.mjs
// Run: node scripts/seed-products.mjs
import { createClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseUrl } from "./supabase-admin-env.mjs";

const SUPABASE_URL = supabaseUrl;
const SERVICE_ROLE_KEY = serviceRoleKey;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const products = [
  // â”€â”€â”€ CHAUSSURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: "c-baasploa-course-homme",
    name: "Baasploa Baskets de Course Respirantes Homme",
    category: "chaussures",
    brand: "Baasploa",
    price: 249,
    original_price: 349,
    featured: true,
    active: true,
    stock: 50,
    colors: ["Jaune", "Bleu", "Gris"],
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
    images: [
      "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Yellow.avif",
      "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/Blue.avif",
      "/images/products/BAASPLOA%20Men's%20Lightweight%20Running%20Sneakers/grey.avif",
    ],
    description:
      "Chaussures de marche dÃ©contractÃ©es et respirantes pour hommes. Baskets tendance ultra-lÃ©gÃ¨res, idÃ©ales pour la course, la marche et le tennis au quotidien. Semelle souple et aÃ©rÃ©e pour un confort toute la journÃ©e.",
    tags: ["running", "sport", "chaussures", "homme"],
  },

  // â”€â”€â”€ ACCESSOIRES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: "a-sac-bandouliere-antivol-code",
    name: "Sac BandouliÃ¨re Anti-Vol Homme â€” Verrou Ã  Code NumÃ©rique, Finitions DorÃ©es",
    category: "accessoires",
    brand: null,
    price: 99,
    original_price: null,
    featured: true,
    active: true,
    stock: 80,
    colors: ["Noir"],
    sizes: ["Taille unique"],
    images: [
      "/images/products/Sac%20bandouli%C3%A8re/1.avif",
      "/images/products/Sac%20bandouli%C3%A8re/2.avif",
      "/images/products/Sac%20bandouli%C3%A8re/3.avif",
      "/images/products/Sac%20bandouli%C3%A8re/4.avif",
    ],
    description:
      "Sac bandouliÃ¨re anti-vol pour hommes avec verrou Ã  code numÃ©rique et technologie anti-vol avancÃ©e. Sangle rÃ©glable, finitions mÃ©talliques dorÃ©es Ã©lÃ©gantes, tissu durable rÃ©sistant aux rayures. Compartiments zippÃ©s organisÃ©s et port USB intÃ©grÃ©. IdÃ©al pour la moto, le voyage, la salle de sport et l'usage quotidien.",
    tags: ["sac", "accessoires", "anti-vol", "voyage"],
  },
  {
    slug: "a-sac-banane-pu-polyvalent",
    name: "Sac Banane Polyvalent PU â€” Ceinture / BandouliÃ¨re / Ã‰paule / Poitrine",
    category: "accessoires",
    brand: null,
    price: 69,
    original_price: null,
    featured: true,
    active: true,
    stock: 100,
    colors: ["Noir", "Gris"],
    sizes: ["Taille unique"],
    images: [
      "/images/products/Sac%20banane/1.avif",
      "/images/products/Sac%20banane/2.avif",
      "/images/products/Sac%20banane/3.avif",
      "/images/products/Sac%20banane/4.avif",
      "/images/products/Sac%20banane/5.avif",
    ],
    description:
      "Sac banane polyvalent en matÃ©riau PU de qualitÃ© premium. RÃ©glable pour se porter Ã  la taille, en bandouliÃ¨re, Ã  l'Ã©paule ou sur la poitrine. Fermeture Ã©clair ultra-lisse, plusieurs poches organisÃ©es et dos en maille respirante pour un confort optimal. IdÃ©al pour le voyage, la randonnÃ©e et le quotidien.",
    tags: ["sac", "accessoires", "banane", "voyage"],
  },
  {
    slug: "a-lenovo-k3-pro-enceinte",
    name: "Lenovo K3 PRO â€” Enceinte Bluetooth HiFi Son StÃ©rÃ©o CinÃ©ma",
    category: "accessoires",
    brand: "Lenovo",
    price: 99,
    original_price: null,
    featured: true,
    active: true,
    stock: 60,
    colors: ["Ã‰dition Standard"],
    sizes: ["Taille unique"],
    images: [
      "/images/products/Lenovo%20K3%20PRO/1.avif",
      "/images/products/Lenovo%20K3%20PRO/2.avif",
      "/images/products/Lenovo%20K3%20PRO/3.avif",
      "/images/products/Lenovo%20K3%20PRO/4.avif",
      "/images/products/Lenovo%20K3%20PRO/5.avif",
    ],
    description:
      "L'enceinte Lenovo K3 PRO dÃ©livre un son stÃ©rÃ©o HiFi Ã  qualitÃ© cinÃ©ma dans un format ultra-lÃ©ger et portable. IdÃ©ale pour Ã©couter de la musique, regarder des films ou prendre des appels en dÃ©placement. Connexion Bluetooth simple et rapide, autonomie longue durÃ©e.",
    tags: ["audio", "bluetooth", "enceinte", "lenovo"],
  },
  {
    slug: "a-manette-sans-fil-rgb-v2",
    name: "Manette de Jeu Sans Fil Interactive (No Drift) â€” iOS / Switch / PC / Android / Steam Deck Â· RGB Â· Batterie 1800mAh Â· V2 Noir",
    category: "accessoires",
    brand: null,
    price: 499,
    original_price: null,
    featured: true,
    active: true,
    stock: 40,
    colors: ["Noir"],
    sizes: ["Taille unique"],
    images: [
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/1.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/2.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/3.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/4.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/5.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/6.avif",
      "/images/products/Manette%20de%20Jeu%20Sans%20Fil/7.avif",
    ],
    description:
      "Manette gaming sans fil avec technologie No Drift (sticks Ã  effet Hall) pour une prÃ©cision maximale sans dÃ©rive. Compatible iOS, Nintendo Switch, PC, Android et Steam Deck. Ã‰clairage RGB personnalisable, gÃ¢chettes progressives Ã  effet Hall, boutons remappables, batterie 1800 mAh avec station de charge incluse. Non compatible Xbox et PS5.",
    tags: ["gaming", "manette", "sans-fil", "rgb", "ios", "switch", "pc"],
  },
  {
    slug: "a-genai-tws-hd",
    name: "GENAI Ã‰couteurs StÃ©rÃ©o HD Sans Fil TWS",
    category: "accessoires",
    brand: "GENAI",
    price: 149,
    original_price: null,
    featured: true,
    active: true,
    stock: 75,
    colors: ["Blanc", "Noir"],
    sizes: ["Taille unique"],
    images: [
      "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/1%20white.avif",
      "/images/products/GENAI%20%C3%89couteurs%20st%C3%A9r%C3%A9o%20HD%20sans%20fil%20TWS/2%20black.avif",
    ],
    description:
      "Mini Ã©couteurs sans fil TWS avec son stÃ©rÃ©o HD haute fidÃ©litÃ©. ContrÃ´le tactile du volume intÃ©grÃ©, longue autonomie avec boÃ®tier de charge compact. IdÃ©als pour le sport, les dÃ©placements et le quotidien. Connexion Bluetooth stable, ajustement confortable dans l'oreille et microphone intÃ©grÃ© pour les appels.",
    tags: ["audio", "ecouteurs", "tws", "bluetooth"],
  },
];

async function seed() {
  console.log(`Seeding ${products.length} products into Supabaseâ€¦`);

  const { data, error } = await sb
    .from("products")
    .upsert(products, { onConflict: "slug", ignoreDuplicates: false });

  if (error) {
    console.error("âŒ Error:", error.message);
    process.exit(1);
  }

  console.log("âœ… Done! Products upserted successfully.");

  // Verify
  const { data: rows, error: err2 } = await sb
    .from("products")
    .select("slug, name, price, active")
    .order("created_at", { ascending: false });

  if (err2) { console.error("Verify error:", err2.message); return; }
  console.log(`\nProducts now in DB (${rows.length} total):`);
  rows.forEach((r) => console.log(`  ${r.active ? "âœ“" : "âœ—"} [${r.price} MAD] ${r.slug}`));
}

seed();
