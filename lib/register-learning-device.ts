async function withPushTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("خدمة الإشعارات لم تستجب. تحقق من الاتصال ثم حاول مرة أخرى.")), 20_000);
    })]);
  } finally { clearTimeout(timer); }
}

/** Reuse the admin subscription endpoint and the site's existing service worker. */
export async function registerLearningDevice() {
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("هذا المتصفح لا يدعم Push هنا. على iPhone أضف الموقع إلى الشاشة الرئيسية وافتحه منها عبر HTTPS.");
  }
  const key = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/\s/g, "");
  if (!key) throw new Error("إعداد Push غير مكتمل على Server.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("الإشعارات غير مسموحة. يمكنك السماح بها من إعدادات الموقع في Browser.");
  const registration = await withPushTimeout(navigator.serviceWorker.register("/sw.js", { scope: "/" }));
  const ready = await withPushTimeout(navigator.serviceWorker.ready);
  void registration.update().catch(() => undefined);
  const bytes = Uint8Array.from(atob(key.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
  const existing = await ready.pushManager.getSubscription();
  const subscription = existing ?? await withPushTimeout(ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes }));
  const response = await fetch("/api/admin/push-subscribe", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()), signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("تعذر تسجيل الجهاز. تأكد من تسجيل الدخول وحاول مرة أخرى.");
  try { localStorage.setItem("lecomax_admin_push_enabled", "1"); } catch { /* Storage is optional. */ }
}
