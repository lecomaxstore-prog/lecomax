import type { CourseLanguage } from '../course/types';
export type Text = [string, string, string];
export const text = (value: Text, lang: CourseLanguage) => value[lang === 'fr' ? 0 : lang === 'en' ? 1 : 2];
export type Lesson = {
  id: string; level: number; minutes: number; title: Text; goal: Text; why: Text;
  file: string; anchor: string; simple: Text; transfer: Text;
  task: Text; answer: string[]; hint: Text; prediction: Text; outcome: Text;
  question: Text; options: Text[]; correct: number; module: string;
};
