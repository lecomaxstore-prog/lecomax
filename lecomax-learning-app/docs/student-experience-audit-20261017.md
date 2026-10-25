# Student experience audit — 17 October 2026

The current local app passes 444 automated tests and nine grouped browser checks after the repairs below. This is a local quality audit, not production acceptance: live account authentication, live cloud synchronization, physical devices, and every secondary feature button remain unverified.

## Six learner journeys

| Step | Learner and journey | Result and evidence |
| --- | --- | --- |
| 1 · A | No history → onboarding → choose Python → start first lesson | Passed in Edge at 390×844. The home screen offers “Set up my learning path.” Goal preferences are saved through the UI. The first lesson opens with zero completed lessons and no claimed mastery. |
| 2 · B | Existing progress → incorrect quiz answer → correction/readiness → reload/sign in → continue | Passed. The browser actually answers the authored quiz and readiness checks; it does not inject completion. Wrong answers show explanations. The completed Academy lesson and typed note survive reload and simulated re-login. Continue points to lesson 2. Automated tests additionally cover remount, saved stages, drafts, bookmarks and previous records. |
| 3 · C | Answer placement → accept recommended start → continue | Passed. Six actual option selections produce the displayed 6/6 recommendation. Completion remains unchanged. A regression test verifies that completing the recommended first lesson continues forward, and that later modules do not become blocked by the intentionally bypassed introduction. Placement is explicitly tentative, not mastery. |
| 4 · D | Select another active path → continue → return to earlier course | Passed in browser and regression tests. Selecting Python opens its actual selected lesson in Python context. Visiting Academy updates the active course. Independent course checkpoints and notes survive serialization and switching. |
| 5 · E | Return after several weeks | Passed in deterministic time-based tests: 28 days produces due reviews without inventing completion or mastery. The browser verifies returning saved progress; it does not simulate a real multi-week absence or a production session renewal. |
| 6 · F | Lose connectivity in a loaded lesson → write note → reconnect/reload | Passed with Playwright's network-offline mode and actual local storage. The English note remains after reconnect and reload, including under Arabic UI. Automated tests cover rejected cloud requests, revision conflicts, local save failure/retry, and reconnect upload. Expired-session offline use and cold offline web startup are not certified. |

## Requirement coverage

| Requirement | Evidence and result |
| --- | --- |
| Obvious starting point | Captured beginner CTA, completed onboarding and followed the first lesson CTA. Passed. |
| Evidence behind levels | Dashboard labels level as **curriculum level**, not learner qualification. Empty records produce no demonstrated skills. Placement does not award completion or memory evidence; delayed recall requirements are tested. Passed for inspected paths. |
| Course order and prerequisites | All published path navigation boundaries, malformed dependency graphs, curriculum content contracts and placement continuation are covered by tests. Editorial prerequisite statements remain instructional guidance, not proof of a learner's ability. |
| Accurate percentages | Tests cover unique lesson denominators, deduplicated completion, module counts and a separate project requirement. Captured real example: 1/7 lessons = 14% course progress; 1/8 including project = 13% path progress; current module = 1/4. Lesson stages are navigation position, not mastery. |
| Continue Learning | Browser covers beginner, completed Academy lesson and assessed Python starting point. Regression tests cover independent checkpoints and continuing after placement. Passed for these cases. |
| Persistence and login | Actual browser reload plus simulated authentication, component remount and serialized migration tests pass. **Live login, account changes and cloud restore across real devices remain untested.** |
| Useful quiz feedback | Browser shows an explanatory incorrect-answer message and requires quiz/readiness work. Automated tests check valid answer keys, feedback, retries and independent/delayed evidence. No AI-generated score was injected into the browser. |
| Schema migration | Legacy progress, notes, drafts, teacher data and journey defaults survive tested migrations; corrupt saves are rejected rather than silently discarded. Revision/conflict tests pass. No production database migration was applied. |
| RTL and mixed text | Inspected Arabic login and lesson screenshots, authored Arabic quiz text in English UI, and an English note in Arabic UI. No document overflow in the tested Arabic lesson. This is not a complete accessibility or every-language typography certification. |
| Mobile/responsive navigation | All five bottom tabs load their real screens at 390×844. The lesson has no document horizontal overflow at widths 320, 390, 768 and 1280. Physical touch, OS keyboard, landscape and large accessibility font settings remain untested. |
| Visible controls | Onboarding, course selection, lesson entry, quiz options, readiness checks, notes, placement submission/acceptance, active-path selection and five navigation tabs were exercised. Component tests cover many additional controls. The captured button inventory is in `artifacts/student-audit/navigation.json`. **Not every button in every secondary tool was clicked; paid AI generation and connected external services were not exercised live.** |

## Changes Made

1. **Placement continuation:** `services/course-learning.ts` now preserves the selected starting sequence after a lesson is completed, without changing completion totals. `services/learning-roadmap.ts` uses the same next-lesson decision and excludes deliberately bypassed introductory modules from later prerequisite blockers. Earlier lessons remain available and incomplete.
2. **Active path consistency:** selecting a path restores its next lesson/checkpoint; visiting a course updates active ownership. Notes and completions are retained.
3. **Fresh source content:** ran the existing source refresh command, regenerating 628 source snapshots and source indexes. The source integrity test now matches actual files, including the changed course-generation endpoint. No source archive or change report was deleted.
4. **Automated coverage:** added `tests/student-journeys.test.cjs` and `scripts/audit-student-browser.cjs`. Repaired stale My Learning route assertions, missing tutor test dependencies, and a study-plan API test that depended on the wrong working directory.

## Validation

- `node --test --test-concurrency=1 tests/*.test.cjs`: **444 passed, 0 failed**, no skipped tests. Log: `artifacts/student-audit-all-tests-final.log`.
- `npx.cmd tsc --noEmit`: passed. Log: `artifacts/student-audit-typecheck.log`.
- Focused ESLint on the two modified application service files: passed, no warnings. CJS test files are excluded by repository lint configuration and were executed by Node instead.
- `npx.cmd expo export --platform web --output-dir dist-student-audit`: passed. This folder is a **local captured build**, not a deployed or live preview.
- `node scripts/audit-student-browser.cjs`: nine grouped checks passed, zero captured page errors. Results: `artifacts/student-audit/results.json`.
- `node scripts/change-report.cjs --check`: validated the append-only history; linked verification is recorded separately from the initial needs-testing report.

The initial highly concurrent focused run hit two VM-loader timeouts; serial runs passed. The first full suite found stale source content and outdated test harness imports/paths; all were repaired before the successful full rerun. Browser harness selectors were corrected to match the current onboarding and Arabic labels. Transient blank navigation captures were rejected and recaptured only after content was visible.

## Browser evidence

Screenshots below were captured and visually inspected in this audit. Browser authentication responses were isolated test responses; all other backend requests were failed rather than supplying invented AI content. Browser learning records were created through the actual UI in a fresh profile. Unit fixtures stayed in memory and never touched a learner account.

### 1. Beginner home — healthy
![Beginner home](../artifacts/student-audit/01-beginner.png)

### 2. First real lesson — healthy
![First lesson](../artifacts/student-audit/02-started-lesson.png)

### 3. Incorrect-answer explanation — healthy
![Quiz feedback](../artifacts/student-audit/03-quiz-feedback.png)

### 4. Returning progress — healthy
![Saved course progress](../artifacts/student-audit/04-returning-progress.png)

### 5. Placement recommendation — healthy, tentative evidence
![Placement result](../artifacts/student-audit/05-placement.png)

### 6. Correct assessed-course destination — healthy
![Python starting lesson](../artifacts/student-audit/06-active-path.png)

### 7. Note during network loss — healthy within a loaded valid session
![Offline note](../artifacts/student-audit/07-offline-note.png)

### 8. Arabic login — healthy
![Arabic login](../artifacts/student-audit/08-arabic-login.png)

### 9. Arabic lesson with English note — healthy
![Mixed Arabic and English](../artifacts/student-audit/09-arabic-lesson.png)

### 10–14. Mobile tab destinations — healthy rendered navigation
![Courses](../artifacts/student-audit/nav-0-Learn.png)
![AI teacher shell; live response untested](../artifacts/student-audit/nav-1-AI-Tutor.png)
![Practice](../artifacts/student-audit/nav-2-Practice.png)
![Profile](../artifacts/student-audit/nav-3-Profile.png)
![Returning home](../artifacts/student-audit/nav-4-Home.png)

## Remaining acceptance work

1. Run sign-in, sign-out, session expiry, restore and conflict handling with designated real test accounts against the deployed backend and two devices. Local simulated login cannot validate credentials, cookies or deployed authorization.
2. Test Android/iOS touch navigation, keyboard, rotation, background/resume and larger text settings. Browser dimensions are not physical-device testing.
3. Test prolonged disconnection through token expiry and a cold offline web launch. Local note durability is verified; offline authentication and uncached resources have distinct constraints.
4. Complete a screen-by-screen secondary-button inventory with authorized external integrations, including AI provider responses, remote labs and notifications. No placeholder or fabricated success response was added to cover these gaps.
5. Have an educator independently review placement coverage and long-form course sequencing. Passing software tests does not certify assessment validity or learner mastery.

No deployment was performed. Existing user learning records and prior change-history reports were preserved.
