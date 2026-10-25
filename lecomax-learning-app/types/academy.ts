import type { Block, Language, Question } from './content';
export type AcademyExercise = {
  id: string; difficulty: number; task: string; hints: string[];
  solution: string; walkthrough: string; expectedResult: string;
};
export type AcademyLesson = {
  schemaVersion: 1; id: string; trackId: string; moduleId: string;
  title: Record<Language, string>; contentLanguage: Language; difficulty: number;
  prerequisites: string[]; objectives: string[]; practiceMinutes: number;
  introduction: string; sections: { title: string; text: string }[];
  examples: (Block & { id: string; filename: string; language: string; code: string; expectedOutput?: string[] })[];
  exercises: AcademyExercise[]; quiz: Question[]; readiness: string[];
  recap: string[]; connections: string;
  references: { title: string; url: string; verifiedOn: string }[];
  sourceFiles: { path: string; sha256: string }[];
};
