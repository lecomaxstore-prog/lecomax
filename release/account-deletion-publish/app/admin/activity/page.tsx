"use client";
import { useEffect, useState } from 'react';
type Activity = {id:string;admin_email:string;area:string;created_at:string;changes:Record<string,{before:unknown;after:unknown}>};
export default function ActivityPage() {
  const [page,setPage]=useState(0);
  const [items,setItems]=useState<Activity[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [hasMore,setHasMore]=useState(false);
  useEffect(()=>{
    const controller=new AbortController(); setLoading(true);setError('');
    fetch(`/api/admin/activity?page=${page}`,{cache:'no-store',signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error);setItems(body.items);setHasMore(body.hasMore);}).catch(error=>{if(!controller.signal.aborted)setError(error.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[page]);
  return <div className="mx-auto max-w-5xl space-y-5 pb-24">
    <header><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Administration</p><h1 className="mt-2 text-2xl font-black">Historique des modifications</h1><p className="mt-2 text-sm text-neutral-500">Prix, stocks et configuration de la boutique.</p></header>
    {error?<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>:loading?<p role="status" className="p-6">Chargement…</p>:!items.length?<p className="rounded-2xl border bg-white p-6">Aucune modification enregistrée.</p>:items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold capitalize">{item.area}</h2><time className="text-xs text-neutral-500">{new Date(item.created_at).toLocaleString('fr-FR')}</time></div><p className="mt-1 break-all text-xs text-neutral-500">{item.admin_email}</p><div className="mt-4 space-y-3">{Object.entries(item.changes).map(([key,change])=><details key={key} className="rounded-xl bg-neutral-50 p-3"><summary className="min-h-8 cursor-pointer text-sm font-semibold">{key}</summary><div className="mt-2 grid gap-2 sm:grid-cols-2"><div><p className="text-xs text-neutral-500">Avant</p><pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(change.before,null,2)}</pre></div><div><p className="text-xs text-neutral-500">Après</p><pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(change.after,null,2)}</pre></div></div></details>)}</div></article>)}
    <nav aria-label="Pages de l’historique" className="flex items-center justify-between"><button disabled={loading||page===0} onClick={()=>setPage(page-1)} className="min-h-11 rounded-xl border bg-white px-4 disabled:opacity-40">Précédent</button><span className="text-sm">Page {page+1}</span><button disabled={loading||!hasMore||!!error} onClick={()=>setPage(page+1)} className="min-h-11 rounded-xl border bg-white px-4 disabled:opacity-40">Suivant</button></nav>
  </div>;
}
