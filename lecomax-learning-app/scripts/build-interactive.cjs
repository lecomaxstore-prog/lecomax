const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
(async () => {
  const react = await esbuild.build({ entryPoints: [path.join(root, 'features/interactive/react-entry.js')], bundle: true, write: false, platform: 'browser', format: 'iife', target: 'es2020', minify: true, alias: { 'react-dom/server.browser': path.join(path.dirname(require.resolve('react-dom/package.json')), 'cjs/react-dom-server-legacy.browser.production.js') }, define: { 'process.env.NODE_ENV': '"production"' } });
  fs.writeFileSync(path.join(root, 'features/interactive/react-bundle.json'), JSON.stringify(react.outputFiles[0].text));
  const result = await esbuild.build({ entryPoints: [path.join(root, 'features/interactive/worker-entry.js')], bundle: true, write: false, platform: 'browser', format: 'iife', target: 'es2020', minify: true, loader: { '.wasm': 'binary' }, alias: { fs: path.join(root, 'features/interactive/empty.js'), path: path.join(root, 'features/interactive/empty.js'), crypto: path.join(root, 'features/interactive/empty.js') } });
  fs.writeFileSync(path.join(root, 'features/interactive/worker-bundle.json'), JSON.stringify(result.outputFiles[0].text));
  console.log('Built offline QuickJS / TypeScript / SQLite worker.');
})().catch(error => { console.error(error); process.exitCode = 1; });
