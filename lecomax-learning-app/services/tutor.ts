import { auth, API } from './auth';
import { readTutorReply, type TutorAttachment } from '../utils/tutor-contract';
import type { TutorSession } from '../utils/tutor-memory';
import type { LearnerProfile } from '../utils/academy';
import { teacherProfile } from '../utils/academy';
import { Platform } from 'react-native';
export async function requestTutor(
  session: TutorSession,
  message: string,
  options: {
    language: string;
    profile?: LearnerProfile;
    context: string;
    action: string;
    conversationLanguage: string;
    exam: { type: string; minutes: number; target: string; difficulty: string };
    attachment?: TutorAttachment;
    signal: AbortSignal;
    onPartial?: (text: string) => void;
  },
) {
  const token = await auth.token();
  if (!token) throw new Error('OWNER_LOGIN_REQUIRED');
  const { signal, onPartial, ...body } = options;
  const response = await fetch(API + '/api/learning-mobile/tutor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: Platform.OS === 'web' ? 'application/x-ndjson' : 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...body,
      profile: teacherProfile(body.profile),
      mode: session.mode,
      goal: session.goal,
      summary: session.summary,
      message,
      history: session.messages.slice(-6).map((m) => ({ ...m, content: m.content.slice(0, 4000) })),
    }),
    signal,
  });
  let result;
  if (
    response.ok &&
    response.headers.get('content-type')?.includes('application/x-ndjson') &&
    response.body
  ) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > 8_000_000) throw new Error('INVALID_AI_RESPONSE');
        buffer += decoder.decode(value, { stream: true });
        let end;
        while ((end = buffer.indexOf('\n')) >= 0) {
          const event = JSON.parse(buffer.slice(0, end));
          buffer = buffer.slice(end + 1);
          if (
            event.type === 'partial' &&
            typeof event.answer === 'string' &&
            event.answer.length <= 12000
          )
            onPartial?.(event.answer);
          if (event.type === 'complete') result = event;
          if (event.type === 'error') throw new Error('TEACHER_UNAVAILABLE');
        }
      }
      if (!result || buffer.trim()) throw new Error('INVALID_AI_RESPONSE');
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } else result = await response.json().catch(() => null);
  if (response.status === 401) await auth.invalidate();
  if (!response.ok)
    throw new Error(
      result?.error === 'USAGE_LIMIT'
        ? 'USAGE_LIMIT'
        : response.status === 429
          ? 'RATE_LIMIT'
          : result?.error || 'TEACHER_UNAVAILABLE',
    );
  return {
    reply: readTutorReply(result?.reply),
    model: typeof result?.model === 'string' ? result.model : '',
    usage: result?.usage as
      | {
          inputTokens: number;
          outputTokens: number;
          estimatedUSD: number | null;
          remaining: number;
        }
      | undefined,
  };
}
