# Agent Studio SDK tracks

These are server-only teaching examples exported from the Research and Review project. They demonstrate retrieval, a reviewer handoff, input guardrails, session state and an approval-gated **simulated** sending tool. They are separate SDK projects, not a compiler for arbitrary editor graphs.

## TypeScript

Run `npm ci` in this directory, then `npm run typecheck`. Dependencies are pinned in package-lock.json. Import `main` from agent.ts using a TypeScript-capable runtime or compile it in your server project. Set `OPENAI_API_KEY` and `OPENAI_MODEL` in the server environment before starting. Call `main` only after authenticating the caller and checking input. Handle rejected promises.

## Python

Use a virtual environment, then `pip install -r requirements.txt`. Import `main` from agent.py and call `asyncio.run(main('How do handoffs work?'))`. Set the same server environment variables. Never put them in an Expo public variable or mobile bundle.

`python test_agent.py` runs four offline tests with a mocked SDK. The app's `tests/agent-studio-v2.test.cjs` similarly exercises the generated TypeScript with a mocked SDK. Mocks test application branches; they do not prove live provider quality. SDK imports and TypeScript compilation are checked separately.

## Approval, state and privacy

The examples return a paused state when approval is needed. They do not auto-approve. Show the exact pending tool arguments to an authorized user, bind the decision to that action and actor, then approve or reject the interruption and resume the same SDK state. Keep serialized state private and scope sessions per user. The example sessions are ephemeral; choose deliberate storage and deletion policies for deployment.

Tracing is disabled in the examples to avoid uploading learning content by accident. Enable it deliberately after deciding what may leave your server; inspect model/tool calls, errors, handoffs and guardrails in the trace dashboard. Never record raw credentials.

## Official references

Checked 2026-10-16:

- [SDK quickstart](https://developers.openai.com/api/docs/guides/agents/quickstart)
- [State and sessions](https://developers.openai.com/api/docs/guides/agents/running-agents)
- [Orchestration](https://developers.openai.com/api/docs/guides/agents/orchestration)
- [Guardrails and approval](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)
- [Tracing](https://developers.openai.com/api/docs/guides/agents/integrations-observability)

## Academy live backend

The Academy uses its own bounded Responses API loop at `/api/learning-mobile/agent-studio`. It does not run exported code. To enable it on a reviewed server, configure:

```text
AGENT_STUDIO_LIVE_ENABLED=true
OPENAI_API_KEY=<server secret>
OPENAI_MODEL=<model available to your account>
```

The existing owner-auth configuration and shared production rate limiter must also be available. Optional `AGENT_STUDIO_INPUT_USD_PER_MILLION` and `AGENT_STUDIO_OUTPUT_USD_PER_MILLION` must match the configured model's current rates; otherwise cost stays unknown. Estimates exclude unreported/failed usage and are not invoices. The route caps each run at three calls, 600 output tokens per call and a 22-second deadline. Configure provider project spending controls separately.

Live tools are read-only local functions; approval-required tools are excluded. There is no production sending, refund, calendar, shell or arbitrary network tool. External actions require additional server authorization, durable approval records, idempotency and production review. This project is **not deployed** by the Studio.
