// Teaching model: integer centimes, one item, percentage discount in basis points.
// Run from the repository root: node academy-labs/06-javascript/values.js
function parseQuantity(raw) {
  if (typeof raw !== 'string' || !/^[0-9]+$/.test(raw.trim())) {
    throw new TypeError('Quantity must contain decimal digits');
  }
  const quantity = Number(raw.trim());
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new RangeError('Quantity must be from 1 to 99');
  }
  return quantity;
}

function calculateCart(unitPriceCents, quantity, discountBps) {
  if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0 ||
      !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 ||
      !Number.isSafeInteger(discountBps) || discountBps < 0 || discountBps > 10000) {
    throw new RangeError('Invalid cart input');
  }
  const subtotalCents = unitPriceCents * quantity;
  const discountNumerator = subtotalCents * discountBps;
  if (!Number.isSafeInteger(subtotalCents) || !Number.isSafeInteger(discountNumerator)) {
    throw new RangeError('Calculation exceeds safe integer precision');
  }
  const discountCents = Math.round(discountNumerator / 10000);
  const totalCents = subtotalCents - discountCents;
  return { subtotalCents, discountCents, totalCents };
}

function formatMAD(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError('Amount must be nonnegative integer centimes');
  }
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, '0');
  return `${whole}.${fraction} MAD`;
}

const quantity = parseQuantity('2');
const cart = calculateCart(34900, quantity, 1000);
console.log({ ...cart, label: formatMAD(cart.totalCents) });
