import { curriculum } from '../data/university/curriculum';
import { index, normalized } from './content';
import type { CurriculumPath } from '../types/university';
import type { Language } from '../types/content';

export function pathModules(path: CurriculumPath) {
  return path.modules.flatMap(id => {
    const module = index.find(m => m.id === id);
    return module ? [module] : [];
  });
}
export function pathLessons(path: CurriculumPath) {
  return pathModules(path).flatMap(m => m.lessons);
}
export function searchPaths(query: string, language: Language) {
  const words = normalized(query).split(/\s+/).filter(Boolean);
  return curriculum.filter(p => {
    const haystack = normalized([p.title[language], p.title.en, ...p.syllabus,
      ...pathLessons(p).map(l => l.title[language])].join(' '));
    return words.every(word => haystack.includes(word));
  });
}
