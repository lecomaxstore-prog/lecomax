# Python learning audit and incremental implementation

## Existing architecture

The repository contains a Next.js storefront/backend, a separate storefront mobile
app, and the Expo learning app in `lecomax-learning-app`. This change targets only
the learning app. Repository inventory, the architecture documentation, runtime
services, authentication, progress, Python content and existing tests were inspected;
this is not a line-by-line audit of all storefront code or generated assets.

The web TeacherLab previously opened Python through the local PC terminal service.
Android and iOS open the shared CodeMirror studio in a WebView for Python.
Android also offers an offline Chaquopy CPython console in a separate process
with a ten-second deadline. Other iOS runtimes retain the local-computer lab.
The native runner shares Android app
permissions; it is not a security sandbox. The existing PC lab rejects production
use and is owner-authenticated. No backend learner-execution service was added.

`SchoolProvider` stores lessons, quiz results, drafts, study time and learning memory
in versioned AsyncStorage. Authentication and the AI teacher use existing protected
server endpoints. There is no existing cloud script database to reuse. This increment
reuses `Progress.drafts` rather than inventing a database or migrating accounts.

The Python course already has 16 guide lessons, four foundations labs and four
professional labs in Arabic, French and English. Topics include functions,
collections, CSV, models, tests, SQLite, generators and an inventory capstone.
It is not yet the complete beginner/intermediate/advanced syllabus requested.

## Priorities and delivered increment

1. Make browser practice independent of the PC: Pyodide 0.27.7 in a disposable
   worker within a sandboxed iframe with an opaque origin. The iframe cannot access
   application storage or DOM. Its CSP permits runtime downloads only from the pinned
   jsDelivr runtime directory. No credentials or authentication tokens enter it.
2. Use CodeMirror for Python syntax, indentation, bracket matching/completion,
   language completions (not a Python language server), line numbers, active-line
   highlighting, multi-selection, history, search/replace, themes and font sizes.
   Ctrl/Cmd+Shift+F indents the selection; this is not a Black formatter.
3. Add stdout/stderr, tracebacks, duration, stop, restart, clear, copy, input data,
   session history, draft restoration and named saved copies. Never overwrite an
   existing named copy without confirmation. The PC Python terminal remains available through the advanced
   toggle; existing Node.js, PowerShell, Kali and native Python paths are preserved.
4. Explain common errors using deterministic English guidance with localized UI
   labels. The recorded traceback remains visible. General suggestions are explicitly
   not verified fixes. Optional AI handoff reuses the existing teacher and identifies
   the exact executed snapshot. No AI key is introduced or exposed.

## Execution and storage contracts

- Loading deadline: 60 seconds. Running deadline: 10 seconds, set only once per run.
- Stop, timeout, restart and leaving the workspace destroy the iframe/worker.
  Duplicate runs are blocked synchronously. Completed runs release workers and URLs.
- Source: 64,000 characters. Input: 12,000 characters. Output: 24,000 characters per stream.
  The last 20 runs are retained in memory only, with exact code/input snapshots.
- Each run has fresh variables and a disposable virtual filesystem. No host files
  or production database are mounted. Browser memory exhaustion is not enforceable
  as a fixed per-worker quota; sufficiently large allocations may still crash a tab.
- `input()` displays a live console prompt where the existing runtime supports it,
  with a 60-second input deadline and two-minute session limit. Prepared answers
  are used only when the learner explicitly disables interactive input. If JSPI is
  unavailable, an actual input() call raises an explanatory runtime error instead
  of consuming preset answers. Scripts without input still run. This is not a persistent REPL.
- Standard-library availability is whatever the pinned Pyodide runtime bundles.
  HTTP exercises, FastAPI servers and third-party packages are not supported here.
- Runtime download requires internet. Browser cache may help, but full offline web
  execution is not guaranteed. Android's existing installed runtime remains offline.
- Drafts use `python-studio:draft`; saved copies use `python-script:<name>` inside
  existing local progress. Clearing app data loses these local drafts, as with
  existing progress. Storage errors remain visible. No cloud synchronization.
- Responsive controls wrap, code/output wrap, editor/console switch on small screens,
  controls have 44px minimum height and bottom safe-area padding. Actual Android/iOS
  touch keyboards still need device testing. CodeMirror is bundled into the native
  WebView, while the Android offline console remains a separate experience.

## Mobile IDE controls

### Console reliability update — 12 October 2026

The primary transcript now preserves Python write order across stdout and stderr.
Raw streams remain separately expandable and copy uses transcript order. User
answers are echoed after each prompt, with no default invented answers. Successful
completion, failure and cancellation have distinct messages. A normal sys.exit(0)
is treated as successful termination. Stop remains synchronous and repeated Stop
does not reset a finished run; Restart recreates the isolated runtime even while idle.

Capture is bounded to 24,000 characters per stream and 2,000 stream segments. Live
updates are throttled, including after output reaches its cap. A visible truncation
notice identifies incomplete output. Wheel/touch scrolling pauses following; a new
input request reveals the input form and resumes following. Rotation-sized viewport
changes preserve the mounted editor and console state.

Error guidance includes ImportError and cautious generic guidance for unfamiliar
exceptions. Only lesson.py/main.py frames identify editor lines, so internal wrapper
frames do not highlight unrelated learner code. The original traceback is kept.
Explain Error hands the executed snapshot to the existing AI teacher only on request;
Copy suggestion copies the built-in advice and never changes the editor. No live AI
response is required for ordinary execution or deterministic explanations.
Native copy requests use Expo Clipboard with bounded bridge messages and an actual
success/failure acknowledgment; the WebView does not require navigator.clipboard.

This remains local WebAssembly CPython in an opaque-origin worker, not backend
execution. No application tokens, host filesystem or database are passed to it.
The pinned CDN is the only allowed network destination. Time/output isolation is
enforced outside the worker, but browsers provide no enforceable per-worker memory
quota. Runtime download needs a connection. Interactive input depends on JSPI support
in the browser/WebView; iOS compatibility is not claimed. The separate Android offline
runner remains unchanged and uses explicit prepared stdin.

- An optional, horizontally scrollable coding strip inserts four spaces, indents or
  outdents selections, wraps selections in paired brackets/quotes, inserts Python
  symbols, moves the cursor, and performs undo/redo. Pointer interaction preserves
  the editor selection and keyboard focus. Commands do not interrupt IME composition.
- CodeMirror stays mounted across Editor, Console and Exercises. Its selection and
  undo history survive panel switches, and each panel remembers its outer scroll.
- The editor has its own bounded scroller, readable gutters, a 16px default font,
  line/column feedback, and a compact height while the visual keyboard overlays it.
  Android uses the existing adjustResize activity behavior; iOS uses keyboard padding.
- Console following is optional. Live prompts reveal both the input and Send action,
  and viewport changes keep them visible. Running state and Stop stay in the toolbar.
- Draft feedback distinguishes pending edits, saved drafts, unsaved named-file edits
  and storage failures. The existing progress storage and execution worker are reused.
- Native working drafts now cross the bridge immediately; delayed full snapshots
  cannot overwrite newer keystrokes. Named saves remain explicit. Storage retry uses
  the existing provider, and the Android offline console is in the overflow menu.
- Explicit document switches reset undo history to prevent cross-file edits. Panel
  switches and same-document saves preserve it. Tabs support RTL-aware arrow keys,
  Home and End. While execution locks editing, the content is truly non-editable
  so tapping it does not request a software keyboard for a read-only field.
- Both themes use the same Python token categories. The light palette distinguishes
  strings from error output; measured token and Stop text contrast is at least 4.5:1
  in the reviewed browser. Small-screen headers and menus stay bounded, including
  virtual-keyboard layouts. Physical keyboard/IME and screen-reader QA is separate.

## Next increments (not implemented or claimed complete)

1. Persistent REPL sessions and broader browser/device input compatibility checks.
2. Expand the existing curriculum with the missing topics, reviewed multilingual
   theory, exercises, hints, quizzes and solutions; preserve all existing lesson IDs.
3. Add the ten requested projects with meaningful solution tests and progress-based
   unlocking, then derive Python achievements, streaks and skill statistics from
   demonstrated progress. Do not mark lessons complete merely for running code.
4. Translations for detailed guidance, physical device accessibility/keyboard QA
   and an explicit offline runtime caching strategy.

## Validation

Run the Python tests with `node --test tests/python-*.test.cjs` from this directory.
`PYTHON_EXECUTABLE` can select a local CPython executable for wrapper tests.
`node scripts/smoke-python-browser.cjs` launches a separate headless Chrome profile,
downloads the runtime and verifies actual WebAssembly execution and isolation.
`CHROME_PATH` can select the browser executable. This test uses no account credentials.

See the immutable Change History follow-up for actual results, remaining failures
and untested limitations. No deployment, production configuration or data migration
is part of this change.

Implementation references: [Pyodide worker documentation](https://pyodide.org/en/0.27.7/usage/webworker.html),
[Pyodide streams](https://pyodide.org/en/0.27.7/usage/streams.html),
[CodeMirror reference](https://codemirror.net/docs/ref/).
