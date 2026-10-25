import type { Language } from './content';

export type Localized = Record<Language, string>;
export type CurriculumPath = {
  id: string;
  title: Localized;
  phase: number;
  modules: string[];
  /** Syllabus is a roadmap, never counted as published lessons. */
  syllabus: string[];
};
export type LessonSupport = {
  objective: string;
  simpler: string;
  analogy: string;
  example: string;
  mistake: string;
  diagram: { title: string; detail: string }[];
  terms: { term: string; definition: string; example: string }[];
  sources: { title: string; url: string }[];
};
