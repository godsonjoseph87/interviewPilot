import type {
  Question,
  DsaProblem,
  DsaReview,
  Difficulty,
  HiringRecommendation,
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

export interface AIProvider {
  name: string;
  generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestionsResult>;
  regenerateQuestion(params: RegenerateQuestionParams): Promise<Question>;
  evaluateDsaSubmission(params: EvaluateDsaParams): Promise<DsaReview>;
  generateFinalReport(params: GenerateReportParams): Promise<AIReportResult>;
}

