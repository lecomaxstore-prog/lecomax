import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validWebFiles, type WebFiles } from './teacher-web-files.ts';
export { validWebFiles };
export async function saveTeacherWorkspace(files: WebFiles, root = path.join(process.cwd(), '.teacher-workspaces')) {
  if (!validWebFiles(files)) throw new Error('INVALID_INPUT');
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, 'web-'));
  await Promise.all([
    writeFile(path.join(directory, 'index.html'), '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<link rel="stylesheet" href="style.css">\n' + files.html + '\n<script src="script.js"></script>\n'),
    writeFile(path.join(directory, 'style.css'), files.css),
    writeFile(path.join(directory, 'script.js'), files.javascript),
    writeFile(path.join(directory, 'README.md'), '# AI Teacher practice project\n\nOpen index.html in your browser to preview. Edit HTML, CSS and JavaScript in VS Code, then refresh the browser. This is a saved copy; edits here do not sync back to the in-app editor.\n'),
  ]);
  const normalized = directory.replace(/\\/g, '/');
  return { directory, vscodeUrl: 'vscode://file/' + normalized.split('/').map(encodeURIComponent).join('/') };
}
