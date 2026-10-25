"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SeoDocument } from "@/lib/seo-engine";
import styles from "./seo.module.css";
import EditorialReview from "./EditorialReview";

type Localized = { title: string; description: string; keywords: string[]; productDescription?: string };
type Job = { id: string; tier: string; state: string; provider: string; result: { fr: Localized; ar: Localized; editorialVersion?: number; evidence?: { locale: string; claim: string; sourceQuote: string }[] } | null; approved: boolean; paid_authorized?: boolean; source_current?:boolean; payload?:{name:string;description?:string;brand?:string;model?:string}; reviews?:{id:string;decision:string;actor:string;created_at:string;notes:string;document_version:number}[] };
type Usage = { enabled: boolean; monthlyLimit: number; lifetimeLimit?: number; lifetimeCommitted?: number; miraiEnabled: boolean; month: string; estimatedUsd: number; reservedUsd: number; inputTokens: number; outputTokens: number; uncertain: number; pending: number; jobs: Job[]; canManageBudget: boolean };
const ceilings: Record<string, number> = { routine: 0.01, advanced: 0.10, "editorial-luna": 0.01, "editorial-sol": 0.05, premium: 0.20 };
export default function SeoAiControl({ document, onApproved }: { document?: SeoDocument; onApproved: () => void }) {
  // A new entity/version must never inherit another selection's jobs or budget form.
  return <SeoAiSelection key={JSON.stringify([document?.kind, document?.entity_id, document?.version])} document={document} onApproved={onApproved}/>;
}
function SeoAiSelection({ document, onApproved }: { document?: SeoDocument; onApproved: () => void }) {
  const requestSequence = useRef(0);
  const [data,setData]=useState<Usage|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const [limit,setLimit]=useState("0"),[enabled,setEnabled]=useState(false),[reason,setReason]=useState("");
  const [tier,setTier]=useState("editorial-sol");
  const kind=document?.kind,id=document?.entity_id;
  const load=useCallback(async()=>{
    const sequence = ++requestSequence.current;
    setData(null);
    try {
      const response=await fetch(`/api/admin/seo/ai${kind&&id?`?kind=${kind}&id=${encodeURIComponent(id)}`:""}`,{cache:"no-store"});
      const result=await response.json();if(!response.ok)throw Error(result.error);
      if (sequence !== requestSequence.current) return;
      setData(result);setLimit(String(result.monthlyLimit));setEnabled(result.enabled);setError("");
    }catch(e){if (sequence === requestSequence.current) {setData(null);setError(e instanceof Error?e.message:"Lecture indisponible.");}}
  },[kind,id]);
  useEffect(()=>{
    const requests = requestSequence;
    void load();
    return () => {requests.current++;};
  },[load]);
  async function action(payload: Record<string,unknown>) {
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/admin/seo/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,kind,id})});
      const result=await response.json();if(!response.ok)throw Error(result.error);
      await load();if(payload.action==="approve")onApproved();
    }catch(e){setError(e instanceof Error?e.message:"Résultat inconnu. Actualisez avant de réessayer.");}
    finally{setBusy(false);}
  }
  return <section className={`${styles.panel} ${styles.aiPanel}`} aria-label="IA bilingue et budget">
    <h2>SEO français / العربية · OpenAI</h2>
    <p>GPT-6.1 Sol est le choix éditorial provisoire après la comparaison locale. Astra reste une option de relecture premium. Chaque requête payante nécessite une autorisation du propriétaire ; aucune publication automatique.</p>
    {error&&<p role="alert">{error}</p>}
    <button disabled={busy} onClick={()=>void load()}>Actualiser le suivi IA</button>
    {data&&<>
      <p>Mois UTC : {data.month} · Entrée : {data.inputTokens} tokens · Sortie : {data.outputTokens} tokens</p>
      <p>Coût estimé : ${Number(data.estimatedUsd).toFixed(6)} · Réservé : ${Number(data.reservedUsd).toFixed(6)} · Plafond : ${Number(data.monthlyLimit).toFixed(2)}</p>
      <p>Protection SEO : 5 USD par mois, 50 USD cumulés. Engagement cumulé : ${Number(data.lifetimeCommitted ?? 0).toFixed(6)}. Les dépenses des autres applications doivent être rapprochées séparément.</p>
      <p>{data.pending} en attente · {data.uncertain} résultats/coûts incertains à examiner. Les estimations ne sont pas une facture. Les requêtes incertaines ne sont pas relancées automatiquement.</p>
      {data.canManageBudget&&<fieldset disabled={busy}><legend>Contrôles mensuels du propriétaire</legend>
        <label>Plafond USD (0–5)<input type="number" min="0" max="5" step="0.01" value={limit} onChange={e=>setLimit(e.target.value)}/></label>
        <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Autoriser les réservations IA</label>
        <button onClick={()=>void action({action:"budget",limit:Number(limit),enabled,mirai:false})}>Enregistrer le budget</button>
        <p>Le worker et son autorisation serveur restent nécessaires. Abaisser le plafond ne rappelle pas une requête déjà envoyée.</p>
      </fieldset>}
      {!document?<p>Ouvrez une fiche pour demander ou examiner une suggestion bilingue.</p>:<>
        <h3>{document.source.name}</h3>
        <button disabled={busy} onClick={()=>void action({action:"enqueue",tier:"routine",reason:"Routine SEO"})}>Mettre en file · GPT-6 Luna</button>
        <label>Besoin avancé (20 caractères minimum)<input value={reason} maxLength={500} onChange={e=>setReason(e.target.value)}/></label>
        <button disabled={busy||reason.trim().length<20} onClick={()=>void action({action:"enqueue",tier:"advanced",reason})}>Mettre en file · GPT-6 Sol</button>
        {document.kind==="product"&&<fieldset disabled={busy}><legend>Rédaction éditoriale bilingue</legend>
          <label>Modèle<select value={tier} onChange={e=>setTier(e.target.value)}><option value="editorial-luna">GPT-6 Luna</option><option value="editorial-sol">GPT-6.1 Sol · choix provisoire</option><option value="premium">GPT-6 Astra · relecture premium</option></select></label>
          <p>Plafond par requête : ${ceilings[tier].toFixed(2)}. Titres, descriptions SEO, mots-clés et texte produit. La mise en file ne donne aucune autorisation de dépense.</p>
          <button disabled={reason.trim().length<20} onClick={()=>void action({action:"enqueue",tier,reason})}>Préparer la suggestion éditoriale</button>
        </fieldset>}
        <p>Les mêmes données réutilisent le résultat existant. Lancez ensuite la synchronisation manuelle autorisée ; jusqu’à trois travaux IA par passage, selon le temps disponible.</p>
        {data.jobs.map(job=><article key={job.id}><h4>{job.tier} · {job.state} · {job.provider||"en attente"}</h4>
          {data.canManageBudget&&job.state==="pending"&&!job.paid_authorized&&<button disabled={busy} onClick={()=>{if(window.confirm(`Autoriser UNE requête ${job.tier}, au maximum ${ceilings[job.tier]} USD, sans relance ni publication ?`))void action({action:"authorize",job:job.id,ceiling:ceilings[job.tier],confirmed:true});}}>Autoriser une requête · ${ceilings[job.tier]?.toFixed(2)} maximum</button>}
          {job.result&&<>{(["fr","ar"] as const).map(locale=><div key={locale} lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
            <strong>{job.result![locale].title}</strong><p>{job.result![locale].description}</p><p>{job.result![locale].keywords.join(" · ")}</p>
            {job.result![locale].productDescription&&<p>{job.result![locale].productDescription}</p>}
          </div>)}
          {job.result.evidence&&<details><summary>Justification des faits à examiner</summary>{job.result.evidence.map((e,i)=><p key={i}>{e.locale} : {e.claim} — Source : {e.sourceQuote}</p>)}</details>}
          {job.result.editorialVersion?<>
            <EditorialReview key={`${job.id}:${document.version}:${JSON.stringify(job.result)}:${job.reviews?.[0]?.id??""}`} draft={job.result} source={job.payload} current={job.source_current===true} busy={busy} onReview={(decision,checklist,notes)=>void action({action:"review",job:job.id,version:document.version,decision,checklist,notes})}/>
            {job.reviews?.map(review=><p key={review.id}>Relecture : {review.decision==="approved_for_publication"?"approuvée sans publication":"corrections demandées"} · {review.actor} · {review.created_at} · version {review.document_version} — {review.notes}</p>)}
          </>:<><p>L’approbation conserve les deux langues et publie le français sur les pages actuelles. Aucun nouveau routage arabe ni balise meta keywords n’est créé.</p>
          <button disabled={busy||job.approved} onClick={()=>void action({action:"approve",job:job.id,version:document.version})}>{job.approved?"Approbation conservée":"Approuver ces métadonnées"}</button></>}</>}
        </article>)}
      </>}
    </>}
  </section>;
}
