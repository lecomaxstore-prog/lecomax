/** API keys identify the application; only access tokens identify signed-in users.
 * Target, key-role and binding validation must happen before using these headers.
 */
export function supabaseHeaders(key, accessToken) {
  if (typeof key !== 'string' || !key.trim()) throw Error('SUPABASE_KEY_REQUIRED');
  if (accessToken !== undefined && (typeof accessToken !== 'string' ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken))) {
    throw Error('SUPABASE_ACCESS_TOKEN_REQUIRED');
  }
  const bearer = accessToken ?? (/^sb_(publishable|secret)_/.test(key) ? undefined : key);
  return { apikey: key, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) };
}
