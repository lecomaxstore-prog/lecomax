import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const artifact = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
if (!artifact || !fs.existsSync(artifact) || path.extname(artifact).toLowerCase() !== ".apk") {
  throw new Error("Usage: node scripts/verify-android-signature.mjs path/to/release.apk");
}

function apksignerPath() {
  const executable = process.platform === "win32" ? "apksigner.bat" : "apksigner";
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    (process.platform === "win32" && process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk")
      : null);
  if (!androidHome) return executable;
  const buildTools = path.join(androidHome, "build-tools");
  if (!fs.existsSync(buildTools)) return executable;
  const versions = fs.readdirSync(buildTools).sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  const candidate = versions.map((version) => path.join(buildTools, version, executable)).find(fs.existsSync);
  return candidate || executable;
}

const signer = apksignerPath();
const verification = process.platform === "win32"
  ? spawnSync(
      process.env.JAVA_HOME
        ? path.join(process.env.JAVA_HOME, "bin", "java.exe")
        : "java.exe",
      [
        "-Xmx1024M",
        "-Xss1m",
        "-jar",
        path.join(path.dirname(signer), "lib", "apksigner.jar"),
        "verify",
        "--verbose",
        "--print-certs",
        artifact,
      ],
      { encoding: "utf8", windowsHide: true },
    )
  : spawnSync(signer, ["verify", "--verbose", "--print-certs", artifact], {
      encoding: "utf8",
      windowsHide: true,
    });
const output = `${verification.stdout ?? ""}\n${verification.stderr ?? ""}`;
if (verification.status !== 0 || !/Verifies\s*$/m.test(output)) {
  throw new Error(`APK signature verification failed (status ${verification.status ?? "unknown"}): ${output.trim()}`);
}
if (/Android Debug|CN\s*=\s*Android Debug/i.test(output)) {
  throw new Error("Refusing an APK signed with the Android debug certificate.");
}
const digest = output.match(/certificate SHA-256 digest:\s*([A-Fa-f0-9:]+)/i)?.[1]?.replace(/:/g, "").toLowerCase();
if (!digest || digest.length !== 64) throw new Error("Unable to read the APK signer certificate digest.");
const expected = process.env.ANDROID_CERT_SHA256?.replace(/:/g, "").trim().toLowerCase();
if (expected && digest !== expected) throw new Error("APK signer does not match ANDROID_CERT_SHA256.");
console.log(JSON.stringify({ signed: true, debugSigned: false, certificateSha256: digest }, null, 2));
