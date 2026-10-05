'use client';
import { useState } from 'react';
import type { CourseLanguage } from '../course/types';
import type { Lesson, Text } from './types';
import { text } from './types';
import { readings } from './reading';
import { analogies, advancedNotes, removalNotes, comparisons } from './coaching';
import FileCoach from './FileCoach';
import CodeTokens from './CodeTokens';
import styles from './Learning.module.css';

export default function ReadingCoach({ lesson, lang }: { lesson: Lesson; lang: CourseLanguage }) {
  const t = (value: Text) => text(value, lang);
  const reading = readings[lesson.id];
  const [selected, setSelected] = useState(0);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [depth, setDepth] = useState(0);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  return <div className={styles.readingCoach}>
    <p className={styles.path} dir="ltr">{reading.file}</p>
    <div className={styles.actions} role="group" aria-label={t(['Niveau du détail', 'Explanation depth', 'مستوى الشرح'])}>
      {([['Très simple', 'Very simple', 'بسيط بزاف'], ['Normal', 'Normal', 'شرح عادي'], ['Avancé', 'Advanced', 'شرح متقدم']] as Text[]).map((label, index) => <button key={index} type="button" aria-pressed={depth === index} onClick={() => setDepth(index)}>{t(label)}</button>)}
    </div>
    <p className={styles.muted}>{t(['Extraits choisis de ton projet. Touche une ligne pour la comprendre ; tu n’as pas besoin de tout mémoriser.', 'Selected excerpts from your project. Select a line to understand it; you do not need to memorize everything.', 'مقتطفات مختارة من مشروعك. اختر سطرا لفهمه؛ لا تحتاج إلى حفظ كل شيء.'])}</p>
    <ol className={styles.codeLines} aria-label={t(['Lignes à explorer', 'Lines to explore', 'أسطر للاستكشاف'])}>
      {reading.lines.map((line, index) => <li key={index}>
        <button type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>
          <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <code dir="ltr"><CodeTokens code={line.code}/></code>
        </button>
      </li>)}
    </ol>
    <div className={styles.lineMeaning} aria-live="polite" aria-atomic="true">
      <p className={styles.eyebrow}>{t(['EN MOTS SIMPLES', 'IN PLAIN WORDS', 'بكلمات بسيطة'])} · {selected + 1} / {reading.lines.length}</p>
      <p>{t(depth === 0 ? analogies[lesson.id] : reading.lines[selected].explanation)}</p>
      {depth === 0 && <p>{t(reading.lines[selected].explanation)}</p>}
      {depth === 2 && <p>{t(advancedNotes[lesson.id])}</p>}
      <details key={`why-${selected}`}><summary>{t(['Pourquoi cette ligne ?', 'Why this line?', 'علاش استعملنا هادي؟'])}</summary><p>{t(reading.lines[selected].explanation)}</p><p>{t(lesson.why)}</p></details>
      <details key={`remove-${selected}`}><summary>{t(['Et si je retire ceci ?', 'What if I remove this?', 'شنو يوقع إلا حيدت هادي؟'])}</summary><p>{t(removalNotes[lesson.id][selected])}</p></details>
    </div>
    <div className={styles.actions}><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(reading.lines.map(line => line.code).join('\n')); setCopyStatus('ok'); } catch { setCopyStatus('error'); } }}>{t(['Copier l’extrait', 'Copy excerpt', 'نسخ المقتطف'])}</button><span role="status">{copyStatus === 'ok' ? t(['Copié', 'Copied', 'تنسخ']) : copyStatus === 'error' ? t(['Sélectionne le texte pour le copier.', 'Select the text to copy it.', 'اختار النص ونسخو يدويا.']) : ''}</span></div>
    {reading.lines.length > 1 && <div className={styles.actions}>
      <button type="button" disabled={selected === 0} onClick={() => setSelected(value => value - 1)}>{t(['Ligne précédente', 'Previous line', 'السطر السابق'])}</button>
      <button type="button" disabled={selected === reading.lines.length - 1} onClick={() => setSelected(value => value + 1)}>{t(['Ligne suivante', 'Next line', 'السطر التالي'])}</button>
    </div>}
    {comparisons[lesson.id] && <details><summary>{t(['Une erreur facile à comprendre', 'An easy mistake to understand', 'غلط صغير نفهموه بجوج'])}</summary><p>{t(['À corriger', 'To fix', 'خاصو تصحيح'])}</p><pre dir="ltr" tabIndex={0}><code>{comparisons[lesson.id].before}</code></pre><p>{t(['Version corrigée', 'Corrected version', 'النسخة المصححة'])}</p><pre dir="ltr" tabIndex={0}><code>{comparisons[lesson.id].after}</code></pre><p>{t(comparisons[lesson.id].explanation)}</p></details>}
    <details onToggle={event => setSourceOpen(event.currentTarget.open)}>
      <summary>{t(['Aller plus loin : ouvrir le vrai fichier', 'Go deeper: open the real file', 'تعمق: افتح الملف الحقيقي'])}</summary>
      {sourceOpen && <FileCoach lang={lang} file={reading.file} anchor={lesson.anchor} compact />}
    </details>
  </div>;
}
