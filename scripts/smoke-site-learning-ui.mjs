// Isolated component test. Fixture source responses do not bypass admin auth.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
const { build } = require(process.env.ESBUILD_MODULE || "esbuild");
const binary = process.env.AGENT_BROWSER_BINARY || "agent-browser";
const fixtures = Object.fromEntries(["components/Header.tsx", "components/HeroBanner.tsx"].map(path => [path, readFileSync(path, "utf8")]));
const result = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import SiteExplorer from './app/admin/how-it-was-built/SiteExplorer';
    const fixtures = ${JSON.stringify(fixtures)};
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      if (url.pathname === '/api/dev-docs/content') {
        if (window.__learningTestFailOnce) { window.__learningTestFailOnce = false; return Promise.resolve(new Response('{}', {status:503})); }
        const content = fixtures[url.searchParams.get('path')];
        return Promise.resolve(new Response(JSON.stringify(content ? {content} : {error:'fixture unavailable'}), {status:content ? 200 : 404}));
      }
      return originalFetch(input, init);
    };
    const root = document.createElement('div'); root.id='learning-test-root';
    [...document.body.children].forEach(element => {element.style.display='none'});
    document.body.append(root); document.body.style.margin='0';
    createRoot(root).render(<div style={{padding:12,background:'#f4f4f2'}}><div style={{height:110}}>Local mobile learning component test</div><SiteExplorer lang="fr"/></div>);
  `, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true, write: false, outfile: "fixture.js", minify: true, jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
});
const js = result.outputFiles.find(file => file.path.endsWith(".js")).text;
const css = result.outputFiles.find(file => file.path.endsWith(".css"))?.text || "";
const run = (args, input) => {
  const value = spawnSync(binary, args, { input, encoding: "utf8", timeout: 60000 });
  if (value.status !== 0) throw new Error(value.stderr || value.stdout || String(value.error));
  return value.stdout;
};
run(["set", "viewport", "390", "844"]);
run(["open", "http://localhost:3000"]);
console.log(run(["eval", "--stdin"], `(async()=>{
  const style=document.createElement('style'); style.textContent=${JSON.stringify(css + "\nbody > :not(#learning-test-root) { display:none !important; }")}; document.head.append(style);
  ${js}
  const check=(value,label)=>{if(!value) throw new Error(label)};
  const wait=async(fn)=>{const end=Date.now()+25000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw new Error('UI did not settle')};
  const root=document.getElementById('learning-test-root');
  await wait(()=>root.querySelector('iframe')?.contentDocument?.querySelector('header'));
  await wait(()=>!root.querySelector('button[disabled]'));
  check(root.querySelector('iframe').getBoundingClientRect().top < innerHeight,'Preview below first screen');
  check(document.documentElement.scrollWidth <= innerWidth,'Mobile page overflows');
  root.querySelector('iframe').contentDocument.querySelector('header').click();
  await wait(()=>root.querySelector('dialog[open] [role=tab]'));
  const dialog=root.querySelector('dialog');
  check(dialog.innerText.includes('Pourquoi on'), 'Missing purpose explanation');
  check(dialog.getBoundingClientRect().width <= innerWidth, 'Lesson overflows screen');
  check(dialog.querySelector('code').innerText.includes('<header'), 'Actual clicked header source missing');
  dialog.querySelectorAll('[role=tab]')[1].click();
  await wait(()=>dialog.innerText.includes('Comprendre mon code'));
  dialog.querySelectorAll('[role=tab]')[3].click();
  await wait(()=>dialog.innerText.includes('Une petite question'));
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Voir l’explication').click();
  await wait(()=>dialog.innerText.includes('J’ai compris cette partie'));
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='J’ai compris cette partie').click();
  await wait(()=>dialog.innerText.includes('Compris ✓'));
  dialog.querySelector('button').click();
  await wait(()=>!dialog.open);
  root.querySelector('iframe').contentDocument.querySelector('[aria-roledescription=carrousel]').click();
  await wait(()=>dialog.open && dialog.innerText.includes('La grande bannière'.toLowerCase()));
  check(dialog.querySelector('code').innerText.includes('<section'), 'Hero source missing');
  dialog.querySelector('button').click(); await wait(()=>!dialog.open);
  window.__learningTestFailOnce=true;
  root.querySelector('iframe').contentDocument.querySelector('header').click();
  await wait(()=>dialog.querySelector('[role=alert]'));
  [...dialog.querySelectorAll('button')].find(b=>b.textContent==='Réessayer').click();
  await wait(()=>dialog.querySelector('code'));
  check(!dialog.querySelector('[role=alert]'), 'Retry did not recover');
  dialog.querySelector('button').click(); await wait(()=>!dialog.open);
  root.querySelector('iframe').contentDocument.querySelector('[aria-roledescription=carrousel] a[href="/boutique"]').click();
  await wait(()=>dialog.innerText.includes('Explorer la page de ce lien'));
  [...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Explorer la page de ce lien')).click();
  await wait(()=>root.querySelector('iframe').getAttribute('src')==='/boutique' && !root.querySelector('button[disabled]') && root.querySelector('iframe').contentDocument?.querySelector('main'));
  check(!dialog.open,'Page navigation left lesson open');
  const previewDoc=root.querySelector('iframe').contentDocument;
  check(previewDoc.documentElement.hasAttribute('data-learning-hide-notices'),'Preview notices preference missing');
  const cookie=previewDoc.querySelector('[aria-label="Gestion des cookies"]');
  check(!cookie || previewDoc.defaultView.getComputedStyle(cookie).display==='none','Cookie notice obstructs preview');
  return {mobilePreview:'PASS',dialog:'PASS',realHeaderCode:'PASS',why:'PASS',lineExplanation:'PASS',practice:'PASS',backToSite:'PASS',hero:'PASS',retry:'PASS',exploreLink:'PASS'};
})()`));
if (process.env.LEARNING_SCREENSHOT) console.log(run(["screenshot", process.env.LEARNING_SCREENSHOT]));
