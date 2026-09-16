const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../node_modules/typescript');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../src');
const nativeRequire = createRequire(path.resolve(__dirname, '../package.json'));
function environment(tag, storage = new Map(), failure = false) {
  const cache = new Map();
  let deviceTag = tag;
  const adapter = {
    getItem: async key => { await new Promise(resolve => setTimeout(resolve, 10)); if (failure) throw new Error('storage unavailable'); return storage.get(key) ?? null; },
    setItem: async (key, value) => { storage.set(key, value); },
    removeItem: async key => { storage.delete(key); },
  };
  function load(file) {
    file = path.resolve(root, file);
    if (!path.extname(file)) file += fs.existsSync(file + '.ts') ? '.ts' : '/index.ts';
    if (cache.has(file)) return cache.get(file).exports;
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const requireMock = name => {
      if (name === '@/lib/runtime-config') return { runtimeConfig: { apiUrl: 'https://example.test' } };
      if (name === 'react-native') return { Platform: { OS: 'android' } };
      if (name === 'expo-localization') return { getLocales: () => [{ languageTag: deviceTag }] };
      if (name === '@react-native-async-storage/async-storage') return adapter;
      if (name.startsWith('@/')) return load(name.slice(2));
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
      return nativeRequire(name);
    };
    vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { Intl, console, setTimeout, clearTimeout })(requireMock, module, module.exports);
    return module.exports;
  }
  return { load, storage, setDevice: tag => { deviceTag = tag; } };
}
const settled = () => new Promise(resolve => setTimeout(resolve, 30));
(async () => {
  for (const [tag, expected] of [['en','en'], ['fr','fr'], ['fr-MA','fr'], ['fr-FR','fr'], ['en-US','en'], ['en-GB','en'], ['es-ES','fr'], ['de-DE','fr'], ['ar-MA','fr']]) {
    const env = environment(tag), store = env.load('stores/preferences').usePreferences;
    assert.equal(store.getState().language, expected, tag);
    assert.equal(store.getState().hydrated, false);
    await settled();
    assert.equal(store.getState().hydrated, true);
    assert.equal(store.getState().language, expected);
  }
  for (const [device, choice] of [['en-US','fr'], ['fr-FR','en']]) {
    const first = environment(device), store = first.load('stores/preferences').usePreferences;
    await settled(); store.getState().setLanguage(choice); await settled();
    const restarted = environment(device, first.storage), next = restarted.load('stores/preferences').usePreferences;
    assert.equal(next.getState().hydrated, false);
    await settled(); assert.equal(next.getState().language, choice);
    next.getState().syncDeviceLanguage(); assert.equal(next.getState().language, choice);
    restarted.setDevice('de-DE'); next.getState().syncDeviceLanguage(); assert.equal(next.getState().language, choice);
    next.getState().useDeviceLanguage(); assert.equal(next.getState().language, 'fr');
  }
  for (const broken of [false, true]) {
    const storage = new Map([['lecomax-preferences', '{bad json']]);
    const env = environment('en-US', storage, broken), store = env.load('stores/preferences').usePreferences;
    await settled(); assert.equal(store.getState().hydrated, true); assert.equal(store.getState().language, 'en');
  }
  const env = environment('en-US'), store = env.load('stores/preferences').usePreferences;
  await settled();
  const { translate } = env.load('i18n/translate');
  for (const language of ['fr', 'en']) for (const count of [0, 1, 2, 12]) {
    const value = translate(language, 'counts.products', { count });
    assert.ok(value.includes(String(count))); assert.ok(!value.includes('{{'));
  }
  const { money } = env.load('lib/format');
  store.getState().setLanguage('fr'); const french = money(1234);
  store.getState().setLanguage('en'); const english = money(1234);
  assert.notEqual(french, english);
  // Exercise the actual module-scope Zod schemas, without loading native screens.
  for (const [file, start, end] of [['app/auth.tsx', 'const schema =', 'type FormData'], ['screens/checkout-screen.tsx', 'const emailDomainSuggestions:', 'type FormData']]) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const fragment = source.slice(source.indexOf(start), source.indexOf(end)).replace('const schema =', 'export const schema =');
    const code = ts.transpileModule(fragment, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {}; vm.runInNewContext(code, { exports, z: nativeRequire('zod').z, msg: env.load('i18n').msg });
    for (const language of ['fr', 'en']) {
      store.getState().setLanguage(language);
      const result = exports.schema.safeParse({ firstName: '', lastName: '', email: 'bad', password: 'x', confirmPassword: '', name: '', phone: '', city: '', address: '', payment: 'cod' });
      assert.equal(result.success, false);
      const email = result.error.issues.find(issue => issue.path[0] === 'email');
      assert.match(email.message, language === 'en' ? /Enter/ : /Saisissez/);
    }
  }
  console.log('PASS: 9 locales; both persisted overrides across fresh store instances; device changes; reset to device; malformed/failed storage; plurals; currency; live auth/checkout validation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
