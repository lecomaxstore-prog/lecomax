import type { Product } from "@/types/commerce";

const STOP_WORDS = new Set(["avec", "dans", "pour", "sans", "homme", "femme", "produit", "nouveau", "nouvelle", "polyvalent", "confort"]);
const FAMILIES: [string, string[]][] = [
  ["backpacks", ["sac a dos", "backpack", "cartable"]],
  ["waist-bags", ["sac banane", "banane", "waist bag", "belt bag", "sacoche ceinture"]],
  ["handbags", ["sac a main", "handbag", "cabas", "pochette"]],
  ["travel-bags", ["sac de voyage", "voyage", "duffle", "weekend bag", "bagage"]],
  ["slippers", ["chausson", "pantoufle"]],
  ["slides", ["claquette", "sandale", "mule"]],
  ["running-shoes", ["running", "course", "sneaker", "basket"]],
  ["boots", ["botte", "bottine"]],
  ["earbuds", ["earbud", "ecouteur", "tws", "airpod"]],
  ["headphones", ["casque", "headphone"]],
  ["speakers", ["enceinte", "speaker"]],
  ["jackets", ["veste", "blouson", "coupe vent"]],
  ["hoodies", ["sweat", "hoodie", "sweatshirt"]],
  ["shirts", ["chemise", "t shirt", "tee shirt"]],
  ["pants", ["pantalon", "jogging", "jogger", "legging"]],
  ["watches", ["montre", "watch"]],
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const text = (product: Product) => normalize([product.slug, product.name, product.category, product.brand, product.description].filter(Boolean).join(" "));
const family = (product: Product) => FAMILIES.find(([, terms]) => terms.some((term) => text(product).includes(term)))?.[0];
const tokens = (product: Product) => new Set(normalize(`${product.name} ${product.description ?? ""}`).split(" ").filter((token) => token.length >= 4 && !STOP_WORDS.has(token)));

export function realSimilarProducts(current: Product, products: Product[], limit = 8) {
  const currentFamily = family(current);
  const currentTokens = tokens(current);
  return products
    .filter((candidate) => {
      if (!candidate.active || candidate.id === current.id || candidate.stock <= 0) return false;
      const candidateFamily = family(candidate);
      if (currentFamily) return candidateFamily === currentFamily;
      if (candidate.category !== current.category) return false;
      return [...tokens(candidate)].filter((token) => currentTokens.has(token)).length >= 2;
    })
    .sort((left, right) => {
      const shared = (product: Product) => [...tokens(product)].filter((token) => currentTokens.has(token)).length;
      return shared(right) - shared(left) || Math.abs(current.price - left.price) - Math.abs(current.price - right.price);
    })
    .slice(0, limit);
}
