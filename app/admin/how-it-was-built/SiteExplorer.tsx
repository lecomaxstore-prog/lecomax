"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { attachSourceInspector, type SourceSelection } from "@/lib/site-source-inspector";
import { learningDestination, learningPages } from "@/lib/site-learning";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";
import SiteLesson from "./SiteLesson";
import LearningStudio from "./learning/LearningStudio";
import styles from "./SiteExplorer.module.css";
import type { SourceConnections } from "@/lib/source-connections";

export default function SiteExplorer({ lang }: { lang: CourseLanguage }) {
  const t = useCallback((fr: string, en: string, ar: string) => translate(lang, fr, en, ar), [lang]);
  const frame = useRef<HTMLIFrameElement>(null);
  const previewCard = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cleanup = useRef<() => void>(() => {});
  const [page, setPage] = useState({ url: "/", file: "app/page.tsx" });
  const [selection, setSelection] = useState<SourceSelection | null>(null);
  const [history, setHistory] = useState<SourceSelection[]>([]);
  const [content, setContent] = useState("");
  const [line, setLine] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [reload, setReload] = useState(0);
  const [learned, setLearned] = useState<string[]>([]);
  const [desktop, setDesktop] = useState(false);
  const [showNotices, setShowNotices] = useState(false);
  const [hint, setHint] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [workshop, setWorkshop] = useState<"site" | "guides" | "build">("guides");
  const [connections, setConnections] = useState<SourceConnections>();
  const [sourceTrail, setSourceTrail] = useState<SourceSelection[]>([]);

  useEffect(() => {
    frame.current?.contentDocument?.documentElement.toggleAttribute("data-learning-hide-notices", !showNotices);
  }, [showNotices, ready]);

  useEffect(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem("site-learning-progress-v1") || "[]"); if (Array.isArray(value)) setLearned(value.filter((item): item is string => typeof item === "string").slice(-500)); } catch { /* Learning remains usable without browser storage. */ }
    return () => cleanup.current();
  }, []);
  useEffect(() => {
    if (workshop !== "site" || ready) return;
    const timer = setTimeout(() => setPreviewError(true), 25000);
    return () => clearTimeout(timer);
  }, [page, ready, revision, workshop]);
  const lessonOpen = selection !== null;
  useEffect(() => {
    if (!lessonOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [lessonOpen]);
  useEffect(() => {
    if (!selection) { dialog.current?.close(); return; }
    if (!dialog.current?.open) dialog.current?.showModal();
    dialog.current?.scrollTo(0, 0);
    const controller = new AbortController();
    setLoading(true); setError(""); setContent(""); setConnections(undefined);
    void (async () => {
      try {
        const response = await fetch(`/api/dev-docs/content?path=${encodeURIComponent(selection.path)}&connections=1&line=${selection.line ?? 1}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 403 ? t("Déverrouille l’espace de code pour lire ce fichier.", "Unlock the code area to read this file.", "افتح مساحة الكود لقراءة الملف.") : t("Le fichier n’a pas pu être chargé. Réessaie.", "The file could not be loaded. Try again.", "تعذر تحميل الملف. حاول مجددًا."));
        const data = await response.json();
        if (controller.signal.aborted) return;
        const lines = data.content.split("\n");
        setContent(data.content);
        setConnections(data.connections);
        setLine(Math.min(lines.length, Math.max(1, selection.line || lines.findIndex((value: string) => value.includes(selection.anchor)) + 1)));
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Erreur"); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [selection, reload, t]);
  useEffect(() => {
    const close = () => { dialog.current?.close(); setSelection(null); };
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  function select(value: SourceSelection) {
    setSourceTrail([]);
    setSelection(value);
    setHistory(items => [value, ...items.filter(item => item.path !== value.path || item.line !== value.line)].slice(0, 6));
  }
  function navigate(url: string, file: string) {
    setSelection(null); dialog.current?.close(); cleanup.current();
    setReady(false); setPreviewError(false); setPage({ url, file });
  }
  function connect() {
    cleanup.current();
    try {
      const doc = frame.current?.contentDocument;
      if (!doc?.body || !doc.querySelector("main")) { setPreviewError(true); return; }
      cleanup.current = attachSourceInspector(doc, page.file, select, href => {
        const destination = learningDestination(href);
        if (!destination) return false;
        navigate(destination.url, destination.file);
        return true;
      });
      doc.documentElement.toggleAttribute("data-learning-hide-notices", !showNotices);
      setReady(true); setPreviewError(false);
    } catch { setPreviewError(true); }
  }
  function quickSelect(selector: string) {
    const targets = frame.current?.contentDocument?.querySelectorAll<HTMLElement>(selector);
    const target = Array.from(targets ?? []).find(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
    if (target) { setHint(""); target.scrollIntoView({ block: "center" }); target.click(); }
    else setHint(t("Cette partie n’est pas visible sur cette page. Touche directement un élément de ton site.", "This part is not visible on this page. Tap an element on your site instead.", "هذا الجزء غير ظاهر في هذه الصفحة. المس عنصرًا في موقعك مباشرة."));
  }
  function markLearned() {
    if (!selection) return;
    const value = [...new Set([...learned, `${selection.path}:${line}`])].slice(-500);
    setLearned(value);
    try { localStorage.setItem("site-learning-progress-v1", JSON.stringify(value)); } catch { /* Keep session progress. */ }
  }
  function closeLesson() { setSelection(null); dialog.current?.close(); }
  function switchWorkshop(value: "site" | "guides" | "build") {
    if (value === workshop) return;
    cleanup.current();
    closeLesson();
    setReady(false); setPreviewError(false); setWorkshop(value);
  }
  return <section className={`${styles.workspace} space-y-3`}>
    <nav className={styles.workshopSwitch} aria-label={t("Choisir comment apprendre", "Choose how to learn", "اختر طريقة التعلم")}>
      <button type="button" aria-pressed={workshop === "guides"} onClick={() => switchWorkshop("guides")}>{t("Apprendre pas à pas", "Learn step by step", "تعلم خطوة بخطوة")}</button>
      <button type="button" aria-pressed={workshop === "site"} onClick={() => switchWorkshop("site")}>{t("Explorer mon site", "Explore my site", "استكشف موقعي")}</button>
      <button type="button" aria-pressed={workshop === "build"} onClick={() => switchWorkshop("build")}>{t("Construire", "Build", "ابنِ بنفسك")}</button>
    </nav>
    {workshop !== "site" ? <LearningStudio key={workshop} lang={lang} buildOnly={workshop === "build"} onExplore={() => switchWorkshop("site")} /> : <>
    <div className={styles.welcome} data-expanded={showGuide}>
      <div className={styles.eyebrow}>{t("L’atelier de ton site", "Your site workshop", "ورشة موقعك")} <span>· {t("5 min pour commencer", "Start in 5 minutes", "ابدأ في 5 دقائق")}</span></div>
      <h2>{t("Touche un élément. Comprends son code.", "Tap an element. Understand its code.", "المس عنصرًا وافهم الكود الخاص به.")}</h2>
      <p className={styles.tapHint}>{t("Une image, un texte, un bouton : retrouve le fichier, son rôle et les données qu’il utilise.", "An image, text or a button: find its file, its purpose and the data it uses.", "صورة أو نص أو زر: اعرف ملفه ودوره والبيانات التي يستخدمها.")}</p>
      <button type="button" className={styles.guideToggle} aria-expanded={showGuide} aria-controls="site-workshop-guide" onClick={() => setShowGuide(value => !value)}>{showGuide ? t("Masquer le guide −", "Hide guide −", "إخفاء الدليل −") : t("Comment apprendre ? +", "How do I learn? +", "كيف أتعلّم؟ +")}</button>
      <button type="button" className={styles.jumpToSite} onClick={() => { previewCard.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); frame.current?.focus({ preventScroll: true }); }}>{t("Voir mon site ↓", "Go to my site ↓", "انتقل إلى موقعي ↓")}</button>
      <div id="site-workshop-guide" className={styles.guideBody}>
      <p>{t("Pars de ce que tu vois. Comprends le code qui le crée. Retiens une idée à la fois.", "Start with what you see. Understand the code behind it. Learn one idea at a time.", "ابدأ بما تراه. افهم الكود الذي يصنعه. تعلّم فكرة واحدة كل مرة.")}</p>
      <ol className={styles.steps}>{[t("Je choisis", "Choose", "اختر"), t("Je comprends", "Understand", "افهم"), t("Je pratique", "Practice", "تدرّب")].map((label, index) => <li key={label}><span>{index + 1}</span>{label}</li>)}</ol>
      <button type="button" disabled={!ready} onClick={() => quickSelect("header")} className={styles.startButton}>{t("Commencer avec l’en-tête →", "Start with the header →", "ابدأ بالترويسة ←")}</button>
      </div>
    </div>
    <div className={`${styles.previewHeading} flex items-start justify-between gap-3 px-1`}>
      <div><h2 className="text-lg font-bold text-emerald-950">{t("Touche ton site. Découvre son code.", "Tap your site. Discover its code.", "المس موقعك واكتشف الكود.")}</h2><p className="mt-1 text-xs leading-5 text-neutral-600">{t("Un texte, une image, un bouton… choisis ce que tu veux comprendre.", "Text, an image, a button… choose what you want to understand.", "نص أو صورة أو زر… اختر ما تريد فهمه.")}</p></div>
      <a href="#files" className="inline-flex min-h-11 shrink-0 items-center rounded-xl border bg-white px-3 text-xs font-bold">{t("Fichiers", "Files", "الملفات")}</a>
    </div>
    <div ref={previewCard} className={`${styles.previewCard} overflow-hidden rounded-2xl border bg-white`}>
      <div className={`${styles.toolbar} flex gap-2 border-b p-2`}>
        <label className="min-w-0 flex-1"><span className="sr-only">{t("Page à explorer", "Page to explore", "الصفحة للاستكشاف")}</span><select value={page.url} onChange={event => { const item = learningPages.find(([url]) => url === event.target.value); if (item) navigate(item[0], item[2]); }} className="min-h-11 w-full rounded-xl border bg-white px-2 text-sm font-semibold">{!learningPages.some(([url]) => url === page.url) && <option value={page.url}>{page.url}</option>}{learningPages.map(([url, label]) => <option key={url} value={url}>{label}</option>)}</select></label>
        <span className={styles.liveLabel}><span aria-hidden="true" />{t("Ton site", "Your site", "موقعك")}</span>
      </div>
      <div className={styles.shortcuts}>{[["header", t("En-tête", "Header", "الترويسة")], ['[aria-roledescription="carrousel"]', t("Bannière", "Banner", "اللافتة")], ["article", t("Produit", "Product", "منتج")], ["footer", t("Pied de page", "Footer", "التذييل")]].map(([selector, label]) => <button type="button" disabled={!ready} key={selector} onClick={() => quickSelect(selector)}>{label}</button>)}</div>
      {hint && <p role="status" className="px-3 py-2 text-sm text-emerald-800">{hint}</p>}
      <div className="overflow-x-auto">
        {!ready && !previewError && <p role="status" className="p-3 text-sm">{t("Chargement de ton site…", "Loading your site…", "جارٍ تحميل موقعك…")}</p>}
        {previewError && <div role="alert" className="space-y-2 bg-amber-50 p-4 text-sm"><p>{t("L’aperçu ne répond pas. Recharge-le pour continuer.", "The preview is not responding. Reload to continue.", "المعاينة لا تستجيب. أعد تحميلها للمتابعة.")}</p><button type="button" onClick={() => { setPreviewError(false); setReady(false); setRevision(value => value + 1); }} className="min-h-11 rounded-lg border px-3 font-bold">{t("Recharger le site", "Reload site", "إعادة تحميل الموقع")}</button></div>}
        <iframe ref={frame} key={`${page.url}:${revision}`} src={page.url} title={t("Ton site : touche un élément pour apprendre", "Your site: tap an element to learn", "موقعك: المس عنصرًا للتعلم")} onLoad={connect} className={styles.preview} style={desktop ? { width: 1100 } : undefined} />
      </div>
      <p className="border-t bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950">{t("Un clic : comprendre le code. Deux clics rapides sur un lien : ouvrir sa page dans l’aperçu. Sur téléphone, touche le lien deux fois rapidement.", "One click: understand the code. Double-click a link to open its page in the preview. On a phone, tap the link twice quickly.", "نقرة واحدة لفهم الكود. انقر مرتين بسرعة على رابط لفتح صفحته في المعاينة. على الهاتف المس الرابط مرتين بسرعة.")}</p>
      <details className={styles.options}><summary>{t("Options de l’aperçu", "Preview options", "خيارات المعاينة")}</summary><div className={styles.optionButtons}><button type="button" aria-pressed={desktop} onClick={() => setDesktop(value => !value)}>{desktop ? t("Revenir à la taille de mon écran", "Fit to my screen", "ملاءمة شاشتي") : t("Voir la version ordinateur", "View desktop version", "عرض نسخة الحاسوب")}</button><button type="button" aria-pressed={showNotices} onClick={() => setShowNotices(value => !value)}>{showNotices ? t("Masquer les fenêtres", "Hide notices", "إخفاء النوافذ") : t("Explorer les fenêtres", "Explore notices", "استكشف النوافذ")}</button></div></details>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-neutral-600"><span>{learned.length} {t("éléments compris", "elements understood", "عناصر فهمتها")}</span><a href="#files" className="min-h-11 content-center font-bold text-emerald-800 underline">{t("Tous les fichiers du projet", "All project files", "كل ملفات المشروع")}</a></div>
    {history.length > 0 && <details className="rounded-xl border bg-white p-3"><summary className="cursor-pointer text-sm font-bold">{t("Revoir mes dernières découvertes", "Review recent discoveries", "راجع اكتشافاتك الأخيرة")}</summary><div className="mt-2 space-y-1">{history.map((item, index) => <button key={`${item.path}:${item.line}:${index}`} type="button" onClick={() => select(item)} className="block min-h-11 w-full truncate rounded-lg px-2 text-left text-xs hover:bg-emerald-50">{item.label || item.path} · {item.path.split("/").pop()}:{item.line || 1}</button>)}</div></details>}
    <dialog ref={dialog} onCancel={event => { event.preventDefault(); closeLesson(); }} onClose={() => { if (!dialog.current?.open) frame.current?.focus(); }} aria-labelledby="site-lesson-title" className={styles.dialog}>
      <div className={styles.dialogHeader}><div className="flex items-center justify-between gap-3"><h2 id="site-lesson-title" className="min-w-0 truncate text-sm font-bold">{selection?.label || t("Comprendre cet élément", "Understand this element", "افهم هذا العنصر")}</h2><button type="button" autoFocus onClick={closeLesson} className="min-h-11 shrink-0 rounded-xl bg-emerald-950 px-3 text-xs font-bold text-white">{t("← Mon site", "← My site", "موقعي ←")}</button></div></div>
      {sourceTrail.length > 0 && <button type="button" className={styles.sourceBack} onClick={() => { setSelection(sourceTrail[sourceTrail.length - 1]); setSourceTrail(items => items.slice(0, -1)); }}>{t("← Revenir au fichier précédent", "← Back to the previous file", "العودة إلى الملف السابق →")}</button>}
      {loading ? <p role="status" className="p-6">{t("Je retrouve le code de cet élément…", "Finding this element’s code…", "جارٍ العثور على كود هذا العنصر…")}</p> : error ? <div role="alert" className="p-5"><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)} className="mt-3 min-h-11 rounded-xl border px-4">{t("Réessayer", "Retry", "أعد المحاولة")}</button></div> : selection && content && <SiteLesson key={`${selection.path}:${line}:${reload}`} selection={selection} content={content} connections={connections} initialLine={line} lang={lang} onNavigate={navigate} onLearned={markLearned} onOpenSource={(path, sourceLine = 1) => { setSourceTrail(items => [...items, selection].slice(-12)); setSelection({ path, line: sourceLine, anchor: "", label: path.split("/").pop(), fileOnly: true }); }} />}
    </dialog>
    </>}
  </section>;
}
