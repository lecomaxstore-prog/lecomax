import { useMemo } from 'react';
import { router } from 'expo-router';
import { Button, Card, Label, ListItem, Page, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { library, normalizeCourseQuery } from '../services/course-library';
import { subjects } from '../services/discovery';
import { getLesson } from '../services/content';
import { weeklyAcademy } from '../utils/weekly-academy';
import { openLearningItem } from '../components/AcademyDashboard';
import type { Language } from '../types/content';

type WeekCourse = {
  id: string;
  title: readonly string[];
  lessons: {
    id: string;
    title: Record<Language, string>;
    minutes: number;
    difficulty: number;
    questionIds?: string[];
  }[];
};

export default function AcademyWeek() {
  const { state, t, update } = useSchool();
  const courses = useMemo(() => {
    const goal = normalizeCourseQuery(state.academy.profile.goal);
    const interestCourses = subjects
      .filter((s) => state.academy.profile.interests?.includes(s.id))
      .flatMap((s) => [...s.courses]) as string[];
    const available: WeekCourse[] = [
      ...library,
      ...state.academy.plans.map((plan) => ({
        id: plan.id,
        title: [plan.title, plan.title, plan.title],
        lessons: plan.lessons.map((lesson, i) => ({
          id: `${plan.id}:${i}`,
          title: { en: lesson.title, fr: lesson.title, ar: lesson.title },
          minutes: lesson.minutes,
          difficulty: 1,
          questionIds: lesson.quiz.map((_, q) => `q${q}`),
        })),
      })),
    ];
    return available
      .filter((c) => c.lessons.length)
      .sort((a, b) => {
        const score = (c: typeof a) =>
          Number(state.academy.enrolled.includes(c.id)) * 100 +
          Number(c.lessons.some((l) => l.id === state.lastLesson)) * 50 +
          Number(interestCourses.includes(c.id)) * 10 +
          Number(
            goal.length > 0 &&
              normalizeCourseQuery(c.title.join(' '))
                .split(/\s+/)
                .some((w) => w.length > 3 && goal.includes(w)),
          ) *
            20;
        return score(b) - score(a);
      });
  }, [
    state.academy.enrolled,
    state.academy.plans,
    state.academy.profile.goal,
    state.academy.profile.interests,
    state.lastLesson,
  ]);
  const course = courses.find((c) => c.id === state.drafts['academy-week.course']) || courses[0];
  const planningLessons = useMemo(
    () =>
      (course?.lessons || []).map((l) => ({
        ...l,
        questionIds: l.questionIds || getLesson(l.id, state.language)?.quiz.map((q) => q.id) || [],
      })),
    [course, state.language],
  );
  const sessions = weeklyAcademy(state, planningLessons);
  const kinds = {
    learn: t('Comprendre', 'Learn', 'تعلّم'),
    review: t('Rappel actif', 'Active recall', 'استرجاع نشط'),
    practice: t('Pratiquer sans regarder', 'Practice without looking', 'تدرّب دون النظر'),
    reflect: t('Bilan et repos', 'Reflect and recharge', 'راجع واسترح'),
  };
  return (
    <Page
      title={t('Votre semaine d’apprentissage', 'Your learning week', 'أسبوعك التعليمي')}
      subtitle={t(
        'Un rythme réaliste, ajusté à vos réponses',
        'A realistic rhythm, adjusted to your answers',
        'وتيرة واقعية تتكيف مع إجاباتك',
      )}
    >
      <Card>
        <Label bold size={23}>
          {state.academy.profile.goal ||
            t('Suivez votre curiosité', 'Follow your curiosity', 'اتبع فضولك')}
        </Label>
        <Label>
          {t(
            'Sept séances flexibles, pas des échéances. Vos rappels dus passent en premier. Deux rappels réussis à distance permettent de dépasser une notion ; ce n’est pas une certification de maîtrise.',
            'Seven flexible sessions, not deadlines. Due reviews come first. Two successful spaced recalls let the plan move past a concept; this is not a mastery certification.',
            'سبع جلسات مرنة وليست مواعيد نهائية. المراجعات المستحقة أولًا. يسمح استرجاعان ناجحان ومتباعدان بالانتقال، وهذا ليس شهادة إتقان.',
          )}
        </Label>
        <Label muted>
          {t(
            'Le plan se recalcule avec votre progression enregistrée. Les longues leçons se poursuivent à la séance suivante. Lecture et plan locaux ; le professeur IA nécessite Internet.',
            'The plan recalculates from saved progress. Continue longer lessons in another session. Reading and planning are local; the AI tutor needs Internet.',
            'تتجدد الخطة وفق تقدمك المحفوظ. أكمل الدروس الطويلة في جلسة لاحقة. القراءة والتخطيط محليان؛ المعلم الذكي يحتاج الإنترنت.',
          )}
        </Label>
        <Button
          quiet
          title={t('Modifier mes préférences', 'Edit my preferences', 'عدّل تفضيلاتي')}
          onPress={() => router.push('/onboarding')}
        />
      </Card>
      <Card>
        <Label bold>{t('Votre cours', 'Your course', 'دورتك')}</Label>
        <Label muted>
          {t(
            'Suggestions selon vos intérêts ; choisissez librement. Le rythme dépend de vos réponses, pas du niveau déclaré.',
            'Suggestions follow your interests; choose freely. Pacing follows your answers, not your self-reported level.',
            'اقتراحات حسب اهتماماتك؛ اختر بحرية. تعتمد الوتيرة على إجاباتك لا على المستوى المعلن.',
          )}
        </Label>
        <Row>
          {courses.slice(0, 6).map((c) => (
            <Button
              key={c.id}
              quiet
              selected={c.id === course?.id}
              title={t(c.title[0]!, c.title[1]!, c.title[2]!)}
              onPress={() =>
                update((p) => ({ ...p, drafts: { ...p.drafts, 'academy-week.course': c.id } }))
              }
            />
          ))}
        </Row>
        <Button
          quiet
          title={t('Tous les cours', 'All courses', 'كل الدورات')}
          onPress={() => router.push('/explore')}
        />
      </Card>
      {sessions.map((session) => (
        <Card key={session.day}>
          <Label muted>
            {t('Séance', 'Session', 'جلسة')} {session.day + 1} · {session.minutes}{' '}
            {t('min', 'min', 'دقيقة')}
          </Label>
          <Label bold size={20}>
            {kinds[session.kind]}
          </Label>
          {session.lessonId ? (
            <ListItem
              title={
                course?.lessons.find((l) => l.id === session.lessonId)?.title[state.language] ||
                session.lessonId
              }
              onPress={() => openLearningItem(session.lessonId!)}
            />
          ) : (
            <>
              <Label>
                {state.academy.profile.routineGoal ||
                  t(
                    'Notez une idée retenue et choisissez une petite routine.',
                    'Recall one useful idea and choose a small routine.',
                    'استرجع فكرة مفيدة واختر عادة صغيرة.',
                  )}
              </Label>
              <Button
                quiet
                title={t('Ouvrir mes routines', 'Open my routines', 'افتح عاداتي')}
                onPress={() => router.push('/wellness')}
              />
            </>
          )}
        </Card>
      ))}
    </Page>
  );
}
