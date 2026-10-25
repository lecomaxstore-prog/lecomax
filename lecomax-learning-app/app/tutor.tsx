import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, Page, Row } from '../components/UI';
import { TeacherMessage } from '../components/TeacherMessage';
import { TutorMedia } from '../components/TutorMedia';
import { TutorDiagram } from '../components/TutorDiagram';
import { TutorCoach } from '../components/TutorCoach';
import { TutorTeachingCard } from '../components/TutorTeachingCard';
import { CloudProgress } from '../components/CloudProgress';
import {
  acceptCoach,
  coachRequest,
  saveTutorReview,
  finishTutorExam,
  removeTutorCards,
  newCoach,
} from '../utils/tutor-coach';
import { useSchool } from '../store/School';
import { requestTutor } from '../services/tutor';
import { boundedTutorContext } from '../utils/tutor-context';
import { tutorWorldContext } from '../features/world/content';
import { discoveryContext } from '../features/curiosity/catalog';
import { playerContext, readPlayer, PLAYER_KEY } from '../features/curiosity/player-model';
import {
  acceptTutorReply,
  compactTutorMemory,
  emptyTutor,
  newTutorSession,
  recordConcept,
  type TutorSession,
} from '../utils/tutor-memory';
import {
  tutorModes,
  type TutorAttachment,
  type TutorMode,
  type TutorQuiz,
} from '../utils/tutor-contract';

export default function TutorWorkspace() {
  const { state } = useSchool();
  return <TutorWorkspaceBody key={state.tutor.active} />;
}
function TutorWorkspaceBody() {
  const { state, update, t } = useSchool();
  const params = useLocalSearchParams<{
    plan?: string;
    step?: string;
    goal?: string;
    world?: string;
  }>();
  const memory = state.tutor;
  const session = memory.sessions.find((s) => s.id === memory.active);
  const [goal, setGoal] = useState(
    typeof params.goal === 'string' ? params.goal.slice(0, 300) : state.academy.profile.goal,
  );
  const [mode, setMode] = useState<TutorMode>('zero');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<TutorAttachment>();
  const [partial, setPartial] = useState('');
  const [lastRequest, setLastRequest] = useState<{ message: string; action: string }>();
  const [showMemory, setShowMemory] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [conversationLanguage, setConversationLanguage] = useState(
    session?.settings?.conversationLanguage || 'English',
  );
  const [examType, setExamType] = useState(session?.settings?.examType || 'Practice');
  const [minutes, setMinutes] = useState(session?.settings?.minutes || '20');
  const [target, setTarget] = useState(session?.settings?.target || '80%');
  const [difficulty, setDifficulty] = useState<string>(
    session?.settings?.difficulty || state.academy.profile.level,
  );
  const [clock, setClock] = useState(Date.now);
  const [usage, setUsage] = useState('');
  const abort = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const labels = [
    t('Partir de zéro', 'Learn from zero', 'تعلّم من الصفر'),
    t('Tout expliquer', 'Explain anything', 'اشرح أي شيء'),
    t('Socratique', 'Socratic teacher', 'المعلم السقراطي'),
    t('Devoirs', 'Homework', 'الواجبات'),
    t('Préparer un examen', 'Exam preparation', 'التحضير للامتحان'),
    t('Conversation', 'Conversation practice', 'تدريب المحادثة'),
    t('Mentor code', 'Programming mentor', 'مرشد البرمجة'),
    t('Défi', 'Learning challenge', 'تحدي التعلّم'),
    t('Explication débutant', 'Explain like a beginner', 'اشرح للمبتدئ'),
    t('Mode expert', 'Expert mode', 'وضع الخبير'),
    t('Détecter mon erreur', 'Detect my mistake', 'اكتشف خطئي'),
    t('Enseigner autrement', 'Teach me differently', 'علّمني بطريقة أخرى'),
    t('Méthode Feynman', 'Feynman mode', 'طريقة فاينمان'),
    t('Vie réelle', 'Real-world mode', 'تطبيقات واقعية'),
    t('Coach mémoire', 'Memory coach', 'مدرب الذاكرة'),
    t('Mentor de projet', 'Project mentor', 'مرشد المشاريع'),
    t('Réflexion', 'Learning reflection', 'تأمل التعلم'),
  ];
  const linkedPlan = state.academy.plans.find((p) => p.id === params.plan);
  const linkedLesson = linkedPlan?.lessons[Number(params.step)];
  const amend = (id: string, change: (s: TutorSession) => TutorSession) =>
    update((p) => ({
      ...p,
      tutor: { ...p.tutor, sessions: p.tutor.sessions.map((s) => (s.id === id ? change(s) : s)) },
    }));
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!session?.examDeadline || session.examSubmitted) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session?.examDeadline, session?.examSubmitted]);
  useEffect(() => {
    if (session?.examDeadline && !session.examSubmitted && clock >= session.examDeadline)
      update((p) => finishTutorExam(p, session.id));
  }, [clock, session?.id, session?.examDeadline, session?.examSubmitted, update]);
  const start = () => {
    if (!goal.trim()) return;
    if (memory.sessions.length >= 20) {
      setError(
        t(
          'Supprimez une session pour en créer une autre (20 maximum).',
          'Delete a session before creating another (20 maximum).',
          'احذف جلسة قبل إنشاء أخرى (الحد ٢٠).',
        ),
      );
      return;
    }
    const next = newTutorSession(goal, mode);
    if (!['exam', 'conversation'].includes(mode))
      next.coach = { ...newCoach(), depth: mode === 'expert' ? 'expert' : 'beginner' };
    update((p) => ({
      ...p,
      tutor: { ...p.tutor, active: next.id, sessions: [...p.tutor.sessions, next] },
    }));
    setError('');
    setAttachment(undefined);
  };
  async function send(message: string, action = 'ask') {
    if (!session || pending.current || !message.trim()) return;
    const learnerMessage = message;
    if (
      session.coach?.awaiting &&
      action === 'ask' &&
      /^(i (don.t understand|am confused)|i.m confused|je ne comprends pas|لم أفهم|لا أفهم|ما فهمت)/i.test(
        message.trim(),
      )
    ) {
      action = 'different';
    } else if (session.coach?.awaiting && action === 'ask') {
      message = coachRequest(session.coach, learnerMessage);
      action = 'coach:answer';
    } else if (session.coach && action === 'ask') {
      action = `coach:${session.coach.phase}`;
    }
    if (message.length > 6000) {
      setError(
        t(
          'Raccourcissez votre réponse pour cet échange.',
          'Please shorten your response for this turn.',
          'يرجى اختصار إجابتك لهذه الخطوة.',
        ),
      );
      return;
    }
    if (session.examDeadline && !session.examSubmitted) {
      setError(
        t(
          'Terminez le test avant de demander des indices.',
          'Submit the test before asking for hints.',
          'سلّم الاختبار قبل طلب التلميحات.',
        ),
      );
      return;
    }
    const examMinutes = Number(minutes);
    if (!Number.isInteger(examMinutes) || examMinutes < 1 || examMinutes > 180) {
      setError(
        t('Durée : 1 à 180 minutes.', 'Duration: 1–180 minutes.', 'المدة: من ١ إلى ١٨٠ دقيقة.'),
      );
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    setPartial('');
    const controller = new AbortController();
    abort.current = controller;
    setLastRequest({ message, action });
    amend(session.id, (s) => ({
      ...s,
      settings: { conversationLanguage, examType, minutes, target, difficulty },
    }));
    const timeout = setTimeout(() => controller.abort(), 85000);
    try {
      const currentLesson = session.lesson
        ? {
            lessonId: session.lesson.lessonId,
            title: session.lesson.title,
            objectives: session.lesson.objectives,
            sections: session.lesson.sections.map((s) => ({
              title: s.title,
              text: s.text.slice(0, 600),
            })),
            examples: session.lesson.examples.map((e) => e.slice(0, 500)),
            exercises: session.lesson.exercises.map((e) => e.slice(0, 500)),
          }
        : linkedLesson;
      const concepts = compactTutorMemory(memory, session.goal)
        .slice(0, 4)
        .map((c) => ({
          ...c,
          errors: c.errors.slice(-2).map((e) => e.slice(0, 200)),
          nextExercise: c.nextExercise.slice(0, 300),
        }));
      const context = boundedTutorContext({
        discovery:
          session.discoveryId && session.discoveryStep
            ? playerContext(
                session.discoveryId,
                session.discoveryStep,
                readPlayer(state.drafts[PLAYER_KEY]),
              )
            : session.discoveryId
              ? discoveryContext(session.discoveryId)
              : typeof params.world === 'string'
                ? tutorWorldContext(params.world)
                : undefined,
        coaching: session.coach
          ? {
              ...session.coach,
              outcomes: session.coach.outcomes.slice(-8),
              prompt: session.coach.prompt?.slice(-3000),
            }
          : undefined,
        learningProgress:
          session.coach?.shareProgress === false
            ? undefined
            : {
                lastLesson: state.lastLesson,
                completedCount: state.completed.length,
                dailyMinutes: state.academy.profile.dailyMinutes,
                startingAssessment: linkedPlan?.design
                  ? linkedPlan.design.diagnostic.map((q, i) => {
                      const answer = state.academy.diagnostics?.[`${linkedPlan.id}:${i}`];
                      return {
                        objective: linkedPlan.lessons[i]?.objective,
                        result: answer ? answer.choice === q.correctIndex : null,
                        confidence: answer?.confidence,
                        evidenceKind: 'multiple-choice baseline, not mastery',
                      };
                    })
                  : undefined,
                prerequisiteLinks: linkedPlan?.design?.prerequisites,
              },
        currentLesson,
        currentStage: session.stage,
        answers: session.answers,
        concepts: session.coach?.shareProgress === false ? [] : concepts,
        priorFeedback: session.reply?.evaluation,
        clarificationAttempt:
          action === 'simpler' || action === 'different'
            ? session.messages.filter(
                (m) => m.role === 'user' && /understand|simpl|different/i.test(m.content),
              ).length + 1
            : undefined,
      });
      const result = await requestTutor(session, message, {
        language: state.language,
        profile: session.coach?.shareProgress === false ? undefined : state.academy.profile,
        context,
        action,
        conversationLanguage,
        exam: { type: examType, minutes: examMinutes, target, difficulty },
        attachment,
        signal: controller.signal,
        onPartial: setPartial,
      });
      if (controller.signal.aborted) return;
      if (action === 'coach:answer' && !result.reply.evaluation)
        throw new Error('MISSING_COACH_EVALUATION');
      const accepted = acceptTutorReply(session, result.reply, message, session.draft);
      update((p) => {
        const coached =
          action.startsWith('coach:') && action !== 'coach:reflection'
            ? acceptCoach(
                p,
                session.id,
                result.reply,
                action === 'coach:answer',
                Date.now(),
                session.draft || learnerMessage,
              )
            : p;
        return {
          ...coached,
          tutor: {
            ...coached.tutor,
            sessions: coached.tutor.sessions.map((s) =>
              s.id !== session.id
                ? s
                : {
                    ...accepted,
                    draft:
                      s.draft === session.draft &&
                      (learnerMessage === session.draft || action === 'coach:answer')
                        ? ''
                        : s.draft,
                    stage: result.reply.lesson ? 0 : s.stage,
                    complete: result.reply.lesson ? false : s.complete,
                    answers: result.reply.lesson || result.reply.quiz.length ? {} : s.answers,
                    hints: result.reply.lesson || result.reply.quiz.length ? [] : s.hints,
                    settings: s.settings,
                    coach:
                      s.coach &&
                      [
                        'hint',
                        'different',
                        'simpler',
                        'example',
                        'story',
                        'counterexample',
                        'steps',
                        'diagram',
                      ].includes(action)
                        ? { ...s.coach, hintsUsed: Math.min(3, (s.coach.hintsUsed || 0) + 1) }
                        : s.coach,
                  },
            ),
          },
        };
      });
      setAttachment(undefined);
      setUsage(
        result.usage
          ? `${result.model} · ${result.usage.inputTokens + result.usage.outputTokens} tokens${result.usage.estimatedUSD === null ? '' : ` · ~$${result.usage.estimatedUSD.toFixed(4)}`} · ${result.usage.remaining} ${t('unités restantes aujourd’hui', 'budget units left today', 'وحدات متبقية اليوم')}`
          : result.model,
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      setError(
        controller.signal.aborted
          ? t(
              'Arrêté ou délai dépassé. Brouillon conservé.',
              'Stopped or timed out. Draft preserved.',
              'توقف الطلب أو انتهت المهلة. حُفظت المسودة.',
            )
          : code === 'USAGE_LIMIT'
            ? t(
                'Budget quotidien atteint. Réessayez demain.',
                'Daily budget reached. Try tomorrow.',
                'بلغت ميزانية اليوم. حاول غداً.',
              )
            : code === 'RATE_LIMIT'
              ? t(
                  'Trop de demandes. Réessayez plus tard.',
                  'Too many requests. Try again later.',
                  'طلبات كثيرة. حاول لاحقاً.',
                )
              : code === 'OWNER_LOGIN_REQUIRED'
                ? t(
                    'Reconnectez le compte propriétaire.',
                    'Sign in again with the owner account.',
                    'سجّل الدخول مجدداً بحساب المالك.',
                  )
                : t(
                    'Réponse indisponible ou invalide. Brouillon conservé : réessayez.',
                    'Response unavailable or invalid. Draft preserved: retry.',
                    'الرد غير متاح أو غير صالح. حُفظت المسودة: أعد المحاولة.',
                  ),
      );
    } finally {
      clearTimeout(timeout);
      pending.current = false;
      setBusy(false);
      setPartial('');
    }
  }
  const quizKey = (q: TutorQuiz, lesson: boolean) =>
    `${lesson ? session?.lesson?.lessonId : 'exam'}:${q.id}`;
  function answer(q: TutorQuiz, choice: number, lesson: boolean) {
    if (!session) return;
    if (
      !lesson &&
      session.mode === 'exam' &&
      (!session.examDeadline || session.examSubmitted || clock >= session.examDeadline)
    )
      return;
    const key = quizKey(q, lesson);
    update((p) => {
      const current = p.tutor.sessions.find((s) => s.id === session.id);
      if (!current) return p;
      const prior = current.answers[key];
      const correct = choice === q.correctIndex;
      const revealed = current.hints.includes(key) || !!prior;
      const assessed = session.mode !== 'exam' || lesson;
      const tutor = assessed
        ? recordConcept(p.tutor, q.concept, correct, !revealed, q.explanation, q.question)
        : p.tutor;
      return {
        ...(assessed ? saveTutorReview(p, current.id, q, correct) : p),
        tutor: {
          ...tutor,
          sessions: tutor.sessions.map((s) =>
            s.id === current.id
              ? {
                  ...s,
                  answers: {
                    ...s.answers,
                    [key]: { choice, correct, attempts: (prior?.attempts || 0) + 1, revealed },
                  },
                }
              : s,
          ),
        },
      };
    });
  }
  function submitExam() {
    if (!session || session.examSubmitted) return;
    update((p) => finishTutorExam(p, session.id));
  }
  const questions = (items: TutorQuiz[], lesson: boolean) =>
    items.map((q) => {
      const key = quizKey(q, lesson);
      const a = session?.answers[key];
      const testing = !lesson && session?.mode === 'exam';
      const feedback = !testing || session?.examSubmitted;
      return (
        <Card key={key}>
          <Label bold>{q.question}</Label>
          {q.options.map((option, i) => (
            <Button
              key={i}
              quiet
              selected={a?.choice === i}
              title={option}
              disabled={
                busy ||
                (testing &&
                  (!session?.examDeadline ||
                    !!session?.examSubmitted ||
                    clock >= session.examDeadline))
              }
              onPress={() => answer(q, i, lesson)}
            />
          ))}
          {feedback && (
            <>
              <Button
                quiet
                title={t('Indice', 'Hint', 'تلميح')}
                onPress={() =>
                  session &&
                  amend(session.id, (s) => ({ ...s, hints: [...new Set([...s.hints, key])] }))
                }
              />
              {session?.hints.includes(key) && (
                <>
                  {q.hints
                    .slice(0, 1 + session.hints.filter((h) => h.startsWith(key + ':hint:')).length)
                    .map((h) => (
                      <Label key={h}>{h}</Label>
                    ))}
                  {1 + session.hints.filter((h) => h.startsWith(key + ':hint:')).length <
                    q.hints.length && (
                    <Button
                      quiet
                      disabled={busy}
                      title={t('Indice suivant', 'Next hint', 'التلميح التالي')}
                      onPress={() =>
                        amend(session.id, (s) => ({
                          ...s,
                          hints: [
                            ...s.hints,
                            key +
                              ':hint:' +
                              s.hints.filter((h) => h.startsWith(key + ':hint:')).length,
                          ].slice(-100),
                        }))
                      }
                    />
                  )}
                </>
              )}
              {(a || testing) && (
                <>
                  <Label bold>
                    {a?.correct
                      ? t(
                          'Correct selon le corrigé IA',
                          'Correct according to the AI answer key',
                          'صحيح وفق مفتاح الإجابة المولّد',
                        )
                      : t('À revoir', 'Review this concept', 'راجع هذا المفهوم')}
                  </Label>
                  <TeacherMessage content={q.explanation} />
                </>
              )}
            </>
          )}
        </Card>
      );
    });
  const actions = [
    [
      'simpler',
      t('Plus simple', 'Simpler', 'أبسط'),
      'I do not understand. Explain more simply with a smaller example.',
    ],
    ['example', t('Exemple', 'Example', 'مثال'), 'Give another concrete example of this concept.'],
    ['steps', t('Étapes', 'Step by step', 'خطوة بخطوة'), 'Explain this step by step.'],
    [
      'diagram',
      t('Schéma', 'Diagram', 'رسم توضيحي'),
      'Show a supported interactive diagram if relevant; otherwise explain visually in words.',
    ],
    [
      'translate',
      t('Traduire', 'Translate', 'ترجمة'),
      `Translate the explanation into ${conversationLanguage}.`,
    ],
    [
      'real-world',
      t('Cas réel', 'Real-world example', 'مثال واقعي'),
      'Give a real-world application.',
    ],
    ['test', t('Me tester', 'Test me', 'اختبرني'), 'Create a short quiz to test my understanding.'],
    [
      'different',
      t('Autrement', 'Explain differently', 'اشرح بطريقة أخرى'),
      'I still do not understand. Use a different analogy, then a prerequisite if necessary.',
    ],
    ['deeper', t('Approfondir', 'Go deeper', 'تعمّق'), 'Go deeper with tradeoffs and edge cases.'],
    [
      'story',
      t('Une histoire', 'Teach through a story', 'علّمني بقصة'),
      'Tell a short relevant story illustrating this concept, explain the analogy limits, and keep the pending question unchanged.',
    ],
    [
      'counterexample',
      t('Contre-exemple', 'Show a counterexample', 'اعرض مثالاً مضاداً'),
      'Show a counterexample that exposes the likely misconception. Keep the pending question unchanged.',
    ],
    [
      'hint',
      t('Un seul indice', 'Give one hint', 'أعطني تلميحاً واحداً'),
      'Give the next small hint, not the solution, for the pending question.',
    ],
  ];
  return (
    <Page
      title={t('Votre professeur IA', 'Your AI teacher', 'معلّمك الذكي')}
      subtitle={t(
        'Comprendre · pratiquer · progresser',
        'Understand · practice · progress',
        'افهم · تدرّب · تقدّم',
      )}
    >
      <Card>
        <Label bold size={23}>
          {t('Une leçon à votre rythme', 'One lesson at your pace', 'درس واحد بإيقاعك')}
        </Label>
        <Label>
          {t(
            'Choisissez un objectif. Votre professeur garde le contexte et vous aide à pratiquer.',
            'Choose a goal. Your teacher keeps context and helps you practice.',
            'اختر هدفاً. يحتفظ معلّمك بالسياق ويساعدك على التدريب.',
          )}
        </Label>
        <Row>
          <Button
            quiet
            title={t('Discussion et laboratoire', 'Chat and laboratory', 'المحادثة والمختبر')}
            onPress={() => router.push('/teacher')}
          />
          <Button
            quiet
            title={t('Mémoire', 'Learning memory', 'ذاكرة التعلّم')}
            onPress={() => setShowMemory((v) => !v)}
          />
        </Row>
      </Card>
      {linkedLesson && (
        <Card>
          <Label bold>{linkedLesson.title}</Label>
          <Label>
            {t(
              'Cette leçon est jointe au contexte. Votre progression reste enregistrée.',
              'This lesson is attached as context. Your progress stays saved.',
              'هذا الدرس مرفق بالسياق. يبقى تقدّمك محفوظاً.',
            )}
          </Label>
          <Button
            quiet
            title={t('Reprendre la leçon', 'Return to lesson', 'عُد إلى الدرس')}
            onPress={() => router.back()}
          />
        </Card>
      )}
      {typeof params.goal === 'string' && params.goal.trim() && (
        <Card>
          <Label bold>{params.goal.slice(0, 300)}</Label>
          <Button
            quiet
            disabled={busy}
            title={t(
              'Utiliser cet objectif',
              'Use this learning goal',
              'استخدم هذا الهدف التعليمي',
            )}
            onPress={() => {
              setGoal(params.goal!.slice(0, 300));
              setShowNewSession(true);
            }}
          />
        </Card>
      )}
      {session && (
        <Button
          quiet
          disabled={busy}
          title={t('Créer une autre session', 'Create another session', 'أنشئ جلسة أخرى')}
          onPress={() => setShowNewSession((v) => !v)}
        />
      )}
      {(!session || showNewSession) && (
        <Card>
          <Field
            value={goal}
            maxLength={300}
            onChangeText={setGoal}
            placeholder={t(
              'Que voulez-vous apprendre ?',
              'What would you like to learn?',
              'ماذا تريد أن تتعلّم؟',
            )}
          />
          <Row>
            {tutorModes.map((m, i) => (
              <Button
                key={m}
                quiet
                selected={mode === m}
                title={labels[i]!}
                disabled={busy}
                onPress={() => setMode(m)}
              />
            ))}
          </Row>
          <Button
            disabled={busy || !goal.trim()}
            title={t('Nouvelle session', 'New session', 'جلسة جديدة')}
            onPress={start}
          />
        </Card>
      )}
      {memory.sessions.length > 0 && (
        <Card>
          <Label bold>{t('Reprendre une session', 'Resume a session', 'استأنف جلسة')}</Label>
          {memory.sessions
            .slice()
            .reverse()
            .map((s) => (
              <Button
                key={s.id}
                quiet
                selected={s.id === session?.id}
                disabled={busy}
                title={`${s.goal} · ${labels[tutorModes.indexOf(s.mode)]}`}
                onPress={() => {
                  update((p) => ({ ...p, tutor: { ...p.tutor, active: s.id } }));
                  setAttachment(undefined);
                  setError('');
                }}
              />
            ))}
        </Card>
      )}
      {session && (
        <>
          <Card>
            <Label bold size={20}>
              {session.goal}
            </Label>
            <Label muted>{labels[tutorModes.indexOf(session.mode)]}</Label>
            {session.mode === 'exam' && (
              <>
                <Field
                  value={examType}
                  onChangeText={setExamType}
                  maxLength={120}
                  placeholder={t('Type d’examen', 'Exam type', 'نوع الامتحان')}
                />
                <Field
                  value={minutes}
                  onChangeText={setMinutes}
                  maxLength={3}
                  keyboardType="number-pad"
                  placeholder={t('Minutes disponibles', 'Available minutes', 'الدقائق المتاحة')}
                />
                <Field
                  value={target}
                  onChangeText={setTarget}
                  maxLength={120}
                  placeholder={t('Objectif', 'Target result', 'النتيجة المستهدفة')}
                />
                <Field
                  value={difficulty}
                  onChangeText={setDifficulty}
                  maxLength={120}
                  placeholder={t('Difficulté', 'Difficulty', 'الصعوبة')}
                />
              </>
            )}
            {session.mode === 'conversation' && (
              <Row>
                {['English', 'French', 'Spanish', 'Arabic'].map((lang) => (
                  <Button
                    key={lang}
                    quiet
                    selected={conversationLanguage === lang}
                    title={lang}
                    onPress={() => setConversationLanguage(lang)}
                  />
                ))}
              </Row>
            )}
            {!session.messages.length && (
              <Button
                disabled={busy}
                title={t(
                  'Commencer avec le professeur',
                  'Start with the teacher',
                  'ابدأ مع المعلّم',
                )}
                onPress={() => {
                  void send(
                    `Help me learn: ${session.goal}. Use my saved preferences, ask a brief diagnostic question if needed, and begin in ${session.mode} mode.`,
                    'start',
                  );
                }}
              />
            )}
          </Card>
          <TutorCoach session={session} busy={busy} send={send} />
          <Button
            quiet
            disabled={busy}
            title={t('Changer de stratégie', 'Change teaching mode', 'غيّر طريقة التعليم')}
            onPress={() => setShowModes((v) => !v)}
          />
          {showModes && (
            <Row>
              {tutorModes.map((m, i) => (
                <Button
                  key={m}
                  quiet
                  disabled={busy || (!!session.examDeadline && !session.examSubmitted)}
                  selected={session.mode === m}
                  title={labels[i]!}
                  onPress={() => {
                    amend(session.id, (s) => ({
                      ...s,
                      mode: m,
                      coach: ['exam', 'conversation'].includes(m)
                        ? undefined
                        : {
                            ...(s.coach || newCoach()),
                            depth:
                              m === 'expert'
                                ? 'expert'
                                : m === 'beginner'
                                  ? 'beginner'
                                  : s.coach?.depth || 'beginner',
                          },
                    }));
                    setShowModes(false);
                  }}
                />
              ))}
            </Row>
          )}
          <Button
            quiet
            title={t('Sauvegarde cloud du tutorat', 'Tutor cloud backup', 'نسخة سحابية للتدريس')}
            onPress={() => setShowCloud((v) => !v)}
          />
          {showCloud && <CloudProgress />}
          <TutorTeachingCard
            key={`${session.id}:${session.updatedAt}`}
            session={session}
            busy={busy}
          />
          {session.reply?.roadmap.map((step, i) => (
            <Card key={i}>
              <Label bold>
                {i + 1}. {step.title} · {step.minutes} min
              </Label>
              <Label>{step.objective}</Label>
              <Label muted>{step.prerequisite}</Label>
              <Button
                quiet
                disabled={busy}
                title={t('Étudier cette étape', 'Study this step', 'ادرس هذه الخطوة')}
                onPress={() => {
                  void send(
                    `Create a complete interactive lesson for roadmap step ${i + 1}: ${step.title}. Objective: ${step.objective}.`,
                    'lesson',
                  );
                }}
              />
            </Card>
          ))}
          {session.reply?.challenge && (
            <Card>
              <Label bold>{session.reply.challenge.title}</Label>
              <Label>
                {session.reply.challenge.sessions} × {session.reply.challenge.minutesPerSession} min
              </Label>
              {session.reply.challenge.milestones.map((m) => (
                <Label key={m}>• {m}</Label>
              ))}
              <Label>{session.reply.challenge.adjustment}</Label>
              <Button
                quiet
                disabled={busy}
                title={t('Adapter le défi', 'Adjust challenge', 'عدّل التحدي')}
                onPress={() =>
                  amend(session.id, (s) => ({
                    ...s,
                    draft: t(
                      'Adapte mon défi : je dispose de … minutes par jour.',
                      'Adjust my challenge: I have … minutes per day.',
                      'عدّل تحديي: لدي … دقيقة يومياً.',
                    ),
                  }))
                }
              />
            </Card>
          )}
          {session.lesson && (
            <Card>
              <Label bold size={22}>
                {session.lesson.title}
              </Label>
              <Label>
                {session.lesson.estimatedMinutes} min · {session.lesson.objectives.join(' · ')}
              </Label>
              <Row>
                {[
                  t('Comprendre', 'Learn', 'افهم'),
                  t('Pratiquer', 'Practice', 'تدرّب'),
                  t('Vérifier', 'Check', 'اختبر'),
                  t('Bilan', 'Summary', 'خلاصة'),
                ].map((title, stage) => (
                  <Button
                    key={stage}
                    quiet
                    selected={session.stage === stage}
                    title={title}
                    onPress={() => amend(session.id, (s) => ({ ...s, stage }))}
                  />
                ))}
              </Row>
              {session.stage === 0 && (
                <>
                  {session.lesson.sections.map((s, i) => (
                    <React.Fragment key={i}>
                      <Label bold>{s.title}</Label>
                      <TeacherMessage content={s.text} />
                    </React.Fragment>
                  ))}
                  {session.lesson.examples.map((e, i) => (
                    <TeacherMessage key={i} content={e} />
                  ))}
                </>
              )}
              {session.stage === 1 && (
                <>
                  {session.lesson.exercises.map((e) => (
                    <Label key={e}>{e}</Label>
                  ))}
                  <Label muted>
                    {t(
                      'Écrivez votre tentative ci-dessous et demandez une évaluation.',
                      'Write your attempt below and request feedback.',
                      'اكتب محاولتك أدناه واطلب التقييم.',
                    )}
                  </Label>
                  <Button
                    quiet
                    disabled={busy}
                    title={t('Indice progressif', 'Progressive hint', 'تلميح تدريجي')}
                    onPress={() => {
                      void send(
                        'Give one progressive hint for the current exercise without revealing the solution.',
                        'hint',
                      );
                    }}
                  />
                </>
              )}
              {session.stage === 2 && questions(session.lesson.assessment, true)}
              {session.stage === 3 && (
                <>
                  <TeacherMessage content={session.lesson.summary} />
                  <Label>{session.lesson.nextLesson}</Label>
                  <Button
                    disabled={
                      !session.lesson.assessment.every(
                        (q) => session.answers[quizKey(q, true)]?.correct,
                      )
                    }
                    title={
                      session.complete
                        ? t('Leçon terminée', 'Lesson completed', 'اكتمل الدرس')
                        : t('Terminer la leçon', 'Complete lesson', 'أكمل الدرس')
                    }
                    onPress={() => amend(session.id, (s) => ({ ...s, complete: true }))}
                  />
                  <Label muted>
                    {t(
                      'Réussir après un indice reste de la pratique, pas une preuve de maîtrise.',
                      'Success after hints is practice, not proof of mastery.',
                      'النجاح بعد التلميحات تدريب وليس دليلاً على الإتقان.',
                    )}
                  </Label>
                  <Button
                    quiet
                    disabled={busy || !session.complete}
                    title={t('Leçon suivante', 'Next lesson', 'الدرس التالي')}
                    onPress={() => {
                      void send(
                        `Create the next interactive lesson: ${session.lesson?.nextLesson}`,
                        'lesson',
                      );
                    }}
                  />
                </>
              )}
            </Card>
          )}
          {!!session.reply?.quiz.length && (
            <Card>
              <Label bold>{t('Entraînement', 'Practice test', 'اختبار تدريبي')}</Label>
              {session.mode === 'exam' && !session.examDeadline && (
                <Row>
                  <Button
                    disabled={busy}
                    title={t('Test chronométré', 'Timed test', 'اختبار مؤقّت')}
                    onPress={() =>
                      amend(session.id, (s) => ({
                        ...s,
                        examDeadline:
                          Date.now() + Math.max(1, Math.min(180, Number(minutes) || 20)) * 60000,
                        examSubmitted: false,
                        answers: {},
                      }))
                    }
                  />
                  <Button
                    quiet
                    disabled={busy}
                    title={t('Sans limite', 'Untimed test', 'دون توقيت')}
                    onPress={() =>
                      amend(session.id, (s) => ({
                        ...s,
                        examDeadline: Number.MAX_SAFE_INTEGER,
                        examSubmitted: false,
                        answers: {},
                      }))
                    }
                  />
                </Row>
              )}
              {!!session.examDeadline &&
                session.examDeadline !== Number.MAX_SAFE_INTEGER &&
                !session.examSubmitted && (
                  <Label>{Math.max(0, Math.ceil((session.examDeadline - clock) / 1000))} s</Label>
                )}
              {questions(session.reply.quiz, false)}
              {session.mode === 'exam' && !!session.examDeadline && !session.examSubmitted && (
                <Button
                  title={t('Corriger le test', 'Submit test', 'سلّم الاختبار')}
                  onPress={submitExam}
                />
              )}
              {session.examSubmitted && (
                <>
                  <Label bold>
                    {
                      session.reply.quiz.filter((q) => session.answers[`exam:${q.id}`]?.correct)
                        .length
                    }{' '}
                    / {session.reply.quiz.length}
                  </Label>
                  <Button
                    quiet
                    disabled={busy}
                    title={t(
                      'Analyser mes points faibles',
                      'Review weak topics',
                      'راجع نقاط الضعف',
                    )}
                    onPress={() => {
                      void send(
                        'Review my submitted test answers from context. Explain weak topics and recommend spaced retrieval exercises.',
                        'review',
                      );
                    }}
                  />
                </>
              )}
            </Card>
          )}
          {session.messages.map((m, i) => (
            <Card key={`${session.id}:${i}`}>
              <Label bold>
                {m.role === 'user'
                  ? t('Vous', 'You', 'أنت')
                  : t('Professeur', 'Teacher', 'المعلّم')}
              </Label>
              <TeacherMessage
                content={m.content}
                onExplain={(code) => {
                  void send(`Explain this code step by step:\n${code}`);
                }}
              />
              {m.role === 'assistant' && (
                <Button
                  quiet
                  title={t('Enregistrer en note', 'Save as note', 'احفظ كملاحظة')}
                  onPress={() =>
                    update((p) => ({
                      ...p,
                      notes: { ...p.notes, [`${session.id}-${i}`]: m.content },
                    }))
                  }
                />
              )}
            </Card>
          ))}
          {session.reply?.evaluation && (
            <Card>
              <Label bold>
                {t(
                  'Retour IA — à vérifier',
                  'AI feedback — verify when needed',
                  'تقييم الذكاء — تحقّق عند الحاجة',
                )}
              </Label>
              <TeacherMessage content={session.reply.evaluation.feedback} />
              <Label>{session.reply.evaluation.nextExercise}</Label>
            </Card>
          )}
          {session.reply?.diagram && (
            <TutorDiagram
              key={JSON.stringify(session.reply.diagram)}
              diagram={session.reply.diagram}
            />
          )}
          {session.reply?.revision.map((r, i) => (
            <Card key={i}>
              <Label bold>{r.concept}</Label>
              <Label>{r.reason}</Label>
              <Label>{r.exercise}</Label>
              <Button
                quiet
                title={t('Ajouter aux révisions', 'Add to revision', 'أضف للمراجعة')}
                onPress={() =>
                  update((p) => ({
                    ...p,
                    tutor: {
                      ...p.tutor,
                      concepts: [
                        ...p.tutor.concepts.filter((c) => c.concept !== r.concept),
                        {
                          ...(p.tutor.concepts.find((c) => c.concept === r.concept) || {
                            concept: r.concept,
                            attempts: 0,
                            correct: 0,
                            independent: 0,
                            errors: [],
                            lastReview: 0,
                            confusion: 0,
                          }),
                          nextExercise: r.exercise,
                          due: Date.now() + r.days * 86400000,
                        },
                      ].slice(-200),
                    },
                  }))
                }
              />
            </Card>
          ))}
          {busy && !!partial && (
            <Card>
              <Label muted>
                {t(
                  'Réponse en cours — non enregistrée',
                  'Response in progress — not saved',
                  'رد قيد الإنشاء — غير محفوظ',
                )}
              </Label>
              <TeacherMessage content={partial} />
            </Card>
          )}
          <Card>
            <Label muted>{t('Langue de traduction', 'Translation language', 'لغة الترجمة')}</Label>
            <Row>
              {['English', 'French', 'Spanish', 'Arabic'].map((lang) => (
                <Button
                  key={lang}
                  quiet
                  selected={conversationLanguage === lang}
                  title={lang}
                  onPress={() => setConversationLanguage(lang)}
                />
              ))}
            </Row>
            <Row>
              {actions.map(([action, title, prompt]) => (
                <Button
                  key={action}
                  quiet
                  disabled={busy}
                  title={title!}
                  onPress={() => {
                    void send(prompt!, action);
                  }}
                />
              ))}
            </Row>
            {session.reply?.followUps.map((q) => (
              <Button
                key={q}
                quiet
                disabled={busy}
                title={q}
                onPress={() => {
                  void send(q);
                }}
              />
            ))}
            <Field
              value={session.draft}
              onChangeText={(draft) =>
                amend(session.id, (s) => ({ ...s, draft: draft.slice(0, 6000) }))
              }
              maxLength={6000}
              multiline
              minHeight={100}
              placeholder={t(
                'Votre question, réponse ou tentative…',
                'Your question, answer, or attempt…',
                'سؤالك أو إجابتك أو محاولتك…',
              )}
            />
            <TutorMedia
              disabled={busy}
              answer={session.reply?.answer || ''}
              language={
                session.mode === 'conversation'
                  ? { English: 'en', French: 'fr', Spanish: 'es', Arabic: 'ar' }[
                      conversationLanguage
                    ] || state.language
                  : state.language
              }
              onAttachment={setAttachment}
              onError={setError}
              onTranscript={(text) =>
                amend(session.id, (s) => ({
                  ...s,
                  draft: `${s.draft} ${text}`.trim().slice(0, 6000),
                }))
              }
            />
            {attachment && (
              <Row>
                <Label>{attachment.name}</Label>
                <Button
                  quiet
                  title={t('Retirer', 'Remove', 'إزالة')}
                  onPress={() => setAttachment(undefined)}
                />
              </Row>
            )}
            <Row>
              <Button
                loading={busy}
                disabled={busy || !session.draft.trim()}
                title={t('Envoyer', 'Send', 'إرسال')}
                onPress={() => {
                  void send(session.draft);
                }}
              />
              {busy && (
                <Button
                  quiet
                  title={t('Annuler', 'Cancel', 'إلغاء')}
                  onPress={() => abort.current?.abort()}
                />
              )}
              <Button
                quiet
                title={t('Laboratoire de programmation', 'Programming laboratory', 'مختبر البرمجة')}
                onPress={() => router.push('/practice-lab')}
              />
            </Row>
            {busy && (
              <Label>
                {t(
                  'Le professeur prépare et vérifie la structure de sa réponse…',
                  'The teacher is preparing and validating its response…',
                  'يجهّز المعلّم الرد ويتحقّق من بنيته…',
                )}
              </Label>
            )}
            {error && (
              <>
                <Label>{error}</Label>
                {lastRequest && (
                  <Button
                    quiet
                    disabled={busy}
                    title={t('Réessayer', 'Retry', 'أعد المحاولة')}
                    onPress={() => {
                      void send(lastRequest.message, lastRequest.action);
                    }}
                  />
                )}
              </>
            )}
            {usage && (
              <Label muted size={11}>
                {usage}
              </Label>
            )}
          </Card>
        </>
      )}
      {!session && !!error && <Label>{error}</Label>}
      {showMemory && (
        <Card>
          <Label bold>{t('Mémoire pédagogique', 'Learning memory', 'ذاكرة التعلّم')}</Label>
          <Label muted>
            {t(
              'Chaque session conserve 12 messages, un résumé et les 20 dernières évaluations guidées. Les résultats IA ne certifient pas la maîtrise. Pièces jointes non conservées.',
              'Each session retains 12 messages, a summary and the latest 20 guided assessments. AI results do not certify mastery. Attachments are not retained.',
              'تُحفظ ١٢ رسالة وملخص وآخر ٢٠ تقييمًا موجّهًا لكل جلسة. النتائج الآلية لا تثبت الإتقان. لا تُحفظ المرفقات.',
            )}
          </Label>
          {session && <Label>{session.summary}</Label>}
          {memory.concepts.map((c) => (
            <Card key={c.concept}>
              <Label bold>{c.concept}</Label>
              <Label>
                {t(
                  'Réponses correctes / tentatives',
                  'Correct answers / attempts',
                  'الإجابات الصحيحة / المحاولات',
                )}
                : {c.correct}/{c.attempts} ·{' '}
                {t(
                  'Réussites sans indice enregistré',
                  'Correct without recorded hints',
                  'إجابات صحيحة دون تلميحات مسجلة',
                )}
                : {c.independent}
              </Label>
              <Label>{c.errors.join(' · ')}</Label>
              <Label>
                {t('Révision', 'Review', 'مراجعة')}:{' '}
                {new Date(c.due).toLocaleDateString(state.language)}
              </Label>
              <Button
                quiet
                disabled={busy || !session}
                title={t('Réviser maintenant', 'Review now', 'راجع الآن')}
                onPress={() => {
                  void send(
                    `Give me an independent recall exercise about ${c.concept}: ${c.nextExercise}`,
                    'review',
                  );
                }}
              />
            </Card>
          ))}
          <Button
            quiet
            disabled={busy}
            title={t('Effacer la mémoire…', 'Delete learning memory…', 'حذف ذاكرة التعلّم…')}
            onPress={() => setConfirmDelete(true)}
          />
          {session && (
            <Button
              quiet
              disabled={busy}
              title={t('Supprimer cette session', 'Delete this session', 'احذف هذه الجلسة')}
              onPress={() => {
                update((p) => ({
                  ...removeTutorCards(p, session.id),
                  tutor: {
                    ...p.tutor,
                    active: '',
                    sessions: p.tutor.sessions.filter((s) => s.id !== session.id),
                  },
                }));
                setAttachment(undefined);
              }}
            />
          )}
          {confirmDelete && (
            <>
              <Label>
                {t(
                  'Supprimer sessions, concepts et cartes du professeur ? Vos autres notes restent.',
                  'Delete sessions, concepts and tutor review cards? Your other notes remain.',
                  'حذف الجلسات والمفاهيم وبطاقات المعلم؟ تبقى ملاحظاتك الأخرى.',
                )}
              </Label>
              <Row>
                <Button
                  title={t('Confirmer la suppression', 'Confirm deletion', 'تأكيد الحذف')}
                  onPress={() => {
                    update((p) => ({ ...removeTutorCards(p), tutor: emptyTutor() }));
                    setConfirmDelete(false);
                    setAttachment(undefined);
                  }}
                />
                <Button
                  quiet
                  title={t('Annuler', 'Cancel', 'إلغاء')}
                  onPress={() => setConfirmDelete(false)}
                />
              </Row>
            </>
          )}
        </Card>
      )}
      <Label muted size={12}>
        {t(
          'Contenu généré par IA : vérifiez les faits importants. Une réponse structurée est affichée après validation complète.',
          'AI-generated content: verify important facts. Structured responses appear after complete validation.',
          'محتوى مولّد بالذكاء: تحقّق من الحقائق المهمة. يظهر الرد المنظم بعد التحقّق الكامل.',
        )}
      </Label>
    </Page>
  );
}
