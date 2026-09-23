"use client";
import { useState } from "react";
import { gradeSession } from "./course/daily-path";
import type { CourseLanguage } from "./course/types";
import { translate } from "./course/journey";
import styles from "./DailySession.module.css";

export type SessionQuestion = { question: string; options: string[]; correctIndex: number; explanation: string };
export default function DailySessionQuiz({ questions, lang, onSubmit, onReview }: { questions: SessionQuestion[]; lang: CourseLanguage; onSubmit: (answers: number[]) => void; onReview: () => void }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const result = gradeSession(answers, questions.map(question => question.correctIndex));
  const question = questions[index];
  if (submitted) return <div className={styles.stack} role="status">
    <h3>{t("On reprend ensemble.", "Let’s work through it together.", "لنراجع معًا.")}</h3>
    <p>{result.score}/{result.total} {t("bonnes réponses. Une erreur fait partie de l’apprentissage. Lis ces explications, puis réessaie.", "correct. Mistakes are part of learning. Read these explanations, then try again.", "إجابات صحيحة. الخطأ جزء من التعلم. اقرأ الشرح ثم أعد المحاولة.")}</p>
    {questions.map((item, questionIndex) => <div className={styles.explanation} key={questionIndex}><strong>{answers[questionIndex] === item.correctIndex ? "✓ " : "↺ "}{item.question}</strong><p>{t("Bonne réponse : ", "Correct answer: ", "الإجابة الصحيحة: ")}{item.options[item.correctIndex]}</p><p>{item.explanation}</p></div>)}
    <button className={styles.primary} onClick={() => { setAnswers([]); setIndex(0); setSubmitted(false); }}>{t("Réessayer le test", "Try the test again", "أعد الاختبار")}</button>
    <button className={styles.textButton} onClick={onReview}>{t("Relire la leçon", "Read the lesson again", "راجع الدرس")}</button>
  </div>;
  return <div className={styles.stack}>
    <p className={styles.kicker} aria-live="polite">{t("QUESTION", "QUESTION", "السؤال")} {index + 1} / {questions.length}</p>
    <fieldset key={index} className={styles.question}><legend>{question.question}</legend>{question.options.map((option, optionIndex) => <label key={optionIndex} className={styles.option} data-selected={answers[index] === optionIndex}><input type="radio" name={`session-question-${index}`} checked={answers[index] === optionIndex} onChange={() => setAnswers(current => { const next = [...current]; next[index] = optionIndex; return next; })} /><span>{option}</span></label>)}</fieldset>
    <button className={styles.primary} disabled={!Number.isInteger(answers[index])} onClick={() => {
      if (index < questions.length - 1) setIndex(index + 1);
      else { onSubmit(answers); if (!result.passed) setSubmitted(true); }
    }}>{index < questions.length - 1 ? t("Question suivante →", "Next question →", "السؤال التالي ←") : t("Voir mon résultat", "See my result", "شاهد نتيجتي")}</button>
    {index > 0 && <button className={styles.textButton} onClick={() => setIndex(index - 1)}>{t("Question précédente", "Previous question", "السؤال السابق")}</button>}
    <p className={styles.muted}>{t("Sans chronomètre. Tu peux réessayer autant que nécessaire.", "No timer. You can try again as often as you need.", "دون مؤقت. يمكنك إعادة المحاولة كلما احتجت.")}</p>
  </div>;
}
