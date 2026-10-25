import { Linking } from 'react-native';
import type { Lesson } from '../types/content';
import { useSchool } from '../store/School';
import { rubricKey } from '../services/curriculum-evidence';
import { Button, Card, Label } from './UI';

export function CurriculumRubric({ lesson }: { lesson: Lesson }) {
  const { state, update, t } = useSchool();
  if (!lesson.curriculum) return null;
  return <Card>
    <Label bold>{t('Évaluation pratique', 'Practice rubric', 'معايير التطبيق')}</Label>
    <Label>{t('Auto-évaluation : 0 = absent, 1 = avec aide, 2 = autonome avec preuve. Enregistrez votre travail dans le brouillon. Ce score ne certifie pas la maîtrise.', 'Self-review: 0 = missing, 1 = with help, 2 = independent with evidence. Save your work in the exercise draft. This rating does not certify mastery.', 'تقييم ذاتي: 0 = غير منجز، 1 = بمساعدة، 2 = مستقل مع دليل. احفظ العمل في المسودة. هذا التقييم ليس شهادة إتقان.')}</Label>
    {lesson.curriculum.rubric.map((r, i) => <Card key={r.criterion}>
      <Label bold>{r.criterion}</Label><Label>{r.evidence}</Label>
      {['0', '1', '2'].map(score => <Button key={score} quiet selected={state.drafts[rubricKey(lesson.id, i)] === score} title={`${r.criterion}: ${score}`} onPress={() => update(p => ({ ...p, drafts: { ...p.drafts, [rubricKey(lesson.id, i)]: score } }))} />)}
      {state.drafts[rubricKey(lesson.id, i)] !== '2' && <Label>{t('À revoir : ', 'Revise: ', 'راجع: ')}{r.revise}</Label>}
    </Card>)}
    <Label bold>{t('Sources de référence', 'Reference sources', 'المصادر المرجعية')}</Label>
    {lesson.curriculum.sources.map(s => <Button key={s.url} quiet title={s.title} onPress={() => void Linking.openURL(s.url)} />)}
  </Card>;
}
