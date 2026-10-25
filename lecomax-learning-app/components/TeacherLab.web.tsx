import React, { useState } from 'react';
import { Modal, View } from 'react-native';



import * as Clipboard from 'expo-clipboard';

import { useSchool } from '../store/School';
import { Button, Label } from './UI';
import { WebTerminalSession as Session } from './WebTerminalSession';
import { KaliDesktop } from './KaliDesktop.web';
import { PythonStudio } from './PythonStudio.web';

type Runtime = 'powershell' | 'python' | 'javascript' | 'kali';
export type LabSeed = { runtime: Runtime; code: string };
export function labRuntime(language = ''): Runtime | null {
  return /^(js|javascript|node|nodejs)$/i.test(language)
    ? 'javascript'
    : /^(powershell|ps1|pwsh)$/i.test(language)
      ? 'powershell'
      : /^(python|python3|py)$/i.test(language)
        ? 'python'
        : null;
}
export function TeacherLab({
  visible,
  seed,
  onClose,
  onExplain,
}: {
  visible: boolean;
  seed: LabSeed | null;
  onClose: () => void;
  onExplain: (prompt: string) => void;
}) {
  const { t, rtl } = useSchool();
  const [runtime, setRuntime] = useState<Runtime>(seed?.runtime || 'powershell');
  const [opened, setOpened] = useState<Runtime[]>([seed?.runtime || 'powershell']);
  const [desktop, setDesktop] = useState(false);
  const [pcPython, setPcPython] = useState(false);
  const switchRuntime = (selected: string) => { const value = selected === 'python-pc' ? 'python' : selected as Runtime; setDesktop(false); setPcPython(selected === 'python-pc'); setRuntime(value); setOpened(current => current.includes(value) ? current : [...current, value]); };
  const environmentControl = <label>{t('Environnement', 'Runtime', 'بيئة التشغيل')}<select aria-label={t('Environnement', 'Runtime', 'بيئة التشغيل')} value={runtime === 'python' && pcPython ? 'python-pc' : runtime} onChange={event => switchRuntime(event.target.value)}><option value="python">Python</option><option value="python-pc">Python · PC</option><option value="powershell">PowerShell</option><option value="javascript">Node.js</option><option value="kali">Kali Linux</option></select></label>;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, minHeight: 0, backgroundColor: runtime === 'python' && !pcPython ? '#f4f5f7' : '#101820' }}>
        {(runtime !== 'python' || pcPython) && <div dir={rtl ? 'rtl' : 'ltr'} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderBottom: '1px solid #223047', fontFamily: '"Segoe UI", Tahoma, sans-serif', background: '#101b2c', color: '#e3ebe6', flexShrink: 0 }}>
          <span style={{ fontWeight: 750, fontSize: 12, letterSpacing: 1, flex: 1 }}>ACADEMY <span style={{ color: '#738092', fontWeight: 400 }}> / LAB</span></span>
          <select aria-label={t('Environnement', 'Runtime', 'بيئة التشغيل')} value={runtime === 'python' && pcPython ? 'python-pc' : runtime} onChange={event => { const selected = event.target.value; const value = selected === 'python-pc' ? 'python' : selected as Runtime; setDesktop(false); setPcPython(selected === 'python-pc'); setRuntime(value); setOpened(current => current.includes(value) ? current : [...current, value]); }} style={{ minHeight: 40, maxWidth: '48%', border: '1px solid #31415b', borderRadius: 8, padding: '6px 8px', background: '#18253a', color: '#dce6f3', fontFamily: 'inherit', fontSize: 12 }}>
            <option value="python">Python</option><option value="python-pc">Python · {t('PC avancé', 'Advanced PC', 'الحاسوب')}</option><option value="powershell">PowerShell</option><option value="javascript">Node.js</option><option value="kali">Kali Linux</option>
          </select>
          <button onClick={onClose} aria-label={t('Fermer les sessions', 'Close sessions', 'إغلاق الجلسات')} style={{ background: 'transparent', color: '#9caec5', border: 0, borderRadius: 8, minWidth: 44, minHeight: 44, fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>}
        {runtime === 'kali' && (
          <View style={{ gap: 4 }}>
            <Button
              selected={desktop}
              title={desktop ? t('Retour au terminal Kali', 'Back to Kali terminal', 'العودة إلى طرفية كالي') : t('Ouvrir le bureau Kali ici', 'Open Kali desktop here', 'افتح سطح مكتب كالي هنا')}
              onPress={() => setDesktop(value => !value)}
            />
            <Label size={12} style={{ color: '#b1c9c3' }}>
              {t(
                'Bureau Kali : colle la commande dans PowerShell Windows. Au premier lancement, Win-KeX demande un mot de passe de bureau.',
                'Kali desktop: paste the command into Windows PowerShell. On first launch, Win-KeX asks you to set a desktop password.',
                'سطح مكتب كالي: الصق الأمر في PowerShell على ويندوز. عند التشغيل الأول يطلب Win-KeX تعيين كلمة مرور لسطح المكتب.',
              )}
            </Label>
            <Button
              quiet
              title={t('Copier la commande du bureau', 'Copy desktop command', 'نسخ أمر سطح المكتب')}
              onPress={() => void Clipboard.setStringAsync('wsl -d kali-linux kex --win -s')}
            />
          </View>
        )}
        {!!seed?.code && (runtime !== 'python' || pcPython) && (
          <Button
            quiet
            title={t('Copier l’exemple du professeur', 'Copy teacher example', 'نسخ مثال الأستاذ')}
            onPress={() => void Clipboard.setStringAsync(seed.code)}
          />
        )}
        {visible && desktop && runtime === 'kali' && <KaliDesktop />}
        {visible && opened.includes('python') && <PythonStudio seed={seed?.runtime === 'python' ? seed.code : undefined} active={runtime === 'python' && !pcPython} onClose={onClose} environmentControl={environmentControl} onExplain={(prompt) => { onExplain(prompt); onClose(); }} />}
        {visible && pcPython && <Session runtime="python" active={runtime === 'python'} onExplain={(prompt) => { onExplain(prompt); onClose(); }} />}
        {visible &&
          opened.filter(value => value !== 'python').map((value) => (
            <Session
              key={value}
              runtime={value}
              active={runtime === value && !desktop}
              onExplain={(prompt) => {
                onExplain(prompt);
                onClose();
              }}
            />
          ))}
      </View>
    </Modal>
  );
}
