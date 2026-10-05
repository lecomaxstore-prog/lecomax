'use client';
import { useState } from 'react';
import type { CourseLanguage } from '../course/types';
import { clickFlows } from './click-flows';
import { text, type Text } from './types';
import styles from './Learning.module.css';
export default function ClickJourney({ lang, onFile }: { lang: CourseLanguage; onFile: (file: string, anchor: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const t = (value: Text) => text(value, lang);
  const flow = clickFlows[selected];
  const current = flow.steps[step];
  return <details className={styles.section}><summary>{t(['Suivre un clic, du bouton au résultat', 'Follow a click, from button to result', 'تبع الضغطة، من الزر حتى النتيجة'])}</summary>
    <label>{t(['Choisis une action', 'Choose an action', 'اختار شنو بغيت تتبع'])}<select value={selected} onChange={event => { setSelected(Number(event.target.value)); setStep(0); }}>{clickFlows.map((item, index) => <option key={item.id} value={index}>{t(item.title)}</option>)}</select></label>
    <p className={styles.muted}>{t(['Lecture du code réel, pas une commande exécutée.', 'A walkthrough of real code, not an executed request.', 'كنقراو الكود الحقيقي؛ ما كنصيفطو حتى طلب حقيقي.'])}</p>
    <div className={styles.note} aria-live="polite" aria-atomic="true"><p>{step + 1} / {flow.steps.length}</p><h4>{t(current.label)}</h4><code dir="ltr">{current.file}</code></div>
    <div className={styles.actions}><button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>{t(['Précédent', 'Back', 'السابق'])}</button><button type="button" disabled={step === flow.steps.length - 1} onClick={() => setStep(step + 1)}>{t(['Suivant', 'Next', 'التالي'])}</button></div>
    <button type="button" onClick={() => onFile(current.file, current.anchor)}>{t(['Voir cette étape dans mon code', 'See this step in my code', 'شوف هاد الخطوة فالكود ديالي'])}</button>
  </details>;
}
