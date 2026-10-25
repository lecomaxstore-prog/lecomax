// Keep a valid JSON handoff instead of cutting JSON mid-string at the transport limit.
// Retain the pending question, while bounding older evidence and lesson excerpts.
export function boundedTutorContext(value: Record<string, unknown>) {
  for (const limit of [600, 300, 150]) {
    const result = JSON.stringify(value, (key, item) => {
      if (typeof item === 'string') return item.slice(0, key === 'prompt' ? 3000 : limit);
      if (Array.isArray(item)) return item.slice(-4);
      if (key === 'answers' && item && typeof item === 'object')
        return Object.fromEntries(Object.entries(item).slice(-8));
      return item;
    });
    if (result.length <= 14000) return result;
  }
  throw new Error('CONTEXT_CAPACITY');
}
