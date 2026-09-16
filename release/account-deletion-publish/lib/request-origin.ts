/** Cookie-authenticated mutations must originate from this application. */
export function sameRequestOrigin(req: { url: string; headers: Headers }) {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const expected = new URL(req.url);
    const supplied = new URL(origin);
    // Never trust caller-controlled X-Forwarded-Host to authorize an origin.
    const host = req.headers.get("host") || expected.host;
    return supplied.host === host && supplied.protocol === expected.protocol && !supplied.username && !supplied.password;
  } catch { return false; }
}
