import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { index } from '../services/content';
import { iptvLivePhases } from '../data/iptv-live';
import { Card, Label, Row } from './UI';

export function IptvCoursePlan() {
  const { colors, state, rtl, t } = useSchool();
  const [expanded, setExpanded] = useState<number | null>(0);
  const phaseCopy = [
    { title: t('Partir de zéro', 'Start from zero', 'ابدأ من الصفر'), description: t('Carte du parcours, sources et écosystème', 'Learning map, sources and ecosystem', 'خريطة التعلّم والمصادر ومنظومة البث') },
    { title: t('Comprendre les outils', 'Understand the tools', 'افهم الأدوات'), description: t('Réseau, protocoles, codecs et coûts', 'Networking, protocols, codecs and costs', 'الشبكات والبروتوكولات والترميز والتكلفة') },
    { title: t('Réussir ton premier direct', 'Make your first broadcast', 'نجاحك الأول: بث مباشر'), description: t('Serveur → OBS → lecture', 'Server → OBS → playback', 'الخادم ثم OBS ثم المشاهدة') },
    { title: t('Ajouter les chaînes et le guide', 'Add channels and a guide', 'أضف القنوات ودليل البرامج'), description: t('Fichiers, ingestion, M3U, XMLTV et applications', 'Files, ingest, M3U, XMLTV and player apps', 'الملفات والإدخال وM3U وXMLTV وتطبيقات المشاهدة') },
    { title: t('Qualité et protection', 'Quality and protection', 'الجودة والحماية'), description: t('Accès, DRM, qualité adaptative et replay', 'Access, DRM, adaptive quality and replay', 'الصلاحيات وDRM والجودة المتكيفة والإعادة') },
    { title: t('Exploiter et prouver tes acquis', 'Operate and demonstrate your skills', 'شغّل الخدمة وأثبت مهاراتك'), description: t('Pannes, déploiement et projet à deux chaînes', 'Failures, deployment and two-channel project', 'الأعطال والنشر ومشروع القناتين') },
  ];
  const phases = [
    ...iptvLivePhases.map((ids, i) => ({ ...phaseCopy[i]!, ids: ids.map(id => 'iptv-live-' + id) })),
    { title: t('Construire ton application', 'Build your viewing application', 'ابنِ تطبيق المشاهدة'), description: t('Atelier code : catalogue, lecteur, favoris et tests', 'Coding workshop: catalog, player, favorites and tests', 'ورشة برمجة: القائمة والمشغّل والمفضّلة والاختبارات'), ids: index.find(m => m.id === 'iptv-workshop')?.lessons.map(l => l.id) || [] },
  ];
  const catalog = index.flatMap(m => m.lessons);
  return <View style={{ gap: 12 }}>
    <Card style={{ backgroundColor: colors.soft, borderRadius: 20 }}>
      <Row><Ionicons name="flash-outline" size={22} color={colors.accent} /><Label bold size={18}>{t('Premier résultat : ton propre direct', 'First win: your own live channel', 'أول نجاح: قناتك المباشرة')}</Label></Row>
      <Label size={14}>{t('Après installation de Docker, OBS et VLC, suis ces quatre leçons. Reviens ensuite au parcours complet pour comprendre et progresser.', 'After installing Docker, OBS and VLC, follow these four lessons. Then return to the complete path to build understanding.', 'بعد تثبيت Docker وOBS وVLC اتبع هذه الدروس الأربعة ثم عد إلى المسار الكامل للفهم والتقدم.')}</Label>
      {['basics', 'server', 'broadcast', 'channels'].map((id, i) => {
        const lesson = catalog.find(item => item.id === 'iptv-live-' + id);
        if (!lesson) return null;
        return <Pressable key={id} accessibilityRole="button" accessibilityLabel={lesson.title[state.language]} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id, course: 'iptv-live' } })} style={({ pressed }) => ({ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 })}>
          <Label size={14}>{i + 1}. {lesson.title[state.language]}</Label>
        </Pressable>;
      })}
      <Label muted size={12}>{t('Lis → prédis → pratique → explique. Révise demain, puis dans une semaine. Les exercices se font sur ordinateur.', 'Read → predict → practice → explain. Review tomorrow and in one week. Run the labs on a computer.', 'اقرأ ثم توقّع ثم طبّق ثم اشرح. راجع غدًا وبعد أسبوع. نفّذ المختبرات على الحاسوب.')}</Label>
    </Card>

    <Row style={{ justifyContent: 'space-between' }}>
      <Label bold size={20} accessibilityRole="header">{t('Le programme', 'Your curriculum', 'برنامج الدورة')}</Label>
      <Label muted size={12}>{t('7 étapes progressives', '7 progressive stages', '٧ مراحل متدرجة')}</Label>
    </Row>
    {phases.map((phase, i) => {
      const lessons = phase.ids.flatMap(id => { const item = catalog.find(l => l.id === id); return item ? [item] : []; });
      const done = lessons.filter(l => state.completed.includes(l.id)).length;
      const open = expanded === i;
      return <Card key={phase.title} style={{ padding: 0, borderRadius: 18, overflow: 'hidden', gap: 0 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={phase.title} accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? null : i)} style={({ pressed }) => ({ padding: 18, backgroundColor: open ? colors.soft : colors.card, opacity: pressed ? 0.75 : 1 })}>
          <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
              {done === lessons.length && lessons.length > 0 ? <Ionicons name="checkmark" size={20} color={colors.accent} /> : <Label bold size={14} style={{ color: colors.accent }}>{String(i + 1).padStart(2, '0')}</Label>}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Label bold size={16}>{phase.title}</Label>
              <Label muted size={12}>{phase.description}</Label>
              <Label muted size={11}>{t(`${done}/${lessons.length} terminées · ${lessons.reduce((n, l) => n + l.minutes, 0)} min`, `${done}/${lessons.length} complete · ${lessons.reduce((n, l) => n + l.minutes, 0)} min`, `${done} من ${lessons.length} مكتملة · ${lessons.reduce((n, l) => n + l.minutes, 0)} دقيقة`)}</Label>
            </View>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
          </Row>
        </Pressable>
        {open && lessons.map((lesson, j) => <Pressable key={lesson.id} accessibilityRole="button" accessibilityLabel={lesson.title[state.language]} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id, course: 'iptv-live' } })} style={({ pressed }) => ({ paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: pressed ? colors.soft : colors.card })}>
          <Row style={{ flexWrap: 'nowrap', gap: 12 }}>
            <Ionicons name={state.completed.includes(lesson.id) ? 'checkmark-circle' : 'play-circle-outline'} size={22} color={state.completed.includes(lesson.id) ? colors.accent : colors.muted} />
            <View style={{ flex: 1 }}>
              <Label size={14}>{j + 1}. {lesson.title[state.language]}</Label>
              <Label muted size={11}>{lesson.minutes} {t('min', 'min', 'دقيقة')}</Label>
            </View>
            <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={15} color={colors.muted} />
          </Row>
        </Pressable>)}
      </Card>;
    })}
    <Card style={{ borderRadius: 20, backgroundColor: colors.soft, borderWidth: 0 }}>
      <Row><Ionicons name="ribbon-outline" size={23} color={colors.accent} /><Label bold size={18}>{t('Ton projet final', 'Your final project', 'مشروعك النهائي')}</Label></Row>
      <Label size={14}>{t('Présente une chaîne autorisée et son application de lecture. Valide chaque résultat avant de considérer le projet terminé.', 'Present an authorized live channel and its viewing application. Verify each outcome before considering the project finished.', 'قدّم قناة مباشرة مرخّصة وتطبيقًا لمشاهدتها. تحقق من كل نتيجة قبل اعتبار المشروع مكتملًا.')}</Label>
      {[
        t('Image et son en direct, avec latence mesurée.', 'Live picture and sound, with measured latency.', 'صورة وصوت مباشران مع قياس التأخير.'),
        t('Catalogue, lecteur et favoris fonctionnels.', 'Working catalog, player and favorites.', 'قائمة ومشغّل ومفضّلة تعمل بشكل صحيح.'),
        t('Test d’interruption et reprise documenté.', 'Documented interruption and recovery test.', 'اختبار موثّق لانقطاع البث والتعافي.'),
        t('Fiche des droits, estimation réseau et plan d’accès.', 'Rights record, bandwidth estimate and access plan.', 'سجل الحقوق وتقدير سعة الشبكة وخطة الصلاحيات.'),
      ].map(item => <Row key={item} style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} style={{ marginTop: 3 }} /><Label size={14} style={{ flex: 1 }}>{item}</Label></Row>)}
    </Card>
  </View>;
}
