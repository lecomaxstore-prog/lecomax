import React from 'react';
import { Page } from '../components/UI';
import { ChangeReportCard, HistoryNotice } from '../components/ChangeHistory';
import { useChangeHistory } from '../store/ChangeHistory';
import { useSchool } from '../store/School';
export default function ChangeHistoryScreen() {
  const { reports } = useChangeHistory();
  const { t } = useSchool();
  return <Page title={t('Historique des changements', 'Change History', 'سجل التغييرات')}>
    <HistoryNotice />
    {reports.map(report => <ChangeReportCard key={report.id} report={report} compact />)}
  </Page>;
}
