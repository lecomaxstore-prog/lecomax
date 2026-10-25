import React, { useEffect, useRef } from 'react';
import { AppState, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import type { StudioFrameProps } from './frame-types';
import { source } from './vehicle';
import { hostedVehicle } from './hosted-viewer';
import { detailedCarCredit } from './car-asset';

export default function StudioFrame({ html, onEvent }: StudioFrameProps) {
  const frame = useRef<WebView>(null);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => frame.current?.injectJavaScript(`window.studioActive?.(${state === 'active'});true;`));
    return () => listener.remove();
  }, []);
  return <WebView ref={frame} source={{ html, baseUrl: 'https://lecomax.com' }} style={{ flex: 1, backgroundColor: '#0a101a' }}
    accessibilityLabel="3D Car Studio" javaScriptEnabled domStorageEnabled cacheEnabled
    originWhitelist={['about:blank', 'https://lecomax.com', 'https://www.press.bmwgroup.com', 'https://sketchfab.com', 'https://github.com', 'https://creativecommons.org']}
    onShouldStartLoadWithRequest={request => {
      if ([source, hostedVehicle.url, hostedVehicle.authorUrl, detailedCarCredit.source, detailedCarCredit.license].includes(request.url)) { void Linking.openURL(request.url).catch(() => {}); return false; }
      if (request.url.startsWith(`https://sketchfab.com/models/${hostedVehicle.id}/embed`)) return true;
      return request.url === 'about:blank' || request.url === 'https://lecomax.com/';
    }}
    onMessage={event => { try { onEvent(JSON.parse(event.nativeEvent.data)); } catch { /* Invalid bridge messages are ignored. */ } }}
    onContentProcessDidTerminate={() => frame.current?.reload()}
    onRenderProcessGone={() => frame.current?.reload()}
  />;
}
