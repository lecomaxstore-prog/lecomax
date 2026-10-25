import type { Config, Step, ToolId } from './core';
export const DOCS = [
  ['Responses function calling', 'https://developers.openai.com/api/docs/guides/function-calling'],
  ['Agents SDK quickstart', 'https://developers.openai.com/api/docs/guides/agents/quickstart'],
  ['State and sessions', 'https://developers.openai.com/api/docs/guides/agents/running-agents'],
  [
    'Handoffs and orchestration',
    'https://developers.openai.com/api/docs/guides/agents/orchestration',
  ],
  [
    'Guardrails and human approvals',
    'https://developers.openai.com/api/docs/guides/agents/guardrails-approvals',
  ],
  [
    'Tracing and observability',
    'https://developers.openai.com/api/docs/guides/agents/integrations-observability',
  ],
] as const;
export const lessons = [
  {
    title: '01 / Understand the agent',
    body: 'A chatbot generates conversational replies. A deterministic automation follows rules written by a developer. A tool-using agent lets a model choose permitted actions, observe results and decide whether to continue. A chat interface can contain any of these systems. Autonomy is bounded by permissions and stop rules, not by the appearance of intelligence.',
    exercise:
      'Run the Study Tutor template. Find the decision, tool call, returned evidence and final result in the debugger. The local decision is scripted; the opt-in server run uses a real model.',
    question: 'Which part makes a tool-using agent different from a fixed automation?',
    choices: [
      'The model can choose the next permitted action',
      'A chat bubble',
      'An unlimited loop',
    ],
    answer: 0,
  },
  {
    title: '02 / Design a contract',
    body: 'The model predicts an action or response. System instructions define its task. Input is the user request. Tools expose narrow capabilities. Memory stores selected context. The control loop enforces budgets and consumes observations. Decisions should be explained through observable actions and concise reasons, not hidden chain-of-thought. The final result must satisfy the output contract.',
    exercise:
      'Use all six builder steps. Specify evidence, allowed tools, input and output, approvals and a stop rule. A descriptive stop rule guides the model; the numeric step budget is enforced in code.',
    question: 'Where should tool permissions be enforced?',
    choices: [
      'Only inside a prompt',
      'In application code at the tool boundary',
      'By the tool output itself',
    ],
    answer: 1,
  },
  {
    title: '03 / Connect a workflow',
    body: 'The editor uses named steps and explicit connections. Tool success follows Next; failure follows Alternate. A condition checks whether the previous result is nonempty. An approval pauses. A result or error terminates. Handoffs in the local graph simulate specialist ownership. Cycles are allowed for experimentation but the step budget always stops them.',
    exercise:
      'Connect a retrieval node to a condition, then route missing evidence to an error. Remove a connection, run, and inspect why the workflow stops.',
    question: 'What prevents a cycle from running forever?',
    choices: ['A pretty diagram', 'The enforced step budget', 'The name of the agent'],
    answer: 1,
  },
  {
    title: '04 / Use the Responses API',
    body: 'Send instructions, input and strict function schemas to the Responses API. Inspect function_call outputs. Validate names and arguments before dispatching a tool. Send function_call_output with the matching call_id and preserve response context, including reasoning items when using manual replay. Repeat within a budget until a final answer. A tool schema describes a function; your server still implements and authorizes it.',
    exercise:
      'Inspect the live timeline. Compare the model-selected tool with the local graph. Live mode is a separate bounded tool loop and does not execute your graph connections.',
    question: 'Who executes your custom function tool?',
    choices: [
      'The schema automatically',
      'Your application after validation',
      'The mobile API key',
    ],
    answer: 1,
  },
  {
    title: '05 / Learn the Agents SDK',
    body: 'TypeScript uses Agent, tool and run; Python uses Agent, function_tool and Runner. The SDK runs the loop in your application. A handoff transfers conversation ownership; an agent-as-tool returns work to a manager. Guardrails check inputs, outputs or tools. Human approvals pause a run and resume the same saved state. Sessions manage conversational history; scope them to the authenticated user and apply retention rules.',
    exercise:
      'Export the TypeScript and Python SDK tracks. Trace the retrieval function, reviewer handoff and blocking length guardrail. The examples print pending approvals and stop; they never approve an action automatically.',
    question: 'How should an approval pause continue?',
    choices: [
      'Start an unrelated turn',
      'Approve or reject the exact interruption, then resume its state',
      'Disable guardrails',
    ],
    answer: 1,
  },
  {
    title: '06 / Debug and evaluate',
    body: 'A trace records observable events, tool inputs, results, errors, attempts and measured elapsed time. It is not private model reasoning. A failed API request must stay failed. Usage is shown only when returned by the provider. Cost is unknown unless server-side rates are configured; a rate-based estimate is not an invoice. A successful local test is evidence about one case, not production readiness.',
    exercise:
      'Inject one tool failure and then a permanent failure. Compare retry and error branches. Run the evaluation suite, save a version, change a tool and test again.',
    question: 'What does a local PASS prove?',
    choices: [
      'The agent is deployed',
      'That particular local test passed',
      'All future inputs will succeed',
    ],
    answer: 1,
  },
  {
    title: '07 / Secure the boundary',
    body: 'Keep keys in server environment variables. Authenticate callers and authorize each resource independently. Treat documents and tool results as untrusted data: they cannot grant permissions. Allowlist tools, bound inputs and outputs, set timeouts, and deny arbitrary URLs, shell commands and generated code. Prompt-injection filters alone are insufficient; capability limits enforce the boundary. Do not paste private customer data into learning projects.',
    exercise:
      'Try an instruction in the evidence asking the agent to send a message. The live tool list never contains a sending capability. The local sending tool can only produce a labeled simulation.',
    question: 'Can retrieved text authorize a refund?',
    choices: [
      'Yes, if it sounds official',
      'No, authorization must come from trusted application policy',
      'Yes, after repeating it',
    ],
    answer: 1,
  },
  {
    title: '08 / Prepare for production',
    body: 'Use representative evaluation sets: known answers, no evidence, malformed arguments, injection attempts, forbidden tools, timeouts, rejected approvals and cross-user access. Measure quality, latency and cost. Set provider project budgets and alerts, server rate limits, per-run token/turn caps and a kill switch. Before staging, add durable audit records, data deletion, least-privilege credentials and resource-level authorization. Deploy only after review and monitoring are ready.',
    exercise:
      'Export a version and its test evidence. Explain one failure and the correction. This Studio does not certify or deploy projects; every portfolio version states demo, local test or live test, with production status explicitly not deployed.',
    question: 'What belongs in the mobile client?',
    choices: [
      'Provider credentials',
      'A scoped login token for your backend',
      'A database administrator key',
    ],
    answer: 1,
  },
];
export type Template = { config: Config; input: string; document: string; challenge: string };
function template(
  id: string,
  name: string,
  goal: string,
  tool: ToolId,
  input: string,
  document: string,
  challenge: string,
  team = false,
): Template {
  const nodes: Step[] = [
    {
      id: 'n1',
      label: 'Read request and choose next step',
      kind: 'decision',
      tool,
      next: 'n2',
      otherwise: 'n6',
    },
    {
      id: 'n2',
      label: 'Gather or transform evidence',
      kind: 'tool',
      tool,
      next: 'n3',
      otherwise: 'n6',
    },
    {
      id: 'n3',
      label: 'Is there a useful result?',
      kind: 'condition',
      tool,
      next: team ? 'n7' : 'n4',
      otherwise: 'n6',
    },
    { id: 'n4', label: 'Human review', kind: 'approval', tool, next: 'n5', otherwise: 'n6' },
    { id: 'n5', label: 'Return the result', kind: 'result', tool, next: '', otherwise: '' },
    { id: 'n6', label: 'Explain the failure', kind: 'error', tool, next: '', otherwise: '' },
  ];
  if (team)
    nodes.push(
      {
        id: 'n7',
        label: 'Researcher → reviewer',
        kind: 'handoff',
        tool: 'review',
        next: 'n8',
        otherwise: 'n6',
      },
      {
        id: 'n8',
        label: 'Review source coverage',
        kind: 'tool',
        tool: 'review',
        next: 'n4',
        otherwise: 'n6',
      },
    );
  return {
    config: {
      id,
      name,
      goal,
      information:
        'Use only the supplied learning document or facts. Do not invent missing details.',
      inputContract: 'A nonempty text request, at most 1,000 characters.',
      outputContract:
        'A concise result supported by the tool output; acknowledge missing evidence.',
      approvalTools: [],
      stop: 'Stop after the final answer, missing evidence, denial, an error or the step budget.',
      maxSteps: 12,
      tools: team ? [tool, 'review'] : [tool],
      nodes,
    },
    input,
    document,
    challenge,
  };
}
export const templates: Template[] = [
  template(
    'study',
    'Study Tutor Agent',
    'Explain a study concept with evidence and a question for the learner.',
    'retrieve',
    'What is retrieval practice?',
    'Retrieval practice means recalling an answer before looking at it. Spaced practice revisits a topic after a delay.',
    'Remove the word retrieval and observe whether evidence is still relevant.',
  ),
  template(
    'support',
    'E-Commerce Customer Support Agent',
    'Answer policy questions using synthetic store policies; never access real orders or promise refunds.',
    'retrieve',
    'What is the returns window?',
    'DEMO STORE POLICY: Returns are accepted within 14 days with a receipt. Shipping takes 3 business days. This is synthetic training data, not the real store policy.',
    'Ask for an order cancellation. Explain why policy retrieval cannot cancel orders.',
  ),
  template(
    'product',
    'Product Description Assistant',
    'Draft a product description from supplied facts and require editorial review.',
    'product',
    'Canvas tote; 100% cotton; 12 litre capacity; navy',
    'Use only the user-supplied specifications. Never invent certifications or warranties.',
    'Add a send_demo tool and observe its mandatory approval.',
  ),
  template(
    'research',
    'Research Agent with sources',
    'Find relevant passages in a supplied research corpus and cite their source IDs.',
    'retrieve',
    'What does the agent loop do?',
    'Source: https://developers.openai.com/api/docs/guides/agents/running-agents\nThe agent loop calls a model, executes permitted tools, observes results and stops on a final answer or budget.\nSource: https://developers.openai.com/api/docs/guides/agents/orchestration\nHandoffs transfer ownership to a specialist.',
    'This is corpus research, not live web search. Replace the corpus and compare evidence.',
  ),
  template(
    'planner',
    'Personal Task Planning Agent',
    'Organize tasks into a checklist without creating calendar events.',
    'plan',
    'Read the lesson; build a small agent; test a failure; explain the trace',
    'Only the supplied tasks are available. No calendar or personal account is connected.',
    'Reorder the input tasks and explain why a deterministic formatter is not autonomous planning.',
  ),
  template(
    'document',
    'Document Q&A Agent',
    'Answer a question using retrieved document passages and state uncertainty.',
    'retrieve',
    'How long is shipping?',
    'Shipping takes 3 business days. Returns require a receipt within 14 days.',
    'Ask an unrelated question and inspect the missing-evidence branch.',
  ),
  template(
    'team',
    'Multi-Agent Research and Review Team',
    'Gather source evidence, then review support for claims before the final answer.',
    'retrieve',
    'How do handoffs work?',
    'Source: https://developers.openai.com/api/docs/guides/agents/orchestration\nHandoffs transfer conversation ownership to a specialist. Agents as tools return their work to a manager.',
    'Compare the simulated role handoff with the exported SDK handoff. A label alone is not a second model.',
    true,
  ),
];
