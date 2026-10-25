import { dayNumber } from './engine';
import { c } from './data';

// A stable daily rotation: reopening the app never changes today's guidance.
export const dailyThemes = [
  {
    title: c('Make room for what matters', 'Faire place à l’essentiel', 'امنح الأهم مكانه'),
    prompt: c(
      'What one result would make today meaningful?',
      'Quel résultat rendrait cette journée utile ?',
      'ما الإنجاز الواحد الذي سيجعل يومك ذا قيمة؟',
    ),
    action: c(
      'Choose one unfinished task and define its smallest useful next step.',
      'Choisissez une tâche en attente et sa prochaine petite étape.',
      'اختر مهمة مؤجلة وحدد أصغر خطوة مفيدة للبدء بها.',
    ),
  },
  {
    title: c('Learn, then apply', 'Apprendre, puis appliquer', 'تعلّم ثم طبّق'),
    prompt: c(
      'What skill would you like to practise today?',
      'Quelle compétence pratiquer aujourd’hui ?',
      'ما المهارة التي تريد ممارستها اليوم؟',
    ),
    action: c(
      'Read or practise for ten minutes, then use one idea in a real task.',
      'Lisez ou pratiquez dix minutes, puis appliquez une idée concrète.',
      'اقرأ أو تدرب عشر دقائق ثم طبّق فكرة واحدة في مهمة حقيقية.',
    ),
  },
  {
    title: c('Keep a small promise', 'Tenir une petite promesse', 'التزم بوعد صغير'),
    prompt: c(
      'What realistic promise can you keep today?',
      'Quelle promesse réaliste pouvez-vous tenir ?',
      'ما الوعد الواقعي الذي يمكنك الوفاء به اليوم؟',
    ),
    action: c(
      'Make the first step easy enough to begin even on a busy day.',
      'Rendez le premier pas assez simple, même pour une journée chargée.',
      'اجعل الخطوة الأولى بسيطة بما يكفي لتبدأ حتى في يوم مزدحم.',
    ),
  },
  {
    title: c('Build your future', 'Construire la suite', 'ابنِ مستقبلك'),
    prompt: c(
      'Which step supports a longer-term goal?',
      'Quelle étape sert un objectif à long terme ?',
      'ما الخطوة التي تقرّبك من هدف بعيد؟',
    ),
    action: c(
      'Spend one focused session on a project, a skill or an application.',
      'Consacrez une séance à un projet, une compétence ou une candidature.',
      'خصص جلسة تركيز لمشروع أو مهارة أو طلب عمل.',
    ),
  },
  {
    title: c('Strengthen a connection', 'Nourrir un lien', 'عزّز علاقة طيبة'),
    prompt: c(
      'Who would you like to make time for?',
      'À qui souhaitez-vous consacrer du temps ?',
      'لمن تريد أن تخصص بعض الوقت؟',
    ),
    action: c(
      'Send a thoughtful message or listen to someone without multitasking.',
      'Envoyez un message attentionné ou écoutez sans faire autre chose.',
      'أرسل رسالة صادقة أو استمع لشخص باهتمام دون الانشغال بشيء آخر.',
    ),
  },
  {
    title: c('Clear a little space', 'Alléger le quotidien', 'خفّف ازدحام يومك'),
    prompt: c(
      'What small task would make tomorrow easier?',
      'Quelle petite tâche faciliterait demain ?',
      'ما المهمة الصغيرة التي ستجعل غدك أسهل؟',
    ),
    action: c(
      'Tidy one surface or finish one small piece of personal admin.',
      'Rangez un espace ou terminez une petite démarche personnelle.',
      'رتب مساحة صغيرة أو أنجز أمراً شخصياً معلقاً.',
    ),
  },
  {
    title: c('Notice your progress', 'Reconnaître ses progrès', 'لاحظ تقدمك'),
    prompt: c(
      'What is worth continuing next week?',
      'Que souhaitez-vous poursuivre la semaine prochaine ?',
      'ما الشيء الذي يستحق الاستمرار عليه الأسبوع المقبل؟',
    ),
    action: c(
      'Name one win, one lesson and one adjustment. Leave time to rest.',
      'Notez une réussite, une leçon et un ajustement. Gardez du repos.',
      'دوّن إنجازاً ودرساً وتعديلاً واحداً، واترك وقتاً للراحة.',
    ),
  },
];
export function dailyTheme(date: string) {
  return dailyThemes[
    ((dayNumber(date) % dailyThemes.length) + dailyThemes.length) % dailyThemes.length
  ]!;
}
