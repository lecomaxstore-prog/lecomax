import { tasks } from './data';
import type { HabitCompletion } from './types';
export const routineSections = ['morning', 'body', 'food', 'mind', 'evening'] as const;
export type RoutineSection = (typeof routineSections)[number];
export function routineProgress(day: HabitCompletion, section: RoutineSection) {
  const items = tasks.filter((task) => task.section === section);
  return { items, done: items.filter((task) => day.tasks[task.id]).length, total: items.length };
}
const minutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h! * 60 + m!; };
// Local wall-clock times support both conventional and overnight waking schedules.
export function routinePeriod(hour: number, wakeTime = '07:30', sleepTime = '22:30'): RoutineSection {
  const elapsed = ((Math.floor(hour * 60) - minutes(wakeTime)) % 1440 + 1440) % 1440;
  const awake = (minutes(sleepTime) - minutes(wakeTime) + 1440) % 1440;
  if (!awake || elapsed >= Math.max(0, awake - 90)) return 'evening';
  if (elapsed < Math.min(180, awake / 4)) return 'morning';
  if (elapsed < awake * 0.45) return 'food';
  if (elapsed < awake * 0.7) return 'body';
  return 'mind';
}
export function suggestedSection(day: HabitCompletion, hour = new Date().getHours() + new Date().getMinutes() / 60, schedule: { wakeTime: string; sleepTime: string } = day.plan): RoutineSection | undefined {
  if (routineSections.every(section => { const p = routineProgress(day, section); return p.done === p.total; })) return undefined;
  const first = routinePeriod(hour, schedule.wakeTime, schedule.sleepTime);
  // Never send someone back to breakfast or exercise during their sleep window.
  if (first === 'evening') return 'evening';
  const order: RoutineSection[] = first === 'morning' ? ['morning', 'mind', 'body', 'food']
    : first === 'food' ? ['food', 'body', 'mind'] : first === 'body' ? ['body', 'mind', 'food'] : ['mind', 'body', 'food'];
  return order.find(section => { const p = routineProgress(day, section); return p.done < p.total; }) || first;
}
