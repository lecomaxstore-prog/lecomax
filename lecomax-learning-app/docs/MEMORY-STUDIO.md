# Academy continuation: Memory Studio

## Repository audit and implementation decision

The existing application is Expo 57 / React Native 0.86 / React 19, using Expo Router. The separate Next.js 15 application supplies authenticated APIs. `app/(tabs)/index.tsx` renders `AcademyDashboard`; Explore, Teacher, Practice and Profile retain their existing routes. Shared UI components and design tokens supply Arabic RTL, French/English, dark/light themes, accessible controls and responsive page sizing.

`SchoolProvider` manages a validated AsyncStorage progress snapshot with queued writes, failure/retry UI and import/export. Owner authentication uses the existing session client and native SecureStore. This is not a public student account system. The backend uses private Postgres sessions; the existing cloud progress endpoint has a revision-checked backup migration that has not been applied by this task.

Existing Academy 2.0 code already implements onboarding/preferences, subject discovery, validated AI starter plans, saved structured lessons, quizzes, practice drafts, notes, analytics and projects. The server teacher endpoint uses authenticated requests, rate limits and a 75-second cancellation/timeout boundary. Client study-plan generation validates three complete lessons before saving. Existing tutor conversations and controls are preserved. Local notification integration uses Expo Notifications. Existing specialist labs include supported code runtimes and device/3D experiences; their availability depends on their configured services/assets.

The next coherent gap was editable personal flashcards and explicit recall scheduling. This slice extends existing foundations rather than creating another home, tutor or persistence subsystem.

## Implemented flow

1. Open Memory Studio from Home, or select Create a memory card beneath personal lesson notes.
2. Write a question (including a cloze-style prompt) and answer, optionally reusing the saved lesson note. Save intentionally; this is user-authored content, not AI-generated or independently verified content.
3. Recall the answer, reveal it, then choose Again, Hard, Good or Easy. Scheduling parameters, due time and review event persist in the existing progress snapshot.
4. Search or edit saved cards. Editing resets the schedule because the content changed, while preserving prior review events. The list displays twenty cards at a time with Show more.
5. Return later for due reviews. Home shows the due count. Export/import includes the cards through the existing snapshot path. Save errors use the existing retry path.

## Scheduling contract

The scheduler uses the interval/easiness recurrence from [the original SM-2 specification](https://www.super-memory.com/english/ol/sm2.htm): initial ease 2.5; first successful intervals one and six days; later intervals rounded up using prior ease. Four buttons map to grades 2, 3, 4 and 5. Deliberate adaptations: failure retries in ten minutes, ease is capped at 3, and intervals at 3650 days. It is SM-2-based, not an implementation of every original session rule or FSRS. Self-ratings do not modify objective assessment mastery, completion or XP.

The new `flashcards` progress field is additive. Missing fields in old backups migrate to an empty collection; existing notes, lesson memory and tutor data remain. Import validation rejects invalid schedules, duplicate IDs and orphaned review events. Limits are 5000 cards and 100000 review events; records are not silently discarded. The cloud backup endpoint's existing size limit still applies.

## Validation and remaining work

The focused unit and simulated React interaction tests cover schedule sequences, failure/reset, ease bounds, duplicate rating rejection, malformed imports, migration, note reuse, answer reveal, editing and serialized restart restoration. Full-suite and build outcomes are recorded in the linked Change History verification report and artifacts/memory-studio-*.log.

No deployment, database migration, live paid AI generation or real-device validation is performed here. Existing ownership restrictions and backend setup remain. No new AI flashcard generation, matching game, memory-palace renderer, public enrollment, weekly challenge system, prerequisite graph or automatic cloud synchronization is claimed. Universal search still searches its existing sources; card search is within Memory Studio. Existing large web bundle size remains a release-readiness concern. Future work should prioritize measured loading performance, verified service connectivity, public identity design if required, and objective concept mastery before expanding gamification.
