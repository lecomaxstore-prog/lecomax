import type { PhoneTopicId } from './phone-explorer';

const text = (en: string, fr: string, ar: string) => ({ en, fr, ar });
type Words = ReturnType<typeof text>;
type Assembly = { position: Words; fitting: Words; related: PhoneTopicId[] };
// General assembly principles. Positions in the generated image are illustrative.
export const phoneAssembly: Partial<Record<PhoneTopicId, Assembly>> = {
  battery: {
    position: text('A broad, flat space inside the frame leaves room for the battery and its short cable.', 'Un espace plat du châssis accueille la batterie et sa courte nappe.', 'البطارية كتحتاج بلاصة واسعة ومسطّحة داخل الهيكل، مع ممر للشريط ديالها.'),
    fitting: text('Model-specific adhesive secures the pack; its connector joins the power circuit. A battery is not screwed through or bent to fit. Real replacement requires the exact battery procedure and trained handling.', 'Un adhésif adapté au modèle fixe la batterie ; son connecteur rejoint le circuit de puissance. On ne la perce ni ne la plie pour la faire entrer. Le remplacement exige la procédure exacte et une manipulation qualifiée.', 'لاصق خاص بالموديل كيثبّت البطارية، والموصل كيربطها بدائرة الطاقة. ما كتتثقبش ببرغي وما كتتعوّجش باش تدخل. التبديل الحقيقي محتاج دليل الموديل وخبرة فالتعامل مع البطاريات.'),
    related: ['power', 'connector', 'frame'],
  },
  camera: {
    position: text('The camera module sits in a shaped recess aligned with a lens window.', 'Le module caméra se place dans un logement aligné avec la fenêtre optique.', 'الكاميرا كتركب فبلاصة محددة كتوافق نافذة العدسة.'),
    fitting: text('A bracket holds the module while a routed flex cable connects it to the board. Lens cleanliness, cable routing and model-specific calibration matter as much as mechanical fit.', 'Un support maintient le module et une nappe guidée le relie à la carte. Propreté optique, trajet de la nappe et calibration propre au modèle comptent aussi.', 'دعامة كتثبّت الكاميرا وشريط فممر مخصص كيربطها باللوحة. نظافة العدسة ومسار الشريط والمعايرة الخاصة بالموديل مهمين حتى هما.'),
    related: ['flex', 'connector', 'chip'],
  },
  display: {
    position: text('The screen assembly closes the front of the frame; its cables reach the board inside.', 'L’écran ferme la face avant ; ses nappes rejoignent la carte intérieure.', 'مجموعة الشاشة كتغطي الواجهة، والشرائط ديالها كتوصل للوحة فالداخل.'),
    fitting: text('The assembly uses model-specific seals and fasteners. Cables need their intended route without being trapped under the screen. Touch and image functions are checked separately.', 'L’ensemble utilise joints et fixations adaptés. Les nappes suivent leur passage sans être pincées. L’image et le tactile se contrôlent séparément.', 'الشاشة كتحتاج عوازل وتثبيت مناسب للموديل. الشرائط كتدوز فالممر ديالها بلا ما تتحصر تحت الشاشة. الصورة واللمس خاص كل واحد يتفحص بوحدو.'),
    related: ['flex', 'connector', 'frame'],
  },
  board: {
    position: text('The motherboard follows mounting points inside the frame and leaves space for modules.', 'La carte mère suit les points de fixation du châssis et laisse place aux modules.', 'اللوحة الأم كتوافق نقاط التثبيت فالهيكل وكتخلي بلاصة لباقي القطع.'),
    fitting: text('Standoffs and the correct screws support the board without bending it. Modules connect through sockets; chips are soldered to copper pads. A board is not just a large removable chip.', 'Entretoises et vis adaptées soutiennent la carte sans la courber. Les modules utilisent des connecteurs ; les puces sont soudées sur des pastilles.', 'الدعامات والبراغي المناسبة كتحمل اللوحة بلا اعوجاج. القطع كتتربط بالمقابس والشرائح كتلحم فالنقاط النحاسية. اللوحة ماشي مجرد شريحة كبيرة.'),
    related: ['chip', 'connector', 'screws'],
  },
  chip: {
    position: text('The processor package is mounted on the board, often under a shield or thermal layer.', 'Le processeur se trouve sur la carte, souvent sous un blindage ou une couche thermique.', 'المعالج كاين فوق اللوحة، وغالباً تحت غطاء واقي أو طبقة حرارية.'),
    fitting: text('Many phone processors use solder connections underneath the package. They do not plug into a desktop-style socket. Placement and soldering require specialized board assembly equipment.', 'Beaucoup de processeurs mobiles ont des soudures sous le boîtier, sans socket de PC. Placement et soudure nécessitent un équipement spécialisé.', 'بزاف ديال معالجات الهواتف ملحومين من التحت، ماشي راكبين فمقبس بحال الحاسوب. التركيب واللحام محتاجين تجهيزات متخصصة.'),
    related: ['ram', 'storage', 'power'],
  },
  ram: {
    position: text('RAM sits close to the processor and may be stacked in the same package.', 'La RAM est proche du processeur et peut être empilée dans le même boîtier.', 'RAM كتكون قريبة للمعالج وقد تكون مركّبة فوقه فنفس المجموعة.'),
    fitting: text('Phone RAM is usually soldered, sometimes stacked with the processor. It is not a removable laptop memory stick. Compatibility depends on the board design.', 'La RAM mobile est généralement soudée, parfois empilée avec le processeur. Ce n’est pas une barrette amovible ; la compatibilité dépend de la carte.', 'RAM فالهاتف غالباً ملحومة وقد تكون مكدّسة مع المعالج. ماشي قطعة قابلة للنزع بحال رام الحاسوب، والتوافق تابع لتصميم اللوحة.'),
    related: ['chip', 'board', 'power'],
  },
  storage: {
    position: text('Flash storage is a chip package on the board, distinct from temporary RAM.', 'Le stockage flash est un boîtier sur la carte, distinct de la RAM temporaire.', 'التخزين فلاش شريحة فوق اللوحة، مختلفة على RAM المؤقتة.'),
    fitting: text('The package is soldered to the board. Replacing it is a board-level operation, not inserting a memory card; encryption and device configuration can prevent data access.', 'Le boîtier est soudé. Le remplacer est une intervention sur carte, pas l’ajout d’une carte mémoire ; chiffrement et configuration peuvent empêcher l’accès aux données.', 'شريحة التخزين ملحومة فاللوحة. تبديلها عملية متخصصة، ماشي بحال إدخال كارت ميموار؛ التشفير وإعدادات الجهاز يقدرو يمنعو الوصول للبيانات.'),
    related: ['chip', 'board', 'power'],
  },
  port: {
    position: text('The charging socket aligns with an opening at the edge of the enclosure.', 'La prise de charge s’aligne avec une ouverture du boîtier.', 'منفذ الشحن كيوافق فتحة فحافة الهيكل.'),
    fitting: text('Depending on the model, the port belongs to a replaceable cable assembly or is soldered to a board. Mounting carries insertion forces so tiny electrical contacts do not carry the mechanical load.', 'Selon le modèle, le port appartient à une nappe remplaçable ou est soudé. Sa fixation supporte les efforts du câble plutôt que les petits contacts.', 'حسب الموديل، المنفذ يقدر يكون مع مجموعة شريط قابلة للتبديل أو ملحوم فاللوحة. التثبيت كيتحمّل قوة إدخال الكابل باش ما تتحمّلهاش نقاط التلامس الصغيرة.'),
    related: ['power', 'flex', 'frame'],
  },
  audio: {
    position: text('The loudspeaker sits near an acoustic outlet with a small chamber around it.', 'Le haut-parleur se place près d’une sortie sonore avec une petite chambre acoustique.', 'السماعة كتكون حدّا مخرج الصوت ومعاها حجرة صوتية صغيرة.'),
    fitting: text('A sealed module is held by model-specific fasteners and connected by contacts or a cable. Its gasket and outlet alignment affect sound; covering the outlet muffles it.', 'Le module est fixé et relié par contacts ou câble. Son joint et l’alignement de la sortie influencent le son ; une sortie bouchée l’étouffe.', 'السماعة كتتثبّت وكتتربط بنقاط تلامس أو كابل. العازل ومحاذاة مخرج الصوت كيأثرو على الجودة؛ إلا تسد المخرج كيولي الصوت مكتوم.'),
    related: ['frame', 'connector', 'seal'],
  },
  microphone: {
    position: text('A microphone is aligned with a sound opening; phones can have several microphones.', 'Un microphone est aligné avec une ouverture sonore ; il peut y en avoir plusieurs.', 'الميكروفون كيوافق فتحة الصوت، والهاتف يقدر يكون فيه أكثر من واحد.'),
    fitting: text('The microphone may be soldered to a board or supplied on a flex assembly. Its acoustic gasket guides sound. Adhesive blocking the sound inlet can spoil recording even if the electrical connection works.', 'Il peut être soudé ou monté sur une nappe. Son joint guide le son. Un adhésif devant l’entrée peut dégrader l’enregistrement malgré une connexion correcte.', 'الميكروفون يقدر يكون ملحوم أو فوق شريط. العازل كيوجّه ليه الصوت. لاصق سادّ المدخل يقدر يفسد التسجيل حتى إلا الاتصال الكهربائي خدام.'),
    related: ['flex', 'seal', 'board'],
  },
  haptics: {
    position: text('The actuator attaches firmly to the frame so its movement can be felt through the phone.', 'L’actionneur est fixé au châssis pour transmettre les vibrations au téléphone.', 'قطعة الاهتزاز كتتثبّت فالهيكل باش الحركة توصل ليدك.'),
    fitting: text('A fitted module, fasteners and an electrical connector form the assembly. A loose mounting can rattle instead of delivering crisp feedback. The screw arrangement is model-specific.', 'Le module, ses fixations et son connecteur forment l’ensemble. Une fixation lâche peut vibrer bruyamment. La disposition des vis dépend du modèle.', 'المجموعة فيها القطعة والتثبيت والموصل الكهربائي. إلا كانت مرخوفة تقدر تدير رجرجة بدل اهتزاز واضح. ترتيب البراغي تابع للموديل.'),
    related: ['frame', 'screws', 'connector'],
  },
  radio: {
    position: text('Radio chips sit on the board while antennas may run along the frame or on flex sections.', 'Les circuits radio sont sur la carte ; les antennes peuvent longer le châssis ou des nappes.', 'دوائر الاتصال فوق اللوحة، والهوائيات تقدر تكون فالإطار أو فالشرائط.'),
    fitting: text('Antenna contacts and miniature coaxial cables must match their designed connections. Shielding and spacing are part of the radio design; moving an antenna can change reception.', 'Contacts d’antenne et câbles coaxiaux suivent le raccordement prévu. Blindage et espacement comptent ; déplacer l’antenne peut changer la réception.', 'نقاط الهوائي والكابلات الدقيقة خاصها التوصيل المصمّم ليها. الغطاء والمسافات داخلين فتصميم الاتصال، وتحريك الهوائي يقدر يبدّل الاستقبال.'),
    related: ['board', 'frame', 'shield'],
  },
  sensors: {
    position: text('Sensors have different homes: motion sensors on the board, light sensors near an optical window.', 'Les capteurs de mouvement sont sur la carte ; les capteurs de lumière près d’une fenêtre optique.', 'الحساسات كتختلف: حساس الحركة فوق اللوحة وحساس الضوء حدّا نافذة كيدوز منها الضوء.'),
    fitting: text('Orientation, an unobstructed opening and calibration can matter. Some sensors are soldered; others share a module. A part fitting physically does not prove it is compatible.', 'Orientation, ouverture dégagée et calibration peuvent compter. Certains capteurs sont soudés, d’autres intégrés à un module. La forme seule ne prouve pas la compatibilité.', 'الاتجاه والفتحة والمعايرة يقدرو يكونو مهمين. كاين حساس ملحوم وكاين اللي داخل مجموعة. إلا القطعة دخلات فبلاصتها ما كيعنيش بالضرورة متوافقة.'),
    related: ['chip', 'board', 'display'],
  },
  'flash-led': {
    position: text('The flash light sits behind a clear window near the camera.', 'La LED du flash est derrière une fenêtre claire près de la caméra.', 'ضوء الفلاش كاين وراء نافذة شفافة حدّا الكاميرا.'),
    fitting: text('The LED may be part of a flex or board assembly. Its window and diffuser align with the emitter; its driver controls current. It cannot be wired directly to arbitrary battery power.', 'La LED peut appartenir à une nappe ou une carte. Fenêtre et diffuseur s’alignent ; un circuit règle le courant. On ne l’alimente pas directement au hasard.', 'LED تقدر تكون فوق شريط أو لوحة. النافذة وموزّع الضوء كيوافقوها، ودائرة خاصة كتنظّم التيار. ما كتتربطش مباشرة بكهرباء عشوائية من البطارية.'),
    related: ['camera', 'power', 'flex'],
  },
  flex: {
    position: text('A flex cable follows a defined route between a module and a board connector.', 'Une nappe suit un trajet prévu entre un module et un connecteur de carte.', 'الشريط المرن كيدوز فمسار محدد بين القطعة وموصل اللوحة.'),
    fitting: text('The connector type determines whether the end presses onto a socket or slides into a latch. The cable needs its designed bends and slack; creasing or trapping it can break the tracks.', 'Le connecteur détermine si la nappe se clipse ou glisse sous un verrou. Elle garde ses courbes et son jeu prévus ; un pli net ou un pincement peut couper les pistes.', 'نوع الموصل كيحدد واش الطرف كيركب بالضغط ولا كيدخل تحت قفل. الشريط محتاج الانحناء والمساحة ديالو؛ الطي الحاد أو الحصر يقدر يقطع المسارات.'),
    related: ['connector', 'board', 'display'],
  },
  connector: {
    position: text('The socket is mounted on the board where a module or cable terminates.', 'La prise est fixée sur la carte à l’arrivée d’un câble ou module.', 'المقبس كاين فاللوحة فالبلاصة اللي كيوصل ليها الكابل أو القطعة.'),
    fitting: text('Match the connector shape and alignment before considering its locking action. Press-fit and latch connectors work differently. Replacing the socket itself often requires microsoldering.', 'Forme et alignement précèdent le verrouillage. Connecteurs à pression et à verrou diffèrent. Remplacer la prise demande souvent de la microsoudure.', 'خاص الشكل والاتجاه يتوافقو قبل التثبيت. موصل الضغط مختلف على موصل القفل. تبديل المقبس نفسه غالباً محتاج لحام دقيق.'),
    related: ['flex', 'board', 'screws'],
  },
  shield: {
    position: text('A conductive cover surrounds a group of circuits on the board.', 'Un capot conducteur recouvre un groupe de circuits sur la carte.', 'غطاء موصل كيغطي مجموعة دوائر فوق اللوحة.'),
    fitting: text('A shield needs its intended ground connection and clearance. Some covers clip onto a soldered frame; others are soldered. It must not touch unintended signal contacts.', 'Le blindage exige sa connexion de masse et les dégagements prévus. Certains capots se clipsent, d’autres sont soudés. Ils ne doivent pas toucher les signaux.', 'الغطاء محتاج اتصال الماس والمسافة المصمّمة. كاين اللي كيتثبت فإطار وكاين الملحوم. ما خاصوش يلمس نقاط الإشارة اللي ما مخصصاش ليه.'),
    related: ['board', 'radio', 'thermal'],
  },
  thermal: {
    position: text('A thin layer forms a heat path between hot components and a larger surface.', 'Une couche fine conduit la chaleur des composants vers une surface plus grande.', 'طبقة رقيقة كتدير مسار للحرارة من القطع السخونة لمساحة أكبر.'),
    fitting: text('Coverage, contact and material thickness are designed together. A folded sheet or an air gap can interrupt heat transfer. Extra thickness can also stop other parts fitting correctly.', 'Surface, contact et épaisseur sont définis ensemble. Un pli ou une poche d’air gêne le transfert ; une surépaisseur gêne l’assemblage.', 'المساحة والتلامس والسماكة محسوبين مع بعض. طيّة أو فراغ هوائي يقدر يقطع انتقال الحرارة، والسماكة الزائدة تقدر تمنع باقي القطع يركبو مزيان.'),
    related: ['chip', 'shield', 'frame'],
  },
  screws: {
    position: text('Fasteners sit at assigned mounting points, often holding a bracket over a connector.', 'Les vis occupent des points précis, parfois sur un support de connecteur.', 'البراغي عندها نقاط محددة، وأحياناً كتشد دعامة فوق موصل.'),
    fitting: text('Each position has a specified screw length, type and torque. A similar-looking screw can be too long and damage what is underneath. A screw map preserves those distinctions.', 'Chaque position a une longueur, un type et un couple précis. Une vis ressemblante peut être trop longue. Un plan de vis conserve ces différences.', 'كل بلاصة عندها طول ونوع وقوة شد محددة. برغي كيشبه لآخر يقدر يكون طويل ويضر اللي تحته. خريطة البراغي كتحافظ على هاد الفرق.'),
    related: ['frame', 'connector', 'board'],
  },
  frame: {
    position: text('The frame surrounds the phone and defines the locations of its assemblies.', 'Le châssis entoure le téléphone et définit la place des ensembles.', 'الهيكل كيدور بالهاتف وكيحدد بلايص المجموعات.'),
    fitting: text('Mounting bosses, openings and module clearances must line up. A bent frame can stop a good screen or connector fitting. Ground and antenna contacts may also depend on it.', 'Fixations, ouvertures et dégagements doivent correspondre. Un châssis courbé gêne même une pièce correcte. Masse et antennes peuvent aussi en dépendre.', 'نقاط التثبيت والفتحات والمسافات خاصهم يتوافقو. هيكل معوّج يقدر يمنع شاشة سليمة تركب. نقاط الماس والهوائيات حتى هي تقدر تعتمد عليه.'),
    related: ['display', 'screws', 'seal'],
  },
  seal: {
    position: text('A perimeter seal follows the mating edge of the enclosure or an acoustic opening.', 'Le joint suit le bord de fermeture ou une ouverture acoustique.', 'العازل كيتبع حافة الإغلاق أو فتحة صوتية.'),
    fitting: text('The correct gasket shape keeps openings clear and forms a continuous mating surface. Old or misplaced adhesive changes the fit. Closing the phone alone does not certify water resistance.', 'Le bon joint dégage les ouvertures et suit toute la surface. Un adhésif ancien ou déplacé change l’ajustement. Fermer le téléphone ne certifie pas l’étanchéité.', 'شكل العازل الصحيح كيخلي الفتحات واضحة وكيغطي حافة التلامس. لاصق قديم أو فبلاصة غالطة كيبدّل التركيب. إغلاق الهاتف بوحدو ما كيضمنش مقاومة الماء.'),
    related: ['frame', 'display', 'microphone'],
  },
  capacitors: {
    position: text('Many capacitors sit near chip power pins to support the local supply.', 'Beaucoup de condensateurs sont proches des alimentations des puces.', 'بزاف ديال المكثفات كاينين حدّا تغذية الشرائح باش يعاونو الكهرباء المحلية.'),
    fitting: text('These tiny parts are soldered to pads. Capacitance, voltage rating and package size must match the circuit; polarity matters for types that have it. Color cannot identify a replacement.', 'Ils sont soudés sur des pastilles. Capacité, tension et dimensions doivent convenir ; la polarité compte pour les types polarisés. La couleur ne suffit pas.', 'هاد القطع ملحومة فوق نقاط. السعة وجهد التحمل والحجم خاصهم يوافقو الدائرة؛ القطبية مهمة فالأنواع اللي عندها قطبية. اللون ما كيكفيش لاختيار بديل.'),
    related: ['power', 'chip', 'board'],
  },
  resistors: {
    position: text('Resistors sit along signal or power paths on the circuit board.', 'Les résistances se trouvent sur les chemins de signaux ou d’alimentation.', 'المقاومات كاينين فمسارات الإشارات أو الكهرباء فاللوحة.'),
    fitting: text('Pads hold a soldered part with a specified resistance and power rating. A visually similar value can change the circuit behavior. Identifying it needs circuit information, not this illustration.', 'Une pièce soudée possède une résistance et une puissance définies. Une autre valeur change le fonctionnement. Il faut les données du circuit, pas cette illustration.', 'قطعة ملحومة عندها قيمة مقاومة وقدرة محددة. قيمة أخرى ولو الشكل متشابه تقدر تبدّل خدمة الدائرة. التحديد محتاج معلومات الدائرة، ماشي هاد الرسم.'),
    related: ['board', 'power', 'sensors'],
  },
  inductors: {
    position: text('Power coils sit near switching regulators with nearby capacitors.', 'Les bobines de puissance côtoient les régulateurs et condensateurs.', 'ملفات الطاقة كاينين حدّا منظّمات التغذية والمكثفات.'),
    fitting: text('The soldered coil needs the intended inductance and current capability. Its placement is part of the regulator design. A wire bridge cannot replace its energy-storage role.', 'La bobine soudée exige inductance et courant adaptés. Sa position fait partie du régulateur. Un fil ne remplace pas son stockage d’énergie.', 'الملف الملحوم محتاج قيمة وقدرة تيار مناسبة. البلاصة ديالو داخلة فتصميم التنظيم. سلك عادي ما يقدرش يعوّض الدور ديالو فتخزين الطاقة.'),
    related: ['power', 'capacitors', 'board'],
  },
  power: {
    position: text('Power-management chips and supporting parts sit on the board between energy sources and loads.', 'Les circuits de gestion sont sur la carte entre sources d’énergie et composants alimentés.', 'دوائر تنظيم الطاقة فوق اللوحة بين مصدر الكهرباء والقطع اللي كتستهلكها.'),
    fitting: text('These soldered circuits work with coils and capacitors selected as a system. Package orientation and the exact compatible part matter. They are board-level assemblies, not plug-in charger adapters.', 'Ces circuits soudés travaillent avec bobines et condensateurs choisis ensemble. Orientation et référence compatible comptent. Ce ne sont pas des adaptateurs enfichables.', 'هاد الدوائر ملحومة وكتخدم مع ملفات ومكثفات مختارين كمجموعة. الاتجاه والنوع المتوافق مهمين. ماشي محوّلات شحن كتدخل وتخرج من مقبس.'),
    related: ['battery', 'inductors', 'capacitors'],
  },
};
