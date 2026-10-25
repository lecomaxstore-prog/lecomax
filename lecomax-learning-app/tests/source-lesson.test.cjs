const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { load } = require('../scripts/inspect.cjs');
const { analyze } = require('../scripts/refresh-site-sources.cjs');
const { matchSourceElement, sourceExcerpt, describeSourceBehavior } = load('lecomax-learning-app/utils/source-lesson.ts');
const snapshot = require('../data/site-source-map.json');
const project = require('../data/project.json');

test('real menu and search controls resolve to different real handlers', () => {
  const file = snapshot.files['components/Header.tsx'];
  for (const [label, setter] of [['Menu', 'setOpen'], ['Recherche', 'setSearchOpen']]) {
    const control = file.elements.find(element => element.tag === 'button' && element.attributes['aria-label'] === label);
    assert(control, `Missing ${label} control`);
    const match = matchSourceElement({ path: 'components/Header.tsx', tag: 'button', ariaLabel: label, label, line: control.start }, file);
    assert(match);
    const behavior = describeSourceBehavior(match.element, file, 'en');
    assert.equal(behavior.definition.name, setter);
    assert.match(behavior.event.code, new RegExp(setter));
    const source = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/source', file.hash + '.json'), 'utf8')).content;
    assert(sourceExcerpt(source, behavior.event.start, behavior.event.end).code.includes(setter));
  }
});
test('ambiguous controls never receive an invented exact match', () => {
  const file = snapshot.files['components/Header.tsx'];
  assert.equal(matchSourceElement({ tag: 'button', label: 'unknown' }, file), undefined);
  const ambiguous = { ...file, elements: [file.elements.find(el => el.attributes['aria-label'] === 'Menu'), file.elements.find(el => el.attributes['aria-label'] === 'Menu')] };
  assert.equal(matchSourceElement({ tag: 'button', ariaLabel: 'Menu' }, ambiguous), undefined);
});
test('all indexed files have matching offline content and bounded source locations', () => {
  assert.equal(snapshot.fileCount, project.length);
  for (const [name, file] of Object.entries(snapshot.files)) {
    const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/source', file.hash + '.json'), 'utf8')).content;
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), file.hash, name);
    assert.equal(project.find(entry => entry.path === name).hash, file.hash);
    for (const element of file.elements) {
      assert(element.start > 0 && element.end >= element.start && element.end <= content.split('\n').length, name);
      for (const event of element.events) assert(sourceExcerpt(content, event.start, event.end, 100).code.includes(event.code), `${name}:${event.start}`);
    }
  }
});
test('indexer extracts expressions from real syntax, never from comments', () => {
  const file = analyze('components/Example.tsx', '/* onClick={fake} */\nfunction Example(){ const [open,setOpen]=useState(false); return <button aria-label="Open" onClick={()=>setOpen(true)}>Open</button>; }');
  assert.equal(file.elements.length, 1);
  assert.equal(file.elements[0].events[0].calls[0], 'setOpen');
  assert.equal(file.definitions.find(def => def.kind === 'state').state, 'open');
});
