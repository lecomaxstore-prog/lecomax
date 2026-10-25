import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Label, Page } from '../components/UI';
import { useSchool } from '../store/School';
import { getLesson } from '../services/content';
import { dueReviews } from '../utils/learning-memory';
import { recordAnswer } from '../utils/progress';
export default function Knowledge() {
  const { state, update, t } = useSchool();
  const [result, setResult] = useState<{ key: string; correct: boolean; explanation: string } | null>(null);
  const reviews = dueReviews(state);
  const available = reviews.map(r => {
    const [planId, step] = r.lessonId.split(':');
    const generated = state.academy?.plans.find(p => p.id === planId)?.lessons[Number(step)];
    const lesson = getLesson(r.lessonId, state.language) || (generated ? { title: generated.title, quiz: generated.quiz.map((q, i) => ({ id: 'q' + i, question: q.prompt, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, answerExplanations: undefined })) } : undefined);
    return { ...r, lesson };
  }).filter(r => r.lesson?.quiz.some(q => q.id === r.questionId));
  const current = available[0];
  const question = current?.lesson?.quiz.find(q => q.id === current.questionId);
  return <Page title={t('Mes connaissances', 'My knowledge', 'معرفتي')}>
    <Card><Label bold>{t('Des preuves, pas des suppositions', 'Evidence, not assumptions', 'تقدّم مبني على إجاباتك')}</Label>
      <Label>{Object.keys(state.memory.reviews).length} · {t('questions évaluées', 'assessed questions', 'أسئلة تم تقييمها')}</Label>
      <Label>{reviews.length} · {t('révisions à faire', 'reviews due', 'مراجعات مستحقة')}</Label>
      <Label muted>{t('Les réponses corrigées ne prouvent pas une maîtrise indépendante. Les anciennes réponses restent conservées sans dates inventées.', 'Corrected answers do not prove independent mastery. Older answers are preserved without invented dates.', 'الإجابات المصححة لا تثبت الإتقان المستقل. إجاباتك القديمة محفوظة دون اختلاق تواريخ.')}</Label>
    </Card>
    {result ? <Card><Label accessibilityLiveRegion="polite" bold>{result.correct ? t('Bonne réponse', 'Correct', 'إجابة صحيحة') : t('À retravailler', 'Needs practice', 'تحتاج إلى مراجعة')}</Label><Label>{result.explanation}</Label><Button title={t('Continuer', 'Continue', 'متابعة')} onPress={() => setResult(null)} /></Card> : current && question ? <Card>
      <Label bold>{current.lesson!.title}</Label><Label>{question.question}</Label>
      {question.options.map((option, i) => <Button quiet key={i} title={option} onPress={() => {
        update(p => recordAnswer(p, current.lessonId, question.id, i, i === question.correctIndex));
        setResult({ key: current.lessonId + question.id, correct: i === question.correctIndex, explanation: question.answerExplanations?.[i] || question.explanation });
      }} />)}
      <Button quiet title={t('Revoir le cours', 'Revisit lesson', 'راجع الدرس')} onPress={() => current.lessonId.startsWith('plan-') ? router.push({ pathname: '/plan-lesson', params: { plan: current.lessonId.split(':')[0], step: current.lessonId.split(':')[1] } }) : router.push({ pathname: '/lesson/[id]', params: { id: current.lessonId } })} />
    </Card> : <Card><Label>{t('Aucune question disponible à réviser maintenant. Les prochains quiz alimenteront ton programme de révision.', 'No review questions available right now. Your next quizzes will build your review schedule.', 'لا توجد أسئلة متاحة للمراجعة الآن. اختباراتك القادمة ستبني جدول المراجعة.')}</Label></Card>}
    {reviews.length > available.length && <Label muted>{t('Certaines anciennes questions ne sont plus disponibles dans le cours actuel. Leur historique est conservé.', 'Some older questions are unavailable in the current course. Their history is preserved.', 'بعض الأسئلة القديمة غير متاحة في المحتوى الحالي. سجلها محفوظ.')}</Label>}
    <Button quiet title={t('Demander au professeur', 'Ask your professor', 'اسأل أستاذك')} onPress={() => router.push('/teacher')} />
  </Page>;
}
