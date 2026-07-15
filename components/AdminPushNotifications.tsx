"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/\s+/g, "");
const STORAGE_KEY = "lecomax_admin_push_enabled";
const SERVICE_WORKER_URL = "/sw.js";
const PUSH_TIMEOUT_MS = 20_000;

type PushState = "checking" | "off" | "on" | "loading" | "denied" | "unsupported" | "error";

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function sameApplicationServerKey(subscription: PushSubscription, expected: Uint8Array<ArrayBuffer>) {
  const current = subscription.options.applicationServerKey;
  if (!current) return false;
  const bytes = new Uint8Array(current);
  return bytes.length === expected.length && bytes.every((byte, index) => byte === expected[index]);
}

function waitForActiveWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) return Promise.resolve(registration);
  const worker = registration.installing ?? registration.waiting;
  if (!worker) return navigator.serviceWorker.ready;

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Le service de notifications met trop de temps à démarrer.")), PUSH_TIMEOUT_MS);
    const onStateChange = () => {
      if (worker.state === "activated") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        resolve(registration);
      } else if (worker.state === "redundant") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        reject(new Error("Le service de notifications n’a pas pu démarrer."));
      }
    };
    worker.addEventListener("statechange", onStateChange);
  });
}

async function registerPushWorker() {
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
    scope: "/",
    updateViaCache: "none",
  });
  return waitForActiveWorker(registration);
}

async function subscribeWithTimeout(registration: ServiceWorkerRegistration, applicationServerKey: Uint8Array<ArrayBuffer>) {
  let timeoutId = 0;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("Le service Push Android ne répond pas. Vérifiez votre connexion puis réessayez.")),
      PUSH_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([
      registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }),
      timeout,
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function isRecoverablePushError(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}`.toLowerCase() : String(error).toLowerCase();
  return text.includes("push service") || text.includes("registration failed") || text.includes("aborterror") || text.includes("networkerror");
}

function friendlyPushError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (/push service|registration failed|aborterror|networkerror/i.test(text)) {
    return "Le service Push Android n’a pas répondu. Mettez Chrome et les Services Google Play à jour, autorisez leurs données en arrière-plan, puis réessayez en Wi-Fi ou en 4G.";
  }
  if (/applicationserverkey|vapid|clé|key/i.test(text)) {
    return "La clé de notification de ce déploiement est invalide. Rechargez la page puis réessayez.";
  }
  if (/service worker|notifications met trop de temps|notifications n’a pas pu/i.test(text)) {
    return "Le service de notifications n’a pas démarré. Fermez complètement l’application, rouvrez-la puis réessayez.";
  }
  return text || "Activation impossible. Vérifiez les réglages de notification de votre navigateur puis réessayez.";
}

export default function AdminPushNotifications() {
  const [state, setState] = useState<PushState>("checking");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        if (!cancelled) setState("off");
        return;
      }
      try {
        const registration = await registerPushWorker();
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          localStorage.removeItem(STORAGE_KEY);
          if (!cancelled) setState("off");
          return;
        }
        const response = await fetch("/api/admin/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (!response.ok) throw new Error("Synchronisation impossible");
        if (!cancelled) setState("on");
      } catch {
        if (!cancelled) setState("error");
      }
    }
    void check();
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    setState("loading");
    setMessage(null);
    try {
      if (!window.isSecureContext) throw new Error("Les notifications nécessitent une connexion HTTPS sécurisée.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      if (applicationServerKey.length !== 65 || applicationServerKey[0] !== 4) {
        throw new Error("Clé VAPID invalide");
      }

      let registration = await registerPushWorker();
      let existing = await registration.pushManager.getSubscription();
      if (existing && !sameApplicationServerKey(existing, applicationServerKey)) {
        await existing.unsubscribe();
        existing = null;
      }

      let subscription: PushSubscription;
      try {
        subscription = existing ?? await subscribeWithTimeout(registration, applicationServerKey);
      } catch (firstError) {
        if (!isRecoverablePushError(firstError)) throw firstError;

        // Android/Chromium can retain a broken FCM registration. Reinstalling the
        // dedicated worker once clears that stale state without repeatedly prompting.
        const staleSubscription = await registration.pushManager.getSubscription().catch(() => null);
        if (staleSubscription) await staleSubscription.unsubscribe().catch(() => false);
        await registration.unregister();
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        registration = await registerPushWorker();
        subscription = await subscribeWithTimeout(registration, applicationServerKey);
      }

      const response = await fetch("/api/admin/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Activation impossible");
      localStorage.setItem(STORAGE_KEY, "1");
      setState("on");
      setMessage("Notifications activées sur cet appareil.");
    } catch (error) {
      setState("error");
      localStorage.removeItem(STORAGE_KEY);
      setMessage(friendlyPushError(error));
    }
  }

  async function disable() {
    setState("loading");
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/admin/push-subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      localStorage.removeItem(STORAGE_KEY);
      setState("off");
      setMessage("Notifications désactivées sur cet appareil.");
    } catch {
      setState("error");
      setMessage("Impossible de désactiver les notifications.");
    }
  }

  async function sendTest() {
    setMessage("Envoi du test…");
    try {
      const response = await fetch("/api/admin/push-test", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Échec du test");
      setMessage(result.sent > 0 ? "Notification test envoyée ✓" : "Aucun appareil admin enregistré.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Échec du test");
    }
  }

  const isOn = state === "on";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={isOn ? "Notifications admin activées" : "Activer les notifications admin"}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${isOn ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 hover:text-black"}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
        {isOn ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" /> : state === "off" ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-orange-500" /> : null}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="admin-push-title" className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative bg-neutral-950 px-5 py-5 text-white sm:px-6">
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 6-12 12M6 6l12 12"/></svg></button>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3ecf4c] text-black"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg></div>
              <h2 id="admin-push-title" className="text-lg font-black">Alertes admin sur cet appareil</h2>
              <p className="mt-1 pr-8 text-xs leading-relaxed text-white/60">Recevez les commandes et demandes clients même lorsque le panneau admin est fermé.</p>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-2">
                {[{ label: "Commandes", color: "bg-blue-50 text-blue-700" }, { label: "Messages", color: "bg-violet-50 text-violet-700" }, { label: "Live chat", color: "bg-orange-50 text-orange-700" }].map((item) => <div key={item.label} className={`rounded-xl px-2 py-3 text-center text-[10px] font-black ${item.color}`}>{item.label}</div>)}
              </div>

              {state === "denied" && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700">Les notifications sont bloquées dans le navigateur. Autorisez-les dans les réglages du site, puis rechargez cette page.</div>}
              {state === "unsupported" && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">Sur iPhone, ajoutez d&apos;abord L&apos;ecomax à l&apos;écran d&apos;accueil depuis Safari, ouvrez l&apos;application installée, puis activez les alertes ici.</div>}
              {message && <div className={`mt-4 rounded-xl p-3 text-center text-xs font-semibold ${state === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>}

              <div className="mt-5 flex flex-col gap-2">
                {isOn ? (
                  <>
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-xs font-black text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Alertes actives sur cet appareil</div>
                    <button onClick={sendTest} className="rounded-xl bg-black px-4 py-3 text-xs font-black text-white hover:bg-neutral-800">Envoyer une notification test</button>
                    <button onClick={disable} className="py-2 text-xs font-semibold text-neutral-400 hover:text-red-600">Désactiver sur cet appareil</button>
                  </>
                ) : (
                  <button onClick={enable} disabled={state === "loading" || state === "denied" || state === "unsupported"}
                    className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-xs font-black text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">
                    {state === "loading" && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"/>}
                    {state === "loading" ? "Activation…" : "Activer les alertes admin"}
                  </button>
                )}
              </div>
              <p className="mt-4 text-center text-[9px] leading-relaxed text-neutral-400">Activez séparément chaque téléphone ou ordinateur sur lequel vous souhaitez recevoir les alertes.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
