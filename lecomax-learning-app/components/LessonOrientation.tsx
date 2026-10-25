import { router } from 'expo-router';
import type { Lesson } from '../types/content';
import { useSchool } from '../store/School';
import { activeJourney, roadmap } from '../services/learning-roadmap';
import { Button, Card, Label } from './UI';
import { getLesson } from '../services/content';

export function LessonOrientation({ lesson, courseId }: { lesson: Lesson; courseId?: string }) {
  const { state, t } = useSchool();
  const path = roadmap(courseId || activeJourney(state)?.id || '', state);
  const stage = path?.stages.find((s) => s.module.lessons.some((l) => l.id === lesson.id));
  const objectives = lesson.curriculum?.objectives || lesson.academy?.objectives || [lesson.concept];
  return (
    <Card>
      {path && (
        <Label muted>
          {t(path.course.title[0], path.course.title[1], path.course.title[2])} ·{' '}
          {stage?.module.title[state.language]}
        </Label>
      )}
      <Label bold>{t('Ce que vous apprendrez', 'What you will learn', 'ما الذي ستتعلمه')}</Label>
      {objectives.filter(Boolean).map((objective, i) => (
        <Label key={i}>{objective}</Label>
      ))}
      {lesson.curriculum?.prerequisiteIds.map(id => {
        const prerequisite = getLesson(id, state.language);
        return prerequisite ? <Button key={id} quiet title={`${state.completed.includes(id) ? '✓ ' : ''}${t('Préparation : ', 'Prerequisite: ', 'متطلب: ')}${prerequisite.title}`} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id, ...(path?.course.lessons.some(l => l.id === id) ? { course: path.course.id } : {}) } })} /> : null;
      })}
      <Label muted>
        {t('Préparation : ', 'Preparation: ', 'التحضير: ')}
        {stage?.required.length
          ? stage.required
              .map(
                (id) => path?.stages.find((s) => s.module.id === id)?.module.title[state.language],
              )
              .join(' · ')
          : t(
              'Aucune étape inachevée dans ce parcours.',
              'No unfinished earlier stages in this path.',
              'لا توجد مراحل سابقة غير مكتملة في هذا المسار.',
            )}
      </Label>
      <Label>
        {t(
          'Lecture → exemples → pratique guidée → exercice → évaluation → résumé. Ouvrir cette page ne valide pas la leçon.',
          'Read → examples → guided practice → exercise → assessment → summary. Opening this page does not complete the lesson.',
          'قراءة ← أمثلة ← تدريب موجه ← تمرين ← تقييم ← ملخص. فتح الصفحة لا يعني إكمال الدرس.',
        )}
      </Label>
      <Button
        quiet
        title={t(
          'Situer cette leçon dans mon parcours',
          'See this lesson in my roadmap',
          'اعرض موضع الدرس في مساري',
        )}
        onPress={() => router.push('/roadmap')}
      />
    </Card>
  );
}
