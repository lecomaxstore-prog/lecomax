import { DailyRoutineCard } from '../../features/wellness/DailyRoutineCard';
import { PracticeLaunchpad } from '../../components/PracticeLaunchpad';
import { router, type Href } from 'expo-router';
import { Platform, View } from 'react-native';
import { Button, Card, IconButton, Label, Page, Row, ListItem } from '../../components/UI';
import { useState } from 'react';
import { useSchool } from '../../store/School';
import Constants from 'expo-constants';
import { CourseLibrary } from '../../components/CourseLibrary';
import { DeviceLabsSection } from '../../components/DeviceLabsSection';

export default function More() {
  const { t, state, colors } = useSchool();
  const [section, setSection] = useState<'courses' | 'tools'>('tools');
  const items = [
    {
      kind: 'bookmarks',
      icon: 'bookmark-outline',
      title: t('Mes favoris', 'Bookmarks', 'المحفوظات'),
      description: t(
        'Retrouve les leçons que tu aimes.',
        'Your saved lessons, in one place.',
        'دروسك المحفوظة في مكان واحد.',
      ),
    },
    {
      kind: 'notes',
      icon: 'document-text-outline',
      title: t('Notes et résumés', 'Notes and summaries', 'ملاحظات وملخصات'),
      description: t(
        'Garde tes idées et tes découvertes.',
        'Revisit your ideas and discoveries.',
        'ارجع إلى أفكارك وما تعلّمته.',
      ),
    },
    {
      kind: 'mistakes',
      icon: 'refresh-outline',
      title: t('Revoir mes erreurs', 'Review mistakes', 'راجع أخطاءك'),
      description: t(
        'Transforme chaque erreur en progrès.',
        'Turn mistakes into understanding.',
        'حوّل أخطاءك إلى فهم أعمق.',
      ),
    },
    {
      kind: 'difficult',
      icon: 'flag-outline',
      title: t('À revoir', 'Review later', 'للمراجعة'),
      description: t(
        'Reviens sur les notions difficiles.',
        'Give tricky topics another try.',
        'أعطِ المواضيع الصعبة فرصة أخرى.',
      ),
    },
    {
      kind: 'flashcards',
      icon: 'albums-outline',
      title: t('Cartes mémoire', 'Flashcards', 'بطاقات الذاكرة'),
      description: t(
        'Un petit rappel pour mieux retenir.',
        'Quick prompts to strengthen recall.',
        'مراجعة سريعة لتثبيت معلوماتك.',
      ),
    },
    {
      kind: 'glossary',
      icon: 'book-outline',
      title: t('Dictionnaire du code', 'Programming glossary', 'قاموس البرمجة'),
      description: t(
        'Les mots du code, simplement.',
        'Programming terms made simple.',
        'مصطلحات البرمجة بلغة بسيطة.',
      ),
    },
    {
      kind: 'errors',
      icon: 'bug-outline',
      title: t('Trouver le bug', 'Error trainer', 'تعلّم من الأخطاء'),
      description: t(
        'Entraîne-toi à comprendre les bugs.',
        'Practice understanding code errors.',
        'تدرّب على فهم أخطاء الكود.',
      ),
    },
    {
      kind: 'statistics',
      icon: 'stats-chart-outline',
      title: t('Statistiques', 'Statistics', 'الإحصائيات'),
      description: t(
        'Prends du recul sur tes progrès.',
        'See how your learning is growing.',
        'شاهد تقدّمك في رحلة التعلّم.',
      ),
    },
  ] as const;
  const groups = [
    { title: t('Mon espace personnel', 'My saved learning', 'مساحتي الشخصية'), subtitle: t('Retrouve ce que tu veux garder et revoir.', 'Pick up the ideas and lessons you saved.', 'عد إلى أفكارك ودروسك التي تريد مراجعتها.'), kinds: ['bookmarks', 'notes', 'difficult', 'mistakes'] },
    { title: t('Pratiquer et progresser', 'Practice and progress', 'تدرّب وتقدّم'), subtitle: t('Des outils pour comprendre et retenir.', 'Build understanding, one small practice at a time.', 'أدوات تساعدك على الفهم وتثبيت معلوماتك.'), kinds: ['flashcards', 'glossary', 'errors', 'statistics'] },
  ];
  return <Page title={t('Mon espace', 'My space', 'مساحتي')} compactSpacing header={
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', gap: 12 }}>
        <View style={{ flex: 1, gap: 5 }}>
          <Label muted bold size={11}>ACADEMY</Label>
          <Label bold size={26} style={{ lineHeight: 38 }} accessibilityRole="header">{t('Mon espace', 'My learning space', 'مساحتي للتعلّم')}</Label>
        </View>
        <IconButton icon="settings-outline" label={t('Réglages', 'Settings', 'الإعدادات')} onPress={() => router.push('/settings')} />
      </Row>
      <Label muted size={14}>{t('Tes notes, tes outils et tes cours, au même endroit.', 'Your notes, tools and courses, together in one place.', 'ملاحظاتك وأدواتك ودوراتك، في مكان واحد.')}</Label>
    </View>
  }>
    <View style={{ gap: 12 }}>
      <Button quiet icon="person-circle-outline" title={t('Mon profil', 'My profile', 'ملفي')} onPress={() => router.push('/profile')} />
      <Button quiet icon="search-outline" title={t('Rechercher une leçon ou un sujet', 'Find a lesson or topic', 'ابحث عن درس أو موضوع')} onPress={() => router.push('/search')} />
      <Row style={{ flexWrap: 'nowrap', backgroundColor: colors.neutral, padding: 4, borderRadius: 16, gap: 4 }}>
        <Button quiet selected={section === 'tools'} icon="grid-outline" style={{ flex: 1 }} title={t('Mes outils', 'My tools', 'أدواتي')} onPress={() => setSection('tools')} />
        <Button quiet selected={section === 'courses'} icon="school-outline" style={{ flex: 1 }} title={t('Cours', 'Courses', 'الدورات')} onPress={() => setSection('courses')} />
      </Row>
    </View>
    {section === 'courses' ? <CourseLibrary /> : <>
      <PracticeLaunchpad />
      <View style={{ gap: 12 }}>
        <Label bold size={18} accessibilityRole="header">{t('Coder et explorer', 'Code and explore', 'اكتب وجرّب')}</Label>
        <Card style={{ padding: 6, gap: 0, borderRadius: 20, shadowOpacity: 0, elevation: 0 }}>
          <View style={{ borderColor: colors.line, borderWidth: 1, borderRadius: 15, overflow: 'hidden' }}>
            <ListItem grouped icon="code-slash-outline" title="Python" subtitle={t('Écris et exécute du code avec le professeur IA.', 'Write and run code with your AI Teacher.', 'اكتب وشغّل بايثون بمساعدة المعلّم الذكي.')} onPress={() => router.push({ pathname: '/terminal', params: { runtime: 'python' } })} />
          </View>
          {Platform.OS !== 'android' && <ListItem grouped icon="terminal-outline" title={t('Terminal', 'Terminal', 'الطرفية')} subtitle={t('PowerShell, Python et Node.js sur ce PC.', 'PowerShell, Python and Node.js on this PC.', 'شغّل الأوامر والبرامج على حاسوبك.')} onPress={() => router.push('/terminal')} />}
        </Card>
      </View>
      {groups.map(group => <View key={group.title} style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Label bold size={18} accessibilityRole="header">{group.title}</Label>
          <Label muted size={13}>{group.subtitle}</Label>
        </View>
        <Card style={{ padding: 8, gap: 0, borderRadius: 18, shadowOpacity: 0, elevation: 0 }}>
          {group.kinds.map((kind, index) => {
            const item = items.find(item => item.kind === kind)!;
            return <View key={kind} style={{ borderTopWidth: index ? 1 : 0, borderTopColor: colors.line }}>
              <ListItem grouped icon={item.icon} title={item.title} subtitle={item.description} onPress={() => router.push({ pathname: '/collection/[kind]', params: { kind: item.kind } })} />
            </View>;
          })}
        </Card>
      </View>)}
      <View style={{ gap: 12 }}>
        <Label bold size={18} accessibilityRole="header">{t('Mes bureaux', 'My desktops', 'أجهزتي وأنظمة التشغيل')}</Label>
        <Card style={{ padding: 6, gap: 0, borderRadius: 20, shadowOpacity: 0, elevation: 0 }}>
          <ListItem grouped icon="laptop-outline" title={t('Mon PC', 'My PC', 'حاسوبي')} subtitle={t('Ton écran Windows, en direct sur le Wi-Fi.', 'Your live Windows screen over Wi-Fi.', 'شاشة ويندوز مباشرة عبر الواي فاي.')} onPress={() => router.push('/pc')} />
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
            <ListItem grouped icon="phone-portrait-outline" title={t('Mon téléphone à distance', 'My remote phone', 'هاتفي عن بُعد')} subtitle={t('Partage ton écran Android avec approbation.', 'Share your Android screen with approval.', 'شارك شاشة أندرويد بعد الموافقة.')} onPress={() => router.push('/phone')} />
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
            <ListItem grouped icon="desktop-outline" title="Kali Linux" subtitle={t('Le bureau Linux dans ton application.', 'Your Linux desktop inside the app.', 'سطح مكتب لينكس داخل التطبيق.')} onPress={() => router.push('/kali')} />
          </View>
        </Card>
      </View>
      <ListItem icon="bulb-outline" title={t('Apprendre à apprendre', 'Learn how to learn', 'تعلّم كيف تتعلّم')} subtitle={t('4 leçons pour mieux comprendre et retenir.', '4 lessons to understand and remember better.', '٤ دروس للفهم والتذكّر والمراجعة بفعالية.')} onPress={() => router.push({ pathname: '/module/[id]', params: { id: 'study-skills' } })} />
    </>}
    <ListItem icon="sparkles-outline" title="Curiosity Universe" subtitle="Discover science, inventions and the living world." onPress={() => router.push('/curiosity')} />
    <DeviceLabsSection />
    <ListItem icon="car-sport-outline" title="3D Car Studio" subtitle={t('Ingénierie automobile · BMW M5 Competition', 'Automotive Engineering · BMW M5 Competition', 'هندسة الطوموبيلات · BMW M5 Competition')} onPress={() => router.push('/car-studio' as Href)} />
    <View style={{ gap: 12 }}>
      <Label bold size={18} accessibilityRole="header">{t('Mon équilibre', 'My daily balance', 'توازني اليومي')}</Label>
      <DailyRoutineCard compact />
    </View>
    <View style={{ gap: 12 }}>
      <Label bold size={18} accessibilityRole="header">{t('L’application', 'App and preferences', 'التطبيق والتفضيلات')}</Label>
      <Card style={{ padding: 8, gap: 0, borderRadius: 18, shadowOpacity: 0, elevation: 0 }}>
        <ListItem grouped icon="settings-outline" title={t('Réglages', 'Settings', 'الإعدادات')} subtitle={t('Langue, apparence et préférences.', 'Language, appearance and preferences.', 'اللغة والمظهر والتفضيلات.')} onPress={() => router.push('/settings')} />
      </Card>
    </View>
    <Label muted size={11} style={{ textAlign: 'center' }}>ACADEMY {Constants.expoConfig?.version} · {state.language.toUpperCase()}</Label>
  </Page>;
}
