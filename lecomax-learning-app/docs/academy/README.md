# Academy authoring

See the repository-root COURSE_IMPLEMENTATION_PROGRESS.md for the current checkpoint and exact next steps. Read CURRICULUM_PLAN.md and COVERAGE_CHECKLIST.md before claiming a topic complete.

Add authored JSON to data/academy/lessons, then register it explicitly in registry.ts, catalog.json and coverage.json. Run npm run content:academy and npm test. Static imports make lessons available without network access once the app bundle is installed. Do not use generation of headings or repetitive boilerplate as course completion.
