"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CodeExplanation from "./CodeExplanation";
import { describeSourceFile } from "@/lib/source-code-guide";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";

type FileResult = { path: string; size: number; lines: number; line: number; snippet: string };
type Listing = { results: FileResult[]; total: number; generatedAt: string; fileCount: number; omitted: number; nextOffset: number | null };
type FileContent = { path: string; content: string; size: number; lines: number; generatedAt: string };
const SAVED_KEY = "lecomax-source-favourites-v1";
const PAGE_LINES = 160;

function revealSourceElement(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const header = document.getElementById("course-page-header");
  element.style.scrollMarginTop = `${(header?.offsetHeight ?? 200) + 24}px`;
  element.scrollIntoView({ block: "start", behavior: "instant" });
}

export default function CodeLibrary({ lang }: { lang: CourseLanguage }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [line, setLine] = useState(1);
  const [file, setFile] = useState<FileContent | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [showGuide, setShowGuide] = useState(true);
  const codeViewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      if (Array.isArray(value)) setSaved([...new Set(value.filter((item): item is string => typeof item === "string" && item.length < 600))].slice(0, 200));
    } catch { setStorageError(true); }
    function readHash() {
      const hash = window.location.hash;
      if (!hash.startsWith("#files/")) return;
      const [encoded, parameters = ""] = hash.slice(7).split("?");
      try { setSelected(decodeURIComponent(encoded)); } catch { return; }
      setLine(Math.max(1, Math.floor(Number(new URLSearchParams(parameters).get("line")) || 1)));
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, scope, offset: String(offset) });
        const response = await fetch(`/api/dev-docs/library?${params}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (!controller.signal.aborted) setListing(data);
      } catch (err) { if (!controller.signal.aborted) { setListing(null); setError(err instanceof Error ? err.message : "network"); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, scope, offset, refresh]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setFileLoading(true); setFile(null); setFileError(""); setCopyState("idle");
    void (async () => {
      try {
        const response = await fetch(`/api/dev-docs/content?path=${encodeURIComponent(selected)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (!controller.signal.aborted) setFile(data);
      } catch (err) { if (!controller.signal.aborted) setFileError(err instanceof Error ? err.message : "network"); }
      finally { if (!controller.signal.aborted) setFileLoading(false); }
    })();
    return () => controller.abort();
  }, [selected, refresh]);

  const lines = useMemo(() => file?.content.split("\n") ?? [], [file]);
  const safeLine = Math.max(1, Math.min(line, lines.length || 1));
  const firstLine = Math.floor((safeLine - 1) / PAGE_LINES) * PAGE_LINES;
  useEffect(() => {
    const viewport = codeViewport.current;
    const target = viewport?.querySelector<HTMLElement>(`[data-source-line="${safeLine}"]`);
    if (!viewport || !target) return;
    const bounds = target.getBoundingClientRect();
    const container = viewport.getBoundingClientRect();
    if (bounds.top < container.top || bounds.bottom > container.bottom) viewport.scrollTop += bounds.top - container.top - 16;
  }, [safeLine, file]);
  function selectLine(target: number, reveal = false, focus = false) {
    const next = Math.max(1, Math.min(lines.length, target));
    setLine(next);
    if (file) window.history.replaceState(window.history.state, "", `#files/${encodeURIComponent(file.path)}?line=${next}`);
    requestAnimationFrame(() => {
      if (focus) codeViewport.current?.querySelector<HTMLElement>(`[data-source-line="${next}"]`)?.focus({ preventScroll: true });
      if (reveal && showGuide) {
        const guide = document.getElementById("source-explanation");
        const bounds = guide?.getBoundingClientRect();
        const headerBottom = document.getElementById("course-page-header")?.getBoundingClientRect().bottom ?? 240;
        if (bounds && (bounds.top < headerBottom + 16 || bounds.bottom > window.innerHeight)) revealSourceElement("source-explanation");
      }
    });
  }
  const visibleSaved = saved.filter(value => value.toLowerCase().includes(query.toLowerCase()) && (scope === "all" || value.startsWith(scope + "/")));
  function openFile(value: string, targetLine = 1) {
    setSelected(value); setLine(targetLine);
    window.location.hash = `files/${encodeURIComponent(value)}?line=${targetLine}`;
    requestAnimationFrame(() => revealSourceElement("source-reader"));
  }
  function toggleSaved(value: string) {
    const next = saved.includes(value) ? saved.filter(item => item !== value) : [...saved, value].slice(-200);
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); }
  }
  async function copy() {
    if (!file) return;
    try { await navigator.clipboard.writeText(file.content); setCopyState("copied"); } catch { setCopyState("error"); }
  }
  return <section dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4">
    <header className="rounded-3xl bg-neutral-950 p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-wider text-green-400">{t("Bibliothèque privée", "Private code library", "مكتبة الكود الخاصة")}</p>
      <h2 className="mt-2 text-2xl font-black">{t("Mes fichiers et leur code", "My files and their code", "ملفاتي والكود الخاص بها")}</h2>
      <p className="mt-2 text-sm leading-6 text-white/75">{t("Recherche un nom de fichier ou un mot dans le code. Ouvre un résultat pour lire le vrai fichier du projet, puis ajoute-le à tes favoris.", "Search a filename or a word inside the code. Open a result to read the actual project file and save it to your favourites.", "ابحث عن اسم ملف أو كلمة داخل الكود. افتح النتيجة لقراءة ملف المشروع الحقيقي ثم احفظه في المفضلة.")}</p>
      {listing && <p className="mt-3 text-xs text-white/60">{listing.fileCount} {t("fichiers", "files", "ملفًا")} · {t("Version du", "Snapshot from", "نسخة بتاريخ")} {new Date(listing.generatedAt).toLocaleString(lang === "ar" ? "ar" : lang)}</p>}
      <p className="mt-2 text-xs leading-5 text-white/60">{t("En ligne : copie de la dernière version déployée. Sur localhost : fichiers enregistrés dans VS Code, actualisés après quelques secondes. Les secrets, dépendances et fichiers générés sont exclus.", "Online: a copy from the latest deployment. On localhost: saved VS Code files, refreshed after a few seconds. Secret files, dependencies and generated files are excluded.", "عبر الإنترنت: نسخة من آخر نشر. محليًا: ملفات VS Code المحفوظة وتُحدّث بعد ثوانٍ. تُستبعد الملفات السرية والتبعيات والملفات المولدة.")}</p>
    </header>
    <div className="space-y-3 rounded-2xl border bg-white p-4">
      <label htmlFor="source-query" className="block text-sm font-bold">{t("Rechercher dans mes fichiers et mon code", "Search my files and code", "ابحث في ملفاتي والكود")}</label>
      <input id="source-query" type="search" maxLength={120} value={query} onChange={event => { setQuery(event.target.value); setOffset(0); }} placeholder="app/page.tsx, package.json, checkout…" className="min-h-12 w-full rounded-xl border px-3 text-base" />
      <div className="flex flex-wrap gap-2">
        <select aria-label={t("Dossier", "Folder", "المجلد")} value={scope} onChange={event => { setScope(event.target.value); setOffset(0); }} className="min-h-12 max-w-full rounded-xl border bg-white px-3">{["all", "app", "components", "lib", "scripts", "docs", "supabase", "mobile", "tests"].map(value => <option key={value} value={value}>{value === "all" ? t("Tous les dossiers", "All folders", "كل المجلدات") : value}</option>)}</select>
        <button aria-pressed={savedOnly} onClick={() => setSavedOnly(value => !value)} className="min-h-12 rounded-xl border px-3 text-sm font-bold aria-pressed:bg-green-50">☆ {t("Mes favoris", "My favourites", "مفضلتي")} ({saved.length})</button>
        <button onClick={() => setRefresh(value => value + 1)} className="min-h-12 rounded-xl border px-3 text-sm">{t("Actualiser", "Refresh", "تحديث")}</button>
      </div>
      {storageError && <p role="alert" className="text-sm text-amber-800">{t("Les favoris ne peuvent pas être sauvegardés dans ce navigateur.", "Favourites cannot be saved in this browser.", "تعذّر حفظ المفضلة في هذا المتصفح.")}</p>}
    </div>
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
      <div className="min-w-0 rounded-2xl border bg-white p-3">
        <p role="status" className="p-2 text-sm font-bold">{savedOnly ? `${visibleSaved.length} ${t("favoris", "favourites", "ملفات مفضلة")}` : loading ? t("Recherche…", "Searching…", "جارٍ البحث…") : `${listing?.total ?? 0} ${t("résultats", "results", "نتائج")}`}</p>
        {error && !savedOnly && <div role="alert" className="p-3 text-sm text-red-800">{error === "403" ? <Link href="/admin/how-it-was-built/unlock" className="underline">{t("Déverrouille à nouveau la section propriétaire.", "Unlock the owner section again.", "افتح قسم المالك من جديد.")}</Link> : t("Bibliothèque indisponible. Réessaie avec Actualiser. Une version en ligne doit être reconstruite avec sa bibliothèque.", "Library unavailable. Try Refresh. An online deployment must be built with its library.", "المكتبة غير متاحة. جرّب التحديث. يجب بناء النسخة المنشورة مع مكتبتها.")}</div>}
        <div className="max-h-[45dvh] space-y-2 overflow-y-auto lg:max-h-[70dvh]">{(savedOnly ? visibleSaved.map(path => ({ path, line: 1, snippet: "", size: 0, lines: 0 })) : loading ? [] : listing?.results ?? []).map(item => <div key={item.path} className={"rounded-xl border p-3 " + (selected === item.path ? "border-green-500 bg-green-50" : "border-neutral-100")}>
          <button onClick={() => openFile(item.path, item.line)} className="min-h-11 w-full text-start"><span dir="ltr" className="block break-all font-mono text-sm font-semibold">{item.path}</span>{item.snippet && <span dir="ltr" className="mt-2 block break-all text-xs leading-5 text-neutral-600">L{item.line}: {item.snippet}</span>}</button>
          <button aria-pressed={saved.includes(item.path)} onClick={() => toggleSaved(item.path)} className="mt-1 min-h-11 text-xs font-bold text-emerald-800">{saved.includes(item.path) ? "★ " : "☆ "}{saved.includes(item.path) ? t("Retirer des favoris", "Remove favourite", "إزالة من المفضلة") : t("Garder dans mes favoris", "Save to favourites", "حفظ في المفضلة")}</button>
        </div>)}</div>
        {((savedOnly && !visibleSaved.length) || (!savedOnly && !loading && !error && listing?.total === 0)) && <p className="p-3 text-sm text-neutral-500">{t("Aucun fichier. Essaie un autre mot ou un autre dossier.", "No files. Try another word or folder.", "لا توجد ملفات. جرّب كلمة أو مجلدًا آخر.")}</p>}
        {!savedOnly && !loading && listing && <div className="mt-3 flex justify-between gap-2"><button disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 60))} className="min-h-11 rounded-xl border px-3 text-sm disabled:opacity-30">{t("Précédents", "Previous", "السابق")}</button><button disabled={listing.nextOffset === null} onClick={() => setOffset(listing.nextOffset ?? 0)} className="min-h-11 rounded-xl border px-3 text-sm disabled:opacity-30">{t("Suivants", "Next", "التالي")}</button></div>}
      </div>
      <article id="source-reader" className="min-w-0 scroll-mt-40 overflow-hidden rounded-2xl border bg-[#15171b] text-neutral-100">
        <div className="space-y-3 border-b border-white/15 p-4">
          <h3 dir="ltr" className="break-all font-mono text-sm font-bold">{selected || t("Choisis un fichier", "Choose a file", "اختر ملفًا")}</h3>
          {file && <div className="flex flex-wrap items-center gap-2 text-xs"><span>{file.lines} {t("lignes", "lines", "أسطر")} · {Math.ceil(file.size / 1024)} KB</span><button onClick={copy} className="min-h-11 rounded-lg border border-white/20 px-3">{copyState === "copied" ? t("Copié", "Copied", "تم النسخ") : copyState === "error" ? t("Copie impossible · réessayer", "Copy failed · retry", "تعذّر النسخ · أعد المحاولة") : t("Copier le code", "Copy code", "نسخ الكود")}</button><button onClick={() => toggleSaved(file.path)} className="min-h-11 rounded-lg border border-white/20 px-3">{saved.includes(file.path) ? "★" : "☆"} {t("Favori", "Favourite", "مفضل")}</button></div>}
          {file && <><p className="text-sm leading-6 text-neutral-300">{describeSourceFile(file.path, lang)}</p><button type="button" aria-pressed={showGuide} aria-controls="source-explanation" onClick={() => setShowGuide(value => !value)} className="min-h-11 rounded-xl border border-emerald-400/40 px-3 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/10 aria-pressed:bg-emerald-400/15">{showGuide ? t("✓ Mode apprendre", "✓ Learn mode", "✓ وضع التعلم") : t("Activer les explications", "Turn on explanations", "تفعيل الشروحات")}</button></>}
        </div>
        {fileLoading && <p role="status" className="p-5 text-sm">{t("Chargement du code…", "Loading code…", "جارٍ تحميل الكود…")}</p>}
        {fileError && <p role="alert" className="p-5 text-sm text-amber-200">{fileError === "403" ? t("Accès refusé. Vérifie le déverrouillage propriétaire.", "Access denied. Check the owner unlock.", "رُفض الوصول. تحقق من فتح قسم المالك.") : t("Ce fichier n’est pas disponible dans cette version. Il a pu être exclu ou déplacé.", "This file is unavailable in this version. It may be excluded or moved.", "الملف غير متاح في هذه النسخة. ربما استُبعد أو نُقل.")}</p>}
        {!selected && <p className="p-5 text-sm leading-7 text-neutral-400">{t("Commence par app/page.tsx ou package.json. Le lecteur affiche le code, sans l’exécuter ni modifier tes fichiers.", "Start with app/page.tsx or package.json. The reader displays code without running it or editing files.", "ابدأ بـapp/page.tsx أو package.json. يعرض القارئ الكود دون تشغيله أو تعديل الملفات.")}</p>}
        {file && <>
          {showGuide && <CodeExplanation path={file.path} lines={lines} line={safeLine} lang={lang} onLineChange={target => selectLine(target)} />}
          <div className="space-y-2 border-b border-white/10 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs"><label htmlFor="source-line">{t("Aller à la ligne", "Go to line", "انتقل إلى السطر")}</label><input id="source-line" type="number" min={1} max={lines.length} value={safeLine} onChange={event => selectLine(Math.floor(Number(event.target.value) || 1))} className="min-h-11 w-24 rounded-lg border border-white/20 bg-neutral-900 px-2" /><span>{firstLine + 1}–{Math.min(firstLine + PAGE_LINES, lines.length)} / {lines.length}</span></div>
            <p id="source-line-help" className="text-xs leading-5 text-emerald-200/80">{showGuide ? t("Clique sur une ligne pour la comprendre. Au clavier : utilise ↑ et ↓ pour avancer.", "Click a line to understand it. With a keyboard: use ↑ and ↓ to move through the code.", "انقر على سطر لفهمه. بلوحة المفاتيح: استخدم ↑ و↓ للتنقل بين الأسطر.") : t("Sélectionne une ligne ; active le mode apprendre pour afficher son explication.", "Select a line; turn on Learn mode to see its explanation.", "حدد سطرًا وفعّل وضع التعلم لعرض شرحه.")}</p>
          </div>
          <div ref={codeViewport} dir="ltr" className="max-h-[55dvh] overflow-auto py-2 text-xs leading-6"><pre><code>{lines.slice(firstLine, firstLine + PAGE_LINES).map((value, index) => {
            const number = firstLine + index + 1;
            return <button type="button" key={number} data-source-line={number} aria-label={`${t("Expliquer la ligne", "Explain line", "شرح السطر")} ${number}: ${value.trim().slice(0, 120) || t("ligne vide", "empty line", "سطر فارغ")}`} aria-pressed={number === safeLine} aria-controls={showGuide ? "source-explanation" : undefined} aria-describedby="source-line-help" tabIndex={number === safeLine ? 0 : -1} onClick={() => selectLine(number, true)} onKeyDown={event => {
              const target = event.key === "ArrowDown" ? number + 1 : event.key === "ArrowUp" ? number - 1 : event.key === "Home" ? 1 : event.key === "End" ? lines.length : null;
              if (target !== null) { event.preventDefault(); selectLine(target, false, true); }
            }} className={"block min-h-11 w-full min-w-max border-s-2 pe-4 text-left font-mono transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-400 " + (number === safeLine ? "border-emerald-400 bg-emerald-400/15 text-emerald-50" : "border-transparent text-neutral-300 hover:bg-white/5")}><span aria-hidden="true" className={"me-4 inline-block w-12 select-none text-right " + (number === safeLine ? "text-emerald-300" : "text-neutral-500")}>{number}</span><span>{value || " "}</span></button>;
          })}</code></pre></div>
          <div className="flex justify-between gap-2 border-t border-white/10 p-3"><button disabled={firstLine === 0} onClick={() => selectLine(firstLine - PAGE_LINES + 1)} className="min-h-11 rounded-lg border border-white/20 px-3 text-xs disabled:opacity-30">{t("Lignes précédentes", "Previous lines", "الأسطر السابقة")}</button><button disabled={firstLine + PAGE_LINES >= lines.length} onClick={() => selectLine(firstLine + PAGE_LINES + 1)} className="min-h-11 rounded-lg border border-white/20 px-3 text-xs disabled:opacity-30">{t("Lignes suivantes", "Next lines", "الأسطر التالية")}</button></div>
        </>}
      </article>
    </div>
    <p className="text-xs text-neutral-500">{t("Les favoris sont enregistrés sur ce navigateur. Le code est conservé dans la version privée du site, pas dans les favoris.", "Favourites are saved in this browser. Code is stored in the private site snapshot, not in favourites.", "تُحفظ المفضلة في هذا المتصفح. يُخزّن الكود في نسخة الموقع الخاصة وليس في المفضلة.")}</p>
  </section>;
}
