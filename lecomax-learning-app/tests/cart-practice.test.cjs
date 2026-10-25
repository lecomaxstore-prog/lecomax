const test=require('node:test');
const assert=require('node:assert/strict');
const {verify}=require('../../academy-labs/06-javascript/verify-cart.cjs');
const {calculateCart}=require('../../academy-labs/06-javascript/cart-reference.cjs');
test('local learner verifier accepts reference behavior and rejects missing validation and wrong arithmetic',()=>{
  const checks=verify(calculateCart);
  assert.equal(checks.length,11);assert.ok(checks.every(c=>c.passed));
  const unchecked=(p,q,d)=>({subtotalCents:p*q,discountCents:Math.round(p*q*d/10000),totalCents:p*q-Math.round(p*q*d/10000)});
  const defects=verify(unchecked).filter(c=>!c.passed);
  assert.ok(defects.some(c=>c.name.includes('quantity')));
  assert.ok(defects.some(c=>c.name.includes('numerator')));
  assert.ok(verify((p,q,d)=>({...calculateCart(p,q,d),totalCents:1})).some(c=>!c.passed));
  // Equivalent implementation is accepted: no source-string matching.
  const alternative=(...args)=>{const result=calculateCart(...args);return {...result};};
  assert.ok(verify(alternative).every(c=>c.passed));
});
