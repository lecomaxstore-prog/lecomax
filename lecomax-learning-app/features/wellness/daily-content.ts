import { reminderSuppressed } from './reminder-policy';
import { c, reminders } from './data';
import { dayNumber } from './engine';
import type { Copy, Locale, NotificationPreferences, ReminderId } from './types';

type Moment = { title: Copy; encouragement: Copy; actions: [Copy, Copy]; reflection: Copy };
export const dailyMoments: Moment[] = [
  {
    title: c('A fresh start', 'Un nouveau départ', 'بداية جديدة'),
    encouragement: c(
      'You do not need a perfect day to make one good moment.',
      'Pas besoin d’une journée parfaite pour créer un beau moment.',
      'لا تحتاج إلى يوم مثالي لتصنع لحظة جميلة.',
    ),
    actions: [
      c(
        'Choose one small thing you would enjoy doing today. Make room for two minutes of it.',
        'Choisissez une petite chose agréable à faire aujourd’hui. Accordez-lui deux minutes.',
        'اختر شيئًا بسيطًا تستمتع به اليوم وخصص له دقيقتين.',
      ),
      c(
        'Prepare one small thing that will make tomorrow easier.',
        'Préparez une petite chose qui rendra demain plus simple.',
        'جهّز شيئًا صغيرًا يجعل يوم غد أسهل.',
      ),
    ],
    reflection: c(
      'What small comfort are you grateful for today?',
      'Quel petit réconfort appréciez-vous aujourd’hui ?',
      'ما الشيء البسيط الذي منحك راحة اليوم؟',
    ),
  },
  {
    title: c('One gentle step', 'Un petit pas', 'خطوة لطيفة'),
    encouragement: c(
      'Small beginnings count. Start where you are.',
      'Les petits débuts comptent. Partez de là où vous êtes.',
      'البدايات الصغيرة مهمة. ابدأ من مكانك الآن.',
    ),
    actions: [
      c(
        'Pick a task you have postponed. Do only its first tiny step.',
        'Choisissez une tâche reportée. Faites seulement son tout premier pas.',
        'اختر مهمة تؤجلها وأنجز أول خطوة صغيرة منها فقط.',
      ),
      c(
        'Make one corner of your desk or room a little more welcoming.',
        'Rendez un coin de votre bureau ou de votre pièce plus accueillant.',
        'رتّب زاوية صغيرة من مكتبك أو غرفتك لتصبح ألطف.',
      ),
    ],
    reflection: c(
      'What did you manage today, however small?',
      'Qu’avez-vous réussi aujourd’hui, même modestement ?',
      'ما الشيء الذي استطعت فعله اليوم ولو كان صغيرًا؟',
    ),
  },
  {
    title: c('Notice the good', 'Remarquer le beau', 'لاحظ الجمال'),
    encouragement: c(
      'An ordinary day can hold something worth noticing.',
      'Une journée ordinaire peut contenir un moment à apprécier.',
      'قد يحمل يوم عادي لحظة تستحق أن تلاحظها.',
    ),
    actions: [
      c(
        'Look around and name three details you usually overlook.',
        'Regardez autour de vous et nommez trois détails souvent ignorés.',
        'انظر حولك وسمّ ثلاثة تفاصيل لا تنتبه إليها عادة.',
      ),
      c(
        'Listen to a song you like without doing another task.',
        'Écoutez une chanson que vous aimez sans faire autre chose.',
        'استمع إلى شيء تحبه دون الانشغال بمهمة أخرى.',
      ),
    ],
    reflection: c(
      'What did you see, hear or enjoy that made this day yours?',
      'Qu’avez-vous vu, entendu ou apprécié aujourd’hui ?',
      'ما الشيء الذي رأيته أو سمعته أو استمتعت به اليوم؟',
    ),
  },
  {
    title: c('A little kindness', 'Un peu de gentillesse', 'قليل من اللطف'),
    encouragement: c(
      'Kindness can be small, quiet and still meaningful.',
      'La gentillesse peut être discrète et compter beaucoup.',
      'قد يكون اللطف صغيرًا وهادئًا لكنه يترك أثرًا.',
    ),
    actions: [
      c(
        'Think of someone who helped you. If you wish, thank them in your own words.',
        'Pensez à quelqu’un qui vous a aidé. Si vous le souhaitez, remerciez-le avec vos mots.',
        'تذكر شخصًا ساعدك. إن أحببت، اشكره بكلماتك.',
      ),
      c(
        'Write one kind sentence to yourself, as you would to a friend.',
        'Écrivez-vous une phrase bienveillante, comme à un ami.',
        'اكتب لنفسك جملة لطيفة كما تكتب لصديق.',
      ),
    ],
    reflection: c(
      'Whose kindness would you like to remember?',
      'De quelle gentillesse aimeriez-vous vous souvenir ?',
      'أي موقف لطيف تود أن تتذكره؟',
    ),
  },
  {
    title: c('Stay curious', 'Garder sa curiosité', 'ابقَ فضوليًا'),
    encouragement: c(
      'You are allowed to be a beginner. One question is a good start.',
      'Vous avez le droit de débuter. Une question suffit pour commencer.',
      'من حقك أن تكون مبتدئًا. سؤال واحد بداية جيدة.',
    ),
    actions: [
      c(
        'Write one question about something you noticed today. Explore it for two minutes.',
        'Notez une question sur une découverte du jour. Explorez-la deux minutes.',
        'اكتب سؤالًا عن شيء لفت انتباهك اليوم واستكشفه لدقيقتين.',
      ),
      c(
        'Explain one thing you learned this week in your own words.',
        'Expliquez avec vos mots une chose apprise cette semaine.',
        'اشرح بكلماتك شيئًا واحدًا تعلمته هذا الأسبوع.',
      ),
    ],
    reflection: c(
      'What are you glad you learned or tried?',
      'Qu’êtes-vous heureux d’avoir appris ou essayé ?',
      'ما الشيء الذي تسعد لأنك تعلمته أو جربته؟',
    ),
  },
  {
    title: c('Make some space', 'Se laisser de la place', 'امنح نفسك مساحة'),
    encouragement: c(
      'You can pause without earning it first.',
      'Vous pouvez faire une pause sans devoir la mériter.',
      'يمكنك أخذ استراحة دون أن تحتاج إلى استحقاقها أولًا.',
    ),
    actions: [
      c(
        'Put one optional task aside for a moment. Enjoy two quiet minutes.',
        'Mettez une tâche facultative de côté. Profitez de deux minutes tranquilles.',
        'ضع مهمة غير ضرورية جانبًا واستمتع بدقيقتين هادئتين.',
      ),
      c(
        'Choose one thing you can simplify today instead of doing more.',
        'Choisissez une chose à simplifier aujourd’hui au lieu d’en faire plus.',
        'اختر شيئًا يمكنك تبسيطه اليوم بدل أن تضيف المزيد.',
      ),
    ],
    reflection: c(
      'What gave you a moment of ease today?',
      'Qu’est-ce qui vous a offert un moment de douceur ?',
      'ما الذي منحك لحظة هدوء اليوم؟',
    ),
  },
  {
    title: c('Keep the good moments', 'Garder les bons moments', 'احتفظ باللحظات الجميلة'),
    encouragement: c(
      'Your effort matters, including the effort nobody sees.',
      'Vos efforts comptent, même ceux que personne ne voit.',
      'جهدك مهم، حتى الجهد الذي لا يراه أحد.',
    ),
    actions: [
      c(
        'Recall one good moment from this week. Write down a detail you want to keep.',
        'Repensez à un bon moment de la semaine. Notez un détail à garder.',
        'تذكر لحظة جميلة من هذا الأسبوع واكتب تفصيلًا تريد الاحتفاظ به.',
      ),
      c(
        'Choose a small, enjoyable plan for the coming week.',
        'Choisissez un petit projet agréable pour la semaine à venir.',
        'اختر نشاطًا صغيرًا وممتعًا للأسبوع القادم.',
      ),
    ],
    reflection: c(
      'What would you like to thank yourself for?',
      'Pour quoi aimeriez-vous vous remercier ?',
      'على ماذا تود أن تشكر نفسك؟',
    ),
  },
];

export function dailyMoment(date: string) {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const moment = dailyMoments[weekday]!;
  const variant = ((Math.floor(dayNumber(date) / 7) % 2) + 2) % 2;
  return { ...moment, action: moment.actions[variant]!, id: `${weekday}-${variant}` };
}

// Seven recurring weekly triggers cover every calendar day without expiring.
// Keep journal entries entirely separate from notification content.
export function reminderMessage(id: ReminderId, weekday: number, language: Locale) {
  const moment = dailyMoments[weekday - 1]!;
  if (id === 'bedtime') return { title: reminders.bedtime.title[language], body: reminders.bedtime.body[language] };
  if (id === 'morning') return {
    title: { en: 'Check your programme for today', fr: 'Découvrez votre programme du jour', ar: 'اطّلع على برنامج يومك' }[language],
    body: { en: 'Your daily routine is ready. Tap to see the full programme and tick off each step as you do it.', fr: 'Votre routine est prête. Touchez pour voir le programme complet et cocher chaque étape réalisée.', ar: 'روتينك اليومي جاهز. اضغط لعرض البرنامج كاملًا، وضع علامة على كل خطوة تنجزها.' }[language],
  };
  if (id === 'evening') return {
    title: { en: 'Have you done your programme today?', fr: 'Avez-vous suivi votre programme aujourd’hui ?', ar: 'هل أنجزت برنامجك اليوم؟' }[language],
    body: { en: 'Tap to review what you completed and what remains. Record what you actually did, then wind down.', fr: 'Touchez pour revoir les étapes terminées et restantes. Notez ce que vous avez fait, puis reposez-vous.', ar: 'اضغط لمراجعة ما أنجزته وما تبقّى. سجّل ما فعلته بالفعل، ثم خذ وقتك للراحة.' }[language],
  };
  return {
    title: reminders[id].title[language],
    body: `${reminders[id].body[language]} ${moment.encouragement[language]}`,
  };
}

export function reminderPreset(
  p: NotificationPreferences,
  mode: 'daily' | 'twice' | 'routine' | 'all',
): NotificationPreferences {
  return {
    ...p,
    enabled: true,
    categories: Object.fromEntries(
      Object.entries(p.categories).map(([id, value]) => [
        id,
        {
          ...value,
            enabled: mode === 'all' || id === 'morning' || ((mode === 'twice' || mode === 'routine') && id === 'evening') || (mode === 'routine' && id === 'bedtime'),
        },
      ]),
    ) as NotificationPreferences['categories'],
  };
}

export function nextReminder(p: NotificationPreferences, now = new Date()) {
  if (!p.enabled) return undefined;
  return Object.entries(p.categories)
    .flatMap(([id, value]) => {
      if (!value.enabled || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) || reminderSuppressed(p, value.time)) return [];
      const [hour, minute] = value.time.split(':').map(Number);
      const date = new Date(now);
      date.setHours(hour!, minute!, 0, 0);
      if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 1);
      return [{ id: id as ReminderId, date }];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}
