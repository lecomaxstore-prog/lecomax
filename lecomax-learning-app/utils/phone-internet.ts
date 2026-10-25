export const PHONE_INTERNET_ORIGIN = 'https://phone.lecomax.com';
export type InternetInvitation = { id: string; token: string };
export function parseInternetInvitation(value: unknown): InternetInvitation | null {
  if (typeof value !== 'string' || value.length !== 106) return null;
  const [kind, id, token, extra] = value.split('|');
  return kind === 'internet' && id && token && extra === undefined && /^[a-f0-9]{32}$/.test(id) && /^[a-f0-9]{64}$/.test(token) ? { id, token } : null;
}
export function internetInvitationLink(id: string, token: string): string | null {
  const payload = `internet|${id}|${token}`;
  return parseInternetInvitation(payload) ? `https://lecomax.com/phone-invite.html#invite=${encodeURIComponent(payload)}` : null;
}
