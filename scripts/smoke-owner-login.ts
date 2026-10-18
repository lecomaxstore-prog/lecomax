import {ownerHttpFixture} from '../tests/helpers/owner-http.ts';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=process.cwd(),out=resolve(root,'.owner-auth-qa');await mkdir(out,{recursive:true});
const fixture=await ownerHttpFixture();
const directory=resolve(root,'lecomax-learning-app/dist-owner-auth-qa');
const staticServer=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url||'/','http://localhost').pathname);const target=resolve(directory,'.'+path);if(!target.startsWith(directory)){res.writeHead(403);res.end();return;}const file=extname(target)?target:resolve(directory,'index.html');const content=await readFile(file);res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png'}[extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end();}});
await new Promise<void>(r=>staticServer.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+(staticServer.address() as any).port;
const profile=resolve(out,'chrome-'+Date.now());
const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws:WebSocket|undefined;
try{
 let port='';for(let i=0;i<100;i++){port=(await readFile(resolve(profile,'DevToolsActivePort'),'utf8').catch(()=>'' )).split('\n')[0];if(port)break;await new Promise(r=>setTimeout(r,100));}assert.ok(port,'Chrome did not start');
 const targets=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();ws=new WebSocket(targets.find((t:any)=>t.type==='page').webSocketDebuggerUrl);await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Browser connection timed out')),10000);ws!.addEventListener('open',()=>{clearTimeout(timeout);resolve();},{once:true});ws!.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('Browser connection failed'));},{once:true});});
 let id=0;const pending=new Map<number,any>();const errors:string[]=[];
 const send=(method:string,params:any={})=>new Promise<any>((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws!.send(JSON.stringify({id:n,method,params}));});
 ws.addEventListener('message',async e=>{const m=JSON.parse(String(e.data));if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);return;}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused'){
   const {requestId,request}=m.params;try{
    const path=new URL(request.url).pathname;
    if(request.method==='OPTIONS'){await send('Fetch.fulfillRequest',{requestId,responseCode:204,responseHeaders:[{name:'Access-Control-Allow-Origin',value:origin},{name:'Access-Control-Allow-Methods',value:'GET,POST,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'content-type,authorization'}]});return;}
    const response=await fetch(fixture.url+path,{method:request.method,headers:{'Content-Type':'application/json',...(request.headers.Authorization?{Authorization:request.headers.Authorization}:{})},body:request.postData});
    await send('Fetch.fulfillRequest',{requestId,responseCode:response.status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origin}],body:Buffer.from(await response.text()).toString('base64')});
   }catch{await send('Fetch.failRequest',{requestId,errorReason:'Failed'});}
  }
 });
 const evaluate=async(expression:string)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const wait=async(expression:string)=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,150));}throw Error('UI condition timed out: '+expression+' / '+await evaluate('document.body.innerText.slice(0,2000)'));};
 const click=async(label:string)=>{await evaluate('(()=>{const e=Array.from(document.querySelectorAll(\'[role="button"]\')).find(e=>e.getAttribute("aria-label")==='+JSON.stringify(label)+');if(!e)throw Error("Missing button");e.click()})()');};
 const fill=async(label:string,value:string)=>evaluate('(()=>{const e=Array.from(document.querySelectorAll("input")).find(e=>e.getAttribute("aria-label")==='+JSON.stringify(label)+');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}))})()');
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await send('Fetch.enable',{patterns:[{urlPattern:'https://lecomax.com/api/learning-mobile/*'}]});await send('Page.navigate',{url:origin+'/lesson/private-deep-link'});
 await wait("!!document.querySelector('[aria-label=\"English\"]')");
 await writeFile(resolve(out,'login-ar.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await click('English');await wait('document.body.innerText.includes("Secure login")');
 await writeFile(resolve(out,'login-en.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await fill('Email address',fixture.email);await fill('Password','wrong-password');await click('Sign in');await wait('document.body.innerText.includes("Invalid credentials")');
 await fill('Password',fixture.password);await click('Sign in');await wait('document.body.innerText.includes("Stay signed in on this device?")');
 await writeFile(resolve(out,'remember-device.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await click('No, just this session');await wait('!document.body.innerText.includes("Stay signed in on this device?") && !document.body.innerText.includes("Secure login")');
 // Reload a protected route: web session-only credentials must not survive.
 await send('Page.navigate',{url:origin+'/settings'});await wait('document.body.innerText.includes("Secure login")');
 assert.deepEqual(errors,[]);console.log('PASS: deep-link guard; Arabic/English login; generic rejection; real password login; remember choice; session-only reload guard. Screenshots: .owner-auth-qa/');
}finally{ws?.close();chrome.kill();await fixture.close();staticServer.closeAllConnections();await new Promise<void>(r=>staticServer.close(()=>r()));}
