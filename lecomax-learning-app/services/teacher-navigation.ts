import type { Language } from '../types/content';

export type TeacherIntent = 'explain' | 'example' | 'practice' | 'plan';
export function teacherLessonRoute(title: string, language: Language, lesson?: string, intent: TeacherIntent = 'explain') {
  const prompts: Record<TeacherIntent, Record<Language, string>> = {
    explain: {
      fr: `Explique « ${title} » simplement, étape par étape. Commence par les bases, donne une analogie concrète et vérifie ma compréhension avec une question.`,
      en: `Explain “${title}” simply, step by step. Start with the basics, give a concrete analogy, and check my understanding with one question.`,
      ar: `اشرح لي «${title}» ببساطة خطوة بخطوة. ابدأ من الأساسيات، أعطني تشبيهًا عمليًا، ثم اسألني سؤالًا واحدًا للتأكد من فهمي.`,
    },
    example: {
      fr: `Montre-moi un exemple concret de « ${title} ». Explique chaque étape, puis propose une petite modification que je peux essayer.`,
      en: `Show me a concrete example of “${title}”. Explain each step, then suggest one small change I can try.`,
      ar: `أعطني مثالًا عمليًا على «${title}». اشرح كل خطوة، ثم اقترح تعديلًا بسيطًا أجربه بنفسي.`,
    },
    practice: {
      fr: `Aide-moi à pratiquer « ${title} ». Donne un petit exercice adapté à mon niveau, attends ma réponse et propose des indices avant la solution.`,
      en: `Help me practise “${title}”. Give me a small exercise at my level, wait for my answer, and offer hints before the solution.`,
      ar: `ساعدني على تطبيق «${title}». أعطني تمرينًا صغيرًا يناسب مستواي، وانتظر إجابتي، وقدّم تلميحات قبل الحل.`,
    },
    plan: {
      fr: `Aide-moi à choisir quoi apprendre pour « ${title} ». Demande d’abord mon niveau et mon objectif, puis propose quelques étapes concrètes sans inventer de cours disponibles dans l’application.`,
      en: `Help me choose what to learn for “${title}”. First ask about my level and goal, then suggest a few concrete steps without inventing courses available in the app.`,
      ar: `ساعدني على اختيار ما أتعلمه من أجل «${title}». اسألني أولًا عن مستواي وهدفي، ثم اقترح خطوات عملية دون اختلاق دورات متاحة داخل التطبيق.`,
    },
  };
  return { pathname: '/(tabs)/teacher' as const, params: { lesson, question: prompts[intent][language], explain: String(Date.now()) } };
}
