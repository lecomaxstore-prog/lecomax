export type Copy = { en:string; fr:string; ar:string };
export type ExerciseKind = 'order' | 'number' | 'json' | 'prompt' | 'retrieve' | 'agent';
export type Exercise = { kind:ExerciseKind; instruction:string; starter:string; solution:string; hint:string; expected?:unknown; fields?:Record<string,string>; };
export type Question = { prompt:string; choices:string[]; answer:number; feedback:string[] };
export type Lesson = {
  id:string; path:number; title:Copy; summary:Copy; prerequisites:string[]; topics:string[];
  objectives:string[]; beginner:string; technical:string; example:string; diagram:string[];
  demo:'timeline'|'neuron'|'vectors'|'prompt'|'retrieval'|'agent'|'pipeline';
  tutorial:string[]; exercise:Exercise; quiz:Question[]; review:string;
  references:string[]; versionSensitive:boolean;
};
export type Reference = {title:string;url:string;checked:string;scope:string};
export const copy=(en:string,fr:string,ar:string):Copy=>({en,fr,ar});
