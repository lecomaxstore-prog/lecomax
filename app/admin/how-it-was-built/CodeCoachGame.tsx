"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Lang = "fr" | "en" | "ar";
type Copy = { fr: string; en: string; ar: string };
type Check = { token: string; label: Copy };
type Level = {
  id: string;
  badge: string;
  title: Copy;
  goal: Copy;
  filename: string;
  lines: Array<{ code: string; meaning: Copy }>;
  checks: Check[];
  hint: Copy;
};

const t = (copy: Copy, lang: Lang) => copy[lang];

const TEXT = {
  fr: { title: "Code Quest", subtitle: "Regarde le coach coder, comprends chaque ligne, puis écris-la toi-même.", watch: "Le coach code", practice: "À toi de coder", result: "Correction", nextLine: "Ligne suivante", skip: "Voir toute la démonstration", start: "Commencer le défi", check: "Vérifier mon code", retry: "Corriger mon code", answer: "Voir la bonne réponse", hide: "Masquer la réponse", next: "Niveau suivant", reset: "Recommencer", correct: "Excellent, ton code est correct !", incorrect: "Pas encore. Voici ce qui manque :", explanation: "Ce que cette ligne signifie", file: "Écris ce code dans", mission: "Ta mission", safe: "Le validateur lit ton texte mais n'exécute jamais ton code.", placeholder: "Écris ton code ici…", levels: "niveaux", xp: "XP", completed: "terminés", progress: "Progression", answerTitle: "Solution expliquée" },
  en: { title: "Code Quest", subtitle: "Watch the coach code, understand every line, then write it yourself.", watch: "Coach is coding", practice: "Your turn to code", result: "Review", nextLine: "Next line", skip: "Show full demonstration", start: "Start challenge", check: "Check my code", retry: "Fix my code", answer: "Show correct answer", hide: "Hide answer", next: "Next level", reset: "Restart", correct: "Excellent, your code is correct!", incorrect: "Not yet. Here is what is missing:", explanation: "What this line means", file: "Write this code in", mission: "Your mission", safe: "The validator reads your text but never executes your code.", placeholder: "Write your code here…", levels: "levels", xp: "XP", completed: "completed", progress: "Progress", answerTitle: "Explained solution" },
  ar: { title: "مغامرة الكود", subtitle: "شاهد المدرب يكتب الكود وافهم كل سطر ثم اكتبه بنفسك.", watch: "المدرب يكتب", practice: "دورك للبرمجة", result: "التصحيح", nextLine: "السطر التالي", skip: "عرض المثال كاملاً", start: "ابدأ التحدي", check: "تحقق من الكود", retry: "صحح الكود", answer: "عرض الإجابة الصحيحة", hide: "إخفاء الإجابة", next: "المستوى التالي", reset: "إعادة البداية", correct: "ممتاز، الكود صحيح!", incorrect: "ليس بعد. هذه الأشياء ناقصة:", explanation: "معنى هذا السطر", file: "اكتب الكود في", mission: "مهمتك", safe: "المدقق يقرأ النص ولا ينفذ الكود أبداً.", placeholder: "اكتب الكود هنا…", levels: "مستويات", xp: "نقطة", completed: "مكتملة", progress: "التقدم", answerTitle: "الحل المشروح" },
} as const;

const BASE_LEVELS: Level[] = [
  {
    id: "first-page", badge: "HTML + React",
    title: { fr: "Ta première page", en: "Your first page", ar: "صفحتك الأولى" },
    goal: { fr: "Crée une page Next.js qui affiche un titre et un paragraphe dans une balise main.", en: "Create a Next.js page with a heading and paragraph inside main.", ar: "أنشئ صفحة Next.js تعرض عنواناً وفقرة داخل main." },
    filename: "app/bienvenue/page.tsx",
    lines: [
      { code: "export default function WelcomePage() {", meaning: { fr: "Crée le composant de page et l'exporte pour que Next.js puisse l'afficher.", en: "Creates and exports the page component so Next.js can render it.", ar: "ينشئ مكوّن الصفحة ويصدّره ليعرضه Next.js." } },
      { code: "  return (", meaning: { fr: "return décrit ce que React doit afficher dans le navigateur.", en: "return describes what React must display in the browser.", ar: "يصف return ما سيعرضه React في المتصفح." } },
      { code: "    <main className=\"p-8\">", meaning: { fr: "main contient le contenu principal ; p-8 ajoute de l'espace avec Tailwind.", en: "main holds the primary content; p-8 adds Tailwind spacing.", ar: "تحتوي main على المحتوى وp-8 تضيف مسافة عبر Tailwind." } },
      { code: "      <h1>Bienvenue</h1>", meaning: { fr: "h1 est le titre principal, unique et important pour le SEO.", en: "h1 is the unique main heading and is important for SEO.", ar: "h1 هو العنوان الرئيسي والمهم للسيو." } },
      { code: "      <p>Je construis ma première page.</p>", meaning: { fr: "p crée un paragraphe lisible.", en: "p creates a readable paragraph.", ar: "تنشئ p فقرة قابلة للقراءة." } },
      { code: "    </main>", meaning: { fr: "Ferme exactement la balise main ouverte plus haut.", en: "Closes the main tag opened above.", ar: "يغلق وسم main المفتوح سابقاً." } },
      { code: "  );", meaning: { fr: "Ferme le JSX et termine l'instruction return.", en: "Closes JSX and finishes the return statement.", ar: "يغلق JSX وينهي return." } },
      { code: "}", meaning: { fr: "Ferme la fonction du composant.", en: "Closes the component function.", ar: "يغلق دالة المكوّن." } },
    ],
    checks: [
      { token: "export default function", label: { fr: "l'export du composant", en: "the component export", ar: "تصدير المكوّن" } },
      { token: "<main", label: { fr: "la balise <main>", en: "the <main> tag", ar: "وسم <main>" } },
      { token: "<h1", label: { fr: "un titre <h1>", en: "an <h1> heading", ar: "عنوان <h1>" } },
      { token: "<p>", label: { fr: "un paragraphe <p>", en: "a <p> paragraph", ar: "فقرة <p>" } },
    ],
    hint: { fr: "Commence par export default function, puis retourne un seul élément parent <main>.", en: "Start with export default function, then return one parent <main> element.", ar: "ابدأ بـ export default function ثم أعد عنصراً رئيسياً واحداً <main>." },
  },
  {
    id: "tailwind-card", badge: "Tailwind CSS",
    title: { fr: "Une carte responsive", en: "A responsive card", ar: "بطاقة متجاوبة" },
    goal: { fr: "Construis une carte blanche, arrondie, avec un bouton vert qui change au survol.", en: "Build a rounded white card with a green hoverable button.", ar: "أنشئ بطاقة بيضاء مستديرة وزراً أخضر يتغير عند المرور." },
    filename: "components/ProductCard.tsx",
    lines: [
      { code: "export default function ProductCard() {", meaning: { fr: "Un composant réutilisable peut être affiché sur plusieurs pages.", en: "A reusable component can appear on several pages.", ar: "يمكن عرض المكوّن القابل لإعادة الاستخدام في عدة صفحات." } },
      { code: "  return (", meaning: { fr: "Le composant retourne son interface JSX.", en: "The component returns its JSX interface.", ar: "يعيد المكوّن واجهة JSX." } },
      { code: "    <article className=\"rounded-2xl bg-white p-5 shadow-sm\">", meaning: { fr: "Tailwind applique rayon, fond, espace intérieur et ombre sans fichier CSS séparé.", en: "Tailwind applies radius, background, padding, and shadow without separate CSS.", ar: "يطبق Tailwind الاستدارة والخلفية والمسافة والظل." } },
      { code: "      <h2 className=\"text-lg font-bold\">Chaussures</h2>", meaning: { fr: "text-lg règle la taille ; font-bold règle l'épaisseur.", en: "text-lg sets size; font-bold sets weight.", ar: "تحدد text-lg الحجم وfont-bold السماكة." } },
      { code: "      <button className=\"mt-4 bg-green-500 px-4 py-2 hover:bg-green-600\">Acheter</button>", meaning: { fr: "hover: applique la couleur uniquement quand la souris passe sur le bouton.", en: "hover: applies color only while the pointer is over the button.", ar: "تطبق hover: اللون عند مرور المؤشر فقط." } },
      { code: "    </article>", meaning: { fr: "article est sémantique pour un contenu autonome comme un produit.", en: "article is semantic for standalone content such as a product.", ar: "article دلالي لمحتوى مستقل مثل المنتج." } },
      { code: "  );", meaning: { fr: "Termine le return.", en: "Finishes return.", ar: "ينهي return." } },
      { code: "}", meaning: { fr: "Termine le composant.", en: "Finishes the component.", ar: "ينهي المكوّن." } },
    ],
    checks: [
      { token: "rounded", label: { fr: "une classe rounded", en: "a rounded class", ar: "كلاس rounded" } },
      { token: "p-", label: { fr: "un padding Tailwind (p-...)", en: "Tailwind padding (p-...)", ar: "مسافة Tailwind (p-...)" } },
      { token: "<button", label: { fr: "un bouton", en: "a button", ar: "زر" } },
      { token: "hover:", label: { fr: "un état hover:", en: "a hover: state", ar: "حالة hover:" } },
    ],
    hint: { fr: "Ajoute les classes dans className. Les préfixes hover:, sm:, md: modifient un état ou une largeur.", en: "Put classes in className. hover:, sm:, and md: change a state or viewport.", ar: "ضع الكلاسات في className. تغير hover: وsm: وmd: الحالة أو العرض." },
  },
  {
    id: "interactive-counter", badge: "React state",
    title: { fr: "Un bouton interactif", en: "An interactive button", ar: "زر تفاعلي" },
    goal: { fr: "Crée un compteur client avec useState et augmente sa valeur au clic.", en: "Create a client counter with useState and increment it on click.", ar: "أنشئ عداداً عبر useState وزد قيمته عند النقر." },
    filename: "components/Counter.tsx",
    lines: [
      { code: "\"use client\";", meaning: { fr: "Autorise les interactions navigateur et les hooks React dans ce fichier.", en: "Enables browser interactions and React hooks in this file.", ar: "يسمح بتفاعلات المتصفح وHooks React." } },
      { code: "import { useState } from \"react\";", meaning: { fr: "Importe le hook qui mémorise une valeur entre deux affichages.", en: "Imports the hook that remembers a value between renders.", ar: "يستورد Hook الذي يحفظ القيمة بين عمليات العرض." } },
      { code: "export default function Counter() {", meaning: { fr: "Déclare le composant interactif.", en: "Declares the interactive component.", ar: "يعرّف المكوّن التفاعلي." } },
      { code: "  const [count, setCount] = useState(0);", meaning: { fr: "count contient la valeur ; setCount la change ; 0 est la valeur initiale.", en: "count stores the value; setCount changes it; 0 is the initial value.", ar: "تحفظ count القيمة وتغيرها setCount و0 هي البداية." } },
      { code: "  return <button onClick={() => setCount(count + 1)}>Clics : {count}</button>;", meaning: { fr: "onClick exécute la fonction, augmente count, puis React met l'écran à jour.", en: "onClick runs the function, increments count, then React updates the screen.", ar: "يشغل onClick الدالة ويزيد count ثم يحدث React الشاشة." } },
      { code: "}", meaning: { fr: "Ferme le composant.", en: "Closes the component.", ar: "يغلق المكوّن." } },
    ],
    checks: [
      { token: "use client", label: { fr: "la directive use client", en: "the use client directive", ar: "تعليمة use client" } },
      { token: "useState", label: { fr: "useState", en: "useState", ar: "useState" } },
      { token: "onClick", label: { fr: "onClick", en: "onClick", ar: "onClick" } },
      { token: "setCount", label: { fr: "la mise à jour setCount", en: "the setCount update", ar: "تحديث setCount" } },
    ],
    hint: { fr: "Un hook nécessite use client. L'événement onClick reçoit une fonction, pas son résultat.", en: "A hook requires use client. onClick receives a function, not its result.", ar: "يتطلب Hook وجود use client. يستقبل onClick دالة لا نتيجتها." },
  },
  {
    id: "api-route", badge: "Next.js API",
    title: { fr: "Ta première API", en: "Your first API", ar: "أول API لك" },
    goal: { fr: "Crée GET /api/hello qui renvoie un message JSON avec le statut 200.", en: "Create GET /api/hello returning a JSON message with status 200.", ar: "أنشئ GET /api/hello يعيد رسالة JSON وحالة 200." },
    filename: "app/api/hello/route.ts",
    lines: [
      { code: "import { NextResponse } from \"next/server\";", meaning: { fr: "NextResponse construit une réponse HTTP adaptée à Next.js.", en: "NextResponse builds an HTTP response for Next.js.", ar: "ينشئ NextResponse استجابة HTTP مناسبة لـ Next.js." } },
      { code: "export async function GET() {", meaning: { fr: "Le nom GET relie automatiquement la fonction à la méthode HTTP GET.", en: "The GET name automatically binds the function to HTTP GET.", ar: "يربط الاسم GET الدالة بطريقة HTTP GET تلقائياً." } },
      { code: "  return NextResponse.json(", meaning: { fr: "Transforme l'objet JavaScript en JSON pour le navigateur.", en: "Transforms the JavaScript object into JSON for the browser.", ar: "يحول كائن JavaScript إلى JSON للمتصفح." } },
      { code: "    { message: \"Bonjour depuis l'API\" },", meaning: { fr: "C'est le corps de la réponse que fetch pourra lire.", en: "This is the response body that fetch can read.", ar: "هذا هو جسم الاستجابة الذي يقرأه fetch." } },
      { code: "    { status: 200 }", meaning: { fr: "200 signifie que la requête a réussi.", en: "200 means the request succeeded.", ar: "تعني 200 أن الطلب نجح." } },
      { code: "  );", meaning: { fr: "Ferme l'appel json.", en: "Closes the json call.", ar: "يغلق استدعاء json." } },
      { code: "}", meaning: { fr: "Ferme la fonction GET.", en: "Closes GET.", ar: "يغلق دالة GET." } },
    ],
    checks: [
      { token: "NextResponse", label: { fr: "NextResponse", en: "NextResponse", ar: "NextResponse" } },
      { token: "function GET", label: { fr: "la fonction GET", en: "the GET function", ar: "دالة GET" } },
      { token: ".json", label: { fr: "une réponse .json", en: "a .json response", ar: "استجابة .json" } },
      { token: "status: 200", label: { fr: "le statut 200", en: "status 200", ar: "الحالة 200" } },
    ],
    hint: { fr: "Dans l'App Router, une API est un fichier route.ts qui exporte GET, POST, PUT ou DELETE.", en: "In App Router, an API is route.ts exporting GET, POST, PUT, or DELETE.", ar: "في App Router يكون API ملف route.ts يصدّر GET أو POST أو PUT أو DELETE." },
  },
  {
    id: "supabase-read", badge: "Supabase",
    title: { fr: "Lire les produits", en: "Read products", ar: "قراءة المنتجات" },
    goal: { fr: "Demande à Supabase les produits actifs et gère correctement une erreur.", en: "Fetch active products from Supabase and handle an error correctly.", ar: "اجلب المنتجات النشطة من Supabase وتعامل مع الخطأ." },
    filename: "app/api/products/route.ts",
    lines: [
      { code: "const { data, error } = await supabase", meaning: { fr: "await attend la base ; Supabase renvoie séparément les données et l'erreur.", en: "await waits for the database; Supabase returns data and error separately.", ar: "ينتظر await القاعدة ويعيد Supabase البيانات والخطأ منفصلين." } },
      { code: "  .from(\"products\")", meaning: { fr: "Choisit la table products. Son nom doit exister exactement dans Supabase.", en: "Selects the products table. Its exact name must exist in Supabase.", ar: "يختار جدول products ويجب أن يوجد الاسم نفسه في Supabase." } },
      { code: "  .select(\"id, name, price\")", meaning: { fr: "Ne récupère que les colonnes utiles : plus clair et plus rapide.", en: "Fetches only useful columns: clearer and faster.", ar: "يجلب الأعمدة المطلوبة فقط ليكون أوضح وأسرع." } },
      { code: "  .eq(\"active\", true);", meaning: { fr: "Ajoute le filtre SQL active = true.", en: "Adds the SQL filter active = true.", ar: "يضيف مرشح SQL active = true." } },
      { code: "if (error) throw error;", meaning: { fr: "Arrête le flux si Supabase signale une erreur, au lieu d'utiliser des données invalides.", en: "Stops when Supabase reports an error instead of using invalid data.", ar: "يتوقف إذا أعاد Supabase خطأً بدلاً من استخدام بيانات غير صالحة." } },
      { code: "return data;", meaning: { fr: "Retourne les produits quand la requête a réussi.", en: "Returns products after a successful query.", ar: "يعيد المنتجات بعد نجاح الاستعلام." } },
    ],
    checks: [
      { token: ".from(\"products\")", label: { fr: "la table products", en: "the products table", ar: "جدول products" } },
      { token: ".select", label: { fr: "la sélection des colonnes", en: "column selection", ar: "تحديد الأعمدة" } },
      { token: ".eq", label: { fr: "le filtre active", en: "the active filter", ar: "مرشح active" } },
      { token: "error", label: { fr: "la gestion d'erreur", en: "error handling", ar: "معالجة الخطأ" } },
    ],
    hint: { fr: "Chaîne from → select → eq. Vérifie toujours error avant d'utiliser data.", en: "Chain from → select → eq. Always check error before using data.", ar: "اربط from ثم select ثم eq وتحقق دائماً من error قبل data." },
  },
  {
    id: "javascript-logic", badge: "JavaScript",
    title: { fr: "Variables et conditions", en: "Variables and conditions", ar: "المتغيرات والشروط" },
    goal: { fr: "Calcule un prix après réduction avec une condition simple.", en: "Calculate a discounted price with a simple condition.", ar: "احسب السعر بعد الخصم باستخدام شرط بسيط." },
    filename: "lib/calculate-price.ts",
    lines: [
      { code: "export function finalPrice(price: number, onSale: boolean) {", meaning: { fr: "La fonction reçoit un prix et une valeur vrai/faux.", en: "The function receives a price and a true/false value.", ar: "تستقبل الدالة سعراً وقيمة صح أو خطأ." } },
      { code: "  if (onSale) {", meaning: { fr: "Le bloc suivant s'exécute uniquement si onSale vaut true.", en: "The next block runs only when onSale is true.", ar: "تعمل الكتلة التالية فقط إذا كانت onSale تساوي true." } },
      { code: "    return price * 0.8;", meaning: { fr: "Multiplier par 0,8 retire 20 % du prix.", en: "Multiplying by 0.8 removes 20% from the price.", ar: "الضرب في 0.8 يزيل 20٪ من السعر." } },
      { code: "  }", meaning: { fr: "Ferme la condition.", en: "Closes the condition.", ar: "يغلق الشرط." } },
      { code: "  return price;", meaning: { fr: "Sans promotion, le prix original est retourné.", en: "Without a sale, the original price is returned.", ar: "بدون خصم يعاد السعر الأصلي." } },
      { code: "}", meaning: { fr: "Ferme la fonction.", en: "Closes the function.", ar: "يغلق الدالة." } },
    ],
    checks: [{ token: "function finalPrice", label: { fr: "la fonction finalPrice", en: "the finalPrice function", ar: "دالة finalPrice" } }, { token: "if", label: { fr: "une condition if", en: "an if condition", ar: "شرط if" } }, { token: "return", label: { fr: "une valeur retournée", en: "a returned value", ar: "قيمة معادة" } }],
    hint: { fr: "Teste onSale dans if, puis retourne le prix réduit ou original.", en: "Test onSale in if, then return the discounted or original price.", ar: "اختبر onSale داخل if ثم أعد السعر المخفض أو الأصلي." },
  },
  {
    id: "typescript-product", badge: "TypeScript",
    title: { fr: "Décrire un produit", en: "Describe a product", ar: "وصف المنتج" },
    goal: { fr: "Crée un type Product qui protège le nom, le prix, le stock et l'état actif.", en: "Create a Product type protecting name, price, stock, and active state.", ar: "أنشئ نوع Product يحمي الاسم والسعر والمخزون والحالة." },
    filename: "types/product.ts",
    lines: [
      { code: "export type Product = {", meaning: { fr: "Déclare un contrat réutilisable nommé Product.", en: "Declares a reusable contract named Product.", ar: "يعرّف عقداً قابلاً لإعادة الاستخدام اسمه Product." } },
      { code: "  id: string;", meaning: { fr: "id doit toujours être un texte.", en: "id must always be text.", ar: "يجب أن يكون id نصاً." } },
      { code: "  name: string;", meaning: { fr: "name contient le nom du produit.", en: "name stores the product name.", ar: "يخزن name اسم المنتج." } },
      { code: "  price: number;", meaning: { fr: "price accepte uniquement un nombre.", en: "price only accepts a number.", ar: "يقبل price رقماً فقط." } },
      { code: "  stock: number;", meaning: { fr: "stock représente la quantité disponible.", en: "stock represents available quantity.", ar: "يمثل stock الكمية المتوفرة." } },
      { code: "  active: boolean;", meaning: { fr: "boolean vaut true ou false.", en: "A boolean is true or false.", ar: "قيمة boolean هي true أو false." } },
      { code: "};", meaning: { fr: "Ferme la définition du type.", en: "Closes the type definition.", ar: "يغلق تعريف النوع." } },
    ],
    checks: [{ token: "type Product", label: { fr: "le type Product", en: "the Product type", ar: "نوع Product" } }, { token: "price: number", label: { fr: "price en number", en: "price as number", ar: "price من نوع number" } }, { token: "active: boolean", label: { fr: "active en boolean", en: "active as boolean", ar: "active من نوع boolean" } }],
    hint: { fr: "Utilise string pour le texte, number pour les nombres et boolean pour vrai/faux.", en: "Use string for text, number for numbers, and boolean for true/false.", ar: "استخدم string للنص وnumber للأرقام وboolean للصح والخطأ." },
  },
  {
    id: "react-product-list", badge: "React lists",
    title: { fr: "Afficher une liste", en: "Render a list", ar: "عرض قائمة" },
    goal: { fr: "Transforme un tableau de produits en cartes React avec map et key.", en: "Transform a product array into React cards with map and key.", ar: "حوّل مصفوفة المنتجات إلى بطاقات React عبر map وkey." },
    filename: "components/ProductList.tsx",
    lines: [
      { code: "export function ProductList({ products }: { products: Product[] }) {", meaning: { fr: "Le composant reçoit un tableau de Product dans ses props.", en: "The component receives a Product array through props.", ar: "يستقبل المكوّن مصفوفة Product عبر props." } },
      { code: "  return <div className=\"grid gap-4 sm:grid-cols-2\">", meaning: { fr: "Crée une grille à une colonne puis deux dès sm.", en: "Creates one column, then two from sm upward.", ar: "ينشئ عموداً ثم عمودين ابتداءً من sm." } },
      { code: "    {products.map((product) => (", meaning: { fr: "map transforme chaque produit en JSX.", en: "map transforms every product into JSX.", ar: "تحول map كل منتج إلى JSX." } },
      { code: "      <article key={product.id}>{product.name}</article>", meaning: { fr: "key aide React à identifier chaque carte sans confusion.", en: "key helps React identify each card.", ar: "تساعد key React على تمييز كل بطاقة." } },
      { code: "    ))}", meaning: { fr: "Ferme la fonction map.", en: "Closes map.", ar: "يغلق map." } },
      { code: "  </div>;", meaning: { fr: "Ferme et retourne la grille.", en: "Closes and returns the grid.", ar: "يغلق الشبكة ويعيدها." } },
      { code: "}", meaning: { fr: "Ferme le composant.", en: "Closes the component.", ar: "يغلق المكوّن." } },
    ],
    checks: [{ token: "products.map", label: { fr: "products.map", en: "products.map", ar: "products.map" } }, { token: "key={product.id}", label: { fr: "une key unique", en: "a unique key", ar: "key فريدة" } }, { token: "product.name", label: { fr: "le nom du produit", en: "the product name", ar: "اسم المنتج" } }],
    hint: { fr: "Place map entre accolades JSX et donne une key stable à l'élément principal.", en: "Put map inside JSX braces and give the main element a stable key.", ar: "ضع map داخل أقواس JSX وأعط العنصر الرئيسي key ثابتة." },
  },
  {
    id: "react-form", badge: "React forms",
    title: { fr: "Formulaire contrôlé", en: "Controlled form", ar: "نموذج متحكم به" },
    goal: { fr: "Relie un champ email à useState et empêche le rechargement à l'envoi.", en: "Connect an email input to useState and prevent reload on submit.", ar: "اربط حقل البريد بـ useState وامنع إعادة التحميل عند الإرسال." },
    filename: "components/NewsletterForm.tsx",
    lines: [
      { code: "\"use client\";", meaning: { fr: "Le formulaire interactif doit être un Client Component.", en: "The interactive form must be a Client Component.", ar: "يجب أن يكون النموذج التفاعلي Client Component." } },
      { code: "const [email, setEmail] = useState(\"\");", meaning: { fr: "Mémorise la valeur du champ email.", en: "Stores the email input value.", ar: "يحفظ قيمة حقل البريد." } },
      { code: "return <form onSubmit={(event) => event.preventDefault()}>", meaning: { fr: "preventDefault empêche le navigateur de recharger la page.", en: "preventDefault stops the browser from reloading.", ar: "تمنع preventDefault المتصفح من إعادة التحميل." } },
      { code: "  <input type=\"email\" value={email}", meaning: { fr: "value fait de React la source de vérité du champ.", en: "value makes React the input source of truth.", ar: "تجعل value React مصدر حقيقة الحقل." } },
      { code: "    onChange={(event) => setEmail(event.target.value)} />", meaning: { fr: "Chaque frappe met le state à jour.", en: "Every keystroke updates state.", ar: "تحدث كل ضغطة state." } },
      { code: "  <button type=\"submit\">S'inscrire</button>", meaning: { fr: "Le bouton déclenche onSubmit du formulaire.", en: "The button triggers the form onSubmit.", ar: "يشغل الزر onSubmit للنموذج." } },
      { code: "</form>;", meaning: { fr: "Ferme le formulaire.", en: "Closes the form.", ar: "يغلق النموذج." } },
    ],
    checks: [{ token: "use client", label: { fr: "use client", en: "use client", ar: "use client" } }, { token: "useState", label: { fr: "useState", en: "useState", ar: "useState" } }, { token: "onChange", label: { fr: "onChange", en: "onChange", ar: "onChange" } }, { token: "preventDefault", label: { fr: "preventDefault", en: "preventDefault", ar: "preventDefault" } }],
    hint: { fr: "Le champ utilise value + onChange ; le formulaire utilise onSubmit.", en: "The input uses value + onChange; the form uses onSubmit.", ar: "يستخدم الحقل value وonChange ويستخدم النموذج onSubmit." },
  },
  {
    id: "next-dynamic-route", badge: "Next.js routing",
    title: { fr: "Page produit dynamique", en: "Dynamic product page", ar: "صفحة منتج ديناميكية" },
    goal: { fr: "Crée /produit/[slug] et lis son paramètre dynamique avec Next.js 15.", en: "Create /product/[slug] and read its dynamic parameter with Next.js 15.", ar: "أنشئ /product/[slug] واقرأ المعامل الديناميكي في Next.js 15." },
    filename: "app/produit/[slug]/page.tsx",
    lines: [
      { code: "type Props = { params: Promise<{ slug: string }> };", meaning: { fr: "Next.js 15 fournit params sous forme de Promise typée.", en: "Next.js 15 provides params as a typed Promise.", ar: "يوفر Next.js 15 params على شكل Promise محددة النوع." } },
      { code: "export default async function ProductPage({ params }: Props) {", meaning: { fr: "La page serveur est async pour attendre le paramètre.", en: "The server page is async so it can await the parameter.", ar: "الصفحة الخادمة async لانتظار المعامل." } },
      { code: "  const { slug } = await params;", meaning: { fr: "Récupère par exemple nike-air depuis l'URL.", en: "Reads a value such as nike-air from the URL.", ar: "يقرأ قيمة مثل nike-air من الرابط." } },
      { code: "  return <h1>Produit : {slug}</h1>;", meaning: { fr: "Affiche la valeur dynamique dans le titre.", en: "Displays the dynamic value in the heading.", ar: "يعرض القيمة الديناميكية في العنوان." } },
      { code: "}", meaning: { fr: "Ferme la page.", en: "Closes the page.", ar: "يغلق الصفحة." } },
    ],
    checks: [{ token: "params", label: { fr: "params", en: "params", ar: "params" } }, { token: "slug", label: { fr: "le slug", en: "the slug", ar: "slug" } }, { token: "await params", label: { fr: "await params", en: "await params", ar: "await params" } }],
    hint: { fr: "Le dossier [slug] crée la variable slug. Dans Next.js 15, attends params.", en: "The [slug] folder creates slug. In Next.js 15, await params.", ar: "ينشئ مجلد [slug] المتغير slug. في Next.js 15 انتظر params." },
  },
  {
    id: "api-post", badge: "Next.js API",
    title: { fr: "Recevoir un POST", en: "Receive a POST", ar: "استقبال POST" },
    goal: { fr: "Lis un corps JSON, valide le nom et renvoie 201 ou une erreur 400.", en: "Read JSON, validate the name, and return 201 or a 400 error.", ar: "اقرأ JSON وتحقق من الاسم وأعد 201 أو خطأ 400." },
    filename: "app/api/products/route.ts",
    lines: [
      { code: "export async function POST(request: Request) {", meaning: { fr: "POST reçoit les nouvelles données envoyées par le client.", en: "POST receives new data sent by the client.", ar: "تستقبل POST البيانات الجديدة من العميل." } },
      { code: "  const body = await request.json();", meaning: { fr: "Transforme le corps JSON en objet JavaScript.", en: "Transforms the JSON body into a JavaScript object.", ar: "يحول جسم JSON إلى كائن JavaScript." } },
      { code: "  if (!body.name) {", meaning: { fr: "Refuse la requête si le nom manque.", en: "Rejects the request when name is missing.", ar: "يرفض الطلب عند غياب الاسم." } },
      { code: "    return Response.json({ error: \"Nom requis\" }, { status: 400 });", meaning: { fr: "400 indique une donnée client invalide.", en: "400 indicates invalid client data.", ar: "تعني 400 أن بيانات العميل غير صالحة." } },
      { code: "  }", meaning: { fr: "Ferme la validation.", en: "Closes validation.", ar: "يغلق التحقق." } },
      { code: "  return Response.json({ product: body }, { status: 201 });", meaning: { fr: "201 signifie qu'une ressource a été créée.", en: "201 means a resource was created.", ar: "تعني 201 إنشاء مورد." } },
      { code: "}", meaning: { fr: "Ferme POST.", en: "Closes POST.", ar: "يغلق POST." } },
    ],
    checks: [{ token: "function POST", label: { fr: "la fonction POST", en: "the POST function", ar: "دالة POST" } }, { token: "request.json", label: { fr: "request.json", en: "request.json", ar: "request.json" } }, { token: "status: 400", label: { fr: "le statut 400", en: "status 400", ar: "الحالة 400" } }, { token: "status: 201", label: { fr: "le statut 201", en: "status 201", ar: "الحالة 201" } }],
    hint: { fr: "Lis request.json(), valide avant la base, puis utilise le bon statut HTTP.", en: "Read request.json(), validate before the database, then use the right HTTP status.", ar: "اقرأ request.json وتحقق قبل القاعدة ثم استخدم حالة HTTP المناسبة." },
  },
  {
    id: "supabase-write", badge: "Supabase CRUD",
    title: { fr: "Ajouter et modifier", en: "Insert and update", ar: "الإضافة والتعديل" },
    goal: { fr: "Ajoute un produit avec insert puis mets son stock à jour avec update.", en: "Insert a product, then update its stock.", ar: "أضف منتجاً عبر insert ثم حدّث مخزونه عبر update." },
    filename: "app/api/products/route.ts",
    lines: [
      { code: "const { data, error } = await supabase", meaning: { fr: "Attend l'opération et récupère data ou error.", en: "Waits for the operation and receives data or error.", ar: "ينتظر العملية ويستقبل data أو error." } },
      { code: "  .from(\"products\")", meaning: { fr: "Cible la table products.", en: "Targets the products table.", ar: "يستهدف جدول products." } },
      { code: "  .insert({ name: \"Sac\", price: 149, stock: 10 })", meaning: { fr: "Crée une ligne avec les colonnes indiquées.", en: "Creates a row with the listed columns.", ar: "ينشئ صفاً بالأعمدة المحددة." } },
      { code: "  .select().single();", meaning: { fr: "Retourne la nouvelle ligne comme un seul objet.", en: "Returns the new row as one object.", ar: "يعيد الصف الجديد ككائن واحد." } },
      { code: "if (error) throw error;", meaning: { fr: "Ne continue pas silencieusement en cas d'échec.", en: "Does not continue silently after failure.", ar: "لا يستمر بصمت عند الفشل." } },
      { code: "await supabase.from(\"products\").update({ stock: 9 }).eq(\"id\", data.id);", meaning: { fr: "Met à jour uniquement la ligne qui possède cet id.", en: "Updates only the row with this id.", ar: "يحدث الصف الذي يملك هذا id فقط." } },
    ],
    checks: [{ token: ".insert", label: { fr: "insert", en: "insert", ar: "insert" } }, { token: ".update", label: { fr: "update", en: "update", ar: "update" } }, { token: ".eq", label: { fr: "le filtre id", en: "the id filter", ar: "مرشح id" } }, { token: "error", label: { fr: "la gestion error", en: "error handling", ar: "معالجة error" } }],
    hint: { fr: "insert crée ; update modifie ; eq choisit exactement la ligne concernée.", en: "insert creates; update changes; eq selects the exact row.", ar: "تنشئ insert وتعدل update وتختار eq الصف المطلوب." },
  },
  {
    id: "supabase-rls", badge: "SQL + RLS",
    title: { fr: "Protéger une table", en: "Protect a table", ar: "حماية الجدول" },
    goal: { fr: "Active RLS et autorise seulement la lecture des produits actifs.", en: "Enable RLS and allow reading active products only.", ar: "فعّل RLS واسمح بقراءة المنتجات النشطة فقط." },
    filename: "Supabase → SQL Editor",
    lines: [
      { code: "alter table public.products enable row level security;", meaning: { fr: "Active la sécurité ligne par ligne sur products.", en: "Enables row-level security on products.", ar: "يفعل أمان الصفوف على products." } },
      { code: "create policy \"Public reads active products\"", meaning: { fr: "Crée une règle de sécurité avec un nom clair.", en: "Creates a security rule with a clear name.", ar: "ينشئ قاعدة أمان باسم واضح." } },
      { code: "on public.products", meaning: { fr: "Applique la règle à products.", en: "Applies the rule to products.", ar: "يطبق القاعدة على products." } },
      { code: "for select", meaning: { fr: "La règle concerne uniquement la lecture.", en: "The rule applies to reads only.", ar: "تنطبق القاعدة على القراءة فقط." } },
      { code: "using (active = true);", meaning: { fr: "Une ligne est visible seulement si active vaut true.", en: "A row is visible only when active is true.", ar: "يظهر الصف فقط إذا كانت active تساوي true." } },
    ],
    checks: [{ token: "enable row level security", label: { fr: "l'activation RLS", en: "enabling RLS", ar: "تفعيل RLS" } }, { token: "create policy", label: { fr: "create policy", en: "create policy", ar: "create policy" } }, { token: "for select", label: { fr: "for select", en: "for select", ar: "for select" } }, { token: "active = true", label: { fr: "la condition active", en: "the active condition", ar: "شرط active" } }],
    hint: { fr: "Colle ce SQL dans Supabase SQL Editor, jamais dans un composant React.", en: "Paste this SQL in Supabase SQL Editor, never in a React component.", ar: "الصق SQL في Supabase SQL Editor وليس في مكوّن React." },
  },
  {
    id: "supabase-auth", badge: "Supabase Auth",
    title: { fr: "Connexion utilisateur", en: "User sign-in", ar: "تسجيل دخول المستخدم" },
    goal: { fr: "Connecte un utilisateur avec son email et son mot de passe et affiche l'erreur.", en: "Sign in with email and password and display any error.", ar: "سجل الدخول بالبريد وكلمة المرور واعرض الخطأ." },
    filename: "app/connexion/page.tsx",
    lines: [
      { code: "const { error } = await supabase.auth.signInWithPassword({", meaning: { fr: "Demande à Supabase Auth de vérifier les identifiants.", en: "Asks Supabase Auth to verify credentials.", ar: "يطلب من Supabase Auth التحقق من بيانات الدخول." } },
      { code: "  email,", meaning: { fr: "Envoie l'email saisi dans le formulaire.", en: "Sends the email entered in the form.", ar: "يرسل البريد المكتوب في النموذج." } },
      { code: "  password,", meaning: { fr: "Envoie le mot de passe via HTTPS.", en: "Sends the password over HTTPS.", ar: "يرسل كلمة المرور عبر HTTPS." } },
      { code: "});", meaning: { fr: "Ferme l'appel de connexion.", en: "Closes the sign-in call.", ar: "يغلق طلب تسجيل الدخول." } },
      { code: "if (error) setMessage(error.message);", meaning: { fr: "Affiche un message utile si la connexion échoue.", en: "Shows a useful message when sign-in fails.", ar: "يعرض رسالة مفيدة عند فشل الدخول." } },
      { code: "else router.push(\"/compte\");", meaning: { fr: "Après succès, ouvre l'espace client.", en: "After success, opens the customer account.", ar: "بعد النجاح يفتح حساب العميل." } },
    ],
    checks: [{ token: "signInWithPassword", label: { fr: "signInWithPassword", en: "signInWithPassword", ar: "signInWithPassword" } }, { token: "email", label: { fr: "email", en: "email", ar: "email" } }, { token: "password", label: { fr: "password", en: "password", ar: "password" } }, { token: "error", label: { fr: "la gestion d'erreur", en: "error handling", ar: "معالجة الخطأ" } }],
    hint: { fr: "Utilise le client navigateur Supabase. Ne stocke jamais le mot de passe toi-même.", en: "Use the browser Supabase client. Never store passwords yourself.", ar: "استخدم عميل Supabase في المتصفح ولا تخزن كلمة المرور بنفسك." },
  },
  {
    id: "supabase-storage", badge: "Supabase Storage",
    title: { fr: "Uploader une image", en: "Upload an image", ar: "رفع صورة" },
    goal: { fr: "Envoie un fichier dans le bucket product-images et récupère son URL publique.", en: "Upload a file to product-images and get its public URL.", ar: "ارفع ملفاً إلى product-images واحصل على رابطه العام." },
    filename: "app/api/upload/route.ts",
    lines: [
      { code: "const path = `products/${crypto.randomUUID()}-${file.name}`;", meaning: { fr: "Crée un chemin unique pour éviter d'écraser une autre image.", en: "Creates a unique path to avoid overwriting another image.", ar: "ينشئ مساراً فريداً لتجنب استبدال صورة أخرى." } },
      { code: "const { error } = await supabase.storage", meaning: { fr: "Commence l'opération Storage et récupère une éventuelle erreur.", en: "Starts the Storage operation and captures any error.", ar: "يبدأ عملية Storage ويلتقط الخطأ." } },
      { code: "  .from(\"product-images\")", meaning: { fr: "Choisit le bucket product-images.", en: "Selects the product-images bucket.", ar: "يختار bucket product-images." } },
      { code: "  .upload(path, file, { contentType: file.type });", meaning: { fr: "Envoie le fichier au chemin avec son type MIME.", en: "Uploads the file with its MIME type.", ar: "يرفع الملف مع نوع MIME." } },
      { code: "if (error) throw error;", meaning: { fr: "Arrête la route si l'upload échoue.", en: "Stops the route if upload fails.", ar: "يوقف المسار عند فشل الرفع." } },
      { code: "const { data } = supabase.storage.from(\"product-images\").getPublicUrl(path);", meaning: { fr: "Construit l'URL que le site utilisera dans une image.", en: "Builds the URL the site will use for the image.", ar: "ينشئ الرابط الذي سيستخدمه الموقع للصورة." } },
    ],
    checks: [{ token: "product-images", label: { fr: "le bucket product-images", en: "the product-images bucket", ar: "bucket product-images" } }, { token: ".upload", label: { fr: "upload", en: "upload", ar: "upload" } }, { token: "getPublicUrl", label: { fr: "getPublicUrl", en: "getPublicUrl", ar: "getPublicUrl" } }, { token: "error", label: { fr: "la gestion d'erreur", en: "error handling", ar: "معالجة الخطأ" } }],
    hint: { fr: "Crée d'abord le bucket dans Supabase Storage, puis upload et getPublicUrl.", en: "Create the bucket in Supabase Storage first, then upload and getPublicUrl.", ar: "أنشئ bucket في Supabase Storage ثم استخدم upload وgetPublicUrl." },
  },
];

type ExtendedTopic = readonly [
  id: string,
  badge: string,
  titleFr: string,
  titleEn: string,
  filename: string,
  code: string,
  requiredToken: string,
];

const EXTENDED_TOPICS: ExtendedTopic[] = [
  ["semantic-html", "HTML", "Structure semantique", "Semantic structure", "app/apropos/page.tsx", "<main><section><h1>A propos</h1></section></main>", "<section>"],
  ["links-images", "HTML", "Liens et images", "Links and images", "components/BrandLink.tsx", "<a href=\"/boutique\"><img src=\"/logo.png\" alt=\"L'ecomax\" /></a>", "alt="],
  ["tailwind-flex", "Tailwind CSS", "Mise en page Flexbox", "Flexbox layout", "components/Header.tsx", "<header className=\"flex items-center justify-between gap-4\">Menu</header>", "justify-between"],
  ["tailwind-grid", "Tailwind CSS", "Grille de produits", "Product grid", "components/ProductGrid.tsx", "<div className=\"grid grid-cols-2 gap-4 lg:grid-cols-4\">Produits</div>", "lg:grid-cols-4"],
  ["tailwind-breakpoints", "Tailwind CSS", "Points de rupture", "Responsive breakpoints", "components/Hero.tsx", "<h1 className=\"text-3xl sm:text-4xl lg:text-6xl\">Nouvelle collection</h1>", "sm:text-4xl"],
  ["tailwind-dark", "Tailwind CSS", "Mode sombre", "Dark mode", "components/ThemeCard.tsx", "<div className=\"bg-white text-black dark:bg-black dark:text-white\">Theme</div>", "dark:bg-black"],
  ["js-variables", "JavaScript", "Variables const et let", "const and let variables", "lib/prices.ts", "const currency = \"MAD\"; let total = 0;", "const currency"],
  ["js-functions", "JavaScript", "Creer une fonction", "Create a function", "lib/formatPrice.ts", "export function formatPrice(price: number) { return `${price} MAD`; }", "function formatPrice"],
  ["js-arrays", "JavaScript", "Manipuler un tableau", "Work with arrays", "lib/categories.ts", "const categories = [\"Homme\", \"Femme\", \"Accessoires\"];", "categories"],
  ["js-map-filter", "JavaScript", "map et filter", "map and filter", "lib/products.ts", "const activeNames = products.filter(p => p.active).map(p => p.name);", ".filter"],
  ["js-objects", "JavaScript", "Objets et decomposition", "Objects and destructuring", "lib/product.ts", "const { name, price } = product;", "{ name, price }"],
  ["js-async", "JavaScript", "async et await", "async and await", "lib/loadProducts.ts", "const response = await fetch(\"/api/products\");", "await fetch"],
  ["js-errors", "JavaScript", "Gerer les erreurs", "Handle errors", "lib/safeRequest.ts", "try { await saveOrder(); } catch (error) { console.error(error); }", "catch"],
  ["js-modules", "JavaScript", "Imports et exports", "Imports and exports", "lib/currency.ts", "export const currency = \"MAD\";", "export const"],
  ["ts-unions", "TypeScript", "Types union", "Union types", "types/order.ts", "type OrderStatus = \"pending\" | \"paid\" | \"shipped\";", "type OrderStatus"],
  ["ts-props", "TypeScript", "Typer les props", "Type component props", "components/Price.tsx", "type PriceProps = { amount: number; currency?: string };", "PriceProps"],
  ["ts-generics", "TypeScript", "Comprendre les generiques", "Understand generics", "lib/api.ts", "type ApiResult<T> = { data: T | null; error: string | null };", "<T>"],
  ["react-effect", "React", "Effets avec useEffect", "Effects with useEffect", "components/OnlineStatus.tsx", "useEffect(() => { document.title = title; }, [title]);", "useEffect"],
  ["react-memo", "React", "Calculs avec useMemo", "Calculations with useMemo", "components/CartTotal.tsx", "const total = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);", "useMemo"],
  ["react-ref", "React", "Cibler un element avec useRef", "Target an element with useRef", "components/Search.tsx", "const inputRef = useRef<HTMLInputElement>(null);", "useRef"],
  ["react-hook", "React", "Creer un hook personnalise", "Create a custom hook", "hooks/useCart.ts", "export function useCart() { return useContext(CartContext); }", "useCart"],
  ["react-context", "React", "Partager avec Context", "Share state with Context", "contexts/CartContext.tsx", "const CartContext = createContext<CartState | null>(null);", "createContext"],
  ["react-reducer", "React", "Etat complexe avec reducer", "Complex state with reducer", "hooks/useCartReducer.ts", "const [state, dispatch] = useReducer(cartReducer, initialCart);", "useReducer"],
  ["react-condition", "React", "Affichage conditionnel", "Conditional rendering", "components/StockBadge.tsx", "return stock > 0 ? <span>En stock</span> : <span>Epuise</span>;", "stock > 0"],
  ["next-loading", "Next.js", "Interface de chargement", "Loading UI", "app/boutique/loading.tsx", "export default function Loading() { return <p>Chargement...</p>; }", "function Loading"],
  ["next-error", "Next.js", "Page d'erreur", "Error boundary", "app/boutique/error.tsx", "export default function ErrorPage({ reset }: { reset: () => void }) { return <button onClick={reset}>Reessayer</button>; }", "reset"],
  ["next-layout", "Next.js", "Layout partage", "Shared layout", "app/boutique/layout.tsx", "export default function Layout({ children }: { children: React.ReactNode }) { return <main>{children}</main>; }", "children"],
  ["next-metadata", "Next.js SEO", "Metadata et SEO", "Metadata and SEO", "app/boutique/page.tsx", "export const metadata = { title: \"Boutique | L'ecomax\", description: \"Decouvrez nos produits\" };", "metadata"],
  ["next-link", "Next.js", "Navigation avec Link", "Navigation with Link", "components/Nav.tsx", "<Link href=\"/boutique\">Voir la boutique</Link>", "href="],
  ["next-image", "Next.js", "Optimiser avec Image", "Optimize with Image", "components/ProductImage.tsx", "<Image src={product.image} alt={product.name} width={600} height={600} />", "width={600}"],
  ["next-font", "Next.js", "Charger une police", "Load a font", "app/layout.tsx", "const inter = Inter({ subsets: [\"latin\"], display: \"swap\" });", "display:"],
  ["next-server-component", "Next.js", "Composant serveur", "Server component", "app/products/page.tsx", "export default async function Page() { const products = await getProducts(); return <ProductList products={products} />; }", "await getProducts"],
  ["next-client-component", "Next.js", "Composant client", "Client component", "components/AddToCart.tsx", "\"use client\"; export default function AddToCart() { return <button onClick={() => alert(\"Ajoute\")}>Ajouter</button>; }", "use client"],
  ["next-server-action", "Next.js", "Premiere Server Action", "First Server Action", "app/actions.ts", "\"use server\"; export async function createOrder(formData: FormData) { return { ok: true }; }", "use server"],
  ["next-form-action", "Next.js", "Formulaire Server Action", "Server Action form", "components/OrderForm.tsx", "<form action={createOrder}><button type=\"submit\">Commander</button></form>", "action={createOrder}"],
  ["next-cookies", "Next.js", "Lire un cookie", "Read a cookie", "lib/session.ts", "const session = (await cookies()).get(\"session\")?.value;", "cookies()"],
  ["next-headers", "Next.js", "Lire les en-tetes", "Read request headers", "lib/request.ts", "const userAgent = (await headers()).get(\"user-agent\");", "headers()"],
  ["next-middleware", "Next.js", "Proteger avec middleware", "Protect with middleware", "middleware.ts", "export function middleware(request: NextRequest) { return NextResponse.next(); }", "middleware"],
  ["next-catchall", "Next.js routing", "Route multi-segments", "Catch-all route", "app/docs/[...slug]/page.tsx", "const path = (await params).slug.join(\"/\");", "slug.join"],
  ["next-search-params", "Next.js routing", "Parametres de recherche", "Search parameters", "app/search/page.tsx", "const query = (await searchParams).q ?? \"\";", "searchParams"],
  ["next-not-found", "Next.js", "Page introuvable", "Not found page", "app/product/[slug]/page.tsx", "if (!product) notFound();", "notFound"],
  ["next-redirect", "Next.js", "Rediriger un visiteur", "Redirect a visitor", "app/account/page.tsx", "if (!user) redirect(\"/connexion\");", "redirect"],
  ["next-revalidate", "Next.js cache", "Revalidation du cache", "Cache revalidation", "app/actions.ts", "revalidatePath(\"/boutique\");", "revalidatePath"],
  ["next-cache-tags", "Next.js cache", "Cache avec tags", "Cache with tags", "lib/products.ts", "const products = await fetch(url, { next: { tags: [\"products\"] } });", "tags:"],
  ["next-env", "Next.js", "Variables d'environnement", "Environment variables", ".env.local", "NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co", "NEXT_PUBLIC_SUPABASE_URL"],
  ["api-put", "REST API", "Modifier avec PUT", "Update with PUT", "app/api/products/[id]/route.ts", "export async function PUT(request: Request) { const body = await request.json(); return Response.json(body); }", "function PUT"],
  ["api-delete", "REST API", "Supprimer avec DELETE", "Delete with DELETE", "app/api/products/[id]/route.ts", "export async function DELETE() { return new Response(null, { status: 204 }); }", "function DELETE"],
  ["api-validation", "API Security", "Valider les donnees", "Validate input", "app/api/orders/route.ts", "const result = orderSchema.safeParse(await request.json());", "safeParse"],
  ["api-pagination", "REST API", "Paginer les resultats", "Paginate results", "app/api/products/route.ts", "const from = (page - 1) * pageSize; const to = from + pageSize - 1;", "pageSize"],
  ["api-sorting", "REST API", "Trier les resultats", "Sort results", "lib/products.ts", "const sorted = products.toSorted((a, b) => a.price - b.price);", "toSorted"],
  ["supabase-client", "Supabase", "Configurer le client", "Configure the client", "lib/supabase/client.ts", "export const supabase = createBrowserClient(url, anonKey);", "createBrowserClient"],
  ["sql-create-table", "SQL", "Creer une table", "Create a table", "Supabase SQL Editor", "create table public.categories (id bigint generated always as identity primary key, name text not null);", "create table"],
  ["sql-foreign-key", "SQL", "Relier deux tables", "Create a foreign key", "Supabase SQL Editor", "alter table products add constraint products_category_fk foreign key (category_id) references categories(id);", "foreign key"],
  ["sql-index", "SQL", "Accelerer une recherche", "Create an index", "Supabase SQL Editor", "create index products_slug_idx on public.products(slug);", "create index"],
  ["supabase-join", "Supabase", "Lire une relation", "Query a relation", "lib/products.ts", "const query = supabase.from(\"products\").select(\"id,name,categories(name)\");", "categories(name)"],
  ["supabase-upsert", "Supabase CRUD", "Inserer ou remplacer", "Insert or update", "lib/cart.ts", "await supabase.from(\"cart_items\").upsert({ product_id, quantity });", ".upsert"],
  ["supabase-delete", "Supabase CRUD", "Supprimer une ligne", "Delete a row", "lib/products.ts", "await supabase.from(\"products\").delete().eq(\"id\", id);", ".delete"],
  ["supabase-realtime", "Supabase Realtime", "Ecouter en temps reel", "Listen in real time", "hooks/useOrders.ts", "supabase.channel(\"orders\").on(\"postgres_changes\", { event: \"INSERT\", schema: \"public\", table: \"orders\" }, refresh).subscribe();", "postgres_changes"],
  ["auth-signup", "Supabase Auth", "Creer un compte", "Create an account", "app/inscription/page.tsx", "await supabase.auth.signUp({ email, password });", "signUp"],
  ["auth-signout", "Supabase Auth", "Se deconnecter", "Sign out", "components/LogoutButton.tsx", "await supabase.auth.signOut();", "signOut"],
  ["auth-reset", "Supabase Auth", "Reinitialiser le mot de passe", "Reset password", "app/mot-de-passe/page.tsx", "await supabase.auth.resetPasswordForEmail(email);", "resetPasswordForEmail"],
  ["rls-profile", "SQL + RLS", "Proteger le profil", "Protect user profiles", "Supabase SQL Editor", "create policy \"Users read own profile\" on profiles for select using (auth.uid() = id);", "auth.uid()"],
  ["storage-delete", "Supabase Storage", "Supprimer une image", "Delete an image", "lib/storage.ts", "await supabase.storage.from(\"product-images\").remove([path]);", ".remove"],
  ["storage-signed-url", "Supabase Storage", "URL privee temporaire", "Temporary private URL", "lib/storage.ts", "const { data } = await supabase.storage.from(\"private\").createSignedUrl(path, 3600);", "createSignedUrl"],
  ["sql-function", "PostgreSQL", "Creer une fonction SQL", "Create a SQL function", "Supabase SQL Editor", "create function product_count() returns bigint language sql as 'select count(*) from products';", "create function"],
  ["sql-trigger", "PostgreSQL", "Automatiser avec un trigger", "Automate with a trigger", "Supabase SQL Editor", "create trigger set_updated_at before update on products for each row execute function update_timestamp();", "create trigger"],
  ["cart-state", "E-commerce", "Etat du panier", "Cart state", "contexts/CartContext.tsx", "const addItem = (product: Product) => setItems(items => [...items, product]);", "setItems"],
  ["cart-storage", "E-commerce", "Sauvegarder le panier", "Persist the cart", "hooks/useCart.ts", "localStorage.setItem(\"cart\", JSON.stringify(items));", "localStorage"],
  ["cart-total", "E-commerce", "Calculer le total", "Calculate cart total", "lib/cart.ts", "const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);", ".reduce"],
  ["delivery-cost", "E-commerce", "Calculer la livraison", "Calculate delivery", "lib/checkout.ts", "const delivery = subtotal >= freeDeliveryFrom ? 0 : deliveryFee;", "freeDeliveryFrom"],
  ["order-transaction", "E-commerce", "Creer une commande sure", "Create an order safely", "Supabase SQL Editor", "begin; insert into orders (customer_id, total) values (auth.uid(), 299); commit;", "commit"],
  ["payment-webhook", "Payments", "Recevoir un webhook", "Receive a webhook", "app/api/webhooks/payment/route.ts", "const signature = request.headers.get(\"payment-signature\");", "payment-signature"],
  ["product-search", "E-commerce", "Rechercher un produit", "Search products", "lib/search.ts", "const matches = products.filter(product => product.name.toLowerCase().includes(query.toLowerCase()));", ".includes"],
  ["category-filter", "E-commerce", "Filtrer par categorie", "Filter by category", "lib/filters.ts", "const visible = category === \"all\" ? products : products.filter(p => p.category === category);", "category ==="],
  ["optimistic-ui", "React", "Mise a jour optimiste", "Optimistic update", "components/LikeButton.tsx", "const [optimisticLikes, addOptimisticLike] = useOptimistic(likes, value => value + 1);", "useOptimistic"],
  ["toast-feedback", "UX", "Confirmer une action", "Confirm an action", "components/AddToCart.tsx", "toast.success(\"Produit ajoute au panier\");", "toast.success"],
  ["accessible-modal", "Accessibility", "Fenetre modale accessible", "Accessible modal", "components/Modal.tsx", "<dialog aria-labelledby=\"modal-title\" open><h2 id=\"modal-title\">Confirmation</h2></dialog>", "aria-labelledby"],
  ["accessible-form", "Accessibility", "Formulaire accessible", "Accessible form", "components/ContactForm.tsx", "<label htmlFor=\"email\">Email</label><input id=\"email\" aria-describedby=\"email-help\" />", "htmlFor="],
  ["keyboard-navigation", "Accessibility", "Navigation clavier", "Keyboard navigation", "components/Menu.tsx", "<button onKeyDown={event => event.key === \"Escape\" && closeMenu()}>Menu</button>", "event.key"],
  ["unit-test", "Testing", "Premier test unitaire", "First unit test", "lib/cart.test.ts", "expect(calculateTotal([{ price: 10, quantity: 2 }])).toBe(20);", "expect("],
  ["api-test", "Testing", "Tester une API", "Test an API", "app/api/hello/route.test.ts", "const response = await GET(); expect(response.status).toBe(200);", "response.status"],
  ["code-quality", "Tooling", "Verifier le code", "Check code quality", "package.json", "\"lint\": \"next lint\", \"typecheck\": \"tsc --noEmit\"", "tsc --noEmit"],
  ["security-headers", "Security", "Ajouter des en-tetes de securite", "Add security headers", "next.config.ts", "{ key: \"X-Content-Type-Options\", value: \"nosniff\" }", "nosniff"],
  ["vercel-deploy", "Deployment", "Deployer sur Vercel", "Deploy to Vercel", "vercel.json", "{ \"framework\": \"nextjs\", \"regions\": [\"cdg1\"] }", "framework"],
  ["final-storefront", "Final Project", "Construire la boutique complete", "Build the complete storefront", "app/page.tsx", "export default async function Storefront() { const products = await getProducts(); return <HomePage products={products} />; }", "Storefront"],
];

function makeExtendedLevel(topic: ExtendedTopic): Level {
  const [id, badge, titleFr, titleEn, filename, code, requiredToken] = topic;
  const title = { fr: titleFr, en: titleEn, ar: titleEn };
  return {
    id,
    badge,
    title,
    filename,
    goal: {
      fr: `Apprends ${titleFr.toLowerCase()} en ecrivant un exemple reel, puis verifie le resultat.`,
      en: `Learn ${titleEn.toLowerCase()} by writing a real example, then check the result.`,
      ar: `Learn ${titleEn.toLowerCase()} by writing a real example, then check the result.`,
    },
    lines: code.split("\n").map((line, index) => ({
      code: line,
      meaning: {
        fr: `Cette ligne ${index + 1} met en pratique ${titleFr.toLowerCase()} dans le fichier indique.`,
        en: `Line ${index + 1} applies ${titleEn.toLowerCase()} in the indicated file.`,
        ar: `Line ${index + 1} applies ${titleEn.toLowerCase()} in the indicated file.`,
      },
    })),
    checks: [{
      token: requiredToken,
      label: { fr: `l'element essentiel : ${requiredToken}`, en: `the required element: ${requiredToken}`, ar: `the required element: ${requiredToken}` },
    }],
    hint: {
      fr: `Observe le fichier ${filename}, recopie le code, puis change une petite valeur pour comprendre son effet.`,
      en: `Study ${filename}, rewrite the code, then change one small value to understand its effect.`,
      ar: `Study ${filename}, rewrite the code, then change one small value to understand its effect.`,
    },
  };
}

function enrichLevel(level: Level): Level {
  const comment = level.filename.includes("SQL Editor") ? "--" : level.filename.endsWith(".env.local") ? "#" : "//";
  const intro: Level["lines"] = [
    {
      code: `${comment} LEÇON : ${level.title.fr}`,
      meaning: {
        fr: "Cette ligne annonce le concept précis que tu vas apprendre dans ce niveau.",
        en: "This line names the exact concept you will learn in this level.",
        ar: "This line names the exact concept you will learn in this level.",
      },
    },
    {
      code: `${comment} FICHIER : ${level.filename}`,
      meaning: {
        fr: "Elle indique exactement où placer ce code dans ton projet. Le chemin est aussi important que le code dans Next.js.",
        en: "It shows exactly where this code belongs. In Next.js, the file path is as important as the code.",
        ar: "It shows exactly where this code belongs. In Next.js, the file path is as important as the code.",
      },
    },
    {
      code: `${comment} Lis chaque ligne, recopie-la, puis change une petite valeur.`,
      meaning: {
        fr: "La meilleure méthode est : observer, recopier, tester, modifier, puis expliquer avec tes propres mots.",
        en: "The best method is: observe, rewrite, test, change, then explain it in your own words.",
        ar: "The best method is: observe, rewrite, test, change, then explain it in your own words.",
      },
    },
  ];
  const guide: Level["lines"] = [
    {
      code: `${comment} POINT CLÉ : le validateur cherche « ${level.checks[0]?.token ?? level.id} ».`,
      meaning: {
        fr: "Ce point clé est l'élément obligatoire que ton exercice doit contenir pour prouver que tu as compris le concept.",
        en: "This key point is the required element your exercise must contain to demonstrate the concept.",
        ar: "This key point is the required element your exercise must contain to demonstrate the concept.",
      },
    },
    {
      code: `${comment} TEST : utilise « Vérifier mon code » et lis chaque message.`,
      meaning: {
        fr: "Le test compare ton travail aux éléments essentiels. Un message d'erreur indique quoi corriger, pas que tu as échoué.",
        en: "The test compares your work with the essentials. An error tells you what to fix; it does not mean you failed.",
        ar: "The test compares your work with the essentials. An error tells you what to fix; it does not mean you failed.",
      },
    },
    {
      code: `${comment} EXPÉRIENCE : modifie un texte, un nombre ou une classe CSS.`,
      meaning: {
        fr: "Changer une seule valeur puis regarder le résultat t'aide à relier le code à ce qui apparaît à l'écran.",
        en: "Changing one value and observing the result connects the code to what appears on screen.",
        ar: "Changing one value and observing the result connects the code to what appears on screen.",
      },
    },
    {
      code: `${comment} DÉBOGAGE : corrige une erreur à la fois, de la première à la dernière.`,
      meaning: {
        fr: "Une première erreur peut en provoquer plusieurs autres. Commence toujours par le premier message affiché.",
        en: "One early error can cause many others. Always begin with the first message shown.",
        ar: "One early error can cause many others. Always begin with the first message shown.",
      },
    },
    {
      code: `${comment} QUALITÉ : garde des noms clairs et une indentation régulière.`,
      meaning: {
        fr: "Un code bien nommé et bien aligné est plus simple à comprendre, vérifier et modifier plus tard.",
        en: "Clearly named and consistently indented code is easier to understand, verify, and change later.",
        ar: "Clearly named and consistently indented code is easier to understand, verify, and change later.",
      },
    },
    {
      code: `${comment} SÉCURITÉ : ne place jamais de mot de passe ou de clé secrète dans le navigateur.`,
      meaning: {
        fr: "Les secrets restent côté serveur ou dans les variables d'environnement privées. NEXT_PUBLIC_ est visible par tous.",
        en: "Secrets stay on the server or in private environment variables. NEXT_PUBLIC_ values are visible to everyone.",
        ar: "Secrets stay on the server or in private environment variables. NEXT_PUBLIC_ values are visible to everyone.",
      },
    },
    {
      code: `${comment} RÉVISION : explique maintenant le rôle de ce code sans le lire.`,
      meaning: {
        fr: "Si tu peux expliquer l'objectif et les lignes principales, tu as réellement compris la leçon.",
        en: "If you can explain the goal and main lines, you have genuinely understood the lesson.",
        ar: "If you can explain the goal and main lines, you have genuinely understood the lesson.",
      },
    },
    {
      code: `${comment} TERMINÉ : passe au défi pratique et écris le code toi-même.`,
      meaning: {
        fr: "La démonstration est terminée. Le défi pratique te permet maintenant de consolider la mémoire.",
        en: "The demonstration is complete. The practice challenge now helps consolidate your memory.",
        ar: "The demonstration is complete. The practice challenge now helps consolidate your memory.",
      },
    },
  ];
  const guideLinesNeeded = Math.max(1, 12 - intro.length - level.lines.length);
  return { ...level, lines: [...intro, ...level.lines, ...guide.slice(0, guideLinesNeeded)] };
}

const LEVELS: Level[] = [...BASE_LEVELS, ...EXTENDED_TOPICS.map(makeExtendedLevel)].map(enrichLevel);

function sourceOf(level: Level) { return level.lines.map(line => line.code).join("\n"); }

export default function CodeCoachGame({ lang }: { lang: Lang }) {
  const ui = TEXT[lang];
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<"watch" | "practice" | "result">("watch");
  const [revealed, setRevealed] = useState(1);
  const [answer, setAnswer] = useState("");
  const [missing, setMissing] = useState<Check[]>([]);
  const [correct, setCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [selectedDemoLine, setSelectedDemoLine] = useState<number | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const level = LEVELS[levelIndex];
  const demoComplete = revealed >= level.lines.length;
  const activeDemoLine = selectedDemoLine ?? revealed - 1;
  const xp = completed.size * 100;
  const progress = Math.round((completed.size / LEVELS.length) * 100);
  const normalizedAnswer = useMemo(() => answer.replace(/[']/g, '"').replace(/\s+/g, "").trim().toLowerCase(), [answer]);

  useEffect(() => {
    if (phase !== "watch" || demoComplete) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setRevealed(level.lines.length); return; }
    const timer = window.setTimeout(() => setRevealed(value => Math.min(level.lines.length, value + 1)), 1450);
    return () => window.clearTimeout(timer);
  }, [phase, demoComplete, level.lines.length, revealed]);

  function beginPractice() {
    setPhase("practice"); setAnswer(""); setMissing([]); setCorrect(false); setShowAnswer(false);
    window.setTimeout(() => editorRef.current?.focus(), 50);
  }

  function verify() {
    const failed = level.checks.filter(check => !normalizedAnswer.includes(check.token.replace(/[']/g, '"').replace(/\s+/g, "").toLowerCase()));
    setMissing(failed); setCorrect(failed.length === 0); setPhase("result");
    if (!failed.length) setCompleted(previous => new Set(previous).add(level.id));
  }

  function selectLevel(index: number) {
    setLevelIndex(index); setPhase("watch"); setRevealed(1); setSelectedDemoLine(null); setAnswer(""); setMissing([]); setCorrect(false); setShowAnswer(false);
  }

  return (
    <div id="code-coach-game" data-code-game-levels={LEVELS.length} dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b0f0d] p-5 text-white sm:p-8">
        <div className="absolute -end-20 -top-24 h-72 w-72 rounded-full bg-[#3ecf4c]/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl"><span className="inline-flex rounded-full border border-[#3ecf4c]/30 bg-[#3ecf4c]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-[#3ecf4c]">INTERACTIVE GAME</span><h2 className="mt-4 text-3xl font-black sm:text-5xl">{ui.title}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">{ui.subtitle}</p></div>
          <div className="grid grid-cols-3 gap-2"><Stat value={`${completed.size}/${LEVELS.length}`} label={ui.completed} /><Stat value={xp} label={ui.xp} /><Stat value={`${progress}%`} label={ui.progress} /></div>
        </div>
        <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#3ecf4c] transition-[width]" style={{ width: `${progress}%` }} /></div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm xl:sticky xl:top-40 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto xl:overscroll-contain">
          <p className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">{LEVELS.length} {ui.levels}</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{LEVELS.map((item, index) => <button key={item.id} type="button" onClick={() => selectLevel(index)} className={"flex min-h-14 items-center gap-3 rounded-xl border p-3 text-start transition " + (index === levelIndex ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-100 hover:border-neutral-300")}><span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black " + (completed.has(item.id) ? "bg-[#3ecf4c] text-black" : "bg-neutral-100 text-neutral-600")}>{completed.has(item.id) ? "✓" : index + 1}</span><span><span className="block text-[9px] font-black uppercase tracking-wide opacity-50">{item.badge}</span><span className="mt-0.5 block text-xs font-black">{t(item.title, lang)}</span></span></button>)}</div>
        </aside>

        <main className="min-w-0 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#16b277]">LEVEL {levelIndex + 1} · {level.badge}</p><h3 className="mt-1 text-xl font-black sm:text-2xl">{t(level.title, lang)}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{t(level.goal, lang)}</p></div><span className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-[10px] font-bold text-violet-700">{level.filename}</span></div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-black"><Phase active={phase === "watch"} done={phase !== "watch"} number="1" label={ui.watch} /><Phase active={phase === "practice"} done={phase === "result"} number="2" label={ui.practice} /><Phase active={phase === "result"} done={correct} number="3" label={ui.result} /></div>
          </div>

          {phase === "watch" ? <><div className="grid lg:grid-cols-[1.2fr_.8fr]">
            <div dir="ltr" className="min-h-[390px] bg-[#0d0d0d] p-4 font-mono text-[11px] leading-7 text-white sm:p-6 sm:text-xs">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3"><span className="text-white/40">🤖 coach · {level.filename}</span><span className="text-[9px] font-sans text-white/35">{lang === "fr" ? "Clique une ligne pour demander son sens" : lang === "ar" ? "انقر على سطر لمعرفة معناه" : "Click a line to ask what it means"}</span><span className="animate-pulse text-[#3ecf4c] motion-reduce:animate-none">● CODING</span></div>
              {level.lines.slice(0, revealed).map((line, index) => <button data-code-demo-line={index} aria-pressed={index === activeDemoLine} aria-label={`${lang === "fr" ? "Expliquer la ligne" : lang === "ar" ? "اشرح السطر" : "Explain line"} ${index + 1}`} type="button" key={index} onClick={() => setSelectedDemoLine(index)} className={"flex w-full rounded px-2 text-start transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3ecf4c] " + (index === activeDemoLine ? "bg-[#3ecf4c]/15 text-white ring-1 ring-inset ring-[#3ecf4c]/30" : "text-white/60 hover:bg-white/5 hover:text-white")}><span className="me-4 w-5 shrink-0 select-none text-end text-white/20">{index + 1}</span><code className="whitespace-pre-wrap break-all">{line.code}</code></button>)}
            </div>
            <div className="flex min-h-[390px] flex-col p-5 sm:p-6">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3ecf4c] text-xl">🤖</span><div><p className="text-xs font-black">LECOMAX CODE BOT</p><p className="text-[10px] text-neutral-400">{selectedDemoLine !== null ? (lang === "fr" ? `Tu as choisi la ligne ${activeDemoLine + 1}` : lang === "ar" ? `اخترت السطر ${activeDemoLine + 1}` : `You selected line ${activeDemoLine + 1}`) : `${ui.explanation} · ${revealed}/${level.lines.length}`}</p></div></div>
              <div aria-live="polite" className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-emerald-600">{lang === "fr" ? `Ligne ${activeDemoLine + 1} — voici ce qu'elle signifie` : lang === "ar" ? `السطر ${activeDemoLine + 1} — هذا معناه` : `Line ${activeDemoLine + 1} — here is what it means`}</p>
                <code dir="ltr" className="block break-all text-xs font-black text-emerald-800">{level.lines[activeDemoLine].code}</code><p className="mt-3 text-sm leading-7 text-emerald-950">{t(level.lines[activeDemoLine].meaning, lang)}</p>
              </div>
              {selectedDemoLine !== null && <button type="button" onClick={() => setSelectedDemoLine(null)} className="mt-3 min-h-10 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-800">{lang === "fr" ? "↻ Revenir à l'explication en direct" : lang === "ar" ? "↻ العودة إلى الشرح المباشر" : "↻ Return to the live explanation"}</button>}
              <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2"><button type="button" disabled={demoComplete} onClick={() => { setSelectedDemoLine(null); setRevealed(value => Math.min(level.lines.length, value + 1)); }} className="min-h-12 rounded-xl border border-neutral-200 px-4 text-xs font-black disabled:opacity-40">{ui.nextLine}</button><button data-code-game-action="advance" type="button" onClick={() => { setSelectedDemoLine(null); demoComplete ? beginPractice() : setRevealed(level.lines.length); }} className="min-h-12 rounded-xl bg-neutral-900 px-4 text-xs font-black text-white">{demoComplete ? ui.start : ui.skip} →</button></div>
            </div>
          </div><CodeMeaningAndPreview level={level} levelIndex={levelIndex} lang={lang} /></> : <div className="grid lg:grid-cols-[1.2fr_.8fr]">
            <div className="bg-[#0d0d0d] p-4 sm:p-6"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#3ecf4c]">{ui.practice}</p><p className="mt-1 font-mono text-[10px] text-white/45">{ui.file}: {level.filename}</p></div><span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-white/45">{ui.safe}</span></div><label className="sr-only" htmlFor="code-game-editor">{ui.practice}</label><textarea id="code-game-editor" ref={editorRef} value={answer} onChange={event => { setAnswer(event.target.value); if (phase === "result") setPhase("practice"); }} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder={ui.placeholder} className="min-h-[380px] w-full resize-y rounded-2xl border border-white/10 bg-[#111714] p-4 font-mono text-sm leading-7 text-[#d8fbe0] outline-none placeholder:text-white/20 focus:border-[#3ecf4c] focus:ring-4 focus:ring-[#3ecf4c]/10" /><button data-code-game-action="check" type="button" disabled={!answer.trim()} onClick={verify} className="mt-3 min-h-12 w-full rounded-xl bg-[#3ecf4c] px-4 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40">{ui.check} →</button></div>
            <div className="flex min-h-[510px] flex-col p-5 sm:p-6"><div><p className="text-[10px] font-black uppercase tracking-widest text-violet-600">{ui.mission}</p><p className="mt-2 text-sm leading-7 text-neutral-700">{t(level.goal, lang)}</p><p className="mt-4 rounded-xl bg-violet-50 p-4 text-xs leading-6 text-violet-900">💡 {t(level.hint, lang)}</p></div>{phase === "result" && <div data-code-game-result={correct ? "correct" : "incorrect"} aria-live="polite" className={"mt-5 rounded-2xl border p-4 " + (correct ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950")}><p className="text-sm font-black">{correct ? `✓ ${ui.correct}` : `↻ ${ui.incorrect}`}</p>{!correct && <ul className="mt-3 space-y-2">{missing.map(item => <li key={item.token} className="text-xs">• {t(item.label, lang)}</li>)}</ul>}{correct && <p className="mt-2 text-xs">+100 {ui.xp}</p>}</div>}<div className="mt-auto space-y-2 pt-5">{!correct && <button type="button" onClick={() => setShowAnswer(value => !value)} className="min-h-11 w-full rounded-xl border border-neutral-200 px-4 text-xs font-black">{showAnswer ? ui.hide : ui.answer}</button>}{showAnswer && <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">{ui.answerTitle}</p><pre dir="ltr" className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-900 p-3 text-[10px] leading-6 text-white">{sourceOf(level)}</pre></div>}{correct ? <button type="button" onClick={() => levelIndex < LEVELS.length - 1 ? selectLevel(levelIndex + 1) : selectLevel(0)} className="min-h-12 w-full rounded-xl bg-neutral-900 px-4 text-xs font-black text-white">{levelIndex < LEVELS.length - 1 ? ui.next : ui.reset} →</button> : phase === "result" && <button type="button" onClick={() => { setPhase("practice"); editorRef.current?.focus(); }} className="min-h-12 w-full rounded-xl bg-neutral-900 px-4 text-xs font-black text-white">{ui.retry}</button>}</div></div>
          </div>}
        </main>
      </div>
    </div>
  );
}

function CodeMeaningAndPreview({ level, levelIndex, lang }: { level: Level; levelIndex: number; lang: Lang }) {
  const [view, setView] = useState<"meaning" | "preview">("meaning");
  const [selected, setSelected] = useState<number | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const options = [
    LEVELS[(levelIndex + 1) % LEVELS.length].goal,
    level.goal,
    LEVELS[(levelIndex + 2) % LEVELS.length].goal,
  ];
  const copy = lang === "en"
    ? { meaning: "What does this code mean?", preview: "See the code result", question: "What does this complete code do?", choose: "Choose the best answer.", correct: "Correct — you understood the purpose of the code.", wrong: "Not quite. Read the goal and compare it with the important lines.", result: "Visual result", note: "This preview is safe and represents what the example produces in the browser." }
    : lang === "ar"
      ? { meaning: "ماذا يعني هذا الكود؟", preview: "شاهد نتيجة الكود", question: "ماذا يفعل هذا الكود كاملاً؟", choose: "اختر أفضل إجابة.", correct: "صحيح — لقد فهمت هدف الكود.", wrong: "ليس تماماً. اقرأ الهدف وقارنه بالأسطر المهمة.", result: "النتيجة المرئية", note: "هذه معاينة آمنة تمثل ما ينتجه المثال في المتصفح." }
      : { meaning: "Que signifie ce code ?", preview: "Voir le résultat du code", question: "Que fait ce code complet ?", choose: "Choisis la meilleure réponse.", correct: "Correct — tu as compris le rôle du code.", wrong: "Pas exactement. Relis l'objectif et compare-le aux lignes importantes.", result: "Résultat visuel", note: "Cette prévisualisation est sûre et représente ce que l'exemple produit dans le navigateur." };

  useEffect(() => { setSelected(null); setView("meaning"); setPreviewCount(0); }, [level.id]);

  return (
    <section className="border-t border-neutral-100 bg-neutral-50 p-4 sm:p-6">
      <div className="grid gap-2 sm:grid-cols-2">
        <button data-code-game-view="meaning" type="button" aria-pressed={view === "meaning"} onClick={() => setView("meaning")} className={"min-h-12 rounded-xl border px-4 text-sm font-black transition " + (view === "meaning" ? "border-violet-600 bg-violet-600 text-white shadow-sm" : "border-neutral-200 bg-white text-neutral-700 hover:border-violet-300")}><span className="me-2">?</span>{copy.meaning}</button>
        <button data-code-game-view="preview" type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")} className={"min-h-12 rounded-xl border px-4 text-sm font-black transition " + (view === "preview" ? "border-[#16b277] bg-[#16b277] text-white shadow-sm" : "border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300")}><span className="me-2">▶</span>{copy.preview}</button>
      </div>

      {view === "meaning" ? <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg">🤖</span><div><h4 className="text-base font-black text-neutral-950">{copy.question}</h4><p className="mt-1 text-xs text-neutral-500">{copy.choose}</p></div></div>
        <div role="radiogroup" aria-label={copy.question} className="mt-4 grid gap-2 lg:grid-cols-3">
          {options.map((option, index) => <button key={index} type="button" role="radio" aria-checked={selected === index} onClick={() => setSelected(index)} className={"min-h-16 rounded-xl border p-3 text-start text-xs leading-5 transition " + (selected === index ? (index === 1 ? "border-emerald-400 bg-emerald-50 text-emerald-950" : "border-amber-300 bg-amber-50 text-amber-950") : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-400")}><span className="me-2 font-black">{String.fromCharCode(65 + index)}.</span>{t(option, lang)}</button>)}
        </div>
        {selected !== null && <div data-code-meaning-result={selected === 1 ? "correct" : "incorrect"} aria-live="polite" className={"mt-4 rounded-xl p-4 text-sm leading-6 " + (selected === 1 ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900")}><strong>{selected === 1 ? "✓ " + copy.correct : "↻ " + copy.wrong}</strong>{selected !== 1 && <p className="mt-2 font-medium">✓ {t(level.goal, lang)}</p>}</div>}
      </div> : <div data-code-game-preview className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#16b277]">{copy.result}</p><p className="mt-0.5 font-mono text-[10px] text-neutral-400">{level.filename}</p></div><span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> LIVE PREVIEW</span></div>
        <div className="min-h-64 bg-[#f5f5f3] p-4 sm:p-6"><CodeResultPreview levelId={level.id} count={previewCount} onCount={() => setPreviewCount(value => value + 1)} /></div>
        <p className="border-t border-neutral-100 px-4 py-3 text-[10px] leading-5 text-neutral-500">{copy.note}</p>
      </div>}
    </section>
  );
}

function CodeResultPreview({ levelId, count, onCount }: { levelId: string; count: number; onCount: () => void }) {
  if (levelId === "first-page") return <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm"><h1 className="text-3xl font-black text-neutral-950">Bienvenue</h1><p className="mt-3 text-neutral-600">Je construis ma première page.</p></div>;
  if (levelId === "tailwind-card") return <article className="mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-sm"><div className="h-32 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100" /><h2 className="mt-4 text-lg font-bold">Chaussures</h2><button className="mt-4 rounded-lg bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600">Acheter</button></article>;
  if (levelId === "interactive-counter") return <div className="flex min-h-52 items-center justify-center"><button type="button" onClick={onCount} className="rounded-2xl bg-neutral-950 px-6 py-4 text-lg font-black text-white shadow-lg transition active:scale-95">Clics : {count}</button></div>;
  if (levelId === "api-route") return <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-[#0d0d0d] shadow-lg"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[10px]"><span className="font-bold text-white/50">GET /api/hello</span><span className="rounded bg-emerald-500/15 px-2 py-1 font-black text-emerald-400">200 OK</span></div><pre className="p-5 text-sm leading-7 text-[#d8fbe0]">{`{\n  "message": "Bonjour depuis l'API"\n}`}</pre></div>;
  if (levelId === "javascript-logic") return <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm"><p className="text-xs font-bold text-neutral-400 line-through">100 MAD</p><p className="mt-1 text-4xl font-black text-emerald-600">80 MAD</p><span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Promotion −20 %</span></div>;
  if (levelId === "typescript-product") return <pre dir="ltr" className="mx-auto max-w-xl overflow-auto rounded-2xl bg-[#0d0d0d] p-5 text-xs leading-6 text-[#d8fbe0]">{`Product {\n  id: "p-001",\n  name: "Chaussures",\n  price: 69,\n  stock: 10,\n  active: true\n}`}</pre>;
  if (levelId === "react-product-list") return <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-3">{["Chaussures", "Sac à dos", "Écouteurs"].map((name, index) => <article key={name} className="rounded-2xl bg-white p-4 shadow-sm"><div className="h-20 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200" /><p className="mt-3 text-sm font-black">{name}</p><p className="mt-1 text-xs text-neutral-500">{69 + index * 40} MAD</p></article>)}</div>;
  if (levelId === "react-form") return <form onSubmit={event => event.preventDefault()} className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm"><label className="text-xs font-black" htmlFor="preview-email">Email</label><input id="preview-email" type="email" placeholder="vous@exemple.com" className="mt-2 min-h-12 w-full rounded-xl border border-neutral-200 px-4 outline-none focus:border-emerald-500" /><button type="submit" className="mt-3 min-h-12 w-full rounded-xl bg-neutral-950 font-black text-white">S&apos;inscrire</button></form>;
  if (levelId === "next-dynamic-route") return <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm"><div className="h-32 bg-gradient-to-r from-blue-100 to-violet-100" /><div className="p-6"><p className="font-mono text-[10px] text-violet-600">/produit/nike-air</p><h1 className="mt-2 text-2xl font-black">Produit : nike-air</h1></div></div>;
  if (levelId === "api-post") return <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-[#0d0d0d] shadow-lg"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[10px]"><span className="font-bold text-white/50">POST /api/products</span><span className="rounded bg-blue-500/15 px-2 py-1 font-black text-blue-300">201 CREATED</span></div><pre className="p-5 text-xs leading-6 text-[#d8fbe0]">{`{\n  "product": { "name": "Sac", "price": 149 }\n}`}</pre></div>;
  if (levelId === "supabase-write") return <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</span><p className="mt-3 text-lg font-black">Produit enregistré</p><p className="mt-1 text-xs text-neutral-500">Sac · 149 MAD · Stock mis à jour : 9</p></div>;
  if (levelId === "supabase-rls") return <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-200 bg-white p-5"><span className="text-2xl">🔓</span><p className="mt-2 font-black">Produit actif</p><p className="text-xs text-emerald-700">SELECT autorisé</p></div><div className="rounded-2xl border border-red-200 bg-white p-5 opacity-70"><span className="text-2xl">🔒</span><p className="mt-2 font-black">Produit inactif</p><p className="text-xs text-red-700">Masqué par RLS</p></div></div>;
  if (levelId === "supabase-auth") return <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Connexion</h2><input aria-label="Email preview" type="email" placeholder="Email" className="mt-4 min-h-11 w-full rounded-xl border px-3" /><input aria-label="Password preview" type="password" placeholder="Mot de passe" className="mt-2 min-h-11 w-full rounded-xl border px-3" /><button className="mt-3 min-h-11 w-full rounded-xl bg-[#3ecf4c] font-black">Se connecter</button></div>;
  if (levelId === "supabase-storage") return <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-8 text-center"><span className="text-4xl">🖼️</span><p className="mt-3 font-black">Image uploadée</p><p className="mt-1 break-all font-mono text-[9px] text-neutral-500">/storage/v1/object/public/product-images/products/image.webp</p></div>;
  return <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"><div className="grid grid-cols-[50px_1fr_90px] bg-neutral-900 px-4 py-3 text-[10px] font-black uppercase tracking-wide text-white"><span>ID</span><span>Produit</span><span>Prix</span></div>{[[1,"Chaussures",69],[2,"Sac à dos",149],[3,"Écouteurs",89]].map(row => <div key={row[0]} className="grid grid-cols-[50px_1fr_90px] border-t border-neutral-100 px-4 py-3 text-xs"><span className="text-neutral-400">{row[0]}</span><span className="font-bold">{row[1]}</span><span>{row[2]} MAD</span></div>)}</div>;
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return <div className="min-w-20 rounded-2xl border border-white/10 bg-white/5 p-3 text-center"><p className="text-lg font-black text-[#3ecf4c]">{value}</p><p className="text-[9px] uppercase tracking-wide text-white/40">{label}</p></div>;
}

function Phase({ active, done, number, label }: { active: boolean; done: boolean; number: string; label: string }) {
  return <div className={"rounded-xl border px-2 py-2.5 transition " + (active ? "border-neutral-900 bg-neutral-900 text-white" : done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-100 bg-neutral-50 text-neutral-400")}><span className="me-1">{done ? "✓" : number}</span>{label}</div>;
}
