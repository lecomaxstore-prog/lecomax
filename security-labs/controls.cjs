const crypto = require('node:crypto');
const path = require('node:path');
const products = Object.freeze({ bag: { id: 'bag', name: 'Canvas bag', priceCents: 4990, stock: 3 } });
const orders = Object.freeze([
  { id: 'order-a', ownerId: 'alice', totalCents: 4990, status: 'pending' },
  { id: 'order-b', ownerId: 'bob', totalCents: 9980, status: 'pending' },
]);
function reject(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function vulnerableOrder(id) { return orders.find(order => order.id === id) || null; }
function secureOrder(id, actor) {
  if (!actor) reject('Authentication required', 401);
  const order = orders.find(item => item.id === id && item.ownerId === actor.id);
  if (!order) reject('Order not found', 404);
  return { id: order.id, totalCents: order.totalCents, status: order.status };
}
function vulnerableCheckout(input) { return Number(input.priceCents) * Number(input.quantity); }
function secureCheckout(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) reject('Object required');
  const product = products[input.productId];
  if (!product || !Object.hasOwn(products, input.productId)) reject('Unknown product');
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > product.stock) reject('Quantity unavailable');
  const totalCents = product.priceCents * input.quantity;
  if (!Number.isSafeInteger(totalCents)) reject('Total out of range');
  return { productId: product.id, quantity: input.quantity, totalCents };
}
function vulnerableQuery(name) { return "SELECT id, name FROM lab_products WHERE name = '" + name + "'"; }
function secureQuery(name) {
  if (typeof name !== 'string' || name.length > 100) reject('Invalid name');
  return { text: 'SELECT id, name FROM lab_products WHERE name = $1', values: [name] };
}
function vulnerableNoSql(input) {
  // A clearly labelled in-memory model of an operator-bearing document query.
  const users = [{ name: 'alice' }, { name: 'bob' }];
  return users.filter(u => typeof input === 'object' && input !== null && '$ne' in input ? u.name !== input.$ne : u.name === input);
}
function secureNoSql(input) {
  if (typeof input !== 'string' || !/^[a-z]{1,30}$/.test(input)) reject('A username string is required');
  return [{ name: 'alice' }, { name: 'bob' }].filter(u => u.name === input);
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function vulnerableGreeting(name) { return '<p>Hello ' + name + '</p>'; }
function secureGreeting(name) { return '<p>Hello ' + escapeHtml(name) + '</p>'; }
function secureCsrf({ method, origin, token }, session, expectedOrigin) {
  if (method !== 'POST') reject('POST required', 405);
  if (origin !== expectedOrigin) reject('Origin rejected', 403);
  if (!session || typeof token !== 'string' || token !== session.csrf) reject('CSRF token rejected', 403);
  return true;
}
function secureAdmin(actor) {
  if (!actor) reject('Authentication required', 401);
  if (actor.role !== 'admin') reject('Administrator required', 403);
  return { permitted: true };
}
function vulnerableReset(input) { return { userId: input.userId, passwordChanged: true }; }
function consumeReset(token, records, now = Date.now()) {
  const digest = crypto.createHash('sha256').update(String(token)).digest('hex');
  const item = records.get(digest);
  if (!item || item.expires <= now || item.used) reject('Reset link invalid', 400);
  item.used = true;
  return item.userId;
}
function safeAsset(input) {
  // Policy model only: no HTTP requests are performed by either function.
  const urls = { 'bag-image': 'https://assets.example.invalid/bag.png' };
  if (typeof input !== 'string' || !Object.hasOwn(urls, input)) reject('Unknown asset');
  return urls[input];
}
function vulnerableAsset(input) { return new URL(input).href; }
const virtualFiles = { '/public/readme.txt': 'Public lab information', '/private/fake-secret.txt': 'FICTIONAL-LAB-VALUE' };
function vulnerableFile(input) { return virtualFiles[path.posix.resolve('/public', input)] || null; }
function secureFile(input) {
  const allowed = { readme: '/public/readme.txt' };
  if (typeof input !== 'string' || !Object.hasOwn(allowed, input)) reject('Unknown document', 404);
  return virtualFiles[allowed[input]];
}
function vulnerableCommand(input) { return 'convert ' + input + ' output.png'; }
function secureCommand(input) {
  // Returns an argument plan, never spawns a shell or process.
  if (typeof input !== 'string' || !/^[a-z0-9_-]{1,30}\.png$/.test(input)) reject('Invalid image identifier');
  return { executable: 'image-tool', args: ['--input', input, '--output', 'output.png'], shell: false };
}
function validateUpload(bytes, claimedType) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 8 || bytes.length > 1024 * 1024) reject('Invalid size');
  const png = Buffer.from([137,80,78,71,13,10,26,10]);
  if (claimedType !== 'image/png' || !bytes.subarray(0,8).equals(png)) reject('Unexpected file type');
  return { quarantineId: crypto.randomUUID(), status: 'awaiting-decoder' };
}
function safeError(error, requestId) { return { message: 'Request could not be completed', requestId }; }
function signEvent(raw, timestamp, secret) { return crypto.createHmac('sha256', secret).update(timestamp + '.').update(raw).digest('hex'); }
function verifyEvent(raw, timestamp, signature, secret, seen, now = Date.now()) {
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300000) reject('Expired event', 401);
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature)) reject('Invalid signature', 401);
  const expected = Buffer.from(signEvent(raw, timestamp, secret), 'hex');
  if (!crypto.timingSafeEqual(expected, Buffer.from(signature,'hex'))) reject('Invalid signature',401);
  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { reject('Invalid JSON'); }
  if (typeof event.id !== 'string' || !/^evt_[a-z0-9]{1,40}$/.test(event.id)) reject('Invalid event id');
  if (seen.has(event.id)) return { duplicate: true };
  if (event.orderId !== 'order-a' || event.amountCents !== 4990 || event.currency !== 'MAD' || event.type !== 'payment.succeeded') reject('Payment does not match order');
  seen.add(event.id);
  return { duplicate: false, orderId: event.orderId, paid: true };
}
function createLimiter(max = 5, windowMs = 60000) {
  const counters = new Map();
  return (key, now = Date.now()) => {
    let item = counters.get(key);
    if (!item || now >= item.until) { item = { count: 0, until: now + windowMs }; counters.set(key,item); }
    item.count++;
    return item.count <= max;
  };
}
function reserve(stock, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > stock) reject('Insufficient stock',409);
  return stock - quantity;
}
module.exports = { products, orders, reject, vulnerableOrder, secureOrder, vulnerableCheckout, secureCheckout, vulnerableQuery, secureQuery, vulnerableNoSql, secureNoSql, escapeHtml, vulnerableGreeting, secureGreeting, secureCsrf, secureAdmin, vulnerableReset, consumeReset, safeAsset, vulnerableAsset, vulnerableFile, secureFile, vulnerableCommand, secureCommand, validateUpload, safeError, signEvent, verifyEvent, createLimiter, reserve };
