import { pcTopics } from '../data/pc-explorer';
import { laptopTopics } from '../data/laptop-explorer';
import { computerAssembly } from '../data/computer-assembly';
import type { Language } from '../types/content';
export function pcTeacherRoute(value: unknown, language: Language) {
  if (!value || typeof value !== 'object') return null;
  const message = value as Record<string, unknown>;
  if (message.type !== 'ask-pc-teacher' || typeof message.id !== 'string') return null;
  if (message.device !== undefined && !['desktop', 'laptop'].includes(String(message.device))) return null;
  const device = message.device === 'laptop' ? 'laptop' : 'desktop';
  const topic = (device === 'laptop' ? laptopTopics : pcTopics).find(item => item.id === message.id);
  if (!topic || !['explain', 'example', 'quiz', 'question'].includes(String(message.intent))) return null;
  if (message.intent === 'question' && (typeof message.question !== 'string' || !message.question.trim() || message.question.length > 600)) return null;
  const requests = {
    explain: 'Explain this component simply, with an everyday analogy. End with one question to check understanding.',
    example: 'Explain a concrete sequence showing how this part works with other computer components.',
    quiz: 'Ask one beginner-friendly question about this component. Wait for my answer before revealing the solution.',
    question: typeof message.question === 'string' ? message.question.trim() : '',
  };
  const question = [
    `I am learning about a ${device} computer component: ${topic.name[language]} (${topic.name.en}).`,
    `Lesson: ${topic.detail[language]}\nPhysical parts: ${topic.anatomy[language]}\nExample: ${topic.example[language]}`,
    `Assembly principles: ${computerAssembly(device, topic.id).fitting[language]}`,
    `My request: ${requests[message.intent as keyof typeof requests]}`,
    `Reply in ${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}. Teach beginner computer hardware, not programming.`,
    'The interior is an AI-generated educational illustration, not a photograph or scan of a particular product. Do not infer exact chip locations, specifications or compatibility. Covered parts are not visually identified. Distinguish laptop construction from desktop construction. Never advise opening a power supply enclosure.',
  ].join('\n\n');
  return { pathname: '/(tabs)/teacher' as const, params: { question, explain: String(Date.now()) } };
}
