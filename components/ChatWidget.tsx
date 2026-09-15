"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isSizeMenuOpen, sizeMenuServerSnapshot, subscribeSizeMenu } from "@/lib/size-menu-state";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ChatMsg = { id: string; direction: "in" | "out"; body: string; sent_by: "visitor" | "ai" | "agent"; timestamp: string };
type Snapshot = { status: "ai" | "escalated" | "resolved"; messages: ChatMsg[]; expires_at: string | null; expired?: boolean; ai_takeover_required?: boolean };
const EMPTY: Snapshot = { status: "ai", messages: [], expires_at: null };
const TOPICS = [
  ["Suivre ma commande", "Comment suivre ma commande ?"],
  ["Livraison", "Quels sont les délais et frais de livraison ?"],
  ["Retours et échanges", "Comment effectuer un retour ou un échange ?"],
  ["Découvrir nos produits", "Quels produits proposez-vous ?"],
];
const control = "rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

function storage(key: string, value?: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else if (value !== undefined) localStorage.setItem(key, value);
    return localStorage.getItem(key);
  } catch { return null; }
}

async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    ...(body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    cache: "no-store", signal: AbortSignal.timeout(url === "/api/chat/message" ? 45_000 : 15_000),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || "Connexion indisponible"), { status: response.status, data });
  return data;
}

function MessageBody({ text }: { text: string }) {
  return <>{text.split(/(https?:\/\/[^\s]+|(?:www\.)?lecomax\.com\/[^\s]*)/gi).map((part, i) =>
    /^(https?:\/\/|(?:www\.)?lecomax\.com\/)/i.test(part)
      ? <a key={i} className="break-all underline underline-offset-4" href={part.startsWith("http") ? part : "https://" + part} target="_blank" rel="noopener noreferrer">{part}</a>
      : part
  )}</>;
}

function Icon({ kind }: { kind: "chat" | "arrow" | "close" | "minimize" }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={kind === "chat" ? "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 1 1 19 0ZM7 10h10M7 14h6" : kind === "arrow" ? "M12 19V5m-6 6 6-6 6 6" : kind === "close" ? "m6 6 12 12M6 18 18 6" : "M5 12h14"} />
  </svg>;
}

export default function ChatWidget() {
  const sizeMenuOpen = useSyncExternalStore(subscribeSizeMenu, isSizeMenuOpen, sizeMenuServerSnapshot);
  const pathname = usePathname();
  const hidden = ["/nous-contacter", "/checkout", "/compte", "/connexion"].some(path => pathname?.startsWith(path));
  const [open, setOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const revealAfterScroll = () => {
      if (window.scrollY < 80) return;
      setHasScrolled(true);
      window.removeEventListener("scroll", revealAfterScroll);
    };
    window.addEventListener("scroll", revealAfterScroll, { passive: true });
    return () => window.removeEventListener("scroll", revealAfterScroll);
  }, []);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const snapshotRef = useRef(snapshot);
  const openRef = useRef(false);
  const busyRef = useRef(false);
  const startingRef = useRef(false);
  const freshRef = useRef(false);
  const generation = useRef(0);
  const messageRevision = useRef(0);
  const visitorRef = useRef("");
  const panelRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [input, open]);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTyping = useRef(0);
  const typingActive = useRef(false);
  const typingChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const apply = useCallback((next: Snapshot) => {
    const previous = snapshotRef.current;
    snapshotRef.current = next;
    setSnapshot(next);
    if (next.status === "resolved") { storage("eco_chat_session", null); setAgentTyping(false); }
    if (!openRef.current) {
      const oldIds = new Set(previous.messages.map(m => m.id));
      const incoming = next.messages.filter(m => m.direction === "out" && !m.body.startsWith("__") && !oldIds.has(m.id)).length;
      if (incoming) setUnread(count => count + incoming);
    }
  }, []);

  const start = useCallback(async (fresh = false) => {
    if (startingRef.current || (busyRef.current && !fresh)) return;
    startingRef.current = true;
    const version = ++generation.current;
    busyRef.current = true;
    setBusy(false); setStarting(true); setError(""); setConfirmEnd(false);
    setAgentTyping(false); setRating(0); setRated(false); setInput(""); setUnread(0);
    sessionRef.current = null; setSessionId(null); apply(EMPTY);
    if (fresh) { freshRef.current = true; storage("eco_chat_fresh", "1"); }
    try {
      visitorRef.current ||= storage("eco_chat_visitor") || crypto.randomUUID();
      storage("eco_chat_visitor", visitorRef.current);
      // The server decides whether the previous conversation can safely resume.
      const created = await request<{ id: string }>("/api/chat/start", { visitor_id: visitorRef.current, fresh: freshRef.current || storage("eco_chat_fresh") === "1" });
      const data = await request<Snapshot>("/api/chat/poll/" + created.id);
      if (version !== generation.current) return;
      sessionRef.current = created.id; setSessionId(created.id);
      storage("eco_chat_session", created.id); storage("eco_chat_fresh", null); freshRef.current = false; apply(data);
    } catch {
      if (version === generation.current) setError("La connexion n’a pas abouti. Réessayez dans un instant.");
    } finally {
      if (version === generation.current) { busyRef.current = false; startingRef.current = false; setStarting(false); }
    }
  }, [apply]);

  function minimize() { openRef.current = false; setOpen(false); requestAnimationFrame(() => launcherRef.current?.focus()); }
  function show() {
    openRef.current = true; setOpen(true); setUnread(0);
    if (!sessionRef.current || snapshotRef.current.status === "resolved") { setNotice(""); void start(); }
  }

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("chat-open");
    const resize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const mobile = window.innerWidth < 640;
      panel.style.height = mobile ? (window.visualViewport?.height ?? window.innerHeight) + "px" : "";
      panel.style.top = mobile ? (window.visualViewport?.offsetTop ?? 0) + "px" : "";
    };
    resize(); window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize); window.visualViewport?.addEventListener("scroll", resize);
    panelRef.current?.focus();
    return () => {
      document.body.classList.remove("chat-open"); window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("scroll", resize);
    };
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && open) el.scrollTo({ top: snapshot.messages.length ? el.scrollHeight : 0, behavior: "auto" });
  }, [snapshot.messages.length, open, busy, agentTyping]);

  // Serial polling also runs while minimized; refetch immediately after tab sleep.
  useEffect(() => {
    if (!sessionId || snapshot.status === "resolved") return;
    let disposed = false;
    let polling = false;
    const version = generation.current;
    const poll = async () => {
      if (disposed || polling || busyRef.current) return;
      polling = true;
      const revision = messageRevision.current;
      try {
        let data = await request<Snapshot>("/api/chat/poll/" + sessionId);
        if (disposed || version !== generation.current || busyRef.current || revision !== messageRevision.current) return;
        if (data.ai_takeover_required) {
          busyRef.current = true; setBusy(true);
          try {
            await request("/api/chat/message", { session_id: sessionId, ai_takeover: true });
            data = await request<Snapshot>("/api/chat/poll/" + sessionId);
          } finally { if (version === generation.current) { busyRef.current = false; setBusy(false); } }
        }
        if (disposed || version !== generation.current || revision !== messageRevision.current) return;
        apply(data);

      } catch { /* Keep the last confirmed state and retry on the next poll. */ }
      finally { polling = false; }
    };
    void poll();
    const timer = setInterval(() => { setNow(Date.now()); void poll(); }, 3000);
    window.addEventListener("focus", poll); document.addEventListener("visibilitychange", poll);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("focus", poll); document.removeEventListener("visibilitychange", poll); };
  }, [sessionId, snapshot.status, apply]);

  useEffect(() => () => { generation.current++; if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  useEffect(() => {
    if (!sessionId || !snapshot.expires_at || snapshot.status === "resolved") return;
    const deadline = snapshot.expires_at;
    const version = generation.current;
    const expire = () => {
      if (version !== generation.current || busyRef.current || snapshotRef.current.expires_at !== deadline) return;
      if (Date.now() < Date.parse(deadline)) return;
      apply({ ...snapshotRef.current, status: "resolved", expires_at: null, expired: true });
      // The deadline is server-derived; close locally even if connectivity drops.
      void request("/api/chat/poll/" + sessionId).catch(() => {});
    };
    const timer = setTimeout(expire, Math.max(0, Date.parse(deadline) - Date.now()));
    document.addEventListener("visibilitychange", expire);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", expire); };
  }, [sessionId, snapshot.expires_at, snapshot.status, apply]);

  useEffect(() => {
    setAgentTyping(false);
    if (!sessionId || !open || snapshot.status !== "escalated") return;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    const channel = supabase.channel(`chat:${sessionId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (disposed || payload?.from !== "agent") return;
        clearTimeout(expiry);
        setAgentTyping(payload.typing === true);
        if (payload.typing === true) expiry = setTimeout(() => setAgentTyping(false), 4500);
      }).subscribe();
    typingChannel.current = channel;
    return () => {
      disposed = true;
      clearTimeout(expiry);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingActive.current = false;
      lastTyping.current = 0;
      typingChannel.current = null;
      void channel.send({ type: "broadcast", event: "typing", payload: { from: "client", typing: false } })
        .finally(() => { void supabase.removeChannel(channel); });
    };
  }, [sessionId, open, snapshot.status]);

  function signalClientTyping(active: boolean) {
    if (!typingChannel.current) return;
    const now = Date.now();
    if (!active || !typingActive.current || now - lastTyping.current > 1500) {
      typingActive.current = active;
      lastTyping.current = now;
      void typingChannel.current.send({ type: "broadcast", event: "typing", payload: { from: "client", typing: active } });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (active) typingTimer.current = setTimeout(() => signalClientTyping(false), 2500);
  }

  function typing(value: string) {
    setInput(value);
    signalClientTyping(!!value.trim());
  }

  async function send(text = input) {
    text = text.trim();
    const id = sessionRef.current;
    if (!text || !id || busyRef.current || snapshotRef.current.status === "resolved") return;
    signalClientTyping(false);
    messageRevision.current++;
    busyRef.current = true; setBusy(true); setError(""); setNotice(""); setInput("");
    const version = generation.current;
    const before = snapshotRef.current;
    const optimistic: ChatMsg = { id: "pending", direction: "in", sent_by: "visitor", body: text, timestamp: new Date().toISOString() };
    apply({ ...before, messages: [...before.messages, optimistic], expires_at: null });
    try {
      await request("/api/chat/message", { session_id: id, body: text });
      const data = await request<Snapshot>("/api/chat/poll/" + id);
      if (version === generation.current) apply(data);
    } catch (caught) {
      if (version !== generation.current) return;
      const failure = caught as { status?: number; data?: { status?: string; expired?: boolean } };
      if (failure.status === 409 && failure.data?.status === "resolved") {
        apply({ ...before, status: "resolved", expires_at: null, expired: failure.data.expired }); setInput(text);
      } else {
        // Reconcile an uncertain response before offering a manual retry.
        let reconciled: Snapshot | null = null;
        try { reconciled = await request<Snapshot>("/api/chat/poll/" + id); } catch {}
        if (version !== generation.current) return;
        apply(reconciled || before);
        const accepted = reconciled?.messages.some(m => m.sent_by === "visitor" && m.body === text && !before.messages.some(old => old.id === m.id));
        if (!accepted) setInput(text);
        setError(accepted ? "Votre message a été reçu. La réponse peut prendre un peu plus de temps." : "L’envoi n’a pas pu être confirmé. Votre message est conservé ci-dessous.");
      }
    } finally { if (version === generation.current) { busyRef.current = false; setBusy(false); inputRef.current?.focus(); } }
  }

  async function end() {
    setNotice("La conversation précédente est terminée. Commençons un nouvel échange.");
    await start(true);
  }

  async function restart() {
    const draft = input;
    setNotice("");
    await start(true);
    if (sessionRef.current) setInput(draft);
  }

  const visibleMessages = snapshot.messages.filter(m => !m.body.startsWith("__"));
  const agentActive = snapshot.status === "escalated" && snapshot.messages.some(m => m.sent_by === "agent");
  const secondsLeft = snapshot.expires_at ? Math.max(0, Math.ceil((Date.parse(snapshot.expires_at) - now) / 1000)) : null;
  const resolved = snapshot.status === "resolved";
  const disabled = busy || starting || !sessionId || resolved;

  return <>
    {hasScrolled && !open && !hidden && !sizeMenuOpen && <button ref={launcherRef} type="button" onClick={show} aria-label="Ouvrir l’assistance L’ecomax" aria-haspopup="dialog" className={control + " eco-chat-launcher fixed bottom-20 right-4 z-50 flex h-14 items-center gap-2.5 rounded-full bg-[#183c30] px-5 text-sm font-semibold text-white shadow-lg hover:bg-[#224e3e] sm:bottom-6 sm:right-6"}>
      <span className="eco-chat-launcher-icon" aria-hidden="true"><Icon kind="chat" /></span><span>Besoin d’aide ?</span>{unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-emerald-900">{unread}</span>}
    </button>}
    {open && <section ref={panelRef} role="dialog" aria-label="Assistance L’ecomax" tabIndex={-1}
      onKeyDown={event => { if (event.key === "Escape") { if (confirmEnd) setConfirmEnd(false); else minimize(); } }}
      className="fixed inset-x-0 top-0 z-[100] flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-white font-sans text-neutral-900 shadow-[0_20px_80px_rgba(0,0,0,.18)] outline-none sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-48px))] sm:w-[390px] sm:rounded-2xl sm:border sm:border-neutral-200">
      <header className="flex shrink-0 items-center gap-3 border-b border-neutral-100 bg-white px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#183c30] text-white"><Icon kind="chat" /></span>
        <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold tracking-tight">L’ecomax <span className="font-normal text-neutral-400">/</span> Assistance</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500"><span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (resolved ? "bg-neutral-300" : "bg-emerald-600")} />{resolved ? "Conversation terminée" : starting ? "Connexion…" : agentActive ? "Avec un conseiller" : snapshot.status === "escalated" ? "En attente d’un conseiller" : "Eco · Assistant IA"}</p></div>
        <button type="button" onClick={minimize} aria-label="Réduire la conversation" title="Réduire" className={control + " flex h-10 w-10 shrink-0 items-center justify-center text-neutral-500 hover:bg-neutral-100"}><Icon kind="minimize" /></button>
        <button type="button" onClick={() => { if (!sessionId || resolved) minimize(); else setConfirmEnd(true); }} aria-label="Terminer la conversation" title="Terminer la conversation" className={control + " -ml-2 flex h-10 w-10 shrink-0 items-center justify-center text-neutral-500 hover:bg-neutral-100"}><Icon kind="close" /></button>
      </header>
      {confirmEnd && <div className="shrink-0 border-b border-neutral-200 bg-neutral-50 px-5 py-4"><p className="text-sm font-semibold">Terminer cet échange ?</p><p className="mt-1 text-xs leading-5 text-neutral-500">Votre prochain échange repartira de zéro.</p><div className="mt-3 flex gap-2"><button className={control + " min-h-10 flex-1 border border-neutral-200 bg-white text-xs font-medium"} onClick={() => setConfirmEnd(false)}>Continuer l’échange</button><button className={control + " min-h-10 flex-1 bg-[#183c30] text-xs font-medium text-white"} onClick={() => void end()}>Terminer</button></div></div>}
      <div ref={scrollRef} className="eco-chat-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fafbf9] px-5 py-6">
        {notice && !starting && sessionId && <p role="status" className="mb-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">{notice}</p>}
        {visibleMessages.length === 0 ? <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">Bienvenue chez L’ecomax</p>
          <h3 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.035em]">Comment pouvons-nous<br />vous aider ?</h3>
          <p className="mt-3 text-sm leading-6 text-neutral-500">Une question sur un produit ou une commande ? Eco vous accompagne.</p>
          <div className="mt-7 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200/80 bg-white">{TOPICS.map(([label, message]) => <button key={label} type="button" disabled={disabled} onClick={() => void send(message)} className={control + " flex min-h-12 w-full items-center justify-between gap-3 rounded-none px-4 py-3 text-left text-[13px] font-medium hover:bg-neutral-50"}><span>{label}</span><span aria-hidden="true" className="text-lg font-normal text-neutral-400">›</span></button>)}</div>
          <button type="button" disabled={disabled} onClick={() => void send("Je souhaite parler à un conseiller humain")} className={control + " mt-4 min-h-11 w-full text-xs font-medium text-emerald-900 hover:bg-emerald-50"}>Parler à un conseiller <span aria-hidden="true">↗</span></button>
        </div> : <div role="log" aria-label="Messages de la conversation" aria-live="polite" aria-relevant="additions" className="space-y-5">{visibleMessages.map(message => <div key={message.id} className={"flex flex-col " + (message.direction === "in" ? "items-end" : "items-start")}>
          <p className="mb-1.5 px-1 text-[10px] font-medium text-neutral-400">{message.sent_by === "visitor" ? "Vous" : message.sent_by === "agent" ? "Conseiller L’ecomax" : "Eco · IA"}</p>
          <div dir="auto" className={"max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[13px] leading-[1.7] " + (message.direction === "in" ? "rounded-tr-md bg-[#183c30] text-white" : "rounded-tl-md border border-neutral-200/70 bg-white text-neutral-700")}><MessageBody text={message.body} /></div>
          <time dateTime={message.timestamp} className="mt-1 px-1 text-[10px] text-neutral-400">{message.id === "pending" ? "Envoi…" : new Date(message.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</time>
        </div>)}</div>}
        {((busy && !resolved) || starting || agentTyping) && <p role="status" className="mt-5 text-xs text-neutral-500">{starting ? "Connexion à l’assistance…" : agentTyping ? "Le conseiller écrit…" : snapshot.status === "escalated" ? "Envoi du message…" : "Eco prépare une réponse…"}</p>}
        {snapshot.status === "escalated" && !agentActive && !busy && <p className="mt-5 rounded-lg border border-neutral-200 bg-white p-3 text-xs leading-5 text-neutral-500">Votre demande a été transmise. Vous pouvez réduire cette fenêtre pendant l’attente.</p>}
      </div>
      <footer className="shrink-0 border-t border-neutral-100 bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {error && <div role="alert" className="mb-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">{error}{!sessionId && <button onClick={() => void start()} disabled={starting} className={control + " ml-2 underline"}>Réessayer</button>}</div>}
        {resolved ? <div>
          <p className="text-sm font-semibold">{snapshot.expired ? "Cet échange a été fermé" : "Merci pour votre visite"}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{snapshot.expired ? "Sans réponse de votre part pendant 3 minutes, la conversation se termine automatiquement." : "La conversation est terminée. Nous restons à votre écoute."}</p>
          {!snapshot.expired && !rated && <div className="mt-3 flex items-center justify-between"><span className="text-xs text-neutral-500">Cet échange vous a aidé ?</span><div className="flex">{[1, 2, 3, 4, 5].map(star => <button key={star} aria-label={star + " étoiles"} disabled={busy} onClick={async () => {
            if (!sessionId || busyRef.current) return;
            busyRef.current = true; setBusy(true); setRating(star); const version = generation.current;
            try { await request("/api/chat/feedback", { session_id: sessionId, rating: star }); if (version === generation.current) { setRated(true); setError(""); } }
            catch { if (version === generation.current) setError("Votre avis n’a pas pu être envoyé. Vous pouvez réessayer."); }
            finally { if (version === generation.current) { busyRef.current = false; setBusy(false); } }
          }} className={control + " h-9 w-7 text-xl " + (star <= rating ? "text-emerald-700" : "text-neutral-300")}>★</button>)}</div></div>}
          {rated && <p role="status" className="mt-2 text-xs text-emerald-800">Merci pour votre avis.</p>}
          <button type="button" onClick={() => void restart()} disabled={starting} className={control + " mt-4 min-h-11 w-full bg-[#183c30] text-sm font-medium text-white hover:bg-[#224e3e]"}>Nouvelle conversation</button>
        </div> : <>
          {secondsLeft !== null && secondsLeft <= 30 && !busy && <p role="status" className="mb-2 text-xs text-neutral-500">L’échange se termine bientôt sans nouvelle réponse.</p>}
          <form onSubmit={event => { event.preventDefault(); void send(); }} className="flex items-end gap-3 rounded-[22px] border border-[#dfe5df] bg-[#fafbf8] p-2 shadow-[0_2px_8px_rgba(24,60,48,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-[#87a394] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(24,60,48,0.06),0_4px_16px_rgba(24,60,48,0.05)]">
            <label htmlFor="eco-chat-message" className="sr-only">Votre message</label><textarea id="eco-chat-message" ref={inputRef} onBlur={() => signalClientTyping(false)} value={input} onChange={event => typing(event.target.value)} maxLength={2000} disabled={disabled} rows={1} placeholder="Écrivez votre message…" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} className="eco-chat-scroll max-h-36 min-h-11 min-w-0 flex-1 resize-none border-0 bg-transparent py-2.5 pl-3 pr-0 text-base leading-6 text-[#243c31] outline-none placeholder:text-[#8a968e] disabled:cursor-not-allowed sm:text-sm" />
            <button type="submit" aria-label="Envoyer le message" disabled={disabled || !input.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#285442] to-[#183c30] text-white shadow-[0_3px_8px_rgba(24,60,48,0.18),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[transform,box-shadow,opacity] duration-200 enabled:hover:shadow-[0_4px_12px_rgba(24,60,48,0.28)] enabled:active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none motion-reduce:transition-none"><Icon kind="arrow" /></button>
          </form>
          <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-neutral-400"><span>Fermeture après 3 min sans réponse</span>{visibleMessages.length > 0 && snapshot.status === "ai" && <button disabled={disabled} onClick={() => void send("Je souhaite parler à un conseiller humain")} className={control + " py-1 text-neutral-600 underline underline-offset-2"}>Un conseiller</button>}</div>
        </>}
      </footer>
    </section>}
  </>;
}
