import type { CardProduct } from "./products";

type RecommendationProduct = CardProduct & {
  description?: string;
  subCategory?: string;
};

const STOP_WORDS = new Set([
  "a", "au", "aux", "avec", "de", "des", "du", "en", "et", "la", "le", "les",
  "pour", "par", "sur", "un", "une", "the", "with", "and", "for", "nouveau", "nouvelle",
  "homme", "femme", "unisexe", "mode", "produit",
]);

const PRODUCT_FAMILIES: Array<{ name: string; terms: string[] }> = [
  { name: "earbuds", terms: ["earbud", "earbuds", "ecouteur", "ecouteurs", "tws", "airpod", "airpods", "intra auriculaire"] },
  { name: "headphones", terms: ["casque", "casques", "headphone", "headphones"] },
  { name: "speakers", terms: ["enceinte", "enceintes", "speaker", "speakers"] },
  { name: "slippers", terms: ["chausson", "chaussons", "pantoufle", "pantoufles"] },
  { name: "slides", terms: ["claquette", "claquettes", "sandale", "sandales", "mule", "mules"] },
  { name: "running-shoes", terms: ["chaussure", "shoe", "sneaker", "basket", "trainer"] },
  { name: "boots", terms: ["botte", "bottes", "bottine", "bottines"] },
  { name: "jackets", terms: ["veste", "vestes", "blouson", "blousons", "coupe vent"] },
  { name: "hoodies", terms: ["sweat", "sweats", "hoodie", "hoodies", "sweatshirt"] },
  { name: "t-shirts", terms: ["t shirt", "tee shirt", "tshirt", "teeshirt"] },
  { name: "shirts", terms: ["chemise", "shirt"] },
  { name: "polos", terms: ["polo"] },
  { name: "shorts", terms: ["short", "bermuda"] },
  { name: "dresses", terms: ["robe", "dress"] },
  { name: "skirts", terms: ["jupe", "skirt"] },
  { name: "pants", terms: ["pantalon", "pantalons", "jogging", "joggers", "legging", "leggings"] },
  { name: "backpacks", terms: ["sac a dos", "sacs a dos", "backpack", "backpacks", "cartable"] },
  { name: "waist-bags", terms: ["sac banane", "banane", "waist bag", "belt bag", "sacoche ceinture"] },
  { name: "handbags", terms: ["sac a main", "handbag", "cabas", "pochette"] },
  { name: "travel-bags", terms: ["sac de voyage", "voyage", "duffle", "weekend bag", "bagage"] },
  { name: "watches", terms: ["montre", "montres", "watch", "watches"] },
];

const FAMILY_GROUPS: Record<string, string> = {
  earbuds: "audio",
  headphones: "audio",
  speakers: "audio",
  slippers: "footwear",
  slides: "footwear",
  "running-shoes": "footwear",
  boots: "footwear",
  jackets: "clothing",
  hoodies: "clothing",
  shirts: "clothing",
  "t-shirts": "clothing",
  polos: "clothing",
  shorts: "clothing",
  dresses: "clothing",
  skirts: "clothing",
  pants: "clothing",
  backpacks: "bags",
  "waist-bags": "bags",
  handbags: "bags",
  "travel-bags": "bags",
  watches: "accessories",
};

function normalize(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchableText(product: RecommendationProduct) {
  return normalize([
    product.slug,
    product.name,
    product.category,
    product.subCategory,
    product.description,
  ].filter(Boolean).join(" "));
}

const FAMILY_PATTERNS = PRODUCT_FAMILIES.map(({ name, terms }) => ({
  name,
  patterns: terms.map((term) => new RegExp(`(?:^| )${normalize(term)}s?(?: |$)`)),
}));

function familyOf(product: RecommendationProduct) {
  for (const source of [product.name, product.slug, product.subCategory, product.category]) {
    const text = normalize(source);
    const match = FAMILY_PATTERNS.find(({ patterns }) => patterns.some((pattern) => pattern.test(text)));
    if (match) return match.name;
  }
  return null;
}

function audienceOf(product: RecommendationProduct) {
  const text = searchableText(product);
  if (/\b(femme|women|woman|girl|feminin)\b/.test(text)) return "femme";
  if (/\b(homme|men|man|boy|masculin)\b/.test(text)) return "homme";
  if (/\b(enfant|kids|kid|child)\b/.test(text)) return "enfant";
  return null;
}

function meaningfulTokens(product: RecommendationProduct) {
  return new Set(
    normalize(product.name)
      .split(" ")
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
  );
}

function similarityScore(current: RecommendationProduct, candidate: RecommendationProduct) {
  const currentFamily = familyOf(current);
  const candidateFamily = familyOf(candidate);
  const currentGroup = currentFamily ? FAMILY_GROUPS[currentFamily] : null;
  const candidateGroup = candidateFamily ? FAMILY_GROUPS[candidateFamily] : null;
  const currentAudience = audienceOf(current);
  const candidateAudience = audienceOf(candidate);
  let score = 0;

  if (currentFamily && candidateFamily === currentFamily) score += 100;
  else if (currentGroup && candidateGroup === currentGroup) score += 42;

  if (normalize(current.subCategory) && normalize(current.subCategory) === normalize(candidate.subCategory)) score += 58;
  if (normalize(current.category) === normalize(candidate.category)) score += 28;

  if (currentAudience && candidateAudience) {
    score += currentAudience === candidateAudience ? 18 : -90;
  }

  const currentTokens = meaningfulTokens(current);
  const sharedTokens = [...meaningfulTokens(candidate)].filter((token) => currentTokens.has(token)).length;
  score += Math.min(sharedTokens, 5) * 11;

  const higherPrice = Math.max(current.price, candidate.price);
  if (higherPrice > 0) score += Math.max(0, 10 - (Math.abs(current.price - candidate.price) / higherPrice) * 10);

  if (candidate.badge === "Bestseller") score += 2;
  if (candidate.badge === "Nouveau") score += 1;
  return score;
}

function isActuallySimilar(current: RecommendationProduct, candidate: RecommendationProduct) {
  const currentFamily = familyOf(current);
  const candidateFamily = familyOf(candidate);
  const currentSubcategory = normalize(current.subCategory);
  const candidateSubcategory = normalize(candidate.subCategory);
  if (currentFamily) return candidateFamily === currentFamily;
  if (candidateFamily) return false;
  if (currentSubcategory && candidateSubcategory === currentSubcategory) return true;
  if (normalize(current.category) !== normalize(candidate.category)) return false;
  const currentTokens = meaningfulTokens(current);
  const sharedTokens = [...meaningfulTokens(candidate)].filter((token) => currentTokens.has(token));
  return sharedTokens.length >= 2;
}

/**
 * Rank catalogue products by real product similarity. The function is data-driven:
 * newly added products participate automatically through their name, category,
 * subcategory, audience and price—without needing a manual related-products list.
 */
export function rankSimilarProducts<T extends RecommendationProduct>(
  current: RecommendationProduct,
  catalogue: T[],
  limit = 4
) {
  const unique = new Map<string, T>();
  for (const candidate of catalogue) {
    if (candidate.slug !== current.slug && candidate.stock !== 0 && !unique.has(candidate.slug)) {
      unique.set(candidate.slug, candidate);
    }
  }

  return [...unique.values()]
    .filter((candidate) => isActuallySimilar(current, candidate))
    .map((candidate) => ({ candidate, score: similarityScore(current, candidate) }))
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name, "fr"))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
