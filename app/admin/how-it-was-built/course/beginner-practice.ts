import type { Words } from './beginner-path';

export type StarterPractice = {
  prompt: Words;
  before: string;
  after: string;
  answer: string;
  hint: Words;
  explanation: Words;
  answerFeedback: Words[];
};

export const STARTER_PRACTICE: Record<string, StarterPractice> = {
  web: {
    prompt: ['Complète le nom de la fonction qui demande les produits au serveur.', 'Complete the function name that requests products from the server.', 'أكمل اسم الدالة التي تطلب المنتجات من الخادم.'],
    before: 'const response = await ', after: '("/api/products");', answer: 'fetch',
    hint: ['Relis la première ligne de l’exemple : le nom vient juste après await.', 'Read the first example line: the name comes just after await.', 'راجع السطر الأول من المثال: يأتي الاسم بعد await مباشرة.'],
    explanation: ['fetch envoie la demande. await attend la réponse avant de poursuivre.', 'fetch sends the request. await waits for the response before continuing.', 'ترسل fetch الطلب وتنتظر await الرد قبل المتابعة.'],
    answerFeedback: [
      ['Le navigateur lit la réponse et affiche la page au client.', 'The browser reads the response and displays the page to the customer.', 'يقرأ المتصفح الرد ويعرض الصفحة للعميل.'],
      ['GitHub conserve le code et son historique. Le navigateur affiche la page.', 'GitHub stores code and its history. The browser displays the page.', 'يحفظ GitHub الكود وتاريخه. يعرض المتصفح الصفحة.'],
      ['La base garde les données. C’est le navigateur qui affiche la page.', 'The database stores data. The browser displays the page.', 'تحفظ القاعدة البيانات ويعرض المتصفح الصفحة.'],
    ],
  },
  html: {
    prompt: ['Ferme le titre avec la même balise que celle de départ. Écris seulement son nom.', 'Close the heading with the same tag it starts with. Write only its name.', 'أغلق العنوان بالوسم الذي بدأ به. اكتب الاسم فقط.'],
    before: '<h1>My shop</', after: '>', answer: 'h1',
    hint: ['La balise d’ouverture est <h1>. La barre / indique la fermeture.', 'The opening tag is <h1>. The slash / marks the closing tag.', 'وسم البداية هو <h1> وتشير / إلى الإغلاق.'],
    explanation: ['<h1> commence le titre principal ; </h1> le termine.', '<h1> starts the main heading; </h1> ends it.', 'يبدأ <h1> العنوان الرئيسي وينهيه </h1>.'],
    answerFeedback: [
      ['p représente un paragraphe. h1 représente le titre principal.', 'p represents a paragraph. h1 represents the main heading.', 'يمثل p فقرة ويمثل h1 العنوان الرئيسي.'],
      ['h1 identifie le titre principal : il donne du sens au contenu.', 'h1 identifies the main heading: it gives meaning to the content.', 'يحدد h1 العنوان الرئيسي ويعطي المحتوى معنى.'],
      ['button représente une action à cliquer. h1 représente le titre principal.', 'button represents a clickable action. h1 represents the main heading.', 'يمثل button إجراءً للنقر ويمثل h1 العنوان الرئيسي.'],
    ],
  },
  css: {
    prompt: ['Donne à la carte 32 pixels d’espace intérieur. Écris seulement le nombre.', 'Give the card 32 pixels of inside spacing. Write only the number.', 'اجعل المسافة الداخلية للبطاقة 32 بكسل. اكتب الرقم فقط.'],
    before: '.card {\n  padding: ', after: 'px;\n}', answer: '32',
    hint: ['L’unité px est déjà écrite après le champ.', 'The px unit is already written after the field.', 'وحدة px مكتوبة بعد الحقل.'],
    explanation: ['padding: 32px ajoute de l’espace entre le contenu et le bord intérieur.', 'padding: 32px adds space between the content and the inside edge.', 'تضيف padding: 32px مسافة بين المحتوى والحافة الداخلية.'],
    answerFeedback: [
      ['padding règle l’espace intérieur. Il ne change pas le prix.', 'padding controls inside spacing. It does not change the price.', 'تتحكم padding في المسافة الداخلية ولا تغير السعر.'],
      ['Les données restent identiques. padding change uniquement l’espace intérieur.', 'The data stays the same. padding changes only inside spacing.', 'تبقى البيانات كما هي وتغير padding المسافة الداخلية فقط.'],
      ['Oui : padding éloigne le contenu du bord intérieur de la carte.', 'Yes: padding moves content away from the card’s inside edge.', 'نعم: تبعد padding المحتوى عن الحافة الداخلية للبطاقة.'],
    ],
  },
  javascript: {
    prompt: ['Complète le calcul pour multiplier le prix par la quantité.', 'Complete the calculation to multiply price by quantity.', 'أكمل العملية لضرب السعر في الكمية.'],
    before: 'const price = 100;\nconst quantity = 3;\nconst total = price ', after: ' quantity;', answer: '*',
    hint: ['En JavaScript, la multiplication utilise une étoile, pas la lettre x.', 'In JavaScript, multiplication uses an asterisk, not the letter x.', 'يستخدم الضرب في JavaScript النجمة وليس الحرف x.'],
    explanation: ['100 * 3 donne 300. + ferait une addition et donnerait 103.', '100 * 3 gives 300. + would add the numbers and give 103.', 'تعطي 100 * 3 الناتج 300 بينما تجمع + العددين لتعطي 103.'],
    answerFeedback: [
      ['100 + 2 = 102 additionne le prix et la quantité. Il faut les multiplier.', '100 + 2 = 102 adds price and quantity. You need to multiply them.', 'تجمع 100 + 2 = 102 السعر والكمية بينما المطلوب ضربهما.'],
      ['100 × 2 = 200 : le prix est multiplié par les deux articles de la question.', '100 × 2 = 200: price is multiplied by the two items in the question.', '100 × 2 = 200: نضرب السعر في عدد القطعتين في السؤال.'],
      ['100 est le prix d’un article. La question en compte deux : le total est 200.', '100 is the price of one item. The question has two: the total is 200.', '100 هو سعر قطعة واحدة والسؤال يتضمن قطعتين لذا المجموع 200.'],
    ],
  },
  react: {
    prompt: ['Affiche la prop name dans le titre. Les accolades sont déjà présentes.', 'Display the name prop in the heading. The braces are already there.', 'اعرض الخاصية name في العنوان. الأقواس موجودة.'],
    before: 'function ProductCard({ name }: { name: string }) {\n  return <h2>{', after: '}</h2>;\n}', answer: 'name',
    hint: ['Utilise le nom de la valeur reçue par ProductCard.', 'Use the name of the value received by ProductCard.', 'استخدم اسم القيمة التي يتلقاها ProductCard.'],
    explanation: ['{name} affiche la valeur reçue. Chaque carte peut recevoir un nom différent.', '{name} displays the received value. Each card can receive a different name.', 'تعرض {name} القيمة المستلمة ويمكن لكل بطاقة تلقي اسم مختلف.'],
    answerFeedback: [
      ['La structure reste la même et les props apportent les données de chaque produit.', 'The structure stays the same and props provide each product’s data.', 'تبقى البنية نفسها وتوفر الخصائص بيانات كل منتج.'],
      ['Un composant organise l’affichage. Il ne remplace pas le stockage en base.', 'A component organizes the display. It does not replace database storage.', 'ينظم المكون العرض ولا يحل محل التخزين في القاعدة.'],
      ['Réutiliser un composant permet d’afficher des textes différents dans la même structure.', 'Reusing a component displays different text within the same structure.', 'تسمح إعادة استخدام المكون بعرض نصوص مختلفة ضمن البنية نفسها.'],
    ],
  },
  state: {
    prompt: ['Complète le nom de la fonction qui met à jour la quantité.', 'Complete the name of the function that updates quantity.', 'أكمل اسم الدالة التي تحدث الكمية.'],
    before: 'const [quantity, setQuantity] = useState(1);\n', after: '(q => q + 1);', answer: 'setQuantity',
    hint: ['C’est le deuxième nom entre les crochets, avec un Q majuscule.', 'It is the second name in the square brackets, with an uppercase Q.', 'هو الاسم الثاني بين الأقواس المربعة ويحتوي على Q كبيرة.'],
    explanation: ['setQuantity reçoit la quantité précédente et ajoute 1. React actualise l’affichage.', 'setQuantity receives the previous quantity and adds 1. React updates the display.', 'تتلقى setQuantity الكمية السابقة وتضيف 1 ثم تحدث React العرض.'],
    answerFeedback: [
      ['Publier nécessite un déploiement. setQuantity change seulement l’état du composant.', 'Publishing needs a deployment. setQuantity changes only component state.', 'يتطلب النشر عملية نشر وتغير setQuantity حالة المكون فقط.'],
      ['setQuantity ne supprime aucun produit. Elle change la valeur utilisée par le compteur.', 'setQuantity deletes no product. It changes the value used by the counter.', 'لا تحذف setQuantity أي منتج بل تغير القيمة المستخدمة في العداد.'],
      ['Le setter change l’état, puis React affiche la nouvelle quantité.', 'The setter changes state, then React displays the new quantity.', 'تغير الدالة الحالة ثم تعرض React الكمية الجديدة.'],
    ],
  },
  next: {
    prompt: ['Complète le nom du fichier qui crée la page /boutique.', 'Complete the filename that creates the /boutique page.', 'أكمل اسم الملف الذي ينشئ صفحة /boutique.'],
    before: 'app/boutique/', after: '', answer: 'page.tsx',
    hint: ['Le même nom de fichier est utilisé pour chaque page de l’App Router.', 'The App Router uses this same filename for each page.', 'يستخدم App Router اسم الملف نفسه لكل صفحة.'],
    explanation: ['Le dossier boutique donne l’adresse. page.tsx fournit le composant de la page.', 'The boutique folder gives the address. page.tsx provides the page component.', 'يعطي مجلد boutique العنوان ويوفر page.tsx مكون الصفحة.'],
    answerFeedback: [
      ['Le dossier boutique définit /boutique et page.tsx fournit sa page.', 'The boutique folder defines /boutique and page.tsx provides its page.', 'يحدد مجلد boutique العنوان /boutique ويوفر page.tsx صفحته.'],
      ['layout.tsx fournit un cadre partagé. Une page a besoin de son fichier page.tsx.', 'layout.tsx provides a shared layout. A page needs its page.tsx file.', 'يوفر layout.tsx إطارًا مشتركًا وتحتاج الصفحة إلى ملف page.tsx.'],
      ['package.json décrit les scripts et dépendances du projet, pas le contenu d’une page.', 'package.json describes project scripts and dependencies, not page content.', 'يصف package.json أوامر المشروع واعتمادياته وليس محتوى الصفحة.'],
    ],
  },
  api: {
    prompt: ['Complète la méthode qui renvoie ces données au format JSON.', 'Complete the method that returns this data as JSON.', 'أكمل الدالة التي تعيد البيانات بصيغة JSON.'],
    before: 'export async function GET() {\n  return Response.', after: '({ message: "Hello" });\n}', answer: 'json',
    hint: ['Le nom reprend le format des données, en minuscules.', 'The name is the data format written in lowercase.', 'الاسم هو صيغة البيانات مكتوبة بأحرف صغيرة.'],
    explanation: ['Response.json crée une réponse HTTP contenant les données au format JSON.', 'Response.json creates an HTTP response containing JSON data.', 'تنشئ Response.json رد HTTP يحتوي على بيانات JSON.'],
    answerFeedback: [
      ['Une réussite inventée trompe le client : il faut signaler l’erreur.', 'An invented success misleads the customer: report the error instead.', 'النجاح الوهمي يضلل العميل ويجب الإبلاغ عن الخطأ.'],
      ['Un message clair explique le problème ; réessayer permet de récupérer après une panne.', 'A clear message explains the problem; retrying allows recovery after a failure.', 'تشرح الرسالة الواضحة المشكلة وتسمح إعادة المحاولة بالتعافي بعد العطل.'],
      ['Un prix aléatoire serait une fausse donnée. Explique l’erreur et propose de réessayer.', 'A random price would be false data. Explain the error and offer a retry.', 'السعر العشوائي بيانات خاطئة. اشرح الخطأ ووفر إعادة المحاولة.'],
    ],
  },
  data: {
    prompt: ['Complète le nom de la colonne qui contient le prix du produit.', 'Complete the column name that contains the product price.', 'أكمل اسم العمود الذي يحتوي على سعر المنتج.'],
    before: '// Table: products\n// id | name       | ', after: '\n// 1  | My product | 100', answer: 'price',
    hint: ['Utilise le mot anglais pour « prix », déjà présent dans les calculs.', 'Use the English word for the product’s price, already used in the calculations.', 'استخدم الكلمة الإنجليزية للسعر المستخدمة في العمليات الحسابية.'],
    explanation: ['price nomme la colonne ; 100 est la valeur de cette colonne pour ce produit.', 'price names the column; 100 is that column’s value for this product.', 'يسمي price العمود و100 قيمة هذا العمود لهذا المنتج.'],
    answerFeedback: [
      ['Une couleur concerne l’apparence. Elle ne conserve aucune commande.', 'A color concerns appearance. It does not store an order.', 'يتعلق اللون بالمظهر ولا يحفظ أي طلب.'],
      ['L’état React peut disparaître quand on quitte la page. Une commande doit être sauvegardée.', 'React state can disappear when leaving the page. An order needs to be saved.', 'قد تختفي حالة React عند مغادرة الصفحة ويجب حفظ الطلب.'],
      ['Le serveur vérifie les données et les permissions avant de sauvegarder la commande en base.', 'The server checks data and permissions before saving the order in the database.', 'يتحقق الخادم من البيانات والصلاحيات قبل حفظ الطلب في القاعدة.'],
    ],
  },
  publish: {
    prompt: ['Complète la commande qui vérifie la construction du projet.', 'Complete the command that checks the project build.', 'أكمل الأمر الذي يتحقق من بناء المشروع.'],
    before: 'npm.cmd run ', after: '', answer: 'build',
    hint: ['Le mot anglais signifie « construire ». Cette commande ne publie pas le site.', 'The word means “construct”. This command does not publish the site.', 'تعني الكلمة الإنجليزية «بناء». لا ينشر هذا الأمر الموقع.'],
    explanation: ['npm.cmd run build prépare le site et signale les erreurs de construction. La publication est une autre étape.', 'npm.cmd run build prepares the site and reports build errors. Publishing is a separate step.', 'يجهز npm.cmd run build الموقع ويبلغ عن أخطاء البناء. النشر خطوة أخرى.'],
    answerFeedback: [
      ['Vercel construit et héberge ce site. GitHub conserve son dépôt de code.', 'Vercel builds and hosts this site. GitHub stores its code repository.', 'يبني Vercel الموقع ويستضيفه ويحفظ GitHub مستودع الكود.'],
      ['h1 est une balise pour un titre. Elle ne fournit pas d’hébergement.', 'h1 is a heading tag. It does not provide hosting.', 'h1 وسم للعنوان ولا يوفر استضافة.'],
      ['useState garde une valeur dans un composant React. Vercel héberge le site.', 'useState keeps a value in a React component. Vercel hosts the site.', 'تحفظ useState قيمة داخل مكون React ويستضيف Vercel الموقع.'],
    ],
  },
};

// Check a single missing token, without executing learner input.
export function checkStarterCode(practice: StarterPractice, input: string): boolean {
  return input.trim() === practice.answer;
}
