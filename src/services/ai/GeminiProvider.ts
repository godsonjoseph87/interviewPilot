import { GoogleGenAI } from '@google/genai';
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
import {
  GeneratedQuestionsResponseSchema,
  QuestionSchema,
  CustomQuestionResponseSchema,
  DsaReviewResponseSchema,
  FinalReportResponseSchema,
  AdaptQuestionsResponseSchema,
  CopilotProbesResponseSchema,
} from '@/lib/schemas';
import { getApiKey } from '@/services/storage/keyStorage';
import { TECHNICAL_TOPICS, FALLBACK_MODEL_CHAIN } from '@/lib/constants';
import { cleanAssistantText } from '@/components/common/RichMarkdown';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  private modelName: string;
  private static discontinuedModels = new Set<string>();

  constructor(modelName: string = 'gemini-3.5-flash-lite') {
    this.modelName = modelName;
  }

  setModel(modelName: string) {
    this.modelName = modelName;
  }

  private getClient(apiKeyOverride?: string): GoogleGenAI {
    const key = apiKeyOverride || getApiKey();
    if (!key) {
      throw new Error(
        'AI service is not configured. Please verify system environment configuration.'
      );
    }
    return new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' });
  }

  /**
   * Helper to execute a promise with a timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, modelName: string): Promise<T> {
    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Timeout: Request to model "${modelName}" exceeded ${timeoutMs / 1000} seconds.`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Helper to execute Gemini content generation with clean JSON output extraction,
   * with automatic multi-model failover and timeout retry loop.
   */
  private async executeGenerate(
    prompt: string,
    apiKeyOverride?: string,
    responseMimeType: string | null = 'application/json'
  ): Promise<string> {
    const client = this.getClient(apiKeyOverride);

    // Build candidate models order starting with active model, followed by fallback chain, excluding known discontinued models
    const candidateModels = [
      this.modelName,
      ...FALLBACK_MODEL_CHAIN.filter((m) => m !== this.modelName),
    ].filter((m) => !GeminiProvider.discontinuedModels.has(m));

    if (candidateModels.length === 0) {
      candidateModels.push('gemini-3.8-flash', 'gemini-3.1-pro-preview');
    }

    const maxPasses = 2;
    const errors: Array<{ model: string; error: string }> = [];

    for (let pass = 1; pass <= maxPasses; pass++) {
      for (let i = 0; i < candidateModels.length; i++) {
        const currentModel = candidateModels[i];
        if (GeminiProvider.discontinuedModels.has(currentModel)) {
          continue;
        }

        console.log(
          `[GeminiProvider] Attempting generation with model: "${currentModel}" (Pass ${pass}/${maxPasses}, model ${i + 1}/${candidateModels.length})...`
        );

        try {
          const generatePromise = client.models.generateContent({
            model: currentModel,
            contents: prompt,
            ...(responseMimeType ? { config: { responseMimeType } } : {}),
          });

          // Enforce 180s timeout per model attempt (ensuring animation never closes before call completes)
          const response = await this.withTimeout(generatePromise, 180000, currentModel);

          const text = response.text;
          if (!text || !text.trim()) {
            throw new Error(`Model "${currentModel}" returned an empty response.`);
          }

          // If fallback succeeded on another model, update this.modelName to prevent repeating 404s
          if (currentModel !== this.modelName) {
            console.log(
              `[GeminiProvider] Failover successful! Updated active model from "${this.modelName}" to "${currentModel}".`
            );
            this.modelName = currentModel;
          }

          return text;
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          console.warn(
            `[GeminiProvider] Model "${currentModel}" failed with: ${errMsg}. Trying next available model in fallback chain...`
          );

          // Fast-fail if API key itself is missing or completely rejected
          if (
            errMsg.includes('API key is missing') ||
            errMsg.includes('API_KEY_INVALID') ||
            errMsg.includes('PERMISSION_DENIED')
          ) {
            throw err;
          }

          // If model is discontinued or unsupported, mark it so we never waste time trying it again
          if (
            errMsg.includes('404') ||
            errMsg.includes('NOT_FOUND') ||
            errMsg.includes('no longer available') ||
            errMsg.includes('not found for API version')
          ) {
            GeminiProvider.discontinuedModels.add(currentModel);
          }

          errors.push({ model: currentModel, error: errMsg });

          // Brief delay before trying next model to allow network/rate limit cooldown
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (pass < maxPasses) {
        console.warn(
          `[GeminiProvider] All candidate models experienced an error or timeout in Pass ${pass}. Retrying fallback loop in 1.5s...`
        );
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    const failureSummary = errors
      .slice(-6)
      .map((e) => `• ${e.model}: ${e.error}`)
      .join('\n');

    throw new Error(
      `All Gemini models failed after multiple fallback attempts:\n${failureSummary}\nPlease check your network connection and try again.`
    );
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
   CRITICAL DSA RESTRICTIONS:
   - STRICTLY AVOID GRAPH PROBLEMS: Do NOT generate questions involving graphs, adjacency lists/matrices, BFS/DFS on graphs, topological sort, Dijkstra, or graph cycles.
   - Focus EXCLUSIVELY on: Arrays, Strings, Hash Maps, Two Pointers, Sliding Window, Linked Lists, Binary Search, Trees/Binary Search Trees, Heaps/Priority Queues, Stacks/Queues, or Dynamic Programming.
   - For each DSA problem you MUST provide:
     a) "workingCode": A complete, fully functional, production-ready working code solution in ${params.dsaLanguage}.
     b) "detailedExplanation": A clear, deep-dive explanation for the interviewer covering problem intuition, step-by-step logic, optimal strategy, and tips for guiding the candidate.
6. CONCISE HIGH-IMPACT RUBRICS: Keep expectedAnswer to 2-3 focused technical sentences. Provide exactly 3 concise bullet points for evaluationPoints, 2 for commonMistakes, and 1-2 for redFlags. Avoid verbose essays to ensure fast and deterministic generation.

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
      "suggestedTimeMinutes": 15,
      "workingCode": "Complete working solution code in ${params.dsaLanguage}...",
      "detailedExplanation": "Comprehensive algorithmic intuition and guidance notes for interviewer..."
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

  async generateCustomQuestion(params: GenerateCustomQuestionParams): Promise<ContextualAlternative> {
    const prompt = `
You are an expert Principal Engineer and Technical Interviewer.
The interviewer wants to replace a question with their own custom technical question or inquiry during the interview.

INTERVIEW CONTEXT:
Candidate: ${params.candidateName || 'Candidate'}
Position: ${params.jobPosition || 'Backend Engineer'}
Experience: ${params.totalExperience || 'Mid/Senior'}
Difficulty: ${params.difficulty || params.originalQuestion.difficulty}
Original Question Category: ${params.originalQuestion.category}
Original Question Topic: ${params.originalQuestion.topic}

INTERVIEWER'S CUSTOM INPUT / PROMPT:
"${params.customPrompt}"

TASK:
Convert the interviewer's custom input into a complete, structured interview module for the interviewer's cheat-sheet and evaluation rubric.
Ensure:
1. "title": A crisp, descriptive 3-6 word title summarizing the question.
2. "question": The clear, refined, and articulate technical question for the interviewer to ask (faithfully preserving the interviewer's exact intent and depth).
3. "expectedAnswer": A comprehensive, high-quality technical model answer explaining the optimal solution, mechanics, and trade-offs.
4. "evaluationPoints": Exactly 3-4 specific, actionable key checkpoints the interviewer should look/listen for to verify competence.
5. "commonMistakes": 2-3 common candidate pitfalls, misconceptions, or incomplete answers.
6. "redFlags": 1-2 critical red flags that indicate serious gaps in knowledge or flawed engineering practice.
7. "followUpQuestions": 2-3 sharp follow-up questions to probe deeper.
8. "suggestedTimeMinutes": Suggested time in minutes (between 5 and 10).
9. "evaluationRubric": Clear rubric guidance for awarding marks (1-10 scale).

RETURN ONLY VALID JSON conforming to:
{
  "title": "Short Descriptive Title",
  "question": "Full refined question statement...",
  "expectedAnswer": "Comprehensive model answer...",
  "evaluationPoints": ["point 1", "point 2", "point 3"],
  "commonMistakes": ["mistake 1", "mistake 2"],
  "redFlags": ["red flag 1", "red flag 2"],
  "followUpQuestions": ["follow up 1", "follow up 2"],
  "suggestedTimeMinutes": 6,
  "evaluationRubric": "Rubric details..."
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      const validated = CustomQuestionResponseSchema.parse(parsed);

      return {
        id: `alt_custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sessionId: params.sessionId,
        originalQuestionId: params.originalQuestion.id,
        title: validated.title,
        question: validated.question,
        category: params.originalQuestion.category,
        difficulty: (params.difficulty as string) || params.originalQuestion.difficulty,
        projectContextUsed: 'Interviewer Custom Question',
        reasonForAdaptation: 'Interviewer provided custom replacement question',
        expectedAnswer: validated.expectedAnswer,
        evaluationPoints: validated.evaluationPoints,
        commonMistakes: validated.commonMistakes,
        redFlags: validated.redFlags,
        followUpQuestions: validated.followUpQuestions,
        suggestedTimeMinutes: validated.suggestedTimeMinutes || params.originalQuestion.suggestedTimeMinutes || 6,
        evaluationRubric: validated.evaluationRubric,
        competency: params.originalQuestion.category,
        isCustomEdited: true,
      };
    } catch (err: any) {
      console.error('Failed to generate custom question:', err);
      throw new Error(`Failed to generate custom question: ${err.message || 'Unknown error'}`);
    }
  }

  async regenerateDsaProblem(params: RegenerateDsaParams): Promise<DsaProblem> {
    const prompt = `
You are an expert Principal Engineer and Technical Interviewer conducting a coding assessment.
The interviewer wants to refresh / replace this Data Structures & Algorithms problem with a brand new problem.

CURRENT PROBLEM TO REPLACE: "${params.existingProblem.title}"
DIFFICULTY LEVEL: ${params.difficulty}
TARGET LANGUAGE: ${params.language}
PROBLEMS TO AVOID: ${params.avoidTitles.join(', ')}

STRICT REQUIREMENTS:
1. NEVER generate graph questions (NO graphs, NO adjacency list/matrix, NO DFS/BFS on graphs, NO topological sort, NO Dijkstra).
   Focus ONLY on: Arrays, Strings, Hash Maps, Two Pointers, Sliding Window, Linked Lists, Binary Search, Trees/BST, Heaps/Priority Queues, Stacks/Queues, or Dynamic Programming.
2. Provide a complete, fully functional, production-ready "workingCode" solution in ${params.language}.
3. Provide a detailed "detailedExplanation" for the interviewer (intuition, step-by-step logic, optimal strategy, and guidance tips).

RETURN ONLY VALID JSON conforming to:
{
  "id": "dsa_${Date.now()}",
  "number": ${params.existingProblem.number},
  "title": "Fresh Problem Title",
  "description": "Clear problem description...",
  "inputFormat": "Input specifications",
  "outputFormat": "Output specifications",
  "constraints": ["1 <= N <= 10^5"],
  "sampleInputs": ["Sample input"],
  "sampleOutputs": ["Sample output"],
  "expectedApproach": "Optimal algorithmic approach...",
  "expectedTimeComplexity": "O(N)",
  "expectedSpaceComplexity": "O(1)",
  "edgeCases": ["Edge case 1", "Edge case 2"],
  "suggestedTimeMinutes": ${params.existingProblem.suggestedTimeMinutes || 15},
  "workingCode": "Complete working solution code in ${params.language}...",
  "detailedExplanation": "Comprehensive algorithmic intuition and guidance notes for interviewer..."
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      return {
        ...parsed,
        id: `dsa_${Date.now()}_regen`,
        number: params.existingProblem.number,
      };
    } catch (err: any) {
      console.error('Failed to regenerate DSA problem with Gemini:', err);
      throw new Error(`Failed to regenerate DSA problem: ${err.message || 'Unknown error'}`);
    }
  }

  async askInterviewerAssistant(params: AskInterviewerAssistantParams): Promise<string> {
    const historyText =
      params.chatHistory && params.chatHistory.length > 0
        ? params.chatHistory.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')
        : 'No prior conversation.';

    const prompt = `
You are an expert Senior Technical Interviewer and Copilot Assistant assisting an interviewer conducting a live DSA coding round.
PROBLEM CONTEXT:
- Title: ${params.problem.title}
- Description: ${params.problem.description}
- Expected Approach: ${params.problem.expectedApproach}
- Expected Time: ${params.problem.expectedTimeComplexity} | Space: ${params.problem.expectedSpaceComplexity}
- Key Edge Cases: ${params.problem.edgeCases?.join(', ') || 'None specified'}
- Working Solution Reference:
${params.problem.workingCode || 'Standard optimal algorithm'}

CONVERSATION HISTORY:
${historyText}

INTERVIEWER'S QUESTION:
"${params.userQuery}"

CRITICAL OUTPUT INSTRUCTIONS:
- Provide a direct, high-signal, rich markdown response formatted specifically for the interviewer.
- DO NOT wrap your response in JSON (NEVER output {"response": "..."}). Return direct markdown prose.
- Use bold text for key algorithms/complexities, bullet points for progressive hints or edge cases, and backticks for data structures and code.
- If they ask for hints, provide subtle progressive clues they can give without spoiling the whole answer.
- If they ask about complexity or trade-offs, explain clearly with big-O notation.
`;

    try {
      const rawText = await this.executeGenerate(prompt, undefined, null);
      const cleaned = cleanAssistantText(rawText);
      return cleaned || 'No response generated.';
    } catch (err: any) {
      console.error('Interviewer assistant error:', err);
      throw new Error(`Assistant error: ${err.message || 'Unknown error'}`);
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

  async adaptInterviewQuestions(
    params: AdaptInterviewQuestionsParams
  ): Promise<AdaptInterviewQuestionsResult> {
    const upcomingSummary = params.upcomingQuestions
      .map(
        (q) => `
QUESTION ID: ${q.id}
Number: ${q.number}
Category: ${q.category}
Topic: ${q.topic}
Difficulty: ${q.difficulty}
Title: "${q.title}"
Prompt: "${q.question}"
Expected Answer: "${q.expectedAnswer}"
Rubric: "${q.evaluationRubric}"
Evaluation Points: ${q.evaluationPoints.join('; ')}
Suggested Duration: ${q.suggestedTimeMinutes} mins
`
      )
      .join('\n---\n');

    const askedSummary =
      params.askedQuestions.length > 0
        ? params.askedQuestions.map((q) => `- "${q.title}" (${q.category})`).join('\n')
        : 'None yet (first questions)';

    const prompt = `
You are an expert Principal Engineer and Senior Technical Interviewer conducting a live technical interview for a Backend Engineer.
CANDIDATE INFORMATION:
- Name: ${params.candidateName}
- Job Position: ${params.jobPosition}
- Total Experience: ${params.totalExperience}
- Relevant Java Experience: ${params.relevantJavaExperience}
- Target Difficulty: ${params.difficulty}
- Remaining Interview Duration: ${params.remainingMinutes} minutes

ACCUMULATED LIVE CANDIDATE CONTEXT (Notes captured during the interview):
${params.accumulatedContext.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

PREVIOUSLY ASKED QUESTIONS (Avoid repeating these concepts):
${askedSummary}

UPCOMING ORIGINAL QUESTIONS TO EVALUATE FOR ADAPTATION:
${upcomingSummary}

TASK INSTRUCTIONS:
1. CONTEXT ANALYSIS:
   Extract structured information from the candidate's notes:
   - "domain": Business domain (e.g., E-commerce, FinTech, Logistics, Healthcare, Streaming).
   - "technologies": List of explicitly mentioned or clearly implied technologies and frameworks (e.g. Java, Spring Boot, Kafka, MySQL, Redis, Hibernate).
   - "architecture": Architectural patterns identified (e.g. Microservices, Event-Driven, Monolith, CQRS, Hexagonal).
   - "communication": Inter-service mechanisms (e.g. Asynchronous Kafka messaging, REST APIs, gRPC).
   - "businessCapabilities": Mentioned or relevant core capabilities (e.g. Order checkout, Inventory reservation, Payment processing).
   - "potentialScenarios": Realistic high-concurrency or failure scenarios based on the domain.
   - "clarificationProbes": 2-3 specific technical questions to clarify how candidate implemented these features.
   IMPORTANT: Distinguish clearly between explicitly stated candidate experience and AI-inferred scenarios. Never invent fictitious achievements.

2. CONTEXTUAL QUESTION ADAPTATION:
   For the upcoming original questions:
   - Identify questions where connecting the technical concept to the candidate's actual project domain/technologies creates a more realistic, deep-dive interview question.
   - PRESERVE the original category, difficulty, core competency, and evaluation rubric.
   - If there is a natural connection, generate 1 to 2 high-quality contextual alternatives for that question.
   - If a question is unrelated (e.g., candidate worked on offline data processing and question is strictly front-facing WebSocket auth), DO NOT force an artificial connection; simply omit an alternative for that question.
   - Each alternative must test the EXACT same technical competency (e.g., Kafka offset commit failure, Spring transaction rollback, DB indexing, race conditions) through the lens of candidate's project.
   - Set "originalQuestionId" to the exact original question ID being adapted.
   - Provide "projectContextUsed" and "reasonForAdaptation" explaining why this adaptation enhances the interview.

OUTPUT FORMAT REQUIREMENTS:
Return ONLY a valid JSON object matching this schema:
{
  "extractedContext": {
    "domain": "E-commerce & Payments",
    "technologies": ["Java 17", "Spring Boot", "Kafka", "MySQL", "Hibernate"],
    "architecture": ["Microservices", "Event-Driven Architecture"],
    "communication": ["Asynchronous messaging via Kafka"],
    "businessCapabilities": ["Product inventory", "Order processing", "Payment capture"],
    "potentialScenarios": ["Concurrent product purchases", "Kafka consumer crash before offset commit", "Inventory consistency"],
    "clarificationProbes": ["Was inventory reserved before or after payment authorization?", "How were duplicate order messages handled?"]
  },
  "alternatives": [
    {
      "id": "alt_q_123_1",
      "originalQuestionId": "<EXACT_ORIGINAL_ID>",
      "title": "Flash Sale: High-Concurrency Inventory Reservation & Kafka Commits",
      "question": "In your shopping application, two customers attempt to purchase the final available item simultaneously during a flash sale. Given your use of Kafka and MySQL, how would you design the order processing pipeline to strictly prevent overselling and guarantee idempotency if a consumer crashes before committing its offset?",
      "category": "Distributed Systems & Messaging",
      "difficulty": "Hard",
      "projectContextUsed": "High-throughput e-commerce flash sales with Kafka and MySQL inventory",
      "reasonForAdaptation": "Tests Kafka offset commit semantics, concurrency, and idempotency using candidate's actual e-commerce architecture.",
      "expectedAnswer": "Candidate explains using optimistic/pessimistic locking or atomic decrement in MySQL, consumer offset manual commit after DB write, and idempotency key table in DB to deduplicate replayed events.",
      "evaluationPoints": [
        "Correct handling of Kafka at-least-once message delivery and consumer crash recovery",
        "Implementation of database idempotency constraints or versioned optimistic locking",
        "Awareness of race conditions and overselling prevention mechanics"
      ],
      "commonMistakes": [
        "Assuming auto-commit will prevent duplicates",
        "Relying on in-memory application locking across multiple microservice instances"
      ],
      "redFlags": [
        "No concept of database transaction rollback or consumer offset rebalance implications"
      ],
      "followUpQuestions": [
        "How would you handle dead-letter queue routing if inventory reservation persistently fails?"
      ],
      "suggestedTimeMinutes": 6,
      "evaluationRubric": "Evaluate concurrency safety, distributed messaging reliability, and failure recovery mechanics.",
      "competency": "Kafka and Concurrency"
    }
  ]
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      const validated = AdaptQuestionsResponseSchema.parse(parsed);

      // Ensure every alternative has sessionId set
      const alternativesWithSession: ContextualAlternative[] = validated.alternatives.map(
        (alt) => ({
          ...alt,
          sessionId: params.sessionId,
        })
      );

      return {
        extractedContext: validated.extractedContext,
        alternatives: alternativesWithSession,
      };
    } catch (err: any) {
      console.error('Failed to adapt interview questions with Gemini:', err);
      throw new Error(`Failed to adapt interview questions: ${err.message || 'Unknown error'}`);
    }
  }

  async generateCopilotProbes(
    params: GenerateCopilotProbesParams
  ): Promise<CopilotProbe[]> {
    const prompt = `
You are an expert AI Technical Interviewer Co-Pilot assisting a senior engineering interviewer in real time.
CANDIDATE: ${params.candidateName} (${params.jobPosition})
CURRENT ACTIVE QUESTION: ${params.currentQuestion ? params.currentQuestion.title : 'General System Discussion'}
CANDIDATE EXPLANATION / RECENT NOTES:
"${params.latestContext}"

CONSOLIDATED PROJECT KNOWLEDGE:
${JSON.stringify(params.consolidatedContext || {})}

TASK:
Based on what the candidate just stated, generate 4 deep-dive, spontaneous follow-up probes across these 4 distinct categories:
1. "Reliability": Focus on edge cases, failures, crashes, retries, dead letters, network partitions, circuit breaking.
2. "Data Consistency": Focus on distributed state, transactional boundaries, 2PC/Sagas, eventual consistency, race conditions.
3. "Performance": Focus on latency bottlenecks, throughput scaling, consumer lag, connection pool exhaustion, caching.
4. "Practical Implementation": Focus on real-world gotchas, production incident debugging, zero-downtime upgrades, monitoring.

RETURN ONLY VALID JSON conforming to:
{
  "probes": [
    {
      "id": "probe_${Date.now()}_1",
      "category": "Reliability",
      "probeQuestion": "Concrete, sharp question asking how candidate handled specific failure...",
      "rationale": "Why this question tests production readiness..."
    },
    {
      "id": "probe_${Date.now()}_2",
      "category": "Data Consistency",
      "probeQuestion": "...",
      "rationale": "..."
    },
    {
      "id": "probe_${Date.now()}_3",
      "category": "Performance",
      "probeQuestion": "...",
      "rationale": "..."
    },
    {
      "id": "probe_${Date.now()}_4",
      "category": "Practical Implementation",
      "probeQuestion": "...",
      "rationale": "..."
    }
  ]
}
`;

    try {
      const rawJson = await this.executeGenerate(prompt);
      const parsed = this.parseJsonFromResponse(rawJson);
      const validated = CopilotProbesResponseSchema.parse(parsed);

      return validated.probes.map((p) => ({
        ...p,
        sessionId: params.sessionId,
        timestamp: Date.now(),
      }));
    } catch (err: any) {
      console.error('Failed to generate copilot probes with Gemini:', err);
      throw new Error(`Failed to generate copilot probes: ${err.message || 'Unknown error'}`);
    }
  }
}

