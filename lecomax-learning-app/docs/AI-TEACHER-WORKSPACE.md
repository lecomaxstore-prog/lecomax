# AI teaching workspace

Open **AI Teacher → Open my teaching workspace**, or `/tutor`. Existing teacher chat, source explanations, terminals, web editor and programming lab remain accessible.

## Implemented behavior

Eight modes share a secure structured backend: learn from zero, explain, Socratic guidance, homework, exam preparation, language conversation, programming mentoring, and adjustable learning challenges. Each has a distinct teaching contract. Profiles, a compact session handoff, six recent messages, current lesson stage and relevant practice records guide responses. Generated feedback is not treated as independently verified mastery.

Roadmaps open full lessons with objectives, duration, explanations, worked examples, exercises, quizzes, summary and next recommendation. Clarification actions preserve the current lesson and stage. Completion requires correct quiz answers; retries and hints remain practice evidence. The original plan lesson links with its exact plan and step. Programming work links to the existing lab and chat/editor tools; generated code never runs automatically.

Practice exams accept subject, type, difficulty, available minutes and target. Timed tests use an absolute saved deadline; untimed tests have no countdown. Answers and explanations are shown after submission. Expiry submits once, including unanswered questions. These are learning activities, not secure or certified examinations. Generated answer keys can be wrong and require review.

Local progress stores up to 20 sessions, 12 recent messages plus a compact summary per session, and up to 200 recent concept records. A full session list requires explicit deletion before adding another. Concept history tracks practice attempts, errors, independent delayed recall, review dates and next exercises. The displayed estimate is conservative and not a qualification. Session/lesson/draft state survives reload and participates in existing export/import and cloud backup. Cloud backup still requires the separate existing database migration and configured owner backend. Memory controls show records, delete a session or reset the workspace; separately saved Notes remain until deleted in Notes. Deleting local state does not delete earlier exported files or a previous cloud backup: replace/delete those through their existing controls.

## Media and visual support

- Web: one JPEG, PNG, PDF or UTF-8 text attachment per request; 2 MB binary and 20,000 text characters. Server checks MIME, data-URL format, size and binary signature. PDFs are passed to the provider for text/image interpretation; no persistent document library or large-document retrieval index is created. Attachments are kept in transient component state and cleared after success, leaving the screen, or explicit removal. Follow-up conversation has the summary, not access to a previously uploaded file; reattach for exact document questions.
- Browser speech: capability-detected speech recognition and speech synthesis, explicit start/stop, pause/resume, permission errors and cleanup. Dictation only fills the draft; it never submits automatically. It may use the browser vendor's speech service. Transcription does not measure pronunciation; there is no audio grading or full-duplex voice agent.
- Native: text and structured teaching work with buffered responses. Native attachment picking, recording and playback have not been implemented; the screen says to use a supported browser. No fake microphone controls are shown.
- Interactive visuals: process/timeline stepping, adjustable linear-function slope and right-triangle side with calculated hypotenuse. These cover a finite set of diagrams, not arbitrary simulations. Mathematical output uses readable Unicode and Markdown; a full LaTeX typesetter is not included.
- Web response streaming uses newline-delimited events. Partial text is visibly provisional and never persisted. Lessons/quizzes are rendered and saved only after the full schema and semantic checks pass. Incomplete/refused/invalid output, disconnects or cancellation retain the prior lesson and draft. Native falls back to complete JSON responses.

## Server setup and operating limits

The existing owner authentication, `OPENAI_API_KEY`, and production shared Redis rate limiter are required. Private keys are never sent to the app. The new route is `POST /api/learning-mobile/tutor`. No deployment or database changes are performed by this implementation.

Optional server settings in the repository `.env.example`:

- `OPENAI_TUTOR_FAST_MODEL`: explanations and conversation.
- `OPENAI_TUTOR_REASONING_MODEL`: plans, exams and other structured teaching.
- `OPENAI_TUTOR_VISION_MODEL`: attached material; configure a model supporting images/PDFs and structured output.
- Missing task-specific models use the existing `OPENAI_TEACHER_MODEL`, then the established `gpt-6-astra` fallback. Model access must be checked in the operator's account; there is no silent model substitution on failure.
- `TUTOR_DAILY_TOKEN_BUDGET`: per-owner, per-UTC-day conservative reservation units (default 200,000). An atomic Redis script rejects over-budget work before the provider request. Development alone permits process-local counters. Missing or broken production shared storage fails closed. Input-character allowance, output allowance, attachment allowance and one possible SDK retry are reserved. Cancelled/failed requests keep reservations to avoid bypasses. These are conservative usage controls, not an exact invoice or a guaranteed dollar spending cap, especially for PDF/image tokenization. Configure provider-side spend limits as well.
- Optional `TUTOR_INPUT_USD_PER_MILLION` / `TUTOR_OUTPUT_USD_PER_MILLION` show estimates based on configured rates. Blank values show no monetary estimate. Leave blank when task models have different rates. Actual token counts are returned and logged without prompts, attachment data, summaries or owner identity. This is operational telemetry, not a durable billing ledger.

Requests have bounded bodies, context, history and output. The server makes at most one SDK transient retry, enforces cancellation and timeouts, uses `store:false`, and validates structured JSON on both sides. Structured fields are not proof of factual correctness. Personalized generations are deliberately not cached across learners. There is no web browsing, reliable general-purpose calculation service, or code execution tool connected to the model. The triangle visual computes its own numeric result locally.

Provider API shapes were checked against official documentation: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [image inputs](https://developers.openai.com/api/docs/guides/images-vision), and [file inputs](https://developers.openai.com/api/docs/guides/file-inputs). PDFs are processed through actual provider file input, not a placeholder attachment label.

## Verification and remaining work

Unit and route tests cover malformed JSON, invalid/ambiguous answer keys, schema bounds, old-progress migration, reload context, conservative mastery, exam submission idempotence, usage exhaustion, authentication, cancellation signals, provider failures and streaming completion. `scripts/test-tutor-browser.cjs` runs the exported app in Edge with mocked authentication/provider responses: starting a subject, roadmap and lesson, wrong answers, simpler clarification with exact context, completion gating, reopening, failure/retry, text attachment, and English/Arabic phone layout. Screenshots and results are in `artifacts/tutor/`.

Tests do not establish real provider output quality, real microphone permissions, pronunciation feedback, PDF interpretation accuracy, live Redis behavior or device compatibility. No paid provider smoke request, physical-device test or production deployment was performed. Native media, extensive document retrieval, broader interactive simulations, full mathematical typesetting and a durable billing ledger remain unfinished. The existing roughly 96 MB web entry remains a loading-performance issue.
