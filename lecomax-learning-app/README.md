# L’ECOMAX Learn

**7 October 2026 audit:** see [findings and unresolved release gates](docs/SENIOR-AUDIT-2026-10-07.md), [every web → mobile mapping](docs/LESSON-COMPARISON.md), and [audited build delivery](docs/AUDIT-DELIVERY.md). The mobile AI endpoints currently return 404 in production; local implementation is not a deployed service. Counts below describing the original delivery are historical.

A standalone React Native / Expo Router programming school, separate from the
storefront in `mobile/`. Arabic is the default; UI, original academy and localized
courses support Arabic, English and French. There is no WebView screen.

## Run

```powershell
cd lecomax-learning-app
npm ci
npm start
```

For a connected Android emulator/device: `npm run android`. For the web QA
preview: `npm run web`. Content, source snapshots, notes, progress, quizzes and
bookmarks work without a website connection. AI requires Internet.

When `.env.local` points `EXPO_PUBLIC_LEARNING_API_URL` at
`http://127.0.0.1:3002`, `npm start` and `npm run web` verify the login database
and start the local learning API before Expo. An already-running API is reused.
Keep this command running while using the app; it stops the API it started when
you exit. If database access fails, startup prints an error instead of opening a
login screen that cannot connect. Allow database network access in your terminal.
Remote API configurations are left as configured. This launcher does not enable
the optional local terminal lab; use its dedicated launcher when needed.

## Validate

```powershell
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform web --output-dir dist-web
node scripts/runtime-smoke.cjs
```

The DOM smoke test uses a disposable local JavaScript DOM and a mocked offline
network. It is not an Android instrumentation or pixel-layout test.

The resumed [native Android validation](docs/ANDROID-VALIDATION.md) passed on an
API 36 x86_64 emulator, including quiz completion, notes/bookmarks/progress after
force-stop, and offline startup with saved language/theme. The separately signed
`artifacts/lecomax-learn-1.0.0-x86_64-test.apk` is for emulator testing; use the
ARM64 APK for phones. Physical ARM64 launch remains unverified.

## Content and provenance

`docs/inventory.json` inventories original exports before normalization.
`docs/migration-report.json` gives exact per-group counts. The collection includes
48 original academy modules and all 192 academy lessons in three languages,
beginner courses, Next.js/Python/backend guides, daily lessons, shop missions,
100 Code Quest levels, 102 Arabic micro-lessons and historic Guide/Debug/Cours/
Mentor content extracted from inside the original React components.

The complete bundle has 109 groups and 1,363 entries. These are **lessons plus
reference entries**, not 1,363 newly authored full courses. It preserves 659
existing multiple-choice questions; the new error trainer adds three exercises.
The glossary provides 26 flashcards. Historic content without translations keeps
its original language; notably the micro-lessons are Arabic and some legacy
guides are French. Some original Code Quest Arabic fields contain English.

Refresh from the parent repository with `npm run content`. This reads only
allowlisted source files, scans embedded credential patterns, omits sensitive
files, redacts credential-like literals in historic examples and generates lazy
module loaders. Per-file SHA256 hashes distinguish snapshots from live code.
Actual code is displayed separately from preserved teaching examples. Source
line explanations use the website's own source-code-guide implementation.
Generated data is included in the app; the parent site is not required at runtime.

## AI Teacher backend

New website endpoints:

- `POST /api/learning-mobile/auth`: exchanges an owner email/password through
  Supabase Auth and returns its short-lived access token. Passwords are not stored.
- `POST /api/learning-mobile/teacher`: verifies that token with Supabase and checks
  the confirmed owner's email before any source retrieval or model call.

The Android token lives in SecureStore. Web preview keeps it only in memory.
Expired tokens require sign-in again. The existing server-side OpenAI provider
uses the Responses API with `store: false`. At most two relevant source excerpts
are retrieved automatically; an explicit file narrows to that file. Request size,
roles, paths, mode and language are validated. Secret detection runs before the
provider and before returning its answer. Request timeouts and recoverable error
states are included. Existing sensitiveRateLimit supports shared Redis counters;
without Redis its in-process fallback is not a distributed quota.

Deploy these new routes and tracing configuration to lecomax.com before expecting
the APK's AI sign-in to work. Existing `OPENAI_API_KEY`, `OPENAI_MODEL`, Supabase
server configuration and owner email stay on the server. No OpenAI key belongs
in Expo variables or the APK. A live owner sign-in/model response has not been
tested using the user's credentials.

## APK

`eas.json` includes an internal `preview` profile with `android.buildType: apk`.
Android package: `com.lecomax.learning`; name: `L'ECOMAX Learn`.

The preview profile uses the dedicated local signing identity in the ignored
`credentials.json` and `.credentials/learning.jks`. Preserve both privately for
future updates. A new checkout can create its own identity with
`node scripts/android-credentials.cjs` (requires a JDK); replacing an existing
identity prevents installing updates over the old app.

After signing in to Expo and linking this **new** app (not the storefront project):

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

With EAS CLI installed, the exact equivalent is:

```powershell
eas build --platform android --profile preview
```

See the [Expo APK build guide](https://docs.expo.dev/build-reference/apk/) and
[Responses API documentation](https://developers.openai.com/api/reference/resources/responses/methods/create).

For local Windows builds use a real short directory without spaces/apostrophes,
for example `C:\Temp\l7`. A substituted drive can mix canonical roots
inside Expo autolinking and is unsuitable here. Run Expo prebuild then Gradle
assembleRelease with JAVA_HOME and ANDROID_HOME set. The release-signing config
plugin now reads the existing local signing identity during Gradle signing.
Missing signing credentials must fail the release build; they must never fall
back to the Android debug key. Credentials are never serialized into Expo config.

## Reminders and local storage

Reminders are opt-in, disabled by default, 9am–8pm only, capped at three a day.
Settings schedules fourteen future notifications; re-enable to renew. Daily mode
uses 10am. OS notification permission is required. Tapping opens the related lesson.
Notes and progress use versioned AsyncStorage with serialized writes, validation,
visible read/write errors and explicit reset confirmation. Export uses the native
share sheet. Exercises check required text where available; there is no arbitrary
JavaScript execution on the phone.

## Mobile AI teacher

The teacher now has a fixed composer, a scrolling conversation, readable Markdown
and copyable code blocks, topic/level controls, follow-up prompts, and cancellable
requests. It teaches general programming as well as selected project files. All
lesson screens can open the teacher, including standalone Python lessons.

The server uses `OPENAI_TEACHER_MODEL` (default `gpt-6-astra`) with medium reasoning
through the OpenAI Responses API. `OPENAI_MODEL` still controls the other existing
workloads. `OPENAI_API_KEY` stays in the website server environment, never Expo.
The actual model is shown in Personalize after a successful response. Incomplete
provider replies are rejected, and failed/cancelled requests preserve the draft.

For local development, start the website backend from the repository root:

```powershell
node node_modules/next/dist/bin/next dev --port 3002 --hostname 127.0.0.1
```

Then start this app in another terminal:

```powershell
$env:EXPO_PUBLIC_LEARNING_API_URL='http://127.0.0.1:3002'
npm.cmd run web -- --port 8083 --localhost
```

This URL is for a browser on the development computer. A physical phone needs
a reachable backend address. Without the override, the app uses `https://lecomax.com`.
Deploy the updated website API before a production app can use the new teacher
prompt/model. No production deployment or APK update is included in this change.

Validation: `npm run typecheck`, `npm run lint`, `npm test`, and
`node scripts/teacher-mobile-smoke.cjs` (mocked API; Arabic/French/English and
320/390/768px layouts plus a short viewport). Set `PLAYWRIGHT_MODULE` if needed.
`node scripts/verify-teacher-provider.cjs` makes one real, billed OpenAI request
using a synthetic Arabic lesson question, and saves its answer under `artifacts/`.

Model reference: [official OpenAI GPT-6 Astra documentation](https://developers.openai.com/api/docs/models/gpt-6-astra).

## Website integration

Added: two mobile API handlers and `lib/learning-mobile-auth.ts` /
`lib/learning-mobile-validation.ts`.
Modified: `tsconfig.json` excludes this standalone application;
`next.config.js` traces the source catalog into the new teacher endpoint;
`.vercelignore` excludes the standalone app from website uploads.
Existing storefront, admin UI and mobile storefront files were not rewritten.
