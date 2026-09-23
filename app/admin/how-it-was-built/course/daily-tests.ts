import { DAILY_LESSONS, type Text } from "./daily-lessons.ts";

export const DAILY_TEST_VERSION = 1;
export type DailyQuestion = { question: Text; options: Text[]; correctIndex: number; explanation: Text };
function question(prompt: Text, correct: Text, wrong: Text, other: Text, explanation: Text, position: number): DailyQuestion {
  const options = [wrong, other];
  options.splice(position, 0, correct);
  return { question: prompt, options, correctIndex: position, explanation };
}
function recall(id: string, correct: Text, wrong: Text, other: Text, position: number) {
  const lesson = DAILY_LESSONS.find(item => item.id === id)!;
  return question(lesson.question, correct, wrong, other, lesson.answer, position);
}
const yes: Text = ["Oui", "Yes", "نعم"];
const no: Text = ["Non", "No", "لا"];
const unsure: Text = ["Je ne sais pas encore", "I am not sure yet", "لا أعرف بعد"];
function check(prompt: Text, correct: boolean, explanation: Text): DailyQuestion {
  return { question: prompt, options: [yes, no, unsure], correctIndex: correct ? 0 : 1, explanation };
}

export const DAILY_TESTS: Record<string, DailyQuestion[]> = {
  website: [
    recall("website", ["La base de données", "The database", "قاعدة البيانات"], ["Uniquement l’écran", "Only the screen", "الشاشة فقط"], ["Le fichier de couleurs", "The colour file", "ملف الألوان"], 1),
    question(["Un client ouvre la boutique. Qui affiche la page ?", "A customer opens the shop. What displays the page?", "يفتح عميل المتجر. من يعرض الصفحة؟"], ["Le navigateur", "The browser", "المتصفح"], ["Le registre du stock", "The stock database", "قاعدة بيانات المخزون"], ["Le transporteur", "The delivery company", "شركة الشحن"], ["Le navigateur transforme la réponse reçue en page visible.", "The browser turns the received response into a visible page.", "يحوّل المتصفح الاستجابة إلى صفحة مرئية."], 0),
    check(["Le navigateur, le serveur et la base de données ont-ils exactement le même rôle ?", "Do the browser, server and database have exactly the same job?", "هل للمتصفح والخادم وقاعدة البيانات الوظيفة نفسها تمامًا؟"], false, ["Ils affichent, traitent les demandes et conservent les données : trois rôles complémentaires.", "They display, handle requests and store data: three complementary jobs.", "تعرض وتعالج الطلبات وتحفظ البيانات: ثلاث وظائف متكاملة."]),
  ],
  files: [
    recall("files", ["components", "components", "components"], ["Le dossier des photos uniquement", "Only the photos folder", "مجلد الصور فقط"], ["L’historique du navigateur", "Browser history", "سجل المتصفح"], 2),
    question(["Tu cherches la commande pour lancer le site. Quel fichier consulter ?", "You need the command to start the site. Which file should you consult?", "تبحث عن أمر تشغيل الموقع. أي ملف تقرأ؟"], ["package.json", "package.json", "package.json"], ["Une image produit", "A product image", "صورة منتج"], ["Le panier d’un client", "A customer’s cart", "سلة عميل"], ["package.json liste les commandes du projet, notamment dev.", "package.json lists project commands, including dev.", "يسرد package.json أوامر المشروع ومنها dev."], 1),
    check(["Faut-il comprendre tous les fichiers avant de commencer une petite modification ?", "Must you understand every file before starting a small change?", "هل يجب فهم جميع الملفات قبل تعديل صغير؟"], false, ["Commence par le fichier lié au résultat souhaité, puis suis ses dépendances si nécessaire.", "Start with the file related to your goal, then follow dependencies as needed.", "ابدأ بالملف المرتبط بهدفك ثم افهم الملفات التي يعتمد عليها عند الحاجة."]),
  ],
  html: [
    recall("html", ["Le texte visible du titre", "The visible heading text", "نص العنوان الظاهر"], ["Le stock", "The stock", "المخزون"], ["Le mot de passe", "The password", "كلمة المرور"], 0),
    question(["Dans <h1>Bonjour</h1>, que voit le visiteur comme texte ?", "In <h1>Hello</h1>, what text does the visitor see?", "في <h1>مرحبًا</h1> ما النص الذي يراه الزائر؟"], ["Bonjour", "Hello", "مرحبًا"], ["h1 uniquement", "Only h1", "h1 فقط"], ["/h1 uniquement", "Only /h1", "/h1 فقط"], ["Les balises donnent un rôle ; leur contenu est le texte affiché.", "Tags give the content a role; the content is the displayed text.", "تحدد الوسوم وظيفة المحتوى، والمحتوى هو النص الظاهر."], 2),
    check(["Dans </h1>, le / indique-t-il la fermeture de la balise ?", "Does / in </h1> indicate the closing tag?", "هل يشير / في </h1> إلى إغلاق الوسم؟"], true, ["<h1> ouvre le titre et </h1> le ferme.", "<h1> opens the heading and </h1> closes it.", "يفتح <h1> العنوان ويغلقه </h1>."]),
  ],
  style: [
    recall("style", ["Non, cela change la présentation", "No, it changes presentation", "لا، يغيّر المظهر"], ["Oui, cela augmente le prix", "Yes, it increases the price", "نعم، يزيد السعر"], ["Cela supprime le produit", "It deletes the product", "يحذف المنتج"], 1),
    question(["Un bouton est trop serré à l’intérieur. Quelle classe étudiée aide ?", "A button feels cramped inside. Which class from the lesson helps?", "المساحة داخل زر ضيقة. أي فئة من الدرس تساعد؟"], ["p-4", "p-4", "p-4"], ["rounded-xl uniquement", "Only rounded-xl", "rounded-xl فقط"], ["Changer le prix", "Change the price", "تغيير السعر"], ["p-4 ajoute de l’espace intérieur. rounded-xl agit sur les coins.", "p-4 adds inner spacing. rounded-xl changes the corners.", "تضيف p-4 مساحة داخلية، بينما تغيّر rounded-xl الزوايا."], 0),
    check(["Faut-il vérifier la lisibilité sur téléphone même si le site est beau sur ordinateur ?", "Should you check phone readability even if the desktop site looks good?", "هل يجب فحص وضوح الموقع على الهاتف حتى لو بدا جميلًا على الحاسوب؟"], true, ["La largeur change : les textes et les boutons doivent rester utilisables.", "The width changes: text and buttons must remain usable.", "يتغيّر العرض؛ يجب أن تبقى النصوص والأزرار سهلة الاستخدام."]),
  ],
  javascript: [
    recall("javascript", ["40 €", "€40", "40 يورو"], ["36 €", "€36", "36 يورو"], ["19 €", "€19", "19 يورو"], 2),
    question(["Deux articles à 15 € et 5 € de livraison : quel total ?", "Two items at €15 and €5 shipping: what is the total?", "قطعتان بسعر 15 يورو وشحن 5 يورو: ما المجموع؟"], ["35 €", "€35", "35 يورو"], ["20 €", "€20", "20 يورو"], ["30 €", "€30", "30 يورو"], ["2 × 15 = 30, puis 30 + 5 = 35. On ajoute la livraison une fois dans cet exemple.", "2 × 15 = 30, then 30 + 5 = 35. Shipping is added once in this example.", "2 × 15 = 30، ثم 30 + 5 = 35. نضيف الشحن مرة واحدة في هذا المثال."], 1),
    check(["Une fonction peut-elle recevoir des valeurs et calculer un résultat ?", "Can a function receive values and calculate a result?", "هل يمكن لدالة استقبال قيم وحساب نتيجة؟"], true, ["Par exemple, elle reçoit prix et quantité pour calculer un sous-total.", "For example, it receives price and quantity to calculate a subtotal.", "مثلًا تستقبل السعر والكمية لحساب المجموع الفرعي."]),
  ],
  react: [
    recall("react", ["Non, on réutilise un composant", "No, reuse one component", "لا، نعيد استخدام المكوّن"], ["Oui, tout recopier", "Yes, copy everything", "نعم، ننسخ كل شيء"], ["Il faut une autre base de données", "You need another database", "نحتاج قاعدة بيانات أخرى"], 0),
    question(["Deux cartes ont la même forme mais des prix différents. Qu’est-ce qui varie ?", "Two cards have the same layout but different prices. What varies?", "بطاقتان لهما الشكل نفسه وأسعار مختلفة. ما الذي يتغيّر؟"], ["Les données reçues, ou props", "The supplied data, or props", "البيانات المستقبلة، أي props"], ["Le rôle du navigateur", "The browser’s job", "وظيفة المتصفح"], ["Le langage de programmation", "The programming language", "لغة البرمجة"], ["Les props permettent de donner des informations différentes au même composant.", "Props let you supply different information to the same component.", "تسمح props بتمرير معلومات مختلفة للمكوّن نفسه."], 2),
    check(["Modifier le composant partagé peut-il changer plusieurs cartes ?", "Can changing a shared component change several cards?", "هل تعديل مكوّن مشترك قد يغيّر عدة بطاقات؟"], true, ["Oui, toutes les cartes qui l’utilisent peuvent bénéficier de cette modification.", "Yes, cards using that component can all benefit from the change.", "نعم، قد تستفيد كل البطاقات التي تستخدمه من التعديل."]),
  ],
  routes: [
    recall("routes", ["Une page modèle pour plusieurs produits", "One page template for different products", "قالب صفحة لمنتجات مختلفة"], ["Choisir une couleur", "Choose a colour", "اختيار لون"], ["Calculer la livraison", "Calculate shipping", "حساب الشحن"], 1),
    question(["Dans /produit/sac-bleu, quelle partie identifie le produit ?", "In /produit/blue-bag, which part identifies the product?", "في /produit/blue-bag أي جزء يحدد المنتج؟"], ["sac-bleu", "blue-bag", "blue-bag"], ["produit seulement", "Only produit", "produit فقط"], ["Le premier /", "The first /", "أول /"], ["Le slug est la partie variable qui désigne ici le produit.", "The slug is the variable part identifying the product here.", "الـslug هو الجزء المتغيّر الذي يحدد المنتج هنا."], 0),
    check(["Chaque produit nécessite-t-il obligatoirement un fichier page.tsx différent ?", "Does every product necessarily need a separate page.tsx file?", "هل يحتاج كل منتج بالضرورة ملف page.tsx مختلفًا؟"], false, ["La route [slug] réutilise le même modèle avec différentes données.", "The [slug] route reuses the same template with different data.", "يعيد مسار [slug] استخدام القالب نفسه مع بيانات مختلفة."]),
  ],
  api: [
    recall("api", ["Non, la demande peut avoir échoué", "No, the request may have failed", "لا، ربما فشل الطلب"], ["Oui, tous sont supprimés", "Yes, all were deleted", "نعم، حُذفت كلها"], ["Cela prouve une rupture de stock", "It proves stock has run out", "يثبت نفاد المخزون"], 2),
    question(["La page demande des produits et reçoit des données. Comment appelle-t-on le retour ?", "The page requests products and receives data. What is the returned message called?", "تطلب الصفحة منتجات وتتلقى بيانات. ما اسم الرسالة العائدة؟"], ["Une réponse", "A response", "استجابة"], ["Une couleur", "A colour", "لون"], ["Une livraison", "A shipment", "شحنة"], ["La requête part vers le serveur ; la réponse revient vers la page.", "The request goes to the server; the response comes back to the page.", "يذهب الطلب إلى الخادم وتعود الاستجابة إلى الصفحة."], 1),
    check(["« Aucun produit » et « impossible de charger les produits » signifient-ils la même chose ?", "Do ‘no products’ and ‘could not load products’ mean the same thing?", "هل «لا توجد منتجات» و«تعذّر تحميل المنتجات» لهما المعنى نفسه؟"], false, ["Le premier décrit une liste vide ; le second un échec de chargement.", "The first describes an empty list; the second describes a loading failure.", "الأولى قائمة فارغة، والثانية فشل في التحميل."]),
  ],
  database: [
    recall("database", ["Pour retrouver le bon produit même si son nom change", "To find the right product even if its name changes", "للعثور على المنتج الصحيح حتى لو تغيّر اسمه"], ["Pour arrondir les images", "To round images", "لجعل الصور مستديرة"], ["Pour remplacer tous les prix", "To replace all prices", "لاستبدال كل الأسعار"], 0),
    question(["Deux produits ont le même nom. Que comparer pour les distinguer ?", "Two products have the same name. What should you compare to tell them apart?", "منتجان لهما الاسم نفسه. ماذا تقارن للتمييز بينهما؟"], ["Leurs identifiants", "Their IDs", "معرّفاتهما"], ["La couleur du bouton", "The button colour", "لون الزر"], ["La largeur de l’écran", "The screen width", "عرض الشاشة"], ["Un identifiant distingue une ligne d’une autre, même quand les noms se ressemblent.", "An ID distinguishes one row from another even when names match.", "يميّز المعرّف صفًا عن آخر حتى عندما تتطابق الأسماء."], 2),
    check(["Une ligne peut-elle représenter un produit et une colonne son prix ?", "Can a row represent a product and a column its price?", "هل يمكن أن يمثل الصف منتجًا والعمود سعره؟"], true, ["C’est une façon simple d’organiser une table de produits.", "That is a simple way to organise a products table.", "هذه طريقة بسيطة لتنظيم جدول المنتجات."]),
  ],
  security: [
    recall("security", ["Non, le serveur doit contrôler les droits", "No, the server must check permissions", "لا، يجب أن يتحقق الخادم من الصلاحيات"], ["Oui, toujours", "Yes, always", "نعم، دائمًا"], ["Oui, si le bouton est petit", "Yes, if the button is small", "نعم، إذا كان الزر صغيرًا"], 1),
    question(["Un client connecté essaie une action réservée au propriétaire. Que doit faire le serveur ?", "A signed-in customer tries an owner-only action. What should the server do?", "يحاول عميل مسجّل الدخول تنفيذ إجراء للمالك فقط. ماذا يفعل الخادم؟"], ["Vérifier les droits et refuser s’ils manquent", "Check permissions and reject if missing", "يتحقق من الصلاحيات ويرفض إن لم تتوفر"], ["Accepter car il est connecté", "Accept because they signed in", "يقبل لأنه مسجّل الدخول"], ["Changer la couleur du bouton", "Change the button colour", "يغيّر لون الزر"], ["Être connecté ne donne pas automatiquement les droits du propriétaire.", "Being signed in does not automatically grant owner permissions.", "تسجيل الدخول لا يمنح صلاحيات المالك تلقائيًا."], 0),
    check(["Peut-on placer un secret serveur dans du code envoyé aux visiteurs ?", "Should a server secret be placed in code sent to visitors?", "هل ينبغي وضع سرّ الخادم في كود يُرسل للزوار؟"], false, ["Un secret doit rester côté serveur, hors du code accessible aux visiteurs.", "A secret must remain on the server, outside visitor-accessible code.", "يجب أن يبقى السرّ على الخادم بعيدًا عن الكود المتاح للزوار."]),
  ],
  orders: [
    recall("orders", ["Non, ce sont des étapes différentes", "No, these are different steps", "لا، إنها مراحل مختلفة"], ["Oui, automatiquement", "Yes, automatically", "نعم، تلقائيًا"], ["Oui, si l’image apparaît", "Yes, if the image appears", "نعم، إذا ظهرت الصورة"], 2),
    question(["Le panier contient un produit en rupture. Quand le vérifier ?", "A cart contains an out-of-stock product. When should it be checked?", "تحتوي السلة على منتج نفد مخزونه. متى نتحقق؟"], ["Avant d’accepter la commande", "Before accepting the order", "قبل قبول الطلب"], ["Seulement après l’expédition", "Only after shipping", "بعد الشحن فقط"], ["Jamais", "Never", "أبدًا"], ["Le serveur doit contrôler la disponibilité et les quantités avant d’accepter.", "The server must check availability and quantities before accepting.", "يجب أن يتحقق الخادم من التوفر والكميات قبل القبول."], 1),
    check(["Un prix fourni par le navigateur suffit-il sans vérification serveur ?", "Is a browser-supplied price enough without a server check?", "هل يكفي سعر يرسله المتصفح دون تحقق الخادم؟"], false, ["Le serveur doit vérifier les montants avec les données du magasin.", "The server must verify amounts against shop data.", "يجب أن يتحقق الخادم من المبالغ باستخدام بيانات المتجر."]),
  ],
  payments: [
    recall("payments", ["Déclencher deux fois la même action", "Trigger the same action twice", "تنفيذ الإجراء نفسه مرتين"], ["Changer uniquement la police", "Only change the font", "تغيير الخط فقط"], ["Améliorer automatiquement la sécurité", "Automatically improve security", "تحسين الأمان تلقائيًا"], 0),
    question(["Le navigateur affiche « paiement réussi ». Quelle vérification reste nécessaire ?", "The browser shows ‘payment successful’. What check is still needed?", "يعرض المتصفح «نجح الدفع». ما التحقق الذي لا يزال مطلوبًا؟"], ["Vérifier les informations de paiement côté serveur", "Verify payment information on the server", "التحقق من معلومات الدفع على الخادم"], ["Regarder la couleur du message", "Look at the message colour", "فحص لون الرسالة"], ["Aucune vérification", "No check", "لا حاجة للتحقق"], ["Un message visible seul n’est pas une preuve fiable du paiement.", "A visible message alone is not reliable payment proof.", "الرسالة الظاهرة وحدها ليست دليلًا موثوقًا على الدفع."], 2),
    check(["Un webhook est-il un message envoyé directement par un service à ton serveur ?", "Is a webhook a message sent directly from a service to your server?", "هل Webhook رسالة ترسلها خدمة مباشرة إلى خادمك؟"], true, ["Il permet au service d’informer le serveur d’un événement à vérifier et traiter.", "It lets the service notify the server about an event to verify and process.", "يسمح للخدمة بإبلاغ الخادم بحدث للتحقق منه ومعالجته."]),
  ],
  publish: [
    recall("publish", ["Non, il faut vérifier le comportement", "No, behaviour still needs checking", "لا، يجب فحص السلوك"], ["Oui, aucun autre test n’est utile", "Yes, no other test is useful", "نعم، لا فائدة من اختبارات أخرى"], ["Oui, si le fichier est grand", "Yes, if the file is large", "نعم، إذا كان الملف كبيرًا"], 1),
    question(["Tu changes une page. Où observer d’abord le résultat ?", "You change a page. Where should you first observe the result?", "عدّلت صفحة. أين تشاهد النتيجة أولًا؟"], ["Sur le site local de développement", "On the local development site", "على موقع التطوير المحلي"], ["Directement chez tous les clients", "Directly for all customers", "مباشرة عند جميع العملاء"], ["Dans un paiement réel", "In a real payment", "في دفع حقيقي"], ["Le site local permet de vérifier le changement avant de le publier.", "The local site lets you check a change before publishing it.", "يسمح الموقع المحلي بفحص التغيير قبل نشره."], 0),
    check(["Pour un test utile, faut-il écrire le résultat attendu ?", "Should a useful test specify the expected result?", "هل يجب تحديد النتيجة المتوقعة للاختبار المفيد؟"], true, ["Tu peux alors comparer ce qui devait arriver avec ce qui arrive réellement.", "You can then compare what should happen with what actually happens.", "يمكنك عندها مقارنة ما يجب أن يحدث بما يحدث فعلًا."]),
  ],
  "whole-shop": [
    recall("whole-shop", ["Non, il faut vérifier tout le parcours", "No, check the whole journey", "لا، يجب فحص الرحلة كاملة"], ["Oui, le paiement suffit", "Yes, payment is enough", "نعم، الدفع يكفي"], ["Oui, les clients devineront", "Yes, customers will guess", "نعم، سيخمن العملاء"], 2),
    question(["Un client reçoit son colis puis a une question. Quelle partie de la boutique intervient ?", "A customer receives a parcel and has a question. Which part of the shop helps?", "استلم عميل طرده ولديه سؤال. أي جزء من المتجر يساعده؟"], ["Le support client", "Customer support", "دعم العملاء"], ["La couleur de la page seulement", "Only the page colour", "لون الصفحة فقط"], ["Le nom du dossier app", "The name of the app folder", "اسم مجلد app"], ["Le parcours continue après le paiement et la livraison avec l’aide au client.", "The journey continues after payment and delivery with customer help.", "تستمر الرحلة بعد الدفع والتسليم بمساعدة العميل."], 1),
    check(["Photos, stock, livraison et application mobile font-ils partie de l’ensemble à comprendre ?", "Are photos, stock, delivery and the mobile app part of the whole system to understand?", "هل الصور والمخزون والشحن وتطبيق الهاتف أجزاء من النظام الذي نفهمه؟"], true, ["Le magasin relie technique et opérations ; les pages ne sont qu’une partie.", "The shop connects technology and operations; pages are only one part.", "يربط المتجر التقنية بالعمليات؛ والصفحات جزء منه فقط."]),
  ],
};

export function gradeDailyTest(lessonId: string, answers: unknown) {
  const questions = Object.hasOwn(DAILY_TESTS, lessonId) ? DAILY_TESTS[lessonId] : undefined;
  if (!questions || !Array.isArray(answers) || answers.length !== questions.length || !questions.every((question, index) => Number.isInteger(answers[index]) && answers[index] >= 0 && answers[index] < question.options.length)) return null;
  const correct = questions.map((question, index) => answers[index] === question.correctIndex);
  const score = correct.filter(Boolean).length;
  return { score, total: questions.length, percent: Math.round(score / questions.length * 100), passed: score === questions.length, correct };
}
