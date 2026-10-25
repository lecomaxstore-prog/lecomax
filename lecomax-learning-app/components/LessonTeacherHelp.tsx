import { useState } from 'react';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { teacherLessonRoute } from '../services/teacher-navigation';
import { Button, Card, Label } from './UI';

export function LessonTeacherHelp({ title, lessonId }: { title: string; lessonId?: string }) {
  const { state, t } = useSchool();
  const [expanded, setExpanded] = useState(false);
  return <Card style={{ padding: 12, gap: 8, shadowOpacity: 0, elevation: 0 }}>
    <Button variant="ghost" icon="sparkles-outline" title={expanded ? t('Masquer l’aide', 'Hide teacher help', 'إخفاء مساعدة المعلّم') : t('Besoin d’aide ? Le professeur IA peut expliquer', 'Need help? Ask the AI teacher', 'تحتاج شرحًا؟ اسأل المعلّم الذكي')} onPress={() => setExpanded(value => !value)} />
    {expanded && <>
      <Label muted size={12}>{lessonId ? t('Choisissez une aide. Le professeur reçoit le contexte de cette leçon.', 'Choose how to learn. The teacher receives this lesson’s context.', 'اختر ما يساعدك. سيعرف المعلّم الدرس الذي تتعلّمه.') : t('Le professeur vous aide à comprendre ce sujet et à le pratiquer.', 'The teacher can help you understand and practise this topic.', 'يساعدك المعلّم على فهم هذا الموضوع والتدرّب عليه.')}</Label>
      <Button quiet icon="bulb-outline" title={t('Explique simplement', 'Explain simply', 'اشرح لي ببساطة')} onPress={() => router.push(teacherLessonRoute(title, state.language, lessonId, 'explain'))} />
      <Button quiet icon="reader-outline" title={t('Montre un exemple', 'Show an example', 'أعطني مثالًا')} onPress={() => router.push(teacherLessonRoute(title, state.language, lessonId, 'example'))} />
      <Button quiet icon="create-outline" title={t('Aide-moi à pratiquer', 'Help me practise', 'ساعدني على التطبيق')} onPress={() => router.push(teacherLessonRoute(title, state.language, lessonId, 'practice'))} />
    </>}
  </Card>;
}
