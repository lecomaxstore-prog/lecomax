export type PhonePairing = { origin: string; code: string };

/** QR pairing accepts only the existing private Tailscale transport. */
export function parsePhonePairingPayload(value: unknown): PhonePairing | null {
  if (typeof value !== 'string' || value.length > 160) return null;
  const parts = value.split('|');
  const [address, code] = parts;
  if (parts.length !== 2 || !address || !code || !/^[a-f0-9]{32}$/.test(code)) return null;
  try {
    const url = new URL(address);
    const ip = url.hostname.split('.').map(Number);
    if (url.protocol !== 'http:' || url.port !== '8092' || url.origin !== address ||
      ip.length !== 4 || ip[0] !== 100 || (ip[1] ?? 0) < 64 || (ip[1] ?? 256) > 127 ||
      !ip.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) return null;
    return { origin: url.origin, code };
  } catch { return null; }
}

export function phonePairingQr(origin: string, code: string): string | null {
  const payload = `${origin}|${code}`;
  return parsePhonePairingPayload(payload) ? `lecomax-learn://phone?pair=${encodeURIComponent(payload)}` : null;
}

export function parsePhonePairingQr(value: string): PhonePairing | null {
  if (value.length > 512) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'lecomax-learn:' || url.hostname !== 'phone' || url.pathname ||
      url.username || url.password || url.port || url.hash ||
      [...url.searchParams.keys()].length !== 1 || !url.searchParams.has('pair')) return null;
    return parsePhonePairingPayload(url.searchParams.get('pair'));
  } catch { return null; }
}
