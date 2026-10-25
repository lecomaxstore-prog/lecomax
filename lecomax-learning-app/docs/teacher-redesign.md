# AI Teacher redesign — 2026-10-07

Only the Expo AI Teacher experience was redesigned. The existing authentication service, owner-only API, request validation, cancellation, local conversation/draft storage and bottom navigation remain in place.

The screen now opens with a compact header and four starter questions. Suggestions fill the composer. Sending while signed out opens a dismissible login sheet and retains the draft. Preferences and conversation reset use separate sheets. Reset still requires confirmation.

Five small mode controls map to existing server modes: Explain → `simple`, Code → `feature`, Debug → `debug`, Learn → `teach`, Project → `project`. Code explanations use `lines`. The beginner switch updates the existing saved learner level and is passed to the teacher API.

The mobile refinement places these controls in a bottom sheet reached through the selected-mode pill or plus button. The welcome suggestions form a compact two-column grid with responsive spacing. The composer grows from 48 to 104 pixels for multiline text, highlights focus and shrinks when cleared. A floating latest-message action helps navigate long conversations. The header uses smaller typography on narrow phones, and sheets have a visual handle with wrapped mode controls.

Assistant answers render without an enclosing card. Markdown headings, lists, tips, isolated inline code and highlighted horizontally scrolling LTR code support longer explanations. Code can be copied or moved into a line-by-line explanation prompt. Responses also offer copy and three follow-up prompts. The real API returns a complete answer; no simulated streaming was added.

## Verification

- TypeScript and full configured ESLint: passed.
- Existing application tests: 34 passed, including auth, source boundaries, cancellation, parser and storage tests.
- `scripts/teacher-mobile-smoke.cjs`: Arabic, French and English; 320×568, 390×844, 768×1024 and 390×480 viewports; deferred login, draft retention, topic/level/mode request payloads, code explanation, failed request, cancellation and reload persistence passed.
- `scripts/teacher-reading-smoke.cjs`: long Arabic answers, light/dark themes, horizontal overflow, pinned composer, and cancellation/confirmation of conversation reset passed.
- Expo Android and iOS production exports with Hermes bytecode: passed. Output is ignored at `artifacts/teacher-native-export/`.
- Screenshots inspected in `artifacts/teacher-ar-welcome.png`, `teacher-ar-conversation.png`, `teacher-ar-light-reading.png`, and `teacher-ar-dark-reading.png`.

Browser authentication and teacher replies were mocked for deterministic UI verification. No live OpenAI request or real account login was made. Native keyboard and safe-area behavior retain React Native keyboard avoidance, safe-area insets, Android `adjustResize`, and the existing keyboard-sensitive tab bar. Native device interaction was not tested; successful native export is not a substitute for an on-device keyboard check.

To rerun browser checks, start Expo web, set `TEACHER_PREVIEW_URL` to its local URL, and run both smoke scripts. `PLAYWRIGHT_MODULE` optionally specifies an installed Playwright module path.
