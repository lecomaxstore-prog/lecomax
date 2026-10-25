import { createHash } from 'node:crypto';
export function workerEnv(input) {
  const key = `sb_secret_${input.SEO_SYNC_SERVICE_ROLE_KEY}`;
  return { APP_ENV: 'production', SEO_RUNTIME_ENV: 'production', ...input,
    SEO_SYNC_SERVICE_ROLE_KEY: key,
    SEO_SYNC_KEY_BINDING: 'yddqwgdgeljkzfsmtein:' + createHash('sha256').update(key).digest('hex') };
}
