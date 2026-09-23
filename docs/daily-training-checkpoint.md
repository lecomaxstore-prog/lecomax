# Daily training checkpoint — September 23, 2026

## Current experience: guided daily sessions

The user requested a simpler experience after the visual redesign. The default page now uses `DailySession.tsx`, not the earlier `DailyLearning.tsx` dashboard. It automatically chooses today's lesson and exposes one main action at each stage: welcome, explanation, exercise, and a question-by-question test. Every answer must be correct to finish. Incorrect answers show corrections and allow retry. Passing shows “You’ve understood it. See you tomorrow!” and previews the next lesson. The same-day success screen survives reload; the next Paris day opens the first uncompleted lesson. Missed days never skip content.

The path has 102 sessions: the 14 translated foundation lessons followed by 88 existing Academy lessons covering tools, Git, HTML/CSS, JavaScript/TypeScript, React, Next.js, databases, shop architecture, security, tests, web quality, deployment, and a final shop project. Academy modules load on demand into the same daily workflow. Course navigation is hidden on the daily landing screen to reduce choices; other course sections retain their navigation.

Progress uses `lecomax-daily-sessions-v2` in browser storage. Existing notes and validated quizzes are migrated from the previous daily learning storage when no v2 data exists. Attendance alone does not skip a lesson. Foundation quiz passes retain their existing reminder API synchronization; advanced progress is local. The browser smoke test mocks the completion endpoint to avoid changing real reminder records.

Validation: 21 focused tests and TypeScript passed. `npm.cmd run smoke:daily-training` passed welcome, restored reading step, practice gate, incorrect quiz, retry, success, same-day reload, next-day selection, automatic advanced lessons, Arabic, and mobile/desktop overflow. Screenshots: `.source-library/daily-session-welcome.png`, `daily-session-success.png`, and `daily-session-arabic.png`. This version has not been published.

## Earlier visual iteration (superseded on the daily screen)

The interrupted daily lesson redesign is present locally at `/admin/how-it-was-built/`, in “Commencer ici”.

The subsequent visual refinement adds a forest-green course introduction with a resume action, a grouped desktop syllabus with individual lesson states, a compact mobile lesson selector, an editorial reading panel, a dark source viewer, and attendance/history beneath the lesson. Styles are scoped in `DailyLearning.module.css`; the dashboard and syllabus live in `DailyDashboard.tsx`.

- Fourteen foundation lessons, each split into Understand, My code, and Practice.
- Short excerpts fetched from the protected project source library, with line explanations, vocabulary, why the code is used, and what would happen without it.
- An independent “I trained today” checkbox, seven-day history, saved notes, and next-day lesson selection. Training is stored in this browser using Paris dates. Quiz completion and reminder synchronization remain separate.
- French, English, and Arabic lesson content and a continuation into the full Academy.

Validation completed:

- 17 daily learning, training, interaction, and API tests passed.
- `npx.cmd tsc --noEmit --pretty false` passed.
- `npm.cmd run smoke:daily-training` checks the real local browser: attendance, reload persistence, source loading, line explanations, notes, undo, and overflow at 390px and 1440px.
- Mobile screenshot: `.source-library/daily-training-mobile.png`.
- Desktop and Arabic source screenshots: `.source-library/daily-training-desktop.png` and `.source-library/daily-training-arabic.png`.
- The browser check also verifies English switching and Arabic RTL layout. One run timed out loading the source excerpt during development; the complete repeat passed.

Run the browser check with the local development server running. It uses a temporary browser profile and local authenticated sessions. This work has not been published by the resumed session.
