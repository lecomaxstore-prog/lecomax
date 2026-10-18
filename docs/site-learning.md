# Learn from your actual site

Open `/admin/how-it-was-built/#site` on localhost or the deployed site with the normal owner login and learning-area unlock. The site preview is the default; the three backend guides are available in their own mode.

- Tap a visible element to open a lesson with its original source file and line.
- **Comprendre** explains what the element does and why that pattern is useful.
- **Le code** shows the actual source; tap a line for the existing line-by-line guide.
- **Fichiers & données** explains the file's role and lists recognized imports, importing files, API paths, database tables, Storage buckets and browser-storage keys. Every entry links to its source line. Related files open in the same reader; a back button returns to the previous file.
- Tapping an image also shows its rendered resource path, with query strings and credentials removed. The path alone does not establish physical storage.
- **À toi** offers a short question. Mark understood to keep progress in this browser.
- **Mon site** closes the lesson and returns to the preview. The native dialog supports Escape and keeps keyboard focus inside the lesson.
- Choose another page, or use **Explorer la page de ce lien** inside a link lesson. Inspection intercepts clicks and form submissions instead of performing store actions.
- **Fichiers** opens the complete existing private source library.

## How the mapping works

`scripts/source-inspector-loader.cjs` runs in the Next.js webpack pipeline for development and production. It adds relative file and original-line attributes to JSX DOM elements and Next.js Link/Image elements while compiling. It does not expose file contents or edit source files. Admin and API files are excluded.

`lib/site-source-inspector.ts` reads those markers only inside the preview. Text, icons, links, fields, and sections can therefore map to their own lines, rather than all pointing to a section's opening tag. External widgets may only map to a containing component; lessons label that fallback.

`lib/site-learning.ts` supplies beginner explanations for the observed element type and specific header/hero patterns. These are reading guides, not an automated proof of all application behavior. The source library retains its existing owner/PIN checks and secret filtering. Progress stores only file/line identifiers, with no account data.

`lib/source-connections.ts` parses the requested source with the TypeScript parser. It ignores comments and string examples, resolves links only to files already in the filtered private library, and never executes the source or queries the database. References describe the entire file, not a proven data-flow trace for the selected element. Computed paths and unrecognized calling patterns remain explicitly unresolved. Results are bounded to 36 references, including at most six importing files.

## Verification

The **Learn step by step** home includes a personal learning desk with estimated 5/15/30-minute sessions, goal-based lesson shortcuts, lesson bookmarks, a searchable notebook and notebook downloads. The backup panel exports/imports only the beginner studio's `lecomax-site-code-learning-v1` progress (the 12 introductory lessons and its projects), not all academy or mission stores. Imports are parsed locally, bounded to 300 KB, schema/version checked, previewed before merge and normalized. Current nonempty notes, drafts, review schedule and current lesson take precedence; imported milestones and bookmarks are combined. Existing storage and note-count limits remain in effect. A backup does not upload to a server or record course completion remotely.

The inline **Ask AI teacher** panel is available in guided academy lessons, full academy sections, the twelve beginner lessons, practical missions and the site source reader. It sends a bounded lesson context plus the selected file/line or anchor to the existing protected `/api/admin/learning-assistant` endpoint only on explicit submission. Follow-ups retain a bounded conversation. It supports French, English, Arabic and Darija, source citations, cancellation and recoverable error states. Conversations are held in page memory and reset when the selected lesson/source changes; they are not added to browser progress storage. Actual answers require the existing server AI configuration and owner unlock.

Beginner lessons also offer a prediction-and-explanation activity and a notebook saved through the existing learning progress store.

Practical missions now remember the current mission, checked steps, quiz success and notes in `lecomax-practical-missions-v1` in this browser. Completion requires every step to be self-reported as tried and the quiz answered correctly; it does not certify that a server or deployment was verified automatically. Focus mode shows the next unchecked step. Learners can expand all steps, revisit missions, copy commands, export their notes as text and open troubleshooting help. Storage and clipboard failures show a recovery message. French, English and Arabic share the same progress.

The preview opens by default, including at `#site`. Below it, four practical missions cover running the local server, tracing the existing categories API to Supabase, saving a selected change to GitHub, and deploying a Vercel preview. They are available in French, English and Arabic and open actual files in the protected source reader. Commands are instructions only; the learning interface does not execute them or publish changes.

Publication guidance links to the official GitHub and Vercel documentation. Use a working branch and review the selected changes before publishing; the workspace may contain other unfinished work.

- `node --test tests/site-learning.test.ts`
- `scripts/smoke-site-source-inspector.mjs`: real public local page, mapping and action interception; checks private code remains denied without login.
- `scripts/smoke-site-learning-ui.mjs`: isolated mobile component test with explicit source fixtures, not a bypass of the admin login. Set `AGENT_BROWSER_BINARY` to the agent-browser executable and `ESBUILD_MODULE` to an installed esbuild module. Optional `LEARNING_SCREENSHOT` saves a screenshot.

Use `npm.cmd run dev` on Windows if PowerShell blocks `npm.ps1`. The server needs normal network access for store data.
