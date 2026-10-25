import type { IndexModule, Language, Lesson } from '../types/content';
import { iptvAdvancedUnits } from './iptv-advanced';
import { iptvMasteryUnits } from './iptv-mastery';

export type Copy = [string, string, string];
const pick = (copy: Copy, language: Language) => copy[language === 'fr' ? 0 : language === 'en' ? 1 : 2];
export type IptvUnit = { id: string; title: Copy; text: Copy; code: string; task: Copy; result: Copy; question: Copy; options: [Copy, Copy]; answer: number; url: string; hint?: Copy; failure?: Copy; minutes?: number };
const originalUnits: IptvUnit[] = [
  {
    id: 'basics',
    title: ['Comment fonctionne IPTV ?', 'How does IPTV work?', 'كيف يعمل IPTV؟'],
    text: [
      'IPTV transporte la télévision sur un réseau IP. Notre atelier utilise une diffusion HTTP sur Internet, souvent appelée OTT. La caméra produit les images, OBS les compresse, MediaMTX reçoit le flux et prépare HLS, puis le lecteur télécharge et décode les segments. Une playlist M3U est une liste de chaînes ; une playlist HLS M3U8 décrit les médias. Aucune ne crée une source vidéo. Le direct continue même quand un spectateur ferme son lecteur ; la VOD commence au moment choisi. Utilise ta caméra ou un signal que tu es autorisé à retransmettre.',
      'IPTV carries television over an IP network. This workshop uses HTTP delivery over the Internet, often called OTT. A camera captures pictures, OBS encodes them, MediaMTX receives the stream and packages HLS, and a player downloads and decodes segments. A channel M3U lists channels; an HLS M3U8 describes media. Neither creates a video source. Live production continues when a viewer closes their player; VOD starts when the viewer chooses. Use your camera or a feed you are authorized to redistribute.',
      'ينقل IPTV التلفزيون عبر شبكة IP. تستخدم هذه الورشة البث عبر HTTP على الإنترنت ويسمى غالبًا OTT. تلتقط الكاميرا الصورة ويضغطها OBS، ثم يستقبل MediaMTX البث ويجهّزه بصيغة HLS ويحمّل المشغّل المقاطع ويفك ترميزها. قائمة M3U تجمع القنوات بينما تصف M3U8 الخاصة بـ HLS الوسائط؛ لا تنشئ أي منهما مصدر فيديو. يستمر إنتاج البث المباشر عند إغلاق المشاهد للمشغّل، أما الفيديو حسب الطلب فيبدأ حين يختاره. استخدم كاميرتك أو مصدرًا لديك إذن بإعادة بثه.',
    ],
    code: 'Camera / microphone\n  -> OBS (H.264 video + AAC audio)\n  -> RTMP ingest :1935\n  -> MediaMTX\n  -> HLS over HTTP :8888\n  -> browser / VLC',
    task: ['Dessine le trajet et indique où la vidéo est compressée.', 'Draw the signal path and mark where video is compressed.', 'ارسم مسار البث وحدد أين يتم ضغط الفيديو.'],
    result: ['OBS encode ; MediaMTX distribue ; le lecteur décode. Une URL seule ne fournit aucune chaîne.', 'OBS encodes, MediaMTX distributes, and the player decodes. A URL alone supplies no channels.', 'يضغط OBS الفيديو ويوزعه MediaMTX ويفك المشغّل ترميزه. الرابط وحده لا يوفر قنوات.'],
    question: ['Quel outil encode la caméra ici ?', 'Which tool encodes the camera here?', 'أي أداة تضغط بث الكاميرا هنا؟'],
    options: [['OBS', 'OBS', 'OBS'], ['La playlist', 'The playlist', 'قائمة التشغيل']], answer: 0,
    url: 'https://mediamtx.org/docs/kickoff/introduction',
  },
  {
    id: 'unauthorized-ecosystem',
    title: ['D’où viennent les chaînes pirates ?', 'Where do unauthorized channels come from?', 'من أين تأتي القنوات المقرصنة؟'],
    text: [
      'Il faut distinguer accès et redistribution. Un service non autorisé peut reprendre un signal normalement destiné à un abonné, retransmettre un flux reçu sans droits de distribution, ou acheter un accès en gros à un autre opérateur pirate. Certains cas impliquent des comptes compromis ou le contournement de protections. Ce sont des catégories explicatives, pas une méthode pour extraire des flux.\n\nLe fournisseur amont obtient le contenu, un agrégateur rassemble des chaînes, un opérateur distribue les flux et un revendeur vend des comptes. Une boutique peut donc vendre des milliers de chaînes sans posséder les sources ni les machines. Les enquêtes Europol documentent des réseaux de revendeurs et de serveurs ; cela ne signifie pas que chaque service suit exactement ce modèle.\n\nUn panneau de gestion organise utilisateurs, dates d’expiration et connexions. Il ne crée ni chaînes ni droits. Une liste M3U contient des références aux flux, pas la preuve de leur origine. Si plusieurs revendeurs dépendent du même fournisseur, sa panne peut couper leurs offres simultanément. Une interface soignée, un test gratuit ou une facture ne prouvent pas les droits de diffusion.',
      'Access and redistribution are different. An unauthorized service may recapture a signal intended for an individual subscriber, relay a feed without distribution rights, or buy wholesale access from another pirate operator. Some cases involve compromised accounts or bypassed protections. These are explanatory categories, not a method for extracting feeds.\n\nAn upstream supplier obtains content, an aggregator combines channels, an operator distributes streams, and a reseller sells accounts. A shop can therefore advertise thousands of channels without owning the sources or machines. Europol investigations document reseller and server networks; not every service follows exactly this model.\n\nA management panel organizes users, expiry dates and connections. It creates neither channels nor rights. An M3U list references streams without proving their origin. If many resellers depend on one upstream supplier, that supplier’s outage can interrupt all of them. A polished interface, free trial or invoice does not establish distribution rights.',
      'يجب التمييز بين الوصول وإعادة التوزيع. قد تعيد خدمة غير مرخّصة التقاط إشارة مخصّصة لمشترك فردي، أو تمرّر بثًا دون حقوق توزيعه، أو تشتري وصولًا بالجملة من مشغّل مقرصن آخر. تتضمن بعض الحالات حسابات مخترقة أو تجاوز وسائل الحماية. هذه فئات لشرح الظاهرة وليست طريقة لاستخراج البث.\n\nيحصل المورّد الأصلي على المحتوى ويجمع المجمّع القنوات ويوزع المشغّل البث ويبيع الموزّع الحسابات. لذلك قد يعلن متجر عن آلاف القنوات دون امتلاك مصادرها أو أجهزتها. وثّقت تحقيقات Europol شبكات موزّعين وخوادم؛ ولا يعني ذلك أن كل خدمة تستخدم النموذج نفسه.\n\nتنظم لوحة الإدارة المستخدمين وتواريخ الانتهاء والاتصالات لكنها لا تنشئ قنوات أو حقوقًا. تشير قائمة M3U إلى روابط البث دون إثبات مصدرها. إذا اعتمد عدة موزّعين على مورّد واحد فقد تتوقف عروضهم معًا عند تعطله. الواجهة الجميلة أو التجربة المجانية أو الفاتورة لا تثبت حقوق إعادة البث.',
    ],
    code: 'Source -> Aggregator -> Distribution -> Reseller -> Viewer\n\nContent rights: who may redistribute?\nHosting: who runs the machines?\nAccounts: who controls access?\nThese are separate roles.',
    task: ['Dessine les rôles et explique pourquoi dix boutiques peuvent partager une seule source.', 'Map the roles and explain why ten shops might share one source.', 'ارسم الأدوار واشرح لماذا قد تعتمد عشرة متاجر على مصدر واحد.'],
    result: ['Un revendeur peut vendre des comptes sans contrôler la source. L’accès technique ne prouve pas l’autorisation.', 'A reseller may sell accounts without controlling the source. Technical access does not prove permission.', 'قد يبيع الموزّع حسابات دون التحكم في المصدر. الوصول التقني لا يثبت الإذن.'],
    question: ['Que prouve une playlist qui fonctionne ?', 'What does a working playlist prove?', 'ماذا تثبت قائمة تشغيل تعمل؟'],
    options: [['Le droit de revendre', 'The right to resell', 'حق إعادة البيع'], ['La disponibilité technique à cet instant', 'Technical availability at that moment', 'الإتاحة التقنية في تلك اللحظة']], answer: 1,
    url: 'https://www.europol.europa.eu/media-press/newsroom/news/european-law-enforcement-stops-illegal-iptv-service-providers',
  },
  {
    id: 'channel-rights', title: ['Obtenir des sources autorisées', 'Obtain authorized channel sources', 'احصل على مصادر قنوات مرخّصة'],
    text: [
      'Pour ton projet, commence par une caméra ou des créations dont tu contrôles les droits. Pour ajouter une chaîne tierce, contacte son service de distribution ou un distributeur habilité. Demande une autorisation écrite couvrant ton service ; un abonnement de visionnage personnel ne suffit généralement pas. Une chaîne gratuite à regarder n’est pas automatiquement libre à retransmettre.\n\nPrépare une fiche par chaîne : titulaire des droits, territoires, durée, appareils, direct, replay, enregistrement, publicité et nombre de spectateurs. Fais confirmer les conditions applicables à ton projet. Vérifie aussi les droits sur les logos, les programmes et le guide EPG. Les règles exactes dépendent des contrats et du pays.\n\nAprès accord, le fournisseur fournit le point de livraison autorisé, les paramètres techniques et un contact de support. Conserve les identifiants côté serveur, vérifie audio et vidéo et documente la date d’expiration. Pour un exercice, utilise uniquement la chaîne classroom créée dans ce cours : aucune URL publique trouvée au hasard n’est nécessaire.',
      'Start with your camera or productions whose rights you control. To add a third-party channel, contact its distribution team or an authorized distributor. Request written permission covering your service; a personal viewing subscription generally does not suffice. Free to watch does not automatically mean free to retransmit.\n\nPrepare a channel record: rights holder, territories, term, devices, live viewing, catch-up, recording, advertising and audience limits. Have the applicable terms confirmed for your project. Check permissions for logos, programs and EPG data too. Exact requirements depend on contracts and jurisdiction.\n\nAfter agreement, the supplier provides an authorized delivery endpoint, technical specifications and support contact. Keep credentials on the server, check sound and picture, and record expiry dates. For practice, use only the classroom channel created in this course; you do not need random public stream URLs.',
      'ابدأ بكاميرتك أو إنتاج تتحكم في حقوقه. لإضافة قناة خارجية تواصل مع قسم توزيعها أو موزّع معتمد واطلب إذنًا مكتوبًا يشمل خدمتك؛ اشتراك المشاهدة الفردي لا يكفي عادة. إتاحة القناة للمشاهدة مجانًا لا تعني السماح بإعادة بثها تلقائيًا.\n\nجهّز سجلًا لكل قناة: صاحب الحقوق والدول المسموح بها والمدة والأجهزة والبث المباشر والإعادة والتسجيل والإعلانات وحدود المشاهدين. اطلب تأكيد الشروط المناسبة لمشروعك وتحقق من حقوق الشعارات والبرامج وبيانات EPG. تعتمد المتطلبات الدقيقة على العقود والبلد.\n\nبعد الاتفاق يزوّدك المورّد بنقطة استقبال معتمدة ومواصفات تقنية وجهة دعم. احتفظ ببيانات الدخول على الخادم وتحقق من الصوت والصورة وسجّل انتهاء الإذن. للتدريب استخدم قناة classroom التي أنشأناها؛ لا تحتاج روابط بث عشوائية من الإنترنت.',
    ],
    code: 'Channel: Classroom\nSource: My camera\nVideo/audio rights: Confirmed by the creator\nTerritory: Defined before publication\nLive / recording / replay: Decide separately\nExpiry and support contact: Record before launch',
    task: ['Rédige une demande de distribution avec territoire, public et fonctionnalités, sans acheter de flux.', 'Draft a distribution request specifying territory, audience and features, without purchasing feeds.', 'اكتب طلب توزيع يحدد الدول والجمهور والميزات دون شراء أي بث.'],
    result: ['La demande distingue visionnage, redistribution et replay ; les droits précèdent l’intégration.', 'The request distinguishes viewing, redistribution and replay; rights are established before integration.', 'يميّز الطلب بين المشاهدة وإعادة التوزيع والإعادة؛ نحدد الحقوق قبل الربط التقني.'],
    question: ['Gratuit à regarder signifie-t-il libre à redistribuer ?', 'Does free viewing mean unrestricted redistribution?', 'هل المشاهدة المجانية تعني حرية إعادة التوزيع؟'],
    options: [['Oui', 'Yes', 'نعم'], ['Non, vérifier les droits', 'No, check the rights', 'لا، يجب التحقق من الحقوق']], answer: 1,
    url: 'https://www.eurojust.europa.eu/sites/default/files/assets/eurojust-iptv-flyer.pdf',
  },
  {
    id: 'hosting', title: ['Serveurs, hébergement et coûts', 'Servers, hosting and costs', 'الخوادم والاستضافة والتكاليف'],
    text: [
      'Un « serveur IPTV » est un rôle logiciel sur une machine, pas une machine qui contient toutes les chaînes. Les infrastructures peuvent utiliser des serveurs loués dans des centres de données, des machines dédiées ou du cloud. Les réseaux illégaux utilisent aussi des hébergements répartis entre pays, comme le montrent des enquêtes Europol ; le pays du serveur ne fournit pas les droits sur les programmes.\n\nPour ton service autorisé, sépare réception, transcodage, origine HLS, distribution CDN et gestion des comptes. Un VPS partage des ressources physiques ; une machine dédiée offre plus de contrôle ; le cloud facture souvent calcul et trafic séparément. Le transcodage consomme CPU ou GPU, tandis que servir des segments consomme surtout réseau et entrées/sorties. Mesure avant de choisir une taille.\n\nDemande au fournisseur : débit garanti ou partagé, trafic inclus, dépassements, usage streaming permis, localisation, protection réseau et support. Pour un laboratoire public limité, prévois Linux, SSH par clé, pare-feu, HTTPS, secrets hors du dépôt et restriction des producteurs. Publie uniquement les ports nécessaires ; garde administration et base de données privées. Vérifie refus d’accès, redémarrage et restauration avant ouverture.\n\nÀ 4 Mbit/s par spectateur et 100 spectateurs simultanés, il faut environ 400 Mbit/s avant marge. Sur deux heures, cela représente environ 360 Go décimaux de trafic sortant. Ce n’est pas un prix : le devis dépend du fournisseur, du CDN et de l’usage. Multiplier les serveurs ne répare pas une source instable.',
      'An “IPTV server” is a software role on a machine, not a machine containing every channel. Infrastructure can use rented data-center servers, dedicated machines or cloud instances. Illegal networks also use hosting across countries, as Europol investigations show; server location does not grant program rights.\n\nFor your authorized service, separate ingest, transcoding, HLS origin, CDN delivery and account management. A VPS shares physical resources; a dedicated machine offers more control; cloud services often charge separately for compute and traffic. Transcoding consumes CPU or GPU, while segment delivery mainly uses network and I/O. Measure before sizing.\n\nAsk providers about guaranteed versus shared throughput, included transfer, overages, permitted streaming use, location, network protection and support. A limited public lab needs Linux, key-based SSH, a firewall, HTTPS, secrets outside the repository and restricted publishers. Expose only necessary ports; keep administration and databases private. Verify denied access, restart and restore before opening access.\n\nAt 4 Mbps per viewer and 100 simultaneous viewers, plan for about 400 Mbps before headroom. Two hours represents about 360 decimal GB of outbound transfer. This is not a price: quotes depend on provider, CDN and usage. Adding servers cannot fix an unstable source.',
      '«خادم IPTV» دور برمجي على جهاز وليس جهازًا يحتوي جميع القنوات. يمكن استخدام خوادم مستأجرة في مراكز بيانات أو أجهزة مخصصة أو خدمات سحابية. تستخدم شبكات غير قانونية أيضًا استضافة موزعة بين دول كما توضح تحقيقات Europol؛ موقع الخادم لا يمنح حقوق البرامج.\n\nافصل في خدمتك المرخّصة بين استقبال البث وإعادة الترميز وخادم HLS الأصلي وتوزيع CDN وإدارة الحسابات. يشارك VPS موارد جهاز فعلي، ويمنح الخادم المخصص تحكمًا أكبر، وغالبًا تُحاسب السحابة على الحوسبة والمرور منفصلين. يستهلك الترميز CPU أو GPU بينما يستهلك توزيع المقاطع الشبكة وعمليات الإدخال والإخراج. قس الأداء قبل اختيار الحجم.\n\nاسأل المستضيف عن سرعة الاتصال المضمونة أو المشتركة وحجم النقل المشمول ورسوم التجاوز والسماح بالبث والموقع والحماية والدعم. جهّز Linux ودخول SSH بمفتاح وجدارًا ناريًا وHTTPS وأسرارًا خارج المستودع وصلاحيات للناشرين. افتح المنافذ اللازمة فقط وأبقِ الإدارة وقاعدة البيانات خاصة. اختبر رفض الدخول وإعادة التشغيل والاستعادة قبل إتاحة الخدمة.\n\nعند 4 ميغابت في الثانية للمشاهد و100 مشاهد متزامن تحتاج نحو 400 ميغابت في الثانية قبل الهامش. تعادل ساعتان نحو 360 غيغابايت عشرية من الإرسال. هذا ليس سعرًا؛ يعتمد العرض على المستضيف وCDN والاستخدام. زيادة الخوادم لا تصلح مصدر بث غير مستقر.',
    ],
    code: 'const bitrateMbps = 4;\nconst viewers = 100;\nconst hours = 2;\nconst egressMbps = bitrateMbps * viewers;\nconst transferGB = egressMbps * 1e6 * hours * 3600 / 8 / 1e9;\nconsole.log({ egressMbps, transferGB }); // 400 Mbps, 360 GB',
    task: ['Calcule pour 25 spectateurs pendant 4 heures et prépare une fiche de besoins pour un hébergeur.', 'Calculate for 25 viewers over 4 hours and prepare a hosting requirements sheet.', 'احسب لـ 25 مشاهدًا خلال 4 ساعات وجهّز ورقة متطلبات للاستضافة.'],
    result: ['100 Mbit/s et 180 Go avant marge ; ajoute calcul, stockage et droits au budget.', '100 Mbps and 180 GB before headroom; budget separately for compute, storage and rights.', '100 ميغابت في الثانية و180 غيغابايت قبل الهامش؛ أضف الحوسبة والتخزين والحقوق إلى الميزانية.'],
    question: ['Le débit du port suffit-il pour estimer le coût ?', 'Is port speed enough to estimate cost?', 'هل تكفي سرعة المنفذ لتقدير التكلفة؟'],
    options: [['Oui', 'Yes', 'نعم'], ['Non, il faut aussi le volume et les ressources', 'No, transfer volume and resources also matter', 'لا، نحتاج أيضًا حجم النقل والموارد']], answer: 1,
    url: 'https://www.europol.europa.eu/media-press/newsroom/news/spanish-network-behind-illegal-distribution-of-pay-tv-channels-dismantled',
  },
  {
    id: 'server', title: ['Démarrer ton serveur', 'Start your streaming server', 'شغّل خادم البث الخاص بك'],
    text: [
      'Sur ton ordinateur, installe Docker et démarre son moteur. Dans PowerShell ou un terminal, lance la commande ci-dessous. Elle utilise une version précise de MediaMTX et expose uniquement RTMP et HLS sur localhost. Garde ce terminal ouvert. Le serveur attend une source : une page vidéo vide avant publication est normale. Ce laboratoire reste sur ton ordinateur ; localhost sur un téléphone désigne le téléphone. Ctrl+C arrête le conteneur, et --rm le supprime après arrêt ; aucun enregistrement vidéo persistant n’est configuré.',
      'Install Docker on your computer and start its engine. Run the command below in PowerShell or a terminal. It pins a MediaMTX release and exposes only RTMP and HLS on localhost. Keep this terminal open. The server needs a publisher: an empty video page before publishing is expected. This lab stays on your computer; localhost on a phone means the phone itself. Ctrl+C stops the container, and --rm removes it after stopping; persistent video recording is not configured.',
      'ثبّت Docker على الحاسوب وشغّل محركه ثم نفّذ الأمر التالي في PowerShell أو الطرفية. يستخدم إصدارًا محددًا من MediaMTX ويتيح RTMP وHLS على localhost فقط. اترك الطرفية مفتوحة. ينتظر الخادم مصدر بث؛ عدم ظهور فيديو قبل النشر أمر طبيعي. هذا المختبر محلي؛ localhost على الهاتف يعني الهاتف نفسه. يوقف Ctrl+C الحاوية وتحذفها --rm بعد الإيقاف؛ لم نضبط تسجيلًا دائمًا للفيديو.',
    ],
    code: 'docker run --rm -it --name learn-iptv -p 127.0.0.1:1935:1935 -p 127.0.0.1:8888:8888 bluenviron/mediamtx:1.21.1',
    task: ['Lance le serveur et repère les lignes RTMP et HLS dans les logs.', 'Start the server and find the RTMP and HLS listener messages.', 'شغّل الخادم وابحث في السجل عن رسائل تشغيل RTMP وHLS.'],
    result: ['Les ports 1935 et 8888 écoutent. Si un port est occupé, arrête ton ancien conteneur avant de réessayer.', 'Ports 1935 and 8888 are listening. If a port is busy, stop your previous container before retrying.', 'يستمع الخادم على 1935 و8888. إذا كان المنفذ مشغولًا فأوقف حاويتك السابقة ثم أعد المحاولة.'],
    question: ['Pourquoi aucune vidéo avant OBS ?', 'Why is there no video before OBS?', 'لماذا لا يوجد فيديو قبل تشغيل OBS؟'],
    options: [['Il manque la source', 'There is no publisher yet', 'لا يوجد مصدر يبث بعد'], ['Docker fournit des chaînes', 'Docker supplies channels', 'Docker يوفر قنوات']], answer: 0,
    url: 'https://mediamtx.org/docs/kickoff/install',
  },
  {
    id: 'broadcast', title: ['Diffuser en direct avec OBS', 'Broadcast live with OBS', 'ابث مباشرة باستخدام OBS'],
    text: [
      'Installe OBS Studio depuis obsproject.com. Crée une scène, ajoute ta webcam et un microphone, puis vérifie l’aperçu et le niveau audio. Dans Paramètres > Sortie, choisis H.264 et AAC, 1280×720 à 30 images/s et un intervalle d’images clés de 2 secondes pour commencer. Dans Stream, choisis un service personnalisé et les valeurs ci-dessous. Démarre le streaming, puis ouvre la page HLS dans ton navigateur et clique sur lecture. Bouge la main pour vérifier une vraie source live. Arrêter OBS interrompt le flux après le tampon du lecteur.',
      'Install OBS Studio from obsproject.com. Create a scene, add your webcam and microphone, and check the preview and audio meter. In Settings > Output, start with H.264 video and AAC audio, 1280×720 at 30 fps, and a 2-second keyframe interval. In Stream, select a custom service and enter the settings below. Start streaming, then open the HLS page in your browser and press Play. Wave your hand to verify live input. Stopping OBS interrupts playback after the player buffer drains.',
      'ثبّت OBS Studio من obsproject.com. أنشئ مشهدًا وأضف كاميرتك والميكروفون وتحقق من المعاينة ومؤشر الصوت. ابدأ بإعدادات H.264 للفيديو وAAC للصوت ودقة 1280×720 بمعدل 30 إطارًا في الثانية وفاصل إطار رئيسي ثانيتين. في إعدادات Stream اختر خدمة مخصصة وأدخل القيم التالية. ابدأ البث وافتح صفحة HLS في المتصفح واضغط تشغيل. حرّك يدك للتحقق من البث الحي. عند إيقاف OBS يتوقف التشغيل بعد نفاد المخزن المؤقت.',
    ],
    code: 'Service: Custom\nServer: rtmp://localhost:1935/classroom\nStream key: (leave empty)\n\nBrowser: http://localhost:8888/classroom\nVLC: http://localhost:8888/classroom/index.m3u8',
    task: ['Diffuse 60 secondes, vérifie image et son, puis arrête et relance OBS.', 'Broadcast for 60 seconds, verify picture and sound, then stop and restart OBS.', 'ابث لمدة 60 ثانية وتحقق من الصورة والصوت ثم أوقف OBS وأعد تشغيله.'],
    result: ['Le navigateur affiche ta caméra avec un décalage. Le nom classroom doit être identique à la publication et à la lecture.', 'The browser shows your camera with some delay. The classroom path must match for publishing and viewing.', 'يعرض المتصفح كاميرتك مع تأخير بسيط. يجب أن يتطابق اسم classroom في رابط الإرسال والمشاهدة.'],
    question: ['Que fait Stop Streaming ?', 'What does Stop Streaming do?', 'ماذا يفعل إيقاف البث؟'],
    options: [['Arrête la source live', 'Stops the live publisher', 'يوقف مصدر البث المباشر'], ['Crée une VOD automatiquement', 'Automatically creates VOD', 'ينشئ فيديو حسب الطلب تلقائيًا']], answer: 0,
    url: 'https://mediamtx.org/docs/publish/obs-studio',
  },
  {
    id: 'channels', title: ['Lire et organiser les chaînes', 'Play and organize channels', 'شغّل القنوات ونظّمها'],
    text: [
      'Dans VLC, ouvre Média > Ouvrir un flux réseau et colle l’adresse HLS. Pour un catalogue, enregistre le texte ci-dessous dans classroom.m3u et ouvre ce fichier dans VLC. EXTINF porte le nom affiché ; la ligne suivante est le flux. Ajouter une deuxième entrée ne crée pas une deuxième émission : elle nécessite son propre producteur et son propre chemin. Un guide EPG contient des horaires et identifiants de chaînes, pas des images. Pour une interface web, le parcours application IPTV existant apprend le catalogue et hls.js ; commence par valider la page intégrée du serveur.',
      'In VLC, use Media > Open Network Stream with the HLS address. For a channel list, save the text below as classroom.m3u and open it in VLC. EXTINF gives the display name; the following line is the stream. A second entry does not create another broadcast: it needs its own publisher and path. An EPG holds program times and channel IDs, not video. The existing IPTV application workshop teaches a catalog and hls.js web player; validate the built-in server player first.',
      'في VLC اختر فتح بث شبكي وأدخل عنوان HLS. لإنشاء قائمة قنوات احفظ النص التالي باسم classroom.m3u وافتحه في VLC. يحدد EXTINF الاسم الظاهر ويليه رابط البث. إضافة سطر لقناة ثانية لا تنشئ بثًا جديدًا؛ تحتاج مصدرًا ومسارًا خاصين بها. يحتوي دليل EPG مواعيد البرامج ومعرّفات القنوات وليس الفيديو. تعلّمك ورشة تطبيق IPTV الحالية بناء قائمة ومشغّل ويب باستخدام hls.js؛ تحقق أولًا من مشغّل الخادم المدمج.',
    ],
    code: '#EXTM3U\n#EXTINF:-1 tvg-id="classroom",My classroom LIVE\nhttp://localhost:8888/classroom/index.m3u8',
    task: ['Ouvre le fichier dans VLC pendant la diffusion et modifie le nom affiché.', 'Open the file in VLC while broadcasting and change its display name.', 'افتح الملف في VLC أثناء البث ثم غيّر اسم القناة الظاهر.'],
    result: ['Le nom change sans changer le chemin du flux. Ce fichier local n’est pas une liste de chaînes commerciales.', 'The label changes without changing the stream path. This local file is not a commercial channel list.', 'يتغير الاسم دون تغيير مسار البث. هذا الملف المحلي ليس قائمة قنوات تجارية.'],
    question: ['Le guide EPG transporte-t-il la vidéo ?', 'Does an EPG carry video?', 'هل ينقل EPG الفيديو؟'],
    options: [['Oui', 'Yes', 'نعم'], ['Non, il décrit les programmes', 'No, it describes programs', 'لا، بل يصف البرامج']], answer: 1,
    url: 'https://mediamtx.org/docs/read/hls',
  },
  {
    id: 'diagnose', title: ['Diagnostiquer ton direct', 'Troubleshoot your live stream', 'شخّص مشاكل البث المباشر'],
    text: [
      'Teste chaque maillon séparément. Si OBS ne se connecte pas, vérifie le conteneur, le port 1935 et le chemin. Si HLS renvoie 404, confirme que classroom est publié et attends la création des segments. Une réponse 200 ne prouve ni le son ni la fluidité : écoute et regarde. Une image noire peut venir de la source ou du codec. Pour un futur lecteur hébergé, contrôle aussi HTTPS, CORS et les segments. Mesure le décalage avec une horloge filmée. Augmenter le tampon réduit certaines coupures mais augmente le retard.',
      'Test each link separately. If OBS cannot connect, check the container, port 1935 and path. If HLS returns 404, confirm classroom is being published and allow time for segments. A 200 response proves neither sound nor smooth playback: watch and listen. A black picture can come from the input or codec. For a future hosted player, also check HTTPS, CORS and segment requests. Measure delay by filming a clock. A larger buffer can reduce interruptions while increasing latency.',
      'اختبر كل مرحلة منفصلة. إذا تعذر اتصال OBS فتحقق من الحاوية والمنفذ 1935 والمسار. إذا أعاد HLS حالة 404 فتأكد من نشر classroom وانتظر توليد المقاطع. استجابة 200 لا تثبت جودة الصوت أو سلاسة الصورة؛ شاهد واستمع. قد تنتج الشاشة السوداء عن المصدر أو الترميز. عند استضافة مشغّل لاحقًا تحقق أيضًا من HTTPS وCORS وطلبات المقاطع. قس التأخير بتصوير ساعة؛ زيادة المخزن قد تقلل التقطّع لكنها تزيد التأخير.',
    ],
    code: 'docker logs --tail 50 learn-iptv\n# Windows PowerShell\nInvoke-WebRequest http://localhost:8888/classroom/index.m3u8\n# macOS / Linux\ncurl -i http://localhost:8888/classroom/index.m3u8',
    task: ['Note le retard, coupe OBS, observe l’erreur, relance-le et vérifie la reprise.', 'Record latency, stop OBS, observe the failure, restart and check recovery.', 'دوّن التأخير وأوقف OBS وراقب الخطأ ثم أعد تشغيله وتحقق من التعافي.'],
    result: ['Tu peux distinguer panne de source, réseau et lecteur avec des observations.', 'You can distinguish source, network and player failures using observations.', 'يمكنك التمييز بين عطل المصدر والشبكة والمشغّل بناءً على الملاحظات.'],
    question: ['Un statut 200 prouve-t-il la qualité audio ?', 'Does status 200 prove audio quality?', 'هل تثبت حالة 200 جودة الصوت؟'],
    options: [['Oui', 'Yes', 'نعم'], ['Non, il faut écouter', 'No, listen to playback', 'لا، يجب الاستماع للتشغيل']], answer: 1,
    url: 'https://mediamtx.org/docs/features/logging',
  },
  {
    id: 'operations', title: ['Préparer un service fiable', 'Prepare a reliable service', 'جهّز خدمة بث موثوقة'],
    text: [
      'Le laboratoire local n’est pas une configuration publique. Pour servir des spectateurs distants, prévois une machine permanente, un domaine HTTPS, un proxy pour HLS, un pare-feu et une authentification séparée pour publier et regarder. Autorise uniquement les producteurs attendus et teste le refus sans identifiants. Conserve les secrets sur le serveur. Pour une chaîne 24/7, prévois une source continue, une mire de secours, le redémarrage du service et des alertes. Estime le débit : débit vidéo+audio multiplié par spectateurs simultanés, avec une marge. Un CDN peut distribuer HLS ; il ne crée pas plusieurs qualités, qui nécessitent un encodage adapté.',
      'The local lab is not a public deployment configuration. Remote viewers need an always-on host, HTTPS domain, HLS proxy, firewall, and separate publish/read authorization. Allow only expected publishers and test rejection without credentials. Keep secrets on the server. A 24/7 channel needs continuous input, a fallback slate, service restart and alerts. Estimate egress as video+audio bitrate times simultaneous viewers, with headroom. A CDN can distribute HLS; multiple quality levels still require suitable encoding.',
      'المختبر المحلي ليس إعدادًا للنشر العام. لخدمة مشاهدين عن بُعد تحتاج جهازًا دائم التشغيل ونطاق HTTPS ووكيلًا لـ HLS وجدارًا ناريًا وصلاحيات منفصلة للبث والمشاهدة. اسمح للناشرين المحددين فقط واختبر رفض الطلبات دون بيانات دخول. احتفظ بالأسرار على الخادم. تحتاج قناة تعمل طوال اليوم مصدرًا مستمرًا وشاشة احتياطية وإعادة تشغيل للخدمة وتنبيهات. قدّر سعة الإرسال بضرب معدل الفيديو والصوت في عدد المشاهدين المتزامنين مع هامش إضافي. توزع CDN البث لكن تعدد الجودات يحتاج ترميزًا مناسبًا.',
    ],
    code: 'const videoMbps = 3;\nconst audioMbps = 0.128;\nconst viewers = 20;\nconst minimumMbps = (videoMbps + audioMbps) * viewers;\nconsole.log(minimumMbps); // 62.56 Mbps, before overhead',
    task: ['Calcule pour 50 spectateurs et écris un plan : accès, HTTPS, reprise et supervision. Ne publie pas le laboratoire tel quel.', 'Calculate for 50 viewers and write an access, HTTPS, recovery and monitoring plan. Do not expose the lab unchanged.', 'احسب لـ 50 مشاهدًا واكتب خطة للصلاحيات وHTTPS والتعافي والمراقبة. لا تنشر إعداد المختبر كما هو.'],
    result: ['156,4 Mbit/s avant marge. Le déploiement reste une étape distincte à configurer et valider.', '156.4 Mbps before headroom. Deployment remains a separate configuration and validation step.', '156.4 ميغابت في الثانية قبل الهامش. النشر مرحلة منفصلة تحتاج إعدادًا وتحققًا.'],
    question: ['Où tourne un encodeur permanent ?', 'Where does a continuous encoder run?', 'أين يعمل مشفّر البث المستمر؟'],
    options: [['Une machine ou un service permanent', 'An always-on host or service', 'جهاز أو خدمة دائمة التشغيل'], ['Une fonction web brève', 'A short-lived web function', 'دالة ويب قصيرة العمر']], answer: 0,
    url: 'https://mediamtx.org/docs/features/authentication',
  },
];

export const iptvLivePhases = [
  ['basics', 'learning-map', 'signal-chain', 'unauthorized-ecosystem', 'source-to-server', 'channel-rights'],
  ['network', 'protocols', 'encoding', 'hosting'],
  ['server', 'broadcast', 'channels'],
  ['file-channel', 'two-channel-lab', 'ingest', 'hls-inspection', 'epg', 'apps'],
  ['access', 'drm', 'abr', 'recording'],
  ['diagnose', 'troubleshooting-lab', 'operations', 'capacity-worked-example', 'deployment', 'runbook', 'capstone'],
] as const;
const allUnits = [...originalUnits, ...iptvAdvancedUnits, ...iptvMasteryUnits];
const units = iptvLivePhases.flat().map(id => {
  const unit = allUnits.find(item => item.id === id);
  if (!unit) throw new Error(`Missing IPTV lesson: ${id}`);
  return unit;
});
const title: Copy = ['IPTV : serveur et télévision en direct', 'IPTV & Live TV Server', 'IPTV: الخادم والتلفزيون المباشر'];
const summary: Copy = ['Sources, piratage, droits, serveurs et coûts : comprendre puis construire une chaîne autorisée.', 'Sources, piracy, rights, servers and costs: understand the ecosystem and build an authorized channel.', 'المصادر والقرصنة والحقوق والخوادم والتكاليف: افهم المنظومة وابنِ قناة مرخّصة.'];
export const iptvLiveIndex: IndexModule = {
  id: 'iptv-live-server', kind: 'course',
  title: { fr: title[0], en: title[1], ar: title[2] },
  summary: { fr: summary[0], en: summary[1], ar: summary[2] },
  lessons: units.map(unit => ({
    id: `iptv-live-${unit.id}`, title: { fr: unit.title[0], en: unit.title[1], ar: unit.title[2] }, minutes: unit.minutes ?? 25, difficulty: 2,
    search: { fr: `${unit.title[0]} ${unit.text[0]}`, en: `${unit.title[1]} ${unit.text[1]}`, ar: `${unit.title[2]} ${unit.text[2]}` },
  })),
};
export function getIptvLiveLesson(id: string, language: Language): Lesson | undefined {
  const position = units.findIndex(unit => `iptv-live-${unit.id}` === id);
  if (position < 0) return undefined;
  const unit = units[position];
  if (!unit) return undefined;
  const next = units[position + 1];
  return {
    id, moduleId: iptvLiveIndex.id, language, title: pick(unit.title, language), subtitle: pick(unit.task, language),
    estimatedMinutes: unit.minutes ?? 25, difficulty: 2, source: iptvMasteryUnits.includes(unit) ? 'lecomax-learning-app/data/iptv-mastery.ts' : iptvAdvancedUnits.includes(unit) ? 'lecomax-learning-app/data/iptv-advanced.ts' : 'lecomax-learning-app/data/iptv-live.ts',
    relatedFiles: [], relatedRoutes: [], realProjectExample: [], tags: ['IPTV', 'HLS', 'OBS', 'MediaMTX', 'live'],
    concept: pick(unit.title, language),
    explanation: [
      { title: pick(['Objectif pratique', 'Practical objective', 'الهدف العملي'], language), text: pick(unit.task, language) },
      ...pick(unit.text, language).split('\n\n').map(text => ({ text })),
      { title: pick(['Résultat à vérifier', 'Result to verify', 'النتيجة التي يجب التحقق منها'], language), text: pick(unit.result, language) },
      ...(unit.failure ? [{ title: pick(['Si cela ne fonctionne pas', 'If it does not work', 'إذا لم يعمل التطبيق'], language), text: pick(unit.failure, language) }] : []),
      { title: pick(['Sources et documentation', 'Sources and documentation', 'المصادر والمراجع'], language), text: unit.url },
    ],
    codeExample: [{ filename: unit.id === 'channels' ? 'classroom.m3u' : 'Lab', code: unit.code }],
    exercise: { task: pick(unit.task, language), hints: [pick(unit.hint ?? ['Sépare les étapes et compare tes observations aux explications. Note les erreurs exactes.', 'Separate the steps and compare observations with the explanation. Record exact errors.', 'افصل الخطوات وقارن ملاحظاتك بالشرح ودوّن الأخطاء بدقة.'], language)], solution: pick(unit.result, language) },
    quiz: [{ id: 'check', question: pick(unit.question, language), options: unit.options.map(option => pick(option, language)), correctIndex: unit.answer, explanation: pick(unit.result, language) }],
    summary: [pick(unit.result, language)], why: pick(unit.task, language), whatIf: pick(unit.failure ?? unit.result, language),
    nextLesson: next ? `iptv-live-${next.id}` : '',
  };
}
