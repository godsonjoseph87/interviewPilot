import { db } from './index';

export interface DatabaseBackup {
  version: number;
  exportedAt: string;
  sessions: any[];
  questions: any[];
  evaluations: any[];
  dsaProblems: any[];
  dsaSubmissions: any[];
  reports: any[];
  settings?: any;
}

export async function exportDatabaseBackup(): Promise<string> {
  const sessions = await db.sessions.toArray();
  const questions = await db.questions.toArray();
  const evaluations = await db.evaluations.toArray();
  const dsaProblems = await db.dsaProblems.toArray();
  const dsaSubmissions = await db.dsaSubmissions.toArray();
  const reports = await db.reports.toArray();
  const settings = await db.settings.toArray();

  // Strip sensitive API keys from backup to ensure security
  const sanitizedSettings = settings.map((s) => ({
    ...s,
    geminiApiKey: '', // Do not export API keys for security
  }));

  const backup: DatabaseBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    questions,
    evaluations,
    dsaProblems,
    dsaSubmissions,
    reports,
    settings: sanitizedSettings,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const data = JSON.parse(jsonString) as DatabaseBackup;
    if (!data.sessions || !Array.isArray(data.sessions)) {
      throw new Error('Invalid backup file structure: missing sessions array.');
    }

    await db.transaction('rw', [db.sessions, db.questions, db.evaluations, db.dsaProblems, db.dsaSubmissions, db.reports], async () => {
      if (data.sessions.length > 0) await db.sessions.bulkPut(data.sessions);
      if (data.questions && data.questions.length > 0) await db.questions.bulkPut(data.questions);
      if (data.evaluations && data.evaluations.length > 0) await db.evaluations.bulkPut(data.evaluations);
      if (data.dsaProblems && data.dsaProblems.length > 0) await db.dsaProblems.bulkPut(data.dsaProblems);
      if (data.dsaSubmissions && data.dsaSubmissions.length > 0) await db.dsaSubmissions.bulkPut(data.dsaSubmissions);
      if (data.reports && data.reports.length > 0) await db.reports.bulkPut(data.reports);
    });

    return {
      success: true,
      message: `Successfully imported ${data.sessions.length} interview sessions and related records.`,
      count: data.sessions.length,
    };
  } catch (err: any) {
    console.error('Import error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to parse backup file.',
      count: 0,
    };
  }
}

export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', [db.sessions, db.questions, db.evaluations, db.dsaProblems, db.dsaSubmissions, db.reports], async () => {
    await db.sessions.clear();
    await db.questions.clear();
    await db.evaluations.clear();
    await db.dsaProblems.clear();
    await db.dsaSubmissions.clear();
    await db.reports.clear();
  });
}

