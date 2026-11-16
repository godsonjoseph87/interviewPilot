import { GeminiProvider } from './GeminiProvider';
import type {
  AIProvider,
  GenerateQuestionsParams,
  GeneratedQuestionsResult,
  RegenerateQuestionParams,
  EvaluateDsaParams,
  GenerateReportParams,
  AIReportResult,
} from './AIProvider';
import type { Question, DsaReview } from '@/types';
import { getApiKey } from '@/services/storage/keyStorage';
import {
  MOCK_QUESTIONS,
  MOCK_DSA_PROBLEMS,
  MOCK_DSA_REVIEW,
  MOCK_REPORT_RESULT,
} from './mockData';

let currentProvider: AIProvider = new GeminiProvider('gemini-2.5-flash');

export function setAIModel(modelName: string) {
  if (currentProvider instanceof GeminiProvider) {
    currentProvider.setModel(modelName);
  }
}

export function hasConfiguredApiKey(): boolean {
  return !!getApiKey();
}

/**
 * High-level service: generateInterviewQuestions
 */
export async function generateInterviewQuestions(
  params: GenerateQuestionsParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<GeneratedQuestionsResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      console.warn('No Gemini API key configured. Utilizing calibrated mock questions.');
      // Adapt mock questions to candidate
      const customizedQuestions = MOCK_QUESTIONS.map((q) => ({
        ...q,
        id: `q_${Date.now()}_${q.number}`,
      }));
      return {
        questions: customizedQuestions,
        dsaProblems: MOCK_DSA_PROBLEMS.slice(0, params.dsaProblemCount),
      };
    }
    throw new Error(
      'Gemini API key is required. Please add your API key in Settings to generate questions with Google Gemini.'
    );
  }

  return await currentProvider.generateQuestions(params);
}

/**
 * High-level service: regenerateInvalidQuestions / single question replacement
 */
export async function regenerateQuestion(
  params: RegenerateQuestionParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<Question> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      return {
        id: `q_${Date.now()}_regen`,
        number: params.existingQuestion.number,
        category: params.category,
        topic: params.topic,
        difficulty: params.difficulty,
        title: `Deep Dive: Advanced ${params.topic} Resilience & Optimization`,
        question: `In a high-throughput enterprise environment, describe how you would monitor, troubleshoot, and optimize ${params.topic} when operating under 99.99% availability SLAs and sudden 10x traffic bursts.`,
        expectedAnswer: `Candidate covers telemetry metrics (P99 latency, error rates), circuit breakers, bulkhead isolation, auto-scaling thresholds, and defensive caching/rate-limiting.`,
        evaluationPoints: [
          'Identification of relevant golden signals and bottleneck diagnostics',
          'Application of backpressure, rate limiting, or connection pooling',
          'Fault isolation strategies to prevent cascading failures',
        ],
        commonMistakes: [
          'Assuming vertical scaling or bigger instances is the primary remedy',
          'Omitting observability metrics and proactive alert thresholds',
        ],
        redFlags: [
          'No awareness of connection pool exhaustion or thread pool starvation',
        ],
        followUpQuestions: [
          'How would you simulate this load during staging canary verification?',
        ],
        suggestedTimeMinutes: 7,
        evaluationRubric: 'Evaluate architectural resilience, latency considerations, and practical observability.',
        maxScore: 10,
      };
    }
    throw new Error('Gemini API key is required to regenerate questions.');
  }

  return await currentProvider.regenerateQuestion(params);
}

/**
 * High-level service: evaluateDsaSubmission
 */
export async function evaluateDsaSubmission(
  params: EvaluateDsaParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<DsaReview> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      console.warn('No Gemini API key configured. Utilizing calibrated mock DSA review.');
      return {
        ...MOCK_DSA_REVIEW,
        interviewerAdjustedScore: MOCK_DSA_REVIEW.overallScore100,
      };
    }
    throw new Error(
      'Gemini API key is required. Please configure your API key in Settings to review code with AI.'
    );
  }

  return await currentProvider.evaluateDsaSubmission(params);
}

/**
 * High-level service: generateFinalInterviewReport
 */
export async function generateFinalInterviewReport(
  params: GenerateReportParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<AIReportResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      console.warn('No Gemini API key configured. Synthesizing report from deterministic scores.');
      // Adapt recommendation to calculated overall score
      let rec: any = 'Hire';
      if (params.calculatedOverallScore >= 85) rec = 'Strong Hire';
      else if (params.calculatedOverallScore >= 70) rec = 'Hire';
      else if (params.calculatedOverallScore >= 55) rec = 'Lean Hire';
      else if (params.calculatedOverallScore >= 40) rec = 'Lean No Hire';
      else rec = 'No Hire';

      return {
        ...MOCK_REPORT_RESULT,
        hiringRecommendation: rec,
      };
    }
    throw new Error(
      'Gemini API key is required. Please configure your API key in Settings to generate the AI evaluation report.'
    );
  }

  return await currentProvider.generateFinalReport(params);
}

