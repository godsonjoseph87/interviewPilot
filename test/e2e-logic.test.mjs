import assert from 'assert';
import { calculateInterviewScores } from '../src/services/scoring/scoreCalculator.ts';
import { GeneratedQuestionsResponseSchema, DsaReviewResponseSchema, FinalReportResponseSchema } from '../src/lib/schemas.ts';
import { MOCK_QUESTIONS, MOCK_DSA_PROBLEMS, MOCK_DSA_REVIEW, MOCK_REPORT_RESULT } from '../src/services/ai/mockData.ts';

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

console.log('🎉 ALL 4 E2E LOGIC TESTS PASSED SUCCESSFULLY!');
