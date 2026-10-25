# Learning platform audit and implementation contract

Inspection: 2026-10-17. Scope: Expo navigation, content adapters and catalog, lesson player, assessments, local state, owner authentication, progress API, tutor context and backup UI.

## Findings

- The combined content index contains 125 modules and 1,460 entries, with no duplicate lesson IDs. These entries include reference/archive material, not 1,460 complete courses. All module references in the ten course definitions resolve. Shared lessons intentionally appear in multiple courses.
- The home screen offers several competing resume/recommendation controls. Review recommendations can displace the actual saved lesson. Onboarding saves broad interests and a self-reported level, then opens Explore without enrolling in a concrete course.
- Course checkpoints and four lesson stages already persist. Opening a lesson records a visit, not completion. Completion uses quiz answers and, for authored academy lessons, readiness checks. Legacy completions must remain valid records; they are not proof of independent mastery.
- AsyncStorage serializes local writes and exposes failures. The authenticated PostgreSQL progress endpoint has revision-checked writes, but its UI is a manual replace/restore backup. Concurrent replacement is rejected with HTTP 409. Automatic safe synchronization is missing.
- Quiz attempts and spaced recall evidence exist. Immediate retries are correctly excluded from independent recall. Evidence is currently capped at 5,000 records; this work does not retroactively recover expired evidence.
- Existing tutor calls are server-side and receive lesson context and recent answer evidence. Generated plans are separate from authored curriculum. A recommendation must be computed by curriculum logic, not treated as an AI-awarded completion.
- Several university paths contain syllabus only. They must not become empty enrolled courses or count toward completion. Computer fundamentals must remain independent of Python.

## Architecture

Use stable existing lesson/module/course IDs. A typed journey adapter supplies subject paths, course stages, prerequisites, completion rules, diagnostic recommendations and skill evidence. A path initially contains one existing course; module difficulty describes curriculum position, never a student's certified proficiency. Existing completions, drafts, attempts and account data remain untouched.

New journey preferences and diagnostic attempts use a versioned optional progress field. Missing fields migrate additively to an empty state. Diagnostic performance recommends a starting module but grants no completion or mastery. Skipping a recommended prerequisite is explicit and reversible.

The existing authenticated snapshot API remains the storage boundary. Synchronization uses revision checks and a three-way merge: independent changes merge, conflicting scalar/array changes stop for review, and neither device is silently overwritten. Local writes remain usable offline. No destructive database migration or deployment is part of this change.

## Verification boundaries

Automated tests and type checks will be recorded in append-only Change History. Physical Android interaction, production rollout, and a full pedagogical review of every historical lesson require separate verification; no such outcome is implied by this audit.

## Implemented behavior

- Home now prioritizes the active path, saved lesson stage, course/module/path totals, weekly study budget, evidence-backed skills and due reviews. Generated plans and legacy resume records remain accessible.
- Onboarding continues to a concrete course selection screen. Eleven published courses are selectable, including a separate computer fundamentals introduction. Empty syllabus-only paths remain outside enrollment.
- Roadmap stages use existing modules and lesson IDs. Earlier unfinished modules are recommended preparation; learners may explicitly override or restore this guidance. This is an editorial sequence, not a newly validated academic dependency graph.
- Optional placement samples existing questions from the first two modules, up to three per module. Skipping a sampled stage requires three correct answers; a smaller sample recommends the beginning. Placement grants no lesson completion or mastery.
- Every course has an authored workshop milestone. A path counts unique completed lessons plus one project review; course progress counts lessons only. Project evidence stores artifact text/link and observed test results. Review is learner-attested, never automated certification. Course lessons must be complete before project review counts.
- Lesson orientation explains objectives, preparation and the existing read/example/practice/quiz sequence. Tutor lesson context includes the deterministic roadmap recommendation without allowing AI to write completion records.
- The optional `journey` field migrates additively through the existing progress reader and authenticated snapshot validator. No SQL schema changes, account changes or bulk data rewriting were needed.
- Automatic synchronization fetches the account snapshot, merges against the last synchronized baseline, and uses the existing revision-checked PUT. Baselines advance only after the merged local state is durably written. Divergent edits stop for review; local and remote copies remain available. Settings retains export/manual backup recovery.

## Changed areas

- Screens: `app/(tabs)/index.tsx`, `app/onboarding.tsx`, `app/roadmap.tsx`, `app/lesson/[id].tsx`, `app/_layout.tsx`.
- Components: `components/JourneyDashboard.tsx`, `components/LessonOrientation.tsx`, `components/SyncProgress.tsx`.
- Models and services: `utils/journey-state.ts`, `utils/progress-sync.ts`, `utils/progress.ts`, `services/learning-roadmap.ts`, `services/course-learning.ts`.
- Content and tutor: `constants/courses.ts`, `constants/course-guidance.ts`, `constants/course-workshops.ts`, `features/MobileTeacher.tsx`.
- Tests: new roadmap model/DOM tests; updated onboarding, lesson, library and workshop regression fixtures for the new navigation and single-module computer course.

## Remaining limitations

This is a functional local implementation, not a certified production release. Live authenticated two-device synchronization, crash/recovery on physical devices, Android touch/keyboard behavior, pixel-level responsive/RTL layout, and live AI responses have not been verified in this session. DOM tests use isolated React controls and mocked navigation; transport tests inject cloud responses. The existing API ownership/revision tests run independently.

Conflicts require comparison/export through Settings; there is no per-field conflict-resolution editor. Same-field concurrent study-time or resume edits can therefore pause synchronization conservatively. The app remains owner-authenticated rather than a new multi-student account service. Local persistence and offline reading follow the existing authentication/offline gate. Resume restores the lesson stage, not an exact text scroll offset.

Existing authored workshops provide real milestone content, but historical imported lessons have not all been rewritten or individually quality-reviewed. The curriculum's difficulty labels describe the content, not measured proficiency. Repeated quiz evidence is a limited indicator, not proof of comprehensive skill mastery. No deployment, native package signing, database deletion or account migration was performed.

## Resumed verification — 2026-10-17

The resumed session passed TypeScript checking and focused ESLint across the changed screens, components, progress models, curriculum services, constants and tutor. Two Node test runs passed 71 tests total: 55 covering roadmap, journey, courses, workshops, memory, persistence and change-history behavior; 16 covering Academy onboarding, interactions, validation and recovery. This includes the final rule that every published course has a workshop project and project credit requires completed lessons.

The earlier session's saved logs report 57 passing tests and completed web/Android/iOS exports. Those exports were not rebuilt or visually inspected during resumed verification. The live authenticated multi-device, physical-device, visual/RTL and historical-content limitations above remain open. No checked preview or deployment is claimed. The linked follow-up in Change History records this verification without replacing the original needs-testing report.
