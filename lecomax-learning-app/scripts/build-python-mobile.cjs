const path = require('node:path');
const fs = require('node:fs');
const esbuild = require('esbuild');
const app = path.resolve(__dirname, '..');
async function build() {
  const result = await esbuild.build({ entryPoints: [path.join(__dirname, 'python-mobile-entry.tsx')], bundle: true, write: false, minify: true, platform: 'browser', target: ['es2022'], define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'python-mobile-school', setup(build) { build.onResolve({ filter: /store\/School$/ }, () => ({ path: path.join(__dirname, 'python-mobile-school.tsx') })); } }] });
  const script = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}#root{display:flex;font-family:system-ui,sans-serif}*{box-sizing:border-box}button:disabled{opacity:.5}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #52b788;outline-offset:2px}</style></head><body><div id="root"></div><script>/*PYTHON_SEED*/</script><script>' + script + '</script></body></html>';
  fs.writeFileSync(path.join(app, 'data/python-mobile-workspace.json'), JSON.stringify(html) + '\n');
  console.log(`Bundled offline Python UI: ${Buffer.byteLength(html)} bytes. Python runtime still loads from its pinned CDN.`);
}
build().catch(error => { console.error(error); process.exitCode = 1; });
