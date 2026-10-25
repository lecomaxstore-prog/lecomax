import {useState} from 'react';
import {Linking} from 'react-native';
import {router,type Href,useLocalSearchParams} from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {Button,Card,Field,Label,Page,Row} from '../../components/UI';
import {lessons} from './curriculum';
import {references} from './references';
import {checkExercise,recordAnswer,recordPractice,saveProject,status} from './engine';
import {useUniversity} from './useUniversity';
import {Demonstration} from './Demonstration';
import type {Lesson} from './schema';
export default function LessonScreen(){
 const {id}=useLocalSearchParams<{id:string}>();const l=lessons.find(l=>l.id===id);
 const {t}=useUniversity();
 return l?<LessonBody key={l.id} lesson={l}/>:<Page title={t('Leçon introuvable','Lesson not found','الدرس غير موجود')}><Button title="AI University" onPress={()=>router.replace('/ai-university' as Href)}/></Page>;
}
function LessonBody({lesson:l}:{lesson:Lesson}){
 const u=useUniversity(),{data,change,state,t,saveStatus,corrupt,retry}=u;
 const [mode,setMode]=useState('quick'),[input,setInput]=useState(data.drafts[l.id]??l.exercise.starter),[feedback,setFeedback]=useState(''),[choices,setChoices]=useState<Record<number,number>>({}),[submitted,setSubmitted]=useState<Record<number,boolean>>({}),[hint,setHint]=useState(false),[message,setMessage]=useState('');
 const run=()=>{const result=checkExercise(l.exercise,input);change(s=>recordPractice(s,l,input));setFeedback(result.feedback);};
 const translated=state.language!=='en';
 const title=l.title[state.language];
 return <Page title={title} subtitle={l.summary[state.language]}>
  <Button quiet title={t('Tous les parcours','All paths','كل المسارات')} onPress={()=>router.push('/ai-university' as Href)}/>
  {corrupt?<Card><Label accessibilityRole="alert">Saved university data could not be read. It has not been overwritten. Restore a valid backup before recording progress.</Label></Card>:<Label muted>{t('Sauvegarde','Storage','الحفظ')}: {saveStatus} · {status(data,l)}{saveStatus==='error'&&<Button title="Retry save" onPress={retry}/>}</Label>}
  {translated&&<Label muted>{t('Titres et résumés traduits. Le contenu technique détaillé de cette édition est en anglais ; le tuteur peut expliquer dans votre langue.','', 'العناوين والملخصات مترجمة. المحتوى التقني المفصل لهذه النسخة بالإنجليزية؛ يمكن للمعلّم شرحه بلغتك.')}</Label>}
  <Card><Label bold>{t('Objectifs','Learning objectives','أهداف التعلم')}</Label>{l.objectives.map(v=><Label key={v}>• {v}</Label>)}<Label bold>{t('Prérequis recommandés','Recommended prerequisites','المتطلبات المقترحة')}</Label>{!l.prerequisites.length?<Label>{t('Aucun : commencez ici.','None: start here.','لا يوجد: ابدأ هنا.')}</Label>:l.prerequisites.map(id=>{const pre=lessons.find(x=>x.id===id)!;return <Button quiet key={id} title={`${pre.title[state.language]} · ${status(data,pre)}`} onPress={()=>router.push(`/ai-university/${id}` as Href)}/>;})}</Card>
  <Row>{[['quick',t('En 5 minutes','Learn in 5 Minutes','تعلّم في 5 دقائق')],['deep',t('Approfondir','Deep Dive','تعمّق')],['guided',t('Tutoriel guidé','Guided Tutorial','درس موجّه')],['challenge',t('Défi','Challenge Me','تحدّني')]].map(([id,label])=><Button key={id} quiet selected={mode===id} title={label!} onPress={()=>setMode(id!)}/>)}</Row>
  <Button quiet title={t('Demander au tuteur IA','Ask AI Tutor','اسأل المعلّم الذكي')} onPress={()=>router.push({pathname:'/teacher',params:{question:`Explain this AI University topic in ${state.language}: ${l.title.en}. Start with a hint and one check-for-understanding question. Do not claim I completed it. Topic context: ${l.beginner}\nSource references: ${l.references.map(id=>references[id]?.url).join(' ')}`}})}/>
  <Label muted>{t('Le tuteur envoie la demande au service IA configuré lorsque vous la soumettez.','The tutor uses the configured AI service when you submit the request.','يستخدم المعلّم خدمة الذكاء الاصطناعي المضبوطة عند إرسال الطلب.')}</Label>
  {mode!=='challenge'&&<Card><Label bold>{t('Comprendre simplement','Beginner explanation','شرح مبسّط')}</Label><Label style={{writingDirection:'ltr',textAlign:'left'}}>{l.beginner}</Label></Card>}
  {mode==='deep'&&<><Card><Label bold>Technical explanation</Label><Label style={{writingDirection:'ltr',textAlign:'left'}}>{l.technical}</Label></Card><Card><Label bold>Real-world example</Label><Label selectable style={{writingDirection:'ltr',textAlign:'left'}}>{l.example}</Label></Card></>}
  {mode!=='challenge'&&<Demonstration key={l.id+mode} lesson={l}/>}
  {mode==='guided'&&<Card><Label bold>Guided tutorial</Label>{l.tutorial.map((step,i)=><Label key={step}>{i+1}. {step}</Label>)}<Label selectable>{l.example}</Label></Card>}
  <Card><Label bold size={22}>{t('À vous de jouer','Your mini project','مشروعك الصغير')}</Label><Label>{l.exercise.instruction}</Label><Field accessibilityLabel="Exercise answer" placeholder="Exercise answer" value={input} multiline onChangeText={v=>{setInput(v);setFeedback('');}} maxLength={20000}/><Row><Button title={t('Vérifier mon travail','Check my work','تحقّق من عملي')} disabled={corrupt} onPress={run}/><Button quiet title={t('Indice','Hint','تلميح')} onPress={()=>setHint(true)}/><Button quiet title={t('Enregistrer le brouillon','Save draft','احفظ المسودة')} disabled={corrupt} onPress={()=>{change(s=>({...s,drafts:{...s.drafts,[l.id]:input}}));setMessage('Draft queued for saving. Check the storage status above.');}}/></Row>{hint&&<Label>{l.exercise.hint}</Label>}{!!feedback&&<Label accessibilityLiveRegion="polite">{feedback}</Label>}
   {l.path===3&&<><Button quiet title="Copy Python example" onPress={()=>void Clipboard.setStringAsync(l.example).then(()=>setMessage('Example copied. Paste and run it in Python Studio.')).catch(()=>setMessage('Clipboard unavailable. Select the example text to copy it.'))}/><Button quiet title="Open Python Studio" onPress={()=>router.push({pathname:'/terminal',params:{runtime:'python'}})}/></>}
   <Button quiet title={t('Enregistrer dans le portfolio','Save to portfolio','احفظ في معرض المشاريع')} disabled={corrupt||!input.trim()} onPress={()=>{try{change(s=>saveProject(s,{id:`lesson-${l.id}`,lessonId:l.id,title:l.title.en,artifact:input,updatedAt:Date.now(),checked:false}));setMessage('Portfolio entry updated. Its check result describes this exercise only, not production readiness.');}catch{setMessage('Could not save project. Check its size and the storage status.');}}}/>
  </Card>
  <Card><Label bold size={22}>{t('Vérifier la compréhension','Check understanding','اختبر فهمك')}</Label>{l.quiz.map((q,i)=><Card key={q.prompt}><Label bold>{q.prompt}</Label>{q.choices.map((option,c)=><Button key={option} quiet selected={choices[i]===c} disabled={!!submitted[i]} title={option} onPress={()=>setChoices(v=>({...v,[i]:c}))}/>)}<Button title={`${t('Répondre','Submit answer','أرسل الإجابة')} ${i+1}`} disabled={corrupt||choices[i]===undefined||!!submitted[i]} onPress={()=>{change(s=>recordAnswer(s,l.id,i,choices[i]!,'quiz'));setSubmitted(v=>({...v,[i]:true}));}}/>{submitted[i]&&<><Label accessibilityLiveRegion="polite">{q.feedback[choices[i]!]}</Label><Button quiet title="Try again" onPress={()=>{setSubmitted(v=>({...v,[i]:false}));setChoices(v=>{const next={...v};delete next[i];return next;});}}/></>}</Card>)}</Card>
  <Card><Label bold>Concise review</Label><Label>{l.review}</Label><Label muted>Reading does not complete a lesson. Successful exercise + quiz means practiced; correct delayed reviews provide retention evidence. Two review cards become due one day after your first quiz attempts.</Label></Card>
  <Card><Label bold>{t('Références fiables','Trusted references','مراجع موثوقة')}</Label>{l.references.map(id=>{const r=references[id]!;return <Card key={id}><Button quiet title={r.title} onPress={()=>void Linking.openURL(r.url).catch(()=>setMessage('Could not open reference. Please retry.'))}/><Label muted>Checked {r.checked}. {r.scope}</Label></Card>;})}{l.versionSensitive&&<Label>Version-sensitive lesson: verify current API and SDK documentation before deploying. This course does not promise model availability or fixed prices.</Label>}</Card>
  {!!message&&<Label accessibilityLiveRegion="polite">{message}</Label>}
 </Page>;
}
