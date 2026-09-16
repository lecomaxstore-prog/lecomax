"use client";

import { useEffect, useRef, useState } from "react";

const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/\s+/g, "");
const STORAGE_KEY = "lecomax_admin_push_enabled";
const SERVICE_WORKER_URL = "/sw.js";
const PUSH_TIMEOUT_MS = 20_000;

type PushState = "checking" | "off" | "on" | "loading" | "denied" | "unsupported" | "unconfigured" | "error";

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
    const timeout = window.setTimeout(() => {
      worker.removeEventListener("statechange", onStateChange);
      reject(new Error("Le service de notifications met trop de temps à démarrer."));
    }, PUSH_TIMEOUT_MS);
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
    onStateChange();
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
  const [testing, setTesting] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const busy = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (busy.current || document.visibilityState === "hidden") return;
      if (!VAPID_PUBLIC_KEY) {
        if (!cancelled) setState("unconfigured");
        return;
      }
      if (!window.isSecureContext || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
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
      busy.current = true;
      try {
        const registration = await registerPushWorker();
        if (Notification.permission !== "granted") {
          if (!cancelled) setState("off");
          return;
        }
        const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        let subscription = await registration.pushManager.getSubscription();
        if (subscription && !sameApplicationServerKey(subscription, key)) {
          await subscription.unsubscribe();
          subscription = null;
        }
        subscription ??= await subscribeWithTimeout(registration, key);
        const response = await fetch("/api/admin/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
          signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(response.status === 401 ? "Reconnectez-vous au panneau admin pour rétablir les alertes." : "Synchronisation impossible. Une nouvelle tentative sera faite à la reconnexion.");
        registration.active?.postMessage({ type: "RETRY_PUSH_RENEWAL" });
        if (!cancelled) {
          setState("on");
          setMessage(null);
          setLastChecked(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (error) {
        if (!cancelled) { setState("error"); setMessage(friendlyPushError(error)); }
      } finally {
        busy.current = false;
      }
    }
    void check();
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    const interval = window.setInterval(check, 5 * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("online", check);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  async function enable() {
    if (busy.current) return;
    busy.current = true;
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

        // This worker is shared with customer notifications; never unregister it.
        await registration.update().catch(() => undefined);
        registration = await registerPushWorker();
        subscription = await subscribeWithTimeout(registration, applicationServerKey);
      }

      const response = await fetch("/api/admin/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
        signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Activation impossible");
      localStorage.setItem(STORAGE_KEY, "1");
      setState("on");
      setLastChecked(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      setMessage("Notifications activées sur cet appareil.");
    } catch (error) {
      setState("error");
      setMessage(friendlyPushError(error));
    } finally {
      busy.current = false;
    }
  }

  async function disable() {
    if (busy.current) return;
    busy.current = true;
    setState("loading");
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/admin/push-subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
          signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error("Désactivation impossible");
      }
      localStorage.removeItem(STORAGE_KEY);
      setState("off");
      setMessage("Notifications désactivées sur cet appareil.");
    } catch {
      setState("error");
      setMessage("Impossible de désactiver les notifications.");
    } finally {
      busy.current = false;
    }
  }

  async function sendTest() {
    if (testing) return;
    setTesting(true);
    setMessage("Envoi du test…");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) throw new Error("Réactivez les alertes sur cet appareil avant de lancer le test.");
      const response = await fetch("/api/admin/push-test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Échec du test");
      if (!result.sent) throw new Error("Le test n’a pas été accepté. Réactivez les alertes puis réessayez.");
      setMessage("Test transmis à cet appareil. Vérifiez sa réception dans vos notifications.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Échec du test");
    } finally {
      setTesting(false);
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
          <dialog ref={dialogRef} aria-labelledby="admin-push-title" aria-describedby="admin-push-description"
            onCancel={(event) => { event.preventDefault(); setOpen(false); }}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-neutral-200 bg-white p-0 text-neutral-900 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm">
            <div className="relative bg-[#173c2c] px-5 py-5 text-white sm:px-6">
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer les alertes admin" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 6-12 12M6 6l12 12"/></svg></button>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#c0dec9]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg></div>
              <h2 id="admin-push-title" className="pr-8 text-xl font-semibold tracking-tight">Vos alertes admin</h2>
              <p id="admin-push-description" className="mt-2 text-sm leading-relaxed text-white/70">Commandes et demandes clients, même lorsque le panneau admin est fermé.</p>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-2">
                {[{ label: "Commandes", color: "bg-blue-50 text-blue-700" }, { label: "Messages", color: "bg-violet-50 text-violet-700" }, { label: "Live chat", color: "bg-orange-50 text-orange-700" }].map((item) => <div key={item.label} className={`rounded-xl px-2 py-3 text-center text-[10px] font-black ${item.color}`}>{item.label}</div>)}
              </div>

              {state === "denied" && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700">Les notifications sont bloquées dans le navigateur. Autorisez-les dans les réglages du site, puis rechargez cette page.</div>}
              {state === "unsupported" && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">Ouvrez le site en HTTPS dans un navigateur compatible. Sur iPhone, ajoutez L&apos;ecomax à l&apos;écran d&apos;accueil depuis Safari, puis ouvrez l&apos;application installée.</div>}
              {state === "unconfigured" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Le service de notifications n’est pas configuré sur cette version du site.</p>}
              {message && <div role="status" aria-live="polite" className={`mt-4 rounded-xl p-3 text-xs leading-relaxed ${state === "error" ? "bg-red-50 text-red-700" : "bg-neutral-50 text-neutral-700"}`}>{message}</div>}

              <div className="mt-5 flex flex-col gap-2">
                {isOn ? (
                  <>
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-xs font-black text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Alertes actives sur cet appareil</div>
                    {lastChecked && <p className="text-center text-[11px] text-neutral-500">Connexion vérifiée à {lastChecked}</p>}
                    <button type="button" onClick={sendTest} disabled={testing} className="min-h-12 rounded-xl bg-[#173c2c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20533d] disabled:opacity-50">{testing ? "Envoi en cours…" : "Tester sur cet appareil"}</button>
                    <button type="button" onClick={disable} disabled={testing} className="min-h-11 py-2 text-xs font-semibold text-neutral-500 hover:text-red-600">Désactiver sur cet appareil</button>
                  </>
                ) : (
                  <button type="button" onClick={enable} disabled={["loading", "checking", "denied", "unsupported", "unconfigured"].includes(state)}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#173c2c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20533d] disabled:cursor-not-allowed disabled:opacity-40">
                    {state === "loading" && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"/>}
                    {state === "loading" ? "Mise à jour…" : state === "checking" ? "Vérification…" : state === "error" ? "Rétablir les alertes" : "Activer sur cet appareil"}
                  </button>
                )}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-neutral-500">Autorisez les notifications et l’activité en arrière-plan dans les réglages du téléphone. Le mode Ne pas déranger et les économies de batterie peuvent retarder les alertes.</p>
              <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">Activez les alertes sur chaque appareil souhaité. La connexion est vérifiée automatiquement à votre retour et après une reconnexion.</p>
            </div>
          </dialog>
      )}
    </>
  );
}
