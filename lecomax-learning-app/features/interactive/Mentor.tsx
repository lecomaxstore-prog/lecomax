import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { newTutorSession } from '../../utils/tutor-memory';
import { requestTutor } from '../../services/tutor';
export function Mentor({ context }: { context: string }) {
  const { state, t } = useSchool(); const [approvedContext, setApprovedContext] = useState<string | null>(null); const consent = approvedContext === context; const [question, setQuestion] = useState('Give me a hint without revealing the solution.'); const [answer, setAnswer] = useState(''); const [busy, setBusy] = useState(false); const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function ask() {
    if (!consent || busy || !question.trim()) return;
    const controller = new AbortController(); abort.current = controller; setBusy(true); setAnswer(''); const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const result = await requestTutor(newTutorSession('Interactive studio help', 'programming'), question.slice(0, 2000), { language: state.language, profile: { name: '', goal: 'Studio practice', motivation: '', level: state.academy.profile.level, teacherLanguage: state.academy.profile.teacherLanguage, dailyMinutes: 20, format: 'practice', approach: 'structured', onboarded: true }, context: `Learner-approved studio context. Only reported runtime results count as executed; do not claim additional execution.\n${context.slice(0, 10000)}`, action: 'ask', conversationLanguage: state.language, exam: { type: 'Practice', minutes: 20, target: '80%', difficulty: state.academy.profile.level }, signal: controller.signal });
      setAnswer(result.reply.answer);
    } catch { setAnswer(controller.signal.aborted ? 'Request stopped. Your work is saved.' : 'Teacher unavailable. Your work is saved; try again.'); }
    finally { clearTimeout(timer); setBusy(false); }
  }
  return <Card><Label bold>{t('Mentor IA', 'AI mentor', 'المرشد الذكي')}</Label><Label muted>Review the context below. Your selected language and learning level are also shared. The teacher suggests explanations; it does not execute your code.</Label><Label selectable size={12}>{context.slice(0, 10000)}</Label><Field placeholder="" accessibilityLabel="Question for mentor" value={question} onChangeText={setQuestion} multiline maxLength={2000} /><Row>{['Explain this error.', 'Give me a hint.', 'Review my solution.'].map(q => <Button key={q} quiet title={q} onPress={() => setQuestion(q)} />)}</Row><Button quiet selected={consent} title={consent ? 'Context sharing allowed for this request' : 'Allow sharing the context above'} onPress={() => setApprovedContext(consent ? null : context)} /><Button title={busy ? 'Asking…' : 'Ask teacher'} disabled={!consent || busy || !question.trim()} onPress={() => void ask()} />{busy && <Button quiet title="Cancel request" onPress={() => abort.current?.abort()} />}{!!answer && <Label selectable accessibilityLiveRegion="polite">{answer}</Label>}</Card>;
}
