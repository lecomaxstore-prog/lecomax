import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Field, Label, Page, ProgressBar, Row } from '../components/UI';
import { useSchool } from '../store/School';

export default function Speaking() {
  const { t, colors, rtl } = useSchool();
  const [practicing, setPracticing] = useState(false);
  const [openTip, setOpenTip] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState(0);
  const [keywords, setKeywords] = useState('');
  const [finished, setFinished] = useState(false);
  const topics = [
    t('Une chose apprise aujourd’hui', 'Something I learned today', 'شيء تعلّمته اليوم'),
    t('Une idée que je propose', 'An idea I would suggest', 'فكرة أريد اقتراحها'),
    t('Expliquer un problème simplement', 'Explain a problem simply', 'شرح مشكلة بطريقة بسيطة'),
  ];
  const lessons = [
    [t('1 · Choisis ton message', '1 · Choose your message', '١ · حدّد رسالتك'), t('Avant de parler, demande-toi : « Quelle idée doit rester ? » Choisis une seule phrase et trois mots-clés. Tu peux faire une pause avant de répondre.', 'Before speaking, ask: “What one idea should the listener remember?” Choose one sentence and three keywords. You can pause before answering.', 'قبل أن تتكلم، اسأل نفسك: «ما الفكرة الواحدة التي أريد أن يتذكرها المستمع؟» اختر جملة وثلاث كلمات مفتاحية. يمكنك التوقف قليلًا قبل الإجابة.')],
    [t('2 · Une idée, une raison, un exemple', '2 · One point, one reason, one example', '٢ · فكرة، سبب، مثال'), t('Dis ton idée, explique pourquoi, puis donne un exemple concret. Termine en rappelant ton idée. Exemple : « Je propose une pause, car je me déconcentre. Après dix minutes, je reprendrai cet exercice. »', 'Say your point, explain why, then give a concrete example. Finish by returning to your point. Example: “I suggest a break because I am losing focus. After ten minutes, I will return to this exercise.”', 'قل فكرتك، ثم اشرح السبب وأعطِ مثالًا واضحًا. اختم بالعودة إلى فكرتك. مثال: «أقترح استراحة لأن تركيزي بدأ يقل. بعد عشر دقائق سأعود إلى هذا التمرين».')],
    [t('3 · Réfléchis entre les phrases', '3 · Think between sentences', '٣ · فكّر بين الجمل'), t('Termine une phrase courte, fais une pause, puis choisis la suivante. Écoute la question jusqu’au bout. Si elle est vague, demande : « Tu veux un exemple ou mon avis ? »', 'Finish a short sentence, pause, then choose the next one. Listen to the whole question. If it is unclear, ask: “Would you like an example or my opinion?”', 'أكمل جملة قصيرة، توقف قليلًا، ثم اختر الجملة التالية. استمع إلى السؤال كاملًا. إن لم يكن واضحًا، اسأل: «هل تريد مثالًا أم رأيي؟»')],
    [t('4 · Retrouve le fil', '4 · Find your thread again', '٤ · استعد تسلسل أفكارك'), t('Si un mot ne vient pas, décris ce que tu veux dire avec des mots simples. Essaie : « L’idée principale est… », « Je reformule… » ou « Laisse-moi un instant pour y réfléchir. » Tu n’as pas besoin de remplir chaque silence.', 'If a word does not come, describe what you mean using simpler words. Try: “The main idea is…”, “Let me rephrase…” or “Give me a moment to think.” You do not need to fill every silence.', 'إذا لم تجد كلمة، اشرح معناها بكلمات أبسط. جرّب: «الفكرة الأساسية هي…» أو «دعني أعبّر عنها بطريقة أخرى…» أو «أعطني لحظة لأفكر». ليس عليك ملء كل لحظة صمت.')],
  ];
  const steps = [
    [t('Prépare', 'Prepare', 'حضّر'), t('Choisis un sujet ci-dessous. Note trois mots-clés, pas un texte à mémoriser. Imagine que tu parles à une personne.', 'Choose a topic below. Write three keywords, rather than a script to memorize. Imagine speaking to one person.', 'اختر موضوعًا أدناه. اكتب ثلاث كلمات مفتاحية بدل نص تحفظه. تخيّل أنك تتحدث إلى شخص واحد.')],
    [t('Dis ton idée', 'Say your point', 'قل فكرتك'), t('À voix haute, complète : « Ce que je veux dire, c’est… » Une phrase suffit. Prends ton temps.', 'Out loud, complete: “What I want to say is…” One sentence is enough. Take your time.', 'بصوت مسموع، أكمل: «ما أريد قوله هو…». جملة واحدة تكفي. خذ وقتك.')],
    [t('Explique et illustre', 'Explain and illustrate', 'اشرح وأعطِ مثالًا'), t('Ajoute : « Parce que… » puis « Par exemple… ». Fais une pause entre les deux. Reviens à tes mots-clés si tu perds le fil.', 'Add: “Because…” then “For example…”. Pause between them. Return to your keywords if you lose your thread.', 'أضف: «لأن…» ثم «مثلًا…». توقف قليلًا بينهما. عد إلى كلماتك المفتاحية إذا فقدت تسلسل أفكارك.')],
    [t('Reformule et termine', 'Rephrase and finish', 'أعد الصياغة واختم'), t('Entraîne-toi à dire : « Je reformule… ». Exprime la même idée plus simplement, puis termine : « Donc, mon idée est… ».', 'Practice saying: “Let me rephrase…”. Express the same idea more simply, then finish: “So my point is…”.', 'تدرّب على قول: «دعني أعيد الصياغة…». عبّر عن الفكرة نفسها ببساطة أكثر، ثم اختم: «إذن، فكرتي هي…».')],
  ];
  const activeStep = steps[step] ?? steps[0]!;
  const direction = rtl ? 'row-reverse' : 'row';
  return <Page compactSpacing title={t('Parler avec clarté', 'Speak with clarity', 'تكلّم بوضوح')} header={
    <View style={{ gap: 5 }}>
      <Label muted size={11} bold>{t('EXPRESSION & CONFIANCE', 'EXPRESSION & CONFIDENCE', 'التعبير والثقة')}</Label>
      <Label bold size={28} accessibilityRole="header" style={{ lineHeight: 40 }}>{t('Parler avec clarté', 'Speak with clarity', 'تكلّم بوضوح')}</Label>
      <Label muted size={14}>{t('Une idée à la fois. À ton rythme.', 'One thought at a time. At your own pace.', 'فكرة واحدة كل مرة. وعلى مهلك.')}</Label>
    </View>
  }>
    {!practicing ? <View style={{ gap: 24 }}>
      <View style={{ backgroundColor: colors.hero, borderRadius: 24, padding: 24, gap: 18, overflow: 'hidden' }}>
        <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ borderWidth: 1, borderColor: colors.heroLine, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Label size={11} bold style={{ color: colors.heroGold }}>{t('PETITE PRATIQUE', 'A LITTLE PRACTICE', 'تدريب بسيط')}</Label>
          </View>
          <View accessible={false} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 34 }}>
            {[10, 20, 32, 18, 26, 12, 22].map((height, i) => <View key={i} style={{ height, width: 4, borderRadius: 4, backgroundColor: colors.heroGold, opacity: i === 2 ? 1 : 0.6 }} />)}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Label bold size={25} style={{ color: colors.onPrimary, lineHeight: 37 }}>{t('Tes idées méritent\nd’être entendues.', 'Your ideas deserve\nto be heard.', 'أفكارك تستحق\nأن تُسمع.')}</Label>
          <Label size={14} style={{ color: colors.heroText, lineHeight: 24 }}>{t('Choisis un sujet. Trouve trois mots.\nPuis lance-toi, phrase après phrase.', 'Pick a topic. Find three words.\nThen take it one sentence at a time.', 'اختر موضوعًا وثلاث كلمات.\nثم عبّر عنه، جملة بعد جملة.')}</Label>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Commencer à pratiquer', 'Start practicing', 'ابدأ التدريب')} onPress={() => setPracticing(true)} style={({ pressed }) => ({ backgroundColor: colors.heroGold, borderRadius: 13, minHeight: 50, padding: 12, flexDirection: direction, justifyContent: 'center', alignItems: 'center', gap: 10, opacity: pressed ? 0.8 : 1 })}>
          <Label bold size={15} style={{ color: colors.hero }}>{t('Commencer à pratiquer', 'Start practicing', 'ابدأ التدريب')}</Label>
          <Ionicons name={rtl ? 'arrow-back-outline' : 'arrow-forward-outline'} size={18} color={colors.hero} />
        </Pressable>
        <Label size={11} style={{ color: colors.heroText, textAlign: 'center' }}>{t('4 étapes · Sans enregistrement · À ton rythme', '4 steps · No recording · Your own pace', '٤ خطوات · دون تسجيل · على مهلك')}</Label>
      </View>
      <View style={{ gap: 10 }}>
        <Label bold size={17} accessibilityRole="header">{t('Quand les mots ne viennent pas', 'When the words won’t come', 'عندما لا تجد الكلمات')}</Label>
        <View style={{ borderLeftWidth: rtl ? 0 : 3, borderRightWidth: rtl ? 3 : 0, borderColor: colors.accent, paddingHorizontal: 16, paddingVertical: 5, gap: 4 }}>
          <Label size={18} bold>{t('« Laisse-moi un instant. »', '“Give me a moment.”', '«أعطني لحظة لأفكّر»')}</Label>
          <Label muted size={13}>{t('Une pause fait aussi partie de la conversation.', 'A pause is part of a conversation, too.', 'الوقفة جزء من الحوار أيضًا.')}</Label>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Label bold size={17} accessibilityRole="header">{t('Ta boîte à outils', 'Your speaking toolkit', 'أدوات تساعدك')}</Label>
        <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.card }}>
          {lessons.map(([title, body], i) => <View key={i} style={{ borderTopWidth: i ? 1 : 0, borderColor: colors.line }}>
            <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: openTip === i }} onPress={() => setOpenTip(openTip === i ? null : i)} style={({ pressed }) => ({ padding: 16, minHeight: 62, flexDirection: direction, gap: 12, alignItems: 'center', backgroundColor: pressed ? colors.soft : 'transparent' })}>
              <Ionicons name={(['bulb-outline', 'layers-outline', 'pause-outline', 'refresh-outline'] as const)[i]} size={20} color={colors.accent} />
              <Label size={14} bold style={{ flex: 1 }}>{title?.split(' · ')[1] ?? title}</Label>
              <Ionicons name={openTip === i ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={colors.muted} />
            </Pressable>
            {openTip === i && <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}><Label size={14} style={{ lineHeight: 25 }}>{body}</Label></View>}
          </View>)}
        </View>
      </View>
    </View> : <View style={{ gap: 16 }}>
    <Button quiet icon="close-outline" title={t('Revenir aux conseils', 'Back to tips', 'العودة إلى النصائح')} onPress={() => setPracticing(false)} />
    <Card style={{ padding: 20, borderRadius: 20, shadowOpacity: 0, elevation: 0, gap: 16 }}>
      <Label bold size={21} accessibilityRole="header">{t('À toi de parler', 'Your speaking practice', 'دورك لتتكلّم')}</Label>
      <Label muted size={12}>{t('Sans enregistrement. Notes conservées pendant cette séance.', 'No recording. Notes stay during this session.', 'دون تسجيل. تبقى ملاحظاتك خلال هذه الجلسة.')}</Label>
      {step === 0 && !finished && <View style={{ gap: 8 }}>{topics.map((title, i) => <Button key={title} quiet selected={topic === i} title={title} onPress={() => setTopic(i)} />)}</View>}
      <Label bold>{topics[topic]}</Label>
      <Field value={keywords} onChangeText={setKeywords} maxLength={200} multiline minHeight={80}
        placeholder={t('Mes trois mots-clés…', 'My three keywords…', 'كلماتي المفتاحية الثلاث…')} />
      <ProgressBar value={finished ? 1 : step / steps.length} />
      {finished ? <View style={{ gap: 12 }}>
        <Label bold accessibilityRole="header">{t('Pratique terminée', 'Practice complete', 'اكتمل التدريب')}</Label>
        <Label>{t('Quelle phrase était claire ? Où une pause t’a-t-elle aidé ? Choisis une seule chose à améliorer à la prochaine tentative. Le but est de transmettre ton idée, pas de parler parfaitement.', 'Which sentence was clear? Where did a pause help? Pick one thing to improve next time. The aim is to share your idea, not to speak perfectly.', 'أي جملة كانت واضحة؟ أين ساعدتك الوقفة؟ اختر شيئًا واحدًا لتحسينه في المحاولة القادمة. الهدف هو إيصال فكرتك، وليس الكلام المثالي.')}</Label>
        <Button title={t('Recommencer', 'Practice again', 'تدرّب مجددًا')} onPress={() => { setStep(0); setFinished(false); }} />
      </View> : <View style={{ gap: 12 }}>
        <Label muted size={13}>{t(`Étape ${step + 1} sur ${steps.length}`, `Step ${step + 1} of ${steps.length}`, `الخطوة ${step + 1} من ${steps.length}`)}</Label>
        <Label bold size={18} accessibilityRole="header">{activeStep[0]}</Label>
        <Label size={15}>{activeStep[1]}</Label>
        <Row>
          {step > 0 && <Button quiet title={t('Retour', 'Back', 'رجوع')} onPress={() => setStep(step - 1)} />}
          <Button title={step === steps.length - 1 ? t('Terminer et réfléchir', 'Finish and reflect', 'إنهاء ومراجعة') : t('Continuer', 'Continue', 'متابعة')} onPress={() => step === steps.length - 1 ? setFinished(true) : setStep(step + 1)} />
        </Row>
      </View>}
    </Card>
    </View>}
  </Page>;
}
