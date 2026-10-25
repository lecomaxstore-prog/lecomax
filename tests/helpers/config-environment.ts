import { createHash } from 'node:crypto';

// Offline configuration fixture; real credentials and external integrations are excluded.
export function configEnvironment() {
  const previous = process.env;
  const binding = (value: string) => 'local:' + createHash('sha256').update(value).digest('hex');
  process.env = {
    ...Object.fromEntries(['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP'].filter(key => previous[key]).map(key => [key, previous[key]])),
    NODE_ENV: 'test', APP_ENV: 'development', NEXT_PUBLIC_APP_ENV: 'development',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service',
    NEXT_PUBLIC_SUPABASE_KEY_BINDING: binding('synthetic-anon'),
    SUPABASE_SERVICE_KEY_BINDING: binding('synthetic-service'),
    ADMIN_SESSION_SECRET: 'offline-config-fixture-not-a-real-secret',
  };
  return () => { process.env = previous; };
}
