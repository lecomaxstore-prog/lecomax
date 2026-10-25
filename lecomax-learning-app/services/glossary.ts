import glossary from '../data/glossary.json';
import { universityEntries } from '../data/university/lessons';
import type { Language } from '../types/content';

export function glossaryEntries(language: Language) {
  const locale = { fr: 0, en: 1, ar: 2 }[language];
  const legacy = (glossary as [string, string[]][]).map(([term, translations]) => ({
    term, definition: translations[locale] || term, example: '', lessonIds: [] as string[], contentLanguage: language,
  }));
  const authored = universityEntries.flatMap(entry => entry.support.terms.map(term => ({
    ...term, lessonIds: [entry.lesson.id], contentLanguage: 'ar' as Language,
  })));
  const merged = new Map(legacy.map(term => [term.term.toLowerCase(), term]));
  for (const term of authored) merged.set(term.term.toLowerCase(), term);
  return [...merged.values()];
}
