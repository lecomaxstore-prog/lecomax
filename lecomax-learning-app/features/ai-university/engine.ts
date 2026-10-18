import { lessons } from './curriculum';
import type { Exercise, Lesson } from './schema';
export const UNIVERSITY_KEY='ai-university.v1';
export type Evidence={choice:number;correct:boolean;attempts:number;at:number};
export type Review={box:number;dueAt:number;lastAt:number;correct:boolean};
export type Portfolio={id:string;lessonId:string;title:string;artifact:string;updatedAt:number;checked:boolean};
export type UniversityState={version:1;answers:Record<string,Evidence>;practice:Record<string,{passed:boolean;at:number}>;reviews:Record<string,Review>;placement:Record<string,Evidence>;projects:Portfolio[];drafts:Record<string,string>};
export const freshUniversity=():UniversityState=>({version:1,answers:{},practice:{},reviews:{},placement:{},projects:[],drafts:{}});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const time=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
export function readUniversity(raw?:string):UniversityState {
  if(!raw)return freshUniversity();
  const s=JSON.parse(raw) as UniversityState;
  if(!s||s.version!==1||![s.answers,s.practice,s.reviews,s.placement,s.drafts].every(object)||!Array.isArray(s.projects)||s.projects.length>100)throw Error('INVALID_UNIVERSITY');
  for(const map of [s.answers,s.placement])for(const [key,a] of Object.entries(map)){
    const [id,index]=key.split(':');const q=lessons.find(l=>l.id===id)?.quiz[Number(index)];
    if(!q||!a||!Number.isInteger(a.choice)||a.choice<0||a.choice>=q.choices.length||a.correct!==(q.answer===a.choice)||!Number.isInteger(a.attempts)||a.attempts<1||!time(a.at))throw Error('INVALID_EVIDENCE');
  }
  for(const [id,p] of Object.entries(s.practice))if(!lessons.some(l=>l.id===id)||!p||typeof p.passed!=='boolean'||!time(p.at))throw Error('INVALID_PRACTICE');
  for(const [key,r] of Object.entries(s.reviews)){
    const [id,index]=key.split(':');if(!lessons.find(l=>l.id===id)?.quiz[Number(index)]||!r||!Number.isInteger(r.box)||r.box<0||r.box>5||!time(r.dueAt)||!time(r.lastAt)||typeof r.correct!=='boolean')throw Error('INVALID_REVIEW');
  }
  if(new Set(s.projects.map(p=>p.id)).size!==s.projects.length)throw Error('DUPLICATE_PROJECT');
  for(const p of s.projects)if(!p||typeof p.id!=='string'||!p.id||p.id.length>100||!lessons.some(l=>l.id===p.lessonId)||typeof p.title!=='string'||!p.title.trim()||p.title.length>100||typeof p.artifact!=='string'||p.artifact.length>20000||!time(p.updatedAt)||typeof p.checked!=='boolean')throw Error('INVALID_PROJECT');
  if(Object.entries(s.drafts).some(([id,v])=>!lessons.some(l=>l.id===id)||typeof v!=='string'||v.length>20000))throw Error('INVALID_DRAFT');
  return s;
}
export function calculate(input:string):number|null {
  const m=input.trim().match(/^(-?\d{1,8}(?:\.\d{1,6})?)\s*([+*/-])\s*(-?\d{1,8}(?:\.\d{1,6})?)$/);
  if(!m)return null;const a=Number(m[1]),b=Number(m[3]);const result=m[2]==='+'?a+b:m[2]==='-'?a-b:m[2]==='*'?a*b:b===0?NaN:a/b;
  return Number.isFinite(result)?result:null;
}
export function checkExercise(exercise:Exercise,input:string):{passed:boolean;feedback:string} {
  if(input.length>20000)return {passed:false,feedback:'Input exceeds the 20,000-character limit.'};
  if(!input.trim())return {passed:false,feedback:'Enter your attempt before checking.'};
  if(exercise.kind==='number'){
    const value=Number(input);const passed=Number.isFinite(value)&&Math.abs(value-Number(exercise.expected))<1e-9;
    return {passed,feedback:passed?'Calculation matches the expected result.':'Check the operations and units. '+exercise.hint};
  }
  if(exercise.kind==='agent'){
    const result=calculate(input);return {passed:result===exercise.expected,feedback:result===null?'Use two finite numbers and one +, -, * or / operator; division by zero is rejected.':result===exercise.expected?`Tool returned ${result}. This was a real local calculation, not an LLM call.`:`Tool returned ${result}; compare it with the requested calculation.`};
  }
  if(exercise.kind==='json'||exercise.kind==='prompt'){
    let value:unknown;try{value=JSON.parse(input);}catch{return {passed:false,feedback:'Invalid JSON. Use double-quoted keys and check commas and brackets.'};}
    if(!object(value))return {passed:false,feedback:'Expected a JSON object, not an array or primitive.'};
    if(exercise.kind==='prompt'){
      const missing=['task','context','format','verify'].filter(k=>typeof value[k]!=='string'||!(value[k] as string).trim());
      return {passed:!missing.length,feedback:missing.length?'Missing nonempty strings: '+missing.join(', '):'All four structural criteria pass. This does not grade semantic quality or model behavior; test it on representative cases.'};
    }
    const expected=exercise.expected as Record<string,unknown>;
    const wrong=Object.keys(expected).filter(k=>value[k]!==expected[k]);const extra=Object.keys(value).filter(k=>!(k in expected));
    return {passed:!wrong.length&&!extra.length,feedback:wrong.length?`Check the required values and types for: ${wrong.join(', ')}.`:extra.length?`Unexpected fields: ${extra.join(', ')}.`:'The complete contract matches, including value types.'};
  }
  const normalize=(v:string)=>v.trim().toLowerCase().replace(/\s*,\s*/g,',');
  const passed=normalize(input)===normalize(exercise.solution);
  return {passed,feedback:passed?'Correct for this case. Explain why before trying the quiz.':exercise.hint};
}
export function recordPractice(s:UniversityState,l:Lesson,input:string,now=Date.now()):UniversityState {
  return {...s,drafts:{...s.drafts,[l.id]:input},practice:{...s.practice,[l.id]:{passed:checkExercise(l.exercise,input).passed,at:now}}};
}
export function recordAnswer(s:UniversityState,id:string,index:number,choice:number,kind:'quiz'|'placement'|'review',now=Date.now()):UniversityState {
  const l=lessons.find(l=>l.id===id),q=l?.quiz[index];
  if(!q||!Number.isInteger(choice)||choice<0||choice>=q.choices.length||!time(now))throw Error('INVALID_ANSWER');
  const key=`${id}:${index}`,correct=choice===q.answer;
  if(kind==='review'){
    const old=s.reviews[key];if(!old||now<old.dueAt)throw Error('REVIEW_NOT_DUE');
    const box=correct?Math.min(5,old.box+1):0;const days=correct?[1,3,7,14,30,60][box]!:1;
    return {...s,reviews:{...s.reviews,[key]:{box,correct,lastAt:now,dueAt:now+days*86400000}}};
  }
  const map=kind==='placement'?'placement':'answers';const old=s[map][key];
  const next={...s,[map]:{...s[map],[key]:{choice,correct,attempts:(old?.attempts||0)+1,at:now}}};
  if(kind==='quiz'&&!s.reviews[key])next.reviews={...s.reviews,[key]:{box:0,correct:false,lastAt:0,dueAt:now+86400000}};
  return next;
}
export function status(s:UniversityState,l:Lesson):'new'|'practicing'|'practiced'|'retained' {
  const quiz=l.quiz.every((_,i)=>s.answers[`${l.id}:${i}`]?.correct);
  const practice=s.practice[l.id]?.passed;
  if(quiz&&practice&&l.quiz.every((_,i)=>s.reviews[`${l.id}:${i}`]?.correct))return 'retained';
  if(quiz&&practice)return 'practiced';
  return s.practice[l.id]||l.quiz.some((_,i)=>s.answers[`${l.id}:${i}`])?'practicing':'new';
}
export function recommendations(s:UniversityState,now=Date.now()) {
  const due=lessons.filter(l=>l.quiz.some((_,i)=>(s.reviews[`${l.id}:${i}`]?.dueAt??Infinity)<=now));
  const gaps=lessons.filter(l=>l.quiz.some((_,i)=>s.placement[`${l.id}:${i}`]?.correct===false));
  const next=lessons.find(l=>status(s,l)==='new'&&l.prerequisites.every(id=>['practiced','retained'].includes(status(s,lessons.find(l=>l.id===id)!))));
  return {due,gaps,next};
}
export function saveProject(s:UniversityState,p:Portfolio):UniversityState {
  const lesson=lessons.find(l=>l.id===p.lessonId);
  if(!lesson)throw Error('INVALID_PROJECT');
  const checked=p.id!=='document-qa'&&checkExercise(lesson.exercise,p.artifact).passed;
  return readUniversity(JSON.stringify({...s,projects:[...s.projects.filter(x=>x.id!==p.id),{...p,checked}]}));
}
