"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/\s+/g, "");
const LS_DONE      = "push_done";
const LS_VISITS    = "push_visits";
const LS_THRESHOLD = "push_threshold";
const SS_COUNTED   = "push_counted"; // sessionStorage — one count per browser session
const SHOW_DELAY   = 6000;
const REMIND_AFTER = 3; // show again after 3 separate visits

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

type PermState = "default" | "granted" | "denied" | "unsupported";
type Phase = "idle" | "loading" | "success" | "leaving";

const PARTICLES = [
  { e: "✨", x: -65, y: -80, d: 0 },
  { e: "🎉", x: 65, y: -75, d: 80 },
  { e: "🔥", x: -85, y: -25, d: 160 },
  { e: "🎁", x: 90, y: -20, d: 60 },
  { e: "⭐", x: -35, y: -95, d: 120 },
  { e: "✨", x: 40, y: -90, d: 200 },
  { e: "🌟", x: -90, y: 22, d: 40 },
  { e: "💫", x: 85, y: 28, d: 140 },
  { e: "🎊", x: 0, y: -108, d: 100 },
  { e: "❤️", x: -55, y: 58, d: 180 },
  { e: "🏆", x: 60, y: 52, d: 220 },
  { e: "✨", x: -75, y: -55, d: 30 },
];

const CONFETTI_COLORS = ["#f87171","#fb923c","#facc15","#4ade80","#60a5fa","#c084fc","#f472b6","#34d399"];
const CONFETTI = Array.from({ length: 34 }, (_, i) => ({
  x: `${Math.round((i / 34) * 100)}%`,
  w: 6 + (i % 4) * 2,
  h: 12 + (i % 5) * 4,
  r: i % 3 === 0 ? "50%" : "2px",
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rot: -40 + (i % 9) * 10,
  dur: 2.2 + (i % 5) * 0.4,
  delay: (i % 8) * -0.35,
}));

const KF = `
@keyframes pp-in{from{transform:translateY(48px) scale(0.88);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes pp-out{from{transform:translateY(0) scale(1);opacity:1}to{transform:translateY(38px) scale(0.92);opacity:0}}
@keyframes pp-check{0%{stroke-dashoffset:80}100%{stroke-dashoffset:0}}
@keyframes pp-circle{0%{stroke-dashoffset:226}100%{stroke-dashoffset:0}}
@keyframes pp-pop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
@keyframes pp-particle{0%{transform:translate(0,0) scale(0.2);opacity:0}15%{opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(1.2);opacity:0}}
@keyframes pp-fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pp-ring{0%,100%{box-shadow:0 0 0 0 rgba(62,207,76,0.5)}65%{box-shadow:0 0 0 11px rgba(62,207,76,0)}}
@keyframes pp-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes pp-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pp-bounce-in{0%{transform:scale(0) rotate(-15deg);opacity:0}60%{transform:scale(1.25) rotate(5deg)}80%{transform:scale(0.92) rotate(-2deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes pp-overlay-in{from{opacity:0}to{opacity:1}}
@keyframes pp-overlay-out{from{opacity:1}to{opacity:0}}
@keyframes pp-card-pop{0%{transform:scale(0.4) translateY(60px);opacity:0}60%{transform:scale(1.06) translateY(-8px)}80%{transform:scale(0.98) translateY(0)}100%{transform:scale(1) translateY(0);opacity:1}}
@keyframes pp-rain{0%{transform:translateY(-30px) rotate(var(--rot,0deg));opacity:1}100%{transform:translateY(105vh) rotate(calc(var(--rot,0deg) + 540deg));opacity:0.3}}
@keyframes pp-pulse-ring{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.9);opacity:0}}
`;

export default function PushPrompt() {
  const pathname = usePathname();
  const [permState, setPermState] = useState<PermState>("default");
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [visible, setVisible] = useState(false);

  // Immediately hide if the user navigates to an admin route
  useEffect(() => {
    if (pathname?.startsWith("/admin")) setShown(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return; // never show on admin pages
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermState("unsupported"); return;
    }
    if (!VAPID_PUBLIC_KEY) { setPermState("unsupported"); return; }
    if (localStorage.getItem(LS_DONE) === "1") return;

    const perm = Notification.permission as PermState;
    setPermState(perm);
    if (perm === "denied") return;

    if (perm === "granted") {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) { localStorage.setItem(LS_DONE, "1"); setSubscribed(true); }
          else { const t = setTimeout(() => setShown(true), SHOW_DELAY); return () => clearTimeout(t); }
        });
      });
      return;
    }

    // Only increment the visit counter once per browser session (not on every refresh / nav)
    let visits = parseInt(localStorage.getItem(LS_VISITS) ?? "0", 10) || 0;
    if (!sessionStorage.getItem(SS_COUNTED)) {
      visits += 1;
      localStorage.setItem(LS_VISITS, String(visits));
      sessionStorage.setItem(SS_COUNTED, "1");
    }
    const threshold = parseInt(localStorage.getItem(LS_THRESHOLD) ?? "3", 10) || 3;
    if (visits >= threshold) {
      const t = setTimeout(() => setShown(true), SHOW_DELAY);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shown) { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }
    else setVisible(false);
  }, [shown]);

  async function subscribe() {
    setPhase("loading");
    setError(null);
    // Mark as interacted immediately — never show this prompt again regardless of outcome
    localStorage.setItem(LS_DONE, "1");
    try {
      const perm = await Notification.requestPermission();
      setPermState(perm as PermState);
      if (perm !== "granted") { setPhase("idle"); setShown(false); return; }

      await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription().catch(() => null);
      if (existing) await existing.unsubscribe().catch(() => {});

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      try {
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        if (!res.ok) console.warn("Push DB save failed:", res.status);
      } catch (e) { console.warn("Push DB save error:", e); }

      localStorage.setItem(LS_DONE, "1");
      setSubscribed(true);
      setPhase("success");
      setTimeout(() => {
        setPhase("leaving");
        setTimeout(() => setShown(false), 420);
      }, 3000);
    } catch (err) {
      console.error("Push subscribe error:", err);
      const name = err instanceof Error ? err.name : "";
      const msg  = (err instanceof Error ? err.message : "").toLowerCase();
      if (name === "NotAllowedError") { setPermState("denied"); setShown(false); }
      else if (name === "AbortError" && msg.includes("push")) setError("Service temporairement indisponible. Réessayez.");
      else if (name === "AbortError" || msg.includes("private")) setError("Ouvrez dans une fenêtre normale.");
      else if (name === "InvalidStateError") setError("Rechargez la page et réessayez.");
      else if (name === "DataError")  setError("Configuration incorrecte. Contactez le support.");
      else if (name === "TypeError")  setError("Erreur réseau. Vérifiez votre connexion.");
      else setError("Erreur lors de l'activation. Réessayez.");
      setPhase("idle");
    }
  }

  function dismiss(later: boolean) {
    void later;
    setPhase("leaving");
    setTimeout(() => {
      setShown(false);
      setDismissed(true);
      const visits = parseInt(localStorage.getItem(LS_VISITS) ?? "0", 10) || 0;
      localStorage.setItem(LS_THRESHOLD, String(visits + REMIND_AFTER));
    }, 400);
  }

  if (pathname?.startsWith("/admin")) return null;
  if (permState === "unsupported" || permState === "denied" || subscribed || dismissed || !shown) return null;

  const anim: string | undefined =
    phase === "leaving" ? "pp-out 400ms cubic-bezier(0.4,0,0.8,0.6) forwards"
    : visible           ? "pp-in 560ms cubic-bezier(0.34,1.45,0.64,1) forwards"
    : undefined;

  /* ─── SUCCESS SCREEN — MAGIC ────────────────────────────── */
  if (phase === "success" || (phase === "leaving" && subscribed)) return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center"
         style={{ animation: phase === "leaving" ? "pp-overlay-out 400ms ease forwards" : "pp-overlay-in 350ms ease forwards",
           fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
      <style>{KF}</style>

      {/* Blurred backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)" }} />

      {/* Confetti rain */}
      {CONFETTI.map((c, i) => (
        <div key={i} className="absolute top-0 pointer-events-none"
             style={{ left: c.x, width: c.w, height: c.h, borderRadius: c.r, background: c.color,
               ["--rot" as string]: `${c.rot}deg`,
               animation: `pp-rain ${c.dur}s linear ${c.delay}s infinite` }} />
      ))}

      {/* Card */}
      <div className="relative z-10 w-[320px] rounded-[32px] overflow-hidden"
           style={{ animation: phase === "leaving" ? "pp-out 400ms ease forwards" : "pp-card-pop 0.75s cubic-bezier(0.34,1.56,0.64,1) both",
             boxShadow: "0 32px 80px rgba(62,207,76,0.65), 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(255,255,255,0.18)" }}>

        <div className="relative overflow-hidden px-7 py-10 flex flex-col items-center text-center"
             style={{ background: "linear-gradient(155deg,#14532d 0%,#16a34a 45%,#22c55e 80%,#4ade80 100%)" }}>

          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: "radial-gradient(circle at 50% 30%,rgba(255,255,255,0.28) 0%,transparent 65%)" }} />

          {/* Burst particles */}
          {PARTICLES.map((p, i) => (
            <span key={i} className="absolute text-[22px] select-none pointer-events-none"
              style={{ top: "35%", left: "50%", marginLeft: -11, marginTop: -11,
                ["--tx" as string]: `${p.x}px`, ["--ty" as string]: `${p.y}px`,
                animation: `pp-particle 1.3s cubic-bezier(0.2,0.8,0.3,1) ${p.d}ms both` }}>
              {p.e}
            </span>
          ))}

          {/* Animated checkmark */}
          <div className="relative mb-3 z-10" style={{ animation: "pp-bounce-in 0.75s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
            {/* Expanding pulse ring */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
                 style={{ border: "3px solid rgba(255,255,255,0.65)",
                   animation: "pp-pulse-ring 1.3s ease 0.65s infinite" }} />
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
              <circle cx="48" cy="48" r="44" fill="rgba(255,255,255,0.18)"
                stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"
                strokeDasharray="276" strokeDashoffset="276"
                style={{ animation: "pp-circle 0.9s ease 0.1s both" }} />
              <path d="M30 48 L42 61 L68 34" stroke="white" strokeWidth="5.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
                strokeDasharray="90" strokeDashoffset="90"
                style={{ animation: "pp-check 0.6s cubic-bezier(0.65,0,0.45,1) 0.5s both" }} />
            </svg>
          </div>

          {/* Trophy emoji */}
          <div className="z-10 mb-1" style={{ animation: "pp-bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.65s both", fontSize: 36, lineHeight: 1 }}>
            🎉
          </div>

          {/* Merci ! */}
          <p className="text-white font-black leading-tight mb-2 z-10"
             style={{ fontSize: 34, animation: "pp-bounce-in 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.78s both",
               textShadow: "0 3px 24px rgba(0,0,0,0.2)" }}>
            Merci&nbsp;!
          </p>
          <p className="text-white/85 text-[13.5px] leading-relaxed max-w-[220px] z-10"
             style={{ animation: "pp-fadein 0.45s ease 0.95s both" }}>
            Vous serez parmi les premiers informés de nos offres&nbsp;exclusives.&nbsp;🛍️
          </p>

          {/* Auto-close progress bar */}
          <div className="w-full mt-7 h-[3px] bg-white/20 rounded-full overflow-hidden z-10">
            <div className="h-full bg-white/70 rounded-full origin-left w-full"
                 style={{ animation: "pp-bar 2.7s linear 0.5s both" }} />
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── MAIN CARD ──────────────────────────────────────────── */
  return (
    <div className="fixed bottom-6 right-4 z-[9990] w-[340px] rounded-[28px] overflow-hidden"
         style={{
           animation: anim,
           fontFamily: "var(--font-sans, Inter, sans-serif)",
           background: "#fff",
           boxShadow: "0 24px 72px rgba(0,0,0,0.26), 0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
         }}>
      <style>{KF}</style>

      {/* ── Header ── */}
      <div className="relative px-5 pt-4 pb-7 overflow-hidden"
           style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>

        {/* Ambient glows */}
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle,rgba(62,207,76,0.1) 0%,transparent 68%)" }} />
        <div className="absolute -bottom-10 right-0 w-36 h-36 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle,rgba(62,207,76,0.06) 0%,transparent 70%)" }} />

        {/* Top row: Brand + Close */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0"
                 style={{ outline: "1.5px solid rgba(0,0,0,0.08)", outlineOffset: 0 }}>
              <img src="/favicon.png" alt="L'ecomax" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-neutral-900 text-[10.5px] font-black tracking-[0.13em] leading-none">L&apos;ECOMAX</p>
              <p className="text-[9px] font-medium tracking-[0.15em] uppercase leading-none mt-[3px]"
                 style={{ color: "rgba(0,0,0,0.35)" }}>Votre marketplace lifestyle</p>
            </div>
          </div>
          <button onClick={() => dismiss(false)} aria-label="Fermer"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ background: "rgba(0,0,0,0.05)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hero: Centered bell + headline + social proof */}
        <div className="relative flex flex-col items-center text-center">
          {/* Bell icon with rings */}
          <div className="relative flex items-center justify-center mb-4" style={{ width: 88, height: 88 }}>
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
                 style={{ border: "1px solid rgba(62,207,76,0.13)", animation: "pp-ring 3s ease infinite" }} />
            {/* Mid ring */}
            <div className="absolute rounded-full pointer-events-none"
                 style={{ inset: 10, border: "1px solid rgba(62,207,76,0.22)", animation: "pp-ring 3s ease 0.7s infinite" }} />
            {/* Icon box */}
            <div className="absolute flex items-center justify-center rounded-[18px] z-10"
                 style={{ inset: 20, background: "rgba(62,207,76,0.13)", border: "1px solid rgba(62,207,76,0.3)", boxShadow: "0 0 32px rgba(62,207,76,0.22)", animation: "pp-ring 2.5s ease 1.4s infinite" }}>
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="1.7" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            {/* Live dot */}
            <span className="absolute top-[22px] right-[19px] w-3 h-3 rounded-full bg-[#3ecf4c] z-20"
                  style={{ boxShadow: "0 0 0 2px #fff, 0 0 8px rgba(62,207,76,0.7)" }} />
          </div>

          {/* Headline */}
          <p className="text-neutral-900 font-black text-[18px] leading-tight tracking-[-0.01em] mb-2">
            Restez informé<br />en temps réel
          </p>
          <p className="text-[11.5px] leading-relaxed mb-3.5" style={{ color: "rgba(0,0,0,0.4)" }}>
            Offres exclusives &amp; nouveautés<br />directement sur votre appareil.
          </p>


        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 pt-4 pb-5">

        {/* Benefits — 3-column grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { e: "🔥", t: "Offres flash" },
            { e: "📦", t: "Suivi colis" },
            { e: "🎁", t: "Codes promo" },
          ].map(({ e, t }) => (
            <div key={t} className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl"
                 style={{ background: "#f8faf8", border: "1px solid #f0f0f0" }}>
              <span className="text-[20px] leading-none">{e}</span>
              <span className="text-[10.5px] text-neutral-600 font-semibold leading-tight text-center">{t}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 mb-3.5 px-3 py-2.5 rounded-xl" style={{ background: "#fef2f2" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-[1px]">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r=".5" fill="#ef4444" />
            </svg>
            <p className="text-[11.5px] text-red-600 leading-snug">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={subscribe}
          disabled={phase === "loading"}
          className="w-full py-3.5 rounded-2xl font-black text-[13.5px] text-black transition-transform active:scale-[0.97] disabled:opacity-70 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#3ecf4c 0%,#2db83a 50%,#3ecf4c 100%)",
            backgroundSize: "200% auto",
            boxShadow: "0 6px 28px rgba(62,207,76,0.55), 0 2px 8px rgba(62,207,76,0.2)",
            animation: phase !== "loading" ? "pp-shimmer 2.8s linear infinite" : undefined,
          }}
        >
          {phase === "loading" ? (
            <span className="flex items-center justify-center gap-2.5">
              <svg className="animate-spin w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.15)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="black" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Activation en cours…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Activer les notifications
            </span>
          )}
        </button>

        {/* Plus tard */}
        <button
          onClick={() => dismiss(true)}
          className="w-full mt-2 py-2.5 rounded-xl text-[12px] text-neutral-400 font-semibold transition-all hover:text-neutral-600 hover:bg-neutral-50"
        >
          Plus tard
        </button>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-1.5 mt-3.5 pt-3.5" style={{ borderTop: "1px solid #f3f4f6" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-[10.5px] text-neutral-400">Désactivable à tout moment dans les paramètres</p>
        </div>
      </div>
    </div>
  );
}
