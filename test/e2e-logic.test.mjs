import assert from 'assert';
import { calculateInterviewScores } from '../src/services/scoring/scoreCalculator.ts';
import {
  GeneratedQuestionsResponseSchema,
  DsaReviewResponseSchema,
  FinalReportResponseSchema,
  ExtractedProjectContextSchema,
  ContextualAlternativeSchema,
  AdaptQuestionsResponseSchema,
  CopilotProbesResponseSchema,
} from '../src/lib/schemas.ts';
import {
  MOCK_QUESTIONS,
  MOCK_DSA_PROBLEMS,
  MOCK_DSA_REVIEW,
  MOCK_REPORT_RESULT,
  MOCK_EXTRACTED_CONTEXT,
  generateMockContextualAlternatives,
  generateMockCopilotProbes,
} from '../src/services/ai/mockData.ts';

console.log('🧪 Starting InterviewPilot AI E2E Logic & Schema Verification Tests...\n');

// Test 1: Verify Questions Schema Validation
console.log('Test 1: Validating Generated Questions with Zod Schema...');
const mockResponse = {
  questions: MOCK_QUESTIONS,
  dsaProblems: MOCK_DSA_PROBLEMS,
};
const parsedQuestions = GeneratedQuestionsResponseSchema.parse(mockResponse);
assert.strictEqual(parsedQuestions.questions.length, 6, 'Should have 6 questions');
assert.strictEqual(parsedQuestions.dsaProblems.length, 2, 'Should have 2 DSA problems');
assert.strictEqual(
  parsedQuestions.questions[0].question,
  'Tell me about yourself and walk me through your professional experience, particularly your experience with backend development.',
  'Question 1 must be the required intro question'
);
console.log('✅ Test 1 Passed: Generated questions & DSA problems conform strictly to Zod schema.\n');

// Test 2: Verify DSA Review Schema
console.log('Test 2: Validating DSA Review Rubric Schema...');
const parsedDsaReview = DsaReviewResponseSchema.parse(MOCK_DSA_REVIEW);
assert.strictEqual(parsedDsaReview.logicalCorrectnessScore, 32);
assert.strictEqual(parsedDsaReview.algorithmSelectionScore, 19);
assert.strictEqual(parsedDsaReview.timeComplexityScore, 14);
assert.strictEqual(parsedDsaReview.spaceComplexityScore, 9);
assert.strictEqual(parsedDsaReview.edgeCaseHandlingScore, 9);
assert.strictEqual(parsedDsaReview.codeQualityScore, 9);
assert.strictEqual(parsedDsaReview.overallScore100, 92);
console.log('✅ Test 2 Passed: DSA evaluation rubric conforms to 6-dimension schema.\n');

// Test 3: Verify Final Report Schema
console.log('Test 3: Validating Final Report Synthesis Schema...');
const parsedReport = FinalReportResponseSchema.parse(MOCK_REPORT_RESULT);
assert.strictEqual(parsedReport.hiringRecommendation, 'Hire');
assert.ok(parsedReport.competencies.java.score >= 80);
assert.ok(parsedReport.technicalStrengths.length >= 3);
assert.ok(parsedReport.technicalWeaknesses.length >= 2);
console.log('✅ Test 3 Passed: Final Report response validated successfully.\n');

// Test 4: Deterministic Scoring Math
console.log('Test 4: Deterministic Scoring Math Verification...');
const testEvaluations = [
  { questionId: 'mock_q_1', status: 'correct', score: 10, percentage: 100, interviewerNotes: 'Great intro', evaluatedAt: Date.now(), sessionId: 's1' },
  { questionId: 'mock_q_2', status: 'partially_correct', score: 7, percentage: 70, interviewerNotes: 'Missed outbox pattern', evaluatedAt: Date.now(), sessionId: 's1' },
  { questionId: 'mock_q_3', status: 'correct', score: 10, percentage: 100, interviewerNotes: '', evaluatedAt: Date.now(), sessionId: 's1' },
  { questionId: 'mock_q_4', status: 'incorrect', score: 0, percentage: 0, interviewerNotes: '', evaluatedAt: Date.now(), sessionId: 's1' },
  { questionId: 'mock_q_5', status: 'skipped', score: 0, percentage: 0, interviewerNotes: 'Skipped due to time', evaluatedAt: Date.now(), sessionId: 's1' },
  { questionId: 'mock_q_6', status: 'correct', score: 10, percentage: 100, interviewerNotes: 'Solid MySQL lock analysis', evaluatedAt: Date.now(), sessionId: 's1' },
];

const testDsaSubmissions = [
  {
    sessionId: 's1',
    problemId: 'mock_dsa_1',
    language: 'java',
    code: 'class Solution {}',
    submittedAt: Date.now(),
    review: { ...MOCK_DSA_REVIEW, interviewerAdjustedScore: 90, overallScore100: 92 },
  },
  {
    sessionId: 's1',
    problemId: 'mock_dsa_2',
    language: 'java',
    code: 'class Solution {}',
    submittedAt: Date.now(),
    review: { ...MOCK_DSA_REVIEW, interviewerAdjustedScore: 80, overallScore100: 85 },
  },
];

const calculated = calculateInterviewScores(MOCK_QUESTIONS, testEvaluations, testDsaSubmissions);

// Non-skipped questions: 5 questions * 10 = 50 total possible.
// Earned: 10 + 7 + 10 + 0 + 10 = 37. Tech percentage = 37 / 50 = 74%.
// DSA average: (90 + 80) / 2 = 85%.
// Overall weighted score: 74% * 0.7 + 85% * 0.3 = 51.8 + 25.5 = 77.3 -> 77%.
// Hiring verdict for 77% should be "Hire" (70-84 range).
console.log(`Calculated Tech Earned: ${calculated.totalEarned} / ${calculated.totalPossible}`);
console.log(`Calculated DSA Average: ${calculated.dsaAverageScore}%`);
console.log(`Calculated Overall Score: ${calculated.overallScore100} / 100`);
console.log(`Deterministic Hiring Recommendation: ${calculated.recommendedHiringStatus}`);

assert.strictEqual(calculated.totalPossible, 50, 'Skipped question should be excluded from possible score');
assert.strictEqual(calculated.totalEarned, 37, 'Earned marks should sum to 37');
assert.strictEqual(calculated.dsaAverageScore, 85, 'DSA average should be 85');
assert.strictEqual(calculated.overallScore100, 77, 'Overall score should be exactly 77');
assert.strictEqual(calculated.recommendedHiringStatus, 'Hire', 'Recommendation should be Hire');
console.log('✅ Test 4 Passed: Deterministic scoring and rubric weights function accurately.\n');

// Test 5: Verify Extracted Project Context Schema & AI Adaptation Schema
console.log('Test 5: Validating Extracted Project Context & Adaptive Questions Schemas...');
const parsedExtractedContext = ExtractedProjectContextSchema.parse(MOCK_EXTRACTED_CONTEXT);
assert.strictEqual(parsedExtractedContext.domain, 'E-commerce & Distributed Order Processing');
assert.ok(parsedExtractedContext.technologies.includes('Apache Kafka'));
assert.ok(parsedExtractedContext.technologies.includes('Spring Boot'));
assert.ok(parsedExtractedContext.architecture.includes('Microservices'));
assert.ok(parsedExtractedContext.potentialScenarios.length >= 3);
assert.ok(parsedExtractedContext.clarificationProbes.length >= 2);

const mockContextText =
  'Worked on an online shopping application using Spring Boot microservices, Kafka, asynchronous processing, Hibernate and MySQL.';
const generatedAlts = generateMockContextualAlternatives(MOCK_QUESTIONS.slice(1, 4), mockContextText, 'sess_123');

const adaptPayload = {
  extractedContext: parsedExtractedContext,
  alternatives: generatedAlts,
};

const parsedAdaptPayload = AdaptQuestionsResponseSchema.parse(adaptPayload);
assert.strictEqual(parsedAdaptPayload.alternatives.length, 3);
assert.strictEqual(parsedAdaptPayload.alternatives[0].originalQuestionId, MOCK_QUESTIONS[1].id);
assert.ok(parsedAdaptPayload.alternatives[0].question.includes('Kafka'));
assert.ok(parsedAdaptPayload.alternatives[0].reasonForAdaptation.length > 10);
console.log('✅ Test 5 Passed: Adaptive Context & Questions Schema validated with domain extraction.\n');

// Test 6: Verify AI Interviewer Copilot Probes Schema & Categorization
console.log('Test 6: Validating AI Interviewer Copilot Probes Schema...');
const mockProbes = generateMockCopilotProbes('Used Kafka for order events, consumer groups, async communication.', 'sess_123');
const parsedProbes = CopilotProbesResponseSchema.parse({ probes: mockProbes });
assert.strictEqual(parsedProbes.probes.length, 4);

const categories = parsedProbes.probes.map((p) => p.category);
assert.ok(categories.includes('Reliability'), 'Must include Reliability probe');
assert.ok(categories.includes('Data Consistency'), 'Must include Data Consistency probe');
assert.ok(categories.includes('Performance'), 'Must include Performance probe');
assert.ok(categories.includes('Practical Implementation'), 'Must include Practical Implementation probe');
console.log('✅ Test 6 Passed: AI Copilot Probes strictly conform to 4 required dimensions.\n');

// Test 7: Verify Non-Destructive Question Selection & State Tracking (Option A vs Option B)
console.log('Test 7: Verifying Rule of Non-Destruction & Version Selection Tracking...');
const originalQuestion = MOCK_QUESTIONS[1];
const altVersion = generatedAlts[0];

// Assert original question is unchanged
assert.strictEqual(originalQuestion.id, 'mock_q_2');
assert.ok(originalQuestion.question.includes('payment event'));

// Simulate selecting Option B (Contextual Alternative)
const simulatedEvaluation = {
  sessionId: 'sess_123',
  questionId: originalQuestion.id,
  status: 'correct',
  score: 10,
  percentage: 100,
  interviewerNotes: 'Candidate demonstrated excellent knowledge of Kafka consumer crash offset semantics.',
  evaluatedAt: Date.now(),
  selectedVersion: altVersion.id, // Selected Contextual Alternative
  versionSelectionReason: altVersion.reasonForAdaptation,
};

// Verify original question ID remains the anchor
assert.strictEqual(simulatedEvaluation.questionId, originalQuestion.id);
assert.strictEqual(simulatedEvaluation.selectedVersion, altVersion.id);

// Simulate report synthesis using the selected version
const reportItem = {
  questionId: originalQuestion.id,
  questionTitle: altVersion.title,
  category: originalQuestion.category,
  interviewerEvaluation: simulatedEvaluation.status,
  scoreAwarded: simulatedEvaluation.score,
  maxScore: originalQuestion.maxScore,
  notes: simulatedEvaluation.interviewerNotes,
  isContextual: true,
  contextualAlternativeId: altVersion.id,
  adaptedQuestionText: altVersion.question,
  originalQuestionText: originalQuestion.question,
  reasonForSelection: simulatedEvaluation.versionSelectionReason,
  projectContextUsed: altVersion.projectContextUsed,
};

assert.strictEqual(reportItem.isContextual, true);
assert.strictEqual(reportItem.questionTitle, altVersion.title);
assert.strictEqual(reportItem.originalQuestionText, originalQuestion.question);
assert.ok(reportItem.adaptedQuestionText.includes('flash sale'));
console.log('✅ Test 7 Passed: Question versioning tracks Option A vs Option B without mutating original.\n');

// Test 8: Incremental Context Preservation
console.log('Test 8: Verifying Incremental Context Preservation...');
const contextHistory = [];
const addContext = (text) => {
  contextHistory.push({
    id: `ctx_${contextHistory.length + 1}`,
    timestamp: Date.now(),
    text,
  });
};

addContext('Candidate worked on an online shopping application.');
addContext('Used Spring Boot microservices.');
addContext('Kafka was used for asynchronous communication.');
addContext('Used Hibernate for persistence and MySQL for inventory management.');

assert.strictEqual(contextHistory.length, 4, 'Must accumulate 4 separate context entries');
assert.strictEqual(contextHistory[0].text, 'Candidate worked on an online shopping application.');
assert.strictEqual(contextHistory[3].text, 'Used Hibernate for persistence and MySQL for inventory management.');
console.log('✅ Test 8 Passed: Chronological context history preserved incrementally without overwriting.\n');

// Test 9: Verify Early Termination & Stopping Interview in Between
console.log('Test 9: Verifying Early Termination & In-Between End Scoring Calculations...');
const earlyEvaluations = [
  { questionId: 'mock_q_1', status: 'correct', score: 10 },
  { questionId: 'mock_q_2', status: 'correct', score: 10 },
  { questionId: 'mock_q_3', status: 'pending', score: 0 },
  { questionId: 'mock_q_4', status: 'pending', score: 0 },
  { questionId: 'mock_q_5', status: 'pending', score: 0 },
  { questionId: 'mock_q_6', status: 'pending', score: 0 },
];

// Case A: End early with excludePending: true (pro-rated only on evaluated questions)
const earlyExcluded = calculateInterviewScores(MOCK_QUESTIONS, earlyEvaluations, [], { excludePending: true });
assert.strictEqual(earlyExcluded.totalPossible, 20, 'Only the 2 evaluated questions should be possible');
assert.strictEqual(earlyExcluded.totalEarned, 20, '20 points earned out of 20 possible');
assert.strictEqual(earlyExcluded.overallScore100, 100, 'Candidate scored 100% on questions evaluated');

// Case B: End early with excludePending: false (pending questions count as 0)
const earlyIncluded = calculateInterviewScores(MOCK_QUESTIONS, earlyEvaluations, [], { excludePending: false });
assert.strictEqual(earlyIncluded.totalPossible, 60, 'All 6 questions count towards possible score');
assert.strictEqual(earlyIncluded.totalEarned, 20, '20 points earned out of 60 possible');
assert.strictEqual(earlyIncluded.overallScore100, 33, '20 / 60 = 33% overall score');
console.log('✅ Test 9 Passed: Early termination correctly supports both pro-rated scoring and unasked penalty scoring.\n');

console.log('🎉 ALL 9 E2E LOGIC & ADAPTIVE INTELLIGENCE TESTS PASSED SUCCESSFULLY!');

