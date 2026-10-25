import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Label } from './UI';
import { useSchool } from '../store/School';
import { getSource } from '../services/content';
import { fonts } from '../constants/design';

export function RunOutcome({ filename, code }: { filename: string; code: string }) {
  const { t, colors, rtl } = useSchool();
  const [open, setOpen] = useState(false);
  const markdown = /\.mdx?$/i.test(filename);
  const json = /\.json$/i.test(filename);
  const source = getSource(filename);
  const content = source?.content || code;
  const heading = content.match(/^#{1,6}\s+(.+)$/m)?.[1];
  let parsed: { valid: boolean; summary: string } | undefined;
  if (json) {
    try {
      const value = JSON.parse(content);
      parsed = { valid: true, summary: Array.isArray(value) ? `Array · ${value.length}` : value === null ? 'null' : typeof value === 'object' ? Object.keys(value).slice(0, 8).join(', ') : String(value) };
    } catch { parsed = { valid: false, summary: '' }; }
  }
  const ask = () => {
    const request = t(
      'Que se passe-t-il quand ce fichier est utilisé ? Donne deux exemples concrets basés sur ce code : entrée ou action, étapes, résultat visible exact, puis un cas d’erreur. Précise la commande et les prérequis seulement si le contexte les confirme. Distingue résultat attendu et exécution vérifiée. Ne prétends pas avoir exécuté le code. Si le fichier ne s’exécute pas seul, explique comment il est utilisé. Réponds simplement.',
      'What happens when this file is used? Give two concrete examples grounded in this code: input or action, steps, exact visible output, then a failure case. Give commands and prerequisites only when supported by context. Distinguish expected results from verified execution. Do not claim to have run the code. If this file cannot run alone, explain how it is used. Use beginner-friendly language.',
      'شنو كيوقع ملي كنستعملو هاد الملف؟ عطيني جوج أمثلة عملية من هاد الكود: المدخلات أو الخطوة اللي ندير، مراحل العمل، والنتيجة اللي غادي نشوف، ثم مثال على خطأ. وضّح أوامر التشغيل والمتطلبات غير إلا كانت مؤكدة من السياق. فرّق بين النتيجة المتوقعة والتشغيل الفعلي، وما تقولش شغّلتي الكود. إلا ما كيتشغّلش بوحدو، شرح كيفاش كنستعملوه. شرح ليا ببساطة.',
    );
    router.push({ pathname: '/(tabs)/teacher', params: {
      ...(source ? { file: filename } : {}),
      question: request + '\n\n' + filename + (source ? '' : '\n\n' + code.slice(0, 3500)),
      explain: 'execution-examples',
    } });
  };
  return <View style={{ gap: 12 }}>
    <Button quiet icon={open ? "chevron-up" : "play-circle-outline"} selected={open} style={{ borderRadius: 12 }}
      title={t('Que se passe-t-il à l’exécution ?', 'What happens if I run this?', 'شنو غادي يوقع إلا شغّلنا هاد الكود؟')}
      onPress={() => setOpen(value => !value)} />
    {open && <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 16 }}>
      <View style={{ gap: 5 }}>
        <View style={{ alignSelf: rtl ? 'flex-end' : 'flex-start', backgroundColor: colors.soft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Label bold size={10} style={{ color: colors.accent }}>{markdown ? 'MARKDOWN' : json ? 'JSON' : t('APERÇU', 'PREVIEW', 'معاينة')}</Label>
        </View>
        <Label bold size={18}>{t('Comprendre le résultat', 'Understand the result', 'نفهمو النتيجة')}</Label>
      </View>
      <Label size={13} style={{ lineHeight: 23 }}>{markdown
        ? t('Un document Markdown, pas un programme : le lecteur transforme les symboles en titres et en texte mis en forme.', 'A Markdown document, not a program: a viewer turns its symbols into headings and formatted text.', 'هاد الملف وثيقة Markdown. القارئ كيحوّل الرموز لعناوين ونص منسّق، ماشي برنامج كيتشغّل.')
        : json
          ? t('JSON contient des données. Le programme doit lire et analyser ce fichier pour utiliser ses valeurs.', 'JSON contains data. A program reads and parses this file to use its values.', 'JSON فيه بيانات. خاص برنامج يقرا هاد الملف ويحلّلو باش يستعمل القيم ديالو.')
          : t('Le résultat dépend du contexte : application, imports, données et configuration. Demande les exemples ci-dessous pour suivre ce fichier avec des entrées et sorties concrètes.', 'The result depends on the app, imports, data, and configuration. Use the examples option below to trace this file with concrete inputs and outputs.', 'النتيجة كتبدّل حسب التطبيق والملفات المرتبطة والبيانات والإعدادات. طلب الأمثلة من الزر لتحت باش تفهم المدخلات والنتائج ديال هاد الملف.')}</Label>
      {markdown && heading && <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden' }}>
        <View style={{ padding: 14, gap: 10, backgroundColor: colors.neutral }}>
          <Label bold muted size={11}>{t('01 · Dans le fichier', '01 · Source', '01 · داخل الملف')}</Label>
          <Text selectable style={{ fontSize: 13, lineHeight: 22, fontFamily: fonts.code, color: colors.text, writingDirection: 'ltr', textAlign: 'left' }}>{content.match(/^#{1,6}\s+.+$/m)?.[0]}</Text>
        </View>
        <View style={{ padding: 14, gap: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Label bold muted size={11}>{t('02 · Résultat affiché', '02 · Displayed result', '02 · النتيجة فالشاشة')}</Label>
          <Label bold size={22} style={{ writingDirection: /[\u0600-\u06ff]/.test(heading) ? 'rtl' : 'ltr', textAlign: /[\u0600-\u06ff]/.test(heading) ? 'right' : 'left', lineHeight: 32 }}>{heading}</Label>
        </View>
      </View>}
      {parsed && <View style={{ padding: 14, borderRadius: 12, backgroundColor: colors.neutral, gap: 6 }}>
        <Label bold size={13}>{parsed.valid ? t('Analyse JSON réussie', 'JSON parsing succeeded', 'تحليل JSON نجح') : t('JSON incomplet ou invalide', 'Incomplete or invalid JSON', 'JSON ناقص أو غير صالح')}</Label>
        {parsed.valid && <Text selectable style={{ color: colors.text, fontFamily: fonts.code, writingDirection: 'ltr', textAlign: 'left' }}>{parsed.summary}</Text>}
      </View>}
      <Label muted size={11} style={{ lineHeight: 19 }}>{t('Aucun code de ce fichier n’est exécuté ici.', 'No code from this file is executed here.', 'ما كنشغّلو حتى كود من هاد الملف هنا.')}</Label>
      <Button icon="sparkles-outline" style={{ minHeight: 46, borderRadius: 12 }} title={t('Deux exemples avec le professeur', 'Explain two practical examples', 'شوف جوج أمثلة مع الأستاذ')} onPress={ask} />
    </View>}
  </View>;
}
