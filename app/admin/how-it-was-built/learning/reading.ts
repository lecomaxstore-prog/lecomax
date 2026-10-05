import type { Text } from './types';

export type ReadingLine = { code: string; explanation: Text };
export type Reading = { file: string; lines: ReadingLine[] };
const shop: Reading = {
  file: 'app/boutique/page.tsx',
  lines: [
    { code: 'import BoutiqueClient from "./BoutiqueClient";', explanation: ['import apporte un outil depuis un autre fichier. Ici, BoutiqueClient sait afficher la boutique. ./ signifie « dans le même dossier ».', 'import brings a tool from another file. BoutiqueClient displays the shop. ./ means “in the same folder”.', 'يجلب import أداة من ملف آخر. يعرض BoutiqueClient المتجر. وتعني ./ المجلد نفسه.'] },
    { code: 'export default async function BoutiquePage() {', explanation: ['function crée une recette nommée BoutiquePage. export default la rend disponible pour Next.js. async permet d’attendre les produits.', 'function defines a recipe called BoutiquePage. export default makes it available to Next.js. async allows it to wait for products.', 'تنشئ function وصفة اسمها BoutiquePage. يتيحها export default لـNext.js وتسمح async بانتظار المنتجات.'] },
    { code: 'const initialProducts = await getDbProducts({ activeOnly: true });', explanation: ['const donne un nom à une valeur : initialProducts. getDbProducts lit les produits. await attend le résultat. activeOnly: true demande uniquement les produits actifs.', 'const names a value: initialProducts. getDbProducts reads products. await waits for the result. activeOnly: true requests active products only.', 'تسمي const القيمة initialProducts. تقرأ getDbProducts المنتجات وتنتظر await النتيجة. يطلب activeOnly: true المنتجات النشطة فقط.'] },
    { code: 'return <BoutiqueClient initialProducts={initialProducts} />;', explanation: ['return indique quoi afficher. On donne les produits à BoutiqueClient. Les accolades { } insèrent une valeur dans l’interface.', 'return says what to display. We pass the products to BoutiqueClient. Braces { } insert a value into the interface.', 'تحدد return ما نعرضه. نمرر المنتجات إلى BoutiqueClient وتدخل الأقواس { } قيمة في الواجهة.'] },
  ],
};
const card: Reading = {
  file: 'components/ProductCard.tsx',
  lines: [
    { code: 'export default function ProductCard({ product, recommendation = false }: { product: CardProduct; recommendation?: boolean }) {', explanation: ['ProductCard est le nom du composant. Il reçoit product. CardProduct décrit les données attendues. recommendation est facultatif ; sa valeur de départ est false (non). Pour commencer, retiens seulement : une carte reçoit un produit.', 'ProductCard is the component name. It receives product. CardProduct describes the expected data. recommendation is optional and defaults to false. For now, remember: one card receives one product.', 'ProductCard اسم المكون. يستقبل product ويصف CardProduct البيانات المتوقعة. recommendation اختياري وقيمته الافتراضية false. تذكر الآن: بطاقة تستقبل منتجا.'] },
    { code: 'const rating = product.rating ?? 0;', explanation: ['On lit la note du produit. ?? 0 utilise zéro si la note est absente. Une autre donnée d’entrée peut donc produire une autre carte.', 'We read the product rating. ?? 0 uses zero if the rating is missing. Different input data can produce a different card.', 'نقرأ تقييم المنتج. تستخدم ?? 0 صفرا عند غياب التقييم. يمكن لبيانات مختلفة أن تنتج بطاقة مختلفة.'] },
    { code: '{product.name}', explanation: ['product.name signifie « le nom de ce produit ». Les accolades affichent sa valeur. Le composant peut ainsi servir à plusieurs produits.', 'product.name means “this product’s name”. Braces display its value. The component can therefore serve many products.', 'تعني product.name اسم هذا المنتج. تعرض الأقواس القيمة، فيمكن استخدام المكون لمنتجات متعددة.'] },
  ],
};
const jsx: Reading = {
  file: 'components/ProductCard.tsx',
  lines: [
    { code: '<h3 title={product.name} className={`${styles.title} line-clamp-2`}>', explanation: ['h3 ouvre un titre. title fournit le texte de son infobulle. className choisit son style. line-clamp-2 limite le texte à deux lignes. styles.title vient du fichier CSS de la carte.', 'h3 opens a heading. title supplies its tooltip. className chooses its style. line-clamp-2 limits text to two lines. styles.title comes from the card’s CSS file.', 'تفتح h3 عنوانا. توفر title نص التلميح وتختار className المظهر. تحد line-clamp-2 النص في سطرين وتأتي styles.title من CSS البطاقة.'] },
    { code: '{product.name}', explanation: ['C’est le texte visible : la valeur du nom du produit. Sans accolades, tu afficherais les mots product.name au lieu de leur valeur.', 'This is the visible text: the product name’s value. Without braces, you would show the words product.name instead of their value.', 'هذا النص الظاهر: قيمة اسم المنتج. دون أقواس يظهر النص product.name بدلا من قيمته.'] },
    { code: '</h3>', explanation: ['Cette balise ferme le titre. Le / signifie « fin de cet élément ». Tout ce qui précède entre les deux balises appartient à ce titre.', 'This tag closes the heading. / means “end of this element”. Everything between the two tags belongs to this heading.', 'يغلق هذا الوسم العنوان. تعني / نهاية العنصر. كل ما بين الوسمين ينتمي لهذا العنوان.'] },
  ],
};
export const readings: Record<string, Reading> = {
  web: shop,
  page: shop,
  component: card,
  props: card,
  jsx,
  style: { file: 'components/ProductCard.tsx', lines: [
    { code: 'flex h-full flex-col overflow-hidden bg-white', explanation: ['Ces classes sont un extrait du className de ProductCard. flex organise les enfants ; flex-col les place en colonne ; h-full prend la hauteur disponible ; overflow-hidden masque ce qui dépasse ; bg-white donne un fond blanc.', 'These classes are an excerpt from ProductCard’s className. flex arranges children; flex-col stacks them; h-full takes available height; overflow-hidden clips overflow; bg-white sets a white background.', 'هذه الفئات مقتطف من className في ProductCard. تنظم flex العناصر وترتبها flex-col عموديا. تأخذ h-full الارتفاع المتاح وتخفي overflow-hidden الزائد وتجعل bg-white الخلفية بيضاء.'] },
  ] },
  'front-back': { file: 'app/api/orders/route.ts', lines: [
    { code: 'export async function POST(req: NextRequest) {', explanation: ['POST reçoit une demande de création. req contient la demande du navigateur. NextRequest décrit son type. Le serveur doit ensuite vérifier les données avant de créer la commande.', 'POST receives a creation request. req contains the browser request. NextRequest describes its type. The server must then validate the data before creating the order.', 'تستقبل POST طلب إنشاء. تحتوي req طلب المتصفح ويصف NextRequest نوعه. يجب أن يتحقق الخادم من البيانات قبل إنشاء الطلب.'] },
  ] },
  project: { file: 'package.json', lines: [
    { code: '"dev": "next dev",', explanation: ['dev est le nom du raccourci. next dev lance le serveur de développement. Pour utiliser ce raccourci dans le terminal, tape npm run dev.', 'dev names a shortcut. next dev starts the development server. Use this shortcut in the terminal by typing npm run dev.', 'dev اسم اختصار. يشغل next dev خادم التطوير. اكتب npm run dev في الطرفية لاستخدام الاختصار.'] },
    { code: '"build": "node scripts/next-build.mjs",', explanation: ['build prépare la version à publier. Ce projet passe par un petit script Node.js. Ce n’est pas la même chose que lancer le site en développement.', 'build prepares the version to publish. This project uses a small Node.js script. This is different from running the development server.', 'يجهز build نسخة النشر. يستخدم المشروع برنامجا صغيرا بـNode.js. هذا يختلف عن تشغيل خادم التطوير.'] },
  ] },
  folders: { file: 'components/Header.tsx', lines: [
    { code: 'import Link from "next/link";', explanation: ['Header est rangé dans components/ car il sert à l’interface. Il utilise Link, un outil fourni par Next.js pour naviguer entre les pages.', 'Header lives in components/ because it is part of the interface. It uses Link, a Next.js tool for navigating between pages.', 'يوجد Header في components/ لأنه جزء من الواجهة. يستخدم Link من Next.js للتنقل بين الصفحات.'] },
  ] },
  layout: { file: 'app/layout.tsx', lines: [
    { code: 'children: React.ReactNode;', explanation: ['children est le contenu reçu par le cadre. React.ReactNode indique qu’il peut contenir une interface React. Ce type aide TypeScript à détecter les mauvaises valeurs.', 'children is the content received by the frame. React.ReactNode says it can contain React UI. This type helps TypeScript detect invalid values.', 'children هو المحتوى الذي يستقبله الإطار. يشير React.ReactNode إلى إمكانية احتوائه واجهة React ويساعد TypeScript في كشف القيم الخاطئة.'] },
    { code: '<main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>', explanation: ['main contient la partie principale de la page. {children} place la page ouverte dans ce cadre. id identifie cette zone ; tabIndex permet de lui donner le focus par programmation.', 'main holds the page’s main content. {children} inserts the current page into the frame. id identifies this area; tabIndex allows programmatic focus.', 'تحتوي main المحتوى الرئيسي. تضع {children} الصفحة داخل الإطار. تحدد id المنطقة وتتيح tabIndex التركيز عليها برمجيا.'] },
  ] },
  state: { file: 'components/CartContext.tsx', lines: [
    { code: 'const [items, setItems] = useState<CartItem[]>([]);', explanation: ['items est la liste actuelle. setItems est la fonction qui la change et demande à React de mettre l’écran à jour. CartItem[] signifie « une liste d’articles ». Le dernier [] est la liste vide de départ.', 'items is the current list. setItems changes it and asks React to update the screen. CartItem[] means a list of cart items. The final [] is the initial empty list.', 'items القائمة الحالية. تغيرها setItems وتطلب من React تحديث الشاشة. تعني CartItem[] قائمة عناصر و[] الأخيرة هي القائمة الفارغة الأولية.'] },
    { code: 'const [hydrated, setHydrated] = useState(false);', explanation: ['Même forme, autre information : ici une valeur oui/non. false signifie non. Le nom de la valeur change, mais la façon d’utiliser useState reste la même.', 'Same pattern, different information: here a yes/no value. false means no. The value’s name changes, but the useState pattern stays the same.', 'النمط نفسه لمعلومة مختلفة: هنا نعم أو لا. false تعني لا. يتغير الاسم لكن طريقة استخدام useState تبقى نفسها.'] },
  ] },
  action: { file: 'app/checkout/page.tsx', lines: [
    { code: 'fetch("/api/orders/",', explanation: ['fetch envoie une demande. /api/orders/ est l’adresse de ton API de commandes. Cet extrait montre seulement le début de l’appel : la méthode et les données sont précisées dans la suite du vrai fichier.', 'fetch sends a request. /api/orders/ is the orders API address. This excerpt shows only the start of the call: the method and data are specified later in the real file.', 'ترسل fetch طلبا إلى API الطلبات /api/orders/. يعرض المقتطف بداية الاستدعاء فقط؛ تحدد الطريقة والبيانات في بقية الملف الحقيقي.'] },
  ] },
};

// The second question checks the lesson's own prediction, not a repeated generic question.
export const predictionIsYes: Record<string, boolean> = {
  web: false, 'front-back': false, project: false, folders: false, page: false,
  layout: true, component: true, jsx: false, style: false, props: true, state: false, action: false,
};
