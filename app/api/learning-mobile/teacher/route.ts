import {NextRequest} from 'next/server';
import {readJsonLimited} from '@/lib/request-body';
import {mobileOwner,mobileJson} from '@/lib/learning-mobile-auth';
import {validateMobileTeacher} from '@/lib/learning-mobile-validation';
import {sensitiveRateLimit} from '@/lib/sensitive-rate-limit';
import {assertTutorContentSafe} from '@/lib/ai-tutor-security';
import {getLearningSourceContext} from '@/lib/learning-source-context';
import {tutorSourcePaths} from '@/lib/ai-tutor-course';
import {streamTutorReply} from '@/lib/ai-tutor-provider';
import {mobileTeacherInstructions} from '@/lib/mobile-teacher-prompt';
export const maxDuration=90;
export async function POST(req:NextRequest){
 const owner=await mobileOwner(req);if(!owner)return mobileJson({error:'OWNER_LOGIN_REQUIRED'},401);
 const limited=await sensitiveRateLimit(req,'learning-mobile-teacher',owner,true);if(limited)return limited;
 const input=validateMobileTeacher(await readJsonLimited(req,80000).catch(()=>null));if(!input)return mobileJson({error:'INVALID_INPUT'},400);
 try{
  assertTutorContentSafe(JSON.stringify(input));
  const topic=input.topic==='python'||input.topic==='general'||!input.topic?'foundations':input.topic;
  const paths=input.file?[input.file]:tutorSourcePaths(input.message,topic,input.mode).slice(0,2);
  const contexts=await Promise.all(paths.map(p=>getLearningSourceContext(p)));
  const context=contexts.map(c=>c.text).join('\n').slice(0,18000);assertTutorContentSafe(context);
  const instructions=mobileTeacherInstructions(input,context);
  const model=process.env.OPENAI_TEACHER_MODEL?.trim()||'gpt-6-astra';
  const stream=await streamTutorReply(instructions,[...input.history,{role:'user',content:input.message}],AbortSignal.any([req.signal,AbortSignal.timeout(75000)]),{model,reasoning:'medium',maxOutputTokens:8000});
  let answer='',completed=false,actualModel=model;for await(const event of stream){if(event.type==='response.output_text.delta')answer+=event.delta;if(answer.length>30000)throw new Error('RESPONSE_TOO_LARGE');if(event.type==='response.completed'){completed=true;actualModel=event.response.model;}if(event.type==='response.failed'||event.type==='response.incomplete'||event.type==='error')throw new Error('PROVIDER_FAILED');}
  if(!completed||!answer.trim())throw new Error('EMPTY_RESPONSE');assertTutorContentSafe(answer);
  return mobileJson({answer,model:actualModel,sources:contexts.flatMap(c=>c.sources)});
 }catch(error){const code=error instanceof Error?error.message:'';return mobileJson({error:code==='SENSITIVE_CONTENT'?'SENSITIVE_CONTENT':code==='SOURCE_UNAVAILABLE'||code==='INVALID_SOURCE'?'SOURCE_UNAVAILABLE':'TEACHER_UNAVAILABLE'},code==='SENSITIVE_CONTENT'?400:503);}
}
