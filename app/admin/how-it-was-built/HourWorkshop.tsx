"use client";
import { dailyText, type DailyLesson } from "./course/daily-lessons";
import { DAILY_CODE } from "./course/daily-code";
import { DAILY_CHALLENGES, HOUR_PLAN, type Workbook } from "./course/hour-workshop";
import { translate } from "./course/journey";
import type { CourseLanguage, Lesson } from "./course/types";
import styles from "./DailySession.module.css";

export function HourPlan({ lang }: { lang: CourseLanguage }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  return <div className={styles.hourPlan}>
    <div className={styles.hourHeading}><strong>{t("Une heure pour comprendre et construire", "One hour to understand and build", "ساعة للفهم والبناء")}</strong><span>60 min</span></div>
    <ol>{HOUR_PLAN.map((part, index) => <li key={index}><span>{dailyText(lang, part.title)}</span><strong>{part.minutes} min</strong></li>)}</ol>
    <p className={styles.muted}>{t("Les durées sont des repères de travail. Prends une pause si nécessaire : tes réponses sont sauvegardées dans ce navigateur. Le temps seul ne valide pas la séance.", "Times are working estimates. Take a break when needed: your answers are saved in this browser. Time alone does not complete a session.", "المدد تقديرية للعمل. خذ استراحة عند الحاجة: تُحفظ إجاباتك في هذا المتصفح. مرور الوقت وحده لا يُكمل الجلسة.")}</p>
  </div>;
}

export default function HourWorkshop({ lang, basic, lesson, book, onChange, mode }: {
  lang: CourseLanguage; basic?: DailyLesson; lesson: Lesson | null; book: Workbook;
  onChange: (book: Workbook) => void; mode: "learn" | "practice";
}) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  function writing(key: keyof Workbook, label: string, prompt: string) {
    return <div className={styles.writing}>
      <label htmlFor={`workbook-${key}`}>{label}</label><p id={`workbook-${key}-help`}>{prompt}</p>
      <textarea id={`workbook-${key}`} aria-describedby={`workbook-${key}-help`} rows={5} maxLength={4000} value={book[key]}
        onChange={event => onChange({ ...book, [key]: event.target.value })} />
      <small>{book[key].trim().length >= 40 ? t("Réponse enregistrée", "Answer recorded", "تم تسجيل الإجابة") : t("Développe ta réponse avec un exemple concret (40 caractères minimum).", "Develop your answer with a concrete example (at least 40 characters).", "طوّر إجابتك بمثال ملموس (40 حرفًا على الأقل).")}</small>
    </div>;
  }
  if (mode === "learn") return <div className={styles.stack}>
    {writing("recall", t("01 · Préparation — 5 min", "01 · Preparation — 5 min", "01 · التحضير — 5 دقائق"), t("Avant de lire, écris ce que tu crois savoir du sujet, un exemple dans ta boutique et une question à résoudre aujourd’hui. Tu reviendras sur cette prédiction à la fin.", "Before reading, write what you think you know, a shop example and a question to resolve today. You will revisit this prediction at the end.", "قبل القراءة اكتب ما تعتقد أنك تعرفه ومثالًا من متجرك وسؤالًا تريد حله اليوم. ستراجع توقعك في النهاية."))}
    <div className={styles.explanation}><strong>{t("02 · Lecture active — 15 min", "02 · Active reading — 15 min", "02 · قراءة نشطة — 15 دقيقة")}</strong><p>{t("Lis une première fois pour comprendre le rôle du code. Puis relis en suivant les données : d’où viennent-elles, qu’est-ce qui les transforme, quel résultat apparaît ? Relève trois mots nouveaux et explique-les à voix haute sans regarder.", "Read once to understand the code’s role. Then trace its data: where does it come from, what changes it, what result appears? Pick three new terms and explain them aloud without looking.", "اقرأ أولًا لفهم دور الكود ثم تتبّع البيانات: من أين تأتي وما الذي يغيّرها وما النتيجة؟ اختر ثلاثة مصطلحات واشرحها بصوت عالٍ دون النظر.")}</p></div>
    {basic && <div className={styles.explanation}><strong>{t("Ce qui se passe, et pourquoi", "What happens, and why", "ماذا يحدث ولماذا")}</strong><p>{dailyText(lang, DAILY_CODE[basic.id].why)}</p><p>{dailyText(lang, DAILY_CODE[basic.id].without)}</p><dl>{DAILY_CODE[basic.id].vocabulary.map(([word, definition]) => <div key={word}><dt><strong>{word}</strong></dt><dd>{dailyText(lang, definition)}</dd></div>)}</dl></div>}
    {lesson && <div className={styles.explanation}><strong>{t("À la fin, tu sauras…", "By the end, you can…", "في النهاية ستستطيع…")}</strong><ul>{lesson.objectives.map(objective => <li key={objective}>{objective}</li>)}</ul></div>}
  </div>;
  return <div className={styles.stack}>
    <div className={styles.explanation}><strong>{t("03 · Atelier guidé — 15 min", "03 · Guided workshop — 15 min", "03 · تطبيق موجّه — 15 دقيقة")}</strong>
      <p>{basic ? dailyText(lang, basic.task) : lesson?.exercise.task}</p>
      <ol>{(lesson?.exercise.steps ?? [
        t("Prépare un brouillon : dessine les éléments et donne-leur des noms précis.", "Make a draft: sketch the parts and give them precise names.", "جهّز مسودة وارسم الأجزاء وسمّها بدقة."),
        t("Utilise l’exemple du cours pour réaliser une première version. Explique chaque étape avec tes mots.", "Use the lesson example to make a first version. Explain each step in your own words.", "استخدم مثال الدرس لإنشاء نسخة أولى واشرح كل خطوة بكلماتك."),
        t("Compare ton résultat avec la consigne. Repère une différence, corrige-la et recommence la vérification.", "Compare your result with the task. Find a difference, correct it and check again.", "قارن النتيجة بالمطلوب وحدّد فرقًا وصحّحه وأعد الفحص."),
      ]).map((step, index) => <li key={index}>{step}</li>)}</ol>
    </div>
    {writing("guided", t("Ton travail guidé", "Your guided work", "عملك الموجّه"), t("Garde ici ton brouillon, ton code ou la description de ton schéma. Écris le résultat attendu, le résultat obtenu et une correction effectuée.", "Keep your draft, code or diagram description here. Write the expected result, actual result and one correction you made.", "احفظ هنا المسودة أو الكود أو وصف الرسم. اكتب النتيجة المتوقعة والفعلية وتصحيحًا أجريته."))}
    <details className={styles.details}><summary>{t("Comparer après mon essai", "Compare after my attempt", "قارن بعد المحاولة")}</summary>
      {basic ? <><p>{dailyText(lang, basic.answer)}</p><p>{dailyText(lang, basic.example)}</p></> : lesson && <><p>{lesson.exercise.solution.explanation}</p><pre className={styles.code} dir="ltr"><code>{lesson.exercise.solution.code}</code></pre><p>{lesson.expectedResult}</p></>}
      <p>{t("Cette correction concerne l’exercice guidé. Note une différence avec ton raisonnement avant de passer au défi.", "This correction covers the guided exercise. Note a difference from your reasoning before the challenge.", "هذا التصحيح للتمرين الموجّه. سجّل فرقًا عن تفكيرك قبل التحدّي.")}</p>
    </details>
    <div className={styles.explanation}><strong>{t("04 · Défi autonome — 15 min", "04 · Independent challenge — 15 min", "04 · تحدٍّ مستقل — 15 دقيقة")}</strong>
      <p>{basic ? dailyText(lang, DAILY_CHALLENGES[basic.id]) : t("Cache la solution. Reproduis l’exercice avec un exemple différent, puis modifie une entrée ou une contrainte. Prévois le résultat avant de vérifier. Documente un cas normal, un cas limite et un cas d’erreur.", "Hide the solution. Rebuild the exercise with a different example, then change one input or constraint. Predict before checking. Document a normal case, an edge case and an error case.", "أخفِ الحل وأعد التمرين بمثال مختلف ثم غيّر مدخلًا أو شرطًا. توقّع قبل الفحص ووثّق حالة عادية وحدّية وحالة خطأ.")}</p>
      {lesson && <><p>{lesson.expectedResult}</p>{lesson.commonErrors.slice(0, 2).map((error, index) => <details key={index} className={styles.details}><summary>{error.symptom}</summary><p>{error.cause}</p><p>{error.fix}</p></details>)}</>}
    </div>
    {writing("challenge", t("Ta solution et tes vérifications", "Your solution and checks", "حلّك وفحوصك"), t("Écris ta solution sans recopier le modèle. Ajoute trois vérifications avec, pour chacune, l’entrée, le résultat attendu et ce que tu as observé. Sur papier, décris le raisonnement et les résultats prévus.", "Write your solution without copying the model. Add three checks with input, expected result and observation. On paper, describe your reasoning and predicted results.", "اكتب الحل دون نسخ النموذج وأضف ثلاثة فحوص بالمدخل والنتيجة المتوقعة والملاحظة. على الورق صف التفكير والنتائج المتوقعة."))}
    {writing("reflection", t("05 · Bilan et test — 10 min", "05 · Review and quiz — 10 min", "05 · مراجعة واختبار — 10 دقائق"), t("Relis ta prédiction du début. Explique ce qui a changé, une erreur corrigée et comment tu utiliseras cette idée dans ta boutique. Puis passe le quiz. Tes notes sont une auto-évaluation ; le quiz vérifie les réponses aux questions.", "Revisit your opening prediction. Explain what changed, one corrected mistake and how you will use this idea in your shop. Then take the quiz. Notes are self-assessed; the quiz checks question answers.", "راجع توقعك الأول واشرح ما تغيّر وخطأ صحّحته وكيف ستستخدم الفكرة في متجرك ثم أجب عن الاختبار. الملاحظات تقييم ذاتي والاختبار يتحقق من إجابات الأسئلة."))}
  </div>;
}
