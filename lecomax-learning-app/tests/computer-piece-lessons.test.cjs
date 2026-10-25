const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
const { pcExplorerDocument } = load('lecomax-learning-app/utils/pc-photo-document.ts');
const { pcTopics } = load('lecomax-learning-app/data/pc-explorer.ts');
const { laptopTopics } = load('lecomax-learning-app/data/laptop-explorer.ts');
const { computerAssembly } = load('lecomax-learning-app/data/computer-assembly.ts');
const { pcTeacherRoute } = load('lecomax-learning-app/utils/pc-teacher.ts');

test('all 28 desktop and laptop lessons have localized, device-specific assembly', () => {
  for (const [device, topics] of [['desktop', pcTopics], ['laptop', laptopTopics]]) {
    for (const topic of topics) for (const language of ['en','fr','ar']) {
      const guide = computerAssembly(device, topic.id);
      assert.ok(guide.fitting[language].length > 70);
      assert.doesNotMatch(guide.fitting[language], /[ÃÂØÙ�]|\?{2,}/);
      for (const id of guide.related) assert.ok(topics.some(p => p.id === id), `${device}/${topic.id} -> ${id}`);
    }
  }
  for (const id of ['cpu','gpu','ram','battery']) assert.notEqual(computerAssembly('desktop', id).fitting.en, computerAssembly('laptop', id).fitting.en);
  assert.match(computerAssembly('laptop','cpu').fitting.en, /soldered/);
  assert.match(computerAssembly('laptop','ram').fitting.en, /SO-DIMM/);
  assert.match(computerAssembly('desktop','battery').fitting.en, /clock battery/);
});

for (const language of ['en','fr','ar']) test(`one-action lessons, sections, quiz, navigation and progress (${language})`, () => {
  const messages = [];
  const dom = new JSDOM(pcExplorerDocument(language), { runScripts: 'dangerously', beforeParse(w) {
    w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
    w.HTMLDialogElement.prototype.close = function() { this.open = false; };
    w.parent.postMessage = raw => messages.push(JSON.parse(raw));
  }});
  try {
    const d = dom.window.document, b = id => d.getElementById(id), dialog = b('piece-dialog');
    for (const [device, topics] of [['desktop', pcTopics], ['laptop', laptopTopics]]) {
      b(device).click();
      for (const topic of topics) {
        const button = d.querySelector(`[data-part="${topic.id}"]`);button.focus();button.click();
        assert.equal(dialog.open, true);
        assert.equal(b('piece-title').textContent, topic.name[language]);
        assert.equal(b('piece-install').textContent, computerAssembly(device, topic.id).fitting[language]);
        assert.doesNotMatch(b('piece-connection').textContent, /undefined/);
        assert.equal(d.querySelector('[data-piece-panel="understand"]').hidden, false);
        d.querySelector('[data-piece-tab="assemble"]').click();
        assert.equal(d.querySelector('[data-piece-panel="assemble"]').hidden, false);
        d.querySelector('[data-piece-tab="practice"]').click();
        assert.equal(d.querySelector('[data-piece-panel="practice"]').hidden, false);
        const correctText = topic.detail[language].split(/[.!?]/)[0]+'.';
        const choices = [...d.querySelectorAll('#piece-answers button')];
        choices.find(x => x.textContent !== correctText).click();
        assert.ok(b('piece-feedback').textContent);
        choices.find(x => x.textContent === correctText).click();
        assert.ok(choices.every(x => x.disabled));
        assert.ok(b('piece-feedback').textContent.includes(topic.example[language]));
        b('piece-close').click();assert.equal(d.activeElement,button);
      }
      const picker=b('part-picker');picker.value='motherboard';picker.dispatchEvent(new dom.window.Event('change'));
      assert.equal(dialog.open,true);
      d.querySelector('#piece-related button').click();
      assert.equal(b('piece-title').textContent,topics.find(t=>t.id==='cpu').name[language]);
      assert.equal(b('piece-feedback').textContent,'');
      b('piece-next').click();assert.notEqual(b('piece-title').textContent,topics.find(t=>t.id==='cpu').name[language]);
      const activeId=picker.value;
      b('piece-learned').click();assert.equal(b('piece-learned').disabled,true);
      assert.ok(messages.at(-1).ids.includes(device==='laptop'?'laptop:'+activeId:activeId));
      d.querySelector('[data-piece-tab="practice"]').click();
      b('piece-question').value='How does this connect?';b('piece-question-form').onsubmit({preventDefault(){}});
      assert.deepEqual(messages.at(-1),{type:'ask-pc-teacher',device,id:activeId,intent:'question',question:'How does this connect?'});
      const count=messages.length;b('piece-question').value=' ';b('piece-question-form').onsubmit({preventDefault(){}});assert.equal(messages.length,count);
      b('piece-close').click();
    }
    // A single actual image click, without a second tap, opens the laptop battery.
    b('layer-reset').click();const photo=b('interior-image');photo.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:1500});
    photo.onclick({clientX:400,clientY:950});assert.equal(dialog.open,true);
    assert.equal(b('piece-title').textContent,laptopTopics.find(t=>t.id==='battery').name[language]);
  } finally { dom.window.close(); }
});

test('custom computer questions use trusted assembly context and validate limits', () => {
  for (const device of ['desktop','laptop']) for (const language of ['en','fr','ar']) {
    const route=pcTeacherRoute({type:'ask-pc-teacher',device,id:'cpu',intent:'question',question:'How is it mounted?',fitting:'INJECTED'},language);
    assert.match(route.params.question,/How is it mounted/);
    assert.ok(route.params.question.includes(computerAssembly(device,'cpu').fitting[language]));
    assert.doesNotMatch(route.params.question,/INJECTED/);
  }
  for(const question of ['', ' ', 'x'.repeat(601), null]) assert.equal(pcTeacherRoute({type:'ask-pc-teacher',device:'laptop',id:'cpu',intent:'question',question},'en'),null);
});
