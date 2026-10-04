"use client";
import { useEffect, useState } from 'react';
import type { CourseLanguage } from '../course/types';
import type { SourceConnections } from '@/lib/source-connections';
import { describeSourceFile } from '@/lib/source-code-guide';
import CodeExplanation from '../CodeExplanation';
import { text, type Text } from './types';
import styles from './Learning.module.css';
export const projectFiles = ['app/page.tsx','app/layout.tsx','app/boutique/page.tsx','app/produit/[slug]/page.tsx','components/ProductCard.tsx','components/Header.tsx','components/CartContext.tsx','app/panier/page.tsx','app/checkout/page.tsx','app/api/orders/route.ts','app/admin/orders/page.tsx','lib/products.ts','lib/db-server.ts','lib/supabase-server.ts','lib/admin-session.ts','middleware.ts','app/globals.css','package.json'];
export default function FileCoach({ lang, file, anchor = '', compact = false }: {lang:CourseLanguage;file:string;anchor?:string;compact?:boolean}) {
  const t=(value:Text)=>text(value,lang);
  const [path,setPath]=useState(file); const [source,setSource]=useState(''); const [connections,setConnections]=useState<SourceConnections>(); const [line,setLine]=useState(1); const [mode,setMode]=useState<'simple'|'normal'|'technical'>('simple'); const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading'); const [retry,setRetry]=useState(0);
  useEffect(()=>{setPath(file);},[file]);
  useEffect(()=>{
    const controller=new AbortController(); setStatus('loading');setSource('');setConnections(undefined);
    fetch(`/api/dev-docs/content?path=${encodeURIComponent(path)}&connections=1`,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw Error(String(response.status));const data=await response.json();if(typeof data.content!=='string')throw Error('content');if(controller.signal.aborted)return;setSource(data.content);setConnections(data.connections);setLine(Math.max(1,data.content.split('\n').findIndex((value:string)=>anchor&&value.includes(anchor))+1));setStatus('ready');}).catch(()=>{if(!controller.signal.aborted)setStatus('error');});
    return ()=>controller.abort();
  },[path,anchor,retry]);
  const lines=source.split('\n'); const start=Math.max(0,line-1); const excerpt=lines.slice(start,start+7);
  return <section className={styles.source} aria-label={t(['Explique-moi mon code','Explain my code','اشرح كودي'])}>
    {!compact&&<><h3>{t(['Explique-moi mon code','Explain my code','اشرح كودي'])}</h3><label>{t(['Choisir un vrai fichier','Choose a real file','اختر ملفا حقيقيا'])}<select value={path} onChange={event=>setPath(event.target.value)}>{[...new Set([path,...projectFiles])].map(value=><option key={value}>{value}</option>)}</select></label><a href="#files">{t(['Ouvrir tous les fichiers du projet','Open all project files','فتح جميع ملفات المشروع'])} →</a></>}
    <p className={styles.path} dir="ltr">{path}</p><p>{describeSourceFile(path,lang)}</p>
    <div className={styles.actions} aria-label={t(['Détail de l’explication','Explanation detail','مستوى الشرح'])}>{(['simple','normal','technical'] as const).map((value,index)=><button key={value} aria-pressed={mode===value} onClick={()=>setMode(value)}>{t([['Simple','Simple','بسيط'],['Normal','Normal','متوسط'],['Technique','Technical','تقني']][index] as Text)}</button>)}</div>
    {status==='loading'?<p role="status">{t(['Lecture du vrai fichier…','Reading the real file…','قراءة الملف الحقيقي…'])}</p>:status==='error'?<div role="alert"><p>{t(['Impossible de lire le fichier. Vérifie ta connexion et le déverrouillage de l’atelier.','Unable to read this file. Check your connection and workshop access.','تعذرت قراءة الملف. تحقق من الاتصال وصلاحية الورشة.'])}</p><button onClick={()=>setRetry(value=>value+1)}>{t(['Réessayer','Retry','أعد المحاولة'])}</button></div>:<>
      <pre dir="ltr" tabIndex={0} aria-label={path}><code>{(mode==='technical'?lines:excerpt).map((value,index)=><span key={index} className={(mode==='technical'?index+1:start+index+1)===line?styles.highlight:undefined}>{String(mode==='technical'?index+1:start+index+1).padStart(3)}  {value}{'\n'}</span>)}</code></pre>
      <p className={styles.muted}>{t(['Extrait réel, en lecture seule. Touche « Normal » pour l’explication ligne par ligne.','Real source, read-only. Choose Normal for line-by-line explanations.','مقتطف حقيقي للقراءة فقط. اختر متوسطا لشرح الأسطر.'])}</p>
      {mode!=='simple'&&<CodeExplanation path={path} lines={lines} line={line} lang={lang} onLineChange={setLine}/>}
      <details><summary>{t(['Pourquoi ce fichier ? Entrées, sorties et connexions','Why this file? Inputs, outputs and connections','لماذا هذا الملف؟ المدخلات والمخرجات والروابط'])}</summary>
        <p>{t(['Un import apporte un outil. Une prop ou un paramètre apporte des données. return rend le résultat : interface pour un composant, réponse pour une API. Lis la signature et le return avant de modifier une fonction.','An import brings a tool; a prop or parameter brings data. return provides the result: UI for a component, a response for an API. Read the signature and return before editing.','يوفر import أداة وتوفر prop أو المعامل بيانات. يعيد return النتيجة: واجهة للمكون أو ردا لـAPI. اقرأ المدخلات والنتيجة قبل التعديل.'])}</p>
        <h4>{t(['Fonctions repérées dans le texte','Functions found in the source','الدوال الموجودة في النص'])}</h4><ul>{[...source.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g)].slice(0,8).map((match,index)=><li key={index}><code>{match[1]}</code></li>)}</ul>
        <h4>{t(['Fichiers et données liés (analyse statique)','Connected files and data (static analysis)','الملفات والبيانات المرتبطة (تحليل ثابت)'])}</h4>
        {connections?.items.length?<ul>{connections.items.slice(0,16).map((item,index)=><li key={index}><span>{item.kind} · </span>{item.target?<button onClick={()=>setPath(item.target!)}>{item.target}</button>:<code>{item.name}</code>}</li>)}</ul>:<p>{t(['Aucune connexion reconnue dans cet extrait. Cela ne prouve pas l’absence de liens à l’exécution.','No connections recognized here. This does not prove there are no runtime connections.','لم يتعرف التحليل على روابط هنا؛ قد توجد روابط أثناء التشغيل.'])}</p>}
        <p>{t(['Si tu supprimes ce fichier, ses imports et sa route éventuelle peuvent échouer. Fais les essais dans une copie locale, vérifie ses usages puis lance les tests et le build.','Deleting this file can break its imports and route. Experiment in a local copy, check its usages, then run tests and the build.','قد تحذف الملف فتتعطل استيراداته ومساره. جرب في نسخة محلية وافحص الاستخدامات ثم الاختبارات والبناء.'])}</p>
      </details>
    </>}
  </section>;
}
