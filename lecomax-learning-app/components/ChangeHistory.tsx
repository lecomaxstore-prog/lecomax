import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Button, Label, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { useChangeHistory } from '../store/ChangeHistory';
import { formatChangeDate, type ChangeReport } from '../utils/change-history';

export function HistoryNotice() {
  const { error, saved, retry } = useChangeHistory();
  const { t, colors } = useSchool();
  if (!error && saved) return null;
  return <View style={{ gap: 8 }}>
    <Label size={12} accessibilityRole={error ? 'alert' : undefined} style={{ color: error ? colors.danger : colors.muted }}>
      {error ? t('Impossible de mettre à jour l’archive. Les données existantes sont conservées ; certains rapports peuvent manquer. Réessayez.', 'History archive could not be updated. Existing data is preserved; some reports may be unavailable. Please retry.', 'تعذّر تحديث الأرشيف. البيانات السابقة محفوظة؛ قد لا تظهر بعض التقارير. أعد المحاولة.') : t('Archivage des changements…', 'Archiving changes…', 'جارٍ حفظ سجل التغييرات…')}
    </Label>
    {error && <Button quiet title={t('Réessayer', 'Retry archive', 'أعد محاولة الحفظ')} onPress={retry} />}
  </View>;
}
const authoredDirection = (text: string) => /^[^A-Za-z\u0600-\u06ff]*[\u0600-\u06ff]/.test(text)
  ? { writingDirection: 'rtl' as const, textAlign: 'right' as const }
  : { writingDirection: 'ltr' as const, textAlign: 'left' as const };

export function ChangeReportCard({ report, initiallyExpanded = false, compact = false }: { report: ChangeReport; initiallyExpanded?: boolean; compact?: boolean }) {
  const { t, colors, state, rtl } = useSchool();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const status = report.status === 'successful'
    ? { label: t('Réussi', 'Successful', 'ناجح'), color: colors.accent, bg: colors.soft, icon: 'checkmark-circle-outline' as const }
    : report.status === 'failed'
      ? { label: t('Échec', 'Failed', 'فشل'), color: colors.danger, bg: colors.neutral, icon: 'close-circle-outline' as const }
      : { label: t('À tester', 'Needs testing', 'يحتاج إلى اختبار'), color: colors.amber, bg: colors.amberSoft, icon: 'time-outline' as const };
  const kind = { added: t('Ajouté', 'Added', 'أُضيف'), modified: t('Modifié', 'Modified', 'عُدّل'), removed: t('Supprimé', 'Removed', 'أُزيل'), fixed: t('Corrigé', 'Fixed', 'أُصلح') };
  return <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.card, overflow: 'hidden' }}>
    <View style={{ height: 3, backgroundColor: status.color }} />
    <View style={{ padding: 18, gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ backgroundColor: status.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, gap: 5 }}>
          <Ionicons name={status.icon} size={14} color={status.color} /><Label bold size={11} style={{ color: status.color }}>{status.label}</Label>
        </Row>
        <Label muted size={11} style={{ flexShrink: 1 }}>{report.retrospective ? t("Rapport rétrospectif enregistré : ", "Retrospective recorded: ", "تقرير سابق سُجّل في: ") : ""}{formatChangeDate(report.createdAt, state.language)}</Label>
      </Row>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={(expanded ? t('Réduire : ', 'Collapse: ', 'طي: ') : t('Développer : ', 'Expand: ', 'عرض: ')) + report.title} onPress={() => setExpanded(v => !v)} style={{ minHeight: 44, flexDirection: rtl ? 'row-reverse' : 'row', gap: 12, alignItems: 'center' }}>
        <Label bold size={compact ? 14 : 16} numberOfLines={compact && !expanded ? 2 : undefined} style={{ flex: 1, ...authoredDirection(report.title) }}>{report.title}</Label><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      <Label size={13} muted numberOfLines={compact && !expanded ? 2 : undefined} style={authoredDirection(report.summary)}>{report.summary}</Label>
      <Label size={11} muted>{report.files.length} {t('fichiers', 'files', 'ملفات')} · {report.changes.length} {t('changements', 'changes', 'تغييرات')}</Label>
      {expanded && <View style={{ gap: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line }}>
        <View style={{ gap: 10 }}>
          <Label bold size={13}>{t('Changements effectués', 'Changes Made', 'التغييرات المنفّذة')}</Label>
          {report.changes.map((change, i) => <View key={i} style={{ gap: 3 }}><Label size={11} bold style={{ color: colors.accent }}>{kind[change.kind]}</Label><Label size={13} style={authoredDirection(change.detail)}>{change.detail}</Label></View>)}
        </View>
        {([
          [t('Pages concernées', 'Affected pages', 'الصفحات المتأثرة'), report.pages, false],
          [t('Composants', 'Components', 'المكوّنات'), report.components, false],
          [t('Fichiers', 'Files', 'الملفات'), report.files, true],
        ] as const).map(([title, entries, paths]) => <View key={title} style={{ gap: 5 }}>
          <Label bold size={13}>{title}</Label>
          {entries.map(value => <Label selectable key={value} size={12} style={paths ? { writingDirection: 'ltr', textAlign: 'left' } : authoredDirection(value)}>{value}</Label>)}
        </View>)}
        <View style={{ gap: 9 }}>
          <Label bold size={13}>{t('Vérifications', 'Validation', 'التحقق')}</Label>
          {report.validation.map((check, i) => <View key={i} style={{ gap: 3 }}>
            <Label bold size={12} style={{ color: check.result === 'passed' ? colors.accent : check.result === 'failed' ? colors.danger : colors.amber }}>
              {check.result === 'passed' ? t('Réussi', 'Passed', 'اجتاز') : check.result === 'failed' ? t('Échec', 'Failed', 'فشل') : t('Non exécuté', 'Not run', 'لم يُنفّذ')} · {check.name}
            </Label><Label size={12} muted style={authoredDirection(check.detail)}>{check.detail}</Label>
          </View>)}
        </View>
        <Label selectable size={10} muted style={{ writingDirection: 'ltr', textAlign: 'left' }}>ID: {report.id}{report.relatedId ? '\n' + t('Suite du rapport : ', 'Follow-up to: ', 'متابعة للتقرير: ') + report.relatedId : ''}</Label>
        {report.preview && <View style={{ gap: 6 }}>
          <Button quiet icon="open-outline" title={report.preview.label} onPress={() => router.push(report.preview!.path as Href)} />
          <Label size={10} muted>{t('Version actuelle, pas une capture historique. Vérifié : ', 'Current app, not a historical snapshot. Checked: ', 'النسخة الحالية وليست نسخة تاريخية. تم التحقق: ') + formatChangeDate(report.preview.verifiedAt, state.language)}</Label>
        </View>}
      </View>}
      <Button variant="ghost" title={expanded ? t('Réduire les détails', 'Hide details', 'طي التفاصيل') : t('Voir tous les détails', 'View full details', 'عرض التفاصيل الكاملة')} onPress={() => setExpanded(v => !v)} />
    </View>
  </View>;
}
export function ChangesMade() {
  const { reports } = useChangeHistory();
  const { t } = useSchool();
  return <View style={{ gap: 10 }}>
    <Row style={{ justifyContent: 'space-between' }}>
      <Label bold size={18} accessibilityRole="header">{t('Changements effectués', 'Changes Made', 'التغييرات المنفّذة')}</Label>
      <Button variant="ghost" title={t('Historique', 'Change History', 'سجل التغييرات')} onPress={() => router.push('/change-history')} />
    </Row>
    <HistoryNotice />
    {reports[0] ? <ChangeReportCard key={reports[0].id} report={reports[0]} compact /> : <Label muted>{t('Aucun rapport pour le moment.', 'No change reports yet.', 'لا توجد تقارير تغييرات بعد.')}</Label>}
  </View>;
}
