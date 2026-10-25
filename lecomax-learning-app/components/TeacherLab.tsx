import React, { useEffect, useRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { PhonePythonLab } from './PhonePythonLab';
import { MobilePythonWorkspace } from './MobilePythonWorkspace';
import { useSchool } from '../store/School';
import { auth, API } from '../services/auth';
import { Button, Label, Row } from './UI';
import { TeacherSheet } from './TeacherUI';
import { fonts } from '../constants/design';
import { router } from 'expo-router';

type Runtime = 'javascript' | 'powershell' | 'python';
export type LabSeed = { code: string; runtime: Runtime };
type Result = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  cancelled: boolean;
  truncated: boolean;
};
const examples: Record<Runtime, string> = {
  python:
    '# Multiply each price by its quantity, then add the subtotals.\ncart = [\n    {"name": "Book", "price": 80, "quantity": 2},\n    {"name": "Pen", "price": 10, "quantity": 3},\n]\ntotal = 0\nfor item in cart:\n    subtotal = item["price"] * item["quantity"]\n    print(f"{item[\'name\']}: {subtotal} MAD")\n    total += subtotal\nprint(f"Total: {total} MAD")',
  javascript:
    '// Cart total: price × quantity, then add each subtotal.\nconst cart = [{ name: "Book", price: 80, quantity: 2 }, { name: "Pen", price: 10, quantity: 3 }];\nlet total = 0;\nfor (const item of cart) {\n  const subtotal = item.price * item.quantity;\n  console.log(item.name + ": " + subtotal + " MAD");\n  total += subtotal;\n}\nconsole.log("Total: " + total + " MAD");',
  powershell:
    '# Real PowerShell objects and a pipeline; no files are changed.\n$cart = @(\n  [pscustomobject]@{ Name = "Book"; Price = 80; Quantity = 2 }\n  [pscustomobject]@{ Name = "Pen"; Price = 10; Quantity = 3 }\n)\n$total = 0\n$cart | ForEach-Object {\n  $subtotal = $_.Price * $_.Quantity\n  Write-Output "$($_.Name): $subtotal MAD"\n  $total += $subtotal\n}\nWrite-Output "Total: $total MAD"',
};
export function labRuntime(language = ''): Runtime | null {
  return /^(js|javascript|node|nodejs)$/i.test(language)
    ? 'javascript'
    : /^(powershell|ps1|pwsh)$/i.test(language)
      ? 'powershell'
      : /^(python|python3|py)$/i.test(language)
        ? 'python'
        : null;
}
export function TeacherLab(props: { visible: boolean; seed: LabSeed | null; onClose: () => void; onExplain: (prompt: string) => void }) {
  if (props.seed?.runtime === 'python') return <MobilePythonWorkspace {...props} />;
  return Platform.OS === 'android' ? <PhonePythonLab {...props} /> : <ComputerLab {...props} />;
}
function ComputerLab({
  visible,
  seed,
  onClose,
  onExplain,
}: {
  visible: boolean;
  seed: LabSeed | null;
  onClose: () => void;
  onExplain: (prompt: string) => void;
}) {
  const { t, colors } = useSchool();
  const [runtime, setRuntime] = useState<Runtime>(seed?.runtime || 'javascript');
  const [code, setCode] = useState(seed?.code || examples.javascript);
  const [result, setResult] = useState<Result | null>(null);
  const [lastRun, setLastRun] = useState<LabSeed | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const run = async () => {
    if (controller.current || !reviewed || !code.trim()) return;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError('');
    setResult(null);
    const submitted = { runtime, code };
    const timeout = setTimeout(() => abort.abort(), 18000);
    try {
      const access = await auth.token();
      if (!access) throw new Error('OWNER_LOGIN_REQUIRED');
      const response = await fetch(API + '/api/learning-mobile/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        body: JSON.stringify(submitted),
        signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'LAB_UNAVAILABLE');
      setLastRun(submitted);
      setResult(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(
        abort.signal.aborted
          ? t(
              'Exécution arrêtée ou délai dépassé.',
              'Run stopped or request timed out.',
              'تم إيقاف التشغيل أو انتهت المهلة.',
            )
          : message === 'LOCAL_LAB_ONLY'
            ? t(
                'Ce terminal nécessite le serveur local du laboratoire et localhost:8081.',
                'This terminal requires the local lab server and localhost:8081.',
                'تحتاج الطرفية إلى خادم المختبر المحلي وlocalhost:8081.',
              )
            : message === 'OWNER_LOGIN_REQUIRED'
              ? t(
                  'Reconnecte-toi pour exécuter le code.',
                  'Sign in again to run code.',
                  'سجّل الدخول مجددًا لتشغيل الكود.',
                )
              : message === 'LAB_BUSY'
                ? t(
                    'Une exécution est déjà en cours. Réessaie après sa fin.',
                    'Another run is active. Try again after it finishes.',
                    'هناك تشغيل آخر جارٍ. حاول بعد انتهائه.',
                  )
                : t(
                    'Le laboratoire est indisponible. Vérifie le serveur local.',
                    'The lab is unavailable. Check the local server.',
                    'المختبر غير متاح. تحقق من الخادم المحلي.',
                  ),
      );
    } finally {
      clearTimeout(timeout);
      controller.current = null;
      setBusy(false);
    }
  };
  const close = () => {
    controller.current?.abort();
    onClose();
  };
  return (
    <TeacherSheet
      visible={visible}
      title={t('Laboratoire · Console', 'Practice lab · Console', 'المختبر العملي · الطرفية')}
      onClose={close}
    >
      <Button title={t('Kali en direct · Wi-Fi', 'Live Kali · Wi-Fi', 'كالي مباشر · Wi-Fi')} onPress={() => { onClose(); router.push('/kali'); }} />
      <Label muted size={13}>
        {t(
          'Modifie, prédis, exécute, puis comprends le résultat.',
          'Edit, predict, run, then understand the result.',
          'عدّل وتوقّع وشغّل، ثم افهم النتيجة.',
        )}
      </Label>
      <Row>
        {(['javascript', 'python', 'powershell'] as const).map((value) => (
          <Button
            key={value}
            title={
              value === 'javascript'
                ? 'JavaScript · Node.js'
                : value === 'python'
                  ? 'Python 3'
                  : 'PowerShell'
            }
            selected={runtime === value}
            quiet
            disabled={busy}
            onPress={() => {
              setRuntime(value);
              setCode(examples[value]);
              setResult(null);
              setReviewed(false);
              setError('');
            }}
          />
        ))}
      </Row>
      <Label size={13}>
        {code.includes('Book')
          ? t(
              'Exemple : calculer un panier. Résultat attendu : Book: 160 MAD, Pen: 30 MAD, Total: 190 MAD. Change la quantité du livre à 3 : pourquoi le total devient-il 270 ?',
              'Example: calculate a cart. Expected: Book: 160 MAD, Pen: 30 MAD, Total: 190 MAD. Change the book quantity to 3: why does the total become 270?',
              'مثال: حساب السلة. المتوقع: Book: 160 MAD، Pen: 30 MAD، Total: 190 MAD. غيّر كمية الكتاب إلى 3: لماذا يصبح المجموع 270؟',
            )
          : t(
              'Prédis la sortie avant de lancer cet exemple.',
              'Predict the output before running this example.',
              'توقّع المخرجات قبل تشغيل هذا المثال.',
            )}
      </Label>
      <TextInput
        accessibilityLabel={t('Code à exécuter', 'Code to run', 'الكود المراد تشغيله')}
        value={code}
        multiline
        editable={!busy}
        maxLength={12000}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(value) => {
          setCode(value);
          setReviewed(false);
        }}
        style={{
          backgroundColor: colors.code,
          color: '#E2EEE6',
          borderRadius: 14,
          padding: 16,
          minHeight: 250,
          fontFamily: fonts.code,
          fontSize: 13,
          lineHeight: 22,
          textAlign: 'left',
          writingDirection: 'ltr',
          textAlignVertical: 'top',
        }}
      />
      <Label size={12} muted>
        {t(
          'Vrai terminal sur ce PC, pas un bac à sable : les commandes peuvent accéder aux fichiers et au réseau avec tes droits. Chaque exécution est indépendante, sans saisie interactive, limitée à 10 s. JavaScript : pas de DOM, JSX ou TypeScript.',
          'Real terminal on this PC, not a sandbox: commands can access files and the network with your permissions. Each run is independent, with no interactive input, limited to 10 seconds. JavaScript: no DOM, JSX or TypeScript.',
          'طرفية حقيقية على هذا الحاسوب وليست بيئة معزولة: قد تصل الأوامر إلى الملفات والشبكة بصلاحياتك. كل تشغيل مستقل بلا إدخال تفاعلي وبحد 10 ثوانٍ. JavaScript لا يدعم DOM أو JSX أو TypeScript هنا.',
        )}
      </Label>
      <Button
        quiet
        disabled={busy}
        selected={reviewed}
        title={
          reviewed
            ? t('Code vérifié ✓', 'Code reviewed ✓', 'راجعت الكود ✓')
            : t(
                'J’ai vérifié ce code et ses effets',
                'I reviewed this code and its effects',
                'راجعت هذا الكود وتأثيراته',
              )
        }
        onPress={() => setReviewed(!reviewed)}
      />
      <Row>
        <Button
          icon="play-outline"
          title={t('Exécuter', 'Run code', 'تشغيل الكود')}
          disabled={busy || !reviewed || !code.trim()}
          onPress={() => void run()}
        />
        {busy && (
          <Button
            quiet
            title={t('Arrêter', 'Stop', 'إيقاف')}
            onPress={() => controller.current?.abort()}
          />
        )}
      </Row>
      {!!error && <Label accessibilityRole="alert">{error}</Label>}
      {result && (
        <View style={{ gap: 10 }}>
          <Label bold>
            {t('Résultat réel', 'Actual result', 'النتيجة الفعلية')} · {result.durationMs} ms · exit{' '}
            {result.exitCode ?? '—'}
          </Label>
          {(result.timedOut || result.cancelled || result.truncated) && (
            <Label>
              {t(
                'Exécution interrompue ou sortie tronquée.',
                'Execution interrupted or output truncated.',
                'تم إيقاف التنفيذ أو اقتطاع المخرجات.',
              )}
            </Label>
          )}
          <Label
            selectable
            style={{
              backgroundColor: colors.code,
              color: '#E2EEE6',
              padding: 14,
              borderRadius: 12,
              fontFamily: fonts.code,
              textAlign: 'left',
              writingDirection: 'ltr',
            }}
          >
            {result.stdout ||
              t('(Aucune sortie standard)', '(No standard output)', '(لا توجد مخرجات قياسية)')}
            {result.stderr ? '\n\nSTDERR\n' + result.stderr : ''}
          </Label>
          <Label muted size={12}>
            {t(
              'Résultat du dernier code exécuté ; les modifications suivantes ne sont pas encore exécutées.',
              'Result of the last run; subsequent edits have not run yet.',
              'هذه نتيجة آخر تشغيل؛ التعديلات اللاحقة لم تُشغّل بعد.',
            )}
          </Label>
          <Button
            quiet
            title={t(
              'Expliquer le résultat et le pourquoi',
              'Explain the result and why',
              'اشرح النتيجة ولماذا',
            )}
            onPress={() => {
              if (!lastRun) return;
              onExplain(
                t(
                  'Explique ce résultat réel ligne par ligne, pourquoi chaque étape est nécessaire, et propose une modification à prédire. Ne relance rien.',
                  'Explain this actual result line by line, why each step is needed, and suggest one change for me to predict. Do not execute anything.',
                  'اشرح هذه النتيجة الفعلية سطرًا بسطر ولماذا نحتاج كل خطوة، واقترح تغييرًا أتوقع نتيجته. لا تشغّل شيئًا.',
                ) +
                  '\n```' +
                  lastRun.runtime +
                  '\n' +
                  lastRun.code.slice(0, 2500) +
                  '\n```\nConsole (may be truncated):\n' +
                  JSON.stringify(result).slice(0, 2400),
              );
              onClose();
            }}
          />
        </View>
      )}
    </TeacherSheet>
  );
}
