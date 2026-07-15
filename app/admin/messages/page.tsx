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
  const [lcStatusFilter, setLcStatusFilter] = useState<"all" | "ai" | "escalated" | "resolved">("all");
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
    // Send agent-joined system message visible to the client
    await fetch("/api/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, body: "__AGENT_JOINED__" }),
    });
    await updateLcStatus(sessionId, "escalated");
    await loadLcMessages(sessionId);
    lcChannelRef.current?.send({
      type: "broadcast",
      event: "agent-joined",
      payload: { at: new Date().toISOString() },
    });
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
    if (!lcSelected || !lcReply.trim()) return;
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

  const filteredLcSessions = lcSessions.filter((s) =>
    lcStatusFilter === "all" ? true : s.status === lcStatusFilter
  );
  const lcEscalated = lcSessions.filter((s) => s.status === "escalated").length;
  const lcTotalUnread = lcSessions.reduce((s, c) => s + c.unread_count, 0);

  function lcStatusBadge(status: ChatSession["status"]) {
    if (status === "escalated")
      return <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">AGENT</span>;
    if (status === "resolved")
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
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-black">Messages</h1>
          {unread > 0 && <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unread} non lus</span>}
          {inboxUnread > 0 && <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{inboxUnread} inbox</span>}
          {lcEscalated > 0 && <span className="bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{lcEscalated} chat</span>}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">Formulaire de contact, boîte de réception &amp; Live Chat</p>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-5">
        <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-max min-w-full md:w-fit">
          <button onClick={() => setTab("contact")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === "contact" ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Contact
            {unread > 0 && <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>}
          </button>
          <button onClick={() => setTab("inbox")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === "inbox" ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 7 10-7"/></svg>
            E-mail
            {inboxUnread > 0 && <span className="bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{inboxUnread}</span>}
          </button>
          <button onClick={() => setTab("livechat")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === "livechat" ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Live Chat
            {lcTotalUnread > 0 && <span className="bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{lcTotalUnread}</span>}
            {lcEscalated > 0 && <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{lcEscalated}</span>}
          </button>
          <button onClick={() => setTab("feedback")}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === "feedback" ? "bg-white shadow-sm text-black" : "text-neutral-500 hover:text-black"}`}>
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
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? "bg-black text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
                {f}
              </button>
            ))}
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
              className="ml-auto border border-neutral-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-black bg-white w-32 md:w-44 transition-all" />
          </div>

          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
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
              <div className="divide-y divide-neutral-50">
                {filtered.map((m) => (
                  <button key={m.id} onClick={() => { setSelected(m); setContactReplyText(""); setContactReplySent(false); if (!m.read) markRead(m, true); }}
                    className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors ${selected?.id === m.id ? "bg-neutral-50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${m.read ? "bg-transparent" : "bg-blue-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${m.read ? "font-medium text-neutral-600" : "font-bold text-black"}`}>{m.name}</p>
                          <p className="text-[10px] text-neutral-400 flex-shrink-0">{new Date(m.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <p className="text-xs text-neutral-400 truncate">{m.email}</p>
                        <p className={`text-xs mt-0.5 truncate ${m.read ? "text-neutral-400" : "text-neutral-600 font-medium"}`}>{m.subject}</p>
                      </div>
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
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {(["all", "escalated", "ai", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setLcStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${lcStatusFilter === f ? "bg-black text-white" : "bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400"}`}>
                  {f === "all" ? "Tous" : f === "escalated" ? "🟠 Agent requis" : f === "ai" ? "🤖 IA" : "✓ Résolus"}
                </button>
              ))}
              <button onClick={loadLcSessions} disabled={lcLoading}
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors disabled:opacity-40">
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
              <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                <div className="divide-y divide-neutral-50">
                  {filteredLcSessions.map((s) => (
                    <button key={s.id} onClick={() => openLcSession(s)}
                      className={`w-full text-left px-5 py-4 hover:bg-neutral-50 transition-colors ${lcSelected?.id === s.id ? "bg-neutral-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                          {(s.name || "V").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className={`text-sm truncate ${s.unread_count > 0 ? "font-bold text-black" : "font-medium text-neutral-600"}`}>
                                {s.name || "Visiteur"}
                              </p>
                              {lcStatusBadge(s.status)}
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
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: chat panel — fullscreen overlay on mobile */}
          {lcSelected && (
            <div className="fixed inset-0 z-50 bg-white flex flex-col md:relative md:inset-auto md:z-auto md:w-96 md:flex-shrink-0">
              <div className="bg-white md:border md:border-neutral-100 md:rounded-2xl overflow-hidden flex flex-col flex-1 md:sticky md:top-24 md:relative" style={{ maxHeight: "calc(100vh - 160px)" }}>
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
                <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                  <button onClick={() => setLcSelected(null)} className="md:hidden text-neutral-500 hover:text-black transition-colors flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  </button>
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(lcSelected.name || "V").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{lcSelected.name || "Visiteur"}</p>
                    <p className="text-[10px] text-neutral-400">ID: {lcSelected.visitor_id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lcStatusBadge(lcSelected.status)}
                    <button onClick={() => setLcSelected(null)} className="text-neutral-300 hover:text-black transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>

                {/* Status actions */}
                <div className="flex gap-1.5 px-4 py-2 border-b border-neutral-100 bg-neutral-50">
                  {lcSelected.status !== "ai" && (
                    <button onClick={() => updateLcStatus(lcSelected.id, "ai")}
                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                      🤖 Remettre à l&apos;IA
                    </button>
                  )}
                  {lcSelected.status !== "escalated" && (
                    <button onClick={() => joinLcSession(lcSelected.id)}
                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                      👤 Rejoindre la conversation
                    </button>
                  )}
                  {lcSelected.status !== "resolved" && (
                    <button onClick={() => setShowEndLcConfirm(true)}
                      className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      🔴 Terminer la conversation
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: 200 }}>
                  {lcMsgsLoading && lcMessages.length === 0 ? (
                    <div className="text-center text-xs text-neutral-400 py-8">Chargement…</div>
                  ) : lcMessages.length === 0 ? (
                    <div className="text-center text-xs text-neutral-400 py-8">Aucun message</div>
                  ) : (
                    lcMessages.map((msg) => {
                      const isOut = msg.direction === "out";
                      if (msg.body === "__AGENT_JOINED__") {
                        return (
                          <div key={msg.id} className="flex justify-center py-1">
                            <span className="text-[10px] text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">👤 Agent a rejoint la conversation</span>
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
                <div className="flex-shrink-0 border-t border-neutral-100 p-3">
                  {lcSelected.status === "ai" && (
                    <div className="flex items-start gap-2 mb-2 bg-green-50 border border-green-100 rounded-xl p-2">
                      <svg width="12" height="12" viewBox="0 0 48 48" fill="#22c55e" className="flex-shrink-0 mt-0.5">
                        <path d="M24 4C13 4 4 13 4 24c0 3.6 1 7 2.7 10L4 44l10.3-2.7C17.1 43 20.5 44 24 44c11 0 20-9 20-20S35 4 24 4z"/>
                      </svg>
                      <p className="text-[10px] text-green-700 font-semibold">L&apos;IA répond automatiquement. Cliquez &quot;Prendre en charge&quot; pour répondre manuellement.</p>
                    </div>
                  )}
                  {lcSent && (
                    <div className="text-[10px] text-green-600 font-semibold bg-green-50 rounded-xl p-2 text-center mb-2">✓ Message envoyé</div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={lcReply}
                      onChange={(e) => { setLcReply(e.target.value); setLcSent(false); if (lcSelected) signalTyping(lcSelected.id, e.target.value.length > 0); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendLcReply(); } }}
                      placeholder={lcSelected.status === "ai" ? "Prenez en charge pour répondre…" : "Répondre… (Entrée pour envoyer)"}
                      rows={2}
                      disabled={lcSelected.status === "ai"}
                      className="flex-1 border border-neutral-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-black resize-none disabled:opacity-40 disabled:bg-neutral-50"
                    />
                    <button
                      onClick={sendLcReply}
                      disabled={lcSending || !lcReply.trim() || lcSelected.status === "ai"}
                      className="self-end p-2.5 rounded-xl bg-purple-600 text-white transition-colors disabled:opacity-40 hover:bg-purple-700"
                    >
                      {lcSending ? (
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
