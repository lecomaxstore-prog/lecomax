"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import DailyLearning from "./DailyLearning";
import CodingTutor from "./CodingTutor";
import { translate } from "./course/journey";
import CodeLibrary from "./CodeLibrary";

const AcademySection = dynamic(() => import("./AcademySection"), {
  loading: () => (
    <div role="status" aria-live="polite" aria-label="Chargement de l'Académie" className="animate-pulse space-y-3 motion-reduce:animate-none">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-7">
        <div className="h-3 w-24 rounded-full bg-gray-100" />
        <div className="mt-4 h-7 w-4/5 max-w-md rounded-lg bg-gray-200" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded bg-gray-100" />
        <div className="mt-2 h-4 w-3/4 max-w-xl rounded bg-gray-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden h-72 rounded-2xl border border-gray-100 bg-white sm:block" />
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-7">
          <div className="h-4 w-28 rounded bg-gray-100" />
          <div className="mt-4 h-8 w-5/6 rounded-lg bg-gray-200" />
          <div className="mt-6 space-y-3"><div className="h-4 rounded bg-gray-100" /><div className="h-4 rounded bg-gray-100" /><div className="h-4 w-2/3 rounded bg-gray-100" /></div>
        </div>
      </div>
      <span className="sr-only">Chargement de l’Académie · Loading Academy · جارٍ تحميل الأكاديمية</span>
    </div>
  ),
});

// ─── Language ─────────────────────────────────────────────────────────────────
const CodeCoachGame = dynamic(() => import("./CodeCoachGame"), {
  loading: () => <div role="status" className="min-h-96 animate-pulse rounded-3xl border border-gray-100 bg-white" />,
});

type Lang = "fr" | "en" | "ar";

const UI: Record<Lang, {
  title: string; subtitle: string; copy: string; copied: string; filter: string;
  selectFile: string; lines: string; loading: string; loadingTree: string;
  error: string; noResults: string; noFile: string;
  tabs: Record<string, string>;
  heroTitle: string; heroSub: string;
  archTitle: string; archSub: string;
  techTitle: string; techSub: string;
  envTitle: string; envSub: string;
  searchTitle: string; searchSub: string;
  pagesTitle: string; pagesSub: string;
  envRule: string; envRuleText: string;
  stepLabel: string; phaseLabel: string;
  type: string; route: string; desc: string; file: string; feat: string;
  pub: string; adm: string; api: string;
  secret: string; req: string; opt: string;
  deploy: string; orderFlow: string; productFlow: string;
  files: string; results: string;
  search_hint: string;
}> = {
  fr: {
    title: "Comment Le Site A Été Construit", subtitle: "Explorateur de code réel · De 0 à Héros · Architecture complète",
    copy: "Copier", copied: "✓ Copié", filter: "Filtrer…",
    selectFile: "Cliquez sur un fichier dans l'arborescence", lines: "lignes",
    loading: "Chargement…", loadingTree: "Chargement de l'arbre…",
    error: "Erreur de connexion à l'API", noResults: "Aucun résultat",
    noFile: "Aucun fichier trouvé",
    tabs: { tutor: "Tuteur IA", start: "Commencer ici", academy: "Académie 0→Héros", hero: "De 0 à Héros", arch: "Architecture", files: "Mes fichiers", tech: "Stack", env: "Variables", pages: "Toutes les Pages", search: "Recherche", guide: "Guide", debug: "Déboguer", supabase: "Supabase", deploy: "Déployer", cours: "Cours technique", mentor: "Mentor" },
    heroTitle: "De 0 à Héros — Construction complète du site",
    heroSub: "Chaque phase : configuration → initialisation → Supabase → frontend → admin → APIs → GitHub → Vercel → Namecheap → outils de croissance → cycle commande → composants → variables env → flux de données.",
    archTitle: "Architecture complète", archSub: "Comment GitHub, Vercel, Supabase et les APIs externes s'articulent.",
    techTitle: "Stack technique", techSub: "Toutes les technologies, versions, et pourquoi chacune a été choisie.",
    envTitle: "Variables d'environnement", envSub: "Toutes les variables du projet. Valeurs jamais affichées ici.",
    searchTitle: "Recherche", searchSub: "Cherchez parmi les fichiers, packages, APIs, concepts et variables.",
    pagesTitle: "Toutes les Pages du Site", pagesSub: "Chaque page frontend et admin avec son rôle, fichier source, fonctionnalités clés.",
    envRule: "Règle d'or :", envRuleText: "Variables NEXT_PUBLIC_ sont exposées au navigateur — jamais de secrets. Secrets dans .env.local (local) et Vercel Dashboard → Settings → Env (production).",
    stepLabel: "étape", phaseLabel: "phase",
    type: "Type", route: "Route", desc: "Description", file: "Fichier", feat: "Fonctionnalités",
    pub: "Public", adm: "Admin", api: "API",
    secret: "SECRET", req: "REQUIS", opt: "OPTIONNEL",
    deploy: "FLUX DE DÉPLOIEMENT",
    orderFlow: "Commande client → Base de données → Email",
    productFlow: "Admin crée produit → Visible sur le site",
    files: "fichiers dans le projet", results: "résultat",
    search_hint: "Cherchez : CartContext, supabase, auth, orders, RESEND, checkout, middleware, OpenAI…",
  },
  en: {
    title: "How The Site Was Built", subtitle: "Real code explorer · From 0 to Hero · Complete architecture",
    copy: "Copy", copied: "✓ Copied", filter: "Filter…",
    selectFile: "Click a file in the file tree", lines: "lines",
    loading: "Loading…", loadingTree: "Loading file tree…",
    error: "API connection error", noResults: "No results",
    noFile: "No files found",
    tabs: { tutor: "AI tutor", start: "Start here", academy: "Academy 0→Hero", hero: "0 to Hero", arch: "Architecture", files: "My files", tech: "Stack", env: "Variables", pages: "All Pages", search: "Search", guide: "Guide", debug: "Debug", supabase: "Supabase", deploy: "Deploy", cours: "Technical course", mentor: "Mentor" },
    heroTitle: "0 to Hero — Full Site Build",
    heroSub: "Every phase: setup → init → Supabase → frontend → admin → APIs → GitHub → Vercel → Namecheap → growth tools → order lifecycle → components → env vars → data flows.",
    archTitle: "Complete Architecture", archSub: "How GitHub, Vercel, Supabase, and external APIs connect together.",
    techTitle: "Tech Stack", techSub: "All technologies, versions, and why each one was chosen.",
    envTitle: "Environment Variables", envSub: "All project variables. Values are never shown here.",
    searchTitle: "Search", searchSub: "Search across files, packages, APIs, concepts, and variables.",
    pagesTitle: "All Site Pages", pagesSub: "Every frontend and admin page with its role, source file, and key features.",
    envRule: "Golden rule:", envRuleText: "NEXT_PUBLIC_ variables are exposed to the browser — never put secrets there. Secrets go in .env.local (local) and Vercel Dashboard → Settings → Env (production).",
    stepLabel: "step", phaseLabel: "phase",
    type: "Type", route: "Route", desc: "Description", file: "File", feat: "Features",
    pub: "Public", adm: "Admin", api: "API",
    secret: "SECRET", req: "REQUIRED", opt: "OPTIONAL",
    deploy: "DEPLOYMENT FLOW",
    orderFlow: "Customer Order → Database → Email",
    productFlow: "Admin Creates Product → Live on Site",
    files: "files in project", results: "result",
    search_hint: "Search: CartContext, supabase, auth, orders, RESEND, checkout, middleware, OpenAI…",
  },
  ar: {
    title: "كيف تم بناء الموقع", subtitle: "مستكشف الكود · من الصفر للاحتراف · البنية الكاملة",
    copy: "نسخ", copied: "✓ تم النسخ", filter: "تصفية…",
    selectFile: "انقر على ملف في شجرة الملفات", lines: "سطر",
    loading: "جاري التحميل…", loadingTree: "تحميل شجرة الملفات…",
    error: "خطأ في الاتصال بالـ API", noResults: "لا توجد نتائج",
    noFile: "لا توجد ملفات",
    tabs: { tutor: "معلّم ذكي", start: "ابدأ هنا", academy: "أكاديمية من الصفر", hero: "من الصفر", arch: "البنية", files: "المستكشف", tech: "التقنيات", env: "المتغيرات", pages: "جميع الصفحات", search: "بحث", guide: "دليل", debug: "تصحيح", supabase: "سوبابيس", deploy: "نشر", cours: "دورة تقنية", mentor: "معلم" },
    heroTitle: "من الصفر إلى الاحتراف — بناء الموقع بالكامل",
    heroSub: "كل مرحلة: الإعداد → التهيئة → Supabase → الواجهة → الإدارة → APIs → GitHub → Vercel → Namecheap → أدوات النمو → دورة الطلب → المكوّنات → متغيرات البيئة → تدفقات البيانات.",
    archTitle: "البنية الكاملة", archSub: "كيف تتصل GitHub وVercel وSupabase وواجهات التطبيقات الخارجية.",
    techTitle: "التقنيات المستخدمة", techSub: "جميع التقنيات والإصدارات وسبب اختيار كل منها.",
    envTitle: "متغيرات البيئة", envSub: "جميع متغيرات المشروع. القيم لا تُعرض هنا أبداً.",
    searchTitle: "بحث", searchSub: "ابحث في الملفات والحزم وواجهات API والمفاهيم والمتغيرات.",
    pagesTitle: "جميع صفحات الموقع", pagesSub: "كل صفحة عامة وإدارية مع دورها وملفها المصدري وميزاتها الأساسية.",
    envRule: "القاعدة الذهبية:", envRuleText: "متغيرات NEXT_PUBLIC_ مكشوفة للمتصفح — لا تضع فيها أسراراً. الأسرار في .env.local (محلياً) وVercel Dashboard (الإنتاج).",
    stepLabel: "خطوة", phaseLabel: "مرحلة",
    type: "النوع", route: "المسار", desc: "الوصف", file: "الملف", feat: "الميزات",
    pub: "عام", adm: "إدارة", api: "API",
    secret: "سري", req: "مطلوب", opt: "اختياري",
    deploy: "تدفق النشر",
    orderFlow: "طلب العميل → قاعدة البيانات → البريد",
    productFlow: "الإدارة تنشئ منتجاً → يظهر على الموقع",
    files: "ملف في المشروع", results: "نتيجة",
    search_hint: "ابحث: CartContext, supabase, auth, orders, RESEND, checkout, middleware, OpenAI…",
  },
};

// ─── File tree types ─────────────────────────────────────────────────────────
type FileNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  ext?: string;
  size?: number;
  binary?: boolean;
  children?: FileNode[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const EXT_BG: Record<string, string> = {
  ts: "bg-blue-900/40 text-blue-300", tsx: "bg-violet-900/40 text-violet-300",
  js: "bg-yellow-900/40 text-yellow-300", mjs: "bg-yellow-900/40 text-yellow-300",
  json: "bg-green-900/40 text-green-300", css: "bg-pink-900/40 text-pink-300",
  md: "bg-gray-800 text-gray-300",
};

function FileIcon({ ext, binary }: { ext?: string; binary?: boolean }) {
  if (binary) return <span className="text-[10px]">🖼</span>;
  const colors: Record<string, string> = {
    ts: "#3b82f6", tsx: "#8b5cf6", js: "#eab308", mjs: "#eab308",
    json: "#22c55e", css: "#ec4899", md: "#94a3b8",
  };
  const color = ext ? (colors[ext] ?? "#94a3b8") : "#94a3b8";
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={open ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

// ─── Simple syntax highlighting (no deps) ────────────────────────────────────
function highlightLine(line: string): React.ReactNode {
  const tokens: { text: string; cls: string }[] = [];
  let rem = line;
  while (rem.length > 0) {
    // comment
    const cm = rem.match(/^(\/\/.*)/);
    if (cm) { tokens.push({ text: cm[1], cls: "text-[#6a9955]" }); break; }
    // double-quoted string
    const dq = rem.match(/^("(?:[^"\\]|\\.)*")/);
    if (dq) { tokens.push({ text: dq[1], cls: "text-[#ce9178]" }); rem = rem.slice(dq[1].length); continue; }
    // single-quoted string
    const sq = rem.match(/^('(?:[^'\\]|\\.)*')/);
    if (sq) { tokens.push({ text: sq[1], cls: "text-[#ce9178]" }); rem = rem.slice(sq[1].length); continue; }
    // number
    const nm = rem.match(/^(\b\d+(?:\.\d+)?\b)/);
    if (nm) { tokens.push({ text: nm[1], cls: "text-[#b5cea8]" }); rem = rem.slice(nm[1].length); continue; }
    // keyword
    const kw = rem.match(/^(\b(?:import|export|default|from|const|let|var|function|async|await|return|if|else|for|while|try|catch|type|interface|extends|implements|class|new|typeof|void|null|undefined|true|false|this|super|static|readonly|public|private|protected)\b)/);
    if (kw) { tokens.push({ text: kw[1], cls: "text-[#569cd6]" }); rem = rem.slice(kw[1].length); continue; }
    // identifier
    const id = rem.match(/^([A-Za-z_$][\w$]*)/);
    if (id) { tokens.push({ text: id[1], cls: "text-[#dcdcaa]" }); rem = rem.slice(id[1].length); continue; }
    tokens.push({ text: rem[0], cls: "text-[#d4d4d4]" });
    rem = rem.slice(1);
  }
  return <>{tokens.map((t, i) => <span key={i} className={t.cls}>{t.text}</span>)}</>;
}

function highlight(code: string, ext?: string): React.ReactNode {
  if (!ext || !["ts", "tsx", "js", "mjs", "json"].includes(ext)) return <span className="text-[#d4d4d4]">{code}</span>;
  return (
    <>
      {code.split("\n").map((line, i) => (
        <div key={i}>{line ? highlightLine(line) : <>&nbsp;</>}</div>
      ))}
    </>
  );
}

// ─── Filter tree ──────────────────────────────────────────────────────────────
function filterTree(nodes: FileNode[], q: string): FileNode[] {
  if (!q) return nodes;
  const ql = q.toLowerCase();
  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.type === "dir") {
      const filtered = filterTree(node.children ?? [], q);
      if (filtered.length > 0) acc.push({ ...node, children: filtered });
    } else if (node.name.toLowerCase().includes(ql) || node.path.toLowerCase().includes(ql)) {
      acc.push(node);
    }
    return acc;
  }, []);
}

function countFiles(nodes: FileNode[]): number {
  return nodes.reduce((n, node) => n + (node.type === "file" ? 1 : countFiles(node.children ?? [])), 0);
}

// ─── Tree Node ────────────────────────────────────────────────────────────────
function TreeNode({ node, depth, selected, onSelect, expanded, onToggle }: {
  node: FileNode; depth: number; selected: string | null;
  onSelect: (n: FileNode) => void; expanded: Set<string>; onToggle: (p: string) => void;
}) {
  const isOpen = expanded.has(node.path);
  const isSel = selected === node.path;

  if (node.type === "dir") {
    return (
      <div>
        <button onClick={() => onToggle(node.path)}
          aria-expanded={isOpen}
          className="flex min-h-11 w-full items-center gap-1.5 rounded pe-2 text-start text-[13px] transition-colors hover:bg-white/8 sm:min-h-0 sm:py-[3px] sm:text-[12px]"
          style={{ paddingLeft: `${6 + depth * 14}px` }}>
          <svg className={`shrink-0 text-white/30 transition-transform ${isOpen ? "rotate-90" : ""}`} width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
          <FolderIcon open={isOpen} />
          <span className="text-[#ce9178] font-medium truncate">{node.name}</span>
          <span className="ml-auto text-white/20 text-[9px] shrink-0">{(node.children ?? []).length}</span>
        </button>
        {isOpen && (node.children ?? []).map(child => (
          <TreeNode key={child.path} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} expanded={expanded} onToggle={onToggle} />
        ))}
      </div>
    );
  }
  return (
    <button onClick={() => onSelect(node)}
      className={`flex min-h-11 w-full items-center gap-1.5 rounded pe-2 text-start text-[13px] transition-colors sm:min-h-0 sm:py-[3px] sm:text-[12px] ${isSel ? "bg-[#094771] text-white" : "hover:bg-white/8 text-white/55"}`}
      style={{ paddingLeft: `${6 + depth * 14}px` }}>
      <FileIcon ext={node.ext} binary={node.binary} />
      <span className="truncate flex-1">{node.name}</span>
      {!!node.size && <span className="text-white/20 text-[9px] shrink-0">{fmtSize(node.size)}</span>}
    </button>
  );
}

// ─── Explorer Section ─────────────────────────────────────────────────────────
function ExplorerSection() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<FileNode | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["app", "components", "lib"]));
  const [treeQ, setTreeQ] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileView, setMobileView] = useState<"tree" | "code">("tree");
  const explorerTouchX = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/dev-docs/tree")
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setTree(d) : setError(true))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const onSelect = useCallback(async (node: FileNode) => {
    setSelected(node); setCode(null); setCodeLoading(true); setMobileView("code");
    try {
      const res = await fetch(`/api/dev-docs/content?path=${encodeURIComponent(node.path)}`);
      const data = await res.json();
      setCode(data.content ?? "// Erreur");
    } catch { setCode("// Erreur de chargement"); }
    finally { setCodeLoading(false); }
  }, []);

  const onToggle = useCallback((p: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  }, []);

  const filtered = useMemo(() => filterTree(tree, treeQ), [tree, treeQ]);
  const total = useMemo(() => countFiles(tree), [tree]);
  const lines = useMemo(() => code ? code.split("\n").length : 0, [code]);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-xl font-black text-gray-900">Explorateur de fichiers réel</h2>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? "Chargement…" : error ? "Erreur de connexion à l'API" : `${total} fichiers dans le projet lecomax/ — cliquez n'importe quel fichier pour voir son code source réel.`}
        </p>
      </div>

      <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
        {/* Mobile toggle */}
        <div className="flex border-b border-white/[0.08] bg-[#252526] sm:hidden" role="group" aria-label="Vue de l'explorateur">
          <button onClick={() => setMobileView("tree")}
            aria-pressed={mobileView === "tree"}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 text-sm font-bold transition-all ${mobileView === "tree" ? "border-b-2 border-b-[#3ecf4c] bg-[#1e1e1e] text-white" : "text-white/40 hover:text-white/60"}`}>
            📁 <span>Fichiers</span>
          </button>
          <button onClick={() => setMobileView("code")}
            aria-pressed={mobileView === "code"}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 text-sm font-bold transition-all ${mobileView === "code" ? "border-b-2 border-b-[#3ecf4c] bg-[#1e1e1e] text-white" : "text-white/40 hover:text-white/60"}`}>
            📄 <span className="truncate max-w-[140px]">{selected ? selected.name : "Code"}</span>
          </button>
        </div>
        {/* Tree + Code row — h- (not min-h) is required for flex-1 overflow-y-auto to scroll */}
        <div className="flex h-[62dvh] min-h-[420px] max-h-[540px] sm:h-[640px] sm:max-h-none">
        {/* Sidebar */}
        <div className={`${mobileView === "code" ? "hidden sm:flex" : "flex"} w-full sm:w-64 shrink-0 border-r border-white/[0.08] flex-col`}>
          <div className="px-3 py-2.5 border-b border-white/[0.08] bg-[#252526]">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">LECOMAX</p>
            <div className="relative">
              <svg className="absolute start-3 top-1/2 -translate-y-1/2 text-white/25" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={treeQ} onChange={e => setTreeQ(e.target.value)} placeholder="Filtrer…"
                className="min-h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.06] ps-9 pe-2 text-base text-white/70 placeholder-white/25 transition-all focus:border-white/20 focus:bg-white/[0.09] focus:outline-none sm:min-h-0 sm:py-1.5 sm:text-[11px]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1 min-h-0">
            {loading && <p className="px-3 py-6 text-white/30 text-[11px]">Chargement de l&apos;arbre…</p>}
            {error && (
              <div className="px-3 py-6 space-y-2">
                <p className="text-amber-400 text-[11px] font-semibold">Fichiers non disponibles</p>
                <p className="text-white/30 text-[10px] leading-relaxed">Cet explorateur lit directement le disque du serveur. Il fonctionne uniquement en développement local (localhost).</p>
                <p className="text-white/20 text-[10px] leading-relaxed">En production (Vercel), le système de fichiers source n&apos;est pas accessible. Ouvrez <span className="text-white/40 font-mono">localhost:3000/admin/how-it-was-built</span> depuis votre PC de développement.</p>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && <p className="px-3 py-6 text-white/30 text-[11px]">Aucun fichier trouvé.</p>}
            {filtered.map(node => (
              <TreeNode key={node.path} node={node} depth={0} selected={selected?.path ?? null} onSelect={onSelect} expanded={expanded} onToggle={onToggle} />
            ))}
          </div>
        </div>

        {/* Code viewer */}
        <div className={`${mobileView === "tree" ? "hidden sm:flex" : "flex"} flex-1 min-w-0 min-h-0 flex-col`}>
          {/* File tab */}
          <div className="flex min-h-11 items-center gap-0 border-b border-white/[0.08] bg-[#252526] sm:min-h-[36px]">
            {selected ? (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] border-t-2 border-t-[#007acc] min-w-0">
                <FileIcon ext={selected.ext} />
                <span className="text-white text-[11px] sm:text-[12px] font-medium truncate max-w-[120px] sm:max-w-none">{selected.name}</span>
                {selected.ext && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${EXT_BG[selected.ext] ?? "bg-gray-800 text-gray-400"}`}>{selected.ext.toUpperCase()}</span>}
              </div>
            ) : <div className="px-4 py-2 text-white/20 text-[11px] sm:text-[12px]">Sélectionnez un fichier dans l&apos;arborescence</div>}
            {selected && (
              <div className="ml-auto px-2 flex items-center gap-2 shrink-0">
                <button onClick={() => { if (code) { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}}
                  aria-label={copied ? "Code copié" : "Copier le code"}
                  className="flex min-h-11 items-center gap-1 rounded bg-white/8 px-3 text-xs text-white/70 transition-colors hover:bg-white/15 hover:text-white sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-[10px]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  {copied ? "✓" : "Copier"}
                </button>
              </div>
            )}
          </div>

          {/* Code area */}
          <div className="flex-1 overflow-auto">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-white/15 gap-3 select-none">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p className="text-[13px]">Cliquez sur un fichier</p>
              </div>
            ) : codeLoading ? (
              <div className="flex items-center justify-center h-32 text-white/30 text-[12px] gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                Chargement de {selected.name}…
              </div>
            ) : (
              <div dir="ltr" className="flex font-mono text-[12px] sm:text-[11.5px]">
                <div className="select-none shrink-0 text-right text-white/20 bg-[#1e1e1e] px-2 sm:px-3 py-4 leading-[1.65] min-w-[32px] sm:min-w-[42px] border-r border-white/[0.06]">
                  {(code ?? "").split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <pre className="flex-1 text-[#d4d4d4] px-2 sm:px-4 py-4 leading-[1.65] overflow-x-auto whitespace-pre">
                  {highlight(code ?? "", selected.ext)}
                </pre>
              </div>
            )}
          </div>

          {/* Status bar */}
          {selected && (
            <div className="bg-[#007acc] px-3 py-1.5 flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] text-white/80 shrink-0">
              <span className="truncate">{selected.path}</span>
              <span className="ml-auto shrink-0">{lines} lignes</span>
              {!!selected.size && <span className="shrink-0 hidden sm:inline">{fmtSize(selected.size)}</span>}
              {selected.ext && <span className="uppercase shrink-0">{selected.ext}</span>}
            </div>
          )}
        </div>
        </div>{/* end tree+code row */}
      </div>
    </div>
  );
}

// ─── From 0 to Hero ──────────────────────────────────────────────────────────
const PHASES = [
  {
    num: "00", label: "Avant de coder — Configurer son environnement", color: "bg-slate-700",
    steps: [
      {
        title: "Étape 1 — Installer Node.js (v20 LTS)",
        desc: "Node.js est le moteur d'exécution JavaScript côté serveur. Il inclut npm (le gestionnaire de paquets). Sans lui, rien ne fonctionne.",
        code: `# 1. Aller sur https://nodejs.org
# 2. Télécharger la version LTS (Long Term Support) — v20 ou plus
# 3. Installer le .msi (Windows) ou .pkg (Mac) — next, next, finish.

# 4. Vérifier l'installation dans le terminal :
node -v    # doit afficher v20.x.x ou +
npm -v     # doit afficher 10.x.x ou +

# Si une ancienne version est déjà installée, utilise NVM (Node Version Manager)
# https://github.com/nvm-sh/nvm  (Mac/Linux)
# https://github.com/coreybutler/nvm-windows  (Windows)`
      },
      {
        title: "Étape 2 — Installer Git",
        desc: "Git est le système de gestion de version. Il permet de sauvegarder l'historique du code et de déployer sur Vercel via GitHub.",
        code: `# 1. Aller sur https://git-scm.com/downloads
# 2. Télécharger et installer (laisser toutes les options par défaut)

# 3. Vérifier l'installation :
git --version    # doit afficher git version 2.x.x

# 4. Configurer son identité (une seule fois) :
git config --global user.name  "Ton Nom"
git config --global user.email "ton@email.com"`
      },
      {
        title: "Étape 3 — Installer VS Code",
        desc: "Visual Studio Code est l'éditeur de code utilisé pour tout ce projet. Gratuit, léger, et puissant avec ses extensions.",
        code: `# 1. Aller sur https://code.visualstudio.com
# 2. Télécharger et installer la version stable

# 3. Extensions INDISPENSABLES à installer dans VS Code :
#    (Ctrl+Shift+X pour ouvrir le panneau Extensions)
#
#    ESLint                  → Détecte les erreurs JS/TS en temps réel
#    Prettier                → Formate le code automatiquement
#    Tailwind CSS IntelliSense → Autocomplétion des classes Tailwind
#    TypeScript Next.js      → Types Next.js dans l'IDE
#    GitLens                 → Voir l'historique git dans l'éditeur
#    Thunder Client          → Tester les routes API sans Postman

# 4. Activer "Format on save" :
#    Ctrl+Shift+P → "Open Settings (UI)"
#    Chercher "format on save" → Cocher la case`
      },
      {
        title: "Étape 4 — Créer le dossier du projet",
        desc: "Créer un dossier propre qui contiendra tout le code source. Le nom du dossier deviendra la racine du projet.",
        code: `# Option A — Via l'explorateur Windows :
# 1. Bureau (ou Documents) → Clic droit → "Nouveau dossier"
# 2. Nommer le dossier : lecomax

# Option B — Via le terminal (PowerShell ou CMD) :
cd C:\\Users\\VotreNom\\Desktop
mkdir lecomax

# Option C — Via le terminal intégré de VS Code :
# Ouvrir VS Code → Terminal → New Terminal
mkdir lecomax
cd lecomax

# Structure attendue après création :
# C:\\Users\\VotreNom\\Desktop\\lecomax\\    ← VIDE pour l'instant`
      },
      {
        title: "Étape 5 — Ouvrir le dossier dans VS Code",
        desc: "VS Code doit être ouvert sur le dossier du projet (pas sur un fichier isolé). Cela active toutes les fonctionnalités de l'espace de travail.",
        code: `# Option A — Glisser-déposer le dossier "lecomax" dans la fenêtre VS Code

# Option B — Via VS Code :
# File → Open Folder → Sélectionner C:\\Users\\VotreNom\\Desktop\\lecomax

# Option C — Depuis le terminal Windows :
cd C:\\Users\\VotreNom\\Desktop\\lecomax
code .     # Le point . = "ouvrir VS Code ici"

# Option D — Clic droit sur le dossier → "Open with Code"
# (disponible si VS Code est installé et l'option a été cochée à l'install)

# ✅ VS Code s'ouvre avec le panneau "EXPLORER" montrant "LECOMAX"
# ✅ On voit le dossier vide dans la barre latérale gauche`
      },
      {
        title: "Étape 6 — Ouvrir le terminal intégré de VS Code",
        desc: "Toutes les commandes (npm, git, etc.) sont exécutées dans le terminal VS Code. C'est beaucoup plus pratique que d'ouvrir un terminal séparé.",
        code: `# Ouvrir le terminal intégré :
# Ctrl + \`  (backtick — la touche à gauche du 1)
# OU : Terminal → New Terminal dans le menu

# Le terminal s'ouvre en bas de VS Code avec le chemin du projet :
# PS C:\\Users\\VotreNom\\Desktop\\lecomax>

# Vérifier qu'on est bien dans le bon dossier :
pwd    # Windows: Get-Location  → affiche le chemin actuel

# Pour créer un terminal supplémentaire (utile pour npm run dev + autre tâche) :
# Cliquer le "+" dans le panneau terminal en bas`
      },
      {
        title: "Étape 7 — Créer le compte GitHub",
        desc: "GitHub hébergera le code source. Vercel se connecte à GitHub pour déployer automatiquement à chaque git push.",
        code: `# 1. Aller sur https://github.com → Sign up
# 2. Choisir un username (ex: monnom-dev)
# 3. Vérifier l'email

# 4. Authentifier VS Code avec GitHub :
#    Ctrl+Shift+P → "GitHub: Sign in"
#    OU installer l'extension "GitHub Pull Requests and Issues"

# 5. Créer un nouveau repository sur GitHub.com :
#    → Clic sur "+" en haut à droite → "New repository"
#    → Name: lecomax
#    → Public ou Private (au choix)
#    → ⚠️ NE PAS cocher "Initialize this repository" (on le fera depuis VS Code)
#    → Create repository

# GitHub donne ensuite les commandes exactes à exécuter — les copier dans VS Code terminal`
      },
      {
        title: "Étape 8 — Maîtriser le terminal — commandes essentielles",
        desc: "Le terminal est ton outil le plus puissant. Voici toutes les commandes que tu utiliseras tous les jours pour développer ce site.",
        code: `# ─── NAVIGATION DANS LES DOSSIERS ────────────────────────────────────────
pwd                    # Afficher le dossier actuel (Print Working Directory)
ls                     # Lister les fichiers (Mac/Linux) 
dir                    # Lister les fichiers (Windows CMD)
Get-ChildItem          # Lister les fichiers (Windows PowerShell)
cd lecomax             # Entrer dans le dossier "lecomax"
cd ..                  # Remonter d'un niveau
cd ~                   # Aller à la racine de l'utilisateur
cd C:\\Users\\Ton\\Bureau  # Chemin absolu Windows

# ─── GESTION DES FICHIERS ────────────────────────────────────────────────
mkdir components       # Créer un dossier
touch fichier.ts       # Créer un fichier vide (Mac/Linux)
New-Item fichier.ts    # Créer un fichier vide (Windows PowerShell)
cp source.ts dest.ts   # Copier un fichier
rm fichier.ts          # Supprimer un fichier
cat fichier.ts         # Afficher le contenu d'un fichier

# ─── NPM (NODE PACKAGE MANAGER) ──────────────────────────────────────────
npm install            # Installer toutes les dépendances (lit package.json)
npm install axios      # Installer le package "axios"
npm install -D @types/node  # Installer en devDependencies (dev seulement)
npm uninstall axios    # Désinstaller un package
npm run dev            # Lancer le serveur de développement
npm run build          # Compiler le projet (production)
npm run lint           # Vérifier le style du code

# ─── GIT (VERSIONNEMENT) ─────────────────────────────────────────────────
git init               # Initialiser git dans le dossier courant
git status             # Voir les fichiers modifiés
git add .              # Ajouter TOUS les changements au staging
git add app/page.tsx   # Ajouter UN fichier au staging
git commit -m "msg"    # Sauvegarder les changements avec un message
git push origin main   # Envoyer sur GitHub
git pull origin main   # Télécharger les derniers changements
git log --oneline      # Voir l'historique des commits
git diff               # Voir les changements non sauvegardés

# ─── RACCOURCIS TERMINAL VS CODE ─────────────────────────────────────────
Ctrl + C               # Arrêter un processus (ex: arrêter npm run dev)
Ctrl + L               # Effacer le terminal (ou taper "clear")
↑ flèche               # Remonter dans l'historique des commandes
Tab                    # Auto-complétion du nom de fichier/dossier`,
      },
      {
        title: "Étape 9 — Comprendre TypeScript — pourquoi et comment",
        desc: "TypeScript est JavaScript avec des types. Il attrape les bugs AVANT l'exécution. Tout le projet L'ecomax est écrit en TypeScript. Voici les bases essentielles.",
        code: `// ─── JAVASCRIPT (sans types) — les bugs se cachent partout ─────────────
function calcTotal(price, qty) {
  return price * qty;           // Et si qty est "deux" ? Bug silencieux !
}
calcTotal(99, "deux");          // NaN — pas d'erreur visible au dev

// ─── TYPESCRIPT (avec types) — les bugs sont visibles avant d'exécuter ─
function calcTotal(price: number, qty: number): number {
  return price * qty;
}
calcTotal(99, "deux");          // ❌ ERREUR IDE immédiate : Expected number, got string

// ─── LES TYPES DE BASE ──────────────────────────────────────────────────
let name: string = "L'ecomax";
let price: number = 299;
let active: boolean = true;
let tags: string[] = ["running", "sport"];   // tableau de strings
let coords: [number, number] = [33.5, -7.6]; // tuple

// ─── INTERFACES (définir la forme d'un objet) ────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  active: boolean;
  category: "homme" | "femme" | "chaussures" | "accessoires"; // union type
  description?: string;  // ← le "?" signifie optionnel
}

const shoe: Product = {
  id: "uuid-123",
  name: "Nike Air Max",
  price: 599,
  images: ["url1.jpg", "url2.jpg"],
  active: true,
  category: "chaussures",
};

// ─── TYPES UTILES ────────────────────────────────────────────────────────
type Status = "pending" | "confirmed" | "shipped" | "delivered";
type Optional<T> = T | null | undefined;

// ─── GENERICS (types paramétrables) ─────────────────────────────────────
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
first<string>(["a", "b"]);   // → string
first<number>([1, 2, 3]);    // → number

// ─── async/await avec TypeScript ─────────────────────────────────────────
async function fetchProduct(slug: string): Promise<Product | null> {
  const res = await fetch(\`/api/products/\${slug}\`);
  if (!res.ok) return null;
  const data: Product = await res.json();
  return data;
}

// ─── FICHIERS DANS CE PROJET ─────────────────────────────────────────────
// .ts  → fichier TypeScript pur (fonctions utilitaires, types)
// .tsx → fichier TypeScript + JSX (composants React)
// lib/supabase.ts   → types Product, Order, etc.
// next-env.d.ts     → types Next.js (généré automatiquement, ne pas toucher)`,
      },
      {
        title: "Étape 10 — Comprendre React & Next.js — les bases absolues",
        desc: "React est la bibliothèque UI. Next.js est le framework au-dessus qui ajoute routing, SSR, API routes, etc. Voici TOUT ce qu'il faut comprendre avant de coder.",
        code: `// ─── REACT : COMPOSANTS ─────────────────────────────────────────────────
// Un composant = une fonction qui retourne du JSX (HTML dans JS)

// Composant simple
function Bouton() {
  return <button className="bg-black text-white px-4 py-2">Acheter</button>;
}

// Composant avec props (paramètres)
function Bouton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}

// ─── REACT : STATE (état local) ──────────────────────────────────────────
import { useState } from "react";

function Compteur() {
  const [count, setCount] = useState(0);   // [valeur, fonction pour changer]

  return (
    <div>
      <p>Compte : {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

// ─── REACT : useEffect (effets secondaires) ───────────────────────────────
import { useEffect } from "react";

function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Exécuté APRÈS le rendu du composant
    fetch("/api/products").then(r => r.json()).then(setProducts);
  }, []); // ← [] = exécuté une seule fois au montage

  return <div>{products.map(p => <p key={p.id}>{p.name}</p>)}</div>;
}

// ─── NEXT.JS : ROUTING (App Router) ──────────────────────────────────────
// Le dossier = l'URL. Le fichier page.tsx = la page visible.
// app/page.tsx              → /
// app/boutique/page.tsx     → /boutique
// app/produit/[slug]/page.tsx → /produit/nike-air-max (dynamique)

// ─── NEXT.JS : SERVER vs CLIENT COMPONENTS ───────────────────────────────
// Server Component (défaut — rendu côté serveur, meilleur SEO)
export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);  // Appel direct à la DB !
  return <h1>{product.name}</h1>;
}

// Client Component ("use client" — nécessaire pour useState, useEffect, events)
"use client";
export default function AddToCartButton({ product }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? "✓" : "Ajouter"}</button>;
}

// ─── NEXT.JS : API ROUTES ────────────────────────────────────────────────
// app/api/products/route.ts → https://lecomax.com/api/products
export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  await createProduct(body);
  return Response.json({ success: true }, { status: 201 });
}

// ─── JSX : RÈGLES IMPORTANTES ────────────────────────────────────────────
// 1. className (pas class)      → <div className="text-black">
// 2. Un seul élément racine     → <> ... </> (Fragment)
// 3. Les expressions JS dans {} → <p>{product.name}</p>
// 4. Les événements en camelCase → onClick, onChange, onSubmit
// 5. Les éléments auto-fermants → <img />, <input />, <br />`,
      },
    ],
  },
  {
    num: "01", label: "Initialisation du projet", color: "bg-violet-500",
    steps: [
      {
        title: "Bootstrap Next.js App",
        desc: "Création du projet avec App Router, TypeScript, Tailwind CSS et l'alias @/*.",
        code: `npx create-next-app@latest lecomax \\
  --typescript \\
  --tailwind \\
  --app \\
  --no-src-dir \\
  --import-alias "@/*"

# Résultat : app/, public/, next.config.js, tsconfig.json, tailwind.config.js`
      },
      {
        title: "tsconfig.json — strict mode + alias @/*",
        desc: "strict: true attrape les bugs à la compilation. L'alias @/* évite les imports relatifs comme ../../../../components/Header.",
        code: `{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },   // import Header from "@/components/Header"
    "plugins": [{ "name": "next" }]
  }
}`
      },
      {
        title: "tailwind.config.js — design system",
        desc: "Définit les couleurs brand (vert #16b277), les polices (Inter + Sora), ombres et transitions personnalisées.",
        code: `module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#16b277",   // Vert principal
          600: "#0a9061",
        },
        accent: "#0071ae", // Bleu secondaire
        ink: "#000000",
        paper: "#ffffff",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)"],
      },
    },
  },
};`
      },
      {
        title: "Étape 4 — Lancer le serveur de développement",
        desc: "C'est LA commande la plus utilisée. Elle démarre Next.js en mode développement avec rechargement automatique à chaque modification de fichier.",
        code: `# Dans le terminal VS Code, depuis le dossier du projet :
npm run dev

# Next.js démarre et affiche :
# ▲ Next.js 15.x.x
# - Local:   http://localhost:3000
# - Network: http://192.168.1.x:3000   ← accès depuis un téléphone sur le même Wi-Fi
# ✓ Ready in 2.5s

# 👆 Ouvrir http://localhost:3000 dans le navigateur → tu vois le site !
# Chaque fois que tu modifies un fichier → le navigateur se met à jour automatiquement

# ─── AUTRES COMMANDES IMPORTANTES ────────────────────────────────────────
npm run dev      # Serveur développement (TOUJOURS utiliser ça pour coder)
npm run build    # Compiler pour la production (avant de déployer)
npm run start    # Lancer le build de production localement (test final)
npm run lint     # Vérifier les erreurs ESLint

# ─── ARRÊTER LE SERVEUR ──────────────────────────────────────────────────
Ctrl + C         # Arrête npm run dev

# ─── PROBLÈMES COURANTS ──────────────────────────────────────────────────
# "Port 3000 already in use" → un autre serveur tourne déjà
npm run dev -- -p 3001  # Utiliser le port 3001 à la place

# "Module not found" → dépendance manquante
npm install      # Réinstaller toutes les dépendances

# "Error: Cannot find module '@/...'" → alias mal configuré
# Vérifier tsconfig.json → paths → "@/*"`,
      },
      {
        title: "Étape 5 — Comprendre la structure complète des fichiers",
        desc: "Voici TOUS les dossiers et fichiers importants de ce projet Next.js, leur rôle exact, et quand les modifier.",
        code: `lecomax/
│
├── app/                          ← ROUTING : chaque dossier = une URL
│   ├── layout.tsx                → Layout racine (Header + Footer + Providers)
│   ├── page.tsx                  → Page d'accueil (/)
│   ├── globals.css               → Styles CSS globaux
│   ├── not-found.tsx             → Page 404
│   ├── [category]/page.tsx       → /homme /femme /chaussures /accessoires
│   ├── produit/[slug]/page.tsx   → /produit/nom-du-produit
│   ├── panier/page.tsx           → /panier
│   ├── checkout/page.tsx         → /checkout
│   ├── connexion/page.tsx        → /connexion
│   ├── admin/                    → Tout le panel admin (protégé par middleware)
│   │   ├── layout.tsx            → Layout admin (sidebar + topbar)
│   │   ├── dashboard/page.tsx    → Tableau de bord
│   │   ├── products/page.tsx     → Gestion des produits
│   │   ├── orders/page.tsx       → Gestion des commandes
│   │   └── ...                   → 30+ autres sections
│   └── api/                      → Routes API (backend)
│       ├── products/route.ts     → GET/POST /api/products
│       ├── orders/route.ts       → GET/POST /api/orders
│       └── ...                   → 40+ routes
│
├── components/                   ← COMPOSANTS réutilisables
│   ├── Header.tsx                → Navigation principale
│   ├── Footer.tsx                → Pied de page
│   ├── CartContext.tsx           → Contexte React du panier
│   ├── ProductCard.tsx           → Carte produit (affiché dans la grille)
│   ├── ProductGallery.tsx        → Galerie images produit
│   ├── ProductActions.tsx        → Taille + couleur + ajouter au panier
│   └── ...                       → 40+ composants
│
├── lib/                          ← UTILITAIRES et TYPES
│   ├── supabase.ts               → Client Supabase + tous les types TypeScript
│   ├── db-server.ts              → Fonctions DB côté serveur (service_role)
│   ├── products.ts               → Données statiques + helpers produits
│   └── ...
│
├── public/                       ← FICHIERS STATIQUES (servis directement)
│   ├── images/                   → Images des produits (statiques)
│   ├── manifest.json             → PWA manifest
│   └── robots.txt                → Instructions pour les moteurs de recherche
│
├── .env.local                    → Variables d'environnement (⚠️ JAMAIS sur GitHub!)
├── next.config.js                → Configuration Next.js
├── tailwind.config.js            → Design system
├── tsconfig.json                 → Configuration TypeScript
├── middleware.ts                 → Exécuté sur chaque requête (auth, redirect...)
└── package.json                  → Dépendances + scripts npm`,
      },
      {
        title: "Étape 6 — Créer sa première page et son premier composant",
        desc: "En pratique : comment créer une nouvelle page et un nouveau composant dans Next.js App Router. C'est la base de tout.",
        code: `// ─── CRÉER UNE PAGE ──────────────────────────────────────────────────────
// 1. Créer le fichier : app/a-propos/page.tsx
// 2. Next.js la détecte automatiquement → accessible sur /a-propos

// app/a-propos/page.tsx
export default function AProposPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-4">À propos de L'ecomax</h1>
      <p className="text-neutral-600">
        L'ecomax est une boutique en ligne marocaine...
      </p>
    </main>
  );
}

// ─── CRÉER UN COMPOSANT ──────────────────────────────────────────────────
// 1. Créer le fichier : components/MonComposant.tsx

// components/Badge.tsx
interface BadgeProps {
  label: string;
  color?: "green" | "red" | "blue";
}

export default function Badge({ label, color = "green" }: BadgeProps) {
  const colors = {
    green: "bg-green-100 text-green-700",
    red:   "bg-red-100 text-red-700",
    blue:  "bg-blue-100 text-blue-700",
  };

  return (
    <span className={\`inline-flex px-2 py-0.5 rounded-full text-xs font-bold \${colors[color]}\`}>
      {label}
    </span>
  );
}

// ─── UTILISER LE COMPOSANT ────────────────────────────────────────────────
// Dans n'importe quel fichier :
import Badge from "@/components/Badge";

export default function MaPage() {
  return (
    <div>
      <Badge label="Nouveau" color="green" />
      <Badge label="Rupture" color="red" />
    </div>
  );
}

// ─── AJOUTER DES MÉTADONNÉES SEO ─────────────────────────────────────────
// Dans n'importe quelle page Server Component :
export const metadata = {
  title: "À propos | L'ecomax",
  description: "L'ecomax est une boutique en ligne marocaine...",
};

// ─── ROUTE DYNAMIQUE ─────────────────────────────────────────────────────
// app/produit/[slug]/page.tsx
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // slug = "nike-air-max" si l'URL est /produit/nike-air-max
  const product = await getProduct(slug);
  return <h1>{product?.name ?? "Produit non trouvé"}</h1>;
}`,
      },
    ],
  },
  {
    num: "02", label: "Supabase — Base de données & Auth", color: "bg-emerald-500",
    steps: [
      {
        title: "Créer un projet Supabase",
        desc: "Supabase fournit PostgreSQL + Auth + Storage + API REST auto-générée. Gratuit jusqu'à 500 MB.",
        code: `1. Aller sur https://supabase.com → "New project"
2. Nom: lecomax | Région: EU West (Paris)
3. Copier dans .env.local :

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...    ← safe côté client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...        ← SERVEUR UNIQUEMENT`
      },
      {
        title: "Tables créées dans Supabase (SQL Editor)",
        desc: "Chaque table correspond à une section du panel admin. Les types TS sont définis dans lib/supabase.ts.",
        code: `-- Produits
CREATE TABLE products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  description text,
  images text[] DEFAULT '{}',
  stock integer DEFAULT 0,
  active boolean DEFAULT true,
  colors text[],
  sizes text[],
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Commandes
CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  customer jsonb NOT NULL,   -- { name, phone, email, city, address }
  items jsonb NOT NULL,      -- [{ id, name, price, qty, image, size, color }]
  total numeric NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'pending',
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Paramètres (clé-valeur)
CREATE TABLE settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- + 18 autres tables : customers, categories, promotions, coupons,
--   reviews, newsletter_subscribers, page_views, push_subscriptions,
--   abandoned_carts, loyalty_points, ads, banners, announcements,
--   messages, chat_sessions, returns, shipping_zones, size_guide`
      },
      {
        title: "Client Supabase (lib/supabase.ts)",
        desc: "Un seul client partagé. lib/db-server.ts utilise la service_role key pour les API routes admin.",
        code: `// lib/supabase.ts — Client avec clé anon (safe côté client)
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// lib/db-server.ts — Service role (bypass RLS, SERVEUR UNIQUEMENT)
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // ⚠️ Jamais côté client
  );
}`
      },
      {
        title: "Étape 4 — Utiliser le Dashboard Supabase comme un pro",
        desc: "Le Dashboard Supabase est ta base de données visuelle. Voici tous les menus importants et comment les utiliser au quotidien.",
        code: `# ─── NAVIGATION DANS LE DASHBOARD SUPABASE ──────────────────────────────
# https://supabase.com/dashboard/project/TON_PROJECT_ID

# 📊 TABLE EDITOR  (vue tableur — la plus utilisée au quotidien)
#    → Voir, ajouter, modifier, supprimer des lignes
#    → Filtrer par colonne
#    → Idéal pour vérifier les données après tests

# 🔷 SQL EDITOR  (requêtes SQL directes)
#    → Exécuter du SQL brut (CREATE TABLE, INSERT, SELECT...)
#    → Sauvegarder tes requêtes fréquentes
#    → Voir le plan d'exécution
#    ASTUCE : "New snippet" pour sauvegarder tes requêtes récurrentes

# 🔐 AUTHENTICATION
#    → Users : voir tous les comptes créés avec Supabase Auth
#    → Policies : règles RLS (voir étape suivante)
#    → Providers : activer Google/Facebook login

# 📁 STORAGE
#    → Buckets : dossiers virtuels pour stocker les fichiers
#    → "product-images" → images des produits uploadées depuis l'admin
#    → Gérer les permissions (public ou privé)

# 📈 LOGS
#    → API Logs : voir chaque requête avec temps de réponse
#    → Auth Logs : tentatives de connexion
#    → Très utile pour déboguer les 403/500

# ─── OPÉRATIONS COURANTES DANS SQL EDITOR ────────────────────────────────

-- Voir les 10 dernières commandes :
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Compter les produits actifs par catégorie :
SELECT category, COUNT(*) as total
FROM products WHERE active = true
GROUP BY category;

-- Trouver un client par email :
SELECT * FROM orders WHERE customer->>'email' = 'client@email.com';

-- Vider une table de test :
TRUNCATE TABLE push_subscriptions;

-- Ajouter une colonne manquante :
ALTER TABLE products ADD COLUMN weight numeric;

-- Créer un index pour accélérer les recherches :
CREATE INDEX idx_orders_created ON orders(created_at DESC);`,
      },
      {
        title: "Étape 5 — Row Level Security (RLS) — Protéger les données",
        desc: "RLS est le système de sécurité de Supabase. Sans RLS, n'importe qui avec ta clé anon peut lire/modifier TOUTES tes données. C'est la faille de sécurité n°1 des débutants.",
        code: `-- ─── COMPRENDRE RLS ──────────────────────────────────────────────────────
-- Sans RLS activé :
-- SELECT * FROM orders  → Tout le monde voit toutes les commandes ❌

-- Avec RLS activé + policies correctes :
-- SELECT * FROM orders  → Chaque user ne voit QUE ses commandes ✅

-- ─── ACTIVER RLS SUR UNE TABLE ────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ─── POLICIES DANS CE PROJET ──────────────────────────────────────────────

-- 1. Produits : lecture publique (tout le monde peut voir les produits)
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (active = true);

-- 2. Produits : écriture admin uniquement (protégé par service_role key)
-- Note: le service_role bypasse automatiquement toutes les policies RLS
-- Pas besoin de policy d'écriture pour les tables admin-only

-- 3. Commandes : JAMAIS accessibles côté client
-- Toujours utiliser lib/db-server.ts avec service_role key pour les commandes

-- 4. Avis : lecture publique, écriture par utilisateur connecté
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_authenticated" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── STRATÉGIE UTILISÉE DANS CE PROJET ────────────────────────────────────
-- Toutes les routes API admin utilisent lib/db-server.ts
-- qui crée un client avec SUPABASE_SERVICE_ROLE_KEY
-- Ce client bypasse RLS → accès total côté serveur
-- 
-- Les routes publiques (produits, reviews) utilisent la clé anon
-- avec des policies RLS appropriées

-- ─── TESTER SES POLICIES ──────────────────────────────────────────────────
-- Dans SQL Editor, simuler un utilisateur :
SET LOCAL ROLE anon;  -- simuler un visiteur non connecté
SELECT * FROM orders;  -- doit retourner 0 résultats si RLS bien configuré`,
      },
      {
        title: "Étape 6 — Requêtes Supabase dans Next.js — guide complet",
        desc: "Voici toutes les opérations CRUD (Create, Read, Update, Delete) avec le client Supabase JavaScript. C'est ce que tu utiliseras dans chaque API route et page.",
        code: `import { createClient } from "@supabase/supabase-js";
const supabase = createClient(URL, SERVICE_ROLE_KEY);  // côté serveur

// ─── SELECT (lire des données) ───────────────────────────────────────────

// Tous les produits actifs
const { data: products, error } = await supabase
  .from("products")
  .select("*")
  .eq("active", true)
  .order("created_at", { ascending: false });

// Un seul produit par slug
const { data: product } = await supabase
  .from("products")
  .select("*")
  .eq("slug", "nike-air-max")
  .single();  // ← renvoie un objet, pas un tableau

// Sélectionner des colonnes spécifiques (plus rapide)
const { data } = await supabase
  .from("products")
  .select("id, name, price, images")
  .eq("category", "chaussures")
  .gte("price", 100)        // gte = >=
  .lte("price", 500)        // lte = <=
  .ilike("name", "%nike%")  // recherche insensible à la casse
  .limit(12)
  .range(0, 11);             // pagination

// ─── INSERT (créer) ───────────────────────────────────────────────────────

const { data: newProduct, error } = await supabase
  .from("products")
  .insert({
    slug: "adidas-ultraboost",
    name: "Adidas Ultraboost",
    price: 799,
    category: "chaussures",
    active: true,
  })
  .select()    // ← retourner la ligne créée
  .single();

// ─── UPDATE (modifier) ────────────────────────────────────────────────────

const { data, error } = await supabase
  .from("products")
  .update({ price: 699, active: false })
  .eq("id", "uuid-123")
  .select()
  .single();

// ─── DELETE (supprimer) ───────────────────────────────────────────────────

const { error } = await supabase
  .from("products")
  .delete()
  .eq("id", "uuid-123");

// ─── GESTION DES ERREURS ──────────────────────────────────────────────────

const { data, error } = await supabase.from("products").select("*");

if (error) {
  console.error("Supabase error:", error.message, error.code);
  // error.message = description humaine
  // error.code    = code PGSQL (ex: "23505" = unique violation)
  return;
}

// ─── UPLOAD FICHIER DANS STORAGE ─────────────────────────────────────────

const file = formData.get("file") as File;
const filename = \`\${Date.now()}-\${Math.random().toString(36).slice(2)}.jpg\`;

const { error: uploadError } = await supabase.storage
  .from("product-images")   // nom du bucket
  .upload(filename, await file.arrayBuffer(), {
    contentType: file.type,
  });

// Obtenir l'URL publique
const { data: { publicUrl } } = supabase.storage
  .from("product-images")
  .getPublicUrl(filename);
// publicUrl = "https://xxxx.supabase.co/storage/v1/object/public/product-images/xxx.jpg"`,
      },
    ],
  },
  {
    num: "03", label: "Installation des dépendances", color: "bg-blue-500",
    steps: [
      {
        title: "npm install — toutes les dépendances",
        desc: "Aucun framework UI (shadcn, chakra, MUI) — tout est fait en Tailwind CSS pur.",
        code: `# Base de données
npm install @supabase/supabase-js@^2.105.0

# Emails
npm install resend@^6.12.2 nodemailer@^8.0.11
npm install @emailjs/browser@^4.4.1
npm install imapflow@^1.4.0 mailparser@^3.9.9

# Paiements
npm install @paypal/react-paypal-js@^10.0.0

# Intelligence artificielle
npm install openai@^6.42.0

# Notifications push web
npm install web-push@^3.6.7

# Analytics & Performance (Vercel)
npm install @vercel/analytics@^2.0.1
npm install @vercel/speed-insights@^2.0.0

# Types TypeScript
npm install -D @types/nodemailer @types/web-push @types/mailparser`
      },
    ],
  },
  {
    num: "04", label: "Construction du frontend", color: "bg-cyan-500",
    steps: [
      {
        title: "Root Layout (app/layout.tsx)",
        desc: "Charge les polices Google, définit les métadonnées SEO, et wrap l'app avec tous les providers.",
        code: `// app/layout.tsx
import { Inter, Sora } from "next/font/google";
import { CartProvider } from "@/components/CartContext";
import AdminLayoutWrapper from "@/components/AdminLayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora  = Sora({ subsets: ["latin"], weight: ["600","700","800"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "L'ecomax — Mode, Tech & Sport", template: "%s · L'ecomax" },
  description: "Boutique en ligne Maroc — chaussures, vêtements, accessoires tech...",
  metadataBase: new URL("https://lecomax.com"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.variable + " " + sora.variable}>
        <CartProvider>
          <AdminLayoutWrapper>   {/* Cache Header/Footer sur /admin */}
            <AnnouncementBar />
            <Header />
            {children}
            <Footer />
          </AdminLayoutWrapper>
          <PageTracker />  <CookieBanner />  <ChatWidget />
          <PushPrompt />   <AdsDisplay />    <BackToTop />
        </CartProvider>
        <Analytics />        {/* Vercel Analytics */}
        <SpeedInsights />    {/* Core Web Vitals */}
      </body>
    </html>
  );
}`
      },
      {
        title: "Panier — CartContext.tsx (localStorage)",
        desc: "Le panier vit dans le navigateur. Pas de compte requis. Instantané et disponible hors ligne.",
        code: `const KEY = "lecomax_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // IMPORTANT: hydrate APRÈS montage pour éviter SSR mismatch
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setItems(JSON.parse(raw));
    setHydrated(true);
  }, []);

  // Sauvegarder à chaque changement
  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    total: items.reduce((s, i) => s + i.quantity * i.price, 0),
    add:   (p, size, qty = 1, color = "") => setItems(prev => { /* upsert */ }),
    remove:(slug, size) => setItems(prev => prev.filter(...)),
    clear: () => setItems([]),
  }), [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}`
      },
      {
        title: "Routes dynamiques (App Router)",
        desc: "Les dossiers entre crochets créent des routes dynamiques. Le middleware protège /admin/*.",
        code: `app/
├── page.tsx                → /           (accueil)
├── layout.tsx              → layout racine (toutes les pages)
├── [category]/page.tsx     → /chaussures, /homme, /femme, /accessoires
├── produit/
│   └── [slug]/page.tsx     → /produit/baasploa-course-homme
├── panier/page.tsx         → /panier
├── checkout/page.tsx       → /checkout
├── compte/page.tsx         → /compte
├── connexion/page.tsx      → /connexion
├── admin/
│   ├── layout.tsx          → sidebar partagée par toutes les pages /admin
│   ├── page.tsx            → /admin  (login)
│   ├── dashboard/page.tsx  → /admin/dashboard
│   ├── products/page.tsx   → /admin/products
│   ├── orders/page.tsx     → /admin/orders
│   └── ...                 → 30+ sections admin
└── api/
    ├── products/route.ts   → GET/POST/PUT/DELETE
    ├── orders/route.ts     → GET/POST/PUT
    └── ...                 → 40+ routes API`
      },
      {
        title: "Tailwind CSS — Maîtriser le styling sans écrire de CSS",
        desc: "Tailwind CSS est un framework de classes utilitaires. Au lieu d'écrire du CSS, tu appliques des classes directement dans le HTML. Voici les classes les plus utilisées dans ce projet.",
        code: `{/* ─── LAYOUT / DISPOSITION ──────────────────────────────────────────── */}
<div className="flex items-center gap-4">          {/* flex horizontal, centré */}
<div className="flex flex-col gap-2">              {/* flex vertical */}
<div className="grid grid-cols-3 gap-4">           {/* grille 3 colonnes */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> {/* responsive */}

{/* ─── ESPACEMENT ──────────────────────────────────────────────────────── */}
<div className="p-4">        {/* padding 4 = 1rem partout */}
<div className="px-6 py-3">  {/* px = gauche/droite, py = haut/bas */}
<div className="mt-4 mb-2">  {/* margin top 4, bottom 2 */}
<div className="space-y-4">  {/* gap entre enfants verticaux */}

{/* ─── TAILLE ──────────────────────────────────────────────────────────── */}
<div className="w-full h-screen">    {/* 100% largeur, 100% hauteur écran */}
<div className="w-64 h-32">          {/* 16rem × 8rem */}
<div className="max-w-7xl mx-auto">  {/* Largeur max + centré */}
<img className="w-10 h-10 rounded-full">  {/* Avatar 40px */}

{/* ─── TEXTE ────────────────────────────────────────────────────────────── */}
<p className="text-xl font-black text-gray-900">   {/* grand + très gras + sombre */}
<p className="text-sm text-neutral-400 truncate">  {/* petit + gris + coupé */}
<p className="text-[13px] leading-relaxed">        {/* taille custom */}
<p className="uppercase tracking-widest">          {/* majuscules + espacement */}

{/* ─── COULEURS & FONDS ────────────────────────────────────────────────── */}
<div className="bg-black text-white">
<div className="bg-neutral-50 border border-neutral-200 rounded-2xl">
<div className="bg-emerald-50 text-emerald-700">   {/* vert clair */}
<span className="text-red-500">Erreur</span>

{/* ─── RESPONSIVE (mobile-first) ───────────────────────────────────────── */}
{/* Pas de préfixe = mobile, sm: = 640px+, md: = 768px+, lg: = 1024px+ */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
<p className="text-sm md:text-base lg:text-lg">
<div className="hidden md:block">  {/* Caché sur mobile, visible sur tablette+ */}
<div className="block md:hidden">  {/* Visible sur mobile, caché sur tablette+ */}

{/* ─── INTERACTIVITÉ ───────────────────────────────────────────────────── */}
<button className="hover:bg-gray-100 active:scale-95 transition-all">
<div className="cursor-pointer select-none">
<input className="focus:outline-none focus:ring-2 focus:ring-black">

{/* ─── RACCOURCIS UTILES ────────────────────────────────────────────────── */}
{/* rounded-xl = border-radius 12px  */}
{/* shadow-sm = légère ombre         */}
{/* overflow-hidden = clip contenu   */}
{/* z-50 = z-index 50               */}
{/* fixed inset-0 = position fixe plein écran */}
{/* opacity-50 = 50% opacité        */}
{/* pointer-events-none = non cliquable */}`,
      },
      {
        title: "Créer une API Route — lire et écrire dans Supabase",
        desc: "Une API route dans Next.js = un endpoint backend. C'est là que se fait tout le travail avec la base de données, les emails, etc. Voici le pattern exact utilisé partout dans ce projet.",
        code: `// app/api/products/route.ts
// Accessible sur : GET/POST https://lecomax.com/api/products

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/admin-session";  // protection admin

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET : Lire des données ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");  // ?category=chaussures

  let query = supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ─── POST : Créer une donnée (protégé — admin seulement) ──────────────────
export async function POST(req: NextRequest) {
  // 1. Vérifier que c'est bien un admin
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Lire le corps de la requête
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3. Insérer dans Supabase
  const { data, error } = await supabase
    .from("products")
    .insert(body as object)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// ─── APPELER CETTE API DEPUIS LE FRONTEND ─────────────────────────────────
// GET (lire les produits chaussures) :
const res = await fetch("/api/products?category=chaussures");
const products = await res.json();

// POST (créer un produit depuis l'admin) :
const res = await fetch("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Nike", price: 599, category: "chaussures" }),
});
const newProduct = await res.json();`,
      },
    ],
  },
  {
    num: "05", label: "Panel d'administration (30+ sections)", color: "bg-orange-500",
    steps: [
      {
        title: "Authentification admin",
        desc: "Double protection : Supabase Auth + cookie admin_session vérifié par middleware.ts sur chaque requête.",
        code: `// 1. Login — app/admin/page.tsx
async function handleLogin(e) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    // Cookie 30j (remember me) ou 1j (session)
    document.cookie = "admin_session=authenticated; path=/; max-age=2592000; SameSite=Strict";
    router.replace("/admin/dashboard");
  }
}

// 2. Protection — middleware.ts (s'exécute sur CHAQUE requête /admin/*)
if (pathname.startsWith("/admin") && pathname !== "/admin/") {
  const session = req.cookies.get("admin_session")?.value;
  if (session !== "authenticated") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
}

// 3. Double vérif — app/admin/layout.tsx
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) router.replace("/admin");
  });
}, []);`
      },
      {
        title: "Toutes les sections admin",
        desc: "Chaque section = un dossier dans app/admin/ + ses routes API dans app/api/.",
        code: `VENTES:
  /admin/dashboard    → Revenus, graphiques, dernières commandes
  /admin/analytics    → Traffic, conversions, cartes géo
  /admin/recordings   → Enregistrements de sessions
  /admin/orders       → Commandes (statuts: pending → delivered)

CATALOGUE:
  /admin/products     → CRUD produits + génération IA descriptions
  /admin/categories   → Gestion des catégories
  /admin/stock        → Inventaire + alertes stock faible (≤3)
  /admin/pages        → Éditeur de pages statiques
  /admin/banners      → Bannières hero et promotionnelles
  /admin/media        → Médiathèque images
  /admin/studio       → Studio IA créatif (marketing)

CLIENTS:
  /admin/customers    → Profils clients + historique commandes
  /admin/client-data  → Données collectées (UA, localisation)
  /admin/loyalty      → Points fidélité ecoClub
  /admin/abandoned-carts → Paniers abandonnés

MARKETING:
  /admin/promotions   → Réductions et ventes flash
  /admin/ads          → Publicités (banners, popups)
  /admin/push         → Notifications push web (web-push)
  /admin/newsletter   → Liste abonnés + campagnes Resend
  /admin/coupons      → Codes promo + validation
  /admin/announcement → Barre d'annonce (top du site)
  /admin/broadcast    → WhatsApp/SMS/Email avec IA

SAV:
  /admin/messages     → Inbox clients + chat (IMAP)
  /admin/reviews      → Modération avis + suggestions IA
  /admin/trustpilot   → Gestion avis Trustpilot
  /admin/returns      → Demandes de retour

CONFIG:
  /admin/shipping     → Zones de livraison + tarifs
  /admin/size-guide   → Guide des tailles (contenu)
  /admin/settings     → Tout le store configurable via UI`
      },
    ],
  },
  {
    num: "06", label: "Routes API (40+ endpoints)", color: "bg-red-500",
    steps: [
      {
        title: "Pattern standard d'une route API",
        desc: "Toutes les routes Write vérifient la session admin. Les reads publics sont ouverts.",
        code: `// app/api/products/route.ts

// GET — public (pas de vérification)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search   = searchParams.get("search");

  const sb = createClient(url, anonKey);  // clé anon
  let q = sb.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
  if (category) q = q.eq("category", category);
  if (search)   q = q.ilike("name", \`%\${search}%\`);
  const { data } = await q;
  return NextResponse.json(data ?? []);
}

// POST — admin only
export async function POST(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (session !== "authenticated") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json();
  const sb = getClient();  // service role (lib/db-server.ts)
  const { data } = await sb.from("products").insert(body).select().single();
  return NextResponse.json(data);
}`
      },
      {
        title: "Toutes les routes API disponibles",
        desc: "40+ endpoints couvrant tout le fonctionnement du site.",
        code: `GET  /api/products          → Liste produits (filtrable: category, search, featured)
POST /api/products          → Créer produit (admin)
PUT  /api/products/[id]     → Modifier produit (admin)
DEL  /api/products/[id]     → Supprimer produit (admin)

GET  /api/orders            → Liste commandes (admin)
POST /api/orders            → Créer commande (checkout)
PUT  /api/orders/[id]       → Modifier statut (admin)

GET  /api/settings          → Tous les paramètres
PUT  /api/settings          → Upsert paramètre (admin)

GET  /api/categories        → Liste catégories
POST /api/categories        → Créer catégorie (admin)

POST /api/send-confirmation → Email confirmation via Resend
POST /api/newsletter        → Envoyer newsletter via Resend
GET  /api/inbox             → Emails entrants via IMAP

POST /api/ai-product        → OpenAI → description produit
POST /api/ai-reply          → OpenAI → réponse suggérée
POST /api/ai-broadcast      → OpenAI → contenu marketing
POST /api/ai-review         → OpenAI → analyse avis

POST /api/push/subscribe    → Sauvegarder abonnement push
POST /api/push/send         → Envoyer notification (admin)

GET  /api/analytics         → Données analytics agrégées
POST /api/page-views        → Enregistrer vue de page

POST /api/upload            → Upload image (admin)
POST /api/upload-media      → Upload médiathèque

GET  /api/tracking          → Suivi commande (numéro + téléphone)
GET  /api/reviews           → Avis produits
POST /api/reviews           → Soumettre un avis

... + /api/coupons, /api/promotions, /api/banners, /api/ads,
      /api/shipping, /api/loyalty, /api/points, /api/returns,
      /api/messages, /api/chat, /api/announcements, /api/whatsapp,
      /api/indexnow, /api/media, /api/size-guide, /api/pages`
      },
    ],
  },
  {
    num: "07", label: "GitHub → Vercel → Domaine", color: "bg-gray-300",
    steps: [
      {
        title: "Créer le dépôt GitHub",
        desc: ".gitignore est CRITIQUE — les .env files ne doivent JAMAIS être commités.",
        code: `# 1. Initialiser Git dans le dossier du projet
git init
git add .
git commit -m "Initial commit: lecomax e-commerce"

# 2. Créer le dépôt sur github.com (New Repository → "lecomax")

# 3. Connecter et pousser
git remote add origin https://github.com/[username]/lecomax.git
git branch -M main
git push -u origin main

# .gitignore — ces fichiers ne doivent JAMAIS aller sur GitHub :
.env.local          ← Contient toutes les clés API secrètes
.env.production
.next/              ← Build output (recréé par Vercel)
node_modules/       ← Dépendances (npm install les recrée)`
      },
      {
        title: "Déploiement sur Vercel",
        desc: "Vercel détecte Next.js automatiquement et déploie à chaque git push vers main.",
        code: `1. Aller sur https://vercel.com → "Add New Project"
2. "Import Git Repository" → Sélectionner "lecomax"
3. Framework: Next.js (auto-détecté)
4. Build command: npm run build (défaut)
5. Output: .next (défaut)

6. ⚠️ IMPORTANT — Variables d'environnement (Vercel Dashboard → Settings → Env):
   NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY     = eyJ...
   RESEND_API_KEY                = re_xxxx
   OPENAI_API_KEY                = sk-xxxx
   VAPID_PUBLIC_KEY              = xxxx
   VAPID_PRIVATE_KEY             = xxxx
   [+ toutes les autres vars]

7. "Deploy" → URL de preview : https://lecomax.vercel.app
8. ✅ Chaque git push → redéploiement automatique en ~30 secondes`
      },
      {
        title: "Connecter lecomax.com via Namecheap",
        desc: "Namecheap est le registrar utilisé. La config DNS prend 5 min, la propagation 24–48h. Vercel génère le SSL automatiquement.",
        code: `# ── ÉTAPE 1 : Acheter le domaine sur Namecheap ──────────────────────────────
# 1. Aller sur https://namecheap.com
# 2. Chercher "lecomax.com" → Ajouter au panier → Payer (~10$/an)
# 3. Accéder à "Domain List" → Cliquer "Manage" sur lecomax.com

# ── ÉTAPE 2 : Changer les nameservers vers Vercel ────────────────────────────
# Dans Namecheap Dashboard → Domain → Nameservers :
# Choisir "Custom DNS" et entrer :
#   ns1.vercel-dns.com
#   ns2.vercel-dns.com
# → SAVE

# ── ÉTAPE 3 : OU garder les nameservers Namecheap (méthode A Record) ─────────
# Dans Namecheap → Advanced DNS → Add New Record :
#
#   Type: A Record  | Host: @   | Value: 76.76.21.21      | TTL: Auto
#   Type: CNAME     | Host: www | Value: cname.vercel-dns.com | TTL: Auto
#
# Le @ = lecomax.com (racine)
# Le www = www.lecomax.com (sous-domaine)

# ── ÉTAPE 4 : Configurer le domaine dans Vercel ───────────────────────────────
# 1. Vercel Dashboard → Project → Settings → Domains
# 2. Ajouter "lecomax.com" → Add
# 3. Ajouter "www.lecomax.com" → Add
# 4. Vercel configure automatiquement le SSL (Let's Encrypt)

# ── ÉTAPE 5 : DNS pour les emails Resend (délivrabilité) ─────────────────────
# Dans Namecheap → Advanced DNS → ajouter ces records DKIM/SPF :
#
#   Type: TXT | Host: @ | Value: v=spf1 include:amazonses.com ~all
#   Type: TXT | Host: resend._domainkey | Value: [fourni par Resend dashboard]
#   Type: TXT | Host: @ | Value: v=DMARC1; p=none; rua=mailto:contact@lecomax.com

# ── RÉSULTAT FINAL ────────────────────────────────────────────────────────────
# ✅ https://lecomax.com           → Production (CDN Vercel mondial)
# ✅ https://www.lecomax.com       → Redirige vers lecomax.com (canonical)
# ✅ SSL/TLS                       → Certificat Let's Encrypt auto-renouvelé
# ✅ Emails @lecomax.com           → Délivrabilité maximale (SPF+DKIM+DMARC)`
      },
      {
        title: "Le cycle de déploiement complet — Du code à la production",
        desc: "Voici EXACTEMENT ce que tu fais chaque fois que tu veux publier une modification sur le site en production. C'est le workflow que tu répéteras des centaines de fois.",
        code: `# ─── WORKFLOW COMPLET : MODIFIER → DÉPLOYER ─────────────────────────────

# 1. Tu codes dans VS Code (npm run dev tourne en arrière-plan)
#    → Les changements apparaissent sur localhost:3000 en temps réel

# 2. Tu testes que tout fonctionne localement
npm run build   # ← OBLIGATOIRE avant de push (détecte les erreurs)
# → Si ça build OK = ça déploiera OK sur Vercel (presque toujours)

# 3. Tu prépares tes fichiers pour Git
git status           # Voir quels fichiers ont changé
git add .            # Ajouter TOUS les changements (le plus courant)
# OU
git add app/admin/products/page.tsx  # Ajouter seulement un fichier

# 4. Tu commites (crée un checkpoint)
git commit -m "feat: améliore la page produits mobile"
# Convention de messages : feat | fix | style | refactor | docs | chore

# 5. Tu pousses sur GitHub
git push origin main
# → Dans les 30 secondes, Vercel commence le déploiement

# 6. Tu vérifies le déploiement dans le dashboard Vercel
# https://vercel.com/dashboard → ton projet → Deployments
# → Vert = succès | Rouge = échec (clique pour voir les logs)

# ─── COMMANDES GIT DU QUOTIDIEN ──────────────────────────────────────────
git status              # Voir les fichiers modifiés
git diff                # Voir les changements ligne par ligne  
git log --oneline -5    # Les 5 derniers commits
git stash               # Sauvegarder temporairement sans commiter
git stash pop           # Récupérer les changements sauvegardés
git reset --soft HEAD~1 # Annuler le dernier commit (garde les changements)

# ─── CRÉER UNE BRANCHE POUR TESTER UNE FONCTIONNALITÉ ───────────────────
git checkout -b feature/paiement-youcan  # Créer une nouvelle branche
git checkout main                         # Retourner à la branche principale
git merge feature/paiement-youcan        # Fusionner dans main
git push origin main                      # Pousser sur GitHub

# ─── ANNULER UNE MODIFICATION NON COMMITÉE ────────────────────────────────
git checkout -- app/produit/[slug]/page.tsx  # Annuler les changements d'un fichier
git checkout -- .                            # Annuler TOUS les changements`,
      },
      {
        title: "Variables d'environnement Vercel — Guide complet",
        desc: "Les variables d'environnement sur Vercel doivent être configurées manuellement. Elles ne sont PAS dans le code GitHub (sinon ce serait un risque de sécurité). Voici toutes les variables nécessaires.",
        code: `# ─── OÙ CONFIGURER ────────────────────────────────────────────────────────
# Vercel Dashboard → ton projet → Settings → Environment Variables

# ─── TOUTES LES VARIABLES NÉCESSAIRES ────────────────────────────────────
# Nom                          Valeur                  Où obtenir
# ─────────────────────────────────────────────────────────────────────────

# SUPABASE (obligatoire pour tout)
NEXT_PUBLIC_SUPABASE_URL        https://xxx.supabase.co    Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY   eyJhbG...                  Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY       eyJhbG...                  Supabase Dashboard → Settings → API

# EMAILS (obligatoire pour confirmation commandes)
RESEND_API_KEY                  re_xxxx                    resend.com → API Keys

# INTELLIGENCE ARTIFICIELLE
OPENAI_API_KEY                  sk-xxxx                    platform.openai.com → API Keys

# NOTIFICATIONS PUSH
VAPID_PUBLIC_KEY                BNxx...                    Générer avec web-push (voir ci-dessous)
VAPID_PRIVATE_KEY               xxxx...                    Générer avec web-push (voir ci-dessous)
VAPID_CONTACT_EMAIL             contact@lecomax.com        Ton email de contact

# SÉCURITÉ ADMIN
ADMIN_JWT_SECRET                une-chaine-aléatoire-32chars  Générer : openssl rand -base64 32
NEXT_PUBLIC_ADMIN_DOMAIN        lecomax.com                Ton domaine

# EMAILS IMAP (boîte de réception admin)
PRIVATE_EMAIL_USER              contact@lecomax.com        Ton email Namecheap
PRIVATE_EMAIL_PASS              xxxx                       Mot de passe email
PRIVATE_EMAIL_HOST              mail.privateemail.com      Serveur IMAP Namecheap

# CRON JOBS (sauvegardes auto)
CRON_SECRET                     une-chaine-aléatoire       openssl rand -hex 32

# ─── GÉNÉRER LES CLÉS VAPID (push notifications) ──────────────────────────
npx web-push generate-vapid-keys
# → Affiche : Public Key: BNxx...  | Private Key: xxxx...
# → Copier dans Vercel Environment Variables

# ─── TESTER LES VARIABLES EN LOCAL ────────────────────────────────────────
# Créer .env.local à la racine du projet (JAMAIS commité sur GitHub)
# Copier le contenu ci-dessus avec tes vraies valeurs

# Vérifier que la var est bien lue :
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);  // Dans n'importe quel composant

# ─── APRÈS AVOIR AJOUTÉ UNE VARIABLE SUR VERCEL ───────────────────────────
# ⚠️ Le déploiement actuel N'hérite PAS des nouvelles variables
# Il faut REDÉPLOYER pour qu'elles soient prises en compte :
# Vercel Dashboard → Deployments → "..." → Redeploy`,
      },
    ],
  },
  {
    num: "16", label: "Workflows Quotidiens — Ajouter, Modifier, Déboguer", color: "bg-sky-600",
    steps: [
      {
        title: "Comment ajouter une nouvelle page admin de A à Z",
        desc: "C'est la tâche que tu feras souvent : créer une nouvelle section dans le panel admin. Voici le processus exact, étape par étape, avec tout le code nécessaire.",
        code: `# EXEMPLE : Créer la page /admin/suppliers (gestion fournisseurs)

# ─── ÉTAPE 1 : Créer les fichiers ─────────────────────────────────────────
mkdir app/admin/suppliers
touch app/admin/suppliers/page.tsx

# ─── ÉTAPE 2 : Créer le composant de base ─────────────────────────────────
# app/admin/suppliers/page.tsx
"use client";
import { useState, useEffect } from "react";

type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/suppliers")
      .then(r => r.json())
      .then(data => { setSuppliers(data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Fournisseurs</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Gérez vos fournisseurs</p>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold">
          + Ajouter
        </button>
      </div>
      {loading ? (
        <div className="text-neutral-400 text-sm">Chargement…</div>
      ) : (
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          {suppliers.map(s => (
            <div key={s.id} className="px-5 py-4 border-b border-neutral-50">
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-neutral-400">{s.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

# ─── ÉTAPE 3 : Créer la table Supabase ────────────────────────────────────
# Dans Supabase → SQL Editor :
CREATE TABLE suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

# ─── ÉTAPE 4 : Créer l'API route ──────────────────────────────────────────
# app/api/suppliers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await sb
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await sb.from("suppliers").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

# ─── ÉTAPE 5 : Ajouter le lien dans la sidebar admin ─────────────────────
# Dans app/admin/layout.tsx (ou le composant de navigation admin),
# ajouter dans le tableau de navigation :
{ href: "/admin/suppliers", label: "Fournisseurs", icon: "🏭" }`,
      },
      {
        title: "Comment modifier le design d'un composant existant",
        desc: "Tu veux changer l'apparence d'un bouton, d'une carte produit, ou d'une section ? Voici le processus exact pour trouver et modifier n'importe quel élément visuel.",
        code: `# ─── TROUVER LE COMPOSANT À MODIFIER ────────────────────────────────────

# Méthode 1 : Inspecter dans le navigateur
# Clic droit sur l'élément → "Inspecter" → Chercher la classe Tailwind
# Ex: tu vois "bg-black text-white px-4 py-2 rounded-xl" → CTRL+SHIFT+F dans VS Code
# → Chercher cette combinaison dans le code → Trouver le fichier

# Méthode 2 : Chercher dans VS Code
# CTRL+SHIFT+F → "Recherche globale"
# Chercher le texte affiché Ex: "Ajouter au panier" → Trouve le composant

# Méthode 3 : Structure des dossiers
# Bouton "Ajouter au panier" → components/ProductActions.tsx
# Carte produit → components/ProductCard.tsx
# Header → components/Header.tsx
# Footer → components/Footer.tsx

# ─── MODIFIER LES CLASSES TAILWIND ────────────────────────────────────────

# Exemple : Changer la couleur du bouton principal
# AVANT :
className="bg-black text-white px-4 py-2 rounded-xl"
# APRÈS : Bouton vert (couleur brand)
className="bg-[#16b277] text-white px-4 py-2 rounded-xl hover:bg-[#0a9061]"

# Changer le rayon des coins
rounded-sm   → 2px
rounded-md   → 6px
rounded-xl   → 12px
rounded-2xl  → 16px
rounded-full → 9999px (cercle parfait)

# Changer la taille du texte
text-xs  → 12px
text-sm  → 14px
text-base → 16px
text-lg  → 18px
text-xl  → 20px
text-2xl → 24px
text-4xl → 36px

# Changer l'espacement (1 = 4px)
p-2  → padding 8px
p-4  → padding 16px
p-6  → padding 24px
mt-4 → margin-top 16px
gap-2 → gap 8px entre éléments flex/grid

# ─── AJOUTER UNE ANIMATION ────────────────────────────────────────────────
className="transition-all duration-300 hover:scale-105"
className="transition-colors duration-200 hover:bg-neutral-100"
className="animate-pulse"      // Pulsation (skeleton loaders)
className="animate-spin"       // Rotation (loading spinners)
className="animate-bounce"     // Rebond

# ─── MODIFIER UN COMPOSANT RÉUTILISABLE ───────────────────────────────────
# ⚠️ Attention : si tu modifies un composant réutilisable,
# ça affecte PARTOUT où il est utilisé.
# Vérifier dans VS Code : clic droit sur le nom du composant → "Find All References"
# pour voir où il est utilisé avant de modifier.`,
      },
      {
        title: "Comment déboguer une erreur — Guide complet",
        desc: "Tout développeur rencontre des erreurs. Voici comment les lire, les comprendre et les résoudre rapidement. Les 10 erreurs les plus courantes dans Next.js sont expliquées ici.",
        code: `# ─── TYPES D'ERREURS ET OÙ LES VOIR ─────────────────────────────────────

# 1. ERREURS DE BUILD (avant le déploiement)
npm run build
# → Lit les lignes rouges → Fichier:ligne:colonne
# Ex: "app/admin/products/page.tsx:45:3 - error TS2304: Cannot find name 'X'"

# 2. ERREURS RUNTIME (en développement)
# → Le navigateur affiche "Error: ..." avec une stack trace
# → VS Code terminal affiche les erreurs API (Server Components, API routes)

# 3. ERREURS EN PRODUCTION (Vercel)
# Vercel Dashboard → ton projet → Functions → Voir les logs temps réel

# ─── LES 10 ERREURS LES PLUS COURANTES ───────────────────────────────────

# ❌ "Cannot find module '@/components/Header'"
# ✅ Fix: Vérifier que le fichier existe et que le chemin est correct
#         Vérifier tsconfig.json → "@/*": ["./*"]

# ❌ "useClient must be called within a React component"
# ✅ Fix: Ajouter "use client"; en haut du fichier

# ❌ "Hydration failed" ou "Text content did not match"
# ✅ Fix: Le HTML serveur ≠ HTML client
#         Éviter Date.now(), Math.random() dans le rendu initial
#         Utiliser useEffect pour les données qui changent côté client

# ❌ "Cannot read properties of undefined (reading 'map')"
# ✅ Fix: data est undefined, pas un tableau
#         Ajouter: const products = data ?? [] ou data?.map(...)

# ❌ "Error: 401 Unauthorized" depuis l'API
# ✅ Fix: La session admin est expirée ou incorrecte
#         Se reconnecter à /admin

# ❌ "Error: 500" depuis l'API
# ✅ Fix: Regarder les logs Vercel (ou terminal VS Code en dev)
#         Souvent une variable d'environnement manquante

# ❌ "Type 'string | null' is not assignable to type 'string'"
# ✅ Fix: Ajouter null-check: if (!value) return; ou value ?? "default"

# ❌ "Dynamic server usage: headers() should be wrapped in a Suspense"  
# ✅ Fix: Ajouter export const dynamic = "force-dynamic"; dans la page

# ❌ Build timeout sur Vercel (> 1h)
# ✅ Fix: Vérifier les imports circulaires, réduire les dépendances
#         Mettre à jour Next.js: npm install next@latest

# ❌ Images ne s'affichent pas en production
# ✅ Fix: Vérifier next.config.js → images → remotePatterns
#         Ajouter le hostname Supabase: { hostname: "*.supabase.co" }

# ─── TECHNIQUE DE DÉBOGAGE ────────────────────────────────────────────────
# La technique la plus simple et efficace : les console.log() stratégiques

// Dans un Server Component ou API route :
console.log("Produit reçu:", JSON.stringify(product, null, 2));

// Dans un Client Component (visible dans F12 → Console) :
console.log("État actuel:", { images, loading, error });

// Pour déboguer une API route :
export async function GET(req: NextRequest) {
  const url = req.url;
  const params = Object.fromEntries(new URL(url).searchParams);
  console.log("GET /api/products params:", params);  // Visible dans terminal VS Code
  // ...
}`,
      },
      {
        title: "Comment ajouter un nouveau champ à un produit",
        desc: "Exemple concret : ajouter un champ 'condition' (neuf/occasion) aux produits. Ce guide montre comment modifier la DB, l'API, le formulaire admin, et la page produit.",
        code: `# EXEMPLE COMPLET : Ajouter le champ "condition" aux produits

# ─── ÉTAPE 1 : Modifier la table Supabase ─────────────────────────────────
# Dans Supabase → SQL Editor :
ALTER TABLE products ADD COLUMN condition text DEFAULT 'neuf';
-- 'neuf' | 'occasion' | 'reconditionné'

# ─── ÉTAPE 2 : Mettre à jour le type TypeScript ───────────────────────────
# Dans lib/supabase.ts :
export type Product = {
  // ... autres champs existants ...
  condition?: "neuf" | "occasion" | "reconditionné";  // ← AJOUTER
};

# ─── ÉTAPE 3 : Ajouter le champ au formulaire admin ──────────────────────
# Dans app/admin/products/page.tsx :

# 1. Ajouter au state initial :
const emptyForm = {
  // ... autres champs ...
  condition: "neuf",  // ← AJOUTER
};

# 2. Ajouter le select dans le formulaire (chercher "Catégorie" pour s'en inspirer) :
<div>
  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
    Condition
  </label>
  <select
    value={form.condition}
    onChange={e => setForm({ ...form, condition: e.target.value })}
    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black bg-neutral-50"
  >
    <option value="neuf">Neuf</option>
    <option value="occasion">Occasion</option>
    <option value="reconditionné">Reconditionné</option>
  </select>
</div>

# 3. Ajouter dans le payload de sauvegarde (handleSave) :
const payload = {
  // ... autres champs ...
  condition: form.condition,  // ← AJOUTER
};

# ─── ÉTAPE 4 : Afficher le champ sur la page produit ────────────────────
# Dans app/produit/[slug]/page.tsx :
# Après avoir récupéré le produit (dbProd), afficher le badge :

{dbProd.condition && (
  <span className={
    dbProd.condition === "occasion"
      ? "bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold"
      : "bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold"
  }>
    {dbProd.condition === "neuf" ? "✓ Neuf"
     : dbProd.condition === "occasion" ? "★ Occasion"
     : "♻ Reconditionné"}
  </span>
)}

# ─── ÉTAPE 5 : Tester ─────────────────────────────────────────────────────
npm run dev
# 1. Aller sur /admin/products → Créer/modifier un produit → Vérifier que le champ apparaît
# 2. Sauvegarder → Aller sur /produit/[slug] → Vérifier l'affichage
# 3. Vérifier dans Supabase Table Editor que la valeur est bien sauvegardée`,
      },
      {
        title: "FAQ Développement — Les 15 questions les plus posées",
        desc: "Les vraies questions que se posent tous les débutants en développant ce type de projet. Réponses directes et pratiques.",
        code: `# Q1 : Comment savoir si mon changement est bien en production ?
# R : Vercel Dashboard → ton projet → Deployments
#     Vert = déployé | Rouge = échec | En cours = déploiement

# Q2 : J'ai modifié une variable d'environnement sur Vercel, ça ne change rien ?
# R : Après avoir ajouté/modifié une variable Vercel, tu dois REDÉPLOYER.
#     Deployments → "..." sur le dernier déploiement → Redeploy

# Q3 : Comment voir les erreurs de mes API routes en production ?
# R : Vercel Dashboard → ton projet → Functions → Logs
#     Filtre par date et recherche "ERROR"

# Q4 : Est-ce que je peux utiliser fetch() dans un Server Component ?
# R : OUI ! Les Server Components peuvent faire des fetch() directement.
#     Pas besoin de useEffect. C'est même recommandé pour le SEO.
async function ProductPage({ params }) {
  const product = await fetch('/api/products/' + params.slug).then(r => r.json());
  return <h1>{product.name}</h1>;
}

# Q5 : Comment tester mon site sur mobile pendant le développement ?
# R : npm run dev → http://192.168.x.x:3000 (l'IP réseau affichée dans le terminal)
#     Ton téléphone doit être sur le même Wi-Fi

# Q6 : Comment ajouter une image au projet (pas depuis Supabase) ?
# R : Mettre l'image dans public/images/ → Utiliser /images/mon-image.jpg
<img src="/images/hero.jpg" alt="Hero" />
# OU avec Next.js Image :
import Image from "next/image";
<Image src="/images/hero.jpg" alt="Hero" width={1200} height={600} />

# Q7 : Quelle est la différence entre getStaticProps et les Server Components ?
# R : getStaticProps = Next.js 12 (Pages Router, ancien) → NE PAS UTILISER
#     Server Components = Next.js 13+ (App Router, actuel) → UTILISER
#     Dans l'App Router : chaque page async function = Server Component

# Q8 : Comment protéger une page admin ?
# R : middleware.ts vérifie le cookie admin_session sur CHAQUE requête /admin/*
#     Si pas de cookie → redirect vers /admin (page de login)
#     Voir middleware.ts pour le code exact

# Q9 : Comment afficher un loading state pendant un fetch ?
# R : Pattern classique avec useState :
const [loading, setLoading] = useState(true);
useEffect(() => {
  setLoading(true);
  fetch("/api/products").then(r => r.json()).then(data => {
    setProducts(data);
    setLoading(false);
  });
}, []);
if (loading) return <div>Chargement...</div>;

# Q10 : Comment envoyer un email depuis l'app ?
# R : Utiliser Resend (déjà configuré dans le projet)
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: "L'ecomax <contact@lecomax.com>",
  to: customerEmail,
  subject: "Votre commande est confirmée",
  html: "<p>Merci pour votre commande !</p>",
});

# Q11 : Comment paginer les résultats Supabase ?
# R : Utiliser .range(from, to)
const PAGE_SIZE = 20;
const { data } = await supabase
  .from("products")
  .select("*")
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

# Q12 : Comment faire une recherche en temps réel ?
# R : Utiliser useEffect avec debounce + ilike Supabase
const [search, setSearch] = useState("");
useEffect(() => {
  const timer = setTimeout(() => {
    fetch("/api/products?search=" + search).then(...);
  }, 300);  // Attendre 300ms après la dernière frappe
  return () => clearTimeout(timer);
}, [search]);

# Q13 : Mon site est trop lent, comment l'accélérer ?
# R : 1. Utiliser next/image pour toutes les images (compression auto)
#     2. Ajouter loading="lazy" aux images non-critiques
#     3. Utiliser des Server Components (pas de JS côté client)
#     4. Ajouter cache aux API routes: headers: { 'Cache-Control': 's-maxage=60' }
#     5. Optimiser les requêtes Supabase (SELECT uniquement les colonnes nécessaires)

# Q14 : Comment gérer les erreurs 404 personnalisées ?
# R : Le fichier app/not-found.tsx est déjà configuré dans ce projet
#     Pour un 404 programmé : import { notFound } from "next/navigation"; notFound();

# Q15 : Comment voir les requêtes Supabase qui prennent du temps ?
# R : Supabase Dashboard → Database → Query Performance
#     Ou activer pg_stat_statements: SELECT * FROM pg_stat_statements ORDER BY total_time DESC;`,
      },
      {
        title: "Checklist avant de lancer le site en production",
        desc: "La checklist complète à vérifier AVANT d'annoncer le site à tes premiers clients. Ne lance jamais sans avoir tout coché.",
        code: `# ─── CHECKLIST DE LANCEMENT ─────────────────────────────────────────────

# ✅ TECHNIQUE
[ ] npm run build réussit sans erreur
[ ] Toutes les variables d'environnement sont dans Vercel
[ ] Le domaine pointe vers Vercel (A Record ou Nameservers)
[ ] SSL actif (cadenas vert dans le navigateur)
[ ] Les images Supabase s'affichent correctement
[ ] Le panier fonctionne (ajouter → vérifier localStorage)
[ ] Le formulaire de commande fonctionne end-to-end
[ ] Les emails de confirmation partent (tester avec ta propre adresse)
[ ] L'admin est accessible sur /admin avec ton compte
[ ] Les produits sont créés et visibles sur le site

# ✅ SEO
[ ] Le fichier public/robots.txt est configuré
[ ] Le sitemap /sitemap.xml liste tous les produits actifs
[ ] Les métadonnées (title, description) sont présentes sur chaque page
[ ] Open Graph (partage réseaux sociaux) est configuré dans layout.tsx
[ ] Google Search Console est configuré avec ton domaine

# ✅ PERFORMANCE
[ ] Test Lighthouse score > 80 sur mobile : https://pagespeed.web.dev
[ ] Les images sont en AVIF/WebP (vérifier dans l'inspecteur réseau)
[ ] Aucune image > 500 KB chargée sans lazy loading

# ✅ SÉCURITÉ
[ ] Le fichier .env.local est dans .gitignore (vérifier: git status)
[ ] SUPABASE_SERVICE_ROLE_KEY n'est PAS dans une variable NEXT_PUBLIC_
[ ] Les routes admin retournent 401 pour les non-connectés
[ ] middleware.ts protège bien /admin/*

# ✅ EXPÉRIENCE UTILISATEUR
[ ] Le site fonctionne sur mobile (tester sur vrai téléphone)
[ ] Les images de produits sont de bonne qualité
[ ] Le bouton WhatsApp est configuré avec ton vrai numéro
[ ] Les CGV, mentions légales et politique de confidentialité sont présentes
[ ] La page de contact fonctionne (/nous-contacter)

# ✅ ANALYTICS
[ ] Vercel Analytics est activé (voir app/layout.tsx)
[ ] Google Analytics est configuré (optionnel mais recommandé)

# 🎉 LANCEMENT !
git add . && git commit -m "chore: production ready" && git push origin main
# → Vercel déploie → Annonce sur WhatsApp → Premiers visiteurs !`,
      },
    ],
  },
  {
    num: "08", label: "Optimisations SEO, Performance & Sécurité", color: "bg-teal-500",
    steps: [
      {
        title: "Images optimisées (next.config.js)",
        desc: "Next.js convertit automatiquement en AVIF/WebP, redimensionne selon l'écran, et cache 1 an sur le CDN.",
        code: `// next.config.js
const nextConfig = {
  compress: true,
  poweredByHeader: false,        // Cache "X-Powered-By: Next.js" pour la sécurité
  trailingSlash: true,           // /boutique/ (SEO: cohérence des URLs)
  images: {
    formats: ["image/avif", "image/webp"],  // 30-50% plus léger que JPG
    minimumCacheTTL: 31536000,              // Cache CDN 1 an
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options",        value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};`
      },
      {
        title: "SEO — Métadonnées + Sitemap dynamique",
        desc: "Chaque page a des métadonnées générées côté serveur. Le sitemap liste tous les produits depuis Supabase.",
        code: `// Metadata statique (app/layout.tsx)
export const metadata: Metadata = {
  title: { default: "L'ecomax", template: "%s · L'ecomax" },
  description: "Boutique en ligne Maroc...",
  keywords: ["L'ecomax", "lecomax", "boutique en ligne Maroc", ...],
  openGraph: { images: ["/images/lecomax logo.png"] },
};

// Metadata dynamique (app/produit/[slug]/page.tsx)
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getDbProductRaw(params.slug);
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: product.name, images: product.images },
  };
}

// Sitemap dynamique (app/sitemap.xml/route.ts)
export async function GET() {
  const products = await getDbProducts();
  const urls = [
    { loc: "https://lecomax.com/", priority: "1.0" },
    ...products.map(p => ({ loc: \`https://lecomax.com/produit/\${p.slug}/\`, priority: "0.8" })),
  ];
  return new Response(buildXML(urls), { headers: { "Content-Type": "application/xml" } });
}`
      },
      {
        title: "Middleware — Mode maintenance + Sécurité",
        desc: "middleware.ts s'exécute à l'Edge sur chaque requête. Il gère la maintenance, protège /admin, et sécurise les writes.",
        code: `// middleware.ts
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Mode maintenance (vérifie Supabase settings table)
  if (!isStaticOrAdmin && pathname !== "/maintenance") {
    const { value } = await fetch(\`\${SUPABASE_URL}/rest/v1/settings?key=eq.maintenance_mode\`);
    if (value === "true") return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  // 2. Protection panel admin
  if (pathname.startsWith("/admin") && pathname !== "/admin/") {
    const session = req.cookies.get("admin_session")?.value;
    if (session !== "authenticated") return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 3. Sécurité API — bloque les writes non-autorisés
  const isAdminWrite = req.method !== "GET" &&
    /^\/api\/(products|orders|settings|coupons|promotions|categories)/.test(pathname);
  if (isAdminWrite) {
    const session = req.cookies.get("admin_session")?.value;
    if (session !== "authenticated") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return NextResponse.next();
}`
      },
    ],
  },
  {
    num: "09", label: "Outils pour faire grandir le site", color: "bg-rose-500",
    steps: [
      {
        title: "Resend — Emails transactionnels & newsletters",
        desc: "Resend gère TOUS les emails du site : confirmation de commande, mise à jour de livraison, newsletter marketing. Excellent taux de délivrabilité.",
        code: `# ── CRÉER UN COMPTE RESEND ───────────────────────────────────────────────────
# 1. Aller sur https://resend.com → Sign up (gratuit jusqu'à 3 000 emails/mois)

# ── AJOUTER SON DOMAINE ───────────────────────────────────────────────────────
# 2. Resend Dashboard → Domains → Add Domain → entrer "lecomax.com"
# 3. Resend fournit 3 records DNS à ajouter dans Namecheap :
#
#    Type: TXT  | Host: resend._domainkey       | Value: p=MIGf...    (DKIM)
#    Type: MX   | Host: send                    | Value: feedback-smtp.eu-west-1.amazonses.com
#    Type: TXT  | Host: @                       | Value: v=spf1 include:amazonses.com ~all
#
# 4. Cliquer "Verify" dans Resend → Status passe au vert (peut prendre 24h)

# ── OBTENIR LA CLÉ API ────────────────────────────────────────────────────────
# 5. Resend Dashboard → API Keys → Create API Key
# 6. Nommer : "lecomax-production" | Permission : Sending access
# 7. Copier la clé : re_xxxxxxxxxxxx (ne s'affiche qu'une fois !)

# ── CONFIGURER DANS LE PROJET ────────────────────────────────────────────────
# .env.local :
RESEND_API_KEY=re_xxxxxxxxxxxx

# Vercel Dashboard → Settings → Environment Variables :
# Ajouter RESEND_API_KEY = re_xxxxxxxxxxxx (pour la production)

# ── UTILISATION DANS LE CODE ─────────────────────────────────────────────────
# app/api/send-confirmation/route.ts :
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "L'ecomax <contact@lecomax.com>",
  to: customer.email,
  subject: "Confirmation de votre commande #" + order.order_number,
  html: emailTemplate(order),
});

# Emails envoyés par le site :
# - Confirmation de commande         → dès qu'une commande est créée
# - Mise à jour statut livraison     → quand admin change le statut
# - Newsletter (depuis /admin/newsletter) → campagnes marketing
# - Formulaire de contact            → relais vers contact@lecomax.com`
      },
      {
        title: "Notifications Push Web (web-push + VAPID)",
        desc: "Les push notifications permettent de recontacter les visiteurs même quand ils n'ont pas le site ouvert. Idéal pour les promotions flash.",
        code: `# ── GÉNÉRER LES CLÉS VAPID ───────────────────────────────────────────────────
# VAPID = Voluntary Application Server Identification
# Ces clés authentifient le serveur auprès des navigateurs.

# Dans le terminal VS Code :
npx web-push generate-vapid-keys

# Résultat :
# Public Key:  BExxx...   ← côté client (safe à exposer)
# Private Key: xxx...     ← serveur UNIQUEMENT (secret absolu)

# ── CONFIGURER LES CLÉS ───────────────────────────────────────────────────────
# .env.local :
VAPID_PUBLIC_KEY=BExxx...
VAPID_PRIVATE_KEY=xxx...
VAPID_EMAIL=mailto:contact@lecomax.com

# Vercel Dashboard → Settings → Environment Variables → ajouter les 3

# ── COMMENT ÇA MARCHE ─────────────────────────────────────────────────────────
# 1. Visiteur clique "Autoriser les notifications" (PushPrompt.tsx)
# 2. Le navigateur génère un objet PushSubscription (endpoint + keys)
# 3. On sauvegarde cet objet dans Supabase (table push_subscriptions)
# 4. Admin va sur /admin/push → rédige un message → Envoyer
# 5. L'API /api/push/send récupère tous les abonnés et envoie via web-push
# 6. Le service worker (public/sw.js) reçoit et affiche la notification

# Cas d'usage :
# ✅ "Nouvelle collection disponible !"
# ✅ "Flash vente -30% pendant 2h !"
# ✅ "Votre commande a été expédiée !"
# ✅ "Nouveau stock dispo pour votre taille"`
      },
      {
        title: "WhatsApp Business API (via whapi.cloud)",
        desc: "WhatsApp est le canal de communication N°1 au Maroc. On l'utilise pour le chat client, les confirmations et les broadcasts marketing.",
        code: `# ── CRÉER UN COMPTE WHAPI ─────────────────────────────────────────────────────
# 1. Aller sur https://whapi.cloud → S'inscrire
# 2. Créer un "Channel" → Scanner le QR code avec WhatsApp Business
# 3. Copier l'API Token (dashboard → channel → API Token)

# ── CONFIGURER DANS LE PROJET ────────────────────────────────────────────────
# .env.local :
WHATSAPP_API_TOKEN=eyJ...
WHATSAPP_CHANNEL_ID=xxx
NEXT_PUBLIC_WHATSAPP_NUMBER=212XXXXXXXXX   # Numéro au format international

# ── UTILISATION ──────────────────────────────────────────────────────────────
# Bouton WhatsApp visible sur le site (components/WhatsAppButton.tsx)
# → Ouvre WhatsApp avec un message pré-rempli

# API broadcast (app/api/whatsapp/route.ts) :
# → Envoyer des messages à des groupes de clients depuis /admin/broadcast

# Template de message de confirmation (auto après achat) :
# "Bonjour [prénom], votre commande #[numéro] a bien été reçue !
#  Livraison estimée : 2-5 jours ouvrables.
#  Suivi : https://lecomax.com/suivre-commande"

# Cas d'usage :
# ✅ Notification de commande en temps réel
# ✅ Chat support client (widget ChatWidget.tsx)
# ✅ Broadcast promotions à la liste clients
# ✅ Relance paniers abandonnés`
      },
      {
        title: "Google Search Console + IndexNow (SEO)",
        desc: "Google Search Console surveille l'indexation du site. IndexNow notifie instantanément Bing et Yandex quand un produit est créé/modifié.",
        code: `# ── GOOGLE SEARCH CONSOLE ───────────────────────────────────────────────────
# 1. Aller sur https://search.google.com/search-console
# 2. Ajouter une propriété → URL prefix → https://lecomax.com
# 3. Vérifier la propriété via le fichier TXT dans Namecheap :
#    Type: TXT | Host: @ | Value: google-site-verification=xxx
# 4. Soumettre le sitemap :
#    → Sitemaps → Entrer "sitemap.xml/sitemap.xml" → Submit
#    (notre sitemap est généré dynamiquement par app/sitemap.xml/route.ts)

# ── INDEXNOW ─────────────────────────────────────────────────────────────────
# IndexNow = protocole pour notifier les moteurs de recherche IMMÉDIATEMENT
# au lieu d'attendre le prochain crawl (peut prendre des semaines sinon)

# Fichier de vérification : public/d724dd3eb875908a4448cca481e61afd.txt
# → Ce fichier existe déjà dans le projet !

# L'API /api/indexnow/route.ts soumet automatiquement les URLs quand :
# - Un nouveau produit est créé/modifié
# - Une nouvelle page est publiée

# ── SITEMAP DYNAMIQUE ────────────────────────────────────────────────────────
# app/sitemap.xml/route.ts génère automatiquement :
# - Toutes les pages statiques (/, /boutique, /a-propos, etc.)
# - Toutes les pages produits (/produit/[slug])
# - Toutes les catégories (/chaussures, /homme, etc.)
# Mis à jour en temps réel à chaque nouveau produit.`
      },
      {
        title: "Vercel Analytics + Speed Insights (Performance)",
        desc: "Analytics sans cookies RGPD. Speed Insights mesure les Core Web Vitals réels depuis les vrais utilisateurs — pas des tests simulés.",
        code: `# ── VERCEL ANALYTICS ─────────────────────────────────────────────────────────
# Données disponibles dans le Vercel Dashboard → Analytics :
# ✅ Pages vues (time series)
# ✅ Pages les plus visitées
# ✅ Pays d'origine des visiteurs
# ✅ Types d'appareils (mobile/desktop)
# ✅ Referrers (d'où viennent les visiteurs)
# ✅ Conversion funnel (boutique → produit → panier → checkout)
# ✅ ZÉRO cookie (conforme RGPD sans bannière obligatoire)

# Installation dans le code (déjà fait) :
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
// Dans app/layout.tsx → <Analytics /> + <SpeedInsights />

# ── SPEED INSIGHTS ────────────────────────────────────────────────────────────
# Mesure les 3 Core Web Vitals (critères de Google pour le ranking) :
# LCP  (Largest Contentful Paint)  → Image/texte principal affiché < 2.5s ✅
# FID  (First Input Delay)         → Réactivité au premier clic < 100ms  ✅
# CLS  (Cumulative Layout Shift)   → Stabilité visuelle (score 0 = parfait) ✅

# Activer dans Vercel Dashboard :
# Project → Analytics → Enable
# Project → Speed Insights → Enable

# Accès côté admin du site :
# /admin/analytics → graphiques traffic
# /admin/recordings → enregistrements de sessions (via DataCollector.tsx)`
      },
      {
        title: "OpenAI — Intelligence artificielle intégrée",
        desc: "L'IA est utilisée dans 5 sections du panel admin pour accélérer la gestion du store. Nécessite un compte OpenAI et une clé API.",
        code: `# ── CRÉER UN COMPTE OPENAI ───────────────────────────────────────────────────
# 1. Aller sur https://platform.openai.com → Sign up
# 2. Ajouter un moyen de paiement (facturation à l'usage)
# 3. Dashboard → API Keys → Create new secret key
# 4. Nommer : "lecomax" | Copier : sk-xxxxxxxxxxxx

# .env.local :
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# ── 5 USAGES DANS L'ADMIN ────────────────────────────────────────────────────
# 1. /admin/products → Bouton "✨ Générer avec IA"
#    → GPT analyse le nom + catégorie → génère une description de vente
#    → Économise 5-10 min par produit

# 2. /admin/messages → Bouton "Réponse suggérée"
#    → GPT lit le message client → propose une réponse professionnelle
#    → L'admin peut la modifier avant d'envoyer

# 3. /admin/broadcast → Assistant marketing
#    → GPT génère le contenu d'un email, SMS, ou post WhatsApp
#    → Basé sur un objectif (promo, lancement, annonce)

# 4. /admin/reviews → Analyse des avis
#    → GPT détecte les avis faux ou inappropriés
#    → Suggère si approuver ou rejeter

# 5. /admin/studio → Studio créatif IA
#    → Génération de textes marketing, titres, hashtags

# Coût moyen : ~0.01$ par génération (GPT-4o-mini)
# Budget typique : < 5$/mois pour une boutique de taille moyenne`
      },
      {
        title: "PayPal — Paiement en ligne international",
        desc: "PayPal complète le paiement à la livraison (COD). Permet aux clients d'acheter avec leur compte PayPal ou carte de crédit internationale.",
        code: `# ── CRÉER UN COMPTE PAYPAL BUSINESS ─────────────────────────────────────────
# 1. Aller sur https://developer.paypal.com → Log in / Sign up
# 2. Dashboard → Apps & Credentials → Create App
# 3. Nommer : "lecomax" | Type : Merchant
# 4. Copier le Client ID (Sandbox pour tests, puis Live pour production)

# .env.local :
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXxxx...   # Sandbox (tests)
# Pour la production : remplacer par le Live Client ID

# Vercel → Settings → Env → Ajouter la clé Live en production

# ── DANS LE CODE ──────────────────────────────────────────────────────────────
# app/checkout/page.tsx utilise @paypal/react-paypal-js :
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

<PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID! }}>
  <PayPalButtons
    createOrder={(data, actions) => actions.order.create({ purchase_units: [{ amount: { value: total.toString() } }] })}
    onApprove={(data, actions) => { /* créer la commande */ }}
  />
</PayPalScriptProvider>

# Méthodes de paiement acceptées sur le site :
# ✅ Paiement à la livraison (Cash on Delivery) — principal au Maroc
# ✅ PayPal — pour les achats internationaux
# ✅ Carte bancaire via PayPal (sans compte PayPal nécessaire)`
      },
    ],
  },
  {
    num: "10", label: "Cycle de vie d'une commande — Du panier à la livraison", color: "bg-indigo-500",
    steps: [
      {
        title: "Étape 1 — Le client ajoute un produit au panier",
        desc: "CartContext.tsx intercepte le clic. Il vérifie si le produit (même slug, même taille, même couleur) existe déjà dans le tableau items. Si oui, il incrémente la quantité. Sinon, il ajoute un nouvel item. L'état est immédiatement sauvegardé dans localStorage.",
        code: `// Ce qui se passe quand on clique "Ajouter au panier"
// ──────────────────────────────────────────────────────────

// 1. Bouton dans app/produit/[slug]/page.tsx ou components/ProductCard.tsx :
const { add } = useCart();  // useContext(CartContext)
<button onClick={() => add(product, selectedSize, 1, selectedColor)}>
  Ajouter au panier
</button>

// 2. La fonction add() dans CartContext.tsx :
add: (product, size, qty = 1, color = "") => {
  setItems(prev => {
    const existing = prev.find(i => i.slug === product.slug && i.size === size && i.color === color);
    if (existing) {
      // Produit déjà dans le panier → incrémenter quantité
      return prev.map(i =>
        i.slug === product.slug && i.size === size && i.color === color
          ? { ...i, quantity: i.quantity + qty }
          : i
      );
    }
    // Nouveau produit → ajouter à la liste
    return [...prev, { slug: product.slug, name: product.name, price: product.price,
                       image: product.images?.[0] ?? "", size, color, quantity: qty }];
  });
},

// 3. useEffect sauvegarde dans localStorage à chaque changement :
useEffect(() => {
  if (hydrated) localStorage.setItem("lecomax_cart_v1", JSON.stringify(items));
}, [items, hydrated]);

// 4. L'icône du panier dans Header.tsx se met à jour automatiquement :
const { count } = useCart();  // count = somme de toutes les quantités
// → Le badge rouge affiche le nombre d'articles`
      },
      {
        title: "Étape 2 — Le client va sur /panier et /checkout",
        desc: "La page panier lit les données de CartContext (déjà chargées depuis localStorage). La page checkout collecte l'adresse de livraison et la méthode de paiement.",
        code: `// app/panier/page.tsx — lit CartContext
const { items, total, remove, updateQty } = useCart();
// → Affiche tous les items, le sous-total, le champ coupon

// Validation coupon (si l'utilisateur entre un code) :
const res = await fetch("/api/coupons/validate?code=" + couponCode);
const { discount, type } = await res.json();
// type = "percent" ou "fixed"
// discount = 20 → 20% de réduction ou 20 MAD de moins

// app/checkout/page.tsx — formulaire de livraison :
const [form, setForm] = useState({
  name: "", phone: "", email: "", city: "", address: ""
});
// Validation côté client :
if (!form.phone.match(/^0[5-7][0-9]{8}$/)) {
  setError("Numéro de téléphone invalide (format: 06XXXXXXXX)");
  return;
}

// Méthode de paiement :
// Option A: Paiement à la livraison → bouton "Commander"
// Option B: PayPal → <PayPalButtons /> → approval → handleOrder()`
      },
      {
        title: "Étape 3 — POST /api/orders → Supabase",
        desc: "Quand le client clique 'Commander', le frontend envoie un POST à /api/orders avec tous les détails. L'API génère un numéro de commande unique, sauvegarde dans Supabase, puis déclenche l'email de confirmation.",
        code: `// Frontend checkout.tsx → envoie la commande
const handleOrder = async () => {
  const orderData = {
    customer: { name: form.name, phone: form.phone, email: form.email,
                city: form.city, address: form.address },
    items: cartItems,       // [{slug, name, price, qty, image, size, color}]
    total: finalTotal,      // total après réduction coupon
    payment_method: "cod",  // "cod" ou "paypal"
    coupon: couponCode,
  };

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

  const { order } = await res.json();
  cart.clear();  // Vider le panier
  router.push("/merci?order=" + order.order_number);
};

// ── API route: app/api/orders/route.ts ──────────────────────────────────────
export async function POST(req) {
  const body = await req.json();

  // Générer un numéro de commande unique
  const orderNumber = "LCX-" + Date.now().toString(36).toUpperCase();

  // Sauvegarder dans Supabase
  const sb = getClient();  // service_role → bypass RLS
  const { data: order } = await sb.from("orders").insert({
    order_number:   orderNumber,
    customer:       body.customer,
    items:          body.items,
    total:          body.total,
    payment_method: body.payment_method,
    status:         "pending",       // Statut initial
  }).select().single();

  // Décrémenter le stock pour chaque article
  for (const item of body.items) {
    await sb.rpc("decrement_stock", { product_slug: item.slug, qty: item.quantity });
  }

  // Envoyer l'email de confirmation (via Resend)
  await fetch(new URL("/api/send-confirmation", req.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });

  return NextResponse.json({ order });
}`
      },
      {
        title: "Étape 4 — Email de confirmation via Resend",
        desc: "L'API /api/send-confirmation reçoit les données de la commande et envoie un email HTML personnalisé au client ET une notification à l'admin. Resend garantit une délivrabilité excellente avec le domaine vérifié.",
        code: `// app/api/send-confirmation/route.ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { order } = await req.json();

  // Email au CLIENT
  await resend.emails.send({
    from:    "L'ecomax <contact@lecomax.com>",
    to:      order.customer.email,
    subject: "Confirmation de votre commande #" + order.order_number,
    html: \`
      <div style="font-family:Arial;max-width:600px;margin:0 auto">
        <h1>Merci pour votre commande !</h1>
        <p>Bonjour <strong>\${order.customer.name}</strong>,</p>
        <p>Votre commande <strong>#\${order.order_number}</strong> a bien été reçue.</p>

        <h2>Récapitulatif (\${order.total} MAD)</h2>
        <ul>
          \${order.items.map(i => \`<li>\${i.name} x\${i.quantity} — \${i.price} MAD\`).join("")}
        </ul>

        <p>Livraison à : <strong>\${order.customer.city}, \${order.customer.address}</strong></p>
        <p>Délai estimé : <strong>2-5 jours ouvrables</strong></p>

        <a href="https://lecomax.com/suivre-commande" style="background:#16b277;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
          Suivre ma commande
        </a>
      </div>
    \`,
  });

  // Notification à l'ADMIN (email interne)
  await resend.emails.send({
    from:    "L'ecomax Bot <no-reply@lecomax.com>",
    to:      "admin@lecomax.com",
    subject: "Nouvelle commande #" + order.order_number + " — " + order.total + " MAD",
    html:    \`<p>Commande de \${order.customer.name} (tel: \${order.customer.phone})</p>\`,
  });

  return NextResponse.json({ sent: true });
}`
      },
      {
        title: "Étape 5 — L'admin voit la commande dans /admin/orders",
        desc: "Le dashboard admin affiche les nouvelles commandes en temps réel via un polling toutes les 60 secondes. L'admin peut changer le statut, ajouter un numéro de suivi, et imprimer la commande.",
        code: `// app/admin/dashboard/page.tsx — charge les dernières commandes
useEffect(() => {
  const load = async () => {
    const res = await fetch("/api/orders?limit=10&sort=created_at:desc");
    const data = await res.json();
    setOrders(data);
    // Compter les commandes "pending" pour le badge rouge
    setPendingCount(data.filter(o => o.status === "pending").length);
  };
  load();
  const interval = setInterval(load, 60_000);  // Reload toutes les 60s
  return () => clearInterval(interval);
}, []);

// app/admin/orders/page.tsx — l'admin change le statut
const updateStatus = async (orderId, newStatus) => {
  await fetch(\`/api/orders/\${orderId}\`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
};

// Statuts disponibles (dans l'ordre chronologique) :
// pending    → Commande reçue, en attente de traitement
// processing → En cours de préparation
// shipped    → Expédiée (numéro de suivi disponible)
// delivered  → Livrée et confirmée
// cancelled  → Annulée

// Ajouter un numéro de suivi :
await fetch(\`/api/orders/\${orderId}\`, {
  method: "PUT",
  body: JSON.stringify({ tracking_number: "MA123456789MA" }),
});`
      },
      {
        title: "Étape 6 — Email de mise à jour statut → client",
        desc: "Quand l'admin change le statut d'une commande en 'shipped', un email est envoyé automatiquement au client avec le numéro de suivi. Ce comportement est déclenché par la route PUT /api/orders/[id].",
        code: `// app/api/orders/[id]/route.ts — PUT (admin seulement)
export async function PUT(req, { params }) {
  // Vérifier la session admin
  const session = req.cookies.get("admin_session")?.value;
  if (session !== "authenticated") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const sb = getClient();

  // Récupérer l'ancienne commande
  const { data: old } = await sb.from("orders").select("*").eq("id", params.id).single();

  // Mettre à jour dans Supabase
  const { data: order } = await sb.from("orders")
    .update(body)
    .eq("id", params.id)
    .select().single();

  // Si le statut est passé à "shipped" → envoyer email au client
  if (body.status === "shipped" && old?.status !== "shipped" && order.customer?.email) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    "L'ecomax <contact@lecomax.com>",
      to:      order.customer.email,
      subject: "Votre commande #" + order.order_number + " a été expédiée !",
      html: \`
        <h2>Bonne nouvelle ! Votre commande est en route.</h2>
        <p>Numéro de suivi : <strong>\${order.tracking_number ?? "sera communiqué prochainement"}</strong></p>
        <p>Délai de livraison estimé : 2-4 jours ouvrables</p>
        <a href="https://lecomax.com/suivre-commande">Suivre ma commande</a>
      \`,
    });
  }

  return NextResponse.json(order);
}

// Résumé du flux complet :
// Client → Panier → Checkout → POST /api/orders → Supabase → Email client
// → Admin voit dans /admin/dashboard → Traite dans /admin/orders
// → Change statut → PUT /api/orders/[id] → Email livraison client`
      },
    ],
  },
  {
    num: "11", label: "Composants clés — Comment ils fonctionnent", color: "bg-purple-500",
    steps: [
      {
        title: "Header.tsx — Navigation principale + Panier",
        desc: "Le Header est chargé une seule fois dans app/layout.tsx. Il reste en mémoire toute la navigation. La barre de recherche ouvre une overlay avec filtrage en temps réel. AdminLayoutWrapper le cache sur /admin.",
        code: `// components/Header.tsx — structure principale
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useCart();  // Badge rouge du panier

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">

        {/* Logo → lien vers / */}
        <Link href="/"><Logo /></Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex gap-6">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        {/* Actions droite */}
        <div className="flex items-center gap-3">
          {/* Bouton recherche → ouvre SearchOverlay */}
          <button onClick={() => setSearchOpen(true)}>🔍</button>

          {/* Panier avec badge */}
          <Link href="/panier" className="relative">
            🛒
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {/* Menu mobile */}
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>☰</button>
        </div>
      </div>

      {/* Overlays */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </header>
  );
}

// components/SearchOverlay.tsx — recherche en temps réel
const [q, setQ] = useState("");
const [results, setResults] = useState([]);

useEffect(() => {
  if (q.length < 2) return;
  const t = setTimeout(async () => {
    const res = await fetch(\`/api/products?search=\${q}&active=true&limit=8\`);
    setResults(await res.json());
  }, 300);  // Debounce 300ms
  return () => clearTimeout(t);
}, [q]);`
      },
      {
        title: "AnnouncementBar.tsx — Texte en temps réel depuis Supabase",
        desc: "La barre d'annonce (top du site) lit son contenu depuis la table settings de Supabase. L'admin peut la modifier depuis /admin/settings sans redéploiement. C'est le pattern clé du site : tout configurable depuis l'admin.",
        code: `// components/AnnouncementBar.tsx
export default function AnnouncementBar() {
  const [text, setText] = useState("");
  const [color, setColor] = useState("#0d0d0d");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(settings => {
        // settings = [{ key: "announcement_text", value: "Livraison gratuite..." }, ...]
        const textSetting  = settings.find(s => s.key === "announcement_text");
        const colorSetting = settings.find(s => s.key === "announcement_color");
        const activeSetting = settings.find(s => s.key === "announcement_active");

        if (activeSetting?.value === "true" && textSetting?.value) {
          setText(textSetting.value);
          setColor(colorSetting?.value ?? "#0d0d0d");
          setVisible(true);
        }
      });
  }, []);

  if (!visible || !text) return null;

  return (
    <div style={{ backgroundColor: color }}
      className="text-white text-center text-xs py-2 px-4 font-medium">
      {text}
      <button onClick={() => setVisible(false)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// Même pattern utilisé pour :
// → useSettings() hook dans lib/use-settings.ts
// → Charge depuis /api/settings et met en cache localement
// → Utilisé par : AnnouncementBar, HeroBanner, ChatWidget, etc.`
      },
      {
        title: "HeroBanner.tsx — Slides automatiques depuis Supabase",
        desc: "Le Hero de la page d'accueil affiche des slides configurables depuis l'admin. Chaque slide a une image, un titre, un sous-titre, et un bouton CTA. Le défilement automatique est géré par un useInterval.",
        code: `// components/HeroBanner.tsx
const [slides, setSlides] = useState([]);
const [current, setCurrent] = useState(0);

// Charger les slides depuis Supabase via l'API settings
useEffect(() => {
  fetch("/api/settings")
    .then(r => r.json())
    .then(settings => {
      const bannersSetting = settings.find(s => s.key === "hero_banners");
      if (bannersSetting?.value) {
        setSlides(JSON.parse(bannersSetting.value));
      }
    });
}, []);

// Auto-scroll toutes les 5 secondes
useEffect(() => {
  if (slides.length <= 1) return;
  const timer = setInterval(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, 5000);
  return () => clearInterval(timer);
}, [slides.length]);

// Chaque slide :
// { image: "https://...", title: "Nouvelle Collection", cta: "Voir tout", href: "/nouveautes" }

// Dans /admin/banners → l'admin peut :
// → Ajouter/supprimer des slides
// → Modifier le titre, le bouton CTA
// → Changer l'image (upload vers Supabase Storage)
// → Réordonner les slides par drag & drop

// Optimisation Next.js Image :
<Image
  src={slides[current].image}
  alt={slides[current].title}
  fill priority
  className="object-cover"
  sizes="100vw"
/>`
      },
      {
        title: "ProductCard.tsx — Fiche produit compacte",
        desc: "Utilisée partout sur le site (accueil, boutique, catégories, recherche). Elle affiche l'image principale, le prix, les couleurs disponibles, et le bouton d'ajout au panier. L'image change au hover si plusieurs images existent.",
        code: `// components/ProductCard.tsx
export default function ProductCard({ product }: { product: Product }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const { add } = useCart();

  const handleAdd = () => {
    // Ajouter avec la taille par défaut (S ou première dispo)
    add(product, product.sizes?.[0] ?? "", 1, product.colors?.[0] ?? "");
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);  // Feedback 1.5s
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image avec swap au hover */}
      <div className="relative aspect-square overflow-hidden bg-gray-100"
        onMouseEnter={() => product.images.length > 1 && setImgIdx(1)}
        onMouseLeave={() => setImgIdx(0)}>
        <Image src={product.images[imgIdx]} alt={product.name} fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width:768px) 50vw, 25vw" />

        {/* Badge promotion si prix barré */}
        {product.original_price && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{Math.round((1 - product.price/product.original_price)*100)}%
          </span>
        )}
      </div>

      {/* Infos produit */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-brand-500 font-black">{product.price} MAD</span>
          {product.original_price && (
            <span className="text-gray-400 text-xs line-through">{product.original_price} MAD</span>
          )}
        </div>
        <button onClick={handleAdd}
          className={\`w-full mt-2 py-1.5 rounded-lg text-sm font-semibold transition-colors \${addedFeedback ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-brand-500 hover:text-white"}\`}>
          {addedFeedback ? "✓ Ajouté !" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}`
      },
      {
        title: "middleware.ts — Gardien de toutes les routes",
        desc: "Le middleware s'exécute à l'Edge (Vercel Edge Runtime) AVANT que la requête atteigne le serveur Next.js. Il est ultra-rapide car il tourne au niveau CDN, près de l'utilisateur. Il gère la maintenance, la protection admin, et la sécurité API.",
        code: `// middleware.ts — s'exécute sur CHAQUE requête (avant les pages et APIs)
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ── RÈGLE 1 : Ignorer les fichiers statiques ──────────────────────────────
  // On ne fait rien pour _next/static, images, favicon, etc.
  if (pathname.startsWith("/_next") || pathname.startsWith("/images") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // ── RÈGLE 2 : Mode maintenance ────────────────────────────────────────────
  // Vérifier si maintenance_mode = "true" dans Supabase settings
  if (pathname !== "/maintenance" && !pathname.startsWith("/admin")) {
    try {
      const settingsRes = await fetch(
        \`\${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/settings?key=eq.maintenance_mode\`,
        { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } }
      );
      const settings = await settingsRes.json();
      if (settings[0]?.value === "true") {
        return NextResponse.redirect(new URL("/maintenance", req.url));
      }
    } catch { /* Silently ignore */ }
  }

  // ── RÈGLE 3 : Protection panel admin ─────────────────────────────────────
  // Toutes les routes /admin/* sauf /admin/ (page login) nécessitent le cookie
  if (pathname.startsWith("/admin") && pathname !== "/admin/" && pathname !== "/admin") {
    const session = req.cookies.get("admin_session")?.value;
    if (session !== "authenticated") {
      // Rediriger vers login avec la page de destination
      return NextResponse.redirect(
        new URL(\`/admin?from=\${encodeURIComponent(pathname)}\`, req.url)
      );
    }
  }

  // ── RÈGLE 4 : Sécurité API writes ─────────────────────────────────────────
  // POST/PUT/DELETE sur les routes admin API
  const isWrite = req.method !== "GET";
  const isAdminAPI = /^\\/api\\/(products|orders|settings|coupons|promotions|categories|push|newsletter|announcements|banners|ads)/.test(pathname);
  if (isWrite && isAdminAPI) {
    const session = req.cookies.get("admin_session")?.value;
    if (session !== "authenticated") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Matcher : sur quelles routes exécuter le middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)"],
};`
      },
      {
        title: "AdminLayoutWrapper.tsx — Masquer Header/Footer sur /admin",
        desc: "Ce composant client lit le pathname actuel. S'il commence par /admin, il retourne null (efface ses enfants). Utilisé dans app/layout.tsx pour cacher Header, Footer, CookieBanner et autres composants sur toutes les pages d'administration.",
        code: `// components/AdminLayoutWrapper.tsx
"use client";
import { usePathname } from "next/navigation";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Si on est sur /admin/*, on ne rend PAS les enfants (null = invisible)
  if (pathname?.startsWith("/admin")) return null;

  // Sinon, rendre normalement
  return <>{children}</>;
}

// Utilisation dans app/layout.tsx :
// Tout ce qui ne doit PAS apparaître sur /admin est wrappé :
<AdminLayoutWrapper>
  <AnnouncementBar />    {/* ← Caché sur /admin */}
  <Header />             {/* ← Caché sur /admin */}
  <CookieBanner />       {/* ← Caché sur /admin */}
</AdminLayoutWrapper>

{children}  {/* ← Pages normales ici (inclut /admin/layout.tsx) */}

<AdminLayoutWrapper>
  <Footer />             {/* ← Caché sur /admin */}
</AdminLayoutWrapper>

// Pourquoi pas une condition if dans layout.tsx ?
// → layout.tsx est un Server Component, il ne peut pas utiliser usePathname()
// → AdminLayoutWrapper est Client Component → peut utiliser les hooks
// → Pattern propre et réutilisable

// Le layout /admin/layout.tsx affiche SES propres Header et Sidebar :
// → Sidebar avec navigation admin
// → Header admin avec déconnexion et notifications`
      },
      {
        title: "CookieBanner.tsx — Consentement RGPD",
        desc: "Le cookie banner est affiché lors de la première visite. Il enregistre le consentement dans localStorage ET dans Supabase (table cookie_consents) pour la traçabilité RGPD. Il est masqué sur /admin via AdminLayoutWrapper.",
        code: `// components/CookieBanner.tsx
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son accord
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setShow(true);  // Pas encore de consentement → afficher
  }, []);

  const accept = async () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);

    // Enregistrer dans Supabase pour la conformité RGPD
    await fetch("/api/client-data/consent", {
      method: "POST",
      body: JSON.stringify({ consent: "accepted", timestamp: new Date().toISOString() }),
    });

    // Activer Google Analytics maintenant que le consentement est donné
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setShow(false);
    // Analytics restent désactivés (défaut: "denied")
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-sm z-[100] bg-white border shadow-xl rounded-2xl p-4">
      <p className="text-sm text-gray-700">
        Nous utilisons des cookies pour améliorer votre expérience.
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={accept} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-semibold">Accepter</button>
        <button onClick={decline} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">Refuser</button>
      </div>
    </div>
  );
}`
      },
    ],
  },
  {
    num: "12", label: "Variables d'environnement — Guide complet", color: "bg-amber-500",
    steps: [
      {
        title: "C'est quoi un fichier .env.local ?",
        desc: ".env.local est un fichier texte à la racine du projet qui stocke les clés secrètes. Il n'est JAMAIS envoyé sur GitHub (.gitignore l'exclut). En production sur Vercel, les mêmes variables sont configurées dans le Dashboard.",
        code: `# ── STRUCTURE D'UN FICHIER .env.local ──────────────────────────────────────
# Ce fichier est à la racine du projet : C:\\Users\\...\\lecomax\\.env.local
# Il ne doit JAMAIS apparaître sur GitHub — vérifier le .gitignore !

# Règle d'or :
# NEXT_PUBLIC_  → Variables exposées au navigateur (pas de secrets !)
# Sans préfixe  → Variables serveur uniquement (jamais accessibles côté client)

# .gitignore doit contenir :
.env.local
.env.production
.env*.local

# Si ce fichier a été commité par erreur :
# 1. Supprimer et commiter la suppression
# 2. RÉVOQUER IMMÉDIATEMENT toutes les clés compromises (Supabase, OpenAI, etc.)
# 3. Générer de nouvelles clés sur chaque service`
      },
      {
        title: "Toutes les variables — Service par service",
        desc: "Voici chaque variable d'environnement utilisée dans le projet, avec sa source, son rôle, et si elle est requise ou optionnelle.",
        code: `# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SUPABASE — Base de données & Authentification
# Source : supabase.com → Project → Settings → API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co          # URL du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...                  # Clé publique (safe côté client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...                      # ⚠️ SERVEUR UNIQUEMENT — bypass RLS

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RESEND — Emails transactionnels & newsletters
# Source : resend.com → API Keys → Create API Key
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESEND_API_KEY=re_xxxxxxxxxxxx                              # Clé API Resend

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OPENAI — Intelligence artificielle
# Source : platform.openai.com → API Keys → Create new secret key
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPENAI_API_KEY=sk-xxxxxxxxxxxx                             # Clé API OpenAI (commence par sk-)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WEB PUSH — Notifications push navigateur
# Source : généré par "npx web-push generate-vapid-keys"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BExxx...                      # Clé VAPID publique
VAPID_PRIVATE_KEY=xxx...                                   # ⚠️ SERVEUR UNIQUEMENT
VAPID_EMAIL=mailto:contact@lecomax.com                     # Email contact VAPID

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAYPAL — Paiement en ligne
# Source : developer.paypal.com → Apps → Create App → Copy Client ID
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXxxx...                      # Client ID (Sandbox ou Live)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WHATSAPP — Via whapi.cloud
# Source : whapi.cloud → Dashboard → Channel → API Token
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHATSAPP_API_TOKEN=eyJ...                                   # Token WhatsApp API
WHATSAPP_CHANNEL_ID=xxx                                    # ID du canal WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=212XXXXXXXXX                   # Numéro format international

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# IMAP — Lecture emails entrants (boîte inbox admin)
# Source : fournisseur email (Gmail, Namecheap Email, etc.)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAP_HOST=mail.privateemail.com                            # Serveur IMAP Namecheap
IMAP_PORT=993                                              # Port SSL
IMAP_USER=contact@lecomax.com                              # Email à surveiller
IMAP_PASS=xxxxxxxxxxxx                                     # Mot de passe email`
      },
      {
        title: "Comment créer son .env.local depuis zéro",
        desc: "Voici la procédure complète pour configurer toutes les variables d'environnement sur un nouveau poste de travail. Idéal si tu passes d'un ordinateur à un autre ou si tu réinstalles le projet.",
        code: `# ── ÉTAPE 1 : Créer le fichier .env.local ────────────────────────────────────
# Dans VS Code → terminal → à la racine du projet :
New-Item .env.local  # PowerShell (Windows)
# ou
touch .env.local     # Mac/Linux/Git Bash

# ── ÉTAPE 2 : Récupérer les clés Supabase ────────────────────────────────────
# 1. Aller sur supabase.com → Se connecter → Ouvrir le projet lecomax
# 2. Settings (icône engrenage) → API
# 3. Copier "URL", "anon public" et "service_role"

# ── ÉTAPE 3 : Récupérer la clé Resend ────────────────────────────────────────
# 1. resend.com → Se connecter
# 2. API Keys → Créer une nouvelle clé si nécessaire
# 3. Copier la clé re_xxxxxxxxx

# ── ÉTAPE 4 : Récupérer la clé OpenAI ────────────────────────────────────────
# 1. platform.openai.com → Se connecter → API Keys
# 2. Create new secret key → Copier sk-xxxxxxxxx

# ── ÉTAPE 5 : Régénérer les clés VAPID ───────────────────────────────────────
# Dans le terminal VS Code :
npx web-push generate-vapid-keys
# → Copier Public Key et Private Key dans .env.local

# ── ÉTAPE 6 : Vérifier que tout fonctionne ───────────────────────────────────
npm run dev
# → Si une API échoue avec "undefined key" ou "invalid key"
#   → Vérifier dans .env.local que la variable est correcte
#   → Redémarrer npm run dev après chaque modification de .env.local !
#   ⚠️ next dev ne recharge PAS .env.local à chaud`
      },
      {
        title: "Comment Vercel lit les variables d'environnement",
        desc: "En production, les variables sont stockées dans le dashboard Vercel, pas dans des fichiers. Elles sont injectées au moment du build et au runtime. Chaque variable peut avoir des valeurs différentes selon l'environnement (Production, Preview, Development).",
        code: `# ── AJOUTER UNE VARIABLE SUR VERCEL ──────────────────────────────────────────
# 1. vercel.com → Ouvrir le projet lecomax
# 2. Settings (onglet) → Environment Variables
# 3. Cliquer "Add New"
# 4. Remplir : Name, Value, choisir les environnements
#    ✅ Production  → déployé sur lecomax.com
#    ✅ Preview     → branches GitHub (Pull Requests)
#    ✅ Development → optionnel (on utilise .env.local)

# ── ENVIRONNEMENTS VERCEL ─────────────────────────────────────────────────────
# Production  = branche "main"  → https://lecomax.com
# Preview     = autres branches  → https://lecomax-git-feature-xxx.vercel.app
# Development = local           → http://localhost:3000 (lit .env.local)

# ── EXEMPLE : PAYPAL SANDBOX vs LIVE ─────────────────────────────────────────
# Development :  NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXsandbox...  (tests)
# Production :   NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXlive...     (vrai argent !)

# ── COMMENT VÉRIFIER QU'UNE VARIABLE EST BIEN CHARGÉE ────────────────────────
# Côté serveur (dans une API route ou Server Component) :
console.log(process.env.RESEND_API_KEY?.slice(0, 8) + "...");  // Affiche "re_xxxxx..."
# ⚠️ NE JAMAIS log une variable complète — risque de sécurité

# Côté client (uniquement NEXT_PUBLIC_) :
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);  // Visible dans la console du navigateur

# Variables sans NEXT_PUBLIC_ côté client retournent "undefined"
console.log(process.env.RESEND_API_KEY);  // → undefined (normal !)

# ── ORDRE DE PRIORITÉ DES VARIABLES ──────────────────────────────────────────
# 1. Variables systèmes (process.env de l'OS)
# 2. .env.local                        (local, non commité)
# 3. .env.[NODE_ENV].local             (ex: .env.development.local)
# 4. .env.[NODE_ENV]                   (ex: .env.development)
# 5. .env                              (commité, valeurs par défaut publiques seulement)

# ── APRÈS AVOIR AJOUTÉ UNE VARIABLE SUR VERCEL ───────────────────────────────
# → Déclencher un redéploiement :
#   Vercel Dashboard → Deployments → ... → Redeploy
#   OU simplement : git push (un commit vide suffit)
git commit --allow-empty -m "chore: reload env vars"
git push`
      },
      {
        title: "Débogage des erreurs d'API les plus fréquentes",
        desc: "Les erreurs les plus courantes lors du développement sont liées aux variables d'environnement, à l'authentification Supabase, ou aux permissions des routes. Voici comment les diagnostiquer et les résoudre rapidement.",
        code: `# ══ ERREUR 1 : "Invalid API key" ou "Unauthorized" ══════════════════════════
Cause : La clé API est incorrecte ou la variable d'environnement n'est pas chargée.
Fix :
  1. Vérifier dans .env.local que la clé est correcte (copier-coller depuis la source)
  2. Redémarrer npm run dev (les changements .env.local nécessitent un restart)
  3. Vérifier qu'il n'y a pas d'espace ou de guillemets autour de la valeur :
     ❌ RESEND_API_KEY="re_xxx"   ← guillemets en trop
     ✅ RESEND_API_KEY=re_xxx     ← correct

# ══ ERREUR 2 : "Row not found" ou données vides depuis Supabase ══════════════
Cause : RLS (Row Level Security) bloque la lecture côté client.
Fix :
  Option A — Désactiver RLS sur la table (OK pour les données publiques produits)
  Option B — Utiliser la service_role key côté serveur (lib/db-server.ts)
  Option C — Ajouter une policy RLS :
    CREATE POLICY "Public read" ON products FOR SELECT TO anon USING (active = true);

# ══ ERREUR 3 : "Failed to fetch" depuis le frontend ══════════════════════════
Cause : Route API non trouvée, ou erreur serveur silencieuse.
Fix :
  1. Ouvrir la console navigateur (F12 → Network)
  2. Identifier la requête en erreur (rouge)
  3. Vérifier le status code :
     404 → La route API n'existe pas (vérifier le chemin du fichier)
     500 → Erreur serveur → voir les logs dans le terminal npm run dev
     401 → Non authentifié → vérifier le cookie admin_session
     403 → CORS ou interdiction → vérifier le middleware

# ══ ERREUR 4 : Les types TypeScript ne correspondent pas ═════════════════════
Cause : La structure retournée par Supabase ne correspond pas aux types définis.
Fix :
  1. Vérifier le schéma de la table dans Supabase Dashboard
  2. Mettre à jour les types dans lib/supabase.ts
  3. Utiliser "as Product" seulement en dernier recours

# ══ ERREUR 5 : "Module not found" après npm install ═════════════════════════
Cause : Cache npm ou version incompatible.
Fix :
  Remove-Item node_modules -Recurse -Force    # Windows PowerShell
  Remove-Item package-lock.json
  npm install
  npm run dev`
      },
    ],
  },
  {
    num: "13", label: "Flux de données réels — Schéma complet", color: "bg-lime-600",
    steps: [
      {
        title: "Schéma : Comment un produit apparaît sur le site",
        desc: "De la création dans /admin/products jusqu'à l'affichage dans la boutique, voici chaque étape technique du cycle de vie d'un produit.",
        code: `┌─────────────────────────────────────────────────────────────────────────┐
│  CYCLE DE VIE D'UN PRODUIT                                             │
└─────────────────────────────────────────────────────────────────────────┘

① ADMIN crée le produit dans /admin/products
   │
   ├─ Remplit : nom, catégorie, prix, description, stock, images
   ├─ Clique "Générer avec IA" → POST /api/ai-product → OpenAI GPT
   │    → Retourne une description marketing optimisée
   ├─ Upload les images → POST /api/upload → Supabase Storage
   │    → Retourne l'URL publique https://xxx.supabase.co/storage/...
   └─ Clique "Enregistrer" → POST /api/products

② API /api/products (POST) traite la requête
   │
   ├─ Vérifie cookie admin_session (middleware.ts)
   ├─ Génère le slug : "Baskets Air Force" → "baskets-air-force"
   ├─ INSERT INTO products (...) via service_role client (bypass RLS)
   ├─ Si le produit est "featured" → met à jour le cache
   └─ Retourne { id, slug, ... } → 201 Created

③ Supabase stocke dans la table "products"
   │
   ├─ Données persistées en PostgreSQL
   ├─ Disponible immédiatement via l'API REST auto-générée
   └─ IndexNow notifié → Bing/Yandex indexent l'URL en quelques minutes

④ VISITEUR charge la page /boutique ou /chaussures
   │
   ├─ Next.js SSR : getServerSideProps ou Server Component
   ├─ fetch("/api/products?category=chaussures&active=true")
   ├─ → API interroge Supabase avec filtre active=true
   ├─ → Retourne l'array de produits JSON
   └─ → Next.js génère le HTML avec les produits

⑤ VISITEUR clique sur le produit → /produit/baskets-air-force
   │
   ├─ generateStaticParams() peut pré-générer les pages produits au build
   ├─ generateMetadata() génère title, description, og:image depuis Supabase
   ├─ ProductGallery affiche les images en carousel
   ├─ Le client sélectionne taille + couleur
   └─ "Ajouter au panier" → CartContext.add() → localStorage`
      },
      {
        title: "Schéma : Architecture réseau complète",
        desc: "Comment le trafic circule depuis l'ordinateur du visiteur jusqu'aux bases de données, en passant par les CDN Vercel et les services tiers.",
        code: `┌──────────────────────────────────────────────────────────────────────────┐
│  ARCHITECTURE RÉSEAU DE LECOMAX                                         │
└──────────────────────────────────────────────────────────────────────────┘

VISITEUR (Maroc, France, monde)
   │
   │  DNS: lecomax.com → Vercel Edge Network
   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  VERCEL EDGE NETWORK (CDN mondial — 70+ points de présence)            │
│                                                                          │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐     │
│  │  Edge Caching   │   │  middleware.ts  │   │  Image CDN      │     │
│  │  (HTML + JS)    │   │  (Edge Runtime) │   │  (AVIF/WebP)    │     │
│  └────────┬────────┘   └────────┬────────┘   └─────────────────┘     │
│           │                     │                                        │
│           └─────────┬───────────┘                                       │
│                     ▼                                                    │
│           ┌─────────────────────┐                                       │
│           │  Next.js App        │                                       │
│           │  (Vercel Serverless)│                                       │
│           └─────────┬───────────┘                                       │
└─────────────────────│────────────────────────────────────────────────────┘
                       │ Requêtes serveur
          ┌────────────┼────────────────────────────────┐
          ▼            ▼                                  ▼
   ┌─────────────┐ ┌─────────────┐              ┌─────────────┐
   │  Supabase   │ │   Resend    │              │   OpenAI    │
   │  (EU West)  │ │  (Email)    │              │  (IA)       │
   │             │ └─────────────┘              └─────────────┘
   │ PostgreSQL  │
   │ Auth        │      ┌─────────────┐    ┌─────────────────┐
   │ Storage     │      │  web-push   │    │  Google/Bing    │
   │ RLS         │      │  (Push Notif│    │  Search Engines │
   └─────────────┘      └─────────────┘    └─────────────────┘

FLUX PAR TYPE DE PAGE :
┌───────────────────┬──────────────────────────────────────────────────────┐
│ Page d'accueil /  │ SSR → fetch products/featured + settings → HTML     │
│ /boutique         │ SSR → fetch products?category=... → HTML            │
│ /produit/[slug]   │ SSR → fetch product by slug → HTML + métadonnées    │
│ /checkout         │ Client → CartContext → POST /api/orders               │
│ /admin/*          │ Client → Supabase Auth session → API routes admin    │
└───────────────────┴──────────────────────────────────────────────────────┘`
      },
      {
        title: "Schéma : Comment GitHub, Vercel et le code se synchronisent",
        desc: "Chaque push Git déclenche un déploiement automatique. Vercel télécharge le code, installe les dépendances, compile TypeScript, construit le projet, et pousse sur le CDN — tout en moins de 2 minutes.",
        code: `┌──────────────────────────────────────────────────────────────────────────┐
│  PIPELINE CI/CD COMPLET                                                 │
└──────────────────────────────────────────────────────────────────────────┘

① DÉVELOPPEUR sur VS Code local
   │
   ├─ Modifie un fichier (ex: components/Header.tsx)
   ├─ npm run dev → Next.js détecte le changement → Fast Refresh
   │    → Le navigateur se met à jour en < 1s sans reload
   └─ Teste localement sur http://localhost:3000

② DÉVELOPPEUR push le code
   │
   git add .
   git commit -m "feat: amélioration header mobile"
   git push origin main

③ GitHub reçoit le push
   │
   ├─ Webhook automatique → notifie Vercel
   └─ GitHub Actions (optionnel) : tests, lint, type-check

④ VERCEL démarre le build
   │
   ├─ Clone le code depuis GitHub
   ├─ Lit les variables d'environnement (Dashboard Vercel)
   ├─ npm install → installe toutes les dépendances
   ├─ tsc --noEmit → vérifie les types TypeScript
   ├─ npm run build → compile Next.js
   │    ├─ Génère les Server Components (HTML statique)
   │    ├─ Bundle les Client Components (JavaScript)
   │    ├─ Optimise les images
   │    └─ Génère les pages statiques (ISR)
   └─ Si build ✅ → déploie sur le CDN

⑤ VERCEL pousse sur le CDN
   │
   ├─ Déploiement en production (lecomax.com) ← si c'est la branche main
   ├─ URL de preview (ex: lecomax-git-fix-xxx.vercel.app) ← autres branches
   ├─ Purge le cache CDN pour les nouvelles pages
   └─ Rollback automatique si le build échoue

⑥ VISITEURS reçoivent le nouveau code
   │
   ├─ CDN distribue les nouveaux fichiers JS/CSS
   ├─ ISR (Incremental Static Regeneration) revalide les pages
   └─ Durée totale : ~30-90 secondes depuis le git push

COMMANDES DE DÉVELOPPEMENT QUOTIDIEN :
  npm run dev      → Serveur développement (localhost:3000)
  npm run build    → Build de production (test avant push)
  npm run lint     → ESLint (vérification style de code)
  tsc --noEmit     → Vérification TypeScript sans compiler
  git status       → Voir les fichiers modifiés
  git log --oneline → Historique des commits`
      },
    ],
  },
  {
    num: "14", label: "Intégration du paiement en ligne — PayPal, CMI, Cash", color: "bg-green-600",
    steps: [
      {
        title: "Étape 1 — Les options de paiement au Maroc (état 2025)",
        desc: "Le marché marocain a des contraintes spécifiques : la majorité des clients préfèrent le paiement à la livraison. Voici toutes les options disponibles pour ajouter un vrai paiement en ligne.",
        code: `# OPTIONS DE PAIEMENT DISPONIBLES AU MAROC

┌─────────────────────────────────────────────────────────────────┐
│  OPTION             │ FACILE ?  │ INTERNATIONAL │ FRAIS         │
├─────────────────────────────────────────────────────────────────┤
│  PayPal             │ ✅ Facile │ ✅ Oui        │ ~3.4% + 0.35€ │
│  Stripe             │ ✅ Facile │ ✅ Oui        │ ~2.9% + 0.30€ │
│  CMI (Maroc)        │ ⚠️  Moyen  │ ❌ Non        │ Contrat banque│
│  HPS PowerCARD      │ ⚠️  Moyen  │ ❌ Non        │ Contrat banque│
│  Maroc Telecom Cash │ ⚠️  Moyen  │ ❌ Non        │ Variable      │
│  Cashplus / CIH     │ ⚠️  Moyen  │ ❌ Non        │ Variable      │
│  YouCan Pay (maroc) │ ✅ Facile │ ✅ Oui        │ ~2.5%         │
│  Virement bancaire  │ ✅ Facile │ ❌ Non        │ Gratuit       │
└─────────────────────────────────────────────────────────────────┘

RECOMMANDATION POUR L'ECOMAX :
  Phase 1 (maintenant) : Paiement à la livraison (déjà en place ✅)
  Phase 2 (prochain)   : PayPal ou YouCan Pay (le plus simple)
  Phase 3 (avancé)     : CMI pour les cartes Visa/Mastercard marocaines

NOTE IMPORTANTE :
  YouCan Pay est fait pour les e-commerces marocains.
  Ils fournissent une API simple + SDK React.
  Inscription : https://youcan.shop/pay
  Pas besoin de contrat bancaire, juste un KYC.`,
      },
      {
        title: "Étape 2 — Ajouter PayPal (le plus simple, international)",
        desc: "PayPal est le plus simple à intégrer. Déjà installé dans le projet via @paypal/react-paypal-js. Il suffit d'activer les bonnes variables d'environnement et de modifier le checkout.",
        code: `# PAYPAL — INTÉGRATION COMPLÈTE

# 1. Le package est déjà installé :
#    @paypal/react-paypal-js (dans package.json)

# 2. Variables d'environnement à ajouter :
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_SECRET_KEY=EKxxxxxxxxxxxxxxxxxxxxxxxxxx
# Obtenir sur : https://developer.paypal.com → My Apps & Credentials

# 3. Activer dans app/checkout/page.tsx :
# Remplacer le bloc "paiement à la livraison" par :

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Dans le composant checkout :
<PayPalScriptProvider options={{
  "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
  currency: "USD",  // PayPal Maroc → USD ou EUR
}}>
  <PayPalButtons
    style={{ layout: "vertical", color: "gold", shape: "rect" }}
    createOrder={async (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: total.toFixed(2),  // total en USD
          },
        }],
      });
    }}
    onApprove={async (data, actions) => {
      const details = await actions.order!.capture();
      // details.status === "COMPLETED"
      // → Appeler /api/orders avec payment_method: "paypal"
      // → Envoyer email de confirmation
      await createOrder({ payment_method: "paypal", paypal_id: details.id });
    }}
    onError={(err) => {
      console.error("PayPal error:", err);
      alert("Erreur PayPal. Veuillez réessayer.");
    }}
  />
</PayPalScriptProvider>

# 4. Modifier l'API /api/orders/route.ts :
# Ajouter "paypal" comme payment_method valide
# Stocker le paypal_transaction_id dans la commande

# 5. Test en mode SANDBOX :
# Utilisez les comptes sandbox PayPal Developer pour tester sans argent réel
# Email sandbox : sb-xxxxx@personal.example.com
# Mot de passe : trouvé dans Developer Dashboard → Sandbox Accounts`,
      },
      {
        title: "Étape 3 — Sécuriser les paiements avec des webhooks",
        desc: "Ne jamais faire confiance au client pour confirmer un paiement. Toujours vérifier côté serveur via webhook. C'est la règle d'or de la sécurité des paiements.",
        code: `# WEBHOOKS — SÉCURITÉ CRITIQUE

# Règle absolue : JAMAIS confirmer une commande depuis le client (frontend)
# Le client peut mentir sur le montant ou le statut.
# Toujours vérifier côté serveur via webhook.

# FLUX SÉCURISÉ :
┌──────────┐   1. Crée commande   ┌──────────────┐
│ Frontend │ ─────────────────→  │  /api/orders │
│          │                      │  status=PENDING
│          │   2. Lance paiement  │              │
│          │ ─────────────────→  │  PayPal/Stripe│
└──────────┘                      └──────────────┘
                                         │
                                  3. Webhook (côté serveur)
                                         │
                                  ┌──────────────┐
                                  │/api/webhooks/│
                                  │ paypal        │
                                  │ ↓             │
                                  │ Vérifie sig.  │
                                  │ Met à jour DB │
                                  │ Envoie email  │
                                  └──────────────┘

# EXEMPLE : app/api/webhooks/paypal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.text();
  
  // 1. Vérifier la signature PayPal (IMPORTANT)
  const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
  const isValid = await verifyPayPalWebhook(req.headers, body, webhookId);
  if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  
  const event = JSON.parse(body);
  
  // 2. Traiter selon le type d'événement
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId = event.resource.custom_id; // ton order_id Supabase
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 3. Mettre à jour le statut en base
    await supabase
      .from("orders")
      .update({ 
        status: "confirmed",
        payment_status: "paid",
        payment_id: event.resource.id
      })
      .eq("id", orderId);
      
    // 4. Envoyer email de confirmation
    await sendOrderConfirmationEmail(orderId);
  }
  
  return NextResponse.json({ received: true });
}

# Ajouter l'URL du webhook dans PayPal Developer :
# https://developer.paypal.com → My Apps → Webhooks
# URL : https://lecomax.com/api/webhooks/paypal`,
      },
      {
        title: "Étape 4 — CMI (Centre Monétique Interbancaire) — Cartes marocaines",
        desc: "CMI est le réseau bancaire marocain pour les paiements par carte Visa/Mastercard locale. Nécessite un contrat avec une banque marocaine. Plus complexe mais indispensable pour cibler les cartes marocaines.",
        code: `# CMI — PAIEMENT PAR CARTE MAROCAINE

# PRÉ-REQUIS :
# 1. Avoir un compte entreprise dans une banque marocaine (Attijariwafa, CIH, BMCE...)
# 2. Signer un contrat e-paiement avec la banque (délai : 2-4 semaines)
# 3. Recevoir les credentials CMI : merchantID, storeKey, storeType

# VARIABLES D'ENVIRONNEMENT :
CMI_CLIENT_ID=votre_merchant_id
CMI_STORE_KEY=votre_store_key_secret
CMI_BASE_URL=https://testpayment.cmi.co.ma  # test
# CMI_BASE_URL=https://payment.cmi.co.ma    # production

# FLUX DE PAIEMENT CMI :
# 1. Le client clique "Payer par carte"
# 2. Tu génères un hash sécurisé côté serveur
# 3. Tu redirigies vers la page CMI avec les paramètres
# 4. CMI traite le paiement
# 5. CMI redirige vers ton callbackUrl avec le résultat
# 6. Tu vérifies le hash de réponse (IMPORTANT)

# EXEMPLE : app/api/payment/cmi/route.ts
import crypto from "crypto";

export async function POST(req: Request) {
  const { orderId, amount, customerEmail } = await req.json();
  
  const params = {
    clientid: process.env.CMI_CLIENT_ID!,
    amount: amount.toFixed(2),
    currency: "504",  // 504 = MAD (Dirham marocain)
    oid: orderId,
    okUrl: \`https://lecomax.com/merci?order=\${orderId}\`,
    failUrl: \`https://lecomax.com/checkout?error=payment\`,
    callbackUrl: "https://lecomax.com/api/webhooks/cmi",
    email: customerEmail,
    encoding: "UTF-8",
    rnd: Date.now().toString(),
  };
  
  // Générer le hash (HMAC-SHA512)
  const hashStr = Object.keys(params)
    .sort()
    .map(k => params[k as keyof typeof params])
    .join("|") + "|" + process.env.CMI_STORE_KEY;
  
  const hash = crypto.createHash("sha512").update(hashStr).digest("hex");
  
  return Response.json({
    url: \`\${process.env.CMI_BASE_URL}/fim/est3Dgate\`,
    params: { ...params, hash },
  });
}

# DOCUMENTATION COMPLÈTE :
# https://www.cmi.co.ma/fr/solutions-e-commerce
# SDK Node.js communauté : npm install cmi-payment`,
      },
      {
        title: "Étape 5 — YouCan Pay (recommandé pour les startups marocaines)",
        desc: "YouCan Pay est la solution la plus simple pour les e-commerces marocains. Pas besoin de contrat bancaire, inscription en ligne, supporte les cartes marocaines ET internationales.",
        code: `# YOUCAN PAY — LA SOLUTION LA PLUS SIMPLE

# INSCRIPTION : https://youcan.shop/pay
# Documents requis : CIN ou Passeport + RIB ou IBAN

# INSTALLATION :
npm install youcan-pay

# VARIABLES D'ENVIRONNEMENT :
YOUCAN_PUB_KEY=pub_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
YOUCAN_SECRET_KEY=pri_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# EXEMPLE D'INTÉGRATION :
# app/api/payment/youcan/create/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { amount, orderId, customerEmail, customerPhone } = await req.json();
  
  const response = await fetch("https://pay.youcan.shop/api/tokenize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${process.env.YOUCAN_SECRET_KEY}\`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),  // en centimes
      currency: "MAD",
      order_id: orderId,
      customer_ip: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
      customer_name: customerEmail.split("@")[0],
      customer_email: customerEmail,
      customer_phone: customerPhone,
      success_url: \`https://lecomax.com/merci?order=\${orderId}\`,
      error_url: \`https://lecomax.com/checkout?error=1\`,
    }),
  });
  
  const data = await response.json();
  // data.token → utiliser pour afficher le formulaire de paiement YouCan
  return NextResponse.json({ token: data.token, url: data.url });
}

# FRONTEND : afficher le formulaire YouCan Pay
# (iframe sécurisé fourni par YouCan Pay)
<iframe
  src={\`https://pay.youcan.shop/api/checkout/\${token}\`}
  style={{ width: "100%", height: "600px", border: "none" }}
/>

# WEBHOOK YouCan Pay :
# app/api/webhooks/youcan/route.ts
# Vérifier la signature HMAC-SHA256 avec ton secret key
# Mettre à jour le statut de la commande en DB`,
      },
    ],
  },
  {
    num: "15", label: "Tests, débogage & monitoring — Rester pro en production", color: "bg-pink-600",
    steps: [
      {
        title: "Étape 1 — Tester localement avant chaque déploiement",
        desc: "La règle d'or : ne jamais pousser du code sur GitHub sans l'avoir testé localement avec npm run build. Un build réussi en local ne garantit pas un build réussi sur Vercel, mais ça élimine 90% des problèmes.",
        code: `# CHECKLIST AVANT CHAQUE GIT PUSH

# 1. Vérifier les erreurs TypeScript
npx tsc --noEmit
# → 0 erreur = bon signe

# 2. Vérifier le lint
npm run lint
# → Corrige tous les warnings avant de push

# 3. Tester le build de production EN LOCAL
npm run build
# → Si ça compile en local, ça compile sur Vercel (en général)
# ATTENTION : les erreurs de build Vercel coûtent du temps de déploiement

# 4. Tester en mode production local
npm run build && npm run start
# → http://localhost:3000 en mode production
# → Teste les API routes, les Server Components, etc.

# ERREURS COMMUNES ET SOLUTIONS :

# Erreur : "Cannot find module '@/...'"
# Solution : Vérifier tsconfig.json → paths → "@/*": ["./src/*"] ou ["./"]

# Erreur : "Module not found: ESM"
# Solution : Ajouter le module à transpilePackages dans next.config.js

# Erreur : "Dynamic server usage: headers()"
# Solution : Ajouter export const dynamic = "force-dynamic" dans la page

# Erreur : "NEXT_PUBLIC_ env var undefined en production"
# Solution : Ajouter la variable dans Vercel Dashboard → Environment Variables

# Erreur : hydration mismatch
# Solution : Vérifier que le rendu serveur = rendu client
# (éviter Date.now(), Math.random() dans le rendu initial)`,
      },
      {
        title: "Étape 2 — Déboguer les erreurs Vercel en production",
        desc: "Quand quelque chose fonctionne en local mais pas en production, il faut savoir où regarder. Vercel fournit des logs en temps réel dans le dashboard.",
        code: `# DÉBOGUER EN PRODUCTION VERCEL

# 1. Logs en temps réel :
#    Dashboard Vercel → ton projet → Logs → Real-time
#    Tu vois les console.error() de tes API routes

# 2. Erreurs de build :
#    Dashboard Vercel → Deployments → Deploy échoué → View Build Logs
#    Cherche les lignes rouges

# 3. Erreurs courantes en production :

# ERREUR : "Environment variable not set"
# → Ajouter dans Vercel Dashboard → Settings → Environment Variables
# → Redéployer après avoir ajouté (le déploiement actuel n'hérite pas)

# ERREUR : CORS en production mais pas en local
# → Dans next.config.js, ajouter les headers CORS :
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
        ],
      },
    ];
  },
};

# ERREUR : Timeout (Vercel free tier = 10s max)
# → Optimiser les requêtes DB (index Supabase, pagination)
# → Passer sur Vercel Pro pour 60s max

# ERREUR : Supabase RLS refuse les requêtes admin
# → Utiliser le service_role key (jamais exposé côté client)
# → Vérifier les policies dans Supabase → Authentication → Policies

# 4. Sentry — Monitoring d'erreurs en production (optionnel mais pro)
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
# → Configure automatiquement next.config.js
# → Capture toutes les erreurs + contexte utilisateur
# → Alertes email quand une nouvelle erreur apparaît`,
      },
      {
        title: "Étape 3 — Monitoring des performances (Core Web Vitals)",
        desc: "Google utilise les Core Web Vitals pour le classement SEO. Vercel Speed Insights mesure ces métriques sur tes vrais utilisateurs. Comprendre et améliorer ces scores = plus de trafic organique.",
        code: `# CORE WEB VITALS — COMPRENDRE ET AMÉLIORER

# Les 3 métriques qui comptent :
┌──────────────────────────────────────────────────────────────────┐
│  MÉTRIQUE │ NOM COMPLET              │ CIBLE      │ CE QUE C'EST│
├──────────────────────────────────────────────────────────────────┤
│  LCP      │ Largest Contentful Paint │ < 2.5s     │ Chargement  │
│  INP      │ Interaction to Next Paint│ < 200ms    │ Réactivité  │
│  CLS      │ Cumulative Layout Shift  │ < 0.1      │ Stabilité   │
└──────────────────────────────────────────────────────────────────┘

# DÉJÀ INTÉGRÉ dans ce projet :
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
# → Voir dans app/layout.tsx

# OPTIMISATIONS APPLIQUÉES DANS CE PROJET :

# 1. Images → Next.js <Image> avec priority sur les images above-the-fold
<Image src={product.image} alt={product.name} priority width={800} height={800} />

# 2. Fonts → next/font (préchargé, pas de flash de police)
import { Inter, Sora } from "next/font/google";

# 3. Lazy loading des composants lourds
const HeavyComponent = dynamic(() => import("@/components/HeavyComponent"), {
  loading: () => <div>Chargement…</div>,
});

# 4. Préchargement des routes importantes
<Link href="/boutique" prefetch={true}>Boutique</Link>

# 5. Mise en cache des API routes
export const revalidate = 60; // Revalide toutes les 60 secondes

# OUTIL DE TEST GRATUIT :
# https://pagespeed.web.dev/?url=https://lecomax.com
# → Lance un audit Lighthouse complet
# → Donne des recommandations précises`,
      },
      {
        title: "Étape 4 — Sauvegardes et récupération de données",
        desc: "Supabase fait des sauvegardes automatiques quotidiennes (plan gratuit = 7 jours). Mais pour une boutique en production, il faut avoir sa propre stratégie de sauvegarde.",
        code: `# STRATÉGIE DE SAUVEGARDE SUPABASE

# 1. Sauvegardes automatiques Supabase :
#    Plan Free : 1 sauvegarde / jour, rétention 7 jours
#    Plan Pro : sauvegardes continues (Point-in-time Recovery)
#    Dashboard → Settings → Backups

# 2. Export manuel via SQL Editor (à faire avant chaque grosse modification) :
-- Exporter les commandes
COPY (SELECT * FROM orders) TO '/tmp/orders_backup.csv' WITH CSV HEADER;

-- Exporter les produits
COPY (SELECT * FROM products) TO '/tmp/products_backup.csv' WITH CSV HEADER;

# 3. Script de sauvegarde automatisé (Cron Job Vercel) :
# app/api/backup/route.ts (protégé par CRON_SECRET)

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Exporter vers un fichier JSON dans Supabase Storage
  const { data: orders } = await supabase.from("orders").select("*");
  const backup = JSON.stringify({ orders, timestamp: new Date().toISOString() });
  
  await supabase.storage
    .from("backups")
    .upload(\`backup-\${Date.now()}.json\`, backup);
    
  return NextResponse.json({ success: true, count: orders?.length });
}

# Configurer le Cron Job dans vercel.json :
{
  "crons": [
    {
      "path": "/api/backup",
      "schedule": "0 2 * * *"  // Tous les jours à 2h du matin
    }
  ]
}`,
      },
    ],
  },
];

// ─── Phase + Step translations (EN / AR) ────────────────────────────────────
const PHASE_TR: Record<string, { en: string; ar: string }> = {
  "00": { en: "Before Coding — Set Up Your Environment", ar: "قبل البدء — إعداد البيئة" },
  "01": { en: "Project Initialization", ar: "تهيئة المشروع" },
  "02": { en: "Supabase — Database & Auth", ar: "Supabase — قاعدة البيانات والمصادقة" },
  "03": { en: "Install Dependencies", ar: "تثبيت الحزم" },
  "04": { en: "Build the Frontend", ar: "بناء الواجهة الأمامية" },
  "05": { en: "Admin Panel (30+ sections)", ar: "لوحة الإدارة (أكثر من 30 قسماً)" },
  "06": { en: "API Routes (40+ endpoints)", ar: "مسارات الـ API (أكثر من 40 نقطة)" },
  "07": { en: "GitHub → Vercel → Domain", ar: "GitHub → Vercel → النطاق" },
  "08": { en: "SEO, Performance & Security", ar: "السيو والأداء والأمان" },
  "09": { en: "Tools to Grow the Site", ar: "أدوات تنمية الموقع" },
  "10": { en: "Order Lifecycle — Cart to Delivery", ar: "دورة الطلب — من السلة إلى التوصيل" },
  "11": { en: "Key Components — How They Work", ar: "المكوّنات الرئيسية — كيف تعمل" },
  "12": { en: "Environment Variables — Complete Guide", ar: "متغيرات البيئة — الدليل الكامل" },
  "13": { en: "Real Data Flows — Complete Schema", ar: "تدفقات البيانات الحقيقية — المخطط الكامل" },
  "14": { en: "Payment Integration — PayPal, CMI, Cash", ar: "دمج الدفع — PayPal وCMI والدفع النقدي" },
  "15": { en: "Testing, Debugging & Monitoring", ar: "الاختبار والتصحيح والمراقبة" },
  "16": { en: "Daily Workflows — Add, Edit, Debug", ar: "سير العمل اليومي — إضافة وتعديل وتصحيح" },
};
// Step translations keyed by phaseNum → stepIndex
const STEP_TR: Record<string, Array<{ enTitle: string; enDesc: string; arTitle: string; arDesc: string }>> = {
  "00": [
    { enTitle: "Step 1 — Install Node.js (v20 LTS)", enDesc: "Node.js is the server-side JavaScript runtime. It includes npm (the package manager). Nothing works without it.", arTitle: "الخطوة 1 — تثبيت Node.js (v20 LTS)", arDesc: "Node.js هو محرك تشغيل JavaScript على الخادم. يتضمن npm (مدير الحزم). لا شيء يعمل بدونه." },
    { enTitle: "Step 2 — Install Git", enDesc: "Git is the version control system. It saves code history and connects to Vercel via GitHub for automatic deployments.", arTitle: "الخطوة 2 — تثبيت Git", arDesc: "Git هو نظام التحكم بالإصدارات. يحفظ تاريخ الكود ويتصل بـ Vercel عبر GitHub للنشر التلقائي." },
    { enTitle: "Step 3 — Install VS Code", enDesc: "Visual Studio Code is the code editor used for this entire project. Free, lightweight, and powerful with extensions.", arTitle: "الخطوة 3 — تثبيت VS Code", arDesc: "Visual Studio Code هو المحرر المستخدم في هذا المشروع بأكمله. مجاني وخفيف وقوي بالإضافات." },
    { enTitle: "Step 4 — Create the Project Folder", enDesc: "Create a clean folder to hold all the source code. The folder name becomes the project root.", arTitle: "الخطوة 4 — إنشاء مجلد المشروع", arDesc: "أنشئ مجلداً نظيفاً لاحتواء كود المصدر. اسم المجلد يصبح جذر المشروع." },
    { enTitle: "Step 5 — Open Folder in VS Code", enDesc: "VS Code must be opened on the project folder (not a single file). This activates all workspace features.", arTitle: "الخطوة 5 — فتح المجلد في VS Code", arDesc: "يجب فتح VS Code على مجلد المشروع (لا ملف واحد) لتفعيل جميع ميزات مساحة العمل." },
    { enTitle: "Step 6 — Open the Integrated Terminal", enDesc: "All commands (npm, git, etc.) run inside the VS Code terminal. Much more convenient than a separate terminal.", arTitle: "الخطوة 6 — فتح الطرفية المدمجة", arDesc: "جميع الأوامر (npm, git...) تُنفَّذ في طرفية VS Code. أسهل بكثير من طرفية منفصلة." },
    { enTitle: "Step 7 — Create GitHub Account", enDesc: "GitHub hosts the source code. Vercel connects to GitHub to automatically deploy on every git push.", arTitle: "الخطوة 7 — إنشاء حساب GitHub", arDesc: "GitHub يستضيف كود المصدر. يتصل Vercel بـ GitHub للنشر التلقائي عند كل git push." },
  ],
  "01": [
    { enTitle: "Bootstrap Next.js App", enDesc: "Create the project with App Router, TypeScript, Tailwind CSS, and the @/* alias.", arTitle: "إنشاء تطبيق Next.js", arDesc: "إنشاء المشروع مع App Router وTypeScript وTailwind CSS والاسم المستعار @/*." },
    { enTitle: "tsconfig.json — Strict Mode + @/* Alias", enDesc: "strict:true catches bugs at compile time. @/* alias avoids deeply nested relative imports.", arTitle: "tsconfig.json — الوضع الصارم + الاسم المستعار", arDesc: "strict:true يمسك الأخطاء عند التجميع. الاسم المستعار @/* يتجنب المسارات النسبية العميقة." },
    { enTitle: "tailwind.config.js — Design System", enDesc: "Defines brand colors (green #16b277), fonts (Inter + Sora), custom shadows, and transitions.", arTitle: "tailwind.config.js — نظام التصميم", arDesc: "يحدد ألوان العلامة التجارية والخطوط والظلال والانتقالات المخصصة." },
  ],
  "02": [
    { enTitle: "Create a Supabase Project", enDesc: "Supabase provides PostgreSQL + Auth + Storage + auto-generated REST API. Free up to 500 MB.", arTitle: "إنشاء مشروع Supabase", arDesc: "Supabase يوفر PostgreSQL ومصادقة وتخزيناً وAPI تلقائية. مجاني حتى 500 ميجابايت." },
    { enTitle: "Tables Created in Supabase (SQL Editor)", enDesc: "Each table corresponds to an admin panel section. TS types defined in lib/supabase.ts.", arTitle: "الجداول المنشأة في Supabase", arDesc: "كل جدول يقابل قسماً في لوحة الإدارة. الأنواع TypeScript محددة في lib/supabase.ts." },
    { enTitle: "Supabase Client (lib/supabase.ts)", enDesc: "One shared client. lib/db-server.ts uses the service_role key for admin API routes.", arTitle: "عميل Supabase (lib/supabase.ts)", arDesc: "عميل مشترك واحد. lib/db-server.ts يستخدم مفتاح service_role لمسارات API الإدارية." },
  ],
  "03": [
    { enTitle: "npm install — All Dependencies", enDesc: "No UI framework (shadcn, chakra, MUI) — everything is built with pure Tailwind CSS.", arTitle: "npm install — جميع الحزم", arDesc: "لا يوجد إطار UI (shadcn أو chakra) — كل شيء مبني بـ Tailwind CSS خالص." },
  ],
  "04": [
    { enTitle: "Root Layout (app/layout.tsx)", enDesc: "Loads Google fonts, defines SEO metadata, and wraps the app with all providers.", arTitle: "التصميم الجذري (app/layout.tsx)", arDesc: "يحمّل خطوط Google ويحدد بيانات SEO ويلفّ التطبيق بجميع الـ providers." },
    { enTitle: "Cart — CartContext.tsx (localStorage)", enDesc: "The cart lives in the browser. No account required. Instant and available offline.", arTitle: "السلة — CartContext.tsx (localStorage)", arDesc: "السلة تعيش في المتصفح. لا يلزم حساب. فورية ومتاحة بدون إنترنت." },
    { enTitle: "Dynamic Routes (App Router)", enDesc: "Folders in brackets create dynamic routes. Middleware protects /admin/*.", arTitle: "المسارات الديناميكية (App Router)", arDesc: "المجلدات بين أقواس تنشئ مسارات ديناميكية. الـ middleware يحمي /admin/*." },
  ],
  "05": [
    { enTitle: "Admin Authentication", enDesc: "Double protection: Supabase Auth + admin_session cookie verified by middleware.ts on every request.", arTitle: "مصادقة الإدارة", arDesc: "حماية مزدوجة: Supabase Auth + كوكي admin_session يتحقق منها middleware.ts في كل طلب." },
    { enTitle: "All Admin Sections", enDesc: "Each section = one folder in app/admin/ + its API routes in app/api/.", arTitle: "جميع أقسام الإدارة", arDesc: "كل قسم = مجلد في app/admin/ + مسارات API في app/api/." },
  ],
  "06": [
    { enTitle: "Standard API Route Pattern", enDesc: "All write routes verify admin session. Public reads are open.", arTitle: "نمط مسار API القياسي", arDesc: "جميع مسارات الكتابة تتحقق من جلسة الإدارة. القراءات العامة مفتوحة." },
    { enTitle: "All Available API Routes", enDesc: "40+ endpoints covering everything on the site.", arTitle: "جميع مسارات API المتاحة", arDesc: "أكثر من 40 نقطة نهاية تغطي كل وظائف الموقع." },
  ],
  "07": [
    { enTitle: "Create the GitHub Repository", enDesc: ".gitignore is CRITICAL — .env files must NEVER be committed.", arTitle: "إنشاء مستودع GitHub", arDesc: ".gitignore ضروري جداً — ملفات .env يجب ألا تُرفع أبداً." },
    { enTitle: "Deploy on Vercel", enDesc: "Vercel auto-detects Next.js and deploys on every git push to main.", arTitle: "النشر على Vercel", arDesc: "Vercel يكتشف Next.js تلقائياً وينشر عند كل git push إلى main." },
    { enTitle: "Connect lecomax.com via Namecheap", enDesc: "Namecheap is the domain registrar. DNS config takes 5 min, propagation 24-48h. Vercel auto-generates SSL.", arTitle: "ربط lecomax.com عبر Namecheap", arDesc: "Namecheap هو مسجّل النطاق. إعداد DNS يستغرق 5 دقائق، النشر 24-48 ساعة. Vercel يولد SSL تلقائياً." },
  ],
  "08": [
    { enTitle: "Optimized Images (next.config.js)", enDesc: "Next.js auto-converts to AVIF/WebP, resizes by screen, and caches 1 year on CDN.", arTitle: "صور محسّنة (next.config.js)", arDesc: "Next.js يحوّل تلقائياً إلى AVIF/WebP ويغيّر الحجم حسب الشاشة ويخزّن سنة على CDN." },
    { enTitle: "SEO — Metadata + Dynamic Sitemap", enDesc: "Each page has server-generated metadata. The sitemap lists all products from Supabase.", arTitle: "السيو — البيانات الوصفية + خريطة الموقع الديناميكية", arDesc: "كل صفحة لها بيانات وصفية مولّدة من الخادم. خريطة الموقع تسرد جميع المنتجات من Supabase." },
    { enTitle: "Middleware — Maintenance Mode + Security", enDesc: "middleware.ts runs at the Edge on every request, managing maintenance, protecting /admin, and securing writes.", arTitle: "الـ Middleware — وضع الصيانة والأمان", arDesc: "middleware.ts يعمل على Edge في كل طلب: يدير الصيانة ويحمي /admin ويؤمّن الكتابة." },
  ],
  "09": [
    { enTitle: "Resend — Transactional Emails & Newsletters", enDesc: "Resend handles ALL site emails: order confirmation, shipping updates, marketing newsletters.", arTitle: "Resend — رسائل المعاملات والنشرات البريدية", arDesc: "Resend يتعامل مع جميع رسائل الموقع: تأكيد الطلب وتحديثات الشحن والنشرات التسويقية." },
    { enTitle: "Web Push Notifications (web-push + VAPID)", enDesc: "Push notifications let you re-engage visitors even when the site isn't open. Perfect for flash sales.", arTitle: "إشعارات الدفع (web-push + VAPID)", arDesc: "الإشعارات تتيح التواصل مع الزوار حتى عندما لا يكون الموقع مفتوحاً. مثالية للتخفيضات السريعة." },
    { enTitle: "WhatsApp Business API (via whapi.cloud)", enDesc: "WhatsApp is the #1 communication channel in Morocco. Used for client chat, confirmations, and broadcasts.", arTitle: "واجهة WhatsApp للأعمال (عبر whapi.cloud)", arDesc: "واتساب هو قناة التواصل الأولى في المغرب. يُستخدم للدردشة وتأكيد الطلبات والبث التسويقي." },
    { enTitle: "Google Search Console + IndexNow (SEO)", enDesc: "Search Console monitors site indexing. IndexNow instantly notifies Bing and Yandex when a product is created.", arTitle: "Google Search Console + IndexNow (السيو)", arDesc: "Search Console يراقب فهرسة الموقع. IndexNow يُخطر Bing وYandex فوراً عند إنشاء منتج." },
    { enTitle: "Vercel Analytics + Speed Insights (Performance)", enDesc: "Cookie-free analytics (GDPR compliant). Speed Insights measures real Core Web Vitals from real users.", arTitle: "Vercel Analytics + Speed Insights (الأداء)", arDesc: "تحليلات بدون كوكيز (متوافقة مع GDPR). Speed Insights يقيس Core Web Vitals الحقيقية من المستخدمين." },
    { enTitle: "OpenAI — Integrated AI", enDesc: "AI is used in 5 admin sections to accelerate store management. Requires an OpenAI account and API key.", arTitle: "OpenAI — الذكاء الاصطناعي المدمج", arDesc: "يُستخدم الذكاء الاصطناعي في 5 أقسام إدارية لتسريع إدارة المتجر. يحتاج حساب OpenAI." },
    { enTitle: "PayPal — International Online Payment", enDesc: "PayPal complements cash on delivery (COD). Lets customers pay with PayPal or international credit card.", arTitle: "PayPal — الدفع الإلكتروني الدولي", arDesc: "PayPal يكمل الدفع عند الاستلام. يتيح للعملاء الدفع بحساب PayPal أو بطاقة دولية." },
  ],
  "10": [
    { enTitle: "Step 1 — Customer Adds to Cart", enDesc: "CartContext.tsx intercepts the click. It checks if the product (same slug, size, color) already exists and increments quantity, or adds a new item. State is immediately saved to localStorage.", arTitle: "الخطوة 1 — العميل يضيف للسلة", arDesc: "CartContext.tsx يعترض النقر. يتحقق من وجود المنتج (نفس المعرف والمقاس واللون) ويزيد الكمية، أو يضيف عنصراً جديداً. الحالة تُحفظ فوراً في localStorage." },
    { enTitle: "Step 2 — Cart & Checkout Pages", enDesc: "The cart page reads CartContext (loaded from localStorage). The checkout page collects the delivery address and payment method.", arTitle: "الخطوة 2 — صفحة السلة والدفع", arDesc: "صفحة السلة تقرأ CartContext (من localStorage). صفحة الدفع تجمع عنوان التوصيل وطريقة الدفع." },
    { enTitle: "Step 3 — POST /api/orders → Supabase", enDesc: "When the customer clicks 'Order', the frontend sends a POST to /api/orders. The API generates a unique order number, saves to Supabase, then triggers the confirmation email.", arTitle: "الخطوة 3 — POST /api/orders → Supabase", arDesc: "عندما ينقر العميل 'اطلب'، يرسل الـ frontend طلب POST إلى /api/orders. تولّد الـ API رقم طلب فريد وتحفظه في Supabase ثم ترسل البريد التأكيدي." },
    { enTitle: "Step 4 — Confirmation Email via Resend", enDesc: "The /api/send-confirmation API receives order data and sends a personalized HTML email to the customer AND an admin notification.", arTitle: "الخطوة 4 — بريد التأكيد عبر Resend", arDesc: "تتلقى /api/send-confirmation بيانات الطلب وترسل بريداً HTML مخصصاً للعميل وإشعاراً للمشرف." },
    { enTitle: "Step 5 — Admin Sees Order in /admin/orders", enDesc: "The admin dashboard shows new orders in real-time via polling every 60 seconds. The admin can change status, add tracking number, and print.", arTitle: "الخطوة 5 — المشرف يرى الطلب في /admin/orders", arDesc: "لوحة الإدارة تعرض الطلبات الجديدة في الوقت الفعلي عبر استطلاع كل 60 ثانية." },
    { enTitle: "Step 6 — Status Update → Email to Customer", enDesc: "When the admin changes order status to 'shipped', an email is automatically sent to the customer with the tracking number.", arTitle: "الخطوة 6 — تحديث الحالة → بريد للعميل", arDesc: "عندما يغيّر المشرف الحالة إلى 'مشحون'، يُرسَل بريد تلقائي للعميل مع رقم التتبع." },
  ],
  "11": [
    { enTitle: "Header.tsx — Main Navigation + Cart", enDesc: "The Header is loaded once in app/layout.tsx and stays in memory throughout navigation. AdminLayoutWrapper hides it on /admin.", arTitle: "Header.tsx — التنقل الرئيسي + السلة", arDesc: "الـ Header يُحمَّل مرة واحدة في app/layout.tsx ويبقى في الذاكرة. AdminLayoutWrapper يخفيه في /admin." },
    { enTitle: "AnnouncementBar.tsx — Live Text from Supabase", enDesc: "The announcement bar reads its content from the Supabase settings table. The admin can modify it from /admin/settings without redeployment.", arTitle: "AnnouncementBar.tsx — نص مباشر من Supabase", arDesc: "شريط الإعلانات يقرأ محتواه من جدول settings في Supabase. المشرف يعدّله من /admin/settings بدون إعادة نشر." },
    { enTitle: "HeroBanner.tsx — Auto Slides from Supabase", enDesc: "The home page hero displays configurable slides from the admin. Each slide has an image, title, subtitle, and CTA button.", arTitle: "HeroBanner.tsx — شرائح تلقائية من Supabase", arDesc: "بطل الصفحة الرئيسية يعرض شرائح قابلة للتهيئة من الإدارة. كل شريحة لها صورة وعنوان وزر CTA." },
    { enTitle: "ProductCard.tsx — Compact Product Card", enDesc: "Used everywhere on the site. Shows the main image, price, available colors, and add-to-cart button. Image changes on hover.", arTitle: "ProductCard.tsx — بطاقة المنتج المدمجة", arDesc: "تُستخدم في كل مكان. تعرض الصورة الرئيسية والسعر والألوان المتاحة وزر الإضافة للسلة." },
    { enTitle: "middleware.ts — Guardian of All Routes", enDesc: "Runs at the Edge (Vercel Edge Runtime) BEFORE requests reach the Next.js server. Manages maintenance, admin protection, and API security.", arTitle: "middleware.ts — حارس جميع المسارات", arDesc: "يعمل على Edge قبل أن تصل الطلبات لخادم Next.js. يدير الصيانة وحماية الإدارة وأمان الـ API." },
    { enTitle: "AdminLayoutWrapper.tsx — Hide Header/Footer on /admin", enDesc: "This client component reads the current pathname. If it starts with /admin, it returns null (erases its children). Used to hide Header, Footer, CookieBanner on all admin pages.", arTitle: "AdminLayoutWrapper.tsx — إخفاء Header/Footer في /admin", arDesc: "مكوّن عميل يقرأ المسار الحالي. إذا بدأ بـ /admin يعيد null (يمحو أبناءه). يُستخدم لإخفاء Header وFooter في صفحات الإدارة." },
    { enTitle: "CookieBanner.tsx — GDPR Consent", enDesc: "Shown on first visit. Records consent in localStorage AND Supabase (cookie_consents table) for GDPR traceability. Hidden on /admin via AdminLayoutWrapper.", arTitle: "CookieBanner.tsx — موافقة RGPD", arDesc: "تُعرض في أول زيارة. تسجّل الموافقة في localStorage وSupabase لامتثال RGPD. مخفية في /admin." },
  ],
  "12": [
    { enTitle: "What is .env.local?", enDesc: ".env.local is a text file at the project root that stores secret keys. It is NEVER sent to GitHub (.gitignore excludes it). On Vercel in production, variables are configured in the Dashboard.", arTitle: "ما هو .env.local؟", arDesc: ".env.local ملف نصي في جذر المشروع يخزّن المفاتيح السرية. لا يُرسَل أبداً إلى GitHub (.gitignore يستبعده)." },
    { enTitle: "All Variables — Service by Service", enDesc: "Every environment variable used in the project, with its source service, role, and whether it's required or optional.", arTitle: "جميع المتغيرات — خدمة بخدمة", arDesc: "كل متغير بيئي في المشروع مع خدمته المصدرية ودوره وما إذا كان مطلوباً أو اختيارياً." },
    { enTitle: "How to Create .env.local from Scratch", enDesc: "Complete procedure for configuring all environment variables on a new workstation. Ideal when switching computers or reinstalling the project.", arTitle: "كيفية إنشاء .env.local من الصفر", arDesc: "الإجراء الكامل لتهيئة جميع متغيرات البيئة على جهاز جديد. مثالي عند تغيير الكمبيوتر أو إعادة تثبيت المشروع." },
    { enTitle: "How Vercel Reads Environment Variables", enDesc: "In production, variables are stored in the Vercel dashboard, not in files. They are injected at build time and runtime. Each variable can have different values per environment.", arTitle: "كيف يقرأ Vercel متغيرات البيئة", arDesc: "في الإنتاج، المتغيرات مخزّنة في لوحة Vercel وليس في ملفات. تُحقن عند وقت البناء والتشغيل." },
    { enTitle: "Debugging the Most Common API Errors", enDesc: "The most common errors during development are related to environment variables, Supabase authentication, or route permissions. Here's how to diagnose and fix them quickly.", arTitle: "تشخيص أكثر أخطاء الـ API شيوعاً", arDesc: "أكثر الأخطاء شيوعاً تتعلق بمتغيرات البيئة ومصادقة Supabase أو صلاحيات المسارات." },
  ],
  "13": [
    { enTitle: "Schema: How a Product Appears on the Site", enDesc: "From creation in /admin/products to display in the store, every technical step in the product lifecycle.", arTitle: "مخطط: كيف يظهر المنتج على الموقع", arDesc: "من الإنشاء في /admin/products إلى العرض في المتجر، كل خطوة تقنية في دورة حياة المنتج." },
    { enTitle: "Schema: Complete Network Architecture", enDesc: "How traffic flows from the visitor's browser to databases, through Vercel CDN and third-party services.", arTitle: "مخطط: البنية الشبكية الكاملة", arDesc: "كيف يتدفق الزيارات من متصفح الزائر إلى قواعد البيانات عبر CDN Vercel والخدمات الخارجية." },
    { enTitle: "Schema: How GitHub, Vercel & Code Synchronize", enDesc: "Every Git push triggers an automatic deployment. Vercel downloads the code, installs dependencies, compiles TypeScript, builds, and pushes to the CDN — all in under 2 minutes.", arTitle: "مخطط: كيف يتزامن GitHub وVercel والكود", arDesc: "كل git push يشغّل نشراً تلقائياً. Vercel يحمّل الكود ويثبّت الحزم ويجمع TypeScript ويدفع للـ CDN خلال دقيقتين." },
  ],
};

// ─── All Pages Data ──────────────────────────────────────────────────────────
type PageEntry = {
  route: string;
  file: string;
  type: "public" | "admin" | "api";
  fr: { desc: string; feat: string[] };
  en: { desc: string; feat: string[] };
  ar: { desc: string; feat: string[] };
};

const SITE_PAGES: PageEntry[] = [
  {
    route: "/", file: "app/page.tsx", type: "public",
    fr: { desc: "Page d'accueil — Hero banner, catégories, produits vedettes, témoignages, newsletter", feat: ["HeroBanner animé","Tuiles catégories","Grille produits vedettes","Section témoignages","Formulaire newsletter"] },
    en: { desc: "Home page — Hero banner, categories, featured products, testimonials, newsletter", feat: ["Animated HeroBanner","Category tiles","Featured products grid","Testimonials section","Newsletter form"] },
    ar: { desc: "الصفحة الرئيسية — بانر رئيسي، فئات، منتجات مميزة، آراء، نشرة بريدية", feat: ["بانر رئيسي متحرك","بلاط الفئات","شبكة المنتجات المميزة","قسم الآراء","نموذج النشرة البريدية"] },
  },
  {
    route: "/[category]", file: "app/[category]/page.tsx", type: "public",
    fr: { desc: "Pages catégories dynamiques — chaussures, homme, femme, accessoires, tech, sport", feat: ["Grille produits filtrée","Filtres (taille, couleur, prix)","Tri (nouveau, prix, populaire)","Pagination","SEO par catégorie"] },
    en: { desc: "Dynamic category pages — shoes, men, women, accessories, tech, sport", feat: ["Filtered product grid","Filters (size, color, price)","Sorting (new, price, popular)","Pagination","Category-level SEO"] },
    ar: { desc: "صفحات الفئات الديناميكية — أحذية، رجال، نساء، إكسسوارات، تقنية، رياضة", feat: ["شبكة منتجات مفلترة","فلاتر (مقاس، لون، سعر)","الترتيب (جديد، سعر، شعبية)","الترقيم","سيو لكل فئة"] },
  },
  {
    route: "/produit/[slug]", file: "app/produit/[slug]/page.tsx", type: "public",
    fr: { desc: "Fiche produit détaillée avec galerie, variantes couleur/taille, panier", feat: ["Galerie images scrollable","Sélecteur couleur/taille","Add to cart (CartContext)","Avis clients","Partage réseaux sociaux","Métadonnées SEO dynamiques"] },
    en: { desc: "Detailed product page with gallery, color/size variants, cart", feat: ["Scrollable image gallery","Color/size selector","Add to cart (CartContext)","Customer reviews","Social sharing","Dynamic SEO metadata"] },
    ar: { desc: "صفحة منتج مفصّلة مع معرض صور ومتغيرات اللون/المقاس والسلة", feat: ["معرض صور قابل للتمرير","اختيار اللون/المقاس","إضافة للسلة (CartContext)","آراء العملاء","مشاركة اجتماعية","بيانات سيو ديناميكية"] },
  },
  {
    route: "/boutique", file: "app/boutique/page.tsx", type: "public",
    fr: { desc: "Vitrine complète — tous les produits avec filtres avancés", feat: ["Tous les produits","Filtres combinés","Tri personnalisé","Vue grille/liste"] },
    en: { desc: "Full storefront — all products with advanced filters", feat: ["All products","Combined filters","Custom sorting","Grid/list view"] },
    ar: { desc: "واجهة المتجر الكاملة — جميع المنتجات مع فلاتر متقدمة", feat: ["جميع المنتجات","فلاتر مدمجة","ترتيب مخصص","عرض شبكة/قائمة"] },
  },
  {
    route: "/panier", file: "app/panier/page.tsx", type: "public",
    fr: { desc: "Panier d'achat — résumé articles, quantités, sous-total, coupon", feat: ["Articles CartContext","Modifier quantités","Supprimer articles","Champ coupon","Sous-total calculé","Bouton checkout"] },
    en: { desc: "Shopping cart — item summary, quantities, subtotal, coupon", feat: ["CartContext items","Edit quantities","Remove items","Coupon field","Calculated subtotal","Checkout button"] },
    ar: { desc: "سلة التسوق — ملخص المنتجات والكميات والمجموع الفرعي والكوبون", feat: ["منتجات CartContext","تعديل الكميات","إزالة المنتجات","حقل الكوبون","مجموع فرعي محسوب","زر الدفع"] },
  },
  {
    route: "/checkout", file: "app/checkout/page.tsx", type: "public",
    fr: { desc: "Page de paiement — formulaire adresse, méthode de paiement PayPal/COD", feat: ["Formulaire livraison","Validation données","PayPal intégré","Paiement à la livraison","POST /api/orders","Redirect /merci"] },
    en: { desc: "Checkout page — address form, PayPal/COD payment method", feat: ["Delivery form","Data validation","PayPal integrated","Cash on delivery","POST /api/orders","Redirect /merci"] },
    ar: { desc: "صفحة الدفع — نموذج العنوان وطريقة الدفع PayPal/الاستلام", feat: ["نموذج التوصيل","التحقق من البيانات","PayPal مدمج","الدفع عند الاستلام","POST /api/orders","توجيه /merci"] },
  },
  {
    route: "/merci", file: "app/merci/page.tsx", type: "public",
    fr: { desc: "Page de confirmation après commande — numéro de commande, instructions", feat: ["Numéro de commande affiché","CartContext.clear()","Instructions livraison","Lien suivi commande"] },
    en: { desc: "Order confirmation page — order number, instructions", feat: ["Order number displayed","CartContext.clear()","Delivery instructions","Order tracking link"] },
    ar: { desc: "صفحة تأكيد الطلب — رقم الطلب والتعليمات", feat: ["عرض رقم الطلب","CartContext.clear()","تعليمات التوصيل","رابط تتبع الطلب"] },
  },
  {
    route: "/connexion", file: "app/connexion/page.tsx", type: "public",
    fr: { desc: "Page de connexion client via Supabase Auth", feat: ["Email + mot de passe","Supabase Auth","Session persistante","Redirect post-login"] },
    en: { desc: "Customer login page via Supabase Auth", feat: ["Email + password","Supabase Auth","Persistent session","Post-login redirect"] },
    ar: { desc: "صفحة تسجيل الدخول عبر Supabase Auth", feat: ["البريد + كلمة المرور","Supabase Auth","جلسة دائمة","توجيه بعد الدخول"] },
  },
  {
    route: "/inscription", file: "app/inscription/page.tsx", type: "public",
    fr: { desc: "Page d'inscription nouveaux clients", feat: ["Formulaire création compte","Supabase Auth signUp","Vérification email","Redirect vers compte"] },
    en: { desc: "New customer registration page", feat: ["Account creation form","Supabase Auth signUp","Email verification","Redirect to account"] },
    ar: { desc: "صفحة تسجيل العملاء الجدد", feat: ["نموذج إنشاء الحساب","Supabase Auth signUp","التحقق من البريد","توجيه للحساب"] },
  },
  {
    route: "/compte", file: "app/compte/page.tsx", type: "public",
    fr: { desc: "Espace client — historique commandes, données personnelles, fidélité", feat: ["Historique commandes","Données personnelles","Points fidélité ecoClub","Supabase Auth session"] },
    en: { desc: "Customer account — order history, personal data, loyalty", feat: ["Order history","Personal data","ecoClub loyalty points","Supabase Auth session"] },
    ar: { desc: "حساب العميل — تاريخ الطلبات والبيانات الشخصية والولاء", feat: ["تاريخ الطلبات","البيانات الشخصية","نقاط الولاء ecoClub","جلسة Supabase Auth"] },
  },
  {
    route: "/suivre-commande", file: "app/suivre-commande/page.tsx", type: "public",
    fr: { desc: "Suivi de commande public — numéro commande + téléphone", feat: ["Recherche par numéro","GET /api/tracking","Statuts visibles","Aucun compte requis"] },
    en: { desc: "Public order tracking — order number + phone", feat: ["Search by number","GET /api/tracking","Visible statuses","No account required"] },
    ar: { desc: "تتبع الطلبات العام — رقم الطلب + الهاتف", feat: ["البحث برقم الطلب","GET /api/tracking","عرض الحالات","لا يلزم حساب"] },
  },
  {
    route: "/bestsellers", file: "app/bestsellers/page.tsx", type: "public",
    fr: { desc: "Page meilleures ventes — produits triés par popularité", feat: ["Produits top ventes","Tri par ventes","SEO optimisé"] },
    en: { desc: "Bestsellers page — products sorted by popularity", feat: ["Top selling products","Sorted by sales","SEO optimized"] },
    ar: { desc: "صفحة الأكثر مبيعاً — منتجات مرتبة حسب الشعبية", feat: ["المنتجات الأكثر مبيعاً","ترتيب حسب المبيعات","سيو محسّن"] },
  },
  {
    route: "/nouveautes", file: "app/nouveautes/page.tsx", type: "public",
    fr: { desc: "Nouvelles arrivées — produits récemment ajoutés", feat: ["Produits récents","Triés par date","Filtres disponibles"] },
    en: { desc: "New arrivals — recently added products", feat: ["Recent products","Sorted by date","Filters available"] },
    ar: { desc: "المنتجات الجديدة — المنتجات المضافة حديثاً", feat: ["منتجات حديثة","مرتبة بالتاريخ","فلاتر متاحة"] },
  },
  {
    route: "/promotions", file: "app/promotions/page.tsx", type: "public",
    fr: { desc: "Page promotions — produits en réduction et ventes flash", feat: ["Produits en promo","Compte à rebours","Prix barré/actuel","Codes promo"] },
    en: { desc: "Promotions page — discounted products and flash sales", feat: ["Promo products","Countdown timer","Crossed/current price","Promo codes"] },
    ar: { desc: "صفحة التخفيضات — منتجات بخصم وتخفيضات مؤقتة", feat: ["منتجات بخصم","عداد تنازلي","السعر الأصلي/الحالي","أكواد الخصم"] },
  },
  {
    route: "/ecoclub", file: "app/ecoclub/page.tsx", type: "public",
    fr: { desc: "Programme de fidélité ecoClub — niveaux, points, avantages", feat: ["Niveaux fidélité","Calcul de points","Avantages par palier","Inscription programme"] },
    en: { desc: "ecoClub loyalty program — tiers, points, benefits", feat: ["Loyalty tiers","Points calculation","Tier benefits","Program sign-up"] },
    ar: { desc: "برنامج الولاء ecoClub — المستويات والنقاط والمزايا", feat: ["مستويات الولاء","حساب النقاط","مزايا كل مستوى","التسجيل في البرنامج"] },
  },
  {
    route: "/boutiques", file: "app/boutiques/page.tsx", type: "public",
    fr: { desc: "Boutiques physiques — carte et adresses des points de vente", feat: ["Carte interactive","Adresses magasins","Horaires d'ouverture","Contact chaque boutique"] },
    en: { desc: "Physical stores — map and addresses of sales points", feat: ["Interactive map","Store addresses","Opening hours","Contact each store"] },
    ar: { desc: "المتاجر الفعلية — خريطة وعناوين نقاط البيع", feat: ["خريطة تفاعلية","عناوين المتاجر","ساعات العمل","التواصل مع كل متجر"] },
  },
  {
    route: "/a-propos", file: "app/a-propos/page.tsx", type: "public",
    fr: { desc: "À propos — histoire de la marque, valeurs, équipe", feat: ["Histoire L'ecomax","Valeurs & mission","Présentation équipe","Partenaires"] },
    en: { desc: "About — brand story, values, team", feat: ["L'ecomax story","Values & mission","Team presentation","Partners"] },
    ar: { desc: "عن الشركة — قصة العلامة والقيم والفريق", feat: ["قصة L'ecomax","القيم والمهمة","تقديم الفريق","الشركاء"] },
  },
  {
    route: "/nous-contacter", file: "app/nous-contacter/page.tsx", type: "public",
    fr: { desc: "Formulaire de contact — EmailJS + numéro WhatsApp", feat: ["Formulaire EmailJS","WhatsApp direct","Localisation boutique","Temps de réponse"] },
    en: { desc: "Contact form — EmailJS + WhatsApp number", feat: ["EmailJS form","Direct WhatsApp","Store location","Response time"] },
    ar: { desc: "نموذج التواصل — EmailJS + رقم واتساب", feat: ["نموذج EmailJS","واتساب مباشر","موقع المتجر","وقت الرد"] },
  },
  {
    route: "/aide", file: "app/aide/page.tsx", type: "public",
    fr: { desc: "Centre d'aide — FAQ, guides, politiques", feat: ["FAQ accordion","Guide achat","Politique retour","Livraison info"] },
    en: { desc: "Help center — FAQ, guides, policies", feat: ["FAQ accordion","Purchase guide","Return policy","Shipping info"] },
    ar: { desc: "مركز المساعدة — الأسئلة الشائعة والأدلة والسياسات", feat: ["أسئلة شائعة accordion","دليل الشراء","سياسة الإرجاع","معلومات التوصيل"] },
  },
  {
    route: "/carrieres", file: "app/carrieres/page.tsx", type: "public",
    fr: { desc: "Page carrières — offres d'emploi et formulaire de candidature", feat: ["Liste offres d'emploi","Formulaire candidature","JobApplyButton component","Email automatique"] },
    en: { desc: "Careers page — job offers and application form", feat: ["Job listings","Application form","JobApplyButton component","Automatic email"] },
    ar: { desc: "صفحة الوظائف — عروض العمل ونموذج التقدم", feat: ["قائمة الوظائف","نموذج التقدم","مكوّن JobApplyButton","بريد تلقائي"] },
  },
  {
    route: "/guide-des-tailles", file: "app/guide-des-tailles/page.tsx", type: "public",
    fr: { desc: "Guide des tailles — tableaux par catégorie (chaussures, vêtements)", feat: ["Tableaux tailles hommes/femmes","Conversion EU/UK/US","Images mesures","SizeGuideModal"] },
    en: { desc: "Size guide — tables by category (shoes, clothing)", feat: ["Men/women size tables","EU/UK/US conversion","Measurement images","SizeGuideModal"] },
    ar: { desc: "دليل المقاسات — جداول حسب الفئة (أحذية، ملابس)", feat: ["جداول مقاسات رجال/نساء","تحويل EU/UK/US","صور القياسات","SizeGuideModal"] },
  },
  {
    route: "/retours", file: "app/retours/page.tsx", type: "public",
    fr: { desc: "Politique de retour — demande de retour produit", feat: ["Formulaire retour","GET /api/returns","Suivi retour","Conditions retour"] },
    en: { desc: "Returns policy — product return request", feat: ["Return form","GET /api/returns","Return tracking","Return conditions"] },
    ar: { desc: "سياسة الإرجاع — طلب إرجاع المنتج", feat: ["نموذج الإرجاع","GET /api/returns","تتبع الإرجاع","شروط الإرجاع"] },
  },
  {
    route: "/facture", file: "app/facture/page.tsx", type: "public",
    fr: { desc: "Facture client — PDF téléchargeable par numéro de commande", feat: ["Recherche par commande","Génération PDF","Impression facture","Logo L'ecomax"] },
    en: { desc: "Customer invoice — downloadable PDF by order number", feat: ["Order-based search","PDF generation","Invoice printing","L'ecomax logo"] },
    ar: { desc: "فاتورة العميل — PDF قابل للتحميل برقم الطلب", feat: ["البحث برقم الطلب","توليد PDF","طباعة الفاتورة","شعار L'ecomax"] },
  },
  {
    route: "/maintenance", file: "app/maintenance/page.tsx", type: "public",
    fr: { desc: "Page de maintenance — affichée quand mode_maintenance est activé", feat: ["Activé via middleware.ts","Paramètre Supabase settings","Timer estimé","Admin bypass"] },
    en: { desc: "Maintenance page — shown when maintenance mode is active", feat: ["Activated via middleware.ts","Supabase settings param","Estimated timer","Admin bypass"] },
    ar: { desc: "صفحة الصيانة — تُعرض عند تفعيل وضع الصيانة", feat: ["تُفعَّل عبر middleware.ts","معلمة Supabase settings","مؤقت تقديري","تجاوز الإدارة"] },
  },
  {
    route: "/conditions", file: "app/conditions/page.tsx", type: "public",
    fr: { desc: "Conditions générales de vente", feat: ["CGV complètes","Mentions légales","Droit de rétractation"] },
    en: { desc: "General terms and conditions of sale", feat: ["Full T&Cs","Legal notices","Right of withdrawal"] },
    ar: { desc: "الشروط العامة للبيع", feat: ["شروط البيع الكاملة","الإشعارات القانونية","حق الانسحاب"] },
  },
  {
    route: "/politique-confidentialite", file: "app/politique-confidentialite/page.tsx", type: "public",
    fr: { desc: "Politique de confidentialité — RGPD", feat: ["Données collectées","Cookies utilisés","Droits utilisateurs","Contact DPO"] },
    en: { desc: "Privacy policy — GDPR", feat: ["Data collected","Cookies used","User rights","DPO contact"] },
    ar: { desc: "سياسة الخصوصية — RGPD", feat: ["البيانات المجمعة","الكوكيز المستخدمة","حقوق المستخدمين","التواصل مع DPO"] },
  },
  {
    route: "/cookies", file: "app/cookies/page.tsx", type: "public",
    fr: { desc: "Politique des cookies — types, durée, opt-in/out", feat: ["Cookies essentiels","Cookies analytics","Cookies préférences","CookieBanner"] },
    en: { desc: "Cookie policy — types, duration, opt-in/out", feat: ["Essential cookies","Analytics cookies","Preference cookies","CookieBanner"] },
    ar: { desc: "سياسة الكوكيز — الأنواع والمدة وإلغاء الموافقة", feat: ["الكوكيز الأساسية","كوكيز التحليلات","كوكيز التفضيلات","CookieBanner"] },
  },
  // ── Admin Pages ────────────────────────────────────────────────────────────
  {
    route: "/admin", file: "app/admin/page.tsx", type: "admin",
    fr: { desc: "Page de connexion admin — Supabase Auth + cookie admin_session", feat: ["Email + mot de passe","Supabase Auth","Cookie admin_session (30j)","Remember me","Redirect dashboard"] },
    en: { desc: "Admin login — Supabase Auth + admin_session cookie", feat: ["Email + password","Supabase Auth","admin_session cookie (30d)","Remember me","Redirect dashboard"] },
    ar: { desc: "صفحة دخول الإدارة — Supabase Auth + كوكي admin_session", feat: ["البريد + كلمة المرور","Supabase Auth","كوكي admin_session (30 يوم)","تذكرني","توجيه للوحة التحكم"] },
  },
  {
    route: "/admin/dashboard", file: "app/admin/dashboard/page.tsx", type: "admin",
    fr: { desc: "Tableau de bord — revenus, commandes récentes, graphiques, KPIs", feat: ["Revenus du jour/semaine/mois","Dernières commandes","Graphiques Chart","KPIs clés","Alertes stock faible"] },
    en: { desc: "Dashboard — revenue, recent orders, charts, KPIs", feat: ["Daily/weekly/monthly revenue","Recent orders","Chart graphs","Key KPIs","Low stock alerts"] },
    ar: { desc: "لوحة التحكم — الإيرادات والطلبات الأخيرة والرسوم البيانية", feat: ["إيرادات اليوم/الأسبوع/الشهر","آخر الطلبات","رسوم بيانية","مؤشرات KPIs","تنبيهات المخزون المنخفض"] },
  },
  {
    route: "/admin/products", file: "app/admin/products/page.tsx", type: "admin",
    fr: { desc: "Gestion catalogue — CRUD complet avec génération IA des descriptions", feat: ["Créer/modifier/supprimer produit","Upload images","Génération description IA (OpenAI)","Gestion stock","Activer/désactiver"] },
    en: { desc: "Catalog management — full CRUD with AI description generation", feat: ["Create/edit/delete product","Image upload","AI description generation (OpenAI)","Stock management","Enable/disable"] },
    ar: { desc: "إدارة الكتالوج — CRUD كامل مع توليد الأوصاف بالذكاء الاصطناعي", feat: ["إنشاء/تعديل/حذف منتج","رفع الصور","توليد الوصف بـ OpenAI","إدارة المخزون","تفعيل/إلغاء التفعيل"] },
  },
  {
    route: "/admin/orders", file: "app/admin/orders/page.tsx", type: "admin",
    fr: { desc: "Gestion commandes — liste, statuts, numéros de suivi", feat: ["Liste toutes commandes","Changer statut (pending→delivered)","Numéro de suivi","Filtre par statut/date","Export"] },
    en: { desc: "Order management — list, statuses, tracking numbers", feat: ["All orders list","Change status (pending→delivered)","Tracking number","Filter by status/date","Export"] },
    ar: { desc: "إدارة الطلبات — القائمة والحالات وأرقام التتبع", feat: ["قائمة جميع الطلبات","تغيير الحالة (معلق→مُسلَّم)","رقم التتبع","تصفية حسب الحالة/التاريخ","تصدير"] },
  },
  {
    route: "/admin/customers", file: "app/admin/customers/page.tsx", type: "admin",
    fr: { desc: "Profils clients — historique achats, données, fidélité", feat: ["Liste clients","Historique commandes par client","Points fidélité","Recherche & filtres"] },
    en: { desc: "Customer profiles — purchase history, data, loyalty", feat: ["Customer list","Order history per customer","Loyalty points","Search & filters"] },
    ar: { desc: "ملفات العملاء — تاريخ المشتريات والبيانات والولاء", feat: ["قائمة العملاء","تاريخ طلبات كل عميل","نقاط الولاء","بحث وفلاتر"] },
  },
  {
    route: "/admin/analytics", file: "app/admin/analytics/page.tsx", type: "admin",
    fr: { desc: "Analytics — trafic, pages vues, conversions, carte pays", feat: ["Pages vues (time series)","Top pages","Pays visiteurs","Appareils","Taux conversion"] },
    en: { desc: "Analytics — traffic, page views, conversions, country map", feat: ["Page views (time series)","Top pages","Visitor countries","Devices","Conversion rate"] },
    ar: { desc: "التحليلات — الزيارات وعدد المشاهدات والتحويلات وخريطة الدول", feat: ["مشاهدات الصفحات","أعلى الصفحات","دول الزوار","الأجهزة","معدل التحويل"] },
  },
  {
    route: "/admin/promotions", file: "app/admin/promotions/page.tsx", type: "admin",
    fr: { desc: "Promotions — créer des réductions et ventes flash", feat: ["CRUD promotions","Pourcentage ou montant fixe","Dates de début/fin","Ciblage par catégorie"] },
    en: { desc: "Promotions — create discounts and flash sales", feat: ["CRUD promotions","Percentage or fixed amount","Start/end dates","Category targeting"] },
    ar: { desc: "التخفيضات — إنشاء خصومات وتخفيضات مؤقتة", feat: ["CRUD التخفيضات","نسبة أو مبلغ ثابت","تواريخ البداية/النهاية","استهداف حسب الفئة"] },
  },
  {
    route: "/admin/coupons", file: "app/admin/coupons/page.tsx", type: "admin",
    fr: { desc: "Codes promo — créer et gérer les coupons de réduction", feat: ["CRUD coupons","Limite d'utilisation","Date d'expiration","Pourcentage ou fixe","Validation checkout"] },
    en: { desc: "Promo codes — create and manage discount coupons", feat: ["CRUD coupons","Usage limit","Expiry date","Percentage or fixed","Checkout validation"] },
    ar: { desc: "أكواد الخصم — إنشاء وإدارة قسائم الخصم", feat: ["CRUD الأكواد","حد الاستخدام","تاريخ الانتهاء","نسبة أو ثابت","التحقق عند الدفع"] },
  },
  {
    route: "/admin/newsletter", file: "app/admin/newsletter/page.tsx", type: "admin",
    fr: { desc: "Newsletter — liste abonnés + envoi campagnes via Resend", feat: ["Liste abonnés","Rédiger campagne","Envoi via Resend","Stats d'ouverture"] },
    en: { desc: "Newsletter — subscriber list + campaign sending via Resend", feat: ["Subscriber list","Write campaign","Send via Resend","Open stats"] },
    ar: { desc: "النشرة البريدية — قائمة المشتركين + إرسال الحملات عبر Resend", feat: ["قائمة المشتركين","كتابة الحملة","إرسال عبر Resend","إحصاءات الفتح"] },
  },
  {
    route: "/admin/push", file: "app/admin/push/page.tsx", type: "admin",
    fr: { desc: "Notifications push — rédiger et envoyer à tous les abonnés", feat: ["Liste abonnés push","Rédiger notification","Envoyer via web-push","VAPID keys"] },
    en: { desc: "Push notifications — write and send to all subscribers", feat: ["Push subscriber list","Write notification","Send via web-push","VAPID keys"] },
    ar: { desc: "إشعارات الدفع — كتابة وإرسال لجميع المشتركين", feat: ["قائمة مشتركي الإشعارات","كتابة الإشعار","إرسال عبر web-push","مفاتيح VAPID"] },
  },
  {
    route: "/admin/messages", file: "app/admin/messages/page.tsx", type: "admin",
    fr: { desc: "Inbox client — lecture emails IMAP + réponses IA", feat: ["Lecture via imapflow","Réponse suggérée IA","Historique conversations","Marquer lu/non-lu"] },
    en: { desc: "Client inbox — read IMAP emails + AI replies", feat: ["Read via imapflow","AI suggested reply","Conversation history","Mark read/unread"] },
    ar: { desc: "صندوق الوارد — قراءة بريد IMAP + ردود بالذكاء الاصطناعي", feat: ["قراءة عبر imapflow","رد مقترح بالذكاء الاصطناعي","تاريخ المحادثات","تعليم مقروء/غير مقروء"] },
  },
  {
    route: "/admin/reviews", file: "app/admin/reviews/page.tsx", type: "admin",
    fr: { desc: "Avis clients — modération avec suggestions IA", feat: ["File avis en attente","Approuver/rejeter","Analyse IA (faux avis)","Avis suggérés"] },
    en: { desc: "Customer reviews — moderation with AI suggestions", feat: ["Pending review queue","Approve/reject","AI analysis (fake reviews)","Suggested reviews"] },
    ar: { desc: "آراء العملاء — الإشراف مع اقتراحات الذكاء الاصطناعي", feat: ["قائمة انتظار الآراء","موافقة/رفض","تحليل الذكاء الاصطناعي (آراء مزيفة)","آراء مقترحة"] },
  },
  {
    route: "/admin/broadcast", file: "app/admin/broadcast/page.tsx", type: "admin",
    fr: { desc: "Diffusion multi-canal — email, WhatsApp, SMS générés par IA", feat: ["Génération contenu IA","WhatsApp broadcast","Email campaign","Segmentation clients"] },
    en: { desc: "Multi-channel broadcast — AI-generated email, WhatsApp, SMS", feat: ["AI content generation","WhatsApp broadcast","Email campaign","Customer segmentation"] },
    ar: { desc: "البث متعدد القنوات — بريد وواتساب ورسائل مُولَّدة بالذكاء الاصطناعي", feat: ["توليد المحتوى بالذكاء الاصطناعي","بث واتساب","حملة بريدية","تقسيم العملاء"] },
  },
  {
    route: "/admin/settings", file: "app/admin/settings/page.tsx", type: "admin",
    fr: { desc: "Paramètres du store — tout configurable via interface admin", feat: ["Infos boutique","Mode maintenance","Frais livraison","Devise & langue","Réseaux sociaux"] },
    en: { desc: "Store settings — everything configurable via admin interface", feat: ["Store info","Maintenance mode","Shipping fees","Currency & language","Social networks"] },
    ar: { desc: "إعدادات المتجر — كل شيء قابل للتهيئة عبر واجهة الإدارة", feat: ["معلومات المتجر","وضع الصيانة","رسوم الشحن","العملة واللغة","الشبكات الاجتماعية"] },
  },
  {
    route: "/admin/stock", file: "app/admin/stock/page.tsx", type: "admin",
    fr: { desc: "Inventaire — niveaux de stock + alertes (≤3)", feat: ["Tableau stock tous produits","Alertes stock faible","Modifier stock","Export CSV"] },
    en: { desc: "Inventory — stock levels + alerts (≤3)", feat: ["Stock table all products","Low stock alerts","Edit stock","Export CSV"] },
    ar: { desc: "المخزون — مستويات المخزون + تنبيهات (≤3)", feat: ["جدول مخزون جميع المنتجات","تنبيهات المخزون المنخفض","تعديل المخزون","تصدير CSV"] },
  },
  {
    route: "/admin/media", file: "app/admin/media/page.tsx", type: "admin",
    fr: { desc: "Médiathèque — upload, gestion et réutilisation des images", feat: ["Upload images","Supabase Storage","Copier URL","Supprimer image","Galerie grid"] },
    en: { desc: "Media library — upload, manage and reuse images", feat: ["Image upload","Supabase Storage","Copy URL","Delete image","Grid gallery"] },
    ar: { desc: "مكتبة الوسائط — رفع وإدارة وإعادة استخدام الصور", feat: ["رفع الصور","Supabase Storage","نسخ URL","حذف صورة","معرض الشبكة"] },
  },
  {
    route: "/admin/studio", file: "app/admin/studio/page.tsx", type: "admin",
    fr: { desc: "Studio IA créatif — génération de contenu marketing", feat: ["Textes marketing IA","Titres & hashtags","Descriptions produit","Posts réseaux sociaux"] },
    en: { desc: "AI creative studio — marketing content generation", feat: ["AI marketing texts","Titles & hashtags","Product descriptions","Social media posts"] },
    ar: { desc: "الاستوديو الإبداعي بالذكاء الاصطناعي — توليد المحتوى التسويقي", feat: ["نصوص تسويقية","عناوين وهاشتاقات","أوصاف المنتجات","منشورات وسائل التواصل"] },
  },
  {
    route: "/admin/how-it-was-built", file: "app/admin/how-it-was-built/page.tsx", type: "admin",
    fr: { desc: "Cette page — documentation complète de construction du site", feat: ["Guide De 0 à Héros","Explorateur de code réel","Stack technique","Variables d'environnement","Multilingue FR/EN/AR"] },
    en: { desc: "This page — complete site build documentation", feat: ["0 to Hero guide","Real code explorer","Tech stack","Environment variables","Multilingual FR/EN/AR"] },
    ar: { desc: "هذه الصفحة — توثيق كامل لبناء الموقع", feat: ["دليل من الصفر للاحتراف","مستكشف الكود الحقيقي","التقنيات المستخدمة","متغيرات البيئة","متعدد اللغات FR/EN/AR"] },
  },
];

function HeroSection({ lang }: { lang: Lang }) {
  const u = UI[lang];
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(["00"]));
  const [openSteps, setOpenSteps] = useState<Record<string, Set<number>>>({ "00": new Set([0]) });
  const [copied, setCopied] = useState("");
  const allExpanded = openPhases.size === PHASES.length;

  const copy = (text: string, k: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(k); setTimeout(() => setCopied(""), 2000);
  };

  function togglePhase(num: string) {
    setOpenPhases(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  }

  function toggleStep(phaseNum: string, idx: number) {
    setOpenSteps(prev => {
      const cur = new Set(prev[phaseNum] ?? []);
      cur.has(idx) ? cur.delete(idx) : cur.add(idx);
      return { ...prev, [phaseNum]: cur };
    });
  }

  function expandAll() {
    setOpenPhases(new Set(PHASES.map(p => p.num)));
    const all: Record<string, Set<number>> = {};
    PHASES.forEach(p => { all[p.num] = new Set(p.steps.map((_, i) => i)); });
    setOpenSteps(all);
  }

  function collapseAll() {
    setOpenPhases(new Set());
    setOpenSteps({});
  }

  function getPhaseLabel(phase: { num: string; label: string }) {
    if (lang === "fr") return phase.label;
    return PHASE_TR[phase.num]?.[lang] ?? phase.label;
  }

  function getStepLabel(phaseNum: string, idx: number, step: { title: string; desc: string }) {
    const tr = STEP_TR[phaseNum]?.[idx];
    if (!tr) return { title: step.title, desc: step.desc };
    if (lang === "en") return { title: tr.enTitle, desc: tr.enDesc };
    if (lang === "ar") return { title: tr.arTitle, desc: tr.arDesc };
    return { title: step.title, desc: step.desc };
  }

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-lg sm:text-xl font-black text-gray-900">{u.heroTitle}</h2>
          <div className="hidden shrink-0 gap-2 md:flex">
            <button onClick={expandAll}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-[#0d0d0d] px-3 text-[11px] font-bold text-white transition-colors hover:bg-neutral-800 active:scale-95">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
              <span className="hidden sm:inline">{lang === "ar" ? "فتح الكل" : lang === "en" ? "Expand all" : "Tout ouvrir"}</span>
              <span className="sm:hidden">{lang === "ar" ? "فتح" : lang === "en" ? "Open" : "Ouvrir"}</span>
            </button>
            {allExpanded && (
              <button onClick={collapseAll}
                className="flex min-h-11 items-center gap-1.5 rounded-xl bg-gray-100 px-3 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-200 active:scale-95">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
                <span className="hidden sm:inline">{lang === "ar" ? "إغلاق الكل" : lang === "en" ? "Collapse all" : "Tout fermer"}</span>
              </button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-gray-500">{u.heroSub}</p>
      </div>
      <div className="relative">
        <div className="absolute start-[19px] bottom-5 top-5 w-0.5 bg-gray-200" />
        <div className="space-y-3">
          {PHASES.map(phase => {
            const isPhaseOpen = openPhases.has(phase.num);
            return (
            <div key={phase.num} className="relative ps-10">
              <div className={`absolute start-0 top-3 flex h-9 w-9 items-center justify-center rounded-full ${phase.color} text-[11px] font-black text-white shadow-sm`}>{phase.num}</div>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => togglePhase(phase.num)} aria-expanded={isPhaseOpen} aria-controls={`course-phase-${phase.num}`}
                  className="flex min-h-14 w-full items-start gap-3 px-4 py-4 text-start transition-colors hover:bg-gray-50 sm:px-5">
                  <div className={`w-2 h-2 rounded-full ${phase.color} shrink-0 mt-[5px]`} />
                  <p className="flex-1 font-bold text-sm text-gray-900">{getPhaseLabel(phase)}</p>
                  <span className="ms-2 mt-0.5 hidden shrink-0 text-[11px] text-gray-400 sm:inline">{phase.steps.length} {u.stepLabel}</span>
                  <svg className={`shrink-0 text-gray-400 transition-transform ${isPhaseOpen ? "rotate-180" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {isPhaseOpen && (
                  <div id={`course-phase-${phase.num}`} className="divide-y divide-gray-50 border-t border-gray-50">
                    {phase.steps.map((step, idx) => {
                      const key = `${phase.num}-${idx}`;
                      const isStepOpen = openSteps[phase.num]?.has(idx) ?? false;
                      const { title: stTitle, desc: stDesc } = getStepLabel(phase.num, idx, step);
                      return (
                        <div key={idx}>
                          <button onClick={() => toggleStep(phase.num, idx)} aria-expanded={isStepOpen} aria-controls={`course-step-${key}`}
                            className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 sm:px-5">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            <p className="flex-1 text-[13px] font-semibold text-gray-800 leading-tight">{stTitle}</p>
                            <svg className={`shrink-0 text-gray-400 transition-transform ${isStepOpen ? "rotate-180" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                          {isStepOpen && (
                            <div id={`course-step-${key}`} className="space-y-3 px-3 pb-4 sm:px-5">
                              <p className="text-sm leading-relaxed text-gray-600">{stDesc}</p>
                              {lang !== "fr" && step.desc !== stDesc && (
                                <p className="text-[11px] text-gray-400 italic leading-relaxed border-l-2 border-gray-200 pl-3">{step.desc}</p>
                              )}
                              <div className="relative group">
                                <pre dir="ltr" className="max-h-64 overflow-auto whitespace-pre rounded-xl border border-white/[0.08] bg-[#0d0d0d] p-3 font-mono text-[12px] leading-[1.7] text-[#d4d4d4] sm:max-h-80 sm:p-4 sm:text-[11px]">{step.code}</pre>
                                <button onClick={() => copy(step.code, key)}
                                  aria-label={copied === key ? u.copied : u.copy}
                                  className="absolute end-2 top-2 flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-white/20 bg-black/70 px-2.5 text-[11px] font-bold text-white opacity-100 transition-opacity hover:bg-black/90 sm:min-h-0 sm:min-w-0 sm:bg-white/15 sm:py-1.5 sm:text-[9px] sm:opacity-0 sm:group-hover:opacity-100">
                                  {copied === key ? "✓" : u.copy}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}

// ─── Pages Section ─────────────────────────────────────────────────────────────
function PagesSection({ lang }: { lang: Lang }) {
  const u = UI[lang];
  const [filter, setFilter] = useState<"all" | "public" | "admin">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let pages = SITE_PAGES;
    if (filter !== "all") pages = pages.filter(p => p.type === filter);
    if (q.trim()) {
      const ql = q.toLowerCase();
      pages = pages.filter(p => p.route.toLowerCase().includes(ql) || p[lang].desc.toLowerCase().includes(ql));
    }
    return pages;
  }, [filter, q, lang]);

  const typeLabel = (t: string) => {
    if (t === "public") return u.pub;
    if (t === "admin") return u.adm;
    return u.api;
  };
  const typeBg = (t: string) => {
    if (t === "public") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (t === "admin") return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  return (
    <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4">
        <h2 className="text-xl font-black text-gray-900">{u.pagesTitle}</h2>
        <p className="text-sm text-gray-500 mt-1">{u.pagesSub}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1" role="group" aria-label={u.filter}>
          {(["all","public","admin"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`min-h-11 flex-1 rounded-lg px-3 text-[13px] font-semibold transition-colors sm:min-h-0 sm:flex-none sm:py-1.5 sm:text-[12px] ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {f === "all" ? (lang === "ar" ? "الكل" : lang === "en" ? "All" : "Tout") : typeLabel(f)}
              <span className="ml-1 text-[10px] text-gray-400">{SITE_PAGES.filter(p => f === "all" || p.type === f).length}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <svg className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder={lang === "ar" ? "ابحث في الصفحات…" : lang === "en" ? "Search pages…" : "Rechercher une page…"}
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white ps-9 pe-4 text-base transition-all focus:border-[#3ecf4c] focus:outline-none focus:ring-2 focus:ring-[#3ecf4c]/30 sm:min-h-0 sm:py-2 sm:text-[13px]" />
        </div>
      </div>

      <p className="text-[12px] text-gray-400">{filtered.length} {lang === "ar" ? "صفحة" : lang === "en" ? "pages" : "pages"}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(page => {
          const info = page[lang];
          return (
            <div key={page.route} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${typeBg(page.type)} shrink-0 mt-0.5`}>
                  {typeLabel(page.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <code className="text-[13px] font-mono font-bold text-gray-900">{page.route}</code>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">{page.file}</p>
                </div>
              </div>
              <p className="text-[12px] text-gray-600 leading-relaxed mb-3">{info.desc}</p>
              <div className="flex flex-wrap gap-1">
                {info.feat.map(f => (
                  <span key={f} className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-[11px]">{f}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Architecture ─────────────────────────────────────────────────────────────
function ArchSection({ lang }: { lang: Lang }) {
  const u = UI[lang];
  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">{u.archTitle}</h2><p className="text-sm text-gray-500 mt-1">{u.archSub}</p></div>
      <div className="bg-[#0d0d0d] rounded-2xl p-4 sm:p-6 border border-white/[0.06] overflow-hidden">
        <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-5">{u.deploy}</p>
        <div className="flex flex-wrap items-center gap-2 justify-center mb-8">
          {[["👨‍💻", lang === "ar" ? "مطوّر" : "Développeur","VS Code local","border-violet-500/40 bg-violet-500/10"],["→","","","arrow"],["🐙","GitHub","git push origin main","border-white/10 bg-white/5"],["→","","","arrow"],["▲","Vercel","Build & Deploy auto","border-white/10 bg-white/5"],["→","","","arrow"],["🌐","lecomax.com","CDN mondial","border-emerald-500/40 bg-emerald-500/10"]].map(([icon, label, sub, cls], i) =>
            cls === "arrow" ? <div key={i} className="text-white/20 text-xl hidden sm:block">→</div> :
            <div key={i} className={`flex flex-col items-center gap-1.5 px-3 sm:px-4 py-3 rounded-xl border ${cls} min-w-[80px] sm:min-w-[100px]`}>
              <span className="text-2xl">{icon}</span>
              <p className="text-white text-[12px] font-bold">{label}</p>
              <p className="text-white/40 text-[10px] text-center">{sub}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "NEXT.JS APP", color: "text-blue-400", items: ["app/ — Pages (App Router)","app/api/ — 40+ API Routes","components/ — 35+ composants","lib/ — Utilitaires & types","middleware.ts — Edge security"], dot: "bg-blue-400" },
            { label: "SUPABASE (PostgreSQL)", color: "text-emerald-400", items: ["products — Catalogue","orders — Commandes","customers — Clients","settings — Config","+ 16 autres tables"], dot: "bg-emerald-400" },
            { label: "EMAIL SERVICES", color: "text-orange-400", items: ["Resend — confirmations","Nodemailer — SMTP","EmailJS — contact form","imapflow — IMAP inbox"], dot: "bg-orange-400" },
            { label: "EXTERNAL APIs", color: "text-pink-400", items: ["OpenAI — AI admin","PayPal — payments","web-push — notifications","Vercel Analytics"], dot: "bg-pink-400" },
          ].map(box => (
            <div key={box.label} className="bg-white/5 border border-white/[0.08] rounded-xl p-4">
              <p className={`text-[9px] font-bold ${box.color} uppercase tracking-widest mb-3`}>{box.label}</p>
              {box.items.map(item => (
                <div key={item} className="flex items-center gap-2 text-[11px] mb-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${box.dot} shrink-0`} />
                  <span className="text-white/55">{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-3">{u.orderFlow}</h3>
          {(lang === "en"
            ? ["Customer fills checkout (/checkout)","POST /api/orders — data validation","Supabase INSERT into orders table","Resend sends confirmation email","Response { orderNumber } → redirect /merci","CartContext.clear() → cart emptied","Admin sees order in /admin/orders"]
            : lang === "ar"
            ? ["العميل يملأ الدفع (/checkout)","POST /api/orders — التحقق من البيانات","Supabase INSERT في جدول orders","Resend يرسل بريد التأكيد","استجابة { orderNumber } → توجيه /merci","CartContext.clear() → السلة فارغة","الإدارة ترى الطلب في /admin/orders"]
            : ["Client remplit checkout (/checkout)","POST /api/orders — validation des données","Supabase INSERT dans la table orders","Resend envoie l'email de confirmation","Réponse { orderNumber } → redirect /merci","CartContext.clear() → panier vidé","Admin voit la commande dans /admin/orders"]
          ).map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] mb-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{i+1}</span>
              <span className="text-gray-600">{s}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-3">{u.productFlow}</h3>
          {(lang === "en"
            ? ["Admin visits /admin/products","Fills form (name, price, images, stock)","(Optional) Clicks 'Generate with AI' → OpenAI","POST /api/products → Supabase INSERT","Product active in products table","Visitor loads /chaussures → GET /api/products","Product displayed in product grid"]
            : lang === "ar"
            ? ["الإدارة تزور /admin/products","تملأ النموذج (الاسم، السعر، الصور، المخزون)","(اختياري) تنقر 'توليد بالذكاء الاصطناعي' → OpenAI","POST /api/products → Supabase INSERT","المنتج نشط في جدول products","الزائر يحمّل /chaussures → GET /api/products","المنتج يظهر في شبكة المنتجات"]
            : ["Admin visite /admin/products","Remplit le formulaire (nom, prix, images, stock)","(Optionnel) Clique 'Générer avec IA' → OpenAI","POST /api/products → Supabase INSERT","Produit actif dans la table products","Visiteur charge /chaussures → GET /api/products","Produit affiché dans la grille produits"]
          ).map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] mb-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{i+1}</span>
              <span className="text-gray-600">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tech Stack ───────────────────────────────────────────────────────────────
const TECH = [
  { name: "Next.js", v: "15.0.3", badge: "core", cat: "Framework", why: "App Router, SSR, SSG, API routes, Image opt, file routing. Front-end ET back-end dans un seul codebase sur Vercel." },
  { name: "React", v: "19.0.0", badge: "core", cat: "UI", why: "Composants, Context, hooks. Version 19 améliore les Server Components." },
  { name: "TypeScript", v: "5.7.2", badge: "devtool", cat: "Langage", why: "strict:true attrape les bugs à la compile. Types Product, Order, Category partagés partout." },
  { name: "Tailwind CSS", v: "3.4.15", badge: "ui", cat: "Style", why: "Classes utilitaires. Design system dans tailwind.config.js (brand green #16b277, Inter+Sora)." },
  { name: "Supabase", v: "2.105.0", badge: "db", cat: "BDD+Auth", why: "PostgreSQL + Auth + Storage. Anon key safe côté client. Service role pour API admin." },
  { name: "Vercel", v: "Hosting", badge: "hosting", cat: "Hébergement", why: "Déploiement automatique à chaque git push. CDN mondial, SSL auto, Edge Functions. Plan gratuit généreux." },
  { name: "Namecheap", v: "Registrar", badge: "domain", cat: "Domaine", why: "Registrar utilisé pour lecomax.com. Interface DNS simple pour A Record, CNAME et records DKIM/SPF (Resend)." },
  { name: "Resend", v: "6.12.2", badge: "email", cat: "Email transac.", why: "Emails de confirmation commande et newsletters. Délivrabilité élevée. Setup DNS DKIM en 5 min. 3 000 emails/mois gratuits." },
  { name: "Nodemailer", v: "8.0.11", badge: "email", cat: "Email SMTP", why: "SMTP flexible dans les routes API server-side." },
  { name: "EmailJS", v: "4.4.1", badge: "email", cat: "Email client", why: "Formulaire contact côté client, sans API route dédiée." },
  { name: "imapflow + mailparser", v: "1.4.0", badge: "email", cat: "Email IMAP", why: "Lecture emails entrants pour l'inbox dans /admin/messages." },
  { name: "PayPal SDK", v: "10.0.0", badge: "payment", cat: "Paiement", why: "Boutons PayPal React dans le checkout, complète le COD." },
  { name: "OpenAI", v: "6.42.0", badge: "ai", cat: "IA", why: "Descriptions produits, réponses clients, broadcast marketing, modération avis. ~0.01$/requête avec GPT-4o-mini." },
  { name: "web-push", v: "3.6.7", badge: "push", cat: "Push Notif.", why: "Envoie des notifications web depuis /admin/push aux abonnés. Clés VAPID générées via npx web-push generate-vapid-keys." },
  { name: "Vercel Analytics", v: "2.0.1", badge: "analytics", cat: "Analytics", why: "Traffic sans cookies, privacy-first, intégré à Vercel. Pages vues, pays, devices, referrers." },
  { name: "Vercel Speed Insights", v: "2.0.0", badge: "analytics", cat: "Performance", why: "Core Web Vitals réels (LCP, FID, CLS) depuis les vrais users. Essentiel pour le ranking Google." },
  { name: "WhatsApp (whapi.cloud)", v: "API", badge: "comms", cat: "Messaging", why: "Canal N°1 au Maroc. Chat client, confirmations commande, broadcasts marketing via /admin/broadcast." },
  { name: "Google Search Console", v: "Gratuit", badge: "seo", cat: "SEO", why: "Surveillance indexation, mots-clés, clic/impression Google. Soumettre le sitemap.xml pour accélérer le crawl." },
  { name: "IndexNow", v: "API", badge: "seo", cat: "SEO", why: "Notifie Bing et Yandex INSTANTANÉMENT quand un produit est créé. Sans attendre le prochain crawl (peut prendre des semaines)." },
  { name: "Inter + Sora", v: "Google Fonts", badge: "ui", cat: "Polices", why: "Inter pour le corps (lisibilité), Sora pour les titres (impact)." },
];
const BC: Record<string, string> = {
  core:"bg-violet-100 text-violet-700 border-violet-200", db:"bg-emerald-100 text-emerald-700 border-emerald-200",
  ui:"bg-pink-100 text-pink-700 border-pink-200", email:"bg-blue-100 text-blue-700 border-blue-200",
  payment:"bg-yellow-100 text-yellow-800 border-yellow-200", analytics:"bg-orange-100 text-orange-700 border-orange-200",
  ai:"bg-cyan-100 text-cyan-700 border-cyan-200", devtool:"bg-slate-100 text-slate-700 border-slate-200",
  push:"bg-red-100 text-red-700 border-red-200", hosting:"bg-gray-100 text-gray-700 border-gray-200",
  domain:"bg-amber-100 text-amber-700 border-amber-200", comms:"bg-green-100 text-green-700 border-green-200",
  seo:"bg-indigo-100 text-indigo-700 border-indigo-200",
};
function TechSec({ lang }: { lang: Lang }) {
  const u = UI[lang];
  const [exp, setExp] = useState<string|null>(null);
  return (
    <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">{u.techTitle}</h2><p className="text-sm text-gray-500 mt-1">{u.techSub}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TECH.map(t => (
          <div key={t.name} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => setExp(exp === t.name ? null : t.name)} className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900">{t.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${BC[t.badge]}`}>{t.badge.toUpperCase()}</span>
                  <span className="text-[11px] text-gray-400 font-mono">{t.v}</span>
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">{t.cat}</p>
              </div>
              <svg className={`shrink-0 mt-1 text-gray-400 transition-transform ${exp === t.name ? "rotate-180" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {exp === t.name && <div className="px-4 pb-4 border-t border-gray-50 pt-3"><p className="text-[12px] text-gray-600 leading-relaxed">{t.why}</p></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Env vars ──────────────────────────────────────────────────────────────────
const ENV = [
  { name:"NEXT_PUBLIC_SUPABASE_URL", purpose:"URL du projet Supabase", where:"lib/supabase.ts, middleware.ts", secret:false, req:true },
  { name:"NEXT_PUBLIC_SUPABASE_ANON_KEY", purpose:"Clé anon Supabase — safe côté client, respecte les RLS", where:"lib/supabase.ts", secret:false, req:true },
  { name:"SUPABASE_SERVICE_ROLE_KEY", purpose:"Clé service Supabase — bypass RLS — SERVEUR UNIQUEMENT", where:"lib/db-server.ts", secret:true, req:true },
  { name:"RESEND_API_KEY", purpose:"Clé Resend pour emails transactionnels", where:"app/api/send-confirmation/, newsletter/", secret:true, req:true },
  { name:"OPENAI_API_KEY", purpose:"Clé OpenAI pour les fonctionnalités IA admin", where:"app/api/ai-product/, ai-reply/, ai-broadcast/", secret:true, req:false },
  { name:"VAPID_PUBLIC_KEY", purpose:"Clé VAPID publique pour push (safe côté client)", where:"components/PushPrompt.tsx, app/api/push/", secret:false, req:false },
  { name:"VAPID_PRIVATE_KEY", purpose:"Clé VAPID privée pour signer les pushes (serveur)", where:"app/api/push/", secret:true, req:false },
  { name:"VAPID_EMAIL", purpose:"Email contact VAPID (obligatoire par la spec Web Push)", where:"app/api/push/", secret:false, req:false },
  { name:"NEXT_PUBLIC_PAYPAL_CLIENT_ID", purpose:"Client ID PayPal pour le SDK checkout", where:"app/checkout/", secret:false, req:false },
  { name:"IMAP_HOST", purpose:"Serveur IMAP pour l'inbox admin", where:"app/api/inbox/", secret:false, req:false },
  { name:"IMAP_USER", purpose:"Compte IMAP (email)", where:"app/api/inbox/", secret:false, req:false },
  { name:"IMAP_PASSWORD", purpose:"Mot de passe IMAP", where:"app/api/inbox/", secret:true, req:false },
  { name:"SMTP_HOST", purpose:"Serveur SMTP (Nodemailer)", where:"routes API Nodemailer", secret:false, req:false },
  { name:"SMTP_USER", purpose:"Identifiant SMTP", where:"routes API Nodemailer", secret:false, req:false },
  { name:"SMTP_PASS", purpose:"Mot de passe SMTP", where:"routes API Nodemailer", secret:true, req:false },
];
function EnvSec({ lang }: { lang: Lang }) {
  const u = UI[lang];
  return (
    <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">{u.envTitle}</h2><p className="text-sm text-gray-500 mt-1">{u.envSub}</p></div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-[12px]">
        <span className="text-amber-500 shrink-0">⚠️</span>
        <div><strong className="text-amber-800">{u.envRule}</strong><span className="text-amber-700"> {u.envRuleText}</span></div>
      </div>
      <div className="space-y-3 md:hidden">
        {ENV.map(v => (
          <article key={v.name} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/80 p-4">
              <code dir="ltr" className="block break-all font-mono text-[13px] font-bold text-violet-700">{v.name}</code>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold ${v.secret?"bg-red-100 text-red-700 border-red-200":"bg-green-100 text-green-700 border-green-200"}`}>{v.secret ? u.secret : "PUBLIC"}</span>
                <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold ${v.req?"bg-gray-100 text-gray-600 border-gray-200":"bg-slate-50 text-slate-500 border-slate-200"}`}>{v.req ? u.req : u.opt}</span>
              </div>
            </div>
            <dl className="space-y-3 p-4 text-sm">
              <div><dt className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{u.desc}</dt><dd className="mt-1 leading-relaxed text-gray-700">{v.purpose}</dd></div>
              <div><dt className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{u.file}</dt><dd dir="ltr" className="mt-1 break-all font-mono text-[12px] leading-relaxed text-gray-500">{v.where}</dd></div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-gray-500 sm:px-4">Variable</th>
              <th className="px-3 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-gray-500 sm:px-4">{u.desc}</th>
              <th className="hidden px-3 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-gray-500 sm:px-4 lg:table-cell">{u.file}</th>
              <th className="px-3 py-3 text-start text-[11px] font-bold uppercase tracking-wider text-gray-500 sm:px-4">{u.type}</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {ENV.map(v => (
                <tr key={v.name} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-3"><code className="text-[10px] sm:text-[11px] font-mono text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded break-all">{v.name}</code></td>
                  <td className="px-3 sm:px-4 py-3 text-gray-600 text-[11px] sm:text-[12px]">{v.purpose}</td>
                  <td className="px-3 sm:px-4 py-3 text-gray-400 font-mono text-[10px] hidden lg:table-cell">{v.where}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${v.secret?"bg-red-100 text-red-700 border-red-200":"bg-green-100 text-green-700 border-green-200"}`}>{v.secret ? u.secret : "PUBLIC"}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${v.req?"bg-gray-100 text-gray-600 border-gray-200":"bg-slate-50 text-slate-500 border-slate-200"}`}>{v.req ? u.req : u.opt}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────
const ITEMS = [
  ...TECH.map(t => ({ type:"Package", title:t.name, desc:`${t.cat} — ${t.why.slice(0,80)}…` })),
  ...ENV.map(v => ({ type:"Env Var", title:v.name, desc:v.purpose })),
  ...SITE_PAGES.map(p => ({ type: p.type === "admin" ? "Admin Page" : p.type === "api" ? "API" : "Page", title: p.route, desc: p.fr.desc })),
  ...[
    { type:"Fichier", title:"middleware.ts", desc:"Mode maintenance, protection /admin/*, sécurité API writes" },
    { type:"Fichier", title:"next.config.js", desc:"Images AVIF/WebP, redirects SEO, security headers, cache 1 an" },
    { type:"Fichier", title:"tailwind.config.js", desc:"Couleurs brand, polices Inter+Sora, ombres, animations" },
    { type:"Fichier", title:"lib/supabase.ts", desc:"Client Supabase + tous les types TypeScript" },
    { type:"Fichier", title:"lib/db-server.ts", desc:"Service role key — SERVEUR UNIQUEMENT" },
    { type:"Fichier", title:"lib/products.ts", desc:"Types statiques, catégories, apiToCard()" },
    { type:"Fichier", title:"lib/use-settings.ts", desc:"useSettings() hook avec cache module-level" },
    { type:"Fichier", title:"components/CartContext.tsx", desc:"Panier React Context + localStorage (lecomax_cart_v1)" },
    { type:"Fichier", title:"components/Header.tsx", desc:"Nav sticky, search, cart badge, user menu" },
    { type:"Fichier", title:"app/layout.tsx", desc:"Root layout: polices, metadata, CartProvider, composants globaux" },
    { type:"Fichier", title:"app/admin/layout.tsx", desc:"Sidebar admin: 30+ nav items, badges, session check" },
    { type:"API", title:"/api/products", desc:"GET/POST/PUT/DELETE produits" },
    { type:"API", title:"/api/orders", desc:"GET list | POST create | PUT status" },
    { type:"API", title:"/api/settings", desc:"GET all | PUT upsert" },
    { type:"API", title:"/api/ai-product", desc:"OpenAI → description produit" },
    { type:"API", title:"/api/push", desc:"Subscribe + send push notifications" },
    { type:"API", title:"/api/send-confirmation", desc:"Email confirmation via Resend" },
    { type:"Concept", title:"Admin Protection", desc:"Cookie admin_session vérifié par middleware.ts + layout.tsx" },
    { type:"Concept", title:"Cart localStorage", desc:"Panier côté client, lecomax_cart_v1, CartContext.tsx" },
    { type:"Concept", title:"Service Role Key", desc:"Clé Supabase accès total — jamais côté client" },
    { type:"Concept", title:"Edge Middleware", desc:"middleware.ts s'exécute à l'Edge avant le rendu" },
    { type:"Concept", title:"App Router", desc:"Next.js 15 App Router — Server Components, layouts, loading" },
  ],
];
const TB: Record<string,string> = {
  Package:"bg-violet-100 text-violet-700 border-violet-200","Env Var":"bg-red-100 text-red-700 border-red-200",
  Fichier:"bg-blue-100 text-blue-700 border-blue-200",Page:"bg-orange-100 text-orange-700 border-orange-200",
  "Admin Page":"bg-orange-100 text-orange-700 border-orange-200",
  API:"bg-emerald-100 text-emerald-700 border-emerald-200",Concept:"bg-cyan-100 text-cyan-700 border-cyan-200",
};
function SearchSec({ lang }: { lang: Lang }) {
  const u = UI[lang];
  const [q, setQ] = useState("");
  const res = useMemo(() => {
    if (!q.trim()) return [];
    const ql = q.toLowerCase();
    return ITEMS.filter(i => i.title.toLowerCase().includes(ql) || i.desc.toLowerCase().includes(ql)).slice(0, 50);
  }, [q]);
  return (
    <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">{u.searchTitle}</h2><p className="text-sm text-gray-500 mt-1">{u.searchSub} ({ITEMS.length})</p></div>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
        <div className="relative">
          <svg className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={u.search_hint} autoFocus
            className="min-h-12 w-full rounded-xl border border-gray-200 ps-10 pe-4 text-base transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 sm:text-sm" />
        </div>
        {!q && <div className="mt-3 flex flex-wrap gap-2">{["CartContext","supabase","auth","orders","RESEND","checkout","middleware","OpenAI","PayPal","push","Vercel","/admin"].map(s => (
          <button key={s} onClick={() => setQ(s)} className="min-h-11 rounded-lg bg-gray-100 px-3 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-200 sm:min-h-0 sm:py-1.5 sm:text-[12px]">{s}</button>
        ))}</div>}
      </div>
      {q && (
        <div>
          <p className="text-[12px] text-gray-500 mb-3">{res.length} {u.results}</p>
          {res.length === 0
            ? <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center text-gray-400 text-sm">{u.noResults} &quot;{q}&quot;</div>
            : <div className="space-y-2">{res.map((r,i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-start gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${TB[r.type]??""} shrink-0 mt-0.5`}>{r.type}</span>
                  <div className="min-w-0"><p className="break-words text-sm font-semibold text-gray-900">{r.title}</p><p className="mt-0.5 break-words text-[13px] leading-relaxed text-gray-500 sm:text-[12px]">{r.desc}</p></div>
                </div>
              ))}</div>
          }
        </div>
      )}
    </div>
  );
}

// ─── START HERE ────────────────────────────────────────────────────────────────
function StartHereSection({ onNavigate, lang }: { onNavigate: (tab: string) => void; lang: Lang }) {
  const [copied, setCopied] = useState("");
  const [done, setDone] = useState<boolean[]>([false, false, false, false, false]);
  const [activeCodeLine, setActiveCodeLine] = useState(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lecomax-learning-checklist");
      if (saved) setDone(JSON.parse(saved));
    } catch { /* localStorage can be disabled */ }
  }, []);

  function toggleDone(index: number) {
    setDone(current => {
      const next = current.map((value, i) => i === index ? !value : value);
      try { window.localStorage.setItem("lecomax-learning-checklist", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1800);
  }

  function openCodingLab() {
    document.getElementById("coding-lab")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openAcademyLesson(moduleId: string, lessonId: string) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#academy/${moduleId}/${lessonId}`);
    onNavigate("academy");
  }

  const quickStart = `# 1. Ouvre le terminal dans le dossier L'ecomax
npm install

# 2. Lance le serveur de développement
npm run dev

# 3. Ouvre le site dans ton navigateur
# http://localhost:3000

# 4. Après tes modifications, vérifie le projet
npm run build

# 5. Arrête le serveur quand tu as terminé
# Ctrl + C`;

  const example = `// app/produits/page.tsx
// Ce fichier crée automatiquement l'URL /produits

import Link from "next/link"; // composant de navigation Next.js

type Product = { id: number; name: string; price: number };

const products: Product[] = [
  { id: 1, name: "Nike Air Max", price: 129.99 },
];

// Une page est un composant React exporté par défaut.
// Sans "use client", c'est un Server Component (le choix conseillé).
export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <h1 className="text-3xl font-black text-black">Nos produits</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="border border-neutral-200 p-5">
            <h2 className="font-bold">{product.name}</h2>
            <p className="mt-2 text-neutral-600">{product.price.toFixed(2)} €</p>
            <Link href={\`/produit/\${product.id}\`}
              className="mt-4 inline-block bg-[#3ecf4c] px-4 py-2 font-bold text-black">
              Voir le produit
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}`;

  const learningPath = [
    { tab: "game", icon: "★", title: "Jouer et coder avec le bot", desc: "Regarde le bot coder ligne par ligne, comprends, puis écris le code et reçois une correction.", color: "#facc15" },
    { tab: "hero", icon: "1", title: "Construire de zéro", desc: "Installation, fichiers, frontend, API, base de données et mise en ligne.", color: "#3ecf4c" },
    { tab: "academy", icon: "2", title: "Suivre l’Académie complète", desc: "HTML → CSS → JavaScript → React → Next.js → production, dans le bon ordre.", color: "#60a5fa" },
    { tab: "mentor", icon: "3", title: "Comprendre vraiment", desc: "Analogies, quiz et exercices guidés comme avec un mentor.", color: "#a78bfa" },
    { tab: "files", icon: "4", title: "Lire le vrai code", desc: "Ouvre les fichiers réels de L'ecomax et compare avec les leçons.", color: "#f59e0b" },
    { tab: "debug", icon: "5", title: "Apprendre à réparer", desc: "Lis une erreur, trouve sa source et applique une méthode de diagnostic.", color: "#fb7185" },
    { tab: "deploy", icon: "6", title: "Publier le site", desc: "GitHub, variables d'environnement, Vercel et domaine personnalisé.", color: "#16b277" },
  ];

  const practicalTracks = [
    { module: "beginner-code-labs", lesson: "read-code-symbols", icon: "01", title: "Je pars de zéro en code", desc: "Lis chaque symbole, puis pratique variables, fonctions, tableaux et erreurs sans sauter d’étape.", color: "#10b981" },
    { module: "next-routing-lab", lesson: "page-route-link", icon: "02", title: "Je crée et relie mes pages", desc: "Crée les routes Next.js, ajoute les liens, les layouts, les slugs et tous les états de navigation.", color: "#2563eb" },
    { module: "supabase-build-lab", lesson: "supabase-project-schema", icon: "03", title: "Je construis Supabase", desc: "Écris les tables SQL, connecte Next.js, protège avec RLS puis ajoute Auth, Storage et Realtime.", color: "#3ecf8e" },
    { module: "ui-build-lab", lesson: "wireframe-to-html", icon: "04", title: "Je dessine et code mes pages", desc: "Passe du wireframe au HTML, puis ajoute couleurs, typographie, espaces, Grid et responsive.", color: "#f43f5e" },
    { module: "china-sourcing", lesson: "sourcing-product-spec", icon: "05", title: "J’achète en Chine prudemment", desc: "Spécification, fournisseurs, échantillons, négociation, contrat, paiement protégé et prévention fraude.", color: "#dc2626" },
    { module: "import-quality-logistics", lesson: "compliance-before-order", icon: "06", title: "J’importe et contrôle la qualité", desc: "Conformité, Incoterms, transport, inspection, douane, coût rendu, stock et risques.", color: "#0f766e" },
    { module: "seo-client-action-lab", lesson: "search-console-baseline", icon: "07", title: "Je classe mon site et trouve des clients", desc: "Search Console, SEO produit, contenu, acquisition, partenaires et revue de croissance hebdomadaire.", color: "#7c3aed" },
    { module: "zero-to-hero-capstone", lesson: "capstone-week-1-foundation", icon: "08", title: "Je suis le plan final 12 semaines", desc: "Assemble site, données, design, produit, sourcing, lancement, ventes, SEO et rétention dans l’ordre.", color: "#111827" },
  ];

  const codingLoop = [
    { number: "01", title: "Choisis un petit résultat", desc: "Exemple : afficher un titre. Décris d’abord ce que l’utilisateur doit voir." },
    { number: "02", title: "Trouve le bon fichier", desc: "Une page vit dans app/.../page.tsx. Un élément réutilisable vit souvent dans components/." },
    { number: "03", title: "Écris le minimum", desc: "Commence par quelques lignes qui fonctionnent. N’ajoute le style et les données qu’ensuite." },
    { number: "04", title: "Enregistre et observe", desc: "Ctrl+S, puis regarde le navigateur et le terminal. Le résultat est la preuve." },
    { number: "05", title: "Change une seule chose", desc: "Modifie un texte, une couleur ou une donnée, puis compare avant et après." },
    { number: "06", title: "Vérifie avant de garder", desc: "Teste sur mobile, lis les erreurs, puis lance npm run build quand la modification est terminée." },
  ];

  const firstComponent = [
    {
      code: "export default function Welcome() {",
      short: "Créer le composant",
      meaning: "function crée un bloc de code nommé Welcome. export default dit à Next.js que c’est le contenu principal de ce fichier.",
      experiment: "Remplace Welcome par HomePage : le nom change dans le code, mais la page reste visible.",
    },
    {
      code: "  const name = \"Zakaria\";",
      short: "Mémoriser une valeur",
      meaning: "const crée une variable qu’on ne réassignera pas. name est son nom et \"Zakaria\" est la valeur texte stockée.",
      experiment: "Remplace Zakaria par ton prénom et observe le titre dans le navigateur.",
    },
    {
      code: "  return (",
      short: "Décrire l’écran",
      meaning: "return indique ce que React doit afficher. Les parenthèses permettent d’écrire le JSX sur plusieurs lignes.",
      experiment: "Tout élément visible doit se trouver dans ce return.",
    },
    {
      code: "    <main className=\"p-8\">",
      short: "Créer un conteneur",
      meaning: "<main> est une balise HTML pour le contenu principal. className ajoute des classes Tailwind : p-8 crée de l’espace intérieur.",
      experiment: "Essaie p-2 puis p-12 pour voir immédiatement la différence d’espace.",
    },
    {
      code: "      <h1>Bonjour {name}</h1>",
      short: "Afficher texte + donnée",
      meaning: "<h1> est le titre principal. Les accolades { } quittent momentanément le HTML pour lire une valeur JavaScript.",
      experiment: "Ajoute un point d’exclamation après {name}, puis crée une variable city et affiche-la.",
    },
    {
      code: "    </main>\n  );\n}",
      short: "Fermer proprement",
      meaning: "</main> ferme la balise ouverte. ); termine le return et } ferme la fonction. Chaque ouverture doit avoir sa fermeture.",
      experiment: "Supprime temporairement </main> : lis l’erreur, puis remets-le pour apprendre à la reconnaître.",
    },
  ];

  const firstComponentSource = firstComponent.map(line => line.code).join("\n");

  const checklist = [
    "J'ai installé Node.js et vérifié node -v et npm -v",
    "J'ai lancé npm run dev et ouvert localhost:3000",
    "J'ai modifié un texte dans app/page.tsx et vu le résultat",
    "J'ai créé une page test dans app/test/page.tsx",
    "J'ai exécuté npm run build sans erreur",
  ];

  const palette = [
    { name: "Vert action", hex: "#3ecf4c", use: "Boutons, liens importants, accent L'ecomax", text: "text-black" },
    { name: "Vert marque", hex: "#16b277", use: "Succès, hover et identité secondaire", text: "text-white" },
    { name: "Noir", hex: "#0d0d0d", use: "Titres, navigation et fonds premium", text: "text-white" },
    { name: "Blanc", hex: "#ffffff", use: "Pages, cartes et contraste", text: "text-black" },
    { name: "Gris texte", hex: "#767677", use: "Descriptions et informations secondaires", text: "text-white" },
    { name: "Bleu info", hex: "#0071ae", use: "Liens informatifs et états neutres", text: "text-white" },
    { name: "Orange", hex: "#f59e0b", use: "Attention et avertissements", text: "text-black" },
    { name: "Rouge", hex: "#ef4444", use: "Erreurs et actions dangereuses", text: "text-white" },
  ];

  const progress = Math.round((done.filter(Boolean).length / done.length) * 100);

  return (
    <div className="space-y-6">
      <DailyLearning lang={lang} onAcademy={() => onNavigate("academy")} />
      <CodingTutor lang={lang} />
      <details className="rounded-3xl border border-neutral-200 bg-white p-4">
        <summary className="min-h-12 cursor-pointer font-bold">{translate(lang, "Aller plus loin · ateliers et ressources", "Go deeper · workshops and resources", "تعمّق أكثر · ورش وموارد")}</summary>
        <div className="mt-4 space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#0d0d0d] p-5 text-white sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#3ecf4c]/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex rounded-full border border-[#3ecf4c]/30 bg-[#3ecf4c]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-[#3ecf4c]">Ressources complémentaires</span>
          <h2 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">Apprends à construire L&apos;ecomax,<br className="hidden sm:block" /> une petite victoire à la fois.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">Tu n&apos;as pas besoin de tout mémoriser. Les 192 leçons avancent du premier symbole de code jusqu&apos;à Next.js, Supabase, design, sourcing, import, vente, SEO et acquisition. Fais un petit changement, regarde la preuve, puis recommence.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={openCodingLab} className="rounded-xl bg-[#3ecf4c] px-4 py-2.5 text-xs font-black text-black transition-transform active:scale-95">Apprendre à coder maintenant →</button>
            <button onClick={() => onNavigate("academy")} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10">Ouvrir l’Académie 0→Héros</button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#16b277]">Ordre conseillé</p><h3 className="text-lg font-black text-gray-900">Ton parcours d&apos;apprentissage</h3></div>
          <p className="hidden text-[11px] text-gray-400 sm:block">Clique une carte pour ouvrir la leçon</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {learningPath.map(item => (
            <button key={item.tab} onClick={() => onNavigate(item.tab)} className="group rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md">
              <div className="mb-3 flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-black" style={{ backgroundColor: item.color }}>{item.icon}</span><span className="text-gray-300 transition-transform group-hover:translate-x-1">→</span></div>
              <p className="text-sm font-black text-gray-900">{item.title}</p><p className="mt-1 text-[11px] leading-relaxed text-gray-500">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
        <div className="mb-4 max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#128347]">Nouveaux parcours pratiques</p>
          <h3 className="mt-1 text-lg font-black text-gray-950">Choisis exactement ce que tu veux apprendre maintenant</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">Chaque bouton ouvre directement la première leçon du parcours. Si tu débutes complètement, commence par 01 et avance dans l’ordre jusqu’au projet final.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {practicalTracks.map(track => (
            <button key={track.module} onClick={() => openAcademyLesson(track.module, track.lesson)} className="group min-h-32 rounded-2xl border border-white bg-white p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b277]">
              <div className="flex items-center justify-between"><span className="flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-[10px] font-black text-white" style={{ backgroundColor: track.color }}>{track.icon}</span><span className="text-gray-300 transition-transform group-hover:translate-x-1">→</span></div>
              <p className="mt-3 text-xs font-black text-gray-950">{track.title}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-gray-500">{track.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="coding-lab" className="scroll-mt-44 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#16b277]">Ton premier atelier de code</p>
              <h3 className="mt-1 text-xl font-black text-gray-950 sm:text-2xl">Comment coder — et comprendre ce que le code veut dire</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">Coder, ce n’est pas réciter des lignes. C’est choisir un résultat, donner des instructions précises à l’ordinateur, puis vérifier ce qu’il produit.</p>
            </div>
            <span className="rounded-full bg-[#3ecf4c]/10 px-3 py-1.5 text-[10px] font-black text-[#128347]">DÉBUTANT · 10 MIN</span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {codingLoop.map(step => (
              <div key={step.number} className="rounded-2xl border border-gray-100 bg-[#fafafa] p-3.5">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[10px] font-black text-[#16b277]">{step.number}</span>
                  <div><p className="text-xs font-black text-gray-900">{step.title}</p><p className="mt-1 text-[10px] leading-relaxed text-gray-500">{step.desc}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.08fr_.92fr]">
          <div className="bg-[#0d0d0d] p-4 sm:p-6" dir="ltr">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-[#3ecf4c]">Clique une ligne</p><p className="mt-1 text-xs font-bold text-white">app/bienvenue/page.tsx</p></div>
              <button onClick={() => copy(firstComponentSource, "first-component")} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold text-white hover:bg-white/15">{copied === "first-component" ? "✓ Copié" : "Copier le code"}</button>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-7 sm:text-xs"><code>
              {firstComponent.map((line, index) => (
                <button key={index} type="button" onClick={() => setActiveCodeLine(index)} className={`block w-full rounded-lg px-2 text-left transition ${activeCodeLine === index ? "bg-[#3ecf4c]/15 text-white ring-1 ring-[#3ecf4c]/40" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
                  <span className="mr-4 inline-block w-4 select-none text-right text-white/25">{index + 1}</span>{line.code}
                </button>
              ))}
            </code></pre>
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-[10px] leading-relaxed text-white/50"><strong className="text-white">Lis toujours de l’extérieur vers l’intérieur :</strong> fichier → fonction → return → balises → données entre accolades.</p>
          </div>

          <div className="flex min-h-[360px] flex-col p-5 sm:p-6" aria-live="polite">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3ecf4c] text-[11px] font-black text-black">{activeCodeLine + 1}</span><p className="text-sm font-black text-gray-950">{firstComponent[activeCodeLine].short}</p></div>
            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Ce que cette ligne signifie</p>
              <p className="mt-2 text-sm leading-7 text-gray-700">{firstComponent[activeCodeLine].meaning}</p>
            </div>
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Essaie toi-même</p>
              <p className="mt-1.5 text-xs leading-relaxed text-blue-900">{firstComponent[activeCodeLine].experiment}</p>
            </div>
            <div className="mt-auto pt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-gray-400"><span>Compréhension du composant</span><span>{activeCodeLine + 1} / {firstComponent.length}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#3ecf4c] transition-all" style={{ width: `${((activeCodeLine + 1) / firstComponent.length) * 100}%` }} /></div>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={activeCodeLine === 0} onClick={() => setActiveCodeLine(value => Math.max(0, value - 1))} className="min-h-10 flex-1 rounded-xl border border-gray-200 text-[11px] font-bold disabled:opacity-35">← Précédente</button>
                <button type="button" disabled={activeCodeLine === firstComponent.length - 1} onClick={() => setActiveCodeLine(value => Math.min(firstComponent.length - 1, value + 1))} className="min-h-10 flex-1 rounded-xl bg-black text-[11px] font-bold text-white disabled:opacity-35">Ligne suivante →</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["<h1>…</h1>", "Balise", "Structure un élément visible. La balise fermante commence par /."],
            ["{name}", "Accolades", "Insèrent une valeur JavaScript à l’intérieur du JSX."],
            ["className=\"…\"", "Attribut", "Ajoute du style ou une information à une balise React."],
            ["const value = …", "Variable", "Donne un nom clair à une valeur pour pouvoir la réutiliser."],
          ].map(([syntax, name, desc]) => <div key={name} className="bg-white p-4"><code className="text-[11px] font-black text-violet-700">{syntax}</code><p className="mt-2 text-xs font-black">{name}</p><p className="mt-1 text-[10px] leading-relaxed text-gray-500">{desc}</p></div>)}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div><p className="text-[10px] font-black uppercase tracking-wider text-[#16b277]">Terminal</p><h3 className="text-sm font-black">Lancer le projet, exactement</h3></div>
            <button onClick={() => copy(quickStart, "run")} className="rounded-lg bg-gray-100 px-3 py-1.5 text-[10px] font-bold hover:bg-gray-200">{copied === "run" ? "✓ Copié" : "Copier tout"}</button>
          </div>
          <pre className="overflow-x-auto bg-[#0d0d0d] p-4 text-[11px] leading-7 text-[#d4d4d4]">{quickStart}</pre>
          <div className="grid gap-px bg-gray-100 sm:grid-cols-3">
            {[['npm install','Télécharge les packages de package.json'],['npm run dev','Mode travail + mise à jour automatique'],['npm run build','Vérifie le site comme en production']].map(([cmd, desc]) => <div key={cmd} className="bg-white p-3"><code className="text-[11px] font-black text-[#16b277]">{cmd}</code><p className="mt-1 text-[10px] leading-relaxed text-gray-500">{desc}</p></div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Première mission</p><h3 className="text-sm font-black">Checklist pratique</h3></div><span className="text-xs font-black text-[#16b277]">{progress}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#3ecf4c] transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-3 space-y-1.5">
            {checklist.map((label, i) => <button key={label} onClick={() => toggleDone(i)} className="flex w-full items-start gap-2 rounded-xl p-2 text-left hover:bg-gray-50"><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] ${done[i] ? 'border-[#16b277] bg-[#16b277] text-white' : 'border-gray-300'}`}>{done[i] ? '✓' : ''}</span><span className={`text-[11px] leading-relaxed ${done[i] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{label}</span></button>)}
          </div>
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800"><strong>Important :</strong> travaille toujours sur une petite modification. Si une erreur apparaît, lis d&apos;abord la première ligne rouge dans le terminal.</p>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-violet-500">Le modèle mental Next.js</p>
        <h3 className="mt-0.5 text-lg font-black">Un dossier devient une URL</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">Avec l&apos;App Router, le nom du dossier définit la route. Les noms spéciaux ci-dessous indiquent à Next.js le rôle du fichier.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[['app/page.tsx','URL /','La page d’accueil. page.tsx rend une URL visible.'],['app/produits/page.tsx','URL /produits','Chaque dossier ajoute une partie à l’URL.'],['app/layout.tsx','Cadre partagé','Entoure les pages : polices, Header, Footer et providers.'],['app/api/products/route.ts','API /api/products','GET, POST, PUT et DELETE exécutés uniquement sur le serveur.']].map(([file, role, desc]) => <div key={file} className="rounded-xl border border-gray-100 bg-gray-50 p-3"><code className="text-[10px] font-black text-violet-700">{file}</code><p className="mt-2 text-xs font-black">{role}</p><p className="mt-1 text-[10px] leading-relaxed text-gray-500">{desc}</p></div>)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-black text-blue-800">Server Component — par défaut</p><p className="mt-1 text-[11px] leading-relaxed text-blue-700">Peut lire la base de données et les secrets. Envoie moins de JavaScript au navigateur. Utilise-le tant que tu n&apos;as pas besoin de clics, de state ou du navigateur.</p></div>
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-xs font-black text-orange-800">Client Component — &quot;use client&quot;</p><p className="mt-1 text-[11px] leading-relaxed text-orange-700">Nécessaire pour useState, useEffect, onClick et localStorage. Il s&apos;exécute dans le navigateur : ne lui donne jamais une clé secrète.</p></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Exemple complet</p><h3 className="text-sm font-black">Créer une page produits</h3></div><button onClick={() => copy(example, "example")} className="rounded-lg bg-gray-100 px-3 py-1.5 text-[10px] font-bold hover:bg-gray-200">{copied === "example" ? "✓ Copié" : "Copier le code"}</button></div>
        <div className="grid lg:grid-cols-[1.35fr_.65fr]">
          <pre className="max-h-[520px] overflow-auto bg-[#0d0d0d] p-4 text-[10px] leading-[1.75] text-[#d4d4d4]">{example}</pre>
          <div className="space-y-3 p-4">
            {[['1. Crée le fichier','Dans VS Code : app → nouveau dossier produits → nouveau fichier page.tsx.'],['2. Colle le code','Enregistre avec Ctrl+S. Next.js recompile automatiquement.'],['3. Regarde le résultat','Ouvre http://localhost:3000/produits dans ton navigateur.'],['4. Expérimente','Change le texte, le prix, les couleurs et les classes grid. Une chose à la fois.'],['5. Vérifie','Quand le résultat te plaît, exécute npm run build.']].map(([title, desc]) => <div key={title}><p className="text-[11px] font-black text-gray-800">{title}</p><p className="mt-0.5 text-[10px] leading-relaxed text-gray-500">{desc}</p></div>)}
          </div>
        </div>
      </section>

      <section>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#16b277]">Design system réel</p><h3 className="mt-0.5 text-lg font-black">Les couleurs de L&apos;ecomax et leur code</h3><p className="mt-1 text-xs text-gray-500">Clique une couleur pour copier son code HEX. Une couleur doit toujours avoir un rôle, pas seulement être jolie.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {palette.map(color => <button key={color.hex} onClick={() => copy(color.hex, color.hex)} className="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-transform hover:-translate-y-0.5"><div className={`flex h-20 items-end p-3 ${color.text}`} style={{ backgroundColor: color.hex }}><code className="rounded bg-black/15 px-2 py-1 text-[11px] font-black">{copied === color.hex ? '✓ Copié' : color.hex}</code></div><div className="p-3"><p className="text-xs font-black">{color.name}</p><p className="mt-1 text-[10px] leading-relaxed text-gray-500">{color.use}</p></div></button>)}
        </div>
        <div className="mt-3 rounded-xl bg-[#0d0d0d] p-4 font-mono text-[10px] leading-6 text-white/70"><span className="text-[#6a9955]">{'// HEX direct dans Tailwind'}</span><br />className=<span className="text-[#ce9178]">&quot;bg-[#3ecf4c] text-black hover:bg-[#16b277]&quot;</span><br /><span className="text-[#6a9955]">{'// Couleur du design system (tailwind.config.js)'}</span><br />className=<span className="text-[#ce9178]">&quot;bg-brand-500 text-white hover:bg-brand-600&quot;</span></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[['Tu es bloqué par une erreur ?','Ouvre la méthode de diagnostic : terminal, navigateur, réseau et base de données.','debug'],['Tu veux comprendre les données ?','Apprends tables, SQL, RLS, authentification et requêtes Supabase.','supabase'],['Tu veux explorer un vrai fichier ?','Cherche une page ou un composant et lis ses imports, son export et ses fonctions.','files']].map(([title, desc, target]) => <button key={target} onClick={() => onNavigate(target)} className="min-h-12 rounded-2xl border border-gray-100 bg-white p-4 text-start shadow-sm transition hover:border-[#3ecf4c]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b277]"><p className="text-sm font-black sm:text-xs">{title}</p><p className="mt-1 text-[13px] leading-relaxed text-gray-500 sm:text-[11px]">{desc}</p><span className="mt-3 inline-block text-xs font-black text-[#16b277] sm:text-[10px]">Ouvrir →</span></button>)}
      </section>
        </div>
      </details>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TAB_IDS = ["start","tutor","game","academy","hero","cours","mentor","guide","debug","supabase","deploy","arch","files","tech","env","pages","search"] as const;
type TabId = typeof TAB_IDS[number];

const TAB_GROUPS: { id: "learn" | "build" | "reference"; tabs: TabId[] }[] = [
  { id: "learn", tabs: ["start", "tutor", "game", "academy", "hero", "cours", "mentor", "guide", "debug"] },
  { id: "build", tabs: ["supabase", "deploy", "arch"] },
  { id: "reference", tabs: ["files", "tech", "env", "pages", "search"] },
];

function TabIcon({ id, className = "h-4 w-4" }: { id: TabId; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" {...common}>
      {id === "start" && <><path d="m12 3-1.2 4.1a5 5 0 0 1-3.4 3.4L3 12l4.4 1.5a5 5 0 0 1 3.4 3.4L12 21l1.2-4.1a5 5 0 0 1 3.4-3.4L21 12l-4.4-1.5a5 5 0 0 1-3.4-3.4L12 3Z"/><path d="m19 3 .3 1.2a2 2 0 0 0 1.5 1.5L22 6l-1.2.3a2 2 0 0 0-1.5 1.5L19 9l-.3-1.2a2 2 0 0 0-1.5-1.5L16 6l1.2-.3a2 2 0 0 0 1.5-1.5L19 3Z"/></>}
      {id === "game" && <><path d="M8 3h8l1 4h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4h-1l-2-3h-4l-2 3H7a4 4 0 0 1-4-4V9a2 2 0 0 1 2-2h2l1-4Z"/><path d="M8 11v4M6 13h4M16.5 12.5h.01M18.5 14.5h.01"/></>}
      {id === "academy" && <><path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12.5V17c2.7 2 7.3 2 10 0v-4.5M21 10v6"/></>}
      {id === "hero" && <><path d="M14.5 5.5c2.2-2.2 4.8-2.4 5.8-2.3.1 1-.1 3.6-2.3 5.8l-5.5 5.5-3-3 5-6Z"/><path d="m9.5 11.5-4.4.5-2 2 5 1M12.5 14.5l-.5 4.4-2 2-1-5M15.5 8.5h.01M5 19c1.4 0 2.5-1.1 2.5-2.5C6.1 16.5 5 17.6 5 19Z"/></>}
      {id === "cours" && <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/></>}
      {(id === "mentor" || id === "tutor") && <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0M18.5 4.5 21 7l-2.5 2.5"/></>}
      {id === "guide" && <><path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v4h4M8 12h6M8 16h6"/></>}
      {id === "debug" && <><path d="M8 9h8v7a4 4 0 0 1-8 0V9ZM9 5.5a3 3 0 0 1 6 0V9M4 13h4M16 13h4M5 8l3 2M19 8l-3 2M5 19l3-2M19 19l-3-2"/></>}
      {id === "supabase" && <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>}
      {id === "deploy" && <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>}
      {id === "arch" && <><rect x="3" y="4" width="7" height="5" rx="1"/><rect x="14" y="4" width="7" height="5" rx="1"/><rect x="8.5" y="15" width="7" height="5" rx="1"/><path d="M6.5 9v3h11V9M12 12v3"/></>}
      {id === "files" && <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/>}
      {id === "tech" && <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>}
      {id === "env" && <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>}
      {id === "pages" && <><path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v4h4"/></>}
      {id === "search" && <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>}
    </svg>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HowItWasBuiltPage() {
  const [tab, setTab] = useState<TabId>("start");
  const [lang, setLang] = useState<Lang>("fr");
  const u = UI[lang];
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const LANG_FLAGS: Record<Lang, string> = { fr: "🇫🇷", en: "🇬🇧", ar: "🇸🇦" };

  useEffect(() => {
    const openDeepLinkedCourse = () => {
      if (window.location.hash.startsWith("#academy/")) setTab("academy");
      else if (window.location.hash.startsWith("#files")) setTab("files");
      else if (window.location.hash.startsWith("#tutor")) setTab("tutor");
      else if (!window.location.hash) setTab("start");
    };
    openDeepLinkedCourse();
    window.addEventListener("hashchange", openDeepLinkedCourse);
    return () => window.removeEventListener("hashchange", openDeepLinkedCourse);
  }, []);

  useEffect(() => {
    const activeTab = document.getElementById("course-tab-" + tab);
    if (activeTab && tabListRef.current) activeTab.scrollIntoView({ block: "nearest", inline: "center" });
  }, [tab]);

  function selectTab(id: TabId) {
    setTab(id);
    if (id === "tutor") window.history.replaceState(null, "", window.location.pathname + window.location.search + "#tutor");
    else if (window.location.hash === "#tutor") window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if ((id !== "academy" && window.location.hash.startsWith("#academy/")) || (id !== "files" && window.location.hash.startsWith("#files"))) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panelRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, id: TabId) {
    const index = TAB_IDS.indexOf(id);
    let nextIndex = index;
    const visualDirection = lang === "ar" ? -1 : 1;
    if (event.key === "ArrowRight") nextIndex = (index + visualDirection + TAB_IDS.length) % TAB_IDS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - visualDirection + TAB_IDS.length) % TAB_IDS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TAB_IDS.length - 1;
    else return;
    event.preventDefault();
    const next = TAB_IDS[nextIndex];
    selectTab(next);
    document.getElementById("course-tab-" + next)?.focus();
  }

  const activeTabIndex = TAB_IDS.indexOf(tab);
  const shortTitle = lang === "en" ? "How it was built" : lang === "ar" ? "كيف بُني الموقع" : "Comment c'est construit";
  const groupLabels = lang === "en"
    ? { learn: "Learn", build: "Build L'ecomax", reference: "Explore the project" }
    : lang === "ar"
      ? { learn: "التعلّم", build: "بناء L'ecomax", reference: "استكشاف المشروع" }
      : { learn: "Apprendre", build: "Construire L'ecomax", reference: "Explorer le projet" };
  const tabLabel = (id: TabId) => id === "game"
    ? (lang === "en" ? "Code Game" : lang === "ar" ? "لعبة البرمجة" : "Jeu de code")
    : u.tabs[id];
  const previousLabel = lang === "en" ? "Previous section" : lang === "ar" ? "القسم السابق" : "Section précédente";
  const nextLabel = lang === "en" ? "Next section" : lang === "ar" ? "القسم التالي" : "Section suivante";

  return (
    <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="-m-4 mb-0 min-h-full bg-[#f4f4f2] sm:m-0">
      {/* Header */}
      <div id="course-page-header" className="sticky -top-4 z-40 border-b border-gray-200/80 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl md:-top-6 lg:-top-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d0d0d] shadow-sm sm:h-9 sm:w-9">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black text-gray-950 sm:text-[15px]"><span className="sm:hidden">{shortTitle}</span><span className="hidden sm:inline">{u.title}</span></h1>
              <p className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block truncate">{u.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Language switcher */}
            <div className="flex gap-0.5 rounded-xl bg-gray-100 p-0.5" role="group" aria-label={lang === "ar" ? "اللغة" : lang === "en" ? "Language" : "Langue"}>
              {(["fr","en","ar"] as Lang[]).map(l => (
                <button key={l} aria-label={l === "fr" ? "Français" : l === "en" ? "English" : "العربية"} aria-pressed={lang === l} onClick={() => setLang(l)}
                  className={`flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b277] sm:min-h-9 sm:min-w-0 ${lang === l ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  <span className="hidden sm:inline" aria-hidden="true">{LANG_FLAGS[l]}</span>
                  <span className={l === "ar" ? "" : "uppercase"}>{l === "ar" ? "ع" : l}</span>
                </button>
              ))}
            </div>
            {["Next.js 15","Vercel"].map(b => (
              <span key={b} className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-gray-100 text-gray-600 border-gray-200">{b}</span>
            ))}
          </div>
        </div>
        {/* Mobile course navigator */}
        <div id="mobile-course-navigator" className="border-t border-gray-100 px-4 pb-3 pt-2 md:hidden">
          <div className="mx-auto max-w-xl">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-bold text-gray-500">
              <span>{lang === "en" ? "Current section" : lang === "ar" ? "القسم الحالي" : "Section actuelle"}</span>
              <span dir="ltr" className="tabular-nums text-gray-400">{activeTabIndex + 1} / {TAB_IDS.length}</span>
            </div>
            <div className="flex items-stretch gap-2">
              <button type="button" aria-label={previousLabel} title={previousLabel} disabled={activeTabIndex === 0} onClick={() => selectTab(TAB_IDS[activeTabIndex - 1])}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b277] disabled:cursor-not-allowed disabled:opacity-30">
                <svg aria-hidden="true" className={lang === "ar" ? "rotate-180" : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{lang === "en" ? "Choose a section" : lang === "ar" ? "اختر قسمًا" : "Choisir une section"}</span>
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[#16b277]"><TabIcon id={tab} className="h-[18px] w-[18px]" /></span>
                <select id="course-section-select" value={tab} onChange={event => selectTab(event.target.value as TabId)}
                  className="h-12 w-full appearance-none truncate rounded-xl border border-gray-200 bg-white ps-10 pe-9 text-base font-extrabold text-gray-950 shadow-sm outline-none transition focus:border-[#16b277] focus:ring-2 focus:ring-[#16b277]/20">
                  {TAB_GROUPS.map(group => (
                    <optgroup key={group.id} label={groupLabels[group.id]}>
                      {group.tabs.map(id => <option key={id} value={id}>{tabLabel(id)}</option>)}
                    </optgroup>
                  ))}
                </select>
                <svg aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6"/></svg>
              </label>
              <button type="button" aria-label={nextLabel} title={nextLabel} disabled={activeTabIndex === TAB_IDS.length - 1} onClick={() => selectTab(TAB_IDS[activeTabIndex + 1])}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-[#0d0d0d] text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b277] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
                <svg aria-hidden="true" className={lang === "ar" ? "rotate-180" : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100" aria-hidden="true"><div className="h-full rounded-full bg-[#3ecf4c] transition-[width] duration-300" style={{ width: `${((activeTabIndex + 1) / TAB_IDS.length) * 100}%` }} /></div>
          </div>
        </div>

        {/* Desktop/tablet navigation — grouped and allowed to wrap, never clipped. */}
        <div id="course-desktop-tabs" className="hidden border-t border-gray-100 bg-[#fafafa] md:block">
          <div ref={tabListRef} role="tablist" aria-label={u.title} className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-2.5">
            {TAB_GROUPS.map((group, groupIndex) => (
              <div key={group.id} role="presentation" className={`flex flex-wrap items-center gap-1 rounded-2xl border border-gray-200/80 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,.04)] ${groupIndex > 0 ? "xl:ms-1" : ""}`}>
                <span className="hidden px-2 text-[9px] font-black uppercase tracking-[.14em] text-gray-400 2xl:inline-flex">{groupLabels[group.id]}</span>
                {group.tabs.map(id => (
                  <button key={id} id={"course-tab-" + id} role="tab" aria-selected={tab === id} aria-controls="course-tab-panel" tabIndex={tab === id ? 0 : -1} onKeyDown={event => handleTabKeyDown(event, id)} onClick={() => selectTab(id)}
                    className={`relative flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[11px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16b277] focus-visible:ring-offset-1 ${
                      tab === id
                        ? "bg-gray-950 text-white shadow-sm"
                        : id === "game"
                          ? "bg-amber-50 text-amber-900 hover:bg-amber-100"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                    }`}>
                    <span className={tab === id ? "text-[#3ecf4c]" : id === "game" ? "text-amber-600" : "text-gray-400"}><TabIcon id={id} /></span>
                    <span>{tabLabel(id)}</span>
                    {id === "game" && <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide ${tab === id ? "bg-[#3ecf4c] text-black" : "bg-amber-200 text-amber-900"}`}>{lang === "fr" ? "Nouveau" : lang === "ar" ? "جديد" : "New"}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        ref={panelRef}
        id="course-tab-panel"
        role="tabpanel"
        aria-labelledby={"course-tab-" + tab}
        tabIndex={-1}
        className="mx-auto min-w-0 max-w-7xl scroll-mt-36 px-3 py-4 outline-none sm:px-6 sm:py-6 md:scroll-mt-40"
      >
        {tab === "hero"   && <HeroSection lang={lang} />}
        {tab === "start"  && <StartHereSection lang={lang} onNavigate={id => selectTab(id as TabId)} />}
        {tab === "tutor" && <CodingTutor lang={lang} />}
        {tab === "game" && <CodeCoachGame lang={lang} />}
        {tab === "academy" && <AcademySection lang={lang} />}
        {tab === "arch"   && <ArchSection lang={lang} />}
        {tab === "files"  && <CodeLibrary lang={lang} />}
        {tab === "tech"   && <TechSec lang={lang} />}
        {tab === "env"    && <EnvSec lang={lang} />}
        {tab === "pages"  && <PagesSection lang={lang} />}
        {tab === "search" && <><CodeLibrary lang={lang} /><details className="mt-6 rounded-2xl border bg-white p-4"><summary className="min-h-12 cursor-pointer font-bold">{translate(lang, "Rechercher aussi dans les explications", "Also search the explanations", "ابحث أيضًا في الشروحات")}</summary><SearchSec lang={lang} /></details></>}
        {tab === "guide"    && <GuideSection />}
        {tab === "debug"    && <DebugSection />}
        {tab === "supabase" && <SupabaseSection />}
        {tab === "deploy"   && <DeploySection />}
        {tab === "cours"    && <CoursSection />}
        {tab === "mentor"   && <MentorSection />}
      </div>

      {/* Footer */}
      <div className="mx-auto max-w-7xl px-3 pb-8 sm:px-6">
        <div className="bg-[#0d0d0d] rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm">
              {lang === "en" ? "Real source code — Live filesystem via API"
               : lang === "ar" ? "كود المصدر الحقيقي — نظام ملفات حي عبر API"
               : "Code source réel — Filesystem live via API"}
            </p>
            <p className="text-white/40 text-[12px] mt-0.5">
              {lang === "en" ? "Explorer reads disk directly · No fake data · Admin-only"
               : lang === "ar" ? "المستكشف يقرأ القرص مباشرة · لا بيانات مزيفة · للإدارة فقط"
               : "Explorateur lit directement le disque · Aucune donnée fictive · Admin-only"}
            </p>
          </div>
          <details className="w-full border-t border-white/10 pt-2 sm:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-bold text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf4c]">
              <span>{lang === "en" ? "Project technologies" : lang === "ar" ? "تقنيات المشروع" : "Technologies du projet"}</span>
              <span aria-hidden="true" className="text-white/35">＋</span>
            </summary>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Next.js 15","React 19","TypeScript 5.7","Supabase","Vercel","Resend","OpenAI","web-push"].map(t => (
                <span key={t} className="inline-flex items-center rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/60">{t}</span>
              ))}
            </div>
          </details>
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {["Next.js 15","React 19","TypeScript 5.7","Supabase","Vercel","Resend","OpenAI","web-push"].map(t => (
              <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border border-white/20 text-white/60 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// GuideSection, DebugSection, SupabaseSection, DeploySection
// Appended to app/admin/how-it-was-built/page.tsx

function GuideSection() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    {
      icon: "🗂️", title: "Pourquoi Next.js App Router ?",
      why: "Le App Router (Next.js 13+) permet le rendu côté serveur (SSR), la génération statique (ISR), et les composants serveur React — le tout sans configuration. C'est plus rapide qu'une SPA classique pour le SEO et le chargement initial.",
      code: [
        "// app/page.tsx — Server component par défaut",
        "export const revalidate = 60; // ISR: re-générer toutes les 60s",
        "",
        "export default async function HomePage() {",
        "  // Ce code tourne sur le SERVEUR — jamais exposé au client",
        "  const data = await fetch('https://api.supabase.co/...', {",
        "    headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }",
        "  });",
        "  return <div>{/* data est déjà chargée, pas de spinner */}</div>;",
        "}",
      ].join("\n"),
      tip: "Règle : pages dans app/ = serveur par défaut. Ajoutez \"use client\" seulement quand vous avez besoin de useState, useEffect, ou événements browser."
    },
    {
      icon: "🗄️", title: "Comment fonctionne Supabase ?",
      why: "Supabase est une alternative open-source à Firebase. Il donne PostgreSQL + Auth + Storage + Realtime + API REST auto-générée. Ici on l'utilise comme base de données principale pour produits, commandes, reviews, Ecomedia, etc.",
      code: [
        "// lib/supabase.ts — Client côté navigateur (clé anon publique)",
        "import { createClient } from '@supabase/supabase-js';",
        "export const supabase = createClient(",
        "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
        "  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!",
        ");",
        "",
        "// Dans une API route — service role bypasse les RLS",
        "const sb = createClient(",
        "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
        "  process.env.SUPABASE_SERVICE_ROLE_KEY! // jamais dans NEXT_PUBLIC_",
        ");",
        "",
        "// Lecture",
        "const { data } = await sb.from('products').select('*').eq('active', true);",
        "",
        "// Insertion",
        "const { error } = await sb.from('orders').insert({ ...orderData });",
        "",
        "// Upsert (insert ou update si doublon)",
        "await sb.from('ecomedia_likes').upsert(",
        "  { post_id, visitor_id },",
        "  { onConflict: 'post_id,visitor_id', ignoreDuplicates: true }",
        ");",
      ].join("\n"),
      tip: "NEXT_PUBLIC_SUPABASE_ANON_KEY est sûre à exposer — elle est limitée par les Row Level Security (RLS) policies. La SERVICE_ROLE_KEY contourne tout — à garder secrète côté serveur uniquement."
    },
    {
      icon: "🔐", title: "Authentication Admin — Comment ça marche ?",
      why: "L'admin n'utilise PAS Supabase Auth. Il utilise un cookie HMAC-SHA256 signé avec un secret. Ça évite de dépendre d'un service externe pour l'accès critique.",
      code: [
        "// lib/admin-session.ts (simplifié)",
        "import { createHmac } from 'crypto';",
        "const SECRET = process.env.ADMIN_SESSION_SECRET!;",
        "",
        "export function createSessionToken(payload: object): string {",
        "  const data = JSON.stringify(payload);",
        "  const sig = createHmac('sha256', SECRET).update(data).digest('hex');",
        "  return Buffer.from(JSON.stringify({ data, sig })).toString('base64');",
        "}",
        "",
        "export function verifySessionToken(token: string): object | null {",
        "  try {",
        "    const { data, sig } = JSON.parse(Buffer.from(token, 'base64').toString());",
        "    const expected = createHmac('sha256', SECRET).update(data).digest('hex');",
        "    if (sig !== expected) return null; // falsifié",
        "    return JSON.parse(data);",
        "  } catch { return null; }",
        "}",
        "",
        "// Dans une API route admin:",
        "const session = verifySessionToken(req.cookies.get('admin_session')?.value ?? '');",
        "if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });",
      ].join("\n"),
      tip: "Le middleware.ts vérifie ce cookie sur TOUTES les routes /admin/* avant même que la page charge. Si invalide → redirect /connexion."
    },
    {
      icon: "🛒", title: "Cycle complet d'une commande",
      why: "Comprendre le flux complet aide à déboguer les problèmes de commande. De l'ajout au panier jusqu'à l'email de confirmation.",
      code: [
        "// 1. Client ajoute au panier (CartContext.tsx — localStorage)",
        "addToCart(product, selectedColor, selectedSize);",
        "",
        "// 2. Checkout (app/checkout/page.tsx) — formulaire client",
        "//    Valide les données, calcule le total",
        "",
        "// 3. API POST /api/orders (app/api/orders/route.ts)",
        "//    Insère dans Supabase → table 'orders'",
        "const { data: order } = await sb.from('orders').insert({",
        "  customer_name, customer_email, customer_phone,",
        "  items: cart, total, status: 'pending'",
        "}).select().single();",
        "",
        "// 4. Email de confirmation (app/api/send-confirmation/route.ts)",
        "//    Resend API → email HTML personnalisé",
        "await resend.emails.send({",
        "  from: \"L'ecomax <noreply@lecomax.com>\",",
        "  to: customer_email,",
        "  subject: `Commande #${order.order_number} confirmée`,",
        "  html: emailTemplate(order)",
        "});",
        "",
        "// 5. Admin voit la commande dans /admin/commandes",
        "// 6. Admin change status → 'shipped' / 'delivered'",
        "// 7. Client voit le status sur /suivre-commande",
      ].join("\n"),
      tip: "Si une commande ne reçoit pas d'email : vérifiez RESEND_API_KEY dans Vercel, et vérifiez que le domaine lecomax.com est vérifié dans resend.com → Domains."
    },
    {
      icon: "🔄", title: "Comment les API Routes Next.js fonctionnent",
      why: "Les routes dans app/api/ sont des serverless functions sur Vercel — elles tournent sur Node.js côté serveur, invisible au navigateur.",
      code: [
        "// app/api/products/route.ts",
        "import { NextRequest, NextResponse } from 'next/server';",
        "",
        "// GET /api/products?category=chaussures",
        "export async function GET(req: NextRequest) {",
        "  const { searchParams } = new URL(req.url);",
        "  const category = searchParams.get('category');",
        "  ",
        "  // Validation d'entrée — toujours valider!",
        "  if (category && category.length > 50) {",
        "    return NextResponse.json({ error: 'Invalid' }, { status: 400 });",
        "  }",
        "  ",
        "  const { data } = await sb.from('products')",
        "    .select('*')",
        "    .eq('active', true)",
        "    .eq('category', category ?? 'all');",
        "  ",
        "  return NextResponse.json(data, {",
        "    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' }",
        "  });",
        "}",
        "",
        "// POST /api/products (admin only)",
        "export async function POST(req: NextRequest) {",
        "  const session = verifySessionToken(req.cookies.get('admin_session')?.value ?? '');",
        "  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });",
        "  const body = await req.json();",
        "  const { data, error } = await sb.from('products').insert(body).select().single();",
        "  if (error) return NextResponse.json({ error: error.message }, { status: 500 });",
        "  return NextResponse.json(data, { status: 201 });",
        "}",
      ].join("\n"),
      tip: "Codes HTTP: 200 OK, 201 Created, 400 Bad Request (validation), 401 Unauthorized, 404 Not Found, 500 Server Error. Toujours retourner le bon code!"
    },
    {
      icon: "📦", title: "Images produits — Supabase Storage",
      why: "Les images sont uploadées dans Supabase Storage (bucket 'product-images'), pas sur le serveur Vercel (éphémère). L'URL publique est stockée dans la table products.",
      code: [
        "// Upload depuis l'admin (app/admin/products/page.tsx)",
        "const file = event.target.files[0];",
        "const ext = '.' + file.name.split('.').pop();",
        "const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;",
        "",
        "const { error } = await supabase.storage",
        "  .from('product-images')",
        "  .upload(filename, file, { contentType: file.type });",
        "",
        "if (error) throw error;",
        "",
        "// Obtenir l'URL publique",
        "const { data: { publicUrl } } = supabase.storage",
        "  .from('product-images')",
        "  .getPublicUrl(filename);",
        "// publicUrl = 'https://xxx.supabase.co/storage/v1/object/public/product-images/...'",
        "",
        "// Utiliser dans un produit",
        "await sb.from('products').update({ images: [publicUrl] }).eq('id', productId);",
        "",
        "// Dans next.config.js — autoriser Supabase pour next/image",
        "remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }]",
      ].join("\n"),
      tip: "Supabase Storage est gratuit jusqu'à 1GB. Les images sont servies via un CDN global. TOUJOURS utiliser next/image (pas <img>) pour l'optimisation automatique."
    },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">📖 Guide de construction</h2>
        <p className="text-sm text-gray-500 mt-1">Comment fonctionne chaque partie du site, avec code réel et explications.</p>
      </div>
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            aria-controls={`guide-answer-${i}`}
            className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-4 text-start transition-colors hover:bg-neutral-50 sm:px-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="font-black text-[15px] text-gray-900">{item.title}</span>
            </div>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${open === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open === i && (
            <div id={`guide-answer-${i}`} className="border-t border-neutral-100 px-4 pb-4 sm:px-5 sm:pb-5">
              <p className="mb-4 mt-4 text-sm leading-relaxed text-neutral-600">{item.why}</p>
              <pre dir="ltr" className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#1e1e1e] p-4 font-mono text-[12px] leading-[1.7] text-[#d4d4d4] sm:text-[11px]"><code>{item.code}</code></pre>
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <span className="text-base shrink-0">💡</span>
                <p className="text-[13px] leading-relaxed text-amber-800 sm:text-[12px]">{item.tip}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DebugSection() {
  const issues = [
    {
      icon: "🔴", tag: "CRITIQUE", title: "Erreur de build TypeScript",
      symptom: "npx next build échoue avec 'Type error'",
      cause: "TypeScript est strict — variable potentiellement null, type manquant, ou import incorrect.",
      fix: [
        "// 1. Lire l'erreur exacte",
        "// Ex: \"Type error: 'selectedConv' is possibly 'null'\"",
        "",
        "// 2. Solutions:",
        "const name = selectedConv?.name ?? 'Inconnu'; // optional chaining",
        "const name = selectedConv!.name; // non-null assertion (si vous êtes sûr)",
        "",
        "// Ajouter un type à une variable",
        "const [data, setData] = useState<MonType | null>(null);",
        "",
        "// 3. Pour déboguer localement:",
        "npx next build 2>&1 | grep 'Type error'",
        "npx tsc --noEmit  // vérifie les types sans builder",
      ].join("\n"),
      color: "red"
    },
    {
      icon: "⚡", tag: "COURANT", title: "API 401 Unauthorized en production",
      symptom: "Fonctionne en local, mais 401 sur Vercel",
      cause: "Variables d'environnement manquantes sur Vercel, ou ADMIN_SESSION_SECRET différent.",
      fix: [
        "// 1. Vérifier Vercel Dashboard → Settings → Environment Variables",
        "//    Toutes les variables de .env.local doivent être dans Vercel",
        "",
        "// 2. Vérifier que ADMIN_SESSION_SECRET est IDENTIQUE local et prod",
        "//    Si différent → les tokens créés en local ne valent rien en prod",
        "",
        "// 3. Logs Vercel en temps réel:",
        "npx vercel logs lecomax.com --follow",
        "",
        "// 4. Tester dans DevTools:",
        "// Application → Cookies → admin_session",
        "// Supprimer le cookie → se reconnecter",
      ].join("\n"),
      color: "yellow"
    },
    {
      icon: "🖼️", tag: "COURANT", title: "Images qui n'apparaissent pas",
      symptom: "Image 404 ou erreur 'hostname not configured'",
      cause: "Le domaine de l'image n'est pas dans remotePatterns de next.config.js",
      fix: [
        "// next.config.js",
        "images: {",
        "  remotePatterns: [",
        "    { protocol: 'https', hostname: '*.supabase.co' },",
        "    { protocol: 'https', hostname: 'images.unsplash.com' },",
        "    // Ajouter votre domaine ici",
        "  ]",
        "}",
        "",
        "// Après modification next.config.js → redémarrer:",
        "// ctrl+C → npm run dev",
        "",
        "// Debugger: F12 → Network → Images → voir l'URL complète",
      ].join("\n"),
      color: "yellow"
    },
    {
      icon: "🗄️", tag: "SUPABASE", title: "permission denied for table",
      symptom: "Error 403 ou 'permission denied' dans les logs",
      cause: "Row Level Security (RLS) activée mais aucune policy correspondante définie.",
      fix: [
        "-- Dans Supabase → SQL Editor:",
        "",
        "-- Voir les policies actives:",
        "SELECT * FROM pg_policies WHERE tablename = 'ma_table';",
        "",
        "-- Option 1: Policy permissive (pour tables admin)",
        "CREATE POLICY 'allow_all' ON ma_table USING (true) WITH CHECK (true);",
        "",
        "-- Option 2: Lecture publique seulement",
        "CREATE POLICY 'public_read' ON ma_table FOR SELECT USING (true);",
        "",
        "-- Option 3: GRANT si manquant",
        "GRANT ALL ON TABLE ma_table TO postgres, service_role, authenticated, anon;",
      ].join("\n"),
      color: "yellow"
    },
    {
      icon: "🔄", tag: "REACT", title: "useEffect se déclenche en boucle",
      symptom: "API appelée des centaines de fois par seconde",
      cause: "Dépendance dans useEffect qui change à chaque render (objet créé inline)",
      fix: [
        "// MAUVAIS — options est un nouvel objet à chaque render",
        "useEffect(() => {",
        "  fetchData(options);",
        "}, [options]); // boucle infinie!",
        "",
        "// BON — dépendances primitives seulement",
        "useEffect(() => {",
        "  fetchData(userId, category);",
        "}, [userId, category]);",
        "",
        "// Pour exécuter une seule fois:",
        "useEffect(() => {",
        "  fetchData();",
        "}, []); // tableau vide = seulement au montage",
        "",
        "// Éviter double appel (React StrictMode dev):",
        "const initialized = useRef(false);",
        "useEffect(() => {",
        "  if (initialized.current) return;",
        "  initialized.current = true;",
        "  fetchData();",
        "}, []);",
      ].join("\n"),
      color: "blue"
    },
    {
      icon: "🚀", tag: "PERF", title: "Site lent — Optimisations clés",
      symptom: "Lighthouse score < 80 ou chargement > 3s",
      cause: "Images non-optimisées, bundle JS trop grand, pas de cache",
      fix: [
        "// 1. Utiliser next/image au lieu de <img>",
        "import Image from 'next/image';",
        "<Image src={url} alt='' width={800} height={600} quality={75} />",
        "",
        "// 2. Lazy loading des composants lourds",
        "const Heavy = dynamic(() => import('@/components/Heavy'), {",
        "  loading: () => <div>Chargement...</div>",
        "});",
        "",
        "// 3. ISR pour les pages avec données",
        "export const revalidate = 60;",
        "",
        "// 4. Cache-Control dans les API routes",
        "return NextResponse.json(data, {",
        "  headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' }",
        "});",
        "",
        "// 5. Imports ciblés (éviter les grosses librairies)",
        "// MAUVAIS: import _ from 'lodash'; (70KB!)",
        "// BON:    import debounce from 'lodash/debounce';",
      ].join("\n"),
      color: "green"
    },
    {
      icon: "🔍", tag: "OUTILS", title: "Outils de débogage essentiels",
      symptom: "Vous ne savez pas où chercher le bug",
      cause: "Ne pas utiliser les bons outils",
      fix: [
        "// 1. Console browser (F12 → Console)",
        "console.log('Data:', JSON.stringify(data, null, 2));",
        "",
        "// 2. Network tab (F12 → Network → Fetch/XHR)",
        "//    Voir les appels API, headers, réponses",
        "",
        "// 3. Logs Vercel en temps réel:",
        "npx vercel logs lecomax.com --follow",
        "",
        "// 4. Vérifier les vars d'env dans une API route:",
        "console.log('ENV CHECK:', {",
        "  supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,",
        "  service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,",
        "  resend: !!process.env.RESEND_API_KEY,",
        "});",
        "",
        "// 5. Logs Supabase:",
        "//    Dashboard → Logs → API Logs ou Postgres Logs",
        "",
        "// 6. TypeScript check sans build:",
        "npx tsc --noEmit",
      ].join("\n"),
      color: "purple"
    },
  ];

  const colors: Record<string, string> = {
    red: "bg-red-50 border-red-200 text-red-700",
    yellow: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">🐛 Guide de débogage</h2>
        <p className="text-sm text-gray-500 mt-1">Problèmes courants et leurs solutions exactes — avec le code.</p>
      </div>
      {issues.map((issue, i) => (
        <div key={i} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            aria-controls={`debug-answer-${i}`}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-neutral-50 sm:px-5"
          >
            <span className="text-lg">{issue.icon}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${colors[issue.color]}`}>{issue.tag}</span>
            <span className="font-bold text-[14px] text-gray-900 flex-1">{issue.title}</span>
            <span className="text-[11px] text-neutral-400 hidden sm:block truncate max-w-[200px]">{issue.symptom}</span>
            <svg className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open === i && (
            <div id={`debug-answer-${i}`} className="border-t border-neutral-100 px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="grid sm:grid-cols-2 gap-3 mt-4 mb-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-1">Symptôme</p>
                  <p className="text-[13px] leading-relaxed text-red-700 sm:text-[12px]">{issue.symptom}</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-1">Cause</p>
                  <p className="text-[13px] leading-relaxed text-orange-700 sm:text-[12px]">{issue.cause}</p>
                </div>
              </div>
              <p className="text-[11px] font-black text-neutral-500 uppercase tracking-wider mb-2">Solution</p>
              <pre dir="ltr" className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#1e1e1e] p-4 font-mono text-[12px] leading-[1.7] text-[#d4d4d4] sm:text-[11px]"><code>{issue.fix}</code></pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SupabaseSection() {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "1. Créer un projet",
      content: [
        "-- 1. Aller sur https://supabase.com → New Project",
        "-- 2. Choisir un nom et une région (Europe West)",
        "-- 3. Créer un mot de passe fort pour la DB",
        "",
        "-- 4. Récupérer les clés dans Settings → API:",
        "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...      (clé publique)",
        "SUPABASE_SERVICE_ROLE_KEY=eyJ...           (SECRET - jamais exposer!)",
        "",
        "-- 5. Ajouter dans .env.local ET dans Vercel Dashboard",
      ].join("\n")
    },
    {
      title: "2. Créer les tables",
      content: [
        "-- Dans Supabase → SQL Editor → New Query",
        "",
        "CREATE TABLE products (",
        "  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,",
        "  name TEXT NOT NULL,",
        "  slug TEXT UNIQUE NOT NULL,",
        "  price INTEGER NOT NULL,",
        "  category TEXT,",
        "  images TEXT[],",
        "  description TEXT,",
        "  active BOOLEAN DEFAULT true,",
        "  created_at TIMESTAMPTZ DEFAULT now()",
        ");",
        "",
        "CREATE TABLE orders (",
        "  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,",
        "  order_number TEXT UNIQUE,",
        "  customer_name TEXT NOT NULL,",
        "  customer_email TEXT NOT NULL,",
        "  customer_phone TEXT,",
        "  items JSONB NOT NULL,",
        "  total INTEGER NOT NULL,",
        "  status TEXT DEFAULT 'pending',",
        "  created_at TIMESTAMPTZ DEFAULT now()",
        ");",
        "",
        "-- Index pour performances",
        "CREATE INDEX ON orders (customer_email);",
        "CREATE INDEX ON products (category);",
      ].join("\n")
    },
    {
      title: "3. Row Level Security",
      content: [
        "-- Activer RLS (bloque tout par défaut)",
        "ALTER TABLE products ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE orders ENABLE ROW LEVEL SECURITY;",
        "",
        "-- Lecture publique des produits actifs",
        "CREATE POLICY 'public_read_products' ON products",
        "  FOR SELECT USING (active = true);",
        "",
        "-- Accès complet via service_role (bypass RLS automatique)",
        "-- Pas de policy nécessaire pour les API routes qui utilisent service_role",
        "",
        "-- Policy pour tables admin (accès total)",
        "CREATE POLICY 'service_all' ON orders",
        "  USING (true) WITH CHECK (true);",
        "",
        "-- Vérifier les policies:",
        "SELECT tablename, policyname, cmd",
        "FROM pg_policies",
        "WHERE schemaname = 'public';",
      ].join("\n")
    },
    {
      title: "4. Storage (Images)",
      content: [
        "-- Dans Supabase → Storage → New Bucket",
        "-- Nom: 'product-images'  |  Public: OUI",
        "",
        "-- Policy lecture publique:",
        "CREATE POLICY 'public_images' ON storage.objects",
        "  FOR SELECT USING (bucket_id = 'product-images');",
        "",
        "-- Upload depuis Next.js:",
        "const { data, error } = await supabase.storage",
        "  .from('product-images')",
        "  .upload(fileName, file, { contentType: 'image/jpeg' });",
        "",
        "-- Obtenir l'URL:",
        "const { data: { publicUrl } } = supabase.storage",
        "  .from('product-images')",
        "  .getPublicUrl(fileName);",
        "// → https://xxx.supabase.co/storage/v1/object/public/product-images/...",
        "",
        "-- Supprimer:",
        "await supabase.storage.from('product-images').remove([fileName]);",
      ].join("\n")
    },
    {
      title: "5. Triggers automatiques",
      content: [
        "-- Trigger: auto-générer numéro de commande",
        "CREATE OR REPLACE FUNCTION generate_order_number()",
        "RETURNS TRIGGER AS $$",
        "BEGIN",
        "  NEW.order_number := 'ECO-' || TO_CHAR(NOW(), 'YYMMDD') || '-'",
        "    || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');",
        "  RETURN NEW;",
        "END;",
        "$$ LANGUAGE plpgsql;",
        "",
        "CREATE TRIGGER set_order_number",
        "  BEFORE INSERT ON orders",
        "  FOR EACH ROW EXECUTE FUNCTION generate_order_number();",
        "",
        "-- Trigger: auto-update updated_at",
        "ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();",
        "",
        "CREATE OR REPLACE FUNCTION update_updated_at()",
        "RETURNS TRIGGER AS $$",
        "BEGIN NEW.updated_at = NOW(); RETURN NEW; END;",
        "$$ LANGUAGE plpgsql;",
        "",
        "CREATE TRIGGER products_updated_at",
        "  BEFORE UPDATE ON products",
        "  FOR EACH ROW EXECUTE FUNCTION update_updated_at();",
      ].join("\n")
    },
    {
      title: "6. Requêtes utiles",
      content: [
        "-- Lister toutes les tables",
        "SELECT table_name FROM information_schema.tables",
        "WHERE table_schema = 'public' ORDER BY table_name;",
        "",
        "-- Compter les lignes par table",
        "SELECT tablename, n_live_tup AS rows",
        "FROM pg_stat_user_tables ORDER BY n_live_tup DESC;",
        "",
        "-- Produits actifs par catégorie",
        "SELECT category, COUNT(*) FROM products",
        "WHERE active = true GROUP BY category;",
        "",
        "-- Dernières commandes",
        "SELECT order_number, customer_name, total, status, created_at",
        "FROM orders ORDER BY created_at DESC LIMIT 10;",
        "",
        "-- Chiffre d'affaires total",
        "SELECT SUM(total) / 100 AS total_mad FROM orders",
        "WHERE status != 'cancelled';",
        "",
        "-- Reviews avec moyenne",
        "SELECT product_slug, AVG(rating), COUNT(*)",
        "FROM reviews GROUP BY product_slug ORDER BY AVG DESC;",
      ].join("\n")
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">🗄️ Guide Supabase complet</h2>
        <p className="text-sm text-gray-500 mt-1">De la création du projet jusqu&apos;aux triggers avancés.</p>
      </div>
      <label className="mb-3 block space-y-1.5 sm:hidden">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Étape Supabase</span>
        <select value={step} onChange={event => setStep(Number(event.target.value))}
          className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-bold text-gray-900 outline-none focus:border-[#16b277] focus:ring-2 focus:ring-[#16b277]/20">
          {steps.map((s, i) => <option key={i} value={i}>{s.title}</option>)}
        </select>
      </label>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="hidden shrink-0 gap-1 overflow-x-auto pb-2 sm:flex sm:w-44 sm:flex-col sm:pb-0">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`min-h-11 shrink-0 rounded-xl px-3 text-start text-[11px] font-semibold transition-colors ${step === i ? "bg-[#3ecf4c] text-black" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}`}>
              {s.title}
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-neutral-100 bg-white">
          <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
            <h3 className="font-black text-[15px]">{steps[step].title}</h3>
          </div>
          <pre dir="ltr" className="m-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#1e1e1e] p-4 font-mono text-[12px] leading-[1.7] text-[#d4d4d4] sm:m-4 sm:p-5 sm:text-[11px]"><code>{steps[step].content}</code></pre>
        </div>
      </div>
    </div>
  );
}

function DeploySection() {
  const [open, setOpen] = useState<number | null>(0);
  const steps = [
    {
      icon: "📁", title: "1. GitHub — Pousser le code",
      content: [
        "# Initialiser Git (première fois)",
        "git init",
        "git add -A",
        "git commit -m 'Initial commit'",
        "",
        "# Créer un repo sur github.com → New Repository",
        "git remote add origin https://github.com/USER/REPO.git",
        "git push -u origin main",
        "",
        "# Pousser des modifications quotidiennes:",
        "git add -A",
        "git commit -m 'feat: description de vos changements'",
        "git push origin main",
        "",
        "# Bons messages de commit:",
        "# feat: nouvelle fonctionnalité",
        "# fix: correction de bug",
        "# style: changements CSS/UI",
        "# refactor: réécriture sans changement fonctionnel",
        "# chore: mise à jour deps, config",
      ].join("\n")
    },
    {
      icon: "▲", title: "2. Vercel — Déploiement",
      content: [
        "# Via CLI (recommandé):",
        "npm install -g vercel",
        "vercel login   # ouvre le browser pour auth",
        "",
        "# Dans le dossier du projet:",
        "vercel --prod --yes",
        "# → Détecte Next.js automatiquement",
        "# → Déploie en production (~3-5 min)",
        "",
        "# Voir les logs en temps réel:",
        "npx vercel logs lecomax.com --follow",
        "",
        "# Redéployer sans changement de code:",
        "npx vercel redeploy --prod",
        "",
        "# OU via Vercel Dashboard:",
        "# vercel.com → New Project → Connecter GitHub",
        "# → Déploiement automatique à chaque git push!",
      ].join("\n")
    },
    {
      icon: "🔑", title: "3. Variables d'environnement",
      content: [
        "# .env.local (NE PAS committer dans Git!)",
        "NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...",
        "SUPABASE_SERVICE_ROLE_KEY=eyJ...",
        "ADMIN_PASSWORD=VotreMotDePasseAdmin",
        "ADMIN_SESSION_SECRET=UneLongueChaineAleatoire64chars",
        "RESEND_API_KEY=re_...",
        "NEXT_PUBLIC_VAPID_PUBLIC_KEY=...",
        "VAPID_PRIVATE_KEY=...",
        "GROQ_API_KEY=gsk_...",
        "",
        "# Ajouter sur Vercel (une par une):",
        "vercel env add SUPABASE_SERVICE_ROLE_KEY production",
        "",
        "# Ou depuis le Dashboard → Settings → Environment Variables",
        "# Vérifier que tout est défini:",
        "vercel env ls",
        "",
        "# RÈGLE: NEXT_PUBLIC_ = visible dans le browser",
        "#        Sans NEXT_PUBLIC_ = serveur uniquement (sécurisé)",
      ].join("\n")
    },
    {
      icon: "🌐", title: "4. Domaine personnalisé",
      content: [
        "// 1. Vercel Dashboard → Project → Settings → Domains",
        "//    Ajouter: lecomax.com et www.lecomax.com",
        "",
        "// 2. Vercel vous donne des DNS records:",
        "//    Type A     → 76.76.21.21",
        "//    CNAME www  → cname.vercel-dns.com",
        "",
        "// 3. Sur Namecheap → Domain List → Manage → Advanced DNS:",
        "//    Supprimer les records A et CNAME existants",
        "//    Ajouter:",
        "//    Type: A Record  | Host: @   | Value: 76.76.21.21",
        "//    Type: CNAME     | Host: www | Value: cname.vercel-dns.com",
        "",
        "// 4. Propagation DNS: 5min à 24h",
        "//    Vérifier: https://dnschecker.org/#A/lecomax.com",
        "",
        "// 5. HTTPS/SSL: automatique par Vercel (Let's Encrypt)",
        "//    Aucune configuration nécessaire!",
      ].join("\n")
    },
    {
      icon: "🔄", title: "5. Cycle quotidien",
      content: [
        "# WORKFLOW QUOTIDIEN (5 minutes):",
        "",
        "# 1. Travailler en local",
        "npm run dev   # http://localhost:3000",
        "",
        "# 2. Vérifier qu'il n'y a pas d'erreurs console",
        "",
        "# 3. Test build AVANT de pusher (important!)",
        "npm run build",
        "# Si erreur → corriger avant de continuer",
        "",
        "# 4. Pusher sur GitHub",
        "git add -A",
        "git commit -m 'feat: ma modification'",
        "git push origin main",
        "",
        "# 5. Déployer",
        "npx vercel --prod --yes",
        "",
        "# 6. Vérifier sur https://lecomax.com",
        "",
        "# TOTAL: ~5 minutes pour un changement simple",
      ].join("\n")
    },
    {
      icon: "🚨", title: "6. Rollback — Revenir en arrière",
      content: [
        "# Si un déploiement casse la production:",
        "",
        "# Option 1: Vercel Dashboard",
        "# Deployments → Trouver le dernier bon → Promote to Production",
        "",
        "# Option 2: Via CLI",
        "npx vercel rollback   # revient au déploiement précédent",
        "",
        "# Option 3: Git revert",
        "git log --oneline              # voir les commits",
        "git revert HEAD                # annuler le dernier commit",
        "git push origin main",
        "npx vercel --prod --yes       # redéployer",
        "",
        "# PRÉVENTION:",
        "# - Toujours tester npm run build localement",
        "# - Utiliser des branches pour les features importantes:",
        "git checkout -b feature/ma-feature",
        "# ... développer ...",
        "git checkout main",
        "git merge feature/ma-feature",
      ].join("\n")
    },
  ];

  return (
    <div className="space-y-3 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">🚀 Guide de déploiement</h2>
        <p className="text-sm text-gray-500 mt-1">Git, GitHub, Vercel, domaine, variables — le processus complet.</p>
      </div>
      <div className="bg-[#0d0d0d] rounded-2xl p-5 mb-2">
        <p className="text-[11px] font-black text-[#3ecf4c] uppercase tracking-widest mb-3">Commandes essentielles</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["Démarrer dev", "npm run dev"],
            ["Build test", "npm run build"],
            ["Pusher Git", "git add -A && git commit -m 'msg' && git push"],
            ["Déployer", "npx vercel --prod --yes"],
            ["Voir les logs", "npx vercel logs lecomax.com"],
            ["Rollback", "npx vercel rollback"],
          ].map(([label, cmd]) => (
            <div key={label} className="bg-white/[0.04] rounded-lg px-3 py-2">
              <p className="text-[9px] text-white/40 uppercase tracking-wider">{label}</p>
              <code className="text-[11px] text-[#3ecf4c] font-mono">{cmd}</code>
            </div>
          ))}
        </div>
      </div>
      {steps.map((s, i) => (
        <div key={i} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            aria-controls={`deploy-answer-${i}`}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-neutral-50 sm:px-5"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="font-black text-[14px] text-gray-900 flex-1">{s.title}</span>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${open === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open === i && (
            <div id={`deploy-answer-${i}`} className="border-t border-neutral-100 px-4 pb-4 sm:px-5 sm:pb-5">
              <pre dir="ltr" className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#1e1e1e] p-4 font-mono text-[12px] leading-[1.7] text-[#d4d4d4] sm:text-[11px]"><code>{s.content}</code></pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CoursSection() {
  const [module, setModule] = useState(0);
  const [lesson, setLesson] = useState<number | null>(0);

  const modules = [
    {
      id: "nextjs", icon: "▲", color: "#0070f3", title: "Next.js — De 0 à 100%",
      desc: "App Router, composants serveur, API routes, ISR, déploiement",
      lessons: [
        {
          title: "0% — C'est quoi Next.js ?",
          content: [
            "Next.js est un FRAMEWORK basé sur React. La différence ?",
            "• React seul → SPA (Single Page App), tout se charge côté navigateur",
            "• Next.js → SSR (Server-Side Rendering) + SSG + ISR + Server Components",
            "",
            "POURQUOI NEXT.JS POUR LECOMAX ?",
            "1. SEO : les pages sont rendues côté serveur → Google les indexe",
            "2. Performance : HTML pré-généré = chargement instantané",
            "3. API Routes incluses : pas besoin d'un serveur séparé",
            "4. Déploiement Vercel : 1 commande, domaine configuré",
            "",
            "STRUCTURE D'UN PROJET NEXT.JS:",
            "lecomax/",
            "├── app/                  ← Pages (App Router)",
            "│   ├── page.tsx          ← Route /",
            "│   ├── layout.tsx        ← Layout global",
            "│   ├── boutique/",
            "│   │   └── page.tsx      ← Route /boutique",
            "│   └── api/",
            "│       └── products/",
            "│           └── route.ts  ← API /api/products",
            "├── components/           ← Composants réutilisables",
            "├── lib/                  ← Utilitaires, config DB",
            "├── public/               ← Images, fonts statiques",
            "├── next.config.js        ← Config Next.js",
            "└── package.json          ← Dépendances",
          ].join("\n")
        },
        {
          title: "10% — Créer son premier projet",
          content: [
            "# INSTALLATION (une seule fois):",
            "npx create-next-app@latest mon-projet",
            "# Répondre aux questions:",
            "# TypeScript? → Yes",
            "# ESLint?     → Yes",
            "# Tailwind?   → Yes",
            "# App Router? → Yes  ← IMPORTANT",
            "# @/* alias?  → Yes",
            "",
            "cd mon-projet",
            "npm run dev",
            "# → Ouvrir http://localhost:3000",
            "",
            "# CRÉER UNE PAGE:",
            "# app/produits/page.tsx",
            "export default function ProduitsPage() {",
            "  return <h1>Mes Produits</h1>;",
            "}",
            "# → Accessible sur http://localhost:3000/produits",
            "",
            "# CRÉER UNE PAGE AVEC PARAMÈTRE:",
            "# app/produit/[slug]/page.tsx",
            "export default function ProduitPage({ params }: { params: { slug: string } }) {",
            "  return <h1>Produit: {params.slug}</h1>;",
            "}",
            "# → /produit/chaussures-asics → params.slug = 'chaussures-asics'",
          ].join("\n")
        },
        {
          title: "25% — Server vs Client Components",
          content: [
            "// SERVER COMPONENT (défaut dans app/)",
            "// ✅ Accès aux variables env secrètes",
            "// ✅ Pas de JS envoyé au navigateur",
            "// ✅ Accès direct à la DB",
            "// ❌ Pas de useState, useEffect, onClick",
            "",
            "// app/produits/page.tsx — SERVER",
            "import { createClient } from '@supabase/supabase-js';",
            "const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);",
            "",
            "export default async function ProduitsPage() {",
            "  const { data: produits } = await sb.from('products').select('*').eq('active', true);",
            "  return (",
            "    <ul>",
            "      {produits?.map(p => <li key={p.id}>{p.name} — {p.price} MAD</li>)}",
            "    </ul>",
            "  );",
            "}",
            "",
            "// CLIENT COMPONENT — avec 'use client' au début",
            "// ✅ useState, useEffect, events",
            "// ❌ Pas d'accès aux secrets serveur",
            "",
            "'use client';",
            "import { useState } from 'react';",
            "",
            "export default function CartButton({ productId }: { productId: string }) {",
            "  const [added, setAdded] = useState(false);",
            "  return (",
            "    <button onClick={() => setAdded(true)}>",
            "      {added ? '✓ Ajouté' : 'Ajouter au panier'}",
            "    </button>",
            "  );",
            "}",
            "",
            "// RÈGLE D'OR:",
            "// Commencez par Server Component.",
            "// Ajoutez 'use client' SEULEMENT si vous avez besoin de:",
            "// useState / useEffect / onClick / onChange / useRef",
          ].join("\n")
        },
        {
          title: "40% — Créer une API Route",
          content: [
            "// app/api/produits/route.ts",
            "import { NextRequest, NextResponse } from 'next/server';",
            "",
            "// GET /api/produits",
            "export async function GET(req: NextRequest) {",
            "  const { searchParams } = new URL(req.url);",
            "  const categorie = searchParams.get('categorie');",
            "",
            "  // Simuler une réponse (remplacer par vraie DB)",
            "  const produits = [",
            "    { id: 1, nom: 'Chaussures Asics', prix: 599, categorie: 'chaussures' },",
            "    { id: 2, nom: 'Sac à dos', prix: 849, categorie: 'accessoires' },",
            "  ].filter(p => !categorie || p.categorie === categorie);",
            "",
            "  return NextResponse.json(produits);",
            "}",
            "",
            "// POST /api/produits",
            "export async function POST(req: NextRequest) {",
            "  const body = await req.json();",
            "  const { nom, prix, categorie } = body;",
            "",
            "  // Validation",
            "  if (!nom || !prix) {",
            "    return NextResponse.json({ error: 'nom et prix requis' }, { status: 400 });",
            "  }",
            "",
            "  // Insérer en DB (exemple avec Supabase)",
            "  // const { data } = await sb.from('products').insert({ nom, prix, categorie });",
            "",
            "  return NextResponse.json({ success: true, produit: { nom, prix } }, { status: 201 });",
            "}",
            "",
            "// Appeler depuis le client:",
            "const res = await fetch('/api/produits?categorie=chaussures');",
            "const data = await res.json();",
          ].join("\n")
        },
        {
          title: "55% — Metadata & SEO",
          content: [
            "// SEO dans les pages Next.js (App Router)",
            "",
            "// 1. Metadata statique",
            "export const metadata = {",
            "  title: \"Ma Boutique — Produits pas chers au Maroc\",",
            "  description: \"Achetez en ligne au Maroc. Livraison 35 MAD.\",",
            "  openGraph: {",
            "    title: \"Ma Boutique\",",
            "    description: \"Meilleurs prix au Maroc\",",
            "    images: ['https://mon-site.com/og-image.jpg'],",
            "  }",
            "};",
            "",
            "// 2. Metadata dynamique (par produit)",
            "export async function generateMetadata({ params }: { params: { slug: string } }) {",
            "  const { data: produit } = await sb.from('products').select('name,description').eq('slug', params.slug).single();",
            "  return {",
            "    title: produit?.name + ' — Ma Boutique',",
            "    description: produit?.description,",
            "  };",
            "}",
            "",
            "// 3. ISR — Revalider toutes les 60 secondes",
            "export const revalidate = 60;",
            "",
            "// 4. Sitemap automatique",
            "// app/sitemap.xml/route.ts",
            "export async function GET() {",
            "  const { data: produits } = await sb.from('products').select('slug,updated_at');",
            "  const urls = produits?.map(p => (",
            "    `<url><loc>https://mon-site.com/produit/${p.slug}</loc></url>`",
            "  )).join('');",
            "  return new Response(",
            "    `<?xml version='1.0'?><urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>${urls}</urlset>`,",
            "    { headers: { 'Content-Type': 'application/xml' } }",
            "  );",
            "}",
          ].join("\n")
        },
        {
          title: "70% — Images & Performance",
          content: [
            "// TOUJOURS utiliser next/image (jamais <img>)",
            "import Image from 'next/image';",
            "",
            "// Image avec dimensions connues:",
            "<Image",
            "  src=\"/images/chaussures.jpg\"",
            "  alt=\"Chaussures Asics\"",
            "  width={800}",
            "  height={600}",
            "  quality={75}        // 75% qualité = bon compromis",
            "  priority            // Charger en priorité (hero images)",
            "/>",
            "",
            "// Image fill (prend tout l'espace du parent):",
            "<div className=\"relative aspect-square\">",
            "  <Image",
            "    src={produit.image}",
            "    alt={produit.name}",
            "    fill",
            "    className=\"object-cover\"",
            "    sizes=\"(max-width: 640px) 100vw, 50vw\"",
            "  />",
            "</div>",
            "",
            "// Lazy loading des composants lourds:",
            "import dynamic from 'next/dynamic';",
            "const GraphiqueVentes = dynamic(() => import('@/components/GraphiqueVentes'), {",
            "  loading: () => <div>Chargement...</div>,",
            "  ssr: false, // ne pas SSR ce composant",
            "});",
            "",
            "// Cache API responses:",
            "const res = await fetch('https://api.externe.com/data', {",
            "  next: { revalidate: 3600 } // cache 1 heure",
            "});",
          ].join("\n")
        },
        {
          title: "85% — Middleware & Auth",
          content: [
            "// middleware.ts (à la racine du projet)",
            "// S'exécute AVANT chaque requête — parfait pour l'auth",
            "",
            "import { NextRequest, NextResponse } from 'next/server';",
            "",
            "export function middleware(req: NextRequest) {",
            "  const { pathname } = req.nextUrl;",
            "",
            "  // Protéger les routes /admin",
            "  if (pathname.startsWith('/admin')) {",
            "    const session = req.cookies.get('admin_session')?.value;",
            "",
            "    if (!session) {",
            "      // Redirect vers la page de connexion",
            "      return NextResponse.redirect(new URL('/connexion', req.url));",
            "    }",
            "",
            "    // Optionnel: vérifier le token",
            "    // const valid = verifyToken(session);",
            "    // if (!valid) return NextResponse.redirect(...);",
            "  }",
            "",
            "  return NextResponse.next();",
            "}",
            "",
            "// Définir sur quelles routes appliquer le middleware:",
            "export const config = {",
            "  matcher: ['/admin/:path*', '/compte/:path*'],",
            "};",
            "",
            "// Connexion admin (app/api/admin/login/route.ts):",
            "export async function POST(req: NextRequest) {",
            "  const { password } = await req.json();",
            "  if (password !== process.env.ADMIN_PASSWORD) {",
            "    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });",
            "  }",
            "  const token = createSessionToken({ role: 'admin', ts: Date.now() });",
            "  const res = NextResponse.json({ success: true });",
            "  res.cookies.set('admin_session', token, { httpOnly: true, maxAge: 86400 * 7 });",
            "  return res;",
            "}",
          ].join("\n")
        },
        {
          title: "100% — Structure finale d'un vrai projet",
          content: [
            "// CHECKLIST PROJET NEXT.JS COMPLET:",
            "",
            "// ✅ Structure:",
            "app/",
            "  (public)/         ← Routes publiques groupées",
            "    page.tsx         ← Homepage",
            "    boutique/        ← /boutique",
            "    produit/[slug]/  ← /produit/xxx",
            "  (admin)/           ← Routes admin protégées",
            "    admin/",
            "      layout.tsx     ← Layout avec auth check",
            "      page.tsx       ← Dashboard",
            "  api/               ← Routes API",
            "    products/route.ts",
            "    orders/route.ts",
            "",
            "// ✅ Variables d'env:",
            "// .env.local (jamais committer!)",
            "NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...",
            "SUPABASE_SERVICE_ROLE_KEY=eyJ...  // SECRET",
            "RESEND_API_KEY=re_...",
            "ADMIN_SESSION_SECRET=xxx",
            "",
            "// ✅ next.config.js:",
            "const nextConfig = {",
            "  images: {",
            "    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }]",
            "  }",
            "};",
            "",
            "// ✅ Déploiement:",
            "npm run build    // tester le build",
            "npx vercel --prod --yes   // déployer",
            "",
            "// ✅ Performance:",
            "// - Images: always next/image",
            "// - Données: ISR avec revalidate",
            "// - JS: lazy load les gros composants",
            "// - Cache: Cache-Control sur les API routes",
          ].join("\n")
        },
      ]
    },
    {
      id: "github", icon: "🐙", color: "#24292e", title: "GitHub — Maîtriser Git & GitHub",
      desc: "Version control, branches, pull requests, workflow professionnel",
      lessons: [
        {
          title: "0% — C'est quoi Git & GitHub ?",
          content: [
            "GIT = système de contrôle de version LOCAL",
            "Permet de sauvegarder chaque changement de code",
            "→ comme une machine à remonter le temps pour votre code",
            "",
            "GITHUB = plateforme CLOUD pour héberger votre code Git",
            "→ backup en ligne, collaboration, déploiement auto avec Vercel",
            "",
            "INSTALLATION:",
            "1. Aller sur https://git-scm.com/downloads",
            "2. Télécharger et installer Git",
            "3. Vérifier: git --version",
            "",
            "CONFIGURATION (une seule fois):",
            "git config --global user.name 'Votre Nom'",
            "git config --global user.email 'votre@email.com'",
            "",
            "CRÉER UN COMPTE GITHUB:",
            "1. https://github.com → Sign up",
            "2. Choisir un nom d'utilisateur professionnel",
            "3. Garder le mot de passe en sécurité",
          ].join("\n")
        },
        {
          title: "20% — Les commandes Git essentielles",
          content: [
            "# DÉMARRER UN NOUVEAU PROJET:",
            "git init                          # Initialiser Git dans le dossier",
            "git add -A                         # Ajouter TOUS les fichiers",
            "git commit -m 'Premier commit'    # Sauvegarder avec un message",
            "",
            "# WORKFLOW QUOTIDIEN:",
            "git status                        # Voir les fichiers modifiés",
            "git diff                          # Voir exactement ce qui a changé",
            "git add fichier.tsx               # Ajouter un fichier spécifique",
            "git add -A                        # Ajouter tout",
            "git commit -m 'feat: description' # Committer",
            "git push origin main              # Envoyer sur GitHub",
            "",
            "# REGARDER L'HISTORIQUE:",
            "git log --oneline                 # Liste des commits (résumé)",
            "git log --oneline --graph         # Avec visualisation des branches",
            "",
            "# REVENIR EN ARRIÈRE:",
            "git revert HEAD                   # Annuler le dernier commit (sûr)",
            "git stash                         # Mettre les changements de côté",
            "git stash pop                     # Récupérer les changements",
            "",
            "# IGNORER DES FICHIERS (.gitignore):",
            ".env.local         # Variables secrètes",
            "node_modules/      # Dépendances (trop lourd)",
            ".next/             # Build files",
            "*.log              # Fichiers de logs",
          ].join("\n")
        },
        {
          title: "40% — Connecter GitHub",
          content: [
            "# CRÉER UN REPO SUR GITHUB:",
            "# 1. github.com → New repository",
            "# 2. Nom: lecomax",
            "# 3. Private (recommandé pour un projet commercial)",
            "# 4. NE PAS initialiser avec README (vous en avez déjà un local)",
            "",
            "# CONNECTER VOTRE PROJET LOCAL À GITHUB:",
            "git remote add origin https://github.com/VOTRE-USER/lecomax.git",
            "git push -u origin main",
            "# La première fois → entrer votre login GitHub",
            "",
            "# POUR LES PROCHAINES FOIS:",
            "git add -A",
            "git commit -m 'feat: ajouter la page produit'",
            "git push",
            "# → Juste 'git push' suffit (après le -u initial)",
            "",
            "# CLONER UN PROJET EXISTANT:",
            "git clone https://github.com/USER/REPO.git",
            "cd REPO",
            "npm install",
            "npm run dev",
            "",
            "# CONFIGURER SSH (pour ne plus entrer le mot de passe):",
            "ssh-keygen -t ed25519 -C 'votre@email.com'",
            "# Copier la clé publique:",
            "cat ~/.ssh/id_ed25519.pub",
            "# Ajouter dans GitHub → Settings → SSH keys",
            "# Ensuite utiliser git@github.com:USER/REPO.git",
          ].join("\n")
        },
        {
          title: "60% — Branches — Travailler sans casser la prod",
          content: [
            "# POURQUOI LES BRANCHES ?",
            "# → Développer une feature sans toucher au code qui marche",
            "# main = branche principale = PRODUCTION",
            "# feature/* = branches de développement",
            "",
            "# CRÉER ET UTILISER UNE BRANCHE:",
            "git checkout -b feature/ecomedia   # Créer + basculer",
            "# ... coder, tester ...",
            "git add -A",
            "git commit -m 'feat: module Ecomedia initial'",
            "git push origin feature/ecomedia",
            "",
            "# FUSIONNER dans main quand c'est prêt:",
            "git checkout main",
            "git merge feature/ecomedia",
            "git push origin main",
            "",
            "# SUPPRIMER la branche après merge:",
            "git branch -d feature/ecomedia",
            "",
            "# RÉSOUDRE UN CONFLIT:",
            "# Si deux personnes modifient le même fichier:",
            "git merge feature/ma-feature",
            "# → Conflit! Ouvrir le fichier, vous verrez:",
            "# <<<<<<< HEAD",
            "# votre version",
            "# =======",
            "# version de la branche",
            "# >>>>>>> feature/ma-feature",
            "# → Choisir quelle version garder",
            "# → Supprimer les marqueurs <<< === >>>",
            "git add -A",
            "git commit -m 'fix: résoudre conflit merge'",
          ].join("\n")
        },
        {
          title: "80% — GitHub Actions — CI/CD automatique",
          content: [
            "# GitHub Actions = automatiser des tâches sur chaque push",
            "# Ex: tester le build, vérifier TypeScript, déployer",
            "",
            "# Créer .github/workflows/build.yml:",
            "name: Build Check",
            "",
            "on:",
            "  push:",
            "    branches: [main, feature/*]",
            "  pull_request:",
            "    branches: [main]",
            "",
            "jobs:",
            "  build:",
            "    runs-on: ubuntu-latest",
            "    steps:",
            "      - uses: actions/checkout@v4",
            "      - uses: actions/setup-node@v4",
            "        with:",
            "          node-version: 20",
            "          cache: 'npm'",
            "      - run: npm ci",
            "      - run: npx tsc --noEmit    # Check TypeScript",
            "      - run: npm run build       # Test build",
            "",
            "# → Chaque push vérifie que le code compile",
            "# → Vercel se connecte à GitHub et déploie auto sur main",
            "",
            "# SECRETS DANS GITHUB ACTIONS:",
            "# GitHub → Settings → Secrets and variables → Actions",
            "# Ajouter vos clés (ex: VERCEL_TOKEN)",
            "# Utiliser dans le workflow: ${{ secrets.VERCEL_TOKEN }}",
          ].join("\n")
        },
        {
          title: "100% — Best Practices & Workflow Pro",
          content: [
            "# CONVENTIONS DE COMMITS (Conventional Commits):",
            "feat: ajouter une fonctionnalité",
            "fix: corriger un bug",
            "style: changements CSS/formatage",
            "refactor: réécriture sans changement fonctionnel",
            "docs: documentation",
            "test: ajouter des tests",
            "chore: mise à jour deps, config",
            "perf: amélioration de performance",
            "",
            "# PROTÉGER LA BRANCHE MAIN:",
            "# GitHub → Settings → Branches → Add rule",
            "# Branch name pattern: main",
            "# ✅ Require pull request before merging",
            "# ✅ Require status checks to pass",
            "",
            "# .gitignore COMPLET pour Next.js:",
            "# Dépendances",
            "node_modules/",
            ".pnp",
            "",
            "# Build output",
            ".next/",
            "out/",
            "dist/",
            "",
            "# Env files (JAMAIS committer!)",
            ".env",
            ".env.local",
            ".env.*.local",
            "",
            "# Misc",
            ".DS_Store",
            "*.pem",
            "npm-debug.log*",
            "*.tsbuildinfo",
            "",
            "# ALIAS GIT UTILES (ajouter dans ~/.gitconfig):",
            "[alias]",
            "  st = status",
            "  co = checkout",
            "  br = branch",
            "  lg = log --oneline --graph",
            "  undo = reset HEAD~1 --soft",
          ].join("\n")
        },
      ]
    },
    {
      id: "supabase", icon: "⚡", color: "#3ecf4c", title: "Supabase — DB, Auth, Storage",
      desc: "PostgreSQL, Row Level Security, Auth, Storage, Realtime",
      lessons: [
        {
          title: "0% — Comprendre Supabase",
          content: [
            "SUPABASE = Firebase open-source basé sur PostgreSQL",
            "",
            "CE QUE SUPABASE DONNE:",
            "✅ Base de données PostgreSQL (complète, puissante)",
            "✅ API REST auto-générée (pour chaque table)",
            "✅ Auth (email, Google, GitHub, Magic Link)",
            "✅ Storage (fichiers, images)",
            "✅ Realtime (websockets, subscriptions)",
            "✅ Edge Functions (serverless Deno)",
            "✅ Dashboard web intuitif",
            "",
            "PRIX (au 2024):",
            "• Free: 500MB DB, 1GB Storage, 50MB files",
            "• Pro: $25/mois → pour production",
            "",
            "CRÉATION:",
            "1. https://supabase.com → New Project",
            "2. Choisir une organisation et un nom",
            "3. Choisir la région (Europe West pour Maroc)",
            "4. Mot de passe DB fort (SAUVEGARDER!)",
            "5. Attendre ~2 minutes",
            "",
            "RÉCUPÉRER LES CLÉS (Settings → API):",
            "• Project URL          → NEXT_PUBLIC_SUPABASE_URL",
            "• anon public key      → NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "• service_role key     → SUPABASE_SERVICE_ROLE_KEY (SECRET!)",
          ].join("\n")
        },
        {
          title: "15% — Installer & configurer",
          content: [
            "# INSTALLATION:",
            "npm install @supabase/supabase-js",
            "",
            "# lib/supabase.ts — Client côté navigateur:",
            "import { createClient } from '@supabase/supabase-js';",
            "",
            "export const supabase = createClient(",
            "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
            "  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!",
            ");",
            "",
            "# Dans les API routes — client serveur (bypass RLS):",
            "import { createClient } from '@supabase/supabase-js';",
            "",
            "export const createServiceClient = () => createClient(",
            "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
            "  process.env.SUPABASE_SERVICE_ROLE_KEY!",
            ");",
            "",
            "# .env.local:",
            "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...",
            "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR...  # SECRET",
          ].join("\n")
        },
        {
          title: "30% — Créer des tables (SQL)",
          content: [
            "-- DANS SUPABASE → SQL EDITOR → NEW QUERY",
            "",
            "-- TABLE PRODUITS:",
            "CREATE TABLE products (",
            "  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,",
            "  name        TEXT NOT NULL,",
            "  slug        TEXT UNIQUE NOT NULL,",
            "  price       INTEGER NOT NULL,       -- en centimes ou MAD",
            "  description TEXT,",
            "  images      TEXT[],                 -- tableau d'URLs",
            "  category    TEXT,",
            "  tags        TEXT[],",
            "  active      BOOLEAN DEFAULT true,",
            "  created_at  TIMESTAMPTZ DEFAULT now(),",
            "  updated_at  TIMESTAMPTZ DEFAULT now()",
            ");",
            "",
            "-- TABLE COMMANDES:",
            "CREATE TABLE orders (",
            "  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,",
            "  order_number   TEXT UNIQUE,",
            "  customer_name  TEXT NOT NULL,",
            "  customer_email TEXT NOT NULL,",
            "  customer_phone TEXT,",
            "  city           TEXT,",
            "  address        TEXT,",
            "  items          JSONB NOT NULL,   -- [{name, price, qty, image}]",
            "  total          INTEGER NOT NULL,",
            "  status         TEXT DEFAULT 'pending',",
            "  created_at     TIMESTAMPTZ DEFAULT now()",
            ");",
            "",
            "-- CRÉER DES INDEX pour meilleures performances:",
            "CREATE INDEX idx_products_category ON products(category);",
            "CREATE INDEX idx_products_active ON products(active);",
            "CREATE INDEX idx_orders_email ON orders(customer_email);",
            "CREATE INDEX idx_orders_status ON orders(status);",
          ].join("\n")
        },
        {
          title: "45% — CRUD — Lire, Créer, Modifier, Supprimer",
          content: [
            "import { supabase } from '@/lib/supabase';",
            "",
            "// ── LIRE (SELECT) ──────────────────────",
            "// Tous les produits actifs:",
            "const { data, error } = await supabase",
            "  .from('products')",
            "  .select('*')",
            "  .eq('active', true)",
            "  .order('created_at', { ascending: false });",
            "",
            "// Avec filtre et limite:",
            "const { data } = await supabase",
            "  .from('products')",
            "  .select('id, name, price, images')",
            "  .eq('category', 'chaussures')",
            "  .gte('price', 200)          // prix >= 200",
            "  .lte('price', 800)          // prix <= 800",
            "  .limit(12);",
            "",
            "// Un seul produit par slug:",
            "const { data: produit } = await supabase",
            "  .from('products')",
            "  .select('*')",
            "  .eq('slug', 'chaussures-asics')",
            "  .single();                   // retourne un objet, pas un tableau",
            "",
            "// ── CRÉER (INSERT) ────────────────────",
            "const { data, error } = await supabase",
            "  .from('orders')",
            "  .insert({",
            "    customer_name: 'Mohammed Alami',",
            "    customer_email: 'mohammed@email.com',",
            "    items: [{ name: 'Chaussures', price: 599, qty: 1 }],",
            "    total: 634, // 599 + 35 livraison",
            "  })",
            "  .select()      // retourner l'objet créé",
            "  .single();",
            "",
            "// ── MODIFIER (UPDATE) ─────────────────",
            "const { error } = await supabase",
            "  .from('orders')",
            "  .update({ status: 'shipped' })",
            "  .eq('id', orderId);",
            "",
            "// ── SUPPRIMER (DELETE) ────────────────",
            "const { error } = await supabase",
            "  .from('products')",
            "  .delete()",
            "  .eq('id', productId);",
          ].join("\n")
        },
        {
          title: "60% — Row Level Security (RLS)",
          content: [
            "-- RLS = Règles de sécurité par ligne de données",
            "-- Sans RLS → n'importe qui peut lire/écrire TOUT",
            "-- Avec RLS → chaque requête est filtrée par des policies",
            "",
            "-- 1. ACTIVER RLS sur une table:",
            "ALTER TABLE products ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE orders ENABLE ROW LEVEL SECURITY;",
            "",
            "-- 2. POLICY: Lecture publique des produits actifs",
            "CREATE POLICY 'public_read_active_products'",
            "  ON products FOR SELECT",
            "  USING (active = true);",
            "",
            "-- 3. POLICY: Seul le service_role peut écrire",
            "-- (pas de policy INSERT/UPDATE/DELETE = personne sauf service_role)",
            "",
            "-- 4. POLICY: Chaque user voit ses propres commandes",
            "CREATE POLICY 'users_own_orders'",
            "  ON orders FOR SELECT",
            "  USING (customer_email = auth.jwt() ->> 'email');",
            "",
            "-- 5. POLICY: Admin lit tout",
            "CREATE POLICY 'admin_all_orders'",
            "  ON orders",
            "  USING (auth.role() = 'service_role');",
            "",
            "-- TESTER VOS POLICIES:",
            "-- Supabase → Authentication → Policies",
            "-- Ou en SQL:",
            "SELECT * FROM pg_policies WHERE tablename = 'products';",
            "",
            "-- NOTE: Dans les API Routes Next.js, on utilise service_role",
            "-- qui BYPASS automatiquement toutes les RLS",
            "-- C'est pourquoi il faut garder cette clé secrète!",
          ].join("\n")
        },
        {
          title: "75% — Auth Supabase",
          content: [
            "// CONNEXION avec email/password:",
            "const { data, error } = await supabase.auth.signInWithPassword({",
            "  email: 'user@email.com',",
            "  password: 'monMotDePasse123'",
            "});",
            "",
            "// INSCRIPTION:",
            "const { data, error } = await supabase.auth.signUp({",
            "  email: 'nouveau@email.com',",
            "  password: 'monMotDePasse123',",
            "  options: {",
            "    data: { full_name: 'Mohammed Alami' } // metadata",
            "  }",
            "});",
            "",
            "// DÉCONNEXION:",
            "await supabase.auth.signOut();",
            "",
            "// RÉCUPÉRER L'UTILISATEUR ACTUEL:",
            "const { data: { user } } = await supabase.auth.getUser();",
            "console.log(user?.email, user?.user_metadata?.full_name);",
            "",
            "// ÉCOUTER LES CHANGEMENTS D'AUTH:",
            "const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {",
            "  if (event === 'SIGNED_IN') console.log('Connecté:', session?.user.email);",
            "  if (event === 'SIGNED_OUT') console.log('Déconnecté');",
            "});",
            "",
            "// MAGIC LINK (connexion sans mot de passe):",
            "const { error } = await supabase.auth.signInWithOtp({",
            "  email: 'user@email.com',",
            "  options: { emailRedirectTo: 'https://mon-site.com/compte' }",
            "});",
          ].join("\n")
        },
        {
          title: "90% — Storage (Images)",
          content: [
            "// CRÉER UN BUCKET:",
            "// Supabase Dashboard → Storage → New Bucket",
            "// Nom: 'product-images' | Public: OUI",
            "",
            "// UPLOAD une image:",
            "const uploadImage = async (file: File) => {",
            "  const ext = file.name.split('.').pop();",
            "  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;",
            "",
            "  const { data, error } = await supabase.storage",
            "    .from('product-images')",
            "    .upload(fileName, file, {",
            "      contentType: file.type,",
            "      cacheControl: '3600',",
            "    });",
            "",
            "  if (error) throw error;",
            "",
            "  // Obtenir l'URL publique:",
            "  const { data: { publicUrl } } = supabase.storage",
            "    .from('product-images')",
            "    .getPublicUrl(fileName);",
            "",
            "  return publicUrl;",
            "  // → 'https://xxx.supabase.co/storage/v1/object/public/product-images/...'",
            "};",
            "",
            "// SUPPRIMER une image:",
            "await supabase.storage.from('product-images').remove(['nom-fichier.jpg']);",
            "",
            "// LISTER les fichiers:",
            "const { data: files } = await supabase.storage",
            "  .from('product-images')",
            "  .list('', { limit: 100 });",
            "",
            "// Dans next.config.js — autoriser Supabase pour next/image:",
            "remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }]",
          ].join("\n")
        },
        {
          title: "100% — Realtime & Fonctions avancées",
          content: [
            "// REALTIME — Écouter les changements en temps réel:",
            "const channel = supabase",
            "  .channel('orders-channel')",
            "  .on('postgres_changes', {",
            "    event: 'INSERT',      // 'INSERT' | 'UPDATE' | 'DELETE' | '*'",
            "    schema: 'public',",
            "    table: 'orders',",
            "  }, (payload) => {",
            "    console.log('Nouvelle commande!', payload.new);",
            "    // Mettre à jour l'interface admin",
            "  })",
            "  .subscribe();",
            "",
            "// CLEANUP (important dans useEffect):",
            "return () => { supabase.removeChannel(channel); };",
            "",
            "// FULL TEXT SEARCH:",
            "const { data } = await supabase",
            "  .from('products')",
            "  .select('*')",
            "  .textSearch('name', 'asics chaussures', { type: 'websearch' });",
            "",
            "// TRIGGER automatique (numéro de commande):",
            "-- Dans SQL Editor:",
            "CREATE FUNCTION generate_order_number()",
            "RETURNS TRIGGER AS $$",
            "BEGIN",
            "  NEW.order_number = 'ECO-' || TO_CHAR(NOW(),'YYMMDD') || '-' ||",
            "    LPAD(FLOOR(RANDOM()*9999)::TEXT, 4, '0');",
            "  RETURN NEW;",
            "END; $$ LANGUAGE plpgsql;",
            "",
            "CREATE TRIGGER before_order_insert",
            "  BEFORE INSERT ON orders",
            "  FOR EACH ROW EXECUTE FUNCTION generate_order_number();",
          ].join("\n")
        },
      ]
    },
    {
      id: "resend", icon: "✉️", color: "#0ea5e9", title: "Resend — Emails transactionnels",
      desc: "Envoyer des emails depuis Next.js avec Resend",
      lessons: [
        {
          title: "0% — C'est quoi Resend ?",
          content: [
            "RESEND = Service d'envoi d'email pour développeurs",
            "",
            "POURQUOI PAS GMAIL/SENDGRID ?",
            "• Gmail → limites d'envoi, pas de délivrabilité garantie",
            "• SendGrid → compliqué, UI confuse",
            "• Resend → simple, API React-first, excellent dashboard",
            "",
            "GRATUIT jusqu'à:",
            "• 3,000 emails/mois",
            "• 100 emails/jour",
            "→ Largement suffisant pour commencer",
            "",
            "CRÉATION DU COMPTE:",
            "1. https://resend.com → Sign up",
            "2. Créer une API Key: Dashboard → API Keys → Create",
            "3. Copier la clé: re_xxxxxxxxxx",
            "4. Ajouter dans .env.local: RESEND_API_KEY=re_xxx",
            "",
            "AJOUTER SON DOMAINE (pour prod):",
            "1. Resend → Domains → Add Domain",
            "2. Entrer: lecomax.com",
            "3. Ajouter les records DNS chez Namecheap",
            "4. Attendre la vérification (quelques minutes)",
            "5. Vous pouvez envoyer depuis noreply@lecomax.com",
          ].join("\n")
        },
        {
          title: "25% — Premier email",
          content: [
            "# INSTALLATION:",
            "npm install resend",
            "",
            "// lib/resend.ts:",
            "import { Resend } from 'resend';",
            "export const resend = new Resend(process.env.RESEND_API_KEY);",
            "",
            "// app/api/test-email/route.ts:",
            "import { NextResponse } from 'next/server';",
            "import { resend } from '@/lib/resend';",
            "",
            "export async function POST() {",
            "  const { data, error } = await resend.emails.send({",
            "    from: \"L'ecomax <noreply@lecomax.com>\",",
            "    to: ['client@email.com'],",
            "    subject: 'Bienvenue sur L\\'ecomax!',",
            "    html: '<h1>Bonjour!</h1><p>Merci de votre commande.</p>',",
            "  });",
            "",
            "  if (error) {",
            "    return NextResponse.json({ error }, { status: 500 });",
            "  }",
            "",
            "  return NextResponse.json({ success: true, id: data?.id });",
            "}",
            "",
            "// TESTER EN DEV:",
            "// Envoyer vers votre propre email pendant le dev",
            "// En prod → utiliser votre domaine vérifié",
            "// Pendant les tests: from: 'onboarding@resend.dev' (domaine Resend)",
          ].join("\n")
        },
        {
          title: "50% — Email HTML professionnel",
          content: [
            "// Template email de confirmation de commande:",
            "",
            "function emailConfirmationTemplate(order: Order): string {",
            "  return `",
            "  <!DOCTYPE html>",
            "  <html>",
            "  <head>",
            "    <meta charset='utf-8'>",
            "    <style>",
            "      body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; }",
            "      .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; }",
            "      .header { background: #0d0d0d; padding: 32px; text-align: center; }",
            "      .logo { color: white; font-size: 28px; font-weight: 900; }",
            "      .logo span { color: #3ecf4c; }",
            "      .content { padding: 32px; }",
            "      .order-item { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eee; }",
            "      .total { font-size: 20px; font-weight: 900; color: #3ecf4c; }",
            "      .footer { background: #f9f9f9; padding: 24px; text-align: center; color: #999; font-size: 12px; }",
            "    </style>",
            "  </head>",
            "  <body>",
            "    <div class='container'>",
            "      <div class='header'>",
            "        <div class='logo'>L&apos;eco<span>max</span></div>",
            "        <p style='color:#fff;margin:8px 0 0;'>Commande confirmée ✓</p>",
            "      </div>",
            "      <div class='content'>",
            "        <h2>Bonjour ${order.customer_name},</h2>",
            "        <p>Votre commande <strong>#${order.order_number}</strong> a été reçue.</p>",
            "        ${order.items.map(item => `",
            "          <div class='order-item'>",
            "            <div>",
            "              <strong>${item.name}</strong><br>",
            "              Quantité: ${item.qty} × ${item.price} MAD",
            "            </div>",
            "          </div>",
            "        `).join('')}",
            "        <p class='total'>Total: ${order.total} MAD</p>",
            "        <p>Livraison estimée: 2-5 jours ouvrables</p>",
            "        <a href='https://lecomax.com/suivre-commande?order_number=${order.order_number}'",
            "           style='background:#3ecf4c;color:#000;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:900;'>",
            "          Suivre ma commande",
            "        </a>",
            "      </div>",
            "      <div class='footer'>L&apos;ecomax · Maroc · support@lecomax.com</div>",
            "    </div>",
            "  </body>",
            "  </html>",
            "  `;",
            "}",
          ].join("\n")
        },
        {
          title: "75% — React Email (templates modernes)",
          content: [
            "# React Email = templates d'email en React/JSX",
            "npm install @react-email/components react-email",
            "",
            "// emails/OrderConfirmation.tsx:",
            "import {",
            "  Html, Head, Body, Container, Section,",
            "  Text, Heading, Button, Hr, Img",
            "} from '@react-email/components';",
            "",
            "export function OrderConfirmationEmail({ order }: { order: Order }) {",
            "  return (",
            "    <Html lang='fr'>",
            "      <Head />",
            "      <Body style={{ backgroundColor: '#f4f4f4', fontFamily: 'Arial,sans-serif' }}>",
            "        <Container style={{ maxWidth: '600px', margin: '20px auto', backgroundColor: '#fff' }}>",
            "          <Section style={{ backgroundColor: '#0d0d0d', padding: '32px', textAlign: 'center' }}>",
            "            <Heading style={{ color: '#fff', margin: 0 }}>",
            "              L&apos;eco<span style={{ color: '#3ecf4c' }}>max</span>",
            "            </Heading>",
            "          </Section>",
            "          <Section style={{ padding: '32px' }}>",
            "            <Text>Commande #{order.order_number} confirmée ✓</Text>",
            "            <Text>Bonjour {order.customer_name},</Text>",
            "            <Button",
            "              href={`https://lecomax.com/suivre-commande?num=${order.order_number}`}",
            "              style={{ backgroundColor: '#3ecf4c', color: '#000', fontWeight: '900' }}>",
            "              Suivre ma commande",
            "            </Button>",
            "          </Section>",
            "        </Container>",
            "      </Body>",
            "    </Html>",
            "  );",
            "}",
            "",
            "// Dans votre API route:",
            "import { render } from '@react-email/render';",
            "const html = render(<OrderConfirmationEmail order={order} />);",
            "await resend.emails.send({ html, ... });",
          ].join("\n")
        },
        {
          title: "100% — Cas d'usage complets",
          content: [
            "// 1. EMAIL DE CONFIRMATION DE COMMANDE",
            "// → Envoyé automatiquement après POST /api/orders",
            "// → Template HTML avec produits, total, lien de suivi",
            "",
            "// 2. EMAIL DE CHANGEMENT DE STATUS",
            "// → 'pending' → 'shipped': \"Votre commande est en chemin!\"",
            "// → 'shipped' → 'delivered': \"Votre commande est livrée!\"",
            "",
            "// 3. EMAIL DE BIENVENUE (inscription)",
            "await resend.emails.send({",
            "  from: \"L'ecomax <bienvenue@lecomax.com>\",",
            "  to: [newUser.email],",
            "  subject: \"Bienvenue dans la famille L'ecomax! 🎉\",",
            "  html: welcomeTemplate(newUser),",
            "});",
            "",
            "// 4. NEWSLETTER (envoi en masse)",
            "// Récupérer les abonnés depuis Supabase",
            "const { data: subscribers } = await sb.from('newsletter').select('email').eq('active', true);",
            "",
            "// Envoyer par batch (éviter le rate limit)",
            "for (let i = 0; i < subscribers.length; i += 10) {",
            "  const batch = subscribers.slice(i, i + 10);",
            "  await Promise.all(batch.map(sub => ",
            "    resend.emails.send({ to: sub.email, ... })",
            "  ));",
            "  await new Promise(r => setTimeout(r, 1000)); // 1s entre chaque batch",
            "}",
            "",
            "// 5. EMAIL DE RÉINITIALISATION DE MOT DE PASSE",
            "// Générer un token unique, stocker en DB, envoyer le lien",
            "const token = crypto.randomUUID();",
            "await sb.from('password_resets').insert({ email, token, expires: Date.now() + 3600000 });",
            "await resend.emails.send({",
            "  to: email,",
            "  subject: 'Réinitialiser votre mot de passe',",
            "  html: `<a href='https://lecomax.com/reset?token=${token}'>Réinitialiser</a>`,",
            "});",
          ].join("\n")
        },
      ]
    },
    {
      id: "tailwind", icon: "🎨", color: "#38bdf8", title: "Tailwind CSS — Styling rapide",
      desc: "Classes utilitaires, responsive, dark mode, animations",
      lessons: [
        {
          title: "0% — Philosophie Tailwind",
          content: [
            "TAILWIND = CSS utilitaire — chaque classe fait UNE chose",
            "",
            "AVANT (CSS traditionnel):",
            ".carte {",
            "  background-color: white;",
            "  border-radius: 16px;",
            "  padding: 16px;",
            "  box-shadow: 0 4px 6px rgba(0,0,0,0.1);",
            "}",
            "",
            "AVEC TAILWIND:",
            "<div className='bg-white rounded-2xl p-4 shadow-md'>",
            "",
            "AVANTAGES:",
            "✅ Pas de CSS à écrire",
            "✅ Pas de conflits de noms",
            "✅ Tout inline = plus facile à lire",
            "✅ Bundle CSS petit (purge automatique)",
            "✅ Responsive facile avec md: lg:",
            "",
            "INSTALLATION (déjà inclus dans create-next-app):",
            "npm install tailwindcss postcss autoprefixer",
            "npx tailwindcss init -p",
            "",
            "tailwind.config.js:",
            "module.exports = {",
            "  content: ['./app/**/*.tsx', './components/**/*.tsx'],",
            "  theme: {",
            "    extend: {",
            "      colors: { brand: '#3ecf4c' }",
            "    }",
            "  }",
            "};",
          ].join("\n")
        },
        {
          title: "30% — Classes essentielles",
          content: [
            "// LAYOUT:",
            "flex items-center justify-between gap-4  // flexbox",
            "grid grid-cols-3 gap-4                   // grid 3 colonnes",
            "w-full h-screen                          // largeur/hauteur",
            "max-w-7xl mx-auto px-6                   // container centré",
            "",
            "// ESPACEMENTS:",
            "p-4         // padding: 1rem (16px)",
            "px-6 py-3   // padding horizontal 1.5rem, vertical 0.75rem",
            "m-4         // margin: 1rem",
            "mt-8 mb-4   // margin-top 2rem, bottom 1rem",
            "gap-3       // gap: 0.75rem (dans flex/grid)",
            "",
            "// COULEURS:",
            "bg-white bg-black bg-neutral-100 bg-[#3ecf4c]",
            "text-black text-white text-neutral-500 text-[#16b277]",
            "border border-neutral-200 border-[#3ecf4c]",
            "",
            "// TYPOGRAPHIE:",
            "text-sm text-base text-lg text-xl text-2xl text-[13px]",
            "font-normal font-semibold font-bold font-black",
            "leading-tight leading-relaxed",
            "tracking-tight tracking-[0.2em]",
            "uppercase truncate line-clamp-2",
            "",
            "// DIMENSIONS:",
            "w-4 w-8 w-16 w-full w-[300px]",
            "h-4 h-8 h-16 h-screen h-[calc(100vh-64px)]",
            "",
            "// BORDER RADIUS:",
            "rounded rounded-lg rounded-xl rounded-2xl rounded-full",
            "",
            "// OMBRES:",
            "shadow-sm shadow shadow-md shadow-lg shadow-xl",
            "shadow-[0_4px_20px_rgba(0,0,0,0.1)]  // valeur custom",
          ].join("\n")
        },
        {
          title: "60% — Responsive & Dark Mode",
          content: [
            "// RESPONSIVE (mobile-first):",
            "// Sans préfixe = mobile",
            "// sm: = 640px+, md: = 768px+, lg: = 1024px+, xl: = 1280px+",
            "",
            "<div className='",
            "  text-sm     /* mobile: petit texte */",
            "  md:text-base /* tablette: normal */",
            "  lg:text-lg   /* desktop: grand */",
            "'>",
            "",
            "<div className='",
            "  flex flex-col    /* mobile: vertical */",
            "  md:flex-row      /* tablette: horizontal */",
            "'>",
            "",
            "// GRILLES RESPONSIVES:",
            "<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>",
            "",
            "// MASQUER/AFFICHER selon taille:",
            "<div className='hidden md:block'>  // visible seulement md+",
            "<div className='block md:hidden'>  // visible seulement mobile",
            "",
            "// HOVER & FOCUS:",
            "<button className='",
            "  bg-[#3ecf4c]",
            "  hover:bg-[#34b841]",
            "  active:scale-[0.97]",
            "  transition-all duration-200",
            "'>",
            "",
            "// GROUP (hover sur parent = style sur enfant):",
            "<div className='group'>",
            "  <div className='opacity-0 group-hover:opacity-100 transition-opacity'>",
            "    Visible au hover du parent",
            "  </div>",
            "</div>",
            "",
            "// ANIMATIONS:",
            "<div className='animate-spin'>     // tourne en boucle",
            "<div className='animate-pulse'>    // pulse",
            "<div className='animate-bounce'>   // rebondit",
          ].join("\n")
        },
        {
          title: "100% — Patterns avancés",
          content: [
            "// 1. CARD PRODUIT COMPLET:",
            "<div className='",
            "  group relative overflow-hidden",
            "  bg-white border border-neutral-100",
            "  hover:border-neutral-300 hover:shadow-xl",
            "  rounded-2xl transition-all duration-300",
            "'>",
            "  <div className='relative aspect-square overflow-hidden'>",
            "    <Image fill className='object-cover group-hover:scale-105 transition-transform duration-500' />",
            "    <div className='",
            "      absolute inset-x-0 bottom-0",
            "      translate-y-full group-hover:translate-y-0",
            "      transition-transform duration-300",
            "      bg-[#3ecf4c] text-black py-3 text-center font-black",
            "    '>Voir le produit</div>",
            "  </div>",
            "  <div className='p-4'>",
            "    <h3 className='font-bold text-sm line-clamp-2'>Nom produit</h3>",
            "    <p className='font-black text-lg mt-2'>599 MAD</p>",
            "  </div>",
            "</div>",
            "",
            "// 2. BUTTON VARIANTS:",
            "// Primary:",
            "className='bg-[#3ecf4c] text-black font-black px-6 py-3 rounded-xl hover:bg-[#34b841] active:scale-[0.97] transition-all'",
            "// Secondary:",
            "className='border border-black text-black font-black px-6 py-3 rounded-xl hover:bg-black hover:text-white transition-all'",
            "// Danger:",
            "className='bg-red-500 text-white font-black px-6 py-3 rounded-xl hover:bg-red-600 transition-colors'",
            "",
            "// 3. GRADIENT TEXTE:",
            "<span className='",
            "  bg-gradient-to-r from-[#3ecf4c] to-[#16b277]",
            "  bg-clip-text text-transparent",
            "  font-black",
            "'>Texte dégradé</span>",
          ].join("\n")
        },
      ]
    },
  ];

  const mod = modules[module];
  const les = lesson !== null ? mod.lessons[lesson] : null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">📚 Cours complet — De 0 à 100%</h2>
        <p className="text-sm text-gray-500 mt-1">Maîtriser Next.js, GitHub, Supabase, Resend et Tailwind — du débutant au pro.</p>
      </div>

      <div className="mb-4 grid gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm lg:hidden">
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Module</span>
          <select value={module} onChange={event => { setModule(Number(event.target.value)); setLesson(0); }}
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-bold text-gray-900 outline-none focus:border-[#16b277] focus:ring-2 focus:ring-[#16b277]/20">
            {modules.map((m, i) => <option key={m.id} value={i}>{i + 1}. {m.title}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Leçon</span>
          <select value={lesson ?? 0} onChange={event => setLesson(Number(event.target.value))}
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-semibold text-gray-900 outline-none focus:border-[#16b277] focus:ring-2 focus:ring-[#16b277]/20">
            {mod.lessons.map((l, i) => <option key={i} value={i}>{i + 1}. {l.title}</option>)}
          </select>
        </label>
      </div>

      {/* Module tabs */}
      <div className="mb-6 hidden flex-wrap gap-2 lg:flex">
        {modules.map((m, i) => (
          <button key={m.id} onClick={() => { setModule(i); setLesson(0); }}
            className={`flex min-h-11 items-center gap-2 rounded-2xl px-4 text-[12px] font-bold transition-all ${module === i ? "text-black shadow-md" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}`}
            style={module === i ? { backgroundColor: m.color, color: m.id === "supabase" ? "#000" : "#fff" } : {}}>
            <span>{m.icon}</span>
            <span>{m.title.split(" — ")[0]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Lessons list */}
        <div className="hidden shrink-0 space-y-1 lg:block lg:w-56">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1 mb-2">{mod.title}</p>
          <p className="text-[11px] text-neutral-400 px-1 mb-3 leading-relaxed">{mod.desc}</p>
          {mod.lessons.map((l, i) => (
            <button key={i} onClick={() => setLesson(i)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-colors leading-snug ${lesson === i ? "text-white" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}`}
              style={lesson === i ? { backgroundColor: mod.color } : {}}>
              {l.title}
            </button>
          ))}
        </div>

        {/* Lesson content */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-neutral-100 bg-white">
          {les ? (
            <>
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: mod.color }}>{mod.title}</p>
                  <h3 className="font-black text-[15px]">{les.title}</h3>
                </div>
              </div>
              <pre dir="ltr" className="m-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[#1e1e1e] p-4 font-mono text-[12px] leading-[1.7] text-[#d4d4d4] sm:m-4 sm:p-5 sm:text-[11px]"><code>{les.content}</code></pre>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-neutral-300">
              <p className="text-sm">Sélectionnez une leçon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── MENTOR SECTION ────────────────────────────────────────────────────────────
function MentorSection() {
  const [chap, setChap] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const curriculum = [
    {
      id: "mindset", icon: "🧠", color: "#6366f1",
      title: "Mindset d'un Senior Engineer",
      desc: "Comment pensent les vrais professionnels avant d'écrire UNE seule ligne de code",
      lessons: [
        {
          title: "Pourquoi 90% des débutants échouent",
          why: "La plupart des débutants cherchent à ÉCRIRE du code le plus vite possible. Les seniors font l'INVERSE : ils réfléchissent longtemps, puis écrivent peu.",
          analogy: "🏠 Construire une maison\nUn débutant commence à poser des briques sans plan.\nUn architecte passe des semaines à dessiner, mesurer, calculer — AVANT de toucher une brique.\n\nC'est pareil en code.",
          content: [
            "LES 5 QUESTIONS QU'UN SENIOR POSE AVANT DE CODER:",
            "",
            "1. POURQUOI ce code doit-il exister ?",
            "   → Quel problème résout-il exactement ?",
            "   → Est-ce qu'il existe déjà ?",
            "",
            "2. QUI va l'utiliser ?",
            "   → Un client ? Un admin ? Une machine ?",
            "   → Ça change TOUT dans la conception.",
            "",
            "3. QUE se passe-t-il quand ça rate ?",
            "   → Si la base de données tombe ?",
            "   → Si l'utilisateur met des données bizarres ?",
            "",
            "4. EST-CE scalable ?",
            "   → Pour 10 utilisateurs c'est facile.",
            "   → Pour 10,000 ? Pour 1,000,000 ?",
            "",
            "5. EST-CE sécurisé ?",
            "   → Un hacker peut-il exploiter ça ?",
            "   → Les données sont-elles protégées ?",
            "",
            "EXEMPLE CONCRET avec lecomax.com:",
            "Avant d'écrire la page checkout, un senior demande:",
            "• Que se passe-t-il si le client soumet 2 fois ?",
            "• Que se passe-t-il si le prix change entre le panier et le paiement ?",
            "• Que se passe-t-il si la DB est down pendant la commande ?",
            "• Un hacker peut-il changer le prix côté client ?",
          ].join("\n"),
          quiz: {
            q: "Un développeur senior reçoit une tâche : 'Créer un formulaire de commande'. Que fait-il EN PREMIER ?",
            options: [
              "Il ouvre VS Code et commence à coder le HTML",
              "Il pose des questions sur les cas d'erreur, la sécurité et la scalabilité",
              "Il cherche sur Google comment faire un formulaire",
              "Il demande combien il va être payé",
            ],
            correct: 1,
            explanation: "Un senior RÉFLÉCHIT avant de coder. Il identifie tous les cas possibles — succès ET échec — avant d'écrire la première ligne."
          },
          exercise: "Choisissez une page de lecomax.com (ex: /checkout).\nÉcrivez sur papier 10 questions de sécurité/scalabilité avant d'écrire du code.\nExemple: 'Que se passe-t-il si...'"
        },
        {
          title: "Comment lire du code inconnu",
          why: "80% du travail d'un développeur professionnel, c'est LIRE et COMPRENDRE du code existant — pas en écrire du nouveau.",
          analogy: "📚 Lire un roman\nQuand vous lisez un livre pour la première fois, vous ne commencez pas au milieu.\nVous lisez le titre, le résumé, puis le début.\n\nPour lire du code: fichier principal → imports → exports → fonctions.",
          content: [
            "MÉTHODE POUR LIRE N'IMPORTE QUEL FICHIER:",
            "",
            "ÉTAPE 1 — La vue d'ensemble (30 secondes)",
            "→ Quel est le nom du fichier ?",
            "→ Dans quel dossier est-il ?",
            "→ Combien de lignes fait-il ?",
            "",
            "ÉTAPE 2 — Les imports (lignes du haut)",
            "→ Quelles bibliothèques utilise-t-il ?",
            "→ Quels fichiers du projet importe-t-il ?",
            "",
            "ÉTAPE 3 — L'export par défaut",
            "→ Qu'est-ce que ce fichier EXPORTE ?",
            "→ C'est ce que les autres fichiers reçoivent.",
            "",
            "ÉTAPE 4 — Les fonctions principales",
            "→ Listez chaque fonction et ce qu'elle fait en 1 phrase.",
            "",
            "EXERCICE avec app/page.tsx de lecomax:",
            "1. Nom: page.tsx → c'est la page d'accueil (route /)",
            "2. Imports: Image, Link, HeroBanner, ScrollReveal...",
            "3. Export: export default async function HomePage()",
            "4. Fonctions: getHeroImages(), puis le rendu JSX",
            "",
            "CONSEIL PRO: Ne lisez JAMAIS ligne par ligne la première fois.",
            "Lisez d'abord la structure, PUIS les détails.",
          ].join("\n"),
          quiz: {
            q: "Vous ouvrez un fichier de 500 lignes que vous n'avez jamais vu. Que lisez-vous EN PREMIER ?",
            options: [
              "La ligne 1 jusqu'à la ligne 500 dans l'ordre",
              "Les imports en haut, puis l'export, puis les fonctions principales",
              "Vous cherchez 'function' avec Ctrl+F",
              "Vous demandez à quelqu'un de l'expliquer",
            ],
            correct: 1,
            explanation: "Les imports révèlent les dépendances. L'export révèle ce que fait le fichier. La structure globale avant les détails."
          },
          exercise: "Ouvrez components/Header.tsx dans l'explorateur de fichiers à gauche.\nSans lire chaque ligne, répondez: Que fait ce fichier ? Quels composants importe-t-il ? Qu'exporte-t-il ?"
        },
      ]
    },
    {
      id: "js", icon: "🟡", color: "#f59e0b",
      title: "JavaScript — La Fondation",
      desc: "Variables, fonctions, objets, tableaux, async/await — tout ce que vous devez maîtriser",
      lessons: [
        {
          title: "C'est quoi JavaScript ?",
          why: "JavaScript est le SEUL langage que les navigateurs comprennent nativement. Sans lui, les sites web seraient statiques comme des photos — aucune interaction.",
          analogy: "🏗️ Le cerveau d'une page web\nHTML = le squelette (la structure)\nCSS = la peau (l'apparence)\nJavaScript = le cerveau (le comportement)\n\nSans JS: cliquer un bouton ne fait rien.\nAvec JS: cliquer ouvre un menu, fait une animation, envoie des données.",
          content: [
            "POURQUOI JAVASCRIPT EST PARTOUT:",
            "",
            "1. NAVIGATEUR: JavaScript tourne dans Chrome, Firefox, Safari",
            "   → Toutes les animations sur lecomax.com",
            "   → Le panier qui se met à jour sans recharger la page",
            "   → Les filtres de produits",
            "",
            "2. SERVEUR: Node.js = JavaScript côté serveur",
            "   → Les API routes de Next.js tournent grâce à Node.js",
            "   → /api/orders traite les commandes en JavaScript",
            "",
            "3. BASE DE DONNÉES: Supabase retourne du JSON",
            "   → JSON est né de JavaScript",
            "   → const { data } = await supabase.from('products').select()",
            "",
            "TIMELINE DE JS:",
            "1995: Créé en 10 jours par Brendan Eich chez Netscape",
            "2009: Node.js — JS sur le serveur",
            "2015: ES6 — révolution: arrow functions, const, let, classes",
            "2017: async/await — plus simple pour le code asynchrone",
            "2023: JavaScript = langage le + utilisé au monde",
            "",
            "JAVASCRIPT vs TYPESCRIPT:",
            "JavaScript: pas de types → erreurs difficiles à trouver",
            "TypeScript: types obligatoires → erreurs détectées avant exécution",
            "→ lecomax.com utilise TypeScript pour + de sécurité",
          ].join("\n"),
          quiz: {
            q: "Pourquoi utilise-t-on TypeScript plutôt que JavaScript dans lecomax.com ?",
            options: [
              "Parce que TypeScript est plus rapide que JavaScript",
              "Parce que TypeScript ajoute des types qui détectent les erreurs AVANT l'exécution",
              "Parce que Next.js ne supporte que TypeScript",
              "Parce que c'est plus moderne",
            ],
            correct: 1,
            explanation: "TypeScript = JavaScript + types. Les types permettent à VS Code et au compilateur de détecter les bugs AVANT que le code tourne. Sur un vrai projet e-commerce, ça évite des bugs coûteux en production."
          },
          exercise: "Ouvrez lib/products.ts dans l'explorateur.\nIdentifiez: où les types TypeScript sont utilisés ? (cherchez 'type' et 'interface')\nPourquoi ces types sont-ils importants pour lecomax.com ?"
        },
        {
          title: "Variables: const, let, var — et pourquoi const partout",
          why: "Une variable est une boîte avec un nom. Elle stocke une valeur. MAIS: il existe 3 façons de créer cette boîte, et choisir la mauvaise crée des bugs impossibles à trouver.",
          analogy: "📦 Les boîtes de déménagement\nvar = une boîte sans couvercle qu'on peut mettre n'importe où dans la maison\nlet = une boîte qu'on peut remplir et vider dans une pièce précise\nconst = une boîte scellée — on ne peut pas changer ce qu'elle contient",
          content: [
            "LES 3 FAÇONS DE DÉCLARER UNE VARIABLE:",
            "",
            "// VAR — NE JAMAIS UTILISER en 2024",
            "var nom = 'Mohammed';",
            "var nom = 'Ali';    // pas d'erreur! Bug silencieux",
            "// → var est 'function-scoped': elle existe partout dans la fonction",
            "// → Problème: on peut la redéclarer sans erreur",
            "",
            "// LET — Pour les valeurs qui CHANGENT",
            "let compteur = 0;",
            "compteur = 1;       // OK, la valeur change",
            "let compteur = 2;   // ERREUR: déjà déclarée",
            "// → let est 'block-scoped': elle n'existe que dans son bloc {}",
            "",
            "// CONST — Pour les valeurs qui NE CHANGENT PAS",
            "const API_URL = 'https://lecomax.com';",
            "API_URL = 'autre'; // ERREUR: const ne peut pas changer",
            "",
            "MAIS ATTENTION — Confusion courante:",
            "const produits = [];",
            "produits.push('chaussures');  // OK! On MODIFIE le tableau",
            "produits = ['autre'];          // ERREUR: on REMPLACE le tableau",
            "// → const empêche de REMPLACER la référence",
            "// → const n'empêche PAS de MODIFIER le contenu",
            "",
            "DANS LECOMAX.COM — Exemples réels:",
            "const supabase = createClient(url, key);  // jamais remplacé",
            "const [panier, setPanier] = useState([]); // const mais contenu change via setPanier",
            "let total = 0;",
            "for (const item of panier) { total += item.prix; }",
            "",
            "RÈGLE PROFESSIONNELLE:",
            "→ Toujours commencer par const",
            "→ Si TypeScript se plaint que la valeur doit changer → utiliser let",
            "→ Ne JAMAIS utiliser var",
          ].join("\n"),
          quiz: {
            q: "Quel est le résultat de ce code ?\n\nconst panier = [];\npanier.push('chaussures');\nconsole.log(panier.length);",
            options: [
              "Erreur: on ne peut pas modifier un const",
              "0",
              "1",
              "undefined",
            ],
            correct: 2,
            explanation: "const empêche de REMPLACER la variable (panier = autre chose), mais autorise à MODIFIER son contenu (ajouter dans le tableau). panier.push() modifie le contenu → ça marche. panier.length vaut 1."
          },
          exercise: "Ouvrez components/CartContext.tsx.\nTrouvez 3 utilisations de const et 3 de let.\nPour chaque utilisation, expliquez POURQUOI const ou let a été choisi."
        },
        {
          title: "Fonctions — Les blocs de construction du code",
          why: "Une fonction est un groupe d'instructions avec un nom. Au lieu de répéter le même code 100 fois, on l'écrit UNE fois dans une fonction et on l'appelle 100 fois.",
          analogy: "🍕 La recette de pizza\nSans fonction: écrire toute la recette chaque fois qu'on veut une pizza.\nAvec fonction: écrire fairePizza() une fois, l'appeler autant qu'on veut.\n\nSi la recette change → on change UNE seule fois.",
          content: [
            "LES 4 FAÇONS D'ÉCRIRE UNE FONCTION EN JAVASCRIPT:",
            "",
            "// 1. Déclaration classique",
            "function calculerTotal(prix, quantite) {",
            "  return prix * quantite;",
            "}",
            "",
            "// 2. Expression de fonction",
            "const calculerTotal = function(prix, quantite) {",
            "  return prix * quantite;",
            "};",
            "",
            "// 3. Arrow function (moderne — utilisée partout dans lecomax)",
            "const calculerTotal = (prix, quantite) => {",
            "  return prix * quantite;",
            "};",
            "",
            "// 4. Arrow function courte (si 1 seule ligne)",
            "const calculerTotal = (prix, quantite) => prix * quantite;",
            "",
            "EXEMPLES RÉELS DANS LECOMAX.COM:",
            "",
            "// lib/products.ts",
            "export function formatMAD(amount: number): string {",
            "  return new Intl.NumberFormat('fr-MA', {",
            "    style: 'currency',",
            "    currency: 'MAD'",
            "  }).format(amount);",
            "}",
            "// → Utilisée partout pour afficher les prix en Dirhams",
            "// → Si le format change → modifier UNE seule fonction",
            "",
            "// components/PostCard.tsx",
            "async function handleLike() {",
            "  if (likeLoading) return;",
            "  if (!requireAuth('like')) return;",
            "  // ...",
            "}",
            "",
            "PARAMÈTRES vs ARGUMENTS:",
            "function saluer(prenom) {     // prenom = PARAMÈTRE",
            "  return 'Bonjour ' + prenom;",
            "}",
            "saluer('Mohammed');           // 'Mohammed' = ARGUMENT",
            "",
            "VALEURS PAR DÉFAUT (TypeScript):",
            "function créerPost(titre: string, publié: boolean = false) {",
            "  // Si on n'envoie pas 'publié', il vaut false par défaut",
            "}",
          ].join("\n"),
          quiz: {
            q: "Quelle est la différence entre un paramètre et un argument ?",
            options: [
              "Il n'y a pas de différence, ce sont des synonymes",
              "Le paramètre est dans la définition de la fonction, l'argument est la valeur passée lors de l'appel",
              "Un paramètre est obligatoire, un argument est optionnel",
              "Les paramètres sont pour les fonctions async, les arguments pour les fonctions normales",
            ],
            correct: 1,
            explanation: "function saluer(prenom) → prenom est le PARAMÈTRE (dans la définition).\nsaluer('Mohammed') → 'Mohammed' est l'ARGUMENT (la valeur passée). Simple mais important pour bien communiquer avec d'autres devs."
          },
          exercise: "Écrivez une fonction calculerLivraison(total: number): number\n→ Si total >= 500 MAD: livraison gratuite (retourner 0)\n→ Sinon: retourner 35 MAD\n\nTestez avec: calculerLivraison(600) et calculerLivraison(200)"
        },
        {
          title: "async/await — Comprendre le code asynchrone",
          why: "Le problème le plus incompris par les débutants. Quand votre code parle à une base de données ou une API, il doit ATTENDRE la réponse. Sans async/await, le code continue sans attendre — résultat: données vides, bugs bizarres.",
          analogy: "☕ Commander un café\nSynchrone (bloquant):\nVous commandez → vous ATTENDEZ devant le bar → vous recevez → vous partez.\nPendant ce temps: vous ne pouvez rien faire d'autre.\n\nAsynchrone (non-bloquant):\nVous commandez → vous ATTENDEZ que votre numéro soit appelé → pendant ce temps vous lisez votre téléphone.\n→ C'est ce que fait async/await.",
          content: [
            "LE PROBLÈME SANS ASYNC/AWAIT:",
            "",
            "// ❌ MAUVAIS — ne marche pas",
            "function chargerProduits() {",
            "  const données = fetch('/api/products'); // fetch prend du temps!",
            "  console.log(données);                  // affiche Promise {<pending>}",
            "  // → Le code continue SANS attendre la réponse",
            "}",
            "",
            "// ✅ BON — avec async/await",
            "async function chargerProduits() {",
            "  const réponse = await fetch('/api/products');  // ATTENDRE ici",
            "  const données = await réponse.json();           // ATTENDRE ici aussi",
            "  console.log(données);                           // maintenant c'est les vraies données",
            "}",
            "",
            "RÈGLES IMPORTANTES:",
            "1. await ne peut s'utiliser QUE dans une fonction async",
            "2. async function retourne toujours une Promise",
            "3. Il FAUT gérer les erreurs avec try/catch",
            "",
            "// AVEC GESTION D'ERREUR — comme dans lecomax.com",
            "async function créerCommande(données: OrderData) {",
            "  try {",
            "    // tout ce qui peut échouer",
            "    const { data, error } = await supabase",
            "      .from('orders')",
            "      .insert(données)",
            "      .select()",
            "      .single();",
            "",
            "    if (error) throw error;",
            "    return { success: true, order: data };",
            "",
            "  } catch (erreur) {",
            "    // que faire si ça échoue",
            "    console.error('Erreur commande:', erreur);",
            "    return { success: false, error: erreur.message };",
            "  }",
            "}",
            "",
            "EXÉCUTION PARALLÈLE (plus rapide!):",
            "// ❌ Séquentiel — lent (attend l'un après l'autre)",
            "const produits = await chargerProduits();",
            "const avis = await chargerAvis();",
            "",
            "// ✅ Parallèle — rapide (attend les deux en même temps)",
            "const [produits, avis] = await Promise.all([",
            "  chargerProduits(),",
            "  chargerAvis()",
            "]);",
          ].join("\n"),
          quiz: {
            q: "Que se passe-t-il si on oublie le mot 'await' devant fetch() ?",
            options: [
              "Le code plante immédiatement avec une erreur",
              "Le code continue sans attendre la réponse — on obtient une Promise, pas les données",
              "Le code attend quand même automatiquement",
              "Rien, await est optionnel",
            ],
            correct: 1,
            explanation: "Sans await, fetch() retourne une Promise (une promesse de résultat futur), pas les vraies données. C'est le bug le plus courant pour les débutants: afficher [object Promise] au lieu des données."
          },
          exercise: "Dans app/api/orders/route.ts (dans l'explorateur), trouvez 3 endroits où await est utilisé.\nPour chaque await: qu'est-ce qu'on attend ? Pourquoi est-ce qu'on ne peut pas continuer sans attendre ?"
        },
      ]
    },
    {
      id: "react", icon: "⚛️", color: "#61dafb",
      title: "React — L'Interface Utilisateur",
      desc: "Components, Props, State, Hooks — la bibliothèque qui gère tout ce que l'utilisateur voit",
      lessons: [
        {
          title: "C'est quoi React et pourquoi on l'utilise ?",
          why: "Avant React, pour changer une partie d'une page web, on rechargait TOUTE la page. C'était lent et frustrant. React a révolutionné ça: il ne change QUE la partie qui doit changer.",
          analogy: "🖼️ Tableau vivant\nSans React: pour changer le prix d'un produit, vous brûlez toute la page et la redessinez.\nAvec React: vous changez SEULEMENT le chiffre du prix. Le reste ne bouge pas.\n\nC'est le Virtual DOM: React compare l'ancienne version avec la nouvelle et ne change QUE la différence.",
          content: [
            "PROBLÈME QUE REACT RÉSOUT:",
            "",
            "AVANT REACT (manipulation directe du DOM):",
            "document.getElementById('prix').textContent = '599 MAD';",
            "document.getElementById('stock').textContent = 'En stock';",
            "// → Pour chaque changement: chercher l'élément → le modifier",
            "// → Sur une page complexe: des centaines de ces lignes",
            "// → Difficile à maintenir, bugs fréquents",
            "",
            "AVEC REACT:",
            "function ProduitCard({ prix, stock }) {",
            "  return (",
            "    <div>",
            "      <span>{prix} MAD</span>",
            "      <span>{stock}</span>",
            "    </div>",
            "  );",
            "}",
            "// → On décrit CE QUE l'interface doit afficher",
            "// → React s'occupe de mettre à jour le DOM",
            "",
            "LE VIRTUAL DOM — Comment ça marche:",
            "1. React garde une copie virtuelle du DOM en mémoire",
            "2. Quand l'état change, React crée un nouveau Virtual DOM",
            "3. React compare ancien et nouveau (diffing)",
            "4. React ne met à jour QUE les différences dans le vrai DOM",
            "→ Résultat: beaucoup plus rapide que tout recréer",
            "",
            "JSX — Le mélange HTML + JavaScript:",
            "// JSX n'est pas du HTML! C'est du JavaScript transformé",
            "const element = <h1>Bonjour {nom}</h1>;",
            "// Est transformé en:",
            "const element = React.createElement('h1', null, 'Bonjour ', nom);",
            "",
            "RÈGLES JSX:",
            "→ Une seule racine (ou <> fragment </>)",
            "→ className au lieu de class (class est un mot réservé JS)",
            "→ htmlFor au lieu de for (même raison)",
            "→ Les expressions JS entre {}",
            "→ Les commentaires: {/* ... */}",
          ].join("\n"),
          quiz: {
            q: "Qu'est-ce que le Virtual DOM ?",
            options: [
              "Un DOM invisible que l'utilisateur ne peut pas voir",
              "Une copie du DOM gardée en mémoire par React pour comparer les changements et minimiser les mises à jour du vrai DOM",
              "Une version simplifiée du DOM HTML",
              "Le DOM des applications mobile",
            ],
            correct: 1,
            explanation: "Le Virtual DOM est une représentation légère du DOM réel gardée en mémoire. Quand l'état change, React compare (diff) l'ancien et le nouveau Virtual DOM, puis ne met à jour QUE les parties différentes dans le vrai DOM. C'est ce qui rend React si rapide."
          },
          exercise: "Ouvrez components/ProductCard.tsx.\n1. Identifiez les PROPS que ce composant reçoit.\n2. Quel état (useState) utilise-t-il ?\n3. À quel moment le composant se re-rend-il ?"
        },
        {
          title: "Props — Passer des données entre composants",
          why: "Les props sont comme des paramètres de fonction, mais pour les composants React. Sans props, chaque composant serait isolé et on devrait dupliquer le code partout.",
          analogy: "📬 Le courrier\nProps = courrier qu'un parent envoie à son enfant.\n\nLe parent (ProductRail) envoie une liste de produits.\nL'enfant (ProductCard) reçoit UN produit et l'affiche.\n\nL'enfant ne peut PAS modifier les props qu'il reçoit — comme on ne peut pas modifier le courrier de quelqu'un d'autre.",
          content: [
            "SYNTAXE DES PROPS:",
            "",
            "// PARENT — envoie les données",
            "function ProduitList() {",
            "  const produits = [",
            "    { id: 1, nom: 'Chaussures Asics', prix: 599 },",
            "    { id: 2, nom: 'Sac à dos', prix: 849 },",
            "  ];",
            "",
            "  return (",
            "    <div>",
            "      {produits.map(p => (",
            "        <ProduitCard",
            "          key={p.id}          // ← obligatoire dans map()",
            "          nom={p.nom}",
            "          prix={p.prix}",
            "        />",
            "      ))}",
            "    </div>",
            "  );",
            "}",
            "",
            "// ENFANT — reçoit les données",
            "function ProduitCard({ nom, prix }: { nom: string, prix: number }) {",
            "  return (",
            "    <div>",
            "      <h3>{nom}</h3>",
            "      <p>{prix} MAD</p>",
            "    </div>",
            "  );",
            "}",
            "",
            "PROPS IMPORTANTES:",
            "",
            "// children — ce qui est entre les balises",
            "function Bouton({ children, onClick }) {",
            "  return <button onClick={onClick}>{children}</button>;",
            "}",
            "// Utilisation:",
            "<Bouton onClick={acheter}>Ajouter au panier</Bouton>",
            "// children = 'Ajouter au panier'",
            "",
            "// VALEURS PAR DÉFAUT",
            "function Bouton({ couleur = 'vert', taille = 'md' }) { ... }",
            "",
            "// PROPS OPTIONNELLES en TypeScript",
            "interface Props {",
            "  nom: string;        // obligatoire",
            "  description?: string; // optionnel (le ? le dit)",
            "  prix: number;",
            "}",
            "",
            "RÈGLE D'OR: Les props sont IMMUTABLES (ne jamais les modifier).",
            "Si vous devez modifier une valeur → utilisez l'état local (useState).",
          ].join("\n"),
          quiz: {
            q: "Pourquoi doit-on mettre une prop 'key' unique quand on utilise .map() ?",
            options: [
              "C'est juste une convention, pas vraiment obligatoire",
              "React utilise key pour identifier chaque élément et savoir lequel mettre à jour quand la liste change — sans key, React est perdu",
              "La key permet d'accéder à l'élément dans le CSS",
              "La key est le nom de la variable dans la base de données",
            ],
            correct: 1,
            explanation: "Sans key unique, si la liste change (ajout, suppression, réorganisation), React ne sait pas QUEL élément a changé. Il serait obligé de tout re-rendre. Avec key, React sait exactement quel élément mettre à jour — plus efficace."
          },
          exercise: "Regardez comment ProductCard est utilisé dans ProductRail.tsx.\nListez toutes les props passées. Pour chaque prop: quel type ? Obligatoire ou optionnelle ?\nEssayez de deviner POURQUOI chaque prop est nécessaire."
        },
        {
          title: "useState — La mémoire des composants",
          why: "Un composant React 'oublie' tout entre chaque rendu. useState est une boîte spéciale qui SURVIT aux rerenders. C'est grâce à useState que le panier se souvient de vos produits.",
          analogy: "🧠 La mémoire à court terme\nSans useState: chaque fois que React réaffiche le composant, toutes les variables sont remises à zéro.\nAvec useState: la valeur est préservée, comme une boîte dans un coffre-fort que React garde entre les rendus.",
          content: [
            "SYNTAXE:",
            "",
            "import { useState } from 'react';",
            "",
            "// Déclaration:",
            "const [valeur, setValeur] = useState(valeurInitiale);",
            "//     ↑ état    ↑ fonction   ↑ valeur au départ",
            "",
            "// Exemple réel:",
            "const [quantite, setQuantite] = useState(1);",
            "const [enChargement, setEnChargement] = useState(false);",
            "const [produits, setProduits] = useState<Product[]>([]);",
            "const [erreur, setErreur] = useState<string | null>(null);",
            "",
            "MODIFIER L'ÉTAT:",
            "// ✅ Toujours utiliser la fonction setter",
            "setQuantite(3);",
            "setEnChargement(true);",
            "",
            "// ❌ JAMAIS modifier directement",
            "quantite = 3;    // Bug: React ne sait pas qu'il a changé!",
            "",
            "METTRE À JOUR BASÉ SUR L'ANCIENNE VALEUR:",
            "// ✅ Utiliser la fonction callback",
            "setQuantite(ancienne => ancienne + 1);",
            "",
            "// ❌ Dangereux (peut être stale)",
            "setQuantite(quantite + 1);",
            "",
            "EXEMPLE COMPLET — Bouton +/- quantité:",
            "function QuantiteSelector() {",
            "  const [qte, setQte] = useState(1);",
            "",
            "  return (",
            "    <div>",
            "      <button onClick={() => setQte(q => Math.max(1, q - 1))}>-</button>",
            "      <span>{qte}</span>",
            "      <button onClick={() => setQte(q => Math.min(10, q + 1))}>+</button>",
            "    </div>",
            "  );",
            "}",
            "",
            "RÈGLE D'OR: Chaque appel à setXxx déclenche un re-render.",
            "Ne jamais appeler setXxx en dehors d'un événement ou useEffect.",
            "Ne jamais appeler setXxx dans le corps du composant directement.",
          ].join("\n"),
          quiz: {
            q: "Que se passe-t-il quand on appelle setQuantite(5) ?",
            options: [
              "La variable quantite est immédiatement mise à jour à 5",
              "React planifie un re-render du composant, et au prochain rendu, quantite vaudra 5",
              "Le composant est détruit et recréé",
              "Tous les composants parents sont aussi re-rendus",
            ],
            correct: 1,
            explanation: "setState est ASYNCHRONE. Il ne change pas la valeur immédiatement. Il dit à React: 'hey, au prochain rendu, utilise cette nouvelle valeur'. C'est pourquoi après setQuantite(5), console.log(quantite) peut encore afficher l'ancienne valeur."
          },
          exercise: "Dans components/ProductActions.tsx, trouvez tous les useState.\nPour chaque état: quel est son rôle ? Quand est-il modifié ? Quel composant le lit ?"
        },
        {
          title: "useEffect — Agir quand quelque chose change",
          why: "useEffect permet de faire des actions EN RÉPONSE à des changements: charger des données au montage, mettre à jour le titre de page, s'abonner à des événements, nettoyer des ressources.",
          analogy: "👂 Le vigile à la porte\nuseEffect = un vigile qui surveille et réagit.\n'Chaque fois que le stock change → envoie une notification'\n'Quand la page charge → charge les produits depuis la DB'\n'Quand le composant disparaît → annule les timers actifs'",
          content: [
            "SYNTAXE:",
            "",
            "useEffect(() => {",
            "  // CODE À EXÉCUTER",
            "  return () => {",
            "    // NETTOYAGE (optionnel)",
            "  };",
            "}, [/* DÉPENDANCES */]);",
            "",
            "LES 3 FORMES:",
            "",
            "// 1. S'exécute à CHAQUE rendu (rare, souvent un bug)",
            "useEffect(() => {",
            "  console.log('rendu!');",
            "}); // pas de []",
            "",
            "// 2. S'exécute UNE SEULE FOIS au montage",
            "useEffect(() => {",
            "  chargerProduits(); // au démarrage",
            "}, []); // [] vide = une seule fois",
            "",
            "// 3. S'exécute quand une dépendance change",
            "useEffect(() => {",
            "  chargerProduits(categorie); // quand categorie change",
            "}, [categorie]);",
            "",
            "NETTOYAGE — TRÈS IMPORTANT:",
            "useEffect(() => {",
            "  const timer = setInterval(() => {",
            "    actualiserStock();",
            "  }, 5000);",
            "",
            "  return () => clearInterval(timer); // NETTOYAGE",
            "  // Sans ce return → timer continue même si composant disparu → memory leak!",
            "}, []);",
            "",
            "ERREUR CLASSIQUE — La boucle infinie:",
            "// ❌ MAUVAIS",
            "useEffect(() => {",
            "  chargerProduits();",
            "}, [produits]); // produits change → useEffect → chargerProduits → produits change → boucle!",
            "",
            "// ✅ BON",
            "useEffect(() => {",
            "  chargerProduits();",
            "}, []); // seulement au montage",
            "",
            "EXEMPLE RÉEL — EcomediaFeed.tsx:",
            "useEffect(() => {",
            "  if (!authChecked || !user) return;",
            "  fetch('/api/ecomedia/likes?postId=' + post.id + '&visitorId=' + user.id)",
            "    .then(r => r.json())",
            "    .then(d => { if (d.liked) setLiked(true); })",
            "    .catch(() => {});",
            "}, [post.id, user, authChecked]);",
            "// → Se déclenche quand post.id, user ou authChecked change",
          ].join("\n"),
          quiz: {
            q: "Vous chargez des données dans useEffect. Que se passe-t-il si vous ne mettez PAS [] comme dépendances ?",
            options: [
              "Les données ne se chargent jamais",
              "Les données se chargent une seule fois correctement",
              "useEffect s'exécute à CHAQUE rendu du composant, causant des chargements infinis",
              "TypeScript affiche une erreur",
            ],
            correct: 2,
            explanation: "Sans [], useEffect s'exécute à chaque rendu. Charger des données cause un setState → un re-render → useEffect s'exécute → charge les données → setState → ... boucle infinie. Toujours mettre [] pour les chargements initiaux."
          },
          exercise: "Trouvez dans components/ecomedia/PostCard.tsx les useEffect.\nPour chaque useEffect:\n1. Quand s'exécute-t-il ? (au montage ? quand une valeur change ?)\n2. Que fait-il ?\n3. Y a-t-il une fonction de nettoyage ? Pourquoi ?"
        },
      ]
    },
    {
      id: "nextjs", icon: "▲", color: "#000",
      title: "Next.js — Le Framework Complet",
      desc: "App Router, Server Components, API Routes, Middleware — tout ce qui fait tourner lecomax.com",
      lessons: [
        {
          title: "App Router — Comment fonctionne le routing",
          why: "Avant Next.js App Router, créer une route /boutique nécessitait de la configuration. Maintenant: créez un fichier app/boutique/page.tsx → la route existe automatiquement.",
          analogy: "🗺️ L'adresse d'une maison\nChaque fichier page.tsx = une adresse sur internet.\napp/page.tsx = / (accueil)\napp/boutique/page.tsx = /boutique\napp/produit/[slug]/page.tsx = /produit/chaussures-asics",
          content: [
            "STRUCTURE DE FICHIERS = STRUCTURE D'URLs:",
            "",
            "app/",
            "  page.tsx              → https://lecomax.com/",
            "  layout.tsx            → Layout de TOUTES les pages",
            "  boutique/",
            "    page.tsx            → https://lecomax.com/boutique",
            "  produit/",
            "    [slug]/",
            "      page.tsx          → https://lecomax.com/produit/ANYTHING",
            "  api/",
            "    products/",
            "      route.ts          → https://lecomax.com/api/products",
            "",
            "FICHIERS SPÉCIAUX:",
            "",
            "page.tsx      → Ce qui s'affiche pour cette route",
            "layout.tsx    → Wrapper persistant (header, footer)",
            "loading.tsx   → Affiché pendant le chargement",
            "error.tsx     → Affiché en cas d'erreur",
            "not-found.tsx → Page 404",
            "",
            "ROUTES DYNAMIQUES [slug]:",
            "// app/produit/[slug]/page.tsx",
            "export default function ProduitPage({",
            "  params",
            "}: {",
            "  params: { slug: string }  // TypeScript: slug est une string",
            "}) {",
            "  // URL /produit/chaussures-asics → params.slug = 'chaussures-asics'",
            "  return <h1>Produit: {params.slug}</h1>;",
            "}",
            "",
            "ROUTE GROUPS (grouper sans changer l'URL):",
            "app/",
            "  (public)/         ← () = groupe, pas dans l'URL",
            "    page.tsx         → /",
            "    boutique/",
            "      page.tsx       → /boutique",
            "  (admin)/",
            "    admin/",
            "      page.tsx       → /admin",
            "// → Permet de partager des layouts différents",
            "",
            "POURQUOI LECOMAX UTILISE APP ROUTER (pas Pages Router):",
            "→ Server Components par défaut → meilleure performance",
            "→ Streaming → chargement progressif",
            "→ Nested layouts → moins de duplication",
            "→ C'est l'avenir de Next.js",
          ].join("\n"),
          quiz: {
            q: "Quel fichier faut-il créer pour que https://lecomax.com/ecomedia/un-post fonctionne ?",
            options: [
              "app/ecomedia/un-post.tsx",
              "app/ecomedia/[slug]/page.tsx",
              "pages/ecomedia/[slug].tsx",
              "app/ecomedia/page.tsx avec un paramètre slug",
            ],
            correct: 1,
            explanation: "Dans App Router, les routes dynamiques utilisent [nomDuParamètre] comme dossier. app/ecomedia/[slug]/page.tsx crée la route /ecomedia/ANYTHING. Le slug est récupéré via params.slug dans le composant."
          },
          exercise: "Regardez la structure de dossiers app/ dans l'explorateur de fichiers.\nMappez CHAQUE dossier/fichier page.tsx vers son URL correspondante.\nTrouvez toutes les routes dynamiques [slug] ou [id]."
        },
        {
          title: "Server Components vs Client Components",
          why: "C'est la décision la plus importante dans Next.js. Server Components = code qui tourne sur le serveur, invisible au client. Client Components = code qui tourne dans le navigateur. Mauvais choix = sécurité compromise ou interactivité impossible.",
          analogy: "🏪 Le restaurant\nServer Component = ce qui se passe EN CUISINE (invisible pour le client)\n→ La recette secrète, les ingrédients, la préparation\n→ Le client reçoit seulement le plat fini\n\nClient Component = ce qui se passe en SALLE (visible, interactif)\n→ Le serveur qui prend votre commande\n→ L'ambiance, la musique, vous qui choisissez\n→ Interaction en temps réel",
          content: [
            "SERVER COMPONENT (défaut dans app/):",
            "",
            "// app/produits/page.tsx — PAS de 'use client'",
            "// → Tourne SEULEMENT sur le serveur",
            "// → Le JavaScript N'EST PAS envoyé au navigateur",
            "",
            "PEUT FAIRE:",
            "✅ Accéder directement à la base de données",
            "✅ Utiliser des variables d'env secrètes (SERVICE_ROLE_KEY)",
            "✅ Fetch côté serveur (plus rapide, pas de CORS)",
            "✅ Accéder au système de fichiers",
            "",
            "NE PEUT PAS:",
            "❌ useState, useEffect (pas de hooks React)",
            "❌ Event listeners (onClick, onChange)",
            "❌ APIs du browser (window, document, localStorage)",
            "",
            "CLIENT COMPONENT:",
            "",
            "'use client'; // ← Cette ligne OBLIGATOIRE en haut du fichier",
            "",
            "PEUT FAIRE:",
            "✅ useState, useEffect, tous les hooks",
            "✅ Event listeners (onClick, etc.)",
            "✅ APIs du browser",
            "✅ Animations en temps réel",
            "",
            "NE PEUT PAS:",
            "❌ Accéder directement à la DB avec le service_role",
            "❌ Garder des secrets côté serveur",
            "",
            "DANS LECOMAX.COM — Exemples réels:",
            "",
            "SERVER COMPONENTS:",
            "app/page.tsx              → charge les produits depuis Supabase",
            "app/produit/[slug]/page.tsx → charge UN produit, génère les metadata",
            "",
            "CLIENT COMPONENTS:",
            "components/Header.tsx     → menu hamburger, hover, navigation",
            "components/CartContext.tsx → gestion du panier (state)",
            "components/ecomedia/PostCard.tsx → likes, commentaires, interactions",
            "",
            "RÈGLE D'OR:",
            "Commencez par Server Component.",
            "Ajoutez 'use client' SEULEMENT si vous avez besoin d'interactivité.",
            "Plus vous avez de Server Components → meilleure performance + sécurité.",
          ].join("\n"),
          quiz: {
            q: "Vous créez une page qui charge des produits depuis Supabase ET a un bouton 'Ajouter au panier' interactif. Comment structurez-vous ça ?",
            options: [
              "Tout en Client Component avec 'use client' en haut",
              "Tout en Server Component sans 'use client'",
              "La page principale en Server Component (charge les données), le bouton en Client Component séparé",
              "Impossible de combiner les deux",
            ],
            correct: 2,
            explanation: "La bonne pratique: pages en Server Component pour charger les données (plus rapide, sécurisé). Les boutons interactifs en Client Component importés dans la page. C'est exactement ce que fait lecomax.com: app/produit/[slug]/page.tsx est server, components/ProductActions.tsx est client."
          },
          exercise: "Listez 5 fichiers de lecomax.com et pour chacun:\n1. Server ou Client Component ?\n2. Comment vous le savez ? ('use client' présent ou non)"
        },
      ]
    },
    {
      id: "security", icon: "🔐", color: "#ef4444",
      title: "Sécurité — Protéger son Site",
      desc: "Les 10 menaces qui coulent les sites web et comment les éviter dans lecomax.com",
      lessons: [
        {
          title: "Les variables d'environnement — Ne jamais exposer les secrets",
          why: "Votre code est public sur GitHub. Si vous écrivez votre clé Supabase directement dans le code, n'importe qui peut vider votre base de données. Les variables d'env gardent les secrets HORS du code.",
          analogy: "🔑 Le coffre-fort\nVotre code = la maison. N'importe qui peut la visiter.\nVos secrets = les bijoux. Ils ne doivent PAS être dans la maison.\nLes variables d'env = le coffre-fort à la banque. Seuls les autorisés y accèdent.",
          content: [
            "COMMENT ÇA MARCHE:",
            "",
            "// ❌ DANGEREUX — secret dans le code",
            "const sb = createClient(",
            "  'https://xxx.supabase.co',",
            "  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // TOUT LE MONDE VOIT ÇA",
            ");",
            "",
            "// ✅ SÉCURISÉ — secret dans .env.local",
            "const sb = createClient(",
            "  process.env.NEXT_PUBLIC_SUPABASE_URL!,",
            "  process.env.SUPABASE_SERVICE_ROLE_KEY!",
            ");",
            "",
            "DEUX TYPES DE VARIABLES:",
            "",
            "NEXT_PUBLIC_xxx   → Visible dans le navigateur",
            "→ N'Y METTEZ que des valeurs non-secrètes",
            "→ Ex: URL Supabase (publique), clé anon (sécurisée par RLS)",
            "",
            "SANS NEXT_PUBLIC_  → Seulement sur le serveur",
            "→ SECRÈTES: clé service_role, RESEND, SESSION_SECRET",
            "→ Jamais accessibles depuis le browser",
            "",
            ".env.local = fichier JAMAIS commité sur GitHub (.gitignore)",
            "",
            "STOCKAGE EN PRODUCTION:",
            "Vercel Dashboard → Settings → Environment Variables",
            "→ Chaque variable ajoutée manuellement",
            "→ Chiffrement automatique au repos et en transit",
            "",
            "VÉRIFIER QU'UNE VARIABLE EXISTE (sécurité défensive):",
            "if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {",
            "  throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante!');",
            "}",
            "",
            "ERREUR CLASSIQUE:",
            "Committer accidentellement .env.local sur GitHub.",
            "→ Même supprimé après, l'historique Git garde la trace.",
            "→ Solution: révoquer IMMÉDIATEMENT toutes les clés compromises.",
            "",
            "RÈGLE D'OR:",
            "Imaginez que votre code est sur un panneau publicitaire.",
            "Ne mettez JAMAIS dans le code ce que vous ne voudriez pas voir sur ce panneau.",
          ].join("\n"),
          quiz: {
            q: "Quelle est la différence entre NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY ?",
            options: [
              "Aucune différence, les deux sont secrètes",
              "NEXT_PUBLIC_ est envoyée au navigateur (publique), sans ce préfixe = seulement côté serveur (secrète)",
              "NEXT_PUBLIC_ est pour Next.js, l'autre pour Supabase",
              "NEXT_PUBLIC_ fonctionne en local, l'autre en production",
            ],
            correct: 1,
            explanation: "NEXT_PUBLIC_ = inclus dans le bundle JavaScript envoyé au navigateur → visible par tout le monde. Sans ce préfixe = seulement disponible côté serveur Node.js → jamais envoyé au client. La service_role key donne un accès TOTAL à votre DB — jamais côté client."
          },
          exercise: "Ouvrez .gitignore à la racine du projet.\nVérifiez que .env.local y est bien.\nSi quelqu'un supprimait .env.local de .gitignore et commitait accidentellement, quelle serait la PREMIÈRE chose à faire ?"
        },
        {
          title: "Validation des entrées — Ne jamais faire confiance aux données",
          why: "Chaque donnée qui vient d'un utilisateur peut être malveillante. Un hacker peut envoyer du code SQL dans un champ texte (SQL Injection), du HTML/JavaScript dans un titre (XSS), ou un nombre négatif comme prix.",
          analogy: "🍽️ Le restaurant et l'allergique\nLe client dit: 'Je suis allergique aux noix'.\nUn bon restaurant VÉRIFIE chaque ingrédient.\nUn restaurant négligent prend la parole du client pour acquise.\n\nDe même: ne JAMAIS croire ce qu'un utilisateur envoie.",
          content: [
            "LES ATTAQUES COURANTES:",
            "",
            "1. SQL INJECTION:",
            "// L'utilisateur entre: ' OR '1'='1",
            "// Dans une requête non-protégée:",
            "db.query('SELECT * FROM users WHERE email = \'' + email + '\'');",
            "// → La requête devient:",
            "// SELECT * FROM users WHERE email = '' OR '1'='1'",
            "// → Retourne TOUS les utilisateurs!",
            "",
            "// PROTECTION: Supabase utilise des requêtes paramétrées automatiquement",
            "supabase.from('users').select().eq('email', email);",
            "// → email est séparé de la requête SQL → injection impossible",
            "",
            "2. XSS (Cross-Site Scripting):",
            "// L'utilisateur entre: <script>volerLesCookies()</script>",
            "// Si affiché sans protection: le script s'exécute!",
            "",
            "// PROTECTION: React échappe automatiquement les valeurs dans JSX",
            "<p>{commentaireUtilisateur}</p>",
            "// → React affiche littéralement '<script>...' comme texte",
            "",
            "// DANGER: dangerouslySetInnerHTML",
            "<div dangerouslySetInnerHTML={{ __html: html }} />",
            "// → Si html vient d'un utilisateur → XSS possible",
            "// → N'utiliser QUE si vous contrôlez entièrement le HTML",
            "",
            "3. VALIDATION DANS LES API ROUTES (lecomax.com):",
            "export async function POST(req: NextRequest) {",
            "  const body = await req.json();",
            "  const { title, content } = body;",
            "",
            "  // Validation obligatoire:",
            "  if (!title || typeof title !== 'string') {",
            "    return NextResponse.json({ error: 'Titre invalide' }, { status: 400 });",
            "  }",
            "  if (title.length > 200) {",
            "    return NextResponse.json({ error: 'Titre trop long' }, { status: 400 });",
            "  }",
            "  if (title.length < 3) {",
            "    return NextResponse.json({ error: 'Titre trop court' }, { status: 400 });",
            "  }",
            "",
            "  // Seulement après validation → insérer en DB",
            "  await sb.from('posts').insert({ title, content });",
            "}",
            "",
            "RÈGLE D'OR:",
            "Validate on the server ALWAYS.",
            "La validation frontend (HTML required, JS) = confort pour l'utilisateur.",
            "La validation backend = sécurité réelle.",
            "Un hacker peut ignorer toute validation frontend.",
          ].join("\n"),
          quiz: {
            q: "Vous avez mis 'required' sur un champ HTML. Est-ce suffisant pour sécuriser votre formulaire ?",
            options: [
              "Oui, le navigateur bloque les soumissions vides",
              "Non, un hacker peut envoyer une requête directement à votre API sans passer par le formulaire HTML",
              "Oui, TypeScript vérifie aussi les types",
              "Non, mais c'est suffisant pour un petit site",
            ],
            correct: 1,
            explanation: "Un hacker utilise curl, Postman, ou du code pour envoyer des requêtes DIRECTEMENT à /api/orders — sans passer par votre HTML. La validation HTML = UX. La validation côté serveur = sécurité. TOUJOURS valider côté serveur."
          },
          exercise: "Ouvrez app/api/ecomedia/posts/route.ts dans l'explorateur.\nTrouvez toutes les validations. Pour chaque validation:\n1. Qu'est-ce qu'elle vérifie ?\n2. Quelle attaque empêche-t-elle ?\n3. Y a-t-il des validations MANQUANTES selon vous ?"
        },
      ]
    },
  ];

  const ch = curriculum[chap];
  const lesson = ch?.lessons[lessonIdx];

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white text-lg">🎓</div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Mentor Interactif — Senior Engineer</h2>
            <p className="text-sm text-gray-500">Chaque concept expliqué comme si vous aviez un senior à côté de vous</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <span className="text-lg">💡</span>
          <p className="text-[12px] text-amber-800 leading-relaxed font-medium">
            <strong>Philosophie:</strong> Pourquoi AVANT Comment. Chaque leçon explique d&apos;abord POURQUOI quelque chose existe, puis HOW ça fonctionne. Avec analogies, code réel de lecomax.com, quiz et exercices.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm lg:hidden">
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Chapitre</span>
          <select value={chap} onChange={event => { setChap(Number(event.target.value)); setLessonIdx(0); setQuizAnswer(null); setShowAnswer(false); }}
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-bold text-gray-900 outline-none focus:border-[#16b277] focus:ring-2 focus:ring-[#16b277]/20">
            {curriculum.map((c, i) => <option key={c.id} value={i}>{i + 1}. {c.title}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Leçon</span>
          <select value={lessonIdx} onChange={event => { setLessonIdx(Number(event.target.value)); setQuizAnswer(null); setShowAnswer(false); }}
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-base font-semibold text-gray-900 outline-none focus:border-[#16b277] focus:ring-2 focus:ring-[#16b277]/20">
            {ch.lessons.map((l, i) => <option key={i} value={i}>{i + 1}. {l.title}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Curriculum sidebar */}
        <div className="hidden shrink-0 space-y-1 lg:block lg:w-52">
          {curriculum.map((c, i) => (
            <button key={c.id} onClick={() => { setChap(i); setLessonIdx(0); setQuizAnswer(null); setShowAnswer(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${chap === i ? "text-white shadow-md" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}`}
              style={chap === i ? { backgroundColor: c.color } : {}}>
              <div className="flex items-center gap-2">
                <span>{c.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black truncate">{c.title}</p>
                  <p className="text-[9px] opacity-70">{c.lessons.length} leçons</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Lesson tabs */}
          <div className="mb-4 hidden flex-wrap gap-1 lg:flex">
            {ch.lessons.map((l, i) => (
              <button key={i} onClick={() => { setLessonIdx(i); setQuizAnswer(null); setShowAnswer(false); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${lessonIdx === i ? "text-white" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}`}
                style={lessonIdx === i ? { backgroundColor: ch.color } : {}}>
                {i + 1}. {l.title.split('—')[0].trim().slice(0, 25)}{l.title.length > 25 ? '…' : ''}
              </button>
            ))}
          </div>

          {lesson && (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-2xl border border-neutral-100 bg-white p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: ch.color }}>{ch.icon} {ch.title}</p>
                <h3 className="text-[17px] font-black mb-3">{lesson.title}</h3>

                {/* WHY */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1.5">🤔 POURQUOI ça existe ?</p>
                  <p className="text-sm leading-relaxed text-blue-900">{lesson.why}</p>
                </div>

                {/* Analogy */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1.5">🌍 Analogie avec la vraie vie</p>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-amber-900">{lesson.analogy}</pre>
                </div>
              </div>

              {/* Code & Explanation */}
              <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50">
                  <p className="text-[11px] font-black text-neutral-500 uppercase tracking-widest">📝 Explication détaillée + Code réel</p>
                </div>
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-[11px] leading-relaxed p-5 overflow-x-auto font-mono whitespace-pre-wrap m-4 rounded-xl"><code>{lesson.content}</code></pre>
              </div>

              {/* Quiz */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">🧪 Mini Quiz — Testez votre compréhension</p>
                <p className="text-[14px] font-bold text-gray-900 mb-4 leading-snug whitespace-pre-line">{lesson.quiz.q}</p>
                <div className="space-y-2 mb-4">
                  {lesson.quiz.options.map((opt, i) => (
                    <button key={i}
                      onClick={() => { setQuizAnswer(i); setShowAnswer(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-medium transition-all border-2 ${
                        quizAnswer === i
                          ? showAnswer
                            ? i === lesson.quiz.correct
                              ? "bg-green-50 border-green-400 text-green-800"
                              : "bg-red-50 border-red-400 text-red-800"
                            : "bg-black border-black text-white"
                          : showAnswer && i === lesson.quiz.correct
                          ? "bg-green-50 border-green-400 text-green-800"
                          : "bg-neutral-50 border-neutral-200 hover:border-neutral-400"
                      }`}>
                      <span className="font-black mr-2">{['A', 'B', 'C', 'D'][i]}.</span> {opt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAnswer(true)}
                    disabled={quizAnswer === null}
                    className="px-4 py-2 bg-black text-white text-[12px] font-black rounded-xl disabled:opacity-40 hover:bg-neutral-800 transition-colors active:scale-95">
                    Vérifier ma réponse
                  </button>
                  {showAnswer && (
                    <p className="text-[12px] font-bold">
                      {quizAnswer === lesson.quiz.correct ? "✅ Correct!" : "❌ Incorrect"}
                    </p>
                  )}
                </div>
                {showAnswer && (
                  <div className="mt-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider mb-1">Explication</p>
                    <p className="text-[12px] text-neutral-700 leading-relaxed">{lesson.quiz.explanation}</p>
                  </div>
                )}
              </div>

              {/* Exercise */}
              <div className="bg-[#0d0d0d] rounded-2xl p-5">
                <p className="text-[10px] font-black text-[#3ecf4c] uppercase tracking-widest mb-2">💪 Exercice pratique</p>
                <pre className="text-[12px] text-white/80 leading-relaxed font-sans whitespace-pre-wrap">{lesson.exercise}</pre>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { if (lessonIdx > 0) { setLessonIdx(l => l - 1); setQuizAnswer(null); setShowAnswer(false); } else if (chap > 0) { setChap(c => c - 1); setLessonIdx(curriculum[chap - 1].lessons.length - 1); setQuizAnswer(null); setShowAnswer(false); } }}
                  disabled={chap === 0 && lessonIdx === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-[12px] font-bold text-neutral-600 hover:border-neutral-400 disabled:opacity-40 transition-colors">
                  ← Leçon précédente
                </button>
                <span className="text-[11px] text-neutral-400 font-semibold">
                  {curriculum.slice(0, chap).reduce((s, c) => s + c.lessons.length, 0) + lessonIdx + 1}
                  {' / '}
                  {curriculum.reduce((s, c) => s + c.lessons.length, 0)} leçons
                </span>
                <button
                  onClick={() => {
                    if (lessonIdx < ch.lessons.length - 1) { setLessonIdx(l => l + 1); setQuizAnswer(null); setShowAnswer(false); }
                    else if (chap < curriculum.length - 1) { setChap(c => c + 1); setLessonIdx(0); setQuizAnswer(null); setShowAnswer(false); }
                  }}
                  disabled={chap === curriculum.length - 1 && lessonIdx === ch.lessons.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-[12px] font-bold hover:bg-neutral-800 disabled:opacity-40 transition-colors active:scale-95">
                  Leçon suivante →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
