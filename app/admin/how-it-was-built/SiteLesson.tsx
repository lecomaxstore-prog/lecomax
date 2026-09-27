"use client";
import { useEffect, useRef, useState } from "react";
import { elementLesson, learningDestination } from "@/lib/site-learning";
import type { SourceSelection } from "@/lib/site-source-inspector";
import type { CourseLanguage } from "./course/types";
import { translate } from "./course/journey";
import CodeExplanation from "./CodeExplanation";
import styles from "./SiteExplorer.module.css";

export default function SiteLesson({ selection, content, initialLine, lang, onNavigate, onLearned }: {
  selection: SourceSelection; content: string; initialLine: number; lang: CourseLanguage;
  onNavigate: (url: string, file: string) => void; onLearned: () => void;
}) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [tab, setTab] = useState<"understand" | "code" | "try">("understand");
  const [line, setLine] = useState(initialLine);
  const [answer, setAnswer] = useState(false);
  const [learned, setLearned] = useState(false);
  const [reflection, setReflection] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { panel.current?.scrollTo({ top: 0 }); }, [tab]);
  const lesson = elementLesson(selection, lang);
  const lines = content.split("\n");
  const destination = learningDestination(selection.href);
  const start = Math.max(0, line - (tab === "code" ? 8 : 1));
  return <div className={styles.lesson} dir={lang === "ar" ? "rtl" : "ltr"}>
    <div className={`${styles.lessonTabs} flex border-b px-3`} role="tablist" aria-label={t("Ma leçon", "My lesson", "درسي")}>{([
      ["understand", t("1. Comprendre", "1. Understand", "1. افهم")], ["code", t("2. Le code", "2. Code", "2. الكود")], ["try", t("3. À toi", "3. Your turn", "3. جرّب")],
    ] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls="site-lesson-content" tabIndex={tab === id ? 0 : -1} onKeyDown={event => {
      const tabs = ["understand", "code", "try"] as const;
      const direction = lang === "ar" ? -1 : 1;
      const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : event.key === "ArrowRight" ? (tabs.indexOf(tab) + direction + 3) % 3 : event.key === "ArrowLeft" ? (tabs.indexOf(tab) - direction + 3) % 3 : -1;
      if (next >= 0) { event.preventDefault(); setTab(tabs[next]); event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus(); }
    }} onClick={() => setTab(id)} className={`min-h-12 flex-1 border-b-2 px-1 text-sm font-bold ${tab === id ? "border-emerald-700 text-emerald-800" : "border-transparent text-neutral-500"}`}>{label}</button>)}</div>
    <div ref={panel} id="site-lesson-content" role="tabpanel" tabIndex={0} className={`${styles.lessonContent} space-y-4 p-4 sm:p-6`}>
      <div><p className="text-xs font-semibold text-emerald-800">{selection.tag ? `<${selection.tag}> · ` : ""}{t("Ton vrai fichier", "Your real file", "ملفك الحقيقي")}</p><p dir="ltr" className="mt-1 break-all font-mono text-xs text-neutral-600">{selection.path}:{line}</p></div>
      {tab === "understand" && <>
        <h3 className="text-xl font-bold">{lesson.title}</h3>
        <section><h4 className="mb-1 text-sm font-bold">{t("Ce que ça fait", "What it does", "ماذا يفعل")}</h4><p className="text-sm leading-7 text-neutral-700">{lesson.what}</p></section>
        <section className="rounded-2xl bg-emerald-50 p-4"><h4 className="mb-1 text-sm font-bold">{t("Pourquoi on l’utilise", "Why we use it", "لماذا نستخدمه")}</h4><p className="text-sm leading-7 text-emerald-950">{lesson.why}</p></section>
        {!selection.exact && <p className="text-xs leading-5 text-amber-800">{t("Ce repère ouvre le composant parent. Le code exact d’un élément tiers peut se trouver dans sa bibliothèque.", "This opens the parent component. A third-party element’s exact code may live in its library.", "يفتح هذا المرجع المكوّن الأب. قد يوجد الكود الدقيق لعنصر خارجي في مكتبته.")}</p>}
      </>}
      {tab !== "try" && <>
        <div><p className="mb-2 text-xs font-bold">{t("Le code à cet endroit · touche une ligne", "Code at this spot · tap a line", "الكود هنا · انقر على سطر")}</p><div dir="ltr" className={`${styles.code} rounded-xl`}><pre><code>{lines.slice(start, start + (tab === "code" ? 45 : 7)).map((value, index) => <button key={start + index} type="button" aria-label={`${t("Expliquer la ligne", "Explain line", "شرح السطر")} ${start + index + 1}`} aria-pressed={line === start + index + 1} onClick={() => { setLine(start + index + 1); setTab("code"); }}><span className="mr-4 inline-block w-7 text-right text-emerald-200/60">{start + index + 1}</span>{value || " "}</button>)}</code></pre></div></div>
        {tab === "code" && <CodeExplanation path={selection.path} lines={lines} line={line} lang={lang} onLineChange={setLine} />}
        <div className="flex flex-wrap gap-2"><a href={`#files/${encodeURIComponent(selection.path)}?line=${line}`} className="inline-flex min-h-11 items-center rounded-xl border px-3 text-xs font-bold">{t("Tout le fichier", "Full file", "الملف كاملًا")}</a>{destination && <button type="button" onClick={() => onNavigate(destination.url, destination.file)} className="min-h-11 rounded-xl border px-3 text-xs font-bold">{t("Explorer la page de ce lien →", "Explore this link’s page →", "استكشف صفحة هذا الرابط ←")}</button>}</div>
        <button type="button" onClick={() => setTab(tab === "understand" ? "code" : "try")} className="min-h-12 w-full rounded-xl bg-emerald-950 px-4 font-bold text-white">{tab === "understand" ? t("Comprendre chaque ligne →", "Understand each line →", "افهم كل سطر ←") : t("Vérifier ce que j’ai compris →", "Check my understanding →", "اختبر فهمك ←")}</button>
      </>}
      {tab === "try" && <section className="space-y-4"><h3 className="text-xl font-bold">{t("Une petite question", "A small question", "سؤال صغير")}</h3><p className="text-base leading-7">{lesson.challenge}</p><p className="text-sm text-neutral-500">{t("Réfléchis, puis compare avec l’explication. Rien n’est modifié sur ton site.", "Think, then compare with the explanation. Your site is not changed.", "فكّر ثم قارن بالشرح. لن يتغير شيء في موقعك.")}</p><label className="block text-sm font-semibold">{t("Mon idée, avec mes mots (facultatif)", "My idea, in my own words (optional)", "فكرتي بكلماتي (اختياري)")}<textarea value={reflection} onChange={event => setReflection(event.target.value)} rows={3} maxLength={1500} placeholder={t("Je pense que…", "I think…", "أعتقد أن…")} className="mt-2 block w-full resize-y rounded-xl border border-emerald-200 bg-white p-3 text-base font-normal outline-none focus:ring-2 focus:ring-emerald-600" /></label><button type="button" onClick={() => setAnswer(true)} className="min-h-12 w-full rounded-xl border border-emerald-800 font-bold text-emerald-900">{t("Voir l’explication", "Show explanation", "عرض الشرح")}</button>{answer && <div className="space-y-4 rounded-2xl bg-emerald-50 p-4"><p className="text-sm leading-7">{lesson.answer}</p><button type="button" disabled={learned} onClick={() => { setLearned(true); onLearned(); }} className="min-h-12 w-full rounded-xl bg-emerald-950 px-4 font-bold text-white">{learned ? t("Compris ✓", "Understood ✓", "فهمت ✓") : t("J’ai compris cette partie", "I understand this part", "فهمت هذا الجزء")}</button></div>}</section>}
    </div>
  </div>;
}
