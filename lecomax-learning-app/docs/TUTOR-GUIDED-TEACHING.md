# Personal tutor: audit and guided teaching

## Teaching modes follow-up

The tutor now includes beginner, expert, mistake diagnosis, alternative explanation, Feynman, real-world, memory, project and reflection modes. Structured teaching cards expose the objective, prerequisites, question and progressive hints. Active sessions use the explicit mode-change control; new-session controls remain hidden until appropriate.

Assessment evidence preserves the question, learner response, confidence, hints used, proposed misconception and next exercise. Uncertain diagnosis waits for clarification; repeated misconceptions return to concept work. Reflection remains separate from grading. AI-derived review cards are due for retrieval without recording a recall event; this supersedes the initial scheduling description below.

Manual cloud backup controls reuse the authenticated progress endpoint. Browser checks use synthetic authentication, AI replies and cloud transport: they verify UI and snapshot round trips, not real account storage or live model quality. English, French and Arabic controls passed at 320, 390, 768 and 844 pixel viewport widths; teaching content in these fixtures is English, so this does not validate generated translations.

Resumed validation: all 329 tests passed, app and root TypeScript checks passed, focused lint passed, and Expo web export passed. Multilingual browser checks and screenshots passed inspection. Logs are in `artifacts/tutor-intelligence-resumed-tests.log`, `artifacts/tutor-intelligence-resumed-export.log` and `artifacts/tutor-intelligence-resumed-browser.log`. The source-library generator refreshed the stale embedded server instructions identified by the previous regression run. No deployment, native-device validation, live AI call or real cloud round trip was performed.

## Retained foundation

`app/tutor.tsx` already provides eight teaching modes, structured lessons, roadmap navigation, assessments, timed exams, diagrams, attachments, speech capability integration, conversation history, cancellation, retry and token-budget feedback. `services/tutor.ts` calls the authenticated Next.js `/api/learning-mobile/tutor` endpoint; no provider key is sent to the client. The endpoint retains authentication, rate limits, budget reservation, structured-output validation, bounded retries, timeouts, streaming validation and `store: false`.

`tutor-memory.ts` retains bounded sessions and concept evidence within the existing validated AsyncStorage progress snapshot. Preferences and current lesson context already feed requests. Before this change, conversational evaluations were displayed without updating concept records, quiz hints appeared all at once, and tutor outcomes did not create Memory Studio cards.

## New guided flow

Start guided teaching within an existing session. Continue explicitly through diagnosis, one concept, teach-back, mini challenge, mastery check and personalized recap. Each question waits for the learner's response in the existing composer. Diagnosis informs the first concept; partial/incorrect/uncertain responses at later stages keep that stage for targeted remediation. A valid evaluation is required before accepting an answer turn. Requests for stories, counterexamples, simpler explanations or hints do not consume the pending question.

The pending prompt, phase, depth, confidence, sharing preference and outcomes persist in the session. Beginner/expert depth and confidence guide the server's teaching instructions. The provider is instructed to use one concept, meaningful analogies with limits, corrected reasoning and observable evidence. These are model instructions, not a guarantee that every generated explanation is pedagogically or factually correct.

All original teaching modes remain usable. Guided mode is an explicit option, not a replacement for exam, conversation or programming workflows. Quiz hint ladders reveal one step at a time. Existing actions now also include stories, counterexamples and a single next hint.

## Evidence and memory

AI evaluations update concept attempts, mistakes and targeted next exercises, but **never count as independent mastery**. An uncertain verdict does not create a false failure. Existing quiz scoring continues to distinguish assisted retries from independent recall. Session recap uses observed outcomes; it does not certify skill.

Evaluated guided answers create clearly labeled AI-feedback cards containing the pending prompt and corrected reasoning. Quiz and submitted-exam outcomes create deduplicated question/answer cards. They use the existing persisted SM-2-based Memory Studio scheduler: successful outcomes start a one-day review; errors return in ten minutes. Revisiting answer buttons cannot repeatedly postpone a scheduled card. These automatically derived cards should be checked and edited before memorizing; they are not independently verified sources. Existing collection/event capacity limits still apply.

Privacy: turning learning-context sharing off omits the learner profile, other concept history and aggregate course progress on subsequent requests. Current lesson, pending prompt, session summary/history and submitted text remain necessary context; this toggle cannot revoke information previously sent. Attachments remain transient in the existing flow. Deleting a tutor session removes its generated review cards/events; deleting all learning memory removes all tutor cards while preserving unrelated notes/cards. Existing export/import includes the new data with backward-compatible validation.

## Validation scope

New tests execute the actual tutor page and guided controls against controlled provider fixtures: diagnosis, incorrect answer, explanation request, preserved pending question, failed request/retry, restart, teach-back/challenge/mastery progression and recap. Additional tests cover gradual hints, assisted-answer evidence, quiz/exam review scheduling, duplicate protection, uncertain evaluation, malformed imports and deletion. Existing route tests cover auth, limits, schema, streaming and provider failures.

Final checks are recorded in the linked Change History verification report. Logs: `artifacts/tutor-guided-tests.log`, `artifacts/tutor-guided-backend-types.log`, and `artifacts/tutor-guided-build.log`.

No live paid provider request, real-device session, authenticated browser visual preview, database migration or deployment is claimed. Model quality across subjects and languages still needs live evaluation. Owner-only account access and existing backend configuration requirements remain unchanged.
