const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
const { phoneExplorerDocument } = load('lecomax-learning-app/utils/phone-explorer-document.ts');
const { phoneLearningIds } = load('lecomax-learning-app/utils/phone-learning.ts');
const { phoneTopics } = load('lecomax-learning-app/data/phone-explorer.ts');
const { phoneAssembly } = load('lecomax-learning-app/data/phone-assembly.ts');

test('every hardware topic has localized assembly content and valid connected parts', () => {
  for (const topic of phoneTopics.filter(t => t.group === 'hardware')) {
    const lesson = phoneAssembly[topic.id];
    assert.ok(lesson, topic.id);
    for (const language of ['en', 'fr', 'ar']) {
      assert.ok(lesson.position[language].length > 30);
      assert.ok(lesson.fitting[language].length > 50);
      assert.doesNotMatch(lesson.position[language] + lesson.fitting[language], /[ÃÂØÙ�]|\?{2,}/);
    }
    assert.equal(lesson.related.length, 3);
    for (const id of lesson.related) assert.ok(id !== topic.id && phoneTopics.some(t => t.id === id));
  }
});

test('learning progress accepts only known topics, deduplicates and recovers malformed data', () => {
  assert.equal(JSON.stringify(phoneLearningIds('["ram","ram","unknown",4,"storage"]')), '["ram","storage"]');
  assert.equal(JSON.stringify(phoneLearningIds('["battery","flex","screws"]')), '["battery","flex","screws"]','old and new learning IDs are preserved');
  for (const value of ['{', '{}', undefined]) assert.equal(phoneLearningIds(value).length, 0);
  for (const topic of phoneTopics) for (const language of ['en','fr','ar']) {
    assert.ok(topic.name[language] && topic.detail[language] && topic.example[language]);
  }
});

for (const language of ['en','fr','ar']) test(`3D lab ${language}: geometry, topic lessons, quiz and progress bridge`, () => {
  const messages = [], points = [], timers = new Map();
  let timerId = 0, drawCount = 0;
  const flushTap = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); };
  const dom = new JSDOM(phoneExplorerDocument(language), {
    runScripts: 'dangerously', beforeParse(window) {
      window.setTimeout = fn => { timers.set(++timerId, fn); return timerId; };
      window.clearTimeout = id => timers.delete(id);
      window.HTMLCanvasElement.prototype.getContext = () => ({ scale() {}, clearRect() { drawCount++; points.length = 0; }, beginPath() {}, moveTo(x,y) { points.push([x,y]); }, lineTo(x,y) { points.push([x,y]); }, closePath() {}, fill() {}, stroke() {}, fillText() {} });
      Object.defineProperty(window.HTMLCanvasElement.prototype,'clientWidth',{get:()=>400});
      Object.defineProperty(window.HTMLCanvasElement.prototype,'clientHeight',{get:()=>330});
      window.parent.postMessage = value => messages.push(JSON.parse(value));
    },
  });
  const doc=dom.window.document;
  try {
    assert.equal(doc.documentElement.dir, language==='ar'?'rtl':'ltr');
    assert.equal(messages[0].type,'ready');
    assert.equal(doc.getElementById('photo-view').hidden,false,'realistic interior is the default');
    assert.equal(doc.getElementById('phone').hidden,true);
    assert.match(doc.getElementById('teardown-image').src,/^data:image\/jpeg;base64,/,'image is bundled for offline use');
    assert.equal(doc.querySelectorAll('[data-part],.photo-hotspot').length,0,'no numbered circles obscure the image');
    assert.equal(doc.querySelectorAll('#photo-picker option').length,24,'all visible component families can be selected accessibly');
    assert.doesNotMatch(doc.body.textContent,/\?{3,}/,'localized text must not become question marks');
    if(language==='ar') assert.match(doc.querySelector('.photo-caption').textContent,/اضغط/);
    if(language==='fr') assert.match(doc.querySelector('.photo-caption').textContent,/pièce/);
    const visibleText = [...doc.querySelectorAll('body *:not(script):not(style)')]
      .flatMap(el => [...el.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent))
      .join(' ');
    const accessibleText = [...doc.querySelectorAll('[aria-label], [alt], [data-zoom-in], [data-zoom-out]')]
      .flatMap(el => ['aria-label', 'alt', 'data-zoom-in', 'data-zoom-out'].map(name => el.getAttribute(name) || ''))
      .join(' ');
    assert.doesNotMatch(visibleText + accessibleText, /[ÃÂØÙ�]|\?{2,}/, 'labels and accessible text must remain valid Unicode');
    assert.deepEqual([...doc.querySelectorAll('[data-piece-zoom]')].map(el => el.textContent), ['1×', '2×', '3×']);
    if(language==='ar') {
      assert.equal(doc.querySelector('label[for="photo-picker"]').textContent, 'اكتشف قطعة');
      assert.equal(doc.querySelector('.piece-zoom').getAttribute('aria-label'), 'تكبير القطعة');
    }
    const mappedPoints=dom.window.eval(`Array.from(new Set(photoRegions.map(r=>r.id))).map(id=>{
      for(const region of photoRegions.filter(r=>r.id===id)){
        const [left,top,w,h]=region.box;
        for(let x=left+.1;x<left+w;x+=.5)for(let y=top+.1;y<top+h;y+=.5){if(photoRegionAt(x,y)?.id===id)return {id,x,y}}
      }
      return {id};
    })`);
    assert.equal(mappedPoints.length,24);
    const photo=doc.getElementById('teardown-image');
    for(const width of [300,600]) {
      // Includes a negative left offset to simulate horizontal panning while zoomed.
      photo.getBoundingClientRect=()=>({left:width===300?10:-150,top:20,width,height:width*1.5});
      const bounds=photo.getBoundingClientRect();
      for(const point of mappedPoints){
        assert.equal(typeof point.x,'number',`${point.id} has an unobscured image region`);
        photo.onclick({currentTarget:photo,detail:1,clientX:bounds.left+point.x/100*bounds.width,clientY:bounds.top+point.y/100*bounds.height});
        const topic=phoneTopics.find(t=>t.id===point.id);
        assert.equal(doc.getElementById('piece-dialog').open, true, 'one click opens the lesson immediately');
        assert.equal(doc.getElementById('piece-title').textContent, topic.name[language]);
        assert.equal(doc.getElementById('piece-fitting').textContent, phoneAssembly[point.id].fitting[language]);
        assert.equal(doc.querySelectorAll('#piece-connections button').length, 3);
        assert.equal(doc.getElementById('photo-title').textContent,topic.name[language],`${point.id} updates immediately before timers at image width ${width}`);
        flushTap();
        assert.equal(doc.getElementById('photo-role').textContent,topic.detail[language]);
        assert.equal(doc.getElementById('photo-example').textContent,topic.example[language]);
        assert.equal(doc.getElementById('photo-outline').hidden,false);
        doc.getElementById('piece-close').click();
      }
    }
    const viewport=doc.querySelector('.photo-viewport');
    const savedRect=photo.getBoundingClientRect;
    Object.defineProperties(viewport,{clientWidth:{value:400},clientHeight:{value:400},scrollWidth:{value:800},scrollHeight:{value:1200}});
    viewport.getBoundingClientRect=()=>({left:20,top:30});
    photo.getBoundingClientRect=()=>({left:20-viewport.scrollLeft,top:30-viewport.scrollTop,width:800,height:1200});
    doc.getElementById('photo-picker').value='storage';doc.getElementById('photo-picker').onchange();
    doc.getElementById('photo-zoom').click();
    assert.equal(doc.querySelector('.photo-viewport').classList.contains('zoomed'),true);
    assert.equal(viewport.scrollLeft,388,'zoom centers the selected right-hand storage chip');
    assert.equal(viewport.scrollTop,520,'zoom centers selected piece vertically');
    assert.equal(doc.getElementById('photo-zoom').textContent,doc.getElementById('photo-zoom').dataset.zoomOut);
    doc.getElementById('photo-picker').value='camera';doc.getElementById('photo-picker').onchange();
    assert.equal(viewport.scrollLeft,0,'changing selection while zoomed moves to the camera and clamps to edge');
    assert.equal(viewport.scrollTop,0);
    dom.window.eval("pickPhoto('camera',photoRegions.filter(r=>r.id==='camera')[1],false)");
    dom.window.eval('centerPhotoSelection()');
    assert.equal(viewport.scrollTop,52,'focus uses the actual camera instance selected');
    doc.getElementById('photo-zoom').click();
    assert.equal(doc.getElementById('photo-zoom').getAttribute('aria-pressed'),'false');
    assert.equal(viewport.scrollLeft,0);assert.equal(viewport.scrollTop,0,'zoom out resets both axes');
    photo.getBoundingClientRect=savedRect;
    doc.getElementById('photo-picker').value='flex';doc.getElementById('photo-picker').onchange();
    assert.equal(doc.getElementById('photo-title').textContent,phoneTopics.find(t=>t.id==='flex').name[language]);
    const photoBounds=photo.getBoundingClientRect();
    photo.onclick({currentTarget:photo,detail:1,clientX:photoBounds.left+photoBounds.width*.38,clientY:photoBounds.top+photoBounds.height*.54});
    const selectedBefore=doc.getElementById('photo-title').textContent;
    doc.querySelector('.photo-viewport').dispatchEvent(new dom.window.Event('scroll'));flushTap();
    assert.equal(dom.window.eval('lastTap'),null,'panning cancels pending double-tap tracking');
    assert.equal(doc.getElementById('photo-title').textContent,selectedBefore,'panning preserves immediate selection');
    photo.onclick({currentTarget:photo,detail:1,clientX:photoBounds.left+1,clientY:photoBounds.top+1});flushTap();
    assert.equal(doc.getElementById('photo-title').textContent,selectedBefore,'background does not invent a component');
    const photoTap=()=>photo.onclick({currentTarget:photo,detail:1,clientX:photoBounds.left+photoBounds.width*.38,clientY:photoBounds.top+photoBounds.height*.54});
    photoTap();flushTap();
    assert.equal(doc.getElementById('title').textContent,phoneTopics.find(t=>t.id==='battery').name[language]);
    photoTap();photoTap();flushTap();
    const dialog=doc.getElementById('piece-dialog');
    assert.equal(dialog.open,true,'taps keep the component lesson open');
    assert.equal(doc.getElementById('piece-title').textContent,phoneTopics.find(t=>t.id==='battery').name[language]);
    assert.equal(doc.getElementById('piece-role').textContent,phoneTopics.find(t=>t.id==='battery').detail[language]);
    doc.querySelector('.piece-tabs [data-piece-tab="assemble"]').click();
    assert.equal(doc.querySelector('[data-piece-panel="understand"]').hidden, true);
    assert.equal(doc.querySelector('[data-piece-panel="assemble"]').hidden, false);
    assert.equal(doc.getElementById('piece-fit-position').textContent, phoneAssembly.battery.position[language]);
    doc.querySelector('.piece-tabs [data-piece-tab="practice"]').click();
    assert.equal(doc.querySelector('[data-piece-panel="practice"]').hidden, false);
    const answerText=phoneTopics.find(t=>t.id==='battery').detail[language].split(/[.!?。]/)[0]+'.';
    const answers=[...doc.querySelectorAll('#piece-answers button')];
    answers.find(b=>b.textContent!==answerText).click();
    assert.equal(doc.getElementById('piece-feedback').textContent, doc.getElementById('piece-feedback').dataset.wrong);
    answers.find(b=>b.textContent===answerText).click();
    assert.ok(doc.getElementById('piece-feedback').textContent.startsWith(doc.getElementById('piece-feedback').dataset.correct));
    assert.ok(answers.every(b=>b.disabled));
    doc.querySelector('.piece-tabs [data-piece-tab="understand"]').click();
    doc.querySelector('#piece-connections button').click();
    assert.equal(doc.getElementById('piece-title').textContent, phoneTopics.find(t=>t.id==='power').name[language]);
    assert.equal(doc.getElementById('piece-feedback').textContent, '');
    assert.ok([...doc.querySelectorAll('#piece-answers button')].every(b=>!b.disabled));
    doc.getElementById('piece-next').click();
    assert.notEqual(doc.getElementById('piece-title').textContent, phoneTopics.find(t=>t.id==='power').name[language]);
    dom.window.eval("pickPhoto('display');openPiece()");
    assert.equal(doc.getElementById('piece-title').textContent, phoneTopics.find(t=>t.id==='display').name[language]);
    assert.equal(dialog.querySelector('.piece-image').hidden,true,'unmapped screen has a lesson without inventing a crop');
    const continueButton=dialog.querySelector('[data-piece-panel="understand"] [data-piece-tab="assemble"]');
    continueButton.focus();continueButton.click();
    assert.equal(doc.activeElement,dialog.querySelector('.piece-tabs [data-piece-tab="assemble"]'),'keyboard focus leaves the hidden panel');
    dom.window.eval("pickPhoto('battery');openPiece()");
    assert.equal(doc.getElementById('piece-image').src,photo.src);
    assert.equal(dialog.querySelector('.piece-header').contains(doc.getElementById('piece-close')),true);
    for(const intent of ['explain','example','quiz']){
      dialog.querySelector(`[data-teacher="${intent}"]`).click();
      assert.deepEqual(messages.at(-1),{type:'ask-phone-teacher',id:'battery',intent});
    }
    const input=doc.getElementById('piece-question');input.value='How does it store energy?';
    doc.getElementById('piece-question-form').onsubmit({preventDefault(){}});
    assert.deepEqual(messages.at(-1),{type:'ask-phone-teacher',id:'battery',intent:'question',question:'How does it store energy?'});
    const count=messages.length;input.value='  ';doc.getElementById('piece-question-form').onsubmit({preventDefault(){}});
    assert.equal(messages.length,count,'blank questions are not sent');
    assert.equal(doc.getElementById('cover').getAttribute('aria-pressed'),'true');
    doc.getElementById('piece-close').click();assert.equal(dialog.open,false);
    for (const [type,x] of [['pointerdown',100],['pointermove',130],['pointerup',130]]) {
      const event=new dom.window.Event(type);Object.assign(event,{clientX:x,clientY:100});viewport.dispatchEvent(event);
    }
    photoTap();assert.equal(dialog.open,false,'scroll/drag does not open a component');
    photoTap();assert.equal(dialog.open,true,'a subsequent deliberate tap works');doc.getElementById('piece-close').click();
    for(const point of mappedPoints){
      doc.getElementById('photo-picker').value=point.id;doc.getElementById('photo-picker').onchange();
      assert.equal(dialog.open,true,'picker opens the lesson');doc.getElementById('piece-close').click();
      doc.getElementById('piece-open').focus();doc.getElementById('piece-open').click();
      assert.equal(dialog.open,true);
      assert.equal(dialog.querySelector('.piece-body').scrollTop,0,'opening a piece resets the content scroll');
      assert.equal(doc.getElementById('piece-title').textContent,phoneTopics.find(t=>t.id===point.id).name[language]);
      assert.ok(parseFloat(dialog.querySelector('.piece-image').style.width)>0);
      dialog.querySelector('.piece-body').scrollTop=300;
      dialog.onkeydown({key:'Escape',preventDefault(){}});assert.equal(dialog.open,false);
      assert.equal(doc.activeElement.id,'piece-open','closing restores keyboard focus');
    }
    assert.equal(doc.getElementById('photo-view').hidden,false);
    assert.equal(drawCount,0,'photo selections and detail openings never render the hidden 3D canvas');
    doc.getElementById('photo-mode').click();
    assert.ok(drawCount>0,'switching to 3D renders the model');
    assert.equal(doc.getElementById('photo-view').hidden,true,'3D diagram remains available');
    assert.equal(doc.getElementById('phone').hidden,false);
    doc.getElementById('photo-mode').click();
    assert.equal(doc.getElementById('photo-view').hidden,false);
    doc.getElementById('cover').click();
    dom.window.eval('photoMode=false;syncPhoto();draw()');
    assert.ok(points.length > 100, 'actual projected cuboid faces rendered');
    const before=JSON.stringify(points);
    doc.getElementById('right').click();
    assert.notEqual(JSON.stringify(points),before,'rotation changes projected geometry');
    doc.getElementById('front').click();
    const target = dom.window.eval('project([-.52,-.4,.23])');
    const canvas = doc.getElementById('phone');
    canvas.setPointerCapture = () => {};
    canvas.onpointerdown({clientX:target[0],clientY:target[1],pointerId:1});
    canvas.onpointerup({clientX:target[0],clientY:target[1]});
    flushTap();
    assert.equal(doc.getElementById('title').textContent,phoneTopics.find(t=>t.id==='camera').name[language],'front camera app hit opens its lesson');
    const front = JSON.stringify(points);
    doc.getElementById('back').click();
    assert.notEqual(JSON.stringify(points),front,'rear camera geometry replaces screen view');
    const tap = (x,y,pointerType='mouse') => {
      canvas.onpointerdown({clientX:x,clientY:y,pointerId:1,pointerType,button:0,isPrimary:true});
      canvas.onpointerup({clientX:x,clientY:y,pointerId:1,pointerType});
    };
    const cover = doc.getElementById('cover');
    // Both mouse double-clicks and touch double-taps use the same pointer path.
    for (const pointerType of ['mouse','touch']) {
      tap(200,165,pointerType); tap(200,165,pointerType); flushTap();
      assert.equal(cover.getAttribute('aria-pressed'),'true');
      assert.equal(doc.getElementById('title').textContent,phoneTopics.find(t=>t.id==='battery').name[language]);
      assert.equal(doc.querySelectorAll('#topics section').length,4,'hardware organized into four learning groups');
      for (const [id,position] of [['battery',[-.39,.59,.30]],['chip',[.82,-.65,.33]],['ram',[.82,.24,.33]],['storage',[.82,.94,.33]],['sensors',[.76,-1.97,.29]],['radio',[0,-2.49,.26]],['audio',[0,2.19,.27]],['port',[0,2.49,.31]],['camera',[-.85,-2.03,.37]]]) {
        const p=dom.window.eval(`project(${JSON.stringify(position)})`);
        tap(p[0],p[1],pointerType); flushTap();
        assert.equal(doc.getElementById('title').textContent,phoneTopics.find(t=>t.id===id).name[language],`${id} geometry opens its lesson`);
      }
      tap(200,165,pointerType); tap(200,165,pointerType); flushTap();
      assert.equal(cover.getAttribute('aria-pressed'),'false','double gesture also replaces cover');
    }
    tap(1,1); tap(1,1); flushTap();
    assert.equal(cover.getAttribute('aria-pressed'),'false','empty stage does not open cover');
    tap(200,165);
    doc.getElementById('next').click();
    const nextTitle=doc.getElementById('title').textContent;
    flushTap();
    assert.equal(doc.getElementById('title').textContent,nextTitle,'pending tap cannot overwrite next lesson');
    canvas.onpointerdown({clientX:200,clientY:165,pointerId:1,button:2});
    canvas.onpointerup({clientX:200,clientY:165,pointerId:1});
    flushTap();
    assert.equal(doc.getElementById('title').textContent,nextTitle,'right click does not select a component');
    tap(200,165);
    canvas.onpointerdown({clientX:200,clientY:165,pointerId:1});
    canvas.onpointermove({clientX:240,clientY:165,pointerId:1});
    canvas.onpointerup({clientX:240,clientY:165,pointerId:1});
    flushTap();
    assert.equal(cover.getAttribute('aria-pressed'),'false','drag cancels pending double tap');
    cover.click();
    assert.equal(cover.getAttribute('aria-pressed'),'true','accessible button opens cover');
    const centerBefore=JSON.stringify(points);
    doc.getElementById('phone').onkeydown({key:'ArrowRight',preventDefault(){}});
    assert.notEqual(JSON.stringify(points),centerBefore,'open phone supports keyboard rotation');
    doc.getElementById('explode').click();
    assert.equal(cover.getAttribute('aria-pressed'),'false','exploded view replaces cover mode');
    assert.equal(doc.getElementById('explode').getAttribute('aria-pressed'),'true');
    for (const topic of phoneTopics.filter(t=>t.group==='hardware')) {
      doc.querySelector(`[data-topic="${topic.id}"]`).click();
      assert.equal(doc.getElementById('title').textContent,topic.name[language]);
      assert.equal(doc.getElementById('detail').textContent,topic.detail[language]);
    }
    doc.getElementById('learned').click();
    assert.deepEqual(messages.at(-1),{type:'learned',ids:['microphone']});
    dom.window.eval("pickPhoto('battery');openPiece()");
    doc.getElementById('piece-understood').click();
    assert.deepEqual(messages.at(-1), {type:'learned', ids:['microphone','battery']});
    assert.equal(doc.getElementById('piece-understood').disabled,true);
    doc.getElementById('piece-close').click();
    dom.window.dispatchEvent(new dom.window.MessageEvent('message',{data:JSON.stringify({type:'init',ids:['storage','ram','unknown']})}));
    assert.ok(doc.getElementById('progress').textContent.startsWith('2 / '+phoneTopics.length));
    doc.querySelector('[data-answer="ram"]').click();
    const wrong=doc.getElementById('feedback').textContent;
    doc.querySelector('[data-answer="storage"]').click();
    assert.ok(wrong && doc.getElementById('feedback').textContent!==wrong);
    doc.getElementById('software').click();
    assert.equal(cover.getAttribute('aria-pressed'),'false');
    assert.equal(doc.getElementById('explode').getAttribute('aria-pressed'),'false');
    assert.equal(doc.querySelectorAll('[data-topic]').length,4);
    assert.equal(doc.getElementById('explode').disabled,true);
    for (const topic of phoneTopics.filter(t=>t.group==='software')) {
      doc.querySelector(`[data-topic="${topic.id}"]`).click();
      assert.equal(doc.getElementById('title').textContent,topic.name[language]);
    }
    doc.getElementById('next').click();
    assert.equal(doc.getElementById('title').textContent,phoneTopics.find(t=>t.id==='os').name[language]);
    cover.click();
    assert.equal(doc.getElementById('hardware').getAttribute('aria-pressed'),'true','open cover returns to hardware');
    assert.equal(cover.getAttribute('aria-pressed'),'true');
    assert.match(doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content,/connect-src 'none'/);
    doc.getElementById('teardown-image').onerror();
    assert.equal(doc.getElementById('phone').hidden,false,'image decoding failure leaves usable diagram and lessons');
  } finally { dom.window.close(); }
});
