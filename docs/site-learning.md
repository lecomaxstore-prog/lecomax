# Learn from the local site

Open `http://localhost:3000/admin/how-it-was-built#site` with the normal owner login and learning-area unlock.

- Tap a visible element to open a lesson with its original source file and line.
- **Comprendre** explains what the element does and why that pattern is useful.
- **Le code** shows the actual source; tap a line for the existing line-by-line guide.
- **À toi** offers a short question. Mark understood to keep progress in this browser.
- **Mon site** closes the lesson and returns to the preview. The native dialog supports Escape and keeps keyboard focus inside the lesson.
- Choose another page, or use **Explorer la page de ce lien** inside a link lesson. Inspection intercepts clicks and form submissions instead of performing store actions.
- **Fichiers** opens the complete existing private source library.

## How the mapping works

`scripts/source-inspector-loader.cjs` runs only in the Next.js development webpack pipeline. It adds file and original-line attributes to JSX DOM elements and Next.js Link/Image elements while compiling. It does not edit the source files or add this automatic instrumentation to production builds. Admin and API files are excluded.

`lib/site-source-inspector.ts` reads those markers only inside the preview. Text, icons, links, fields, and sections can therefore map to their own lines, rather than all pointing to a section's opening tag. External widgets may only map to a containing component; lessons label that fallback.

`lib/site-learning.ts` supplies beginner explanations for the observed element type and specific header/hero patterns. These are reading guides, not an automated proof of all application behavior. The source library retains its existing owner/PIN checks and secret filtering. Progress stores only file/line identifiers, with no account data.

## Verification

- `node --test tests/site-learning.test.ts`
- `scripts/smoke-site-source-inspector.mjs`: real public local page, mapping and action interception; checks private code remains denied without login.
- `scripts/smoke-site-learning-ui.mjs`: isolated mobile component test with explicit source fixtures, not a bypass of the admin login. Set `AGENT_BROWSER_BINARY` to the agent-browser executable and `ESBUILD_MODULE` to an installed esbuild module. Optional `LEARNING_SCREENSHOT` saves a screenshot.

Use `npm.cmd run dev` on Windows if PowerShell blocks `npm.ps1`. The server needs normal network access for store data.
