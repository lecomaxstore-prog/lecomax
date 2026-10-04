# Mon site → mon code

Entry point: `/admin/how-it-was-built/#site`, behind the existing owner authentication and workshop unlock.

## Repository findings

The web application uses Next.js 15.5, App Router, React 19, strict TypeScript, Tailwind 3 and CSS modules. `app/page.tsx` and `app/boutique/page.tsx` load storefront data on the server; interactive components run in the browser. `app/layout.tsx` installs shared providers, including `CartProvider`. Product pages use `app/produit/[slug]/page.tsx`. `lib/db-server.ts` reads products through Supabase. Checkout submits to `app/api/orders/route.ts`, which validates input and uses the `create_commerce_order` database function. Orders are visible in `app/admin/orders/page.tsx`. Authentication, private source access, PayPal integration and Vercel configuration remain in their existing modules. Environment variable examples are in `.env.example`; lessons must never embed secret values.

## Reused learning system

`SiteExplorer.tsx` already integrates `learning/LearningStudio.tsx`, with guided, explore and build modes. The studio contains twelve introductory lessons, eleven roadmap levels linked to the existing Academy, source reading through the protected source API, quizzes, prediction exercises, glossary, error guides, data flows, a restricted declarative playground, five projects and seventeen capstone checkpoints. French, English and Arabic content share one data structure. Advanced chapters reuse the existing course instead of duplicating it.

## Changes in this pass

- Added a compact responsive reading diagram to each introductory lesson. These diagrams summarize relationships; they are not executable traces.
- Persisted project attempts alongside progress, so switching modes or reloading does not erase the learner's explanation. Older stored progress receives an empty notes map. Stored notes are validated and bounded.
- Corrected the three-mode switch to use three equal columns, with smaller mobile spacing.

Progress is local to the browser (`lecomax-site-code-learning-v1`), not synchronized to an account. The playground parses a limited data exercise without evaluating JavaScript or writing commerce data. Project completion is a learner checklist, not automated certification.

## Validation

`node --test tests/learning-studio.test.ts tests/site-learning.test.ts tests/learning-source-context.test.ts` passes 13 tests, including actual lesson source anchors, course links, translated content, progress restoration and rejection of executable playground input. TypeScript and the learning directory lint pass. The production build compiles and generates all 235 pages, but the command returns exit code 1 with network fetch failures (EACCES) in the restricted environment; this is not a clean build validation. Existing lint warnings elsewhere in the application are also reported. Browser verification could not run: the available browser inventory is empty and agent-browser is not installed. Mobile and desktop visual review therefore remains outstanding.
