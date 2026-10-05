'use client';
import { useState } from 'react';
import type { CourseLanguage } from '../course/types';
import { text, type Text } from './types';
import { labs, previewLab, type LabKind } from './practice';
import styles from './Learning.module.css';

export default function MiniLab({ kind, lang }: { kind: LabKind; lang: CourseLanguage }) {
  const t = (value: Text) => text(value, lang);
  const lab = labs[kind];
  const [code, setCode] = useState(lab.original);
  const [result, setResult] = useState(() => previewLab(kind, lab.original));
  const [ran, setRan] = useState(false);
  const [dirty, setDirty] = useState(false);
  function reset() { setCode(lab.original); setResult(previewLab(kind, lab.original)); setRan(false); setDirty(false); }
  return <div className={styles.miniLab}>
    <p className={styles.eyebrow}>{t(['LE PETIT ATELIER', 'THE MINI WORKSHOP', 'الورشة الصغيرة'])}</p>
    <h4>{t(['Change une chose. Observe le résultat.', 'Change one thing. See the result.', 'غير شيئا واحدا وشاهد النتيجة.'])}</h4>
    <p>{t(lab.task)}</p>
    <p className={styles.muted}>{t(['Exemple simplifié inspiré de ton site. Tout reste dans cet exercice.', 'A simplified example inspired by your site. Everything stays in this exercise.', 'مثال مبسط مستوحى من موقعك. كل شيء يبقى في التمرين.'])}</p>
    <label>{t(['Ton code', 'Your code', 'الكود الخاص بك'])}
      <textarea rows={3} dir="ltr" spellCheck={false} autoCapitalize="off" maxLength={240} value={code} onChange={event => { setCode(event.target.value); setDirty(true); }} />
    </label>
    <div className={styles.actions}>
      <button type="button" className={styles.primary} onClick={() => { setResult(previewLab(kind, code)); setRan(true); setDirty(false); }}>{t(['Voir le résultat', 'See the result', 'شاهد النتيجة'])}</button>
      <button type="button" onClick={reset}>{t(['Recommencer', 'Reset', 'إعادة البداية'])}</button>
    </div>
    <details><summary>{t(['Un indice', 'A hint', 'تلميح'])}</summary><p>{t(lab.hint)}</p></details>
    <div className={styles.labOutput} role="status" aria-live="polite">
      <p className={styles.eyebrow}>{t(['APERÇU', 'PREVIEW', 'معاينة'])}</p>
      {dirty && <p className={styles.muted}>{t(['Le code a changé. Lance l’aperçu pour voir ta nouvelle version.', 'The code changed. Run the preview to see your new version.', 'تغير الكود. شغل المعاينة لرؤية النسخة الجديدة.'])}</p>}
      {result ? <>
        {kind === 'route' ? <p><code dir="ltr">localhost:3000{result.value}</code></p>
          : kind === 'spacing' ? <div className={styles.spacingPreview} style={{ padding: `${Number(result.value) / 4}rem` }}><span>{t(['Contenu de la carte', 'Card content', 'محتوى البطاقة'])}</span></div>
          : kind === 'state' ? <p>{t(['Quantité affichée', 'Displayed quantity', 'الكمية المعروضة'])} : <strong>{result.value}</strong></p>
          : <div className={styles.demoProduct}><span aria-hidden="true">Aa</span><h4>{result.value}</h4><code dir="ltr">{'<h3>{product.name}</h3>'}</code></div>}
        {ran && !dirty && <p>{result.solved ? t(['✓ Objectif atteint. Tu as changé le résultat avec ton code.', '✓ Goal reached. Your code changed the result.', '✓ تحقق الهدف. غيّرت النتيجة بالكود.']) : t(['Ton essai fonctionne. Relis l’objectif pour terminer le défi.', 'Your attempt works. Check the goal to finish the challenge.', 'محاولتك تعمل. راجع الهدف لإكمال التحدي.'])}</p>}
      </> : <p>{t(['Ce format n’est pas reconnu. Compare avec le modèle et vérifie les guillemets, les parenthèses et le nom. Tu peux recommencer sans rien perdre dans ton site.', 'This format is not recognized. Compare with the original and check quotes, parentheses and names. Resetting does not affect your site.', 'لم يتم التعرف على الصيغة. قارن بالنموذج وافحص علامات الاقتباس والأقواس والأسماء. إعادة البداية لا تؤثر على موقعك.'])}</p>}
    </div>
    {ran && <details><summary>{t(['Comprendre la solution', 'Understand the solution', 'افهم الحل'])}</summary><pre dir="ltr" tabIndex={0}><code>{lab.solution}</code></pre><p>{t(lab.explanation)}</p></details>}
  </div>;
}
