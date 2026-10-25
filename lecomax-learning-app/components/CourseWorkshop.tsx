import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, Button, Field, Label } from './UI';
import { useSchool } from '../store/School';
import { courseWorkshops, workshopDraftKey, type CourseId, type WorkshopStage } from '../constants/course-workshops';

function ProjectStage({ courseId, stage, number }: { courseId: CourseId; stage: WorkshopStage; number: number }) {
  const { state, update, ready, t } = useSchool();
  const [expanded, setExpanded] = useState(false);
  const [review, setReview] = useState(false);
  const key = workshopDraftKey(courseId, stage.id);
  return (
    <View style={{ gap: 12 }}>
      <Button quiet selected={expanded} title={`${number}. ${t(...stage.title)}`} onPress={() => setExpanded(v => !v)} />
      {expanded && <>
        <Label>{t(...stage.task)}</Label>
        <Label bold>{t('Preuve attendue', 'Expected evidence', 'الدليل المطلوب')}</Label>
        <Label>{t(...stage.verify)}</Label>
        <Field
          multiline
          editable={ready}
          placeholder={t('Votre essai, résultat et explication', 'Your attempt, result and explanation', 'المحاولة والنتيجة والتفسير ديالك')}
          value={state.drafts[key] || ''}
          onChangeText={text => update(p => ({ ...p, drafts: { ...p.drafts, [key]: text } }))}
        />
        <Button quiet selected={review} title={review ? t('Masquer la revue', 'Hide worked review', 'خبي المراجعة') : t('Comparer avec la revue', 'Compare with worked review', 'قارن مع المراجعة')}
          onPress={() => setReview(v => !v)} />
        {review && <Label>{t(...stage.review)}</Label>}
        <Button quiet icon="book-outline" title={t('Revoir les leçons utiles', 'Review supporting lessons', 'راجع الدروس المفيدة')}
          onPress={() => router.push({ pathname: '/module/[id]', params: { id: stage.module, course: courseId } })} />
      </>}
    </View>
  );
}

export function CourseWorkshop({ courseId }: { courseId: CourseId }) {
  const { state, update, ready, error, retry, t } = useSchool();
  const [expanded, setExpanded] = useState(false);
  const workshop = courseWorkshops[courseId];
  const defenseKey = workshopDraftKey(courseId, 'defense');
  const attempts = workshop.stages.filter(s => state.drafts[workshopDraftKey(courseId, s.id)]?.trim()).length;
  return (
    <Card>
      <Label muted size={12}>{t('ATELIER DE PROJET', 'PROJECT WORKSHOP', 'ورشة المشروع')}</Label>
      <Label bold size={20}>{t(...workshop.title)}</Label>
      {workshop.contentLanguage === 'en' && <Label muted>{t('Atelier rédigé en anglais', 'Workshop instruction is English', 'محتوى الورشة بالإنجليزية')}</Label>}
      <Label>{t(...workshop.brief)}</Label>
      <Label muted size={12}>{t(`${attempts}/${workshop.stages.length} étapes avec notes`, `${attempts}/${workshop.stages.length} stages with notes`, `${attempts}/${workshop.stages.length} مراحل فيها ملاحظات`)}</Label>
      <Button selected={expanded} icon="hammer-outline" title={expanded ? t('Fermer l’atelier', 'Close workshop', 'سد الورشة') : t('Ouvrir l’atelier', 'Open workshop', 'حل الورشة')}
        onPress={() => setExpanded(v => !v)} />
      {expanded && <>
        <Label bold>{t('À livrer', 'What to deliver', 'شنو تسلم')}</Label>
        <Label>{t(...workshop.deliverable)}</Label>
        <Label muted>{t('Essayez, notez le résultat, puis ouvrez la revue. Les notes restent sur cet appareil via la sauvegarde habituelle ; elles ne constituent pas une correction automatique.', 'Attempt the task, record the result, then open the review. Notes use the app’s existing on-device storage; they are not automatically graded.', 'جرب المهمة وسجل النتيجة ومن بعد حل المراجعة. الملاحظات كتستعمل التخزين ديال التطبيق فهاد الجهاز وماشي تصحيح آلي.')}</Label>
        {workshop.stages.map((stage, i) => <ProjectStage key={`${courseId}:${stage.id}`} courseId={courseId} stage={stage} number={i + 1} />)}
        <Label bold>{t('Expliquer vos décisions', 'Defend your decisions', 'فسر القرارات ديالك')}</Label>
        <Label>{t(...workshop.defense)}</Label>
        <Field multiline editable={ready} placeholder={t('Votre justification et les limites restantes', 'Your reasoning and remaining limitations', 'التعليل والحدود اللي باقين')}
          value={state.drafts[defenseKey] || ''}
          onChangeText={text => update(p => ({ ...p, drafts: { ...p.drafts, [defenseKey]: text } }))} />
        <Label bold>{t('Critères de revue', 'Review criteria', 'معايير المراجعة')}</Label>
        <Label>{t('1. Reproductible : un autre lecteur refait le résultat.\n2. Correct : cas normal, limites et échec sont vérifiés.\n3. Explicable : vous justifiez les choix et leurs limites.\n4. Maintenable : fichiers, noms et instructions sont compréhensibles.', '1. Reproducible: another learner can repeat the result.\n2. Correct: normal, boundary and failure cases are checked.\n3. Explainable: you justify choices and limitations.\n4. Maintainable: files, names and instructions are understandable.', '1. قابل للإعادة: متعلم آخر يعاود النتيجة.\n2. صحيح: الحالة العادية والحدود والفشل متجربين.\n3. مفهوم: كتفسر الاختيارات والحدود.\n4. قابل للصيانة: الملفات والأسماء والتعليمات واضحين.')}</Label>
        <Label muted>{t('Si une preuve manque, revenez à l’étape concernée. Terminer des lectures ou écrire une note ne prouve pas encore la maîtrise du projet.', 'If evidence is missing, return to that stage. Finishing readings or writing notes does not by itself establish project mastery.', 'إلا الدليل ناقص رجع للمرحلة. إنهاء القراءة ولا كتابة ملاحظة بوحدهم ما كيبرهنوش إتقان المشروع.')}</Label>
      </>}
      {!!error && <><Label>{error}</Label><Button quiet title={t('Réessayer la sauvegarde', 'Retry saving', 'عاود الحفظ')} onPress={retry} /></>}
    </Card>
  );
}
