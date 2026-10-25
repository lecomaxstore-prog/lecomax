# Academy 3.0: first connected learning journey

## Inspection and implementation plan

The learning app is the existing Expo 57 / React Native 0.86 application, not the Next.js storefront or the separate mobile storefront. Expo Router handles navigation. SchoolProvider validates and serializes AsyncStorage progress; the authenticated Next.js progress API validates the same snapshot for owner-only PostgreSQL backup with revision conflicts. This is explicit backup/restore, not continuous multi-device synchronization. OwnerGate and server owner sessions protect access. The existing teacher and structured tutor endpoints call the server-side AI provider with bounded requests, authentication and rate limiting. No client AI credentials are introduced.

Existing features include authored lessons, generated three-lesson courses, quizzes, practice runtimes, structured tutor sessions, a knowledge screen, projects, and Memory Studio with SM-2 recurrence. Existing emerald/ivory UI components select Arabic/English/French text and RTL presentation. These are retained.

The first slice connects existing functionality: natural-language goal → validated AI starter course → separate diagnostic → evidence-based recommendation → lesson/exercise/quiz → project and scheduled recall. New course designs contain a versioned, acyclic prerequisite graph and one separate diagnostic question per lesson. Older saved plans remain usable without fabricated diagnostics. Saved plans are not regenerated on resume.

## Implemented behavior

- Generated courses require a valid design. Invalid or incomplete output is rejected before saving. Prerequisites must reference earlier lessons; duplicate and out-of-range edges are rejected.
- One baseline answer and explicit confidence per objective persist in the shared progress snapshot. Re-answering after feedback cannot overwrite the baseline. Baseline recognition does not award completion, recall, badges or mastery.
- A deterministic decision function selects assessment, explanation, guided practice, review or project. Repeated practice errors can recommend an unfinished prerequisite. One error does not change difficulty. The learner can open any lesson independently.
- The learning map exposes objectives, proposed prerequisite links, recorded attempts, baseline results and explanations. It does not claim AI-generated links are scientifically verified or produce invented mastery scores.
- Lesson and home links return to the journey. Linked tutor requests include diagnostic results only when progress sharing is enabled.
- Recall cards use generated exercise/solution content and the existing editable/deletable Memory Studio and SM-2 scheduler. These are self-rated recall exercises, not machine-certified performance. Card creation is idempotent and bounded.
- Existing lesson practice, quiz gating, project drafts, tutor feedback, backup controls, and error handling remain in use. Journey storage errors expose retry.

## Scope and release limits

This is the first connected vertical slice, not completion of all nine phases. The diagnostic is administered after starter-course generation and informs the next action; it does not regenerate a personalized curriculum. Diagnostic knowledge is sampled by one question per lesson and can be influenced by prior exposure. The graph covers lesson-level objectives, not a universal knowledge ontology. No fixed learning-style inference or sensitive-attribute inference is added.

Open-ended exercises and final projects still require teacher feedback or independent assessment. The existing code labs are separate tools; this change does not claim that generated exercises are automatically executed against tests. No new execution, speech, upload or 3D service is simulated. Medical/legal/high-stakes course content retains the existing generation limitations and verification notice.

Production deployment, a signed mobile build, live provider generation, and real-device/cloud-backup verification require separate validation. Existing server credentials and reachable owner authentication are needed for AI; offline use supports previously saved courses. No credentials were read or changed for this slice.

## Validation approach

Repeatable synthetic scenarios cover graph validation, baseline immutability, migration, local reload, cloud-backup input validation, single versus repeated mistakes, prerequisite recommendations, due review, project advancement and a rendered React interaction flow. Provider quality and long-term learning gains cannot be established by these deterministic tests. See the linked append-only Change History verification report for actual commands and results.

Verified locally: the full `npm test` suite passed 321 tests; the subsequently added provider-contract test also passed in the four-test `tests/learning-journey.test.cjs` run. `npm run typecheck`, focused ESLint and `npx expo export --platform web --output-dir dist-academy-3-check` passed. `node scripts/learning-journey-smoke.cjs` passed in disposable Edge profiles for English, French and Arabic at 320×568, 390×844, 844×390 and 768×1024, with reduced motion requested. It exercised baseline submission, actual browser storage, reload and Memory Studio navigation, with synthetic authentication and fixture content. Arabic and English screenshots were visually inspected; these are test artifacts, not user learning history or live AI results.

Changed implementation files: `utils/academy.ts`, `utils/learning-journey.ts`, `utils/resume-route.ts`, `services/study-plan.ts`, `app/learning-journey.tsx`, `app/study-plan.tsx`, `app/plan-lesson.tsx`, `app/tutor.tsx`, `components/AcademyDashboard.tsx`. Validation files: `tests/learning-journey.test.cjs`, `tests/fixtures/learning-journey.cjs`, `tests/academy-2-interaction.test.cjs`, `scripts/learning-journey-smoke.cjs`. This document and the append-only history reports record scope and evidence.
