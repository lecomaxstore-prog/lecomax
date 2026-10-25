const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { initial } = require('./inspect.cjs').load('lecomax-learning-app/utils/progress.ts');
const root = path.resolve(__dirname, '../dist-car-studio-check');
const server = http.createServer((request, response) => {
  const route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + route);
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.ttf':'font/ttf', '.json':'application/json' };
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(response);
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({ channel:'msedge',headless:true });
  let page;
  try {
    const context = await browser.newContext({ viewport:{width:390,height:844} });
    await context.addInitScript(state => { if (window === window.top && !localStorage.getItem('lecomax-school-v1')) localStorage.setItem('lecomax-school-v1',JSON.stringify(state)); }, {...initial,language:'en',theme:'dark'});
    page = await context.newPage(); const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    // Disposable synthetic authentication; no credentials or requests reach a real account/backend.
    await page.route('**/api/learning-mobile/**', route=>route.fulfill({json:route.request().url().endsWith('/auth')?{challenge:'test'}:{accessToken:'test',refreshToken:'test',expiresAt:Date.now()+3600000,sessionId:'test',remembered:false},headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}}));
    const login = async () => {
      await page.getByRole('textbox').first().fill('test@example.invalid');
      await page.locator('input[type="password"]').fill('synthetic-test');
      await page.getByRole('button',{name:'Sign in',exact:true}).click();
      await page.getByRole('button',{name:'No, just this session',exact:true}).click();
    };
    await page.goto(`${process.env.STUDIO_APP_URL || `http://127.0.0.1:${server.address().port}`}/more`); await login();
    await page.getByText('3D Car Studio',{exact:true}).click(); await page.waitForURL('**/car-studio');
    const frame=page.frameLocator('iframe'); await frame.locator('[data-ready="true"]').waitFor();
    assert.equal(await frame.locator('.stage canvas').count(),1);
    assert.equal(await frame.locator('.hosted-car').count(),0);
    await frame.getByRole('button',{name:'Mark studied',exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lecomax-school-v1')).carStudio?.studied.includes('engine'));
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lecomax-school-v1')).completed),[]);
    await page.reload(); await login(); await frame.locator('[data-ready="true"]').waitFor({timeout:60000}); await frame.getByRole('button',{name:'Studied ✓',exact:true}).waitFor();
    await page.getByRole('button',{name:'Changes Made',exact:true}).click(); await page.waitForURL('**/change-history');
    await page.getByText('Replace blocky sedan with a detailed textured concept car',{exact:true}).first().waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS: More → Studio → saved progress → reload → restored progress → visible Change History. Synthetic auth only. Existing course completion untouched.');
    fs.writeFileSync(path.resolve(__dirname,'../artifacts/car-studio-app-smoke.json'),JSON.stringify({timestamp:new Date().toISOString(),result:'passed',checks:['More navigation','iframe mounted','progress saved','reload restored','course completion unaffected','Change History navigation'],authentication:'synthetic local intercept'},null,2));
  } catch (error) {
    if (page) { await page.screenshot({path:path.resolve(__dirname,'../artifacts/car-studio-app-failure.png')}); console.error('App state:',page.url(),await page.locator('iframe').count()); }
    throw error;
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
