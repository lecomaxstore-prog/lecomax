# L’ECOMAX Learn — senior engineering audit

Date: 7 October 2026. Target: `lecomax-learning-app`, compared directly with `app/admin/how-it-was-built` (the actual repository route), its course/learning datasets, inline page curricula, `lib/micro-learning-curriculum.ts`, `lib/ai-tutor-course.ts`, and `lib/site-learning.ts`.

**Verdict: substantially repaired, but not ready to call a fully polished, production-connected educational product.** The mobile AI endpoints return HTTP 404 in production. Several inherited course groups still need deeper teaching and translation work. Current-device visual/native interaction validation is not complete. Passing the compiler does not resolve those findings.

## Evidence and lesson coverage

See [every web-to-mobile mapping](LESSON-COMPARISON.md), [machine-readable comparison](lesson-comparison.json), [source inventory](inventory.json), and [migration totals](migration-report.json). Regenerate with `node scripts/migrate.cjs` then `node scripts/compare-lessons.cjs` from the app directory.

| Web source | Mobile destination | Result |
| --- | --- | --- |
| Academy manifest, 48 modules / 192 lessons | Original module and lesson IDs | All 192 present in Arabic, English and French; original quizzes and code excerpts compared against source |
| Beginner path, 10 lessons | `start-*` | Present; restored guided practice and answer-specific feedback |
| Backend, Next.js and Python guides, 41 chapters | `guide-*` | Present; six-question teaching sections added |
| Daily lessons, 14 | `daily-*` | Present; vocabulary and anchored code readings restored |
| Learning studio, 12 | `studio-*` | Present; annotated readings and coaching restored |
| Shop missions, 5 | `build-*` | Present |
| Code Quest, 100 | `quest-*` | Present; text checks are not execution or compilation |
| Micro-learning tips, 102 | `micro-*` | Present; original Arabic content explicitly identified |
| Inline programming courses, 31 | `ref-page-tsx-CoursSection_modules-*` | Present; preserved French source identified |
| Inline mentor lessons, 14 | `ref-page-tsx-MentorSection_curriculum-*` | Present; exercises promoted into Practice; quiz answer removed from reading stage |
| AI curriculum, 55 topic records | `ref-ai-tutor-course-ts-TUTOR_LESSONS-*` | Present as topic references, **not 55 fully authored lessons** |
| Seven site-element teaching cases | `site-element-*` | Missing previously; added, including header/footer/link/image/interaction/structure/hero |
| Glossary, 26 terms | `glossary-*` and existing glossary/flashcards | Corrected structured entries added; original tuple-derived IDs retained for old saved links |

There are **583 explicit lesson/topic/case mappings**, including the 55 AI topic records. No missing IDs remain in that enumerated source inventory. There are **1,396 total retained records**, split into **528 course records, 592 references and 276 archived records**. The old total of 1,363 was not an honest count of authored lessons. Colors, icon settings, language flags, duplicated derived arrays and navigation records contributed to that number.

Archives are excluded from search and the normal learning path. Home progress counts course records. Existing IDs remain resolvable so old notes and bookmarks are not thrown away. Archives are still accessible from the path's Archives filter. This preserves compatibility; it does not certify archived material as educational content.

The dynamic web element-selection experience and authenticated historical AI conversations are not static lessons. The seven element teaching branches are migrated, but a live storefront inspector and web/server progress synchronization are not implemented by this mobile export.

## Defects fixed

| Severity | Verified issue | Change / evidence |
| --- | --- | --- |
| High | Save Retry reloaded storage after a write failure, potentially replacing newer in-memory notes with stale data | Retry now requeues the current state. A runtime test injects a storage failure, verifies the old disk value, retries and verifies the newer note survives |
| High | Local release Gradle configuration signed with the debug identity | Dedicated release configuration and persistent Expo config plugin read existing private build credentials; no debug fallback. EAS preview and production both use the existing local identity |
| High | AI owner identity silently defaulted to a hard-coded email | Mobile auth now requires configured `ADMIN_EMAIL`, validates confirmed Supabase identity and handles malformed upstream JSON without exposing internals |
| High | Mobile AI could use only per-process rate counters in production | Mobile routes now require shared rate limiting in production and fail closed if missing. Existing non-mobile callers keep their previous behavior |
| Medium | Daily code and studio annotated readings were discarded or relegated to generic references | Restored in the actual Read code stage with original explanations |
| Medium | Generic inline mentor flattening exposed quiz explanations before taking the quiz | Quiz material is omitted from the reading dump; original exercises are available in Practice |
| Medium | Six core teaching questions were scattered or absent | Explicit What / Why / Where / How / Failure / Modify panels added to 281 lessons, using existing source-specific teaching rather than claiming generated filler is authoritative |
| Medium | Duplicate and implementation-only records inflated progress and crowded the path | Separate Courses / References / Archives; course-only home totals; descriptive names for major reference collections |
| Medium | Restart lesson did not restart quiz answers/completion | Clears that lesson's answers/completion and stage; preserves notes and exercise draft |
| Medium | Completion trusted a persisted correctness boolean | Completion compares the saved choice with the current question's correct answer |
| Medium | AI draft and conversation vanished on remount/restart | Bounded local history and draft persistence, clear conversation control, old backup migration, server-returned source citations preserved |
| Medium | A slow AI response could clear a newly edited draft | Clears only the draft that was actually submitted |
| Medium | Partial provider streams could be shown as successful | Incomplete/error events and oversized responses fail with a recoverable error |
| Medium | Backup export had no restore path | Added validated JSON restore with explicit replacement wording; malformed data leaves existing state unchanged |
| Medium | Progress validation accepted arrays as dictionaries and negative quiz indexes | Strengthened validation and regression tests; legacy version-1 exports still load |
| Medium | Error-trainer wrong answers did not render in Review mistakes | Trainer questions are now resolved alongside lesson questions |
| Medium | Arabic search differed for alef variants, diacritics and tatweel | Added normalization; existing French accent normalization retained |
| Medium | Long button labels could overflow narrow layouts; keyboard could obscure fields | Constrained/shrinkable buttons and keyboard-avoiding page wrapper |
| Medium | Code tokenizer mishandled escaped strings, multiline comments and inserted spaces | Offline lexer preserves exact code; highlights strings, comments, numbers and common JS/TS/SQL keywords. Preservation tested |
| Medium | Explorer imports were text only; changing file could retain pagination | Internal imports resolve to navigable offline files; file route remount resets pagination; unsupported teacher file types are disabled |
| Medium | Release requested unrelated storage/overlay permissions | Blocked via Expo configuration; regenerated manifest uses removal directives |
| Low | Lint included disposable emulator capture scripts | Excluded `.android-qa` and credential directories |
| Low | EAS upload could include emulator/artifact directories | Added explicit exclusions |

## Feature verification

| Area | What was actually checked | Remaining limits |
| --- | --- | --- |
| Quizzes | All 659 imported questions, all three locales: question/options/explanation, answer index bounds; all academy quizzes deep-compared to web; correct answer/completion runtime flow; retry and error review logic | Content tests cannot prove every distractor teaches well. Many source references and micro-lessons have no quizzes. No invented quizzes are counted as migrated |
| Progress / notes | Actual AsyncStorage web adapter, note entry, completion, remount and full restart; write-failure recovery | Device-local, no cloud/web sync; cannot guarantee a write interrupted by immediate OS termination |
| Bookmarks | Lesson bookmark saved and restored; code bookmarks retained by lesson/file/collection | Code bookmarks identify the containing lesson/file, not an exact arbitrary selection |
| Backups | Strict import validation, legacy upgrade, explicit restore UI | Export can include personal notes and teacher conversations; no automatic cloud backup |
| Search | Offline generated content index and file results in runtime test; archive exclusion and Arabic normalization | Large static index; no measured low-end-device typing benchmark |
| Explorer | 594 source snapshots: SHA256 integrity, exact current repository contents, valid reverse links; viewer runtime flow; internal import navigation | Snapshot ships with APK and is readable by anyone holding it. It is not live project code. Excluded/missing source paths show an explicit unavailable state |
| Arabic RTL | Text/row/progress direction inspected in components; Arabic default UI and code LTR verified in runtime representation | No fresh physical-device visual sign-off; some inherited Arabic lesson annotations contain English, and French historical courses remain French |
| Dark mode | Shared color palettes, runtime theme switch, persisted restart | No comprehensive visual contrast audit for every screen/device/font scale |
| Offline | All lesson/source JSON uses static bundled loaders; runtime fetch disabled while learning/search/notes work | AI requires internet; no offline AI model |
| Highlighting | Exact-code preservation test; multicolor offline lexer and annotations | Deliberately a small lexer, not a complete language parser |
| AI Teacher | Input validation, owner gate, rate-limit ordering, relevant source bounds, secret rejection, stream errors, draft persistence | Live `/api/learning-mobile/auth` and `/api/learning-mobile/teacher` both returned **404** to empty unauthenticated POST probes. No real owner login/model response was claimed |

## AI security and secret extraction

The provider key is read only by server-only `lib/ai-tutor-provider.ts`. The APK calls the website proxy and stores the owner's short-lived access token in SecureStore on native platforms. Web preview keeps that token in memory. Email/password login is sent to the HTTPS backend and the password is cleared after success. There is no provider API key configured in Expo public runtime configuration.

The server verifies Supabase identity and owner email before source access, bounds messages/history/source paths, rejects traversal and client-supplied system roles, checks incoming source/output for sensitive content, limits source context and provider output, sets no-store responses, and never executes the learner's code. Mobile production calls now fail closed without shared Redis rate-limit configuration.

`scripts/audit-secrets.cjs` scans application/content files against known private `.env.local` values without logging them. `scripts/audit-apk.ps1` inspects **every decompressed ZIP entry** in each target APK using UTF-8 and UTF-16, compares known private values, checks common credential patterns and rejects private-file paths. Results and hashes are in [apk-secret-audit.json](apk-secret-audit.json).

**No known private environment value or common private-key/token pattern was detected in the scanned APKs.** This is evidence about those exact artifacts, not a mathematical guarantee against unknown, transformed or encoded secrets. APK obfuscation is not a secret store. Bundled project source is intentionally extractable; access tokens obtained later on a compromised/rooted device are a separate threat model.

## Checks run

- Mobile TypeScript: `npm.cmd run typecheck` — passed.
- Mobile ESLint: `npm.cmd run lint` — passed.
- Root/backend TypeScript: `node node_modules/typescript/bin/tsc --noEmit --pretty false` — passed.
- ESLint on changed backend auth/teacher/validation/rate-limit files — passed.
- Mobile regression suite — 19 tests passed.
- Related website AI tutor, source context and source library suites — 20 tests passed.
- Existing security-hardening suite, including shared limiter behavior — 8 tests passed.
- Expo dependency compatibility — up to date.
- Expo Doctor — 21/21 passed on the initial check. Final rerun status is recorded in the delivery notes.
- Expo web production export — passed; uncompressed bundle approximately 46 MB.
- Runtime smoke — 14 checks passed, including offline flows, full restart and injected storage failure; see [runtime-smoke.json](runtime-smoke.json).
- Native Gradle release build — successful for ARM64 and x86_64. Final artifact/signature information is in the delivery notes.

The current computer-use browser inventory was empty. A native Chrome inspection attempt reached an app-approval timeout. Therefore, this audit does **not** claim fresh screenshot-based visual acceptance or fresh emulator interaction coverage. Existing 1.0.0 screenshots and Android validation remain historical evidence only.

## Unresolved release gates — do not call these complete

1. **Deploy and authenticate the mobile AI backend.** Both production endpoints returned 404. The relevant local changes are reviewable, but this audit did not publish the heavily modified website workspace. Deployment must include owner/Supabase/OpenAI configuration, source snapshot tracing, and shared Redis rate limiting; then verify actual owner login and model response.
2. **Finish editorial teaching coverage.** Six-question panels cover 281 lessons. Code Quest, micro tips and older inline courses are still uneven; original material is preserved, not falsely promoted to six-part instruction. The comparison marks records needing expansion. Generic annotations inherited from the web and older sample code still require topic-by-topic revision against the current implementation.
3. **Complete language coverage.** Arabic UI support is not the same as fully translated Arabic teaching. Arabic-only micro content and French historical material are now disclosed instead of silently presented as translated. Some original Code Quest Arabic annotations are English.
4. **Run current native visual/device acceptance.** Test fresh APK on ARM64 hardware and a narrow Android emulator: keyboard, large text, rotation, code scrolling, RTL, dark mode, real notification delivery and startup/memory cost. The offline catalog is large; a successful build does not prove low-end-device performance.
5. **Define cross-device learning scope.** Progress/notes/history are local with manual export/restore. They do not sync with existing web learner progress or server AI history. The mobile app is an offline companion, not full behavioral parity with the web inspector/editor.

No existing storefront functionality was intentionally removed. Changes outside the learning app are limited to the mobile auth/teacher routes and their auth/rate-limit helpers. The shared rate-limit change is opt-in; existing callers retain their original fallback behavior.
