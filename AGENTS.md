# Persistent change reports

For every application modification in this repository:
- Add a clear report to the learning app's visible Changes Made / Change History system.
- Read `lecomax-learning-app/docs/change-history.md` for the schema and append command.
- Append one report per coherent change, not per keystroke. Include additions, modifications, removals and fixes; affected pages, components and actual files; UTC timestamp; status; actual validation and untested limitations.
- Create a needs-testing report before validation when appropriate. Append a linked follow-up for verification, failure, correction or rollback. Never rewrite or remove an existing report.
- Use `node lecomax-learning-app/scripts/change-report.cjs --append <report.json>`; do not manually replace the manifest.
- Verify with `node lecomax-learning-app/scripts/change-report.cjs --check`.
- Only include a preview when checked, and distinguish the current app from a historical snapshot. Do not invent test outcomes, timestamps or deployment status.
- Preserve all previous reports in `lecomax-learning-app/changes/` and the generated manifest. No truncation, expiry, reset or deletion.
- In the final response include a **Changes Made** section: concrete changes, affected areas, validation status, and the history/preview link when available. Never respond only “Done” or “Updated.”
- These requirements apply to future sessions and changes to learning frontend, backend, authentication, content and design. They do not authorize deployment.
