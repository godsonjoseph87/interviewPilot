import { GoogleGenAI } from '@google/genai';
import type {
  AIProvider,
  GenerateQuestionsParams,
  GeneratedQuestionsResult,
  RegenerateQuestionParams,
  EvaluateDsaParams,
  GenerateReportParams,
  AIReportResult,
} from './AIProvider';
import type { Question, DsaProblem, DsaReview } from '@/types';
import {
  GeneratedQuestionsResponseSchema,
  QuestionSchema,
  DsaReviewResponseSchema,
  FinalReportResponseSchema,
} from '@/lib/schemas';
import { getApiKey } from '@/services/storage/keyStorage';
import { TECHNICAL_TOPICS } from '@/lib/constants';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  private modelName: string;

  constructor(modelName: string = 'gemini-2.5-flash') {
    this.modelName = modelName;
  }

  setModel(modelName: string) {
    this.modelName = modelName;
  }

  private getClient(apiKeyOverride?: string): GoogleGenAI {
    const key = apiKeyOverride || getApiKey();
    if (!key) {
      throw new Error(
        'Gemini API key is missing. Please provide your Gemini API key in Settings or the prompt modal to continue.'
      );
    }
    return new GoogleGenAI({ apiKey: key });
  }

  /**
   * Helper to execute Gemini content generation with clean JSON output extraction
   */
  private async executeGenerate(prompt: string, apiKeyOverride?: string): Promise<string> {
    const client = this.getClient(apiKeyOverride);

    const response = await client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response. Please try again.');
    }
    return text;
  }

  /**
   * Clean JSON response from markdown wrappers if needed
   */
  private parseJsonFromResponse(raw: string): any {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean);
  }

  async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestionsResult> {
    const topicDetails = params.selectedTopics
      .map((id) => TECHNICAL_TOPICS.find((t) => t.id === id)?.name || id)
      .join(', ');

    // Calculate approximate questions count based on interview duration
    // 30m: 4-5 questions + 1 DSA; 45m: 6 questions + 2 DSA; 60m: 7-8 questions + 2 DSA; 90m: 10-12 questions + 2 DSA
    const targetQCount = Math.max(4, Math.floor((params.durationMinutes - 15) / 6));

    const prompt = `
You are an expert Principal Engineer and Technical Interviewer conducting a rigorous technical interview for a Backend Engineering candidate.
CANDIDATE PROFILE:
- Name: ${params.candidateName}
- Job Position: ${params.jobPosition}
- Total Professional Experience: ${params.totalExperience}
- Relevant Java / Backend Experience: ${params.relevantJavaExperience}
- Candidate Background: ${params.candidateBackground || 'Standard backend engineering background'}
- Target Difficulty: ${params.difficulty}
- Total Interview Duration: ${params.durationMinutes} minutes
- Selected Topics: ${topicDetails}
- DSA Preferred Language: ${params.dsaLanguage}
- Number of DSA Problems: ${params.dsaProblemCount}
- Include Follow-ups: ${params.enableFollowUps}
- Include Real-world Scenarios: ${params.enableScenarios}
- Additional Custom Instructions: ${params.customInstructions || 'None'}

CRITICAL INSTRUCTIONS:
1. Question 1 MUST ALWAYS be verbatim:
   "Tell me about yourself and walk me through your professional experience, particularly your experience with backend development."
   With Category: "Candidate Introduction", Topic: "Professional Overview", Suggested Time: 5 mins, Max Score: 10.
2. For questions 2 through ${targetQCount}, generate high-quality practical technical questions across the selected topics.
3. PRIORITIZE REAL PRODUCTION SCENARIOS AND ENGINEERING DEPTH over basic theoretical definitions.
   - For example, instead of "What is Kafka?", ask: "Your Kafka consumer processes a payment event, but the application crashes before committing the offset. When the service restarts, the same message gets processed again. How would you prevent duplicate payment processing?"
   - Instead of "What is @Transactional?", ask: "A method marked with @Transactional calls another method with @Transactional(propagation = REQUIRES_NEW) within the same Spring service bean. What happens if the second method throws a RuntimeException? How does Spring AOP proxying affect this?"
4. For Senior / Architect candidates (${params.totalExperience}), emphasize production debugging, concurrency pitfalls, JVM GC pauses, distributed transactions (Saga, Outbox pattern), database deadlocks, caching stamps, and architectural trade-offs.
5. Provide ${params.dsaProblemCount} Data Structures & Algorithms problems calibrated for ${params.difficulty} difficulty.

RETURN ONLY VALID JSON conforming to the following structure:
{
  "questions": [
    {
      "id": "q_1",
      "number": 1,
      "category": "Candidate Introduction",
      "topic": "Professional Overview",
      "difficulty": "Easy",
      "title": "Professional Experience & Backend Walkthrough",
      "question": "Tell me about yourself and walk me through your professional experience, particularly your experience with backend development.",
      "expectedAnswer": "Structured overview of recent backend roles, tech stack (Java, Spring, databases, distributed systems), scale of traffic handled, and notable accomplishments.",
      "evaluationPoints": [
        "Clarity and structure of technical communication",
        "Relevance and depth of Java/backend experience",
        "Ownership and impact of previous projects"
      ],
      "commonMistakes": [
        "Reciting resume line-by-line without technical depth",
        "Failing to articulate backend architectural choices"
      ],
      "redFlags": [
        "Inability to explain their own project architecture",
        "Vague answers about basic backend fundamentals"
      ],
      "followUpQuestions": [
        "What was the most challenging backend production bug you personally resolved?"
      ],
      "suggestedTimeMinutes": 5,
      "evaluationRubric": "Evaluate articulation, depth of backend context, and confidence.",
      "maxScore": 10
    }
  ],
  "dsaProblems": [
    {
      "id": "dsa_1",
      "number": 1,
      "title": "Problem Title",
      "description": "Clear problem description...",
      "inputFormat": "Input specifications",
      "outputFormat": "Output specifications",
      "constraints": ["1 <= N <= 10^5"],
      "sampleInputs": ["[2, 7, 11, 15], target = 9"],
      "sampleOutputs": ["[0, 1]"],
      "expectedApproach": "Optimal hash map lookup approach...",
      "expectedTimeComplexity": "O(N)",
      "expectedSpaceComplexity": "O(N)",
      "edgeCases": ["Empty array", "Duplicate elements", "Negative numbers"],
      "suggestedTimeMinutes": 15
    }
  ]
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      const validated = GeneratedQuestionsResponseSchema.parse(parsed);

      // Re-index questions cleanly
      const questionsWithIds: Question[] = validated.questions.map((q, idx) => ({
        ...q,
        id: `q_${Date.now()}_${idx + 1}`,
        number: idx + 1,
      }));

      // Ensure first question is the mandatory intro question if missing
      if (questionsWithIds.length > 0 && !questionsWithIds[0].question.toLowerCase().includes('tell me about yourself')) {
        questionsWithIds[0].title = 'Professional Experience & Backend Walkthrough';
        questionsWithIds[0].question =
          'Tell me about yourself and walk me through your professional experience, particularly your experience with backend development.';
      }

      const dsaProblemsWithIds: DsaProblem[] = validated.dsaProblems.map((p, idx) => ({
        ...p,
        id: `dsa_${Date.now()}_${idx + 1}`,
        number: idx + 1,
      }));

      return {
        questions: questionsWithIds,
        dsaProblems: dsaProblemsWithIds,
      };
    } catch (err: any) {
      console.error('Gemini question generation error:', err);
      throw new Error(`Failed to generate questions: ${err.message || 'Unknown error'}`);
    }
  }

  async regenerateQuestion(params: RegenerateQuestionParams): Promise<Question> {
    const prompt = `
You are an expert Principal Engineer and Technical Interviewer.
The interviewer wants to replace a technical interview question because it was deemed unsuitable or needs a fresh challenge.

TOPIC: ${params.topic}
CATEGORY: ${params.category}
DIFFICULTY: ${params.difficulty}
REASON: ${params.reason || 'Provide a more scenario-driven, production-oriented alternative'}
EXISTING QUESTIONS TO AVOID (Do not repeat):
${params.avoidQuestionTitles.map((t) => `- ${t}`).join('\n')}

Generate ONE brand new technical interview question that emphasizes real-world backend engineering problem solving.
RETURN ONLY JSON matching:
{
  "id": "q_new",
  "number": ${params.existingQuestion.number},
  "category": "${params.category}",
  "topic": "${params.topic}",
  "difficulty": "${params.difficulty}",
  "title": "Short descriptive title",
  "question": "Realistic scenario or in-depth technical question...",
  "expectedAnswer": "Comprehensive expected response...",
  "evaluationPoints": ["point 1", "point 2", "point 3"],
  "commonMistakes": ["mistake 1", "mistake 2"],
  "redFlags": ["red flag 1", "red flag 2"],
  "followUpQuestions": ["follow up 1", "follow up 2"],
  "suggestedTimeMinutes": ${params.existingQuestion.suggestedTimeMinutes || 6},
  "evaluationRubric": "Rubric details",
  "maxScore": 10
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      const validated = QuestionSchema.parse(parsed);
      return {
        ...validated,
        id: `q_${Date.now()}_regen`,
        number: params.existingQuestion.number,
      };
    } catch (err: any) {
      console.error('Failed to regenerate question:', err);
      throw new Error(`Failed to regenerate question: ${err.message || 'Unknown error'}`);
    }
  }

  async evaluateDsaSubmission(params: EvaluateDsaParams): Promise<DsaReview> {
    const prompt = `
You are an elite Staff Engineer reviewing a candidate's Data Structures and Algorithms code submission during a live technical interview.

PROBLEM STATEMENT:
Title: ${params.problem.title}
Description: ${params.problem.description}
Constraints: ${params.problem.constraints.join(', ')}
Expected Time Complexity: ${params.problem.expectedTimeComplexity}
Expected Space Complexity: ${params.problem.expectedSpaceComplexity}
Expected Approach: ${params.problem.expectedApproach}

CANDIDATE SUBMISSION:
Language: ${params.language}
Code:
\`\`\`${params.language}
${params.code}
\`\`\`

EVALUATION RUBRIC & WEIGHTS:
1. Logical Correctness (0 to 35 points)
2. Algorithm Selection & Data Structure Suitability (0 to 20 points)
3. Time Complexity vs Optimal (0 to 15 points)
4. Space Complexity vs Optimal (0 to 10 points)
5. Edge-Case Handling (0 to 10 points)
6. Code Quality, Naming & Readability (0 to 10 points)

IMPORTANT:
- You must perform static code analysis. Do not claim the code was executed or compiled in a sandbox.
- Clearly separate what can be verified through static analysis from execution-dependent behavior.
- Calculate overallScore100 = sum of all 6 components (0-100).
- Calculate overallScore5 = round(overallScore100 / 20, 1) (0 to 5.0).

RETURN ONLY VALID JSON in this exact structure:
{
  "logicalCorrectnessScore": 30,
  "algorithmSelectionScore": 18,
  "timeComplexityScore": 14,
  "spaceComplexityScore": 9,
  "edgeCaseHandlingScore": 8,
  "codeQualityScore": 9,
  "overallScore100": 88,
  "overallScore5": 4.4,
  "detailedEvaluation": "Detailed breakdown of the candidate's implementation...",
  "potentialLogicalErrors": ["Any subtle off-by-one or condition bugs found via static analysis"],
  "missingEdgeCases": ["Empty inputs, negative values, integer overflow, etc."],
  "complexityAnalysis": "Time: O(N) because ..., Space: O(1) auxiliary space...",
  "alternativeOptimalApproach": "Description of any cleaner or more space-optimal algorithm if applicable",
  "improvementSuggestions": ["Refactor variable names", "Guard against null input"],
  "interviewerSummary": "Concise 2-3 sentence verdict for the interviewer."
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      const validated = DsaReviewResponseSchema.parse(parsed);

      return {
        ...validated,
        interviewerAdjustedScore: validated.overallScore100, // default to AI score, can be overridden by interviewer
      };
    } catch (err: any) {
      console.error('Failed to evaluate DSA code:', err);
      throw new Error(`Failed to evaluate DSA submission: ${err.message || 'Unknown error'}`);
    }
  }

  async generateFinalReport(params: GenerateReportParams): Promise<AIReportResult> {
    const prompt = `
You are a Principal Engineering Director synthesizing a final comprehensive interview evaluation report for a Backend Engineering candidate.

CANDIDATE INFORMATION:
- Name: ${params.candidateName}
- Target Position: ${params.jobPosition}
- Total Experience: ${params.totalExperience}
- Relevant Java/Backend Experience: ${params.relevantJavaExperience}
- Interview Difficulty: ${params.difficulty}
- Total Allocated Duration: ${params.durationMinutes} mins
- Actual Interview Time: ${Math.round(params.actualDurationSeconds / 60)} mins
- Interviewer Name: ${params.interviewerName}

DETERMINISTIC FRONTEND SCORES (Do not invent numbers - explain and substantiate these recorded numbers):
- Overall Score: ${params.calculatedOverallScore} / 100
- Category Scores:
${params.calculatedCategoryScores.map((c) => `  * ${c.category}: ${c.earned}/${c.possible} (${c.percentage}%)`).join('\n')}

QUESTION-BY-QUESTION RESULTS:
${params.questionsSummary
  .map(
    (q, i) =>
      `Question ${i + 1} [${q.category}]: "${q.questionTitle}" -> Status: ${q.evaluationStatus}, Score: ${q.scoreAwarded}/${q.maxScore}. Notes: ${q.interviewerNotes || 'None'}`
  )
  .join('\n')}

DSA PROBLEMS PERFORMANCE:
${params.dsaSummary
  .map(
    (d, i) =>
      `Problem ${i + 1}: "${d.problemTitle}" (${d.language}) -> AI Score: ${d.aiScore}/100, Interviewer Adjusted Score: ${d.interviewerScore}/100. Notes: ${d.notes || 'None'}`
  )
  .join('\n')}

SYNTHESIS REQUIREMENTS:
1. Provide qualitative insights explaining the strengths, trade-offs, and gaps represented by these numbers.
2. Provide competency ratings (0-100 score, level [e.g. 'Expert', 'Proficient', 'Adequate', 'Developing', 'Inadequate'], and concise notes) for:
   - java
   - springBootMicroservices
   - kafka
   - mySql
   - systemDesign
   - designPatterns
   - realWorldProblemSolving
   - dsa
3. List 3-5 concrete technical strengths.
4. List 2-4 concrete technical weaknesses.
5. List 3 key areas requiring improvement.
6. Provide a qualitative verdict on practical engineering competency (production readiness).
7. Final Hiring Recommendation (Must be one of: 'Strong Hire', 'Hire', 'Lean Hire', 'Lean No Hire', 'No Hire') based on the candidate's scores and rubric.

RETURN ONLY VALID JSON conforming to:
{
  "candidateOverview": "Executive summary paragraph of candidate performance...",
  "competencies": {
    "java": { "score": 85, "level": "Proficient", "notes": "Strong grasp of concurrency..." },
    "springBootMicroservices": { "score": 80, "level": "Proficient", "notes": "Solid understanding..." },
    "kafka": { "score": 75, "level": "Adequate", "notes": "Familiar with offset management..." },
    "mySql": { "score": 70, "level": "Adequate", "notes": "Understands indexing..." },
    "systemDesign": { "score": 80, "level": "Proficient", "notes": "Good architectural reasoning..." },
    "designPatterns": { "score": 78, "level": "Proficient", "notes": "Appropriate pattern selection..." },
    "realWorldProblemSolving": { "score": 85, "level": "Proficient", "notes": "Effective troubleshooting approach..." },
    "dsa": { "score": 82, "level": "Proficient", "notes": "Clean algorithmic structure..." }
  },
  "technicalStrengths": [
    "Strength 1...",
    "Strength 2...",
    "Strength 3..."
  ],
  "technicalWeaknesses": [
    "Weakness 1...",
    "Weakness 2..."
  ],
  "areasForImprovement": [
    "Area 1...",
    "Area 2...",
    "Area 3..."
  ],
  "practicalEngineeringCompetency": "Detailed assessment of real-world production readiness...",
  "dsaSummary": "Overview of algorithmic problem solving and code quality...",
  "hiringRecommendation": "Hire",
  "recommendationRationale": "Justification grounded in the performance data..."
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      const validated = FinalReportResponseSchema.parse(parsed);

      return validated;
    } catch (err: any) {
      console.error('Failed to generate final report:', err);
      throw new Error(`Failed to generate final report: ${err.message || 'Unknown error'}`);
    }
  }
}

