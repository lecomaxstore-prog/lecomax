# Learning toolkit improvements — 2026-10-07

Updated the Learn app's More screen and course library:

- Compact header with direct settings access and clearer course/tool navigation.
- Search across French, English and Arabic course names and summaries; accent and Arabic diacritic normalization.
- All / In progress / Completed filters, result counts and a recoverable empty state.
- Resume card using saved progress, with lesson title and estimated duration.
- Start/continue actions open an unfinished lesson with the course parameter preserved.
- Course cards show completion percentages, lesson counts and curriculum access.
- Distinct tool icons and explanatory subtitles in all three languages.
- Existing RTL layout, light/dark theme tokens and saved progress format retained.

Validation:

- npm.cmd run typecheck: passed.
- npm.cmd run lint: passed.
- Course library tests: 6 passed.
- Course interaction test: passed (search, empty-filter recovery, continuation and curriculum navigation).
- Expo web export: passed; local output in dist/toolkit-preview.
- Full existing suite before adding the interaction test: 50/51 passed. The source snapshot test fails on app/api/admin/learning-assistant/route.ts, which was already modified before this work and was not edited here.
- Visual browser/device verification was unavailable because this session exposes no browser surface. No native APK was rebuilt or published.
