// Offline validation only. No dotenv inheritance, client creation or network calls.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { applicationEnvironment, environment, disabledExternalIntegrations, supabaseCredential } from '../operations/seo-vercel/lib/environment-target.mjs';

try {
  const [mode, file, extra] = process.argv.slice(2);
  if (!['--app', '--worker'].includes(mode) || !file || extra) throw Error('ARGS');
  const env = parseEnv(readFileSync(file, 'utf8'));
  if (environment(env) !== 'staging') throw Error('TARGET');
  disabledExternalIntegrations(env);
  for (const flag of ['SEO_SYNC_ENABLED','SEO_AI_ENABLED','SEO_EDITORIAL_ENABLED','SEO_MANUAL_SYNC_ENABLED','SEO_MIRAI_FALLBACK_ENABLED']) {
    if (env[flag] !== 'false') throw Error('DISABLED_FLAGS_REQUIRED');
  }
  if (mode === '--app') await applicationEnvironment(env);
  else {
    if (env.SEO_RUNTIME_ENV !== 'staging' || !env.CRON_SECRET || env.CRON_SECRET.length < 32) throw Error('WORKER_CONFIG');
    await supabaseCredential(env, env.SEO_SYNC_SUPABASE_URL, env.SEO_SYNC_SERVICE_ROLE_KEY, env.SEO_SYNC_KEY_BINDING, 'service_role');
  }
  console.log(JSON.stringify({ valid: true, target: 'staging', mode: mode.slice(2), executionEnabled: false,
    networkContacted: false, credentialOriginVerifiedOnline: false }));
} catch {
  console.error('STAGING_CONFIGURATION_INVALID');
  process.exitCode = 1;
}
