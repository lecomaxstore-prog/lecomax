import { NextRequest } from 'next/server';
import { mobileOwner, mobileJson } from '@/lib/learning-mobile-auth';
import { sensitiveRateLimit } from '@/lib/sensitive-rate-limit';

export async function POST(req: NextRequest) {
  let owner: string | null;
  try { owner = await mobileOwner(req); } catch { return mobileJson({ error: 'UNAVAILABLE' }, 503); }
  if (!owner) return mobileJson({ error: 'OWNER_LOGIN_REQUIRED' }, 401);
  const limited = await sensitiveRateLimit(req, 'learning-mobile-phone-invitation', owner, true);
  if (limited) return limited;
  const key = process.env.PHONE_RELAY_KEY || '';
  if (!/^[a-f0-9]{64}$/.test(key)) return mobileJson({ error: 'PHONE_RELAY_NOT_CONFIGURED' }, 503);
  try {
    const response = await fetch('https://phone.lecomax.com/invitations', {
      method: 'POST', headers: { Authorization: `Bearer ${key}` }, cache: 'no-store',
      signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!response.ok) return mobileJson({ error: 'PHONE_RELAY_UNAVAILABLE' }, 503);
    const result = await response.json();
    if (!/^[a-f0-9]{32}$/.test(result.id) || !/^[a-f0-9]{64}$/.test(result.shareToken) ||
      !/^[a-f0-9]{64}$/.test(result.viewerToken) || !Number.isFinite(result.expiresAt)) throw Error('Invalid relay response');
    return mobileJson({ id: result.id, shareToken: result.shareToken, viewerToken: result.viewerToken, expiresAt: result.expiresAt });
  } catch { return mobileJson({ error: 'PHONE_RELAY_UNAVAILABLE' }, 503); }
}
