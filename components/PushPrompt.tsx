"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/\s+/g, "");
const LS_DONE      = "push_done";       // "1" = subscribed, never show again
const LS_VISITS    = "push_visits";     // visit counter
const LS_THRESHOLD = "push_threshold";  // show after this many visits (default 3)
const SHOW_DELAY   = 6000;             // ms after page load before showing
const REMIND_AFTER = 3;               // visits until showing again after "Plus tard"

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

type PermState = "default" | "granted" | "denied" | "unsupported";

export default function PushPrompt() {
  const pathname = usePathname();
  const [permState, setPermState] = useState<PermState>("default");
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermState("unsupported");
      return;
    }

    // No VAPID key configured — skip
    if (!VAPID_PUBLIC_KEY) { setPermState("unsupported"); return; }

    // Already subscribed permanently
    if (localStorage.getItem(LS_DONE) === "1") return;

    const perm = Notification.permission as PermState;
    setPermState(perm);

    if (perm === "denied") return;

    if (perm === "granted") {
      // They already granted — check if they have an active SW subscription
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            localStorage.setItem(LS_DONE, "1");
            setSubscribed(true);
          } else {
            // Granted but no subscription (SW was cleared) — re-show prompt
            const t = setTimeout(() => setShown(true), SHOW_DELAY);
            return () => clearTimeout(t);
          }
        });
      });
      return;
    }

    // Track visits in localStorage
    const visits = (parseInt(localStorage.getItem(LS_VISITS) ?? "0", 10) || 0) + 1;
    localStorage.setItem(LS_VISITS, String(visits));

    const threshold = parseInt(localStorage.getItem(LS_THRESHOLD) ?? "3", 10) || 3;

    if (visits >= threshold) {
      const t = setTimeout(() => setShown(true), SHOW_DELAY);
      return () => clearTimeout(t);
    }
  }, []);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermState(perm as PermState);

      if (perm !== "granted") {
        setShown(false);
        setLoading(false);
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      localStorage.setItem(LS_DONE, "1");
      setSubscribed(true);
      setShown(false);
    } catch (err) {
      console.error("Push subscribe error:", err);
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") {
        setError("Notifications bloquées (navigation privée). Réessayez dans une fenêtre normale.");
      } else if (name === "NotAllowedError") {
        setPermState("denied");
        setShown(false);
      } else {
        setError("Erreur lors de l'activation. Réessayez.");
      }
    }
    setLoading(false);
  }

  function dismiss(later: boolean) {
    setShown(false);
    setDismissed(true);
    if (later) {
      // Remind again after REMIND_AFTER more visits
      const visits = parseInt(localStorage.getItem(LS_VISITS) ?? "0", 10) || 0;
      localStorage.setItem(LS_THRESHOLD, String(visits + REMIND_AFTER));
    } else {
      // X button — same "later" behaviour (don't permanently silence)
      const visits = parseInt(localStorage.getItem(LS_VISITS) ?? "0", 10) || 0;
      localStorage.setItem(LS_THRESHOLD, String(visits + REMIND_AFTER));
    }
  }

  if (pathname?.startsWith("/admin")) return null;

  if (permState === "unsupported" || permState === "denied" || subscribed || dismissed || !shown) {
    return null;
  }

  const benefits = [
    { icon: "🔥", label: "Offres flash & ventes privées" },
    { icon: "📦", label: "Statut commande en temps réel" },
    { icon: "🎁", label: "Codes promo en avant-première" },
  ];

  return (
    <div
      className="fixed bottom-6 right-4 z-[9990] w-[340px] bg-white rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-white/60"
      style={{ fontFamily: "var(--font-sans, Inter, sans-serif)" }}
    >
      {/* Top gradient bar */}
      <div
        className="relative px-5 pt-5 pb-4"
        style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)" }}
      >
        {/* Dismiss */}
        <button
          onClick={() => dismiss(false)}
          aria-label="Fermer"
          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Brand row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
            <img src="/favicon.png" alt="L'ecomax" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white text-xs font-black tracking-wide">L&apos;ECOMAX</p>
            <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase">Mode · Tech · Sport</p>
          </div>
        </div>

        {/* Headline */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(62,207,76,0.15)", border: "1px solid rgba(62,207,76,0.25)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight mb-1">
              Restez informé en temps réel
            </p>
            <p className="text-white/50 text-[11px] leading-relaxed">
              Offres exclusives et nouveautés directement sur votre appareil.
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5">
        {/* Benefits */}
        <div className="space-y-2.5 mb-5">
          {benefits.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: "#f4fef5" }}
              >
                {icon}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="3" className="flex-shrink-0">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-xs text-neutral-700 font-medium">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={subscribe}
          disabled={loading}
          className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-60 active:scale-[0.98]"
          style={{
            background: loading
              ? "#2aad38"
              : "linear-gradient(135deg, #3ecf4c 0%, #2db83a 100%)",
            boxShadow: "0 4px 16px rgba(62,207,76,0.35)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Activation en cours…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Activer les notifications
            </span>
          )}
        </button>

        {error && (
          <p className="text-[11px] text-red-500 text-center mb-2 mt-1">{error}</p>
        )}

        <button
          onClick={() => dismiss(true)}
          className="w-full mt-2.5 py-2 text-xs text-neutral-400 hover:text-neutral-600 font-medium transition-colors"
        >
          Plus tard
        </button>

        {/* Trust note */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-[10px] text-neutral-400">
            Désactivable à tout moment dans les paramètres
          </p>
        </div>
      </div>
    </div>
  );
}
