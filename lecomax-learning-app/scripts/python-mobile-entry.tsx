import React from 'react';
import { createRoot } from 'react-dom/client';
import { PythonStudio } from '../components/PythonStudio.web';
import { PythonMobileSchool, sendMobile, useSchool } from './python-mobile-school';
import { copyPythonMobileText } from '../utils/python-mobile-clipboard';
const seed = (window as unknown as { pythonSeed?: string }).pythonSeed;
const saveDraft = (key: string, code: string) => sendMobile({ type: 'draft', key, code });
function MobileStudio() {
  const { t, offlineAndroid } = useSchool();
  return <PythonStudio active seed={seed} onDraft={saveDraft} onCopy={copyPythonMobileText} onClose={() => sendMobile({ type: 'close' })} onExplain={prompt => sendMobile({ type: 'explain', prompt })}
    environmentControl={offlineAndroid ? <button onClick={() => sendMobile({ type: 'offline' })}>{t('Console Android hors ligne', 'Offline Android console', 'طرفية أندرويد دون إنترنت')}</button> : undefined} />;
}
createRoot(document.getElementById('root')!).render(<PythonMobileSchool><MobileStudio /></PythonMobileSchool>);
