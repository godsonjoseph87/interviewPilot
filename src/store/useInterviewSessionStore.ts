import { create } from 'zustand';
import type {
  InterviewSession,
  Question,
  QuestionEvaluation,
  EvaluationStatus,
  DsaProblem,
  DsaSubmission,
  DsaReview,
  FinalReport,
  CandidateContextEntry,
  ExtractedProjectContext,
  ContextualAlternative,
  CopilotProbe,
} from '@/types';
import { db, type StoredQuestion, type StoredDsaProblem } from '@/services/db';
import { adaptInterviewQuestions, generateCopilotProbes } from '@/services/ai';

interface InterviewSessionState {
  session: InterviewSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  evaluations: Record<string, QuestionEvaluation>;
  dsaProblems: DsaProblem[];
  dsaSubmissions: Record<string, DsaSubmission>;
  report: FinalReport | null;

  // Active Section & DSA Navigation
  activeSection: 'technical' | 'dsa';
  currentDsaIndex: number;

  // Context & Adaptive Questions State
  contextHistory: CandidateContextEntry[];
  consolidatedContext: ExtractedProjectContext | null;
  contextVersion: number;
  contextualAlternatives: Record<string, ContextualAlternative[]>; // key: originalQuestionId
  selectedQuestionVersions: Record<string, string>; // key: originalQuestionId, value: 'original' | altId
  copilotProbes: CopilotProbe[];
  isAdaptingQuestions: boolean;
  isGeneratingCopilotProbes: boolean;
  adaptError: string | null;
  copilotError: string | null;

  // Timers
  totalElapsedSeconds: number;
  questionElapsedSeconds: number;
  isPaused: boolean;
  lastTickTime: number | null;

  // Actions
  initNewSession: (
    session: InterviewSession,
    questions: Question[],
    dsaProblems: DsaProblem[]
  ) => Promise<void>;
  loadSessionFromDb: (sessionId: string) => Promise<boolean>;
  setCurrentQuestionIndex: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;

  setQuestionEvaluation: (
    questionId: string,
    status: EvaluationStatus,
    scoreOverride?: number,
    notes?: string
  ) => Promise<void>;

  setQuestionNotes: (questionId: string, notes: string) => Promise<void>;
  replaceQuestion: (oldQuestionId: string, newQuestion: Question) => Promise<void>;

  // Context & Adaptive Actions
  addCandidateContext: (text: string) => Promise<void>;
  clearCandidateContextHistory: () => Promise<void>;
  adaptUpcomingQuestions: () => Promise<void>;
  addQuestionAlternative: (
    originalQuestionId: string,
    alternative: ContextualAlternative
  ) => Promise<void>;
  selectQuestionVersion: (
    originalQuestionId: string,
    versionId: string,
    reason?: string
  ) => Promise<void>;
  updateContextualAlternative: (
    altId: string,
    updates: Partial<ContextualAlternative>
  ) => Promise<void>;
  generateCopilotProbesForText: (text: string) => Promise<void>;
  clearCopilotProbes: () => Promise<void>;

  // DSA Actions
  setActiveSection: (section: 'technical' | 'dsa') => void;
  setCurrentDsaIndex: (index: number) => void;
  replaceDsaProblem: (oldProblemId: string, newProblem: DsaProblem) => Promise<void>;
  submitDsaCode: (
    problemId: string,
    language: string,
    code: string,
    review?: DsaReview
  ) => Promise<void>;
  updateDsaInterviewerScore: (
    problemId: string,
    adjustedScore: number,
    notes?: string
  ) => Promise<void>;

  // Timer Actions
  startInterview: () => Promise<void>;
  togglePauseTimer: () => void;
  tickTimers: () => void;

  // Session completion & lifecycle
  finishInterview: (report: FinalReport) => Promise<void>;
  abandonInterview: () => Promise<void>;
  pauseAndExit: () => Promise<void>;
  clearActiveSession: () => void;
}

export const useInterviewSessionStore = create<InterviewSessionState>((set, get) => ({
  session: null,
  questions: [],
  currentQuestionIndex: 0,
  evaluations: {},
  dsaProblems: [],
  dsaSubmissions: {},
  report: null,

  // Active Section & DSA Navigation
  activeSection: 'technical',
  currentDsaIndex: 0,
  setActiveSection: (section) => set({ activeSection: section }),
  setCurrentDsaIndex: (index) => set({ currentDsaIndex: index }),

  // Context & Adaptive Questions State
  contextHistory: [],
  consolidatedContext: null,
  contextVersion: 1,
  contextualAlternatives: {},
  selectedQuestionVersions: {},
  copilotProbes: [],
  isAdaptingQuestions: false,
  isGeneratingCopilotProbes: false,
  adaptError: null,
  copilotError: null,

  totalElapsedSeconds: 0,
  questionElapsedSeconds: 0,
  isPaused: false,
  lastTickTime: null,

  initNewSession: async (session, questions, dsaProblems) => {
    const initialEvaluations: Record<string, QuestionEvaluation> = {};
    questions.forEach((q) => {
      initialEvaluations[q.id] = {
        sessionId: session.id,
        questionId: q.id,
        status: 'pending',
        score: 0,
        percentage: 0,
        interviewerNotes: '',
        evaluatedAt: 0,
        selectedVersion: 'original',
      };
    });

    set({
      session,
      questions,
      currentQuestionIndex: 0,
      activeSection: 'technical',
      currentDsaIndex: 0,
      evaluations: initialEvaluations,
      dsaProblems,
      dsaSubmissions: {},
      report: null,
      contextHistory: [],
      consolidatedContext: null,
      contextVersion: 1,
      contextualAlternatives: {},
      selectedQuestionVersions: {},
      copilotProbes: [],
      isAdaptingQuestions: false,
      isGeneratingCopilotProbes: false,
      adaptError: null,
      copilotError: null,
      totalElapsedSeconds: 0,
      questionElapsedSeconds: 0,
      isPaused: session.status === 'draft',
      lastTickTime: session.status === 'draft' ? null : Date.now(),
    });

    // Persist to Dexie
    await db.transaction('rw', [db.sessions, db.questions, db.evaluations, db.dsaProblems], async () => {
      await db.sessions.put(session);

      const storedQuestions: StoredQuestion[] = questions.map((q) => ({
        ...q,
        sessionId: session.id,
      }));
      await db.questions.bulkPut(storedQuestions);

      const evalList = Object.values(initialEvaluations);
      await db.evaluations.bulkPut(evalList);

      const storedDsa: StoredDsaProblem[] = dsaProblems.map((p) => ({
        ...p,
        sessionId: session.id,
      }));
      await db.dsaProblems.bulkPut(storedDsa);
    });
  },

  loadSessionFromDb: async (sessionId: string) => {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) return false;

      const storedQuestions = await db.questions.where('sessionId').equals(sessionId).sortBy('number');
      const evalList = await db.evaluations.where('sessionId').equals(sessionId).toArray();
      const dsaList = await db.dsaProblems.where('sessionId').equals(sessionId).sortBy('number');
      const subList = await db.dsaSubmissions.where('sessionId').equals(sessionId).toArray();
      const contextList = await db.contextEntries.where('sessionId').equals(sessionId).sortBy('timestamp');
      const altsList = await db.contextualAlternatives.where('sessionId').equals(sessionId).toArray();
      const probesList = await db.copilotProbes.where('sessionId').equals(sessionId).sortBy('timestamp');
      const report = session.reportId ? await db.reports.get(session.reportId) : null;

      const evaluationsMap: Record<string, QuestionEvaluation> = {};
      const selectedVersionsMap: Record<string, string> = {};
      evalList.forEach((ev) => {
        evaluationsMap[ev.questionId] = ev;
        if (ev.selectedVersion) {
          selectedVersionsMap[ev.questionId] = ev.selectedVersion;
        } else {
          selectedVersionsMap[ev.questionId] = 'original';
        }
      });

      const submissionsMap: Record<string, DsaSubmission> = {};
      subList.forEach((sub) => {
        submissionsMap[sub.problemId] = sub;
      });

      const alternativesMap: Record<string, ContextualAlternative[]> = {};
      altsList.forEach((alt) => {
        if (!alternativesMap[alt.originalQuestionId]) {
          alternativesMap[alt.originalQuestionId] = [];
        }
        alternativesMap[alt.originalQuestionId].push(alt);
      });

      set({
        session,
        questions: storedQuestions,
        currentQuestionIndex: session.currentQuestionIndex || 0,
        evaluations: evaluationsMap,
        dsaProblems: dsaList,
        dsaSubmissions: submissionsMap,
        report: report || null,
        contextHistory: contextList,
        consolidatedContext: session.consolidatedContext || null,
        contextVersion: session.contextVersion || 1,
        contextualAlternatives: alternativesMap,
        selectedQuestionVersions: selectedVersionsMap,
        copilotProbes: probesList,
        totalElapsedSeconds: session.totalElapsedSeconds || 0,
        questionElapsedSeconds: 0,
        isPaused: session.status === 'paused' || session.status === 'draft',
        lastTickTime: session.status === 'paused' || session.status === 'draft' ? null : Date.now(),
      });

      return true;
    } catch (err) {
      console.error('Failed to load session from DB:', err);
      return false;
    }
  },

  setCurrentQuestionIndex: (index) => {
    const { questions, session } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index, questionElapsedSeconds: 0 });
      if (session) {
        db.sessions.update(session.id, { currentQuestionIndex: index }).catch(console.error);
      }
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions, session } = get();
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      set({ currentQuestionIndex: nextIdx, questionElapsedSeconds: 0 });
      if (session) {
        db.sessions.update(session.id, { currentQuestionIndex: nextIdx }).catch(console.error);
      }
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex, session } = get();
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      set({ currentQuestionIndex: prevIdx, questionElapsedSeconds: 0 });
      if (session) {
        db.sessions.update(session.id, { currentQuestionIndex: prevIdx }).catch(console.error);
      }
    }
  },

  setQuestionEvaluation: async (questionId, status, scoreOverride, notes) => {
    const { evaluations, questions, session, selectedQuestionVersions } = get();
    const currentEval = evaluations[questionId];
    const question = questions.find((q) => q.id === questionId);
    const maxScore = question?.maxScore || 10;

    let score = 0;
    let percentage = 0;

    if (status === 'correct') {
      score = scoreOverride !== undefined ? scoreOverride : maxScore;
      percentage = 100;
    } else if (status === 'partially_correct') {
      score = scoreOverride !== undefined ? scoreOverride : maxScore * 0.5;
      percentage = Math.round((score / maxScore) * 100);
    } else if (status === 'incorrect') {
      score = 0;
      percentage = 0;
    } else if (status === 'skipped') {
      score = 0;
      percentage = 0;
    }

    const updatedEval: QuestionEvaluation = {
      ...(currentEval || {
        sessionId: session?.id || '',
        questionId,
      }),
      status,
      score,
      percentage,
      interviewerNotes: notes !== undefined ? notes : currentEval?.interviewerNotes || '',
      evaluatedAt: Date.now(),
      selectedVersion: currentEval?.selectedVersion || selectedQuestionVersions[questionId] || 'original',
      versionSelectionReason: currentEval?.versionSelectionReason,
    };

    set({
      evaluations: {
        ...evaluations,
        [questionId]: updatedEval,
      },
    });

    // Save to IndexedDB
    try {
      const existing = await db.evaluations
        .where(['sessionId', 'questionId'])
        .equals([updatedEval.sessionId, questionId])
        .first();

      if (existing?.id) {
        await db.evaluations.update(existing.id, updatedEval);
      } else {
        await db.evaluations.put(updatedEval);
      }
    } catch (err) {
      console.error('Failed to autosave evaluation to DB:', err);
    }
  },

  setQuestionNotes: async (questionId, notes) => {
    const { evaluations, session } = get();
    const current = evaluations[questionId] || {
      sessionId: session?.id || '',
      questionId,
      status: 'pending',
      score: 0,
      percentage: 0,
      interviewerNotes: '',
      evaluatedAt: Date.now(),
    };

    const updated = { ...current, interviewerNotes: notes };
    set({
      evaluations: {
        ...evaluations,
        [questionId]: updated,
      },
    });

    try {
      const existing = await db.evaluations
        .where(['sessionId', 'questionId'])
        .equals([current.sessionId, questionId])
        .first();

      if (existing?.id) {
        await db.evaluations.update(existing.id, { interviewerNotes: notes });
      } else {
        await db.evaluations.put(updated);
      }
    } catch (err) {
      console.error('Failed to autosave notes to DB:', err);
    }
  },

  replaceQuestion: async (oldQuestionId, newQuestion) => {
    const { questions, session, evaluations } = get();
    const updatedQuestions = questions.map((q) => (q.id === oldQuestionId ? newQuestion : q));

    const newEval: QuestionEvaluation = {
      sessionId: session?.id || '',
      questionId: newQuestion.id,
      status: 'pending',
      score: 0,
      percentage: 0,
      interviewerNotes: '',
      evaluatedAt: Date.now(),
    };

    const updatedEvals = { ...evaluations };
    delete updatedEvals[oldQuestionId];
    updatedEvals[newQuestion.id] = newEval;

    set({
      questions: updatedQuestions,
      evaluations: updatedEvals,
    });

    if (session) {
      await db.transaction('rw', [db.questions, db.evaluations], async () => {
        await db.questions.delete(oldQuestionId);
        await db.questions.put({ ...newQuestion, sessionId: session.id });
        await db.evaluations.where('questionId').equals(oldQuestionId).delete();
        await db.evaluations.put(newEval);
      });
    }
  },

  replaceDsaProblem: async (oldProblemId, newProblem) => {
    const { dsaProblems, session, dsaSubmissions } = get();
    const idx = dsaProblems.findIndex((p) => p.id === oldProblemId);
    if (idx < 0) return;

    const updatedProblems = [...dsaProblems];
    updatedProblems[idx] = newProblem;

    const updatedSubs = { ...dsaSubmissions };
    delete updatedSubs[oldProblemId];

    set({
      dsaProblems: updatedProblems,
      dsaSubmissions: updatedSubs,
    });

    if (session) {
      await db.transaction('rw', [db.dsaProblems, db.dsaSubmissions], async () => {
        await db.dsaProblems.delete(oldProblemId);
        await db.dsaProblems.put({ ...newProblem, sessionId: session.id });
        await db.dsaSubmissions.where('problemId').equals(oldProblemId).delete();
      });
    }
  },

  // Context & Adaptive Actions
  addCandidateContext: async (text: string) => {
    const { session, contextHistory, contextVersion } = get();
    if (!session || !text.trim()) return;

    const newEntry: CandidateContextEntry = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId: session.id,
      timestamp: Date.now(),
      text: text.trim(),
    };

    const nextHistory = [...contextHistory, newEntry];
    const nextVersion = contextVersion + 1;

    set({ contextHistory: nextHistory, contextVersion: nextVersion });

    try {
      await db.contextEntries.put(newEntry);
      await db.sessions.update(session.id, { contextVersion: nextVersion });
    } catch (err) {
      console.error('Failed to persist context entry to DB:', err);
    }

    // Automatically trigger copilot probes for the added explanation in background
    get().generateCopilotProbesForText(newEntry.text).catch(console.error);
  },

  clearCandidateContextHistory: async () => {
    const { session } = get();
    if (!session) return;

    set({ contextHistory: [], consolidatedContext: null });

    try {
      await db.contextEntries.where('sessionId').equals(session.id).delete();
      await db.sessions.update(session.id, { consolidatedContext: undefined });
    } catch (err) {
      console.error('Failed to clear context history in DB:', err);
    }
  },

  adaptUpcomingQuestions: async () => {
    const {
      session,
      questions,
      currentQuestionIndex,
      evaluations,
      contextHistory,
      consolidatedContext,
      contextualAlternatives,
      totalElapsedSeconds,
    } = get();

    if (!session) return;
    if (contextHistory.length === 0) {
      set({ adaptError: 'Please add candidate context first before adapting questions.' });
      return;
    }

    set({ isAdaptingQuestions: true, adaptError: null });

    try {
      // RULE 1 & RULE 2: Only upcoming questions (Q2 onwards, excluding Q1) that have not yet been evaluated
      const upcoming = questions.filter((q, idx) => {
        if (q.number === 1) return false;
        const ev = evaluations[q.id];
        return idx >= currentQuestionIndex && (!ev || ev.status === 'pending');
      });

      if (upcoming.length === 0) {
        set({
          isAdaptingQuestions: false,
          adaptError: 'All upcoming questions have already been completed or evaluated.',
        });
        return;
      }

      const asked = questions.slice(0, currentQuestionIndex).map((q) => ({
        title: q.title,
        category: q.category,
      }));

      const existingAltsList = Object.values(contextualAlternatives).flat();

      const result = await adaptInterviewQuestions(
        {
          sessionId: session.id,
          candidateName: session.candidateName,
          jobPosition: session.jobPosition,
          totalExperience: session.totalExperience,
          relevantJavaExperience: session.relevantJavaExperience,
          difficulty: session.difficulty,
          remainingMinutes: Math.max(5, session.durationMinutes - Math.round(totalElapsedSeconds / 60)),
          accumulatedContext: contextHistory.map((c) => c.text),
          previousExtractedContext: consolidatedContext,
          upcomingQuestions: upcoming,
          askedQuestions: asked,
          existingAlternatives: existingAltsList,
        },
        true // allow calibrated fallback if API key is missing
      );

      // RULE 11: Preserve previously generated alternatives in history
      const updatedAltsMap = { ...contextualAlternatives };
      result.alternatives.forEach((alt) => {
        if (!updatedAltsMap[alt.originalQuestionId]) {
          updatedAltsMap[alt.originalQuestionId] = [];
        }
        const existingIdx = updatedAltsMap[alt.originalQuestionId].findIndex(
          (a) => a.id === alt.id
        );
        if (existingIdx >= 0) {
          updatedAltsMap[alt.originalQuestionId][existingIdx] = alt;
        } else {
          updatedAltsMap[alt.originalQuestionId].push(alt);
        }
      });

      set({
        consolidatedContext: result.extractedContext,
        contextualAlternatives: updatedAltsMap,
        isAdaptingQuestions: false,
      });

      // Persist to Dexie
      try {
        await db.contextualAlternatives.bulkPut(result.alternatives);
        await db.sessions.update(session.id, {
          consolidatedContext: result.extractedContext,
        });
      } catch (err) {
        console.error('Failed to save contextual alternatives to DB:', err);
      }
    } catch (err: any) {
      console.error('Failed to adapt upcoming questions:', err);
      set({
        isAdaptingQuestions: false,
        adaptError: err?.message || 'Failed to adapt upcoming questions with Gemini.',
      });
    }
  },

  addQuestionAlternative: async (originalQuestionId: string, alternative: ContextualAlternative) => {
    const { contextualAlternatives, session } = get();
    const updatedMap = { ...contextualAlternatives };
    const existingList = updatedMap[originalQuestionId] ? [...updatedMap[originalQuestionId]] : [];

    const idx = existingList.findIndex((a) => a.id === alternative.id);
    if (idx >= 0) {
      existingList[idx] = alternative;
    } else {
      existingList.push(alternative);
    }
    updatedMap[originalQuestionId] = existingList;

    set({ contextualAlternatives: updatedMap });

    if (session) {
      try {
        await db.contextualAlternatives.put(alternative);
      } catch (err) {
        console.error('Failed to save alternative to DB:', err);
      }
    }

    // Automatically switch to the newly created version
    await get().selectQuestionVersion(originalQuestionId, alternative.id);
  },

  selectQuestionVersion: async (originalQuestionId: string, versionId: string, reason?: string) => {
    const { selectedQuestionVersions, evaluations, session } = get();

    const updatedVersions = {
      ...selectedQuestionVersions,
      [originalQuestionId]: versionId,
    };

    const currentEval = evaluations[originalQuestionId];
    const updatedEval: QuestionEvaluation = {
      ...(currentEval || {
        sessionId: session?.id || '',
        questionId: originalQuestionId,
        status: 'pending',
        score: 0,
        percentage: 0,
        interviewerNotes: '',
        evaluatedAt: Date.now(),
      }),
      selectedVersion: versionId,
      versionSelectionReason: reason || currentEval?.versionSelectionReason,
    };

    set({
      selectedQuestionVersions: updatedVersions,
      evaluations: {
        ...evaluations,
        [originalQuestionId]: updatedEval,
      },
    });

    try {
      const existing = await db.evaluations
        .where(['sessionId', 'questionId'])
        .equals([updatedEval.sessionId, originalQuestionId])
        .first();

      if (existing?.id) {
        await db.evaluations.update(existing.id, {
          selectedVersion: versionId,
          versionSelectionReason: reason || existing.versionSelectionReason,
        });
      } else {
        await db.evaluations.put(updatedEval);
      }
    } catch (err) {
      console.error('Failed to save selected question version to DB:', err);
    }
  },

  updateContextualAlternative: async (altId: string, updates: Partial<ContextualAlternative>) => {
    const { contextualAlternatives } = get();
    const updatedMap = { ...contextualAlternatives };
    let found = false;

    for (const qId in updatedMap) {
      const alts = updatedMap[qId];
      const idx = alts.findIndex((a) => a.id === altId);
      if (idx >= 0) {
        alts[idx] = { ...alts[idx], ...updates, isCustomEdited: true };
        found = true;
        break;
      }
    }

    if (found) {
      set({ contextualAlternatives: updatedMap });
      try {
        await db.contextualAlternatives.update(altId, { ...updates, isCustomEdited: true });
      } catch (err) {
        console.error('Failed to update contextual alternative in DB:', err);
      }
    }
  },

  generateCopilotProbesForText: async (text: string) => {
    const { session, consolidatedContext, questions, currentQuestionIndex, copilotProbes } = get();
    if (!session || !text.trim()) return;

    set({ isGeneratingCopilotProbes: true, copilotError: null });

    try {
      const currentQ = questions[currentQuestionIndex] || null;
      const probes = await generateCopilotProbes(
        {
          sessionId: session.id,
          candidateName: session.candidateName,
          jobPosition: session.jobPosition,
          latestContext: text,
          consolidatedContext,
          currentQuestion: currentQ,
        },
        true // allow fallback
      );

      const nextProbes = [...probes, ...copilotProbes].slice(0, 16);
      set({
        copilotProbes: nextProbes,
        isGeneratingCopilotProbes: false,
      });

      try {
        await db.copilotProbes.bulkPut(probes);
      } catch (err) {
        console.error('Failed to save copilot probes in DB:', err);
      }
    } catch (err: any) {
      console.error('Failed to generate copilot probes:', err);
      set({
        isGeneratingCopilotProbes: false,
        copilotError: err?.message || 'Failed to generate AI Copilot probes.',
      });
    }
  },

  clearCopilotProbes: async () => {
    const { session } = get();
    set({ copilotProbes: [] });
    if (session) {
      try {
        await db.copilotProbes.where('sessionId').equals(session.id).delete();
      } catch (err) {
        console.error('Failed to clear copilot probes in DB:', err);
      }
    }
  },

  submitDsaCode: async (problemId, language, code, review) => {
    const { session, dsaSubmissions } = get();
    if (!session) return;

    const submission: DsaSubmission = {
      sessionId: session.id,
      problemId,
      language,
      code,
      submittedAt: Date.now(),
      review,
    };

    set({
      dsaSubmissions: {
        ...dsaSubmissions,
        [problemId]: submission,
      },
    });

    try {
      const existing = await db.dsaSubmissions
        .where(['sessionId', 'problemId'])
        .equals([session.id, problemId])
        .first();

      if (existing?.id) {
        await db.dsaSubmissions.put({ ...submission, id: existing.id });
      } else {
        await db.dsaSubmissions.put(submission);
      }
    } catch (err) {
      console.error('Failed to save DSA submission to DB:', err);
    }
  },

  updateDsaInterviewerScore: async (problemId, adjustedScore, notes) => {
    const { session, dsaSubmissions } = get();
    const sub = dsaSubmissions[problemId];
    if (!sub || !sub.review || !session) return;

    const updatedReview: DsaReview = {
      ...sub.review,
      interviewerAdjustedScore: adjustedScore,
      interviewerNotes: notes !== undefined ? notes : sub.review.interviewerNotes,
    };

    const updatedSub: DsaSubmission = {
      ...sub,
      review: updatedReview,
    };

    set({
      dsaSubmissions: {
        ...dsaSubmissions,
        [problemId]: updatedSub,
      },
    });

    try {
      const existing = await db.dsaSubmissions
        .where(['sessionId', 'problemId'])
        .equals([session.id, problemId])
        .first();

      if (existing?.id) {
        await db.dsaSubmissions.update(existing.id, { review: updatedReview });
      }
    } catch (err) {
      console.error('Failed to update DSA score in DB:', err);
    }
  },

  startInterview: async () => {
    const { session } = get();
    if (!session) return;

    const startedSession: InterviewSession = {
      ...session,
      status: 'in_progress',
      startedAt: Date.now(),
    };

    set({
      session: startedSession,
      isPaused: false,
      lastTickTime: Date.now(),
    });

    try {
      await db.sessions.update(session.id, {
        status: 'in_progress',
        startedAt: startedSession.startedAt,
      });
    } catch (err) {
      console.error('Failed to update session start status in DB:', err);
    }
  },

  togglePauseTimer: () => {
    const { isPaused, session } = get();
    if (session?.status === 'draft') {
      get().startInterview();
      return;
    }

    const nextPaused = !isPaused;
    set({
      isPaused: nextPaused,
      lastTickTime: nextPaused ? null : Date.now(),
    });

    if (session) {
      db.sessions
        .update(session.id, {
          status: nextPaused ? 'paused' : 'in_progress',
        })
        .catch(console.error);
    }
  },

  tickTimers: () => {
    const { isPaused, lastTickTime, totalElapsedSeconds, questionElapsedSeconds, session } = get();
    if (!session || session.status === 'draft' || isPaused) return;

    const now = Date.now();
    const deltaMs = lastTickTime ? now - lastTickTime : 1000;
    const deltaSeconds = Math.round(deltaMs / 1000);

    if (deltaSeconds >= 1) {
      const newTotal = totalElapsedSeconds + deltaSeconds;
      const newQuestion = questionElapsedSeconds + deltaSeconds;

      set({
        totalElapsedSeconds: newTotal,
        questionElapsedSeconds: newQuestion,
        lastTickTime: now,
      });

      // Periodic autosave every 10 seconds
      if (session && newTotal % 10 === 0) {
        db.sessions.update(session.id, { totalElapsedSeconds: newTotal }).catch(console.error);
      }
    }
  },

  finishInterview: async (report) => {
    const { session, totalElapsedSeconds } = get();
    if (!session) return;

    const updatedSession: InterviewSession = {
      ...session,
      status: 'completed',
      finishedAt: Date.now(),
      totalElapsedSeconds,
      reportId: report.id,
    };

    set({
      session: updatedSession,
      report,
      isPaused: true,
    });

    await db.transaction('rw', [db.sessions, db.reports], async () => {
      await db.sessions.put(updatedSession);
      await db.reports.put(report);
    });
  },

  abandonInterview: async () => {
    const { session, totalElapsedSeconds } = get();
    if (!session) return;

    const updatedSession: InterviewSession = {
      ...session,
      status: 'abandoned',
      finishedAt: Date.now(),
      totalElapsedSeconds,
    };

    set({
      session: updatedSession,
      isPaused: true,
    });

    await db.sessions.put(updatedSession);
  },

  pauseAndExit: async () => {
    const { session, totalElapsedSeconds } = get();
    if (!session) return;

    const updatedSession: InterviewSession = {
      ...session,
      status: 'paused',
      totalElapsedSeconds,
    };

    set({
      session: updatedSession,
      isPaused: true,
    });

    await db.sessions.put(updatedSession);
  },

  clearActiveSession: () => {
    set({
      session: null,
      questions: [],
      currentQuestionIndex: 0,
      activeSection: 'technical',
      currentDsaIndex: 0,
      evaluations: {},
      dsaProblems: [],
      dsaSubmissions: {},
      report: null,
      contextHistory: [],
      consolidatedContext: null,
      contextVersion: 1,
      contextualAlternatives: {},
      selectedQuestionVersions: {},
      copilotProbes: [],
      isAdaptingQuestions: false,
      isGeneratingCopilotProbes: false,
      adaptError: null,
      copilotError: null,
      totalElapsedSeconds: 0,
      questionElapsedSeconds: 0,
      isPaused: false,
      lastTickTime: null,
    });
  },
}));
