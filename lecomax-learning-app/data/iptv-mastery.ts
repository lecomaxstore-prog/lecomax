import type { IptvUnit } from './iptv-live';

// Ordered by iptvLivePhases; stable IDs preserve saved progress.
export const iptvMasteryUnits: IptvUnit[] = [
  {
    id: 'source-to-server', minutes: 25,
    title: ['Comprendre la reprise d’une chaîne', 'Understand how a channel is relayed', 'كيف تنتقل القناة إلى خادم آخر؟'],
    text: [
      'Sépare trois questions : qui produit les images, qui peut y accéder, et qui peut les redistribuer ? Un abonnement de lecture ne transforme pas automatiquement son titulaire en diffuseur. Une playlist qui fonctionne prouve seulement que le lecteur peut recevoir un flux à cet instant.\n\nÀ un niveau explicatif, un opérateur non autorisé peut dépendre d’un accès détourné, de comptes compromis, de liens divulgués ou d’un fournisseur amont. Il peut ensuite relayer ou réencoder le signal, puis vendre des accès à sa distribution. Tous les cas ne reposent donc pas sur une rupture du chiffrement. Nous n’extrayons ni identifiants ni clés et ne contournons aucune protection.\n\nDans ton laboratoire, tu joues les rôles avec ta caméra : OBS produit et encode, MediaMTX reçoit, HLS distribue et VLC lit. Ajouter un nom dans une liste ne crée pas le flux. Le fournisseur doit continuer à envoyer des images. Une panne amont peut interrompre plusieurs revendeurs à la fois.\n\nAvant de suivre la suite, explique ce qui s’arrête lorsque tu fermes OBS, puis lorsque tu fermes seulement VLC. Prédiction : fermer le producteur arrête les nouvelles images pour tous ; fermer un lecteur ne coupe pas le producteur.',
      'Separate three questions: who produces the pictures, who can access them, and who can redistribute them? A viewing subscription does not automatically make its holder a broadcaster. A working playlist only shows that a viewer can receive a stream at that moment.\n\nAt an explanatory level, an unauthorized operator may depend on misused access, compromised accounts, leaked links or an upstream supplier. It can then relay or re-encode the signal and sell access to its distribution. Not every case therefore involves breaking encryption. We do not extract credentials or keys or bypass protections.\n\nIn your lab, use your own camera to play these roles: OBS produces and encodes, MediaMTX receives, HLS delivers and VLC plays. Adding a name to a list does not create the stream. A publisher must keep supplying pictures. An upstream failure can interrupt several resellers at once.\n\nBefore continuing, explain what stops when you close OBS, then when you close only VLC. Prediction: closing the publisher stops new pictures for everyone; closing one player does not stop the publisher.',
      'افصل ثلاثة أسئلة: من ينتج الصورة؟ من يستطيع الوصول إليها؟ ومن يملك إذن إعادة توزيعها؟ اشتراك المشاهدة لا يحوّل صاحبه تلقائيًا إلى موزّع. نجاح قائمة التشغيل يثبت فقط أن المشغّل يستطيع استقبال البث في تلك اللحظة.\n\nلفهم الظاهرة: قد يعتمد مشغّل غير مصرح له على إساءة استخدام وصول قائم أو حسابات مخترقة أو روابط مسرّبة أو مورّد آخر. ثم يمرّر الإشارة أو يعيد ترميزها ويبيع الوصول إلى خوادمه. لذلك لا تعني كل عملية قرصنة كسر تشفير القناة. لا نستخرج حسابات أو مفاتيح ولا نتجاوز وسائل الحماية.\n\nفي مختبرك ستنفّذ الأدوار بكاميرتك: ينتج OBS الصورة ويضغطها، ويستقبل MediaMTX البث، ويوزّعه HLS، ويعرضه VLC. كتابة اسم قناة في قائمة لا تنشئ بثًا؛ يجب أن يستمر المصدر في إرسال الصورة. لهذا قد يؤدي توقف مورّد واحد إلى توقف خدمات موزّعين متعددين.\n\nقبل المتابعة اشرح ما الذي يتوقف عند إغلاق OBS، ثم عند إغلاق VLC فقط. توقّع النتيجة: إغلاق مصدر البث يوقف الصور الجديدة لدى الجميع، أما إغلاق مشغّل واحد فلا يوقف المصدر.',
    ],
    code: 'Your camera -> OBS -> MediaMTX -> HLS -> VLC\nPublisher stops: no new pictures\nViewer stops: publisher continues\nPlaylist entry: reference, not a video source',
    task: ['Explique les rôles et prédis deux interruptions.', 'Explain the roles and predict two interruptions.', 'اشرح الأدوار وتوقّع أثر إيقاف المصدر وإيقاف المشغّل.'],
    result: ['Le producteur fournit les images ; la liste fournit leur adresse.', 'The publisher supplies pictures; the playlist supplies their address.', 'يوفّر مصدر البث الصورة وتوفّر القائمة عنوانها؛ القائمة لا تنشئ القناة.'],
    question: ['Une liste crée-t-elle un signal ?', 'Does a playlist create a signal?', 'هل تنشئ القائمة إشارة البث؟'],
    options: [['Oui', 'Yes', 'نعم'], ['Non', 'No', 'لا']], answer: 1,
    url: 'https://mediamtx.org/docs/kickoff/introduction',
  },
  {
    id: 'two-channel-lab', minutes: 35,
    title: ['Ajouter une deuxième chaîne, étape par étape', 'Add a second channel step by step', 'أضف قناة ثانية خطوة بخطوة'],
    text: [
      'Prérequis : termine serveur, diffusion et fichier vidéo. Vérifie classroom dans VLC avant de modifier quoi que ce soit. Garde les ports du laboratoire sur localhost. Tu vas réutiliser le même serveur, pas démarrer un deuxième conteneur sur les mêmes ports.\n\n1. Arrête le premier producteur. Dans ses réglages OBS ou sa commande FFmpeg, remplace uniquement le chemin classroom par classroom2. Si ta configuration limite les chemins, déclare classroom2 comme source publisher avant de redémarrer le serveur. 2. Relance le producteur. 3. Ouvre le nouveau lien de lecture. 4. Enregistre la liste ci-dessous en UTF-8 sous channels.m3u et ouvre-la dans VLC.\n\nÀ ce stade, seule classroom2 émet : classroom reste dans la liste mais n’a plus de source. Pour deux chaînes simultanées, il faut deux producteurs indépendants sur deux chemins distincts, par exemple OBS pour classroom et le laboratoire FFmpeg pour classroom2. Chaque producteur augmente le travail d’encodage et le débit entrant.\n\nVérifie chaque lien séparément avant d’accuser la liste. Changer le nom visible ne change pas le chemin technique. Sur un téléphone, localhost désigne le téléphone : reprends le cours réseau et applications avant de remplacer l’adresse et de permettre la lecture sur ton réseau privé.',
      'Prerequisites: finish the server, broadcast and file-channel labs. Verify classroom in VLC before changing anything. Keep the lab ports on localhost. Reuse the same server; do not start a second container on the same ports.\n\n1. Stop the first publisher. In its OBS settings or FFmpeg command, change only the classroom path to classroom2. If your configuration restricts paths, declare classroom2 as a publisher source before restarting the server. 2. Restart the publisher. 3. Open the new playback link. 4. Save the playlist below as UTF-8 channels.m3u and open it in VLC.\n\nAt this point only classroom2 is publishing: classroom remains listed but has no source. Two simultaneous channels need two independent publishers on distinct paths, for example OBS for classroom and the FFmpeg lab for classroom2. Each publisher adds encoding work and incoming bandwidth.\n\nCheck each link independently before blaming the playlist. Changing the display name does not change the technical path. On a phone, localhost means the phone: complete the networking and apps lessons before changing the address and enabling playback on your private network.',
      'المتطلبات: أكمل دروس الخادم والبث وقناة الملف. تأكد أن classroom تعمل في VLC قبل التغيير. أبقِ منافذ المختبر على localhost. ستستخدم الخادم نفسه؛ لا تشغّل حاوية أخرى على المنافذ نفسها.\n\n١. أوقف مصدر البث الأول. في إعداد OBS أو أمر FFmpeg غيّر المسار classroom فقط إلى classroom2. إذا كان إعدادك يسمح بمسارات محددة فأضف classroom2 بمصدر publisher قبل إعادة تشغيل الخادم. ٢. أعد تشغيل مصدر البث. ٣. افتح رابط المشاهدة الجديد. ٤. احفظ القائمة أدناه بترميز UTF-8 باسم channels.m3u وافتحها في VLC.\n\nالآن تبث classroom2 فقط؛ تظل classroom موجودة في القائمة لكنها بلا مصدر. لتشغيل القناتين معًا تحتاج مصدرين مستقلين ومسارين مختلفين، مثل OBS لقناة classroom ومختبر FFmpeg لقناة classroom2. كل مصدر إضافي يزيد عمل الترميز ومعدل البيانات الداخلة.\n\nاختبر كل رابط منفردًا قبل اتهام القائمة. تغيير الاسم الظاهر لا يغير المسار التقني. على الهاتف يعني localhost الهاتف نفسه؛ أكمل درسي الشبكات والتطبيقات قبل تغيير العنوان والسماح بالمشاهدة على شبكتك الخاصة.',
    ],
    code: '#EXTM3U\n#EXTINF:-1,My camera\nhttp://localhost:8888/classroom/index.m3u8\n#EXTINF:-1,My second channel\nhttp://localhost:8888/classroom2/index.m3u8',
    task: ['Déplace le producteur, puis explique pourquoi une entrée ne joue plus.', 'Move the publisher, then explain why one entry stops playing.', 'انقل مصدر البث ثم اشرح لماذا لا تعمل إحدى القناتين.'],
    result: ['Deux entrées ne suffisent pas : deux chaînes live exigent deux sources actives.', 'Two entries are insufficient: two live channels need two active sources.', 'لا يكفي سطران في القائمة؛ تحتاج القناتان المباشرتان إلى مصدرين نشطين.'],
    question: ['Que manque-t-il à une chaîne listée sans image ?', 'What is missing from a listed channel without pictures?', 'ماذا ينقص القناة المدرجة دون صورة في هذا التمرين؟'],
    options: [['Un producteur actif', 'An active publisher', 'مصدر بث نشط'], ['Un autre nom', 'Another display name', 'اسم عرض آخر']], answer: 0,
    failure: ['Vérifie le chemin, la source active et les journaux du serveur.', 'Check the path, active publisher and server logs.', 'تحقق من تطابق المسار ومن مصدر البث النشط وسجل الخادم.'],
    url: 'https://mediamtx.org/docs/publish/obs-studio',
  },
  {
    id: 'capacity-worked-example', minutes: 25,
    title: ['Calculer sans confondre débit et stockage', 'Calculate bandwidth and storage clearly', 'احسب السعة والتكلفة دون خلط الوحدات'],
    text: [
      'Prends un débit total de 4 Mbps, vidéo et audio inclus. Mbps mesure des mégabits par seconde ; GB mesure un volume. Avec des unités décimales, une heure représente 4 × 3600 ÷ 8 ÷ 1000 = 1,8 GB par spectateur, avant les surcoûts réseau.\n\nVingt spectateurs simultanés demandent environ 80 Mbps en unicast direct. S’ils regardent tous deux heures, ils consomment 72 GB au total. Enregistrer une seule copie du même programme de deux heures prend environ 3,6 GB : ne multiplie pas cet enregistrement par les spectateurs.\n\nDistingue ensuite la durée de visionnage, les pics simultanés, la conservation des enregistrements et le nombre de qualités encodées. Un abonnement de cent comptes ne signifie pas cent connexions permanentes. Plusieurs qualités augmentent le travail et le stockage ; chaque spectateur ne reçoit pas nécessairement toutes les qualités.\n\nBudget = hébergement + transfert facturé + stockage + transcodage + éventuelle distribution CDN. Entre les tarifs réels du fournisseur, sa franchise et ses dépassements ; aucun prix universel ne convient. Ajoute une marge mesurée et une alerte de budget avant un essai public.',
      'Take a total stream bitrate of 4 Mbps, including video and audio. Mbps measures megabits per second; GB measures volume. In decimal units, one hour is 4 × 3600 ÷ 8 ÷ 1000 = 1.8 GB per viewer before network overhead.\n\nTwenty simultaneous viewers need about 80 Mbps with direct unicast delivery. If all watch for two hours, total transfer is 72 GB. Recording one copy of that two-hour program takes about 3.6 GB: do not multiply that recording by the viewers.\n\nSeparate viewing hours, concurrent peaks, recording retention and encoded quality count. One hundred accounts do not mean one hundred permanent connections. Multiple qualities increase processing and storage; each viewer does not necessarily receive every quality.\n\nBudget = hosting + billed transfer + storage + transcoding + any CDN delivery. Enter the actual provider rates, included allowance and overages; there is no universal price. Add measured headroom and a budget alert before a public test.',
      'ابدأ بمعدل إجمالي 4 Mbps يشمل الفيديو والصوت. تقيس Mbps ميغابت في الثانية، بينما تقيس GB حجم البيانات. بالوحدات العشرية تساوي الساعة: 4 × 3600 ÷ 8 ÷ 1000 = 1.8 GB لكل مشاهد قبل حمل الشبكة الإضافي.\n\nعشرون مشاهدًا في الوقت نفسه يحتاجون تقريبًا 80 Mbps عند التوزيع المباشر المنفرد. إذا شاهد الجميع ساعتين يصبح النقل الكلي 72 GB. أما تسجيل نسخة واحدة من البرنامج نفسه لساعتين فيحتاج نحو 3.6 GB؛ لا تضرب حجم هذا التسجيل في عدد المشاهدين.\n\nافصل ساعات المشاهدة عن ذروة الاتصالات المتزامنة ومدة الاحتفاظ بالتسجيلات وعدد الجودات التي ترمّزها. مئة حساب لا تعني مئة اتصال دائم. تعدد الجودات يزيد المعالجة والتخزين، لكن المشاهد لا يستقبل بالضرورة كل الجودات معًا.\n\nالميزانية = الاستضافة + النقل المفوتر + التخزين + الترميز + توزيع CDN إن وجد. أدخل أسعار المزود الفعلية والحصة المتضمنة ورسوم التجاوز؛ لا يوجد سعر ثابت لكل الحالات. أضف هامشًا مبنيًا على القياس وتنبيه ميزانية قبل تجربة عامة.',
    ],
    code: 'Total bitrate = 4 Mbps\n20 concurrent viewers = 80 Mbps before overhead\nOne viewer-hour = 1.8 GB (decimal)\n20 viewers x 2 hours = 72 GB transfer\nOne 2-hour recording = 3.6 GB',
    task: ['Recalcule pour 50 spectateurs pendant 3 heures.', 'Recalculate for 50 viewers over 3 hours.', 'أعد الحساب لخمسين مشاهدًا لمدة ثلاث ساعات.'],
    result: ['200 Mbps et 270 GB transférés ; un enregistrement de 5,4 GB, avant surcoûts.', '200 Mbps and 270 GB transferred; one 5.4 GB recording, before overhead.', '200 Mbps ونقل 270 GB؛ وتسجيل واحد بحجم 5.4 GB، قبل الحمل الإضافي.'],
    question: ['Le stockage d’une copie dépend-il directement du nombre de lecteurs ?', 'Does storing one copy depend directly on viewer count?', 'هل يعتمد تخزين نسخة واحدة مباشرة على عدد المشاهدين؟'],
    options: [['Oui', 'Yes', 'نعم'], ['Non', 'No', 'لا']], answer: 1,
    url: 'https://mediamtx.org/docs/features/scalability',
  },
  {
    "id": "learning-map",
    "minutes": 15,
    "title": [
      "Ton parcours de zéro à autonome",
      "Your path from zero to independent",
      "طريقك من الصفر إلى العمل بنفسك"
    ],
    "text": [
      "Commence par un résultat simple : voir ta propre caméra dans un lecteur. Imagine une livraison : la source fabrique les images, l’encodeur les emballe, le serveur les reçoit et le lecteur les ouvre. Une application IPTV est le lecteur ; installer cette application ne crée pas des chaînes.\n\nPrépare un ordinateur, une connexion Internet pour installer les outils, Docker Desktop avec son moteur actif, OBS Studio et VLC. FFmpeg sert aux ateliers suivants. Télécharge les outils depuis leurs sites officiels. Le téléphone suffit pour lire les cours, mais ces commandes se lancent sur ordinateur, pas dans Lecomax Learn. Aucun abonnement IPTV ni serveur payant n’est nécessaire pour le premier direct local.\n\nMéthode : lis une idée, prédis le résultat, fais l’exercice, puis explique le résultat sans regarder. Garde un carnet avec commande, observation et correction. Révise après un jour puis une semaine. Si tu débutes en code, termine les ateliers de diffusion puis suis les bases Web/React du parcours « Construire une application IPTV » avant le lecteur personnalisé.\n\nParcours rapide après installation : bases → serveur → diffusion OBS → chaînes. Ce raccourci donne une première réussite, pas une maîtrise de la sécurité ou de la production. Reviens ensuite aux étapes complètes. Ne marque une leçon terminée que lorsque tu peux reproduire son résultat.",
      "Start with one visible result: your own camera playing in a viewer. Think of a delivery: the source makes pictures, the encoder packs them, the server receives them and the player opens them. An IPTV app is the viewer; installing it does not supply channels.\n\nPrepare a computer, Internet access for installing tools, Docker Desktop with its engine running, OBS Studio and VLC. Later labs use FFmpeg. Get tools from their official sites. A phone can display the lessons, but you run these commands on a computer, outside Lecomax Learn. You need no IPTV subscription or paid hosting for your first local broadcast.\n\nLearn one idea, predict what will happen, do the exercise, then explain the outcome without looking. Keep a notebook of commands, observations and fixes. Review after one day and one week. If coding is new, finish the broadcasting labs and take the web/React foundations in “Build an IPTV application” before the custom player workshop.\n\nQuick route after installation: basics → server → OBS broadcast → channels. This gives an early success, not production or security mastery. Return to the full sequence afterwards. Complete a lesson only when you can reproduce its outcome.",
      "ابدأ بنتيجة واضحة: مشاهدة كاميرتك في مشغّل. تخيّل خدمة توصيل: المصدر يصنع الصور والمشفّر يغلّفها والخادم يستقبلها والمشغّل يفتحها. تطبيق IPTV هو المشغّل؛ تثبيته لا يوفّر القنوات تلقائيًا.\n\nجهّز حاسوبًا وإنترنت لتنزيل الأدوات وDocker Desktop مع تشغيل محركه وOBS Studio وVLC. ستحتاج FFmpeg في الورش التالية. نزّل الأدوات من مواقعها الرسمية. يمكنك قراءة الدروس من الهاتف لكن تنفيذ الأوامر يكون على الحاسوب خارج تطبيق Lecomax Learn. لا تحتاج اشتراك IPTV أو خادمًا مدفوعًا لأول بث محلي.\n\nطريقة التعلّم: افهم فكرة واحدة وتوقّع النتيجة ثم نفّذ التمرين واشرح ما حدث دون النظر. اكتب في دفتر: الأمر والملاحظة والتصحيح. راجع بعد يوم ثم أسبوع. إذا لم تعرف البرمجة فأكمل مختبرات البث ثم ادرس أساسيات الويب وReact في مسار «ابنِ تطبيق IPTV» قبل ورشة المشغّل الخاص.\n\nالمسار السريع بعد تثبيت الأدوات: الأساسيات ← الخادم ← بث OBS ← القنوات. يمنحك أول نجاح لكنه لا يكفي للإنتاج أو الأمان. عد بعدها إلى ترتيب الدروس الكامل. لا تعتبر الدرس مكتملًا حتى تعيد تطبيقه بنفسك."
    ],
    "code": "Source → Encoder → Media server → Playlist → Player\nOBS → RTMP :1935 → MediaMTX → HLS :8888 → VLC",
    "task": [
      "Prépare les outils et explique les cinq rôles avec tes mots.",
      "Prepare the tools and explain all five roles in your own words.",
      "جهّز الأدوات واشرح الأدوار الخمسة بكلماتك."
    ],
    "result": [
      "Tu sais où travailler et ce que chaque outil apporte.",
      "You know where to work and what each tool contributes.",
      "تعرف أين تنفّذ التمارين وما دور كل أداة."
    ],
    "question": [
      "Une application IPTV fournit-elle forcément des chaînes ?",
      "Does an IPTV app necessarily supply channels?",
      "هل يوفّر تطبيق IPTV القنوات بالضرورة؟"
    ],
    "options": [
      [
        "Oui",
        "Yes",
        "نعم"
      ],
      [
        "Non, il faut une source",
        "No, it needs a source",
        "لا، يحتاج إلى مصدر"
      ]
    ],
    "answer": 1,
    "url": "https://obsproject.com/kb/quick-start-guide",
    "failure": [
      "Si un outil manque, termine son installation avant le lab.",
      "If a tool is missing, finish installing it before the lab.",
      "إذا نقصت أداة فأكمل تثبيتها قبل المختبر."
    ]
  },
  {
    "id": "signal-chain",
    "minutes": 20,
    "title": [
      "Du studio au spectateur",
      "From studio to viewer",
      "من الاستوديو إلى المشاهد"
    ],
    "text": [
      "Une chaîne commence par une caméra, un studio, un fichier programmé ou un signal fourni avec autorisation. Une tête de réseau regroupe réception, sélection des programmes, encodage et distribution. Un récepteur satellite ne devient pas un serveur IPTV simplement parce qu’il reçoit une image ; les équipements, interfaces et droits dépendent du fournisseur.\n\nIngest = entrée. Origin = serveur qui fournit les médias. Edge/CDN = copies proches des spectateurs. Control plane = catalogue, comptes et autorisations ; media plane = transport des images et du son. Un panneau peut afficher une chaîne active même si sa source ne produit plus de vidéo.\n\nExemple : deux caméras correspondent à deux producteurs et deux chemins. Cent spectateurs ne demandent pas cent caméras ; ils demandent de la capacité de distribution. En unicast, chaque connexion consomme du débit. Le multicast est adapté à certains réseaux opérateurs contrôlés ; on ne l’active pas simplement dans un navigateur Internet.\n\nUn opérateur pirate peut reprendre un signal sans permission, puis utiliser une chaîne technique de distribution semblable. L’illégalité ne se voit donc pas dans l’extension .m3u8. Sépare toujours provenance du contenu, fonctionnement technique et droit de redistribution.",
      "A channel starts with a camera, studio, scheduled file or authorized provider feed. A headend combines reception, program selection, encoding and distribution. A satellite receiver does not become an IPTV server simply because it displays a picture; equipment, interfaces and permissions depend on the provider.\n\nIngest means input. Origin means the server supplying media. Edge/CDN means delivery copies nearer viewers. The control plane manages catalog, accounts and permissions; the media plane carries pictures and sound. A panel can show an enabled channel while its publisher has stopped sending video.\n\nExample: two cameras require two publishers and two paths. One hundred viewers do not require one hundred cameras; they require delivery capacity. Unicast uses capacity per connection. Multicast fits some managed operator networks; it is not a switch you simply enable in an Internet browser.\n\nAn unauthorized operator may obtain a signal without permission and then use a technically similar distribution chain. The .m3u8 extension therefore cannot establish legitimacy. Keep content provenance, technical operation and redistribution permission separate.",
      "تبدأ القناة بكاميرا أو استوديو أو ملف مجدول أو إشارة يوفّرها مصدر بإذن. تجمع محطة Headend الاستقبال واختيار البرامج والترميز والتوزيع. جهاز استقبال الأقمار الصناعية لا يتحول إلى خادم IPTV لمجرد أنه يعرض صورة؛ التجهيزات والواجهات والصلاحيات تعتمد على المزوّد.\n\nIngest يعني إدخال البث. Origin هو الخادم الأصلي للوسائط. Edge وCDN يقرّبان التوزيع من المشاهدين. لوحة التحكم تدير القنوات والحسابات والصلاحيات بينما مسار الوسائط ينقل الصورة والصوت. قد تعرض اللوحة قناة مفعّلة رغم توقف مصدرها عن إرسال الفيديو.\n\nمثال: كاميرتان تحتاجان مصدرَي بث ومسارين. مئة مشاهد لا تحتاج مئة كاميرا بل سعة توزيع كافية. في Unicast لكل اتصال استهلاك من السعة. أما Multicast فيناسب بعض شبكات المشغّلين المدارة وليس زرًا نفعّله في متصفح الإنترنت.\n\nقد يحصل مشغّل مقرصن على إشارة دون إذن ثم يستخدم سلسلة توزيع تقنية مشابهة. لذلك لا يكشف امتداد .m3u8 شرعية المحتوى. ميّز بين أصل المحتوى وعمل التقنية وحق إعادة البث."
    ],
    "code": "CONTROL: catalog → account → permission\nMEDIA: camera → encoder → origin → edge → viewer\nHEALTH: input → segments → playback → alerts",
    "task": [
      "Dessine deux chaînes et trois spectateurs ; sépare contrôle et vidéo.",
      "Draw two channels and three viewers; separate control from media.",
      "ارسم قناتين وثلاثة مشاهدين وافصل التحكم عن الفيديو."
    ],
    "result": [
      "Un catalogue décrit le service ; une source active produit les médias.",
      "A catalog describes the service; a live source produces media.",
      "القائمة تصف الخدمة والمصدر النشط ينتج الوسائط."
    ],
    "question": [
      "Un panneau actif prouve-t-il que la vidéo fonctionne ?",
      "Does an enabled panel entry prove working video?",
      "هل ظهور القناة مفعّلة في اللوحة يثبت عمل الفيديو؟"
    ],
    "options": [
      [
        "Non, il faut tester les médias",
        "No, test the media",
        "لا، يجب اختبار الوسائط"
      ],
      [
        "Oui",
        "Yes",
        "نعم"
      ]
    ],
    "answer": 0,
    "url": "https://mediamtx.org/docs/features/architecture",
    "failure": [
      "Vérifie le trajet média indépendamment du catalogue.",
      "Check the media path independently of the catalog.",
      "افحص مسار الوسائط مستقلًا عن القائمة."
    ]
  },
  {
    "id": "protocols",
    "minutes": 20,
    "title": [
      "Choisir RTMP, SRT, HLS ou WebRTC",
      "Choose RTMP, SRT, HLS or WebRTC",
      "اختر RTMP أو SRT أو HLS أو WebRTC"
    ],
    "text": [
      "Choisis le protocole selon le trajet. OBS vers le serveur est une contribution ; le serveur vers le public est une distribution. RTMP est courant pour la contribution. RTSP apparaît souvent sur les caméras. SRT peut récupérer des pertes sur une liaison instable, en échange de délai et de réglages adaptés. Aucun protocole ne crée de bande passante.\n\nHLS et MPEG-DASH utilisent des descriptions et des segments HTTP, pratiques pour la distribution et le cache. WebRTC convient à des interactions à faible délai mais demande une connectivité et une architecture adaptées. Les navigateurs ne lisent pas directement une URL RTMP comme une vidéo HTML.\n\nDans le laboratoire, garde RTMP pour publier et HLS pour regarder. Ne multiplie les protocoles qu’après une lecture stable. Note le codec, le protocole, le port et le rôle de chaque URL. Si le port du serveur change, la playlist doit pointer vers le nouveau port de lecture, pas vers le port de publication.",
      "Choose the protocol for the link. OBS to server is contribution; server to audience is distribution. RTMP is common for contribution. RTSP frequently appears on cameras. SRT can recover packet loss on unstable links, with a latency budget and appropriate configuration. No protocol creates bandwidth.\n\nHLS and MPEG-DASH use descriptions and HTTP segments, which suit delivery and caching. WebRTC suits low-delay interaction but needs suitable connectivity and architecture. Browsers do not directly play an RTMP URL as an HTML video.\n\nKeep RTMP for publishing and HLS for viewing in this lab. Add protocols only after playback is stable. Record codec, protocol, port and role for each URL. If a server port changes, the playlist must point to the new reading port, not the publishing port.",
      "اختر البروتوكول بحسب المرحلة. إرسال OBS إلى الخادم مرحلة إدخال، وإرسال الخادم للجمهور مرحلة توزيع. يستخدم RTMP كثيرًا للإدخال وRTSP في الكاميرات. يستطيع SRT تعويض بعض فقد الحزم على اتصال متذبذب مقابل تأخير وإعداد مناسبين. لا يخلق أي بروتوكول سعة إنترنت جديدة.\n\nيستخدم HLS وMPEG-DASH أوصافًا ومقاطع عبر HTTP ما يناسب التوزيع والتخزين المؤقت. يناسب WebRTC التفاعل قليل التأخير لكنه يحتاج اتصالًا وبنية مناسبين. لا يشغّل المتصفح رابط RTMP مباشرة كفيديو HTML.\n\nفي المختبر استخدم RTMP للإرسال وHLS للمشاهدة. لا تضف بروتوكولات أخرى قبل ثبات التشغيل. دوّن الترميز والبروتوكول والمنفذ ودور كل رابط. عند تغيير منفذ الخادم يجب أن تشير القائمة إلى منفذ المشاهدة الجديد وليس منفذ الإرسال."
    ],
    "code": "Publish: rtmp://localhost:1935/classroom\nWatch page: http://localhost:8888/classroom\nWatch media: http://localhost:8888/classroom/index.m3u8",
    "task": [
      "Classe ces trois URL par fonction.",
      "Classify these three URLs by function.",
      "صنّف الروابط الثلاثة بحسب الوظيفة."
    ],
    "result": [
      "Le lecteur reçoit HLS, OBS publie RTMP.",
      "The player receives HLS; OBS publishes RTMP.",
      "يستقبل المشغّل HLS ويرسل OBS عبر RTMP."
    ],
    "question": [
      "Quelle URL mettre dans VLC ?",
      "Which URL belongs in VLC?",
      "أي رابط نضع في VLC؟"
    ],
    "options": [
      [
        "L’URL HLS de lecture",
        "The HLS viewing URL",
        "رابط المشاهدة HLS"
      ],
      [
        "La destination RTMP de publication",
        "The RTMP publishing destination",
        "وجهة إرسال RTMP"
      ]
    ],
    "answer": 0,
    "url": "https://mediamtx.org/docs/features/publish",
    "failure": [
      "Une erreur de protocole ne se corrige pas en changeant le nom de la chaîne.",
      "A protocol mismatch is not fixed by renaming the channel.",
      "تغيير اسم القناة لا يحل عدم توافق البروتوكول."
    ]
  },
  {
    "id": "file-channel",
    "minutes": 30,
    "title": [
      "Créer une deuxième chaîne avec un fichier",
      "Create a second channel from a file",
      "أنشئ قناة ثانية من ملف فيديو"
    ],
    "text": [
      "Objectif : une chaîne nommée cinema avec ton propre clip, sans arrêter classroom. Avant de commencer, termine le laboratoire serveur, installe FFmpeg et place un fichier avec vidéo et audio nommé sample.mp4 dans le dossier courant. Ouvre une deuxième fenêtre PowerShell dans ce dossier. Le serveur MediaMTX reste dans sa première fenêtre.\n\nExécute la commande. -re lit le fichier à son rythme normal ; -stream_loop -1 le répète. -i indique l’entrée. libx264 et aac encodent la vidéo et le son ; yuv420p améliore la compatibilité. -r 30 et -g 60 fixent 30 images/s et un intervalle cible de deux secondes. -f flv prépare la sortie RTMP. Ce sont des paramètres de départ, pas une garantie de qualité sur chaque machine.\n\nOuvre ensuite l’URL HLS dans VLC. Tu dois voir ton clip et entendre son audio. C’est une chaîne linéaire alimentée par un fichier : les spectateurs rejoignent le point courant. Ce n’est pas une VOD où chacun commence à zéro. Arrête FFmpeg avec Ctrl+C puis vérifie que classroom fonctionne toujours si OBS continue.\n\nUne troisième chaîne demande un autre chemin et une autre source. Surveille le processeur : réencoder plusieurs chaînes coûte plus que changer leur nom. Pour une vraie programmation 24/7, ajoute un ordonnanceur, des contenus compatibles et une source de secours.",
      "Goal: a channel named cinema using your own clip while classroom continues. First finish the server lab, install FFmpeg and place a video-and-audio file called sample.mp4 in the working directory. Open a second PowerShell window in that directory. Keep MediaMTX running in its first window.\n\nRun the command. -re reads at the normal media pace; -stream_loop -1 repeats the file. -i selects input. libx264 and aac encode video and audio; yuv420p improves compatibility. -r 30 and -g 60 set 30 frames/s and a target two-second keyframe interval. -f flv packages RTMP output. These are starting settings, not a quality guarantee for every machine.\n\nOpen the HLS URL in VLC. See the clip and hear its audio. This is a linear channel fed by a file: viewers join its current position. It is not VOD with an independent start for each viewer. Stop FFmpeg with Ctrl+C and check that classroom still works while OBS continues.\n\nA third channel needs a separate path and source. Watch CPU usage: encoding several channels costs more than renaming entries. A real 24/7 schedule needs scheduling, compatible assets and fallback content.",
      "الهدف: قناة اسمها cinema تعرض مقطعك مع استمرار classroom. أكمل مختبر الخادم وثبّت FFmpeg وضع ملف فيديو يحتوي صورة وصوتًا باسم sample.mp4 في مجلد العمل. افتح نافذة PowerShell ثانية في المجلد نفسه واترك MediaMTX يعمل في النافذة الأولى.\n\nنفّذ الأمر. يقرأ -re الملف بسرعة العرض الطبيعية ويكرره -stream_loop -1. يحدد -i المصدر. يرمّز libx264 الفيديو وaac الصوت ويحسّن yuv420p التوافق. يضبط -r 30 و-g 60 ثلاثين إطارًا في الثانية وفاصلًا مستهدفًا قدره ثانيتان للإطار الرئيسي. يجهّز -f flv مخرج RTMP. هذه إعدادات بداية وليست ضمانًا للجودة على كل جهاز.\n\nافتح رابط HLS في VLC. يجب أن ترى المقطع وتسمع صوته. هذه قناة خطية مصدرها ملف؛ ينضم المشاهد إلى موضع العرض الحالي. ليست VOD يبدأ فيها كل مشاهد من الصفر. أوقف FFmpeg بواسطة Ctrl+C وتحقق من استمرار classroom إذا بقي OBS يبث.\n\nتحتاج القناة الثالثة مسارًا ومصدرًا آخرين. راقب المعالج؛ إعادة ترميز عدة قنوات تستهلك موارد أكثر من تغيير أسمائها. التشغيل المجدول طوال اليوم يحتاج منظّم برامج وملفات متوافقة ومحتوى احتياطيًا."
    ],
    "code": "ffmpeg -re -stream_loop -1 -i sample.mp4 -c:v libx264 -preset veryfast -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 128k -f flv rtmp://localhost:1935/cinema\n\n# Open in VLC:\n# http://localhost:8888/cinema/index.m3u8",
    "task": [
      "Fais fonctionner classroom et cinema ensemble, puis arrête seulement cinema.",
      "Run classroom and cinema together, then stop only cinema.",
      "شغّل classroom وcinema معًا ثم أوقف cinema فقط."
    ],
    "result": [
      "Deux chemins isolent les chaînes ; arrêter un producteur ne doit pas arrêter l’autre.",
      "Separate paths isolate channels; stopping one publisher should not stop the other.",
      "يفصل المساران القناتين؛ إيقاف مصدر لا يفترض أن يوقف الآخر."
    ],
    "question": [
      "Une boucle de fichier est-elle une VOD individuelle ?",
      "Is a looping file channel individual VOD?",
      "هل قناة الملف المتكرر هي VOD مستقل لكل مشاهد؟"
    ],
    "options": [
      [
        "Oui",
        "Yes",
        "نعم"
      ],
      [
        "Non, chacun rejoint le direct",
        "No, viewers join the current position",
        "لا، ينضم المشاهدون إلى الموضع الحالي"
      ]
    ],
    "answer": 1,
    "url": "https://mediamtx.org/docs/publish/ffmpeg",
    "failure": [
      "Fichier absent : vérifie le dossier. Encodeur absent : vérifie la version FFmpeg. HLS absent : vérifie le serveur et les logs de publication.",
      "Missing file: check directory. Missing encoder: check the FFmpeg build. Missing HLS: check server and publish logs.",
      "ملف مفقود: افحص المجلد. مشفّر مفقود: افحص نسخة FFmpeg. بث HLS مفقود: افحص الخادم وسجل الإرسال."
    ]
  },
  {
    "id": "ingest",
    "minutes": 25,
    "title": [
      "Ajouter une source au serveur",
      "Add a feed to the server",
      "أضف مصدر قناة إلى الخادم"
    ],
    "text": [
      "Ajouter une chaîne demande quatre éléments : une source autorisée, un chemin serveur unique, une URL de lecture qui fonctionne et une entrée dans le catalogue. Le nom et le logo sont seulement des métadonnées. Écris d’abord une fiche : identifiant, propriétaire, format, adresse d’entrée, adresse de sortie et personne à prévenir en cas de panne.\n\nEn push, la source envoie vers ton serveur : OBS publie classroom. En pull, ton serveur se connecte à une source : caméra RTSP ou flux HLS fourni par contrat. Pour un fournisseur réel, demande l’URL officielle, les codecs, la méthode d’authentification, les restrictions réseau, le nombre de connexions et les droits de redistribution. Garde les secrets côté serveur.\n\nAtelier reproductible : réutilise classroom, ton propre flux local, comme entrée FFmpeg et republie-le vers relay. Ne change pas la commande pour une source inconnue. Le remuxage -c copy économise du CPU, mais ne répare pas un codec incompatible. Cette double livraison est un exercice, pas une optimisation de production.\n\nValide d’abord classroom, lance la commande, puis ouvre relay dans VLC. Ajoute relay au catalogue seulement après lecture réussie. Coupe OBS : les deux sorties finissent par s’arrêter. Tu viens de découvrir une dépendance amont ; deux URL ne signifient pas deux sources indépendantes.",
      "Adding a channel requires four things: an authorized source, a unique server path, a working playback URL and a catalog entry. Name and logo are only metadata. First write a record with ID, owner, input format, input address, output address and outage contact.\n\nWith push, the source sends to your server: OBS publishes classroom. With pull, your server connects to a source such as an RTSP camera or contracted HLS feed. For a real provider, request the official URL, codecs, authentication method, network restrictions, connection allowance and redistribution permissions. Keep secrets on the server.\n\nReproducible lab: use classroom, your own local stream, as FFmpeg input and publish it to relay. Do not substitute an unknown source. Remuxing with -c copy saves CPU but does not fix incompatible codecs. This extra delivery hop is an exercise, not a production optimization.\n\nVerify classroom first, run the command and open relay in VLC. Add relay to the catalog only after successful playback. Stop OBS: both outputs eventually stop. You have found an upstream dependency; two URLs do not imply two independent sources.",
      "إضافة قناة تتطلب أربعة أشياء: مصدرًا مأذونًا ومسارًا فريدًا على الخادم ورابط مشاهدة يعمل وسجلًا في قائمة القنوات. الاسم والشعار بيانات وصفية فقط. اكتب أولًا بطاقة فيها المعرّف والمالك وصيغة الإدخال وعنوان المصدر وعنوان المشاهدة وجهة الاتصال عند العطل.\n\nفي Push يدفع المصدر البث إلى خادمك مثل إرسال OBS إلى classroom. في Pull يتصل الخادم بالمصدر مثل كاميرا RTSP أو بث HLS يقدمه مزوّد بعقد. اطلب من المزوّد الرابط الرسمي والترميزات وطريقة المصادقة وقيود الشبكة وعدد الاتصالات وحقوق إعادة البث. احتفظ بالأسرار على الخادم.\n\nتمرين قابل للتطبيق: استخدم classroom، وهو بثك المحلي، مصدرًا لـFFmpeg وأعد إرساله إلى relay. لا تستبدله بمصدر مجهول. يوفّر -c copy موارد المعالج بنقل المسارات دون إعادة ترميز لكنه لا يصلح ترميزًا غير متوافق. هذه الخطوة الإضافية تمرين وليست تحسينًا لبنية الإنتاج.\n\nتحقق من classroom أولًا ثم نفّذ الأمر وافتح relay في VLC. أضف relay إلى القائمة بعد نجاح المشاهدة. أوقف OBS: سيتوقف المخرجان بعد نفاد التخزين المؤقت. هكذا تفهم الاعتماد على مصدر واحد؛ رابطان لا يعنيان مصدرين مستقلين."
    ],
    "code": "ffmpeg -i http://localhost:8888/classroom/index.m3u8 -c copy -f flv rtmp://localhost:1935/relay\n\n# Watch: http://localhost:8888/relay/index.m3u8\n# Dependency: OBS → classroom → FFmpeg → relay",
    "task": [
      "Crée relay et vérifie son comportement quand OBS s’arrête.",
      "Create relay and observe what happens when OBS stops.",
      "أنشئ relay وراقب ماذا يحدث عند إيقاف OBS."
    ],
    "result": [
      "Le relais dépend de classroom ; l’entrée catalogue seule ne produit rien.",
      "The relay depends on classroom; the catalog entry alone produces nothing.",
      "يعتمد relay على classroom؛ سجل القائمة وحده لا ينتج بثًا."
    ],
    "question": [
      "Deux URL issues de la même source sont-elles une vraie redondance ?",
      "Are two URLs from the same source true redundancy?",
      "هل رابطان من المصدر نفسه يوفران احتياطًا مستقلًا؟"
    ],
    "options": [
      [
        "Non",
        "No",
        "لا"
      ],
      [
        "Oui",
        "Yes",
        "نعم"
      ]
    ],
    "answer": 0,
    "url": "https://ffmpeg.org/ffmpeg.html",
    "failure": [
      "Vérifie la source avant le relais. Une erreur de codec peut demander un transcodage explicite.",
      "Verify the source before the relay. A codec error may require explicit transcoding.",
      "افحص المصدر قبل إعادة البث. قد يحتاج خطأ الترميز إلى إعادة ترميز صريحة."
    ]
  },
  {
    "id": "epg",
    "minutes": 25,
    "title": [
      "Catalogue M3U et guide XMLTV",
      "M3U catalog and XMLTV guide",
      "قائمة M3U ودليل XMLTV"
    ],
    "text": [
      "Une playlist de chaînes est un carnet d’adresses. Chaque EXTINF contient le nom affiché et éventuellement tvg-id et group-title ; la ligne suivante contient l’adresse média. Ces attributs sont des conventions de lecteurs : leur prise en charge varie. Sauvegarde en UTF-8 avec une vraie extension .m3u, pas .m3u.txt.\n\nUn guide XMLTV décrit des programmes. Son channel id doit correspondre au tvg-id. Les heures incluent un décalage ; +0000 signifie UTC. Le lecteur peut les afficher dans son fuseau local. L’exemple contient des dates fixes : adapte-les au jour de ton test, sinon le guide paraît vide alors que le fichier est valide.\n\nCrée les deux fichiers séparément. Dans un lecteur compatible, importe la playlist puis indique le fichier ou l’URL EPG dans son réglage dédié. VLC suffit pour tester les flux, mais ne suppose pas que tous les lecteurs proposent le même guide. Si le guide ne correspond pas, compare ID, date, fuseau et rafraîchissement ; ne change pas l’encodeur.\n\nLe guide ne programme pas le serveur : annoncer une émission à 10 h ne lance pas une vidéo à 10 h. La programmation de la source et la publication du guide sont deux tâches distinctes.",
      "A channel playlist is an address book. Each EXTINF gives a display name and may include tvg-id and group-title; the following line contains the media address. These attributes are player conventions with varying support. Save UTF-8 with an actual .m3u extension, not .m3u.txt.\n\nXMLTV describes programs. Its channel ID must match tvg-id. Times include an offset; +0000 means UTC. A player may display them in its local time zone. This example uses fixed dates: update them to your test day or a valid file may still produce an empty current guide.\n\nCreate the two files separately. In a compatible player, import the playlist, then enter the EPG file or URL in its separate setting. VLC can test media, but do not assume every player has the same guide features. If listings mismatch, compare ID, date, time zone and refresh status; do not change the encoder.\n\nA guide does not schedule the server: listing a show at 10:00 does not start a video at 10:00. Source scheduling and guide publication are separate jobs.",
      "قائمة القنوات مثل دفتر عناوين. يحمل كل EXTINF الاسم الظاهر ويمكن أن يتضمن tvg-id وgroup-title ثم يأتي رابط الوسائط في السطر التالي. هذه خصائص متعارف عليها بين المشغّلات ويختلف دعمها. احفظ بترميز UTF-8 وامتداد .m3u الحقيقي وليس .m3u.txt.\n\nيصف XMLTV البرامج. يجب أن يطابق channel id قيمة tvg-id. تشمل الأوقات فرق المنطقة الزمنية؛ +0000 يعني UTC وقد يحوّلها المشغّل إلى توقيتك المحلي. المثال يستخدم تاريخًا ثابتًا؛ غيّره إلى يوم الاختبار وإلا قد يبدو الدليل الحالي فارغًا رغم صحة الملف.\n\nأنشئ الملفين كلًا على حدة. في مشغّل متوافق استورد القائمة ثم أدخل ملف EPG أو رابطه في الإعداد المخصص له. يصلح VLC لاختبار البث لكن لا تفترض تطابق خصائص الدليل في جميع التطبيقات. إذا لم تتطابق البرامج افحص المعرّف والتاريخ والتوقيت وتحديث الدليل بدل تغيير المشفّر.\n\nالدليل لا يجدول الخادم: كتابة برنامج في العاشرة لا تشغّل الفيديو تلقائيًا في العاشرة. جدولة مصدر الفيديو ونشر دليل البرامج مهمتان منفصلتان."
    ],
    "code": "# channels.m3u — save ONLY this playlist in this file\n#EXTM3U\n#EXTINF:-1 tvg-id=\"classroom\" group-title=\"Learning\",Classroom\nhttp://localhost:8888/classroom/index.m3u8\n#EXTINF:-1 tvg-id=\"cinema\" group-title=\"Learning\",Cinema\nhttp://localhost:8888/cinema/index.m3u8\n\n<!-- guide.xml — save ONLY the XML below in a separate file -->\n<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<tv>\n  <channel id=\"classroom\"><display-name>Classroom</display-name></channel>\n  <programme start=\"20261008100000 +0000\" stop=\"20261008103000 +0000\" channel=\"classroom\">\n    <title lang=\"en\">My live lesson</title>\n  </programme>\n</tv>",
    "task": [
      "Crée les fichiers, adapte la date et vérifie les identifiants.",
      "Create the files, update the date and check matching IDs.",
      "أنشئ الملفين وعدّل التاريخ وتحقق من تطابق المعرّفات."
    ],
    "result": [
      "classroom relie catalogue et guide ; le média reste une URL séparée.",
      "classroom joins catalog and guide; media remains a separate URL.",
      "يربط classroom القائمة بالدليل بينما يبقى الفيديو في رابط مستقل."
    ],
    "question": [
      "Que vérifier si le direct fonctionne mais le guide est vide ?",
      "What should you check if live video works but the guide is empty?",
      "ماذا تفحص إذا عمل البث وكان الدليل فارغًا؟"
    ],
    "options": [
      [
        "Le câble caméra seulement",
        "Only the camera cable",
        "كابل الكاميرا فقط"
      ],
      [
        "ID, dates, fuseau et import EPG",
        "IDs, dates, time zone and EPG import",
        "المعرّفات والتاريخ والتوقيت واستيراد EPG"
      ]
    ],
    "answer": 1,
    "url": "https://github.com/XMLTV/xmltv/blob/master/xmltv.dtd",
    "failure": [
      "Ne colle pas la playlist dans le XML. La déclaration XML doit commencer le fichier XML.",
      "Do not paste the playlist into XML. The XML declaration must start the XML file.",
      "لا تلصق القائمة داخل XML. يجب أن يبدأ ملف XML بتعريف XML."
    ]
  },
  {
    "id": "apps",
    "minutes": 25,
    "title": [
      "Configurer une application IPTV",
      "Set up an IPTV player app",
      "اضبط تطبيق IPTV للمشاهدة"
    ],
    "text": [
      "Commence sur le même ordinateur que le serveur : lance OBS, ouvre classroom dans le navigateur, puis teste index.m3u8 dans VLC. Ensuite seulement importe channels.m3u dans une application prenant en charge les playlists M3U. Le nom exact du menu varie : ajouter playlist, fichier local ou URL de playlist. Choisis le mode correspondant à ce que tu possèdes.\n\nTrois notions : une URL HLS pointe vers une chaîne ; une URL M3U peut décrire un catalogue ; un compte portail utilise une API et des identifiants définis par le fournisseur. Les modes souvent appelés Xtream ou portail ne sont pas interchangeables avec une URL HLS. MediaMTX seul ne fournit pas ces API de comptes. N’invente pas un nom d’utilisateur pour contourner un écran de connexion.\n\nSur téléphone, localhost désigne le téléphone. Le laboratoire Docker est volontairement lié à 127.0.0.1 ; remplacer le texte dans la playlist par l’IP du PC ne suffit pas. Le test multi-appareils demande un service lié à une interface réseau adaptée, une règle de pare-feu limitée et une authentification. Utilise d’abord le même PC ; suis ensuite la leçon de déploiement.\n\nDans ton application, vérifie deux changements de chaîne, le son, la reprise après mise en veille et un message clair si la source est arrêtée. Un logo affiché ne prouve pas que la chaîne marche. Note appareil, lecteur et version : le support des codecs, sous-titres et EPG varie.",
      "Start on the server computer: run OBS, open classroom in the browser, then test index.m3u8 in VLC. Only then import channels.m3u into an app supporting M3U playlists. Menu names vary: add playlist, local file or playlist URL. Choose the mode matching your input.\n\nDistinguish three things: an HLS URL points to a channel; an M3U URL may describe a catalog; a portal account uses an API and credentials defined by the provider. Modes often called Xtream or portal are not interchangeable with an HLS URL. MediaMTX alone does not provide these account APIs. Do not invent a username to get past a login screen.\n\nOn a phone, localhost means the phone. Our Docker lab intentionally binds to 127.0.0.1; replacing the playlist address with the PC IP is insufficient. Multiple-device testing requires an appropriate network listener, a narrowly scoped firewall rule and authentication. First use the same PC, then study the deployment lesson.\n\nTest two channel changes, audio, recovery after sleep and a clear stopped-source message. A visible logo does not prove working media. Record device, player and version: codec, subtitle and guide support varies.",
      "ابدأ على الحاسوب الذي يشغّل الخادم: شغّل OBS وافتح classroom في المتصفح ثم اختبر index.m3u8 في VLC. بعدها استورد channels.m3u في تطبيق يدعم قوائم M3U. تختلف أسماء القوائم: إضافة قائمة أو ملف محلي أو رابط قائمة. اختر النمط المناسب لما تملكه.\n\nميّز بين ثلاثة أشياء: رابط HLS يشير إلى قناة؛ رابط M3U قد يصف قائمة قنوات؛ حساب البوابة يستخدم API وبيانات دخول يحددها المزوّد. الأنماط المسماة Xtream أو Portal ليست بديلًا مباشرًا لرابط HLS. لا يوفّر MediaMTX وحده واجهات حسابات هذه البوابات. لا تخترع اسم مستخدم لتجاوز شاشة الدخول.\n\nعلى الهاتف يعني localhost الهاتف نفسه. مختبر Docker مربوط عمدًا بـ127.0.0.1؛ استبدال العنوان في القائمة بعنوان الحاسوب لا يكفي. الاختبار من عدة أجهزة يحتاج خدمة تستمع على واجهة شبكة مناسبة وقاعدة جدار ناري محدودة ومصادقة. استخدم الحاسوب نفسه أولًا ثم ادرس درس النشر.\n\nاختبر تبديل القناة مرتين والصوت والاستئناف بعد السكون ورسالة واضحة عند إيقاف المصدر. ظهور الشعار لا يثبت عمل الفيديو. دوّن الجهاز والمشغّل والإصدار؛ دعم الترميزات والترجمة والدليل يختلف."
    ],
    "code": "1. OBS publishes classroom\n2. Browser: http://localhost:8888/classroom\n3. VLC network stream: http://localhost:8888/classroom/index.m3u8\n4. Import channels.m3u in a compatible player\n5. Configure guide.xml separately if supported",
    "task": [
      "Teste la même chaîne dans deux lecteurs et note les différences.",
      "Test the same channel in two players and record differences.",
      "اختبر القناة نفسها في مشغّلين ودوّن الفروق."
    ],
    "result": [
      "Tu identifies le bon mode d’import et distingues problème lecteur et problème source.",
      "You can select the right import mode and separate player from source problems.",
      "تختار طريقة الاستيراد المناسبة وتميّز مشكلة المشغّل عن مشكلة المصدر."
    ],
    "question": [
      "MediaMTX fournit-il automatiquement un portail Xtream ?",
      "Does MediaMTX automatically supply an Xtream portal?",
      "هل يوفّر MediaMTX بوابة Xtream تلقائيًا؟"
    ],
    "options": [
      [
        "Non",
        "No",
        "لا"
      ],
      [
        "Oui",
        "Yes",
        "نعم"
      ]
    ],
    "answer": 0,
    "url": "https://mediamtx.org/docs/read/vlc",
    "failure": [
      "Si VLC fonctionne mais pas l’application, vérifie format d’import et compatibilité.",
      "If VLC works but the app does not, check import mode and compatibility.",
      "إذا عمل VLC ولم يعمل التطبيق فافحص طريقة الاستيراد والتوافق."
    ]
  },
  {
    "id": "abr",
    "minutes": 30,
    "title": [
      "Qualité adaptative et budget vidéo",
      "Adaptive quality and video budget",
      "الجودة المتكيفة وميزانية الفيديو"
    ],
    "text": [
      "Une seule qualité oblige tous les spectateurs à télécharger le même débit. ABR offre plusieurs rendus synchronisés d’une même émission. Le lecteur choisit selon ses mesures de réseau et son tampon. Une liste de deux chaînes différentes n’est pas ABR.\n\nExercice de conception : compare 720p à 3 Mbit/s + 128 kbit/s audio et 360p à 800 kbit/s + 96 kbit/s audio. Ce sont des hypothèses pour calculer, pas des réglages universels. Le mouvement, le codec et le matériel changent le résultat. Mesure des scènes rapides, du texte et des visages avant de choisir.\n\nPour fabriquer ABR, il faut encoder les rendus, aligner les images clés et les horodatages, produire leurs playlists média et une playlist principale cohérente. MediaMTX peut distribuer des flux mais ajouter un CDN ne réalise pas ces encodages. Ne présente pas deux encodeurs indépendants comme une échelle ABR validée.\n\nLe calcul ci-dessous modélise 70 spectateurs en haute qualité et 30 en basse. Il exclut surdébit réseau, reprises et cache. Compare ensuite à une connexion où tout le monde regarde la haute qualité. En production, facture de transfert et capacité de pointe sont deux mesures différentes.",
      "With a single rendition, everyone downloads the same bitrate. ABR provides synchronized renditions of one program. The player selects using measured network conditions and buffer state. A list of two different channels is not ABR.\n\nDesign exercise: compare 720p at 3 Mbps plus 128 kbps audio with 360p at 800 kbps plus 96 kbps audio. These are calculation assumptions, not universal settings. Motion, codec and hardware change the result. Measure fast action, text and faces before choosing.\n\nProducing ABR requires encoding renditions, aligning keyframes and timestamps, supplying media playlists and a consistent master playlist. MediaMTX can distribute streams, but adding a CDN does not perform these encodes. Do not describe two independent encoders as a validated ABR ladder.\n\nThe calculation models 70 viewers on high quality and 30 on low. It excludes network overhead, retries and cache effects. Compare it with everyone using high quality. Production transfer billing and peak network capacity are different measures.",
      "عند توفير جودة واحدة يحمّل الجميع معدل البت نفسه. توفر ABR جودات متزامنة للبرنامج نفسه ويختار المشغّل بحسب قياس الشبكة والمخزن المؤقت. قائمة تحتوي قناتين مختلفتين ليست ABR.\n\nتمرين تصميم: قارن 720p بمعدل 3 ميغابت/ثانية وصوت 128 كيلوبت/ثانية مع 360p بمعدل 800 كيلوبت/ثانية وصوت 96 كيلوبت/ثانية. هذه فرضيات للحساب وليست إعدادات مناسبة لكل حالة. تؤثر الحركة والترميز والجهاز؛ قارن مشاهد الحركة والنصوص والوجوه قبل الاختيار.\n\nإنتاج ABR يتطلب ترميز الجودات ومحاذاة الإطارات الرئيسية والتوقيت وإنتاج قوائم الوسائط وقائمة رئيسية صحيحة. يستطيع MediaMTX توزيع البث لكن إضافة CDN لا تنفّذ هذه الترميزات. لا تعتبر مشفّرين مستقلين منظومة ABR متزامنة دون اختبار.\n\nيحسب المثال استهلاك سبعين مشاهدًا بالجودة العالية وثلاثين بالمنخفضة دون الحمل الإضافي أو إعادة الطلب أو أثر التخزين المؤقت. قارنه بحالة مشاهدة الجميع للجودة العالية. تكلفة البيانات المنقولة وسعة الشبكة القصوى مقياسان مختلفان."
    ],
    "code": "const highMbps = 3 + 0.128;\nconst lowMbps = 0.8 + 0.096;\nconst mixedMbps = 70 * highMbps + 30 * lowMbps;\nconsole.log({ mixedMbps, allHighMbps: 100 * highMbps });\n// Mixed: 245.84 Mbps; all high: 312.8 Mbps (before overhead)",
    "task": [
      "Recalcule pour 50/50 et explique pourquoi une playlist seule ne crée pas de qualité.",
      "Recalculate for 50/50 and explain why a playlist alone cannot create renditions.",
      "أعد الحساب لخمسين مشاهدًا بكل جودة واشرح لماذا لا تنشئ القائمة وحدها جودات جديدة."
    ],
    "result": [
      "50/50 demande 201,2 Mbit/s avant marge. ABR demande des médias réellement encodés.",
      "50/50 requires 201.2 Mbps before headroom. ABR needs actual encoded renditions.",
      "تحتاج نسبة 50/50 إلى 201.2 ميغابت/ثانية قبل الهامش. تحتاج ABR جودات مرمّزة فعلًا."
    ],
    "question": [
      "Deux chaînes différentes constituent-elles ABR ?",
      "Do two different channels constitute ABR?",
      "هل قناتان مختلفتان تشكّلان ABR؟"
    ],
    "options": [
      [
        "Oui",
        "Yes",
        "نعم"
      ],
      [
        "Non, ce sont des rendus du même contenu",
        "No, ABR uses renditions of the same content",
        "لا، تستخدم ABR جودات للمحتوى نفسه"
      ]
    ],
    "answer": 1,
    "url": "https://developer.apple.com/streaming/",
    "failure": [
      "Une qualité basse doit rester lisible ; mesure avant de réduire davantage le débit.",
      "A lower rendition must remain usable; measure before reducing bitrate further.",
      "يجب أن تبقى الجودة المنخفضة قابلة للمشاهدة؛ قِس قبل خفض معدل البت أكثر."
    ]
  },
  {
    "id": "drm",
    "minutes": 20,
    "title": [
      "Piratage, chiffrement et protection",
      "Piracy, encryption and protection",
      "القرصنة والتشفير وحماية المحتوى"
    ],
    "text": [
      "Comprendre l’abus aide à comprendre les protections. Des chaînes non autorisées peuvent venir de la recapture d’un abonnement, de comptes compromis, de flux exposés ou d’un revendeur dépendant d’un autre fournisseur. Après acquisition, un opérateur peut agréger, réencoder et distribuer. La partie distribution ressemble à celle d’un service autorisé ; elle ne rend pas la source légitime.\n\nUn abonnement de visionnage ne prouve pas une autorisation de redistribution. Une URL accessible, un fichier M3U ou une mention « privé » ne prouvent pas davantage cette autorisation. On étudie ici le mécanisme général, sans extraction de comptes, de clés ni contournement de protections. Les ateliers utilisent uniquement ta caméra et tes fichiers.\n\nHTTPS protège le transport. Une authentification identifie le client ; une autorisation décide ce qu’il peut lire. Le chiffrement du média et un système DRM ajoutent une gestion de clés et de licences. EME est une interface navigateur pour interagir avec des systèmes de contenu protégé ; ce n’est pas un outil pour récupérer des clés.\n\nUne URL signée peut expirer mais reste partageable pendant sa validité selon la politique. Un filigrane peut aider à retrouver une fuite sans empêcher toute copie. Planifie limitation des sessions, révocation et alertes sans conserver inutilement les données personnelles. Teste les refus sur tes propres comptes de test.",
      "Understanding misuse helps explain defenses. Unauthorized channels can originate from subscription recapture, compromised accounts, exposed feeds or a reseller dependent on another supplier. After acquisition, an operator may aggregate, re-encode and distribute. That delivery stage resembles authorized services; it does not legitimize the source.\n\nA viewing subscription does not establish redistribution permission. Neither does an accessible URL, an M3U file or a “private” label. This lesson covers the general mechanism without account extraction, key extraction or protection bypass. Labs use your camera and files.\n\nHTTPS protects transport. Authentication identifies a caller; authorization determines what they can read. Media encryption and DRM add key and license management. EME is a browser interface for interacting with protected-content systems, not a tool for recovering keys.\n\nA signed URL can expire yet may remain shareable during validity depending on policy. Watermarking can help trace a leak without preventing all copying. Plan session limits, revocation and alerts without retaining unnecessary personal data. Test rejection using your own test accounts.",
      "فهم إساءة الاستخدام يساعدك على فهم الحماية. قد تأتي القنوات غير المأذونة من إعادة التقاط اشتراك مشاهدة أو حسابات مخترقة أو بث مكشوف أو موزّع يعتمد على مزوّد آخر. بعد الحصول على الإشارة قد يجمع المشغّل القنوات ويعيد ترميزها ويوزعها. تشبه مرحلة التوزيع خدمة مرخّصة لكنها لا تجعل المصدر مشروعًا.\n\nاشتراك المشاهدة لا يثبت حق إعادة البث. كذلك الرابط المتاح وملف M3U وعبارة «خاص» لا تثبت الإذن. نشرح الآلية العامة دون استخراج حسابات أو مفاتيح أو تجاوز الحماية. تستخدم التمارين كاميرتك وملفاتك فقط.\n\nيحمي HTTPS النقل. تحدد المصادقة هوية العميل وتحدد الصلاحيات ما يمكنه مشاهدته. يضيف تشفير الوسائط ونظام DRM إدارة للمفاتيح والتراخيص. EME واجهة في المتصفح للتعامل مع أنظمة المحتوى المحمي وليست أداة لاسترجاع المفاتيح.\n\nقد ينتهي رابط موقّع لكنه يظل قابلًا للمشاركة أثناء صلاحيته بحسب السياسة. قد تساعد العلامة المائية في تتبع التسريب دون منع كل نسخ. خطط لحدود الجلسات وإلغاء الوصول والتنبيهات دون الاحتفاظ ببيانات شخصية لا تحتاجها. اختبر الرفض بحسابات اختبار تملكها."
    ],
    "code": "Threat → Control → Test\nShared URL → expiry / session policy → expired request rejected\nStolen publisher secret → rotate / revoke → old publisher rejected\nOpen origin → restrict origin access → direct request rejected\nVideo leak → watermark / response plan → trace a test recording",
    "task": [
      "Associe trois risques à une protection et à un test de refus.",
      "Match three risks to controls and rejection tests.",
      "اربط ثلاثة مخاطر بوسائل حماية واختبارات رفض."
    ],
    "result": [
      "Transport, identité, autorisation et droits du contenu sont quatre questions distinctes.",
      "Transport, identity, authorization and content rights are distinct questions.",
      "النقل والهوية والصلاحيات وحقوق المحتوى أسئلة مختلفة."
    ],
    "question": [
      "HTTPS prouve-t-il les droits de diffusion ?",
      "Does HTTPS prove distribution rights?",
      "هل يثبت HTTPS حقوق البث؟"
    ],
    "options": [
      [
        "Non",
        "No",
        "لا"
      ],
      [
        "Oui",
        "Yes",
        "نعم"
      ]
    ],
    "answer": 0,
    "url": "https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API",
    "failure": [
      "Si une requête refusée dans l’interface fonctionne directement, la vérification serveur est incomplète.",
      "If a request blocked in the UI succeeds directly, server enforcement is incomplete.",
      "إذا نجح الطلب المباشر رغم رفض الواجهة فالتطبيق على الخادم غير مكتمل."
    ]
  },
  {
    "id": "deployment",
    "minutes": 35,
    "title": [
      "Du laboratoire au service hébergé",
      "From lab to hosted service",
      "من المختبر إلى خدمة مستضافة"
    ],
    "text": [
      "Un déploiement public est un nouveau projet : ne copie pas le laboratoire anonyme sur Internet. Choisis un hôte permanent, dimensionne encodage et trafic, puis sépare entrée producteur, lecture publique et administration privée. Un VPS, un serveur dédié et un service vidéo géré répartissent différemment maintenance, coût et capacité.\n\nOrdre de travail : sauvegarde la configuration locale ; crée des identités distinctes ; limite chaque producteur à son chemin ; vérifie les refus ; configure domaine et certificat ; place la distribution HLS derrière HTTPS ; autorise seulement les ports nécessaires. Protège aussi les segments et l’origine, pas seulement la page. Garde API et métriques sur un réseau d’administration.\n\nL’authentification doit fonctionner avec le lecteur choisi : certains lecteurs gèrent mal les en-têtes personnalisés. Teste la playlist ET les segments, l’expiration et le renouvellement sans interruption excessive. Un proxy doit conserver les chemins et paramètres nécessaires. Une page HTTPS peut bloquer un flux HTTP comme contenu mixte ; ne résous pas cela en désactivant la sécurité du navigateur.\n\nAvant ouverture : compte actif accepté ; compte expiré refusé ; lecteur incapable de publier ; producteur incapable d’administrer ; accès direct à l’origine bloqué selon la conception. Ces tests doivent être réalisés sur une préproduction. Le plan ci-dessous est une architecture à implémenter, pas un serveur public déjà sécurisé.",
      "Public deployment is a separate project: do not copy the anonymous lab onto the Internet. Choose an always-on host, size encoding and traffic, and separate publisher ingest, public playback and private administration. VPS, dedicated servers and managed video services distribute maintenance, cost and capacity differently.\n\nWork in order: back up local configuration; create separate identities; scope each publisher to its path; test rejection; configure domain and certificate; put HLS delivery behind HTTPS; allow only needed ports. Protect segments and origin as well as the page. Keep API and metrics on an administrative network.\n\nAuthentication must work with your chosen player: some players handle custom headers poorly. Test playlists AND segments, expiry and renewal without excessive interruption. A proxy must preserve necessary paths and parameters. HTTPS pages may block HTTP streams as mixed content; do not fix this by disabling browser security.\n\nBefore release: active account accepted; expired account rejected; viewer cannot publish; publisher cannot administer; direct origin access blocked according to your design. Run these on staging. The diagram is an architecture to implement, not an already secured public server.",
      "النشر العام مشروع جديد: لا تنسخ المختبر بلا مصادقة إلى الإنترنت. اختر جهازًا دائم التشغيل واحسب موارد الترميز وحركة البيانات وافصل إدخال الناشر عن مشاهدة الجمهور وإدارة النظام الخاصة. تختلف مسؤوليات الصيانة والتكلفة والسعة بين VPS والخادم المخصص وخدمة فيديو مدارة.\n\nترتيب العمل: انسخ الإعدادات احتياطيًا؛ أنشئ هويات منفصلة؛ احصر كل ناشر في مساره؛ اختبر الرفض؛ اضبط النطاق والشهادة؛ اجعل توزيع HLS عبر HTTPS؛ اسمح بالمنافذ الضرورية فقط. احمِ المقاطع والخادم الأصلي وليس الصفحة وحدها. أبقِ API والمقاييس على شبكة إدارة.\n\nيجب أن تتوافق المصادقة مع المشغّل المختار؛ بعض التطبيقات لا تدعم رؤوس الطلب المخصصة جيدًا. اختبر القوائم والمقاطع معًا وانتهاء الصلاحية وتجديدها دون انقطاع مزعج. يجب أن يحافظ الوكيل على المسارات والمعاملات اللازمة. قد تمنع صفحة HTTPS بث HTTP لأنه محتوى مختلط؛ لا تحل ذلك بتعطيل أمان المتصفح.\n\nقبل الإطلاق: الحساب النشط مقبول والمنتهي مرفوض والمشاهد لا يستطيع الإرسال والناشر لا يدير النظام والوصول المباشر للأصل محجوب حسب التصميم. نفّذ الاختبارات على بيئة تجريبية. المخطط بنية تحتاج تنفيذًا وليس خادمًا عامًا مؤمّنًا جاهزًا."
    ],
    "code": "Publisher → protected ingest → origin (private)\nViewer → HTTPS / access validation → HLS origin or CDN\nAdministrator → private management network\n\nRelease evidence:\n[ ] Authorized playback succeeds\n[ ] Missing / expired access fails\n[ ] Viewer publish attempt fails\n[ ] Playlist AND segment policy verified\n[ ] Backup restore and rollback rehearsed",
    "task": [
      "Rédige un plan de préproduction et une preuve attendue pour chaque test.",
      "Write a staging plan and expected evidence for each test.",
      "اكتب خطة بيئة تجريبية والدليل المتوقع لكل اختبار."
    ],
    "result": [
      "La mise en ligne exige des contrôles vérifiés, pas uniquement un domaine qui répond.",
      "Going public requires verified controls, not merely a responding domain.",
      "النشر يتطلب ضوابط مختبرة وليس مجرد نطاق يستجيب."
    ],
    "question": [
      "Protéger seulement la page suffit-il ?",
      "Is protecting only the page sufficient?",
      "هل تكفي حماية الصفحة فقط؟"
    ],
    "options": [
      [
        "Oui",
        "Yes",
        "نعم"
      ],
      [
        "Non, vérifier playlists, segments et origine",
        "No, verify playlists, segments and origin",
        "لا، افحص القوائم والمقاطع والخادم الأصلي"
      ]
    ],
    "answer": 1,
    "url": "https://mediamtx.org/docs/features/authentication",
    "failure": [
      "Un refus inattendu : compare identité, action, chemin et expiration dans des logs sans secrets.",
      "Unexpected denial: compare identity, action, path and expiry in secret-free logs.",
      "عند رفض غير متوقع قارن الهوية والفعل والمسار والصلاحية في سجلات لا تحتوي أسرارًا."
    ]
  },
  {
    "id": "troubleshooting-lab",
    "minutes": 30,
    "title": [
      "Résoudre les pannes par preuve",
      "Solve failures using evidence",
      "حل الأعطال بالدليل"
    ],
    "text": [
      "Ne change qu’une variable à la fois. Dessine cinq cases : source, publication, serveur, réseau et lecteur. Pour chaque panne, écris heure, symptôme, dernière étape saine, hypothèse et résultat du test. Un redémarrage peut masquer un problème sans l’expliquer.\n\nExercice 1 : coupe OBS. Attends que le tampon se vide. Vérifie que cinema continue si FFmpeg tourne. Exercice 2 : remplace classroom par classroom-typo dans VLC, puis remets le bon chemin. Exercice 3 : coupe seulement le micro dans OBS. Une image correcte avec silence indique un problème distinct d’un serveur inaccessible.\n\nInterprétation : connexion refusée → adresse, port ou service ; 401/403 → accès ; 404 → chemin, source ou segment disparu ; son sans image → piste vidéo ou décodage ; coupures → débit, pertes, encodeur ou tampon. Ces indices orientent l’enquête, ils ne prouvent pas seuls la cause. CORS concerne le navigateur, pas une permission générale du serveur.\n\nMesure démarrage, délai image réelle/image lue, nombre de coupures et reprise. Teste les requêtes de segments autant que la playlist. Après correction, reproduis la même action et confirme que les autres chaînes fonctionnent. Conserve un journal nettoyé des clés et adresses personnelles.",
      "Change one variable at a time. Draw five boxes: source, publishing, server, network and player. For every incident record time, symptom, last healthy step, hypothesis and test result. Restarting can hide a problem without explaining it.\n\nExercise 1: stop OBS. Wait for the buffer to drain. Check that cinema continues if FFmpeg is running. Exercise 2: change classroom to classroom-typo in VLC, then restore it. Exercise 3: mute only the OBS microphone. Correct picture with silence is distinct from an unreachable server.\n\nInterpretation: connection refused → address, port or service; 401/403 → access; 404 → path, source or expired segment; sound without picture → video track or decoding; buffering → bandwidth, loss, encoder or buffer. These clues guide investigation, not prove a cause alone. CORS concerns browser behavior, not general server permission.\n\nMeasure startup, real-to-played picture delay, stalls and recovery. Test segment requests as well as playlists. After fixing, repeat the action and confirm other channels work. Keep a journal with keys and personal addresses removed.",
      "غيّر عاملًا واحدًا كل مرة. ارسم خمس خانات: المصدر والإرسال والخادم والشبكة والمشغّل. لكل عطل دوّن الوقت والعرض وآخر مرحلة سليمة والفرضية ونتيجة الاختبار. قد تخفي إعادة التشغيل المشكلة دون تفسيرها.\n\nالتمرين الأول: أوقف OBS وانتظر نفاد المخزن المؤقت. تحقق من استمرار cinema إذا بقي FFmpeg يعمل. الثاني: غيّر classroom إلى classroom-typo في VLC ثم أعد المسار الصحيح. الثالث: اكتم الميكروفون فقط في OBS. صورة سليمة بلا صوت مشكلة مختلفة عن تعذر الوصول إلى الخادم.\n\nالتفسير: رفض الاتصال يشير إلى العنوان أو المنفذ أو الخدمة؛ 401/403 إلى الوصول؛ 404 إلى المسار أو المصدر أو مقطع انتهى؛ صوت بلا صورة إلى مسار الفيديو أو فك الترميز؛ تقطّع إلى السعة أو فقد الحزم أو المشفّر أو المخزن. هذه دلائل توجه التحقيق ولا تثبت السبب وحدها. تخص CORS سلوك المتصفح وليست تصريحًا عامًا للخادم.\n\nقس زمن بدء العرض والفرق بين الصورة الحقيقية والمعروضة والتوقفات والتعافي. اختبر طلبات المقاطع والقوائم معًا. بعد الإصلاح أعد الفعل نفسه وتأكد من عمل القنوات الأخرى. احفظ سجلًا خاليًا من المفاتيح والعناوين الشخصية."
    ],
    "code": "Incident | Last healthy stage | Hypothesis | Test | Result\nNo audio | video plays | OBS mic muted | inspect meter | ...\n404 | server responds | wrong path | compare exact URL | ...\nStall | playlist loads | segments failing | inspect requests | ...\n\n# PowerShell, on your lab computer:\nTest-NetConnection 127.0.0.1 -Port 8888\ndocker logs --tail 50 learn-iptv",
    "task": [
      "Provoque et répare trois pannes locales ; documente les preuves.",
      "Create and repair three local failures; document evidence.",
      "أنشئ ثلاثة أعطال محلية وأصلحها مع توثيق الدليل."
    ],
    "result": [
      "Tu peux isoler une panne de source, de chemin et d’audio sans modifier tout le système.",
      "You can isolate source, path and audio failures without changing everything.",
      "تعزل عطل المصدر والمسار والصوت دون تغيير النظام كله."
    ],
    "question": [
      "Quelle démarche permet de comprendre la cause ?",
      "Which approach helps identify the cause?",
      "أي طريقة تساعد على معرفة السبب؟"
    ],
    "options": [
      [
        "Tout changer ensemble",
        "Change everything together",
        "تغيير كل شيء معًا"
      ],
      [
        "Une hypothèse et un test à la fois",
        "One hypothesis and test at a time",
        "فرضية واختبار واحد كل مرة"
      ]
    ],
    "answer": 1,
    "url": "https://mediamtx.org/docs/features/logging",
    "failure": [
      "Si le symptôme persiste, reviens à la dernière étape prouvée saine et teste le maillon suivant.",
      "If the symptom persists, return to the last proven healthy stage and test the next link.",
      "إذا استمر العطل فارجع إلى آخر مرحلة ثبتت سلامتها واختبر المرحلة التالية."
    ]
  },
  {
    "id": "capstone",
    "minutes": 45,
    "title": [
      "Projet final : deux chaînes et un dossier de preuve",
      "Final project: two channels and evidence",
      "المشروع النهائي: قناتان وملف إثبات"
    ],
    "text": [
      "Construis un petit service local avec classroom en direct et cinema à partir de ton fichier. Livrables : schéma de circulation, deux sources décrites, playlist UTF-8, exemple XMLTV daté correctement et fiche de fonctionnement. Le guide peut couvrir une seule chaîne, mais explique explicitement celle qui n’a pas de programme.\n\nProcédure : redémarre le serveur depuis zéro, publie les deux sources, vérifie image et son, importe la playlist et change de chaîne. Arrête un producteur ; confirme que l’autre reste disponible. Relance et mesure la reprise. Aucun résultat ne doit dépendre d’une URL copiée depuis une chaîne payante.\n\nÉvalue-toi sur cinq critères, deux points chacun : architecture expliquée ; deux lectures vérifiées ; catalogue/guide cohérents ; trois pannes diagnostiquées ; calcul de capacité et plan de protection. Un schéma seul vaut un point pour son critère ; une démonstration reproductible avec notes vaut deux. Vise dix, puis recommence le lendemain sans copier les étapes.\n\nEnsuite, passe à la phase application : catalogue, API, lecteur, favoris, guide et tests. Remplace les médias de démonstration uniquement par tes URL autorisées et adapte localhost selon l’appareil. Ce projet prouve des compétences de laboratoire ; une exploitation publique nécessite les validations de déploiement et les droits correspondants.",
      "Build a small local service with live classroom and file-fed cinema. Deliverables: signal diagram, descriptions of both sources, UTF-8 playlist, correctly dated XMLTV example and operating notes. The guide may cover one channel, but explicitly explain the channel without program data.\n\nProcedure: start the server from scratch, publish both sources, check picture and sound, import the playlist and switch channels. Stop one publisher; confirm the other survives. Restart and measure recovery. No result should depend on a URL copied from a paid channel.\n\nScore five criteria, two points each: explained architecture; two verified playbacks; consistent catalog/guide; three diagnosed failures; capacity calculation and protection plan. A design alone earns one point for its criterion; reproducible evidence with notes earns two. Aim for ten, then repeat tomorrow without copying the steps.\n\nNext, take the application phase: catalog, API, player, favorites, guide and tests. Replace demonstration media only with your authorized URLs and adapt localhost for the device. This project demonstrates lab skills; public operation requires deployment validation and the corresponding permissions.",
      "ابنِ خدمة محلية صغيرة فيها classroom مباشر وcinema من ملفك. سلّم مخطط مسار البث ووصف المصدرين وقائمة UTF-8 ومثال XMLTV بتاريخ صحيح وملاحظات تشغيل. يمكن أن يغطي الدليل قناة واحدة لكن وضّح القناة التي لا تملك بيانات برامج.\n\nالإجراء: شغّل الخادم من البداية وانشر المصدرين وتحقق من الصورة والصوت ثم استورد القائمة وبدّل القنوات. أوقف ناشرًا وتأكد من استمرار الآخر. أعد التشغيل وقس زمن التعافي. لا تجعل أي نتيجة تعتمد على رابط منسوخ من قناة مدفوعة.\n\nقيّم نفسك بخمسة معايير لكل منها نقطتان: شرح البنية؛ تشغيل قناتين موثّق؛ تطابق القائمة والدليل؛ تشخيص ثلاثة أعطال؛ حساب السعة وخطة الحماية. التصميم وحده يعطي نقطة للمعيار والدليل القابل لإعادة التطبيق مع الملاحظات يعطي نقطتين. استهدف عشر نقاط ثم أعد التجربة غدًا دون نسخ الخطوات.\n\nبعدها انتقل لمرحلة التطبيق: القائمة وAPI والمشغّل والمفضّلة والدليل والاختبارات. استبدل وسائط العرض بروابطك المأذونة فقط وعدّل localhost بحسب الجهاز. يثبت المشروع مهارات المختبر؛ التشغيل العام يحتاج تحقق النشر والحقوق المناسبة."
    ],
    "code": "Portfolio\n01-signal-map\n02-source-records\n03-channels.m3u\n04-guide.xml\n05-playback-and-recovery-notes\n06-capacity-and-access-plan\n\nPass: reproduce both channels after a clean restart.\nNext: IPTV application workshop → catalog → player → tests.",
    "task": [
      "Présente une démonstration de cinq minutes et ta grille /10.",
      "Present a five-minute demo and your score out of ten.",
      "قدّم عرضًا لخمس دقائق ونتيجة تقييمك من عشر نقاط."
    ],
    "result": [
      "Le projet est réussi lorsque quelqu’un peut reproduire les résultats à partir de tes notes.",
      "The project succeeds when another learner can reproduce results from your notes.",
      "ينجح المشروع عندما يستطيع متعلّم آخر إعادة النتائج باستخدام ملاحظاتك."
    ],
    "question": [
      "Quelle preuve est la plus utile ?",
      "Which evidence is most useful?",
      "أي دليل أكثر فائدة؟"
    ],
    "options": [
      [
        "Une capture du logo",
        "A screenshot of the logo",
        "صورة للشعار"
      ],
      [
        "Un test complet reproductible avec son et reprise",
        "A reproducible end-to-end test with audio and recovery",
        "اختبار كامل قابل للتكرار يشمل الصوت والتعافي"
      ]
    ],
    "answer": 1,
    "url": "https://mediamtx.org/docs/features/basic-usage",
    "failure": [
      "Si une étape dépend d’une action non notée, complète le dossier puis recommence.",
      "If a step depends on an undocumented action, update the notes and repeat.",
      "إذا اعتمدت خطوة على فعل غير موثّق فأكمل الملاحظات وأعد التجربة."
    ]
  }
];
