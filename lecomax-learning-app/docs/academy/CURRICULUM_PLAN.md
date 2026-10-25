# Academy implementation and authoring contract

Requirements: original-request.md. All sixteen required tracks are enumerated verbatim in ../../data/academy/coverage.json. A track is not complete while any required topic lacks a reviewed, substantive lesson. Existing library modules are retained as supplementary learning, not silently promoted to complete academy tracks.

## Dependency order
1. Computer operation → files and paths → terminal and editor → algorithms → browser and HTTP.
2. Semantic HTML → accessible forms → CSS cascade and box model → layout and responsive projects.
3. JavaScript values → decisions and functions → collections → scope and objects → DOM/events → async/network → testing and performance.
4. Git basics can follow files; collaboration follows the first project. TypeScript follows JavaScript.
5. React follows DOM and functions. Next.js follows React, HTTP and TypeScript. Tailwind follows CSS.
6. Node/REST follows async JavaScript and HTTP. Relational data precedes authenticated database applications.
7. E-commerce combines frontend, APIs, database transactions, authorization, test payments and verified webhooks.
8. Expo follows React and APIs, then storage/offline/auth/device APIs, builds and publishing.
9. Quality and security are revisited throughout; professional deployment follows tested applications. AI independence exercises accompany every project.

## Content layout
One JSON file per authored lesson in data/academy/lessons. schemaVersion is explicit. Index/catalog integration uses static imports so Metro includes lessons offline. Each lesson includes prerequisite IDs, objectives, numbered explanation sections, annotated examples, increasing exercises with hints and worked solutions, quiz explanations for every answer, readiness checklist, recap and citations. Study time is reading words / 120 plus explicit practice minutes, rounded up; it is a study estimate, not a guarantee.

Substantial lessons require at least 1,500 explanatory words excluding code, quizzes, exercises and metadata. This is a minimum screening rule, not a claim of pedagogical quality. Review substance, prerequisite ordering, alternatives, failure cases and factual accuracy separately. Short prerequisite exceptions require a written justification. No generated repetitive paragraph padding. No template-only or title-only lessons appear in the academy catalog.

## Version evidence (2026-10-08)
Installed website packages inspected: Next.js 15.5.24, Tailwind CSS 3.4.19, TypeScript 5.9.3. Learning-app package requirements: Expo ~57.0.8, Expo Router ~57.0.8, React 19.2.3, React Native ^0.86.3; resolve installed versions before authoring version-sensitive lessons. Do not teach Next.js 16 proxy.ts as the installed Next.js 15 convention. Website database dependency is Supabase, not an assumed Prisma integration.

## Baseline inspection
Expo Router screens: app/(tabs), app/course/[id], app/module/[id], app/lesson/[id], app/search, app/file, app/my-site. services/content.ts resolves the bundled legacy JSON, university lessons, study skills and IPTV lessons. constants/courses.ts controls catalog order. School store and utils/progress retain completion, notes, bookmarks, drafts and quiz responses. GuidedReading supports one section at a time. CodeViewer and Quiz supply copy/annotations and answer feedback. Baseline navigation and persistence checks: 13 passed.

The repository has many pre-existing uncommitted changes, including the learning application. Never reset them. Baseline-depth.json records raw explanation word counts only; enhancements and source-reader content need separate evaluation. Native accessibility, offline cold start and APK operation are not established by source inspection.

## Website course boundaries
Actual website is at repository root. Inspect individual files before explaining them. Record source paths and SHA-256 fingerprints; flag source drift in tests. Exclude .env files, credentials and secret values. Deep-dive sequence: startup/config → root layout → storefront server page → catalog client → product data layer → cart → checkout → order API → admin authorization → payments/webhooks → deployment. Do not present the sequence as completed until all its lessons exist.
