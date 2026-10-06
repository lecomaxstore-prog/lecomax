"use client";
import { useEffect, useState } from "react";
import { TUTOR_EXAMPLES, type TutorExample, type TutorMode } from "@/lib/ai-tutor";
import styles from "./Tutor.module.css";

type Preview = { path: string; focusLine: number; generatedAt: string; excerpt: string };
export default function SiteExamples({ disabled, onChoose }: { disabled: boolean; onChoose: (example: TutorExample, line: number, mode: TutorMode) => void }) {
  const [id, setId] = useState<string>(TUTOR_EXAMPLES[0].id);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const example = TUTOR_EXAMPLES.find(item => item.id === id)!;
  useEffect(() => {
    const controller = new AbortController();
    setPreview(null); setError("");
    fetch(`/api/admin/ai-tutor/source?example=${encodeURIComponent(id)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok || typeof data.excerpt !== "string") throw new Error("تعذر تحميل المثال. حاول مجددًا."); return data as Preview; })
      .then(data => { if (!controller.signal.aborted) setPreview(data); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [id, reload]);
  return <section className={styles.siteExamples} aria-label="أمثلة من ملفات موقعي">
    <div className={styles.exampleHeading}><span aria-hidden="true">⌘</span><div><h3>تعلّم من متجرك الحقيقي</h3><p>ملف حقيقي، فكرة واحدة، ثم تجربة بيدك.</p></div></div>
    <label>اختر مثالًا<select value={id} disabled={disabled} onChange={event => { setPreview(null); setId(event.target.value); }}>{TUTOR_EXAMPLES.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <p className={styles.exampleGoal}>{example.goal}</p>
    <p className={styles.examplePath} dir="ltr">{example.path}{preview ? `:${preview.focusLine}` : ""}</p>
    {!preview && !error && <p role="status" className={styles.muted}>جارٍ قراءة الملف الحقيقي…</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)}>أعد تحميل المثال</button></div>}
    {preview && <details className={styles.exampleCode}><summary>شاهد الكود الحقيقي · 14 سطرًا كحد أقصى</summary><pre dir="ltr"><code>{preview.excerpt}</code></pre><p className={styles.muted}>لقطة ملفات المشروع: {new Date(preview.generatedAt).toLocaleDateString("ar")}</p><p className={styles.exampleGoal}><strong>فكّر قبل الشرح: </strong>{example.challenge}</p></details>}
    <div className={styles.exampleActions}><button className={styles.primary} disabled={disabled || !preview} onClick={() => onChoose(example, preview!.focusLine, "project")}>افهم هذا المثال ←</button><button disabled={disabled || !preview} onClick={() => onChoose(example, preview!.focusLine, "practice")}>جرّبني فيه</button></div>
  </section>;
}
