import { academyIndex, getAcademyLesson } from './academy';
import { enhanceLesson } from './lesson-enhancements';
import { getStudyLesson, studySkillsIndex } from '../data/study-skills';
import indexData from '../data/index.json';
import projectData from '../data/project.json';
import { modules, sources } from '../data/loaders';
import type { IndexModule, Language, ProjectFile } from '../types/content';
import { getUniversityLesson, universityIndex } from '../data/university/lessons';
import { getIptvLiveLesson, iptvLiveIndex } from '../data/iptv-live';
import { computerIndex, getComputerLesson } from '../data/computer-foundations';
import { appliedIndex, getAppliedLesson } from '../data/applied-foundations';
import { addGuideAssessment } from '../data/guide-assessments';
export const index: IndexModule[] = [...academyIndex, studySkillsIndex, ...universityIndex, ...computerIndex, ...appliedIndex, iptvLiveIndex, ...(indexData as IndexModule[])];
export const project = projectData as ProjectFile[];
export const lessons = index.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
export const courseLessons = lessons.filter(
  (l) => index.find((m) => m.id === l.moduleId)?.kind === 'course',
);
export function getLesson(id: string, language: Language) {
  const appliedLesson = getAppliedLesson(id, language);
  if (appliedLesson) return appliedLesson;
  const computerLesson = getComputerLesson(id, language);
  if (computerLesson) return computerLesson;
  const academyLesson = getAcademyLesson(id, language);
  if (academyLesson) return academyLesson;
  const studyLesson = getStudyLesson(id, language);
  if (studyLesson) return studyLesson;
  const liveLesson = getIptvLiveLesson(id, language);
  if (liveLesson) return liveLesson;
  const authored = getUniversityLesson(id, language);
  if (authored) return authored;
  const entry = lessons.find((l) => l.id === id);
  return addGuideAssessment(enhanceLesson(entry ? modules[language][entry.moduleId]?.().lessons.find((l) => l.id === id) : undefined, language), language);
}
export function getSource(file: string) {
  return sources[file]?.();
}
export function resolveImport(file: string, imported: string) {
  if (!imported.startsWith('.') && !imported.startsWith('@/')) return undefined;
  const parts = (
    imported.startsWith('@/')
      ? imported.slice(2)
      : file.split('/').slice(0, -1).join('/') + '/' + imported
  ).split('/');
  const normalizedParts: string[] = [];
  for (const part of parts) {
    if (part === '..') normalizedParts.pop();
    else if (part && part !== '.') normalizedParts.push(part);
  }
  const base = normalizedParts.join('/');
  return [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find(
    (candidate) => !!sources[candidate],
  );
}
export function normalized(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064b-\u065f]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .toLowerCase()
    .trim();
}
export function searchLessons(query: string, language: Language) {
  const q = normalized(query);
  return lessons.filter(
    (l) =>
      index.find((m) => m.id === l.moduleId)?.kind !== 'archive' &&
      (!q || q.split(/\s+/).every((word) => normalized(l.search[language]).includes(word))),
  );
}
