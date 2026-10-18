import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
function load(file: string, dependencies: Record<string, unknown> = {}) {
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports, URL, require: (name: string) => dependencies[name] ?? require(name) });
  return exports;
}

test('hero emits one image with viewport-specific sources and preload hints', () => {
  const calls: any[] = [];
  const { default: Hero, canOptimizeHero, resolveHeroSource } = load('../components/ResponsiveHeroImage.tsx', {
    'next/image': { getImageProps: (props: any) => {
      calls.push(props);
      return { props: { src: props.src, srcSet: props.unoptimized ? undefined : `${props.src}?w=640 640w, ${props.src}?w=1080 1080w`, sizes: props.sizes } };
    } },
  });
  const html = renderToStaticMarkup(React.createElement(Hero, { desktop: '/desktop.jpg', mobile: '/mobile.jpg', priority: true }));
  assert.equal((html.match(/<img /g) ?? []).length, 1);
  assert.equal((html.match(/rel="preload"/g) ?? []).length, 2, 'preloads are limited to the two mutually exclusive media queries');
  assert.match(html, /<picture><source media="\(min-width: 768px\)"/);
  assert.match(html, /media="\(max-width: 767px\)"/);
  assert.match(html, /fetchPriority="high"/);
  assert.ok(calls.every(p => p.unoptimized === false && p.quality === 75));
  assert.equal(canOptimizeHero('https://test.supabase.co/storage/image.jpg'), true);
  assert.equal(canOptimizeHero('https://unknown.example/banner.jpg'), false);
  assert.equal(canOptimizeHero('https://supabase.co.evil.example/banner.jpg'), false);
  assert.equal(resolveHeroSource('/images/hero%20secrtion/hero%20section%20mobile%20version.png'), '/images/hero-mobile-v2.webp');
  assert.equal(resolveHeroSource('/images/hero secrtion/hero section web version.png'), '/images/hero-desktop-v2.webp');
  assert.equal(resolveHeroSource('https://unknown.example/custom.jpg'), 'https://unknown.example/custom.jpg');
  const other = renderToStaticMarkup(React.createElement(Hero, { desktop: 'https://unknown.example/d.jpg', mobile: 'https://unknown.example/m.jpg', priority: false }));
  assert.match(other, /srcSet="https:\/\/unknown.example\/d.jpg"/);
  assert.doesNotMatch(other, /rel="preload"/);
});

test('optimized hero retries originals after an image error', () => {
  let original = false;
  const { default: Hero } = load('../components/ResponsiveHeroImage.tsx', {
    react: { useState: () => [original, (value: boolean) => { original = value; }] },
    'next/image': { getImageProps: (props: any) => ({ props: { src: props.src, srcSet: props.unoptimized ? undefined : 'optimized 640w' } }) },
  });
  const render = () => Hero({ desktop: '/desktop.jpg', mobile: '/mobile.jpg', priority: false });
  const img = render().props.children[1].props.children[1];
  assert.equal(img.props.srcSet, 'optimized 640w');
  img.props.onError();
  assert.equal(render().props.children[1].props.children[1].props.srcSet, undefined);
});

test('scroll reveal HTML is visible before JavaScript, and catalogue has no visibility gate', () => {
  const { default: Reveal } = load('../components/ScrollReveal.tsx');
  const html = renderToStaticMarkup(React.createElement(Reveal, {}, 'Visible product'));
  assert.match(html, /Visible product/);
  assert.doesNotMatch(html, /sr-pending/);
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.match(css, /\.sr\s*\{\s*opacity: 1;/);
  const grid = readFileSync(new URL('../components/OurProductsGrid.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(grid, /opacity: visible|useInView/);
});

test('optional homepage reads start before the catalogue resolves and have deadlines', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && ['getHeroBanners', 'getLatestPost', 'HomePage'].includes(node.name?.text ?? '')).map(node => node.getText(ast)).join('\n');
  const requests: { url: string; options: any }[] = [];
  const deadlines: number[] = [];
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(functions + '\nexport {getHeroBanners, getLatestPost};', {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, require, URLSearchParams,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' } },
    AbortSignal: { timeout: (ms: number) => { deadlines.push(ms); return { deadline: ms }; } },
    ECOMEDIA_COMMUNITY_AUTHOR_PREFIX: 'community:',
    supabaseServiceHeaders: () => ({}),
    getDbProducts: () => new Promise(() => {}),
    getReviewStats: async () => ({}), getHeroImages: async () => ({}),
    fetch: async (url: string, options: any) => { requests.push({url, options}); return {ok: true, json: async () => []}; },
  });
  void exports.default();
  assert.equal(requests.length, 2, 'banner and post requests start even while catalogue is pending');
  assert.ok(requests.some(r => r.url.includes('/ecomedia_posts?')));
  assert.deepEqual(deadlines, [1800, 1800]);
  assert.ok(requests.every(r => r.options.next.revalidate === 300));
});

test('default hero assets decode correctly and stay below 200 KB each', async () => {
  const sharp = require('sharp');
  for (const name of ['desktop', 'mobile']) {
    const data = readFileSync(new URL(`../public/images/hero-${name}-v2.webp`, import.meta.url));
    assert.ok(data.length < 200_000);
    const metadata = await sharp(data).metadata();
    assert.equal(metadata.format, 'webp');
    assert.ok(metadata.width > 600 && metadata.height > 600);
  }
});

test('storefront header ships no hidden menu images or closed search overlay', () => {
  const box = ({ children }: any) => React.createElement('div', {}, children);
  const { default: Header } = load('../components/Header.tsx', {
    '@/lib/use-store-refresh': { useStoreRefresh() {} },
    'next/link': { default: ({ children, href }: any) => React.createElement('a', { href }, children), __esModule: true },
    'next/dynamic': { default: () => () => React.createElement('div', {}, 'SEARCH_LOADED'), __esModule: true },
    './CartContext': { useCart: () => ({ count: 0 }) },
    './WishlistContext': { useWishlist: () => ({ count: 0 }) },
    './Logo': { default: box, __esModule: true },
    '@/lib/products': { categories: [{ slug: 'homme', label: 'Homme' }] },
    '@/lib/supabase': { supabase: {} },
    '@/lib/use-settings': { useSettings: () => ({}) },
  });
  const html = renderToStaticMarkup(React.createElement(Header));
  assert.doesNotMatch(html, /<img|SEARCH_LOADED/);
  assert.match(html, /href="\/homme"/);
  assert.match(html, /href="\/promotions"/);
});

test('product rails stay visible before hydration and no longer queue reveal timers', () => {
  const { default: Rail } = load('../components/ProductRail.tsx', {
    'next/link': { default: ({ children }: any) => React.createElement('a', {}, children), __esModule: true },
    './ProductCard': { default: ({ product }: any) => React.createElement('div', {}, product.name), __esModule: true },
    './CollectionProductCard': { default: ({ product }: any) => React.createElement('div', {}, product.name), __esModule: true },
    './ProductRail.module.css': { default: {}, __esModule: true },
  });
  const html = renderToStaticMarkup(React.createElement(Rail, { title: 'Collection', products: [{ slug: 'example', name: 'Visible product' }] }));
  assert.match(html, /Visible product/);
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  assert.match(css, /\.card-sr\s*\{\s*opacity: 1;/);
  assert.doesNotMatch(readFileSync(new URL('../components/ProductRail.tsx', import.meta.url), 'utf8'), /setTimeout|IntersectionObserver/);
});

test('optional work starts once near the viewport and is cancelled when unmounted', () => {
  let callback: any, disconnected = 0, started = 0;
  const exports: any = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/when-near-viewport.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, IntersectionObserver: class {
      constructor(fn: any) { callback = fn; } observe() {} disconnect() { disconnected++; }
    },
  });
  const stop = exports.whenNearViewport({}, () => started++);
  assert.equal(started, 0); callback([{ isIntersecting: false }]); assert.equal(started, 0);
  callback([{ isIntersecting: true }]); callback([{ isIntersecting: true }]);
  assert.equal(started, 1); assert.equal(disconnected, 1); stop();
  const cancel = exports.whenNearViewport({}, () => started++); cancel(); callback([{ isIntersecting: true }]); assert.equal(started, 1);
});

test('boutique polling refreshes client data without requesting its server shell again', () => {
  const { needsStorefrontServerRefresh } = load('../lib/storefront-refresh.ts');
  assert.equal(needsStorefrontServerRefresh('/boutique/'), false);
  assert.equal(needsStorefrontServerRefresh('/'), true);
  assert.equal(needsStorefrontServerRefresh('/produit/example'), true);
});
