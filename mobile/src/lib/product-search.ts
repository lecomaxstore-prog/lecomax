type SearchProduct = {
  name: string;
  slug: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  colors?: string[];
  tags?: string[];
  sizes?: string[];
  sku?: string;
  barcode?: string;
  active?: boolean;
};

export function normalizeProductSearch(value: string): string {
  return value.toLocaleLowerCase("fr").replace(/œ/g, "oe")
    .normalize("NFD").replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي")
    .replace(/<[^>]*>/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim().replace(/\s+/g, " ");
}

// Keep product types distinct: a request for headphones should not return speakers.
const groups = [
  ["basket", "baskets", "sneaker", "sneakers", "chaussure", "chaussures", "shoe", "shoes", "حذاء", "احذية", "سبرديلة"],
  ["chausson", "chaussons", "pantoufle", "pantoufles", "slipper", "slippers", "شبشب", "بلغة"],
  ["tshirt", "tee", "تيشيرت"],
  ["polo", "بولـو"],
  ["veste", "jacket", "جاكيت"],
  ["sweat", "hoodie", "sweatshirt", "هودي"],
  ["pantalon", "pantalons", "pants", "trousers", "سروال"],
  ["sac", "sacs", "bag", "bags", "حقيبة", "شنطة"],
  ["backpack", "rucksack", "cartable"],
  ["banane", "waistbag", "beltbag"],
  ["valise", "suitcase", "luggage", "bagage"],
  ["ecouteur", "ecouteurs", "earbud", "earbuds", "earphone", "earphones", "headphones", "casque", "سماعات"],
  ["enceinte", "speaker", "speakers", "مكبر"],
  ["manette", "controller", "gamepad", "كونترولر"],
  ["montre", "watch", "smartwatch", "ساعة"],
  ["wireless", "لاسلكي"],
  ["running", "courir", "course", "جري"],
  ["voyage", "travel", "سفر"],
  ["homme", "hommes", "men", "man", "mens", "male", "رجال", "رجالي"],
  ["femme", "femmes", "women", "woman", "womens", "female", "نساء", "نسائي"],
  ["enfant", "enfants", "kid", "kids", "child", "اطفال"],
  ["noir", "noire", "noirs", "noires", "black", "اسود", "كحل"],
  ["blanc", "blanche", "blancs", "blanches", "white", "ابيض", "بيض"],
  ["gris", "grise", "gray", "grey", "رمادي"],
  ["bleu", "bleue", "blue", "ازرق", "زرق"],
  ["rouge", "red", "احمر", "حمر"],
  ["vert", "verte", "green", "اخضر", "خضر"],
  ["rose", "pink", "وردي"],
  ["marron", "brown", "بني"],
].map((group) => group.map(normalizeProductSearch));

const phrases = [
  ["t shirt", "tshirt"], ["tee shirt", "tshirt"],
  ["sac a dos", "backpack"], ["sacs a dos", "backpack"], ["حقيبة ظهر", "backpack"],
  ["sans fil", "wireless"], ["wire less", "wireless"],
].map(([phrase, term]) => [normalizeProductSearch(phrase), term]);
const stopWords = new Set(normalizeProductSearch(
  "je j cherche recherche recherches recherchez veux voudrais souhaite acheter trouve trouver montrez montre moi vous avez est ce que qui pour de du des le la les l un une a au aux et en d s please show me find looking for want buy the a an of with for me i is do you have to and بغيت اريد ابحث عن من فضلك في ال"
).split(" ").filter((word) => word !== "montre"));

function tokens(value: string): string[] {
  let text = ` ${normalizeProductSearch(value)} `;
  for (const [phrase, term] of phrases) text = text.split(` ${phrase} `).join(` ${term} `);
  return [...new Set(text.trim().split(/\s+/).filter(Boolean))];
}

function closeSpelling(left: string, right: string): boolean {
  // Short words and identifiers require exact/prefix matches.
  if (left.length < 4 || right.length < 4 || /\d/.test(left + right)) return false;
  const limit = left.length >= 8 ? 2 : 1;
  if (Math.abs(left.length - right.length) > limit) return false;
  const rows = Array.from({ length: left.length + 1 }, () => new Array<number>(right.length + 1));
  for (let i = 0; i <= left.length; i++) rows[i][0] = i;
  for (let j = 0; j <= right.length; j++) rows[0][j] = j;
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + Number(left[i - 1] !== right[j - 1]));
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[left.length][right.length] <= limit;
}

export function buildProductSearchIndex<T extends SearchProduct>(products: T[]) {
  return products.filter((product) => product.active !== false).map((product) => ({
    product,
    name: normalizeProductSearch(product.name),
    fields: [
      { words: tokens(`${product.name} ${product.brand ?? ""}`), weight: 6 },
      { words: tokens([product.category, product.slug, product.sku, product.barcode,
        ...(product.colors ?? []), ...(product.sizes ?? []),
        ...(product.tags ?? []).filter((tag) => !tag.startsWith("__"))].filter(Boolean).join(" ")), weight: 4 },
      { words: tokens(product.description ?? ""), weight: 1 },
    ],
  }));
}

export function searchProductIndex<T extends SearchProduct>(
  index: ReturnType<typeof buildProductSearchIndex<T>>, query: string,
): T[] {
  const phrase = normalizeProductSearch(query.slice(0, 160));
  if (!phrase) return index.map(({ product }) => product);
  const terms = tokens(phrase).filter((term) => !stopWords.has(term)).slice(0, 16);
  if (!terms.length) return [];
  const alternatives = terms.map((term) => {
    // Exact synonyms take precedence over typo expansion (e.g. femme versus ferme).
    const exact = groups.filter((group) => group.includes(term));
    const matching = exact.length ? exact : groups.filter((group) => group.some((word) => closeSpelling(term, word)));
    return new Set(matching.flat());
  });
  return index.map((entry) => {
    let score = entry.name === phrase ? 200 : entry.name.includes(phrase) ? 80 : 0;
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      let best = 0;
      for (const field of entry.fields) {
        for (const word of field.words) {
          const match = word === term ? 12
            : alternatives[i].has(word) ? 9
              : term.length >= 2 && word.startsWith(term) ? 7
                : closeSpelling(term, word) ? 5 : 0;
          best = Math.max(best, match * field.weight);
        }
      }
      // Every meaningful term must match, in any field and any order.
      if (!best) return { product: entry.product, score: 0 };
      score += best;
    }
    return { product: entry.product, score };
  }).filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ product }) => product);
}
