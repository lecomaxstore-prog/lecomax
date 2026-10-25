const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const { load } = require('./inspect.cjs');
const { parts } = load('lecomax-learning-app/features/car-studio/vehicle.ts');
const html = require('../data/car-studio-runtime.json');
const results = [];
async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader'] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    for (const language of ['en', 'fr', 'ar']) {
      await page.setContent(html.replace('/*STUDIO_BOOT*/', `window.studioBoot=${JSON.stringify({ language, completed: [] })};window.testEvents=[];window.ReactNativeWebView={postMessage:value=>window.testEvents.push(JSON.parse(value))};`));
      await page.locator('[data-ready="true"]').waitFor();
      assert.equal(await page.locator('.anatomy button').count(), 12);
      assert.equal(await page.locator('.stage canvas').count(), 1);
      for (let index = 0; index < 12; index++) {
        await page.locator('.anatomy button').nth(index).click();
        assert.equal(await page.locator('.info h3').textContent(), parts[index].name[language]);
      }
      await page.locator('.anatomy button').nth(1).click();
      const slider = page.locator('.simulation input'); await slider.fill('400');
      assert.equal(await slider.inputValue(), '400');
      await page.locator('.learning > .toolbar select').selectOption('advanced');
      assert.equal(await page.locator('.info section').count() >= 4, true);
      await page.locator('.info > .toolbar button').first().click();
      assert.equal(await page.evaluate(() => window.testEvents.at(-1).type), 'learned');
      await page.locator('.learning > .toolbar button').last().click();
      assert.equal(await page.locator('.info > .toolbar button').count(), 12);
      await page.locator('.info > .toolbar button').first().click();
      assert.equal(await page.evaluate(() => window.testEvents.at(-1).type), 'quiz');
      await page.locator('.learning > .toolbar button').first().click();
      assert.equal(await page.locator('.info h3').textContent(), parts[0].name[language]);
      await page.locator('.info > .toolbar button').last().click();
      assert.equal(await page.locator('.info h3').textContent(), parts[1].name[language]);
      for (const size of [{ width: 320, height: 740 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
        await page.setViewportSize(size);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      if (language === 'en') { await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: path.join(root, 'artifacts/car-studio-mobile.png'), fullPage: true }); }
      results.push(`${language}: 12 panels, simulation scrubber, advanced content, progress event, quiz event, guided tour, portrait/landscape/desktop layout`);
    }
    // Original geometry fixture, ONLY for loader/interaction tests. Never shipped as a BMW asset.
    const positions = new Float32Array([-1,-1,0, 1,-1,0, 0,1,0]);
    const binary = Buffer.from(positions.buffer);
    const json = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0,1] }], nodes: [{ mesh: 0, name: 'engine' }, { mesh: 1, name: 'body', translation: [3,0,0] }], meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }, { primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }], materials: [{ name: 'paint', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.2,0.5,0.8,1] } }], buffers: [{ byteLength: binary.length }], bufferViews: [{ buffer: 0, byteLength: binary.length }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1,-1,0], max: [1,1,0] }] };
    const jsonBytes = Buffer.from(JSON.stringify(json)); const padded = Buffer.alloc(Math.ceil(jsonBytes.length / 4) * 4, 32); jsonBytes.copy(padded);
    const glb = Buffer.alloc(12 + 8 + padded.length + 8 + binary.length); glb.writeUInt32LE(0x46546c67,0); glb.writeUInt32LE(2,4); glb.writeUInt32LE(glb.length,8); glb.writeUInt32LE(padded.length,12); glb.writeUInt32LE(0x4e4f534a,16); padded.copy(glb,20); glb.writeUInt32LE(binary.length,20+padded.length); glb.writeUInt32LE(0x004e4942,24+padded.length); binary.copy(glb,28+padded.length);
    await page.route('https://fixture.test/**', route => route.fulfill({ status: route.request().url().includes('missing') ? 404 : 200, contentType: 'model/gltf-binary', headers: { 'Access-Control-Allow-Origin': '*' }, body: glb }));
    const bundle = esbuild.buildSync({ stdin: { contents: `import {CarViewer} from './features/car-studio/viewer'; window.create=()=>{window.selected=[];window.viewer=new CarViewer(document.getElementById('host'),id=>window.selected.push(id),message=>window.status=message);};`, resolveDir: root }, bundle: true, write: false, format: 'iife', target: 'es2020' }).outputFiles[0].text;
    await page.setContent('<div id="host" style="position:relative;width:700px;height:500px"></div>'); await page.setViewportSize({ width: 900, height: 700 }); await page.addScriptTag({ content: bundle });
    const manifest = { url: 'https://fixture.test/car.glb', source: 'https://fixture.test/source', license: 'Original synthetic test geometry', attribution: 'LECOMAX test fixture', meshes: { engine: ['engine'], body: ['body'] }, paintMaterials: ['paint'] };
    await page.evaluate(async manifest => { window.create(); await window.viewer.load(manifest, () => {}); }, manifest);
    assert.deepEqual(await page.evaluate(() => [...window.viewer.available].sort()), ['body','engine']);
    assert.equal(await page.evaluate(() => window.viewer.supports('interior')), false);
    assert.equal(await page.evaluate(() => window.viewer.supports('xray')), true);
    await page.evaluate(() => { window.viewer.select('engine'); window.viewer.setMode('isolate'); });
    assert.equal(await page.evaluate(() => window.viewer.records.filter(r => r.mesh.visible).length), 1);
    await page.evaluate(() => { window.viewer.setMode('exterior'); window.viewer.setPaint('#ff0000'); window.viewer.preset('front'); });
    await page.waitForTimeout(900);
    assert.equal(await page.evaluate(() => window.viewer.records[0].materials[0].color.getHexString()), 'ff0000');
    const point = await page.evaluate(() => { const v=window.viewer; const p=v.records[0].mesh.position.clone(); p.y=-0.3; v.records[0].mesh.localToWorld(p); p.project(v.camera); const r=v.renderer.domElement.getBoundingClientRect(); return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}; });
    await page.touchscreen.tap(point.x, point.y); assert.equal(await page.evaluate(() => window.selected.at(-1)), 'engine');
    const before = await page.evaluate(() => window.viewer.camera.position.toArray());
    await page.mouse.move(340,250); await page.mouse.down(); await page.mouse.move(460,280,{steps:8}); await page.mouse.up(); await page.waitForTimeout(900);
    assert.notDeepEqual(await page.evaluate(() => window.viewer.camera.position.toArray()), before);
    const distance = await page.evaluate(() => window.viewer.camera.position.distanceTo(window.viewer.controls.target)); await page.mouse.wheel(0,-300); await page.waitForTimeout(900);
    assert.ok(await page.evaluate(() => window.viewer.camera.position.distanceTo(window.viewer.controls.target)) < distance);
    const cdp = await context.newCDPSession(page);
    const beforePinch = await page.evaluate(() => window.viewer.camera.position.distanceTo(window.viewer.controls.target));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{x:290,y:250,id:0},{x:390,y:250,id:1}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{x:240,y:250,id:0},{x:440,y:250,id:1}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(900);
    assert.ok(await page.evaluate(() => window.viewer.camera.position.distanceTo(window.viewer.controls.target)) < beforePinch);
    const beforePan = await page.evaluate(() => window.viewer.controls.target.toArray());
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{x:290,y:250,id:0},{x:390,y:250,id:1}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{x:330,y:280,id:0},{x:430,y:280,id:1}] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(900);
    assert.notDeepEqual(await page.evaluate(() => window.viewer.controls.target.toArray()), beforePan);
    await page.evaluate(() => { window.viewer.select('engine'); window.viewer.setMode('xray'); });
    assert.equal(await page.evaluate(() => window.viewer.records.find(r=>r.part==='body').materials[0].opacity),0.14);
    assert.equal(await page.evaluate(() => window.viewer.records.find(r=>r.part==='engine').materials[0].emissiveIntensity),0.4);
    await page.evaluate(() => { window.viewer.setLabels({ engine:'Engine', body:'Body' }); window.viewer.setMode('explode'); }); assert.equal(await page.locator('.mesh-label').count(),2);
    await page.evaluate(() => window.viewer.dispose()); assert.equal(await page.locator('#host canvas').count(),0);
    const failed = await page.evaluate(async manifest => { window.create(); try { await window.viewer.load({...manifest,url:'https://fixture.test/missing.glb'},()=>{}); return false; } catch { window.viewer.dispose(); return true; } }, manifest); assert.equal(failed,true);
    await page.evaluate(async manifest => { window.create(); await window.viewer.load(manifest,()=>{}); window.viewer.dispose(); },manifest);
    results.push('Synthetic GLB: load, mesh registry, capability gating, isolation, paint, touch selection, orbit, zoom, emulated pinch/pan, X-ray, highlight, labels, exploded view, GPU disposal, 404 recovery/reload');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(root, 'artifacts/car-studio-smoke.json'), JSON.stringify({ timestamp: new Date().toISOString(), results, limitations: ['Synthetic geometry is not a BMW model.', 'No physical Android/iOS device tests or measured FPS.', 'Direct runtime browser tests, not authenticated navigation tests.'] }, null, 2));
    console.log(results.join('\n'));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
