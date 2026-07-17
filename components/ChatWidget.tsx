"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

function agentIsActive(messages: ChatMsg[]): boolean {
  const lastAgentJoin = messages.map((message) => message.body).lastIndexOf("__AGENT_JOINED__");
  const lastAiResume = messages.map((message) => message.body).lastIndexOf("__AI_RESUMED__");
  return lastAgentJoin > lastAiResume;
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
  { label: "Nos produits", msg: "Quels produits proposez-vous ?", color: "#16a34a", soft: "#ecfdf3", path: "M6 3 3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-4H6ZM3 7h18M16 11a4 4 0 0 1-8 0" },
  { label: "Livraison", msg: "Quels sont les délais et frais de livraison ?", color: "#d97706", soft: "#fff8e7", path: "M3 6h11v11H3V6Zm11 4h4l3 3v4h-7v-7ZM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" },
  { label: "Suivre ma commande", msg: "Comment suivre ma commande ?", color: "#2563eb", soft: "#eef5ff", path: "m12 3 8 4-8 4-8-4 8-4Zm8 4v10l-8 4-8-4V7m8 4v10" },
  { label: "Retours", msg: "Quelle est votre politique de retour ?", color: "#7c3aed", soft: "#f5f0ff", path: "M9 7 4 12l5 5M4 12h10a6 6 0 0 1 6 6v1" },
  { label: "Paiement", msg: "Quels modes de paiement acceptez-vous ?", color: "#0891b2", soft: "#ecfeff", path: "M3 5h18v14H3V5Zm0 5h18M7 15h4" },
  { label: "Promotions", msg: "Avez-vous des promotions ou codes promo en ce moment ?", color: "#e34b78", soft: "#fff0f5", path: "m20 13-7 7a2 2 0 0 1-3 0l-8-8V3h9l9 8a2 2 0 0 1 0 2ZM7 7h.01" },
];

export default function ChatWidget() {
  const pathname = usePathname();
  const hideLauncher = pathname?.startsWith("/nous-contacter") || pathname?.startsWith("/checkout") || pathname?.startsWith("/compte");
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
  const [hasAgentJoined, setHasAgentJoined] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [callVisible, setCallVisible] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackState, setFeedbackState] = useState<"idle" | "submitted">("idle");
  const [expiredByTimeout, setExpiredByTimeout] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const agentJoinedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientTypingActiveRef = useRef(false);
  const clientTypingLastSentRef = useRef(0);
  const agentTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMsgCount = useRef(0);
  const takeoverInFlightRef = useRef(false);
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

  // ── Scroll-to-bottom detection ──────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  // ── Smart reply chips based on last AI message ─────────────────────
  type SmartChip = { label: string; msg: string; emoji: string; bg: string; color: string; border: string; };
  const lastAiMsg = [...messages].reverse().find(m => m.sent_by === "ai")?.body?.toLowerCase() ?? "";
  const smartChips: SmartChip[] = (() => {
    if (messages.length === 0 || loading || status !== "ai") return [];
    if (lastAiMsg.includes("livr") || lastAiMsg.includes("toull") || lastAiMsg.includes("توصيل"))
      return [
        { emoji: "📍", label: "Changer l'adresse", msg: "Je voudrais changer mon adresse de livraison", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
        { emoji: "⚡", label: "Livraison express", msg: "Y a-t-il une option livraison express ?", bg: "#fefce8", color: "#a16207", border: "#fde68a" },
      ];
    if (lastAiMsg.includes("retour") || lastAiMsg.includes("rembours") || lastAiMsg.includes("إرجاع"))
      return [
        { emoji: "📦", label: "Initier un retour", msg: "Comment démarrer un retour ?", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
        { emoji: "⏳", label: "Délai remboursement", msg: "Combien de temps pour le remboursement ?", bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" },
      ];
    if (lastAiMsg.includes("commande") || lastAiMsg.includes("suivi") || lastAiMsg.includes("طلب"))
      return [
        { emoji: "🗑️", label: "Annuler", msg: "Je voudrais annuler ma commande", bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
        { emoji: "📮", label: "Suivre ma commande", msg: "Comment suivre ma commande ?", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      ];
    if (lastAiMsg.includes("paiement") || lastAiMsg.includes("دفع"))
      return [
        { emoji: "💳", label: "Paiement à la livraison", msg: "Comment se passe le paiement à la livraison ?", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      ];
    if (lastAiMsg.includes("taille") || lastAiMsg.includes("pointure") || lastAiMsg.includes("size"))
      return [
        { emoji: "📏", label: "Guide des tailles", msg: "Pouvez-vous m'aider avec les tailles ?", bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
      ];
    return [
      { emoji: "💬", label: "Autre question", msg: "J'ai une autre question", bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
    ];
  })();

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
        // If agent already replied, mark as joined (no animation banner on resume)
        setHasAgentJoined(agentIsActive(loadedMsgs));
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

      if (data.ai_takeover_required && !takeoverInFlightRef.current) {
        takeoverInFlightRef.current = true;
        setLoading(true);
        try {
          const takeoverRes = await fetch("/api/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, ai_takeover: true }),
          });
          if (takeoverRes.ok) {
            const refreshedRes = await fetch(`/api/chat/poll/${sessionId}`);
            const refreshed = await refreshedRes.json();
            const refreshedMessages: ChatMsg[] = refreshed.messages || [];
            setMessages(refreshedMessages);
            prevMsgCount.current = refreshedMessages.length;
            setStatus("ai");
            setHasAgentJoined(false);
            setAgentJoined(false);
            setAgentTyping(false);
            setCallVisible(false);
            setExpiredByTimeout(false);
            playNotifSound();
          }
        } finally {
          takeoverInFlightRef.current = false;
          setLoading(false);
        }
        return;
      }
      setStatus(newStatus);

      if (newMsgs.length > prevMsgCount.current) {
        const prevCount = prevMsgCount.current;
        prevMsgCount.current = newMsgs.length;
        setMessages(newMsgs);
        // Detect first agent reply → show "agent joined" banner, hide call banner
        const hadAgentBefore = newMsgs.slice(0, prevCount).some((m) => m.sent_by === "agent");
        const hasAgentNow = newMsgs.some((m) => m.sent_by === "agent");
        if (!hadAgentBefore && hasAgentNow) {
          setAgentJoined(true); // trigger 5s banner
          setHasAgentJoined(true); // persistent — keeps agent header
          setCallVisible(false);
          if (agentJoinedTimer.current) clearTimeout(agentJoinedTimer.current);
          agentJoinedTimer.current = setTimeout(() => setAgentJoined(false), 5000);
        }
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, open]);

  // ── Live agent events, with polling retained as a fallback ───────────────
  useEffect(() => {
    if (!sessionId || !open) { setAgentTyping(false); return; }
    const showAgentTyping = (typing: boolean) => {
      if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current);
      setAgentTyping(typing);
      if (typing) agentTypingTimeoutRef.current = setTimeout(() => setAgentTyping(false), 4500);
    };
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from === "agent") showAgentTyping(payload.typing !== false);
      })
      .on("broadcast", { event: "agent-joined" }, () => {
        setAgentJoined(true);
        setHasAgentJoined(true);
        setCallVisible(false);
        if (agentJoinedTimer.current) clearTimeout(agentJoinedTimer.current);
        agentJoinedTimer.current = setTimeout(() => setAgentJoined(false), 5000);
      })
      .subscribe();
    chatChannelRef.current = channel;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/chat/typing?session_id=${sessionId}&from=agent`).catch(() => null);
      if (res?.ok) { const d = await res.json(); if (d.typing) showAgentTyping(true); }
    }, 2000);
    return () => {
      clearInterval(iv);
      if (agentTypingTimeoutRef.current) clearTimeout(agentTypingTimeoutRef.current);
      chatChannelRef.current = null;
      supabase.removeChannel(channel);
      setAgentTyping(false);
    };
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

  function signalClientTyping(typing: boolean) {
    if (!sessionId) return;
    chatChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { from: "client", typing },
    });

    const now = Date.now();
    if (!typing || !clientTypingActiveRef.current || now - clientTypingLastSentRef.current > 1500) {
      clientTypingActiveRef.current = typing;
      clientTypingLastSentRef.current = now;
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, typing, from: "client" }),
      }).catch(() => {});
    }

    if (clientTypingTimeoutRef.current) clearTimeout(clientTypingTimeoutRef.current);
    if (typing) clientTypingTimeoutRef.current = setTimeout(() => signalClientTyping(false), 3000);
  }

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
    signalClientTyping(false);
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
    setHasAgentJoined(false);
    setCallVisible(false);
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackState("idle");
    setExpiredByTimeout(false);
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
    setHasAgentJoined(false);
    setCallVisible(false);
  }

  return (
    <>
      {/* Floating button */}
      <div className={`fixed bottom-16 z-50 ${open || hideLauncher ? "hidden" : ""}`} style={{ right: "-16px" }}>
        <div className="relative inline-block">
          <div role="status" aria-live="polite" className="chat-help-bubble pointer-events-none absolute right-[125px] top-9 z-10 whitespace-nowrap rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-neutral-950 shadow-[0_12px_35px_rgba(0,0,0,.16)]">
            Besoin d’aide&nbsp;?
            <span aria-hidden="true" className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-black/10 bg-white" />
          </div>
          <span aria-hidden="true" className="chat-bot-ring pointer-events-none absolute left-1/2 top-1/2 h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#3ecf4c]/60" />
          <button onClick={handleOpen} aria-label="Besoin d’aide ? Ouvrir le chat"
            className="chat-bot-button relative w-36 h-36 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3ecf4c]/40 focus-visible:ring-offset-2"
            style={{ background: "transparent" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/chatbot logo.png?v=2" alt="Chat" width={144} height={144}
              className="chat-bot-logo w-36 h-36 object-contain" style={{ mixBlendMode: "multiply" }} />
          </button>
          {unread > 0 && (
            <span className="absolute min-w-[24px] h-[24px] bg-red-500 text-white text-[12px] font-black rounded-full flex items-center justify-center px-1.5 shadow-lg pointer-events-none"
              style={{ top: "28px", right: "20px", animation: "badgePop 0.4s cubic-bezier(.36,.07,.19,.97) both, badgePulse 2s ease-in-out 0.5s infinite" }}>
              {unread}
            </span>
          )}
          {hasNew && unread === 0 && (
            <span className="absolute w-4 h-4 bg-red-500 rounded-full shadow pointer-events-none"
              style={{ top: "28px", right: "20px", animation: "badgePulse 1.5s ease-in-out infinite" }} />
          )}
          <style>{`
            @keyframes badgePop { 0%{transform:scale(0);opacity:0;} 60%{transform:scale(1.3);opacity:1;} 100%{transform:scale(1);opacity:1;} }
            @keyframes badgePulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.7);} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0);} }
            @keyframes chatBotAttention {
              0%,1%,12%,100% { transform:translateY(0) rotate(0deg); }
              3% { transform:translateY(-7px) rotate(-3deg); }
              5% { transform:translateY(-7px) rotate(3deg); }
              7% { transform:translateY(-4px) rotate(-2deg); }
              10% { transform:translateY(0) rotate(0deg); }
            }
            @keyframes chatBotRing {
              0%,1% { transform:translate(-50%,-50%) scale(.72); opacity:0; }
              3% { opacity:.65; }
              10% { transform:translate(-50%,-50%) scale(1.45); opacity:0; }
              11%,100% { transform:translate(-50%,-50%) scale(.72); opacity:0; }
            }
            @keyframes chatHelpBubble {
              0%,1%,15%,100% { opacity:0; transform:translateX(10px) scale(.9); }
              3%,11% { opacity:1; transform:translateX(0) scale(1); }
              14% { opacity:0; transform:translateX(5px) scale(.96); }
            }
            .chat-bot-logo { animation:chatBotAttention 30s cubic-bezier(.22,1,.36,1) infinite; transform-origin:50% 70%; }
            .chat-bot-ring { animation:chatBotRing 30s ease-out infinite; }
            .chat-help-bubble { animation:chatHelpBubble 30s cubic-bezier(.22,1,.36,1) infinite; transform-origin:100% 50%; }
            @media (prefers-reduced-motion: reduce) {
              .chat-bot-logo, .chat-bot-ring, .chat-help-bubble { animation:none !important; }
              .chat-help-bubble, .chat-bot-ring { display:none; }
            }
          `}</style>
        </div>
      </div>

      {/* Chat panel */}
      {open && (
        <div ref={panelRef}
          className="chat-premium-panel fixed z-50 flex h-full w-full flex-col overflow-hidden rounded-none shadow-[0_30px_100px_rgba(0,0,0,.28)] bottom-0 right-0 left-0 top-0 sm:bottom-5 sm:right-5 sm:left-auto sm:top-auto sm:h-[640px] sm:max-h-[calc(100vh-60px)] sm:w-[390px] sm:max-w-[calc(100vw-20px)] sm:rounded-[28px]"
          style={{ fontFamily:"Inter,sans-serif", background:"#f7f8f7", border:"1px solid rgba(15,23,18,0.1)" }}>

          <style>{`
            @keyframes headerFadeIn { from{opacity:0;transform:scale(0.85);} to{opacity:1;transform:scale(1);} }
            @keyframes agentPing    { 75%,100%{transform:scale(2.2);opacity:0;} }
            @keyframes agentFade    { 0%,100%{opacity:0.7;} 50%{opacity:1;} }
            @keyframes msgIn        { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
            @keyframes typingDot    { 0%,60%,100%{transform:translateY(0);opacity:0.35;} 30%{transform:translateY(-5px);opacity:1;} }
            @keyframes slideDown    { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
            @keyframes callRipple   { 0%{transform:scale(1);opacity:1;} 100%{transform:scale(2.2);opacity:0;} }
            @keyframes callShake    { 0%,100%{transform:rotate(0deg);} 20%{transform:rotate(-15deg);} 40%{transform:rotate(15deg);} 60%{transform:rotate(-10deg);} 80%{transform:rotate(10deg);} }
            @keyframes callSlideIn  { 0%{transform:translateY(20px);opacity:0;} 100%{transform:translateY(0);opacity:1;} }
            @keyframes chatPanelIn  { from{opacity:0;transform:translateY(16px) scale(.98);} to{opacity:1;transform:translateY(0) scale(1);} }
            @keyframes quickCardIn  { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
            .chat-msg { animation: msgIn 0.25s cubic-bezier(0.22,1,0.36,1) both; }
            @media (min-width:640px){.chat-premium-panel{animation:chatPanelIn .4s cubic-bezier(.16,1,.3,1) both}}
            @media (prefers-reduced-motion:reduce){.chat-msg,.chat-premium-panel,.chat-quick-card{animation:none!important}}
          `}</style>

          {/* Header */}
          <div className="relative flex min-h-[76px] flex-shrink-0 items-center gap-3 overflow-hidden px-4 py-3.5 text-white"
            style={{
              background: hasAgentJoined
                ? "linear-gradient(135deg,#07150c 0%,#146b34 100%)"
                : "linear-gradient(135deg,#080b09 0%,#111914 58%,#123d24 100%)",
              transition:"background 0.7s ease",
            }}>
            <span style={{ position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(62,207,76,0.08)",pointerEvents:"none" }} />
            <span style={{ position:"absolute",right:20,bottom:-30,width:70,height:70,borderRadius:"50%",background:"rgba(62,207,76,0.06)",pointerEvents:"none" }} />

            {hasAgentJoined ? (
              <div className="relative flex-shrink-0" style={{ animation:"headerFadeIn 0.4s ease both" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/zakaria agent.jpeg" alt="Zakaria" width={44} height={44}
                  className="w-11 h-11 rounded-full object-cover"
                  style={{ objectPosition:"center 15%", boxShadow:"0 0 0 2px rgba(255,255,255,0.5),0 0 0 4px rgba(62,207,76,0.3)" }} />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ade80] rounded-full border-2 border-[#0a2a0a]"
                  style={{ boxShadow:"0 0 8px #4ade80" }} />
              </div>
            ) : (
              <div className="relative flex-shrink-0" style={{ animation:"headerFadeIn 0.4s ease both" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/chatbot logo.png?v=2" alt="Eco" width={44} height={44}
                  className="w-11 h-11 rounded-full object-cover bg-white/10"
                  style={{ boxShadow:"0 0 0 2px rgba(255,255,255,0.4),0 0 0 4px rgba(62,207,76,0.2)" }} />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0a]"
                  style={{ background:"#3ecf4c", boxShadow:"0 0 6px #3ecf4c" }} />
              </div>
            )}

            <div className="flex-1 min-w-0" style={{ animation:"headerFadeIn 0.4s ease both" }}>
              {hasAgentJoined ? (
                <>
                  <p className="text-[14px] font-bold leading-tight tracking-tight">Zakaria</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] flex-shrink-0" style={{ boxShadow:"0 0 5px #4ade80" }} />
                    <p className="text-[11px] text-white/75">Agent L&apos;ecomax &middot; En ligne</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#76ed8a]">Assistance L&apos;ecomax</p>
                  <p className="mt-1 text-[14px] font-bold leading-tight tracking-tight">Eco, votre assistant</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {status === "escalated" && callVisible ? (
                      <>
                        <span className="relative inline-flex flex-shrink-0" style={{ width:8,height:8 }}>
                          <span style={{ position:"absolute",inset:0,borderRadius:"50%",background:"#f97316",animation:"agentPing 1s cubic-bezier(0,0,0.2,1) infinite" }} />
                          <span style={{ position:"relative",display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#fb923c" }} />
                        </span>
                        <span className="text-[11px] text-white/75" style={{ animation:"agentFade 1.8s ease-in-out infinite" }}>Agent en route&hellip;</span>
                      </>
                    ) : status === "resolved" ? (
                      <span className="text-[11px] text-white/60">&#10003; Conversation termin&eacute;e</span>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c] flex-shrink-0" style={{ boxShadow:"0 0 5px #3ecf4c" }} />
                        <p className="text-[11px] text-white/70">R&eacute;pond instantan&eacute;ment &middot; IA</p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
              <button onClick={() => { setOpen(false); document.body.classList.remove("chat-open"); }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all" aria-label="R&eacute;duire">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7"/></svg>
              </button>
              {status !== "resolved" && (
                <button onClick={() => setShowEndConfirm(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-red-300 hover:bg-white/10 transition-all" aria-label="Terminer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.37 2.05.57 3.16.57A2.27 2.27 0 0 1 23 17.02v3.23A2.27 2.27 0 0 1 20.73 22C10.91 22 2 13.1 2 3.27A2.27 2.27 0 0 1 4.27 1h3.23A2.27 2.27 0 0 1 9.77 3.27c0 1.11.2 2.18.57 3.16a2 2 0 0 1-.45 2.11L8.62 9.81"/>
                    <line x1="22" y1="2" x2="2" y2="22"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* End confirm modal */}
          {showEndConfirm && (
            <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)" }}>
              <div className="bg-white rounded-3xl shadow-2xl px-6 py-6 mx-4 flex flex-col items-center gap-4" style={{ maxWidth:300,width:"100%",animation:"headerFadeIn 0.2s ease both" }}>
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.37 2.05.57 3.16.57A2.27 2.27 0 0 1 23 17.02v3.23A2.27 2.27 0 0 1 20.73 22C10.91 22 2 13.1 2 3.27A2.27 2.27 0 0 1 4.27 1h3.23A2.27 2.27 0 0 1 9.77 3.27c0 1.11.2 2.18.57 3.16a2 2 0 0 1-.45 2.11L8.62 9.81"/>
                    <line x1="22" y1="2" x2="2" y2="22"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-neutral-900 text-[15px] mb-1">Terminer la conversation&nbsp;?</p>
                  <p className="text-neutral-500 text-xs leading-relaxed">Vous pourrez d&eacute;marrer une nouvelle conversation &agrave; tout moment.</p>
                </div>
                <div className="flex gap-2 w-full">
                  <button onClick={() => setShowEndConfirm(false)}
                    className="flex-1 py-2.5 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                    Annuler
                  </button>
                  <button onClick={() => { setShowEndConfirm(false); endChat(); }}
                    className="flex-1 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                    Terminer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Agent joined banner */}
          {agentJoined && (
            <div className="flex-shrink-0 flex items-center gap-2.5 justify-center px-4 py-2.5"
              style={{ background:"linear-gradient(90deg,#f0fdf4,#dcfce7,#f0fdf4)",borderBottom:"1px solid #bbf7d0",animation:"slideDown 0.4s cubic-bezier(.36,.07,.19,.97) both" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/zakaria agent.jpeg" alt="Zakaria"
                style={{ width:26,height:26,borderRadius:"50%",objectFit:"cover",objectPosition:"center 15%",border:"2px solid #4ade80",flexShrink:0 }} />
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",boxShadow:"0 0 6px #22c55e",flexShrink:0 }} />
              <span style={{ fontSize:12,fontWeight:700,color:"#15803d" }}>Zakaria a rejoint la conversation</span>
            </div>
          )}

          {/* Messages area */}
          <div className="relative flex-1 min-h-0" style={{ overflow: "hidden" }}>
          <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-4"
            style={{
              scrollBehavior:"smooth",overscrollBehavior:"contain",
              scrollbarWidth:"thin",scrollbarColor:"#3ecf4c transparent",
              display:"flex",flexDirection:"column",gap:"10px",
              background:"linear-gradient(180deg,#f7faf8 0%,#f7f8f7 45%,#f3f5f4 100%)",
              backgroundImage:"radial-gradient(circle at 15% 5%,rgba(62,207,76,.07),transparent 28%)",
            }}>

            {starting && (
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 py-4">
                <div className="w-4 h-4 border-2 border-[#3ecf4c] border-t-transparent rounded-full animate-spin" />
                Connexion en cours&hellip;
              </div>
            )}

            {/* Welcome card */}
            {!starting && messages.length === 0 && (
              <div className="chat-msg flex flex-col gap-3">
                <div className="overflow-hidden rounded-[24px]" style={{ background:"white",border:"1px solid rgba(15,23,18,.08)",boxShadow:"0 14px 36px rgba(15,23,18,.07)" }}>
                  <div className="flex items-center gap-3 px-4 pb-3 pt-4" style={{ background:"linear-gradient(135deg,#f2fff5 0%,#fbfffc 58%,#fff 100%)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div className="relative flex-shrink-0">
                      <img src="/images/chatbot logo.png?v=2" alt="Eco" width={46} height={46}
                        className="h-[46px] w-[46px] rounded-2xl bg-white object-contain p-1"
                        style={{ boxShadow:"0 0 0 1.5px #3ecf4c,0 8px 20px rgba(22,185,85,.16)" }} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-[#22c55e]"
                        style={{ boxShadow:"0 0 0 0 rgba(34,197,94,0.6)",animation:"onlinePulse 2.5s ease-in-out infinite" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-black leading-tight text-neutral-950">Eco</p>
                      <p className="mt-1 truncate text-[10px] font-medium text-neutral-400">Assistant intelligent L&apos;ecomax</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0" style={{ background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                      <span className="text-[#15803d] text-[10px] font-semibold">En ligne</span>
                    </div>
                  </div>
                  <style>{`@keyframes onlinePulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5);}50%{box-shadow:0 0 0 4px rgba(34,197,94,0);}}`}</style>
                  <div className="px-4 pb-3 pt-4" style={{ borderTop:"1px solid #f1f4f2" }}>
                    <p className="text-[17px] font-black leading-[1.2] tracking-[-.02em] text-neutral-950">Bonjour, comment pouvons-nous vous aider&nbsp;?</p>
                    <p className="mt-2 text-[11px] leading-[1.6] text-neutral-500">Posez votre question à Eco ou demandez un conseiller lorsque vous en avez besoin.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 px-4 pb-4">
                    <span className="rounded-xl border border-amber-100 bg-amber-50 px-2 py-2 text-center text-[9px] font-black text-amber-700">★ Excellent</span>
                    <span className="rounded-xl border border-green-100 bg-green-50 px-2 py-2 text-center text-[9px] font-black text-green-700">⚡ Rapide</span>
                    <span className="rounded-xl border border-blue-100 bg-blue-50 px-2 py-2 text-center text-[9px] font-black text-blue-700">7j / 7</span>
                  </div>
                </div>

                <div className="flex items-end justify-between px-1 pt-1">
                  <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#16a34a]">Accès rapide</p><p className="mt-1 text-[13px] font-black text-neutral-900">Que recherchez-vous&nbsp;?</p></div>
                  <span className="text-[9px] text-neutral-400">Choisissez un sujet</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_CHIPS.map((chip) => (
                    <button key={chip.label}
                      onClick={async () => {
                        if (!sessionId || loading) return;
                        const tempMsg: ChatMsg = { id:genId(), direction:"in", body:chip.msg, sent_by:"visitor", timestamp:new Date().toISOString() };
                        setMessages(prev => [...prev, tempMsg]);
                        setLoading(true);
                        try {
                          const res = await fetch("/api/chat/message", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ session_id:sessionId, body:chip.msg }) });
                          const data = await res.json();
                          if (data.reply) {
                            const aiMsg: ChatMsg = { id:genId(), direction:"out", body:data.reply, sent_by:"ai", timestamp:new Date().toISOString() };
                            setMessages(prev => [...prev, aiMsg]);
                          }
                          if (data.status) { if (data.status === "escalated" && status !== "escalated") setCallVisible(true); setStatus(data.status); }
                        } finally { setLoading(false); }
                      }}
                      className="chat-quick-card group flex min-h-[56px] items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3ecf4c]/40 hover:shadow-[0_10px_24px_rgba(15,23,18,.08)] active:scale-[0.97]"
                      style={{ background:"white",border:"1px solid rgba(15,23,18,.07)",boxShadow:"0 3px 10px rgba(15,23,18,.035)",animation:`quickCardIn .35s cubic-bezier(.16,1,.3,1) ${QUICK_CHIPS.indexOf(chip) * 45}ms both` }}>
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105" style={{ background:chip.soft,color:chip.color }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={chip.path}/></svg>
                      </span>
                      <span className="flex-1 text-[11px] font-bold leading-tight text-neutral-800">{chip.label}</span>
                      <svg className="flex-shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#16a34a]" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, messageIndex) => {
              if (m.body === "__AI_RESUMED__" && m.direction === "out") {
                if (messages[messageIndex - 1]?.body === "__AI_RESUMED__") return null;
                return (
                  <div key={m.id} className="chat-msg py-2">
                    <div className="mx-auto flex max-w-[92%] items-start gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-3.5 py-3 shadow-[0_6px_20px_rgba(22,163,74,.08)]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11a8.1 8.1 0 1 1-2.3-5.7L20 8"/><path d="M20 3v5h-5"/></svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-emerald-900">Eco reprend la conversation</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-emerald-700/75">Aucune réponse de l’agent après 5 minutes. Votre assistant répond maintenant à votre question.</p>
                      </div>
                    </div>
                  </div>
                );
              }
              // System message: agent joined
              if (m.body === "__AGENT_JOINED__" && m.direction === "out") {
                if (messages[messageIndex - 1]?.body === "__AGENT_JOINED__") return null;
                return (
                  <div key={m.id} className="chat-msg flex justify-center py-2">
                    <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 shadow-sm">
                      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"/><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/></span>
                      <span className="text-[10px] font-bold text-emerald-800">Zakaria a rejoint la conversation</span>
                    </div>
                  </div>
                );
              }
              return (
              <div key={m.id} className={`chat-msg flex items-end gap-2 ${m.direction === "in" ? "justify-end" : "justify-start"}`}>
                {m.direction === "out" && (
                  <div className="flex-shrink-0 self-end mb-1">
                    {m.sent_by === "agent" ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/zakaria agent.jpeg" alt="Zakaria"
                          className="w-7 h-7 rounded-full object-cover border-2 border-white shadow"
                          style={{ objectPosition:"center 15%" }} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white"
                          style={{ boxShadow:"0 0 4px #4ade80" }} />
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src="/images/chatbot logo.png?v=2" alt="Eco" width={28} height={28}
                        className="w-7 h-7 rounded-full object-contain bg-white border border-neutral-100 shadow-sm p-0.5" />
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-0.5" style={{ maxWidth:"78%" }}>
                  {m.direction === "out" && (
                    <span className={`text-[10px] font-semibold pl-1 ${m.sent_by === "agent" ? "text-amber-600" : "text-[#16a34a]"}`}>
                      {m.sent_by === "agent" ? "Zakaria · Agent" : "Eco · Assistant"}
                    </span>
                  )}
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed ${m.direction === "in" ? "text-white rounded-3xl rounded-br-lg" : m.sent_by === "agent" ? "bg-white text-neutral-800 rounded-3xl rounded-bl-lg border border-amber-100" : "bg-white text-neutral-800 rounded-3xl rounded-bl-lg border border-neutral-100"}`}
                    style={m.direction === "in"
                      ? { background:"linear-gradient(135deg,#111 0%,#1a1a1a 100%)",boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }
                      : m.sent_by === "agent"
                        ? { boxShadow:"0 1px 6px rgba(251,191,36,0.1)" }
                        : { boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ whiteSpace:"pre-wrap" }}>{renderWithLinks(m.body)}</p>
                    <p className={`text-[9px] mt-1.5 font-medium ${m.direction === "in" ? "text-white/35 text-right" : "text-neutral-300"}`}>
                      {formatTime(m.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}

            {/* Typing indicator — AI */}
            {loading && (
              <div className="chat-msg flex items-end gap-2 justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/chatbot logo.png?v=2" alt="Eco" width={28} height={28}
                  className="w-7 h-7 rounded-full object-contain bg-white border border-neutral-100 shadow-sm p-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#16a34a] pl-1">Eco · Assistant</span>
                  <div className="bg-white border border-neutral-100 rounded-3xl rounded-bl-lg px-4 py-2.5 shadow-sm flex items-center gap-2.5">
                    {[0,140,280].map((delay,i) => (
                      <span key={i} className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background:"#3ecf4c",animation:`typingDot 1.2s ease-in-out ${delay}ms infinite` }} />
                    ))}
                    <span className="text-[11px] text-neutral-400 font-medium">Eco &eacute;crit&hellip;</span>
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator — Agent */}
            {agentTyping && !loading && (
              <div className="chat-msg flex items-end gap-2 justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/zakaria agent.jpeg" alt="Agent" width={28} height={28}
                  className="w-7 h-7 rounded-full object-cover border-2 border-white shadow flex-shrink-0"
                  style={{ objectPosition:"center 15%" }} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-amber-600 pl-1">Agent · L&apos;ecomax</span>
                  <div className="bg-white border border-amber-100 rounded-3xl rounded-bl-lg px-4 py-2.5 shadow-sm flex items-center gap-2.5">
                    {[0,140,280].map((delay,i) => (
                      <span key={i} className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background:"#f59e0b",animation:`typingDot 1.2s ease-in-out ${delay}ms infinite` }} />
                    ))}
                    <span className="text-[11px] text-neutral-400 font-medium">Agent &eacute;crit&hellip;</span>
                  </div>
                </div>
              </div>
            )}

            {/* Agent connecting card */}
            {status === "escalated" && callVisible && !loading && (
              <div className="chat-msg rounded-3xl px-5 py-4 overflow-hidden"
                style={{ background:"linear-gradient(135deg,#0d0d0d 0%,#0f2217 100%)",border:"1px solid rgba(62,207,76,0.2)",boxShadow:"0 0 30px rgba(62,207,76,0.1)",animation:"callSlideIn 0.5s cubic-bezier(.36,.07,.19,.97) both" }}>
                <div className="relative flex justify-center items-center mb-3">
                  {[0,0.4,0.8].map((delay,i) => (
                    <span key={i} style={{ position:"absolute",width:60,height:60,borderRadius:"50%",border:`1.5px solid rgba(62,207,76,${0.5-i*0.15})`,animation:`callRipple 1.6s ease-out ${delay}s infinite` }} />
                  ))}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center z-10"
                    style={{ background:"linear-gradient(135deg,#3ecf4c,#16a34a)",boxShadow:"0 0 16px rgba(62,207,76,0.5)",animation:"callShake 0.7s ease-in-out infinite" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                    </svg>
                  </div>
                </div>
                <p className="font-bold text-white text-[13px] text-center mb-1">Agent en cours de connexion&hellip;</p>
                <p className="text-[#3ecf4c]/60 text-[11px] text-center">Un agent L&apos;ecomax vous rejoindra sous peu</p>
              </div>
            )}
            <div ref={bottomRef} />
          {/* Scroll to bottom button — sits outside the scrollable div */}
          </div>{/* end scrollRef scrollable div */}
          {showScrollBtn && (
            <button
              onClick={() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }}
              className="absolute z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-white text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
              style={{ bottom: 10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#111 0%,#166534 100%)", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", animation: "slideDown 0.25s ease both", whiteSpace: "nowrap" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              Défiler vers le bas
            </button>
          )}
          </div>{/* end relative wrapper */}

          {/* Input */}
          <div className="flex-shrink-0 bg-white" style={{ borderTop:"1px solid rgba(0,0,0,0.06)" }}>
            {status === "resolved" ? (
              feedbackState === "submitted" ? (
                <div className="flex flex-col items-center gap-2 py-5 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mb-1">&#127881;</div>
                  <p className="text-[14px] font-bold text-neutral-900">Merci pour votre avis&nbsp;!</p>
                  <p className="text-[12px] text-neutral-500 text-center leading-relaxed">Votre retour nous aide &agrave; am&eacute;liorer notre service.</p>
                  <button onClick={newConversation}
                    className="mt-2 w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ background:"linear-gradient(135deg,#111 0%,#1a1a1a 100%)" }}>
                    Nouvelle conversation
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-4">
                  <div className="rounded-2xl p-3 text-center" style={{ background:"linear-gradient(135deg,#f8fffe,#f0fdf4)",border:"1px solid #d1fae5" }}>
                    <p className="text-[12px] font-bold text-neutral-800">
                      {expiredByTimeout ? "Session expirée" : "Conversation terminée ✓"}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {expiredByTimeout ? "Sans réponse pendant 5 minutes, la conversation a été fermée automatiquement." : "Comment s'est passée votre expérience ?"}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {[1,2,3,4,5].map((star) => (
                      <button key={star} onClick={() => setFeedbackRating(star)}
                        className="text-[26px] transition-all hover:scale-125 active:scale-110"
                        aria-label={`${star} ${star > 1 ? "etoiles" : "etoile"}`}>
                        <span style={{ filter:star<=feedbackRating?"none":"grayscale(1) opacity(0.35)" }}>&#11088;</span>
                      </button>
                    ))}
                  </div>
                  {feedbackRating > 0 && (
                    <>
                      <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Un commentaire ? (optionnel)" rows={2}
                        className="resize-none rounded-2xl border border-neutral-200 px-3.5 py-2.5 text-[12px] focus:outline-none focus:border-[#3ecf4c] bg-neutral-50 transition-colors" />
                      <button
                        onClick={async () => {
                          if (!sessionId || !feedbackRating) return;
                          await fetch("/api/chat/feedback", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ session_id:sessionId, rating:feedbackRating, comment:feedbackComment }) });
                          setFeedbackState("submitted");
                        }}
                        className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background:"linear-gradient(135deg,#111 0%,#1a1a1a 100%)" }}>
                        Envoyer mon avis
                      </button>
                    </>
                  )}
                  <button onClick={newConversation}
                    className="w-full py-2 rounded-2xl border border-neutral-200 text-[12px] font-semibold text-neutral-500 hover:bg-neutral-50 transition-colors">
                    Passer &middot; Nouvelle conversation
                  </button>
                </div>
              )
            ) : (
              <div className="px-3 pb-3 pt-3">
                {/* Smart reply chips */}
                {smartChips.length > 0 && messages.length > 0 && !input && (
                  <div style={{ animation: "slideDown 0.2s ease both" }}>
                    <p className="text-[9.5px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5 px-0.5">Suggestions</p>
                    <div className="flex gap-1.5 flex-wrap mb-2.5">
                      {smartChips.map((chip, i) => (
                        <button key={chip.label}
                          onClick={async () => {
                            if (!sessionId || loading) return;
                            const tempMsg: ChatMsg = { id: genId(), direction: "in", body: chip.msg, sent_by: "visitor", timestamp: new Date().toISOString() };
                            setMessages(prev => [...prev, tempMsg]);
                            setLoading(true);
                            try {
                              const res = await fetch("/api/chat/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, body: chip.msg }) });
                              const data = await res.json();
                              if (data.reply) setMessages(prev => [...prev, { id: genId(), direction: "out", body: data.reply, sent_by: "ai", timestamp: new Date().toISOString() }]);
                              if (data.status) { if (data.status === "escalated" && status !== "escalated") setCallVisible(true); setStatus(data.status); }
                            } finally { setLoading(false); }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                          style={{
                            background: chip.bg,
                            border: `1px solid ${chip.border}`,
                            color: chip.color,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            animation: `slideDown 0.2s ease ${i * 50}ms both`,
                          }}
                        >
                          <span className="text-[13px] leading-none">{chip.emoji}</span>
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex min-h-[56px] items-center gap-2.5 rounded-[18px] px-3 py-2.5 transition-all"
                  style={{
                    background: inputFocused ? "#fff" : "#f7f8f7",
                    border: inputFocused ? "1px solid #7ddc91" : "1px solid #e2e7e3",
                    boxShadow: inputFocused ? "0 0 0 2px rgba(62,207,76,.09),0 5px 18px rgba(15,23,18,.06)" : "inset 0 1px 0 rgba(255,255,255,.8)",
                    transition: "background .2s ease,border .2s ease,box-shadow .2s ease",
                  }}>
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${inputFocused ? "bg-green-50 text-[#16a34a]" : "bg-white text-neutral-300"}`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/></svg>
                  </span>
                  <textarea ref={inputRef} value={input} onChange={(e) => {
                    setInput(e.target.value);
                    signalClientTyping(e.target.value.length > 0);
                  }} onKeyDown={handleKey}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={status === "escalated" ? "Votre message au conseiller…" : "Comment pouvons-nous vous aider ?"}
                    rows={1} className="flex-1 resize-none bg-transparent text-[13px] font-medium leading-snug text-neutral-800 outline-none placeholder:font-normal placeholder:text-neutral-400"
                    style={{ maxHeight: 90, overflowY: "auto" }} />
                  {input.length > 120 && (
                    <span className="text-[10px] text-neutral-300 self-center flex-shrink-0 tabular-nums">{input.length}</span>
                  )}
                  <button onClick={sendMessage} disabled={!input.trim() || loading}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] border active:scale-90 disabled:cursor-not-allowed"
                    style={{
                      background: input.trim() && !loading ? "linear-gradient(135deg,#35d34a,#16a858)" : "#fff",
                      borderColor: input.trim() && !loading ? "transparent" : "#e5e9e6",
                      boxShadow: input.trim() && !loading ? "0 7px 18px rgba(35,190,75,.25)" : "0 2px 6px rgba(15,23,18,.04)",
                      transition: "all .2s cubic-bezier(.16,1,.3,1)",
                    }}
                    aria-label="Envoyer">
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke={input.trim() ? "white" : "#aeb6b0"} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: status === "escalated" ? "#22c55e" : "#3ecf4c", boxShadow: `0 0 4px ${status === "escalated" ? "#22c55e" : "#3ecf4c"}` }} />
                    <p className="text-[10px] text-neutral-400">
                      {status === "ai"
                        ? <><span className="font-medium text-neutral-500">Eco IA</span> &middot; R&eacute;pond en secondes</>
                        : <span className="font-medium text-neutral-600">Chat en direct &middot; Notre &eacute;quipe est l&agrave;</span>}
                    </p>
                  </div>
                  {status === "ai" && (
                    <button
                      onClick={async () => {
                        if (!sessionId || loading) return;
                        const msg = "Je souhaite parler à un agent humain";
                        const tempMsg: ChatMsg = { id: genId(), direction: "in", body: msg, sent_by: "visitor", timestamp: new Date().toISOString() };
                        setMessages(prev => [...prev, tempMsg]);
                        setLoading(true);
                        try {
                          const res = await fetch("/api/chat/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, body: msg }) });
                          const data = await res.json();
                          if (data.reply) setMessages(prev => [...prev, { id: genId(), direction: "out", body: data.reply, sent_by: "ai", timestamp: new Date().toISOString() }]);
                          if (data.status) { setCallVisible(true); setStatus(data.status); }
                        } finally { setLoading(false); }
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 transition-colors hover:text-[#16a34a] active:scale-95"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
                      Parler à un conseiller
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
