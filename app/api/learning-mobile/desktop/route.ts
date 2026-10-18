import { NextRequest } from 'next/server';
import { mobileJson, mobileOwner } from '@/lib/learning-mobile-auth';
import { labAllowed } from '@/lib/teacher-lab';
import { startDesktop, stopDesktop } from '@/lib/kali-desktop';
import { readJsonLimited } from '@/lib/request-body';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!labAllowed(req.url, origin)) return mobileJson({ error: 'LOCAL_LAB_ONLY' }, 403);
  try {
    const owner = await mobileOwner(req);
    if (!owner) return mobileJson({ error: 'OWNER_LOGIN_REQUIRED' }, 401);
    const body = await readJsonLimited(req, 1000).catch(() => null);
    if (body?.action === 'start') return mobileJson(await startDesktop(owner, origin!));
    if (body?.action === 'stop' && typeof body.id === 'string') { await stopDesktop(owner, body.id); return mobileJson({ stopped: true }); }
    return mobileJson({ error: 'INVALID_INPUT' }, 400);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const known = ['DESKTOP_BUSY', 'DESKTOP_NOT_FOUND', 'DESKTOP_START_TIMEOUT', 'DESKTOP_START_FAILED'];
    return mobileJson({ error: known.includes(code) ? code : 'DESKTOP_UNAVAILABLE' }, code === 'DESKTOP_NOT_FOUND' ? 404 : code === 'DESKTOP_BUSY' ? 409 : 503);
  }
}
