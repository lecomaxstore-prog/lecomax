import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { collectSourceLibrary, isLibraryPath, searchLibrary, writeSourceLibrary } from "../scripts/source-library.mjs";

test("source library rejects private paths, traversal, generated folders and dependencies", () => {
  for (const value of [".env.local", "../package.json", "app/../../.env", "C:/secret.ts", "app\\page.tsx", "app/node_modules/a.ts", "app/.hidden/a.ts", "mobile/credentials.json", "scripts/service-account.json", "release/app/page.tsx", "package-lock.json", "app/generated/data.json", "app/page.tsx\0"]) assert.equal(isLibraryPath(value), false, value);
  for (const value of ["app/page.tsx", "package.json", "mobile/src/app/index.tsx", "supabase/migrations/schema.sql", "tests/cart.test.ts"]) assert.equal(isLibraryPath(value), true, value);
});

test("snapshot includes real code, excludes credentials and symlinks, and survives without the source tree", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "lecomax-library-test-"));
  try {
    await mkdir(path.join(fixture, "app"));
    await mkdir(path.join(fixture, "mobile/src"), { recursive: true });
    await mkdir(path.join(fixture, "private"));
    await writeFile(path.join(fixture, "app/page.tsx"), "first line\nexport const checkout = 'demo';\n");
    await writeFile(path.join(fixture, "package.json"), '{"name":"sample"}');
    await writeFile(path.join(fixture, "mobile/src/index.ts"), "export const mobile = true;");
    await writeFile(path.join(fixture, ".env.local"), "DO_NOT_SHARE=yes");
    await writeFile(path.join(fixture, "app/config.ts"), 'const api_key = "' + "x".repeat(32) + '";');
    await writeFile(path.join(fixture, "private/data.ts"), "private data");
    await symlink(path.join(fixture, "private"), path.join(fixture, "app/linked"), "junction");
    const result = await collectSourceLibrary(fixture);
    assert.deepEqual(result.files.map(file => file.path).sort(), ["app/page.tsx", "mobile/src/index.ts", "package.json"]);
    assert.equal(result.omitted, 1);
    const match = searchLibrary(result, "CHECKOUT");
    assert.equal(match.total, 1);
    assert.equal(match.results[0].line, 2);
    assert.equal(searchLibrary(result, "package.json").results[0].path, "package.json");
    assert.equal(searchLibrary(result, "", "mobile").total, 1);
    assert.equal(searchLibrary(result, "", "all", 0, 2).nextOffset, 2);
    assert.equal(searchLibrary(result, "", "all", 2, 2).results.length, 1);
    await writeSourceLibrary(fixture);
    const stored = JSON.parse(await readFile(path.join(fixture, ".source-library/catalog.json"), "utf8"));
    assert.equal(stored.files.find(file => file.path === "app/page.tsx").content, result.files.find(file => file.path === "app/page.tsx")!.content);
    assert.equal(JSON.stringify(stored).includes("DO_NOT_SHARE"), false);
  } finally {
    assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(fixture).startsWith("lecomax-library-test-"));
    await rm(fixture, { recursive: true, force: true });
  }
});
