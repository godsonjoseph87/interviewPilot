import { GeminiProvider } from './GeminiProvider';
import type {
  AIProvider,
  GenerateQuestionsParams,
  GeneratedQuestionsResult,
  RegenerateQuestionParams,
  GenerateCustomQuestionParams,
  RegenerateDsaParams,
  AskInterviewerAssistantParams,
  EvaluateDsaParams,
  GenerateReportParams,
  AIReportResult,
  AdaptInterviewQuestionsParams,
  AdaptInterviewQuestionsResult,
  GenerateCopilotProbesParams,
} from './AIProvider';
import type { Question, DsaProblem, DsaReview, ContextualAlternative, CopilotProbe } from '@/types';
import { getApiKey } from '@/services/storage/keyStorage';
import {
  MOCK_QUESTIONS,
  MOCK_DSA_PROBLEMS,
  MOCK_DSA_REVIEW,
  MOCK_REPORT_RESULT,
  MOCK_EXTRACTED_CONTEXT,
  generateMockContextualAlternatives,
  generateMockCustomQuestion,
  generateMockCopilotProbes,
  generateMockRegeneratedDsaProblem,
  generateMockAssistantResponse,
} from './mockData';

let currentProvider: AIProvider = new GeminiProvider('gemini-3.5-flash-lite');

export function setAIModel(modelName: string) {
  // If model is discontinued or known for 4-minute overload timeouts, automatically route to gemini-3.5-flash-lite
  const effectiveModel =
    modelName === 'gemini-3.8-flash' ||
    modelName === 'gemini-2.5-flash' ||
    modelName === 'gemini-2.0-flash' ||
    modelName === 'gemini-1.5-flash' ||
    modelName === 'gemini-3.1-pro-preview' ||
    modelName === 'gemini-3-flash'
      ? 'gemini-3.5-flash-lite'
      : modelName;

  if (currentProvider instanceof GeminiProvider) {
    currentProvider.setModel(effectiveModel);
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
      'AI service is unavailable. Please verify system environment configuration.'
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
    throw new Error('AI service is unavailable to regenerate questions.');
  }

  return await currentProvider.regenerateQuestion(params);
}

/**
 * High-level service: generateCustomQuestion / replace with interviewer's custom question
 */
export async function generateCustomQuestion(
  params: GenerateCustomQuestionParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<ContextualAlternative> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      console.warn('No Gemini API key configured. Formulating calibrated mock custom question.');
      return generateMockCustomQuestion(params);
    }
    throw new Error('AI service is unavailable to formulate custom question.');
  }

  return await currentProvider.generateCustomQuestion(params);
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
      'AI service is unavailable to review code.'
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
      'AI service is unavailable to generate the evaluation report.'
    );
  }

  return await currentProvider.generateFinalReport(params);
}

/**
 * High-level service: adaptInterviewQuestions
 */
export async function adaptInterviewQuestions(
  params: AdaptInterviewQuestionsParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<AdaptInterviewQuestionsResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      console.warn('No Gemini API key configured. Utilizing calibrated mock adaptive questions.');
      const allText = params.accumulatedContext.join(' ');
      const alternatives = generateMockContextualAlternatives(
        params.upcomingQuestions,
        allText,
        params.sessionId
      );
      return {
        extractedContext: {
          ...MOCK_EXTRACTED_CONTEXT,
          domain: allText.toLowerCase().includes('ecommerce') || allText.toLowerCase().includes('shopping')
            ? 'E-commerce & Distributed Order Processing'
            : 'Enterprise Cloud Backend & Distributed Systems',
        },
        alternatives,
      };
    }
    throw new Error('AI service is unavailable to adapt interview questions.');
  }

  return await currentProvider.adaptInterviewQuestions(params);
}

/**
 * High-level service: generateCopilotProbes
 */
export async function generateCopilotProbes(
  params: GenerateCopilotProbesParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<CopilotProbe[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      console.warn('No Gemini API key configured. Utilizing calibrated mock copilot probes.');
      return generateMockCopilotProbes(params.latestContext, params.sessionId);
    }
    throw new Error('AI service is unavailable to generate follow-up probes.');
  }

  return await currentProvider.generateCopilotProbes(params);
}

/**
 * High-level service: regenerateDsaProblem
 */
export async function regenerateDsaProblem(
  params: RegenerateDsaParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<DsaProblem> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      console.warn('No Gemini API key configured. Utilizing calibrated mock regenerated DSA problem.');
      return generateMockRegeneratedDsaProblem(params.existingProblem.id, params.avoidTitles);
    }
    throw new Error('AI service is unavailable to refresh DSA problem.');
  }

  return await currentProvider.regenerateDsaProblem(params);
}

/**
 * High-level service: askInterviewerAssistant
 */
export async function askInterviewerAssistant(
  params: AskInterviewerAssistantParams,
  allowFallbackOnMissingKey: boolean = false
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (allowFallbackOnMissingKey) {
      return generateMockAssistantResponse(params.problem, params.userQuery);
    }
    throw new Error('AI service is unavailable.');
  }

  return await currentProvider.askInterviewerAssistant(params);
}

