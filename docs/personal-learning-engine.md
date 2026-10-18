# Personal learning engine implementation — 9 October 2026

## Architecture inspected
- Next.js 15 / React 19 backend and owner-protected learning-mobile APIs.
- Standalone Expo Router learning app in lecomax-learning-app; separate from the storefront.
- Bundled multilingual courses, deterministic quizzes, daily mission assessment engine, local serialized AsyncStorage progress, notes and teacher history.
- Real server-side AI provider with cancellation, validation, rate limiting and owner authentication.
- Existing Supabase infrastructure and owner sessions. Local learning progress is not currently cross-device synchronized.

## Prioritized delivery
1. Preserve legacy progress and add timestamped assessment evidence, retaining mistakes after retries.
2. Separate immediate corrected answers from delayed recall; schedule review and expose a working review workflow.
3. Send bounded structured learning evidence to the existing authenticated professor endpoint.
4. Verify persistence, review intervals, input validation and regressions.

## Subsequent stages (not delivered by this increment)
- Universal generated curricula with schema validation and prerequisite graphs.
- Durable server-backed progress synchronization with conflict handling and backup restore.
- Independent project assessment and secure external execution sandbox.
- Adaptive time-budgeted daily sessions, Darija preference, streaming UI and AI cost reporting.

Completion of a page remains navigation history, not proof of mastery. Legacy answers have no reliable timestamp and must not receive fabricated assessment dates.

## Delivered and verified
- [x] Backward-compatible memory in existing local progress storage; no data migration or deletion.
- [x] Timestamped quiz evidence retains mistakes after corrections; latest 5,000 events retained, per-question aggregates retained.
- [x] Review intervals of 1, 2, 4, 8, 16, then 30 days for delayed correct responses; errors schedule practice after 10 minutes. These are transparent heuristics, not a validated psychometric model.
- [x] Immediate retries do not increase independent recall counts or postpone review.
- [x] Home entry and multilingual knowledge screen with hidden answers, feedback and restart persistence.
- [x] Bounded professor context with strict backend validation and explicit limits on interpreting evidence.
- [x] Existing completion, notes and original answers preserved. App-open time labeled as app time.
- [x] Bundled source snapshots refreshed and outdated academy test fixtures repaired.

Validation: all 136 learning-app tests passed, including new memory and review interaction tests. Learning-app and backend TypeScript checks passed. Focused lint passed for changed application and backend files.

Not verified in this increment: real authenticated model call, physical Android device, visual browser QA, production deployment, cross-device persistence. The implementation is local source code; a rebuilt application and deployed backend are required to use it in production. Daily mission submissions use their existing assessment storage and are not yet incorporated into this quiz-memory stream.
