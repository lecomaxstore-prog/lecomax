export type AgentConfig = {
  goal: string;
  tool: 'notes' | 'calculator';
  maxSteps: number;
  requireEvidence: boolean;
};
export const starterAgent: AgentConfig = {
  goal: 'Answer a study question using a permitted tool.',
  tool: 'notes',
  maxSteps: 3,
  requireEvidence: true,
};
export const studyNotes = [
  {
    topic: 'retrieval',
    text: 'Retrieval practice means trying to recall an answer before looking at it.',
  },
  { topic: 'spacing', text: 'Spaced practice revisits a topic across separate study sessions.' },
  {
    topic: 'agent',
    text: 'An agent workflow chooses an allowed tool, observes its result, and checks a stopping condition.',
  },
];
export function readAgent(raw?: string): AgentConfig {
  if (!raw) return { ...starterAgent };
  const a = JSON.parse(raw) as AgentConfig;
  if (
    !a ||
    typeof a.goal !== 'string' ||
    !a.goal.trim() ||
    a.goal.length > 500 ||
    !['notes', 'calculator'].includes(a.tool) ||
    !Number.isInteger(a.maxSteps) ||
    a.maxSteps < 1 ||
    a.maxSteps > 4 ||
    typeof a.requireEvidence !== 'boolean'
  )
    throw new Error('Invalid agent configuration');
  return { goal: a.goal, tool: a.tool, maxSteps: a.maxSteps, requireEvidence: a.requireEvidence };
}
export function runAgent(config: AgentConfig, input: string) {
  readAgent(JSON.stringify(config));
  const trace: { stage: string; detail: string }[] = [
    { stage: 'Plan', detail: `Use ${config.tool}; at most ${config.maxSteps} steps.` },
  ];
  if (config.maxSteps < 2)
    return { trace, answer: 'Stopped before tool use: increase the step budget.', grounded: false };
  let result = '';
  if (config.tool === 'notes') {
    const note = studyNotes.find((n) => input.toLowerCase().includes(n.topic));
    result = note ? `[${note.topic}] ${note.text}` : '';
  } else {
    // A deliberately bounded arithmetic tool: no eval, network, shell, or generated code.
    const match = input
      .trim()
      .match(/^(-?\d{1,8}(?:\.\d{1,6})?)\s*([+*\/-])\s*(-?\d{1,8}(?:\.\d{1,6})?)$/);
    if (match) {
      const a = Number(match[1]),
        b = Number(match[3]);
      const value =
        match[2] === '+'
          ? a + b
          : match[2] === '-'
            ? a - b
            : match[2] === '*'
              ? a * b
              : b === 0
                ? NaN
                : a / b;
      if (Number.isFinite(value)) result = `${input.trim()} = ${value}`;
    }
  }
  trace.push({ stage: 'Observe', detail: result || 'No supported evidence returned by the tool.' });
  if (config.maxSteps < 3)
    return { trace, answer: 'Stopped before verification: use at least 3 steps.', grounded: false };
  trace.push({
    stage: 'Verify',
    detail: result
      ? 'Answer is directly supported by this tool result.'
      : 'No supported answer. Ask for a supported input.',
  });
  return {
    trace,
    answer:
      result ||
      (config.requireEvidence
        ? 'I do not have evidence for this question. Try retrieval, spacing, agent, or switch tools.'
        : 'No tool result. Disabling the evidence check does not make an answer reliable.'),
    grounded: !!result,
  };
}
