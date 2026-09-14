import test from 'node:test';
import assert from 'node:assert/strict';
import { completeShoeGuide, DEFAULT_SHOE_GUIDE } from '../lib/shoe-size-guide.ts';
import { normalizeSize, sizeGuideRows } from '../mobile/src/lib/size-guide.ts';

const measured = [
  { eu: '44', us: '10', uk: '9', cm: '28.0' },
  { eu: '45', us: '11', uk: '10', cm: '29.0' },
];

test('half sizes have clearly marked estimates on both website and app', () => {
  const web = completeShoeGuide(measured);
  assert.deepEqual(web.find(row => row.eu === '44.5'), { eu: '44.5', us: '≈ 10.5', uk: '≈ 9.5', cm: '≈ 28.5' });
  assert.deepEqual(sizeGuideRows({ shoes: measured }, false, ['44.5']), web.map(row => ({ size: row.eu, values: [row.us, row.uk, row.cm] })));
  for (const size of ['38.5', '39.5', '40.5', '41.5', '42.5', '43.5', '44.5', '45.5']) {
    const row = DEFAULT_SHOE_GUIDE.find(row => row.eu === size)!;
    assert.ok(row);
    assert.ok([row.us, row.uk, row.cm].every(value => value.startsWith('≈ ')));
  }
});

test('saved merchant measurements take priority and existing dash rows are filled', () => {
  const custom = { eu: '44.5', us: '10', uk: '—', cm: '28.7' };
  const input = [...measured, custom];
  assert.deepEqual(completeShoeGuide(input).find(row => row.eu === '44.5'), { ...custom, uk: '≈ 9.5' });
  assert.equal(custom.uk, '—');
  assert.deepEqual(completeShoeGuide(completeShoeGuide(input)), completeShoeGuide(input));
});

test('custom decimal sizes and comma notation work without inventing US quarter sizes', () => {
  assert.equal(normalizeSize(' 44,50 '), '44.5');
  const rows = completeShoeGuide(measured, ['44,4', '44.50']);
  assert.deepEqual(rows.find(row => row.eu === '44.4'), { eu: '44.4', us: '≈ 10–10.5', uk: '≈ 9–9.5', cm: '≈ 28.4' });
  assert.equal(rows.filter(row => row.eu === '44.5').length, 1);
});

test('unknown, out-of-range, and widely separated measurements stay unavailable', () => {
  const rows = completeShoeGuide(measured, ['47', 'Custom']);
  assert.equal(rows.find(row => row.eu === '47')?.cm, '—');
  assert.equal(rows.find(row => row.eu === 'Custom')?.cm, '—');
  const wide = completeShoeGuide([measured[0], { eu: '48', us: '14', uk: '13', cm: '32' }]);
  assert.equal(wide.find(row => row.eu === '46')?.cm, '—');
});
