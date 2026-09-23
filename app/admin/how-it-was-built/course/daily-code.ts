import type { Text } from "./daily-lessons";

export type DailyCodeGuide = { anchor: string; count: number; why: Text; without: Text; vocabulary: [string, Text][] };

// Anchors locate short excerpts in the protected source library, rather than
// shipping copied application source or secrets in a public client bundle.
export const DAILY_CODE: Record<string, DailyCodeGuide> = {
  website: {
    anchor: "export default async function HomePage", count: 7,
    why: ["Next.js utilise app/page.tsx pour construire l’accueil. La fonction HomePage prépare ce que le visiteur verra ; async lui permet d’attendre des données avant de composer la page.", "Next.js uses app/page.tsx to build the home page. HomePage prepares what visitors see; async lets it wait for data before composing the page.", "يستخدم Next.js ملف app/page.tsx لبناء الرئيسية. تجهّز HomePage ما يراه الزائر، وتسمح async بانتظار البيانات قبل بناء الصفحة."],
    without: ["Sans une page à cette adresse, Next.js ne saurait pas quel écran afficher à l’accueil. Le fichier ne remplace pas la base de données : il organise l’affichage.", "Without a page at this route, Next.js would not know what home screen to render. This file arranges the display; it does not replace the database.", "دون صفحة لهذا المسار لن يعرف Next.js ماذا يعرض في الرئيسية. ينظم الملف العرض ولا يحل محل قاعدة البيانات."],
    vocabulary: [["async / await", ["Une fonction peut attendre le résultat d’un travail, par exemple charger les produits.", "A function can wait for work to finish, such as loading products.", "يمكن للدالة انتظار انتهاء مهمة مثل تحميل المنتجات."]]],
  },
  files: {
    anchor: '"scripts": {', count: 7,
    why: ["Ces raccourcis donnent un nom aux commandes du projet. npm run dev lance la commande dev ; predev prépare les fichiers nécessaires juste avant.", "These shortcuts name project commands. npm run dev runs dev; predev prepares required files just before it.", "تمنح هذه الاختصارات أسماء لأوامر المشروع. يشغّل npm run dev أمر dev، ويجهز predev الملفات قبله."],
    without: ["Il faudrait retenir les commandes complètes. Ce fichier organise les outils ; il ne dessine pas une page de la boutique.", "You would need to remember full commands. This file organises tools; it does not draw a shop page.", "ستحتاج إلى حفظ الأوامر كاملة. ينظم هذا الملف الأدوات ولا يرسم صفحة المتجر."],
    vocabulary: [["script", ["Un raccourci pour une commande à lancer dans le terminal.", "A shortcut for a terminal command.", "اختصار لأمر يُشغّل في الطرفية."]]],
  },
  html: {
    anchor: '<body className=', count: 7,
    why: ["body contient l’interface. La balise a crée un lien : son texte est « Aller au contenu principal » et href indique sa destination. Ici #main-content mène au contenu de la page, pour éviter de parcourir tout le menu au clavier.", "body contains the interface. The a tag creates a link: its text is ‘Aller au contenu principal’ and href gives its destination. Here #main-content leads to the page content so keyboard users can skip the menu.", "يحتوي body الواجهة. ينشئ الوسم a رابطًا، ونصه Aller au contenu principal وتحدد href وجهته. يقود #main-content إلى محتوى الصفحة لتجاوز القائمة باستخدام لوحة المفاتيح."],
    without: ["Sans ce cadre partagé, chaque page devrait reconstruire ses éléments communs. Un changement de menu demanderait plusieurs modifications.", "Without a shared frame, pages would need to rebuild common elements. A menu change could require several edits.", "دون إطار مشترك ستكرر الصفحات العناصر نفسها وقد يحتاج تغيير القائمة إلى تعديلات متعددة."],
    vocabulary: [["JSX", ["Une écriture qui ressemble au HTML, utilisée dans React pour décrire l’interface.", "HTML-like syntax used in React to describe the interface.", "صياغة تشبه HTML يستخدمها React لوصف الواجهة."]]],
  },
  style: {
    anchor: 'return <section className=', count: 3,
    why: ["Les classes Tailwind décrivent l’apparence directement sur l’élément : rounded-3xl arrondit les coins, border ajoute une bordure, bg-white donne un fond blanc.", "Tailwind classes describe appearance on the element: rounded-3xl rounds corners, border adds a border, and bg-white gives a white background.", "تصف أصناف Tailwind المظهر: rounded-3xl لتدوير الزوايا، وborder لإضافة حد، وbg-white لخلفية بيضاء."],
    without: ["Le contenu resterait présent mais sans ces choix visuels. Le CSS change l’apparence ; il ne change pas le prix enregistré d’un produit.", "Content would remain without these visual choices. CSS changes appearance, not a product’s stored price.", "سيبقى المحتوى دون هذه اللمسات البصرية. يغير CSS المظهر وليس سعر المنتج المخزّن."],
    vocabulary: [["className", ["La liste des styles appliqués à un élément React.", "The list of CSS classes applied to a React element.", "قائمة أصناف CSS المطبقة على عنصر React."]]],
  },
  javascript: {
    anchor: 'return Math.max(', count: 6,
    why: ["Cette fonction calcule le total avec la livraison, les frais, les taxes et la réduction. minorUnits travaille en centimes pour limiter les erreurs de calcul ; / 100 revient à l’unité monétaire.", "This function totals shipping, fees, taxes and discounts. minorUnits works in cents to limit rounding errors; / 100 converts back to currency units.", "تحسب الدالة الإجمالي مع الشحن والرسوم والضرائب والخصم. تعمل minorUnits بالسنتيم لتقليل أخطاء الحساب، ثم تعيد / 100 الوحدة النقدية."],
    without: ["Copier ce calcul dans plusieurs pages risque de produire des totaux différents. Math.max(0, …) empêche un total négatif après réduction.", "Duplicating this calculation across pages risks inconsistent totals. Math.max(0, …) prevents a negative discounted total.", "تكرار الحساب في صفحات متعددة قد يعطي إجماليات مختلفة. تمنع Math.max(0, …) إجماليًا سالبًا بعد الخصم."],
    vocabulary: [["?? 0", ["Utilise zéro si la valeur est absente (null ou undefined).", "Use zero when a value is missing (null or undefined).", "استخدم صفرًا عندما تكون القيمة غائبة (null أو undefined)."]]],
  },
  react: {
    anchor: 'export default function CollectionProductCard', count: 6,
    why: ["Une carte produit est un composant React réutilisable. Elle reçoit product en entrée : on réutilise la même présentation avec des noms, images et prix différents.", "A product card is a reusable React component. It receives product as input: the same presentation can show different names, images and prices.", "بطاقة المنتج مكوّن React قابل لإعادة الاستخدام. يستقبل product لعرض التصميم نفسه بأسماء وصور وأسعار مختلفة."],
    without: ["Écrire chaque carte à la main rendrait les corrections lentes et incohérentes. Un composant permet de corriger la présentation une fois pour toutes les cartes.", "Writing every card by hand makes fixes slow and inconsistent. A component lets one change improve every card.", "كتابة كل بطاقة يدويًا تجعل التصحيح بطيئًا وغير متناسق. يسمح المكوّن بتحسين كل البطاقات بتعديل واحد."],
    vocabulary: [["props", ["Les informations données à un composant, comme product ici.", "Information passed into a component, such as product here.", "المعلومات التي تمرر إلى المكوّن مثل product هنا."]]],
  },
  routes: {
    anchor: 'const { slug } = await params;', count: 5,
    why: ["[slug] représente la partie variable de l’adresse. Le code récupère cette valeur pour retrouver le produit et préparer les informations de sa page.", "[slug] is the changing part of the URL. The code reads it to find the product and prepare page information.", "يمثل [slug] الجزء المتغير من الرابط. يقرأه الكود للعثور على المنتج وتجهيز معلومات صفحته."],
    without: ["Il faudrait une page différente par produit. Une route dynamique partage le modèle, tout en gardant une adresse propre à chaque produit.", "You would need a separate page per product. A dynamic route shares the template while giving each product its own URL.", "ستحتاج إلى صفحة منفصلة لكل منتج. يشترك المسار الديناميكي في القالب ويمنح كل منتج رابطًا خاصًا."],
    vocabulary: [["params", ["Les valeurs extraites des parties variables de l’adresse.", "Values taken from the variable parts of a URL.", "القيم المستخرجة من الأجزاء المتغيرة في الرابط."]]],
  },
  api: {
    anchor: 'export async function GET(req: NextRequest)', count: 7,
    why: ["GET est une demande de lecture. Cette route reçoit la demande, lit ses paramètres et prépare une réponse produit. route.ts traite des données ; page.tsx construit une page.", "GET is a read request. This route receives it, reads parameters and prepares product data. route.ts handles data; page.tsx builds a page.", "GET طلب قراءة. يستقبل هذا المسار الطلب ويقرأ معلماته ويجهز بيانات المنتجات. يعالج route.ts البيانات ويبني page.tsx الصفحة."],
    without: ["La page aurait besoin d’un autre moyen de demander ces données au serveur. Une API fournit un contrat : une demande précise, une réponse attendue.", "The page would need another way to request server data. An API provides a contract: a defined request and an expected response.", "ستحتاج الصفحة إلى طريقة أخرى لطلب بيانات الخادم. توفر API اتفاقًا بين طلب محدد واستجابة متوقعة."],
    vocabulary: [["GET", ["Une méthode HTTP utilisée pour demander des informations.", "An HTTP method used to request information.", "طريقة HTTP لطلب المعلومات."]]],
  },
  database: {
    anchor: 'const url = process.env.NEXT_PUBLIC_SUPABASE_URL;', count: 7,
    why: ["Ce code lit la configuration puis prépare la connexion serveur à Supabase. process.env lit une variable d’environnement ; ce n’est pas une donnée produit.", "This code reads configuration and prepares the server connection to Supabase. process.env reads an environment variable, not product data.", "يقرأ الكود الإعدادات ويجهز اتصال الخادم بـSupabase. يقرأ process.env متغير بيئة وليس بيانات منتج."],
    without: ["Sans adresse et clé valides, le serveur ne peut pas utiliser ce client de base de données. La clé de service doit rester côté serveur, jamais dans le navigateur.", "Without a valid URL and key, the server cannot use this database client. The service key must stay on the server, never in the browser.", "دون عنوان ومفتاح صالحين لا يستطيع الخادم استخدام عميل قاعدة البيانات. يجب إبقاء مفتاح الخدمة على الخادم وليس في المتصفح."],
    vocabulary: [["variable d’environnement / environment variable", ["Un réglage fourni au programme, distinct des lignes de code.", "A setting supplied to a program separately from its code.", "إعداد يزوّد به البرنامج بشكل منفصل عن الكود."]]],
  },
  security: {
    anchor: 'async function requireOwner', count: 8,
    why: ["Le serveur vérifie l’identité et le rôle avant d’autoriser l’accès propriétaire. Cette vérification s’exécute même si quelqu’un appelle l’API sans passer par le bouton.", "The server checks identity and role before allowing owner access. This runs even when someone calls the API without using its button.", "يتحقق الخادم من الهوية والدور قبل السماح بوصول المالك، حتى إذا استدعى شخص API دون استخدام الزر."],
    without: ["Cacher un écran ne suffit pas : une personne pourrait appeler son API directement. Les droits se vérifient sur le serveur.", "Hiding a screen is not enough: someone could call its API directly. Permission checks belong on the server.", "إخفاء الشاشة لا يكفي لأن شخصًا قد يستدعي API مباشرة. يجب التحقق من الصلاحيات على الخادم."],
    vocabulary: [["401 / 403", ["401 : identité non validée. 403 : accès refusé.", "401: identity not authenticated. 403: access forbidden.", "401: الهوية غير موثّقة. 403: الوصول ممنوع."]]],
  },
  orders: {
    anchor: 'export async function POST(req: NextRequest)', count: 7,
    why: ["POST envoie une demande qui peut créer une commande. La route doit contrôler cette demande avant d’enregistrer quoi que ce soit : le navigateur n’est pas une source de confiance pour les prix.", "POST sends a request that can create an order. The route must check it before saving anything: the browser is not a trusted source of prices.", "يرسل POST طلبًا قد ينشئ طلب شراء. يجب التحقق منه قبل الحفظ لأن المتصفح ليس مصدرًا موثوقًا للأسعار."],
    without: ["Sans contrôles serveur, des quantités ou montants modifiés dans le navigateur pourraient être acceptés. Observe ce code sans créer de vraie commande.", "Without server checks, edited quantities or prices could be accepted. Study this code without creating a real order.", "دون تحقق الخادم قد تُقبل كميات أو أسعار معدّلة. ادرس الكود دون إنشاء طلب شراء حقيقي."],
    vocabulary: [["POST", ["Une méthode HTTP pour envoyer des données à traiter.", "An HTTP method for sending data to be processed.", "طريقة HTTP لإرسال بيانات للمعالجة."]]],
  },
  payments: {
    anchor: 'if (!(await verifyPayPalWebhook', count: 5,
    why: ["Le webhook est un message envoyé par PayPal au serveur. Ce passage vérifie sa signature avant de lui faire confiance. Une page « paiement réussi » ne prouve pas, seule, qu’un paiement est confirmé.", "A webhook is a message PayPal sends to the server. This code verifies its signature before trusting it. A success page alone does not prove confirmed payment.", "الـwebhook رسالة من PayPal إلى الخادم. يتحقق الكود من توقيعها قبل الوثوق بها. صفحة النجاح وحدها لا تثبت تأكيد الدفع."],
    without: ["Un faux message pourrait être pris pour une confirmation. Ce contrôle rejette une signature invalide avant la suite du traitement.", "A fake message could be mistaken for confirmation. This check rejects an invalid signature before further processing.", "قد تُعتبر رسالة مزورة تأكيدًا. يرفض هذا الفحص التوقيع غير الصالح قبل متابعة المعالجة."],
    vocabulary: [["webhook", ["Une notification entre serveurs lorsqu’un événement se produit.", "A server-to-server notification when an event occurs.", "إشعار بين الخوادم عند وقوع حدث."]]],
  },
  publish: {
    anchor: '"build":', count: 4,
    why: ["Le build prépare le site pour la production ; dev sert au travail local. Le script build de ce projet appelle un programme dans scripts : on peut l’ouvrir pour suivre les étapes.", "Build prepares the site for production; dev is for local work. This project’s build script calls a program in scripts, which you can open to follow the steps.", "يجهز build الموقع للإنتاج، بينما dev للعمل المحلي. يستدعي build هنا برنامجًا في scripts يمكنك فتحه لفهم الخطوات."],
    without: ["Un site qui marche en développement peut encore échouer à la compilation. Vérifier le build aide à repérer ces problèmes avant la publication.", "A site working in development can still fail compilation. Checking the build helps find these problems before publication.", "قد يعمل الموقع محليًا ويفشل عند البناء. يساعد فحص build على اكتشاف المشاكل قبل النشر."],
    vocabulary: [["production", ["La version réellement utilisée par les visiteurs.", "The version real visitors use.", "النسخة التي يستخدمها الزوار فعليًا."]]],
  },
  "whole-shop": {
    anchor: '"main":', count: 7,
    why: ["Le dossier mobile a son propre package.json : l’application utilise Expo et React Native. Le site web utilise Next.js. Les interfaces diffèrent mais elles peuvent appeler les mêmes API de la boutique.", "The mobile folder has its own package.json: the app uses Expo and React Native. The website uses Next.js. Different interfaces can call the same shop APIs.", "لمجلد mobile ملف package.json خاص به: التطبيق يستخدم Expo وReact Native والموقع يستخدم Next.js. يمكن للواجهتين استدعاء API المتجر نفسها."],
    without: ["Confondre les deux projets peut te faire modifier l’application alors que tu regardes le site. Commence par identifier l’écran, son fichier, puis son API et ses données.", "Confusing the projects can lead you to edit the app while viewing the website. Identify the screen, its file, then its API and data.", "الخلط بين المشروعين قد يجعلك تعدّل التطبيق وأنت تشاهد الموقع. حدد الشاشة ثم ملفها ثم API وبياناتها."],
    vocabulary: [["frontend / backend", ["L’interface utilisée par le client / le code serveur qui traite ses demandes.", "The customer-facing interface / server code that processes its requests.", "واجهة العميل / كود الخادم الذي يعالج طلباته."]]],
  },
};

export function findDailyExcerpt(content: string, guide: DailyCodeGuide) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex(line => line.includes(guide.anchor));
  if (start < 0) return null;
  return { start: start + 1, lines: lines.slice(start, start + guide.count) };
}
