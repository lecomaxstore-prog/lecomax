export type Language = 'ar' | 'fr' | 'en';
export type Block = {
  title?: string;
  text?: string;
  code?: string;
  filename?: string;
  annotations?: { lines: string; label: string }[];
};
export type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answerExplanations?: string[];
};
export type Lesson = {
  curriculum?: {
    objectives: string[];
    prerequisiteIds: string[];
    rubric: { criterion: string; evidence: string; revise: string }[];
    sources: { title: string; url: string }[];
  };
  academy?: import('./academy').AcademyLesson;
  websiteLesson?: import('./website-course').Lesson;
  language: Language;
  subtitle: string;
  realProjectExample: { file: string; hash: string }[];
  id: string;
  moduleId: string;
  title: string;
  estimatedMinutes: number;
  difficulty: number;
  source: string;
  relatedFiles: string[];
  relatedRoutes: string[];
  tags: string[];
  concept: string;
  explanation: Block[];
  codeExample: Block[];
  exercise: { task: string; hints: string[]; solution: string; checks?: string[] };
  quiz: Question[];
  summary: string[];
  why: string;
  whatIf: string;
  nextLesson: string;
  teaching?: {
    what: string;
    why: string;
    where: string;
    how: string;
    breaks: string;
    modify: string;
  };
  contentLanguage?: Language;
  raw?: unknown;
};
export type Module = { id: string; title: string; summary: string; lessons: Lesson[] };
export type IndexModule = {
  academy?: boolean;
  kind?: 'course' | 'reference' | 'archive';
  id: string;
  title: Record<Language, string>;
  summary: Record<Language, string>;
  lessons: {
    id: string;
    title: Record<Language, string>;
    minutes: number;
    difficulty: number;
    search: Record<Language, string>;
  }[];
};
export type ProjectFile = {
  path: string;
  hash: string;
  lines: number;
  imports: string[];
  importedBy: string[];
  description: Record<Language, string>;
  route: string | null;
};
