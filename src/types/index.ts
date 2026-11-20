export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type InterviewStatus = 'draft' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export type EvaluationStatus = 'pending' | 'correct' | 'partially_correct' | 'incorrect' | 'skipped';
export type HiringRecommendation = 'Strong Hire' | 'Hire' | 'Lean Hire' | 'Lean No Hire' | 'No Hire';

export interface Question {
  id: string;
  number: number;
  category: string;
  topic: string;
  difficulty: string;
  title: string;
  question: string;
  expectedAnswer: string;
  evaluationPoints: string[];
  commonMistakes: string[];
  redFlags: string[];
  followUpQuestions: string[];
  suggestedTimeMinutes: number;
  evaluationRubric: string;
  maxScore: number;
}

export interface CandidateContextEntry {
  id: string;
  sessionId: string;
  timestamp: number;
  text: string;
}

export interface ExtractedProjectContext {
  domain: string;
  technologies: string[];
  architecture: string[];
  communication: string[];
  businessCapabilities: string[];
  potentialScenarios: string[];
  clarificationProbes: string[];
}

export interface ContextualAlternative {
  id: string;
  sessionId: string;
  originalQuestionId: string;
  title: string;
  question: string;
  category: string;
  difficulty: string;
  projectContextUsed: string;
  reasonForAdaptation: string;
  expectedAnswer: string;
  evaluationPoints: string[];
  commonMistakes: string[];
  redFlags: string[];
  followUpQuestions: string[];
  suggestedTimeMinutes: number;
  evaluationRubric: string;
  competency: string;
  isCustomEdited?: boolean;
}

export type CopilotCategory =
  | 'Reliability'
  | 'Data Consistency'
  | 'Performance'
  | 'Practical Implementation'
  | 'General';

export interface CopilotProbe {
  id: string;
  sessionId: string;
  category: CopilotCategory;
  probeQuestion: string;
  rationale: string;
  timestamp: number;
}

export interface QuestionEvaluation {
  id?: number;
  sessionId: string;
  questionId: string;
  status: EvaluationStatus;
  score: number;
  percentage: number;
  interviewerNotes: string;
  evaluatedAt: number;
  selectedVersion?: 'original' | string; // 'original' or contextual alternative ID
  versionSelectionReason?: string;
}

export interface DsaProblem {
  id: string;
  number: number;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  sampleInputs: string[];
  sampleOutputs: string[];
  expectedApproach: string;
  expectedTimeComplexity: string;
  expectedSpaceComplexity: string;
  edgeCases: string[];
  suggestedTimeMinutes: number;
  workingCode?: string;
  detailedExplanation?: string;
}

export interface DsaReview {
  logicalCorrectnessScore: number; // 0-35
  algorithmSelectionScore: number; // 0-20
  timeComplexityScore: number; // 0-15
  spaceComplexityScore: number; // 0-10
  edgeCaseHandlingScore: number; // 0-10
  codeQualityScore: number; // 0-10
  overallScore100: number; // 0-100
  overallScore5: number; // 0-5
  interviewerAdjustedScore: number; // 0-100
  interviewerNotes?: string;
  detailedEvaluation: string;
  potentialLogicalErrors: string[];
  missingEdgeCases: string[];
  complexityAnalysis: string;
  alternativeOptimalApproach: string;
  improvementSuggestions: string[];
  interviewerSummary: string;
}

export interface DsaSubmission {
  id?: number;
  sessionId: string;
  problemId: string;
  language: string;
  code: string;
  submittedAt: number;
  review?: DsaReview;
}

export interface InterviewSession {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  jobPosition: string;
  totalExperience: string;
  relevantJavaExperience: string;
  interviewerName: string;
  candidateBackground?: string;
  difficulty: Difficulty;
  durationMinutes: number;
  selectedTopics: string[];
  customInstructions?: string;
  dsaLanguage: string;
  dsaProblemCount: number;
  enableFollowUps: boolean;
  enableScenarios: boolean;
  status: InterviewStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  totalElapsedSeconds: number;
  currentQuestionIndex: number;
  reportId?: string;
  contextVersion?: number;
  consolidatedContext?: ExtractedProjectContext;
}

export interface CompetencyScore {
  score: number; // 0-100
  level: string; // e.g. "Proficient", "Expert", "Developing"
  notes: string;
}

export interface CategoryScoreItem {
  category: string;
  earned: number;
  possible: number;
  percentage: number;
}

export interface FinalReport {
  id: string;
  sessionId: string;
  candidateName: string;
  jobPosition: string;
  totalExperience: string;
  interviewerName: string;
  interviewDate: number;
  durationMinutes: number;
  actualDurationSeconds: number;
  candidateOverview: string;
  overallScore100: number;
  categoryScores: CategoryScoreItem[];
  competencies: {
    java: CompetencyScore;
    springBootMicroservices: CompetencyScore;
    kafka: CompetencyScore;
    mySql: CompetencyScore;
    systemDesign: CompetencyScore;
    designPatterns: CompetencyScore;
    realWorldProblemSolving: CompetencyScore;
    dsa: CompetencyScore;
  };
  technicalStrengths: string[];
  technicalWeaknesses: string[];
  areasForImprovement: string[];
  practicalEngineeringCompetency: string;
  detailedQuestionAssessment: Array<{
    questionId: string;
    questionTitle: string;
    category: string;
    interviewerEvaluation: EvaluationStatus;
    scoreAwarded: number;
    maxScore: number;
    notes: string;
    isContextual?: boolean;
    contextualAlternativeId?: string;
    adaptedQuestionText?: string;
    originalQuestionText?: string;
    reasonForSelection?: string;
    projectContextUsed?: string;
  }>;
  candidateContextSummary?: {
    domain?: string;
    technologies?: string[];
    architecture?: string[];
    workflows?: string[];
    historyCount?: number;
  };
  dsaAssessment: {
    summary: string;
    problems: Array<{
      problemTitle: string;
      language: string;
      aiScore: number;
      interviewerScore: number;
      summary: string;
      timeComplexity: string;
      spaceComplexity: string;
    }>;
  };
  hiringRecommendation: HiringRecommendation;
  interviewerOverrideRecommendation?: HiringRecommendation;
  interviewerFinalComments?: string;
  generatedAt: number;
}

export interface AppSettings {
  id: string;
  geminiApiKey: string;
  geminiModel: string;
  saveKeyLocally: boolean;
  googleClientId: string;
  defaultDuration: number;
  defaultDifficulty: Difficulty;
  defaultTopics: string[];
  theme: 'dark' | 'light' | 'system';
  customSystemPrompt?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
  sub?: string;
}

