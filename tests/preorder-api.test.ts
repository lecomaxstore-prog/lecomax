import { securityIo } from "./helpers/security-io.ts";
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as nodeCrypto from 'node:crypto';

// Execute the real route and pricing/availability modules. Only I/O is replaced;
// these requests cannot send notifications, charge payments or write a real DB.
function setup(overrides: Record<string, unknown> = {}, settings: Record<string, string> = {shipping_cost:'0',free_shipping_threshold:'0'}, admin = false) {
  const product = {id:'product-id',slug:'test',name:'Test',price:100,stock:1,active:true,colors:[],sizes:[],tags:[],preorder_enabled:false,...overrides};
  const writes: any[]=[];
  const db = {
    from(table: string) {
      let single=false;
      const query: any = {
        select:()=>query,eq:()=>query,in:()=>query,delete:()=>query,update:()=>query,order:()=>query,
        upsert:(rows:any[])=>{ if(table==='settings') for(const row of rows) settings[row.key]=row.value; return query; },
        insert:()=>query,
        single:()=>{single=true;return query;},maybeSingle:()=>{single=true;return query;},
        then(resolve: (value: unknown)=>void) { resolve({data:table==='products'?[product]:table==='settings'?Object.entries(settings).map(([key,value])=>({key,value})):single?null:[],error:null}); },
      };
      return query;
    },
    async rpc(name: string, args: any) {
      if(name==='create_commerce_order') {writes.push(args.p_order);return {data:{id:'order-id',order_number:'ECO-TEST',items:args.p_order.items,pricing_snapshot:args.p_order.pricing_snapshot},error:null};}
      return {data:null,error:null};
    },
  };
  const mocks: Record<string, unknown> = {
    'server-only':{}, 'node:crypto':nodeCrypto,
    'next/server':{NextResponse:{json:(value:unknown, init:ResponseInit)=>Response.json(value,init)}},
    '@supabase/supabase-js':{createClient:()=>db},
    '@/lib/supabase-server':{createServerSupabaseClient:()=>db},
    '@/lib/request-auth':{getCustomerUser:async()=>null,isAdminRequest:async()=>false},
    '@/lib/api-security':{enforceRateLimit:()=>null,protectAdminMutation:async()=>admin?null:Response.json({error:'Unauthorized'},{status:401})},
    '@/lib/admin-session':{verifySessionToken:async()=>admin?'admin@example.invalid':null},
    '@/lib/admin-settings-access':{requireSettingsPermission:async()=>admin?null:Response.json({error:'Forbidden'},{status:403})},
    'next/cache':{revalidatePath:()=>{},revalidateTag:()=>{}},
    '@/lib/product-discovery':{publishProductDiscovery:()=>{throw new Error('Unexpected publish');}},
    '@/lib/push-notifications':{broadcastAdminPushNotification:async()=>{}},
    '@/lib/paypal-server':{verifyPayPalCapture:async()=>{throw new Error('Unexpected payment');}},
    '@/lib/product-variant-image':{resolveProductVariantImage:()=>''},
    resend:{Resend:class {}},
  };
  const cache=new Map<string,any>();
  function load(path: string): any {
    if(cache.has(path))return cache.get(path);
    const exports={};cache.set(path,exports);
    vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
      exports,console,URL,AbortSignal,crypto,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test'}},
      require:(name:string)=>{
      const securityModule = securityIo(name); if (securityModule) return securityModule;
        if(name in mocks)return mocks[name];
        const canonical = name.startsWith('./') && dirname(path) === resolve('lib') ? '@/lib/'+name.slice(2) : name;
        if(canonical in mocks)return mocks[canonical];
        const candidate=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(path),name);
        const file=existsSync(candidate+'.ts')?candidate+'.ts':candidate;
        return load(file);
      },
    },{filename:path});
    return exports;
  }
  const request=(body:unknown,key='audit-request-000001')=>({json:async()=>body,cookies:{get:()=>admin?{value:'test-session'}:undefined},headers:new Headers(key?{'idempotency-key':key}:{}),url:'https://shop.invalid/api/orders'});
  return {writes,settings:(body:unknown)=>load(resolve('app/api/settings/route.ts')).POST(request(body)),product:(body:unknown)=>load(resolve('app/api/products/route.ts')).POST(request(body)),validateProduct:(body:unknown)=>load(resolve('lib/product-api-validation.ts')).cleanProductPayload(body,'update'),order:(body:unknown,key?:string)=>load(resolve('app/api/orders/route.ts')).POST(request(body,key)),quote:(body:unknown)=>load(resolve('app/api/checkout/quote/route.ts')).POST(request(body))};
}
const body=(item:Record<string,unknown>={},extra:Record<string,unknown>={})=>({customer:{name:'Test',phone:'0600000000',city:'Rabat',email:'test@example.invalid',address:'Test'},items:[{slug:'test',name:'Test',price:100,qty:1,...item}],total:100,shipping:0,payment_fee:0,payment_provider:'cod',...extra});

test('order API rejects missing keys, malformed quantities and invented variants',async()=>{
  for(const item of [{qty:0},{qty:1.5},{qty:21},{qty:'1'},{color:{}},{fulfillment_type:'fake'}]) {
    const api=setup();assert.equal((await api.order(body(item))).status,400);assert.equal(api.writes.length,0);
  }
  assert.equal((await setup().order(body(), '')).status,400);
  assert.equal((await setup().order(body({color:'invented'}))).status,409);
});
test('client stock and preorder flags cannot authorize unavailable inventory',async()=>{
  for(const fields of [{stock:1000,preorderEnabled:true,isPreorder:true},{fulfillment_type:'PREORDER'}]) {
    const api=setup({stock:0});assert.equal((await api.order(body(fields))).status,409);assert.equal(api.writes.length,0);
  }
  assert.equal((await setup({stock:0,preorder_enabled:true}).order(body())).status,409);
});
test('quote normalizes slugs and uses authoritative variant pricing and fulfillment',async()=>{
  const api=setup({stock:0,preorder_enabled:true,colors:['Black'],color_stock:{Black:0},tags:['__cprice:Black:150:'],preorder_estimated_at:'2026-11-01'});
  const response=await api.quote({city:'Rabat',paymentProvider:'cod',items:[{slug:' test ',quantity:2,color:'Black',price:1}]});
  assert.equal(response.status,200);
  const quote=await response.json();
  assert.equal(quote.items[0].price,150);assert.equal(quote.subtotal,300);
  assert.equal(quote.items[0].fulfillment_type,'PREORDER');assert.equal(quote.items[0].preorder_estimated_at,'2026-11-01');
  assert.equal(quote.priceChanged,true);assert.equal(api.writes.length,0);
});
test('a fake lower price and total cannot reach order insertion',async()=>{
  const api=setup();const response=await api.order(body({price:1},{total:1}));
  assert.equal(response.status,409);assert.equal(api.writes.length,0);
});
test('standard and preorder order payloads use server prices and snapshots',async()=>{
  for(const preorder of [false,true]) {
    const api=setup({stock:preorder?0:1,preorder_enabled:preorder,preorder_message:'November'});
    const response=await api.order(body({price:100,fulfillment_type:preorder?'PREORDER':'STANDARD'}));
    assert.equal(response.status,201,JSON.stringify(await response.json()));
    assert.equal(api.writes[0].items[0].price,100);
    assert.equal(api.writes[0].items[0].fulfillment_type,preorder?'PREORDER':'STANDARD');
    assert.equal(api.writes[0].items[0].preorder_message,preorder?'November':null);
  }
});

test('shipping changes invalidate stale checkout and preserve purchased snapshots', async () => {
  const settings = { shipping_cost: '40', free_shipping_threshold: '500' };
  const api = setup({ stock: 20 }, settings, true);
  const input = { city: 'Rabat', items: [{ slug: 'test', quantity: 1 }], paymentProvider: 'cod' };
  const website = await (await api.quote(input)).json();
  const mobile = await (await api.quote(input)).json();
  assert.equal(website.shipping, 40);
  assert.deepEqual(website, mobile);
  assert.equal((await api.order(body({}, { shipping: 40, total: 140 }))).status, 201);
  const snapshot = JSON.stringify(api.writes[0].pricing_snapshot);
  assert.equal((await api.settings({shipping_cost:'45'})).status,200);
  const stale = await api.order(body({}, { shipping: 40, total: 140 }));
  assert.equal(stale.status, 409);
  const changed = await stale.json();
  assert.equal(changed.code, 'CART_CHANGED');
  assert.equal(changed.calculation.total, 145);
  assert.equal(api.writes.length, 1);
  assert.equal(JSON.stringify(api.writes[0].pricing_snapshot), snapshot);
  assert.equal((await api.order(body({}, { shipping: 45, total: 145 }))).status, 201);
});

test('settings writes require authorization and reject invalid financial values', async () => {
  const values={shipping_cost:'40',free_shipping_threshold:'500'};
  assert.equal((await setup({},values).settings({shipping_cost:'1'})).status,401);
  assert.equal(values.shipping_cost,'40');
  const api=setup({},values,true);
  for(const value of [-1, null, true, '', 'Infinity', 'NaN', 1.001]) assert.equal((await api.settings({shipping_cost:value})).status,400);
  assert.equal((await api.settings({SUPABASE_SERVICE_ROLE_KEY:'fake'})).status,400);
  assert.equal(values.shipping_cost,'40');
});

test('decimal and custom sizes remain valid with shoe guides', () => {
  const api = setup();
  const result = api.validateProduct({ sizes: ['44', '44.5', 'Wide 44'], tags: [], size_guide_type: 'shoes', size_stock: { '44': 3, '44.5': 4, 'Wide 44': 1 } });
  assert.ok(!result.error, result.error);
  assert.equal(result.payload.stock, 8);
  assert.deepEqual(Array.from(result.payload.sizes), ['44', '44.5', 'Wide 44']);
  for (const input of [{price:true}, {price:null}, {price:' '}, {price:1.001}, {stock:false}, {sizes:[44.5]}, {sizes:['44.5','44.5']}]) assert.ok(api.validateProduct(input).error, JSON.stringify(input));
});

test('customer requests cannot mutate preorder fields and admin input is strictly validated',async()=>{
  const api=setup();
  assert.equal((await api.product({preorder_enabled:true})).status,401);
  for(const invalid of [{preorder_enabled:'true'},{preorder_enabled:1},{preorder_estimated_at:'2026-02-30'},{preorder_estimated_at:{}},{preorder_message:'x'.repeat(501)}]) assert.ok('error' in api.validateProduct(invalid));
  assert.equal(api.validateProduct({preorder_enabled:false,preorder_estimated_at:'2026-11-01'}).payload.preorder_enabled,false);
  assert.equal(api.writes.length,0);
});
