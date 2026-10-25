import type {
  Copy,
  DailyTask,
  Goal,
  Interest,
  BrainExercise,
  LearningLesson,
  Meal,
  ReminderId,
} from './types';
export const c = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });
export const goals: Record<Goal, Copy> = {
  health: c('Be healthier', 'Vivre plus sainement', 'حياة أكثر صحة'),
  energy: c('More energy', 'Plus d’énergie', 'طاقة أفضل'),
  focus: c('Concentration', 'Concentration', 'التركيز'),
  memory: c('Support memory', 'Entretenir la mémoire', 'دعم الذاكرة'),
  food: c('Eat better', 'Mieux manger', 'غذاء متوازن'),
  movement: c('Move more', 'Bouger davantage', 'الحركة أكثر'),
  sleep: c('Sleep better', 'Mieux dormir', 'نوم أفضل'),
  calm: c('Less stress', 'Moins de stress', 'هدوء أكثر'),
  discipline: c('Build consistency', 'Être régulier', 'الاستمرارية'),
  learn: c('Learn daily', 'Apprendre chaque jour', 'التعلم يومياً'),
};
export const interests: Record<Interest, Copy> = {
  habits: c('Habits', 'Habitudes', 'العادات'),
  nutrition: c('Nutrition', 'Alimentation', 'التغذية'),
  sleep: c('Sleep', 'Sommeil', 'النوم'),
  productivity: c('Productivity', 'Productivité', 'الإنتاجية'),
  memory: c('Memory', 'Mémoire', 'الذاكرة'),
  technology: c('Technology', 'Technologie', 'التقنية'),
  growth: c('Personal growth', 'Développement personnel', 'التطور الشخصي'),
  knowledge: c('General knowledge', 'Culture générale', 'المعرفة العامة'),
};
export const tasks: DailyTask[] = [
  [
    'water',
    'morning',
    c('Drink water throughout the day', 'Boire de l’eau dans la journée', 'اشرب الماء خلال اليوم'),
  ],
  ['mindful', 'morning', c('A mindful moment', 'Un moment de pleine attention', 'لحظة تأمل')],
  ['fruit', 'morning', c('Enjoy some fruit', 'Manger un fruit', 'تناول فاكهة')],
  ['move', 'body', c('Move at your own pace', 'Bouger à son rythme', 'تحرك على قدر استطاعتك')],
  ['brain', 'mind', c('Try today’s brain exercise', 'Faire le défi du jour', 'تمرين العقل اليومي')],
  ['learn', 'mind', c('Learn something today', 'Apprendre quelque chose', 'تعلم شيئاً اليوم')],
  ['vegetables', 'food', c('Add vegetables', 'Ajouter des légumes', 'أضف الخضروات')],
  ['meal', 'food', c('Enjoy a balanced meal', 'Savourer un repas équilibré', 'تناول وجبة متوازنة')],
  ['reflect', 'evening', c('Reflect on today', 'Faire le bilan du jour', 'تأمل في يومك')],
  ['sleep', 'evening', c('Prepare for sleep', 'Préparer le sommeil', 'استعد للنوم')],
].map(([id, section, title]) => ({ id, section, title })) as DailyTask[];
export const mindfulness = [
  c(
    'For 2 minutes, breathe naturally and notice each out-breath. When your mind wanders, gently return. No breath holding.',
    'Pendant 2 minutes, respirez naturellement et observez l’expiration. Revenez doucement à votre souffle. Sans rétention.',
    'تنفس بشكل طبيعي لدقيقتين وراقب الزفير. عندما يتشتت ذهنك عد بلطف إلى تنفسك دون حبس النفس.',
  ),
  c(
    'Notice five things you see, four you feel, and three you hear. Take your time.',
    'Observez cinq choses visibles, quatre sensations et trois sons. Prenez votre temps.',
    'لاحظ خمسة أشياء تراها وأربعاً تشعر بها وثلاثة أصوات تسمعها. خذ وقتك.',
  ),
  c(
    'Sit comfortably for 3 minutes. Notice your feet, shoulders and face. Soften any tension without forcing it.',
    'Asseyez-vous 3 minutes. Observez les pieds, les épaules, le visage. Relâchez sans forcer.',
    'اجلس براحة ثلاث دقائق. لاحظ قدميك وكتفيك ووجهك واسترخ دون إجبار.',
  ),
  c(
    'Listen quietly for 2 minutes. Notice nearby and distant sounds without naming them.',
    'Écoutez pendant 2 minutes les sons proches et lointains, sans les nommer.',
    'استمع بهدوء لدقيقتين إلى الأصوات القريبة والبعيدة دون تسميتها.',
  ),
  c(
    'Take a 3-minute mindful walk or seated pause. Notice one colour, one sound and one sensation.',
    'Marchez ou restez assis 3 minutes en observant une couleur, un son et une sensation.',
    'امش أو اجلس بهدوء ثلاث دقائق ولاحظ لوناً وصوتاً وإحساساً.',
  ),
  c(
    'Name one thing you appreciate today. Spend 2 minutes noticing what made it possible.',
    'Nommez une chose appréciée aujourd’hui. Observez pendant 2 minutes ce qui l’a rendue possible.',
    'سمّ شيئاً تقدّره اليوم وتأمل لدقيقتين فيما جعله ممكناً.',
  ),
  c(
    'For 2 minutes, notice your hands resting. Let your breathing find its own comfortable pace.',
    'Pendant 2 minutes, observez vos mains au repos. Laissez la respiration suivre son rythme naturel.',
    'لدقيقتين لاحظ يديك في وضع الراحة ودع تنفسك يأخذ إيقاعه الطبيعي.',
  ),
];
export const movement = [
  c(
    'Try a comfortable walk, indoors or outdoors. Seated movement is an alternative.',
    'Essayez une marche confortable, dedans ou dehors. Bouger assis est aussi possible.',
    'جرّب مشياً مريحاً داخل المنزل أو خارجه، أو حركة وأنت جالس.',
  ),
  c(
    'Move gently to a favourite song, standing or seated.',
    'Bougez doucement sur une chanson, debout ou assis.',
    'تحرك بلطف على أغنية تحبها واقفاً أو جالساً.',
  ),
  c(
    'Break your movement into short, easy sessions across the day.',
    'Répartissez le mouvement en petites séances faciles dans la journée.',
    'قسّم الحركة إلى فترات قصيرة ومريحة خلال اليوم.',
  ),
  c(
    'Explore a familiar route and notice something new.',
    'Explorez un trajet familier et remarquez un détail nouveau.',
    'اسلك طريقاً مألوفاً ولاحظ فيه شيئاً جديداً.',
  ),
  c(
    'Take a gentle movement break between two tasks.',
    'Faites une pause active douce entre deux tâches.',
    'خذ استراحة حركة لطيفة بين مهمتين.',
  ),
  c(
    'Invite someone for an easy walk or move along to music together.',
    'Invitez quelqu’un à marcher tranquillement ou à bouger en musique.',
    'ادع شخصاً للمشي بهدوء أو الحركة مع الموسيقى.',
  ),
  c(
    'Choose enjoyable movement today. Comfort matters more than speed.',
    'Choisissez un mouvement agréable. Le confort compte plus que la vitesse.',
    'اختر حركة ممتعة اليوم. الراحة أهم من السرعة.',
  ),
];
export const sleepTips = [
  c(
    'Put screens aside before your wind-down. Try a paper book instead.',
    'Éloignez les écrans avant de vous détendre. Essayez un livre papier.',
    'اترك الشاشات قبل الاسترخاء وجرّب كتاباً ورقياً.',
  ),
  c(
    'Make your bedroom quiet, comfortably cool and dim if possible.',
    'Préparez une chambre calme, tempérée et sombre si possible.',
    'اجعل غرفة النوم هادئة ومعتدلة الحرارة وخافتة الضوء إن أمكن.',
  ),
  c(
    'Write tomorrow’s first task down, then let it wait.',
    'Notez la première tâche de demain, puis laissez-la attendre.',
    'اكتب أول مهمة للغد ثم دعها تنتظر.',
  ),
  c(
    'Choose a simple, repeatable wind-down ritual.',
    'Choisissez un rituel du soir simple et régulier.',
    'اختر روتيناً بسيطاً ومتكرراً للاسترخاء مساءً.',
  ),
  c(
    'Keep a comfortable bedtime routine, including on quieter days.',
    'Gardez un rituel de coucher régulier, même les jours calmes.',
    'حافظ على روتين نوم مريح حتى في الأيام الهادئة.',
  ),
  c(
    'Try quiet reading or gentle music as your day comes to a close.',
    'Terminez la journée avec une lecture calme ou une musique douce.',
    'اختم يومك بقراءة هادئة أو موسيقى لطيفة.',
  ),
  c(
    'Leave tomorrow’s essentials ready so the morning feels easier.',
    'Préparez les affaires de demain pour simplifier le matin.',
    'جهز أساسيات الغد ليكون صباحك أسهل.',
  ),
];
export const motivations = [
  c(
    'Small steps build strong habits.',
    'Les petits pas créent de bonnes habitudes.',
    'الخطوات الصغيرة تبني عادات قوية.',
  ),
  c(
    'Make room for yourself today.',
    'Gardez une place pour vous aujourd’hui.',
    'خصص لنفسك مساحة اليوم.',
  ),
  c(
    'Your pace is a good place to start.',
    'Votre rythme est un bon point de départ.',
    'إيقاعك الخاص بداية جيدة.',
  ),
  c(
    'Showing up matters more than perfection.',
    'Être présent compte plus que la perfection.',
    'المحاولة أهم من الكمال.',
  ),
  c('A little care, every day.', 'Un peu d’attention, chaque jour.', 'قليل من العناية كل يوم.'),
  c('Tomorrow is another opportunity.', 'Demain offre une nouvelle occasion.', 'الغد فرصة جديدة.'),
  c(
    'Notice what went well today.',
    'Remarquez ce qui s’est bien passé.',
    'لاحظ ما سار جيداً اليوم.',
  ),
];
export const brains: BrainExercise[] = [
  {
    id: 'words',
    title: c('Five little words', 'Cinq petits mots', 'خمس كلمات'),
    instruction: c(
      'Study these words for 30 seconds: river, lemon, chair, moon, key. Hide them, wait a minute and recall as many as you can, in any order.',
      'Observez 30 secondes : rivière, citron, chaise, lune, clé. Masquez, attendez une minute et rappelez-vous les mots dans l’ordre de votre choix.',
      'تأمل ٣٠ ثانية: نهر، ليمون، كرسي، قمر، مفتاح. أخف الكلمات وانتظر دقيقة ثم تذكر ما تستطيع بأي ترتيب.',
    ),
  },
  {
    id: 'observe',
    title: c('Look a little closer', 'Observer un peu mieux', 'لاحظ التفاصيل'),
    instruction: c(
      'Look around for 30 seconds. Close your eyes if comfortable and name five details. Open them and check.',
      'Regardez autour de vous 30 secondes. Fermez les yeux si cela vous convient et nommez cinq détails, puis vérifiez.',
      'انظر حولك ٣٠ ثانية ثم أغمض عينيك إن كان مريحاً واذكر خمس تفاصيل ثم تحقق.',
    ),
  },
  {
    id: 'math',
    title: c('A small calculation', 'Un petit calcul', 'حساب بسيط'),
    instruction: c(
      'A basket has 12 apples. Add 7, then share 8. How many remain? Work it out mentally, without rushing.',
      'Un panier contient 12 pommes. Ajoutez-en 7, puis donnez-en 8. Combien reste-t-il ? Calculez mentalement sans vous presser.',
      'في سلة ١٢ تفاحة. أضف ٧ ثم وزع ٨. كم بقي؟ احسب ذهنياً دون استعجال.',
    ),
    answer: c(
      '11 apples: 12 + 7 − 8 = 11.',
      '11 pommes : 12 + 7 − 8 = 11.',
      '١١ تفاحة: ١٢ + ٧ − ٨ = ١١.',
    ),
  },
  {
    id: 'pattern',
    title: c('Find the pattern', 'Trouver la suite', 'اكتشف النمط'),
    instruction: c(
      'What comes next: 3, 6, 12, 24, …? Explain your rule aloud.',
      'Quel nombre suit : 3, 6, 12, 24… ? Expliquez la règle à voix haute.',
      'ما العدد التالي: ٣، ٦، ١٢، ٢٤…؟ اشرح القاعدة بصوتك.',
    ),
    answer: c(
      '48. Each number doubles.',
      '48. Chaque nombre est doublé.',
      '٤٨. كل عدد ضعف السابق.',
    ),
  },
  {
    id: 'recall',
    title: c('Replay a moment', 'Revoir un moment', 'استرجع لحظة'),
    instruction: c(
      'Recall yesterday’s lunch. Where were you? What colours, tastes and sounds do you remember? Describe three details.',
      'Repensez au déjeuner d’hier. Où étiez-vous ? Quelles couleurs, saveurs et quels sons ? Décrivez trois détails.',
      'تذكر غداء الأمس. أين كنت؟ ما الألوان والمذاقات والأصوات التي تتذكرها؟ صف ثلاث تفاصيل.',
    ),
  },
  {
    id: 'attention',
    title: c('One minute of attention', 'Une minute d’attention', 'دقيقة انتباه'),
    instruction: c(
      'Choose a nearby object. Observe its shape, texture and shadows for one minute. Each time attention wanders, return gently.',
      'Choisissez un objet. Observez sa forme, sa texture et ses ombres pendant une minute. Revenez doucement lorsque l’attention s’éloigne.',
      'اختر شيئاً قريباً ولاحظ شكله وملمسه وظلاله لدقيقة. أعد انتباهك بلطف كلما تشتت.',
    ),
  },
  {
    id: 'reading',
    title: c('Read, cover, recall', 'Lire, cacher, rappeler', 'اقرأ وأخف وتذكر'),
    instruction: c(
      'Read today’s lesson. Hide the text and recall three ideas. Reopen it to check, then explain one idea in your own words.',
      'Lisez la leçon du jour. Cachez le texte et rappelez trois idées. Vérifiez puis expliquez une idée avec vos mots.',
      'اقرأ درس اليوم ثم أخف النص وتذكر ثلاث أفكار. تحقق ثم اشرح فكرة بكلماتك.',
    ),
  },
];
const lessonRows: [Interest, Copy, Copy, Copy][] = [
  [
    'habits',
    c('Make the start small', 'Commencer petit', 'ابدأ بخطوة صغيرة'),
    c(
      'A habit is easier to repeat when its first step is clear. Choose a small action and connect it to something you already do: after breakfast, put your walking shoes by the door. Prepare the environment so the next action takes less effort. A missed day is information, not a verdict. Ask what got in the way and make the next attempt smaller. Track the action you control, rather than demanding a particular result.',
      'Une habitude est plus facile à répéter lorsque le premier geste est clair. Associez un petit geste à une routine existante : après le petit déjeuner, posez vos chaussures près de la porte. Préparez l’environnement pour réduire l’effort. Un jour manqué est une information, pas un jugement. Cherchez l’obstacle et simplifiez la prochaine tentative. Suivez vos gestes plutôt qu’un résultat imposé.',
      'تسهل إعادة العادة عندما تكون خطوتها الأولى واضحة. اربط فعلاً صغيراً بما تفعله أصلاً: بعد الإفطار ضع حذاء المشي قرب الباب. جهز محيطك لتقلل المجهود المطلوب. اليوم الفائت معلومة وليس حكماً عليك. اسأل عما أعاقك واجعل المحاولة التالية أصغر. تابع الفعل الذي تتحكم فيه بدلاً من المطالبة بنتيجة محددة.',
    ),
    c(
      'Write one sentence: After ___, I will ___ for two minutes. Try it once today.',
      'Écrivez : Après ___, je vais ___ pendant deux minutes. Essayez aujourd’hui.',
      'اكتب: بعد ___ سأفعل ___ لدقيقتين. جرّبها اليوم.',
    ),
  ],
  [
    'nutrition',
    c('Build a varied plate', 'Composer une assiette variée', 'نوّع طبقك'),
    c(
      'Variety makes meals more interesting. Start with a vegetable you enjoy, add a grain or other starchy food, and include a protein such as beans, eggs, tofu or fish according to your preferences. Frozen and canned foods can be practical choices too. You do not need a perfect meal or rigid rules. Think about what you can add for variety rather than cutting out whole food groups. Notice hunger, comfort and enjoyment as you eat.',
      'La variété rend les repas agréables. Partez d’un légume apprécié, ajoutez une céréale ou un féculent et une protéine : haricots, œufs, tofu ou poisson selon vos préférences. Surgelés et conserves sont aussi pratiques. Pas besoin d’un repas parfait ou de règles rigides. Pensez aux aliments à ajouter pour varier, plutôt qu’à supprimer des groupes entiers. Observez faim, confort et plaisir.',
      'التنوع يجعل الوجبات أمتع. ابدأ بخضار تحبها وأضف حبوباً أو طعاماً نشوياً ومصدراً للبروتين كالفاصوليا أو البيض أو التوفو أو السمك حسب تفضيلك. الأطعمة المجمدة والمعلبة خيارات عملية أيضاً. لا تحتاج لوجبة مثالية أو قواعد صارمة. فكر فيما تضيفه للتنوع بدلاً من حذف مجموعات غذائية كاملة. لاحظ الجوع والراحة والاستمتاع أثناء الأكل.',
    ),
    c(
      'Sketch a meal using three foods already available at home.',
      'Imaginez un repas avec trois aliments déjà disponibles.',
      'صمم وجبة من ثلاثة أطعمة موجودة في المنزل.',
    ),
  ],
  [
    'sleep',
    c('An easier evening', 'Une soirée plus douce', 'مساء أهدأ'),
    c(
      'A wind-down routine is a transition between activity and rest. Choose a few quiet actions that feel comfortable, such as preparing tomorrow’s clothes, dimming a light and reading. Keep the routine realistic. It does not need to become another performance target. If you have a busy evening, a shorter version still counts. Notice which activities leave you feeling settled, and build your own routine around them. Persistent sleep difficulties deserve a conversation with a qualified professional.',
      'Un rituel du soir fait la transition vers le repos. Choisissez quelques gestes calmes : préparer vos vêtements, baisser la lumière, lire. Gardez un rituel réaliste, sans en faire une obligation de performance. Une version courte compte aussi. Observez les activités qui vous apaisent pour créer votre propre routine. Des difficultés de sommeil persistantes méritent un échange avec un professionnel qualifié.',
      'روتين المساء انتقال من النشاط إلى الراحة. اختر أفعالاً هادئة ومريحة كتجهيز ملابس الغد وتخفيف الضوء والقراءة. اجعله واقعياً ولا تحوله إلى اختبار أداء آخر. النسخة القصيرة مفيدة في الأمسيات المزدحمة أيضاً. لاحظ الأنشطة التي تشعرك بالسكينة وابن روتينك حولها. ناقش صعوبات النوم المستمرة مع مختص مؤهل.',
    ),
    c(
      'Choose two quiet actions for tonight and prepare one now.',
      'Choisissez deux gestes calmes pour ce soir et préparez-en un.',
      'اختر فعلين هادئين لهذا المساء وجهز أحدهما الآن.',
    ),
  ],
  [
    'productivity',
    c('Give one task your attention', 'Une tâche à la fois', 'ركز على مهمة واحدة'),
    c(
      'Switching between tasks can interrupt your train of thought. For one short work session, choose a single outcome and put unrelated reminders on paper. Silence optional alerts if you can. Start with a manageable interval, then take a break and review what happened. This is an experiment, not a test of willpower. If an urgent interruption happens, note your next step before switching so returning is easier.',
      'Passer d’une tâche à l’autre peut couper le fil. Pour une courte séance, choisissez un résultat et notez les autres idées sur papier. Coupez les alertes facultatives si possible. Travaillez un moment raisonnable puis faites une pause. C’est une expérience, pas une épreuve de volonté. Avant une interruption urgente, notez la prochaine étape pour reprendre facilement.',
      'الانتقال المتكرر بين المهام قد يقطع تسلسل أفكارك. اختر نتيجة واحدة لجلسة قصيرة واكتب التذكيرات الأخرى على ورقة. أوقف التنبيهات غير الضرورية إن أمكن. ابدأ بفترة مناسبة ثم استرح وراجع ما حدث. هذه تجربة وليست اختبار إرادة. قبل الاستجابة لمقاطعة عاجلة اكتب خطوتك التالية لتسهل العودة.',
    ),
    c(
      'Try five focused minutes on one small task. Note what helped.',
      'Essayez cinq minutes sur une petite tâche. Notez ce qui aide.',
      'جرّب خمس دقائق على مهمة صغيرة وسجل ما ساعدك.',
    ),
  ],
  [
    'memory',
    c('Retrieve before rereading', 'Rappeler avant de relire', 'تذكر قبل إعادة القراءة'),
    c(
      'After reading something, close the text and try to explain its main idea. Then reopen it and compare. This gives you useful feedback about what you understood and what needs another look. Keep the exercise low pressure: forgetting is part of learning. Come back to the idea another day and try again. Memory games here are practice activities, not medical assessments or treatments.',
      'Après une lecture, fermez le texte et expliquez l’idée principale. Rouvrez puis comparez. Vous voyez ce qui est compris et ce qui mérite une nouvelle lecture. Gardez une approche détendue : oublier fait partie de l’apprentissage. Revenez à l’idée un autre jour. Ces jeux sont des exercices, pas des évaluations ou traitements médicaux.',
      'بعد القراءة أغلق النص وحاول شرح فكرته الرئيسية ثم افتحه وقارن. يمنحك ذلك ملاحظات عن فهمك وما يحتاج لمراجعة. لا تضغط على نفسك؛ النسيان جزء من التعلم. عد للفكرة في يوم آخر وجرّب مجدداً. ألعاب الذاكرة هنا أنشطة تدريب وليست تقييماً أو علاجاً طبياً.',
    ),
    c(
      'Hide this lesson and recall three ideas. Check them, then explain one to someone.',
      'Cachez la leçon et rappelez trois idées. Vérifiez puis partagez-en une.',
      'أخف الدرس وتذكر ثلاث أفكار ثم تحقق واشرح واحدة لشخص آخر.',
    ),
  ],
  [
    'technology',
    c('Recognise a suspicious message', 'Repérer un message suspect', 'لاحظ الرسائل المشبوهة'),
    c(
      'A message may create urgency to make you act before checking. Pause when someone requests a password, payment or verification code. Open the official app or type the known address yourself instead of following the message link. Check the request through a separate trusted channel. Even familiar names can be impersonated. Taking a short pause is often more useful than trying to judge a message only by its spelling or design.',
      'Un message peut créer une urgence pour vous faire agir trop vite. Faites une pause devant une demande de mot de passe, paiement ou code. Ouvrez l’application officielle ou saisissez vous-même l’adresse connue. Vérifiez par un canal fiable distinct. Même un nom familier peut être usurpé. Une pause est plus utile qu’un jugement fondé seulement sur l’orthographe ou le design.',
      'قد تصنع رسالة شعوراً بالإلحاح لتتصرف قبل التحقق. توقف عندما يُطلب منك كلمة مرور أو دفع أو رمز تحقق. افتح التطبيق الرسمي أو اكتب العنوان المعروف بنفسك بدلاً من رابط الرسالة. تحقق عبر قناة موثوقة منفصلة، فحتى الأسماء المألوفة يمكن انتحالها. التوقف قليلاً أنفع من الحكم على الرسالة من شكلها أو إملائها فقط.',
    ),
    c(
      'Imagine a fake delivery text. Name two safe ways to check it.',
      'Imaginez un faux SMS de livraison. Citez deux façons sûres de vérifier.',
      'تخيل رسالة توصيل مزيفة واذكر طريقتين آمنتين للتحقق.',
    ),
  ],
  [
    'growth',
    c('Speak kindly to yourself', 'Se parler avec bienveillance', 'تحدث مع نفسك بلطف'),
    c(
      'Notice the words you use after a difficult moment. Would you say the same thing to a friend? Try describing the event without turning it into a label about yourself. “I missed my walk” leaves room for a next step. “I always fail” is a much broader claim. Kindness can coexist with responsibility: acknowledge what happened, choose one practical adjustment and let the rest of the day continue.',
      'Après un moment difficile, observez vos mots. Les diriez-vous à un ami ? Décrivez le fait sans vous coller une étiquette. « J’ai manqué ma marche » laisse une prochaine étape possible. « Je rate toujours tout » généralise. Bienveillance et responsabilité vont ensemble : reconnaître le fait, choisir un ajustement concret et poursuivre la journée.',
      'لاحظ كلماتك بعد لحظة صعبة. هل تقولها لصديق؟ صف الحدث دون تحويله إلى وصف دائم لنفسك. «فاتني المشي» تترك مجالاً لخطوة تالية، بينما «أنا أفشل دائماً» تعميم واسع. اللطف لا يمنع المسؤولية: اعترف بما حدث واختر تعديلاً عملياً ثم أكمل يومك.',
    ),
    c(
      'Rewrite one harsh thought as a factual, kind next step.',
      'Transformez une pensée dure en prochaine étape factuelle et douce.',
      'حوّل فكرة قاسية إلى خطوة تالية واقعية ولطيفة.',
    ),
  ],
  [
    'knowledge',
    c('Separate observation from inference', 'Observer ou interpréter', 'الملاحظة والاستنتاج'),
    c(
      'An observation describes what you can directly notice. An inference is an explanation you build from it. A wet pavement is an observation; “it rained” is one possible inference, but someone might have washed it. Separating the two helps you stay curious. Ask what other explanation could fit, and what additional evidence would help. You can use this habit when reading news, debugging code or interpreting an everyday conversation.',
      'Une observation décrit ce que vous constatez. Une interprétation propose une explication. Un trottoir mouillé est une observation ; « il a plu » est une possibilité, mais il a pu être lavé. Distinguer les deux aide à rester curieux. Cherchez une autre explication et les preuves utiles. Essayez en lisant, en corrigeant du code ou dans une conversation.',
      'الملاحظة تصف ما تراه مباشرة، والاستنتاج تفسير تبنيه عليها. رصيف مبلل ملاحظة، و«هطل المطر» تفسير محتمل لكن ربما غسله أحدهم. الفصل بينهما يساعد على الفضول. اسأل عن تفسير بديل ودليل إضافي قد يساعدك. استخدم هذه العادة عند قراءة الأخبار أو تصحيح الشيفرة أو فهم محادثة يومية.',
    ),
    c(
      'Name one observation nearby and two possible explanations.',
      'Nommez une observation proche et deux explications possibles.',
      'اذكر ملاحظة قريبة وتفسيرين محتملين لها.',
    ),
  ],
];
export const lessons: LearningLesson[] = lessonRows.map(([category, title, body, practice]) => ({
  id: category,
  category,
  title,
  body,
  practice,
}));
export const meals: Meal[][] = [
  [
    c(
      'Oats, fruit and fortified soy yogurt',
      'Avoine, fruit et yaourt de soja enrichi',
      'شوفان وفاكهة وزبادي صويا مدعم',
    ),
    c('Wholegrain toast, eggs and tomato', 'Pain complet, œufs et tomate', 'خبز كامل وبيض وطماطم'),
    c('Yogurt, oats and berries', 'Yaourt, avoine et fruits rouges', 'زبادي وشوفان وتوت'),
    c(
      'Hummus, wholegrain toast and cucumber',
      'Houmous, pain complet et concombre',
      'حمص وخبز كامل وخيار',
    ),
  ],
  [
    c(
      'Lentils, brown rice and vegetables',
      'Lentilles, riz complet et légumes',
      'عدس وأرز بني وخضروات',
    ),
    c('Fish, potatoes and salad', 'Poisson, pommes de terre et salade', 'سمك وبطاطس وسلطة'),
    c(
      'Chickpeas, wholegrain couscous and vegetables',
      'Pois chiches, couscous complet et légumes',
      'حمص وكسكس كامل وخضروات',
    ),
    c('Tofu, quinoa and broccoli', 'Tofu, quinoa et brocoli', 'توفو وكينوا وبروكلي'),
  ],
  [
    c('Fruit and unsalted nuts', 'Fruit et noix non salées', 'فاكهة ومكسرات دون ملح'),
    c('Plain yogurt and a pear', 'Yaourt nature et poire', 'زبادي طبيعي وإجاصة'),
    c('Carrot sticks and hummus', 'Carottes et houmous', 'جزر وحمص'),
    c('Apple and nut butter', 'Pomme et purée d’oléagineux', 'تفاح وزبدة مكسرات'),
  ],
  [
    c(
      'Bean soup, vegetables and wholegrain bread',
      'Soupe de haricots, légumes et pain complet',
      'حساء فاصوليا وخضروات وخبز كامل',
    ),
    c(
      'Chicken, brown rice and vegetables',
      'Poulet, riz complet et légumes',
      'دجاج وأرز بني وخضروات',
    ),
    c(
      'Omelette, salad and wholegrain toast',
      'Omelette, salade et pain complet',
      'عجة وسلطة وخبز كامل',
    ),
    c(
      'Tofu, vegetables and wholegrain noodles',
      'Tofu, légumes et nouilles complètes',
      'توفو وخضروات ومعكرونة كاملة',
    ),
  ],
].map((group, slot) =>
  group.map((title, index) => ({
    id: `${slot}-${index}`,
    title,
    vegan: slot === 0 ? [0, 3].includes(index) : slot === 3 ? [0, 3].includes(index) : index !== 1,
    vegetarian: !([1, 3].includes(slot) && index === 1),
  })),
);
export const reminders: Record<ReminderId, { title: Copy; body: Copy; time: string }> = {
  bedtime: {
    title: c('Bedtime alert — time to sleep', 'Alerte coucher — il est temps de dormir', 'تنبيه النوم — حان وقت الراحة'),
    body: c('It is your chosen bedtime. Put the phone down and prepare to sleep. Tap to check your evening routine.', 'C’est votre heure de coucher. Posez le téléphone et préparez-vous à dormir. Touchez pour voir votre routine du soir.', 'حان موعد نومك الذي اخترته. ضع الهاتف جانبًا واستعد للنوم. اضغط لمراجعة خطوات الراحة المسائية.'),
    time: '22:30',
  },
  morning: {
    title: c('Morning routine', 'Routine du matin', 'روتين الصباح'),
    body: c(
      'Good morning ☀ Start with water and today’s healthy habit.',
      'Bonjour ☀ Un peu d’eau et une bonne habitude pour commencer.',
      'صباح الخير ☀ ابدأ بالماء وعادة اليوم الصحية.',
    ),
    time: '08:00',
  },
  brain: {
    title: c('Brain challenge', 'Défi mémoire', 'تحدي العقل'),
    body: c(
      'Ready for today’s memory exercise?',
      'Prêt pour le défi mémoire du jour ?',
      'هل أنت مستعد لتمرين الذاكرة؟',
    ),
    time: '10:30',
  },
  meal: {
    title: c('A balanced meal', 'Un repas équilibré', 'وجبة متوازنة'),
    body: c(
      'Time to give your body good fuel.',
      'Une pause pour savourer un repas équilibré.',
      'حان وقت وجبة متوازنة لجسمك.',
    ),
    time: '13:00',
  },
  learn: {
    title: c('Learn something', 'Apprendre un peu', 'تعلم شيئاً'),
    body: c('Your short lesson is ready.', 'Votre petite leçon est prête.', 'درسك القصير جاهز.'),
    time: '16:00',
  },
  movement: {
    title: c('Movement break', 'Pause active', 'استراحة حركة'),
    body: c(
      'A short, comfortable walk awaits.',
      'Une petite marche à votre rythme.',
      'فرصة لمشي قصير ومريح.',
    ),
    time: '18:30',
  },
  evening: {
    title: c('Evening routine', 'Routine du soir', 'روتين المساء'),
    body: c(
      'Reflect on your day and wind down.',
      'Faites le bilan et préparez votre soirée calme.',
      'تأمل في يومك واستعد للراحة.',
    ),
    time: '21:30',
  },
};
