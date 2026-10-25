import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useSchool } from '../store/School';
import { readCards } from '../features/interactive/model';
import { SectionHeader } from './LearningUI';
import { ToolCard } from './AcademySignature';
import { Button, Row } from './UI';

export function PracticeLaunchpad() {
  const { t, rtl, state } = useSchool();
  const [now] = useState(Date.now);
  const due = readCards(state.drafts['interactive:cards']).filter((card) => card.due <= now).length;
  const items = [
    {
      icon: 'logo-python',
      title: 'Python Studio',
      detail: t('Écrire, exécuter, comprendre.', 'Write, run, understand.', 'اكتب، شغّل، وافهم.'),
      tool: 'python',
    },
    {
      icon: 'logo-javascript',
      title: 'JavaScript Studio',
      detail: t('Donnez vie à vos idées.', 'Bring your ideas to life.', 'حوّل أفكارك إلى برامج.'),
      tool: 'javascript',
    },
    {
      icon: 'server-outline',
      title: 'SQL Playground',
      detail: t('Explorez vos données.', 'Make sense of your data.', 'اكتشف عالم البيانات.'),
      tool: 'sql',
    },
    {
      icon: 'calculator-outline',
      title: t('Labo de maths', 'Mathematics Lab', 'مختبر الرياضيات'),
      detail: t(
        'Des idées à expérimenter.',
        'Ideas you can experiment with.',
        'أفكار يمكنك تجربتها.',
      ),
      tool: 'math',
    },
    {
      icon: 'create-outline',
      title: t('Tableau de réflexion', 'Learning Whiteboard', 'سبورة التعلّم'),
      detail: t('Dessinez votre raisonnement.', 'Sketch your thinking.', 'ارسم خطوات تفكيرك.'),
      tool: 'board',
    },
    {
      icon: 'albums-outline',
      title: t('Cartes mémoire', 'Flashcards', 'بطاقات المراجعة'),
      detail: due
        ? due + ' · ' + t('à réviser', 'due for review', 'للمراجعة')
        : t('Ancrez vos connaissances.', 'Make what you learn stick.', 'ثبّت ما تعلّمته.'),
      tool: 'cards',
    },
  ] as const;
  return (
    <View style={{ gap: 16 }}>
      <SectionHeader
        title={t('Apprendre en faisant', 'Learn by doing', 'تعلّم بالممارسة')}
        action={t('Tout voir', 'All tools', 'كل الأدوات')}
        onPress={() => router.push('/interactive-studio')}
      />
      <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 12 }}>
        {items.map((item) => (
          <ToolCard
            key={item.tool}
            icon={item.icon}
            title={item.title}
            description={item.detail}
            style={{ flexGrow: 1, flexBasis: 230 }}
            onPress={() => router.push(('/interactive-studio?tool=' + item.tool) as Href)}
          />
        ))}
      </View>
      <Row>
        {[
          ['/practice-lab', t('Défis de programmation', 'Coding challenges', 'تحديات البرمجة')],
          ['/knowledge', t('Réviser mes acquis', 'Review what I learned', 'راجع ما تعلّمت')],
          ['/speaking', t('Parler avec clarté', 'Speak with clarity', 'تكلّم بوضوح')],
        ].map(([route, title]) => (
          <Button key={route} quiet title={title!} onPress={() => router.push(route as Href)} />
        ))}
      </Row>
    </View>
  );
}
