/**
 * Academy blueprint, part A: foundations through browser interactivity.
 *
 * The compact authoring records below are expanded into the complete lesson
 * contract consumed by the course generator. Keeping shared pedagogical prose
 * here makes every locale equally detailed without duplicating boilerplate.
 */

const LANGUAGES = ["fr", "en", "ar"];

const L = (fr, en, ar) => ({ fr, en, ar });
const at = (value, lang) => value[lang];

const COPY = {
  fr: {
    basePrerequisite:
      "Savoir utiliser le clavier et la souris; aucune expérience de programmation n’est supposée. Les outils et le projet sont installés pas à pas dans le premier module.",
    objectivePrefix: "À la fin, vous saurez expliquer puis appliquer",
    mentalSuffix:
      "Gardez toujours séparés l’intention, les données qui entrent, la transformation effectuée et le résultat observable. Cette séparation permet de prévoir le comportement avant d’exécuter le code et de diagnostiquer précisément une erreur.",
    explanationSuffixes: [
      "Lisez l’exemple de haut en bas, identifiez chaque entrée, puis prédisez le résultat avant de lancer la commande. Cette habitude transforme une syntaxe mémorisée en compréhension réutilisable.",
      "Dans un vrai projet, vérifiez cette mécanique avec le navigateur, le terminal ou les DevTools au lieu de supposer qu’elle fonctionne. Une preuve observable vaut mieux qu’une intuition.",
      "Appliquez enfin le concept par une petite modification isolée, contrôlez le résultat, puis revenez en arrière si nécessaire. Des changements courts rendent les causes et les effets faciles à relier.",
    ],
    recapPrefix: "Idée centrale",
    expectedPrefix: "Preuve de réussite",
  },
  en: {
    basePrerequisite:
      "Know how to use a keyboard and mouse; no programming experience is assumed. The first module installs the tools and opens the project step by step.",
    objectivePrefix: "By the end, you will be able to explain and apply",
    mentalSuffix:
      "Always separate the intention, the incoming data, the transformation being performed, and the observable result. This separation lets you predict behavior before running code and diagnose an error precisely.",
    explanationSuffixes: [
      "Read the example from top to bottom, identify every input, and predict the output before running the command. This habit turns memorized syntax into reusable understanding.",
      "In a real project, verify this mechanism with the browser, terminal, or DevTools instead of assuming it works. Observable evidence is more reliable than intuition.",
      "Finally apply the concept through one small isolated change, check the result, and revert if needed. Short changes make cause and effect easy to connect.",
    ],
    recapPrefix: "Core idea",
    expectedPrefix: "Evidence of success",
  },
  ar: {
    basePrerequisite:
      "يكفي معرفة استعمال لوحة المفاتيح والفأرة؛ لا نفترض أي خبرة برمجية. تثبّت الوحدة الأولى الأدوات وتفتح المشروع خطوة بخطوة.",
    objectivePrefix: "في نهاية الدرس ستتمكن من شرح وتطبيق",
    mentalSuffix:
      "افصل دائمًا بين الهدف، والبيانات الداخلة، والتحويل الذي ينفذه البرنامج، والنتيجة التي يمكن ملاحظتها. يساعدك هذا الفصل على توقع السلوك قبل تشغيل الشفرة وعلى تشخيص الخطأ بدقة.",
    explanationSuffixes: [
      "اقرأ المثال من الأعلى إلى الأسفل، وحدد كل مدخل، ثم توقع النتيجة قبل تشغيل الأمر. بهذه العادة تتحول الصياغة المحفوظة إلى فهم تستطيع إعادة استخدامه.",
      "في المشروع الحقيقي تحقق من هذه الآلية باستعمال المتصفح أو الطرفية أو أدوات المطور بدل افتراض أنها تعمل. الدليل القابل للملاحظة أوثق من الحدس.",
      "طبّق المفهوم أخيرًا عبر تغيير صغير ومعزول، وافحص النتيجة، ثم تراجع عنه عند الحاجة. التغييرات القصيرة تجعل العلاقة بين السبب والنتيجة واضحة.",
    ],
    recapPrefix: "الفكرة المحورية",
    expectedPrefix: "دليل النجاح",
  },
};

function buildLesson(spec) {
  const locales = Object.fromEntries(
    LANGUAGES.map((lang) => {
      const copy = COPY[lang];
      const vocabulary = spec.vocabulary.map((entry) => ({
        term: at(entry.term, lang),
        definition: at(entry.definition, lang),
      }));
      const localized = {
        title: at(spec.title, lang),
        prerequisites: [copy.basePrerequisite, at(spec.prerequisite, lang)],
        objectives: spec.objectives.map(
          (objective) => `${copy.objectivePrefix} ${at(objective, lang)}`,
        ),
        mentalModel: `${at(spec.mentalModel, lang)} ${copy.mentalSuffix}`,
        analogy: at(spec.analogy, lang),
        explanation: spec.explanation.map(
          (paragraph, index) =>
            `${at(paragraph, lang)} ${copy.explanationSuffixes[index]}`,
        ),
        vocabulary,
        generalApplication: at(spec.generalApplication, lang),
        lecomaxApplication: at(spec.lecomaxApplication, lang),
        commands: spec.commands,
        expectedResult: `${copy.expectedPrefix}: ${at(spec.expectedResult, lang)}`,
        commonErrors: spec.commonErrors.map((error) => ({
          symptom: at(error.symptom, lang),
          cause: at(error.cause, lang),
          fix: at(error.fix, lang),
        })),
        exercise: {
          task: at(spec.exercise.task, lang),
          steps: spec.exercise.steps.map((step) => at(step, lang)),
          hints: spec.exercise.hints.map((hint) => at(hint, lang)),
          solutionExplanation: at(spec.exercise.solutionExplanation, lang),
          solutionCode: spec.exercise.solutionCode,
        },
        quiz: {
          question: at(spec.quiz.question, lang),
          options: spec.quiz.options.map((option) => at(option, lang)),
          correctIndex: spec.quiz.correctIndex,
          explanation: at(spec.quiz.explanation, lang),
        },
        recap: [
          `${copy.recapPrefix}: ${at(spec.recap, lang)}`,
          `${vocabulary[0].term}: ${vocabulary[0].definition}`,
          `${vocabulary[1].term}: ${vocabulary[1].definition}`,
          `${vocabulary[2].term}: ${vocabulary[2].definition}`,
        ],
        next: at(spec.next, lang),
      };
      return [lang, localized];
    }),
  );

  return {
    id: spec.id,
    order: spec.order,
    language: spec.language,
    filename: spec.filename,
    source: spec.source,
    annotations: Object.fromEntries(
      LANGUAGES.map((lang) => [
        lang,
        spec.annotations.map((annotation) => ({
          lines: annotation.lines,
          label: at(annotation.label, lang),
        })),
      ]),
    ),
    locales,
  };
}

function buildModule(spec) {
  return {
    id: spec.id,
    order: spec.order,
    icon: spec.icon,
    color: spec.color,
    files: spec.files,
    locales: Object.fromEntries(
      LANGUAGES.map((lang) => [
        lang,
        { title: at(spec.title, lang), summary: at(spec.summary, lang) },
      ]),
    ),
    lessons: spec.lessons.map(buildLesson),
  };
}

/** Expand a concise, topic-specific record into the full pedagogical contract. */
function coreLesson(spec) {
  const lineCount = Math.max(1, spec.source.split("\n").length);
  const firstEnd = Math.max(1, Math.ceil(lineCount / 3));
  const secondEnd = Math.max(firstEnd + 1, Math.ceil((lineCount * 2) / 3));
  const range = (start, end) => (start >= end ? String(start) : `${start}-${end}`);
  const defaultAnnotations = [
    {
      lines: range(1, firstEnd),
      label: L(
        `Entrées et préparation de « ${spec.title.fr} ».`,
        `Inputs and setup for “${spec.title.en}.”`,
        `مدخلات وتهيئة «${spec.title.ar}».`,
      ),
    },
    {
      lines: range(Math.min(firstEnd + 1, lineCount), Math.min(secondEnd, lineCount)),
      label: L(
        "La règle centrale à suivre et à prédire.",
        "The central rule to trace and predict.",
        "القاعدة المحورية التي يجب تتبعها وتوقعها.",
      ),
    },
    {
      lines: range(Math.min(secondEnd + 1, lineCount), lineCount),
      label: L(
        "La sortie observable qui prouve le comportement.",
        "The observable output that proves the behavior.",
        "المخرج القابل للملاحظة الذي يثبت السلوك.",
      ),
    },
  ];
  return {
    ...spec,
    annotations: spec.annotations ?? defaultAnnotations,
    prerequisite: spec.prerequisite ?? L(
      "Avoir terminé la leçon précédente et savoir lancer npm run dev.",
      "Have completed the previous lesson and know how to run npm run dev.",
      "إكمال الدرس السابق ومعرفة تشغيل npm run dev.",
    ),
    objectives: spec.objectives ?? [
      L(`le modèle mental de ${spec.title.fr}`, `the mental model behind ${spec.title.en}`, `النموذج الذهني لموضوع ${spec.title.ar}`),
      L("une implémentation minimale vérifiée par une preuve", "a minimal implementation verified by evidence", "تنفيذًا أدنى يتحقق منه دليل"),
    ],
    mentalModel: spec.mentalModel,
    analogy: spec.analogy,
    explanation: spec.explanation,
    vocabulary: spec.vocabulary,
    generalApplication: spec.generalApplication,
    lecomaxApplication: spec.lecomaxApplication,
    expectedResult: spec.expectedResult,
    commonErrors: spec.commonErrors,
    exercise: {
      task: spec.task,
      steps: spec.steps ?? [
        L(`Ouvrez ${spec.filename} et prédisez la sortie de l’exemple.`, `Open ${spec.filename} and predict the example output.`, `افتح ${spec.filename} وتوقع مخرجات المثال.`),
        L("Reproduisez l’exemple dans le fichier d’exercice sans copier la solution.", "Reproduce the example in the exercise file without copying the solution.", "أعد بناء المثال في ملف التمرين من دون نسخ الحل."),
        L("Exécutez la commande indiquée, comparez le résultat attendu et expliquez toute différence.", "Run the listed command, compare the expected result, and explain any difference.", "شغّل الأمر المذكور وقارن بالنتيجة المتوقعة واشرح أي فرق."),
      ],
      hints: spec.hints ?? [
        L("Commencez par les entrées, puis suivez une transformation à la fois.", "Start with inputs, then follow one transformation at a time.", "ابدأ بالمدخلات ثم اتبع تحويلًا واحدًا في كل مرة."),
        L("Utilisez le premier message d’erreur et la ligne indiquée comme preuve de diagnostic.", "Use the first error message and indicated line as diagnostic evidence.", "استعمل أول رسالة خطأ والسطر المشار إليه كدليل للتشخيص."),
      ],
      solutionExplanation: spec.solutionExplanation,
      solutionCode: spec.solutionCode ?? spec.source,
    },
    quiz: spec.quiz,
    recap: spec.recap,
    next: spec.next,
  };
}

function compactLesson(spec) {
  return coreLesson({
    ...spec,
    mentalModel: spec.concept,
    analogy: spec.analogy,
    explanation: [spec.concept, spec.mechanism, spec.practice],
    generalApplication: spec.general,
    lecomaxApplication: spec.lecomax,
    commonErrors: [
      error(
        spec.failures[0].symptom,
        spec.failures[0].cause,
        spec.failures[0].fix,
      ),
      error(
        spec.failures[1].symptom,
        spec.failures[1].cause,
        spec.failures[1].fix,
      ),
    ],
    task: spec.task,
    solutionExplanation: spec.practice,
    recap: spec.recap,
  });
}

function rapidLesson(spec) {
  const cause = L(
    `Le symptôme contredit le mécanisme attendu : ${spec.mechanism.fr}`,
    `The symptom contradicts the expected mechanism: ${spec.mechanism.en}`,
    `تتناقض العلامة مع الآلية المتوقعة: ${spec.mechanism.ar}`,
  );
  return compactLesson({
    ...spec,
    failures: [
      { symptom: spec.issues[0], cause, fix: spec.fixes[0] },
      { symptom: spec.issues[1], cause, fix: spec.fixes[1] },
    ],
    task: spec.general,
    quiz: {
      question: spec.question,
      options: [spec.answer, ...spec.distractors],
      correctIndex: 0,
      explanation: spec.quizExplanation,
    },
    recap: spec.concept,
  });
}

const v = (term, fr, en, ar) => ({
  term: L(term, term, term),
  definition: L(fr, en, ar),
});

const error = (symptom, cause, fix) => ({ symptom, cause, fix });

const modulesBlueprint = [];

modulesBlueprint.push({
  id: "module-00-learning-tools",
  order: 0,
  icon: "🧭",
  color: "#16A34A",
  files: [
    { path: "package.json", mode: "existing" },
    { path: "academy-labs/00-tools/setup.ps1", mode: "create" },
    { path: "academy-labs/00-tools/learning-log.md", mode: "create" },
  ],
  title: L(
    "Apprendre, configurer son ordinateur et lancer le projet",
    "Learning, setting up your computer, and running the project",
    "التعلم وإعداد الحاسوب وتشغيل المشروع",
  ),
  summary: L(
    "Une méthode de travail reproductible avec VS Code, PowerShell, Node.js et npm, depuis le premier dossier jusqu’au serveur Next.js local.",
    "A repeatable workflow with VS Code, PowerShell, Node.js, and npm, from the first folder to a local Next.js server.",
    "منهج عمل قابل للتكرار باستعمال VS Code وPowerShell وNode.js وnpm، من أول مجلد حتى خادم Next.js المحلي.",
  ),
  lessons: [
    {
      id: "lesson-00-01-learning-map",
      order: 0,
      language: "powershell",
      filename: "academy-labs/00-tools/setup.ps1",
      source: `winget --version
winget install --id Microsoft.VisualStudioCode --exact --source winget --accept-package-agreements --accept-source-agreements

$courseRoot = Join-Path $HOME "Documents/lecomax-academy"
New-Item -ItemType Directory -Path $courseRoot -Force | Out-Null
Set-Location -LiteralPath $courseRoot
New-Item -ItemType Directory -Path "academy-labs/00-tools" -Force | Out-Null

$log = @("# Learning log", "", "## Goal", "Open my first workspace and record evidence.")
$log | Set-Content -LiteralPath "academy-labs/00-tools/learning-log.md" -Encoding utf8
Get-Location
Get-Item -LiteralPath "academy-labs/00-tools/learning-log.md"`,
      annotations: [
        { lines: "1-2", label: L("Vérifier winget puis installer VS Code depuis son identifiant officiel.", "Verify winget, then install VS Code by its official package ID.", "تحقق من winget ثم ثبّت VS Code بمعرف الحزمة الرسمي.") },
        { lines: "4-7", label: L("Construire un premier workspace sous Documents puis s’y placer explicitement.", "Create a first workspace under Documents and enter it explicitly.", "أنشئ أول مساحة عمل داخل Documents ثم انتقل إليها صراحة.") },
        { lines: "9-12", label: L("Écrire un vrai journal Markdown puis prouver son chemin et son existence.", "Write a real Markdown log, then prove its path and existence.", "اكتب سجل Markdown حقيقيًا ثم أثبت مساره ووجوده.") },
      ],
      title: L("Partir de zéro : installer VS Code et créer son espace", "Start from zero: install VS Code and create your workspace", "ابدأ من الصفر: ثبّت VS Code وأنشئ مساحتك"),
      prerequisite: L("Aucun projet ni éditeur ne doit déjà être ouvert; il suffit de savoir ouvrir le menu Démarrer et saisir du texte.", "No project or editor needs to be open already; you only need to open the Start menu and type text.", "لا يلزم وجود مشروع أو محرر مفتوح مسبقًا؛ يكفي فتح قائمة Start وكتابة نص."),
      objectives: [
        L("l’installation vérifiable de VS Code et la création d’un premier dossier de travail", "a verifiable VS Code installation and creation of a first working folder", "تثبيت VS Code القابل للتحقق وإنشاء أول مجلد عمل"),
        L("un journal d’expériences qui conserve les preuves", "an experiment log that preserves evidence", "سجل تجارب يحتفظ بالأدلة"),
      ],
      mentalModel: L(
        "Un développeur ne mémorise pas tout : il construit une carte reliant un objectif, un fichier, une commande et une preuve. Chaque expérience doit répondre à une petite question et produire un résultat vérifiable.",
        "A developer does not memorize everything: they build a map connecting a goal, a file, a command, and evidence. Every experiment should answer one small question and produce a verifiable result.",
        "لا يحفظ المطور كل شيء؛ بل يبني خريطة تصل بين هدف وملف وأمر ودليل. يجب أن تجيب كل تجربة عن سؤال صغير وأن تنتج نتيجة يمكن التحقق منها.",
      ),
      analogy: L(
        "Comme un carnet de laboratoire : la recette seule ne suffit pas, il faut noter ce qui a été testé et observé.",
        "Like a laboratory notebook: the recipe alone is insufficient; you record what was tested and observed.",
        "مثل دفتر المختبر: الوصفة وحدها لا تكفي، بل تسجل ما اختبرته وما لاحظته.",
      ),
      explanation: [
        L("Ouvrez Windows PowerShell depuis le menu Démarrer. winget installe VS Code sans supposer qu’il existe déjà; si winget manque, téléchargez l’installateur officiel code.visualstudio.com et cochez l’ajout à PATH.", "Open Windows PowerShell from the Start menu. winget installs VS Code without assuming it already exists; if winget is unavailable, download the official installer from code.visualstudio.com and enable Add to PATH.", "افتح Windows PowerShell من قائمة Start. يثبّت winget محرر VS Code من دون افتراض وجوده؛ وإن لم يتوفر winget فنزّل المثبت الرسمي من code.visualstudio.com وفعّل الإضافة إلى PATH."),
        L("Avant toute commande, relevez le dossier courant, le fichier visé et l’état initial. Ces trois repères évitent de modifier le mauvais projet ou d’attribuer un ancien problème au nouveau changement.", "Before any command, note the current directory, target file, and initial state. These three anchors prevent changing the wrong project or blaming a new change for an older problem.", "قبل أي أمر دوّن المجلد الحالي والملف المستهدف والحالة الأولية. تمنع هذه المراسي الثلاثة تعديل المشروع الخطأ أو نسبة مشكلة قديمة إلى تغيير جديد."),
        L("Après l’action, conservez la commande exacte, la sortie utile et votre conclusion dans un journal. Une erreur devient alors une donnée d’apprentissage, pas un échec opaque.", "After the action, preserve the exact command, useful output, and your conclusion in a log. An error then becomes learning data rather than an opaque failure.", "بعد التنفيذ احتفظ بالأمر الدقيق والمخرجات المفيدة واستنتاجك في سجل. عندها يصبح الخطأ معلومة للتعلم لا فشلًا غامضًا."),
      ],
      vocabulary: [
        v("workspace", "Dossier racine contenant le code, la configuration et l’historique du projet.", "Root folder containing the project code, configuration, and history.", "المجلد الجذر الذي يحتوي شفرة المشروع وإعداداته وتاريخه."),
        v("hypothesis", "Prédiction testable formulée avant une expérience.", "A testable prediction stated before an experiment.", "توقع قابل للاختبار تصوغه قبل التجربة."),
        v("feedback loop", "Cycle court entre une action et la preuve de son résultat.", "Short cycle between an action and evidence of its result.", "دورة قصيرة بين الفعل ودليل نتيجته."),
      ],
      generalApplication: L("Pour toute fonctionnalité, écrivez d’abord le comportement attendu, changez une seule chose, puis comparez l’état avant/après.", "For any feature, write the expected behavior first, change one thing, then compare the before and after states.", "في أي ميزة اكتب السلوك المتوقع أولًا، وغيّر شيئًا واحدًا، ثم قارن الحالة قبل التغيير وبعده."),
      lecomaxApplication: L("Ce workspace d’entraînement évite de toucher L’ecomax trop tôt; la quatrième leçon ouvrira ensuite le vrai dossier seulement après vérification de package.json.", "This practice workspace prevents touching L’ecomax too early; lesson four opens the real folder only after checking package.json.", "تمنع مساحة التدريب لمس L’ecomax مبكرًا؛ ثم يفتح الدرس الرابع المجلد الحقيقي فقط بعد التحقق من package.json."),
      commands: ["winget --version", "winget install --id Microsoft.VisualStudioCode --exact --source winget --accept-package-agreements --accept-source-agreements", "$courseRoot = Join-Path $HOME \"Documents\\lecomax-academy\"", "New-Item -ItemType Directory -Path $courseRoot -Force"],
      expectedResult: L("VS Code est installé et PowerShell affiche un dossier lecomax-academy contenant le journal Markdown créé.", "VS Code is installed and PowerShell shows a lecomax-academy folder containing the created Markdown log.", "يُثبّت VS Code ويعرض PowerShell مجلد lecomax-academy الذي يحتوي سجل Markdown المُنشأ."),
      commonErrors: [
        error(
          L("« winget » n’est pas reconnu.", "“winget” is not recognized.", "لا يتعرف النظام على «winget»."),
          L("App Installer est absent ou Windows est trop ancien pour fournir winget.", "App Installer is missing or Windows is too old to provide winget.", "تطبيق App Installer مفقود أو إصدار Windows قديم ولا يوفر winget."),
          L("Mettez App Installer à jour depuis Microsoft Store ou utilisez l’installateur officiel VS Code, puis rouvrez PowerShell.", "Update App Installer from Microsoft Store or use the official VS Code installer, then reopen PowerShell.", "حدّث App Installer من Microsoft Store أو استعمل مثبت VS Code الرسمي ثم أعد فتح PowerShell."),
        ),
        error(
          L("Une expérience ne permet pas de savoir quel changement a résolu le problème.", "An experiment does not reveal which change fixed the problem.", "لا توضح التجربة أي تغيير حل المشكلة."),
          L("Plusieurs fichiers ou commandes ont été modifiés en même temps.", "Several files or commands were changed at once.", "عُدلت عدة ملفات أو أوامر في الوقت نفسه."),
          L("Revenez à l’état initial et répétez avec une seule variable modifiée par essai.", "Return to the initial state and repeat with only one variable changed per attempt.", "ارجع إلى الحالة الأولية وكرر التجربة مع تغيير متغير واحد في كل محاولة."),
        ),
      ],
      exercise: {
        task: L("Créer un journal contenant un objectif, une prédiction, une commande, une observation et une conclusion.", "Create a log containing a goal, prediction, command, observation, and conclusion.", "أنشئ سجلًا يحتوي هدفًا وتوقعًا وأمرًا وملاحظة واستنتاجًا."),
        steps: [
          L("Exécutez setup.ps1 ligne par ligne dans PowerShell et lisez la sortie avant de continuer.", "Run setup.ps1 one line at a time in PowerShell and read each result before continuing.", "نفّذ setup.ps1 سطرًا بسطر في PowerShell واقرأ كل نتيجة قبل المتابعة."),
          L("Ouvrez learning-log.md et ajoutez votre prédiction sur la sortie de Get-Location.", "Open learning-log.md and add your prediction for the Get-Location output.", "افتح learning-log.md وأضف توقعك لمخرج Get-Location."),
          L("Exécutez Get-Location, recopiez le chemin utile et concluez si la prédiction était correcte.", "Run Get-Location, record the useful path, and conclude whether the prediction was correct.", "نفّذ Get-Location وسجل المسار المفيد ثم استنتج هل كان التوقع صحيحًا."),
        ],
        hints: [
          L("Un titre Markdown commence par #.", "A Markdown heading starts with #.", "يبدأ عنوان Markdown بالرمز #."),
          L("La conclusion doit expliquer ce que la sortie prouve, pas seulement la recopier.", "The conclusion should explain what the output proves, not merely repeat it.", "يجب أن يشرح الاستنتاج ما تثبته المخرجات لا أن يكررها فقط."),
        ],
        solutionExplanation: L("La solution sépare prédiction et observation afin que la comparaison révèle ce qui a réellement été appris.", "The solution separates prediction from observation so the comparison reveals what was actually learned.", "يفصل الحل بين التوقع والملاحظة كي تكشف المقارنة ما تعلمته فعلًا."),
        solutionCode: `$courseRoot = Join-Path $HOME "Documents/lecomax-academy"
Set-Location -LiteralPath $courseRoot
$path = (Get-Location).Path
$entry = @(
  "# Learning log",
  "",
  "## Goal",
  "Confirm the location of my practice workspace.",
  "",
  "## Prediction and observation",
  "Prediction: the path ends with lecomax-academy.",
  "Observation: $path",
  "Conclusion: the next relative command will run inside this workspace."
)
$entry | Set-Content -LiteralPath "academy-labs/00-tools/learning-log.md" -Encoding utf8
Get-Content -LiteralPath "academy-labs/00-tools/learning-log.md"`,
      },
      quiz: {
        question: L("Quelle action donne la meilleure preuve d’apprentissage ?", "Which action gives the best evidence of learning?", "أي إجراء يقدم أفضل دليل على التعلم؟"),
        options: [
          L("Relire dix fois une commande", "Read a command ten times", "قراءة الأمر عشر مرات"),
          L("Copier un tutoriel sans l’exécuter", "Copy a tutorial without running it", "نسخ درس من دون تشغيله"),
          L("Prédire, exécuter, observer et expliquer le résultat", "Predict, run, observe, and explain the result", "توقع النتيجة ثم نفّذ ولاحظ واشرح"),
          L("Changer plusieurs fichiers à la fois", "Change several files at once", "تغيير عدة ملفات معًا"),
        ],
        correctIndex: 2,
        explanation: L("Une prédiction comparée à une preuve observable force le cerveau à corriger son modèle mental.", "Comparing a prediction with observable evidence forces the brain to correct its mental model.", "تجبر مقارنة التوقع بدليل قابل للملاحظة الدماغ على تصحيح نموذجه الذهني."),
      },
      recap: L("apprendre signifie produire une prédiction, une expérience contrôlée et une conclusion vérifiable.", "learning means producing a prediction, a controlled experiment, and a verifiable conclusion.", "التعلم يعني إنتاج توقع وتجربة مضبوطة واستنتاج قابل للتحقق."),
      next: L("La prochaine leçon transforme la terminal en outil de navigation sûr.", "The next lesson turns the terminal into a safe navigation tool.", "يحوّل الدرس التالي الطرفية إلى أداة تنقل آمنة."),
    },
    {
      id: "lesson-00-02-terminal-files",
      order: 1,
      language: "powershell",
      filename: "academy-labs/00-tools/terminal-practice.ps1",
      source: `$courseRoot = Join-Path $HOME "Documents\\lecomax-academy"
Set-Location -LiteralPath $courseRoot
Get-Location
Get-ChildItem -Name

Set-Location -LiteralPath "academy-labs\\00-tools"
Get-ChildItem -File -Name
Set-Location -LiteralPath $courseRoot

$logPath = Resolve-Path -LiteralPath "academy-labs\\00-tools\\learning-log.md"
$logPath
Get-Content -LiteralPath $logPath -TotalCount 12`,
      annotations: [
        { lines: "1-4", label: L("Calculer une adresse absolue stable, s’y placer puis observer sans modifier.", "Compute a stable absolute address, enter it, then inspect without changing anything.", "احسب عنوانًا مطلقًا ثابتًا وانتقل إليه ثم افحص بلا تغيير.") },
        { lines: "6-8", label: L("Entrer dans un sous-dossier puis revenir avec le chemin absolu mémorisé.", "Enter a child folder, then return with the remembered absolute path.", "ادخل مجلدًا فرعيًا ثم ارجع بالمسار المطلق المحفوظ.") },
        { lines: "10-12", label: L("Établir le chemin absolu du journal avant de lire son contenu.", "Resolve the log to an absolute path before reading its contents.", "حوّل مسار السجل إلى مسار مطلق قبل قراءة محتواه.") },
      ],
      title: L("Naviguer avec PowerShell sans se perdre", "Navigate safely with PowerShell", "تنقّل بأمان عبر PowerShell"),
      prerequisite: L("Avoir terminé la première leçon et disposer de Documents\\lecomax-academy; L’ecomax n’est pas encore requis.", "Have completed lesson one and have Documents\\lecomax-academy; L’ecomax is not required yet.", "أكمل الدرس الأول وتأكد من وجود Documents\\lecomax-academy؛ لا يلزم L’ecomax بعد."),
      objectives: [L("les chemins absolus et relatifs", "absolute and relative paths", "المسارات المطلقة والنسبية"), L("des commandes de lecture sûres avant toute modification", "safe read commands before any modification", "أوامر قراءة آمنة قبل أي تعديل")],
      mentalModel: L("La terminal possède toujours un dossier courant; chaque chemin relatif part de ce point, tandis qu’un chemin absolu nomme l’emplacement complet. Une commande agit sur la cible obtenue après cette résolution.", "The terminal always has a current directory; every relative path starts there, while an absolute path names the full location. A command acts on the target obtained after that resolution.", "للطرفية دائمًا مجلد حالي؛ يبدأ منه كل مسار نسبي، بينما يحدد المسار المطلق الموقع كاملًا. ينفذ الأمر عمله على الهدف الناتج بعد حل المسار."),
      analogy: L("Le dossier courant est votre position sur une carte; « .. » remonte d’une rue et un chemin absolu donne l’adresse complète.", "The current directory is your position on a map; “..” goes up one street and an absolute path gives the full address.", "المجلد الحالي هو موقعك على الخريطة؛ تعود «..» شارعًا إلى الخلف ويعطي المسار المطلق العنوان كاملًا."),
      explanation: [
        L("Get-Location répond à « où suis-je ? » et Get-ChildItem répond à « qu’y a-t-il ici ? ». Exécutez-les ensemble avant une commande dépendante du chemin.", "Get-Location answers “where am I?” and Get-ChildItem answers “what is here?”. Run them together before a path-dependent command.", "يجيب Get-Location عن «أين أنا؟» ويجيب Get-ChildItem عن «ماذا يوجد هنا؟». شغلهما معًا قبل أي أمر يعتمد على المسار."),
        L("Set-Location change uniquement le contexte de la terminal, pas les fichiers. -LiteralPath demande à PowerShell de traiter les caractères du chemin tels quels, ce qui est important pour les espaces et apostrophes.", "Set-Location changes only terminal context, not files. -LiteralPath tells PowerShell to treat path characters literally, which matters for spaces and apostrophes.", "يغيّر Set-Location سياق الطرفية فقط ولا يغيّر الملفات. ويطلب ‎-LiteralPath من PowerShell معاملة رموز المسار حرفيًا، وهذا مهم مع المسافات والفواصل العليا."),
        L("Resolve-Path permet de confirmer une cible avant de la lire ou de la modifier. Cette vérification est essentielle dès qu’une commande peut écrire, déplacer ou supprimer.", "Resolve-Path confirms a target before reading or modifying it. This check is essential whenever a command can write, move, or delete.", "يؤكد Resolve-Path الهدف قبل قراءته أو تعديله. يصبح هذا الفحص ضروريًا عندما يستطيع الأمر الكتابة أو النقل أو الحذف."),
      ],
      vocabulary: [
        v("current directory", "Emplacement utilisé comme départ des chemins relatifs.", "Location used as the starting point for relative paths.", "الموقع المستخدم كنقطة بداية للمسارات النسبية."),
        v("absolute path", "Adresse complète depuis la racine du disque.", "Complete address from the drive root.", "العنوان الكامل بدءًا من جذر القرص."),
        v("relative path", "Adresse calculée depuis le dossier courant.", "Address calculated from the current directory.", "عنوان يُحسب انطلاقًا من المجلد الحالي."),
      ],
      generalApplication: L("Inspectez d’abord, résolvez ensuite la cible exacte, puis seulement après lancez une commande qui écrit.", "Inspect first, resolve the exact target next, and only then run a command that writes.", "افحص أولًا، ثم تحقق من الهدف الدقيق، وبعد ذلك فقط شغّل أمرًا يكتب."),
      lecomaxApplication: L("Vous réutiliserez cette séquence dans L’ecomax pour distinguer app, components, lib et public sans modifier leurs fichiers.", "You will reuse this sequence in L’ecomax to distinguish app, components, lib, and public without changing their files.", "ستعيد استعمال هذا التسلسل في L’ecomax للتمييز بين app وcomponents وlib وpublic من دون تغيير ملفاتها."),
      commands: ["$courseRoot = Join-Path $HOME \"Documents\\lecomax-academy\"", "Set-Location -LiteralPath $courseRoot", "Get-ChildItem -LiteralPath academy-labs -Name", "Resolve-Path -LiteralPath academy-labs\\00-tools\\learning-log.md"],
      expectedResult: L("vous entrez dans 00-tools, revenez exactement à la racine et lisez le journal sans modifier aucun fichier.", "you enter 00-tools, return exactly to the root, and read the log without changing any file.", "تدخل 00-tools ثم تعود بدقة إلى الجذر وتقرأ السجل بلا تعديل أي ملف."),
      commonErrors: [
        error(L("PowerShell indique que le chemin est introuvable.", "PowerShell says the path cannot be found.", "يذكر PowerShell أنه لم يعثر على المسار."), L("Le chemin relatif part d’un autre dossier courant que prévu.", "The relative path starts from a different current directory than expected.", "يبدأ المسار النسبي من مجلد حالي مختلف عن المتوقع."), L("Exécutez Get-Location, puis utilisez Resolve-Path ou un chemin absolu entre guillemets.", "Run Get-Location, then use Resolve-Path or a quoted absolute path.", "شغّل Get-Location ثم استعمل Resolve-Path أو مسارًا مطلقًا بين علامتي اقتباس.")),
        error(L("Un chemin avec apostrophe ou crochets est interprété de travers.", "A path containing an apostrophe or brackets is interpreted incorrectly.", "يُفسر مسار يحتوي فاصلة عليا أو أقواسًا بشكل خاطئ."), L("Un paramètre générique traite certains caractères comme des motifs.", "A wildcard-aware parameter treats some characters as patterns.", "يعامل معامل يدعم الأنماط بعض الرموز كأنها نمط بحث."), L("Passez une chaîne correctement citée à -LiteralPath.", "Pass a correctly quoted string to -LiteralPath.", "مرّر نصًا مقتبسًا بطريقة صحيحة إلى ‎-LiteralPath.")),
      ],
      exercise: {
        task: L("Produire une carte texte du workspace d’entraînement sans changer de fichier ni dépendre de L’ecomax.", "Produce a text map of the practice workspace without changing a file or depending on L’ecomax.", "أنشئ خريطة نصية لمساحة التدريب من دون تغيير ملف أو الاعتماد على L’ecomax."),
        steps: [L("Placez-vous dans lecomax-academy et confirmez la racine avec Get-Location.", "Enter lecomax-academy and confirm the root with Get-Location.", "انتقل إلى lecomax-academy وأكد الجذر عبر Get-Location."), L("Listez academy-labs puis academy-labs\\00-tools sans changer de dossier.", "List academy-labs and academy-labs\\00-tools without changing directory.", "اعرض academy-labs ثم academy-labs\\00-tools من دون تغيير المجلد."), L("Résolvez le journal, lisez son titre et comparez son chemin relatif au chemin absolu.", "Resolve the log, read its heading, and compare its relative path with the absolute path.", "حوّل مسار السجل واقرأ عنوانه وقارن مساره النسبي بالمسار المطلق.")],
        hints: [L("Get-ChildItem accepte -LiteralPath sans changer de dossier.", "Get-ChildItem accepts -LiteralPath without changing directory.", "يقبل Get-ChildItem الخيار ‎-LiteralPath من دون تغيير المجلد."), L("Ajoutez -Name pour une sortie plus lisible.", "Add -Name for cleaner output.", "أضف ‎-Name للحصول على مخرجات أوضح.")],
        solutionExplanation: L("La solution garde une position stable et passe chaque dossier comme cible explicite, ce qui rend les commandes indépendantes entre elles.", "The solution keeps a stable position and passes each folder as an explicit target, making commands independent.", "يحافظ الحل على موقع ثابت ويمرر كل مجلد كهدف صريح، فتظل الأوامر مستقلة."),
        solutionCode: `$courseRoot = Join-Path $HOME "Documents\\lecomax-academy"
Set-Location -LiteralPath $courseRoot
Get-Location
Get-ChildItem -LiteralPath "academy-labs" -Name
Get-ChildItem -LiteralPath "academy-labs\\00-tools" -Name
$logPath = Resolve-Path -LiteralPath "academy-labs\\00-tools\\learning-log.md"
$logPath
Get-Content -LiteralPath $logPath -TotalCount 1`,
      },
      quiz: {
        question: L("Depuis le workspace, que désigne academy-labs/00-tools ?", "From the workspace, what does academy-labs/00-tools represent?", "ماذا يمثل academy-labs/00-tools عند الانطلاق من مساحة العمل؟"),
        options: [L("Un chemin absolu", "An absolute path", "مسار مطلق"), L("Un chemin relatif", "A relative path", "مسار نسبي"), L("Une URL Internet", "An Internet URL", "رابط إنترنت"), L("Une variable PowerShell", "A PowerShell variable", "متغير PowerShell")],
        correctIndex: 1,
        explanation: L("Il ne contient ni lecteur ni racine complète; PowerShell le résout depuis le dossier courant.", "It contains neither a drive nor a full root, so PowerShell resolves it from the current directory.", "لا يحتوي حرف القرص ولا جذرًا كاملًا، لذلك يحله PowerShell انطلاقًا من المجلد الحالي."),
      },
      recap: L("toute commande de fichier dépend d’une cible résolue à partir du dossier courant.", "every file command depends on a target resolved from the current directory.", "يعتمد كل أمر ملفات على هدف يُحل انطلاقًا من المجلد الحالي."),
      next: L("La prochaine leçon relie ces fichiers aux fonctions essentielles de VS Code.", "The next lesson connects these files to essential VS Code features.", "يربط الدرس التالي هذه الملفات بوظائف VS Code الأساسية."),
    },
    {
      id: "lesson-00-03-vscode",
      order: 2,
      language: "markdown",
      filename: "academy-labs/00-tools/vscode-map.md",
      source: `# VS Code map

## Navigate
- Ctrl+P: open a file by name
- Ctrl+Shift+F: search every file in the workspace
- Ctrl+Shift+P: run an editor command

## Understand code
- F12: go to a symbol definition
- Shift+F12: find every reference
- Ctrl+Shift+M: open the Problems panel`,
      annotations: [
        { lines: "1-5", label: L("Ctrl+P vise un nom; Ctrl+Shift+F vise un texte dans tout le workspace.", "Ctrl+P targets a name; Ctrl+Shift+F targets text across the workspace.", "يستهدف Ctrl+P اسمًا؛ ويستهدف Ctrl+Shift+F نصًا في مساحة العمل كلها.") },
        { lines: "6", label: L("La palette donne accès aux actions même sans connaître leur raccourci.", "The Command Palette exposes actions even when you do not know their shortcut.", "تتيح لوحة الأوامر الإجراءات حتى إن لم تعرف اختصارها.") },
        { lines: "8-11", label: L("Définitions, références et diagnostics relient une ligne au reste du programme.", "Definitions, references, and diagnostics connect one line to the rest of the program.", "تربط التعريفات والمراجع والتشخيصات السطر ببقية البرنامج.") },
      ],
      title: L("Lire et modifier efficacement dans VS Code", "Read and edit efficiently in VS Code", "اقرأ وعدّل بكفاءة داخل VS Code"),
      prerequisite: L("Avoir installé VS Code à la leçon 1 et savoir retrouver lecomax-academy avec PowerShell.", "Have installed VS Code in lesson one and know how to locate lecomax-academy with PowerShell.", "ثبّت VS Code في الدرس الأول وتعلّم العثور على lecomax-academy بواسطة PowerShell."),
      objectives: [L("l’Explorateur, la recherche globale et la palette de commandes", "Explorer, global search, and the Command Palette", "المستكشف والبحث الشامل ولوحة الأوامر"), L("la lecture des symboles, erreurs et différences avant sauvegarde", "reading symbols, errors, and differences before saving", "قراءة الرموز والأخطاء والفروق قبل الحفظ")],
      mentalModel: L("VS Code est une vue structurée du workspace : l’Explorateur montre où vit le code, la recherche montre où un concept est utilisé, et le panneau Problems relie un diagnostic à une ligne précise.", "VS Code is a structured view of the workspace: Explorer shows where code lives, Search shows where a concept is used, and Problems connects a diagnostic to an exact line.", "VS Code عرض منظم لمساحة العمل: يوضح المستكشف مكان الشفرة، ويبين البحث أين يُستعمل مفهوم، وتربط لوحة Problems التشخيص بسطر محدد."),
      analogy: L("C’est un atelier : l’Explorateur est l’étagère, la palette est la boîte à outils et Problems est le tableau de contrôle qualité.", "It is a workshop: Explorer is the shelf, the palette is the toolbox, and Problems is the quality-control board.", "إنه ورشة: المستكشف هو الرف، ولوحة الأوامر صندوق الأدوات، وProblems لوحة مراقبة الجودة."),
      explanation: [
        L("Utilisez Ctrl+P pour ouvrir un fichier par son nom et Ctrl+Shift+F pour rechercher un texte dans tout le projet. Cette navigation par intention est plus fiable qu’une longue exploration manuelle.", "Use Ctrl+P to open a file by name and Ctrl+Shift+F to search text across the project. Intention-based navigation is more reliable than long manual browsing.", "استعمل Ctrl+P لفتح ملف باسمه وCtrl+Shift+F للبحث عن نص في المشروع كله. التنقل حسب الهدف أوثق من التصفح اليدوي الطويل."),
        L("Le survol d’un symbole TypeScript affiche son type, F12 ouvre sa définition et Shift+F12 trouve ses usages. Suivez ces liens pour comprendre le flux réel avant de modifier une fonction partagée.", "Hovering a TypeScript symbol shows its type, F12 opens its definition, and Shift+F12 finds usages. Follow these links to understand the real flow before changing a shared function.", "يعرض تمرير المؤشر فوق رمز TypeScript نوعه، ويفتح F12 تعريفه، ويعثر Shift+F12 على استعمالاته. اتبع هذه الروابط لفهم التدفق الحقيقي قبل تعديل دالة مشتركة."),
        L("Après une modification, lisez Problems puis l’onglet Source Control pour examiner les lignes changées. Enregistrez seulement une édition comprise et vérifiez que les diagnostics associés disparaissent.", "After a change, inspect Problems and then Source Control to review changed lines. Save only an understood edit and verify related diagnostics disappear.", "بعد التعديل افحص Problems ثم Source Control لمراجعة الأسطر المتغيرة. احفظ تعديلًا تفهمه فقط وتأكد من اختفاء التشخيصات المرتبطة."),
      ],
      vocabulary: [
        v("workspace", "Ensemble de dossiers indexés ensemble par l’éditeur.", "Set of folders indexed together by the editor.", "مجموعة مجلدات يفهرسها المحرر معًا."),
        v("symbol", "Élément nommé du code, comme une fonction, un type ou une variable.", "Named code element such as a function, type, or variable.", "عنصر مسمى في الشفرة مثل دالة أو نوع أو متغير."),
        v("diagnostic", "Message localisé indiquant une erreur, un avertissement ou une suggestion.", "Localized message reporting an error, warning, or suggestion.", "رسالة مرتبطة بموقع توضح خطأ أو تحذيرًا أو اقتراحًا."),
      ],
      generalApplication: L("Recherchez d’abord les définitions et usages d’un symbole partagé afin d’évaluer l’impact de votre changement.", "Search definitions and usages of a shared symbol first to assess the impact of a change.", "ابحث أولًا عن تعريفات الرمز المشترك واستعمالاته لتقييم أثر التغيير."),
      lecomaxApplication: L("Quand L’ecomax sera ouvert à la prochaine leçon, Ctrl+P trouvera package.json et Shift+F12 montrera les usages d’un symbole avant toute modification.", "When L’ecomax opens in the next lesson, Ctrl+P will find package.json and Shift+F12 will show a symbol’s usages before any change.", "عند فتح L’ecomax في الدرس التالي سيعثر Ctrl+P على package.json وسيعرض Shift+F12 استعمالات الرمز قبل أي تعديل."),
      commands: ["code --version", "code \"$HOME\\Documents\\lecomax-academy\"", "code \"$HOME\\Documents\\lecomax-academy\\academy-labs\\00-tools\\learning-log.md\""],
      expectedResult: L("VS Code affiche une version, ouvre le bon workspace et Ctrl+P retrouve learning-log.md sans parcourir manuellement les dossiers.", "VS Code prints a version, opens the correct workspace, and Ctrl+P finds learning-log.md without manual folder browsing.", "يعرض VS Code إصدارًا ويفتح مساحة العمل الصحيحة ويعثر Ctrl+P على learning-log.md بلا تصفح يدوي للمجلدات."),
      commonErrors: [
        error(L("La recherche ne trouve qu’un fichier déjà ouvert.", "Search finds only the currently open file.", "يعثر البحث على الملف المفتوح فقط."), L("Ctrl+F a été utilisé au lieu de la recherche globale.", "Ctrl+F was used instead of global search.", "استُعمل Ctrl+F بدل البحث الشامل."), L("Utilisez Ctrl+Shift+F et vérifiez que le dossier racine est bien le workspace.", "Use Ctrl+Shift+F and verify the root folder is the workspace.", "استعمل Ctrl+Shift+F وتأكد أن مجلد الجذر هو مساحة العمل.")),
        error(L("« code » n’est pas reconnu après l’installation.", "“code” is not recognized after installation.", "لا يتعرف النظام على «code» بعد التثبيت."), L("La terminal ouverte avant l’installation n’a pas rechargé PATH, ou l’option PATH était désactivée.", "The terminal opened before installation did not reload PATH, or the PATH option was disabled.", "لم تعد الطرفية المفتوحة قبل التثبيت تحميل PATH أو كان خيار PATH معطلًا."), L("Fermez toutes les terminals, rouvrez PowerShell et lancez code --version; sinon réparez l’installation en activant Add to PATH.", "Close every terminal, reopen PowerShell, and run code --version; otherwise repair the installation with Add to PATH enabled.", "أغلق كل الطرفيات وأعد فتح PowerShell ثم نفّذ code --version؛ وإلا فأصلح التثبيت مع تفعيل Add to PATH.")),
      ],
      exercise: {
        task: L("Ouvrir le workspace sans souris, retrouver le journal et consigner six raccourcis avec leur preuve.", "Open the workspace without the mouse, find the log, and record six shortcuts with evidence.", "افتح مساحة العمل بلا فأرة واعثر على السجل ودوّن ستة اختصارات مع دليلها."),
        steps: [L("Ouvrez lecomax-academy avec la commande code et utilisez Ctrl+P pour ouvrir learning-log.md.", "Open lecomax-academy with the code command and use Ctrl+P to open learning-log.md.", "افتح lecomax-academy بأمر code واستعمل Ctrl+P لفتح learning-log.md."), L("Recherchez « Conclusion » avec Ctrl+Shift+F puis ouvrez la palette avec Ctrl+Shift+P.", "Search for “Conclusion” with Ctrl+Shift+F, then open the palette with Ctrl+Shift+P.", "ابحث عن «Conclusion» بواسطة Ctrl+Shift+F ثم افتح اللوحة بواسطة Ctrl+Shift+P."), L("Ajoutez les six raccourcis du fichier vscode-map.md et la preuve observée pour chacun.", "Add the six shortcuts from vscode-map.md and the evidence observed for each.", "أضف الاختصارات الستة من vscode-map.md والدليل الملاحظ لكل منها.")],
        hints: [L("Ctrl+P ouvre un fichier par son nom, sans parcourir l’Explorateur.", "Ctrl+P opens a file by name without browsing Explorer.", "يفتح Ctrl+P الملف باسمه من دون تصفح Explorer."), L("Ctrl+Shift+P permet de chercher une action par des mots.", "Ctrl+Shift+P lets you search for an action by words.", "يتيح Ctrl+Shift+P البحث عن إجراء بالكلمات."),
        ],
        solutionExplanation: L("La carte relie chaque raccourci à une observation concrète; vous pourrez donc retrouver l’outil par son intention au lieu de le mémoriser sans contexte.", "The map connects every shortcut to concrete evidence, so you can retrieve a tool by intent instead of memorizing it without context.", "تربط الخريطة كل اختصار بدليل ملموس، فيمكنك استرجاع الأداة بحسب الهدف بدل حفظها بلا سياق."),
        solutionCode: `# VS Code evidence map

- Ctrl+P: opened learning-log.md by filename.
- Ctrl+Shift+F: found "Conclusion" across the workspace.
- Ctrl+Shift+P: opened the Command Palette.
- F12: will open a code symbol definition in L'ecomax.
- Shift+F12: will list every reference to that symbol.
- Ctrl+Shift+M: opened the Problems panel.`,
      },
      quiz: {
        question: L("Quel outil montre tous les usages d’un symbole TypeScript ?", "Which tool shows all usages of a TypeScript symbol?", "أي أداة تعرض كل استعمالات رمز TypeScript؟"),
        options: [L("Ctrl+S", "Ctrl+S", "Ctrl+S"), L("Shift+F12", "Shift+F12", "Shift+F12"), L("Alt+F4", "Alt+F4", "Alt+F4"), L("Ctrl+Z", "Ctrl+Z", "Ctrl+Z")],
        correctIndex: 1,
        explanation: L("Shift+F12 lance Find All References et révèle l’impact potentiel d’une modification.", "Shift+F12 runs Find All References and reveals the potential impact of a change.", "يشغّل Shift+F12 البحث عن كل المراجع ويكشف الأثر المحتمل للتعديل."),
      },
      recap: L("l’éditeur relie fichiers, symboles, diagnostics et différences pour rendre un changement compréhensible.", "the editor connects files, symbols, diagnostics, and diffs to make a change understandable.", "يربط المحرر الملفات والرموز والتشخيصات والفروق ليجعل التغيير مفهومًا."),
      next: L("La prochaine leçon installe et utilise le moteur Node.js et le gestionnaire npm.", "The next lesson installs and uses the Node.js runtime and npm package manager.", "يثبت الدرس التالي بيئة Node.js ومدير الحزم npm ويستعملهما."),
    },
    {
      id: "lesson-00-04-node-npm",
      order: 3,
      language: "powershell",
      filename: "academy-labs/00-tools/setup-node.ps1",
      source: `winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements
node --version
npm --version
where.exe node

if (-not (Test-Path -LiteralPath "package.json")) { throw "Open a terminal in the L'ecomax root first." }
if (-not (Test-Path -LiteralPath "package-lock.json")) { throw "package-lock.json is required for npm ci." }
npm ci
npm run build
npm run dev`,
      annotations: [
        { lines: "1-4", label: L("Installer Node.js LTS puis prouver versions et chemin réel dans PATH.", "Install Node.js LTS, then prove the versions and actual PATH location.", "ثبّت Node.js LTS ثم أثبت الإصدارات والموقع الحقيقي في PATH.") },
        { lines: "6-7", label: L("Refuser de continuer tant que la terminal n’est pas dans la racine L’ecomax verrouillée.", "Refuse to continue until the terminal is in the locked L’ecomax root.", "ارفض المتابعة حتى تكون الطرفية في جذر L’ecomax الذي يحتوي ملف القفل.") },
        { lines: "8-10", label: L("Installer exactement le verrou, valider la production, puis seulement lancer la boucle dev.", "Install the exact lock, validate production, and only then start the dev loop.", "ثبّت القفل بدقة وتحقق من الإنتاج ثم شغّل دورة التطوير.") },
      ],
      title: L("Comprendre Node.js, npm et les scripts", "Understand Node.js, npm, and scripts", "افهم Node.js وnpm والأوامر النصية"),
      prerequisite: L("Avoir VS Code et PowerShell prêts. Téléchargez l’archive ZIP fournie de L’ecomax, extrayez-la, ouvrez le dossier extrait dans VS Code puis Terminal → New Terminal.", "Have VS Code and PowerShell ready. Download the supplied L’ecomax ZIP, extract it, open the extracted folder in VS Code, then choose Terminal → New Terminal.", "جهّز VS Code وPowerShell. نزّل أرشيف ZIP المُعطى لـL’ecomax وفكه وافتح المجلد المستخرج في VS Code ثم اختر Terminal → New Terminal."),
      objectives: [L("la différence entre runtime, package manager et dépendance", "the difference between runtime, package manager, and dependency", "الفرق بين بيئة التشغيل ومدير الحزم والاعتمادية"), L("les flux npm ci, npm run dev et npm run build", "the npm ci, npm run dev, and npm run build workflows", "مسارات npm ci وnpm run dev وnpm run build")],
      mentalModel: L("Node.js exécute JavaScript hors du navigateur, npm installe l’arbre de paquets décrit par package.json et package-lock.json, puis un script npm lance un outil local dans un environnement reproductible.", "Node.js runs JavaScript outside the browser, npm installs the package tree described by package.json and package-lock.json, and an npm script launches a local tool in a reproducible environment.", "ينفذ Node.js جافاسكربت خارج المتصفح، ويثبت npm شجرة الحزم التي يصفها package.json وpackage-lock.json، ثم يشغّل npm script أداة محلية داخل بيئة قابلة للتكرار."),
      analogy: L("Node.js est le moteur, package.json la liste de pièces, package-lock le plan exact et npm le mécanicien qui assemble le tout.", "Node.js is the engine, package.json the parts list, package-lock the exact blueprint, and npm the mechanic assembling everything.", "Node.js هو المحرك، وpackage.json قائمة القطع، وpackage-lock المخطط الدقيق، وnpm الميكانيكي الذي يركبها."),
      explanation: [
        L("node --version confirme quelle version du runtime répond dans cette terminal. Une version incompatible peut faire échouer un projet avant même que votre code soit lu.", "node --version confirms which runtime version answers in this terminal. An incompatible version can fail a project before your code is even read.", "يؤكد node --version إصدار بيئة التشغيل الذي تستعمله هذه الطرفية. قد يفشل إصدار غير متوافق قبل أن تُقرأ شفرتك أصلًا."),
        L("npm ci respecte exactement package-lock.json et convient à une installation propre; npm install peut recalculer et mettre à jour le verrou lorsqu’on ajoute une dépendance. Le verrou garantit la même résolution sur chaque machine.", "npm ci follows package-lock.json exactly and suits a clean install; npm install may recalculate and update the lock when adding a dependency. The lock guarantees the same resolution on every machine.", "يلتزم npm ci تمامًا بملف package-lock.json ويلائم التثبيت النظيف؛ وقد يعيد npm install الحساب ويحدّث القفل عند إضافة اعتمادية. يضمن القفل الحل نفسه على كل جهاز."),
        L("npm run dev privilégie le retour rapide et reste actif, tandis que npm run build compile et valide le résultat de production. Une page visible en développement ne prouve donc pas qu’elle peut être déployée.", "npm run dev favors fast feedback and stays active, whereas npm run build compiles and validates production output. A page visible in development therefore does not prove it can be deployed.", "يعطي npm run dev أولوية للتغذية الراجعة السريعة ويظل نشطًا، بينما يبني npm run build مخرجات الإنتاج ويتحقق منها. لذلك لا تثبت صفحة تعمل في التطوير أنها قابلة للنشر."),
      ],
      vocabulary: [
        v("runtime", "Programme qui charge et exécute le code.", "Program that loads and executes code.", "برنامج يحمّل الشفرة وينفذها."),
        v("dependency", "Paquet externe utilisé par le projet avec une version déclarée.", "External package used by the project with a declared version.", "حزمة خارجية يستعملها المشروع بإصدار معلن."),
        v("lockfile", "Fichier enregistrant les versions exactes de tout l’arbre de paquets.", "File recording exact versions for the entire package tree.", "ملف يسجل الإصدارات الدقيقة لشجرة الحزم كلها."),
      ],
      generalApplication: L("Conservez le lockfile, utilisez les scripts du projet et lisez la première erreur utile plutôt que les dernières lignes répétitives.", "Keep the lockfile, use project scripts, and read the first useful error instead of repetitive final lines.", "احتفظ بملف القفل واستعمل أوامر المشروع واقرأ أول خطأ مفيد بدل الأسطر الأخيرة المتكررة."),
      lecomaxApplication: L("L’ecomax utilise Next.js; npm run dev fournit l’URL locale et npm run build vérifie routes, types et rendu destinés à Vercel.", "L’ecomax uses Next.js; npm run dev provides the local URL and npm run build checks routes, types, and rendering intended for Vercel.", "يستعمل L’ecomax إطار Next.js؛ يوفر npm run dev الرابط المحلي ويفحص npm run build المسارات والأنواع والتصيير المعد للنشر على Vercel."),
      commands: ["winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements", "node --version", "npm --version", "Test-Path -LiteralPath package.json", "npm ci", "npm run build", "npm run dev"],
      expectedResult: L("les versions s’affichent, les dépendances verrouillées s’installent, le serveur annonce une URL locale et le build se termine sans erreur.", "versions print, locked dependencies install, the server announces a local URL, and the build completes without errors.", "تظهر الإصدارات وتُثبت الاعتماديات المقفلة ويعلن الخادم رابطًا محليًا وينتهي البناء بلا أخطاء."),
      commonErrors: [
        error(L("« node » ou « npm » n’est pas reconnu.", "“node” or “npm” is not recognized.", "لا يتعرف النظام على «node» أو «npm»."), L("Node.js n’est pas installé ou sa localisation manque dans PATH.", "Node.js is not installed or its location is missing from PATH.", "لم يُثبت Node.js أو أن موقعه غير موجود في PATH."), L("Installez une version LTS, fermez puis rouvrez la terminal et vérifiez avec where.exe node.", "Install an LTS version, reopen the terminal, and verify with where.exe node.", "ثبت إصدار LTS ثم أغلق الطرفية وافتحها وتحقق عبر where.exe node.")),
        error(L("npm ci refuse de continuer car le verrou ne correspond pas.", "npm ci refuses because the lockfile does not match.", "يرفض npm ci المتابعة لأن ملف القفل غير متطابق."), L("package.json a changé sans mise à jour cohérente de package-lock.json.", "package.json changed without a consistent package-lock.json update.", "تغير package.json من دون تحديث متسق لـpackage-lock.json."), L("Vérifiez le diff; si l’ajout est voulu, exécutez npm install une fois puis validez les deux fichiers.", "Review the diff; if the addition is intended, run npm install once and validate both files.", "راجع الفرق؛ إن كانت الإضافة مقصودة شغّل npm install مرة ثم تحقق من الملفين.")),
      ],
      exercise: {
        task: L("Démarrer L’ecomax localement, identifier l’URL et arrêter proprement le serveur.", "Start L’ecomax locally, identify the URL, and stop the server cleanly.", "شغّل L’ecomax محليًا وحدد الرابط وأوقف الخادم بطريقة سليمة."),
        steps: [L("Installez Node LTS, rouvrez la terminal et vérifiez node, npm, package.json et package-lock.json.", "Install Node LTS, reopen the terminal, and verify node, npm, package.json, and package-lock.json.", "ثبّت Node LTS وأعد فتح الطرفية وتحقق من node وnpm وpackage.json وpackage-lock.json."), L("Exécutez npm ci puis npm run build; ne passez à dev que si les deux se terminent sans erreur.", "Run npm ci and then npm run build; continue to dev only if both finish without error.", "نفّذ npm ci ثم npm run build؛ ولا تنتقل إلى dev إلا إذا انتهى الأمران بلا خطأ."), L("Lancez npm run dev, ouvrez exactement l’URL Local imprimée, puis revenez à la terminal et arrêtez avec Ctrl+C.", "Run npm run dev, open the exact printed Local URL, then return to the terminal and stop with Ctrl+C.", "شغّل npm run dev وافتح رابط Local المطبوع بدقة ثم ارجع إلى الطرفية وأوقفه بـCtrl+C.")],
        hints: [L("Le serveur reste volontairement actif après le message Ready.", "The server intentionally stays active after Ready.", "يبقى الخادم نشطًا عمدًا بعد رسالة Ready."), L("Si le port 3000 est occupé, Next.js peut proposer 3001.", "If port 3000 is busy, Next.js may offer 3001.", "إذا كان المنفذ 3000 مشغولًا فقد يقترح Next.js المنفذ 3001.")],
        solutionExplanation: L("La séquence vérifie les outils, lance le script déclaré, observe la preuve navigateur puis libère le port avec une interruption contrôlée.", "The sequence verifies tools, launches the declared script, observes browser evidence, and releases the port with a controlled interrupt.", "يتحقق التسلسل من الأدوات ويشغّل الأمر المعلن ويراقب دليل المتصفح ثم يحرر المنفذ بإيقاف مضبوط."),
        solutionCode: `node --version
npm --version
Test-Path -LiteralPath package.json
Test-Path -LiteralPath package-lock.json
npm ci
npm run build
npm run dev`,
      },
      quiz: {
        question: L("Pourquoi npm run build reste nécessaire après un test en développement ?", "Why is npm run build still necessary after a development test?", "لماذا يبقى npm run build ضروريًا بعد اختبار التطوير؟"),
        options: [L("Il change les couleurs", "It changes colors", "لأنه يغير الألوان"), L("Il valide la compilation et le rendu de production", "It validates production compilation and rendering", "لأنه يتحقق من بناء الإنتاج وتصييره"), L("Il installe VS Code", "It installs VS Code", "لأنه يثبت VS Code"), L("Il remplace Git", "It replaces Git", "لأنه يستبدل Git")],
        correctIndex: 1,
        explanation: L("Le mode production applique des contrôles et chemins de compilation que la boucle dev rapide ne prouve pas entièrement.", "Production mode applies checks and compilation paths that the fast dev loop does not fully prove.", "يطبق وضع الإنتاج فحوصًا ومسارات بناء لا تثبتها دورة التطوير السريعة بالكامل."),
      },
      recap: L("Node exécute, npm résout les paquets, les scripts normalisent les commandes et le build valide la production.", "Node executes, npm resolves packages, scripts standardize commands, and the build validates production.", "ينفذ Node الشفرة ويحل npm الحزم وتوحّد scripts الأوامر ويتحقق build من الإنتاج."),
      next: L("Le module suivant explique ce qui se passe entre l’URL locale et la page reçue par le navigateur.", "The next module explains what happens between the local URL and the page received by the browser.", "تشرح الوحدة التالية ما يحدث بين الرابط المحلي والصفحة التي يستقبلها المتصفح."),
    },
  ],
});

modulesBlueprint.push({
  id: "module-08-dom-forms-storage", order: 8, icon: "🖱️", color: "#EC4899",
  files: [{ path: "components/SearchOverlay.tsx", mode: "existing" }, { path: "academy-labs/08-browser/catalog.html", mode: "create" }],
  title: L("DOM, événements, formulaires et localStorage", "DOM, events, forms, and localStorage", "DOM والأحداث والنماذج وlocalStorage"),
  summary: L("Relier la logique à l’interface, déléguer les événements, valider une soumission, sérialiser un état local et construire un composant accessible complet.", "Connect logic to UI, delegate events, validate submission, serialize local state, and build a complete accessible component.", "اربط المنطق بالواجهة وفوض الأحداث وتحقق من الإرسال وسلسل حالة محلية وابنِ مكونًا متاحًا كاملًا."),
  lessons: [
    rapidLesson({ id:"lesson-08-01-dom-events",order:0,language:"html",filename:"academy-labs/08-browser/dom-events.html",
      source:`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Délégation DOM</title></head>
<body><main><h1>Produits</h1>
  <ul data-product-list><li>Casque <button type="button" data-product-id="p1"><span aria-hidden="true">+</span> Ajouter</button></li></ul>
  <p id="cart-status" role="status"></p>
</main><script>
const list = document.querySelector("[data-product-list]");
const status = document.querySelector("#cart-status");
list.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target ? target.closest("button[data-product-id]") : null;
  if (!button || !list.contains(button)) return;
  status.textContent = "Produit " + button.dataset.productId + " ajouté.";
});
</script></body></html>`,
      title:L("DOM, sélection et propagation des événements","DOM, selection, and event propagation","DOM والاختيار وانتشار الأحداث"),
      concept:L("Le DOM est l’arbre d’objets vivant construit depuis HTML; JavaScript lit ou modifie ses nœuds. Un événement part d’une cible et remonte par les ancêtres, ce qui permet à un écouteur stable de gérer des descendants dynamiques.","The DOM is the live object tree built from HTML; JavaScript reads or changes its nodes. An event starts at a target and bubbles through ancestors, allowing one stable listener to manage dynamic descendants.","DOM شجرة كائنات حية مبنية من HTML؛ تقرأ جافاسكربت عقدها أو تغيرها. يبدأ الحدث من هدف ويصعد عبر الأسلاف، فيدير مستمع ثابت أبناء ديناميكيين."),
      analogy:L("Un message part d’un magasin précis puis remonte centre commercial et ville; chaque niveau peut choisir de le traiter.","A message starts at one shop and rises through mall and city; each level may handle it.","تبدأ رسالة من متجر محدد وتصعد عبر المركز والمدينة؛ ويمكن لكل مستوى معالجتها."),
      mechanism:L("querySelector peut retourner null; closest cherche l’ancêtre correspondant depuis la cible. La délégation réduit les écouteurs et fonctionne après ajout de cartes, mais doit confirmer que le contrôle appartient au conteneur.","querySelector may return null; closest searches matching ancestry from target. Delegation reduces listeners and survives added cards, but must confirm the control belongs to the container.","قد تعيد querySelector قيمة null؛ وتبحث closest عن سلف مطابق من الهدف. يقلل التفويض المستمعين ويعمل بعد إضافة بطاقات، لكن يجب تأكيد انتماء التحكم للحاوية."),
      practice:L("Sélectionnez par attribut data lié au comportement, vérifiez les nulls, gardez les actions sur éléments natifs et retirez les écouteurs persistants lors du nettoyage.","Select by behavior-oriented data attributes, guard nulls, keep actions on native elements, and remove persistent listeners during cleanup.","اختر بسمات data مرتبطة بالسلوك واحمِ nulls وأبق الأفعال على عناصر أصلية وأزل المستمعين الدائمين عند التنظيف."),
      vocabulary:[v("DOM","Interface objet du document courant.","Object interface of the current document.","واجهة كائنات المستند الحالي."),v("event target","Nœud où l’événement a commencé.","Node where an event began.","العقدة التي بدأ عندها الحدث."),v("bubbling","Propagation de la cible vers les ancêtres.","Propagation from target to ancestors.","انتشار من الهدف إلى الأسلاف.")],
      general:L("Déléguer l’ajout au panier d’une liste dynamique en validant cible et identifiant.","Delegate add-to-cart for a dynamic list while validating target and identifier.","فوض الإضافة للسلة في قائمة ديناميكية مع التحقق من الهدف والمعرف."),lecomax:L("La grille L’ecomax peut gérer ses boutons ajoutés après recherche sans réattacher un écouteur par carte.","The L’ecomax grid can handle buttons added after search without attaching a listener per card.","تدير شبكة L’ecomax الأزرار المضافة بعد البحث بلا مستمع لكل بطاقة."),commands:["Start-Process .\\academy-labs\\08-browser\\dom-events.html"],expectedResult:L("un clic sur le texte ou l’icône du bouton annonce « Produit p1 ajouté »; un clic ailleurs ne déclenche rien.","clicking the button text or icon announces “Product p1 added”; clicks elsewhere do nothing.","يعلن النقر على نص الزر أو أيقونته «أُضيف المنتج p1»؛ ولا يفعل النقر في مكان آخر شيئًا."),
      issues:[L("event.target.dataset est vide.","event.target.dataset is empty.","تكون event.target.dataset فارغة."),L("Le code plante sur addEventListener.","Code crashes on addEventListener.","ينهار الكود عند addEventListener." )],fixes:[L("Utilisez closest car la cible peut être une icône interne.","Use closest because target may be an inner icon.","استعمل closest لأن الهدف قد يكون أيقونة داخلية."),L("Vérifiez la sélection ou exécutez après création du DOM.","Guard selection or run after DOM creation.","تحقق من الاختيار أو نفذ بعد إنشاء DOM." )],question:L("Pourquoi la délégation gère-t-elle des éléments ajoutés ?","Why does delegation handle added elements?","لماذا يعالج التفويض عناصر مضافة؟"),answer:L("L’écouteur reste sur un ancêtre stable","The listener remains on a stable ancestor","يبقى المستمع على سلف ثابت"),distractors:[L("Elle désactive DOM","It disables DOM","تعطل DOM"),L("Elle copie Git","It copies Git","تنسخ Git"),L("Elle change DNS","It changes DNS","تغير DNS")],quizExplanation:L("Les événements des nouveaux descendants remontent au même ancêtre.","Events from new descendants bubble to the same ancestor.","تصعد أحداث الأبناء الجدد إلى السلف نفسه."),next:L("La prochaine leçon intercepte, valide et annonce une soumission de formulaire.","The next lesson intercepts, validates, and announces form submission.","يعترض الدرس التالي إرسال النموذج ويتحقق منه ويعلنه." ) }),
    rapidLesson({ id:"lesson-08-02-form-submit",order:1,language:"javascript",filename:"academy-labs/08-browser/form.js",
      source:`form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const query = String(data.get("query") ?? "").trim();
  error.textContent = query.length < 2 ? "Saisissez au moins 2 caractères." : "";
  input.setAttribute("aria-invalid", String(query.length < 2));
  if (query.length >= 2) renderResults(searchProducts(products, query));
});`,
      title:L("Soumission, FormData et erreurs accessibles","Submission, FormData, and accessible errors","الإرسال وFormData والأخطاء المتاحة"),
      concept:L("Le formulaire possède un événement submit unique déclenché par bouton ou Entrée. FormData lit les contrôles nommés; la logique normalise et valide avant effet, puis rend succès ou erreur de façon perceptible.","A form has one submit event triggered by button or Enter. FormData reads named controls; logic normalizes and validates before effects, then renders perceivable success or error.","للنموذج حدث submit واحد يطلقه الزر أو Enter. تقرأ FormData عناصر التحكم المسماة؛ ويطبع المنطق ويتحقق قبل الأثر ثم يعرض النجاح أو الخطأ بوضوح."),
      analogy:L("Le guichet reçoit le dossier complet, vérifie les champs une fois puis délivre résultat ou instruction de correction.","A desk receives the complete file, validates fields once, then returns a result or correction instruction.","يستقبل الشباك الملف كاملًا ويفحص الحقول مرة ثم يعيد نتيجة أو تعليمات إصلاح."),
      mechanism:L("preventDefault remplace la navigation native seulement quand JavaScript fournit le flux complet. name détermine les clés FormData; aria-invalid et aria-describedby rendent l’état et le message associés.","preventDefault replaces native navigation only when JavaScript supplies the full flow. name determines FormData keys; aria-invalid and aria-describedby expose associated state and message.","تستبدل preventDefault التنقل الأصلي فقط عندما توفر جافاسكربت التدفق كاملًا. تحدد name مفاتيح FormData؛ وتكشف aria-invalid وaria-describedby الحالة والرسالة المرتبطتين."),
      practice:L("Écoutez submit plutôt que click, normalisez une fois, conservez la validation serveur pour les écritures et placez le focus sur le premier champ invalide.","Listen for submit rather than click, normalize once, retain server validation for writes, and focus the first invalid field.","استمع إلى submit لا click وطبع مرة واحتفظ بتحقق الخادم للكتابات وانقل التركيز لأول حقل غير صالح."),
      vocabulary:[v("submit event","Événement sémantique d’envoi du formulaire.","Semantic form-send event.","حدث دلالي لإرسال النموذج."),v("FormData","Collection des paires name/valeur réussies.","Collection of successful name/value pairs.","مجموعة أزواج name/value الناجحة."),v("client validation","Retour rapide dans le navigateur, non fiable pour la sécurité.","Fast browser feedback, not security-trusted.","تغذية متصفح سريعة لا يوثق بها أمنيًا." )],
      general:L("Valider une recherche au submit et relier textuellement toute erreur au champ.","Validate search on submit and textually connect every error to its field.","تحقق من البحث عند submit واربط كل خطأ نصيًا بحقل."),lecomax:L("SearchOverlay respecte Entrée, annonce une requête trop courte et affiche résultats ou état vide sans rechargement.","SearchOverlay respects Enter, announces a short query, and shows results or empty state without reload.","يحترم SearchOverlay زر Enter ويعلن الاستعلام القصير ويعرض النتائج أو الحالة الفارغة بلا إعادة تحميل."),commands:["npm run dev"],expectedResult:L("Entrée et bouton suivent le même chemin; une lettre affiche l’erreur, deux lettres lancent la recherche.","Enter and button follow one path; one letter shows error and two letters run search.","يتبع Enter والزر المسار نفسه؛ ويعرض حرف خطأ ويشغّل حرفان البحث."),issues:[L("Entrée recharge la page.","Enter reloads the page.","يعيد Enter تحميل الصفحة."),L("FormData retourne null.","FormData returns null.","تعيد FormData قيمة null." )],fixes:[L("Écoutez submit et appelez preventDefault dans le flux client.","Listen to submit and call preventDefault in client flow.","استمع لـsubmit واستدع preventDefault في تدفق العميل."),L("Ajoutez le name exact au contrôle et gérez l’absence explicitement.","Add the exact name to the control and handle absence explicitly.","أضف name الدقيق للحقل وعالج الغياب صراحة." )],question:L("Pourquoi écouter submit ?","Why listen to submit?","لماذا نستمع إلى submit؟"),answer:L("Il couvre bouton et clavier","It covers button and keyboard","يغطي الزر ولوحة المفاتيح"),distractors:[L("Il remplace HTML","It replaces HTML","يستبدل HTML"),L("Il chiffre les données","It encrypts data","يشفر البيانات"),L("Il crée un commit","It creates a commit","ينشئ commit")],quizExplanation:L("submit représente l’intention du formulaire indépendamment du déclencheur.","submit represents form intent independently of trigger.","يمثل submit نية النموذج بصرف النظر عن المشغل."),next:L("La prochaine leçon persiste un petit état local avec version et validation.","The next lesson persists small local state with versioning and validation.","يحفظ الدرس التالي حالة محلية صغيرة بإصدار وتحقق." ) }),
    rapidLesson({ id:"lesson-08-03-localstorage",order:2,language:"javascript",filename:"academy-labs/08-browser/storage.js",
      source:`const KEY = "lecomax:recent-searches:v1";
export function loadRecent() {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(value) ? value.filter((x) => typeof x === "string").slice(0, 5) : []; }
  catch { return []; }
}
export function saveRecent(items) { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 5))); }`,
      title:L("localStorage, JSON, versions et validation","localStorage, JSON, versions, and validation","localStorage وJSON والإصدارات والتحقق"),
      concept:L("localStorage est un dictionnaire synchrone de chaînes propre à une origine et persistant entre sessions. Toute structure doit être sérialisée en JSON puis validée au chargement, car ancien code, utilisateur ou extension peut l’avoir modifiée.","localStorage is a synchronous per-origin string dictionary persisting across sessions. Structures must be JSON-serialized and validated on load because old code, users, or extensions may have changed them.","localStorage قاموس نصوص متزامن خاص بالأصل ويبقى بين الجلسات. يجب تسلسل البنى إلى JSON والتحقق منها عند التحميل لأن كودًا قديمًا أو مستخدمًا أو إضافة قد تغيرها."),
      analogy:L("Un petit tiroir étiqueté garde des fiches entre visites, mais chaque fiche récupérée doit être relue avant usage.","A labeled drawer keeps cards between visits, but every retrieved card must be checked before use.","يحفظ درج مسمى بطاقات بين الزيارات، لكن يجب فحص كل بطاقة مسترجعة قبل استعمالها."),
      mechanism:L("setItem convertit seulement une chaîne et peut échouer quota/sécurité; JSON.parse peut lever SyntaxError. Une clé nommée et versionnée permet migration ou abandon sûr d’un ancien format.","setItem stores only strings and may fail for quota/security; JSON.parse may throw SyntaxError. A namespaced versioned key permits migration or safe abandonment of old formats.","يخزن setItem نصوصًا فقط وقد يفشل للسعة/الأمان؛ وقد ترمي JSON.parse خطأ SyntaxError. يسمح مفتاح مسمى بإصدار بترحيل صيغة قديمة أو تركها بأمان."),
      practice:L("Ne stockez ni secret ni vérité serveur; enveloppez lecture/écriture, limitez la taille, validez chaque champ et fournissez un défaut sûr en cas de corruption.","Store neither secrets nor server truth; wrap reads/writes, limit size, validate every field, and provide a safe default on corruption.","لا تخزن سرًا ولا حقيقة الخادم؛ غلف القراءة/الكتابة وحد الحجم وتحقق من كل حقل وقدم افتراضيًا آمنًا عند التلف."),
      vocabulary:[v("origin","Combinaison protocole, hôte et port isolant le stockage.","Protocol, host, and port combination isolating storage.","تركيبة البروتوكول والمضيف والمنفذ التي تعزل التخزين."),v("serialization","Conversion d’une structure en chaîne transportable.","Conversion of structure to a transportable string.","تحويل بنية إلى نص قابل للنقل."),v("schema version","Marque indiquant la forme attendue des données.","Marker indicating expected data shape.","علامة تحدد شكل البيانات المتوقع." )],
      general:L("Persister cinq recherches récentes, survivre à un JSON corrompu et ne jamais bloquer la page.","Persist five recent searches, survive corrupt JSON, and never block the page.","احفظ خمسة أبحاث حديثة وتجاوز JSON تالفًا ولا تعطل الصفحة."),lecomax:L("L’ecomax peut garder recherches récentes locales, mais panier, prix et commande restent validés côté serveur.","L’ecomax may keep recent searches locally, but cart, price, and order remain server-validated.","قد يحفظ L’ecomax الأبحاث الحديثة محليًا، لكن تبقى السلة والسعر والطلب محققة على الخادم."),commands:["npm run dev"],expectedResult:L("cinq chaînes maximum reviennent après rechargement; une valeur JSON cassée produit simplement une liste vide.","at most five strings return after reload; broken JSON safely yields an empty list.","تعود خمسة نصوص كحد أقصى بعد التحميل؛ وينتج JSON مكسور قائمة فارغة بأمان."),issues:[L("[object Object] est stocké.","[object Object] is stored.","تُخزن [object Object]."),L("La page plante après modification manuelle.","The page crashes after manual storage edits.","تنهار الصفحة بعد تعديل التخزين يدويًا." )],fixes:[L("Utilisez JSON.stringify à l’écriture et JSON.parse à la lecture.","Use JSON.stringify when writing and JSON.parse when reading.","استعمل JSON.stringify عند الكتابة وJSON.parse عند القراءة."),L("Entourez parse de try/catch et validez la forme.","Wrap parse in try/catch and validate shape.","غلف parse بـtry/catch وتحقق من الشكل." )],question:L("Peut-on stocker une clé secrète dans localStorage ?","Can a secret key be stored in localStorage?","هل نخزن مفتاحًا سريًا في localStorage؟"),answer:L("Non, le JavaScript et l’utilisateur peuvent la lire","No, JavaScript and the user can read it","لا، تستطيع جافاسكربت والمستخدم قراءته"),distractors:[L("Oui si elle est longue","Yes if it is long","نعم إن كانت طويلة"),L("Oui avec JSON","Yes with JSON","نعم مع JSON"),L("Oui sur mobile","Yes on mobile","نعم على الهاتف")],quizExplanation:L("Le stockage navigateur n’est pas une frontière secrète.","Browser storage is not a secret boundary.","تخزين المتصفح ليس حدًا سريًا."),next:L("La dernière leçon assemble recherche, clavier, rendu et persistance dans un composant accessible.","The final lesson assembles search, keyboard, rendering, and persistence into an accessible component.","يجمع الدرس الأخير البحث ولوحة المفاتيح والتصيير والحفظ في مكون متاح." ) }),
    rapidLesson({ id:"lesson-08-04-accessible-widget",order:3,language:"html",filename:"academy-labs/08-browser/catalog.html",
      source:`<section aria-labelledby="search-title">
  <h2 id="search-title">Rechercher les produits</h2>
  <form role="search"><label for="query">Produit</label><input id="query" name="query" type="search" aria-describedby="status"><button>Rechercher</button></form>
  <p id="status" role="status" aria-live="polite">3 résultats</p>
  <ul data-product-list aria-label="Résultats">…</ul>
</section>`,
      title:L("Projet : recherche interactive accessible","Project: accessible interactive search","مشروع: بحث تفاعلي متاح"),
      concept:L("Un widget complet maintient un état source, dérive son affichage et expose chaque transition par sémantique, focus et message. Souris, clavier et technologie d’assistance doivent déclencher la même logique sans duplication.","A complete widget maintains source state, derives its display, and exposes every transition through semantics, focus, and messages. Mouse, keyboard, and assistive technology trigger the same logic without duplication.","يحفظ المكون الكامل حالة مصدر ويشتق عرضه ويكشف كل انتقال بالدلالة والتركيز والرسالة. تشغل الفأرة ولوحة المفاتيح والتقنية المساعدة المنطق نفسه بلا تكرار."),
      analogy:L("Un tableau d’affichage fiable possède une source officielle, un filtre, un compteur annoncé et des commandes utilisables par tous.","A reliable notice board has one official source, a filter, an announced count, and controls usable by everyone.","تملك لوحة معلومات موثوقة مصدرًا رسميًا ومرشحًا وعدّادًا معلنًا وعناصر تحكم يستعملها الجميع."),
      mechanism:L("Le submit normalise la requête, une fonction pure dérive les résultats, le DOM rend une liste sémantique et role=status annonce le compte sans déplacer le focus. La délégation traite les boutons de résultats recréés.","Submit normalizes query, a pure function derives results, DOM renders a semantic list, and role=status announces count without moving focus. Delegation handles recreated result buttons.","يطبع submit الاستعلام وتشتق دالة نقية النتائج ويصيّر DOM قائمة دلالية وتعلن role=status العدد بلا نقل التركيز. يعالج التفويض أزرار النتائج المعاد إنشاؤها."),
      practice:L("Testez requête vide, aucun résultat, accents, Entrée, Tab, ajout dynamique, rechargement et stockage corrompu; gardez le statut poli pour ne pas interrompre la saisie.","Test empty query, no results, accents, Enter, Tab, dynamic add, reload, and corrupt storage; keep status polite to avoid interrupting typing.","اختبر الاستعلام الفارغ وغياب النتائج واللكنات وEnter وTab والإضافة الديناميكية وإعادة التحميل والتخزين التالف؛ واجعل الحالة polite كي لا تقاطع الكتابة."),
      vocabulary:[v("derived state","Valeur recalculable depuis une source.","Value recalculable from a source.","قيمة يمكن إعادة حسابها من مصدر."),v("live region","Zone dont les mises à jour sont annoncées.","Region whose updates are announced.","منطقة تُعلن تحديثاتها."),v("progressive enhancement","Fonction native enrichie sans perdre sa base.","Native function enhanced without losing its baseline.","وظيفة أصلية تُحسن من دون فقدان أساسها." )],
      general:L("Assembler un moteur pur, un formulaire unique, une liste sémantique, un statut live et une persistance défensive.","Assemble a pure engine, one form, semantic list, live status, and defensive persistence.","اجمع محركًا نقيًا ونموذجًا واحدًا وقائمة دلالية وحالة live وحفظًا دفاعيًا."),lecomax:L("SearchOverlay L’ecomax applique ces couches et garde navigation, résultats et ajout utilisables en FR, EN et AR/RTL.","L’ecomax SearchOverlay applies these layers and keeps navigation, results, and add actions usable in FR, EN, and AR/RTL.","يطبق SearchOverlay في L’ecomax هذه الطبقات ويحفظ التنقل والنتائج والإضافة قابلة للاستعمال بالفرنسية والإنجليزية والعربية/RTL."),commands:["npm run dev","npm run build"],expectedResult:L("la recherche fonctionne au clavier, annonce le compte, rend une liste valide, persiste cinq requêtes et le build réussit.","search works by keyboard, announces count, renders a valid list, persists five queries, and builds successfully.","يعمل البحث بلوحة المفاتيح ويعلن العدد ويصيّر قائمة صالحة ويحفظ خمسة استعلامات وينجح البناء."),issues:[L("Le lecteur d’écran n’annonce pas les résultats.","The screen reader does not announce results.","لا يعلن قارئ الشاشة النتائج."),L("Le focus saute à chaque frappe.","Focus jumps on every keystroke.","يقفز التركيز عند كل ضغطة." )],fixes:[L("Mettez à jour un role=status persistant avec un texte concis.","Update a persistent role=status with concise text.","حدّث role=status ثابتًا بنص موجز."),L("Ne recréez pas le champ et ne déplacez le focus qu’après une action qui l’exige.","Do not recreate the input or move focus unless an action requires it.","لا تعِد إنشاء الحقل ولا تنقل التركيز إلا عند فعل يتطلبه." )],question:L("Pourquoi utiliser role=status ?","Why use role=status?","لماذا نستعمل role=status؟"),answer:L("Pour annoncer une mise à jour sans déplacer le focus","To announce an update without moving focus","لإعلان تحديث بلا نقل التركيز"),distractors:[L("Pour stocker un secret","To store a secret","لتخزين سر"),L("Pour créer CSS","To create CSS","لإنشاء CSS"),L("Pour fusionner Git","To merge Git","لدمج Git")],quizExplanation:L("Une région live polie communique le nouveau compte tout en laissant l’utilisateur dans le champ.","A polite live region communicates the count while leaving the user in the field.","تنقل منطقة live polite العدد وتترك المستخدم في الحقل."),next:L("Vous êtes prêt pour TypeScript, React et Next.js : la suite transforme ces principes en architecture d’application.","You are ready for TypeScript, React, and Next.js: the next part turns these principles into application architecture.","أنت جاهز لـTypeScript وReact وNext.js؛ يحول الجزء التالي هذه المبادئ إلى بنية تطبيق." ) }),
  ],
});

modulesBlueprint.push({
  id: "module-07-js-data-problem-solving", order: 7, icon: "🧩", color: "#A855F7",
  files: [{ path: "lib/products.ts", mode: "existing" }, { path: "academy-labs/07-data/catalog.mjs", mode: "create" }],
  title: L("Fonctions, tableaux, objets et résolution de problèmes", "Functions, arrays, objects, and problem solving", "الدوال والمصفوفات والكائنات وحل المشكلات"),
  summary: L("Décomposer une règle, écrire des fonctions prévisibles et transformer des collections et objets sans mutation accidentelle.", "Decompose a rule, write predictable functions, and transform collections and objects without accidental mutation.", "فكك القاعدة واكتب دوال قابلة للتوقع وحوّل المجموعات والكائنات بلا تغيير عرضي."),
  lessons: [
    rapidLesson({ id:"lesson-07-01-functions",order:0,language:"javascript",filename:"academy-labs/07-data/functions.mjs",
      source:`export function discountedPrice(price, rate = 0) {
  if (price < 0 || rate < 0 || rate > 1) throw new RangeError("invalid price or rate");
  return Math.round(price * (1 - rate) * 100) / 100;
}
console.log(discountedPrice(349, 0.1));
try { discountedPrice(349, 1.1); }
catch (error) { console.error(error.name, error.message); }`,
      title:L("Fonctions, paramètres, portée et pureté","Functions, parameters, scope, and purity","الدوال والمعاملات والنطاق والنقاء"),
      concept:L("Une fonction nomme une transformation entre paramètres et valeur de retour. Sa portée limite les noms accessibles; une fonction pure dépend seulement de ses arguments et ne modifie aucun état extérieur, ce qui rend son résultat prévisible.","A function names a transformation from parameters to a return value. Scope limits accessible names; a pure function depends only on arguments and changes no outside state, making output predictable.","تسمي الدالة تحويلًا من المعاملات إلى قيمة عائدة. يحد النطاق الأسماء المتاحة؛ وتعتمد الدالة النقية على معاملاتها فقط ولا تغير حالة خارجية، فتكون نتيجتها متوقعة."),
      analogy:L("Une machine reçoit des pièces explicitement, applique une recette et rend un produit sans réorganiser l’atelier.","A machine receives explicit parts, applies a recipe, and returns a product without rearranging the workshop.","تستقبل آلة قطعًا صريحة وتطبق وصفة وتعيد منتجًا بلا إعادة ترتيب الورشة."),
      mechanism:L("Les arguments sont évalués puis liés aux paramètres locaux; return termine l’appel. Les closures conservent leur environnement lexical, mais une dépendance cachée à une variable mutable complique les tests.","Arguments are evaluated and bound to local parameters; return ends the call. Closures retain lexical environment, but hidden mutable dependencies complicate tests.","تُقيّم الحجج وتربط بمعاملات محلية؛ وتنهي return الاستدعاء. تحتفظ closures ببيئتها المعجمية، لكن الاعتماد الخفي على متغير متغير يصعب الاختبارات."),
      practice:L("Écrivez signature, cas valides, frontières et erreurs avant le corps; retournez une valeur unique et déplacez logs, stockage ou réseau vers l’appelant.","Write signature, valid cases, boundaries, and errors before the body; return one value and move logging, storage, or network to the caller.","اكتب التوقيع والحالات الصالحة والحدود والأخطاء قبل الجسم؛ وأعد قيمة واحدة وانقل السجلات والتخزين والشبكة إلى المستدعي."),
      vocabulary:[v("parameter","Nom local recevant un argument.","Local name receiving an argument.","اسم محلي يستقبل حجة."),v("scope","Région où un identifiant est accessible.","Region where an identifier is accessible.","منطقة يتاح فيها المعرف."),v("pure function","Fonction sans effet externe et déterministe.","Deterministic function without external effects.","دالة حتمية بلا آثار خارجية.")],
      general:L("Créer et tester une fonction pure de remise avec limites explicites.","Create and test a pure discount function with explicit limits.","أنشئ واختبر دالة خصم نقية بحدود صريحة."),lecomax:L("Les prix affichés et panier partagent la même fonction pure pour éviter deux règles de remise divergentes.","Displayed and cart prices share one pure function to avoid diverging discount rules.","تشترك أسعار العرض والسلة في دالة نقية واحدة لتجنب اختلاف قواعد الخصم."),commands:["node academy-labs/07-data/functions.mjs"],expectedResult:L("314.1 est retourné sans modifier le prix source; RangeError prouve le rejet du taux 1.1.","314.1 is returned without changing source price; RangeError proves rate 1.1 is rejected.","تُعاد 314.1 بلا تغيير السعر الأصلي ويثبت RangeError رفض المعدل 1.1."),
      issues:[L("Deux appels identiques donnent des résultats différents.","Identical calls produce different results.","يعطي استدعاءان متطابقان نتائج مختلفة."),L("Une variable interne est introuvable ailleurs.","An internal variable is unavailable elsewhere.","متغير داخلي غير موجود خارج الدالة.")],fixes:[L("Passez la dépendance cachée en paramètre et supprimez la mutation globale.","Pass hidden dependency as a parameter and remove global mutation.","مرر الاعتماد الخفي كمعامل وأزل التغيير العام."),L("Retournez la valeur nécessaire au lieu de contourner la portée.","Return the needed value instead of bypassing scope.","أعد القيمة اللازمة بدل تجاوز النطاق.")],question:L("Qu’est-ce qui caractérise une fonction pure ?","What characterizes a pure function?","ما الذي يميز الدالة النقية؟"),answer:L("Même entrée, même sortie, aucun effet externe","Same input, same output, no external effect","نفس المدخل ونفس المخرج وبلا أثر خارجي"),distractors:[L("Elle modifie window","It mutates window","تغير window"),L("Elle fait toujours fetch","It always fetches","تستدعي fetch دائمًا"),L("Elle n’a pas de return","It has no return","لا تملك return")],quizExplanation:L("Déterminisme et absence d’effet rendent le raisonnement local.","Determinism and no effects make reasoning local.","تجعل الحتمية وغياب الآثار التفكير محليًا."),next:L("La prochaine leçon transforme les collections avec map, filter et reduce.","The next lesson transforms collections with map, filter, and reduce.","يحوّل الدرس التالي المجموعات عبر map وfilter وreduce.") }),
    rapidLesson({ id:"lesson-07-02-arrays",order:1,language:"javascript",filename:"academy-labs/07-data/arrays.js",
      source:`const products = [
  { id: "p1", name: "Casque", price: 349, stock: 4, active: true },
  { id: "p2", name: "Câble", price: 99, stock: 8, active: true },
  { id: "p3", name: "Housse", price: 149, stock: 0, active: true },
  { id: "p4", name: "Brouillon", price: 10, stock: 2, active: false },
];
const sourceOrder = products.map(({ id }) => id).join(",");
const visible = products
  .filter((product) => product.active && product.stock > 0)
  .map((product) => ({ id: product.id, name: product.name, price: product.price }))
  .sort((a, b) => a.price - b.price);
const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
console.table(visible);
console.log({ totalStock, sourceUnchanged: sourceOrder === products.map(({ id }) => id).join(",") });`,
      title:L("Tableaux : map, filter, find, sort et reduce","Arrays: map, filter, find, sort, and reduce","المصفوفات: map وfilter وfind وsort وreduce"),
      concept:L("Un tableau ordonne des valeurs; chaque méthode exprime une intention de collection. filter sélectionne, map transforme un-pour-un, find cherche un élément, some/every répondent à une question et reduce agrège.","An array orders values; each method expresses a collection intention. filter selects, map transforms one-to-one, find locates one item, some/every answer questions, and reduce aggregates.","ترتب المصفوفة قيمًا؛ وتعبر كل طريقة عن نية على المجموعة. تختار filter وتحول map عنصرًا لعنصر وتجد find عنصرًا وتجيب some/every وتجمع reduce."),
      analogy:L("Une chaîne de tri garde certains colis, change leur étiquette puis les ordonne avant de calculer un total.","A sorting line keeps selected parcels, changes labels, orders them, then computes a total.","يحتفظ خط فرز بطرود مختارة ويغير ملصقاتها ويرتبها ثم يحسب مجموعًا."),
      mechanism:L("Ces méthodes appellent une callback pour chaque élément; map/filter retournent un nouveau tableau. sort modifie le tableau récepteur, donc triez une copie avec toSorted ou [...items].sort.","These methods call a callback per item; map/filter return new arrays. sort mutates its receiver, so sort a copy with toSorted or [...items].sort.","تستدعي هذه الطرق callback لكل عنصر؛ وتعيد map/filter مصفوفات جديدة. تغير sort المصفوفة المستقبلة، لذا رتب نسخة عبر toSorted أو [...items].sort."),
      practice:L("Nommez chaque étape métier, choisissez la méthode correspondant au cardinal attendu et fournissez toujours une valeur initiale à reduce.","Name each business step, choose the method matching expected cardinality, and always provide reduce an initial value.","سم كل خطوة عمل واختر الطريقة المطابقة للعدد المتوقع وقدم دائمًا قيمة أولية لـreduce."),
      vocabulary:[v("callback","Fonction passée pour traiter un élément.","Function passed to process an item.","دالة تمرر لمعالجة عنصر."),v("predicate","Fonction retournant un booléen de sélection.","Function returning a selection Boolean.","دالة تعيد Boolean للاختيار."),v("accumulator","Valeur transportée entre étapes de reduce.","Value carried between reduce steps.","قيمة تنتقل بين خطوات reduce.")],
      general:L("Produire une liste active triée sans muter la source et calculer le stock total.","Produce an active sorted list without mutating source and calculate total stock.","أنتج قائمة نشطة مرتبة بلا تغيير المصدر واحسب المخزون الكلي."),lecomax:L("Le catalogue filtre produits publiés, projette les champs sûrs et trie une copie; l’admin conserve l’ordre source.","The catalog filters published products, projects safe fields, and sorts a copy; admin retains source order.","يرشح الكتالوج المنتجات المنشورة ويسقط الحقول الآمنة ويرتب نسخة؛ وتحفظ الإدارة ترتيب المصدر."),commands:["node academy-labs/07-data/arrays.js"],expectedResult:L("la liste ne contient que le stock actif, est triée par prix et products conserve son ordre.","the list contains active stock only, is sorted by price, and products keeps its order.","تحتوي القائمة المخزون النشط فقط وتُرتب بالسعر وتحفظ products ترتيبها."),
      issues:[L("Le tableau original change d’ordre.","The original array changes order.","يتغير ترتيب المصفوفة الأصلية."),L("reduce échoue sur un tableau vide.","reduce fails on an empty array.","تفشل reduce على مصفوفة فارغة.")],fixes:[L("Triez une copie ou utilisez toSorted.","Sort a copy or use toSorted.","رتب نسخة أو استعمل toSorted."),L("Fournissez zéro comme valeur initiale.","Provide zero as initial value.","قدم صفرًا كقيمة أولية.")],question:L("Quelle méthode garde certains éléments ?","Which method keeps selected elements?","أي طريقة تحتفظ بعناصر مختارة؟"),answer:L("filter","filter","filter"),distractors:[L("map","map","map"),L("reduce","reduce","reduce"),L("join","join","join")],quizExplanation:L("Le prédicat de filter décide l’inclusion de chaque élément.","filter’s predicate decides inclusion per item.","يقرر predicate في filter إدراج كل عنصر."),next:L("La prochaine leçon met à jour des objets sans mutation.","The next lesson updates objects without mutation.","يحدث الدرس التالي الكائنات بلا تغيير مباشر.") }),
    rapidLesson({ id:"lesson-07-03-objects",order:2,language:"javascript",filename:"academy-labs/07-data/objects.js",
      source:`const product = { id: "p1", name: "Casque", stock: 4, meta: { featured: false } };
const updated = {
  ...product,
  stock: product.stock - 1,
  meta: { ...product.meta, featured: true },
};
const { id, name, stock } = updated;
console.log(id, name, stock, product.stock);`,
      title:L("Objets, destructuration et immutabilité","Objects, destructuring, and immutability","الكائنات والتفكيك وعدم التغيير"),
      concept:L("Un objet associe des clés à des valeurs et représente souvent une entité. Le spread crée une copie superficielle; chaque branche imbriquée modifiée doit aussi être copiée pour préserver l’ancienne version.","An object maps keys to values and often represents an entity. Spread creates a shallow copy; every changed nested branch must also be copied to preserve the old version.","يربط الكائن مفاتيح بقيم ويمثل غالبًا كيانًا. ينشئ spread نسخة سطحية؛ ويجب نسخ كل فرع متداخل يتغير للحفاظ على النسخة القديمة."),
      analogy:L("Réviser un formulaire en gardant l’original exige une nouvelle feuille et une copie séparée de toute annexe modifiée.","Revising a form while keeping the original requires a new sheet and a separate copy of every changed attachment.","تعديل استمارة مع حفظ الأصل يتطلب ورقة جديدة ونسخة منفصلة من كل ملحق متغير."),
      mechanism:L("La destructuration lit des propriétés nommées; rest collecte les autres. ...object copie les références de premier niveau, pas les objets imbriqués, et l’ordre du spread décide quelle valeur gagne.","Destructuring reads named properties; rest collects others. ...object copies first-level references, not nested objects, and spread order decides which value wins.","تقرأ destructuring خصائص مسماة وتجمع rest البقية. تنسخ ...object مراجع المستوى الأول لا الكائنات المتداخلة، ويحدد ترتيب spread القيمة الفائزة."),
      practice:L("Retournez un nouvel objet pour chaque mise à jour, copiez seulement le chemin imbriqué touché et vérifiez avec Object.is que les branches inchangées restent partagées.","Return a new object for every update, copy only the touched nested path, and use Object.is to verify unchanged branches remain shared.","أعد كائنًا جديدًا لكل تحديث وانسخ المسار المتداخل المتأثر فقط وتحقق عبر Object.is أن الفروع غير المتغيرة تظل مشتركة."),
      vocabulary:[v("property","Association clé-valeur d’un objet.","Key-value association on an object.","اقتران مفتاح بقيمة في كائن."),v("destructuring","Syntaxe extrayant des valeurs par structure.","Syntax extracting values by structure.","صياغة تستخرج القيم حسب البنية."),v("shallow copy","Copie du premier niveau conservant les références imbriquées.","First-level copy retaining nested references.","نسخة للمستوى الأول تحفظ المراجع المتداخلة.")],
      general:L("Mettre à jour stock et métadonnée en conservant l’objet source intact.","Update stock and metadata while keeping the source object intact.","حدّث المخزون والبيانات الوصفية مع إبقاء الكائن الأصلي سليمًا."),lecomax:L("Les mises à jour de panier créent de nouveaux items pour que React détecte précisément le changement.","Cart updates create new items so React detects change precisely.","تنشئ تحديثات السلة عناصر جديدة كي يكتشف React التغيير بدقة."),commands:["node academy-labs/07-data/objects.js"],expectedResult:L("updated a stock 3 et featured true, tandis que product garde stock 4 et false.","updated has stock 3 and featured true while product keeps 4 and false.","يملك updated مخزون 3 وfeatured true ويحفظ product القيم 4 وfalse."),
      issues:[L("L’objet original change aussi.","The original object changes too.","يتغير الكائن الأصلي أيضًا."),L("Une valeur spread écrase la mise à jour.","A spread value overwrites the update.","تكتب قيمة spread فوق التحديث.")],fixes:[L("Copiez chaque niveau imbriqué avant modification.","Copy each nested level before changing it.","انسخ كل مستوى متداخل قبل تغييره."),L("Placez le spread avant les propriétés qui doivent gagner.","Place spread before properties that must win.","ضع spread قبل الخصائص التي يجب أن تفوز." )],question:L("Le spread objet effectue quelle copie ?","What kind of copy does object spread make?","أي نسخة ينشئ spread الكائن؟"),answer:L("Une copie superficielle","A shallow copy","نسخة سطحية"),distractors:[L("Une copie profonde automatique","An automatic deep copy","نسخة عميقة تلقائية"),L("Aucune copie","No copy","لا نسخة"),L("Une requête HTTP","An HTTP request","طلب HTTP")],quizExplanation:L("Les valeurs imbriquées restent des références tant qu’elles ne sont pas copiées.","Nested values remain references until copied.","تبقى القيم المتداخلة مراجع حتى تُنسخ."),next:L("La prochaine leçon formalise une méthode complète de résolution de problème.","The next lesson formalizes a complete problem-solving method.","يصوغ الدرس التالي منهجًا كاملًا لحل المشكلات.") }),
    rapidLesson({ id:"lesson-07-04-problem-solving",order:3,language:"javascript",filename:"academy-labs/07-data/catalog.mjs",
      source:`import assert from "node:assert/strict";

export function searchProducts(products, rawQuery) {
  const query = rawQuery.trim().toLocaleLowerCase("fr");
  if (!query) return products;
  return products.filter(({ name, category }) =>
    [name, category].some((value) => value.toLocaleLowerCase("fr").includes(query))
  );
}
const products = [{ name: "Casque", category: "Audio" }, { name: "Housse", category: "Accessoires" }];
assert.deepEqual(searchProducts(products, " audio "), [products[0]]);
assert.deepEqual(searchProducts(products, "CASQUE"), [products[0]]);
assert.strictEqual(searchProducts(products, ""), products);
assert.deepEqual(products.map(({ name }) => name), ["Casque", "Housse"]);
console.log("4 assertions passed");`,
      title:L("Résoudre un problème par contrats et exemples","Solve problems through contracts and examples","حل المشكلات بالعقود والأمثلة"),
      concept:L("Résoudre consiste à transformer une demande ambiguë en entrées, sorties, invariants, exemples et cas limites, puis à choisir l’algorithme le plus simple qui satisfait ce contrat. Le code vient après les preuves attendues.","Problem solving turns an ambiguous request into inputs, outputs, invariants, examples, and edge cases, then chooses the simplest algorithm satisfying that contract. Code follows expected evidence.","يحوّل حل المشكلة طلبًا غامضًا إلى مدخلات ومخرجات وثوابت وأمثلة وحالات حدية، ثم يختار أبسط خوارزمية تحقق العقد. تأتي الشفرة بعد الأدلة المتوقعة."),
      analogy:L("Avant de tracer un itinéraire, on fixe départ, arrivée, contraintes et cas de route fermée.","Before plotting a route, define start, destination, constraints, and closed-road cases.","قبل رسم مسار نحدد البداية والنهاية والقيود وحالات الطريق المغلق."),
      mechanism:L("Décomposez normalisation, décision et transformation en étapes observables. Un exemple normal, un vide, une frontière et une entrée invalide empêchent la plupart des suppositions cachées.","Split normalization, decision, and transformation into observable steps. One normal, empty, boundary, and invalid example exposes most hidden assumptions.","قسّم التطبيع والقرار والتحويل إلى خطوات ملحوظة. يكشف مثال عادي وفارغ وحدي وغير صالح معظم الافتراضات الخفية."),
      practice:L("Écrivez le contrat en langage simple, simulez à la main, implémentez petit, ajoutez assertions, puis mesurez seulement si le volume réel révèle un problème.","Write the contract plainly, simulate by hand, implement small, add assertions, then measure only if real volume reveals a problem.","اكتب العقد ببساطة وحاكه يدويًا ونفذ قليلًا وأضف assertions ثم قس فقط إن كشف الحجم الحقيقي مشكلة."),
      vocabulary:[v("contract","Conditions sur entrées, sorties et erreurs.","Conditions on inputs, outputs, and errors.","شروط المدخلات والمخرجات والأخطاء."),v("edge case","Cas valide situé à une frontière.","Valid case at a boundary.","حالة صالحة عند حد."),v("algorithm","Suite finie d’étapes transformant des données.","Finite sequence transforming data.","سلسلة محدودة تحول البيانات." )],
      general:L("Spécifier puis implémenter une recherche tolérant espaces, casse et requête vide.","Specify then implement search handling whitespace, case, and empty query.","حدد ثم نفذ بحثًا يعالج المسافات والحالة والاستعلام الفارغ."),lecomax:L("La recherche L’ecomax normalise une fois, cherche nom et catégorie et garde l’ordre du catalogue.","L’ecomax search normalizes once, searches name and category, and preserves catalog order.","يطبع بحث L’ecomax مرة ويبحث الاسم والفئة ويحفظ ترتيب الكتالوج."),commands:["node academy-labs/07-data/catalog.mjs"],expectedResult:L("quatre assertions réussissent : « audio » trouve Casque, la casse et le vide sont gérés et la source reste intacte.","four assertions pass: “audio” finds Casque, case and empty input are handled, and source stays unchanged.","تنجح أربع assertions: يعثر «audio» على Casque وتُعالج الحالة والفراغ ويبقى المصدر بلا تغيير."),
      issues:[L("Les espaces empêchent un résultat.","Whitespace prevents a result.","تمنع المسافات النتيجة."),L("L’optimisation rend le code incorrect.","Optimization makes code incorrect.","يجعل التحسين الشفرة خاطئة." )],fixes:[L("Normalisez trim et casse avant la boucle.","Normalize trim and case before the loop.","طبع trim والحالة قبل الحلقة."),L("Revenez au contrat et aux assertions avant toute optimisation mesurée.","Return to contract and assertions before measured optimization.","ارجع للعقد وassertions قبل أي تحسين مقاس." )],question:L("Que faut-il écrire avant l’algorithme ?","What should be written before the algorithm?","ماذا نكتب قبل الخوارزمية؟"),answer:L("Le contrat et des exemples","The contract and examples","العقد والأمثلة"),distractors:[L("Une animation","An animation","حركة"),L("Un secret API","An API secret","سر API"),L("Un domaine DNS","A DNS domain","نطاق DNS")],quizExplanation:L("Les exemples rendent la réussite et les limites testables.","Examples make success and boundaries testable.","تجعل الأمثلة النجاح والحدود قابلة للاختبار."),next:L("Le module suivant relie cette logique au DOM, aux formulaires et au stockage navigateur.","The next module connects this logic to DOM, forms, and browser storage.","تربط الوحدة التالية هذا المنطق بـDOM والنماذج وتخزين المتصفح." ) }),
  ],
});


modulesBlueprint.push({
  id: "module-06-javascript-foundations", order: 6, icon: "⚡", color: "#EAB308",
  files: [{ path: "package.json", mode: "existing" }, { path: "academy-labs/06-javascript/fundamentals.js", mode: "create" }],
  title: L("JavaScript fondamental", "JavaScript fundamentals", "أساسيات JavaScript"),
  summary: L("Maîtriser valeurs, variables, opérateurs, branchements, boucles, chaînes, nullish values, erreurs et modules avec des preuves dans Node et DevTools.", "Master values, variables, operators, branching, loops, strings, nullish values, errors, and modules with evidence in Node and DevTools.", "إتقان القيم والمتغيرات والمعاملات والتفرع والحلقات والنصوص والقيم الفارغة والأخطاء والوحدات بأدلة في Node وDevTools."),
  lessons: [
    rapidLesson({
      id: "lesson-06-01-values", order: 0, language: "javascript", filename: "academy-labs/06-javascript/values.js",
      source: `const unitPrice = 349;
const quantity = 2;
const discountRate = 0.1;

const subtotal = unitPrice * quantity;
const total = subtotal * (1 - discountRate);
const label = \`Total: \${total.toFixed(2)} MAD\`;
console.log({ subtotal, total, label });`,
      title: L("Valeurs, variables, types et opérateurs", "Values, variables, types, and operators", "القيم والمتغيرات والأنواع والمعاملات"),
      concept: L("Une variable associe un nom à une valeur; le type appartient à la valeur et détermine les opérations significatives. const protège la liaison contre une réaffectation, tandis que le calcul produit de nouvelles valeurs sans modifier les entrées.", "A variable binds a name to a value; the type belongs to the value and determines meaningful operations. const protects the binding from reassignment, while calculation produces new values without changing inputs.", "يربط المتغير اسمًا بقيمة؛ وينتمي النوع إلى القيمة ويحدد العمليات ذات المعنى. تحمي const الربط من إعادة الإسناد، وينتج الحساب قيمًا جديدة من دون تغيير المدخلات."),
      analogy: L("Une étiquette pointe vers le contenu d’une boîte; le type décrit ce que l’on peut raisonnablement faire avec ce contenu.", "A label points to box contents; type describes what can reasonably be done with them.", "تشير بطاقة إلى محتوى صندوق؛ ويصف النوع ما يمكن فعله منطقيًا بذلك المحتوى."),
      mechanism: L("Les opérateurs suivent précédence et coercition; + additionne des nombres mais concatène dès qu’une chaîne intervient. Number.isFinite et typeof rendent les hypothèses visibles avant un calcul financier.", "Operators follow precedence and coercion; + adds numbers but concatenates once a string participates. Number.isFinite and typeof make assumptions visible before financial calculation.", "تتبع المعاملات الأولوية والتحويل؛ تجمع + الأرقام لكنها تسلسل عند دخول نص. تجعل Number.isFinite وtypeof الافتراضات ظاهرة قبل الحساب المالي."),
      practice: L("Nommez les unités, utilisez const par défaut, ajoutez des parenthèses pour l’intention et formatez seulement à la frontière d’affichage afin de garder les calculs numériques.", "Name units, default to const, add parentheses for intent, and format only at the display boundary so calculations remain numeric.", "سمّ الوحدات واستعمل const افتراضيًا وأضف أقواسًا لتوضيح النية ولا تنسق إلا عند العرض كي تبقى الحسابات رقمية."),
      vocabulary: [v("primitive", "Valeur simple comme number, string ou boolean.", "Simple value such as number, string, or boolean.", "قيمة بسيطة مثل number أو string أو boolean."), v("coercion", "Conversion implicite d’un type vers un autre.", "Implicit conversion from one type to another.", "تحويل ضمني من نوع إلى آخر."), v("expression", "Code évalué en une valeur.", "Code evaluated into a value.", "شفرة تُقيّم إلى قيمة.")],
      general: L("Écrire un calcul de panier validant ses nombres et retournant sous-total, remise et total sans mutation.", "Write a cart calculation validating numbers and returning subtotal, discount, and total without mutation.", "اكتب حساب سلة يتحقق من الأرقام ويعيد المجموع والخصم والإجمالي بلا تغيير."),
      lecomax: L("L’ecomax conserve prix et quantités comme nombres; « MAD » est ajouté seulement dans le composant d’affichage.", "L’ecomax keeps price and quantity numeric; “MAD” is added only in the display component.", "يحفظ L’ecomax السعر والكمية كأرقام؛ وتضاف «MAD» في مكون العرض فقط."),
      commands: ["node academy-labs/06-javascript/values.js"], expectedResult: L("la console affiche 698 de sous-total, 628.2 de total et un label à deux décimales.", "the console prints subtotal 698, total 628.2, and a two-decimal label.", "تعرض الطرفية مجموعًا فرعيًا 698 وإجماليًا 628.2 ونصًا بمنزلتين."),
      issues: [L("Le total devient 3492.", "The total becomes 3492.", "يصبح الإجمالي 3492."), L("Le total vaut NaN.", "The total is NaN.", "تساوي النتيجة NaN.")],
      fixes: [L("Convertissez explicitement l’entrée texte avec Number et validez-la.", "Explicitly convert text input with Number and validate it.", "حوّل الإدخال النصي صراحة عبر Number وتحقق منه."), L("Tracez chaque opérande avec typeof et Number.isFinite avant le calcul.", "Log each operand with typeof and Number.isFinite before calculating.", "اطبع كل معامل عبر typeof وNumber.isFinite قبل الحساب.")],
      question: L("Pourquoi garder le prix comme number ?", "Why keep price as a number?", "لماذا نحفظ السعر كـnumber؟"), answer: L("Pour calculer avant de formater", "To calculate before formatting", "للحساب قبل التنسيق"), distractors: [L("Pour éviter const", "To avoid const", "لتجنب const"), L("Pour remplacer CSS", "To replace CSS", "لاستبدال CSS"), L("Pour créer du DNS", "To create DNS", "لإنشاء DNS")], quizExplanation: L("Le symbole monétaire appartient à la présentation; le domaine calcule des nombres.", "Currency symbols belong to presentation; domain logic calculates numbers.", "ينتمي رمز العملة للعرض؛ ويحسب منطق المجال أرقامًا."),
      next: L("La prochaine leçon contrôle le chemin d’exécution avec conditions et boucles.", "The next lesson controls execution flow with conditions and loops.", "يتحكم الدرس التالي في مسار التنفيذ بالشروط والحلقات."),
    }),
    rapidLesson({
      id: "lesson-06-02-control-flow", order: 1, language: "javascript", filename: "academy-labs/06-javascript/control-flow.js",
      source: `const stockBySize = { S: 0, M: 4, L: 2 };
for (const [size, stock] of Object.entries(stockBySize)) {
  if (stock <= 0) { console.log(size, "épuisé"); continue; }
  const label = stock === 1 ? "dernier article" : \`\${stock} articles\`;
  console.log(size, label);
}`,
      title: L("Conditions, comparaisons et boucles", "Conditions, comparisons, and loops", "الشروط والمقارنات والحلقات"),
      concept: L("Le flux d’exécution choisit des chemins selon des expressions booléennes et répète un bloc sur une collection. Une condition correcte exprime une règle métier exhaustive plutôt qu’une vérité approximative.", "Execution flow chooses paths from Boolean expressions and repeats a block over a collection. A correct condition expresses an exhaustive business rule rather than an approximate truth.", "يختار تدفق التنفيذ مسارات حسب تعبيرات Boolean ويكرر كتلة على مجموعة. يعبر الشرط الصحيح عن قاعدة عمل شاملة لا حقيقة تقريبية."),
      analogy: L("Un aiguillage choisit une voie selon un signal; une boucle inspecte chaque wagon avec la même procédure.", "A switch chooses a track from a signal; a loop inspects every carriage with one procedure.", "يختار تحويل السكة مسارًا حسب إشارة؛ وتفحص الحلقة كل عربة بالإجراء نفسه."),
      mechanism: L("=== évite la conversion implicite, && exige deux conditions, || une alternative et ! inverse. return termine une fonction, break une boucle et continue passe immédiatement à l’élément suivant.", "=== avoids implicit conversion, && requires both conditions, || accepts an alternative, and ! negates. return ends a function, break a loop, and continue advances immediately.", "تتجنب === التحويل الضمني، وتتطلب && شرطين، وتقبل || بديلًا، وتعكس !. تنهي return الدالة وbreak الحلقة وتنقل continue للعنصر التالي."),
      practice: L("Énumérez les cas stock zéro, un et plusieurs avant d’écrire if; utilisez for...of quand l’ordre et les sorties anticipées comptent, puis testez chaque frontière.", "Enumerate zero, one, and many stock cases before writing if; use for...of when order and early exits matter, then test every boundary.", "عدد حالات المخزون صفر وواحد ومتعدد قبل if؛ واستعمل for...of عندما يهم الترتيب والخروج المبكر ثم اختبر كل حد."),
      vocabulary: [v("boolean", "Valeur true ou false pilotant une décision.", "true or false value driving a decision.", "قيمة true أو false تقود قرارًا."), v("branch", "Chemin conditionnel du programme.", "Conditional program path.", "مسار شرطي للبرنامج."), v("iteration", "Une exécution du corps d’une boucle.", "One execution of a loop body.", "تنفيذ واحد لجسم الحلقة.")],
      general: L("Implémenter les libellés de stock pour zéro, un et plusieurs articles et vérifier les valeurs limites.", "Implement stock labels for zero, one, and many items and verify boundary values.", "نفذ تسميات المخزون للصفر والواحد والمتعدد وتحقق من قيم الحدود."),
      lecomax: L("Les variantes épuisées sont désactivées; le dernier article affiche une urgence textuelle sans mentir sur la disponibilité.", "Sold-out variants are disabled; the last item shows textual urgency without misrepresenting availability.", "تُعطل المتغيرات النافدة؛ ويعرض آخر عنصر استعجالًا نصيًا بلا تضليل في التوفر."),
      commands: ["node academy-labs/06-javascript/control-flow.js"], expectedResult: L("S est épuisé, M affiche quatre articles et L deux, sans traiter S dans la suite.", "S is sold out, M shows four items, and L two, with S skipped afterward.", "يظهر S نافدًا وM أربعة عناصر وL عنصرين ولا يُعالج S بعد ذلك."),
      issues: [L("La chaîne « 0 » est considérée disponible.", "The string “0” is treated as available.", "يُعتبر النص «0» متوفرًا."), L("La boucle ne termine jamais.", "The loop never ends.", "لا تنتهي الحلقة." )], fixes: [L("Normalisez le stock en nombre et comparez avec <= 0.", "Normalize stock to a number and compare with <= 0.", "حوّل المخزون إلى رقم وقارن بـ<= 0."), L("Vérifiez que l’état contrôlant la répétition progresse à chaque tour.", "Verify repetition state advances on every iteration.", "تحقق أن حالة التكرار تتقدم في كل دورة.")],
      question: L("Quel opérateur compare sans coercition ?", "Which operator compares without coercion?", "أي معامل يقارن بلا تحويل؟"), answer: L("===", "===", "==="), distractors: [L("=", "=", "="), L("==", "==", "=="), L("=>", "=>", "=>")], quizExplanation: L("=== compare type et valeur sans conversion implicite.", "=== compares type and value without implicit conversion.", "تقارن === النوع والقيمة بلا تحويل ضمني."), next: L("La prochaine leçon traite chaînes, valeurs absentes et formats d’affichage.", "The next lesson handles strings, missing values, and display formats.", "يعالج الدرس التالي النصوص والقيم الغائبة وصيغ العرض."),
    }),
    rapidLesson({
      id: "lesson-06-03-strings-nullish", order: 2, language: "javascript", filename: "academy-labs/06-javascript/strings.js",
      source: `function productLabel(product) {
  const name = product.name?.trim() || "Produit sans nom";
  const color = product.variant?.color ?? "couleur standard";
  return \`\${name} — \${color}\`;
}
console.log(productLabel({ name: "  Casque ", variant: null }));`,
      title: L("Chaînes, templates et valeurs nullish", "Strings, templates, and nullish values", "النصوص والقوالب والقيم nullish"),
      concept: L("Une chaîne est une séquence immuable; ses méthodes retournent de nouvelles chaînes. undefined décrit souvent une absence non fournie et null une absence explicite; le code doit décider lesquelles sont acceptables à chaque frontière.", "A string is an immutable sequence whose methods return new strings. undefined often means not supplied and null explicit absence; code must decide which is acceptable at each boundary.", "النص سلسلة ثابتة تعيد طرقها نصوصًا جديدة. تعني undefined غالبًا عدم التوفير وnull غيابًا صريحًا؛ ويقرر الكود المقبول عند كل حد."),
      analogy: L("Un gabarit assemble des étiquettes; optional chaining regarde dans une boîte seulement si elle existe.", "A template assembles labels; optional chaining looks inside a box only if it exists.", "يركب القالب بطاقات؛ وينظر optional chaining داخل صندوق فقط إن كان موجودًا."),
      mechanism: L("?. arrête l’accès sur null/undefined; ?? choisit un fallback uniquement pour ces deux valeurs, tandis que || remplace aussi chaîne vide, zéro et false. Les template literals interpolent des expressions sans concaténations ambiguës.", "?. stops access on null/undefined; ?? falls back only for those two values, while || also replaces empty string, zero, and false. Template literals interpolate expressions without ambiguous concatenation.", "توقف ?. الوصول عند null/undefined؛ وتختار ?? بديلًا لهما فقط، بينما تستبدل || أيضًا النص الفارغ والصفر وfalse. تدرج template literals التعبيرات بلا تسلسل ملتبس."),
      practice: L("Définissez les valeurs manquantes autorisées, normalisez trim/casse une fois à l’entrée et ne remplacez pas zéro ou false lorsqu’ils portent un sens métier.", "Define allowed missing values, normalize trim/case once at input, and do not replace zero or false when meaningful.", "حدد القيم الغائبة المسموحة وطبع trim/الحالة مرة عند الإدخال ولا تستبدل صفرًا أو false إن حملا معنى."),
      vocabulary: [v("immutable", "Valeur non modifiée en place.", "Value not modified in place.", "قيمة لا تتغير في مكانها."), v("nullish", "null ou undefined.", "null or undefined.", "null أو undefined."), v("template literal", "Chaîne délimitée par backticks avec interpolation.", "Backtick string supporting interpolation.", "نص بين backticks يدعم الإدراج.")],
      general: L("Construire un libellé robuste pour données partielles sans masquer les valeurs métier valides.", "Build a robust label for partial data without hiding valid business values.", "ابنِ تسمية متينة لبيانات جزئية بلا إخفاء قيم عمل صالحة."), lecomax: L("Les variantes produit optionnelles affichent un fallback traduit, tandis qu’un stock zéro reste zéro.", "Optional product variants show a translated fallback while zero stock remains zero.", "تعرض متغيرات المنتج الاختيارية بديلًا مترجمًا ويبقى المخزون صفرًا."),
      commands: ["node academy-labs/06-javascript/strings.js"], expectedResult: L("la console affiche « Casque — couleur standard » sans TypeError.", "the console prints “Casque — standard color” without TypeError.", "تعرض الطرفية «Casque — لون قياسي» بلا TypeError."),
      issues: [L("Cannot read properties of null.", "Cannot read properties of null.", "Cannot read properties of null."), L("Un stock zéro devient « inconnu ».", "Zero stock becomes “unknown.”", "يصبح المخزون صفر «مجهولًا»." )], fixes: [L("Utilisez optional chaining à la frontière réellement optionnelle.", "Use optional chaining at the genuinely optional boundary.", "استعمل optional chaining عند الحد الاختياري فعلًا."), L("Utilisez ?? plutôt que || pour préserver zéro et false.", "Use ?? rather than || to preserve zero and false.", "استعمل ?? بدل || للحفاظ على الصفر وfalse.")],
      question: L("Quel opérateur préserve zéro ?", "Which fallback operator preserves zero?", "أي معامل بديل يحفظ الصفر؟"), answer: L("??", "??", "??"), distractors: [L("||", "||", "||"), L("=", "=", "="), L("++", "++", "++")], quizExplanation: L("?? ne bascule que pour null ou undefined.", "?? falls back only for null or undefined.", "لا ينتقل ?? للبديل إلا مع null أو undefined."), next: L("La prochaine leçon lit les erreurs et organise le code en modules.", "The next lesson reads errors and organizes code into modules.", "يقرأ الدرس التالي الأخطاء وينظم الشفرة في وحدات."),
    }),
    rapidLesson({
      id: "lesson-06-04-errors-modules", order: 3, language: "javascript", filename: "academy-labs/06-javascript/price.mjs",
      source: `export function calculateTotal(price, quantity) {
  if (!Number.isFinite(price)) throw new TypeError("price must be finite");
  if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError("quantity must be positive");
  return price * quantity;
}

console.log("valid total", calculateTotal(349, 2));
try { calculateTotal(349, 0); }
catch (error) { console.error(error.name, error.message); console.error(error.stack); }`,
      title: L("Erreurs, stack traces et modules", "Errors, stack traces, and modules", "الأخطاء ومسارات الاستدعاء والوحدات"),
      concept: L("Une erreur est un résultat structuré signalant qu’un contrat ne peut être respecté. La stack trace relie le point d’échec aux appels précédents; les modules rendent les contrats explicites par imports et exports.", "An error is a structured outcome signaling a contract cannot be honored. The stack trace links failure to preceding calls; modules make contracts explicit through imports and exports.", "الخطأ نتيجة منظمة تشير إلى تعذر احترام عقد. يربط stack trace موضع الفشل بالاستدعاءات السابقة؛ وتجعل الوحدات العقود صريحة عبر imports وexports."),
      analogy: L("Une alarme nommée indique le capteur déclenché et le journal retrace le chemin jusqu’à lui; un module est une pièce avec portes d’entrée déclarées.", "A named alarm identifies the sensor and the log traces the path to it; a module is a room with declared entrances.", "يحدد إنذار مسمى المستشعر ويعيد السجل المسار إليه؛ والوحدة غرفة بمداخل معلنة."),
      mechanism: L("throw interrompt le chemin normal; catch doit soit récupérer avec sens, soit enrichir puis relancer. La première frame appartenant au projet est souvent le meilleur point de départ du diagnostic.", "throw interrupts normal flow; catch should recover meaningfully or enrich and rethrow. The first stack frame belonging to the project is often the best diagnostic start.", "تقطع throw المسار العادي؛ ويجب أن يستعيد catch بمعنى أو يثري ويرمي مجددًا. غالبًا أول frame من المشروع أفضل بداية للتشخيص."),
      practice: L("Validez les arguments à l’entrée, choisissez TypeError ou RangeError précis, évitez les catch silencieux et exportez de petites fonctions testables sans effet global.", "Validate arguments at entry, choose precise TypeError or RangeError, avoid silent catches, and export small testable functions without global effects.", "تحقق من المعاملات عند الدخول واختر TypeError أو RangeError دقيقًا وتجنب catch الصامت وصدّر دوال صغيرة قابلة للاختبار بلا أثر عام."),
      vocabulary: [v("exception", "Objet propagé hors du flux normal.", "Object propagated outside normal flow.", "كائن ينتشر خارج المسار العادي."), v("stack trace", "Suite des appels menant à l’erreur.", "Sequence of calls leading to an error.", "سلسلة الاستدعاءات المؤدية للخطأ."), v("module", "Fichier avec portée propre et interface import/export.", "File with its own scope and import/export interface.", "ملف بنطاق خاص وواجهة import/export.")],
      general: L("Créer une fonction de total qui échoue explicitement pour types ou plages invalides et lire sa stack.", "Create a total function that fails explicitly for invalid types or ranges and read its stack.", "أنشئ دالة إجمالي تفشل صراحة للأنواع أو المجالات غير الصالحة واقرأ stack."), lecomax: L("Les calculs panier rejettent données impossibles avant paiement; les logs gardent nom et contexte sans exposer de secret.", "Cart calculations reject impossible data before payment; logs preserve name and context without exposing secrets.", "ترفض حسابات السلة البيانات المستحيلة قبل الدفع؛ وتحفظ السجلات الاسم والسياق بلا كشف سر."),
      commands: ["node academy-labs/06-javascript/price.mjs"], expectedResult: L("698 s’affiche pour les données valides puis RangeError et sa stack prouvent le rejet de quantity=0.", "698 prints for valid data, then RangeError and its stack prove quantity=0 was rejected.", "تظهر 698 للبيانات الصالحة ثم يثبت RangeError وstack رفض quantity=0."),
      issues: [L("Une erreur est avalée et le total devient undefined.", "An error is swallowed and total becomes undefined.", "يُبتلع الخطأ ويصبح الإجمالي undefined."), L("L’import provoque un effet inattendu.", "Import causes an unexpected effect.", "يسبب import أثرًا غير متوقع." )], fixes: [L("Ne capturez que pour récupérer; sinon laissez remonter ou relancez avec cause.", "Catch only to recover; otherwise propagate or rethrow with cause.", "لا تلتقط إلا للاستعادة؛ وإلا دع الخطأ يصعد أو أعد رميه مع cause."), L("Gardez l’exécution de démonstration hors du module de fonctions exportées.", "Keep demo execution outside the exported-function module.", "أبق تنفيذ العرض خارج وحدة الدوال المصدرة.")],
      question: L("Où commencer dans une stack ?", "Where should stack inspection start?", "من أين يبدأ فحص stack؟"), answer: L("La première frame pertinente du projet", "The first relevant project frame", "أول frame ذات صلة من المشروع"), distractors: [L("La dernière ligne au hasard", "A random final line", "آخر سطر عشوائي"), L("Le CSS", "CSS", "CSS"), L("Le DNS", "DNS", "DNS")], quizExplanation: L("Cette frame situe le code contrôlé qui a déclenché ou propagé l’erreur.", "That frame locates controlled code that triggered or propagated the error.", "تحدد تلك frame الشفرة التي نتحكم فيها والتي أطلقت الخطأ أو نشرته."), next: L("Le module suivant transforme les données avec fonctions, tableaux et objets.", "The next module transforms data with functions, arrays, and objects.", "تحول الوحدة التالية البيانات بالدوال والمصفوفات والكائنات."),
    }),
  ],
});


modulesBlueprint.push({
  id: "module-05-responsive-tailwind", order: 5, icon: "📱", color: "#06B6D4",
  files: [{ path: "tailwind.config.js", mode: "existing" }, { path: "components/ProductCard.tsx", mode: "existing" }, { path: "academy-labs/05-responsive/card.tsx", mode: "create" }],
  title: L("Responsive design, UI/UX et Tailwind", "Responsive design, UI/UX, and Tailwind", "التصميم المتجاوب وUI/UX وTailwind"),
  summary: L("Concevoir mobile-first, choisir des breakpoints fondés sur le contenu, créer une hiérarchie claire et traduire le système en utilitaires Tailwind accessibles.", "Design mobile-first, choose content-driven breakpoints, create clear hierarchy, and translate the system into accessible Tailwind utilities.", "صمم من الهاتف أولًا واختر نقاط توقف يقودها المحتوى وأنشئ تسلسلًا واضحًا وترجم النظام إلى أدوات Tailwind متاحة."),
  lessons: [
    compactLesson({
      id: "lesson-05-01-mobile-first", order: 0, language: "css", filename: "academy-labs/05-responsive/mobile-first.css",
      source: `.catalog { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.filters { position: static; }

@media (min-width: 48rem) {
  .catalog { grid-template-columns: 16rem minmax(0, 1fr); }
  .filters { position: sticky; inset-block-start: 1rem; }
}`,
      title: L("Mobile-first et breakpoints fondés sur le contenu", "Mobile-first and content-driven breakpoints", "الهاتف أولًا ونقاط توقف يقودها المحتوى"),
      concept: L("Mobile-first définit la disposition de base pour l’espace le plus contraint, puis ajoute des capacités lorsque le contenu dispose réellement de place. Un breakpoint répond au moment où la composition se dégrade, pas au nom d’un appareil.", "Mobile-first defines the base layout for the most constrained space, then adds capabilities when content truly has room. A breakpoint responds to where composition breaks, not to a device name.", "يحدد منهج الهاتف أولًا التخطيط الأساسي للمساحة الأكثر ضيقًا ثم يضيف القدرات عندما تتوفر مساحة حقيقية. تستجيب نقطة التوقف للحظة انهيار التكوين لا لاسم جهاز."),
      analogy: L("On prépare d’abord une valise cabine essentielle, puis on ajoute des objets seulement lorsqu’un bagage plus grand est disponible.", "Pack the essential cabin bag first, then add items only when a larger case becomes available.", "نجهز حقيبة المقصورة الأساسية أولًا ثم نضيف أشياء عندما تتوفر حقيبة أكبر."),
      mechanism: L("Les règles sans media query s’appliquent partout; min-width enrichit progressivement. Les unités rem respectent le zoom et une vérification continue entre 320px et grand écran révèle les zones de rupture.", "Rules outside media queries apply everywhere; min-width progressively enhances them. rem units respect zoom, and continuous inspection from 320px upward reveals breakpoints.", "تطبق القواعد خارج media query في كل مكان؛ وتضيف min-width التحسين تدريجيًا. تحترم rem التكبير ويكشف الفحص المستمر من 320px فما فوق نقاط الانهيار."),
      practice: L("Commencez avec une colonne, agrandissez lentement la fenêtre et ajoutez la seconde colonne seulement lorsque filtre et contenu tiennent sans compression. Testez aussi texte long, zoom et orientation paysage.", "Start with one column, widen slowly, and add the second only when filters and content fit without compression. Also test long text, zoom, and landscape orientation.", "ابدأ بعمود واحد ووسّع ببطء ولا تضف الثاني إلا عندما تتسع المرشحات والمحتوى بلا ضغط. اختبر النص الطويل والتكبير والوضع الأفقي أيضًا."),
      vocabulary: [v("breakpoint", "Seuil où une nouvelle règle devient pertinente.", "Threshold where a new rule becomes useful.", "حد تصبح عنده قاعدة جديدة مفيدة."), v("mobile-first", "Base étroite enrichie avec min-width.", "Narrow base enhanced with min-width.", "قاعدة ضيقة تُحسن عبر min-width."), v("viewport", "Zone d’affichage CSS disponible.", "Available CSS display area.", "منطقة عرض CSS المتاحة.")],
      general: L("Testez une plage continue et ajoutez le moins de breakpoints possible, chacun justifié par un problème visuel précis.", "Test a continuous range and add as few breakpoints as possible, each justified by one precise visual problem.", "اختبر مجالًا مستمرًا وأضف أقل عدد ممكن من نقاط التوقف، ولكل منها مشكلة بصرية دقيقة."),
      lecomax: L("Le catalogue L’ecomax garde produits et achat prioritaires sur mobile; les filtres deviennent une colonne persistante seulement dès 48rem.", "The L’ecomax catalog keeps products and purchase primary on mobile; filters become a persistent column only from 48rem.", "يبقي كتالوج L’ecomax المنتجات والشراء أولوية على الهاتف؛ ولا تصبح المرشحات عمودًا ثابتًا إلا من 48rem."),
      commands: ["npm run dev", "npm run build"], expectedResult: L("la page reste sans débordement à 320px et adopte deux colonnes uniquement quand chacune conserve une largeur utilisable.", "the page stays overflow-free at 320px and adopts two columns only when each remains usable.", "تبقى الصفحة بلا تجاوز عند 320px وتتخذ عمودين فقط عندما يظل كل منهما قابلًا للاستعمال."),
      failures: [
        { symptom: L("La tablette reçoit une version trop serrée.", "Tablet gets an overly cramped layout.", "تحصل اللوحة على تخطيط شديد الضيق."), cause: L("Le breakpoint copie une largeur de téléphone marketing.", "The breakpoint copies a marketed phone width.", "تنسخ نقطة التوقف عرض هاتف تسويقي."), fix: L("Déplacez le seuil à l’endroit exact où le contenu dispose de l’espace requis.", "Move the threshold to where content has the required space.", "انقل الحد إلى الموضع الذي تتوفر فيه المساحة المطلوبة للمحتوى.") },
        { symptom: L("La version mobile hérite de nombreuses annulations.", "Mobile inherits many overrides.", "ترث نسخة الهاتف إلغاءات كثيرة."), cause: L("Les styles desktop ont été écrits comme base.", "Desktop styles were written as the base.", "كُتبت أنماط سطح المكتب كأساس."), fix: L("Remettez la colonne simple en base et placez les enrichissements dans min-width.", "Restore the simple column as base and put enhancements in min-width.", "أعد العمود البسيط كأساس وضع التحسينات داخل min-width.") },
      ],
      task: L("Transformer un catalogue une colonne en composition filtre + grille à partir de son point de rupture réel.", "Turn a one-column catalog into filter + grid at its real breaking point.", "حوّل كتالوج عمود واحد إلى مرشح + شبكة عند نقطة انهياره الحقيقية."),
      quiz: { question: L("Que doit représenter un breakpoint ?", "What should a breakpoint represent?", "ماذا يجب أن تمثل نقطة التوقف؟"), options: [L("Un appareil précis", "A specific device", "جهازًا محددًا"), L("Une rupture du contenu", "A content breakdown", "انهيار المحتوى"), L("Une version de Node", "A Node version", "إصدار Node"), L("Un statut HTTP", "An HTTP status", "حالة HTTP")], correctIndex: 1, explanation: L("Le contenu détermine quand une autre composition devient nécessaire.", "Content determines when another composition becomes necessary.", "يحدد المحتوى متى يصبح تكوين آخر ضروريًا.") },
      recap: L("la base sert le petit espace et chaque breakpoint ajoute une capacité justifiée par le contenu.", "the base serves small space and each breakpoint adds a content-justified capability.", "تخدم القاعدة المساحة الصغيرة وتضيف كل نقطة توقف قدرة يبررها المحتوى."),
      next: L("La prochaine leçon organise hiérarchie, rythme, affordances et retours utilisateur.", "The next lesson organizes hierarchy, rhythm, affordances, and feedback.", "ينظم الدرس التالي التسلسل والإيقاع والدلالات والتغذية الراجعة."),
    }),
    compactLesson({
      id: "lesson-05-02-ui-ux", order: 1, language: "tsx", filename: "academy-labs/05-responsive/product-card.tsx",
      source: `"use client";
import { useState } from "react";

export default function ProductCardPreview() {
  const [added, setAdded] = useState(false);
  return <article className="rounded-xl border bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase text-green-700">Nouveau</p>
    <h2 className="mt-2 text-base font-semibold text-gray-900">Casque Bluetooth</h2>
    <p className="mt-1 text-sm text-gray-600">Livraison offerte</p><p className="mt-3 text-lg font-bold">349 MAD</p>
    <button type="button" onClick={() => setAdded(true)} className="mt-4 min-h-11 w-full rounded-lg bg-green-600 text-white focus-visible:ring-4">{added ? "Ajouté" : "Ajouter au panier"}</button>
    <p className="mt-2 min-h-6 text-sm" role="status">{added ? "Le produit est dans le panier." : ""}</p>
  </article>;
}`,
      title: L("Hiérarchie visuelle, rythme et feedback", "Visual hierarchy, rhythm, and feedback", "التسلسل البصري والإيقاع والتغذية الراجعة"),
      concept: L("Une interface guide l’attention par importance, proximité, contraste et ordre. L’UX relie cette lecture à une action compréhensible, un retour immédiat et une récupération possible après erreur.", "An interface guides attention through importance, proximity, contrast, and order. UX connects that reading to an understandable action, immediate feedback, and recovery after error.", "توجّه الواجهة الانتباه عبر الأهمية والتقارب والتباين والترتيب. تربط UX هذه القراءة بفعل مفهوم وتغذية راجعة فورية واستعادة ممكنة بعد الخطأ."),
      analogy: L("Une vitrine place le produit, le prix et l’action dans un ordre volontaire; si tout crie, rien ne guide.", "A shop window deliberately orders product, price, and action; if everything shouts, nothing guides.", "ترتب واجهة المتجر المنتج والسعر والفعل عمدًا؛ إذا صاح كل شيء فلن يرشد شيء."),
      mechanism: L("Une échelle limitée de tailles et espacements crée un rythme prévisible. Les contrôles montrent hover, focus, pressed, loading, success et error sans déplacer brutalement le contenu.", "A limited size and spacing scale creates predictable rhythm. Controls show hover, focus, pressed, loading, success, and error without abruptly shifting content.", "ينشئ سلم محدود للأحجام والمسافات إيقاعًا متوقعًا. تعرض عناصر التحكم hover وfocus وpressed وloading وsuccess وerror بلا تحريك مفاجئ للمحتوى."),
      practice: L("Donnez une action primaire par zone, gardez une cible tactile d’environ 44px et testez le parcours en demandant à quelqu’un de verbaliser ce qu’il ferait ensuite.", "Provide one primary action per area, keep touch targets around 44px, and test by asking someone to verbalize what they would do next.", "وفر فعلًا رئيسيًا واحدًا لكل منطقة وحافظ على هدف لمس نحو 44px واختبر بطلب شرح الخطوة التالية بصوت عال."),
      vocabulary: [v("hierarchy", "Ordre perceptif de l’importance.", "Perceived order of importance.", "الترتيب المدرك للأهمية."), v("affordance", "Indice indiquant comment agir sur un élément.", "Cue indicating how an element can be used.", "إشارة توضح كيفية استعمال العنصر."), v("feedback", "Réponse perceptible à une action utilisateur.", "Perceivable response to a user action.", "استجابة ملحوظة لفعل المستخدم.")],
      general: L("Priorisez objectif, contenu essentiel et action; retirez les accents visuels qui ne soutiennent aucune décision.", "Prioritize goal, essential content, and action; remove visual accents that support no decision.", "أعط الأولوية للهدف والمحتوى الأساسي والفعل وأزل الزخارف التي لا تدعم قرارًا."),
      lecomax: L("Dans ProductCard, image et nom identifient, prix décide, livraison rassure et un seul bouton vert déclenche l’achat.", "In ProductCard, image and name identify, price supports decision, shipping reassures, and one green button triggers purchase.", "في ProductCard تعرّف الصورة والاسم المنتج ويدعم السعر القرار وتطمئن الشحنة ويشغّل زر أخضر واحد الشراء."),
      commands: ["npm run dev", "npm run build"], expectedResult: L("un utilisateur identifie produit, prix et action en quelques secondes, avec une cible clavier et tactile visible.", "a user identifies product, price, and action within seconds, with a visible keyboard and touch target.", "يحدد المستخدم المنتج والسعر والفعل خلال ثوانٍ مع هدف واضح للوحة المفاتيح واللمس."),
      failures: [{ symptom: L("Tous les textes semblent également importants.", "All text appears equally important.", "تبدو كل النصوص متساوية الأهمية."), cause: L("Taille, graisse, couleur et espacement ne créent aucun niveau.", "Size, weight, color, and spacing create no levels.", "لا تنشئ الأحجام والأوزان والألوان والمسافات مستويات."), fix: L("Définissez trois niveaux et vérifiez la lecture en plissant les yeux.", "Define three levels and check by squinting.", "حدد ثلاثة مستويات وافحص القراءة مع تضييق العينين.") }, { symptom: L("Un clic semble ne rien faire.", "A click appears to do nothing.", "يبدو النقر بلا نتيجة."), cause: L("Aucun état loading, succès ou erreur n’est rendu.", "No loading, success, or error state is rendered.", "لا تُعرض حالة loading أو success أو error."), fix: L("Affichez immédiatement un état et une issue récupérable.", "Immediately show a state and recoverable outcome.", "اعرض فورًا حالة ونتيجة قابلة للاستعادة.") }],
      task: L("Réorganiser une carte produit afin que l’action et son feedback soient évidents.", "Reorganize a product card so its action and feedback are obvious.", "أعد تنظيم بطاقة منتج كي يكون الفعل وتغذيته الراجعة واضحين."),
      quiz: { question: L("Quel élément doit dominer une carte d’achat ?", "What should dominate a purchase card?", "ما الذي يجب أن يهيمن على بطاقة شراء؟"), options: [L("Chaque détail", "Every detail", "كل التفاصيل"), L("La décision principale et son action", "The primary decision and action", "القرار الرئيسي وفعله"), L("Le footer", "The footer", "التذييل"), L("Une animation continue", "A continuous animation", "حركة مستمرة")], correctIndex: 1, explanation: L("La hiérarchie sert l’objectif utilisateur, pas une compétition décorative.", "Hierarchy serves the user goal, not decorative competition.", "يخدم التسلسل هدف المستخدم لا منافسة زخرفية."),
      }, recap: L("la hiérarchie dirige l’attention et le feedback confirme chaque action ou fournit une récupération.", "hierarchy directs attention and feedback confirms each action or provides recovery.", "يوجه التسلسل الانتباه وتؤكد التغذية كل فعل أو توفر استعادة."), next: L("La prochaine leçon traduit les décisions CSS en utilitaires Tailwind composables.", "The next lesson translates CSS decisions into composable Tailwind utilities.", "يترجم الدرس التالي قرارات CSS إلى أدوات Tailwind قابلة للتركيب."),
    }),
    compactLesson({
      id: "lesson-05-03-tailwind", order: 2, language: "tsx", filename: "academy-labs/05-responsive/tailwind-card.tsx",
      source: `export default function TailwindCard() {
  return <article className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
    <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Produit</h2>
    <p className="text-sm text-gray-600">Description courte</p>
    <button type="button" className="min-h-11 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 disabled:opacity-50">Acheter</button>
  </article>;
}`,
      title: L("Tailwind : utilitaires, variantes et composition", "Tailwind: utilities, variants, and composition", "Tailwind: الأدوات والمتغيرات والتركيب"),
      concept: L("Tailwind mappe des classes atomiques vers un système CSS contraint; les variantes préfixées décrivent état et contexte. Le HTML devient la composition locale, tandis que la configuration et les composants partagés portent les décisions globales.", "Tailwind maps atomic classes to a constrained CSS system; prefixed variants describe state and context. Markup becomes local composition while configuration and shared components carry global decisions.", "يربط Tailwind أصنافًا ذرية بنظام CSS مقيد؛ وتصف المتغيرات ذات البادئة الحالة والسياق. يصبح الترميز تركيبًا محليًا وتحمل الإعدادات والمكونات المشتركة القرارات العامة."),
      analogy: L("Comme des briques normalisées : chaque classe a une fonction réduite, et leur ordre de composition construit un composant cohérent.", "Like standardized bricks: each class has a small purpose and their composition builds a coherent component.", "مثل مكعبات معيارية: لكل صنف وظيفة صغيرة ويبني تركيبها مكونًا متسقًا."),
      mechanism: L("p-4, gap-3 et text-sm proviennent d’échelles partagées; sm: s’active à min-width, hover: et focus-visible: génèrent des sélecteurs d’état. Le compilateur ne garde que les classes détectées statiquement.", "p-4, gap-3, and text-sm come from shared scales; sm: activates at min-width, while hover: and focus-visible: generate state selectors. The compiler retains only statically detected classes.", "تأتي p-4 وgap-3 وtext-sm من سلالم مشتركة؛ وتتفعل sm: عند min-width وتولد hover: وfocus-visible: محددات حالة. يحتفظ المترجم بالأصناف المكتشفة ثابتًا فقط."),
      practice: L("Regroupez les classes par layout, espace, typographie, couleur et état; extrayez un composant lorsque la structure porte une responsabilité, pas seulement pour raccourcir une chaîne.", "Group classes by layout, spacing, typography, color, and state; extract a component when structure carries responsibility, not merely to shorten a string.", "اجمع الأصناف حسب التخطيط والمسافة والطباعة واللون والحالة؛ واستخرج مكونًا عندما تحمل البنية مسؤولية لا لمجرد تقصير النص."),
      vocabulary: [v("utility class", "Classe appliquant une décision CSS ciblée.", "Class applying one focused CSS decision.", "صنف يطبق قرار CSS محددًا."), v("variant", "Préfixe conditionnant une utilité à un état ou contexte.", "Prefix conditioning a utility on state or context.", "بادئة تشترط الأداة بحالة أو سياق."), v("responsive prefix", "Variante min-width comme sm ou lg.", "A min-width variant such as sm or lg.", "متغير min-width مثل sm أو lg.")],
      general: L("Utilisez l’échelle existante, écrivez toutes les variantes nécessaires et évitez les noms de classes construits dynamiquement que le compilateur ne voit pas.", "Use existing scales, write every needed variant, and avoid dynamically constructed class names the compiler cannot see.", "استعمل السلم الموجود واكتب كل المتغيرات اللازمة وتجنب أسماء الأصناف المبنية ديناميكيًا التي لا يراها المترجم."),
      lecomax: L("ProductCard compose la grille et les états avec les tokens Tailwind verts, gris et ambre tout en gardant une cible minimale de 44px.", "ProductCard composes layout and states from green, gray, and amber Tailwind tokens while preserving a 44px minimum target.", "يركب ProductCard التخطيط والحالات من رموز Tailwind الخضراء والرمادية والكهرمانية ويحافظ على هدف أدنى 44px."),
      commands: ["npm run dev", "npm run build"], expectedResult: L("les utilitaires produisent une carte mobile, un padding enrichi dès sm et des états hover/focus/disabled visibles.", "utilities produce a mobile card, enhanced padding from sm, and visible hover/focus/disabled states.", "تنتج الأدوات بطاقة هاتف وحشوًا محسنًا من sm وحالات hover/focus/disabled مرئية."),
      failures: [{ symptom: L("Une couleur dynamique n’apparaît pas en production.", "A dynamic color disappears in production.", "يختفي لون ديناميكي في الإنتاج."), cause: L("La chaîne bg-${color}-600 n’est pas détectable statiquement.", "The bg-${color}-600 string cannot be detected statically.", "لا يمكن اكتشاف نص bg-${color}-600 ثابتًا."), fix: L("Mappez les variantes vers des chaînes de classes complètes.", "Map variants to complete class strings.", "اربط المتغيرات بنصوص أصناف كاملة.") }, { symptom: L("Le bouton perd son focus visible.", "The button loses visible focus.", "يفقد الزر التركيز المرئي."), cause: L("outline-none a été ajouté sans ring de remplacement.", "outline-none was added without a replacement ring.", "أضيف outline-none بلا ring بديل."), fix: L("Associez toujours focus-visible:ring et un contraste suffisant.", "Always pair focus-visible:ring with sufficient contrast.", "اربط دائمًا focus-visible:ring بتباين كافٍ.") }],
      task: L("Reproduire une carte accessible uniquement avec les utilitaires de l’échelle existante.", "Reproduce an accessible card using only existing-scale utilities.", "أعد بطاقة متاحة بأدوات السلم الموجود فقط."),
      quiz: { question: L("Que signifie sm:p-5 ?", "What does sm:p-5 mean?", "ماذا تعني sm:p-5؟"), options: [L("Padding dès le breakpoint sm", "Padding from the sm breakpoint", "حشو بدءًا من نقطة sm"), L("Petite police partout", "Small font everywhere", "خط صغير في كل مكان"), L("Cinq colonnes", "Five columns", "خمسة أعمدة"), L("État souris", "Mouse state", "حالة الفأرة")], correctIndex: 0, explanation: L("sm est une variante min-width et p-5 l’utilité activée.", "sm is a min-width variant and p-5 the activated utility.", "sm متغير min-width وp-5 الأداة المفعلة."),
      }, recap: L("Tailwind compose des décisions atomiques et ses variantes rendent contexte et états explicites.", "Tailwind composes atomic decisions and its variants make context and states explicit.", "يركب Tailwind قرارات ذرية وتجعل متغيراته السياق والحالات صريحة."), next: L("La prochaine leçon assemble une carte produit complète et la teste sur trois tailles.", "The next lesson assembles a complete product card and tests it at three sizes.", "يجمع الدرس التالي بطاقة منتج كاملة ويختبرها على ثلاثة أحجام."),
    }),
    compactLesson({
      id: "lesson-05-04-responsive-component", order: 3, language: "tsx", filename: "academy-labs/05-responsive/card.tsx",
      source: `type Product = { name: string; price: number; image: string; imageAlt: string };

export function ProductCard({ product }: { product: Product }) {
  return <article className="group grid h-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border bg-white">
    <img className="aspect-square h-auto w-full object-cover transition group-hover:scale-[1.02] motion-reduce:transition-none" src={product.image} alt={product.imageAlt} />
    <div className="p-4"><h2 className="line-clamp-2 font-semibold">{product.name}</h2><p className="mt-2 text-lg font-bold">{product.price} MAD</p></div>
    <button type="button" className="m-4 mt-0 min-h-11 rounded-lg bg-green-600 text-white">Ajouter</button>
  </article>;
}`,
      title: L("Atelier : carte produit responsive complète", "Workshop: complete responsive product card", "ورشة: بطاقة منتج متجاوبة كاملة"),
      concept: L("Un composant responsive protège ses invariants — ordre, cible d’action, média stable, contenu variable — dans tout conteneur. Il ne suppose ni nombre de colonnes ni longueur fixe des données.", "A responsive component protects its invariants—order, action target, stable media, variable content—in any container. It assumes neither a column count nor fixed data length.", "يحمي المكون المتجاوب ثوابته—الترتيب وهدف الفعل ووسيطًا ثابتًا ومحتوى متغيرًا—في أي حاوية. لا يفترض عدد أعمدة ولا طول بيانات ثابتًا."),
      analogy: L("Une brique de construction conserve ses points d’ancrage même lorsqu’elle entre dans des murs de tailles différentes.", "A building brick keeps its attachment points even in walls of different sizes.", "تحافظ لبنة البناء على نقاط اتصالها حتى داخل جدران بأحجام مختلفة."),
      mechanism: L("aspect-square réserve le média, grid rows pousse l’action en bas et h-full aligne une rangée de cartes. motion-reduce neutralise une transition non essentielle selon la préférence système.", "aspect-square reserves media, grid rows pushes the action down, and h-full aligns a row of cards. motion-reduce disables nonessential transitions according to system preference.", "تحجز aspect-square الوسيط وتدفع صفوف grid الفعل للأسفل وتوحد h-full بطاقات الصف. تعطل motion-reduce الانتقالات غير الضرورية حسب تفضيل النظام."),
      practice: L("Testez noms d’une et six lignes, image absente, prix long, zoom 200%, clavier, reduced motion et conteneurs 160/280/420px. Corrigez le composant plutôt que chaque page hôte.", "Test one- and six-line names, missing image, long price, 200% zoom, keyboard, reduced motion, and 160/280/420px containers. Fix the component rather than every host page.", "اختبر أسماء من سطر وستة أسطر وصورة مفقودة وسعرًا طويلًا وتكبير 200% ولوحة المفاتيح وتقليل الحركة وحاويات 160/280/420px. أصلح المكون لا كل صفحة مضيفة."),
      vocabulary: [v("invariant", "Propriété que le composant doit toujours préserver.", "Property the component must always preserve.", "خاصية يجب أن يحافظ عليها المكون دائمًا."), v("aspect ratio", "Rapport stable entre largeur et hauteur.", "Stable ratio between width and height.", "نسبة ثابتة بين العرض والارتفاع."), v("reduced motion", "Préférence demandant moins d’animations non essentielles.", "Preference requesting fewer nonessential animations.", "تفضيل يطلب حركات غير أساسية أقل."),
      ],
      general: L("Définissez les invariants, construisez avec contenu réel extrême et testez le composant dans plusieurs conteneurs plutôt que seulement plusieurs viewports.", "Define invariants, build with extreme real content, and test in several containers rather than only viewports.", "حدد الثوابت وابنِ بمحتوى واقعي متطرف واختبر المكون في حاويات متعددة لا في viewports فقط."),
      lecomax: L("La vraie ProductCard L’ecomax doit garder image, nom, prix et ajout utilisables dans rails, résultats et catégories, en français comme en arabe.", "The real L’ecomax ProductCard must keep image, name, price, and add action usable in rails, results, and categories, in French and Arabic.", "يجب أن تحافظ ProductCard الحقيقية في L’ecomax على الصورة والاسم والسعر وفعل الإضافة في الشرائط والنتائج والفئات بالفرنسية والعربية."),
      commands: ["npm run dev", "npm run build"], expectedResult: L("la carte garde son action alignée, son média stable et son contenu lisible à 390px, tablette et desktop, y compris en RTL.", "the card keeps action aligned, media stable, and content readable at 390px, tablet, desktop, and RTL.", "تحافظ البطاقة على محاذاة الفعل وثبات الوسيط ووضوح المحتوى عند 390px واللوحة وسطح المكتب وRTL."),
      failures: [{ symptom: L("Les boutons d’une rangée sont désalignés.", "Buttons in a row are misaligned.", "أزرار الصف غير مصطفة."), cause: L("La hauteur variable du contenu n’est pas absorbée par une ligne flexible.", "Variable content height is not absorbed by a flexible row.", "لا يمتص صف مرن ارتفاع المحتوى المتغير."), fix: L("Utilisez une grille interne avec une ligne 1fr avant l’action.", "Use an internal grid with a 1fr row before the action.", "استعمل شبكة داخلية بصف 1fr قبل الفعل.") }, { symptom: L("Le zoom de l’image gêne reduced motion.", "Image zoom ignores reduced motion.", "يتجاهل تكبير الصورة تقليل الحركة."), cause: L("La transition ne possède aucune variante motion-reduce.", "The transition lacks a motion-reduce variant.", "لا يملك الانتقال متغير motion-reduce."), fix: L("Ajoutez motion-reduce:transition-none et évitez les mouvements indispensables à la compréhension.", "Add motion-reduce:transition-none and avoid motion required for understanding.", "أضف motion-reduce:transition-none وتجنب حركة ضرورية للفهم.") }],
      task: L("Implémenter et éprouver la carte avec une matrice de contenus et tailles extrêmes.", "Implement and stress-test the card with a matrix of extreme content and sizes.", "نفذ البطاقة واختبر ضغطها بمصفوفة من المحتويات والأحجام المتطرفة."),
      quiz: { question: L("Pourquoi tester la largeur du conteneur ?", "Why test container width?", "لماذا نختبر عرض الحاوية؟"), options: [L("Un composant peut vivre dans plusieurs layouts", "A component can live in multiple layouts", "قد يعيش المكون في تخطيطات متعددة"), L("Pour changer Git", "To change Git", "لتغيير Git"), L("Pour éviter alt", "To avoid alt", "لتجنب alt"), L("Pour remplacer HTTP", "To replace HTTP", "لاستبدال HTTP")], correctIndex: 0, explanation: L("Le viewport ne révèle pas toutes les contraintes imposées par une grille ou une barre latérale.", "The viewport does not reveal every constraint imposed by a grid or sidebar.", "لا يكشف viewport كل القيود التي تفرضها شبكة أو شريط جانبي."),
      }, recap: L("un composant robuste préserve ses invariants avec données, langues, préférences et conteneurs variables.", "a robust component preserves invariants across variable data, languages, preferences, and containers.", "يحافظ المكون المتين على ثوابته عبر بيانات ولغات وتفضيلات وحاويات متغيرة."), next: L("Le module suivant apporte la logique avec les fondamentaux JavaScript.", "The next module adds logic through JavaScript fundamentals.", "تضيف الوحدة التالية المنطق عبر أساسيات جافاسكربت."),
    }),
  ],
});


modulesBlueprint.push({
  id: "module-03-html-accessibility",
  order: 3,
  icon: "🏗️",
  color: "#EA580C",
  files: [
    { path: "app/page.tsx", mode: "existing" },
    { path: "app/layout.tsx", mode: "existing" },
    { path: "academy-labs/03-html/catalog.html", mode: "create" },
  ],
  title: L("HTML sémantique et accessible", "Semantic and accessible HTML", "HTML دلالي ومتاح"),
  summary: L("Structurer une page, ses repères, titres, actions, formulaires et médias pour les navigateurs, moteurs de recherche, claviers et lecteurs d’écran.", "Structure a page, landmarks, headings, actions, forms, and media for browsers, search engines, keyboards, and screen readers.", "هيكلة الصفحة ومعالمها وعناوينها وإجراءاتها ونماذجها ووسائطها للمتصفحات ومحركات البحث ولوحات المفاتيح وقارئات الشاشة."),
  lessons: [
    coreLesson({
      id: "lesson-03-01-document-semantics", order: 0, language: "html", filename: "academy-labs/03-html/catalog.html",
      source: `<!doctype html>
<html lang="fr">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Catalogue | L'ecomax</title></head>
  <body>
    <header><nav aria-label="Navigation principale"><a href="/">Accueil</a> <a href="/nouveautes">Nouveautés</a></nav></header>
    <main>
      <h1>Catalogue L'ecomax</h1>
      <section aria-labelledby="new"><h2 id="new">Nouveautés</h2><ul><li><article><h3>Casque Bluetooth</h3><p>349 MAD</p></article></li></ul></section>
    </main>
    <footer>© L'ecomax</footer>
  </body>
</html>`,
      title: L("Anatomie et sémantique d’un document", "Document anatomy and semantics", "بنية المستند ودلالاته"),
      mentalModel: L("HTML décrit la nature et la hiérarchie du contenu, pas son apparence. Le navigateur transforme les éléments en arbre DOM et en arbre d’accessibilité; des balises justes fournissent donc du sens avant tout CSS.", "HTML describes content nature and hierarchy, not appearance. The browser turns elements into a DOM tree and an accessibility tree, so correct elements provide meaning before any CSS.", "يصف HTML طبيعة المحتوى وتسلسله لا مظهره. يحول المتصفح العناصر إلى شجرة DOM وشجرة إتاحة؛ لذلك تمنح العناصر الصحيحة معنى قبل أي CSS."),
      analogy: L("Les balises sont les panneaux d’un bâtiment : main, nav et footer indiquent la fonction des zones même avant la décoration.", "Tags are building signs: main, nav, and footer identify area functions before decoration.", "الوسوم لافتات مبنى: تحدد main وnav وfooter وظيفة المناطق قبل الزينة."),
      explanation: [L("doctype active le mode standard; html porte la langue; head contient les métadonnées et body le contenu rendu. Une langue correcte améliore prononciation et traduction assistée.", "doctype activates standards mode; html carries language; head contains metadata and body rendered content. Correct language improves pronunciation and assisted translation.", "يفعّل doctype الوضع القياسي؛ ويحمل html اللغة؛ ويحتوي head البيانات الوصفية وbody المحتوى المصيّر. تحسن اللغة الصحيحة النطق والترجمة المساعدة."), L("header, nav, main et footer créent des repères navigables. Une page n’a normalement qu’un main, tandis que section doit avoir un titre décrivant son thème.", "header, nav, main, and footer create navigable landmarks. A page normally has one main, while a section should have a heading describing its theme.", "تنشئ header وnav وmain وfooter معالم قابلة للتنقل. للصفحة عادة main واحدة، ويجب أن يحمل section عنوانًا يصف موضوعه."), L("Les niveaux h1 à h6 expriment l’imbrication documentaire et ne servent pas à choisir une taille visuelle. Un plan logique permet de parcourir la page sans lire chaque paragraphe.", "Heading levels h1–h6 express document nesting rather than visual size. A logical outline lets people scan a page without reading every paragraph.", "تعبّر مستويات h1 إلى h6 عن تداخل المستند لا الحجم البصري. يسمح مخطط منطقي بتصفح الصفحة من دون قراءة كل فقرة.")],
      vocabulary: [v("semantic HTML", "Éléments choisis selon la fonction du contenu.", "Elements chosen by content function.", "عناصر مختارة حسب وظيفة المحتوى."), v("DOM", "Arbre d’objets construit depuis le balisage.", "Object tree built from markup.", "شجرة كائنات مبنية من الترميز."), v("landmark", "Région nommée facilitant la navigation assistée.", "Named region aiding assistive navigation.", "منطقة مسماة تسهّل التنقل المساعد.")],
      generalApplication: L("Écrivez d’abord le plan des contenus avec des éléments natifs, puis ajoutez classes et styles sans casser la hiérarchie.", "Write the content outline with native elements first, then add classes and styles without breaking hierarchy.", "اكتب مخطط المحتوى بالعناصر الأصلية أولًا ثم أضف الأصناف والتنسيق من دون كسر التسلسل."),
      lecomaxApplication: L("L’accueil L’ecomax doit exposer une navigation principale, un main unique, un h1 décrivant la boutique et des sections titrées pour les collections.", "The L’ecomax home page should expose primary navigation, one main, an h1 describing the store, and titled collection sections.", "يجب أن تعرض واجهة L’ecomax تنقلًا رئيسيًا وmain واحدة وh1 يصف المتجر وأقسام مجموعات ذات عناوين."),
      commands: ["npm run dev", "npm run build"],
      expectedResult: L("l’inspecteur Accessibility affiche des repères main/navigation/footer et un plan de titres cohérent.", "the Accessibility inspector shows main/navigation/footer landmarks and a coherent heading outline.", "يعرض فاحص Accessibility معالم main/navigation/footer وتسلسل عناوين متماسكًا."),
      commonErrors: [error(L("Toute la page est composée de div.", "The whole page is made of div elements.", "تتكون الصفحة كلها من div."), L("La structure a été choisie selon la mise en page plutôt que la fonction.", "Structure was chosen by layout rather than function.", "اختيرت البنية حسب التخطيط لا الوظيفة."), L("Remplacez chaque conteneur par l’élément natif correspondant quand une sémantique existe.", "Replace each container with the matching native element where semantics exist.", "استبدل كل حاوية بالعنصر الأصلي الموافق عندما توجد دلالة.")), error(L("Le lecteur d’écran annonce une langue incorrecte.", "The screen reader announces the wrong language.", "ينطق قارئ الشاشة لغة خاطئة."), L("L’attribut lang racine manque ou ne correspond pas au contenu.", "The root lang attribute is missing or mismatched.", "سمة lang في الجذر مفقودة أو غير مطابقة."), L("Définissez lang sur html et marquez localement les passages d’une autre langue.", "Set lang on html and locally mark passages in another language.", "حدد lang على html وعلّم المقاطع بلغة أخرى محليًا."))],
      task: L("Créer le squelette sémantique d’un catalogue avec repères et titres ordonnés.", "Create a semantic catalog skeleton with landmarks and ordered headings.", "أنشئ هيكل كتالوج دلاليًا بمعالم وعناوين مرتبة."),
      solutionExplanation: L("La solution donne un rôle natif à chaque région et relie la section à son titre, ce qui rend le document compréhensible sans CSS.", "The solution gives every region a native role and connects the section to its heading, making the document understandable without CSS.", "يعطي الحل كل منطقة دورًا أصليًا ويربط القسم بعنوانه، فيصبح المستند مفهومًا بلا CSS."),
      quiz: { question: L("Pourquoi ne faut-il pas choisir h3 seulement pour sa taille ?", "Why should h3 not be chosen only for its size?", "لماذا لا نختار h3 لحجمه فقط؟"), options: [L("Les titres décrivent une hiérarchie", "Headings describe hierarchy", "لأن العناوين تصف تسلسلًا"), L("h3 interdit CSS", "h3 forbids CSS", "لأن h3 يمنع CSS"), L("h3 ne fonctionne pas en mobile", "h3 fails on mobile", "لأن h3 لا يعمل على الهاتف"), L("Les moteurs ignorent h3", "Search engines ignore h3", "لأن المحركات تتجاهل h3")], correctIndex: 0, explanation: L("La taille se règle en CSS; le niveau communique la place du sujet dans le plan.", "Size belongs in CSS; level communicates the topic’s place in the outline.", "يضبط CSS الحجم، بينما يوضح المستوى مكان الموضوع في المخطط.") },
      recap: L("la sémantique construit un plan et des repères utilisables avant toute présentation visuelle.", "semantics builds an outline and usable landmarks before visual presentation.", "تبني الدلالة مخططًا ومعالم قابلة للاستعمال قبل العرض البصري."),
      next: L("La prochaine leçon choisit correctement liens, boutons, listes et noms accessibles.", "The next lesson correctly chooses links, buttons, lists, and accessible names.", "يختار الدرس التالي الروابط والأزرار والقوائم والأسماء المتاحة بصورة صحيحة."),
    }),
    coreLesson({
      id: "lesson-03-02-actions-keyboard", order: 1, language: "tsx", filename: "academy-labs/03-html/actions.tsx",
      source: `"use client";
import { useState } from "react";

export default function FilterNavigation() {
  const [open, setOpen] = useState(false);
  return <section aria-label="Navigation et filtres">
    <nav aria-label="Catégories"><ul><li><a href="/nouveautes">Nouveautés</a></li></ul></nav>
    <button type="button" aria-expanded={open} aria-controls="filters" onClick={() => setOpen((value) => !value)}>Filtres</button>
    <aside id="filters" hidden={!open} aria-label="Filtres produits"><label><input type="checkbox" name="stock" /> En stock</label></aside>
  </section>;
}`,
      title: L("Liens, boutons et navigation clavier", "Links, buttons, and keyboard navigation", "الروابط والأزرار والتنقل بلوحة المفاتيح"),
      mentalModel: L("Un lien change de ressource ou d’URL; un bouton déclenche une action dans le contexte actuel. Les éléments natifs fournissent automatiquement focus, activation clavier, rôle et nom que du JavaScript artisanal reproduit rarement complètement.", "A link changes resource or URL; a button triggers an action in the current context. Native elements automatically provide focus, keyboard activation, role, and name that handmade JavaScript rarely reproduces completely.", "يغيّر الرابط المورد أو URL؛ ويشغّل الزر إجراءً في السياق الحالي. توفر العناصر الأصلية تلقائيًا التركيز والتفعيل بلوحة المفاتيح والدور والاسم، وهي أمور نادرًا ما تعيدها جافاسكربت اليدوية كاملة."),
      analogy: L("Une porte mène ailleurs, comme un lien; un interrupteur agit dans la pièce, comme un bouton.", "A door goes elsewhere like a link; a switch acts within the room like a button.", "ينقلك الباب إلى مكان آخر مثل الرابط؛ ويعمل المفتاح داخل الغرفة مثل الزر."),
      explanation: [L("href donne au lien sa destination, autorise l’ouverture dans un nouvel onglet et reste utilisable sans JavaScript. Un faux lien onClick supprime ces capacités.", "href gives a link its destination, enables opening in a new tab, and works without JavaScript. A fake onClick link removes those capabilities.", "تعطي href الرابط وجهته وتسمح بفتحه في تبويب جديد وتعمل من دون جافاسكربت. يزيل رابط onClick المزيف هذه القدرات."), L("button répond à Entrée et Espace; type=button empêche une soumission accidentelle dans un formulaire. aria-expanded expose l’état d’un panneau, et aria-controls nomme sa cible.", "button responds to Enter and Space; type=button prevents accidental form submission. aria-expanded exposes panel state and aria-controls names its target.", "يستجيب button لـEnter وSpace؛ ويمنع type=button إرسال نموذج عرضيًا. تكشف aria-expanded حالة اللوحة وتسمي aria-controls هدفها."), L("L’ordre de focus suit normalement le DOM. Ne forcez pas tabindex positif; rendez les contrôles visibles au focus et replacez logiquement le focus lorsqu’un dialogue s’ouvre ou se ferme.", "Focus order normally follows the DOM. Avoid positive tabindex; keep controls visibly focused and move focus logically when a dialog opens or closes.", "يتبع ترتيب التركيز DOM عادة. تجنب tabindex الموجب؛ وأظهر التركيز بوضوح وانقله منطقيًا عند فتح مربع حوار أو إغلاقه.")],
      vocabulary: [v("accessible name", "Texte utilisé par les technologies d’assistance pour identifier un contrôle.", "Text assistive technology uses to identify a control.", "نص تستعمله التقنيات المساعدة لتعريف عنصر تحكم."), v("focus", "Point courant recevant les actions clavier.", "Current target receiving keyboard actions.", "الهدف الحالي الذي يستقبل أفعال لوحة المفاتيح."), v("state", "Information changeante comme ouvert, sélectionné ou désactivé.", "Changing information such as open, selected, or disabled.", "معلومة متغيرة مثل مفتوح أو محدد أو معطل.")],
      generalApplication: L("Choisissez l’élément natif selon le résultat de l’action, puis testez tout le parcours avec Tab, Shift+Tab, Entrée, Espace et Échap.", "Choose the native element by action outcome, then test the whole journey with Tab, Shift+Tab, Enter, Space, and Escape.", "اختر العنصر الأصلي حسب نتيجة الفعل ثم اختبر المسار كاملًا بـTab وShift+Tab وEnter وSpace وEscape."),
      lecomaxApplication: L("Les catégories sont des liens; ouvrir les filtres, ajouter au panier et fermer une modale sont des boutons dont l’état doit être annoncé.", "Categories are links; opening filters, adding to cart, and closing a modal are buttons whose state must be announced.", "الفئات روابط؛ وفتح المرشحات والإضافة إلى السلة وإغلاق النافذة أزرار يجب إعلان حالتها."),
      commands: ["npm run dev", "npm run build"],
      expectedResult: L("Tab atteint chaque contrôle dans l’ordre, Entrée active les liens, Espace active le bouton et l’état expanded change.", "Tab reaches each control in order, Enter activates links, Space activates the button, and expanded state changes.", "يصل Tab إلى كل عنصر بالترتيب ويفعّل Enter الروابط وSpace الزر وتتغير حالة expanded."),
      commonErrors: [error(L("Un div cliquable est inaccessible au clavier.", "A clickable div is inaccessible by keyboard.", "لا يمكن الوصول إلى div قابلة للنقر بلوحة المفاتيح."), L("div n’a ni rôle, ni focus, ni comportement clavier natif.", "div has no native role, focus, or keyboard behavior.", "لا تملك div دورًا أو تركيزًا أو سلوك لوحة مفاتيح أصليًا."), L("Utilisez button ou a selon l’intention au lieu d’ajouter une imitation ARIA.", "Use button or a according to intent instead of adding an ARIA imitation.", "استعمل button أو a حسب النية بدل إضافة محاكاة ARIA.")), error(L("Un bouton de filtre soumet le formulaire.", "A filter button submits the form.", "يرسل زر المرشح النموذج."), L("button prend type=submit par défaut dans un formulaire.", "button defaults to type=submit inside a form.", "يأخذ button النوع submit افتراضيًا داخل النموذج."), L("Ajoutez type=button aux actions qui ne soumettent pas.", "Add type=button to actions that do not submit.", "أضف type=button للإجراءات التي لا ترسل النموذج."))],
      task: L("Créer un panneau de filtres utilisable au clavier et annonçant son état.", "Create a keyboard-usable filter panel that announces its state.", "أنشئ لوحة مرشحات تعمل بلوحة المفاتيح وتعلن حالتها."),
      solutionExplanation: L("Le bouton natif fournit l’interaction, tandis que expanded, controls et hidden maintiennent une relation compréhensible entre déclencheur et panneau.", "The native button supplies interaction while expanded, controls, and hidden maintain an understandable trigger-panel relationship.", "يوفر الزر الأصلي التفاعل، وتحافظ expanded وcontrols وhidden على علاقة مفهومة بين المشغل واللوحة."),
      quiz: { question: L("Quel élément convient pour aller vers /panier ?", "Which element suits navigation to /cart?", "أي عنصر يناسب الانتقال إلى /panier؟"), options: [L("button", "button", "button"), L("a avec href", "a with href", "a مع href"), L("div onClick", "div onClick", "div onClick"), L("span", "span", "span")], correctIndex: 1, explanation: L("Changer d’URL est une navigation et appartient à un lien possédant href.", "Changing URL is navigation and belongs to a link with href.", "تغيير URL تنقل وينتمي إلى رابط يحمل href.") },
      recap: L("les éléments natifs communiquent intention, focus, activation et état avec moins de code fragile.", "native elements communicate intent, focus, activation, and state with less fragile code.", "تنقل العناصر الأصلية النية والتركيز والتفعيل والحالة بشفرة أقل هشاشة."),
      next: L("La prochaine leçon construit des formulaires correctement nommés, validés et annoncés.", "The next lesson builds correctly named, validated, and announced forms.", "يبني الدرس التالي نماذج مسماة ومتحققًا منها ومعلنة بصورة صحيحة."),
    }),
    coreLesson({
      id: "lesson-03-03-forms", order: 2, language: "html", filename: "academy-labs/03-html/contact-form.html",
      source: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Formulaire accessible</title></head>
<body>
  <main><h1>Tester la validation native</h1>
    <form action="http://localhost:3000/nous-contacter" method="get">
      <label for="email">Adresse e-mail</label>
      <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-help">
      <p id="email-help">Format attendu : nom@exemple.com.</p>
      <button type="submit">Continuer</button>
    </form>
  </main>
</body>
</html>`,
      title: L("Formulaires, labels et validation accessible", "Forms, labels, and accessible validation", "النماذج والتسميات والتحقق المتاح"),
      mentalModel: L("Un formulaire associe des contrôles nommés à des valeurs; lors de la soumission, seuls les contrôles ayant name participent aux données. Le label donne une identité visible et accessible, tandis que les erreurs doivent être reliées au champ et expliquées.", "A form associates named controls with values; on submission, only controls with a name participate in form data. The label gives visible and accessible identity, while errors must be connected to the field and explained.", "يربط النموذج عناصر تحكم مسماة بقيم؛ وعند الإرسال لا تشارك في البيانات إلا العناصر ذات name. تمنح label هوية مرئية ومتاحة، ويجب ربط الأخطاء بالحقل وشرحها."),
      analogy: L("Chaque champ est une case de dossier : label explique quoi écrire, name est la clé transmise et validation contrôle si la pièce est exploitable.", "Each field is a case-file box: label explains what to write, name is the transmitted key, and validation checks usability.", "كل حقل خانة في ملف: تشرح label ما يُكتب، وname هو المفتاح المرسل، ويتحقق validation من صلاحية المعلومة."),
      explanation: [L("for doit correspondre exactement à id afin qu’un clic sur le label focalise le contrôle. placeholder illustre éventuellement un format mais ne remplace jamais un label persistant.", "for must exactly match id so clicking the label focuses the control. placeholder may illustrate format but never replaces a persistent label.", "يجب أن يطابق for قيمة id بدقة كي ينقل النقر على label التركيز للحقل. قد يوضح placeholder الصيغة لكنه لا يستبدل label دائمة."), L("type, required, minLength et pattern fournissent une première contrainte côté client. Le serveur doit répéter toute validation de sécurité, car une requête peut contourner le navigateur.", "type, required, minLength, and pattern provide an initial client constraint. The server must repeat every security validation because requests can bypass the browser.", "توفر type وrequired وminLength وpattern قيدًا أوليًا لدى العميل. يجب أن يكرر الخادم كل تحقق أمني لأن الطلب يستطيع تجاوز المتصفح."), L("Après échec, conservez les valeurs sûres, affichez un résumé, reliez le message via aria-describedby et placez le focus sur le premier champ invalide. Un texte explique comment corriger, pas seulement que la valeur est rouge.", "After failure, keep safe values, show a summary, connect messages through aria-describedby, and focus the first invalid field. Text explains how to fix, not merely that a value is red.", "بعد الفشل احتفظ بالقيم الآمنة واعرض ملخصًا واربط الرسالة عبر aria-describedby وانقل التركيز لأول حقل غير صالح. يشرح النص طريقة الإصلاح لا مجرد تلوين القيمة بالأحمر."),
      ],
      vocabulary: [v("label", "Nom visible associé programmatiquement à un contrôle.", "Visible name programmatically associated with a control.", "اسم مرئي مرتبط برمجيًا بعنصر تحكم."), v("name", "Clé utilisée lors de la sérialisation du formulaire.", "Key used when form data is serialized.", "المفتاح المستخدم عند تسلسل بيانات النموذج."), v("constraint validation", "Règles natives évaluées avant soumission normale.", "Native rules evaluated before normal submission.", "قواعد أصلية تُقيّم قبل الإرسال العادي.")],
      generalApplication: L("Concevez d’abord noms, formats, contraintes et messages; testez ensuite saisie vide, invalide, correcte, copier-coller et remplissage automatique.", "Design names, formats, constraints, and messages first; then test empty, invalid, correct, pasted, and autofilled input.", "صمم الأسماء والصيغ والقيود والرسائل أولًا؛ ثم اختبر الإدخال الفارغ وغير الصالح والصحيح والملصق والملء التلقائي."),
      lecomaxApplication: L("Connexion, adresse de livraison, newsletter et contact exigent labels persistants, autocomplete approprié et validation serveur avant écriture.", "Login, shipping address, newsletter, and contact require persistent labels, suitable autocomplete, and server validation before writing.", "تحتاج تسجيل الدخول وعنوان الشحن والنشرة والاتصال تسميات دائمة وautocomplete مناسبًا وتحقق الخادم قبل الكتابة."),
      commands: ["npm run dev", "Start-Process .\\academy-labs\\03-html\\contact-form.html", "curl.exe -I http://localhost:3000/nous-contacter"],
      expectedResult: L("un clic sur le label focalise l’e-mail, le navigateur bloque vide et format invalide, puis une adresse valide ouvre /nous-contacter.", "clicking the label focuses email, the browser blocks empty and malformed input, and a valid address opens /nous-contacter.", "ينقل النقر على label التركيز إلى البريد ويمنع المتصفح القيمة الفارغة والصيغة الخاطئة ثم يفتح /nous-contacter مع عنوان صالح."),
      commonErrors: [error(L("Le serveur reçoit une valeur email absente.", "The server receives no email value.", "لا يستقبل الخادم قيمة email."), L("L’input possède id mais pas name.", "The input has an id but no name.", "يملك input قيمة id بلا name."), L("Ajoutez name=email et inspectez FormData ou la requête Network.", "Add name=email and inspect FormData or the Network request.", "أضف name=email وافحص FormData أو طلب Network.")), error(L("Une erreur n’est perçue que par sa couleur rouge.", "An error is conveyed only by red color.", "يُفهم الخطأ من اللون الأحمر فقط."), L("Aucun message textuel n’est relié au contrôle.", "No textual message is connected to the control.", "لا توجد رسالة نصية مرتبطة بعنصر التحكم."), L("Ajoutez un message explicite, aria-describedby et aria-invalid lorsque l’erreur existe.", "Add explicit text, aria-describedby, and aria-invalid while the error exists.", "أضف نصًا صريحًا وaria-describedby وaria-invalid عند وجود الخطأ."))],
      task: L("Créer un formulaire e-mail qui fonctionne à la souris, au clavier et avec validation native.", "Create an email form that works with mouse, keyboard, and native validation.", "أنشئ نموذج بريد يعمل بالفأرة ولوحة المفاتيح والتحقق الأصلي."),
      solutionExplanation: L("La solution relie identité, clé de données, format et aide; chaque couche a un rôle distinct et vérifiable.", "The solution connects identity, data key, format, and help; each layer has a distinct verifiable role.", "يربط الحل الهوية ومفتاح البيانات والصيغة والمساعدة؛ ولكل طبقة دور مميز قابل للتحقق."),
      quiz: { question: L("Quel attribut détermine la clé envoyée ?", "Which attribute determines the submitted key?", "أي سمة تحدد المفتاح المرسل؟"), options: [L("class", "class", "class"), L("name", "name", "name"), L("placeholder", "placeholder", "placeholder"), L("style", "style", "style")], correctIndex: 1, explanation: L("La sérialisation du formulaire utilise name, alors que id sert notamment aux relations de label.", "Form serialization uses name, while id serves relationships such as labels.", "يستعمل تسلسل النموذج name، بينما تخدم id علاقات مثل labels.") },
      recap: L("un contrôle accessible possède un nom, une clé de données, des contraintes et une erreur textuelle reliée.", "an accessible control has a name, a data key, constraints, and connected textual errors.", "يملك عنصر التحكم المتاح اسمًا ومفتاح بيانات وقيودًا وخطأ نصيًا مرتبطًا."),
      next: L("La prochaine leçon rend images, tableaux et métadonnées compréhensibles et performants.", "The next lesson makes images, tables, and metadata understandable and efficient.", "يجعل الدرس التالي الصور والجداول والبيانات الوصفية مفهومة وفعالة."),
    }),
    coreLesson({
      id: "lesson-03-04-media-tables", order: 3, language: "tsx", filename: "academy-labs/03-html/product-media.tsx",
      source: `export default function ProductMedia() {
  return <section aria-labelledby="product-media-title">
    <h2 id="product-media-title">Médias et mesures</h2>
    <figure>
      <img src="/images/products/casque.webp" alt="Casque noir pliable, vue de face" width={640} height={640} />
      <figcaption>Casque Bluetooth — coloris noir</figcaption>
    </figure>
    <table><caption>Guide des tailles</caption>
      <thead><tr><th scope="col">Taille</th><th scope="col">Poitrine</th></tr></thead>
      <tbody><tr><th scope="row">M</th><td>96–101 cm</td></tr></tbody>
    </table>
  </section>;
}`,
      title: L("Images, tableaux et métadonnées utiles", "Useful images, tables, and metadata", "الصور والجداول والبيانات الوصفية المفيدة"),
      mentalModel: L("Une image transmet soit une information qui exige un équivalent textuel, soit une décoration qui doit rester silencieuse. Un tableau exprime des relations bidimensionnelles entre en-têtes et cellules, pas une grille visuelle arbitraire.", "An image either conveys information requiring a text equivalent or is decoration that should remain silent. A table expresses two-dimensional relationships between headers and cells, not arbitrary visual layout.", "إما أن تنقل الصورة معلومة تحتاج بديلًا نصيًا، أو تكون زخرفية فيجب أن تبقى صامتة. ويعبّر الجدول عن علاقات ثنائية الأبعاد بين الرؤوس والخلايا، لا عن تخطيط بصري عشوائي."),
      analogy: L("alt est ce que vous diriez au téléphone pour remplacer l’image; les en-têtes d’un tableau sont les coordonnées permettant d’interpréter chaque valeur.", "alt is what you would say over the phone to replace the image; table headers are coordinates for interpreting every value.", "alt هو ما ستقوله عبر الهاتف بدل الصورة؛ ورؤوس الجدول إحداثيات تفسر كل قيمة."),
      explanation: [L("Un alt informatif décrit le contenu utile dans son contexte sans répéter « image de ». Une image déjà expliquée par le texte voisin ou purement décorative reçoit alt vide.", "Informative alt describes useful content in context without repeating “image of.” An image already explained nearby or purely decorative receives empty alt.", "يصف alt المعلوماتي المحتوى المفيد في سياقه من دون تكرار «صورة لـ». وتأخذ الصورة المشروحة بجوارها أو الزخرفية alt فارغًا."), L("width et height réservent le ratio avant téléchargement et évitent le déplacement de mise en page. Dans Next.js, Image ajoute optimisation et tailles adaptées, mais alt reste une décision éditoriale.", "width and height reserve aspect ratio before download and prevent layout shift. In Next.js, Image adds optimization and responsive sizes, but alt remains an editorial decision.", "تحجز width وheight نسبة الأبعاد قبل التنزيل وتمنع تحرك التخطيط. يضيف Image في Next.js التحسين والأحجام المتجاوبة، لكن alt يظل قرارًا تحريريًا."), L("caption nomme le tableau; th avec scope associe colonnes ou lignes. Pour une liste de cartes produits, utilisez une liste CSS, pas table, car les données ne dépendent pas d’intersections.", "caption names the table; th with scope associates columns or rows. For product cards, use a CSS list rather than table because data does not depend on intersections.", "تسمي caption الجدول؛ وتربط th مع scope الأعمدة أو الصفوف. استعمل قائمة CSS لبطاقات المنتجات لا table لأن البيانات لا تعتمد على التقاطعات."),
      ],
      vocabulary: [v("alternative text", "Équivalent textuel de la fonction ou information d’une image.", "Text equivalent of an image’s function or information.", "بديل نصي لوظيفة الصورة أو معلوماتها."), v("layout shift", "Déplacement inattendu du contenu après chargement.", "Unexpected movement of content during loading.", "تحرك غير متوقع للمحتوى أثناء التحميل."), v("scope", "Relation indiquant les cellules gouvernées par un en-tête.", "Relationship indicating cells governed by a header.", "علاقة تحدد الخلايا التي يحكمها رأس.")],
      generalApplication: L("Décidez pour chaque média quelle information disparaîtrait sans lui, puis encodez cet équivalent et ses dimensions; réservez table aux vraies matrices.", "For each medium, decide what information disappears without it, encode that equivalent and dimensions, and reserve table for true matrices.", "حدد لكل وسيط ما المعلومة التي ستختفي بدونه، ثم شفّر بديلها وأبعادها، واقصر table على المصفوفات الحقيقية."),
      lecomaxApplication: L("Les photos produit décrivent angle et variante sélectionnée; les guides de taille utilisent caption, en-têtes de colonnes et unités explicites.", "Product photos describe angle and selected variant; size guides use captions, column headers, and explicit units.", "تصف صور المنتج الزاوية والمتغير المحدد؛ وتستعمل أدلة المقاس caption ورؤوس الأعمدة ووحدات صريحة."),
      commands: ["npm run dev", "npm run build"],
      expectedResult: L("la page réserve l’espace image, le lecteur d’écran annonce un texte pertinent et les cellules du guide possèdent leurs en-têtes.", "the page reserves image space, the screen reader announces relevant text, and guide cells have their headers.", "تحجز الصفحة مساحة الصورة وينطق قارئ الشاشة نصًا مناسبًا وتملك خلايا الدليل رؤوسها."),
      commonErrors: [error(L("Chaque image est annoncée comme « image image produit ».", "Every image is announced as “image product image.”", "تُنطق كل صورة كـ«صورة صورة منتج»."), L("alt répète le type et un texte générique sans fonction contextuelle.", "alt repeats the type and generic text without contextual function.", "يكرر alt النوع ونصًا عامًا بلا وظيفة سياقية."), L("Décrivez uniquement l’information distinctive utile, ou utilisez alt vide si elle est redondante.", "Describe only useful distinctive information, or use empty alt when redundant.", "صف المعلومة المميزة المفيدة فقط أو استعمل alt فارغًا إن كانت مكررة.")), error(L("Le contenu saute quand les photos apparaissent.", "Content jumps when photos appear.", "يقفز المحتوى عند ظهور الصور."), L("Aucun ratio n’est réservé avant le chargement.", "No aspect ratio is reserved before loading.", "لم تُحجز نسبة أبعاد قبل التحميل."), L("Fournissez width/height ou un conteneur à aspect-ratio stable.", "Provide width/height or a stable aspect-ratio container.", "وفر width/height أو حاوية بنسبة أبعاد ثابتة."))],
      task: L("Créer une fiche image produit et un mini-guide de tailles sémantique.", "Create a product image figure and a semantic mini size guide.", "أنشئ شكل صورة منتج ودليل مقاسات صغيرًا دلاليًا."),
      solutionExplanation: L("La figure regroupe média et légende; le tableau relie explicitement chaque mesure à sa taille et son unité.", "The figure groups media and caption; the table explicitly relates each measurement to its size and unit.", "يجمع figure الوسيط والتعليق؛ ويربط الجدول كل قياس صراحة بمقاسه ووحدته."),
      quiz: { question: L("Quel alt convient à une icône décorative voisine d’un texte identique ?", "Which alt suits a decorative icon beside identical text?", "أي alt يناسب أيقونة زخرفية بجانب نص مطابق؟"), options: [L("alt vide", "empty alt", "alt فارغ"), L("« icône »", "“icon”", "«أيقونة»"), L("Supprimer img sans regarder", "Delete img blindly", "حذف img بلا فحص"), L("Le nom du fichier", "The filename", "اسم الملف")], correctIndex: 0, explanation: L("Un alt vide retire la décoration de l’arbre accessible et évite une répétition.", "Empty alt removes decoration from the accessibility tree and avoids repetition.", "يزيل alt الفارغ الزخرفة من شجرة الإتاحة ويتجنب التكرار.") },
      recap: L("média informatif exige un équivalent contextuel; dimensions stabilisent la page et tableaux encodent des relations.", "informative media needs a contextual equivalent; dimensions stabilize pages and tables encode relationships.", "يحتاج الوسيط المعلوماتي بديلًا سياقيًا؛ وتثبت الأبعاد الصفحة وترمز الجداول العلاقات."),
      next: L("Le module suivant présente ce HTML avec la cascade, le modèle de boîte, Flexbox, Grid et les couleurs L’ecomax.", "The next module presents this HTML with cascade, box model, Flexbox, Grid, and L’ecomax colors.", "تعرض الوحدة التالية هذا HTML عبر cascade ونموذج الصندوق وFlexbox وGrid وألوان L’ecomax."),
    }),
  ],
});

modulesBlueprint.push({
  id: "module-04-css",
  order: 4,
  icon: "🎨",
  color: "#7C3AED",
  files: [
    { path: "app/globals.css", mode: "existing" },
    { path: "academy-labs/04-css/product-card.css", mode: "create" },
  ],
  title: L("CSS : cascade, boîtes, layouts et design tokens", "CSS: cascade, boxes, layouts, and design tokens", "CSS: التتابع والصناديق والتخطيطات ورموز التصميم"),
  summary: L("Comprendre comment le navigateur choisit une déclaration, calcule une boîte, distribue l’espace et applique couleurs, typographie et états cohérents.", "Understand how the browser chooses declarations, computes boxes, distributes space, and applies coherent color, typography, and states.", "فهم كيف يختار المتصفح التصريح ويحسب الصندوق ويوزع المساحة ويطبق الألوان والطباعة والحالات المتسقة."),
  lessons: [
    coreLesson({
      id: "lesson-04-01-cascade", order: 0, language: "css", filename: "academy-labs/04-css/cascade.css",
      source: `:root { --brand-green: #16a34a; }

.product-card { color: #111827; }
.product-card .price { color: var(--brand-green); }
.product-card[data-sale="true"] .price { color: #dc2626; }

@media (prefers-contrast: more) {
  .product-card { border: 2px solid currentColor; }
}`,
      title: L("Sélecteurs, cascade, héritage et spécificité", "Selectors, cascade, inheritance, and specificity", "المحددات والتتابع والوراثة والخصوصية"),
      mentalModel: L("Pour chaque propriété et élément, le navigateur collecte les déclarations correspondantes, compare origine, importance, couche, spécificité et ordre, puis calcule une valeur; certaines propriétés héritent ensuite du parent.", "For each property and element, the browser gathers matching declarations, compares origin, importance, layer, specificity, and order, then computes a value; some properties subsequently inherit from the parent.", "يجمع المتصفح لكل خاصية وعنصر التصريحات المطابقة ويقارن المصدر والأهمية والطبقة والخصوصية والترتيب ثم يحسب قيمة؛ وترث بعض الخصائص بعد ذلك من الأب."),
      analogy: L("Plusieurs règles administratives visent la même situation; une priorité explicite et stable décide laquelle s’applique.", "Several administrative rules target one situation; an explicit stable priority decides which applies.", "تستهدف عدة قواعد إدارية الحالة نفسها؛ وتقرر أولوية صريحة وثابتة أيها يطبق."),
      explanation: [L("Un sélecteur décrit les éléments ciblés; gardez-le court et lié au composant. Une longue chaîne structurelle casse lorsque le HTML change et augmente inutilement la spécificité.", "A selector describes target elements; keep it short and component-oriented. A long structural chain breaks when HTML changes and unnecessarily raises specificity.", "يصف المحدد العناصر المستهدفة؛ اجعله قصيرًا ومرتبطًا بالمكون. تنكسر السلسلة الهيكلية الطويلة عند تغير HTML وترفع الخصوصية بلا حاجة."), L("La spécificité compare principalement identifiants, classes/attributs et types; l’ordre ne départage que des priorités égales. !important masque souvent une architecture confuse et rend les états difficiles à surcharger.", "Specificity mainly compares IDs, classes/attributes, and types; source order breaks only equal priority. !important often masks confused architecture and makes states hard to override.", "تقارن الخصوصية أساسًا المعرفات والأصناف/السمات والأنواع؛ ولا يفصل الترتيب إلا عند تساوي الأولوية. يخفي !important غالبًا بنية مرتبكة ويصعب تجاوز الحالات."), L("color et font héritent souvent, alors que margin et border non. DevTools Styles montre les règles rayées et Computed révèle la valeur finale ainsi que sa source.", "color and font often inherit, while margin and border do not. DevTools Styles shows crossed-out rules and Computed reveals the final value and source.", "ترث color وfont غالبًا، بينما لا ترث margin وborder. تعرض Styles القواعد المشطوبة وتكشف Computed القيمة النهائية ومصدرها."),
      ],
      vocabulary: [v("cascade", "Algorithme qui choisit la déclaration gagnante.", "Algorithm choosing the winning declaration.", "خوارزمية تختار التصريح الفائز."), v("specificity", "Poids du sélecteur utilisé dans la cascade.", "Selector weight used in the cascade.", "وزن المحدد المستخدم في التتابع."), v("inheritance", "Transmission de certaines valeurs calculées du parent à l’enfant.", "Passing selected computed values from parent to child.", "انتقال بعض القيم المحسوبة من الأب إلى الابن."),
      ],
      generalApplication: L("Inspectez la valeur calculée avant d’ajouter une nouvelle règle; corrigez la source gagnante plutôt que d’empiler une priorité supérieure.", "Inspect the computed value before adding a rule; fix the winning source instead of stacking higher priority.", "افحص القيمة المحسوبة قبل إضافة قاعدة؛ وأصلح المصدر الفائز بدل تكديس أولوية أعلى."),
      lecomaxApplication: L("Les prix normaux utilisent le vert #16A34A et les promotions le rouge #DC2626 via un état data-sale explicite plutôt que des sélecteurs de position.", "Regular prices use green #16A34A and sales use red #DC2626 through explicit data-sale state rather than positional selectors.", "تستعمل الأسعار العادية الأخضر #16A34A والتخفيضات الأحمر #DC2626 عبر حالة data-sale صريحة لا محددات الموضع."),
      commands: ["npm run dev", "npx eslint app components"],
      expectedResult: L("Computed affiche #16A34A normalement, #DC2626 en promotion et une bordure accrue si le système demande plus de contraste.", "Computed shows #16A34A normally, #DC2626 on sale, and a stronger border when the system requests more contrast.", "تعرض Computed اللون #16A34A عادة و#DC2626 في التخفيض وحدًا أقوى عند طلب النظام تباينًا أكبر."),
      commonErrors: [error(L("Une règle écrite plus bas ne change pas la couleur.", "A later rule does not change color.", "لا تغير قاعدة مكتوبة لاحقًا اللون."), L("Une règle antérieure possède une spécificité ou importance supérieure.", "An earlier rule has higher specificity or importance.", "تملك قاعدة سابقة خصوصية أو أهمية أعلى."), L("Lisez Styles/Computed, simplifiez les sélecteurs et retirez l’escalade !important.", "Read Styles/Computed, simplify selectors, and remove the !important escalation.", "اقرأ Styles/Computed وبسط المحددات وأزل تصعيد !important.")), error(L("Tous les enfants prennent une couleur inattendue.", "All children receive an unexpected color.", "تأخذ كل العناصر الابنة لونًا غير متوقع."), L("color est héritée depuis un ancêtre.", "color is inherited from an ancestor.", "تُورث color من عنصر سلف."), L("Identifiez la source dans Computed et définissez la couleur au niveau sémantique approprié.", "Identify the source in Computed and set color at the appropriate semantic level.", "حدد المصدر في Computed واضبط اللون على المستوى الدلالي المناسب."))],
      task: L("Créer les états normal et promotion d’un prix sans !important.", "Create normal and sale price states without !important.", "أنشئ حالتي السعر العادي والتخفيض من دون !important."),
      solutionExplanation: L("L’attribut d’état rend l’intention visible dans le DOM et le sélecteur plus spécifique uniquement lorsque cet état existe.", "The state attribute makes intent visible in the DOM and the selector more specific only when that state exists.", "تجعل سمة الحالة النية ظاهرة في DOM وتجعل المحدد أكثر خصوصية فقط عند وجود الحالة."),
      quiz: { question: L("Où voir la valeur CSS finale ?", "Where can you see the final CSS value?", "أين ترى قيمة CSS النهائية؟"), options: [L("DevTools Computed", "DevTools Computed", "DevTools Computed"), L("package-lock", "package-lock", "package-lock"), L("GitHub Issues", "GitHub Issues", "GitHub Issues"), L("DNS", "DNS", "DNS")], correctIndex: 0, explanation: L("Computed montre la valeur calculée et permet de remonter à sa déclaration.", "Computed shows the calculated value and lets you trace its declaration.", "تعرض Computed القيمة المحسوبة وتتيح تتبع تصريحها."),
      },
      recap: L("la cascade choisit une valeur par propriété; DevTools révèle pourquoi une règle gagne.", "the cascade selects a value per property; DevTools reveals why a rule wins.", "يختار التتابع قيمة لكل خاصية؛ وتكشف DevTools سبب فوز قاعدة."),
      next: L("La prochaine leçon calcule précisément largeur, hauteur, espacements et débordements.", "The next lesson precisely computes width, height, spacing, and overflow.", "يحسب الدرس التالي العرض والارتفاع والمسافات والتجاوز بدقة."),
    }),
    coreLesson({
      id: "lesson-04-02-box-model", order: 1, language: "css", filename: "academy-labs/04-css/box.css",
      source: `*, *::before, *::after { box-sizing: border-box; }

.product-card {
  inline-size: min(100%, 22rem);
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow-wrap: anywhere;
}`,
      title: L("Modèle de boîte, unités et débordement", "Box model, units, and overflow", "نموذج الصندوق والوحدات والتجاوز"),
      mentalModel: L("Chaque élément génère une boîte composée de contenu, padding, border et margin. box-sizing détermine si width englobe padding et border; le contenu et son contexte imposent ensuite minimums, maximums et débordement.", "Every element generates a box made of content, padding, border, and margin. box-sizing determines whether width includes padding and border; content and context then impose minima, maxima, and overflow.", "يولد كل عنصر صندوقًا من المحتوى وpadding وborder وmargin. تحدد box-sizing هل تشمل width الحشو والحد؛ ثم يفرض المحتوى والسياق الحدود الدنيا والعليا والتجاوز."),
      analogy: L("Un colis possède l’objet, le rembourrage, le carton et l’espace laissé autour; annoncer sa taille peut inclure ou exclure l’emballage.", "A parcel has an item, padding, box, and surrounding clearance; stated size may include or exclude packaging.", "للطرد غرض وحشو وصندوق ومساحة حوله؛ وقد يشمل الحجم المعلن التغليف أو يستبعده."),
      explanation: [L("Avec content-box, width ne couvre que le contenu; padding et border s’ajoutent. border-box rend les dimensions externes plus prévisibles pour les composants.", "With content-box, width covers content only; padding and border add to it. border-box makes external component dimensions more predictable.", "مع content-box تغطي width المحتوى فقط وتضاف padding وborder. تجعل border-box أبعاد المكون الخارجية أسهل توقعًا."), L("rem suit la taille racine, em le contexte typographique, % le contenant et viewport units la fenêtre. Utilisez des tailles fluides avec min(), max() ou clamp() plutôt que supposer un écran fixe.", "rem follows root size, em typography context, % the container, and viewport units the window. Use fluid sizes through min(), max(), or clamp() rather than assuming a fixed screen.", "تتبع rem حجم الجذر وem سياق الخط و% الحاوية ووحدات viewport النافذة. استعمل أحجامًا مرنة عبر min() وmax() وclamp() بدل افتراض شاشة ثابتة."), L("Un texte long, une image sans max-width ou un enfant flex avec min-width auto peut provoquer un scroll horizontal. Trouvez l’élément responsable au lieu de masquer globalement overflow-x.", "Long text, an image without max-width, or a flex child with auto min-width can cause horizontal scrolling. Find the responsible element instead of globally hiding overflow-x.", "قد يسبب نص طويل أو صورة بلا max-width أو ابن flex ذي min-width تلقائية تمريرًا أفقيًا. اعثر على العنصر المسؤول بدل إخفاء overflow-x عالميًا."),
      ],
      vocabulary: [v("content box", "Zone où le contenu est disposé.", "Area where content is laid out.", "المنطقة التي يرتب فيها المحتوى."), v("border-box", "Calcul incluant padding et bordure dans la taille déclarée.", "Sizing calculation including padding and border.", "حساب حجم يشمل الحشو والحد."), v("overflow", "Partie du contenu dépassant la boîte disponible.", "Content extending beyond the available box.", "جزء المحتوى المتجاوز للصندوق المتاح."),
      ],
      generalApplication: L("Fixez border-box globalement, préférez max-inline-size aux largeurs rigides et testez contenu très long, zoom 200% et largeur 320px.", "Set border-box globally, prefer max-inline-size over rigid widths, and test very long content, 200% zoom, and 320px width.", "اضبط border-box عالميًا وفضّل max-inline-size على العرض الصلب واختبر محتوى طويلًا وتكبير 200% وعرض 320px."),
      lecomaxApplication: L("Les cartes L’ecomax restent à 100% de leur colonne jusqu’à 22rem, et noms ou codes produit longs reviennent à la ligne sans élargir la page.", "L’ecomax cards remain 100% of their column up to 22rem, and long names or product codes wrap without widening the page.", "تبقى بطاقات L’ecomax بعرض عمودها حتى 22rem، وتلتف أسماء المنتجات أو رموزها الطويلة من دون توسيع الصفحة."),
      commands: ["npm run dev", "npm run build"],
      expectedResult: L("la carte inclut padding et bordure dans sa limite, rétrécit sans scroll horizontal et reste lisible au zoom.", "the card includes padding and border in its limit, shrinks without horizontal scrolling, and remains readable when zoomed.", "تشمل البطاقة الحشو والحد ضمن سقفها وتنكمش بلا تمرير أفقي وتظل مقروءة عند التكبير."),
      commonErrors: [error(L("Une boîte de width 100% dépasse son parent.", "A width:100% box exceeds its parent.", "يتجاوز صندوق width:100% أباه."), L("content-box ajoute padding et border au 100%.", "content-box adds padding and border beyond 100%.", "تضيف content-box الحشو والحد فوق 100%."), L("Appliquez border-box et inspectez les dimensions dans le diagramme Box Model.", "Apply border-box and inspect dimensions in the Box Model diagram.", "طبق border-box وافحص الأبعاد في مخطط Box Model.")), error(L("La page défile horizontalement sur mobile.", "The page scrolls horizontally on mobile.", "تتحرك الصفحة أفقيًا على الهاتف."), L("Un descendant impose une largeur minimale supérieure au viewport.", "A descendant imposes a minimum width larger than the viewport.", "يفرض عنصر ابن عرضًا أدنى أكبر من viewport."), L("Identifiez-le avec l’inspecteur, puis corrigez min-width, wrapping ou dimension média.", "Find it with the inspector, then fix min-width, wrapping, or media sizing.", "حدده عبر الفاحص ثم أصلح min-width أو الالتفاف أو حجم الوسيط."))],
      task: L("Construire une carte qui accepte un titre très long à 320px sans débordement.", "Build a card accepting a very long title at 320px without overflow.", "ابنِ بطاقة تقبل عنوانًا طويلًا جدًا عند 320px بلا تجاوز."),
      solutionExplanation: L("border-box stabilise la taille externe, min() adapte la largeur au parent et overflow-wrap gère les jetons sans espace.", "border-box stabilizes outer size, min() adapts width to the parent, and overflow-wrap handles unbroken tokens.", "تثبت border-box الحجم الخارجي وتكيف min() العرض مع الأب وتعالج overflow-wrap الكلمات بلا مسافات."),
      quiz: { question: L("Avec border-box, que comprend width ?", "With border-box, what does width include?", "ماذا تشمل width مع border-box؟"), options: [L("Contenu seulement", "Content only", "المحتوى فقط"), L("Contenu, padding et bordure", "Content, padding, and border", "المحتوى والحشو والحد"), L("Margin uniquement", "Margin only", "margin فقط"), L("La hauteur du viewport", "Viewport height", "ارتفاع viewport")], correctIndex: 1, explanation: L("La marge reste externe; contenu, padding et border sont contenus dans la largeur déclarée.", "Margin remains external; content, padding, and border fit inside declared width.", "تبقى margin خارجية؛ ويدخل المحتوى والحشو والحد في العرض المعلن."),
      },
      recap: L("la taille visible résulte de plusieurs couches; unités fluides et contraintes de contenu empêchent les débordements.", "visible size comes from several layers; fluid units and content constraints prevent overflow.", "ينتج الحجم المرئي من طبقات عدة؛ وتمنع الوحدات المرنة وقيود المحتوى التجاوز."),
      next: L("La prochaine leçon distribue cet espace avec Flexbox et Grid.", "The next lesson distributes that space with Flexbox and Grid.", "يوزع الدرس التالي هذه المساحة عبر Flexbox وGrid."),
    }),
    coreLesson({
      id: "lesson-04-03-flex-grid", order: 2, language: "css", filename: "academy-labs/04-css/layout.css",
      source: `.toolbar { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
.toolbar__search { flex: 1 1 16rem; min-inline-size: 0; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: clamp(.75rem, 2vw, 1.5rem);
}`,
      title: L("Distribuer l’espace avec Flexbox et Grid", "Distribute space with Flexbox and Grid", "وزّع المساحة عبر Flexbox وGrid"),
      mentalModel: L("Flexbox distribue l’espace le long d’un axe principal et aligne sur l’axe transversal; Grid définit simultanément lignes et colonnes. Le contenu fournit des tailles intrinsèques que flex et grid négocient avec l’espace disponible.", "Flexbox distributes space along one main axis and aligns on the cross axis; Grid defines rows and columns together. Content supplies intrinsic sizes that flex and grid negotiate with available space.", "يوزع Flexbox المساحة على محور رئيسي ويحاذي على المحور العرضي؛ ويحدد Grid الصفوف والأعمدة معًا. يوفر المحتوى أحجامًا ذاتية تتفاوض معها الأنظمة حسب المساحة."),
      analogy: L("Flexbox range des objets sur une étagère; Grid organise des emplacements sur un casier bidimensionnel.", "Flexbox arranges items on a shelf; Grid organizes slots in a two-dimensional cabinet.", "يرتب Flexbox الأشياء على رف؛ وينظم Grid خانات في خزانة ثنائية الأبعاد."),
      explanation: [L("justify-content agit sur l’axe principal et align-items sur le transversal, dont la direction dépend de flex-direction. gap crée un espacement régulier sans marges conditionnelles.", "justify-content acts on the main axis and align-items on the cross axis, whose direction depends on flex-direction. gap creates regular spacing without conditional margins.", "تعمل justify-content على المحور الرئيسي وalign-items على العرضي الذي يعتمد اتجاهه على flex-direction. تنشئ gap مسافة منتظمة بلا هوامش شرطية."), L("flex-basis propose une taille initiale, grow partage le surplus et shrink absorbe le manque. min-inline-size:0 autorise un enfant à devenir plus petit que son contenu intrinsèque.", "flex-basis proposes an initial size, grow shares surplus, and shrink absorbs shortage. min-inline-size:0 lets a child become smaller than intrinsic content.", "تقترح flex-basis حجمًا أوليًا، ويوزع grow الفائض، ويمتص shrink النقص. تسمح min-inline-size:0 للابن بأن يصغر عن محتواه الذاتي."), L("Grid minmax fixe une borne utile et 1fr partage l’espace restant; auto-fit replie les pistes vides. Ce modèle crée une grille responsive guidée par le composant plutôt que par une liste de téléphones.", "Grid minmax sets a useful bound and 1fr shares remaining space; auto-fit collapses empty tracks. This makes a component-driven responsive grid rather than a list of phones.", "تضع minmax في Grid حدًا مفيدًا وتوزع 1fr المساحة المتبقية؛ وتطوي auto-fit المسارات الفارغة. ينشئ ذلك شبكة متجاوبة يقودها المكون لا قائمة الهواتف.")],
      vocabulary: [v("main axis", "Axe défini par flex-direction.", "Axis defined by flex-direction.", "المحور الذي تحدده flex-direction."), v("grid track", "Espace entre deux lignes de grille adjacentes.", "Space between adjacent grid lines.", "المساحة بين خطي شبكة متجاورين."), v("intrinsic size", "Taille préférée dérivée du contenu lui-même.", "Preferred size derived from content itself.", "الحجم المفضل المشتق من المحتوى نفسه."),
      ],
      generalApplication: L("Choisissez flex pour une rangée/colonne et grid pour une matrice; laissez le contenu et minmax décider avant d’ajouter des media queries.", "Choose flex for a row/column and grid for a matrix; let content and minmax decide before adding media queries.", "اختر flex لصف/عمود وgrid لمصفوفة؛ ودع المحتوى وminmax يقرران قبل إضافة media queries."),
      lecomaxApplication: L("La barre de recherche utilise flex-wrap; la grille produits remplit automatiquement la largeur avec des cartes jamais plus étroites que 15rem.", "The search toolbar uses flex-wrap; the product grid automatically fills width with cards never narrower than 15rem.", "يستعمل شريط البحث flex-wrap؛ وتملأ شبكة المنتجات العرض تلقائيًا ببطاقات لا تقل عن 15rem."),
      commands: ["npm run dev", "npm run build"],
      expectedResult: L("la barre revient proprement à la ligne et la grille passe naturellement de quatre à une colonne sans débordement.", "the toolbar wraps cleanly and the grid naturally moves from four columns to one without overflow.", "يلتف الشريط بنظافة وتنتقل الشبكة طبيعيًا من أربعة أعمدة إلى عمود بلا تجاوز."),
      commonErrors: [error(L("justify-content semble agir dans la mauvaise direction.", "justify-content seems to act in the wrong direction.", "تبدو justify-content وكأنها تعمل في الاتجاه الخطأ."), L("flex-direction a changé l’axe principal.", "flex-direction changed the main axis.", "غيّرت flex-direction المحور الرئيسي."), L("Affichez les overlays Flex DevTools et raisonnez en axes, pas en gauche/haut.", "Use Flex DevTools overlays and reason in axes rather than left/top.", "استعمل طبقات Flex في DevTools وفكر بالمحاور لا باليسار/الأعلى.")), error(L("Une piste Grid déborde malgré 1fr.", "A Grid track overflows despite 1fr.", "يتجاوز مسار Grid رغم 1fr."), L("Le minimum intrinsèque d’un enfant dépasse la piste.", "A child’s intrinsic minimum exceeds the track.", "يتجاوز الحد الذاتي الأدنى لابن المسار."), L("Utilisez minmax(0,1fr), min-inline-size:0 ou un wrapping adapté au contenu.", "Use minmax(0,1fr), min-inline-size:0, or suitable content wrapping.", "استعمل minmax(0,1fr) أو min-inline-size:0 أو التفافًا مناسبًا."))],
      task: L("Créer une barre flexible et une grille auto-adaptative sans breakpoint.", "Create a flexible toolbar and auto-adapting grid without a breakpoint.", "أنشئ شريطًا مرنًا وشبكة تتكيف تلقائيًا بلا breakpoint."),
      solutionExplanation: L("flex-wrap protège la barre, tandis que auto-fit et minmax laissent le navigateur calculer le nombre de colonnes possible.", "flex-wrap protects the toolbar while auto-fit and minmax let the browser calculate possible columns.", "تحمي flex-wrap الشريط وتدع auto-fit وminmax المتصفح يحسب عدد الأعمدة الممكن."),
      quiz: { question: L("Quel outil convient à une grille de cartes en lignes et colonnes ?", "Which tool suits a card matrix in rows and columns?", "أي أداة تناسب مصفوفة بطاقات من صفوف وأعمدة؟"), options: [L("Grid", "Grid", "Grid"), L("float uniquement", "float only", "float فقط"), L("position absolute", "absolute positioning", "position absolute"), L("table HTML", "HTML table", "جدول HTML")], correctIndex: 0, explanation: L("Grid contrôle explicitement les deux dimensions sans détourner la sémantique HTML.", "Grid explicitly controls both dimensions without misusing HTML semantics.", "يتحكم Grid صراحة في البعدين من دون إساءة استعمال دلالة HTML."),
      },
      recap: L("Flexbox négocie un axe; Grid organise deux axes et minmax produit une adaptation guidée par le contenu.", "Flexbox negotiates one axis; Grid organizes two and minmax creates content-driven adaptation.", "يتفاوض Flexbox على محور؛ وينظم Grid محورين وتنتج minmax تكيفًا يقوده المحتوى."),
      next: L("La prochaine leçon transforme couleurs, espacements et typographie en système réutilisable.", "The next lesson turns colors, spacing, and typography into a reusable system.", "يحوّل الدرس التالي الألوان والمسافات والطباعة إلى نظام قابل لإعادة الاستعمال."),
    }),
    coreLesson({
      id: "lesson-04-04-tokens-states", order: 3, language: "css", filename: "academy-labs/04-css/tokens.css",
      source: `:root {
  --color-brand: #16a34a;
  --color-brand-strong: #15803d;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-surface: #ffffff;
  --color-danger: #dc2626;
  --space-2: .5rem; --space-4: 1rem; --radius-card: .75rem;
}
.buy-button { background: var(--color-brand); color: #fff; }
.buy-button:hover { background: var(--color-brand-strong); }
.buy-button:focus-visible { outline: 3px solid #f59e0b; outline-offset: 3px; }
.buy-button:disabled { opacity: .55; cursor: not-allowed; }`,
      title: L("Couleurs, typographie, tokens et états", "Colors, typography, tokens, and states", "الألوان والطباعة والرموز والحالات"),
      mentalModel: L("Un design system nomme des décisions visuelles selon leur rôle plutôt que leur valeur brute. Les composants consomment ces tokens et définissent tous leurs états d’interaction, ce qui maintient cohérence, contraste et évolutivité.", "A design system names visual decisions by role rather than raw value. Components consume those tokens and define every interaction state, preserving coherence, contrast, and evolvability.", "يسمي نظام التصميم القرارات البصرية حسب دورها لا قيمتها الخام. تستهلك المكونات هذه الرموز وتحدد كل حالات التفاعل، فتحافظ على الاتساق والتباين وقابلية التطور."),
      analogy: L("Les tokens sont une palette de peinture étiquetée « marque », « danger », « texte »; changer une recette met à jour toutes les pièces qui l’emploient.", "Tokens are paint cans labeled “brand,” “danger,” and “text”; changing one recipe updates every room using it.", "الرموز علب ألوان مكتوب عليها «علامة» و«خطر» و«نص»؛ يحدّث تغيير وصفة كل الأماكن التي تستعملها."),
      explanation: [L("Un nom sémantique comme --color-danger survit à une nouvelle palette, contrairement à --red. Gardez les primitives rares et exposez des rôles compréhensibles par l’équipe.", "A semantic name like --color-danger survives a palette change unlike --red. Keep primitives limited and expose roles the team understands.", "يبقى اسم دلالي مثل --color-danger صالحًا بعد تغيير اللوحة بعكس --red. قلل القيم الأولية واكشف أدوارًا يفهمها الفريق."), L("Le contraste concerne texte, icônes informatives, bordures essentielles et focus. La couleur ne doit jamais être l’unique signal de promotion, erreur ou sélection; ajoutez texte, icône ou forme.", "Contrast concerns text, informative icons, essential borders, and focus. Color must never be the only signal for sale, error, or selection; add text, icon, or shape.", "يتعلق التباين بالنص والأيقونات المعلوماتية والحدود الأساسية والتركيز. يجب ألا يكون اللون الإشارة الوحيدة للتخفيض أو الخطأ أو التحديد؛ أضف نصًا أو أيقونة أو شكلًا."), L("Définissez default, hover, active, focus-visible, disabled et loading. La typographie conserve des tailles en rem, une hauteur de ligne lisible et une largeur de texte limitée.", "Define default, hover, active, focus-visible, disabled, and loading. Typography keeps rem-based sizes, readable line height, and limited line length.", "حدد default وhover وactive وfocus-visible وdisabled وloading. تحافظ الطباعة على أحجام rem وارتفاع سطر مقروء وطول سطر محدود."),
      ],
      vocabulary: [v("design token", "Nom stable représentant une décision de design.", "Stable name representing a design decision.", "اسم ثابت يمثل قرار تصميم."), v("contrast ratio", "Mesure de différence de luminance entre deux couleurs.", "Measure of luminance difference between colors.", "قياس فرق السطوع بين لونين."), v("focus-visible", "État de focus affiché lorsque l’utilisateur a besoin d’un indicateur.", "Focus state shown when the user needs an indicator.", "حالة تركيز تظهر عندما يحتاج المستخدم مؤشرًا."),
      ],
      generalApplication: L("Centralisez les rôles visuels, vérifiez le contraste, documentez les codes HEX et testez chaque état au clavier et avec préférences système.", "Centralize visual roles, check contrast, document HEX codes, and test every state by keyboard and system preferences.", "مركز الأدوار البصرية وافحص التباين ووثق أكواد HEX واختبر كل حالة بلوحة المفاتيح وتفضيلات النظام."),
      lecomaxApplication: L("L’ecomax emploie #16A34A pour la marque/action, #15803D au survol, #111827 pour le texte, #6B7280 pour le secondaire, #DC2626 pour le danger et #F59E0B pour un focus très visible.", "L’ecomax uses #16A34A for brand/action, #15803D on hover, #111827 for text, #6B7280 for secondary text, #DC2626 for danger, and #F59E0B for strong focus.", "يستعمل L’ecomax اللون #16A34A للعلامة/الفعل و#15803D عند التحويم و#111827 للنص و#6B7280 للثانوي و#DC2626 للخطر و#F59E0B لتركيز واضح."),
      commands: ["npm run dev", "npm run build"],
      expectedResult: L("le bouton utilise les codes documentés, conserve un texte contrasté et expose visiblement hover, focus et disabled.", "the button uses documented codes, keeps text contrasted, and visibly exposes hover, focus, and disabled states.", "يستعمل الزر الأكواد الموثقة ويحافظ على تباين النص ويظهر حالات hover وfocus وdisabled."),
      commonErrors: [error(L("Changer le vert exige de modifier des dizaines de fichiers.", "Changing green requires editing dozens of files.", "يتطلب تغيير الأخضر تعديل عشرات الملفات."), L("Les valeurs HEX sont dupliquées sans token de rôle.", "HEX values are duplicated without role tokens.", "تتكرر قيم HEX من دون رموز أدوار."), L("Définissez les tokens racine puis remplacez progressivement les valeurs par var().", "Define root tokens then progressively replace values with var().", "حدد رموز الجذر ثم استبدل القيم تدريجيًا بـvar().")), error(L("Le focus clavier disparaît.", "Keyboard focus disappears.", "يختفي تركيز لوحة المفاتيح."), L("outline a été supprimé sans alternative visible.", "outline was removed without a visible alternative.", "حُذفت outline بلا بديل مرئي."), L("Restaurez un focus-visible contrasté avec épaisseur et offset suffisants.", "Restore a contrasted focus-visible with sufficient thickness and offset.", "أعد focus-visible متباينًا بسماكة وإزاحة كافيتين."))],
      task: L("Créer une palette de tokens L’ecomax et les six états du bouton d’achat.", "Create an L’ecomax token palette and six buy-button states.", "أنشئ لوحة رموز L’ecomax وحالات زر الشراء الست."),
      solutionExplanation: L("Les tokens séparent intention et valeur; les pseudo-classes rendent chaque transition perceptible sans changer le balisage.", "Tokens separate intent from value; pseudo-classes make every transition perceivable without changing markup.", "تفصل الرموز النية عن القيمة؛ وتجعل pseudo-classes كل انتقال ملحوظًا من دون تغيير الترميز."),
      quiz: { question: L("Quel code représente l’action principale L’ecomax ?", "Which code represents L’ecomax primary action?", "أي كود يمثل الفعل الرئيسي في L’ecomax؟"), options: [L("#16A34A", "#16A34A", "#16A34A"), L("#FFFFFF", "#FFFFFF", "#FFFFFF"), L("#6B7280", "#6B7280", "#6B7280"), L("#DC2626", "#DC2626", "#DC2626")], correctIndex: 0, explanation: L("#16A34A est le token de marque/action; le rouge reste réservé au danger ou à la promotion sémantique.", "#16A34A is the brand/action token; red remains for danger or semantic sale state.", "#16A34A هو رمز العلامة/الفعل؛ ويبقى الأحمر للخطر أو التخفيض الدلالي."),
      },
      recap: L("les tokens nomment les décisions et chaque composant doit rendre perceptibles tous ses états.", "tokens name decisions and every component must make all its states perceivable.", "تسمي الرموز القرارات ويجب أن يجعل كل مكون جميع حالاته قابلة للإدراك."),
      next: L("Le module suivant applique ce système à une interface responsive et à Tailwind.", "The next module applies this system to responsive UI and Tailwind.", "تطبق الوحدة التالية هذا النظام على واجهة متجاوبة وTailwind."),
    }),
  ],
});


modulesBlueprint.push({
  id: "module-01-internet-web",
  order: 1,
  icon: "🌐",
  color: "#2563EB",
  files: [
    { path: "next.config.js", mode: "existing" },
    { path: "academy-labs/01-web/request-lab.mjs", mode: "create" },
  ],
  title: L("Internet, HTTP, DNS, serveurs et API", "Internet, HTTP, DNS, servers, and APIs", "الإنترنت وHTTP وDNS والخوادم وواجهات API"),
  summary: L("Suivre une requête complète depuis une URL jusqu’aux données rendues, avec les méthodes, statuts, en-têtes, DNS, HTTPS et JSON.", "Trace a complete request from a URL to rendered data, including methods, status codes, headers, DNS, HTTPS, and JSON.", "تتبّع طلبًا كاملًا من الرابط حتى البيانات المصيّرة، بما في ذلك الطرق والحالات والرؤوس وDNS وHTTPS وJSON."),
  lessons: [
    coreLesson({
      id: "lesson-01-01-client-server",
      order: 0,
      language: "powershell",
      filename: "academy-labs/01-web/request-response.ps1",
      source: `$response = Invoke-WebRequest -Uri "http://localhost:3000/" -Method Get
$response.StatusCode
$response.Headers["Content-Type"]

$previewLength = [Math]::Min(160, $response.Content.Length)
$response.Content.Substring(0, $previewLength)

curl.exe -i http://localhost:3000/`,
      annotations: [
        { lines: "1-3", label: L("Envoyer GET puis lire séparément statut et type de contenu.", "Send GET, then read status and content type separately.", "أرسل GET ثم اقرأ الحالة ونوع المحتوى كلًا على حدة.") },
        { lines: "5-6", label: L("Limiter l’aperçu du corps sans supposer une longueur minimale.", "Limit the body preview without assuming a minimum length.", "حدّ معاينة الجسم من دون افتراض حد أدنى للطول.") },
        { lines: "8", label: L("Comparer avec le message HTTP brut produit par curl.", "Compare with the raw HTTP message printed by curl.", "قارن برسالة HTTP الخام التي يطبعها curl.") },
      ],
      title: L("Du navigateur au serveur et retour", "From browser to server and back", "من المتصفح إلى الخادم ثم العودة"),
      mentalModel: L("Le client initie un échange en envoyant une requête décrivant une ressource; le serveur calcule une réponse indépendante contenant un statut, des métadonnées et un corps. Le navigateur interprète ensuite ce corps pour produire la page.", "The client starts an exchange by sending a request describing a resource; the server computes an independent response containing a status, metadata, and a body. The browser then interprets that body to produce the page.", "يبدأ العميل التبادل بإرسال طلب يصف موردًا؛ ويحسب الخادم استجابة مستقلة تحتوي حالة وبيانات وصفية وجسمًا. ثم يفسر المتصفح الجسم لإنتاج الصفحة."),
      analogy: L("Comme un restaurant : le client commande précisément, la cuisine traite la demande et le serveur rapporte un plat accompagné d’informations sur son état.", "Like a restaurant: the customer orders precisely, the kitchen processes it, and the waiter returns a dish with information about its state.", "مثل المطعم: يطلب الزبون بدقة، ويعالج المطبخ الطلب، ثم يعيد النادل الطبق مع معلومات عن حالته."),
      explanation: [
        L("Une URL fournit le protocole, l’hôte, le port, le chemin et parfois une requête. Le navigateur transforme ces éléments en message HTTP plutôt que de lire directement les fichiers du serveur.", "A URL supplies protocol, host, port, path, and sometimes a query. The browser turns these parts into an HTTP message instead of reading server files directly.", "يوفر الرابط البروتوكول والمضيف والمنفذ والمسار وأحيانًا الاستعلام. يحول المتصفح هذه الأجزاء إلى رسالة HTTP بدل قراءة ملفات الخادم مباشرة."),
        L("Next.js reçoit le chemin, choisit une route dans app et exécute les composants serveur nécessaires. La réponse obtenue est sérialisée puis transportée, même lorsque client et serveur résident sur le même ordinateur.", "Next.js receives the path, selects a route in app, and runs the necessary server components. The resulting response is serialized and transported even when client and server share one computer.", "يستقبل Next.js المسار ويختار route داخل app وينفذ مكونات الخادم اللازمة. تُسلسل الاستجابة الناتجة وتُنقل حتى عندما يكون العميل والخادم على الحاسوب نفسه."),
        L("Les DevTools Network montrent la durée, les en-têtes, le statut et le corps de chaque échange. Utilisez cette vue pour distinguer un défaut réseau d’un défaut d’affichage React.", "Network DevTools show timing, headers, status, and body for every exchange. Use this view to separate a network fault from a React display fault.", "تعرض Network في أدوات المطور الزمن والرؤوس والحالة والجسم لكل تبادل. استعملها للفصل بين عطل الشبكة وعطل عرض React."),
      ],
      vocabulary: [v("client", "Programme qui envoie une requête.", "Program that sends a request.", "برنامج يرسل طلبًا."), v("server", "Programme qui reçoit une requête et construit une réponse.", "Program that receives a request and builds a response.", "برنامج يستقبل الطلب ويبني الاستجابة."), v("response body", "Contenu transporté après les en-têtes.", "Content transported after response headers.", "المحتوى المنقول بعد رؤوس الاستجابة.")],
      generalApplication: L("Pour diagnostiquer une page vide, confirmez d’abord qu’une requête existe, qu’elle reçoit un statut utile et que son corps contient les données prévues.", "To diagnose a blank page, first confirm a request exists, receives a useful status, and carries the expected data in its body.", "لتشخيص صفحة فارغة، تأكد أولًا من وجود طلب ومن حصوله على حالة مفيدة ومن احتواء جسمه البيانات المتوقعة."),
      lecomaxApplication: L("Rechargez l’accueil L’ecomax et observez dans Network le document principal, puis les images, scripts et appels de données demandés séparément.", "Reload the L’ecomax home page and observe the main document in Network, followed by separately requested images, scripts, and data calls.", "أعد تحميل واجهة L’ecomax ولاحظ المستند الرئيسي في Network ثم الصور والبرامج وطلبات البيانات المنفصلة."),
      commands: ["npm run dev", "powershell -ExecutionPolicy Bypass -File academy-labs/01-web/request-response.ps1", "curl.exe -i http://localhost:3000/"],
      expectedResult: L("curl affiche une ligne 200, des en-têtes Content-Type puis un corps HTML; Network montre le même échange.", "curl prints a 200 line, Content-Type headers, and an HTML body; Network shows the same exchange.", "يعرض curl سطر 200 ورؤوس Content-Type ثم جسم HTML؛ وتعرض Network التبادل نفسه."),
      commonErrors: [
        error(L("La connexion à localhost est refusée.", "Connection to localhost is refused.", "يُرفض الاتصال بـlocalhost."), L("Aucun serveur n’écoute sur le port demandé.", "No server is listening on the requested port.", "لا يوجد خادم يستمع على المنفذ المطلوب."), L("Lancez npm run dev et utilisez exactement l’URL Local imprimée.", "Run npm run dev and use the exact printed Local URL.", "شغّل npm run dev واستعمل رابط Local المطبوع بالضبط.")),
        error(L("Le document répond mais une partie de la page manque.", "The document responds but part of the page is missing.", "يستجيب المستند لكن جزءًا من الصفحة مفقود."), L("Une sous-requête de script, image ou API a échoué séparément.", "A separate script, image, or API subrequest failed.", "فشل طلب فرعي لبرنامج أو صورة أو API بصورة مستقلة."), L("Filtrez Network sur les statuts en erreur et inspectez la première requête rouge.", "Filter Network for failed statuses and inspect the first red request.", "صفِّ Network حسب الحالات الفاشلة وافحص أول طلب أحمر.")),
      ],
      task: L("Tracer le document d’accueil depuis curl jusqu’à l’onglet Network.", "Trace the home document from curl to the Network panel.", "تتبع مستند الواجهة من curl حتى لوحة Network."),
      solutionExplanation: L("Le script prouve statut, en-tête et corps par deux clients; Network ajoute ensuite le découpage temporel et les sous-requêtes du navigateur.", "The script proves status, header, and body through two clients; Network then adds browser timing and subrequests.", "يثبت السكربت الحالة والرأس والجسم عبر عميلين؛ ثم تضيف Network توقيت المتصفح وطلباته الفرعية."),
      solutionCode: `$response = Invoke-WebRequest -Uri "http://localhost:3000/" -Method Get
"Status: $($response.StatusCode)"
"Content-Type: $($response.Headers['Content-Type'])"
$previewLength = [Math]::Min(160, $response.Content.Length)
$response.Content.Substring(0, $previewLength)
curl.exe -i http://localhost:3000/`,
      quiz: { question: L("Qui initie normalement une consultation de page ?", "Who normally initiates a page visit?", "من يبدأ عادة طلب الصفحة؟"), options: [L("Le client", "The client", "العميل"), L("Le CSS", "CSS", "CSS"), L("Le DNS seul", "DNS alone", "DNS وحده"), L("Le disque du serveur", "The server disk", "قرص الخادم")], correctIndex: 0, explanation: L("Le client envoie la requête; le serveur ne produit une réponse qu’après sa réception.", "The client sends the request; the server produces a response only after receiving it.", "يرسل العميل الطلب، ولا ينتج الخادم استجابة إلا بعد استقباله.") },
      recap: L("une page web résulte d’échanges requête/réponse observables, pas d’un accès direct du navigateur au serveur.", "a web page results from observable request/response exchanges, not direct browser access to server files.", "تنتج صفحة الويب من تبادلات طلب واستجابة قابلة للملاحظة، لا من وصول مباشر إلى ملفات الخادم."),
      next: L("La prochaine leçon lit la grammaire HTTP : méthodes, statuts et en-têtes.", "The next lesson reads HTTP grammar: methods, statuses, and headers.", "يقرأ الدرس التالي قواعد HTTP: الطرق والحالات والرؤوس."),
    }),
    coreLesson({
      id: "lesson-01-02-http",
      order: 1,
      language: "javascript",
      filename: "academy-labs/01-web/http-statuses.mjs",
      source: `const response = await fetch("http://localhost:3000/api/products?limit=2", {
  method: "GET",
  headers: { Accept: "application/json" },
});

if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
const products = await response.json();
if (!Array.isArray(products)) throw new TypeError("Expected a product array");
console.table(products.map(({ id, name }) => ({ id, name })));`,
      title: L("Méthodes, statuts, en-têtes et JSON", "Methods, statuses, headers, and JSON", "الطرق والحالات والرؤوس وJSON"),
      mentalModel: L("HTTP est un contrat de messages : la méthode exprime l’intention, le chemin identifie la ressource, les en-têtes décrivent l’échange, le statut classe le résultat et le corps transporte la représentation.", "HTTP is a message contract: the method expresses intent, the path identifies a resource, headers describe the exchange, status classifies the result, and the body carries the representation.", "HTTP عقد للرسائل: تعبّر الطريقة عن النية، ويحدد المسار المورد، وتصف الرؤوس التبادل، وتصنف الحالة النتيجة، ويحمل الجسم التمثيل."),
      analogy: L("Une enveloppe porte l’adresse et les instructions, un accusé indique succès ou problème, et la lettre intérieure correspond au corps.", "An envelope carries address and instructions, a receipt reports success or trouble, and the enclosed letter is the body.", "يحمل الظرف العنوان والتعليمات، ويبين الإيصال النجاح أو المشكلة، وتمثل الرسالة الداخلية الجسم."),
      explanation: [
        L("GET lit, POST crée ou déclenche, PUT/PATCH remplacent ou modifient et DELETE supprime; le serveur doit cependant imposer la sémantique et l’autorisation réelles.", "GET reads, POST creates or triggers, PUT/PATCH replace or modify, and DELETE removes; the server must still enforce actual semantics and authorization.", "تقرأ GET، وتنشئ POST أو تشغّل، وتستبدل PUT/PATCH أو تعدّل، وتحذف DELETE؛ لكن يجب على الخادم فرض المعنى والصلاحية الفعليين."),
        L("Les statuts 2xx signalent un succès, 4xx un problème de requête ou d’autorisation, et 5xx une défaillance serveur. response.ok couvre 200 à 299 mais fetch ne rejette pas automatiquement une réponse 404.", "2xx statuses indicate success, 4xx a request or authorization problem, and 5xx a server failure. response.ok covers 200–299, but fetch does not automatically reject a 404 response.", "تدل حالات 2xx على النجاح، و4xx على مشكلة في الطلب أو الصلاحية، و5xx على فشل الخادم. يغطي response.ok الحالات 200–299، لكن fetch لا يرفض استجابة 404 تلقائيًا."),
        L("Content-Type décrit le format envoyé et Accept le format souhaité. response.json() doit seulement être appelé lorsque le corps contient effectivement du JSON valide.", "Content-Type describes the sent format and Accept the desired format. response.json() should be called only when the body actually contains valid JSON.", "يصف Content-Type الصيغة المرسلة ويصف Accept الصيغة المطلوبة. يجب استدعاء response.json() فقط عندما يحتوي الجسم JSON صالحًا فعلًا."),
      ],
      vocabulary: [v("method", "Verbe HTTP exprimant l’opération demandée.", "HTTP verb expressing the requested operation.", "فعل HTTP الذي يعبر عن العملية المطلوبة."), v("status code", "Nombre à trois chiffres classant le résultat.", "Three-digit number classifying the result.", "رقم من ثلاثة أرقام يصنف النتيجة."), v("header", "Métadonnée clé-valeur attachée au message.", "Key-value metadata attached to a message.", "بيانات وصفية مفتاح/قيمة مرتبطة بالرسالة.")],
      generalApplication: L("Traitez séparément erreur réseau, statut HTTP non réussi et corps invalide afin d’afficher un message exact et de conserver le diagnostic.", "Handle network error, unsuccessful HTTP status, and invalid body separately so the message and diagnosis stay precise.", "عالج خطأ الشبكة والحالة HTTP غير الناجحة والجسم غير الصالح بصورة منفصلة ليظل التنبيه والتشخيص دقيقين."),
      lecomaxApplication: L("Les routes de produits doivent renvoyer JSON avec un statut cohérent; l’interface vérifie response.ok avant de construire une grille.", "Product routes should return JSON with a coherent status; the interface checks response.ok before building a grid.", "يجب أن تعيد مسارات المنتجات JSON بحالة متسقة؛ وتفحص الواجهة response.ok قبل بناء الشبكة."),
      commands: ["npm run dev", "curl.exe -i -H \"Accept: application/json\" http://localhost:3000/api/products?limit=2", "node academy-labs/01-web/http-statuses.mjs"],
      expectedResult: L("la réponse expose son statut, son Content-Type et un corps JSON; un statut non-2xx produit une erreur explicite.", "the response exposes status, Content-Type, and a JSON body; a non-2xx status produces an explicit error.", "تكشف الاستجابة حالتها وContent-Type وجسم JSON؛ وتنتج الحالة غير 2xx خطأ صريحًا."),
      commonErrors: [
        error(L("Le code tente de lire du JSON et reçoit « Unexpected token < ».", "Code parses JSON and receives “Unexpected token <”.", "تحاول الشفرة قراءة JSON وتستقبل «Unexpected token <»."), L("La route a renvoyé une page HTML d’erreur ou de redirection.", "The route returned an HTML error or redirect page.", "أعاد المسار صفحة HTML لخطأ أو إعادة توجيه."), L("Inspectez statut et Content-Type avant response.json(), puis corrigez l’URL ou la route.", "Inspect status and Content-Type before response.json(), then fix the URL or route.", "افحص الحالة وContent-Type قبل response.json() ثم أصلح الرابط أو المسار.")),
        error(L("Une réponse 404 passe dans le flux de succès.", "A 404 response enters the success path.", "تدخل استجابة 404 في مسار النجاح."), L("fetch résout sa promesse pour les statuts HTTP reçus.", "fetch resolves its promise for received HTTP statuses.", "تحل fetch وعدها عند استلام حالات HTTP."), L("Testez response.ok et lancez une erreur contenant response.status.", "Check response.ok and throw an error containing response.status.", "افحص response.ok وارمِ خطأ يحتوي response.status.")),
      ],
      task: L("Écrire un fetch robuste qui distingue succès JSON et statut d’échec.", "Write a robust fetch that separates JSON success from failed status.", "اكتب fetch متينة تفصل نجاح JSON عن الحالة الفاشلة."),
      solutionExplanation: L("La solution valide le statut avant la désérialisation; elle ne laisse donc pas un corps d’erreur se faire passer pour les données métier.", "The solution validates status before deserialization, preventing an error body from masquerading as business data.", "يتحقق الحل من الحالة قبل فك التسلسل، فلا يتنكر جسم الخطأ في صورة بيانات العمل."),
      quiz: { question: L("Que signifie principalement 401 ?", "What does 401 primarily mean?", "ماذا تعني 401 أساسًا؟"), options: [L("Création réussie", "Created successfully", "إنشاء ناجح"), L("Authentification requise ou invalide", "Authentication required or invalid", "المصادقة مطلوبة أو غير صالحة"), L("Erreur serveur générique", "Generic server error", "خطأ خادم عام"), L("Contenu absent définitivement", "Content permanently absent", "المحتوى غائب نهائيًا")], correctIndex: 1, explanation: L("401 concerne l’identité authentifiée; 403 signifie plutôt identité connue mais action interdite.", "401 concerns authenticated identity; 403 more often means a known identity lacks permission.", "تتعلق 401 بالهوية المصادق عليها؛ أما 403 فتعني غالبًا أن الهوية معروفة لكن الفعل ممنوع.") },
      recap: L("la méthode exprime l’intention, le statut classe le résultat et les en-têtes rendent le corps interprétable.", "method expresses intent, status classifies outcome, and headers make the body interpretable.", "تعبر الطريقة عن النية وتصنف الحالة النتيجة وتجعل الرؤوس الجسم قابلًا للتفسير."),
      next: L("La prochaine leçon explique comment un nom de domaine trouve le bon serveur et sécurise le transport.", "The next lesson explains how a domain finds the correct server and secures transport.", "يشرح الدرس التالي كيف يعثر النطاق على الخادم الصحيح ويؤمّن النقل."),
    }),
    coreLesson({
      id: "lesson-01-03-dns-https",
      order: 2,
      language: "powershell",
      filename: "academy-labs/01-web/dns-check.ps1",
      source: `$apex = Resolve-DnsName lecomax.com -Type A
$www = Resolve-DnsName www.lecomax.com -Type CNAME
$apex | Select-Object Name, Type, IPAddress
$www | Select-Object Name, Type, NameHost

Test-NetConnection lecomax.com -Port 443
curl.exe -I https://lecomax.com`,
      title: L("DNS, domaines, ports et HTTPS", "DNS, domains, ports, and HTTPS", "DNS والنطاقات والمنافذ وHTTPS"),
      mentalModel: L("DNS traduit un nom stable en information de routage, TCP atteint un service sur un port, puis TLS authentifie le serveur et chiffre le canal avant que HTTP ne circule. Chaque couche résout un problème distinct.", "DNS translates a stable name into routing information, TCP reaches a service on a port, and TLS authenticates the server and encrypts the channel before HTTP flows. Each layer solves a distinct problem.", "يترجم DNS اسمًا ثابتًا إلى معلومات توجيه، ويصل TCP إلى خدمة على منفذ، ثم يصادق TLS الخادم ويشفّر القناة قبل مرور HTTP. تحل كل طبقة مشكلة مستقلة."),
      analogy: L("DNS est l’annuaire, l’adresse IP l’immeuble, le port le numéro de bureau et TLS le contrôle d’identité avec une conversation scellée.", "DNS is the directory, the IP address the building, the port the office number, and TLS the identity check plus sealed conversation.", "DNS هو دليل الهاتف، وعنوان IP المبنى، والمنفذ رقم المكتب، وTLS فحص الهوية مع محادثة مختومة."),
      explanation: [
        L("Un enregistrement A pointe vers IPv4, AAAA vers IPv6 et CNAME crée un alias vers un autre nom. Les changements sont mis en cache pendant leur TTL et ne deviennent donc pas universels instantanément.", "An A record points to IPv4, AAAA to IPv6, and CNAME aliases another name. Changes are cached for their TTL and therefore do not become universal instantly.", "يشير سجل A إلى IPv4 وAAAA إلى IPv6، وينشئ CNAME اسمًا مستعارًا لاسم آخر. تُخزن التغييرات مؤقتًا طوال TTL ولذلك لا تنتشر عالميًا فورًا."),
        L("localhost contourne le DNS public et vise votre machine; le port 3000 sélectionne le serveur de développement. En production, HTTPS utilise généralement 443 et la plateforme achemine ensuite vers l’application.", "localhost bypasses public DNS and targets your machine; port 3000 selects the development server. In production, HTTPS normally uses 443 and the platform then routes to the application.", "يتجاوز localhost نظام DNS العام ويستهدف جهازك؛ ويحدد المنفذ 3000 خادم التطوير. في الإنتاج يستعمل HTTPS عادة 443 ثم توجه المنصة إلى التطبيق."),
        L("Le certificat TLS doit couvrir le nom demandé et remonter à une autorité approuvée. HTTPS protège le transport, mais ne rend pas automatiquement le code serveur autorisé ou sans faille.", "The TLS certificate must cover the requested name and chain to a trusted authority. HTTPS protects transport but does not automatically make server code authorized or flawless.", "يجب أن تغطي شهادة TLS الاسم المطلوب وأن تتصل بجهة موثوقة. يحمي HTTPS النقل لكنه لا يجعل شفرة الخادم مخولة أو خالية من العيوب تلقائيًا."),
      ],
      vocabulary: [v("DNS", "Système distribué qui résout des noms en enregistrements.", "Distributed system resolving names into records.", "نظام موزع يحل الأسماء إلى سجلات."), v("TTL", "Durée pendant laquelle une réponse DNS peut rester en cache.", "Duration a DNS answer may remain cached.", "مدة بقاء إجابة DNS في الذاكرة المؤقتة."), v("TLS", "Protocole d’authentification et de chiffrement du canal.", "Protocol authenticating and encrypting the channel.", "بروتوكول يصادق القناة ويشفّرها.")],
      generalApplication: L("Diagnostiquez dans l’ordre : résolution DNS, connexion au port, certificat TLS, réponse HTTP, puis contenu applicatif.", "Diagnose in order: DNS resolution, port connection, TLS certificate, HTTP response, then application content.", "شخّص بالترتيب: حل DNS، الاتصال بالمنفذ، شهادة TLS، استجابة HTTP، ثم محتوى التطبيق."),
      lecomaxApplication: L("Le domaine L’ecomax doit pointer vers Vercel, couvrir la variante www choisie et rediriger vers une URL canonique HTTPS.", "The L’ecomax domain must point to Vercel, cover the chosen www variant, and redirect to one canonical HTTPS URL.", "يجب أن يشير نطاق L’ecomax إلى Vercel وأن يغطي نسخة www المختارة ويوجه إلى رابط HTTPS قانوني واحد."),
      commands: ["Resolve-DnsName lecomax.com -Type A", "Resolve-DnsName www.lecomax.com -Type CNAME", "Test-NetConnection lecomax.com -Port 443", "curl.exe -I https://lecomax.com"],
      expectedResult: L("DNS retourne une cible et HTTPS répond avec un certificat valide ainsi qu’un statut ou une redirection explicite.", "DNS returns a target and HTTPS responds with a valid certificate plus an explicit status or redirect.", "يعيد DNS هدفًا ويستجيب HTTPS بشهادة صالحة وحالة أو إعادة توجيه صريحة."),
      commonErrors: [
        error(L("Certains utilisateurs voient l’ancien site après un changement DNS.", "Some users see the old site after a DNS change.", "يرى بعض المستخدمين الموقع القديم بعد تغيير DNS."), L("Des résolveurs conservent l’ancienne réponse jusqu’à expiration du TTL.", "Resolvers retain the old answer until TTL expiration.", "تحتفظ محللات بالأجابة القديمة حتى انتهاء TTL."), L("Comparez plusieurs résolveurs, attendez le TTL et évitez des modifications répétées.", "Compare multiple resolvers, wait for TTL, and avoid repeated edits.", "قارن عدة محللات وانتظر TTL وتجنب التعديلات المتكررة.")),
        error(L("Le navigateur signale un nom de certificat incorrect.", "The browser reports a certificate name mismatch.", "يبلغ المتصفح عن عدم تطابق اسم الشهادة."), L("Le certificat ne contient pas le domaine ou sous-domaine demandé.", "The certificate does not include the requested domain or subdomain.", "لا تتضمن الشهادة النطاق أو النطاق الفرعي المطلوب."), L("Ajoutez le domaine exact à la plateforme, validez DNS puis laissez-la émettre le certificat.", "Add the exact domain to the platform, validate DNS, then let it issue the certificate.", "أضف النطاق الدقيق إلى المنصة وتحقق من DNS ثم دعها تصدر الشهادة.")),
      ],
      task: L("Dessiner et vérifier la chaîne nom → DNS → plateforme → HTTPS → application.", "Draw and verify the name → DNS → platform → HTTPS → application chain.", "ارسم وتحقق من سلسلة الاسم ← DNS ← المنصة ← HTTPS ← التطبيق."),
      solutionExplanation: L("La solution teste chaque couche séparément afin qu’une panne garde une localisation précise.", "The solution tests each layer separately so a failure retains a precise location.", "يختبر الحل كل طبقة منفصلة كي يبقى موقع العطل محددًا."),
      quiz: { question: L("Pourquoi un changement DNS peut-il sembler lent ?", "Why can a DNS change appear slow?", "لماذا قد يبدو تغيير DNS بطيئًا؟"), options: [L("Le CSS le bloque", "CSS blocks it", "لأن CSS يمنعه"), L("Les caches gardent la réponse pendant le TTL", "Caches retain the answer for the TTL", "لأن الذاكرة المؤقتة تحتفظ بالإجابة طوال TTL"), L("HTTP interdit les domaines", "HTTP forbids domains", "لأن HTTP يمنع النطاقات"), L("Git doit fusionner", "Git must merge", "لأن Git يجب أن يدمج")], correctIndex: 1, explanation: L("Le TTL autorise temporairement la réutilisation d’une réponse antérieure.", "TTL temporarily permits reuse of a previous answer.", "يسمح TTL مؤقتًا بإعادة استعمال إجابة سابقة.") },
      recap: L("DNS localise, le port choisit un service et TLS authentifie puis chiffre avant HTTP.", "DNS locates, the port selects a service, and TLS authenticates and encrypts before HTTP.", "يحدد DNS الموقع ويختار المنفذ الخدمة ويصادق TLS ويشفّر قبل HTTP."),
      next: L("La prochaine leçon consomme une API et transforme sa réponse en données utilisables.", "The next lesson consumes an API and turns its response into usable data.", "يستهلك الدرس التالي API ويحوّل استجابتها إلى بيانات قابلة للاستعمال."),
    }),
    coreLesson({
      id: "lesson-01-04-api-fetch",
      order: 3,
      language: "javascript",
      filename: "academy-labs/01-web/request-lab.mjs",
      source: `async function loadProducts(signal) {
  const response = await fetch("http://localhost:3000/api/products?limit=4", { signal });
  if (!response.ok) throw new Error(\`Products: \${response.status}\`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new TypeError("Expected a product array");
  return payload;
}

const controller = new AbortController();
const products = await loadProducts(controller.signal);
console.table(products.map(({ id, name, price }) => ({ id, name, price })));`,
      title: L("Consommer une API avec fetch", "Consume an API with fetch", "استهلك API باستعمال fetch"),
      mentalModel: L("Une API est une frontière contractuelle entre deux programmes. Le consommateur doit gérer le temps d’attente, le statut, la forme inconnue du corps et l’annulation avant de considérer les données comme fiables.", "An API is a contractual boundary between programs. The consumer must handle waiting time, status, unknown body shape, and cancellation before treating data as trustworthy.", "واجهة API حد تعاقدي بين برنامجين. يجب على المستهلك معالجة الانتظار والحالة وشكل الجسم المجهول والإلغاء قبل اعتبار البيانات موثوقة."),
      analogy: L("Commander via un formulaire standard : même si la livraison arrive, vous vérifiez l’étiquette et le contenu avant de ranger les articles.", "Ordering through a standard form: even when delivery arrives, you check the label and contents before storing items.", "كالطلب عبر استمارة موحدة: حتى إن وصلت الشحنة تفحص الملصق والمحتوى قبل تخزين السلع."),
      explanation: [
        L("fetch retourne immédiatement une promesse; await suspend seulement la fonction async concernée jusqu’à l’arrivée d’une réponse ou d’une erreur réseau. L’interface doit prévoir un état de chargement pendant cet intervalle.", "fetch immediately returns a promise; await pauses only the containing async function until a response or network error arrives. The interface needs a loading state during that interval.", "تعيد fetch وعدًا فورًا؛ ويوقف await الدالة async المحيطة فقط حتى تصل استجابة أو خطأ شبكة. تحتاج الواجهة حالة تحميل خلال هذه الفترة."),
        L("Les données externes restent unknown en pratique, même si TypeScript annonce un type. Une vérification d’exécution protège les composants contre une réponse modifiée, incomplète ou malveillante.", "External data remains unknown in practice even if TypeScript claims a type. Runtime validation protects components from changed, incomplete, or malicious responses.", "تبقى البيانات الخارجية unknown عمليًا حتى لو أعلن TypeScript نوعًا. يحمي التحقق وقت التشغيل المكونات من استجابة متغيرة أو ناقصة أو خبيثة."),
        L("AbortController permet d’annuler un chargement devenu inutile, par exemple après navigation ou nouvelle recherche. L’annulation évite qu’une ancienne réponse remplace un état plus récent.", "AbortController cancels a request that became irrelevant, such as after navigation or a newer search. Cancellation prevents an old response from replacing newer state.", "يلغي AbortController طلبًا لم يعد مطلوبًا، مثلًا بعد التنقل أو بحث أحدث. يمنع الإلغاء استجابة قديمة من استبدال حالة أحدث."),
      ],
      vocabulary: [v("API", "Contrat exposant des opérations et formats à d’autres programmes.", "Contract exposing operations and formats to other programs.", "عقد يكشف عمليات وصيغًا لبرامج أخرى."), v("Promise", "Objet représentant un résultat futur réussi ou échoué.", "Object representing a future fulfilled or rejected result.", "كائن يمثل نتيجة مستقبلية ناجحة أو مرفوضة."), v("serialization", "Conversion de données en format transportable comme JSON.", "Conversion of data into a transportable format such as JSON.", "تحويل البيانات إلى صيغة قابلة للنقل مثل JSON."),
      ],
      generalApplication: L("Encapsulez chaque appel dans une fonction qui valide le statut et la forme, puis faites gérer loading, empty et error par l’interface appelante.", "Wrap each call in a function validating status and shape, then let the calling UI handle loading, empty, and error states.", "غلّف كل طلب في دالة تتحقق من الحالة والشكل، ثم دع الواجهة المستدعية تعالج loading وempty وerror."),
      lecomaxApplication: L("Une grille L’ecomax ne doit recevoir qu’un tableau de produits validé; un échec affiche une récupération possible sans faire disparaître toute la page.", "An L’ecomax grid should receive only a validated product array; failure offers recovery without blanking the whole page.", "يجب ألا تستقبل شبكة L’ecomax إلا مصفوفة منتجات متحققًا منها؛ ويعرض الفشل وسيلة استعادة من دون إفراغ الصفحة كلها."),
      commands: ["npm run dev", "curl.exe -i http://localhost:3000/api/products?limit=4", "node academy-labs/01-web/request-lab.mjs"],
      expectedResult: L("quatre produits validés apparaissent dans console.table, ou une erreur contenant le statut explique précisément l’échec.", "four validated products appear in console.table, or an error containing the status precisely explains failure.", "تظهر أربعة منتجات متحقق منها في console.table، أو يشرح خطأ يحتوي الحالة سبب الفشل بدقة."),
      commonErrors: [
        error(L("Une réponse plus ancienne remplace les résultats d’une recherche récente.", "An older response replaces newer search results.", "تستبدل استجابة أقدم نتائج بحث أحدث."), L("Les requêtes concurrentes ne sont ni annulées ni ordonnées.", "Concurrent requests are neither canceled nor ordered.", "لم تُلغ الطلبات المتزامنة ولم تُرتب."), L("Annulez le contrôleur précédent avant chaque nouvelle recherche ou comparez un identifiant de requête.", "Abort the previous controller before each search or compare a request identifier.", "ألغ المتحكم السابق قبل كل بحث أو قارن معرف الطلب.")),
        error(L("Le composant plante sur payload.products.map.", "The component crashes on payload.products.map.", "ينهار المكون عند payload.products.map."), L("La réponse ne contient pas un tableau products.", "The response does not contain a products array.", "لا تحتوي الاستجابة مصفوفة products."), L("Validez Array.isArray et transformez l’échec en état d’erreur lisible.", "Validate Array.isArray and turn failure into a readable error state.", "تحقق عبر Array.isArray وحوّل الفشل إلى حالة خطأ مقروءة.")),
      ],
      task: L("Charger quatre produits, valider leur conteneur et afficher une erreur contrôlée.", "Load four products, validate their container, and display a controlled error.", "حمّل أربعة منتجات وتحقق من حاويتها واعرض خطأ مضبوطًا."),
      solutionExplanation: L("La solution ne confond jamais transport réussi et données valides; elle vérifie les deux frontières avant de retourner le tableau.", "The solution never confuses successful transport with valid data; it checks both boundaries before returning the array.", "لا يخلط الحل بين نجاح النقل وصلاحية البيانات؛ بل يفحص الحدين قبل إعادة المصفوفة."),
      quiz: { question: L("Quel fait fetch ne garantit-il pas ?", "What does fetch not guarantee?", "ما الذي لا تضمنه fetch؟"), options: [L("Retourner une Promise", "Returning a Promise", "إعادة Promise"), L("Fournir un objet Response", "Providing a Response object", "توفير كائن Response"), L("Rejeter automatiquement un statut 500", "Automatically rejecting a 500 status", "رفض الحالة 500 تلقائيًا"), L("Accepter un signal", "Accepting a signal", "قبول signal")], correctIndex: 2, explanation: L("Un statut HTTP reçu résout normalement fetch; le code doit tester response.ok.", "A received HTTP status normally resolves fetch; code must test response.ok.", "تحل حالة HTTP المستلمة fetch عادة؛ ويجب على الشفرة فحص response.ok.") },
      recap: L("un client API fiable vérifie réseau, statut, format et pertinence temporelle avant d’utiliser les données.", "a reliable API client checks network, status, shape, and temporal relevance before using data.", "يفحص عميل API الموثوق الشبكة والحالة والشكل والملاءمة الزمنية قبل استعمال البيانات."),
      next: L("Le module suivant enregistre les changements de code avec Git et les partage sur GitHub.", "The next module records code changes with Git and shares them on GitHub.", "تسجل الوحدة التالية تغييرات الشفرة عبر Git وتشاركها على GitHub."),
    }),
  ],
});

modulesBlueprint.push({
  id: "module-02-git-github",
  order: 2,
  icon: "🌿",
  color: "#F97316",
  files: [
    { path: ".gitignore", mode: "existing" },
    { path: "README.md", mode: "existing" },
    { path: "academy-labs/02-git/workflow.sh", mode: "create" },
  ],
  title: L("Git, branches, GitHub et travail professionnel", "Git, branches, GitHub, and professional workflow", "Git والفروع وGitHub وسير العمل الاحترافي"),
  summary: L("Comprendre les trois zones Git, créer des commits lisibles, travailler en branche, synchroniser un dépôt distant et protéger secrets et historique.", "Understand Git’s three areas, create readable commits, work on branches, synchronize a remote, and protect secrets and history.", "فهم مناطق Git الثلاث وإنشاء commits واضحة والعمل بالفروع ومزامنة مستودع بعيد وحماية الأسرار والتاريخ."),
  lessons: [
    coreLesson({
      id: "lesson-02-01-snapshot",
      order: 0,
      language: "shell",
      filename: "academy-labs/02-git/workflow.sh",
      source: `git status --short
git diff

git add academy-labs/02-git/workflow.sh
git diff --staged

git commit -m "docs: explain the Git snapshot workflow"
git log --oneline -5`,
      title: L("Du fichier modifié au snapshot Git", "From changed file to Git snapshot", "من الملف المعدّل إلى لقطة Git"),
      mentalModel: L("Git sépare le dossier de travail, l’index de préparation et l’historique des commits. git add copie une version choisie vers l’index; commit transforme exactement cet index en snapshot immuable relié au précédent.", "Git separates the working tree, staging index, and commit history. git add copies a selected version into the index; commit turns exactly that index into an immutable snapshot linked to its parent.", "يفصل Git بين شجرة العمل وفهرس التجهيز وتاريخ commits. ينسخ git add نسخة مختارة إلى الفهرس؛ ويحوّل commit ذلك الفهرس بالضبط إلى لقطة ثابتة مرتبطة بسابقتها."),
      analogy: L("Le dossier de travail est le bureau, l’index le carton prêt à expédier et le commit la photo datée du contenu scellé.", "The working tree is the desk, staging is the packed shipping box, and the commit is a dated photo of its sealed contents.", "شجرة العمل هي المكتب، والفهرس صندوق الشحن المجهز، وcommit صورة مؤرخة لمحتواه المختوم."),
      explanation: [L("git status inventorie sans modifier; git diff montre ce qui diffère entre travail et index. Lisez chaque ligne pour exclure les changements accidentels.", "git status inventories without changing; git diff shows differences between working tree and index. Read every line to exclude accidental changes.", "يجرد git status الحالة من دون تعديل؛ ويعرض git diff الفرق بين شجرة العمل والفهرس. اقرأ كل سطر لاستبعاد التغييرات العرضية."), L("git add ne signifie pas « envoyer vers GitHub » : il choisit la prochaine photographie. git diff --staged est donc le dernier contrôle exact avant commit.", "git add does not mean “send to GitHub”: it selects the next photograph. git diff --staged is therefore the exact final check before committing.", "لا يعني git add «الإرسال إلى GitHub»، بل يختار الصورة التالية. لذلك git diff --staged هو الفحص الدقيق الأخير قبل commit."), L("Un commit rassemble un changement cohérent et son message explique pourquoi il existe. De petits snapshots permettent revue, bisect et retour ciblé.", "A commit groups one coherent change and its message explains why it exists. Small snapshots enable review, bisect, and targeted reversal.", "يجمع commit تغييرًا متماسكًا وتشرح رسالته سبب وجوده. تسمح اللقطات الصغيرة بالمراجعة وbisect والتراجع المستهدف.")],
      vocabulary: [v("working tree", "État actuel des fichiers sur disque.", "Current state of files on disk.", "الحالة الحالية للملفات على القرص."), v("staging area", "Sélection exacte préparée pour le prochain commit.", "Exact selection prepared for the next commit.", "الاختيار الدقيق المجهز للـcommit التالي."), v("commit", "Snapshot identifié, horodaté et relié à un parent.", "Identified, timestamped snapshot linked to a parent.", "لقطة ذات معرف وتاريخ مرتبطة بأصل.")],
      generalApplication: L("Préparez uniquement les fichiers d’une intention, inspectez le diff staged et formulez un message impératif précis.", "Stage only files for one intention, inspect the staged diff, and write a precise imperative message.", "جهّز ملفات هدف واحد فقط وافحص staged diff واكتب رسالة أمرية دقيقة."),
      lecomaxApplication: L("Une correction de ProductCard et une mise à jour de documentation doivent être deux commits si elles peuvent être revues ou annulées séparément.", "A ProductCard fix and documentation update should be separate commits if they can be reviewed or reverted independently.", "يجب فصل إصلاح ProductCard وتحديث التوثيق في commitين إذا أمكن مراجعتهما أو التراجع عنهما مستقلين."),
      commands: ["git status --short", "git diff", "git add academy-labs/02-git/workflow.sh", "git diff --staged", "git commit -m \"docs: explain the Git snapshot workflow\""],
      expectedResult: L("le commit contient seulement le fichier prévu et git status revient propre pour ce changement.", "the commit contains only the intended file and git status is clean for that change.", "يحتوي commit الملف المقصود فقط وتعود git status نظيفة لهذا التغيير."),
      commonErrors: [error(L("Le commit contient des fichiers sans rapport.", "The commit contains unrelated files.", "يحتوي commit ملفات لا علاقة لها."), L("git add . a été exécuté sans lecture du statut et du diff.", "git add . was run without reading status and diff.", "شُغّل git add . من دون قراءة الحالة والفرق."), L("Préparez les chemins explicitement et utilisez git diff --staged avant commit.", "Stage explicit paths and use git diff --staged before committing.", "جهّز المسارات صراحة واستعمل git diff --staged قبل commit.")), error(L("git commit annonce « nothing to commit ».", "git commit reports “nothing to commit”.", "يعلن git commit «nothing to commit»."), L("Aucune modification n’est dans l’index ou le fichier est ignoré.", "No modification is staged or the file is ignored.", "لا يوجد تعديل في الفهرس أو الملف متجاهل."), L("Consultez git status, ajoutez le bon chemin et vérifiez git check-ignore si nécessaire.", "Inspect git status, add the correct path, and check git check-ignore if needed.", "افحص git status وأضف المسار الصحيح وتحقق عبر git check-ignore عند الحاجة."))],
      task: L("Créer un commit documentaire atomique après inspection des deux diffs.", "Create an atomic documentation commit after inspecting both diffs.", "أنشئ commit توثيقية ذرية بعد فحص الفرقين."),
      solutionExplanation: L("La séquence distingue contenu non préparé et contenu préparé, ce qui garantit que le snapshot correspond à l’intention annoncée.", "The sequence separates unstaged and staged content, ensuring the snapshot matches the stated intention.", "يفصل التسلسل بين المحتوى غير المجهز والمجهز فيضمن مطابقة اللقطة للهدف المعلن."),
      quiz: { question: L("Que contient un commit ?", "What does a commit contain?", "ماذا يحتوي commit؟"), options: [L("Tous les fichiers du disque", "Every file on disk", "كل ملفات القرص"), L("Exactement l’état préparé dans l’index", "Exactly the state staged in the index", "الحالة المجهزة في الفهرس بالضبط"), L("Seulement le dernier fichier ouvert", "Only the last opened file", "آخر ملف مفتوح فقط"), L("Le dépôt GitHub automatiquement", "The GitHub repository automatically", "مستودع GitHub تلقائيًا")], correctIndex: 1, explanation: L("commit photographie l’index, pas toutes les modifications du dossier de travail.", "commit snapshots the index, not every working-tree modification.", "يصور commit الفهرس لا كل تعديلات شجرة العمل.") },
      recap: L("status observe, diff explique, add sélectionne et commit fige un snapshot cohérent.", "status observes, diff explains, add selects, and commit freezes a coherent snapshot.", "تلاحظ status وتشرح diff وتختار add ويثبت commit لقطة متماسكة."),
      next: L("La prochaine leçon isole le travail dans une branche et explique fusion et conflits.", "The next lesson isolates work on a branch and explains merging and conflicts.", "يعزل الدرس التالي العمل في فرع ويشرح الدمج والتعارضات."),
    }),
    coreLesson({
      id: "lesson-02-02-branches",
      order: 1,
      language: "shell",
      filename: "academy-labs/02-git/branch-lab.sh",
      source: `git switch -c academy/http-notes
git status --short

git add academy-labs/02-git/branch-lab.sh
git commit -m "docs: add HTTP learning notes"

git switch main
git merge --no-ff academy/http-notes
git log --graph --oneline --decorate -8`,
      title: L("Branches, fusion et conflits", "Branches, merging, and conflicts", "الفروع والدمج والتعارضات"),
      mentalModel: L("Une branche est un nom mobile pointant vers un commit; HEAD indique la branche active. Les commits font avancer ce pointeur, et merge réunit deux histoires en conservant leurs ancêtres communs.", "A branch is a movable name pointing to a commit; HEAD identifies the active branch. Commits advance that pointer, and merge combines two histories while preserving common ancestry.", "الفرع اسم متحرك يشير إلى commit؛ وتحدد HEAD الفرع النشط. تقدم commits هذا المؤشر، ويجمع merge تاريخين مع الحفاظ على الأصل المشترك."),
      analogy: L("Deux brouillons partent de la même photocopie; la fusion assemble leurs ajouts, et un conflit demande de choisir lorsqu’ils réécrivent la même phrase.", "Two drafts start from the same photocopy; merging combines additions, while a conflict needs a choice when both rewrite the same sentence.", "تبدأ مسودتان من النسخة نفسها؛ يجمع الدمج إضافاتهما، ويتطلب التعارض قرارًا عندما تعيدان كتابة الجملة نفسها."),
      explanation: [L("git switch -c crée un pointeur au commit courant et vous place dessus. Vérifiez toujours le nom de branche avant de commencer afin de ne pas déposer des commits sur main.", "git switch -c creates a pointer at the current commit and checks it out. Always verify the branch name before starting so commits do not land on main.", "ينشئ git switch -c مؤشرًا عند commit الحالي وينقلك إليه. تحقق دائمًا من اسم الفرع قبل البدء كي لا تقع commits على main."), L("Une fusion rapide avance seulement le pointeur; --no-ff crée un commit de fusion visible. Le choix dépend de la politique, mais le contenu final doit être testé après réunion.", "A fast-forward merge only moves a pointer; --no-ff creates a visible merge commit. Policy decides which to use, but final content must be tested after combination.", "يحرك fast-forward المؤشر فقط؛ وينشئ ‎--no-ff commit دمج ظاهرة. تحدد السياسة الاختيار، لكن يجب اختبار المحتوى النهائي بعد الجمع."), L("Un conflit marque les variantes ours et theirs dans le fichier. Lisez le contexte métier, produisez une version finale valide, retirez tous les marqueurs, préparez puis terminez la fusion.", "A conflict marks ours and theirs variants in the file. Read business context, produce one valid final version, remove all markers, stage, and finish the merge.", "يعلّم التعارض نسختي ours وtheirs في الملف. اقرأ سياق العمل وأنشئ نسخة نهائية صالحة واحذف كل العلامات ثم جهّز وأكمل الدمج.")],
      vocabulary: [v("branch", "Pointeur nommé vers une ligne de commits.", "Named pointer to a line of commits.", "مؤشر مسمى إلى سلسلة commits."), v("HEAD", "Référence à la branche ou au commit actuellement extrait.", "Reference to the currently checked-out branch or commit.", "مرجع إلى الفرع أو commit المستخرجة حاليًا."), v("merge conflict", "Chevauchement que Git ne peut résoudre sans décision humaine.", "Overlap Git cannot resolve without human choice.", "تداخل لا يستطيع Git حله من دون قرار بشري.")],
      generalApplication: L("Créez une branche courte par objectif, synchronisez-la tôt et fusionnez seulement après revue et tests.", "Create one short-lived branch per goal, synchronize early, and merge only after review and tests.", "أنشئ فرعًا قصير العمر لكل هدف وزامنه مبكرًا ولا تدمج إلا بعد المراجعة والاختبارات."),
      lecomaxApplication: L("Une branche academy/http-notes protège main pendant l’écriture du cours et rend le diff pédagogique révisable indépendamment du magasin.", "An academy/http-notes branch protects main while writing the course and makes the educational diff reviewable independently from the store.", "يحمي فرع academy/http-notes فرع main أثناء كتابة الدورة ويجعل فرق التعليم قابلًا للمراجعة مستقلًا عن المتجر."),
      commands: ["git switch -c academy/http-notes", "git branch --show-current", "git merge --no-ff academy/http-notes", "git log --graph --oneline --decorate -8"],
      expectedResult: L("le graphe montre la branche, son commit et une fusion claire sans marqueur de conflit restant.", "the graph shows the branch, its commit, and a clear merge with no conflict markers remaining.", "يعرض الرسم الفرع وcommit الخاصة به ودمجًا واضحًا من دون بقاء علامات تعارض."),
      commonErrors: [error(L("Les commits apparaissent directement sur main.", "Commits appear directly on main.", "تظهر commits مباشرة على main."), L("La branche active n’a pas été vérifiée avant l’édition.", "The active branch was not checked before editing.", "لم يُتحقق من الفرع النشط قبل التعديل."), L("Exécutez git branch --show-current avant toute tâche et créez la branche si nécessaire.", "Run git branch --show-current before each task and create the branch if needed.", "شغّل git branch --show-current قبل كل مهمة وأنشئ الفرع عند الحاجة.")), error(L("Le code contient encore <<<<<<< après fusion.", "Code still contains <<<<<<< after merging.", "لا تزال الشفرة تحتوي <<<<<<< بعد الدمج."), L("Les marqueurs de conflit ont été enregistrés comme contenu normal.", "Conflict markers were saved as normal content.", "حُفظت علامات التعارض كمحتوى عادي."), L("Recherchez tous les marqueurs, choisissez le contenu final, testez puis préparez la résolution.", "Search all markers, choose final content, test, then stage the resolution.", "ابحث عن كل العلامات واختر المحتوى النهائي واختبر ثم جهّز الحل."))],
      task: L("Créer une branche de notes, y committer un fichier et visualiser sa relation avec main.", "Create a notes branch, commit a file there, and visualize its relation to main.", "أنشئ فرع ملاحظات وثبت فيه ملفًا واعرض علاقته بـmain."),
      solutionExplanation: L("Le graphe matérialise les pointeurs et ancêtres; il empêche de confondre branche, dossier copié et dépôt distant.", "The graph materializes pointers and ancestry, preventing confusion among branches, copied folders, and remotes.", "يجسد الرسم المؤشرات والأصول ويمنع الخلط بين الفروع والمجلدات المنسوخة والمستودعات البعيدة."),
      quiz: { question: L("Qu’est-ce qu’une branche Git ?", "What is a Git branch?", "ما فرع Git؟"), options: [L("Une copie complète obligatoire", "A required full copy", "نسخة كاملة إلزامية"), L("Un pointeur nommé vers un commit", "A named pointer to a commit", "مؤشر مسمى إلى commit"), L("Un compte GitHub", "A GitHub account", "حساب GitHub"), L("Un fichier JSON", "A JSON file", "ملف JSON")], correctIndex: 1, explanation: L("Les objets commit sont partagés; la branche est une référence légère qui avance.", "Commit objects are shared; the branch is a lightweight advancing reference.", "كائنات commit مشتركة؛ والفرع مرجع خفيف يتحرك."),
      },
      recap: L("une branche est un pointeur isolant une suite de commits; merge réunit des histoires et exige parfois une décision.", "a branch is a pointer isolating a commit sequence; merge combines histories and sometimes requires a decision.", "الفرع مؤشر يعزل سلسلة commits؛ ويجمع merge التواريخ وقد يتطلب قرارًا."),
      next: L("La prochaine leçon connecte le dépôt local à GitHub et au processus de pull request.", "The next lesson connects the local repository to GitHub and pull requests.", "يربط الدرس التالي المستودع المحلي بـGitHub وعملية pull request."),
    }),
    coreLesson({
      id: "lesson-02-03-remotes-pr",
      order: 2,
      language: "shell",
      filename: "academy-labs/02-git/remote-check.sh",
      source: `git remote -v
git fetch origin --prune
git status -sb

git push -u origin academy/http-notes
git diff --stat origin/main...HEAD
npm run build`,
      title: L("Dépôts distants, push, pull et pull requests", "Remotes, push, pull, and pull requests", "المستودعات البعيدة وpush وpull وطلبات السحب"),
      mentalModel: L("Le dépôt local et le dépôt GitHub possèdent des historiques distincts. fetch télécharge les références distantes sans modifier le travail, push publie des commits, et une pull request ajoute une conversation de revue autour d’un diff.", "The local repository and GitHub repository hold separate histories. fetch downloads remote references without changing work, push publishes commits, and a pull request adds a review conversation around a diff.", "للمستودع المحلي ومستودع GitHub تاريخان منفصلان. ينزل fetch المراجع البعيدة من دون تعديل العمل، وينشر push commits، ويضيف pull request محادثة مراجعة حول الفرق."),
      analogy: L("Votre carnet local et l’archive de l’équipe sont séparés; fetch consulte l’index de l’archive, push remet vos pages et la PR demande leur relecture.", "Your local notebook and team archive are separate; fetch checks the archive index, push submits your pages, and the PR requests review.", "دفترك المحلي وأرشيف الفريق منفصلان؛ يراجع fetch فهرس الأرشيف، ويسلم push صفحاتك، ويطلب PR مراجعتها."),
      explanation: [L("origin est seulement le nom conventionnel d’une URL distante. git remote -v doit être vérifié avant publication pour éviter d’envoyer du code vers le mauvais dépôt.", "origin is only the conventional name of a remote URL. Check git remote -v before publishing to avoid sending code to the wrong repository.", "origin مجرد اسم تقليدي لرابط بعيد. تحقق من git remote -v قبل النشر لتجنب إرسال الشفرة إلى مستودع خاطئ."), L("fetch met à jour origin/main et les autres références de suivi sans fusion. pull combine fetch avec une intégration; préférez comprendre l’écart avec status/log avant cette opération combinée.", "fetch updates origin/main and other tracking references without merging. pull combines fetch with integration; understand the divergence with status/log before that combined operation.", "يحدّث fetch مراجع التتبع مثل origin/main من دون دمج. يجمع pull بين fetch والإدماج؛ افهم الاختلاف عبر status/log قبل العملية المركبة."), L("La PR doit expliquer problème, solution, preuve et risques. Les checks automatisés complètent la revue humaine mais ne prouvent ni l’intention produit ni toutes les interactions visuelles.", "A PR should explain problem, solution, evidence, and risks. Automated checks complement human review but prove neither product intent nor every visual interaction.", "يجب أن تشرح PR المشكلة والحل والدليل والمخاطر. تكمل الفحوص الآلية المراجعة البشرية لكنها لا تثبت نية المنتج ولا كل التفاعلات البصرية."),
      ],
      vocabulary: [v("remote", "Nom local associé à l’URL d’un autre dépôt Git.", "Local name associated with another Git repository URL.", "اسم محلي مرتبط برابط مستودع Git آخر."), v("tracking branch", "Référence locale reflétant l’état observé d’une branche distante.", "Local reference reflecting the observed state of a remote branch.", "مرجع محلي يعكس الحالة المرصودة لفرع بعيد."), v("pull request", "Proposition de fusion accompagnée d’un diff, d’échanges et de contrôles.", "Merge proposal accompanied by a diff, discussion, and checks.", "اقتراح دمج يصاحبه فرق ونقاش وفحوص."),
      ],
      generalApplication: L("Faites fetch, examinez l’écart, rebasez ou fusionnez selon la politique, poussez la branche puis présentez une PR vérifiable.", "Fetch, inspect divergence, rebase or merge according to policy, push the branch, then present a verifiable PR.", "نفّذ fetch وافحص الاختلاف ثم أعد الأساس أو ادمج حسب السياسة وادفع الفرع وقدم PR قابلة للتحقق."),
      lecomaxApplication: L("Une PR L’ecomax doit citer les pages touchées, les tailles d’écran testées et le résultat de npm run build avant fusion.", "An L’ecomax PR should name affected pages, tested screen sizes, and npm run build result before merging.", "يجب أن تذكر PR الخاصة بـL’ecomax الصفحات المتأثرة وأحجام الشاشة المختبرة ونتيجة npm run build قبل الدمج."),
      commands: ["git remote -v", "git fetch origin --prune", "git status -sb", "git push -u origin academy/http-notes", "git diff --stat origin/main...HEAD", "npm run build"],
      expectedResult: L("la branche distante correspond au commit local et la PR affiche uniquement le diff intentionnel avec des checks lisibles.", "the remote branch matches the local commit and the PR shows only the intended diff with readable checks.", "يطابق الفرع البعيد commit المحلية وتعرض PR الفرق المقصود فقط مع فحوص مقروءة."),
      commonErrors: [error(L("push est rejeté comme non-fast-forward.", "push is rejected as non-fast-forward.", "يُرفض push لأنه non-fast-forward."), L("La branche distante contient des commits absents localement.", "The remote branch contains commits missing locally.", "يحتوي الفرع البعيد commits غير موجودة محليًا."), L("Faites fetch, inspectez le graphe, intégrez les commits puis repoussez sans --force aveugle.", "Fetch, inspect the graph, integrate commits, then push again without blind --force.", "نفّذ fetch وافحص الرسم وادمج commits ثم ادفع مجددًا من دون ‎--force أعمى.")), error(L("La PR affiche des centaines de changements inattendus.", "The PR shows hundreds of unexpected changes.", "تعرض PR مئات التغييرات غير المتوقعة."), L("La branche est partie d’une mauvaise base ou contient des commits étrangers.", "The branch started from the wrong base or contains unrelated commits.", "بدأ الفرع من أساس خاطئ أو يحتوي commits غريبة."), L("Comparez git log main..HEAD; recréez une branche depuis la bonne base et cherry-pickez les commits voulus.", "Compare git log main..HEAD; recreate from the correct base and cherry-pick intended commits.", "قارن git log main..HEAD؛ وأنشئ فرعًا من الأساس الصحيح وانقل commits المطلوبة عبر cherry-pick."))],
      task: L("Publier une branche et préparer une description de PR avec preuve de validation.", "Publish a branch and prepare a PR description with validation evidence.", "انشر فرعًا وجهز وصف PR مع دليل التحقق."),
      solutionExplanation: L("La publication configure le suivi amont; la description rend ensuite le changement contrôlable sans dépendre de la mémoire de l’auteur.", "Publishing configures upstream tracking; the description makes the change auditable without relying on the author’s memory.", "يضبط النشر التتبع upstream؛ ثم يجعل الوصف التغيير قابلًا للتدقيق من دون الاعتماد على ذاكرة الكاتب."),
      quiz: { question: L("Quelle commande met à jour origin/main sans fusionner ?", "Which command updates origin/main without merging?", "أي أمر يحدث origin/main من دون دمج؟"), options: [L("git fetch", "git fetch", "git fetch"), L("git commit", "git commit", "git commit"), L("git add", "git add", "git add"), L("git init", "git init", "git init")], correctIndex: 0, explanation: L("fetch télécharge objets et références; il ne change pas la branche extraite.", "fetch downloads objects and references; it does not change the checked-out branch.", "ينزل fetch الكائنات والمراجع ولا يغيّر الفرع المستخرج."),
      },
      recap: L("local et distant sont deux historiques; fetch observe, push publie et la PR organise la revue.", "local and remote are two histories; fetch observes, push publishes, and the PR organizes review.", "المحلي والبعيد تاريخان؛ يراقب fetch وينشر push وتنظم PR المراجعة."),
      next: L("La prochaine leçon protège les secrets et montre les récupérations Git sans destruction.", "The next lesson protects secrets and demonstrates non-destructive Git recovery.", "يحمي الدرس التالي الأسرار ويعرض استعادة Git من دون تدمير."),
    }),
    coreLesson({
      id: "lesson-02-04-safety",
      order: 3,
      language: "markdown",
      filename: "academy-labs/02-git/secret-response.md",
      source: `# Secret incident response

1. Revoke or rotate the exposed credential in its provider dashboard.
2. Record the exposure window without copying the secret into this file.
3. Run git status --short, git diff, and git log --oneline -5.
4. Add the local secret path to .gitignore and verify it with git check-ignore -v .env.local.
5. If a shared commit must be undone, identify it with git show --stat HEAD and use git revert after review.
6. Run npm run build, request review, and document the replacement credential owner.`,
      annotations: [
        { lines: "1-3", label: L("Réduire d’abord le risque réel en révoquant la valeur exposée.", "Reduce real risk first by revoking the exposed value.", "اخفض الخطر الحقيقي أولًا بإلغاء القيمة المكشوفة.") },
        { lines: "4-5", label: L("Observer l’historique et prévenir un nouveau suivi sans recopier le secret.", "Inspect history and prevent future tracking without copying the secret.", "افحص التاريخ وامنع التتبع المستقبلي من دون نسخ السر.") },
        { lines: "6-8", label: L("Préférer un revert traçable, revalider puis attribuer le suivi humain.", "Prefer a traceable revert, revalidate, and assign human follow-up.", "فضّل revert قابلًا للتتبع ثم أعد التحقق وحدد مسؤول المتابعة.") },
      ],
      title: L("Secrets, .gitignore et récupération sûre", "Secrets, .gitignore, and safe recovery", "الأسرار و.gitignore والاستعادة الآمنة"),
      mentalModel: L(".gitignore empêche le suivi futur de certains chemins non suivis mais n’efface ni l’historique ni un secret déjà indexé. Une récupération sûre ajoute généralement un nouveau commit inverse au lieu de réécrire un historique partagé.", ".gitignore prevents future tracking of selected untracked paths but does not erase history or an already tracked secret. Safe recovery usually adds a new inverse commit instead of rewriting shared history.", "يمنع .gitignore تتبع مسارات غير متتبعة مستقبلًا لكنه لا يمحو التاريخ ولا سرًا سبق فهرسته. تضيف الاستعادة الآمنة عادة commit عكسية جديدة بدل إعادة كتابة تاريخ مشترك."),
      analogy: L("La liste « ne pas archiver » n’extrait pas une feuille déjà rangée; si un secret est archivé, il faut révoquer la clé et nettoyer selon une procédure coordonnée.", "A “do not archive” list does not remove an already filed page; if a secret was archived, revoke it and clean history through a coordinated procedure.", "لا تزيل قائمة «لا تؤرشف» ورقة أُرشفت سابقًا؛ إذا أُرشف سر فيجب إلغاؤه وتنظيف التاريخ بإجراء منسق."),
      explanation: [L("Ignorez dépendances installées, sorties de build et variables locales, mais conservez les sources et le lockfile. git check-ignore -v explique quelle règle exclut un chemin.", "Ignore installed dependencies, build outputs, and local variables, but keep source and lockfile. git check-ignore -v explains which rule excludes a path.", "تجاهل الاعتماديات المثبتة ومخرجات البناء والمتغيرات المحلية، لكن احتفظ بالمصادر وملف القفل. يشرح git check-ignore -v القاعدة التي تستبعد المسار."), L("Une valeur NEXT_PUBLIC_ est envoyée au navigateur et ne doit jamais être secrète. Les clés serveur restent dans l’environnement de déploiement et ne sont ni committées ni affichées dans les logs.", "A NEXT_PUBLIC_ value is sent to the browser and must never be secret. Server keys remain in deployment environment variables and are neither committed nor logged.", "تُرسل قيمة NEXT_PUBLIC_ إلى المتصفح فلا يجوز أن تكون سرية. تبقى مفاتيح الخادم في متغيرات بيئة النشر ولا تُثبت ولا تُطبع في السجلات."), L("Avant toute récupération, observez status, diff et log. git restore concerne le travail non committé, tandis que git revert crée un inverse traçable pour un commit déjà partagé.", "Before recovery, inspect status, diff, and log. git restore concerns uncommitted work, while git revert creates a traceable inverse for an already shared commit.", "قبل الاستعادة افحص status وdiff وlog. يعالج git restore العمل غير المثبت، بينما ينشئ git revert عكسًا قابلًا للتتبع لـcommit مشتركة."),
      ],
      vocabulary: [v("secret", "Valeur donnant un accès privilégié et devant être révocable.", "Revocable value granting privileged access.", "قيمة قابلة للإلغاء تمنح وصولًا مميزًا."), v("ignored file", "Chemin non suivi que Git omet selon une règle.", "Untracked path Git omits according to a rule.", "مسار غير متتبع يتجاهله Git وفق قاعدة."), v("revert", "Nouveau commit inversant les changements d’un commit antérieur.", "New commit reversing the changes of an earlier commit.", "commit جديدة تعكس تغييرات commit سابقة."),
      ],
      generalApplication: L("Analysez les fichiers avant add, utilisez un scanner de secrets en CI et révoquez immédiatement toute clé publiée, même après suppression du fichier.", "Inspect files before add, run secret scanning in CI, and immediately revoke any published key even after deleting the file.", "افحص الملفات قبل add وشغّل فحص الأسرار في CI وألغ فورًا أي مفتاح منشور حتى بعد حذف الملف."),
      lecomaxApplication: L("Les clés Supabase serveur, PayPal, Resend et OpenAI restent dans les variables Vercel; seules les valeurs explicitement publiques peuvent entrer dans le bundle.", "Supabase server, PayPal, Resend, and OpenAI keys stay in Vercel variables; only explicitly public values may enter the bundle.", "تبقى مفاتيح خادم Supabase وPayPal وResend وOpenAI في متغيرات Vercel؛ ولا تدخل الحزمة إلا القيم العامة صراحة."),
      commands: ["git check-ignore -v .env.local", "git status --short", "git diff", "git log --oneline -5", "git show --stat HEAD", "git revert --help"],
      expectedResult: L("les fichiers secrets sont ignorés, les sources restent suivies et l’annulation partagée apparaît comme un nouveau commit explicite.", "secret files are ignored, source remains tracked, and shared reversal appears as a new explicit commit.", "تُتجاهل ملفات الأسرار وتظل المصادر متتبعة ويظهر التراجع المشترك كـcommit جديدة صريحة."),
      commonErrors: [error(L("Un secret supprimé reste visible dans GitHub.", "A deleted secret remains visible on GitHub.", "يبقى سر محذوف ظاهرًا في GitHub."), L("La suppression actuelle n’efface pas les anciens commits.", "Current deletion does not erase older commits.", "لا يمحو الحذف الحالي commits القديمة."), L("Révoquez la clé, remplacez-la, puis coordonnez un nettoyage d’historique si l’exposition l’exige.", "Revoke and replace the key, then coordinate history cleanup if exposure requires it.", "ألغ المفتاح واستبدله ثم نسق تنظيف التاريخ إذا استلزم التسريب.")), error(L("Un fichier attendu n’apparaît pas dans git status.", "An expected file does not appear in git status.", "لا يظهر ملف متوقع في git status."), L("Une règle .gitignore directe ou parente le masque.", "A direct or parent .gitignore rule masks it.", "تخفيه قاعدة .gitignore مباشرة أو موروثة."), L("Utilisez git check-ignore -v, corrigez la règle, puis ajoutez le fichier seulement s’il doit vraiment être versionné.", "Use git check-ignore -v, fix the rule, then add only if it truly belongs in version control.", "استعمل git check-ignore -v وأصلح القاعدة ثم أضف الملف فقط إن كان يجب تتبعه."))],
      task: L("Auditer .gitignore et documenter une procédure de réponse à un secret accidentel.", "Audit .gitignore and document a response procedure for an accidental secret.", "راجع .gitignore ووثق إجراء الاستجابة لسر نُشر عرضًا."),
      solutionExplanation: L("La procédure commence par réduire le risque réel grâce à la révocation, puis restaure un état Git traçable et prévient la récidive.", "The procedure first reduces real risk through revocation, then restores a traceable Git state and prevents recurrence.", "يبدأ الإجراء بخفض الخطر الحقيقي عبر الإلغاء، ثم يعيد حالة Git قابلة للتتبع ويمنع التكرار."),
      quiz: { question: L("Que faire en premier après avoir committé une clé active ?", "What should happen first after committing an active key?", "ما أول إجراء بعد تثبيت مفتاح نشط؟"), options: [L("Changer la couleur du site", "Change site color", "تغيير لون الموقع"), L("Révoquer ou faire tourner la clé", "Revoke or rotate the key", "إلغاء المفتاح أو تدويره"), L("Ajouter seulement .env à .gitignore", "Only add .env to .gitignore", "إضافة .env إلى .gitignore فقط"), L("Fermer VS Code", "Close VS Code", "إغلاق VS Code")], correctIndex: 1, explanation: L("Le secret doit être considéré compromis; .gitignore n’annule ni son pouvoir ni sa présence historique.", "The secret must be treated as compromised; .gitignore removes neither its power nor historical presence.", "يجب اعتبار السر مخترقًا؛ فلا يزيل .gitignore صلاحيته ولا وجوده التاريخي."),
      },
      recap: L("ignorer prévient le suivi futur; un secret publié doit être révoqué et un historique partagé s’annule de façon traçable.", "ignore rules prevent future tracking; a published secret must be revoked and shared history should be reversed traceably.", "تمنع قواعد التجاهل التتبع المستقبلي؛ ويجب إلغاء السر المنشور وعكس التاريخ المشترك بصورة قابلة للتتبع."),
      next: L("Le module suivant construit des documents HTML sémantiques que navigateurs et technologies d’assistance comprennent.", "The next module builds semantic HTML documents understood by browsers and assistive technology.", "تبني الوحدة التالية مستندات HTML دلالية تفهمها المتصفحات والتقنيات المساعدة."),
    }),
  ],
});

export const modules = modulesBlueprint
  .sort((a, b) => a.order - b.order)
  .map(buildModule);
