const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const words = text => text.trim().split(/\s+/u).filter(Boolean).length;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
function validateAcademy({ lessons, catalog, coverage, legacyIds = [], repositoryRoot }) {
  const errors = [];
  if (!Array.isArray(lessons) || !Array.isArray(catalog) || !Array.isArray(coverage?.tracks)) return ['invalid academy collection shape'];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const ids = new Set(legacyIds);
  const modules = new Set();
  const locations = new Map();
  const sections = new Set();
  let position = 0;
  for (const module of catalog) {
    check(!modules.has(module.id), 'duplicate module ' + module.id); modules.add(module.id);
    check(module.lessonIds.length > 0, 'empty module ' + module.id);
    for (const language of ['ar', 'en', 'fr']) check(nonempty(module.title[language]) && nonempty(module.summary[language]), 'module localization ' + module.id);
    for (const id of module.lessonIds) {
      check(!locations.has(id), 'duplicate catalog lesson ' + id);
      locations.set(id, { module: module.id, position: position++ });
      check(lessons.some(lesson => lesson.id === id), 'missing lesson ' + id);
    }
  }
  check(coverage.tracks.length === 16, 'all sixteen tracks must be recorded');
  check(new Set(coverage.tracks.map(track => track.id)).size === 16, 'duplicate track');
  coverage.tracks.forEach((track, index) => {
    check(track.order === index + 1, 'invalid track ordering ' + track.id);
    check(track.requiredTopics.length > 0, 'missing coverage topics ' + track.id);
    check(track.status !== 'complete' || track.requiredTopics.every(topic => typeof topic === 'object' && topic.status === 'reviewed' && topic.lessonIds?.length), 'unproven complete track ' + track.id);
    for (const id of track.lessons) check(lessons.some(lesson => lesson.id === id && lesson.trackId === track.id), 'broken track lesson ' + id);
  });
  for (const lesson of lessons) {
    const id = lesson?.id || '(missing id)';
    const arrays = ['prerequisites', 'objectives', 'sections', 'examples', 'exercises', 'quiz', 'readiness', 'recap', 'references', 'sourceFiles'];
    const validShape = lesson && nonempty(lesson.id) && lesson.title && arrays.every(key => Array.isArray(lesson[key]))
      && lesson.sections.every(section => section && typeof section.text === 'string')
      && lesson.examples.every(example => example && Array.isArray(example.annotations))
      && lesson.exercises.every(exercise => exercise && Array.isArray(exercise.hints))
      && lesson.quiz.every(question => question && Array.isArray(question.options));
    check(validShape, 'invalid lesson shape ' + id);
    if (!validShape) continue;
    check(!ids.has(id), 'duplicate lesson ' + id); ids.add(id);
    check(lesson.schemaVersion === 1, 'schema version ' + id);
    check(locations.get(id)?.module === lesson.moduleId, 'orphan or wrong module ' + id);
    check(coverage.tracks.some(track => track.id === lesson.trackId && track.lessons.includes(id)), 'unmapped track lesson ' + id);
    for (const language of ['ar', 'en', 'fr']) check(nonempty(lesson.title[language]), 'missing title ' + id);
    check(['ar', 'en', 'fr'].includes(lesson.contentLanguage), 'invalid language ' + id);
    check(Number.isInteger(lesson.difficulty) && lesson.difficulty >= 1 && lesson.difficulty <= 3, 'invalid difficulty ' + id);
    check(Number.isInteger(lesson.practiceMinutes) && lesson.practiceMinutes > 0, 'invalid practice time ' + id);
    check(lesson.objectives.length >= 3 && lesson.objectives.every(nonempty), 'missing objectives ' + id);
    check(nonempty(lesson.introduction) && nonempty(lesson.connections), 'missing introduction or connections ' + id);
    check(new Set(lesson.prerequisites).size === lesson.prerequisites.length, 'duplicate prerequisite ' + id);
    for (const prerequisite of lesson.prerequisites) {
      check(locations.has(prerequisite), 'broken prerequisite ' + id + ' -> ' + prerequisite);
      check((locations.get(prerequisite)?.position ?? Infinity) < (locations.get(id)?.position ?? -1), 'invalid prerequisite order ' + id);
    }
    check(lesson.sections.length >= 6, 'missing teaching sections ' + id);
    // Word counts are reported for editorial review, never used as a universal depth grade.
    for (const section of lesson.sections) {
      check(nonempty(section.title) && nonempty(section.text), 'empty section ' + id);
      const normalized = section.text.replace(/\s+/g, ' ').trim();
      check(!sections.has(normalized), 'duplicate section content ' + id); sections.add(normalized);
    }
    check(!/content coming soon|TODO:|TODO\b|learn more online/i.test(JSON.stringify(lesson)), 'placeholder ' + id);
    check(lesson.examples.length > 0, 'missing examples ' + id);
    check(new Set(lesson.examples.map(example => example.id)).size === lesson.examples.length, 'duplicate example ' + id);
    for (const example of lesson.examples) {
      check(nonempty(example.code) && nonempty(example.filename) && nonempty(example.language), 'incomplete code ' + id);
      check(example.annotations?.length > 0 && example.annotations.every(note => nonempty(note.lines) && nonempty(note.label)), 'unexplained code ' + id);
    }
    check(lesson.exercises.length >= 3, 'missing exercises ' + id);
    check(new Set(lesson.exercises.map(exercise => exercise.id)).size === lesson.exercises.length, 'duplicate exercise ' + id);
    lesson.exercises.forEach((exercise, index) => {
      check(exercise.difficulty === index + 1, 'exercise progression ' + id);
      check(['task', 'solution', 'walkthrough', 'expectedResult'].every(key => nonempty(exercise[key])) && exercise.hints.length > 0 && exercise.hints.every(nonempty), 'incomplete exercise ' + id + ':' + exercise.id);
    });
    check(lesson.quiz.length >= 3, 'missing assessment ' + id);
    check(new Set(lesson.quiz.map(question => question.id)).size === lesson.quiz.length, 'duplicate quiz ' + id);
    for (const question of lesson.quiz) {
      check(nonempty(question.question) && nonempty(question.explanation), 'incomplete quiz ' + id);
      check(question.options.length >= 2 && question.options.every(nonempty) && new Set(question.options).size === question.options.length, 'invalid quiz options ' + id);
      check(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.options.length, 'invalid correct answer ' + id);
      check(question.answerExplanations?.length === question.options.length && question.answerExplanations.every(nonempty), 'missing answer feedback ' + id);
    }
    check(lesson.readiness.length >= 3 && lesson.readiness.every(nonempty), 'missing readiness ' + id);
    check(lesson.recap.length >= 3 && lesson.recap.every(nonempty), 'missing recap ' + id);
    for (const source of lesson.references) check(nonempty(source.title) && /^https:\/\//.test(source.url) && /^\d{4}-\d{2}-\d{2}$/.test(source.verifiedOn), 'invalid reference ' + id);
    for (const source of lesson.sourceFiles) {
      check(!source.path.split('/').some(segment => segment.startsWith('.')) && !/credential|private.key/i.test(source.path), 'unsafe source path ' + id);
      if (repositoryRoot) {
        const resolved = path.resolve(repositoryRoot, source.path);
        const relative = path.relative(repositoryRoot, resolved);
        check(!relative.startsWith('..') && !path.isAbsolute(relative), 'source outside repository ' + id);
        if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
          try { check(crypto.createHash('sha256').update(fs.readFileSync(resolved)).digest('hex') === source.sha256, 'source drift ' + source.path); }
          catch { errors.push('missing source file ' + source.path); }
        }
      }
    }
  }
  return errors;
}
function readAcademy() {
  const directory = path.join(root, 'data/academy');
  return {
    lessons: fs.readdirSync(path.join(directory, 'lessons')).filter(file => file.endsWith('.json')).map(file => JSON.parse(fs.readFileSync(path.join(directory, 'lessons', file), 'utf8'))),
    catalog: JSON.parse(fs.readFileSync(path.join(directory, 'catalog.json'), 'utf8')),
    coverage: JSON.parse(fs.readFileSync(path.join(directory, 'coverage.json'), 'utf8')),
    legacyIds: require('../data/index.json').flatMap(module => module.lessons.map(lesson => lesson.id)),
    repositoryRoot: path.dirname(root),
  };
}
if (require.main === module) {
  const data = readAcademy();
  const errors = validateAcademy(data);
  const report = { status: errors.length ? 'failed' : 'passed', lessonCount: data.lessons.length,
    explanationWords: Object.fromEntries(data.lessons.map(lesson => [lesson.id, words(lesson.sections.map(section => section.text).join(' '))])),
    completeTracks: data.coverage.tracks.filter(track => track.status === 'complete').length, errors };
  fs.writeFileSync(path.join(root, 'docs/academy/validation.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = errors.length ? 1 : 0;
}
module.exports = { validateAcademy, readAcademy, words };
