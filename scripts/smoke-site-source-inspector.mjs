import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import ts from "typescript";

// Uses the public local storefront only; no admin cookies or credentials.
const executable = process.env.AGENT_BROWSER_BINARY || "agent-browser";
const inspector = ts.transpileModule(readFileSync("lib/site-source-inspector.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace("export function", "function");
const code = `(async () => {
  if (location.origin !== 'http://localhost:3000') throw new Error('Open the local storefront first');
  ${inspector}
  const check = (value, message) => { if (!value) throw new Error(message); };
  const frame = document.createElement('iframe');
  frame.title = 'Source inspection test';
  frame.style.cssText = 'width:390px;height:560px';
  const loaded = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Preview load timeout')), 25000);
    frame.onload = () => { clearTimeout(timer); resolve(); };
  });
  frame.src = '/'; document.body.append(frame);
  try {
    await loaded;
    const doc = frame.contentDocument;
    check(doc?.querySelector('header'), 'Same-origin preview did not render');
    let selected;
    const detach = attachSourceInspector(doc, 'app/page.tsx', value => { selected = value; });
    try {
      let shopAction = false;
      const header = doc.querySelector('header a');
      check(header, 'Header link missing');
      header.addEventListener('click', () => { shopAction = true; });
      header.click();
      check(selected?.path === 'components/Header.tsx', 'Header file mapping failed');
      check(selected.exact && selected.line > 0 && selected.tag === 'a', 'Exact clicked link location missing');
      check(!shopAction, 'Inspection executed a storefront action');
      const hero = doc.querySelector('[data-source-file="components/HeroBanner.tsx"]');
      check(hero, 'Real hero missing'); hero.click();
      check(selected?.path === 'components/HeroBanner.tsx', 'Hero file mapping failed');
      const card = doc.querySelector('[data-source-file="components/ProductCard.tsx"] a, [data-source-file="components/CollectionProductCard.tsx"] a');
      check(card, 'Product card missing'); card.click();
      check(/components\\/(Collection)?ProductCard.tsx/.test(selected?.path), 'Nested product mapping failed');
      doc.querySelector('footer a').click();
      check(selected?.path === 'components/Footer.tsx', 'Footer mapping failed');
      const form = doc.createElement('form'); doc.querySelector('main').append(form);
      const submitted = form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      check(!submitted && selected?.path === 'app/layout.tsx', 'Container mapping or form interception failed');
      form.remove();
      detach();
      check(!doc.querySelector('[data-code-hover]'), 'Highlight cleanup failed');
    } finally { detach(); }
    const response = await fetch('/api/dev-docs/content?path=components/Header.tsx');
    check(response.status === 403 || response.status === 401, 'Private source exposed without authentication');
    return { preview: 'PASS', header: 'PASS', hero: 'PASS', nestedProduct: 'PASS', footer: 'PASS', preventShopActions: 'PASS', fallback: 'PASS', privateSource: 'PASS' };
  } finally { frame.remove(); }
})()`;
const result = spawnSync(executable, ["eval", "--stdin"], { input: code, encoding: "utf8", timeout: 60000 });
if (result.error) throw result.error;
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exitCode = result.status ?? 1;
