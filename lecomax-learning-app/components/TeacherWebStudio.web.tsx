import React, { useEffect, useRef, useState } from 'react';
import { Button, Label, Row } from './UI';
import { TeacherSheet } from './TeacherUI';
import { useSchool } from '../store/School';
import { auth, API } from '../services/auth';
import {
  previewDocument,
  starterWebFiles,
  validWebFiles,
  type WebFiles,
} from '../utils/web-studio';
export type WebSeed = { language: string; code: string };
const storageKey = 'lecomax.web-studio.v1';
export function TeacherWebStudio({
  visible,
  onClose,
  seed,
  onExplain,
}: {
  visible: boolean;
  onClose: () => void;
  seed?: WebSeed | null;
  onExplain: (prompt: string) => void;
}) {
  const { t, colors } = useSchool();
  const [files, setFiles] = useState<WebFiles>(() => {
    let initial = starterWebFiles;
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (validWebFiles(saved)) initial = saved;
    } catch {}
    if (seed)
      return {
        ...initial,
        [/^(html|htm)$/i.test(seed.language)
          ? 'html'
          : seed.language === 'css'
            ? 'css'
            : 'javascript']: seed.code.slice(0, 20000),
      };
    return { ...initial };
  });
  const [tab, setTab] = useState<keyof WebFiles>(
    seed?.language === 'css'
      ? 'css'
      : /^(js|javascript)$/.test(seed?.language || '')
        ? 'javascript'
        : 'html',
  );
  const [preview, setPreview] = useState(() => previewDocument(files));
  const [live, setLive] = useState(true);
  const [phone, setPhone] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ directory: string; vscodeUrl: string } | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(files));
      } catch {
        setStatus(
          t('Brouillon non enregistré.', 'Draft could not be saved.', 'تعذّر حفظ المسودة.'),
        );
      }
      if (visible && live) {
        setPreview(previewDocument(files));
        setLogs([]);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [files, live, visible, t]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        !visible ||
        event.source !== frame.current?.contentWindow ||
        event.data?.studioConsole !== true ||
        typeof event.data.text !== 'string'
      )
        return;
      setLogs((current) => [
        ...current.slice(-79),
        `${event.data.kind === 'error' ? 'ERROR' : event.data.kind === 'warn' ? 'WARN' : 'LOG'}: ${event.data.text.slice(0, 2000)}`,
      ]);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [visible]);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setStatus('');
    setSaved(null);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15000);
    try {
      const token = await auth.token();
      if (!token) throw new Error('Sign in again.');
      const response = await fetch(API + '/api/learning-mobile/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(files),
        signal: abort.signal,
      });
      if (!response.ok) throw new Error('Local workspace unavailable.');
      const result = await response.json();
      if (typeof result.vscodeUrl !== 'string' || !result.vscodeUrl.startsWith('vscode://file/'))
        throw new Error('Invalid workspace.');
      setSaved(result);
    } catch {
      setStatus(
        t(
          'Impossible de sauvegarder. Vérifie la connexion et le serveur local.',
          'Could not save. Check your sign-in and the local server.',
          'تعذّر الحفظ. تحقق من تسجيل الدخول والخادم المحلي.',
        ),
      );
    } finally {
      clearTimeout(timer);
      setSaving(false);
    }
  };
  return (
    <TeacherSheet
      visible={visible}
      onClose={onClose}
      title={t('Éditeur & aperçu web', 'Web editor & preview', 'محرر الويب والمعاينة')}
    >
      <Label muted size={13}>
        {t(
          'HTML structure, CSS apparence, JavaScript interactions. Modifie le bouton et teste-le dans l’aperçu.',
          'HTML builds the page, CSS styles it, JavaScript adds interaction. Edit the button and try it in the preview.',
          'HTML يبني الصفحة وCSS ينسّقها وJavaScript يضيف التفاعل. عدّل الزر وجرّبه في المعاينة.',
        )}
      </Label>
      <Row>
        {(['html', 'css', 'javascript'] as const).map((key) => (
          <Button
            key={key}
            quiet
            selected={tab === key}
            title={{ html: 'index.html', css: 'style.css', javascript: 'script.js' }[key]}
            onPress={() => setTab(key)}
          />
        ))}
      </Row>
      <textarea
        aria-label={t('Éditeur de code', 'Code editor', 'محرر الكود') + ': ' + tab}
        spellCheck={false}
        value={files[tab]}
        maxLength={20000}
        onChange={(event) => {
          setFiles({ ...files, [tab]: event.target.value });
          setSaved(null);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          event.preventDefault();
          const target = event.currentTarget;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          setFiles({ ...files, [tab]: files[tab].slice(0, start) + '  ' + files[tab].slice(end) });
          setSaved(null);
          requestAnimationFrame(() => {
            target.selectionStart = target.selectionEnd = start + 2;
          });
        }}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          minHeight: 240,
          resize: 'vertical',
          background: '#112b26',
          color: '#e2eee6',
          font: '14px/1.6 monospace',
          direction: 'ltr',
          textAlign: 'left',
          padding: 16,
          borderRadius: 12,
          border: '1px solid #436458',
          tabSize: 2,
        }}
      />
      <Row>
        <Button
          quiet
          selected={live}
          title={t('Aperçu en direct', 'Live preview', 'معاينة مباشرة')}
          onPress={() => setLive(!live)}
        />
        <Button
          quiet
          title={t('Actualiser', 'Refresh preview', 'تحديث المعاينة')}
          onPress={() => {
            setPreview(previewDocument(files));
            setLogs([]);
            if (frame.current) frame.current.srcdoc = previewDocument(files);
          }}
        />
        <Button
          quiet
          selected={phone}
          title={t('Format téléphone', 'Phone width', 'عرض الهاتف')}
          onPress={() => setPhone(!phone)}
        />
      </Row>
      {visible && (
        <iframe
          ref={frame}
          title={t('Aperçu de la page', 'Page preview', 'معاينة الصفحة')}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          srcDoc={preview}
          style={{
            width: phone ? 'min(375px, 100%)' : '100%',
            height: 280,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 12,
            alignSelf: 'center',
          }}
        />
      )}
      <Label size={12} muted>
        {t(
          'HTML/CSS/JavaScript uniquement. Réseau et accès à l’application bloqués dans l’aperçu ; React/Next.js nécessitent leur propre serveur.',
          'HTML/CSS/JavaScript only. Network and app access are blocked in the preview; React/Next.js need their own server.',
          'HTML وCSS وJavaScript فقط. تمنع المعاينة الوصول للشبكة وللتطبيق؛ يحتاج React وNext.js إلى خادم خاص.',
        )}
      </Label>
      <Label bold>Console</Label>
      <pre
        style={{
          background: '#112b26',
          color: '#e2eee6',
          padding: 12,
          borderRadius: 12,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          maxHeight: 150,
          overflow: 'auto',
          direction: 'ltr',
          fontSize: 12,
        }}
      >
        {logs.join('\n') ||
          t(
            'Clique sur le bouton dans l’aperçu.',
            'Click the button in the preview.',
            'اضغط الزر داخل المعاينة.',
          )}
      </pre>
      <Button
        quiet
        title={t('Expliquer cette page', 'Explain this page', 'اشرح هذه الصفحة')}
        onPress={() => {
          onExplain(
            t(
              'Explique ce que fait cette page et pourquoi chaque partie est nécessaire. Propose un petit changement à tester.',
              'Explain what this page does and why each part is needed. Suggest one small change to test.',
              'اشرح ما تفعله هذه الصفحة ولماذا نحتاج كل جزء. اقترح تغييرًا صغيرًا أجربه.',
            ) +
              '\n' +
              JSON.stringify(files).slice(0, 4900),
          );
          onClose();
        }}
      />
      <Button
        title={
          saving
            ? t('Enregistrement…', 'Saving…', 'جارٍ الحفظ…')
            : t(
                'Enregistrer une copie pour VS Code',
                'Save a copy for VS Code',
                'احفظ نسخة لـ VS Code',
              )
        }
        disabled={saving}
        onPress={() => void save()}
      />
      {saved && (
        <>
          <a href={saved.vscodeUrl} style={{ color: colors.accent, padding: 12, fontWeight: 700 }}>
            {t('Ouvrir dans VS Code', 'Open in VS Code', 'افتح في VS Code')}
          </a>
          <Label selectable size={12}>
            {saved.directory}
          </Label>
        </>
      )}
      <Label muted size={12}>
        {t(
          'La copie locale contient les trois fichiers. Les modifications dans VS Code ne reviennent pas dans cet éditeur. Ouvre index.html dans ton navigateur pour la prévisualiser.',
          'The local copy contains all three files. VS Code edits do not sync back here. Open its index.html in your browser to preview that copy.',
          'تحتوي النسخة المحلية على الملفات الثلاثة. تعديلات VS Code لا تتزامن مع هذا المحرر. افتح index.html في المتصفح لمعاينة النسخة.',
        )}
      </Label>
      {!!status && <Label accessibilityRole="alert">{status}</Label>}
    </TeacherSheet>
  );
}
