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

const { createScrollReturn: createPosition } = loadModule('../src/lib/scroll-return.ts');
function createScrollReturn(scrollTo) {
  const position = createPosition();
  return { ...position, restore() {
    const offset = position.restore();
    if (offset !== undefined) scrollTo(offset);
  } };
}
const restored = [];
const position = createScrollReturn(offset => restored.push(offset));
position.focus();
position.restore();
position.record(0);
position.beginDrag();
position.record(1846);
position.blur();
position.record(0); // Android detaches the background list.
position.restore();
assert.deepEqual(restored, [0], 'An unfocused screen must never scroll');
position.focus();
position.record(0); // Reattachment arrives before content layout.
position.restore();
position.record(320); // An incomplete/loading list clamps the offset.
position.restore(); // Retry when full content arrives.
assert.deepEqual(restored, [0, 1846, 1846], 'Back must restore the exact departure offset after data loads');
position.record(1846);
position.restore();
assert.equal(restored.length, 3, 'Finished restoration must not fight later layout changes');
position.blur();
position.focus();
position.beginDrag();
position.record(920);
position.restore();
assert.equal(restored.length, 3, 'User scrolling cancels a pending restoration');
position.blur();
position.focus();
position.restore();
assert.equal(restored.at(-1), 920, 'A second Back restores the latest position');
const otherScreen = createScrollReturn(offset => restored.push(offset));
otherScreen.focus();
otherScreen.restore();
assert.equal(restored.at(-1), 0, 'New routes and changed filters must not inherit another list position');
position.record(Number.NaN);
position.restore();
assert.equal(restored.at(-1), 920, 'Invalid native offsets cannot erase the saved position');
console.log('Passed scroll-return scenarios: background detach, delayed content, exact offset, repeated Back, user override, and independent routes.');
