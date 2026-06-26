"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

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

  useEffect(() => {
    fetch("/api/dev-docs/tree")
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setTree(d) : setError(true))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const onSelect = useCallback(async (node: FileNode) => {
    setSelected(node); setCode(null); setCodeLoading(true);
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

      <div className="flex min-h-[640px] bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-white/[0.08] flex flex-col">
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
        <div className="flex-1 min-w-0 flex flex-col">
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
];

function HeroSection() {
  const [openPhase, setOpenPhase] = useState<string | null>("00");
  const [openSteps, setOpenSteps] = useState<Record<string, string | null>>({ "00": "Étape 1 — Installer Node.js (v20 LTS)" });
  const [copied, setCopied] = useState("");

  const copy = (text: string, k: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(k); setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">De 0 à Héros — Construction complète du site</h2>
        <p className="text-sm text-gray-500 mt-1">Chaque phase de la création : configuration → initialisation → Supabase → frontend → admin → APIs → GitHub → Vercel → Namecheap → outils de croissance.</p>
      </div>
      <div className="relative">
        <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gray-200" />
        <div className="space-y-3">
          {PHASES.map(phase => (
            <div key={phase.num} className="relative pl-10">
              <div className={`absolute left-0 top-3 w-9 h-9 rounded-full ${phase.color} flex items-center justify-center text-white text-[11px] font-black shadow-sm`}>{phase.num}</div>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setOpenPhase(openPhase === phase.num ? null : phase.num)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${phase.color} shrink-0`} />
                  <p className="flex-1 font-bold text-sm text-gray-900">{phase.label}</p>
                  <span className="text-[11px] text-gray-400 shrink-0">{phase.steps.length} étape{phase.steps.length > 1 ? "s" : ""}</span>
                  <svg className={`shrink-0 text-gray-400 transition-transform ${openPhase === phase.num ? "rotate-180" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {openPhase === phase.num && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {phase.steps.map(step => {
                      const key = `${phase.num}-${step.title}`;
                      const isOpen = openSteps[phase.num] === step.title;
                      return (
                        <div key={step.title}>
                          <button onClick={() => setOpenSteps(p => ({ ...p, [phase.num]: isOpen ? null : step.title }))}
                            className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            <p className="flex-1 text-[13px] font-semibold text-gray-800">{step.title}</p>
                            <svg className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-4 space-y-3">
                              <p className="text-[12px] text-gray-600 leading-relaxed">{step.desc}</p>
                              <div className="relative group">
                                <pre className="bg-[#0d0d0d] text-[11px] font-mono leading-relaxed rounded-xl p-4 overflow-x-auto text-[#d4d4d4] whitespace-pre border border-white/[0.08] max-h-80 overflow-y-auto">{step.code}</pre>
                                <button onClick={() => copy(step.code, key)}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  {copied === key ? "✓ Copié" : "Copier"}
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

// ─── Architecture ─────────────────────────────────────────────────────────────
function ArchSection() {
  return (
    <div className="space-y-6">
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">Architecture complète</h2><p className="text-sm text-gray-500 mt-1">Comment GitHub, Vercel, Supabase et les APIs externes s&apos;articulent.</p></div>
      <div className="bg-[#0d0d0d] rounded-2xl p-6 border border-white/[0.06]">
        <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-5">FLUX DE DÉPLOIEMENT</p>
        <div className="flex flex-wrap items-center gap-2 justify-center mb-8">
          {[["👨‍💻","Développeur","VS Code local","border-violet-500/40 bg-violet-500/10"],["→","","","border-0 bg-transparent text-white/20 text-xl flex items-center"],["🐙","GitHub","git push origin main","border-white/10 bg-white/5"],["→","","","border-0 bg-transparent text-white/20 text-xl flex items-center"],["▲","Vercel","Build & Deploy auto","border-white/10 bg-white/5"],["→","","","border-0 bg-transparent text-white/20 text-xl flex items-center"],["🌐","lecomax.com","CDN mondial","border-emerald-500/40 bg-emerald-500/10"]].map(([icon, label, sub, cls], i) =>
            icon === "→" ? <div key={i} className="text-white/20 text-xl hidden sm:block">→</div> :
            <div key={i} className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border ${cls} min-w-[100px]`}>
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
            { label: "SERVICES EMAIL", color: "text-orange-400", items: ["Resend — confirmations","Nodemailer — SMTP","EmailJS — contact form","imapflow — IMAP inbox"], dot: "bg-orange-400" },
            { label: "AUTRES APIS", color: "text-pink-400", items: ["OpenAI — IA admin","PayPal — paiements","web-push — notifications","Vercel Analytics"], dot: "bg-pink-400" },
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
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-3">Commande client → Bdd → Email</h3>
          {["Client remplit checkout (/checkout)","POST /api/orders — validation des données","Supabase INSERT dans la table orders","Resend envoie l'email de confirmation","Réponse { orderNumber } → redirect /merci","CartContext.clear() → panier vidé","Admin voit la commande dans /admin/orders"].map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] mb-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{i+1}</span>
              <span className="text-gray-600">{s}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-3">Admin crée produit → Visible sur le site</h3>
          {["Admin visite /admin/products","Remplit le formulaire (nom, prix, images, stock)","(Optionnel) Clique 'Générer avec IA' → OpenAI","POST /api/products → Supabase INSERT","Produit actif dans la table products","Visiteur charge /chaussures → GET /api/products","Produit affiché dans la grille produits"].map((s, i) => (
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
function TechSec() {
  const [exp, setExp] = useState<string|null>(null);
  return (
    <div className="space-y-4">
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">Stack technique</h2><p className="text-sm text-gray-500 mt-1">Toutes les technologies, versions, et pourquoi chacune a été choisie.</p></div>
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
function EnvSec() {
  return (
    <div className="space-y-4">
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">Variables d&apos;environnement</h2><p className="text-sm text-gray-500 mt-1">Toutes les variables du projet. Valeurs jamais affichées ici.</p></div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-[12px]">
        <span className="text-amber-500">⚠️</span>
        <div><strong className="text-amber-800">Règle d&apos;or :</strong><span className="text-amber-700"> Variables <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_</code> sont exposées au navigateur — jamais de secrets dedans. Configurer les secrets dans <code className="bg-amber-100 px-1 rounded">.env.local</code> (local) et dans le <strong>Vercel Dashboard → Settings → Env</strong> (production).</span></div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Variable</th><th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rôle</th><th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fichier(s)</th><th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {ENV.map(v => (
                <tr key={v.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><code className="text-[11px] font-mono text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">{v.name}</code></td>
                  <td className="px-4 py-3 text-gray-600">{v.purpose}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-[10px] hidden lg:table-cell">{v.where}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${v.secret?"bg-red-100 text-red-700 border-red-200":"bg-green-100 text-green-700 border-green-200"}`}>{v.secret?"SECRET":"PUBLIC"}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${v.req?"bg-gray-100 text-gray-600 border-gray-200":"bg-slate-50 text-slate-500 border-slate-200"}`}>{v.req?"REQUIS":"OPTIONNEL"}</span>
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
    { type:"Page", title:"/", desc:"Accueil — Hero, catégories, produits vedettes" },
    { type:"Page", title:"/[category]", desc:"Page catégorie dynamique — grille filtrée" },
    { type:"Page", title:"/produit/[slug]", desc:"Fiche produit — galerie, couleurs, tailles, add to cart" },
    { type:"Page", title:"/checkout", desc:"Checkout — adresse + paiement PayPal/COD" },
    { type:"Page", title:"/admin/dashboard", desc:"Dashboard — revenus, commandes, stats" },
    { type:"Page", title:"/admin/products", desc:"CRUD produits avec IA" },
    { type:"Page", title:"/admin/orders", desc:"Commandes avec statuts" },
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
  API:"bg-emerald-100 text-emerald-700 border-emerald-200",Concept:"bg-cyan-100 text-cyan-700 border-cyan-200",
};
function SearchSec() {
  const [q, setQ] = useState("");
  const res = useMemo(() => {
    if (!q.trim()) return [];
    const ql = q.toLowerCase();
    return ITEMS.filter(i => i.title.toLowerCase().includes(ql) || i.desc.toLowerCase().includes(ql)).slice(0, 50);
  }, [q]);
  return (
    <div className="space-y-4">
      <div className="mb-4"><h2 className="text-xl font-black text-gray-900">Recherche</h2><p className="text-sm text-gray-500 mt-1">Cherchez parmi {ITEMS.length} éléments : fichiers, packages, APIs, concepts, routes, variables.</p></div>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="CartContext, SUPABASE, /api/orders, middleware, PayPal, OpenAI…" autoFocus
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" />
        </div>
        {!q && <div className="mt-3 flex flex-wrap gap-2">{["CartContext","supabase","auth","orders","RESEND","checkout","middleware","OpenAI","PayPal","push","Vercel"].map(s => (
          <button key={s} onClick={() => setQ(s)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[12px] font-medium transition-colors">{s}</button>
        ))}</div>}
      </div>
      {q && (
        <div>
          <p className="text-[12px] text-gray-500 mb-3">{res.length} résultat{res.length !== 1 ? "s" : ""}</p>
          {res.length === 0
            ? <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center text-gray-400 text-sm">Aucun résultat pour &quot;{q}&quot;</div>
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

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"hero",   icon:"🚀", label:"De 0 à Héros"  },
  { id:"arch",   icon:"🏗️", label:"Architecture"  },
  { id:"files",  icon:"📁", label:"Explorateur"   },
  { id:"tech",   icon:"⚙️", label:"Stack"         },
  { id:"env",    icon:"🔐", label:"Env Variables" },
  { id:"search", icon:"🔍", label:"Recherche"     },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HowItWasBuiltPage() {
  const [tab, setTab] = useState("hero");
  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0d0d0d] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-black text-gray-900">How Website Was Built</h1>
              <p className="text-[11px] text-gray-400 hidden sm:block">Explorateur de code réel · De 0 à Héros · Architecture complète</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {["Next.js 15","Supabase","Vercel"].map(b => (
              <span key={b} className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-gray-100 text-gray-600 border-gray-200">{b}</span>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <div className="flex gap-0.5 min-w-max pb-px">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold border-b-2 whitespace-nowrap transition-colors ${tab === t.id ? "border-[#3ecf4c] text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                <span>{t.icon}</span><span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "hero"   && <HeroSection />}
        {tab === "arch"   && <ArchSection />}
        {tab === "files"  && <ExplorerSection />}
        {tab === "tech"   && <TechSec />}
        {tab === "env"    && <EnvSec />}
        {tab === "search" && <SearchSec />}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-[#0d0d0d] rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm">Code source réel — Filesystem live via API</p>
            <p className="text-white/40 text-[12px] mt-0.5">Explorateur lit directement le disque · Aucune donnée fictive · Admin-only</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Next.js 15.0.3","React 19","TypeScript 5.7","Supabase","Vercel","Resend","OpenAI","web-push"].map(t => (
              <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border border-white/20 text-white/60 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
