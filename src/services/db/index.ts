import Dexie, { type Table } from 'dexie';
import type {
  InterviewSession,
  Question,
  QuestionEvaluation,
  DsaSubmission,
  DsaProblem,
  FinalReport,
  AppSettings,
} from '@/types';

export interface StoredQuestion extends Question {
  sessionId: string;
}

export interface StoredDsaProblem extends DsaProblem {
  sessionId: string;
}

export class InterviewPilotDatabase extends Dexie {
  sessions!: Table<InterviewSession, string>;
  questions!: Table<StoredQuestion, string>;
  evaluations!: Table<QuestionEvaluation, number>;
  dsaProblems!: Table<StoredDsaProblem, string>;
  dsaSubmissions!: Table<DsaSubmission, number>;
  reports!: Table<FinalReport, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('InterviewPilotDB');

    // Schema Version 1
    this.version(1).stores({
      sessions: 'id, candidateName, jobPosition, status, createdAt',
      questions: 'id, sessionId, category, number',
      evaluations: '++id, [sessionId+questionId], sessionId, questionId, status',
      dsaProblems: 'id, sessionId, number',
      dsaSubmissions: '++id, [sessionId+problemId], sessionId, problemId',
      reports: 'id, sessionId, candidateName, hiringRecommendation, generatedAt',
      settings: 'id',
    });
  }
}

export const db = new InterviewPilotDatabase();

// Default settings record ID
export const SETTINGS_KEY = 'app_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  id: SETTINGS_KEY,
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  saveKeyLocally: false,
  googleClientId: '',
  defaultDuration: 60,
  defaultDifficulty: 'hard',
  defaultTopics: [
    'java_oop',
    'java_collections',
    'java_concurrency',
    'spring_boot',
    'microservices',
    'kafka_messaging',
    'mysql_optimization',
    'system_design',
    'real_world_problems',
    'dsa',
  ],
  theme: 'dark',
};

// Database helper functions
export async function getSettings(): Promise<AppSettings> {
  try {
    const stored = await db.settings.get(SETTINGS_KEY);
    if (!stored) {
      await db.settings.put(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return stored;
  } catch (err) {
    console.error('Failed to get settings from db:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({
    ...current,
    ...settings,
    id: SETTINGS_KEY,
  });
}

// Session recovery and query helpers
export async function getFullSession(sessionId: string) {
  const session = await db.sessions.get(sessionId);
  if (!session) return null;

  const questions = await db.questions.where('sessionId').equals(sessionId).sortBy('number');
  const evaluations = await db.evaluations.where('sessionId').equals(sessionId).toArray();
  const dsaProblems = await db.dsaProblems.where('sessionId').equals(sessionId).sortBy('number');
  const dsaSubmissions = await db.dsaSubmissions.where('sessionId').equals(sessionId).toArray();
  const report = session.reportId ? await db.reports.get(session.reportId) : undefined;

  return {
    session,
    questions,
    evaluations,
    dsaProblems,
    dsaSubmissions,
    report,
  };
}

export async function deleteFullSession(sessionId: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.questions, db.evaluations, db.dsaProblems, db.dsaSubmissions, db.reports], async () => {
    await db.sessions.delete(sessionId);
    await db.questions.where('sessionId').equals(sessionId).delete();
    await db.evaluations.where('sessionId').equals(sessionId).delete();
    await db.dsaProblems.where('sessionId').equals(sessionId).delete();
    await db.dsaSubmissions.where('sessionId').equals(sessionId).delete();
    const reports = await db.reports.where('sessionId').equals(sessionId).toArray();
    for (const r of reports) {
      await db.reports.delete(r.id);
    }
  });
}

