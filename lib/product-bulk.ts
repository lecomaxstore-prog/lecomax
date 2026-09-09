import { asStock, colorSizeStockFromTags, colorSizeStockTotal, colorTotalsFromColorSizeStock, sizeStockFromTags, sizeTotalsFromColorSizeStock, syncColorSizeStockTags, syncOutOfStockTags, colorStockTotal, sizeStockTotal } from './product-inventory.ts';
import { colorPricesFromTags, colorPriceTags } from './product-variant-pricing.ts';

export const BULK_LIMIT = 25;
export const BULK_ACTIONS = ['publish', 'unpublish', 'archive', 'category', 'promotion', 'stock', 'delete'] as const;
export type BulkAction = typeof BULK_ACTIONS[number];
export type BulkInput = { ids: string[]; action: BulkAction; confirmation: string; value?: number | string; color?: string; size?: string };
export type BulkProduct = { id: string; name: string; slug: string; active: boolean; category: string; price: number; original_price: number | null; stock: number; colors: string[] | null; sizes: string[] | null; color_stock: Record<string, number> | null; tags: string[] | null };

export function parseBulkInput(body: unknown): BulkInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Requête invalide.');
  const input = body as Record<string, unknown>;
  const ids = input.ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > BULK_LIMIT || ids.some(id => typeof id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) || new Set(ids).size !== ids.length) throw new Error(`Sélectionnez entre 1 et ${BULK_LIMIT} produits distincts.`);
  if (!BULK_ACTIONS.includes(input.action as BulkAction)) throw new Error('Action invalide.');
  if (input.confirmation !== `${input.action}:${ids.length}`) throw new Error('Confirmation requise pour cette sélection.');
  if (input.action === 'promotion' && (typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value <= 0 || input.value >= 100)) throw new Error('Réduction attendue entre 0 et 100 %, bornes exclues.');
  if (input.action === 'stock' && (typeof input.value !== 'number' || !Number.isInteger(input.value) || input.value === 0 || Math.abs(input.value) > 1_000_000)) throw new Error('Ajustement de stock entier non nul requis.');
  if (input.action === 'category' && !['homme', 'femme', 'chaussures', 'accessoires'].includes(String(input.value))) throw new Error('Catégorie invalide.');
  for (const key of ['color', 'size']) if (input[key] !== undefined && (typeof input[key] !== 'string' || String(input[key]).length > 80)) throw new Error('Option invalide.');
  return input as BulkInput;
}

/** Compute only on the server's current row; the database compares that row under lock. */
export function bulkProductPatch(product: BulkProduct, input: BulkInput): Record<string, unknown> {
  const tags = [...(product.tags ?? [])];
  switch (input.action) {
    case 'delete': return {};
    case 'publish': return { active: true, tags: tags.filter(tag => tag !== '__archived') };
    case 'unpublish': return { active: false };
    case 'archive': return { active: false, tags: [...tags.filter(tag => tag !== '__archived'), '__archived'] };
    case 'category': return { category: input.value };
    case 'promotion': {
      // Base discounts on the reference price so retries cannot compound a promotion.
      const discounted = (price: number) => Math.round(price * (1 - Number(input.value) / 100) * 100) / 100;
      const reference = Math.max(product.price, product.original_price ?? 0);
      const prices = colorPricesFromTags(tags);
      for (const [color, value] of Object.entries(prices)) {
        const originalPrice = Math.max(value.price, value.originalPrice ?? 0);
        prices[color] = { price: discounted(originalPrice), originalPrice };
      }
      return { price: discounted(reference), original_price: reference, tags: [...tags.filter(tag => !tag.startsWith('__cprice:')), ...colorPriceTags(prices)] };
    }
    case 'stock': {
      const adjusted = (quantity: number) => {
        const next = asStock(quantity + Number(input.value));
        if (next === null) throw new Error('Cet ajustement produirait un stock négatif ou excessif.');
        return next;
      };
      const matrix = colorSizeStockFromTags(tags);
      let sizes = sizeStockFromTags(tags);
      let colors = { ...(product.color_stock ?? {}) };
      let stock: number;
      let nextTags = tags;
      if (Object.keys(matrix).length) {
        if (!input.color || !input.size || !Object.hasOwn(matrix, input.color) || !Object.hasOwn(matrix[input.color], input.size)) throw new Error('Choisissez une combinaison couleur / taille existante.');
        matrix[input.color][input.size] = adjusted(matrix[input.color][input.size]);
        colors = colorTotalsFromColorSizeStock(matrix);
        sizes = sizeTotalsFromColorSizeStock(matrix);
        stock = colorSizeStockTotal(matrix);
        nextTags = syncColorSizeStockTags(tags, matrix);
      } else if (Object.keys(sizes).length && Object.keys(colors).length) {
        throw new Error('Générez la matrice couleur / taille avant cet ajustement.');
      } else if (Object.keys(sizes).length) {
        if (!input.size || input.color || !Object.hasOwn(sizes, input.size)) throw new Error('Choisissez une taille existante.');
        sizes[input.size] = adjusted(sizes[input.size]); stock = sizeStockTotal(sizes);
      } else if (Object.keys(colors).length) {
        if (!input.color || input.size || !Object.hasOwn(colors, input.color)) throw new Error('Choisissez une couleur existante.');
        colors[input.color] = adjusted(colors[input.color]); stock = colorStockTotal(colors);
      } else {
        if (input.color || input.size || product.colors?.length || product.sizes?.length) throw new Error('Configurez le stock des variantes dans le produit.');
        stock = adjusted(product.stock);
      }
      if (asStock(stock) === null) throw new Error('Stock total excessif.');
      if (Object.keys(sizes).length) nextTags = [...nextTags.filter(tag => !tag.startsWith('__sstock:')), ...Object.entries(sizes).map(([size, quantity]) => `__sstock:${size}:${quantity}`)];
      return { stock, color_stock: Object.keys(colors).length ? colors : product.color_stock, tags: syncOutOfStockTags(nextTags, colors) };
    }
  }
}
