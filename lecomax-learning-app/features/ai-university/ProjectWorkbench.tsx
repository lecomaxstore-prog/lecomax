import {useEffect,useRef,useState} from 'react';
import {router,type Href} from 'expo-router';
import {Button,Card,Field,Label,Row} from '../../components/UI';
import {auth,API} from '../../services/auth';
import {chunkDocument,retrieve} from './retrieval';
import {validateQA,readQADraft} from './project-contract';
import {useUniversity} from './useUniversity';
export function ProjectWorkbench(){
 const {data,change,corrupt}=useUniversity();
 const saved=data.projects.find(p=>p.id==='document-qa');
 const draft=readQADraft(saved?.artifact);
 const [question,setQuestion]=useState(draft?.question||'What is the returns window?'),[document,setDocument]=useState(draft?.document||'Returns are accepted within 14 days with a receipt. Shipping takes 3 business days.'),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[answer,setAnswer]=useState(''),[sources,setSources]=useState<ReturnType<typeof retrieve>>([]),[error,setError]=useState(''),[mode,setMode]=useState('');
 const pending=useRef<AbortController|null>(null);
 useEffect(()=>()=>pending.current?.abort(),[]);
 const clear=()=>{pending.current?.abort();setSources([]);setAnswer('');setMode('');setConsent(false);setError('');};
 const local=()=>{try{setSources(retrieve(question,chunkDocument(document)));setAnswer('');setMode('Local lexical retrieval only; no language model was called.');setError('');}catch{setError('Enter a document up to 12,000 characters and a question up to 500 characters.');}};
 const live=async()=>{
  const payload=validateQA({question,document,consent});if(!payload){setError('Enter a question and document, then opt in to sending this content.');return;}
  const controller=new AbortController();pending.current=controller;setBusy(true);setError('');setAnswer('');setSources([]);setMode('');
  const timeout=setTimeout(()=>controller.abort(),25000);
  try{const token=await auth.token();if(!token)throw Error('OWNER_LOGIN_REQUIRED');
   const response=await fetch(API+'/api/learning-mobile/ai-university',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload),signal:controller.signal});
   const result=await response.json();if(!response.ok)throw Error(response.status===429?'RATE_LIMIT':result.error||'AI_PROJECT_UNAVAILABLE');
   if(controller.signal.aborted)return;
   if(typeof result.answer!=='string'||!Array.isArray(result.sources))throw Error('INVALID_RESPONSE');
   setAnswer(result.answer);setSources(result.sources);setMode(result.mode==='live'?'Live provider response. Verify its claims against the passages below.':'No evidence: no model call was made.');
  }catch(e){if(pending.current===controller)setError(controller.signal.aborted?'Request cancelled or timed out. No completed result is claimed.':e instanceof Error?e.message:'AI_PROJECT_UNAVAILABLE');}
  finally{clearTimeout(timeout);if(pending.current===controller){pending.current=null;setBusy(false);}}
 };
 return <>
  {saved&&!draft&&<Label accessibilityRole="alert">The saved Q&A artifact is not a valid question/document pair. It remains in your portfolio; sample inputs are shown below.</Label>}
  <Card><Label bold size={24}>Project 1 · Document Q&A</Label><Label>A working retrieval baseline plus an optional authenticated backend request. The local search uses word overlap/cosine, not learned embeddings. It intentionally exposes synonym and relevance limits.</Label><Label muted>Provider mode requires the new backend route to be available, valid owner authentication and server-side OPENAI_API_KEY / model configuration. No key belongs in this screen. Live generation may incur provider charges.</Label>
   <Field accessibilityLabel="Q&A document" placeholder="Q&A document" multiline value={document} maxLength={12000} editable={!busy} onChangeText={v=>{clear();setDocument(v);}}/>
   <Field accessibilityLabel="Q&A question" placeholder="Q&A question" value={question} maxLength={500} editable={!busy} onChangeText={v=>{clear();setQuestion(v);}}/>
   <Row><Button title="Run local retrieval" disabled={busy} onPress={local}/><Button quiet title="Save Q&A project" disabled={corrupt||busy||!document.trim()||!question.trim()} onPress={()=>{change(s=>({...s,projects:[...s.projects.filter(p=>p.id!=='document-qa'),{id:'document-qa',lessonId:'rag-search',title:'Document Q&A',artifact:JSON.stringify({question,document},null,2),updatedAt:Date.now(),checked:false}]}));setMode('Project queued for local saving. This is a project draft, not a deployment certificate.');}}/></Row>
   <Button quiet title={consent?'Sending permission enabled — turn off':'Allow this question and document to be sent to the configured AI provider'} selected={consent} disabled={busy} onPress={()=>setConsent(v=>!v)}/><Label muted>Use public or synthetic material. Do not paste credentials, patient information or private customer data. Consent applies to the current inputs and resets when they change.</Label>
   <Button title="Ask live AI using these sources" disabled={!consent||busy} onPress={()=>void live()}/>{busy&&<Button quiet title="Cancel request" onPress={()=>pending.current?.abort()}/>}
   {!!mode&&<Label accessibilityLiveRegion="polite">{mode}</Label>}{!!answer&&<Label selectable>{answer}</Label>}{!!error&&<Label accessibilityRole="alert">{error}</Label>}
   {sources.map(source=><Card key={source.id}><Label bold>{source.id} · retrieval score {source.score.toFixed(3)}</Label><Label selectable>{source.text}</Label></Card>)}{mode.startsWith('Local')&&!sources.length&&<Label>No matching evidence. Try words present in the document; do not invent an answer.</Label>}
  </Card>
  <Card><Label bold>Project 2 · Bounded agent</Label><Label>Build and test a calculator or study-notes workflow in the existing Agent Studio. Its tool execution is local and deterministic; it is explicitly not an autonomous production agent.</Label><Button title="Open Agent Studio" onPress={()=>router.push('/agent-studio' as Href)}/></Card>
  <Card><Label bold>Project 3 · Python data pipeline</Label><Label>Create a function that accepts a list of numeric scores, rejects empty input, and returns the mean. Add tests for [2,4,6], a single number and invalid data. Use the Python foundations lesson for a runnable starter and save your code in the portfolio.</Label><Button title="Open Python foundations" onPress={()=>router.push('/ai-university/python-data' as Href)}/></Card>
  <Card><Label bold>Inspect and deploy deliberately</Label><Label>The project uses app/api/learning-mobile/ai-university/route.ts, project-contract.ts and retrieval.ts. Study the server’s authentication, rate limit, bounded body, secret checks, timeout and source-ID validation. Run the included tests, configure secrets only on the server, deploy to staging, check live failures and costs, then choose whether to release. A citation ID check does not prove factual entailment. This module does not deploy anything for you.</Label></Card>
 </>;
}
