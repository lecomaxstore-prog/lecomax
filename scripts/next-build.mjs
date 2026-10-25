import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
// Load local configuration before enforcing the runtime isolation policy.
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd(), false);
const env = { ...process.env };

// Ordinary builds must satisfy the same policy as runtime. Synthetic builds use
// the separate isolated snapshot harness; no live configuration is filled in.
const { applicationEnvironment } = await import('../operations/seo-vercel/lib/environment-target.mjs');
await applicationEnvironment(env);

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
