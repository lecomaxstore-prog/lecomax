exports.plan = () => ({
  id: 'plan-journey', goal: 'Become a software developer', title: 'Programming foundations',
  language: 'en', createdAt: '2026-10-15T12:00:00.000Z', verification: 'AI-generated educational starter course.',
  project: 'Explain a small program', criteria: ['Explain each value'],
  design: { version: 1, prerequisites: [[], [0], [1]], diagnostic: Array.from({ length: 3 }, (_, i) => ({ prompt: `Starting question ${i}`, options: ['Baseline correct', 'Baseline incorrect'], correctIndex: 0, explanation: 'Baseline feedback' })) },
  lessons: Array.from({ length: 3 }, (_, i) => ({ title: `Concept ${i}`, objective: `Apply concept ${i}`, minutes: 10,
    explanation: 'A value represents information.', example: 'A number represents a quantity.', mistake: 'Text and numbers differ.',
    exercise: 'Explain a value in your own words.', solution: 'A value represents a piece of information.', summary: 'Values represent information.',
    quiz: [{ prompt: 'What does a number represent?', options: ['A quantity', 'Nothing'], correctIndex: 0, explanation: 'Numbers represent quantities.' },
      { prompt: 'Are text and numbers the same type?', options: ['No', 'Yes'], correctIndex: 0, explanation: 'They are different types.' }] }))
});
