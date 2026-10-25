import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Lesson } from '../types/content';
import { useSchool } from '../store/School';
import { Button, Card, Field, Label, Row } from './UI';

export function StudyCoach({ lesson, children }: { lesson: Lesson; children: React.ReactNode }) {
  const { state, update, t, colors } = useSchool();
  const [recall, setRecall] = useState(false);
  const [compare, setCompare] = useState(false);
  const [guide, setGuide] = useState(false);
  const key = 'study:recall:' + lesson.id;
  const ratingKey = 'study:confidence:' + lesson.id;
  const answer = state.drafts[key] || '';
  return <View style={{ gap: 16 }}>
    <Card style={{ backgroundColor: colors.soft, padding: 16, borderWidth: 0 }}>
      <Label bold size={15}>{t('À la fin, tu dois pouvoir…', 'By the end, aim to…', 'في النهاية حاول أن تستطيع…')}</Label>
      <Label size={14}>{lesson.subtitle || lesson.concept || lesson.title}</Label>
      <Button quiet icon="bulb-outline" title={guide ? t('Masquer la méthode', 'Hide study method', 'إخفاء طريقة التعلّم') : t('Comment étudier ce cours ?', 'How should I study this?', 'كيف أدرس هذا الدرس؟')} onPress={() => setGuide(!guide)} />
      {guide && <>
        <Label size={14}>{t('1. Lis une partie et explique un mot nouveau.\n2. Avant de voir le résultat, prédis ce qui va se passer.\n3. Fais un petit exercice sans recopier.\n4. Cache le cours, explique puis compare et corrige.', '1. Read one section and explain an unfamiliar word.\n2. Predict what happens before checking the result.\n3. Try a small exercise without copying.\n4. Hide the lesson, explain, then compare and correct.', '١. اقرأ جزءًا وافهم مصطلحًا جديدًا.\n٢. توقّع ما سيحدث قبل رؤية النتيجة.\n٣. جرّب تمرينًا صغيرًا دون نسخ.\n٤. أخفِ الدرس واشرح ثم قارن وصحّح.')}</Label>
        <Button quiet title={t('Les 4 leçons pour mieux apprendre', '4 lessons on learning effectively', '٤ دروس لتتعلّم بفعالية')} onPress={() => router.push({ pathname: '/module/[id]', params: { id: 'study-skills' } })} />
      </>}
    </Card>
    {!recall && children}
    <Card style={{ padding: 20, gap: 18, borderRadius: 20, shadowOpacity: 0, elevation: 0 }}>
      <Row style={{ gap: 10 }}>
        <View style={{ padding: 10, borderRadius: 12, backgroundColor: colors.soft }}><Ionicons name="bulb-outline" size={22} color={colors.accent} /></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Label bold size={18} accessibilityRole="header">{t('Vérifie ta compréhension', 'Check your understanding', 'تحقّق من فهمك')}</Label>
          <Label muted size={12}>{t('Explique · Compare · Évalue', 'Explain · Compare · Reflect', 'اشرح · قارن · قيّم فهمك')}</Label>
        </View>
      </Row>
      <Label muted size={13}>{t('Sans regarder : explique l’idée, donne un exemple et dis pourquoi il fonctionne.', 'Without looking: explain the idea, give an example, and say why it works.', 'بكلماتك أنت: ما الفكرة الأساسية؟ اكتب مثالًا بسيطًا يوضّحها. لا بأس إن كانت إجابتك غير مكتملة.')}</Label>
      <Button quiet icon={recall ? "eye-outline" : "eye-off-outline"} title={recall ? t('Relire le cours', 'Read the lesson again', 'قراءة الدرس مجددًا') : t('Cacher le cours et essayer', 'Hide lesson and try recall', 'أخفِ الدرس وجرّب التذكّر')} onPress={() => { setRecall(!recall); setCompare(false); }} />
      {recall && <Label size={12} style={{ color: colors.accent }} accessibilityLiveRegion="polite">{t('Le cours est masqué. Essaie de mémoire.', 'The lesson is hidden. Try from memory.', 'الدرس مخفي الآن. حاول أن تتذكّر دون الرجوع إليه.')}</Label>}
      <View style={{ gap: 8 }}>
      <Label bold size={13}>{t('Ton explication', 'Your explanation', 'إجابتك بكلماتك')}</Label>
      <Field multiline minHeight={140} accessibilityLabel={t('Ton explication et ton exemple', 'Your explanation and example', 'اكتب شرحك ومثالك')} value={answer} onChangeText={(value) => { if (!value.trim()) setCompare(false); update((p) => ({ ...p, drafts: { ...p.drafts, [key]: value, [ratingKey]: '' } })); }} placeholder={t('Mon explication, mon exemple, ce qui reste flou…', 'My explanation, my example, what is still unclear…', 'الفكرة كما فهمتها…\nمثال من عندي…')} />
      </View>
      <Label muted size={12}>{t('Sauvegarde automatique sur cet appareil ; vérifie le statut en bas de page. Auto-évaluation, sans note automatique.', 'Autosaves on this device; check the save status below. Self-assessment, not an automatic grade.', 'حفظ تلقائي على هذا الجهاز؛ تحقق من حالة الحفظ أسفل الصفحة. هذا تقييم ذاتي وليس تصحيحًا آليًا.')}</Label>
      {!answer.trim() && <Label muted size={12}>{t("Écris une première idée pour comparer ta réponse.", "Write a first idea to unlock comparison.", "اكتب فكرة واحدة لتتمكّن من مقارنة إجابتك.")}</Label>}
      <Button icon="checkmark-done-outline" disabled={!answer.trim()} title={compare ? t('Masquer les points clés', 'Hide key points', 'إخفاء النقاط الأساسية') : t('Comparer aux points clés', 'Compare with key points', 'قارن بالنقاط الأساسية')} onPress={() => setCompare(!compare)} />
      {compare && <View style={{ gap: 12, padding: 16, borderRadius: 14, backgroundColor: colors.soft }}>
        <Label bold size={14}>{t("Points clés", "Key points", "النقاط الأساسية")}</Label>
        {(lesson.summary.length ? lesson.summary : [lesson.concept]).filter(Boolean).map((point, i) => <Label key={i} size={14}>{i + 1}. {point}</Label>)}
        <Label muted size={13}>{t('Corrige une idée manquante ou fausse, puis invente un autre exemple. Les mots peuvent être différents si le sens est juste.', 'Correct one missing or mistaken idea, then invent another example. Different wording is fine when the meaning is correct.', 'صحّح فكرة ناقصة أو خاطئة، ثم اختر مثالًا آخر. لا يلزم تطابق الكلمات ما دام المعنى صحيحًا.')}</Label>
      </View>}
      {!!answer.trim() && <View style={{ gap: 10 }}>
      <Label bold size={14}>{t("Où en es-tu ?", "How did you do?", "كيف تقيّم فهمك الآن؟")}</Label>
      <Label muted size={12}>{t("Choisis ce qui te ressemble. Ce n’est pas une note.", "Choose what fits. This is not a grade.", "اختر ما يصف فهمك. هذا ليس اختبارًا بدرجات.")}</Label>
      <View style={{ gap: 8 }}>{([
        ['retry', t('Pas encore', 'Not yet', 'أحتاج إلى مراجعة الفكرة')],
        ['hint', t('Avec aide', 'With help', 'فهمتها بمساعدة')],
        ['independent', t('Seul + un exemple', 'Alone + an example', 'أستطيع شرحها مع مثال')],
      ] as const).map(([value, title]) => <Button key={value} quiet icon={state.drafts[ratingKey] === value ? "checkmark-circle" : "ellipse-outline"} style={{ justifyContent: "flex-start", borderRadius: 12 }} disabled={!answer.trim()} selected={state.drafts[ratingKey] === value} title={title} onPress={() => update((p) => ({ ...p, drafts: { ...p.drafts, [ratingKey]: value }, difficult: value === 'independent' ? p.difficult : [...new Set([...p.difficult, lesson.id])] }))} />)}</View>
      </View>}
      {!!state.drafts[ratingKey] && <Label size={13}>{state.drafts[ratingKey] === 'independent'
        ? t('Prochain pas : applique cette idée dans un nouvel exemple, puis réessaie demain sans notes.', 'Next: apply the idea to a new example, then try again tomorrow without notes.', 'التالي: طبّق الفكرة في مثال جديد، ثم حاول غدًا دون ملاحظات.')
        : t('Ajouté à « À revoir ». Relis la partie difficile, essaie avec un indice puis sans aide.', 'Added to Review later. Revisit the difficult section, try with a hint, then without help.', 'أُضيف إلى «للمراجعة». ارجع إلى الجزء الصعب، وحاول بتلميح ثم دون مساعدة.')}</Label>}
    </Card>
  </View>;
}

export function GuidedReading({ lesson }: { lesson: Lesson }) {
  const { t, colors, rtl, state } = useSchool();
  const [section, setSection] = useState(0);
  const [all, setAll] = useState(false);
  const blocks = lesson.explanation.filter((block) => block.text || block.title);
  const format = (value: number) => value.toLocaleString(state.language);
  const positionLabel = t(
    `Partie ${format(section + 1)} sur ${format(blocks.length)}`,
    `Section ${format(section + 1)} of ${format(blocks.length)}`,
    `الجزء ${format(section + 1)} من ${format(blocks.length)}`,
  );
  return <View style={{ gap: 16 }}>
    {!!lesson.concept && <Card style={{ padding: 20, gap: 12, shadowOpacity: 0, elevation: 0 }}>
      <Row style={{ gap: 8 }}>
        <Ionicons name="bulb-outline" size={18} color={colors.accent} />
        <Label bold size={13} style={{ color: colors.accent }}>{t('L’idée essentielle', 'The key idea', 'الفكرة الأساسية')}</Label>
      </Row>
      <Label selectable size={16} style={{ lineHeight: rtl ? 30 : 27 }}>{lesson.concept}</Label>
    </Card>}
    {blocks.length > 1 && <View style={{ gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}>
      <Row style={{ justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 120, gap: 3 }}>
          <Label bold size={13}>{t('Lecture guidée', 'Guided reading', 'قراءة موجّهة')}</Label>
          <Label muted size={12} accessibilityLiveRegion="polite">{all ? t(`${format(blocks.length)} parties affichées`, `All ${format(blocks.length)} sections`, `كل الأجزاء · ${format(blocks.length)}`) : positionLabel}</Label>
        </View>
        <Button quiet selected={all} icon={all ? 'list-outline' : 'reader-outline'} style={{ minHeight: 44, paddingHorizontal: 12, borderRadius: 10 }} title={all ? t('Pas à pas', 'Step by step', 'خطوة بخطوة') : t('Tout lire', 'Read all', 'قراءة الكل')} onPress={() => setAll(!all)} />
      </Row>
      {!all && <View accessibilityRole="progressbar" accessibilityLabel={positionLabel} accessibilityValue={{ min: 1, max: blocks.length, now: section + 1 }} style={{ height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.neutral, alignItems: rtl ? 'flex-end' : 'flex-start' }}>
        <View style={{ height: 4, borderRadius: 2, width: `${((section + 1) / blocks.length) * 100}%`, backgroundColor: colors.accent }} />
      </View>}
    </View>}
    {(all ? blocks : blocks.slice(section, section + 1)).map((block, i) => {
      const numberedTitle = block.title?.match(/^\s*([0-9\u0660-\u0669]+)\s*[·.\-–]\s*(.+)$/);
      const title = numberedTitle ? numberedTitle[2] : block.title;
      const paragraphs = block.text?.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean) || [];
      // Isolate Latin terms so surrounding Arabic punctuation keeps its reading order.
      const readingText = (text: string) => rtl
        ? text.replace(/[A-Za-z][A-Za-z0-9]*(?:[ -][A-Za-z][A-Za-z0-9]*)*/g, '\u2066$&\u2069')
        : text;
      return <Card key={all ? i : section} style={{ padding: 20, gap: 20, borderRadius: 18, shadowOpacity: 0, elevation: 0 }}>
        {!!title && <Row style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <View style={{ minWidth: 32, height: 32, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Label bold size={13} style={{ color: colors.accent, textAlign: 'center' }}>{numberedTitle ? numberedTitle[1] : format((all ? i : section) + 1)}</Label>
          </View>
          <Label bold size={18} accessibilityRole="header" style={{ flex: 1, lineHeight: rtl ? 30 : 26 }}>{readingText(title)}</Label>
        </Row>}
        <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center', gap: 20 }}>
          {paragraphs.map((paragraph, index) => <Label key={index} selectable size={15} style={{ lineHeight: rtl ? 29 : 26, textAlign: rtl ? 'right' : 'left' }}>{readingText(paragraph)}</Label>)}
        </View>
      </Card>;
    })}
    {!all && blocks.length > 1 && <>
      <View style={{ padding: 14, borderRadius: 12, backgroundColor: colors.soft }}>
        <Label size={13}>{t('Avant de continuer : reformule cette partie en une phrase. Si un mot te bloque, utilise le dictionnaire.', 'Before continuing: explain this section in one sentence. If a term blocks you, use the glossary.', 'قبل المتابعة: اشرح هذا الجزء في جملة. إذا أوقفك مصطلح، استخدم القاموس.')}</Label>
      </View>
      <Row style={{ alignItems: 'stretch', flexWrap: 'nowrap', gap: 8 }}>
        <Button quiet style={{ flex: 1 }} icon={rtl ? 'chevron-forward' : 'chevron-back'} disabled={section === 0} title={t('Précédente', 'Previous', 'السابق')} onPress={() => setSection((n) => Math.max(0, n - 1))} />
        <Button style={{ flex: 1 }} icon={rtl ? 'chevron-back' : 'chevron-forward'} disabled={section === blocks.length - 1} title={t('Suivante', 'Next', 'التالي')} onPress={() => setSection((n) => Math.min(blocks.length - 1, n + 1))} />
      </Row>
    </>}
    <Button quiet icon="book-outline" title={t('Comprendre un mot', 'Look up a term', 'افهم مصطلحًا')} onPress={() => router.push({ pathname: '/collection/[kind]', params: { kind: 'glossary' } })} />
  </View>;
}

export function PracticeCoach({ lesson }: { lesson: Lesson }) {
  const { state, update, t } = useSchool();
  const key = 'study:plan:' + lesson.id;
  return <Card style={{ padding: 16 }}>
    <Label bold>{t('Prépare ton essai', 'Plan your attempt', 'خطّط لمحاولتك')}</Label>
    <Label size={14}>{t('Écris le résultat attendu, les étapes à essayer et comment vérifier. Après l’essai, note le résultat réel et une correction. Change une seule chose à la fois.', 'Write the expected result, steps to try, and how you will check them. After trying, record the actual result and one correction. Change one thing at a time.', 'اكتب النتيجة المتوقعة والخطوات وكيف ستتحقّق. بعد المحاولة سجّل النتيجة الفعلية وتصحيحًا واحدًا. غيّر شيئًا واحدًا في كل مرة.')}</Label>
    <Field multiline value={state.drafts[key] || ''} onChangeText={(value) => update((p) => ({ ...p, drafts: { ...p.drafts, [key]: value } }))} placeholder={t('Attendu → étapes → test → résultat → correction', 'Expected → steps → test → result → correction', 'المتوقّع ← الخطوات ← الاختبار ← النتيجة ← التصحيح')} />
  </Card>;
}
