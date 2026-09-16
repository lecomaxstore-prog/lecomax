import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const courseRoot = path.join(root, "app", "admin", "how-it-was-built", "course");
const languages = ["fr", "en", "ar"];
const expectedModuleCount = 48;
const expectedLessonCount = 192;
const forbidden = [/\[TODO\]/i, /lorem ipsum/i, /placeholder content/i, /à compléter/i, /to be added/i, /\bTBD\b/i];
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function inspectText(value, location) {
  if (typeof value === "string") {
    assert(hasText(value), location + " is empty");
    for (const pattern of forbidden) assert(!pattern.test(value), location + " contains placeholder text");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectText(item, location + "[" + index + "]"));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => inspectText(item, location + "." + key));
  }
}

function annotationRange(value, lineCount, location) {
  const match = /^(\d+)(?:-(\d+))?$/.exec(value);
  assert(match, location + " has invalid line syntax: " + value);
  const start = Number(match?.[1]);
  const end = Number(match?.[2] ?? match?.[1]);
  assert(start >= 1 && end >= start, location + " has an invalid line range");
  assert(end <= lineCount, location + " references line " + end + " but the example has " + lineCount + " lines");
  return { start, end };
}

function validateFilenameLanguage(filename, language, location) {
  if (filename === "Terminal") {
    assert(["shell", "bash", "powershell"].includes(language), location + " terminal example must use a shell language");
    return;
  }
  const extension = path.extname(filename).toLowerCase();
  const expected = {
    ".js": ["javascript", "js"], ".mjs": ["javascript", "js"], ".cjs": ["javascript", "js"],
    ".ts": ["typescript", "ts"], ".tsx": ["tsx", "typescript"], ".jsx": ["jsx", "javascript"],
    ".json": ["json"], ".sql": ["sql"], ".css": ["css"], ".html": ["html"],
    ".md": ["markdown", "md"], ".sh": ["bash", "shell"], ".ps1": ["powershell"],
    ".yml": ["yaml", "yml"], ".yaml": ["yaml", "yml"], ".toml": ["toml"],
  }[extension];
  if (expected) assert(expected.includes(language.toLowerCase()), location + " language " + language + " does not match " + extension);
}

function validateLesson(lesson, location, moduleFilePaths, seenQuizIds) {
  assert(hasText(lesson.id), location + " id missing");
  assert(Number.isInteger(lesson.order), location + " order invalid");
  assert(hasText(lesson.title), location + " title missing");
  assert(lesson.estimatedMinutes >= 15, location + " duration too short");
  assert(lesson.prerequisites?.length >= 1, location + " prerequisites missing");
  assert(lesson.objectives?.length >= 2, location + " objectives missing");
  assert(lesson.prerequisites.every(hasText), location + " contains an empty prerequisite");
  assert(lesson.objectives.every(hasText), location + " contains an empty objective");
  assert(lesson.sections?.length === 3, location + " requires three teaching sections");
  assert(lesson.sections.map(section => section.id).join(",") === "mental-model,deep-understanding,worked-examples", location + " section order invalid");
  assert(new Set(lesson.sections.map(section => section.id)).size === lesson.sections.length, location + " duplicate section id");
  lesson.sections.forEach(section => assert(hasText(section.id) && hasText(section.title), location + " section metadata missing"));

  const blocks = lesson.sections.flatMap(section => section.blocks);
  assert(new Set(blocks.map(block => block.id)).size === blocks.length, location + " duplicate block id");
  blocks.forEach(block => assert(hasText(block.id), location + " block id missing"));
  blocks.forEach((block, index) => {
    const blockLocation = location + ".blocks[" + index + "]";
    if (block.type === "paragraph") assert(hasText(block.text), blockLocation + " paragraph text missing");
    else if (block.type === "callout") {
      assert(hasText(block.title) && hasText(block.text), blockLocation + " callout content missing");
      assert(["idea", "analogy", "important", "warning", "success"].includes(block.tone), blockLocation + " callout tone invalid");
    } else if (block.type === "list") {
      assert(block.items?.length >= 1 && block.items.every(hasText), blockLocation + " list items missing");
    } else if (block.type === "vocabulary") {
      assert(block.items?.length >= 3, blockLocation + " vocabulary items missing");
    } else if (block.type === "code") {
      assert(hasText(block.title), blockLocation + " code title missing");
    } else assert(false, blockLocation + " has an unknown block type");
  });
  const paragraphs = blocks.filter(block => block.type === "paragraph");
  assert(paragraphs.length >= 4, location + " detailed explanation missing");
  assert(paragraphs.every(block => block.text.trim().length >= 160), location + " contains an abbreviated teaching paragraph");
  assert(blocks.some(block => block.type === "callout" && block.tone === "analogy"), location + " analogy missing");
  const vocabulary = blocks.find(block => block.type === "vocabulary");
  assert(vocabulary?.items?.length >= 3, location + " vocabulary missing");
  assert(vocabulary.items.every(item => item.term.trim().length >= 2 && item.definition.trim().length >= 12), location + " vocabulary is not explained deeply enough");
  const codeBlocks = blocks.filter(block => block.type === "code");
  assert(codeBlocks.length >= 2, location + " requires multiple annotated examples");
  assert(new Set(codeBlocks.map(block => block.code.source.trim())).size === codeBlocks.length, location + " annotated examples must contain distinct source code");
  codeBlocks.forEach((code, index) => {
    assert(hasText(code.code?.source), location + " code example " + index + " missing");
    assert(hasText(code.code?.filename) && hasText(code.code?.language), location + " exact code metadata missing");
    validateFilenameLanguage(code.code.filename, code.code.language, location + " code example " + index);
    assert(code.code?.annotations?.length >= 2, location + " line annotations missing");
    assert(code.code.filename === "Terminal" || moduleFilePaths.has(code.code.filename), location + " code example " + index + " filename is not declared in module.files: " + code.code.filename);
    const lineCount = Math.max(1, code.code.source.split("\n").length);
    const coveredLines = new Set();
    code.code.annotations.forEach((annotation, annotationIndex) => {
      assert(hasText(annotation.lines) && hasText(annotation.label), location + " empty code annotation");
      assert(annotation.label.trim().length >= 20, location + " code annotation " + annotationIndex + " is too short to teach the line");
      const range = annotationRange(annotation.lines, lineCount, location + " code example " + index + " annotation " + annotationIndex);
      for (let line = range.start; line <= range.end; line += 1) coveredLines.add(line);
    });
    assert(coveredLines.size === lineCount, location + " code example " + index + " does not annotate every line");
  });
  assert(blocks.some(block => block.type === "callout" && block.tone === "idea"), location + " general application missing");
  assert(blocks.some(block => block.type === "callout" && block.tone === "important"), location + " L'ecomax application missing");

  assert(lesson.commands?.length >= 1, location + " requires at least one exact command");
  assert(lesson.commands.every(hasText), location + " contains an empty command");
  assert(lesson.commands.every(command => !command.trimStart().startsWith("#")), location + " contains a manual instruction disguised as a terminal command");
  assert(lesson.commands.every(command => !/<[^>]+>/.test(command)), location + " contains an unresolved command placeholder");
  assert(hasText(lesson.expectedResult), location + " expected result missing");
  assert(lesson.commonErrors?.length >= 2, location + " troubleshooting missing");
  lesson.commonErrors.forEach((item, index) => {
    assert(hasText(item.symptom) && hasText(item.cause) && hasText(item.fix), location + " incomplete error case " + index);
  });

  assert(hasText(lesson.exercise?.task), location + " exercise missing");
  assert(lesson.exercise?.steps?.length >= 2, location + " exercise steps missing");
  assert(lesson.exercise?.hints?.length >= 2, location + " exercise hints missing");
  assert(lesson.exercise.steps.every(hasText), location + " contains an empty exercise step");
  assert(lesson.exercise.hints.every(hasText), location + " contains an empty hint");
  assert(hasText(lesson.exercise?.solution?.explanation), location + " solution explanation missing");
  assert(hasText(lesson.exercise?.solution?.code), location + " solution code missing");
  assert(hasText(lesson.exercise?.solution?.filename) && hasText(lesson.exercise?.solution?.language), location + " solution code metadata missing");
  validateFilenameLanguage(lesson.exercise.solution.filename, lesson.exercise.solution.language, location + " solution");
  assert(moduleFilePaths.has(lesson.exercise.solution.filename), location + " solution filename is not declared in module.files: " + lesson.exercise.solution.filename);
  assert(lesson.exercise.solution.explanation.trim().length >= 40, location + " solution explanation is too short");

  assert(lesson.quiz?.length >= 3, location + " requires a three-question comprehension quiz");
  assert(new Set(lesson.quiz.map(question => question.id)).size === lesson.quiz.length, location + " contains duplicate quiz ids");
  lesson.quiz.forEach((question, index) => {
    assert(hasText(question.id) && hasText(question.question), location + " quiz " + index + " metadata missing");
    assert(!seenQuizIds.has(question.id), location + " quiz id is not unique: " + question.id);
    seenQuizIds.add(question.id);
    assert(question.options?.length === 4, location + " quiz " + index + " must have four options");
    assert(question.options.every(hasText), location + " quiz " + index + " contains an empty option");
    assert(new Set(question.options).size === question.options.length, location + " quiz " + index + " contains duplicate options");
    assert(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < 4, location + " quiz " + index + " answer invalid");
    assert(hasText(question.explanation), location + " quiz " + index + " explanation missing");
    assert(question.answerExplanations?.length === 4 && question.answerExplanations.every(hasText), location + " quiz " + index + " requires an explanation for every option");
    assert(question.answerExplanations.every((explanation, optionIndex) => explanation.includes(question.options[optionIndex])), location + " quiz " + index + " explanations must address each selected option");
    assert(question.answerExplanations.every((explanation, optionIndex) => optionIndex === question.correctIndex || explanation.includes(question.options[question.correctIndex])), location + " quiz " + index + " wrong-answer explanations must identify the correct reference answer");
  });
  assert(lesson.recap?.length >= 3, location + " recap missing");
  assert(lesson.recap.every(hasText), location + " contains an empty recap item");
  assert(hasText(lesson.next), location + " next lesson guidance missing");
  assert(JSON.stringify(lesson).length >= 3500, location + " is an outline rather than a complete lesson");
  inspectText(lesson, location);
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(courseRoot, "generated", "manifest.json"), "utf8"));
  assert(manifest.version === 1, "Manifest version must be 1");
  assert(manifest.moduleCount === expectedModuleCount, `Manifest must contain ${expectedModuleCount} modules`);
  assert(manifest.lessonCount === expectedLessonCount, `Manifest must contain ${expectedLessonCount} lessons`);
  assert(manifest.modules?.length === expectedModuleCount, "Manifest module array mismatch");
  assert(new Set(manifest.modules.map(module => module.id)).size === expectedModuleCount, "Manifest module ids must be unique");
  const manifestLessonIds = new Set();
  manifest.modules.forEach((module, moduleIndex) => {
    assert(hasText(module.id) && hasText(module.icon), "Manifest module metadata missing at index " + moduleIndex);
    assert(/^#[0-9a-f]{6}$/i.test(module.color), "Manifest module color must be a six-digit hex value: " + module.id);
    assert(module.order === moduleIndex, "Manifest module order must be contiguous at " + module.id);
    assert(module.lessonIds?.length === 4, "Manifest module must contain four lesson ids: " + module.id);
    module.lessonIds.forEach(lessonId => {
      assert(hasText(lessonId), "Manifest contains an empty lesson id");
      assert(!manifestLessonIds.has(lessonId), "Manifest lesson id is not unique: " + lessonId);
      manifestLessonIds.add(lessonId);
    });
  });
  assert(manifestLessonIds.size === manifest.lessonCount, "Manifest lesson count does not match its lesson ids");

  const loaderText = await readFile(path.join(courseRoot, "generated", "loaders.ts"), "utf8");
  const moduleImportCount = (loaderText.match(/\(\) => import\("\.\.\/content\/(?:fr|en|ar)\//g) ?? []).length;
  const indexImportCount = (loaderText.match(/\(\) => import\("\.\.\/content\/index\/(?:fr|en|ar)\.json"\)/g) ?? []).length;
  assert(moduleImportCount === expectedModuleCount * languages.length, `Loader must contain exactly ${expectedModuleCount * languages.length} lazy module imports`);
  assert(indexImportCount === 3, "Loader must contain exactly three lazy language-index imports");
  for (const lang of languages) {
    for (const module of manifest.modules) {
      const expectedImport = `() => import("../content/${lang}/${module.id}.json")`;
      assert(loaderText.includes(expectedImport), "Loader is missing " + lang + "/" + module.id);
    }
  }
  const readerSource = await readFile(path.join(root, "app", "admin", "how-it-was-built", "AcademySection.tsx"), "utf8");
  assert(!readerSource.includes("localStorage") && !readerSource.includes("sessionStorage"), "Academy reader must not persist progress in browser storage");
  assert(!/from\s+["'][^"']*course\/content\//.test(readerSource), "Academy reader must not statically import localized course content");

  const canonical = [];
  const canonicalLessonSizes = new Map();
  for (const lang of languages) {
    const localizedIndex = JSON.parse(await readFile(path.join(courseRoot, "content", "index", lang + ".json"), "utf8"));
    assert(localizedIndex.language === lang, lang + " search index language mismatch");
    assert(localizedIndex.modules?.length === expectedModuleCount, lang + ` search index must contain ${expectedModuleCount} modules`);
    assert(localizedIndex.modules.map(module => module.id).join(",") === manifest.modules.map(module => module.id).join(","), lang + " search index module order differs from manifest");
    const dir = path.join(courseRoot, "content", lang);
    const files = (await readdir(dir)).filter(file => file.endsWith(".json")).sort();
    assert(files.length === expectedModuleCount, lang + ` must contain exactly ${expectedModuleCount} JSON modules`);
    const seenModules = new Set();
    const seenLessons = new Set();
    const seenQuizIds = new Set();
    const seenErrorSets = new Set();
    const seenSolutionExplanations = new Set();
    const seenNextGuidance = new Set();
    const structure = [];

    for (const manifestModule of manifest.modules) {
      const filename = manifestModule.id + ".json";
      assert(files.includes(filename), lang + " missing " + filename);
      const module = JSON.parse(await readFile(path.join(dir, filename), "utf8"));
      const location = lang + "/" + module.id;
      assert(!seenModules.has(module.id), "Duplicate module " + location);
      seenModules.add(module.id);
      assert(module.id === manifestModule.id, location + " id differs from manifest");
      assert(module.order === manifestModule.order, location + " order differs from manifest");
      assert(module.icon === manifestModule.icon && module.color === manifestModule.color, location + " visual metadata differs from manifest");
      assert(hasText(module.title) && hasText(module.summary), location + " localized metadata missing");
      if (lang === "ar") assert(/[\u0600-\u06ff]/.test(module.title + module.summary), location + " does not contain Arabic-script localization");
      else assert(/[A-Za-zÀ-ÿ]/.test(module.title + module.summary), location + " does not contain Latin-script localization");
      assert(module.lessons?.length === 4, location + " must contain four lessons");
      const indexModule = localizedIndex.modules.find(item => item.id === module.id);
      assert(indexModule && indexModule.title === module.title && indexModule.summary === module.summary, location + " differs from localized search index");
      assert(indexModule.lessonTitles?.length === 4 && indexModule.lessonSearchText?.length === 4, location + " search entries missing");
      assert(indexModule.lessonSearchText.every(hasText), location + " contains an empty search entry");

      assert(module.files?.length >= 1, location + " must declare its studied or created files");
      const moduleFilePaths = new Set();
      for (const file of module.files) {
        assert(hasText(file.path), location + " contains an empty file path");
        assert(file.mode === "existing" || file.mode === "create", location + " invalid file mode");
        assert(!moduleFilePaths.has(file.path), location + " contains duplicate file reference: " + file.path);
        moduleFilePaths.add(file.path);
        const resolved = path.resolve(root, file.path);
        assert(resolved.startsWith(root + path.sep), location + " file reference escapes the repository: " + file.path);
        if (file.mode === "existing") {
          await access(resolved).catch(() => {
            throw new Error(location + " references missing repository path: " + file.path);
          });
        }
      }

      module.lessons.forEach((lesson, lessonIndex) => {
        assert(!seenLessons.has(lesson.id), "Duplicate lesson " + lesson.id + " in " + lang);
        seenLessons.add(lesson.id);
        assert(lesson.order === lessonIndex, location + "/" + lesson.id + " order mismatch");
        assert(lesson.id === manifestModule.lessonIds[lessonIndex], location + "/" + lesson.id + " differs from manifest");
        assert(indexModule.lessonTitles[lessonIndex] === lesson.title, location + "/" + lesson.id + " title differs from search index");
        if (lang === "ar") assert(/[\u0600-\u06ff]/.test(lesson.title), location + "/" + lesson.id + " title is not localized in Arabic");
        else assert(/[A-Za-zÀ-ÿ]/.test(lesson.title), location + "/" + lesson.id + " title is not localized in a Latin-script language");
        validateLesson(lesson, location + "/" + lesson.id, moduleFilePaths, seenQuizIds);
        const errorSignature = JSON.stringify(lesson.commonErrors).toLocaleLowerCase(lang);
        const solutionSignature = lesson.exercise.solution.explanation.trim().toLocaleLowerCase(lang);
        const nextSignature = lesson.next.trim().toLocaleLowerCase(lang);
        assert(!seenErrorSets.has(errorSignature), location + "/" + lesson.id + " reuses another lesson's complete troubleshooting set");
        assert(!seenSolutionExplanations.has(solutionSignature), location + "/" + lesson.id + " reuses another lesson's solution explanation");
        assert(!seenNextGuidance.has(nextSignature), location + "/" + lesson.id + " reuses another lesson's next-lesson guidance");
        seenErrorSets.add(errorSignature);
        seenSolutionExplanations.add(solutionSignature);
        seenNextGuidance.add(nextSignature);
        const normalizedSearch = indexModule.lessonSearchText[lessonIndex];
        assert(normalizedSearch.includes(lesson.title.toLocaleLowerCase(lang)), location + "/" + lesson.id + " search entry omits its title");
        lesson.commands.forEach(command => assert(normalizedSearch.includes(command.toLocaleLowerCase(lang)), location + "/" + lesson.id + " search entry omits command " + command));
        const vocabulary = lesson.sections.flatMap(section => section.blocks).find(block => block.type === "vocabulary");
        vocabulary.items.forEach(item => assert(normalizedSearch.includes(item.term.toLocaleLowerCase(lang)), location + "/" + lesson.id + " search entry omits vocabulary term " + item.term));
        const primaryFilename = lesson.sections.flatMap(section => section.blocks).find(block => block.type === "code").code.filename;
        assert(normalizedSearch.includes(primaryFilename.toLocaleLowerCase(lang)), location + "/" + lesson.id + " search entry omits filename " + primaryFilename);
        const serializedSize = JSON.stringify(lesson).length;
        if (lang === "fr") canonicalLessonSizes.set(lesson.id, serializedSize);
        else {
          const frenchSize = canonicalLessonSizes.get(lesson.id);
          assert(serializedSize >= frenchSize * 0.65 && serializedSize <= frenchSize * 1.8, location + "/" + lesson.id + " detail level differs too much from French");
        }
      });
      structure.push({ id: module.id, files: module.files, lessons: module.lessons.map(lesson => lesson.id) });
    }
    assert(seenLessons.size === expectedLessonCount, lang + ` must contain ${expectedLessonCount} unique lessons`);
    if (canonical.length === 0) canonical.push(...structure);
    else assert(JSON.stringify(structure) === JSON.stringify(canonical), lang + " module/lesson structure differs from French");
  }

  console.log(`Course validation passed: ${expectedModuleCount} modules, ${expectedLessonCount} lessons, 3 languages, ${checks} checks.`);
}

await main();
