"use client";
import { useState } from 'react';
import type { CourseLanguage } from '../course/types';
import { runPlayground } from './progress';
import { text, type Text } from './types';
import styles from './Learning.module.css';
const original='const title = "Mon produit";\nconst price = 100;\nconst quantity = 1;';
export default function Playground({lang}:{lang:CourseLanguage}) {
  const t=(value:Text)=>text(value,lang);const [code,setCode]=useState(original);const [result,setResult]=useState(runPlayground(original));const [ran,setRan]=useState(false);const [hint,setHint]=useState(false);
  return <section className={styles.section}><h3>{t(['Essaie sans toucher à la boutique','Try without changing the shop','جرب دون تغيير المتجر'])}</h3><p>{t(['Mini-langage d’exercice : change le titre, le prix ou la quantité. Prédis le total, puis lance l’aperçu. Ce calcul ne crée aucune commande.','Exercise mini-language: change title, price or quantity. Predict the total, then run. This calculation creates no order.','لغة تمرين مصغرة: غيّر العنوان أو السعر أو الكمية وتوقع المجموع ثم شغّل. لا ينشئ هذا طلبا.'])}</p>
    <details><summary>{t(['Original','Original','الأصل'])}</summary><pre dir="ltr"><code>{original}</code></pre></details>
    <label>{t(['Ta version','Your version','نسختك'])}<textarea dir="ltr" spellCheck={false} rows={5} maxLength={400} value={code} onChange={event=>setCode(event.target.value)}/></label>
    <div className={styles.actions}><button onClick={()=>{setResult(runPlayground(code));setRan(true);}}>{t(['Lancer','Run','تشغيل'])}</button><button onClick={()=>{setCode(original);setResult(runPlayground(original));setRan(false);}}>{t(['Réinitialiser','Reset','إعادة الضبط'])}</button><button onClick={()=>setHint(!hint)}>{t(['Indice','Hint','تلميح'])}</button></div>
    {hint&&<p>{t(['Garde les trois lignes. Mets quantity à 3 : 100 × 3 = 300.','Keep all three lines. Set quantity to 3: 100 × 3 = 300.','احتفظ بالأسطر الثلاثة واجعل quantity تساوي 3: المجموع 300.'])}</p>}
    <div role="status">{result?<div className={styles.preview}><h4>{result.title}</h4><p>{result.price} × {result.quantity} = <strong>{result.price*result.quantity} MAD</strong></p></div>:<p>{t(['Syntaxe non reconnue. Garde les trois const, le titre entre guillemets, des nombres entiers et une quantité de 1 à 99. Aucun code n’a été exécuté.','Unrecognized syntax. Keep the three const lines, quoted title, integer prices and quantity 1–99. No code was executed.','صيغة غير معروفة. احتفظ بـ const الثلاثة وعنوان بين علامتي اقتباس وأعداد صحيحة وكمية 1–99. لم ينفذ كود.'])}</p>}</div>
    {ran&&<details><summary>{t(['Voir la solution et pourquoi','See the solution and why','عرض الحل وسببه'])}</summary><pre dir="ltr"><code>{original.replace('quantity = 1','quantity = 3')}</code></pre><p>{t(['const donne un nom à chaque valeur. * multiplie le prix par la quantité. React affiche le résultat avec les données du simulateur, sans API ni base de données.','const names each value. * multiplies price by quantity. React renders simulator data without an API or database.','تسمي const كل قيمة وتضرب * السعر في الكمية. يعرض React بيانات المحاكي دون API أو قاعدة بيانات.'])}</p></details>}
  </section>;
}
