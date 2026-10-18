import { NextRequest } from 'next/server';
import { mobileJson, mobileOwner } from '@/lib/learning-mobile-auth';
import { readJsonLimited } from '@/lib/request-body';
import { labAllowed } from '@/lib/teacher-lab';
import { validWebFiles, saveTeacherWorkspace } from '@/lib/teacher-workspace';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  if (!labAllowed(req.url, req.headers.get('origin'))) return mobileJson({ error: 'LOCAL_LAB_ONLY' }, 403);
  try {
    if (!await mobileOwner(req)) return mobileJson({ error: 'OWNER_LOGIN_REQUIRED' }, 401);
    const files = await readJsonLimited(req, 250000).catch(() => null);
    if (!validWebFiles(files)) return mobileJson({ error: 'INVALID_INPUT' }, 400);
    return mobileJson(await saveTeacherWorkspace(files));
  } catch { return mobileJson({ error: 'WORKSPACE_UNAVAILABLE' }, 503); }
}
