"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type ChatMsg = {
  id: string;
  direction: "in" | "out";
  body: string;
  sent_by: "visitor" | "ai" | "agent";
  timestamp: string;
};

type SessionStatus = "ai" | "escalated" | "resolved";

function genId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("eco_chat_visitor");
  if (!id) { id = genId(); localStorage.setItem("eco_chat_visitor", id); }
  return id;
}

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("eco_chat_session");
}

function saveSessionId(id: string) {
  if (typeof window !== "undefined") localStorage.setItem("eco_chat_session", id);
}

function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("eco_chat_session");
  }
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    gain.connect(ctx.destination);
    // Two-tone ding: high then slightly lower
    [880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.13);
      osc.stop(ctx.currentTime + i * 0.13 + 0.22);
    });
  } catch {}
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("ai");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [unread, setUnread] = useState(1);
  const [hasNew, setHasNew] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCount = useRef(0);

  // ── Start or resume session ──────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setStarting(true);
    const visitorId = getVisitorId();
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: visitorId }),
      });
      const data = await res.json();
      if (data.id) {
        setSessionId(data.id);
        saveSessionId(data.id);
        setStatus(data.status || "ai");
        // Load existing messages
        const msgsRes = await fetch(`/api/chat/poll/${data.id}`);
        const msgsData = await msgsRes.json();
        setMessages(msgsData.messages || []);
        prevMsgCount.current = (msgsData.messages || []).length;
      }
    } finally {
      setStarting(false);
    }
  }, []);

  // ── Auto-start when widget opens ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const savedId = getSessionId();
    if (savedId) {
      setSessionId(savedId);
      fetch(`/api/chat/poll/${savedId}`).then((r) => r.json()).then((d) => {
        setMessages(d.messages || []);
        setStatus(d.status || "ai");
        prevMsgCount.current = (d.messages || []).length;
      });
    } else {
      startSession();
    }
    // Welcome message if fresh
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, startSession]);

  // ── Polling for new agent replies ────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !open) return;
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/chat/poll/${sessionId}`);
      const data = await res.json();
      const newMsgs: ChatMsg[] = data.messages || [];
      if (newMsgs.length > prevMsgCount.current) {
        prevMsgCount.current = newMsgs.length;
        setMessages(newMsgs);
        setStatus(data.status || "ai");
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, open]);

  // Poll when closed to show unread badge
  useEffect(() => {
    if (open || !sessionId) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/chat/poll/${sessionId}`);
      const data = await res.json();
      const newMsgs: ChatMsg[] = data.messages || [];
      const agentNew = newMsgs.filter((m) => m.sent_by === "agent").length;
      const prevAgentNew = messages.filter((m) => m.sent_by === "agent").length;
      if (agentNew > prevAgentNew) {
        setUnread((u) => u + agentNew - prevAgentNew);
        setHasNew(true);
        setMessages(newMsgs);
        playNotifSound();
      }
    }, 8000);
    return () => clearInterval(iv);
  }, [open, sessionId, messages]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    // Optimistic update
    const tempMsg: ChatMsg = {
      id: genId(),
      direction: "in",
      body: text,
      sent_by: "visitor",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, body: text }),
      });
      const data = await res.json();

      if (data.reply) {
        const aiMsg: ChatMsg = {
          id: genId(),
          direction: "out",
          body: data.reply,
          sent_by: "ai",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
      if (data.status) setStatus(data.status);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleOpen() {
    setOpen(true);
    setUnread(0);
    setHasNew(false);
  }

  async function newConversation() {
    clearSession();
    setSessionId(null);
    setMessages([]);
    setStatus("ai");
    setInput("");
    await startSession();
  }

  return (
    <>
      {/* ── Floating toggle button ── */}
      <div className={`fixed bottom-16 right-5 z-50 ${open ? "hidden" : ""}`}>
        {/* Badge positioned relative to the visible green circle (PNG has ~18% whitespace on each side) */}
        <div className="relative inline-block">
          <button
            onClick={handleOpen}
            aria-label="Ouvrir le chat"
            className="relative w-36 h-36 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{ background: "transparent" }}
          >
            {/* Chatbot logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/chatbot logo.png?v=2"
              alt="Chat"
              width={144}
              height={144}
              className="w-36 h-36 object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          </button>
          {unread > 0 && (
            <span
              className="absolute min-w-[24px] h-[24px] bg-red-500 text-white text-[12px] font-black rounded-full flex items-center justify-center px-1.5 shadow-lg pointer-events-none"
              style={{
                top: "8px",
                right: "16px",
                animation: "badgePop 0.4s cubic-bezier(.36,.07,.19,.97) both, badgePulse 2s ease-in-out 0.5s infinite"
              }}
            >
              {unread}
            </span>
          )}
          {hasNew && unread === 0 && (
            <span
              className="absolute w-4 h-4 bg-red-500 rounded-full shadow pointer-events-none"
              style={{ top: "8px", right: "16px", animation: "badgePulse 1.5s ease-in-out infinite" }}
            />
          )}
          <style>{`
            @keyframes badgePop {
              0%   { transform: scale(0); opacity: 0; }
              60%  { transform: scale(1.3); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes badgePulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
              50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
            }
          `}</style>
        </div>
      </div>

      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-20px)] h-[540px] max-h-[calc(100vh-80px)] flex flex-col rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden bg-white"
          style={{ fontFamily: "Inter, sans-serif" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#111 0%,#3ecf4c 100%)" }}>
            {/* Logo with online ring */}
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/chatbot logo.png?v=2"
                alt="Eco"
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover"
                style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.6)" }}
              />
              {/* Online dot */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#3ecf4c] rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">Eco — Assistant L&apos;ecomax</p>
              <p className="text-[11px] text-white/75 leading-tight">
                {status === "escalated" ? "🟠 Agent en route…" : status === "resolved" ? "✅ Résolu" : "🟢 En ligne"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white ml-auto" aria-label="Fermer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
            {starting && (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" />Chargement…
              </div>
            )}
            {!starting && messages.length === 0 && (
              <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm text-sm text-neutral-700 max-w-[85%]">
                👋 Bonjour ! Je suis <strong>Eco</strong>, l&apos;assistant de L&apos;ecomax. Comment puis-je vous aider ?
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.direction === "in" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${m.direction === "in"
                    ? "bg-black text-white rounded-br-sm"
                    : m.sent_by === "agent"
                      ? "bg-amber-50 border border-amber-200 text-neutral-800 rounded-bl-sm"
                      : "bg-white border border-neutral-100 text-neutral-800 rounded-bl-sm"
                  }`}>
                  {m.sent_by === "agent" && (
                    <p className="text-[9px] font-black text-amber-500 uppercase mb-0.5">Agent</p>
                  )}
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
                  <p className={`text-[10px] mt-1 ${m.direction === "in" ? "text-white/50 text-right" : "text-neutral-400"}`}>
                    {formatTime(m.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            {status === "escalated" && !loading && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2 text-xs text-center">
                🔔 Un agent humain a été notifié et vous répondra bientôt.
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-neutral-100 bg-white p-3">
            {status === "resolved" ? (
              <button onClick={newConversation}
                className="w-full py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-colors">
                Nouvelle conversation
              </button>
            ) : (
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={status === "escalated" ? "Attendez la réponse de l'agent…" : "Votre message…"}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-neutral-50 leading-snug"
                  style={{ maxHeight: 90, overflowY: "auto" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 flex-shrink-0 rounded-xl bg-black text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                  aria-label="Envoyer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-[10px] text-neutral-400 text-center mt-1.5">
              {status === "ai" ? "Propulsé par IA • Tapez « agent » pour parler à un humain" : "Chat en direct avec notre équipe"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
