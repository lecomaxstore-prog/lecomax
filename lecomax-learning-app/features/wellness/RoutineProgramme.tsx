import { useLocalSearchParams } from 'expo-router';
import { Card, Label } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useJourney } from './useJourney';
import { TaskCard } from './components';
import { tasks } from './data';
import { dateKey } from './engine';

export function RoutineProgramme() {
  const { reminder } = useLocalSearchParams<{ reminder?: string }>();
  const { state, today, update } = useJourney();
  const { t } = useSchool();
  const day = state?.days[today];
  if (!day) return null;
  const done = tasks.filter(task => day.tasks[task.id]).length;
  return <Card>
    <Label bold size={22}>{reminder === 'bedtime'
      ? t('Il est temps de préparer votre sommeil', 'Time to prepare for sleep', 'حان وقت الاستعداد للنوم')
      : reminder === 'evening'
        ? t('Qu’avez-vous accompli aujourd’hui ?', 'What did you do today?', 'ماذا أنجزت اليوم؟')
        : t('Mon programme complet du jour', 'My full programme for today', 'برنامجي الكامل لهذا اليوم')}</Label>
    <Label muted>{today} · {done}/{tasks.length} {t('étapes réalisées', 'steps completed', 'خطوات منجزة')}</Label>
    <Label>{reminder === 'bedtime'
      ? t('Posez le téléphone, préparez votre espace de repos et laissez les tâches restantes pour demain.', 'Put the phone down, prepare your resting space and leave unfinished tasks for tomorrow.', 'ضع الهاتف جانبًا، وهيّئ مكان راحتك، واترك المهام غير المكتملة للغد.')
      : t('Cochez uniquement ce que vous avez fait. Vous pouvez revenir sur une case ; votre progression est enregistrée pour cette journée.', 'Tick only what you actually did. You can undo a tick; progress is saved for this day.', 'ضع علامة على ما أنجزته بالفعل فقط. يمكنك إلغاء العلامة، ويُحفظ تقدّمك لهذا اليوم.')}</Label>
    {tasks.map(task => <TaskCard key={task.id} task={task} done={!!day.tasks[task.id]} onToggle={() => {
      return update(current => {
        const key = dateKey();
        if (key !== today) return current;
        const currentDay = current.days[key];
        if (!currentDay) return current;
        return { ...current, days: { ...current.days, [key]: { ...currentDay, tasks: { ...currentDay.tasks, [task.id]: !currentDay.tasks[task.id] } } } };
      });
    }} />)}
    {done === tasks.length && <Label bold>{t('Programme terminé. Profitez de votre repos.', 'Programme completed. Enjoy your rest.', 'أكملت برنامجك. استمتع بوقت راحتك.')}</Label>}
  </Card>;
}
