import { library } from './course-library';
import { lessons, normalized } from './content';
import { dueReviews } from '../utils/learning-memory';
import type { Progress } from '../utils/progress';
import type { Language } from '../types/content';

export const subjects = [
  {
    id: 'technology',
    icon: 'code-slash-outline',
    title: ['Technologie', 'Technology', 'البرمجة والتقنية'],
    topics: [
      'Python',
      'JavaScript',
      'TypeScript',
      'HTML',
      'CSS',
      'React',
      'Next.js',
      'React Native',
      'SQL',
      'APIs',
      'AI',
      'Cybersecurity',
      'Cloud',
      'Data science',
    ],
    courses: ['python', 'nextjs', 'database', 'api', 'academy-foundations'],
  },
  {
    id: 'math',
    icon: 'calculator-outline',
    title: ['Mathématiques', 'Mathematics', 'الرياضيات'],
    topics: [
      'Arithmetic',
      'Algebra',
      'Geometry',
      'Trigonometry',
      'Calculus',
      'Statistics',
      'Probability',
      'Linear algebra',
    ],
    courses: [],
  },
  {
    id: 'science',
    icon: 'planet-outline',
    title: ['Sciences', 'Science', 'العلوم'],
    topics: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth science', 'Car engines'],
    courses: [],
  },
  {
    id: 'languages',
    icon: 'language-outline',
    title: ['Langues', 'Languages', 'اللغات'],
    topics: [
      'English',
      'French',
      'Arabic',
      'Spanish',
      'German',
      'Grammar',
      'Vocabulary',
      'Reading',
      'Writing',
      'Pronunciation',
      'Conversation',
    ],
    courses: [],
  },
  {
    id: 'skills',
    icon: 'briefcase-outline',
    title: ['Compétences pratiques', 'Practical skills', 'مهارات عملية'],
    topics: [
      'Entrepreneurship',
      'Marketing',
      'E-commerce',
      'Graphic design',
      'Finance fundamentals',
      'Communication',
      'Problem-solving',
      'Interview preparation',
    ],
    courses: ['real-site'],
  },
  {
    id: 'world',
    icon: 'earth-outline',
    title: ['Culture et examens', 'World & exams', 'المعرفة والامتحانات'],
    topics: ['Geography', 'History', 'Literature', 'General knowledge', 'Exam preparation'],
    courses: [],
  },
] as const;
export const tools = [
  { title: ['Studio des agents', 'Agent Studio', 'استوديو الوكلاء'], route: '/agent-studio', keywords: 'AI agents tools workflow tests' },
  { title: ['Ma semaine', 'My learning week', 'أسبوعي التعليمي'], route: '/academy-week', keywords: 'weekly plan goals learning routine' },
  {
    title: ['Labo de pratique', 'Practice Lab', 'مختبر التدريب'],
    route: '/practice-lab',
    keywords: 'Python JavaScript SQL exercises',
  },
  {
    title: ['Professeur IA', 'AI Teacher', 'المعلّم الذكي'],
    route: '/teacher',
    keywords: 'AI tutor teacher chat',
  },
  {
    title: ['Révisions', 'Reviews & flashcards', 'المراجعات والبطاقات'],
    route: '/knowledge',
    keywords: 'quiz review memory flashcards',
  },
  {
    title: ['Communication', 'Speaking practice', 'تدريب التحدث'],
    route: '/speaking',
    keywords: 'communication speaking',
  },
] as const;
export function recommendation(p: Progress, now = Date.now()) {
  const difficult = Object.values(p.memory.reviews).find(
    (r) => r.mistakes >= 2 && r.recalls === 0 && lessons.some((l) => l.id === r.lessonId),
  );
  if (difficult)
    return {
      lesson: lessons.find((l) => l.id === difficult.lessonId)!,
      reason: 'support' as const,
    };
  const due = dueReviews(p, now).find((r) => lessons.some((l) => l.id === r.lessonId));
  if (due)
    return { lesson: lessons.find((l) => l.id === due.lessonId)!, reason: 'review' as const };
  const resume = lessons.find((l) => l.id === p.lastLesson && !p.completed.includes(l.id));
  if (resume) return { lesson: resume, reason: 'resume' as const };
  const selected = library.filter((c) => p.academy.enrolled.includes(c.id));
  const goal = normalized(p.academy.profile.goal);
  const matching = library.filter((c) =>
    normalized(c.title.join(' '))
      .split(/\s+/)
      .some((w) => w.length > 3 && goal.includes(w)),
  );
  const candidates = selected.length
    ? selected
    : matching.length
      ? matching
      : goal
        ? []
        : library.slice(0, 1);
  const next = candidates.flatMap((c) => c.lessons).find((l) => !p.completed.includes(l.id));
  return next ? { lesson: next, reason: 'goal' as const } : null;
}
export function personalSearch(p: Progress, query: string, language: Language) {
  const q = normalized(query);
  if (!q) return [];
  const title = (id: string) =>
    lessons.find((l) => l.id === id)?.title[language] ||
    p.academy.plans
      .flatMap((plan) => plan.lessons.map((l, i) => ({ id: `${plan.id}:${i}`, title: l.title })))
      .find((l) => l.id === id)?.title ||
    id;
  return [
    ...Object.entries(p.notes)
      .filter(([id, note]) => normalized(title(id) + ' ' + note).includes(q))
      .map(([id, note]) => ({
        id,
        title: title(id),
        description: note.slice(0, 180),
        kind: 'note',
      })),
    ...p.teacher.history.flatMap((m, i) =>
      normalized(m.content).includes(q)
        ? [
            {
              id: String(i),
              title: m.content.slice(0, 90),
              description: m.role,
              kind: 'conversation',
            },
          ]
        : [],
    ),
    ...tools
      .filter((x) => normalized(x.title.join(' ') + ' ' + x.keywords).includes(q))
      .map((x) => ({
        id: x.route,
        title: x.title[language === 'fr' ? 0 : language === 'en' ? 1 : 2],
        description: x.keywords,
        kind: 'tool',
      })),
    ...p.academy.plans
      .filter((x) => normalized(x.title + ' ' + x.goal).includes(q))
      .map((x) => ({ id: x.id, title: x.title, description: x.goal, kind: 'plan' })),
    ...subjects
      .filter((x) => normalized(x.title.join(' ') + ' ' + x.topics.join(' ')).includes(q))
      .map((x) => ({
        id: x.id,
        title: x.title[language === 'fr' ? 0 : language === 'en' ? 1 : 2],
        description: x.topics.join(' · '),
        kind: 'subject',
      })),
  ];
}
