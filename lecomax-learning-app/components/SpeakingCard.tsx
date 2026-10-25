import { router } from 'expo-router';
import { ListItem } from './UI';
import { useSchool } from '../store/School';

export function SpeakingCard() {
  const { t } = useSchool();
  return <ListItem icon="chatbubbles-outline"
    title={t('Parler avec clarté', 'Speak with clarity', 'تكلّم بوضوح')}
    subtitle={t('Organise tes idées et retrouve le fil quand tu bloques.', 'Organize your thoughts and find your words when you get stuck.', 'رتّب أفكارك واستعد تسلسل كلامك عندما تتوقف.')}
    onPress={() => router.push('/speaking')} />;
}
