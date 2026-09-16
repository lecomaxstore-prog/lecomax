import { colorSizeStockFromTags, sizeStockFromTags, syncColorSizeStockTags, syncSizeInventoryTags } from './product-inventory.ts';

/** Copy merchandising, never identity, inventory ownership or publication. */
export function productDuplicate(source: Record<string, unknown>, suffix: string) {
  if (!/^[a-f0-9]{8,32}$/.test(suffix)) throw new Error('INVALID_DUPLICATE_ID');
  const copy: Record<string, unknown> = {};
  for (const key of ['brand','category','price','original_price','description','description_images','images','video','colors','sizes','weight']) {
    if (source[key] !== undefined) copy[key] = structuredClone(source[key]);
  }
  const tags = (Array.isArray(source.tags) ? source.tags : []).filter((tag): tag is string => typeof tag === 'string' && !/^__(?:sku|barcode|oos):/.test(tag));
  const sizes = sizeStockFromTags(tags);
  const variants = colorSizeStockFromTags(tags);
  const guide = tags.find(tag => tag.startsWith('__guide:'))?.slice(8);
  const guideType = guide === 'shoes' || guide === 'clothing' || guide === 'custom' ? guide : 'none';
  let copiedTags = syncSizeInventoryTags(tags, guideType, Object.fromEntries(Object.keys(sizes).map(size => [size, 0])));
  copiedTags = syncColorSizeStockTags(copiedTags, Object.fromEntries(Object.entries(variants).map(([color,row]) => [color,Object.fromEntries(Object.keys(row).map(size => [size,0]))])));
  return { ...copy, name: `${String(source.name ?? 'Produit').slice(0,230)} (copie)`, slug: `${String(source.slug ?? 'produit').slice(0,100)}-copie-${suffix}`,
    tags: copiedTags, active: false, featured: false, stock: 0,
    color_stock: Object.fromEntries((Array.isArray(source.colors) ? source.colors : []).map(color => [String(color),0])),
    preorder_enabled: false, preorder_estimated_at: null, preorder_message: null };
}
