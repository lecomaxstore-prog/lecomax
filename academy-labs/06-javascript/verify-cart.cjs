// Local CLI only: executes the learner's own trusted file on their computer.
// Never import a submitted learner file into the mobile app or a backend server.
const assert = require('node:assert/strict');
function verify(calculateCart) {
  const checks = [];
  const check = (name, fn) => { try { fn(); checks.push({ name, passed: true }); } catch (error) { checks.push({ name, passed: false, message: error.message }); } };
  const amount = (args, expected) => assert.deepEqual(calculateCart(...args), expected);
  check('normal: 349 MAD x 2 with 10% discount', () => amount([34900,2,1000], {subtotalCents:69800,discountCents:6980,totalCents:62820}));
  check('no discount', () => amount([500,3,0], {subtotalCents:1500,discountCents:0,totalCents:1500}));
  check('full discount', () => amount([500,3,10000], {subtotalCents:1500,discountCents:1500,totalCents:0}));
  check('half-cent discount rounds up once', () => amount([1,1,5000], {subtotalCents:1,discountCents:1,totalCents:0}));
  check('zero price is valid', () => amount([0,99,1000], {subtotalCents:0,discountCents:0,totalCents:0}));
  check('invalid prices throw', () => { for(const p of [-1,1.5,'500',NaN,Infinity,null]) assert.throws(()=>calculateCart(p,2,1000)); });
  check('quantity must be numeric integer 1–99', () => { for(const q of [0,-1,100,1.5,'2',NaN,Infinity]) assert.throws(()=>calculateCart(500,q,1000)); });
  check('discount must be integer 0–10000', () => { for(const d of [-1,10001,0.5,'1000',NaN,Infinity]) assert.throws(()=>calculateCart(500,2,d)); });
  check('unsafe subtotal throws', () => assert.throws(()=>calculateCart(Number.MAX_SAFE_INTEGER,2,0)));
  check('unsafe discount numerator throws', () => assert.throws(()=>calculateCart(Number.MAX_SAFE_INTEGER,1,2)));
  check('different calls do not share a mutable result', () => {
    const a=calculateCart(500,2,0); a.totalCents=0;
    assert.equal(calculateCart(500,2,0).totalCents,1000);
  });
  return checks;
}
module.exports = { verify };
if (require.main === module) {
  try {
    const { calculateCart } = require(process.argv.includes('--reference') ? './cart-reference.cjs' : './cart-practice.cjs');
    const checks=verify(calculateCart);
    for(const c of checks) console.log(`${c.passed ? 'PASS' : 'FAIL'} ${c.name}${c.message ? '\n  '+c.message : ''}`);
    console.log(`${checks.filter(c=>c.passed).length}/${checks.length} checks passed. All checks are required.`);
    process.exitCode=checks.every(c=>c.passed)?0:1;
  } catch(error) { console.error('Could not load your exercise:',error.message); process.exitCode=1; }
}
