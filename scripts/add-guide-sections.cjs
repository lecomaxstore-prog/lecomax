const fs = require('fs');

const newSections = `

// ─── GUIDE SECTION ────────────────────────────────────────────────────────────
function GuideSection() {
  const [open, setOpen] = React.useState<number | null>(0);
  const items = [
    {
      icon: "🗂️", title: "Pourquoi Next.js App Router ?",
      why: "Le App Router (Next.js 13+) permet le rendu côté serveur (SSR), la génération statique (ISR), et les composants serveur React — le tout sans configuration. C'est plus rapide qu'une SPA classique pour le SEO et le chargement initial.",
      code: `// app/page.tsx — Server component par défaut
export const revalidate = 60; // ISR: re-générer toutes les 60s

export default async function HomePage() {
  // Ce code tourne sur le SERVEUR — jamais exposé au client
  const data = await fetch("https://api.supabase.co/...", {
    headers: { Authorization: \`Bearer \${process.env.SUPABASE_SERVICE_ROLE_KEY}\` }
  });
  return <div>{/* data est déjà chargée, pas de spinner */}</div>;
}`,
      tip: "Règle : pages dans app/ = serveur par défaut. Ajoutez \"use client\" seulement quand vous avez besoin de useState, useEffect, ou événements browser."
    },
    {
      icon: "🗄️", title: "Comment fonctionne Supabase ?",
      why: "Supabase est une alternative open-source à Firebase. Il donne PostgreSQL + Auth + Storage + Realtime + API REST auto-générée. Ici on l'utilise comme base de données principale pour produits, commandes, reviews, Ecomedia, etc.",
      code: `// lib/supabase.ts — Client côté navigateur (clé anon publique)
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Dans une API route — service role bypasse les RLS
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← jamais dans NEXT_PUBLIC_
);

// Lecture
const { data, error } = await sb.from("products").select("*").eq("active", true);

// Insertion
const { error } = await sb.from("orders").insert({ ...orderData });

// Upsert (insert ou update)
await sb.from("ecomedia_likes").upsert({ post_id, visitor_id }, { onConflict: "post_id,visitor_id" });`,
      tip: "NEXT_PUBLIC_SUPABASE_ANON_KEY est sûre à exposer — elle est limitée par les Row Level Security (RLS) policies. La SERVICE_ROLE_KEY contourne tout — à garder secrète côté serveur."
    },
    {
      icon: "🔐", title: "Authentication Admin — Comment ça marche ?",
      why: "L'admin n'utilise PAS Supabase Auth. Il utilise un cookie HMAC-SHA256 signé avec un secret. Ça évite de dépendre d'un service externe pour l'accès critique.",
      code: `// lib/admin-session.ts (simplifié)
import { createHmac } from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET!;

export function createSessionToken(payload: object): string {
  const data = JSON.stringify(payload);
  const sig = createHmac("sha256", SECRET).update(data).digest("hex");
  return Buffer.from(JSON.stringify({ data, sig })).toString("base64");
}

export function verifySessionToken(token: string): object | null {
  try {
    const { data, sig } = JSON.parse(Buffer.from(token, "base64").toString());
    const expected = createHmac("sha256", SECRET).update(data).digest("hex");
    if (sig !== expected) return null; // falsifié
    return JSON.parse(data);
  } catch { return null; }
}

// Dans une API route admin:
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("admin_session")?.value;
  const session = verifySessionToken(cookie ?? "");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // continuer...
}`,
      tip: "Le middleware.ts vérifie ce cookie sur TOUTES les routes /admin/* avant même que la page charge. Si invalide → redirect /connexion."
    },
    {
      icon: "🛒", title: "Cycle complet d'une commande",
      why: "Comprendre le flux complet aide à déboguer les problèmes de commande. De l'ajout au panier jusqu'à l'email de confirmation.",
      code: `// 1. Client ajoute au panier (CartContext.tsx — localStorage)
addToCart(product, selectedColor, selectedSize);

// 2. Checkout (app/checkout/page.tsx) — formulaire client
// Valide les données, calcule le total

// 3. API POST /api/orders (app/api/orders/route.ts)
// Insère dans Supabase → table "orders"
const { data: order } = await sb.from("orders").insert({
  customer_name, customer_email, customer_phone,
  items: cart, total, status: "pending"
}).select().single();

// 4. Email de confirmation (app/api/send-confirmation/route.ts)
// Resend API → email HTML personnalisé
await resend.emails.send({
  from: "L'ecomax <noreply@lecomax.com>",
  to: customer_email,
  subject: \`Commande #\${order.order_number} confirmée\`,
  html: emailTemplate(order)
});

// 5. Admin reçoit notification WhatsApp (optionnel)
// via /api/whatsapp/send

// 6. Admin change status → "shipped" / "delivered"
// Client voit le status sur /suivre-commande`,
      tip: "Si une commande ne reçoit pas d'email : vérifiez RESEND_API_KEY dans Vercel, et vérifiez que le domaine lecomax.com est vérifié sur resend.com."
    },
    {
      icon: "🔄", title: "Comment les APIs Next.js fonctionnent",
      why: "Les routes dans app/api/ sont des serverless functions sur Vercel — elles tournent sur Node.js côté serveur, invisible au navigateur.",
      code: `// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET /api/products?category=chaussures
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  
  // Validation d'entrée — toujours valider!
  if (category && category.length > 50) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  
  const { data } = await sb.from("products")
    .select("*")
    .eq("active", true)
    .eq("category", category ?? "all");
    
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" }
  });
}

// POST /api/products (admin only)
export async function POST(req: NextRequest) {
  // 1. Vérifier auth
  const session = verifySessionToken(req.cookies.get("admin_session")?.value ?? "");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // 2. Parser le body
  const body = await req.json();
  
  // 3. Insérer
  const { data, error } = await sb.from("products").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data, { status: 201 });
}`,
      tip: "Toujours: 1) Valider les entrées, 2) Vérifier l'auth pour les endpoints protégés, 3) Retourner les bons codes HTTP (200, 201, 400, 401, 404, 500)."
    },
    {
      icon: "🎨", title: "Tailwind CSS — Principes clés",
      why: "Tailwind permet de styliser directement dans le JSX avec des classes utilitaires. Pas de CSS à écrire. Chaque classe fait une seule chose.",
      code: `// ❌ Mauvais — CSS séparé
<div className="product-card">

// ✅ Bien — Tailwind inline
<div className="bg-white border border-neutral-100 rounded-2xl p-4 hover:shadow-lg transition-all">

// Responsive: mobile-first
<div className="text-sm md:text-base lg:text-lg">

// Dark mode (si configuré)
<div className="bg-white dark:bg-neutral-900">

// Groupes hover
<div className="group">
  <div className="opacity-0 group-hover:opacity-100 transition-opacity">

// Couleurs personnalisées du site (tailwind.config.js)
// #3ecf4c = vert principal
// #16b277 = vert foncé
// #0d0d0d = noir

// Animation personnalisée (globals.css)
// .animate-ecomedia-float → keyframes dans globals.css`,
      tip: "Pour les valeurs non-standard, utilisez les brackets: text-[13px], bg-[#3ecf4c], w-[calc(100%-2rem)]. Évitez de hardcoder trop — préférez les classes Tailwind standards."
    },
    {
      icon: "📦", title: "Gestion des images produits (Supabase Storage)",
      why: "Les images sont uploadées dans Supabase Storage (bucket 'product-images'), pas sur le serveur Vercel (éphémère). L'URL publique est stockée dans la table products.",
      code: `// Upload depuis l'admin (app/admin/products/page.tsx)
const file = event.target.files[0];
const filename = \`\${Date.now()}-\${Math.random().toString(36).slice(2)}\${ext}\`;

const { data, error } = await supabase.storage
  .from("product-images")
  .upload(filename, file, { contentType: file.type });

if (error) throw error;

// Obtenir l'URL publique
const { data: { publicUrl } } = supabase.storage
  .from("product-images")
  .getPublicUrl(filename);

// publicUrl = "https://xxx.supabase.co/storage/v1/object/public/product-images/filename.jpg"

// Supprimer une image
await supabase.storage.from("product-images").remove([filename]);

// Dans next.config.js — autoriser Supabase comme source d'images
remotePatterns: [
  { protocol: "https", hostname: "*.supabase.co" }
]`,
      tip: "Limits: 50MB par fichier par défaut. Formats supportés: JPEG, PNG, WEBP, AVIF, HEIC. Next.js optimise automatiquement via /_next/image/?url=... si le domaine est dans remotePatterns."
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
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="font-black text-[15px] text-gray-900">{item.title}</span>
            </div>
            <svg className={\`w-4 h-4 text-neutral-400 transition-transform \${open === i ? "rotate-180" : ""}\`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open === i && (
            <div className="px-5 pb-5 border-t border-neutral-100">
              <p className="text-[13px] text-neutral-600 mt-4 mb-4 leading-relaxed">{item.why}</p>
              <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-[11px] leading-relaxed p-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap"><code>{item.code}</code></pre>
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <span className="text-base shrink-0">💡</span>
                <p className="text-[12px] text-amber-800 leading-relaxed">{item.tip}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── DEBUG SECTION ─────────────────────────────────────────────────────────────
function DebugSection() {
  const issues = [
    {
      icon: "🔴", tag: "CRITIQUE", title: "Erreur de build TypeScript",
      symptom: "npx next build échoue avec 'Type error'",
      cause: "TypeScript est strict — variable potentiellement null, type manquant, ou import incorrect.",
      fix: \`// 1. Lire l'erreur exacte
// Ex: "Type error: 'selectedConv' is possibly 'null'"

// 2. Solutions:
const name = selectedConv?.name ?? "Inconnu"; // optional chaining
const name = selectedConv!.name; // non-null assertion (si vous êtes sûr)

// Ajouter un type à une variable
const [data, setData] = useState<MonType | null>(null);

// 3. Pour déboguer localement:
npx next build 2>&1 | grep "Type error" \`,
      color: "red"
    },
    {
      icon: "⚡", tag: "COURANT", title: "API 401 Unauthorized en production",
      symptom: "Fonctionne en local, mais 401 sur Vercel",
      cause: "Variables d'environnement manquantes sur Vercel ou cookie admin_session expiré.",
      fix: \`// 1. Vérifier Vercel Dashboard → Settings → Environment Variables
// Toutes les variables de .env.local doivent être dans Vercel

// 2. Vérifier que ADMIN_SESSION_SECRET est identique local/prod
// Si différent → les tokens créés en local ne fonctionnent pas en prod

// 3. Logs Vercel:
npx vercel logs lecomax.com --follow

// 4. En développement — simuler une erreur 401:
// Ouvrir DevTools → Application → Cookies → supprimer admin_session\`,
      color: "yellow"
    },
    {
      icon: "🖼️", tag: "COURANT", title: "Images qui n'apparaissent pas",
      symptom: "Image 404 ou domaine bloqué par Next.js Image",
      cause: "Le domaine de l'image n'est pas dans remotePatterns de next.config.js",
      fix: \`// next.config.js
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co" },     // Supabase Storage
    { protocol: "https", hostname: "images.unsplash.com" }, // Unsplash
    // Ajouter votre domaine ici si besoin
  ]
}

// Après modification next.config.js → redémarrer le serveur dev
// ctrl+C → npm run dev

// Vérifier l'URL dans la console browser (F12 → Network → Images)\`,
      color: "yellow"
    },
    {
      icon: "🗄️", tag: "COURANT", title: "Supabase 'permission denied for table'",
      symptom: "Error 403 ou 'permission denied' dans les logs Supabase",
      cause: "Row Level Security (RLS) activée mais aucune policy correspondante définie.",
      fix: \`-- Dans Supabase SQL Editor:

-- Option 1: Désactiver RLS (pour tests uniquement!)
ALTER TABLE ma_table DISABLE ROW LEVEL SECURITY;

-- Option 2: Créer une policy permissive (recommandé pour admin)
CREATE POLICY "allow_all" ON ma_table USING (true) WITH CHECK (true);

-- Option 3: Policy basée sur l'auth
CREATE POLICY "users_own_data" ON ma_table
  USING (auth.uid() = user_id);

-- GRANT si nécessaire
GRANT ALL ON TABLE ma_table TO postgres, service_role, authenticated, anon;\`,
      color: "yellow"
    },
    {
      icon: "🌐", tag: "COURANT", title: "CORS error en développement",
      symptom: "Console: 'CORS policy: No 'Access-Control-Allow-Origin'",
      cause: "Appel direct à une API externe depuis le browser au lieu de passer par une API route Next.js",
      fix: \`// ❌ Mauvais — appel direct depuis le client
const res = await fetch("https://api.externe.com/data", {
  headers: { Authorization: "Bearer " + SECRET_KEY } // EXPOSÉ!
});

// ✅ Bien — passer par une API route Next.js
// app/api/externe/route.ts (côté serveur, CORS transparent)
export async function GET() {
  const res = await fetch("https://api.externe.com/data", {
    headers: { Authorization: \`Bearer \${process.env.SECRET_KEY}\` }
  });
  return NextResponse.json(await res.json());
}

// Client appelle votre propre API
const res = await fetch("/api/externe");\`,
      color: "blue"
    },
    {
      icon: "🔄", tag: "PERF", title: "Page qui recharge infiniment (useEffect loop)",
      symptom: "useEffect se déclenche en boucle, API appelée des centaines de fois",
      cause: "Dépendance dans useEffect qui change à chaque render (objet ou tableau créé inline)",
      fix: \`// ❌ Mauvais — options est recréé à chaque render
useEffect(() => {
  fetchData(options);
}, [options]); // options = {} → nouvel objet à chaque render!

// ✅ Solutions:
// 1. Dépendances primitives seulement
useEffect(() => {
  fetchData(userId, category);
}, [userId, category]);

// 2. useCallback pour stabiliser les fonctions
const fetchData = useCallback(async () => {
  // ...
}, [stableDep]); // dépendances stables uniquement

// 3. useRef pour valeurs qui ne doivent pas déclencher le re-render
const initialized = useRef(false);
useEffect(() => {
  if (initialized.current) return;
  initialized.current = true;
  fetchData();
}, []);\`,
      color: "blue"
    },
    {
      icon: "🚀", tag: "PERF", title: "Site lent — Optimisations clés",
      symptom: "Lighthouse score < 80 ou First Contentful Paint > 3s",
      cause: "Images non-optimisées, bundle JS trop grand, pas de cache",
      fix: \`// 1. Toujours utiliser next/image au lieu de <img>
import Image from "next/image";
<Image src={url} alt="..." width={800} height={600} quality={75} />

// 2. Lazy loading des composants lourds
import dynamic from "next/dynamic";
const HeavyComponent = dynamic(() => import("@/components/Heavy"), {
  loading: () => <div>Chargement...</div>
});

// 3. ISR pour les pages avec données
export const revalidate = 60; // revalider toutes les 60s

// 4. Cache-Control dans les API routes
return NextResponse.json(data, {
  headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" }
});

// 5. Éviter les imports directs de grandes librairies
// ❌ import _ from "lodash"; (70KB!)
// ✅ import debounce from "lodash/debounce"; (quelques KB)\`,
      color: "green"
    },
    {
      icon: "🔍", tag: "OUTIL", title: "Outils de débogage essentiels",
      symptom: "Vous ne savez pas où chercher le bug",
      cause: "Pas d'accès aux bons outils",
      fix: \`// 1. Console browser (F12 → Console)
console.log("Data:", JSON.stringify(data, null, 2));
console.error("Error:", error);

// 2. Network tab (F12 → Network)
// Filtrer par "Fetch/XHR" pour voir les appels API
// Clic sur une requête → Headers, Payload, Response

// 3. Logs Vercel en temps réel
npx vercel logs lecomax.com --follow

// 4. Logs Supabase
// Dashboard Supabase → Logs → API Logs ou Postgres Logs

// 5. Variables d'environnement manquantes
// Dans une API route — afficher quelles vars sont définies (sans les valeurs)
console.log("VARS DEFINED:", {
  SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND: !!process.env.RESEND_API_KEY,
});

// 6. TypeScript strict check sans build
npx tsc --noEmit 2>&1 | head -30\`,
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

  const [open, setOpen] = React.useState<number | null>(null);

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
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-neutral-50 transition-colors"
          >
            <span className="text-lg">{issue.icon}</span>
            <span className={\`text-[10px] font-black px-2 py-0.5 rounded-full border \${colors[issue.color]}\`}>{issue.tag}</span>
            <span className="font-bold text-[14px] text-gray-900 flex-1">{issue.title}</span>
            <span className="text-[11px] text-neutral-400 hidden sm:block">{issue.symptom}</span>
            <svg className={\`w-4 h-4 text-neutral-400 shrink-0 transition-transform \${open === i ? "rotate-180" : ""}\`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open === i && (
            <div className="px-5 pb-5 border-t border-neutral-100">
              <div className="grid sm:grid-cols-2 gap-3 mt-4 mb-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-1">Symptôme</p>
                  <p className="text-[12px] text-red-700">{issue.symptom}</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider mb-1">Cause</p>
                  <p className="text-[12px] text-orange-700">{issue.cause}</p>
                </div>
              </div>
              <p className="text-[11px] font-black text-neutral-500 uppercase tracking-wider mb-2">Solution</p>
              <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-[11px] leading-relaxed p-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap"><code>{issue.fix}</code></pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SUPABASE SECTION ──────────────────────────────────────────────────────────
function SupabaseSection() {
  const [step, setStep] = React.useState(0);
  const steps = [
    {
      title: "1. Créer un projet Supabase",
      content: \`// 1. Aller sur https://supabase.com → New Project
// 2. Choisir un nom: "lecomax" et une région (Europe West)
// 3. Créer un mot de passe fort pour la DB (sauvegarder!)
// 4. Attendre ~2 min que le projet démarre

// 5. Récupérer les clés dans:
// Settings → API → Project URL
// Settings → API → anon public key  → NEXT_PUBLIC_SUPABASE_ANON_KEY
// Settings → API → service_role key → SUPABASE_SERVICE_ROLE_KEY (SECRET!)

// 6. Dans .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...\`
    },
    {
      title: "2. Créer les tables (SQL Editor)",
      content: \`-- Dans Supabase → SQL Editor → New Query

-- Table produits
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price INTEGER NOT NULL,  -- en centimes ou DH
  category TEXT,
  images TEXT[],           -- tableau d'URLs
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table commandes
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL,    -- [{name, price, qty, image}]
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX ON orders (customer_email);
CREATE INDEX ON orders (status);
CREATE INDEX ON products (category);\`
    },
    {
      title: "3. Row Level Security (RLS)",
      content: \`-- Activer RLS (bloque tout par défaut)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Permettre la LECTURE publique des produits actifs
CREATE POLICY "public_read_products" ON products
  FOR SELECT USING (active = true);

-- Permettre l'écriture UNIQUEMENT via service_role
-- (pas de policy pour INSERT/UPDATE → seul service_role peut écrire)

-- Pour les commandes: lecture seulement par l'email du client
CREATE POLICY "users_read_own_orders" ON orders
  FOR SELECT USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Ou si vous utilisez le service_role pour tout (bypass RLS):
-- pas besoin de policies pour les routes API avec service_role

-- Vérifier les policies actives:
SELECT * FROM pg_policies WHERE tablename = 'products';\`
    },
    {
      title: "4. Storage — Bucket d'images",
      content: \`-- Dans Supabase → Storage → New Bucket
-- Nom: "product-images"
-- Public: OUI (pour que les URLs soient accessibles)

-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Policy pour upload admin (via service_role — automatique)
-- Policy pour lecture publique:
CREATE POLICY "public_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Uploader depuis l'app (admin):
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(fileName, file, { contentType: 'image/jpeg' });

// URL publique:
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(fileName);
// → https://xxx.supabase.co/storage/v1/object/public/product-images/file.jpg\`
    },
    {
      title: "5. Triggers & Functions automatiques",
      content: \`-- Trigger: auto-générer un numéro de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ECO-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Trigger: auto-updater updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer à une table:
ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();\`
    },
    {
      title: "6. Migrations & Backup",
      content: \`-- Sauvegarder le schéma (dans Supabase CLI)
npx supabase db dump --schema-only > schema.sql

-- Voir toutes les tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Compter les lignes par table
SELECT 
  schemaname, tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Backup automatique: Supabase fait des backups quotidiens
-- Dashboard → Settings → Database → Backups

-- Restaurer en local (développement):
npx supabase start        -- démarre Supabase local
npx supabase db push      -- applique les migrations
npx supabase db pull      -- récupère le schéma depuis la prod\`
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">🗄️ Guide Supabase complet</h2>
        <p className="text-sm text-gray-500 mt-1">De la création du projet jusqu'aux triggers avancés — tout ce qu'il faut savoir.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Steps sidebar */}
        <div className="sm:w-48 shrink-0 flex flex-row sm:flex-col gap-1 overflow-x-auto pb-2 sm:pb-0">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={\`shrink-0 text-left px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors \${step === i ? "bg-[#3ecf4c] text-black" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}\`}>
              {s.title}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="font-black text-[15px]">{steps[step].title}</h3>
          </div>
          <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-[11px] leading-relaxed p-5 m-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap"><code>{steps[step].content}</code></pre>
        </div>
      </div>
    </div>
  );
}

// ─── DEPLOY SECTION ────────────────────────────────────────────────────────────
function DeploySection() {
  const [open, setOpen] = React.useState<number | null>(0);
  const steps = [
    {
      icon: "📁", title: "1. GitHub — Pousser le code",
      content: \`# Initialiser un repo Git (première fois)
git init
git add -A
git commit -m "Initial commit"

# Créer un repo sur github.com → New repository
# Puis connecter:
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
git push -u origin main

# Pousser des modifications:
git add -A
git commit -m "Description de vos changements"
git push origin main

# Bonnes pratiques de commit messages:
# feat: ajouter une nouvelle fonctionnalité
# fix: corriger un bug
# style: changements CSS/UI sans impact fonctionnel
# refactor: réécriture de code sans changement de comportement\`
    },
    {
      icon: "▲", title: "2. Vercel — Premier déploiement",
      content: \`# Via CLI (recommandé):
npm install -g vercel
vercel login  # ouvre le browser pour auth

# Dans le dossier du projet:
vercel --prod --yes
# ↳ Détecte Next.js automatiquement
# ↳ Demande les variables d'env (ou les lire depuis .env.local)

# OU via Vercel Dashboard:
# 1. vercel.com → New Project
# 2. Connecter le repo GitHub
# 3. Vercel déploie automatiquement à chaque git push!

# Voir les logs en temps réel:
vercel logs https://lecomax.com --follow

# Redéployer sans changement:
vercel redeploy --prod

# Variables d'environnement sur Vercel:
# Dashboard → Project → Settings → Environment Variables
# Ajouter TOUTES les vars de .env.local ici!\`
    },
    {
      icon: "🔑", title: "3. Variables d'environnement — Setup complet",
      content: \`# .env.local (NE PAS committer!)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ADMIN_PASSWORD=VotreMotDePasseAdmin
ADMIN_SESSION_SECRET=UneChaineTresLongueAleatoire

RESEND_API_KEY=re_...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

GROQ_API_KEY=gsk_...

# Sur Vercel, ajouter chaque variable:
# vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Ou depuis le Dashboard → Settings → Env Vars

# Vérifier que tout est défini:
vercel env ls

# ATTENTION: Variables NEXT_PUBLIC_ → exposées au browser
# Variables sans NEXT_PUBLIC_ → serveur uniquement (sécurisé)\`
    },
    {
      icon: "🌐", title: "4. Domaine personnalisé (Namecheap → Vercel)",
      content: \`// 1. Sur Vercel Dashboard → Project → Settings → Domains
// Ajouter: lecomax.com et www.lecomax.com

// 2. Vercel donne des DNS records:
// Type A → 76.76.21.21 (IP Vercel)
// CNAME www → cname.vercel-dns.com

// 3. Sur Namecheap → Domain List → Manage → Advanced DNS:
// Supprimer les records A et CNAME existants
// Ajouter:
//   Type: A Record   Host: @    Value: 76.76.21.21   TTL: Auto
//   Type: CNAME      Host: www  Value: cname.vercel-dns.com  TTL: Auto

// 4. Attendre propagation DNS: 5min à 24h
// Vérifier: https://dnschecker.org/#A/lecomax.com

// 5. SSL/HTTPS: automatique par Vercel (Let's Encrypt)
// Pas de configuration nécessaire!\`
    },
    {
      icon: "🔄", title: "5. Cycle de déploiement quotidien",
      content: \`# Workflow typique (chaque jour):

# 1. Travailler en local
npm run dev  # http://localhost:3000

# 2. Tester les changements
# Vérifier qu'il n'y a pas d'erreurs dans la console

# 3. Build test (important avant de pusher!)
npm run build
# Si erreur → corriger avant de pusher

# 4. Pusher sur GitHub
git add -A
git commit -m "feat: amélioration XYZ"
git push origin main

# 5. Déployer sur Vercel
npx vercel --prod --yes
# OU si vous avez configuré le déploiement auto → push suffit!

# 6. Vérifier en production
# Ouvrir https://lecomax.com
# Tester les fonctionnalités modifiées

# Temps total: ~5 minutes pour un changement simple\`
    },
    {
      icon: "🚨", title: "6. Rollback — Revenir en arrière",
      content: \`# Si un déploiement casse la production:

# Option 1: Vercel Dashboard
# Deployments → Trouver le dernier bon déploiement → Promote to Production

# Option 2: Via CLI
vercel rollback  # revient au déploiement précédent

# Option 3: Git revert
git log --oneline  # voir les commits
git revert HEAD    # annuler le dernier commit
git push origin main
# Puis redéployer

# Prévention:
# 1. Toujours tester npm run build localement
# 2. Utiliser des branches pour les features importantes
#    git checkout -b feature/ecomedia
#    git push origin feature/ecomedia
#    # PR sur GitHub → merge → déploiement auto\`
    },
  ];

  return (
    <div className="space-y-3 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">🚀 Guide de déploiement</h2>
        <p className="text-sm text-gray-500 mt-1">Git, GitHub, Vercel, domaine, variables d'env — le processus complet.</p>
      </div>

      {/* Quick reference */}
      <div className="bg-[#0d0d0d] rounded-2xl p-5 mb-6">
        <p className="text-[11px] font-black text-[#3ecf4c] uppercase tracking-widest mb-3">Commandes rapides</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["Démarrer dev", "npm run dev"],
            ["Build test", "npm run build"],
            ["Pousser Git", "git add -A && git commit -m 'msg' && git push"],
            ["Déployer Vercel", "npx vercel --prod --yes"],
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
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="font-black text-[14px] text-gray-900 flex-1">{s.title}</span>
            <svg className={\`w-4 h-4 text-neutral-400 transition-transform \${open === i ? "rotate-180" : ""}\`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open === i && (
            <div className="px-5 pb-5 border-t border-neutral-100">
              <pre className="bg-[#1e1e1e] text-[#d4d4d4] text-[11px] leading-relaxed p-4 mt-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap"><code>{s.content}</code></pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
`;

const current = fs.readFileSync('app/admin/how-it-was-built/page.tsx', 'utf8');
const lastBrace = current.lastIndexOf('\n}');
const patched = current.slice(0, lastBrace + 2) + '\n' + newSections;
fs.writeFileSync('app/admin/how-it-was-built/page.tsx', patched, 'utf8');
console.log('Written. Lines:', patched.split('\n').length);
