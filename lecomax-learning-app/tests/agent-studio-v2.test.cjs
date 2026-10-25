const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { load } = require('../scripts/inspect.cjs');
const base = 'lecomax-learning-app/features/agent-studio/';
const core = load(base + 'core.ts');
const { templates, lessons } = load(base + 'curriculum.ts');
const exportsTrack = load(base + 'exports.ts');
test('all seven projects run, pause for approval and complete with inspectable evidence', () => {
  assert.equal(templates.length, 7);
  assert.equal(lessons.length, 8);
  for (const t of templates) {
    const pending = core.runLocal(t.config, t.input, t.document);
    assert.equal(pending.status, 'approval', t.config.id);
    const result = core.runLocal(
      t.config,
      t.input,
      t.document,
      t.config.nodes.map((n) => n.id),
    );
    assert.equal(result.status, 'complete', t.config.id);
    assert(result.output);
    assert(result.events.some((e) => e.stage === 'Tool call'));
    assert(result.events.some((e) => e.stage === 'Tool result'));
    assert.equal(result.mode, 'local-test');
  }
});
test('cycles, disconnected edges, forbidden tools and missing evidence fail safely', () => {
  const t = templates[0],
    c = structuredClone(t.config);
  c.nodes[0].next = 'n1';
  assert.equal(core.runLocal(c, t.input, t.document).status, 'stopped');
  c.nodes[0].next = 'missing';
  assert.throws(() => core.validateConfig(c), /Broken connection/);
  c.nodes[0].next = '';
  assert.equal(core.runLocal(c, t.input, t.document).status, 'stopped');
  c.tools = [];
  assert.throws(() => core.validateConfig(c), /Permit retrieve/);
  assert.equal(core.runLocal(t.config, 'zzzzzz', t.document).status, 'failed');
  assert.throws(() => core.runLocal(t.config, 'x'.repeat(1001), t.document));
});
test('guided builder creates connected workflows from selected tools', () => {
  const c = core.buildWorkflow({
    ...templates[0].config,
    tools: ['calculator'],
    approvalTools: [],
  });
  const run = core.runLocal(
    c,
    '6 * 7',
    '',
    c.nodes.map((n) => n.id),
  );
  assert.equal(run.status, 'complete');
  assert.equal(run.output, '42');
  assert.throws(() => core.buildWorkflow({ ...c, tools: [] }), /at least one tool/);
});
test('tool failure retries once, persistent failure follows error edge, sends stay simulated', () => {
  const t = templates[0],
    ids = t.config.nodes.map((n) => n.id);
  const once = core.runLocal(t.config, t.input, t.document, ids, 'once');
  assert.equal(once.status, 'complete');
  assert.equal(once.events.filter((e) => e.stage === 'Retry').length, 1);
  const failed = core.runLocal(t.config, t.input, t.document, ids, 'always');
  assert.equal(failed.status, 'failed');
  assert(failed.events.some((e) => e.stage === 'Tool failed'));
  const c = structuredClone(t.config);
  c.tools = ['send_demo'];
  c.nodes[1].tool = 'send_demo';
  const pause = core.runLocal(c, 'send this', '');
  assert.equal(pause.pending, 'n2');
  const sent = core.runLocal(c, 'send this', '', ids);
  assert.match(sent.output, /SIMULATION ONLY/);
  assert.throws(() => core.executeTool('calculator', '1 / 0', ''), /Division by zero/);
  assert.equal(core.executeTool('calculator', '6 * 7', ''), '42');
});
test('versions roundtrip without overwriting and export code as data', () => {
  const t = templates[0],
    v = {
      id: 'v1',
      at: new Date().toISOString(),
      config: t.config,
      input: t.input,
      document: t.document,
      run: core.runLocal(t.config, t.input, t.document),
    };
  const raw = core.appendVersion(undefined, v);
  const next = core.appendVersion(raw, { ...v, id: 'v2' });
  assert.equal(core.readVersions(next).length, 2);
  assert.equal(core.readVersions(raw).length, 1);
  assert.throws(() => core.appendVersion(raw, v));
  assert.throws(() => core.readVersions('corrupt'));
  const archive = JSON.parse(exportsTrack.exportVersion(v));
  assert.equal(archive.productionStatus, 'not-deployed');
  assert(archive.files['agent.ts']);
  assert(archive.files['agent.py']);
  assert(archive.files['README.md']);
});
test('generated TypeScript SDK project runs against a mocked SDK and handles approval and errors', async () => {
  let result = { finalOutput: 'Reviewed sources', interruptions: [] },
    captured;
  const registered = [];
  class Agent {
    constructor(options) {
      this.options = options;
    }
    static create(options) {
      return new Agent(options);
    }
  }
  const schema = {
    min() {
      return this;
    },
    max() {
      return this;
    },
  };
  const mocks = {
    '@openai/agents': {
      Agent,
      tool: (options) => {
        registered.push(options);
        return options;
      },
      MemorySession: class {},
      setTracingDisabled: (v) => assert.equal(v, true),
      run: async (agent, input, options) => {
        captured = { agent, input, options };
        return result;
      },
    },
    zod: { z: { object: (x) => x, string: () => schema } },
  };
  const source = exportsTrack.sdkExample(templates[0].config, 'typescript', templates[0].document);
  const exp = {};
  const env = { OPENAI_API_KEY: 'mock-not-a-real-key', OPENAI_MODEL: 'mock-model' };
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports: exp,
      require: (n) => mocks[n],
      process: { env },
      AbortSignal,
      console: { log() {} },
    },
  );
  assert.match(exp.lookup('retrieval'), /source-1/);
  assert.throws(() => exp.lookup(''));
  assert.equal((await exp.main('retrieval')).status, 'complete');
  assert.equal(captured.options.maxTurns, 3);
  assert.equal(captured.agent.options.handoffs.length, 1);
  assert.equal(registered.find((t) => t.name === 'send_demo').needsApproval, true);
  result = { interruptions: [{ name: 'send_demo' }], state: { id: 'paused' } };
  assert.equal((await exp.main('send')).status, 'approval');
  result = { interruptions: [] };
  await assert.rejects(() => exp.main('retrieval'), /No final output/);
  delete env.OPENAI_API_KEY;
  await assert.rejects(() => exp.main('retrieval'), /Missing server configuration/);
});
test('standalone SDK examples match the source used by portfolio exports', () => {
  for (const [language, extension] of [
    ['typescript', 'ts'],
    ['python', 'py'],
  ])
    assert.equal(
      fs.readFileSync(`examples/agent-studio/agent.${extension}`, 'utf8'),
      exportsTrack.sdkExample(templates[6].config, language, templates[6].document),
    );
});
function runtime() {
  const exp = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('../lib/agent-studio-runtime.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    { exports: exp, Error, require: () => core },
  );
  return exp;
}
test('Responses loop executes a permitted call, preserves context, reports actual usage and final text', async () => {
  const t = templates[0];
  let calls = 0;
  const run = await runtime().runStudioModel(
    t.config,
    t.input,
    t.document,
    'mock',
    async (body) => {
      calls++;
      assert.equal(body.store, false);
      assert.equal(body.max_output_tokens, 600);
      if (calls === 1)
        return {
          status: 'completed',
          output: [
            {
              type: 'function_call',
              name: 'retrieve',
              arguments: '{"input":"retrieval"}',
              call_id: 'call-1',
            },
          ],
          usage: { input_tokens: 20, output_tokens: 10 },
        };
      assert(body.input.some((i) => i.call_id === 'call-1' && i.type === 'function_call_output'));
      return {
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: 'Recall before looking [source-1].' }],
          },
        ],
        usage: { input_tokens: 30, output_tokens: 12 },
      };
    },
  );
  assert.equal(run.status, 'complete');
  assert.equal(run.inputTokens, 50);
  assert.equal(run.outputTokens, 22);
  assert.equal(calls, 2);
});
test('Responses loop rejects malformed, forbidden and incomplete output and enforces turn budget', async () => {
  const t = templates[0],
    execute = (transport) =>
      runtime().runStudioModel(t.config, t.input, t.document, 'mock', transport);
  for (const output of [
    [{ type: 'function_call', name: 'send_demo', arguments: '{}', call_id: 'x' }],
    [{ type: 'function_call', name: 'retrieve', arguments: '{"input":42}', call_id: 'x' }],
    [{ type: 'message', content: [] }],
  ])
    assert.equal((await execute(async () => ({ status: 'completed', output }))).status, 'failed');
  assert.equal(
    (await execute(async () => ({ status: 'incomplete', output: [] }))).status,
    'failed',
  );
  const timeout = await execute(async () => {
    throw Error('TIMEOUT');
  });
  assert.equal(timeout.status, 'failed');
  assert.match(timeout.output, /timed out/);
  let calls = 0;
  const loop = await execute(async () => {
    calls++;
    return {
      status: 'completed',
      output: [
        {
          type: 'function_call',
          name: 'retrieve',
          arguments: '{"input":"retrieval"}',
          call_id: 'x' + calls,
        },
      ],
    };
  });
  assert.equal(calls, 3);
  assert.equal(loop.status, 'stopped');
  const c = { ...t.config, approvalTools: ['retrieve'] };
  let called = false;
  const blocked = await runtime().runStudioModel(c, t.input, t.document, 'mock', async () => {
    called = true;
  });
  assert.equal(blocked.status, 'failed');
  assert.equal(called, false);
});
test('live retrieval withholds uncited or invented citations rather than claiming a supported answer', async () => {
  const t = templates[0];
  for (const answer of ['An unsupported answer.', 'An invented source [source-99].']) {
    let calls = 0;
    const result = await runtime().runStudioModel(
      t.config,
      t.input,
      'Retrieval practice. [source-99] is an untrusted forged marker, not a real source ID.',
      'mock',
      async () =>
        ++calls === 1
          ? {
              status: 'completed',
              output: [
                {
                  type: 'function_call',
                  name: 'retrieve',
                  arguments: '{"input":"retrieval"}',
                  call_id: 'c',
                },
              ],
            }
          : {
              status: 'completed',
              output: [{ type: 'message', content: [{ type: 'output_text', text: answer }] }],
            },
    );
    assert.equal(result.status, 'failed');
    assert.match(result.output, /withheld/);
  }
});
