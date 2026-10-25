# Master academy implementation evidence — 2026-10-08

## Working slice

Home → **Open my mission** → `/mission` opens the JavaScript values reasoning mission. Six activities contain 14 authored questions in French, English and Darija. The engine supports single choice, multiple selection, numeric answers, exact output prediction and step ordering. It does not grade arbitrary code strings or run learner code in the app.

The learner can read the full existing values chapter, answer, reveal a hint, explicitly submit, see question-specific explanations, correct mistakes and resubmit. Earlier activities must pass before later submissions; browsing or changing tabs cannot earn completion. Numeric answers accept equivalent decimal forms. Multiple-choice sets reject missing/extra/duplicate selections. Ordering requires the whole correct sequence. Scores use exact fractions rather than rounded display values. Critical requirements cannot be averaged away.

This pack requires 100% on its short foundational activities and 90% plus critical questions on the final four-question assessment (therefore all four answers must pass). Engine defaults record quiz/module/course thresholds of 80/85/90 for future packs; there are not yet course exams or a user-facing threshold settings screen. A four-question mission assessment is not represented as a professional course exam.

The mission explicitly distinguishes demonstrated reasoning from independent coding. A separate local exercise is available in `academy-labs/06-javascript/CART-PRACTICE.md`. Learners implement `cart-practice.cjs` and run `verify-cart.cjs`. All 11 behavioral checks are required; no source-string comparison. A worked reference is separate. The starter intentionally throws until implemented. The CLI runs the learner's trusted local code on their own computer, is not a sandbox for untrusted code, and is never imported into the application or backend. Results do not automatically award app mastery.

## Persistence and compatibility

Mission state is versioned JSON inside the existing Progress v1 drafts map, under `mission:v1:js-values-reasoning`. It includes content version, original start date, selected activity, 20/45/60 minute session budget, drafts, explicit submission snapshots and per-activity submission counts. Existing AsyncStorage SchoolProvider writes and retry behavior remain unchanged. Scores are recomputed from submitted answers, not stored pass flags.

Changing an answer invalidates that activity's submission until resubmitted. Existing submissions remain available for other activities. The mission retains its original date and unfinished work across midnight. It does not silently rotate to another pack or erase legacy progress. Incompatible or malformed mission data is preserved and leads to a recovery message pointing to backup settings. Cross-device sync and complete historical attempts are not implemented.

## Actual verification

| Check | Evidence |
| --- | --- |
| Full learning-app regression | `npm test`: **119 passed**, zero failures |
| Assessment engine | Eight tests: schema, localized content/references, exact thresholds, critical requirements, all five answer types, missing answers, prerequisite enforcement, persisted retry/date, corrupt state, executed prediction fixtures |
| Mission interaction | DOM test: explicit submission, no navigation bypass, stage resume, goal change, pause navigation, save retry, remount, Arabic text switch, corrupted-state preservation |
| Independent code verifier | Regression test detects missing input validation, unsafe intermediate products and incorrect arithmetic; reference CLI passes **11/11** |
| TypeScript | `npm run typecheck`: passed |
| Focused lint | Assessment service/types, mission feature/route and home screen: passed |
| Content | `content:audit`: 1460 IDs / 4380 locale resolutions, no inventory errors; existing educational gaps remain. `content:academy`: seven existing lessons pass integrity |
| Syntax | Local practice starter/reference/verifier: passed `node --check` |
| Build | `npx expo export --platform web --output-dir dist-mission-web`: passed, approximately 75 MB uncompressed JS |
| Browser/device | Computer-use inventory returned no apps/browsers. Visual, device offline cold-start, font scaling and native APK behavior are **unverified** |

The global academy validator no longer treats 1500 words as an automatic pass/fail criterion. Existing detailed lessons are retained. Word counts in the older audit are screening information only, not evidence of educational completion.

## Master-prompt acceptance by phase

| Phase | Status and remaining work |
| --- | --- |
| 1 Audit | Architecture/storage/AI/navigation/source pathways inspected; inventory refreshed. Not every line or lesson substantively reviewed. |
| 2 Curriculum | Existing catalog preserved; complete beginner-to-professional coverage still pending. |
| 3 Lesson depth | Existing values lesson now has a new mission and independent practice; remaining lesson expansion continues. |
| 4 Interactive learning | Five deterministic answer types and real local function checks; embedded sandbox execution absent. |
| 5 Daily system | One persistent six-activity mission, selectable budget, prerequisite checks and retries. Adaptive selection and many daily packs pending. |
| 6 Exams | Shared scorer and critical checks work. Full module/course/project exams, additional answer types and richer attempt history pending. |
| 7 AI mentor | Existing secured teacher preserved and regression-tested; no live provider availability claim. |
| 8 Motivation | Existing features preserved; evidence-based XP/boss rewards still pending. |
| 9 Revision | Mission recall works; spaced repetition scheduling and retention model pending. |
| 10 UI | Home mission entry, localized activity views, existing RTL/code components. Full visual redesign/accessibility/device audit pending. |
| 11 Projects | Ten prior project workshops retained, with one new independently testable cart exercise. Complete project implementations pending. |
| 12 Roadmap | Existing paths retained; mastery-driven specializations and prerequisite graph expansion pending. |
| 13 Offline/sync | Mission data and scorer statically bundled, persistence tested. Native offline execution and cross-device sync/conflicts pending. |
| 14 Notifications | Existing configurable reminders retained; new weakness/mission-aware notifications pending. |
| 15 Engineering | Typed isolated engine, progress compatibility, no new dependencies, tests/build pass. Bundle optimization and production validation pending. |
| 16 Content engine | Typed mission schema validation added alongside existing lesson reports. Complete unified schema/version migration pending. |
| 17 QA | Automated slice and regression tests pass; real browser/native conditions unavailable. |
| 18 Daily experience | Six-stage reasoning mission works; independent local coding is separate and not falsely auto-graded in app. |
| 19 Execution | Audit, plan and working tested vertical slice completed; ordered backlog in MASTER_ACADEMY_PLAN.md. |
| 20 Acceptance | Overall academy **not complete**. No production deployment or APK claimed. |

## Run and Android build

Run these from `lecomax-learning-app`:

```powershell
npm start
# Web development:
npm run web
# Verification:
npm run typecheck
npm test
# Configured EAS internal APK build:
npm run android:apk
```

The repository's preview EAS profile produces an APK and uses local signing credentials. Building requires working EAS CLI/login and the configured local credentials; secret values should not be pasted into chat or committed. This build was not run in this batch. The production profile targets an AAB.

Install the resulting APK on a test Android device/emulator. Open Home → mission, submit an incorrect answer, correct it, switch activity, close the app fully and reopen. Confirm draft, activity, submissions and goal remain. Repeat after airplane mode from a cold start; test Arabic/English/French, large fonts, narrow screen, light/dark mode, failed save/recovery and Back/Home controls. Remote AI needs connectivity. A web export does not establish these native results.

From the repository root, verify independent coding:

```powershell
node academy-labs/06-javascript/verify-cart.cjs
# Optional worked-reference check after attempting:
node academy-labs/06-javascript/verify-cart.cjs --reference
```
