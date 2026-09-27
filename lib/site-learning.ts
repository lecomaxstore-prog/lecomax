import type { SourceSelection } from "./site-source-inspector";
type Lang = "fr" | "en" | "ar";
type Words = [string, string, string];
const word = (lang: Lang, values: Words) => values[lang === "fr" ? 0 : lang === "en" ? 1 : 2];

export const learningPages = [
  ["/", "Accueil", "app/page.tsx"], ["/boutique", "Boutique", "app/boutique/page.tsx"],
  ["/nouveautes", "Nouveautés", "app/nouveautes/page.tsx"], ["/promotions", "Promotions", "app/promotions/page.tsx"],
  ["/bestsellers", "Bestsellers", "app/bestsellers/page.tsx"], ["/panier", "Panier", "app/panier/page.tsx"],
  ["/wishlist", "Favoris", "app/wishlist/page.tsx"], ["/nous-contacter", "Contact", "app/nous-contacter/page.tsx"],
  ["/a-propos", "À propos", "app/a-propos/page.tsx"], ["/connexion", "Connexion", "app/connexion/page.tsx"],
  ["/inscription", "Inscription", "app/inscription/page.tsx"], ["/guide-des-tailles", "Guide des tailles", "app/guide-des-tailles/page.tsx"],
  ["/retours", "Retours", "app/retours/page.tsx"], ["/suivre-commande", "Suivi de commande", "app/suivre-commande/page.tsx"],
  ["/homme", "Homme", "app/[category]/page.tsx"], ["/femme", "Femme", "app/[category]/page.tsx"],
  ["/chaussures", "Chaussures", "app/[category]/page.tsx"], ["/accessoires", "Accessoires", "app/[category]/page.tsx"],
  ["/checkout", "Commande", "app/checkout/page.tsx"], ["/compte", "Mon compte", "app/compte/page.tsx"],
  ["/ecoclub", "ecoClub", "app/ecoclub/page.tsx"], ["/ecomedia", "Ecomedia", "app/ecomedia/page.tsx"],
  ["/boutiques", "Boutiques", "app/boutiques/page.tsx"], ["/download", "Application", "app/download/page.tsx"],
  ["/carrieres", "Carrières", "app/carrieres/page.tsx"], ["/mot-de-passe", "Mot de passe", "app/mot-de-passe/page.tsx"],
  ["/compte/profil", "Profil", "app/compte/profil/page.tsx"], ["/compte/commandes", "Mes commandes", "app/compte/commandes/page.tsx"],
  ["/compte/adresses", "Mes adresses", "app/compte/adresses/page.tsx"],
  ["/politique-confidentialite", "Confidentialité", "app/politique-confidentialite/page.tsx"],
  ["/conditions-utilisation", "Conditions d’utilisation", "app/conditions-utilisation/page.tsx"],
  ["/conditions", "Conditions", "app/conditions/page.tsx"], ["/cookies", "Cookies", "app/cookies/page.tsx"],
] as const;

export function learningDestination(href?: string) {
  if (!href || !href.startsWith("/") || href.startsWith("//") || /[\\\u0000-\u0020]/.test(href)) return null;
  const pathname = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  const known = learningPages.find(([url]) => url === pathname);
  if (known) return { url: href, file: known[2] as string };
  if (/^\/produit\/[^/]+$/.test(pathname)) return { url: href, file: "app/produit/[slug]/page.tsx" };
  if (/^\/ecomedia\/[^/]+$/.test(pathname)) return { url: href, file: "app/ecomedia/[slug]/page.tsx" };
  return null;
}

export function elementLesson(selection: SourceSelection, lang: Lang) {
  const tag = selection.tag || "section";
  let title: Words, what: Words, why: Words, challenge: Words, answer: Words;
  if (selection.path === "components/HeroBanner.tsx" && tag === "section") {
    title = ["Le hero : la grande bannière", "The hero: the large banner", "البانر الرئيسي"];
    what = ["HeroBanner reçoit les bannières de la page d’accueil. slides contient les images et active choisit la bannière visible. Un useEffect change de bannière toutes les 7 secondes quand le carrousel n’est pas en pause.", "HeroBanner receives the homepage banners. slides holds the images and active chooses the visible banner. A useEffect advances every 7 seconds when the carousel is not paused.", "يستقبل HeroBanner بانرات الصفحة الرئيسية. تحفظ slides الصور وتختار active البانر الظاهر. يبدّل useEffect البانر كل 7 ثوانٍ إذا لم يكن العرض متوقفًا."];
    why = ["Le composant sépare le contenu (images et textes) de son affichage. Tu peux réutiliser la même présentation pour plusieurs bannières sans copier tout le code.", "The component separates content (images and text) from presentation. The same layout can display several banners without copying all the code.", "يفصل المكوّن المحتوى عن طريقة عرضه. يمكن استخدام التصميم نفسه لعدة بانرات دون نسخ الكود كله."];
    challenge = ["Pour choisir la bannière visible, cherches-tu active ou la couleur du texte ?", "To choose the visible banner, do you look at active or text color?", "لاختيار البانر الظاهر، هل تبحث عن active أم لون النص؟"];
    answer = ["active. C’est l’état React qui garde le numéro de la bannière courante. Les classes CSS règlent son apparence.", "active. This React state holds the current banner index. CSS classes control its appearance.", "active. تحتفظ حالة React هذه برقم البانر الحالي، وتتحكم أصناف CSS بمظهره."];
  } else if (tag === "header" || tag === "footer") {
    title = tag === "header" ? ["L’en-tête : retrouver son chemin", "The header: finding your way", "الترويسة: معرفة طريقك"] : ["Le pied de page : les liens utiles", "The footer: useful links", "التذييل: روابط مفيدة"];
    what = ["Cette zone regroupe des éléments partagés entre les pages. Les composants Logo, les liens Link et les textes sont assemblés dans un seul fichier réutilisable.", "This area groups elements shared across pages. Logo components, Link elements and text are assembled in a reusable file.", "تجمع هذه المنطقة عناصر مشتركة بين الصفحات. تُجمع مكونات الشعار والروابط والنصوص في ملف قابل لإعادة الاستخدام."];
    why = ["Un seul composant évite de recopier les mêmes liens sur chaque page. Une modification de ce fichier peut ainsi se retrouver partout où il est utilisé.", "One component avoids copying the same links onto each page. A change to the file can appear everywhere it is used.", "يمنع المكوّن الواحد تكرار الروابط في كل صفحة. قد يظهر تعديل الملف في كل موضع يُستخدم فيه."];
    challenge = ["Faut-il copier le header dans chaque fichier de page ?", "Should you copy the header into every page file?", "هل يجب نسخ الترويسة إلى ملف كل صفحة؟"];
    answer = ["Non. app/layout.tsx assemble les parties partagées. Header et Footer restent dans leurs propres fichiers de composants.", "No. app/layout.tsx assembles shared parts. Header and Footer stay in their own component files.", "لا. يجمع app/layout.tsx الأجزاء المشتركة وتبقى Header وFooter في ملفاتهما الخاصة."];
  } else if (selection.href || tag === "a") {
    title = ["Un lien pour se déplacer", "A link for navigation", "رابط للتنقل"];
    what = ["Cet élément ouvre une autre page. Dans le code, href indique sa destination ; Link est le composant de navigation de Next.js.", "This element opens another page. In code, href gives the destination; Link is Next.js’s navigation component.", "يفتح هذا العنصر صفحة أخرى. تحدد href الوجهة وLink هو مكوّن التنقل في Next.js."];
    why = ["Un vrai lien permet aussi d’ouvrir la page dans un nouvel onglet et de naviguer au clavier.", "A real link also supports opening a new tab and keyboard navigation.", "يدعم الرابط الحقيقي فتح تبويب جديد والتنقل بلوحة المفاتيح."];
    challenge = ["Si tu changes seulement href, est-ce le texte du lien ou sa destination qui change ?", "If you change only href, does the label or the destination change?", "إذا غيّرت href فقط، هل يتغير النص أم الوجهة؟"];
    answer = ["La destination. Le texte visible est écrit entre les balises, ou vient d’une variable.", "The destination. Visible text sits between tags or comes from a variable.", "الوجهة. يُكتب النص الظاهر بين الوسوم أو يأتي من متغير."];
  } else if (["img", "svg", "picture"].includes(tag)) {
    title = ["Une image ou une icône", "An image or icon", "صورة أو أيقونة"];
    what = ["img ou Image affiche une image depuis src. svg dessine une icône avec des formes. Regarde la balise sélectionnée pour distinguer les deux.", "img or Image loads an image from src. svg draws an icon with shapes. Check the selected tag to distinguish them.", "يعرض img أو Image صورة من src، ويرسم svg أيقونة بأشكال. راجع الوسم المحدد لتمييزهما."];
    why = ["Les images montrent le produit ; les icônes aident à reconnaître une action. alt décrit une image quand elle n’est pas visible.", "Images show products; icons help identify actions. alt describes an image when it cannot be seen.", "تعرض الصور المنتجات وتوضح الأيقونات الإجراءات. تصف alt الصورة عند تعذر رؤيتها."];
    challenge = ["Une image plus grande change-t-elle automatiquement le prix du produit ?", "Does a larger image automatically change the product price?", "هل تكبير الصورة يغيّر سعر المنتج تلقائيًا؟"];
    answer = ["Non. L’apparence et les données du produit sont deux choses distinctes.", "No. Appearance and product data are separate concerns.", "لا. المظهر وبيانات المنتج شيئان منفصلان."];
  } else if (["button", "input", "select", "textarea", "form", "label"].includes(tag)) {
    title = ["Une interaction avec le visiteur", "An interaction with the visitor", "تفاعل مع الزائر"];
    what = ["Un champ reçoit une valeur ; un bouton déclenche une action. Repère value, onChange, onClick ou onSubmit dans ce bloc et les fonctions qu’ils utilisent.", "A field receives a value; a button triggers an action. Find value, onChange, onClick or onSubmit in this block and the functions they use.", "يستقبل الحقل قيمة ويشغّل الزر إجراءً. ابحث عن value وonChange وonClick وonSubmit والدوال المرتبطة بها."];
    why = ["React relie ce que la personne fait à l’état de l’interface. Un label ou aria-label donne un nom compréhensible au contrôle.", "React connects the person’s action to interface state. A label or aria-label gives the control an understandable name.", "يربط React إجراء الزائر بحالة الواجهة. يعطي label أو aria-label اسمًا مفهومًا للعنصر."];
    challenge = ["Changer la couleur d’un bouton change-t-il aussi la fonction appelée au clic ?", "Does changing a button’s color also change the function called on click?", "هل تغيير لون الزر يغيّر الدالة التي تُستدعى عند النقر؟"];
    answer = ["Non. className règle l’apparence ; onClick indique l’action. Cherche les deux dans le fichier.", "No. className controls appearance; onClick identifies the action. Find both in the file.", "لا. تتحكم className بالمظهر وتحدد onClick الإجراء. ابحث عنهما في الملف."];
  } else {
    title = ["Un morceau de la page", "A piece of the page", "جزء من الصفحة"];
    what = ["Les balises organisent ce que tu vois : titres, textes, sections et cartes. Les accolades {…} insèrent des valeurs JavaScript dans cette structure.", "Tags organize what you see: headings, text, sections and cards. Braces {…} insert JavaScript values into that structure.", "تنظّم الوسوم العناوين والنصوص والأقسام والبطاقات. تُدرج الأقواس {…} قيم JavaScript ضمن هذا الهيكل."];
    why = ["Séparer la structure, les données et les styles rend la page plus facile à modifier. className choisit les styles ; les composants permettent de réutiliser une partie du site.", "Separating structure, data and styles makes the page easier to change. className selects styles; components make parts of the site reusable.", "يسهّل فصل الهيكل والبيانات والأنماط تعديل الصفحة. تختار className الأنماط وتتيح المكونات إعادة استخدام أجزاء الموقع."];
    challenge = ["Pour changer l’espace autour de cet élément, cherches-tu className ou le prix du produit ?", "To change the space around this element, do you look at className or the product price?", "لتغيير المسافة حول العنصر، هل تبحث في className أم سعر المنتج؟"];
    answer = ["className. Les classes p-… ajoutent un espace intérieur ; m-… un espace extérieur ; gap-… un espace entre les enfants.", "className. p-… adds inner spacing; m-… adds outer spacing; gap-… adds space between children.", "className. تضيف p-… مسافة داخلية وm-… مسافة خارجية وgap-… مسافة بين العناصر."];
  }
  return { title: word(lang, title), what: word(lang, what), why: word(lang, why), challenge: word(lang, challenge), answer: word(lang, answer) };
}
