"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseLanguage } from "./course/types";
import { text, type Text } from "./learning/types";
import { PRACTICE_KEY, missionIds, missionComplete, readPracticeProgress, type PracticeProgress } from "@/lib/site-practice-progress";
import { practiceQuizzes } from "./practice-quizzes";
import PracticeHelp from "./PracticeHelp";
import LessonTeacher from "./LessonTeacher";

type Mission = { title: Text; idea: Text; steps: Text[]; commands?: string; check: Text; files: [string, string][]; help?: [string, string] };
const missions: Mission[] = [
  {
    title: ["1. Lancer mon site sur mon ordinateur", "1. Run my site on my computer", "1. شغّل موقعك على حاسوبك"],
    idea: ["Le serveur de développement te montre tes modifications quand tu enregistres un fichier. localhost désigne ton ordinateur.", "The development server shows your changes when you save a file. localhost means your computer.", "خادم التطوير يعرض تغييراتك عندما تحفظ الملف. localhost يعني حاسوبك."],
    steps: [
      ["Ouvre le dossier L’ecomax dans ton éditeur, puis Terminal → Nouveau terminal. Reste dans le dossier qui contient package.json.", "Open the L’ecomax folder in your editor, then Terminal → New Terminal. Stay in the folder containing package.json.", "افتح مجلد L’ecomax في المحرر ثم Terminal → New Terminal. ابق في المجلد الذي يحتوي على package.json."],
      ["Si les dépendances ne sont pas encore installées, lance npm.cmd ci. Vérifie que .env.local est configuré ; ne remplace pas un fichier existant.", "If dependencies are not installed yet, run npm.cmd ci. Check that .env.local is configured; do not replace an existing file.", "إذا لم تثبت المكتبات بعد شغّل npm.cmd ci. تأكد من إعداد .env.local ولا تستبدل ملفا موجودا."],
      ["Lance la commande ci-dessous. Attends Ready, puis ouvre l’adresse Local affichée dans le terminal. Garde le terminal ouvert. Ctrl+C arrête le serveur.", "Run the command below. Wait for Ready, then open the Local address printed in the terminal. Keep the terminal open. Ctrl+C stops the server.", "شغّل الأمر أسفله. انتظر Ready وافتح عنوان Local الظاهر في الطرفية. اتركها مفتوحة. Ctrl+C يوقف الخادم."],
    ],
    commands: "npm.cmd run dev",
    check: ["Tu dois voir ta boutique, généralement sur http://localhost:3000. package.json montre que predev prépare les cours et les sources avant next dev. Si le démarrage échoue, lis la première erreur du terminal.", "You should see your shop, usually at http://localhost:3000. package.json shows that predev prepares lessons and sources before next dev. If startup fails, read the first terminal error.", "يجب أن ترى متجرك غالبا على http://localhost:3000. يوضح package.json أن predev يحضّر الدروس والملفات قبل next dev. إذا فشل التشغيل اقرأ أول خطأ في الطرفية."],
    files: [["package.json", '"dev"'], ["app/page.tsx", "export default"]],
  },
  {
    title: ["2. Comprendre et connecter une API", "2. Understand and connect an API", "2. افهم واربط API"],
    idea: ["Une API est un point de contact : la page demande des données, le serveur répond. Exemple réel : tes catégories viennent de /api/categories.", "An API is a contact point: the page asks for data and the server replies. Real example: your categories come from /api/categories.", "API هي نقطة تواصل: الصفحة تطلب البيانات والخادم يجيب. مثال من موقعك: الأقسام تأتي من /api/categories."],
    steps: [
      ["Ouvre CategoryTiles.tsx ci-dessous et cherche /api/categories : c’est la demande du navigateur. Ouvre ensuite route.ts : GET lit les catégories dans Supabase et renvoie du JSON, des données structurées.", "Open CategoryTiles.tsx below and find /api/categories: this is the browser’s request. Then open route.ts: GET reads categories from Supabase and returns JSON, structured data.", "افتح CategoryTiles.tsx وابحث عن /api/categories: هذا طلب المتصفح. ثم افتح route.ts: تقرأ GET الأقسام من Supabase وترجع JSON، أي بيانات منظمة."],
      ["Pour connecter cette route, configure NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local avec les valeurs de ton projet Supabase. La clé service role reste sur le serveur : jamais dans un composant, GitHub ou une variable NEXT_PUBLIC_. Redémarre le serveur après un changement.", "To connect this route, configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local using your Supabase project values. The service role key stays on the server: never in a component, GitHub or a NEXT_PUBLIC_ variable. Restart the server after changes.", "لربط هذا المسار ضع NEXT_PUBLIC_SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY في .env.local بقيم مشروع Supabase. مفتاح service role يبقى في الخادم، لا تضعه في مكون أو GitHub أو متغير NEXT_PUBLIC_. أعد تشغيل الخادم بعد التغيير."],
      ["Avec ton serveur ouvert, visite /api/categories sur la même adresse locale. Dans les outils du navigateur → Network, recharge la boutique et retrouve cette requête. Les clés seules ne créent pas les tables : le projet Supabase doit aussi avoir le schéma du site.", "With your server running, visit /api/categories on the same local address. In browser tools → Network, reload the shop and find this request. Keys alone do not create tables: the Supabase project also needs the site’s database schema.", "والخادم يعمل افتح /api/categories على نفس العنوان المحلي. في أدوات المتصفح → Network أعد تحميل المتجر وابحث عن الطلب. المفاتيح وحدها لا تنشئ الجداول: يحتاج مشروع Supabase أيضا إلى بنية قاعدة بيانات الموقع."],
    ],
    check: ["Réussite : statut 200 et une liste JSON. [] signifie une liste vide. Si tu vois 500, lis le terminal et vérifie la configuration et les tables. Ne colle jamais tes clés dans une capture ou une question.", "Success: status 200 and a JSON list. [] means an empty list. If you see 500, read the terminal and check configuration and tables. Never paste keys into a screenshot or question.", "النجاح: حالة 200 وقائمة JSON. [] تعني قائمة فارغة. إذا ظهر 500 اقرأ الطرفية وتحقق من الإعداد والجداول. لا تشارك مفاتيحك في صورة أو سؤال."],
    files: [["components/CategoryTiles.tsx", "/api/categories"], ["app/api/categories/route.ts", "export async function GET"], ["lib/supabase.ts", "createClient"]],
  },
  {
    title: ["3. Sauvegarder une modification sur GitHub", "3. Save a change to GitHub", "3. احفظ تغييرا على GitHub"],
    idea: ["Git garde l’historique sur ton ordinateur. GitHub héberge une copie. Un commit est une sauvegarde nommée ; push l’envoie.", "Git keeps history on your computer. GitHub hosts a copy. A commit is a named checkpoint; push sends it.", "Git يحفظ التاريخ على حاسوبك. GitHub يستضيف نسخة. commit نقطة حفظ باسم وpush يرسلها."],
    steps: [
      ["Lance les commandes de lecture ci-dessous. Vérifie ta branche et le dépôt origin. Ce projet utilise déjà Git : inutile de refaire git init. Si origin manque, crée un dépôt GitHub vide et suis le guide officiel lié ici.", "Run the read-only commands below. Check your branch and the origin repository. This project already uses Git: no need to run git init again. If origin is missing, create an empty GitHub repository and follow the official guide linked here.", "شغّل أوامر القراءة أسفله وتحقق من الفرع ومستودع origin. المشروع يستعمل Git بالفعل فلا تحتاج git init. إذا غاب origin أنشئ مستودع GitHub فارغا واتبع الدليل الرسمي هنا."],
      ["Pour un exercice, modifie seulement un texte visible dans components/Footer.tsx et vérifie le résultat en local. Dans Source Control, sélectionne seulement ce fichier, relis le diff, puis crée un commit avec un message clair.", "For practice, change only visible text in components/Footer.tsx and check it locally. In Source Control, stage only that file, review the diff, then commit with a clear message.", "للتدريب غيّر نصا ظاهرا فقط في components/Footer.tsx وتحقق محليا. في Source Control اختر هذا الملف فقط، راجع الفرق ثم أنشئ commit برسالة واضحة."],
      ["Si tu veux l’envoyer, lance git push -u origin HEAD sur ta branche d’exercice. Authentifie-toi si GitHub le demande. N’inclus pas .env.local. Si Vercel est connecté, un push peut déclencher un déploiement : utilise une branche de travail pour tester.", "When you want to send it, run git push -u origin HEAD on your practice branch. Authenticate if GitHub asks. Do not include .env.local. If Vercel is connected, a push can trigger deployment: use a working branch for testing.", "عندما تريد الإرسال شغّل git push -u origin HEAD على فرع التدريب وسجل الدخول إذا طلب GitHub ذلك. لا ترسل .env.local. إذا كان Vercel مرتبطا فقد يبدأ النشر تلقائيا؛ استعمل فرع عمل للتجربة."],
    ],
    commands: "git status --short\ngit branch --show-current\ngit remote -v\ngit diff -- components/Footer.tsx",
    check: ["Sur GitHub, ouvre la même branche : ton commit et uniquement les changements choisis doivent apparaître. Avant de travailler, crée une branche depuis Source Control → Branch → Create Branch.", "On GitHub, open the same branch: your commit and only the selected changes should appear. Before working, create a branch through Source Control → Branch → Create Branch.", "افتح نفس الفرع في GitHub: يجب أن يظهر commit والتغييرات المختارة فقط. قبل العمل أنشئ فرعا من Source Control → Branch → Create Branch."],
    files: [["components/Footer.tsx", "return"], ["package.json", '"scripts"']],
    help: ["GitHub", "https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github"],
  },
  {
    title: ["4. Mettre mon site sur Vercel", "4. Put my site on Vercel", "4. انشر موقعك على Vercel"],
    idea: ["Vercel construit ton projet et lui donne une adresse publique. Preview sert à vérifier une branche ; Production est la version présentée aux clients.", "Vercel builds your project and gives it a public address. Preview lets you check a branch; Production is the version customers see.", "Vercel يبني المشروع ويعطيه عنوانا عاما. Preview لمراجعة فرع وProduction هي النسخة التي يراها الزبائن."],
    steps: [
      ["Teste d’abord npm.cmd run build en local. Dans Vercel, ouvre le projet existant et vérifie le dépôt connecté dans Settings → Git. Pour un nouveau projet seulement, importe le dépôt GitHub.", "First test npm.cmd run build locally. In Vercel, open the existing project and check its connected repository in Settings → Git. Only for a new project, import the GitHub repository.", "اختبر أولا npm.cmd run build محليا. افتح مشروع Vercel الحالي وتحقق من المستودع في Settings → Git. استورد مستودع GitHub فقط إذا كان المشروع جديدا."],
      ["Le dossier racine du site contient ce package.json : ne choisis pas mobile ou lecomax-learning-app. Vérifie le framework Next.js et la commande de construction npm run build.", "The site root contains this package.json: do not choose mobile or lecomax-learning-app. Check the Next.js framework and npm run build build command.", "جذر الموقع يحتوي على package.json هذا: لا تختَر mobile أو lecomax-learning-app. تحقق من Next.js وأمر البناء npm run build."],
      ["Dans Settings → Environment Variables, configure les variables nécessaires pour Preview et Production. .env.local reste sur ton ordinateur. Après un changement de variables, crée un nouveau déploiement pour les appliquer.", "In Settings → Environment Variables, configure required variables for Preview and Production. .env.local stays on your computer. After changing variables, create a new deployment to apply them.", "في Settings → Environment Variables أضف المتغيرات المطلوبة لـ Preview وProduction. يبقى .env.local على حاسوبك. بعد تغيير المتغيرات أنشئ نشرا جديدا لتطبيقها."],
      ["Envoie ta branche de travail sur GitHub et ouvre son URL Preview dans Vercel. Vérifie accueil, catégories et lecture des produits. Quand le résultat te convient, fusionne vers la branche de production configurée dans Vercel.", "Push your working branch to GitHub and open its Preview URL in Vercel. Check the home page, categories and product display. When satisfied, merge into the production branch configured in Vercel.", "أرسل فرع العمل إلى GitHub وافتح رابط Preview في Vercel. تحقق من الرئيسية والأقسام وعرض المنتجات. عندما تتأكد ادمج في فرع الإنتاج المحدد في Vercel."],
    ],
    commands: "npm.cmd run build",
    check: ["Le déploiement doit afficher Ready et ton changement sur la bonne URL. En cas d’échec, ouvre Build Logs et commence par la première erreur. Un build réussi ne garantit pas que toutes les API fonctionnent : vérifie aussi le site.", "The deployment should show Ready and your change at the correct URL. If it fails, open Build Logs and start with the first error. A successful build does not prove every API works: check the site too.", "يجب أن يظهر Ready وتغييرك في الرابط الصحيح. إذا فشل افتح Build Logs وابدأ بأول خطأ. نجاح البناء لا يضمن عمل كل API؛ تحقق من الموقع أيضا."],
    files: [["package.json", '"build"'], ["next.config.js", "nextConfig"], ["vercel.json", ""]],
    help: ["Vercel", "https://vercel.com/docs/git"],
  },
];

export default function SitePractice({ lang, onOpenFile }: { lang: CourseLanguage; onOpenFile: (path: string, anchor: string) => void }) {
  const [progress, setProgress] = useState<PracticeProgress>(() => readPracticeProgress(null));
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [changed, setChanged] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "failed">("");
  const [focusMode, setFocusMode] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const copyRequest = useRef(0);
  const active = missionIds.indexOf(progress.active);
  const id = progress.active;
  const t = (value: Text) => text(value, lang);
  const mission = missions[active];
  const quiz = practiceQuizzes[active];
  const completed = missionIds.filter(item => missionComplete(progress, item)).length;
  const nextStep = mission.steps.findIndex((_, index) => !progress.steps[id].includes(index));
  useEffect(() => {
    try { setProgress(readPracticeProgress(JSON.parse(localStorage.getItem(PRACTICE_KEY) || "null"))); }
    catch { setStorageError(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !changed) return;
    try { localStorage.setItem(PRACTICE_KEY, JSON.stringify(progress)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [progress, ready, changed]);
  function update(change: (previous: PracticeProgress) => PracticeProgress) { setProgress(change); setChanged(true); }
  function open(index: number) {
    copyRequest.current++;
    update(previous => ({ ...previous, active: missionIds[index] }));
    setAnswer(null); setCopyStatus("");
    requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "nearest", behavior: "auto" }); });
  }
  async function copyCommands() {
    const request = ++copyRequest.current;
    try { await navigator.clipboard.writeText(mission.commands || ""); if (request === copyRequest.current) setCopyStatus("copied"); }
    catch { if (request === copyRequest.current) setCopyStatus("failed"); }
  }
  function exportNotes() {
    const content = missions.map((item, index) => `${t(item.title)}\n${missionComplete(progress, missionIds[index]) ? "✓" : "○"}\n${progress.notes[missionIds[index]]}`).join("\n\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "lecomax-learning-notes.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!ready) return <p role="status">{t(["Je retrouve tes missions…", "Loading your missions…", "تحميل مهامك…"])}</p>;
  return <section id="site-practice" className="scroll-mt-24 space-y-4 rounded-2xl border bg-white p-4 sm:p-6" dir={lang === "ar" ? "rtl" : "ltr"} aria-label={t(["Pratique avec mon site", "Practice with my site", "تدرّب بموقعك"])}>
    <h2 className="text-lg font-bold">{t(["Une petite action, un vrai résultat", "One small action, one real result", "خطوة صغيرة ونتيجة حقيقية"])}</h2>
    <p className="text-sm text-neutral-600">{t(["Aujourd’hui : choisis une mission, essaie une étape et explique ce que tu as appris. Ces instructions n’exécutent aucune commande à ta place.", "Today: choose one mission, try one step and explain what you learned. These instructions do not run commands for you.", "اليوم: اختر مهمة، جرّب خطوة واشرح ما تعلمته. هذه التعليمات لا تشغّل الأوامر بدلا عنك."])}</p>
    <label className="block text-sm font-semibold">{completed} / {missions.length} {t(["missions terminées", "missions completed", "مهام مكتملة"])}<progress className="mt-2 block h-3 w-full accent-emerald-700" value={completed} max={missions.length} /></label>
    <p role="status" className={`text-xs ${storageError ? "text-amber-800" : "text-neutral-600"}`}>{storageError ? t(["Le navigateur ne peut pas sauvegarder. Télécharge tes notes avant de partir.", "This browser cannot save progress. Download your notes before leaving.", "المتصفح لا يستطيع حفظ التقدم. حمّل ملاحظاتك قبل المغادرة."]) : t(["Ta place, tes étapes et tes notes sont conservées dans ce navigateur uniquement.", "Your place, steps and notes stay in this browser only.", "مكانك وخطواتك وملاحظاتك محفوظة في هذا المتصفح فقط."])}</p>
    <div className="flex flex-wrap gap-2">{missions.map((item, index) => <button key={index} type="button" aria-pressed={active === index} onClick={() => open(index)} className={`min-h-11 rounded-xl border px-3 py-2 text-start text-sm ${active === index ? "bg-emerald-950 text-white" : "bg-white text-neutral-800"}`}>{missionComplete(progress, missionIds[index]) ? "✓ " : ""}{t(item.title)}</button>)}</div>
    <div key={active} className="space-y-4">
      <h3 ref={heading} tabIndex={-1} className="font-bold focus-visible:outline-emerald-700">{t(mission.title)}</h3><p className="text-sm leading-6">{t(mission.idea)}</p>
      <button type="button" aria-pressed={focusMode} onClick={() => setFocusMode(value => !value)} className="min-h-11 rounded-xl border px-3 text-sm">{focusMode ? t(["Voir toutes les étapes", "Show all steps", "اعرض كل الخطوات"]) : t(["Une étape à la fois", "One step at a time", "خطوة واحدة كل مرة"])}</button>
      <ol className="space-y-3 text-sm leading-6">{mission.steps.map((step, index) => (!focusMode || nextStep === -1 || index === nextStep) && <li key={index} className="rounded-xl border p-3">
        <p className="mb-2 text-xs font-bold text-emerald-800">{t(["Étape", "Step", "الخطوة"])} {index + 1} / {mission.steps.length}</p><p>{t(step)}</p>
        <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 font-semibold"><input type="checkbox" className="h-5 w-5 shrink-0 accent-emerald-800" checked={progress.steps[id].includes(index)} onChange={event => { const checked = event.target.checked; update(previous => ({ ...previous, steps: { ...previous.steps, [id]: checked ? [...new Set([...previous.steps[id], index])] : previous.steps[id].filter(value => value !== index) } })); }} />{t(["J’ai essayé cette étape", "I tried this step", "جرّبت هذه الخطوة"])}</label>
      </li>)}</ol>
      {mission.commands && <div><pre dir="ltr" className="overflow-x-auto rounded-xl bg-neutral-950 p-4 text-sm text-white"><code>{mission.commands}</code></pre><button type="button" onClick={copyCommands} className="mt-2 min-h-11 rounded-xl border px-3 text-sm">{t(["Copier les commandes", "Copy commands", "انسخ الأوامر"])}</button><p role="status" className="mt-1 text-xs">{copyStatus === "copied" ? t(["Copié. Colle-les dans le terminal de ton projet.", "Copied. Paste into your project terminal.", "تم النسخ. ألصقها في طرفية المشروع."]) : copyStatus === "failed" ? t(["Copie automatique indisponible. Sélectionne le texte ci-dessus et copie-le.", "Automatic copy unavailable. Select and copy the text above.", "النسخ التلقائي غير متاح. حدد النص أعلاه وانسخه."]) : ""}</p></div>}
      <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6"><strong>{t(["Comment vérifier ?", "How do I check?", "كيف أتحقق؟"])}</strong><p>{t(mission.check)}</p></div>
      <p className="text-sm font-bold">{t(["Ouvrir mes vrais fichiers", "Open my real files", "افتح ملفاتي الحقيقية"])}</p>
      <div className="flex flex-wrap gap-2">{mission.files.map(([path, anchor]) => <button type="button" key={path} onClick={() => onOpenFile(path, anchor)} className="min-h-11 max-w-full break-all rounded-xl border px-3 py-2 text-start font-mono text-xs text-emerald-900">{path}</button>)}</div>
      {mission.help && <a className="inline-block py-2 text-sm underline" href={mission.help[1]} target="_blank" rel="noreferrer">{t(["Guide officiel", "Official guide", "الدليل الرسمي"])} · {mission.help[0]} ↗</a>}
      <fieldset className="space-y-2 rounded-xl border p-4"><legend className="px-2 text-sm font-bold">{t(["Une question pour retenir", "One question to remember", "سؤال لتثبيت الفكرة"])}</legend><p className="text-sm font-semibold">{t(quiz.question)}</p>{quiz.options.map((option, index) => <button key={index} type="button" aria-pressed={answer === index} onClick={() => { setAnswer(index); if (index === quiz.correct) update(previous => ({ ...previous, passed: [...new Set([...previous.passed, id])] })); }} className={`block min-h-11 w-full rounded-xl border p-3 text-start text-sm ${answer === index ? "border-emerald-800 bg-emerald-50" : "bg-white"}`}>{t(option)}</button>)}{answer !== null && <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm leading-6"><strong>{answer === quiz.correct ? t(["Oui, tu as compris.", "Yes, you understood.", "نعم، فهمت الفكرة."]) : t(["Pas encore. Lis l’explication et réessaie.", "Not yet. Read the explanation and try again.", "ليس بعد. اقرأ الشرح وحاول مجددا."])}</strong><p>{t(quiz.explanation)}</p></div>}</fieldset>
      <label className="block text-sm font-bold">{t(["Avec mes mots : ce que j’ai compris", "In my words: what I understood", "بكلماتي: ماذا فهمت"])}<textarea rows={3} maxLength={2000} value={progress.notes[id]} onChange={event => { const note = event.target.value; update(previous => ({ ...previous, notes: { ...previous.notes, [id]: note } })); }} placeholder={t(["J’ai essayé… J’ai observé… Ma prochaine question… (sans mots de passe ni clés)", "I tried… I noticed… My next question… (no passwords or keys)", "جرّبت… لاحظت… سؤالي القادم… (دون كلمات مرور أو مفاتيح)"])} className="mt-2 block w-full rounded-xl border p-3 text-base font-normal" /></label>
      <button type="button" onClick={exportNotes} className="min-h-11 rounded-xl border px-3 text-sm">{t(["Télécharger toutes mes notes", "Download all my notes", "حمّل كل ملاحظاتي"])}</button>
      <p role="status" className="text-sm font-semibold text-emerald-900">{missionComplete(progress, id) ? t(["Mission terminée : étapes essayées et question réussie. Tu peux la revoir quand tu veux.", "Mission complete: steps tried and question answered correctly. You can review it anytime.", "اكتملت المهمة: جرّبت الخطوات وأجبت بشكل صحيح. يمكنك مراجعتها متى شئت."]) : t(["Pour terminer : essaie chaque étape, coche-la et réussis la question. Tu peux aussi explorer les autres missions librement.", "To finish: try and check each step, then answer the question correctly. You can also explore other missions freely.", "للإكمال: جرّب كل خطوة وحددها ثم أجب بشكل صحيح. يمكنك أيضا استكشاف المهام الأخرى بحرية."])}</p>
      {active < missions.length - 1 && <button type="button" onClick={() => open(active + 1)} className="block min-h-11 rounded-xl bg-emerald-950 px-4 text-sm font-bold text-white">{t(["Mission suivante →", "Next mission →", "المهمة التالية ←"])}</button>}
    </div>
    <LessonTeacher lang={lang} topic={t(mission.title)} context={`${t(mission.idea)}\n${t(mission.steps[Math.max(0, nextStep)])}`} sourcePath={mission.files[0][0]} sourceAnchor={mission.files[0][1]} />
    <PracticeHelp lang={lang} />
  </section>;
}
