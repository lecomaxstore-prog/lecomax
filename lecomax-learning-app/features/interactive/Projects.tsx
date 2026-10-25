import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { CodeLab } from './CodeLab';
import { Mentor } from './Mentor';
import { readSaved, starters } from './model';
const projects = [
  { id: 'square-library', title: 'Build a calculation library', language: 'javascript', prerequisite: 'Functions, numbers and return values', outcome: 'A square function that works for positive, negative, zero and fractional values.', milestones: ['Describe the function contract', 'Implement and test square', 'Explain an edge case'] },
  { id: 'shop-data', title: 'Analyze shop customers', language: 'sql', prerequisite: 'SELECT, WHERE and ORDER BY', outcome: 'An exact, ordered result for the two Rabat customers.', milestones: ['Explain the table relationship', 'Write and test the query', 'Explain why order matters'] },
  { id: 'portfolio', title: 'Create a personal website', language: 'web', prerequisite: 'HTML tags and CSS selectors', outcome: 'A readable portfolio at phone and desktop sizes.', milestones: ['Describe the audience and content', 'Inspect both preview widths', 'Record accessibility and keyboard observations'] },
  { id: 'counter', title: 'Design a React counter', language: 'react', prerequisite: 'JavaScript functions and state', outcome: 'A component and a test plan; external runtime verification is required.', milestones: ['Explain state and event handling', 'Write the component', 'Record external runtime results'] },
] as const;
export function Projects() {
  const { state, update } = useSchool(); const [id, setId] = useState<string>(projects[0].id); const project = projects.find(p => p.id === id)!;
  const key = `interactive:project:${id}`; const notes = readSaved<string[]>(state.drafts[key], ['', '', '']);
  const [report, setReport] = useState('');
  const grade = readSaved<{ passed: boolean; code: string } | null>(state.drafts[`interactive:code:${id}:grade`], null);
  const currentCode = state.drafts[`interactive:code:${id}`] ?? starters[project.language];
  const evaluate = () => {
    const missing = project.milestones.filter((_, i) => !notes[i]?.trim());
    const tested = grade?.passed && grade.code === currentCode;
    const message = missing.length ? `Needs work: add evidence for ${missing.join('; ')}.` : project.language === 'web' || project.language === 'react' ? 'Evidence saved for mentor review. Your manual observations are not automatic runtime verification.' : tested ? 'The current code passed the project tests. Your explanation is saved for mentor review; passing examples does not prove every possible case.' : 'Run the exercise tests on your current source before this project can be verified.';
    setReport(message); update(p => ({ ...p, drafts: { ...p.drafts, [`${key}:evaluation`]: JSON.stringify({ at: Date.now(), tested: !!tested, message }) } }));
  };
  return <View style={{ gap: 18 }}><Row>{projects.map(item => <Button quiet key={item.id} title={item.title} selected={id === item.id} onPress={() => { setId(item.id); setReport(''); }} />)}</Row><Card><Label bold size={22}>{project.title}</Label><Label>Beginner · Prerequisites: {project.prerequisite}</Label><Label>Expected outcome: {project.outcome}</Label>{project.milestones.map((milestone, i) => <View key={milestone}><Label bold>{i + 1}. {milestone}</Label><Field placeholder="" accessibilityLabel={milestone} multiline maxLength={1500} value={notes[i] || ''} onChangeText={text => update(p => { const previous = readSaved<string[]>(p.drafts[key], ['', '', '']); previous[i] = text; return { ...p, drafts: { ...p.drafts, [key]: JSON.stringify(previous) } }; })} /></View>)}<Button title="Evaluate project evidence" onPress={evaluate} /><Label accessibilityLiveRegion="polite">{report || readSaved<{ message: string } | null>(state.drafts[`${key}:evaluation`], null)?.message}</Label></Card><CodeLab key={id} language={project.language} project={id} /><Mentor context={`Project: ${project.title}\nOutcome: ${project.outcome}\nMilestone evidence: ${JSON.stringify(notes)}\nVerification: ${report || 'Not evaluated in this session.'}`} /></View>;
}
