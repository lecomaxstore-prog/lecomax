import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Isolated PostgreSQL runtime: never reads environment credentials or production.
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create table products(id uuid primary key default gen_random_uuid(),slug text unique,name text,price numeric,stock integer,active boolean default true,colors text[],sizes text[],color_stock jsonb,tags text[]);
create table orders(id uuid primary key default gen_random_uuid(),order_number text unique,customer jsonb,items jsonb,total numeric,payment_method text,payment_reference text unique,payment_status text,payment_currency text,payment_amount numeric,status text,tracking_number text,notes text,created_at timestamptz,updated_at timestamptz,order_source text,idempotency_key text unique);
insert into products(slug,name,stock,price) values('legacy','Legacy',2,100);
insert into orders(order_number,items,status) values('LEGACY','[{"slug":"legacy","qty":1}]','pending');
`);
for (const migration of ['20260904130000_atomic_color_size_inventory.sql','20260906140000_preorders.sql','20260906160000_preorder_audit.sql']) await db.exec(readFileSync(new URL('../supabase/migrations/'+migration,import.meta.url),'utf8'));
assert.equal((await db.query("select preorder_enabled from products where slug='legacy'")).rows[0].preorder_enabled,false);
assert.deepEqual((await db.query("select items from orders where order_number='LEGACY'")).rows[0].items,[{slug:'legacy',qty:1}]);
const product = async (slug,stock,enabled=false,extra={}) => {
  await db.query('insert into products(slug,name,price,stock,preorder_enabled,colors,sizes,tags,color_stock,preorder_message) values($1,$1,100,$2,$3,$4,$5,$6,$7,$8)',[slug,stock,enabled,extra.colors??[],extra.sizes??[],extra.tags??[],extra.color_stock??{},extra.message??null]);
};
let serial=0;
const line=(slug,qty=1,extra={})=>({slug,qty,price:100,base_price:100,pricing_tags:[],fulfillment_type:'STANDARD',...extra});
const order=(items,key='test-request-'+(++serial))=>({order_number:'ECO-'+(++serial),idempotency_key:key,items,customer:{email:'test@example.invalid'},total:items.reduce((a,i)=>a+i.price*i.qty,0),status:'pending',order_source:'website'});
const create=async value=>(await db.query('select create_order_with_inventory($1) result',[value])).rows[0].result;
const stock=async slug=>(await db.query('select stock from products where slug=$1',[slug])).rows[0].stock;
const transition=async(id,status)=>(await db.query('select update_order_with_inventory($1,$2) result',[id,{status}])).rows[0].result;

for(const enabled of [false,true]) {
  const slug='normal-'+enabled;await product(slug,5,enabled);
  const result=await create(order([line(slug)]));assert.equal(result.items[0].fulfillment_type,'STANDARD');assert.equal(await stock(slug),4);
}
await product('waiting',0,true,{message:'Expected in October'});
const waiting=await create(order([line('waiting',2,{fulfillment_type:'PREORDER',preorder_message:'Expected in October'})]));
assert.equal(await stock('waiting'),0);assert.equal(waiting.items[0].preorder_message,'Expected in October');
await product('disabled',0,false);
await assert.rejects(create(order([line('disabled',1,{fulfillment_type:'PREORDER'})])),/PREORDER_UNAVAILABLE/);
await db.query("update products set preorder_enabled=false where slug='waiting'");
await assert.rejects(create(order([line('waiting',1,{fulfillment_type:'PREORDER'})])),/PREORDER_UNAVAILABLE/);
assert.equal((await db.query('select items from orders where id=$1',[waiting.id])).rows[0].items[0].fulfillment_type,'PREORDER');
await assert.rejects(transition(waiting.id,'processing'),/PREORDER_WAITING_FOR_STOCK/);
await db.query("update products set stock=10 where slug='waiting'");
assert.equal((await db.query('select items from orders where id=$1',[waiting.id])).rows[0].items[0].fulfillment_type,'PREORDER');
await transition(waiting.id,'processing');assert.equal(await stock('waiting'),8);
await transition(waiting.id,'processing');assert.equal(await stock('waiting'),8);
await transition(waiting.id,'cancelled');assert.equal(await stock('waiting'),10);
await transition(waiting.id,'cancelled');assert.equal(await stock('waiting'),10);

await product('variants',5,true,{colors:['Black'],sizes:['M','L'],color_stock:{Black:5},tags:['__vstock:["Black",{"M":5,"L":0}]','__sstock:M:5','__sstock:L:0']});
const mixed=await create(order([line('variants',1,{color:'Black',size:'M'}),line('variants',2,{color:'Black',size:'L',fulfillment_type:'PREORDER'})]));
assert.deepEqual(mixed.items.map(i=>i.fulfillment_type),['STANDARD','PREORDER']);assert.equal(await stock('variants'),4);
await assert.rejects(create(order([line('variants',1,{color:'Black',size:'XL',fulfillment_type:'PREORDER'})])),/INVALID_VARIANT/);
await assert.rejects(create(order([line('variants',1,{fulfillment_type:'PREORDER'})])),/INVALID_VARIANT/);
await product('overflow',2,true);
await create(order([line('overflow',4,{fulfillment_type:'PREORDER'})]));assert.equal(await stock('overflow'),2);
await product('last',1,false);
const results=await Promise.allSettled([create(order([line('last')])),create(order([line('last')]))]);
assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(await stock('last'),0);
await product('duplicate',0,true);
const request=order([line('duplicate',1,{fulfillment_type:'PREORDER'})],'duplicate-request');
const retries=await Promise.all([create(request),create(request)]);assert.equal(retries[0].id,retries[1].id);
assert.equal((await db.query("select count(*)::int count from orders where idempotency_key='duplicate-request'")).rows[0].count,1);
await product('rollback',3);
await assert.rejects(create(order([line('rollback'),line('disabled')])),/PREORDER_UNAVAILABLE/);assert.equal(await stock('rollback'),3);
await assert.rejects(create(order([line('rollback',0)])),/INVALID_INVENTORY_QUANTITY/);
await assert.rejects(create(order([line('rollback',1,{base_price:99})])),/PRICE_CHANGED/);
for (const enabled of [false,true]) for (const [physical,qty] of [[1,1],[1,2],[0,5]]) {
  const slug=`matrix-${enabled}-${physical}-${qty}`; await product(slug,physical,enabled);
  const payload=order([line(slug,qty,{fulfillment_type:physical>=qty?'STANDARD':'PREORDER'})]);
  if (!enabled && physical<qty) await assert.rejects(create(payload),/PREORDER_UNAVAILABLE/);
  else await create(payload);
  assert.equal(await stock(slug),physical>=qty?physical-qty:physical);
}
await product('last-preorder',1,true);
const lastRequests=await Promise.allSettled([create(order([line('last-preorder')])),create(order([line('last-preorder')]))]);
assert.equal(lastRequests.filter(result=>result.status==='fulfilled').length,1);
assert.equal(await stock('last-preorder'),0);
await create(order([line('last-preorder',1,{fulfillment_type:'PREORDER'})]));
assert.equal(await stock('last-preorder'),0);
await assert.rejects(create(order([line('rollback',1,{color:'invented'})])),/INVALID_VARIANT/);
await assert.rejects(create(order([line('rollback',1,{size:'invented'})])),/INVALID_VARIANT/);
for (const qty of [1.5,'1',null]) await assert.rejects(create(order([line('rollback',qty)])),/INVALID_INVENTORY_QUANTITY/);
await product('date-race',0,true,{message:'November'});
await assert.rejects(create(order([line('date-race',1,{fulfillment_type:'PREORDER',preorder_message:'October'})])),/FULFILLMENT_CHANGED/);
await assert.rejects(create({...order([]),items:null}),/INVALID_INVENTORY_ITEMS/);
await product('rename',0,true);
const rename=await create(order([line('rename',1,{fulfillment_type:'PREORDER'})]));
await db.query("update products set slug='renamed',stock=2 where slug='rename'");
await product('rename',9,true);
await transition(rename.id,'processing');
assert.equal(await stock('renamed'),1);assert.equal(await stock('rename'),9);
await transition(rename.id,'cancelled');
assert.equal(await stock('renamed'),2);assert.equal(await stock('rename'),9);
assert.equal((await db.query('select items from orders where id=$1',[rename.id])).rows[0].items[0].slug,'rename');
await db.exec('set role anon');
await assert.rejects(create(request),/permission denied/);await db.exec('reset role');
console.log('PASS: migration, standard/preorder, variants, mixed cart, quantity overflow, stale/forged flags, snapshots, retry, rollback, fulfillment, cancellation and RPC permissions.');
console.log('Concurrency calls are serialized by PGlite; multi-connection production lock contention requires staging verification.');
await db.exec(`
create table settings(key text primary key,value text,updated_at timestamptz default now());
create table shipping_zones(id uuid primary key default gen_random_uuid(),name text,cities text[],standard_rate numeric,free_threshold numeric,estimated_days text,sort_order integer,active boolean);
create table coupons(id uuid primary key default gen_random_uuid(),active boolean,expires_at timestamptz,max_uses integer,used_count integer,type text,value numeric,min_order numeric);
insert into settings(key,value) values('shipping_cost','40');
`);
await db.exec(readFileSync(new URL('../supabase/migrations/20260908120000_commerce_consistency.sql',import.meta.url),'utf8'));
await product('commerce',10);
const commerceOrder = (fee=40, discount=0) => ({...order([line('commerce')]),total:100+fee-discount,
  pricing_snapshot:{currency:'MAD',subtotal:100,shipping:fee,paymentFee:0,discount,taxes:0,taxesIncluded:true,total:100+fee-discount}});
const commerceCreate = async (value, settings={shipping_cost:'40'}, coupon=null) =>
  (await db.query('select create_commerce_order($1,$2,$3,$4,$5) result',[value,settings,['shipping_cost'],[],coupon])).rows[0].result;
const purchased = await commerceCreate(commerceOrder());
assert.equal(purchased.pricing_snapshot.total,140);
await db.query("update settings set value='45' where key='shipping_cost'");
await assert.rejects(commerceCreate(commerceOrder()),/CHECKOUT_CONFIGURATION_CHANGED/);
assert.equal((await db.query('select pricing_snapshot from orders where id=$1',[purchased.id])).rows[0].pricing_snapshot.shipping,40);
assert.equal((await commerceCreate(commerceOrder(45),{shipping_cost:'45'})).pricing_snapshot.total,145);
const coupon = (await db.query("insert into coupons(active,max_uses,used_count,type,value,min_order) values(true,1,0,'fixed',10,0) returning *")).rows[0];
const discounted = commerceOrder(45,10);
await commerceCreate(discounted,{shipping_cost:'45'},coupon);
await commerceCreate(discounted,{shipping_cost:'45'},coupon); // retry must not consume again
assert.equal((await db.query('select used_count from coupons where id=$1',[coupon.id])).rows[0].used_count,1);
await assert.rejects(commerceCreate(commerceOrder(45,10),{shipping_cost:'45'},coupon),/COUPON_CHANGED/);
assert.equal(await stock('commerce'),7);
await db.exec('set role anon');
await assert.rejects(commerceCreate(commerceOrder()),/permission denied/);
await db.exec('reset role');
console.log('PASS: commerce migration, configuration conflict, immutable snapshot, coupon limit, idempotent redemption and RPC permissions.');
await db.close();
