/* eslint-disable @typescript-eslint/array-type */
// Generated from the website course types by scripts/migrate.cjs.
export type CourseLanguage = "fr" | "en" | "ar";

export type CourseFileReference = {
  path: string;
  mode: "existing" | "create";
};

export type CodeAnnotation = {
  lines: string;
  label: string;
};

export type AnnotatedCode = {
  language: string;
  filename: string;
  source: string;
  annotations: CodeAnnotation[];
};

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: string;
};

export type CalloutBlock = {
  id: string;
  type: "callout";
  tone: "idea" | "analogy" | "important" | "warning" | "success";
  title: string;
  text: string;
};

export type ListBlock = {
  id: string;
  type: "list";
  title?: string;
  ordered?: boolean;
  items: string[];
};

export type VocabularyBlock = {
  id: string;
  type: "vocabulary";
  items: Array<{ term: string; definition: string }>;
};

export type CodeBlock = {
  id: string;
  type: "code";
  title: string;
  code: AnnotatedCode;
};

export type ContentBlock =
  | ParagraphBlock
  | CalloutBlock
  | ListBlock
  | VocabularyBlock
  | CodeBlock;

export type LessonSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export type TroubleshootingCase = {
  symptom: string;
  cause: string;
  fix: string;
};

export type Solution = {
  explanation: string;
  code: string;
  filename: string;
  language: string;
};

export type Exercise = {
  task: string;
  steps: string[];
  hints: string[];
  solution: Solution;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answerExplanations: string[];
};

export type Lesson = {
  id: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  prerequisites: string[];
  objectives: string[];
  sections: LessonSection[];
  commands: string[];
  expectedResult: string;
  commonErrors: TroubleshootingCase[];
  exercise: Exercise;
  quiz: QuizQuestion[];
  recap: string[];
  next: string;
};

export type CourseModule = {
  id: string;
  order: number;
  icon: string;
  color: string;
  title: string;
  summary: string;
  files: CourseFileReference[];
  lessons: Lesson[];
};

export type CourseManifestModule = {
  id: string;
  order: number;
  icon: string;
  color: string;
  lessonIds: string[];
};

export type CourseManifest = {
  version: number;
  moduleCount: number;
  lessonCount: number;
  modules: CourseManifestModule[];
};

export type CourseIndexModule = {
  id: string;
  title: string;
  summary: string;
  lessonTitles: string[];
  lessonSearchText: string[];
};

export type CourseIndex = {
  language: CourseLanguage;
  modules: CourseIndexModule[];
};
