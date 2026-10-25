// Browser integration test for the real, bundled studio, without account credentials.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function main() {
  const output = path.resolve(__dirname, '../artifacts/python-ide'); fs.mkdirSync(output, { recursive: true });
  const document = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/python-mobile-workspace.json'), 'utf8'));
  const server = http.createServer((req, res) => {
    const lang = new URL(req.url, 'http://localhost').searchParams.get('lang') || 'en';
    const state = { drafts: {}, answers: {}, language: lang, theme: 'dark', level: 1 };
    const bridge = `window.savedProgress=[];window.bridgeEvents=[];window.ReactNativeWebView={postMessage(raw){const m=JSON.parse(raw);window.bridgeEvents.push(m.type);if(m.type==='ready')setTimeout(()=>window.dispatchEvent(new MessageEvent('message',{data:{type:'init',state:${JSON.stringify(state)}}})),0);if(m.type==='progress')window.savedProgress.push(m);}};`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(document.replace('/*PYTHON_SEED*/', bridge));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lecomax-ide-'));
  const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  const checks = [];
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for(let i=0;i<100&&!fs.existsSync(portFile);i++) await pause(100);
    const port = fs.readFileSync(portFile,'utf8').split('\n')[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve);socket.addEventListener('error',reject);});
    let id=0; const pending=new Map(); const errors=[];
    socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(m.error):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}));});
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
    const wait=async(expression,timeout=15000)=>{const end=Date.now()+timeout;while(Date.now()<end){const v=await evaluate(expression);if(v)return v;await pause(100);}throw Error('Timeout: '+expression);};
    const click=async text=>evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||b.textContent.trim())===${JSON.stringify(text)});if(!b)throw Error('Missing button');b.click();return true})()`);
    const pointerClick = async selector => {
      const point = await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});element.scrollIntoView({block:'nearest'});const r=element.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
    };
    const viewport=async(width,height=844)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(80);};
    await send('Runtime.enable'); await send('Page.enable');
    for(const lang of ['en','ar','fr']) for(const theme of ['dark','light']){
      await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/?lang=${lang}`});
      await wait(`!!document.querySelector('.cm-content')`);
      await evaluate(`(()=>{const select=document.querySelectorAll('.py-settings select')[1];select.value=${JSON.stringify(theme)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await wait(`document.querySelector('.py-ide').dataset.theme===${JSON.stringify(theme)}`);
      const contrast = await evaluate(`(()=>{
        const lum=color=>{const c=color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
        const ratio=(a,b)=>{a=lum(a);b=lum(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
        const code=getComputedStyle(document.querySelector('.cm-editor')).backgroundColor,surface=getComputedStyle(document.querySelector('.py-topbar')).backgroundColor;
        window.testContrast=ratio;return {tokens:Math.min(...[...document.querySelectorAll('.cm-line span')].map(el=>ratio(getComputedStyle(el).color,code))),stop:ratio(getComputedStyle(document.querySelector('.py-stop')).color,surface)};
      })()`);
      assert(contrast.tokens>=4.5 && contrast.stop>=4.5,`${lang}/${theme} contrast ${JSON.stringify(contrast)}`);
      for(const width of [280,320,375,390,430,480,768,1280]){
        await viewport(width);
        const layout=await evaluate(`(()=>{const editor=document.querySelector('.py-editor-frame').getBoundingClientRect();const b=document.querySelector('.py-body');return {overflow:document.documentElement.scrollWidth>innerWidth,bodyOverflow:b.scrollWidth>b.clientWidth+1,editorTop:editor.top,editorWidth:editor.width,rtl:document.querySelector('.py-ide').dir,codeDirection:getComputedStyle(document.querySelector('.cm-content')).direction,runHeight:document.querySelector('.py-run').getBoundingClientRect().height}})()`);
        assert(!layout.overflow && !layout.bodyOverflow,`${lang} ${width} overflow ${JSON.stringify(layout)}`);
        assert(layout.editorTop<260,`Editor starts too low: ${layout.editorTop}`);assert(layout.runHeight>=44);assert.equal(layout.codeDirection,'ltr');assert.equal(layout.rtl,lang==='ar'?'rtl':'ltr');
        for(const tab of lang==='ar'?['النتائج','تمارين','المحرر']:lang==='fr'?['Résultats','Exercices','Éditeur']:['Console','Exercises','Editor']){
          await click(tab);assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth && document.querySelector('.py-body').scrollWidth<=document.querySelector('.py-body').clientWidth+1`),`${lang}/${width}/${tab} overflow`);
        }
        if([280,320,390,768,1280].includes(width)){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,`${lang}-${theme}-${width}.png`),Buffer.from(shot.data,'base64'));}
        checks.push({lang,theme,width,...layout});
      }
      await viewport(280,568);await wait(`!document.querySelector('.py-run').disabled`);
      await evaluate(`document.querySelector('.py-toolbar .py-run').click()`);
      assert(await evaluate(`document.querySelector('.py-toolbar').scrollWidth<=innerWidth && document.querySelector('.py-menu').getBoundingClientRect().right<=innerWidth`),`${lang}/${theme} running toolbar overflow`);
      await evaluate(`document.querySelector('.py-stop').click()`);
    }
    await viewport(390);await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/?lang=en`});await wait(`!!document.querySelector('.cm-content')`);
    const accessory = label => evaluate(`document.querySelector('.py-accessory button[aria-label=' + ${JSON.stringify(JSON.stringify(label))} + ']').click()`);
    const replaceCode = async text => {
      await evaluate(`document.querySelector('.cm-content').focus()`);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2});
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Backspace',code:'Backspace'});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Backspace',code:'Backspace'});
      if(text) await send('Input.insertText',{text});
    };
    const editorText = () => evaluate(`document.querySelector('.cm-content').textContent`);
    await replaceCode('');
    for (const [open,close] of [['(',')'],['[',']'],['{','}'],["'","'"],['"','"']]) {
      await accessory('Insert '+open); assert.equal(await editorText(),open+close);
      await accessory('Undo edit'); assert.equal(await editorText(),'');
      await accessory('Redo edit'); assert.equal(await editorText(),open+close);
      await replaceCode('');
    }
    for(const symbol of [':','=',',','.','_','#','+','-','*','/','%','<','>']) {
      await accessory('Insert '+symbol);assert.equal(await editorText(),symbol);await replaceCode('');
    }
    await replaceCode('x');await accessory('Move cursor left');await accessory('Insert (');
    assert.equal(await editorText(),'()x');await accessory('Move cursor right');await accessory('Insert :');assert.equal(await editorText(),'():x');
    await replaceCode('x');await accessory('Indent selection');assert.equal(await editorText(),'    x');
    await accessory('Outdent selection');assert.equal(await editorText(),'x');await accessory('Insert tab');assert.equal(await editorText(),'x    ');
    await replaceCode('word');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2});
    await accessory('Insert [');assert.equal(await editorText(),'[word]');
    await click('Console');await click('Exercises');await click('Editor');await accessory('Insert "');assert.equal(await editorText(),'["word"]');
    await replaceCode('if True:');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter'});
    assert(await evaluate(`document.querySelector('.cm-content').innerText.includes('    ')`),'Python newline indentation');
    assert(await evaluate(`document.querySelector('.py-cursor').textContent.includes('Ln 2, Col 5')`));
    await replaceCode('');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'(',code:'Digit9',modifiers:8,text:'('});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'(',code:'Digit9',modifiers:8});
    assert.equal(await editorText(),'()','hardware bracket pairing');
    await viewport(844,390);assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    await viewport(390);
    checks.push({interaction:'all accessory keys, paired selection, undo/redo, indentation, cursor retention across tabs and landscape',passed:true});
    // Real CodeMirror editing, local bridge save, menu focus and wrap settings.
    await evaluate(`document.querySelector('.cm-content').focus()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2});
    await send('Input.insertText',{text:'print("Studio ready")'});
    await wait(`window.savedProgress.some(p=>Object.values(p.drafts).includes('print("Studio ready")'))`);
    await click('Save'); await wait(`window.savedProgress.some(p=>p.drafts['python-script:my-script']==='print("Studio ready")')`);
    await evaluate(`document.querySelector('.py-menu summary').click()`);await click('Editor settings');await wait(`document.activeElement?.textContent==='Editor settings and input'`);
    await evaluate(`document.querySelector('.py-settings input[type=checkbox]').click()`);
    assert(await evaluate(`!document.querySelector('.py-accessory')`),'accessory can be hidden');
    await evaluate(`document.querySelector('.py-settings input[type=checkbox]').click()`);
    assert(await evaluate(`!!document.querySelector('.py-accessory')`),'accessory can be restored');
    await evaluate(`document.querySelector('.py-body').scrollTop=0`);
    await wait(`!document.querySelector('.py-run').disabled`);await click('Run Code');
    await wait(`document.querySelector('#py-console').textContent.includes('Studio ready') && !document.querySelector('.py-stop').disabled`,1000).catch(()=>{});
    await wait(`document.querySelector('#py-console').textContent.includes('Completed')`,90000);
    assert((await evaluate(`document.querySelector('#py-console').textContent`)).includes('Studio ready'));
    const consoleShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'console-390.png'),Buffer.from(consoleShot.data,'base64'));
    checks.push({interaction:'real editor edit, bridge save, settings focus, Python execution',passed:true});
    await viewport(390,420); await click('Editor');
    assert(await evaluate(`document.querySelector('.py-toolbar').getBoundingClientRect().bottom<innerHeight && document.documentElement.scrollWidth<=innerWidth`));
    await viewport(390,844);
    await evaluate(`Object.defineProperty(window.visualViewport,'height',{configurable:true,value:380});window.dispatchEvent(new Event('resize'))`);
    await wait(`document.querySelector('.py-ide').classList.contains('py-keyboard')`);
    assert(await evaluate(`document.querySelector('.py-ide').getBoundingClientRect().height===380 && document.querySelector('.py-body').clientHeight>80`));
    assert(await evaluate(`document.querySelector('.cm-editor').getBoundingClientRect().height<=100`),'keyboard leaves a bounded editing area');
    const keyboardShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'keyboard-390.png'),Buffer.from(keyboardShot.data,'base64'));
    await evaluate(`delete window.visualViewport.height;window.dispatchEvent(new Event('resize'));document.querySelector('[aria-label="Close studio"]').click()`);
    await wait(`!document.querySelector('.py-ide').classList.contains('py-keyboard')`);
    assert(await evaluate(`window.bridgeEvents.includes('close')`));
    // Offline state must preserve the current code.
    await evaluate(`Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'))`);await wait(`document.querySelector('.py-status').textContent.includes('Offline')`);
    assert((await evaluate(`document.querySelector('.cm-content').textContent`)).includes('Studio ready'));
    await evaluate(`Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'))`);
    await click('Exercises');await click('Open exercise draft');
    const exerciseStarter = await editorText();await accessory('Undo edit');assert.equal(await editorText(),exerciseStarter,'Undo must not restore another document');
    await evaluate(`document.querySelector('.cm-content').focus()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',modifiers:2});
    const {load}=require('./inspect.cjs');const solution=load('lecomax-learning-app/utils/python-practice.ts').pythonExercises[0].solution;
    await send('Input.insertText',{text:solution});await click('Exercises');await click('Check answer');
    await wait(`document.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')==='1'`,90000);
    const exerciseShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'exercises-390.png'),Buffer.from(exerciseShot.data,'base64'));
    assert(await evaluate(`window.savedProgress.some(p=>p.answers['python-practice:greeting']?.correct)`));
    await click('Editor');await replaceCode('for i in range(80):\n    print(i)\nname = input("Your name: ")\nprint("Hello", name)');await click('Run Code');
    await wait(`!!document.querySelector('.py-input input')`,90000);
    assert(await evaluate(`document.activeElement===document.querySelector('.py-input input')`),'real input prompt receives focus');
    assert(await evaluate(`document.querySelector('.py-input').getBoundingClientRect().bottom<=document.querySelector('.py-body').getBoundingClientRect().bottom`),'prompt and send action are visible after long output');
    await send('Input.insertText',{text:'Ada'});await click('Send input');
    await wait(`!document.querySelector('.py-run').disabled && document.querySelector('#py-console').textContent.includes('Hello Ada')`,90000);
    assert(await evaluate(`document.querySelector('#py-console details.py-card pre').textContent.includes('79')`),'long execution output retained');
    await click('Editor');await replaceCode('while True:\n    pass');await click('Run Code');await wait(`!document.querySelector('.py-stop').disabled`);await click('Stop');
    await wait(`document.querySelector('.py-status').textContent.includes('Cancelled')`,2000);
    checks.push({interaction:'real console input focus and scroll following after long output; responsive stop',passed:true});
    await wait(`!document.querySelector('.py-run').disabled`);await click('Editor');
    await replaceCode('while True:\n    pass');await click('Run Code');
    await wait(`document.querySelector('.py-status').textContent==='Failed' && document.querySelector('#py-console').textContent.includes('Timed out after 10 seconds')`,90000);
    assert(!await evaluate(`document.querySelector('#py-console > details.py-card .py-completion').textContent.includes('successfully')`),'timeout cannot claim success');
    await wait(`!document.querySelector('.py-run').disabled`);await click('Editor');
    await replaceCode('a = input("Value: ")\nb = input("Value: ")\nprint(a, b)');await click('Run Code');
    for(const answer of ['first','second']) {
      await wait(`!!document.querySelector('.py-input input')`,90000);
      assert(await evaluate(`document.activeElement===document.querySelector('.py-input input')`),'consecutive identical prompts must focus input');
      await send('Input.insertText',{text:answer});await pointerClick('.py-input button');
      await wait(`!document.querySelector('.py-input input') || document.querySelector('.py-input input').value===''`);
    }
    await wait(`document.querySelector('#py-console').textContent.includes('first second')`,90000);
    for(let attempt=0;attempt<3;attempt++) {
      await wait(`!document.querySelector('.py-run').disabled`);await click('Editor');await replaceCode('while True:\n    pass');await click('Run Code');
      if(attempt===0) await wait(`document.querySelector('.py-status').textContent==='Running'`,90000);
      await click('Exercises');assert(await evaluate(`!document.querySelector('#py-exercises').hidden`));await click('Stop');await click('Stop');
      await wait(`!document.querySelector('.py-run').disabled`);
    }
    await click('Editor');await viewport(280,568);await replaceCode('value = "'+'x'.repeat(30000)+'"');
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth && document.querySelector('.py-body').scrollWidth<=document.querySelector('.py-body').clientWidth+1`),'long line is confined to editor');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'h',code:'KeyH',modifiers:2});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'h',code:'KeyH',modifiers:2});
    await wait(`!!document.querySelector('.cm-search')`);
    assert(await evaluate(`document.querySelector('.cm-search').scrollWidth<=document.querySelector('.py-codemirror-host').clientWidth+1`),'search fits small screen');
    await evaluate(`document.querySelector('.cm-search button[name=close]').click()`);
    await evaluate(`document.querySelector('.py-menu summary').click()`);await click('Editor settings');
    await evaluate(`(()=>{const select=document.querySelectorAll('.py-settings select')[1];select.value='light';select.dispatchEvent(new Event('change',{bubbles:true}));(()=>{const wrap=[...document.querySelectorAll('.py-settings label')].find(el=>el.textContent.includes('Wrap long lines')).querySelector('input');if(!wrap.checked)wrap.click()})()})()`);
    await wait(`!!document.querySelector('.cm-lineWrapping')`);
    await wait(`document.querySelector('.cm-scroller').scrollWidth<=document.querySelector('.cm-scroller').clientWidth+1`,3000);
    await replaceCode('print(1 / 0)');await click('Run Code');await wait(`document.querySelector('.py-status').textContent==='Failed'`,90000);
    assert(await evaluate(`document.querySelector('[data-error=true] pre').textContent.includes('ZeroDivisionError')`),'error stream separated from normal output');
    assert(await evaluate(`(()=>{const pre=document.querySelector('[data-error=true] pre'),style=getComputedStyle(pre);const lum=color=>{const c=color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};const a=lum(style.color),b=lum(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5})()`),'light console error contrast');
    const errorShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'light-error-280.png'),Buffer.from(errorShot.data,'base64'));
    await wait(`!document.querySelector('.py-run').disabled`);await click('Editor');await replaceCode('print("x" * 30000)');await click('Run Code');
    await wait(`!document.querySelector('.py-run').disabled && document.querySelector('#py-console').textContent.includes('Output limited to 24,000 characters per stream')`,90000);
    assert(await evaluate(`document.querySelector('#py-console > details.py-card .py-stream pre').textContent.length===24000 && document.querySelector('.py-body').scrollWidth<=document.querySelector('.py-body').clientWidth+1`),'maximum output is bounded and wraps within the console');
    await click('Editor');await evaluate(`document.querySelector('[role=tab][aria-selected=true]').focus()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});
    assert(await evaluate(`document.activeElement.id==='py-tab-console' && !document.querySelector('#py-console').hidden`),'tab arrow navigation');
    await viewport(390,844);await click('Editor');
    await evaluate(`Object.defineProperty(window.visualViewport,'height',{configurable:true,value:300});window.dispatchEvent(new Event('resize'))`);
    await wait(`document.querySelector('.py-ide').classList.contains('py-keyboard')`);
    await evaluate(`document.querySelector('.py-menu').open=true`);
    assert(await evaluate(`document.querySelector('.py-menu-body').getBoundingClientRect().bottom<=300`),'menu stays above keyboard');
    await click('Editor settings');
    await wait(`document.querySelector('.py-settings').open && document.activeElement?.textContent==='Editor settings and input'`);
    assert(await evaluate(`document.querySelector('.py-settings').getBoundingClientRect().height>0`),'settings remain accessible with keyboard open');
    await evaluate(`document.querySelector('.py-menu').open=false;delete window.visualViewport.height;window.dispatchEvent(new Event('resize'))`);
    await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/?lang=en`});await wait(`!!document.querySelector('.cm-content')`);
    await replaceCode('print("refresh recovery")');await send('Page.reload');await wait(`document.querySelector('.cm-content')?.textContent.includes('refresh recovery')`);
    await click('Console');assert(await evaluate(`document.querySelector('#py-console').textContent.includes('Your next result starts here')`),'execution history is session-only after refresh');
    checks.push({interaction:'cross-file undo, consecutive prompts, repeated run/stop, 30k long line, search, wrapping, light errors, keyboard menu, tab keys and refresh recovery',passed:true});
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify(checks,null,2));
    console.log(`PASS ${checks.filter(check=>check.width).length} viewport/locale cases; accessory keys, pairing, cursor retention, real Python execution and exercise grading, saving, settings, close bridge, short/simulated keyboard viewport and offline state. Screenshots: ${output}`);
  } finally {socket?.close();chrome.kill();server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
