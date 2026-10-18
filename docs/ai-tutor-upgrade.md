# AI Programming Tutor upgrade — 7 October 2026

The existing tutor at `/admin/how-it-was-built/ai-tutor/` is extended, with its owner authentication, learning PIN, streaming transport and Supabase storage retained.

## Experience

- Nine stages, 55 short AI-guided lessons: foundations, JavaScript, React, Next.js, backend, database, commerce, production and architecture. Each lesson prepares an editable question; the learner chooses when to send it. Completion is explicitly learner-reported, reversible and never gates another lesson.
- Arabic by default, with Darija, French and English explanation preferences. The selector is retained for this browser tab. The interface remains Arabic; individual answers detect their text direction, while code stays LTR.
- Recommendations prioritize unfinished lessons in a topic the learner marked for practice, otherwise the next unfinished lesson. The home offers the latest conversation, starter questions and real source examples.
- Session and saved-explanation search with topic filters. These search the latest 100 loaded sessions/bookmarks, not an unlimited archive. Drafts survive switching between conversations during the current mounted visit; code drafts are not written into browser storage.
- Simpler explanation, examples, project application, why, execution flow, hints, optional quizzes, explicit answer reveal and solution submission reuse the persisted-answer follow-up system.
- Mobile conversation viewport reserves space for the admin header and bottom navigation. Messages scroll independently; the composer grows to a bounded height and follows the visual viewport. Scrolling up pauses automatic following. Attachments are expandable. Desktop keeps the existing document layout.
- Escaped React Markdown, GFM tables, lightweight lexical highlighting for JS/TS/JSON/SQL/CSS, internally scrolling LTR code and copy controls. This highlighter is intentionally lexical, not a full parser.

## Architecture and project context

`AITutor` calls the existing owner-only `/api/admin/ai-tutor` routes. The message route validates input and language, reserves a durable turn, reads bounded history and learning signals, streams the existing Responses API, then emits completion only after saving the answer.

General questions no longer automatically receive an unrelated product excerpt. Project questions select up to three relevant paths using a bounded, multilingual keyword map; explicit file/line selection wins. The existing source library provides sanitized numbered deployment snapshots. Known entry points anchor product/checkout/order excerpts near their implementation. Missing automatic sources are reported as unavailable; invalid explicit selections fail visibly. This is deterministic retrieval, not semantic whole-repository search. The model must request missing evidence rather than invent connections.

The server prompt defines six simplification strategies from plain language through analogy, diagrams, tiny code and actual project examples. Recent confusion signals select a strategy; the model also adapts to learner attempts and topic-specific self-ratings. It does not execute student code, independently grade mastery, or modify project files.

Prompt/context separation follows the [official OpenAI prompt engineering guidance](https://developers.openai.com/api/docs/guides/prompt-engineering).

## Progress and storage

No additional migration is required **if the existing tutor migration is already applied**: `supabase/migrations/20261006150000_ai_tutor.sql`.

Course completion uses existing owner-scoped `ai_learning_progress` records with reserved topics `lesson:<validated-lesson-id>`. Completed rows have confidence 100 and a completion timestamp; undo writes confidence 0. The overview separates these into `completedLessons`; topic confidence, attempts and practice notes remain separate. This avoids changing existing tables or authentication. No automatic mastery claims are made.

## API protection and environment

Existing owner session, learning PIN, same-origin mutation checks, request-size limits, secret screening, database RLS, owner scoping, rate limits, per-owner active-turn reservation, provider timeout and sanitized errors remain in place. The OpenAI key stays server-side; requests use `store: false`. History remains limited to 12 completed messages / 24,000 characters; source context is bounded to three excerpts of up to 12,000 characters each. Existing 12-turn/15-minute, 80-turn/day and 100-user-turn/session limits remain; start another session when full.

No new environment variables. Retain `OPENAI_API_KEY`, optional `OPENAI_MODEL`, and the existing Supabase/admin configuration. `remark-gfm` is the only new runtime dependency in this upgrade.

## Files changed by this upgrade

- `app/admin/how-it-was-built/ai-tutor/AITutor.tsx`
- `app/admin/how-it-was-built/ai-tutor/TutorCourse.tsx` (new)
- `app/admin/how-it-was-built/ai-tutor/TutorMarkdown.tsx`
- `app/admin/how-it-was-built/ai-tutor/Tutor.module.css`
- `app/api/admin/ai-tutor/route.ts`
- `app/api/admin/ai-tutor/message/route.ts`
- `lib/ai-tutor.ts`, `lib/ai-tutor-course.ts` (new), `lib/ai-tutor-prompt.ts`
- `package.json`, `package-lock.json`
- `tests/ai-tutor.test.ts`, `scripts/smoke-ai-tutor.mjs`
- This document and the link in `docs/ai-tutor.md`

## Verification

Final local results:

- Production build passed, including TypeScript and 239 generated pages. Existing unrelated lint warnings remain; the tutor files introduce no lint errors.
- Full regression suite: 522 passed, 1 skipped, 0 failed; Android back-controller and scroll-return checks passed. After final UI corrections, all 14 focused tutor tests passed, including UTF-8 integrity.
- Expanded browser suite passed against the final production build on port 3100: all eight widths, language preference, course completion/reload, streaming, session switching, bookmarks, progress, safe Markdown tables, long code, copying, retries, composer/navigation clearance and browser key audit.
- Live provider check passed: connection, Arabic output and 51 streamed deltas. This was a short teaching request without database writes.
- Standalone `tsc --noEmit` and `npm run lint` passed. The initial network-restricted build could not fetch existing Google Fonts; the network-enabled build passed. Final browser verification used the production server after a stale development module cache caused hot-reload failures.

See the task's `tutor-upgrade-*.log` files for local results. Browser tests use fixture-backed learning writes and AI responses, with real protected local source previews. A separate short live OpenAI call checks Arabic and streaming without creating learning history. Database isolation/completion behavior is covered by API harness tests and the existing PGlite migration tests. Phone checks include 320, 360, 375, 390, 412 and 430px, plus tablet/desktop and a reduced keyboard-sized viewport. Real iOS/Android keyboard behavior still requires device testing; resizing a desktop browser is not that test.

## Future improvements

- Semantic retrieval and import/caller traversal beyond the bounded keyword map.
- Safe isolated code execution for objective exercise feedback.
- Paginated history and saved snippets with custom categories.
- Real-device keyboard testing and persistent cross-device language preferences.

These changes are local; this task does not deploy the site.
