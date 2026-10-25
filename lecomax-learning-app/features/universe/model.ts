import type { Progress } from '../../utils/progress';
export type Copy = readonly [string, string, string];
export const journeys = [
  [
    'beginner',
    ['Premiers pas', 'Beginner Journey', 'رحلة المبتدئ'],
    ['Comprendre, essayer, vérifier.', 'Read, try, then check.', 'افهم، جرّب، ثم تحقق.'],
    [0, 1, 2, 3],
  ],
  [
    'deep',
    ['Étude approfondie', 'Deep Study', 'دراسة معمّقة'],
    ['Expliquer, comparer et pratiquer.', 'Explain, compare and practice.', 'اشرح، قارن، وتدرّب.'],
    [0, 1, 2, 3],
  ],
  [
    'career',
    ['Compétences métier', 'Career Skills', 'مهارات مهنية'],
    [
      'Relier le concept à un livrable.',
      'Connect the concept to a deliverable.',
      'اربط المفهوم بنتيجة عملية.',
    ],
    [1, 2, 0, 3],
  ],
  [
    'micro',
    ['Petit pas quotidien', 'Daily Microlearning', 'تعلّم يومي قصير'],
    ['Un concept et une question.', 'One concept and one checkpoint.', 'مفهوم واحد وسؤال للتحقق.'],
    [0, 3],
  ],
  [
    'exam',
    ['Préparation examen', 'Exam Preparation', 'استعداد للامتحان'],
    [
      'Tester, revoir les lacunes, réessayer.',
      'Test first, revisit gaps, then retry.',
      'اختبر أولاً، راجع الثغرات، ثم أعد المحاولة.',
    ],
    [3, 0, 2],
  ],
  [
    'project',
    ['Apprendre par projet', 'Project Journey', 'التعلّم بالمشاريع'],
    ['Construire, observer, expliquer.', 'Build, observe, explain.', 'ابنِ، لاحظ، واشرح.'],
    [2, 1, 0, 3],
  ],
  [
    'curiosity',
    ['Suivre sa curiosité', 'Curiosity & Exploration', 'فضول واستكشاف'],
    [
      'Explorer un exemple et poser une question.',
      'Explore an example and ask a question.',
      'استكشف مثالاً واطرح سؤالاً.',
    ],
    [1, 0, 3],
  ],
] as const;
export type Journey = (typeof journeys)[number][0];
export const selectedJourney = (p: Progress): Journey =>
  journeys.find((j) => j[0] === p.drafts['universe:journey'])?.[0] || 'beginner';
export type SkillState = 'locked' | 'available' | 'progress' | 'mastered' | 'review';
// Completion and self-ratings alone never imply mastery. Require two spaced recalls per assessed question.
export function skillState(
  p: Progress,
  id: string,
  prerequisites: string[] = [],
  now = Date.now(),
): SkillState {
  const reviews = Object.values(p.memory.reviews).filter((r) => r.lessonId === id);
  if (reviews.some((r) => r.dueAt <= now)) return 'review';
  if (reviews.length && reviews.every((r) => r.recalls >= 2) && p.completed.includes(id))
    return 'mastered';
  if (p.completed.includes(id) || p.lastLesson === id || reviews.length || (p.stages[id] || 0) > 0)
    return 'progress';
  if (prerequisites.some((pr) => !p.completed.includes(pr))) return 'locked';
  return 'available';
}
export const skillLabels: Record<SkillState, Copy> = {
  locked: ['Prérequis à explorer', 'Prerequisite needed', 'متطلب سابق'],
  available: ['Prêt à explorer', 'Available', 'متاح'],
  progress: ['En progression', 'In progress', 'قيد التعلّم'],
  mastered: ['Rappel démontré', 'Mastered · spaced recall', 'إتقان باسترجاع متباعد'],
  review: ['À revoir', 'Review needed', 'تحتاج إلى مراجعة'],
};
export const games = [
  ['match', ['Paires mémoire', 'Memory Match', 'أزواج الذاكرة'], 'albums-outline'],
  ['detective', ['Détective des concepts', 'Concept Detective', 'محقق المفاهيم'], 'search-outline'],
  ['error', ['Trouve l’erreur', 'Find the Error', 'اكتشف الخطأ'], 'alert-circle-outline'],
  [
    'sequence',
    ['Construis la séquence', 'Build the Sequence', 'رتّب التسلسل'],
    'git-branch-outline',
  ],
  ['quest', ['Quête du savoir', 'Knowledge Quest', 'رحلة المعرفة'], 'compass-outline'],
  [
    'debug',
    ['Défi débogage', 'Code Debugging Challenge', 'تحدي تصحيح الكود'],
    'code-slash-outline',
  ],
  ['logic', ['Énigmes logiques', 'Logic Puzzles', 'ألغاز منطقية'], 'extension-puzzle-outline'],
  ['speed', ['Rappel express', 'Speed Recall', 'استرجاع سريع'], 'timer-outline'],
  ['explain', ['Explique pour gagner', 'Explain to Win', 'اشرح لتفوز'], 'chatbubbles-outline'],
] as const;
export type Game = (typeof games)[number][0];
export type Subject = 'numbers' | 'javascript';
export type Challenge = {
  prompt: Copy;
  options: Copy[];
  correct: number;
  feedback: Copy;
  order?: number[];
};
const literal = (s: string): Copy => [s, s, s];
// Deterministic, bounded generators with exact answer keys; no generated prose is trusted as a key.
export function challenges(game: Game, subject: Subject, seed: number): Challenge[] {
  if (!Number.isSafeInteger(seed) || seed < 0) throw Error('Invalid seed');
  if (game === 'debug' && subject !== 'javascript') throw Error('Code game requires JavaScript');
  return Array.from({ length: game === 'sequence' ? 3 : 4 }, (_, i) => {
    const a = game === 'match' ? 2 + (seed % 8) + i : 2 + ((seed + i * 3) % 8),
      b = game === 'match' ? 10 : 2 + ((seed + i * 5) % 7),
      n = a + b;
    const correct = (seed + i) % 4;
    const values = [n, n + 1, n - 1, n + 2];
    const options = values.map((_, k) => literal(String(values[(k - correct + 4) % 4])));
    const feedback: Copy = [
      `${a} + ${b} = ${n}. Comptez ${b} unités à partir de ${a}.`,
      `${a} + ${b} = ${n}. Count ${b} units forward from ${a}.`,
      `${a} + ${b} = ${n}. أضف ${b} وحدات إلى ${a}.`,
    ];
    if (game === 'sequence') {
      const ordered: Copy[] =
        subject === 'javascript'
          ? [
              literal(`let total = ${a};`),
              literal(`total += ${b};`),
              literal('console.log(total);'),
            ]
          : [literal(`${a} + ${b}`), literal(`${a} + ${b - 1} + 1`), literal(`${n}`)];
      return {
        prompt:
          subject === 'javascript'
            ? [
                'Initialisez, ajoutez, puis affichez.',
                'Initialize, add, then print.',
                'عرّف المتغير، أضف، ثم اطبع.',
              ]
            : [
                'Ordonnez les étapes du calcul.',
                'Put the calculation steps in order.',
                'رتّب خطوات الحساب.',
              ],
        options: [ordered[2]!, ordered[0]!, ordered[1]!],
        correct: 0,
        order: [1, 2, 0],
        feedback,
      };
    }
    if (game === 'logic')
      return {
        prompt: [
          `Quel nombre suit : ${a}, ${a + b}, ${a + 2 * b}, … ?`,
          `What comes next: ${a}, ${a + b}, ${a + 2 * b}, …?`,
          `ما العدد التالي: ${a}، ${a + b}، ${a + 2 * b}، …؟`,
        ],
        options: [a + 3 * b, a + 2 * b + 1, a + 4 * b, a + b].map((v) => literal(String(v))),
        correct: 0,
        feedback: [
          `On ajoute ${b} à chaque étape.`,
          `Add ${b} at every step.`,
          `نضيف ${b} في كل خطوة.`,
        ],
      };
    if (game === 'debug')
      return {
        prompt: [
          `Objectif : ${n}. Corrigez : let total = "${a}"; total += ${b};`,
          `Goal: ${n}. Fix: let total = "${a}"; total += ${b};`,
          `الهدف: ${n}. صحّح: let total = "${a}"; total += ${b};`,
        ],
        options: [
          literal(`let total = ${a};`),
          literal(`let total = "${a}";`),
          literal('let total = null;'),
          literal(`let total = ${a + 1};`),
        ],
        correct: 0,
        feedback: [
          'Une chaîne avec + concatène. Commencez avec un nombre.',
          'A string with + concatenates. Start with a number.',
          'الجمع مع سلسلة نصية يدمج النصوص. ابدأ بعدد.',
        ],
      };
    if (game === 'error')
      return {
        prompt: [
          `${a} + ${b} = ${n + 1}. Quelle correction faut-il faire ?`,
          `${a} + ${b} = ${n + 1}. Which correction is needed?`,
          `${a} + ${b} = ${n + 1}. ما التصحيح المطلوب؟`,
        ],
        options,
        correct,
        feedback,
      };
    if (game === 'explain')
      return {
        prompt: [
          `Expliquez pourquoi ${a} + ${b} = ${n}, puis identifiez le raisonnement valide.`,
          `Explain why ${a} + ${b} = ${n}, then identify the valid reasoning.`,
          `اشرح لماذا ${a} + ${b} = ${n} ثم حدد الاستدلال الصحيح.`,
        ],
        options: [
          [`Ajouter ${b} unités à ${a}.`, `Add ${b} units to ${a}.`, `أضف ${b} وحدات إلى ${a}.`],
          ['Multiplier les nombres.', 'Multiply the numbers.', 'اضرب العددين.'],
          ['Coller les chiffres.', 'Join the digits as text.', 'ادمج الأرقام كنص.'],
          ['Choisir le plus grand.', 'Choose the larger number.', 'اختر العدد الأكبر.'],
        ],
        correct: 0,
        feedback: [
          'Le score évalue le choix du raisonnement, pas votre texte. Comparez votre explication à ce modèle.',
          'The score checks the reasoning choice, not your prose. Compare your explanation with this model.',
          'تقيّم النقاط اختيار الاستدلال وليس نصك. قارن شرحك بهذا النموذج.',
        ],
      };
    const prompt: Copy =
      subject === 'javascript'
        ? [
            `Quel résultat numérique : ${a} + ${b} ?`,
            `What is the numeric result of ${a} + ${b}?`,
            `ما النتيجة العددية للتعبير ${a} + ${b}؟`,
          ]
        : game === 'detective'
          ? [
              `Je suis ${b} de plus que ${a}. Qui suis-je ?`,
              `I am ${b} more than ${a}. What am I?`,
              `أنا أكبر من ${a} بمقدار ${b}. ما أنا؟`,
            ]
          : [`Combien font ${a} + ${b} ?`, `What is ${a} + ${b}?`, `ما ناتج ${a} + ${b}؟`];
    return { prompt, options, correct, feedback };
  });
}
export type GameAnswer = {
  choice: number[];
  correct: boolean;
  points: number;
  at: number;
  text: string;
};
export type GameRun = {
  version: 1;
  game: Game;
  subject: Subject;
  seed: number;
  index: number;
  answers: GameAnswer[];
  startedAt: number;
  timed: boolean;
};
export function newRun(game: Game, subject: Subject, seed = Date.now(), timed = true): GameRun {
  challenges(game, subject, seed);
  return { version: 1, game, subject, seed, index: 0, answers: [], startedAt: Date.now(), timed };
}
export function readRun(raw?: string): GameRun | null {
  try {
    if (!raw) return null;
    const r = JSON.parse(raw) as GameRun;
    if (
      r.version !== 1 ||
      !games.some((g) => g[0] === r.game) ||
      !['numbers', 'javascript'].includes(r.subject) ||
      typeof r.timed !== 'boolean' ||
      !Number.isSafeInteger(r.startedAt) ||
      r.startedAt < 0 ||
      !Array.isArray(r.answers)
    )
      return null;
    const qs = challenges(r.game, r.subject, r.seed);
    if (
      !Number.isInteger(r.index) ||
      r.index < 0 ||
      r.index > qs.length ||
      r.answers.length < r.index ||
      r.answers.length > Math.min(qs.length, r.index + 1)
    )
      return null;
    if (
      r.answers.some(
        (a) =>
          !a ||
          !Array.isArray(a.choice) ||
          a.choice.length > 4 ||
          a.choice.some((n) => !Number.isInteger(n) || n < -1 || n > 3) ||
          typeof a.correct !== 'boolean' ||
          !Number.isInteger(a.points) ||
          a.points < 0 ||
          a.points > 150 ||
          !Number.isSafeInteger(a.at) ||
          a.at < 0 ||
          typeof a.text !== 'string' ||
          a.text.length > 2000,
      )
    )
      return null;
    return r;
  } catch {
    return null;
  }
}
export function answerRun(r: GameRun, choice: number[], text = '', now = Date.now()): GameRun {
  const q = challenges(r.game, r.subject, r.seed)[r.index];
  if (!q || r.answers[r.index]) return r;
  if (r.game === 'explain' && text.trim().length < 10) return r;
  const elapsed = Math.max(0, now - r.startedAt);
  const expired = r.game === 'speed' && r.timed && elapsed >= 30000;
  const correct = !expired && JSON.stringify(choice) === JSON.stringify(q.order || [q.correct]);
  const points = correct
    ? 100 + (r.game === 'speed' && r.timed ? Math.max(0, Math.floor((30000 - elapsed) / 600)) : 0)
    : 0;
  return {
    ...r,
    answers: [...r.answers, { choice, correct, points, at: now, text: text.slice(0, 2000) }],
  };
}
export function nextRound(r: GameRun, now = Date.now()): GameRun {
  return r.answers[r.index] ? { ...r, index: r.index + 1, startedAt: now } : r;
}
export const gameScore = (r: GameRun) => r.answers.reduce((sum, a) => sum + a.points, 0);
