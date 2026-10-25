import type { courses } from './courses';
type Text = readonly [string, string, string];
export const courseGuidance: Record<(typeof courses)[number]['id'], { prerequisite: Text; outcome: Text }> = {
  'full-stack': { prerequisite: ['HTML, CSS, JavaScript et requêtes HTTP ; révisez le cours JavaScript si nécessaire.', 'HTML, CSS, JavaScript and HTTP requests; revise the JavaScript course when needed.', 'HTML وCSS وJavaScript وطلبات HTTP؛ راجع مقرر JavaScript عند الحاجة.'], outcome: ['Relier interface, API et données avec droits, tests et plan de reprise.', 'Connect UI, API and persistence with authorization, tests and a recovery plan.', 'اربط الواجهة وAPI والتخزين بالصلاحيات والاختبارات وخطة الاستعادة.'] },
  'ai-foundations': { prerequisite: ['Arithmétique de base ; exemples en arabe et anglais.', 'Basic arithmetic; Arabic introduction and English practical work.', 'حساب أساسي؛ مقدمة عربية وتطبيق إنجليزي.'], outcome: ['Comparer un modèle à une référence et analyser les erreurs.', 'Compare a candidate with a baseline and analyze errors.', 'قارن النتائج بخط أساس وحلل الأخطاء.'] },
  'llm-applications': { prerequisite: ['Fondations IA et lecture de tableaux ou JavaScript.', 'AI foundations; read tables or basic JavaScript.', 'أساسيات الذكاء الاصطناعي وقراءة الجداول أو JavaScript.'], outcome: ['Tester les preuves, citations et refus de deviner.', 'Test evidence, citations and abstention in a bounded fixture.', 'اختبر الأدلة والاستشهادات والامتناع عن التخمين في محاكاة محدودة.'] },
  'ai-agents': { prerequisite: ['JavaScript, fonctions et notions de droits d’accès.', 'JavaScript functions and basic access-control reasoning.', 'دوال JavaScript ومبادئ التحكم في الوصول.'], outcome: ['Tester un exécuteur limité et les refus d’accès.', 'Test a bounded runner and unauthorized proposals.', 'اختبر منفذاً محدوداً ورفض الطلبات غير المصرح بها.'] },
  'science-world': { prerequisite: ['Arithmétique simple ; cours en anglais.', 'Simple arithmetic; instruction is English.', 'حساب بسيط؛ التدريس بالإنجليزية.'], outcome: ['Mener une mesure et une comparaison du modèle des saisons.', 'Conduct a measurement and controlled seasons-model investigation.', 'نفذ قياساً واستقصاءً مضبوطاً لنموذج الفصول.'] },
  'computer-basics': {
    prerequisite: ['Aucune programmation requise.', 'No programming knowledge required.', 'لا تتطلب معرفة بالبرمجة.'],
    outcome: ['Expliquer le rôle du processeur, de la mémoire et du stockage.', 'Explain the roles of CPU, memory and storage.', 'اشرح دور المعالج والذاكرة والتخزين.'],
  },
  'academy-foundations': {
    prerequisite: ['Aucune expérience. Un ordinateur Windows pour les travaux pratiques.', 'No experience needed. Use a Windows computer for the practical labs.', 'ما تحتاج حتى تجربة. حاسوب Windows للتطبيق العملي.'],
    outcome: ['Organiser les fichiers, tester la livraison, créer une page HTML et suivre les données de la boutique.', 'Organize files, test a delivery rule, build an HTML product page and trace storefront data.', 'تنظم الملفات وتختبر قاعدة توصيل وتبني صفحة HTML وتتبع بيانات المتجر.'],
  },
  'iptv-live': {
    prerequisite: ['Aucune expérience IPTV. Un ordinateur pour Docker, OBS, VLC et FFmpeg ; caméra ou vidéo personnelle. Bases Web/React avant la phase application.', 'No IPTV experience needed. A computer for Docker, OBS, VLC and FFmpeg; a camera or your own video. Take web/React basics before the application phase.', 'لا تحتاج خبرة IPTV. حاسوب لتشغيل Docker وOBS وVLC وFFmpeg مع كاميرا أو فيديو تملكه. ادرس أساسيات الويب وReact قبل مرحلة برمجة التطبيق.'],
    outcome: ['Diffuser une chaîne locale, lire HLS, diagnostiquer les pannes et construire un lecteur.', 'Broadcast a local live channel, play HLS, troubleshoot failures and build a player.', 'ابث قناة محلية وشغّل HLS وشخّص الأعطال وابنِ مشغّلًا.'],
  },
  'real-site': {
    prerequisite: ['Aucune expérience. Commence par les outils et les premières lignes de code.', 'No experience needed. Start with tools and your first lines of code.', 'لا تحتاج خبرة. ابدأ بالأدوات وأول أسطر البرمجة.'],
    outcome: ['Reconstruire une boutique : interface, API, données, paiement, lancement et acquisition.', 'Rebuild a store: interface, APIs, data, payments, launch, and customer acquisition.', 'أعد بناء متجر: الواجهة وAPI والبيانات والدفع والإطلاق واكتساب العملاء.'],
  },
  python: {
    prerequisite: ['Aucune expérience Python. Prévois un ordinateur pour exécuter les ateliers.', 'No Python experience needed. Use a computer to run the workshops.', 'لا تحتاج خبرة في Python. استخدم حاسوبًا لتشغيل الورش.'],
    outcome: ['Créer un service de démonstration puis un outil de stock avec validation CSV, tests, SQL et rapport JSON.', 'Build a demo service, then an inventory tool with CSV validation, tests, SQL, and JSON reporting.', 'ابنِ خدمة تجريبية ثم أداة مخزون مع التحقق من CSV والاختبارات وSQL وتقارير JSON.'],
  },
  nextjs: {
    prerequisite: ['Les bases HTML, CSS et JavaScript sont incluses avant React et Next.js.', 'HTML, CSS, and JavaScript foundations are included before React and Next.js.', 'أساسيات HTML وCSS وJavaScript مضمّنة قبل React وNext.js.'],
    outcome: ['Construire et publier une boutique avec routes, formulaires, données serveur et tests.', 'Build and ship a store with routes, forms, server data, and tests.', 'ابنِ وانشر متجرًا بالصفحات والنماذج وبيانات الخادم والاختبارات.'],
  },
  api: {
    prerequisite: ['Commence par HTTP et JavaScript ; les exercices demandent de lancer un projet local.', 'Start with HTTP and JavaScript; exercises require running a local project.', 'ابدأ بـHTTP وJavaScript؛ تتطلب التمارين تشغيل مشروع محلي.'],
    outcome: ['Concevoir des routes validées, des droits d’accès et des webhooks, puis tester les erreurs.', 'Design validated routes, access controls, and webhooks, then test failure cases.', 'صمّم مسارات مع التحقق والصلاحيات وwebhooks ثم اختبر حالات الفشل.'],
  },
  database: {
    prerequisite: ['Aucune expérience SQL. Lis d’abord le module sur le Web et les API.', 'No SQL experience needed. Read the web and API module first.', 'لا تحتاج خبرة SQL. اقرأ أولًا وحدة الويب وAPI.'],
    outcome: ['Modéliser produits et commandes, écrire des requêtes, configurer RLS et préparer les sauvegardes.', 'Model products and orders, write queries, configure RLS, and plan backups.', 'نمذج المنتجات والطلبات واكتب الاستعلامات واضبط RLS وخطّط للنسخ الاحتياطي.'],
  },
  javascript: {
    prerequisite: ['Aucune expérience. HTML et CSS précèdent la programmation.', 'No experience needed. HTML and CSS come before programming.', 'لا تحتاج خبرة. تسبق HTML وCSS دروس البرمجة.'],
    outcome: ['Créer une interface responsive avec formulaires, états, requêtes et tests.', 'Build a responsive interface with forms, state, requests, and tests.', 'ابنِ واجهة متجاوبة بالنماذج والحالة والطلبات والاختبارات.'],
  },
  deploy: {
    prerequisite: ['Utilise un projet de démonstration qui fonctionne en local ; les outils et Git sont inclus.', 'Use a demo project that works locally; tools and Git are included.', 'استخدم مشروعًا تجريبيًا يعمل محليًا؛ الأدوات وGit مضمّنة.'],
    outcome: ['Publier une version testée, configurer le domaine, suivre les erreurs et préparer la restauration.', 'Ship a tested release, configure a domain, monitor errors, and prepare recovery.', 'انشر إصدارًا مختبرًا واضبط النطاق وراقب الأخطاء وجهّز الاستعادة.'],
  },
  iptv: {
    prerequisite: ['Les bases du Web et de React sont incluses. Prépare une vidéo que tu peux utiliser.', 'Web and React foundations are included. Prepare a video you can use.', 'أساسيات الويب وReact مضمّنة. جهّز فيديو يمكنك استخدامه.'],
    outcome: ['Créer un catalogue vidéo, un lecteur HLS, des favoris et un guide, puis tester et publier.', 'Create a video catalog, HLS player, favorites, and guide, then test and deploy.', 'أنشئ قائمة فيديو ومشغّل HLS ومفضّلة ودليلًا ثم اختبر وانشر.'],
  },
};
