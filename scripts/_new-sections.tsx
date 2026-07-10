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
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="font-black text-[15px] text-gray-900">{item.title}</span>
            </div>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${open === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
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
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-neutral-50 transition-colors"
          >
            <span className="text-lg">{issue.icon}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${colors[issue.color]}`}>{issue.tag}</span>
            <span className="font-bold text-[14px] text-gray-900 flex-1">{issue.title}</span>
            <span className="text-[11px] text-neutral-400 hidden sm:block truncate max-w-[200px]">{issue.symptom}</span>
            <svg className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
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
        <p className="text-sm text-gray-500 mt-1">De la création du projet jusqu'aux triggers avancés.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-44 shrink-0 flex flex-row sm:flex-col gap-1 overflow-x-auto pb-2 sm:pb-0">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`shrink-0 text-left px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors ${step === i ? "bg-[#3ecf4c] text-black" : "bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300"}`}>
              {s.title}
            </button>
          ))}
        </div>
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
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="font-black text-[14px] text-gray-900 flex-1">{s.title}</span>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform ${open === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
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
