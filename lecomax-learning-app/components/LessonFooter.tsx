import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import type { Lesson } from '../types/content';
import { Button, Card, Field, Label, ProgressBar, Row } from './UI';

export function LessonFooter({ lesson, stage, onStageChange, onRestart, nextId, previousId, courseId, hasSource }: {
  lesson: Lesson; stage: number; onStageChange: (stage: number) => void; onRestart: () => void;
  nextId?: string; previousId?: string; courseId?: string; hasSource: boolean;
}) {
  const { state, update, t, colors, error, retry, saveStatus } = useSchool();
  const [promptMessage, setPromptMessage] = useState('');
  const [options, setOptions] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const note = state.notes[lesson.id] || '';
  const prompts = [
    t('L’idée importante :', 'The main idea:', 'الفكرة الأساسية:'),
    t('Mon exemple :', 'My example:', 'مثالي الخاص:'),
    t('Ma question :', 'My question:', 'سؤالي:'),
  ];
  const stages = [t('Comprendre', 'Understand', 'الفهم'), t('Explorer l’exemple', 'Explore the example', 'فهم المثال'), t('Pratiquer', 'Practice', 'التطبيق'), t('Vérifier mes acquis', 'Check my understanding', 'اختبار فهمي')];
  const save = (value: string) => update((p) => ({ ...p, notes: { ...p.notes, [lesson.id]: value } }));
  const curriculum = () => courseId
    ? router.push({ pathname: courseId.startsWith('path:') ? '/learning-path/[id]' : '/course/[id]', params: { id: courseId.replace(/^path:/, '') } })
    : router.push({ pathname: '/module/[id]', params: { id: lesson.moduleId } });
  const openLesson = (id: string) => router.replace({ pathname: '/lesson/[id]', params: { id, course: courseId } });
  return <View style={{ gap: 20 }}>
    <Card style={{ padding: 20, backgroundColor: colors.soft, gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label bold size={16}>{t('Ta prochaine étape', 'Your next step', 'خطوتك التالية')}</Label>
        <Label muted size={12}>{stage + 1} / 4</Label>
      </Row>
      <ProgressBar value={(stage + 1) / 4} />
      <Label muted size={13}>{stage < 3
        ? t('Continue quand tu es prêt. Tu peux revenir à cette étape à tout moment.', 'Continue when you are ready. You can return to this step any time.', 'تابع عندما تكون مستعدًا. يمكنك العودة إلى هذه الخطوة في أي وقت.')
        : t('Vérifie tes réponses et termine le cours ci-dessus avant de poursuivre.', 'Check your answers and complete the lesson above before moving on.', 'راجع إجاباتك وأكمل الدرس أعلاه قبل المتابعة.')}</Label>
      <Button title={stage < 3 ? t('Continuer : ', 'Continue: ', 'تابع إلى: ') + stages[stage + 1] : nextId ? t('Découvrir la leçon suivante', 'Open next lesson', 'افتح الدرس التالي') : t('Revenir au programme', 'Return to curriculum', 'العودة إلى البرنامج')}
        onPress={() => stage < 3 ? onStageChange(stage + 1) : nextId ? openLesson(nextId) : curriculum()} />
      {stage > 0 && <Button variant="ghost" title={t('Revenir à ', 'Back to ', 'العودة إلى: ') + stages[stage - 1]} onPress={() => onStageChange(stage - 1)} />}
    </Card>
    <Card style={{ padding: 20, gap: 16, borderRadius: 20, shadowOpacity: 0, elevation: 0 }}>
      <View style={{ gap: 6 }}>
        <Label bold size={19} accessibilityRole="header">{t('Mon carnet', 'My learning notes', 'دفتر تعلّمي')}</Label>
        <Label muted size={13}>{t('Garde une idée à retenir. Une phrase avec tes mots suffit.', 'Keep one idea worth remembering. A sentence in your own words is enough.', 'احتفظ بفكرة تستحق التذكّر. تكفي جملة واحدة بأسلوبك.')}</Label>
      </View>
      <View style={{ gap: 8 }}>
        <Label bold size={12}>{t('Besoin d’un début ? Choisis une piste.', 'Need a starting point? Choose a prompt.', 'لا تعرف من أين تبدأ؟ اختر فكرة للكتابة.')}</Label>
        <Row style={{ gap: 6, flexWrap: 'nowrap', alignItems: 'stretch' }}>{prompts.map((prompt, index) => <View key={prompt} style={{ flex: 1, minWidth: 0 }}>
          <Button quiet selected={note.includes(prompt)} style={{ paddingHorizontal: 6, minHeight: 48, borderRadius: 12 }}
            title={index === 0 ? t('Idée', 'The main idea:', 'فكرة') : index === 1 ? t('Exemple', 'My example:', 'مثال') : t('Question', 'My question:', 'سؤال')}
            onPress={() => {
              const exists = note.includes(prompt);
              if (!exists) save(note + (note.trim() ? '\n\n' : '') + prompt + ' ');
              setPromptMessage(exists
                ? t('Ce repère est déjà dans ta note. Complète-le ci-dessous.', 'This prompt is already in your note. Continue it below.', 'هذه الفكرة موجودة في ملاحظتك. أكمل الكتابة تحتها.')
                : t('Repère ajouté. Complète-le avec tes mots.', 'Prompt added. Continue in your own words.', 'أُضيفت بداية الفكرة. أكملها بكلماتك.'));
            }} />
        </View>)}</Row>
        {!!promptMessage && <Label size={12} accessibilityLiveRegion="polite" style={{ color: colors.accent }}>{promptMessage}</Label>}
      </View>
      <View style={{ gap: 8 }}>
        <Label bold size={13}>{t('Ma note', 'My note', 'ملاحظتي')}</Label>
        <Field multiline minHeight={160} accessibilityLabel={t('Ma note pour ce cours', 'My note for this lesson', 'ملاحظتي لهذا الدرس')} value={note} onChangeText={(value) => { save(value); setPromptMessage(''); }} placeholder={t('Aujourd’hui, j’ai compris que…', 'Today I understood that…', 'اليوم فهمت أن…\nويمكنني استخدام ذلك في…')} />
      </View>
      <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }}>
        <Label muted size={12} accessibilityRole={error ? 'alert' : undefined} style={error ? { color: colors.danger } : undefined}>{error
          ? t('La sauvegarde a échoué. Garde cette page ouverte et réessaie.', 'Saving failed. Keep this page open and retry.', 'تعذّر الحفظ. أبقِ الصفحة مفتوحة وأعد المحاولة.')
          : saveStatus === 'saved'
            ? t('Enregistré sur cet appareil.', 'Saved on this device.', 'محفوظ على هذا الجهاز.')
            : t('Enregistrement sur cet appareil…', 'Saving on this device…', 'جارٍ الحفظ على هذا الجهاز…')}</Label>
        {!!error && <Button quiet title={t('Réessayer la sauvegarde', 'Retry saving', 'إعادة محاولة الحفظ')} onPress={retry} />}
        <Button variant="ghost" icon="document-text-outline" title={t('Toutes mes notes', 'View all my notes', 'عرض جميع ملاحظاتي')} onPress={() => router.push({ pathname: '/collection/[kind]', params: { kind: 'notes' } })} />
      </View>
    </Card>



    <View style={{ gap: 10 }}>
      <Button quiet icon="chatbubble-ellipses-outline" title={t('Besoin d’aide ? Demander au professeur', 'Need help? Ask the teacher', 'تحتاج مساعدة؟ اسأل المعلّم')} onPress={() => router.push({ pathname: '/(tabs)/teacher', params: { file: lesson.relatedFiles.find((file) => /^(app|lib|components)\/.+\.tsx?$/.test(file)), lesson: lesson.id, explain: String(Date.now()) } })} />
      <Button variant="ghost" icon="list-outline" title={t('Voir toutes les leçons', 'View all lessons', 'عرض جميع الدروس')} onPress={curriculum} />
      <Button variant="ghost" icon={options ? 'chevron-up' : 'ellipsis-horizontal'} title={options ? t('Moins d’options', 'Fewer options', 'إخفاء الخيارات') : t('Autres options', 'More options', 'خيارات إضافية')} onPress={() => { setOptions(!options); setConfirmRestart(false); }} />
    </View>
    {options && <Card style={{ padding: 16 }}>
      {!!previousId && <Button quiet title={t('Ouvrir la leçon précédente', 'Open previous lesson', 'افتح الدرس السابق')} onPress={() => openLesson(previousId)} />}
      <Button quiet icon="refresh-outline" title={t('Recommencer cette leçon', 'Restart this lesson', 'إعادة هذا الدرس')} onPress={() => setConfirmRestart(!confirmRestart)} />
      {confirmRestart && <View style={{ gap: 12 }}>
        <Label size={13}>{t('Les réponses au quiz et la validation de ce cours seront réinitialisées. Tes notes et essais sont conservés.', 'This resets the quiz answers and completion for this lesson. Your notes and practice drafts are kept.', 'ستُصفّر إجابات الاختبار وحالة إكمال هذا الدرس. تبقى ملاحظاتك ومحاولاتك محفوظة.')}</Label>
        <Row>
          <Button title={t('Oui, recommencer', 'Yes, restart', 'نعم، أعد الدرس')} onPress={() => { onRestart(); setConfirmRestart(false); setOptions(false); }} />
          <Button quiet title={t('Annuler', 'Cancel', 'إلغاء')} onPress={() => setConfirmRestart(false)} />
        </Row>
      </View>}
      {hasSource && <Button quiet icon="code-slash-outline" title={t('Explorer le fichier source', 'Explore source file', 'استكشف ملف الكود')} onPress={() => router.push({ pathname: '/file', params: { path: lesson.source } })} />}
    </Card>}
  </View>;
}
