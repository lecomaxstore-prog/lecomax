import { askTeacherReply } from './teacher';
import { parsePlanReply, type LearnerProfile, type StudyPlan } from '../utils/academy';

export async function generateStudyPlan(
  goal: string,
  profile: LearnerProfile,
  signal: AbortSignal,
): Promise<StudyPlan> {
  const prompt = `Create a small, complete starter course for this learning goal: ${JSON.stringify(goal)}.
Return ONLY a JSON object, without markdown. Use exactly 3 sequential lessons (not an entire qualification). Respect the learner preferences supplied separately. All prose and quiz choices must use the teacher language. Each lesson must teach substantive material with a concrete example, an exercise and 2 multiple-choice questions with unambiguous correct answers. Do not invent citations, sources checked, credentials, current facts or mastery. In verification describe limitations and any specialized sources the learner must verify. For sensitive/specialized topics provide general educational foundations. Never include operationally harmful instructions.
Schema: {"title":"course title","verification":"AI-generated; scope and source verification needed","project":"a small final application project","criteria":["observable project success criterion"],"lessons":[{"title":"lesson title","objective":"observable learning objective","minutes":10,"explanation":"a complete beginner-friendly explanation","example":"worked concrete example with reasoning","mistake":"common mistake and correction","exercise":"independent practice task","solution":"explained solution","summary":"key takeaway","quiz":[{"prompt":"question","options":["choice A","choice B","choice C"],"correctIndex":0,"explanation":"reason the correct choice is correct"}]}]}
Also include "design":{"version":1,"prerequisites":[[],[0],[0,1]],"diagnostic":[question,question,question]}. Prerequisites are zero-based lesson indices: only include actual dependencies, always earlier than the dependent lesson. Supply one diagnostic multiple-choice question per lesson using the same question schema, testing its starting knowledge with a DIFFERENT question from that lesson's quiz. Do not reuse quiz prompts. This is a provisional AI-authored graph, not verified fact.
Supply 3 lessons and 2 questions per lesson. Do not use placeholder text. Field character limits: title 200, verification 1000, project 2000, each criterion 400 (1–8 criteria); lesson objective 600, explanation 5000, example 2500, mistake 800, exercise 1500, solution 2500, summary 800; question prompt 800, each option 500, answer explanation 1000. Minutes must be an integer from 1 to 120, correctIndex a zero-based integer. Keep the response below 24000 characters.`;
  const reply = await askTeacherReply(
    prompt,
    profile.teacherLanguage === 'darija' ? 'ar' : profile.teacherLanguage,
    'study-plan',
    '',
    [],
    { profile, signal, level: profile.level === 'zero' ? 'beginner' : profile.level },
  );
  const content = parsePlanReply(reply.answer);
  if (!content.design) throw new Error('Missing learning design');
  return {
    ...content,
    id: `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    goal,
    createdAt: new Date().toISOString(),
    language: profile.teacherLanguage,
  };
}
