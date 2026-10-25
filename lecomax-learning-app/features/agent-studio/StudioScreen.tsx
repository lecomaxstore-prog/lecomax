import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { Button, Card, Field, Label, Page, ProgressBar, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { auth, API } from '../../services/auth';
import {
  appendVersion,
  buildWorkflow,
  executeTool,
  NODE_KINDS,
  readVersions,
  runLocal,
  STUDIO_KEY,
  TOOL_IDS,
  toolDescriptions,
  validateConfig,
  type Config,
  type Run,
  type Step,
  type Version,
} from './core';
import { DOCS, lessons, templates, type Template } from './curriculum';
import { exportVersion, sdkExample } from './exports';

const tabs = [
  'Learn',
  'Builder',
  'Workflow',
  'Projects',
  'Debugger',
  'Engineering',
  'Security',
  'Portfolio',
] as const;
type Tab = (typeof tabs)[number];
const questions = [
  'What should the agent do?',
  'What information does it need?',
  'Which permitted tools are required?',
  'What inputs and outputs are expected?',
  'Which actions require human approval?',
  'When should the agent stop?',
];
export default function StudioScreen() {
  const school = useSchool();
  if (!school.ready)
    return (
      <Page title="AI Agent Studio">
        <Label>Loading saved projects…</Label>
        {!!school.error && <Button title="Retry loading" onPress={school.retry} />}
      </Page>
    );
  return <Studio />;
}
function Studio() {
  const { state, update, t, colors, saveStatus, retry } = useSchool();
  let versions: Version[] = [],
    corrupt = false;
  try {
    versions = readVersions(state.drafts[STUDIO_KEY]);
  } catch {
    corrupt = true;
  }
  const latest = versions[versions.length - 1];
  const [config, setConfig] = useState<Config>(() => latest?.config || templates[0]!.config);
  const [input, setInput] = useState(latest?.input ?? templates[0]!.input),
    [document, setDocument] = useState(latest?.document ?? templates[0]!.document);
  const [tab, setTab] = useState<Tab>('Learn'),
    [wizard, setWizard] = useState(0),
    [selected, setSelected] = useState('n1'),
    [graph, setGraph] = useState(false),
    [zoom, setZoom] = useState(1);
  const [run, setRun] = useState<Run | null>(null),
    [visible, setVisible] = useState(1),
    [approvals, setApprovals] = useState<string[]>([]),
    [fault, setFault] = useState<'none' | 'once' | 'always'>('none');
  const [message, setMessage] = useState(''),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [checks, setChecks] = useState<string[]>([]),
    [code, setCode] = useState(''),
    [language, setLanguage] = useState<'typescript' | 'python'>('typescript');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const invalidate = () => {
    setRun(null);
    setApprovals([]);
    setChecks([]);
    setConsent(false);
    setCode('');
  };
  const patch = (p: Partial<Config>) => {
    setConfig((c) => ({ ...c, ...p }));
    invalidate();
  };
  const node = config.nodes.find((n) => n.id === selected) || config.nodes[0]!;
  const patchNode = (p: Partial<Step>) =>
    patch({ nodes: config.nodes.map((n) => (n.id === node.id ? { ...n, ...p } : n)) });
  const loadTemplate = (template: Template) => {
    setConfig(JSON.parse(JSON.stringify(template.config)));
    setInput(template.input);
    setDocument(template.document);
    setSelected('n1');
    invalidate();
    setMessage('Template opened as a working copy. Saved versions remain available.');
    setTab('Builder');
    setWizard(0);
  };
  const guard = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'This action could not be completed.');
    }
  };
  const local = (approved: string[] = []) =>
    guard(() => {
      const result = runLocal(config, input, document, approved, fault);
      setApprovals(approved);
      setRun(result);
      setVisible(1);
      setTab('Debugger');
      setMessage('Local deterministic test. No API request or external action.');
    });
  const copy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setMessage('Copied to clipboard.');
    } catch {
      setMessage('Clipboard unavailable. Select and copy the text below.');
    }
  };
  const save = () =>
    guard(() => {
      const validated = validateConfig(config);
      const version: Version = {
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        config: validated,
        input,
        document,
        run,
        evaluations: checks,
      };
      appendVersion(state.drafts[STUDIO_KEY], version);
      update((p) => ({
        ...p,
        drafts: { ...p.drafts, [STUDIO_KEY]: appendVersion(p.drafts[STUDIO_KEY], version) },
      }));
      setMessage('Version queued for local saving. Check the storage status.');
    });
  const live = async () => {
    let valid: Config;
    try {
      valid = validateConfig(config);
      if (!consent || !input.trim()) throw Error('Confirm sharing consent and enter a request.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Invalid configuration');
      return;
    }
    const pending = new AbortController();
    controller.current = pending;
    setBusy(true);
    setRun(null);
    setMessage('Calling the authenticated server…');
    setTab('Debugger');
    const started = Date.now();
    const timer = setTimeout(() => pending.abort(), 28000);
    try {
      const token = await auth.token();
      if (!token) throw Error('Sign in to use the live server.');
      const response = await fetch(API + '/api/learning-mobile/agent-studio', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: valid, input, document, consent: true }),
        signal: pending.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(
          response.status === 429
            ? 'Request limit reached. Wait before retrying.'
            : result.error || 'Server request failed.',
        );
      if (pending.signal.aborted) return;
      if (
        !result.run ||
        result.run.mode !== 'live' ||
        !Array.isArray(result.run.events) ||
        typeof result.run.output !== 'string'
      )
        throw Error('Invalid server response.');
      setRun(result.run);
      setVisible(1);
      setMessage('Server run returned. Inspect its status and each event.');
    } catch (e) {
      const detail = pending.signal.aborted
        ? 'Request cancelled or timed out. No successful response is claimed.'
        : e instanceof TypeError
          ? 'Network unavailable. Check your connection or use local testing.'
          : e instanceof Error
            ? e.message
            : 'Network unavailable. Try local testing.';
      setMessage(detail);
      setRun({
        mode: 'live',
        status: 'failed',
        output: detail,
        events: [
          {
            node: 'request',
            stage: 'Request failed',
            detail,
            ms: Date.now() - started,
            status: 'error',
            attempt: 1,
          },
        ],
      });
      setVisible(1);
    } finally {
      clearTimeout(timer);
      if (controller.current === pending) {
        controller.current = null;
        setBusy(false);
      }
    }
  };
  const evaluate = () =>
    guard(() => {
      const known = runLocal(
        config,
        input,
        document,
        config.nodes.map((n) => n.id),
      );
      const stopped = runLocal({ ...config, maxSteps: 1 }, input, document);
      const needs = runLocal(
        { ...config, nodes: [{ ...config.nodes[0]!, kind: 'approval', next: '', otherwise: '' }] },
        input,
        document,
      );
      const empty = executeTool('retrieve', 'zzzznotfound', 'A plain sample document.');
      setChecks([
        `${known.status === 'complete' ? 'PASS' : 'FAIL'}: current workflow reaches a supported result (approval nodes auto-accepted for this simulation test only)`,
        `${stopped.status !== 'complete' ? 'PASS' : 'FAIL'}: one-step budget prevents completion`,
        `${needs.status === 'approval' ? 'PASS' : 'FAIL'}: approval gate pauses`,
        `${empty === '' ? 'PASS' : 'FAIL'}: unrelated retrieval returns no evidence`,
      ]);
    });
  return (
    <Page
      title={t('Studio des agents IA', 'AI Agent Studio', 'استوديو وكلاء الذكاء الاصطناعي')}
      subtitle={t(
        'Comprendre · construire · tester · expliquer',
        'Understand · build · test · explain',
        'افهم · ابنِ · اختبر · اشرح',
      )}
    >
      <Card style={{ backgroundColor: colors.soft }}>
        <Label muted bold size={12}>
          ACADEMY LAB / AGENT ENGINEERING
        </Label>
        <Label bold size={30}>
          From a request to a responsible agent.
        </Label>
        <Label>
          Design a small system. Watch every action. Learn where the model ends and your application
          takes responsibility.
        </Label>
        <Row>
          <Label bold>8 modules</Label>
          <Label>7 project starters</Label>
          <Label>Local-first testing</Label>
        </Row>
        <Row>
          <Button
            title="Build my first agent"
            onPress={() => {
              setTab('Builder');
              setWizard(0);
            }}
          />
          <Button
            quiet
            title="Classic beginner workshop"
            onPress={() => router.push('/agent-studio-basics' as never)}
          />
        </Row>
      </Card>
      {state.language !== 'en' && (
        <Label muted>
          {t(
            'Cette édition propose les cours techniques en anglais. Le professeur peut les expliquer dans votre langue.',
            '',
            'المحتوى التقني لهذه النسخة بالإنجليزية. يمكن للمعلم شرحه بلغتك.',
          )}
        </Label>
      )}
      <Row>
        {tabs.map((name, i) => (
          <Button
            key={name}
            quiet
            selected={tab === name}
            title={`${i + 1}. ${name}`}
            disabled={busy}
            onPress={() => setTab(name)}
          />
        ))}
      </Row>
      <Row>
        <Label muted>
          Local storage: {saveStatus} · {versions.length} saved versions
        </Label>
        {saveStatus === 'error' && <Button title="Retry save" onPress={retry} />}
      </Row>
      {corrupt && (
        <Card>
          <Label accessibilityRole="alert">
            The saved Studio archive is unreadable. It is preserved and new saves are disabled. Copy
            the original archive for recovery.
          </Label>
          <Button
            title="Copy original archive"
            onPress={() => void copy(state.drafts[STUDIO_KEY] || '')}
          />
        </Card>
      )}
      {!!message && <Label accessibilityLiveRegion="polite">{message}</Label>}
      {tab === 'Learn' && (
        <>
          <Card>
            <Label bold size={22}>
              Your learning route
            </Label>
            <Label>
              Read a concept → build its smallest version → run a known case → break it safely →
              explain the trace. A quiz answer records practice, not mastery.
            </Label>
            <Button
              title="Try the five-stage simulation"
              onPress={() => {
                setConfig(templates[0]!.config);
                setInput(templates[0]!.input);
                setDocument(templates[0]!.document);
                invalidate();
                setRun(runLocal(templates[0]!.config, templates[0]!.input, templates[0]!.document));
                setVisible(1);
                setTab('Debugger');
              }}
            />
          </Card>
          {lessons.map((lesson, i) => (
            <Card key={lesson.title}>
              <Label bold size={22}>
                {lesson.title}
              </Label>
              <Label>{lesson.body}</Label>
              <Label bold>Try it</Label>
              <Label>{lesson.exercise}</Label>
              <Label bold>{lesson.question}</Label>
              {lesson.choices.map((choice, j) => (
                <Button
                  key={choice}
                  quiet
                  selected={state.drafts[`studio.quiz.${i}`] === String(j)}
                  title={choice}
                  onPress={() =>
                    update((p) => ({
                      ...p,
                      drafts: { ...p.drafts, [`studio.quiz.${i}`]: String(j) },
                    }))
                  }
                />
              ))}
              {state.drafts[`studio.quiz.${i}`] !== undefined && (
                <Label>
                  {Number(state.drafts[`studio.quiz.${i}`]) === lesson.answer
                    ? 'Correct. Explain the rule using an event from your own trace.'
                    : 'Revisit the explanation and try again. The correct rule must be enforced by the application.'}
                </Label>
              )}
            </Card>
          ))}
        </>
      )}
      {tab === 'Builder' && (
        <Card>
          <Label muted>GUIDED DESIGN / STEP {wizard + 1} OF 6</Label>
          <ProgressBar value={(wizard + 1) / 6} />
          <Label bold size={24}>
            {questions[wizard]}
          </Label>
          {wizard === 0 && (
            <>
              <Field
                placeholder="Agent name"
                accessibilityLabel="Agent name"
                value={config.name}
                maxLength={100}
                onChangeText={(name) => patch({ name })}
              />
              <Field
                placeholder="One concrete goal"
                accessibilityLabel="Agent goal"
                value={config.goal}
                multiline
                maxLength={1000}
                onChangeText={(goal) => patch({ goal })}
              />
            </>
          )}
          {wizard === 1 && (
            <>
              <Label>
                Define the evidence policy, then paste public or synthetic source material in the
                debugger.
              </Label>
              <Field
                placeholder="Information and evidence policy"
                accessibilityLabel="Information policy"
                value={config.information}
                multiline
                maxLength={1000}
                onChangeText={(information) => patch({ information })}
              />
            </>
          )}
          {wizard === 2 && (
            <>
              <Label>
                Tools are capabilities, not permission requests to a model. Changing this list does
                not silently rewrite existing nodes.
              </Label>
              {TOOL_IDS.map((tool) => (
                <Card key={tool}>
                  <Button
                    quiet
                    title={tool}
                    selected={config.tools.includes(tool)}
                    onPress={() =>
                      patch({
                        tools: config.tools.includes(tool)
                          ? config.tools.filter((x) => x !== tool)
                          : [...config.tools, tool],
                      })
                    }
                  />
                  <Label muted>{toolDescriptions[tool]}</Label>
                </Card>
              ))}
            </>
          )}
          {wizard === 3 && (
            <>
              <Field
                placeholder="Expected input"
                accessibilityLabel="Input contract"
                value={config.inputContract}
                multiline
                maxLength={1000}
                onChangeText={(inputContract) => patch({ inputContract })}
              />
              <Field
                placeholder="Expected output"
                accessibilityLabel="Output contract"
                value={config.outputContract}
                multiline
                maxLength={1000}
                onChangeText={(outputContract) => patch({ outputContract })}
              />
            </>
          )}
          {wizard === 4 && (
            <>
              <Label>
                Selected tools pause before local execution and are excluded from live model tools.
                send_demo always requires approval and always stays simulated.
              </Label>
              {config.tools.map((tool) => (
                <Button
                  key={tool}
                  quiet
                  title={`Approval: ${tool}`}
                  selected={tool === 'send_demo' || config.approvalTools.includes(tool)}
                  disabled={tool === 'send_demo'}
                  onPress={() =>
                    patch({
                      approvalTools: config.approvalTools.includes(tool)
                        ? config.approvalTools.filter((x) => x !== tool)
                        : [...config.approvalTools, tool],
                    })
                  }
                />
              ))}
            </>
          )}
          {wizard === 5 && (
            <>
              <Field
                placeholder="When to stop"
                accessibilityLabel="Stop rule"
                value={config.stop}
                multiline
                maxLength={1000}
                onChangeText={(stop) => patch({ stop })}
              />
              <Label>
                Enforced local node budget; live mode additionally caps model calls at three.
              </Label>
              <Row>
                {[3, 6, 12, 20].map((maxSteps) => (
                  <Button
                    key={maxSteps}
                    quiet
                    selected={config.maxSteps === maxSteps}
                    title={`${maxSteps} steps`}
                    onPress={() => patch({ maxSteps })}
                  />
                ))}
              </Row>
              <Button
                title="Generate workflow from builder"
                onPress={() =>
                  guard(() => {
                    const generated = buildWorkflow(config);
                    setConfig(generated);
                    invalidate();
                    setSelected('n1');
                    setCode(JSON.stringify(generated, null, 2));
                    setMessage(
                      'Generated a connected workflow using the selected tools. This replaces the working graph; saved versions are unchanged.',
                    );
                  })
                }
              />
              <Button
                title="Validate and inspect configuration"
                onPress={() =>
                  guard(() => {
                    validateConfig(config);
                    setCode(JSON.stringify(config, null, 2));
                    setMessage(
                      `This agent will: ${config.goal} It may use ${config.tools.join(', ')}. ${config.stop}`,
                    );
                  })
                }
              />
              {!!code && (
                <Label selectable style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                  {code}
                </Label>
              )}
              <Button title="Open workflow editor" onPress={() => setTab('Workflow')} />
            </>
          )}
          <Row>
            <Button
              quiet
              title="Previous step"
              disabled={wizard === 0}
              onPress={() => setWizard((v) => v - 1)}
            />
            <Button
              title="Next step"
              disabled={wizard === 5}
              onPress={() => setWizard((v) => v + 1)}
            />
          </Row>
        </Card>
      )}
      {tab === 'Workflow' && (
        <>
          <Card>
            <Label bold size={24}>
              Connected workflow
            </Label>
            <Label>
              The first listed node starts the run. Edit Next and Alternate to connect steps.
              Conditions use the presence of a previous result; tool errors use Alternate. This
              graph runs locally. Live mode uses its own model-controlled loop.
            </Label>
            <Button
              quiet
              title={graph ? 'Hide graph' : 'Show connected graph'}
              onPress={() => setGraph((v) => !v)}
            />
            {graph && (
              <>
                <Row>
                  <Button
                    quiet
                    title="Zoom out"
                    onPress={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                  />
                  <Button
                    quiet
                    title="Zoom in"
                    onPress={() => setZoom((z) => Math.min(2, z + 0.25))}
                  />
                </Row>
                <Label muted>
                  Green connections: Next. Amber connections: Alternate. Select a node below to edit
                  its exact destinations.
                </Label>
                <WorkflowGraph
                  config={config}
                  zoom={zoom}
                  selected={node.id}
                  select={setSelected}
                />
              </>
            )}
            <Row>
              {config.nodes.map((n) => (
                <Button
                  key={n.id}
                  quiet
                  selected={n.id === node.id}
                  title={`${n.id}: ${n.label}`}
                  onPress={() => setSelected(n.id)}
                />
              ))}
            </Row>
          </Card>
          <Card>
            <Label bold>Editing {node.id}</Label>
            <Field
              placeholder="Step label"
              accessibilityLabel="Step label"
              value={node.label}
              maxLength={120}
              onChangeText={(label) => patchNode({ label })}
            />
            <Row>
              {NODE_KINDS.map((kind) => (
                <Button
                  key={kind}
                  quiet
                  selected={node.kind === kind}
                  title={kind}
                  onPress={() => patchNode({ kind })}
                />
              ))}
            </Row>
            {node.kind === 'tool' && (
              <Row>
                {config.tools.map((tool) => (
                  <Button
                    key={tool}
                    quiet
                    selected={node.tool === tool}
                    title={`Use ${tool}`}
                    onPress={() => patchNode({ tool })}
                  />
                ))}
              </Row>
            )}
            {(['next', 'otherwise'] as const).map((edge) => (
              <View key={edge}>
                <Label bold>{edge === 'next' ? 'Next / success' : 'Alternate / failure'}</Label>
                <Row>
                  {['', ...config.nodes.map((n) => n.id)].map((id) => (
                    <Button
                      key={id}
                      quiet
                      selected={node[edge] === id}
                      title={`${edge}: ${id || 'stop'}`}
                      onPress={() => patchNode({ [edge]: id })}
                    />
                  ))}
                </Row>
              </View>
            ))}
            <Row>
              <Button
                title="Add step"
                disabled={config.nodes.length >= 16}
                onPress={() => {
                  const id = `n${Math.max(...config.nodes.map((n) => Number(n.id.slice(1)))) + 1}`;
                  patch({
                    nodes: [
                      ...config.nodes,
                      {
                        id,
                        label: 'New step',
                        kind: 'tool',
                        tool: config.tools[0] || 'retrieve',
                        next: '',
                        otherwise: '',
                      },
                    ],
                  });
                  setSelected(id);
                }}
              />
              <Button
                quiet
                title="Remove selected step"
                disabled={config.nodes.length === 1}
                onPress={() => {
                  const nodes = config.nodes
                    .filter((n) => n.id !== node.id)
                    .map((n) => ({
                      ...n,
                      next: n.next === node.id ? '' : n.next,
                      otherwise: n.otherwise === node.id ? '' : n.otherwise,
                    }));
                  patch({ nodes });
                  setSelected(nodes[0]!.id);
                }}
              />
            </Row>
            <Row>
              <Button title="Test this workflow" onPress={() => local()} />
              <Button quiet title="Save workflow version" disabled={corrupt} onPress={save} />
            </Row>
          </Card>
        </>
      )}
      {tab === 'Projects' && (
        <>
          {templates.map((template, i) => (
            <Card key={template.config.id}>
              <Label muted>
                PROJECT {i + 1} / {i < 2 ? 'FOUNDATIONS' : i < 5 ? 'APPLICATIONS' : 'ADVANCED'}
              </Label>
              <Label bold size={24}>
                {template.config.name}
              </Label>
              <Label>{template.config.goal}</Label>
              <Label muted>Challenge: {template.challenge}</Label>
              <Button
                title={`Open ${template.config.name}`}
                onPress={() => loadTemplate(template)}
              />
            </Card>
          ))}
        </>
      )}
      {tab === 'Debugger' && (
        <>
          <Card>
            <Label bold size={24}>
              Run / inspect / repair
            </Label>
            <Label bold>{config.name}</Label>
            <Field
              placeholder="Request"
              accessibilityLabel="Run input"
              value={input}
              multiline
              maxLength={1000}
              editable={!busy}
              onChangeText={(v) => {
                setInput(v);
                invalidate();
              }}
            />
            <Field
              placeholder="Public or synthetic evidence"
              accessibilityLabel="Run document"
              value={document}
              multiline
              maxLength={12000}
              editable={!busy}
              onChangeText={(v) => {
                setDocument(v);
                invalidate();
              }}
            />
            <Label muted>
              Memory is scoped to this run. Saved versions preserve inputs and evidence locally; use
              only material you intend to retain.
            </Label>
            <Row>
              {(['none', 'once', 'always'] as const).map((f) => (
                <Button
                  key={f}
                  quiet
                  disabled={busy}
                  selected={fault === f}
                  title={`Tool failure: ${f}`}
                  onPress={() => {
                    setFault(f);
                    invalidate();
                  }}
                />
              ))}
            </Row>
            <Button title="Run local workflow" disabled={busy} onPress={() => local()} />
            <Button quiet title="Run local evaluation set" disabled={busy} onPress={evaluate} />
            {checks.map((c) => (
              <Label key={c}>{c}</Label>
            ))}
          </Card>
          <Card>
            <Label bold>Optional real model run</Label>
            <Label>
              Send this configuration, request and document to your authenticated server and its
              configured OpenAI model. This is a separate Responses API loop: it chooses among
              permitted read-only tools and does not execute graph edges or graph handoffs. Tools
              requiring approval are excluded. Maximum three model calls, 600 output tokens each, a
              22-second server deadline and no automatic API retries. Charges may apply.
            </Label>
            <Button
              quiet
              title={
                consent ? 'Sharing enabled — turn off' : 'Allow these inputs to be sent to OpenAI'
              }
              selected={consent}
              disabled={busy}
              onPress={() => setConsent((v) => !v)}
            />
            <Button
              title="Run live model"
              disabled={!consent || busy}
              onPress={() => void live()}
            />
            {busy && (
              <Button
                quiet
                title="Cancel live request"
                onPress={() => controller.current?.abort()}
              />
            )}
          </Card>
          {run && (
            <Card>
              <Label bold size={22}>
                Execution timeline · {run.mode} · {run.status}
              </Label>
              <Label muted>
                Measured event durations; events may complete within 0 ms. Local nodes are
                deterministic. No hidden model reasoning is displayed.
              </Label>
              <Row>
                <Button
                  quiet
                  title="Next event"
                  disabled={visible >= run.events.length}
                  onPress={() => setVisible((v) => v + 1)}
                />
                <Button
                  quiet
                  title="Show full trace"
                  onPress={() => setVisible(run.events.length)}
                />
              </Row>
              {run.events.slice(0, visible).map((event, i) => (
                <Card
                  key={i}
                  style={{ borderColor: event.status === 'error' ? '#c85b5b' : colors.line }}
                >
                  <Label bold>
                    {i + 1}. {event.stage}
                  </Label>
                  <Label muted>
                    {event.node} · {event.ms} ms · attempt {event.attempt} · {event.status}
                  </Label>
                  <Label selectable>{event.detail}</Label>
                </Card>
              ))}
              <Label bold>Result</Label>
              <Label selectable accessibilityLiveRegion="polite">
                {run.output || 'Paused before producing a final result.'}
              </Label>
              <Label muted>
                {run.mode === 'local-test'
                  ? 'Provider usage: 0 tokens · $0 provider cost'
                  : `Recorded usage: ${run.inputTokens ?? 'unknown'} input / ${run.outputTokens ?? 'unknown'} output tokens. Estimated cost: ${run.costUSD === undefined ? 'unavailable (no configured rates)' : `$${run.costUSD.toFixed(6)} from server-configured rates; not an invoice`}.`}
              </Label>
              {run.pending && (
                <>
                  <Label>
                    Review the pending action in the trace. Approval replays this deterministic
                    local workflow from its start with approvals scoped to the current configuration
                    and inputs. No external actions occur.
                  </Label>
                  <Row>
                    <Button
                      title="Approve local step"
                      onPress={() => {
                        const next = [...approvals, run.pending!];
                        setApprovals(next);
                        local(next);
                      }}
                    />
                    <Button
                      quiet
                      title="Deny and stop"
                      onPress={() =>
                        setRun({
                          ...run,
                          status: 'stopped',
                          pending: undefined,
                          output: 'Human denied the action. Nothing external was executed.',
                        })
                      }
                    />
                  </Row>
                </>
              )}
              <Button
                title="Save version with this run"
                disabled={corrupt || busy}
                onPress={save}
              />
            </Card>
          )}
        </>
      )}
      {tab === 'Engineering' && (
        <>
          <Card>
            <Label bold size={24}>
              OpenAI engineering tracks
            </Label>
            <Label>
              Responses API gives your server direct ownership of the tool loop. The Agents SDK
              supplies that loop and adds sessions, handoffs, guardrails, approval interruptions and
              tracing. Both require application-level authorization.
            </Label>
            <Label muted>
              Official pages checked 2026-10-16. Exports are separate retrieval/reviewer teaching
              projects, not an automatic translation of arbitrary workflow graphs. Add real source
              material to the exported settings before running.
            </Label>
            <Row>
              {(['typescript', 'python'] as const).map((l) => (
                <Button
                  key={l}
                  quiet
                  selected={language === l}
                  title={l}
                  onPress={() => setLanguage(l)}
                />
              ))}
            </Row>
            <Button
              title="Generate SDK example"
              onPress={() => guard(() => setCode(sdkExample(config, language, document)))}
            />
            {!!code && (
              <>
                <Button quiet title="Copy generated code" onPress={() => void copy(code)} />
                <Label selectable style={{ writingDirection: 'ltr', textAlign: 'left' }}>
                  {code}
                </Label>
              </>
            )}
          </Card>
          <Card>
            <Label bold>Responses API in this app</Label>
            <Label>
              The server validates the configuration, calls /v1/responses, validates each function
              name and its JSON arguments, runs only a registered tool, then returns its output
              using the original call_id. It preserves returned output items for the next call and
              enforces a three-turn limit. Partial, malformed, timeout and provider error results
              are not reported as success.
            </Label>
            <Label>
              To inspect the implementation: lib/agent-studio-runtime.ts and
              app/api/learning-mobile/agent-studio/route.ts. Compare the function schemas with the
              tool input checks.
            </Label>
          </Card>
          {DOCS.map(([title, url]) => (
            <Button
              key={url}
              quiet
              title={title}
              onPress={() =>
                void Linking.openURL(url).catch(() =>
                  setMessage('Could not open documentation. Check your connection.'),
                )
              }
            />
          ))}
        </>
      )}
      {tab === 'Security' && (
        <>
          {lessons.slice(6).map((l) => (
            <Card key={l.title}>
              <Label bold size={24}>
                {l.title}
              </Label>
              <Label>{l.body}</Label>
              <Label>{l.exercise}</Label>
            </Card>
          ))}
          <Card>
            <Label bold>Controls enforced by this Studio</Label>
            <Label>
              Server-only credentials · owner authentication · shared production rate limiting ·
              bounded request bodies · explicit data-sharing consent · no arbitrary code or URLs · a
              fixed tool registry · output and argument validation · model turn/token caps · request
              deadlines · live-mode kill switch.
            </Label>
            <Label>
              send_demo has no external implementation. A future real sending or order tool must add
              server-side resource authorization and an approval record bound to the exact actor,
              action and arguments. A client checkbox alone is insufficient.
            </Label>
            <Label>
              Production status: not deployed. A passing local test or successful provider call
              never changes this label automatically.
            </Label>
          </Card>
          <Button
            title="Practice a failure in the debugger"
            onPress={() => {
              setFault('always');
              invalidate();
              setTab('Debugger');
            }}
          />
        </>
      )}
      {tab === 'Portfolio' && (
        <>
          <Card>
            <Label bold size={24}>
              Versioned project portfolio
            </Label>
            <Label>
              Save an immutable local snapshot of the configuration, input, document and latest run.
              Reopening creates a working copy. Versions remain available; export a backup before
              clearing app data. Up to 100 versions fit this local archive.
            </Label>
            <Button title="Save current version" disabled={corrupt || busy} onPress={save} />
          </Card>
          {!versions.length && (
            <Label>No saved versions. Build, test and save your first agent.</Label>
          )}
          {[...versions].reverse().map((v, i) => (
            <Card key={v.id}>
              <Label bold>
                {v.config.name} · version {versions.length - i}
              </Label>
              <Label muted>
                {new Date(v.at).toLocaleString(state.language)} · {v.run ? v.run.mode : 'demo'} ·{' '}
                {v.run?.status || 'untested'} · not deployed
              </Label>
              <Label>{v.config.goal}</Label>
              {v.evaluations?.map((check) => (
                <Label key={check}>{check}</Label>
              ))}
              <Row>
                <Button
                  title={`Reopen version ${versions.length - i}`}
                  onPress={() => {
                    setConfig(v.config);
                    setInput(v.input);
                    setDocument(v.document);
                    invalidate();
                    setSelected(v.config.nodes[0]!.id);
                    setTab('Workflow');
                    setMessage(
                      'Saved version reopened as a working copy. Rerun before recording new evidence.',
                    );
                  }}
                />
                <Button
                  quiet
                  title={`Export version ${versions.length - i}`}
                  onPress={() =>
                    guard(() => {
                      const text = exportVersion(v);
                      setCode(text);
                      void copy(text);
                    })
                  }
                />
              </Row>
            </Card>
          ))}
          {!!code && (
            <Card>
              <Label bold>Export archive (JSON)</Label>
              <Label>
                Copy this archive to a .json file. It includes the graph, version evidence,
                TypeScript/Python code and README.
              </Label>
              <Label selectable>{code}</Label>
            </Card>
          )}
        </>
      )}
      <Button
        quiet
        title="Changes Made / Change History"
        onPress={() => router.push('/change-history' as never)}
      />
    </Page>
  );
}
function WorkflowGraph({
  config,
  zoom,
  selected,
  select,
}: {
  config: Config;
  zoom: number;
  selected: string;
  select: (id: string) => void;
}) {
  const { colors } = useSchool();
  const width = 520,
    height = config.nodes.length * 90 + 20;
  const y = (id: string) => config.nodes.findIndex((n) => n.id === id) * 90 + 40;
  return (
    <ScrollView horizontal accessibilityLabel="Zoomable workflow graph">
      <Svg width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`}>
        {config.nodes.flatMap((n) =>
          (['next', 'otherwise'] as const)
            .filter((edge) => n[edge])
            .map((edge) => (
              <Path
                key={n.id + edge}
                d={`M ${edge === 'next' ? 370 : 150} ${y(n.id)} C ${edge === 'next' ? 490 : 30} ${y(n.id)}, ${edge === 'next' ? 490 : 30} ${y(n[edge])}, ${edge === 'next' ? 370 : 150} ${y(n[edge])}`}
                stroke={edge === 'next' ? '#368c79' : '#ce8d3a'}
                strokeWidth={2}
                fill="none"
              />
            )),
        )}
        {config.nodes.map((n) => (
          <ViewlessNode
            key={n.id}
            node={n}
            y={y(n.id)}
            active={selected === n.id}
            fill={colors.card}
            text={colors.text}
            select={select}
          />
        ))}
      </Svg>
    </ScrollView>
  );
}
function ViewlessNode({
  node,
  y,
  active,
  fill,
  text,
  select,
}: {
  node: Step;
  y: number;
  active: boolean;
  fill: string;
  text: string;
  select: (id: string) => void;
}) {
  return (
    <>
      <Rect
        x={150}
        y={y - 27}
        width={220}
        height={54}
        rx={10}
        fill={fill}
        stroke={active ? '#368c79' : '#89939c'}
        strokeWidth={active ? 3 : 1}
        onPress={() => select(node.id)}
      />
      <SvgText
        x={260}
        y={y - 4}
        fill={text}
        fontSize={13}
        textAnchor="middle"
        onPress={() => select(node.id)}
      >
        {node.id} · {node.kind}
      </SvgText>
      <SvgText
        x={260}
        y={y + 15}
        fill={text}
        fontSize={10}
        textAnchor="middle"
        onPress={() => select(node.id)}
      >
        {node.label.slice(0, 32)}
      </SvgText>
    </>
  );
}
