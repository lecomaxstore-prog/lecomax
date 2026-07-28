import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const source = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
if (!source || !fs.existsSync(source)) throw new Error("Usage: npm run android:artifact -- path/to/release.apk");
const extension = path.extname(source).toLowerCase();
if (![".apk", ".aab"].includes(extension)) throw new Error("The Android artifact must be an APK or AAB.");

const release = JSON.parse(fs.readFileSync(path.join(root, "release.config.json"), "utf8"));
const outputDirectory = path.resolve(root, "..", "release", "android");
fs.mkdirSync(outputDirectory, { recursive: true });
const outputName = extension === ".apk" ? release.apkFileName : `lecomax-v${release.versionName}.aab`;
const output = path.join(outputDirectory, outputName);
fs.copyFileSync(source, output);
const bytes = fs.readFileSync(output);
if (bytes.length < 1024 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
  fs.rmSync(output, { force: true });
  throw new Error("The artifact is not a valid Android ZIP archive.");
}
const sha256 = createHash("sha256").update(bytes).digest("hex");
fs.writeFileSync(`${output}.sha256`, `${sha256}  ${outputName}\n`, "utf8");
fs.writeFileSync(`${output}.json`, `${JSON.stringify({
  ...release,
  fileName: outputName,
  fileSize: bytes.length,
  sha256,
  generatedAt: new Date().toISOString(),
}, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output, fileSize: bytes.length, sha256 }, null, 2));
