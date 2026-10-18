import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { authoredLesson, authoredSearch } from "./course-authored.mjs";
import { fileURLToPath } from "node:url";
import { modules as partA } from "./course-blueprints/part-a.mjs";
import { modules as partB } from "./course-blueprints/part-b.mjs";
import { modules as partC } from "./course-blueprints/part-c.mjs";
import { modules as partD } from "./course-blueprints/part-d.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const courseRoot = path.join(root, "app", "admin", "how-it-was-built", "course");
const languages = ["fr", "en", "ar"];
const modules = [...partA, ...partB, ...partC, ...partD].sort((a, b) => a.order - b.order);
const expectedModuleCount = 48;
const expectedLessonCount = 192;

const labels = {
  fr: {
    mental: "Modèle mental", analogy: "Analogie simple", understand: "Comprendre en profondeur",
    vocabulary: "Vocabulaire important", example: "Exemple annoté", general: "Application générale",
    lecomax: "Application à L’ecomax", solutionExample: "Deuxième exemple — solution guidée",
    verificationExample: "Deuxième exemple — exécuter et vérifier", manualChecks: "Vérifications dans le navigateur ou les outils",
    correctAnswer: "Cette option est correcte. Elle affirme", wrongAnswer: "Cette option est incorrecte. Elle affirme", correctChoice: "La réponse de référence est",
    vocabularyQuestion: term => `Quelle définition correspond au terme « ${term} » ?`,
    vocabularyExplanation: (term, definition) => `« ${term} » signifie : ${definition}`,
    troubleshootingQuestion: symptom => `Quel est le meilleur premier correctif lorsque vous observez : « ${symptom} » ?`,
    troubleshootingExplanation: (cause, fix) => `Le diagnostic part de la cause suivante : ${cause} Le correctif adapté est : ${fix}`,
    noDefinition: "Ce terme ne possède aucune définition technique précise.",
    retryBlindly: "Relancer exactement la même action sans lire le premier message d’erreur.",
    hideError: "Masquer l’erreur dans l’interface et considérer le problème comme résolu.",
  },
  en: {
    mental: "Mental model", analogy: "Simple analogy", understand: "Understand it deeply",
    vocabulary: "Important vocabulary", example: "Annotated example", general: "General application",
    lecomax: "Application to L’ecomax", solutionExample: "Second example — guided solution",
    verificationExample: "Second example — run and verify", manualChecks: "Checks in the browser or developer tools",
    correctAnswer: "This option is correct. It says", wrongAnswer: "This option is incorrect. It says", correctChoice: "The reference answer is",
    vocabularyQuestion: term => `Which definition matches the term “${term}”?`,
    vocabularyExplanation: (term, definition) => `“${term}” means: ${definition}`,
    troubleshootingQuestion: symptom => `What is the best first fix when you observe: “${symptom}”?`,
    troubleshootingExplanation: (cause, fix) => `Diagnosis starts with this cause: ${cause} The appropriate fix is: ${fix}`,
    noDefinition: "This term has no precise technical definition.",
    retryBlindly: "Repeat the same action without reading the first error message.",
    hideError: "Hide the error in the interface and treat the problem as solved.",
  },
  ar: {
    mental: "النموذج الذهني", analogy: "تشبيه بسيط", understand: "الفهم المتعمق",
    vocabulary: "المفردات المهمة", example: "مثال مشروح", general: "تطبيق عام",
    lecomax: "التطبيق في L’ecomax", solutionExample: "المثال الثاني — الحل الموجه",
    verificationExample: "المثال الثاني — التشغيل والتحقق", manualChecks: "فحوصات المتصفح أو أدوات المطور",
    correctAnswer: "هذا الخيار صحيح، وهو يقول", wrongAnswer: "هذا الخيار غير صحيح، وهو يقول", correctChoice: "الإجابة المرجعية هي",
    vocabularyQuestion: term => `أي تعريف يطابق المصطلح «${term}»؟`,
    vocabularyExplanation: (term, definition) => `يعني المصطلح «${term}»: ${definition}`,
    troubleshootingQuestion: symptom => `ما أول تصحيح مناسب عند ملاحظة: «${symptom}»؟`,
    troubleshootingExplanation: (cause, fix) => `يبدأ التشخيص من السبب التالي: ${cause} والتصحيح المناسب هو: ${fix}`,
    noDefinition: "ليس لهذا المصطلح تعريف تقني دقيق.",
    retryBlindly: "تكرار الإجراء نفسه من دون قراءة أول رسالة خطأ.",
    hideError: "إخفاء الخطأ في الواجهة واعتبار المشكلة محلولة.",
  },
};

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function validateBlueprint() {
  requireValue(modules.length === expectedModuleCount, `Expected ${expectedModuleCount} modules, received ${modules.length}`);
  const moduleIds = new Set();
  const lessonIds = new Set();
  modules.forEach((module, moduleIndex) => {
    requireValue(module.order === moduleIndex, "Module order mismatch at " + module.id);
    requireValue(!moduleIds.has(module.id), "Duplicate module id " + module.id);
    moduleIds.add(module.id);
    requireValue(module.lessons?.length === 4, module.id + " must contain exactly four lessons");
    languages.forEach(lang => {
      requireValue(module.locales?.[lang]?.title, module.id + " missing " + lang + " title");
      requireValue(module.locales?.[lang]?.summary, module.id + " missing " + lang + " summary");
    });
    module.lessons.forEach((lesson, lessonIndex) => {
      requireValue(lesson.order === lessonIndex, lesson.id + " order mismatch");
      requireValue(!lessonIds.has(lesson.id), "Duplicate lesson id " + lesson.id);
      lessonIds.add(lesson.id);
      requireValue(lesson.source?.trim(), lesson.id + " missing source");
      requireValue(lesson.filename?.trim(), lesson.id + " missing filename");
      languages.forEach(lang => {
        const content = lesson.locales?.[lang];
        requireValue(content, lesson.id + " missing locale " + lang);
        requireValue(content.explanation?.length === 3, lesson.id + " " + lang + " requires exactly three explanation paragraphs");
        requireValue(content.vocabulary?.length >= 3, lesson.id + " " + lang + " requires vocabulary");
        requireValue(content.commonErrors?.length >= 2, lesson.id + " " + lang + " requires common errors");
        requireValue(content.quiz?.options?.length === 4, lesson.id + " " + lang + " requires four quiz options");
        requireValue(content.quiz.correctIndex >= 0 && content.quiz.correctIndex < 4, lesson.id + " " + lang + " invalid quiz index");
        requireValue(lesson.annotations?.[lang]?.length >= 2, lesson.id + " " + lang + " requires code annotations");
      });
    });
  });
  requireValue(lessonIds.size === expectedLessonCount, `Expected ${expectedLessonCount} lessons, received ${lessonIds.size}`);
}

function lineRange(start, end) {
  return start === end ? String(start) : `${start}-${end}`;
}

function normalizeAnnotations(annotations, source, fallbackLabel) {
  const lineCount = Math.max(1, source.split("\n").length);
  const total = Math.max(1, annotations.length);
  const covered = new Set();
  const normalized = annotations.map((annotation, index) => {
    const match = /^(\d+)(?:-(\d+))?$/.exec(annotation.lines.trim());
    let start = match ? Number(match[1]) : 0;
    let end = match ? Number(match[2] ?? match[1]) : 0;
    if (start < 1 || end < start || start > lineCount || end > lineCount) {
      start = Math.floor((index * lineCount) / total) + 1;
      end = Math.max(start, Math.floor(((index + 1) * lineCount) / total));
    }
    for (let line = start; line <= end; line += 1) covered.add(line);
    return { ...annotation, lines: lineRange(start, end) };
  });

  let gapStart = null;
  for (let line = 1; line <= lineCount + 1; line += 1) {
    if (line <= lineCount && !covered.has(line)) {
      if (gapStart === null) gapStart = line;
    } else if (gapStart !== null) {
      normalized.push({ lines: lineRange(gapStart, line - 1), label: fallbackLabel });
      gapStart = null;
    }
  }
  return normalized;
}

function createQuestion(id, question, options, correctIndex, explanation, ui) {
  return {
    id,
    question,
    options,
    correctIndex,
    explanation,
    answerExplanations: options.map((option, index) => index === correctIndex
      ? ui.correctAnswer + " « " + option + " ». " + explanation
      : ui.wrongAnswer + " « " + option + " ». " + ui.correctChoice + " « " + options[correctIndex] + " ». " + explanation
    ),
  };
}

function splitLessonCommands(content) {
  const exact = content.commands.filter(command => !command.trimStart().startsWith("#"));
  const manual = content.commands
    .filter(command => command.trimStart().startsWith("#"))
    .map(command => command.replace(/^\s*#\s*/, "").trim())
    .filter(Boolean);
  return { exact: exact.length ? exact : ["npm run dev"], manual };
}

async function resolveModuleFiles(module) {
  const references = new Map(module.files.map(file => [file.path, file]));
  for (const lesson of module.lessons) {
    if (references.has(lesson.filename)) continue;
    const resolved = path.resolve(root, lesson.filename);
    requireValue(
      resolved.startsWith(root + path.sep),
      `${module.id}/${lesson.id} filename escapes the repository: ${lesson.filename}`,
    );
    const exists = await access(resolved).then(() => true).catch(() => false);
    references.set(lesson.filename, {
      path: lesson.filename,
      mode: exists ? "existing" : "create",
    });
  }
  return [...references.values()];
}

function createLesson(lesson, lang, lessonIndex) {
  const content = lesson.locales[lang];
  const ui = labels[lang];
  const lessonCommands = splitLessonCommands(content);
  const solutionSource = content.exercise.solutionCode.trim();
  const sourceIsDistinct = solutionSource !== lesson.source.trim();
  const verificationSource = lessonCommands.exact.join("\n");
  const secondSource = sourceIsDistinct ? content.exercise.solutionCode : verificationSource;
  const secondFilename = sourceIsDistinct ? lesson.filename : "Terminal";
  const secondLanguage = sourceIsDistinct ? lesson.language : "shell";
  const verificationAnnotations = lessonCommands.exact.map((command, index) => ({
    lines: String(index + 1),
    label: content.exercise.steps[Math.min(index, content.exercise.steps.length - 1)] + " — " + command,
  }));
  const secondAnnotations = sourceIsDistinct
    ? [
        { lines: "1", label: content.exercise.solutionExplanation },
        { lines: "1-" + Math.max(1, secondSource.split("\n").length), label: content.expectedResult },
      ]
    : [
        ...verificationAnnotations,
        { lines: "1-" + Math.max(1, secondSource.split("\n").length), label: content.expectedResult },
      ];
  const vocabulary = content.vocabulary;
  const firstError = content.commonErrors[0];
  const secondError = content.commonErrors[1];
  return {
    id: lesson.id,
    order: lessonIndex,
    title: content.title,
    estimatedMinutes: 45,
    prerequisites: content.prerequisites,
    objectives: content.objectives,
    sections: [
      {
        id: "mental-model",
        title: ui.mental,
        blocks: [
          { id: "mental", type: "paragraph", text: content.mentalModel },
          { id: "analogy", type: "callout", tone: "analogy", title: ui.analogy, text: content.analogy },
        ],
      },
      {
        id: "deep-understanding",
        title: ui.understand,
        blocks: [
          ...content.explanation.map((text, index) => ({ id: "explanation-" + (index + 1), type: "paragraph", text })),
          { id: "vocabulary", type: "vocabulary", items: content.vocabulary },
        ],
      },
      {
        id: "worked-examples",
        title: ui.example,
        blocks: [
          { id: "general", type: "callout", tone: "idea", title: ui.general, text: content.generalApplication },
          ...(lessonCommands.manual.length ? [{ id: "manual-checks", type: "list", title: ui.manualChecks, ordered: true, items: lessonCommands.manual }] : []),
          {
            id: "annotated-code",
            type: "code",
            title: ui.example,
            code: {
              language: lesson.language,
              filename: lesson.filename,
              source: lesson.source,
              annotations: normalizeAnnotations(lesson.annotations[lang], lesson.source, content.expectedResult),
            },
          },
          {
            id: "solution-example",
            type: "code",
            title: sourceIsDistinct ? ui.solutionExample : ui.verificationExample,
            code: {
              language: secondLanguage,
              filename: secondFilename,
              source: secondSource,
              annotations: normalizeAnnotations(secondAnnotations, secondSource, content.expectedResult),
            },
          },
          { id: "lecomax", type: "callout", tone: "important", title: ui.lecomax, text: content.lecomaxApplication },
        ],
      },
    ],
    commands: lessonCommands.exact,
    expectedResult: content.expectedResult,
    commonErrors: content.commonErrors,
    exercise: {
      task: content.exercise.task,
      steps: content.exercise.steps,
      hints: content.exercise.hints,
      solution: {
        explanation: content.exercise.solutionExplanation,
        code: content.exercise.solutionCode,
        filename: lesson.filename,
        language: lesson.language,
      },
    },
    quiz: [
      createQuestion(
        lesson.id + "-q1",
        content.quiz.question,
        content.quiz.options,
        content.quiz.correctIndex,
        content.quiz.explanation,
        ui,
      ),
      createQuestion(
        lesson.id + "-q2",
        ui.vocabularyQuestion(vocabulary[0].term),
        [vocabulary[1].definition, vocabulary[0].definition, vocabulary[2].definition, ui.noDefinition],
        1,
        ui.vocabularyExplanation(vocabulary[0].term, vocabulary[0].definition),
        ui,
      ),
      createQuestion(
        lesson.id + "-q3",
        ui.troubleshootingQuestion(firstError.symptom),
        [ui.retryBlindly, secondError.fix, firstError.fix, ui.hideError],
        2,
        ui.troubleshootingExplanation(firstError.cause, firstError.fix),
        ui,
      ),
    ],
    recap: content.recap,
    next: content.next,
  };
}

function searchableText(module, lesson, lang) {
  const content = lesson.locales[lang];
  return [
    module.locales[lang].title,
    module.locales[lang].summary,
    content.title,
    ...content.objectives,
    content.mentalModel,
    content.analogy,
    ...content.explanation,
    ...content.vocabulary.flatMap(item => [item.term, item.definition]),
    ...content.commands,
    content.generalApplication,
    content.lecomaxApplication,
    content.expectedResult,
    ...content.commonErrors.flatMap(item => [item.symptom, item.cause, item.fix]),
    content.exercise.task,
    ...content.exercise.steps,
    ...content.exercise.hints,
    ...content.recap,
    lesson.filename,
  ].join(" ").toLocaleLowerCase(lang);
}

function loaderSource() {
  const lines = [
    "import type { CourseIndex, CourseLanguage, CourseModule } from \"../types\";",
    "",
    "type LoadedJson = { default: CourseModule };",
    "type Loader = () => Promise<LoadedJson>;",
    "",
    "const loaders: Record<CourseLanguage, Record<string, Loader>> = {",
  ];
  languages.forEach(lang => {
    lines.push("  " + lang + ": {");
    modules.forEach(module => {
      lines.push("    \"" + module.id + "\": () => import(\"../content/" + lang + "/" + module.id + ".json\") as Promise<LoadedJson>,");
    });
    lines.push("  },");
  });
  lines.push(
    "};",
    "",
    "const indexLoaders: Record<CourseLanguage, () => Promise<{ default: CourseIndex }>> = {",
    "  fr: () => import(\"../content/index/fr.json\") as Promise<{ default: CourseIndex }>,",
    "  en: () => import(\"../content/index/en.json\") as Promise<{ default: CourseIndex }>,",
    "  ar: () => import(\"../content/index/ar.json\") as Promise<{ default: CourseIndex }>,",
    "};",
    "",
    "export async function loadCourseModule(lang: CourseLanguage, moduleId: string): Promise<CourseModule> {",
    "  const loader = loaders[lang]?.[moduleId];",
    "  if (!loader) throw new Error(\"Unknown course module: \" + lang + \"/\" + moduleId);",
    "  const loaded = await loader();",
    "  return loaded.default;",
    "}",
    "",
    "export async function loadCourseIndex(lang: CourseLanguage): Promise<CourseIndex> {",
    "  const loaded = await indexLoaders[lang]();",
    "  return loaded.default;",
    "}",
    ""
  );
  return lines.join("\n");
}

async function main() {
  validateBlueprint();
  const resolvedFiles = new Map();
  const authored = new Map();
  for (const module of modules) {
    resolvedFiles.set(module.id, await resolveModuleFiles(module));
  }
  for (const lang of languages) {
    const dir = path.join(courseRoot, "content", lang);
    await mkdir(dir, { recursive: true });
    for (const module of modules) {
      const localized = {
        id: module.id,
        order: module.order,
        icon: module.icon,
        color: module.color,
        title: module.locales[lang].title,
        summary: module.locales[lang].summary,
        files: resolvedFiles.get(module.id),
        lessons: await Promise.all(module.lessons.map(async (lesson, lessonIndex) => {
          const fallback = createLesson(lesson, lang, lessonIndex);
          const revised = await authoredLesson(courseRoot, lang, fallback);
          if (revised !== fallback) authored.set(lang + ":" + lesson.id, revised);
          return revised;
        })),
      };
      await writeFile(path.join(dir, module.id + ".json"), JSON.stringify(localized, null, 2) + "\n", "utf8");
    }
  }

  const manifest = {
    version: 1,
    moduleCount: modules.length,
    lessonCount: modules.reduce((total, module) => total + module.lessons.length, 0),
    modules: modules.map(module => ({
      id: module.id,
      order: module.order,
      icon: module.icon,
      color: module.color,
      lessonIds: module.lessons.map(lesson => lesson.id),
    })),
  };

  await mkdir(path.join(courseRoot, "generated"), { recursive: true });
  await mkdir(path.join(courseRoot, "content", "index"), { recursive: true });
  for (const lang of languages) {
    const index = {
      language: lang,
      modules: modules.map(module => ({
        id: module.id,
        title: module.locales[lang].title,
        summary: module.locales[lang].summary,
        lessonTitles: module.lessons.map(lesson => authored.get(lang + ":" + lesson.id)?.title ?? lesson.locales[lang].title),
        lessonSearchText: module.lessons.map(lesson => {
          const revised = authored.get(lang + ":" + lesson.id);
          return revised ? authoredSearch(module.locales[lang], revised, lang) : searchableText(module, lesson, lang);
        }),
      })),
    };
    await writeFile(path.join(courseRoot, "content", "index", lang + ".json"), JSON.stringify(index, null, 2) + "\n", "utf8");
  }
  await writeFile(path.join(courseRoot, "generated", "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  await writeFile(path.join(courseRoot, "generated", "loaders.ts"), loaderSource(), "utf8");
  console.log("Generated " + modules.length + " modules and " + manifest.lessonCount + " lessons in " + languages.length + " languages.");
}

await main();
