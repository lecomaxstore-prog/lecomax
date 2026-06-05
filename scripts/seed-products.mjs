// scripts/seed-products.mjs
// Run: node scripts/seed-products.mjs
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yddqwgdgeljkzfsmtein.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZHF3Z2RnZWxqa3pmc210ZWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxNDM5MywiZXhwIjoyMDkyODkwMzkzfQ.76uWpxv2hnt665DmOf0xjYnm61Nbot0FWB5Bf9XCTnQ";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const products = [
  // ─── CHAUSSURES ───────────────────────────────────────────────
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
      "Chaussures de marche décontractées et respirantes pour hommes. Baskets tendance ultra-légères, idéales pour la course, la marche et le tennis au quotidien. Semelle souple et aérée pour un confort toute la journée.",
    tags: ["running", "sport", "chaussures", "homme"],
  },

  // ─── ACCESSOIRES ──────────────────────────────────────────────
  {
    slug: "a-sac-bandouliere-antivol-code",
    name: "Sac Bandoulière Anti-Vol Homme — Verrou à Code Numérique, Finitions Dorées",
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
      "Sac bandoulière anti-vol pour hommes avec verrou à code numérique et technologie anti-vol avancée. Sangle réglable, finitions métalliques dorées élégantes, tissu durable résistant aux rayures. Compartiments zippés organisés et port USB intégré. Idéal pour la moto, le voyage, la salle de sport et l'usage quotidien.",
    tags: ["sac", "accessoires", "anti-vol", "voyage"],
  },
  {
    slug: "a-sac-banane-pu-polyvalent",
    name: "Sac Banane Polyvalent PU — Ceinture / Bandoulière / Épaule / Poitrine",
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
      "Sac banane polyvalent en matériau PU de qualité premium. Réglable pour se porter à la taille, en bandoulière, à l'épaule ou sur la poitrine. Fermeture éclair ultra-lisse, plusieurs poches organisées et dos en maille respirante pour un confort optimal. Idéal pour le voyage, la randonnée et le quotidien.",
    tags: ["sac", "accessoires", "banane", "voyage"],
  },
  {
    slug: "a-lenovo-k3-pro-enceinte",
    name: "Lenovo K3 PRO — Enceinte Bluetooth HiFi Son Stéréo Cinéma",
    category: "accessoires",
    brand: "Lenovo",
    price: 99,
    original_price: null,
    featured: true,
    active: true,
    stock: 60,
    colors: ["Édition Standard"],
    sizes: ["Taille unique"],
    images: [
      "/images/products/Lenovo%20K3%20PRO/1.avif",
      "/images/products/Lenovo%20K3%20PRO/2.avif",
      "/images/products/Lenovo%20K3%20PRO/3.avif",
      "/images/products/Lenovo%20K3%20PRO/4.avif",
      "/images/products/Lenovo%20K3%20PRO/5.avif",
    ],
    description:
      "L'enceinte Lenovo K3 PRO délivre un son stéréo HiFi à qualité cinéma dans un format ultra-léger et portable. Idéale pour écouter de la musique, regarder des films ou prendre des appels en déplacement. Connexion Bluetooth simple et rapide, autonomie longue durée.",
    tags: ["audio", "bluetooth", "enceinte", "lenovo"],
  },
  {
    slug: "a-manette-sans-fil-rgb-v2",
    name: "Manette de Jeu Sans Fil Interactive (No Drift) — iOS / Switch / PC / Android / Steam Deck · RGB · Batterie 1800mAh · V2 Noir",
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
      "Manette gaming sans fil avec technologie No Drift (sticks à effet Hall) pour une précision maximale sans dérive. Compatible iOS, Nintendo Switch, PC, Android et Steam Deck. Éclairage RGB personnalisable, gâchettes progressives à effet Hall, boutons remappables, batterie 1800 mAh avec station de charge incluse. Non compatible Xbox et PS5.",
    tags: ["gaming", "manette", "sans-fil", "rgb", "ios", "switch", "pc"],
  },
  {
    slug: "a-genai-tws-hd",
    name: "GENAI Écouteurs Stéréo HD Sans Fil TWS",
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
      "Mini écouteurs sans fil TWS avec son stéréo HD haute fidélité. Contrôle tactile du volume intégré, longue autonomie avec boîtier de charge compact. Idéals pour le sport, les déplacements et le quotidien. Connexion Bluetooth stable, ajustement confortable dans l'oreille et microphone intégré pour les appels.",
    tags: ["audio", "ecouteurs", "tws", "bluetooth"],
  },
];

async function seed() {
  console.log(`Seeding ${products.length} products into Supabase…`);

  const { data, error } = await sb
    .from("products")
    .upsert(products, { onConflict: "slug", ignoreDuplicates: false });

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  console.log("✅ Done! Products upserted successfully.");

  // Verify
  const { data: rows, error: err2 } = await sb
    .from("products")
    .select("slug, name, price, active")
    .order("created_at", { ascending: false });

  if (err2) { console.error("Verify error:", err2.message); return; }
  console.log(`\nProducts now in DB (${rows.length} total):`);
  rows.forEach((r) => console.log(`  ${r.active ? "✓" : "✗"} [${r.price} MAD] ${r.slug}`));
}

seed();
