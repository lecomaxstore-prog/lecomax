import type { Product } from "@/types/commerce";

const STOP_WORDS = new Set(["avec", "dans", "pour", "sans", "homme", "femme", "produit", "nouveau", "nouvelle", "polyvalent", "confort"]);
const FAMILIES: [string, string[]][] = [
  ["backpacks", ["sac a dos", "backpack", "cartable"]],
  ["waist-bags", ["sac banane", "banane", "waist bag", "belt bag", "sacoche ceinture"]],
  ["handbags", ["sac a main", "handbag", "cabas", "pochette"]],
  ["travel-bags", ["sac de voyage", "voyage", "duffle", "weekend bag", "bagage"]],
  ["slippers", ["chausson", "pantoufle"]],
  ["slides", ["claquette", "sandale", "mule"]],
  ["running-shoes", ["chaussure", "shoe", "sneaker", "basket", "trainer"]],
  ["boots", ["botte", "bottine"]],
  ["earbuds", ["earbud", "ecouteur", "tws", "airpod"]],
  ["headphones", ["casque", "headphone"]],
  ["speakers", ["enceinte", "speaker"]],
  ["jackets", ["veste", "blouson", "coupe vent"]],
  ["hoodies", ["sweat", "hoodie", "sweatshirt"]],
  ["t-shirts", ["t shirt", "tee shirt", "tshirt", "teeshirt"]],
  ["shirts", ["chemise", "shirt"]],
  ["polos", ["polo"]],
  ["shorts", ["short", "bermuda"]],
  ["dresses", ["robe", "dress"]],
  ["skirts", ["jupe", "skirt"]],
  ["pants", ["pantalon", "jogging", "jogger", "legging"]],
  ["watches", ["montre", "watch"]],
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// Descriptions often mention styling suggestions for entirely different items.
// Classify the name first, then fall back to the slug and category only.
const family = (product: Product) => {
  for (const source of [product.name, product.slug, product.category]) {
    const text = normalize(source);
    const match = FAMILIES.find(([, terms]) => terms.some((term) => new RegExp(`(?:^| )${term}s?(?: |$)`).test(text)));
    if (match) return match[0];
  }
};
const tokens = (product: Product) => new Set(normalize(product.name).split(" ").filter((token) => token.length >= 4 && !STOP_WORDS.has(token)));

export function realSimilarProducts(current: Product, products: Product[], limit = 8) {
  const currentFamily = family(current);
  const currentTokens = tokens(current);
  return products
    .filter((candidate) => {
      if (!candidate.active || candidate.id === current.id || candidate.stock <= 0) return false;
      const candidateFamily = family(candidate);
      if (currentFamily) return candidateFamily === currentFamily;
      if (candidateFamily) return false;
      if (candidate.category !== current.category) return false;
      return [...tokens(candidate)].filter((token) => currentTokens.has(token)).length >= 2;
    })
    .sort((left, right) => {
      const shared = (product: Product) => [...tokens(product)].filter((token) => currentTokens.has(token)).length;
      return shared(right) - shared(left) || Math.abs(current.price - left.price) - Math.abs(current.price - right.price);
    })
    .slice(0, limit);
}
