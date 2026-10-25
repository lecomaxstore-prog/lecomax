import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse, serialize } from 'parse5';

const origin = 'https://lecomax.com';
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const blocked = new Set(['script', 'iframe', 'object', 'embed', 'base', 'meta', 'template', 'noscript']);
const safeTags = new Set('html head body title style link div span main header footer section nav aside article h1 h2 h3 h4 h5 h6 p a img picture source svg path rect circle line polyline polygon ellipse g defs linearGradient stop clipPath use symbol ul ol li button input label select option textarea form fieldset legend table thead tbody tr td th strong b em i small br hr details summary video'.toLowerCase().split(' '));

export function sanitizePreview(input) {
  const doc = parse(input);
  const css = [];
  const files = new Set();
  function clean(parent) {
    parent.childNodes = (parent.childNodes || []).filter(node => {
      if (node.nodeName === '#comment') return false;
      if (!node.tagName) return true;
      const tag = node.tagName.toLowerCase();
      if (blocked.has(tag) || !safeTags.has(tag)) return false;
      if (tag === 'link') {
        if (attr(node, 'rel') === 'stylesheet') {
          const url = new URL(attr(node, 'href'), origin);
          if (url.origin === origin) css.push(url.href);
        }
        return false;
      }
      if (tag === 'style') return false;
      node.attrs = (node.attrs || []).filter(a => {
        if (/^on/i.test(a.name) || ['srcdoc', 'action', 'formaction', 'target', 'download', 'autofocus', 'contenteditable', 'nonce', 'integrity', 'srcset'].includes(a.name)) return false;
        if (['src', 'href', 'poster', 'xlink:href'].includes(a.name)) {
          if (a.value.startsWith('#')) return true;
          try {
            const url = new URL(a.value, origin);
            if (url.protocol !== 'https:') return false;
            a.value = url.href;
          } catch { return false; }
        }
        if (a.name === 'data-source-file') {
          if (!/^(components|app)\/[a-zA-Z0-9_./\[\]()-]+\.tsx?$/.test(a.value) || a.value.includes('..')) return false;
          files.add(a.value);
        }
        return true;
      });
      // The preview teaches UI; it never accepts customer data or submits forms.
      if (['input', 'textarea'].includes(tag)) node.attrs.push({ name: 'readonly', value: '' });
      if (tag === 'button') node.attrs.push({ name: 'type', value: 'button' });
      clean(node);
      return true;
    });
  }
  clean(doc);
  return { html: serialize(doc), css, files: [...files] };
}

async function refresh() {
  const input = await fs.readFile(new URL('../artifacts/site-public.html', import.meta.url), 'utf8');
  const result = sanitizePreview(input);
  const styles = await Promise.all(result.css.map(async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Stylesheet unavailable: ${response.status}`);
    return (await response.text()).replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (_all, _quote, value) => {
      const absolute = new URL(value, url);
      return absolute.protocol === 'https:' ? `url("${absolute.href}")` : 'none';
    });
  }));
  const css = styles.join('\n').replace(/<\/style/gi, '<\\/style');
  result.html = result.html.replace('</head>', `<style>${css}\n*{cursor:crosshair!important} [data-picked]{outline:3px solid #16a34a!important;outline-offset:-3px} html{scroll-behavior:smooth} [data-source-file="components/PushPrompt.tsx"], [data-source-file="components/CookieBanner.tsx"]{display:none!important}</style></head>`);
  const output = { url: origin + '/', capturedAt: new Date().toISOString(), html: result.html, files: result.files };
  await fs.writeFile(new URL('../data/site-preview.json', import.meta.url), JSON.stringify(output));
  console.log(`Public site preview: ${result.files.length} source files, ${styles.length} stylesheets, ${result.html.length} HTML characters.`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await refresh();
