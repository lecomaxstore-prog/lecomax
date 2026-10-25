import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Card, Button, Field, Label, Page, ProgressBar, Row } from '../components/UI';
import { CodeViewer } from '../components/CodeViewer';
import { useSchool } from '../store/School';
import { dayKey } from '../utils/progress';
import { valuesMission as mission } from '../data/missions/values';
import { missionKey, readMission, missionStatus, submitActivity, type MissionAttempt } from '../services/assessment';
import type { AssessmentQuestion, Response } from '../types/assessment';

function Question({ question: q, response, onChange, submitted, correct, enabled }: {
  question: AssessmentQuestion; response?: Response; onChange: (r: Response) => void;
  submitted: boolean; correct?: boolean; enabled: boolean;
}) {
  const { t } = useSchool();
  const [hint, setHint] = useState(false);
  const selections = Array.isArray(response) ? response : [];
  return <Card>
    <Label bold size={18}>{t(...q.prompt)}</Label>
    {q.critical && <Label muted>{t('Exigence critique : réponse correcte obligatoire.', 'Critical requirement: must pass.', 'شرط أساسي: خاص الإجابة تكون صحيحة.')}</Label>}
    {q.code && <CodeViewer code={q.code} filename="prediction.js" />}
    {'options' in q ? q.options.map((option, i) => <Button key={i} quiet disabled={!enabled} selected={selections.includes(i)}
      title={`${q.kind === 'order' && selections.includes(i) ? `${selections.indexOf(i) + 1}. ` : ''}${t(...option)}`}
      onPress={() => onChange(q.kind === 'single' ? [i] : selections.includes(i) ? selections.filter(n => n !== i) : [...selections, i])} />)
      : <Field editable={enabled} code value={typeof response === 'string' ? response : ''}
        placeholder={t('Votre réponse', 'Your answer', 'الجواب ديالك')} onChangeText={value => onChange(value.slice(0, 2000))} />}
    <Button quiet title={hint ? t('Masquer l’indice', 'Hide hint', 'خبي التلميح') : t('Un indice', 'Hint', 'تلميح')} onPress={() => setHint(v => !v)} />
    {hint && <Label>{t(...q.hint)}</Label>}
    {submitted && <Label accessibilityLiveRegion="polite">{correct ? t('Correct. ', 'Correct. ', 'صحيح. ') : t('À retravailler. ', 'Needs practice. ', 'خاص تدريب. ')}{t(...q.explanation)}</Label>}
  </Card>;
}

export function MissionShortcut() {
  const { state, t } = useSchool();
  let description = t('Six activités corrigées, disponibles hors ligne. Objectif initial : 45 min.', 'Six graded activities available offline. Initial study budget: 45 min.', 'ست أنشطة بالتصحيح خدامين بلا نت. وقت الدراسة الأولي 45 دقيقة.');
  try {
    const raw = state.drafts[missionKey(mission)];
    if (raw) {
      const saved = readMission(mission, raw, dayKey());
      const status = missionStatus(mission, saved);
      description = t(`${status.done}/6 activités validées · commencé le ${saved.startedOn}`, `${status.done}/6 activities passed · started ${saved.startedOn}`, `${status.done}/6 أنشطة صحيحة · البداية ${saved.startedOn}`);
    }
  } catch { description = t('La sauvegarde de mission nécessite une vérification.', 'Your saved mission needs checking.', 'المهمة المحفوظة خاصها مراجعة.'); }
  return <Card><Label bold size={20}>{t('Votre mission de programmation', 'Your coding study mission', 'مهمة دراسة البرمجة ديالك')}</Label><Label>{description}</Label>
    <Button icon="play-circle-outline" title={t('Ouvrir ma mission', 'Open my mission', 'حل المهمة ديالي')} onPress={() => router.push('/mission')} />
  </Card>;
}

export function DailyMission() {
  const { state, update, ready, error, retry, t, colors } = useSchool();
  const [showScope, setShowScope] = useState(false);
  const key = missionKey(mission);
  const raw = state.drafts[key];
  let saved: MissionAttempt | undefined;
  try { saved = readMission(mission, raw, dayKey()); } catch { /* Preserve invalid content for recovery; never overwrite it. */ }
  useEffect(() => {
    if (ready && raw === undefined) update(p => p.drafts[key] === undefined ? { ...p, drafts: { ...p.drafts, [key]: JSON.stringify(readMission(mission, undefined, dayKey())) } } : p);
  }, [key, raw, ready, update]);
  if (!ready) return <Page title={t('Chargement de la mission', 'Loading mission', 'تحميل المهمة')}><Label>{error || t('Lecture de votre progression…', 'Reading your progress…', 'كنقراو التقدم ديالك…')}</Label>{!!error && <Button title={t('Réessayer', 'Retry', 'عاود')} onPress={retry} />}</Page>;
  if (!saved) return <Page title={t('Sauvegarde à vérifier', 'Saved mission needs checking', 'المهمة المحفوظة خاصها مراجعة')}>
    <Card><Label>{t('Les données sont conservées. Exportez votre sauvegarde depuis les réglages avant toute réparation. Aucune progression n’a été effacée.', 'Your data has been preserved. Export your backup in settings before repairing it. No progress has been erased.', 'البيانات باقية. صدر backup من الإعدادات قبل الإصلاح. ما تمسح حتى تقدم.')}</Label><Button title={t('Ouvrir les réglages', 'Open settings', 'حل الإعدادات')} onPress={() => router.push('/settings')} /></Card>
  </Page>;
  const patch = (fn: (s: MissionAttempt) => MissionAttempt) => update(p => ({ ...p, drafts: { ...p.drafts, [key]: JSON.stringify(fn(readMission(mission, p.drafts[key], dayKey()))) } }));
  const status = missionStatus(mission, saved);
  const active = saved.active;
  const activity = mission.activities[active]!; // readMission checks the saved index against this mission.
  const result = status.activities[active];
  const unlocked = status.activities.slice(0, active).every(a => a?.passed);
  const next = status.activities.findIndex(a => !a?.passed);
  const changeAnswer = (id: string, response: Response) => patch(s => {
    const submissions = { ...s.submissions };
    delete submissions[activity.id];
    return { ...s, responses: { ...s.responses, [id]: response }, submissions };
  });
  return <Page title={t(...mission.title)} compactSpacing header={
    <Row style={{ justifyContent: 'space-between', gap: 8 }}>
      <Label bold size={13} style={{ color: colors.accent }}>{t('ATELIER JAVASCRIPT', 'JAVASCRIPT WORKSHOP', 'ورشة جافاسكريبت')}</Label>
      <Label muted size={12}>{t('6 activités guidées', '6 guided activities', '٦ أنشطة متدرّجة')}</Label>
    </Row>
  }>
    <Card style={{ padding: 22, gap: 16, borderRadius: 24, backgroundColor: colors.hero, borderColor: colors.hero, shadowOpacity: 0, elevation: 0 }}>
      <Label accessibilityRole="header" bold size={27} style={{ color: colors.onPrimary, lineHeight: 40 }}>{t('Comprendre le panier', 'Understand the shopping cart', 'افهم سلة التسوّق')}</Label>
      <Label bold size={12} style={{ color: colors.heroText }}>{t('Votre objectif', 'Your goal', 'هدفك في هذه المهمة')}</Label>
      <Label size={15} style={{ color: colors.heroText }}>{t('Comprendre les valeurs et vérifier les calculs d’un panier, en six activités progressives.', 'Understand values and check shopping-cart calculations through six guided activities.', 'افهم القيم البرمجية وتحقّق من حسابات سلة التسوّق عبر ستة أنشطة متدرجة.')}</Label>
      <Card style={{ padding: 16, gap: 10, borderRadius: 16, shadowOpacity: 0, elevation: 0 }}>
      <Row style={{ justifyContent: 'space-between', gap: 8 }}>
        <Label bold size={13}>{t('Votre progression', 'Your progress', 'تقدّمك')}</Label>
        <Label bold size={13} style={{ color: colors.accent, writingDirection: 'ltr' }} accessibilityLiveRegion="polite">{status.done} / {mission.activities.length} · {status.percent}%</Label>
      </Row>
      <ProgressBar value={status.done / mission.activities.length} />
      <Label muted size={12}>{t('Activités validées. Vos réponses restent disponibles pour la prochaine séance.', 'Activities passed. Your answers stay available for your next session.', 'أنشطة اجتزتها بنجاح. تبقى إجاباتك محفوظة لتكمل في الجلسة القادمة.')}</Label>
      </Card>
      <Label size={12} style={{ color: colors.heroText }}>{t('Début : ', 'Started: ', 'بدأت في: ') + new Date(saved.startedOn + 'T12:00:00').toLocaleDateString(state.language, { day: 'numeric', month: 'long', year: 'numeric' })}</Label>

    </Card>
    <Card style={{ padding: 20, gap: 14, borderRadius: 20, shadowOpacity: 0, elevation: 0 }}>
      <Label bold size={17}>{t('Une séance à votre rythme', 'Set your study pace', 'جلسة على إيقاعك')}</Label>
      <Label muted size={13}>{t('Choisissez un repère de durée. Vous pouvez faire une pause à tout moment.', 'Choose a time budget. You can pause whenever you need.', 'اختر مدة تناسبك. يمكنك أخذ استراحة في أي وقت.')}</Label>
      <Row style={{ flexWrap: 'nowrap', gap: 8 }}>{([20,45,60] as const).map(goal => <Button key={goal} quiet selected={saved.goal === goal} style={{ flex: 1, minHeight: 52, paddingHorizontal: 6, borderRadius: 12 }} title={state.language === 'ar' ? goal.toLocaleString('ar') + ' دقيقة' : goal + ' min'} onPress={() => patch(s => ({ ...s, goal }))} />)}</Row>
      <Label muted size={12}>{t('Durée indicative, sans compte à rebours.', 'A planning guide, not a countdown timer.', 'مدة للتخطيط، وليست مؤقّتًا للعدّ التنازلي.')}</Label>
      <Button icon="book-outline" title={t('Lire la leçon complète', 'Read the full lesson', 'قراءة الدرس الكامل')} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: mission.lessonId, course: mission.courseId } })} />
      <Button variant="ghost" icon="pause-outline" title={t('Pause · revenir à l’accueil', 'Pause · return home', 'استراحة والعودة للرئيسية')} onPress={() => router.navigate('/(tabs)')} />
      {!!error && <><Label accessibilityRole="alert">{error}</Label><Button title={t('Réessayer la sauvegarde', 'Retry saving', 'إعادة محاولة الحفظ')} onPress={retry} /></>}
    </Card>
    <Card style={{ padding: 16, gap: 6, borderRadius: 18, shadowOpacity: 0, elevation: 0 }}>
      <Button variant="ghost" icon="information-circle-outline" title={showScope ? t('Masquer les détails', 'Hide mission details', 'إخفاء تفاصيل المهمة') : t('Que valide cette mission ?', 'What does this mission assess?', 'ماذا تقيّم هذه المهمة؟')} onPress={() => setShowScope(value => !value)} />
      {showScope && <Label size={13} muted>{t('Cette mission évalue votre raisonnement sur les valeurs. Pour démontrer une fonction écrite seul, réalisez aussi le projet pratique. La durée choisie ne change pas les critères de réussite.', 'This mission assesses reasoning about values. Complete the practical project to demonstrate an independently written function. Your chosen session length does not change passing criteria.', 'تقيّم المهمة فهمك للقيم وطريقة تفكيرك. لإثبات قدرتك على كتابة دالة بنفسك، أنجز المشروع العملي أيضًا. مدة الجلسة لا تغيّر شروط النجاح.')}</Label>}
    </Card>
    <Card style={{ padding: 16, gap: 8, borderRadius: 20, shadowOpacity: 0, elevation: 0 }}>
      <Label bold size={17}>{t('Votre parcours', 'Your activity path', 'مسار الأنشطة')}</Label>
      <Label muted size={12}>{t('Avancez étape par étape. Chaque activité prépare la suivante.', 'Take one step at a time. Each activity builds on the last.', 'تقدّم خطوة بخطوة. كل نشاط يهيّئك للنشاط التالي.')}</Label>
      {mission.activities.map((a, i) => <Button key={a.id} quiet selected={i === active}
      title={`${status.activities[i]?.passed ? '✓ ' : ''}${t(...a.title)}`}
      onPress={() => patch(s => ({ ...s, active: i }))} />)}</Card>
    <Label bold size={21}>{t(...activity.title)}</Label>
    <Label muted>{t(`Seuil : ${activity.threshold} %. Toutes les exigences critiques doivent réussir.`, `Threshold: ${activity.threshold}%. Every critical requirement must pass.`, `العتبة ${activity.threshold}%. جميع الشروط الأساسية خاصها تصح.`)}</Label>
    {!unlocked ? <Card><Label>{t('Validez les activités précédentes avant de soumettre celle-ci. Vous pouvez quitter librement ou revenir au cours.', 'Pass the earlier activities before submitting this one. You can leave freely or return to the course.', 'صحح الأنشطة السابقة قبل تسليم هادي. تقدر تخرج بحرية ولا ترجع للدورة.')}</Label><Button title={t('Reprendre l’activité en attente', 'Resume pending activity', 'رجع للنشاط اللي باقي')} onPress={() => patch(s => ({ ...s, active: Math.max(0, next) }))} /></Card>
      : <>
        {activity.questions.map(q => <Question key={q.id} question={q} response={saved.responses[q.id]} onChange={r => changeAnswer(q.id, r)} submitted={!!result} correct={result?.results.find(r => r.id === q.id)?.correct} enabled />)}
        <Button title={t('Vérifier mes réponses', 'Check my answers', 'تحقق من الأجوبة')} onPress={() => patch(s => submitActivity(mission, s, active))} />
        {result && <Card>
          <Label bold accessibilityLiveRegion="polite">{`${result.correct}/${result.total} · ${Math.round(result.score)}% · ${result.passed ? t('Validé', 'Passed', 'صحيح') : t('À retravailler', 'Needs practice', 'خاص تدريب')}`}</Label>
          <Label>{result.passed ? t('Vos réponses soumises respectent les critères de cette activité.', 'Your submitted answers meet this activity’s criteria.', 'الأجوبة المسلمة مطابقة لشروط هاد النشاط.') : t('Relisez les explications des réponses incorrectes, utilisez les indices et soumettez une nouvelle tentative. Toutes les réponses restent enregistrées.', 'Review explanations for incorrect answers, use hints and submit another attempt. Your answers remain saved.', 'راجع شرح الأجوبة الخاسرة واستعمل التلميحات وعاود المحاولة. الأجوبة كتبقى محفوظة.')}</Label>
          {result.passed && next >= 0 && <Button title={t('Activité suivante en attente', 'Next pending activity', 'النشاط التالي اللي باقي')} onPress={() => patch(s => ({ ...s, active: next }))} />}
        </Card>}
      </>}
    {status.complete && <Card><Label bold>{t('Mission de raisonnement validée', 'Reasoning mission passed', 'مهمة التفكير دازت')}</Label><Label>{t('Vous avez validé les six activités. Pour démontrer le code autonome, construisez maintenant le panier de l’atelier et exécutez les tests locaux. Aucun projet n’est automatiquement déclaré réussi.', 'You passed all six activities. To demonstrate independent coding, build the workshop cart and run its local checks. No project is automatically marked passed.', 'دازو الأنشطة الستة. باش تبرهن الكود المستقل بني panier ديال الورشة وشغل الاختبارات المحلية. حتى مشروع ما كيتحسبش ناجح آليا.')}</Label><Button title={t('Ouvrir le projet du cours', 'Open the course project', 'حل مشروع الدورة')} onPress={() => router.push({ pathname: '/course/[id]', params: { id: mission.courseId } })} /></Card>}
    <Card>
      <Label bold>{t('Coder sur votre ordinateur', 'Code on your computer', 'كتب الكود فالحاسوب ديالك')}</Label>
      <Label>{t('Dans votre copie du dépôt, ouvrez academy-labs/06-javascript/CART-PRACTICE.md puis implémentez cart-practice.cjs. Le starter échoue volontairement. Les 11 contrôles doivent passer : entrées, calcul, arrondi, précision et résultats indépendants.', 'In your repository copy, open academy-labs/06-javascript/CART-PRACTICE.md and implement cart-practice.cjs. The starter intentionally fails. All 11 checks must pass: inputs, arithmetic, rounding, precision and independent results.', 'فالنسخة ديال المشروع حل academy-labs/06-javascript/CART-PRACTICE.md وكتب cart-practice.cjs. البداية كتفشل عمدا. خاص 11 اختبار يدوزو: المدخلات والحساب والتقريب والدقة ونتائج مستقلة.')}</Label>
      <CodeViewer filename="Terminal" code="node academy-labs/06-javascript/verify-cart.cjs" />
      <Label muted>{t('À lancer dans le terminal de votre ordinateur, à la racine du dépôt. Votre propre code s’exécute localement, pas dans l’application. Les résultats ne sont pas importés comme une maîtrise validée.', 'Run in your computer terminal from the repository root. Your own code runs locally, not inside this app. Results are not imported as verified mastery.', 'شغلو فterminal الحاسوب من racine ديال المشروع. الكود ديالك كيخدم محليا وماشي داخل التطبيق. النتائج ما كتتسجلش كإتقان متحقق آليا.')}</Label>
    </Card>
  </Page>;
}
