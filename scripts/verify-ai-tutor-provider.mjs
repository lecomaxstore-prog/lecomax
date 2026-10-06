// Explicit live provider check; no conversation or learning progress is written.
import { streamTutorReply } from '../lib/ai-tutor-provider.ts';
import { tutorInstructions } from '../lib/ai-tutor-prompt.ts';
try {
  const stream = await streamTutorReply(tutorInstructions('explain','api'), [{role:'user',content:'اشرح await في ثلاثة أسطر قصيرة فقط، بمثال صغير جدًا ثم سؤال واحد.'}], AbortSignal.timeout(75000));
  let text='', completed=false, deltas=0;
  for await (const event of stream) {
    if(event.type==='response.output_text.delta'){text+=event.delta;deltas++;}
    if(event.type==='response.completed')completed=event.response.status==='completed';
  }
  if(!completed||!/[\u0600-\u06ff]/.test(text)||deltas<1)throw Error('INCOMPLETE_RESPONSE');
  console.log(JSON.stringify({connection:'PASS',streaming:'PASS',arabic:'PASS',characters:text.length,deltas}));
} catch(error) {
  console.error(JSON.stringify({connection:'FAILED',status:error?.status||null,code:error?.code||'UNAVAILABLE'}));
  process.exitCode=1;
}
