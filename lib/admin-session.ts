/**
 * HMAC-signed admin session tokens.
 * Uses the Web Crypto API — works in both the Next.js Edge runtime (middleware)
 * and the Node.js runtime (API routes), since Node ≥ 18 exposes `crypto.subtle` globally.
 *
 * Token format (before base64url encoding):
 *   "<timestamp_ms>:<email>.<hmac_sha256_hex>"
 *
 * Signing key is derived from SUPABASE_SERVICE_ROLE_KEY so no new env var is needed.
 */

const ENCODER = new TextEncoder();

function getKeyMaterial(): Uint8Array<ArrayBuffer> {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_NOT_CONFIGURED");
  return ENCODER.encode(secret) as Uint8Array<ArrayBuffer>;
}

async function importHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    getKeyMaterial(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

/** Base64url encode (no padding). */
function b64uEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Base64url decode (handles missing padding). */
function b64uDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const rem = padded.length % 4;
  return atob(rem ? padded + "=".repeat(4 - rem) : padded);
}

/**
 * Create a signed session token for `email`.
 * Embed the timestamp so the token carries its own expiry info.
 */
export async function createSessionToken(email: string, maxAgeMs = 86_400_000): Promise<string> {
  const timestamp = Date.now();
  const age = Math.max(1, Math.min(maxAgeMs, 30 * 86_400_000));
  const payload = `${timestamp}:${email}:${timestamp + age}`;

  const key = await importHmacKey("sign");
  const sigBuf = await crypto.subtle.sign("HMAC", key, ENCODER.encode(payload));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return b64uEncode(`${payload}.${sigHex}`);
}

/**
 * Verify a signed session token.
 * Returns the email if valid & not expired, otherwise `null`.
 *
 * maxAgeMs defaults to 30 days (matching the longest remember-me cookie lifetime).
 */
export async function verifySessionToken(
  token: string,
  maxAgeMs = 86_400_000 * 30
): Promise<string | null> {
  try {
    if (token.length > 4096) return null;
    const decoded = b64uDecode(token);
    // Use lastIndexOf because the email in the payload can contain dots (e.g. admin@lecomax.com)
    // but the sigHex (hex digits only) never contains dots — so the last dot is always the separator.
    const dotIdx = decoded.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const payload = decoded.slice(0, dotIdx);
    const sigHex = decoded.slice(dotIdx + 1);
    if (!/^[a-f0-9]{64}$/.test(sigHex)) return null;

    // Re-compute expected HMAC and do constant-time comparison
    const key = await importHmacKey("verify");
    const sigBytes = new Uint8Array(
      (sigHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      ENCODER.encode(payload)
    );
    if (!valid) return null;

    // Parse payload: "<timestamp>:<email>"
    const colonIdx = payload.indexOf(":");
    if (colonIdx === -1) return null;
    const timestamp = parseInt(payload.slice(0, colonIdx), 10);
    const remainder = payload.slice(colonIdx + 1);
    const expirySeparator = remainder.lastIndexOf(":");
    const email = expirySeparator >= 0 ? remainder.slice(0, expirySeparator) : remainder;
    const expiresAt = expirySeparator >= 0 ? Number(remainder.slice(expirySeparator + 1)) : timestamp + Math.min(maxAgeMs, 86_400_000);

    if (isNaN(timestamp) || !email) return null;
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || expiresAt > timestamp + 30 * 86_400_000) return null;

    // Reject expired tokens
    if (timestamp > Date.now() + 60_000 || Date.now() - timestamp > maxAgeMs) return null;

    return email;
  } catch {
    return null;
  }
}

/**
 * Create a signed token encoding a staff member's permission slugs.
 * Format (before base64url): `<json_array>.<hmac_sha256_hex>`
 */
export async function createStaffPermissionsToken(permissions: string[]): Promise<string> {
  const payload = JSON.stringify(permissions);
  const key = await importHmacKey("sign");
  const sigBuf = await crypto.subtle.sign("HMAC", key, ENCODER.encode(payload));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return b64uEncode(`${payload}.${sigHex}`);
}

/**
 * Verify a signed staff-permissions token.
 * Returns the permissions array if valid, or `null` if tampered / malformed.
 */
export async function verifyStaffPermissionsToken(token: string): Promise<string[] | null> {
  try {
    const decoded = b64uDecode(token);
    const dotIdx = decoded.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const payload = decoded.slice(0, dotIdx);
    const sigHex  = decoded.slice(dotIdx + 1);

    const key = await importHmacKey("verify");
    const sigBytes = new Uint8Array(
      (sigHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, ENCODER.encode(payload));
    if (!valid) return null;

    const perms = JSON.parse(payload);
    if (!Array.isArray(perms)) return null;
    return perms as string[];
  } catch {
    return null;
  }
}
