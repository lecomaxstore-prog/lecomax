"use client";
import { useEffect, useRef, useState } from 'react';
import type { CourseLanguage } from './course/types';
import { STARTER_KEY, STARTER_LESSONS, readStarterProgress, words, type StarterProgress, type Words } from './course/beginner-path';
import styles from './BeginnerJourney.module.css';
import { STARTER_PRACTICE, checkStarterCode } from './course/beginner-practice';

export default function BeginnerJourney({ lang, onNavigate }: { lang: CourseLanguage; onNavigate: (tab: string) => void }) {
  const t = (value: Words) => words(value, lang);
  const [progress, setProgress] = useState<StarterProgress>(() => readStarterProgress(null));
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [stage, setStage] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeChecked, setCodeChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [name, setName] = useState('L’ecomax');
  const [color, setColor] = useState('#ecfdf5');
  const [padding, setPadding] = useState(24);
  const [quantity, setQuantity] = useState(1);
  const [route, setRoute] = useState('');
  const [offline, setOffline] = useState(false);
  const [request, setRequest] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const heading = useRef<HTMLHeadingElement>(null);
  const syllabus = useRef<HTMLDetailsElement>(null);
  const lesson = STARTER_LESSONS[progress.selected];
  const practice = STARTER_PRACTICE[lesson.id];
  const codePassed = codeChecked && checkStarterCode(practice, codeInput);
  const passed = checked && answer === lesson.correct;
  const done = progress.completed.includes(lesson.id);
  const canCheck = done || (interacted && codePassed);
  const allDone = progress.completed.length === STARTER_LESSONS.length;

  useEffect(() => {
    if (!syllabus.current) return;
    const media = window.matchMedia('(min-width: 900px)');
    const update = () => { if (syllabus.current) syllabus.current.open = media.matches; };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    try { setProgress(readStarterProgress(JSON.parse(localStorage.getItem(STARTER_KEY) || 'null'))); }
    catch { setStorageError(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (request !== 'loading') return;
    const timer = setTimeout(() => { setRequest(offline ? 'error' : 'success'); setInteracted(true); }, 650);
    return () => clearTimeout(timer);
  }, [request, offline]);
  function save(next: StarterProgress) {
    setProgress(next);
    try { localStorage.setItem(STARTER_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  function focusLesson() { requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }); }
  function select(index: number) {
    save({ ...progress, selected: index }); setStage(0); setAnswer(null); setChecked(false); setInteracted(false); setRequest('idle');
    setCodeInput(''); setCodeChecked(false); setShowSolution(false);
    setName('L’ecomax'); setColor('#ecfdf5'); setPadding(24); setQuantity(1); setRoute(''); setOffline(false); focusLesson();
  }
  function go(index: number) { if (index === 2 && !canCheck) return; setStage(index); focusLesson(); }
  function complete() {
    if (!passed || !canCheck) return;
    save({ ...progress, completed: [...new Set([...progress.completed, lesson.id])] });
  }
  const title = t(lesson.title);
  const dynamicCode = lesson.experiment === 'style' ? `.card {\n  background: ${color};\n  padding: ${padding}px;\n}`
    : lesson.id === 'html' ? `<h1>${name.replace(/[<>]/g, '')}</h1>\n<p>Welcome to my shop.</p>`
    : lesson.id === 'javascript' ? `const price = 100;\nconst quantity = ${quantity};\nconst total = price * quantity;`
    : lesson.code;

  return <div className={styles.shell} dir={lang === 'ar' ? 'rtl' : 'ltr'} data-beginner-journey>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>{t(['TON PARCOURS, DEPUIS ZÉRO', 'YOUR PATH, FROM THE BEGINNING', 'رحلتك من البداية'])}</p>
        <h2>{t(['Comprendre. Essayer.\nConstruire ton site.', 'Understand. Try.\nBuild your website.', 'افهم. جرب.\nابنِ موقعك.'])}</h2>
        <p className={styles.intro}>{t(['Tu n’as pas besoin de tout connaître pour commencer. Apprends une idée à la fois, vois ce qu’elle change et explique-la avec tes mots.', 'You do not need to know everything to start. Learn one idea at a time, see what it changes, and explain it in your own words.', 'لا تحتاج إلى معرفة كل شيء لتبدأ. تعلم فكرة واحدة كل مرة وشاهد أثرها واشرحها بكلماتك.'])}</p>
        <button type="button" disabled={!ready} className={styles.heroButton} onClick={focusLesson}>{!ready ? t(['Préparation…', 'Preparing…', 'جارٍ التحضير…']) : t([progress.completed.length ? 'Reprendre ma leçon' : 'Commencer ma première leçon', progress.completed.length ? 'Continue my lesson' : 'Start my first lesson', progress.completed.length ? 'متابعة درسي' : 'ابدأ درسي الأول'])}<span aria-hidden="true">{lang === 'ar' ? '←' : '→'}</span></button>
      </div>
      <div className={styles.plan}><span>{t(['UNE MÉTHODE SIMPLE', 'A SIMPLE METHOD', 'طريقة بسيطة'])}</span><ol>
        {([['01', ['Comprendre', 'Understand', 'افهم'], ['Une idée et un exemple concret.', 'One idea and a concrete example.', 'فكرة ومثال واضح.']], ['02', ['Essayer', 'Try', 'جرب'], ['Change quelque chose et observe.', 'Change something and observe.', 'غير شيئًا وشاهد النتيجة.']], ['03', ['Vérifier', 'Check', 'تحقق'], ['Une question, puis une explication.', 'One question, then an explanation.', 'سؤال ثم شرح.']]] as [string, Words, Words][]).map(([number, label, detail]) => <li key={number}><b>{number}</b><div><strong>{t(label)}</strong><p>{t(detail)}</p></div></li>)}
      </ol><p>{t(['Environ 10–15 min par leçon. Continue quand tu es prêt ; tu peux toujours revenir.', 'About 10–15 min per lesson. Continue when ready; you can always come back.', 'حوالي 10–15 دقيقة للدرس. تابع عندما تكون جاهزًا ويمكنك العودة دائمًا.'])}</p></div>
    </header>

    <div className={styles.progress}><div><strong>{t(['Mes bases', 'My foundations', 'أساسياتي'])}</strong><span>{progress.completed.length} / {STARTER_LESSONS.length} {t(['leçons vérifiées', 'lessons checked', 'دروس تم التحقق منها'])}</span></div><progress max={STARTER_LESSONS.length} value={progress.completed.length} aria-label={t(['Progression des bases', 'Foundation progress', 'تقدم الأساسيات'])} /></div>
    <div className={styles.layout}>
      <aside className={styles.syllabus}>
        <details ref={syllabus}><summary>{t(['Mon parcours en 10 étapes', 'My path in 10 steps', 'رحلتي في 10 خطوات'])}<span>{progress.selected + 1}/10</span></summary><nav aria-label={t(['Les leçons pour débuter', 'Beginner lessons', 'دروس المبتدئين'])}>{STARTER_LESSONS.map((item, index) => <button disabled={!ready} type="button" key={item.id} aria-current={index === progress.selected ? 'step' : undefined} onClick={() => select(index)}><span className={styles.lessonNumber} data-done={progress.completed.includes(item.id)}>{progress.completed.includes(item.id) ? '✓' : String(index + 1).padStart(2, '0')}</span><span>{t(item.title)}<small>{index < 4 ? t(['Les bases', 'The basics', 'الأساسيات']) : index < 7 ? t(['Construire l’interface', 'Build the interface', 'بناء الواجهة']) : t(['Connecter et publier', 'Connect and publish', 'الربط والنشر'])}</small></span></button>)}</nav></details>
        <div className={styles.help}><strong>{t(['Tu peux prendre ton temps.', 'You can take your time.', 'يمكنك أن تأخذ وقتك.'])}</strong><p>{t(['Si une idée n’est pas claire, refais l’exemple. Le but est de pouvoir expliquer ce qui change, pas de mémoriser chaque ligne.', 'If an idea is unclear, try the example again. Aim to explain what changes, rather than memorize every line.', 'إذا لم تتضح فكرة فأعد المثال. الهدف شرح ما يتغير وليس حفظ كل سطر.'])}</p></div>
      </aside>
      <section className={styles.reader} aria-busy={!ready}>
        <div className={styles.lessonHeader}><p>{t(['LEÇON', 'LESSON', 'الدرس'])} {String(progress.selected + 1).padStart(2, '0')} <span> / 10 · {t(['LES FONDATIONS', 'FOUNDATIONS', 'الأساسيات'])}</span></p><h2 ref={heading} tabIndex={-1}>{title}</h2><p className={styles.goal}>{t(lesson.goal)}</p></div>
        <nav className={styles.stages} aria-label={t(['Étapes de cette leçon', 'Steps in this lesson', 'خطوات هذا الدرس'])}>{([['Comprendre', 'Understand', 'افهم'], ['Essayer', 'Try', 'جرب'], ['Vérifier', 'Check', 'تحقق']] as Words[]).map((label, index) => <button type="button" key={index} disabled={!ready || (index === 2 && !canCheck)} aria-current={stage === index ? 'step' : undefined} onClick={() => go(index)}><span>{index + 1}</span>{t(label)}</button>)}</nav>
        <div className={styles.body}>
          {stage === 0 && <div className={styles.flow}>
            <p className={styles.idea}>{t(lesson.idea)}</p><div className={styles.analogy}><span>{t(['IMAGINE…', 'IMAGINE…', 'تخيل…'])}</span><p>{t(lesson.analogy)}</p></div>
            <div className={styles.term}><strong dir="ltr">{lesson.term}</strong><p>{t(lesson.definition)}</p></div>
            <details className={styles.connection}><summary>{t(['Où retrouver cette idée dans mon site ?', 'Where is this idea in my website?', 'أين أجد هذه الفكرة في موقعي؟'])}</summary><p>{t(['Après l’exercice, ouvre ce fichier dans la bibliothèque de code pour voir un exemple réel.', 'After the exercise, open this file in the code library to see a real example.', 'بعد التمرين افتح هذا الملف في مكتبة الكود لرؤية مثال حقيقي.'])}</p><a href={`#files/${encodeURIComponent(lesson.file)}`} dir="ltr">{lesson.file} ↗</a></details>
            <button disabled={!ready} type="button" className={styles.primary} onClick={() => go(1)}>{t(['Voir et essayer', 'See it and try', 'شاهد وجرب'])} <span aria-hidden="true">{lang === 'ar' ? '←' : '→'}</span></button>
          </div>}
          {stage === 1 && <div className={styles.flow}>
            <div><h3>{t(['À toi de jouer', 'Your turn', 'دورك الآن'])}</h3><p>{t(lesson.task)}</p><small className={styles.muted}>{t(['Ce laboratoire est une simulation. Il ne modifie aucun produit ni aucune commande.', 'This lab is a simulation. It does not change any product or order.', 'هذا المختبر محاكاة ولا يغير أي منتج أو طلب.'])}</small></div>
            <div className={styles.lab}>
              {(lesson.experiment === 'text' || lesson.experiment === 'style') && <>
                <div className={styles.labControls}>{lesson.experiment === 'text' ? <label htmlFor="starter-name">{t(['Texte à afficher', 'Text to display', 'النص المعروض'])}<input id="starter-name" maxLength={60} value={name} onChange={event => { setName(event.target.value); setInteracted(true); }} /></label> : <><label htmlFor="starter-color">{t(['Couleur de fond', 'Background color', 'لون الخلفية'])}<select id="starter-color" value={color} onChange={event => { setColor(event.target.value); setInteracted(true); }}><option value="#ecfdf5">{t(['Menthe', 'Mint', 'نعناعي'])}</option><option value="#eff6ff">{t(['Bleu', 'Blue', 'أزرق'])}</option><option value="#fff7ed">{t(['Pêche', 'Peach', 'خوخي'])}</option></select></label><label htmlFor="starter-space">{t(['Espace intérieur', 'Inside spacing', 'المسافة الداخلية'])}: {padding}px<input id="starter-space" type="range" min="8" max="48" step="8" value={padding} onChange={event => { setPadding(Number(event.target.value)); setInteracted(true); }} /></label></>}</div>
                <div className={styles.preview}><span>{t(['RÉSULTAT VISIBLE', 'VISIBLE RESULT', 'النتيجة المرئية'])}</span><div className={styles.product} style={{ background: color, padding }}><div className={styles.productArt} aria-hidden="true">L.</div><h3>{lesson.experiment === 'text' ? name || '…' : t(['Mon produit', 'My product', 'منتجي'])}</h3><p>100 MAD</p></div></div>
              </>}
              {lesson.experiment === 'quantity' && <div className={styles.counter}><span>{t(['Prix par article', 'Price per item', 'سعر القطعة'])}: 100 MAD</span><div><button type="button" disabled={quantity <= 1} aria-label={t(['Diminuer la quantité', 'Decrease quantity', 'تقليل الكمية'])} onClick={() => { setQuantity(value => value - 1); setInteracted(true); }}>−</button><output aria-live="polite">{quantity}</output><button type="button" disabled={quantity >= 9} aria-label={t(['Augmenter la quantité', 'Increase quantity', 'زيادة الكمية'])} onClick={() => { setQuantity(value => value + 1); setInteracted(true); }}>+</button></div><strong aria-live="polite">100 × {quantity} = {100 * quantity} MAD</strong></div>}
              {lesson.experiment === 'request' && <div className={styles.request}><ol><li>{t(['Navigateur', 'Browser', 'المتصفح'])}</li><li>API</li><li>{t(['Serveur', 'Server', 'الخادم'])}</li></ol><label><input type="checkbox" checked={offline} disabled={request === 'loading'} onChange={event => { setOffline(event.target.checked); setRequest('idle'); }} />{t(['Simuler un serveur indisponible', 'Simulate an unavailable server', 'محاكاة خادم غير متاح'])}</label><button type="button" className={styles.secondary} disabled={request === 'loading'} onClick={() => { setRequest('loading'); }}>{t(['Envoyer la demande', 'Send request', 'أرسل الطلب'])}</button><p role="status" data-state={request}>{request === 'loading' ? t(['Chargement : on attend la réponse…', 'Loading: waiting for a response…', 'التحميل: ننتظر الرد…']) : request === 'success' ? t(['Réponse reçue : 1 produit, prix 100 MAD.', 'Response received: 1 product, price 100 MAD.', 'وصل الرد: منتج واحد بسعر 100 درهم.']) : request === 'error' ? t(['Le serveur est indisponible. Décoche la simulation et réessaie.', 'The server is unavailable. Uncheck the simulation and retry.', 'الخادم غير متاح. ألغِ المحاكاة وأعد المحاولة.']) : t(['Prêt à envoyer une demande.', 'Ready to send a request.', 'جاهز لإرسال الطلب.'])}</p></div>}
              {lesson.experiment === 'route' && <div className={styles.route}><label htmlFor="starter-route">{t(['Choisis une page', 'Choose a page', 'اختر صفحة'])}<select id="starter-route" value={route} onChange={event => { setRoute(event.target.value); setInteracted(true); }}><option value="">{t(['Accueil', 'Home', 'الرئيسية'])}</option><option value="boutique">{t(['Boutique', 'Shop', 'المتجر'])}</option><option value="nouveautes">{t(['Nouveautés', 'New arrivals', 'الجديد'])}</option></select></label><div><span>{t(['Adresse', 'Address', 'العنوان'])}</span><code dir="ltr">/{route}</code><span>{t(['Fichier', 'File', 'الملف'])}</span><code dir="ltr">app/{route ? `${route}/` : ''}page.tsx</code></div></div>}
            </div>
            <div className={styles.observation}><h3>{t(['Ce qui se passe', 'What happens', 'ماذا يحدث'])}</h3><p>{t(lesson.observe)}</p></div>
            <details className={styles.code}><summary>{t(['Comprendre chaque ligne du code', 'Understand each line of code', 'فهم كل سطر في الكود'])}</summary><p>{t(['Extrait pédagogique : il montre une idée, pas une page complète à copier.', 'Learning excerpt: it shows one idea, rather than a complete page to copy.', 'مقتطف تعليمي يوضح فكرة وليس صفحة كاملة للنسخ.'])}</p><pre dir="ltr" tabIndex={0}><code>{dynamicCode}</code></pre><ol>{lesson.lines.map((line, index) => <li key={index}><span>{index + 1}</span><p>{t(line)}</p></li>)}</ol></details>
            <section className={styles.codingTask} aria-labelledby="starter-code-title">
              <p className={styles.eyebrow}>{t(['PETIT DÉFI DE CODE', 'SMALL CODING CHALLENGE', 'تحدي برمجة صغير'])}</p>
              <h3 id="starter-code-title">{t(['Complète le morceau manquant', 'Fill in the missing piece', 'أكمل الجزء الناقص'])}</h3>
              <label htmlFor="starter-code-input">{t(practice.prompt)}</label>
              <p id="starter-code-help" className={styles.muted}>{t(['Remplace ___ par ta réponse dans le champ ci-dessous. Majuscules et minuscules comptent.', 'Replace ___ with your answer in the field below. Uppercase and lowercase letters matter.', 'استبدل ___ بإجابتك في الحقل أدناه. الأحرف الكبيرة والصغيرة مهمة.'])}</p>
              <pre dir="ltr" tabIndex={0}><code>{practice.before}<mark>{codeInput || '___'}</mark>{practice.after}</code></pre>
              <form onSubmit={event => { event.preventDefault(); if (codeInput.trim()) setCodeChecked(true); }}>
                <input id="starter-code-input" dir="ltr" type="text" maxLength={40} value={codeInput} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="starter-code-help starter-code-feedback" aria-invalid={codeChecked && !codePassed ? true : undefined} onChange={event => { setCodeInput(event.target.value); setCodeChecked(false); setChecked(false); }} />
                <button type="submit" className={styles.secondary} disabled={!codeInput.trim()}>{t(['Vérifier mon code', 'Check my code', 'تحقق من كودي'])}</button>
              </form>
              <div id="starter-code-feedback" role="status" aria-live="polite">{codeChecked && <div className={styles.feedback} data-correct={codePassed}><strong>{codePassed ? t(['Le code est correct.', 'The code is correct.', 'الكود صحيح.']) : t(['Encore un petit ajustement.', 'One small adjustment to make.', 'نحتاج إلى تعديل بسيط.'])}</strong><p>{t(codePassed ? practice.explanation : practice.hint)}</p></div>}</div>
              <details key={lesson.id} className={styles.codingHint}><summary>{t(['J’ai besoin d’un indice', 'I need a hint', 'أحتاج إلى تلميح'])}</summary><p>{t(practice.hint)}</p>{!showSolution ? <button type="button" className={styles.textButton} onClick={() => setShowSolution(true)}>{t(['Voir la solution expliquée', 'See the explained solution', 'شاهد الحل مع الشرح'])}</button> : <div><code dir="ltr">{practice.answer}</code><p>{t(practice.explanation)}</p><p className={styles.muted}>{t(['Retape la réponse pour t’entraîner, puis vérifie ton code.', 'Type the answer yourself to practice, then check your code.', 'اكتب الإجابة بنفسك للتدرب ثم تحقق من كودك.'])}</p></div>}</details>
            </section>
            <ul className={styles.practiceChecklist} aria-label={t(['Avant la question', 'Before the question', 'قبل السؤال'])}>
              <li data-ready={interacted}><span aria-hidden="true">{interacted ? '✓' : '○'}</span>{t(interacted ? ['Exemple essayé', 'Example tried', 'جربت المثال'] : ['Essaie l’exemple ci-dessus', 'Try the example above', 'جرب المثال أعلاه'])}</li>
              <li data-ready={codePassed}><span aria-hidden="true">{codePassed ? '✓' : '○'}</span>{t(codePassed ? ['Code vérifié', 'Code checked', 'تحققت من الكود'] : ['Complète et vérifie ton code', 'Complete and check your code', 'أكمل كودك وتحقق منه'])}</li>
            </ul>
            <button type="button" className={styles.primary} disabled={!canCheck} onClick={() => go(2)}>{t(['Vérifier ma compréhension', 'Check my understanding', 'تحقق من فهمي'])}</button>
          </div>}
          {stage === 2 && <div className={styles.flow}>
            <fieldset className={styles.quiz}><legend>{t(lesson.question)}</legend>{lesson.options.map((option, index) => <label key={index} data-selected={answer === index}><input type="radio" name={`starter-${lesson.id}`} checked={answer === index} onChange={() => { setAnswer(index); setChecked(false); }} /><span>{t(option)}</span></label>)}</fieldset>
            <button type="button" className={styles.primary} disabled={answer === null} onClick={() => setChecked(true)}>{t(['Vérifier ma réponse', 'Check my answer', 'تحقق من إجابتي'])}</button>
            {checked && <div className={styles.feedback} role="status" data-correct={passed}><strong>{passed ? t(['Oui, tu as compris cette idée.', 'Yes, you understood this idea.', 'نعم، فهمت هذه الفكرة.']) : t(['Pas encore. Reprenons ensemble.', 'Not yet. Let’s work through it.', 'ليس بعد. لنراجع معًا.'])}</strong><p>{t(practice.answerFeedback[answer!])}</p><p>{t(lesson.feedback)}</p>{!passed && <button type="button" className={styles.secondary} onClick={() => go(1)}>{t(['Revoir l’exemple', 'Review the example', 'مراجعة المثال'])}</button>}</div>}
            {passed && <><label className={styles.note} htmlFor="starter-note">{t(['Avec mes mots (facultatif)', 'In my own words (optional)', 'بكلماتي (اختياري)'])}<span>{t(['Explique ce que tu viens de comprendre. Tes notes restent dans ce navigateur.', 'Explain what you just understood. Your notes stay in this browser.', 'اشرح ما فهمته للتو. تبقى ملاحظاتك في هذا المتصفح.'])}</span><textarea id="starter-note" maxLength={2000} rows={3} value={progress.notes[lesson.id] || ''} onChange={event => save({ ...progress, notes: { ...progress.notes, [lesson.id]: event.target.value } })} /></label>{!done ? <button type="button" className={styles.primary} onClick={complete}>{t(['Valider cette leçon', 'Complete this lesson', 'إكمال الدرس'])} ✓</button> : <div className={styles.success} role="status"><strong>{allDone ? t(['Tes premières bases sont en place.', 'Your first foundations are in place.', 'أصبحت أساسياتك الأولى جاهزة.']) : t(['Leçon validée. Bien joué !', 'Lesson completed. Well done!', 'أكملت الدرس. أحسنت!'])}</strong><p>{t(['Tu peux continuer maintenant ou revenir plus tard. Pratique pour renforcer ce que tu comprends.', 'Continue now or come back later. Practice to strengthen what you understand.', 'تابع الآن أو عد لاحقًا وتدرب لترسيخ ما فهمته.'])}</p>{progress.selected < STARTER_LESSONS.length - 1 ? <button type="button" className={styles.primary} onClick={() => select(progress.selected + 1)}>{t(['Leçon suivante', 'Next lesson', 'الدرس التالي'])} <span aria-hidden="true">{lang === 'ar' ? '←' : '→'}</span></button> : <button type="button" className={styles.primary} onClick={() => onNavigate('academy')}>{t(['Continuer dans l’Académie', 'Continue in the Academy', 'تابع في الأكاديمية'])}</button>}</div>}</>}
          </div>}
        </div>
        <footer className={styles.readerFooter}><button type="button" className={styles.textButton} disabled={!ready || progress.selected === 0} onClick={() => select(progress.selected - 1)}>{t(['Leçon précédente', 'Previous lesson', 'الدرس السابق'])}</button><span>{t(['Avance à ton rythme', 'Learn at your pace', 'تعلم بوتيرتك'])}</span></footer>
      </section>
    </div>
    <p className={styles.storage} role="status">{storageError ? t(['Ton navigateur ne peut pas enregistrer la progression. Tu peux continuer pendant cette visite.', 'Your browser cannot save progress. You can continue during this visit.', 'لا يستطيع المتصفح حفظ التقدم. يمكنك المتابعة خلال هذه الزيارة.']) : t(['Progression et notes enregistrées sur ce navigateur. Une leçon est validée après une bonne réponse, pas après une simple lecture.', 'Progress and notes are saved in this browser. A lesson is completed after a correct answer, rather than just reading.', 'يحفظ التقدم والملاحظات في هذا المتصفح ويكتمل الدرس بعد إجابة صحيحة وليس بمجرد القراءة.'])}</p>
    <section className={styles.nextSteps}><div><p className={styles.eyebrow}>{t(['ET APRÈS LES BASES ?', 'AFTER THE BASICS?', 'ماذا بعد الأساسيات؟'])}</p><h2>{t(['Construis, puis approfondis.', 'Build, then go deeper.', 'ابنِ ثم تعمق.'])}</h2><p>{t(['Ce parcours est le début. Retrouve les leçons complètes, les exercices et les vrais fichiers de Lecomax.', 'This path is the beginning. Find the full lessons, exercises and actual Lecomax files.', 'هذا المسار البداية. اكتشف الدروس الكاملة والتمارين وملفات Lecomax الحقيقية.'])}</p></div><div className={styles.resourceGrid}>{([['site', ['Explorer mon site', 'Explore my website', 'استكشاف موقعي'], ['Clique sur une partie du site pour comprendre son code.', 'Click a part of the website to understand its code.', 'انقر جزءًا من الموقع لفهم كوده.']], ['academy', ['Apprendre plus en profondeur', 'Learn in more depth', 'التعلم بتعمق'], ['TypeScript, formulaires, sécurité, tests, paiements et projets.', 'TypeScript, forms, security, tests, payments and projects.', 'TypeScript والنماذج والأمان والاختبارات والدفع والمشاريع.']], ['files', ['Lire mon vrai code', 'Read my actual code', 'قراءة كودي الحقيقي'], ['Retrouve un fichier et lis son explication.', 'Find a file and read its explanation.', 'اعثر على ملف واقرأ شرحه.']]] as [string, Words, Words][]).map(([tab, label, detail]) => <button type="button" key={tab} onClick={() => onNavigate(tab)}><strong>{t(label)} <span aria-hidden="true">↗</span></strong><p>{t(detail)}</p></button>)}</div></section>
  </div>;
}
