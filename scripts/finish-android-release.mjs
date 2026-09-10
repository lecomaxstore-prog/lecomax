import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { trustedApkArtifact } from "../lib/app-release-hosts.ts";

const root = path.resolve(import.meta.dirname, "..");
const mobile = path.join(root, "mobile");
const output = path.join(root, "release", "android");
const [buildId, easBin, certificate] = process.argv.slice(2);
if (!buildId || !easBin || !/^[a-f0-9]{64}$/.test(certificate ?? "")) throw new Error("Usage: finish-android-release.mjs BUILD_ID EAS_CLI_BIN EXPECTED_CERT_SHA256");
const release = JSON.parse(fs.readFileSync(path.join(mobile, "release.config.json"), "utf8"));
const statusFile = path.join(output, `publication-v${release.versionName}.json`);
const gh = path.join(process.env.ProgramFiles, "GitHub CLI", "gh.exe");
function status(state, extra = {}) {
  const value = { state, buildId, version: release.versionName, code: release.versionCode, time: new Date().toISOString(), ...extra };
  fs.writeFileSync(statusFile, JSON.stringify(value, null, 2));
  console.log(JSON.stringify(value));
}
function run(bin, args, cwd = root, extraEnv = {}) {
  const result = spawnSync(bin, args, { cwd, env: { ...process.env, ...extraEnv }, encoding: "utf8", windowsHide: true, timeout: 600000, maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Command failed: ${path.basename(bin)} ${args[0]} (exit ${result.status})`);
  return result.stdout.trim();
}
async function checksum(url, filename) {
  const response = await fetch(url, { signal: AbortSignal.timeout(300000) });
  if (!response.ok) throw new Error(`APK download returned ${response.status}`);
  const hash = createHash("sha256");
  let size = 0;
  const fd = filename ? fs.openSync(filename, "wx") : null;
  try {
    for await (const chunk of response.body) {
      hash.update(chunk); size += chunk.length;
      if (fd !== null) fs.writeSync(fd, chunk);
    }
  } finally { if (fd !== null) fs.closeSync(fd); }
  return { sha256: hash.digest("hex"), size };
}
try {
  let build;
  const deadline = Date.now() + 6 * 60 * 60 * 1000;
  while (Date.now() < deadline) {
    build = JSON.parse(run(process.execPath, [easBin, "build:view", buildId, "--json"], mobile));
    status(build.status);
    if (build.status === "FINISHED") break;
    if (["ERRORED", "CANCELED"].includes(build.status)) throw new Error(`Expo build ${build.status}`);
    await new Promise(resolve => setTimeout(resolve, 45000));
  }
  if (build?.status !== "FINISHED") throw new Error("Expo build wait timed out; current download remains published.");
  if (build.appVersion !== release.versionName || Number(build.appBuildVersion) !== release.versionCode || build.appIdentifier !== "com.lecomax.app") throw new Error("Build metadata does not match intended release.");
  const artifactUrl = build.artifacts?.applicationArchiveUrl;
  if (!trustedApkArtifact(artifactUrl ?? "")) throw new Error("Untrusted build artifact URL.");
  status("VERIFYING");
  const artifact = path.join(output, `verified-build-${buildId}.apk`);
  const downloaded = await checksum(artifactUrl, artifact);
  run(process.execPath, [path.join(mobile, "scripts", "verify-android-signature.mjs"), artifact], root, { ANDROID_CERT_SHA256: certificate });
  const aapt = path.join(process.env.LOCALAPPDATA, "Android", "Sdk", "build-tools", "36.1.0", "aapt.exe");
  const manifest = run(aapt, ["dump", "badging", artifact]);
  const pkg = manifest.match(/package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/);
  if (!pkg || pkg[1] !== "com.lecomax.app" || Number(pkg[2]) !== release.versionCode || pkg[3] !== release.versionName) throw new Error("APK manifest does not match intended release.");
  const currentConfig = JSON.parse(fs.readFileSync(path.join(mobile, "release.config.json"), "utf8"));
  if (JSON.stringify(currentConfig) !== JSON.stringify(release)) throw new Error("Release configuration changed while waiting.");
  run(process.execPath, [path.join(mobile, "scripts", "package-android-artifact.mjs"), artifact]);
  status("UPLOADING");
  const repo = "lecomaxstore-prog/lecomax-android-releases";
  const tag = `v${release.versionName}`;
  const apk = path.join(output, release.apkFileName);
  run(gh, ["release", "create", tag, apk, `${apk}.sha256`, "--repo", repo, "--title", `Lecomax ${release.versionName} for Android`, "--notes", "Official signed Lecomax Android APK. Installation: https://lecomax.com/download"]);
  const publicUrl = `https://github.com/${repo}/releases/download/${tag}/${release.apkFileName}`;
  const uploaded = await checksum(publicUrl);
  if (uploaded.sha256 !== downloaded.sha256 || uploaded.size !== downloaded.size) throw new Error("Public APK checksum mismatch.");
  status("PUBLISHING");
  run(process.execPath, ["--env-file=.env.local", "scripts/publish-android-release.mjs", apk], root, { ANDROID_EXTERNAL_URL: publicUrl });
  const latest = await (await fetch("https://lecomax.com/api/app-releases/android/latest", { cache: "no-store" })).json();
  if (latest.versionCode !== release.versionCode || latest.sha256 !== downloaded.sha256) throw new Error("Website release metadata verification failed.");
  const live = await checksum(latest.downloadUrl);
  if (live.sha256 !== downloaded.sha256 || live.size !== downloaded.size) throw new Error("Website download checksum mismatch.");
  status("PUBLISHED_AND_VERIFIED", { downloadUrl: latest.downloadUrl, sha256: live.sha256, fileSize: live.size });
} catch (error) {
  status("FAILED", { error: error.message });
  process.exitCode = 1;
}
