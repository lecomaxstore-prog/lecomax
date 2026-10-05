# Academy continuation — 5 October 2026

The existing guided reader retains one content block per reading card and restores the learner's position. This continuation adds a bounded, browser-local practice draft, requires an initial attempt before solution comparison, and restores Academy completion marks after reload. Existing course content and the full reference reader remain available.

Validation completed:

- TypeScript and targeted lint pass.
- Final production build passes with exit code 0. Existing lint warnings and restricted-network fetch warnings remain in the build log.
- Thirteen focused learning tests pass.
- Chrome browser smoke checks pass at mobile (390px), tablet and desktop sizes, including French/Arabic switching, RTL, navigation, copy, hints, quizzes and Code Game checks.
- Added browser coverage verifies that solution comparison is unavailable before an attempt and that the practice draft survives reload.
- Updated the smoke setup to explicitly choose French, accommodating the existing Arabic default. Updated the mobile layout expectation to match the existing scrolling mobile header.
- Removed the obsolete course validator prohibition on browser-local progress, which conflicts with saved learning progress.

Deployment remains pending: the configured Vercel CLI account returns `Error: Not authorized` from `vercel.cmd whoami`. The user has been asked to log in. No deployment was published during this continuation. The workspace contains extensive pre-existing changes; none were reset or discarded.
