"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Message = { id: string; name: string; email: string; subject: string; message: string; read: boolean; created_at: string };
type InboxEmail = { uid: number; subject: string; from: string; fromAddress: string; date: string; read: boolean; hasAttachment: boolean };
type InboxEmailDetail = InboxEmail & { to: string; text: string; html: string; attachments: { filename: string; contentType: string; size: number }[] };

// ─── Live Chat types ────────────────────────────────────────────────────────
type ChatSession = {
  id: string;
  visitor_id: string;
  name: string | null;
  status: "ai" | "escalated" | "resolved";
  unread_count: number;
  last_message: string | null;
  last_at: string;
  created_at: string;
  agent_joined?: boolean;
};
type ChatMessage = {
  id: string;
  session_id: string;
  direction: "in" | "out";
  body: string;
  sent_by: "visitor" | "ai" | "agent";
  timestamp: string;
  created_at?: string;
};

const STATUS_FILTERS = ["Tous", "Non lus", "Lus"] as const;

export default function MessagesPage() {
  const [tab, setTab] = useState<"contact" | "inbox" | "livechat" | "feedback">("contact");

  // ── Contact form messages ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>("Tous");
  const [selected, setSelected] = useState<Message | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/messages");
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(msg: Message, read: boolean) {
    await fetch(`/api/messages/${msg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read } : m));
    if (selected?.id === msg.id) setSelected({ ...msg, read });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce message ?")) return;
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    load();
  }

  const filtered = messages.filter((m) => {
    const matchFilter = filter === "Tous" || (filter === "Non lus" ? !m.read : m.read);
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  const unread = messages.filter((m) => !m.read).length;

  function getInitials(name: string) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
  }

  function formatMessageDate(value: string) {
    const date = new Date(value);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  // ── IMAP Inbox ──
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmailDetail | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [contactAiLoading, setContactAiLoading] = useState(false);
  const [contactReplyText, setContactReplyText] = useState("");
  const [contactReplySent, setContactReplySent] = useState(false);
  const [contactReplying, setContactReplying] = useState(false);

  const loadInbox = useCallback(async () => {
    setInboxLoading(true);
    setInboxError(null);
    try {
      const res = await fetch("/api/inbox");
      const data = await res.json();
      if (data.error) { setInboxError(data.error); return; }
      setInboxEmails(data.emails || []);
    } catch {
      setInboxError("Impossible de se connecter à la boîte mail");
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "inbox") loadInbox();
  }, [tab, loadInbox]);

  async function openEmail(email: InboxEmail) {
    setEmailLoading(true);
    setReplyText("");
    setReplySent(false);
    setAiLoading(false);
    try {
      const res = await fetch(`/api/inbox/${email.uid}`);
      const data = await res.json();
      if (data.error || !data.from) {
        setInboxError(data.error || "Impossible de charger cet email");
        return;
      }
      setSelectedEmail(data);
      setInboxEmails((prev) => prev.map((e) => e.uid === email.uid ? { ...e, read: true } : e));
    } finally {
      setEmailLoading(false);
    }
  }

  async function deleteEmail(uid: number) {
    if (!confirm("Supprimer cet email ?")) return;
    await fetch(`/api/inbox/${uid}`, { method: "DELETE" });
    setInboxEmails((prev) => prev.filter((e) => e.uid !== uid));
    setSelectedEmail(null);
  }

  async function toggleEmailRead(email: InboxEmail) {
    const newRead = !email.read;
    await fetch(`/api/inbox/${email.uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: newRead }),
    });
    setInboxEmails((prev) => prev.map((e) => e.uid === email.uid ? { ...e, read: newRead } : e));
    if (selectedEmail?.uid === email.uid) setSelectedEmail({ ...selectedEmail, read: newRead });
  }

  async function sendReply() {
    if (!selectedEmail || !replyText.trim()) return;
    setReplying(true);
    try {
      await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail.fromAddress,
          subject: `Re: ${selectedEmail.subject}`,
          text: replyText,
        }),
      });
      setReplySent(true);
      setReplyText("");
    } finally {
      setReplying(false);
    }
  }

  async function generateAIReply() {
    if (!selectedEmail) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: selectedEmail.from || selectedEmail.fromAddress,
          subject: selectedEmail.subject,
          message: selectedEmail.text,
        }),
      });
      const data = await res.json();
      if (data.reply) setReplyText(data.reply);
    } finally {
      setAiLoading(false);
    }
  }

  async function generateContactAIReply() {
    if (!selected) return;
    setContactAiLoading(true);
    try {
      const res = await fetch("/api/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: selected.name + " <" + selected.email + ">",
          subject: selected.subject,
          message: selected.message,
        }),
      });
      const data = await res.json();
      if (data.reply) setContactReplyText(data.reply);
    } finally {
      setContactAiLoading(false);
    }
  }

  async function sendContactReply() {
    if (!selected || !contactReplyText.trim()) return;
    setContactReplying(true);
    try {
      await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selected.email,
          subject: `Re: ${selected.subject}`,
          text: contactReplyText,
        }),
      });
      setContactReplySent(true);
      setContactReplyText("");
    } finally {
      setContactReplying(false);
    }
  }

  const inboxUnread = inboxEmails.filter((e) => !e.read).length;

  // ─── WhatsApp state ───────────────────────────────────────────────────────
  type WaConversation = { id: string; name?: string; phone: string; status: "ai" | "escalated" | "resolved"; last_message?: string; last_at: string; unread_count: number };
  const [waConvs, setWaConvs] = useState<WaConversation[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [selectedConv, setSelectedConv] = useState<WaConversation | null>(null);
  const [waStatusFilter, setWaStatusFilter] = useState<"all" | "ai" | "escalated" | "resolved">("all");
  const filteredWaConvs = waConvs.filter(c => waStatusFilter === "all" || c.status === waStatusFilter);
  type WaMessage = { id: string; direction: "in" | "out"; body: string; created_at: string; sent_by?: string; timestamp?: string };
  const [waMessages, setWaMessages] = useState<WaMessage[]>([]);
  const [waMessagesLoading, setWaMessagesLoading] = useState(false);
  const [waReplyText, setWaReplyText] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waSent, setWaSent] = useState(false);
  const waBottomRef = useRef<HTMLDivElement>(null);

  async function loadWaConvs() {
    setWaLoading(true);
    try {
      const res = await fetch("/api/whatsapp/conversations");
      if (res.ok) setWaConvs(await res.json());
    } catch { /* silent */ } finally { setWaLoading(false); }
  }

  async function sendWaReply() {
    if (!selectedConv || !waReplyText.trim()) return;
    setWaSending(true);
    try {
      await fetch(`/api/whatsapp/conversations/${selectedConv!.id}/reply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: waReplyText }),
      });
      setWaMessages(prev => [...prev, { id: Date.now().toString(), direction: "out", body: waReplyText, created_at: new Date().toISOString() }]);
      setWaReplyText(""); setWaSent(true);
    } catch { /* silent */ } finally { setWaSending(false); }
  }

  async function updateConvStatus(id: string, status: WaConversation["status"]) {
    await fetch(`/api/whatsapp/conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setWaConvs(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selectedConv?.id === id) setSelectedConv(prev => prev ? { ...prev, status } : prev);
  }


  const [lcSessions, setLcSessions] = useState<ChatSession[]>([]);
  const [lcLoading, setLcLoading] = useState(false);
  const [lcSelected, setLcSelected] = useState<ChatSession | null>(null);
  const [lcMessages, setLcMessages] = useState<ChatMessage[]>([]);
  const [lcMsgsLoading, setLcMsgsLoading] = useState(false);
  const [lcReply, setLcReply] = useState("");
  const [lcSending, setLcSending] = useState(false);
  const [lcSent, setLcSent] = useState(false);
  const [lcStatusFilter, setLcStatusFilter] = useState<"all" | "ai" | "escalated" | "joined" | "resolved">("all");
  const [lcJoining, setLcJoining] = useState(false);
  const [lcJoinError, setLcJoinError] = useState<string | null>(null);
  const [showEndLcConfirm, setShowEndLcConfirm] = useState(false);
  const [lcClientTyping, setLcClientTyping] = useState(false);
  const lcBottomRef = useRef<HTMLDivElement>(null);
  const lcMsgsContainerRef = useRef<HTMLDivElement>(null);
  const lcPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lcTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lcTypingActiveRef = useRef(false);
  const lcTypingLastSentRef = useRef(0);
  const lcClientTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lcClientTypingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lcChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Feedback ──────────────────────────────────────────────────────────
  type ChatFeedback = { id: string; session_id: string; rating: number; comment: string | null; created_at: string };
  const [feedbacks, setFeedbacks] = useState<ChatFeedback[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    setFeedbacksLoading(true);
    try {
      const res = await fetch("/api/chat/feedback");
      const data = await res.json();
      setFeedbacks(Array.isArray(data) ? data : []);
    } finally {
      setFeedbacksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "feedback") loadFeedbacks();
  }, [tab, loadFeedbacks]);

  const loadLcSessions = useCallback(async () => {
    setLcLoading(true);
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      setLcSessions(Array.isArray(data) ? data : []);
    } finally {
      setLcLoading(false);
    }
  }, []);

  const loadLcMessages = useCallback(async (sessionId: string) => {
    setLcMsgsLoading(true);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      const data = await res.json();
      setLcMessages(Array.isArray(data) ? data : []);
    } finally {
      setLcMsgsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "livechat") {
      loadLcSessions();
      lcPollRef.current = setInterval(async () => {
        const res = await fetch("/api/chat/sessions");
        const data = await res.json();
        if (Array.isArray(data)) setLcSessions(data);
      }, 6000);
    } else {
      if (lcPollRef.current) clearInterval(lcPollRef.current);
    }
    return () => { if (lcPollRef.current) clearInterval(lcPollRef.current); };
  }, [tab, loadLcSessions]);

  useEffect(() => {
    if (!lcSelected) return;
    const iv = setInterval(() => loadLcMessages(lcSelected.id), 6000);
    return () => clearInterval(iv);
  }, [lcSelected, loadLcMessages]);

  // Live client typing, with polling retained as a fallback.
  useEffect(() => {
    if (!lcSelected) {
      setLcClientTyping(false);
      if (lcClientTypingPollRef.current) clearInterval(lcClientTypingPollRef.current);
      return;
    }
    const showClientTyping = (typing: boolean) => {
      if (lcClientTypingTimeoutRef.current) clearTimeout(lcClientTypingTimeoutRef.current);
      setLcClientTyping(typing);
      if (typing) lcClientTypingTimeoutRef.current = setTimeout(() => setLcClientTyping(false), 4500);
    };
    const channel = supabase
      .channel(`chat:${lcSelected.id}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from === "client") showClientTyping(payload.typing !== false);
      })
      .subscribe();
    lcChannelRef.current = channel;
    lcClientTypingPollRef.current = setInterval(async () => {
      const res = await fetch(`/api/chat/typing?session_id=${lcSelected.id}&from=client`).catch(() => null);
      if (res?.ok) { const d = await res.json(); if (d.typing) showClientTyping(true); }
    }, 2000);
    return () => {
      if (lcClientTypingPollRef.current) clearInterval(lcClientTypingPollRef.current);
      if (lcClientTypingTimeoutRef.current) clearTimeout(lcClientTypingTimeoutRef.current);
      lcChannelRef.current = null;
      supabase.removeChannel(channel);
      setLcClientTyping(false);
    };
  }, [lcSelected]);

  useEffect(() => {
    const el = lcMsgsContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lcMessages]);

  // Scroll to bottom when client starts typing so latest messages are visible
  useEffect(() => {
    if (lcClientTyping) {
      const el = lcMsgsContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [lcClientTyping]);

  async function openLcSession(s: ChatSession) {
    setLcSelected(s);
    setLcJoinError(null);
    setLcReply("");
    setLcSent(false);
    await loadLcMessages(s.id);
    setTimeout(() => {
      const el = lcMsgsContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
    await fetch(`/api/chat/sessions/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unread_count: 0 }),
    });
    setLcSessions((prev) => prev.map((c) => c.id === s.id ? { ...c, unread_count: 0 } : c));
  }

  async function joinLcSession(sessionId: string) {
    if (lcJoining) return;
    setLcJoining(true);
    setLcJoinError(null);
    try {
      const res = await fetch("/api/chat/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de rejoindre la conversation");

      setLcSessions((prev) => prev.map((session) => session.id === sessionId
        ? { ...session, status: "escalated", agent_joined: true }
        : session));
      setLcSelected((current) => current?.id === sessionId
        ? { ...current, status: "escalated", agent_joined: true }
        : current);
      await loadLcMessages(sessionId);
      await lcChannelRef.current?.send({
        type: "broadcast",
        event: "agent-joined",
        payload: { at: new Date().toISOString(), agent_name: "Zakaria" },
      });
    } catch (error) {
      setLcJoinError(error instanceof Error ? error.message : "Impossible de rejoindre la conversation");
    } finally {
      setLcJoining(false);
    }
  }

  function signalTyping(sessionId: string, typing = true) {
    lcChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { from: "agent", typing },
    });
    const now = Date.now();
    if (!typing || !lcTypingActiveRef.current || now - lcTypingLastSentRef.current > 1500) {
      lcTypingActiveRef.current = typing;
      lcTypingLastSentRef.current = now;
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, typing, from: "agent" }),
      }).catch(() => {});
    }
    if (lcTypingTimeoutRef.current) clearTimeout(lcTypingTimeoutRef.current);
    if (typing) lcTypingTimeoutRef.current = setTimeout(() => signalTyping(sessionId, false), 3000);
  }

  async function sendLcReply() {
    if (!lcSelected || !lcSelected.agent_joined || lcSelected.status !== "escalated" || !lcReply.trim()) return;
    setLcSending(true);
    // Clear typing indicator immediately on send
    if (lcTypingTimeoutRef.current) clearTimeout(lcTypingTimeoutRef.current);
    signalTyping(lcSelected.id, false);
    try {
      await fetch("/api/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: lcSelected.id, body: lcReply.trim() }),
      });
      setLcSent(true);
      setLcReply("");
      await loadLcMessages(lcSelected.id);
    } finally {
      setLcSending(false);
    }
  }

  async function updateLcStatus(id: string, status: ChatSession["status"]) {
    await fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLcSessions((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    if (lcSelected?.id === id) setLcSelected((c) => c ? { ...c, status } : c);
  }

  const filteredLcSessions = lcSessions.filter((s) => {
    if (lcStatusFilter === "all") return true;
    if (lcStatusFilter === "joined") return s.status === "escalated" && Boolean(s.agent_joined);
    if (lcStatusFilter === "escalated") return s.status === "escalated" && !s.agent_joined;
    return s.status === lcStatusFilter;
  });
  const lcEscalated = lcSessions.filter((s) => s.status === "escalated" && !s.agent_joined).length;
  const lcTotalUnread = lcSessions.reduce((s, c) => s + c.unread_count, 0);

  function lcStatusBadge(session: Pick<ChatSession, "status" | "agent_joined">) {
    if (session.status === "escalated" && session.agent_joined)
      return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-700">EN COURS</span>;
    if (session.status === "escalated")
      return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-black text-orange-700">AGENT REQUIS</span>;
    if (session.status === "resolved")
      return <span className="bg-neutral-100 text-neutral-400 text-[9px] font-black px-1.5 py-0.5 rounded-full">RÉSOLU</span>;
    return <span className="bg-green-100 text-green-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">IA</span>;
  }

  function waStatusBadge(status: "ai" | "escalated" | "resolved") {
    if (status === "escalated")
      return <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">AGENT</span>;
    if (status === "resolved")
      return <span className="bg-neutral-100 text-neutral-400 text-[9px] font-black px-1.5 py-0.5 rounded-full">RÉSOLU</span>;
    return <span className="bg-green-100 text-green-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">IA</span>;
  }

  function formatWaTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("fr-FR");
  }

  return (
    <div className="max-w-6xl pb-10">
      <div className="mb-6 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">Centre de messages</h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-500 sm:text-sm">Gérez toutes les conversations clients depuis un seul espace.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 sm:min-w-24">
              <p className="text-lg font-black leading-none text-blue-700">{unread}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-600/70">Contacts</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 sm:min-w-24">
              <p className="text-lg font-black leading-none text-emerald-700">{inboxUnread}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600/70">E-mails</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 sm:min-w-24">
              <p className="text-lg font-black leading-none text-violet-700">{lcTotalUnread}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-violet-600/70">Chats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="mb-5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm md:w-fit">
          <button onClick={() => setTab("contact")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${tab === "contact" ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-black"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Contact
            {unread > 0 && <span className={`${tab === "contact" ? "bg-white text-black" : "bg-blue-500 text-white"} rounded-full px-1.5 py-0.5 text-[9px] font-black`}>{unread}</span>}
          </button>
          <button onClick={() => setTab("inbox")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${tab === "inbox" ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-black"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7"/></svg>
            E-mail
            {inboxUnread > 0 && <span className="bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{inboxUnread}</span>}
          </button>
          <button onClick={() => setTab("livechat")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${tab === "livechat" ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-black"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Live Chat
            {lcTotalUnread > 0 && <span className="bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{lcTotalUnread}</span>}
            {lcEscalated > 0 && <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{lcEscalated}</span>}
          </button>
          <button onClick={() => setTab("feedback")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${tab === "feedback" ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-black"}`}>
            ⭐ Avis
          </button>
        </div>
      </div>

      {/* ── CONTACT FORM TAB ── */}
      {tab === "contact" && (
      <div className="flex gap-5">
        {/* Left: list */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
              {STATUS_FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:flex-none ${filter === f ? "bg-neutral-950 text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}>
                  {f}
                  {f === "Non lus" && unread > 0 && <span className={`ml-1.5 ${filter === f ? "text-white/70" : "text-blue-600"}`}>{unread}</span>}
                </button>
              ))}
            </div>
            <label className="group relative block sm:w-64">
              <span className="sr-only">Rechercher un message</span>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-black" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, e-mail ou sujet…"
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-xs shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100" />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-sm font-black text-neutral-900">Demandes de contact</h2>
                <p className="mt-0.5 text-[11px] text-neutral-400">{filtered.length} message{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={load} disabled={loading} aria-label="Actualiser les messages" className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-black disabled:opacity-40">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={loading ? "animate-spin" : ""}><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6.1 6.1L4 8M5.5 15A7 7 0 0 0 17.9 17.9L20 16"/></svg>
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-neutral-400">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-600">Aucun message</p>
                <p className="text-xs text-neutral-400 mt-1">Les messages du formulaire de contact apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filtered.map((m) => (
                  <button key={m.id} onClick={() => { setSelected(m); setContactReplyText(""); setContactReplySent(false); if (!m.read) markRead(m, true); }}
                    className={`group w-full px-4 py-4 text-left transition-colors sm:px-5 ${selected?.id === m.id ? "bg-blue-50/60" : "hover:bg-neutral-50"}`}>
                    <div className="flex items-start gap-3.5">
                      <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black ${m.read ? "bg-neutral-100 text-neutral-500" : "bg-blue-600 text-white shadow-sm shadow-blue-200"}`}>
                        {getInitials(m.name)}
                        {!m.read && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-sm ${m.read ? "font-semibold text-neutral-700" : "font-black text-neutral-950"}`}>{m.name}</p>
                          <p className={`flex-shrink-0 text-[10px] font-semibold ${m.read ? "text-neutral-400" : "text-blue-600"}`}>{formatMessageDate(m.created_at)}</p>
                        </div>
                        <p className={`mt-0.5 truncate text-xs ${m.read ? "text-neutral-500" : "font-semibold text-neutral-700"}`}>{m.subject}</p>
                        <p className="mt-1 truncate text-[11px] text-neutral-400">{m.message || m.email}</p>
                      </div>
                      <svg className="mt-3 hidden flex-shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500 sm:block" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail — fullscreen overlay on mobile */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-white overflow-auto md:relative md:inset-auto md:z-auto md:w-80 md:flex-shrink-0">
            <div className="bg-white md:border md:border-neutral-100 md:rounded-2xl p-5 md:sticky md:top-24 min-h-full md:min-h-0">
              {/* Mobile back bar */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-100">
                <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  <span className="md:hidden">Retour</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{selected.name}</p>
                  <p className="text-xs text-neutral-400 truncate">{selected.email}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Sujet</p>
              <p className="text-sm font-semibold mb-4">{selected.subject}</p>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Message</p>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-col gap-2">
                {/* AI Reply */}
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Répondre</p>
                <button onClick={generateContactAIReply} disabled={contactAiLoading}
                  className="w-full flex items-center justify-center gap-1.5 border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold py-2.5 rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-50">
                  {contactAiLoading ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                  ) : "✨"}
                  {contactAiLoading ? "Génération…" : "Générer une réponse IA"}
                </button>
                {contactReplySent ? (
                  <div className="text-xs text-green-600 font-semibold bg-green-50 rounded-xl p-3 text-center">✓ Réponse envoyée</div>
                ) : (
                  <>
                    <textarea value={contactReplyText} onChange={(e) => { setContactReplyText(e.target.value); setContactReplySent(false); }}
                      placeholder="Réponse (ou cliquez IA pour générer)…"
                      rows={4}
                      className="w-full border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:border-black resize-none" />
                    <button onClick={sendContactReply} disabled={contactReplying || !contactReplyText.trim()}
                      className="w-full bg-black text-white text-xs font-bold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40">
                      {contactReplying ? "Envoi…" : "Envoyer la réponse"}
                    </button>
                  </>
                )}
                <button onClick={() => markRead(selected, !selected.read)}
                  className="w-full border border-neutral-200 text-xs font-semibold py-2 rounded-xl hover:bg-neutral-50 transition-colors mt-1">
                  Marquer comme {selected.read ? "non lu" : "lu"}
                </button>
                <button onClick={() => handleDelete(selected.id)}
                  className="w-full text-xs font-semibold text-red-400 hover:text-red-600 py-1 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )} {/* end contact tab */}

      {/* ── INBOX TAB ── */}
      {tab === "inbox" && (
        <div className="flex gap-5">
          {/* Left: email list */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-neutral-400">Boîte de réception — <span className="font-semibold text-neutral-600">contact@lecomax.com</span></p>
              <button onClick={loadInbox} disabled={inboxLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors disabled:opacity-40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={inboxLoading ? "animate-spin" : ""}>
                  <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Actualiser
              </button>
            </div>

            {inboxError ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-red-600 mb-1">Connexion impossible</p>
                <p className="text-xs text-red-400">{inboxError}</p>
                {inboxError.includes("PRIVATE_EMAIL_PASS") && (
                  <p className="text-xs text-neutral-500 mt-3">Ajoutez <code className="bg-neutral-100 px-1 rounded">PRIVATE_EMAIL_PASS</code> dans les variables d&apos;environnement Vercel.</p>
                )}
              </div>
            ) : inboxLoading ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center text-sm text-neutral-400">Chargement de la boîte mail…</div>
            ) : inboxEmails.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-600">Aucun email</p>
              </div>
            ) : (
              <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                <div className="divide-y divide-neutral-50">
                  {inboxEmails.map((email) => (
                    <button key={email.uid} onClick={() => openEmail(email)}
                      className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors ${selectedEmail?.uid === email.uid ? "bg-neutral-50" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${email.read ? "bg-transparent" : "bg-green-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${email.read ? "font-medium text-neutral-600" : "font-bold text-black"}`}>
                              {(email.from?.replace(/<.*>/, "").trim()) || email.fromAddress || "Inconnu"}
                            </p>
                            <p className="text-[10px] text-neutral-400 flex-shrink-0">
                              {new Date(email.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <p className="text-xs text-neutral-400 truncate">{email.fromAddress}</p>
                          <p className={`text-xs mt-0.5 truncate ${email.read ? "text-neutral-400" : "text-neutral-600 font-medium"}`}>{email.subject}</p>
                        </div>
                        {email.hasAttachment && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300 flex-shrink-0 mt-1">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: email detail — fullscreen overlay on mobile */}
          {(selectedEmail || emailLoading) && (
            <div className="fixed inset-0 z-50 bg-white overflow-auto md:relative md:inset-auto md:z-auto md:w-80 md:flex-shrink-0">
              <div className="bg-white md:border md:border-neutral-100 md:rounded-2xl p-5 md:sticky md:top-24 min-h-full md:min-h-0">
                {emailLoading ? (
                  <div className="text-sm text-neutral-400 text-center py-8">Chargement…</div>
                ) : selectedEmail ? (
                  <>
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-100">
                      <button onClick={() => setSelectedEmail(null)} className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                        <span className="md:hidden">Retour</span>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{(selectedEmail.from?.replace(/<.*>/, "").trim()) || selectedEmail.fromAddress || "Inconnu"}</p>
                        <p className="text-xs text-neutral-400 truncate">{selectedEmail.fromAddress}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(selectedEmail.date).toLocaleString("fr-FR")}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Sujet</p>
                    <p className="text-sm font-semibold mb-4">{selectedEmail.subject}</p>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Message</p>
                    <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto mb-4 border border-neutral-100 rounded-xl p-3 bg-neutral-50">
                      {selectedEmail.text || "(pas de contenu texte)"}
                    </div>

                    {/* Reply */}
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Répondre</p>
                    <button onClick={generateAIReply} disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-1.5 border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold py-2 rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-50 mb-2">
                      {aiLoading ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                      ) : "✨"}
                      {aiLoading ? "Génération…" : "Générer une réponse IA"}
                    </button>
                    {replySent ? (
                      <div className="text-xs text-green-600 font-semibold bg-green-50 rounded-xl p-3 text-center">✓ Réponse envoyée</div>
                    ) : (
                      <>
                        <textarea value={replyText} onChange={(e) => { setReplyText(e.target.value); setReplySent(false); }}
                          placeholder="Réponse (ou cliquez IA pour générer)…"
                          rows={4}
                          className="w-full border border-neutral-200 rounded-xl p-3 text-xs focus:outline-none focus:border-black resize-none mb-2" />
                        <button onClick={sendReply} disabled={replying || !replyText.trim()}
                          className="w-full bg-black text-white text-xs font-bold py-2.5 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-40">
                          {replying ? "Envoi…" : "Envoyer la réponse"}
                        </button>
                      </>
                    )}

                    <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-1.5">
                      <button onClick={() => selectedEmail && toggleEmailRead(selectedEmail)}
                        className="w-full border border-neutral-200 text-xs font-semibold py-2 rounded-xl hover:bg-neutral-50 transition-colors">
                        Marquer comme {selectedEmail.read ? "non lu" : "lu"}
                      </button>
                      <button onClick={() => deleteEmail(selectedEmail.uid)}
                        className="w-full text-xs font-semibold text-red-400 hover:text-red-600 py-1 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )} {/* end inbox tab */}

      {/* WhatsApp tab removed */}
      {false && (
        <div className="flex gap-5">
          {/* Left: conversation list */}
          <div className="flex-1 min-w-0">
            {/* Filter + refresh */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {(["all", "escalated", "ai", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setWaStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${waStatusFilter === f ? "bg-black text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
                  {f === "all" ? "Tous" : f === "escalated" ? "🟠 Agent requis" : f === "ai" ? "🤖 IA" : "✓ Résolus"}
                </button>
              ))}
              <button onClick={loadWaConvs} disabled={waLoading}
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors disabled:opacity-40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={waLoading ? "animate-spin" : ""}>
                  <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Actualiser
              </button>
            </div>

            {waLoading && waConvs.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center text-sm text-neutral-400">Chargement…</div>
            ) : filteredWaConvs.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#e7fbe9" }}>
                  <svg width="26" height="26" viewBox="0 0 48 48" fill="#25D366">
                    <path d="M24 4C13 4 4 13 4 24c0 3.6 1 7 2.7 10L4 44l10.3-2.7C17.1 43 20.5 44 24 44c11 0 20-9 20-20S35 4 24 4z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-600">Aucune conversation</p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  Les conversations WhatsApp apparaîtront ici une fois que des clients vous écriront.
                </p>
                <p className="text-[10px] text-neutral-300 mt-3">
                  Assurez-vous d&apos;avoir configuré WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN et WHATSAPP_VERIFY_TOKEN.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                <div className="divide-y divide-neutral-50">
                  {filteredWaConvs.map((conv) => (
                    <button key={conv.id} onClick={() => setSelectedConv(conv)}
                      className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors ${selectedConv?.id === conv.id ? "bg-neutral-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                          style={{ backgroundColor: "#25D366" }}>
                          {(conv.name || conv.phone).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className={`text-sm truncate ${conv.unread_count > 0 ? "font-bold text-black" : "font-medium text-neutral-600"}`}>
                                {conv.name || conv.phone}
                              </p>
                              {waStatusBadge(conv.status)}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {conv.unread_count > 0 && (
                                <span className="bg-[#25D366] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                  {conv.unread_count > 9 ? "9+" : conv.unread_count}
                                </span>
                              )}
                              <p className="text-[10px] text-neutral-400">{formatWaTime(conv.last_at)}</p>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {conv.phone !== conv.name ? `+${conv.phone}` : ""}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? "text-neutral-600 font-medium" : "text-neutral-400"}`}>
                            {conv.last_message || "—"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: chat panel */}
          {selectedConv && (
            <div className="w-96 flex-shrink-0">
              <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden flex flex-col sticky top-24" style={{ maxHeight: "calc(100vh - 160px)" }}>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: "#25D366" }}>
                    {(selectedConv!.name || selectedConv!.phone).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{selectedConv!.name || selectedConv!.phone}</p>
                    <p className="text-[10px] text-neutral-400">+{selectedConv!.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {waStatusBadge(selectedConv!.status)}
                    <button onClick={() => setSelectedConv(null)} className="text-neutral-300 hover:text-black transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>

                {/* Status actions */}
                <div className="flex gap-1.5 px-4 py-2 border-b border-neutral-100 bg-neutral-50">
                  {selectedConv!.status !== "ai" && (
                    <button onClick={() => updateConvStatus(selectedConv!.id, "ai")}
                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                      🤖 Remettre à l&apos;IA
                    </button>
                  )}
                  {selectedConv!.status !== "escalated" && (
                    <button onClick={() => updateConvStatus(selectedConv!.id, "escalated")}
                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                      👤 Prendre en charge
                    </button>
                  )}
                  {selectedConv!.status !== "resolved" && (
                    <button onClick={() => updateConvStatus(selectedConv!.id, "resolved")}
                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors">
                      ✓ Résoudre
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div ref={lcMsgsContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: 200 }}>
                  {waMessagesLoading && waMessages.length === 0 ? (
                    <div className="text-center text-xs text-neutral-400 py-8">Chargement…</div>
                  ) : waMessages.length === 0 ? (
                    <div className="text-center text-xs text-neutral-400 py-8">Aucun message</div>
                  ) : (
                    waMessages.map((msg) => {
                      const isOut = msg.direction === "out";
                      return (
                        <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                            isOut
                              ? msg.sent_by === "agent"
                                ? "bg-blue-500 text-white rounded-br-sm"
                                : "bg-[#25D366] text-white rounded-br-sm"
                              : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                          }`}>
                            {isOut && (
                              <p className="text-[9px] font-bold mb-0.5 opacity-70">
                                {msg.sent_by === "agent" ? "Agent" : "IA"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{msg.body}</p>
                            <p className="text-[9px] opacity-60 mt-1 text-right">{formatWaTime(msg.timestamp ?? msg.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={waBottomRef} />
                </div>

                {/* Reply box */}
                <div className="border-t border-neutral-100 p-3">
                  {selectedConv!.status === "ai" && (
                    <div className="flex items-center gap-1.5 mb-2 bg-green-50 rounded-xl px-3 py-2">
                      <svg width="10" height="10" viewBox="0 0 48 48" fill="#25D366">
                        <path d="M24 4C13 4 4 13 4 24c0 3.6 1 7 2.7 10L4 44l10.3-2.7C17.1 43 20.5 44 24 44c11 0 20-9 20-20S35 4 24 4z"/>
                      </svg>
                      <p className="text-[10px] text-green-700 font-semibold">L&apos;IA répond automatiquement. Cliquez &quot;Prendre en charge&quot; pour répondre manuellement.</p>
                    </div>
                  )}
                  {waSent && (
                    <div className="text-[10px] text-green-600 font-semibold bg-green-50 rounded-xl p-2 text-center mb-2">✓ Message envoyé</div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={waReplyText}
                      onChange={(e) => { setWaReplyText(e.target.value); setWaSent(false); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendWaReply(); } }}
                      placeholder={selectedConv!.status === "ai" ? "Prenez en charge pour répondre…" : "Répondre… (Entrée pour envoyer)"}
                      rows={2}
                      disabled={selectedConv!.status === "ai"}
                      className="flex-1 border border-neutral-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-black resize-none disabled:opacity-40 disabled:bg-neutral-50"
                    />
                    <button
                      onClick={sendWaReply}
                      disabled={waSending || !waReplyText.trim() || selectedConv!.status === "ai"}
                      className="self-end p-2.5 rounded-xl text-white transition-colors disabled:opacity-40"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      {waSending ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="animate-spin"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )} {/* end whatsapp tab */}

      {/* ── LIVE CHAT TAB ── */}
      {tab === "livechat" && (
        <div className="flex gap-5">
          {/* Left: session list */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["all", "escalated", "joined", "ai", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setLcStatusFilter(f)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all ${lcStatusFilter === f ? "bg-neutral-950 text-white shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}>
                  {f === "all" ? "Tous" : f === "escalated" ? `Agent requis${lcEscalated ? ` · ${lcEscalated}` : ""}` : f === "joined" ? "En cours" : f === "ai" ? "IA" : "Résolus"}
                </button>
              ))}
              </div>
              <button onClick={loadLcSessions} disabled={lcLoading}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-bold text-neutral-500 shadow-sm transition-colors hover:text-black disabled:opacity-40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={lcLoading ? "animate-spin" : ""}>
                  <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Actualiser
              </button>
            </div>

            {lcLoading && lcSessions.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center text-sm text-neutral-400">Chargement…</div>
            ) : filteredLcSessions.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-neutral-600">Aucune conversation</p>
                <p className="text-xs text-neutral-400 mt-1">Les chats en direct apparaîtront ici quand des visiteurs vous écriront.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
                  <div>
                    <h2 className="text-sm font-black text-neutral-900">Conversations en direct</h2>
                    <p className="mt-0.5 text-[11px] text-neutral-400">{filteredLcSessions.length} conversation{filteredLcSessions.length !== 1 ? "s" : ""}</p>
                  </div>
                  {lcEscalated > 0 && <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />{lcEscalated} en attente</span>}
                </div>
                <div className="divide-y divide-neutral-100">
                  {filteredLcSessions.map((s) => (
                    <button key={s.id} onClick={() => openLcSession(s)}
                      className={`group w-full px-4 py-4 text-left transition-colors sm:px-5 ${lcSelected?.id === s.id ? "bg-violet-50/60" : "hover:bg-neutral-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${s.status === "escalated" && !s.agent_joined ? "bg-orange-500 shadow-sm shadow-orange-200" : s.agent_joined && s.status === "escalated" ? "bg-blue-600 shadow-sm shadow-blue-200" : "bg-violet-500"}`}>
                          {(s.name || "V").charAt(0).toUpperCase()}
                          {s.status === "escalated" && !s.agent_joined && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-orange-400"><span className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-60" /></span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className={`text-sm truncate ${s.unread_count > 0 ? "font-bold text-black" : "font-medium text-neutral-600"}`}>
                                {s.name || "Visiteur"}
                              </p>
                              {lcStatusBadge(s)}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {s.unread_count > 0 && (
                                <span className="bg-purple-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                  {s.unread_count > 9 ? "9+" : s.unread_count}
                                </span>
                              )}
                              <p className="text-[10px] text-neutral-400">{formatWaTime(s.last_at)}</p>
                            </div>
                          </div>
                          <p className={`text-xs truncate mt-0.5 ${s.unread_count > 0 ? "text-neutral-600 font-medium" : "text-neutral-400"}`}>
                            {s.last_message || "—"}
                          </p>
                        </div>
                        <svg className="hidden flex-shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500 sm:block" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: chat panel — fullscreen overlay on mobile */}
          {lcSelected && (
            <div className="fixed inset-0 z-50 flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-white md:sticky md:top-24 md:inset-auto md:z-auto md:h-[calc(100vh-160px)] md:min-h-[480px] md:max-h-[760px] md:w-[28rem] md:flex-shrink-0 md:rounded-2xl md:border md:border-neutral-200 md:shadow-sm xl:w-[32rem]">
              <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
                {/* End conversation confirmation overlay */}
                {showEndLcConfirm && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-2xl">
                    <div className="bg-white rounded-2xl shadow-2xl p-5 mx-4 flex flex-col items-center gap-3" style={{ maxWidth: 280, width: "100%" }}>
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.37 2.05.57 3.16.57A2.27 2.27 0 0 1 23 17.02v3.23A2.27 2.27 0 0 1 20.73 22C10.91 22 2 13.1 2 3.27A2.27 2.27 0 0 1 4.27 1h3.23A2.27 2.27 0 0 1 9.77 3.27c0 1.11.2 2.18.57 3.16a2 2 0 0 1-.45 2.11L8.62 9.81"/>
                          <line x1="22" y1="2" x2="2" y2="22"/>
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-neutral-900 text-sm">Terminer la conversation ?</p>
                        <p className="text-neutral-500 text-[11px] mt-1">Le client verra un message de fin et pourra démarrer une nouvelle conversation.</p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button onClick={() => setShowEndLcConfirm(false)}
                          className="flex-1 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                          Annuler
                        </button>
                        <button onClick={() => { setShowEndLcConfirm(false); updateLcStatus(lcSelected.id, "resolved"); }}
                          className="flex-1 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
                          Terminer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex flex-shrink-0 items-center gap-3 border-b border-neutral-100 bg-white px-4 py-3.5">
                  <button onClick={() => setLcSelected(null)} aria-label="Retour aux conversations" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-black md:hidden">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  </button>
                  <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${lcSelected.status === "escalated" && !lcSelected.agent_joined ? "bg-orange-500" : lcSelected.agent_joined && lcSelected.status === "escalated" ? "bg-blue-600" : "bg-violet-500"}`}>
                    {(lcSelected.name || "V").charAt(0).toUpperCase()}
                    {lcSelected.agent_joined && lcSelected.status === "escalated" && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{lcSelected.name || "Visiteur"}</p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">Client · {lcSelected.visitor_id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lcStatusBadge(lcSelected)}
                    <button onClick={() => setLcSelected(null)} aria-label="Fermer la conversation" className="hidden h-8 w-8 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-black md:flex">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>

                {/* Status actions */}
                {lcSelected.status === "escalated" && !lcSelected.agent_joined ? (
                  <div className="flex-shrink-0 border-b border-orange-100 bg-orange-50/70 p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="relative mt-1 flex h-2.5 w-2.5 flex-shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500"/></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-orange-950">Ce client attend un conseiller</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-orange-700">Rejoignez le chat pour arrêter l&apos;IA et informer immédiatement le client.</p>
                        <button onClick={() => joinLcSession(lcSelected.id)} disabled={lcJoining}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-orange-700 disabled:cursor-wait disabled:opacity-60">
                          {lcJoining ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>}
                          {lcJoining ? "Connexion en cours…" : "Rejoindre et répondre"}
                        </button>
                        {lcJoinError && <p role="alert" className="mt-2 text-[10px] font-semibold text-red-600">{lcJoinError}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-shrink-0 items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-3.5 py-2.5">
                    {lcSelected.status === "escalated" && lcSelected.agent_joined && <div className="mr-auto flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-[10px] font-bold text-neutral-600">Vous gérez cette conversation</span></div>}
                    {lcSelected.status === "ai" && <div className="mr-auto text-[10px] font-semibold text-emerald-700">Eco répond actuellement au client</div>}
                    {lcSelected.status === "resolved" && <div className="mr-auto text-[10px] font-semibold text-neutral-500">Conversation terminée</div>}
                    {lcSelected.status !== "ai" && (
                      <button onClick={() => updateLcStatus(lcSelected.id, "ai")} className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-neutral-600 transition-colors hover:bg-neutral-100">Remettre à l&apos;IA</button>
                    )}
                    {lcSelected.status !== "escalated" && (
                      <button onClick={() => joinLcSession(lcSelected.id)} disabled={lcJoining} className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">{lcSelected.status === "resolved" ? "Rouvrir et rejoindre" : "Rejoindre"}</button>
                    )}
                    {lcSelected.status !== "resolved" && (
                      <button onClick={() => setShowEndLcConfirm(true)} aria-label="Terminer la conversation" className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12h8"/></svg></button>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div ref={lcMsgsContainerRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-3 pb-5">
                  {lcMsgsLoading && lcMessages.length === 0 ? (
                    <div className="text-center text-xs text-neutral-400 py-8">Chargement…</div>
                  ) : lcMessages.length === 0 ? (
                    <div className="text-center text-xs text-neutral-400 py-8">Aucun message</div>
                  ) : (
                    lcMessages.map((msg, messageIndex) => {
                      const isOut = msg.direction === "out";
                      if (msg.body === "__AGENT_JOINED__") {
                        if (lcMessages[messageIndex - 1]?.body === "__AGENT_JOINED__") return null;
                        return (
                          <div key={msg.id} className="flex justify-center py-2">
                            <span className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Vous avez rejoint la conversation</span>
                          </div>
                        );
                      }
                      return (
                        <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                            isOut
                              ? msg.sent_by === "agent"
                                ? "bg-blue-500 text-white rounded-br-sm"
                                : "bg-black text-white rounded-br-sm"
                              : "bg-neutral-100 text-neutral-800 rounded-bl-sm"
                          }`}>
                            {isOut && (
                              <p className="text-[9px] font-bold mb-0.5 opacity-70">
                                {msg.sent_by === "agent" ? "Vous" : "IA"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{msg.body}</p>
                            <p className="text-[9px] opacity-60 mt-1 text-right">{formatWaTime(msg.timestamp ?? msg.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <style>{`@keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}`}</style>
                  <div ref={lcBottomRef} />
                </div>

                {/* Client typing indicator — pinned above reply box */}
                {lcClientTyping && (
                  <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2"
                    style={{ borderTop:"1px solid #f3e8ff", background:"linear-gradient(90deg,#faf5ff,#fff)" }}>
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                      {(lcSelected.name || "V").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-purple-500 font-semibold">{lcSelected.name || "Visiteur"}</span>
                      <span className="text-[10px] text-neutral-400">est en train d&apos;écrire</span>
                      <div className="flex gap-0.5 items-end pb-0.5">
                        {[0, 150, 300].map((d, i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"
                            style={{ animation: `typingDot 1.2s ease-in-out ${d}ms infinite` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply box */}
                <div className="relative z-10 flex-shrink-0 border-t border-neutral-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
                  {lcSelected.status === "escalated" && lcSelected.agent_joined ? (
                    <>
                      {lcSent && <div className="mb-2 rounded-xl bg-emerald-50 p-2 text-center text-[10px] font-semibold text-emerald-700">✓ Message envoyé</div>}
                      <div className="flex items-end gap-2">
                        <textarea
                          value={lcReply}
                          onChange={(e) => { setLcReply(e.target.value); setLcSent(false); signalTyping(lcSelected.id, e.target.value.length > 0); }}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendLcReply(); } }}
                          placeholder="Écrivez votre réponse…"
                          rows={2}
                          autoFocus
                          className="min-h-[48px] flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-all placeholder:text-neutral-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                        <button onClick={sendLcReply} disabled={lcSending || !lcReply.trim()} aria-label="Envoyer la réponse"
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
                          {lcSending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>}
                        </button>
                      </div>
                      <p className="mt-1.5 px-1 text-[9px] text-neutral-400">Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</p>
                    </>
                  ) : (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${lcSelected.status === "resolved" ? "bg-blue-100 text-blue-700" : lcSelected.status === "ai" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-neutral-800">{lcSelected.status === "resolved" ? "Conversation terminée" : lcSelected.status === "ai" ? "Conversation gérée par Eco" : "Client en attente"}</p>
                          <p className="text-[9px] text-neutral-500">Rejoignez-la pour activer la zone de réponse.</p>
                        </div>
                      </div>
                      <button onClick={() => joinLcSession(lcSelected.id)} disabled={lcJoining}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all disabled:cursor-wait disabled:opacity-60 ${lcSelected.status === "escalated" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                        {lcJoining ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>}
                        {lcJoining ? "Connexion…" : lcSelected.status === "resolved" ? "Rouvrir, rejoindre et répondre" : "Rejoindre et commencer à répondre"}
                      </button>
                      {lcJoinError && <p role="alert" className="mt-2 text-center text-[10px] font-semibold text-red-600">{lcJoinError}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )} {/* end livechat tab */}

      {/* ── FEEDBACK TAB ── */}
      {tab === "feedback" && (
        <div>
          {feedbacksLoading ? (
            <div className="flex justify-center py-16 text-neutral-400 text-sm">Chargement…</div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
              <span className="text-4xl">⭐</span>
              <p className="text-sm font-medium">Aucun avis pour le moment</p>
              <p className="text-xs">Les avis apparaîtront ici après chaque conversation.</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-6 bg-white rounded-2xl p-4 mb-5 shadow-sm border border-neutral-100">
                <div className="text-center">
                  <p className="text-3xl font-black text-black">
                    {(feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">Note moyenne</p>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((star) => {
                    const avg = feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length;
                    return <span key={star} className={`text-2xl ${star <= Math.round(avg) ? "text-amber-400" : "text-neutral-200"}`}>★</span>;
                  })}
                </div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-black text-black">{feedbacks.length}</p>
                  <p className="text-xs text-neutral-500">avis total</p>
                </div>
                <button onClick={loadFeedbacks} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors" title="Actualiser">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                </button>
              </div>

              {/* Rating breakdown */}
              <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-neutral-100">
                <p className="text-xs font-bold text-neutral-700 mb-3">Répartition des notes</p>
                {[5,4,3,2,1].map((star) => {
                  const count = feedbacks.filter((f) => f.rating === star).length;
                  const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 mb-2">
                      <span className="text-xs w-4 text-right text-neutral-600">{star}</span>
                      <span className="text-amber-400 text-xs">★</span>
                      <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-neutral-400 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Feedback list */}
              <div className="flex flex-col gap-3">
                {feedbacks.map((f) => (
                  <div key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((star) => (
                          <span key={star} className={`text-lg ${star <= f.rating ? "text-amber-400" : "text-neutral-200"}`}>★</span>
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                        {new Date(f.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {f.comment && (
                      <p className="text-sm text-neutral-700 mt-2 leading-relaxed">&ldquo;{f.comment}&rdquo;</p>
                    )}
                    <p className="text-[10px] text-neutral-300 mt-2 font-mono">Session: {f.session_id?.slice(0, 8)}…</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )} {/* end feedback tab */}
    </div>
  );
}
