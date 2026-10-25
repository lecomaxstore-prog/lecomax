import React from 'react';
import { WebView } from 'react-native-webview';
import { htmlDocument } from './runtime-document';
export function Preview({ code }: { code: string; narrow: boolean }) { return <WebView source={{ html: htmlDocument(code) }} javaScriptEnabled={false} originWhitelist={['about:blank']} onShouldStartLoadWithRequest={r => r.url === 'about:blank'} allowFileAccess={false} style={{ height: 380 }} />; }
