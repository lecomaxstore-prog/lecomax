import { pcTopics, type PcTopicId } from '../data/pc-explorer';
import { laptopTopics } from '../data/laptop-explorer';
export const PC_LEARNING_KEY = 'pc-explorer:understood';
export function pcLearningIds(raw: string | undefined): (PcTopicId | `laptop:${string}`)[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is PcTopicId | `laptop:${string}` => typeof id === 'string' && (pcTopics.some(t => t.id === id) || laptopTopics.some(t => `laptop:${t.id}` === id))))];
  } catch { return []; }
}
