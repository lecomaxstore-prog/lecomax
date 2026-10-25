export type LocalText = readonly [string, string, string];
type BaseQuestion = {
  id: string;
  prompt: LocalText;
  explanation: LocalText;
  hint: LocalText;
  skill: string;
  critical?: boolean;
  code?: string;
};
export type AssessmentQuestion = BaseQuestion & (
  | { kind: 'single'; options: readonly LocalText[]; correct: number }
  | { kind: 'multiple'; options: readonly LocalText[]; correct: readonly number[] }
  | { kind: 'number'; expected: number }
  | { kind: 'output'; expected: readonly string[] }
  | { kind: 'order'; options: readonly LocalText[]; correct: readonly number[] }
);
export type Response = string | number[];
export type Assessment = { id: string; title: LocalText; threshold: number; questions: readonly AssessmentQuestion[] };
export type Mission = {
  id: string;
  version: number;
  title: LocalText;
  lessonId: string;
  courseId: string;
  activities: readonly Assessment[];
};
