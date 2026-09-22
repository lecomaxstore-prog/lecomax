"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentBlock, CourseLanguage, Lesson } from "./course/types";
import { translate } from "./course/journey";

export default function GuidedLesson({ lesson, lang, renderBlock, completed, onComplete, onNext, hasNext, saveError }: {
  lesson: Lesson; lang: CourseLanguage; renderBlock: (block: ContentBlock, key: string) => React.ReactNode;
  completed: boolean; onComplete: () => Promise<void>; onNext: () => void; hasNext: boolean; saveError: string;
}) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  // One content block per card keeps even the longest lessons approachable.
  const cards = lesson.sections.flatMap(section => section.blocks.map(block => ({ title: section.title, block })));
  const practiceStep = cards.length + 1;
  const quizStep = practiceStep + 1;
  const finishStep = quizStep + lesson.quiz.length;
  const [step, setStep] = useState(0);
  const [checks, setChecks] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const storageKey = `lecomax-guided-v1:${lesson.id}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved === "object") {
        if (Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= finishStep) setStep(saved.step);
        if (Array.isArray(saved.checks)) setChecks(saved.checks.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < lesson.exercise.steps.length));
        if (saved.answers && typeof saved.answers === "object") setAnswers(Object.fromEntries(lesson.quiz.filter(q => Number.isInteger(saved.answers[q.id]) && saved.answers[q.id] >= 0 && saved.answers[q.id] < q.options.length).map(q => [q.id, saved.answers[q.id]])));
        if (typeof saved.note === "string") setNote(saved.note.slice(0, 1500));
      }
    } catch { setStorageError(true); }
    setReady(true);
  }, [storageKey, finishStep, lesson]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ step, checks, answers, note })); }
    catch { setStorageError(true); }
  }, [ready, storageKey, step, checks, answers, note]);
  const go = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  };
  const question = step >= quizStep && step < finishStep ? lesson.quiz[step - quizStep] : null;
  const allCorrect = lesson.quiz.every(q => answers[q.id] === q.correctIndex);
  const practiced = lesson.exercise.steps.every((_, i) => checks.includes(i));
  const card = step > 0 && step < practiceStep ? cards[step - 1] : null;
  const analogy = cards.find(item => item.block.type === "callout" && item.block.tone === "analogy");
  const vocabulary = cards.filter(item => item.block.type === "vocabulary");
  const phase = step === 0 ? 0 : card ? 1 : step === practiceStep ? 2 : question ? 3 : 4;
  const phases = [t("Mission", "Mission", "المهمة"), t("Comprendre", "Understand", "افهم"), t("Essayer", "Try", "جرّب"), t("Vérifier", "Check", "تحقّق"), t("Expliquer", "Explain", "اشرح")];
  const title = step === 0 ? t("Ta mission", "Your mission", "مهمتك") : card?.title ?? (step === practiceStep ? t("À toi de construire", "Your turn to build", "حان دورك للبناء") : question ? t("Petit défi", "Quick challenge", "تحدٍّ صغير") : t("Ta victoire du jour", "Your win today", "إنجازك اليوم"));
  return <section className="min-w-0 space-y-4">
    <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-bold text-emerald-700">{t("MODE GUIDÉ", "GUIDED MODE", "التعلّم الموجّه")} · {step + 1}/{finishStep + 1}</p>
      <h2 id="academy-lesson-title" ref={heading} tabIndex={-1} className="mt-2 scroll-mt-36 text-2xl font-black outline-none">{lesson.title}</h2>
      <ol aria-label={t("Ton parcours dans cette leçon", "Your path through this lesson", "مسارك في هذا الدرس")} className="mt-4 flex flex-wrap gap-2">{phases.map((label, index) => <li key={label} aria-current={phase === index ? "step" : undefined} className={"rounded-full px-3 py-2 text-xs font-bold " + (phase === index ? "bg-emerald-700 text-white" : "bg-neutral-100 text-neutral-500")}>{index + 1}. {label}</li>)}</ol>
      <div role="progressbar" aria-label={t("Étapes de la leçon", "Lesson steps", "خطوات الدرس")} aria-valuemin={0} aria-valuemax={finishStep + 1} aria-valuenow={step + 1} className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full bg-emerald-500" style={{ width: `${(step + 1) / (finishStep + 1) * 100}%` }} /></div>
      <p className="mt-3 text-xs text-neutral-500">{t("Pas de course contre la montre. Tu peux faire une pause à chaque carte.", "No race against the clock. You can pause after any card.", "لا سباق مع الوقت. يمكنك التوقف بعد أي بطاقة.")} {storageError ? t("La sauvegarde du navigateur est indisponible.", "Browser saving is unavailable.", "حفظ المتصفح غير متاح.") : t("Cette étape est mémorisée sur ce navigateur.", "This step is remembered in this browser.", "تُحفظ هذه الخطوة في هذا المتصفح.")}</p>
    </div>
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <h3 className="mb-5 text-xl font-black">{title}</h3>
      {step === 0 && <div className="space-y-5">
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">{lesson.expectedResult}</p>
        <ul className="space-y-2">{lesson.objectives.map(item => <li key={item} className="flex gap-3 text-sm leading-6"><span className="text-emerald-600">✓</span>{item}</li>)}</ul>
        <p className="text-sm leading-6 text-neutral-600">{t("Le parcours : comprendre → observer le code → essayer → répondre → expliquer. Prévois plusieurs petites séances si nécessaire.", "The path: understand → watch the code → try → answer → explain. Split it into several short sessions when needed.", "المسار: افهم ← شاهد الكود ← جرّب ← أجب ← اشرح. قسّمه إلى جلسات قصيرة عند الحاجة.")}</p>
        <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-bold">{t("Ce qu’il faut déjà connaître", "What to know first", "ما تحتاج معرفته أولاً")}</summary><ul className="mt-3 space-y-2 text-sm text-neutral-600">{lesson.prerequisites.map(item => <li key={item}>{item}</li>)}</ul></details>
      </div>}
      {card && <div className="space-y-4">{renderBlock(card.block, lesson.id)}<p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">{t("Petite pause : comment expliquerais-tu cette carte à un ami ? Pour le code, prédis ce qui changera avant de passer à la suite.", "Tiny pause: how would you explain this card to a friend? For code, predict what will change before moving on.", "استراحة قصيرة: كيف تشرح هذه البطاقة لصديق؟ توقّع ما سيغيّره الكود قبل المتابعة.")}</p>
        <details key={step} className="rounded-xl border border-violet-200 bg-violet-50 p-4"><summary className="min-h-11 cursor-pointer font-bold text-violet-900">{t("Je suis perdu · aide-moi à comprendre", "I’m lost · help me understand", "لم أفهم · ساعدني أفهم")}</summary><div className="mt-3 space-y-4">
          {analogy && renderBlock(analogy.block, lesson.id + "-help")}
          <ol className="list-decimal space-y-2 ps-5 text-sm leading-7"><li>{t("Quel résultat veux-tu voir ? Relis seulement cet objectif :", "What result do you want to see? Read just this goal:", "ما النتيجة التي تريد رؤيتها؟ اقرأ هذا الهدف فقط:")} {lesson.expectedResult}</li><li>{t("Change une seule chose. Avant de lancer, dis ce que tu penses voir. Compare ensuite avec le résultat.", "Change one thing. Before running it, say what you expect to see. Then compare with the result.", "غيّر شيئًا واحدًا. قبل التشغيل توقّع ما ستراه، ثم قارن بالنتيجة.")}</li><li>{t("Un mot te bloque ? Ouvre le petit dictionnaire ci-dessous. Tu n’as pas besoin de tout mémoriser aujourd’hui.", "Stuck on a word? Open the small dictionary below. You do not need to memorize everything today.", "توقّفت عند كلمة؟ افتح القاموس الصغير أدناه. لا تحتاج حفظ كل شيء اليوم.")}</li></ol>
          <details className="rounded-xl border bg-white p-3"><summary className="min-h-11 cursor-pointer text-sm font-bold">{t("Les mots de cette leçon", "Words in this lesson", "كلمات هذا الدرس")}</summary><div className="space-y-3">{vocabulary.length ? vocabulary.map(item => renderBlock(item.block, lesson.id + "-words")) : <p className="text-sm leading-6">{t("Note le mot inconnu, puis cherche-le dans la recherche du cours.", "Write down the unfamiliar word, then look it up in course search.", "دوّن الكلمة غير المعروفة ثم ابحث عنها في بحث الدورة.")}</p>}</div></details>
        </div></details>
      </div>}
      {step === practiceStep && <div className="space-y-5">
        <p className="text-sm leading-7">{lesson.exercise.task}</p>
        <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-950">{t("Utilise ton projet d’entraînement. Coche chaque étape après l’avoir essayée.", "Use your practice project. Check each step after trying it.", "استخدم مشروع التدريب. علّم كل خطوة بعد تجربتها.")}</p>
        {lesson.exercise.steps.map((item, i) => <label key={i} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6"><input type="checkbox" checked={checks.includes(i)} onChange={event => setChecks(previous => event.target.checked ? [...previous, i] : previous.filter(n => n !== i))} className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" />{item}</label>)}
        <details className="rounded-xl border p-4"><summary className="cursor-pointer font-bold">{t("Un coup de pouce ?", "Need a hint?", "تحتاج تلميحًا؟")}</summary><ol className="mt-3 list-decimal space-y-2 ps-5 text-sm leading-6">{lesson.exercise.hints.map(hint => <li key={hint}>{hint}</li>)}</ol></details>
        <details className="rounded-xl border p-4"><summary className="cursor-pointer font-bold">{t("Comparer avec la solution", "Compare with the solution", "قارن مع الحل")}</summary><div className="mt-4 space-y-4"><p className="text-sm leading-6">{lesson.exercise.solution.explanation}</p>{renderBlock({ id: "guided-solution", type: "code", title: t("Solution", "Solution", "الحل"), code: { filename: lesson.exercise.solution.filename, language: lesson.exercise.solution.language, source: lesson.exercise.solution.code, annotations: [] } }, lesson.id)}</div></details>
        <details className="rounded-xl border p-4"><summary className="cursor-pointer font-bold">{t("Commandes et dépannage", "Commands and troubleshooting", "الأوامر وحل الأخطاء")}</summary><div className="mt-4 space-y-4">{lesson.commands.length > 0 && renderBlock({ id: "guided-commands", type: "code", title: "Terminal", code: { filename: "Terminal", language: "shell", source: lesson.commands.join("\n"), annotations: [] } }, lesson.id)}{lesson.commonErrors.map(error => <div key={error.symptom} className="rounded-xl bg-amber-50 p-4 text-sm leading-6"><p className="font-bold">{error.symptom}</p><p>{error.cause}</p><p className="mt-2 text-emerald-800">→ {error.fix}</p></div>)}</div></details>
      </div>}
      {question && <fieldset><legend className="text-lg font-bold leading-7">{question.question}</legend><div className="mt-4 space-y-3">{question.options.map((option, i) => <label key={i} className={"flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-6 " + (answers[question.id] === i ? "border-emerald-400 bg-emerald-50" : "border-neutral-200")}><input type="radio" name={question.id} checked={answers[question.id] === i} onChange={() => setAnswers(previous => ({ ...previous, [question.id]: i }))} className="mt-1 h-4 w-4 shrink-0 accent-emerald-600" />{option}</label>)}</div>{answers[question.id] !== undefined && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-7"><strong>{answers[question.id] === question.correctIndex ? t("Bien joué ! ", "Nice work! ", "أحسنت! ") : t("Essaie encore, tu peux y arriver. ", "Try again, you can work this out. ", "حاول مجدداً، يمكنك فهمها. ")}</strong>{question.answerExplanations[answers[question.id]]}</p>}</fieldset>}
      {step === finishStep && <div className="space-y-5">
        <p className="text-4xl" aria-hidden="true">{completed ? "🏆" : "🌟"}</p>
        <ul className="space-y-3 text-sm leading-7">{lesson.recap.map(item => <li key={item}>✓ {item}</li>)}</ul>
        <label className="block text-sm font-bold">{t("Explique avec tes mots : ce que j’ai construit, comment ça marche, ce que je veux revoir.", "In your own words: what I built, how it works, what I want to revisit.", "بكلماتك: ماذا بنيت، كيف يعمل، وما الذي أريد مراجعته.")}<textarea value={note} maxLength={1500} onChange={event => setNote(event.target.value)} rows={4} className="mt-3 w-full rounded-xl border border-neutral-300 p-3 text-base font-normal" /></label>
        {!practiced && <button onClick={() => go(practiceStep)} className="min-h-11 text-sm font-bold text-emerald-800 underline">{t("Revenir à l’exercice", "Return to the exercise", "عد إلى التمرين")}</button>}
        {!allCorrect && <button onClick={() => go(quizStep + lesson.quiz.findIndex(q => answers[q.id] !== q.correctIndex))} className="min-h-11 text-sm font-bold text-emerald-800 underline">{t("Revoir les questions", "Review the questions", "راجع الأسئلة")}</button>}
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <button disabled={completed || saving || !practiced || !allCorrect || !note.trim()} onClick={async () => { setSaving(true); try { await onComplete(); } finally { setSaving(false); } }} className="block min-h-12 w-full rounded-xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-50">{completed ? t("Mission terminée · 25 XP ✓", "Mission complete · 25 XP ✓", "اكتملت المهمة · 25 نقطة ✓") : saving ? t("Enregistrement…", "Saving…", "جارٍ الحفظ…") : t("J’ai pratiqué et compris · terminer", "I practiced and understood · finish", "تدرّبت وفهمت · إنهاء")}</button>
        {!completed && <p className="text-xs leading-5 text-neutral-500">{t("Pour terminer : essaie chaque étape, réponds aux questions et écris ta petite explication.", "To finish: try every exercise step, answer the questions and write your short explanation.", "للإنهاء: جرّب كل خطوة، أجب عن الأسئلة، واكتب شرحك القصير.")}</p>}
        {completed && hasNext && <button onClick={onNext} className="min-h-12 w-full rounded-xl border border-emerald-300 p-3 font-bold text-emerald-800">{t("Mission suivante →", "Next mission →", "المهمة التالية ←")}</button>}
      </div>}
    </div>
    <nav aria-label={t("Étapes", "Steps", "الخطوات")} className="flex gap-3"><button disabled={step === 0 || !ready} onClick={() => go(step - 1)} className="min-h-12 flex-1 rounded-xl border bg-white p-3 font-bold disabled:opacity-30">{t("Retour", "Back", "رجوع")}</button>{step < finishStep && <button disabled={!ready || (question !== null && answers[question.id] !== question.correctIndex)} onClick={() => go(step + 1)} className="min-h-12 flex-1 rounded-xl bg-neutral-950 p-3 font-bold text-white disabled:opacity-40">{t("Continuer", "Continue", "متابعة")} →</button>}</nav>
  </section>;
}
