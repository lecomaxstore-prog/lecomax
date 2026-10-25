import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { coursePrograms } from '../constants/course-programs';
import { library } from '../services/course-library';
import { getLesson } from '../services/content';
import { curriculumGaps } from '../services/curriculum-evidence';
import { Button, Card, Label } from './UI';

export function CourseProgram({ courseId }: { courseId: string }) {
  const { state, t } = useSchool();
  const program = coursePrograms[courseId];
  const course = library.find(c => c.id === courseId);
  if (!program || !course) return null;
  const minutes = course.lessons.reduce((n, l) => n + l.minutes, 0);
  const gaps = course.lessons.flatMap(l => {
    const lesson = getLesson(l.id, state.language);
    const attempted = !!state.drafts[l.id]?.trim() || Object.keys(state.answers).some(k => k.startsWith(l.id + '::'));
    const wrong = lesson?.quiz.some(q => { const a = state.answers[l.id + '::' + q.id]; return a && a.choice !== q.correctIndex; });
    return lesson && attempted && (wrong || curriculumGaps(lesson, state).length) ? [lesson] : [];
  });
  return <Card>
    <Label bold>{t('Programme du cours', 'Course program', 'برنامج المقرر')}</Label>
    <Label muted>{t('Description éditoriale en anglais', 'Editorial brief in English', 'وصف البرنامج بالإنجليزية')}</Label>
    <Label>{program.reviewStatus}</Label>
    <Label bold>{t('Public et prérequis', 'Audience and entry requirements', 'الجمهور والمتطلبات')}</Label>
    <Label>{program.audience}</Label><Label>{program.requirements}</Label>
    <Label bold>{t('À la fin, vous pourrez', 'After finishing, you can', 'بعد الإكمال تستطيع')}</Label>
    {program.outcomes.map(s => <Label key={s}>• {s}</Label>)}
    <Label bold>{t('Progression pédagogique', 'Learning sequence', 'تسلسل التعلم')}</Label>
    {program.sequence.map(s => <Label key={s}>{s}</Label>)}
    <Label>{t('Estimation : ', 'Estimated lesson workload: ', 'المدة التقديرية للدروس: ')}{minutes} min</Label>
    <Label>{program.workload}</Label>
    {courseId === 'science-world' && <>
      <Button quiet title={t('Expérience intégrée sur les saisons', 'Open the embedded seasons experiment', 'افتح تجربة الفصول المدمجة')} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: 'science-seasons-capstone', course: courseId } })} />
      <Button quiet title={t('Explorer le globe', 'Explore the World globe', 'استكشف الكرة الأرضية')} onPress={() => router.push('/world')} />
    </>}
    <Label>{t('Validation : quiz, pratique requise et revue du projet. Les acquis anciens sont conservés. La maîtrise demande une nouvelle tâche autonome et une révision différée.', 'Completion: quizzes, required practice and project self-review. Legacy completion records are preserved. Mastery needs a fresh independent task and delayed review.', 'الإكمال: الاختبارات والتطبيق المطلوب ومراجعة المشروع ذاتياً. تبقى الإنجازات السابقة محفوظة. الإتقان يحتاج مهمة مستقلة جديدة ومراجعة مؤجلة.')}</Label>
    {gaps.length > 0 && <Label bold>{t('Révision recommandée', 'Recommended revision', 'مراجعة موصى بها')}</Label>}
    {gaps.map(l => <Button key={l.id} quiet title={l.title} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: l.id, course: courseId } })} />)}
    <Label bold>{t('Après ce parcours', 'Next learning opportunities', 'فرص التعلم التالية')}</Label>
    {program.next.map(id => {
      const next = library.find(c => c.id === id);
      return next ? <Button key={id} quiet title={t(next.title[0], next.title[1], next.title[2])} onPress={() => router.push({ pathname: '/course/[id]', params: { id } })} /> : null;
    })}
  </Card>;
}
