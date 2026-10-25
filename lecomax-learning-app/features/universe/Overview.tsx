import React from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Button, Card, Label, Row } from '../../components/UI';
import { ToolCard } from '../../components/AcademySignature';
import { useSchool } from '../../store/School';
import { JourneyPicker } from './Journey';
import { readRun } from './model';
export function UniverseOverview() {
  const { state, t, colors } = useSchool();
  const active = readRun(state.drafts['universe:game']);
  const weakest = state.tutor.concepts.filter((c) => c.errors.length > 0).at(-1);
  const tools = [
    [
      '/galaxy',
      'planet-outline',
      t('Galaxie du savoir', 'Knowledge Galaxy', 'مجرة المعرفة'),
      t('Reliez vos connaissances.', 'See how your ideas connect.', 'شاهد الروابط بين معارفك.'),
    ],
    [
      '/games',
      'game-controller-outline',
      t('Arcade du savoir', 'Learning Arcade', 'ساحة التعلّم'),
      t('Neuf façons de pratiquer.', 'Nine ways to think and play.', 'تسع طرق للتفكير واللعب.'),
    ],
    [
      '/growth',
      'trending-up-outline',
      t('Croissance personnelle', 'Personal Growth', 'نموّك الشخصي'),
      t('Vos progrès observés.', 'Progress grounded in evidence.', 'تقدّم يستند إلى أدلة.'),
    ],
  ] as const;
  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {tools.map(([route, icon, title, description]) => (
          <ToolCard
            key={route}
            icon={icon}
            title={title}
            description={description}
            style={{ flexBasis: 220, flexGrow: 1 }}
            onPress={() => router.push(route as Href)}
          />
        ))}
      </View>
      <Card style={{ backgroundColor: colors.soft }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label bold size={20}>
            {t('Votre petit défi du jour', 'Your daily spark', 'تحدّيك اليومي')}
          </Label>
          <Label muted>{t('4 questions', '4 questions', '4 أسئلة')}</Label>
        </Row>
        <Label>
          {t(
            'Un problème, une tentative, une idée qui reste.',
            'One problem. One attempt. An idea that stays.',
            'حلّ مسألة، وجرّب فكرة، وتعلّم شيئًا جديدًا.',
          )}
        </Label>
        <Button
          title={
            active
              ? t('Reprendre mon jeu', 'Resume my game', 'تابع التحدّي')
              : t('Choisir mon défi', 'Choose my challenge', 'اختر تحدّيك')
          }
          onPress={() => router.push('/games')}
        />
      </Card>
      <JourneyPicker />
      <Card>
        <Label bold>
          {t('Votre prochain dialogue', 'Your next tutor conversation', 'تعلّم مع معلّمك الذكي')}
        </Label>
        <Label>
          {weakest
            ? t(
                'Reprenez une difficulté observée avec votre professeur.',
                'Revisit an observed difficulty with your teacher.',
                'راجع صعوبة مسجلة مع معلمك.',
              )
            : t(
                'Demandez une explication et mettez-la à l’épreuve.',
                'Ask for an explanation, then put it to the test.',
                'اطلب شرحًا واضحًا، ثم اختبر فهمك.',
              )}
        </Label>
        <Button
          quiet
          title={t('Ouvrir mon professeur IA', 'Open my AI tutor', 'تحدّث مع المعلّم')}
          onPress={() =>
            router.push({
              pathname: '/tutor',
              params: {
                goal:
                  weakest?.concept ||
                  state.academy.profile.goal ||
                  t(
                    'Comprendre un concept et vérifier mon raisonnement',
                    'Understand a concept and check my reasoning',
                    'افهم مفهوماً وتحقق من تفكيري',
                  ),
              },
            })
          }
        />
      </Card>
    </>
  );
}
