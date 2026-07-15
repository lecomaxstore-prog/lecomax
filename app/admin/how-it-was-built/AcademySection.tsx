"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import manifestJson from "./course/generated/manifest.json";
import { loadCourseIndex, loadCourseModule } from "./course/generated/loaders";
import type {
  ContentBlock,
  CourseIndex,
  CourseLanguage,
  CourseManifest,
  CourseModule,
  Lesson,
} from "./course/types";

type Props = { lang: CourseLanguage };
type Labels = { [K in keyof typeof TEXT.fr]: string };
type SearchResult = {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  moduleIndex: number;
  lessonIndex: number;
};

const manifest = manifestJson as CourseManifest;
const firstModule = manifest.modules[0];

const TEXT = {
  fr: {
    badge: "Manuel interactif complet",
    title: "De zéro à créateur web et entrepreneur e-commerce — avec L’ecomax comme laboratoire.",
    intro: "160 leçons complètes dans 40 modules : code, Next.js, design, layouts, vente, SEO, acquisition et croissance. Chaque leçon explique le pourquoi, montre un exemple annoté, te fait pratiquer, puis vérifie ta compréhension.",
    modules: "modules", lessons: "leçons", languages: "langues", free: "accès libre",
    search: "Rechercher une notion, une commande, un fichier…", noResults: "Aucun résultat dans le cours.",
    program: "Programme", lesson: "Leçon", duration: "min", loading: "Chargement de la leçon…",
    prerequisites: "Prérequis", objectives: "Objectifs", files: "Fichiers étudiés",
    existing: "existant", create: "à créer", contents: "Dans cette leçon",
    commands: "Commandes exactes", expected: "Résultat attendu", copy: "Copier", copied: "Copié", copyFailed: "Échec de copie",
    annotations: "Lecture ligne par ligne", errors: "Erreurs fréquentes", symptom: "Symptôme",
    cause: "Cause", fix: "Correction", exercise: "Exercice guidé", steps: "Étapes",
    hints: "Indices", hint: "Afficher l’indice", solution: "Afficher la solution complète",
    hideSolution: "Masquer la solution", quiz: "Quiz de compréhension", correct: "Bonne réponse",
    incorrect: "Pas encore", recap: "À retenir", next: "La suite", previousLesson: "Leçon précédente",
    nextLesson: "Leçon suivante", allOpen: "Toutes les leçons sont accessibles immédiatement.",
    generalCode: "Code à exécuter", answerFirst: "Choisis une réponse pour afficher l’explication.",
    mobileModule: "Choisir un module", mobileLesson: "Choisir une leçon", navigation: "Navigation des leçons",
    retry: "Réessayer", searchUnavailable: "La recherche est temporairement indisponible, mais les leçons restent accessibles.",
  },
  en: {
    badge: "Complete interactive textbook",
    title: "From zero to web creator and ecommerce entrepreneur — using L’ecomax as your laboratory.",
    intro: "160 complete lessons across 40 modules: code, Next.js, design, layouts, selling, SEO, acquisition, and growth. Every lesson explains why, shows an annotated example, guides practice, and checks your understanding.",
    modules: "modules", lessons: "lessons", languages: "languages", free: "open access",
    search: "Search for a concept, command, or file…", noResults: "No course results.",
    program: "Curriculum", lesson: "Lesson", duration: "min", loading: "Loading lesson…",
    prerequisites: "Prerequisites", objectives: "Objectives", files: "Files studied",
    existing: "existing", create: "create", contents: "In this lesson",
    commands: "Exact commands", expected: "Expected result", copy: "Copy", copied: "Copied", copyFailed: "Copy failed",
    annotations: "Line-by-line reading", errors: "Common errors", symptom: "Symptom",
    cause: "Cause", fix: "Fix", exercise: "Guided exercise", steps: "Steps",
    hints: "Hints", hint: "Reveal hint", solution: "Reveal complete solution",
    hideSolution: "Hide solution", quiz: "Understanding quiz", correct: "Correct",
    incorrect: "Not yet", recap: "Key takeaways", next: "What comes next", previousLesson: "Previous lesson",
    nextLesson: "Next lesson", allOpen: "Every lesson is immediately available.",
    generalCode: "Code to run", answerFirst: "Choose an answer to reveal the explanation.",
    mobileModule: "Choose a module", mobileLesson: "Choose a lesson", navigation: "Lesson navigation",
    retry: "Try again", searchUnavailable: "Search is temporarily unavailable, but every lesson remains accessible.",
  },
  ar: {
    badge: "كتاب تفاعلي متكامل",
    title: "من الصفر إلى صانع ويب ورائد تجارة إلكترونية — باستخدام L’ecomax كمختبر عملي.",
    intro: "160 درسًا كاملًا ضمن 40 وحدة: البرمجة وNext.js والتصميم والتخطيط والبيع وSEO والاكتساب والنمو. يشرح كل درس السبب ويعرض مثالًا مشروحًا ويوجه التطبيق ثم يتحقق من الفهم.",
    modules: "وحدة", lessons: "درسًا", languages: "لغات", free: "وصول مفتوح",
    search: "ابحث عن مفهوم أو أمر أو ملف…", noResults: "لا توجد نتائج في الدورة.",
    program: "البرنامج", lesson: "الدرس", duration: "دقيقة", loading: "جارٍ تحميل الدرس…",
    prerequisites: "المتطلبات السابقة", objectives: "الأهداف", files: "الملفات المدروسة",
    existing: "موجود", create: "يُنشأ", contents: "في هذا الدرس",
    commands: "الأوامر الدقيقة", expected: "النتيجة المتوقعة", copy: "نسخ", copied: "تم النسخ", copyFailed: "فشل النسخ",
    annotations: "شرح سطرًا بسطر", errors: "الأخطاء الشائعة", symptom: "العَرَض",
    cause: "السبب", fix: "التصحيح", exercise: "تمرين موجه", steps: "الخطوات",
    hints: "تلميحات", hint: "إظهار التلميح", solution: "إظهار الحل الكامل",
    hideSolution: "إخفاء الحل", quiz: "اختبار الفهم", correct: "إجابة صحيحة",
    incorrect: "ليس بعد", recap: "الخلاصة", next: "الخطوة التالية", previousLesson: "الدرس السابق",
    nextLesson: "الدرس التالي", allOpen: "جميع الدروس متاحة فورًا.",
    generalCode: "الكود المطلوب تشغيله", answerFirst: "اختر إجابة لإظهار الشرح.",
    mobileModule: "اختر وحدة", mobileLesson: "اختر درسًا", navigation: "التنقل بين الدروس",
    retry: "إعادة المحاولة", searchUnavailable: "البحث غير متاح مؤقتًا، لكن جميع الدروس ما زالت متاحة.",
  },
} as const;

function readHash() {
  if (typeof window === "undefined" || !window.location.hash.startsWith("#academy/")) {
    return { moduleId: firstModule.id, lessonId: firstModule.lessonIds[0] };
  }
  const [moduleId, lessonId] = window.location.hash.slice("#academy/".length).split("/");
  const module = manifest.modules.find(item => item.id === moduleId) ?? firstModule;
  return {
    moduleId: module.id,
    lessonId: module.lessonIds.includes(lessonId) ? lessonId : module.lessonIds[0],
  };
}

function CodePanel({
  title,
  filename,
  language,
  courseLanguage,
  source,
  annotations,
  labels,
  copyKey,
  copiedKey,
  onCopy,
}: {
  title: string;
  filename: string;
  language: string;
  courseLanguage: CourseLanguage;
  source: string;
  annotations?: Array<{ lines: string; label: string }>;
  labels: Labels;
  copyKey: string;
  copiedKey: string;
  onCopy: (value: string, key: string) => void;
}) {
  const lines = source.split("\n");
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0d0d0d] text-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-black sm:text-[11px]">{title}</p>
          <p dir="ltr" className="mt-0.5 truncate text-start font-mono text-[10px] text-white/50 sm:text-[9px]">{filename} · {language}</p>
        </div>
        <button type="button" aria-label={`${labels.copy}: ${filename}`} onClick={() => onCopy(source, copyKey)} className="min-h-11 shrink-0 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">
          {copiedKey === copyKey ? "✓ " + labels.copied : copiedKey === "error:" + copyKey ? labels.copyFailed : labels.copy}
        </button>
        {(copiedKey === copyKey || copiedKey === "error:" + copyKey) && <span role="status" aria-live="polite" className="sr-only">{copiedKey === copyKey ? labels.copied : labels.copyFailed}</span>}
      </div>
      <div dir="ltr" role="region" aria-label={title} tabIndex={0} className="max-h-[520px] overflow-auto overscroll-contain p-3 font-mono text-[11px] leading-7 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3ecf4c] sm:p-4">
        <code className="block min-w-max">
          {lines.map((line, index) => (
            <span key={index} className="flex">
              <span className="mr-3 w-5 shrink-0 select-none text-right text-white/25 sm:mr-4 sm:w-6">{index + 1}</span>
              <span className="whitespace-pre text-[#d4d4d4]">{line || " "}</span>
            </span>
          ))}
        </code>
      </div>
      {!!annotations?.length && (
        <div className="border-t border-white/10 bg-white/[.04] p-3 sm:p-4">
          <p className={`mb-3 text-[11px] font-black text-[#3ecf4c] ${courseLanguage === "ar" ? "normal-case tracking-normal" : "uppercase tracking-widest"}`}>{labels.annotations}</p>
          <div className="space-y-2">
            {annotations.map((annotation, index) => (
              <div key={index} className="flex gap-3 text-xs leading-5 text-white/70 sm:text-[10px]">
                <code dir="ltr" className="h-fit shrink-0 rounded bg-white/10 px-2 py-0.5 font-black text-[#3ecf4c]">{annotation.lines}</code>
                <span>{annotation.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AcademySection({ lang }: Props) {
  const labels = TEXT[lang];
  const [moduleId, setModuleId] = useState(firstModule.id);
  const [lessonId, setLessonId] = useState(firstModule.lessonIds[0]);
  const [selectionReady, setSelectionReady] = useState(false);
  const [courseIndex, setCourseIndex] = useState<CourseIndex | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModule | null>(null);
  const [loadedModuleKey, setLoadedModuleKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState("");
  const [moduleError, setModuleError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const [copiedKey, setCopiedKey] = useState("");
  const copyTimer = useRef<number | null>(null);
  const [visibleHints, setVisibleHints] = useState<Set<number>>(new Set());
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const lastNavigationHash = useRef("");
  const pendingLessonNavigation = useRef<{ lessonId: string; behavior: ScrollBehavior } | null>(null);
  const activeManifest = manifest.modules.find(item => item.id === moduleId) ?? firstModule;

  const navigate = useCallback((nextModuleId: string, nextLessonId: string, push = true, focusLesson = true) => {
    const nextModule = manifest.modules.find(item => item.id === nextModuleId) ?? firstModule;
    const safeLesson = nextModule.lessonIds.includes(nextLessonId) ? nextLessonId : nextModule.lessonIds[0];
    const hash = "#academy/" + nextModule.id + "/" + safeLesson;
    if (typeof window !== "undefined") {
      if (push && window.location.hash === hash) {
        const heading = document.getElementById("academy-lesson-title");
        if (focusLesson && heading) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
          heading.focus({ preventScroll: true });
        }
        return;
      }
      if (!push && lastNavigationHash.current === hash) return;
      lastNavigationHash.current = hash;
    }
    pendingLessonNavigation.current = focusLesson ? { lessonId: safeLesson, behavior: push ? "smooth" : "auto" } : null;
    setModuleId(nextModule.id);
    setLessonId(safeLesson);
    setVisibleHints(new Set());
    setSolutionOpen(false);
    setAnswers({});
    setCopiedKey("");
    if (typeof window !== "undefined") {
      if (push) window.history.pushState(null, "", hash);
      else if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
    }
  }, []);

  useEffect(() => {
    const onHistory = () => {
      const hasAcademyDeepLink = window.location.hash.startsWith("#academy/");
      const next = readHash();
      navigate(next.moduleId, next.lessonId, false, hasAcademyDeepLink);
    };
    window.addEventListener("hashchange", onHistory);
    window.addEventListener("popstate", onHistory);
    onHistory();
    setSelectionReady(true);
    return () => {
      window.removeEventListener("hashchange", onHistory);
      window.removeEventListener("popstate", onHistory);
    };
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    setCourseIndex(null);
    setIndexError("");
    loadCourseIndex(lang).then(index => {
      if (!cancelled) setCourseIndex(index);
    }).catch(error => {
      if (!cancelled) setIndexError(error instanceof Error ? error.message : String(error));
    });
    return () => { cancelled = true; };
  }, [lang, retryToken]);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    if (!selectionReady) return;
    let cancelled = false;
    setLoading(true);
    setModuleError("");
    loadCourseModule(lang, moduleId)
      .then(loaded => {
        if (cancelled) return;
        setCourseModule(loaded);
        setLoadedModuleKey(lang + "/" + moduleId);
        if (!loaded.lessons.some(lesson => lesson.id === lessonId)) {
          setLessonId(loaded.lessons[0].id);
        }
      })
      .catch(error => {
        if (!cancelled) setModuleError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [lang, moduleId, selectionReady, retryToken]);

  const requestedModuleKey = lang + "/" + moduleId;
  const activeCourseModule = loadedModuleKey === requestedModuleKey ? courseModule : null;
  const activeCourseIndex = courseIndex?.language === lang ? courseIndex : null;
  const lesson = activeCourseModule?.lessons.find(item => item.id === lessonId) ?? activeCourseModule?.lessons[0] ?? null;
  const currentModuleIndex = manifest.modules.findIndex(item => item.id === moduleId);
  const currentLessonIndex = activeManifest.lessonIds.indexOf(lessonId);

  useEffect(() => {
    const pending = pendingLessonNavigation.current;
    if (!lesson || loadedModuleKey !== requestedModuleKey || pending?.lessonId !== lesson.id) return;
    const frame = window.requestAnimationFrame(() => {
      const heading = document.getElementById("academy-lesson-title");
      if (!heading) return;
      heading.scrollIntoView({ behavior: pending.behavior, block: "start" });
      heading.focus({ preventScroll: true });
      pendingLessonNavigation.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lesson, loadedModuleKey, requestedModuleKey]);

  const results = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLocaleLowerCase(lang);
    if (!normalized) return [];
    if (!activeCourseIndex) return [];
    return manifest.modules.flatMap((module, moduleIndex) => {
      const localized = activeCourseIndex.modules[moduleIndex];
      return module.lessonIds.flatMap((id, lessonIndex) => {
        if (!localized.lessonSearchText[lessonIndex].includes(normalized)) return [];
        return [{
          moduleId: module.id,
          moduleTitle: localized.title,
          lessonId: id,
          lessonTitle: localized.lessonTitles[lessonIndex],
          moduleIndex,
          lessonIndex,
        }];
      });
    });
  }, [query, lang, activeCourseIndex]);

  useEffect(() => {
    if (!searchOpen || activeResult < 0) return;
    document.getElementById("academy-search-option-" + activeResult)?.scrollIntoView({ block: "nearest" });
  }, [activeResult, searchOpen]);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
    } catch {
      setCopiedKey("error:" + key);
    }
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedKey(""), 1800);
  }

  function chooseSearchResult(result: SearchResult) {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    navigate(result.moduleId, result.lessonId);
    setQuery("");
    setSearchOpen(false);
    setActiveResult(-1);
  }

  function handleSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveResult(-1);
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveResult(current => {
        if (current === -1) return event.key === "ArrowDown" ? 0 : results.length - 1;
        return (current + delta + results.length) % results.length;
      });
    }
    if (event.key === "Enter" && activeResult >= 0 && activeResult < results.length) {
      event.preventDefault();
      chooseSearchResult(results[activeResult]);
    }
  }

  function adjacent(direction: -1 | 1) {
    let moduleIndex = currentModuleIndex;
    let lessonIndex = currentLessonIndex + direction;
    if (lessonIndex < 0) {
      moduleIndex -= 1;
      if (moduleIndex < 0) return;
      lessonIndex = manifest.modules[moduleIndex].lessonIds.length - 1;
    } else if (lessonIndex >= activeManifest.lessonIds.length) {
      moduleIndex += 1;
      if (moduleIndex >= manifest.modules.length) return;
      lessonIndex = 0;
    }
    const target = manifest.modules[moduleIndex];
    navigate(target.id, target.lessonIds[lessonIndex]);
  }

  function renderBlock(block: ContentBlock, lessonKey: string) {
    if (block.type === "paragraph") {
      return <p key={block.id} className="text-[15px] leading-7 text-neutral-700 sm:text-[13px]">{block.text}</p>;
    }
    if (block.type === "callout") {
      const tones = {
        idea: "border-blue-200 bg-blue-50 text-blue-950",
        analogy: "border-violet-200 bg-violet-50 text-violet-950",
        important: "border-emerald-200 bg-emerald-50 text-emerald-950",
        warning: "border-amber-200 bg-amber-50 text-amber-950",
        success: "border-green-200 bg-green-50 text-green-950",
      };
      return <div key={block.id} className={"rounded-2xl border p-4 " + tones[block.tone]}><p className={`text-xs font-black sm:text-[10px] ${lang === "ar" ? "normal-case tracking-normal" : "uppercase tracking-wider"}`}>{block.title}</p><p className="mt-2 text-sm leading-6 sm:text-[12px]">{block.text}</p></div>;
    }
    if (block.type === "list") {
      const ListTag = block.ordered ? "ol" : "ul";
      return <div key={block.id}>{block.title && <p className="mb-2 text-sm font-black sm:text-xs">{block.title}</p>}<ListTag className={block.ordered ? "list-decimal space-y-2 ps-5" : "space-y-2"}>{block.items.map(item => <li key={item} className="text-sm leading-6 text-neutral-700 sm:text-[12px]">{!block.ordered && <span className="me-2 text-[#16b277]">◆</span>}{item}</li>)}</ListTag></div>;
    }
    if (block.type === "vocabulary") {
      return <div key={block.id} className="grid gap-2 sm:grid-cols-2">{block.items.map(item => <div key={item.term} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"><code className="text-sm font-black text-violet-700 sm:text-[11px]">{item.term}</code><p className="mt-1 text-sm leading-6 text-neutral-600 sm:text-[10px] sm:leading-5">{item.definition}</p></div>)}</div>;
    }
    return <CodePanel key={block.id} title={block.title} filename={block.code.filename} language={block.code.language} courseLanguage={lang} source={block.code.source} annotations={block.code.annotations} labels={labels} copyKey={lessonKey + "-" + block.id} copiedKey={copiedKey} onCopy={copy} />;
  }

  return (
    <div id="academy-reader-top" dir={lang === "ar" ? "rtl" : "ltr"} className="-mx-2 space-y-4 scroll-mt-32 sm:mx-0 sm:space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-[#0d0d0d] p-4 text-white sm:p-8">
        <div className="absolute -end-20 -top-24 h-72 w-72 rounded-full bg-[#3ecf4c]/15 blur-3xl" />
        <div className="relative">
          <p className={`text-[11px] font-black text-[#3ecf4c] ${lang === "ar" ? "normal-case tracking-normal" : "uppercase tracking-[.25em]"}`}>{labels.badge}</p>
          <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-4xl">{labels.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/55">{labels.intro}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[[manifest.moduleCount, labels.modules], [manifest.lessonCount, labels.lessons], [3, labels.languages], ["∞", labels.free]].map(([value, label]) => <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"><span className="text-sm font-black text-[#3ecf4c]">{value}</span><span className="ms-1.5 text-[10px] text-white/45">{label}</span></div>)}
          </div>
        </div>
      </section>

      <section className="relative rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm sm:p-4">
        <svg className="absolute start-6 top-1/2 -translate-y-1/2 text-neutral-400 sm:start-7" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <label htmlFor="academy-search" className="sr-only">{labels.search}</label>
        <input id="academy-search" role="combobox" aria-autocomplete="list" aria-expanded={searchOpen && !!query} aria-controls="academy-search-results" aria-activedescendant={searchOpen && activeResult >= 0 ? "academy-search-option-" + activeResult : undefined} value={query} onFocus={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => { setSearchOpen(false); setActiveResult(-1); }, 120)} onKeyDown={handleSearchKey} onChange={event => { setQuery(event.target.value); setSearchOpen(true); setActiveResult(-1); }} placeholder={labels.search} className="min-h-12 w-full rounded-xl border border-neutral-200 py-3 pe-4 ps-10 text-base outline-none focus:border-[#16b277] focus:ring-4 focus:ring-emerald-100 sm:text-sm" />
        {searchOpen && query && <div id="academy-search-results" role="listbox" className="absolute inset-x-3 top-full z-30 mt-1 max-h-[45dvh] overflow-auto overscroll-contain rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl sm:inset-x-4 sm:max-h-80">{results.length ? results.map((result, index) => <button id={"academy-search-option-" + index} role="option" aria-selected={activeResult === index} key={result.lessonId} onMouseDown={event => event.preventDefault()} onClick={() => chooseSearchResult(result)} className={"flex min-h-11 w-full items-start gap-3 rounded-xl p-3 text-start hover:bg-neutral-50 " + (activeResult === index ? "bg-emerald-50" : "")}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-[9px] font-black text-white">{String(result.moduleIndex + 1).padStart(2, "0")}</span><span className="min-w-0 break-words"><span className="block text-xs text-neutral-400 sm:text-[10px]">{result.moduleTitle}</span><span className="block text-sm font-bold sm:text-xs">{result.lessonTitle}</span></span></button>) : <p className="p-5 text-center text-sm text-neutral-400 sm:text-xs">{labels.noResults}</p>}</div>}
        {indexError && <div role="status" className="mt-2 flex items-center justify-between gap-3 text-xs leading-5 text-amber-700 sm:text-[10px]"><span>{labels.searchUnavailable}</span><button type="button" onClick={() => setRetryToken(value => value + 1)} className="min-h-11 shrink-0 rounded-lg border border-amber-200 px-3 py-2 font-black">{labels.retry}</button></div>}
      </section>

      <div className="grid gap-3 lg:hidden">
        <label className={`text-[11px] font-black text-neutral-500 ${lang === "ar" ? "normal-case tracking-normal" : "uppercase tracking-wider"}`}>{labels.mobileModule}<select value={moduleId} onChange={event => { const item = manifest.modules.find(module => module.id === event.target.value) ?? firstModule; navigate(item.id, item.lessonIds[0]); }} className="mt-1 block min-h-12 w-full rounded-xl border border-neutral-200 bg-white p-3 text-base font-medium normal-case text-neutral-900 sm:text-sm">{manifest.modules.map((module, index) => <option key={module.id} value={module.id}>{index + 1}. {activeCourseIndex?.modules[index]?.title ?? module.id}</option>)}</select></label>
        <label className={`text-[11px] font-black text-neutral-500 ${lang === "ar" ? "normal-case tracking-normal" : "uppercase tracking-wider"}`}>{labels.mobileLesson}<select value={lessonId} onChange={event => navigate(moduleId, event.target.value)} className="mt-1 block min-h-12 w-full rounded-xl border border-neutral-200 bg-white p-3 text-base font-medium normal-case text-neutral-900 sm:text-sm">{activeManifest.lessonIds.map((id, index) => <option key={id} value={id}>{index + 1}. {activeCourseIndex?.modules[currentModuleIndex]?.lessonTitles[index] ?? id}</option>)}</select></label>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pe-1">
            <div className="mb-3 flex items-center justify-between px-1"><p className="text-xs font-black">{labels.program}</p><p className="text-[9px] text-neutral-400">{labels.allOpen}</p></div>
            <div className="space-y-1.5">
              {manifest.modules.map((module, moduleIndex) => (
                <div key={module.id}>
                  <button onClick={() => navigate(module.id, module.lessonIds[0])} aria-expanded={module.id === moduleId} className={"flex w-full items-start gap-2.5 rounded-xl border p-3 text-start transition " + (module.id === moduleId ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-100 bg-white hover:border-neutral-300")}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black text-white" style={{ backgroundColor: module.color }}>{String(moduleIndex + 1).padStart(2, "0")}</span>
                    <span className="min-w-0"><span className="block text-[10px] font-black leading-4">{activeCourseIndex?.modules[moduleIndex]?.title ?? module.id}</span><span className="text-[9px] opacity-45">4 {labels.lessons}</span></span>
                  </button>
                  {module.id === moduleId && <div className="my-1 space-y-0.5 border-s border-neutral-200 ps-3">{module.lessonIds.map((id, index) => <button key={id} onClick={() => navigate(module.id, id)} className={"block w-full rounded-lg px-2 py-2 text-start text-[10px] leading-4 " + (id === lessonId ? "bg-emerald-50 font-black text-emerald-800" : "text-neutral-500 hover:bg-neutral-50")}>{index + 1}. {activeCourseIndex?.modules[moduleIndex]?.lessonTitles[index] ?? id}</button>)}</div>}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {moduleError ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:p-6"><p>{moduleError}</p><button type="button" onClick={() => setRetryToken(value => value + 1)} className="mt-4 min-h-11 rounded-lg bg-red-700 px-3 py-2 text-sm font-black text-white sm:text-[11px]">{labels.retry}</button></div>
        : loading || loadedModuleKey !== requestedModuleKey ? <div role="status" aria-live="polite" className="flex min-h-96 items-center justify-center rounded-2xl border bg-white"><div className="text-center"><div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#3ecf4c] border-t-transparent" /><p className="mt-3 text-xs text-neutral-400">{labels.loading}</p></div></div>
        : lesson && activeCourseModule ? <LessonReader lesson={lesson} courseModule={activeCourseModule} labels={labels} lang={lang} copiedKey={copiedKey} onCopy={copy} renderBlock={renderBlock} visibleHints={visibleHints} setVisibleHints={setVisibleHints} solutionOpen={solutionOpen} setSolutionOpen={setSolutionOpen} answers={answers} setAnswers={setAnswers} onPrevious={() => adjacent(-1)} onNext={() => adjacent(1)} hasPrevious={currentModuleIndex > 0 || currentLessonIndex > 0} hasNext={currentModuleIndex < manifest.modules.length - 1 || currentLessonIndex < activeManifest.lessonIds.length - 1} /> : null}
      </div>
    </div>
  );
}

function LessonReader({
  lesson, courseModule, labels, lang, copiedKey, onCopy, renderBlock,
  visibleHints, setVisibleHints, solutionOpen, setSolutionOpen, answers, setAnswers,
  onPrevious, onNext, hasPrevious, hasNext,
}: {
  lesson: Lesson;
  courseModule: CourseModule;
  labels: Labels;
  lang: CourseLanguage;
  copiedKey: string;
  onCopy: (value: string, key: string) => void;
  renderBlock: (block: ContentBlock, lessonKey: string) => React.ReactNode;
  visibleHints: Set<number>;
  setVisibleHints: React.Dispatch<React.SetStateAction<Set<number>>>;
  solutionOpen: boolean;
  setSolutionOpen: (value: boolean) => void;
  answers: Record<string, number>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const mobileTocRef = useRef<HTMLDetailsElement>(null);
  const eyebrowClass = lang === "ar" ? "normal-case tracking-normal" : "uppercase tracking-wider";
  const wideEyebrowClass = lang === "ar" ? "normal-case tracking-normal" : "uppercase tracking-widest";

  useEffect(() => {
    if (mobileTocRef.current) mobileTocRef.current.open = false;
  }, [lesson.id]);

  function jumpToSection(sectionId: string) {
    if (mobileTocRef.current) mobileTocRef.current.open = false;
    window.requestAnimationFrame(() => {
      document.getElementById("lesson-section-" + sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleQuizKey(
    event: React.KeyboardEvent<HTMLButtonElement>,
    questionId: string,
    currentIndex: number,
    optionCount: number,
  ) {
    let nextIndex = currentIndex;
    const forward = lang === "ar" ? -1 : 1;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % optionCount;
    else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + optionCount) % optionCount;
    else if (event.key === "ArrowRight") nextIndex = (currentIndex + forward + optionCount) % optionCount;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - forward + optionCount) % optionCount;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = optionCount - 1;
    else return;
    event.preventDefault();
    setAnswers(previous => ({ ...previous, [questionId]: nextIndex }));
    const radios = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role=radio]");
    radios?.[nextIndex]?.focus();
  }

  return (
    <section lang={lang} data-module-id={courseModule.id} data-lesson-id={lesson.id} aria-labelledby="academy-lesson-title" className="min-w-0">
      <details ref={mobileTocRef} className="sticky top-24 z-20 mb-4 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur xl:hidden sm:mb-5 sm:p-4">
        <summary className={`min-h-11 cursor-pointer py-3 text-sm font-black text-neutral-700 ${eyebrowClass}`}>{labels.contents}</summary>
        <nav className="mt-3 grid gap-1 sm:grid-cols-2" aria-label={labels.contents}>
          {lesson.sections.map(section => <button type="button" key={section.id} onClick={() => jumpToSection(section.id)} className="min-h-11 rounded-lg px-3 py-2 text-start text-sm leading-5 text-neutral-600 hover:bg-neutral-50">{section.title}</button>)}
          {[["run", labels.commands],["errors",labels.errors],["exercise",labels.exercise],["quiz",labels.quiz]].map(([id,title]) => <button type="button" key={id} onClick={() => jumpToSection(id)} className="min-h-11 rounded-lg px-3 py-2 text-start text-sm leading-5 text-neutral-600 hover:bg-neutral-50">{title}</button>)}
        </nav>
      </details>
      <article className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_210px]">
        <div className="min-w-0 space-y-5">
          <header className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-7">
            <div className={`flex flex-wrap items-center gap-2 text-[10px] font-black text-neutral-400 sm:text-[9px] ${eyebrowClass}`}><span>{courseModule.icon} {courseModule.title}</span><span>•</span><span>{labels.lesson} {lesson.order + 1}/4</span><span>•</span><span>{lesson.estimatedMinutes} {labels.duration}</span></div>
            <h1 tabIndex={-1} id="academy-lesson-title" className="mt-3 scroll-mt-40 text-2xl font-black leading-tight text-neutral-950 outline-none sm:scroll-mt-32 sm:text-3xl">{lesson.title}</h1>
            <p className="mt-3 text-sm leading-7 text-neutral-500">{courseModule.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 p-4"><p className={`text-[11px] font-black text-neutral-400 sm:text-[9px] ${eyebrowClass}`}>{labels.prerequisites}</p><ul className="mt-2 space-y-1">{lesson.prerequisites.map(item => <li key={item} className="text-sm leading-6 text-neutral-700 sm:text-[11px] sm:leading-5">✓ {item}</li>)}</ul></div>
              <div className="rounded-xl bg-emerald-50 p-4"><p className={`text-[11px] font-black text-emerald-700 sm:text-[9px] ${eyebrowClass}`}>{labels.objectives}</p><ul className="mt-2 space-y-1">{lesson.objectives.map(item => <li key={item} className="text-sm leading-6 text-emerald-900 sm:text-[11px] sm:leading-5">◆ {item}</li>)}</ul></div>
            </div>
            <div className="mt-4"><p className={`text-[11px] font-black text-neutral-400 sm:text-[9px] ${eyebrowClass}`}>{labels.files}</p><div className="mt-2 flex flex-wrap gap-2">{courseModule.files.map(file => <code dir="ltr" key={file.path} className="max-w-full break-all rounded-lg border border-neutral-100 bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 shadow-sm sm:text-[9px]">{file.path}<span className={"ms-2 " + (file.mode === "existing" ? "text-blue-500" : "text-orange-500")}>{file.mode === "existing" ? labels.existing : labels.create}</span></code>)}</div></div>
          </header>

          {lesson.sections.map((section, sectionIndex) => <section key={section.id} id={"lesson-section-" + section.id} className="scroll-mt-40 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:scroll-mt-32 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-[10px] font-black text-[#3ecf4c]">{String(sectionIndex + 1).padStart(2, "0")}</span><h2 className="text-lg font-black">{section.title}</h2></div><div className="space-y-4">{section.blocks.map(block => renderBlock(block, lesson.id))}</div></section>)}

          <section id="lesson-section-run" className="scroll-mt-40 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:scroll-mt-32 sm:p-7">
            <h2 className="text-lg font-black">{labels.commands}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <CodePanel title={labels.generalCode} filename="Terminal" language="shell" courseLanguage={lang} source={lesson.commands.length ? lesson.commands.join("\n") : "# No command is required for this lesson."} labels={labels} copyKey={lesson.id + "-commands"} copiedKey={copiedKey} onCopy={onCopy} />
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5"><p className={`text-xs font-black text-emerald-700 sm:text-[10px] ${eyebrowClass}`}>{labels.expected}</p><p className="mt-3 text-sm leading-6 text-emerald-950 sm:text-[12px]">{lesson.expectedResult}</p></div>
            </div>
          </section>

          <section id="lesson-section-errors" className="scroll-mt-40 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:scroll-mt-32 sm:p-7">
            <h2 className="text-lg font-black">{labels.errors}</h2>
            <div className="mt-4 space-y-3">{lesson.commonErrors.map((error, index) => <div key={index} className="rounded-xl border border-red-100 bg-red-50/60 p-4"><p className="text-sm font-black leading-6 text-red-800 sm:text-xs">{labels.symptom}: {error.symptom}</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><p className="text-sm leading-6 text-red-700 sm:text-[10px] sm:leading-5"><strong>{labels.cause}:</strong> {error.cause}</p><p className="text-sm leading-6 text-emerald-700 sm:text-[10px] sm:leading-5"><strong>{labels.fix}:</strong> {error.fix}</p></div></div>)}</div>
          </section>

          <section id="lesson-section-exercise" className="scroll-mt-40 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:scroll-mt-32 sm:p-7">
            <p className={`text-[11px] font-black text-violet-600 sm:text-[9px] ${wideEyebrowClass}`}>{labels.exercise}</p>
            <h2 className="mt-2 text-lg font-black">{lesson.exercise.task}</h2>
            <p className={`mt-5 text-xs font-black text-neutral-400 sm:text-[10px] ${eyebrowClass}`}>{labels.steps}</p>
            <ol className="mt-2 space-y-2">{lesson.exercise.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-neutral-700 sm:text-[12px]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700 sm:h-5 sm:w-5 sm:text-[9px]">{index + 1}</span>{step}</li>)}</ol>
            <div className="mt-5"><p className={`mb-2 text-xs font-black text-neutral-400 sm:text-[10px] ${eyebrowClass}`}>{labels.hints}</p><div className="grid gap-2 sm:flex sm:flex-wrap">{lesson.exercise.hints.map((hint, index) => <button type="button" key={index} aria-expanded={visibleHints.has(index)} onClick={() => setVisibleHints(previous => { const next = new Set(previous); next.has(index) ? next.delete(index) : next.add(index); return next; })} className="min-h-11 w-full rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-start text-sm leading-6 text-violet-800 sm:w-auto sm:text-[10px] sm:leading-normal">{visibleHints.has(index) ? hint : labels.hint + " " + (index + 1)}</button>)}</div></div>
            <button type="button" onClick={() => setSolutionOpen(!solutionOpen)} aria-expanded={solutionOpen} aria-controls={lesson.id + "-solution"} className="mt-5 min-h-11 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white sm:text-[11px]">{solutionOpen ? labels.hideSolution : labels.solution}</button>
            {solutionOpen && <div id={lesson.id + "-solution"} className="mt-4 space-y-4"><p className="rounded-xl bg-violet-50 p-4 text-sm leading-6 text-violet-950 sm:text-[12px]">{lesson.exercise.solution.explanation}</p><CodePanel title={labels.solution} filename={lesson.exercise.solution.filename} language={lesson.exercise.solution.language} courseLanguage={lang} source={lesson.exercise.solution.code} labels={labels} copyKey={lesson.id + "-solution"} copiedKey={copiedKey} onCopy={onCopy} /></div>}
          </section>

          <section id="lesson-section-quiz" className="scroll-mt-40 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:scroll-mt-32 sm:p-7">
            <h2 className="text-lg font-black">{labels.quiz}</h2>
            <div className="mt-4 space-y-5">{lesson.quiz.map(question => { const answer = answers[question.id]; return <fieldset key={question.id}><legend id={question.id + "-legend"} className="text-[15px] font-bold leading-6 sm:text-sm">{question.question}</legend><div role="radiogroup" aria-labelledby={question.id + "-legend"} className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, index) => { const selected = answer === index; const correct = index === question.correctIndex; return <button type="button" role="radio" aria-checked={selected} tabIndex={selected || (answer === undefined && index === 0) ? 0 : -1} key={option} onKeyDown={event => handleQuizKey(event, question.id, index, question.options.length)} onClick={() => setAnswers(previous => ({ ...previous, [question.id]: index }))} className={"min-h-11 rounded-xl border p-3 text-start text-sm leading-6 transition sm:text-[11px] sm:leading-5 " + (selected ? (correct ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900") : "border-neutral-200 hover:border-neutral-400")}><span dir="ltr" className="inline-block">{String.fromCharCode(65 + index)}.</span> {option}</button>; })}</div>{answer === undefined ? <p className="mt-3 text-xs text-neutral-400 sm:text-[10px]">{labels.answerFirst}</p> : <div aria-live="polite" className={"mt-3 rounded-xl p-4 text-sm leading-6 sm:text-[11px] " + (answer === question.correctIndex ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900")}><strong>{answer === question.correctIndex ? "✓ " + labels.correct : "↻ " + labels.incorrect}.</strong> {question.answerExplanations[answer]}</div>}</fieldset>; })}</div>
          </section>

          <section className="rounded-2xl bg-[#0d0d0d] p-4 text-white sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2"><div><p className={`text-[11px] font-black text-[#3ecf4c] sm:text-[9px] ${wideEyebrowClass}`}>{labels.recap}</p><ul className="mt-3 space-y-2">{lesson.recap.map(item => <li key={item} className="text-sm leading-6 text-white/70 sm:text-[11px] sm:leading-5">✓ {item}</li>)}</ul></div><div><p className={`text-[11px] font-black text-[#3ecf4c] sm:text-[9px] ${wideEyebrowClass}`}>{labels.next}</p><p className="mt-3 text-sm leading-6 text-white/70 sm:text-[12px]">{lesson.next}</p></div></div>
          </section>

          <nav className="flex justify-between gap-3" aria-label={labels.navigation}><button type="button" disabled={!hasPrevious} onClick={onPrevious} className="min-h-12 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold disabled:opacity-30 sm:px-4 sm:text-[11px]">{lang === "ar" ? "→" : "←"} {labels.previousLesson}</button><button type="button" disabled={!hasNext} onClick={onNext} className="min-h-12 min-w-0 flex-1 rounded-xl bg-[#3ecf4c] px-3 py-3 text-sm font-black text-black disabled:opacity-30 sm:px-4 sm:text-[11px]">{labels.nextLesson} {lang === "ar" ? "←" : "→"}</button></nav>
        </div>

        <aside className="hidden xl:block"><div className="sticky top-32 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"><p className={`text-[10px] font-black text-neutral-400 ${eyebrowClass}`}>{labels.contents}</p><nav className="mt-3 space-y-1">{lesson.sections.map(section => <button type="button" key={section.id} onClick={() => jumpToSection(section.id)} className="block w-full rounded-lg px-2 py-2 text-start text-[10px] leading-4 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950">{section.title}</button>)}{[["run", labels.commands],["errors",labels.errors],["exercise",labels.exercise],["quiz",labels.quiz]].map(([id,title]) => <button type="button" key={id} onClick={() => jumpToSection(id)} className="block w-full rounded-lg px-2 py-2 text-start text-[10px] leading-4 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950">{title}</button>)}</nav></div></aside>
      </article>
    </section>
  );
}
