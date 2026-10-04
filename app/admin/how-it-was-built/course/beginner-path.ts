import type { CourseLanguage } from './types';

export type Words = readonly [string, string, string];
export const words = (value: Words, lang: CourseLanguage) => value[lang === 'fr' ? 0 : lang === 'en' ? 1 : 2];
export type StarterLesson = {
  id: string; title: Words; goal: Words; idea: Words; analogy: Words;
  experiment: 'text' | 'style' | 'quantity' | 'request' | 'route';
  task: Words; observe: Words; code: string; lines: Words[];
  question: Words; options: Words[]; correct: number; feedback: Words;
  term: string; definition: Words; file: string; next: string;
};

export const STARTER_LESSONS: StarterLesson[] = [
  {
    id: 'web', title: ['Comprendre un site', 'Understand a website', 'فهم الموقع'],
    goal: ['Expliquer la différence entre navigateur et serveur.', 'Explain the difference between a browser and a server.', 'شرح الفرق بين المتصفح والخادم.'],
    idea: ['Ton navigateur affiche le site. Le serveur reçoit les demandes et renvoie une réponse. Une base de données garde les informations qui doivent durer, comme les produits et les commandes.', 'Your browser displays the site. A server receives requests and sends responses. A database keeps information that must last, such as products and orders.', 'يعرض المتصفح الموقع. يستقبل الخادم الطلبات ويرسل الردود. تحفظ قاعدة البيانات المعلومات الدائمة مثل المنتجات والطلبات.'],
    analogy: ['Imagine une boutique : la vitrine est ce que le client voit ; le personnel vérifie sa demande ; le registre garde les commandes.', 'Imagine a shop: the window is what the customer sees; staff check their request; a ledger keeps the orders.', 'تخيل متجرًا: الواجهة ما يراه العميل، والموظف يتحقق من طلبه، والسجل يحفظ الطلبات.'],
    experiment: 'request', task: ['Envoie une demande, puis essaie le cas « serveur indisponible ».', 'Send a request, then try “server unavailable”.', 'أرسل طلبًا ثم جرب حالة «الخادم غير متاح».'],
    observe: ['L’écran doit expliquer ce qui se passe : attente, réponse ou erreur. Une erreur ne signifie pas que la demande a réussi.', 'The screen should explain what happens: waiting, a response, or an error. An error does not mean the request succeeded.', 'يجب أن توضح الشاشة ما يحدث: انتظار أو رد أو خطأ. الخطأ لا يعني نجاح الطلب.'],
    code: 'const response = await fetch("/api/products");\nif (!response.ok) throw new Error("Request failed");\nconst products = await response.json();',
    lines: [['fetch envoie une demande à cette adresse.', 'fetch sends a request to this address.', 'ترسل fetch طلبًا إلى هذا العنوان.'], ['On vérifie le statut avant de lire les données.', 'Check the status before reading the data.', 'نتحقق من الحالة قبل قراءة البيانات.'], ['json lit les données structurées de la réponse.', 'json reads the structured response data.', 'تقرأ json البيانات المنظمة في الرد.']],
    question: ['Qui affiche la page pour le client ?', 'What displays the page for the customer?', 'من يعرض الصفحة للعميل؟'],
    options: [['Le navigateur', 'The browser', 'المتصفح'], ['GitHub', 'GitHub', 'GitHub'], ['La base de données', 'The database', 'قاعدة البيانات']], correct: 0,
    feedback: ['Le navigateur affiche l’interface. Le serveur traite les demandes ; la base conserve les données.', 'The browser displays the interface. The server handles requests; the database stores data.', 'يعرض المتصفح الواجهة، ويعالج الخادم الطلبات، وتحفظ القاعدة البيانات.'],
    term: 'Frontend / Backend', definition: ['Frontend : interface visible. Backend : traitement sur le serveur.', 'Frontend: the visible interface. Backend: processing on the server.', 'Frontend: الواجهة المرئية. Backend: المعالجة على الخادم.'], file: 'app/page.tsx', next: 'site',
  },
  {
    id: 'html', title: ['Écrire ce que l’on voit', 'Write what people see', 'كتابة ما يراه المستخدم'],
    goal: ['Reconnaître un titre et un paragraphe dans le code.', 'Recognize a heading and a paragraph in code.', 'التعرف على عنوان وفقرة في الكود.'],
    idea: ['HTML donne une structure au contenu. Un titre h1 annonce le sujet principal ; un paragraphe p contient du texte. Dans React, on écrit une syntaxe proche appelée JSX.', 'HTML gives content a structure. An h1 heading introduces the main subject; a p paragraph contains text. React uses similar syntax called JSX.', 'تحدد HTML بنية المحتوى. يعلن h1 العنوان الرئيسي وتحتوي p على نص. يستخدم React صيغة مشابهة تسمى JSX.'],
    analogy: ['Comme un document : titre, paragraphes et sections ont chacun leur rôle.', 'Like a document: headings, paragraphs and sections each have a role.', 'مثل مستند: لكل عنوان وفقرة وقسم دوره.'],
    experiment: 'text', task: ['Remplace le titre par le nom de ta boutique. Regarde le résultat et le code ensemble.', 'Replace the title with your shop name. Look at the result and code together.', 'استبدل العنوان باسم متجرك وشاهد النتيجة والكود معًا.'],
    observe: ['Le texte change, mais son rôle de titre reste le même. Les balises entourent le contenu.', 'The text changes, but it is still a heading. Tags surround the content.', 'يتغير النص ويظل عنوانًا. تحيط الوسوم بالمحتوى.'],
    code: '<h1>My shop</h1>\n<p>Welcome to my shop.</p>',
    lines: [['h1 ouvre le titre ; /h1 le ferme.', 'h1 opens the heading; /h1 closes it.', 'يفتح h1 العنوان ويغلقه /h1.'], ['p ouvre un paragraphe de texte.', 'p opens a text paragraph.', 'تفتح p فقرة نصية.']],
    question: ['Quelle balise représente le titre principal ?', 'Which tag represents the main heading?', 'أي وسم يمثل العنوان الرئيسي؟'],
    options: [['p', 'p', 'p'], ['h1', 'h1', 'h1'], ['button', 'button', 'button']], correct: 1,
    feedback: ['h1 décrit le titre principal. p décrit un paragraphe et button une action.', 'h1 describes the main heading. p describes a paragraph and button an action.', 'يمثل h1 العنوان الرئيسي وp فقرة وbutton إجراءً.'],
    term: 'JSX', definition: ['Une façon d’écrire une interface dans un fichier JavaScript ou TypeScript.', 'A way to write an interface in a JavaScript or TypeScript file.', 'طريقة لكتابة واجهة داخل ملف JavaScript أو TypeScript.'], file: 'app/page.tsx', next: 'academy',
  },
  {
    id: 'css', title: ['Donner du style', 'Add visual style', 'إضافة التنسيق'],
    goal: ['Distinguer le contenu de son apparence.', 'Separate content from its appearance.', 'تمييز المحتوى عن مظهره.'],
    idea: ['CSS règle les couleurs, les espaces et les tailles. Le même contenu peut avoir plusieurs apparences. Dans ce projet, Tailwind propose aussi des classes pour appliquer ces styles.', 'CSS controls colors, spacing and sizes. The same content can have different appearances. This project also uses Tailwind classes to apply styles.', 'تتحكم CSS في الألوان والمسافات والأحجام. يمكن أن يظهر المحتوى نفسه بأشكال مختلفة. يستخدم هذا المشروع أيضًا فئات Tailwind للتنسيق.'],
    analogy: ['HTML est la structure d’une boutique ; CSS est sa décoration et l’espace entre ses rayons.', 'HTML is the shop structure; CSS is its decoration and the space between its shelves.', 'HTML هي بنية المتجر وCSS هي الزينة والمسافات بين الرفوف.'],
    experiment: 'style', task: ['Change la couleur puis l’espace intérieur de la carte.', 'Change the color, then the space inside the card.', 'غير اللون ثم المسافة داخل البطاقة.'],
    observe: ['Le produit reste identique ; sa présentation change. L’espace intérieur s’appelle padding.', 'The product stays the same; its presentation changes. The space inside is called padding.', 'يبقى المنتج نفسه ويتغير مظهره. تسمى المسافة الداخلية padding.'],
    code: '.card {\n  background: #ecfdf5;\n  padding: 24px;\n}',
    lines: [['Cette règle cible les éléments de classe card.', 'This rule targets elements with the card class.', 'تستهدف هذه القاعدة عناصر الفئة card.'], ['background choisit la couleur du fond.', 'background chooses the background color.', 'تحدد background لون الخلفية.'], ['padding ajoute de l’espace à l’intérieur.', 'padding adds space inside.', 'تضيف padding مساحة داخلية.'], ['L’accolade ferme la règle.', 'The brace closes the rule.', 'يغلق القوس القاعدة.']],
    question: ['Que change padding ?', 'What does padding change?', 'ماذا تغير padding؟'],
    options: [['Le prix', 'The price', 'السعر'], ['La base de données', 'The database', 'قاعدة البيانات'], ['L’espace intérieur', 'The inside spacing', 'المسافة الداخلية']], correct: 2,
    feedback: ['padding change la présentation, pas les données du produit.', 'padding changes presentation, not product data.', 'تغير padding العرض ولا تغير بيانات المنتج.'],
    term: 'Responsive', definition: ['Une mise en page qui s’adapte à la largeur de l’écran.', 'A layout that adapts to screen width.', 'تصميم يتكيف مع عرض الشاشة.'], file: 'app/globals.css', next: 'academy',
  },
  {
    id: 'javascript', title: ['Faire un calcul', 'Make a calculation', 'إجراء حساب'],
    goal: ['Comprendre une variable et un calcul simple.', 'Understand a variable and a simple calculation.', 'فهم متغير وحساب بسيط.'],
    idea: ['JavaScript permet au programme de calculer et de réagir. Une variable donne un nom à une valeur. Ici, le total est le prix multiplié par la quantité.', 'JavaScript lets a program calculate and react. A variable names a value. Here, the total is the price multiplied by the quantity.', 'تمكن JavaScript البرنامج من الحساب والتفاعل. يعطي المتغير اسمًا لقيمة. هنا يساوي المجموع السعر مضروبًا في الكمية.'],
    analogy: ['Une variable est une boîte avec une étiquette : « prix », « quantité », « total ».', 'A variable is a labeled box: “price”, “quantity”, “total”.', 'المتغير صندوق عليه اسم مثل «السعر» و«الكمية» و«المجموع».'],
    experiment: 'quantity', task: ['Choisis une quantité de 3. Prédis le total avant de regarder le résultat.', 'Choose a quantity of 3. Predict the total before looking at the result.', 'اختر كمية 3 وتوقع المجموع قبل النظر إلى النتيجة.'],
    observe: ['100 × 3 donne 300 MAD. Ce calcul est une démonstration ; une vraie commande doit revérifier le prix sur le serveur.', '100 × 3 gives 300 MAD. This is a demo calculation; a real order must recheck the price on the server.', '100 × 3 يساوي 300 درهم. هذا حساب تجريبي ويجب إعادة التحقق من سعر الطلب الحقيقي على الخادم.'],
    code: 'const price = 100;\nconst quantity = 3;\nconst total = price * quantity;',
    lines: [['price nomme la valeur 100.', 'price names the value 100.', 'تسمي price القيمة 100.'], ['quantity nomme le nombre d’articles.', 'quantity names the number of items.', 'تسمي quantity عدد العناصر.'], ['* multiplie les deux valeurs.', '* multiplies the two values.', 'تضرب * القيمتين.']],
    question: ['Pour 2 articles à 100 MAD, quel est le total ?', 'For 2 items at 100 MAD, what is the total?', 'ما مجموع قطعتين بسعر 100 درهم؟'],
    options: [['102 MAD', '102 MAD', '102 درهم'], ['200 MAD', '200 MAD', '200 درهم'], ['100 MAD', '100 MAD', '100 درهم']], correct: 1,
    feedback: ['Le signe * multiplie : 100 × 2 = 200. Une quantité change le total.', '* means multiply: 100 × 2 = 200. Quantity changes the total.', 'تعني * الضرب: 100 × 2 = 200. تغير الكمية المجموع.'],
    term: 'const', definition: ['Déclare un nom dont on ne réaffecte pas la valeur.', 'Declares a name whose value cannot be reassigned.', 'تعلن اسمًا لا يمكن إعادة إسناد قيمته.'], file: 'components/ProductCard.tsx', next: 'academy',
  },
  {
    id: 'react', title: ['Réutiliser une carte produit', 'Reuse a product card', 'إعادة استخدام بطاقة المنتج'],
    goal: ['Expliquer ce qu’est un composant React.', 'Explain what a React component is.', 'شرح معنى مكون React.'],
    idea: ['Un composant est une pièce d’interface que l’on peut réutiliser. Les props sont les informations qu’on lui transmet. La même carte peut afficher plusieurs produits avec des noms différents.', 'A component is a reusable piece of interface. Props are the information passed to it. The same card can display different products with different names.', 'المكون جزء واجهة قابل لإعادة الاستخدام. Props هي المعلومات التي نمررها إليه. تعرض البطاقة نفسها منتجات بأسماء مختلفة.'],
    analogy: ['Comme un modèle d’étiquette : tu gardes le modèle et changes le nom du produit.', 'Like a label template: keep the template and change the product name.', 'مثل قالب ملصق: تحتفظ بالقالب وتغير اسم المنتج.'],
    experiment: 'text', task: ['Change le nom du produit. La forme de la carte doit rester la même.', 'Change the product name. The card structure should stay the same.', 'غير اسم المنتج. يجب أن تبقى بنية البطاقة نفسها.'],
    observe: ['Le nom est une donnée. Le composant décide où cette donnée apparaît.', 'The name is data. The component decides where that data appears.', 'الاسم بيانات ويحدد المكون مكان ظهورها.'],
    code: 'function ProductCard({ name }: { name: string }) {\n  return <h2>{name}</h2>;\n}\n<ProductCard name="My product" />',
    lines: [['Le composant reçoit une prop name de type texte.', 'The component receives a text prop called name.', 'يتلقى المكون خاصية نصية اسمها name.'], ['Les accolades affichent la valeur de name.', 'The braces display the value of name.', 'تعرض الأقواس قيمة name.'], ['La fonction se termine ici.', 'The function ends here.', 'تنتهي الدالة هنا.'], ['On utilise le composant avec un nom de produit.', 'Use the component with a product name.', 'نستخدم المكون مع اسم منتج.']],
    question: ['Pourquoi réutiliser un composant ?', 'Why reuse a component?', 'لماذا نعيد استخدام مكون؟'],
    options: [['Pour garder la même présentation avec des données différentes', 'To keep the same presentation with different data', 'للحفاظ على العرض نفسه مع بيانات مختلفة'], ['Pour supprimer la base de données', 'To remove the database', 'لحذف قاعدة البيانات'], ['Pour cacher tous les textes', 'To hide all text', 'لإخفاء كل النصوص']], correct: 0,
    feedback: ['Un composant évite de recopier la même interface. Les props changent les données qu’il affiche.', 'A component avoids duplicating the same interface. Props change the data it displays.', 'يمنع المكون تكرار الواجهة نفسها وتغير Props البيانات المعروضة.'],
    term: 'Props', definition: ['Informations transmises à un composant par celui qui l’utilise.', 'Information passed to a component by its caller.', 'معلومات يمررها مستخدم المكون إليه.'], file: 'components/ProductCard.tsx', next: 'files',
  },
  {
    id: 'state', title: ['Réagir à un clic', 'React to a click', 'الاستجابة للنقر'],
    goal: ['Comprendre comment un écran se met à jour.', 'Understand how a screen updates.', 'فهم كيفية تحديث الشاشة.'],
    idea: ['Un état (state) est une valeur que React garde entre les affichages. Quand on la met à jour avec sa fonction setter, React peut afficher le nouveau résultat.', 'State is a value React keeps between renders. Updating it with its setter lets React display the new result.', 'State قيمة يحتفظ بها React بين عمليات العرض. تحديثها بدالة التحديث يسمح بعرض النتيجة الجديدة.'],
    analogy: ['Comme un compteur : le bouton change le nombre mémorisé, puis l’écran montre ce nombre.', 'Like a counter: the button changes the stored number, then the screen shows it.', 'مثل عداد: يغير الزر الرقم المحفوظ ثم تعرضه الشاشة.'],
    experiment: 'quantity', task: ['Appuie sur + deux fois puis sur − une fois. Observe le nombre et le total.', 'Press + twice, then − once. Watch the quantity and total.', 'اضغط + مرتين ثم − مرة وشاهد الكمية والمجموع.'],
    observe: ['Les deux résultats utilisent la même quantité. On ne modifie pas directement le HTML : on change l’état.', 'Both results use the same quantity. We update state rather than manually editing the HTML.', 'تستخدم النتيجتان الكمية نفسها. نحدث الحالة بدل تعديل HTML يدويًا.'],
    code: 'const [quantity, setQuantity] = useState(1);\n<button onClick={() => setQuantity(q => q + 1)}>+</button>\n<p>{quantity}</p>',
    lines: [['quantity démarre à 1 ; setQuantity permet de la changer.', 'quantity starts at 1; setQuantity changes it.', 'تبدأ quantity بـ1 وتغيرها setQuantity.'], ['Au clic, on ajoute 1 à la valeur précédente.', 'On click, add 1 to the previous value.', 'عند النقر نضيف 1 إلى القيمة السابقة.'], ['React affiche la quantité actuelle.', 'React displays the current quantity.', 'يعرض React الكمية الحالية.']],
    question: ['Que fait setQuantity ?', 'What does setQuantity do?', 'ماذا تفعل setQuantity؟'],
    options: [['Publie le site', 'Publishes the site', 'تنشر الموقع'], ['Supprime le produit', 'Deletes the product', 'تحذف المنتج'], ['Met à jour la quantité affichée', 'Updates the displayed quantity', 'تحدث الكمية المعروضة']], correct: 2,
    feedback: ['Le setter met à jour l’état du composant. Ce changement n’enregistre pas automatiquement une commande en base.', 'The setter updates component state. It does not automatically save an order to the database.', 'تحدث الدالة حالة المكون ولا تحفظ طلبًا في قاعدة البيانات تلقائيًا.'],
    term: 'useState', definition: ['Un outil React pour mémoriser une valeur et mettre l’interface à jour.', 'A React tool to remember a value and update the interface.', 'أداة React لحفظ قيمة وتحديث الواجهة.'], file: 'components/ProductActions.tsx', next: 'academy',
  },
  {
    id: 'next', title: ['Trouver la page dans le code', 'Find a page in the code', 'العثور على الصفحة في الكود'],
    goal: ['Relier une adresse à un fichier Next.js.', 'Connect an address to a Next.js file.', 'ربط عنوان بملف Next.js.'],
    idea: ['Ce projet utilise l’App Router de Next.js. Dans app, un fichier page.tsx crée une page. Le nom du dossier donne le chemin dans l’adresse. layout.tsx fournit un cadre partagé.', 'This project uses the Next.js App Router. A page.tsx file inside app creates a page. Folder names provide the address path. layout.tsx provides a shared layout.', 'يستخدم المشروع App Router من Next.js. ينشئ page.tsx داخل app صفحة. تحدد أسماء المجلدات مسار العنوان ويوفر layout.tsx إطارًا مشتركًا.'],
    analogy: ['Le dossier est une rue ; page.tsx est la porte qui permet d’entrer.', 'The folder is a street; page.tsx is the door that lets you enter.', 'المجلد شارع وpage.tsx الباب الذي يسمح بالدخول.'],
    experiment: 'route', task: ['Choisis la boutique puis l’accueil. Compare les adresses et les fichiers.', 'Choose the shop, then home. Compare addresses and files.', 'اختر المتجر ثم الرئيسية وقارن العناوين والملفات.'],
    observe: ['app/boutique/page.tsx correspond à /boutique. app/page.tsx correspond à /.', 'app/boutique/page.tsx maps to /boutique. app/page.tsx maps to /.', 'يقابل app/boutique/page.tsx العنوان /boutique ويقابل app/page.tsx العنوان /.'],
    code: '// app/boutique/page.tsx\nexport default function ShopPage() {\n  return <h1>Shop</h1>;\n}',
    lines: [['Le commentaire indique l’emplacement du fichier.', 'The comment gives the file location.', 'يبين التعليق مكان الملف.'], ['La page exporte son composant principal.', 'The page exports its main component.', 'تصدر الصفحة مكونها الرئيسي.'], ['La page affiche un titre.', 'The page displays a heading.', 'تعرض الصفحة عنوانًا.'], ['La fonction se termine.', 'The function ends.', 'تنتهي الدالة.']],
    question: ['Quel fichier correspond à /boutique ?', 'Which file maps to /boutique?', 'أي ملف يقابل /boutique؟'],
    options: [['app/boutique/page.tsx', 'app/boutique/page.tsx', 'app/boutique/page.tsx'], ['app/layout.tsx', 'app/layout.tsx', 'app/layout.tsx'], ['package.json', 'package.json', 'package.json']], correct: 0,
    feedback: ['Le dossier boutique donne le chemin ; page.tsx définit le contenu de la page.', 'The boutique folder provides the path; page.tsx defines the page content.', 'يحدد مجلد boutique المسار ويحدد page.tsx محتوى الصفحة.'],
    term: 'Route', definition: ['Le chemin d’une page ou d’un point d’accès dans une adresse.', 'The path to a page or an endpoint in an address.', 'مسار صفحة أو نقطة وصول داخل عنوان.'], file: 'app/boutique/page.tsx', next: 'files',
  },
  {
    id: 'api', title: ['Demander des données', 'Request data', 'طلب البيانات'],
    goal: ['Expliquer une API sans jargon.', 'Explain an API without jargon.', 'شرح API ببساطة.'],
    idea: ['Une API est un point d’accès pour les programmes. Le navigateur demande les produits ; le serveur vérifie la demande puis renvoie une réponse. Il faut prévoir le chargement et les erreurs.', 'An API is an access point for programs. The browser requests products; the server checks the request and sends a response. Plan for loading and errors.', 'API نقطة وصول للبرامج. يطلب المتصفح المنتجات ويتحقق الخادم من الطلب ويرسل الرد. يجب توقع التحميل والأخطاء.'],
    analogy: ['Comme commander au comptoir : tu fais une demande précise et attends une réponse.', 'Like ordering at a counter: make a specific request and wait for a response.', 'مثل الطلب عند المنضدة: تقدم طلبًا محددًا وتنتظر الرد.'],
    experiment: 'request', task: ['Teste une réponse réussie puis une erreur. Relance ensuite une demande réussie.', 'Test a successful response and an error. Then retry a successful request.', 'اختبر ردًا ناجحًا ثم خطأ ثم أعد طلبًا ناجحًا.'],
    observe: ['Une erreur est un état à expliquer au client. On peut proposer de réessayer sans afficher une fausse réussite.', 'An error is a state to explain to the customer. Offer a retry without showing false success.', 'الخطأ حالة نشرحها للعميل ونسمح بإعادة المحاولة دون عرض نجاح غير حقيقي.'],
    code: 'export async function GET() {\n  return Response.json({ message: "Hello" });\n}',
    lines: [['GET répond à une demande de lecture.', 'GET handles a read request.', 'تستجيب GET لطلب قراءة.'], ['On renvoie un objet sous forme JSON.', 'Return an object as JSON.', 'نرسل كائنًا بصيغة JSON.'], ['La fonction se termine.', 'The function ends.', 'تنتهي الدالة.']],
    question: ['Si le serveur ne répond pas, que faut-il afficher ?', 'If the server does not respond, what should appear?', 'ماذا نعرض إذا لم يستجب الخادم؟'],
    options: [['Une réussite inventée', 'An invented success', 'نجاح وهمي'], ['Une erreur claire et une possibilité de réessayer', 'A clear error and a way to retry', 'خطأ واضح وطريقة لإعادة المحاولة'], ['Un prix aléatoire', 'A random price', 'سعر عشوائي']], correct: 1,
    feedback: ['L’interface doit refléter le résultat réel de la demande. Un message clair aide à comprendre et à réessayer.', 'The interface should reflect the actual request result. Clear feedback helps people understand and retry.', 'يجب أن تعكس الواجهة النتيجة الفعلية. تساعد الرسالة الواضحة على الفهم وإعادة المحاولة.'],
    term: 'JSON', definition: ['Un format texte structuré pour échanger des données entre programmes.', 'A structured text format for exchanging data between programs.', 'صيغة نص منظمة لتبادل البيانات بين البرامج.'], file: 'app/api/products/route.ts', next: 'arch',
  },
  {
    id: 'data', title: ['Garder les informations', 'Keep information', 'حفظ المعلومات'],
    goal: ['Distinguer l’état de l’écran des données durables.', 'Distinguish screen state from lasting data.', 'تمييز حالة الشاشة عن البيانات الدائمة.'],
    idea: ['Une base de données conserve des informations organisées en tables. Une ligne représente un élément, une colonne un détail. Supabase fournit notamment la base PostgreSQL de ce projet. L’accès doit respecter des permissions.', 'A database keeps information organized in tables. A row represents an item; a column represents a detail. Supabase provides this project’s PostgreSQL database. Access must follow permissions.', 'تحفظ القاعدة المعلومات في جداول. يمثل الصف عنصرًا والعمود تفصيلًا. يوفر Supabase قاعدة PostgreSQL للمشروع ويجب أن يخضع الوصول للصلاحيات.'],
    analogy: ['Comme un tableau de stock : chaque ligne est un produit, chaque colonne son nom, prix ou stock.', 'Like a stock ledger: each row is a product; columns hold its name, price or stock.', 'مثل جدول المخزون: كل صف منتج والأعمدة اسمه وسعره ومخزونه.'],
    experiment: 'quantity', task: ['Change la quantité. Cela ne crée aucune commande : c’est seulement la mémoire de cette démonstration.', 'Change the quantity. This creates no order: it only changes this demo’s memory.', 'غير الكمية. لا ينشئ ذلك طلبًا بل يغير ذاكرة المثال فقط.'],
    observe: ['Une valeur sur l’écran n’est pas forcément enregistrée en base. Une vraie sauvegarde nécessite une demande autorisée.', 'A value on screen is not necessarily saved to a database. Real saving needs an authorized request.', 'القيمة المعروضة ليست بالضرورة محفوظة في القاعدة. يتطلب الحفظ الفعلي طلبًا مصرحًا به.'],
    code: '// Example table: products\n// id | name       | price\n// 1  | My product | 100',
    lines: [['products est le nom de la table d’exemple.', 'products is the example table name.', 'products اسم جدول المثال.'], ['id, name et price sont des colonnes.', 'id, name and price are columns.', 'id وname وprice أعمدة.'], ['Cette ligne représente un produit.', 'This row represents one product.', 'يمثل هذا الصف منتجًا واحدًا.']],
    question: ['Où doit être gardée une commande durable ?', 'Where should a lasting order be stored?', 'أين نحفظ طلبًا دائمًا؟'],
    options: [['Seulement dans la couleur du bouton', 'Only in the button color', 'في لون الزر فقط'], ['Seulement dans un compteur React', 'Only in a React counter', 'في عداد React فقط'], ['Dans la base après validation du serveur', 'In the database after server validation', 'في القاعدة بعد تحقق الخادم']], correct: 2,
    feedback: ['Le serveur valide la commande et ses permissions avant la sauvegarde. Le compteur React représente seulement l’état de l’interface.', 'The server validates the order and permissions before saving. The React counter only represents interface state.', 'يتحقق الخادم من الطلب والصلاحيات قبل الحفظ. يمثل عداد React حالة الواجهة فقط.'],
    term: 'RLS', definition: ['Des règles qui déterminent quelles lignes de données un utilisateur peut lire ou modifier.', 'Rules determining which data rows a user can read or change.', 'قواعد تحدد صفوف البيانات التي يمكن للمستخدم قراءتها أو تغييرها.'], file: 'lib/supabase-server.ts', next: 'supabase',
  },
  {
    id: 'publish', title: ['Publier et continuer à apprendre', 'Publish and keep learning', 'النشر ومواصلة التعلم'],
    goal: ['Expliquer les rôles de GitHub, Vercel et des tests.', 'Explain the roles of GitHub, Vercel and tests.', 'شرح أدوار GitHub وVercel والاختبارات.'],
    idea: ['Git garde un historique des changements. GitHub héberge le dépôt de code. Vercel construit et héberge le site. Avant de publier, on vérifie les changements avec les tests et la construction du projet.', 'Git keeps a change history. GitHub hosts the code repository. Vercel builds and hosts the website. Before publishing, check changes with tests and a project build.', 'يحفظ Git تاريخ التغييرات ويستضيف GitHub مستودع الكود ويبني Vercel الموقع ويستضيفه. قبل النشر نتحقق بالاختبارات وبناء المشروع.'],
    analogy: ['Un brouillon vérifié devient une nouvelle édition. L’historique permet de comprendre ce qui a changé.', 'A checked draft becomes a new edition. History helps you understand what changed.', 'تصبح المسودة المتحقق منها إصدارًا جديدًا ويساعد التاريخ على فهم التغييرات.'],
    experiment: 'route', task: ['Choisis une page et explique son fichier source. Ensuite ouvre les ateliers pour pratiquer dans une copie locale.', 'Choose a page and explain its source file. Then open the workshops to practice in a local copy.', 'اختر صفحة واشرح ملفها ثم افتح الورش للتدرب في نسخة محلية.'],
    observe: ['Connaître une adresse ne prouve pas que tout fonctionne. Vérifie aussi le comportement, les petits écrans et les erreurs.', 'Knowing an address does not prove everything works. Also check behavior, small screens and errors.', 'معرفة العنوان لا تثبت أن كل شيء يعمل. تحقق أيضًا من السلوك والشاشات الصغيرة والأخطاء.'],
    code: 'git diff\nnpm.cmd test\nnpm.cmd run build',
    lines: [['Voir exactement les changements avant de les enregistrer.', 'See the exact changes before committing them.', 'شاهد التغييرات بدقة قبل تسجيلها.'], ['Exécuter les tests du projet dans le terminal Windows.', 'Run the project tests in the Windows terminal.', 'شغل اختبارات المشروع في طرفية Windows.'], ['Vérifier que le site peut être construit.', 'Check that the site can be built.', 'تحقق من إمكانية بناء الموقع.']],
    question: ['Quel service héberge le site de ce projet ?', 'Which service hosts this project’s website?', 'أي خدمة تستضيف موقع هذا المشروع؟'],
    options: [['Vercel', 'Vercel', 'Vercel'], ['La balise h1', 'The h1 tag', 'وسم h1'], ['useState', 'useState', 'useState']], correct: 0,
    feedback: ['Vercel héberge le site ; GitHub héberge le dépôt. Continue avec les ateliers puis l’Académie : formulaires, TypeScript, sécurité, tests, paiements et projets.', 'Vercel hosts the site; GitHub hosts the repository. Continue with workshops and the Academy: forms, TypeScript, security, tests, payments and projects.', 'يستضيف Vercel الموقع وGitHub المستودع. تابع بالورش والأكاديمية: النماذج وTypeScript والأمان والاختبارات والدفع والمشاريع.'],
    term: 'Build', definition: ['La préparation du code en une version que le serveur peut servir aux visiteurs.', 'Preparing code into a version the server can serve to visitors.', 'تجهيز الكود في نسخة يستطيع الخادم تقديمها للزوار.'], file: 'package.json', next: 'deploy',
  },
];

export const STARTER_KEY = 'lecomax-beginner-path-v1';
export type StarterProgress = { selected: number; completed: string[]; notes: Record<string, string> };
export function readStarterProgress(value: unknown): StarterProgress {
  const clean: StarterProgress = { selected: 0, completed: [], notes: {} };
  if (!value || typeof value !== 'object') return clean;
  const entry = value as Partial<StarterProgress>;
  if (Number.isInteger(entry.selected)) clean.selected = Math.max(0, Math.min(STARTER_LESSONS.length - 1, entry.selected!));
  if (Array.isArray(entry.completed)) clean.completed = STARTER_LESSONS.filter(lesson => entry.completed!.includes(lesson.id)).map(lesson => lesson.id);
  if (entry.notes && typeof entry.notes === 'object') for (const lesson of STARTER_LESSONS) {
    const note = entry.notes[lesson.id];
    if (typeof note === 'string') clean.notes[lesson.id] = note.slice(0, 2000);
  }
  return clean;
}
