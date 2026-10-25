const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
test('More opens tools, preserves all destinations and switches courses in three languages', async () => {
 const dom = new JSDOM('<div id="root"></div>');
 const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
 Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
 let language = 'en'; const routes = [];
 const box = ({ children }) => { const check = child => { if (Array.isArray(child)) child.forEach(check); else assert(typeof child !== 'string' && typeof child !== 'number', 'Native View cannot contain text'); }; check(children); return React.createElement('div', null, children); };
 const button = ({ title, label, subtitle, onPress, selected }) => React.createElement('button', { onClick: onPress, 'aria-pressed': selected, 'data-description': subtitle }, title || label);
 const dependencies = {
  'react-native': { View: box, Platform: { OS: 'web' } },
  'expo-router': { router: { push: value => routes.push(value) } },
  'expo-constants': { __esModule: true, default: { expoConfig: { version: 'test' } } },
  '../../store/School': { useSchool: () => ({ state: { language }, colors: {}, rtl: language === 'ar', t: (fr,en,ar) => ({fr,en,ar})[language] }) },
  '../../components/UI': { Button: button, IconButton: button, ListItem: button, Card: box, Row: box, Label: ({children}) => React.createElement('span',null,children), Page: ({children,header}) => React.createElement('main',null,header,children) },
  '../../components/CourseLibrary': { CourseLibrary: () => React.createElement('div',null,'COURSE_LIBRARY') },
  '../../components/DeviceLabsSection': { DeviceLabsSection: () => null },
  '../../components/PracticeLaunchpad': { PracticeLaunchpad: () => null },
  '../../features/wellness/DailyRoutineCard': { DailyRoutineCard: ({compact}) => { assert.equal(compact,true); return null; } },
 };
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../app/(tabs)/more.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>dependencies[name] || require(name)});
 const root=createRoot(document.getElementById('root'));
 const click=async title=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===title);assert(b,title);await React.act(()=>b.click());};
 try {
  await React.act(()=>root.render(React.createElement(exports.default)));
  assert(!document.body.textContent.includes('COURSE_LIBRARY'));
  const labels=['Bookmarks','Notes and summaries','Review later','Review mistakes','Flashcards','Programming glossary','Error trainer','Statistics'];
  const kinds=['bookmarks','notes','difficult','mistakes','flashcards','glossary','errors','statistics'];
  for(let i=0;i<labels.length;i++){await click(labels[i]);assert.equal(routes.at(-1).params.kind,kinds[i]);}
  await click('3D Car Studio');assert.equal(routes.at(-1),'/car-studio');
  await click('Settings');assert.equal(routes.at(-1),'/settings');
  await click('My profile');assert.equal(routes.at(-1),'/profile');
  await click('Find a lesson or topic');assert.equal(routes.at(-1),'/search');
  await click('Python');assert.equal(routes.at(-1).params.runtime,'python');
  await click('Terminal');assert.equal(routes.at(-1),'/terminal');
  await click('My PC');assert.equal(routes.at(-1),'/pc');
  await click('Kali Linux');assert.equal(routes.at(-1),'/kali');
  await click('Learn how to learn');assert.equal(routes.at(-1).params.id,'study-skills');
  for (const [lang,courses,tools] of [['en','Courses','My tools'],['fr','Cours','Mes outils'],['ar','الدورات','أدواتي']]) {
   language=lang;await React.act(()=>root.render(React.createElement(exports.default,{key:lang})));
   await click(courses);assert(document.body.textContent.includes('COURSE_LIBRARY'));
   await click(tools);assert(!document.body.textContent.includes('COURSE_LIBRARY'));
   const python = [...document.querySelectorAll('button')].find(b=>b.textContent==='Python');
   assert(python.dataset.description && !python.dataset.description.includes('???'));
  }
 } finally {await React.act(()=>root.unmount());dom.window.close();Object.assign(global,saved);}
});
