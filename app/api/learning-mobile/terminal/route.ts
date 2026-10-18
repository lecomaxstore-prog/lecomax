import { NextRequest } from 'next/server';
import { mobileJson, mobileOwner } from '@/lib/learning-mobile-auth';
import { labAllowed } from '@/lib/teacher-lab';
import { readJsonLimited } from '@/lib/request-body';
import { terminalAction } from '@/lib/teacher-terminal';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  if (!labAllowed(req.url, req.headers.get('origin'))) return mobileJson({ error: 'LOCAL_LAB_ONLY' }, 403);
  try {
    const owner = await mobileOwner(req);
    if (!owner) return mobileJson({ error: 'OWNER_LOGIN_REQUIRED' }, 401);
    return mobileJson(terminalAction(owner, await readJsonLimited(req, 50000).catch(() => null)));
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const known = ['INVALID_INPUT', 'TERMINAL_NOT_FOUND', 'TERMINAL_EXITED', 'TERMINAL_LIMIT', 'RUNTIME_NOT_INSTALLED'].includes(code);
    return mobileJson({ error: known ? code : 'TERMINAL_UNAVAILABLE' }, code === 'INVALID_INPUT' ? 400 : code === 'TERMINAL_NOT_FOUND' ? 404 : known ? 409 : 503);
  }
}
