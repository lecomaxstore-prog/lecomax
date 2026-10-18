export type QAInput={question:string;document:string;consent:true};
export function validateQA(value:unknown):QAInput|null {
 const v=value as QAInput;
 if(!v||typeof v!=='object'||v.consent!==true||typeof v.question!=='string'||!v.question.trim()||v.question.length>500||typeof v.document!=='string'||!v.document.trim()||v.document.length>12000)return null;
 return {question:v.question.trim(),document:v.document,consent:true};
}
export function parseGroundedAnswer(raw:string,sourceIds:string[]) {
 const v=JSON.parse(raw) as {answer:string;sourceIds:string[]};
 if(!v||typeof v.answer!=='string'||!v.answer.trim()||v.answer.length>6000||!Array.isArray(v.sourceIds)||!v.sourceIds.length||v.sourceIds.some(id=>typeof id!=='string'||!sourceIds.includes(id)))throw Error('UNSUPPORTED_ANSWER');
 return {answer:v.answer,sourceIds:[...new Set(v.sourceIds)]};
}

// Editable portfolio text must be validated before restoring input values.
export function readQADraft(artifact?:string):{question:string;document:string}|null {
 try {
  const value=JSON.parse(artifact||'null');
  const parsed=validateQA({...value,consent:true});
  return parsed?{question:parsed.question,document:parsed.document}:null;
 } catch {return null;}
}
