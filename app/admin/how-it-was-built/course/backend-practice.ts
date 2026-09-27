import type { GuideText } from "./backend-guides";

type Practice = { idea: GuideText; task: GuideText; result: GuideText };
const step = (idea: GuideText, task: GuideText, result: GuideText): Practice => ({ idea, task, result });

export const backendPractice: Record<string, Practice[]> = {
  apis: [
    step(
      ["Une API reçoit une demande et renvoie des données.", "An API receives a request and returns data.", "تستقبل API طلبًا وتعيد بيانات."],
      ["Imagine que tu ouvres une liste de produits. Qui demande les produits ? Qui les conserve ?", "Imagine opening a product list. Who requests the products? Who stores them?", "تخيل فتح قائمة منتجات. من يطلب المنتجات؟ ومن يحفظها؟"],
      ["Le navigateur demande ; la route API répond ; Supabase conserve les produits.", "The browser asks; the API route responds; Supabase stores the products.", "يطلب المتصفح؛ ويجيب مسار API؛ ويحفظ Supabase المنتجات."]),
    step(
      ["fetch demande des données. Il faut aussi vérifier si la demande a réussi.", "fetch requests data. You also need to check whether the request succeeded.", "تطلب fetch البيانات. يجب أيضًا التحقق من نجاح الطلب."],
      ["Sur ton site local, ouvre /api/products?active=true&limit=3 dans le navigateur.", "On your local site, open /api/products?active=true&limit=3 in the browser.", "افتح /api/products?active=true&limit=3 في متصفح موقعك المحلي."],
      ["Tu vois du JSON, pas des cartes. Le composant transforme ensuite ces données en affichage. Une liste vide peut être normale.", "You see JSON, not cards. The component turns that data into a display. An empty list can be valid.", "سترى JSON وليس بطاقات. يحول المكون البيانات إلى عرض. قد تكون القائمة الفارغة صحيحة."]),
    step(
      ["Le fichier route.ts définit la réponse d’une adresse API.", "The route.ts file defines the response at an API address.", "يحدد ملف route.ts الاستجابة لعنوان API."],
      ["Dans ton projet de test, crée app/api/hello/route.ts, copie l’exemple, lance npm run dev puis ouvre /api/hello.", "In your test project, create app/api/hello/route.ts, copy the example, run npm run dev and open /api/hello.", "في مشروعك التجريبي أنشئ app/api/hello/route.ts وانسخ المثال وشغل npm run dev ثم افتح /api/hello."],
      ["Tu dois voir message: Hello et ok: true. Remplace Hello par Bonjour et recharge pour vérifier ton changement.", "You should see message: Hello and ok: true. Replace Hello with Bonjour and reload to check your change.", "يجب أن ترى message: Hello وok: true. استبدل Hello بـ Bonjour وأعد التحميل للتحقق." ]),
    step(
      ["Le statut HTTP est un indice pour trouver l’erreur.", "The HTTP status is a clue for finding an error.", "حالة HTTP دليل يساعدك على إيجاد الخطأ."],
      ["Ouvre une adresse inexistante dans ton projet local, puis compare avec /api/hello si tu l’as créée.", "Open a missing address in your local project, then compare it with /api/hello if you created it.", "افتح عنوانًا غير موجود في مشروعك المحلي وقارنه بـ /api/hello إذا أنشأته."],
      ["404 signifie adresse introuvable. 200 signifie réussite. Note l’adresse et le statut avant de chercher la cause.", "404 means not found. 200 means success. Note the address and status before investigating.", "404 يعني غير موجود و200 يعني نجاحًا. سجل العنوان والحالة قبل البحث عن السبب."]),
  ],
  database: [
    step(
      ["Code, données et fichiers ont des rôles différents.", "Code, data and files have different roles.", "للكود والبيانات والملفات أدوار مختلفة."],
      ["Classe ces trois éléments : Header.tsx, le prix d’un produit, sa photo.", "Sort these three items: Header.tsx, a product price, its photo.", "صنف العناصر التالية: Header.tsx وسعر منتج وصورته."],
      ["Header.tsx → code ; prix → ligne en base ; photo → fichier dans Storage.", "Header.tsx → code; price → database row; photo → file in Storage.", "Header.tsx ← كود؛ السعر ← صف في القاعدة؛ الصورة ← ملف في Storage."]),
    step(
      ["Un projet Supabase est un espace qui contient ta base et ses services.", "A Supabase project is a space containing your database and its services.", "مشروع Supabase مساحة تضم قاعدة بياناتك وخدماتها."],
      ["Dans un projet Supabase de test, repère Table Editor, SQL Editor et Storage. Ne change rien dans la boutique réelle.", "In a test Supabase project, find Table Editor, SQL Editor and Storage. Leave the real shop untouched.", "في مشروع Supabase تجريبي ابحث عن Table Editor وSQL Editor وStorage. لا تعدل المتجر الحقيقي."],
      ["Table Editor montre les lignes ; SQL Editor exécute des instructions ; Storage contient les fichiers.", "Table Editor shows rows; SQL Editor runs instructions; Storage holds files.", "يعرض Table Editor الصفوف وينفذ SQL Editor التعليمات ويحفظ Storage الملفات."]),
    step(
      ["RLS décide quelles lignes un utilisateur peut lire ou créer.", "RLS decides which rows a user can read or create.", "تحدد RLS الصفوف التي يمكن للمستخدم قراءتها أو إنشاؤها."],
      ["Lis les deux règles SQL ci-dessous. Repère auth.uid() et user_id : pourquoi les comparer ?", "Read the two SQL policies below. Find auth.uid() and user_id: why compare them?", "اقرأ قاعدتي SQL أدناه. ابحث عن auth.uid() وuser_id: لماذا نقارنهما؟"],
      ["L’identifiant connecté doit être celui du propriétaire de la note. Pour vérifier réellement la protection, teste avec deux comptes via l’application.", "The signed-in ID must match the note owner. To actually verify protection, test with two accounts through the app.", "يجب أن يطابق معرف المستخدم معرف مالك الملاحظة. للتحقق فعليًا اختبر بحسابين عبر التطبيق."]),
    step(
      ["Un bucket est un dossier de stockage avec ses règles d’accès.", "A bucket is a storage container with access rules.", "Bucket حاوية تخزين لها قواعد وصول."],
      ["Décide où placer une photo de produit et un document privé d’un client.", "Decide where to put a product photo and a private customer document.", "حدد مكان حفظ صورة منتج ومستند خاص بعميل."],
      ["Photo publique → bucket public. Document client → bucket privé avec accès autorisé. Public ne veut pas dire que tout le monde peut envoyer des fichiers.", "Public photo → public bucket. Customer document → private bucket with authorized access. Public does not mean anyone can upload.", "الصورة العامة في bucket عام والمستند في bucket خاص بصلاحية وصول. العام لا يعني السماح للجميع بالرفع."]),
    step(
      ["Une migration change la structure ; une sauvegarde permet de restaurer des données.", "A migration changes structure; a backup lets you restore data.", "يغير الترحيل البنية وتتيح النسخة الاحتياطية استعادة البيانات."],
      ["Écris ce qu’il faut sauvegarder avant de modifier une table contenant des photos de produits.", "Write down what to back up before changing a table containing product photo references.", "اكتب ما يجب نسخه احتياطيًا قبل تعديل جدول يحوي مراجع صور المنتجات."],
      ["Les lignes de la base et les fichiers Storage, séparément. Revenir à un ancien déploiement ne restaure pas la base.", "Database rows and Storage files, separately. Reverting a deployment does not restore the database.", "صفوف القاعدة وملفات Storage كل على حدة. الرجوع لإصدار نشر سابق لا يستعيد القاعدة."]),
    step(
      ["Choisis les services selon les besoins concrets de ton projet.", "Choose services based on your project’s actual needs.", "اختر الخدمات حسب احتياجات مشروعك الفعلية."],
      ["Note trois besoins de ta boutique : données liées, photos, publication du site.", "List three shop needs: related data, photos and website publishing.", "سجل ثلاث حاجات للمتجر: بيانات مترابطة وصور ونشر الموقع."],
      ["Supabase couvre les données et fichiers ; Vercel publie le site ; GitHub conserve le code et son historique.", "Supabase covers data and files; Vercel publishes the site; GitHub keeps code and its history.", "يغطي Supabase البيانات والملفات وينشر Vercel الموقع ويحفظ GitHub الكود وتاريخه."]),
  ],
  deploy: [
    step(
      ["GitHub garde ton code. Vercel le transforme en site accessible.", "GitHub keeps your code. Vercel turns it into an accessible website.", "يحفظ GitHub الكود ويحوله Vercel إلى موقع متاح."],
      ["Dans un nouveau projet de test, prépare le .gitignore ci-dessous avant d’ajouter des fichiers à Git.", "In a new test project, prepare the .gitignore below before staging files in Git.", "في مشروع تجريبي جديد جهز .gitignore أدناه قبل إضافة الملفات إلى Git."],
      ["Avec git status --ignored, .env.local doit être ignoré. Aucun secret ne doit être préparé pour le commit.", "With git status --ignored, .env.local should be ignored. No secret should be staged for commit.", "عند تشغيل git status --ignored يجب تجاهل .env.local وألا يجهز أي سر للحفظ." ]),
    step(
      ["Un commit est une version locale. Un push l’envoie à GitHub.", "A commit is a local version. A push sends it to GitHub.", "Commit إصدار محلي وpush يرسله إلى GitHub."],
      ["Exécute les commandes une par une dans ton nouveau projet. Arrête-toi à git diff --cached pour relire les fichiers.", "Run the commands one at a time in your new project. Pause at git diff --cached to review files.", "نفذ الأوامر واحدًا تلو الآخر في مشروعك الجديد وتوقف عند git diff --cached لمراجعة الملفات."],
      ["Après le push, GitHub affiche ton commit et les fichiers attendus. Le site n’est pas encore déployé sur Vercel.", "After pushing, GitHub shows your commit and expected files. The site is not deployed to Vercel yet.", "بعد الرفع يعرض GitHub إصدارك والملفات المتوقعة. لم ينشر الموقع على Vercel بعد." ]),
    step(
      ["Vercel utilise ton dépôt et tes variables pour construire le site.", "Vercel uses your repository and environment variables to build the site.", "يستخدم Vercel المستودع ومتغيرات البيئة لبناء الموقع."],
      ["Importe ton dépôt de test dans Vercel. Vérifie le dossier de package.json et ajoute les variables de test avant de lancer le déploiement.", "Import your test repository into Vercel. Check the package.json folder and add test variables before deploying.", "استورد مستودعك التجريبي في Vercel وتحقق من مجلد package.json وأضف متغيرات الاختبار قبل النشر."],
      ["Un déploiement réussi fournit une URL. Si le build échoue, lis la première erreur dans ses logs.", "A successful deployment provides a URL. If the build fails, read the first error in its logs.", "يوفر النشر الناجح رابطًا. إذا فشل البناء فاقرأ أول خطأ في سجلاته." ]),
    step(
      ["Une URL qui fonctionne doit aussi afficher les bonnes données.", "A working URL must also show the correct data.", "يجب أن يعرض الرابط العامل البيانات الصحيحة أيضًا."],
      ["Ouvre le lien du déploiement sur ton téléphone. Vérifie une page, une image et un appel API avant de connecter un domaine.", "Open the deployment link on your phone. Check a page, an image and an API request before connecting a domain.", "افتح رابط النشر على هاتفك وافحص صفحة وصورة وطلب API قبل ربط النطاق."],
      ["La page se lit sans déborder, l’image charge et l’API répond avec les données attendues.", "The page fits the screen, the image loads and the API returns the expected data.", "تلائم الصفحة الشاشة وتظهر الصورة وتعيد API البيانات المتوقعة." ]),
    step(
      ["Une branche et un aperçu permettent de vérifier une modification avant publication.", "A branch and preview let you check a change before publishing it.", "يتيح الفرع والمعاينة التحقق من تغيير قبل نشره."],
      ["Dans ton projet de test, change un titre sur une branche, pousse-la puis compare l’aperçu Vercel au site publié.", "In your test project, change a heading on a branch, push it and compare the Vercel preview with the published site.", "في مشروعك التجريبي غير عنوانًا في فرع وارفعه ثم قارن معاينة Vercel بالموقع المنشور."],
      ["Le nouveau titre apparaît dans l’aperçu. Vérifie-le avant de fusionner vers la branche de production.", "The new heading appears in the preview. Check it before merging into the production branch.", "يظهر العنوان الجديد في المعاينة. تحققه قبل الدمج في فرع الإنتاج." ]),
  ],
};
