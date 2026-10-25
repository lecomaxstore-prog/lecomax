import { library } from './course-library';
import { getLesson, index } from './content';
import { currentLearningCourse, courseLearning } from './course-learning';
import type { Progress } from '../utils/progress';
import type { Language } from '../types/content';
import { courseWorkshops } from '../constants/course-workshops';

const pathOrder = ['computer-basics', 'academy-foundations', 'python', 'javascript', 'nextjs', 'full-stack', 'ai-foundations', 'llm-applications', 'ai-agents', 'science-world', 'database', 'api', 'deploy', 'real-site', 'iptv-live', 'iptv'];
export const journeyCourses = library.filter((c) => c.lessons.length > 0).sort((a, b) => pathOrder.indexOf(a.id) - pathOrder.indexOf(b.id));
export const milestones: Record<string, { id: string; lessonId: string }> = {
  python: { id: 'python-stock-report', lessonId: 'python-mastery-capstone' },
  nextjs: { id: 'store-architecture', lessonId: 'capstone-architecture' },
};
export function activeJourney(p: Progress) {
  return (
    journeyCourses.find((c) => c.id === p.journey.activeCourse) ||
    currentLearningCourse(p) ||
    journeyCourses.find((c) => p.academy.enrolled.includes(c.id))
  );
}
export function enrollJourney(p: Progress, courseId: string): Progress {
  const course = journeyCourses.find((c) => c.id === courseId);
  if (!course) throw new Error('Unknown or empty course');
  const next = courseLearning(course, p).next;
  return {
    ...p,
    lastLesson: next?.id || '',
    drafts: { ...p.drafts, 'learning:last-course': courseId },
    journey: { ...p.journey, activeCourse: courseId },
    academy: { ...p.academy, enrolled: [...new Set([...p.academy.enrolled, courseId])] },
  };
}
export function roadmap(courseId: string, p: Progress) {
  const course = journeyCourses.find((c) => c.id === courseId);
  if (!course) return undefined;
  const completed = new Set(p.completed);
  const modules = [...new Set(course.modules)].flatMap((id) => {
    const module = index.find((m) => m.id === id);
    return module?.lessons.length ? [module] : [];
  });
  const stages = modules.map((module, i) => {
    const ids = [...new Set(module.lessons.map((l) => l.id))];
    const done = ids.filter((id) => completed.has(id)).length;
    const required = modules
      .slice(0, i)
      .filter((_, prerequisiteIndex) => prerequisiteIndex >= Math.max(0, modules.findIndex(m => m.id === p.journey.starts[courseId])))
      .filter((m) => m.lessons.some((l) => !completed.has(l.id)))
      .map((m) => m.id);
    const override =
      p.journey.overrides.includes(courseId + ':' + module.id) ||
      p.journey.starts[courseId] === module.id;
    const started = module.lessons.some(
      (l) => Object.hasOwn(p.stages, l.id) || p.academy.visits.some((v) => v.id === l.id),
    );
    return {
      module,
      done,
      total: ids.length,
      required,
      override,
      level: Math.max(1, Math.min(3, Math.min(...module.lessons.map((l) => l.difficulty)))),
      status:
        done === ids.length
          ? 'completed'
          : required.length && !override
            ? 'upcoming'
            : started
              ? 'in-progress'
              : 'available',
    };
  });
  const learning = courseLearning(course, p);
  const next = learning.next;
  const current = stages.find((s) => s.module.lessons.some((l) => l.id === next?.id));
  const milestone = milestones[courseId] || {
    id: 'course-' + courseId + '-project',
    lessonId: course.lessons.at(-1)!.id,
  };
  const workshop = courseWorkshops[course.id];
  const project = milestone && p.journey.projects[milestone.id];
  const projectDone =
    learning.complete &&
    !!(
      project?.reviewed &&
      project.artifact.trim() &&
      milestone &&
      completed.has(milestone.lessonId)
    );
  const pathTotal = learning.total + (milestone ? 1 : 0);
  const pathDone = learning.done + (projectDone ? 1 : 0);
  return {
    course,
    stages,
    next,
    current,
    done: learning.done,
    total: learning.total,
    milestone,
    workshop,
    projectDone,
    pathTotal,
    pathDone,
    pathPercent: Math.round((100 * pathDone) / Math.max(1, pathTotal)),
    percent: learning.total ? Math.round((100 * learning.done) / learning.total) : 0,
    complete: learning.complete,
  };
}
// Sample only existing authored questions. Placement never writes lesson answers/completions.
export function diagnosticQuestions(courseId: string, language: Language) {
  const course = journeyCourses.find((c) => c.id === courseId);
  return (course?.modules || []).slice(0, 2).flatMap((moduleId) => {
    const module = index.find((m) => m.id === moduleId);
    return (module?.lessons || [])
      .flatMap((l) =>
        (getLesson(l.id, language)?.quiz || [])
          .slice(0, 1)
          .map((q) => ({ ...q, key: l.id + '::' + q.id, moduleId })),
      )
      .slice(0, 3);
  });
}
export function placement(courseId: string, answers: Record<string, number>, language: Language) {
  const course = journeyCourses.find((c) => c.id === courseId);
  if (!course) throw new Error('Unknown course');
  const questions = diagnosticQuestions(courseId, language);
  const correct = questions.filter((q) => answers[q.key] === q.correctIndex).length;
  const answered = questions.filter((q) => {
    const n = answers[q.key];
    return n !== undefined && Number.isInteger(n) && n < q.options.length && n >= 0;
  }).length;
  // At least three observations per module; incomplete or small samples never skip a stage.
  let start = 0;
  for (const moduleId of course.modules.slice(0, 2)) {
    const sample = questions.filter((q) => q.moduleId === moduleId);
    if (sample.length < 3 || !sample.every((q) => answers[q.key] === q.correctIndex)) break;
    start++;
  }
  return {
    answered,
    correct,
    total: questions.length,
    recommendedModule: course.modules[Math.min(start, course.modules.length - 1)]!,
  };
}
export function demonstratedSkills(courseId: string, p: Progress) {
  const course = journeyCourses.find((c) => c.id === courseId);
  return (course?.lessons || []).filter(
    (l) =>
      p.completed.includes(l.id) &&
      new Set(
        p.memory.evidence
          .filter((e) => e.lessonId === l.id && e.correct && e.independent)
          .map((e) => e.questionId),
      ).size >= 2 &&
      Object.values(p.memory.reviews)
        .filter((r) => r.lessonId === l.id)
        .some((r) => r.recalls >= 2),
  );
}
export function journeyTutorContext(p: Progress) {
  const course = activeJourney(p);
  const plan = course && roadmap(course.id, p);
  if (!plan) return '';
  return `Curriculum context (records, not qualifications): ${plan.course.title[1]}. Completed ${plan.done}/${plan.total} lessons. Current module: ${plan.current?.module.title.en || 'none'}. Deterministic next lesson: ${plan.next?.id || 'course complete'}. Prerequisite gaps: ${plan.current?.required.join(', ') || 'none'}. Do not award completion, scores, or mastery. Offer hints based on actual submitted answers; AI practice is not a verified assessment.`;
}
