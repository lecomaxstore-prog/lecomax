import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeSupportBody, detectSupportFile, supportPreview, SUPPORT_ATTACHMENT_PREFIX } from '../lib/support-attachments.ts';
import { parseSupportMessage } from '../lib/support-validation.ts';

test('attachments identify file signatures rather than trusting the filename', () => {
  assert.equal(detectSupportFile(new Uint8Array([255,216,255,0])), 'image/jpeg');
  assert.equal(detectSupportFile(new Uint8Array([137,80,78,71,13,10,26,10])), 'image/png');
  assert.equal(detectSupportFile(new TextEncoder().encode('%PDF-1.4 test')), 'application/pdf');
  assert.equal(detectSupportFile(new TextEncoder().encode('<script>bad</script>')), null);
  assert.equal(detectSupportFile(new Uint8Array()), null);
});
test('attachment captions and file labels survive message storage', () => {
  const file = { path: 'conversation/file.pdf', name: 'Facture.pdf', type: 'application/pdf', size: 1234 };
  const body = SUPPORT_ATTACHMENT_PREFIX + JSON.stringify({ text: 'Ma facture', file });
  assert.deepEqual(decodeSupportBody(body), { text: 'Ma facture', file });
  assert.equal(supportPreview(body), 'Document · Ma facture');
  assert.equal(supportPreview(SUPPORT_ATTACHMENT_PREFIX + JSON.stringify({ text: '', file })), 'Document · Facture.pdf');
  assert.equal(supportPreview('Bonjour'), 'Bonjour');
});
test('ordinary text cannot forge a server attachment payload', () => {
  assert.equal(parseSupportMessage(SUPPORT_ATTACHMENT_PREFIX + '{}').ok, false);
  assert.deepEqual(decodeSupportBody(SUPPORT_ATTACHMENT_PREFIX + 'invalid'), { text: SUPPORT_ATTACHMENT_PREFIX + 'invalid' });
});
