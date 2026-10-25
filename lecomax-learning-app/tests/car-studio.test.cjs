const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { parts, model, readStudioEvent, validateManifest } = load('lecomax-learning-app/features/car-studio/vehicle.ts');
const { readCarStudioProgress } = load('lecomax-learning-app/utils/car-studio-progress.ts');
test('progress migration, persistence roundtrip and corruption checks preserve independent course state', () => {
  assert.equal(readCarStudioProgress(undefined).studied.length, 0);
  const state = { studied: ['engine'], answers: { engine: { correct: false, attempts: 2 } } };
  assert.equal(JSON.stringify(readCarStudioProgress(JSON.parse(JSON.stringify(state)))), JSON.stringify(state));
  for (const invalid of [null, { studied: ['engine','engine'], answers: {} }, { studied: ['fake'], answers: {} }, { studied: [], answers: { engine: { correct: true, attempts: 0 } } }]) assert.throws(() => readCarStudioProgress(invalid));
});
test('all 12 systems have complete translations and valid connections', () => {
  assert.equal(parts.length, 12); assert.equal(new Set(parts.map(p => p.id)).size, 12);
  for (const part of parts) {
    for (const field of ['name', 'function', 'location', 'engineering']) for (const lang of ['en', 'fr', 'ar']) assert.ok(part[field][lang].length > 3);
    for (const id of part.connections) assert.ok(parts.some(p => p.id === id));
  }
  assert.equal(parts.filter(p => p.simulation).length, 5);
  assert.equal(model, null, 'No invented production model');
});
test('model configuration requires provenance, HTTPS and unambiguous registry mappings', () => {
  const manifest = { url: 'https://assets.example/model.glb', source: 'https://creator.example/model', license: 'Test fixture only', attribution: 'Test author', meshes: { engine: ['engine'] }, paintMaterials: [] };
  assert.doesNotThrow(() => validateManifest(manifest));
  for (const patch of [{ url: 'http://assets.example/model.glb' }, { license: '' }, { source: '' }, { meshes: { engine: ['same'], body: ['same'] } }, { meshes: { fake: ['mesh'] } }]) assert.throws(() => validateManifest({ ...manifest, ...patch }));
});
test('bridge accepts only known learning events, never arbitrary progress mutation', () => {
  assert.equal(readStudioEvent({ channel: 'lecomax-car-studio', type: 'learned', id: 'engine' }).id, 'engine');
  assert.equal(readStudioEvent({ channel: 'lecomax-car-studio', type: 'quiz', id: 'brakes', correct: false }).correct, false);
  for (const value of [null, {}, { channel: 'other', type: 'learned', id: 'engine' }, { channel: 'lecomax-car-studio', type: 'learned', id: 'unrelated-lesson' }, { channel: 'lecomax-car-studio', type: 'quiz', id: 'engine', correct: 'yes' }]) assert.equal(readStudioEvent(value), null);
});
