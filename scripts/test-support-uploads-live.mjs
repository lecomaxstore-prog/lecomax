// Exercises the real API with temporary accounts; removes only its own fixtures.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const base = process.env.SUPPORT_TEST_API_URL || 'https://lecomax.com';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, 'yddqwgdgeljkzfsmtein.supabase.co');
assert.equal(new URL(base).hostname, 'lecomax.com');
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const users = [];
const paths = [];
let conversationId;
async function testAccount() {
  const email = `support-upload-qa-${randomUUID()}@example.invalid`;
  const password = randomUUID() + randomUUID();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Support upload verification' } });
  if (error) throw error;
  users.push(data.user.id);
  const customer = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await customer.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;
  return signed.data.session.access_token;
}
async function request(path, token, options = {}) {
  const response = await fetch(base + path, {
    ...options, headers: { Origin: 'http://localhost:8081', Authorization: `Bearer ${token}`, ...options.headers }, signal: AbortSignal.timeout(45000),
  });
  const body = await response.json();
  return { response, body };
}
function multipart(bytes, name, type, caption, clientId = randomUUID()) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), name);
  form.append('body', caption);
  form.append('client_message_id', clientId);
  return form;
}
try {
  const token = await testAccount();
  const created = await request('/api/support/conversations', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: 'Temporary upload verification', message: 'Automated attachment verification', client_message_id: randomUUID() }) });
  assert.equal(created.response.status, 201, JSON.stringify(created.body));
  conversationId = created.body.conversation.id;
  const endpoint = `/api/support/conversations/${conversationId}/messages`;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  const imageClientId = randomUUID();
  const image = await request(endpoint, token, { method: 'POST', body: multipart(png, 'verification.png', 'image/png', '', imageClientId) });
  assert.equal(image.response.status, 201, JSON.stringify(image.body));
  paths.push(image.body.message.attachment.path);
  assert.equal(image.body.message.body, '');
  assert.equal(image.body.message.attachment.type, 'image/png');
  assert.equal(image.response.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  const download = await fetch(image.body.message.attachment.url);
  assert.equal(download.status, 200);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), png);
  console.log('PASS: image-only multipart send, private signed preview, CORS.');
  const retry = await request(endpoint, token, { method: 'POST', body: multipart(png, 'verification.png', 'image/png', '', imageClientId) });
  assert.equal(retry.response.status, 200, JSON.stringify(retry.body));
  assert.equal(retry.body.message.id, image.body.message.id);
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  const document = await request(endpoint, token, { method: 'POST', body: multipart(pdf, 'verification.pdf', 'application/pdf', 'Document de vérification') });
  assert.equal(document.response.status, 201, JSON.stringify(document.body));
  paths.push(document.body.message.attachment.path);
  assert.equal(document.body.message.body, 'Document de vérification');
  assert.equal(document.body.message.attachment.type, 'application/pdf');
  const pdfDownload = await fetch(document.body.message.attachment.url);
  assert.equal(pdfDownload.status, 200);
  assert.match(pdfDownload.headers.get('content-disposition') || '', /attachment/);
  const thread = await request(`/api/support/conversations/${conversationId}`, token);
  assert.equal(thread.response.status, 200, JSON.stringify(thread.body));
  assert.equal(thread.body.messages.length, 3);
  assert.equal(thread.body.messages.filter(m => m.attachment?.url).length, 2);
  assert.equal(thread.body.conversation.last_message, 'Document · Document de vérification');
  console.log('PASS: idempotent retry, PDF with caption, persisted history.');
  const invalid = await request(endpoint, token, { method: 'POST', body: multipart(Buffer.from('<script>invalid</script>'), 'fake.png', 'image/png', '') });
  assert.equal(invalid.response.status, 415);
  const large = await request(endpoint, token, { method: 'POST', body: multipart(Buffer.alloc(3 * 1024 * 1024 + 1), 'large.pdf', 'application/pdf', '') });
  assert.equal(large.response.status, 413);
  const otherToken = await testAccount();
  const forbidden = await request(endpoint, otherToken, { method: 'POST', body: multipart(png, 'not-owned.png', 'image/png', '') });
  assert.equal(forbidden.response.status, 404);
  const publicDownload = await fetch(`${url}/storage/v1/object/public/support-private/${paths[0]}`);
  assert.notEqual(publicDownload.status, 200);
  console.log('PASS: invalid files, oversized files, cross-account access and public downloads rejected.');
} finally {
  if (paths.length) {
    const { error } = await db.storage.from('support-private').remove(paths);
    if (error) throw error;
  }
  if (conversationId) {
    const { error } = await db.from('support_conversations').delete().eq('id', conversationId).in('user_id', users);
    if (error) throw error;
  }
  for (const id of users) {
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) throw error;
  }
  console.log('Temporary verification accounts, messages and files removed.');
}
