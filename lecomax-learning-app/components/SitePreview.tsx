import React from 'react';
import { WebView } from 'react-native-webview';
import { readSiteEvent, type SiteEvent } from '../utils/site-preview';
export default function SitePreview({ html, onEvent, title }: { html: string; onEvent: (event: SiteEvent) => void; title: string }) {
  return <WebView accessibilityLabel={title} style={{ height: 560, flex: 0, backgroundColor: '#fff' }}
    source={{ html, baseUrl: 'https://lecomax.com' }} originWhitelist={['https://lecomax.com', 'about:blank']}
    onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url === 'https://lecomax.com/'}
    onMessage={event => { try { const data = readSiteEvent(JSON.parse(event.nativeEvent.data)); if (data) onEvent(data); } catch { /* Ignore malformed bridge data. */ } }} />;
}
