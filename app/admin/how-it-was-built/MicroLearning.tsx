"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_LEARNING_SETTINGS, LEARNING_INTERVALS, learningProgress, learningTipUrl, type LearningHistory, type LearningSettings, type LearningTip } from "@/lib/micro-learning";
import { registerLearningDevice } from "@/lib/register-learning-device";
import styles from "./MicroLearning.module.css";

type LearningData = { settings: LearningSettings; tips: LearningTip[]; history: LearningHistory[]; deviceCount: number; configured: boolean; schedulerConfigured: boolean };
const endpoint = "/api/admin/micro-learning";

export default function MicroLearning({ tipId }: { tipId?: number }) {
  const [data, setData] = useState<LearningData | null>(null);
  const [settings, setSettings] = useState(DEFAULT_LEARNING_SETTINGS);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const readTip = useRef<number | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(endpoint, { cache: "no-store", signal: signal ?? AbortSignal.timeout(20_000) });
    const result = await response.json();
    if (!response.ok) throw new Error(response.status === 403 ? "افتح مركز التعلم برمز الدخول ثم حاول مرة أخرى." : result.error || "تعذر تحميل التعلم.");
    setData(result); setSettings(result.settings); setError("");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
      void navigator.serviceWorker.getRegistration("/").then(worker => worker?.pushManager.getSubscription()).then(subscription => setDeviceReady(Boolean(subscription))).catch(() => undefined);
    }
    return () => controller.abort();
  }, [load]);

  async function mutate(body: unknown) {
    const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "تعذر حفظ التغيير.");
  }

  const current = data?.tips.find(tip => tip.id === tipId);
  const currentHistory = data?.history.find(row => row.tip_id === tipId);
  useEffect(() => {
    if (!tipId || !currentHistory || currentHistory.read_at || readTip.current === tipId) return;
    readTip.current = tipId;
    void mutate({ action: "history", tipId, field: "read", value: true }).then(() => load()).catch(reason => { readTip.current = null; setError(reason.message); });
  }, [tipId, currentHistory, load]);

  async function action(work: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try { await work(); await load(); setMessage(success); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "حدث خطأ. حاول مرة أخرى."); }
    finally { setBusy(false); }
  }

  const progress = data ? learningProgress(data.tips, data.history) : null;
  const history = data?.history.filter(row => (!topic || row.topic === topic) && (!level || row.level === Number(level)) && (!favoritesOnly || row.favorite) && `${row.title} ${row.content}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  const status = !settings.enabled ? "الإشعارات متوقفة" : settings.paused ? "التعلم متوقف مؤقتًا" : "التعلم مفعّل";

  return <div className={styles.root} dir="rtl" lang="ar">
    <div className={styles.row}><Link className={styles.secondary} href="/admin/how-it-was-built/">العودة إلى مركز التعلم</Link>{tipId && <Link className={styles.secondary} href="/admin/how-it-was-built/learn/">معلومات تعلمتها</Link>}</div>
    {error && <div role="alert" className={styles.error}>{error}<button className={styles.secondary} onClick={() => void action(async () => {}, "تم التحديث.")} disabled={busy}>حاول مرة أخرى</button></div>}
    {message && <p role="status" className={styles.notice}>{message}</p>}
    {!data && !error && <p role="status" className={styles.card}>جارٍ تحميل معلوماتك…</p>}
    {data && current && <article className={styles.card}>
      <span className={styles.tag}>المستوى {current.level} · {current.topic}</span><span className={styles.tag}>حوالي دقيقة</span>
      <h1>{current.title}</h1><div className={styles.content}>{current.content}</div>
      {current.code && <pre className={styles.code}><code>{current.code}</code></pre>}
      <p className={styles.notice}>{current.title.startsWith("❓") ? "الإجابة: " : "تذكر: "}{current.remember}</p>
      {current.source_path && <p className={styles.muted}>مكان مرتبط في مشروعك: <bdi>{current.source_path}</bdi> · الأمثلة مبسطة للتعلم.</p>}
      {currentHistory ? <div className={styles.row}>
        <button className={styles.button} disabled={busy} aria-pressed={Boolean(currentHistory.learned_at)} onClick={() => void action(() => mutate({ action: "history", tipId, field: "learned", value: !currentHistory.learned_at }), "تم حفظ تقدمك.")}>{currentHistory.learned_at ? "✓ تعلمتها — إلغاء العلامة" : "فهمت هذه المعلومة"}</button>
        <button className={styles.secondary} disabled={busy} aria-pressed={currentHistory.favorite} onClick={() => void action(() => mutate({ action: "history", tipId, field: "favorite", value: !currentHistory.favorite }), "تم حفظ المفضلة.")}>{currentHistory.favorite ? "★ في المفضلة" : "☆ أضف إلى المفضلة"}</button>
      </div> : <p className={styles.muted}>هذه معاينة. سيُحفظ تقدم هذه المعلومة عندما تصل ضمن مسارك.</p>}
    </article>}
    {data && tipId && !current && <p className={styles.error}>هذه المعلومة غير موجودة.</p>}
    {data && !tipId && <>
      <section className={`${styles.card} ${styles.hero}`}><p className={styles.muted}>معلمك الصغير · Next.js</p><h1>فكرة واحدة، كل 10 دقائق.</h1><p>تعلم بهدوء من أمثلة متجر L&apos;ECOMAX. نبدأ من الأساسيات ونتقدم بالترتيب. الإشعارات كلها بالعربية.</p><div className={styles.row}><span className={styles.tag}>{status}</span><span className={styles.tag}>{data.tips.length} معلومة · 34 موضوعًا</span></div><p className={styles.muted}>يمكن أن تصل الإشعارات والموقع مغلق، إذا سمح جهازك بذلك. قد يختصر الهاتف النص؛ اضغط لقراءة المعلومة كاملة.</p></section>
      {progress && <section className={styles.card}><h2>تقدمي في Next.js</h2><div className={styles.grid}>
        <div className={styles.metric}><strong>{progress.level}</strong>المستوى الحالي</div><div className={styles.metric}><strong>{progress.learned}</strong>معلومة تعلمتها</div><div className={styles.metric}><strong>{progress.topics}</strong>موضوعًا أكملته</div>
      </div><progress value={progress.percent} max={100} aria-label="تقدم التعلم" /><p className={styles.muted}>{progress.percent}% · وصلت {progress.received} معلومة. تقدمك يتحدث عند اختيار «فهمت هذه المعلومة».</p>{progress.learned === progress.total && progress.total > 0 && <p className={styles.notice}>أكملت المسار! يمكنك مراجعة معلوماتك. لن نعيد إرسال الدروس القديمة.</p>}</section>}
      <section className={styles.card}><h2>إشعارات التعلم</h2>
        {!data.configured && <p className={styles.error}>إعداد Push غير مكتمل على Server.</p>}
        {!data.schedulerConfigured && <p className={styles.error}>الإرسال التلقائي غير جاهز بعد. يحتاج الموقع إلى إكمال إعداد الجدولة على Server.</p>}
        <p className={styles.muted}>{data.deviceCount} جهاز مسجل · {deviceReady ? "هذا المتصفح يسمح بالإشعارات" : "سجّل هذا الجهاز لاستقبال المعلومات عليه"}</p>
        <div className={styles.row}><button className={styles.button} disabled={busy || !data.configured} onClick={() => void action(async () => { await registerLearningDevice(); setDeviceReady(true); await mutate({ action: "settings", settings: { ...settings, enabled: true, paused: false } }); }, "تم تفعيل التعلم على هذا الجهاز. المعلومة التالية حسب الموعد المحفوظ.")}>{deviceReady ? "تفعيل / تسجيل هذا الجهاز" : "اسمح بالإشعارات وابدأ التعلم"}</button>
          {settings.enabled && <button className={styles.secondary} disabled={busy} onClick={() => void action(() => mutate({ action: "settings", settings: { ...settings, paused: !settings.paused } }), settings.paused ? "استأنفنا التعلم." : "أوقفنا التعلم مؤقتًا.")}>{settings.paused ? "استئناف التعلم" : "إيقاف مؤقت"}</button>}
        </div>
        <form onSubmit={event => { event.preventDefault(); void action(() => mutate({ action: "settings", settings }), "تم حفظ الإعدادات."); }}>
          <label className={styles.check}><input type="checkbox" checked={settings.enabled} onChange={event => setSettings({ ...settings, enabled: event.target.checked })} />إشعارات التعلم ON / OFF</label>
          <label className={styles.field}>معلومة كل<select value={settings.interval_minutes} onChange={event => setSettings({ ...settings, interval_minutes: Number(event.target.value) })}>{LEARNING_INTERVALS.map(minutes => <option key={minutes} value={minutes}>{minutes === 60 ? "ساعة" : `${minutes} دقائق`}</option>)}</select></label>
          <label className={styles.check}><input type="checkbox" checked={settings.quiet_enabled} onChange={event => setSettings({ ...settings, quiet_enabled: event.target.checked })} />وقت هدوء دون إشعارات</label>
          {settings.quiet_enabled && <div className={styles.grid}><label className={styles.field}>من<input type="time" required value={settings.quiet_start} onChange={event => setSettings({ ...settings, quiet_start: event.target.value })} /></label><label className={styles.field}>إلى<input type="time" required value={settings.quiet_end} onChange={event => setSettings({ ...settings, quiet_end: event.target.value })} /></label></div>}
          <label className={styles.field}>المنطقة الزمنية<input dir="ltr" required value={settings.time_zone} onChange={event => setSettings({ ...settings, time_zone: event.target.value })} placeholder="Europe/Paris" /></label>
          <button type="button" className={styles.secondary} onClick={() => setSettings({ ...settings, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone })}>استخدم توقيت جهازي</button>
          <div className={styles.row}><button className={styles.button} disabled={busy} type="submit">حفظ الإعدادات</button></div>
        </form>
        {settings.enabled && !settings.paused && settings.next_due_at && <p className={styles.muted}>الموعد المحفوظ: {new Date(settings.next_due_at).toLocaleString("ar", { timeZone: data.settings.time_zone })}. إذا كان ضمن وقت الهدوء، ننتظر حتى ينتهي.</p>}
        <p className={styles.muted}>الإعدادات مشتركة بين أجهزتك. إيقاف التعلم لا يوقف إشعارات طلبات المتجر.</p>
      </section>
      <section className={styles.card}><h2>معلومات تعلمتها</h2>
        <label className={styles.field}>ابحث في معلوماتك<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="مثلًا: Props أو المنتج" /></label>
        <div className={styles.grid}><label className={styles.field}>الموضوع<select value={topic} onChange={event => setTopic(event.target.value)}><option value="">كل المواضيع</option>{[...new Set(data.tips.map(tip => tip.topic))].map(value => <option key={value}>{value}</option>)}</select></label><label className={styles.field}>المستوى<select value={level} onChange={event => setLevel(event.target.value)}><option value="">كل المستويات</option>{[...new Set(data.tips.map(tip => tip.level))].map(value => <option key={value}>{value}</option>)}</select></label></div>
        <label className={styles.check}><input type="checkbox" checked={favoritesOnly} onChange={event => setFavoritesOnly(event.target.checked)} />المفضلة فقط</label>
        <button className={styles.secondary} disabled={busy} onClick={() => void action(async () => {}, "تم تحديث المعلومات.")}>تحديث المعلومات</button>
        <div className={styles.list}>{history.map(row => <article className={styles.lesson} key={row.id}><span className={styles.tag}>المستوى {row.level}</span><span className={styles.tag}>{row.learned_at ? "✓ تعلمتها" : row.read_at ? "قرأتها" : "جديدة"}</span>{row.favorite && <span aria-label="في المفضلة">★</span>}<Link href={learningTipUrl(row.tip_id)}>{row.title}</Link><p className={styles.muted}>{new Date(row.created_at).toLocaleDateString("ar")} · {row.delivery_state === "accepted" ? "أُرسلت إلى خدمة Push" : row.delivery_state === "partial" ? "أُرسلت لبعض الأجهزة" : row.delivery_state === "failed" ? "لم تصل — يمكنك قراءتها هنا" : row.delivery_state === "unknown" ? "تعذر تأكيد الإرسال — يمكنك قراءتها هنا" : "جارٍ الإرسال"}</p></article>)}</div>
        {!history.length && <p className={styles.notice}>{data.history.length ? "لا توجد معلومات تطابق البحث." : "ستجد هنا كل معلومة يرسلها مسارك. ابدأ بتفعيل الإشعارات."}</p>}
        {!data.history.length && data.tips[0] && <Link className={styles.secondary} href={learningTipUrl(data.tips[0].id)}>شاهد مثالًا من أول درس</Link>}
      </section>
    </>}
  </div>;
}
