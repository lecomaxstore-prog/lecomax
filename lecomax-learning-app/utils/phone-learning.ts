import { phoneTopics, type PhoneTopicId } from '../data/phone-explorer';
export const PHONE_LEARNING_KEY = 'phone-explorer:understood';
export function phoneLearningIds(raw: string | undefined): PhoneTopicId[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is PhoneTopicId => typeof id === 'string' && phoneTopics.some(t => t.id === id)))];
  } catch { return []; }
}
