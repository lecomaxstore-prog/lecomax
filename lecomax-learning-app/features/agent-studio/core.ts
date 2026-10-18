import { calculate } from '../ai-university/engine';
import { chunkDocument, retrieve } from '../ai-university/retrieval';

export const TOOL_IDS = [
  'retrieve',
  'calculator',
  'plan',
  'product',
  'review',
  'send_demo',
] as const;
export type ToolId = (typeof TOOL_IDS)[number];
export const NODE_KINDS = [
  'decision',
  'tool',
  'condition',
  'approval',
  'handoff',
  'result',
  'error',
] as const;
export type NodeKind = (typeof NODE_KINDS)[number];
export type Step = {
  id: string;
  label: string;
  kind: NodeKind;
  tool: ToolId;
  next: string;
  otherwise: string;
};
export type Config = {
  id: string;
  name: string;
  goal: string;
  information: string;
  inputContract: string;
  outputContract: string;
  approvalTools: ToolId[];
  stop: string;
  maxSteps: number;
  tools: ToolId[];
  nodes: Step[];
};
export type Event = {
  node: string;
  stage: string;
  detail: string;
  ms: number;
  status: 'ok' | 'error' | 'paused';
  attempt: number;
};
export type Run = {
  mode: 'local-test' | 'live';
  status: 'complete' | 'failed' | 'approval' | 'stopped';
  events: Event[];
  output: string;
  pending?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUSD?: number;
};
export type Version = {
  id: string;
  at: string;
  config: Config;
  input: string;
  document: string;
  run: Run | null;
  evaluations?: string[];
};
export const STUDIO_KEY = 'agent-studio.v2';
export const toolDescriptions: Record<ToolId, string> = {
  retrieve: 'Search supplied text and return numbered passages. No internet browsing.',
  calculator: 'Two numbers and one arithmetic operator. No eval or code execution.',
  plan: 'Turn semicolon-separated tasks into an ordered checklist.',
  product: 'Format supplied product facts into a draft; no invented specifications.',
  review: 'Check the previous output for source labels and unsupported absolute claims.',
  send_demo: 'Simulate sending a draft after approval. Never sends a real message.',
};
export function validateConfig(value: unknown): Config {
  const c = value as Config;
  if (!c || typeof c !== 'object') throw Error('Configuration must be an object.');
  for (const key of [
    'id',
    'name',
    'goal',
    'information',
    'inputContract',
    'outputContract',
    'stop',
  ] as const)
    if (
      typeof c[key] !== 'string' ||
      !c[key].trim() ||
      c[key].length > (key === 'information' ? 12000 : 1000)
    )
      throw Error(`Add a valid ${key} (within its text limit).`);
  if (!Number.isInteger(c.maxSteps) || c.maxSteps < 1 || c.maxSteps > 20)
    throw Error('Step budget must be 1–20.');
  for (const list of [c.tools, c.approvalTools])
    if (
      !Array.isArray(list) ||
      list.length > 6 ||
      new Set(list).size !== list.length ||
      list.some((t) => !TOOL_IDS.includes(t))
    )
      throw Error('Choose only the permitted tools.');
  if (!Array.isArray(c.nodes) || !c.nodes.length || c.nodes.length > 16)
    throw Error('A workflow needs 1–16 nodes.');
  const ids = new Set(c.nodes.map((n) => n?.id));
  if (ids.size !== c.nodes.length) throw Error('Node IDs must be unique.');
  for (const n of c.nodes) {
    if (
      !n ||
      !/^n[0-9]+$/.test(n.id) ||
      typeof n.label !== 'string' ||
      !n.label.trim() ||
      n.label.length > 120 ||
      !NODE_KINDS.includes(n.kind) ||
      !TOOL_IDS.includes(n.tool)
    )
      throw Error('Invalid node.');
    for (const edge of [n.next, n.otherwise])
      if (typeof edge !== 'string' || (edge && !ids.has(edge)))
        throw Error(`Broken connection from ${n.id}.`);
    if (n.kind === 'tool' && !c.tools.includes(n.tool))
      throw Error(`Permit ${n.tool} or remove its tool node.`);
  }
  return JSON.parse(JSON.stringify(c));
}
export function buildWorkflow(c: Config): Config {
  if (!c.tools.length) throw Error('Choose at least one tool before generating a workflow.');
  const finalId = `n${c.tools.length + 4}`,
    errorId = `n${c.tools.length + 5}`;
  const nodes: Step[] = [
    {
      id: 'n1',
      label: 'Read request and choose next step',
      kind: 'decision',
      tool: c.tools[0]!,
      next: 'n2',
      otherwise: errorId,
    },
  ];
  c.tools.forEach((tool, i) =>
    nodes.push({
      id: `n${i + 2}`,
      label: `Run ${tool}`,
      kind: 'tool',
      tool,
      next: `n${i + 3}`,
      otherwise: errorId,
    }),
  );
  nodes.push(
    {
      id: `n${c.tools.length + 2}`,
      label: 'Check for useful output',
      kind: 'condition',
      tool: c.tools[0]!,
      next: `n${c.tools.length + 3}`,
      otherwise: errorId,
    },
    {
      id: `n${c.tools.length + 3}`,
      label: 'Review final output',
      kind: 'approval',
      tool: c.tools[0]!,
      next: finalId,
      otherwise: errorId,
    },
    {
      id: finalId,
      label: 'Return result',
      kind: 'result',
      tool: c.tools[0]!,
      next: '',
      otherwise: '',
    },
    {
      id: errorId,
      label: 'Stop and explain failure',
      kind: 'error',
      tool: c.tools[0]!,
      next: '',
      otherwise: '',
    },
  );
  return validateConfig({ ...c, nodes });
}
export function retrievalSources(input: string, document: string) {
  return retrieve(input.slice(0, 500), chunkDocument(document));
}
export function executeTool(tool: ToolId, input: string, document: string, previous = ''): string {
  if (
    typeof input !== 'string' ||
    input.length > 1000 ||
    typeof document !== 'string' ||
    document.length > 12000 ||
    previous.length > 16000
  )
    throw Error('Tool input exceeds the allowed size.');
  if (tool === 'retrieve') {
    const hits = retrievalSources(input, document);
    return hits.map((h) => `[${h.id}] ${h.text}`).join('\n');
  }
  if (tool === 'calculator') {
    const value = calculate(input);
    if (value === null)
      throw Error('Use two numbers and +, -, * or /. Division by zero is invalid.');
    return String(value);
  }
  if (tool === 'plan')
    return input
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');
  if (tool === 'product')
    return `Product draft — supplied facts only:\n${input}\nReview accuracy and tone before publishing.`;
  if (tool === 'review')
    return previous
      ? `Reviewer: ${/\[source-\d+\]/.test(previous) ? 'Source labels found; manually verify entailment.' : 'No source labels; add evidence before relying on factual claims.'}${/always|guaranteed|100%/i.test(previous) ? ' Check absolute claims.' : ''}\nDraft:\n${previous}`
      : '';
  if (tool === 'send_demo')
    return `SIMULATION ONLY — nothing was sent. Draft:\n${previous || input}`;
  throw Error('Tool is not permitted.');
}
export function runLocal(
  value: Config,
  input: string,
  document: string,
  approvals: string[] = [],
  fault: 'none' | 'once' | 'always' = 'none',
): Run {
  const c = validateConfig(value);
  if (!input.trim() || input.length > 1000 || document.length > 12000)
    throw Error('Enter 1–1,000 input characters and at most 12,000 document characters.');
  const run: Run = {
    mode: 'local-test',
    status: 'stopped',
    events: [
      { node: 'request', stage: 'User request', detail: input, ms: 0, status: 'ok', attempt: 1 },
    ],
    output: '',
  };
  let cursor = c.nodes[0]!.id,
    last = '',
    injected = false;
  const add = (
    n: Step,
    stage: string,
    detail: string,
    start: number,
    status: Event['status'] = 'ok',
    attempt = 1,
  ) =>
    run.events.push({
      node: n.id,
      stage,
      detail,
      ms: Math.max(0, Date.now() - start),
      status,
      attempt,
    });
  for (let turn = 0; cursor && turn < c.maxSteps; turn++) {
    const n = c.nodes.find((n) => n.id === cursor)!;
    const start = Date.now();
    if (
      n.kind === 'approval' ||
      (n.kind === 'tool' && (n.tool === 'send_demo' || c.approvalTools.includes(n.tool)))
    ) {
      if (!approvals.includes(n.id)) {
        add(
          n,
          'Approval required',
          `Review this ${n.kind === 'tool' ? n.tool : 'next-step'} action. Input: ${input}\nCurrent result: ${last || '(none)'}`,
          start,
          'paused',
        );
        return { ...run, status: 'approval', pending: n.id, output: last };
      }
      add(
        n,
        'Approval granted',
        'Approved for this local run only. External actions remain simulated.',
        start,
      );
    }
    try {
      if (n.kind === 'tool') {
        add(
          n,
          'Tool call',
          `${n.tool}(${JSON.stringify({ input, documentCharacters: document.length })})`,
          start,
        );
        let result = '';
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            if (fault === 'always' || (fault === 'once' && !injected)) {
              injected = true;
              throw Error('Injected tool outage for debugging.');
            }
            result = executeTool(n.tool, input, document, last);
            break;
          } catch (e) {
            add(
              n,
              attempt === 1 ? 'Retry' : 'Tool failed',
              e instanceof Error ? e.message : 'Tool error',
              start,
              'error',
              attempt,
            );
            if (attempt === 2) throw e;
          }
        }
        last = result;
        add(n, 'Tool result', last || 'No matching evidence.', start);
      } else if (n.kind === 'condition') {
        add(
          n,
          'Condition',
          last
            ? 'Evidence/output exists → success connection.'
            : 'No evidence/output → alternate connection.',
          start,
        );
        cursor = last ? n.next : n.otherwise;
        continue;
      } else if (n.kind === 'result') {
        add(
          n,
          'Final result',
          last || 'No supported output. Add a tool and evidence.',
          start,
          last ? 'ok' : 'error',
        );
        return {
          ...run,
          status: last ? 'complete' : 'failed',
          output: last || 'No supported output.',
        };
      } else if (n.kind === 'error') {
        add(
          n,
          'Stopped safely',
          'Check the input, tool permissions and evidence. Follow the tool error above.',
          start,
          'error',
        );
        return { ...run, status: 'failed', output: 'Workflow stopped on its error branch.' };
      } else
        add(
          n,
          n.kind === 'handoff'
            ? 'Specialist handoff (simulation)'
            : n.kind === 'decision'
              ? 'Agent decision (rule-based simulation)'
              : 'Continue',
          n.kind === 'handoff'
            ? `${n.label}: control follows the configured connection; no second model was called.`
            : `${n.label}. Follow the configured next step.`,
          start,
        );
      cursor = n.next;
    } catch {
      cursor = n.otherwise;
      if (!cursor)
        return {
          ...run,
          status: 'failed',
          output: 'Tool failed after one bounded retry. Fix the input or tool and start a new run.',
        };
    }
  }
  return {
    ...run,
    output: cursor
      ? 'Step budget reached. Inspect cycles or increase the budget.'
      : 'Reached an unconnected step. Connect it to a result or error node.',
  };
}
export function readVersions(raw?: string): Version[] {
  if (!raw) return [];
  const v = JSON.parse(raw) as Version[];
  if (!Array.isArray(v) || v.length > 100) throw Error('Portfolio archive is invalid or full.');
  const ids = new Set<string>();
  for (const x of v) {
    if (
      !x ||
      typeof x.id !== 'string' ||
      ids.has(x.id) ||
      !Number.isFinite(Date.parse(x.at)) ||
      typeof x.input !== 'string' ||
      x.input.length > 1000 ||
      typeof x.document !== 'string' ||
      x.document.length > 12000
    )
      throw Error('Invalid saved version.');
    ids.add(x.id);
    validateConfig(x.config);
    if (
      x.evaluations !== undefined &&
      (!Array.isArray(x.evaluations) ||
        x.evaluations.length > 20 ||
        x.evaluations.some((v) => typeof v !== 'string' || v.length > 1000))
    )
      throw Error('Invalid evaluations.');
    if (
      x.run !== null &&
      (!x.run ||
        !['local-test', 'live'].includes(x.run.mode) ||
        !['complete', 'failed', 'approval', 'stopped'].includes(x.run.status) ||
        typeof x.run.output !== 'string' ||
        !Array.isArray(x.run.events))
    )
      throw Error('Invalid run evidence.');
  }
  return v;
}
export function appendVersion(raw: string | undefined, version: Version) {
  const versions = readVersions(raw);
  return JSON.stringify(readVersions(JSON.stringify([...versions, version])));
}
