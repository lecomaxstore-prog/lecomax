import { apiRequest } from "@/lib/api-client";
import { secureGetItem, secureRemoveItem, secureSetItem } from "@/lib/secure-storage";

const DISABLED = "lecomax.push-disabled";
const REGISTERED = "lecomax.web-push-registered";
const INSTALLATION = "lecomax.web-installation";
const supported = () => typeof window !== "undefined" && window.isSecureContext && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

async function installationId() {
  const existing = await secureGetItem(INSTALLATION);
  if (existing) return existing;
  const id = crypto.randomUUID();
  await secureSetItem(INSTALLATION, id);
  return id;
}

export async function getPushNotificationState() {
  if (!supported()) return { supported: false, enabled: false, status: "unsupported" as const };
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return {
    supported: true,
    enabled: Notification.permission === "granted" && Boolean(subscription) && await secureGetItem(REGISTERED) === subscription?.endpoint && await secureGetItem(DISABLED) !== "true",
    status: Notification.permission === "default" ? "undetermined" : Notification.permission,
  };
}

export async function registerForPushNotifications(_userId?: string, options: { requestPermission?: boolean } = {}) {
  if (!supported()) return null;
  // Request directly from the customer's click, before asynchronous storage/network work.
  const permission = Notification.permission === "default" && options.requestPermission !== false
    ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") return null;
  if (options.requestPermission === false && await secureGetItem(DISABLED) === "true") return null;
  const { publicKey } = await apiRequest<{ publicKey: string }>("/api/mobile/web-push");
  if (!publicKey) throw new Error("Push notifications are not configured.");
  const registration = await navigator.serviceWorker.register("/notification-worker.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
  const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
  await apiRequest("/api/mobile/web-push", { method: "POST", body: JSON.stringify({ subscription: subscription.toJSON(), installationId: await installationId() }) });
  await secureSetItem(REGISTERED, subscription.endpoint);
  await secureRemoveItem(DISABLED);
  return subscription.endpoint;
}

export async function disablePushNotifications() {
  if (!supported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await apiRequest("/api/mobile/web-push", { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint, installationId: await installationId() }) });
    await subscription.unsubscribe();
  }
  await secureSetItem(DISABLED, "true");
  await secureRemoveItem(REGISTERED);
}
