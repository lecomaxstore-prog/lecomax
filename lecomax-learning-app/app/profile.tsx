import { router } from 'expo-router';
import { Button, Card, Label, ListItem, Page, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { subjects } from '../services/discovery';
import { CloudProgress } from '../components/CloudProgress';
import { View } from 'react-native';
import { IconTile } from '../components/AcademySignature';
import { analytics } from '../utils/academy';

export default function Profile() {
  const { state, t, colors } = useSchool();
  const p = state.academy.profile;
  return (
    <Page title={p.name || t('Mon profil', 'My profile', 'ملفي')}>
      <Card style={{ backgroundColor: colors.soft, padding: 20, gap: 20 }}>
        <Row style={{ flexWrap: 'nowrap', gap: 14 }}>
          <IconTile icon="person-outline" large />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Label bold size={22}>
            {p.name || t('Votre espace', 'Your learning space', 'مساحتك التعليمية')}
          </Label>
          <Label muted size={13}>
            {analytics(state).achievements.length}{' '}
            {t('étapes franchies', 'milestones earned', 'إنجازات مستحقة')}
          </Label>
          </View>
        </Row>
        <View style={{ gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Label muted size={12}>{t('MON OBJECTIF', 'MY LEARNING GOAL', 'هدفي التعليمي')}</Label>
        <Label bold size={19}>
          {p.goal ||
            t('Votre prochain objectif', 'Your next learning goal', 'هدفك التعليمي القادم')}
        </Label>
        <Row style={{ justifyContent: 'space-between' }}>
        <Label muted size={13}>
          {p.dailyMinutes} {t('minutes par jour', 'minutes per day', 'دقيقة يوميًا')}
        </Label>
        <Label muted size={13}>
          {
            { ar: 'العربية', darija: 'الدارجة المغربية', en: 'English', fr: 'Français' }[
              p.teacherLanguage
            ]
          }
        </Label>
        </Row>
        </View>
        <Button
          title={t(
            'Modifier mon profil et mes objectifs',
            'Edit profile and learning goals',
            'عدّل ملفي وأهدافي',
          )}
          onPress={() => router.push('/onboarding')}
        />
      </Card>
      {subjects
        .filter((s) => state.academy.favorites.includes(s.id))
        .map((s) => (
          <ListItem
            key={s.id}
            title={t(s.title[0], s.title[1], s.title[2])}
            icon="heart-outline"
            onPress={() => router.push({ pathname: '/explore', params: { subject: s.id } })}
          />
        ))}
      <ListItem
        icon="stats-chart-outline"
        title={t('Progrès et historique', 'Progress and learning history', 'التقدّم وسجل التعلّم')}
        onPress={() => router.push('/my-learning')}
      />
      <ListItem
        icon="settings-outline"
        title={t(
          'Thème, rappels et données',
          'Theme, reminders and data',
          'المظهر والتذكيرات والبيانات',
        )}
        subtitle={t(
          'Exporter, restaurer ou supprimer les données locales.',
          'Export, restore or delete local learning data.',
          'تصدير بيانات التعلّم المحلية أو استعادتها أو حذفها.',
        )}
        onPress={() => router.push('/settings')}
      />
      <CloudProgress />
      <ListItem
        icon="grid-outline"
        title={t('Tous mes outils', 'All my tools', 'كل أدواتي')}
        onPress={() => router.push('/more')}
      />
      <ListItem
        icon="time-outline"
        title={t('Historique des changements', 'Changes Made', 'سجل التغييرات')}
        onPress={() => router.push('/change-history')}
      />
    </Page>
  );
}
