"use client";
import { useEffect, useRef, useState } from "react";
import { backendGuides, guideText, type GuideText } from "./course/backend-guides";
import { backendPractice } from "./course/backend-practice";
import type { CourseLanguage } from "./course/types";
import styles from "./BackendGuides.module.css";

function CodeExample({ code, filename, lang }: { code: string; filename?: string; lang: CourseLanguage }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [wrap, setWrap] = useState(true);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setStatus("copied"); }
    catch { setStatus("error"); }
  }
  return <div className={styles.example}>
    <div className={styles.codeHeading}><span dir="ltr">{filename}</span><div className={styles.codeActions}><button type="button" aria-pressed={wrap} onClick={() => setWrap(value => !value)}>{guideText(["Adapter les lignes", "Wrap lines", "لف السطور"], lang)}</button><button type="button" onClick={copy}>{status === "copied" ? guideText(["Copié ✓", "Copied ✓", "تم النسخ ✓"], lang) : guideText(["Copier", "Copy", "نسخ"], lang)}</button></div></div>
    <pre dir="ltr" tabIndex={0} data-wrap={wrap} aria-label={filename}><code>{code}</code></pre>
    <p role="status" className={styles.copyStatus}>{status === "copied" ? guideText(["Copié", "Copied", "تم النسخ"], lang) : status === "error" ? guideText(["Sélectionne le texte pour le copier manuellement.", "Select the text to copy it manually.", "حدد النص لنسخه يدويًا."], lang) : ""}</p>
  </div>;
}

type ReadingProgress = Record<string, { position: number; read: number[] }>;
const STORAGE_KEY = "lecomax-backend-reading-v1";

function GuideIcon({ index }: { index: number }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {index === 0 ? <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" /></> : index === 1 ? <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" /></> : <><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" /></>}
  </svg>;
}

export default function BackendGuides({ lang, compact = false }: { lang: CourseLanguage; compact?: boolean }) {
  const t = (value: GuideText) => guideText(value, lang);
  const [active, setActive] = useState<number | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [progress, setProgress] = useState<ReadingProgress>({});
  const [storageError, setStorageError] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const launchButton = useRef<HTMLButtonElement | null>(null);
  const guide = active === null ? null : backendGuides[active];
  const chapter = guide?.chapters[chapterIndex];
  const practice = guide ? backendPractice[guide.id]?.[chapterIndex] : undefined;
  const totalRead = Object.values(progress).reduce((sum, value) => sum + value.read.length, 0);
  const total = backendGuides.reduce((sum, value) => sum + value.chapters.length, 0);

  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const clean: ReadingProgress = {};
      if (value && typeof value === "object") for (const item of backendGuides) {
        const entry = (value as ReadingProgress)[item.id];
        if (!entry || typeof entry !== "object") continue;
        clean[item.id] = {
          position: Number.isInteger(entry.position) ? Math.max(0, Math.min(item.chapters.length - 1, entry.position)) : 0,
          read: Array.isArray(entry.read) ? [...new Set(entry.read.filter(index => Number.isInteger(index) && index >= 0 && index < item.chapters.length))] : [],
        };
      }
      setProgress(clean);
    } catch { setStorageError(true); }
  }, []);
  useEffect(() => {
    if (active === null) { dialog.current?.close(); return; }
    if (!dialog.current?.open) dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnNavigation = () => setActive(null);
    window.addEventListener("hashchange", closeOnNavigation);
    return () => { document.body.style.overflow = previous; window.removeEventListener("hashchange", closeOnNavigation); };
  }, [active]);
  useEffect(() => {
    if (active === null) return;
    reader.current?.scrollTo({ top: 0 });
    title.current?.focus({ preventScroll: true });
  }, [active, chapterIndex]);

  function save(next: ReadingProgress) {
    setProgress(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  function navigate(index: number) {
    if (!guide) return;
    const next = Math.max(0, Math.min(guide.chapters.length - 1, index));
    setChapterIndex(next);
    save({ ...progress, [guide.id]: { read: progress[guide.id]?.read ?? [], position: next } });
  }
  function complete() {
    if (!guide) return;
    const next = Math.min(chapterIndex + 1, guide.chapters.length - 1);
    save({ ...progress, [guide.id]: { position: next, read: [...new Set([...(progress[guide.id]?.read ?? []), chapterIndex])] } });
    if (chapterIndex === guide.chapters.length - 1) setActive(null);
    else setChapterIndex(next);
  }

  return <section className={`${styles.shell} ${compact ? styles.compact : ""}`} dir={lang === "ar" ? "rtl" : "ltr"} aria-labelledby="backend-guides-title" data-backend-guides>
    <header className={styles.heading}>
      <div className={styles.eyebrow}><p className={styles.kicker}>{t(["TON ATELIER BACKEND", "YOUR BACKEND WORKSHOP", "ورشة الخادم الخاصة بك"])}</p><span className={styles.badge}>3 {t(["guides", "guides", "أدلة"])}</span></div>
      <h2 id="backend-guides-title">{t(["Les coulisses,\npas à pas.", "Behind the scenes,\none step at a time.", "خلف الكواليس،\nخطوة بخطوة."])}</h2>
      <p>{t(["Commence par 01 si tu débutes. Lis sur ton téléphone ; réalise les exercices dans ton projet de test sur ordinateur.", "Start with 01 if you’re new. Read on your phone; do the exercises in your test project on a computer.", "ابدأ بـ 01 إن كنت مبتدئًا. اقرأ على هاتفك ونفذ التمارين في مشروعك التجريبي على الحاسوب."])}</p>
      <div className={styles.overall}><span>{totalRead} / {total} {t(["leçons lues", "lessons read", "درسًا مقروءًا"])}</span><progress max={total} value={totalRead} aria-label={t(["Progression de lecture", "Reading progress", "تقدم القراءة"])} /></div>
    </header>
    <div className={styles.guides}>
      {backendGuides.map((item, index) => {
        const saved = progress[item.id];
        const read = saved?.read.length ?? 0;
        const done = read === item.chapters.length;
        return <button type="button" key={item.id} className={styles.guideCard} data-tone={index} aria-haspopup="dialog" onClick={event => { launchButton.current = event.currentTarget; setChapterIndex(saved?.position ?? 0); setActive(index); }}>
          <span className={styles.icon}><GuideIcon index={index} /></span>
          <span className={styles.cardBody}><span className={styles.cardMeta}>0{index + 1} <span>·</span> {item.chapters.length} {t(["leçons", "lessons", "دروس"])}</span><strong>{t(item.title)}</strong><span className={styles.description}>{t(item.summary)}</span><span className={styles.cardFoot}><span>{done ? t(["Revoir le guide", "Review guide", "مراجعة الدليل"]) : saved ? t(["Reprendre", "Continue", "متابعة"]) : t(["Commencer", "Start learning", "ابدأ التعلم"])}</span>{read > 0 && <span className={styles.readCount}>{read}/{item.chapters.length} ✓</span>}</span></span>
          <span className={styles.arrow} aria-hidden="true">{lang === "ar" ? "←" : "→"}</span>
        </button>;
      })}
    </div>
    <details className={styles.architecture}><summary>{t(["Comment tout est connecté", "How everything connects", "كيف يرتبط كل شيء"])}</summary><ol className={styles.map}>
      {([ ["GitHub", ["Code & historique", "Code & history", "الكود والسجل"]], ["Vercel", ["Site & routes API", "Website & API routes", "الموقع ومسارات API"]], ["Supabase", ["Données & fichiers", "Data & files", "البيانات والملفات"]] ] as [string, GuideText][]).map(([name, description]) => <li key={name}><strong>{name}</strong><span>{t(description)}</span></li>)}
    </ol></details>
    <p className={styles.footer} role={storageError ? "status" : undefined}>{storageError ? t(["La progression reste disponible pendant cette visite ; ton navigateur n’a pas pu l’enregistrer.", "Progress is available during this visit; your browser could not save it.", "التقدم متاح أثناء هذه الزيارة؛ تعذر حفظه في المتصفح."]) : t(["Ta lecture est mémorisée sur ce navigateur.", "Your reading position is saved in this browser.", "يُحفظ موضع قراءتك في هذا المتصفح."])}</p>

    <dialog ref={dialog} className={styles.dialog} dir={lang === "ar" ? "rtl" : "ltr"} aria-labelledby="backend-reader-title" onCancel={event => { event.preventDefault(); setActive(null); }} onClose={() => { if (dialog.current?.open) return; setActive(null); launchButton.current?.focus({ preventScroll: true }); }}>
      {guide && chapter && <>
        <header className={styles.readerHeader}>
          <div className={styles.readerTop}><span className={styles.readerLabel}>{t(guide.title)}</span><button type="button" className={styles.close} onClick={() => setActive(null)} aria-label={t(["Fermer et revenir aux guides", "Close and return to guides", "إغلاق والعودة إلى الأدلة"])}>{t(["Fermer", "Close", "إغلاق"])} <span aria-hidden="true">×</span></button></div>
          <div className={styles.readerControls}><label htmlFor="backend-lesson-picker">{t(["Leçon", "Lesson", "الدرس"])} {chapterIndex + 1}/{guide.chapters.length}</label><select id="backend-lesson-picker" value={chapterIndex} onChange={event => navigate(Number(event.target.value))}>{guide.chapters.map((item, index) => <option key={index} value={index}>{progress[guide.id]?.read.includes(index) ? "✓ " : ""}{t(item.title)}</option>)}</select></div>
          <div className={styles.segments} aria-hidden="true">{guide.chapters.map((_, index) => <span key={index} data-read={progress[guide.id]?.read.includes(index)} data-current={index === chapterIndex} />)}</div>
        </header>
        <div className={styles.readerBody} ref={reader} data-large-text={largeText}>
          <article className={styles.lesson} key={`${guide.id}:${chapterIndex}`}>
            <div className={styles.readingTools}><p className={styles.lessonKicker}>{t(["UNE IDÉE À LA FOIS", "ONE IDEA AT A TIME", "فكرة واحدة كل مرة"])}</p><button type="button" aria-pressed={largeText} onClick={() => setLargeText(value => !value)}>{t(["Texte agrandi", "Larger text", "نص أكبر"])}</button></div>
            <h2 id="backend-reader-title" ref={title} tabIndex={-1}>{t(chapter.title).replace(/^\d+\.\s*/, "")}</h2>
            {practice && <>
              <section className={styles.takeaway}><h3>{t(["1. L’idée à retenir", "1. The key idea", "1. الفكرة الأساسية"])}</h3><p>{t(practice.idea)}</p></section>
              <section className={styles.practice}><h3>{t(["2. À toi d’essayer", "2. Your turn to try", "2. دورك للتجربة"])}</h3><p>{t(practice.task)}</p></section>
            </>}
            {chapter.code && <><p className={styles.exerciseNote}>{t(["À essayer dans un projet de test. Copier cet exemple ne modifie pas ton site.", "Try in a test project. Copying this example does not change your site.", "جرب في مشروع اختبار. نسخ المثال لا يغير موقعك."])}</p><CodeExample code={chapter.code} filename={chapter.filename} lang={lang} /></>}
            {practice && <details className={styles.check}><summary>{t(["3. Vérifier mon résultat", "3. Check my result", "3. تحقق من نتيجتي"])}</summary><p>{t(practice.result)}</p><span>{t(["Compare avec ton résultat. Tu peux relire et réessayer à ton rythme.", "Compare with your result. You can reread and retry at your own pace.", "قارن بنتيجتك. يمكنك إعادة القراءة والمحاولة بوتيرتك."])}</span></details>}
            <details className={styles.more}><summary>{t(["Comprendre plus en détail", "Understand in more detail", "افهم بتفصيل أكثر"])}</summary>{chapter.paragraphs.map((paragraph, index) => <p key={index}>{t(paragraph)}</p>)}</details>
            {(chapter.files || chapter.links) && <details className={styles.resources}><summary>{t(["Fichiers & liens utiles", "Files & useful links", "الملفات والروابط المفيدة"])} <span>{(chapter.files?.length ?? 0) + (chapter.links?.length ?? 0)}</span></summary>
              {chapter.files && <div className={styles.references}><h3>{t(["Dans ton vrai code", "In your actual code", "في كود موقعك الحقيقي"])}</h3>{chapter.files.map(file => <a key={file} href={`#files/${encodeURIComponent(file)}`} onClick={() => setActive(null)}><span dir="ltr">{file}</span><span aria-hidden="true">↗</span></a>)}</div>}
              {chapter.links && <div className={styles.references}><h3>{t(["Documentation officielle", "Official documentation", "الوثائق الرسمية"])}</h3>{chapter.links.map(([label, url]) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><span>{label}</span><span aria-hidden="true">↗</span></a>)}</div>}
            </details>}
            <p className={styles.sourceDate}>{t(["Sources vérifiées le 27 septembre 2026.", "Sources checked September 27, 2026.", "تمت مراجعة المصادر في 27 سبتمبر 2026."])}</p>
          </article>
        </div>
        <footer className={styles.readerFooter}>
          <button type="button" className={styles.primary} onClick={complete}>{chapterIndex === guide.chapters.length - 1 ? t(["Lu · revenir aux guides ✓", "Read · back to guides ✓", "تمت القراءة · العودة للأدلة ✓"]) : t(["Lu · leçon suivante", "Read · next lesson", "تمت القراءة · الدرس التالي"])}<span aria-hidden="true">{lang === "ar" ? "←" : "→"}</span></button>
          <nav className={styles.pageNav} aria-label={t(["Navigation des leçons", "Lesson navigation", "التنقل بين الدروس"])}><button type="button" disabled={chapterIndex === 0} onClick={() => navigate(chapterIndex - 1)}>{t(["Précédente", "Previous", "السابق"])}</button><span aria-live="polite">{chapterIndex + 1} / {guide.chapters.length}{progress[guide.id]?.read.includes(chapterIndex) ? " · ✓" : ""}</span><button type="button" disabled={chapterIndex === guide.chapters.length - 1} onClick={() => navigate(chapterIndex + 1)}>{t(["Suivante", "Next", "التالي"])}</button></nav>
        </footer>
      </>}
    </dialog>
  </section>;
}
