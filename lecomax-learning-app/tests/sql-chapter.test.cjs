const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { PGlite } = require('@electric-sql/pglite');
const root = path.resolve(__dirname, '../..');
const courseRoot = path.join(root,'app/admin/how-it-was-built/course');
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const chapter = read(path.join(courseRoot,'authored/en/sql-transactions-indexes.json'));
const examples = Object.fromEntries(chapter.sections.flatMap(s=>s.blocks).filter(b=>b.type==='code').map(b=>[b.id,b.code.source]));
async function withDb(fn) {
  const db = new PGlite();
  try { await db.waitReady; await db.exec(examples['sql-setup']); await fn(db); }
  finally { await db.close(); }
}
async function rows(db, sql) { return (await db.query(sql)).rows; }

test('SQL chapter survives authored loading and both reader conversions in all locales', async () => {
  const { authoredLesson, authoredSearch } = await import(pathToFileURL(path.join(root,'scripts/course-authored.mjs')));
  for(const lang of ['ar','en','fr']) {
    const authored = read(path.join(courseRoot,'authored',lang,chapter.id+'.json'));
    const module = read(path.join(courseRoot,'content',lang,'sql-data-modeling.json'));
    const web = module.lessons.find(l=>l.id===chapter.id);
    const mobile = read(path.join(root,'lecomax-learning-app/data/lessons',lang,'sql-data-modeling.json')).lessons.find(l=>l.id===chapter.id);
    assert.deepEqual(web,authored);
    assert.deepEqual(mobile.websiteLesson,authored);
    assert.deepEqual(await authoredLesson(courseRoot,lang,{id:chapter.id,order:chapter.order}),authored);
    const search = read(path.join(courseRoot,'content/index',lang+'.json')).modules.find(m=>m.id===module.id).lessonSearchText[chapter.order];
    assert.equal(search,authoredSearch(module,authored,lang));
    const sql = authored.sections.flatMap(s=>s.blocks).filter(b=>b.type==='code').map(b=>b.code.source);
    assert.deepEqual(sql,Object.values(examples));
    assert.equal(mobile.quiz.length,3);
    assert.equal(mobile.estimatedMinutes,100);
    const words = authored.sections.flatMap(s=>s.blocks).filter(b=>b.type==='paragraph').map(b=>b.text).join(' ').split(/\s+/).length;
    assert.ok(words>=1500,lang+' is below the authored chapter depth floor');
  }
  const fallback = {id:'unwritten-chapter',order:0};
  assert.equal(await authoredLesson(courseRoot,'en',fallback),fallback);
  await assert.rejects(authoredLesson(courseRoot,'en',{id:chapter.id,order:99}),/identity/);
});

test('successful reservation commits stock and price snapshot together', async()=>withDb(async db=>{
  await db.exec(examples['sql-reservation']);
  assert.deepEqual(await rows(db,'SELECT stock FROM academy_products'),[{stock:1}]);
  assert.deepEqual(await rows(db,'SELECT * FROM academy_order_items'),[{order_id:101,product_id:1,quantity:2,unit_price_cents:4990}]);
}));

test('zero and insufficient stock reject orders and preserve inventory', async()=>{
  for(const stock of [0,1]) await withDb(async db=>{
    await db.exec('UPDATE academy_products SET stock = '+stock);
    await assert.rejects(db.exec(examples['sql-reservation']),/insufficient stock/);
    await db.exec('ROLLBACK');
    assert.deepEqual(await rows(db,'SELECT stock FROM academy_products'),[{stock}]);
    assert.deepEqual(await rows(db,'SELECT * FROM academy_order_items'),[]);
  });
});

test('exact available quantity succeeds with zero remaining stock', async()=>withDb(async db=>{
  await db.exec('UPDATE academy_products SET stock = 2');
  await db.exec(examples['sql-reservation']);
  assert.deepEqual(await rows(db,'SELECT stock FROM academy_products'),[{stock:0}]);
  assert.equal((await rows(db,'SELECT * FROM academy_order_items')).length,1);
}));

test('missing product is rejected before creating an order', async()=>withDb(async db=>{
  await db.exec('DELETE FROM academy_products');
  await assert.rejects(db.exec(examples['sql-reservation']),/Product missing/);
  await db.exec('ROLLBACK');
  assert.deepEqual(await rows(db,'SELECT * FROM academy_order_items'),[]);
}));

test('duplicate order rolls back an earlier successful stock decrement', async()=>withDb(async db=>{
  await db.exec('INSERT INTO academy_order_items VALUES (101,1,1,4900)');
  await assert.rejects(db.exec(examples['sql-reservation']),error=>error.code==='23505');
  await db.exec('ROLLBACK');
  assert.deepEqual(await rows(db,'SELECT stock FROM academy_products'),[{stock:3}]);
  assert.deepEqual(await rows(db,'SELECT quantity,unit_price_cents FROM academy_order_items'),[{quantity:1,unit_price_cents:4900}]);
}));

test('the shortage test detects the old unconditional-insert defect', async()=>withDb(async db=>{
  await db.exec('UPDATE academy_products SET stock = 1');
  const unsafe = examples['sql-reservation'].replace(/  IF affected <> 1 THEN[\s\S]*?  END IF;\n/,'');
  assert.notEqual(unsafe,examples['sql-reservation']);
  await assert.rejects(db.exec(unsafe),error=>error.code==='23502');
  // With the old hard-coded price, the missing guard actually creates an invalid order.
  await db.exec('ROLLBACK');
  await db.exec(unsafe.replace('VALUES (101, 1, 2, reserved_price)','VALUES (101, 1, 2, 4990)'));
  assert.deepEqual(await rows(db,'SELECT stock FROM academy_products'),[{stock:1}]);
  assert.equal((await rows(db,'SELECT * FROM academy_order_items')).length,1);
}));

test('constraints reject invalid data independently of application checks', async()=>withDb(async db=>{
  await assert.rejects(db.exec('UPDATE academy_products SET stock = -1'),e=>e.code==='23514');
  await assert.rejects(db.exec('UPDATE academy_products SET stock = NULL'),e=>e.code==='23502');
  await assert.rejects(db.exec('INSERT INTO academy_order_items VALUES (1,999,1,4990)'),e=>e.code==='23503');
  await assert.rejects(db.exec('INSERT INTO academy_order_items VALUES (1,1,0,4990)'),e=>e.code==='23514');
}));

test('index experiment executes both plans and preserves query results', async()=>withDb(async db=>{
  const results = await db.exec(examples['sql-index']);
  const plans=results.filter(r=>r.rows?.some(row=>'QUERY PLAN' in row));
  assert.equal(plans.length,2);
  assert.equal((await rows(db,'SELECT count(*)::integer AS n FROM academy_events'))[0].n,20000);
  assert.deepEqual((await rows(db,'SELECT id FROM academy_events WHERE customer_id=42 ORDER BY created_at DESC LIMIT 5')).map(r=>r.id),[19042,18042,17042,16042,15042]);
}));

test('migration backfills old rows and enforces default and constraints', async()=>withDb(async db=>{
  await db.exec(examples['sql-migration']);
  assert.deepEqual(await rows(db,'SELECT reserved FROM academy_products'),[{reserved:0}]);
  await db.exec('INSERT INTO academy_products(id,stock,unit_price_cents) VALUES (2,1,100)');
  assert.deepEqual(await rows(db,'SELECT reserved FROM academy_products ORDER BY id'),[{reserved:0},{reserved:0}]);
  await assert.rejects(db.exec('UPDATE academy_products SET reserved=-1'),e=>e.code==='23514');
  await assert.rejects(db.exec('UPDATE academy_products SET reserved=NULL'),e=>e.code==='23502');
}));

test('complete downloadable lab matches the authored solution and executes',async()=>{
  const full=fs.readFileSync(path.join(root,chapter.exercise.solution.filename),'utf8').trim();
  assert.equal(full,chapter.exercise.solution.code);
  const db=new PGlite();
  try {await db.waitReady;await db.exec(full);assert.deepEqual(await rows(db,'SELECT stock,reserved FROM academy_products'),[{stock:1,reserved:0}]);}
  finally {await db.close();}
});
