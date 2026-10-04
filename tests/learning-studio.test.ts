import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { lessons } from '../app/admin/how-it-was-built/learning/lessons.ts';
import { roadmap, flows, projects, finalSteps } from '../app/admin/how-it-was-built/learning/resources.ts';
import { readProgress, runPlayground, streak, dayKey } from '../app/admin/how-it-was-built/learning/progress.ts';
test('all introductory lessons point to actual source anchors with complete translations and valid quizzes',()=>{
 assert.equal(lessons.length,12);assert.equal(new Set(lessons.map(value=>value.id)).size,12);
 for(const lesson of lessons){const source=readFileSync(lesson.file,'utf8');assert.ok(source.includes(lesson.anchor),lesson.file+' / '+lesson.anchor);assert.ok(lesson.answer.length);assert.ok(lesson.correct>=0&&lesson.correct<lesson.options.length);for(const field of ['title','goal','why','simple','transfer','task','hint','prediction','outcome','question'] as const){assert.equal(lesson[field].length,3);assert.ok(lesson[field].every(value=>value.trim().length>3),lesson.id+' '+field);}}
});
test('roadmap, project solutions and seventeen capstone steps reuse real course modules',()=>{
 assert.equal(roadmap.length,11);assert.equal(finalSteps.length,17);assert.equal(projects.length,5);
 for(const id of [...roadmap.map(item=>item.module),...finalSteps.map(item=>item[1]),...lessons.map(item=>item.module)])for(const lang of ['fr','en','ar'])assert.ok(existsSync(`app/admin/how-it-was-built/course/content/${lang}/${id}.json`),id);
 for(const project of projects){const module=JSON.parse(readFileSync(`app/admin/how-it-was-built/course/content/fr/${project.module}.json`,'utf8'));assert.ok(module.lessons.some((lesson:{id:string})=>lesson.id===project.lesson),project.id);}
 for(const flow of flows)for(const step of flow.steps)assert.ok(readFileSync(step.file,'utf8').includes(step.anchor),step.file+' '+step.anchor);
});
test('progress rejects unknown lessons and invalid scores while keeping independent milestones',()=>{
 const ids=lessons.map(item=>item.id);const result=readProgress({current:'missing',completed:['web','web','missing'],quizzes:{web:2,state:9,missing:1},exercises:['web'],struggles:['state'],projects:['landing:0','landing'],days:['2026-10-04','bad']},ids);
 assert.equal(result.current,'web');assert.deepEqual(result.completed,['web']);assert.deepEqual(result.quizzes,{web:2});assert.deepEqual(result.projects,['landing:0','landing']);assert.deepEqual(result.days,['2026-10-04']);assert.deepEqual(readProgress(null,ids).completed,[]);
});
test('streak uses local dates and allows yesterday until today is completed',()=>{
 const now=new Date(2026,9,4,12);assert.equal(dayKey(now),'2026-10-04');assert.equal(streak(['2026-10-02','2026-10-03'],now),2);assert.equal(streak(['2026-10-01'],now),0);
});
test('practice parser supports data edits and rejects executable or malformed input',()=>{
 assert.deepEqual(runPlayground('const title = "Hotel";\nconst price = 120;\nconst quantity = 3;'),{title:'Hotel',price:120,quantity:3});
 for(const source of ['fetch("/api/orders", {method:"POST"})','window.location="https://example.com"','const title = "A";const price = 20;const quantity = 0;','const title = "A";const price = 20;const quantity = 1;alert(1)'])assert.equal(runPlayground(source),null);
});

test('project notes survive reloads, upgrade old progress and bound untrusted storage',()=>{
 const ids=lessons.map(item=>item.id);
 const before=readProgress({notes:{landing:'I built a reusable card',catalog:'x'.repeat(2500),bad:42}},ids);
 const after=readProgress(JSON.parse(JSON.stringify(before)),ids);
 assert.equal(after.notes.landing,'I built a reusable card');
 assert.equal(after.notes.catalog.length,2000);
 assert.equal(after.notes.bad,undefined);
 assert.deepEqual(readProgress({completed:['web']},ids).notes,{});
 assert.equal(readProgress({notes:null},ids).current,ids[0]);
});
