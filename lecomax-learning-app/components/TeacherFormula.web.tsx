import React, { useMemo } from 'react';
import { useSchool } from '../store/School';
import { renderFormula } from '../utils/teacher-math';
import { Label } from './UI';

export function TeacherFormula({ source }: { source: string }) {
  const { colors } = useSchool();
  const markup = useMemo(() => renderFormula(source), [source]);
  if (!markup) return <Label selectable style={{ writingDirection: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>{source}</Label>;
  return <div dir="ltr" style={{ color: colors.text, background: colors.soft, border: `1px solid ${colors.line}`, borderRadius: 16, padding: '20px 16px', overflowX: 'auto', fontSize: 22 }} dangerouslySetInnerHTML={{ __html: markup }} />;
}
