'use client';
import { useRef, useState } from 'react';
import type { CourseLanguage } from '../course/types';
import { text, type Text, type Lesson } from './types';
import { matchesAnswer, recordReview, type Progress } from './progress';
import { analogies } from './coaching';
import ReadingCoach from './ReadingCoach';
import LessonQuiz from './LessonQuiz';
import LessonMap from './LessonMap';
import MiniLab from './MiniLab';
import { labForLesson } from './practice';
import styles from './Learning.module.css';

const steps: Text[] = [
  ['Comprendre', 'Understand', 'افهم'], ['Lire le code', 'Read code', 'اقرأ الكود'],
  ['Pratiquer', 'Practise', 'تدرب'], ['Quiz', 'Quiz', 'اختبار'],
];

export default function LessonViewer({ lesson, lang, progress, update, next, onNext, onHome }: {
  lesson: Lesson; lang: CourseLanguage; progress: Progress; update: (change: Partial<Progress>) => void;
  next?: Lesson; onNext: () => void; onHome: () => void;
}) {
  const t = (value: Text) => text(value, lang);
  const [step, setStep] = useState(progress.lessonSteps[lesson.id] ?? 0);
  const [attempt, setAttempt] = useState(progress.drafts[lesson.id] ?? '');
  const [feedback, setFeedback] = useState<'ok' | 'retry' | null>(null);
  const [help, setHelp] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const exerciseDone = progress.exercises.includes(lesson.id);
  const readyToComplete = exerciseDone && progress.quizzes[lesson.id] === 2;
  const completed = progress.completed.includes(lesson.id);
  const lab = labForLesson[lesson.id];

  function goTo(value: number) {
    setStep(value);
    update({ lessonSteps: { ...progress.lessonSteps, [lesson.id]: value } });
    requestAnimationFrame(() => {
      title.current?.focus({ preventScroll: true });
      title.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function review() { update({ struggles: [...new Set([...progress.struggles, lesson.id])] }); }
  function checkExercise() {
    const correct = matchesAnswer(attempt, lesson.answer);
    setFeedback(correct ? 'ok' : 'retry');
    update({ exercises: correct ? [...new Set([...progress.exercises, lesson.id])] : progress.exercises.filter(id => id !== lesson.id), struggles: correct ? progress.struggles : [...new Set([...progress.struggles, lesson.id])] });
  }
  function recordQuiz(score: number | null) {
    const quizzes = { ...progress.quizzes };
    if (score === null) delete quizzes[lesson.id];
    else quizzes[lesson.id] = score;
    update({ quizzes, ...(score === null ? {} : { reviews: { ...progress.reviews, [lesson.id]: recordReview(progress.reviews[lesson.id], score === 2) } }), struggles: score === null ? progress.struggles : score === 2 ? progress.struggles.filter(id => id !== lesson.id) : [...new Set([...progress.struggles, lesson.id])] });
  }
  return <article className={styles.lesson} data-learning-lesson={lesson.id}>
    <div className={styles.lessonTop}><button type="button" onClick={onHome}>← {t(['Mon parcours', 'My path', 'مساري'])}</button><span>≈ {lesson.minutes} min</span></div>
    <p className={styles.eyebrow}>{t(['UNE IDÉE À LA FOIS', 'ONE IDEA AT A TIME', 'فكرة واحدة كل مرة'])}</p>
    <h2>{t(lesson.title)}</h2>
    <p className={styles.muted}>{t(['Lis, essaie, puis vérifie. Tu peux revenir en arrière à tout moment.', 'Read, try, then check. You can go back at any time.', 'اقرأ وجرب ثم تحقق. يمكنك الرجوع في أي وقت.'])}</p>
    <nav className={styles.lessonSteps} aria-label={t(['Étapes de la leçon', 'Lesson steps', 'خطوات الدرس'])}>
      {steps.map((label, index) => <button type="button" key={index} aria-current={step === index ? 'step' : undefined} onClick={() => goTo(index)}><span>{index + 1}</span>{t(label)}</button>)}
    </nav>
    <h3 className={styles.stageTitle} ref={title} tabIndex={-1}>{step + 1}. {t(steps[step])}</h3>
    <div hidden={step !== 0}>
      <p className={styles.lessonGoal}>{t(lesson.goal)}</p>
      <div className={styles.keyIdea}><p className={styles.eyebrow}>{t(['L’IDÉE À RETENIR', 'THE KEY IDEA', 'الفكرة الأساسية'])}</p><p>{t(lesson.simple)}</p></div>
      <h4>{t(['Pourquoi dans mon site ?', 'Why in my site?', 'لماذا في موقعي؟'])}</h4><p>{t(lesson.why)}</p>
      <LessonMap id={lesson.id} lang={lang} />
      <details><summary>{t(['Et sur un autre site ?', 'What about another site?', 'وماذا عن موقع آخر؟'])}</summary><p>{t(lesson.transfer)}</p></details>
    </div>
    <div hidden={step !== 1}><ReadingCoach lesson={lesson} lang={lang} /></div>
    <div hidden={step !== 2}>
      <p>{t(['Une petite réponse suffit. Tu peux consulter le code ou demander un indice.', 'One small answer is enough. You can review the code or ask for a hint.', 'تكفي إجابة صغيرة. يمكنك مراجعة الكود أو طلب تلميح.'])}</p>
      <label className={styles.exercisePrompt}>{t(lesson.task)}<input value={attempt} maxLength={180} onChange={event => { setAttempt(event.target.value); setFeedback(null); update({ drafts: { ...progress.drafts, [lesson.id]: event.target.value }, exercises: progress.exercises.filter(id => id !== lesson.id) }); }} autoCapitalize="off" autoCorrect="off" spellCheck={false} dir="ltr" placeholder={t(['Écris ton essai ici…', 'Write your attempt here…', 'اكتب محاولتك هنا…'])} /></label>
      <div className={styles.actions}><button type="button" className={styles.primary} disabled={!attempt.trim()} onClick={checkExercise}>{t(['Vérifier mon essai', 'Check my attempt', 'تحقق من محاولتي'])}</button><button type="button" onClick={() => goTo(1)}>{t(['Revoir le code', 'Review the code', 'راجع الكود'])}</button></div>
      <details><summary>{t(['Donne-moi un indice', 'Give me a hint', 'أعطني تلميحا'])}</summary><p>{t(lesson.hint)}</p></details>
      {feedback && <div className={styles.quizFeedback} role="status" data-correct={feedback === 'ok'}><strong>{feedback === 'ok' ? t(['✓ Tu as trouvé.', '✓ You found it.', '✓ وجدتها.']) : t(['On y va doucement.', 'Let’s take it slowly.', 'لنأخذ الأمر بهدوء.'])}</strong><p>{t(feedback === 'ok' ? lesson.simple : lesson.hint)}</p></div>}
      {feedback === 'retry' && <details><summary>{t(['Voir une réponse expliquée', 'See an explained answer', 'شاهد إجابة مشروحة'])}</summary><pre dir="ltr" tabIndex={0}><code>{lesson.answer[0]}</code></pre><p>{t(lesson.simple)}</p><p>{t(['Referme la réponse et essaie de la retrouver toi-même.', 'Close the answer and try to recall it yourself.', 'أغلق الإجابة وحاول تذكرها بنفسك.'])}</p></details>}
      {exerciseDone && !feedback && <p className={styles.muted}>{t(['✓ Tu as déjà réussi cet exercice. Tu peux t’entraîner à nouveau.', '✓ You already passed this exercise. You can practise again.', '✓ نجحت في هذا التمرين سابقا. يمكنك التدرب مجددا.'])}</p>}
      {lab && <details className={styles.optionalLab}><summary>{t(['Pour pratiquer davantage : modifier un exemple', 'Extra practice: edit an example', 'تدريب إضافي: عدّل مثالا'])}</summary><MiniLab kind={lab} lang={lang} /></details>}
    </div>
    <div hidden={step !== 3}>
      <LessonQuiz savedScore={progress.quizzes[lesson.id]} lesson={lesson} lang={lang} onResult={recordQuiz} />
      <div className={styles.completion}>
        <h4>{t(['Ce que tu sais maintenant', 'What you now know', 'شنو تعلمنا؟'])}</h4><p>{t(lesson.goal)}</p>
        {next && <p className={styles.muted}>{t(['Ensuite : ', 'Next: ', 'من بعد: '])}{t(next.goal)}</p>}
        <ul><li>{exerciseDone ? '✓' : '○'} {t(['Petit exercice', 'Small exercise', 'تمرين صغير'])}</li><li>{progress.quizzes[lesson.id] === 2 ? '✓' : '○'} {t(['Les deux idées du quiz', 'Both quiz ideas', 'فكرتا الاختبار'])}</li></ul>
        {!readyToComplete && !completed && <p className={styles.muted}>{t(['Pour valider cette leçon, termine l’exercice et retrouve les deux réponses du quiz. Les autres leçons restent accessibles.', 'To complete this lesson, finish the exercise and find both quiz answers. Other lessons remain available.', 'لإكمال الدرس أنه التمرين وأجب عن السؤالين. تبقى الدروس الأخرى متاحة.'])}</p>}
        <button type="button" className={styles.primary} disabled={!readyToComplete || completed} onClick={() => update({ completed: [...new Set([...progress.completed, lesson.id])] })}>{completed ? t(['Leçon terminée ✓', 'Lesson completed ✓', 'اكتمل الدرس ✓']) : t(['J’ai compris · terminer la leçon', 'I understand · finish lesson', 'فهمت · إنهاء الدرس'])}</button>
        {!exerciseDone && <button type="button" onClick={() => goTo(2)}>{t(['Revenir à l’exercice', 'Return to the exercise', 'ارجع إلى التمرين'])}</button>}
      </div>
    </div>
    {progress.reviews[lesson.id]?.misses >= 2 && <p className={styles.note}>{t(['On reprend avec une image simple. Relis une seule ligne, puis essaie à nouveau.', 'Let’s use a simple picture. Reread one line, then try again.', 'ناخدوها بشوية: قرا غير سطر واحد مع المثال البسيط، ومن بعد عاود جرب.'])}</p>}
    {progress.reviews[lesson.id]?.successes >= 2 && <details className={styles.note}><summary>{t(['Un petit pas de plus ?', 'One small step further?', 'نجربو خطوة زايدة؟'])}</summary><p>{t(lesson.transfer)}</p><p>{t(['Sans regarder la solution, explique ce que tu réutiliserais et ce qui changerait.', 'Without looking at the solution, explain what you would reuse and what would change.', 'بلا ما تشوف الحل، شرح شنو غادي تعاود تستعمل وشنو غادي تبدل.'])}</p></details>}
    <aside className={styles.lessonHelp}>
      <button type="button" aria-expanded={help} onClick={() => { setHelp(value => !value); if (!help) review(); }}>{t(['Besoin d’une explication plus simple ?', 'Need a simpler explanation?', 'تحتاج شرحا أبسط؟'])}</button>
      {help && <div role="status"><p>{t(analogies[lesson.id])}</p><LessonMap id={lesson.id} lang={lang} /><button type="button" onClick={() => goTo(1)}>{t(['Relire une ligne à la fois', 'Read one line at a time', 'اقرأ سطرا كل مرة'])}</button></div>}
    </aside>
    <footer className={styles.lessonFooter}>
      {step > 0 && <button type="button" onClick={() => goTo(step - 1)}>{t(['Précédent', 'Back', 'السابق'])}</button>}
      {step < 3 ? <button type="button" className={styles.primary} onClick={() => goTo(step + 1)}>{t(steps[step + 1])} →</button>
        : next ? <button type="button" onClick={onNext}>{t(['Leçon suivante', 'Next lesson', 'الدرس التالي'])}<small>{t(next.title)}</small></button>
          : <a href={`#academy/${lesson.module}`}>{t(['Continuer avec le cours complet', 'Continue with the full course', 'تابع الدورة الكاملة'])} →</a>}
    </footer>
  </article>;
}
