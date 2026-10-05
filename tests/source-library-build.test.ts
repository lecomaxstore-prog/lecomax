import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm, symlink, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);

test('a clean direct production build creates the private library without npm prebuild', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'lecomax-library-build-'));
  try {
    await mkdir(path.join(fixture, 'scripts'));
    await mkdir(path.join(fixture, 'app'));
    await mkdir(path.join(fixture, 'node_modules'));
    await symlink(path.dirname(require.resolve('next/package.json')), path.join(fixture, 'node_modules/next'), 'junction');
    await copyFile('next.config.js', path.join(fixture, 'next.config.js'));
    await copyFile('scripts/source-library.mjs', path.join(fixture, 'scripts/source-library.mjs'));
    await writeFile(path.join(fixture, 'app/page.tsx'), 'export default function Page() { return <h1>Shop</h1>; }');
    await writeFile(path.join(fixture, '.env.local'), 'PRIVATE_VALUE=do-not-publish');
    const configure = require(path.join(fixture, 'next.config.js'));
    await configure('phase-production-server');
    await assert.rejects(readFile(path.join(fixture, '.source-library/catalog.json')), { code: 'ENOENT' });
    const config = await configure('phase-production-build');
    const library = JSON.parse(await readFile(path.join(fixture, '.source-library/catalog.json'), 'utf8'));
    assert.equal(library.version, 1);
    assert.equal(library.files.find((file: any) => file.path === 'app/page.tsx').content, 'export default function Page() { return <h1>Shop</h1>; }');
    assert.equal(JSON.stringify(library).includes('do-not-publish'), false);
    assert.ok(config.outputFileTracingIncludes['/api/dev-docs/*'].includes('./.source-library/catalog.json'));
    await writeFile(path.join(fixture, 'app/page.tsx'), 'export default function Page() { return <h1>Updated shop</h1>; }');
    await configure('phase-production-build');
    const updated = JSON.parse(await readFile(path.join(fixture, '.source-library/catalog.json'), 'utf8'));
    assert.match(updated.files.find((file: any) => file.path === 'app/page.tsx').content, /Updated shop/);
    await unlink(path.join(fixture, 'app/page.tsx'));
    await assert.rejects(configure('phase-production-build'), /missing app\/page\.tsx/);
  } finally {
    assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(fixture).startsWith('lecomax-library-build-'));
    await rm(fixture, { recursive: true, force: true });
  }
});
