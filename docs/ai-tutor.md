# AI Tutor — fifth Learning Center option

See [the 7 October programming tutor upgrade](ai-tutor-upgrade.md) for the current course, multilingual teaching, retrieval, progress and mobile-chat changes. Historical implementation notes below describe the earlier version.

The existing four learning actions remain in `SiteExplorer`. A fifth Arabic link opens `/admin/how-it-was-built/ai-tutor/`. The tutor has its own conversation interface, with concept, code-writing, debugging, API integration, line explanation, project context, practice, build, review and quiz modes. All use one provider and teaching policy. The file library can open the tutor with the selected file and line.

## Teaching and UI

The server prompt teaches WHY before HOW, small examples, a learner attempt and review. It understands Arabic/Darija questions and retains English programming terms. Teaching quality is model-dependent; code is explained, not executed or graded by a compiler. Code reviews distinguish actual bugs from optional improvements.

Answers stream progressively. Each completed answer has simpler/deeper/why/practice actions anchored to its saved message ID. Code blocks offer copy, explanation, line-by-line, changes, practice, a line picker, why and removal questions. Markdown is rendered without raw HTML, executable links or remote images. Long code scrolls within its block. The composer accommodates the visual viewport and the existing admin scroll container.

## Existing architecture reused

### Real-site lessons and mobile update (local changes)

Six guided lessons cover the product card, product page, category filters, products API, cart discount flow and server Supabase client. `TUTOR_EXAMPLES` stores real paths and function anchors; the sanitized snapshot resolves current line numbers. The owner-protected `/api/admin/ai-tutor/source` endpoint supplies a preview of up to 14 numbered lines. Its source catalog is included in deployment tracing. Missing anchors fail explicitly rather than returning an unrelated example.

Selecting a lesson prepares an editable question and its exact source context; sending remains an explicit learner action. Questions without a selected file receive a topic-based source excerpt automatically. The composer shows that choice, and an explicit file/line takes precedence. The prompt distinguishes real excerpts from proposed changes, requires an observable check, and waits for an attempt before revealing exercise answers. Hints, quizzes and next-step actions are anchored to the selected saved explanation.

On mobile, navigation uses a compact selector, learning modes stay collapsed until opened, examples have full-width actions, code scrolls internally, and the hero disappears during a conversation. Source previews use real local snapshots in the browser smoke test; AI replies and learning writes remain fixtures. These local improvements are not covered by the earlier production deployment recorded below.

- Next.js 15 App Router and React 19; the official installed `openai` SDK and Responses API.
- Existing `OPENAI_API_KEY` and `OPENAI_MODEL`, read only in `lib/ai-tutor-provider.ts`. No new key or browser OpenAI request. The configured model can be changed without code changes.
- Existing owner admin session, learning PIN, same-origin mutation protection, bounded request reader, Supabase service client and source snapshot library.
- Source excerpts come from `getLearningSourceContext`: one selected file, up to 120 lines / 12,000 characters. Source tracing includes the generated catalog for the new endpoint.
- New `react-markdown` dependency handles Markdown as React elements.

## Storage and privacy

Migration: `supabase/migrations/20261006150000_ai_tutor.sql`. Three tables use the existing normalized owner email identity: `ai_learning_conversations`, `ai_learning_messages`, `ai_learning_progress`. Bookmarks are a message flag; no extra bookmark or duplicate user tables. RLS is enabled, browser roles have no grants, and every server operation scopes the owner. Composite foreign keys prevent cross-owner message insertion.

Apply with `./scripts/setup-ai-tutor.ps1 -Apply`; without `-Apply`, it reads readiness. The script reuses existing Supabase CLI credentials and verifies the linked project against local configuration. The additive migration is installed on the linked project as of 6 October 2026.

The tutor sends only recent conversation text, bounded learner signals and the selected sanitized source excerpt to OpenAI. Configured credential values and recognizable credential patterns are rejected before storage/provider calls. The user is asked to replace secrets with placeholders; this is a defense in depth check, not a guarantee that every possible sensitive value can be recognized. Private configuration is never retrieved as source. API errors do not reveal provider payloads, billing information or credentials.

## Memory and cost controls

History lives in Supabase, with `store: false` on OpenAI requests. The provider receives at most 12 completed messages / 24,000 characters, plus bounded progress and source context; older turns remain readable in our database but are not replayed indefinitely. No provider-side conversation state or tools are used. Sessions are limited to 100 user turns; list/history views show the latest 100 sessions/bookmarks and at most 202 messages per session.

An atomic database reservation enforces one active turn per owner, idempotent request IDs, 12 requests in 15 minutes and 80 in 24 hours across server instances. Failed requests count toward the budget. The server also has existing request rate limits. A 100-second lease recovers abandoned streams; incomplete answers are labeled and excluded from future model history. Only a successfully completed and saved answer produces a `done` event. Token usage is stored server-side, not returned to the browser. No speculative monetary estimates are displayed.

Understanding percentages are explicitly self-reported confidence, not an AI mastery score. Practice attempts are counted when the learner marks a submission as an attempt. Completed exercises, recent mistakes, difficulty and review needs are learner-reported. Studied turns are recorded on successful completion. Creating a new conversation preserves all progress.

## Verification

- `node --test tests/ai-tutor.test.ts tests/openai-integration.test.ts tests/learning-source-context.test.ts tests/how-built-pin.test.ts tests/source-library.test.ts`
- `node scripts/smoke-ai-tutor.mjs` with a local server. Chrome uses a temporary authenticated local profile and fixture-backed tutor APIs, so the suite does not create real learning history or incur AI usage. It checks streaming, answer continuity, multiple conversations, reload/bookmarks, progress, copy, Markdown safety, errors/retry, RTL and 360/390/768/1440px overflow, and scans browser requests and loaded scripts for the configured OpenAI key.
- `node --conditions=react-server --env-file=.env.local scripts/verify-ai-tutor-provider.mjs` makes one short live teaching request and prints only pass/fail metadata. It passed against the existing account, including Arabic output and streaming. This command incurs normal API usage.
- `npx tsc --noEmit`, focused ESLint, and `npm run build`.

Official API reference consulted: https://developers.openai.com/api/docs/guides/streaming-responses

## Production verification — 6 October 2026

Deployment `dpl_6h6Xs1Fh76XM1pH4D9vtoqWSUdyx` is READY in production and aliased to `https://lecomax.com` and `https://www.lecomax.com`, confirmed with `vercel inspect lecomax.com` after publication.

Live unauthenticated checks passed: the homepage returns 200; `/admin/how-it-was-built/ai-tutor/` redirects to the admin login (307); both `/api/admin/ai-tutor/` and `/api/admin/ai-tutor/message/` return 401. The deployment log is `.source-library/ai-tutor-deploy.log`.

The saved prepublication results show 7 tutor tests and 27 regression tests passing, the fixture-backed browser suite passing, and the live provider check passing for connection, streaming and Arabic. This postpublication check did not create an authenticated production conversation.
