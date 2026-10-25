# Academy 2.0 implementation audit

## Existing architecture inspected

The repository contains a Next.js storefront/admin and API backend, a separate mobile storefront, and `lecomax-learning-app`: Expo 57 / React Native / React 19 / Expo Router. Keep those boundaries. The learning app has a reusable forest-green/light/dark design system, Arabic/English/French UI, safe-area and keyboard-aware pages, five tabs, offline indexed lessons, course/module routes, exercises, quizzes, notes, bookmarks, local reminders, export/import/reset, learning memory and delayed recall reviews. Practice includes Python, JavaScript, SQL challenges, a browser editor, local terminals and device/3D labs. These features must remain reachable.

The AI teacher already supports general subjects through a Next.js server boundary, validates inputs, uses server-only credentials, limits requests, rejects incomplete provider responses and preserves drafts on failure. Authentication is explicitly owner-only with a private Postgres session store. It is not a public multi-student identity service. Progress uses one validated AsyncStorage snapshot; it does not currently synchronize across devices.

## Findings

- Home hardcodes Zakaria and ZZ, assumes a programming course, shows zero statistics to newcomers and lacks onboarding or explicit goals.
- Content discovery is programming-heavy. Planned curriculum entries must not be presented as completed courses.
- Existing completion and independent-recall records are useful; opening a lesson must never imply mastery.
- Existing lesson stages and drafts support resume, but recent visits, preferences and topic goals need structured persistence.
- Study time currently counts any foreground authenticated time, including settings; new tracking should count learning destinations and exclude hidden web tabs.
- Search covers lessons, paths, terms and source files, but not notes, conversations or study tools.
- No evidence yet establishes that all legacy routes work on real devices. Large generated content and 3D runtime assets need a separate performance profile; do not claim measured improvements without measurements.
- Existing uncommitted repository changes are extensive. Preserve them and avoid unrelated rewrites.

## Target architecture and execution stages

1. Add a backward-compatible Academy data slice to the existing progress snapshot: editable learner preferences, goals, authored AI starter plans, history, feedback and recent searches. Keep all existing IDs and records.
2. Add onboarding, an honest subject explorer, personal learning overview and an evidence-based dashboard. Keep five tabs and retain legacy projects/curriculum via secondary routes.
3. Reuse static lessons and assessments. For custom subjects, request bounded structured starter lessons from the existing authenticated teacher, validate the whole response, save only complete plans, and label generated content and verification needs. Add a resumable player with exercises, feedback and quiz-gated completion.
4. Pass validated preferences to real teacher requests. Rank recommendations using goals, incomplete lessons, repeated mistakes and due reviews. Show explicit reasons and use delayed recall evidence instead of fabricated mastery.
5. Add analytics, search of personal material, favorites and progress history. Reuse existing reminder/theme/export/delete controls. Add an authenticated, revision-checked cloud backup boundary with a private migration; do not apply a database migration or deploy without an explicit task requiring it.
6. Validate data migration, malformed AI responses, recommendation behavior, completion gates, onboarding interactions, TypeScript, focused lint and change history. Record actual results and remaining setup below or in a follow-up verification document.

## Release boundaries

This work does not convert owner authentication into public student registration. New account enrollment, password recovery, institution roles and cross-account data isolation need a separate identity rollout. Cloud backup requires the supplied migration and the existing backend database configuration. AI requires the configured server provider and network. Generated lessons need subject-matter review, particularly specialized or changing topics. Audio preference can guide conversational teaching; it does not imply a new speech synthesis or recognition engine.

## Resumed validation — 2026-10-15

- Root and learning-app TypeScript checks passed. Focused ESLint on the Academy 2.0 TypeScript files passed.
- All 278 learning-app tests passed, including Academy onboarding, lesson completion gates, backup route validation, and change-history interaction tests. The separate backend backup/coaching selection passed all 11 tests.
- Refreshed the embedded source library (622 files), reviewed the boutique lesson source fingerprint against the current refresh hook, and repaired outdated curriculum, wellness, and source-location test fixtures. Existing behavior assertions remain in place.
- A fresh Expo web export passed to `dist-academy-resume-check`. Its main entry is 95,664,858 bytes (95.7 MB uncompressed). Export success does not establish acceptable loading performance; bundle size remains unresolved.
- Logs are in `artifacts/resume-tests-verified.log`, `artifacts/resume-backend-tests.log`, and `artifacts/resume-web-export.log`. Interaction checks use simulated DOM/native dependencies; no real-device or authenticated browser preview was verified in this resumed session.
- No database migration, live paid AI request, or deployment was performed. Cloud backup still requires database setup. Reports in Change History record the initial failures and linked verification without replacing prior records.
