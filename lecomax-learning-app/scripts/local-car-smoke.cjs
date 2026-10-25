const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const requests = []; await page.route('**/*', route => { requests.push(route.request().url()); return route.abort(); });
    const html = require('../data/car-studio-runtime.json');
    await page.setContent(html.replace('/*STUDIO_BOOT*/', 'window.studioBoot={language:"en",completed:[]};'));
    await page.locator('[data-ready="true"]').waitFor();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(root, 'artifacts/local-car-desktop.png') });
    assert.equal(await page.locator('.hosted-car').count(), 0);
    assert.equal(requests.length, 0, 'Local viewer makes no external requests');
    await page.getByRole('button', { name: 'Isolate', exact: true }).click();
    await page.getByRole('button', { name: 'Exterior', exact: true }).click();
    for (const name of ['doors', 'hood', 'trunk']) {
      await page.locator(`[data-action="${name}"]`).click();
      assert.equal(await page.locator(`[data-action="${name}"]`).getAttribute('aria-pressed'), 'true');
    }
    await page.waitForTimeout(900); await page.screenshot({ path: path.join(root, 'artifacts/local-car-open.png') });
    await page.locator('[data-action="cockpit"]').click();
    await page.waitForTimeout(1200); await page.screenshot({ path: path.join(root, 'artifacts/local-car-cockpit.png') });
    await page.getByRole('button', { name: 'Interior', exact: true }).click();
    await page.waitForTimeout(1200); await page.screenshot({ path: path.join(root, 'artifacts/local-car-interior.png') });
    for (const mode of ['Engine','Chassis','X-ray','Explode','Exterior']) await page.getByRole('button', { name: mode, exact: true }).click();
    for (const size of [{width:390,height:844},{width:320,height:740},{width:844,height:390}]) {
      await page.setViewportSize(size); await page.getByRole('button', {name:'Reset',exact:true}).click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (size.width === 390) { await page.waitForTimeout(1100); await page.screenshot({path:path.join(root,'artifacts/local-car-mobile.png')}); }
    }
    results.push('Bundled runtime: zero network requests, local canvas ready, doors/hood/trunk controls, cockpit/interior/modes, 320/390/844px layouts');
    // Inspect real generated geometry and interaction state, not a substitute fixture.
    const bundle = esbuild.buildSync({ stdin:{ contents:`import {CarViewer} from './features/car-studio/viewer'; window.v=new CarViewer(document.getElementById('host'),id=>window.hit=id,()=>{}); window.v.loadLocal();`, resolveDir:root },bundle:true,write:false,format:'iife',target:'es2020' }).outputFiles[0].text;
    await page.setViewportSize({width:1000,height:800});
    await page.setContent('<div id="host" style="position:relative;width:900px;height:700px;background:#334b60"></div>');
    await page.addScriptTag({content:bundle}); await page.waitForTimeout(1000);
    const geometry = await page.evaluate(() => ({ systems:[...v.available], meshes:v.records.length, triangles:v.records.reduce((n,r)=>n+(r.mesh.geometry.index?.count??r.mesh.geometry.attributes.position.count)/3,0), names:new Set(v.records.map(r=>r.mesh.name)).size }));
    assert.equal(geometry.systems.length,12); assert.equal(geometry.names,geometry.meshes); assert.ok(geometry.triangles < 300000);
    for (const opening of ['doors','hood','trunk']) {
      await page.evaluate(name => v.toggleOpening(name), opening); await page.waitForTimeout(800);
      assert.ok(await page.evaluate(name=>v.local.hinges[name].every(h=>Math.abs(h.group.rotation[h.axis]-h.angle)<.01),opening));
      await page.evaluate(name=>v.toggleOpening(name),opening); await page.waitForTimeout(800);
      assert.ok(await page.evaluate(name=>v.local.hinges[name].every(h=>Math.abs(h.group.rotation[h.axis])<.01),opening));
    }
    await page.evaluate(()=>{v.select('engine');v.setMode('isolate');});
    assert.ok(await page.evaluate(()=>v.records.filter(r=>r.mesh.visible).every(r=>r.part==='engine')));
    await page.evaluate(()=>{v.setPaint('#8f2331');v.select('',false);v.setMode('exterior');});
    assert.ok(await page.evaluate(()=>v.records.filter(r=>r.materials.some(m=>m.name==='local-paint')).every(r=>r.materials.filter(m=>m.name==='local-paint').every(m=>m.color.getHexString()==='8f2331'))));
    await page.evaluate(()=>{v.select('brakes');});
    assert.equal(await page.evaluate(()=>v.mode),'xray');
    await page.evaluate(()=>{v.select('engine');v.setMode('isolate');}); await page.waitForTimeout(1000);
    const point=await page.evaluate(()=>{const r=v.records.find(r=>r.part==='engine');const p=r.mesh.getWorldPosition(v.camera.position.clone());p.project(v.camera);const b=v.renderer.domElement.getBoundingClientRect();return {x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2};});
    await page.mouse.click(point.x,point.y); assert.equal(await page.evaluate(()=>window.hit),'engine');
    await page.evaluate(()=>v.setActive(false)); assert.equal(await page.evaluate(()=>v.frame),0);
    await page.evaluate(()=>v.dispose()); assert.equal(await page.locator('#host canvas').count(),0);
    assert.deepEqual(errors,[]);
    results.push(`Actual model: ${geometry.meshes} unique meshes, ${geometry.triangles} triangles, all 12 systems, opening/closing hinges, isolate, paint, automatic X-ray, raycast selection, pause and GPU disposal`);
    fs.writeFileSync(path.join(root,'artifacts/local-car-smoke.json'),JSON.stringify({checkedAt:new Date().toISOString(),results,errors},null,2));
    console.log(results.join('\n'));
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
