"use client";
import { useState } from "react";
import { backendGuides, guideText, type GuideText } from "./course/backend-guides";
import type { CourseLanguage } from "./course/types";
import styles from "./BackendGuides.module.css";

function CodeExample({ code, filename, lang }: { code: string; filename?: string; lang: CourseLanguage }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try { await navigator.clipboard.writeText(code); setStatus("copied"); }
    catch { setStatus("error"); }
  }
  return <div className={styles.example}>
    <div className={styles.codeHeading}><span dir="ltr">{filename}</span><button type="button" onClick={copy}>{guideText(["Copier", "Copy", "نسخ"], lang)}</button></div>
    <pre dir="ltr" tabIndex={0} aria-label={filename}><code>{code}</code></pre>
    <p role="status" className={styles.copyStatus}>{status === "copied" ? guideText(["Copié", "Copied", "تم النسخ"], lang) : status === "error" ? guideText(["Sélectionne le texte pour le copier manuellement.", "Select the text to copy it manually.", "حدد النص لنسخه يدويًا."], lang) : ""}</p>
  </div>;
}

export default function BackendGuides({ lang }: { lang: CourseLanguage }) {
  const t = (value: GuideText) => guideText(value, lang);
  return <section className={styles.shell} dir={lang === "ar" ? "rtl" : "ltr"} aria-labelledby="backend-guides-title" data-backend-guides>
    <header className={styles.heading}>
      <p className={styles.kicker}>{t(["LES COULISSES DE TON SITE", "BEHIND YOUR WEBSITE", "خلف كواليس موقعك"])}</p>
      <h2 id="backend-guides-title">{t(["Du backend à la mise en ligne", "From backend to live website", "من الخادم إلى نشر الموقع"])}</h2>
      <p>{t(["Trois guides à ouvrir à ton rythme. Chaque étape explique quoi faire, pourquoi et comment vérifier le résultat.", "Three guides to explore at your own pace. Each step explains what to do, why and how to check the result.", "ثلاثة أدلة تتعلمها بوتيرتك. تشرح كل خطوة ما يجب فعله ولماذا وكيف تتحقق من النتيجة."])}</p>
    </header>
    <ol className={styles.map} aria-label={t(["Architecture de ton site", "Your site architecture", "بنية موقعك"])}>
      {([
        ["GitHub", ["Code & historique", "Code & history", "الكود والسجل"]],
        ["Vercel", ["Site & routes API", "Website & API routes", "الموقع ومسارات API"]],
        ["Supabase", ["Données & fichiers", "Data & files", "البيانات والملفات"]],
      ] as [string, GuideText][]).map(([name, description]) => <li key={name}><strong>{name}</strong><span>{t(description)}</span></li>)}
    </ol>
    <div className={styles.guides}>
      {backendGuides.map((guide, index) => <details key={guide.id} className={styles.guide} id={`backend-${guide.id}`}>
        <summary><span className={styles.number} aria-hidden="true">0{index + 1}</span><span><strong>{t(guide.title)}</strong><span className={styles.description}>{t(guide.summary)}</span></span><span className={styles.plus} aria-hidden="true">+</span></summary>
        <div className={styles.content}>
          <p className={styles.exerciseNote}>{t(["Exemples pédagogiques à essayer dans un projet de test. Lire ou copier ici ne modifie ni ton site ni ta base.", "Learning examples to try in a test project. Reading or copying here does not change your site or database.", "أمثلة تعليمية للتجربة في مشروع اختبار. القراءة أو النسخ هنا لا يغير موقعك أو قاعدة بياناتك."])}</p>
          {guide.chapters.map((chapter, chapterIndex) => <details key={chapterIndex} className={styles.chapter}>
            <summary>{t(chapter.title)}</summary>
            <div className={styles.lesson}>
              {chapter.paragraphs.map((paragraph, i) => <p key={i}>{t(paragraph)}</p>)}
              {chapter.code && <CodeExample code={chapter.code} filename={chapter.filename} lang={lang} />}
              {chapter.files && <div className={styles.references}><h3>{t(["Dans les vrais fichiers de ton site", "In your site's actual files", "في ملفات موقعك الحقيقية"])}</h3>{chapter.files.map(file => <a key={file} href={`#files/${encodeURIComponent(file)}`}><span dir="ltr">{file}</span><span aria-hidden="true">↗</span></a>)}</div>}
              {chapter.links && <div className={styles.references}><h3>{t(["Documentation officielle", "Official documentation", "الوثائق الرسمية"])}</h3>{chapter.links.map(([label, url]) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><span>{label}</span><span aria-hidden="true">↗</span></a>)}</div>}
            </div>
          </details>)}
        </div>
      </details>)}
    </div>
    <p className={styles.footer}>{t(["Ressources vérifiées le 27 septembre 2026. Consulte les sites officiels pour les offres et limites actuelles.", "Resources checked September 27, 2026. Check official sites for current plans and limits.", "تمت مراجعة المصادر في 27 سبتمبر 2026. راجع المواقع الرسمية للخطط والحدود الحالية."])}</p>
  </section>;
}
