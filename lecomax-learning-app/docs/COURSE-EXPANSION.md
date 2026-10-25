# Course expansion

The eight existing course identities and existing lesson IDs are preserved. Specialized paths now include prerequisite modules and relevant testing, security, accessibility, and deployment lessons from the existing academy. Progress remains shared for lessons appearing in more than one path.

Each curriculum shows its starting point, intended outcome, study method, completion progress, and ordered modules. Course links carry a course parameter through module and lesson screens so previous/next navigation follows that curriculum and stops at its final lesson. Direct lesson links retain the existing default sequence.

Python now has 28 lessons: 4 setup lessons, the original 16-lesson guide, and 8 newly authored workshops. The workshops cover function contracts, collection lookup, CSV validation, data models, boundary tests, SQLite transactions, generators, and an inventory-report capstone. All new instructional text is available in Arabic, English, and French, with executable examples, exercises, solutions, and quizzes.

Source: `scripts/python-mastery.cjs`, registered in `scripts/teaching.cjs`. Regenerate offline content with `npm run content`. This expansion does not claim exhaustive coverage of every programming topic; independent practice is required beyond the estimated lesson time.

Validation:

- `npm run typecheck`
- `npm run lint`
- `npm test` — 28 tests including curriculum boundaries and localized content.
- `node scripts/verify-python-workshops.cjs` — executes all eight examples and exercise solutions; set `PYTHON_EXECUTABLE` if needed.
- `node scripts/mobile-layout-smoke.cjs` — Arabic/English UI, 320/390/768px layouts, curriculum navigation and final lesson boundary. Set `PLAYWRIGHT_MODULE` if Playwright is installed outside this app.

Validated against the local web app on port 8083. No mobile binary was built or published.
