import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const mobileRoot = path.join(root, "mobile");
const bundleRoot = path.resolve(root, process.argv[2] || "mobile/dist-production");
const sourceRoots = [
  path.join(mobileRoot, "src"),
  path.join(mobileRoot, "app.config.ts"),
  path.join(mobileRoot, "app.base.json"),
];
const forbiddenNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "PAYPAL_CLIENT_SECRET",
  "RESEND_API_KEY",
  "OPENAI_API_KEY",
  "GROQ_API_KEY",
  "VAPID_PRIVATE_KEY",
  "WHATSAPP_ACCESS_TOKEN",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
];

async function filesAt(target) {
  const targetStat = await stat(target).catch(() => null);
  if (!targetStat) return [];
  if (targetStat.isFile()) return [target];
  const entries = await readdir(target, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...await filesAt(child));
    else files.push(child);
  }
  return files;
}

const files = (await Promise.all(sourceRoots.map(filesAt))).flat();
if (await stat(bundleRoot).catch(() => null)) files.push(...await filesAt(bundleRoot));

const findings = [];
for (const filename of files) {
  if (!/\.(?:js|json|ts|tsx|html|css)$/i.test(filename)) continue;
  const source = await readFile(filename, "utf8").catch(() => "");
  for (const secretName of forbiddenNames) {
    if (source.includes(secretName)) {
      findings.push({
        file: path.relative(root, filename).split(path.sep).join("/"),
        secret: secretName,
      });
    }
  }
}

const unique = [...new Map(findings.map((finding) => [
  `${finding.file}:${finding.secret}`,
  finding,
])).values()];
console.log(JSON.stringify({
  ok: unique.length === 0,
  checkedFiles: files.length,
  bundleChecked: files.some((filename) => filename.startsWith(bundleRoot)),
  findings: unique,
}, null, 2));
if (unique.length) process.exit(1);
