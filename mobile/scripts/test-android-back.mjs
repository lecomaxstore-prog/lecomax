import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const policy = loadModule('../src/lib/navigation-policy.ts');
const scenarios = [
  { name: 'product returns through native history', path: '/product/hoodie', back: true, expected: ['back'] },
  { name: 'tabs return through navigator history', path: '/cart', back: true, expected: ['back'] },
  { name: 'home with history returns to previous tab', path: '/', back: true, expected: ['back'] },
  { name: 'home without history stays open', path: '/', expected: [] },
  { name: 'direct product returns to its search origin', path: '/product/hoodie', params: { origin: 'search' }, expected: ['/search'] },
  { name: 'direct checkout returns to cart', path: '/checkout', expected: ['/cart'] },
  { name: 'direct tab returns home', path: '/cart', expected: ['/'] },
  { name: 'keyboard closes before navigation', path: '/search', back: true, keyboard: true, expected: ['keyboard'] },
  { name: 'focused sheet closes before navigation', path: '/catalog', back: true, intercept: true, expected: ['sheet'] },
  { name: 'iOS has no Android listener', path: '/', platform: 'ios', expected: [] },
];

for (const scenario of scenarios) {
  const calls = [];
  let listener;
  let cleanup;
  let removed = false;
  const controller = loadModule('../src/components/android-back-controller.tsx', {
    react: { useCallback: (fn) => fn, useEffect: (fn) => { cleanup = fn(); } },
    'expo-router': {
      usePathname: () => scenario.path,
      useGlobalSearchParams: () => scenario.params ?? {},
      useFocusEffect: (fn) => fn(),
      router: { canGoBack: () => !!scenario.back, back: () => calls.push('back'), replace: (path) => calls.push(path) },
    },
    'react-native': {
      Platform: { OS: scenario.platform ?? 'android' },
      Keyboard: { isVisible: () => !!scenario.keyboard, dismiss: () => calls.push('keyboard') },
      BackHandler: {
        addEventListener: (event, fn) => {
          assert.equal(event, 'hardwareBackPress');
          listener = fn;
          return { remove: () => { removed = true; } };
        },
        exitApp: () => assert.fail('Back must never exit the app'),
      },
    },
    '@/lib/navigation-policy': policy,
  });
  if (scenario.intercept) controller.useAndroidBackInterceptor(() => { calls.push('sheet'); return true; });
  controller.AndroidBackController();
  if (scenario.platform === 'ios') assert.equal(listener, undefined);
  else {
    assert.equal(listener(), true, scenario.name);
    cleanup();
    assert.equal(removed, true);
  }
  assert.deepEqual(calls, scenario.expected, scenario.name);
}
console.log(`Passed ${scenarios.length} Android back-controller scenarios.`);
