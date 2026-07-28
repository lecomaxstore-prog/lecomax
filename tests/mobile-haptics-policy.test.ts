import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const sourceRoot = join(process.cwd(), "mobile", "src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(ts|tsx)$/.test(name)
        ? [path]
        : [];
  });
}

test("all app haptics are routed through the preference-aware service", () => {
  const offenders = sourceFiles(sourceRoot)
    .filter((path) => !path.endsWith(join("services", "haptics.ts")))
    .filter((path) => /expo-haptics|\bHaptics\.|\bVibration\./.test(readFileSync(path, "utf8")))
    .map((path) => relative(process.cwd(), path));
  assert.deepEqual(offenders, []);
});

test("the haptics service checks persisted hydration and preference", () => {
  const service = readFileSync(join(sourceRoot, "services", "haptics.ts"), "utf8");
  assert.match(service, /preference\.hydrated\s*&&\s*preference\.hapticsEnabled/);
});
