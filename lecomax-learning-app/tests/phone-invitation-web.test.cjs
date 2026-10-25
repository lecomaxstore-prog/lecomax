const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '../../public/phone-invite.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../../public/phone-invite.js'), 'utf8');
const payload = 'http://100.80.1.2:8093|' + 'a'.repeat(64);
function page(hash, query = '') {
  const dom = new JSDOM(html, { url: 'https://lecomax.com/phone-invite.html' + query + hash, runScripts: 'outside-only' });
  dom.window.fetch = () => { throw Error('Landing must never contact a phone or transmit credentials'); };
  dom.window.eval(script);
  return dom;
}
test('WhatsApp HTTPS landing prepares package-bound launch only after an explicit tap', () => {
  const hash = '#invite=' + encodeURIComponent(payload);
  const dom = page(hash);
  try {
    const d = dom.window.document;
    assert.equal(dom.window.location.hash, hash, 'No automatic navigation/capture');
    assert.equal(d.getElementById('actions').hidden, false);
    const intent = d.getElementById('open').getAttribute('href');
    assert.match(intent, /^intent:\/\/phone\?invite=/);
    assert.match(intent, /;package=com\.lecomax\.learning;/);
    assert.equal(new URL(d.getElementById('direct').href).searchParams.get('invite'), payload);
    const fallback = decodeURIComponent(intent.split('S.browser_fallback_url=')[1].split(';end')[0]);
    assert.equal(new URL(fallback).search, '');
    assert.equal(new URLSearchParams(new URL(fallback).hash.slice(1)).get('invite'), payload);
    assert.equal(d.querySelector('meta[name=referrer]').content, 'no-referrer');
    assert.match(d.querySelector('meta[http-equiv="Content-Security-Policy"]').content, /connect-src 'none'/);
    assert.equal(d.querySelectorAll('script').length, 1);
    assert.equal(d.querySelector('script').getAttribute('src'), '/phone-invite.js');
  } finally { dom.window.close(); }
});
test('landing rejects malformed, duplicate and external invitation targets', () => {
  for (const hash of ['', '#invite=javascript:alert(1)', '#invite='+encodeURIComponent(payload.replace('100.80.1.2','192.168.1.2')), '#invite='+encodeURIComponent(payload)+'&invite='+encodeURIComponent(payload), '#invite='+encodeURIComponent(payload)+'&next=https://evil.example']) {
    const dom = page(hash);
    try { assert.equal(dom.window.document.getElementById('actions').hidden,true); assert.equal(dom.window.document.getElementById('open').hasAttribute('href'),false); }
    finally { dom.window.close(); }
  }
  const dom = page('#invite='+encodeURIComponent(payload), '?invite=secret');
  try { assert.equal(dom.window.document.getElementById('actions').hidden,true); } finally { dom.window.close(); }
});
test('landing translates Arabic and supports clipboard denial without losing the invitation', async () => {
  const dom = page('#invite='+encodeURIComponent(payload));
  try {
    const d=dom.window.document;
    d.getElementById('language').value='ar'; d.getElementById('language').dispatchEvent(new dom.window.Event('change'));
    assert.equal(d.documentElement.dir,'rtl'); assert.equal(d.documentElement.lang,'ar');
    assert.equal(d.getElementById('open').textContent,'فتح L’ECOMAX Learn');
    await d.getElementById('copy').onclick();
    assert.equal(d.getElementById('manual').hidden,false);
    assert.equal(d.getElementById('manual').closest('details').open,true);
    assert.equal(new URLSearchParams(new URL(d.getElementById('manual').value).hash.slice(1)).get('invite'),payload);
    let copied=''; Object.defineProperty(dom.window.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}}});
    await d.getElementById('copy').onclick(); assert.equal(copied,d.getElementById('manual').value);
    d.getElementById('language').value='fr'; d.getElementById('language').dispatchEvent(new dom.window.Event('change'));
    assert.equal(d.documentElement.dir,'ltr'); assert.match(d.getElementById('status').textContent,/Lien copié/);
  } finally { dom.window.close(); }
});
