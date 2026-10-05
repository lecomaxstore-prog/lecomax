import type { Text } from './types';
export type ClickFlow = { id: string; title: Text; steps: { label: Text; file: string; anchor: string }[] };
export const clickFlows: ClickFlow[] = [
  { id: 'catalog', title: ['Afficher les produits', 'Display products', 'عرض المنتجات'], steps: [
    { label: ['Le serveur demande les produits actifs.', 'The server requests active products.', 'Server كيطلب المنتجات النشطة.'], file: 'app/boutique/page.tsx', anchor: 'await getDbProducts' },
    { label: ['getDbProducts lit les données et les transforme en données de carte.', 'getDbProducts reads data and converts it to card data.', 'getDbProducts كتقرا البيانات وكتوجدها لبطاقات المنتجات.'], file: 'lib/db-server.ts', anchor: 'export async function getDbProducts' },
    { label: ['La page transmet initialProducts à la partie interactive.', 'The page passes initialProducts to the interactive part.', 'Page كتدوز initialProducts للجزء التفاعلي.'], file: 'app/boutique/page.tsx', anchor: 'return <BoutiqueClient' },
    { label: ['Une ProductCard reçoit chaque produit à afficher.', 'A ProductCard receives each product to display.', 'كل ProductCard كتستقبل منتج باش تعرضو.'], file: 'app/boutique/BoutiqueClient.tsx', anchor: '<ProductCard key={product.slug}' },
  ] },
  { id: 'cart', title: ['Ajouter au panier', 'Add to cart', 'زيد للسلة'], steps: [
    { label: ['onClick appelle handleAdd : une fonction répond au clic.', 'onClick calls handleAdd: a function responds to the click.', 'onClick كتعيط لـhandleAdd: Function كتجاوب على الضغط.'], file: 'components/ProductActions.tsx', anchor: 'onClick={(e) => handleAdd(false' },
    { label: ['handleAdd vérifie la taille et la disponibilité avant add.', 'handleAdd checks size and availability before add.', 'handleAdd كتراجع القياس والتوفر قبل ما تستعمل add.'], file: 'components/ProductActions.tsx', anchor: 'const handleAdd =' },
    { label: ['updateItems construit la nouvelle liste. React peut réafficher le panier.', 'updateItems builds the new list. React can render the updated cart.', 'setItems كتوجد اللائحة الجديدة وReact كيعاود يعرض السلة.'], file: 'components/CartContext.tsx', anchor: 'updateItems((prev) => {' },
    { label: ['Après restauration, un effect sauvegarde les articles dans le navigateur.', 'After restoration, an effect saves items in the browser.', 'من بعد الاسترجاع، Effect كيحفظ العناصر فـBrowser باستعمال localStorage.'], file: 'components/CartContext.tsx', anchor: 'if (hydrated) safeLocalStorage' },
    { label: ['La page panier lit le même panier partagé avec useCart.', 'The cart page reads the same shared cart through useCart.', 'صفحة السلة كتقرا نفس البيانات المشتركة باستعمال useCart.'], file: 'app/panier/page.tsx', anchor: 'useCart' },
  ] },
  { id: 'product', title: ['Ouvrir un produit', 'Open a product', 'فتح منتج'], steps: [
    { label: ['Le lien utilise le slug : le nom du produit dans son adresse.', 'The link uses the slug: the product’s name in its address.', 'الرابط كيستعمل slug: الاسم اللي كيميز المنتج فالعنوان.'], file: 'components/ProductCard.tsx', anchor: 'href={`/produit/${product.slug}`}' },
    { label: ['La page dynamique lit le produit correspondant au slug.', 'The dynamic page reads the product matching the slug.', 'الصفحة المتغيرة كتقرا المنتج اللي كيطابق slug.'], file: 'app/produit/[slug]/page.tsx', anchor: 'await getDbProductRaw(slug)' },
    { label: ['ProductActions permet de choisir les options puis d’ajouter au panier.', 'ProductActions lets the visitor choose options and add to cart.', 'ProductActions كيسمح باختيار الخيارات والزيادة للسلة.'], file: 'app/produit/[slug]/page.tsx', anchor: '<ProductActions' },
  ] },
  { id: 'login', title: ['Se connecter', 'Log in', 'تسجيل الدخول'], steps: [
    { label: ['Le formulaire déclenche handleSubmit.', 'The form triggers handleSubmit.', 'Form، يعني النموذج، كيشغل handleSubmit ملي كتصيفطو.'], file: 'app/connexion/page.tsx', anchor: 'onSubmit={handleSubmit}' },
    { label: ['Supabase Auth reçoit email et password pour vérifier le compte.', 'Supabase Auth receives email and password to verify the account.', 'Supabase Auth كيتحقق من الحساب باستعمال email وpassword.'], file: 'app/connexion/page.tsx', anchor: 'supabase.auth.signInWithPassword' },
    { label: ['La fonction examine error avant de poursuivre. Une demande envoyée ne garantit pas une connexion réussie.', 'The function checks error before continuing. Sending a request does not guarantee a successful login.', 'Function كتراجع error قبل ما تكمل. إرسال الطلب ما كيعنيش الدخول نجح.'], file: 'app/connexion/page.tsx', anchor: 'const handleSubmit' },
  ] },
  { id: 'checkout', title: ['Passer au checkout', 'Go to checkout', 'نمشي لإتمام الطلب'], steps: [
    { label: ['Le bouton d’achat appelle handleAdd avec true.', 'The buy button calls handleAdd with true.', 'زر الشراء كيعيط لـhandleAdd بالقيمة true.'], file: 'components/ProductActions.tsx', anchor: 'onClick={() => handleAdd(true)}' },
    { label: ['Après les vérifications et l’ajout, router.push ouvre /checkout.', 'After checks and adding the item, router.push opens /checkout.', 'من بعد التحقق والزيادة، router.push كيفتح /checkout.'], file: 'components/ProductActions.tsx', anchor: 'router.push("/checkout")' },
    { label: ['Checkout affiche le formulaire ; ouvrir cette page ne crée pas encore de commande.', 'Checkout displays the form; opening this page does not yet create an order.', 'Checkout كيعرض النموذج. غير فتح الصفحة ما كينشئش الطلب.'], file: 'app/checkout/page.tsx', anchor: 'export default function CheckoutPage' },
  ] },
  { id: 'order', title: ['Créer la commande', 'Place the order', 'إنشاء الطلب'], steps: [
    { label: ['fetch envoie les données à /api/orders/.', 'fetch sends data to /api/orders/.', 'fetch كيرسل البيانات لـ/api/orders/.'], file: 'app/checkout/page.tsx', anchor: 'fetch("/api/orders/"' },
    { label: ['POST reçoit la demande et vérifie les données sur le serveur.', 'POST receives and validates the data on the server.', 'POST كيستقبل الطلب وكيتحقق من البيانات فـServer.'], file: 'app/api/orders/route.ts', anchor: 'export async function POST' },
    { label: ['create_commerce_order enregistre la commande avec ses règles de stock dans la base.', 'create_commerce_order records the order with its stock rules in the database.', 'create_commerce_order كيسجل الطلب مع قواعد المخزون فـDatabase.'], file: 'app/api/orders/route.ts', anchor: 'supabase.rpc("create_commerce_order"' },
    { label: ['L’administration peut ensuite consulter les commandes.', 'Admin can then inspect orders.', 'الإدارة من بعد تقدر تشوف الطلبات.'], file: 'app/admin/orders/page.tsx', anchor: 'export default' },
  ] },
  { id: 'search', title: ['Rechercher', 'Search', 'نقلب على منتج'], steps: [
    { label: ['Le bouton ouvre SearchOverlay.', 'The button opens SearchOverlay.', 'الزر كيفتح SearchOverlay، نافذة البحث.'], file: 'components/Header.tsx', anchor: 'setSearchOpen(true)' },
    { label: ['L’interface de recherche prépare la demande.', 'The search interface prepares the request.', 'واجهة البحث كتوجد الطلب.'], file: 'components/SearchOverlay.tsx', anchor: 'fetch(' },
    { label: ['GET lit q dans l’adresse et limite sa longueur.', 'GET reads q from the address and bounds its length.', 'GET كتقرا q، كلمة البحث فالعنوان، وكتحد الطول ديالها.'], file: 'app/api/search/route.ts', anchor: 'searchParams.get("q")' },
  ] },
];
