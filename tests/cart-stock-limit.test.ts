import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as limits from '../lib/cart-stock-limit.ts';
import * as preorder from '../mobile/src/lib/purchasability.ts';

function cart() {
  let items: any[] = [];
  let context: any;
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useCallback: (fn: any) => fn, useEffect: () => {},
    useMemo: (fn: any) => fn(), useRef: (value: any) => ({ current: value }),
    useState: (initial: any) => [initial, (next: any) => { if (Array.isArray(initial)) items = typeof next === 'function' ? next(items) : next; }],
  };
  const module = { exports: {} as any };
  const source = ts.transpileModule(readFileSync('components/CartContext.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: (name: string) => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (_: any, props: any) => { context = props.value; } };
    if (name.endsWith('/cart-stock-limit')) return limits;
    if (name.endsWith('/browser-storage')) return { safeLocalStorage: { getItem: () => null, setItem: () => true } };
    if (name.endsWith('/preorder')) return preorder;
    if (name.endsWith('/product-variant-image')) return { resolveProductVariantImage: () => 'image' };
    if (name.endsWith('/product-variant-pricing')) return {};
    if (name.endsWith('/preorder-copy')) return {};
    throw new Error(name);
  } });
  module.exports.CartProvider({ children: null });
  return { actions: context, items: () => items };
}
const product = { slug: 'test', name: 'Test', stock: 3, price: 10, gallery: [], colors: [], sizes: [] };
test('real cart caps repeated adds and direct quantity changes at three', () => {
  const c = cart();
  for (let i = 0; i < 8; i++) c.actions.add(product, '');
  assert.equal(c.items()[0].quantity, 3);
  c.actions.setQty('test', '', '', 4);
  assert.equal(c.items()[0].quantity, 3);
  c.actions.setQty('test', '', '', 2);
  assert.equal(c.items()[0].quantity, 2);
});
test('first bulk add is capped; zero stock and invalid input cannot add', () => {
  const c = cart(); c.actions.add(product, '', 10);
  assert.equal(c.items()[0].quantity, 3);
  for (const stock of [0, -1, NaN]) {
    const empty = cart(); empty.actions.add({ ...product, stock }, '');
    assert.equal(empty.items().length, 0);
  }
  for (const qty of [0, -1, NaN, 1.5]) {
    const empty = cart(); empty.actions.add(product, '', qty);
    assert.equal(empty.items().length, 0);
  }
});
test('variant stock is enforced and explicit preorders still work', () => {
  const c = cart(); c.actions.add({ ...product, sizes: ['M'], tags: ['__sstock:M:1'] }, 'M', 5);
  assert.equal(c.items()[0].quantity, 1);
  const pre = cart(); pre.actions.add({ ...product, preorder_enabled: true }, '', 4);
  assert.equal(pre.items()[0].quantity, 4);
  assert.equal(pre.items()[0].fulfillment_type, 'PREORDER');
});
