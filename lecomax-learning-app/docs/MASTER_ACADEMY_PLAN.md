# Interactive academy implementation plan — 2026-10-08

## Request and scope

Implement the user's 20-phase master prompt incrementally as tested vertical slices. Preserve all educational material and learner progress. No arbitrary word floor is an acceptance rule for new work: evaluate explanatory sufficiency, runnable examples, progression and meaningful assessment. Earlier word-count audit flags are screening evidence only.

## Inspected baseline

- Expo Router / React Native learning app, Expo ~57.0.8 and React 19.2.3, with existing theme/RTL components. Keep installed dependency versions.
- Catalog: 10 courses, 50 learning paths, 125 modules and 1460 runtime lesson IDs in the existing structural audit. This is an inventory, not a substantive review of every lesson.
- Canonical website course JSON, authored overrides and selective web/mobile/index synchronization already exist. Separate academy and university registries supply additional offline lessons. Preserve IDs and source fingerprints.
- SchoolProvider serializes Progress v1 through AsyncStorage under lecomax-school-v1, with queued writes, error reporting, backup-compatible maps and retry. Drafts, notes, answers, bookmarks and lesson stages already persist.
- Home picks a daily lesson by date, but does not have a coding mission with independently validated stages. Wellness daily activities are a separate feature and must not be treated as coding mastery.
- Existing Quiz supports single-choice feedback and records latest answers/attempt count. Reading completion is not evidence of independent code implementation. Seven academy lessons additionally require self-acknowledged readiness.
- Teacher uses authenticated backend routes; native tokens use SecureStore and web token is memory-only. Existing tests cover authorization, rate limiting, cancellation and failure handling. No provider credentials inspected or changed.
- Existing reminders and notification preferences remain. Do not replace them with duplicate schedules.
- Ten course workshops now provide localized project briefs and saved notes, not automatic grading or complete implementations.
- Known limitation: roughly 75 MB uncompressed web JS; large content/source snapshots need profiling. Browser providers were unavailable; native/offline device verification remains outstanding.

## Ordered implementation backlog

1. **Current slice:** reusable deterministic offline assessment types and scoring; an authored JavaScript values mission with six activities, persisted answers, explicit submission, feedback, retries, separate activity status, adjustable study budget and exact resume. No eval, arbitrary code execution or fake Run button.
2. Expand assessments to explain-and-justify, matching, function/feature rubrics and practical artifact verification. Add randomized equivalent variants and assessment attempt history. Default standards: quiz 80%, module 85%, course 90% plus separately verified project; critical requirements always pass.
3. Expand all existing lessons systematically, starting control flow. Review concepts, annotated executable examples, mistakes, guided/independent tasks and advanced extensions. Keep the existing educational quality ledger honest.
4. Add more authored mission packs across courses; adapt selection to demonstrated weaknesses and available time. Do not claim adaptation from a static lesson picker. Retain unfinished assignments across days and distinguish practice, demonstrated skill and later retention.
5. Spaced review with explicit schedules, recall outcomes and history; then prerequisite mastery gates on newly assessed activities. Never retroactively erase or lock legacy completed work.
6. Roadmap by specialization with explicit prerequisite graph and evidence-based skill status. No invented professional-readiness percentage.
7. Dashboard and evidence-based XP/achievements; no rewards for opening screens or repeated answer tapping. Reuse reminders and respect breaks.
8. Complete project implementation packs and local deterministic test commands; add sandboxed remote execution only with resource isolation and secure setup. Freeform code cannot be graded by matching one source string.
9. Improve teacher context/hints and offline deterministic help where needed; retain backend authentication/rate limits and no client secrets.
10. Profile content loading, optimize bundle/memory, validate accessible mobile/RTL/dark/light layouts and reduced motion.
11. Native cold-start/offline and Android build verification, then authenticated sync/conflict handling only after a real learner-data backend is configured.
12. Production readiness with reproducible build, device checks, rollback and full acceptance evidence. No completion claim while curriculum or critical verification remains unfinished.

## Verification checklist

For each slice record actual evidence for content integrity, answer validation, meaningful feedback, retry/resume, progress compatibility, navigation, offline architecture, type/lint/regression checks and export. Distinguish DOM interaction tests from a real browser, and web bundling from Android execution. All 20 phases remain open until their acceptance requirements have direct evidence.
