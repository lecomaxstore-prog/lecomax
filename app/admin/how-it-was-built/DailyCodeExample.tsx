"use client";

import { useEffect, useState } from "react";
import { explainSourceLine } from "@/lib/source-code-guide";
import { DAILY_CODE, findDailyExcerpt } from "./course/daily-code";
import { dailyText, type DailyLesson } from "./course/daily-lessons";
import type { CourseLanguage } from "./course/types";
import { translate } from "./course/journey";
import styles from "./DailyLearning.module.css";

export default function DailyCodeExample({ lesson, lang }: { lesson: DailyLesson; lang: CourseLanguage }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const guide = DAILY_CODE[lesson.id];
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [line, setLine] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setSource(null); setError(false); setLine(null);
    void fetch(`/api/dev-docs/content?path=${encodeURIComponent(lesson.file)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Source unavailable");
        const file = await response.json();
        if (file.path !== lesson.file || typeof file.content !== "string") throw new Error("Invalid source");
        if (!controller.signal.aborted) setSource(file.content);
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [lesson.file, attempt]);
  const excerpt = source === null ? null : findDailyExcerpt(source, guide);
  const explanation = source !== null && line !== null ? explainSourceLine(lesson.file, source.split(/\r?\n/), line, lang) : null;
  return <div className="min-w-0 space-y-4">
    <div><h4 className="text-sm font-bold">{t("Ce que fait ce code dans mon site", "What this code does in my site", "ماذا يفعل هذا الكود في موقعي")}</h4><p className="mt-2 text-sm leading-7 text-neutral-700">{dailyText(lang, lesson.example)}</p></div>
    <div className={styles.codePanel}>
      <div className="border-b bg-neutral-50 px-4 py-3"><p className="text-xs font-semibold text-emerald-800">{t("EXTRAIT DE TON VRAI CODE", "YOUR ACTUAL CODE", "مقتطف من كود موقعك")}</p><code dir="ltr" className="mt-1 block break-all text-xs text-neutral-600">{lesson.file}</code></div>
      {error ? <div role="alert" className="p-4 text-sm"><p>{t("Le code n’a pas pu être chargé. Ta leçon et tes notes restent accessibles.", "The code could not load. Your lesson and notes are still available.", "تعذّر تحميل الكود. لا يزال الدرس والملاحظات متاحين.")}</p><button onClick={() => setAttempt(value => value + 1)} className="mt-2 min-h-11 font-semibold text-emerald-800 underline">{t("Réessayer", "Retry", "أعد المحاولة")}</button></div> : source === null ? <p role="status" className="p-4 text-sm text-neutral-500">{t("Chargement du fichier…", "Loading the file…", "جارٍ تحميل الملف…")}</p> : excerpt ? <>
        <p className="px-4 pt-3 text-xs text-neutral-500">{t("Touche une ligne pour la comprendre. Cet extrait est en lecture seule.", "Tap a line to understand it. This excerpt is read-only.", "اضغط على سطر لفهمه. المقتطف للقراءة فقط.")}</p>
        <div dir="ltr" className={styles.codeLines} aria-label={t("Code de la leçon", "Lesson code", "كود الدرس")}>
          {excerpt.lines.map((code, index) => <button key={index} type="button" aria-pressed={line === excerpt.start + index} onClick={() => setLine(excerpt.start + index)} className="flex min-h-11 w-full min-w-max items-start gap-4 px-4 py-2 text-left font-mono text-xs leading-6 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 aria-pressed:bg-emerald-50"><span className="w-6 shrink-0 text-neutral-400">{excerpt.start + index}</span><code className="whitespace-pre text-emerald-950">{code || " "}</code></button>)}
        </div>
        {explanation && <div aria-live="polite" className="border-t border-emerald-100 bg-emerald-50 px-4 py-3"><p className="text-xs font-bold text-emerald-900">{t("Ligne", "Line", "السطر")} {line} · {explanation.title}</p><p className="mt-1 text-sm leading-6 text-neutral-700">{explanation.meaning}</p></div>}
      </> : <p className="p-4 text-sm">{t("Ce fichier a évolué. Ouvre sa version complète pour retrouver cette partie.", "This file has changed. Open the full file to locate this section.", "تغير الملف. افتح نسخته الكاملة للعثور على هذا الجزء.")}</p>}
      <a href={`#files/${encodeURIComponent(lesson.file)}`} className="block border-t px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">{t("Explorer le fichier complet →", "Explore the full file →", "استكشف الملف كاملًا ←")}</a>
    </div>
    <div className="rounded-2xl bg-emerald-50 p-4"><h5 className="text-sm font-bold text-emerald-950">{t("Pourquoi on l’utilise ici", "Why we use it here", "لماذا نستخدمه هنا")}</h5><p className="mt-2 text-sm leading-7 text-emerald-950">{dailyText(lang, guide.why)}</p></div>
    <div><h5 className="text-sm font-bold">{t("Et sans ce code ?", "What if it were missing?", "وماذا لو لم يوجد؟")}</h5><p className="mt-2 text-sm leading-7 text-neutral-600">{dailyText(lang, guide.without)}</p></div>
    {guide.vocabulary.map(([word, definition]) => <div key={word} className="rounded-xl border border-dashed border-neutral-300 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("Un mot à connaître", "One term to learn", "مصطلح لنتعلمه")}</p><p className="mt-1 text-sm"><strong>{word}</strong> — {dailyText(lang, definition)}</p></div>)}
  </div>;
}
