# Persistent visual change history

At the user?s request, Change History is hidden from the dashboard and More menu. The legacy /change-history route redirects to Home. Continue appending reports and preserving the manifest and device archive; do not restore report visibility unless requested. The retained report components are not mounted in the app navigation.

## Storage and retention
- Immutable source reports: changes/<id>.json. Include these in source backups/version control.
- Generated app manifest: data/change-history.json. Every published app bundles every report.
- Independent device archive: AsyncStorage key lecomax.change-history.v1. On launch, merge shipped records with the device archive by stable ID. Older app builds cannot remove newer archived entries.
- No delete, clear, reset, automatic dismissal, expiry or retention limit. Resetting learning progress does not clear history.
- Conflicting IDs and corrupt archives produce a visible warning and are not overwritten. Retry is available. Bundled reports remain available if local storage fails.
- Clearing browser/app data or uninstalling can remove the device cache. The bundled/source reports survive, but device-only records require their corresponding source backup. This is not a cloud backup or a tamper-proof audit log.
- Source edits are reported by the developer workflow; the app cannot infer descriptions of arbitrary file edits. Root AGENTS.md and the always-applied editor rule require future reports. Deploy/rebuild updated code to deliver new reports to other devices.

## Append a report
Create a JSON file outside changes/ with these fields, then run:

```text
node scripts/change-report.cjs --append path/to/report.json
node scripts/change-report.cjs --check
```

The command validates the report, rejects duplicate IDs, writes a new immutable report file, and atomically rebuilds the bundled manifest. --rebuild recovers an interrupted manifest write from the original report files. If an interrupted writer leaves changes/.write-lock, verify no writer is active before removing that lock.

Required fields:
- id: unique lowercase letters/digits/hyphens, 3–100 characters.
- createdAt: actual UTC ISO timestamp ending in Z.
- title, summary: concrete user-facing descriptions.
- status: successful | failed | needs-testing.
- pages, components, files: non-empty arrays naming affected areas and actual source files.
- changes: array of { kind: added | modified | removed | fixed, detail }.
- validation: array of { name, result: passed | failed | not-run, detail }.
Optional: relatedId for a follow-up, retrospective: true for backfilled reports whose original modification time is unavailable, preview: { path, label, verifiedAt }. Preview paths must be internal routes with no query, external host or script scheme.

Never fabricate old modification times. A retrospective report shows its recording date. Never edit a prior status after testing: append a linked verification report. Successful means the stated checks passed, not that unrun device tests or a production deployment occurred.

The UI links to the current app, not an archived build. Preview verification timestamps do not guarantee a dev server stays online.

## Verification
Run npm run history:check, npm run typecheck, focused lint, and the change-history tests. Include meaningful interaction checks for expansion, files, statuses, links and archive retry/persistence.

The latest dashboard report starts collapsed with a two-line title and summary to keep learning content accessible. Expand it to read all details without truncation. Authored Arabic and Latin text use their own reading direction, independent of the interface language. Append and rebuild refuse to remove or overwrite any report already in the bundled manifest; restore missing source reports before retrying.

## Live development updates
Run `npm run web` (or `npm start` for Expo Go) inside the learning app. These commands clear inherited CI mode for the development server so Metro watches edits and Fast Refresh can update connected clients. Keep the development server running. Static exports and installed release builds do not receive local file changes. Some edits require an automatic full reload; Fast Refresh cannot preserve all temporary UI state.
