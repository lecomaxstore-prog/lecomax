import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Page, ProgressBar, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { dayKey } from '../utils/progress';
import { challenges, type Challenge, type Copy } from '../features/practice/challenges';
import { attemptKey, dailyIndex, noteKey, readAttempt, recordAttempt, type Attempt } from '../features/practice/progress';

export default function PracticeLab() {
  const { t, state, update, colors, rtl } = useSchool();
  const [language, setLanguage] = useState('All');
  const [onlyRetry, setOnlyRetry] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [lesson, setLesson] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);
  const copy = (value: Copy) => t(...value);
  const attempt = (id: string) => readAttempt(state.drafts[attemptKey(id)]);
  const answered = challenges.filter(c => attempt(c.id)).length;
  const retry = challenges.filter(c => { const a = attempt(c.id); return a && !a.correct; }).length;
  const independent = challenges.filter(c => attempt(c.id)?.firstCorrect).length;
  const active = challenges.find(c => c.id === activeId);
  const today = challenges[dailyIndex(dayKey(), challenges.length)]!;
  const open = (challenge: Challenge) => {
    const saved = attempt(challenge.id);
    setActiveId(challenge.id); setChoice(saved?.choice ?? null); setResult(saved ?? null); setHint(false); setLesson(false);
  };
  const startAgain = () => { setChoice(null); setResult(null); setHint(false); };
  const submit = () => {
    if (!active || choice === null || result) return;
    const next = recordAttempt(attempt(active.id), choice, active.answer, hint);
    update(p => ({ ...p, drafts: { ...p.drafts, [attemptKey(active.id)]: JSON.stringify(next) } }));
    setResult(next);
  };
  const direction = rtl ? 'row-reverse' : 'row';
  const filtered = challenges.filter(c => (language === 'All' || c.language === language) && (!onlyRetry || (attempt(c.id) && !attempt(c.id)!.correct)));
  return <Page key={activeId ?? 'library'} compactSpacing title={t('Labo de pratique', 'Practice Lab', 'مختبر التدريب')} header={<View style={{ gap: 5 }}>
    <Label muted bold size={11}>{t('LIRE · COMPRENDRE · ESSAYER', 'READ · REASON · TRY', 'اقرأ · افهم · جرّب')}</Label>
    <Label bold size={28} accessibilityRole="header">{t('Labo de pratique', 'Practice Lab', 'مختبر التدريب')}</Label>
    <Label muted size={14}>{t('Du code court. Des idées qui restent.', 'Small code. Lasting understanding.', 'كود قصير. وفهم يبقى معك.')}</Label>
  </View>}>
    <Button title={t('Ouvrir le studio interactif', 'Open Interactive Learning Studio', 'افتح استوديو التعلم التفاعلي')} onPress={() => router.push('/interactive-studio')} />
    {active ? <View style={{ gap: 18 }}>
      <Button quiet icon={rtl ? 'arrow-forward-outline' : 'arrow-back-outline'} title={t('Tous les défis', 'All challenges', 'كل التحديات')} onPress={() => setActiveId(null)} />
      <View style={{ gap: 8 }}>
        <Row><Label bold size={12} style={{ color: colors.accent }}>{active.language}</Label><Label muted size={12}>/ {copy(active.concept)}</Label></Row>
        <Label bold size={23} accessibilityRole="header">{copy(active.title)}</Label>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: lesson }} onPress={() => setLesson(!lesson)} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Label size={13} bold style={{ color: colors.accent }}>{lesson ? t('Masquer la mini-leçon', 'Hide mini-lesson', 'إخفاء الدرس القصير') : t('Lire la mini-leçon', 'Read mini-lesson', 'اقرأ الدرس القصير')}</Label>
        </Pressable>
        {lesson && <Label size={14}>{copy(active.lesson)}</Label>}
      </View>
      <View style={{ backgroundColor: colors.code, borderRadius: 18, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.codeLine }}><Label size={11} style={{ color: colors.codeMuted, writingDirection: 'ltr', textAlign: 'left' }}>{active.language} / {t('lecture de code', 'code reading', 'قراءة الكود')}</Label></View>
        <ScrollView horizontal contentContainerStyle={{ padding: 18 }}>
          <Label selectable size={14} style={{ color: colors.codeText, fontFamily: 'monospace', writingDirection: 'ltr', textAlign: 'left', lineHeight: 24 }}>{active.code}</Label>
        </ScrollView>
      </View>
      <Card style={{ padding: 18, borderRadius: 18, shadowOpacity: 0, elevation: 0 }}>
        <Label bold size={17}>{copy(active.question)}</Label>
        <View accessibilityRole="radiogroup" style={{ gap: 9 }}>{active.options.map((option, index) => <Pressable key={option} accessibilityRole="radio" accessibilityLabel={option} accessibilityState={{ checked: choice === index, disabled: !!result }} disabled={!!result} onPress={() => setChoice(index)} style={({ pressed }) => ({ minHeight: 51, padding: 12, flexDirection: direction, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: choice === index ? colors.accent : colors.line, backgroundColor: choice === index ? colors.soft : colors.card, borderRadius: 12, opacity: pressed ? 0.7 : 1 })}>
          <Ionicons name={choice === index ? 'radio-button-on-outline' : 'radio-button-off-outline'} size={20} color={colors.accent} />
          <Label size={15} style={{ flex: 1, writingDirection: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>{option}</Label>
        </Pressable>)}</View>
        {!result && <>
          <Button quiet icon="bulb-outline" title={t('Un indice', 'Show a hint', 'أظهر تلميحًا')} onPress={() => setHint(true)} />
          {hint && <Label size={14}>{copy(active.hint)}</Label>}
          <Button title={t('Vérifier ma réponse', 'Check my answer', 'تحقّق من إجابتي')} disabled={choice === null} onPress={submit} />
        </>}
        {result && <View style={{ gap: 12 }}>
          <Label bold accessibilityLiveRegion="polite" style={{ color: result.correct ? colors.accent : colors.danger }}>{result.correct ? t('Bien raisonné', 'You got it', 'أحسنت') : t('Regardons ensemble', 'Let’s work through it', 'لنفهمها معًا')}</Label>
          <Label bold size={14}>{t('Réponse :', 'Answer:', 'الإجابة:')} {active.options[active.answer]}</Label>
          <Label size={14}>{copy(active.explanation)}</Label>
          <View style={{ padding: 14, borderRadius: 12, backgroundColor: colors.soft, gap: 5 }}>
            <Label bold size={13}>{t('À toi de modifier', 'Make one change', 'جرّب تغييرًا واحدًا')}</Label>
            <Label size={14}>{copy(active.task)}</Label>
          </View>
          <Label muted size={11}>{t('Les essais suivants servent à réviser. Le premier essai reste enregistré.', 'Repeat attempts are for review. Your first attempt stays recorded.', 'المحاولات التالية للمراجعة. تبقى محاولتك الأولى محفوظة.')}</Label>
          <Row><Button quiet title={t('Réessayer', 'Try again', 'حاول مجددًا')} onPress={startAgain} /><Button title={t('Défi suivant', 'Next challenge', 'التحدي التالي')} onPress={() => open(challenges[(challenges.indexOf(active) + 1) % challenges.length]!)} /></Row>
          {active.language === 'Python' && <Button quiet icon="code-slash-outline" title={t('Essayer en Python', 'Try in Python', 'جرّب في بايثون')} onPress={() => router.push({ pathname: '/terminal', params: { runtime: 'python' } })} />}
        </View>}
      </Card>
      <View style={{ gap: 7 }}>
        <Label bold size={15}>{t('Mon raisonnement', 'My reasoning', 'كيف فكّرت في الحل')}</Label>
        <Label muted size={12}>{t('Explique pourquoi. Tes notes sont conservées sur cet appareil.', 'Explain why. Your notes are saved on this device.', 'اشرح السبب. تُحفظ ملاحظاتك على هذا الجهاز.')}</Label>
        <Field value={state.drafts[noteKey(active.id)] ?? ''} onChangeText={value => update(p => ({ ...p, drafts: { ...p.drafts, [noteKey(active.id)]: value } }))} placeholder={t('Je pense que… parce que…', 'I think… because…', 'أعتقد أن… لأن…')} multiline maxLength={2000} />
        <Label muted size={11}>{t('Exercice de raisonnement : le code affiché n’est pas exécuté ici.', 'Reasoning exercise: the displayed code is not executed here.', 'تمرين للفهم: الكود المعروض لا يُنفّذ هنا.')}</Label>
      </View>
    </View> : <View style={{ gap: 22 }}>
      <View style={{ padding: 22, borderRadius: 22, backgroundColor: colors.hero, gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}><Label bold size={11} style={{ color: colors.heroGold }}>{t('LE DÉFI DU JOUR', 'TODAY’S CHALLENGE', 'تحدّي اليوم')}</Label><Ionicons name="code-working-outline" size={25} color={colors.heroGold} /></Row>
        <Label bold size={23} style={{ color: colors.onPrimary }}>{copy(today.title)}</Label>
        <Label size={13} style={{ color: colors.heroText }}>{today.language} · {copy(today.concept)}</Label>
        <Button title={attempt(today.id) ? t('Revoir le défi', 'Revisit challenge', 'راجع التحدّي') : t('Relever le défi', 'Take the challenge', 'ابدأ التحدّي')} onPress={() => open(today)} style={{ backgroundColor: colors.heroAccent, borderColor: colors.heroLine }} />
      </View>
      <View style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}><Label bold size={16}>{t('Ta pratique', 'Your practice', 'تدريبك')}</Label><Label muted size={12} style={{ writingDirection: 'ltr' }}>{answered} / {challenges.length}</Label></Row>
        <ProgressBar value={answered / challenges.length} />
        <Label muted size={12}>{t(`${independent} réussis au premier essai sans indice · ${retry} à revoir`, `${independent} correct first tries without hints · ${retry} to revisit`, `${independent} إجابات أولى صحيحة دون تلميح · ${retry} للمراجعة`)}</Label>
      </View>
      <View style={{ gap: 12 }}>
        <Label bold size={19} accessibilityRole="header">{t('Choisis ton terrain', 'Choose your practice', 'اختر تدريبك')}</Label>
        <Row style={{ gap: 7 }}>{['All', 'JavaScript', 'Python', 'SQL'].map(value => <Button key={value} quiet selected={language === value} title={value === 'All' ? t('Tout', 'All', 'الكل') : value} onPress={() => setLanguage(value)} style={{ paddingHorizontal: 11, minHeight: 44, borderRadius: 12 }} />)}</Row>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: onlyRetry }} onPress={() => setOnlyRetry(!onlyRetry)} style={{ minHeight: 44, flexDirection: direction, gap: 8, alignItems: 'center' }}>
          <Ionicons name={onlyRetry ? 'checkbox-outline' : 'square-outline'} size={21} color={colors.accent} /><Label size={13}>{t('Seulement les défis à revoir', 'Only challenges to revisit', 'التحديات التي تحتاج مراجعة فقط')}</Label>
        </Pressable>
        <View style={{ backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
          {filtered.map((challenge, index) => {
            const saved = attempt(challenge.id);
            return <Pressable key={challenge.id} accessibilityRole="button" accessibilityLabel={copy(challenge.title)} onPress={() => open(challenge)} style={({ pressed }) => ({ padding: 16, minHeight: 86, flexDirection: direction, gap: 12, alignItems: 'center', borderTopWidth: index ? 1 : 0, borderColor: colors.line, backgroundColor: pressed ? colors.soft : colors.card })}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={saved ? (saved.correct ? 'checkmark-outline' : 'refresh-outline') : 'code-slash-outline'} size={20} color={colors.accent} /></View>
              <View style={{ flex: 1, gap: 3 }}><Label bold size={15}>{copy(challenge.title)}</Label><Label muted size={11}>{challenge.language} · {saved ? saved.correct ? t('Réponse vérifiée', 'Answer checked', 'إجابة تم التحقّق منها') : t('À revoir', 'Revisit', 'للمراجعة') : t('À découvrir', 'Not started', 'لم تبدأ بعد')}</Label></View>
              <Ionicons name={rtl ? 'chevron-back-outline' : 'chevron-forward-outline'} size={17} color={colors.muted} />
            </Pressable>;
          })}
          {filtered.length === 0 && <View style={{ padding: 20, gap: 8 }}><Label bold>{t('Aucun défi dans ce filtre', 'No challenges in this filter', 'لا توجد تحديات بهذا التصنيف')}</Label><Label muted size={13}>{t('Choisis une autre langue ou affiche tous les défis.', 'Choose another language or show all challenges.', 'اختر لغة أخرى أو اعرض جميع التحديات.')}</Label></View>}
        </View>
      </View>
      <Label muted size={12}>{t('Les réponses et notes sont sauvegardées sur cet appareil. La pratique complète tes cours, sans les marquer terminés.', 'Answers and notes are saved on this device. Practice complements your courses without marking lessons complete.', 'تُحفظ الإجابات والملاحظات على هذا الجهاز. التدريب يدعم دروسك ولا يضع عليها علامة الاكتمال.')}</Label>
    </View>}
  </Page>;
}
