const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const course = path.join(root, 'app/admin/how-it-was-built/course');
const id = 'lesson-06-01-values';
const moduleId = 'module-06-javascript-foundations';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const chapter = lang => read(path.join(course, 'authored', lang, id + '.json'));
const blocks = lang => chapter(lang).sections.flatMap(s => s.blocks).filter(b => b.type === 'code');
const source = chapter('en').exercise.solution.code;
function run(code = source) {
  const output = [];
  const context = vm.createContext({ console: { log: (...args) => output.push(JSON.parse(JSON.stringify(args))) } });
  vm.runInContext(code, context, { timeout: 1000 });
  return { context, output };
}
const { context } = run();
const plain = value => JSON.parse(JSON.stringify(value));

test('values chapter preserves IDs, localized reader content and both search indexes', async () => {
  const { authoredLesson, authoredSearch } = await import(pathToFileURL(path.join(root, 'scripts/course-authored.mjs')));
  const mobileIndex = read(path.join(root, 'lecomax-learning-app/data/index.json')).find(m => m.id === moduleId);
  for (const lang of ['ar', 'en', 'fr']) {
    const authored = chapter(lang);
    const module = read(path.join(course, 'content', lang, moduleId + '.json'));
    const web = module.lessons.find(l => l.id === id);
    const mobile = read(path.join(root, 'lecomax-learning-app/data/lessons', lang, moduleId + '.json')).lessons.find(l => l.id === id);
    assert.equal(authored.order, 0);
    assert.deepEqual(authored.quiz.map(q => q.id), [1, 2, 3].map(n => id + '-q' + n));
    assert.deepEqual(web, authored);
    assert.deepEqual(mobile.websiteLesson, authored);
    assert.deepEqual(mobile.quiz, authored.quiz);
    assert.deepEqual(await authoredLesson(course, lang, { id, order: 0 }), authored);
    assert.deepEqual(blocks(lang).map(b => b.code.source), blocks('en').map(b => b.code.source));
    assert.equal(authored.exercise.solution.code, source);
    assert.equal(mobile.estimatedMinutes, 100);
    const webSearch = read(path.join(course, 'content/index', lang + '.json')).modules.find(m => m.id === moduleId);
    assert.equal(webSearch.lessonSearchText[0], authoredSearch(module, authored, lang));
    const indexLesson = mobileIndex.lessons.find(l => l.id === id);
    assert.equal(indexLesson.title[lang], authored.title);
    assert.ok(indexLesson.search[lang].includes('parsequantity'));
    const paragraphs = authored.sections.flatMap(s => s.blocks).filter(b => b.type === 'paragraph');
    assert.ok(paragraphs.map(p => p.text).join(' ').split(/\s+/).length >= 1500);
  }
  assert.equal(fs.readFileSync(path.join(root, chapter('en').exercise.solution.filename), 'utf8').trimEnd(), source);
});

test('the three introductory snippets produce their explained outputs', () => {
  const examples = blocks('en');
  assert.deepEqual(run(examples[0].code.source).output, [[3, 104700]]);
  assert.deepEqual(run(examples[1].code.source).output, [[2, 0], ['3492'], ['628.20', 'string'], ['628.201']]);
  assert.deepEqual(run(examples[2].code.source).output, [[true, false, 2, 'sale']]);
});

test('quantity parser accepts only the stated digit-text and range contract', () => {
  for (const [input, expected] of [['1', 1], ['2', 2], [' 02 ', 2], ['99', 99], ['\t5\n', 5]]) {
    assert.equal(context.parseQuantity(input), expected);
  }
  for (const input of ['', ' ', '2.5', '2e2', '0x10', '2x', '+2', '-2', '2 3', '٢', null, undefined, 2, true, {}, []]) {
    assert.throws(() => context.parseQuantity(input), /decimal digits/);
  }
  for (const input of ['0', '00', '100', '9007199254740992', '9'.repeat(400)]) {
    assert.throws(() => context.parseQuantity(input), /1 to 99/);
  }
});

test('the calculator returns the expected amounts and does not change inputs', () => {
  const input = Object.freeze({ price: 34900, quantity: 2, bps: 1000 });
  const result = context.calculateCart(input.price, input.quantity, input.bps);
  assert.deepEqual(plain(result), { subtotalCents: 69800, discountCents: 6980, totalCents: 62820 });
  assert.deepEqual(input, { price: 34900, quantity: 2, bps: 1000 });
  assert.notEqual(result, context.calculateCart(input.price, input.quantity, input.bps));
  assert.deepEqual(run().output, [[{ ...plain(result), label: '628.20 MAD' }]]);
});

test('numeric calculator rejects coercion, nonfinite values, fractions and out-of-range inputs', () => {
  for (const price of ['34900', NaN, Infinity, -Infinity, -1, 1.5, null, undefined, true]) {
    assert.throws(() => context.calculateCart(price, 2, 1000), /Invalid cart/);
  }
  for (const quantity of ['2', 0, -1, 100, 1.5, NaN, Infinity, null]) {
    assert.throws(() => context.calculateCart(34900, quantity, 1000), /Invalid cart/);
  }
  for (const bps of ['1000', -1, 10001, 1.5, NaN, Infinity, null]) {
    assert.throws(() => context.calculateCart(34900, 2, bps), /Invalid cart/);
  }
});

test('safe inputs cannot overflow either intermediate product silently', () => {
  assert.throws(() => context.calculateCart(Number.MAX_SAFE_INTEGER, 2, 0), /precision/);
  assert.throws(() => context.calculateCart(Number.MAX_SAFE_INTEGER, 1, 2), /precision/);
  assert.equal(context.calculateCart(Number.MAX_SAFE_INTEGER, 1, 0).totalCents, Number.MAX_SAFE_INTEGER);
});

test('rounding, zero and full discounts agree with an independent integer oracle', () => {
  // Integer oracle rounds halves up without relying on floating-point division.
  for (const price of [0, 1, 2, 5, 99, 100, 34900, 9007199254]) {
    for (const quantity of [1, 2, 99]) {
      for (const bps of [0, 1, 4999, 5000, 5001, 9999, 10000]) {
        const subtotal = BigInt(price) * BigInt(quantity);
        const numerator = subtotal * BigInt(bps);
        if (numerator > BigInt(Number.MAX_SAFE_INTEGER)) continue;
        const discount = (numerator + 5000n) / 10000n;
        assert.deepEqual(plain(context.calculateCart(price, quantity, bps)), {
          subtotalCents: Number(subtotal), discountCents: Number(discount), totalCents: Number(subtotal - discount),
        });
      }
    }
  }
});

test('formatter preserves centimes and rejects invalid amounts', () => {
  for (const [cents, label] of [[0, '0.00 MAD'], [5, '0.05 MAD'], [99, '0.99 MAD'], [100, '1.00 MAD'], [62820, '628.20 MAD'], [Number.MAX_SAFE_INTEGER, '90071992547409.91 MAD']]) {
    assert.equal(context.formatMAD(cents), label);
  }
  for (const cents of ['5', null, undefined, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => context.formatMAD(cents), /centimes/);
  }
});
