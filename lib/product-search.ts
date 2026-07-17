export type SearchableProduct = {
  id?: string;
  slug: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  price: number;
  original_price?: number | null;
  description?: string | null;
  images?: string[] | null;
  tags?: string[] | null;
  featured?: boolean | null;
  stock?: number | null;
  created_at?: string | null;
};

const SYNONYM_GROUPS = [
  ["basket", "baskets", "sneaker", "sneakers", "chaussure", "chaussures"],
  ["ecouteur", "ecouteurs", "earbud", "earbuds", "airpod", "airpods", "casque", "audio"],
  ["manette", "controller", "gamepad", "gaming", "jeu", "jeux"],
  ["sac", "sacs", "bag", "voyage", "weekend", "valise"],
  ["montre", "montres", "watch", "smartwatch"],
  ["veste", "vestes", "jacket", "manteau"],
  ["femme", "femmes", "woman", "women"],
  ["homme", "hommes", "man", "men"],
] as const;

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeSearchText(value).split(/\s+/).filter((token) => token.length > 1);
}

function expandedTokens(query: string) {
  const base = tokenize(query);
  const expanded = new Set(base);
  for (const token of base) {
    const group = SYNONYM_GROUPS.find((items) =>
      (items as readonly string[]).includes(token)
      || (token.length >= 4 && items.some((item) => Math.abs(item.length - token.length) <= 1 && editDistance(token, item) <= 1)),
    );
    group?.forEach((item) => expanded.add(item));
  }
  return { base, expanded: [...expanded] };
}

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

function tokenScore(token: string, words: string[], text: string) {
  if (words.includes(token)) return 32;
  if (token.length >= 3 && words.some((word) => word.startsWith(token) || (word.length >= 4 && token.startsWith(word)))) return 22;
  if (token.length >= 3 && text.includes(token)) return 14;
  if (token.length >= 4 && words.some((word) => Math.abs(word.length - token.length) <= 2 && editDistance(token, word) <= (token.length >= 7 ? 2 : 1))) return 11;
  return 0;
}

export function rankProducts(products: SearchableProduct[], query: string) {
  const phrase = normalizeSearchText(query);
  const { base, expanded } = expandedTokens(query);
  if (!phrase || base.length === 0) return products;

  return products
    .map((product) => {
      const name = normalizeSearchText(product.name || "");
      const brand = normalizeSearchText(product.brand || "");
      const category = normalizeSearchText(product.category || "");
      const tags = normalizeSearchText((product.tags || []).join(" "));
      const description = normalizeSearchText(product.description || "");
      const nameWords = tokenize(name);
      const catalogueWords = tokenize(`${name} ${brand} ${category} ${tags}`);
      let score = 0;

      if (name === phrase) score += 220;
      else if (name.startsWith(phrase)) score += 150;
      else if (name.includes(phrase)) score += 110;
      if (brand === phrase) score += 130;
      else if (brand.includes(phrase)) score += 75;
      if (category.includes(phrase)) score += 55;
      if (tags.includes(phrase)) score += 48;
      if (description.includes(phrase)) score += 16;

      let coveredBaseTokens = 0;
      for (const token of base) {
        const direct = tokenScore(token, nameWords, name) * 2
          + tokenScore(token, catalogueWords, `${name} ${brand} ${category} ${tags}`)
          + Math.min(8, tokenScore(token, tokenize(description), description));
        if (direct > 0) coveredBaseTokens += 1;
        score += direct;
      }

      for (const token of expanded.filter((token) => !base.includes(token))) {
        score += Math.min(16, tokenScore(token, catalogueWords, `${name} ${brand} ${category} ${tags}`));
      }

      if (coveredBaseTokens === base.length) score += 35;
      else if (base.length > 1) score = 0;
      if (score > 0 && (product.stock ?? 0) > 0) score += 5;
      if (score > 0 && product.featured) score += 3;
      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.product.featured)) - Number(Boolean(a.product.featured)))
    .map(({ product }) => product);
}

export function recommendedProducts(products: SearchableProduct[]) {
  return [...products].sort((a, b) => {
    const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featured) return featured;
    const inStock = Number((b.stock ?? 0) > 0) - Number((a.stock ?? 0) > 0);
    if (inStock) return inStock;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}
