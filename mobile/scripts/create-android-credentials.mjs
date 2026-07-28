import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const required = [
  "ANDROID_KEYSTORE_BASE64",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing Android signing secrets: ${missing.join(", ")}`);

const root = path.resolve(import.meta.dirname, "..");
const secretDirectory = path.join(root, ".credentials");
fs.mkdirSync(secretDirectory, { recursive: true, mode: 0o700 });
const keystorePath = path.join(secretDirectory, "release.keystore");
const decoded = Buffer.from(process.env.ANDROID_KEYSTORE_BASE64, "base64");
if (decoded.length < 1024) throw new Error("ANDROID_KEYSTORE_BASE64 does not contain a valid keystore.");
fs.writeFileSync(keystorePath, decoded, { mode: 0o600 });
fs.writeFileSync(path.join(root, "credentials.json"), `${JSON.stringify({
  android: {
    keystore: {
      keystorePath: "./.credentials/release.keystore",
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keyAlias: process.env.ANDROID_KEY_ALIAS,
      keyPassword: process.env.ANDROID_KEY_PASSWORD,
    },
  },
}, null, 2)}\n`, { mode: 0o600 });
console.log("Temporary Android signing files created.");
