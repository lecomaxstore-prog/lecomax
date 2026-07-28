import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const base = JSON.parse(fs.readFileSync(path.join(root, "app.base.json"), "utf8"));
const release = JSON.parse(fs.readFileSync(path.join(root, "release.config.json"), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (base.expo.version !== release.versionName || packageJson.version !== release.versionName) {
  throw new Error("Mobile package, Expo config, and release metadata versions do not match.");
}
if (base.expo.android.versionCode !== release.versionCode) {
  throw new Error("Expo versionCode and release metadata versionCode do not match.");
}
const refName = process.argv[2] ?? "";
if (refName.startsWith("v") && refName.slice(1) !== release.versionName) {
  throw new Error(`Tag ${refName} does not match release ${release.versionName}.`);
}
console.log(`Release ${release.versionName} (${release.versionCode}) is internally consistent.`);
