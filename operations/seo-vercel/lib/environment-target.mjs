// Shared pure policy: no dotenv loading, network calls or secret-bearing errors.
export const PROJECTS = Object.freeze({
  production: 'yddqwgdgeljkzfsmtein',
  staging: 'tyltharlnbxrxibuxyye',
});
const fail = () => { throw Error('ENVIRONMENT_ISOLATION_REQUIRED'); };
// Independent of AI/editorial feature flags. Unknown or conflicting deployment
// selectors deny writes, including a staging project's Vercel production slot.
export function seoWritesAllowed(env) {
  try {
    const selected = environment(env);
    if (env.VERCEL === '1' && !env.VERCEL_ENV) return false;
    if (env.SEO_RUNTIME_ENV !== undefined && env.SEO_RUNTIME_ENV !== selected) return false;
    return selected === 'production' || selected === 'development' && !env.VERCEL_ENV;
  } catch { return false; }
}
export function environment(env) {
  const selected = env.APP_ENV;
  if (!['development', 'preview', 'staging', 'production'].includes(selected)) fail();
  if (env.NEXT_PUBLIC_APP_ENV !== undefined && env.NEXT_PUBLIC_APP_ENV !== selected) fail();
  if (env.VERCEL_ENV !== undefined) {
    const allowed = { development: ['development'], preview: ['preview', 'staging'], production: ['production', 'staging'] };
    if (!allowed[env.VERCEL_ENV]?.includes(selected)) fail();
  }
  if (env.NODE_ENV === 'development' && selected === 'production') fail();
  // Custom Vercel environments report VERCEL_ENV=production as well.
  if (selected === 'production' && env.VERCEL_TARGET_ENV !== undefined &&
      env.VERCEL_TARGET_ENV !== 'production') fail();
  return selected;
}
export function supabaseTarget(env, value) {
  const selected = environment(env);
  let url;
  try { url = new URL(value); } catch { fail(); }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') fail();
  if (selected === 'development') {
    if (!['http://127.0.0.1:54321', 'http://localhost:54321', 'http://127.0.0.1:9'].includes(url.origin)) fail();
    return { origin: url.origin, project: 'local', selected };
  }
  const project = selected === 'production' ? PROJECTS.production : PROJECTS.staging;
  if (url.origin !== `https://${project}.supabase.co`) fail();
  return { origin: url.origin, project, selected };
}
export async function fingerprint(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function credentialBinding(value, binding, project) {
  if (typeof value !== 'string' || !value || binding !== `${project}:${await fingerprint(value)}`) fail();
}
function keyRole(key, project, role) {
  if (key.startsWith(role === 'anon' ? 'sb_publishable_' : 'sb_secret_')) return;
  if (project === 'local' && key === (role === 'anon' ? 'synthetic-anon' : 'synthetic-service')) return;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) fail();
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.role !== role || (project === 'local'
      ? payload.ref !== undefined && payload.ref !== 'local'
      : payload.ref !== project)) fail();
  } catch { fail(); }
  // JWT inspection checks consistency only. The independent fingerprint approval
  // and the remote server's authentication remain required; this is not signature verification.
}
// Synchronous target/role check for SDK initialization, OAuth and WebSockets,
// which do not necessarily pass through the HTTP fetch wrapper.
export function supabaseConfiguration(env, url, key, binding, role) {
  const target = supabaseTarget(env, url);
  if (typeof key !== 'string' || !key) fail();
  keyRole(key, target.project, role);
  if (typeof binding !== 'string' || !new RegExp(`^${target.project}:[a-f0-9]{64}$`).test(binding)) fail();
  return target;
}
export async function supabaseCredential(env, url, key, binding, role) {
  const target = supabaseConfiguration(env, url, key, binding, role);
  await credentialBinding(key, binding, target.project);
  return target;
}
export function ownerTarget(env, value) {
  const selected = environment(env);
  let url;
  try { url = new URL(value); } catch { fail(); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.username || !url.password || url.hash) fail();
  // pg-connection-string gives query parameters precedence over URL fields.
  // Reject host/port/user/database/options overrides before the local branch.
  for (const key of url.searchParams.keys()) if (key !== 'sslmode') fail();
  if (url.searchParams.getAll('sslmode').length > 1 || url.pathname !== '/postgres') fail();
  if (selected === 'development') {
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '54322') fail();
    if (url.search && url.searchParams.get('sslmode') !== 'disable') fail();
    return 'local';
  }
  const project = selected === 'production' ? PROJECTS.production : PROJECTS.staging;
  const direct = url.hostname === `db.${project}.supabase.co` && decodeURIComponent(url.username) === 'postgres';
  const pooler = /^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(url.hostname) && decodeURIComponent(url.username) === `postgres.${project}`;
  if (!(direct || pooler) || url.port !== '5432' || url.pathname !== '/postgres' || url.searchParams.get('sslmode') !== 'verify-full') fail();
  return project;
}
export function disabledExternalIntegrations(env) {
  if (environment(env) === 'production') return;
  const secrets = ['OPENAI_API_KEY', 'GROQ_API_KEY', 'RESEND_API_KEY', 'PAYPAL_CLIENT_SECRET',
    'NEXT_PUBLIC_PAYPAL_CLIENT_ID', 'PRIVATE_EMAIL_PASS', 'VAPID_PRIVATE_KEY', 'EXPO_ACCESS_TOKEN',
    'WHATSAPP_ACCESS_TOKEN', 'SEO_AI_API_KEY', 'PHONE_RELAY_KEY', 'INDEXNOW_KEY',
    'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY', 'NEXT_PUBLIC_EMAILJS_SERVICE_ID', 'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID',
    'TRUSTPILOT_API_KEY', 'CMI_CLIENT_ID', 'CMI_STORE_KEY', 'SMTP_PASS', 'IMAP_PASS',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  if (secrets.some(name => Boolean(env[name]?.trim())) || env.PAYPAL_ENABLED === 'true' ||
      env.SEO_AI_ENABLED === 'true' || env.SEO_EDITORIAL_ENABLED === 'true' ||
      env.SEO_MIRAI_FALLBACK_ENABLED === 'true' || env.AGENT_STUDIO_LIVE_ENABLED === 'true' ||
      env.INDEXNOW_ENABLED === 'true') fail();
}
export async function applicationEnvironment(env) {
  if (!env.NEXT_PUBLIC_APP_ENV || env.NEXT_PUBLIC_APP_ENV !== env.APP_ENV) fail();
  disabledExternalIntegrations(env);
  if (environment(env) !== 'production' && (
      env.SEO_SYNC_ENABLED === 'true' || env.SEO_MANUAL_SYNC_ENABLED === 'true' ||
      ['CRON_SECRET', 'LEARNING_CRON_SECRET', 'SEO_WORKER_URL', 'SEO_WORKER_CRON_SECRET',
        'SEO_WORKER_ALLOWED_ORIGIN', 'SEO_WORKER_BINDING'].some(name => Boolean(env[name]?.trim())))) fail();
  let site;
  try { site = new URL(env.NEXT_PUBLIC_SITE_URL); } catch { fail(); }
  if (site.username || site.password || site.search || site.hash || site.pathname !== '/') fail();
  if (environment(env) === 'production') {
    if (site.origin !== 'https://lecomax.com') fail();
  } else if (environment(env) === 'development') {
    if (!['localhost', '127.0.0.1'].includes(site.hostname) || site.protocol !== 'http:') fail();
  } else if (site.protocol !== 'https:' || ['lecomax.com', 'www.lecomax.com'].includes(site.hostname)) fail();
  await supabaseCredential(env, env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env.NEXT_PUBLIC_SUPABASE_KEY_BINDING, 'anon');
  await supabaseCredential(env, env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
    env.SUPABASE_SERVICE_KEY_BINDING, 'service_role');
  if (!env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32 ||
      env.ADMIN_SESSION_SECRET === env.SUPABASE_SERVICE_ROLE_KEY) fail();
  if (env.OWNER_DATABASE_URL) {
    await credentialBinding(env.OWNER_DATABASE_URL, env.OWNER_DATABASE_BINDING, ownerTarget(env, env.OWNER_DATABASE_URL));
  }
  return environment(env);
}
