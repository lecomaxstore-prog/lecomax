import React, { useState } from 'react';
import { PythonStudio } from '../../components/PythonStudio.web';
import { Mentor } from './Mentor';
export function PythonLab() {
  const [context, setContext] = useState('');
  return <><div style={{ height: '85dvh', minHeight: 520, display: 'flex', flexDirection: 'column', minWidth: 0 }}><PythonStudio active onExplain={setContext} /></div>{context && <Mentor context={context} />}</>;
}
