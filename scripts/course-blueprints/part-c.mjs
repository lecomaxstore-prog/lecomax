/*
 * Advanced course blueprints (modules 19-27).
 * Every generated lesson has the same pedagogical depth in French, English,
 * and Arabic while keeping code, filenames, and technical identifiers stable.
 */

const tr = (fr, en, ar) => ({ fr, en, ar });

const topic = (title, focus, artifact, term, definition) => ({
  fr: { title: title.fr, focus: focus.fr, artifact: artifact.fr, term: term.fr, definition: definition.fr },
  en: { title: title.en, focus: focus.en, artifact: artifact.en, term: term.en, definition: definition.en },
  ar: { title: title.ar, focus: focus.ar, artifact: artifact.ar, term: term.ar, definition: definition.ar },
});

/*
 * The lesson specification supplies the exact concept and deliverable.  These
 * profiles add the engineering context that changes from one advanced domain
 * to another.  They deliberately describe trust boundaries and evidence
 * instead of promising that a copied snippet is production-ready.
 */
const domainProfiles = {
  quality: {
    prerequisite: tr(
      "Savoir exécuter une fonction pure, lire une assertion et inspecter l’état d’un dépôt Git sans modifier l’historique.",
      "Know how to run a pure function, read an assertion, and inspect a Git repository without rewriting history.",
      "معرفة تشغيل دالة نقية وقراءة التأكيد وفحص حالة مستودع Git من دون إعادة كتابة تاريخه."
    ),
    mental: tr(
      "La qualité est une chaîne de preuves : une attente explicite, une expérience reproductible, puis un résultat comparé à cette attente.",
      "Quality is a chain of evidence: an explicit expectation, a reproducible experiment, and a result compared with that expectation.",
      "الجودة سلسلة أدلة: توقع صريح وتجربة قابلة للتكرار ثم نتيجة تُقارن بذلك التوقع."
    ),
    analogy: tr(
      "Un test ressemble à un témoin scellé avant des travaux : il ne construit pas le bâtiment, mais révèle immédiatement si la rénovation a déplacé un mur important.",
      "A test is like a marker sealed before renovation: it does not build the house, but immediately reveals whether the work moved an important wall.",
      "الاختبار مثل علامة مختومة قبل الترميم: لا يبني المنزل لكنه يكشف فورًا إن حرّكت الأعمال جدارًا مهمًا."
    ),
    vocabulary: {
      fr: [{ term: "Régression", definition: "Comportement auparavant correct qui cesse de fonctionner après une modification." }, { term: "Reproduction minimale", definition: "Plus petit scénario déterministe qui déclenche encore le défaut étudié." }],
      en: [{ term: "Regression", definition: "Previously correct behavior that stops working after a change." }, { term: "Minimal reproduction", definition: "The smallest deterministic scenario that still triggers the defect being studied." }],
      ar: [{ term: "التراجع", definition: "سلوك كان صحيحًا ثم توقف عن العمل بعد تعديل." }, { term: "إعادة الإنتاج الدنيا", definition: "أصغر سيناريو حتمي ما زال يطلق الخلل المدروس." }],
    },
    risk: tr("modifier plusieurs variables à la fois et attribuer le résultat à la mauvaise cause", "changing several variables at once and attributing the result to the wrong cause", "تغيير عدة متغيرات معًا ونسب النتيجة إلى السبب الخطأ"),
    lecomax: tr("totaux du panier, transitions de commande et autorisations administrateur", "cart totals, order transitions, and administrator authorization", "إجماليات السلة وانتقالات الطلب وصلاحيات الإدارة"),
  },
  web: {
    prerequisite: tr(
      "Connaître le HTML sémantique, les métadonnées Next.js et la différence entre mesure de laboratoire et mesure d’utilisateurs réels.",
      "Understand semantic HTML, Next.js metadata, and the difference between laboratory and real-user measurement.",
      "فهم HTML الدلالي وبيانات Next.js الوصفية والفرق بين قياس المختبر وقياس المستخدمين الحقيقيين."
    ),
    mental: tr(
      "Une page de qualité possède trois publics simultanés : la personne qui l’utilise, la technologie d’assistance qui l’interprète et le robot qui la découvre.",
      "A high-quality page serves three audiences at once: the person using it, assistive technology interpreting it, and the crawler discovering it.",
      "تخدم الصفحة الجيدة ثلاثة جماهير معًا: الشخص الذي يستخدمها وتقنية المساعدة التي تفسرها والروبوت الذي يكتشفها."
    ),
    analogy: tr(
      "Une page web est une boutique physique : son enseigne doit être identifiable, ses allées praticables et son entrée assez rapide pour ne pas faire repartir le visiteur.",
      "A web page is a physical shop: its sign must be identifiable, its aisles usable, and its entrance fast enough not to turn visitors away.",
      "صفحة الويب متجر مادي: يجب أن تكون لافتته واضحة وممراته قابلة للاستخدام ومدخله سريعًا كي لا يغادر الزائر."
    ),
    vocabulary: {
      fr: [{ term: "Sémantique", definition: "Sens porté par l’élément HTML indépendamment de son apparence visuelle." }, { term: "Budget de performance", definition: "Limite mesurable de poids, de délai ou de stabilité qu’une page ne doit pas dépasser." }],
      en: [{ term: "Semantics", definition: "Meaning conveyed by an HTML element independently of its visual appearance." }, { term: "Performance budget", definition: "A measurable weight, latency, or stability limit that a page must not exceed." }],
      ar: [{ term: "الدلالة", definition: "المعنى الذي يحمله عنصر HTML بعيدًا عن مظهره البصري." }, { term: "ميزانية الأداء", definition: "حد قابل للقياس للوزن أو التأخير أو الثبات يجب ألا تتجاوزه الصفحة." }],
    },
    risk: tr("optimiser un score isolé tout en dégradant le parcours clavier ou le contenu visible", "optimizing one score while degrading keyboard use or visible content", "تحسين درجة منفردة مع إفساد استخدام لوحة المفاتيح أو المحتوى الظاهر"),
    lecomax: tr("fiches produit, résultats de recherche et parcours d’ajout au panier", "product pages, search results, and the add-to-cart journey", "صفحات المنتجات ونتائج البحث ومسار الإضافة إلى السلة"),
  },
  email: {
    prerequisite: tr(
      "Comprendre les variables d’environnement, async/await et la séparation entre code navigateur, route serveur et fournisseur de courrier.",
      "Understand environment variables, async/await, and the separation between browser code, server routes, and mail providers.",
      "فهم متغيرات البيئة وasync/await والفصل بين شيفرة المتصفح ومسارات الخادم ومزوّد البريد."
    ),
    mental: tr(
      "Un email est une livraison asynchrone : accepter la demande, remettre le message au fournisseur et constater sa livraison sont trois événements différents.",
      "Email is asynchronous delivery: accepting a request, handing the message to a provider, and observing delivery are three different events.",
      "البريد تسليم غير متزامن: قبول الطلب وتسليم الرسالة للمزوّد وملاحظة وصولها ثلاثة أحداث مختلفة."
    ),
    analogy: tr(
      "Envoyer un email ressemble à déposer un colis : le reçu du guichet prouve la prise en charge, pas l’ouverture du colis par son destinataire.",
      "Sending email is like posting a parcel: the counter receipt proves acceptance, not that the recipient opened the parcel.",
      "إرسال البريد يشبه إيداع طرد: إيصال المكتب يثبت الاستلام من المرسل لا فتح المستلم للطرد."
    ),
    vocabulary: {
      fr: [{ term: "Délivrabilité", definition: "Capacité d’un message légitime à atteindre la boîte attendue plutôt qu’un rejet ou le spam." }, { term: "Secret serveur", definition: "Identifiant sensible disponible seulement pendant l’exécution côté serveur." }],
      en: [{ term: "Deliverability", definition: "The ability of legitimate mail to reach the intended mailbox rather than rejection or spam." }, { term: "Server secret", definition: "Sensitive credential available only during server-side execution." }],
      ar: [{ term: "قابلية التسليم", definition: "قدرة البريد المشروع على بلوغ الصندوق المقصود بدل الرفض أو الرسائل المزعجة." }, { term: "سر الخادم", definition: "بيان اعتماد حساس لا يتاح إلا أثناء التنفيذ في الخادم." }],
    },
    risk: tr("confondre l’acceptation du fournisseur avec la livraison et réessayer sans clé de déduplication", "confusing provider acceptance with delivery and retrying without a deduplication key", "الخلط بين قبول المزوّد والتسليم وإعادة المحاولة بلا مفتاح إزالة تكرار"),
    lecomax: tr("confirmations de commande, demandes de contact et traitement de la boîte support", "order confirmations, contact requests, and support-inbox processing", "تأكيدات الطلب وطلبات الاتصال ومعالجة صندوق الدعم"),
  },
  payment: {
    prerequisite: tr(
      "Comprendre les centimes, les transactions de base de données, les appels serveur authentifiés et le fait qu’un webhook peut être livré plusieurs fois.",
      "Understand minor currency units, database transactions, authenticated server calls, and that a webhook may be delivered more than once.",
      "فهم الوحدات النقدية الصغرى ومعاملات قاعدة البيانات واستدعاءات الخادم الموثقة وأن webhook قد يصل أكثر من مرة."
    ),
    mental: tr(
      "Le fournisseur de paiement confirme un mouvement d’argent ; la boutique reste responsable du prix, de la commande interne et de la transition autorisée.",
      "The payment provider confirms movement of money; the store remains responsible for price, its internal order, and the allowed state transition.",
      "يؤكد مزوّد الدفع حركة المال؛ ويبقى المتجر مسؤولًا عن السعر والطلب الداخلي وانتقال الحالة المسموح."
    ),
    analogy: tr(
      "Le paiement ressemble au contrôle d’un billet : l’écran du voyageur n’est pas une preuve, seule une validation signée et rapprochée du dossier autorise le passage.",
      "Payment is like checking a ticket: the traveler’s screen is not proof; only signed validation reconciled with the record permits entry.",
      "الدفع مثل فحص التذكرة: شاشة المسافر ليست دليلًا؛ وحده تحقق موقّع ومطابق للسجل يسمح بالمرور."
    ),
    vocabulary: {
      fr: [{ term: "Rapprochement", definition: "Comparaison du paiement fournisseur avec la commande, la devise et le montant attendus côté serveur." }, { term: "Idempotence", definition: "Propriété garantissant que répéter le même événement ne répète pas son effet métier." }],
      en: [{ term: "Reconciliation", definition: "Comparing a provider payment with the order, currency, and amount expected by the server." }, { term: "Idempotency", definition: "Property ensuring that replaying the same event does not repeat its business effect." }],
      ar: [{ term: "المطابقة", definition: "مقارنة دفعة المزوّد بالطلب والعملة والمبلغ المتوقع في الخادم." }, { term: "عدم التكرار", definition: "خاصية تضمن ألا يكرر الحدث نفسه أثره التجاري عند إعادة إرساله." }],
    },
    risk: tr("faire confiance au montant du navigateur, ignorer la devise ou appliquer deux fois un événement rejoué", "trusting a browser amount, ignoring currency, or applying a replayed event twice", "الثقة بمبلغ المتصفح أو تجاهل العملة أو تطبيق الحدث المعاد مرتين"),
    lecomax: tr("création de commande, capture PayPal, remboursement et mise à jour de stock", "order creation, PayPal capture, refunds, and stock updates", "إنشاء الطلب والتقاط PayPal والاسترداد وتحديث المخزون"),
  },
  notification: {
    prerequisite: tr(
      "Comprendre les permissions navigateur, les Service Workers, les webhooks signés et la différence entre consentement et préférence de canal.",
      "Understand browser permissions, Service Workers, signed webhooks, and the difference between consent and channel preference.",
      "فهم أذونات المتصفح وعمال الخدمة وwebhooks الموقعة والفرق بين الموافقة وتفضيل القناة."
    ),
    mental: tr(
      "Une notification est une décision avant d’être un message : événement admissible, destinataire autorisé, canal disponible, fréquence acceptable, puis livraison observable.",
      "A notification is a decision before it is a message: eligible event, authorized recipient, available channel, acceptable frequency, then observable delivery.",
      "الإشعار قرار قبل أن يكون رسالة: حدث مؤهل ومستلم مخوّل وقناة متاحة وتكرار مقبول ثم تسليم قابل للملاحظة."
    ),
    analogy: tr(
      "Un orchestrateur de notifications est un standard téléphonique : il choisit une ligne autorisée et évite d’appeler trois fois pour la même information.",
      "A notification orchestrator is a switchboard: it chooses an authorized line and avoids calling three times with the same information.",
      "منسق الإشعارات لوحة تحويل: يختار خطًا مسموحًا ويتجنب الاتصال ثلاث مرات بالمعلومة نفسها."
    ),
    vocabulary: {
      fr: [{ term: "Préférence de canal", definition: "Choix révocable indiquant par quel moyen un utilisateur accepte certains messages." }, { term: "Déduplication", definition: "Rejet d’une livraison déjà traitée grâce à un identifiant externe stable." }],
      en: [{ term: "Channel preference", definition: "A revocable choice stating how a user accepts particular messages." }, { term: "Deduplication", definition: "Rejecting an already processed delivery by using a stable external identifier." }],
      ar: [{ term: "تفضيل القناة", definition: "اختيار قابل للسحب يحدد الوسيلة التي يقبل بها المستخدم رسائل معينة." }, { term: "إزالة التكرار", definition: "رفض تسليم عولج سابقًا باستخدام معرّف خارجي ثابت." }],
    },
    risk: tr("solliciter une permission sans intention claire, ignorer un refus ou multiplier les canaux pour le même événement", "requesting permission without clear intent, ignoring refusal, or multiplying channels for the same event", "طلب الإذن بلا غرض واضح أو تجاهل الرفض أو مضاعفة القنوات للحدث نفسه"),
    lecomax: tr("alertes de commande, disponibilité produit et conversations WhatsApp du support", "order alerts, product availability, and WhatsApp support conversations", "تنبيهات الطلب وتوفر المنتج ومحادثات دعم واتساب"),
  },
  ai: {
    prerequisite: tr(
      "Comprendre les routes serveur, la validation d’objets inconnus, les limites de capacité et la facturation par unités d’usage.",
      "Understand server routes, validation of unknown objects, capability limits, and usage-based billing.",
      "فهم مسارات الخادم والتحقق من الكائنات المجهولة وحدود القدرات والفوترة حسب الاستخدام."
    ),
    mental: tr(
      "Un modèle est un service probabiliste non fiable : son entrée est une donnée, sa sortie est une proposition, et aucune des deux ne reçoit implicitement une autorité métier.",
      "A model is an untrusted probabilistic service: its input is data, its output is a proposal, and neither receives implicit business authority.",
      "النموذج خدمة احتمالية غير موثوقة: مدخله بيانات ومخرجه اقتراح ولا يحصل أي منهما ضمنيًا على صلاحية تجارية."
    ),
    analogy: tr(
      "Le modèle ressemble à un stagiaire très rapide : donnez-lui un dossier limité, contrôlez le budget et relisez toujours son travail avant publication.",
      "The model is like a very fast trainee: give it a limited file, control the budget, and always review its work before publication.",
      "النموذج مثل متدرب سريع جدًا: أعطه ملفًا محدودًا واضبط الميزانية وراجع عمله دائمًا قبل النشر."
    ),
    vocabulary: {
      fr: [{ term: "Limite de capacité", definition: "Restriction technique empêchant le modèle d’accéder à une action ou une donnée non nécessaire." }, { term: "Sortie non fiable", definition: "Valeur qui doit être validée, bornée et parfois approuvée avant tout effet métier." }],
      en: [{ term: "Capability boundary", definition: "A technical restriction preventing the model from reaching an unnecessary action or datum." }, { term: "Untrusted output", definition: "A value that must be validated, bounded, and sometimes approved before any business effect." }],
      ar: [{ term: "حد القدرة", definition: "قيد تقني يمنع النموذج من الوصول إلى فعل أو بيان غير ضروري." }, { term: "مخرج غير موثوق", definition: "قيمة يجب التحقق منها وتقييدها وأحيانًا اعتمادها قبل أي أثر تجاري." }],
    },
    risk: tr("traiter une consigne dans le texte comme une autorisation, exposer un secret ou publier une sortie non validée", "treating text instructions as authorization, exposing a secret, or publishing unvalidated output", "اعتبار التعليمات النصية تفويضًا أو كشف سر أو نشر مخرج غير متحقق منه"),
    lecomax: tr("brouillons de fiches produit et assistance éditoriale sans accès aux paiements ni aux données privées", "product-page drafts and editorial assistance without access to payments or private data", "مسودات صفحات المنتجات والمساعدة التحريرية بلا وصول إلى الدفع أو البيانات الخاصة"),
  },
  analytics: {
    prerequisite: tr(
      "Comprendre les événements métier, les états de consentement et la différence entre corrélation observée et causalité démontrée.",
      "Understand business events, consent states, and the difference between observed correlation and demonstrated causation.",
      "فهم أحداث العمل وحالات الموافقة والفرق بين الارتباط المرصود والسببية المثبتة."
    ),
    mental: tr(
      "L’analytics est un instrument de décision, pas une copie du client : chaque propriété collectée doit répondre à une question définie et respecter son consentement.",
      "Analytics is a decision instrument, not a copy of the customer: every collected property must answer a defined question and respect consent.",
      "التحليلات أداة قرار وليست نسخة من العميل: يجب أن تجيب كل خاصية مجمعة عن سؤال محدد وتحترم الموافقة."
    ),
    analogy: tr(
      "Mesurer un produit ressemble au tableau de bord d’une voiture : quelques indicateurs fiables aident à conduire, tandis qu’enregistrer chaque geste distrait et augmente le risque.",
      "Product measurement is like a car dashboard: a few reliable indicators help you drive, while recording every movement distracts and increases risk.",
      "قياس المنتج مثل لوحة السيارة: مؤشرات قليلة موثوقة تساعد على القيادة بينما تسجيل كل حركة يشتت ويزيد الخطر."
    ),
    vocabulary: {
      fr: [{ term: "Minimisation", definition: "Collecte limitée aux données nécessaires pour une finalité annoncée et mesurable." }, { term: "Métrique garde-fou", definition: "Mesure indépendante qui révèle un dommage créé par l’optimisation principale." }],
      en: [{ term: "Minimization", definition: "Collection limited to data necessary for a stated, measurable purpose." }, { term: "Guardrail metric", definition: "An independent measure that reveals harm caused by optimizing the primary metric." }],
      ar: [{ term: "تقليل البيانات", definition: "حصر الجمع في البيانات اللازمة لغرض معلن وقابل للقياس." }, { term: "مقياس الحماية", definition: "قياس مستقل يكشف الضرر الناتج عن تحسين المقياس الأساسي." }],
    },
    risk: tr("collecter avant consentement, changer la définition d’un événement ou confondre évolution et effet causal", "collecting before consent, changing an event definition, or confusing movement with causal effect", "الجمع قبل الموافقة أو تغيير تعريف الحدث أو الخلط بين التغير والأثر السببي"),
    lecomax: tr("vues produit, ajouts au panier, achats et expériences de présentation", "product views, cart additions, purchases, and presentation experiments", "مشاهدات المنتج والإضافة إلى السلة والشراء وتجارب العرض"),
  },
  operations: {
    prerequisite: tr(
      "Comprendre les branches Git, les environnements Vercel, les enregistrements DNS et la différence entre une sauvegarde créée et une restauration testée.",
      "Understand Git branches, Vercel environments, DNS records, and the difference between creating a backup and testing a restore.",
      "فهم فروع Git وبيئات Vercel وسجلات DNS والفرق بين إنشاء نسخة احتياطية واختبار استعادتها."
    ),
    mental: tr(
      "L’exploitation est une boucle : changement vérifié, déploiement identifiable, signaux surveillés, décision d’incident et reprise répétée avant le jour où elle devient urgente.",
      "Operations is a loop: verified change, identifiable deployment, monitored signals, incident decision, and recovery rehearsed before it becomes urgent.",
      "التشغيل حلقة: تغيير متحقق منه ونشر قابل للتعريف وإشارات مراقبة وقرار حادث واستعادة متدربة قبل أن تصبح عاجلة."
    ),
    analogy: tr(
      "Mettre en production ressemble à exploiter un pont : le plan de construction ne suffit pas ; il faut des capteurs, un responsable d’alerte et un itinéraire de secours testé.",
      "Running production is like operating a bridge: construction plans are not enough; it needs sensors, an alert owner, and a tested emergency route.",
      "تشغيل الإنتاج مثل تشغيل جسر: لا تكفي مخططات البناء؛ بل تلزم حساسات ومالك للتنبيه وطريق طوارئ مختبر."
    ),
    vocabulary: {
      fr: [{ term: "Déploiement immuable", definition: "Version identifiable qui n’est pas modifiée après construction et peut être promue ou abandonnée." }, { term: "Exercice de restauration", definition: "Récupération chronométrée de données sauvegardées dans un environnement isolé avec vérification d’intégrité." }],
      en: [{ term: "Immutable deployment", definition: "An identifiable version that is not changed after build and can be promoted or abandoned." }, { term: "Restore drill", definition: "Timed recovery of backed-up data in isolation with integrity verification." }],
      ar: [{ term: "نشر غير قابل للتغيير", definition: "نسخة محددة لا تتغير بعد البناء ويمكن ترقيتها أو التخلي عنها." }, { term: "تدريب الاستعادة", definition: "استرجاع موقّت لبيانات النسخة في بيئة معزولة مع فحص سلامتها." }],
    },
    risk: tr("promouvoir un artefact non vérifié, modifier DNS sans plan de retour ou découvrir pendant l’incident que la sauvegarde est inutilisable", "promoting an unverified artifact, changing DNS without rollback, or discovering during an incident that a backup is unusable", "ترقية أثر غير متحقق أو تغيير DNS بلا رجوع أو اكتشاف عدم صلاحية النسخة أثناء الحادث"),
    lecomax: tr("pipeline GitHub, previews Vercel, domaine marchand, alertes de commande et données Supabase", "the GitHub pipeline, Vercel previews, commerce domain, order alerts, and Supabase data", "خط GitHub ومعاينات Vercel ونطاق المتجر وتنبيهات الطلب وبيانات Supabase"),
  },
  capstone: {
    prerequisite: tr(
      "Avoir terminé les modules précédents et pouvoir expliquer le parcours d’une commande du navigateur jusqu’au paiement, à la base et aux notifications.",
      "Have completed the previous modules and be able to explain an order journey from the browser through payment, database, and notifications.",
      "إكمال الوحدات السابقة والقدرة على شرح مسار الطلب من المتصفح عبر الدفع وقاعدة البيانات والإشعارات."
    ),
    mental: tr(
      "Le projet final n’est pas une collection de pages : c’est un ensemble de contrats reliés dont chaque mutation possède une autorité, une preuve et une stratégie de reprise.",
      "The final project is not a collection of pages: it is a connected set of contracts in which every mutation has an authority, evidence, and a recovery strategy.",
      "المشروع النهائي ليس مجموعة صفحات: إنه عقود مترابطة لكل تعديل فيها سلطة ودليل واستراتيجية استعادة."
    ),
    analogy: tr(
      "Assembler la boutique ressemble à diriger un orchestre : chaque instrument peut fonctionner seul, mais la partition commune fixe l’ordre, les entrées et la réaction à une fausse note.",
      "Assembling the store is like conducting an orchestra: each instrument can work alone, but the shared score defines order, entrances, and the response to a wrong note.",
      "تجميع المتجر مثل قيادة أوركسترا: قد تعمل كل آلة وحدها لكن النوتة المشتركة تحدد الترتيب والدخول والاستجابة للنغمة الخاطئة."
    ),
    vocabulary: {
      fr: [{ term: "Critère d’acceptation", definition: "Condition observable et testable qui doit être satisfaite pour déclarer un flux terminé." }, { term: "Frontière de confiance", definition: "Passage où données ou autorité changent de niveau et exigent validation ou contrôle d’accès." }],
      en: [{ term: "Acceptance criterion", definition: "An observable, testable condition that must hold before a flow is declared complete." }, { term: "Trust boundary", definition: "A crossing where data or authority changes level and requires validation or access control." }],
      ar: [{ term: "معيار القبول", definition: "شرط قابل للملاحظة والاختبار يجب تحققه قبل إعلان اكتمال التدفق." }, { term: "حد الثقة", definition: "نقطة عبور يتغير عندها مستوى البيانات أو السلطة فتحتاج تحققًا أو ضبط وصول." }],
    },
    risk: tr("relier les écrans sans définir les transitions, les responsabilités et la reprise après échec partiel", "connecting screens without defining transitions, ownership, and recovery from partial failure", "ربط الشاشات بلا تعريف الانتقالات والمسؤوليات والاستعادة من الفشل الجزئي"),
    lecomax: tr("architecture, catalogue, panier, paiement, administration, communication et exploitation réunis", "architecture, catalog, cart, payment, administration, communication, and operations together", "البنية والكتالوج والسلة والدفع والإدارة والتواصل والتشغيل مجتمعة"),
  },
};

const lessonDomains = {
  "test-strategy": "quality", "git-advanced": "quality", "systematic-debugging": "quality", "safe-refactoring": "quality",
  "seo-metadata": "web", "accessible-interface": "web", "performance-core-web-vitals": "web", "quality-audit": "web",
  "resend-transactional": "email", "nodemailer-smtp": "email", "imap-inbox": "email", "emailjs-browser": "email",
  "paypal-order-lifecycle": "payment", "paypal-webhook": "payment", "refund-workflow": "payment", "payment-idempotency": "payment",
  "web-push-subscription": "notification", "service-worker-notification": "notification", "whatsapp-webhook": "notification", "notification-orchestration": "notification",
  "openai-server-call": "ai", "ai-safety": "ai", "ai-cost-control": "ai", "ai-output-validation": "ai",
  "analytics-event-contract": "analytics", "analytics-consent": "analytics", "funnel-analysis": "analytics", "ethical-growth-experiment": "analytics",
  "github-release-workflow": "operations", "vercel-environments": "operations", "namecheap-dns": "operations", "monitoring-backups": "operations",
  "capstone-architecture": "capstone", "capstone-catalog": "capstone", "capstone-purchase": "capstone", "capstone-production": "capstone",
};

/* Every lesson owns a concrete scenario, proof, failure, safeguard, and handoff. */
const lessonGuidance = {
  "test-strategy": {
    scenario: tr("le calcul du total d’une ligne panier pour une quantité normale, nulle et invalide", "cart-line total calculation for normal, zero, and invalid quantities", "حساب إجمالي سطر السلة للكمية العادية والصفرية وغير الصالحة"),
    evidence: tr("le rapport de node --test affiche deux tests réussis et un futur cas invalide échoue pour la raison attendue", "the node --test report shows two passing tests and a future invalid case fails for the intended reason", "يعرض تقرير node --test اختبارين ناجحين وتفشل حالة غير صالحة مستقبلية للسبب المقصود"),
    failure: tr("une modification d’arrondi casse le total mais aucun test proche de la règle ne le signale", "a rounding change breaks the total but no test close to the rule reports it", "يكسر تعديل التقريب الإجمالي ولا يبلغ عنه اختبار قريب من القاعدة"),
    guard: tr("tester la règle pure avec valeurs limites, puis réserver les parcours navigateur aux contrats entre composants", "test the pure rule with boundary values, then reserve browser journeys for contracts between components", "اختبار القاعدة النقية بقيم الحدود وتخصيص مسارات المتصفح للعقود بين المكونات"),
    next: tr("La leçon suivante place cette preuve dans un commit Git petit, inspectable et réversible.", "The next lesson places this evidence in a small, inspectable, reversible Git commit.", "يضع الدرس التالي هذا الدليل في إيداع Git صغير قابل للفحص والرجوع."),
  },
  "git-advanced": {
    scenario: tr("une refactorisation du panier réalisée sur une branche pendant que d’autres fichiers locaux restent inachevés", "a cart refactor made on a branch while other local files remain unfinished", "إعادة هيكلة السلة في فرع مع بقاء ملفات محلية أخرى غير مكتملة"),
    evidence: tr("git diff --cached --check ne signale rien et git show --stat HEAD ne contient que les fichiers intentionnels", "git diff --cached --check reports nothing and git show --stat HEAD contains only intentional files", "لا يبلغ git diff --cached --check عن شيء ويحتوي git show --stat HEAD الملفات المقصودة فقط"),
    failure: tr("un git add global mélange secrets, fichiers générés et refactoring dans le même instantané", "a global git add mixes secrets, generated files, and refactoring in one snapshot", "يمزج git add شامل الأسرار والملفات المولدة وإعادة الهيكلة في لقطة واحدة"),
    guard: tr("préparer le chemin ciblé, inspecter le diff indexé, puis utiliser revert plutôt qu’une réécriture destructive sur une branche partagée", "stage the targeted path, inspect the staged diff, then use revert instead of destructive rewriting on a shared branch", "تجهيز المسار المستهدف وفحص الفرق المجهز ثم استخدام revert بدل إعادة كتابة مدمرة لفرع مشترك"),
    next: tr("La leçon suivante utilise l’historique et les observations pour réduire méthodiquement un défaut de commande.", "The next lesson uses history and observations to methodically narrow an order defect.", "يستخدم الدرس التالي التاريخ والملاحظات لتضييق خلل الطلب منهجيًا."),
  },
  "systematic-debugging": {
    scenario: tr("une commande présente en base mais recherchée avec un identifiant absent ou transformé", "an order present in storage but queried with a missing or transformed identifier", "طلب موجود في التخزين لكن يُبحث عنه بمعرّف مفقود أو محوّل"),
    evidence: tr("la reproduction produit ORDER_NOT_FOUND avec l’identifiant de test, puis le cas valide affiche exactement le total attendu", "the reproduction emits ORDER_NOT_FOUND with the test identifier, then the valid case prints exactly the expected total", "تنتج إعادة الحالة ORDER_NOT_FOUND مع معرّف الاختبار ثم تعرض الحالة الصحيحة الإجمالي المتوقع بدقة"),
    failure: tr("des logs aléatoires et plusieurs corrections simultanées font disparaître le symptôme sans identifier la cause", "random logs and several simultaneous fixes make the symptom disappear without identifying the cause", "تجعل سجلات عشوائية وإصلاحات متزامنة العارض يختفي بلا تحديد السبب"),
    guard: tr("figer l’entrée, écrire une hypothèse falsifiable, observer une frontière à la fois et retirer les données personnelles des traces", "freeze the input, write a falsifiable hypothesis, observe one boundary at a time, and remove personal data from logs", "تثبيت المدخل وكتابة فرضية قابلة للدحض ومراقبة حد واحد كل مرة وإزالة البيانات الشخصية من السجلات"),
    next: tr("La leçon suivante transforme le code diagnostiqué par petites extractions protégées par une assertion.", "The next lesson changes the diagnosed code through small extractions protected by an assertion.", "يغير الدرس التالي الشيفرة المشخّصة باستخراجات صغيرة تحميها تأكيدات."),
  },
  "safe-refactoring": {
    scenario: tr("un calcul panier trop compact dont on veut séparer total de ligne et total global sans modifier 398", "an overly compact cart calculation whose line and aggregate totals must be separated without changing 398", "حساب سلة شديد التكثيف نريد فصل إجمالي السطر والإجمالي العام فيه من دون تغيير 398"),
    evidence: tr("l’assertion de non-régression et les tests existants produisent les mêmes valeurs avant et après chaque extraction", "the regression assertion and existing tests produce the same values before and after every extraction", "ينتج تأكيد منع التراجع والاختبارات القائمة القيم نفسها قبل كل استخراج وبعده"),
    failure: tr("le refactoring ajoute simultanément une règle de remise et il devient impossible de savoir pourquoi le résultat change", "the refactor adds a discount rule at the same time, making the changed result impossible to attribute", "تضيف إعادة الهيكلة قاعدة خصم بالتزامن فيتعذر معرفة سبب تغير النتيجة"),
    guard: tr("capturer d’abord le comportement, renommer ou extraire une seule responsabilité, exécuter la preuve, puis seulement continuer", "capture behavior first, rename or extract one responsibility, run the proof, and only then continue", "تثبيت السلوك أولًا ثم تسمية أو استخراج مسؤولية واحدة وتشغيل الدليل قبل المتابعة"),
    next: tr("Le module suivant applique la même preuve observable à la découvrabilité, l’accessibilité et la vitesse des pages.", "The next module applies the same observable-evidence discipline to page discovery, accessibility, and speed.", "تطبق الوحدة التالية انضباط الدليل القابل للملاحظة على اكتشاف الصفحة وإتاحتها وسرعتها."),
  },

  "seo-metadata": {
    scenario: tr("une fiche produit accessible par plusieurs URL qui doit afficher un titre et une canonique cohérents avec le produit visible", "a product page reachable through several URLs that needs a title and canonical matching the visible product", "صفحة منتج تصل إليها روابط متعددة وتحتاج عنوانًا ورابطًا أساسيًا مطابقين للمنتج الظاهر"),
    evidence: tr("le HTML construit contient un title distinct, une description utile, la canonique attendue et des données Open Graph identiques au contenu", "the built HTML contains a distinct title, useful description, expected canonical, and Open Graph data matching the content", "يحتوي HTML المبني عنوانًا مميزًا ووصفًا مفيدًا والرابط الأساسي المتوقع وبيانات Open Graph مطابقة للمحتوى"),
    failure: tr("toutes les fiches partagent les métadonnées du layout et les moteurs ne distinguent plus les produits", "all product pages inherit layout metadata and crawlers can no longer distinguish products", "ترث كل صفحات المنتجات بيانات التخطيط فلا تعود العناكب تميز المنتجات"),
    guard: tr("générer les métadonnées depuis la même source produit validée que le rendu, avec une URL absolue stable en production", "generate metadata from the same validated product source as the rendering, with a stable absolute production URL", "توليد البيانات الوصفية من مصدر المنتج المتحقق نفسه المستخدم في العرض مع رابط إنتاج مطلق ثابت"),
    next: tr("La leçon suivante vérifie que la même fiche reste compréhensible et opérable sans souris ni vision de la couleur.", "The next lesson verifies that the same page remains understandable and operable without a mouse or color vision.", "يتحقق الدرس التالي من بقاء الصفحة مفهومة وقابلة للتشغيل بلا فأرة أو رؤية للألوان."),
  },
  "accessible-interface": {
    scenario: tr("une carte produit dont le bouton et l’état de stock doivent être compris dans l’ordre de lecture et activés au clavier", "a product card whose button and stock state must be understood in reading order and operated by keyboard", "بطاقة منتج يجب فهم زرها وحالة مخزونها بترتيب القراءة وتشغيلها بلوحة المفاتيح"),
    evidence: tr("Tab atteint le bouton dans un ordre logique, Entrée l’active, et le lecteur d’écran annonce son nom ainsi que l’état de stock associé", "Tab reaches the button in logical order, Enter activates it, and a screen reader announces its name and associated stock state", "يصل Tab إلى الزر بترتيب منطقي ويفعله Enter ويعلن قارئ الشاشة اسمه وحالة المخزون المرتبطة"),
    failure: tr("une div cliquable visible fonctionne à la souris mais n’a ni rôle, ni nom, ni comportement clavier", "a visible clickable div works with a mouse but has no role, name, or keyboard behavior", "يعمل div مرئي قابل للنقر بالفأرة لكنه بلا دور أو اسم أو سلوك لوحة مفاتيح"),
    guard: tr("choisir d’abord l’élément HTML natif, garder un focus visible et tester le parcours réel au clavier avec les annonces", "choose the native HTML element first, keep focus visible, and test the real keyboard journey with announcements", "اختيار عنصر HTML الأصلي أولًا وإبقاء التركيز ظاهرًا واختبار المسار الفعلي بلوحة المفاتيح مع الإعلانات"),
    next: tr("La leçon suivante protège la rapidité et la stabilité visuelle de cette interface sur un appareil contraint.", "The next lesson protects the interface’s speed and visual stability on a constrained device.", "يحمي الدرس التالي سرعة الواجهة وثباتها البصري على جهاز محدود."),
  },
  "performance-core-web-vitals": {
    scenario: tr("un hero produit dont la grande image détermine le LCP et peut déplacer le contenu si ses dimensions ne sont pas réservées", "a product hero whose large image determines LCP and can shift content when dimensions are not reserved", "قسم منتج تحدد صورته الكبيرة LCP وقد تحرك المحتوى إن لم تُحجز أبعادها"),
    evidence: tr("une mesure avant/après montre l’élément LCP attendu, aucun déplacement lié à l’image et aucune priorité donnée aux images hors écran", "a before-and-after measurement shows the expected LCP element, no image-related shift, and no priority given to offscreen images", "يظهر قياس قبل وبعد عنصر LCP المتوقع ولا تحرك بسبب الصورة ولا أولوية لصور خارج الشاشة"),
    failure: tr("ajouter priority à toutes les images concurrence la ressource principale et ralentit la page au lieu de l’aider", "adding priority to every image competes with the main resource and slows the page instead of helping", "تتنافس كل الصور عند إضافة priority إليها مع المورد الرئيسي فتبطئ الصفحة بدل تحسينها"),
    guard: tr("mesurer le goulot réel, réserver largeur et hauteur, prioriser seulement l’image LCP et remesurer sur réseau et processeur contraints", "measure the actual bottleneck, reserve width and height, prioritize only the LCP image, and remeasure with constrained network and CPU", "قياس عنق الزجاجة الحقيقي وحجز العرض والارتفاع وإعطاء الأولوية لصورة LCP فقط وإعادة القياس بشبكة ومعالج محدودين"),
    next: tr("La leçon suivante rassemble SEO, accessibilité et performance dans un audit reproductible classé par impact.", "The next lesson combines SEO, accessibility, and performance in a reproducible, impact-ranked audit.", "يجمع الدرس التالي SEO والإتاحة والأداء في تدقيق قابل للتكرار مرتب حسب الأثر."),
  },
  "quality-audit": {
    scenario: tr("une page produit prête à publier qui doit être auditée avec les mêmes critères par une autre personne", "a product page ready to ship that another person must audit with the same criteria", "صفحة منتج جاهزة للنشر يجب أن يدققها شخص آخر بالمعايير نفسها"),
    evidence: tr("la liste contient pour chaque constat une URL, une reproduction, une mesure initiale, une correction et une mesure de contrôle", "the checklist records a URL, reproduction, baseline, correction, and verification measurement for every finding", "تسجل القائمة لكل ملاحظة رابطًا وإعادة إنتاج وخط أساس وإصلاحًا وقياس تحقق"),
    failure: tr("un score Lighthouse unique est archivé sans appareil, scénario ni preuve que les parcours clavier fonctionnent", "a single Lighthouse score is saved without device, scenario, or proof that keyboard journeys work", "تُحفظ درجة Lighthouse منفردة بلا جهاز أو سيناريو أو دليل على عمل مسارات لوحة المفاتيح"),
    guard: tr("combiner vérifications automatiques et manuelles, conserver le contexte de mesure et prioriser blocages utilisateur avant micro-optimisations", "combine automated and manual checks, retain measurement context, and prioritize user blockers before micro-optimizations", "دمج الفحوص الآلية واليدوية وحفظ سياق القياس وترتيب عوائق المستخدم قبل التحسينات الدقيقة"),
    next: tr("Le module suivant applique ces frontières observables aux systèmes d’email asynchrones.", "The next module applies these observable boundaries to asynchronous email systems.", "تطبق الوحدة التالية هذه الحدود القابلة للملاحظة على أنظمة البريد غير المتزامنة."),
  },

  "resend-transactional": {
    scenario: tr("une confirmation de commande déclenchée côté serveur après une transition payée et corrélée à un identifiant interne", "an order receipt triggered server-side after a paid transition and correlated with an internal identifier", "تأكيد طلب يطلقه الخادم بعد انتقال الدفع ويرتبط بمعرّف داخلي"),
    evidence: tr("Resend accepte un message contenant la référence attendue, le serveur conserve son identifiant fournisseur et aucune clé n’atteint le navigateur", "Resend accepts a message containing the expected reference, the server retains its provider identifier, and no key reaches the browser", "يقبل Resend رسالة فيها المرجع المتوقع ويحفظ الخادم معرّف المزوّد ولا يصل أي مفتاح إلى المتصفح"),
    failure: tr("le checkout envoie directement l’email avant confirmation du paiement et un rechargement produit deux reçus", "checkout sends mail directly before payment confirmation and a reload creates two receipts", "يرسل الدفع البريد مباشرة قبل تأكيد الدفعة وينتج التحديث إيصالين"),
    guard: tr("déclencher depuis l’état serveur confirmé, valider destinataire et référence, puis stocker une clé d’envoi idempotente", "trigger from confirmed server state, validate recipient and reference, then store an idempotent send key", "الإطلاق من حالة خادم مؤكدة والتحقق من المستلم والمرجع ثم حفظ مفتاح إرسال غير متكرر"),
    next: tr("La leçon suivante remplace l’API spécialisée par un transport SMTP dont la connexion est vérifiée séparément.", "The next lesson replaces the specialized API with an SMTP transport whose connection is verified separately.", "يستبدل الدرس التالي API المتخصصة بنقل SMTP تُفحص اتصاليته منفصلة."),
  },
  "nodemailer-smtp": {
    scenario: tr("un serveur SMTP authentifié par variables privées dont on veut tester la configuration sans envoyer de message client", "an SMTP server authenticated with private variables whose configuration must be tested without sending customer mail", "خادم SMTP موثق بمتغيرات خاصة نريد اختبار إعداده بلا إرسال بريد عميل"),
    evidence: tr("transport.verify réussit dans l’environnement serveur autorisé et échoue clairement lorsque hôte, port, TLS ou identifiants sont incorrects", "transport.verify succeeds in the authorized server environment and fails clearly for wrong host, port, TLS, or credentials", "ينجح transport.verify في بيئة الخادم المسموحة ويفشل بوضوح عند خطأ المضيف أو المنفذ أو TLS أو الاعتماد"),
    failure: tr("secure true est associé au port STARTTLS 587 ou les secrets SMTP sont importés dans un composant client", "secure true is paired with STARTTLS port 587 or SMTP secrets are imported by a client component", "يُجمع secure true مع منفذ STARTTLS 587 أو تُستورد أسرار SMTP في مكوّن عميل"),
    guard: tr("faire correspondre port et mode TLS à la documentation du fournisseur, vérifier au démarrage serveur et ne jamais préfixer les secrets par NEXT_PUBLIC", "match port and TLS mode to provider documentation, verify on the server, and never prefix secrets with NEXT_PUBLIC", "مطابقة المنفذ ووضع TLS بوثائق المزوّد والتحقق في الخادم وعدم بدء الأسرار بـ NEXT_PUBLIC"),
    next: tr("La leçon suivante passe de l’envoi SMTP à la lecture IMAP avec verrou de boîte et nettoyage garanti.", "The next lesson moves from SMTP sending to IMAP reading with mailbox locking and guaranteed cleanup.", "ينتقل الدرس التالي من إرسال SMTP إلى قراءة IMAP بقفل الصندوق وتنظيف مضمون."),
  },
  "imap-inbox": {
    scenario: tr("un traitement support qui compte ou lit INBOX sans laisser une connexion ni un verrou ouverts après erreur", "a support process that counts or reads INBOX without leaving a connection or lock open after failure", "معالجة دعم تعد أو تقرأ INBOX بلا ترك اتصال أو قفل مفتوح بعد الفشل"),
    evidence: tr("la connexion sécurisée s’ouvre, le verrou protège l’opération et le bloc finally libère puis déconnecte aussi bien en succès qu’en exception", "the secure connection opens, the lock protects the operation, and finally releases and logs out on both success and exception", "يفتح الاتصال الآمن ويحمي القفل العملية وتحرر finally القفل وتسجل الخروج عند النجاح والاستثناء"),
    failure: tr("une exception pendant la lecture conserve le verrou INBOX et les exécutions suivantes restent bloquées", "an exception while reading retains the INBOX lock and later runs remain blocked", "يحتفظ استثناء أثناء القراءة بقفل INBOX فتظل التشغيلات التالية عالقة"),
    guard: tr("acquérir le verrou le plus tard possible, entourer toute lecture de try/finally et borner durée, volume et données journalisées", "acquire the lock as late as possible, wrap all reading in try/finally, and bound duration, volume, and logged data", "الحصول على القفل متأخرًا وإحاطة القراءة بـ try/finally وتقييد المدة والحجم والبيانات المسجلة"),
    next: tr("La leçon suivante examine EmailJS, où la clé publique est volontairement visible mais où le spam doit être limité ailleurs.", "The next lesson examines EmailJS, where the public key is intentionally visible but spam must be limited elsewhere.", "يفحص الدرس التالي EmailJS حيث المفتاح العام ظاهر عمدًا لكن يجب الحد من الإزعاج في مكان آخر."),
  },
  "emailjs-browser": {
    scenario: tr("un petit formulaire public qui remet un message via EmailJS sans confondre clé publique et secret serveur", "a small public form that hands a message to EmailJS without confusing a public key with a server secret", "نموذج عام صغير يسلّم رسالة عبر EmailJS بلا خلط المفتاح العام بسر الخادم"),
    evidence: tr("le navigateur envoie uniquement les champs attendus avec l’identifiant public, tandis que limites de domaine, modèle et anti-abus refusent une origine non autorisée", "the browser sends only expected fields with the public identifier, while domain, template, and anti-abuse limits reject an unauthorized origin", "يرسل المتصفح الحقول المتوقعة فقط مع المعرّف العام وترفض حدود النطاق والقالب ومكافحة الإساءة أصلًا غير مسموح"),
    failure: tr("le formulaire est considéré sûr parce que la clé s’appelle publicKey, puis des robots épuisent le quota", "the form is assumed safe because the key is called publicKey, then bots exhaust the quota", "يُفترض أمان النموذج لأن المفتاح اسمه publicKey ثم تستنزف الروبوتات الحصة"),
    guard: tr("réserver EmailJS aux messages peu sensibles, borner et encoder les champs, restreindre les origines et ajouter limitation de débit ou défi anti-abus", "reserve EmailJS for low-sensitivity mail, bound and encode fields, restrict origins, and add rate limiting or an anti-abuse challenge", "حصر EmailJS في الرسائل قليلة الحساسية وتقييد الحقول وترميزها وحصر الأصول وإضافة حد معدل أو تحدي مكافحة إساءة"),
    next: tr("Le module suivant déplace l’autorité côté serveur pour les montants, événements et remboursements PayPal.", "The next module moves authority server-side for PayPal amounts, events, and refunds.", "تنقل الوحدة التالية سلطة مبالغ وأحداث واستردادات PayPal إلى الخادم."),
  },
};

Object.assign(lessonGuidance, {
  "paypal-order-lifecycle": {
    scenario: tr("un panier dont le serveur relit produits et prix, crée une commande interne puis envoie à PayPal un montant USD explicitement nommé", "a cart whose server reloads products and prices, creates an internal order, then sends PayPal an explicitly named USD amount", "سلة يعيد الخادم قراءة منتجاتها وأسعارها وينشئ طلبًا داخليًا ثم يرسل إلى PayPal مبلغ USD مسمى بوضوح"),
    evidence: tr("la charge utile contient la référence interne, USD et la valeur serveur à deux décimales ; changer le total dans le navigateur ne change pas cette valeur", "the payload contains the internal reference, USD, and the two-decimal server value; changing the browser total does not change it", "تحتوي الحمولة المرجع الداخلي وUSD وقيمة الخادم بمنزلتين ولا يغير تعديل إجمالي المتصفح هذه القيمة"),
    failure: tr("un champ totalMAD est copié dans currency_code USD sans conversion ni accord commercial, facturant un montant dans la mauvaise devise", "a totalMAD field is copied into currency_code USD without conversion or commercial agreement, charging an amount in the wrong currency", "يُنسخ حقل totalMAD إلى currency_code USD بلا تحويل أو اتفاق تجاري فتُفرض قيمة بعملة خاطئة"),
    guard: tr("conserver montant et devise comme une seule valeur métier, utiliser une devise PayPal réellement configurée et ne jamais convertir en renommant une variable", "keep amount and currency as one business value, use a PayPal currency actually configured for the account, and never convert by renaming a variable", "حفظ المبلغ والعملة كقيمة تجارية واحدة واستخدام عملة PayPal مهيأة فعليًا وعدم التحويل بمجرد إعادة تسمية متغير"),
    next: tr("La leçon suivante vérifie cryptographiquement l’origine du webhook avant toute transition de commande.", "The next lesson cryptographically verifies webhook origin before any order transition.", "يتحقق الدرس التالي تشفيريًا من مصدر webhook قبل أي انتقال للطلب."),
  },
  "paypal-webhook": {
    scenario: tr("un corps HTTP brut et les en-têtes PayPal transmis à l’API officielle verify-webhook-signature avant lecture métier de l’événement", "a raw HTTP body and PayPal headers sent to the official verify-webhook-signature API before business processing", "جسم HTTP خام وترويسات PayPal تُرسل إلى API الرسمية verify-webhook-signature قبل المعالجة التجارية"),
    evidence: tr("seul verification_status SUCCESS produit un événement typé, puis identifiant, type, ressource, commande, montant et devise sont rapprochés", "only verification_status SUCCESS yields a typed event, after which identifier, type, resource, order, amount, and currency are reconciled", "لا ينتج حدث مكتوب النوع إلا verification_status SUCCESS ثم تُطابق الهوية والنوع والمورد والطلب والمبلغ والعملة"),
    failure: tr("une fonction nommée handleVerifiedWebhook reçoit directement un JSON arbitraire et le nom est pris à tort pour une preuve de signature", "a function named handleVerifiedWebhook accepts arbitrary JSON and its name is mistaken for signature evidence", "تستقبل دالة اسمها handleVerifiedWebhook JSON اعتباطيًا ويُظن الاسم خطأ دليلًا على التوقيع"),
    guard: tr("préserver le corps et les en-têtes exacts, appeler la vérification PayPal avec le webhook_id serveur, refuser tout statut autre que SUCCESS et journaliser sans secret", "preserve exact body and headers, call PayPal verification with the server webhook_id, reject every status except SUCCESS, and log without secrets", "حفظ الجسم والترويسات كما هي واستدعاء تحقق PayPal مع webhook_id في الخادم ورفض كل حالة سوى SUCCESS والتسجيل بلا أسرار"),
    next: tr("La leçon suivante applique la même autorité serveur à un remboursement borné par le reste réellement remboursable.", "The next lesson applies the same server authority to a refund bounded by the actual refundable remainder.", "يطبق الدرس التالي سلطة الخادم نفسها على استرداد مقيد بالباقي القابل للاسترداد فعليًا."),
  },
  "refund-workflow": {
    scenario: tr("une demande de remboursement partiel reliée à une capture USD existante et au cumul des remboursements déjà confirmés", "a partial-refund request tied to an existing USD capture and the sum of already confirmed refunds", "طلب استرداد جزئي مرتبط بالتقاط USD قائم ومجموع الاستردادات المؤكدة سابقًا"),
    evidence: tr("le serveur refuse zéro, négatif et dépassement, enregistre motif et acteur, puis rapproche l’identifiant de remboursement confirmé", "the server rejects zero, negative, and excessive values, records reason and actor, then reconciles the confirmed refund identifier", "يرفض الخادم الصفر والسالب والتجاوز ويسجل السبب والمنفذ ثم يطابق معرّف الاسترداد المؤكد"),
    failure: tr("deux agents remboursent chacun le montant capturé parce que la validation ignore les remboursements précédents et la concurrence", "two agents each refund the captured amount because validation ignores previous refunds and concurrency", "يسترد موظفان المبلغ الملتقط كاملًا لأن التحقق يتجاهل الاستردادات السابقة والتزامن"),
    guard: tr("calculer le solde remboursable dans une transaction, conserver la devise de la capture, utiliser une clé de requête et enregistrer un audit immuable", "compute refundable balance in a transaction, retain capture currency, use a request key, and record an immutable audit", "حساب الرصيد القابل للاسترداد في معاملة وحفظ عملة الالتقاط واستخدام مفتاح طلب وتسجيل تدقيق غير قابل للتغيير"),
    next: tr("La leçon suivante généralise cette protection aux livraisons répétées et aux reprises après panne.", "The next lesson generalizes this protection to repeated deliveries and recovery after failure.", "يعمم الدرس التالي هذه الحماية على التسليمات المتكررة والاستعادة بعد العطل."),
  },
  "payment-idempotency": {
    scenario: tr("le même event_id PayPal livré deux fois, y compris après redémarrage de l’instance serveur", "the same PayPal event_id delivered twice, including after the server instance restarts", "وصول event_id نفسه من PayPal مرتين بما في ذلك بعد إعادة تشغيل نسخة الخادم"),
    evidence: tr("une contrainte unique persistante autorise une seule transition paid, une seule décrémentation de stock et une seule notification", "a persistent unique constraint permits one paid transition, one stock decrement, and one notification", "يسمح قيد فريد دائم بانتقال paid واحد وإنقاص مخزون واحد وإشعار واحد"),
    failure: tr("une Map mémoire déduplique pendant un processus mais oublie tout au redéploiement ou sur une autre instance", "an in-memory Map deduplicates within one process but forgets everything after redeploy or on another instance", "تزيل Map في الذاكرة التكرار داخل عملية واحدة لكنها تنسى بعد إعادة النشر أو في نسخة أخرى"),
    guard: tr("insérer event_id dans la base sous contrainte unique et effectuer événement, commande et effets locaux dans une transaction rejouable", "insert event_id into the database under a unique constraint and perform event, order, and local effects in a replay-safe transaction", "إدخال event_id في القاعدة تحت قيد فريد وتنفيذ الحدث والطلب والآثار المحلية في معاملة آمنة للإعادة"),
    next: tr("Le module suivant distribue les changements confirmés par des canaux respectant permission, préférence et fréquence.", "The next module distributes confirmed changes through channels that respect permission, preference, and frequency.", "توزع الوحدة التالية التغييرات المؤكدة عبر قنوات تحترم الإذن والتفضيل والتكرار."),
  },

  "web-push-subscription": {
    scenario: tr("un bouton explicite permet à l’utilisateur de demander le Push, puis transmet l’abonnement au serveur seulement après granted", "an explicit button lets the user request Push, then sends the subscription to the server only after granted", "زر صريح يتيح للمستخدم طلب Push ثم يرسل الاشتراك للخادم بعد granted فقط"),
    evidence: tr("un refus laisse l’interface fonctionnelle sans relance ; un accord crée un abonnement lié à l’utilisateur, au navigateur et à une date de révocation", "a refusal leaves the UI functional without prompting again; consent creates a subscription tied to user, browser, and revocation date", "يبقي الرفض الواجهة عاملة بلا إعادة طلب وينشئ القبول اشتراكًا مرتبطًا بالمستخدم والمتصفح وتاريخ الإلغاء"),
    failure: tr("requestPermission s’exécute au chargement, sans geste ni explication, et pousse l’utilisateur vers un refus durable", "requestPermission runs on page load without gesture or explanation, pushing the user toward a lasting refusal", "تعمل requestPermission عند تحميل الصفحة بلا فعل أو شرح فتدفع المستخدم إلى رفض طويل"),
    guard: tr("expliquer valeur et fréquence, attendre un geste, traiter default et denied comme des choix et prévoir désabonnement côté serveur", "explain value and frequency, wait for a gesture, treat default and denied as choices, and provide server-side unsubscribe", "شرح القيمة والتكرار وانتظار فعل واعتبار default وdenied اختيارين وتوفير إلغاء الاشتراك في الخادم"),
    next: tr("La leçon suivante reçoit le message dans le Service Worker et rend clic, repli et URL sûrs.", "The next lesson receives the message in the Service Worker and makes click, fallback, and URL safe.", "يستقبل الدرس التالي الرسالة في Service Worker ويجعل النقر والبديل والرابط آمنة."),
  },
  "service-worker-notification": {
    scenario: tr("un événement push reçu lorsque l’onglet est fermé, affiché avec repli puis ouvert sur une URL interne autorisée", "a push event received while the tab is closed, displayed with fallback, then opened at an allowed internal URL", "حدث push يصل والتبويب مغلق ويُعرض ببديل ثم يفتح رابطًا داخليًا مسموحًا"),
    evidence: tr("event.waitUntil couvre la promesse d’affichage, un payload absent utilise le repli et le clic réutilise ou ouvre une fenêtre du même origine", "event.waitUntil covers the display promise, a missing payload uses fallback, and click reuses or opens a same-origin window", "تغطي event.waitUntil وعد العرض ويستخدم غياب الحمولة البديل ويعيد النقر استخدام نافذة من الأصل نفسه أو يفتحها"),
    failure: tr("data.url accepte une origine externe et transforme une notification de confiance en redirection de phishing", "data.url accepts an external origin and turns a trusted notification into a phishing redirect", "يقبل data.url أصلًا خارجيًا فيحوّل إشعارًا موثوقًا إلى إعادة توجيه تصيد"),
    guard: tr("valider un chemin relatif contre une liste de routes internes, borner texte et icône, puis utiliser waitUntil pour tout travail asynchrone", "validate a relative path against allowed internal routes, bound text and icon, and use waitUntil for all asynchronous work", "التحقق من مسار نسبي بقائمة مسارات داخلية وتقييد النص والأيقونة واستخدام waitUntil لكل عمل غير متزامن"),
    next: tr("La leçon suivante applique vérification, normalisation et déduplication aux messages entrants WhatsApp.", "The next lesson applies verification, normalization, and deduplication to incoming WhatsApp messages.", "يطبق الدرس التالي التحقق والتطبيع وإزالة التكرار على رسائل واتساب الواردة."),
  },
  "whatsapp-webhook": {
    scenario: tr("un webhook Meta signé contenant plusieurs types de messages dont seul le texte borné devient une demande support", "a signed Meta webhook containing several message types, only bounded text of which becomes a support request", "webhook موقّع من Meta يحوي أنواع رسائل متعددة ولا يتحول إلى طلب دعم إلا النص المقيد"),
    evidence: tr("la signature du corps brut est vérifiée avant parsing, les types inconnus sont ignorés et message.id empêche un second traitement", "the raw-body signature is verified before parsing, unknown types are ignored, and message.id prevents second processing", "يُتحقق من توقيع الجسم الخام قبل التحليل وتُهمل الأنواع المجهولة ويمنع message.id المعالجة الثانية"),
    failure: tr("normaliser un objet JSON sans vérifier la signature permet à n’importe qui de fabriquer un expéditeur et un message", "normalizing JSON without verifying its signature lets anyone forge a sender and message", "يسمح تطبيع JSON بلا تحقق توقيع لأي شخص بتزوير المرسل والرسالة"),
    guard: tr("vérifier HMAC sur les octets reçus avec comparaison constante, valider la structure, dédupliquer l’identifiant et minimiser le numéro stocké", "verify HMAC over received bytes with constant-time comparison, validate structure, deduplicate the identifier, and minimize stored phone data", "التحقق من HMAC على البايتات المستلمة بمقارنة ثابتة الزمن والتحقق من البنية وإزالة تكرار المعرّف وتقليل بيانات الهاتف المخزنة"),
    next: tr("La leçon suivante choisit un canal unique ou une escalade explicite selon urgence, consentement et état de livraison.", "The next lesson chooses one channel or an explicit escalation based on urgency, consent, and delivery state.", "يختار الدرس التالي قناة واحدة أو تصعيدًا صريحًا حسب الاستعجال والموافقة وحالة التسليم."),
  },
  "notification-orchestration": {
    scenario: tr("un changement de commande doit choisir email, push ou WhatsApp sans tripler le message ni ignorer les préférences", "an order change must choose email, push, or WhatsApp without tripling the message or ignoring preferences", "تغيير طلب يجب أن يختار البريد أو push أو واتساب بلا تكرار الرسالة ثلاثًا أو تجاهل التفضيلات"),
    evidence: tr("la décision enregistre événement, motif, canal choisi et clé de déduplication ; une répétition ne crée aucun nouvel envoi", "the decision records event, reason, chosen channel, and deduplication key; replay creates no new send", "يسجل القرار الحدث والسبب والقناة المختارة ومفتاح إزالة التكرار ولا تنشئ الإعادة إرسالًا جديدًا"),
    failure: tr("urgent envoie sur tous les canaux autorisés même si l’un a déjà réussi, créant spam et coûts inutiles", "urgent sends through every allowed channel even after one succeeds, creating spam and unnecessary cost", "يرسل urgent عبر كل القنوات المسموحة حتى بعد نجاح واحدة فينشئ إزعاجًا وكلفة"),
    guard: tr("définir priorité, fenêtre de fréquence et condition d’escalade, puis arrêter dès qu’un canal confirmé satisfait le contrat", "define priority, frequency window, and escalation condition, then stop once a confirmed channel satisfies the contract", "تعريف الأولوية ونافذة التكرار وشرط التصعيد ثم التوقف حين تحقق قناة مؤكدة العقد"),
    next: tr("Le module suivant traite le modèle IA comme un autre fournisseur non fiable, borné avant et après l’appel.", "The next module treats the AI model as another untrusted provider, bounded before and after the call.", "تعامل الوحدة التالية نموذج الذكاء كمزوّد غير موثوق آخر مقيد قبل الاستدعاء وبعده."),
  },

  "openai-server-call": {
    scenario: tr("une route serveur authentifiée produit un brouillon court à partir du nom public d’un produit, sans données client", "an authenticated server route produces a short draft from a public product name without customer data", "مسار خادم موثق ينتج مسودة قصيرة من اسم منتج عام بلا بيانات عميل"),
    evidence: tr("la clé reste côté serveur, l’appel fixe modèle et limite de sortie, et la réponse est marquée brouillon jusqu’à validation", "the key remains server-side, the call fixes model and output limit, and the response stays marked draft until validation", "يبقى المفتاح في الخادم ويحدد الاستدعاء النموذج وحد الإخراج وتظل الاستجابة موسومة مسودة حتى التحقق"),
    failure: tr("un composant client appelle le fournisseur avec la clé ou transmet tout l’objet commande dans le prompt", "a client component calls the provider with the key or sends the entire order object in the prompt", "يستدعي مكوّن عميل المزوّد بالمفتاح أو يرسل كائن الطلب كله في prompt"),
    guard: tr("authentifier et limiter la route, sélectionner les champs publics nécessaires, fixer délai et budget, puis valider la sortie", "authenticate and rate-limit the route, select only necessary public fields, set timeout and budget, then validate output", "توثيق المسار وتحديد معدله واختيار الحقول العامة اللازمة وتحديد المهلة والميزانية ثم التحقق من المخرج"),
    next: tr("La leçon suivante montre pourquoi une liste de mots interdits ne constitue pas une frontière de sécurité IA.", "The next lesson shows why a blocked-word list is not an AI security boundary.", "يوضح الدرس التالي لماذا لا تمثل قائمة الكلمات المحظورة حد أمان للذكاء."),
  },
  "ai-safety": {
    scenario: tr("une tâche draft_product_copy reçoit uniquement des champs de catalogue bornés et ne possède aucun outil de paiement, email ou base privée", "a draft_product_copy task receives only bounded catalog fields and has no payment, email, or private-database tool", "مهمة draft_product_copy تتلقى حقول كتالوج مقيدة فقط ولا تملك أداة دفع أو بريد أو قاعدة خاصة"),
    evidence: tr("une tâche inconnue, un objet supplémentaire ou un champ trop long est refusé structurellement, indépendamment des mots employés", "an unknown task, extra object, or overlong field is structurally rejected regardless of the words used", "تُرفض المهمة المجهولة أو الكائن الزائد أو الحقل الطويل بنيويًا بغض النظر عن الكلمات المستخدمة"),
    failure: tr("une regex pour password, api key ou ignore previous donne une fausse sécurité : synonymes, encodage et autres langues la contournent", "a regex for password, api key, or ignore previous creates false security: synonyms, encoding, and other languages bypass it", "تعطي regex لكلمات password أو api key أو ignore previous أمانًا زائفًا وتتجاوزها المرادفات والترميز واللغات الأخرى"),
    guard: tr("traiter tout texte comme donnée non fiable, limiter capacités et schéma, garder secrets hors contexte, exiger validation et autorisation avant effet", "treat all text as untrusted data, limit capabilities and schema, keep secrets out of context, and require validation and authorization before effects", "اعتبار كل نص بيانات غير موثوقة وتقييد القدرات والمخطط وإبعاد الأسرار عن السياق واشتراط التحقق والتفويض قبل الأثر"),
    next: tr("La leçon suivante borne aussi tokens, concurrence et dépense avant que l’usage ne devienne incontrôlé.", "The next lesson also bounds tokens, concurrency, and spend before usage becomes uncontrolled.", "يقيد الدرس التالي الرموز والتزامن والإنفاق قبل أن يخرج الاستخدام عن السيطرة."),
  },
  "ai-cost-control": {
    scenario: tr("une fonctionnalité de brouillon possède un plafond de sortie, un budget total et une limite d’appels par utilisateur", "a drafting feature has an output cap, total budget, and per-user call limit", "ميزة مسودة لها سقف إخراج وميزانية إجمالية وحد استدعاءات لكل مستخدم"),
    evidence: tr("chaque appel enregistre modèle, tokens, latence, résultat et coût estimé ; le plafond refuse avant dépassement et déclenche une alerte agrégée", "every call records model, tokens, latency, result, and estimated cost; the cap rejects before overrun and triggers an aggregate alert", "يسجل كل استدعاء النموذج والرموز والزمن والنتيجة والكلفة المقدرة ويرفض السقف قبل التجاوز ويطلق تنبيهًا مجمعًا"),
    failure: tr("vérifier usage après la réponse limite une sortie mais n’empêche ni rafale concurrente ni dépense cumulée", "checking usage after the response limits one output but prevents neither concurrent bursts nor cumulative spend", "يحد فحص الاستخدام بعد الاستجابة مخرجًا واحدًا لكنه لا يمنع دفعات متزامنة أو إنفاقًا تراكميًا"),
    guard: tr("réserver quota avant l’appel, fixer max_output_tokens et timeout, limiter le débit, puis rapprocher usage réel et budget", "reserve quota before calling, set max_output_tokens and timeout, rate-limit, then reconcile actual usage with budget", "حجز الحصة قبل الاستدعاء وتحديد max_output_tokens والمهلة وحد المعدل ثم مطابقة الاستخدام الفعلي بالميزانية"),
    next: tr("La leçon suivante vérifie le contenu structuré avant qu’il ne devienne une fiche produit publique.", "The next lesson validates structured content before it becomes a public product page.", "يتحقق الدرس التالي من المحتوى المنظم قبل أن يصبح صفحة منتج عامة."),
  },
  "ai-output-validation": {
    scenario: tr("une réponse inconnue doit devenir ProductDraft seulement si titre, description et tags respectent type, longueur et politique éditoriale", "an unknown response becomes ProductDraft only when title, description, and tags satisfy type, length, and editorial policy", "لا تصبح الاستجابة المجهولة ProductDraft إلا إذا حقق العنوان والوصف والوسوم النوع والطول والسياسة التحريرية"),
    evidence: tr("objets incomplets, chaînes vides, tags trop nombreux et propriétés inattendues échouent ; seul l’objet normalisé passe en relecture humaine", "incomplete objects, empty strings, excessive tags, and unexpected properties fail; only the normalized object reaches human review", "تفشل الكائنات الناقصة والسلاسل الفارغة والوسوم الكثيرة والخصائص غير المتوقعة ولا يصل للمراجعة البشرية إلا الكائن المطبع"),
    failure: tr("un cast as ProductDraft convainc TypeScript mais ne contrôle aucune valeur reçue à l’exécution", "an as ProductDraft cast convinces TypeScript but checks no value received at runtime", "يقنع التحويل as ProductDraft TypeScript لكنه لا يفحص أي قيمة مستلمة وقت التشغيل"),
    guard: tr("partir de unknown, vérifier chaque propriété et limite, normaliser un nouvel objet sans champs supplémentaires et demander approbation avant publication", "start from unknown, check every property and bound, normalize a new object without extra fields, and require approval before publishing", "البدء من unknown وفحص كل خاصية وحد وتطبيع كائن جديد بلا حقول زائدة وطلب الاعتماد قبل النشر"),
    next: tr("Le module suivant mesure l’usage du produit avec la même discipline de schéma, de minimisation et de preuve.", "The next module measures product use with the same schema, minimization, and evidence discipline.", "تقيس الوحدة التالية استخدام المنتج بانضباط المخطط وتقليل البيانات والدليل نفسه."),
  },
});

Object.assign(lessonGuidance, {
  "analytics-event-contract": {
    scenario: tr("un événement add_to_cart stable contenant identifiant produit et valeur utile, sans email, téléphone ni texte libre", "a stable add_to_cart event containing useful product identifier and value without email, phone, or free text", "حدث add_to_cart ثابت يحوي معرّف المنتج والقيمة المفيدة بلا بريد أو هاتف أو نص حر"),
    evidence: tr("le même geste produit le même nom et le même schéma dans navigateur, pipeline et rapport, avec version et horodatage contrôlés", "the same gesture produces the same name and schema in browser, pipeline, and report, with controlled version and timestamp", "ينتج الفعل نفسه الاسم والمخطط نفسيهما في المتصفح والخط والتقرير مع نسخة ووقت مضبوطين"),
    failure: tr("plusieurs composants envoient cart_add, add-cart et add_to_cart avec des valeurs incompatibles", "different components send cart_add, add-cart, and add_to_cart with incompatible values", "ترسل مكونات مختلفة cart_add وadd-cart وadd_to_cart بقيم غير متوافقة"),
    guard: tr("centraliser un contrat typé et versionné, minimiser les propriétés et tester le payload avant de modifier les tableaux de bord", "centralize a typed, versioned contract, minimize properties, and test payloads before changing dashboards", "مركزة عقد مكتوب النوع وذي نسخة وتقليل الخصائص واختبار الحمولة قبل تغيير لوحات المتابعة"),
    next: tr("La leçon suivante empêche cet événement non nécessaire de partir avant un consentement explicite.", "The next lesson prevents this non-essential event from leaving before explicit consent.", "يمنع الدرس التالي خروج هذا الحدث غير الضروري قبل موافقة صريحة."),
  },
  "analytics-consent": {
    scenario: tr("un visiteur inconnu, consentant ou refusant dont les événements marketing doivent rester bloqués tant que le choix n’est pas granted", "an unknown, consenting, or refusing visitor whose marketing events remain blocked until the choice is granted", "زائر حالته مجهولة أو موافق أو رافض يجب أن تظل أحداث التسويق محجوبة حتى granted"),
    evidence: tr("unknown et denied n’émettent aucun appel analytics non nécessaire, granted l’autorise, et retirer le choix stoppe les prochains appels", "unknown and denied emit no non-essential analytics call, granted permits it, and withdrawing consent stops subsequent calls", "لا تصدر unknown وdenied أي استدعاء تحليلات غير ضروري وتسمح granted به ويوقف سحب الموافقة الاستدعاءات التالية"),
    failure: tr("le SDK est chargé avant la bannière puis mayTrack filtre seulement les événements, alors que le fournisseur a déjà reçu une requête", "the SDK loads before the banner and mayTrack filters only events even though the provider already received a request", "يُحمّل SDK قبل اللافتة ثم ترشح mayTrack الأحداث فقط رغم أن المزوّد استلم طلبًا بالفعل"),
    guard: tr("charger les outils non nécessaires après consentement, honorer refus et retrait, séparer stockage essentiel et mesure optionnelle et documenter la finalité", "load non-essential tools after consent, honor refusal and withdrawal, separate essential storage from optional measurement, and document purpose", "تحميل الأدوات غير الضرورية بعد الموافقة واحترام الرفض والسحب وفصل التخزين الضروري عن القياس الاختياري وتوثيق الغرض"),
    next: tr("La leçon suivante transforme des événements cohérents et licites en étapes de funnel avec dénominateurs explicites.", "The next lesson turns consistent, lawful events into funnel stages with explicit denominators.", "يحول الدرس التالي الأحداث المتسقة والمشروعة إلى مراحل funnel بمقامات صريحة."),
  },
  "funnel-analysis": {
    scenario: tr("mille vues, cent vingt paniers et trente achats mesurés sur la même population et la même fenêtre", "one thousand views, 120 carts, and 30 purchases measured over the same population and window", "ألف مشاهدة و120 سلة و30 شراء مقاسة على المجموعة والنافذة نفسيهما"),
    evidence: tr("viewToCart vaut 0,12, cartToPurchase vaut 0,25, zéro dénominateur produit zéro et chaque étape documente unité et période", "viewToCart is 0.12, cartToPurchase is 0.25, a zero denominator yields zero, and each stage documents unit and period", "تساوي viewToCart ‏0.12 وcartToPurchase ‏0.25 وينتج المقام الصفري صفرًا وتوثق كل مرحلة الوحدة والفترة"),
    failure: tr("les vues comptent des sessions tandis que les achats comptent des commandes sur une autre période, créant un taux sans sens", "views count sessions while purchases count orders from another period, producing a meaningless rate", "تعد المشاهدات الجلسات بينما تعد المشتريات طلبات فترة أخرى فينتج معدل بلا معنى"),
    guard: tr("définir population, fenêtre, unité et ordre des événements, afficher volumes avec taux et segmenter seulement avec un effectif suffisant", "define population, window, unit, and event order, show volumes beside rates, and segment only with sufficient sample", "تعريف المجموعة والنافذة والوحدة وترتيب الأحداث وعرض الأحجام بجانب المعدلات والتقسيم بعينة كافية فقط"),
    next: tr("La leçon suivante utilise ce funnel pour formuler une hypothèse causale et une métrique garde-fou avant expérimentation.", "The next lesson uses this funnel to state a causal hypothesis and guardrail before experimentation.", "يستخدم الدرس التالي هذا funnel لصياغة فرضية سببية ومقياس حماية قبل التجربة."),
  },
  "ethical-growth-experiment": {
    scenario: tr("une variante de texte de confiance vise add_to_cart_rate tout en surveillant retour produit et accessibilité", "a trust-copy variant targets add_to_cart_rate while monitoring product returns and accessibility", "نسخة نص ثقة تستهدف add_to_cart_rate مع مراقبة إرجاع المنتج والإتاحة"),
    evidence: tr("hypothèse, population, métrique principale, garde-fou, durée et règle d’arrêt sont enregistrées avant de voir les résultats", "hypothesis, population, primary metric, guardrail, duration, and stopping rule are registered before results are viewed", "تُسجل الفرضية والمجموعة والمقياس الأساسي والحماية والمدة وقاعدة الإيقاف قبل رؤية النتائج"),
    failure: tr("l’équipe consulte chaque jour puis arrête dès qu’une hausse apparaît, multipliant les faux positifs et oubliant les retours", "the team checks daily and stops as soon as an increase appears, multiplying false positives and ignoring returns", "يفحص الفريق يوميًا ويتوقف فور ظهور زيادة فيضاعف الإيجابيات الكاذبة ويتجاهل الإرجاعات"),
    guard: tr("préenregistrer décision et garde-fou, assurer une répartition stable, attendre l’échantillon prévu et publier résultat négatif comme positif", "pre-register decision and guardrail, ensure stable assignment, wait for the planned sample, and publish negative as well as positive results", "التسجيل المسبق للقرار والحماية وضمان توزيع ثابت وانتظار العينة المخططة ونشر النتائج السلبية والإيجابية"),
    next: tr("Le module suivant transforme le changement retenu en déploiement reproductible, surveillé et récupérable.", "The next module turns the accepted change into a reproducible, monitored, recoverable deployment.", "تحول الوحدة التالية التغيير المقبول إلى نشر قابل للتكرار والمراقبة والاستعادة."),
  },

  "github-release-workflow": {
    scenario: tr("une pull request propre installe exactement le lockfile puis bloque la fusion si types, tests ou build échouent", "a clean pull request installs exactly the lockfile and blocks merge when types, tests, or build fail", "طلب سحب نظيف يثبت lockfile بدقة ويمنع الدمج عند فشل الأنواع أو الاختبارات أو البناء"),
    evidence: tr("un runner vierge exécute npm ci puis les contrôles attendus, affiche l’empreinte du commit et ne dépend d’aucun fichier local", "a clean runner executes npm ci and expected checks, displays the commit identity, and depends on no local file", "ينفذ runner نظيف npm ci والفحوص المتوقعة ويعرض هوية الإيداع ولا يعتمد على ملف محلي"),
    failure: tr("le pipeline ne lance que npm run build, tandis qu’un test important ou validate:course reste manuel et est oublié", "the pipeline runs only npm run build while an important test or validate:course remains manual and is forgotten", "يشغل الخط npm run build فقط بينما يبقى اختبار مهم أو validate:course يدويًا ويُنسى"),
    guard: tr("déclarer versions et commandes de vérité du projet, utiliser npm ci, protéger la branche et conserver les preuves associées au SHA", "declare project source-of-truth versions and commands, use npm ci, protect the branch, and retain evidence tied to the SHA", "إعلان نسخ وأوامر حقيقة المشروع واستخدام npm ci وحماية الفرع وحفظ الأدلة المرتبطة بـ SHA"),
    next: tr("La leçon suivante déploie ce SHA dans une Preview isolée avant toute promotion en production.", "The next lesson deploys that SHA to an isolated Preview before any production promotion.", "ينشر الدرس التالي SHA في Preview معزولة قبل أي ترقية للإنتاج."),
  },
  "vercel-environments": {
    scenario: tr("un déploiement Preview immuable utilise des variables de test et doit être accepté avant promotion du même artefact", "an immutable Preview deployment uses test variables and must be accepted before promoting the same artifact", "نشر Preview غير قابل للتغيير يستخدم متغيرات اختبار ويجب قبوله قبل ترقية الأثر نفسه"),
    evidence: tr("l’URL Preview expose le SHA attendu, les parcours critiques utilisent des fournisseurs sandbox et la promotion ne reconstruit pas un autre artefact", "the Preview URL exposes the expected SHA, critical journeys use sandbox providers, and promotion does not rebuild another artifact", "يعرض رابط Preview ‏SHA المتوقع وتستخدم المسارات الحرجة مزودات sandbox ولا تعيد الترقية بناء أثر آخر"),
    failure: tr("Preview et Production partagent des secrets ou une base, si bien qu’un test envoie un vrai email ou modifie une vraie commande", "Preview and Production share secrets or a database, so a test sends real mail or changes a real order", "تشارك Preview وProduction الأسرار أو القاعدة فيرسل اختبار بريدًا حقيقيًا أو يغير طلبًا حقيقيًا"),
    guard: tr("séparer variables et données par environnement, étiqueter les intégrations sandbox, vérifier l’artefact puis promouvoir ou abandonner celui-ci", "separate variables and data by environment, label sandbox integrations, verify the artifact, then promote or abandon that exact artifact", "فصل المتغيرات والبيانات حسب البيئة ووسم تكاملات sandbox والتحقق من الأثر ثم ترقية الأثر نفسه أو التخلي عنه"),
    next: tr("La leçon suivante rattache le domaine Namecheap en préservant les enregistrements email et un plan de retour DNS.", "The next lesson attaches the Namecheap domain while preserving mail records and a DNS rollback plan.", "يربط الدرس التالي نطاق Namecheap مع الحفاظ على سجلات البريد وخطة رجوع DNS."),
  },
  "namecheap-dns": {
    scenario: tr("l’apex et www pointent vers Vercel tandis que MX, SPF, DKIM et DMARC restent intacts", "the apex and www point to Vercel while MX, SPF, DKIM, and DMARC remain intact", "تشير apex وwww إلى Vercel مع بقاء MX وSPF وDKIM وDMARC سليمة"),
    evidence: tr("les résolveurs publics renvoient les nouvelles valeurs, HTTPS est valide, une URL canonique gagne et le courrier continue de passer ses contrôles", "public resolvers return new values, HTTPS is valid, one canonical URL wins, and mail continues passing its checks", "تعيد المحللات العامة القيم الجديدة ويصح HTTPS ويفوز رابط أساسي واحد ويستمر البريد في اجتياز فحوصه"),
    failure: tr("remplacer toute la zone par deux enregistrements web supprime MX et DKIM, interrompant silencieusement le courrier", "replacing the whole zone with two web records deletes MX and DKIM and silently breaks mail", "يؤدي استبدال المنطقة كلها بسجلي ويب إلى حذف MX وDKIM وتعطيل البريد بصمت"),
    guard: tr("exporter la zone, relever ancien TTL et valeurs, changer seulement les hôtes requis, vérifier depuis plusieurs résolveurs et conserver le retour", "export the zone, record old TTL and values, change only required hosts, verify through several resolvers, and retain rollback", "تصدير المنطقة وتسجيل TTL والقيم القديمة وتغيير المضيفات اللازمة فقط والتحقق عبر محللات متعددة وحفظ الرجوع"),
    next: tr("La leçon suivante définit les signaux, RPO et RTO puis prouve qu’une sauvegarde peut réellement être restaurée.", "The next lesson defines signals, RPO, and RTO, then proves that a backup can actually be restored.", "يحدد الدرس التالي الإشارات وRPO وRTO ثم يثبت إمكانية استعادة النسخة فعليًا."),
  },
  "monitoring-backups": {
    scenario: tr("une boutique promet un RPO de 15 minutes pour les commandes et un RTO de 60 minutes, avec alerte et exercice trimestriel", "a store commits to a 15-minute order RPO and 60-minute RTO with alerting and a quarterly drill", "متجر يلتزم بـ RPO للطلبات 15 دقيقة وRTO ‏60 دقيقة مع تنبيه وتدريب فصلي"),
    evidence: tr("un contrôle synthétique crée puis relit un objet non marchand, les alertes ont propriétaire et seuil, et une restauration isolée respecte RPO/RTO avec intégrité vérifiée", "a synthetic check creates and reads a non-commerce object, alerts have owner and threshold, and an isolated restore meets RPO/RTO with verified integrity", "ينشئ فحص اصطناعي كائنًا غير تجاري ويقرأه وللتنبيهات مالك وعتبة وتحقق استعادة معزولة RPO/RTO مع سلامة البيانات"),
    failure: tr("un endpoint health renvoie true alors que paiement ou base est inutilisable, et les sauvegardes n’ont jamais été restaurées", "a health endpoint returns true while payment or database is unusable, and backups have never been restored", "يعيد endpoint الصحة true بينما الدفع أو القاعدة معطلة ولم تُستعد النسخ قط"),
    guard: tr("surveiller signaux centrés parcours, éviter les secrets dans les probes, définir RPO/RTO par données et chronométrer régulièrement une restauration complète", "monitor journey-centered signals, keep secrets out of probes, define RPO/RTO by data class, and regularly time a complete restore", "مراقبة إشارات تركز على المسار وإبعاد الأسرار عن probes وتعريف RPO/RTO حسب فئة البيانات وتوقيت استعادة كاملة دوريًا"),
    next: tr("Le projet final commence par convertir toutes ces frontières en architecture, critères d’acceptation et ordre de réalisation.", "The capstone begins by turning all these boundaries into architecture, acceptance criteria, and an implementation order.", "يبدأ المشروع النهائي بتحويل هذه الحدود إلى بنية ومعايير قبول وترتيب تنفيذ."),
  },

  "capstone-architecture": {
    scenario: tr("le jalon 1 crée le squelette Next.js, les contrats d’environnement, le schéma Supabase, les rôles et une carte des frontières avant toute page décorative", "milestone 1 creates the Next.js skeleton, environment contracts, Supabase schema, roles, and boundary map before decorative pages", "ينشئ الإنجاز 1 هيكل Next.js وعقود البيئة ومخطط Supabase والأدوار وخريطة الحدود قبل الصفحات الزخرفية"),
    evidence: tr("types, build et migrations passent sur une base vide ; un visiteur lit les produits publiés, un client ne lit que ses commandes et un admin autorisé peut préparer une mutation auditée", "types, build, and migrations pass on an empty database; a visitor reads published products, a customer only their orders, and an authorized admin can prepare an audited mutation", "تنجح الأنواع والبناء والترحيلات على قاعدة فارغة ويقرأ الزائر المنتجات المنشورة والعميل طلباته فقط ويستطيع مدير مخول إعداد تعديل مدقق"),
    failure: tr("les composants, tables et fournisseurs sont connectés avant de décider qui authentifie et valide chaque mutation", "components, tables, and providers are connected before deciding who authenticates and validates each mutation", "تُربط المكونات والجداول والمزودات قبل تحديد من يوثق ويتحقق من كل تعديل"),
    guard: tr("écrire le diagramme, le modèle de données, les politiques RLS, le registre de variables et les critères d’acceptation, puis construire une tranche verticale minimale", "write the diagram, data model, RLS policies, variable register, and acceptance criteria, then build one minimal vertical slice", "كتابة المخطط ونموذج البيانات وسياسات RLS وسجل المتغيرات ومعايير القبول ثم بناء شريحة عمودية دنيا"),
    next: tr("Le jalon 2 implémente catalogue, recherche, authentification et administration sur ces contrats vérifiés.", "Milestone 2 implements catalog, search, authentication, and administration on these verified contracts.", "ينفذ الإنجاز 2 الكتالوج والبحث والمصادقة والإدارة فوق هذه العقود المتحققة."),
  },
  "capstone-catalog": {
    scenario: tr("le jalon 2 livre produits, variantes, médias et stock avec lecture publique filtrée, recherche stable et mutations admin autorisées", "milestone 2 ships products, variants, media, and stock with filtered public reads, stable search, and authorized admin mutations", "يسلم الإنجاز 2 المنتجات والمتغيرات والوسائط والمخزون بقراءة عامة مرشحة وبحث ثابت وتعديلات مدير مخولة"),
    evidence: tr("les fixtures créent un catalogue, les pages liste/détail répondent aux états vide et erreur, RLS bloque un client, et un changement admin laisse un audit", "fixtures create a catalog, list/detail pages handle empty and error states, RLS blocks a customer, and an admin change leaves an audit", "تنشئ fixtures كتالوجًا وتعالج صفحات القائمة والتفصيل حالتي الفراغ والخطأ وتحجب RLS العميل ويترك تعديل المدير تدقيقًا"),
    failure: tr("le prix et le stock sont dupliqués dans composants, index de recherche et panier sans source de vérité ni invalidation", "price and stock are duplicated across components, search index, and cart without a source of truth or invalidation", "يُكرر السعر والمخزون في المكونات وفهرس البحث والسلة بلا مصدر حقيقة أو إبطال"),
    guard: tr("définir la base comme autorité, valider les mutations au serveur, dériver les lectures et invalider explicitement les caches après commit", "make the database authoritative, validate mutations on the server, derive reads, and explicitly invalidate caches after commit", "جعل القاعدة المرجع والتحقق من التعديلات في الخادم واشتقاق القراءات وإبطال الذاكرات صراحة بعد commit"),
    next: tr("Le jalon 3 relie ce catalogue au panier, à la commande, au paiement vérifié et aux notifications idempotentes.", "Milestone 3 connects this catalog to cart, order, verified payment, and idempotent notifications.", "يربط الإنجاز 3 هذا الكتالوج بالسلة والطلب والدفع المتحقق والإشعارات غير المتكررة."),
  },
  "capstone-purchase": {
    scenario: tr("le jalon 3 couvre panier invité ou client, recalcul serveur, réservation de stock, commande pending, capture PayPal vérifiée et notification après commit", "milestone 3 covers guest or customer cart, server recalculation, stock reservation, pending order, verified PayPal capture, and post-commit notification", "يغطي الإنجاز 3 سلة الضيف أو العميل وإعادة حساب الخادم وحجز المخزون وطلب pending والتقاط PayPal متحقق وإشعار بعد commit"),
    evidence: tr("un test de parcours prouve succès, refus, webhook répété et stock insuffisant ; aucune branche ne double commande, stock, capture ou message", "a journey test proves success, denial, replayed webhook, and insufficient stock; no branch duplicates order, stock, capture, or message", "يثبت اختبار مسار النجاح والرفض وwebhook المعاد ونقص المخزون ولا يكرر أي فرع الطلب أو المخزون أو الالتقاط أو الرسالة"),
    failure: tr("le navigateur marque paid au retour PayPal ou un webhook déclenche notification avant que transaction commande et stock soit confirmée", "the browser marks paid on PayPal return or a webhook notifies before the order-and-stock transaction commits", "يضع المتصفح paid عند عودة PayPal أو يرسل webhook إشعارًا قبل تثبيت معاملة الطلب والمخزون"),
    guard: tr("faire autorité au serveur, vérifier et rapprocher l’événement, verrouiller les transitions, persister l’idempotence et publier les effets après commit", "keep authority on the server, verify and reconcile the event, lock transitions, persist idempotency, and publish effects after commit", "إبقاء السلطة في الخادم والتحقق من الحدث ومطابقته وقفل الانتقالات وحفظ عدم التكرار ونشر الآثار بعد commit"),
    next: tr("Le jalon 4 ajoute tests d’acceptation, sécurité, accessibilité, déploiement, alertes, rollback et restauration chronométrée.", "Milestone 4 adds acceptance tests, security, accessibility, deployment, alerts, rollback, and timed restore.", "يضيف الإنجاز 4 اختبارات القبول والأمان والإتاحة والنشر والتنبيهات والرجوع والاستعادة الموقّتة."),
  },
  "capstone-production": {
    scenario: tr("le jalon 4 transforme le magasin complet en release candidate testée sur Preview puis exploitée avec seuils, responsables et reprise", "milestone 4 turns the complete store into a release candidate tested on Preview and operated with thresholds, owners, and recovery", "يحول الإنجاز 4 المتجر الكامل إلى release candidate مختبرة على Preview ومشغلة بعتبات ومسؤولين واستعادة"),
    evidence: tr("types, tests, build et parcours critiques passent ; le SHA vérifié est promu, les alertes détectent une panne simulée et la restauration respecte le RPO/RTO déclaré", "types, tests, build, and critical journeys pass; the verified SHA is promoted, alerts detect a simulated outage, and restore meets declared RPO/RTO", "تنجح الأنواع والاختبارات والبناء والمسارات الحرجة ويُرقى SHA المتحقق وتكتشف التنبيهات عطلًا محاكى وتحقق الاستعادة RPO/RTO المعلن"),
    failure: tr("une checklist coche “backup” et “monitoring” sans seuil, propriétaire, scénario de rollback ni preuve de restauration", "a checklist marks backup and monitoring without threshold, owner, rollback scenario, or restore evidence", "تؤشر قائمة على backup وmonitoring بلا عتبة أو مسؤول أو سيناريو رجوع أو دليل استعادة"),
    guard: tr("lier chaque critère à une commande ou un parcours, définir stop conditions et propriétaire, répéter rollback et restauration, puis archiver les preuves du SHA", "tie every criterion to a command or journey, define stop conditions and owner, rehearse rollback and restore, then archive evidence for the SHA", "ربط كل معيار بأمر أو مسار وتحديد شروط الإيقاف والمسؤول والتدرب على الرجوع والاستعادة ثم أرشفة أدلة SHA"),
    next: tr("Le parcours est terminé : reprenez le backlog du projet, choisissez le prochain risque mesurable et répétez la boucle preuve–livraison–observation.", "The course is complete: return to the project backlog, choose the next measurable risk, and repeat the evidence–delivery–observation loop.", "اكتمل المسار: ارجع إلى backlog المشروع واختر الخطر التالي القابل للقياس وكرر حلقة الدليل والتسليم والملاحظة."),
  },
});

const annotationText = {
  fr: {
    heading: "crée un titre ou un jalon vérifiable", checklist: "énonce un critère à exécuter et à prouver", comment: "documente une intention sans être exécutée", import: "importe la dépendance nommée, sans l’instancier implicitement", type: "définit la forme des données acceptées à cette frontière", fn: "ouvre la fonction qui porte la responsabilité annoncée", condition: "refuse ou bifurque explicitement lorsque cette condition est vraie", result: "renvoie la valeur produite au code appelant", test: "nomme un comportement indépendant que le runner exécutera", assertion: "compare le résultat réel à l’attente précise", async: "attend la fin de l’opération asynchrone avant de continuer", secret: "lit une configuration serveur ; sa valeur ne doit jamais être journalisée", log: "rend le résultat observable dans le terminal sans constituer une validation métier", command: "exécute une étape terminal dans l’ordre visible", jsx: "déclare l’élément d’interface et sa sémantique", yaml: "configure cette clé du workflow ou du service", close: "ferme la structure ouverte par les lignes précédentes", data: "déclare ou transforme cette donnée pour l’étape suivante",
  },
  en: {
    heading: "creates a verifiable title or milestone", checklist: "states a criterion that must be executed and evidenced", comment: "documents intent and is not executed", import: "imports the named dependency without implicitly instantiating it", type: "defines the shape of data accepted at this boundary", fn: "opens the function that owns the stated responsibility", condition: "explicitly rejects or branches when this condition is true", result: "returns the produced value to calling code", test: "names an independent behavior the runner will execute", assertion: "compares the actual result with the precise expectation", async: "waits for the asynchronous operation before continuing", secret: "reads server configuration whose value must never be logged", log: "makes the result visible in the terminal but is not business validation", command: "runs a terminal step in the visible order", jsx: "declares the interface element and its semantics", yaml: "configures this workflow or service key", close: "closes the structure opened by preceding lines", data: "declares or transforms this datum for the next step",
  },
  ar: {
    heading: "تنشئ عنوانًا أو إنجازًا قابلًا للتحقق", checklist: "تذكر معيارًا يجب تنفيذه وإثباته", comment: "توثق القصد ولا تُنفذ", import: "تستورد الاعتماد المسمى بلا إنشاء ضمني", type: "تحدد شكل البيانات المقبولة عند هذا الحد", fn: "تفتح الدالة المسؤولة عن المهمة المذكورة", condition: "ترفض أو تتفرع صراحة عندما يتحقق الشرط", result: "تعيد القيمة الناتجة إلى الشيفرة المستدعية", test: "تسمي سلوكًا مستقلًا سيشغله منفذ الاختبار", assertion: "تقارن النتيجة الفعلية بالتوقع الدقيق", async: "تنتظر العملية غير المتزامنة قبل المتابعة", secret: "تقرأ إعداد خادم لا يجوز تسجيل قيمته", log: "تجعل النتيجة ظاهرة في الطرفية لكنها ليست تحققًا تجاريًا", command: "تنفذ خطوة طرفية بالترتيب الظاهر", jsx: "تعلن عنصر الواجهة ودلالته", yaml: "تهيئ مفتاح workflow أو الخدمة", close: "تغلق البنية التي فتحتها الأسطر السابقة", data: "تعلن هذه البيانات أو تحولها للخطوة التالية",
  },
};

function annotationKind(line, previousLine = "") {
  const value = line.trim();
  if (/^#{1,6}\s/.test(value)) return "heading";
  if (/^(?:- \[[ x]\]|\d+\.)/.test(value)) return "checklist";
  if (/^(?:#|\/\/)/.test(value)) return "comment";
  if (/^import\s/.test(value)) return "import";
  if (/^(?:type|interface)\s/.test(value)) return "type";
  if (/\b\w+\??:\s*(?:string|number|boolean)(?:\b|\[\])/.test(value)) return "type";
  if (/^test\(/.test(value)) return "test";
  if (/\bassert(?:\.|\()|console\.assert/.test(value)) return "assertion";
  if (/^(?:if|else\b|switch\b|case\b|!)/.test(value) || /(?:\|\||&&)\s*$/.test(previousLine.trim())) return "condition";
  if (/\bfunction\b|=>/.test(value)) return "fn";
  if (/\bawait\b|\.then\(/.test(value)) return "async";
  if (/process\.env/.test(value)) return "secret";
  if (/^return\b/.test(value) || /\breturn\s/.test(value)) return "result";
  if (/console\.(?:log|error|warn)/.test(value)) return "log";
  if (/^(?:git|npm|npx|node|nslookup)\s/.test(value)) return "command";
  if (/<\/?[A-Za-z][\w.-]*(?:\s|>|\/>)/.test(value)) return "jsx";
  if (/^(?:[\w-]+:|-\s+(?:uses|run):)/.test(value)) return "yaml";
  if (/^[}\]);,]+$/.test(value)) return "close";
  return "data";
}

const makeAnnotations = (source, spec) => Object.fromEntries(
  ["fr", "en", "ar"].map((locale) => [
    locale,
    source.split("\n").map((line, index, lines) => {
      const compact = line.trim().replace(/\s+/g, " ");
      const excerpt = compact.length > 88 ? `${compact.slice(0, 85)}…` : compact;
      return {
        lines: String(index + 1),
        label: `${annotationText[locale][annotationKind(line, lines[index - 1])]} — ${excerpt || spec[locale].artifact}.`,
      };
    }),
  ]),
);

function makeFrenchContent(s, p, g, source, command, filename) {
  return {
    title: s.title,
    prerequisites: [
      p.prerequisite.fr,
      `Pouvoir reformuler « ${s.term} » avant de coder : ${s.definition}`,
      `Savoir créer ${filename}, exécuter ${command} et comparer une sortie réelle à une attente écrite.`,
    ],
    objectives: [
      `${s.focus}`,
      `Construire ${s.artifact}, puis prouver le résultat avec ce signal précis : ${g.evidence}.`,
    ],
    mentalModel: `${p.mental.fr} Dans « ${s.title} », l’entrée concrète est ${g.scenario}. Le concept ${s.term} signifie : ${s.definition} Le modèle n’est donc complet que si ${g.guard} et si l’on peut observer ${g.evidence}.`,
    analogy: `${p.analogy.fr} Ici, la pièce que vous allez réellement contrôler est ${s.artifact} ; l’analogie cesse d’être utile dès qu’elle masque la frontière technique décrite dans le code.`,
    explanation: [
      `Commencez par délimiter le cas de cette leçon : ${g.scenario}. ${s.focus} Le terme ${s.term} n’est pas une étiquette décorative : ${s.definition} Il permet de décider quelle donnée entre, quelle autorité peut agir et quelle observation constitue une preuve plutôt qu’une simple impression.`,
      `Dans ${filename}, l’exemple réduit volontairement le système à ${s.artifact}. Lisez chaque ligne comme une responsabilité, puis exécutez ${command}. La principale défaillance à provoquer est la suivante : ${g.failure}. Elle révèle pourquoi la correction professionnelle consiste à ${g.guard}, et non à cacher l’erreur.`,
      `Dans un système réel, le chemin heureux n’est qu’un cas parmi les répétitions, entrées invalides et pannes partielles. Le résultat attendu est ${g.evidence}. Appliquez ensuite la même preuve à ${p.lecomax.fr}, avec une trace de corrélation sans secret ni donnée personnelle afin que réussite et échec restent explicables.`,
    ],
    vocabulary: [{ term: s.term, definition: s.definition }, ...p.vocabulary.fr],
    generalApplication: `Dans un autre projet, partez de ${g.scenario}, écrivez d’abord l’observation attendue « ${g.evidence} », puis implémentez ${s.artifact}. Simulez ${g.failure} et ne terminez que lorsque la mesure confirme la protection : ${g.guard}.`,
    lecomaxApplication: `Dans L’ecomax, cette leçon protège ${p.lecomax.fr}. Le livrable ${s.artifact} doit rester côté de la bonne frontière de confiance ; réutilisez ${s.term} pour justifier les validations et conservez comme preuve ${g.evidence}.`,
    commands: [`code ${filename}`, command],
    expectedResult: `Après ${command}, ${g.evidence}. Le cas volontairement défaillant montre « ${g.failure} » sans exposer de secret ; après application du garde-fou — ${g.guard} — il est refusé ou traité une seule fois selon le contrat.`,
    commonErrors: [
      { symptom: g.failure, cause: `La mise en œuvre confond le chemin heureux avec le contrat complet et n’applique pas correctement ${s.term} : ${s.definition}`, fix: `Appliquer ce garde-fou spécifique : ${g.guard}. Rejouer ensuite le cas et vérifier que ${g.evidence}.` },
      { symptom: `${s.artifact} semble fonctionner, mais personne ne peut produire la preuve annoncée après un nouvel essai.`, cause: `Pour ${s.title}, la commande ${command}, les données d’entrée et le résultat n’ont pas été reliés dans une reproduction déterministe ; ${p.risk.fr}.`, fix: `Figer ${g.scenario}, exécuter ${command}, enregistrer uniquement le signal utile et comparer explicitement le résultat à « ${g.evidence} ».` },
    ],
    exercise: {
      task: `Réaliser ${s.artifact} dans ${filename}, démontrer ${g.evidence}, puis déclencher et corriger ${g.failure}.`,
      steps: [`Créer ${filename} et identifier dans les annotations l’entrée « ${g.scenario} ».`, `Exécuter ${command} une première fois et conserver la sortie sans secret comme référence.`, `Modifier une seule entrée pour reproduire ce défaut : ${g.failure}.`, `Implémenter « ${g.guard} », relancer la commande et expliquer le rôle de ${s.term}.`],
      hints: [`Relisez la définition : ${s.definition} Cherchez la ligne où cette règle doit être imposée, pas seulement commentée.`, `La preuve cible n’est pas « cela semble marcher » : elle est « ${g.evidence} ».`],
      solutionExplanation: `Pour ${s.title}, la solution maintient une seule autorité et applique précisément « ${g.guard} ». Elle rend ${g.failure} reproductible puis contrôlé, et elle n’est acceptée que lorsque ${g.evidence}.`,
      solutionCode: source,
    },
    quiz: {
      question: `Quelle décision prouve réellement la maîtrise de « ${s.title} » dans ce scénario ?`,
      options: [`${g.guard}, puis vérifier que ${g.evidence}.`, `Ignorer « ${g.failure} » parce que le chemin normal affiche ${s.artifact}.`, `Déplacer la validation vers l’interface et considérer ${s.term} comme un détail serveur.`, `Journaliser toutes les entrées et tous les secrets pour faciliter le diagnostic.`],
      correctIndex: 0,
      explanation: `La première décision relie le garde-fou au signal vérifiable. Les autres ignorent le défaut précis, déplacent l’autorité vers une frontière non fiable ou créent une fuite ; ${s.definition}`,
    },
    recap: [`${s.focus}`, `${s.term} : ${s.definition}`, `La preuve de fin est : ${g.evidence}.`],
    next: g.next,
  };
}

function makeEnglishContent(s, p, g, source, command, filename) {
  return {
    title: s.title,
    prerequisites: [
      p.prerequisite.en,
      `Be able to restate “${s.term}” before coding: ${s.definition}`,
      `Know how to create ${filename}, run ${command}, and compare real output with a written expectation.`,
    ],
    objectives: [s.focus, `Build ${s.artifact}, then prove the result with this exact signal: ${g.evidence}.`],
    mentalModel: `${p.mental.en} In “${s.title}”, the concrete input is ${g.scenario}. ${s.term} means: ${s.definition} The model is complete only when you ${g.guard} and can observe that ${g.evidence}.`,
    analogy: `${p.analogy.en} Here the part you will actually inspect is ${s.artifact}; stop using the analogy if it obscures the technical boundary shown by the code.`,
    explanation: [
      `Start by bounding this lesson’s case: ${g.scenario}. ${s.focus} The term ${s.term} is not a decorative label: ${s.definition} It determines what enters, which authority may act, and which observation counts as evidence rather than an impression.`,
      `In ${filename}, the example deliberately reduces the system to ${s.artifact}. Read each line as one responsibility, then run ${command}. The main failure to trigger is: ${g.failure}. It shows why the professional correction is to ${g.guard}, not to conceal the error.`,
      `In a real system, the happy path is only one case among retries, invalid input, and partial outages. The expected proof is that ${g.evidence}. Apply the same evidence to ${p.lecomax.en}, using a correlation trace without secrets or personal data so both success and failure remain explainable.`,
    ],
    vocabulary: [{ term: s.term, definition: s.definition }, ...p.vocabulary.en],
    generalApplication: `In another project, begin with ${g.scenario}, first write the observation “${g.evidence}”, and then implement ${s.artifact}. Simulate ${g.failure} and finish only when measurement confirms this safeguard: ${g.guard}.`,
    lecomaxApplication: `In L’ecomax, this lesson protects ${p.lecomax.en}. ${s.artifact} must remain on the correct side of the trust boundary; use ${s.term} to justify validation and retain this as evidence: ${g.evidence}.`,
    commands: [`code ${filename}`, command],
    expectedResult: `After ${command}, ${g.evidence}. The deliberately failing case demonstrates “${g.failure}” without exposing a secret; after the safeguard—${g.guard}—it is rejected or processed once according to the contract.`,
    commonErrors: [
      { symptom: g.failure, cause: `The implementation mistakes the happy path for the complete contract and does not correctly apply ${s.term}: ${s.definition}`, fix: `Apply this specific safeguard: ${g.guard}. Replay the case and verify that ${g.evidence}.` },
      { symptom: `${s.artifact} appears to work, but nobody can reproduce the promised evidence on a fresh run.`, cause: `For ${s.title}, ${command}, input data, and outcome were not connected in a deterministic reproduction; ${p.risk.en}.`, fix: `Freeze ${g.scenario}, run ${command}, record only the useful signal, and explicitly compare the outcome with “${g.evidence}”.` },
    ],
    exercise: {
      task: `Implement ${s.artifact} in ${filename}, demonstrate that ${g.evidence}, then trigger and repair ${g.failure}.`,
      steps: [`Create ${filename} and identify the input “${g.scenario}” in the annotations.`, `Run ${command} once and retain secret-free output as the baseline.`, `Change exactly one input to reproduce this defect: ${g.failure}.`, `Implement “${g.guard}”, rerun the command, and explain the role of ${s.term}.`],
      hints: [`Read the definition again: ${s.definition} Find the line where the rule must be enforced, not merely documented.`, `The target evidence is not “it seems to work”; it is “${g.evidence}”.`],
      solutionExplanation: `For ${s.title}, the solution keeps one authority and specifically applies “${g.guard}”. It makes ${g.failure} reproducible and then controlled, and is accepted only when ${g.evidence}.`,
      solutionCode: source,
    },
    quiz: {
      question: `Which decision actually demonstrates mastery of “${s.title}” in this scenario?`,
      options: [`${g.guard}, then verify that ${g.evidence}.`, `Ignore “${g.failure}” because the normal path displays ${s.artifact}.`, `Move validation into the UI and treat ${s.term} as a server detail.`, `Log every input and secret to simplify diagnosis.`],
      correctIndex: 0,
      explanation: `The first decision connects the safeguard to verifiable evidence. The others ignore the exact failure, move authority to an untrusted boundary, or create a leak; ${s.definition}`,
    },
    recap: [s.focus, `${s.term}: ${s.definition}`, `Completion evidence: ${g.evidence}.`],
    next: g.next,
  };
}

function makeArabicContent(s, p, g, source, command, filename) {
  return {
    title: s.title,
    prerequisites: [
      p.prerequisite.ar,
      `القدرة على إعادة شرح «${s.term}» قبل البرمجة: ${s.definition}`,
      `معرفة إنشاء ${filename} وتشغيل ${command} ومقارنة الخرج الحقيقي بتوقع مكتوب.`,
    ],
    objectives: [s.focus, `بناء ${s.artifact} ثم إثبات النتيجة بهذه الإشارة الدقيقة: ${g.evidence}.`],
    mentalModel: `${p.mental.ar} في «${s.title}» يكون المدخل الملموس ${g.scenario}. ويعني ${s.term}: ${s.definition} ولا يكتمل النموذج إلا عند ${g.guard} والقدرة على ملاحظة أن ${g.evidence}.`,
    analogy: `${p.analogy.ar} والجزء الذي ستفحصه فعليًا هنا هو ${s.artifact}؛ توقف عن استخدام التشبيه إذا حجب الحد التقني الذي توضحه الشيفرة.`,
    explanation: [
      `ابدأ بتحديد حالة الدرس: ${g.scenario}. ${s.focus} ليس المصطلح ${s.term} تسمية تجميلية: ${s.definition} فهو يحدد ما يدخل ومن يملك سلطة الفعل وأي ملاحظة تُعد دليلًا بدل أن تكون انطباعًا.`,
      `يختصر المثال في ${filename} النظام عمدًا إلى ${s.artifact}. اقرأ كل سطر كمسؤولية ثم شغّل ${command}. والفشل الرئيسي الذي يجب إطلاقه هو: ${g.failure}. وهذا يوضح أن التصحيح المهني هو ${g.guard} لا إخفاء الخطأ.`,
      `في النظام الحقيقي ليس مسار النجاح سوى حالة بين الإعادات والمدخلات الخاطئة والأعطال الجزئية. والدليل المتوقع هو ${g.evidence}. طبّق الدليل نفسه على ${p.lecomax.ar} باستخدام أثر ارتباط بلا أسرار أو بيانات شخصية ليظل النجاح والفشل قابلين للتفسير.`,
    ],
    vocabulary: [{ term: s.term, definition: s.definition }, ...p.vocabulary.ar],
    generalApplication: `في مشروع آخر ابدأ من ${g.scenario} واكتب أولًا الملاحظة «${g.evidence}» ثم نفذ ${s.artifact}. حاكِ ${g.failure} ولا تنتهِ حتى يؤكد القياس هذه الحماية: ${g.guard}.`,
    lecomaxApplication: `يحمي هذا الدرس في L’ecomax ‏${p.lecomax.ar}. يجب أن يبقى ${s.artifact} في الجانب الصحيح من حد الثقة؛ استخدم ${s.term} لتبرير التحقق واحتفظ بهذا دليلًا: ${g.evidence}.`,
    commands: [`code ${filename}`, command],
    expectedResult: `بعد ${command} يحدث الآتي: ${g.evidence}. تعرض الحالة الفاشلة عمدًا «${g.failure}» بلا كشف سر؛ وبعد تطبيق الحماية — ${g.guard} — تُرفض أو تُعالج مرة واحدة حسب العقد.`,
    commonErrors: [
      { symptom: g.failure, cause: `يخلط التنفيذ بين مسار النجاح والعقد الكامل ولا يطبق ${s.term} تطبيقًا صحيحًا: ${s.definition}`, fix: `طبّق هذه الحماية المحددة: ${g.guard}. ثم أعد الحالة وتحقق من أن ${g.evidence}.` },
      { symptom: `يبدو ${s.artifact} عاملًا لكن لا يستطيع أحد إعادة إنتاج الدليل الموعود في تشغيل جديد.`, cause: `في ${s.title} لم تُربط ${command} وبيانات المدخل والنتيجة في إعادة حتمية؛ ${p.risk.ar}.`, fix: `ثبّت ${g.scenario} وشغّل ${command} وسجل الإشارة المفيدة فقط وقارن النتيجة صراحة بـ «${g.evidence}».` },
    ],
    exercise: {
      task: `نفّذ ${s.artifact} في ${filename} وأثبت ${g.evidence} ثم أطلق وأصلح ${g.failure}.`,
      steps: [`أنشئ ${filename} وحدد في الشروح المدخل «${g.scenario}».`, `شغّل ${command} مرة واحفظ الخرج الخالي من الأسرار خط أساس.`, `غيّر مدخلًا واحدًا فقط لإعادة هذا الخلل: ${g.failure}.`, `نفّذ «${g.guard}» وأعد الأمر واشرح دور ${s.term}.`],
      hints: [`أعد قراءة التعريف: ${s.definition} وابحث عن السطر الذي يجب فرض القاعدة فيه لا مجرد توثيقها.`, `الدليل المستهدف ليس «يبدو عاملًا» بل «${g.evidence}».`],
      solutionExplanation: `في ${s.title} يحافظ الحل على سلطة واحدة ويطبق تحديدًا «${g.guard}». يجعل ${g.failure} قابلًا للتكرار ثم مضبوطًا ولا يُقبل إلا عندما ${g.evidence}.`,
      solutionCode: source,
    },
    quiz: {
      question: `أي قرار يثبت فعلًا إتقان «${s.title}» في هذا السيناريو؟`,
      options: [`${g.guard} ثم التحقق من أن ${g.evidence}.`, `تجاهل «${g.failure}» لأن المسار العادي يعرض ${s.artifact}.`, `نقل التحقق إلى الواجهة واعتبار ${s.term} تفصيل خادم.`, `تسجيل كل المدخلات والأسرار لتسهيل التشخيص.`],
      correctIndex: 0,
      explanation: `يربط القرار الأول الحماية بالدليل القابل للتحقق. أما البقية فتتجاهل الفشل المحدد أو تنقل السلطة لحد غير موثوق أو تنشئ تسريبًا؛ ${s.definition}`,
    },
    recap: [s.focus, `${s.term}: ${s.definition}`, `دليل الاكتمال: ${g.evidence}.`],
    next: g.next,
  };
}

const makeContent = (locale, id, spec, source, command, filename) => {
  const s = spec[locale];
  const domain = lessonDomains[id];
  const p = domainProfiles[domain];
  const g = lessonGuidance[id];
  if (!p || !g) throw new Error(`Missing pedagogy for ${id}`);
  const localizedGuidance = Object.fromEntries(
    Object.entries(g).map(([key, value]) => [key, value[locale]]),
  );
  if (locale === "fr") return makeFrenchContent(s, p, localizedGuidance, source, command, filename);
  if (locale === "en") return makeEnglishContent(s, p, localizedGuidance, source, command, filename);
  return makeArabicContent(s, p, localizedGuidance, source, command, filename);
};

const lesson = ({ id, order, language, filename, command, lines, spec }) => {
  const source = lines.join("\n");
  return {
    id,
    order: order - 1,
    language,
    filename,
    source,
    annotations: makeAnnotations(source, spec),
    locales: {
      fr: makeContent("fr", id, spec, source, command, filename),
      en: makeContent("en", id, spec, source, command, filename),
      ar: makeContent("ar", id, spec, source, command, filename),
    },
  };
};

const moduleBlueprint = ({ id, order, icon, color, existing, create, title, summary, lessons }) => ({
  id,
  order,
  icon,
  color,
  files: [{ path: existing, mode: "existing" }, { path: create, mode: "create" }],
  locales: {
    fr: { title: title.fr, summary: summary.fr },
    en: { title: title.en, summary: summary.en },
    ar: { title: title.ar, summary: summary.ar },
  },
  lessons,
});

const qualityLessons = [
  lesson({
    id: "test-strategy", order: 1, language: "javascript", filename: "exercises/19-quality/price.test.mjs", command: "node --test exercises/19-quality/price.test.mjs",
    lines: [
      'import test from "node:test";',
      'import assert from "node:assert/strict";',
      'const total = (price, quantity) => price * quantity;',
      'test("calculates a cart line", () => {',
      '  assert.equal(total(199, 2), 398);',
      '});',
      'test("keeps zero quantity deterministic", () => {',
      '  assert.equal(total(199, 0), 0);',
      '});',
    ],
    spec: topic(
      tr("Construire une stratégie de tests", "Build a testing strategy", "بناء استراتيجية اختبار"),
      tr("Distinguer tests unitaires, d’intégration et de parcours afin de placer chaque preuve au niveau le moins coûteux.", "Distinguish unit, integration, and journey tests so each proof lives at the least expensive level.", "التمييز بين اختبار الوحدة والتكامل والمسار لوضع كل دليل في المستوى الأقل كلفة."),
      tr("une petite suite Node qui protège le calcul d’une ligne panier", "a small Node suite that protects cart-line calculation", "حزمة Node صغيرة تحمي حساب سطر السلة"),
      tr("pyramide de tests", "test pyramid", "هرم الاختبارات"),
      tr("Répartition donnant beaucoup de tests rapides, quelques tests d’intégration et peu de parcours complets.", "A distribution with many fast tests, some integration tests, and few full journeys.", "توزيع يضم اختبارات سريعة كثيرة وبعض اختبارات التكامل وقليلًا من المسارات الكاملة.")
    ),
  }),
  lesson({
    id: "git-advanced", order: 2, language: "bash", filename: "exercises/19-quality/git-safe-workflow.sh", command: "git diff --check",
    lines: [
      'git switch -c lesson/safe-refactor',
      'git status --short',
      'git add exercises/19-quality',
      'git diff --cached --stat',
      'git diff --cached --check',
      'git commit -m "test: protect cart totals"',
      'git log --oneline -3',
      'git show --stat HEAD',
    ],
    spec: topic(
      tr("Git avancé sans perdre son travail", "Advanced Git without losing work", "Git متقدم من دون فقد العمل"),
      tr("Composer de petits commits vérifiables, inspecter l’index et préférer revert aux opérations destructrices sur une branche partagée.", "Compose small verifiable commits, inspect the index, and prefer revert over destructive operations on a shared branch.", "إنشاء إيداعات صغيرة قابلة للتحقق وفحص منطقة التجهيز وتفضيل revert على العمليات المدمرة في الفرع المشترك."),
      tr("un workflow de branche et de commit que l’on peut auditer avant publication", "a branch-and-commit workflow that can be audited before publishing", "تدفق فرع وإيداع يمكن تدقيقه قبل النشر"),
      tr("index Git", "Git index", "فهرس Git"),
      tr("Zone intermédiaire qui définit exactement le prochain instantané, indépendamment des autres modifications locales.", "The staging area that defines the exact next snapshot independently of other local edits.", "منطقة التجهيز التي تحدد اللقطة التالية بدقة بعيدًا عن بقية التعديلات المحلية.")
    ),
  }),
  lesson({
    id: "systematic-debugging", order: 3, language: "typescript", filename: "exercises/19-quality/debug-order.ts", command: "npx tsc --noEmit",
    lines: [
      'type Order = { id: string; total: number };',
      'const orders: Order[] = [{ id: "ord_1", total: 398 }];',
      'const findOrder = (id: string) => orders.find((order) => order.id === id);',
      'const order = findOrder("ord_missing");',
      'if (!order) {',
      '  console.error({ code: "ORDER_NOT_FOUND", id: "ord_missing" });',
      '} else {',
      '  console.log({ id: order.id, total: order.total });',
      '}',
    ],
    spec: topic(
      tr("Déboguer par hypothèses", "Debug with hypotheses", "تصحيح الأخطاء بالفرضيات"),
      tr("Reproduire le défaut, réduire la zone de recherche, formuler une hypothèse mesurable et ne changer qu’une variable à la fois.", "Reproduce the defect, narrow the search area, state a measurable hypothesis, and change only one variable at a time.", "إعادة إنتاج الخلل وتضييق نطاق البحث وصياغة فرضية قابلة للقياس وتغيير متغير واحد كل مرة."),
      tr("un diagnostic reproductible avec une erreur métier structurée et aucune donnée sensible", "a reproducible diagnosis with a structured domain error and no sensitive data", "تشخيص قابل للتكرار بخطأ مجال منظم ومن دون بيانات حساسة"),
      tr("hypothèse falsifiable", "falsifiable hypothesis", "فرضية قابلة للدحض"),
      tr("Explication assez précise pour qu’une observation puisse la confirmer ou la réfuter.", "An explanation precise enough for an observation to confirm or disprove it.", "تفسير دقيق بما يكفي لتؤكده ملاحظة أو تنفيه.")
    ),
  }),
  lesson({
    id: "safe-refactoring", order: 4, language: "typescript", filename: "exercises/19-quality/refactor-total.ts", command: "npx tsc --noEmit",
    lines: [
      'type CartLine = { unitPrice: number; quantity: number };',
      'const lineTotal = ({ unitPrice, quantity }: CartLine) => unitPrice * quantity;',
      'const cartTotal = (lines: CartLine[]) =>',
      '  lines.reduce((sum, line) => sum + lineTotal(line), 0);',
      'const sample = [{ unitPrice: 199, quantity: 2 }];',
      'const result = cartTotal(sample);',
      'if (result !== 398) throw new Error("cart total changed");',
      'console.log({ result });',
    ],
    spec: topic(
      tr("Refactorer sans changer le comportement", "Refactor without changing behavior", "إعادة الهيكلة من دون تغيير السلوك"),
      tr("Sécuriser le comportement actuel, extraire une responsabilité à la fois et vérifier le même contrat après chaque petit changement.", "Lock down current behavior, extract one responsibility at a time, and verify the same contract after every small change.", "تثبيت السلوك الحالي واستخراج مسؤولية واحدة كل مرة والتحقق من العقد نفسه بعد كل تغيير صغير."),
      tr("un calcul panier séparé en fonctions nommées avec une assertion de non-régression", "a cart calculation split into named functions with a regression assertion", "حساب سلة مقسم إلى دوال مسماة مع تأكيد يمنع التراجع"),
      tr("refactoring", "refactoring", "إعادة الهيكلة"),
      tr("Amélioration de la structure interne sans modification du comportement observable.", "Improving internal structure without changing observable behavior.", "تحسين البنية الداخلية من دون تغيير السلوك القابل للملاحظة.")
    ),
  }),
];

const webQualityLessons = [
  lesson({
    id: "seo-metadata", order: 1, language: "typescript", filename: "exercises/20-web-quality/product-metadata.ts", command: "npm run build",
    lines: [
      'import type { Metadata } from "next";',
      'const product = { name: "Sac de voyage", description: "Sac cabine robuste", slug: "sac-voyage" };',
      'export const metadata: Metadata = {',
      '  title: `${product.name} | L’ecomax`,',
      '  description: product.description,',
      '  alternates: { canonical: `/produit/${product.slug}` },',
      '  openGraph: { title: product.name, description: product.description },',
      '};',
    ],
    spec: topic(
      tr("SEO technique et métadonnées", "Technical SEO and metadata", "SEO التقني والبيانات الوصفية"),
      tr("Produire pour chaque page un titre distinct, une description utile, une URL canonique et des données sociales cohérentes avec le contenu visible.", "Give every page a distinct title, useful description, canonical URL, and social data consistent with visible content.", "منح كل صفحة عنوانًا مميزًا ووصفًا مفيدًا ورابطًا أساسيًا وبيانات اجتماعية متوافقة مع المحتوى الظاهر."),
      tr("des métadonnées Next.js typées pour une fiche produit indexable et partageable", "typed Next.js metadata for an indexable, shareable product page", "بيانات Next.js وصفية مكتوبة الأنواع لصفحة منتج قابلة للفهرسة والمشاركة"),
      tr("URL canonique", "canonical URL", "الرابط الأساسي"),
      tr("Adresse préférée déclarée aux moteurs lorsque plusieurs URL peuvent montrer le même contenu.", "The preferred address declared to search engines when several URLs may show the same content.", "العنوان المفضل المعلن لمحركات البحث عندما تعرض روابط متعددة المحتوى نفسه.")
    ),
  }),
  lesson({
    id: "accessible-interface", order: 2, language: "tsx", filename: "exercises/20-web-quality/AccessibleProductCard.tsx", command: "npm run build",
    lines: [
      'export function AccessibleProductCard() {',
      '  return <article aria-labelledby="product-title">',
      '    <h2 id="product-title">Sac de voyage</h2>',
      '    <p>Capacité 60 litres, disponible en noir.</p>',
      '    <button type="button" aria-describedby="stock-status">Ajouter au panier</button>',
      '    <span id="stock-status" role="status">En stock</span>',
      '  </article>;',
      '}',
    ],
    spec: topic(
      tr("Accessibilité au clavier et aux lecteurs d’écran", "Keyboard and screen-reader accessibility", "إتاحة لوحة المفاتيح وقارئات الشاشة"),
      tr("Utiliser le HTML sémantique, un ordre de focus logique, des noms accessibles et des annonces qui ne dépendent ni de la couleur ni de la souris.", "Use semantic HTML, logical focus order, accessible names, and announcements that depend on neither color nor a mouse.", "استخدام HTML دلالي وترتيب تركيز منطقي وأسماء متاحة وإعلانات لا تعتمد على اللون أو الفأرة."),
      tr("une carte produit navigable au clavier dont le stock est annoncé correctement", "a keyboard-operable product card whose stock state is announced correctly", "بطاقة منتج تعمل بلوحة المفاتيح وتعلن حالة المخزون بوضوح"),
      tr("nom accessible", "accessible name", "الاسم المتاح"),
      tr("Texte calculé par le navigateur pour identifier un contrôle auprès des technologies d’assistance.", "Text computed by the browser to identify a control to assistive technology.", "نص يحسبه المتصفح لتعريف عنصر التحكم للتقنيات المساعدة.")
    ),
  }),
  lesson({
    id: "performance-core-web-vitals", order: 3, language: "tsx", filename: "exercises/20-web-quality/FastHero.tsx", command: "npm run build",
    lines: [
      'import Image from "next/image";',
      'export function FastHero() {',
      '  return <section>',
      '    <h1>Des essentiels utiles, livrés simplement</h1>',
      '    <Image src="/ecomax-hero-banner.jpg.png" alt="Sélection L’ecomax"',
      '      width={1440} height={720} priority sizes="100vw" />',
      '  </section>;',
      '}',
    ],
    spec: topic(
      tr("Performance et Core Web Vitals", "Performance and Core Web Vitals", "الأداء ومؤشرات الويب الأساسية"),
      tr("Relier LCP, INP et CLS à une cause concrète, optimiser d’abord l’élément principal et mesurer avant comme après chaque changement.", "Connect LCP, INP, and CLS to concrete causes, optimize the main element first, and measure before and after every change.", "ربط LCP وINP وCLS بأسباب ملموسة وتحسين العنصر الرئيسي أولًا والقياس قبل كل تغيير وبعده."),
      tr("un hero dimensionné qui réserve son espace et précharge uniquement l’image critique", "a dimensioned hero that reserves space and prioritizes only the critical image", "قسم hero محدد الأبعاد يحجز مساحته ويعطي الأولوية للصورة الحرجة فقط"),
      tr("Largest Contentful Paint", "Largest Contentful Paint", "أكبر رسم للمحتوى"),
      tr("Temps nécessaire pour afficher le plus grand élément significatif visible dans la fenêtre.", "Time required to render the largest meaningful element visible in the viewport.", "الوقت اللازم لرسم أكبر عنصر ذي معنى ظاهر في نافذة العرض.")
    ),
  }),
  lesson({
    id: "quality-audit", order: 4, language: "markdown", filename: "exercises/20-web-quality/audit.md", command: "npm run build",
    lines: [
      '# Audit d’une page produit',
      '- [ ] Un seul h1 décrit le produit',
      '- [ ] Le bouton panier possède un nom accessible',
      '- [ ] Les images ont dimensions et texte alternatif',
      '- [ ] Le contenu principal fonctionne sans souris',
      '- [ ] Le build ne signale aucune erreur',
      '- [ ] LCP, INP et CLS sont mesurés',
      '- [ ] Les corrections sont classées par impact',
    ],
    spec: topic(
      tr("Auditer SEO, accessibilité et performance", "Audit SEO, accessibility, and performance", "تدقيق SEO والإتاحة والأداء"),
      tr("Combiner vérifications automatisées et parcours manuel, conserver des preuves avant/après et classer les corrections selon impact utilisateur et risque.", "Combine automated checks with a manual journey, retain before-and-after evidence, and rank fixes by user impact and risk.", "دمج الفحوص الآلية مع مسار يدوي وحفظ أدلة قبل وبعد وترتيب الإصلاحات حسب أثر المستخدم والمخاطر."),
      tr("une checklist d’audit reproductible pour les pages produit de L’ecomax", "a reproducible audit checklist for L’ecomax product pages", "قائمة تدقيق قابلة للتكرار لصفحات منتجات L’ecomax"),
      tr("audit", "audit", "التدقيق"),
      tr("Examen systématique fondé sur des critères, des preuves et un ordre de priorité.", "A systematic review based on criteria, evidence, and priority.", "مراجعة منهجية مبنية على معايير وأدلة وترتيب أولويات.")
    ),
  }),
];

const emailLessons = [
  lesson({
    id: "resend-transactional", order: 1, language: "typescript", filename: "exercises/21-email/resend-order.ts", command: "npm run build",
    lines: [
      'import { Resend } from "resend";',
      'const resend = new Resend(process.env.RESEND_API_KEY);',
      'export async function sendReceipt(to: string, orderId: string) {',
      '  if (!to || !orderId) throw new Error("missing receipt input");',
      '  return resend.emails.send({',
      '    from: "L’ecomax <orders@example.com>", to,',
      '    subject: `Commande ${orderId}`, text: `Merci. Référence : ${orderId}`,',
      '  });',
      '}',
    ],
    spec: topic(
      tr("Envoyer un email transactionnel avec Resend", "Send transactional email with Resend", "إرسال بريد معاملاتي عبر Resend"),
      tr("Garder la clé Resend côté serveur, séparer la création du message de son envoi et enregistrer l’identifiant fournisseur pour diagnostiquer la livraison.", "Keep the Resend key server-side, separate message construction from delivery, and record the provider identifier for delivery diagnosis.", "حفظ مفتاح Resend في الخادم وفصل بناء الرسالة عن إرسالها وتسجيل معرّف المزود لتشخيص التسليم."),
      tr("une fonction serveur minimale qui envoie un reçu de commande sans exposer la clé API", "a minimal server function that sends an order receipt without exposing the API key", "دالة خادم صغيرة ترسل إيصال طلب من دون كشف مفتاح API"),
      tr("email transactionnel", "transactional email", "البريد المعاملاتي"),
      tr("Message déclenché par une action précise du destinataire, par exemple une commande ou une réinitialisation.", "A message triggered by a specific recipient action, such as an order or password reset.", "رسالة يطلقها إجراء محدد للمستلم مثل الطلب أو إعادة تعيين كلمة المرور.")
    ),
  }),
  lesson({
    id: "nodemailer-smtp", order: 2, language: "typescript", filename: "exercises/21-email/nodemailer-smtp.ts", command: "npm run build",
    lines: [
      'import nodemailer from "nodemailer";',
      'const transport = nodemailer.createTransport({',
      '  host: process.env.SMTP_HOST, port: 587, secure: false,',
      '  requireTLS: true,',
      '  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },',
      '});',
      'export async function verifyMailServer() {',
      '  await transport.verify();',
      '  return { ready: true };',
      '}',
    ],
    spec: topic(
      tr("Comprendre SMTP avec Nodemailer", "Understand SMTP with Nodemailer", "فهم SMTP عبر Nodemailer"),
      tr("Configurer hôte, port, chiffrement et authentification depuis l’environnement puis vérifier la connexion avant d’accepter un flux métier.", "Configure host, port, encryption, and authentication from the environment, then verify the connection before accepting a business flow.", "ضبط المضيف والمنفذ والتشفير والمصادقة من البيئة ثم التحقق من الاتصال قبل قبول تدفق العمل."),
      tr("un transport SMTP vérifiable dont les identifiants restent exclusivement côté serveur", "a verifiable SMTP transport whose credentials remain server-only", "ناقل SMTP قابل للتحقق تبقى بياناته السرية في الخادم فقط"),
      tr("SMTP", "SMTP", "SMTP"),
      tr("Protocole utilisé par les serveurs pour soumettre et transférer les messages électroniques.", "The protocol servers use to submit and transfer email messages.", "البروتوكول الذي تستخدمه الخوادم لتقديم رسائل البريد ونقلها.")
    ),
  }),
  lesson({
    id: "imap-inbox", order: 3, language: "typescript", filename: "exercises/21-email/imap-inbox.ts", command: "npm run build",
    lines: [
      'import { ImapFlow } from "imapflow";',
      'const client = new ImapFlow({',
      '  host: process.env.IMAP_HOST!, port: 993, secure: true,',
      '  auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASS! },',
      '  logger: false,',
      '});',
      'export async function countInbox() {',
      '  await client.connect(); const lock = await client.getMailboxLock("INBOX");',
      '  try { return client.mailbox.exists; } finally { lock.release(); await client.logout(); }',
      '}',
    ],
    spec: topic(
      tr("Lire une boîte avec IMAP en sécurité", "Read a mailbox safely with IMAP", "قراءة صندوق بريد بأمان عبر IMAP"),
      tr("Acquérir un verrou de boîte, limiter les données récupérées et garantir libération puis déconnexion dans finally même après une erreur.", "Acquire a mailbox lock, limit fetched data, and guarantee release and logout in finally even after a failure.", "حجز قفل صندوق البريد وتقليل البيانات المسترجعة وضمان تحرير القفل وتسجيل الخروج داخل finally حتى بعد الخطأ."),
      tr("une lecture IMAP bornée qui compte les messages sans télécharger leur contenu", "a bounded IMAP read that counts messages without downloading their content", "قراءة IMAP محدودة تعد الرسائل من دون تنزيل محتواها"),
      tr("verrou de boîte", "mailbox lock", "قفل صندوق البريد"),
      tr("Mécanisme qui sérialise les opérations sensibles pendant qu’un dossier IMAP est sélectionné.", "A mechanism that serializes sensitive operations while an IMAP folder is selected.", "آلية تسلسل العمليات الحساسة أثناء تحديد مجلد IMAP.")
    ),
  }),
  lesson({
    id: "emailjs-browser", order: 4, language: "typescript", filename: "exercises/21-email/emailjs-contact.ts", command: "npm run build",
    lines: [
      'import emailjs from "@emailjs/browser";',
      'type Contact = { name: string; replyTo: string; message: string };',
      'export async function sendContact(input: Contact) {',
      '  if (input.message.trim().length < 10) throw new Error("message too short");',
      '  return emailjs.send(',
      '    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,',
      '    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!, input,',
      '    { publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY! },',
      '  );',
      '}',
    ],
    spec: topic(
      tr("Formulaire navigateur avec EmailJS", "Browser form with EmailJS", "نموذج متصفح عبر EmailJS"),
      tr("Comprendre qu’une clé publique est visible, valider et limiter côté interface, puis renforcer le modèle avec quotas, modèle fournisseur et protection anti-abus.", "Understand that a public key is visible, validate and limit in the UI, then strengthen the design with quotas, provider templates, and abuse protection.", "فهم أن المفتاح العام ظاهر والتحقق والتقييد في الواجهة ثم تعزيز التصميم بالحصص وقوالب المزود والحماية من الإساءة."),
      tr("un envoi de formulaire typé qui refuse les messages trop courts et n’embarque aucun secret privé", "a typed form submission that rejects short messages and embeds no private secret", "إرسال نموذج مكتوب الأنواع يرفض الرسائل القصيرة ولا يضم أي سر خاص"),
      tr("clé publique", "public key", "المفتاح العام"),
      tr("Identifiant conçu pour être distribué au client et qui ne remplace jamais une authentification serveur.", "An identifier designed for distribution to clients that never replaces server authentication.", "معرّف مصمم للتوزيع على العملاء ولا يحل أبدًا محل مصادقة الخادم.")
    ),
  }),
];

const paymentLessons = [
  lesson({
    id: "paypal-order-lifecycle", order: 1, language: "typescript", filename: "exercises/22-payments/paypal-order.ts", command: "npm run build",
    lines: [
      'type UsdMoney = { currency: "USD"; minor: number };',
      'type PricedCart = { id: string; serverTotal: UsdMoney };',
      'const formatUsd = (minor: number) => (minor / 100).toFixed(2);',
      'export function createPayPalPayload(cart: PricedCart) {',
      '  if (!Number.isSafeInteger(cart.serverTotal.minor) || cart.serverTotal.minor <= 0) {',
      '    throw new Error("invalid server total");',
      '  }',
      '  return { intent: "CAPTURE", purchase_units: [{',
      '    reference_id: cart.id,',
      '    amount: { currency_code: cart.serverTotal.currency, value: formatUsd(cart.serverTotal.minor) },',
      '  }] };',
      '}',
    ],
    spec: topic(
      tr("Cycle de vie d’une commande PayPal", "PayPal order lifecycle", "دورة حياة طلب PayPal"),
      tr("Calculer le montant sur le serveur, créer une commande fournisseur, faire approuver par le client puis capturer et rapprocher la référence interne.", "Calculate the amount on the server, create a provider order, obtain customer approval, then capture and reconcile the internal reference.", "حساب المبلغ في الخادم وإنشاء طلب لدى المزود والحصول على موافقة العميل ثم التحصيل ومطابقة المرجع الداخلي."),
      tr("une charge PayPal déterministe dont la référence relie le paiement au panier L’ecomax", "a deterministic PayPal payload whose reference connects payment to the L’ecomax cart", "حمولة PayPal حتمية يربط مرجعها الدفع بسلة L’ecomax"),
      tr("capture", "capture", "التحصيل"),
      tr("Étape qui transforme une autorisation approuvée en transfert de fonds confirmé.", "The step that turns an approved authorization into a confirmed transfer of funds.", "الخطوة التي تحول التفويض الموافق عليه إلى تحويل أموال مؤكد.")
    ),
  }),
  lesson({
    id: "paypal-webhook", order: 2, language: "typescript", filename: "exercises/22-payments/paypal-webhook.ts", command: "npm run build",
    lines: [
      'type PayPalHeaders = { transmissionId: string; transmissionTime: string;',
      '  transmissionSignature: string; certificateUrl: string; authenticationAlgorithm: string };',
      'type PayPalEvent = { id: string; event_type: string; resource: { id: string } };',
      'type VerifyConfig = { apiBase: "https://api-m.paypal.com" | "https://api-m.sandbox.paypal.com";',
      '  webhookId: string; accessToken: string };',
      'export async function verifyPayPalWebhook(rawBody: string, h: PayPalHeaders, c: VerifyConfig) {',
      '  const webhookEvent: unknown = JSON.parse(rawBody);',
      '  const response = await fetch(`${c.apiBase}/v1/notifications/verify-webhook-signature`, {',
      '    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${c.accessToken}` },',
      '    body: JSON.stringify({ transmission_id: h.transmissionId, transmission_time: h.transmissionTime,',
      '      cert_url: h.certificateUrl, auth_algo: h.authenticationAlgorithm, transmission_sig: h.transmissionSignature,',
      '      webhook_id: c.webhookId, webhook_event: webhookEvent }),',
      '  });',
      '  if (!response.ok) throw new Error("PayPal verification request failed");',
      '  const result: unknown = await response.json();',
      '  if (!result || typeof result !== "object" ||',
      '      (result as { verification_status?: string }).verification_status !== "SUCCESS") {',
      '    throw new Error("PayPal webhook signature rejected");',
      '  }',
      '  const event = webhookEvent as Partial<PayPalEvent>;',
      '  if (!event.id || !event.event_type || !event.resource?.id) throw new Error("invalid PayPal event");',
      '  const accepted = new Set(["PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED"]);',
      '  return accepted.has(event.event_type) ? { verified: true, event: event as PayPalEvent } : { verified: true, ignored: true };',
      '}',
    ],
    spec: topic(
      tr("Vérifier et traiter les webhooks", "Verify and process webhooks", "التحقق من webhooks ومعالجتها"),
      tr("Vérifier signature et certificat sur le corps brut, filtrer les types acceptés et accuser réception rapidement avant le travail différé.", "Verify signature and certificate against the raw body, filter accepted event types, and acknowledge quickly before deferred work.", "التحقق من التوقيع والشهادة على الجسم الخام وتصفية أنواع الأحداث المقبولة وإقرار الاستلام سريعًا قبل العمل المؤجل."),
      tr("un gestionnaire qui n’accepte que les événements PayPal vérifiés et utiles au statut de commande", "a handler that accepts only verified PayPal events relevant to order status", "معالج لا يقبل إلا أحداث PayPal المتحقق منها والمفيدة لحالة الطلب"),
      tr("signature de webhook", "webhook signature", "توقيع webhook"),
      tr("Preuve cryptographique permettant d’établir que l’événement reçu provient réellement du fournisseur.", "Cryptographic evidence establishing that the received event truly came from the provider.", "دليل تشفيري يثبت أن الحدث المستلم جاء فعلًا من المزود.")
    ),
  }),
  lesson({
    id: "refund-workflow", order: 3, language: "typescript", filename: "exercises/22-payments/refund.ts", command: "npx tsc --noEmit",
    lines: [
      'type RefundRequest = { captureId: string; minor: number; currency: "USD"; reason: string };',
      'type CaptureBalance = { capturedMinor: number; refundedMinor: number; currency: "USD" };',
      'export function validateRefund(input: RefundRequest, balance: CaptureBalance) {',
      '  if (!input.captureId) throw new Error("capture required");',
      '  if (![balance.capturedMinor, balance.refundedMinor].every(Number.isSafeInteger) || balance.refundedMinor < 0) throw new Error("invalid capture balance");',
      '  const refundableMinor = balance.capturedMinor - balance.refundedMinor;',
      '  if (input.currency !== balance.currency || !Number.isSafeInteger(input.minor)) throw new Error("invalid money");',
      '  if (input.minor <= 0 || input.minor > refundableMinor) throw new Error("amount exceeds refundable balance");',
      '  if (input.reason.trim().length < 8) throw new Error("reason required");',
      '  return { captureId: input.captureId, amount: (input.minor / 100).toFixed(2), currency: input.currency, reason: input.reason.trim() };',
      '}',
      'console.log(validateRefund({ captureId: "CAP-1", minor: 2000, currency: "USD", reason: "item returned" },',
      '  { capturedMinor: 5000, refundedMinor: 1000, currency: "USD" }));',
    ],
    spec: topic(
      tr("Remboursements et rapprochement", "Refunds and reconciliation", "الاسترداد والمطابقة"),
      tr("Valider montant et motif, lier le remboursement à la capture d’origine et conserver les identifiants de chaque transition pour le support et la comptabilité.", "Validate amount and reason, link the refund to the original capture, and retain identifiers for every transition for support and accounting.", "التحقق من المبلغ والسبب وربط الاسترداد بالتحصيل الأصلي وحفظ معرّفات كل انتقال للدعم والمحاسبة."),
      tr("une demande de remboursement bornée qui refuse les montants impossibles avant tout appel réseau", "a bounded refund request that rejects impossible amounts before any network call", "طلب استرداد محدود يرفض المبالغ المستحيلة قبل أي اتصال بالشبكة"),
      tr("rapprochement", "reconciliation", "المطابقة"),
      tr("Comparaison des données internes avec celles du prestataire pour détecter les écarts financiers.", "Comparison of internal records with provider records to detect financial discrepancies.", "مقارنة السجلات الداخلية بسجلات المزود لاكتشاف الفروق المالية.")
    ),
  }),
  lesson({
    id: "payment-idempotency", order: 4, language: "typescript", filename: "exercises/22-payments/idempotency.ts", command: "npx tsc --noEmit",
    lines: [
      'type StoredEvent = { eventId: string; orderId: string; status: "paid" };',
      'type EventStore = { insertOnce(event: StoredEvent): Promise<"inserted" | "duplicate"> };',
      'export async function applyPayment(store: EventStore, eventId: string, orderId: string) {',
      '  if (!eventId || !orderId) throw new Error("missing payment identity");',
      '  const event: StoredEvent = { eventId, orderId, status: "paid" };',
      '  const result = await store.insertOnce(event); // backed by a UNIQUE(event_id) transaction',
      '  return { ...event, duplicate: result === "duplicate" };',
      '}',
    ],
    spec: topic(
      tr("Idempotence et doubles paiements", "Idempotency and duplicate payments", "عدم التكرار والمدفوعات المزدوجة"),
      tr("Attribuer une clé stable à l’opération, enregistrer son résultat dans la même transaction métier et retourner ce résultat lors de toute répétition.", "Give the operation a stable key, store its result in the same business transaction, and return that result on every retry.", "منح العملية مفتاحًا ثابتًا وتخزين نتيجتها في معاملة العمل نفسها وإعادة النتيجة عند كل محاولة مكررة."),
      tr("une simulation qui applique un événement une seule fois même lorsqu’il est livré deux fois", "a simulation that applies an event once even when it is delivered twice", "محاكاة تطبق الحدث مرة واحدة حتى عند وصوله مرتين"),
      tr("idempotence", "idempotency", "عدم التكرار"),
      tr("Propriété selon laquelle répéter la même requête produit le même état final sans nouvel effet.", "The property where repeating the same request yields the same final state without a new side effect.", "خاصية تجعل تكرار الطلب نفسه ينتج الحالة النهائية نفسها بلا أثر جديد.")
    ),
  }),
];

const notificationLessons = [
  lesson({
    id: "web-push-subscription", order: 1, language: "typescript", filename: "exercises/23-notifications/push-subscription.ts", command: "npm run build",
    lines: [
      'export async function subscribeToPush(registration: ServiceWorkerRegistration, publicKey: string) {',
      '  const permission = await Notification.requestPermission();',
      '  if (permission !== "granted") return { subscribed: false };',
      '  const subscription = await registration.pushManager.subscribe({',
      '    userVisibleOnly: true,',
      '    applicationServerKey: publicKey,',
      '  });',
      '  return { subscribed: true, subscription: subscription.toJSON() };',
      '}',
    ],
    spec: topic(
      tr("Abonnement Web Push avec consentement", "Web Push subscription with consent", "اشتراك Web Push بالموافقة"),
      tr("Demander la permission après une intention utilisateur, créer l’abonnement avec la clé VAPID publique et offrir une désinscription aussi simple que l’inscription.", "Request permission after user intent, create the subscription with the public VAPID key, and make unsubscribe as easy as subscribe.", "طلب الإذن بعد نية المستخدم وإنشاء الاشتراك بمفتاح VAPID العام وجعل إلغاء الاشتراك بسهولة الاشتراك."),
      tr("un flux d’abonnement qui respecte le refus et ne confond pas permission avec abonnement serveur", "a subscription flow that respects denial and does not confuse permission with server registration", "تدفق اشتراك يحترم الرفض ولا يخلط الإذن بالتسجيل في الخادم"),
      tr("VAPID", "VAPID", "VAPID"),
      tr("Paire de clés qui identifie le serveur d’application auprès du service Push sans authentifier l’utilisateur.", "A key pair identifying the application server to the Push service without authenticating the user.", "زوج مفاتيح يعرّف خادم التطبيق لخدمة Push من دون مصادقة المستخدم.")
    ),
  }),
  lesson({
    id: "service-worker-notification", order: 2, language: "javascript", filename: "exercises/23-notifications/service-worker.js", command: "npm run build",
    lines: [
      'const safePath = (value) => {',
      '  try { const url = new URL(typeof value === "string" ? value : "/", self.location.origin);',
      '    return url.origin === self.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/";',
      '  } catch { return "/"; }',
      '};',
      'self.addEventListener("push", (event) => {',
      '  let data = { title: "L’ecomax", body: "Nouvelle information", url: "/" };',
      '  try { data = { ...data, ...(event.data?.json() ?? {}) }; } catch { /* keep safe fallback */ }',
      '  event.waitUntil(self.registration.showNotification(data.title, {',
      '    body: String(data.body).slice(0, 240), icon: "/favicon.png", data: { url: safePath(data.url) },',
      '  }));',
      '});',
      'self.addEventListener("notificationclick", (event) => {',
      '  event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data.url));',
      '});',
    ],
    spec: topic(
      tr("Afficher une notification dans le Service Worker", "Display a notification in the Service Worker", "عرض إشعار في Service Worker"),
      tr("Décoder une charge minimale, fournir un repli sûr, prolonger la durée de vie avec waitUntil et ouvrir uniquement une URL validée lors du clic.", "Decode a minimal payload, provide a safe fallback, extend lifetime with waitUntil, and open only a validated URL on click.", "فك حمولة صغيرة وتوفير بديل آمن وتمديد العمر عبر waitUntil وفتح رابط متحقق منه فقط عند النقر."),
      tr("un gestionnaire Push qui affiche puis relie la notification à une page L’ecomax", "a Push handler that displays and links the notification to an L’ecomax page", "معالج Push يعرض الإشعار ويربطه بصفحة L’ecomax"),
      tr("Service Worker", "Service Worker", "عامل الخدمة"),
      tr("Script isolé du document capable de recevoir des événements en arrière-plan selon les règles du navigateur.", "A document-independent script able to receive background events under browser rules.", "برنامج مستقل عن المستند يستقبل أحداث الخلفية وفق قواعد المتصفح.")
    ),
  }),
  lesson({
    id: "whatsapp-webhook", order: 3, language: "typescript", filename: "exercises/23-notifications/whatsapp-webhook.ts", command: "npm run build",
    lines: [
      'import { createHmac, timingSafeEqual } from "node:crypto";',
      'type WhatsAppMessage = { id: string; from: string; text?: { body: string } };',
      'type WhatsAppEnvelope = { entry?: Array<{ changes?: Array<{ value?: { messages?: WhatsAppMessage[] } }> }> };',
      'function verifyMetaSignature(rawBody: string, signature: string, appSecret: string) {',
      '  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;',
      '  const actualBytes = Buffer.from(signature); const expectedBytes = Buffer.from(expected);',
      '  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) throw new Error("invalid signature");',
      '}',
      'export function verifyAndNormalizeWhatsApp(rawBody: string, signature: string, appSecret: string) {',
      '  verifyMetaSignature(rawBody, signature, appSecret);',
      '  const envelope = JSON.parse(rawBody) as WhatsAppEnvelope;',
      '  const message = envelope.entry?.[0]?.changes?.[0]?.value?.messages?.[0];',
      '  if (!message) return { ignored: true, reason: "no message" };',
      '  if (!message.id || !message.from) throw new Error("invalid message envelope");',
      '  const body = message.text?.body?.trim();',
      '  if (!body) return { ignored: true, reason: "unsupported message" };',
      '  return {',
      '    externalId: message.id, sender: message.from, body: body.slice(0, 2000),',
      '  };',
      '}',
    ],
    spec: topic(
      tr("Webhook WhatsApp et normalisation", "WhatsApp webhook and normalization", "Webhook واتساب والتطبيع"),
      tr("Vérifier le webhook, distinguer les types de message, borner le texte et conserver l’identifiant externe pour dédupliquer les livraisons.", "Verify the webhook, distinguish message types, bound text, and retain the external identifier to deduplicate deliveries.", "التحقق من webhook وتمييز أنواع الرسائل وتحديد طول النص وحفظ المعرّف الخارجي لإزالة التسليمات المكررة."),
      tr("une frontière qui transforme un message texte WhatsApp en donnée interne sûre", "a boundary that turns a WhatsApp text message into safe internal data", "حد يحول رسالة واتساب النصية إلى بيانات داخلية آمنة"),
      tr("normalisation", "normalization", "التطبيع"),
      tr("Transformation de formats externes variés vers une forme interne stable et validée.", "Transforming varied external formats into a stable, validated internal shape.", "تحويل التنسيقات الخارجية المتنوعة إلى شكل داخلي ثابت ومتحقق منه.")
    ),
  }),
  lesson({
    id: "notification-orchestration", order: 4, language: "typescript", filename: "exercises/23-notifications/orchestrator.ts", command: "npx tsc --noEmit",
    lines: [
      'type Preference = { email: boolean; push: boolean; whatsapp: boolean };',
      'type Channel = keyof Preference;',
      'export function chooseChannels(preference: Preference, urgent: boolean): Channel[] {',
      '  const allowed = (Object.keys(preference) as Channel[]).filter((key) => preference[key]);',
      '  if (!urgent) return allowed.slice(0, 1);',
      '  return allowed;',
      '}',
      'console.log(chooseChannels({ email: true, push: true, whatsapp: false }, false));',
    ],
    spec: topic(
      tr("Orchestrer les canaux sans spam", "Orchestrate channels without spam", "تنسيق القنوات بلا إزعاج"),
      tr("Centraliser préférences, urgence, fréquence et désinscription afin qu’un événement métier ne contacte jamais directement tous les fournisseurs.", "Centralize preferences, urgency, frequency, and unsubscribe rules so a business event never contacts every provider directly.", "مركزة التفضيلات والاستعجال والتكرار وإلغاء الاشتراك كي لا يتصل حدث العمل بكل المزودين مباشرة."),
      tr("un sélecteur de canaux déterministe qui respecte le choix du client et limite les doublons", "a deterministic channel selector that respects customer choice and limits duplicates", "محدد قنوات حتمي يحترم اختيار العميل ويحد التكرار"),
      tr("orchestration", "orchestration", "التنسيق"),
      tr("Couche qui applique les règles transversales avant de déléguer l’envoi à un canal particulier.", "A layer applying cross-cutting rules before delegating delivery to a particular channel.", "طبقة تطبق القواعد المشتركة قبل تفويض الإرسال إلى قناة محددة.")
    ),
  }),
];

const aiLessons = [
  lesson({
    id: "openai-server-call", order: 1, language: "typescript", filename: "exercises/24-ai/openai-product.ts", command: "npm run build",
    lines: [
      'import OpenAI from "openai";',
      'const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });',
      'export async function draftProduct(name: string) {',
      '  if (name.trim().length < 3) throw new Error("name too short");',
      '  const response = await openai.responses.create({',
      '    model: "gpt-5-mini", input: `Write a factual 60-word description for: ${name}`,',
      '  });',
      '  return response.output_text.trim();',
      '}',
    ],
    spec: topic(
      tr("Appeler OpenAI depuis le serveur", "Call OpenAI from the server", "استدعاء OpenAI من الخادم"),
      tr("Garder la clé côté serveur, donner une consigne bornée avec contexte minimal et traiter la sortie du modèle comme une proposition non fiable.", "Keep the key server-side, provide a bounded instruction with minimal context, and treat model output as an untrusted proposal.", "حفظ المفتاح في الخادم وتقديم تعليمة محدودة بسياق أدنى ومعاملة مخرج النموذج كمقترح غير موثوق."),
      tr("une fonction serveur qui produit un brouillon court sans transmettre de donnée client", "a server function that produces a short draft without sending customer data", "دالة خادم تنتج مسودة قصيرة من دون إرسال بيانات عميل"),
      tr("contexte", "context", "السياق"),
      tr("Informations fournies au modèle pour accomplir la tâche ; elles doivent être pertinentes, minimales et autorisées.", "Information supplied to the model for the task; it must be relevant, minimal, and authorized.", "المعلومات المقدمة للنموذج لإنجاز المهمة ويجب أن تكون لازمة ومحدودة ومصرحًا بها.")
    ),
  }),
  lesson({
    id: "ai-safety", order: 2, language: "typescript", filename: "exercises/24-ai/safety-boundary.ts", command: "npx tsc --noEmit",
    lines: [
      'type DraftTask = { task: "draft_product_copy"; productName: string; publicFacts: string[] };',
      'export function buildBoundedDraftTask(input: unknown): DraftTask {',
      '  if (!input || typeof input !== "object") throw new Error("invalid task");',
      '  const value = input as Record<string, unknown>;',
      '  if (value.task !== "draft_product_copy") throw new Error("capability not allowed");',
      '  if (typeof value.productName !== "string" || value.productName.trim().length > 120) throw new Error("invalid name");',
      '  if (!Array.isArray(value.publicFacts) || value.publicFacts.length > 8 ||',
      '      !value.publicFacts.every((fact) => typeof fact === "string" && fact.length <= 200)) throw new Error("invalid facts");',
      '  // Text remains untrusted; safety comes from no secrets/tools here and validated output later.',
      '  return { task: "draft_product_copy", productName: value.productName.trim(), publicFacts: [...value.publicFacts] };',
      '}',
    ],
    spec: topic(
      tr("Sécurité IA et injection de prompt", "AI safety and prompt injection", "أمان الذكاء الاصطناعي وحقن التعليمات"),
      tr("Séparer instructions système et contenu externe, limiter capacités et données, puis exiger une autorisation classique avant toute action sensible.", "Separate system instructions from external content, limit capabilities and data, and require ordinary authorization before any sensitive action.", "فصل تعليمات النظام عن المحتوى الخارجي وتقييد القدرات والبيانات واشتراط تفويض تقليدي قبل أي إجراء حساس."),
      tr("une frontière de capacité qui accepte une tâche structurée sans outil sensible et traite tout texte comme non fiable", "a capability boundary that accepts one structured task without sensitive tools and treats all text as untrusted", "حد قدرات يقبل مهمة منظمة واحدة بلا أدوات حساسة ويعامل كل النصوص كبيانات غير موثوقة"),
      tr("injection de prompt", "prompt injection", "حقن التعليمات"),
      tr("Contenu non fiable conçu pour détourner le modèle de ses règles ou obtenir un accès indu.", "Untrusted content designed to divert the model from its rules or obtain improper access.", "محتوى غير موثوق مصمم لتحويل النموذج عن قواعده أو الحصول على وصول غير مشروع.")
    ),
  }),
  lesson({
    id: "ai-cost-control", order: 3, language: "typescript", filename: "exercises/24-ai/cost-budget.ts", command: "npx tsc --noEmit",
    lines: [
      'type Usage = { inputTokens: number; outputTokens: number };',
      'const MAX_OUTPUT_TOKENS = 300;',
      'export function withinBudget(usage: Usage) {',
      '  const total = usage.inputTokens + usage.outputTokens;',
      '  return { total, accepted: usage.outputTokens <= MAX_OUTPUT_TOKENS && total <= 2000 };',
      '}',
      'const decision = withinBudget({ inputTokens: 420, outputTokens: 180 });',
      'if (!decision.accepted) throw new Error("AI budget exceeded");',
      'console.log(decision);',
    ],
    spec: topic(
      tr("Maîtriser coûts, latence et quotas IA", "Control AI cost, latency, and quotas", "ضبط تكلفة الذكاء الاصطناعي وزمنه وحصصه"),
      tr("Choisir le plus petit modèle suffisant, borner entrée et sortie, mettre en cache les résultats stables et mesurer coût par fonctionnalité.", "Choose the smallest sufficient model, bound input and output, cache stable results, and measure cost per feature.", "اختيار أصغر نموذج كافٍ وتقييد المدخل والمخرج وتخزين النتائج الثابتة وقياس التكلفة لكل ميزة."),
      tr("un garde-budget déterministe qui refuse une consommation supérieure aux limites du produit", "a deterministic budget guard that rejects usage above product limits", "حارس ميزانية حتمي يرفض الاستهلاك فوق حدود المنتج"),
      tr("budget de jetons", "token budget", "ميزانية الرموز"),
      tr("Limite explicite de texte traité ou généré pour maîtriser coût, temps et surface d’abus.", "An explicit limit on processed or generated text used to control cost, time, and abuse surface.", "حد صريح للنص المعالج أو المولد لضبط التكلفة والزمن ومساحة الإساءة.")
    ),
  }),
  lesson({
    id: "ai-output-validation", order: 4, language: "typescript", filename: "exercises/24-ai/validate-output.ts", command: "npx tsc --noEmit",
    lines: [
      'type ProductDraft = { title: string; description: string; tags: string[] };',
      'export function validateDraft(value: unknown): ProductDraft {',
      '  if (!value || typeof value !== "object") throw new Error("invalid draft");',
      '  const draft = value as Record<string, unknown>;',
      '  if (Object.keys(draft).some((key) => !["title", "description", "tags"].includes(key))) throw new Error("unexpected field");',
      '  if (typeof draft.title !== "string" || !draft.title.trim() || draft.title.length > 80) throw new Error("invalid title");',
      '  if (typeof draft.description !== "string" || !draft.description.trim() || draft.description.length > 500) throw new Error("invalid description");',
      '  if (!Array.isArray(draft.tags) || draft.tags.length > 8 ||',
      '      !draft.tags.every((tag) => typeof tag === "string" && tag.trim().length > 0 && tag.length <= 30)) throw new Error("invalid tags");',
      '  return { title: draft.title.trim(), description: draft.description.trim(), tags: draft.tags.map((tag) => tag.trim()) };',
      '}',
    ],
    spec: topic(
      tr("Valider les sorties IA", "Validate AI outputs", "التحقق من مخرجات الذكاء الاصطناعي"),
      tr("Exiger une structure, vérifier types et limites, filtrer le HTML puis garder une revue humaine pour les affirmations commerciales sensibles.", "Require a structure, verify types and limits, sanitize HTML, and retain human review for sensitive commercial claims.", "اشتراط بنية وفحص الأنواع والحدود وتنقية HTML والإبقاء على مراجعة بشرية للادعاءات التجارية الحساسة."),
      tr("un validateur qui empêche un brouillon de devenir donnée produit avant de respecter le contrat", "a validator that prevents a draft from becoming product data before it meets the contract", "محقق يمنع تحول المسودة إلى بيانات منتج قبل احترام العقد"),
      tr("sortie structurée", "structured output", "المخرج المنظم"),
      tr("Réponse contrainte par une forme machine attendue, mais qui doit encore être validée par l’application.", "A response constrained to an expected machine shape that still requires application validation.", "استجابة مقيدة بشكل آلي متوقع لكنها تظل بحاجة إلى تحقق التطبيق.")
    ),
  }),
];

const analyticsLessons = [
  lesson({
    id: "analytics-event-contract", order: 1, language: "typescript", filename: "exercises/25-analytics/event-contract.ts", command: "npx tsc --noEmit",
    lines: [
      'type CommerceEvent = { name: "view_product" | "add_to_cart"; productId: string; value?: number };',
      'export function track(event: CommerceEvent) {',
      '  if (!event.productId) throw new Error("productId required");',
      '  const payload = { ...event, occurredAt: new Date().toISOString() };',
      '  console.log("analytics", payload);',
      '  return payload;',
      '}',
      'track({ name: "add_to_cart", productId: "prod_1", value: 199 });',
    ],
    spec: topic(
      tr("Concevoir un contrat d’événements", "Design an event contract", "تصميم عقد للأحداث"),
      tr("Nommer les événements selon l’intention utilisateur, définir peu de propriétés stables et exclure identité, message libre et secret des charges analytics.", "Name events after user intent, define a small set of stable properties, and exclude identity, free text, and secrets from analytics payloads.", "تسمية الأحداث حسب نية المستخدم وتعريف خصائص ثابتة قليلة واستبعاد الهوية والنص الحر والأسرار من حمولات التحليلات."),
      tr("un événement typé view_product/add_to_cart avec horodatage et aucune information personnelle", "a typed view_product/add_to_cart event with a timestamp and no personal information", "حدث view_product/add_to_cart مكتوب الأنواع ومؤرخ بلا معلومات شخصية"),
      tr("taxonomie d’événements", "event taxonomy", "تصنيف الأحداث"),
      tr("Convention partagée pour les noms, propriétés et significations des événements mesurés.", "A shared convention for names, properties, and meanings of measured events.", "اتفاقية مشتركة لأسماء الأحداث المقاسة وخصائصها ومعانيها.")
    ),
  }),
  lesson({
    id: "analytics-consent", order: 2, language: "typescript", filename: "exercises/25-analytics/consent-gate.ts", command: "npx tsc --noEmit",
    lines: [
      'type Consent = "unknown" | "granted" | "denied";',
      'export function mayTrack(consent: Consent, necessary: boolean) {',
      '  if (necessary) return true;',
      '  return consent === "granted";',
      '}',
      'console.assert(mayTrack("unknown", false) === false);',
      'console.assert(mayTrack("denied", false) === false);',
      'console.assert(mayTrack("granted", false) === true);',
    ],
    spec: topic(
      tr("Consentement et minimisation", "Consent and minimization", "الموافقة وتقليل البيانات"),
      tr("Bloquer la mesure optionnelle avant un oui explicite, séparer stockage nécessaire et analytics, documenter durée, finalité et mécanisme de retrait.", "Block optional measurement before explicit agreement, separate necessary storage from analytics, and document retention, purpose, and withdrawal.", "حظر القياس الاختياري قبل الموافقة الصريحة وفصل التخزين الضروري عن التحليلات وتوثيق المدة والغرض وآلية السحب."),
      tr("une porte de consentement testable où unknown et denied bloquent toute mesure non nécessaire", "a testable consent gate where unknown and denied block all nonessential measurement", "بوابة موافقة قابلة للاختبار تمنع فيها unknown وdenied كل قياس غير ضروري"),
      tr("minimisation", "data minimization", "تقليل البيانات"),
      tr("Collecte limitée aux données strictement nécessaires à une finalité annoncée.", "Collection limited to data strictly necessary for a declared purpose.", "قصر الجمع على البيانات الضرورية تمامًا لغرض معلن.")
    ),
  }),
  lesson({
    id: "funnel-analysis", order: 3, language: "typescript", filename: "exercises/25-analytics/funnel.ts", command: "npx tsc --noEmit",
    lines: [
      'type Funnel = { viewed: number; carted: number; purchased: number };',
      'const rate = (part: number, whole: number) => whole === 0 ? 0 : part / whole;',
      'export function analyze(funnel: Funnel) {',
      '  return {',
      '    viewToCart: rate(funnel.carted, funnel.viewed),',
      '    cartToPurchase: rate(funnel.purchased, funnel.carted),',
      '  };',
      '}',
      'console.log(analyze({ viewed: 1000, carted: 120, purchased: 30 }));',
    ],
    spec: topic(
      tr("Lire un funnel sans inventer une cause", "Read a funnel without inventing causality", "قراءة القمع من دون اختراع السببية"),
      tr("Définir population et fenêtre, calculer chaque transition, segmenter prudemment et distinguer une corrélation observée d’une explication causale.", "Define population and time window, calculate each transition, segment carefully, and distinguish observed correlation from causal explanation.", "تحديد السكان والنافذة الزمنية وحساب كل انتقال والتقسيم بحذر والتمييز بين الارتباط الملحوظ والتفسير السببي."),
      tr("un calcul sans division invalide pour les transitions produit, panier et achat", "a calculation without invalid division for product, cart, and purchase transitions", "حساب بلا قسمة غير صالحة لانتقالات المنتج والسلة والشراء"),
      tr("taux de conversion", "conversion rate", "معدل التحويل"),
      tr("Part des personnes ou sessions qui passent d’une étape définie à la suivante.", "The share of people or sessions moving from a defined step to the next one.", "نسبة الأشخاص أو الجلسات التي تنتقل من خطوة محددة إلى التالية.")
    ),
  }),
  lesson({
    id: "ethical-growth-experiment", order: 4, language: "typescript", filename: "exercises/25-analytics/experiment.ts", command: "npx tsc --noEmit",
    lines: [
      'type Experiment = { id: string; hypothesis: string; primaryMetric: string; guardrail: string };',
      'export function registerExperiment(input: Experiment) {',
      '  if (!input.hypothesis.includes("because")) throw new Error("state a causal hypothesis");',
      '  if (input.primaryMetric === input.guardrail) throw new Error("guardrail must be independent");',
      '  return { ...input, status: "planned" as const };',
      '}',
      'console.log(registerExperiment({ id: "hero-copy", hypothesis: "Trust copy helps because it reduces uncertainty",',
      '  primaryMetric: "add_to_cart_rate", guardrail: "return_rate" }));',
    ],
    spec: topic(
      tr("Expériences de croissance responsables", "Responsible growth experiments", "تجارب نمو مسؤولة"),
      tr("Écrire hypothèse et métrique avant le lancement, ajouter une garde de qualité et refuser les dark patterns qui améliorent un clic en dégradant confiance ou retours.", "Write the hypothesis and metric before launch, add a quality guardrail, and reject dark patterns that improve a click while harming trust or returns.", "كتابة الفرضية والمقياس قبل الإطلاق وإضافة حاجز جودة ورفض الأنماط المظلمة التي تحسن النقر وتضر الثقة أو المرتجعات."),
      tr("une fiche d’expérience qui sépare métrique principale et garde de sécurité", "an experiment record that separates the primary metric from its safety guardrail", "سجل تجربة يفصل المقياس الرئيسي عن حاجز الأمان"),
      tr("métrique garde-fou", "guardrail metric", "مقياس الحماية"),
      tr("Mesure qui arrête une expérience si le gain principal s’accompagne d’un dommage inacceptable.", "A measure that stops an experiment when the main gain comes with unacceptable harm.", "مقياس يوقف التجربة إذا صاحب المكسب الرئيسي ضرر غير مقبول.")
    ),
  }),
];

const deploymentLessons = [
  lesson({
    id: "github-release-workflow", order: 1, language: "yaml", filename: "exercises/26-deployment/ci.yml", command: "npm run build",
    lines: [
      'name: Verify',
      'on: [pull_request]',
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with: { node-version: 20, cache: npm }',
      '      - run: npm ci',
      '      - run: npm run build',
    ],
    spec: topic(
      tr("Vérifier chaque changement sur GitHub", "Verify every change on GitHub", "التحقق من كل تغيير على GitHub"),
      tr("Utiliser une pull request petite, réinstaller depuis le lockfile et exiger un build propre avant fusion afin que la branche principale reste publiable.", "Use a small pull request, reinstall from the lockfile, and require a clean build before merge so the main branch stays deployable.", "استخدام طلب دمج صغير وإعادة التثبيت من lockfile واشتراط build نظيف قبل الدمج ليظل الفرع الرئيسي قابلًا للنشر."),
      tr("un workflow CI minimal et déterministe qui valide L’ecomax sur chaque pull request", "a minimal deterministic CI workflow that validates L’ecomax on every pull request", "تدفق CI صغير وحتمي يتحقق من L’ecomax عند كل طلب دمج"),
      tr("intégration continue", "continuous integration", "التكامل المستمر"),
      tr("Exécution automatique de vérifications reproductibles à chaque changement partagé.", "Automatic execution of reproducible checks for every shared change.", "تنفيذ تلقائي لفحوص قابلة للتكرار عند كل تغيير مشترك.")
    ),
  }),
  lesson({
    id: "vercel-environments", order: 2, language: "bash", filename: "exercises/26-deployment/vercel-checklist.sh", command: "npm run build",
    lines: [
      'npm ci',
      'npm run build',
      'git status --short',
      'npx vercel env ls',
      'npx vercel deploy',
      '# Test the preview URL before production promotion',
      'npx vercel inspect --logs https://lecomax-course-example.vercel.app',
      '# Promote only the verified immutable deployment',
    ],
    spec: topic(
      tr("Prévisualisations et environnements Vercel", "Vercel previews and environments", "معاينات Vercel وبيئاته"),
      tr("Séparer variables Development, Preview et Production, tester une URL immuable puis promouvoir exactement l’artefact vérifié au lieu de reconstruire à l’aveugle.", "Separate Development, Preview, and Production variables, test an immutable URL, then promote the exact verified artifact instead of rebuilding blindly.", "فصل متغيرات Development وPreview وProduction واختبار رابط ثابت ثم ترقية الأثر المتحقق منه نفسه بدل إعادة البناء عشوائيًا."),
      tr("une checklist de déploiement qui inspecte la preview avant toute promotion en production", "a deployment checklist that inspects the preview before any production promotion", "قائمة نشر تفحص المعاينة قبل أي ترقية إلى الإنتاج"),
      tr("déploiement immuable", "immutable deployment", "النشر الثابت"),
      tr("Artefact identifié qui ne change plus après construction et peut être promu ou restauré tel quel.", "An identified artifact that no longer changes after build and can be promoted or restored as-is.", "أثر محدد لا يتغير بعد البناء ويمكن ترقيته أو استعادته كما هو.")
    ),
  }),
  lesson({
    id: "namecheap-dns", order: 3, language: "text", filename: "exercises/26-deployment/dns-plan.txt", command: "nslookup lecomax.example",
    lines: [
      'Host: @',
      'Type: A',
      'Value: 76.76.21.21',
      'TTL: Automatic',
      'Host: www',
      'Type: CNAME',
      'Value: cname.vercel-dns.com',
      'Verify: HTTPS, apex redirect, www redirect, mail records untouched',
    ],
    spec: topic(
      tr("Namecheap, DNS et domaine", "Namecheap, DNS, and domains", "Namecheap وDNS والنطاق"),
      tr("Comprendre apex, sous-domaine, A, CNAME, TTL et propagation, recopier uniquement les cibles données par Vercel et préserver MX, SPF, DKIM et DMARC.", "Understand apex, subdomain, A, CNAME, TTL, and propagation; copy only targets supplied by Vercel and preserve MX, SPF, DKIM, and DMARC.", "فهم النطاق الجذر والفرعي وسجلات A وCNAME وTTL والانتشار ونسخ أهداف Vercel فقط وحفظ MX وSPF وDKIM وDMARC."),
      tr("un plan DNS documenté avec tests HTTPS et protection des enregistrements email", "a documented DNS plan with HTTPS tests and protection for email records", "خطة DNS موثقة مع اختبارات HTTPS وحماية سجلات البريد"),
      tr("TTL", "TTL", "TTL"),
      tr("Durée pendant laquelle un résolveur peut conserver une réponse DNS avant de la demander à nouveau.", "The duration a resolver may cache a DNS answer before requesting it again.", "المدة التي يجوز لمحلل DNS حفظ الإجابة خلالها قبل طلبها من جديد.")
    ),
  }),
  lesson({
    id: "monitoring-backups", order: 4, language: "typescript", filename: "exercises/26-deployment/health-check.ts", command: "npx tsc --noEmit",
    lines: [
      'type RecoveryPolicy = { data: "orders"; rpoMinutes: number; rtoMinutes: number };',
      'type RestoreDrill = { newestRecordAgeMinutes: number; restoreDurationMinutes: number; integrityVerified: boolean };',
      'export function assessRestore(policy: RecoveryPolicy, drill: RestoreDrill) {',
      '  const meetsRpo = drill.newestRecordAgeMinutes <= policy.rpoMinutes;',
      '  const meetsRto = drill.restoreDurationMinutes <= policy.rtoMinutes;',
      '  return { meetsRpo, meetsRto, passed: meetsRpo && meetsRto && drill.integrityVerified };',
      '}',
      'const policy: RecoveryPolicy = { data: "orders", rpoMinutes: 15, rtoMinutes: 60 };',
      'const result = assessRestore(policy, { newestRecordAgeMinutes: 9, restoreDurationMinutes: 42, integrityVerified: true });',
      'if (!result.passed) throw new Error("restore drill missed its objective");',
      'console.log({ policy, result });',
    ],
    spec: topic(
      tr("Monitoring, sauvegardes et restauration", "Monitoring, backups, and restore", "المراقبة والنسخ الاحتياطي والاستعادة"),
      tr("Surveiller disponibilité et parcours commande, alerter sur un symptôme actionnable, sauvegarder données et configuration puis tester régulièrement une restauration isolée.", "Monitor availability and the order journey, alert on actionable symptoms, back up data and configuration, and regularly test an isolated restore.", "مراقبة التوفر ومسار الطلب والتنبيه على أعراض قابلة للتنفيذ ونسخ البيانات والإعدادات واختبار استعادة معزولة دوريًا."),
      tr("une politique RPO/RTO mesurable et le verdict d’un exercice de restauration avec contrôle d’intégrité", "a measurable RPO/RTO policy and the verdict of a restore drill with an integrity check", "سياسة RPO/RTO قابلة للقياس وحكم تدريب استعادة مع فحص سلامة"),
      tr("RPO/RTO", "RPO/RTO", "RPO/RTO"),
      tr("Limites acceptées de perte de données et de durée d’interruption qui guident sauvegarde et reprise.", "Accepted limits for data loss and downtime that guide backup and recovery.", "الحدود المقبولة لفقد البيانات ومدة التوقف التي توجه النسخ والاستعادة.")
    ),
  }),
];

const capstoneLessons = [
  lesson({
    id: "capstone-architecture", order: 1, language: "markdown", filename: "exercises/27-capstone/architecture.md", command: "npm run build",
    lines: [
      '# Jalon 1 — Fondation architecture, données et confiance',
      '## Artefacts à vérifier ou produire',
      '- [ ] VERIFY package.json et next.config.js : versions et commandes de vérité',
      '- [ ] VERIFY middleware.ts, lib/db-server.ts et lib/permissions.ts : session et autorisation',
      '- [ ] DOCUMENT products, variants, stock, profiles, orders, order_items et processed_events',
      '- [ ] DOCUMENT chaque variable par nom, environnement et propriétaire, jamais par valeur',
      '- [ ] MAP Browser -> Server Component -> Route Handler -> Supabase/provider',
      '- [ ] MARK chaque frontière : authentification, validation, autorisation, stockage, journal',
      '## Commandes de la porte de sortie',
      'npm ci',
      'npx tsc --noEmit --incremental false',
      'npm run validate:course',
      'npm run build',
      '## Tests d’acceptation du jalon',
      '- [ ] Une base vide peut être initialisée depuis les artefacts documentés',
      '- [ ] Un visiteur ne lit que les produits publiés ; un client ne lit que ses commandes',
      '- [ ] Une mutation admin sans rôle est refusée au serveur, même appelée sans interface',
      '- [ ] Les logs portent requestId et code d’erreur, jamais jeton, email ou corps de paiement',
      '- [ ] Chaque dépendance externe possède timeout, réponse publique sûre et stratégie de reprise',
    ],
    spec: topic(
      tr("Dessiner l’architecture de la boutique finale", "Design the final store architecture", "تصميم بنية المتجر النهائي"),
      tr("Tracer navigateurs, composants serveur, routes, base et fournisseurs, puis écrire pour chaque frontière qui authentifie, valide, stocke et observe.", "Map browsers, server components, routes, database, and providers, then state for every boundary who authenticates, validates, stores, and observes.", "رسم المتصفحات ومكونات الخادم والمسارات وقاعدة البيانات والمزودين ثم تحديد المصادقة والتحقق والتخزين والمراقبة عند كل حد."),
      tr("un dossier de fondation exécutable : carte des frontières, modèle de données, matrice d’accès, registre d’environnement et quatre portes de build", "an executable foundation dossier: boundary map, data model, access matrix, environment register, and four build gates", "ملف أساس قابل للتنفيذ: خريطة الحدود ونموذج البيانات ومصفوفة الوصول وسجل البيئة وأربع بوابات بناء"),
      tr("frontière de confiance", "trust boundary", "حد الثقة"),
      tr("Passage où les données changent de niveau de confiance et doivent être validées ou autorisées.", "A crossing where data changes trust level and must be validated or authorized.", "نقطة عبور يتغير عندها مستوى الثقة بالبيانات ويجب التحقق منها أو تفويضها.")
    ),
  }),
  lesson({
    id: "capstone-catalog", order: 2, language: "markdown", filename: "exercises/27-capstone/catalog-auth-data.md", command: "npx tsc --noEmit --incremental false",
    lines: [
      '# Jalon 2 — Catalogue, authentification, données et administration',
      '## Tranche verticale à livrer',
      '- [ ] VERIFY lib/products.ts comme source de lecture produit validée',
      '- [ ] VERIFY app/boutique/page.tsx et app/produit/[slug]/page.tsx : liste, détail, vide, erreur',
      '- [ ] VERIFY app/connexion/page.tsx, app/inscription/page.tsx et middleware.ts : session et retour sûr',
      '- [ ] VERIFY app/admin/products/page.tsx et app/admin/stock/page.tsx : rôle contrôlé au serveur',
      '- [ ] MODEL product, variant, media, price_minor, currency, stock et published_at',
      '- [ ] RECORD actor_id, action, entity_id, before et after pour chaque mutation admin',
      '## Commandes de vérification',
      'npx tsc --noEmit --incremental false',
      'npm run build',
      'npm run dev',
      '## Tests d’acceptation du jalon',
      '- [ ] Un visiteur recherche et ouvre un produit publié avec prix et stock cohérents',
      '- [ ] Un slug absent rend not-found ; une panne de données rend un état sûr et traçable',
      '- [ ] Un client authentifié ne peut ni publier un produit ni modifier le stock par appel HTTP direct',
      '- [ ] Un admin autorisé modifie une variante et le journal d’audit identifie la mutation',
      '- [ ] Après mutation validée, liste, détail et recherche convergent vers la même source de vérité',
    ],
    spec: topic(
      tr("Construire catalogue, recherche et administration", "Build catalog, search, and administration", "بناء الكتالوج والبحث والإدارة"),
      tr("Modéliser produit, variante, prix, stock et média, exposer une lecture rapide au public et protéger chaque mutation par rôle, validation et journal d’audit.", "Model product, variant, price, stock, and media; expose fast public reads and protect every mutation with role, validation, and an audit log.", "نمذجة المنتج والمتغير والسعر والمخزون والوسائط وإتاحة قراءة عامة سريعة وحماية كل تعديل بالدور والتحقق وسجل التدقيق."),
      tr("une tranche catalogue complète avec matrice d’accès, états de page, contrat de publication et preuves RLS/admin", "a complete catalog slice with access matrix, page states, publication contract, and RLS/admin evidence", "شريحة كتالوج كاملة بمصفوفة وصول وحالات صفحة وعقد نشر وأدلة RLS والإدارة"),
      tr("source de vérité", "source of truth", "مصدر الحقيقة"),
      tr("Emplacement autoritaire dont dérivent les représentations en cache, dans la recherche et dans l’interface.", "The authoritative location from which cached, search, and UI representations derive.", "المكان المرجعي الذي تشتق منه تمثيلات الذاكرة المؤقتة والبحث والواجهة.")
    ),
  }),
  lesson({
    id: "capstone-purchase", order: 3, language: "markdown", filename: "exercises/27-capstone/purchase-payment-notifications.md", command: "npm run build",
    lines: [
      '# Jalon 3 — Panier, commande, paiement et notifications',
      '## Flux intégré à livrer',
      '- [ ] VERIFY app/panier/page.tsx : quantité, suppression, vide et reprise sans prix autoritaire client',
      '- [ ] VERIFY app/checkout/page.tsx : adresse, livraison, pending et retour fournisseur non autoritaire',
      '- [ ] VERIFY app/api/orders/route.ts : session, validation, recalcul prix/stock et création pending_payment',
      '- [ ] CREATE app/api/paypal/webhook/route.ts : corps brut, vérification PayPal officielle, rapprochement',
      '- [ ] PERSIST processed_events.event_id UNIQUE avec transition commande et stock dans la transaction',
      '- [ ] VERIFY app/api/send-confirmation/route.ts et app/api/orders/[id]/notify/route.ts après commit seulement',
      '## Machine d’état autorisée',
      'draft -> pending_payment -> paid -> fulfilled',
      'pending_payment -> payment_failed ; paid|fulfilled -> partially_refunded|refunded',
      '## Commandes de vérification',
      'npx tsc --noEmit --incremental false',
      'npm run build',
      'npm run dev',
      '## Tests d’acceptation du jalon',
      '- [ ] Modifier prix ou devise dans le navigateur ne change pas le montant USD recalculé au serveur',
      '- [ ] Succès sandbox produit une seule commande paid, un seul effet stock et une seule confirmation',
      '- [ ] Signature invalide, capture refusée et stock insuffisant ne produisent jamais paid',
      '- [ ] Rejouer le même webhook après redémarrage ne répète commande, stock ni notification',
      '- [ ] Un remboursement partiel respecte devise et solde restant et laisse identifiants d’audit',
    ],
    spec: topic(
      tr("Assembler panier, commande et paiement", "Assemble cart, order, and payment", "تجميع السلة والطلب والدفع"),
      tr("Recalculer prix et stock au serveur, créer la commande avant le fournisseur, appliquer les webhooks de façon idempotente et notifier depuis un changement d’état confirmé.", "Recalculate price and stock on the server, create the order before the provider call, apply webhooks idempotently, and notify from a confirmed state change.", "إعادة حساب السعر والمخزون في الخادم وإنشاء الطلب قبل استدعاء المزود وتطبيق webhooks بلا تكرار والإشعار بعد تغيير حالة مؤكد."),
      tr("une tranche d’achat testable reliant autorité serveur, machine d’état, signature PayPal, idempotence persistante et notifications après commit", "a testable purchase slice connecting server authority, state machine, PayPal signature, persistent idempotency, and post-commit notifications", "شريحة شراء قابلة للاختبار تربط سلطة الخادم وآلة الحالات وتوقيع PayPal وعدم التكرار الدائم والإشعارات بعد commit"),
      tr("machine d’état", "state machine", "آلة الحالات"),
      tr("Modèle qui énumère les états autorisés et les seules transitions valides entre eux.", "A model enumerating allowed states and the only valid transitions between them.", "نموذج يسرد الحالات المسموحة والانتقالات الصالحة الوحيدة بينها.")
    ),
  }),
  lesson({
    id: "capstone-production", order: 4, language: "markdown", filename: "exercises/27-capstone/release-runbook.md", command: "npm run build",
    lines: [
      '# Jalon 4 — Tests, release, monitoring et reprise',
      '## Gate automatisée attachée au SHA',
      'npm ci',
      'npx tsc --noEmit --incremental false',
      'npm run validate:course',
      'npm run build',
      '## Acceptance sur Vercel Preview isolée',
      '- [ ] Catalogue, connexion, panier, checkout sandbox, email test et consentement passent',
      '- [ ] Navigation clavier, zoom, lecteur d’écran et vues 390 px/tablette/desktop passent',
      '- [ ] Signature webhook invalide, fournisseur lent et base indisponible produisent des erreurs sûres',
      '- [ ] Les variables Preview sont sandbox et aucune valeur secrète n’apparaît dans client ou logs',
      '## Décision de production',
      '1. Promouvoir exactement le déploiement immuable lié au SHA accepté',
      '2. Observer taux d’erreur, latence, création de commandes et retard des webhooks',
      '3. Stop condition : hausse d’erreur, divergence paiement/commande ou perte d’écriture',
      '4. Rollback owner : une personne nommée restaure le dernier déploiement vérifié',
      '## Reprise et preuve',
      '- [ ] RPO commandes = 15 minutes ; RTO boutique = 60 minutes',
      '- [ ] Restaurer la sauvegarde dans un environnement isolé et vérifier comptes, produits et commandes',
      '- [ ] Chronométrer la reprise, mesurer l’âge du dernier enregistrement et signer le verdict',
      '- [ ] Archiver URL, SHA, sorties de commandes, résultats de parcours et actions correctives',
      '- [ ] Transmettre au support symptômes connus, requestId attendu et procédure d’escalade',
    ],
    spec: topic(
      tr("Livrer et exploiter une boutique réelle", "Ship and operate a real store", "إطلاق متجر حقيقي وتشغيله"),
      tr("Définir critères d’acceptation, conditions d’arrêt, propriétaire de chaque alerte et procédure de retour avant la mise en production, puis vérifier le parcours client réel.", "Define acceptance criteria, stop conditions, an owner for every alert, and rollback procedure before production, then verify the real customer journey.", "تحديد معايير القبول وشروط الإيقاف ومالك كل تنبيه وإجراء الرجوع قبل الإنتاج ثم التحقق من مسار العميل الحقيقي."),
      tr("un dossier de release attaché au SHA avec commandes, parcours d’acceptation, stop conditions, propriétaires, RPO/RTO et preuve de restauration", "a SHA-linked release dossier with commands, acceptance journeys, stop conditions, owners, RPO/RTO, and restore evidence", "ملف إصدار مرتبط بـ SHA يحوي الأوامر ومسارات القبول وشروط الإيقاف والمسؤولين وRPO/RTO ودليل الاستعادة"),
      tr("runbook", "runbook", "دليل التشغيل"),
      tr("Procédure testée qui décrit actions, preuves, responsables et décisions pendant une opération réelle.", "A tested procedure describing actions, evidence, owners, and decisions during a real operation.", "إجراء مختبر يصف الأعمال والأدلة والمسؤولين والقرارات أثناء عملية حقيقية.")
    ),
  }),
];

export const modules = [
  moduleBlueprint({
    id: "quality-engineering", order: 19, icon: "🧪", color: "#7C3AED", existing: "package.json", create: "exercises/19-quality/price.test.mjs",
    title: tr("Tests, Git avancé, débogage et refactoring", "Testing, advanced Git, debugging, and refactoring", "الاختبارات وGit المتقدم وتصحيح الأخطاء وإعادة الهيكلة"),
    summary: tr("Apprendre à prouver un comportement, collaborer sans perdre de travail, diagnostiquer méthodiquement et améliorer le code sans régression.", "Learn to prove behavior, collaborate without losing work, diagnose methodically, and improve code without regression.", "تعلّم إثبات السلوك والتعاون بلا فقد العمل والتشخيص المنهجي وتحسين الشيفرة بلا تراجع."),
    lessons: qualityLessons,
  }),
  moduleBlueprint({
    id: "web-quality", order: 20, icon: "♿", color: "#2563EB", existing: "app/layout.tsx", create: "exercises/20-web-quality/audit.md",
    title: tr("SEO, accessibilité et performance", "SEO, accessibility, and performance", "SEO والإتاحة والأداء"),
    summary: tr("Construire des pages trouvables, utilisables par tous et rapides sur de vrais appareils, puis vérifier les résultats avec un audit reproductible.", "Build pages that are discoverable, usable by everyone, and fast on real devices, then verify them with a reproducible audit.", "بناء صفحات قابلة للاكتشاف والاستخدام للجميع وسريعة على الأجهزة الحقيقية ثم التحقق منها بتدقيق قابل للتكرار."),
    lessons: webQualityLessons,
  }),
  moduleBlueprint({
    id: "email-systems", order: 21, icon: "✉️", color: "#DB2777", existing: "app/api/send-confirmation/route.ts", create: "exercises/21-email/resend-order.ts",
    title: tr("Resend, Nodemailer, IMAP et EmailJS", "Resend, Nodemailer, IMAP, and EmailJS", "Resend وNodemailer وIMAP وEmailJS"),
    summary: tr("Envoyer et recevoir des messages de manière sûre en comprenant les frontières serveur, navigateur, SMTP et IMAP.", "Send and receive messages safely by understanding server, browser, SMTP, and IMAP boundaries.", "إرسال الرسائل واستقبالها بأمان عبر فهم حدود الخادم والمتصفح وSMTP وIMAP."),
    lessons: emailLessons,
  }),
  moduleBlueprint({
    id: "paypal-payments", order: 22, icon: "💳", color: "#003087", existing: "app/checkout/page.tsx", create: "exercises/22-payments/paypal-order.ts",
    title: tr("PayPal, webhooks, remboursements et idempotence", "PayPal, webhooks, refunds, and idempotency", "PayPal وwebhooks والاسترداد وعدم التكرار"),
    summary: tr("Construire un paiement dont le serveur contrôle le montant, vérifie les événements et résiste aux répétitions comme aux remboursements partiels.", "Build payments where the server controls amounts, verifies events, and withstands retries and partial refunds.", "بناء دفع يتحكم الخادم في مبالغه ويتحقق من أحداثه ويقاوم التكرار والاستردادات الجزئية."),
    lessons: paymentLessons,
  }),
  moduleBlueprint({
    id: "notifications", order: 23, icon: "🔔", color: "#EA580C", existing: "public/sw.js", create: "exercises/23-notifications/orchestrator.ts",
    title: tr("Web Push, WhatsApp et notifications", "Web Push, WhatsApp, and notifications", "Web Push وواتساب والإشعارات"),
    summary: tr("Gérer permissions, Service Worker, webhooks et préférences afin d’envoyer le bon message par le bon canal sans spam.", "Manage permissions, Service Workers, webhooks, and preferences to send the right message through the right channel without spam.", "إدارة الأذونات وعامل الخدمة وwebhooks والتفضيلات لإرسال الرسالة المناسبة عبر القناة المناسبة بلا إزعاج."),
    lessons: notificationLessons,
  }),
  moduleBlueprint({
    id: "openai-integration", order: 24, icon: "🤖", color: "#059669", existing: "app/api/ai-product/route.ts", create: "exercises/24-ai/validate-output.ts",
    title: tr("OpenAI, sécurité, coûts et validation", "OpenAI, safety, costs, and validation", "OpenAI والأمان والتكاليف والتحقق"),
    summary: tr("Intégrer un modèle comme service non fiable : secrets au serveur, capacités limitées, budget mesuré et sortie toujours validée.", "Integrate a model as an untrusted service: server-only secrets, limited capabilities, measured budget, and always-validated output.", "دمج النموذج كخدمة غير موثوقة: أسرار في الخادم وقدرات محدودة وميزانية مقاسة ومخرج متحقق منه دائمًا."),
    lessons: aiLessons,
  }),
  moduleBlueprint({
    id: "analytics-growth", order: 25, icon: "📈", color: "#0891B2", existing: "lib/analytics.ts", create: "exercises/25-analytics/event-contract.ts",
    title: tr("Analytics, consentement et croissance", "Analytics, consent, and growth", "التحليلات والموافقة والنمو"),
    summary: tr("Mesurer des intentions utiles avec peu de données, respecter le choix du client et mener des expériences qui protègent la qualité.", "Measure useful intent with little data, respect customer choice, and run experiments that protect quality.", "قياس نوايا مفيدة ببيانات قليلة واحترام اختيار العميل وإجراء تجارب تحمي الجودة."),
    lessons: analyticsLessons,
  }),
  moduleBlueprint({
    id: "deployment-operations", order: 26, icon: "🚀", color: "#111827", existing: "next.config.js", create: "exercises/26-deployment/ci.yml",
    title: tr("GitHub, Vercel, Namecheap, DNS, monitoring et sauvegardes", "GitHub, Vercel, Namecheap, DNS, monitoring, and backups", "GitHub وVercel وNamecheap وDNS والمراقبة والنسخ الاحتياطي"),
    summary: tr("Passer d’un commit vérifié à un domaine surveillé avec des déploiements reproductibles, des alertes actionnables et une restauration testée.", "Move from a verified commit to a monitored domain with reproducible deployments, actionable alerts, and a tested restore.", "الانتقال من إيداع متحقق منه إلى نطاق مراقب بنشر قابل للتكرار وتنبيهات قابلة للتنفيذ واستعادة مختبرة."),
    lessons: deploymentLessons,
  }),
  moduleBlueprint({
    id: "final-store-capstone", order: 27, icon: "🏆", color: "#16A34A", existing: "app/page.tsx", create: "exercises/27-capstone/release-runbook.md",
    title: tr("Projet final : reconstruire une boutique complète", "Final project: rebuild a complete store", "المشروع النهائي: إعادة بناء متجر كامل"),
    summary: tr("Assembler architecture, catalogue, achat, intégrations, sécurité et exploitation pour livrer une nouvelle boutique comparable à L’ecomax.", "Assemble architecture, catalog, purchasing, integrations, security, and operations to ship a new store comparable to L’ecomax.", "تجميع البنية والكتالوج والشراء والتكاملات والأمان والتشغيل لإطلاق متجر جديد بمستوى L’ecomax."),
    lessons: capstoneLessons,
  }),
];

export default modules;
