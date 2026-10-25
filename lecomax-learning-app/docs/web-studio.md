# Web editor and VS Code

Open Teacher → Web editor · Preview · VS Code in the localhost web app.
Edit the three tabs: index.html, style.css and script.js. Tab inserts two
spaces. The browser saves the draft locally. Live preview refreshes after
600 ms; turn it off for manual refresh. Phone width constrains the preview.
The console shows logs, warnings and errors from that preview only.

The preview iframe allows scripts but not same-origin access, forms,
downloads or popups. Its content policy blocks external network resources.
It supports browser HTML/CSS/JavaScript, not React/Next.js or package imports.
Long-running JavaScript can still slow the browser; this is not a CPU-isolated
code execution service. Console output is capped at 80 lines of 2,000 characters.

Save a copy for VS Code writes a new folder under the ignored
`.teacher-workspaces/` directory. Only three fixed filenames and a README
are written; previous exports are preserved. Open in VS Code uses the
installed application's URL handler. Accept the browser's app-opening
prompt if it appears. This is a simple embedded editor, not the full VS Code
workbench. Desktop edits do not sync back to the app. Open the exported
index.html in a browser and refresh after desktop edits to preview that copy.

Export requires the local lab launcher, loopback origin and owner login.
Native apps show an explanation directing the learner to the local web app.
The VS Code URI format follows the official documentation:
https://code.visualstudio.com/docs/configure/command-line#_opening-vs-code-with-urls
