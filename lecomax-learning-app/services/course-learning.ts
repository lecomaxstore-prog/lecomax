import type { Progress } from '../utils/progress';
import { visitLesson } from '../utils/academy';
import { library, courseProgress } from './course-library';
import { lessonSequence } from './course-navigation';
import { index } from './content';

type Course = (typeof library)[number];
const checkpointKey = (id: string) => 'learning:course:' + id;
export const courseGroups = [
  { id: 'ai', title: ['IA et agents', 'AI & agents', 'الذكاء الاصطناعي والوكلاء'], courses: ['ai-foundations', 'llm-applications', 'ai-agents'] },
  { id: 'science', title: ['Sciences et monde', 'Science & world knowledge', 'العلوم ومعرفة العالم'], courses: ['science-world'] },
  { id: 'computers', title: ['Ordinateurs', 'Computers', 'الحاسوب'], courses: ['computer-basics'] },
  { id: 'foundations', title: ['1 · Les bases', '1 · Start with the basics', '١ · ابدأ بالأساسيات'], courses: ['academy-foundations', 'python'] },
  { id: 'web', title: ['2 · Sites et interfaces', '2 · Websites & interfaces', '٢ · المواقع والواجهات'], courses: ['javascript', 'nextjs', 'full-stack', 'real-site'] },
  { id: 'backend', title: ['3 · Données et serveurs', '3 · Data & servers', '٣ · البيانات والخوادم'], courses: ['database', 'api', 'deploy'] },
  { id: 'projects', title: ['4 · Projets spécialisés', '4 · Specialized projects', '٤ · مشاريع متخصصة'], courses: ['iptv-live', 'iptv'] },
] as const;

export function currentLearningCourse(state: Progress) {
  const saved = state.drafts['learning:last-course'];
  if (saved?.startsWith('path:') && lessonSequence(saved, state.lastLesson)?.courseId === saved) return undefined;
  const contains = (c: Course) => c.lessons.some(l => l.id === state.lastLesson);
  return library.find(c => c.id === saved && contains(c))
    || library.find(c => state.academy.enrolled.includes(c.id) && contains(c))
    || library.find(c => c.id === lessonSequence(undefined, state.lastLesson)?.courseId);
}

export function recordCourseLesson(state: Progress, id: string, courseId?: string, at = Date.now()) {
  const sequence = lessonSequence(courseId, id);
  const next = visitLesson(state, id, at);
  if (!sequence?.courseId) return next;
  return { ...next, drafts: { ...next.drafts,
    [checkpointKey(sequence.courseId)]: id,
    ['learning:last-course']: sequence.courseId,
  }, journey: { ...next.journey, activeCourse: library.some(c => c.id === sequence.courseId) ? sequence.courseId : '' } };
}

export function courseLearning(course: Course, state: Progress) {
  const checkpoint = state.drafts[checkpointKey(course.id)];
  const legacyVisit = state.academy.visits.find(v => course.lessons.some(l => l.id === v.id) &&
    (state.academy.enrolled.includes(course.id) || library.filter(c => c.lessons.some(l => l.id === v.id)).length === 1));
  const recorded = course.lessons.find(l => l.id === checkpoint) || course.lessons.find(l => l.id === legacyVisit?.id);
  const current = currentLearningCourse(state)?.id === course.id;
  // A shared introductory lesson must not mark every course that contains it as started.
  const uniqueEvidence = course.lessons.some(l =>
    (state.completed.includes(l.id) || Object.hasOwn(state.stages, l.id)) &&
    library.filter(c => c.lessons.some(other => other.id === l.id)).length === 1);
  const started = !!recorded || current || uniqueEvidence;
  const progress = courseProgress(course, state.completed, recorded?.id || (current ? state.lastLesson : ''));
  // Placement changes the learning order, never the completion denominator.
  const startModule = state.journey.starts[course.id];
  const startId = course.modules.some(id => id === startModule)
    ? index.find(m => m.id === startModule)?.lessons[0]?.id : undefined;
  const startIndex = course.lessons.findIndex(l => l.id === startId);
  if (startIndex >= 0 && (!recorded || state.completed.includes(recorded.id))) {
    progress.next = course.lessons.slice(startIndex).find(l => !state.completed.includes(l.id)) || progress.next;
  }
  const complete = progress.total > 0 && progress.done === progress.total;
  return { ...progress, started, complete, saved: state.academy.enrolled.includes(course.id),
    status: complete ? 'completed' : started ? 'in-progress' : 'not-started',
    last: recorded || (current ? course.lessons.find(l => l.id === state.lastLesson) : undefined),
    position: progress.next ? course.lessons.findIndex(l => l.id === progress.next!.id) + 1 : progress.total,
  };
}
