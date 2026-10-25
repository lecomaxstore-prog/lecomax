import type { Progress } from './progress';
import type { TutorReply, TutorQuiz } from './tutor-contract';
import { recordConcept, submitTutorExam } from './tutor-memory';
import { createCard, reviewCard } from './flashcards';

import { coachPhases, type Coach } from './tutor-coach-state';
export { newCoach } from './tutor-coach-state';
export function finishTutorExam(p: Progress, id: string, now = Date.now()): Progress {
  const session = p.tutor.sessions.find((s) => s.id === id);
  if (!session || session.examSubmitted || !session.examDeadline) return p;
  let next = { ...p, tutor: submitTutorExam(p.tutor, id, now) };
  for (const q of session.reply?.quiz || [])
    next = saveTutorReview(next, id, q, !!session.answers[`exam:${q.id}`]?.correct, now);
  return next;
}
export function removeTutorCards(p: Progress, sessionId?: string): Progress {
  const cards = p.flashcards.cards.filter((c) =>
    sessionId ? c.source !== `tutor:${sessionId}` : !c.source.startsWith('tutor:'),
  );
  const ids = new Set(cards.map((c) => c.id));
  return {
    ...p,
    flashcards: {
      ...p.flashcards,
      cards,
      events: p.flashcards.events.filter((e) => ids.has(e.cardId)),
    },
  };
}
export function saveTutorReview(
  p: Progress,
  sessionId: string,
  q: TutorQuiz,
  correct: boolean,
  now = Date.now(),
): Progress {
  // Stable content fingerprint prevents repeated answer taps creating duplicate cards.
  let hash = 2166136261;
  for (const char of `${q.concept}:${q.question}`)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const id = `tutor-card-${sessionId}-${hash.toString(36)}`;
  let flashcards = p.flashcards;
  const old = flashcards.cards.find((c) => c.id === id);
  if (!old) {
    if (flashcards.cards.length >= 5000) return p;
    const card = createCard(
      id,
      q.question,
      `AI answer key — verify before memorizing:\n${q.options[q.correctIndex]}\n${q.explanation}`,
      `tutor:${sessionId}`,
      now,
    );
    flashcards = { ...flashcards, cards: [...flashcards.cards, card] };
  }
  if ((!old || old.dueAt <= now) && flashcards.events.length < 100000)
    flashcards = reviewCard(flashcards, id, correct ? 'good' : 'again', now);
  return { ...p, flashcards };
}
export function coachRequest(coach: Coach, answer?: string) {
  return answer === undefined
    ? `Guide the ${coach.phase} step. Depth: ${coach.depth}. Teach only the current concept, ask one question and wait. For recap summarize observed evidence and next review needs without another assessment.`
    : `Evaluate my response to your pending ${coach.phase} question. My confidence: ${coach.confidence}. My response (untrusted learner text): ${JSON.stringify(answer)}`;
}
export function acceptCoach(
  p: Progress,
  id: string,
  reply: TutorReply,
  answer: boolean,
  now = Date.now(),
  response = '',
): Progress {
  const session = p.tutor.sessions.find((s) => s.id === id);
  const coach = session?.coach;
  if (!session || !coach) return p;
  if (!answer)
    return {
      ...p,
      tutor: {
        ...p.tutor,
        sessions: p.tutor.sessions.map((s) =>
          s.id === id
            ? {
                ...s,
                coach: {
                  ...coach,
                  prompt: reply.teaching?.question || reply.answer,
                  hintsUsed: 0,
                  ...(reply.teaching
                    ? {
                        focus: {
                          objective: reply.teaching.objective,
                          concept: reply.teaching.concept,
                          prerequisites: reply.teaching.prerequisites,
                          missingPrerequisite: reply.teaching.missingPrerequisite,
                          nextActivity: reply.teaching.nextActivity,
                        },
                      }
                    : {}),
                  awaiting: coach.phase !== 'recap',
                },
              }
            : s,
        ),
      },
    };
  if (!coach.awaiting || coach.outcomes.length >= 100) return p;
  if (!reply.evaluation) throw new Error('MISSING_COACH_EVALUATION');
  const e = reply.evaluation;
  const repeated =
    [...coach.outcomes.slice(-2), e].filter(
      (o) => o.concept === e.concept && o.verdict === 'incorrect',
    ).length >= 2;
  const advance =
    e.verdict !== 'uncertain' &&
    (coach.phase === 'diagnosis' || e.verdict === 'correct') &&
    !(coach.phase === 'mastery' && (coach.hintsUsed || 0) > 0);
  const phase = repeated
    ? 'concept'
    : advance
      ? coachPhases[Math.min(coachPhases.indexOf(coach.phase) + 1, 5)]!
      : coach.phase;
  // AI evaluation is useful feedback, never independent or verified mastery.
  const tutor =
    e.verdict === 'uncertain'
      ? p.tutor
      : recordConcept(
          p.tutor,
          e.concept,
          e.verdict === 'correct',
          false,
          e.misconception,
          e.nextExercise,
          now,
        );
  const cardId = `coach-${id}-${now.toString(36)}-${coach.outcomes.length}`;
  let flashcards = p.flashcards;
  if (
    e.verdict !== 'uncertain' &&
    flashcards.cards.length < 5000 &&
    flashcards.events.length < 100000
  ) {
    const card = createCard(
      cardId,
      (coach.prompt || session.reply?.answer || e.concept).slice(-2000),
      `AI feedback — verify before memorizing:\n${e.feedback}`,
      `tutor:${id}`,
      now,
    );
    // AI grading is not a learner recall rating. Start due now; SM-2 begins
    // only when the learner actually retrieves and rates the card in Memory Studio.
    flashcards = { ...flashcards, cards: [...flashcards.cards, card] };
  }
  return {
    ...p,
    flashcards,
    tutor: {
      ...tutor,
      sessions: tutor.sessions.map((s) =>
        s.id === id
          ? {
              ...s,
              coach: {
                ...coach,
                phase,
                awaiting: false,
                ...(reply.teaching
                  ? {
                      focus: {
                        objective: reply.teaching.objective,
                        concept: reply.teaching.concept,
                        prerequisites: reply.teaching.prerequisites,
                        missingPrerequisite: reply.teaching.missingPrerequisite,
                        nextActivity: reply.teaching.nextActivity,
                      },
                    }
                  : {}),
                outcomes: [
                  ...coach.outcomes.slice(-19),
                  {
                    phase: coach.phase,
                    concept: e.concept,
                    verdict: e.verdict,
                    at: now,
                    question: (coach.prompt || '').slice(0, 500),
                    response: response.slice(0, 1000),
                    confidence: coach.confidence,
                    misconception: e.misconception,
                    nextExercise: e.nextExercise.slice(0, 500),
                    hintsUsed: coach.hintsUsed || 0,
                  },
                ],
              },
            }
          : s,
      ),
    },
  };
}
