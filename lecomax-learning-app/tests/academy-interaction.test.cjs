const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { load } = require('../scripts/inspect.cjs');
test('academy reader links prerequisites, saves independent drafts and reveals solutions on demand', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const saved = { window: global.window, document: global.document, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const lesson = require('../data/academy/lessons/academy-files.json');
  const context = React.createContext(null);
  let snapshot = { language: 'en', drafts: {} };
  const navigations = [];
  const box = ({ children }) => React.createElement('div', null, children);
  const ui = {
    Card: box, Label: box, Row: box,
    Button: ({ title, onPress, selected }) => React.createElement('button', {onClick:onPress, 'aria-pressed': !!selected}, title),
    Field: ({ value, onChangeText, placeholder }) => React.createElement('textarea', { value, 'aria-label':placeholder, onInput:event=>onChangeText(event.target.value) }),
  };
  const output = ts.transpileModule(fs.readFileSync(require.resolve('../components/AcademyLesson.tsx'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const exports = {};
  const dependencies = {
    '@expo/vector-icons/Ionicons':()=>null, 'react-native': { View: box }, 'expo-router': { router:{push:route=>navigations.push(route)} },
    './UI':ui, './CodeViewer':{CodeViewer:({code})=>React.createElement('pre',null,code)},
    '../store/School': {useSchool:()=>React.useContext(context)},
    '../services/academy':load('lecomax-learning-app/services/academy.ts'),
  };
  vm.runInNewContext(output,{exports,require:name=>dependencies[name] || require(name)});
  function Harness() {
    const [state, setState] = React.useState(snapshot);
    snapshot = state;
    return React.createElement(context.Provider,{value:{state,update:setState,colors:{soft:'#eee',accent:'#123',neutral:'#eee',muted:'#666',line:'#ddd'},rtl:false,t:(_fr,en)=>en}},
      React.createElement(exports.AcademyIntroduction,{lesson}),
      React.createElement(exports.AcademyPractice,{lesson}),
      React.createElement(exports.AcademyReadiness,{lesson}));
  }
  let root = createRoot(document.getElementById('root'));
  const buttons = label => [...document.querySelectorAll('button')].filter(button=>button.textContent===label);
  try {
    await React.act(()=>root.render(React.createElement(Harness)));
    assert.equal(document.querySelectorAll('textarea').length,3);
    assert.equal(document.querySelectorAll('pre').length,0);
    await React.act(()=>buttons('Computers from zero: from a click to saved work')[0].click());
    assert.equal(navigations[0].params.id,'academy-computer');
    const fields = [...document.querySelectorAll('textarea')];
    await React.act(()=>{ fields[0].value='First independent attempt';fields[0].dispatchEvent(new dom.window.Event('input',{bubbles:true})); });
    assert.equal(snapshot.drafts['academy:exercise:academy-files:paths'],'First independent attempt');
    assert.equal(fields[1].value,'');
    await React.act(()=>buttons('Show hints')[0].click());
    assert(document.body.textContent.includes(lesson.exercises[0].hints[0]));
    await React.act(()=>buttons('Worked solution')[0].click());
    assert.equal(document.querySelectorAll('pre').length,1);
    assert(document.body.textContent.includes(lesson.exercises[0].walkthrough));
    await React.act(()=>buttons(lesson.readiness[0])[0].click());
    assert.equal(snapshot.drafts['academy:skill:academy-files:0'],'yes');
    assert.equal(buttons(lesson.readiness[0])[0].getAttribute('aria-pressed'),'true');
    await React.act(()=>root.unmount());
    root=createRoot(document.getElementById('root'));
    await React.act(()=>root.render(React.createElement(Harness)));
    assert.equal(document.querySelector('textarea').value,'First independent attempt');
    assert.equal(buttons(lesson.readiness[0])[0].getAttribute('aria-pressed'),'true');
    assert.equal(document.querySelectorAll('pre').length,0);
  } finally {
    await React.act(()=>root.unmount());dom.window.close();Object.assign(global,saved);
  }
});

test('lesson completion requires correct quiz answers and practiced skills; restart preserves exercise drafts', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url:'http://localhost' });
  const saved = { window:global.window, document:global.document, IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const lesson = load('lecomax-learning-app/services/academy.ts').getAcademyLesson('academy-computer','en');
  const context = React.createContext(null);
  let snapshot;
  let change;
  const box = ({children})=>React.createElement('div',null,children);
  const ui = { Card:box, Label:box, Page:box, Row:box,
    Button:({title,onPress,disabled,selected})=>React.createElement('button',{onClick:onPress,disabled,'aria-pressed':!!selected},title),
    Field:()=>null };
  function evaluate(file,deps){const exports={};const js=ts.transpileModule(fs.readFileSync(require.resolve(file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(js,{exports,require:name=>name in deps?deps[name]:require(name)});return exports;}
  const school={useSchool:()=>React.useContext(context)};
  const academy=evaluate('../components/AcademyLesson.tsx',{'@expo/vector-icons/Ionicons':()=>null,'react-native':{View:box},'expo-router':{router:{push(){}}},'./UI':ui,'./CodeViewer':{CodeViewer:()=>null},'../store/School':school,'../services/academy':load('lecomax-learning-app/services/academy.ts')});
  const screen=evaluate('../app/lesson/[id].tsx',{
    '../../components/CurriculumRubric': { CurriculumRubric: () => null },
    '../../components/SeasonExperiment': { SeasonExperiment: () => null },
    '../../services/curriculum-evidence': load('lecomax-learning-app/services/curriculum-evidence.ts'),
    '../../components/LessonOrientation': { LessonOrientation: () => null },
    '../../services/course-learning': load('lecomax-learning-app/services/course-learning.ts'),
    '../../features/universe/Journey': { LessonJourney: () => null },
    '../../features/universe/LessonAudio': { LessonAudio: () => null },
    '../../components/AcademyLesson':academy,
    '../../components/LessonFooter':{LessonFooter:({onRestart})=>React.createElement('button',{onClick:onRestart},'Restart fixture')},
    '../../components/PythonEnvironmentGuide':{},'../../components/StudyCoach':{StudyCoach:box,GuidedReading:()=>null,PracticeCoach:()=>null},
    'react-native':{View:box},'expo-router':{router:{push(){}},useLocalSearchParams:()=>({id:lesson.id,course:'academy-foundations'})},
    '../../components/UI':ui,'../../components/CodeViewer':{},'../../features/Quiz':{Quiz:()=>null},
    '../../components/WebsiteLesson':{},'../../store/School':school,
    '../../services/content':{getLesson:()=>lesson,project:[]},'../../utils/progress':{toggle:()=>[]},
    '../../utils/academy':load('lecomax-learning-app/utils/academy.ts'),
    '../../services/course-navigation':{lessonSequence:()=>undefined,courseNavigation:()=>undefined},
    '../../data/university/lessons':{getLessonSupport:()=>undefined},
    '../../components/LessonHeader':{LessonHeader:()=>null},'../../components/LessonCompanion':{},'../../components/LessonBrowser':{LessonBrowser:()=>null},
    '../../components/LessonTeacherHelp':{LessonTeacherHelp:()=>null},
  });
  function Harness(){const [state,setState]=React.useState({language:'en',stages:{[lesson.id]:3},drafts:{['academy:exercise:'+lesson.id+':trace']:'Keep this attempt'},bookmarks:[],difficult:[],completed:[],answers:Object.fromEntries(lesson.quiz.map(q=>[lesson.id+'::'+q.id,{choice:q.correctIndex,lessonId:lesson.id}]))});snapshot=state;change=setState;return React.createElement(context.Provider,{value:{state,update:setState,colors:{soft:'#eee',accent:'#123',neutral:'#eee',muted:'#666',line:'#ddd'},rtl:false,t:(_fr,en)=>en}},React.createElement(screen.default));}
  const root=createRoot(document.getElementById('root'));
  const button=label=>[...document.querySelectorAll('button')].find(element=>element.textContent===label);
  try{
    await React.act(()=>root.render(React.createElement(Harness)));
    assert.equal(button('Complete lesson').disabled,true);
    for(const skill of lesson.academy.readiness)await React.act(()=>button(skill).click());
    assert(snapshot.completed.includes(lesson.id), 'Passing the quiz and required practice automatically completes the lesson');
    assert.equal(snapshot.completed.filter(id => id === lesson.id).length, 1);
    const q=lesson.quiz[0];
    await React.act(()=>change(previous=>({...previous,answers:{...previous.answers,[lesson.id+'::'+q.id]:{choice:(q.correctIndex+1)%q.options.length,lessonId:lesson.id}}})));
    assert.equal(button('Completed ✓').disabled,true);
    await React.act(()=>change(previous=>({...previous,answers:{...previous.answers,[lesson.id+'::'+q.id]:{choice:q.correctIndex,lessonId:lesson.id}}})));
    assert(snapshot.completed.includes(lesson.id));
    await React.act(()=>button('Restart fixture').click());
    assert.equal(snapshot.completed.includes(lesson.id),false);
    assert.equal(Object.keys(snapshot.drafts).some(key=>key.startsWith('academy:skill:'+lesson.id+':')),false);
    assert.equal(snapshot.drafts['academy:exercise:'+lesson.id+':trace'],'Keep this attempt');
  }finally{await React.act(()=>root.unmount());dom.window.close();Object.assign(global,saved);}
});
