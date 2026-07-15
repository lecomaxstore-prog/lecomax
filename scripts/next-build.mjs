import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const env = { ...process.env };

// Some API routes create their Supabase client when Next.js inspects the module.
// A preview without database credentials must still be buildable. These values
// are deliberately non-secret and are used only when the real variables are
// absent; configured production and preview environments remain unchanged.
const buildFallbacks = {
  NEXT_PUBLIC_SUPABASE_URL: "https://preview-build-placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "preview-build-placeholder-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "preview-build-placeholder-service-key",
};

const missing = [];

for (const [name, fallback] of Object.entries(buildFallbacks)) {
  if (!env[name]?.trim()) {
    env[name] = fallback;
    missing.push(name);
  }
}

if (missing.length > 0) {
  console.warn(
    `[build] Missing ${missing.join(", ")}; using non-secret placeholders so the preview can compile.`,
  );
  console.warn(
    "[build] Configure these variables in Vercel Preview to enable Supabase-backed preview APIs.",
  );
}

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
