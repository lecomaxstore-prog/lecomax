"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupportFile } from '@/lib/support-attachments';

type Status = "open" | "waiting" | "resolved";
type Conversation = { id:string; customer_name:string; customer_email:string; subject:string; order_number:string|null; status:Status; last_message:string|null; last_message_at:string; admin_unread:number };
type Message = { id:string; sender_type:"customer"|"support"; body:string; created_at:string; read_at:string|null; attachment?: SupportFile };
const labels: Record<Status,string> = { open:"Ouverte", waiting:"En attente client", resolved:"Résolue" };

export default function AdminSupportPage() {
  const [items,setItems] = useState<Conversation[]>([]);
  const [selected,setSelected] = useState<Conversation|null>(null);
  const [messages,setMessages] = useState<Message[]>([]);
  const [status,setStatus] = useState<"all"|Status>("all");
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);
  const [threadLoading,setThreadLoading] = useState(false);
  const [reply,setReply] = useState("");
  const [sending,setSending] = useState(false);
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [error,setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedId = selected?.id;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const replyDrafts = useRef<Record<string, string>>({});
  const pendingReply = useRef<{ id: string; body: string; clientId: string; fileFingerprint: string } | null>(null);
  const threadVersion = useRef(0);
  const [setupRequired, setSetupRequired] = useState(false);

  const load = useCallback(async (signal?: AbortSignal, initial = false) => {
    if (initial) setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    try {
      const response = await fetch(`/api/admin/support/conversations?${params}`, { signal, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setSetupRequired(data.code === "SUPPORT_SETUP_REQUIRED");
        throw new Error(data.error || "Inbox indisponible.");
      }
      if (signal?.aborted) return;
      setSetupRequired(false);
      setItems(data.conversations ?? []);
    } catch (reason) {
      if (!signal?.aborted) setError(reason instanceof Error ? reason.message : "Inbox indisponible.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [search, status]);

  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const refresh = async (initial = false) => {
      if (busy || (!initial && document.visibilityState !== "visible")) return;
      busy = true; await load(controller.signal, initial); busy = false;
    };
    const timer = setTimeout(() => void refresh(true), 250);
    const poll = setInterval(() => void refresh(), 5000);
    return () => { controller.abort(); clearTimeout(timer); clearInterval(poll); };
  }, [load]);

  const open = (conversation: Conversation) => {
    if (conversation.id === selectedId) return;
    if (selectedId) replyDrafts.current[selectedId] = reply;
    selectedRef.current = conversation.id;
    threadVersion.current++;
    setReply(replyDrafts.current[conversation.id] ?? "");
    setMessages([]); setSelected(conversation); setError(""); setThreadLoading(true);
  };

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let busy = false;
    const refresh = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      const version = threadVersion.current;
      try {
        const response = await fetch(`/api/admin/support/conversations/${selectedId}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Conversation indisponible.");
        if (controller.signal.aborted || selectedRef.current !== selectedId || version !== threadVersion.current) return;
        setSelected(data.conversation);
        setMessages(data.messages ?? []);
        setItems(current => current.map(item => item.id === selectedId ? data.conversation : item));
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Conversation indisponible.");
      } finally { busy = false; if (!controller.signal.aborted) setThreadLoading(false); }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [selectedId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages.length, selectedId]);
  const unread = useMemo(() => items.reduce((sum, item) => sum + item.admin_unread, 0), [items]);

  async function send() {
    if (!selectedId || (!reply.trim() && !files[selectedId]) || sending || threadLoading) return;
    const target = selectedId;
    const file = files[target];
    const fileFingerprint = file ? `${file.name}:${file.size}:${file.lastModified}` : '';
    const body = reply.trim();
    if (pendingReply.current?.id !== target || pendingReply.current.body !== body || pendingReply.current.fileFingerprint !== fileFingerprint) {
      pendingReply.current = { id: target, body, clientId: crypto.randomUUID(), fileFingerprint };
    }
    const clientId = pendingReply.current.clientId;
    threadVersion.current++;
    setSending(true); setError("");
    try {
      const form = new FormData();
      if (file) { form.append('file', file); form.append('body', body); form.append('client_message_id', clientId); }
      const response = await fetch(`/api/admin/support/conversations/${target}/messages`, {
        method: "POST", headers: file ? undefined : { "Content-Type": "application/json" },
        body: file ? form : JSON.stringify({ body, client_message_id: clientId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Réponse non envoyée.");
      threadVersion.current++;
      replyDrafts.current[target] = "";
      pendingReply.current = null;
      setFiles(current => ({ ...current, [target]: undefined }));
      if (selectedRef.current === target) {
        setMessages(current => current.some(item => item.id === data.message.id) ? current : [...current, data.message]);
        setReply("");
        setSelected(current => current ? { ...current, status: "waiting", last_message: body, last_message_at: data.message.created_at } : current);
      }
      void load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Réponse non envoyée."); }
    finally { setSending(false); }
  }

  async function changeStatus(next: Status) {
    if (!selectedId) return;
    const target = selectedId;
    threadVersion.current++;
    setError("");
    try {
      const response = await fetch(`/api/admin/support/conversations/${target}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Statut non enregistré.");
      threadVersion.current++;
      if (selectedRef.current === target) setSelected(data.conversation);
      void load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Statut non enregistré."); }
  }

  return <div className={`admin-support-page ${selected ? "admin-support-selected" : ""} min-h-screen bg-[#f4f6f4] p-4 md:p-7`}>
    <div className="mx-auto max-w-[1500px]">
      <header className="admin-support-hero admin-mobile-heading mb-5 flex flex-col gap-3 rounded-3xl bg-[#182A20] p-6 text-white md:flex-row md:items-end md:justify-between md:p-8"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-[#B8D6BE]">Service client</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Espace Assistance</h1><p className="mt-2 max-w-xl text-sm text-white/55">Conversations sécurisées de l’application mobile L’ECOMAX.</p></div><div className="flex gap-3"><div className="rounded-2xl bg-white/10 px-5 py-3"><span className="text-2xl font-black text-[#B8D6BE]">{unread}</span><span className="ml-2 text-xs font-bold text-white/60">non lus</span></div><button onClick={()=>void load()} className="rounded-2xl border border-white/15 px-5 text-xs font-black hover:bg-white/10">ACTUALISER</button></div></header>
      {setupRequired ? <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Configuration requise : appliquez la migration <code>20260905160000_support_delivery.sql</code> dans Supabase pour activer la messagerie enregistrée.</div> : null}
      {error?<div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>:null}
      <div className="admin-support-frame grid h-[calc(100dvh-270px)] min-h-[560px] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm lg:grid-cols-[390px_1fr]">
        <aside className={`${selected?"hidden lg:flex":"flex"} min-h-0 flex-col border-r border-neutral-200`}>
          <div className="border-b border-neutral-200 p-4"><input aria-label="Rechercher une conversation" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Client, email ou sujet…" className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900"/><div className="mt-3 flex gap-1 overflow-x-auto">{(["all","open","waiting","resolved"] as const).map(value=><button key={value} onClick={()=>setStatus(value)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black uppercase ${status===value?"bg-neutral-950 text-white":"bg-neutral-100 text-neutral-500"}`}>{value==="all"?"Toutes":labels[value]}</button>)}</div></div>
          <div className="min-h-0 flex-1 overflow-y-auto">{loading?<div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>:items.length?items.map(item=><button key={item.id} onClick={()=>void open(item)} className={`flex w-full gap-3 border-b border-neutral-100 p-4 text-left transition hover:bg-neutral-50 ${selected?.id===item.id?"bg-[#f0faf2]":""}`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${item.admin_unread?"bg-[#168526] text-white":"bg-neutral-100 text-neutral-600"}`}>{item.customer_name.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-black">{item.customer_name}</p>{item.admin_unread?<span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white">{item.admin_unread}</span>:null}</div><p className="mt-1 truncate text-xs font-bold text-neutral-600">{item.subject}</p><p className="mt-1 truncate text-xs text-neutral-400">{item.last_message}</p></div><time className="text-[9px] font-bold text-neutral-400">{new Date(item.last_message_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</time></button>):<div className="p-10 text-center"><p className="font-black">Inbox vide</p><p className="mt-2 text-sm text-neutral-400">Les nouvelles demandes apparaîtront ici.</p></div>}</div>
        </aside>
        <main className={`${selected?"flex":"hidden lg:flex"} min-h-0 flex-col`}>{selected?<><div className="admin-support-thread-heading flex flex-wrap items-center gap-3 border-b border-neutral-200 p-4 md:p-5"><button onClick={()=>{ if(selectedId) replyDrafts.current[selectedId]=reply; setSelected(null); }} className="h-10 rounded-xl bg-neutral-100 px-3 text-xs font-black lg:hidden">RETOUR</button><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-black">{selected.subject}</h2><p className="mt-1 truncate text-xs text-neutral-500">{selected.customer_name} · {selected.customer_email}{selected.order_number?` · ${selected.order_number}`:""}</p></div><select aria-label="Statut" disabled={sending||threadLoading} value={selected.status} onChange={event=>void changeStatus(event.target.value as Status)} className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-black"><option value="open">Ouverte</option><option value="waiting">En attente client</option><option value="resolved">Résolue</option></select></div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f3f3ea] p-4 md:p-6">{threadLoading?<div className="text-center text-sm text-neutral-400">Chargement…</div>:messages.map(message=><div key={message.id} className={`mb-3 flex ${message.sender_type==="support"?"justify-end":"justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 ${message.sender_type==="support"?"rounded-br-sm bg-[#174F3D] text-white":"rounded-bl-sm border border-[#e5e9dc] bg-white text-neutral-900"}`}><>{message.attachment ? <a href={message.attachment.url || undefined} target="_blank" rel="noopener noreferrer" className="mb-2 block overflow-hidden rounded-xl bg-black/5" aria-label={'Ouvrir ' + message.attachment.name}>{message.attachment.type.startsWith('image/') && message.attachment.url ? <img src={message.attachment.url} alt={message.attachment.name} className="max-h-72 w-64 object-cover" loading="lazy" decoding="async" /> : <div className="flex items-center gap-3 p-4"><span className="rounded-lg bg-white/20 p-2 text-xs font-bold">PDF</span><div><p className="break-all text-sm font-semibold">{message.attachment.name}</p><p className="mt-1 text-xs opacity-60">{Math.max(1, Math.round(message.attachment.size / 1024))} Ko · {message.attachment.url ? 'Télécharger ↗' : 'Indisponible'}</p></div></div>}</a> : null}{message.body ? <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p> : null}</><p className={`mt-2 text-[9px] ${message.sender_type==="support"?"text-white/45":"text-neutral-400"}`}>{new Date(message.created_at).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p></div></div>)}<div ref={bottomRef}/></div>
          <div className="border-t border-neutral-200 bg-white p-4">{files[selected.id] ? <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-xs"><span className="truncate">📎 {files[selected.id]!.name}</span><button disabled={sending} aria-label="Retirer le fichier" onClick={() => setFiles(current => ({ ...current, [selected.id]: undefined }))} className="ml-3 p-2">✕</button></div> : null}<div className="admin-support-composer flex items-end gap-2"><label className="flex h-14 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-neutral-200 text-2xl text-emerald-800" title="Joindre une photo ou un PDF">+<input aria-label="Joindre une photo ou un PDF" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={sending || threadLoading} className="sr-only" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; if (file.size > 3 * 1024 * 1024) { setError('Le fichier doit faire moins de 3 Mo.'); return; } setError(''); setFiles(current => ({ ...current, [selected.id]: file })); }} /></label><textarea aria-label="Réponse" disabled={sending} value={reply} onChange={event=>setReply(event.target.value.slice(0,files[selected.id] ? 1000 : 2000))} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();void send();}}} placeholder="Écrire une réponse…" rows={2} className="min-h-14 flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900"/><button disabled={(!reply.trim()&&!files[selected.id])||sending||threadLoading} onClick={()=>void send()} className="h-14 rounded-2xl bg-[#168526] px-6 text-xs font-black text-white disabled:opacity-40">{sending?"ENVOI…":"ENVOYER"}</button></div><p className="mt-2 text-[10px] text-neutral-400">Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</p></div></>:<div className="m-auto text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eaf7ed] text-2xl">💬</div><p className="mt-4 font-black">Sélectionnez une conversation</p><p className="mt-2 text-sm text-neutral-400">Les messages s’afficheront ici.</p></div>}</main>
      </div>
    </div>
  </div>;
}
