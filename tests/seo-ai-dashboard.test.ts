import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function fixture() {
  const slots: any[] = [];
  const pending: {resolve: (value: any) => void; reject: (reason: Error) => void}[] = [];
  let cursor = 0;
  let effect: (() => (() => void)) | undefined;
  const react = {
    useState(initial: any) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value: any) => { slots[index] = value; }];
    },
    useRef(initial: any) {
      const index = cursor++;
      return slots[index] ??= {current: initial};
    },
    useCallback(fn: any) { return fn; },
    useEffect(fn: any) { effect = fn; },
  };
  const jsx = (type: any, props: any, key: any) => ({type, props, key});
  const exports: any = {};
  const code = ts.transpileModule(readFileSync('app/admin/seo/SeoAiControl.tsx', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  new Function('exports', 'require', 'fetch', code)(exports, (name: string) => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return {jsx, jsxs: jsx};
    if (name === './seo.module.css') return {default: {}};
    if (name === './EditorialReview') return {default: () => null};
    throw Error(name);
  }, () => new Promise((resolve, reject) => pending.push({resolve, reject})));
  const selection = exports.default({document: undefined, onApproved() {}});
  function render() { cursor = 0; return selection.type(selection.props); }
  function nodes(node: any): any[] {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const refresh = () => nodes(render()).find(node => node.type === 'button').props.onClick();
  const text = () => JSON.stringify(render());
  const resolve = async (index: number, month: string) => {
    pending[index].resolve({ok: true, json: async () => ({month, jobs: [], monthlyLimit: 0, enabled: false})});
    await new Promise(done => setImmediate(done));
  };
  return {exports, render, refresh, text, pending, resolve, mount: () => effect!()};
}

test('AI panel state identity changes for entity, kind and document version', () => {
  const f = fixture();
  const key = (document: any) => f.exports.default({document, onApproved() {}}).key;
  const current = {kind: 'product', entity_id: '1', version: 1};
  assert.equal(key(current), key({...current}));
  for (const next of [undefined, {...current, kind: 'category'}, {...current, entity_id: '2'}, {...current, version: 2}]) {
    assert.notEqual(key(current), key(next));
  }
});

test('newest AI refresh wins and previous results disappear while loading', async () => {
  const f = fixture();
  f.refresh();
  await f.resolve(0, 'initial');
  assert.match(f.text(), /initial/);
  f.refresh();
  assert.doesNotMatch(f.text(), /initial/);
  f.refresh();
  await f.resolve(2, 'latest');
  await f.resolve(1, 'obsolete');
  assert.match(f.text(), /latest/);
  assert.doesNotMatch(f.text(), /obsolete/);
});

test('stale failures cannot erase a newer success; unmount invalidates pending responses', async () => {
  const f = fixture();
  f.refresh(); f.refresh();
  await f.resolve(1, 'latest');
  f.pending[0].reject(Error('obsolete failure'));
  await new Promise(done => setImmediate(done));
  assert.match(f.text(), /latest/);
  assert.doesNotMatch(f.text(), /obsolete failure/);
  const cleanup = f.mount();
  cleanup();
  await f.resolve(2, 'unmounted response');
  assert.doesNotMatch(f.text(), /unmounted response/);
});
