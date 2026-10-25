# Academy ecosystem implementation and audit

## Existing system inspected

The learning application is `lecomax-learning-app`, an existing Expo 57 / React Native 0.86 / React 19 application using Expo Router and TypeScript. The parent project is the Next.js storefront and learning API; `mobile/` is a separate storefront app. No replacement app or new dependency was introduced. The repository already contains extensive uncommitted work, which was preserved.

Inspected application routes, shared components, design tokens, course catalog and lesson types, learning-memory and progress utilities, learner profile, tutor transports and server validation, owner authentication, wellness persistence, and existing automated tests. This is a source audit, not a production penetration test or an assertion that every existing lesson has been editorially verified.

| Area | Actual implementation and constraints |
| --- | --- |
| Navigation/design | Expo Router, five visible tabs, many secondary destinations. Shared accessible controls, RTL Arabic, English/French, green light/dark tokens, system text scaling and reduced-motion handling already exist. |
| Content | Bundled course indexes and lazy lesson modules, original/reference/archive material, authored academy lessons, generated study plans. Lesson types support explanations, examples, exercises, quizzes and summaries. Catalog size must not be confused with fully authored courses; broad science/world discovery is not a complete expert curriculum. |
| Practice | Existing Python workspace and console, JavaScript/SQL/web practice, terminal and device labs. Runtime capabilities differ by platform and some require a local backend. These implementations were retained. |
| Tutor | Existing teacher and structured tutor transports, contextual strategies, learning memory, drafts, cancellation, rate limits, response validation and uncertainty instructions. Model credentials remain server-side. No live provider request or credential inspection was needed for this work. |
| Persistence | Versioned AsyncStorage progress, serialized writes, error/retry UI, imports/exports and a separate wellness store. Delayed independent recall is distinguished from immediate retries. Existing data schema remains readable. |
| Auth/database | Current code uses the owner-session client, SecureStore on native, and the parent owner-auth database adapter. Earlier README claims about Supabase-only mobile authentication are historical. This remains an owner-gated academy, not public multi-user enrollment. No database schema or account data was changed. |
| Offline | Bundled lessons and local data can be used without model calls within an accessible app session. Startup is still subject to the existing owner authentication gate. A new fully offline authentication policy was not introduced. Web cold-start offline installation is not established by a static export. |
| Privacy | Learning analytics are computed locally by `utils/academy.ts`. Existing tutor sharing controls remain. New optional profile details are excluded from outgoing teacher/tutor profile payloads by default; explicit opt-in enables them. Turning sharing off affects future requests, not previously sent messages. |

## Implemented phases

1. Added eight Home destinations using existing reusable visual components. Renamed the course tab to Learn; Explore opens interactive discovery. Existing routes and tools remain available.
2. Added optional onboarding interests, routine goals, accessibility notes, a skip action and optional-preference sharing control. Existing profile edits remain in Profile. Preferences persist through the existing store.
3. Added `/academy-week`: a seven-session local plan, course suggestions from goals/interests/enrollment, saved course selection, daily time caps, priority for due reviews, paired study/practice and reflection. Curriculum ordering is retained. The planner only skips an assessed lesson when **all** its quiz questions have two independent recalls; opening/completion alone does not qualify. This threshold is a transparent planning heuristic, not a validated mastery diagnosis.
4. Added `/agent-studio`: an offline rule-based agent workshop with goal documentation, allowlisted note/calculator tools, step budgets, evidence checks, actual execution traces, boundary tests, saved configuration/input and contextual tutor handoff. It does not run an LLM or execute arbitrary generated code. Built-in checks do not award mastery.
5. Added model and interaction tests and a real-browser smoke script with synthetic auth, real browser storage, reload and responsive checks. Reports are appended through the required Change History command.

## Modified areas and files

- Navigation: `components/AcademyDestinations.tsx`, `components/AcademyDashboard.tsx`, `components/BottomTabBar.tsx`, `app/(tabs)/_layout.tsx`, `app/my-learning.tsx`, `services/discovery.ts`.
- Preferences/privacy: `app/onboarding.tsx`, `utils/academy.ts`, `services/teacher.ts`, `services/tutor.ts`.
- Planner: `app/academy-week.tsx`, `utils/weekly-academy.ts`.
- Agent workshop: `app/agent-studio.tsx`, `utils/agent-studio.ts`.
- Validation: `tests/academy-ecosystem.test.cjs`, `tests/academy-2-interaction.test.cjs`, `tests/release.test.cjs`, `scripts/academy-ecosystem-smoke.cjs`.
- Persistent reporting: new immutable files in `changes/`, generated `data/change-history.json`, and this report. No prior history removed.

## Remaining product work and release limitations

- This is an integration increment, not completion of the entire proposed ecosystem. A vetted beginner-to-expert curriculum across every requested subject, authentic expert projects and validated mastery rubrics remain substantial content work.
- Agent Studio teaches an executable bounded workflow; autonomous LLM tool use, external integrations, deployment and a multi-agent runtime are not included.
- Accessibility preferences are stored and can inform tutor requests with consent. They do not automatically implement every requested accommodation. Native assistive-technology testing remains necessary.
- No production deployment, APK rebuild, live AI/provider/auth verification, cross-device sync test or physical-device offline restart test was performed.
- The initial full suite ran 370 tests: 363 passed, 7 failed. One Home test harness was repaired while extending its coverage. The other initial failures concern stale source snapshots, a course-API test relying on the current working directory, and four tutor-coach harness imports of world content. See the final linked Change History report and validation logs for the final run status.
- Browser smoke tests use synthetic authentication and block external services. They prove local interaction and persistence, not production service availability. English is browser-checked; Arabic/French strings are included but their new flows require separate visual/native QA.

## Validation artifacts

`artifacts/academy-ecosystem-focused.log`, `artifacts/academy-ecosystem-tests.log`, and `artifacts/academy-ecosystem-export.log` record checks. The smoke script writes screenshots relative to its working directory. The append-only Change History records final results and the current-app preview only after that route has been checked.

## Final validation

Typecheck and focused ESLint passed. The web export succeeded. The browser smoke passed agent execution, saved configuration/input after reload, Home navigation, and weekly-plan/agent layouts at 320, 390, 768 and 1280 pixels, using synthetic authentication. Agent and weekly-plan screenshots were visually inspected. Focused checks passed (37 tests plus a later 17-test run covering the final agent/preferences and transport harness changes). The final full suite ran 376 tests: 370 passed, six failed in the existing source snapshot, course API working-directory assumption and four world-content imports in the tutor-coach harness. These failures are not represented as passing. No production or native-device verification occurred.
