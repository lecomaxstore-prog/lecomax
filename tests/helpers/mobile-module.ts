import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

// Execute real mobile domain/i18n modules under Node, isolating only the native
// persisted preferences store. Translation catalogs and interpolation stay real.
export function loadMobileModule<T>(relative: string): T {
  const root = fileURLToPath(new URL('../../mobile/src/', import.meta.url));
  const cache = new Map<string, Record<string, unknown>>();
  function load(filename: string): Record<string, unknown> {
    const target = [filename, `${filename}.ts`, path.join(filename, 'index.ts')].find(candidate => existsSync(candidate) && /\.(ts|json)$/.test(candidate));
    if (!target) throw new Error(`Mobile test module not found: ${filename}`);
    if (target.endsWith('.json')) return JSON.parse(readFileSync(target, 'utf8'));
    if (cache.has(target)) return cache.get(target)!;
    const exports: Record<string, unknown> = {};
    cache.set(target, exports);
    vm.runInNewContext(ts.transpileModule(readFileSync(target, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
      exports, setTimeout, clearTimeout, Promise, Error, URL, Intl,
      require: (name: string) => {
        if (name === '@/stores/preferences') return { usePreferences: { getState: () => ({language:'fr'}) } };
        if (name.startsWith('@/')) return load(path.join(root, name.slice(2)));
        if (name.startsWith('.')) return load(path.resolve(path.dirname(target), name));
        throw new Error(`Unexpected dependency in mobile domain test: ${name}`);
      },
    }, {filename: target});
    return exports;
  }
  return load(path.join(root, relative)) as T;
}
