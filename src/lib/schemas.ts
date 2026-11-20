import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string().default(() => `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
  number: z.number(),
  category: z.string(),
  topic: z.string(),
  difficulty: z.string().default('Medium'),
  title: z.string(),
  question: z.string(),
  expectedAnswer: z.string(),
  evaluationPoints: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  suggestedTimeMinutes: z.number().default(5),
  evaluationRubric: z.string().default('Evaluate based on technical depth, accuracy and practical experience'),
  maxScore: z.number().default(10),
});

export const CustomQuestionResponseSchema = z.object({
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

export const GeneratedQuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
  dsaProblems: z.array(
    z.object({
      id: z.string().default(() => `dsa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
      number: z.number().default(1),
      title: z.string(),
      description: z.string(),
      inputFormat: z.string().default(''),
      outputFormat: z.string().default(''),
      constraints: z.array(z.string()).default([]),
      sampleInputs: z.array(z.string()).default([]),
      sampleOutputs: z.array(z.string()).default([]),
      expectedApproach: z.string().default(''),
      expectedTimeComplexity: z.string().default('O(N)'),
      expectedSpaceComplexity: z.string().default('O(1)'),
      edgeCases: z.array(z.string()).default([]),
      suggestedTimeMinutes: z.number().default(15),
      workingCode: z.string().default(''),
      detailedExplanation: z.string().default(''),
    })
  ).default([]),
});

export const DsaReviewResponseSchema = z.object({
  logicalCorrectnessScore: z.number().min(0).max(35),
  algorithmSelectionScore: z.number().min(0).max(20),
  timeComplexityScore: z.number().min(0).max(15),
  spaceComplexityScore: z.number().min(0).max(10),
  edgeCaseHandlingScore: z.number().min(0).max(10),
  codeQualityScore: z.number().min(0).max(10),
  overallScore100: z.number().min(0).max(100),
  overallScore5: z.number().min(0).max(5),
  detailedEvaluation: z.string(),
  potentialLogicalErrors: z.array(z.string()).default([]),
  missingEdgeCases: z.array(z.string()).default([]),
  complexityAnalysis: z.string(),
  alternativeOptimalApproach: z.string().default(''),
  improvementSuggestions: z.array(z.string()).default([]),
  interviewerSummary: z.string(),
});

export const FinalReportResponseSchema = z.object({
  candidateOverview: z.string(),
  competencies: z.object({
    java: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
    springBootMicroservices: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
    kafka: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
    mySql: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
    systemDesign: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
    designPatterns: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
    realWorldProblemSolving: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
    dsa: z.object({ score: z.number().min(0).max(100), level: z.string(), notes: z.string() }),
  }),
  technicalStrengths: z.array(z.string()).min(1),
  technicalWeaknesses: z.array(z.string()).min(1),
  areasForImprovement: z.array(z.string()).min(1),
  practicalEngineeringCompetency: z.string(),
  dsaSummary: z.string().default('Good algorithmic reasoning and clean solution structure.'),
  hiringRecommendation: z.enum(['Strong Hire', 'Hire', 'Lean Hire', 'Lean No Hire', 'No Hire']),
  recommendationRationale: z.string().default('Based on candidate performance across core Java, microservices, and system architecture.'),
});

export const ExtractedProjectContextSchema = z.object({
  domain: z.string().default('General Backend Engineering'),
  technologies: z.array(z.string()).default([]),
  architecture: z.array(z.string()).default([]),
  communication: z.array(z.string()).default([]),
  businessCapabilities: z.array(z.string()).default([]),
  potentialScenarios: z.array(z.string()).default([]),
  clarificationProbes: z.array(z.string()).default([]),
});

export const ContextualAlternativeSchema = z.object({
  id: z.string().default(() => `alt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
  originalQuestionId: z.string(),
  title: z.string(),
  question: z.string(),
  category: z.string(),
  difficulty: z.string().default('Medium'),
  projectContextUsed: z.string(),
  reasonForAdaptation: z.string(),
  expectedAnswer: z.string(),
  evaluationPoints: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  suggestedTimeMinutes: z.number().default(5),
  evaluationRubric: z.string().default('Evaluate based on real-world engineering depth and trade-offs.'),
  competency: z.string(),
});

export const AdaptQuestionsResponseSchema = z.object({
  extractedContext: ExtractedProjectContextSchema,
  alternatives: z.array(ContextualAlternativeSchema).default([]),
});

export const CopilotProbeSchema = z.object({
  id: z.string().default(() => `probe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
  category: z.enum([
    'Reliability',
    'Data Consistency',
    'Performance',
    'Practical Implementation',
    'General',
  ]),
  probeQuestion: z.string(),
  rationale: z.string(),
});

export const CopilotProbesResponseSchema = z.object({
  probes: z.array(CopilotProbeSchema).min(1),
});

