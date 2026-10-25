import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import steps from '../data/python-environment-guide.json';
import { useSchool } from '../store/School';
import { Button, Card, Label, Row } from './UI';
import { CodeViewer } from './CodeViewer';

export function PythonEnvironmentGuide() {
  const { state, t, colors } = useSchool();
  const [platform, setPlatform] = useState<'windows' | 'unix'>('windows');
  const [step, setStep] = useState(0);
  const [help, setHelp] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const lang = { fr: 0, en: 1, ar: 2 }[state.language];
  const pick = (values: string[]) => values[lang]!;
  const current = steps[step]!;
  return <View style={{ gap: 16 }}>
    <Card style={{ padding: 18, backgroundColor: colors.soft }}>
      <Label bold size={19}>{t('On le fait ensemble', 'Let’s do this together', 'لنطبّق معًا خطوة بخطوة')}</Label>
      <Label size={14}>{t('Objectif : préparer les outils de ton premier serveur Python. Lis sur le téléphone, exécute les commandes sur ton ordinateur. Le bouton Copier ne les exécute pas.', 'Goal: prepare the tools for your first Python server. Read on your phone and run the commands on your computer. Copy does not run them.', 'الهدف: تجهيز أدوات أول خادم Python لك. اقرأ على الهاتف ونفّذ الأوامر على الحاسوب. زر النسخ لا ينفّذ الأمر.')}</Label>
      <Label bold size={14}>{t('Quel ordinateur utilises-tu ?', 'Which computer are you using?', 'ما نظام حاسوبك؟')}</Label>
      <Row>
        <Button quiet selected={platform === 'windows'} title="Windows" onPress={() => { setPlatform('windows'); setHelp(false); }} />
        <Button quiet selected={platform === 'unix'} title="macOS / Linux" onPress={() => { setPlatform('unix'); setHelp(false); }} />
      </Row>
      <Label bold size={14}>{t('Où écrire les commandes ?', 'Where do I type these?', 'أين أكتب الأوامر؟')}</Label>
      <Label size={14}>{platform === 'windows'
        ? t('Crée un dossier python-atelier. Ouvre-le dans VS Code, puis Terminal → New Terminal et choisis PowerShell. Le terminal est la zone où tu tapes des instructions à l’ordinateur. Vérifie que son chemin se termine par python-atelier.', 'Create a python-atelier folder. Open it in VS Code, then Terminal → New Terminal and choose PowerShell. The terminal is where you type instructions to your computer. Check that its current path ends in python-atelier.', 'أنشئ مجلدًا باسم python-atelier وافتحه في VS Code. اختر Terminal ثم New Terminal واختر PowerShell. الطرفية مساحة تكتب فيها تعليمات للحاسوب. تأكد أن المسار الحالي ينتهي بـ python-atelier.')
        : t('Crée un dossier python-atelier et ouvre-le dans VS Code. Choisis Terminal → New Terminal. Vérifie que le terminal est dans ce dossier. Utilise les commandes macOS/Linux ci-dessous.', 'Create a python-atelier folder and open it in VS Code. Choose Terminal → New Terminal. Check that the terminal is in that folder. Use the macOS/Linux commands below.', 'أنشئ مجلد python-atelier وافتحه في VS Code، ثم اختر Terminal وبعدها New Terminal. تأكد أن الطرفية داخل هذا المجلد واستخدم أوامر macOS/Linux أدناه.')}</Label>
      <Label muted size={13}>{t('Pas dans un fichier .py. Si tu vois >>>, tape exit() pour revenir au terminal.', 'Not inside a .py file. If you see >>>, type exit() to return to the terminal.', 'لا تكتب هذه الأوامر داخل ملف .py. إذا رأيت >>> فاكتب exit() للعودة إلى الطرفية.')}</Label>
    </Card>
    <Row>{steps.map((item, i) => <Button key={i} quiet selected={step === i} title={(i + 1) + '. ' + pick(item.title)} onPress={() => { setStep(i); setHelp(false); }} />)}</Row>
    <Label bold size={20} accessibilityRole="header">{step + 1} / {steps.length} · {pick(current.title)}</Label>
    <Label>{pick(current.purpose)}</Label>
    <Label muted size={13}>{t('Copie ce seul bloc, colle-le dans le terminal puis appuie sur Entrée. Attends la fin avant la suite.', 'Copy this one block, paste into the terminal, and press Enter. Wait for it to finish before continuing.', 'انسخ هذا الأمر فقط والصقه في الطرفية ثم اضغط Enter. انتظر انتهاءه قبل المتابعة.')}</Label>
    <CodeViewer key={platform + step} filename={platform === 'windows' ? 'PowerShell · Windows' : 'Terminal · macOS / Linux'} code={current[platform]} annotations={[{ lines: '1', label: pick(current.purpose) }]} />
    <Card style={{ padding: 16 }}>
      <Label bold>{t('Chaque morceau a un rôle', 'What each part means', 'ماذا يعني كل جزء؟')}</Label>
      {current.terms.map(([term, ...meaning]) => <View key={term} style={{ gap: 3 }}>
        <Label bold size={14} style={{ writingDirection: 'ltr', textAlign: 'left' }}>{term}</Label>
        <Label size={14}>{pick(meaning)}</Label>
      </View>)}
    </Card>
    <Card style={{ padding: 16, backgroundColor: colors.soft }}>
      <Label bold>{t('Ce que tu dois voir', 'What you should see', 'ما الذي يجب أن يظهر؟')}</Label>
      <Label size={14}>{pick(current.result)}</Label>
      <Button quiet title={help ? t('Masquer l’aide', 'Hide help', 'إخفاء المساعدة') : t('Je ne vois pas ce résultat', 'I don’t see this result', 'لم تظهر هذه النتيجة')} onPress={() => setHelp(!help)} />
      {help && <Label size={14}>{pick(current.help)}</Label>}
    </Card>
    <Row>
      <Button quiet disabled={step === 0} title={t('Étape précédente', 'Previous step', 'الخطوة السابقة')} onPress={() => { setStep((n) => Math.max(0, n - 1)); setHelp(false); }} />
      {step < steps.length - 1 && <Button title={t('Étape suivante', 'Next step', 'الخطوة التالية')} onPress={() => { setStep((n) => Math.min(steps.length - 1, n + 1)); setHelp(false); }} />}
    </Row>
    {step === steps.length - 1 && <Card style={{ padding: 16 }}>
      <Label bold>{t('Maintenant, explique-le toi-même', 'Now explain it yourself', 'الآن اشرح بطريقتك')}</Label>
      <Label size={14}>{t('Pourquoi utilise-t-on Python dans .venv pour installer ET vérifier FastAPI ? Réponds dans tes notes, puis ouvre Pratiquer.', 'Why do we use the Python inside .venv to both install AND check FastAPI? Answer in your notes, then open Practice.', 'لماذا نستخدم Python الموجود داخل .venv للتثبيت وللتحقّق أيضًا؟ اكتب إجابتك في الملاحظات ثم افتح التدريب.')}</Label>
    </Card>}
    <Button quiet title={t('Documentation Python officielle', 'Official Python documentation', 'توثيق Python الرسمي')} onPress={() => { setLinkError(false); void Linking.openURL('https://docs.python.org/3/library/venv.html').catch(() => setLinkError(true)); }} />
    {linkError && <Label muted>{t('Lien indisponible. Les étapes restent accessibles ici.', 'Link unavailable. You can still read the steps here.', 'تعذّر فتح الرابط. يمكنك متابعة الخطوات هنا.')}</Label>}
  </View>;
}
