import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(file: string, overrides: Record<string, unknown>): any {
  const filename = path.resolve(file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  const require = (id: string): any => {
    if (id in overrides) return overrides[id];
    if (id === "server-only") return {};
    if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), id + ".ts"), overrides);
    return nativeRequire(id);
  };
  new Function("require", "module", "exports", "fetch", compiled)(require, module, module.exports, overrides.fetch ?? fetch);
  return module.exports;
}
const valid = { name: 'Sac de sport 30 L', description: 'Sac de sport de 30 litres en polyester. Une poche permet de séparer les chaussures.', tags: ['sac de sport', '30 litres', 'polyester'] };
function route(reply: unknown = valid, status = 0, failure = false) {
  let calls = 0;
  const handler = load('app/api/admin/products/write/route.ts', {
    '@/lib/api-security': { protectAdminMutation: async () => status ? Response.json({}, { status }) : null },
    '@/lib/request-body': { readJsonLimited: (req: Request) => req.json() },
    '@/lib/openai-server': {
      generateOpenAIReply: async (request: any) => { assert.match(request.messages[0].content, /JSON/); calls++; if (failure) throw new Error('secret provider detail'); return JSON.stringify(reply); },
      openAIErrorCode: () => 'AI_UNAVAILABLE',
    },
  });
  return { ...handler, calls: () => calls };
}
const request = (body: unknown) => new Request('http://localhost/api/admin/products/write', { method: 'POST', body: JSON.stringify(body) });
const input = { facts: 'Sac de sport en polyester, 30 litres, poche chaussures.', tone: 'professional' };
test('generates a draft with only the three editable fields', async () => {
  const r = route({ ...valid, price: 999 });
  const response = await r.POST(request(input));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ...valid, tags: valid.tags.join(', ') });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
test('authorization and rate limits block provider calls', async () => {
  for (const status of [401, 403, 429]) {
    const r = route(valid, status);
    assert.equal((await r.POST(request(input))).status, status);
    assert.equal(r.calls(), 0);
  }
});
test('rejects invalid, empty and oversized facts before generation', async () => {
  for (const body of [null, [], {}, { ...input, facts: 'short' }, { ...input, facts: 42 }, { ...input, facts: 'a'.repeat(8001) }, { ...input, tone: 'invent claims' }]) {
    const r = route(); assert.equal((await r.POST(request(body))).status, 400); assert.equal(r.calls(), 0);
  }
});
test('rejects malformed output, HTML, internal metadata tags and provider failures', async () => {
  for (const value of [null, {}, { ...valid, description: '<script>alert(1)</script>' }, { ...valid, tags: ['__sstock:M:999'] }, { ...valid, tags: [''] }, { ...valid, name: 'a'.repeat(121) }, { ...valid, tags: 'not an array' }]) {
    assert.equal((await route(value).POST(request(input))).status, 503);
  }
  const response = await route(valid, 0, true).POST(request(input));
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes('secret provider'));
});
function writingPanel(fail = false) {
  const states: any[] = []; let cursor = 0; const patches: unknown[] = [];
  const react = { useEffect: () => {}, useRef: () => ({ current: null }), useState: (initial: any) => {
    const id = cursor++; if (!(id in states)) states[id] = initial;
    return [states[id], (value: any) => { states[id] = value; }];
  } };
  const component = load('components/admin/ProductWritingAssistant.tsx', {
    react,
    fetch: async () => fail ? Response.json({ error: 'Service indisponible' }, { status: 503 }) : Response.json({ ...valid, tags: valid.tags.join(', ') }),
  }).default;
  const render = () => { cursor = 0; return component({ context: input.facts, onApply: (patch: unknown) => patches.push(patch) }); };
  const nodes = (root: any): any[] => root && typeof root === 'object' ? [root, ...[root.props?.children].flat(Infinity).flatMap(nodes)] : [];
  return { render, nodes, patches };
}
test('preview does not change the form until a field is explicitly applied', async () => {
  const panel = writingPanel();
  let nodes = panel.nodes(panel.render());
  await nodes.find(node => node.type === 'button' && node.props.children === 'Générer ma fiche').props.onClick();
  assert.equal(panel.patches.length, 0);
  nodes = panel.nodes(panel.render());
  const descriptionButton = nodes.find(node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children.includes('cette description'));
  assert.ok(descriptionButton);
  descriptionButton.props.onClick();
  assert.deepEqual(panel.patches, [{ description: valid.description }]);
});
test('failed generation displays an error and leaves product data untouched', async () => {
  const panel = writingPanel(true);
  await panel.nodes(panel.render()).find(node => node.type === 'button').props.onClick();
  const alert = panel.nodes(panel.render()).find(node => node.props?.role === 'alert');
  assert.equal(alert.props.children, 'Service indisponible');
  assert.equal(panel.patches.length, 0);
});
test('live OpenAI product draft from synthetic facts', { skip: process.env.TEST_PRODUCT_WRITING_LIVE !== '1' }, async () => {
  nativeRequire('@next/env').loadEnvConfig(process.cwd());
  const handler = load('app/api/admin/products/write/route.ts', {
    '@/lib/api-security': { protectAdminMutation: async () => null },
    '@/lib/request-body': { readJsonLimited: (req: Request) => req.json() },
    '@/lib/openai-server': load('lib/openai-server.ts', {}),
  });
  const result = await handler.POST(request(input));
  assert.equal(result.status, 200, JSON.stringify(await result.clone().json()));
  const draft = await result.json();
  assert.ok(draft.description.length > 30);
  assert.match(draft.description, /30/);
});
