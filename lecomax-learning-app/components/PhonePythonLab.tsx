import React, { useEffect, useRef, useState } from 'react';
import { NativeModules, TextInput, View } from 'react-native';
import { Button, Label, Row } from './UI';
import { TeacherSheet } from './TeacherUI';
import { useSchool } from '../store/School';
import { fonts } from '../constants/design';

type Result = { stdout: string; stderr: string; exitCode: number | null; durationMs: number; timedOut: boolean; cancelled: boolean; truncated: boolean; version?: string };
const example = 'prices = [80, 10, 25]\ntotal = sum(prices)\nprint("Total:", total)';
export function PhonePythonLab({ visible, seed, onClose, onExplain }: {
  visible: boolean; seed: { runtime: string; code: string } | null;
  onClose: () => void; onExplain: (prompt: string) => void;
}) {
  const { t, colors } = useSchool();
  const [code, setCode] = useState(seed?.runtime === 'python' && seed.code ? seed.code : example);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [lastRun, setLastRun] = useState<{ code: string; input: string } | null>(null);
  const [error, setError] = useState('');
  const running = useRef(false);
  const mounted = useRef(true);
  const engine = NativeModules.PhonePython;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; NativeModules.PhonePython?.stop(); };
  }, []);
  useEffect(() => { if (!visible) NativeModules.PhonePython?.stop(); }, [visible]);
  const run = async () => {
    if (running.current || !engine || !code.trim()) return;
    running.current = true;
    setBusy(true); setError(''); setResult(null);
    const submitted = { code, input };
    setLastRun(submitted);
    try {
      const value = await engine.run(code, input.endsWith('\n') || !input ? input : input + '\n');
      if (mounted.current) setResult(typeof value === 'string' ? JSON.parse(value) : value);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const help = () => {
    const snapshot = result && lastRun ? lastRun : { code, input };
    onExplain(t(
      'Je ne comprends pas ce code Python. Explique simplement, étape par étape. Explique les erreurs éventuelles et propose une correction. Pose une petite question puis attends ma réponse.',
      'I do not understand this Python code. Explain simply, step by step. Explain any errors and suggest a correction. Ask one small question, then wait for my answer.',
      'لم أفهم كود بايثون هذا. اشرحه ببساطة خطوة بخطوة. اشرح أي خطأ واقترح تصحيحاً. اطرح سؤالاً صغيراً ثم انتظر إجابتي.'
    ) + '\nPython code:\n' + snapshot.code.slice(0, 2500) + '\nInput:\n' + snapshot.input.slice(0, 500)
      + '\n' + (result ? 'Actual CPython result on Android:\n' + JSON.stringify(result).slice(0, 1800) : 'This code has not produced a result yet.'));
    onClose();
  };
  const editorStyle = { backgroundColor: colors.code, color: '#E2EEE6', padding: 12, borderRadius: 12, fontFamily: fonts.code, fontSize: 14, textAlign: 'left' as const, writingDirection: 'ltr' as const, textAlignVertical: 'top' as const };
  return <TeacherSheet visible={visible} title={t('Python sur mon téléphone', 'Python on my phone', 'بايثون على هاتفي')} onClose={() => { engine?.stop(); onClose(); }}>
    <Label muted>{t('Vrai CPython intégré. Fonctionne hors ligne, sans PC. Chaque exécution repart à zéro et s’arrête après 10 secondes.', 'Built-in CPython. Runs offline without a PC. Each run starts fresh and stops after 10 seconds.', 'مفسر CPython مدمج. يعمل دون إنترنت أو حاسوب. كل تشغيل يبدأ من جديد ويتوقف بعد 10 ثوانٍ.')}</Label>
    {!engine && <Label accessibilityRole="alert">{t('Installe la nouvelle version Android pour activer Python.', 'Install the new Android build to enable Python.', 'ثبّت نسخة أندرويد الجديدة لتفعيل بايثون.')}</Label>}
    <TextInput accessibilityLabel="Python code" value={code} onChangeText={setCode} editable={!busy} multiline maxLength={12000} autoCorrect={false} autoCapitalize="none" style={{ ...editorStyle, minHeight: 190 }} />
    <Label size={12}>{t('Entrées pour input() : une réponse par ligne, avant de lancer.', 'Input for input(): enter one answer per line before running.', 'مدخلات input(): اكتب إجابة في كل سطر قبل التشغيل.')}</Label>
    <TextInput accessibilityLabel="Python input" value={input} onChangeText={setInput} editable={!busy} multiline maxLength={12000} autoCorrect={false} autoCapitalize="none" style={{ ...editorStyle, minHeight: 55 }} />
    <Row><Button title={busy ? t('Exécution…', 'Running…', 'جارٍ التشغيل…') : t('Exécuter Python', 'Run Python', 'تشغيل بايثون')} disabled={!engine || busy || !code.trim()} onPress={() => void run()} />
      {busy && <Button title={t('Arrêter', 'Stop', 'إيقاف')} onPress={() => engine?.stop()} />}</Row>
    {!!error && <Label accessibilityRole="alert">{error}</Label>}
    {result && <View style={{ gap: 6 }}>
      <Label bold>{result.version ? `CPython ${result.version} · Android` : 'Python · Android'} · {result.durationMs} ms</Label>
      <Label>{result.timedOut ? t('Délai dépassé', 'Timed out', 'انتهت المهلة') : result.cancelled ? t('Arrêté', 'Stopped', 'تم الإيقاف') : `Exit: ${result.exitCode}`}</Label>
      <Label selectable style={editorStyle}>{result.stdout || t('(Aucune sortie)', '(No output)', '(لا توجد مخرجات)')}{result.stderr ? '\n' + result.stderr : ''}</Label>
      <Label muted size={12}>{t('Résultat du dernier code exécuté.', 'Result of the last code you ran.', 'نتيجة آخر كود شغّلته.')}</Label>
    </View>}
    <Button title={t('Je ne comprends pas · Professeur IA', 'I don’t understand · Ask AI Teacher', 'لم أفهم · اسأل الأستاذ الذكي')} disabled={busy} onPress={help} />
    <Label muted size={12}>{t('Le professeur IA a besoin d’internet. Le bouton partage le code et le dernier résultat avec lui.', 'AI Teacher needs internet. This button shares your code and latest result with it.', 'الأستاذ الذكي يحتاج إلى الإنترنت. يرسل هذا الزر الكود وآخر نتيجة إليه.')}</Label>
  </TeacherSheet>;
}
