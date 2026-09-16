import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Output metadata only. Never emit matched text or secret values.
const tracked = new Set(execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).split("\0").filter(Boolean));
const includeArchives = process.argv.includes("--include-archives");
const skip = new Set(["node_modules", ".git", "out", "dist", "build", ...(includeArchives ? [] : ["release", "projects"])]);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink() || skip.has(entry.name) || entry.name.startsWith(".next")) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file.replaceAll("\\", "/")];
  });
}
const privateValues = [];
for (const envFile of [".env.local", ".env.production.local", "mobile/.env.local"]) {
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match || /^(NEXT_PUBLIC_|EXPO_PUBLIC_)/.test(match[1]) || !/(KEY|TOKEN|SECRET|PASSWORD|PASS|DATABASE_URL)/.test(match[1])) continue;
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    if (value.length >= 16) privateValues.push([match[1], value]);
  }
}
const findings = [];
let scanned = 0;
for (const file of new Set([...walk("."), ...tracked])) {
  const normalized = file.replace(/^\.\//, "");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile() || fs.statSync(file).size > 5_000_000 || !/\.(?:[cm]?[jt]sx?|json|ya?ml|md|txt|sql|ps1|env|local|example)$/.test(file)) continue;
  const source = fs.readFileSync(file, "utf8"); scanned++;
  const isEnv = /(?:^|\/)\.env(?:\.|$)/.test(normalized);
  if (isEnv && !normalized.endsWith(".example") && tracked.has(normalized)) findings.push({ file: normalized, kind: "tracked-environment-file" });
  if (!isEnv) for (const [name, value] of privateValues) {
    if (source.includes(value)) findings.push({ file: normalized, kind: "configured-secret-copy", secret: name, tracked: tracked.has(normalized) });
  }
  if (!isEnv && /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) findings.push({ file: normalized, kind: "private-key-marker", tracked: tracked.has(normalized) });
  const matches = source.matchAll(/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g);
  for (const match of matches) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split(".")[1], "base64url").toString());
      if (payload.role === "service_role" && !isEnv) findings.push({ file: normalized, kind: "service-role-token", tracked: tracked.has(normalized) });
    } catch { /* Not a JWT. */ }
  }
}
const historicalPaths = execFileSync("git", ["log", "--all", "--format=", "--name-only", "--", ".env", ".env.local", ".env.production", ".env.production.local", "**/.env", "**/.env.local", "**/*.pem", "**/*.key"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).trim().split(/\r?\n/).filter(Boolean);
let historicalBlobsScanned = 0;
const historicalFindings = [];
if (process.argv.includes("--history")) {
  const objects = execFileSync("git", ["rev-list", "--objects", "--all"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
    .split(/\r?\n/).filter(line => /\.(?:[cm]?[jt]sx?|json|ya?ml|md|txt|sql|ps1|env|local|example)$/.test(line));
  const paths = new Map(objects.map(line => [line.slice(0, 40), line.slice(41)]));
  const sizes = execFileSync("git", ["cat-file", "--batch-check"], { input: [...paths.keys()].join("\n") + "\n", encoding: "utf8", maxBuffer: 8 * 1024 * 1024 })
    .trim().split("\n").map(line => line.trim().split(" ")).filter(([, type, size]) => type === "blob" && Number(size) <= 5_000_000);
  // Small batches bound memory; never include matched values in output or args.
  for (let i = 0; i < sizes.length; i += 8) {
    const batch = sizes.slice(i, i + 8);
    const result = execFileSync("git", ["cat-file", "--batch"], { input: batch.map(([id]) => id).join("\n") + "\n", maxBuffer: 48 * 1024 * 1024 });
    let offset = 0;
    for (const [id, , size] of batch) {
      const start = result.indexOf(10, offset) + 1;
      const source = result.subarray(start, start + Number(size)).toString("utf8");
      offset = start + Number(size) + 1;
      historicalBlobsScanned++;
      for (const [name, value] of privateValues) if (source.includes(value)) historicalFindings.push({ file: paths.get(id), blob: id, kind: "configured-secret-copy", secret: name });
      for (const match of source.matchAll(/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
        try {
          if (JSON.parse(Buffer.from(match[0].split(".")[1], "base64url").toString()).role === "service_role") historicalFindings.push({ file: paths.get(id), blob: id, kind: "service-role-token" });
        } catch { /* Not a JWT. */ }
      }
    }
  }
}
console.log(JSON.stringify({ scanned, historicalBlobsScanned, configuredPrivateValuesCompared: privateValues.length, findings, historicalFindings, historicalSensitivePaths: [...new Set(historicalPaths)] }, null, 2));
