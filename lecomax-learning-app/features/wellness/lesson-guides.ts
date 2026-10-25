import type { Copy, Interest } from './types';

export interface LessonGuide {
  outcome: Copy;
  simple: Copy;
  example: Copy;
  pitfall: Copy;
  steps: [Copy, Copy, Copy];
  question: Copy;
  choices: { text: Copy; feedback: Copy }[];
  correct: number;
  takeaway: Copy;
}
const c = (en: string, fr: string, ar: string): Copy => ({ en, fr, ar });

export const lessonGuides: Record<Interest, LessonGuide> = {
  habits: {
    outcome: c(
      'Turn a good intention into one action you can repeat.',
      'Transformer une bonne intention en un geste facile à répéter.',
      'حوّل نية جيدة إلى فعل بسيط يمكنك تكراره.',
    ),
    simple: c(
      'Give your habit a starting signal. After something you already do, take one small action. Make the first step easy enough for a busy day.',
      'Donnez un signal de départ à votre habitude. Après un geste déjà habituel, faites une petite action. Elle doit rester possible même un jour chargé.',
      'اجعل لعادتك إشارة بداية. بعد فعل تقوم به أصلاً، أضف خطوة صغيرة. اختر خطوة سهلة حتى في يوم مزدحم.',
    ),
    example: c(
      '“I want to read more” is vague. “After breakfast, I will read one paragraph” tells you when to start and exactly what to do. Put the book beside your breakfast place tonight.',
      '« Je veux lire davantage » reste vague. « Après le petit déjeuner, je lis un paragraphe » précise quand commencer et quoi faire. Ce soir, posez le livre près de votre place.',
      '«أريد أن أقرأ أكثر» رغبة غير محددة. «بعد الإفطار سأقرأ فقرة واحدة» تحدد متى تبدأ وماذا تفعل. ضع الكتاب قرب مكان إفطارك هذا المساء.',
    ),
    pitfall: c(
      'Starting with a big promise can make the first step harder. A small action still counts; you can choose to do more later.',
      'Une grande promesse peut compliquer le départ. Un petit geste compte aussi ; vous pourrez en faire plus ensuite.',
      'الوعد الكبير قد يصعّب البداية. الخطوة الصغيرة تُحتسب، ويمكنك فعل المزيد لاحقاً.',
    ),
    steps: [
      c(
        'Pick a daily signal: breakfast, brushing your teeth, or closing your laptop.',
        'Choisissez un repère quotidien : petit déjeuner, brossage des dents ou fermeture de l’ordinateur.',
        'اختر إشارة يومية: الإفطار أو تنظيف الأسنان أو إغلاق الحاسوب.',
      ),
      c(
        'Choose one action that takes about two minutes.',
        'Choisissez un geste d’environ deux minutes.',
        'اختر فعلاً يستغرق نحو دقيقتين.',
      ),
      c(
        'Say: “After ___, I will ___.” Prepare what you need and try it once.',
        'Dites : « Après ___, je vais ___. » Préparez le nécessaire et essayez une fois.',
        'قل: «بعد ___ سأفعل ___». جهز ما تحتاجه وجرب مرة واحدة.',
      ),
    ],
    question: c(
      'Which plan gives you the clearest starting point?',
      'Quel plan donne le point de départ le plus clair ?',
      'أي خطة تعطيك بداية أوضح؟',
    ),
    choices: [
      {
        text: c(
          'I will improve myself when I have time.',
          'Je vais m’améliorer quand j’aurai le temps.',
          'سأطور نفسي عندما أجد وقتاً.',
        ),
        feedback: c(
          'The intention is good, but the time and action are still unclear. Add a daily signal and one specific action.',
          'L’intention est bonne, mais le moment et le geste restent flous. Ajoutez un repère et une action précise.',
          'النية جيدة لكن الوقت والفعل غير واضحين. أضف إشارة يومية وفعلاً محدداً.',
        ),
      },
      {
        text: c(
          'After breakfast, I will read one paragraph.',
          'Après le petit déjeuner, je lis un paragraphe.',
          'بعد الإفطار سأقرأ فقرة واحدة.',
        ),
        feedback: c(
          'Yes. Breakfast is the signal, and one paragraph is a clear, small action.',
          'Oui. Le petit déjeuner est le signal ; un paragraphe est une petite action précise.',
          'صحيح. الإفطار إشارة البداية، وقراءة فقرة فعل صغير ومحدد.',
        ),
      },
    ],
    correct: 1,
    takeaway: c(
      'A familiar signal + a small action = a clear start.',
      'Un repère connu + un petit geste = un départ clair.',
      'إشارة مألوفة + فعل صغير = بداية واضحة.',
    ),
  },
  nutrition: {
    outcome: c(
      'Build one varied meal from foods you already have.',
      'Composer un repas varié avec ce que vous avez déjà.',
      'كوّن وجبة متنوعة من طعام موجود لديك.',
    ),
    simple: c(
      'Use three building blocks: a vegetable, a grain or other starchy food, and a protein food. These are examples to mix and adapt, not strict portions or a diet rule.',
      'Pensez à trois éléments : un légume, une céréale ou un féculent, et une source de protéines. Adaptez les exemples ; ce ne sont ni des portions imposées ni un régime.',
      'فكر في ثلاث مجموعات: خضار، وحبوب أو طعام نشوي، ومصدر بروتين. امزج الأمثلة وعدّلها؛ ليست حصصاً إلزامية أو حمية.',
    ),
    example: c(
      'You have rice, lentils and carrots. Rice is the grain, lentils are a protein food, and carrots add vegetables. That gives you a simple meal idea without buying special products.',
      'Vous avez du riz, des lentilles et des carottes. Le riz est la céréale, les lentilles apportent une source de protéines et les carottes sont les légumes. Pas besoin de produits spéciaux.',
      'لديك أرز وعدس وجزر. الأرز من الحبوب، والعدس مصدر بروتين، والجزر خضار. هكذا تحصل على فكرة وجبة بسيطة دون شراء منتجات خاصة.',
    ),
    pitfall: c(
      'A balanced meal does not have to be expensive or perfect. Adapt foods to your preferences, allergies and individual needs.',
      'Un repas équilibré n’a pas besoin d’être cher ou parfait. Adaptez-le à vos goûts, allergies et besoins personnels.',
      'لا يجب أن تكون الوجبة المتوازنة غالية أو مثالية. عدّل الطعام حسب ذوقك وحساسيتك واحتياجاتك.',
    ),
    steps: [
      c(
        'Name one vegetable you have or enjoy.',
        'Nommez un légume disponible ou apprécié.',
        'اذكر خضاراً لديك أو تحبها.',
      ),
      c(
        'Add a grain or starch, such as rice, bread or potatoes.',
        'Ajoutez une céréale ou un féculent : riz, pain ou pommes de terre.',
        'أضف حبوباً أو نشويات كالأرز أو الخبز أو البطاطس.',
      ),
      c(
        'Choose a protein food that suits you: beans, tofu, eggs or fish, for example.',
        'Choisissez une source de protéines adaptée : haricots, tofu, œufs ou poisson, par exemple.',
        'اختر مصدر بروتين يناسبك مثل الفاصوليا أو التوفو أو البيض أو السمك.',
      ),
    ],
    question: c(
      'You already have rice and carrots. Which addition brings a protein food?',
      'Vous avez déjà du riz et des carottes. Quel ajout apporte une source de protéines ?',
      'لديك أرز وجزر. أي إضافة توفر مصدر بروتين؟',
    ),
    choices: [
      {
        text: c('Lentils.', 'Des lentilles.', 'العدس.'),
        feedback: c(
          'Yes. Lentils are a protein food, so they add a different building block to this meal.',
          'Oui. Les lentilles sont une source de protéines : elles ajoutent un autre élément au repas.',
          'صحيح. العدس مصدر بروتين، فيضيف مجموعة أخرى إلى الوجبة.',
        ),
      },
      {
        text: c(
          'More rice is the only possible choice.',
          'Ajouter du riz est le seul choix possible.',
          'المزيد من الأرز هو الخيار الوحيد.',
        ),
        feedback: c(
          'You can enjoy rice, but it is not the only option. Lentils would add a different type of food.',
          'Vous pouvez aimer le riz, mais ce n’est pas la seule option. Les lentilles ajoutent un autre type d’aliment.',
          'يمكنك الاستمتاع بالأرز لكنه ليس الخيار الوحيد. يضيف العدس نوعاً آخر من الطعام.',
        ),
      },
    ],
    correct: 0,
    takeaway: c(
      'Build variety with familiar foods; perfection is unnecessary.',
      'Variez avec des aliments familiers, sans chercher la perfection.',
      'نوّع بطعام مألوف؛ لا تحتاج إلى الكمال.',
    ),
  },
  sleep: {
    outcome: c(
      'Create a simple transition from a busy day to rest.',
      'Créer une transition simple entre la journée et le repos.',
      'أنشئ انتقالاً بسيطاً من انشغال اليوم إلى الراحة.',
    ),
    simple: c(
      'A wind-down routine is a short sequence of quiet activities before bed. Choose things that help you feel settled. The routine is a gentle cue, not a guarantee that you will fall asleep immediately.',
      'Un rituel du soir est une courte suite d’activités calmes avant le coucher. Choisissez ce qui vous apaise. C’est un repère doux, pas une garantie de sommeil immédiat.',
      'روتين الاسترخاء سلسلة قصيرة من أنشطة هادئة قبل النوم. اختر ما يمنحك السكينة. هو إشارة لطيفة للراحة وليس ضماناً للنوم فوراً.',
    ),
    example: c(
      'Instead of continuing to scroll, Sam puts the phone aside, prepares tomorrow’s clothes and reads a paper book. On a busy evening, Sam uses a shorter version: prepare clothes and read one page.',
      'Au lieu de continuer à faire défiler son téléphone, Sam le pose, prépare ses vêtements et lit un livre papier. Un soir chargé, Sam garde une version courte : vêtements prêts et une page de lecture.',
      'بدلاً من مواصلة التصفح، يضع سامي الهاتف جانباً ويجهز ملابس الغد ويقرأ كتاباً ورقياً. في مساء مزدحم يكتفي بتجهيز الملابس وقراءة صفحة.',
    ),
    pitfall: c(
      'Do not turn bedtime into a performance test. If sleep difficulties persist, discuss them with a qualified health professional.',
      'Ne faites pas du coucher une épreuve de performance. Si les difficultés persistent, parlez-en à un professionnel de santé.',
      'لا تحوّل وقت النوم إلى اختبار أداء. إذا استمرت صعوبات النوم ناقشها مع مختص صحي.',
    ),
    steps: [
      c(
        'Choose a realistic time to begin slowing down.',
        'Choisissez un moment réaliste pour ralentir.',
        'اختر وقتاً واقعياً للبدء بالهدوء.',
      ),
      c(
        'Pick two quiet actions, such as preparing clothes and reading.',
        'Choisissez deux gestes calmes, comme préparer vos vêtements et lire.',
        'اختر فعلين هادئين مثل تجهيز الملابس والقراءة.',
      ),
      c(
        'Prepare one of them now, then try your routine tonight.',
        'Préparez l’un des deux maintenant, puis essayez ce soir.',
        'جهز أحدهما الآن ثم جرّب روتينك الليلة.',
      ),
    ],
    question: c(
      'Your evening is busy. What is a flexible response?',
      'Votre soirée est chargée. Quelle réponse reste souple ?',
      'مساؤك مزدحم. ما التصرف المرن؟',
    ),
    choices: [
      {
        text: c(
          'Use a shorter version of my quiet routine.',
          'Utiliser une version plus courte du rituel.',
          'أستخدم نسخة أقصر من روتيني الهادئ.',
        ),
        feedback: c(
          'Yes. A shorter routine keeps the idea practical without demanding a perfect evening.',
          'Oui. Une version courte reste pratique sans exiger une soirée parfaite.',
          'صحيح. النسخة القصيرة تبقي الفكرة عملية دون المطالبة بمساء مثالي.',
        ),
      },
      {
        text: c(
          'Treat a missed step as failure.',
          'Considérer un geste oublié comme un échec.',
          'أعتبر نسيان خطوة فشلاً.',
        ),
        feedback: c(
          'A missed step is not a verdict. Adjust the routine to the evening you actually have.',
          'Un geste oublié n’est pas un jugement. Adaptez le rituel à votre soirée réelle.',
          'نسيان خطوة ليس حكماً عليك. عدّل الروتين ليناسب مساءك الفعلي.',
        ),
      },
    ],
    correct: 0,
    takeaway: c(
      'Choose a calm transition that fits your real evening.',
      'Choisissez une transition calme adaptée à votre soirée.',
      'اختر انتقالاً هادئاً يناسب مساءك الحقيقي.',
    ),
  },
  productivity: {
    outcome: c(
      'Define one small task and give it a clear finish line.',
      'Définir une petite tâche avec une fin claire.',
      'حدد مهمة صغيرة ونقطة نهاية واضحة لها.',
    ),
    simple: c(
      '“Work on my project” contains many decisions. “Write the title and three bullet points” is a clear next step. Choose one small result before you start.',
      '« Avancer mon projet » demande beaucoup de décisions. « Écrire le titre et trois points » donne une prochaine étape précise. Choisissez un petit résultat avant de commencer.',
      '«سأعمل على مشروعي» عبارة تتضمن قرارات كثيرة. «سأكتب العنوان وثلاث نقاط» خطوة واضحة. حدد نتيجة صغيرة قبل البدء.',
    ),
    example: c(
      'You need to write an email. For five minutes, focus only on a draft of the opening and the request. Put unrelated ideas on a note. If you must stop, write: “Next: add the date.”',
      'Vous devez écrire un e-mail. Pendant cinq minutes, concentrez-vous sur le début et la demande. Notez les autres idées à part. Si vous devez arrêter, écrivez : « Ensuite : ajouter la date. »',
      'تحتاج إلى كتابة رسالة. ركز لخمس دقائق على مسودة المقدمة والطلب فقط. اكتب الأفكار الأخرى في ملاحظة جانبية. إن اضطررت للتوقف فاكتب: «التالي: إضافة التاريخ». ',
    ),
    pitfall: c(
      'A long to-do list is not a single task. Pick one visible result; interruptions do not mean you failed.',
      'Une longue liste n’est pas une seule tâche. Choisissez un résultat visible ; une interruption n’est pas un échec.',
      'القائمة الطويلة ليست مهمة واحدة. اختر نتيجة واضحة، والمقاطعة لا تعني الفشل.',
    ),
    steps: [
      c(
        'Write the one result you want from the next few minutes.',
        'Écrivez le résultat souhaité pour les prochaines minutes.',
        'اكتب النتيجة التي تريدها من الدقائق القادمة.',
      ),
      c(
        'Put unrelated tabs or optional alerts aside where possible.',
        'Écartez si possible les onglets inutiles et les alertes facultatives.',
        'أبعد الصفحات والتنبيهات غير الضرورية إن أمكن.',
      ),
      c(
        'Try five minutes. At the end, note what you finished and the next step.',
        'Essayez cinq minutes, puis notez le résultat et la prochaine étape.',
        'جرّب خمس دقائق ثم سجل ما أنجزت والخطوة التالية.',
      ),
    ],
    question: c(
      'Which task has the clearest finish line?',
      'Quelle tâche a la fin la plus claire ?',
      'أي مهمة لها نقطة نهاية أوضح؟',
    ),
    choices: [
      {
        text: c('Be productive.', 'Être productif.', 'أكون منتجاً.'),
        feedback: c(
          'That is a broad intention. Name something you can actually finish, such as three bullet points.',
          'C’est une intention générale. Nommez un résultat concret, comme trois points écrits.',
          'هذه نية عامة. حدد شيئاً يمكنك إنهاؤه فعلاً مثل كتابة ثلاث نقاط.',
        ),
      },
      {
        text: c(
          'Write three bullet points for my email.',
          'Écrire trois points pour mon e-mail.',
          'أكتب ثلاث نقاط لرسالتي.',
        ),
        feedback: c(
          'Yes. You can see when those three points are written and decide what comes next.',
          'Oui. Vous voyez quand les trois points sont écrits et pouvez choisir la suite.',
          'صحيح. يمكنك ملاحظة اكتمال النقاط الثلاث ثم اختيار ما يليها.',
        ),
      },
    ],
    correct: 1,
    takeaway: c(
      'One small result, then the next step.',
      'Un petit résultat, puis l’étape suivante.',
      'نتيجة صغيرة واحدة ثم الخطوة التالية.',
    ),
  },
  memory: {
    outcome: c(
      'Check what you understood without looking at the text.',
      'Vérifier ce que vous avez compris sans regarder le texte.',
      'تحقق مما فهمته دون النظر إلى النص.',
    ),
    simple: c(
      'Read a short piece, hide it, and explain the main idea in your own words. Reopen it to check. The gap between your answer and the text tells you what to review.',
      'Lisez un court passage, cachez-le et expliquez l’idée avec vos mots. Rouvrez pour vérifier. La différence indique ce qu’il faut revoir.',
      'اقرأ مقطعاً قصيراً ثم أخفه واشرح فكرته بكلماتك. افتحه للتحقق. الفرق بين إجابتك والنص يوضح ما تحتاج لمراجعته.',
    ),
    example: c(
      'You read: “A clear habit uses a signal and a small action.” Hide it. You recall only “small action.” Check the sentence, add “signal,” then say: “After breakfast, read a paragraph.”',
      'Vous lisez : « Une habitude claire associe un repère et un petit geste. » Cachez la phrase. Vous retenez seulement « petit geste ». Vérifiez, ajoutez « repère », puis dites : « Après le petit déjeuner, lire un paragraphe. »',
      'قرأت: «العادة الواضحة تجمع إشارة وفعلًا صغيراً». أخف الجملة. تذكرت «فعلاً صغيراً» فقط. راجع وأضف «إشارة» ثم قل: «بعد الإفطار أقرأ فقرة». ',
    ),
    pitfall: c(
      'Recognising a sentence while reading is different from explaining it yourself. Forgetting a detail is useful feedback, not a medical assessment.',
      'Reconnaître une phrase en la lisant est différent de l’expliquer soi-même. Un détail oublié est une information utile, pas une évaluation médicale.',
      'معرفة الجملة عند قراءتها تختلف عن شرحها بنفسك. نسيان تفصيل ملاحظة مفيدة وليس تقييماً طبياً.',
    ),
    steps: [
      c(
        'Read the simple explanation once, then hide it.',
        'Lisez une fois l’explication simple, puis cachez-la.',
        'اقرأ الشرح البسيط مرة ثم أخفه.',
      ),
      c(
        'Say the main idea and one example without looking.',
        'Dites l’idée principale et un exemple sans regarder.',
        'قل الفكرة الرئيسية ومثالاً دون النظر.',
      ),
      c(
        'Check, correct one missing detail and try again later.',
        'Vérifiez, corrigez un détail manquant et réessayez plus tard.',
        'تحقق وأضف تفصيلاً ناقصاً ثم حاول لاحقاً.',
      ),
    ],
    question: c(
      'You cannot recall one detail. What should you do next?',
      'Vous oubliez un détail. Que faire ensuite ?',
      'لم تتذكر تفصيلاً. ماذا تفعل بعد ذلك؟',
    ),
    choices: [
      {
        text: c(
          'Check it, correct it and try recalling again.',
          'Vérifier, corriger, puis essayer de rappeler.',
          'أتحقق وأصحح ثم أحاول التذكر مجدداً.',
        ),
        feedback: c(
          'Yes. You found exactly what needs another look. Keep the exercise low pressure.',
          'Oui. Vous avez repéré ce qui mérite une nouvelle lecture. Gardez une approche détendue.',
          'صحيح. عرفت تحديداً ما يحتاج لمراجعة. اجعل التدريب دون ضغط.',
        ),
      },
      {
        text: c(
          'Assume I cannot learn this topic.',
          'Conclure que je ne peux pas apprendre ce sujet.',
          'أفترض أنني لا أستطيع تعلم الموضوع.',
        ),
        feedback: c(
          'One forgotten detail does not support that conclusion. Reopen the text and use it to adjust your explanation.',
          'Un détail oublié ne permet pas cette conclusion. Rouvrez le texte pour ajuster votre explication.',
          'نسيان تفصيل واحد لا يثبت ذلك. افتح النص لتعدّل شرحك.',
        ),
      },
    ],
    correct: 0,
    takeaway: c(
      'Read → hide → explain → check.',
      'Lire → cacher → expliquer → vérifier.',
      'اقرأ، أخف، اشرح، ثم تحقق.',
    ),
  },
  technology: {
    outcome: c(
      'Choose a safe way to check an unexpected message.',
      'Choisir une façon sûre de vérifier un message inattendu.',
      'اختر طريقة آمنة للتحقق من رسالة غير متوقعة.',
    ),
    simple: c(
      'When a message asks you to act urgently, pause. Check through the official app or a contact you already trust. Do not use the message itself as your only proof.',
      'Si un message vous presse d’agir, faites une pause. Vérifiez dans l’application officielle ou auprès d’un contact déjà fiable. Le message ne suffit pas comme preuve.',
      'عندما تضغط عليك رسالة لتتصرف بسرعة، توقف. تحقق من التطبيق الرسمي أو عبر جهة تعرف أنها موثوقة. لا تعتبر الرسالة نفسها دليلك الوحيد.',
    ),
    example: c(
      'A text says: “Your parcel is blocked. Pay now.” Instead of opening its link, open the delivery company’s official app yourself and check your tracking number. If unsure, contact the company using details you already know.',
      'Un SMS dit : « Colis bloqué. Payez maintenant. » Au lieu de suivre le lien, ouvrez vous-même l’application officielle et vérifiez le suivi. En cas de doute, utilisez des coordonnées déjà connues.',
      'تقول رسالة: «طردك متوقف. ادفع الآن». بدلاً من فتح الرابط، افتح تطبيق شركة التوصيل الرسمي بنفسك وتحقق من رقم التتبع. إن شككت فتواصل مع الشركة ببيانات تعرفها مسبقاً.',
    ),
    pitfall: c(
      'A familiar logo or good spelling does not prove a message is genuine. Never share a password or verification code in response to an unexpected request.',
      'Un logo connu ou une bonne orthographe ne prouvent rien. Ne partagez pas de mot de passe ou de code suite à une demande inattendue.',
      'الشعار المألوف أو الإملاء الجيد لا يثبتان صحة الرسالة. لا تشارك كلمة مرور أو رمز تحقق استجابة لطلب غير متوقع.',
    ),
    steps: [
      c(
        'Name what the message wants: money, a login, a code or a click.',
        'Identifiez la demande : paiement, connexion, code ou clic.',
        'حدد ما تطلبه الرسالة: مالاً أو تسجيل دخول أو رمزاً أو نقرة.',
      ),
      c(
        'Leave its link unopened while you check independently.',
        'Laissez le lien fermé pendant une vérification indépendante.',
        'اترك الرابط دون فتح أثناء التحقق بشكل مستقل.',
      ),
      c(
        'Use an official app, a saved address or a known contact.',
        'Utilisez une application officielle, une adresse enregistrée ou un contact connu.',
        'استخدم تطبيقاً رسمياً أو عنواناً محفوظاً أو جهة اتصال معروفة.',
      ),
    ],
    question: c(
      'How should you check an unexpected parcel-payment text?',
      'Comment vérifier un SMS inattendu demandant de payer un colis ?',
      'كيف تتحقق من رسالة غير متوقعة تطلب دفع رسوم طرد؟',
    ),
    choices: [
      {
        text: c(
          'Trust it because the logo looks familiar.',
          'Lui faire confiance grâce au logo.',
          'أثق بها لأن الشعار مألوف.',
        ),
        feedback: c(
          'A logo can be copied. Check through a separate official channel instead.',
          'Un logo peut être copié. Vérifiez par un autre canal officiel.',
          'يمكن نسخ الشعار. تحقق عبر قناة رسمية منفصلة.',
        ),
      },
      {
        text: c(
          'Open the official delivery app myself.',
          'Ouvrir moi-même l’application officielle de livraison.',
          'أفتح تطبيق التوصيل الرسمي بنفسي.',
        ),
        feedback: c(
          'Yes. You are checking independently instead of relying on the message link.',
          'Oui. Vous vérifiez indépendamment du lien reçu.',
          'صحيح. أنت تتحقق بشكل مستقل بدلاً من الاعتماد على رابط الرسالة.',
        ),
      },
    ],
    correct: 1,
    takeaway: c(
      'Pause. Open the official service yourself. Verify.',
      'Faire une pause. Ouvrir le service officiel soi-même. Vérifier.',
      'توقف. افتح الخدمة الرسمية بنفسك. تحقق.',
    ),
  },
  growth: {
    outcome: c(
      'Replace a harsh label with a fact and a next step.',
      'Remplacer une étiquette dure par un fait et une prochaine étape.',
      'استبدل الوصف القاسي بحقيقة وخطوة تالية.',
    ),
    simple: c(
      'Describe what happened without turning it into a judgment about your whole self. Then choose one useful action. You can be honest and kind at the same time.',
      'Décrivez le fait sans juger toute votre personne. Choisissez ensuite une action utile. Honnêteté et bienveillance peuvent aller ensemble.',
      'صف ما حدث دون تحويله إلى حكم على نفسك بالكامل. اختر بعدها فعلاً مفيداً. يمكنك أن تكون صادقاً ولطيفاً في الوقت نفسه.',
    ),
    example: c(
      'Harsh label: “I am lazy.” Fact: “I missed my walk today.” Next step: “Tomorrow I will put my shoes by the door.” The revised sentence names the event and something you can change.',
      'Étiquette dure : « Je suis paresseux. » Fait : « J’ai manqué ma marche. » Prochaine étape : « Demain, je pose mes chaussures près de la porte. » La nouvelle phrase décrit le fait et une action possible.',
      'وصف قاسٍ: «أنا كسول». حقيقة: «فاتني المشي اليوم». خطوة تالية: «غداً سأضع حذائي قرب الباب». الجملة الجديدة تحدد الحدث وشيئاً يمكنك تغييره.',
    ),
    pitfall: c(
      'Being kind does not mean pretending nothing happened. Acknowledge the event, then make a practical adjustment.',
      'Être bienveillant ne signifie pas ignorer le fait. Reconnaissez-le, puis choisissez un ajustement concret.',
      'اللطف لا يعني التظاهر بأن شيئاً لم يحدث. اعترف بالحدث ثم اختر تعديلاً عملياً.',
    ),
    steps: [
      c(
        'Notice one harsh sentence you say to yourself.',
        'Repérez une phrase dure envers vous-même.',
        'لاحظ جملة قاسية تقولها لنفسك.',
      ),
      c(
        'Rewrite it as a specific event, without “always” or “never.”',
        'Réécrivez-la comme un fait précis, sans « toujours » ni « jamais ».',
        'أعد كتابتها كحدث محدد دون «دائماً» أو «أبداً». ',
      ),
      c(
        'Add one small next step you could suggest to a friend.',
        'Ajoutez un petit pas que vous proposeriez à un ami.',
        'أضف خطوة صغيرة قد تقترحها على صديق.',
      ),
    ],
    question: c(
      'Which sentence is both kind and specific?',
      'Quelle phrase est bienveillante et précise ?',
      'أي جملة لطيفة ومحددة في الوقت نفسه؟',
    ),
    choices: [
      {
        text: c(
          'I missed today’s practice; I will try a shorter one tomorrow.',
          'J’ai manqué la pratique ; j’en essaierai une plus courte demain.',
          'فاتني تدريب اليوم؛ سأجرب تدريباً أقصر غداً.',
        ),
        feedback: c(
          'Yes. It acknowledges the event and gives a practical next step without a personal label.',
          'Oui. Elle reconnaît le fait et propose une action sans étiquette personnelle.',
          'صحيح. تعترف بالحدث وتقترح فعلاً عملياً دون حكم شخصي.',
        ),
      },
      {
        text: c(
          'I never do anything right.',
          'Je ne fais jamais rien de bien.',
          'أنا لا أفعل أي شيء بشكل صحيح أبداً.',
        ),
        feedback: c(
          'This turns one moment into a sweeping judgment. Name the specific event instead.',
          'Cette phrase transforme un moment en jugement général. Décrivez plutôt le fait précis.',
          'تحوّل هذه الجملة لحظة واحدة إلى حكم شامل. صف الحدث المحدد بدلاً من ذلك.',
        ),
      },
    ],
    correct: 0,
    takeaway: c(
      'Name the fact. Choose the next step. Leave the label behind.',
      'Nommer le fait. Choisir la suite. Laisser l’étiquette.',
      'سمّ الحقيقة واختر الخطوة التالية واترك الوصف القاسي.',
    ),
  },
  knowledge: {
    outcome: c(
      'Tell the difference between what you notice and what you assume.',
      'Distinguer ce que vous constatez de ce que vous supposez.',
      'ميّز بين ما تلاحظه وما تفترضه.',
    ),
    simple: c(
      'An observation is something you directly notice. An inference is an explanation you build from it. One observation can have more than one possible explanation.',
      'Une observation est ce que vous constatez directement. Une interprétation est l’explication que vous proposez. Une même observation peut avoir plusieurs explications.',
      'الملاحظة شيء تراه أو تلاحظه مباشرة. الاستنتاج تفسير تقترحه له. الملاحظة الواحدة قد يكون لها أكثر من تفسير.',
    ),
    example: c(
      'You see a wet pavement: that is an observation. “It rained” is one explanation. “Someone washed the pavement” is another. Seeing a person with a hose would give you additional evidence.',
      'Vous voyez un trottoir mouillé : c’est une observation. « Il a plu » est une explication ; « quelqu’un l’a lavé » en est une autre. Voir une personne avec un tuyau apporterait un indice supplémentaire.',
      'ترى رصيفاً مبللاً: هذه ملاحظة. «هطل المطر» تفسير و«غسله شخص» تفسير آخر. رؤية شخص يحمل خرطوم ماء تضيف دليلاً جديداً.',
    ),
    pitfall: c(
      'A plausible explanation is not automatically a proven fact. You can say “maybe” while looking for more evidence.',
      'Une explication plausible n’est pas forcément un fait prouvé. Vous pouvez dire « peut-être » en cherchant d’autres indices.',
      'التفسير المعقول ليس حقيقة مثبتة تلقائياً. يمكنك قول «ربما» وأنت تبحث عن دليل إضافي.',
    ),
    steps: [
      c(
        'Describe one thing you can directly notice nearby.',
        'Décrivez une chose directement observable autour de vous.',
        'صف شيئاً يمكنك ملاحظته مباشرة حولك.',
      ),
      c(
        'Suggest two different explanations for it.',
        'Proposez deux explications différentes.',
        'اقترح تفسيرين مختلفين له.',
      ),
      c(
        'Name one extra clue that could help you decide.',
        'Nommez un indice supplémentaire qui aiderait à choisir.',
        'اذكر دليلاً إضافياً قد يساعدك على الترجيح.',
      ),
    ],
    question: c(
      'Which statement is an observation?',
      'Quelle phrase est une observation ?',
      'أي عبارة تمثل ملاحظة؟',
    ),
    choices: [
      {
        text: c(
          'Someone must have washed the pavement.',
          'Quelqu’un a forcément lavé le trottoir.',
          'لا بد أن شخصاً غسل الرصيف.',
        ),
        feedback: c(
          'That explains why it might be wet; it is an inference. You need more evidence to confirm it.',
          'C’est une explication possible, donc une interprétation. Il faut d’autres indices pour la confirmer.',
          'هذا تفسير محتمل للبلل، فهو استنتاج. تحتاج دليلاً إضافياً لتأكيده.',
        ),
      },
      {
        text: c('The pavement is wet.', 'Le trottoir est mouillé.', 'الرصيف مبلل.'),
        feedback: c(
          'Yes. This describes what you directly notice without claiming a cause.',
          'Oui. Cela décrit ce que vous constatez, sans affirmer une cause.',
          'صحيح. تصف ما تلاحظه مباشرة دون الجزم بالسبب.',
        ),
      },
    ],
    correct: 1,
    takeaway: c(
      'Notice first. Consider explanations. Look for evidence.',
      'Observer, envisager des explications, chercher des indices.',
      'لاحظ أولاً، فكر في التفسيرات، ثم ابحث عن الدليل.',
    ),
  },
};
