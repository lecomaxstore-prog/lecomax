export type MissionText = readonly [string, string, string];
export type ShopMission = {
  id: string; icon: string; title: MissionText; idea: MissionText; task: MissionText;
  filename: string; before: string; after: string; options: readonly string[];
  answer: number; explanations: readonly MissionText[]; transfer: MissionText;
  moduleId: string; source: string;
};

// Each exercise changes one real Next.js/React concept. The preview is a teaching
// simulation, not a compiler; no learner-entered JavaScript is evaluated.
export const SHOP_MISSIONS: readonly ShopMission[] = [
  {
    id: "page", icon: "🏠", title: ["Ouvre ta boutique", "Open your shop", "افتح متجرك"],
    idea: ["Une adresse ouvre une page. Dans Next.js, app/boutique/page.tsx crée l’adresse /boutique. Le dossier donne le nom, page.tsx donne le contenu.", "An address opens a page. In Next.js, app/boutique/page.tsx creates /boutique. The folder names the route; page.tsx supplies its content.", "العنوان يفتح صفحة. في Next.js، الملف app/boutique/page.tsx ينشئ العنوان /boutique. المجلد يحدد الاسم والملف يحدد المحتوى."],
    task: ["Choisis le fichier qui affiche ta boutique à /boutique.", "Choose the file that displays your shop at /boutique.", "اختر الملف الذي يعرض متجرك في /boutique."],
    filename: "?", before: "export default function Boutique() {\n  return <h1>Ma boutique</h1>;\n}", after: "",
    options: ["app/boutique.tsx", "app/boutique/page.tsx", "app/boutique/layout.tsx"], answer: 1,
    explanations: [
      ["Le nom boutique.tsx ne crée pas une route dans l’App Router. Il faut un dossier boutique contenant page.tsx.", "A file named boutique.tsx does not create an App Router route. Use a boutique folder containing page.tsx.", "الملف boutique.tsx لا ينشئ مسارًا في App Router. تحتاج مجلد boutique بداخله page.tsx."],
      ["Exact ! /boutique vient du dossier boutique. La fonction renvoie le titre visible sur cette page.", "Exactly! /boutique comes from the boutique folder. The function returns the heading shown on that page.", "صحيح! /boutique يأتي من اسم المجلد. الدالة تُرجع العنوان الظاهر في الصفحة."],
      ["layout.tsx sert de cadre commun aux pages : menu, pied de page… Il ne remplace pas page.tsx.", "layout.tsx is a shared frame around pages: navigation, footer… It does not replace page.tsx.", "layout.tsx إطار مشترك للصفحات مثل القائمة والتذييل، ولا يحل محل page.tsx."],
    ],
    transfer: ["Dans ton projet d’entraînement, crée ce fichier, change le titre et ouvre /boutique. Puis crée /contact sans copier la réponse.", "In your practice project, create this file, change the heading and open /boutique. Then create /contact without copying the answer.", "في مشروع التدريب أنشئ الملف وغيّر العنوان وافتح /boutique، ثم أنشئ /contact دون نسخ الحل."],
    moduleId: "nextjs-app-router", source: "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
  },
  {
    id: "link", icon: "🚪", title: ["Relie deux pages", "Connect two pages", "اربط صفحتين"],
    idea: ["Un lien est une porte vers une adresse. Link est le composant Next.js pour naviguer entre les pages de ton site. href indique la destination.", "A link is a door to an address. Link is the Next.js component for navigating between your pages. href gives the destination.", "الرابط باب إلى عنوان. Link مكوّن Next.js للتنقل بين صفحات موقعك، وhref يحدد الوجهة."],
    task: ["Complète le lien pour ouvrir /boutique depuis l’accueil.", "Complete the link to open /boutique from the home page.", "أكمل الرابط لفتح /boutique من الصفحة الرئيسية."],
    filename: "app/page.tsx", before: 'import Link from "next/link";\n\nexport default function Home() {\n  return <Link href=', after: '>Voir la boutique</Link>;\n}',
    options: ['"/boutique"', '"app/boutique/page.tsx"', '"/contact"'], answer: 0,
    explanations: [
      ["Oui ! href contient l’adresse visitée. Le visiteur n’a pas besoin de connaître le fichier.", "Yes! href contains the address to visit. The visitor does not need the source filename.", "نعم! href يحتوي عنوان الزيارة. الزائر لا يحتاج معرفة اسم الملف."],
      ["C’est un chemin de fichier sur ton ordinateur. Le navigateur attend une adresse comme /boutique.", "That is a source-file path on your computer. The browser needs an address such as /boutique.", "هذا مسار ملف على جهازك، بينما المتصفح يحتاج عنوانًا مثل /boutique."],
      ["Ce lien ouvre /contact. Pour la boutique, choisis l’adresse du dossier boutique.", "This link opens /contact. To reach the shop, use the boutique folder’s address.", "هذا الرابط يفتح /contact. للوصول للمتجر استخدم عنوان مجلد boutique."],
    ],
    transfer: ["Ajoute un Link vers /boutique à ton accueil, puis un lien de retour vers /. Teste les deux.", "Add a Link to /boutique on your home page, then a return link to /. Test both.", "أضف Link إلى /boutique في الرئيسية ثم رابط عودة إلى /. جرّب الاثنين."],
    moduleId: "nextjs-app-router", source: "https://nextjs.org/docs/app/getting-started/linking-and-navigating",
  },
  {
    id: "props", icon: "🧩", title: ["Réutilise ta fiche produit", "Reuse your product card", "أعد استخدام بطاقة المنتج"],
    idea: ["Un composant est un morceau d’interface réutilisable. Une prop lui donne une information. La même carte peut donc afficher un sac ou une lampe.", "A component is a reusable piece of interface. A prop gives it information. The same card can display a bag or a lamp.", "المكوّن جزء واجهة قابل لإعادة الاستخدام. الخاصية prop تعطيه معلومة، لذلك نفس البطاقة تعرض حقيبة أو مصباحًا."],
    task: ["Le produit s’appelle Lampe. Quelle valeur faut-il donner à name ?", "The product is called Lampe. What value should name receive?", "اسم المنتج Lampe. ما القيمة المناسبة للخاصية name؟"],
    filename: "app/boutique/page.tsx", before: 'function ProductCard({ name }: { name: string }) {\n  return <h2>{name}</h2>;\n}\n\nexport default function Boutique() {\n  return <ProductCard name=', after: ' />;\n}',
    options: ['"name"', '"Sac"', '"Lampe"'], answer: 2,
    explanations: [
      ["Entre guillemets, name est du texte : la carte afficherait le mot name. Donne-lui le nom du produit.", "Inside quotes, name is literal text: the card would show the word name. Pass the product’s name instead.", "بين علامتي التنصيص، name نص حرفي وستعرضه البطاقة. مرّر اسم المنتج."],
      ["Le composant fonctionne, mais afficherait Sac. Change seulement la prop pour afficher Lampe.", "The component works, but would display Sac. Change only the prop to display Lampe.", "المكوّن يعمل لكنه سيعرض Sac. غيّر الخاصية فقط ليعرض Lampe."],
      ["Bien joué ! name reçoit Lampe, et {name} affiche cette valeur dans le titre. Les accolades lisent une valeur JavaScript.", "Nice! name receives Lampe, and {name} displays that value in the heading. Curly braces read a JavaScript value.", "رائع! name يستقبل Lampe و{name} يعرض القيمة في العنوان. الأقواس المعقوفة تقرأ قيمة JavaScript."],
    ],
    transfer: ["Affiche deux ProductCard avec deux noms différents. Change une seule fois le style du composant : les deux cartes changent.", "Render two ProductCard components with different names. Change the component’s style once: both cards change.", "اعرض بطاقتي ProductCard باسمين مختلفين. غيّر تنسيق المكوّن مرة واحدة فتتغير البطاقتان."],
    moduleId: "react-fundamentals", source: "https://react.dev/learn/passing-props-to-a-component",
  },
  {
    id: "state", icon: "🛒", title: ["Anime ton panier", "Make your cart work", "شغّل سلتك"],
    idea: ["Le state est la mémoire d’un composant. setCount demande à React de mémoriser la nouvelle quantité et d’actualiser l’affichage. Un clic nécessite un composant client.", "State is a component’s memory. setCount asks React to remember a new quantity and update the display. A click handler needs a Client Component.", "الحالة state ذاكرة المكوّن. setCount يطلب من React حفظ الكمية الجديدة وتحديث العرض. معالجة النقر تحتاج مكوّن عميل."],
    task: ["Le panier commence à 0. Complète l’action pour ajouter 1 à chaque clic.", "The cart starts at 0. Complete the action to add 1 on each click.", "تبدأ السلة بـ0. أكمل العملية لإضافة 1 مع كل نقرة."],
    filename: "app/boutique/AddButton.tsx", before: '"use client";\nimport { useState } from "react";\n\nexport default function AddButton() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => ', after: '}>\n    Panier : {count}\n  </button>;\n}',
    options: ['setCount(current => current + 1)', 'setCount(1)', 'count + 1'], answer: 0,
    explanations: [
      ["Exact ! current est la quantité précédente. On renvoie cette quantité plus 1. Essaie trois clics dans l’aperçu.", "Exactly! current is the previous quantity. Return that quantity plus 1. Try three clicks in the preview.", "صحيح! current هي الكمية السابقة. نعيد الكمية زائد 1. جرّب ثلاث نقرات في المعاينة."],
      ["Chaque clic fixe la quantité à 1. Après trois clics, elle reste à 1. Il faut partir de la quantité précédente.", "Every click sets the quantity to 1. After three clicks, it is still 1. Start from the previous quantity instead.", "كل نقرة تضبط الكمية على 1، فتبقى 1 بعد ثلاث نقرات. استخدم الكمية السابقة."],
      ["Ce calcul ne sauvegarde rien. Sans setCount, React ne reçoit pas de nouvelle valeur à afficher.", "This calculation saves nothing. Without setCount, React receives no new value to display.", "هذه العملية لا تحفظ شيئًا. دون setCount لن يتلقى React قيمة جديدة للعرض."],
    ],
    transfer: ["Crée ce composant, importe-le dans ta page et clique trois fois. Ajoute ensuite un bouton qui remet le panier à zéro.", "Create this component, import it into your page and click three times. Then add a button that resets the cart to zero.", "أنشئ المكوّن واستورده في الصفحة وانقر ثلاث مرات، ثم أضف زرًا يعيد السلة للصفر."],
    moduleId: "react-state-forms-hooks", source: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
  },
  {
    id: "server", icon: "🔐", title: ["Place chaque tâche au bon endroit", "Put each job in the right place", "ضع كل مهمة في مكانها"],
    idea: ["Le serveur prépare les données. Le navigateur réagit aux clics. Garde les secrets sur le serveur ; ajoute use client aux composants interactifs qui en ont besoin.", "The server prepares data. The browser responds to clicks. Keep secrets on the server; add use client to components that need interaction.", "الخادم يجهّز البيانات والمتصفح يستجيب للنقرات. احتفظ بالأسرار في الخادم وأضف use client للمكوّنات التي تحتاج التفاعل."],
    task: ["Où placer une clé privée qui permet d’administrer la base de données ?", "Where should a private key with database administrator access live?", "أين تضع مفتاحًا خاصًا يملك صلاحية إدارة قاعدة البيانات؟"],
    filename: "lib/catalog-server.ts", before: 'import "server-only";\n\n// Private environment variable\nconst adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;', after: '',
    options: ['NEXT_PUBLIC_ADMIN_KEY', 'AddButton.tsx', 'server-only'], answer: 2,
    explanations: [
      ["NEXT_PUBLIC_ expose une variable au navigateur. Une clé d’administration doit rester privée sur le serveur.", "NEXT_PUBLIC_ exposes a variable to the browser. An administrator key must remain private on the server.", "البادئة NEXT_PUBLIC_ تكشف المتغير للمتصفح. مفتاح الإدارة يجب أن يبقى خاصًا في الخادم."],
      ["Ton bouton est un composant client. Le code envoyé au navigateur peut être inspecté : ne lui donne pas de clé privée.", "Your button is a Client Component. Code sent to the browser can be inspected: do not give it a private key.", "الزر مكوّن عميل. يمكن فحص الكود المرسل للمتصفح؛ لا تعطه مفتاحًا خاصًا."],
      ["Oui. server-only empêche l’import de ce module dans le code client. Les opérations privées doivent aussi vérifier l’identité et les droits de l’utilisateur.", "Yes. server-only prevents importing this module into client code. Private operations must also check the user’s identity and permissions.", "نعم. server-only يمنع استيراد الوحدة في كود العميل. العمليات الخاصة تحتاج أيضًا التحقق من هوية المستخدم وصلاحياته."],
    ],
    transfer: ["Dessine deux colonnes : serveur et navigateur. Place la lecture de produits, les clés privées et les clics du panier. Explique tes choix avant de connecter Supabase.", "Draw two columns: server and browser. Place product reads, private keys and cart clicks. Explain your choices before connecting Supabase.", "ارسم عمودين: الخادم والمتصفح. وزّع قراءة المنتجات والمفاتيح الخاصة ونقرات السلة واشرح اختياراتك قبل ربط Supabase."],
    moduleId: "nextjs-server-data", source: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
  },
];

export function readMissionProgress(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && SHOP_MISSIONS.some(m => m.id === id)))] : [];
}
