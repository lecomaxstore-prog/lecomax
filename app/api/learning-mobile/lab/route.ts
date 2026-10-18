import { NextRequest } from 'next/server';
import { mobileJson, mobileOwner } from '@/lib/learning-mobile-auth';
import { readJsonLimited } from '@/lib/request-body';
import { executeLab, labAllowed, labInput } from '@/lib/teacher-lab';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  if (!labAllowed(req.url, req.headers.get('origin'))) return mobileJson({ error: 'LOCAL_LAB_ONLY' }, 403);
  try {
    if (!await mobileOwner(req)) return mobileJson({ error: 'OWNER_LOGIN_REQUIRED' }, 401);
    const input = labInput(await readJsonLimited(req, 50000).catch(() => null));
    if (!input) return mobileJson({ error: 'INVALID_INPUT' }, 400);
    return mobileJson(await executeLab(input.runtime, input.code, req.signal));
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return mobileJson({ error: code === 'LAB_BUSY' ? code : 'LAB_UNAVAILABLE' }, code === 'LAB_BUSY' ? 409 : 503);
  }
}
