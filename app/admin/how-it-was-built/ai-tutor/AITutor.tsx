"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TUTOR_MODES, TUTOR_TOPICS, TUTOR_ACTIONS, TUTOR_ERROR, tutorExampleForTopic, type TutorExample, type TutorMode, type TutorTopic, type TutorAction, type TutorConversation, type TutorMessage, type TutorProgress } from "@/lib/ai-tutor";
import TutorMarkdown from "./TutorMarkdown";
import SiteExamples from "./SiteExamples";
import styles from "./Tutor.module.css";

const endpoint = "/api/admin/ai-tutor";
type Overview = { conversations: TutorConversation[]; bookmarks: TutorMessage[]; progress: TutorProgress[]; configured: boolean };
const empty: Overview = { conversations: [], bookmarks: [], progress: [], configured: true };
async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 403 || response.status === 401 ? "انتهت جلسة الدخول. افتح مساحة التعلم من جديد ثم حاول." : data.error || TUTOR_ERROR);
  return data;
}
const jsonInit = (method: string, body: unknown) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function AITutor() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview>(empty);
  const [conversation, setConversation] = useState<TutorConversation | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [mode, setMode] = useState<TutorMode>("explain");
  const [topic, setTopic] = useState<TutorTopic>("nextjs");
  const [draft, setDraft] = useState("");
  const [code, setCode] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [sourceLine, setSourceLine] = useState(1);
  const [attempt, setAttempt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [library, setLibrary] = useState<"history" | "bookmarks" | "progress" | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [retry, setRetry] = useState<{ text: string; code: string; action?: TutorAction; targetId?: string } | null>(null);
  const request = useRef<AbortController | null>(null);
  const opening = useRef<AbortController | null>(null);
  const isSending = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const follow = useRef(true);

  const refresh = useCallback(async () => { const data = await jsonRequest(endpoint); setOverview(data); }, []);
  useEffect(() => {
    let active = true;
    const context = new URLSearchParams(window.location.search);
    if (context.get("path")) { setSourcePath(context.get("path")!.slice(0,600)); setSourceLine(Math.max(1,Math.min(100000,Math.floor(Number(context.get("line")) || 1)))); setMode("project"); setDraft("اشرح هذا الجزء من كود موقعي، خطوة بخطوة."); }
    jsonRequest(endpoint).then(data => { if (active) setOverview(data); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; request.current?.abort(); opening.current?.abort(); };
  }, []);
  useEffect(() => {
    const scroller = document.getElementById("admin-main");
    const scroll = () => { follow.current = scroller && scroller.scrollHeight > scroller.clientHeight ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 350 : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 350; };
    const viewport = () => document.documentElement.style.setProperty("--tutor-keyboard", `${Math.max(0, window.innerHeight - (window.visualViewport?.height ?? window.innerHeight) - (window.visualViewport?.offsetTop ?? 0))}px`);
    window.addEventListener("scroll", scroll, { passive: true });
    scroller?.addEventListener("scroll", scroll, { passive: true });
    window.visualViewport?.addEventListener("resize", viewport);
    window.visualViewport?.addEventListener("scroll", viewport);
    return () => { window.removeEventListener("scroll", scroll); scroller?.removeEventListener("scroll", scroll); window.visualViewport?.removeEventListener("resize", viewport); window.visualViewport?.removeEventListener("scroll", viewport); document.documentElement.style.removeProperty("--tutor-keyboard"); };
  }, []);
  useEffect(() => { if (busy && follow.current) end.current?.scrollIntoView({ block: "end" }); }, [messages, busy]);

  async function openConversation(item: TutorConversation | string) {
    if (isSending.current) return;
    opening.current?.abort();
    const controller = new AbortController(); opening.current = controller;
    setLoading(true); setError(""); setRetry(null);
    try {
      const data = await jsonRequest(`${endpoint}?conversation=${typeof item === "string" ? item : item.id}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setConversation(data.conversation); setMessages(data.messages); setMode(data.conversation.mode); setTopic(data.conversation.topic); setLibrary(null); setDraft(""); setCode("");
      const source = [...(data.messages as TutorMessage[])].reverse().find(message => message.sources?.length)?.sources[0];
      setSourcePath(source?.path || ""); setSourceLine(source?.startLine || 1);
    } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : TUTOR_ERROR); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  function newLesson() {
    if (isSending.current) return;
    opening.current?.abort(); setLoading(false); setConversation(null); setMessages([]); setDraft(""); setCode(""); setSourcePath(""); setSourceLine(1); setAttempt(false); setError(""); setNotice(""); setRetry(null); setLibrary(null); input.current?.focus();
  }
  async function send(text = draft, selectedCode = code, action?: TutorAction, targetId?: string) {
    if (isSending.current || !text.trim() || loading) return;
    isSending.current = true; setBusy(true); setError(""); setNotice(""); setRetry(null); follow.current = true;
    const controller = new AbortController(); request.current = controller;
    let current = conversation;
    let assistantId = "";
    let finished = false;
    try {
      if (!current) {
        const data = await jsonRequest(endpoint, { ...jsonInit("POST", { title: text.trim().slice(0, 100), mode, topic }), signal: controller.signal });
        current = data.conversation as TutorConversation; setConversation(current);
      }
      const response = await fetch(`${endpoint}/message`, { ...jsonInit("POST", { conversationId: current.id, requestId: crypto.randomUUID(), mode, topic, text, code: selectedCode, attempt, ...(sourcePath.trim() ? { sourcePath: sourcePath.trim(), sourceLine } : {}), ...(action ? { action, targetId } : {}) }), signal: controller.signal });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(response.status === 403 ? "افتح مساحة التعلم من جديد لتجديد جلسة الدخول." : data.error || TUTOR_ERROR);
      }
      const now = new Date().toISOString();
      assistantId = crypto.randomUUID();
      const local: TutorMessage = { id: crypto.randomUUID(), conversation_id: current.id, role: "user", content: text + (selectedCode ? `\n\n\`\`\`tsx\n${selectedCode}\n\`\`\`` : ""), status: "complete", bookmarked: false, sources: [], created_at: now };
      setMessages(previous => [...previous, local, { ...local, id: assistantId, role: "assistant", content: "", status: "pending" }]);
      setDraft(""); setCode(""); setAttempt(false);
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let buffer = "";
      const event = (line: string) => {
        const value = JSON.parse(line);
        if (value.type === "delta") setMessages(previous => previous.map(item => item.id === assistantId ? { ...item, content: item.content + value.text } : item));
        if (value.type === "error") throw new Error(value.error || TUTOR_ERROR);
        if (value.type === "done") { finished = true; setMessages(previous => previous.map(item => item.id === assistantId ? { ...item, id: value.messageId, status: "complete", sources: value.sources } : item)); }
      };
      try {
        while (true) {
          const chunk = await reader.read();
          buffer += decoder.decode(chunk.value, { stream: !chunk.done });
          const lines = buffer.split("\n"); buffer = lines.pop() || "";
          for (const line of lines) if (line.trim()) event(line);
          if (chunk.done) break;
        }
        if (buffer.trim()) event(buffer);
      } finally { reader.releaseLock(); }
      if (!finished) throw new Error(TUTOR_ERROR);
      try { await refresh(); } catch { setNotice("تم حفظ الشرح. تعذر تحديث قائمة الجلسات الآن."); }
    } catch (err) {
      controller.abort();
      setMessages(previous => previous.map(item => item.id === assistantId ? { ...item, status: "failed" } : item));
      setError(err instanceof Error && err.name === "AbortError" ? "أُوقف الشرح. يمكنك فتح الجلسة لاحقًا أو المحاولة من جديد." : err instanceof Error ? err.message : TUTOR_ERROR);
      setRetry({ text, code: selectedCode, action, targetId });
    } finally { isSending.current = false; setBusy(false); request.current = null; }
  }
  async function bookmark(message: TutorMessage) {
    try {
      await jsonRequest(endpoint, jsonInit("PATCH", { action: "bookmark", messageId: message.id, value: !message.bookmarked }));
      setMessages(items => items.map(item => item.id === message.id ? { ...item, bookmarked: !message.bookmarked } : item));
      await refresh(); setNotice(message.bookmarked ? "أُزيل الشرح من المحفوظات." : "تم حفظ الشرح ✓");
    } catch (err) { setError(err instanceof Error ? err.message : TUTOR_ERROR); }
  }
  function quickAction(action: TutorAction, message: TutorMessage, selectedCode = "") {
    void send(`${TUTOR_ACTIONS[action]}${action === "easier" ? " — استعمل تشبيهًا مختلفًا ومثالًا أصغر." : ""}`, selectedCode, action, message.id);
  }
  const currentProgress = overview.progress.find(item => item.topic === topic);
  function chooseExample(example: TutorExample, line: number, lessonMode: TutorMode) {
    if (busy || loading) return;
    newLesson(); setSourcePath(example.path); setSourceLine(line); setTopic(example.topic); setMode(lessonMode);
    setDraft(lessonMode === "practice"
      ? `درّبني على ${example.title} من ملف ${example.path}. ${example.challenge} أعطني تلميحًا واحدًا إذا احتجت، ولا تكشف الحل قبل محاولتي.`
      : `علّمني ${example.title} من ملف ${example.path}. هدفنا: ${example.goal} ابدأ بمقطع صغير حقيقي مع أرقام الأسطر، ثم اشرح السبب والنتيجة واتركني أجرب خطوة واحدة.`);
    input.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  return <div className={styles.shell} lang="ar" dir="rtl" data-ai-tutor>
    <label className={styles.mobileNavigation}>
      <span>مساحة التعلّم</span>
      <select aria-label="اختر طريقة التعلم" value="/admin/how-it-was-built/ai-tutor/" onChange={event => router.push(event.target.value)}>
        <option value="/admin/how-it-was-built/ai-tutor/">✨ تعلّم مع الذكاء الاصطناعي</option>
        <option value="/admin/how-it-was-built/#site">تعلم خطوة بخطوة</option>
        <option value="/admin/how-it-was-built/#explore">استكشف موقعي</option>
        <option value="/admin/how-it-was-built/#build">ابنِ بنفسك</option>
        <option value="/admin/how-it-was-built/#files">ملفاتي</option>
      </select>
    </label>
    <nav className={styles.navigation} aria-label="اختر طريقة التعلم">
      <Link href="/admin/how-it-was-built/#site">تعلم خطوة بخطوة</Link><Link href="/admin/how-it-was-built/#explore">استكشف موقعي</Link><Link href="/admin/how-it-was-built/#build">ابنِ بنفسك</Link><Link href="/admin/how-it-was-built/#files">ملفاتي</Link><Link href="/admin/how-it-was-built/ai-tutor/" aria-current="page">✨ تعلّم مع الذكاء الاصطناعي</Link>
    </nav>
    <header className={styles.hero}>
      <div className={styles.eyebrow}><span>٥ · مساحة التعلّم</span><span dir="ltr">L’ÉCOMAX / AI TUTOR</span></div>
      <div className={styles.heroBody}><div><h1>أستاذك الشخصي في <bdi>Next.js</bdi></h1><p>اسأل، اكتب الكود، افهم الأخطاء، وتعلّم خطوة بخطوة.</p></div><span className={styles.heroIcon} aria-hidden="true">✦</span></div>
      <div className={styles.phases}><span>نفهم الفكرة</span><span aria-hidden="true">←</span><span>تجرّب بنفسك</span><span aria-hidden="true">←</span><span>نراجع معًا</span></div>
    </header>
    <div className={styles.toolbar}><button className={styles.primary} onClick={newLesson} disabled={busy}>＋ درس جديد</button>
      {([ ["history", "جلساتي"], ["bookmarks", "شروحات محفوظة"], ["progress", "تقدّمي"] ] as const).map(([value,label]) => <button key={value} aria-expanded={library === value} onClick={() => setLibrary(library === value ? null : value)}>{label}</button>)}
    </div>
    {library && <section className={styles.library}>
      <h2>{library === "history" ? "جلسات التعلم السابقة" : library === "bookmarks" ? "شروحات محفوظة" : "تقدّمي في AI Learning"}</h2>
      {library === "history" && <>{!overview.conversations.length && <p>ستظهر هنا دروسك بعد إرسال أول سؤال.</p>}{overview.conversations.map(item => <button disabled={busy || loading} className={styles.historyItem} key={item.id} onClick={() => void openConversation(item)}><strong>{item.title}</strong><span>{TUTOR_TOPICS[item.topic]} · {new Date(item.updated_at).toLocaleDateString("ar")}</span></button>)}</>}
      {library === "bookmarks" && <>{!overview.bookmarks.length && <p>اضغط «حفظ الشرح» تحت أي إجابة للعودة إليها لاحقًا.</p>}{overview.bookmarks.map(item => <article key={item.id} className={styles.saved}><TutorMarkdown text={item.content} /><div className={styles.actions}><button disabled={busy} onClick={() => void openConversation(item.conversation_id)}>افتح الجلسة</button><button onClick={() => void bookmark(item)}>إزالة من المحفوظات</button></div></article>)}</>}
      {library === "progress" && <><p>نسبة الثقة هي تقييمك الشخصي. المحاولات تُحسب عندما ترسل كودك كتمرين، ولا تعني إتقانه بعد.</p><div className={styles.progressGrid}>{(Object.entries(TUTOR_TOPICS) as [TutorTopic,string][]).map(([key,label]) => {
        const progress = overview.progress.find(item => item.topic === key);
        return <button className={styles.progressCard} key={key} onClick={() => { setTopic(key); setProgressOpen(true); }}><strong>{label}</strong><span>{progress?.confidence ?? 0}% · ثقتي بالفهم</span><progress value={progress?.confidence ?? 0} max={100}/><small>{progress?.attempts ?? 0} محاولات · {progress?.completed_exercises ?? 0} تمارين أنجزتها</small></button>;
      })}</div><h3>نقاط قوتك حسب تقييمك</h3><p>{overview.progress.filter(item => item.confidence >= 75 && !item.needs_practice).map(item => TUTOR_TOPICS[item.topic]).join("، ") || "تتضح مع التعلم والتجربة."}</p><h3>يحتاج مراجعة</h3><p>{overview.progress.filter(item => item.needs_practice).map(item => TUTOR_TOPICS[item.topic]).join("، ") || "لم تحدد موضوعًا للمراجعة بعد."}</p><h3>آخر ما تعلمته</h3><p>{overview.progress[0] ? TUTOR_TOPICS[overview.progress[0].topic] : "ابدأ أول درس."}</p></>}
    </section>}
    <section className={styles.workspace} aria-label="درس الذكاء الاصطناعي">
      <div className={styles.sessionHeader}><div><span className={styles.eyebrow}>فكرة واحدة. خطوة واضحة.</span><h2>{conversation?.title || "ماذا تريد أن تفهم اليوم؟"}</h2></div><label>موضوع الدرس<select disabled={busy} value={topic} onChange={event => setTopic(event.target.value as TutorTopic)}>{Object.entries(TUTOR_TOPICS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      <details className={styles.modePicker}><summary>طريقة التعلم · {TUTOR_MODES[mode].label}</summary><div className={styles.modeGrid}>{(Object.entries(TUTOR_MODES) as [TutorMode,typeof TUTOR_MODES[TutorMode]][]).map(([key,value]) => <button disabled={busy} aria-pressed={mode === key} key={key} onClick={() => { setMode(key); setDraft(value.starter); if (key === "api") setTopic("api"); if (key === "debug") setTopic("debugging"); if (key === "project" && !sourcePath) setSourcePath("app/produit/[slug]/page.tsx"); input.current?.focus(); }}><span aria-hidden="true">{value.icon}</span>{value.label}</button>)}</div></details>
      {!messages.length && <SiteExamples disabled={busy || loading} onChoose={chooseExample} />}
      {loading && <p role="status" className={styles.status}>جارٍ تحميل دروسك…</p>}
      <div className={styles.messages} aria-label="المحادثة" aria-busy={busy}>{messages.map(message => <article key={message.id} className={message.role === "assistant" ? styles.teacher : styles.student}>
        <div className={styles.messageLabel}>{message.role === "assistant" ? "✦ أستاذك" : "أنت"}{message.status === "failed" && <span> · شرح غير مكتمل</span>}{message.status === "pending" && !busy && <span> · قيد المعالجة أو انقطع؛ أعد فتح الجلسة بعد قليل</span>}</div>
        <TutorMarkdown text={message.content.split("\n\nFollow-up action:")[0]} disabled={busy || message.status !== "complete"} onAction={message.role === "assistant" && message.status === "complete" ? (action,selectedCode) => quickAction(action,message,selectedCode) : undefined}/>
        {message.sources?.length > 0 && <details className={styles.sources}><summary>ملفات أُرسلت للأستاذ · {message.sources.length}</summary>{message.sources.map(source => <p key={source.path}><Link href={`/admin/how-it-was-built/#files/${encodeURIComponent(source.path)}?line=${source.startLine}`}><bdi>{source.path}:{source.startLine}–{source.endLine}</bdi></Link><small>لقطة الكود: {new Date(source.generatedAt).toLocaleDateString("ar")}</small></p>)}</details>}
        {message.role === "assistant" && message.status === "complete" && <div className={styles.actions}><button disabled={busy} onClick={() => quickAction("easier",message)}>شرح أبسط</button><button disabled={busy} onClick={() => quickAction("deeper",message)}>شرح أعمق</button><button disabled={busy} onClick={() => quickAction("why",message)}>لماذا؟</button><button disabled={busy} onClick={() => quickAction("practice",message)}>خلّيني نجرب</button><button aria-pressed={message.bookmarked} onClick={() => void bookmark(message)}>{message.bookmarked ? "★ شرح محفوظ" : "☆ حفظ الشرح"}</button><button onClick={() => setProgressOpen(true)}>سجّل فهمي</button></div>}
        {message.role === "assistant" && message.status === "complete" && <details className={styles.followUp}><summary>تابع التعلّم · تلميح، اختبار، أو خطوة جديدة</summary><div className={styles.actions}><button disabled={busy} onClick={() => quickAction("hint", message)}>تلميح بدون حل</button><button disabled={busy} onClick={() => quickAction("quiz", message)}>اختبر فهمي</button><button disabled={busy} onClick={() => quickAction("next", message)}>الخطوة التالية ←</button></div></details>}
      </article>)}</div>
      {busy && <p className={styles.status} role="status">✦ الأستاذ يفكر ويكتب…</p>}
      <div ref={end}/>
    </section>
    {error && <div className={styles.error} role="alert"><p>{error}</p><div className={styles.actions}>{retry ? <button disabled={busy} onClick={() => void send(retry.text,retry.code,retry.action,retry.targetId)}>حاول مجددًا</button> : <button disabled={busy || loading} onClick={() => { setError(""); void refresh().catch(err => setError(err.message)); }}>أعد التحميل</button>}<Link href="/admin/how-it-was-built/">افتح مساحة التعلم</Link></div></div>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {!overview.configured && <p className={styles.error}>الأستاذ غير متاح حاليًا. يلزم إكمال إعداد الخدمة على الخادم.</p>}
    <form className={styles.composer} onSubmit={event => { event.preventDefault(); void send(); }}>
      <p className={styles.sourceSelection}>مثال الشرح من: <bdi>{sourcePath ? `${sourcePath}:${sourceLine}` : tutorExampleForTopic(topic).path}</bdi>{!sourcePath && <small>اختيار تلقائي حسب الموضوع · يمكنك تغييره أدناه</small>}</p>
      <details><summary>أرفق كودًا أو اختر ملفًا من موقعي</summary><div className={styles.contextFields}>
        <label>الكود أو رسالة الخطأ<textarea dir="ltr" value={code} onChange={event => setCode(event.target.value)} disabled={busy} rows={5} maxLength={8000} placeholder="Paste code or an error here…" /></label>
        <div className={styles.fileFields}><label>ملف من L’ÉCOMAX (اختياري)<input dir="ltr" list="tutor-source-files" value={sourcePath} onChange={event => setSourcePath(event.target.value)} disabled={busy} maxLength={600} placeholder="app/produit/[slug]/page.tsx" /></label><label>السطر<input dir="ltr" type="number" min={1} max={100000} value={sourceLine} onChange={event => setSourceLine(Math.max(1, Number(event.target.value) || 1))} disabled={busy}/></label></div>
        <datalist id="tutor-source-files">{["app/produit/[slug]/page.tsx","components/ProductCard.tsx","app/api/products/route.ts","app/api/orders/route.ts","app/checkout/page.tsx","lib/supabase-server.ts","middleware.ts"].map(path => <option key={path} value={path}/>)}</datalist>
        <label className={styles.checkbox}><input type="checkbox" checked={attempt} onChange={event => setAttempt(event.target.checked)} disabled={busy}/> هذه محاولتي في التمرين؛ راجعها معي</label><p className={styles.muted}>أرسل فقط الكود اللازم. استبدل المفاتيح وكلمات المرور بعبارات مثل YOUR_API_KEY.</p>
      </div></details>
      <label className={styles.inputLabel} htmlFor="tutor-question">سؤالك للأستاذ · {TUTOR_MODES[mode].label}</label><div className={styles.inputRow}><textarea id="tutor-question" ref={input} dir="auto" rows={2} value={draft} onChange={event => setDraft(event.target.value)} maxLength={6000} disabled={busy} placeholder="اشرح لي… لماذا… أو هذه محاولتي…" onKeyDown={event => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void send(); } }}/>{busy ? <button type="button" onClick={() => request.current?.abort()}>إيقاف</button> : <button className={styles.primary} disabled={loading || !draft.trim() || !overview.configured} type="submit">أرسل ←</button>}</div>
      <p className={styles.composerNote}>الكود الذي تشاركه يُرسل إلى OpenAI للشرح. راجع الأمثلة وجرّبها في بيئة التعلم.</p>
    </form>
    {progressOpen && <ProgressDialog key={topic} topic={topic} progress={currentProgress} onClose={() => setProgressOpen(false)} onSaved={async () => { await refresh(); setProgressOpen(false); setNotice("تم حفظ تقدمك ✓"); }}/>}
  </div>;
}

function ProgressDialog({ topic, progress, onClose, onSaved }: { topic: TutorTopic; progress?: TutorProgress; onClose: () => void; onSaved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [confidence,setConfidence] = useState(progress?.confidence ?? 0);
  const [difficulty,setDifficulty] = useState(progress?.difficulty ?? "beginner");
  const [needsPractice,setNeedsPractice] = useState(progress?.needs_practice ?? true);
  const [mistakeNote,setMistakeNote] = useState(progress?.mistake_note ?? "");
  const [completedExercises,setCompletedExercises] = useState(progress?.completed_exercises ?? 0);
  const [saving,setSaving] = useState(false), [error,setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function save() {
    setSaving(true); setError("");
    try { await jsonRequest(endpoint,jsonInit("PATCH",{action:"progress",topic,confidence,difficulty,needsPractice,mistakeNote,completedExercises})); await onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : TUTOR_ERROR); setSaving(false); }
  }
  return <dialog ref={dialog} className={styles.dialog} onCancel={onClose} aria-labelledby="tutor-progress-title" dir="rtl"><h2 id="tutor-progress-title">فهمي لـ {TUTOR_TOPICS[topic]}</h2><p>تقييمك يساعد الأستاذ على اختيار الشرح المناسب. يمكنك تغييره بعد كل تجربة.</p>
    <label>ثقتي بالفهم<select value={confidence} onChange={event=>setConfidence(Number(event.target.value))}>{[0,25,50,75,100].map(value=><option key={value} value={value}>{value}% — {value===0?"أبدأ الآن":value===25?"أحتاج شرحًا":value===50?"فهمت الفكرة":value===75?"أقدر أطبق بمساعدة":"أقدر أشرح وأطبق"}</option>)}</select></label>
    <label>مستوى الشرح<select value={difficulty} onChange={event=>setDifficulty(event.target.value)}><option value="beginner">من الصفر</option><option value="comfortable">أفهم الأساسيات</option><option value="advanced">أريد تفاصيل أعمق</option></select></label>
    <label className={styles.checkbox}><input type="checkbox" checked={needsPractice} onChange={event=>setNeedsPractice(event.target.checked)}/> أحتاج مراجعة وتدريبًا أكثر</label>
    <label>خطأ وقعت فيه أو فكرة أحتاج مراجعتها<textarea rows={3} maxLength={1000} value={mistakeNote} onChange={event=>setMistakeNote(event.target.value)}/></label>
    <label>تمارين أنجزتها بنفسي (تقييمي)<input type="number" min={0} max={1000} value={completedExercises} onChange={event=>setCompletedExercises(Number(event.target.value))}/></label>
    {error&&<p role="alert">{error}</p>}<div className={styles.actions}><button className={styles.primary} disabled={saving} onClick={()=>void save()}>{saving?"جارٍ الحفظ…":"حفظ تقدّمي"}</button><button disabled={saving} onClick={onClose}>إغلاق</button></div>
  </dialog>;
}
