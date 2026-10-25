# Course-wide practical improvements — 2026-10-08

Scope: all 10 courses in constants/courses.ts. Each has three authored project stages, localized into French, English and Darija, with distinct tasks, acceptance evidence and worked review reasoning. They appear on the course page under Project workshop.

| Course | Practical project | Main evidence |
| --- | --- | --- |
| Programming foundations | First product page | Portable paths, keyboard navigation, traced delivery calculation |
| Real website | Storefront investigation | Observed dependencies, limited local diff, reproducible handoff |
| Python | Inventory importer | Typed CSV validation, 2500-centime fixture, rejection and write-failure handling |
| JavaScript / React | Interactive cart | Integer calculation, state transitions, corrupted-storage recovery |
| Next.js | Product catalog | Direct route access, explicit client/server boundary, loading and failure states |
| API | Local order API | Server-owned prices, two-user authorization, duplicate-request contract |
| Database | Stock and orders | Constraints, rollback, observed plans and restore rehearsal |
| Deployment | Release rehearsal | Reproducible revision, journey checks, measured test-environment recovery |
| Live IPTV | Local live channel | Pipeline mapping, measured latency, stale-playlist/segment diagnosis |
| IPTV app | Catalog and player | Stable IDs, lifecycle cleanup, observed playback compatibility |

The two IPTV courses intentionally differ: one addresses stream production and distribution, the other the application consuming it. The real-site course requires inspected source evidence rather than invented architecture. Business rules in exercises are explicit teaching contracts, not assertions about actual production behavior.

## Learning and persistence

Learners first attempt a task and record observations, then reveal worked review guidance. Each stage links to a real module inside its course. The final question asks learners to explain a design choice. Common review criteria cover reproducibility, correctness, explanation and maintainability. These are self-review prompts, not automatic grades or a claim of mastery.

Draft keys use workshop:v1:course:stage in the existing drafts map. Keys do not depend on display language or position. Stage drafts and final-defense drafts are separate, survive progress serialization, and do not modify completed lessons. Existing SchoolProvider handles on-device persistence; errors expose a retry action. Notes are not automatically synchronized to other devices.

## Verification

- 109 regression tests passed, including three new workshop tests.
- Every catalog course has all three localized versions and working course-scoped module references.
- DOM interaction tests verify progressive disclosure, hidden review before opening, independent stage drafts, navigation, remount restoration, course isolation, retry and editing disabled before storage loads.
- TypeScript and focused ESLint passed.
- Expo web export passed to dist-course-workshops-web; JavaScript bundle remains about 75 MB uncompressed.
- Computer-use inventory contained no browser/app provider. Real screenshots, narrow-screen/RTL visual review and device/offline cold start were not performed.

## Outstanding

These are substantive project briefs and worked review notes, not newly authored full implementations for all ten projects. Existing lesson-level depth gaps remain in the quality audit. Continue the lesson-by-lesson expansion, starting with JavaScript control flow; add complete runnable project implementations where absent. No course is newly declared complete by this change. No publication or production data change occurred.
