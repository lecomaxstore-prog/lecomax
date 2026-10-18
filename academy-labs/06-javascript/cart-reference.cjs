// Worked reference: open only after attempting cart-practice.cjs.
function calculateCart(unitPriceCents, quantity, discountBps) {
  if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0 ||
      !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 ||
      !Number.isSafeInteger(discountBps) || discountBps < 0 || discountBps > 10000) {
    throw new RangeError('Invalid input');
  }
  const subtotalCents = unitPriceCents * quantity;
  const numerator = subtotalCents * discountBps;
  if (!Number.isSafeInteger(subtotalCents) || !Number.isSafeInteger(numerator)) throw new RangeError('Unsafe intermediate');
  const discountCents = Math.round(numerator / 10000);
  return { subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}
module.exports = { calculateCart };
