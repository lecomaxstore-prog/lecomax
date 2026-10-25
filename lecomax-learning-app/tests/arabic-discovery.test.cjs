const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../scripts/inspect.cjs');
const { aiJourney } = load('lecomax-learning-app/features/curiosity/journeys.ts');
const { localizeJourney, arabicAI } = load('lecomax-learning-app/features/curiosity/arabic-ai.ts');
const { localizedLabResult } = load('lecomax-learning-app/features/curiosity/arabic-labs.ts');
const { labSpec, labResult } = load('lecomax-learning-app/features/curiosity/labs.ts');
test('all eight Arabic lessons retain assessment IDs, correct choices, sources and real calculations', () => {
  const translated = localizeJourney(aiJourney, 'ar');
  assert.equal(Object.keys(arabicAI).length, 8);
  for (let i = 0; i < 8; i++) {
    const original = aiJourney.steps[i],
      step = translated.steps[i];
    for (const field of ['title', 'simple', 'deep', 'mission', 'question', 'feedback', 'hint'])
      assert(/[\u0600-\u06ff]/.test(step[field]), step.id + '/' + field);
    assert.equal(step.id, original.id);
    assert.equal(step.correct, original.correct);
    assert.equal(step.source, original.source);
    assert.equal(step.options.length, original.options.length);
    assert(step.parts.every((p) => /[\u0600-\u06ff]/.test(p.detail)));
    const value = labSpec[step.lab].initial;
    const r = localizedLabResult(step.lab, value, 'ar');
    assert(/[\u0600-\u06ff]/.test(r.explanation));
    assert(/[\u0600-\u06ff]/.test(r.limitation));
    assert.equal(JSON.stringify(r.nodes), JSON.stringify(labResult(step.lab, value).nodes));
  }
  assert.equal(localizeJourney(aiJourney, 'en'), aiJourney);
});
