import { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Page, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { readAgent, runAgent, starterAgent, type AgentConfig } from '../utils/agent-studio';

export default function AgentStudio() {
  const { state, update, t, saveStatus, retry } = useSchool();
  const [config, setConfig] = useState<AgentConfig>(() => {
    try {
      return readAgent(state.drafts['agent-studio.config']);
    } catch {
      return { ...starterAgent };
    }
  });
  const [input, setInput] = useState(
    state.drafts['agent-studio.input'] || 'What is retrieval practice?',
  );
  const [result, setResult] = useState<ReturnType<typeof runAgent> | null>(null);
  const [error, setError] = useState(() => {
    try {
      readAgent(state.drafts['agent-studio.config']);
      return '';
    } catch {
      return t(
        'Projet enregistré illisible. Un exemple est affiché ; votre sauvegarde est conservée jusqu’à un nouvel enregistrement.',
        'Saved project could not be read. Showing a starter; the original is preserved until you save again.',
        'تعذرت قراءة المشروع المحفوظ. نعرض مثالًا أوليًا ونحتفظ بالأصل حتى تحفظ من جديد.',
      );
    }
  });
  const dirty =
    state.drafts['agent-studio.config'] !== JSON.stringify(config) ||
    state.drafts['agent-studio.input'] !== input;
  const [checks, setChecks] = useState<string[]>([]);
  const patch = (value: Partial<AgentConfig>) => {
    setConfig((c) => ({ ...c, ...value }));
    setResult(null);
    setChecks([]);
  };
  const save = () => {
    try {
      readAgent(JSON.stringify(config));
      update((p) => ({
        ...p,
        drafts: {
          ...p.drafts,
          'agent-studio.config': JSON.stringify(config),
          'agent-studio.input': input,
        },
      }));
      setError('');
    } catch {
      setError(t('Ajoutez un objectif valide.', 'Add a valid goal.', 'أضف هدفًا صالحًا.'));
    }
  };
  return (
    <Page
      title={t('Studio des agents', 'Agent Studio', 'استوديو الوكلاء')}
      subtitle={t(
        'Construire · observer · vérifier',
        'Build · observe · verify',
        'ابنِ · راقب · تحقّق',
      )}
    >
      <Card>
        <Label bold size={24}>
          {t(
            'Votre premier agent, étape par étape',
            'Your first agent, step by step',
            'وكيلك الأول، خطوة بخطوة',
          )}
        </Label>
        <Label>
          {t(
            'Objectif : construire un flux borné qui choisit un outil, observe le résultat et refuse une réponse sans preuve.',
            'Objective: build a bounded workflow that uses a tool, inspects the result, and declines unsupported answers.',
            'الهدف: بناء سير عمل محدود يستخدم أداة ويفحص نتيجتها ويرفض الإجابات غير المدعومة.',
          )}
        </Label>
        <Label muted>
          {t(
            'Atelier local déterministe, disponible hors ligne. Ce moteur suit des règles ; il ne contient pas de modèle IA. L’objectif décrit votre projet, les contrôles ci-dessous pilotent son exécution.',
            'Local deterministic workshop, available offline. This engine follows rules; it does not run an AI model. The goal describes your project; the controls below determine execution.',
            'ورشة محلية تعمل دون إنترنت وفق قواعد محددة، وليست نموذج ذكاء اصطناعي. الهدف يصف المشروع، والإعدادات أدناه تتحكم في التنفيذ.',
          )}
        </Label>
        <Label>
          {t(
            'Exemple : demander « retrieval » → consulter les notes → citer la note → arrêter. Modifiez ensuite le budget pour observer un arrêt anticipé.',
            'Example: ask “retrieval” → consult notes → cite the note → stop. Then change the budget to observe an early stop.',
            'مثال: اسأل عن retrieval ← راجع الملاحظات ← استشهد بالملاحظة ← توقف. غيّر حد الخطوات لملاحظة التوقف المبكر.',
          )}
        </Label>
      </Card>
      <Card>
        <Label bold>{t('1. Concevoir', '1. Design', '١. صمّم')}</Label>
        <Field
          placeholder="Agent goal"
          accessibilityLabel="Agent goal"
          value={config.goal}
          maxLength={500}
          onChangeText={(goal) => patch({ goal })}
        />
        <Row>
          {(['notes', 'calculator'] as const).map((tool) => (
            <Button
              key={tool}
              quiet
              selected={config.tool === tool}
              title={
                tool === 'notes'
                  ? t('Notes', 'Notes', 'ملاحظات')
                  : t('Calculatrice', 'Calculator', 'آلة حاسبة')
              }
              onPress={() => patch({ tool })}
            />
          ))}
        </Row>
        <Label>{t('Budget de pas', 'Step budget', 'حد الخطوات')}</Label>
        <Row>
          {[1, 2, 3, 4].map((maxSteps) => (
            <Button
              key={maxSteps}
              quiet
              selected={config.maxSteps === maxSteps}
              title={String(maxSteps)}
              onPress={() => patch({ maxSteps })}
            />
          ))}
        </Row>
        <Button
          quiet
          selected={config.requireEvidence}
          title={t('Exiger une preuve', 'Require evidence', 'اشتراط الدليل')}
          onPress={() => patch({ requireEvidence: !config.requireEvidence })}
        />
        <Button title={t('Enregistrer le projet', 'Save project', 'احفظ المشروع')} onPress={save} />
        <Label muted>
          {t('Stockage local', 'Local storage', 'حفظ محلي')}:{' '}
          {dirty
            ? t('Modifications non enregistrées', 'Unsaved changes', 'تغييرات غير محفوظة')
            : saveStatus}
        </Label>
        {saveStatus === 'error' && (
          <Button title={t('Réessayer', 'Retry save', 'أعد الحفظ')} onPress={retry} />
        )}
        {!!error && <Label accessibilityRole="alert">{error}</Label>}
      </Card>
      <Card>
        <Label bold>{t('2. Exécuter et observer', '2. Run and inspect', '٢. شغّل وافحص')}</Label>
        <Label muted>
          {config.tool === 'notes'
            ? 'Topics: retrieval · spacing · agent'
            : '12 + 8, 6 * 7, 20 / 4, 9 - 3'}
        </Label>
        <Field
          placeholder="Agent input"
          accessibilityLabel="Agent input"
          value={input}
          maxLength={500}
          onChangeText={(value) => {
            setInput(value);
            setResult(null);
          }}
        />
        <Button
          title={t('Exécuter le flux', 'Run workflow', 'شغّل سير العمل')}
          disabled={!input.trim() || !config.goal.trim()}
          onPress={() => setResult(runAgent(config, input))}
        />
        {result && (
          <>
            <Label bold>{t('Trace réelle', 'Actual execution trace', 'سجل التنفيذ الفعلي')}</Label>
            {result.trace.map((step, i) => (
              <Label key={i}>
                {i + 1}. {step.stage}: {step.detail}
              </Label>
            ))}
            <Label accessibilityLiveRegion="polite">{result.answer}</Label>
          </>
        )}
      </Card>
      <Card>
        <Label bold>
          {t('3. Tester les limites', '3. Test the boundaries', '٣. اختبر الحدود')}
        </Label>
        <Label>
          {t(
            'Vérifiez une réponse connue, une entrée inconnue et un budget insuffisant. Réussir ces tests ne prouve pas la maîtrise.',
            'Check a known answer, an unknown input, and an insufficient budget. Passing these checks is not proof of mastery.',
            'اختبر إجابة معروفة ومدخلًا مجهولًا وحدًا غير كافٍ للخطوات. النجاح في هذه الاختبارات لا يثبت الإتقان.',
          )}
        </Label>
        <Button
          title={t('Lancer les 3 tests', 'Run 3 checks', 'شغّل ٣ اختبارات')}
          disabled={!config.goal.trim()}
          onPress={() => {
            const known = runAgent(config, config.tool === 'notes' ? 'retrieval' : '6 * 7');
            const unknown = runAgent(config, config.tool === 'notes' ? 'unknown subject' : '1 / 0');
            const stopped = runAgent({ ...config, maxSteps: 1 }, 'retrieval');
            setChecks([
              `${known.grounded ? 'PASS' : 'FAIL'}: supported answer`,
              `${!unknown.grounded ? 'PASS' : 'FAIL'}: unsupported input withheld`,
              `${stopped.trace.length === 1 ? 'PASS' : 'FAIL'}: step limit enforced`,
            ]);
          }}
        />
        {checks.map((check) => (
          <Label key={check}>{check}</Label>
        ))}
        <Label>
          {t(
            'À retenir : autoriser peu d’outils, borner les étapes, vérifier les preuves. Prochaine étape : expliquez au professeur pourquoi un outil ne doit pas décider seul de ses permissions.',
            'Recap: allow few tools, bound the steps, check the evidence. Next: explain to your tutor why a tool should not choose its own permissions.',
            'الخلاصة: حدّد الأدوات والخطوات وافحص الأدلة. التالي: اشرح للمعلم لماذا لا ينبغي للأداة تحديد صلاحياتها بنفسها.',
          )}
        </Label>
        <Button
          quiet
          title={t('Approfondir avec le professeur', 'Go deeper with my tutor', 'تعمّق مع المعلّم')}
          onPress={() =>
            router.push({
              pathname: '/teacher',
              params: {
                question: `Help me improve this rule-based agent workshop. Ask me to explain tool permissions and verification before adding an AI model. Configuration: ${JSON.stringify(config)}. Latest trace: ${JSON.stringify(result)}`,
              },
            })
          }
        />
      </Card>
    </Page>
  );
}
