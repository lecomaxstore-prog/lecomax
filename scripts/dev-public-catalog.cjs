// Local, read-only public catalog preview. Never loads production credentials.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts/local-public-catalog');
const snapshotFile = path.join(output, 'catalog.json');
const publicUrl = 'https://lecomax.com/api/products?active=true';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');

function selectProducts(products, params) {
  let rows = products.slice();
  for (const [field, expression] of params) {
    if (['select', 'order', 'offset', 'limit'].includes(field)) continue;
    if (expression.startsWith('eq.')) rows = rows.filter(row => String(row[field]) === expression.slice(3));
    else if (expression.startsWith('in.(') && expression.endsWith(')')) {
      const values = expression.slice(4, -1).split(',').map(v => v.replace(/^"|"$/g, ''));
      rows = rows.filter(row => values.includes(String(row[field])));
    } else throw Error('Unsupported local catalog filter: ' + field);
  }
  const order = params.get('order');
  if (order) {
    const [field, direction] = order.split('.');
    rows.sort((a,b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * (direction === 'desc' ? -1 : 1));
  }
  const total = rows.length;
  const offset = Math.max(0, Number(params.get('offset')) || 0);
  rows = rows.slice(offset, params.has('limit') ? offset + Math.max(0, Number(params.get('limit')) || 0) : undefined);
  if (params.get('select') && params.get('select') !== '*') {
    const fields = params.get('select').split(',');
    rows = rows.map(row => Object.fromEntries(fields.map(field => [field, row[field] ?? null])));
  }
  return {rows,total};
}

async function main() {
  fs.mkdirSync(output, {recursive:true});
  if (process.argv.includes('--refresh') || !fs.existsSync(snapshotFile)) {
    const response = await fetch(publicUrl, {redirect:'error',signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw Error('Public catalog HTTP ' + response.status);
    const products = await response.json();
    if (!Array.isArray(products) || !products.length || products.some(p => p.active !== true || !p.id || !p.slug || !Array.isArray(p.images))) throw Error('Invalid public catalog');
    fs.writeFileSync(snapshotFile, JSON.stringify({at:new Date().toISOString(),source:publicUrl,products},null,2));
  }
  const snapshot = JSON.parse(fs.readFileSync(snapshotFile));
  const server = http.createServer((req,res) => {
    res.setHeader('Content-Type','application/json');
    res.setHeader('Cache-Control','no-store');
    const origin = req.headers.origin;
    if (['http://localhost:3000','http://127.0.0.1:3000'].includes(origin)) res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Access-Control-Allow-Headers','apikey,authorization,content-type,x-client-info');
    res.setHeader('Access-Control-Allow-Methods','GET,HEAD,OPTIONS');
    if (req.method === 'OPTIONS') {res.writeHead(204);res.end();return;}
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end(JSON.stringify({message:'Local catalog preview is read-only'}));return;}
    try {
      const url = new URL(req.url,'http://127.0.0.1:54321');
      if (url.pathname === '/rest/v1/products') {
        const {rows,total} = selectProducts(snapshot.products,url.searchParams);
        res.setHeader('Content-Range',rows.length ? `0-${rows.length-1}/${total}` : `*/${total}`);
        const single = String(req.headers.accept).includes('application/vnd.pgrst.object+json');
        if (single && rows.length !== 1) {res.writeHead(406);res.end(JSON.stringify({code:'PGRST116',message:'Expected one row'}));return;}
        res.end(req.method === 'HEAD' ? undefined : JSON.stringify(single ? rows[0] : rows));
      } else if (['settings','banners','reviews','promotions','ecomedia_posts'].some(table => url.pathname === '/rest/v1/'+table)) res.end('[]');
      else {res.writeHead(503);res.end(JSON.stringify({message:'This service is unavailable in the local catalog preview'}));}
    } catch(e) {res.writeHead(400);res.end(JSON.stringify({message:e.message}));}
  });
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(54321,'127.0.0.1',resolve);});
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SystemRoot|windir|ComSpec|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|ProgramFiles|ProgramFiles\(x86\)|PATHEXT|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(key)));
  // Empty inherited dotenv keys prevent Next from loading real integration credentials.
  for (const file of ['.env','.env.local','.env.development','.env.development.local']) {
    const full = path.join(root,file);
    if (fs.existsSync(full)) for (const line of fs.readFileSync(full,'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) env[match[1]] = '';
    }
  }
  Object.assign(env,{NODE_ENV:'development',APP_ENV:'development',NEXT_PUBLIC_APP_ENV:'development',SEO_RUNTIME_ENV:'development',NEXT_PUBLIC_SITE_URL:'http://localhost:3000',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',NEXT_PUBLIC_SUPABASE_KEY_BINDING:'local:'+sha('synthetic-anon'),SUPABASE_SERVICE_KEY_BINDING:'local:'+sha('synthetic-service'),ADMIN_SESSION_SECRET:crypto.randomBytes(32).toString('hex'),NEXT_TELEMETRY_DISABLED:'1'});
  console.log(`Local read-only preview: ${snapshot.products.length} public products (snapshot ${snapshot.at}). No account, checkout, or inventory writes.`);
  const child = spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port','3000'],{cwd:root,env,stdio:'inherit',windowsHide:true});
  child.once('error',e=>{console.error(e.message);server.close();process.exitCode=1;});
  child.once('exit',code=>{server.close();process.exitCode=code || 0;});
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{child.kill();server.close();});
}
if (require.main === module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports = {selectProducts};
