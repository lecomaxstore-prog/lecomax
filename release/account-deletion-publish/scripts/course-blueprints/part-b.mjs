const tr = (fr, en, ar) => ({ fr, en, ar });

const LOCALE_TEXT = {
  fr: {
    prerequisites: (focus) => [
      "Savoir ouvrir le projet L’ecomax dans VS Code et utiliser le terminal intégré.",
      `Avoir lu la leçon précédente et pouvoir expliquer, avec ses propres mots, le rôle de ${focus}.`,
    ],
    objectives: (focus) => [
      `Construire un modèle mental précis de ${focus}.`,
      "Écrire puis exécuter un exemple minimal avant de l’intégrer à une fonctionnalité réelle.",
      "Reconnaître les états d’échec, lire leurs symptômes et appliquer une correction vérifiable.",
    ],
    mentalSuffix: "Dessine d’abord les entrées, les transformations, les frontières de confiance et les sorties : cette carte permet de prévoir où le code s’exécute et où une erreur doit être traitée.",
    analogy: (focus, image) => `${focus} ressemble à ${image}. L’analogie aide à retenir le trajet principal, mais le code reste la preuve : observe chaque valeur à l’entrée, pendant la transformation et à la sortie.`,
    explanationSuffix: [
      "Commence par la version la plus petite possible et observe sa valeur réelle dans le terminal ou les DevTools avant d’ajouter une abstraction.",
      "Relie ensuite cette règle au contrat entre navigateur, serveur et base de données ; chaque frontière doit avoir une entrée définie et une erreur explicite.",
      "Enfin, vérifie le cas nominal, une entrée limite et un échec volontaire afin de prouver que le comportement ne dépend pas seulement du scénario heureux.",
    ],
    expected: (focus, filename) => `Après exécution, ${focus} produit le résultat décrit sans avertissement silencieux. Dans ${filename}, le chemin nominal et le chemin d’erreur sont tous les deux visibles et explicables.`,
    commonErrors: (focus, errors) => errors,
    steps: (filename, focus) => [
      `Ouvre ${filename}, repère l’entrée et écris en commentaire le résultat attendu pour ${focus}.`,
      "Recopie l’exemple sans copier-coller, exécute-le, puis compare chaque valeur observée avec ton attente.",
      "Provoque volontairement une entrée invalide, ajoute le traitement manquant et vérifie que le message aide réellement l’utilisateur.",
      "Reviens au cas nominal, supprime les logs temporaires et explique la solution à voix haute sans regarder le cours.",
    ],
    hints: (focus) => [
      `Réduis ${focus} à une seule entrée et une seule sortie avant de chercher une solution plus générale.`,
      "Lis la première ligne utile de l’erreur, puis inspecte le type et la valeur juste avant cette ligne.",
      "Si le navigateur et le serveur ne sont pas d’accord, considère toujours le serveur comme la frontière qui doit revalider.",
    ],
    solution: (focus, filename) => `La solution garde ${focus} explicite dans ${filename} : elle valide l’entrée, effectue une transformation déterministe, retourne un résultat typé et traite l’échec au niveau qui peut fournir un message utile. Exécute aussi le cas invalide pour vérifier la correction.`,
    quizQuestion: (focus) => `Quelle affirmation applique correctement ${focus} dans une application de production ?`,
    distractors: (focus) => [
      `Le navigateur peut décider seul de ${focus}, car ses données sont toujours fiables.`,
      `${focus} concerne uniquement les couleurs et n’a aucun effet sur les données.`,
      `Les erreurs liées à ${focus} peuvent être ignorées si le cas nominal fonctionne une fois.`,
    ],
    quizExplanation: (claim) => `La bonne réponse est « ${claim} ». Elle décrit un comportement observable et vérifiable ; les autres propositions suppriment une frontière de sécurité, confondent présentation et données, ou ignorent les scénarios d’échec.`,
    recap: (focus, general, lecomax) => [
      `Tu peux maintenant expliquer ${focus} avec un schéma entrée → transformation → sortie.`,
      general,
      lecomax,
    ],
    annotations: (title, count) => [
      { lines: "1-2", label: `${title} : les deux premières lignes installent le contrat et les données d’entrée.` },
      { lines: count > 5 ? `3-${Math.min(6, count)}` : `3-${count}`, label: "Ce bloc réalise la transformation principale ; suis les valeurs ligne par ligne et vérifie leur type." },
      { lines: count > 6 ? `7-${count}` : `${count}-${count}`, label: "La fin expose le résultat ou l’échec attendu afin que l’appelant puisse réagir sans deviner." },
    ],
  },
  en: {
    prerequisites: (focus) => [
      "Know how to open the L’ecomax project in VS Code and use its integrated terminal.",
      `Have read the previous lesson and be able to explain the role of ${focus} in your own words.`,
    ],
    objectives: (focus) => [
      `Build an accurate mental model of ${focus}.`,
      "Write and run a minimal example before integrating it into a real feature.",
      "Recognize failure states, read their symptoms, and apply a verifiable correction.",
    ],
    mentalSuffix: "First draw the inputs, transformations, trust boundaries, and outputs. That map lets you predict where code runs and where each failure must be handled.",
    analogy: (focus, image) => `${focus} is like ${image}. The analogy helps you remember the main journey, but running code is the evidence: inspect every value at the input, during transformation, and at the output.`,
    explanationSuffix: [
      "Start with the smallest working version and inspect its real value in the terminal or DevTools before adding an abstraction.",
      "Then connect the rule to the contract between browser, server, and database; every boundary needs a defined input and an explicit failure.",
      "Finally test the normal case, a boundary input, and a deliberate failure so the behavior is proven beyond the happy path.",
    ],
    expected: (focus, filename) => `After execution, ${focus} produces the described result without a silent warning. In ${filename}, both the normal path and the error path are visible and explainable.`,
    commonErrors: (focus, errors) => errors,
    steps: (filename, focus) => [
      `Open ${filename}, locate the input, and write the expected result for ${focus} as a comment.`,
      "Retype the example without copy and paste, run it, and compare every observed value with your expectation.",
      "Deliberately provide invalid input, add the missing handling, and verify that the message genuinely helps the user.",
      "Return to the normal case, remove temporary logs, and explain the solution aloud without looking at the course.",
    ],
    hints: (focus) => [
      `Reduce ${focus} to one input and one output before looking for a more general solution.`,
      "Read the first useful error line, then inspect the type and value immediately before that line.",
      "When browser and server disagree, the server is always the boundary that must validate again.",
    ],
    solution: (focus, filename) => `The solution keeps ${focus} explicit in ${filename}: it validates input, performs a deterministic transformation, returns a typed result, and handles failure where a useful message can be produced. Run the invalid case as well to prove the fix.`,
    quizQuestion: (focus) => `Which statement applies ${focus} correctly in a production application?`,
    distractors: (focus) => [
      `The browser can decide ${focus} by itself because its data is always trustworthy.`,
      `${focus} only concerns colors and has no effect on data.`,
      `Failures related to ${focus} may be ignored when the happy path worked once.`,
    ],
    quizExplanation: (claim) => `The correct answer is “${claim}.” It describes observable, testable behavior; the alternatives remove a security boundary, confuse presentation with data, or ignore failure scenarios.`,
    recap: (focus, general, lecomax) => [
      `You can now explain ${focus} with an input → transformation → output diagram.`,
      general,
      lecomax,
    ],
    annotations: (title, count) => [
      { lines: "1-2", label: `${title}: the first two lines establish the contract and input data.` },
      { lines: count > 5 ? `3-${Math.min(6, count)}` : `3-${count}`, label: "This block performs the main transformation; follow values line by line and verify their types." },
      { lines: count > 6 ? `7-${count}` : `${count}-${count}`, label: "The ending exposes the expected result or failure so the caller can react without guessing." },
    ],
  },
  ar: {
    prerequisites: (focus) => [
      "معرفة فتح مشروع L’ecomax في VS Code واستخدام الطرفية المدمجة فيه.",
      `قراءة الدرس السابق والقدرة على شرح دور ${focus} بكلماتك الخاصة.`,
    ],
    objectives: (focus) => [
      `بناء نموذج ذهني دقيق لـ ${focus}.`,
      "كتابة مثال صغير وتشغيله قبل دمجه في ميزة حقيقية.",
      "تمييز حالات الفشل وقراءة أعراضها وتطبيق إصلاح يمكن التحقق منه.",
    ],
    mentalSuffix: "ارسم أولاً المدخلات والتحويلات وحدود الثقة والمخرجات؛ فهذه الخريطة تجعلك تتوقع مكان تنفيذ الشيفرة والمكان الصحيح لمعالجة كل خطأ.",
    analogy: (focus, image) => `${focus} يشبه ${image}. يساعدك التشبيه على تذكر المسار الرئيسي، لكن تشغيل الشيفرة هو الدليل: راقب كل قيمة عند الإدخال وأثناء التحويل وعند الإخراج.`,
    explanationSuffix: [
      "ابدأ بأصغر نسخة عاملة وراقب قيمتها الحقيقية في الطرفية أو أدوات المطور قبل إضافة أي طبقة تجريد.",
      "ثم اربط القاعدة بالعقد بين المتصفح والخادم وقاعدة البيانات؛ فكل حد يحتاج إلى مدخل محدد وفشل صريح.",
      "وأخيراً اختبر الحالة العادية وقيمة حدّية وفشلاً متعمداً حتى تثبت السلوك خارج المسار الناجح فقط.",
    ],
    expected: (focus, filename) => `بعد التشغيل تنتج ${focus} النتيجة الموصوفة بلا تحذير صامت. في ${filename} يظهر مسار النجاح ومسار الخطأ ويمكن تفسيرهما.`,
    commonErrors: (focus, errors) => errors,
    steps: (filename, focus) => [
      `افتح ${filename} وحدد المدخل واكتب النتيجة المتوقعة لـ ${focus} في تعليق.`,
      "أعد كتابة المثال من دون نسخ ولصق، وشغله، ثم قارن كل قيمة تراها بما توقعته.",
      "مرر مدخلاً غير صالح عمداً، وأضف المعالجة الناقصة، وتأكد أن الرسالة تساعد المستخدم فعلاً.",
      "ارجع إلى الحالة العادية واحذف السجلات المؤقتة واشرح الحل بصوت مرتفع من دون النظر إلى الدرس.",
    ],
    hints: (focus) => [
      `اختصر ${focus} إلى مدخل واحد ومخرج واحد قبل البحث عن حل أعم.`,
      "اقرأ أول سطر مفيد من الخطأ، ثم افحص نوع القيمة وقيمتها قبل ذلك السطر مباشرة.",
      "عند اختلاف المتصفح والخادم، اعتبر الخادم دائماً الحد الذي يجب أن يعيد التحقق.",
    ],
    solution: (focus, filename) => `يبقي الحل ${focus} واضحة في ${filename}: يتحقق من المدخل، وينفذ تحويلاً حتمياً، ويعيد نتيجة محددة النوع، ويعالج الفشل في المكان القادر على إعطاء رسالة مفيدة. شغّل الحالة غير الصالحة أيضاً لإثبات الإصلاح.`,
    quizQuestion: (focus) => `أي عبارة تطبق ${focus} بصورة صحيحة في تطبيق إنتاجي؟`,
    distractors: (focus) => [
      `يمكن للمتصفح أن يقرر ${focus} وحده لأن بياناته موثوقة دائماً.`,
      `${focus} تخص الألوان فقط ولا تؤثر في البيانات.`,
      `يمكن تجاهل الأخطاء المتعلقة بـ ${focus} إذا نجح المسار العادي مرة واحدة.`,
    ],
    quizExplanation: (claim) => `الإجابة الصحيحة هي «${claim}». فهي تصف سلوكاً قابلاً للملاحظة والاختبار، بينما تلغي الخيارات الأخرى حد أمان أو تخلط العرض بالبيانات أو تتجاهل حالات الفشل.`,
    recap: (focus, general, lecomax) => [
      `يمكنك الآن شرح ${focus} برسم مدخلات ← تحويل ← مخرجات.`,
      general,
      lecomax,
    ],
    annotations: (title, count) => [
      { lines: "1-2", label: `${title}: يثبت السطران الأولان العقد وبيانات الإدخال.` },
      { lines: count > 5 ? `3-${Math.min(6, count)}` : `3-${count}`, label: "تنفذ هذه الكتلة التحويل الرئيسي؛ تتبع القيم سطراً بسطر وتحقق من أنواعها." },
      { lines: count > 6 ? `7-${count}` : `${count}-${count}`, label: "تكشف النهاية النتيجة المتوقعة أو الفشل حتى يتصرف المستدعي من دون تخمين." },
    ],
  },
};

function localizedErrors(locale, moduleErrors) {
  return moduleErrors[locale].map(([symptom, cause, fix]) => ({ symptom, cause, fix }));
}

function lessonVocabulary(locale, module, lesson) {
  const moduleTerms = module.vocabulary[locale];
  const firstModuleTerm = moduleTerms[lesson.order % moduleTerms.length];
  const secondModuleTerm = moduleTerms[(lesson.order + 1) % moduleTerms.length];
  return [
    { term: lesson.focus[locale], definition: lesson.mental[locale] },
    { term: lesson.title[locale], definition: lesson.points[locale][0] },
    { term: firstModuleTerm[0], definition: firstModuleTerm[1] },
    { term: secondModuleTerm[0], definition: secondModuleTerm[1] },
  ];
}

function lessonErrors(locale, lesson) {
  const title = lesson.title[locale];
  const focus = lesson.focus[locale];
  const [rule, boundary, correction] = lesson.points[locale];
  const messages = {
    fr: [
      {
        symptom: `L’exemple « ${title} » s’exécute, mais il ne démontre pas ${focus}.`,
        cause: `L’implémentation contredit cette règle du cours : ${rule}`,
        fix: `Reviens au premier endroit où la valeur diverge, applique cette règle, puis relance les commandes exactes de la leçon.`,
      },
      {
        symptom: `Le cas nominal fonctionne dans ${lesson.filename}, mais le cas limite échoue ou reste silencieux.`,
        cause: `La frontière suivante n’est pas encore représentée dans le code : ${boundary}`,
        fix: `Ajoute un cas de vérification explicite en t’appuyant sur ce principe : ${correction}`,
      },
    ],
    en: [
      {
        symptom: `The “${title}” example runs, but it does not demonstrate ${focus}.`,
        cause: `The implementation contradicts this lesson rule: ${rule}`,
        fix: `Return to the first value that diverges, apply that rule, and rerun the lesson’s exact commands.`,
      },
      {
        symptom: `The normal case works in ${lesson.filename}, but the boundary case fails or stays silent.`,
        cause: `The following boundary is not represented in the code yet: ${boundary}`,
        fix: `Add an explicit verification case using this principle: ${correction}`,
      },
    ],
    ar: [
      {
        symptom: `يعمل مثال «${title}» لكنه لا يثبت ${focus}.`,
        cause: `يخالف التنفيذ قاعدة الدرس التالية: ${rule}`,
        fix: `ارجع إلى أول قيمة انحرفت وطبق القاعدة ثم أعد تشغيل أوامر الدرس الدقيقة.`,
      },
      {
        symptom: `تعمل الحالة العادية في ${lesson.filename} لكن الحالة الحدية تفشل أو تبقى صامتة.`,
        cause: `لم يمثل الكود الحد التالي بعد: ${boundary}`,
        fix: `أضف حالة تحقق صريحة بالاعتماد على هذا المبدأ: ${correction}`,
      },
    ],
  };
  return messages[locale];
}

function exerciseTask(locale, lesson) {
  if (lesson.solutionTask) return lesson.solutionTask[locale];
  const messages = {
    fr: `Dans ${lesson.filename}, reconstruis l’exemple annoté « ${lesson.title.fr} » afin qu’il démontre ${lesson.focus.fr}, puis vérifie exactement ce comportement avec les commandes fournies.`,
    en: `In ${lesson.filename}, rebuild the annotated “${lesson.title.en}” example so it demonstrates ${lesson.focus.en}, then verify that exact behavior with the provided commands.`,
    ar: `في ${lesson.filename} أعد بناء المثال المشروح «${lesson.title.ar}» بحيث يثبت ${lesson.focus.ar}، ثم تحقق من السلوك نفسه بالأوامر المقدمة.`,
  };
  return messages[locale];
}

function lessonSteps(locale, lesson, exactCommands) {
  const firstLine = lesson.source.split("\n").find((line) => line.trim())?.trim() ?? "";
  const lastLine = [...lesson.source.split("\n")].reverse().find((line) => line.trim())?.trim() ?? "";
  const verification = exactCommands.join(" puis ");
  const messages = {
    fr: [
      `Ouvre ${lesson.filename} et isole la fonction ou le composant de l’exercice sans supprimer le reste du fichier L’ecomax.`,
      `Commence par le contrat de la première ligne — ${firstLine} — puis saisis les lignes suivantes dans l’ordre en contrôlant chaque type et chaque retour.`,
      `Vérifie que la dernière instruction — ${lastLine} — respecte cette règle observable : ${lesson.points.fr[0]}`,
      `Enregistre le fichier, exécute ${verification}, puis teste une valeur normale et le cas limite décrit dans les erreurs fréquentes.`,
    ],
    en: [
      `Open ${lesson.filename} and isolate the exercise function or component without deleting the rest of the L’ecomax file.`,
      `Start from the first-line contract — ${firstLine} — then type the remaining lines in order while checking every type and return value.`,
      `Verify that the final instruction — ${lastLine} — obeys this observable rule: ${lesson.points.en[0]}`,
      `Save the file, run ${exactCommands.join(" then ")}, and test both a normal value and the boundary case described under common errors.`,
    ],
    ar: [
      `افتح ${lesson.filename} واعزل دالة التمرين أو مكوّنه من دون حذف بقية ملف L’ecomax.`,
      `ابدأ بعقد السطر الأول — ${firstLine} — ثم اكتب بقية الأسطر بالترتيب مع فحص كل نوع وقيمة إرجاع.`,
      `تحقق من أن التعليمة الأخيرة — ${lastLine} — تطبق القاعدة الملحوظة التالية: ${lesson.points.ar[0]}`,
      `احفظ الملف وشغّل ${exactCommands.join(" ثم ")} ثم اختبر قيمة عادية والحالة الحدية المذكورة في الأخطاء الشائعة.`,
    ],
  };
  if (lesson.language === "sql") {
    const sqlSteps = {
      fr: `Après la commande de copie, colle le SQL dans l’éditeur SQL d’un projet Supabase de test, exécute-le une seule fois et lis chaque succès ou erreur avant toute modification.`,
      en: `After the copy command, paste the SQL into the SQL editor of a test Supabase project, run it once, and read every success or error before changing anything.`,
      ar: `بعد أمر النسخ الصق SQL في محرر SQL لمشروع Supabase اختباري وشغّله مرة واحدة واقرأ كل نجاح أو خطأ قبل تعديل أي شيء.`,
    };
    messages[locale].splice(3, 0, sqlSteps[locale]);
  }
  return messages[locale];
}

function lessonHints(locale, lesson) {
  const messages = {
    fr: [
      `Le point de départ est le contrat visible dans ${lesson.filename}, pas une nouvelle abstraction ni un nouveau paquet.`,
      `Si le résultat diverge, relis cette frontière : ${lesson.points.fr[1]}`,
      `Compare ta version ligne par ligne avec la solution et applique cette correction : ${lesson.points.fr[2]}`,
    ],
    en: [
      `Start from the contract visible in ${lesson.filename}, not from a new abstraction or package.`,
      `If the result diverges, reread this boundary: ${lesson.points.en[1]}`,
      `Compare your version with the solution line by line and apply this correction: ${lesson.points.en[2]}`,
    ],
    ar: [
      `ابدأ من العقد الظاهر في ${lesson.filename} لا من طبقة تجريد أو حزمة جديدة.`,
      `إذا اختلفت النتيجة فأعد قراءة هذا الحد: ${lesson.points.ar[1]}`,
      `قارن نسختك بالحل سطراً بسطر وطبق هذا التصحيح: ${lesson.points.ar[2]}`,
    ],
  };
  return messages[locale];
}

function lessonExpected(locale, lesson, exactCommands) {
  if (lesson.expected) return lesson.expected[locale];
  const messages = {
    fr: `Dans ${lesson.filename}, le résultat doit démontrer « ${lesson.title.fr} » et rendre ${lesson.focus.fr} observable. ${exactCommands.join(" puis ")} se termine sans erreur ; le comportement obtenu respecte précisément : ${lesson.points.fr[0]}`,
    en: `In ${lesson.filename}, the result must demonstrate “${lesson.title.en}” and make ${lesson.focus.en} observable. ${exactCommands.join(" then ")} completes without an error, and the behavior follows this exact rule: ${lesson.points.en[0]}`,
    ar: `في ${lesson.filename} يجب أن تثبت النتيجة «${lesson.title.ar}» وتجعل ${lesson.focus.ar} قابلة للملاحظة. يكتمل ${exactCommands.join(" ثم ")} بلا خطأ ويطبق السلوك هذه القاعدة بدقة: ${lesson.points.ar[0]}`,
  };
  return messages[locale];
}

function solutionExplanation(locale, lesson) {
  const lineCount = lesson.source.split("\n").length;
  const messages = {
    fr: `La solution complète de ${lesson.filename} comporte ${lineCount} lignes annotées. Elle implémente directement ${lesson.focus.fr}, conserve le contrat montré dans l’exemple et rend le cas d’échec explicite sans ajouter de dépendance.`,
    en: `The complete ${lesson.filename} solution contains ${lineCount} annotated lines. It implements ${lesson.focus.en} directly, preserves the contract shown in the example, and makes the failure case explicit without adding a dependency.`,
    ar: `يتكون الحل الكامل في ${lesson.filename} من ${lineCount} سطراً مشروحاً. وهو ينفذ ${lesson.focus.ar} مباشرة ويحافظ على العقد الظاهر في المثال ويجعل حالة الفشل صريحة بلا حزمة إضافية.`,
  };
  return messages[locale];
}

function buildContent(locale, module, lesson) {
  const ui = LOCALE_TEXT[locale];
  const focus = lesson.focus[locale];
  const claim = lesson.points[locale][0];
  const distractors = ui.distractors(focus);
  const correctIndex = lesson.order % 4;
  const options = [...distractors];
  options.splice(correctIndex, 0, claim);
  const exactCommands = lesson.commands.filter((command) => !command.trimStart().startsWith("#"));
  return {
    title: lesson.title[locale],
    prerequisites: ui.prerequisites(focus),
    objectives: ui.objectives(focus),
    mentalModel: `${lesson.mental[locale]} ${ui.mentalSuffix}`,
    analogy: ui.analogy(focus, module.analogy[locale]),
    explanation: lesson.points[locale].map((paragraph, index) => `${paragraph} ${ui.explanationSuffix[index]}`),
    vocabulary: lessonVocabulary(locale, module, lesson),
    generalApplication: lesson.general[locale],
    lecomaxApplication: lesson.lecomax[locale],
    commands: exactCommands,
    expectedResult: lessonExpected(locale, lesson, exactCommands),
    commonErrors: lessonErrors(locale, lesson),
    exercise: {
      task: exerciseTask(locale, lesson),
      steps: lessonSteps(locale, lesson, exactCommands),
      hints: lessonHints(locale, lesson),
      solutionExplanation: solutionExplanation(locale, lesson),
      solutionCode: lesson.source,
    },
    quiz: {
      question: ui.quizQuestion(focus),
      options,
      correctIndex,
      explanation: ui.quizExplanation(claim),
    },
    recap: ui.recap(focus, lesson.general[locale], lesson.lecomax[locale]),
    next: lesson.next[locale],
  };
}

function buildLesson(module, lesson) {
  const extension = { javascript: "mjs", typescript: "ts", tsx: "tsx", sql: "sql" }[lesson.language];
  const filename = `academy-labs/${module.id}/${lesson.id}.${extension}`;
  const commands = lesson.language === "javascript"
    ? [`node \"${filename}\"`]
    : lesson.language === "sql"
      ? [`Get-Content -Raw -LiteralPath \"${filename}\" | Set-Clipboard`, "npm run validate:course"]
      : lesson.commands;
  const labLesson = { ...lesson, filename, commands };
  const lineCount = labLesson.source.split("\n").length;
  return {
    id: labLesson.id,
    order: labLesson.order,
    language: labLesson.language,
    filename: labLesson.filename,
    source: labLesson.source,
    annotations: {
      fr: LOCALE_TEXT.fr.annotations(labLesson.title.fr, lineCount),
      en: LOCALE_TEXT.en.annotations(labLesson.title.en, lineCount),
      ar: LOCALE_TEXT.ar.annotations(labLesson.title.ar, lineCount),
    },
    locales: {
      fr: buildContent("fr", module, labLesson),
      en: buildContent("en", module, labLesson),
      ar: buildContent("ar", module, labLesson),
    },
  };
}

function buildModule(module) {
  return {
    id: module.id,
    order: module.order,
    icon: module.icon,
    color: module.color,
    files: module.files,
    locales: module.locales,
    lessons: module.lessons.map((lesson) => buildLesson(module, lesson)),
  };
}

const asyncModule = {
  id: "async-fetch-errors",
  order: 9,
  icon: "⏳",
  color: "#f59e0b",
  files: [
    { path: "lib/products.ts", mode: "existing" },
    { path: "app/api/products/route.ts", mode: "existing" },
    { path: "app/boutique/page.tsx", mode: "existing" },
  ],
  locales: {
    fr: { title: "Asynchronisme, Fetch et erreurs", summary: "Comprendre la boucle d’événements, attendre des promesses, parler HTTP et rendre tous les états d’une interface distante." },
    en: { title: "Async, Fetch, and errors", summary: "Understand the event loop, await promises, speak HTTP, and render every state of a remote interface." },
    ar: { title: "البرمجة غير المتزامنة وFetch والأخطاء", summary: "فهم حلقة الأحداث وانتظار الوعود والتعامل مع HTTP وعرض جميع حالات الواجهة البعيدة." },
  },
  analogy: tr("un ticket de commande remis à une cuisine qui prévient quand le plat est prêt", "an order ticket handed to a kitchen that announces when the meal is ready", "بطاقة طلب تسلم إلى المطبخ الذي يبلغك عندما تصبح الوجبة جاهزة"),
  vocabulary: {
    fr: [["Promise", "Objet représentant une valeur future réussie ou rejetée."], ["await", "Mot-clé qui suspend la fonction async sans bloquer toute la page."], ["Response", "Objet HTTP contenant statut, en-têtes et corps à lire."], ["timeout", "Limite temporelle après laquelle l’opération doit être abandonnée."]],
    en: [["Promise", "An object representing a future fulfilled or rejected value."], ["await", "A keyword that pauses an async function without blocking the whole page."], ["Response", "An HTTP object containing status, headers, and a body to read."], ["timeout", "A time limit after which the operation should be abandoned."]],
    ar: [["Promise", "كائن يمثل قيمة مستقبلية ناجحة أو مرفوضة."], ["await", "كلمة توقف الدالة غير المتزامنة من دون حجب الصفحة كلها."], ["Response", "كائن HTTP يحتوي الحالة والترويسات والجسم المراد قراءته."], ["timeout", "حد زمني يجب بعده إلغاء العملية."]],
  },
  errors: {
    fr: [["L’interface affiche [object Promise].", "La promesse a été rendue avant d’être attendue.", "Place l’appel dans une fonction async et utilise await au bon niveau."], ["Une réponse 404 entre dans le chemin succès.", "fetch ne rejette pas automatiquement les statuts HTTP d’erreur.", "Teste response.ok et transforme le statut en erreur métier explicite."]],
    en: [["The interface displays [object Promise].", "The promise was rendered before it was awaited.", "Put the call in an async function and use await at the correct level."], ["A 404 response enters the success path.", "fetch does not automatically reject HTTP error statuses.", "Check response.ok and turn the status into an explicit domain error."]],
    ar: [["تعرض الواجهة [object Promise].", "تم عرض الوعد قبل انتظاره.", "ضع الاستدعاء في دالة async واستخدم await في المستوى الصحيح."], ["تدخل استجابة 404 في مسار النجاح.", "لا يرفض fetch حالات خطأ HTTP تلقائياً.", "افحص response.ok وحول الحالة إلى خطأ مجال صريح."]],
  },
  lessons: [
    {
      id: "async-event-loop-promises", order: 0, language: "javascript", filename: "lib/products.ts",
      commands: ["node --version", "npx tsc --noEmit"],
      source: [
        "console.log(\"A: synchrone\");",
        "const productsPromise = Promise.resolve([\"Sac\", \"Robe\"]);",
        "productsPromise.then((products) => console.log(\"C:\", products));",
        "console.log(\"B: synchrone\");",
        "// Résultat : A, B, puis C",
        "export { productsPromise };",
      ].join("\n"),
      title: tr("Boucle d’événements et promesses", "Event loop and promises", "حلقة الأحداث والوعود"),
      focus: tr("l’ordre d’exécution des promesses", "promise execution order", "ترتيب تنفيذ الوعود"),
      mental: tr("JavaScript termine la pile synchrone courante avant de reprendre les réactions d’une promesse dans la file des microtâches. Une promesse n’est donc pas sa valeur finale, mais un contrat qui sera résolu ou rejeté plus tard.", "JavaScript finishes the current synchronous call stack before running promise reactions from the microtask queue. A promise is therefore not its final value but a contract that will later be fulfilled or rejected.", "ينهي JavaScript مكدس الاستدعاءات المتزامن الحالي قبل تشغيل تفاعلات الوعد من طابور المهام الدقيقة. لذلك لا يكون الوعد قيمته النهائية بل عقداً سينجح أو يُرفض لاحقاً."),
      points: tr([
        "La pile d’appels exécute console.log A puis programme le callback de then ; elle continue immédiatement jusqu’à B avant de vider la file des microtâches.",
        "Les états pending, fulfilled et rejected sont exclusifs : une promesse réglée ne change plus, ce qui stabilise le contrat pour tous ses consommateurs.",
        "then transforme une valeur et retourne toujours une nouvelle promesse ; chaîner les retours évite les callbacks imbriqués et conserve un seul chemin d’erreur.",
      ], [
        "The call stack runs console.log A and schedules the then callback; it immediately continues to B before draining the microtask queue.",
        "The pending, fulfilled, and rejected states are exclusive: a settled promise never changes again, which stabilizes the contract for every consumer.",
        "then transforms a value and always returns a new promise; returning each link avoids nested callbacks and preserves one error path.",
      ], [
        "ينفذ مكدس الاستدعاءات console.log A ويجدول callback الخاص بـ then؛ ثم يتابع فوراً إلى B قبل تفريغ طابور المهام الدقيقة.",
        "حالات pending وfulfilled وrejected متبادلة حصرياً؛ فالوعد الذي استقر لا يتغير، وهذا يثبت العقد لكل مستهلك.",
        "تحول then قيمة وتعيد دائماً وعداً جديداً؛ وإرجاع كل حلقة يمنع callbacks المتداخلة ويحافظ على مسار خطأ واحد.",
      ]),
      general: tr("Dans une recherche, démarre la requête, conserve la promesse comme travail en cours et ne transforme les résultats qu’après sa résolution.", "In search, start the request, keep the promise as pending work, and transform results only after it settles.", "في البحث ابدأ الطلب واحتفظ بالوعد كعمل جارٍ ولا تحول النتائج إلا بعد استقراره."),
      lecomax: tr("Dans L’ecomax, le catalogue venant de Supabase doit être attendu avant de calculer les catégories ou d’afficher les cartes produit.", "In L’ecomax, the Supabase catalog must be awaited before categories are computed or product cards are rendered.", "في L’ecomax يجب انتظار كتالوج Supabase قبل حساب الفئات أو عرض بطاقات المنتجات."),
      task: tr("Prédire puis vérifier l’ordre A, B, C et expliquer pourquoi C arrive après les deux logs synchrones.", "Predict and verify the A, B, C order, then explain why C appears after both synchronous logs.", "توقع ثم تحقق من ترتيب A وB وC واشرح لماذا تظهر C بعد سجلي التنفيذ المتزامن."),
      solutionTask: tr("Exécuter l’exemple et obtenir exactement A, B, puis C dans le terminal, puis expliquer le passage du callback de then par la file des microtâches.", "Run the example and obtain exactly A, B, then C in the terminal, then explain how the then callback passes through the microtask queue.", "شغّل المثال واحصل على A ثم B ثم C بالضبط في الطرفية، ثم اشرح مرور callback الخاص بـ then عبر طابور المهام الدقيقة."),
      expected: tr("Le terminal affiche d’abord « A: synchrone », ensuite « B: synchrone », puis « C: [ 'Sac', 'Robe' ] ». Le processus se termine avec le code 0.", "The terminal prints “A: synchrone” first, “B: synchrone” second, and “C: [ 'Sac', 'Robe' ]” last. The process exits with code 0.", "تعرض الطرفية أولاً «A: synchrone» ثم «B: synchrone» وأخيراً «C: [ 'Sac', 'Robe' ]»، وتنتهي العملية بالرمز 0."),
      next: tr("La prochaine leçon remplace les chaînes de promesses par async/await et centralise les erreurs.", "The next lesson replaces promise chains with async/await and centralizes failures.", "يستبدل الدرس التالي سلاسل الوعود بـ async/await ويجمع معالجة الأخطاء."),
    },
    {
      id: "async-await-try-catch", order: 1, language: "typescript", filename: "lib/products.ts",
      commands: ["npx tsc --noEmit", "npm run build"],
      source: [
        "async function loadNames(): Promise<string[]> {",
        "  try {",
        "    const products = await Promise.resolve([{ name: \"Sac\" }]);",
        "    return products.map((product) => product.name);",
        "  } catch (error: unknown) {",
        "    const message = error instanceof Error ? error.message : \"Erreur inconnue\";",
        "    throw new Error(`Catalogue indisponible: ${message}`);",
        "  }",
        "}",
        "void loadNames();",
      ].join("\n"),
      title: tr("async/await et try/catch", "async/await and try/catch", "async/await وtry/catch"),
      focus: tr("la lecture séquentielle d’un travail asynchrone", "sequential reading of asynchronous work", "قراءة العمل غير المتزامن بصورة تسلسلية"),
      mental: tr("async garantit que la fonction retourne une Promise, tandis que await extrait sa valeur réussie ou lance son rejet à la ligne courante. try/catch dessine alors une frontière où l’erreur technique peut devenir un message métier compréhensible.", "async guarantees that the function returns a Promise, while await extracts its fulfilled value or throws its rejection at the current line. try/catch then draws a boundary where a technical error can become an understandable domain message.", "تضمن async أن الدالة تعيد Promise، بينما تستخرج await قيمته الناجحة أو ترمي رفضه عند السطر الحالي. عندها يرسم try/catch حداً يمكن فيه تحويل الخطأ التقني إلى رسالة مجال مفهومة."),
      points: tr([
        "Une fonction async possède toujours un contrat Promise<T> ; préciser T documente la valeur que l’appelant doit attendre et empêche un retour accidentel incohérent.",
        "await ne bloque pas le navigateur : il suspend seulement cette fonction et rend le contrôle à la boucle d’événements jusqu’au règlement de la promesse.",
        "Un catch reçoit unknown parce que n’importe quelle valeur peut être lancée ; le narrowing instanceof Error protège l’accès à message avant d’ajouter le contexte catalogue.",
      ], [
        "An async function always has a Promise<T> contract; specifying T documents the value callers must await and prevents an inconsistent accidental return.",
        "await does not block the browser: it pauses only this function and returns control to the event loop until the promise settles.",
        "A catch receives unknown because any value may be thrown; instanceof Error narrowing protects message access before catalog context is added.",
      ], [
        "للدالة async دائماً عقد Promise<T>؛ وتحديد T يوثق القيمة التي يجب أن ينتظرها المستدعي ويمنع إرجاع قيمة غير متناسقة بالخطأ.",
        "لا تحجب await المتصفح؛ فهي توقف هذه الدالة فقط وتعيد التحكم إلى حلقة الأحداث حتى يستقر الوعد.",
        "يستقبل catch قيمة unknown لأن أي قيمة قد تُرمى؛ ويحمي narrowing عبر instanceof Error الوصول إلى message قبل إضافة سياق الكتالوج.",
      ]),
      general: tr("Encapsule chaque opération distante dans une fonction qui retourne des données utiles et enrichit les erreurs sans exposer de secret.", "Wrap each remote operation in a function that returns useful data and enriches errors without exposing secrets.", "غلّف كل عملية بعيدة في دالة تعيد بيانات مفيدة وتضيف سياقاً للأخطاء من دون كشف أسرار."),
      lecomax: tr("L’ecomax peut journaliser l’erreur Supabase côté serveur tout en retournant au composant un message catalogue stable et non sensible.", "L’ecomax can log the Supabase error on the server while returning a stable, non-sensitive catalog message to the component.", "يمكن لـ L’ecomax تسجيل خطأ Supabase على الخادم وإعادة رسالة كتالوج ثابتة وغير حساسة إلى المكوّن."),
      task: tr("Transformer une chaîne then/catch en async/await, typer son retour et conserver la cause utile.", "Convert a then/catch chain to async/await, type its return, and preserve the useful cause.", "حوّل سلسلة then/catch إلى async/await وحدد نوع الإرجاع واحتفظ بالسبب المفيد."),
      next: tr("La prochaine leçon applique ce flux à une vraie réponse HTTP avec fetch et JSON.", "The next lesson applies this flow to a real HTTP response with fetch and JSON.", "يطبق الدرس التالي هذا التدفق على استجابة HTTP حقيقية باستخدام fetch وJSON."),
    },
    {
      id: "fetch-http-json", order: 2, language: "typescript", filename: "lib/products.ts",
      commands: ["npm run dev", "curl.exe -i http://localhost:3000/api/products"],
      source: [
        "type Product = { id: string; name: string };",
        "export async function fetchProducts(): Promise<Product[]> {",
        "  const response = await fetch(\"/api/products\", { headers: { Accept: \"application/json\" } });",
        "  if (!response.ok) throw new Error(`HTTP ${response.status}`);",
        "  const body: unknown = await response.json();",
        "  if (!Array.isArray(body)) throw new Error(\"Format catalogue invalide\");",
        "  return body as Product[];",
        "}",
      ].join("\n"),
      title: tr("Fetch, HTTP et validation JSON", "Fetch, HTTP, and JSON validation", "Fetch وHTTP والتحقق من JSON"),
      focus: tr("le contrat d’une requête HTTP", "an HTTP request contract", "عقد طلب HTTP"),
      mental: tr("fetch ne livre pas directement les données : il retourne d’abord une Response avec un statut, des en-têtes et un flux de corps consommable une fois. Lire JSON est une seconde opération asynchrone et sa forme doit encore être validée.", "fetch does not deliver data directly: it first returns a Response with a status, headers, and a body stream that can be consumed once. Reading JSON is a second asynchronous operation, and its shape still needs validation.", "لا يقدم fetch البيانات مباشرة؛ بل يعيد أولاً Response فيها حالة وترويسات وتدفق جسم يمكن استهلاكه مرة واحدة. قراءة JSON عملية غير متزامنة ثانية، ولا يزال شكلها يحتاج إلى تحقق."),
      points: tr([
        "Une requête précise méthode, URL, en-têtes et éventuellement corps ; la réponse associe un statut à un format que le client doit négocier et contrôler.",
        "response.ok couvre les statuts 200–299 ; sans ce test, un JSON d’erreur 404 peut être interprété comme un catalogue valide et casser plus loin.",
        "JSON traverse le réseau sans types TypeScript : le lire dans unknown force une validation d’exécution avant de lui accorder le contrat Product[].",
      ], [
        "A request specifies method, URL, headers, and sometimes a body; the response combines a status with a format the client must negotiate and check.",
        "response.ok covers 200–299 statuses; without the check, a 404 error JSON may be treated as a valid catalog and fail much later.",
        "JSON crosses the network without TypeScript types: reading it as unknown forces runtime validation before granting the Product[] contract.",
      ], [
        "يحدد الطلب الطريقة وURL والترويسات وأحياناً الجسم؛ وتجمع الاستجابة حالة مع تنسيق يجب على العميل التفاوض عليه والتحقق منه.",
        "يغطي response.ok الحالات 200–299؛ ومن دونه قد يُعامل JSON لخطأ 404 ككتالوج صالح ويفشل لاحقاً.",
        "يعبر JSON الشبكة بلا أنواع TypeScript؛ وقراءته كـ unknown تفرض تحققاً وقت التشغيل قبل منحه عقد Product[].",
      ]),
      general: tr("Pour toute API, documente la méthode, l’URL, les statuts attendus et la forme JSON avant d’écrire l’appelant.", "For every API, document the method, URL, expected statuses, and JSON shape before writing the caller.", "لكل API وثق الطريقة وURL والحالات المتوقعة وشكل JSON قبل كتابة المستدعي."),
      lecomax: tr("La route produits de L’ecomax doit distinguer une liste vide valide d’un échec Supabase et retourner un statut cohérent pour chacun.", "The L’ecomax products route must distinguish a valid empty list from a Supabase failure and return a coherent status for each.", "يجب أن تميز route المنتجات في L’ecomax بين قائمة فارغة صالحة وفشل Supabase وأن تعيد حالة منسجمة لكل منهما."),
      task: tr("Appeler la route produits, vérifier status/content-type et refuser trois formes JSON invalides.", "Call the products route, check status/content-type, and reject three invalid JSON shapes.", "استدع route المنتجات وافحص status وcontent-type وارفض ثلاثة أشكال JSON غير صالحة."),
      next: tr("La prochaine leçon transforme les réponses en états loading, empty, error et success accessibles.", "The next lesson turns responses into accessible loading, empty, error, and success states.", "يحول الدرس التالي الاستجابات إلى حالات loading وempty وerror وsuccess ميسرة."),
    },
    {
      id: "resilient-remote-ui", order: 3, language: "tsx", filename: "app/boutique/page.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "type State = { status: \"loading\" } | { status: \"empty\" } |",
        "  { status: \"error\"; message: string } | { status: \"success\"; names: string[] };",
        "export function CatalogState({ state }: { state: State }) {",
        "  if (state.status === \"loading\") return <p aria-live=\"polite\">Chargement…</p>;",
        "  if (state.status === \"error\") return <p role=\"alert\">{state.message}</p>;",
        "  if (state.status === \"empty\") return <p>Aucun produit disponible.</p>;",
        "  return <ul>{state.names.map((name) => <li key={name}>{name}</li>)}</ul>;",
        "}",
      ].join("\n"),
      title: tr("Interfaces résilientes et annulation", "Resilient interfaces and cancellation", "واجهات مرنة وإلغاء الطلب"),
      focus: tr("les quatre états d’une donnée distante", "the four states of remote data", "الحالات الأربع للبيانات البعيدة"),
      mental: tr("Une donnée distante n’est jamais seulement une liste : avant son arrivée elle charge, après son arrivée elle peut être vide ou réussie, et à tout moment elle peut échouer. Une union discriminée rend ces états exclusifs et empêche d’afficher simultanément un spinner et une erreur.", "Remote data is never just a list: before arrival it is loading, after arrival it may be empty or successful, and it can fail at any time. A discriminated union makes those states exclusive and prevents showing a spinner and an error together.", "ليست البيانات البعيدة مجرد قائمة؛ فهي loading قبل الوصول، وقد تكون empty أو success بعده، ويمكن أن تفشل في أي وقت. يجعل الاتحاد المميز هذه الحالات حصرية ويمنع عرض مؤشر تحميل وخطأ معاً."),
      points: tr([
        "Un état loading annonce poliment l’attente, empty explique que la requête a réussi sans résultat, error donne une action de reprise et success rend les données stables.",
        "AbortController annule une requête devenue inutile lors d’une nouvelle recherche ou d’un démontage ; l’annulation n’est pas une erreur utilisateur à afficher.",
        "Un bouton Réessayer relance une fonction idempotente et restaure loading ; il ne recharge pas toute la page ni ne masque la cause dans les logs serveur.",
      ], [
        "A loading state politely announces waiting, empty explains a successful request without results, error offers recovery, and success renders stable data.",
        "AbortController cancels a request made obsolete by a new search or unmount; cancellation is not a user-facing failure.",
        "A Retry button reruns an idempotent function and restores loading; it does not reload the entire page or hide the cause from server logs.",
      ], [
        "تعلن حالة loading الانتظار بلطف، وتشرح empty نجاح الطلب بلا نتائج، وتقدم error إجراء استعادة، وتعرض success بيانات مستقرة.",
        "يلغي AbortController طلباً أصبح غير ضروري بسبب بحث جديد أو إزالة المكوّن؛ والإلغاء ليس خطأ يعرض للمستخدم.",
        "يعيد زر المحاولة تشغيل دالة idempotent ويرجع إلى loading؛ ولا يعيد تحميل الصفحة كلها أو يخفي السبب من سجلات الخادم.",
      ]),
      general: tr("Modélise explicitement les états avant d’écrire le JSX et teste-les avec une réponse lente, vide, invalide puis réussie.", "Model states explicitly before writing JSX, then test them with slow, empty, invalid, and successful responses.", "نمذج الحالات صراحة قبل كتابة JSX ثم اختبرها باستجابات بطيئة وفارغة وغير صالحة وناجحة."),
      lecomax: tr("Le catalogue L’ecomax garde sa structure pendant le chargement, explique l’absence de produits et propose Réessayer sans perdre les filtres.", "The L’ecomax catalog keeps its layout while loading, explains no products, and offers Retry without losing filters.", "يحافظ كتالوج L’ecomax على تخطيطه أثناء التحميل ويشرح غياب المنتجات ويقدم المحاولة من دون فقد المرشحات."),
      task: tr("Rendre les quatre états, simuler le mode hors ligne et ajouter une relance qui conserve la recherche.", "Render all four states, simulate offline mode, and add a retry that preserves the search.", "اعرض الحالات الأربع وحاك وضع عدم الاتصال وأضف إعادة محاولة تحفظ البحث."),
      next: tr("Le module suivant utilise TypeScript pour rendre impossibles les états incohérents que nous venons de modéliser.", "The next module uses TypeScript to make the inconsistent states we just modeled impossible.", "تستخدم الوحدة التالية TypeScript لجعل الحالات غير المتناسقة التي نمذجناها مستحيلة."),
    },
  ],
};

const typeScriptModule = {
  id: "typescript-contracts",
  order: 10,
  icon: "🔷",
  color: "#3178c6",
  files: [
    { path: "tsconfig.json", mode: "existing" },
    { path: "lib/products.ts", mode: "existing" },
    { path: "lib/supabase.ts", mode: "existing" },
    { path: "components/ProductCard.tsx", mode: "existing" },
  ],
  locales: {
    fr: { title: "TypeScript et contrats fiables", summary: "Décrire les données, réduire les unions, valider l’inconnu et partager des contrats précis entre UI, API et base." },
    en: { title: "TypeScript and reliable contracts", summary: "Describe data, narrow unions, validate unknown values, and share precise contracts across UI, API, and database." },
    ar: { title: "TypeScript والعقود الموثوقة", summary: "وصف البيانات وتضييق الاتحادات والتحقق من القيم المجهولة ومشاركة عقود دقيقة بين الواجهة وAPI والقاعدة." },
  },
  analogy: tr("un plan coté qui interdit d’assembler deux pièces incompatibles", "a dimensioned blueprint that prevents incompatible parts from being assembled", "مخطط ذي قياسات يمنع تركيب قطعتين غير متوافقتين"),
  vocabulary: {
    fr: [["union", "Type acceptant l’une de plusieurs formes définies."], ["narrowing", "Preuve de contrôle réduisant un type à une forme sûre."], ["generic", "Paramètre de type conservant une relation entre entrées et sorties."], ["unknown", "Valeur non fiable qui exige une vérification avant usage."]],
    en: [["union", "A type accepting one of several defined shapes."], ["narrowing", "A runtime proof that reduces a type to a safe shape."], ["generic", "A type parameter preserving a relationship between inputs and outputs."], ["unknown", "An untrusted value requiring a check before use."]],
    ar: [["union", "نوع يقبل شكلاً واحداً من عدة أشكال محددة."], ["narrowing", "دليل وقت التشغيل يضيق النوع إلى شكل آمن."], ["generic", "معامل نوع يحفظ العلاقة بين المدخلات والمخرجات."], ["unknown", "قيمة غير موثوقة تتطلب فحصاً قبل استخدامها."]],
  },
  errors: {
    fr: [["Une propriété manque seulement en production.", "Le code a forcé le type avec as ou any sans valider la donnée réseau.", "Lis la valeur comme unknown et ajoute un type guard qui prouve chaque champ requis."], ["TypeScript refuse une branche pourtant correcte.", "Le discriminant a été élargi en string ou muté.", "Utilise une union de littéraux et un switch exhaustif sur une propriété stable."]],
    en: [["A property is missing only in production.", "Code forced the type with as or any without validating network data.", "Read the value as unknown and add a type guard proving every required field."], ["TypeScript rejects an otherwise correct branch.", "The discriminant was widened to string or mutated.", "Use a literal union and an exhaustive switch over a stable property."]],
    ar: [["تغيب خاصية في الإنتاج فقط.", "فرضت الشيفرة النوع بـ as أو any من دون تحقق من بيانات الشبكة.", "اقرأ القيمة كـ unknown وأضف type guard يثبت كل حقل مطلوب."], ["يرفض TypeScript فرعاً صحيحاً.", "تم توسيع المميز إلى string أو تغييره.", "استخدم اتحاد literals وswitch شاملاً على خاصية ثابتة."]],
  },
  lessons: [
    {
      id: "ts-inference-primitives", order: 0, language: "typescript", filename: "lib/products.ts",
      commands: ["npx tsc --noEmit", "npm run build"],
      source: [
        "const storeName = \"L’ecomax\";",
        "let stock: number = 12;",
        "type Currency = \"EUR\" | \"USD\";",
        "const price = { amountCents: 12999, currency: \"EUR\" as const };",
        "function formatStock(value: number): string {",
        "  return value === 0 ? \"Rupture\" : `${value} disponible(s)`;",
        "}",
        "stock -= 1;",
        "console.log(storeName, price, formatStock(stock));",
      ].join("\n"),
      title: tr("Inférence, primitifs et littéraux", "Inference, primitives, and literals", "الاستدلال والأنواع الأولية وliterals"),
      focus: tr("les types les plus précis possibles", "the most precise possible types", "أدق أنواع ممكنة"),
      mental: tr("TypeScript analyse le code sans l’exécuter et construit un ensemble de valeurs autorisées pour chaque expression. const conserve souvent un littéral précis, tandis que let doit accepter les valeurs futures compatibles avec son annotation ou son inférence.", "TypeScript analyzes code without running it and builds a set of allowed values for every expression. const often preserves a precise literal, while let must accept future values compatible with its annotation or inference.", "يحلل TypeScript الشيفرة من دون تشغيلها ويبني مجموعة قيم مسموحة لكل تعبير. غالباً ما يحفظ const literal دقيقاً، بينما يجب أن يقبل let القيم المستقبلية المتوافقة مع توصيفه أو استدلاله."),
      points: tr([
        "string, number et boolean décrivent des ensembles larges ; les littéraux comme EUR | USD limitent un champ aux seules valeurs comprises par le domaine.",
        "L’inférence évite les annotations redondantes lorsque l’initialiseur constitue une preuve suffisante, mais les frontières de fonction gagnent à annoncer paramètres et retour.",
        "L’argent utilise des centimes entiers plutôt qu’un float afin que 0,1 + 0,2 et les arrondis de taxe ne créent pas de total incohérent.",
      ], [
        "string, number, and boolean describe broad sets; literals such as EUR | USD restrict a field to values understood by the domain.",
        "Inference avoids redundant annotations when the initializer is sufficient evidence, but function boundaries benefit from explicit parameters and return types.",
        "Money uses integer cents instead of a float so 0.1 + 0.2 and tax rounding cannot create inconsistent totals.",
      ], [
        "تصف string وnumber وboolean مجموعات واسعة؛ وتقيد literals مثل EUR | USD الحقل بالقيم التي يفهمها المجال فقط.",
        "يتجنب الاستدلال التوصيفات المكررة عندما تكون قيمة البدء دليلاً كافياً، لكن حدود الدوال تستفيد من إعلان المعاملات ونوع الإرجاع.",
        "تستخدم الأموال سنتات صحيحة بدلاً من float حتى لا تنشئ 0.1 + 0.2 وتقريبات الضريبة مجموعاً غير متناسق.",
      ]),
      general: tr("Modélise unités, statuts et identifiants avec des noms de domaine précis plutôt qu’avec des nombres ou chaînes anonymes.", "Model units, statuses, and identifiers with precise domain names instead of anonymous numbers or strings.", "نمذج الوحدات والحالات والمعرفات بأسماء مجال دقيقة بدلاً من أرقام أو سلاسل مجهولة."),
      lecomax: tr("L’ecomax représente prix, remise et livraison en centimes et limite la devise aux codes réellement supportés.", "L’ecomax represents price, discount, and shipping in cents and limits currency to supported codes.", "يمثل L’ecomax السعر والخصم والشحن بالسنتات ويقيد العملة بالرموز المدعومة فعلاً."),
      task: tr("Typer un prix, un stock et un statut produit, puis provoquer trois erreurs que TypeScript doit refuser.", "Type a price, stock, and product status, then provoke three errors TypeScript must reject.", "حدد أنواع السعر والمخزون وحالة المنتج ثم أنشئ ثلاثة أخطاء يجب أن يرفضها TypeScript."),
      next: tr("La prochaine leçon compose ces briques en objets, unions discriminées et états impossibles.", "The next lesson composes these pieces into objects, discriminated unions, and impossible states.", "يركب الدرس التالي هذه اللبنات في كائنات واتحادات مميزة وحالات مستحيلة."),
    },
    {
      id: "ts-objects-unions", order: 1, language: "typescript", filename: "lib/products.ts",
      commands: ["npx tsc --noEmit", "npm run build"],
      source: [
        "type Product = { id: string; name: string; stock: number };",
        "type CatalogState =",
        "  | { status: \"loading\" }",
        "  | { status: \"error\"; message: string }",
        "  | { status: \"success\"; products: Product[] };",
        "function count(state: CatalogState): number {",
        "  if (state.status !== \"success\") return 0;",
        "  return state.products.length;",
        "}",
      ].join("\n"),
      title: tr("Objets et unions discriminées", "Objects and discriminated unions", "الكائنات والاتحادات المميزة"),
      focus: tr("la modélisation des états possibles", "modeling possible states", "نمذجة الحالات الممكنة"),
      mental: tr("Un type objet rassemble les propriétés qui existent ensemble, tandis qu’une union décrit plusieurs formes exclusives. Une propriété discriminante comme status permet au contrôle de flux de choisir une forme et d’exclure automatiquement les champs impossibles.", "An object type groups properties that exist together, while a union describes several exclusive shapes. A discriminant such as status lets control flow select one shape and automatically exclude impossible fields.", "يجمع نوع الكائن الخصائص الموجودة معاً، بينما يصف الاتحاد عدة أشكال حصرية. تسمح خاصية مميزة مثل status لتدفق التحكم باختيار شكل واستبعاد الحقول المستحيلة تلقائياً."),
      points: tr([
        "Les propriétés optionnelles partout créent des combinaisons invalides ; trois objets d’union expriment mieux loading, error et success qu’un seul objet rempli de points d’interrogation.",
        "Après le test state.status !== success, TypeScript sait que products existe dans la branche restante sans assertion et protège tout refactoring futur.",
        "Un switch exhaustif associé à never signale à la compilation l’ajout d’un nouveau statut qui n’a pas encore de rendu ou de traitement.",
      ], [
        "Optional properties everywhere create invalid combinations; three union objects express loading, error, and success better than one object full of question marks.",
        "After checking state.status !== success, TypeScript knows products exists in the remaining branch without an assertion and protects future refactors.",
        "An exhaustive switch paired with never reports at compile time when a new status lacks rendering or handling.",
      ], [
        "تنشئ الخصائص الاختيارية في كل مكان تركيبات غير صالحة؛ وتعبر ثلاثة كائنات اتحاد عن loading وerror وsuccess أفضل من كائن مليء بعلامات الاستفهام.",
        "بعد فحص state.status !== success يعرف TypeScript أن products موجودة في الفرع المتبقي بلا assertion ويحمي إعادة الهيكلة مستقبلاً.",
        "يكشف switch شامل مع never وقت الترجمة إضافة حالة جديدة لا تملك عرضاً أو معالجة بعد.",
      ]),
      general: tr("Énumère d’abord les états métier mutuellement exclusifs, puis donne à chacun uniquement les données dont il a besoin.", "First list mutually exclusive domain states, then give each one only the data it needs.", "اسرد أولاً حالات المجال المتبادلة حصرياً ثم أعط كل حالة البيانات التي تحتاجها فقط."),
      lecomax: tr("Le catalogue L’ecomax ne peut plus avoir products et error simultanément ; le JSX suit directement le discriminant status.", "The L’ecomax catalog can no longer have products and error simultaneously; JSX follows the status discriminant directly.", "لا يمكن لكتالوج L’ecomax أن يملك products وerror في الوقت نفسه؛ ويتبع JSX المميز status مباشرة."),
      task: tr("Créer une union CheckoutState avec editing, submitting, paid et failed, puis écrire un rendu exhaustif.", "Create a CheckoutState union with editing, submitting, paid, and failed, then write exhaustive rendering.", "أنشئ اتحاد CheckoutState بحالات editing وsubmitting وpaid وfailed ثم اكتب عرضاً شاملاً."),
      next: tr("La prochaine leçon conserve les relations de types dans les fonctions génériques et valide unknown.", "The next lesson preserves type relationships in generic functions and validates unknown.", "يحفظ الدرس التالي علاقات الأنواع في الدوال العامة ويتحقق من unknown."),
    },
    {
      id: "ts-generics-unknown", order: 2, language: "typescript", filename: "lib/supabase.ts",
      commands: ["npx tsc --noEmit", "npm run build"],
      source: [
        "type Result<T> = { ok: true; data: T } | { ok: false; error: string };",
        "function isRecord(value: unknown): value is Record<string, unknown> {",
        "  return typeof value === \"object\" && value !== null;",
        "}",
        "function readName(value: unknown): Result<string> {",
        "  if (!isRecord(value) || typeof value.name !== \"string\")",
        "    return { ok: false, error: \"Nom manquant\" };",
        "  return { ok: true, data: value.name.trim() };",
        "}",
      ].join("\n"),
      title: tr("Génériques, unknown et type guards", "Generics, unknown, and type guards", "Generics وunknown وحراس النوع"),
      focus: tr("la validation d’une valeur non fiable", "validation of an untrusted value", "التحقق من قيمة غير موثوقة"),
      mental: tr("Un générique représente un type encore inconnu mais cohérent entre plusieurs positions, alors que unknown représente une valeur dont aucune propriété n’est encore prouvée. Le type guard relie une vérification JavaScript réelle à une information comprise par TypeScript.", "A generic represents a type not yet chosen but consistent across several positions, whereas unknown represents a value whose properties are not proven. A type guard connects a real JavaScript check to information TypeScript understands.", "يمثل generic نوعاً لم يُحدد بعد لكنه متناسق عبر عدة مواضع، بينما يمثل unknown قيمة لم تثبت أي خاصية لها. يربط type guard فحص JavaScript حقيقياً بمعلومة يفهمها TypeScript."),
      points: tr([
        "Result<T> conserve exactement le type de data dans la branche ok et interdit de lire data dans la branche erreur ; le générique décrit cette relation sans dupliquer le type.",
        "unknown accepte toute entrée réseau mais interdit name, map ou trim tant qu’un test runtime n’a pas démontré que ces opérations sont sûres.",
        "Un prédicat value is Record<string, unknown> doit effectuer une vraie preuve et rester petit ; une assertion as ne valide rien et peut seulement masquer le défaut.",
      ], [
        "Result<T> preserves the exact data type in the ok branch and forbids reading data in the error branch; the generic describes this relationship without duplicating a type.",
        "unknown accepts any network input but forbids name, map, or trim until a runtime check proves those operations safe.",
        "A value is Record<string, unknown> predicate must perform real proof and stay small; an as assertion validates nothing and can only hide a defect.",
      ], [
        "يحفظ Result<T> نوع data الدقيق في فرع ok ويمنع قراءتها في فرع الخطأ؛ ويصف generic هذه العلاقة من دون تكرار النوع.",
        "يقبل unknown أي مدخل شبكي لكنه يمنع name أو map أو trim حتى يثبت فحص وقت التشغيل أمان هذه العمليات.",
        "يجب أن ينفذ predicate من شكل value is Record<string, unknown> دليلاً حقيقياً وأن يبقى صغيراً؛ أما assertion بـ as فلا يتحقق من شيء وقد يخفي العيب فقط.",
      ]),
      general: tr("Traite JSON, request bodies et stockage navigateur comme unknown, puis transforme-les en résultats typés ou erreurs descriptives.", "Treat JSON, request bodies, and browser storage as unknown, then transform them into typed results or descriptive errors.", "عامل JSON وأجسام الطلب وتخزين المتصفح كـ unknown ثم حولها إلى نتائج محددة النوع أو أخطاء وصفية."),
      lecomax: tr("Les réponses Supabase et les bodies des routes L’ecomax sont vérifiés avant de devenir Product, Order ou Profile.", "Supabase responses and L’ecomax route bodies are checked before becoming Product, Order, or Profile.", "تُفحص استجابات Supabase وأجسام routes في L’ecomax قبل أن تصبح Product أو Order أو Profile."),
      task: tr("Écrire isProduct pour vérifier id, name, price_cents et images sans utiliser any ni assertion globale.", "Write isProduct to check id, name, price_cents, and images without any or a global assertion.", "اكتب isProduct لفحص id وname وprice_cents وimages من دون any أو assertion شامل."),
      next: tr("La prochaine leçon partage ces contrats entre props React, événements et réponses API.", "The next lesson shares these contracts across React props, events, and API responses.", "يشارك الدرس التالي هذه العقود بين props في React والأحداث واستجابات API."),
    },
    {
      id: "ts-react-api-contracts", order: 3, language: "tsx", filename: "components/ProductCard.tsx",
      commands: ["npx tsc --noEmit", "npm run dev", "npm run build"],
      source: [
        "type ProductCardProps = { id: string; name: string; priceCents: number; onAdd(id: string): void };",
        "export function TypedProductCard({ id, name, priceCents, onAdd }: ProductCardProps) {",
        "  const price = new Intl.NumberFormat(\"fr-FR\", { style: \"currency\", currency: \"EUR\" })",
        "    .format(priceCents / 100);",
        "  const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {",
        "    event.preventDefault();",
        "    onAdd(id);",
        "  };",
        "  return <article><h2>{name}</h2><p>{price}</p><button onClick={handleAdd}>Ajouter</button></article>;",
        "}",
      ].join("\n"),
      title: tr("Contrats React et API", "React and API contracts", "عقود React وAPI"),
      focus: tr("les types aux frontières de composants", "types at component boundaries", "الأنواع عند حدود المكونات"),
      mental: tr("Les props forment l’API publique d’un composant : leur type décide ce que le parent peut fournir et ce que l’enfant peut supposer. Les événements ont leurs propres types DOM, tandis que les données réseau doivent être validées avant d’atteindre cette frontière fiable.", "Props form a component’s public API: their type decides what a parent may provide and what the child may assume. Events have their own DOM types, while network data must be validated before reaching this trusted boundary.", "تشكل props الواجهة العامة للمكوّن؛ فيقرر نوعها ما يستطيع الأب تمريره وما يستطيع الابن افتراضه. للأحداث أنواع DOM خاصة، بينما يجب التحقق من بيانات الشبكة قبل وصولها إلى هذا الحد الموثوق."),
      points: tr([
        "Un type Props minimal réduit le couplage : ProductCard reçoit les champs affichés et un callback métier, pas l’objet base de données complet ni un client Supabase.",
        "React.MouseEvent<HTMLButtonElement> décrit currentTarget correctement ; annoter l’élément évite les casts lors de l’accès aux attributs et méthodes du bouton.",
        "Le callback onAdd(id) fait remonter l’intention sans donner au composant la responsabilité du panier, ce qui rend la carte réutilisable et testable.",
      ], [
        "A minimal Props type reduces coupling: ProductCard receives displayed fields and a domain callback, not the whole database row or a Supabase client.",
        "React.MouseEvent<HTMLButtonElement> describes currentTarget correctly; annotating the element avoids casts when accessing button attributes and methods.",
        "The onAdd(id) callback raises intent without making the component responsible for the cart, keeping the card reusable and testable.",
      ], [
        "يقلل نوع Props الأدنى الترابط؛ فتستقبل ProductCard الحقول المعروضة وcallback للمجال، لا سجل قاعدة البيانات كاملاً ولا عميل Supabase.",
        "يصف React.MouseEvent<HTMLButtonElement> قيمة currentTarget بدقة؛ ويمنع تحديد العنصر الحاجة إلى casts عند الوصول لخصائص الزر وأساليبه.",
        "يرفع callback ‏onAdd(id) النية من دون تحميل المكوّن مسؤولية السلة، فيبقى قابلاً لإعادة الاستخدام والاختبار.",
      ]),
      general: tr("Définis un contrat de props étroit, type les événements à leur élément et adapte les données externes avant le rendu.", "Define a narrow props contract, type events to their element, and adapt external data before rendering.", "حدد عقد props ضيقاً واربط نوع الحدث بعنصره وكيف البيانات الخارجية قبل العرض."),
      lecomax: tr("ProductCard de L’ecomax reçoit un modèle de vue stable ; un changement de colonne Supabase ne doit pas réécrire toute l’interface.", "L’ecomax ProductCard receives a stable view model; a Supabase column change must not rewrite the entire interface.", "تستقبل ProductCard في L’ecomax نموذج عرض ثابتاً؛ ولا ينبغي لتغيير عمود Supabase أن يعيد كتابة الواجهة كلها."),
      task: tr("Créer des props minimales pour ProductCard et typer les callbacks de favori et d’ajout au panier.", "Create minimal ProductCard props and type wishlist and add-to-cart callbacks.", "أنشئ props دنيا لـ ProductCard وحدد أنواع callbacks للمفضلة والإضافة إلى السلة."),
      next: tr("Le module suivant utilise ces contrats pour construire des composants React purs et composables.", "The next module uses these contracts to build pure, composable React components.", "تستخدم الوحدة التالية هذه العقود لبناء مكونات React نقية وقابلة للتركيب."),
    },
  ],
};

const reactFundamentalsModule = {
  id: "react-fundamentals",
  order: 11,
  icon: "⚛️",
  color: "#61dafb",
  files: [
    { path: "components/ProductCard.tsx", mode: "existing" },
    { path: "components/Header.tsx", mode: "existing" },
    { path: "components/ProductActions.tsx", mode: "existing" },
  ],
  locales: {
    fr: { title: "React fondamental", summary: "Construire une interface comme un arbre de composants purs, faire circuler les props et rendre listes, conditions et événements correctement." },
    en: { title: "React fundamentals", summary: "Build an interface as a tree of pure components, pass props, and render lists, conditions, and events correctly." },
    ar: { title: "أساسيات React", summary: "بناء الواجهة كشجرة من المكونات النقية وتمرير props وعرض القوائم والشروط والأحداث بصورة صحيحة." },
  },
  analogy: tr("un jeu de briques où chaque pièce reçoit des mesures et produit toujours la même forme", "a building-block set where each piece receives measurements and always produces the same shape", "مجموعة مكعبات تستقبل فيها كل قطعة قياسات وتنتج الشكل نفسه دائماً"),
  vocabulary: {
    fr: [["composant", "Fonction React nommée avec une majuscule qui retourne une description d’interface."], ["props", "Entrées en lecture seule transmises par le parent."], ["JSX", "Syntaxe transformée en appels React décrivant l’arbre à rendre."], ["key", "Identité stable permettant à React de suivre un élément de liste."]],
    en: [["component", "A capitalized React function returning an interface description."], ["props", "Read-only inputs passed by a parent."], ["JSX", "Syntax transformed into React calls that describe the rendered tree."], ["key", "A stable identity allowing React to track a list item."]],
    ar: [["component", "دالة React يبدأ اسمها بحرف كبير وتعيد وصفاً للواجهة."], ["props", "مدخلات للقراءة فقط يمررها المكوّن الأب."], ["JSX", "صياغة تتحول إلى استدعاءات React تصف شجرة العرض."], ["key", "هوية ثابتة تسمح لـ React بتتبع عنصر القائمة."]],
  },
  errors: {
    fr: [["Un composant ne s’affiche pas ou est traité comme une balise HTML.", "Son nom commence par une minuscule ou il ne retourne aucun JSX.", "Nomme-le avec une majuscule et vérifie chaque branche de return."], ["La mauvaise carte conserve un état après un tri.", "La liste utilise l’index comme key, donc l’identité change avec l’ordre.", "Utilise l’identifiant produit stable fourni par les données."]],
    en: [["A component does not render or is treated as an HTML tag.", "Its name starts lowercase or it returns no JSX.", "Capitalize its name and verify every return branch."], ["The wrong card preserves state after sorting.", "The list uses the index as key, so identity changes with order.", "Use the stable product identifier from the data."]],
    ar: [["لا يظهر المكوّن أو يعامل كوسم HTML.", "يبدأ اسمه بحرف صغير أو لا يعيد JSX.", "ابدأ اسمه بحرف كبير وافحص كل فرع return."], ["تحتفظ البطاقة الخطأ بالحالة بعد الفرز.", "تستخدم القائمة الفهرس كـ key فتتغير الهوية مع الترتيب.", "استخدم معرف المنتج الثابت القادم من البيانات."]],
  },
  lessons: [
    {
      id: "react-jsx-components", order: 0, language: "tsx", filename: "components/ProductCard.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "type PriceProps = { amountCents: number };",
        "function Price({ amountCents }: PriceProps) {",
        "  return <strong>{(amountCents / 100).toFixed(2)} €</strong>;",
        "}",
        "export function MiniProductCard() {",
        "  const name = \"Sac L’ecomax\";",
        "  return <article><h2>{name}</h2><Price amountCents={4990} /></article>;",
        "}",
      ].join("\n"),
      title: tr("JSX et composants purs", "JSX and pure components", "JSX والمكونات النقية"),
      focus: tr("le rendu déterministe d’un composant", "deterministic component rendering", "العرض الحتمي للمكوّن"),
      mental: tr("React appelle une fonction composant pour obtenir une description JSX, compare cette description à la précédente puis applique le minimum de changements au DOM. Le rendu doit donc rester un calcul pur : mêmes props, même description, sans écriture externe pendant l’appel.", "React calls a component function to obtain a JSX description, compares it with the previous description, and applies minimal DOM changes. Rendering must remain a pure calculation: same props, same description, with no external writes during the call.", "يستدعي React دالة المكوّن للحصول على وصف JSX ثم يقارنه بالوصف السابق ويطبق أقل تغييرات على DOM. لذلك يجب أن يبقى العرض حساباً نقياً: props نفسها تعطي الوصف نفسه من دون كتابة خارجية أثناء الاستدعاء."),
      points: tr([
        "JSX autorise les expressions JavaScript entre accolades mais exige des éléments et attributs valides ; className et htmlFor correspondent aux propriétés DOM de React.",
        "Un composant isole une responsabilité visuelle et porte un nom métier ; Price explique mieux l’intention qu’une fonction générique renderThing.",
        "Le corps de rendu ne déclenche ni fetch impératif, ni localStorage, ni mutation globale : ces effets produiraient des résultats différents lors des rendus répétés de développement.",
      ], [
        "JSX accepts JavaScript expressions inside braces but requires valid elements and attributes; className and htmlFor correspond to React DOM properties.",
        "A component isolates one visual responsibility and uses a domain name; Price explains intent better than a generic renderThing function.",
        "The render body performs no imperative fetch, localStorage write, or global mutation because repeated development renders would then produce different results.",
      ], [
        "يسمح JSX بتعبيرات JavaScript بين الأقواس لكنه يتطلب عناصر وخصائص صالحة؛ ويقابل className وhtmlFor خصائص DOM في React.",
        "يعزل المكوّن مسؤولية بصرية واحدة ويحمل اسم مجال؛ فيشرح Price النية أفضل من دالة عامة اسمها renderThing.",
        "لا ينفذ جسم العرض fetch أمراً ولا كتابة localStorage ولا تغييراً عاماً، لأن تكرار العرض في التطوير سيعطي عندها نتائج مختلفة.",
      ]),
      general: tr("Découpe une maquette en composants nommés d’après leur rôle, puis garde chaque rendu comme une transformation de props vers JSX.", "Split a mockup into components named after their role, then keep every render as a props-to-JSX transformation.", "قسّم التصميم إلى مكونات مسماة حسب دورها وأبق كل عرض تحويلاً من props إلى JSX."),
      lecomax: tr("L’ecomax sépare ProductCard, Price, badge de stock et actions afin que chaque règle visuelle reste locale et testable.", "L’ecomax separates ProductCard, Price, stock badge, and actions so each visual rule stays local and testable.", "يفصل L’ecomax بين ProductCard وPrice وشارة المخزون والإجراءات حتى تبقى كل قاعدة بصرية محلية وقابلة للاختبار."),
      task: tr("Découper une carte produit statique en ProductImage, ProductInfo et Price sans ajouter de state.", "Split a static product card into ProductImage, ProductInfo, and Price without adding state.", "قسّم بطاقة منتج ثابتة إلى ProductImage وProductInfo وPrice من دون إضافة state."),
      next: tr("La prochaine leçon remplace les valeurs fixes par des props et compose les variantes avec children.", "The next lesson replaces fixed values with props and composes variants with children.", "يستبدل الدرس التالي القيم الثابتة بـ props ويركب المتغيرات باستخدام children."),
    },
    {
      id: "react-props-composition", order: 1, language: "tsx", filename: "components/ProductCard.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "type CardProps = { title: string; children: React.ReactNode; badge?: string };",
        "function Card({ title, children, badge }: CardProps) {",
        "  return <article aria-labelledby={`card-${title}`}>",
        "    {badge ? <span>{badge}</span> : null}",
        "    <h2 id={`card-${title}`}>{title}</h2>",
        "    {children}",
        "  </article>;",
        "}",
        "export function Example() { return <Card title=\"Robe\" badge=\"Nouveau\"><p>59,90 €</p></Card>; }",
      ].join("\n"),
      title: tr("Props, children et composition", "Props, children, and composition", "Props وchildren والتركيب"),
      focus: tr("la composition de composants réutilisables", "composition of reusable components", "تركيب المكونات القابلة لإعادة الاستخدام"),
      mental: tr("Les données descendent du parent vers l’enfant par des props immuables, tandis que children réserve une zone où le parent compose du contenu. Cette inversion évite un composant géant rempli d’options booléennes et garde la structure commune explicite.", "Data flows from parent to child through immutable props, while children reserves a slot where the parent composes content. This inversion avoids a giant component full of boolean options and keeps shared structure explicit.", "تتدفق البيانات من الأب إلى الابن عبر props غير قابلة للتغيير، بينما يحجز children موضعاً يركب فيه الأب المحتوى. يمنع هذا القلب مكوّناً ضخماً مليئاً بخيارات منطقية ويحافظ على البنية المشتركة صريحة."),
      points: tr([
        "Les props sont un contrat en lecture seule : l’enfant demande title et badge mais ne modifie jamais l’objet du parent pour provoquer un rendu.",
        "Une prop optionnelle se traduit par une décision de rendu claire ; badge absent rend null plutôt qu’un élément vide inutile pour le DOM et l’accessibilité.",
        "children permet d’insérer prix, actions ou informations sans apprendre à Card tous les besoins futurs, ce qui favorise la composition plutôt que la configuration infinie.",
      ], [
        "Props are a read-only contract: the child requests title and badge but never mutates the parent object to trigger rendering.",
        "An optional prop becomes a clear rendering decision; an absent badge returns null instead of an empty DOM element.",
        "children inserts price, actions, or information without teaching Card every future need, favoring composition over endless configuration.",
      ], [
        "props عقد للقراءة فقط؛ يطلب الابن title وbadge لكنه لا يغير كائن الأب لإحداث العرض.",
        "تتحول prop الاختيارية إلى قرار عرض واضح؛ ويعيد غياب badge قيمة null بدلاً من عنصر DOM فارغ.",
        "يدخل children السعر أو الإجراءات أو المعلومات من دون تعليم Card كل حاجة مستقبلية، فيفضل التركيب على الإعدادات غير المنتهية.",
      ]),
      general: tr("Cherche la structure stable, expose les données variables comme props et les régions libres comme children.", "Find the stable structure, expose changing data as props, and expose free regions as children.", "ابحث عن البنية الثابتة واعرض البيانات المتغيرة كـ props والمناطق الحرة كـ children."),
      lecomax: tr("Une carte L’ecomax partage bordure et titre, tandis que badges promotionnels et boutons sont composés selon la page catalogue ou admin.", "An L’ecomax card shares its border and title while promotion badges and buttons are composed for catalog or admin pages.", "تشترك بطاقة L’ecomax في الحدود والعنوان بينما تُركب شارات الترويج والأزرار حسب صفحة الكتالوج أو الإدارة."),
      task: tr("Créer un composant Panel accessible et composer deux contenus différents sans prop showProducts.", "Create an accessible Panel and compose two different contents without a showProducts prop.", "أنشئ Panel ميسراً وركب محتويين مختلفين من دون prop اسمها showProducts."),
      next: tr("La prochaine leçon rend des collections avec des keys stables et des branches conditionnelles lisibles.", "The next lesson renders collections with stable keys and readable conditional branches.", "يعرض الدرس التالي المجموعات بمفاتيح ثابتة وفروع شرطية مقروءة."),
    },
    {
      id: "react-lists-conditions", order: 2, language: "tsx", filename: "components/ProductCard.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "type Item = { id: string; name: string; active: boolean };",
        "const items: Item[] = [{ id: \"bag-1\", name: \"Sac\", active: true }];",
        "export function ProductList() {",
        "  const active = items.filter((item) => item.active);",
        "  if (active.length === 0) return <p>Aucun produit.</p>;",
        "  return <ul>{active.map((item) =>",
        "    <li key={item.id}>{item.name}</li>",
        "  )}</ul>;",
        "}",
      ].join("\n"),
      title: tr("Listes, keys et rendu conditionnel", "Lists, keys, and conditional rendering", "القوائم وkeys والعرض الشرطي"),
      focus: tr("l’identité stable des éléments rendus", "stable identity of rendered items", "الهوية الثابتة للعناصر المعروضة"),
      mental: tr("React compare les enfants d’une liste entre deux rendus et utilise key comme identité, pas comme position visuelle. Une branche conditionnelle choisit l’arbre à décrire ; elle doit refléter l’état métier plutôt que masquer des éléments incohérents en CSS.", "React compares list children across renders and uses key as identity, not visual position. Conditional rendering selects the tree to describe and should reflect domain state rather than hiding inconsistent elements with CSS.", "يقارن React أبناء القائمة بين العروض ويستخدم key كهوية لا كموضع بصري. يختار العرض الشرطي الشجرة الموصوفة ويجب أن يعكس حالة المجال بدلاً من إخفاء عناصر غير متناسقة بـ CSS."),
      points: tr([
        "map produit un élément React par donnée et key doit provenir d’un identifiant persistant ; l’index échoue lors d’un tri, ajout ou retrait au milieu.",
        "filter prépare une collection claire avant JSX ; mélanger plusieurs ternaires dans map rend les cas vide, masqué et indisponible difficiles à vérifier.",
        "Un early return pour la liste vide élimine une branche imbriquée et offre un message spécifique plutôt qu’une zone blanche ambiguë.",
      ], [
        "map produces one React element per datum and key must come from a persistent identifier; an index fails on sorting, insertion, or middle removal.",
        "filter prepares a clear collection before JSX; mixing several ternaries inside map makes empty, hidden, and unavailable cases hard to verify.",
        "An early return for the empty list removes a nested branch and provides a specific message instead of an ambiguous blank area.",
      ], [
        "ينتج map عنصر React لكل بيان ويجب أن تأتي key من معرف دائم؛ ويفشل الفهرس عند الفرز أو الإضافة أو الحذف من الوسط.",
        "يجهز filter مجموعة واضحة قبل JSX؛ ويجعل خلط عدة ternaries داخل map حالات الفراغ والإخفاء وعدم التوفر صعبة الفحص.",
        "يزيل early return للقائمة الفارغة فرعاً متداخلاً ويعطي رسالة محددة بدلاً من مساحة بيضاء غامضة.",
      ]),
      general: tr("Transforme et filtre les données avant le JSX, rends un état vide dédié et tire key d’une identité métier durable.", "Transform and filter data before JSX, render a dedicated empty state, and derive key from durable domain identity.", "حوّل البيانات ورشحها قبل JSX واعرض حالة فراغ مخصصة واستخرج key من هوية مجال دائمة."),
      lecomax: tr("Les cartes produit L’ecomax utilisent product.id ou slug stable ; le changement de filtre ne déplace jamais l’état d’une carte vers une autre.", "L’ecomax product cards use stable product.id or slug; changing filters never moves one card’s state to another.", "تستخدم بطاقات L’ecomax قيمة product.id أو slug ثابتة؛ ولا ينقل تغيير المرشح حالة بطاقة إلى أخرى."),
      task: tr("Rendre produits actifs, promotionnels et épuisés avec une key stable et un état vide explicite.", "Render active, promotional, and sold-out products with stable keys and an explicit empty state.", "اعرض المنتجات النشطة والترويجية والنافدة بمفاتيح ثابتة وحالة فراغ صريحة."),
      next: tr("La prochaine leçon relie les intentions utilisateur au parent avec des événements et callbacks.", "The next lesson connects user intent to the parent through events and callbacks.", "يربط الدرس التالي نية المستخدم بالأب عبر الأحداث وcallbacks."),
    },
    {
      id: "react-events-data-flow", order: 3, language: "tsx", filename: "components/ProductActions.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "type ActionsProps = { productId: string; disabled: boolean; onAdd(id: string): void };",
        "export function ProductActions({ productId, disabled, onAdd }: ActionsProps) {",
        "  const handleClick = () => onAdd(productId);",
        "  return <button type=\"button\" disabled={disabled} onClick={handleClick}",
        "    aria-label=\"Ajouter ce produit au panier\">",
        "    {disabled ? \"Indisponible\" : \"Ajouter\"}",
        "  </button>;",
        "}",
      ].join("\n"),
      title: tr("Événements et flux de données", "Events and data flow", "الأحداث وتدفق البيانات"),
      focus: tr("la remontée d’une intention utilisateur", "raising user intent", "رفع نية المستخدم"),
      mental: tr("Les données descendent par props et les intentions remontent par callbacks. Le composant bouton connaît le clic et l’identifiant, mais le parent qui possède le panier décide comment cette intention modifie l’application.", "Data moves down through props and intent moves up through callbacks. The button component knows the click and identifier, but the parent that owns the cart decides how that intent changes the application.", "تنزل البيانات عبر props وتصعد النية عبر callbacks. يعرف مكوّن الزر النقرة والمعرف، لكن الأب الذي يملك السلة يقرر كيف تغير النية التطبيق."),
      points: tr([
        "onClick reçoit une fonction à appeler plus tard ; écrire onClick={onAdd(productId)} exécute l’action pendant le rendu et passe son résultat au lieu du callback.",
        "Un nom handleClick décrit l’événement local, tandis que onAdd décrit l’intention métier envoyée au parent ; cette distinction clarifie la responsabilité.",
        "disabled empêche réellement l’activation clavier et souris ; le texte explique l’état au lieu de compter uniquement sur une couleur grise.",
      ], [
        "onClick receives a function to call later; writing onClick={onAdd(productId)} executes during render and passes its result instead of a callback.",
        "handleClick names the local event while onAdd names the domain intent sent to the parent; the distinction clarifies responsibility.",
        "disabled truly prevents keyboard and pointer activation; text explains the state instead of relying only on gray color.",
      ], [
        "يستقبل onClick دالة لاستدعائها لاحقاً؛ وكتابة onClick={onAdd(productId)} تنفذ الإجراء أثناء العرض وتمرر نتيجته بدلاً من callback.",
        "يسمي handleClick الحدث المحلي بينما يسمي onAdd نية المجال المرسلة إلى الأب؛ ويوضح هذا الفرق المسؤولية.",
        "تمنع disabled التنشيط فعلاً بلوحة المفاتيح والمؤشر؛ ويشرح النص الحالة بدلاً من الاعتماد على اللون الرمادي فقط.",
      ]),
      general: tr("Fais remonter une intention minimale et laisse le propriétaire de l’état choisir la mutation, la requête et le message.", "Raise a minimal intent and let the state owner choose the mutation, request, and message.", "ارفع نية دنيا ودع مالك الحالة يختار التغيير والطلب والرسالة."),
      lecomax: tr("ProductActions signale onAdd(productId), tandis que CartContext vérifie quantité et stock puis affiche le retour utilisateur.", "ProductActions emits onAdd(productId), while CartContext verifies quantity and stock and then provides user feedback.", "ترسل ProductActions ‏onAdd(productId)، بينما يتحقق CartContext من الكمية والمخزون ثم يعرض التغذية الراجعة."),
      task: tr("Relier une carte à un parent qui compte les ajouts, avec bouton désactivé et annonce accessible.", "Connect a card to a parent that counts additions, with a disabled button and accessible announcement.", "اربط بطاقة بأب يحسب الإضافات مع زر معطل وإعلان ميسر."),
      next: tr("Le module suivant place ces intentions dans state et aborde formulaires, effets, Context et hooks.", "The next module puts these intents into state and covers forms, effects, Context, and hooks.", "تضع الوحدة التالية هذه النوايا في state وتتناول النماذج والتأثيرات وContext وhooks."),
    },
  ],
};

const reactStateModule = {
  id: "react-state-forms-hooks",
  order: 12,
  icon: "🪝",
  color: "#0891b2",
  files: [
    { path: "components/CartContext.tsx", mode: "existing" },
    { path: "components/CategoryFilters.tsx", mode: "existing" },
    { path: "components/ProductActions.tsx", mode: "existing" },
  ],
  locales: {
    fr: { title: "State, formulaires, effets et hooks", summary: "Placer l’état au bon niveau, contrôler les formulaires, synchroniser les systèmes externes et partager le panier sans effets inutiles." },
    en: { title: "State, forms, effects, and hooks", summary: "Place state at the right level, control forms, synchronize external systems, and share the cart without unnecessary effects." },
    ar: { title: "State والنماذج والتأثيرات وhooks", summary: "وضع الحالة في المستوى الصحيح والتحكم بالنماذج ومزامنة الأنظمة الخارجية ومشاركة السلة بلا تأثيرات غير ضرورية." },
  },
  analogy: tr("un tableau de bord dont une seule aiguille possède la vérité et dont les autres affichages sont calculés", "a dashboard where one gauge owns the truth and every other display is calculated", "لوحة قيادة يملك فيها مؤشر واحد الحقيقة وتُحسب منها بقية العروض"),
  vocabulary: {
    fr: [["state", "Mémoire locale d’un composant qui déclenche un nouveau rendu."], ["controlled input", "Champ dont value et onChange sont pilotés par React."], ["effect", "Synchronisation après rendu avec un système extérieur à React."], ["Context", "Canal fournissant une valeur partagée à un sous-arbre."]],
    en: [["state", "Local component memory that triggers another render."], ["controlled input", "An input whose value and onChange are driven by React."], ["effect", "Post-render synchronization with a system outside React."], ["Context", "A channel providing a shared value to a subtree."]],
    ar: [["state", "ذاكرة محلية للمكوّن تطلق عرضاً جديداً."], ["controlled input", "حقل تقوده React عبر value وonChange."], ["effect", "مزامنة بعد العرض مع نظام خارج React."], ["Context", "قناة توفر قيمة مشتركة لشجرة فرعية."]],
  },
  errors: {
    fr: [["Un clic perd une mise à jour de quantité.", "La nouvelle valeur utilise un snapshot ancien avec setQuantity(quantity + 1).", "Utilise la mise à jour fonctionnelle setQuantity(q => q + 1)."], ["Un effet boucle indéfiniment.", "Il modifie une dépendance à chaque exécution ou recrée un objet instable.", "Retire l’état dérivé, stabilise la vraie dépendance et garde l’effet pour le système externe."]],
    en: [["A click loses a quantity update.", "The new value uses an old snapshot through setQuantity(quantity + 1).", "Use the functional update setQuantity(q => q + 1)."], ["An effect loops forever.", "It changes a dependency on every run or recreates an unstable object.", "Remove derived state, stabilize the real dependency, and reserve the effect for an external system."]],
    ar: [["تفقد نقرة تحديثاً للكمية.", "تستخدم القيمة الجديدة snapshot قديمة عبر setQuantity(quantity + 1).", "استخدم التحديث الوظيفي setQuantity(q => q + 1)."], ["يدور effect بلا نهاية.", "يغير dependency في كل تشغيل أو يعيد إنشاء كائن غير ثابت.", "احذف الحالة المشتقة وثبت dependency الحقيقية واحتفظ بـ effect للنظام الخارجي."]],
  },
  lessons: [
    {
      id: "react-state-immutability", order: 0, language: "tsx", filename: "components/CartContext.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "import { useState } from \"react\";",
        "type Item = { id: string; quantity: number };",
        "export function QuantityDemo() {",
        "  const [items, setItems] = useState<Item[]>([{ id: \"bag-1\", quantity: 1 }]);",
        "  const increment = (id: string) => setItems((current) => current.map((item) =>",
        "    item.id === id ? { ...item, quantity: item.quantity + 1 } : item",
        "  ));",
        "  return <button onClick={() => increment(\"bag-1\")}>{items[0].quantity}</button>;",
        "}",
      ].join("\n"),
      title: tr("State minimal et immutabilité", "Minimal state and immutability", "الحالة الدنيا وعدم التغيير"),
      focus: tr("la mise à jour immuable d’un état", "immutable state updates", "تحديث الحالة بلا تغيير مباشر"),
      mental: tr("Chaque rendu reçoit un snapshot immuable de state ; appeler le setter demande à React un nouveau rendu avec une nouvelle valeur. Il faut créer les objets modifiés et réutiliser les autres afin que les références indiquent précisément ce qui a changé.", "Each render receives an immutable state snapshot; calling the setter asks React for a new render with a new value. Modified objects must be recreated while unchanged ones are reused so references precisely identify changes.", "يتلقى كل عرض snapshot غير قابلة للتغيير من state؛ ويطلب استدعاء setter عرضاً جديداً بقيمة جديدة. يجب إنشاء الكائنات المعدلة من جديد وإعادة استخدام البقية حتى تشير المراجع بدقة إلى ما تغير."),
      points: tr([
        "Le state minimal contient seulement les informations qui changent et ne se calculent pas depuis props ou un autre state ; total et nombre d’articles sont des valeurs dérivées.",
        "map construit un nouveau tableau et spread un nouvel objet uniquement pour la ligne ciblée ; modifier item.quantity directement conserve une référence trompeuse.",
        "Le setter fonctionnel reçoit le snapshot le plus récent, ce qui protège plusieurs clics rapprochés et les mises à jour regroupées par React.",
      ], [
        "Minimal state contains only information that changes and cannot be computed from props or other state; totals and item counts are derived values.",
        "map creates a new array and spread creates a new object only for the targeted row; mutating item.quantity preserves a misleading reference.",
        "The functional setter receives the latest snapshot, protecting rapid clicks and updates batched by React.",
      ], [
        "تحتوي الحالة الدنيا المعلومات التي تتغير ولا يمكن حسابها من props أو state أخرى؛ فالمجموع وعدد العناصر قيم مشتقة.",
        "ينشئ map مصفوفة جديدة وينشئ spread كائناً جديداً للسطر المستهدف فقط؛ أما تغيير item.quantity مباشرة فيحفظ مرجعاً مضللاً.",
        "يستقبل setter الوظيفي أحدث snapshot، فيحمي النقرات السريعة والتحديثات التي تجمعها React.",
      ]),
      general: tr("Choisis une seule source de vérité, calcule le reste pendant le rendu et mets à jour tableaux et objets avec des copies sélectives.", "Choose one source of truth, calculate the rest during render, and update arrays and objects with selective copies.", "اختر مصدراً واحداً للحقيقة واحسب الباقي أثناء العرض وحدّث المصفوفات والكائنات بنسخ انتقائية."),
      lecomax: tr("CartContext conserve lignes et quantités ; sous-total, réduction et nombre d’articles sont recalculés sans state dupliqué.", "CartContext stores lines and quantities; subtotal, discount, and item count are recalculated without duplicated state.", "يحفظ CartContext الأسطر والكميات؛ ويعاد حساب المجموع الفرعي والخصم وعدد العناصر بلا state مكررة."),
      task: tr("Ajouter increment, decrement et remove sans mutation, avec quantité comprise entre 1 et le stock.", "Add increment, decrement, and remove without mutation, keeping quantity between 1 and stock.", "أضف increment وdecrement وremove بلا تغيير مباشر مع حصر الكمية بين 1 والمخزون."),
      next: tr("La prochaine leçon relie ce state à des champs contrôlés, validation et soumission accessible.", "The next lesson connects state to controlled fields, validation, and accessible submission.", "يربط الدرس التالي state بحقول مضبوطة والتحقق والإرسال الميسر."),
    },
    {
      id: "react-controlled-forms", order: 1, language: "tsx", filename: "components/CategoryFilters.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "import { useState } from \"react\";",
        "export function SearchForm() {",
        "  const [query, setQuery] = useState(\"\");",
        "  const error = query.length > 0 && query.trim().length < 2 ? \"Deux caractères minimum\" : \"\";",
        "  return <form onSubmit={(event) => event.preventDefault()}>",
        "    <label htmlFor=\"query\">Rechercher</label>",
        "    <input id=\"query\" value={query} onChange={(event) => setQuery(event.target.value)} aria-describedby=\"query-error\" />",
        "    <p id=\"query-error\" role=\"status\">{error}</p>",
        "    <button disabled={Boolean(error)}>Filtrer</button>",
        "  </form>;",
        "}",
      ].join("\n"),
      title: tr("Formulaires contrôlés et validation", "Controlled forms and validation", "النماذج المضبوطة والتحقق"),
      focus: tr("le cycle valeur → validation → soumission", "the value → validation → submission cycle", "دورة القيمة ← التحقق ← الإرسال"),
      mental: tr("Dans un champ contrôlé, React possède la valeur et chaque onChange propose la valeur suivante. La validation est une fonction de cette valeur ; la soumission relit un snapshot cohérent, revalide côté serveur puis annonce clairement succès ou erreurs de champs.", "In a controlled field, React owns the value and every onChange proposes the next value. Validation is a function of that value; submission reads a coherent snapshot, validates again on the server, and clearly announces success or field errors.", "في الحقل المضبوط تملك React القيمة ويقترح كل onChange القيمة التالية. التحقق دالة لهذه القيمة؛ ويقرأ الإرسال snapshot متناسقة ثم يعيد الخادم التحقق ويعلن النجاح أو أخطاء الحقول بوضوح."),
      points: tr([
        "value et onChange restent en paire ; fournir value sans onChange rend le champ en lecture seule, tandis que passer de undefined à string crée un changement contrôlé/non contrôlé.",
        "Une erreur dérivée de query n’a pas besoin de state ni useEffect ; elle se recalcule avec le rendu et ne peut pas devenir obsolète.",
        "label, aria-describedby et message persistant relient le champ à son erreur ; la couleur seule ne suffit ni au clavier ni au lecteur d’écran.",
      ], [
        "value and onChange remain paired; value without onChange makes the field read-only, while switching from undefined to string causes a controlled/uncontrolled change.",
        "An error derived from query needs neither state nor useEffect; it recalculates during render and cannot become stale.",
        "label, aria-describedby, and a persistent message connect the field to its error; color alone is insufficient for keyboard and screen-reader users.",
      ], [
        "يبقى value وonChange معاً؛ فتمرير value بلا onChange يجعل الحقل للقراءة فقط، والانتقال من undefined إلى string يسبب تغييراً بين controlled وuncontrolled.",
        "لا يحتاج الخطأ المشتق من query إلى state ولا useEffect؛ بل يعاد حسابه أثناء العرض ولا يصبح قديماً.",
        "تربط label وaria-describedby والرسالة الدائمة الحقل بخطئه؛ ولا يكفي اللون وحده لمستخدمي لوحة المفاتيح وقارئ الشاشة.",
      ]),
      general: tr("Conserve seulement les valeurs brutes, dérive les erreurs, empêche la soumission répétée et revalide le body sur le serveur.", "Store raw values only, derive errors, prevent duplicate submission, and validate the body again on the server.", "احفظ القيم الأولية فقط واشتق الأخطاء وامنع الإرسال المكرر وأعد التحقق من body على الخادم."),
      lecomax: tr("Le checkout L’ecomax associe chaque erreur d’adresse à son champ et ne considère jamais la validation navigateur comme une preuve serveur.", "The L’ecomax checkout associates each address error with its field and never treats browser validation as server proof.", "يربط checkout في L’ecomax كل خطأ عنوان بحقلـه ولا يعتبر تحقق المتصفح دليلاً للخادم أبداً."),
      task: tr("Construire nom, email et code postal contrôlés, avec erreurs accessibles et état submitting.", "Build controlled name, email, and postal-code fields with accessible errors and a submitting state.", "أنشئ حقول الاسم والبريد والرمز البريدي مضبوطة مع أخطاء ميسرة وحالة submitting."),
      next: tr("La prochaine leçon réserve useEffect aux synchronisations externes et implémente un cleanup fiable.", "The next lesson reserves useEffect for external synchronization and implements reliable cleanup.", "يخصص الدرس التالي useEffect للمزامنة الخارجية وينفذ cleanup موثوقاً."),
    },
    {
      id: "react-effects-cleanup", order: 2, language: "tsx", filename: "components/CategoryFilters.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "import { useEffect, useState } from \"react\";",
        "export function SavedQuery() {",
        "  const [query, setQuery] = useState(\"\");",
        "  useEffect(() => {",
        "    const timer = window.setTimeout(() => localStorage.setItem(\"catalog-query\", query), 250);",
        "    return () => window.clearTimeout(timer);",
        "  }, [query]);",
        "  return <input aria-label=\"Recherche\" value={query} onChange={(event) => setQuery(event.target.value)} />;",
        "}",
      ].join("\n"),
      title: tr("useEffect, dépendances et cleanup", "useEffect, dependencies, and cleanup", "useEffect والاعتماديات وcleanup"),
      focus: tr("la synchronisation avec un système externe", "synchronization with an external system", "المزامنة مع نظام خارجي"),
      mental: tr("React calcule le JSX puis commit le DOM ; seulement après, un effet synchronise ce rendu avec localStorage, un timer, un abonnement ou une API impérative. Avant le prochain effet ou le démontage, cleanup annule exactement ce que l’exécution précédente a installé.", "React computes JSX and commits the DOM; only then does an effect synchronize that render with localStorage, a timer, a subscription, or an imperative API. Before the next effect or unmount, cleanup reverses exactly what the previous run installed.", "تحسب React ‏JSX ثم تثبت DOM؛ وبعد ذلك فقط يزامن effect هذا العرض مع localStorage أو مؤقت أو اشتراك أو API أمرية. قبل effect التالي أو إزالة المكوّن يعكس cleanup تماماً ما ثبته التشغيل السابق."),
      points: tr([
        "Un effet n’est pas un endroit général pour calculer total ou filtrer une liste ; ces valeurs dérivées appartiennent au rendu et évitent un rendu supplémentaire.",
        "Le tableau de dépendances liste toutes les valeurs réactives lues par l’effet ; l’omettre crée une closure obsolète, l’inventer masque souvent une conception instable.",
        "Le cleanup du timer empêche une ancienne query d’être écrite après la nouvelle et rend le double montage de développement sans fuite observable.",
      ], [
        "An effect is not a general place to calculate totals or filter a list; derived values belong in render and avoid an extra render.",
        "The dependency array lists every reactive value read by the effect; omitting one creates a stale closure, while inventing one often hides unstable design.",
        "Timer cleanup prevents an old query from being written after the new one and makes development double mounting leak-free.",
      ], [
        "ليس effect مكاناً عاماً لحساب المجموع أو ترشيح قائمة؛ فالقيم المشتقة تنتمي إلى العرض وتمنع عرضاً إضافياً.",
        "تسرد مصفوفة dependencies كل قيمة تفاعلية يقرأها effect؛ وإغفال واحدة ينشئ closure قديمة، بينما اختراع واحدة يخفي غالباً تصميماً غير ثابت.",
        "يمنع cleanup للمؤقت كتابة query قديمة بعد الجديدة ويجعل التركيب المزدوج في التطوير بلا تسرب.",
      ]),
      general: tr("Pour chaque effet, nomme le système externe, l’action de synchronisation et l’opération inverse du cleanup.", "For every effect, name the external system, the synchronization action, and the cleanup’s inverse operation.", "لكل effect سمّ النظام الخارجي وإجراء المزامنة والعملية العكسية في cleanup."),
      lecomax: tr("L’ecomax persiste un filtre ou s’abonne à Realtime avec cleanup, mais calcule toujours le total du panier directement pendant le rendu.", "L’ecomax persists a filter or subscribes to Realtime with cleanup, but always calculates the cart total directly during render.", "يحفظ L’ecomax مرشحاً أو يشترك في Realtime مع cleanup، لكنه يحسب مجموع السلة دائماً مباشرة أثناء العرض."),
      task: tr("Ajouter une sauvegarde temporisée, prouver l’annulation des anciennes écritures et supprimer un state dérivé inutile.", "Add delayed persistence, prove old writes are canceled, and remove an unnecessary derived state.", "أضف حفظاً مؤقتاً وأثبت إلغاء الكتابات القديمة واحذف state مشتقة غير ضرورية."),
      next: tr("La prochaine leçon partage le panier avec Context et extrait une API sûre dans un hook personnalisé.", "The next lesson shares the cart with Context and extracts a safe API into a custom hook.", "يشارك الدرس التالي السلة عبر Context ويستخرج API آمنة في hook مخصص."),
    },
    {
      id: "react-context-custom-hooks", order: 3, language: "tsx", filename: "components/CartContext.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "import { createContext, useContext, useState } from \"react\";",
        "type CartValue = { count: number; add(): void };",
        "const CartContext = createContext<CartValue | null>(null);",
        "export function CartProvider({ children }: { children: React.ReactNode }) {",
        "  const [count, setCount] = useState(0);",
        "  return <CartContext.Provider value={{ count, add: () => setCount((n) => n + 1) }}>{children}</CartContext.Provider>;",
        "}",
        "export function useCart() {",
        "  const value = useContext(CartContext);",
        "  if (!value) throw new Error(\"useCart doit être utilisé dans CartProvider\");",
        "  return value;",
        "}",
      ].join("\n"),
      title: tr("Context et hooks personnalisés", "Context and custom hooks", "Context وhooks مخصصة"),
      focus: tr("le partage contrôlé d’un état transversal", "controlled sharing of cross-cutting state", "المشاركة المضبوطة لحالة عابرة للمكونات"),
      mental: tr("Context diffuse une valeur depuis un Provider vers ses descendants sans passer manuellement chaque niveau. Un hook personnalisé encapsule la lecture, vérifie la présence du Provider et expose une API métier stable plutôt que les détails internes du state.", "Context broadcasts a value from a Provider to descendants without manually passing every level. A custom hook encapsulates reading, verifies the Provider exists, and exposes a stable domain API rather than internal state details.", "يبث Context قيمة من Provider إلى الأبناء من دون تمرير كل مستوى يدوياً. يغلّف hook مخصص القراءة ويتحقق من وجود Provider ويعرض API مجال ثابتة بدلاً من تفاصيل state الداخلية."),
      points: tr([
        "Context convient à une valeur réellement transversale comme panier, session ou thème ; un state utilisé par deux frères proches peut simplement remonter à leur parent.",
        "La valeur par défaut null force useCart à détecter une configuration manquante, au lieu de retourner silencieusement un faux panier vide.",
        "Le hook cache useContext et protège les consommateurs contre un futur changement d’implémentation ; ils apprennent add et count, pas setState.",
      ], [
        "Context fits truly cross-cutting values such as cart, session, or theme; state used by two nearby siblings can simply move to their parent.",
        "A null default forces useCart to detect missing configuration instead of silently returning a fake empty cart.",
        "The hook hides useContext and protects consumers from future implementation changes; they learn add and count, not setState.",
      ], [
        "يناسب Context القيم العابرة فعلاً مثل السلة أو الجلسة أو السمة؛ ويمكن رفع state يستخدمها أخوان قريبان إلى أبيهما فقط.",
        "تجبر القيمة الافتراضية null دالة useCart على اكتشاف غياب الإعداد بدلاً من إعادة سلة فارغة وهمية بصمت.",
        "يخفي hook ‏useContext ويحمي المستهلكين من تغيير التنفيذ مستقبلاً؛ فيعرفون add وcount لا setState.",
      ]),
      general: tr("Place le Provider au plus petit ancêtre commun, expose des actions métier et fais échouer clairement le hook hors contexte.", "Place the Provider at the smallest common ancestor, expose domain actions, and make the hook fail clearly outside context.", "ضع Provider عند أصغر أب مشترك واعرض إجراءات المجال واجعل hook يفشل بوضوح خارج السياق."),
      lecomax: tr("CartProvider entoure la boutique L’ecomax ; Header lit count et ProductActions appelle add sans importer la structure interne des lignes.", "CartProvider wraps the L’ecomax shop; Header reads count and ProductActions calls add without importing the internal line structure.", "يغلف CartProvider متجر L’ecomax؛ يقرأ Header ‏count وتستدعي ProductActions ‏add بلا استيراد بنية الأسطر الداخلية."),
      task: tr("Créer CartProvider/useCart, l’utiliser dans Header et ProductActions, puis tester l’erreur hors Provider.", "Create CartProvider/useCart, use it in Header and ProductActions, then test the error outside the Provider.", "أنشئ CartProvider/useCart واستخدمه في Header وProductActions ثم اختبر الخطأ خارج Provider."),
      next: tr("Le module suivant organise ces composants dans les routes, layouts et conventions du Next.js App Router.", "The next module organizes these components inside Next.js App Router routes, layouts, and conventions.", "تنظم الوحدة التالية هذه المكونات داخل routes وlayouts واتفاقيات Next.js App Router."),
    },
  ],
};

const nextAppRouterModule = {
  id: "nextjs-app-router",
  order: 13,
  icon: "▲",
  color: "#111111",
  files: [
    { path: "app/page.tsx", mode: "existing" },
    { path: "app/layout.tsx", mode: "existing" },
    { path: "app/produit/[slug]/page.tsx", mode: "existing" },
    { path: "app/not-found.tsx", mode: "existing" },
  ],
  locales: {
    fr: { title: "Next.js App Router", summary: "Transformer l’arborescence app en URLs, partager des layouts, produire des metadata et gérer routes dynamiques, chargement et absence." },
    en: { title: "Next.js App Router", summary: "Turn the app tree into URLs, share layouts, produce metadata, and handle dynamic routes, loading, and missing content." },
    ar: { title: "Next.js App Router", summary: "تحويل شجرة app إلى روابط ومشاركة layouts وإنتاج metadata ومعالجة routes الديناميكية والتحميل والمحتوى المفقود." },
  },
  analogy: tr("un immeuble dont les dossiers sont les étages, les layouts les couloirs partagés et page.tsx la pièce visitée", "a building where folders are floors, layouts are shared hallways, and page.tsx is the visited room", "مبنى تمثل فيه المجلدات الطوابق وlayouts الممرات المشتركة وpage.tsx الغرفة التي تزورها"),
  vocabulary: {
    fr: [["segment", "Dossier représentant une partie de l’URL."], ["layout", "Interface persistante qui enveloppe les segments descendants."], ["dynamic route", "Segment entre crochets dont la valeur vient de l’URL."], ["metadata", "Informations de document destinées au navigateur et aux moteurs de recherche."]],
    en: [["segment", "A folder representing one part of a URL."], ["layout", "Persistent interface wrapping descendant segments."], ["dynamic route", "A bracketed segment whose value comes from the URL."], ["metadata", "Document information for browsers and search engines."]],
    ar: [["segment", "مجلد يمثل جزءاً من الرابط."], ["layout", "واجهة مستمرة تغلف segments الأبناء."], ["dynamic route", "segment بين أقواس تأتي قيمته من الرابط."], ["metadata", "معلومات المستند للمتصفح ومحركات البحث."]],
  },
  errors: {
    fr: [["Une nouvelle page retourne 404.", "Le fichier n’est pas nommé page.tsx ou se trouve hors du dossier app.", "Vérifie le segment, le nom réservé et le redémarrage du serveur si nécessaire."], ["params.slug est une Promise ou undefined.", "Le contrat Next.js 15 n’a pas été attendu ou le nom du dossier ne correspond pas.", "Type params: Promise<{ slug: string }> puis await params et garde le même identifiant."]],
    en: [["A new page returns 404.", "The file is not named page.tsx or lives outside app.", "Check the segment, reserved filename, and restart the server if necessary."], ["params.slug is a Promise or undefined.", "The Next.js 15 contract was not awaited or the folder name differs.", "Type params: Promise<{ slug: string }>, await params, and keep the same identifier."]],
    ar: [["تعيد صفحة جديدة 404.", "لا يسمى الملف page.tsx أو يقع خارج app.", "افحص segment والاسم المحجوز وأعد تشغيل الخادم عند الحاجة."], ["تكون params.slug ‏Promise أو undefined.", "لم يُنتظر عقد Next.js 15 أو يختلف اسم المجلد.", "حدد params: Promise<{ slug: string }> ثم نفذ await params وحافظ على المعرف نفسه."]],
  },
  lessons: [
    {
      id: "next-files-routes-project", order: 0, language: "tsx", filename: "app/page.tsx",
      commands: ["npm run dev", "curl.exe -I http://localhost:3000", "npx tsc --noEmit"],
      source: [
        "import Link from \"next/link\";",
        "export default function HomePage() {",
        "  return <main>",
        "    <h1>L’ecomax</h1>",
        "    <nav aria-label=\"Découvrir la boutique\">",
        "      <Link href=\"/boutique\">Voir les produits</Link>",
        "    </nav>",
        "  </main>;",
        "}",
      ].join("\n"),
      title: tr("Projet, dossiers et routes par fichiers", "Project, folders, and file-based routes", "المشروع والمجلدات وroutes المعتمدة على الملفات"),
      focus: tr("la traduction d’un fichier en URL", "translation of a file into a URL", "تحويل الملف إلى رابط"),
      mental: tr("Dans App Router, chaque dossier sous app est un segment potentiel et seul un fichier page.tsx rend ce segment publiquement visitable. Les dossiers components, lib et public organisent respectivement l’interface, la logique partagée et les ressources statiques sans créer automatiquement de routes.", "In App Router, every folder under app is a potential segment and only page.tsx makes that segment publicly visitable. The components, lib, and public folders organize interface, shared logic, and static assets without automatically creating routes.", "في App Router يكون كل مجلد تحت app ‏segment محتملاً، ولا يجعل segment قابلاً للزيارة علناً إلا ملف page.tsx. تنظم مجلدات components وlib وpublic الواجهة والمنطق المشترك والموارد الثابتة من دون إنشاء routes تلقائياً."),
      points: tr([
        "app/page.tsx correspond à /, app/boutique/page.tsx à /boutique et l’imbrication des dossiers construit l’URL de gauche à droite.",
        "Un export default de composant est obligatoire pour page.tsx ; ses imports serveur peuvent lire des données sans envoyer leur code au navigateur.",
        "Link effectue une navigation client accessible et permet à Next de précharger ; une balise a reste utile pour un domaine externe ou un téléchargement.",
      ], [
        "app/page.tsx maps to /, app/boutique/page.tsx to /boutique, and nested folders build the URL from left to right.",
        "A default component export is required for page.tsx; its server imports can read data without sending their code to the browser.",
        "Link performs accessible client navigation and lets Next prefetch; an anchor remains useful for an external domain or download.",
      ], [
        "يقابل app/page.tsx الرابط / ويقابل app/boutique/page.tsx الرابط /boutique وتبني المجلدات المتداخلة الرابط من اليسار إلى اليمين.",
        "يلزم export default لمكوّن في page.tsx؛ ويمكن لاستيراداته على الخادم قراءة البيانات بلا إرسال شيفرتها إلى المتصفح.",
        "ينفذ Link تنقلاً ميسراً في العميل ويسمح لـ Next بالتحميل المسبق؛ وتبقى a مفيدة لنطاق خارجي أو تنزيل.",
      ]),
      general: tr("Avant de coder, dessine l’URL voulue puis crée exactement ses segments et un page.tsx au dernier niveau.", "Before coding, draw the desired URL, then create exactly its segments and a page.tsx at the final level.", "قبل البرمجة ارسم الرابط المطلوب ثم أنشئ segments المطابقة وpage.tsx في المستوى الأخير."),
      lecomax: tr("Les routes /boutique, /panier et /produit/[slug] de L’ecomax sont directement lisibles dans l’arborescence app.", "The L’ecomax /boutique, /panier, and /produit/[slug] routes are directly readable from the app tree.", "يمكن قراءة routes ‏/boutique و/panier و/produit/[slug] في L’ecomax مباشرة من شجرة app."),
      task: tr("Prédire cinq URLs existantes, puis créer sur papier l’arborescence d’une route /compte/favoris.", "Predict five existing URLs, then sketch the folder tree for /compte/favoris.", "توقع خمسة روابط موجودة ثم ارسم شجرة مجلدات route ‏/compte/favoris."),
      next: tr("La prochaine leçon ajoute la structure partagée avec layouts et décrit chaque page avec metadata.", "The next lesson adds shared structure with layouts and describes each page through metadata.", "يضيف الدرس التالي البنية المشتركة عبر layouts ويصف كل صفحة باستخدام metadata."),
    },
    {
      id: "next-layouts-metadata", order: 1, language: "tsx", filename: "app/layout.tsx",
      commands: ["npm run dev", "curl.exe -s http://localhost:3000", "npm run build"],
      source: [
        "import type { Metadata } from \"next\";",
        "export const metadata: Metadata = {",
        "  title: { default: \"L’ecomax\", template: \"%s | L’ecomax\" },",
        "  description: \"Mode responsable et sélectionnée avec soin.\"",
        "};",
        "export default function RootLayout({ children }: { children: React.ReactNode }) {",
        "  return <html lang=\"fr\"><body><header>L’ecomax</header>{children}</body></html>;",
        "}",
      ].join("\n"),
      title: tr("Layouts, metadata et structure partagée", "Layouts, metadata, and shared structure", "Layouts وmetadata والبنية المشتركة"),
      focus: tr("l’héritage d’une interface de route", "inheritance of route interface", "وراثة واجهة route"),
      mental: tr("Le root layout enveloppe toutes les pages, fournit html et body et persiste pendant les navigations. Chaque layout imbriqué ajoute une coque à son sous-arbre, tandis que metadata fusionne des informations de document adaptées au segment actif.", "The root layout wraps every page, provides html and body, and persists across navigation. Each nested layout adds a shell to its subtree, while metadata merges document information for the active segment.", "يغلف root layout كل الصفحات ويوفر html وbody ويستمر أثناء التنقل. يضيف كل layout متداخل غلافاً لشجرته الفرعية، بينما تدمج metadata معلومات المستند الملائمة لـ segment النشط."),
      points: tr([
        "Header, Footer, providers globaux et analytics appartiennent au layout seulement s’ils sont réellement partagés ; une coque admin peut rester dans app/admin/layout.tsx.",
        "Le template de title garde la marque sans répéter la chaîne dans chaque page, mais chaque page importante fournit un titre et une description spécifiques.",
        "lang sur html renseigne les technologies d’assistance et moteurs ; une interface arabe doit aussi piloter dir=rtl au niveau pertinent.",
      ], [
        "Header, Footer, global providers, and analytics belong in a layout only when truly shared; an admin shell can stay in app/admin/layout.tsx.",
        "The title template preserves branding without repeating a string in every page, while each important page supplies a specific title and description.",
        "lang on html informs assistive technology and search engines; an Arabic interface must also drive dir=rtl at the relevant level.",
      ], [
        "تنتمي Header وFooter وproviders العامة وanalytics إلى layout فقط إن كانت مشتركة فعلاً؛ ويمكن أن يبقى غلاف الإدارة في app/admin/layout.tsx.",
        "يحفظ template الخاص بـ title العلامة بلا تكرار السلسلة في كل صفحة، بينما توفر كل صفحة مهمة عنواناً ووصفاً محددين.",
        "تخبر lang على html تقنيات المساعدة ومحركات البحث؛ ويجب أن تتحكم الواجهة العربية أيضاً في dir=rtl عند المستوى المناسب.",
      ]),
      general: tr("Place chaque élément dans le layout du plus petit sous-arbre qui le partage et donne aux pages une metadata unique.", "Place each element in the layout of the smallest subtree that shares it and give pages unique metadata.", "ضع كل عنصر في layout لأصغر شجرة فرعية تشاركه وأعط الصفحات metadata فريدة."),
      lecomax: tr("Le layout racine L’ecomax porte les éléments mondiaux, tandis que compte, ecomedia et admin possèdent leurs coques spécialisées.", "The L’ecomax root layout carries global elements, while account, ecomedia, and admin have specialized shells.", "يحمل root layout في L’ecomax العناصر العامة، بينما تملك account وecomedia وadmin أغلفتها المتخصصة."),
      task: tr("Tracer l’imbrication des layouts d’une page admin et ajouter title template, description et langue vérifiables dans head.", "Trace the layout nesting of an admin page and add a title template, description, and language visible in head.", "تتبع تداخل layouts لصفحة إدارة وأضف title template ووصفاً ولغة يمكن فحصها في head."),
      next: tr("La prochaine leçon lit slug et searchParams pour produire une fiche dynamique ou notFound.", "The next lesson reads slug and searchParams to produce a dynamic page or notFound.", "يقرأ الدرس التالي slug وsearchParams لإنتاج صفحة ديناميكية أو notFound."),
    },
    {
      id: "next-dynamic-routes", order: 2, language: "tsx", filename: "app/produit/[slug]/page.tsx",
      commands: ["npm run dev", "curl.exe -i http://localhost:3000/produit/un-slug-reel", "curl.exe -i http://localhost:3000/produit/introuvable"],
      source: [
        "import { notFound } from \"next/navigation\";",
        "type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ color?: string }> };",
        "export default async function ProductPage({ params, searchParams }: Props) {",
        "  const [{ slug }, { color }] = await Promise.all([params, searchParams]);",
        "  const product = await getProductBySlug(slug);",
        "  if (!product) notFound();",
        "  return <main><h1>{product.name}</h1><p>Couleur : {color ?? \"défaut\"}</p></main>;",
        "}",
      ].join("\n"),
      title: tr("Routes dynamiques, params et searchParams", "Dynamic routes, params, and searchParams", "Routes الديناميكية وparams وsearchParams"),
      focus: tr("la résolution d’un segment dynamique", "resolution of a dynamic segment", "حل segment ديناميكي"),
      mental: tr("[slug] réserve une position d’URL dont la valeur est fournie à la page dans params ; searchParams représente la requête après ?. Le segment identifie généralement la ressource, tandis que la query affine une vue sans changer son identité canonique.", "[slug] reserves a URL position whose value reaches the page through params; searchParams represents the query after ?. The segment usually identifies the resource, while the query refines a view without changing canonical identity.", "يحجز [slug] موضعاً في الرابط تصل قيمته إلى الصفحة عبر params؛ وتمثل searchParams الاستعلام بعد ?. يحدد segment المورد عادة، بينما يحسن query العرض من دون تغيير هويته الأساسية."),
      points: tr([
        "Dans Next.js 15, params et searchParams sont asynchrones dans ce contrat ; les attendre rend les valeurs disponibles avant la requête de données.",
        "Le slug venant de l’URL reste une entrée non fiable : la requête doit l’échapper, gérer zéro résultat et ne jamais construire du SQL par concaténation.",
        "notFound interrompt le rendu et sélectionne le plus proche not-found.tsx avec un statut 404, au lieu de retourner une page succès vide.",
      ], [
        "In this Next.js 15 contract, params and searchParams are asynchronous; awaiting them makes values available before data fetching.",
        "The URL slug remains untrusted input: the query must escape it, handle zero rows, and never construct SQL by concatenation.",
        "notFound interrupts rendering and selects the nearest not-found.tsx with a 404 status instead of returning an empty success page.",
      ], [
        "في عقد Next.js 15 هذا تكون params وsearchParams غير متزامنة؛ ويجعل انتظارها القيم متاحة قبل جلب البيانات.",
        "يبقى slug القادم من الرابط مدخلاً غير موثوق؛ فيجب أن تهربه query وتعالج انعدام الصفوف وألا تبني SQL بالوصل.",
        "توقف notFound العرض وتختار أقرب not-found.tsx بحالة 404 بدلاً من إعادة صفحة نجاح فارغة.",
      ]),
      general: tr("Sépare identité de ressource dans params et options de présentation dans searchParams, puis valide les deux avant usage.", "Separate resource identity in params from presentation options in searchParams, then validate both before use.", "افصل هوية المورد في params عن خيارات العرض في searchParams ثم تحقق من الاثنين قبل الاستخدام."),
      lecomax: tr("L’ecomax charge le produit par slug, choisit éventuellement une couleur depuis la query et rend une vraie 404 si le produit est absent.", "L’ecomax loads a product by slug, optionally selects a color from the query, and renders a real 404 when missing.", "يحمل L’ecomax المنتج عبر slug ويختار لوناً اختيارياً من query ويعرض 404 حقيقية عند غياب المنتج."),
      task: tr("Tester un slug valide, invalide et encodé, puis ajouter un filtre color validé par liste autorisée.", "Test valid, invalid, and encoded slugs, then add a color filter validated by an allowlist.", "اختبر slug صالحاً وغير صالح ومشفراً ثم أضف مرشح color يتحقق عبر قائمة مسموحة."),
      next: tr("La prochaine leçon ajoute les interfaces loading, error et not-found ainsi que navigation et préchargement.", "The next lesson adds loading, error, and not-found interfaces plus navigation and prefetching.", "يضيف الدرس التالي واجهات loading وerror وnot-found مع التنقل والتحميل المسبق."),
    },
    {
      id: "next-special-files-navigation", order: 3, language: "tsx", filename: "app/not-found.tsx",
      commands: ["npm run dev", "curl.exe -i http://localhost:3000/produit/introuvable", "npm run build"],
      source: [
        "import Link from \"next/link\";",
        "export default function NotFound() {",
        "  return <main>",
        "    <h1>Produit introuvable</h1>",
        "    <p>Le lien est peut-être ancien ou le produit retiré.</p>",
        "    <Link href=\"/boutique\">Retourner au catalogue</Link>",
        "  </main>;",
        "}",
      ].join("\n"),
      title: tr("loading, error, not-found et navigation", "loading, error, not-found, and navigation", "loading وerror وnot-found والتنقل"),
      focus: tr("les frontières d’attente et de récupération", "waiting and recovery boundaries", "حدود الانتظار والاستعادة"),
      mental: tr("Les fichiers spéciaux entourent un segment : loading.tsx sert de fallback pendant une suspension, error.tsx capture une erreur de rendu côté client et not-found.tsx explique une ressource absente. Chaque frontière doit préserver le contexte et fournir une prochaine action.", "Special files surround a segment: loading.tsx is a fallback during suspension, error.tsx catches a rendering failure on the client, and not-found.tsx explains a missing resource. Every boundary should preserve context and provide a next action.", "تحيط الملفات الخاصة بـ segment؛ يعمل loading.tsx كواجهة مؤقتة أثناء التعليق، ويلتقط error.tsx فشل العرض على العميل، ويشرح not-found.tsx غياب المورد. يجب أن يحفظ كل حد السياق ويقدم إجراء تالياً."),
      points: tr([
        "Un skeleton de loading réserve les dimensions finales pour éviter le décalage de mise en page et annonce l’attente sans fausse progression.",
        "error.tsx doit être Client Component pour offrir reset ; il affiche un message sûr et journalise la cause sans exposer stack ou secret au visiteur.",
        "La page not-found nomme ce qui manque et propose un Link pertinent ; le bouton retour navigateur ne suffit pas à un lien partagé directement.",
      ], [
        "A loading skeleton reserves final dimensions to prevent layout shift and announces waiting without fake progress.",
        "error.tsx must be a Client Component to offer reset; it displays a safe message and logs the cause without exposing a stack or secret.",
        "The not-found page names what is missing and offers a relevant Link; browser back is insufficient for a directly shared URL.",
      ], [
        "يحجز skeleton التحميل الأبعاد النهائية لمنع تغير التخطيط ويعلن الانتظار من دون تقدم وهمي.",
        "يجب أن يكون error.tsx ‏Client Component لتقديم reset؛ ويعرض رسالة آمنة ويسجل السبب بلا كشف stack أو سر للزائر.",
        "تسمي صفحة not-found ما هو مفقود وتقدم Link مناسباً؛ ولا يكفي زر رجوع المتصفح لرابط تمت مشاركته مباشرة.",
      ]),
      general: tr("Simule lenteur, erreur et absence pour chaque route critique, puis offre une action de récupération spécifique.", "Simulate latency, failure, and absence for each critical route, then offer a specific recovery action.", "حاك البطء والفشل والغياب لكل route حرجة ثم قدم إجراء استعادة محدداً."),
      lecomax: tr("Une fiche L’ecomax lente garde la galerie stable, une erreur peut être retentée et un slug supprimé renvoie au catalogue.", "A slow L’ecomax product page keeps the gallery stable, an error can be retried, and a removed slug links to the catalog.", "تحافظ صفحة منتج L’ecomax البطيئة على ثبات المعرض، ويمكن إعادة محاولة الخطأ، ويعيد slug المحذوف إلى الكتالوج."),
      task: tr("Concevoir les trois fichiers spéciaux d’une fiche produit et vérifier leurs statuts et actions au clavier.", "Design the three special files for a product page and verify their statuses and actions with keyboard navigation.", "صمم الملفات الخاصة الثلاثة لصفحة منتج وافحص حالاتها وإجراءاتها بلوحة المفاتيح."),
      next: tr("Le module suivant explique où le code Next s’exécute, comment les données sont cachées et comment écrire routes et middleware.", "The next module explains where Next code runs, how data is cached, and how to write routes and middleware.", "تشرح الوحدة التالية مكان تنفيذ شيفرة Next وكيف تُخزن البيانات مؤقتاً وكيف تُكتب routes وmiddleware."),
    },
  ],
};

const nextServerModule = {
  id: "nextjs-server-data",
  order: 14,
  icon: "🖥️",
  color: "#334155",
  files: [
    { path: "lib/db-server.ts", mode: "existing" },
    { path: "app/api/products/route.ts", mode: "existing" },
    { path: "middleware.ts", mode: "existing" },
  ],
  locales: {
    fr: { title: "Next serveur, cache et middleware", summary: "Choisir Server ou Client Component, contrôler fraîcheur et cache, construire des Route Handlers et protéger la périphérie avec middleware." },
    en: { title: "Next server, cache, and middleware", summary: "Choose Server or Client Components, control freshness and caching, build Route Handlers, and protect the edge with middleware." },
    ar: { title: "خادم Next والتخزين المؤقت وmiddleware", summary: "اختيار Server أو Client Components والتحكم بالحداثة والتخزين وبناء Route Handlers وحماية الحافة عبر middleware." },
  },
  analogy: tr("un restaurant où la cuisine garde secrets et données, la salle gère les interactions et le passe contrôle chaque commande", "a restaurant where the kitchen keeps secrets and data, the dining room handles interaction, and the pass checks every order", "مطعم تحفظ فيه المطبخ الأسرار والبيانات وتعالج الصالة التفاعل وتفحص نقطة التسليم كل طلب"),
  vocabulary: {
    fr: [["Server Component", "Composant exécuté côté serveur dont le code n’entre pas dans le bundle client."], ["revalidate", "Règle de fraîcheur autorisant une nouvelle génération après une durée ou un événement."], ["Route Handler", "Fonction HTTP exportée depuis un fichier route.ts."], ["middleware", "Code exécuté avant une route correspondante pour rediriger ou enrichir la requête."]],
    en: [["Server Component", "A server-executed component whose code does not enter the client bundle."], ["revalidate", "A freshness rule allowing regeneration after time or an event."], ["Route Handler", "An HTTP function exported from route.ts."], ["middleware", "Code executed before a matching route to redirect or enrich the request."]],
    ar: [["Server Component", "مكوّن ينفذ على الخادم ولا تدخل شيفرته حزمة العميل."], ["revalidate", "قاعدة حداثة تسمح بإعادة التوليد بعد مدة أو حدث."], ["Route Handler", "دالة HTTP مصدرة من route.ts."], ["middleware", "شيفرة تنفذ قبل route مطابقة للتحويل أو إثراء الطلب."]],
  },
  errors: {
    fr: [["useState échoue dans un composant.", "Le fichier est Server Component par défaut et ne possède pas la directive use client.", "Isole seulement la partie interactive dans un petit composant client."], ["Une donnée modifiée reste ancienne.", "La stratégie de cache ne correspond pas à sa fréquence de changement.", "Choisis no-store, revalidate temporel ou invalidation par tag selon le contrat métier."]],
    en: [["useState fails inside a component.", "The file is a Server Component by default and lacks use client.", "Isolate only the interactive part in a small client component."], ["Updated data remains stale.", "The cache strategy does not match its change frequency.", "Choose no-store, timed revalidation, or tag invalidation according to the domain contract."]],
    ar: [["يفشل useState داخل مكوّن.", "الملف Server Component افتراضياً ولا يملك use client.", "اعزل الجزء التفاعلي فقط في مكوّن عميل صغير."], ["تبقى البيانات المعدلة قديمة.", "لا تطابق استراتيجية cache تكرار تغير البيانات.", "اختر no-store أو revalidate زمنية أو إبطال tag حسب عقد المجال."]],
  },
  lessons: [
    {
      id: "next-server-client-boundary", order: 0, language: "tsx", filename: "lib/db-server.ts",
      commands: ["npm run dev", "npm run build"],
      source: [
        "// Server Component: app/boutique/page.tsx",
        "import ProductActions from \"@/components/ProductActions\";",
        "export default async function ShopPage() {",
        "  const products = await loadProductsOnServer();",
        "  return <main>{products.map((product) =>",
        "    <article key={product.id}><h2>{product.name}</h2><ProductActions product={product} /></article>",
        "  )}</main>;",
        "}",
      ].join("\n"),
      title: tr("Server Components et frontière client", "Server Components and the client boundary", "Server Components وحدود العميل"),
      focus: tr("la séparation serveur/client", "the server/client separation", "الفصل بين الخادم والعميل"),
      mental: tr("Les composants sont serveur par défaut : ils peuvent attendre la base, lire des secrets et envoyer seulement leur résultat sérialisé. La directive use client crée une frontière transitive pour l’interactivité ; les props qui la traversent doivent être sérialisables.", "Components are server by default: they can await the database, read secrets, and send only serialized results. The use client directive creates a transitive boundary for interaction; props crossing it must be serializable.", "المكونات خادم افتراضياً؛ يمكنها انتظار القاعدة وقراءة الأسرار وإرسال النتيجة المسلسلة فقط. تنشئ use client حداً انتقالياً للتفاعل؛ ويجب أن تكون props العابرة له قابلة للتسلسل."),
      points: tr([
        "Le Server Component rapproche le fetch de la source, évite un aller-retour navigateur/API et garde le client service role hors du bundle public.",
        "Un composant client peut recevoir nom, prix et identifiant, mais pas une fonction serveur arbitraire, une connexion DB ou un objet non sérialisable.",
        "Placer use client tout en haut transforme inutilement ses imports en bundle client ; descendre la frontière jusqu’au bouton réduit JavaScript et surface d’attaque.",
      ], [
        "A Server Component moves fetching close to the source, avoids a browser/API round trip, and keeps a service-role client out of the public bundle.",
        "A Client Component can receive name, price, and identifier, but not an arbitrary server function, DB connection, or non-serializable object.",
        "Putting use client high in the tree needlessly turns imports into client bundle code; moving the boundary down to the button reduces JavaScript and attack surface.",
      ], [
        "يقرب Server Component الجلب من المصدر ويتجنب رحلة متصفح/API ويحفظ عميل service role خارج الحزمة العامة.",
        "يمكن لـ Client Component استقبال الاسم والسعر والمعرف، لكن ليس دالة خادم عشوائية أو اتصال DB أو كائن غير قابل للتسلسل.",
        "يحوّل وضع use client أعلى الشجرة الاستيرادات بلا حاجة إلى شيفرة عميل؛ ويقلل إنزال الحد إلى الزر JavaScript ومساحة الهجوم.",
      ]),
      general: tr("Commence sur le serveur, puis ajoute une petite île client uniquement à l’endroit nécessitant state, effet ou événement navigateur.", "Start on the server, then add a small client island only where browser state, effects, or events are required.", "ابدأ على الخادم ثم أضف جزيرة عميل صغيرة فقط حيث تلزم state أو effects أو أحداث المتصفح."),
      lecomax: tr("La page boutique L’ecomax charge le catalogue sur le serveur et hydrate seulement filtres, favoris et actions panier.", "The L’ecomax shop page loads the catalog on the server and hydrates only filters, wishlist, and cart actions.", "تحمل صفحة متجر L’ecomax الكتالوج على الخادم وتفعّل فقط المرشحات والمفضلة وإجراءات السلة."),
      task: tr("Marquer les parties serveur/client d’une fiche et déplacer use client jusqu’au plus petit composant interactif.", "Mark server/client areas of a product page and move use client to the smallest interactive component.", "حدد مناطق الخادم/العميل في صفحة منتج وانقل use client إلى أصغر مكوّن تفاعلي."),
      next: tr("La prochaine leçon choisit une politique de cache et invalide les données après mutation.", "The next lesson chooses a cache policy and invalidates data after mutation.", "يختار الدرس التالي سياسة cache ويبطل البيانات بعد التغيير."),
    },
    {
      id: "next-cache-revalidation", order: 1, language: "typescript", filename: "lib/db-server.ts",
      commands: ["npm run dev", "npm run build"],
      source: [
        "export async function loadFeaturedProducts() {",
        "  const response = await fetch(\"https://example.test/products?featured=1\", {",
        "    next: { revalidate: 300, tags: [\"products\"] },",
        "  });",
        "  if (!response.ok) throw new Error(`Catalogue HTTP ${response.status}`);",
        "  return response.json();",
        "}",
        "// Après une mutation serveur : revalidateTag(\"products\")",
      ].join("\n"),
      title: tr("Cache, fraîcheur et revalidation", "Cache, freshness, and revalidation", "Cache والحداثة وإعادة التحقق"),
      focus: tr("la politique de fraîcheur d’une donnée", "a data freshness policy", "سياسة حداثة البيانات"),
      mental: tr("Le cache est un contrat temporel : il échange de la fraîcheur contre moins de travail et une réponse plus rapide. Une donnée a besoin d’une politique fondée sur sa volatilité et le risque métier, pas d’un réglage identique pour toute l’application.", "Caching is a temporal contract: it trades freshness for less work and faster responses. Data needs a policy based on volatility and domain risk, not one setting for the entire application.", "التخزين المؤقت عقد زمني؛ يستبدل بعض الحداثة بعمل أقل واستجابة أسرع. تحتاج البيانات إلى سياسة مبنية على تقلبها ومخاطر المجال لا إلى إعداد واحد للتطبيق كله."),
      points: tr([
        "Un catalogue public peut accepter cinq minutes de cache, alors que stock au checkout, session et permissions doivent être relus au moment critique.",
        "revalidate: 300 autorise une nouvelle version après la fenêtre ; un tag regroupe les lectures qu’une mutation produit doit invalider intentionnellement.",
        "no-store force une lecture fraîche mais augmente latence et charge ; il convient aux données personnalisées ou critiques, pas comme réflexe universel.",
      ], [
        "A public catalog may accept five minutes of caching, while checkout stock, session, and permissions must be read at the critical moment.",
        "revalidate: 300 allows a new version after the window; a tag groups reads that a product mutation should deliberately invalidate.",
        "no-store forces a fresh read but increases latency and load; it fits personalized or critical data, not every request by default.",
      ], [
        "قد يقبل الكتالوج العام خمس دقائق من cache، بينما يجب إعادة قراءة المخزون عند checkout والجلسة والصلاحيات في اللحظة الحرجة.",
        "تسمح revalidate: 300 بنسخة جديدة بعد النافذة؛ وتجمع tag القراءات التي يجب أن يبطلها تغيير المنتج عمداً.",
        "تفرض no-store قراءة حديثة لكنها تزيد زمن الاستجابة والحمل؛ وتناسب البيانات الشخصية أو الحرجة لا كل طلب افتراضياً.",
      ]),
      general: tr("Classe chaque donnée en statique, périodique, événementielle ou toujours fraîche et documente le déclencheur d’invalidation.", "Classify each datum as static, periodic, event-driven, or always fresh, and document its invalidation trigger.", "صنف كل بيان إلى ثابت أو دوري أو مرتبط بحدث أو حديث دائماً ووثق محفز الإبطال."),
      lecomax: tr("L’ecomax met en cache les sélections publiques, invalide le tag produits après admin et revalide prix/stock au checkout.", "L’ecomax caches public selections, invalidates the products tag after admin changes, and rechecks price/stock at checkout.", "يخزن L’ecomax الاختيارات العامة ويبطل tag المنتجات بعد تغييرات الإدارة ويعيد فحص السعر/المخزون عند checkout."),
      task: tr("Créer une matrice de fraîcheur pour catalogue, paramètres, session et stock, puis associer cache et invalidation.", "Create a freshness matrix for catalog, settings, session, and stock, then assign caching and invalidation.", "أنشئ مصفوفة حداثة للكتالوج والإعدادات والجلسة والمخزون ثم عيّن cache والإبطال."),
      next: tr("La prochaine leçon expose un contrat HTTP sûr dans un Route Handler.", "The next lesson exposes a safe HTTP contract through a Route Handler.", "يعرض الدرس التالي عقد HTTP آمناً عبر Route Handler."),
    },
    {
      id: "next-route-handlers", order: 2, language: "typescript", filename: "app/api/products/route.ts",
      commands: ["npm run dev", "curl.exe -i http://localhost:3000/api/products"],
      source: [
        "import { NextResponse } from \"next/server\";",
        "export async function GET(request: Request) {",
        "  const url = new URL(request.url);",
        "  const limit = Math.min(Number(url.searchParams.get(\"limit\") ?? 12), 50);",
        "  if (!Number.isInteger(limit) || limit < 1)",
        "    return NextResponse.json({ error: \"limit invalide\" }, { status: 400 });",
        "  const products = await loadProducts({ limit });",
        "  return NextResponse.json({ data: products }, { status: 200 });",
        "}",
      ].join("\n"),
      title: tr("Route Handlers et contrats HTTP", "Route Handlers and HTTP contracts", "Route Handlers وعقود HTTP"),
      focus: tr("la conception d’une route HTTP", "design of an HTTP route", "تصميم route ‏HTTP"),
      mental: tr("route.ts expose une frontière réseau avec une fonction par méthode HTTP. Elle lit Request, authentifie et valide avant toute écriture, appelle la logique métier puis traduit le résultat en statut, en-têtes et JSON stables.", "route.ts exposes a network boundary with one function per HTTP method. It reads Request, authenticates and validates before any write, calls domain logic, and translates the result into stable status, headers, and JSON.", "يعرض route.ts حد شبكة بدالة لكل طريقة HTTP. يقرأ Request ويتحقق من الهوية والمدخل قبل أي كتابة ثم يستدعي منطق المجال ويترجم النتيجة إلى حالة وترويسات وJSON ثابتة."),
      points: tr([
        "GET lit query et ne modifie pas l’état ; POST crée, PATCH modifie partiellement et DELETE retire selon un contrat documenté et idempotent lorsque nécessaire.",
        "Number peut produire NaN ou une décimale : la validation vérifie entier, bornes et valeur maximale avant de transmettre limit à la base.",
        "400 décrit une entrée invalide, 401 une absence d’identité, 403 un manque de permission, 404 une ressource absente et 500 un échec non exposé.",
      ], [
        "GET reads query and does not mutate state; POST creates, PATCH partially updates, and DELETE removes under a documented and idempotent contract when required.",
        "Number can produce NaN or a decimal: validation checks integer, bounds, and a maximum before passing limit to the database.",
        "400 means invalid input, 401 missing identity, 403 insufficient permission, 404 missing resource, and 500 an undisclosed internal failure.",
      ], [
        "يقرأ GET ‏query ولا يغير الحالة؛ وينشئ POST وتعدل PATCH جزئياً وتحذف DELETE وفق عقد موثق وidempotent عند الحاجة.",
        "قد ينتج Number ‏NaN أو كسراً؛ فيفحص التحقق العدد الصحيح والحدود والقيمة القصوى قبل تمرير limit إلى القاعدة.",
        "تعني 400 مدخلاً غير صالح و401 غياب الهوية و403 نقص الصلاحية و404 غياب المورد و500 فشلاً داخلياً غير مكشوف.",
      ]),
      general: tr("Écris d’abord exemples de requêtes/réponses et statuts, puis implémente validation, métier et sérialisation dans cet ordre.", "Write request/response examples and statuses first, then implement validation, domain logic, and serialization in that order.", "اكتب أمثلة الطلب/الاستجابة والحالات أولاً ثم نفذ التحقق ومنطق المجال والتسلسل بهذا الترتيب."),
      lecomax: tr("La route produits L’ecomax borne pagination et filtres, retourne une enveloppe stable et ne divulgue jamais le message brut Supabase.", "The L’ecomax products route bounds pagination and filters, returns a stable envelope, and never leaks the raw Supabase message.", "تحد route المنتجات في L’ecomax الصفحات والمرشحات وتعيد غلافاً ثابتاً ولا تسرب رسالة Supabase الخام."),
      task: tr("Ajouter search et limit validés, tester 200/400/500 et vérifier le JSON exact avec curl.", "Add validated search and limit values, test 200/400/500, and verify exact JSON with curl.", "أضف search وlimit متحققاً منهما واختبر 200/400/500 وافحص JSON الدقيق عبر curl."),
      next: tr("La prochaine leçon utilise middleware pour filtrer tôt sans déplacer toute l’autorisation hors des routes.", "The next lesson uses middleware for early filtering without moving all authorization out of routes.", "يستخدم الدرس التالي middleware للترشيح المبكر من دون نقل كل التفويض خارج routes."),
    },
    {
      id: "next-middleware-cookies", order: 3, language: "typescript", filename: "middleware.ts",
      commands: ["npm run dev", "curl.exe -I http://localhost:3000/admin", "npx tsc --noEmit"],
      source: [
        "import { NextResponse, type NextRequest } from \"next/server\";",
        "export function middleware(request: NextRequest) {",
        "  const hasSession = Boolean(request.cookies.get(\"admin-session\")?.value);",
        "  if (request.nextUrl.pathname.startsWith(\"/admin\") && !hasSession) {",
        "    const login = new URL(\"/connexion\", request.url);",
        "    login.searchParams.set(\"next\", request.nextUrl.pathname);",
        "    return NextResponse.redirect(login);",
        "  }",
        "  return NextResponse.next();",
        "}",
        "export const config = { matcher: [\"/admin/:path*\"] };",
      ].join("\n"),
      title: tr("Middleware, cookies et redirections", "Middleware, cookies, and redirects", "Middleware وcookies والتحويلات"),
      focus: tr("le filtrage précoce d’une requête", "early request filtering", "الترشيح المبكر للطلب"),
      mental: tr("Middleware s’exécute avant les routes correspondant au matcher et peut continuer, rediriger ou enrichir une réponse. Il améliore navigation et protection générale, mais la route sensible doit encore vérifier session et permission au moment de l’action.", "Middleware runs before routes matching its matcher and can continue, redirect, or enrich a response. It improves navigation and broad protection, but the sensitive route must still verify session and permission when acting.", "ينفذ Middleware قبل routes المطابقة لـ matcher ويمكنه المتابعة أو التحويل أو إثراء الاستجابة. يحسن التنقل والحماية العامة، لكن يجب أن تعيد route الحساسة فحص الجلسة والصلاحية عند الإجراء."),
      points: tr([
        "Un matcher étroit évite d’exécuter le middleware sur images, scripts et pages publiques ; chaque milliseconde de périphérie se répète sur de nombreuses requêtes.",
        "La présence d’un cookie n’est pas la preuve de son authenticité : une session doit être signée, non expirée et revérifiée avant accès aux données.",
        "Le paramètre next améliore le retour après connexion mais doit être limité à un chemin interne pour empêcher une redirection ouverte vers un site malveillant.",
      ], [
        "A narrow matcher avoids running middleware on images, scripts, and public pages; each edge millisecond repeats across many requests.",
        "Cookie presence is not proof of authenticity: a session must be signed, unexpired, and verified again before data access.",
        "The next parameter improves post-login return but must be restricted to an internal path to prevent an open redirect to a malicious site.",
      ], [
        "يمنع matcher ضيق تشغيل middleware على الصور والسكربتات والصفحات العامة؛ فكل ميلي ثانية على الحافة تتكرر عبر طلبات كثيرة.",
        "وجود cookie ليس دليلاً على صحتها؛ يجب أن تكون الجلسة موقعة وغير منتهية وأن يعاد التحقق منها قبل الوصول للبيانات.",
        "يحسن معامل next العودة بعد تسجيل الدخول لكن يجب حصره في مسار داخلي لمنع تحويل مفتوح إلى موقع ضار.",
      ]),
      general: tr("Utilise middleware pour orientation rapide et applique l’autorisation définitive près de la donnée ou de la mutation.", "Use middleware for fast routing decisions and enforce definitive authorization near the data or mutation.", "استخدم middleware لقرارات توجيه سريعة وطبق التفويض النهائي قرب البيانات أو التغيير."),
      lecomax: tr("L’ecomax renvoie un visiteur admin vers connexion, puis admin-session et permissions sont vérifiées de nouveau dans chaque API sensible.", "L’ecomax redirects an admin visitor to login, then verifies admin-session and permissions again in every sensitive API.", "يحوّل L’ecomax زائر الإدارة إلى تسجيل الدخول ثم يعيد فحص admin-session والصلاحيات في كل API حساسة."),
      task: tr("Protéger /admin, sécuriser next contre les URLs externes et prouver qu’une API refuse encore un faux cookie.", "Protect /admin, secure next against external URLs, and prove an API still rejects a fake cookie.", "احم /admin وأمّن next ضد الروابط الخارجية وأثبت أن API لا تزال ترفض cookie مزيفة."),
      next: tr("Le module suivant modélise les données relationnelles qui alimentent ces composants et routes.", "The next module models the relational data that feeds these components and routes.", "تنمذج الوحدة التالية البيانات العلائقية التي تغذي هذه المكونات وroutes."),
    },
  ],
};

const sqlModule = {
  id: "sql-data-modeling",
  order: 15,
  icon: "🗃️",
  color: "#2563eb",
  files: [
    { path: "scripts/run-migrations.mjs", mode: "existing" },
    { path: "lib/db-server.ts", mode: "existing" },
  ],
  locales: {
    fr: { title: "SQL et modélisation relationnelle", summary: "Concevoir tables, clés, relations et contraintes, interroger avec jointures et rendre les mutations concurrentes sûres." },
    en: { title: "SQL and relational modeling", summary: "Design tables, keys, relationships, and constraints, query with joins, and make concurrent mutations safe." },
    ar: { title: "SQL والنمذجة العلائقية", summary: "تصميم الجداول والمفاتيح والعلاقات والقيود والاستعلام بالروابط وجعل التغييرات المتزامنة آمنة." },
  },
  analogy: tr("un classeur où chaque feuille a une identité, des règles de saisie et des références vérifiées vers les autres feuilles", "a workbook where every sheet has identity, entry rules, and verified references to other sheets", "مصنف تملك فيه كل ورقة هوية وقواعد إدخال ومراجع متحققة إلى الأوراق الأخرى"),
  vocabulary: {
    fr: [["primary key", "Colonne ou ensemble identifiant chaque ligne de façon unique."], ["foreign key", "Référence contrôlée vers la clé d’une autre table."], ["constraint", "Règle que la base garantit pour chaque écriture."], ["transaction", "Groupe d’opérations validé entièrement ou annulé entièrement."]],
    en: [["primary key", "A column or set that uniquely identifies every row."], ["foreign key", "A controlled reference to another table’s key."], ["constraint", "A rule the database guarantees for every write."], ["transaction", "A group of operations committed entirely or rolled back entirely."]],
    ar: [["primary key", "عمود أو مجموعة تعرف كل صف بصورة فريدة."], ["foreign key", "مرجع مضبوط إلى مفتاح جدول آخر."], ["constraint", "قاعدة تضمنها القاعدة عند كل كتابة."], ["transaction", "مجموعة عمليات تثبت كلها أو تُلغى كلها."]],
  },
  errors: {
    fr: [["Une commande référence un produit inexistant.", "La relation repose seulement sur le code applicatif sans foreign key.", "Ajoute la contrainte et choisis explicitement le comportement ON DELETE."], ["Deux achats rendent le stock négatif.", "Lecture et écriture sont séparées hors transaction sans verrou ni condition atomique.", "Effectue le contrôle et la décrémentation dans une transaction atomique avec contrainte stock >= 0."]],
    en: [["An order references a missing product.", "The relationship relies only on application code without a foreign key.", "Add the constraint and explicitly choose ON DELETE behavior."], ["Two purchases make stock negative.", "Read and write happen separately outside a transaction without locking or an atomic condition.", "Check and decrement inside an atomic transaction with a stock >= 0 constraint."]],
    ar: [["يشير طلب إلى منتج غير موجود.", "تعتمد العلاقة على شيفرة التطبيق فقط بلا foreign key.", "أضف القيد واختر سلوك ON DELETE صراحة."], ["تجعل عمليتا شراء المخزون سالباً.", "تحدث القراءة والكتابة منفصلتين خارج transaction بلا قفل أو شرط ذري.", "نفذ الفحص والإنقاص داخل transaction ذرية مع قيد stock >= 0."]],
  },
  lessons: [
    {
      id: "sql-tables-types-keys", order: 0, language: "sql", filename: "supabase/migrations/2026071401_academy_products.sql",
      commands: ["npm run validate:course"],
      source: [
        "create table products (",
        "  id uuid primary key default gen_random_uuid(),",
        "  slug text not null unique,",
        "  name text not null check (char_length(name) >= 2),",
        "  price_cents integer not null check (price_cents >= 0),",
        "  stock integer not null default 0 check (stock >= 0),",
        "  created_at timestamptz not null default now()",
        ");",
        "create index products_created_at_idx on products (created_at desc);",
      ].join("\n"),
      title: tr("Tables, types, clés et contraintes", "Tables, types, keys, and constraints", "الجداول والأنواع والمفاتيح والقيود"),
      focus: tr("l’intégrité d’une ligne relationnelle", "integrity of a relational row", "سلامة الصف العلائقي"),
      mental: tr("Une table représente un ensemble d’entités du même type ; chaque colonne définit une valeur, chaque clé donne une identité et chaque contrainte refuse un état invalide au dernier rempart. Le schéma est un contrat exécutable, pas une documentation facultative.", "A table represents a set of entities of one kind; each column defines a value, each key provides identity, and each constraint rejects invalid state at the final boundary. The schema is an executable contract, not optional documentation.", "يمثل الجدول مجموعة كيانات من النوع نفسه؛ يحدد كل عمود قيمة ويمنح كل مفتاح هوية ويرفض كل قيد الحالة غير الصالحة عند الحاجز الأخير. المخطط عقد قابل للتنفيذ لا توثيق اختياري."),
      points: tr([
        "uuid donne une identité indépendante de l’ordre d’insertion, tandis que unique sur slug garantit qu’une URL produit ne correspond jamais à deux lignes.",
        "not null exprime qu’une valeur est obligatoire ; default ne remplace pas la validation métier mais rend les créations cohérentes lorsque la valeur est réellement implicite.",
        "Les check sur centimes et stock protègent aussi les scripts, imports et futures APIs qui pourraient contourner la validation actuelle du formulaire.",
      ], [
        "uuid gives identity independent of insertion order, while unique on slug guarantees one product URL never maps to two rows.",
        "not null expresses a required value; default does not replace domain validation but keeps inserts coherent when the value is truly implicit.",
        "Checks on cents and stock also protect scripts, imports, and future APIs that may bypass today’s form validation.",
      ], [
        "يعطي uuid هوية مستقلة عن ترتيب الإدخال، بينما يضمن unique على slug ألا يقابل رابط منتج واحد صفين.",
        "تعبر not null عن قيمة مطلوبة؛ ولا تستبدل default تحقق المجال لكنها تجعل الإدخالات منسجمة عندما تكون القيمة ضمنية فعلاً.",
        "تحمي قيود check على السنتات والمخزون أيضاً السكربتات والاستيرادات وواجهات API المستقبلية التي قد تتجاوز تحقق النموذج الحالي.",
      ]),
      general: tr("Pour chaque colonne, écris son unité, nullabilité, valeur par défaut, unicité et plage valide avant la migration.", "For every column, write its unit, nullability, default, uniqueness, and valid range before the migration.", "لكل عمود اكتب وحدته وقابلية null والقيمة الافتراضية والتفرد والمدى الصالح قبل migration."),
      lecomax: tr("Les produits L’ecomax stockent le prix en centimes, refusent stock négatif et garantissent un slug unique pour la fiche.", "L’ecomax products store price in cents, reject negative stock, and guarantee a unique slug for the product page.", "تخزن منتجات L’ecomax السعر بالسنتات وترفض المخزون السالب وتضمن slug فريداً لصفحة المنتج."),
      task: tr("Écrire une table categories avec slug unique et contraintes, puis insérer trois lignes valides et trois invalides.", "Write a categories table with unique slug and constraints, then insert three valid and three invalid rows.", "اكتب جدول categories مع slug فريد وقيود ثم أدخل ثلاثة صفوف صالحة وثلاثة غير صالحة."),
      next: tr("La prochaine leçon relie commandes, lignes et produits sans dupliquer les faits changeants.", "The next lesson links orders, lines, and products without duplicating changing facts.", "يربط الدرس التالي الطلبات والأسطر والمنتجات من دون تكرار الحقائق المتغيرة."),
    },
    {
      id: "sql-relations-normalization", order: 1, language: "sql", filename: "supabase/migrations/2026071402_academy_order_items.sql",
      commands: ["npm run validate:course"],
      source: [
        "create table order_items (",
        "  id uuid primary key default gen_random_uuid(),",
        "  order_id uuid not null references orders(id) on delete cascade,",
        "  product_id uuid references products(id) on delete set null,",
        "  product_name text not null,",
        "  unit_price_cents integer not null check (unit_price_cents >= 0),",
        "  quantity integer not null check (quantity > 0),",
        "  unique (order_id, product_id)",
        ");",
      ].join("\n"),
      title: tr("Relations et normalisation", "Relationships and normalization", "العلاقات والتطبيع"),
      focus: tr("la modélisation des relations entre entités", "modeling relationships between entities", "نمذجة العلاقات بين الكيانات"),
      mental: tr("Une relation un-à-plusieurs place la foreign key du côté plusieurs ; une relation plusieurs-à-plusieurs devient une table de liaison portant ses propres attributs. La normalisation garde chaque fait changeant à un seul endroit, tandis qu’un snapshot historique copie intentionnellement ce qui doit rester figé.", "A one-to-many relationship places the foreign key on the many side; a many-to-many relationship becomes a junction table carrying its own attributes. Normalization stores each changing fact once, while a historical snapshot deliberately copies what must remain frozen.", "تضع علاقة واحد إلى كثير foreign key في جهة الكثير؛ وتصبح علاقة كثير إلى كثير جدول وصل يحمل خصائصه. يحفظ التطبيع كل حقيقة متغيرة في مكان واحد، بينما تنسخ snapshot تاريخية ما يجب أن يبقى ثابتاً عمداً."),
      points: tr([
        "order_items matérialise la relation commandes-produits et porte quantité ainsi que prix acheté ; ces attributs appartiennent à la relation, pas au produit seul.",
        "product_id peut devenir null si un produit est supprimé, mais product_name et unit_price_cents restent pour que la facture historique ne change jamais.",
        "ON DELETE cascade convient aux lignes dépendantes d’une commande supprimée, alors qu’un profil ou produit exige souvent restrict, archive ou set null selon l’audit attendu.",
      ], [
        "order_items materializes the order-product relationship and carries quantity and purchased price; those attributes belong to the relationship, not the product alone.",
        "product_id may become null when a product is deleted, but product_name and unit_price_cents remain so the historical invoice never changes.",
        "ON DELETE cascade fits lines dependent on a removed order, while profiles or products often require restrict, archive, or set null based on audit needs.",
      ], [
        "يجسد order_items علاقة الطلبات بالمنتجات ويحمل الكمية وسعر الشراء؛ فهذه الخصائص تخص العلاقة لا المنتج وحده.",
        "قد يصبح product_id ‏null عند حذف المنتج، لكن يبقى product_name وunit_price_cents حتى لا تتغير الفاتورة التاريخية.",
        "يناسب ON DELETE cascade الأسطر التابعة لطلب محذوف، بينما تحتاج الملفات أو المنتجات غالباً إلى restrict أو archive أو set null حسب التدقيق المطلوب.",
      ]),
      general: tr("Dessine cardinalités et cycle de vie, puis décide pour chaque relation ce qu’une suppression doit interdire, conserver ou cascader.", "Draw cardinalities and lifecycles, then decide whether deletion should restrict, preserve, or cascade for every relationship.", "ارسم cardinalities ودورات الحياة ثم قرر لكل علاقة ما إذا كان الحذف سيمنع أو يحفظ أو يتسلسل."),
      lecomax: tr("L’ecomax normalise produits et catégories mais snapshot nom, variante et prix dans order_items pour préserver la preuve d’achat.", "L’ecomax normalizes products and categories but snapshots name, variant, and price in order_items to preserve purchase evidence.", "يطبع L’ecomax المنتجات والفئات لكنه يأخذ snapshot للاسم والمتغير والسعر في order_items لحفظ دليل الشراء."),
      task: tr("Dessiner products/categories/orders/order_items et justifier chaque foreign key, nullabilité et règle ON DELETE.", "Draw products/categories/orders/order_items and justify every foreign key, nullability choice, and ON DELETE rule.", "ارسم products/categories/orders/order_items وبرر كل foreign key واختيار nullability وقاعدة ON DELETE."),
      next: tr("La prochaine leçon interroge ce modèle avec filtres, jointures, agrégations et pagination stable.", "The next lesson queries this model with filters, joins, aggregates, and stable pagination.", "يستعلم الدرس التالي هذا النموذج بالمرشحات والروابط والتجميع والصفحات الثابتة."),
    },
    {
      id: "sql-select-joins-aggregates", order: 2, language: "sql", filename: "supabase/migrations/2026071403_academy_order_report.sql",
      commands: ["npm run validate:course"],
      source: [
        "select",
        "  o.id, o.created_at,",
        "  sum(oi.unit_price_cents * oi.quantity) as subtotal_cents,",
        "  count(oi.id) as line_count",
        "from orders o",
        "join order_items oi on oi.order_id = o.id",
        "where o.status = 'paid'",
        "group by o.id, o.created_at",
        "order by o.created_at desc, o.id desc",
        "limit 20;",
      ].join("\n"),
      title: tr("SELECT, JOIN et agrégations", "SELECT, JOIN, and aggregates", "SELECT وJOIN والتجميعات"),
      focus: tr("la construction d’un résultat relationnel", "construction of a relational result", "بناء نتيجة علائقية"),
      mental: tr("Une requête décrit le résultat voulu : FROM choisit les ensembles, JOIN relie les lignes, WHERE filtre avant agrégation, GROUP BY forme les groupes et ORDER BY garantit un ordre. Le moteur choisit ensuite un plan d’exécution que les index peuvent accélérer.", "A query describes the desired result: FROM chooses sets, JOIN relates rows, WHERE filters before aggregation, GROUP BY forms groups, and ORDER BY guarantees order. The engine then chooses an execution plan that indexes can accelerate.", "يصف الاستعلام النتيجة المطلوبة؛ تختار FROM المجموعات وتربط JOIN الصفوف وترشح WHERE قبل التجميع وتكوّن GROUP BY المجموعات ويضمن ORDER BY الترتيب. ثم يختار المحرك خطة تنفيذ يمكن للفهارس تسريعها."),
      points: tr([
        "INNER JOIN exclut les commandes sans ligne ; LEFT JOIN les conserverait avec valeurs null, choix qui dépend de la question métier et non d’une préférence syntaxique.",
        "sum calcule en base sans transférer chaque ligne au serveur ; multiplier centimes par quantité garde le calcul entier et cohérent avec les snapshots.",
        "Un second critère id rend l’ordre déterministe lorsque deux commandes partagent created_at, condition indispensable à une pagination stable.",
      ], [
        "INNER JOIN excludes orders without lines; LEFT JOIN would retain them with nulls, a choice driven by the domain question rather than syntax preference.",
        "sum computes in the database without transferring every row to the server; multiplying cents by quantity keeps integer math aligned with snapshots.",
        "A secondary id criterion makes order deterministic when two orders share created_at, which is required for stable pagination.",
      ], [
        "تستبعد INNER JOIN الطلبات بلا أسطر؛ بينما تحفظها LEFT JOIN بقيم null، وهو اختيار تقرره مسألة المجال لا تفضيل الصياغة.",
        "تحسب sum داخل القاعدة بلا نقل كل صف إلى الخادم؛ ويحفظ ضرب السنتات في الكمية حساباً صحيحاً متناسقاً مع snapshots.",
        "يجعل معيار id ثانٍ الترتيب حتمياً عندما يشترك طلبان في created_at، وهو ضروري لصفحات ثابتة.",
      ]),
      general: tr("Écris la question métier en une phrase, sélectionne seulement les colonnes utiles et inspecte EXPLAIN ANALYZE avant d’ajouter un index.", "Write the domain question in one sentence, select only useful columns, and inspect EXPLAIN ANALYZE before adding an index.", "اكتب سؤال المجال في جملة واختر الأعمدة المفيدة فقط وافحص EXPLAIN ANALYZE قبل إضافة فهرس."),
      lecomax: tr("Le tableau admin L’ecomax obtient total et nombre de lignes par commande en une requête ordonnée plutôt qu’en N+1 appels.", "The L’ecomax admin table gets total and line count per order in one ordered query instead of N+1 calls.", "يحصل جدول إدارة L’ecomax على المجموع وعدد الأسطر لكل طلب في استعلام مرتب واحد بدلاً من N+1 استدعاء."),
      task: tr("Écrire une requête de chiffre d’affaires par jour, tester INNER/LEFT JOIN et expliquer le plan mesuré.", "Write a daily revenue query, test INNER/LEFT JOIN, and explain the measured plan.", "اكتب استعلام إيراد يومي واختبر INNER/LEFT JOIN واشرح الخطة المقاسة."),
      next: tr("La prochaine leçon protège plusieurs écritures avec transaction, index ciblés et migrations réversibles.", "The next lesson protects multiple writes with transactions, targeted indexes, and reversible migrations.", "يحمي الدرس التالي كتابات متعددة عبر transaction وفهارس مستهدفة وmigrations قابلة للعكس."),
    },
    {
      id: "sql-transactions-indexes", order: 3, language: "sql", filename: "supabase/migrations/2026071404_academy_stock_transaction.sql",
      commands: ["npm run validate:course"],
      source: [
        "begin;",
        "update products",
        "set stock = stock - 2",
        "where id = '00000000-0000-0000-0000-000000000001' and stock >= 2",
        "returning id, stock;",
        "-- Exiger exactement une ligne avant de créer order_items.",
        "insert into order_items (order_id, product_id, product_name, unit_price_cents, quantity)",
        "values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sac', 4990, 2);",
        "commit;",
      ].join("\n"),
      title: tr("Transactions, index et migrations", "Transactions, indexes, and migrations", "Transactions والفهارس وmigrations"),
      focus: tr("l’atomicité d’une mutation multi-table", "atomicity of a multi-table mutation", "ذرية تغيير متعدد الجداول"),
      mental: tr("Une transaction crée une frontière tout-ou-rien autour de plusieurs écritures : un échec doit restaurer l’état précédent. Les index accélèrent des accès précis au prix d’espace et de travail à l’écriture, tandis qu’une migration versionne chaque changement de schéma.", "A transaction creates an all-or-nothing boundary around several writes: a failure must restore the previous state. Indexes accelerate specific access patterns at the cost of space and write work, while migrations version every schema change.", "تنشئ transaction حداً كلياً أو لا شيء حول عدة كتابات؛ ويجب أن يعيد الفشل الحالة السابقة. تسرع الفهارس أنماط وصول محددة مقابل مساحة وعمل كتابة، بينما تصدر migrations كل تغيير للمخطط."),
      points: tr([
        "La condition stock >= 2 fusionne vérification et décrémentation dans une seule instruction atomique ; zéro ligne retournée signifie indisponibilité sans stock négatif.",
        "Créer order_items seulement après le succès stock et rollback à toute exception empêche une commande payée sans réservation ou une réservation sans ligne.",
        "Un index suit une requête fréquente sur filtre et ordre ; multiplier les index ralentit INSERT/UPDATE et ne corrige pas une requête qui sélectionne trop de données.",
      ], [
        "The stock >= 2 condition merges checking and decrement into one atomic statement; zero returned rows means unavailable without negative stock.",
        "Creating order_items only after stock succeeds and rolling back on any exception prevents paid orders without reservation or reservations without a line.",
        "An index follows a frequent filter and ordering query; multiplying indexes slows INSERT/UPDATE and does not fix a query selecting too much data.",
      ], [
        "يدمج شرط stock >= 2 الفحص والإنقاص في تعليمة ذرية واحدة؛ وتعني صفر صفوف معادة عدم التوفر بلا مخزون سالب.",
        "يمنع إنشاء order_items بعد نجاح المخزون فقط وrollback عند أي استثناء طلباً مدفوعاً بلا حجز أو حجزاً بلا سطر.",
        "يتبع الفهرس استعلام ترشيح وترتيب متكرراً؛ وتبطئ كثرة الفهارس INSERT/UPDATE ولا تصلح استعلاماً يختار بيانات كثيرة.",
      ]),
      general: tr("Regroupe les invariants liés dans une transaction, mesure les plans avant/après index et déploie le schéma par migrations répétables.", "Group related invariants in a transaction, measure plans before and after indexes, and deploy schema through repeatable migrations.", "اجمع invariants المرتبطة في transaction وقس الخطط قبل الفهارس وبعدها وانشر المخطط عبر migrations قابلة للتكرار."),
      lecomax: tr("L’ecomax décrémente le stock et crée les lignes ensemble ; ses migrations ajoutent contraintes et index sans édition manuelle de production.", "L’ecomax decrements stock and creates lines together; its migrations add constraints and indexes without manual production editing.", "ينقص L’ecomax المخزون وينشئ الأسطر معاً؛ وتضيف migrations القيود والفهارس بلا تعديل إنتاج يدوي."),
      task: tr("Simuler deux achats concurrents du dernier article, vérifier zéro stock négatif et documenter rollback et index utilisé.", "Simulate two concurrent purchases of the last item, verify no negative stock, and document rollback and the used index.", "حاك عمليتي شراء متزامنتين لآخر قطعة وتأكد من عدم وجود مخزون سالب ووثق rollback والفهرس المستخدم."),
      next: tr("Le module suivant applique ces principes avec les clients, Auth, RLS, Storage et Realtime de Supabase.", "The next module applies these principles with Supabase clients, Auth, RLS, Storage, and Realtime.", "تطبق الوحدة التالية هذه المبادئ باستخدام عملاء Supabase وAuth وRLS وStorage وRealtime."),
    },
  ],
};

const supabaseModule = {
  id: "supabase-platform",
  order: 16,
  icon: "⚡",
  color: "#16b277",
  files: [
    { path: "lib/supabase.ts", mode: "existing" },
    { path: "lib/db-server.ts", mode: "existing" },
    { path: "app/api/auth/signup/route.ts", mode: "existing" },
    { path: "scripts/setup-chat.mjs", mode: "existing" },
  ],
  locales: {
    fr: { title: "Supabase complet", summary: "Configurer les bons clients, écrire du CRUD, gérer sessions, appliquer RLS et intégrer fichiers et événements temps réel en sécurité." },
    en: { title: "Complete Supabase", summary: "Configure the right clients, write CRUD, manage sessions, enforce RLS, and integrate files and realtime events safely." },
    ar: { title: "Supabase الكامل", summary: "إعداد العملاء المناسبين وكتابة CRUD وإدارة الجلسات وتطبيق RLS ودمج الملفات والأحداث الفورية بأمان." },
  },
  analogy: tr("un bâtiment où Auth remet un badge, RLS contrôle chaque porte, Storage garde les colis et Realtime sonne lors d’un changement", "a building where Auth issues a badge, RLS checks every door, Storage holds parcels, and Realtime rings on change", "مبنى يصدر فيه Auth بطاقة ويفحص RLS كل باب ويحفظ Storage الطرود وينبه Realtime عند التغيير"),
  vocabulary: {
    fr: [["anon key", "Clé publique conçue pour fonctionner sous les politiques RLS."], ["service role", "Secret serveur contournant RLS et exigeant une protection absolue."], ["RLS", "Politiques PostgreSQL évaluées ligne par ligne selon l’utilisateur."], ["channel", "Abonnement Realtime à un ensemble d’événements."]],
    en: [["anon key", "A public key designed to operate under RLS policies."], ["service role", "A server secret bypassing RLS that requires absolute protection."], ["RLS", "PostgreSQL policies evaluated per row according to the user."], ["channel", "A Realtime subscription to a set of events."]],
    ar: [["anon key", "مفتاح عام مصمم للعمل تحت سياسات RLS."], ["service role", "سر خادم يتجاوز RLS ويتطلب حماية مطلقة."], ["RLS", "سياسات PostgreSQL تُقيّم لكل صف حسب المستخدم."], ["channel", "اشتراك Realtime في مجموعة أحداث."]],
  },
  errors: {
    fr: [["La requête retourne data null sans explication à l’écran.", "Le code ignore l’objet error de supabase-js.", "Teste error à chaque appel, journalise le contexte serveur et retourne un message sûr."], ["Une opération fonctionne avec service role mais échoue en navigateur.", "La politique RLS manque ou ne correspond pas à auth.uid().", "Teste avec un vrai utilisateur et écris une politique minimale pour l’action nécessaire."]],
    en: [["The query returns null data with no explanation on screen.", "Code ignores the supabase-js error object.", "Check error on every call, log server context, and return a safe message."], ["An operation works with service role but fails in the browser.", "The RLS policy is missing or does not match auth.uid().", "Test with a real user and write a minimal policy for the required action."]],
    ar: [["يعيد الاستعلام data بقيمة null بلا شرح على الشاشة.", "تتجاهل الشيفرة كائن error من supabase-js.", "افحص error في كل استدعاء وسجل سياق الخادم وأعد رسالة آمنة."], ["تنجح العملية بـ service role وتفشل في المتصفح.", "سياسة RLS غائبة أو لا تطابق auth.uid().", "اختبر بمستخدم حقيقي واكتب سياسة دنيا للإجراء المطلوب."]],
  },
  lessons: [
    {
      id: "supabase-clients-crud", order: 0, language: "typescript", filename: "lib/supabase.ts",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "import { createClient } from \"@supabase/supabase-js\";",
        "const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);",
        "export async function listProducts() {",
        "  const { data, error } = await supabase.from(\"products\")",
        "    .select(\"id, slug, name, price_cents, stock\")",
        "    .eq(\"active\", true).order(\"created_at\", { ascending: false }).range(0, 11);",
        "  if (error) throw new Error(\"Catalogue indisponible\");",
        "  return data;",
        "}",
      ].join("\n"),
      title: tr("Clients, variables et CRUD", "Clients, variables, and CRUD", "العملاء والمتغيرات وCRUD"),
      focus: tr("le choix du client Supabase", "choosing the Supabase client", "اختيار عميل Supabase"),
      mental: tr("Le client Supabase combine URL, clé et contexte d’authentification pour produire des requêtes PostgreSQL et Auth. Le navigateur utilise anon sous RLS, le serveur peut transmettre la session, et service role reste réservé à une opération privilégiée strictement contrôlée.", "A Supabase client combines URL, key, and authentication context to issue PostgreSQL and Auth requests. The browser uses anon under RLS, the server may forward a session, and service role stays reserved for tightly controlled privileged work.", "يجمع عميل Supabase الرابط والمفتاح وسياق المصادقة لإصدار طلبات PostgreSQL وAuth. يستخدم المتصفح anon تحت RLS، وقد يمرر الخادم الجلسة، ويبقى service role لعمل مميز مضبوط بدقة."),
      points: tr([
        "NEXT_PUBLIC rend URL et anon visibles dans le bundle, ce qui est prévu seulement parce que RLS protège les données ; service role ne porte jamais ce préfixe.",
        "select énumère les colonnes utiles, eq traduit un filtre, order stabilise l’affichage et range limite le volume ; data et error forment le résultat à traiter.",
        "Les opérations create, read, update et delete passent par des politiques et une validation métier ; la commodité du SDK ne transforme pas une entrée en donnée fiable.",
      ], [
        "NEXT_PUBLIC makes URL and anon visible in the bundle, which is intended only because RLS protects data; service role never carries this prefix.",
        "select lists useful columns, eq translates a filter, order stabilizes display, and range limits volume; data and error form the result to handle.",
        "Create, read, update, and delete operations pass through policies and domain validation; SDK convenience does not make input trustworthy.",
      ], [
        "يجعل NEXT_PUBLIC الرابط وanon ظاهرين في الحزمة، وهذا مقصود فقط لأن RLS يحمي البيانات؛ ولا يحمل service role هذه السابقة أبداً.",
        "يسرد select الأعمدة المفيدة ويترجم eq مرشحاً ويثبت order العرض ويحد range الحجم؛ وتشكل data وerror النتيجة الواجب معالجتها.",
        "تمر عمليات create وread وupdate وdelete عبر السياسات وتحقق المجال؛ ولا تجعل سهولة SDK المدخل موثوقاً.",
      ]),
      general: tr("Crée un client par environnement d’exécution, sélectionne le minimum de données nécessaires et traite error avant d’utiliser data.", "Create a client for each execution environment, select the least data needed, and handle error before using data.", "أنشئ عميلاً لكل بيئة تنفيذ واختر أقل بيانات لازمة وعالج error قبل استخدام data."),
      lecomax: tr("L’ecomax lit son catalogue public avec anon/RLS et réserve db-server/service role aux tâches admin validées côté serveur.", "L’ecomax reads its public catalog with anon/RLS and reserves db-server/service role for validated server-side admin tasks.", "يقرأ L’ecomax كتالوجه العام عبر anon/RLS ويخصص db-server/service role لمهام الإدارة المتحقق منها على الخادم."),
      task: tr("Lister douze produits actifs, gérer error et comparer le résultat anon avec une requête service role serveur.", "List twelve active products, handle error, and compare the anon result with a server service-role query.", "اسرد اثني عشر منتجاً نشطاً وعالج error وقارن نتيجة anon باستعلام service role على الخادم."),
      next: tr("La prochaine leçon crée identité et session puis protège le cycle connexion/déconnexion.", "The next lesson creates identity and session and secures login/logout lifecycle.", "ينشئ الدرس التالي الهوية والجلسة ويحمي دورة الدخول/الخروج."),
    },
    {
      id: "supabase-auth-sessions", order: 1, language: "typescript", filename: "app/api/auth/signup/route.ts",
      commands: ["npm run dev", "curl.exe -i -X POST http://localhost:3000/api/auth/signup -H \"Content-Type: application/json\" --data \"{}\""],
      source: [
        "const { data, error } = await supabase.auth.signUp({",
        "  email: input.email.trim().toLowerCase(),",
        "  password: input.password,",
        "  options: { emailRedirectTo: `${origin}/connexion` },",
        "});",
        "if (error) return Response.json({ error: \"Inscription impossible\" }, { status: 400 });",
        "return Response.json({ userId: data.user?.id ?? null, confirmationRequired: !data.session },",
        "  { status: 201 });",
      ].join("\n"),
      title: tr("Auth, identité et sessions", "Auth, identity, and sessions", "Auth والهوية والجلسات"),
      focus: tr("le cycle de vie d’une session utilisateur", "the user session lifecycle", "دورة حياة جلسة المستخدم"),
      mental: tr("Auth prouve une identité et émet une session limitée dans le temps ; l’application utilise cette identité pour autoriser des actions, pas pour faire confiance à toutes les données du client. Inscription, confirmation, renouvellement et déconnexion sont des états distincts à rendre explicitement.", "Auth proves an identity and issues a time-limited session; the application uses that identity to authorize actions, not to trust all client data. Signup, confirmation, renewal, and sign-out are distinct states to render explicitly.", "يثبت Auth هوية ويصدر جلسة محدودة زمنياً؛ ويستخدم التطبيق الهوية لتفويض الإجراءات لا للثقة بكل بيانات العميل. التسجيل والتأكيد والتجديد والخروج حالات منفصلة يجب عرضها صراحة."),
      points: tr([
        "L’email est normalisé pour l’expérience mais Supabase reste responsable de l’identité ; un message public évite de révéler si un compte précis existe.",
        "Si la confirmation email est active, signUp peut retourner un utilisateur sans session ; l’interface doit demander la confirmation au lieu de prétendre être connectée.",
        "Une route serveur relit la session depuis un cookie protégé et vérifie expiration ; un userId envoyé dans le body ne prouve jamais l’identité de l’appelant.",
      ], [
        "Email is normalized for usability while Supabase remains responsible for identity; a public message avoids revealing whether a specific account exists.",
        "When email confirmation is enabled, signUp may return a user without a session; the UI must request confirmation rather than pretending login succeeded.",
        "A server route rereads the session from a protected cookie and checks expiry; a userId sent in the body never proves caller identity.",
      ], [
        "يُطبع البريد لسهولة الاستخدام بينما يبقى Supabase مسؤولاً عن الهوية؛ وتمنع رسالة عامة كشف وجود حساب محدد.",
        "عند تفعيل تأكيد البريد قد يعيد signUp مستخدماً بلا session؛ ويجب أن تطلب الواجهة التأكيد بدلاً من ادعاء نجاح الدخول.",
        "تعيد route الخادم قراءة الجلسة من cookie محمية وتفحص الانتهاء؛ ولا يثبت userId مرسل في body هوية المستدعي أبداً.",
      ]),
      general: tr("Modélise anonymous, confirmation-required, authenticated et expired, puis teste chaque transition et redirection.", "Model anonymous, confirmation-required, authenticated, and expired states, then test every transition and redirect.", "نمذج حالات anonymous وconfirmation-required وauthenticated وexpired ثم اختبر كل انتقال وتحويل."),
      lecomax: tr("L’ecomax confirme l’inscription, attache commandes et adresses à auth.uid() et efface la session côté serveur lors de la déconnexion.", "L’ecomax confirms signup, attaches orders and addresses to auth.uid(), and clears the server session on sign-out.", "يؤكد L’ecomax التسجيل ويربط الطلبات والعناوين بـ auth.uid() ويمسح جلسة الخادم عند الخروج."),
      task: tr("Tester inscription avec et sans confirmation, session expirée et déconnexion, sans jamais accepter userId du formulaire.", "Test signup with and without confirmation, expired session, and sign-out without ever accepting userId from the form.", "اختبر التسجيل مع التأكيد وبدونه والجلسة المنتهية والخروج من دون قبول userId من النموذج."),
      next: tr("La prochaine leçon transforme cette identité en politiques RLS par table et opération.", "The next lesson turns this identity into RLS policies per table and operation.", "يحول الدرس التالي هذه الهوية إلى سياسات RLS لكل جدول وعملية."),
    },
    {
      id: "supabase-rls-policies", order: 2, language: "sql", filename: "supabase/migrations/2026071405_academy_orders_rls.sql",
      commands: ["npm run validate:course"],
      source: [
        "alter table orders enable row level security;",
        "create policy \"customers read own orders\"",
        "on orders for select",
        "to authenticated",
        "using (user_id = auth.uid());",
        "create policy \"customers create own orders\"",
        "on orders for insert",
        "to authenticated",
        "with check (user_id = auth.uid());",
      ].join("\n"),
      title: tr("RLS et moindre privilège", "RLS and least privilege", "RLS وأقل صلاحية"),
      focus: tr("l’autorisation ligne par ligne", "row-by-row authorization", "التفويض صفاً بصف"),
      mental: tr("RLS ajoute un filtre de sécurité au moteur PostgreSQL pour chaque opération et chaque rôle. USING décide quelles lignes existantes sont visibles ou modifiables, tandis que WITH CHECK décide quelles nouvelles valeurs peuvent être insérées ou conservées après update.", "RLS adds a security filter inside PostgreSQL for every operation and role. USING decides which existing rows are visible or mutable, while WITH CHECK decides which new values may be inserted or retained after update.", "يضيف RLS مرشح أمان داخل PostgreSQL لكل عملية ودور. يقرر USING الصفوف الموجودة المرئية أو القابلة للتغيير، بينما يقرر WITH CHECK القيم الجديدة المسموح إدخالها أو حفظها بعد update."),
      points: tr([
        "Activer RLS sans politique ferme l’accès anon/authenticated par défaut, approche deny-by-default qui oblige à déclarer précisément chaque besoin.",
        "La politique SELECT compare user_id stocké à auth.uid() issu du jeton vérifié ; elle n’utilise jamais un paramètre fourni librement par le navigateur.",
        "SELECT, INSERT, UPDATE et DELETE ont des risques différents et méritent des politiques séparées testées comme propriétaire, autre client et visiteur.",
      ], [
        "Enabling RLS without a policy closes anon/authenticated access by default, a deny-by-default approach that requires every need to be declared precisely.",
        "The SELECT policy compares stored user_id with auth.uid() from the verified token; it never uses a freely supplied browser parameter.",
        "SELECT, INSERT, UPDATE, and DELETE carry different risks and deserve separate policies tested as owner, other customer, and visitor.",
      ], [
        "يغلق تفعيل RLS بلا سياسة وصول anon/authenticated افتراضياً، وهو نهج منع افتراضي يجبر على إعلان كل حاجة بدقة.",
        "تقارن سياسة SELECT ‏user_id المخزن بـ auth.uid() القادم من token متحقق منه؛ ولا تستخدم معاملاً يقدمه المتصفح بحرية.",
        "تحمل SELECT وINSERT وUPDATE وDELETE مخاطر مختلفة وتستحق سياسات منفصلة تُختبر كمالك وعميل آخر وزائر.",
      ]),
      general: tr("Écris une matrice rôle × opération × lignes autorisées, active RLS puis prouve les refus autant que les succès.", "Write a role × operation × allowed rows matrix, enable RLS, and prove denials as thoroughly as successes.", "اكتب مصفوفة دور × عملية × صفوف مسموحة وفعل RLS ثم أثبت الرفض بقدر إثبات النجاح."),
      lecomax: tr("Un client L’ecomax lit ses propres commandes, un agent autorisé gère le support et anon ne voit aucune adresse ni commande.", "An L’ecomax customer reads their own orders, an authorized agent handles support, and anon sees no address or order.", "يقرأ عميل L’ecomax طلباته ويتولى موظف مخول الدعم ولا يرى anon أي عنوان أو طلب."),
      task: tr("Construire la matrice orders, écrire quatre politiques minimales et tester client A, client B, anon et service role.", "Build the orders matrix, write four minimal policies, and test customer A, customer B, anon, and service role.", "أنشئ مصفوفة orders واكتب أربع سياسات دنيا واختبر العميل A والعميل B وanon وservice role."),
      next: tr("La prochaine leçon sécurise fichiers Storage et événements Realtime avec validation et cleanup.", "The next lesson secures Storage files and Realtime events with validation and cleanup.", "يؤمن الدرس التالي ملفات Storage وأحداث Realtime بالتحقق وcleanup."),
    },
    {
      id: "supabase-storage-realtime", order: 3, language: "typescript", filename: "lib/supabase.ts",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "const path = `${user.id}/${crypto.randomUUID()}.jpg`;",
        "const { error: uploadError } = await supabase.storage.from(\"review-photos\")",
        "  .upload(path, file, { contentType: \"image/jpeg\", upsert: false });",
        "if (uploadError) throw new Error(\"Upload impossible\");",
        "const channel = supabase.channel(`orders:${user.id}`)",
        "  .on(\"postgres_changes\", { event: \"UPDATE\", schema: \"public\", table: \"orders\", filter: `user_id=eq.${user.id}` },",
        "    (payload) => console.log(payload.new))",
        "  .subscribe();",
        "// Cleanup React : return () => { void supabase.removeChannel(channel); };",
      ].join("\n"),
      title: tr("Storage et Realtime", "Storage and Realtime", "Storage وRealtime"),
      focus: tr("les fichiers et événements soumis aux mêmes permissions", "files and events under the same permissions", "الملفات والأحداث الخاضعة للصلاحيات نفسها"),
      mental: tr("Storage organise des objets dans des buckets et chemins auxquels s’appliquent des politiques, tandis que Realtime diffuse des changements déjà autorisés. Ni le type déclaré par le navigateur ni un filtre de canal ne remplace validation serveur et RLS.", "Storage organizes objects in buckets and paths governed by policies, while Realtime broadcasts already-authorized changes. Neither a browser-declared file type nor a channel filter replaces server validation and RLS.", "ينظم Storage الكائنات في buckets ومسارات تحكمها السياسات، بينما يبث Realtime تغييرات مصرحاً بها. لا يستبدل نوع ملف يعلنه المتصفح ولا مرشح channel تحقق الخادم وRLS."),
      points: tr([
        "Le serveur limite taille, type réel, extension et nombre de fichiers ; un nom aléatoire sous le dossier user.id évite collisions et traversée de chemin.",
        "Un bucket public convient aux médias volontairement publics, tandis que factures et documents privés exigent bucket privé et URL signée courte.",
        "L’abonnement Realtime filtre les commandes utilisateur mais la politique SELECT reste l’autorité ; removeChannel en cleanup évite abonnements doublés et fuites.",
      ], [
        "The server limits size, actual type, extension, and file count; a random name under user.id avoids collisions and path traversal.",
        "A public bucket fits intentionally public media, while invoices and private documents require a private bucket and short-lived signed URL.",
        "The Realtime subscription filters user orders but the SELECT policy remains authoritative; removeChannel cleanup prevents duplicate subscriptions and leaks.",
      ], [
        "يحد الخادم الحجم والنوع الحقيقي والامتداد وعدد الملفات؛ ويمنع اسم عشوائي تحت user.id التصادم واجتياز المسار.",
        "يناسب bucket عام الوسائط العامة عمداً، بينما تتطلب الفواتير والمستندات الخاصة bucket خاصاً ورابطاً موقعاً قصير العمر.",
        "يرشح اشتراك Realtime طلبات المستخدم لكن تبقى سياسة SELECT المرجع؛ ويمنع cleanup عبر removeChannel الاشتراكات المكررة والتسرب.",
      ]),
      general: tr("Classe le fichier comme public ou privé, valide son contenu et la politique du chemin, puis abonne-toi seulement aux événements nécessaires avec cleanup.", "Classify a file as public or private, validate its content and path policy, and subscribe only to required events with cleanup.", "صنف الملف عاماً أو خاصاً وتحقق من محتواه وسياسة مساره واشترك فقط في الأحداث المطلوبة مع cleanup."),
      lecomax: tr("L’ecomax place les photos d’avis dans un bucket public contrôlé, garde les documents privés derrière une URL signée et met à jour le statut des commandes par Realtime autorisé.", "L’ecomax stores review photos in a controlled public bucket, keeps private documents behind signed URLs, and updates authorized order status through Realtime.", "يضع L’ecomax صور المراجعات في bucket عام مضبوط ويحفظ المستندات الخاصة خلف روابط موقعة ويحدث حالة الطلب عبر Realtime المصرح."),
      task: tr("Valider une image, l’uploader sous user.id, tester l’accès d’un autre utilisateur et nettoyer un abonnement Realtime.", "Validate an image, upload it under user.id, test access by another user, and clean up a Realtime subscription.", "تحقق من صورة وارفعها تحت user.id واختبر وصول مستخدم آخر ونظف اشتراك Realtime."),
      next: tr("Le module suivant assemble catalogue, panier, checkout, commande, paiement et stock en un flux e-commerce cohérent.", "The next module assembles catalog, cart, checkout, order, payment, and stock into a coherent ecommerce flow.", "تجمع الوحدة التالية الكتالوج والسلة وcheckout والطلب والدفع والمخزون في تدفق تجارة متناسق."),
    },
  ],
};

const ecommerceModule = {
  id: "ecommerce-architecture",
  order: 17,
  icon: "🛒",
  color: "#a855f7",
  files: [
    { path: "components/CartContext.tsx", mode: "existing" },
    { path: "app/checkout/page.tsx", mode: "existing" },
    { path: "app/api/orders/route.ts", mode: "existing" },
    { path: "app/api/products/route.ts", mode: "existing" },
  ],
  locales: {
    fr: { title: "Architecture e-commerce complète", summary: "Relier catalogue, variantes, panier, argent, checkout, commande, paiement et stock sans faire confiance au navigateur." },
    en: { title: "Complete ecommerce architecture", summary: "Connect catalog, variants, cart, money, checkout, order, payment, and stock without trusting the browser." },
    ar: { title: "بنية التجارة الإلكترونية الكاملة", summary: "ربط الكتالوج والمتغيرات والسلة والأموال وcheckout والطلب والدفع والمخزون بلا ثقة بالمتصفح." },
  },
  analogy: tr("une chaîne de contrôle où chaque poste vérifie le reçu avant de transmettre le colis au suivant", "a control chain where every station verifies the receipt before passing the parcel onward", "سلسلة تحكم تتحقق فيها كل محطة من الإيصال قبل تمرير الطرد إلى التالية"),
  vocabulary: {
    fr: [["variant", "Combinaison vendable de produit, taille, couleur et stock."], ["snapshot", "Copie historique des données au moment de l’achat."], ["idempotency", "Propriété garantissant qu’une répétition n’applique pas deux fois l’effet."], ["webhook", "Requête serveur signée envoyée par un service lors d’un événement."]],
    en: [["variant", "A sellable product, size, color, and stock combination."], ["snapshot", "A historical copy of data at purchase time."], ["idempotency", "A property ensuring repetition does not apply an effect twice."], ["webhook", "A signed server request sent by a service when an event occurs."]],
    ar: [["variant", "تركيبة قابلة للبيع من المنتج والمقاس واللون والمخزون."], ["snapshot", "نسخة تاريخية من البيانات عند الشراء."], ["idempotency", "خاصية تضمن ألا يطبق التكرار الأثر مرتين."], ["webhook", "طلب خادم موقع ترسله خدمة عند وقوع حدث."]],
  },
  errors: {
    fr: [["Le total payé diffère du catalogue.", "L’API accepte prix ou total calculé par le navigateur.", "Recharge prix, coupon, livraison et taxes côté serveur avant de créer le paiement."], ["Un double clic crée deux commandes.", "Aucune clé d’idempotence ni contrainte unique ne relie les tentatives.", "Associe une clé stable à la tentative et retourne la première commande lors d’une répétition."]],
    en: [["The paid total differs from the catalog.", "The API accepts price or total calculated by the browser.", "Reload prices, coupon, shipping, and taxes on the server before creating payment."], ["A double click creates two orders.", "No idempotency key or unique constraint links attempts.", "Attach a stable key to the attempt and return the first order on repetition."]],
    ar: [["يختلف المجموع المدفوع عن الكتالوج.", "تقبل API سعراً أو مجموعاً حسبه المتصفح.", "أعد تحميل الأسعار والكوبون والشحن والضرائب على الخادم قبل إنشاء الدفع."], ["تنشئ نقرة مزدوجة طلبين.", "لا يربط المحاولات مفتاح idempotency ولا قيد فريد.", "اربط مفتاحاً ثابتاً بالمحاولة وأعد الطلب الأول عند التكرار."]],
  },
  lessons: [
    {
      id: "commerce-catalog-variants-stock", order: 0, language: "typescript", filename: "app/api/products/route.ts",
      commands: ["npm run dev", "curl.exe -i http://localhost:3000/api/products"],
      source: [
        "type Variant = { id: string; size: string; color: string; stock: number };",
        "type Product = { id: string; slug: string; name: string; variants: Variant[] };",
        "function availableVariants(product: Product) {",
        "  return product.variants.filter((variant) => variant.stock > 0);",
        "}",
        "function findVariant(product: Product, variantId: string) {",
        "  return product.variants.find((variant) => variant.id === variantId) ?? null;",
        "}",
      ].join("\n"),
      title: tr("Catalogue, variantes et stock", "Catalog, variants, and stock", "الكتالوج والمتغيرات والمخزون"),
      focus: tr("l’identité d’une variante vendable", "identity of a sellable variant", "هوية المتغير القابل للبيع"),
      mental: tr("Le produit rassemble contenu et marketing, tandis que la variante représente l’unité réellement choisie, tarifée et stockée. Une taille-couleur possède donc son propre identifiant et stock ; l’interface ne doit jamais reconstruire cette identité depuis des libellés fragiles.", "A product groups content and marketing, while a variant represents the unit actually selected, priced, and stocked. A size-color combination therefore has its own identifier and stock; the interface must never reconstruct identity from fragile labels.", "يجمع المنتج المحتوى والتسويق، بينما يمثل variant الوحدة المختارة والمسعرة والمخزنة فعلاً. لذلك تملك تركيبة المقاس واللون معرفاً ومخزوناً خاصين ولا ينبغي للواجهة إعادة بناء الهوية من تسميات هشة."),
      points: tr([
        "Product.id identifie le modèle et Variant.id la combinaison achetable ; le panier transporte variantId afin que serveur et stock parlent exactement de la même ligne.",
        "Le stock affiché guide le choix mais reste une photographie susceptible de changer ; seule la validation atomique au checkout réserve réellement l’article.",
        "Images, libellés et ordre de couleurs peuvent changer sans casser les commandes, parce que les relations s’appuient sur identifiants stables et snapshots.",
      ], [
        "Product.id identifies the model and Variant.id the purchasable combination; the cart carries variantId so server and stock refer to the exact same row.",
        "Displayed stock guides selection but remains a snapshot that can change; only atomic checkout validation actually reserves an item.",
        "Images, labels, and color order may change without breaking orders because relationships use stable identifiers and snapshots.",
      ], [
        "يعرف Product.id النموذج ويعرف Variant.id التركيبة القابلة للشراء؛ وتحمل السلة variantId حتى يشير الخادم والمخزون إلى الصف نفسه.",
        "يرشد المخزون المعروض الاختيار لكنه snapshot قد تتغير؛ ولا يحجز القطعة فعلاً إلا تحقق checkout الذري.",
        "يمكن أن تتغير الصور والتسميات وترتيب الألوان بلا كسر الطلبات لأن العلاقات تعتمد معرفات ثابتة وsnapshots.",
      ]),
      general: tr("Modélise ce qui se vend séparément de ce qui se présente, puis donne à chaque unité stockée une identité stable.", "Model what is sold separately from what is presented, then give every stocked unit a stable identity.", "نمذج ما يباع منفصلاً عما يعرض ثم امنح كل وحدة مخزنة هوية ثابتة."),
      lecomax: tr("L’ecomax transmet variantId pour une taille/couleur et désactive les combinaisons épuisées sans supprimer la fiche produit.", "L’ecomax sends variantId for a size/color and disables sold-out combinations without removing the product page.", "يرسل L’ecomax ‏variantId لمقاس/لون ويعطل التركيبات النافدة من دون حذف صفحة المنتج."),
      task: tr("Modéliser trois variantes, afficher seulement les choix valides et tester une variante supprimée entre fiche et checkout.", "Model three variants, display only valid choices, and test a variant removed between product page and checkout.", "نمذج ثلاثة متغيرات واعرض الخيارات الصالحة فقط واختبر variant حُذف بين الصفحة وcheckout."),
      next: tr("La prochaine leçon construit un panier minimal et calcule l’argent sans erreur flottante.", "The next lesson builds a minimal cart and calculates money without floating-point errors.", "يبني الدرس التالي سلة دنيا ويحسب الأموال بلا أخطاء الفاصلة العائمة."),
    },
    {
      id: "commerce-cart-money", order: 1, language: "tsx", filename: "components/CartContext.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "type CartLine = { variantId: string; quantity: number; unitPriceCents: number };",
        "const lines: CartLine[] = [{ variantId: \"bag-black\", quantity: 2, unitPriceCents: 4990 }];",
        "const subtotalCents = lines.reduce((sum, line) =>",
        "  sum + line.unitPriceCents * line.quantity, 0);",
        "const shippingCents = subtotalCents >= 8000 ? 0 : 590;",
        "const totalCents = subtotalCents + shippingCents;",
        "const totalLabel = new Intl.NumberFormat(\"fr-FR\", { style: \"currency\", currency: \"EUR\" })",
        "  .format(totalCents / 100);",
      ].join("\n"),
      title: tr("Panier, quantités et argent", "Cart, quantities, and money", "السلة والكميات والأموال"),
      focus: tr("le calcul déterministe d’un panier", "deterministic cart calculation", "الحساب الحتمي للسلة"),
      mental: tr("Le panier client est une intention composée d’identifiants et quantités, pas une autorité sur les prix. Les montants restent en centimes entiers pendant tous les calculs et ne deviennent une chaîne localisée qu’au dernier moment de l’affichage.", "The client cart is an intent made of identifiers and quantities, not an authority over prices. Amounts remain integer cents throughout calculations and become a localized string only at the final display step.", "سلة العميل نية مكونة من معرفات وكميات وليست مرجعاً للأسعار. تبقى المبالغ سنتات صحيحة طوال الحسابات ولا تصبح سلسلة محلية إلا في خطوة العرض الأخيرة."),
      points: tr([
        "Une ligne unique par variantId fusionne les ajouts répétés, borne quantity entre un et une limite raisonnable et supprime la ligne quand l’utilisateur choisit retirer.",
        "subtotal, livraison et total sont dérivés des lignes ; les stocker séparément permettrait des désynchronisations lors d’un changement de quantité.",
        "localStorage améliore la continuité mais reste modifiable : le serveur ignore unitPriceCents client et recharge chaque variante avant validation.",
      ], [
        "One line per variantId merges repeated additions, bounds quantity between one and a reasonable limit, and removes the line when the user chooses removal.",
        "Subtotal, shipping, and total derive from lines; storing them separately would allow desynchronization when quantity changes.",
        "localStorage improves continuity but is editable: the server ignores client unitPriceCents and reloads every variant before validation.",
      ], [
        "يدمج سطر واحد لكل variantId الإضافات المتكررة ويحد quantity بين واحد وحد معقول ويحذف السطر عندما يختار المستخدم الإزالة.",
        "يشتق المجموع الفرعي والشحن والمجموع من الأسطر؛ وتخزينها منفصلة يسمح بعدم التزامن عند تغير الكمية.",
        "يحسن localStorage الاستمرارية لكنه قابل للتعديل؛ فيتجاهل الخادم unitPriceCents من العميل ويعيد تحميل كل variant قبل التحقق.",
      ]),
      general: tr("Conserve identifiants et quantités, dérive les montants en entiers et traite toute persistance navigateur comme non fiable.", "Store identifiers and quantities, derive amounts as integers, and treat all browser persistence as untrusted.", "احفظ المعرفات والكميات واشتق المبالغ كأعداد صحيحة وعامل كل تخزين متصفح كغير موثوق."),
      lecomax: tr("CartContext L’ecomax offre une UX instantanée, mais l’API orders recalcule chaque centime depuis Supabase.", "L’ecomax CartContext provides instant UX, but the orders API recalculates every cent from Supabase.", "يوفر CartContext في L’ecomax تجربة فورية لكن API الطلبات تعيد حساب كل سنت من Supabase."),
      task: tr("Implémenter ajout fusionné, quantité bornée, suppression et formatage EUR, puis falsifier localStorage pour prouver la revalidation.", "Implement merged addition, bounded quantity, removal, and EUR formatting, then tamper with localStorage to prove revalidation.", "نفذ الإضافة المدمجة والكمية المحدودة والحذف وتنسيق EUR ثم عبث بـ localStorage لإثبات إعادة التحقق."),
      next: tr("La prochaine leçon transforme cette intention en commande et snapshots après validation serveur.", "The next lesson turns this intent into an order and snapshots after server validation.", "يحول الدرس التالي هذه النية إلى طلب وsnapshots بعد تحقق الخادم."),
    },
    {
      id: "commerce-checkout-orders", order: 2, language: "typescript", filename: "app/api/orders/route.ts",
      commands: ["npm run dev", "npx tsc --noEmit", "npm run build"],
      source: [
        "const requested = input.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity }));",
        "const variants = await loadVariants(requested.map((item) => item.variantId));",
        "const snapshots = requested.map((item) => {",
        "  const variant = variants.find((row) => row.id === item.variantId);",
        "  if (!variant || item.quantity < 1 || item.quantity > variant.stock) throw new Error(\"Article indisponible\");",
        "  return { variantId: variant.id, name: variant.product_name, unitPriceCents: variant.price_cents, quantity: item.quantity };",
        "});",
        "const subtotalCents = snapshots.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);",
        "const order = await createOrderWithItems({ snapshots, subtotalCents });",
      ].join("\n"),
      title: tr("Checkout, commandes et snapshots", "Checkout, orders, and snapshots", "Checkout والطلبات وsnapshots"),
      focus: tr("la création serveur d’une commande", "server-side order creation", "إنشاء الطلب على الخادم"),
      mental: tr("Le checkout collecte une intention et une adresse, puis le serveur reconstruit la vérité depuis la base : variantes, prix, stock, coupon et livraison. Une commande est créée avec ses lignes historiques dans une transaction et possède un état explicite avant tout paiement.", "Checkout collects intent and an address, then the server rebuilds truth from the database: variants, prices, stock, coupon, and shipping. An order and its historical lines are created in a transaction with an explicit state before payment.", "يجمع checkout النية والعنوان ثم يعيد الخادم بناء الحقيقة من القاعدة: المتغيرات والأسعار والمخزون والكوبون والشحن. يُنشأ الطلب وأسطره التاريخية في transaction بحالة صريحة قبل الدفع."),
      points: tr([
        "L’API accepte variantId et quantity mais ignore nom, prix et total client ; elle exige que toutes les variantes demandées existent et soient encore disponibles.",
        "Les snapshots figent nom, prix unitaire et variante achetés, alors que l’adresse est normalisée et conservée selon la politique de confidentialité.",
        "Le statut pending_payment distingue une commande préparée d’une commande paid ; une page merci ne constitue jamais une preuve de paiement.",
      ], [
        "The API accepts variantId and quantity but ignores client name, price, and total; it requires every requested variant to exist and remain available.",
        "Snapshots freeze purchased name, unit price, and variant, while the address is normalized and retained under the privacy policy.",
        "pending_payment distinguishes a prepared order from a paid order; a thank-you page is never proof of payment.",
      ], [
        "تقبل API ‏variantId وquantity لكنها تتجاهل الاسم والسعر والمجموع من العميل؛ وتتطلب وجود كل variant مطلوب وبقاءه متاحاً.",
        "تجمد snapshots الاسم وسعر الوحدة والمتغير المشترى، بينما يطبع العنوان ويحفظ وفق سياسة الخصوصية.",
        "تميز pending_payment الطلب المجهز عن paid؛ وليست صفحة الشكر دليلاً على الدفع أبداً.",
      ]),
      general: tr("Recalcule chaque règle côté serveur, crée commande et lignes atomiquement et rends les transitions de statut monotones et auditées.", "Recalculate every rule on the server, create order and lines atomically, and keep status transitions monotonic and audited.", "أعد حساب كل قاعدة على الخادم وأنشئ الطلب والأسطر ذرياً واجعل انتقالات الحالة أحادية الاتجاه ومدققة."),
      lecomax: tr("L’API orders L’ecomax valide stock, recalcule montant, snapshot les lignes et renvoie orderId sans marquer paid.", "The L’ecomax orders API validates stock, recalculates amount, snapshots lines, and returns orderId without marking it paid.", "تتحقق API الطلبات في L’ecomax من المخزون وتعيد حساب المبلغ وتأخذ snapshots للأسطر وتعيد orderId من دون وضع paid."),
      task: tr("Créer une commande avec deux lignes, falsifier prix/quantité et vérifier transaction, statuts et messages retournés.", "Create an order with two lines, tamper with price/quantity, and verify transaction, statuses, and returned messages.", "أنشئ طلباً بسطرين وعبث بالسعر/الكمية وافحص transaction والحالات والرسائل المعادة."),
      next: tr("La prochaine leçon confirme le paiement par webhook signé, idempotent et concurrent-safe.", "The next lesson confirms payment through a signed, idempotent, concurrency-safe webhook.", "يؤكد الدرس التالي الدفع عبر webhook موقع وidempotent وآمن مع التزامن."),
    },
    {
      id: "commerce-payments-idempotency", order: 3, language: "typescript", filename: "app/api/orders/route.ts",
      commands: ["npx tsc --noEmit", "npm run build"],
      source: [
        "const event = await verifyWebhookSignature(request);",
        "if (event.type !== \"PAYMENT.CAPTURE.COMPLETED\") return new Response(null, { status: 204 });",
        "const existing = await findProcessedEvent(event.id);",
        "if (existing) return Response.json({ received: true });",
        "await inTransaction(async (tx) => {",
        "  const order = await tx.lockOrderByProviderId(event.orderId);",
        "  if (order.total_cents !== event.amountCents || event.currency !== \"EUR\") throw new Error(\"Montant incohérent\");",
        "  await tx.markPaidAndRecordEvent(order.id, event.id);",
        "});",
        "return Response.json({ received: true });",
      ].join("\n"),
      title: tr("Paiement, webhook et idempotence", "Payment, webhooks, and idempotency", "الدفع وwebhooks وidempotency"),
      focus: tr("la confirmation fiable d’un paiement", "reliable payment confirmation", "التأكيد الموثوق للدفع"),
      mental: tr("Le navigateur peut lancer le paiement mais seul le fournisseur confirme son résultat via une notification serveur signée. Le webhook est livré au moins une fois, parfois en retard ou dans un ordre différent ; le traitement doit donc vérifier signature, montant, devise, identité et idempotence.", "The browser may start payment, but only the provider confirms its result through a signed server notification. A webhook is delivered at least once, possibly late or out of order, so handling must verify signature, amount, currency, identity, and idempotency.", "قد يبدأ المتصفح الدفع لكن المزود وحده يؤكد النتيجة عبر إشعار خادم موقع. يُسلم webhook مرة على الأقل وقد يتأخر أو يصل بترتيب مختلف، لذلك يجب التحقق من التوقيع والمبلغ والعملة والهوية وidempotency."),
      points: tr([
        "La signature est vérifiée sur la requête selon le protocole fournisseur avant de faire confiance au body ; connaître un orderId n’autorise pas à marquer paid.",
        "event.id possède une contrainte unique : rejouer la notification retourne succès sans recréer email, points, décrémentation ou remboursement.",
        "Verrouiller la commande et comparer total/devise empêche deux événements concurrents ou un montant partiel de produire une transition incohérente.",
      ], [
        "The signature is verified according to the provider protocol before trusting the body; knowing an orderId does not authorize marking it paid.",
        "event.id has a unique constraint: replay returns success without recreating email, points, stock decrement, or refund.",
        "Locking the order and comparing total/currency prevents concurrent events or a partial amount from producing an inconsistent transition.",
      ], [
        "يُتحقق من التوقيع وفق بروتوكول المزود قبل الثقة في body؛ ولا يسمح معرفة orderId بوضع paid.",
        "يملك event.id قيداً فريداً؛ فإعادة الإشعار تعيد نجاحاً بلا إعادة إنشاء البريد أو النقاط أو إنقاص المخزون أو الاسترداد.",
        "يمنع قفل الطلب ومقارنة المجموع/العملة الأحداث المتزامنة أو المبلغ الجزئي من إنتاج انتقال غير متناسق.",
      ]),
      general: tr("Considère chaque webhook non fiable et répétable, vérifie sa preuve externe et enregistre événement plus effet dans une transaction.", "Treat every webhook as untrusted and repeatable, verify external proof, and record event plus effect in one transaction.", "عامل كل webhook كغير موثوق وقابل للتكرار وتحقق من الدليل الخارجي وسجل الحدث والأثر في transaction واحدة."),
      lecomax: tr("L’ecomax marque paid seulement après webhook vérifié, puis déclenche confirmation et stock une fois grâce à event.id unique.", "L’ecomax marks paid only after a verified webhook, then triggers confirmation and stock once through a unique event.id.", "يضع L’ecomax ‏paid بعد webhook متحقق منه فقط ثم يشغل التأكيد والمخزون مرة واحدة عبر event.id فريد."),
      task: tr("Traiter un webhook valide, signature fausse, montant faux et double livraison, puis prouver un seul effet métier.", "Handle a valid webhook, bad signature, wrong amount, and duplicate delivery, then prove only one domain effect.", "عالج webhook صالحاً وتوقيعاً خاطئاً ومبلغاً خاطئاً وتسليماً مكرراً ثم أثبت أثراً واحداً للمجال."),
      next: tr("Le module suivant approfondit authentification, autorisation, menaces, secrets et obligations de confidentialité.", "The next module deepens authentication, authorization, threats, secrets, and privacy duties.", "تعمق الوحدة التالية المصادقة والتفويض والتهديدات والأسرار وواجبات الخصوصية."),
    },
  ],
};

const securityModule = {
  id: "authentication-security-privacy",
  order: 18,
  icon: "🛡️",
  color: "#ef4444",
  files: [
    { path: "middleware.ts", mode: "existing" },
    { path: "lib/admin-session.ts", mode: "existing" },
    { path: "app/api/admin/auth/verify/route.ts", mode: "existing" },
    { path: "app/politique-confidentialite/page.tsx", mode: "existing" },
    { path: "components/CookieBanner.tsx", mode: "existing" },
  ],
  locales: {
    fr: { title: "Authentification, sécurité et confidentialité", summary: "Distinguer identité et permission, valider toute entrée, protéger cookies et secrets, réduire les attaques et respecter le cycle de vie des données personnelles." },
    en: { title: "Authentication, security, and privacy", summary: "Separate identity from permission, validate every input, protect cookies and secrets, reduce attacks, and respect personal-data lifecycle." },
    ar: { title: "المصادقة والأمان والخصوصية", summary: "فصل الهوية عن الصلاحية والتحقق من كل مدخل وحماية cookies والأسرار وتقليل الهجمات واحترام دورة حياة البيانات الشخصية." },
  },
  analogy: tr("un aéroport où passeport, billet, contrôle des bagages et règles de conservation répondent à quatre questions différentes", "an airport where passport, ticket, baggage screening, and retention rules answer four different questions", "مطار تجيب فيه جوازات السفر والتذاكر وفحص الأمتعة وقواعد الحفظ عن أربعة أسئلة مختلفة"),
  vocabulary: {
    fr: [["authentication", "Preuve de l’identité d’un acteur."], ["authorization", "Décision qu’un acteur identifié peut effectuer une action précise."], ["CSRF", "Action forcée depuis un autre site avec les cookies de la victime."], ["minimization", "Collecte limitée aux données nécessaires pour une finalité annoncée."]],
    en: [["authentication", "Proof of an actor’s identity."], ["authorization", "A decision that an identified actor may perform a specific action."], ["CSRF", "An action forced from another site using the victim’s cookies."], ["minimization", "Collection limited to data necessary for a stated purpose."]],
    ar: [["authentication", "إثبات هوية الفاعل."], ["authorization", "قرار أن فاعلاً معروفاً يستطيع تنفيذ إجراء محدد."], ["CSRF", "إجراء يُفرض من موقع آخر باستخدام cookies الضحية."], ["minimization", "حصر الجمع في البيانات اللازمة لغرض معلن."]],
  },
  errors: {
    fr: [["Un utilisateur connecté ouvre une route admin.", "Le code vérifie seulement l’authentification et pas rôle/permission.", "Vérifie la permission spécifique côté serveur après validation de la session."], ["Une clé secrète apparaît dans le JavaScript public.", "Elle utilise NEXT_PUBLIC ou est importée depuis un Client Component.", "Révoque immédiatement la clé, crée-en une nouvelle et garde son usage dans un module serveur."]],
    en: [["A signed-in user opens an admin route.", "Code checks authentication but not role or permission.", "Verify the specific permission on the server after validating the session."], ["A secret key appears in public JavaScript.", "It uses NEXT_PUBLIC or is imported by a Client Component.", "Revoke the key immediately, issue a new one, and keep usage in a server module."]],
    ar: [["يفتح مستخدم مسجل route إدارة.", "تفحص الشيفرة المصادقة فقط لا الدور أو الصلاحية.", "تحقق من الصلاحية المحددة على الخادم بعد التحقق من الجلسة."], ["يظهر مفتاح سري في JavaScript العام.", "يستخدم NEXT_PUBLIC أو يستورده Client Component.", "ألغ المفتاح فوراً وأنشئ جديداً وأبق استخدامه في module خادم."]],
  },
  lessons: [
    {
      id: "security-authn-authz-permissions", order: 0, language: "typescript", filename: "lib/admin-session.ts",
      commands: ["npm run dev", "curl.exe -i http://localhost:3000/api/admin/auth/verify", "npx tsc --noEmit"],
      source: [
        "type Permission = \"products.read\" | \"products.write\" | \"orders.refund\";",
        "type Session = { userId: string; expiresAt: number; permissions: Permission[] };",
        "export function requirePermission(session: Session | null, permission: Permission) {",
        "  if (!session || session.expiresAt <= Date.now()) throw new Error(\"UNAUTHENTICATED\");",
        "  if (!session.permissions.includes(permission)) throw new Error(\"FORBIDDEN\");",
        "  return { userId: session.userId };",
        "}",
      ].join("\n"),
      title: tr("Authentification, autorisation et permissions", "Authentication, authorization, and permissions", "المصادقة والتفويض والصلاحيات"),
      focus: tr("la décision d’accès à une action", "the access decision for an action", "قرار الوصول إلى إجراء"),
      mental: tr("L’authentification répond qui es-tu, l’autorisation répond peux-tu faire précisément ceci sur cette ressource. Une session valide ne confère donc pas automatiquement un rôle admin ; chaque mutation sensible vérifie la permission minimale près de l’opération.", "Authentication answers who are you; authorization answers may you do this specific thing to this resource. A valid session therefore does not automatically grant admin status; every sensitive mutation verifies minimal permission near the operation.", "تجيب المصادقة من أنت، ويجيب التفويض هل تستطيع تنفيذ هذا الشيء المحدد على هذا المورد. لذلك لا تمنح جلسة صالحة دور admin تلقائياً؛ ويتحقق كل تغيير حساس من أقل صلاحية قرب العملية."),
      points: tr([
        "401 signifie identité absente ou session invalide, tandis que 403 signifie identité connue mais droit insuffisant ; cette distinction facilite UX, logs et audit.",
        "Une permission nomme ressource et capacité, par exemple orders.refund ; les rôles regroupent des permissions mais la route teste la capacité effective.",
        "Le moindre privilège donne à chaque agent seulement ce dont sa tâche a besoin et retire rapidement l’accès lors d’un changement de poste.",
      ], [
        "401 means missing identity or invalid session, while 403 means known identity with insufficient rights; the distinction improves UX, logs, and audit.",
        "A permission names a resource and capability such as orders.refund; roles group permissions, but the route checks the effective capability.",
        "Least privilege gives every staff member only what the task needs and removes access promptly when responsibilities change.",
      ], [
        "تعني 401 غياب الهوية أو جلسة غير صالحة، بينما تعني 403 هوية معروفة بحق غير كاف؛ ويحسن الفرق تجربة المستخدم والسجلات والتدقيق.",
        "تسمي الصلاحية مورداً وقدرة مثل orders.refund؛ تجمع الأدوار الصلاحيات لكن route تفحص القدرة الفعلية.",
        "يمنح أقل امتياز كل موظف ما تحتاجه مهمته فقط ويسحب الوصول سريعاً عند تغير المسؤوليات.",
      ]),
      general: tr("Écris une matrice acteur × ressource × action, vérifie session puis permission côté serveur et journalise les décisions sensibles.", "Write an actor × resource × action matrix, verify session then permission on the server, and audit sensitive decisions.", "اكتب مصفوفة فاعل × مورد × إجراء وتحقق من الجلسة ثم الصلاحية على الخادم وسجل القرارات الحساسة."),
      lecomax: tr("L’ecomax sépare lecture produits, écriture catalogue et remboursement ; un agent support ne reçoit pas automatiquement les clés marketing.", "L’ecomax separates product reading, catalog writing, and refunds; a support agent does not automatically receive marketing capabilities.", "يفصل L’ecomax قراءة المنتجات وكتابة الكتالوج والاسترداد؛ ولا يحصل موظف الدعم تلقائياً على قدرات التسويق."),
      task: tr("Créer une matrice visiteur/client/support/admin et tester 401, 403 et succès sur trois routes.", "Create a visitor/customer/support/admin matrix and test 401, 403, and success on three routes.", "أنشئ مصفوفة زائر/عميل/دعم/admin واختبر 401 و403 والنجاح على ثلاث routes."),
      next: tr("La prochaine leçon traite chaque entrée comme hostile et réduit XSS, injection, CSRF, SSRF et uploads dangereux.", "The next lesson treats every input as hostile and reduces XSS, injection, CSRF, SSRF, and dangerous uploads.", "يعامل الدرس التالي كل مدخل كمعادٍ ويقلل XSS وinjection وCSRF وSSRF والرفع الخطر."),
    },
    {
      id: "security-validation-threats", order: 1, language: "typescript", filename: "lib/validation.ts",
      commands: ["npx tsc --noEmit", "npm run build"],
      source: [
        "function readProductName(body: unknown): string | null {",
        "  if (!body || typeof body !== \"object\" || !(\"name\" in body)) return null;",
        "  const name = (body as { name?: unknown }).name;",
        "  if (typeof name !== \"string\") return null;",
        "  const normalized = name.trim();",
        "  return normalized.length >= 2 && normalized.length <= 120 ? normalized : null;",
        "}",
        "const body: unknown = await request.json();",
        "const name = readProductName(body);",
        "if (!name) return Response.json({ error: \"Nom invalide\" }, { status: 400 });",
      ].join("\n"),
      title: tr("Validation serveur et modèle de menaces", "Server validation and threat modeling", "تحقق الخادم ونموذج التهديدات"),
      focus: tr("la validation d’une frontière non fiable", "validation at an untrusted boundary", "التحقق عند حد غير موثوق"),
      mental: tr("Tout ce qui traverse URL, JSON, formulaire, cookie, webhook ou fichier est contrôlé par un autre acteur et arrive comme unknown. La validation vérifie type, forme, longueur, bornes et liste autorisée avant la logique métier ; l’encodage protège ensuite chaque contexte de sortie.", "Anything crossing URL, JSON, form, cookie, webhook, or file is controlled by another actor and arrives as unknown. Validation checks type, shape, length, bounds, and allowlists before domain logic; output encoding then protects each destination context.", "كل ما يعبر URL أو JSON أو نموذجاً أو cookie أو webhook أو ملفاً يتحكم فيه طرف آخر ويصل كـ unknown. يفحص التحقق النوع والشكل والطول والحدود والقائمة المسموحة قبل منطق المجال، ثم يحمي ترميز الإخراج كل سياق وجهة."),
      points: tr([
        "React échappe le texte rendu, mais dangerouslySetInnerHTML ou HTML externe exige une sanitation adaptée ; stocker une chaîne ne la rend pas sûre pour tous les contextes.",
        "Les requêtes paramétrées et SDK évitent l’injection SQL ; concaténer un filtre utilisateur dans SQL réintroduit le risque malgré une validation superficielle.",
        "CSRF concerne les cookies automatiques, SSRF les URLs que le serveur fetch, et upload les contenus déguisés : chacun demande une défense spécifique et des limites.",
      ], [
        "React escapes rendered text, but dangerouslySetInnerHTML or external HTML requires appropriate sanitization; storing a string does not make it safe for every context.",
        "Parameterized queries and SDKs prevent SQL injection; concatenating user filters into SQL restores risk despite superficial validation.",
        "CSRF concerns automatic cookies, SSRF URLs fetched by the server, and uploads disguised content; each needs a specific defense and limits.",
      ], [
        "تهرب React النص المعروض، لكن dangerouslySetInnerHTML أو HTML خارجي يحتاج sanitation ملائمة؛ ولا يجعل تخزين سلسلة آمنة لكل السياقات.",
        "تمنع الاستعلامات ذات المعاملات وSDK حقن SQL؛ ويعيد وصل مرشح المستخدم في SQL الخطر رغم تحقق سطحي.",
        "يتعلق CSRF بالـ cookies التلقائية وSSRF بالروابط التي يجلبها الخادم والرفع بالمحتوى المتنكر؛ ويحتاج كل منها دفاعاً وحدوداً محددة.",
      ]),
      general: tr("Cartographie les sources d’entrée et les actifs sensibles, valide par listes autorisées et limites de taille, puis teste des payloads invalides et répétés.", "Map input sources and sensitive assets, validate with allowlists and size limits, then test malformed and repeated payloads.", "ارسم مصادر الإدخال والأصول الحساسة وتحقق بقائمة مسموحة وحدود حجم ثم اختبر payloads غير الصالحة والمكررة."),
      lecomax: tr("Chaque API L’ecomax lit body en unknown, borne champs et quantités, utilise requêtes paramétrées et refuse URL/upload non autorisé.", "Every L’ecomax API reads body as unknown, bounds fields and quantities, uses parameterized queries, and rejects unauthorized URLs/uploads.", "تقرأ كل API في L’ecomax ‏body كـ unknown وتحد الحقول والكميات وتستخدم استعلامات بمعاملات وترفض URL/رفعاً غير مصرح."),
      task: tr("Tester types faux, chaînes géantes, HTML, SQL, URL privée et fichier déguisé, puis documenter la défense de chaque cas.", "Test wrong types, huge strings, HTML, SQL, a private URL, and a disguised file, then document each defense.", "اختبر أنواعاً خاطئة وسلاسل ضخمة وHTML وSQL ورابطاً خاصاً وملفاً متنكرًا ثم وثق دفاع كل حالة."),
      next: tr("La prochaine leçon protège cookies et secrets, ajoute en-têtes défensifs et limite les abus.", "The next lesson protects cookies and secrets, adds defensive headers, and limits abuse.", "يحمي الدرس التالي cookies والأسرار ويضيف ترويسات دفاعية ويحد إساءة الاستخدام."),
    },
    {
      id: "security-cookies-secrets-headers", order: 2, language: "typescript", filename: "middleware.ts",
      commands: ["npm run dev", "curl.exe -I http://localhost:3000/admin", "npx tsc --noEmit"],
      source: [
        "const response = NextResponse.next();",
        "response.headers.set(\"X-Content-Type-Options\", \"nosniff\");",
        "response.headers.set(\"Referrer-Policy\", \"strict-origin-when-cross-origin\");",
        "response.headers.set(\"X-Frame-Options\", \"DENY\");",
        "response.cookies.set(\"admin-session\", signedToken, {",
        "  httpOnly: true, secure: process.env.NODE_ENV === \"production\",",
        "  sameSite: \"lax\", path: \"/\", maxAge: 60 * 60,",
        "});",
        "return response;",
      ].join("\n"),
      title: tr("Cookies, secrets, headers et rate limit", "Cookies, secrets, headers, and rate limiting", "Cookies والأسرار والترويسات وحد المعدل"),
      focus: tr("la réduction de la surface d’attaque", "reduction of attack surface", "تقليل مساحة الهجوم"),
      mental: tr("La défense en profondeur empile des barrières indépendantes : cookie inaccessible au JavaScript, transport HTTPS, politique same-site, en-têtes navigateur, secrets serveur et limites de fréquence. Aucune barrière ne remplace validation et autorisation, mais chacune réduit l’impact d’une erreur.", "Defense in depth stacks independent barriers: JavaScript-inaccessible cookies, HTTPS transport, same-site policy, browser headers, server secrets, and rate limits. No barrier replaces validation and authorization, but each reduces the impact of a mistake.", "يجمع الدفاع المتعمق حواجز مستقلة: cookies لا يصل إليها JavaScript ونقل HTTPS وسياسة same-site وترويسات المتصفح وأسرار الخادم وحدود المعدل. لا يستبدل أي حاجز التحقق والتفويض لكنه يقلل أثر الخطأ."),
      points: tr([
        "HttpOnly réduit le vol par XSS, Secure impose HTTPS, SameSite limite certaines requêtes croisées, maxAge borne la session et une signature détecte la falsification.",
        "NEXT_PUBLIC signifie public ; après une fuite, supprimer la chaîne du dépôt ne suffit pas : il faut révoquer, tourner, auditer l’usage et nettoyer l’historique si nécessaire.",
        "CSP, nosniff, frame-ancestors et Referrer-Policy contraignent le navigateur ; le rate limit cible identité/IP/action avec fenêtre et réponse 429 sans bloquer tout le site.",
      ], [
        "HttpOnly reduces theft through XSS, Secure enforces HTTPS, SameSite limits some cross-site requests, maxAge bounds the session, and a signature detects tampering.",
        "NEXT_PUBLIC means public; after a leak, removing the string from the repository is insufficient: revoke, rotate, audit usage, and clean history if required.",
        "CSP, nosniff, frame-ancestors, and Referrer-Policy constrain the browser; rate limiting targets identity/IP/action with a window and 429 response without blocking the whole site.",
      ], [
        "تقلل HttpOnly السرقة عبر XSS وتفرض Secure ‏HTTPS وتحد SameSite بعض الطلبات العابرة ويحد maxAge الجلسة ويكشف التوقيع العبث.",
        "تعني NEXT_PUBLIC عاماً؛ وبعد التسرب لا يكفي حذف السلسلة من المستودع بل يجب الإلغاء والتدوير وتدقيق الاستخدام وتنظيف التاريخ عند الحاجة.",
        "تقيد CSP وnosniff وframe-ancestors وReferrer-Policy المتصفح؛ ويستهدف rate limit الهوية/IP/الإجراء بنافذة واستجابة 429 بلا حجب الموقع كله.",
      ]),
      general: tr("Classe les secrets, configure les cookies avec la durée utile la plus courte, ajoute les headers progressivement et surveille efficacité et faux positifs des rate limits.", "Classify secrets, configure cookies with the shortest useful lifetime, add headers progressively, and monitor rate limits for effectiveness and false positives.", "صنف الأسرار واضبط cookie بأقصر عمر مناسب وأضف headers تدريجياً وراقب rate limits للفعالية والإنذارات الكاذبة."),
      lecomax: tr("L’ecomax garde admin-session HttpOnly/signée, service role côté serveur, CSP mesurée et limite connexion, coupons et messages selon le risque.", "L’ecomax keeps admin-session HttpOnly/signed, service role server-side, measured CSP, and rate-limits login, coupons, and messages according to risk.", "يحفظ L’ecomax ‏admin-session ‏HttpOnly/موقعة وservice role على الخادم وCSP مقاسة ويحد الدخول والكوبونات والرسائل حسب الخطر."),
      task: tr("Inspecter cookie et headers, simuler une clé divulguée avec procédure de rotation, puis tester un rate limit 429 récupérable.", "Inspect cookie and headers, simulate a leaked key with a rotation procedure, then test a recoverable 429 rate limit.", "افحص cookie والترويسات وحاك مفتاحاً مسرباً بإجراء تدوير ثم اختبر rate limit ‏429 قابلاً للاستعادة."),
      next: tr("La dernière leçon relie sécurité et RGPD : finalité, consentement, rétention, export et suppression.", "The final lesson connects security and GDPR: purpose, consent, retention, export, and deletion.", "يربط الدرس الأخير الأمان وGDPR: الغرض والموافقة والاحتفاظ والتصدير والحذف."),
    },
    {
      id: "security-privacy-data-lifecycle", order: 3, language: "tsx", filename: "components/CookieBanner.tsx",
      commands: ["npm run dev", "npx tsc --noEmit"],
      source: [
        "type Consent = { analytics: boolean; decidedAt: string; version: \"2026-01\" };",
        "export function saveConsent(input: Consent) {",
        "  localStorage.setItem(\"privacy-consent\", JSON.stringify(input));",
        "  if (!input.analytics) {",
        "    document.cookie = \"analytics-id=; Max-Age=0; Path=/; SameSite=Lax\";",
        "  }",
        "}",
        "export function mayLoadAnalytics(consent: Consent | null) {",
        "  return consent?.version === \"2026-01\" && consent.analytics === true;",
        "}",
      ].join("\n"),
      title: tr("Confidentialité et cycle de vie des données", "Privacy and the data lifecycle", "الخصوصية ودورة حياة البيانات"),
      focus: tr("la minimisation des données personnelles", "personal-data minimization", "تقليل البيانات الشخصية"),
      mental: tr("Une donnée personnelle suit un cycle : finalité annoncée, base légale, collecte minimale, accès limité, durée définie puis suppression ou anonymisation. Le consentement n’est valable que s’il est libre, spécifique, éclairé, réversible et aussi simple à refuser qu’à accepter.", "Personal data follows a lifecycle: stated purpose, legal basis, minimal collection, limited access, defined retention, then deletion or anonymization. Consent is valid only when freely given, specific, informed, reversible, and as easy to refuse as accept.", "تمر البيانات الشخصية بدورة: غرض معلن وأساس قانوني وجمع أدنى ووصول محدود ومدة محددة ثم حذف أو إخفاء هوية. لا تصح الموافقة إلا إن كانت حرة ومحددة ومستنيرة وقابلة للسحب وسهلة الرفض مثل القبول."),
      points: tr([
        "Les cookies strictement nécessaires peuvent servir session ou panier selon le cadre applicable ; analytics et marketing ne se chargent qu’après un choix explicite enregistré par version.",
        "Refuser ne dégrade pas les fonctions essentielles, retirer arrête les collectes futures et supprime les identifiants que l’application contrôle.",
        "Une politique nomme données, finalités, destinataires, durées et droits ; les processus réels d’export/suppression doivent correspondre au texte publié et aux sauvegardes.",
      ], [
        "Strictly necessary cookies may support session or cart under the applicable framework; analytics and marketing load only after an explicit versioned choice.",
        "Refusal does not degrade essential features, withdrawal stops future collection, and identifiers controlled by the application are removed.",
        "A policy names data, purposes, recipients, retention, and rights; real export/deletion processes must match published text and backups.",
      ], [
        "قد تخدم cookies الضرورية الجلسة أو السلة وفق الإطار المطبق؛ ولا تحمل analytics والتسويق إلا بعد اختيار صريح مسجل بالإصدار.",
        "لا يضعف الرفض الوظائف الأساسية، ويوقف السحب الجمع المستقبلي، وتحذف المعرفات التي يتحكم بها التطبيق.",
        "تسمي السياسة البيانات والأغراض والمستلمين والمدد والحقوق؛ ويجب أن تطابق عمليات التصدير/الحذف الفعلية النص المنشور والنسخ الاحتياطية.",
      ]),
      general: tr("Crée un inventaire donnée → finalité → base → accès → durée → suppression et vérifie-le à chaque nouvelle intégration.", "Create a data → purpose → basis → access → retention → deletion inventory and review it for every new integration.", "أنشئ جرد بيانات ← غرض ← أساس ← وصول ← مدة ← حذف وراجعه مع كل تكامل جديد."),
      lecomax: tr("L’ecomax charge analytics après accord, garde les commandes selon obligations, limite l’accès admin et documente export ou suppression client.", "L’ecomax loads analytics after consent, retains orders for obligations, limits admin access, and documents customer export or deletion.", "يحمل L’ecomax ‏analytics بعد الموافقة ويحفظ الطلبات حسب الالتزامات ويحد وصول الإدارة ويوثق تصدير العميل أو حذفه."),
      task: tr("Tester accepter/refuser/retirer, construire l’inventaire L’ecomax et simuler export puis suppression avec exceptions légales documentées.", "Test accept/refuse/withdraw, build the L’ecomax inventory, and simulate export then deletion with documented legal exceptions.", "اختبر القبول/الرفض/السحب وابن جرد L’ecomax وحاك التصدير ثم الحذف مع استثناءات قانونية موثقة."),
      next: tr("Tu peux maintenant poursuivre vers tests, qualité, SEO et production en appliquant ces frontières de données et de sécurité.", "You can now continue to testing, quality, SEO, and production while applying these data and security boundaries.", "يمكنك الآن متابعة الاختبارات والجودة وSEO والإنتاج مع تطبيق حدود البيانات والأمان هذه."),
    },
  ],
};

export const modules = [
  asyncModule,
  typeScriptModule,
  reactFundamentalsModule,
  reactStateModule,
  nextAppRouterModule,
  nextServerModule,
  sqlModule,
  supabaseModule,
  ecommerceModule,
  securityModule,
].map(buildModule);
