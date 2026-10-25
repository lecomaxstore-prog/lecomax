import environmentSteps from '../data/python-environment-guide.json';
import entries from '../data/lesson-enhancements.json';
import type { Lesson, Language } from '../types/content';
export function enhanceLesson(lesson: Lesson | undefined, language: Language): Lesson | undefined {
  if (!lesson) return undefined;
  const lang = { fr: 0, en: 1, ar: 2 }[language];
  const pick = (values: string[]) => values[lang]!;
  if (lesson.id === 'guide-python-7') {
    const goal = pick(['Préparer une boîte à outils Python pour ce projet et vérifier FastAPI.', 'Prepare a Python toolbox for this project and check FastAPI.', 'جهّز صندوق أدوات Python لهذا المشروع وتحقّق من FastAPI.']);
    return { ...lesson, subtitle: goal, concept: goal,
      explanation: environmentSteps.map((step) => ({ title: pick(step.title), text: pick(step.purpose) + '\n\n' + pick(step.result) })),
      teaching: undefined,
      exercise: { ...lesson.exercise,
        task: pick(['Suis les 4 étapes dans Exemple / Code sur ton ordinateur. Note le résultat de la vérification puis explique pourquoi installation et vérification utilisent le même Python dans .venv.', 'Follow the 4 Code steps on your computer. Record the check result, then explain why installation and checking use the same Python inside .venv.', 'اتبع الخطوات الأربع في تبويب الكود على حاسوبك. سجّل نتيجة الفحص ثم اشرح لماذا يستخدم التثبيت والتحقّق Python نفسه داخل .venv.']),
        hints: [pick(['Chaque environnement a ses propres bibliothèques.', 'Each environment has its own packages.', 'لكل بيئة مكتباتها الخاصة.'])],
        solution: pick(['FastAPI OK confirme que ce Python charge FastAPI. Un autre Python peut ne pas avoir cette bibliothèque. Installer une bibliothèque ne lance pas le serveur.', 'FastAPI OK confirms that this Python loads FastAPI. Another Python might not have that package. Installing a library does not start a server.', 'تؤكد FastAPI OK أن Python هذا يحمّل FastAPI. قد لا تكون المكتبة موجودة في Python آخر. تثبيت المكتبة لا يشغّل الخادم.']),
      },
      quiz: [{ id: 'venv-same-python', question: pick(['FastAPI est installé dans .venv. Pourquoi un autre Python peut-il dire « module introuvable » ?', 'FastAPI is installed inside .venv. Why might another Python say “module not found”?', 'ثبّتّ FastAPI داخل .venv. لماذا قد يقول Python آخر إن المكتبة غير موجودة؟']),
        options: [pick(['Les environnements peuvent avoir des bibliothèques différentes.', 'The environments can have different installed packages.', 'قد تختلف المكتبات المثبّتة بين البيئات.']), pick(['Il faut lancer un serveur avant chaque import.', 'You must start a server before every import.', 'يجب تشغيل خادم قبل كل import.']), pick(['Le bouton Copier a désinstallé FastAPI.', 'The Copy button uninstalled FastAPI.', 'زر النسخ أزال FastAPI.'])],
        correctIndex: 0, explanation: pick(['Utilise le chemin Python de .venv pour installer puis vérifier dans le même environnement.', 'Use the .venv Python path to install and check within the same environment.', 'استخدم مسار Python داخل .venv للتثبيت والفحص في البيئة نفسها.']) }],
    };
  }
  const entry = entries.find((item) => item.id === lesson.id);
  if (!entry) return lesson;
  return { ...lesson, subtitle: pick(entry.objective), estimatedMinutes: Math.max(lesson.estimatedMinutes, 15),
    explanation: [...lesson.explanation,
      { title: pick(['Exemple pas à pas', 'Worked example', 'مثال خطوة بخطوة']), text: pick(entry.walkthrough) },
      { title: pick(['Piège à comprendre', 'A mistake to understand', 'خطأ يجب فهمه']), text: pick(entry.mistake) }],
    exercise: { ...lesson.exercise, task: lesson.exercise.task + '\n\n' + pick(entry.challenge), hints: [...lesson.exercise.hints, pick(entry.walkthrough)], solution: lesson.exercise.solution + '\n\n' + pick(entry.solution) },
    quiz: [...lesson.quiz, { id: entry.id + '-understanding', question: pick(entry.question), options: entry.options.map(pick), correctIndex: entry.answer, explanation: pick(entry.mistake) + '\n' + pick(entry.walkthrough) }],
  };
}
