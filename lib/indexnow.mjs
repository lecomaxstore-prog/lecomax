import { environment } from '../operations/seo-vercel/lib/environment-target.mjs';

/** One transport for application publication, admin submissions and release tooling. */
export function indexNowPayload(env, urls) {
  try {
    if (environment(env) !== 'production' || env.NODE_ENV !== 'production' ||
        env.NEXT_PUBLIC_APP_ENV !== 'production' || env.INDEXNOW_ENABLED !== 'true' ||
        env.NEXT_PUBLIC_SITE_URL !== 'https://lecomax.com' ||
        !/^[a-zA-Z0-9-]{8,128}$/.test(env.INDEXNOW_KEY ?? '')) return null;
    if (!Array.isArray(urls) || !urls.length || urls.length > 10_000) return null;
    const urlList = [...new Set(urls.map(value => {
      if (typeof value !== 'string' || value !== value.trim()) throw Error('URL');
      const url = new URL(value);
      if (url.origin !== 'https://lecomax.com' || url.username || url.password ||
          url.hash || url.port) throw Error('URL');
      return url.href;
    }))];
    return { host: 'lecomax.com', key: env.INDEXNOW_KEY,
      keyLocation: `https://lecomax.com/${env.INDEXNOW_KEY}.txt`, urlList };
  } catch { return null; }
}

export async function sendIndexNow(urls, { env = process.env, fetcher = fetch } = {}) {
  const payload = indexNowPayload(env, urls);
  if (!payload) return { ok: false, status: 503 };
  const response = await fetcher('https://api.indexnow.org/indexnow', {
    method: 'POST', redirect: 'error', cache: 'no-store',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000),
  });
  return { ok: response.ok, status: response.status };
}
