"use client";
import { useState, useEffect, useRef } from "react";

const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/\s+/g, "");
const LS_DONE = "push_done";

function urlBase64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type Phase = "idle" | "loading" | "success" | "already" | "denied";

// Confetti particles
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  color: ["#3ecf4c", "#16b277", "#facc15", "#f87171", "#60a5fa", "#c084fc", "#fb923c"][i % 7],
  left: `${(i / 28) * 100}%`,
  delay: `${(i * 0.08).toFixed(2)}s`,
  dur: `${0.8 + (i % 5) * 0.15}s`,
  size: 5 + (i % 4) * 2,
  rot: -30 + (i % 7) * 10,
}));

const EMOJIS = ["🎉","✨","🔔","🎊","⭐","💚","🎁"];

export default function EcomediaNotifButton() {
  const [supported, setSupported] = useState(true);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isSubscribed = phase === "success" || phase === "already";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setSupported(false); return;
    }
    if (localStorage.getItem(LS_DONE) === "1" || Notification.permission === "granted") {
      setPhase("already");
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (!supported) return null;

  async function handleSubscribe() {
    if (phase === "loading") return;
    setPhase("loading");
    setErrorMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPhase("denied");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription().catch(() => null);
      if (existing) await existing.unsubscribe().catch(() => {});
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      }).catch(() => {});
      localStorage.setItem(LS_DONE, "1");
      setPhase("success");
      // Auto-close after celebration
      setTimeout(() => setOpen(false), 4000);
    } catch (err) {
      if (Notification.permission === "denied") { setPhase("denied"); return; }
      setErrorMsg("Erreur lors de l'activation. Réessayez.");
      setPhase("idle");
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell icon button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 relative ${
          isSubscribed ? "text-[#16b277] hover:bg-green-50" : "text-black hover:bg-neutral-100"
        }`}
        title={isSubscribed ? "Notifications activées" : "Activer les notifications"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={isSubscribed ? "#16b277" : "currentColor"} strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
          {isSubscribed && <path d="M12 2v2" strokeWidth="2.5"/>}
        </svg>
        {isSubscribed && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3ecf4c] border-2 border-white" />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-76 bg-white border border-neutral-100 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden"
          style={{ width: 296 }}>

          {/* â”€â”€ SUCCESS: Thank you animation â”€â”€ */}
          {phase === "success" && (
            <div className="relative overflow-hidden">
              <style>{`
                @keyframes em-confetti{0%{transform:translateY(-10px) rotate(var(--r,0deg));opacity:1}100%{transform:translateY(90px) rotate(calc(var(--r,0deg)+360deg));opacity:0}}
                @keyframes em-check{0%{stroke-dashoffset:60}100%{stroke-dashoffset:0}}
                @keyframes em-ring{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
                @keyframes em-text{0%{transform:translateY(12px);opacity:0}100%{transform:translateY(0);opacity:1}}
                @keyframes em-emoji{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.3) rotate(10deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
                @keyframes em-pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
              `}</style>

              {/* Confetti burst */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ height: 180 }}>
                {CONFETTI.map((c, i) => (
                  <div key={i} style={{
                    position: "absolute",
                    left: c.left,
                    top: -8,
                    width: c.size,
                    height: c.size * 1.8,
                    borderRadius: i % 3 === 0 ? "50%" : "2px",
                    background: c.color,
                    transform: `rotate(${c.rot}deg)`,
                    animation: `em-confetti ${c.dur} ${c.delay} ease-in forwards`,
                    ["--r" as string]: `${c.rot}deg`,
                  }}/>
                ))}
              </div>

              {/* Content */}
              <div className="relative px-5 pt-8 pb-6 text-center">
                {/* Animated check circle */}
                <div className="relative w-16 h-16 mx-auto mb-4">
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-full bg-[#3ecf4c]/20"
                    style={{ animation: "em-pulse-ring 1s 0.3s ease-out forwards" }} />
                  <div className="absolute inset-0 rounded-full bg-[#3ecf4c]/10"
                    style={{ animation: "em-pulse-ring 1s 0.6s ease-out forwards" }} />
                  {/* Circle */}
                  <div className="w-16 h-16 rounded-full bg-[#3ecf4c] flex items-center justify-center"
                    style={{ animation: "em-ring 0.5s cubic-bezier(0.22,1,0.36,1) forwards" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"
                        style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: "em-check 0.4s 0.4s ease-out forwards" }} />
                    </svg>
                  </div>
                </div>

                {/* Emojis burst */}
                <div className="flex justify-center gap-1.5 mb-3">
                  {EMOJIS.slice(0, 5).map((e, i) => (
                    <span key={i} className="text-lg"
                      style={{ display: "inline-block", animation: `em-emoji 0.4s ${0.2 + i * 0.06}s cubic-bezier(0.22,1,0.36,1) both` }}>
                      {e}
                    </span>
                  ))}
                </div>

                <div style={{ animation: "em-text 0.4s 0.5s ease-out both" }}>
                  <p className="font-black text-[17px] text-black mb-1">Merci pour votre abonnement !</p>
                  <p className="text-[12px] text-neutral-500 leading-relaxed">
                    Vous recevrez désormais les meilleures offres, nouveautés et actualités L&apos;ecomax en temps réel. 🎉
                  </p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  style={{ animation: "em-text 0.3s 0.8s ease-out both" }}
                  className="mt-5 w-full py-2.5 bg-black text-white text-[12px] font-black rounded-xl hover:bg-neutral-800 active:scale-95 transition-all"
                >
                  Super, merci ! ðŸ™Œ
                </button>
              </div>
            </div>
          )}

          {/* â”€â”€ ALREADY SUBSCRIBED â”€â”€ */}
          {phase === "already" && (
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16b277" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <p className="font-black text-[15px] text-black">Notifications activées ✓</p>
              <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed">
                Vous êtes abonné aux notifications L&apos;ecomax. Nous vous informerons des meilleures offres.
              </p>
              <button onClick={() => setOpen(false)}
                className="mt-4 w-full py-2.5 bg-black text-white text-[12px] font-black rounded-xl hover:bg-neutral-800 active:scale-95 transition-all">
                Parfait !
              </button>
            </div>
          )}

          {/* â”€â”€ DENIED: instructions â”€â”€ */}
          {phase === "denied" && (
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="font-black text-[14px] text-black">Autorisation requise</p>
              <p className="text-[12px] text-neutral-500 mt-1 leading-relaxed">
                Votre navigateur a bloqué la demande. Pour activer :<br/>
                ðŸ”’ Barre d&apos;adresse â†’ <strong>Notifications</strong> â†’ <strong>Autoriser</strong>
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setPhase("idle"); setErrorMsg(null); }}
                  className="flex-1 py-2.5 border border-neutral-200 text-[12px] font-bold rounded-xl hover:bg-neutral-50 active:scale-95 transition-all">
                  Réessayer
                </button>
                <button onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 bg-black text-white text-[12px] font-bold rounded-xl hover:bg-neutral-800 active:scale-95 transition-all">
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* â”€â”€ DEFAULT / IDLE: subscribe CTA â”€â”€ */}
          {(phase === "idle" || phase === "loading") && (
            <div>
              {/* Dark header */}
              <div className="bg-black px-5 pt-5 pb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3ecf4c]/20 to-transparent pointer-events-none" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#3ecf4c]/20 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-[14px] text-white">Notifications Ecomedia</p>
                    <p className="text-[11px] text-white/50">Restez informé en temps réel</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {[
                  { icon: "🏷️", text: "Offres exclusives et promos flash" },
                  { icon: "🛍️", text: "Nouveaux produits en avant-première" },
                  { icon: "📱", text: "Actualités Ecomedia en direct" },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{b.icon}</span>
                    <span className="text-[12px] text-neutral-600 font-medium">{b.text}</span>
                  </div>
                ))}

                {errorMsg && (
                  <p className="text-[11px] px-3 py-2 rounded-lg font-semibold bg-red-50 text-red-500">{errorMsg}</p>
                )}

                <button
                  onClick={handleSubscribe}
                  disabled={phase === "loading"}
                  className="w-full flex items-center justify-center gap-2 bg-[#3ecf4c] text-black text-[13px] font-black py-3.5 rounded-xl hover:bg-[#16b277] hover:text-white disabled:opacity-60 active:scale-95 transition-all shadow-lg shadow-green-200"
                >
                  {phase === "loading" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Activation en coursâ€¦
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                      </svg>
                      Activer les notifications
                    </>
                  )}
                </button>
                <p className="text-[10px] text-neutral-400 text-center">
                  Gratuit · Désactivable à tout moment
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
