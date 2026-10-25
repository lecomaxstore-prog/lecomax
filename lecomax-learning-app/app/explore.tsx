import React, { useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Label,
  ListItem,
  Page,
  Row,
} from '../components/UI';
import { useSchool } from '../store/School';
import { subjects } from '../services/discovery';
import { library } from '../services/course-library';
import { normalized } from '../services/content';
import { toggle } from '../utils/progress';
import { IconTile } from '../components/AcademySignature';

export default function Explore() {
  const { state, update, t, rtl } = useSchool();
  const { subject } = useLocalSearchParams<{ subject?: string }>();
  const [selected, setSelected] = useState(subject || 'all');
  const [goal, setGoal] = useState(state.academy.profile.goal);
  const [query, setQuery] = useState('');
  const [planning, setPlanning] = useState(false);
  const filters = useRef<ScrollView>(null);
  const shown = subjects.filter(
    (s) =>
      (selected === 'all' || s.id === selected) &&
      (!query ||
        normalized(s.title.join(' ') + ' ' + s.topics.join(' ')).includes(normalized(query))),
  );
  return (
    <Page
      wide
      title={t('Explorez vos possibilités', 'Follow your curiosity', 'اتبع فضولك')}
      subtitle={t(
        'Des cours disponibles et un professeur pour vos propres objectifs.',
        'Available courses, and a teacher for your own goals.',
        'دورات متاحة ومعلّم يساعدك على تحقيق أهدافك.',
      )}
    >
      <Card>
        <Label bold size={26}>{t('Explore World · Terre et au-delà', 'Explore World · Earth & beyond', 'استكشف العالم · الأرض وما وراءها')}</Label>
        <Label>{t('Un globe interactif, des découvertes scientifiques et des missions à explorer.', 'An interactive globe, scientific discoveries and learning missions.', 'كرة أرضية تفاعلية واكتشافات علمية ومهام تعليمية.')}</Label>
        <Button icon="earth-outline" title={t('Explorer le monde', 'Explore World', 'استكشف العالم')} onPress={() => router.push('/world')} />
      </Card>
      <Card>
        <Label bold size={23}>
          {t('Explorez une constellation', 'Explore a constellation', 'استكشف كوكبة معرفية')}
        </Label>
        <Label>
          {t(
            'Des cours réels, des concepts reliés et un chemin visible.',
            'Real courses, connected concepts and a visible path forward.',
            'دورات حقيقية ومفاهيم مترابطة وطريق واضح للتقدم.',
          )}
        </Label>
        <Button
          icon="planet-outline"
          title={t('Ouvrir la galaxie du savoir', 'Open Knowledge Galaxy', 'افتح مجرة المعرفة')}
          onPress={() => router.push('/galaxy')}
        />
      </Card>
      <Card>
        <Button
          variant="ghost"
          icon="sparkles-outline"
          expanded={planning}
          title={
            planning
              ? t('Fermer mon objectif', 'Close learning goal', 'أغلق هدفي التعليمي')
              : t('Un parcours pour votre objectif', 'A plan for your own goal', 'مسار يناسب هدفك')
          }
          onPress={() => setPlanning(!planning)}
        />
        {planning && (
          <>
            <Field
              value={goal}
              onChangeText={setGoal}
              maxLength={500}
              multiline
              placeholder={t(
                'Décrivez votre objectif…',
                'Describe your learning goal…',
                'اكتب هدفك التعليمي…',
              )}
            />
            <Button
              disabled={!goal.trim()}
              icon="sparkles-outline"
              title={t(
                'Créer mon parcours avec l’IA',
                'Create my AI learning plan',
                'أنشئ مساري مع المعلّم',
              )}
              onPress={() =>
                router.push({ pathname: '/study-plan', params: { goal: goal.trim() } })
              }
            />
            <Label muted size={12}>
              {t(
                'Internet requis pour créer un parcours. Les leçons enregistrées restent disponibles hors ligne.',
                'Internet is required to generate a plan. Saved lessons remain available offline.',
                'يتطلب إنشاء المسار اتصالًا بالإنترنت. تبقى الدروس المحفوظة متاحة دون اتصال.',
              )}
            </Label>
          </>
        )}
      </Card>
      <Field
        value={query}
        onChangeText={setQuery}
        placeholder={t('Rechercher un sujet', 'Find a subject', 'ابحث عن موضوع')}
      />
      <ScrollView
        ref={filters}
        horizontal
        onContentSizeChange={() => {
          if (rtl) filters.current?.scrollToEnd({ animated: false });
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: rtl ? 'row-reverse' : 'row',
          gap: 8,
          paddingVertical: 2,
        }}
      >
        <Button
          quiet
          selected={selected === 'all'}
          title={t('Tous', 'All subjects', 'كل المواضيع')}
          onPress={() => setSelected('all')}
        />
        {subjects.map((s) => (
          <Button
            key={s.id}
            quiet
            selected={selected === s.id}
            title={t(s.title[0], s.title[1], s.title[2])}
            onPress={() => setSelected(s.id)}
          />
        ))}
      </ScrollView>
      <View style={{ gap: 18 }}>
        {shown.map((s) => {
          const available = library.filter(
            (c) => (s.courses as readonly string[]).includes(c.id) && c.lessons.length,
          );
          return (
            <Card key={s.id}>
              <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <IconTile icon={s.icon} large />
                <Label bold size={20} style={{ flex: 1, minWidth: 0 }}>
                  {t(s.title[0], s.title[1], s.title[2])}
                </Label>
                <IconButton
                  selected={state.academy.favorites.includes(s.id)}
                  icon={state.academy.favorites.includes(s.id) ? 'heart' : 'heart-outline'}
                  label={
                    state.academy.favorites.includes(s.id)
                      ? t('Favori', 'Favorite', 'مفضّل')
                      : t('Suivre', 'Follow', 'متابعة')
                  }
                  onPress={() =>
                    update((p) => ({
                      ...p,
                      academy: { ...p.academy, favorites: toggle(p.academy.favorites, s.id) },
                    }))
                  }
                />
              </Row>
              <Label muted>
                {available.length
                  ? t(
                      'Cours enregistrés · disponibles hors ligne',
                      'Saved courses · available offline',
                      'دورات محفوظة · متاحة دون اتصال',
                    )
                  : t(
                      'Apprentissage guidé par l’IA · pas de cours vérifié préchargé',
                      'AI-guided learning · no preloaded verified course',
                      'تعلّم بمساعدة الذكاء الاصطناعي · لا توجد دورة موثّقة محمّلة مسبقًا',
                    )}
              </Label>
              {available.map((c) => (
                <ListItem
                  grouped
                  key={c.id}
                  title={t(c.title[0], c.title[1], c.title[2])}
                  subtitle={`${c.lessons.length} ${t('leçons', 'lessons', 'دروس')}`}
                  onPress={() => router.push({ pathname: '/course/[id]', params: { id: c.id } })}
                />
              ))}
              <Row>
                {s.topics.map((topic) => (
                  <Button
                    quiet
                    key={topic}
                    title={topic}
                    onPress={() =>
                      router.push({ pathname: '/study-plan', params: { goal: topic } })
                    }
                  />
                ))}
              </Row>
            </Card>
          );
        })}
      </View>
      {!shown.length && (
        <EmptyState
          title={t('Aucun sujet trouvé', 'No matching subjects', 'لا توجد مواضيع مطابقة')}
          description={t(
            'Aucun sujet trouvé. Essayez votre propre objectif ci-dessus.',
            'No matching subject. Try your own goal above.',
            'لم نجد موضوعًا مطابقًا. جرّب كتابة هدفك أعلاه.',
          )}
          action={t('Effacer les filtres', 'Clear filters', 'امسح الفلاتر')}
          onAction={() => {
            setQuery('');
            setSelected('all');
          }}
        />
      )}
      <Button
        quiet
        title={t(
          'Ouvrir tous les cours et modules existants',
          'Browse all existing courses and modules',
          'تصفّح كل الدورات والوحدات الحالية',
        )}
        onPress={() => router.push('/path')}
      />
    </Page>
  );
}
