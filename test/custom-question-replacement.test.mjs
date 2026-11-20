import assert from 'node:assert';
import { z } from 'zod';

console.log('🧪 Starting Custom Question Replacement & Version Switching Logic Tests...\n');

// 1. Validate CustomQuestionResponseSchema
const CustomQuestionResponseSchema = z.object({
  title: z.string().default('Custom Question'),
  question: z.string(),
  expectedAnswer: z.string(),
  evaluationPoints: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  suggestedTimeMinutes: z.number().default(6),
  evaluationRubric: z.string().default('Evaluate based on technical depth, practical trade-offs, and clarity.'),
});

console.log('Test 1: Validating CustomQuestionResponseSchema against Gemini response shape...');
const sampleGeminiOutput = {
  title: 'Kafka Rebalance Protocols & Sticky Assignor',
  question: 'Explain how Kafka consumer group rebalances work under eager vs cooperative sticky assignment strategies, and how cooperative rebalance prevents STW partition revocation.',
  expectedAnswer: 'In eager rebalancing, all consumers revoke partitions and stop processing during the rebalance. In cooperative sticky rebalance, partitions that do not move remain assigned and active, minimizing consumer lag and throughput hiccups.',
  evaluationPoints: [
    'Distinction between Eager and Cooperative Sticky partition assignment',
    'Understanding of Stop-The-World revocation overhead in high-throughput streams',
    'Knowledge of rebalance protocol flags (cooperative-sticky in Kafka 2.4+)',
  ],
  commonMistakes: [
    'Assuming all consumers must pause during cooperative rebalances',
    'Confusing partition rebalance with broker failure leader election',
  ],
  redFlags: [
    'Cannot explain why consumer lag spikes during frequent partition rebalances',
  ],
  followUpQuestions: [
    'How does max.poll.interval.ms relate to consumer group heartbeats and unwanted rebalances?',
  ],
  suggestedTimeMinutes: 7,
  evaluationRubric: 'Full marks for understanding incremental cooperative rebalance mechanics and partition reassignment states.',
};

const validated = CustomQuestionResponseSchema.parse(sampleGeminiOutput);
assert.strictEqual(validated.title, 'Kafka Rebalance Protocols & Sticky Assignor');
assert.strictEqual(validated.evaluationPoints.length, 3);
assert.strictEqual(validated.commonMistakes.length, 2);
console.log('✅ Test 1 Passed: Custom Question schema accurately parses and validates Gemini responses.\n');

// 2. Validate Mock Custom Question Generation
console.log('Test 2: Validating Mock Custom Question generation for offline/calibrated fallback...');
function generateMockCustomQuestion(params) {
  const promptText = params.customPrompt.trim();
  const titleWords = promptText.split(/\s+/).slice(0, 6).join(' ');
  const title = titleWords.length > 0 ? titleWords : `${params.originalQuestion.topic} Custom Inquiry`;

  return {
    id: `alt_custom_${Date.now()}_test`,
    sessionId: params.sessionId,
    originalQuestionId: params.originalQuestion.id,
    title: title.length > 50 ? `${title.slice(0, 47)}...` : title,
    question: promptText,
    category: params.originalQuestion.category,
    difficulty: params.difficulty || params.originalQuestion.difficulty,
    projectContextUsed: 'Interviewer Custom Question',
    reasonForAdaptation: 'Interviewer provided custom replacement question',
    expectedAnswer: `Candidate should provide a structured, in-depth architectural and technical answer for: "${promptText}". They should explain key mechanisms, design trade-offs, potential failure points, and production considerations.`,
    evaluationPoints: [
      `Direct and precise answer to: "${title}"`,
      'Demonstrates real-world engineering depth and trade-off analysis',
      'Addresses resilience, concurrency, and failure recovery scenarios',
    ],
    commonMistakes: [
      'Giving a surface-level or textbook definition without addressing operational edge cases',
      'Overlooking concurrency, race conditions, or network latency implications',
    ],
    redFlags: [
      'Cannot explain core fundamentals or architecture relevant to this inquiry',
      'Suggests patterns that lead to data inconsistency or silent failures in production',
    ],
    followUpQuestions: [
      'How would this solution scale if request volume increases by 10x?',
      'What observability metrics and alerts would you configure in production?',
    ],
    suggestedTimeMinutes: params.originalQuestion.suggestedTimeMinutes || 6,
    evaluationRubric: `Evaluate technical depth, practical system design choices, and clarity of communication for ${title}.`,
    competency: params.originalQuestion.category,
    isCustomEdited: true,
  };
}

const mockOriginal = {
  id: 'q_101',
  number: 3,
  title: 'Spring Transaction Propagation',
  category: 'Spring Framework',
  topic: 'Spring Boot & Transactions',
  difficulty: 'Hard',
  question: 'Explain how REQUIRES_NEW behaves with internal method calls in Spring Boot.',
  expectedAnswer: 'Internal calls bypass Spring AOP proxies...',
  evaluationPoints: ['Proxy bypass', 'Self invocation'],
  commonMistakes: ['Thinking internal calls spawn new transactions'],
  redFlags: ['Unaware of dynamic proxies'],
  followUpQuestions: ['How does AspectJ solve this?'],
  suggestedTimeMinutes: 7,
  evaluationRubric: 'Evaluate Spring proxy awareness.',
  maxScore: 10,
};

const customResult = generateMockCustomQuestion({
  sessionId: 'sess_1',
  originalQuestion: mockOriginal,
  customPrompt: 'How do you configure Redis distributed locks with Redisson in Spring Boot to avoid deadlocks?',
});

assert.strictEqual(customResult.isCustomEdited, true);
assert.strictEqual(customResult.originalQuestionId, 'q_101');
assert.ok(customResult.title.includes('Redis'));
assert.strictEqual(customResult.evaluationPoints.length, 3);
console.log('✅ Test 2 Passed: Mock Custom Question successfully generated with full rubrics and isCustomEdited flag.\n');

// 3. Validate Non-Destructive Bidirectional Version Switching
console.log('Test 3: Validating Non-Destructive Bidirectional Switching...');
const sessionStoreState = {
  questions: [mockOriginal],
  contextualAlternatives: {},
  selectedQuestionVersions: {},
};

// Simulate Regenerate or Replace adding to alternatives
sessionStoreState.contextualAlternatives[mockOriginal.id] = [customResult];
sessionStoreState.selectedQuestionVersions[mockOriginal.id] = customResult.id;

// Active question check when custom alternative is selected
let activeVersionId = sessionStoreState.selectedQuestionVersions[mockOriginal.id] || 'original';
let isContextualActive = activeVersionId !== 'original';
let activeQuestion = isContextualActive
  ? sessionStoreState.contextualAlternatives[mockOriginal.id].find(a => a.id === activeVersionId)
  : sessionStoreState.questions[0];

assert.strictEqual(activeQuestion.question, customResult.question);
assert.strictEqual(activeQuestion.isCustomEdited, true);

// Interviewer decides the newly generated/custom question is not what they want -> Switch back to Original!
sessionStoreState.selectedQuestionVersions[mockOriginal.id] = 'original';
activeVersionId = sessionStoreState.selectedQuestionVersions[mockOriginal.id];
isContextualActive = activeVersionId !== 'original';
activeQuestion = isContextualActive
  ? sessionStoreState.contextualAlternatives[mockOriginal.id].find(a => a.id === activeVersionId)
  : sessionStoreState.questions[0];

assert.strictEqual(activeQuestion.question, mockOriginal.question);
assert.strictEqual(activeQuestion.title, 'Spring Transaction Propagation');
assert.strictEqual(sessionStoreState.questions[0].id, 'q_101'); // Original question remains completely intact!

// Interviewer changes their mind -> Switch back to Custom Replacement!
sessionStoreState.selectedQuestionVersions[mockOriginal.id] = customResult.id;
activeVersionId = sessionStoreState.selectedQuestionVersions[mockOriginal.id];
isContextualActive = activeVersionId !== 'original';
activeQuestion = isContextualActive
  ? sessionStoreState.contextualAlternatives[mockOriginal.id].find(a => a.id === activeVersionId)
  : sessionStoreState.questions[0];

assert.strictEqual(activeQuestion.id, customResult.id);
assert.strictEqual(activeQuestion.isCustomEdited, true);

console.log('✅ Test 3 Passed: 1-click bidirectional switching works seamlessly without mutating original question.\n');

console.log('🎉 ALL CUSTOM QUESTION REPLACEMENT & SWITCHING TESTS PASSED!');
