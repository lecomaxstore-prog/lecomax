'use client';
import { useState } from 'react';
import type { CourseLanguage } from '../course/types';
import { text, type Lesson, type Text } from './types';
import { predictionIsYes } from './reading';
import styles from './Learning.module.css';

export default function LessonQuiz({ lesson, lang, onResult, savedScore }: {
  lesson: Lesson; lang: CourseLanguage; onResult: (score: number | null) => void; savedScore?: number;
}) {
  const t = (value: Text) => text(value, lang);
  const questions = [
    { title: lesson.question, options: lesson.options, correct: lesson.correct, explanation: lesson.why },
    { title: lesson.prediction, options: [['Oui', 'Yes', 'نعم'], ['Non', 'No', 'لا']] as Text[], correct: predictionIsYes[lesson.id] ? 0 : 1, explanation: lesson.outcome },
  ];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null]);
  const [checked, setChecked] = useState([false, false]);
  const [started, setStarted] = useState(false);
  const question = questions[index];
  const correct = answers[index] === question.correct;
  const allChecked = checked.every(Boolean);
  const score = questions.reduce((total, item, i) => total + Number(answers[i] === item.correct), 0);
  function verify() {
    if (answers[index] === null) return;
    const next = checked.map((value, i) => i === index || value);
    setChecked(next);
    if (next.every(Boolean)) onResult(score);
  }
  function retry() {
    setChecked(values => values.map((value, i) => i === index ? false : value));
    setAnswers(values => values.map((value, i) => i === index ? null : value));
    onResult(null);
  }
  return <div className={styles.quiz}>
    {savedScore !== undefined && !started && <p className={styles.note}>{t(['Dernier résultat sauvegardé :', 'Last saved result:', 'آخر نتيجة محفوظة:'])} {savedScore} / 2 · {t(['Ce nouvel essai sert de révision.', 'This new attempt is a review.', 'هاد المحاولة الجديدة للمراجعة.'])}</p>}
    <p className={styles.muted}>{t(['Deux petites questions, sans chronomètre. Tu peux réessayer autant que tu veux.', 'Two small questions, no timer. Retry as often as you like.', 'سؤالان صغيران دون مؤقت. يمكنك إعادة المحاولة كما تشاء.'])}</p>
    <p className={styles.eyebrow}>{t(['QUESTION', 'QUESTION', 'السؤال'])} {index + 1} / 2</p>
    <fieldset disabled={checked[index]}>
      <legend>{t(question.title)}</legend>
      {question.options.map((option, optionIndex) => <label className={styles.quizOption} key={optionIndex} data-selected={answers[index] === optionIndex} data-correct={checked[index] && optionIndex === question.correct}>
        <input type="radio" name={`lesson-${lesson.id}-${index}`} value={optionIndex} checked={answers[index] === optionIndex} onChange={() => { if (!started) { setStarted(true); onResult(null); } setAnswers(values => values.map((value, i) => i === index ? optionIndex : value)); }} />
        <span>{t(option)}</span>
        {checked[index] && optionIndex === question.correct && <span aria-hidden="true">✓</span>}
      </label>)}
    </fieldset>
    {!checked[index] ? <button type="button" className={styles.primary} disabled={answers[index] === null} onClick={verify}>{t(['Vérifier ma réponse', 'Check my answer', 'تحقق من إجابتي'])}</button> : <>
      <div className={styles.quizFeedback} role="status" data-correct={correct}>
        <strong>{correct ? t(['Oui, tu as compris cette idée.', 'Yes, you understood this idea.', 'نعم، فهمت هذه الفكرة.']) : t(['On reprend ensemble.', 'Let’s work through it together.', 'لنراجع معا.'])}</strong>
        {!correct && <p>{t(['La réponse à retenir :', 'The answer to remember:', 'الإجابة التي يجب تذكرها:'])} <strong>{t(question.options[question.correct])}</strong></p>}
        <p>{t(question.explanation)}</p>
      </div>
      <div className={styles.actions}>
        {!correct && <button type="button" onClick={retry}>{t(['Réessayer cette question', 'Retry this question', 'أعد هذا السؤال'])}</button>}
        {index === 0 && <button type="button" className={styles.primary} onClick={() => setIndex(1)}>{t(['Question suivante', 'Next question', 'السؤال التالي'])} →</button>}
      </div>
    </>}
    {index === 1 && <button type="button" onClick={() => setIndex(0)}>{t(['Revoir la première question', 'Review the first question', 'راجع السؤال الأول'])}</button>}
    {allChecked && <p className={styles.quizSummary} role="status">{score} / 2 · {score === 2 ? t(['Les deux idées sont comprises.', 'You understood both ideas.', 'فهمت الفكرتين.']) : t(['Tu avances. Reviens à la question à revoir, puis réessaie.', 'You are making progress. Revisit the question to review, then retry.', 'أنت تتقدم. راجع السؤال الذي يحتاج مراجعة ثم أعد المحاولة.'])}</p>}
  </div>;
}
