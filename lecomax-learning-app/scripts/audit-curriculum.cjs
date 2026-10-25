const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./inspect.cjs');
const { library } = load('lecomax-learning-app/services/course-library.ts');
const { getLesson } = load('lecomax-learning-app/services/content.ts');
const { coursePrograms } = load('lecomax-learning-app/constants/course-programs.ts');
const audit = library.map(course => {
  const issues = [];
  const lessons = course.lessons.map(entry => {
    const lesson = getLesson(entry.id, 'en');
    if (!lesson) { issues.push({id:entry.id, issue:'missing lesson'}); return {id:entry.id}; }
    const words = lesson.explanation.map(b => b.text || '').join(' ').split(/\s+/).filter(Boolean).length;
    if (!lesson.quiz.length) issues.push({id:entry.id, issue:'no quiz; inspect whether reference-only'});
    if (!lesson.exercise.task || !lesson.exercise.solution) issues.push({id:entry.id, issue:'missing practice or worked solution'});
    if (words < 100 && !lesson.academy && !lesson.websiteLesson) issues.push({id:entry.id, issue:'short exposition; manual pedagogical review required'});
    return {id:entry.id, words, questions:lesson.quiz.length, rubric:!!lesson.curriculum, language:lesson.contentLanguage || lesson.language};
  });
  return {id:course.id, title:course.title[1], modules:course.modules, brief:!!coursePrograms[course.id], lessons:lessons.length, workloadMinutes:course.lessons.reduce((sum,l)=>sum+l.minutes,0), issues, inventory:lessons};
});
const output = path.resolve(__dirname,'../artifacts/curriculum-inventory.json');
fs.writeFileSync(output, JSON.stringify({generatedAt:new Date().toISOString(), note:'Structural flags are review prompts, not automatic quality scores or factual verification.', courses:audit},null,2)+'\n');
console.log(JSON.stringify(audit.map(({id,lessons,issues,workloadMinutes})=>({id,lessons,reviewFlags:issues.length,workloadMinutes})),null,2));
