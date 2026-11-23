import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { Navbar } from '@/components/layout/Navbar';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NewInterviewPage } from '@/features/configure/NewInterviewPage';
import { WorkspacePage } from '@/features/workspace/WorkspacePage';
import { ReportPage } from '@/features/report/ReportPage';
import { HistoryPage } from '@/features/history/HistoryPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { db } from '@/services/db';

export function App() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const { loadSettings } = useSettingsStore();
  const { session, loadSessionFromDb } = useInterviewSessionStore();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'configure' | 'workspace' | 'report' | 'history' | 'settings'>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(undefined);

  // Initialize Auth & Settings from persistent storage
  useEffect(() => {
    initAuth();
    loadSettings();

    // Check for any active in-progress session to recover on refresh
    async function checkActiveSessionRecovery() {
      try {
        const inProgress = await db.sessions
          .where('status')
          .anyOf(['in_progress', 'paused'])
          .first();

        if (inProgress) {
          await loadSessionFromDb(inProgress.id);
        }
      } catch (err) {
        console.warn('Could not check for active sessions:', err);
      }
    }
    checkActiveSessionRecovery();
  }, [initAuth, loadSettings, loadSessionFromDb]);

  if (!isAuthenticated) {
    return (
      <ErrorBoundary fallbackTitle="Authentication Screen Error">
        <LoginPage />
      </ErrorBoundary>
    );
  }

  const handleStartSession = (sessionId: string) => {
    setCurrentTab('workspace');
  };

  const handleFinishSuccess = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentTab('report');
  };

  const handleOpenReportFromHistory = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentTab('report');
  };

  const handleResumeFromHistory = (sessionId: string) => {
    setCurrentTab('workspace');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative">
      {/* Ambient background atmosphere */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-glow-indigo" />
        <div className="ambient-glow-teal" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar currentTab={currentTab} setCurrentTab={(tab) => setCurrentTab(tab as any)} />

        <main className="flex-1 flex flex-col">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab, id) => {
                if (tab === 'report') {
                  setSelectedReportId(id);
                }
                setCurrentTab(tab as any);
              }}
            />
          )}

          {currentTab === 'configure' && (
            <NewInterviewPage
              onStartSession={handleStartSession}
              onCancel={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'workspace' && (
            <WorkspacePage
              onFinishSuccess={handleFinishSuccess}
              onExit={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'report' && (
            <ReportPage
              reportId={selectedReportId}
              onReturnToDashboard={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage
              onOpenReport={handleOpenReportFromHistory}
              onResumeSession={handleResumeFromHistory}
              onCreateNew={() => setCurrentTab('configure')}
            />
          )}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;

