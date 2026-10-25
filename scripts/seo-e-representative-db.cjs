// Runs only inside the fixed loopback PG17 rehearsal, with synthetic rows.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {Client}=require('pg');
module.exports=async function({client,host,port,password,report,check,workspace}){
 assert.equal(host,'127.0.0.1');assert.equal(port,55460);
 const inventory=JSON.parse(fs.readFileSync(path.join(workspace,'artifacts/seo-e-final-20261022/production-schema-1792696389394.json')));assert(inventory.passed&&inventory.tlsVerified);
 await check('six exact candidate migrations accept actual production UUID/array column shapes',async()=>{
  await client.query('create database seo_e_representative');const db=new Client({host,port,user:'postgres',password,database:'seo_e_representative'});await db.connect();
  try{assert.equal((await db.query('select inet_server_port() port')).rows[0].port,55460);
   const types={uuid:'uuid',text:'text',numeric:'numeric',int4:'integer',bool:'boolean',timestamptz:'timestamptz',_text:'text[]',jsonb:'jsonb',date:'date'};
   for(const table of ['products','categories']){const cols=inventory.columns.filter(x=>x.table_name===table);assert(cols.length);const definitions=cols.map(c=>{assert(/^[a-z_]+$/.test(c.column_name));assert(types[c.udt_name]);return '"'+c.column_name+'" '+types[c.udt_name]+(c.column_name==='id'?' primary key':'')+(c.is_nullable==='NO'?' not null':'');});await db.query('create table '+table+'('+definitions.join(',')+')');}
   await db.query("insert into products(id,name,slug,category,price,stock,active,featured,preorder_enabled,images) values('00000000-0000-4000-8000-000000000001','Synthetic product','synthetic-product','synthetic-category',100,7,true,false,false,ARRAY['/synthetic.png'])");
   await db.query("insert into categories(id,name,slug,active) values('00000000-0000-4000-8000-000000000002','Synthetic category','synthetic-category',true)");
   const plan=JSON.parse(fs.readFileSync(path.join(workspace,'operations/seo/production-readiness-20261021/migration-plan.json')));
   for(const m of plan.migrations){const bytes=fs.readFileSync(path.join(workspace,'release/seo-e-cumulative-20261022',m.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);await db.query(bytes.toString());}
   await db.query("select sync_seo_document('product',to_jsonb(p)) from products p");await db.query("select sync_seo_document('category',to_jsonb(c)) from categories c");
   const docs=(await db.query('select kind,entity_id,source,published,draft from seo_documents order by kind')).rows;assert.equal(docs.length,2);assert(docs.every(d=>d.published===null&&d.draft===null));assert.deepEqual(docs.find(d=>d.kind==='product').source.images,['/synthetic.png']);
   const state=(await db.query("select seo_editorial_read('00000000-0000-4000-8000-000000000001') value")).rows[0].value;assert(state);
   assert.equal((await db.query("select count(*)::int n from pg_trigger where tgrelid in ('products'::regclass,'categories'::regclass) and not tgisinternal")).rows[0].n,0);
   report.representative={productionVersion:inventory.identity.version,rehearsalVersion:'17.11',migrations:6,uuidIdentifiers:true,textArrayImages:true,syntheticRows:2,commerceTriggersAdded:0,limitation:'Production column names/types/nullability reproduced; no production records, full constraints, managed extensions or platform restore simulated.'};
  }finally{await db.end();}
 });
};
