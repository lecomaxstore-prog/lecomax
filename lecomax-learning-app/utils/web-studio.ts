export type WebFiles = { html: string; css: string; javascript: string };
export const starterWebFiles: WebFiles = {
  html: '<main>\n  <h1>My first interactive page</h1>\n  <p>Click the button and watch the total change.</p>\n  <button id="add">Add a book · 80 MAD</button>\n  <p id="total" aria-live="polite">Total: 0 MAD</p>\n</main>',
  css: 'body { font-family: system-ui; background: #f5f7f2; padding: 24px; color: #173f36; }\nmain { max-width: 480px; margin: auto; }\nbutton { background: #176b57; color: white; padding: 14px 20px; border: 0; border-radius: 12px; cursor: pointer; }\n#total { font-size: 24px; font-weight: bold; }',
  javascript:
    'let total = 0;\ndocument.querySelector("#add").addEventListener("click", () => {\n  total += 80;\n  document.querySelector("#total").textContent = `Total: ${total} MAD`;\n  console.log("New total:", total);\n});',
};
export function validWebFiles(value: unknown): value is WebFiles {
  if (!value || typeof value !== 'object') return false;
  const files = value as Record<string, unknown>;
  return (
    Object.keys(files).length === 3 &&
    ['html', 'css', 'javascript'].every(
      (key) => typeof files[key] === 'string' && (files[key] as string).length <= 20000,
    )
  );
}
export function previewDocument(files: WebFiles) {
  const bridge = `(() => {
    const send = (kind, values) => { try { parent.postMessage({studioConsole:true, kind, text: values.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(' ').slice(0,2000)}, '*'); } catch {} };
    for (const kind of ['log','warn','error']) { const original = console[kind]; console[kind] = (...values) => { send(kind,values); original.apply(console,values); }; }
    addEventListener('error', e => send('error',[e.message]));
    addEventListener('unhandledrejection', e => send('error',[String(e.reason)]));
  })();`;
  return (
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'\">" +
    '<script>' +
    bridge +
    '</script><style>' +
    files.css.replace(/<\/style/gi, '<\\/style') +
    '</style></head><body>' +
    files.html +
    '<script>' +
    files.javascript.replace(/<\/script/gi, '<\\/script') +
    '</script></body></html>'
  );
}
