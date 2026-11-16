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
} from '@/types';
import { db, type StoredQuestion, type StoredDsaProblem } from '@/services/db';

interface InterviewSessionState {
  session: InterviewSession | null;
  questions: Question[];
  currentQuestionIndex: number;
  evaluations: Record<string, QuestionEvaluation>;
  dsaProblems: DsaProblem[];
  dsaSubmissions: Record<string, DsaSubmission>;
  report: FinalReport | null;

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

  // DSA Actions
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
  togglePauseTimer: () => void;
  tickTimers: () => void;

  // Session completion
  finishInterview: (report: FinalReport) => Promise<void>;
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
      };
    });

    set({
      session,
      questions,
      currentQuestionIndex: 0,
      evaluations: initialEvaluations,
      dsaProblems,
      dsaSubmissions: {},
      report: null,
      totalElapsedSeconds: 0,
      questionElapsedSeconds: 0,
      isPaused: false,
      lastTickTime: Date.now(),
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
      const report = session.reportId ? await db.reports.get(session.reportId) : null;

      const evaluationsMap: Record<string, QuestionEvaluation> = {};
      evalList.forEach((ev) => {
        evaluationsMap[ev.questionId] = ev;
      });

      const submissionsMap: Record<string, DsaSubmission> = {};
      subList.forEach((sub) => {
        submissionsMap[sub.problemId] = sub;
      });

      set({
        session,
        questions: storedQuestions,
        currentQuestionIndex: session.currentQuestionIndex || 0,
        evaluations: evaluationsMap,
        dsaProblems: dsaList,
        dsaSubmissions: submissionsMap,
        report: report || null,
        totalElapsedSeconds: session.totalElapsedSeconds || 0,
        questionElapsedSeconds: 0,
        isPaused: session.status === 'paused',
        lastTickTime: Date.now(),
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
    const { evaluations, questions, session } = get();
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

  togglePauseTimer: () => {
    const { isPaused, session } = get();
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
    if (isPaused) return;

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

  clearActiveSession: () => {
    set({
      session: null,
      questions: [],
      currentQuestionIndex: 0,
      evaluations: {},
      dsaProblems: [],
      dsaSubmissions: {},
      report: null,
      totalElapsedSeconds: 0,
      questionElapsedSeconds: 0,
      isPaused: false,
      lastTickTime: null,
    });
  },
}));
