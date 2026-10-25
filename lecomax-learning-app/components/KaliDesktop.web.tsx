import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type RFB from '@novnc/novnc';
import { auth, API } from '../services/auth';
import { useSchool } from '../store/School';
import { Button, Label, Row } from './UI';

async function desktopRequest(body: Record<string, string>) {
  const token = await auth.token();
  if (!token) throw new Error('OWNER_LOGIN_REQUIRED');
  const response = await fetch(API + '/api/learning-mobile/desktop', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(55000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'DESKTOP_UNAVAILABLE');
  return result as { id: string; ticket: string; password: string; port: number };
}

export function KaliDesktop() {
  const { t } = useSchool();
  const host = useRef<HTMLDivElement>(null);
  const client = useRef<RFB | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [text, setText] = useState('');
  const stopping = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let disposed = false;
    let id = '';
    let rfb: RFB | undefined;
    const start = async () => {
      try {
        await stopping.current;
        if (disposed) return;
        const { default: RemoteFrameBuffer } = await import('@novnc/novnc');
        if (disposed) return;
        const session = await desktopRequest({ action: 'start' });
        id = session.id;
        if (disposed || !host.current) return;
        const url = new URL(API);
        url.protocol = 'ws:';
        url.port = String(session.port);
        url.pathname = '/desktop';
        url.search = new URLSearchParams({ ticket: session.ticket }).toString();
        rfb = new RemoteFrameBuffer(host.current, url.toString(), { credentials: { password: session.password } });
        client.current = rfb;
        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.addEventListener('connect', () => { if (!disposed) { setStatus('connected'); rfb?.focus(); } });
        rfb.addEventListener('disconnect', () => { if (!disposed) { setError('DESKTOP_DISCONNECTED'); setStatus('error'); } });
        rfb.addEventListener('securityfailure', () => { if (!disposed) { setError('DESKTOP_AUTH_FAILED'); setStatus('error'); } });
      } catch (cause) {
        if (!disposed) { setError(cause instanceof Error ? cause.message : 'DESKTOP_UNAVAILABLE'); setStatus('error'); }
      }
    };
    const pending = start();
    return () => {
      disposed = true;
      rfb?.disconnect(); client.current = null;
      stopping.current = pending.then(() => id ? desktopRequest({ action: 'stop', id }).catch(() => {}) : undefined);
    };
  }, [attempt]);
  return <View style={{ flex: 1, minHeight: 320, gap: 8 }}>
    <Row>
      <Label style={{ color: '#b1c9c3' }}>{status === 'connected'
        ? t('Bureau Kali connecté', 'Kali desktop connected', 'سطح مكتب كالي متصل')
        : status === 'connecting' ? t('Démarrage du bureau Kali…', 'Starting Kali desktop…', 'جارٍ تشغيل سطح مكتب كالي…')
          : t('Bureau déconnecté', 'Desktop disconnected', 'سطح المكتب غير متصل')}</Label>
      <Button quiet title={t('Reconnecter', 'Reconnect', 'إعادة الاتصال')} disabled={status === 'connecting'} onPress={() => { setStatus('connecting'); setError(''); setAttempt(n => n + 1); }} />
      <Button quiet title={t('Plein écran', 'Full screen', 'ملء الشاشة')} disabled={status !== 'connected'} onPress={() => { void host.current?.requestFullscreen().catch(() => {}); }} />
    </Row>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <input aria-label={t('Texte à saisir dans Kali', 'Text to type into Kali', 'نص لإدخاله في كالي')} placeholder={t('Sélectionne un champ dans Kali, puis saisis ici', 'Select a Kali field, then type here', 'اختر حقلًا في كالي ثم اكتب هنا')} value={text} onChange={event => setText(event.target.value)} maxLength={2000} autoComplete="off" style={{ flex: 1, minWidth: 180, padding: 10, borderRadius: 8, border: '1px solid #52746b', color: '#e5eced', background: '#182b26' }} />
      <Button quiet title={t('Saisir le texte', 'Type text', 'إدخال النص')} disabled={status !== 'connected' || !text} onPress={() => {
        for (const char of text) { const point = char.codePointAt(0)!; client.current?.sendKey(point > 255 ? 0x01000000 | point : point, ''); }
        setText(''); client.current?.focus();
      }} />
      <Button quiet title="Enter" disabled={status !== 'connected'} onPress={() => { client.current?.sendKey(0xff0d, 'Enter'); client.current?.focus(); }} />
      <Button quiet title="Tab" disabled={status !== 'connected'} onPress={() => { client.current?.sendKey(0xff09, 'Tab'); client.current?.focus(); }} />
      <Button quiet title="Esc" disabled={status !== 'connected'} onPress={() => { client.current?.sendKey(0xff1b, 'Escape'); client.current?.focus(); }} />
    </div>
    <Label size={12} style={{ color: '#b1c9c3' }}>{t(
      'Ouvre Applications dans le bureau pour lancer les outils Kali. Ce PC doit rester allumé. Fermer le bureau termine ses applications ouvertes.',
      'Open Applications on the desktop to launch Kali tools. Keep this PC running. Closing the desktop ends its open applications.',
      'افتح قائمة التطبيقات في سطح المكتب لتشغيل أدوات كالي. أبقِ هذا الحاسوب قيد التشغيل. إغلاق سطح المكتب ينهي تطبيقاته المفتوحة.',
    )}</Label>
    {!!error && <Label style={{ color: '#ffb6ab' }}>{error === 'LOCAL_LAB_ONLY'
      ? t('Utilise cette fonction sur localhost:8081 sur ce PC.', 'Use this feature at localhost:8081 on this PC.', 'استخدم هذه الميزة على localhost:8081 على هذا الحاسوب.')
      : error === 'OWNER_LOGIN_REQUIRED' ? t('Reconnecte-toi avec ton compte propriétaire.', 'Sign in again with your owner account.', 'سجّل الدخول مجددًا بحساب المالك.')
        : t('Impossible de connecter le bureau. Vérifie le serveur local puis réessaie.', 'Could not connect the desktop. Check the local server, then retry.', 'تعذر الاتصال بسطح المكتب. تحقق من الخادم المحلي ثم أعد المحاولة.')}</Label>}
    <div ref={host} aria-label="Live Kali Linux desktop" style={{ flex: 1, minHeight: 260, width: '100%', overflow: 'hidden', background: '#101820' }} />
  </View>;
}
