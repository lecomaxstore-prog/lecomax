# Interactive Learning Studio — implementation and continuation

Entry points: Home → Interactive Learning Studio; Practice Lab → Open Interactive Learning Studio; `/interactive-studio`.

This is a staged implementation with working activities, not completion of every advanced feature in the master brief. Existing tools remain available. No deployment is included.

## Implemented areas

| Area | Actual behavior | Limits |
| --- | --- | --- |
| Python | Existing CodeMirror editor, Pyodide execution, stop, input, real tracebacks, saved files, snippets, exercises, runtime tests and explanations. Execution history now persists in learning progress. Studio AI help opens a consent panel. | Existing CDN runtime dependency; browser WASM memory is not given a new enforceable per-run cap. Native Python retains its existing UI. |
| JavaScript | QuickJS in a disposable worker, actual console/errors, square-function tests with positive/negative/zero/fractional cases, snapshots, drafts and execution history. | Synchronous programs; no DOM, Node APIs, imports, network or filesystem. Educational tests are visible in client source. |
| TypeScript | Syntax-highlighted editor with completion, TypeScript transpilation and QuickJS execution. | Syntax diagnostics, not full project semantic type checking. |
| SQL | Real SQLite sample customers/orders tables, schema explanation, SELECT/WHERE/ORDER BY/JOIN/GROUP BY/HAVING/subquery examples, tabular results and exact grading. | Disposable database resets each run. Queries/scripts are saved; database mutations are not persisted between runs. |
| HTML/CSS | Editable document including styles; sanitized, script-disabled preview at phone/wide widths. | No JavaScript, external assets or navigation. Visual exercise checks are manual. |
| React/Next.js | Real React JSX compilation and initial static rendering inside QuickJS. Guided Next.js client-component tasks. | No hydration, interactive DOM events, server, routing or full Next.js runtime. UI states this explicitly. |
| Mathematics | Bounded expression parser, numerical checking, graph, linear-equation exercise and progressive solution. | Small supported expression grammar; numerical, not symbolic algebra. Unicode/SVG notation, not a full TeX engine. |
| Science | Adjustable constant-acceleration model, graph and checked prediction. | Introductory ideal motion model, not a broad scientific simulator. |
| Language | Translation and word-order practice, deterministic expected answers, optional browser speech playback. | No pronunciation grading. Browser voices depend on device. |
| Quizzes | Multiple choice, true/false, fill, exact short answer, matching, ordering and numeric expression answers, hints, retry and saved outcomes. Coding assessments live in the runtime studios. | Authored question set; no unconstrained generated answer keys or semantic short-answer grading. Listening is model playback, not a scored listening assessment. |
| Flashcards | Manual cards, deterministic question/answer-pair generation from notes, current lesson notes, decks, reveal, four ratings, SM-2 scheduling, upcoming dates and review counts. Home shows due-card entry; mentor can discuss current card. | Source text must contain explicit `question :: answer` pairs. No unsupported AI fact generation. Maximum 500 cards. Recall is self-reported, not measured retention. |
| Whiteboard | Place circles, rectangles, arrows and labels; undo; persistent board; progressive labeled Pythagorean triangle; opt-in AI discussion. | No freehand pen, collaborative editing or rich TeX. Labels use plain/Unicode text. |
| Projects | Calculation library, SQL customer analysis, portfolio and React counter workspaces with prerequisites, milestones, evidence notes, tests or explicitly manual review and contextual mentor. | Starter projects, not all example project families in the brief. Passing tests never automatically evaluates written explanations. |

## Boundaries and configuration

- `npm run interactive:build` regenerates the bundled offline worker and React renderer after runtime changes. Commit both source and generated `worker-bundle.json` / `react-bundle.json` with lockfile.
- QuickJS 0.31.0 provides a 16 MiB learner heap, 256 KiB stack limit and a 1.5-second interrupt deadline. The worker gets an 8-second outer timeout; the UI has a 12-second failure deadline and Stop removes the worker. Code is limited to 32,000 characters. No host functions are exposed except bounded console output.
- SQLite 1.13.0 runs in a separate worker with a 32 MiB SQLite heap limit, initial page cap, result row/column limits and outer timeout. It has no connection to production databases or API credentials.
- The web runtime frame has an opaque origin (`sandbox="allow-scripts"`) and a CSP prohibiting network connections. Runtime JavaScript and WASM are bundled. Each run starts fresh and disposes engine/database resources.
- HTML preview uses DOMPurify plus CSP and an iframe without script permissions. Native preview disables JavaScript and blocks external navigation through WebView.
- The browser process and trusted compiler/loader do not have an application-enforced process-wide memory cap. The existing Python runtime retains its earlier resource model. Do not characterize these as a fully quota-enforced multi-tenant remote sandbox. No arbitrary code was added to the main application server.
- The 12-runs-per-minute UI quota is a local usability limit, not an authenticated, tamper-proof per-user service quota. AI provider quotas remain enforced by the existing tutor API.
- AI help uses the existing authenticated `/api/learning-mobile/tutor` configuration. It sends the displayed context only after consent, plus a minimal profile containing language/level and generic practice defaults. It does not execute code or claim a new test run.
- Work uses the existing `Progress.drafts` persistence and export/backup flow. This is not a new automatic cross-device synchronization service. Local storage errors remain visible.
- Native runtime and editor adapters are implemented but require Android/iOS device verification. New native editor uses a plain monospace input; the full CodeMirror editor is web-only.

## Validation commands and evidence

```
npm run interactive:build
npm run typecheck
node --test tests/interactive-studio.test.cjs
node scripts/test-interactive-runtime.cjs
npx expo export --platform web --output-dir dist-interactive-check
node scripts/test-interactive-browser.cjs
npm test
npm run history:check
```

Runtime and browser scripts use installed Edge through Playwright. Browser app checks mock authentication and AI; they do not spend provider credits. Evidence goes to `artifacts/interactive/`. Source reports are append-only in `changes/` and visible in `/change-history`. The linked final verification report records actual pass/failure results and limitations.

## Remaining stages

1. Offline Python runtime packaging and enforceable memory/network policy; native device checks and fuller native editing capabilities.
2. Full React hydration / Next.js execution only through a suitably isolated runtime; semantic TypeScript project checking and multi-file tooling.
3. More Python difficulty progression, broader challenges and project types, stronger structural/visual graders, richer scientific experiments, scored listening, and symbolic/TeX math.
4. Optional AI card generation with source-grounding and answer validation, rich whiteboard editing, and explicit cross-device synchronization design.
5. Bundle-size work: the existing app export was already very large; the all-tools web entry remains unsuitable for an unqualified performance claim. Measure download, parse and interaction latency on target phones before publishing.

## Resume verification ? 2026-10-15

The complete Edge browser suite passed all 19 checks after a fresh web export. Return-to-tools navigation passed after both React and HTML previews. A real flashcard defect was corrected: adding cards now refreshes the due-time clock immediately instead of waiting up to 30 seconds. The browser regression requires Reveal answer within five seconds. Test fixtures now seed storage only in the top frame; opaque sandbox frames retain their isolation. The project evidence selector targets the feedback rather than the repeated mentor context.

Validation: 300 existing tests passed; after the correction, 12 focused studio/history tests, TypeScript and focused ESLint passed. All 15 runtime checks passed. Browser reload checks verified code drafts, execution history, card scheduling and whiteboard persistence. Hub widths 320/390/900 passed overflow checks; the phone editor screenshot was inspected. Authentication and AI were mocked. Native devices, live AI and target-phone performance remain unverified. The exported entry bundle is approximately 101 MB, so performance work remains necessary before publishing. No deployment was performed.
