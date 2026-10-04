import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');

function load(file: string, environment: Record<string, unknown> = {}) {
  const module = { exports: {} as any };
  runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, ...environment,
    require(name: string) {
      if (name.endsWith('.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
      if (name === 'react' && environment.react) return environment.react;
      return require(name);
    },
  });
  return module.exports.default;
}

test('mobile switch preserves the action and exposes checked, busy and disabled states', () => {
  const Toggle = load('components/admin/AdminToggle.tsx');
  let calls = 0; const handler = () => calls++;
  const button = Toggle({ checked: true, label: 'Publication', tone: 'green', onClick: handler });
  assert.equal(button.type, 'button');
  assert.equal(button.props.type, 'button');
  assert.equal(button.props.role, 'switch');
  assert.equal(button.props['aria-label'], 'Publication');
  assert.equal(button.props['aria-checked'], true);
  button.props.onClick(); assert.equal(calls, 1);
  assert.equal(button.props.children.props['data-tone'], 'green');
  const busy = Toggle({ checked: false, label: 'Publication', busy: true, onClick: handler });
  assert.equal(busy.props.disabled, true);
  assert.equal(busy.props['aria-busy'], true);
  assert.equal(busy.props['aria-checked'], false);
  assert.equal(Toggle({ checked: true, label: 'Publication', disabled: true }).props.disabled, true);
});

test('visible viewport tracks keyboard changes and removes listeners and styles on unmount', () => {
  const values = new Map<string, string>(); const listeners = new Map<string, () => void>();
  let cleanup: (() => void) | undefined;
  const viewport = { height: 844, offsetTop: 0, addEventListener(name: string, fn: () => void) { listeners.set(name, fn); }, removeEventListener(name: string) { listeners.delete(name); } };
  const Component = load('components/admin/AdminMobileViewport.tsx', {
    react: { useEffect(fn: () => (() => void)) { cleanup = fn(); } },
    window: { visualViewport: viewport },
    document: { documentElement: { style: { setProperty(name: string, value: string) { values.set(name, value); }, removeProperty(name: string) { values.delete(name); } } } },
  });
  assert.equal(Component(), null);
  assert.equal(values.get('--admin-visible-height'), '844px');
  viewport.height = 346.4; viewport.offsetTop = 91.6; listeners.get('resize')!();
  assert.equal(values.get('--admin-visible-height'), '346px');
  assert.equal(values.get('--admin-visible-top'), '92px');
  viewport.offsetTop = -2; listeners.get('scroll')!();
  assert.equal(values.get('--admin-visible-top'), '0px');
  cleanup!(); assert.equal(listeners.size, 0); assert.equal(values.size, 0);
});

test('browsers without VisualViewport keep CSS viewport fallbacks', () => {
  const Component = load('components/admin/AdminMobileViewport.tsx', { react: { useEffect(fn: () => void) { fn(); } }, window: {} });
  assert.equal(Component(), null);
});
