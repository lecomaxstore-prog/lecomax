import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { STORE_SETTING_DEFAULTS } from '../lib/store-settings.ts';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const fixture = { id: 'entry-1', question: 'Delivery time?', answer: 'Two days.', category: 'livraison', language: 'en', active: true, sort_order: 0, created_at: '2026-10-04' };

async function mount(path: string, fetcher: (...args: any[]) => Promise<any>, environment: Record<string, unknown> = {}) {
  const values: any[] = []; let cursor = 0; let effects: (() => void)[] = []; let tree: any;
  const module = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, fetch: fetcher, AbortSignal, AbortController, confirm: () => true, setTimeout: () => 1,
    ...environment,
    require(name: string) {
      if (name === 'react') return {
        useState(initial: any) { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], (value: any) => { values[i] = typeof value === 'function' ? value(values[i]) : value; }]; },
        useRef(initial: any) { const i = cursor++; return values[i] ??= { current: initial }; },
        useEffect(effect: () => void, deps: any[]) { const i = cursor++; if (!values[i] || deps.some((value, j) => value !== values[i][j])) { values[i] = deps; effects.push(effect); } },
      };
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '@/lib/store-settings') return { STORE_SETTING_DEFAULTS };
      if (name.endsWith('.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
      if (name.includes('AdminLoading')) return { default: () => null };
      throw Error(name);
    },
  });
  function render() { cursor = 0; tree = module.exports.default(); const pending = effects; effects = []; pending.forEach(fn => fn()); }
  function walk(node: any): any[] { if (Array.isArray(node)) return node.flatMap(walk); return node?.props ? [node, ...walk(node.props.children)] : []; }
  function text(node: any): string { if (Array.isArray(node)) return node.map(text).join(''); return node?.props ? text(node.props.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : ''; }
  function all() { return walk(tree); }
  async function settle() { await new Promise(resolve => setImmediate(resolve)); render(); }
  async function click(label: string) { const node = all().find(node => node.type === 'button' && text(node) === label) ?? all().find(node => node.type === 'button' && (node.props['aria-label']?.includes(label) || text(node).includes(label))); assert.ok(node, label); assert.ok(!node.props.disabled, `${label} disabled`); await node.props.onClick(); await settle(); }
  render(); await settle();
  return { all, text: () => text(tree), render, settle, click };
}
const response = (body: any, ok = true) => Promise.resolve({ ok, json: async () => body });

test('knowledge base reports initial failure and can retry without pretending the list is empty', async () => {
  let failed = true;
  const ui = await mount('app/admin/chat-kb/page.tsx', () => failed ? Promise.reject(Error('Offline')) : response([fixture]));
  assert.ok(ui.all().some(node => node.props.role === 'alert'));
  assert.ok(!ui.text().includes('Aucune réponse configurée'));
  failed = false; await ui.click('Réessayer');
  assert.ok(ui.text().includes('Delivery time?'));
});
test('failed switch and delete requests preserve the entry and show an error; successful switch updates it', async () => {
  let succeeds = false;
  const ui = await mount('app/admin/chat-kb/page.tsx', (_url, init) => !init?.method ? response([fixture]) : response({}, succeeds));
  await ui.click('Désactiver');
  assert.equal(ui.all().find(node => node.props.role === 'switch').props['aria-checked'], true);
  assert.ok(ui.text().includes('Modification non confirmée'));
  await ui.click('Supprimer :');
  assert.ok(ui.text().includes('Delivery time?'));
  assert.ok(ui.text().includes('Suppression non confirmée'));
  succeeds = true; await ui.click('Désactiver');
  assert.equal(ui.all().find(node => node.props.role === 'switch').props['aria-checked'], false);
});
test('rapid repeated switches issue one mutation and release controls when the request settles', async () => {
  let resolveRequest: (value: any) => void = () => {}; let mutations = 0;
  const ui = await mount('app/admin/chat-kb/page.tsx', (_url, init) => !init?.method ? response([fixture]) : (mutations++, new Promise(resolve => { resolveRequest = resolve; })));
  const toggle = ui.all().find(node => node.props.role === 'switch');
  const pending = toggle.props.onClick(); toggle.props.onClick(); ui.render();
  assert.equal(mutations, 1);
  assert.equal(ui.all().find(node => node.props.role === 'switch').props.disabled, true);
  resolveRequest({ ok: true }); await pending; await ui.settle();
  assert.equal(ui.all().find(node => node.props.role === 'switch').props.disabled, false);
});
test('a rejected save keeps the editor and entered text available', async () => {
  const ui = await mount('app/admin/chat-kb/page.tsx', (_url, init) => !init?.method ? response([fixture]) : Promise.reject(Error('Offline')));
  await ui.click('Ajouter une réponse');
  ui.all().find(node => node.type === 'input' && node.props.placeholder?.includes('Ex: Quel')).props.onChange({ target: { value: 'My question' } });
  ui.all().find(node => node.type === 'textarea').props.onChange({ target: { value: 'My answer' } }); ui.render();
  await ui.click('Ajouter');
  assert.ok(ui.text().includes('Sauvegarde non confirmée'));
  assert.equal(ui.all().find(node => node.type === 'textarea').props.value, 'My answer');
});
test('history retry reloads the requested page after a failed fetch', async () => {
  let failed = true;
  const ui = await mount('app/admin/activity/page.tsx', () => failed ? Promise.reject(Error('Offline')) : response({ items: [], hasMore: false }));
  assert.ok(ui.text().includes('indisponible'));
  failed = false; await ui.click('Réessayer'); await ui.settle();
  assert.ok(ui.text().includes('Aucune modification enregistrée'));
});
test('offline notice appears without reloading the page and disappears after reconnecting', async () => {
  const navigator = { onLine: false }; const listeners: Record<string, () => void> = {};
  const ui = await mount('components/admin/AdminConnectionNotice.tsx', () => response([]), { navigator, window: { addEventListener(name: string, callback: () => void) { listeners[name] = callback; }, removeEventListener(name: string) { delete listeners[name]; } } });
  assert.ok(ui.text().includes('hors ligne'));
  navigator.onLine = true; listeners.online(); ui.render();
  assert.equal(ui.text(), '');
  navigator.onLine = false; listeners.offline(); ui.render();
  assert.ok(ui.text().includes('Gardez cette page ouverte'));
});
