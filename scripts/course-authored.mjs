import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Authored chapters override generated prose while retaining stable learner IDs.
export async function authoredLesson(courseRoot, lang, fallback) {
  if (!['ar', 'en', 'fr'].includes(lang) || !/^[a-z0-9-]+$/.test(fallback.id)) throw new Error('Invalid authored lesson key');
  let text;
  try { text = await readFile(path.join(courseRoot, 'authored', lang, fallback.id + '.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
  const lesson = JSON.parse(text);
  if (lesson.id !== fallback.id || lesson.order !== fallback.order) throw new Error('Authored chapter changes identity/order: ' + fallback.id);
  return lesson;
}

export function authoredSearch(module, lesson, lang) {
  const strings = [];
  function collect(value) {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  }
  collect([module.title, module.summary, lesson]);
  return strings.join(' ').toLocaleLowerCase(lang);
}
