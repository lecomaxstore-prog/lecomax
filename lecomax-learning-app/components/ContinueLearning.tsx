import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { library } from '../services/course-library';
import { courseLearning, currentLearningCourse } from '../services/course-learning';
import { lessonSequence } from '../services/course-navigation';
import { lessons } from '../services/content';
import { Button, Card, Label, ProgressBar, Row } from './UI';

export function ContinueLearning({ showLibraryLink = true }: { showLibraryLink?: boolean }) {
  const { state, t, colors } = useSchool();
  // Generated plans keep their own lesson IDs and navigation.
  const plan = state.academy.plans.find(p => state.lastLesson.startsWith(p.id + ':'));
  if (plan) {
    const index = Number(state.lastLesson.slice(plan.id.length + 1));
    const next = !state.completed.includes(state.lastLesson) ? index : plan.lessons.findIndex((_, i) => !state.completed.includes(`${plan.id}:${i}`));
    return <Card style={{ backgroundColor: colors.soft }}>
      <Label bold size={18}>{t('Reprendre mon parcours', 'Continue my learning plan', 'تابع مسارك التعليمي')}</Label>
      <Label>{plan.title}</Label>
      <Label>{plan.lessons[next]?.title || t('Parcours terminé', 'Plan completed', 'اكتمل المسار')}</Label>
      <Button title={t('Ouvrir mon parcours', 'Open my learning plan', 'افتح مساري التعليمي')} onPress={() => router.push({ pathname: '/learning-journey', params: { id: plan.id } })} />
    </Card>;
  }
  const savedPath = state.drafts['learning:last-course'];
  const path = savedPath?.startsWith('path:') ? lessonSequence(savedPath, state.lastLesson) : undefined;
  const standalone = !currentLearningCourse(state) ? lessons.find(l => l.id === state.lastLesson) : undefined;
  if ((path && path.courseId === savedPath) || standalone) {
    const next = path
      ? path.lessons.find(l => l.id === state.lastLesson && !state.completed.includes(l.id)) || path.lessons.find(l => !state.completed.includes(l.id))
      : standalone;
    return <Card style={{ backgroundColor: colors.soft }}>
      <Label bold size={18}>{t('Reprenez ici', 'Pick up where you left off', 'أكمل من حيث توقفت')}</Label>
      <Label>{path?.title[state.language] || standalone?.title[state.language]}</Label>
      {path && next && <Label>{next.title[state.language]}</Label>}
      <Button title={next ? t('Continuer ma leçon', 'Continue my lesson', 'تابع درسي') : t('Revoir le parcours', 'Review path', 'راجع المسار')} onPress={() => next ? router.push({ pathname: '/lesson/[id]', params: { id: next.id, ...(path ? { course: path.courseId } : {}) } }) : router.push({ pathname: '/learning-path/[id]', params: { id: savedPath!.slice(5) } })} />
      {showLibraryLink && <Button quiet title={t('Mes cours et ma progression', 'My courses & progress', 'دوراتي وتقدّمي')} onPress={() => router.push('/courses')} />}
    </Card>;
  }
  const course = currentLearningCourse(state) || library.find(c => courseLearning(c, state).started && !courseLearning(c, state).complete) || library.find(c => state.academy.enrolled.includes(c.id)) || library[0];
  if (!course) return null;
  const progress = courseLearning(course, state);
  const next = progress.next;
  const stage = next ? state.stages[next.id] || 0 : 0;
  const stageLabel = [t('Lecture', 'Read', 'الفهم'), t('Exemples', 'Examples', 'الأمثلة'), t('Pratique', 'Practice', 'التطبيق'), t('Quiz', 'Quiz', 'الاختبار')][stage];
  return <Card style={{ backgroundColor: colors.soft, gap: 12 }}>
    <Label bold size={18}>{progress.complete ? t('Cours terminé', 'Course completed', 'أكملت الدورة') : progress.started ? t('Reprenez ici', 'Pick up where you left off', 'أكمل من حيث توقفت') : t('Votre point de départ', 'Start here', 'ابدأ من هنا')}</Label>
    <Label bold>{t(course.title[0], course.title[1], course.title[2])}</Label>
    {next && <>
      <Label size={14}>{t(`Leçon ${progress.position} sur ${progress.total}`, `Lesson ${progress.position} of ${progress.total}`, `الدرس ${progress.position} من ${progress.total}`)} · {stageLabel}</Label>
      <Label>{next.title[state.language]}</Label>
    </>}
    <Row style={{ justifyContent: 'space-between' }}>
      <Label muted size={13}>{t(`${progress.done} leçons terminées`, `${progress.done} lessons completed`, `${progress.done} دروس مكتملة`)}</Label>
      <Label bold size={13}>{Math.round(progress.done / Math.max(1, progress.total) * 100)}%</Label>
    </Row>
    <ProgressBar value={progress.done / Math.max(1, progress.total)} />
    <Button icon={progress.complete ? 'checkmark-circle-outline' : 'play-outline'} title={progress.complete ? t('Revoir le cours', 'Review course', 'راجع الدورة') : progress.started ? t('Continuer ma leçon', 'Continue my lesson', 'تابع درسي') : t('Commencer la première leçon', 'Start first lesson', 'ابدأ الدرس الأول')} onPress={() => next ? router.push({ pathname: '/lesson/[id]', params: { id: next.id, course: course.id } }) : router.push({ pathname: '/course/[id]', params: { id: course.id } })} />
    {showLibraryLink && <Button quiet title={t('Mes cours et ma progression', 'My courses & progress', 'دوراتي وتقدّمي')} onPress={() => router.push('/courses')} />}
  </Card>;
}
