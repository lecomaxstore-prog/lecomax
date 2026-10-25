import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSchool } from '../store/School';
import { renderFormula } from '../utils/teacher-math';
import { Label } from './UI';

export function TeacherFormula({ source }: { source: string }) {
  const { colors } = useSchool();
  const { fontScale } = useWindowDimensions();
  const markup = useMemo(() => renderFormula(source), [source]);
  if (!markup) return <Label selectable style={{ writingDirection: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>{source}</Label>;
  const html = `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><body style="margin:0;padding:20px 12px;color:${colors.text};background:${colors.soft};font-size:${22 * fontScale}px;direction:ltr">${markup}</body>`;
  return <View style={{ height: Math.min(300, 110 * fontScale), borderRadius: 16, overflow: 'hidden', backgroundColor: colors.soft }}>
    <WebView accessibilityLabel={source} source={{ html }} javaScriptEnabled={false} domStorageEnabled={false} allowFileAccess={false} originWhitelist={['about:*']} onShouldStartLoadWithRequest={request => request.url === 'about:blank'} style={{ backgroundColor: colors.soft }} />
  </View>;
}
