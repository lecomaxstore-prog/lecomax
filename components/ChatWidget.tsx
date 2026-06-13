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
  const [agentJoined, setAgentJoined] = useState(false);
  const [callVisible, setCallVisible] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const agentJoinedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
        const loadedMsgs: ChatMsg[] = d.messages || [];
        setMessages(loadedMsgs);
        setStatus(d.status || "ai");
        prevMsgCount.current = loadedMsgs.length;
        // If agent already replied, show joined banner
        if (loadedMsgs.some((m) => m.sent_by === "agent")) {
          setAgentJoined(true);
          if (agentJoinedTimer.current) clearTimeout(agentJoinedTimer.current);
          agentJoinedTimer.current = setTimeout(() => setAgentJoined(false), 5000);
        }
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
        const prevCount = prevMsgCount.current;
        prevMsgCount.current = newMsgs.length;
        setMessages(newMsgs);
        setStatus(data.status || "ai");
        // Detect first agent reply → show "agent joined" banner, hide call banner
        const hadAgentBefore = newMsgs.slice(0, prevCount).some((m) => m.sent_by === "agent");
        const hasAgentNow = newMsgs.some((m) => m.sent_by === "agent");
        if (!hadAgentBefore && hasAgentNow) {
          setAgentJoined(true);
          setCallVisible(false);
          if (agentJoinedTimer.current) clearTimeout(agentJoinedTimer.current);
          agentJoinedTimer.current = setTimeout(() => setAgentJoined(false), 5000);
        }
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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
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
      if (data.status) {
        if (data.status === "escalated" && status !== "escalated") {
          // First time escalated → show call banner
          setCallVisible(true);
        } else if (status === "escalated" && data.status === "escalated") {
          // User sent another message while already escalated → hide call banner
          setCallVisible(false);
        }
        setStatus(data.status);
      }
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
    document.body.classList.add("chat-open");
  }

  async function newConversation() {
    clearSession();
    setSessionId(null);
    setMessages([]);
    setStatus("ai");
    setInput("");
    setAgentJoined(false);
    setCallVisible(false);
    await startSession();
  }

  async function endChat() {
    if (!sessionId) return;
    try {
      await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
    } catch {}
    setStatus("resolved");
    setAgentJoined(false);
    setCallVisible(false);
  }

  return (
    <>
      {/* ── Floating toggle button ── */}
      <div className={`fixed bottom-16 right-0 z-50 ${open ? "hidden" : ""}`}>
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
                top: "28px",
                right: "20px",
                animation: "badgePop 0.4s cubic-bezier(.36,.07,.19,.97) both, badgePulse 2s ease-in-out 0.5s infinite"
              }}
            >
              {unread}
            </span>
          )}
          {hasNew && unread === 0 && (
            <span
              className="absolute w-4 h-4 bg-red-500 rounded-full shadow pointer-events-none"
              style={{ top: "28px", right: "20px", animation: "badgePulse 1.5s ease-in-out infinite" }}
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
        <div className="fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl border border-neutral-200
          bottom-0 right-0 left-0 top-0 rounded-none w-full h-full
          sm:bottom-5 sm:right-5 sm:left-auto sm:top-auto sm:w-[360px] sm:h-[540px] sm:max-h-[calc(100vh-80px)] sm:rounded-2xl sm:max-w-[calc(100vw-20px)]"
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
                {status === "escalated" && callVisible && !agentJoined ? (
                  <span className="inline-flex items-center gap-1.5">
                    {/* Pulsing live dot */}
                    <span className="relative inline-flex" style={{ width: 8, height: 8 }}>
                      <span style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        background: "#f97316",
                        animation: "agentPing 1s cubic-bezier(0,0,0.2,1) infinite"
                      }} />
                      <span style={{
                        position: "relative", display: "inline-block",
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#fb923c"
                      }} />
                    </span>
                    <span style={{ animation: "agentFade 1.8s ease-in-out infinite" }}>
                      Agent en route
                    </span>
                    {/* Bouncing dots */}
                    {["0s","0.2s","0.4s"].map((delay, i) => (
                      <span key={i} style={{
                        display: "inline-block", width: 3, height: 3, borderRadius: "50%",
                        background: "rgba(255,255,255,0.7)",
                        animation: `agentBounce 1s ease-in-out ${delay} infinite`
                      }} />
                    ))}
                    <style>{`
                      @keyframes agentPing {
                        75%, 100% { transform: scale(2.2); opacity: 0; }
                      }
                      @keyframes agentFade {
                        0%, 100% { opacity: 0.7; }
                        50%       { opacity: 1; }
                      }
                      @keyframes agentBounce {
                        0%, 100% { transform: translateY(0); }
                        50%       { transform: translateY(-3px); }
                      }
                    `}</style>
                  </span>
                ) : status === "resolved" ? "✅ Résolu" : agentJoined ? "🟢 Zakaria · Agent en ligne" : "🟢 En ligne"}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => { setOpen(false); document.body.classList.remove("chat-open"); }} className="text-white/70 hover:text-white" aria-label="Fermer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {status !== "resolved" && (
              <button
                onClick={() => setShowEndConfirm(true)}
                className="text-white/60 hover:text-red-300 transition-colors ml-1"
                aria-label="Terminer la conversation"
                title="Terminer la conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.37 2.05.57 3.16.57A2.27 2.27 0 0 1 23 17.02v3.23A2.27 2.27 0 0 1 20.73 22C10.91 22 2 13.1 2 3.27A2.27 2.27 0 0 1 4.27 1h3.23A2.27 2.27 0 0 1 9.77 3.27c0 1.11.2 2.18.57 3.16a2 2 0 0 1-.45 2.11L8.62 9.81" />
                  <line x1="22" y1="2" x2="2" y2="22" />
                </svg>
              </button>
            )}
            </div>
          </div>

          {/* End chat confirmation overlay */}
          {showEndConfirm && (
            <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}>
              <div className="bg-white rounded-2xl shadow-2xl px-6 py-5 mx-4 flex flex-col items-center gap-4" style={{ maxWidth: 300, width: "100%" }}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.37 2.05.57 3.16.57A2.27 2.27 0 0 1 23 17.02v3.23A2.27 2.27 0 0 1 20.73 22C10.91 22 2 13.1 2 3.27A2.27 2.27 0 0 1 4.27 1h3.23A2.27 2.27 0 0 1 9.77 3.27c0 1.11.2 2.18.57 3.16a2 2 0 0 1-.45 2.11L8.62 9.81" />
                    <line x1="22" y1="2" x2="2" y2="22" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-neutral-900 text-base">Terminer la conversation ?</p>
                  <p className="text-neutral-500 text-xs mt-1">Vous pourrez démarrer une nouvelle conversation à tout moment.</p>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => { setShowEndConfirm(false); endChat(); }}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                  >
                    Terminer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Agent joined sticky banner */}
          {agentJoined && (
            <div
              className="flex items-center gap-2 justify-center px-3 py-2 flex-shrink-0"
              style={{
                background: "linear-gradient(90deg, #dcfce7 0%, #f0fdf4 100%)",
                borderBottom: "1px solid #86efac",
                animation: "callSlideIn 0.4s cubic-bezier(.36,.07,.19,.97) both",
              }}
            >
              <img src="/images/zakaria agent.jpeg" alt="Zakaria" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", objectPosition: "center 15%", border: "2px solid #86efac", flexShrink: 0 }} />
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>Zakaria a rejoint le chat</span>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50"
            style={{
              scrollBehavior: "smooth",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              scrollbarColor: "#3ecf4c transparent",
            }}
          >
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
              <div key={m.id} className={`flex items-end gap-2 ${m.direction === "in" ? "justify-end" : "justify-start"}`}>
                {/* Agent avatar with online dot */}
                {m.sent_by === "agent" && (
                  <div className="relative flex-shrink-0">
                    <img
                      src="/images/zakaria agent.jpeg"
                      alt="Zakaria"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      style={{ objectPosition: "center 15%" }}
                    />
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white"
                      style={{ boxShadow: "0 0 4px #4ade80" }}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-0.5" style={{ maxWidth: "78%" }}>
                  {/* Name label above bubble */}
                  {m.sent_by === "agent" && (
                    <span className="text-[10px] font-semibold text-amber-600 pl-1">Zakaria · Agent</span>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${m.direction === "in"
                      ? "bg-black text-white rounded-br-sm"
                      : m.sent_by === "agent"
                        ? "bg-white border border-amber-200 text-neutral-800 rounded-bl-sm"
                        : "bg-white border border-neutral-100 text-neutral-800 rounded-bl-sm"
                    }`}
                    style={m.sent_by === "agent" ? { boxShadow: "0 2px 8px rgba(251,191,36,0.15)" } : {}}>
                    <p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.direction === "in" ? "text-white/50 text-right" : "text-neutral-400"}`}>
                      {formatTime(m.timestamp)}
                    </p>
                  </div>
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
            {status === "escalated" && callVisible && !loading && (
              <div
                className="rounded-2xl px-4 py-3 text-xs text-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                  border: "1px solid rgba(99,179,237,0.3)",
                  animation: "callSlideIn 0.5s cubic-bezier(.36,.07,.19,.97) both",
                  boxShadow: "0 0 20px rgba(62,207,76,0.15), 0 4px 15px rgba(0,0,0,0.3)"
                }}
              >
                {/* Ripple rings */}
                <div className="relative flex justify-center items-center mb-2">
                  <span style={{ position: "absolute", width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(62,207,76,0.6)", animation: "callRipple 1.5s ease-out infinite" }} />
                  <span style={{ position: "absolute", width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(62,207,76,0.4)", animation: "callRipple 1.5s ease-out 0.4s infinite" }} />
                  <span style={{ position: "absolute", width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(62,207,76,0.2)", animation: "callRipple 1.5s ease-out 0.8s infinite" }} />
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg, #3ecf4c, #2db83a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 12px rgba(62,207,76,0.6)",
                    animation: "callShake 0.6s ease-in-out infinite",
                    zIndex: 1
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                    </svg>
                  </div>
                </div>
                <p className="font-bold text-white text-[12px] mb-0.5">Agent en cours de connexion…</p>
                <p className="text-blue-200 text-[10px] opacity-80">Un agent vous rejoindra dans quelques instants</p>
                <style>{`
                  @keyframes callRipple {
                    0%   { transform: scale(1); opacity: 1; }
                    100% { transform: scale(2.2); opacity: 0; }
                  }
                  @keyframes callShake {
                    0%, 100% { transform: rotate(0deg); }
                    20%       { transform: rotate(-15deg); }
                    40%       { transform: rotate(15deg); }
                    60%       { transform: rotate(-10deg); }
                    80%       { transform: rotate(10deg); }
                  }
                  @keyframes callSlideIn {
                    0%   { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                  }
                `}</style>
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
