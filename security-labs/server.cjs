const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const c = require('./controls.cjs');
async function createLab() {
  const db = new PGlite();
  await db.waitReady;
  await db.exec("CREATE TABLE lab_products(id integer PRIMARY KEY,name text); INSERT INTO lab_products VALUES(1,'Bag'),(2,'Cup')");
  const sessions = new Map();
  const events = new Set();
  const webhookSecret = crypto.randomBytes(32);
  const limit = c.createLimiter(30,60000);
  const state = { stock: 3, purchases: [], couponOwners: new Set() };
  let origin;
  async function body(req) {
    const chunks=[]; let size=0;
    for await (const chunk of req) { size+=chunk.length; if(size>32768)c.reject('Body too large',413); chunks.push(chunk); }
    return Buffer.concat(chunks);
  }
  const server = http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Cache-Control','no-store');
    const reply=(status,data)=>{ res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data)); };
    try {
      const host = new URL(origin).host;
      if(req.headers.host!==host)c.reject('Use the exact loopback lab address',403);
      if(req.headers.origin && req.headers.origin!==origin)c.reject('Foreign origin rejected',403);
      if(req.headers['sec-fetch-site']==='cross-site')c.reject('Cross-site request rejected',403);
      if(!limit(req.socket.remoteAddress||'local'))c.reject('Lab request budget exceeded; wait one minute',429);
      const url=new URL(req.url,origin);
      const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('lab_session='))?.slice(12);
      const session=sessions.get(token);
      if(url.pathname==='/health' && req.method==='GET')return reply(200,{service:'cedar-cart-lab',scope:'loopback only',persistence:'in memory'});
      if(url.pathname==='/' && req.method==='GET'){
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});
        return res.end(fs.readFileSync(path.join(__dirname,'index.html')));
      }
      if(['/lab.js','/lab.css'].includes(url.pathname) && req.method==='GET'){
        res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8'});
        return res.end(fs.readFileSync(path.join(__dirname,url.pathname.slice(1))));
      }
      if(url.pathname==='/api/session' && req.method==='POST'){
        const input=JSON.parse((await body(req)).toString());
        if(!['alice','bob','admin'].includes(input.actor))c.reject('Choose a synthetic lab actor');
        if(token)sessions.delete(token);
        const id=crypto.randomBytes(24).toString('hex');
        const value={id:input.actor,role:input.actor==='admin'?'admin':'customer',csrf:crypto.randomBytes(24).toString('hex')};
        sessions.set(id,value);
        res.setHeader('Set-Cookie','lab_session='+id+'; HttpOnly; SameSite=Strict; Path=/');
        return reply(200,{actor:value.id,csrf:value.csrf,notice:'Test actor selector, not production authentication. HTTP loopback only.'});
      }
      if(url.pathname==='/api/order' && req.method==='GET'){
        const id=url.searchParams.get('id');
        return reply(200,url.searchParams.get('mode')==='unsafe'?c.vulnerableOrder(id):c.secureOrder(id,session));
      }
      if(url.pathname==='/api/search' && req.method==='GET'){
        const name=url.searchParams.get('name')||'';
        if(name.length>100)c.reject('Name too long');
        const result=url.searchParams.get('mode')==='unsafe'?await db.query(c.vulnerableQuery(name)):await db.query(c.secureQuery(name).text,c.secureQuery(name).values);
        return reply(200,{rows:result.rows});
      }
      if(url.pathname==='/api/checkout' && req.method==='POST'){
        if(!session)c.reject('Select a synthetic actor first',401);
        const input=JSON.parse((await body(req)).toString());
        c.secureCsrf({method:req.method,origin:req.headers.origin,token:req.headers['x-csrf-token']},session,origin);
        if(url.searchParams.get('mode')==='unsafe')return reply(200,{totalCents:c.vulnerableCheckout(input),notice:'Unsafe price calculation only; no state mutation.'});
        const quote=c.secureCheckout(input);
        const nextStock=c.reserve(state.stock,quote.quantity);
        if(input.coupon && input.coupon!=='WELCOME')c.reject('Unknown coupon');
        if(input.coupon && state.couponOwners.has(session.id))c.reject('Coupon already used',409);
        const discount=input.coupon?500:0;
        const purchase={id:'purchase-'+(state.purchases.length+1),ownerId:session.id,...quote,totalCents:Math.max(0,quote.totalCents-discount),status:'pending'};
        // No await between validation and these writes in this single-process toy.
        // Production needs a database transaction, durable idempotency and constraints.
        state.stock=nextStock;state.purchases.push(purchase);
        if(input.coupon)state.couponOwners.add(session.id);
        return reply(201,purchase);
      }
      if(url.pathname==='/api/admin' && req.method==='GET')return reply(200,c.secureAdmin(session));
      if(url.pathname==='/api/state' && req.method==='GET'){
        if(!session)c.reject('Select a synthetic actor first',401);
        return reply(200,{stock:state.stock,purchases:state.purchases.filter(p=>p.ownerId===session.id)});
      }
      if(url.pathname==='/api/webhook' && req.method==='POST'){
        const raw=await body(req);
        return reply(200,c.verifyEvent(raw,Number(req.headers['x-lab-time']),req.headers['x-lab-signature'],webhookSecret,events));
      }
      if(url.pathname==='/xss' && req.method==='GET'){
        const value=url.searchParams.get('name')||'Learner';
        if(value.length>300)c.reject('Name too long');
        const unsafe=url.searchParams.get('mode')==='unsafe';
        res.setHeader('Content-Security-Policy',unsafe?"default-src 'none'; img-src 'self'; script-src 'unsafe-inline'; style-src 'none'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
        return res.end('<!doctype html><html lang="en"><meta charset="utf-8"><title>Local XSS demonstration</title><h1>Local demonstration only</h1><p id="demo-status">No marker executed</p>'+(unsafe?c.vulnerableGreeting(value):c.secureGreeting(value))+'<p>No real accounts or data exist in this lab. Close this page after observing.</p></html>');
      }
      return reply(404,{message:'Lab route not found'});
    } catch(error) {
      if(!res.headersSent)reply(error.status||400,c.safeError(error,crypto.randomUUID()));
      else res.end();
    }
  });
  return {
    server,db,webhookSecret,
    async start(port=4177){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});origin='http://127.0.0.1:'+server.address().port;return origin;},
    async close(){await new Promise(resolve=>server.close(resolve));await db.close();}
  };
}
if(require.main===module)createLab().then(async lab=>{
  const origin=await lab.start();
  console.log('Cedar Cart lab: '+origin+' (synthetic data, in memory, loopback only)');
  console.log('Stop with Ctrl+C. Restart resets purchases and test sessions. Do not tunnel or deploy this lab.');
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>lab.close().then(()=>process.exit(0)));
}).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={createLab};
