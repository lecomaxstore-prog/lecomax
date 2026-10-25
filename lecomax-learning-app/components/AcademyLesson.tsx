import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Row } from './UI';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CodeViewer } from './CodeViewer';
import { useSchool } from '../store/School';
import { getAcademyLesson, explanationWords } from '../services/academy';
import type { AcademyExercise, AcademyLesson } from '../types/academy';

export function AcademyIntroduction({ lesson }: { lesson: AcademyLesson }) {
  const { state, t, colors, rtl } = useSchool();
  const words = explanationWords(lesson);
  const readingMinutes = Math.max(1, Math.ceil(words / 120));
  const format = (value: number) => value.toLocaleString(state.language);
  return <Card style={{ padding: 20, gap: 22, shadowOpacity: 0, elevation: 0 }}>
    <Row style={{ flexWrap: 'nowrap', gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="compass-outline" size={23} color={colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Label bold size={18} accessibilityRole="header">{t('Avant de commencer', 'Before you begin', 'قبل ما تبدا')}</Label>
        <Label muted size={12}>{t('Les repères pour cette leçon', 'Your guide to this lesson', 'نظرة سريعة على الدرس')}</Label>
      </View>
    </Row>

    <Row style={{ alignItems: 'stretch', gap: 8 }}>
      {[
        { icon: 'layers-outline', value: format(lesson.difficulty), label: t('Niveau', 'Level', 'المستوى') },
        { icon: 'time-outline', value: t(`≈ ${readingMinutes} min`, `≈ ${readingMinutes} min`, `≈ ${format(readingMinutes)} د`), label: t('Lecture', 'Reading', 'وقت القراءة') },
        { icon: 'document-text-outline', value: format(words), label: t('Mots', 'Words', 'كلمة شرح') },
      ].map(item => <View key={item.icon} style={{ flex: 1, minWidth: 72, paddingVertical: 12, paddingHorizontal: 6, gap: 4, alignItems: 'center', backgroundColor: colors.neutral, borderRadius: 12 }}>
        <Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>['name']} size={17} color={colors.muted} />
        <Label bold size={16} style={{ textAlign: 'center' }}>{item.value}</Label>
        <Label muted size={11} style={{ textAlign: 'center' }}>{item.label}</Label>
      </View>)}
    </Row>
    <Label muted size={12} style={{ marginTop: -12 }}>{t('Lecture estimée à 120 mots/min. Prévoyez aussi du temps pour pratiquer.', 'Reading estimated at 120 words/min. Allow extra time for practice.', 'وقت القراءة تقريبي، على أساس 120 كلمة فالدقيقة. زيد عليه وقت التطبيق.')}</Label>

    <View style={{ padding: 14, gap: 8, borderRadius: 14, backgroundColor: colors.soft }}>
      <Row style={{ gap: 7, flexWrap: 'nowrap' }}>
        <Ionicons name={lesson.prerequisites.length ? 'school-outline' : 'checkmark-circle-outline'} size={18} color={colors.accent} />
        <Label bold size={13} style={{ flex: 1, color: colors.accent }}>{t('Prérequis', 'Prerequisites', 'شنو خاصك تعرف قبل')}</Label>
      </Row>
      {lesson.prerequisites.length === 0
        ? <Label size={14}>{t('Aucune expérience en programmation nécessaire.', 'No programming experience needed.', 'ما محتاج حتى تجربة سابقة فالبرمجة.')}</Label>
        : lesson.prerequisites.map(id => {
          const prerequisite = getAcademyLesson(id, state.language);
          return <Button key={id} quiet icon={rtl ? 'arrow-back' : 'arrow-forward'} title={prerequisite?.title || id}
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id } })} />;
        })}
    </View>

    <View style={{ gap: 14 }}>
      <Label bold size={15} accessibilityRole="header">{t('Ce que vous allez apprendre', 'What you will learn', 'شنو غادي تتعلّم')}</Label>
      {lesson.objectives.map((objective, index) => <Row key={objective} style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 12, paddingTop: index ? 14 : 0, borderTopWidth: index ? 1 : 0, borderTopColor: colors.line }}>
        <View style={{ width: 28, height: 28, marginTop: 2, borderRadius: 9, backgroundColor: colors.neutral, alignItems: 'center', justifyContent: 'center' }}>
          <Label bold size={12} style={{ color: colors.accent, textAlign: 'center' }}>{format(index + 1)}</Label>
        </View>
        <Label size={15} style={{ flex: 1, minWidth: 0, lineHeight: rtl ? 27 : 24 }}>{objective}</Label>
      </Row>)}
    </View>
    {lesson.references.length > 0 && <View style={{ gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Label bold size={13}>{t('Références vérifiées', 'Verified references', 'مراجع تحققنا منها')}</Label>
      {lesson.references.map(reference => <View key={reference.url} style={{ gap: 3 }}>
        <Label selectable size={13}>{reference.title}</Label>
        <Label selectable muted size={11} style={{ writingDirection: 'ltr', textAlign: 'left' }}>{reference.url}</Label>
        <Label muted size={11}>{reference.verifiedOn}</Label>
      </View>)}
    </View>}
  </Card>;
}

function Exercise({ lessonId, exercise, number }: { lessonId: string; exercise: AcademyExercise; number: number }) {
  const { state, update, t } = useSchool();
  const [hints, setHints] = useState(false);
  const [solution, setSolution] = useState(false);
  const key = 'academy:exercise:' + lessonId + ':' + exercise.id;
  return <Card>
    <Label bold accessibilityRole="header">{t('Exercice', 'Exercise', 'تمرين')} {number} · {t('Niveau', 'Level', 'المستوى')} {exercise.difficulty}</Label>
    <Label selectable>{exercise.task}</Label>
    <Label muted>{t('Résultat attendu', 'Expected result', 'النتيجة المنتظرة')}: {exercise.expectedResult}</Label>
    <Field multiline value={state.drafts[key] || ''}
      placeholder={t('Mon essai et mes observations', 'My attempt and observations', 'محاولتي والملاحظات ديالي')}
      onChangeText={value => update(previous => ({ ...previous, drafts: { ...previous.drafts, [key]: value } }))} />
    <Label muted size={12}>{t('Carnet sauvegardé, sans exécution automatique.', 'Saved notebook; code is not executed here.', 'دفتر محفوظ؛ الكود ما كيتنفذش هنا.')}</Label>
    <Button quiet title={hints ? t('Masquer les indices', 'Hide hints', 'خبي التلميحات') : t('Voir les indices', 'Show hints', 'شوف التلميحات')} onPress={() => setHints(value => !value)} />
    {hints && exercise.hints.map(hint => <Label key={hint}>{hint}</Label>)}
    <Button quiet title={solution ? t('Masquer la solution', 'Hide solution', 'خبي الحل') : t('Solution expliquée', 'Worked solution', 'الحل مع الشرح')} onPress={() => setSolution(value => !value)} />
    {solution && <>
      <CodeViewer code={exercise.solution} filename={t('Solution', 'Solution', 'الحل')} />
      <Label selectable>{exercise.walkthrough}</Label>
      <Label muted>{t('Compare, puis recommence sans regarder.', 'Compare your reasoning, then repeat without looking.', 'قارن طريقة التفكير وعاود بلا ما تشوف الحل.')}</Label>
    </>}
  </Card>;
}
export function AcademyPractice({ lesson }: { lesson: AcademyLesson }) {
  return <View style={{ gap: 16 }}>{lesson.exercises.map((exercise, index) =>
    <Exercise key={lesson.id + ':' + exercise.id} lessonId={lesson.id} exercise={exercise} number={index + 1} />
  )}</View>;
}
export function AcademyReadiness({ lesson }: { lesson: AcademyLesson }) {
  const { state, update, t } = useSchool();
  return <Card>
    <Label bold accessibilityRole="header">{t('Avant de progresser', 'Before progressing', 'قبل ما تكمل')}</Label>
    <Label muted>{t('Autoévaluation : confirme après la pratique. Ce n’est pas une correction automatique du code.', 'Self-assessment: confirm after practicing. This does not automatically grade your code.', 'تقييم ذاتي: أكد غير من بعد التطبيق. هادا ماشي تصحيح آلي للكود.')}</Label>
    {lesson.readiness.map((skill, index) => {
      const key = 'academy:skill:' + lesson.id + ':' + index;
      const selected = state.drafts[key] === 'yes';
      return <Button key={key} quiet selected={selected} icon={selected ? 'checkmark-circle' : 'ellipse-outline'} title={skill}
        onPress={() => update(previous => ({ ...previous, drafts: { ...previous.drafts, [key]: previous.drafts[key] === 'yes' ? '' : 'yes' } }))} />;
    })}
  </Card>;
}
