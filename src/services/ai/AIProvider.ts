import type {
  Question,
  DsaProblem,
  DsaReview,
  Difficulty,
  HiringRecommendation,
  CandidateContextEntry,
  ExtractedProjectContext,
  ContextualAlternative,
  CopilotProbe,
} from '@/types';

export interface GenerateQuestionsParams {
  candidateName: string;
  jobPosition: string;
  totalExperience: string;
  relevantJavaExperience: string;
  candidateBackground?: string;
  difficulty: Difficulty;
  durationMinutes: number;
  selectedTopics: string[];
  customInstructions?: string;
  dsaProblemCount: number;
  enableFollowUps: boolean;
  enableScenarios: boolean;
  dsaLanguage: string;
}

export interface GeneratedQuestionsResult {
  questions: Question[];
  dsaProblems: DsaProblem[];
}

export interface RegenerateQuestionParams {
  existingQuestion: Question;
  topic: string;
  category: string;
  difficulty: Difficulty;
  reason?: string;
  avoidQuestionTitles: string[];
}

export interface GenerateCustomQuestionParams {
  sessionId: string;
  originalQuestion: Question;
  customPrompt: string;
  candidateName?: string;
  jobPosition?: string;
  totalExperience?: string;
  difficulty?: Difficulty | string;
}

export interface EvaluateDsaParams {
  problem: DsaProblem;
  language: string;
  code: string;
}

export interface QuestionSummaryForReport {
  questionTitle: string;
  category: string;
  difficulty: string;
  evaluationStatus: string;
  scoreAwarded: number;
  maxScore: number;
  interviewerNotes: string;
}

export interface DsaSummaryForReport {
  problemTitle: string;
  language: string;
  candidateCode: string;
  aiScore: number;
  interviewerScore: number;
  notes?: string;
}

export interface GenerateReportParams {
  candidateName: string;
  jobPosition: string;
  totalExperience: string;
  relevantJavaExperience: string;
  difficulty: string;
  durationMinutes: number;
  actualDurationSeconds: number;
  interviewerName: string;
  questionsSummary: QuestionSummaryForReport[];
  dsaSummary: DsaSummaryForReport[];
  calculatedOverallScore: number;
  calculatedCategoryScores: Array<{
    category: string;
    earned: number;
    possible: number;
    percentage: number;
  }>;
}

export interface AIReportResult {
  candidateOverview: string;
  competencies: {
    java: { score: number; level: string; notes: string };
    springBootMicroservices: { score: number; level: string; notes: string };
    kafka: { score: number; level: string; notes: string };
    mySql: { score: number; level: string; notes: string };
    systemDesign: { score: number; level: string; notes: string };
    designPatterns: { score: number; level: string; notes: string };
    realWorldProblemSolving: { score: number; level: string; notes: string };
    dsa: { score: number; level: string; notes: string };
  };
  technicalStrengths: string[];
  technicalWeaknesses: string[];
  areasForImprovement: string[];
  practicalEngineeringCompetency: string;
  dsaSummary: string;
  hiringRecommendation: HiringRecommendation;
  recommendationRationale: string;
}

export interface AdaptInterviewQuestionsParams {
  sessionId: string;
  candidateName: string;
  jobPosition: string;
  totalExperience: string;
  relevantJavaExperience: string;
  difficulty: Difficulty;
  remainingMinutes: number;
  accumulatedContext: string[]; // text entries in order
  previousExtractedContext?: ExtractedProjectContext | null;
  upcomingQuestions: Question[];
  askedQuestions: Array<{ title: string; category: string }>;
  existingAlternatives: ContextualAlternative[];
}

export interface AdaptInterviewQuestionsResult {
  extractedContext: ExtractedProjectContext;
  alternatives: ContextualAlternative[];
}

export interface GenerateCopilotProbesParams {
  sessionId: string;
  candidateName: string;
  jobPosition: string;
  latestContext: string;
  consolidatedContext?: ExtractedProjectContext | null;
  currentQuestion?: Question | null;
}

export interface RegenerateDsaParams {
  existingProblem: DsaProblem;
  language: string;
  difficulty: Difficulty;
  avoidTitles: string[];
}

export interface AskInterviewerAssistantParams {
  problem: DsaProblem;
  userQuery: string;
  chatHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}

export interface AIProvider {
  name: string;
  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestionsResult>;
  regenerateQuestion(params: RegenerateQuestionParams): Promise<Question>;
  generateCustomQuestion(params: GenerateCustomQuestionParams): Promise<ContextualAlternative>;
  regenerateDsaProblem(params: RegenerateDsaParams): Promise<DsaProblem>;
  askInterviewerAssistant(params: AskInterviewerAssistantParams): Promise<string>;
  evaluateDsaSubmission(params: EvaluateDsaParams): Promise<DsaReview>;
  generateFinalReport(params: GenerateReportParams): Promise<AIReportResult>;
  adaptInterviewQuestions(params: AdaptInterviewQuestionsParams): Promise<AdaptInterviewQuestionsResult>;
  generateCopilotProbes(params: GenerateCopilotProbesParams): Promise<CopilotProbe[]>;
}

