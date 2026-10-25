import { BottomTabBar } from '../../components/BottomTabBar';
import { Tabs } from 'expo-router';
import { useSchool } from '../../store/School';
export default function Layout() {
  const { t } = useSchool();
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      initialRouteName="index"
      screenOptions={{ headerShown: false }}
    >
      {(
        [
          { name: 'index', title: t('Accueil', 'Home', 'الرئيسية'), icon: 'home-outline' },
          { name: 'discover', title: t('Apprendre', 'Learn', 'تعلّم'), icon: 'book-outline' },
          { name: 'teacher', title: t('Prof IA', 'AI Tutor', 'المعلّم'), icon: 'sparkles-outline' },
          {
            name: 'practice',
            title: t('Pratique', 'Practice', 'تدرّب'),
            icon: 'code-slash-outline',
          },
          { name: 'account', title: t('Profil', 'Profile', 'ملفي'), icon: 'person-outline' },
        ] as const
      ).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
          }}
        />
      ))}
      <Tabs.Screen name="path" options={{ href: null }} />
      <Tabs.Screen name="project" options={{ href: null }} />
      <Tabs.Screen name="learning" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}
