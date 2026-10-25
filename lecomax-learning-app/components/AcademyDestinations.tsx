import { View, useWindowDimensions } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSchool } from '../store/School';
import { ToolCard } from './AcademySignature';
import { Label, Button, Row } from './UI';

export function AcademyDestinations() {
  const { t } = useSchool();
  const { width, fontScale } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 380 && fontScale < 1.4 ? 2 : 1;
  const entries = [
    ['/ai-university', 'school-outline', t('Université IA', 'AI University', 'جامعة الذكاء الاصطناعي'), t('Comprendre, coder et construire', 'Understand, code and build', 'افهم وبرمج وابنِ')],
    [
      '/',
      'home-outline',
      t('Accueil', 'Home', 'الرئيسية'),
      t('Votre prochaine étape', 'Your next step', 'خطوتك التالية'),
    ],
    [
      '/explore',
      'book-outline',
      t('Apprendre', 'Learn', 'تعلّم'),
      t('Cours et parcours', 'Courses and pathways', 'دورات ومسارات'),
    ],
    [
      '/teacher',
      'sparkles-outline',
      t('Professeur IA', 'AI Tutor', 'المعلّم الذكي'),
      t('Comprendre avec un guide', 'Understand with a guide', 'افهم مع مرشد'),
    ],
    [
      '/agent-studio',
      'git-network-outline',
      t('Studio des agents', 'Agent Studio', 'استوديو الوكلاء'),
      t('Construire et tester', 'Build and test', 'ابنِ واختبر'),
    ],
    [
      '/wellness',
      'leaf-outline',
      t('Vie saine', 'Healthy Life', 'حياة صحية'),
      t('Des routines durables', 'Sustainable routines', 'عادات مستدامة'),
    ],
    [
      '/curiosity',
      'planet-outline',
      t('Explorer', 'Explore', 'استكشف'),
      t(
        'Terre, sciences et découvertes',
        'Earth, science and discovery',
        'الأرض والعلوم والاكتشاف',
      ),
    ],
    [
      '/practice-lab',
      'code-slash-outline',
      t('Labo de pratique', 'Practice Lab', 'مختبر التدريب'),
      t('Apprendre en faisant', 'Learn by doing', 'تعلّم بالممارسة'),
    ],
    [
      '/my-learning',
      'stats-chart-outline',
      t('Progrès', 'Progress', 'التقدّم'),
      t('Révisions et compétences', 'Reviews and skills', 'مراجعات ومهارات'),
    ],
  ] as const;
  return (
    <View style={{ gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label bold size={22}>
          {t('Votre académie', 'Your academy', 'أكاديميتك')}
        </Label>
        <Button
          quiet
          title={t('Ma semaine', 'My week', 'أسبوعي')}
          onPress={() => router.push('/academy-week' as Href)}
        />
      </Row>
      <Row style={{ alignItems: 'stretch', gap: 12 }}>
        {entries.map(([route, icon, title, description]) => (
          <ToolCard
            key={route}
            icon={icon}
            title={title}
            description={description}
            style={{ width: columns === 4 ? '23%' : columns === 2 ? '47%' : '100%', flexGrow: 1 }}
            onPress={() => router.push(route as Href)}
          />
        ))}
      </Row>
    </View>
  );
}
