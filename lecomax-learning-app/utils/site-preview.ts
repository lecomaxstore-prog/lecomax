import type { SourceSelection } from './site-learning';

export type SiteEvent = { kind: 'select'; selection: SourceSelection } | { kind: 'navigate'; href: string };
export function readSiteEvent(value: unknown): SiteEvent | undefined {
  if (!value || typeof value !== 'object') return;
  const event = value as Record<string, unknown>;
  if (event.channel !== 'lecomax-learning') return;
  if (event.kind === 'navigate' && typeof event.href === 'string' && event.href.length < 2000) return { kind: 'navigate', href: event.href };
  const s = event.selection as Record<string, unknown> | undefined;
  if (event.kind !== 'select' || !s || typeof s.path !== 'string' || !/^(app|components)\/[\w/.[\]()-]+\.tsx?$/.test(s.path) || s.path.includes('..')) return;
  return { kind: 'select', selection: {
    path: s.path, anchor: '', tag: typeof s.tag === 'string' ? s.tag.slice(0, 20) : '',
    label: typeof s.label === 'string' ? s.label.slice(0, 100) : '',
    href: typeof s.href === 'string' ? s.href.slice(0, 2000) : undefined,
    line: typeof s.line === 'number' && Number.isInteger(s.line) && s.line > 0 && s.line < 100000 ? s.line : undefined,
    ariaLabel: typeof s.ariaLabel === 'string' ? s.ariaLabel.slice(0, 160) : undefined,
    elementId: typeof s.elementId === 'string' ? s.elementId.slice(0, 160) : undefined,
  } };
}
export function sitePath(href: string, current = '/') {
  try {
    const url = new URL(href, 'https://lecomax.com' + current);
    if (url.origin !== 'https://lecomax.com' || url.username || url.password) return;
    return url.pathname;
  } catch { return; }
}

export function previewHtml(html: string, css: string, fallback: string) {
  // Only sanitized public HTML is accepted here. No storefront JavaScript runs.
  const script = `(() => {
    // Reveal sections normally shown by the storefront's scroll effects.
    document.querySelectorAll('[data-source-file="components/CategoryTiles.tsx"], [data-source-file="components/OurProductsGrid.tsx"]').forEach(el => {
      if (el.style.opacity === '0') { el.style.opacity = '1'; el.style.transform = 'none'; }
    });
    const emit = value => { const data = {channel:'lecomax-learning', ...value};
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
      else window.parent.postMessage(data, '*'); };
    let timer, last, opened;
    document.addEventListener('submit', e => {e.preventDefault();e.stopImmediatePropagation();}, true);
    document.addEventListener('click', e => {
      e.preventDefault(); e.stopImmediatePropagation();
      const target = e.target.closest('a,button,input,select,textarea,label') || e.target.closest('img,svg,h1,h2,h3,p') || e.target;
      const link = target.closest('a[href]');
      const region = target.closest('[data-source-file]');
      document.querySelectorAll('[data-picked]').forEach(el => el.removeAttribute('data-picked'));
      target.setAttribute('data-picked', '');
      const selection = {path:region?.getAttribute('data-source-file') || ${JSON.stringify(fallback)},
        tag:target.tagName.toLowerCase(), label:(target.getAttribute('aria-label') || target.getAttribute('alt') || target.textContent || target.tagName).trim().replace(/\\s+/g,' ').slice(0,100),
        href:link?.getAttribute('href'), line:Number(target.getAttribute('data-source-line')) || undefined,
        ariaLabel:target.getAttribute('aria-label') || undefined, elementId:target.id || undefined};
      if (link && last === link) {clearTimeout(timer);last=null;opened=link;emit({kind:'navigate',href:link.href});return;}
      clearTimeout(timer);last=link;opened=null;
      timer=setTimeout(()=>{last=null;emit({kind:'select',selection});},link ? 400 : 0);
    },true);
    document.addEventListener('dblclick', e=>{e.preventDefault();e.stopImmediatePropagation();
      const link=e.target.closest('a[href]'); if(link && link!==opened){clearTimeout(timer);last=null;opened=link;emit({kind:'navigate',href:link.href});}},true);
  })();`;
  return html.replace('</head>', `<meta name="viewport" content="width=device-width, initial-scale=1"><style>${css.replace(/<\/style/gi, '<\\/style')}\n[data-picked]{outline:3px solid #087f68!important;outline-offset:-3px}*{cursor:crosshair!important} [data-source-file="components/CookieBanner.tsx"],[data-source-file="components/PushPrompt.tsx"]{display:none!important}</style></head>`)
    .replace('</body>', `<script>${script}</script></body>`);
}
