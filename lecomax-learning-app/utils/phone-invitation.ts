export type PhoneInvitation = { origin: string; token: string };

export function parsePhoneInvitation(value: unknown): PhoneInvitation | null {
  if (typeof value !== 'string' || value.length > 160) return null;
  const parts = value.split('|');
  const [address, token] = parts;
  if (parts.length !== 2 || !address || !token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const url = new URL(address);
    const ip = url.hostname.split('.').map(Number);
    if (url.origin !== address || url.protocol !== 'http:' || url.port !== '8093' ||
      ip.length !== 4 || ip[0] !== 100 || (ip[1] ?? 0) < 64 || (ip[1] ?? 256) > 127 ||
      !ip.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) return null;
    return { origin: url.origin, token };
  } catch { return null; }
}

export function phoneInvitationLink(value: string): string | null {
  return parsePhoneInvitation(value) ? `https://lecomax.com/phone-invite.html#invite=${encodeURIComponent(value)}` : null;
}

export function phoneInvitationAppLink(value: string): string | null {
  return parsePhoneInvitation(value) ? `lecomax-learn://phone?invite=${encodeURIComponent(value)}` : null;
}

/** Recover only our exact HTTPS handoff or legacy app link, never arbitrary URLs. */
export function phoneInvitationPayload(value: string): string | null {
  if (value.length > 1024) return null;
  try {
    const url = new URL(value.trim());
    let params: URLSearchParams;
    if (url.origin === 'https://lecomax.com' && url.pathname === '/phone-invite.html' && !url.search && !url.username && !url.password) {
      params = new URLSearchParams(url.hash.slice(1));
    } else if (url.protocol === 'lecomax-learn:' && url.hostname === 'phone' && !url.pathname && !url.hash && !url.port && !url.username && !url.password) {
      params = url.searchParams;
    } else return null;
    if ([...params.keys()].length !== 1 || !params.has('invite')) return null;
    const payload = params.get('invite');
    return parsePhoneInvitation(payload) ? payload : null;
  } catch { return null; }
}
