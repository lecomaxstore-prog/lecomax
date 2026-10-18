import { readProfile, type LearnerProfile } from '../lecomax-learning-app/utils/academy';
export type LearningContext = { lastLesson: string; assessedQuestions: number; dueQuestions: number; recent: { lessonId: string; questionId: string; correct: boolean; independent: boolean; at: number }[] };
export const MOBILE_TEACHER_MODES=['simple','lines','debug','teach','exercise','quiz','project','feature','study-plan'] as const;
export const MOBILE_TEACHER_TOPICS=['nextjs','react','javascript','typescript','python','api','database','deployment','general'] as const;
export type MobileTeacherInput={profile?:LearnerProfile;learning?:LearningContext;message:string;language:'ar'|'en'|'fr';mode:typeof MOBILE_TEACHER_MODES[number];file?:string;topic?:typeof MOBILE_TEACHER_TOPICS[number];level?:'beginner'|'intermediate'|'advanced';lesson?:{title:string;concept:string};history:{role:'user'|'assistant';content:string}[]};
export function validateMobileTeacher(value:unknown):MobileTeacherInput|null {
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;
 let profile:LearnerProfile|undefined;
 if(v.profile!==undefined){try{profile=readProfile(v.profile);}catch{return null;}}
 if(typeof v.message!=='string'||!v.message.trim()||v.message.length>6000||!['ar','en','fr'].includes(String(v.language))||!MOBILE_TEACHER_MODES.includes(v.mode as MobileTeacherInput['mode']))return null;
 if(v.file!==undefined&&(typeof v.file!=='string'||v.file.length>300||! /^(app|lib|components)\/[\w/.[\]-]+\.(tsx?|jsx?)$/.test(v.file)||v.file.includes('..')))return null;
 if(v.history!==undefined&&(!Array.isArray(v.history)||v.history.length>8||v.history.some(h=>!h||!['user','assistant'].includes(h.role)||typeof h.content!=='string'||h.content.length>8000)))return null;
 if(v.topic!==undefined&&!MOBILE_TEACHER_TOPICS.includes(v.topic as NonNullable<MobileTeacherInput['topic']>))return null;
 if(v.level!==undefined&&!['beginner','intermediate','advanced'].includes(String(v.level)))return null;
 if(v.lesson!==undefined){const l=v.lesson as Record<string,unknown>|null;if(!l||typeof l!=='object'||typeof l.title!=='string'||l.title.length>200||typeof l.concept!=='string'||l.concept.length>1600)return null;}
 if(v.learning!==undefined){
  const l=v.learning as LearningContext;
  const count=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=1000000;
  if(!l||typeof l!=='object'||typeof l.lastLesson!=='string'||l.lastLesson.length>500||!count(l.assessedQuestions)||!count(l.dueQuestions)||l.dueQuestions>l.assessedQuestions||!Array.isArray(l.recent)||l.recent.length>12)return null;
  if(l.recent.some(e=>!e||typeof e.lessonId!=='string'||e.lessonId.length>500||typeof e.questionId!=='string'||e.questionId.length>500||typeof e.correct!=='boolean'||typeof e.independent!=='boolean'||!Number.isSafeInteger(e.at)||e.at<0))return null;
 }
 return {profile,learning:v.learning===undefined?undefined:{lastLesson:(v.learning as LearningContext).lastLesson,assessedQuestions:(v.learning as LearningContext).assessedQuestions,dueQuestions:(v.learning as LearningContext).dueQuestions,recent:(v.learning as LearningContext).recent.map(e=>({lessonId:e.lessonId,questionId:e.questionId,correct:e.correct,independent:e.independent,at:e.at}))},message:v.message.trim(),language:v.language as MobileTeacherInput['language'],mode:v.mode as MobileTeacherInput['mode'],file:v.file as string|undefined,topic:v.topic as MobileTeacherInput['topic'],level:v.level as MobileTeacherInput['level'],lesson:v.lesson as MobileTeacherInput['lesson'],history:(v.history||[]) as MobileTeacherInput['history']};
}
