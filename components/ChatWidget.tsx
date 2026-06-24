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

const URL_REGEX = /(https?:\/\/[^\s]+|(?:lecomax\.com|www\.[^\s]+)\/[^\s]*)/gi;

function renderWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 break-all"
          style={{ color: "inherit", opacity: 0.85 }}>
          {part}
        </a>
      );
    }
    return part;
  });
}

const QUICK_CHIPS = [
  { label: "🛍️ Nos produits", msg: "Quels produits proposez-vous ?" },
  { label: "🚚 Livraison", msg: "Quels sont vos délais et frais de livraison ?" },
  { label: "↩️ Retours", msg: "Quelle est votre politique de retour ?" },
  { label: "💳 Paiement", msg: "Quels modes de paiement acceptez-vous ?" },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("ai");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  const [agentJoined, setAgentJoined] = useState(false);
  const [callVisible, setCallVisible] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackState, setFeedbackState] = useState<"idle" | "submitted">("idle");
  const [inactiveWarning, setInactiveWarning] = useState(false);
  const [inactiveCountdown, setInactiveCountdown] = useState(30);
  const agentJoinedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCount = useRef(0);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Mobile keyboard: keep header visible by tracking visualViewport ────────
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const isMobile = () => window.innerWidth < 640;
    const resize = () => {
      if (!isMobile()) { panel.style.height = ""; return; }
      const h = window.visualViewport?.height ?? window.innerHeight;
      panel.style.height = `${h}px`;
      // Keep the panel anchored to the top of the visual viewport
      const offsetTop = window.visualViewport?.offsetTop ?? 0;
      panel.style.top = `${offsetTop}px`;
    };
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    resize();
    return () => {
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      panel.style.height = "";
      panel.style.top = "";
    };
  }, [open]);

  const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
  const WARNING_SECS  = 30;

  // ── Reset the inactivity clock ────────────────────────────────────────────
  const resetInactivity = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setInactiveWarning(false);
    setInactiveCountdown(WARNING_SECS);
    inactivityTimer.current = setTimeout(() => {
      // Show 30-second warning
      setInactiveWarning(true);
      setInactiveCountdown(WARNING_SECS);
      let secs = WARNING_SECS;
      countdownTimer.current = setInterval(() => {
        secs -= 1;
        setInactiveCountdown(secs);
        if (secs <= 0) {
          if (countdownTimer.current) clearInterval(countdownTimer.current);
          // Auto-close
          setOpen(false);
          setInactiveWarning(false);
          document.body.classList.remove("chat-open");
        }
      }, 1000);
    }, INACTIVITY_MS);
  }, [INACTIVITY_MS]);

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
      const newStatus = data.status || "ai";

      // Always sync status (catches admin resolving the chat)
      setStatus(newStatus);

      if (newMsgs.length > prevMsgCount.current) {
        const prevCount = prevMsgCount.current;
        prevMsgCount.current = newMsgs.length;
        setMessages(newMsgs);
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
    resetInactivity(); // visitor activity → reset timer

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
    resetInactivity();
  }

  // Clear inactivity timer when chat closes
  useEffect(() => {
    if (!open) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      setInactiveWarning(false);
    }
  }, [open]);

  async function newConversation() {
    clearSession();
    setSessionId(null);
    setMessages([]);
    setStatus("ai");
    setInput("");
    setAgentJoined(false);
    setCallVisible(false);
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackState("idle");
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
      <div className={`fixed bottom-16 z-50 ${open ? "hidden" : ""}`} style={{ right: "-16px" }}>
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
        <div ref={panelRef} className="fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl border border-neutral-200
          bottom-0 right-0 left-0 top-0 rounded-none w-full h-full
          sm:bottom-5 sm:right-5 sm:left-auto sm:top-auto sm:w-[360px] sm:h-[540px] sm:max-h-[calc(100vh-80px)] sm:rounded-2xl sm:max-w-[calc(100vw-20px)]"
          style={{ fontFamily: "Inter, sans-serif" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 text-white flex-shrink-0"
            style={{
              background: agentJoined
                ? "linear-gradient(135deg,#1a3a1a 0%,#22c55e 100%)"
                : "linear-gradient(135deg,#111 0%,#3ecf4c 100%)",
              transition: "background 0.6s ease",
            }}>
            <style>{`
              @keyframes headerFadeIn {
                from { opacity: 0; transform: scale(0.85); }
                to   { opacity: 1; transform: scale(1); }
              }
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

            {agentJoined ? (
              /* ── Zakaria agent mode ── */
              <div className="relative flex-shrink-0" style={{ animation: "headerFadeIn 0.4s ease both" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/zakaria agent.jpeg"
                  alt="Zakaria"
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover"
                  style={{ objectPosition: "center 15%", boxShadow: "0 0 0 2px rgba(255,255,255,0.6)" }}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ade80] rounded-full border-2 border-white"
                  style={{ boxShadow: "0 0 6px #4ade80" }} />
              </div>
            ) : (
              /* ── Bot mode ── */
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
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#3ecf4c] rounded-full border-2 border-white" />
              </div>
            )}

            <div className="flex-1 min-w-0" style={{ animation: "headerFadeIn 0.4s ease both" }}>
              {agentJoined ? (
                <>
                  <p className="text-sm font-bold leading-tight">Zakaria</p>
                  <p className="text-[11px] text-white/90 leading-tight flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4ade80] inline-block"
                      style={{ boxShadow: "0 0 5px #4ade80" }} />
                    Agent en ligne · L&apos;ecomax
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold leading-tight">Eco — Assistant L&apos;ecomax</p>
                  <p className="text-[11px] text-white/75 leading-tight">
                    {status === "escalated" && callVisible ? (
                      <span className="inline-flex items-center gap-1.5">
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
                        <span style={{ animation: "agentFade 1.8s ease-in-out infinite" }}>Agent en route</span>
                        {["0s","0.2s","0.4s"].map((delay, i) => (
                          <span key={i} style={{
                            display: "inline-block", width: 3, height: 3, borderRadius: "50%",
                            background: "rgba(255,255,255,0.7)",
                            animation: `agentBounce 1s ease-in-out ${delay} infinite`
                          }} />
                        ))}
                      </span>
                    ) : status === "resolved" ? "✅ Résolu" : "🟢 En ligne"}
                  </p>
                </>
              )}
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
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-neutral-50"
            style={{
              scrollBehavior: "smooth",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "thin",
              scrollbarColor: "#3ecf4c transparent",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <style>{`
              @keyframes msgIn {
                from { opacity: 0; transform: translateY(10px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              .chat-msg { animation: msgIn 0.22s ease both; }
            `}</style>

            {starting && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
                <span className="w-2 h-2 rounded-full bg-[#3ecf4c] animate-pulse" />Connexion…
              </div>
            )}

            {/* Welcome card — shown only before any messages */}
            {!starting && messages.length === 0 && (
              <div className="chat-msg flex flex-col gap-3">
                {/* Bot bubble */}
                <div className="flex items-end gap-2 justify-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/chatbot logo.png?v=2" alt="Eco" width={32} height={32}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm"
                    style={{ mixBlendMode: "multiply" }} />
                  <div className="flex flex-col gap-0.5" style={{ maxWidth: "82%" }}>
                    <span className="text-[10px] font-semibold text-[#3ecf4c] pl-1">Eco · Assistant</span>
                    <div className="bg-white border border-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm text-sm text-neutral-800 leading-relaxed">
                      👋 Bonjour ! Je suis <strong>Eco</strong>, l&apos;assistant de L&apos;ecomax.<br />
                      Comment puis-je vous aider aujourd&apos;hui ?
                    </div>
                  </div>
                </div>
                {/* Quick chips */}
                <div className="flex flex-wrap gap-2 pl-10">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => { setInput(chip.msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-200 bg-white text-neutral-700 hover:border-[#3ecf4c] hover:text-[#2db83a] transition-colors shadow-sm"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`chat-msg flex items-end gap-2 ${m.direction === "in" ? "justify-end" : "justify-start"}`}>
                {/* Avatar — AI or Agent */}
                {m.direction === "out" && (
                  <div className="flex-shrink-0 self-end">
                    {m.sent_by === "agent" ? (
                      <div className="relative">
                        <img
                          src="/images/zakaria agent.jpeg"
                          alt="Zakaria"
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
                          style={{ objectPosition: "center 15%" }}
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white"
                          style={{ boxShadow: "0 0 4px #4ade80" }} />
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src="/images/chatbot logo.png?v=2" alt="Eco" width={32} height={32}
                        className="w-8 h-8 rounded-full object-cover shadow-sm"
                        style={{ mixBlendMode: "multiply" }} />
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-0.5" style={{ maxWidth: "78%" }}>
                  {/* Label */}
                  {m.direction === "out" && (
                    <span className={`text-[10px] font-semibold pl-1 ${m.sent_by === "agent" ? "text-amber-600" : "text-[#3ecf4c]"}`}>
                      {m.sent_by === "agent" ? "Zakaria · Agent" : "Eco · Assistant"}
                    </span>
                  )}

                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${m.direction === "in"
                      ? "bg-black text-white rounded-br-sm"
                      : m.sent_by === "agent"
                        ? "bg-white border border-amber-200 text-neutral-800 rounded-bl-sm"
                        : "bg-white border border-neutral-100 text-neutral-800 rounded-bl-sm"
                    }`}
                    style={m.sent_by === "agent" ? { boxShadow: "0 2px 8px rgba(251,191,36,0.12)" } : {}}>
                    <p style={{ whiteSpace: "pre-wrap" }}>{renderWithLinks(m.body)}</p>
                    <p className={`text-[10px] mt-1 ${m.direction === "in" ? "text-white/40 text-right" : "text-neutral-300"}`}>
                      {formatTime(m.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-msg flex items-end gap-2 justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/chatbot logo.png?v=2" alt="Eco" width={32} height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm"
                  style={{ mixBlendMode: "multiply" }} />
                <div className="bg-white border border-neutral-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                  <style>{`
                    @keyframes typingDot {
                      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                      30%           { transform: translateY(-5px); opacity: 1; }
                    }
                  `}</style>
                  {[0, 150, 300].map((delay, i) => (
                    <span key={i} className="w-2 h-2 rounded-full"
                      style={{ background: "#3ecf4c", animation: `typingDot 1.2s ease-in-out ${delay}ms infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Agent connecting card */}
            {status === "escalated" && callVisible && !loading && (
              <div
                className="chat-msg rounded-2xl px-4 py-3 text-xs text-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                  border: "1px solid rgba(99,179,237,0.3)",
                  animation: "callSlideIn 0.5s cubic-bezier(.36,.07,.19,.97) both",
                  boxShadow: "0 0 20px rgba(62,207,76,0.15), 0 4px 15px rgba(0,0,0,0.3)"
                }}
              >
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
          {/* Inactivity warning banner */}
          {inactiveWarning && (
            <div
              className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5"
              style={{
                background: "linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)",
                borderTop: "1px solid #fbbf24",
                animation: "msgIn 0.3s ease both",
              }}
            >
              <span className="text-xl flex-shrink-0">⏱️</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-amber-800 leading-tight">Toujours là ?</p>
                <p className="text-[11px] text-amber-700 leading-tight">
                  Fermeture automatique dans <strong>{inactiveCountdown}s</strong>
                </p>
              </div>
              <button
                onClick={() => { resetInactivity(); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-400 text-amber-900 text-[11px] font-bold hover:bg-amber-500 transition-colors"
              >
                Je suis là
              </button>
            </div>
          )}

          <div className="flex-shrink-0 bg-white" style={{ borderTop: "1px solid #f0f0f0" }}>
            {status === "resolved" ? (
              feedbackState === "submitted" ? (
                <div className="flex flex-col items-center gap-2 py-4 px-4">
                  <span className="text-3xl">🎉</span>
                  <p className="text-sm font-bold text-neutral-800">Merci pour votre avis !</p>
                  <p className="text-xs text-neutral-400 text-center">Votre retour nous aide à améliorer notre service.</p>
                  <button onClick={newConversation}
                    className="mt-1 w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-colors">
                    Nouvelle conversation
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-3">
                  <div className="bg-neutral-50 rounded-xl p-3 text-center border border-neutral-100">
                    <p className="text-xs font-bold text-neutral-700 mb-0.5">Conversation terminée</p>
                    <p className="text-[11px] text-neutral-400">Comment s&apos;est passée votre expérience ?</p>
                  </div>
                  <div className="flex justify-center gap-1.5">
                    {[1,2,3,4,5].map((star) => (
                      <button key={star} onClick={() => setFeedbackRating(star)}
                        className="text-2xl transition-transform hover:scale-110 active:scale-95"
                        aria-label={`${star} étoile${star > 1 ? "s" : ""}`}>
                        {star <= feedbackRating ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                  {feedbackRating > 0 && (
                    <>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Un commentaire ? (optionnel)"
                        rows={2}
                        className="resize-none rounded-xl border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black bg-neutral-50"
                      />
                      <button
                        onClick={async () => {
                          if (!sessionId || !feedbackRating) return;
                          await fetch("/api/chat/feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ session_id: sessionId, rating: feedbackRating, comment: feedbackComment }),
                          });
                          setFeedbackState("submitted");
                        }}
                        className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
                      >
                        Envoyer mon avis
                      </button>
                    </>
                  )}
                  <button onClick={newConversation}
                    className="w-full py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 transition-colors">
                    Passer · Nouvelle conversation
                  </button>
                </div>
              )
            ) : (
              <div className="px-3 pt-2.5 pb-2">
                <div className="flex gap-2 items-end bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2 focus-within:border-[#3ecf4c] focus-within:bg-white transition-colors"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={status === "escalated" ? "Écrivez à l'agent…" : "Écrivez votre message…"}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm focus:outline-none leading-snug text-neutral-800 placeholder-neutral-400"
                    style={{ maxHeight: 90, overflowY: "auto" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: input.trim() && !loading ? "linear-gradient(135deg,#111 0%,#3ecf4c 100%)" : "#e5e7eb" }}
                    aria-label="Envoyer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 text-center mt-1.5">
                  {status === "ai"
                    ? <>Propulsé par IA · <span className="text-neutral-500 font-medium">Tapez « agent »</span> pour parler à un humain</>
                    : "Chat en direct avec notre équipe"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
