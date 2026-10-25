import { phoneTopics } from '../data/phone-explorer';
import { phoneAssembly } from '../data/phone-assembly';
import type { Language } from '../types/content';

// Build context from bundled lessons, not arbitrary text supplied by the embedded page.
export function phoneTeacherRoute(value: unknown, language: Language) {
  if (!value || typeof value !== 'object') return null;
  const message = value as Record<string, unknown>;
  if (message.type !== 'ask-phone-teacher' || typeof message.id !== 'string') return null;
  const topic = phoneTopics.find(item => item.id === message.id);
  if (!topic || !['explain', 'example', 'quiz', 'question'].includes(String(message.intent))) return null;
  if (message.intent === 'question' && (typeof message.question !== 'string' || !message.question.trim() || message.question.length > 600)) return null;
  const requests = {
    explain: 'Explain this component simply, step by step, using an everyday analogy. End with one question to check my understanding.',
    example: 'Give a concrete example of how this component works with other phone parts. Explain the sequence simply.',
    quiz: 'Ask me one beginner-friendly question about this component. Wait for my answer before revealing the solution, and offer a hint if needed.',
    question: typeof message.question === 'string' ? message.question.trim() : '',
  };
  const question = [
    `I am learning about a phone component: ${topic.name[language]} (${topic.name.en}).`,
    `Lesson: ${topic.detail[language]}`,
    `Example: ${topic.example[language]}`,
    ...(phoneAssembly[topic.id] ? [
      `Position: ${phoneAssembly[topic.id]!.position[language]}`,
      `Assembly principles: ${phoneAssembly[topic.id]!.fitting[language]}`,
      `Related components: ${phoneAssembly[topic.id]!.related.map(id => phoneTopics.find(p => p.id === id)!.name[language]).join(', ')}`,
    ] : []),
    `My request: ${requests[message.intent as keyof typeof requests]}`,
    `Reply in ${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}. Keep this a beginner electronics lesson, not a programming lesson.`,
    'The phone illustration is AI-generated. You have its lesson text, not a photograph or a verified model-specific teardown. Do not infer exact part numbers, measurements or hidden construction from it. Explain the component family and distinguish general knowledge from model-specific details.',
  ].join('\n\n');
  return { pathname: '/(tabs)/teacher' as const, params: { question, explain: String(Date.now()) } };
}
