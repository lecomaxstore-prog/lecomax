import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CourseLessonList } from '../../components/CourseLessonList';
import { LessonTeacherHelp } from '../../components/LessonTeacherHelp';
import { curriculum, phaseTitles } from '../../data/university/curriculum';
import { pathModules, pathLessons } from '../../services/curriculum';
import { useSchool } from '../../store/School';
import { Button, Card, EmptyState, Label, Page, ProgressBar } from '../../components/UI';

export default function LearningPath() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, t, colors } = useSchool();
  const path = curriculum.find(p => p.id === id);
  if (!path) return <Page title={t('Parcours introuvable', 'Path not found', 'المسار غير موجود')}><EmptyState title={t('Retrouvez votre chemin', 'Find your next step', 'اكتشف خطوتك التالية')} action={t('Explorer les parcours', 'Explore learning paths', 'اكتشف مسارات التعلّم')} onAction={() => router.replace('/path')} /></Page>;
  const items = pathLessons(path);
  const done = items.filter(l => state.completed.includes(l.id)).length;
  const next = items.find(l => l.id === state.lastLesson && !state.completed.includes(l.id)) || items.find(l => !state.completed.includes(l.id)) || items[0];
  const previous = curriculum[curriculum.indexOf(path) - 1];
  return (
    <Page title={path.title[state.language]} subtitle={phaseTitles[path.phase]?.[state.language]} compactSpacing>
      {items.length > 0 && done === items.length && <Card style={{ backgroundColor: colors.amberSoft, borderColor: colors.amber }}>
        <EmptyState icon="ribbon-outline" title={t('Une étape franchie', 'A milestone worth celebrating', 'خطوة تستحق الاحتفاء')}
          description={t('Vous avez terminé toutes les leçons publiées de ce parcours. Prenez un moment pour revoir vos acquis, puis choisissez votre prochain sujet.', 'You completed every published lesson in this path. Revisit what you learned, then choose your next topic.', 'أكملت كل الدروس المنشورة في هذا المسار. راجع ما تعلّمته، ثم اختر موضوعك التالي.')}
          action={t('Choisir la suite', 'Choose my next topic', 'اختر موضوعي التالي')} onAction={() => router.push('/path')} />
      </Card>}
      <Card style={{ borderWidth: 0, backgroundColor: colors.soft, padding: 16 }}>
        <Label bold>{items.length ? t('Premières leçons disponibles', 'Starting lessons available', 'دروس البداية متاحة') : t('Au programme', 'Planned curriculum', 'ضمن البرنامج المخطّط')}</Label>
        <Label muted size={14}>{t('Le programme complet ci-dessous sera enrichi progressivement.', 'The full syllabus below will be authored progressively.', 'سنُكمل محاور البرنامج أدناه تدريجيًا؛ الدروس المتاحة لا تعني اكتمال المحور كله.')}</Label>
        {items.length > 0 && <>
          <Label size={12}>{done} / {items.length} · {Math.round(done / items.length * 100)}%</Label>
          <ProgressBar value={done / items.length} />
          {next && <Button title={done === items.length ? t('Revoir', 'Review lessons', 'راجع الدروس') : t('Commencer / continuer', 'Start / continue', 'ابدأ أو تابع')} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: next.id, course: 'path:' + path.id } })} />}
        </>}
      </Card>
      <LessonTeacherHelp title={path.title[state.language]} />
      <CourseLessonList modules={pathModules(path)} courseId={'path:' + path.id} />
      {previous && <Button variant="ghost" title={t('Étape précédente : ', 'Previous step: ', 'الخطوة السابقة: ') + previous.title[state.language]} onPress={() => router.push({ pathname: '/learning-path/[id]', params: { id: previous.id } })} />}
      <Label bold accessibilityRole="header">{t('Objectifs du parcours', 'Path syllabus', 'ماذا ستتعلّم في هذا المحور؟')}</Label>
      {path.syllabus.map((topic, i) => <Label key={topic} size={14}>{i + 1} · {topic}</Label>)}
      {!items.length && <Label muted>{t('Aucune leçon publiée pour ce thème. Explorez les fondations en attendant.', 'No published lessons for this topic yet. Explore the foundations in the meantime.', 'لا توجد دروس منشورة لهذا المحور بعد. يمكنك متابعة الأساسيات المتاحة الآن.')}</Label>}
      <Button quiet title={t('Toute la carte', 'Full curriculum', 'خريطة التعلّم كاملة')} onPress={() => router.push('/path')} />
    </Page>
  );
}
