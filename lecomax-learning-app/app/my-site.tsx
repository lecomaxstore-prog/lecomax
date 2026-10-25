import React, { useMemo, useState } from 'react';
import { Linking, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Label, Page, Row } from '../components/UI';
import SitePreview from '../components/SitePreview';
import { useSchool } from '../store/School';
import { index, project } from '../services/content';
import { learningDestination, type SourceSelection } from '../utils/site-learning';
import { previewHtml, sitePath, type SiteEvent } from '../utils/site-preview';
import capture from '../data/site-pages.json';
import snapshot from '../data/site-source-map.json';
import { SiteElementLesson } from '../components/SiteElementLesson';

const pages: Record<string, { html: string; files: string[] }> = capture.pages;
const phases = [
  { title: ['1. Comprendre le Web', '1. Understand the web', '١. افهم الويب'], modules: ['start', 'module-00-learning-tools', 'module-01-internet-web'] },
  { title: ['2. Construire ce que tu vois', '2. Build what you see', '٢. ابنِ ما تراه'], modules: ['site-elements', 'module-03-html-accessibility', 'module-04-css', 'module-05-responsive-tailwind'] },
  { title: ['3. Rendre le site interactif', '3. Make the site interactive', '٣. اجعل الموقع تفاعليًا'], modules: ['module-06-javascript-foundations', 'module-07-js-data-problem-solving', 'react-fundamentals', 'react-state-forms-hooks'] },
  { title: ['4. Relier pages et données', '4. Connect pages and data', '٤. اربط الصفحات والبيانات'], modules: ['typescript-contracts', 'nextjs-app-router', 'nextjs-server-data', 'async-fetch-errors', 'guide-apis', 'sql-data-modeling', 'supabase-platform'] },
  { title: ['5. Comprendre la boutique', '5. Understand the store', '٥. افهم أنظمة المتجر'], modules: ['ecommerce-architecture', 'paypal-payments', 'email-systems', 'notifications', 'openai-integration'] },
  { title: ['6. Protéger et vérifier', '6. Protect and test', '٦. احمِ الموقع واختبره'], modules: ['authentication-security-privacy', 'quality-engineering', 'web-quality'] },
  { title: ['7. Construire et publier', '7. Build and deploy', '٧. أنجز مشروعك وانشره'], modules: ['module-02-git-github', 'deployment-operations', 'final-store-capstone', 'zero-to-hero-capstone'] },
  { title: ['8. Faire grandir le site', '8. Grow the site', '٨. طوّر موقعك وأعمالك'], modules: ['ecommerce-seo', 'analytics-growth', 'conversion-ux', 'retention-loyalty', 'business-operations'] },
] as const;

export default function MySite() {
  const { state, t, colors } = useSchool();
  const [trail, setTrail] = useState(['/']);
  const [selection, setSelection] = useState<SourceSelection | null>(null);
  const [notice, setNotice] = useState('');
  const [library, setLibrary] = useState(false);
  const [curriculum, setCurriculum] = useState(false);
  const [pageList, setPageList] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const path = trail[trail.length - 1]!;
  const page = pages[path]!;
  const fallback = learningDestination(path)?.file || 'app/page.tsx';
  const html = useMemo(() => previewHtml(page.html, capture.css, fallback), [page.html, fallback]);
  const open = (href: string) => {
    const next = sitePath(href, path);
    if (!next || !pages[next]) {
      setSelection(null);
      setUnavailable(next || null);
      setNotice(t('Cette page n’est pas incluse dans la visite. Tu peux consulter le site en direct avec le bouton ci-dessous.', 'This page is not included in the learning tour. You can visit the live site using the button below.', 'هذه الصفحة غير مضمّنة في الجولة التعليمية. يمكنك زيارة الموقع المباشر بالزر أدناه.'));
      return;
    }
    setSelection(null); setNotice(''); setUnavailable(null); setPageList(false);
    if (next !== path) setTrail(previous => [...previous, next]);
  };
  const receive = (event: SiteEvent) => {
    if (event.kind === 'navigate') open(event.href);
    else { setSelection(event.selection); }
  };
  return <Page compactSpacing title={t('Mon site L’ECOMAX', 'My L’ECOMAX site', 'موقعي L’ECOMAX')} header={<Label bold size={22}>{t('Mon site, mon code', 'My site, my code', 'موقعي، كودي')}</Label>}>
    <Label size={14}>{t('Touche un élément → comprends son vrai code. Deux touches sur un lien → ouvre sa page.', 'Tap an element → learn its real code. Double-tap a link → open its page.', 'المس عنصرًا ← افهم كوده الحقيقي. المس الرابط مرتين ← افتح صفحته.')}</Label>
    <Row>
      <Button quiet disabled={trail.length < 2} title={t('Page précédente', 'Previous page', 'الصفحة السابقة')} onPress={() => { setTrail(previous => previous.slice(0, -1)); setNotice(''); }} />
      <Button quiet title={t('Accueil du site', 'Site home', 'رئيسية الموقع')} onPress={() => open('/')} />
      <Button quiet title={t('Boutique', 'Shop', 'المتجر')} onPress={() => open('/boutique')} />
      <Button quiet title={t('Toutes les pages', 'All pages', 'كل الصفحات')} onPress={() => setPageList(!pageList)} />
    </Row>
    {pageList && <Card>{Object.keys(pages).map(url => <Button quiet key={url} title={url === '/' ? 'L’ECOMAX' : url} onPress={() => open(url)} />)}</Card>}
    <Label bold size={13} style={{ writingDirection: 'ltr', textAlign: 'left' }}>lecomax.com{path}</Label>
    {!!notice && <Card><Label>{notice}</Label>{!!unavailable && <Button quiet title={t('Voir cette page en direct', 'Visit this page live', 'زر هذه الصفحة مباشرة')} onPress={() => void Linking.openURL(capture.origin + unavailable).catch(() => setNotice(t('Impossible d’ouvrir le navigateur.', 'Could not open the browser.', 'تعذر فتح المتصفح.')))} />}</Card>}
    <SitePreview key={path} html={html} onEvent={receive} title={t('Explorer L’ECOMAX', 'Explore L’ECOMAX', 'استكشف L’ECOMAX')} />
    <Row>
      <Button title={t('De zéro à autonome', 'Zero to hero', 'من الصفر إلى الاحتراف')} onPress={() => setCurriculum(!curriculum)} />
      <Button quiet title={t('Cours complet', 'Full course', 'البرنامج الكامل')} onPress={() => router.push({ pathname: '/course/[id]', params: { id: 'real-site' } })} />
    </Row>
    {curriculum && phases.map(phase => <Card key={phase.title[1]}>
      <Label bold>{t(phase.title[0], phase.title[1], phase.title[2])}</Label>
      {phase.modules.map(id => index.find(module => module.id === id)).filter(module => !!module).map(module => {
        const completed = module.lessons.filter(lesson => state.completed.includes(lesson.id)).length;
        return <Button key={module.id} quiet title={`${module.title[state.language]} · ${completed}/${module.lessons.length}`} onPress={() => router.push({ pathname: '/module/[id]', params: { id: module.id } })} />;
      })}
    </Card>)}
    <Card>
      <Label bold>{t('Tes vrais fichiers, hors ligne', 'Your real files, offline', 'ملفاتك الحقيقية، دون إنترنت')}</Label>
      <Label size={14}>{t(`${snapshot.fileCount} fichiers enregistrés dans cette version de l’application.`, `${snapshot.fileCount} files saved in this version of the app.`, `${snapshot.fileCount} ملفًا محفوظًا داخل هذه النسخة من التطبيق.`)}</Label>
      <Label muted size={12}>{t('Code et explications de base disponibles hors ligne. Le prof IA et les images du site utilisent Internet.', 'Code and basic explanations work offline. The AI teacher and site images use the internet.', 'يعمل الكود والشرح الأساسي دون إنترنت. يحتاج المعلّم الذكي وصور الموقع إلى الإنترنت.')}</Label>
      <Row>
        <Button quiet title={t('Fichiers de cette page', 'Files for this page', 'ملفات هذه الصفحة')} onPress={() => setLibrary(!library)} />
        <Button quiet title={t('Toute la bibliothèque', 'Full source library', 'مكتبة الملفات كاملة')} onPress={() => router.push('/(tabs)/project')} />
      </Row>
      {library && page.files.filter(file => project.some(source => source.path === file)).map(file => <Button quiet key={file} title={file.split('/').pop()!.replace('.tsx', '')} onPress={() => { setSelection({ path: file, anchor: '', tag: 'section', label: file.split('/').pop() }); }} />)}
      <Label muted size={12}>{t('Code enregistré', 'Source saved', 'حُفظ الكود')}: {new Date(snapshot.capturedAt).toLocaleDateString(state.language)}. {t('Copie du site', 'Site capture', 'نسخة الموقع')}: {new Date(capture.capturedAt).toLocaleDateString(state.language)}.</Label>
    </Card>
    <Button quiet title={t('Ouvrir le site en direct', 'Open the live site', 'افتح الموقع المباشر')} onPress={() => void Linking.openURL(capture.origin + path).catch(() => setNotice(t('Impossible d’ouvrir le navigateur.', 'Could not open the browser.', 'تعذر فتح المتصفح.')))} />
    <Modal visible={!!selection} animationType="slide" onRequestClose={() => setSelection(null)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        {selection && <SiteElementLesson key={`${selection.path}:${selection.line || selection.label}`} selection={selection} page={path} onClose={() => setSelection(null)} onOpen={open} />}
      </SafeAreaView>
    </Modal>
  </Page>;
}
