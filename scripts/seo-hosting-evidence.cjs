// Pure allowlist projection: never include values, ciphertext, tokens or raw API bodies.
const keys = [
  'APP_ENV', 'NEXT_PUBLIC_APP_ENV', 'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_KEY_BINDING', 'SUPABASE_SERVICE_KEY_BINDING',
  'OWNER_DATABASE_URL', 'OWNER_DATABASE_BINDING', 'SESSION_SECRET',
  'SEO_RUNTIME_ENV', 'SEO_SYNC_KEY_BINDING', 'SEO_MANUAL_SYNC_ENABLED',
  'SEO_WORKER_URL', 'SEO_WORKER_ALLOWED_ORIGIN', 'SEO_WORKER_BINDING',
  'SEO_WORKER_CRON_SECRET', 'SEO_MIRAI_FALLBACK_ENABLED',
  'ADMIN_EMAIL', 'ADMIN_SESSION_SECRET', 'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'SEO_AI_BASE_URL', 'SEO_AI_API_KEY', 'SEO_AI_MODEL', 'OPENAI_API_KEY',
  'SEO_SYNC_ENABLED', 'SEO_AI_ENABLED', 'SEO_EDITORIAL_ENABLED',
  'SEO_SYNC_SUPABASE_URL', 'SEO_SYNC_SERVICE_ROLE_KEY', 'CRON_SECRET',
  'AGENT_STUDIO_LIVE_ENABLED', 'PAYPAL_ENABLED', 'PAYPAL_CLIENT_SECRET',
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID', 'GROQ_API_KEY', 'RESEND_API_KEY',
  'PRIVATE_EMAIL_PASS', 'VAPID_PRIVATE_KEY', 'EXPO_ACCESS_TOKEN',
  'WHATSAPP_ACCESS_TOKEN', 'PHONE_RELAY_KEY', 'OWNER_EMAIL', 'OWNER_PASSWORD_HASH',
  'INDEXNOW_ENABLED', 'INDEXNOW_KEY', 'LEARNING_CRON_SECRET',
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN',
  'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY', 'NEXT_PUBLIC_EMAILJS_SERVICE_ID', 'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID',
  'TRUSTPILOT_API_KEY', 'CMI_CLIENT_ID', 'CMI_STORE_KEY', 'SMTP_PASS', 'IMAP_PASS',
  'TUTOR_DAILY_TOKEN_BUDGET', 'PRIVATE_EMAIL_USER', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_SUBJECT', 'PAYPAL_ENVIRONMENT', 'PAYPAL_WEBHOOK_ID',
  'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN',
];
function environmentEvidence(environment) {
  if (!Array.isArray(environment?.envs)) throw Error('HOSTING_ENV_RESPONSE_INVALID');
  const scopes = ['production', 'preview', 'development'];
  // An incomplete or malformed inventory must not look like confirmed absence.
  if (environment.pagination?.next != null || environment.envs.some(entry =>
    !entry || typeof entry.key !== 'string' || !entry.key ||
    !(typeof entry.target === 'string' || Array.isArray(entry.target)) ||
    (Array.isArray(entry.target) ? entry.target : [entry.target]).some(scope => !scopes.includes(scope)) ||
    (entry.gitBranch != null && typeof entry.gitBranch !== 'string') ||
    (entry.customEnvironmentId != null && typeof entry.customEnvironmentId !== 'string')))
    throw Error('HOSTING_ENV_RESPONSE_INVALID');
  return Object.fromEntries(keys.map(key => {
    const entries = environment.envs.filter(entry => entry?.key === key);
    return [key, {
      scopes: scopes.filter(scope => entries.some(entry =>
        (Array.isArray(entry.target) ? entry.target : [entry.target]).includes(scope))),
      branchScoped: entries.some(entry => typeof entry.gitBranch === 'string' && entry.gitBranch.length > 0),
      customScoped: entries.some(entry => typeof entry.customEnvironmentId === 'string' && entry.customEnvironmentId.length > 0),
    }];
  }));
}
module.exports = { environmentEvidence };
