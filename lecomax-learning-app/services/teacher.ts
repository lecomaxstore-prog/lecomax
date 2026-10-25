import type { learningContext } from '../utils/learning-memory';
import type { LearnerProfile } from '../utils/academy';
import { teacherProfile } from '../utils/academy';
import {auth,API} from './auth';
export {API};
export const token=()=>auth.token();
export const logout=()=>auth.logout();
async function request(path: string, body: unknown, access?: string, signal?: AbortSignal) {
  const abort = new AbortController();
  const cancel = () => abort.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) abort.abort();
  const course = !!body && typeof body === 'object' && 'mode' in body && body.mode === 'study-plan';
  const timer = setTimeout(() => abort.abort(), path.endsWith('/auth') ? 15000 : course ? 195000 : 85000);
  try {
    const r = await fetch(API + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: JSON.stringify(body),
      signal: abort.signal,
    });
    const result = await r.json().catch(() => ({ error: 'SERVER_UNAVAILABLE' }));
    if (!r.ok) {
      if (r.status === 401) await auth.invalidate();
      throw new Error(r.status === 429 ? 'RATE_LIMIT' : result.error || 'SERVER_UNAVAILABLE');
    }
    return result as {
      accessToken?: string;
      answer?: string;
      model?: string;
      sources?: { path: string; startLine: number; endLine: number }[];
    };
  } catch (e) {
    if (signal?.aborted) throw new Error('REQUEST_CANCELLED');
    if (
      e instanceof Error &&
      [
        'OWNER_LOGIN_REQUIRED',
        'RATE_LIMIT',
        'SENSITIVE_CONTENT',
        'SOURCE_UNAVAILABLE',
        'TEACHER_UNAVAILABLE',
        'SERVER_UNAVAILABLE',
        'INVALID_INPUT',
        'UNAVAILABLE',
      ].includes(e.message)
    )
      throw e;
    throw new Error('NETWORK_OR_TIMEOUT');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export type Message = { role: 'user' | 'assistant'; content: string };
export type TeacherOptions = {
  profile?: LearnerProfile;
  learning?: ReturnType<typeof learningContext>;
  topic?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  lesson?: { title: string; concept: string };
  signal?: AbortSignal;
};
export async function askTeacherReply(
  message: string,
  language: string,
  mode: string,
  file: string,
  history: Message[],
  options: TeacherOptions = {},
) {
  const access = await token();
  if (!access) throw new Error('OWNER_LOGIN_REQUIRED');
  const r = await request(
    '/api/learning-mobile/teacher',
    {
      message,
      language,
      mode,
      topic: options.topic,
      learning: options.learning,
      profile: teacherProfile(options.profile),
      level: options.level,
      lesson: options.lesson,
      ...(file ? { file } : {}),
      history: history.slice(-8).map((m) => ({ ...m, content: m.content.slice(0, 8000) })),
    },
    access,
    options.signal,
  );
  if (!r.answer) throw new Error('TEACHER_UNAVAILABLE');
  const answer = (
    r.answer +
    (r.sources?.length
      ? '\n\n' + r.sources.map((s) => `${s.path}:${s.startLine}–${s.endLine}`).join('\n')
      : '')
  );
  return { answer, model: r.model };
}
export async function askTeacher(message: string, language: string, mode: string, file: string, history: Message[], options: TeacherOptions = {}) {
  return (await askTeacherReply(message, language, mode, file, history, options)).answer;
}
