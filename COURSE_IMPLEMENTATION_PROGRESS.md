# Programming academy — implementation checkpoint

## Latest master-prompt slice: validated study mission — 2026-10-08

Read the new 20-phase master request and saved the audited baseline, implementation sequence and remaining work in `lecomax-learning-app/docs/MASTER_ACADEMY_PLAN.md`. Full evidence, phase-by-phase acceptance status and Expo/Android instructions: `docs/MASTER_ACADEMY_VERIFICATION.md` in the learning app.

Implemented Home → **Open my mission** → `/mission`: one authored JavaScript values reasoning pack with six independently submitted activities and 14 questions in Darija, English and French. The typed offline assessment engine supports single/multiple choice, numeric answers, output prediction and step ordering. Critical requirements must pass; exact scoring cannot be bypassed by navigation or blank answers. Hints, explanations, retries, stage resume, start date and adjustable session budget work end-to-end.

Progress uses versioned mission JSON inside the existing AsyncStorage-backed drafts map. Legacy progress is preserved; corrupted mission state is not overwritten. Submitted answers determine status; time spent or opening the lesson does not earn mission completion. This is reasoning evidence, not certification of independently implemented code.

Added an independent local cart function exercise, separate reference and 11-check behavioral verifier in `academy-labs/06-javascript/`. The intentional starter fails until implemented. Local checks accept different correct implementations and do not execute learner code in the mobile or backend runtime. Results are not automatically imported as mastery. Removed the blanket 1500-word academy validation gate; editorial sufficiency remains required and existing prose was preserved.

Validation: **119 regression tests passed**, TypeScript and focused lint passed, mission/example calculations checked, reference CLI **11/11**, content audit and academy integrity passed, web export succeeded to ignored `dist-mission-web` (~75 MB JS). No browser/app provider available; native/offline/device/visual QA and APK build remain unverified. No production deployment.

**Next:** expand control-flow content and add another authored mission pack; then practical artifact evidence, more assessment types, complete attempt history and spaced review. Adaptive daily scheduling, full course exams, mastery roadmap, new XP/boss rewards, authenticated sync and performance work remain open. The full academy is not complete, and the ten course workshops do not replace unfinished detailed lessons.

## Previous improvement: practical workshops across all courses — 2026-10-08

All **10 catalog courses** now include an authored, subject-specific project workshop in French, English and Darija: foundations, real website, Python, JavaScript/React, Next.js, APIs, databases, deployment, live IPTV infrastructure and IPTV application development. These are 30 distinct stages / 90 localized stage presentations. Each stage has a concrete task, observable acceptance evidence, worked review reasoning, a course-scoped supporting-module link and an independently saved attempt. Each course includes a deliverable and a decision-defense question, plus common professional review criteria.

The course screen progressively reveals workshops and stages. Drafts and final reasoning use namespaced keys in existing on-device progress storage, preserving previous progress and backup compatibility. Save errors expose retry. Writing a note never completes a lesson or awards mastery. The end-of-reading message now explicitly distinguishes finished readings from demonstrated project skills.

Sources: `lecomax-learning-app/constants/course-workshops.ts`, `components/CourseWorkshop.tsx`, and `app/course/[id].tsx`. These workshops are bundled in the learning app and Expo web export; they are not new canonical website lesson overrides. No existing lesson IDs or module ordering changed.

Validation: **109 tests passed**, TypeScript passed, focused ESLint passed, Expo web export passed to ignored `dist-course-workshops-web`. Three new tests verify every course and locale, valid course-scoped links, draft key isolation and storage roundtrip, interaction disclosure, retained notes across remount/course changes, save-error retry and absence of automatic completion. Existing lesson regression tests remain passing.

Limits: project briefs and worked review notes are not complete standalone implementations of all projects. No claim that every underlying lesson has been rewritten or reviewed. Workshops do not execute learner code or grade it automatically. Browser inventory returned no apps/browsers, so real visual, native-device and offline cold-start QA remains unavailable. Web JS remains approximately 75 MB uncompressed. No deployment or APK produced.

**Next:** continue substantive lesson expansion starting with `lesson-06-02-control-flow` in all three locales, then work through each course's underlying lessons and complete project implementations. Use the new workshop evidence criteria to identify missing instruction, not as a substitute for deep lessons. Remaining quality-audit findings remain open.

## Previous resume: JavaScript values — 2026-10-08

Expanded **lesson-06-01-values** in Darija, English and French without changing its lesson/order/quiz IDs. Each locale has 16 substantial explanatory passages (AR 1,564 words; EN 1,781; FR 1,758), three introductory examples plus a complete annotated calculator, five exercise stages with worked reasoning, three scenario quizzes and four debugging cases. The previously missing `academy-labs/06-javascript/values.js` now exists and matches the chapter solution.

The calculator validates decimal quantity text, keeps money in integer centimes, checks intermediate precision, defines its nonnegative rounding policy and separates formatting from calculation. Explanations cover declaration/reassignment, conversion traps, `const` versus object mutation, identity/shallow copies, `toFixed` strings, template literals and diagnosis versus correction. It is explicitly a local teaching model, not production checkout.

Durable source: `app/admin/how-it-was-built/course/authored/{ar,en,fr}/lesson-06-01-values.json`. Editorial rebuild: `node scripts/author-javascript-values.mjs`, then `node scripts/apply-authored-lessons.mjs`. Both readers and both search indexes match. Normal course generation continues to honor authored replacements.

Validation: **106 tests passed**, including eight new executed chapter tests and an independent BigInt rounding oracle; TypeScript passed; 48-module/192-lesson/three-locale schema validation passed; web/mobile parity and seven-lesson academy integrity passed; authoring/lab/test JavaScript syntax checks passed. Web export succeeded to ignored `lecomax-learning-app/dist-values-web` (Metro reports approximately 75 MB for its JS bundle). No browser/native/device QA was performed in this batch. Bundle optimization and native/offline verification remain outstanding.

The refreshed quality audit has seven reviewed lesson-locales and no inventory errors. Review evidence: `lecomax-learning-app/docs/quality-audit/JAVASCRIPT_VALUES_REVIEW.md`. **The academy and JavaScript track are not complete.**

**Exact next implementation:** expand existing `lesson-06-02-control-flow` across all three locales. Teach explicit Boolean decisions, branch order, arrays and basic loop traces before `Object.entries`/destructuring/compact alternatives. Add executable boundary, termination, break/continue and mutation-during-iteration exercises. Then continue the remaining JavaScript, TypeScript, React, Next.js, backend/database and React Native audit. Preserve existing learner IDs and unrelated workspace changes.

## Earlier resumed educational audit — 2026-10-08

The academy is **not complete**. All 1460 runtime lesson IDs across 125 modules, 10 courses and 50 learning paths are inventoried in all three locales (4380 resolutions). This is structural/content screening, not a claim of substantive review of every lesson. The audit ledger currently has five manually reviewed lesson-locales: two existing JavaScript chapters in Arabic and the SQL chapter in all three locales.

This resumed batch expands the existing sql-transactions-indexes chapter in Darija, English and French. It fixes the unconditional INSERT after a zero-row stock UPDATE, adds self-contained temporary tables, four annotated examples, five exercises with full reasoning, three scenario quizzes, and four debugging cases. Each locale has more than 1500 explanatory words. Savepoint exercises, independent-connection concurrency tests and large migration rehearsal remain; status is expanded-advanced-practice-pending, not complete.

Durable source: app/admin/how-it-was-built/course/authored/{ar,en,fr}/sql-transactions-indexes.json. Apply selective edits with node scripts/apply-authored-lessons.mjs from the repository root. scripts/generate-course.mjs also honors authored replacements, preventing regeneration from restoring superseded code. Canonical web modules, mobile lesson bundles and both search indexes are synchronized, preserving existing IDs.

Validation: **98 tests passed**, including 11 executed SQL checks; TypeScript, all 48 canonical modules/192 lessons/3 locales, content parity and seven-lesson academy integrity passed. Final web export passed. Script syntax checks passed; ESLint excludes CJS tooling/tests, so ignored-file warnings are not counted as lint success. Evidence is in lecomax-learning-app/docs/quality-audit/. Android Hermes execution previously returned permission denied; real browser/native/offline QA remains outstanding. Web bundle size is still approximately 74 MB uncompressed.

Coverage report: lecomax-learning-app/docs/quality-audit/COURSE_COVERAGE_REPORT.md. Twelve assessment dimensions per lesson/locale: lesson-audit.json. Manual findings and implementation evidence: reviews.json and SQL_REVIEW.md. Regenerate with npm run content:audit in the learning app.

**Next implementation:** expand existing lesson-06-01-values and lesson-06-02-control-flow from the documented findings, with validated inputs and traceable examples, keeping their IDs and all localized readers synchronized. Continue the remaining JS, TS, React, Next.js, backend/database and React Native review. Do not mistake the full inventory, a passing schema check or a word count for educational completion. The earlier seven new chapters remain intact.


Updated 2026-10-08. **The full academy is not complete. No track is marked complete.**

## Implemented in this batch

Seven original long-form Darija lessons, **11,505 explanatory words**, plus 21 increasing exercises with hints and worked solutions, 21 quizzes with feedback for every answer, annotated code, objectives, prerequisite links, readiness checklists and recaps. Word counts exclude code, metadata, exercises and quizzes. The four-lesson introductory unit is implemented; Track 1 still needs the full networking/browser/storage foundations and deeper tool instruction.

| Lesson ID | Explanation words | Scope |
|---|---:|---|
| academy-computer | 1727 | Computers from zero: from a click to saved work |
| academy-files | 1640 | Files and paths: build an organized workspace |
| academy-workspace | 1681 | Windows, terminal and VS Code: run your first program |
| academy-algorithms | 1616 | Algorithms and logic: design a delivery calculator |
| academy-html-document | 1558 | HTML from zero: build and understand a product page |
| academy-js-values | 1700 | JavaScript in depth: values, types, let, const and conversion |
| academy-site-boutique | 1583 | Understand my real website: app/boutique/page.tsx line by line |

Lessons live in lecomax-learning-app/data/academy/lessons/*.json and are connected to the first catalog course, **Programming academy · Darija**. Existing courses and learner IDs were preserved. English/French titles use an explicit Arabic-content fallback; translations of the new explanation bodies are not implemented.

The reader has independently saved exercise attempts, per-exercise hint/solution controls, linked prerequisites, original-language notice, visible source references and a saved skill self-assessment. Completion requires correct quiz answers and acknowledged readiness skills. Skill acknowledgment is not automatic code grading. Restart clears quiz/completion/skill checks while retaining exercise drafts.

## Architecture and authoring

- Full original request: lecomax-learning-app/docs/academy/original-request.md.
- Curriculum plan and sequencing: lecomax-learning-app/docs/academy/CURRICULUM_PLAN.md.
- Every required topic: lecomax-learning-app/docs/academy/COVERAGE_CHECKLIST.md and data/academy/coverage.json.
- Typed schema: types/academy.ts; per-lesson JSON; static offline imports: data/academy/registry.ts.
- Catalog: data/academy/catalog.json; adapter: services/academy.ts; existing service integration: services/content.ts.
- Reader: components/AcademyLesson.tsx and app/lesson/[id].tsx. Reuses the existing School persistence; no migration or destructive reset.
- Tests: tests/academy.test.cjs and tests/academy-interaction.test.cjs. Catalog regression fixtures now load the actual combined catalog, preserving all original course assertions.

## Source-grounded website course

The actual website source is available at the repository root. The new lesson fully explains app/boutique/page.tsx and traces its inspected dependencies. Seven file fingerprints are checked against both current source and existing offline snapshots. Next.js installed version: 15.5.24. The connection() reference was checked against Next.js 15 docs. No environment values or credentials were read into lessons. The website startup, layout, full catalog component, cart, checkout, orders, admin, payment webhooks and deployment still require separate detailed lessons; this batch does not claim that whole course is done.

## Validation

- Full learning-app regression suite: **87 passed, 0 failed**.
- TypeScript: passed.
- Focused ESLint for edited application files: passed, no warnings.
- Academy integrity: passed for seven lessons. Tests exercise missing files, duplicates, wrong prerequisite ordering, malformed shape, missing solutions, invalid answers, absent option feedback, short content, repeated sections and false completion claims.
- JavaScript examples: executed and matched documented outputs. Delivery thresholds and malformed quantity inputs are tested.
- HTML projects: local assets, links, fragment targets and semantics verified with JSDOM.
- Real storefront source: the actual page is transpiled with isolated dependency doubles to verify request -> data -> prop ordering. No production DB calls or transactions were performed.
- React interaction checks verify saved separate attempts, hint/solution visibility, prerequisites, completion gating and restart preservation. Existing tests cover AsyncStorage persistence and restoration.
- Final web-only export succeeded in dist-academy-final-web. Combined web/Android export failed when hermesc.exe returned permission denied; Android bytecode export, APK and device validation remain unverified.
- Browser visual/end-to-end QA **not performed**: cua reported no available browser providers. The temporary local preview server was stopped. Android device airplane-mode cold start and APK verification remain outstanding. A successful bundle does not establish native runtime behavior.

## Performance limits

The web export is roughly 74 MB uncompressed. An older pre-existing dist-web artifact is roughly 66 MB; the comparison is not a controlled before/after measurement because the workspace contains substantial earlier changes. Do not attribute that difference to this batch. New academy JSON content is statically bundled; legacy multilingual lessons and large source snapshots require bundle profiling and loading/memory optimization before claiming the mobile performance requirement is met.

## Exact next batch

1. Extend Track 1 with separately authored long-form lessons on browser/client/server architecture, DNS/HTTP/HTTPS and rendering, and cookies/sessions/local storage. Do not duplicate the short university-request lesson without substantive expansion and a clear canonical reading path.
2. Complete the first HTML module with accessible forms/validation, semantic page patterns, tables/media, responsive images/metadata and product/contact/storefront projects with full explanations and tests.
3. Continue CSS from cascade/specificity/box model through Flexbox/Grid/responsiveness; author complete projects, not topic cards.
4. Continue JavaScript with decisions/loops, functions/parameters/returns, arrays/objects, scope/closures, DOM/events, async/fetch/error handling, modules/testing/performance. Use the full 40-topic checklist; the current values lesson does not complete the track.
5. Author Git and TypeScript; then full React and version-correct Next.js (high priority). Inspect installed dependencies again before version-sensitive examples.
6. Work through the remaining backend, database/auth, commerce test-payment capstone, Expo/mobile, quality, deployment and AI-independence tracks. The explicit per-track list below identifies the tracks without new long-form content.
7. Add actual website lessons per the dependency sequence in CURRICULUM_PLAN.md. Retain source fingerprint checks and never silently refresh a hash without reviewing the explanation.
8. Enable real browser/native QA when a provider is available; verify RTL at narrow widths, offline cold start, saved notes/answers across app restart, copied code and previous/next navigation. Profile the large legacy bundle.

Explicit untouched tracks for new long-form content: **3 CSS; 5 TypeScript; 6 Git/GitHub; 7 React; 9 Tailwind; 10 Backend/APIs; 11 Databases/Auth; 12 E-commerce; 13 React Native/Expo; 14 Testing/Security/Performance; 15 Deployment; 16 AI independence.** Track 8 has an actual-source introductory walkthrough only, not a Next.js course. Tracks 1, 2 and 4 have partial new coverage. Existing short content for these areas remains available.

## Resume commands (from lecomax-learning-app)

Run npm run content:academy, npm run typecheck, npm test, and focused lint. Add each new lesson file to registry.ts, catalog.json and coverage.json; the core UI should not need changes for ordinary lesson additions. Maintain prerequisite topological ordering and at least 1,500 explanatory words per substantial lesson. Execute new examples and review teaching substance; word count is a screening rule, not proof of quality. Expo export artifacts belong in ignored dist-* output directories.

## Workspace caution

The repository already contained many uncommitted changes and an untracked learning app before this work. Do not reset, clean, revert or overwrite unrelated files. No deployment, commit, push, credentials change or production data mutation was performed.
