"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

// ─── Language ─────────────────────────────────────────────────────────────────
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
    tabs: { hero: "De 0 à Héros", arch: "Architecture", files: "Explorateur", tech: "Stack", env: "Variables", pages: "Toutes les Pages", search: "Recherche" },
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
    tabs: { hero: "0 to Hero", arch: "Architecture", files: "Explorer", tech: "Stack", env: "Variables", pages: "All Pages", search: "Search" },
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
    tabs: { hero: "من الصفر", arch: "البنية", files: "المستكشف", tech: "التقنيات", env: "المتغيرات", pages: "جميع الصفحات", search: "بحث" },
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
          className="w-full flex items-center gap-1.5 py-[3px] pr-2 text-[12px] hover:bg-white/8 rounded text-left transition-colors"
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
      className={`w-full flex items-center gap-1.5 py-[3px] pr-2 text-[12px] rounded text-left transition-colors ${isSel ? "bg-[#094771] text-white" : "hover:bg-white/8 text-white/55"}`}
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

      <div className="flex min-h-[500px] sm:min-h-[640px] bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
        {/* Mobile toggle */}
        <div className="sm:hidden absolute z-10 flex w-full border-b border-white/[0.08] bg-[#252526]" style={{position:"relative"}}>
          <button onClick={() => setMobileView("tree")}
            className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${mobileView === "tree" ? "text-white bg-[#1e1e1e] border-t-2 border-t-[#3ecf4c]" : "text-white/40 hover:text-white/70"}`}>
            📁 Fichiers
          </button>
          <button onClick={() => setMobileView("code")}
            className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${mobileView === "code" ? "text-white bg-[#1e1e1e] border-t-2 border-t-[#3ecf4c]" : "text-white/40 hover:text-white/70"}`}>
            📄 {selected ? selected.name : "Code"}
          </button>
        </div>
        {/* Sidebar */}
        <div className={`${mobileView === "code" ? "hidden sm:flex" : "flex"} w-full sm:w-56 shrink-0 border-r border-white/[0.08] flex-col`}>
          <div className="px-3 py-2.5 border-b border-white/[0.08] bg-[#252526]">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">LECOMAX</p>
            <div className="relative">
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-white/25" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={treeQ} onChange={e => setTreeQ(e.target.value)} placeholder="Filtrer…"
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg pl-6 pr-2 py-1.5 text-[11px] text-white/60 placeholder-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.09] transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {loading && <p className="px-3 py-6 text-white/30 text-[11px]">Chargement de l&apos;arbre…</p>}
            {error && <p className="px-3 py-6 text-red-400 text-[11px]">Erreur. Vérifiez que vous êtes bien connecté en tant qu&apos;admin.</p>}
            {!loading && !error && filtered.length === 0 && <p className="px-3 py-6 text-white/30 text-[11px]">Aucun fichier trouvé.</p>}
            {filtered.map(node => (
              <TreeNode key={node.path} node={node} depth={0} selected={selected?.path ?? null} onSelect={onSelect} expanded={expanded} onToggle={onToggle} />
            ))}
          </div>
        </div>

        {/* Code viewer */}
        <div className={`${mobileView === "tree" ? "hidden sm:flex" : "flex"} flex-1 min-w-0 flex-col`}>
          {/* File tab */}
          <div className="flex items-center gap-0 border-b border-white/[0.08] bg-[#252526] min-h-[36px]">
            {selected ? (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-[#1e1e1e] border-t-2 border-t-[#007acc]">
                <FileIcon ext={selected.ext} />
                <span className="text-white text-[12px] font-medium">{selected.name}</span>
                {selected.ext && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${EXT_BG[selected.ext] ?? "bg-gray-800 text-gray-400"}`}>{selected.ext.toUpperCase()}</span>}
              </div>
            ) : <div className="px-4 py-2 text-white/20 text-[12px]">Sélectionnez un fichier dans l&apos;arborescence</div>}
            {selected && (
              <div className="ml-auto px-3 flex items-center gap-3">
                <span className="text-white/20 text-[9px] font-mono hidden md:block">{selected.path}</span>
                <button onClick={() => { if (code) { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}}
                  className="text-white/40 hover:text-white text-[10px] flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  {copied ? "✓ Copié" : "Copier"}
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
              <div className="flex text-[11.5px] font-mono">
                <div className="select-none shrink-0 text-right text-white/20 bg-[#1e1e1e] px-3 py-4 leading-[1.65] min-w-[42px] border-r border-white/[0.06]">
                  {(code ?? "").split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <pre className="flex-1 text-[#d4d4d4] px-4 py-4 leading-[1.65] overflow-x-auto whitespace-pre">
                  {highlight(code ?? "", selected.ext)}
                </pre>
              </div>
            )}
          </div>

          {/* Status bar */}
          {selected && (
            <div className="bg-[#007acc] px-4 py-1 flex items-center gap-4 text-[10px] text-white/80 shrink-0">
              <span className="truncate">{selected.path}</span>
              <span className="ml-auto shrink-0">{lines} lignes</span>
              {!!selected.size && <span className="shrink-0">{fmtSize(selected.size)}</span>}
              {selected.ext && <span className="uppercase shrink-0">{selected.ext}</span>}
            </div>
          )}
        </div>
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
  const [openPhase, setOpenPhase] = useState<string | null>("00");
  const [openSteps, setOpenSteps] = useState<Record<string, number | null>>({ "00": 0 });
  const [copied, setCopied] = useState("");

  const copy = (text: string, k: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(k); setTimeout(() => setCopied(""), 2000);
  };

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
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">{u.heroTitle}</h2>
        <p className="text-sm text-gray-500 mt-1">{u.heroSub}</p>
      </div>
      <div className="relative">
        <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gray-200" />
        <div className="space-y-3">
          {PHASES.map(phase => (
            <div key={phase.num} className="relative pl-10">
              <div className={`absolute left-0 top-3 w-9 h-9 rounded-full ${phase.color} flex items-center justify-center text-white text-[11px] font-black shadow-sm`}>{phase.num}</div>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setOpenPhase(openPhase === phase.num ? null : phase.num)}
                  className="w-full flex items-start gap-3 px-4 sm:px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${phase.color} shrink-0 mt-[5px]`} />
                  <p className="flex-1 font-bold text-sm text-gray-900">{getPhaseLabel(phase)}</p>
                  <span className="text-[11px] text-gray-400 shrink-0 mt-0.5 ml-2">{phase.steps.length} {u.stepLabel}</span>
                  <svg className={`shrink-0 text-gray-400 transition-transform ${openPhase === phase.num ? "rotate-180" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {openPhase === phase.num && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {phase.steps.map((step, idx) => {
                      const key = `${phase.num}-${idx}`;
                      const isOpen = openSteps[phase.num] === idx;
                      const { title: stTitle, desc: stDesc } = getStepLabel(phase.num, idx, step);
                      return (
                        <div key={idx}>
                          <button onClick={() => setOpenSteps(p => ({ ...p, [phase.num]: isOpen ? null : idx }))}
                            className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            <p className="flex-1 text-[13px] font-semibold text-gray-800 leading-tight">{stTitle}</p>
                            <svg className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                          {isOpen && (
                            <div className="px-4 sm:px-5 pb-4 space-y-3">
                              <p className="text-[12px] text-gray-600 leading-relaxed">{stDesc}</p>
                              {lang !== "fr" && step.desc !== stDesc && (
                                <p className="text-[11px] text-gray-400 italic leading-relaxed border-l-2 border-gray-200 pl-3">{step.desc}</p>
                              )}
                              <div className="relative group">
                                <pre className="bg-[#0d0d0d] text-[11px] font-mono leading-relaxed rounded-xl p-4 overflow-x-auto text-[#d4d4d4] whitespace-pre border border-white/[0.08] max-h-80 overflow-y-auto">{step.code}</pre>
                                <button onClick={() => copy(step.code, key)}
                                  className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  {copied === key ? u.copied : u.copy}
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
          ))}
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
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {(["all","public","admin"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {f === "all" ? (lang === "ar" ? "الكل" : lang === "en" ? "All" : "Tout") : typeLabel(f)}
              <span className="ml-1 text-[10px] text-gray-400">{SITE_PAGES.filter(p => f === "all" || p.type === f).length}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder={lang === "ar" ? "ابحث في الصفحات…" : lang === "en" ? "Search pages…" : "Rechercher une page…"}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#3ecf4c]/30 focus:border-[#3ecf4c] transition-all" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 sm:px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Variable</th>
              <th className="text-left px-3 sm:px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{u.desc}</th>
              <th className="text-left px-3 sm:px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">{u.file}</th>
              <th className="text-left px-3 sm:px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{u.type}</th>
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
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={u.search_hint} autoFocus
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" />
        </div>
        {!q && <div className="mt-3 flex flex-wrap gap-2">{["CartContext","supabase","auth","orders","RESEND","checkout","middleware","OpenAI","PayPal","push","Vercel","/admin"].map(s => (
          <button key={s} onClick={() => setQ(s)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[12px] font-medium transition-colors">{s}</button>
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
                  <div><p className="font-semibold text-sm text-gray-900">{r.title}</p><p className="text-[12px] text-gray-500 mt-0.5">{r.desc}</p></div>
                </div>
              ))}</div>
          }
        </div>
      )}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TAB_IDS = ["hero","arch","files","tech","env","pages","search"] as const;
const TAB_ICONS: Record<string, string> = { hero:"🚀", arch:"🏗️", files:"📁", tech:"⚙️", env:"🔐", pages:"📄", search:"🔍" };

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HowItWasBuiltPage() {
  const [tab, setTab] = useState("hero");
  const [lang, setLang] = useState<Lang>("fr");
  const u = UI[lang];

  const LANG_FLAGS: Record<Lang, string> = { fr: "🇫🇷", en: "🇬🇧", ar: "🇸🇦" };

  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0d0d0d] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] sm:text-[15px] font-black text-gray-900 truncate">{u.title}</h1>
              <p className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block truncate">{u.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Language switcher */}
            <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-xl">
              {(["fr","en","ar"] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${lang === l ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  <span>{LANG_FLAGS[l]}</span>
                  <span className="hidden sm:inline uppercase">{l}</span>
                </button>
              ))}
            </div>
            {["Next.js 15","Vercel"].map(b => (
              <span key={b} className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-gray-100 text-gray-600 border-gray-200">{b}</span>
            ))}
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto">
          <div className="flex gap-0.5 min-w-max pb-px">
            {TAB_IDS.map(id => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2.5 text-[11px] sm:text-[12px] font-semibold border-b-2 whitespace-nowrap transition-colors ${tab === id ? "border-[#3ecf4c] text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                <span>{TAB_ICONS[id]}</span>
                <span>{u.tabs[id]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {tab === "hero"   && <HeroSection lang={lang} />}
        {tab === "arch"   && <ArchSection lang={lang} />}
        {tab === "files"  && <ExplorerSection />}
        {tab === "tech"   && <TechSec lang={lang} />}
        {tab === "env"    && <EnvSec lang={lang} />}
        {tab === "pages"  && <PagesSection lang={lang} />}
        {tab === "search" && <SearchSec lang={lang} />}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-8">
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
          <div className="flex flex-wrap gap-1.5">
            {["Next.js 15","React 19","TypeScript 5.7","Supabase","Vercel","Resend","OpenAI","web-push"].map(t => (
              <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border border-white/20 text-white/60 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
