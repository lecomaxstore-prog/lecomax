import { useLocalSearchParams } from 'expo-router';
import { Page } from '../../components/UI';
import { CourseLessonList } from '../../components/CourseLessonList';
import { index } from '../../services/content';
import { useSchool } from '../../store/School';
export default function Module() {
  const { id, course } = useLocalSearchParams<{ id: string; course?: string }>();
  const { state, t } = useSchool();
  const m = index.find((x) => x.id === id);
  return (
    <Page title={m?.title[state.language] || t('Introuvable', 'Not found', 'غير موجود')}>
      {m && <CourseLessonList modules={[m]} courseId={course} />}
    </Page>
  );
}
