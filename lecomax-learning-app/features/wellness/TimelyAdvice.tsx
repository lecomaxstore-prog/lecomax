import { useState } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Label } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useJourney } from './useJourney';
import { routinePeriod } from './routine';
export function TimelyAdvice() {
  const { now, state } = useJourney();
  const { t, state: school } = useSchool();
  const [linkError, setLinkError] = useState(false);
  if (!state) return null;
  const period = routinePeriod(now.getHours() + now.getMinutes() / 60, state.preferences.wakeTime, state.preferences.sleepTime);
  const rest = period === 'evening';
  const meal = period === 'morning' || period === 'food';
  const advice = rest
    ? t('Votre plage de repos approche ou a commencé. Laissez les tâches manquées pour demain. Avant de dormir, éteignez les écrans au moins 30 minutes et gardez une heure de coucher régulière.', 'Your rest window is approaching or has started. Leave missed tasks for tomorrow. Before bed, turn off screens at least 30 minutes ahead and keep a consistent bedtime.', 'اقترب وقت راحتك أو بدأ. اترك المهام الفائتة للغد. قبل النوم، أغلق الشاشات بنصف ساعة على الأقل وحافظ على موعد نوم منتظم.')
    : meal
      ? t('Pour votre prochain repas, associez des légumes ou un fruit, des céréales complètes et une source de protéines comme les lentilles. Adaptez le repas à votre faim et à vos besoins alimentaires.', 'For your next meal, combine vegetables or fruit, whole grains, and a protein source such as lentils. Adapt the meal to your hunger and dietary needs.', 'في وجبتك القادمة، اجمع خضارًا أو فاكهة وحبوبًا كاملة ومصدر بروتين مثل العدس. عدّل الوجبة حسب جوعك واحتياجاتك الغذائية.')
      : t('Si vous êtes resté assis, faites une courte pause : marchez un peu ou bougez doucement selon vos capacités. Un peu de mouvement vaut mieux que rien ; inutile de tout rattraper.', 'If you have been sitting, take a short break: walk a little or move gently within your abilities. Some movement is better than none; there is no need to catch up on everything.', 'إذا كنت جالسًا منذ فترة، خذ استراحة قصيرة: امشِ قليلًا أو تحرّك بلطف حسب قدرتك. الحركة القليلة أفضل من انعدامها؛ لا حاجة لتعويض كل ما فات.');
  const source = rest ? 'https://www.cdc.gov/sleep/about/index.html' : meal ? 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' : 'https://www.who.int/news-room/fact-sheets/detail/physical-activity';
  return <Card style={{ gap: 12 }}>
    <Label bold size={17}>{t('Un conseil pour maintenant', 'Practical advice for now', 'نصيحة عملية لوقتك الآن')}</Label>
    <Label size={13}>{t('Heure de votre appareil : ', 'Device time: ', 'وقت جهازك: ') + now.toLocaleString(school.language, { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</Label>
    <Label>{advice}</Label>
    <Label muted size={12}>{t('Selon vos horaires de réveil et de sommeil. Ces conseils sont généraux.', 'Based on your wake and sleep settings. This is general wellbeing guidance.', 'حسب مواعيد الاستيقاظ والنوم التي اخترتها. هذه إرشادات عامة للعناية بصحتك.')}</Label>
    <Button quiet title={t('Adapter mes horaires', 'Adjust my schedule', 'تعديل مواعيدي')} onPress={() => router.push('/wellness/preferences')} />
    <Button variant="ghost" icon="open-outline" title={rest ? 'CDC · Sleep' : meal ? 'WHO · Healthy diet' : 'WHO · Physical activity'} onPress={() => { setLinkError(false); void Linking.openURL(source).catch(() => setLinkError(true)); }} />
    {linkError && <Label accessibilityRole="alert">{t('Impossible d’ouvrir la source. Réessayez.', 'Could not open the source. Please retry.', 'تعذّر فتح المصدر. أعد المحاولة.')}</Label>}
  </Card>;
}
