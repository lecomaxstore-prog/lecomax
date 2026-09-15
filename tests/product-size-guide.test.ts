import test from 'node:test';
import assert from 'node:assert/strict';
import { addProductGuideSizes, productGuideRows, productSizeGuideFromTags, validateProductSizeGuide, withProductSizeGuide, PRODUCT_SIZE_GUIDE_PREFIX, type ProductSizeGuide } from '../mobile/src/lib/product-size-guide.ts';

const guide: ProductSizeGuide = {
  title: 'Pointures Sony', columns: ['EU', 'US', 'UK', 'CM'],
  rows: [['44', '10', '9', '28.0'], ['44.5', '', '9.5', '28.5']], note: 'Mesures du fabricant',
};

test('product guide survives save, reload, edit and removal without changing inventory metadata', () => {
  const inventory = ['__sstock:44:2', '__sstock:44.5:0', '__guide:shoes'];
  const saved = withProductSizeGuide(inventory, guide);
  assert.deepEqual(productSizeGuideFromTags(JSON.parse(JSON.stringify(saved))), guide);
  const edited = { ...guide, rows: [['44.5', '10.5', '9.5', '28.7']] } as ProductSizeGuide;
  const updated = withProductSizeGuide(saved, edited);
  assert.deepEqual(productSizeGuideFromTags(updated), edited);
  assert.equal(updated.filter(tag => tag.startsWith(PRODUCT_SIZE_GUIDE_PREFIX)).length, 1);
  assert.deepEqual(withProductSizeGuide(updated, null), inventory);
});

test('custom app table preserves exact rows, decimal labels and blank measurements', () => {
  assert.deepEqual(productGuideRows(guide), [
    { size: '44', values: ['10', '9', '28.0'] },
    { size: '44.5', values: ['—', '9.5', '28.5'] },
  ]);
  assert.equal(productGuideRows(guide).length, 2);
});

test('adding product sizes keeps existing measurements and avoids equivalent decimal duplicates', () => {
  const result = addProductGuideSizes(guide, ['44', '44,5', '45', '46']);
  assert.deepEqual(result.rows, [...guide.rows, ['45', '', '', ''], ['46', '', '', '']]);
  assert.equal(guide.rows.length, 2);
});

test('invalid, duplicated, oversized and malformed guide data cannot be saved', () => {
  for (const invalid of [
    { ...guide, title: '' }, { ...guide, columns: ['EU'] }, { ...guide, rows: [] },
    { ...guide, rows: [['', '', '', '']] },
    { ...guide, rows: [['44.5', '', '', ''], ['44,5', '', '', '']] },
    { ...guide, rows: Array.from({ length: 51 }, (_, i) => [String(i), '', '', '']) },
    { ...guide, rows: [['44', 10, '9', '28']] },
  ]) {
    assert.equal(validateProductSizeGuide(invalid), null);
    assert.throws(() => withProductSizeGuide([], invalid as ProductSizeGuide));
  }
  assert.equal(productSizeGuideFromTags(['__sizeguide:{broken']), null);
  assert.equal(productSizeGuideFromTags(null), null);
});
