import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const versionName = process.argv[2];
const versionCode = Number(process.argv[3]);
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(versionName ?? "")) {
  throw new Error("Usage: npm run android:version -- 1.2.0 12");
}
if (!Number.isInteger(versionCode) || versionCode < 1) throw new Error("versionCode must be a positive integer.");

const basePath = path.join(root, "app.base.json");
const packagePath = path.join(root, "package.json");
const releasePath = path.join(root, "release.config.json");
const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const previousRelease = fs.existsSync(releasePath)
  ? JSON.parse(fs.readFileSync(releasePath, "utf8"))
  : {};
const currentCode = Number(base.expo?.android?.versionCode ?? 0);
if (versionCode <= currentCode) {
  throw new Error(`versionCode ${versionCode} must be greater than the current code ${currentCode}.`);
}

base.expo.version = versionName;
base.expo.android.versionCode = versionCode;
base.expo.ios.buildNumber = String(versionCode);
packageJson.version = versionName;
const release = {
  ...previousRelease,
  versionName,
  versionCode,
  minimumAndroidVersion: "8.0",
  apkFileName: `lecomax-v${versionName}.apk`,
  required: previousRelease.required === true,
  releaseNotes: Array.isArray(previousRelease.releaseNotes) ? previousRelease.releaseNotes : [],
};

for (const [filename, value] of [[basePath, base], [packagePath, packageJson], [releasePath, release]]) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
console.log(`Android release metadata updated to ${versionName} (${versionCode}).`);
