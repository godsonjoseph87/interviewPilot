import React, { useEffect, useState } from 'react';
import {
  Users,
  Award,
  Clock,
  PlusCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  Play,
  Settings as SettingsIcon,
  Square,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/common/StatCard';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { db } from '@/services/db';
import type { InterviewSession, FinalReport } from '@/types';
import { formatDate } from '@/lib/utils';

interface DashboardPageProps {
  onNavigate: (tab: string, sessionId?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuthStore();
  const { session: activeSession, loadSessionFromDb, abandonInterview, clearActiveSession } = useInterviewSessionStore();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const storedSessions = await db.sessions.orderBy('createdAt').reverse().toArray();
        const storedReports = await db.reports.toArray();
        setSessions(storedSessions);
        setReports(storedReports);
      } catch (e) {
        console.error('Failed to load dashboard data from IndexedDB:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute local statistics
  const totalInterviews = sessions.length;
  const completedInterviews = sessions.filter((s) => s.status === 'completed').length;

  const scores = reports.map((r) => r.overallScore100).filter((s) => typeof s === 'number');
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Hiring recommendations count
  const hiresCount = reports.filter(
    (r) =>
      (r.interviewerOverrideRecommendation || r.hiringRecommendation) === 'Strong Hire' ||
      (r.interviewerOverrideRecommendation || r.hiringRecommendation) === 'Hire'
  ).length;

  const reportMap = new Map<string, FinalReport>();
  reports.forEach((r) => reportMap.set(r.sessionId, r));

  const handleResume = async (s: InterviewSession) => {
    await loadSessionFromDb(s.id);
    if (s.status === 'completed' && s.reportId) {
      onNavigate('report', s.id);
    } else {
      onNavigate('workspace', s.id);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        eyebrow="Technical Interview Platform"
        title={
          <>
            Welcome back,{' '}
            <span className="font-serif italic font-normal bg-gradient-to-r from-primary to-accent-2 bg-clip-text text-transparent">
              {user?.name?.split(' ')[0] || 'Interviewer'}
            </span>
          </>
        }
        description="Conduct structured technical interviews with real-time candidate context and automated scoring."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate('settings')}
              leftIcon={<SettingsIcon className="h-4 w-4 text-muted-foreground" />}
            >
              Settings
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('configure')}
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              Start New Interview
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Interviews"
          value={totalInterviews}
          subtitle={`${completedInterviews} completed cycles`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Average Score"
          value={scores.length > 0 ? `${avgScore}%` : 'N/A'}
          subtitle={scores.length > 0 ? 'Across completed interviews' : 'No scored sessions yet'}
          icon={<Award className="h-4 w-4" />}
        />
        <StatCard
          title="Positive Hire Rate"
          value={reports.length > 0 ? `${Math.round((hiresCount / reports.length) * 100)}%` : 'N/A'}
          subtitle={`${hiresCount} Strong Hire / Hire`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Avg Duration"
          value={
            reports.length > 0
              ? `${Math.round(reports.reduce((acc, r) => acc + (r.actualDurationSeconds || 0), 0) / (reports.length * 60))}m`
              : '60m'
          }
          subtitle="Target 60-minute benchmark"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Active in-progress alert banner */}
      {activeSession &&
        (activeSession.status === 'in_progress' ||
          activeSession.status === 'paused' ||
          activeSession.status === 'draft') && (
          <div className="p-4 rounded-lg border border-primary-border bg-primary-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-card border border-primary-border flex items-center justify-center text-primary shrink-0">
                <Play className="h-4 w-4 fill-current" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                    {activeSession.status === 'draft'
                      ? 'Interview Session Ready'
                      : activeSession.status === 'paused'
                      ? 'Paused Session'
                      : 'Live Interview in Progress'}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeSession.status === 'in_progress'
                        ? 'bg-success'
                        : 'bg-primary'
                    }`}
                  />
                </div>
                <h4 className="text-small font-semibold text-foreground">
                  {activeSession.candidateName} — {activeSession.jobPosition}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeSession.status !== 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEndConfirmOpen(true)}
                  leftIcon={<Square className="h-3.5 w-3.5 text-danger" />}
                  className="border-danger-border text-danger-foreground hover:bg-danger-subtle"
                >
                  End Interview
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('workspace')}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                {activeSession.status === 'draft' ? 'Enter Workspace' : 'Resume Workspace'}
              </Button>
            </div>
          </div>
        )}

      {/* End Ongoing Session Modal on Dashboard */}
      <Modal
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        title="End Active Interview Session"
        description={`Stop the interview session with ${activeSession?.candidateName || 'Candidate'} (${activeSession?.jobPosition || ''}).`}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-md border border-border bg-surface-raised space-y-2 text-caption">
            <span className="font-semibold text-foreground block">Available actions:</span>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>
                <strong>Open in Workspace:</strong> Conclude session and generate a report.
              </li>
              <li>
                <strong>Abort Session:</strong> Mark as ended early and remove active state.
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEndConfirmOpen(false)}
            >
              Keep Session Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await abandonInterview();
                clearActiveSession();
                setIsEndConfirmOpen(false);
                const storedSessions = await db.sessions.orderBy('createdAt').reverse().toArray();
                setSessions(storedSessions);
              }}
              className="border-danger-border text-danger-foreground hover:bg-danger-subtle"
              leftIcon={<Trash2 className="h-3.5 w-3.5 text-danger" />}
            >
              Abort Session
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsEndConfirmOpen(false);
                onNavigate('workspace');
              }}
            >
              Open in Workspace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Two Column Section: Recent Sessions & Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Interviews Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Interview Sessions</CardTitle>
                <CardDescription>
                  Candidate interview records and evaluation scores
                </CardDescription>
              </div>
              {sessions.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('history')}
                >
                  View All ({sessions.length})
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-caption text-muted-foreground">
                  Loading interview records from local database...
                </div>
              ) : sessions.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title="No interviews conducted yet"
                  description="Start your first technical interview to evaluate candidates with AI-powered questions, rubrics, and DSA reviews."
                  action={
                    <Button
                      size="sm"
                      onClick={() => onNavigate('configure')}
                      leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
                    >
                      Create First Interview
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-caption">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-medium text-caption">
                        <th className="pb-3 pl-1">Candidate</th>
                        <th className="pb-3">Position</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Score / Verdict</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-1">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sessions.slice(0, 5).map((s) => {
                        const report = reportMap.get(s.id);
                        const rec =
                          report?.interviewerOverrideRecommendation || report?.hiringRecommendation;

                        return (
                          <tr key={s.id} className="hover:bg-surface-raised transition-colors">
                            <td className="py-3 pl-1">
                              <span className="font-semibold text-foreground block">
                                {s.candidateName}
                              </span>
                              <span className="text-muted-foreground text-caption">
                                {s.candidateEmail || 'No email provided'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-foreground block">{s.jobPosition}</span>
                              <span className="text-muted-foreground text-caption">
                                {s.totalExperience} exp
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground whitespace-nowrap">
                              {formatDate(s.createdAt)}
                            </td>
                            <td className="py-3">
                              {report ? (
                                <div className="space-y-1">
                                  <ScoreBadge score={report.overallScore100} size="sm" />
                                  {rec && (
                                    <div className="mt-0.5">
                                      <ScoreBadge recommendation={rec} size="sm" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">In progress</span>
                              )}
                            </td>
                            <td className="py-3">
                              <Badge
                                variant={
                                  s.status === 'completed'
                                    ? 'success'
                                    : s.status === 'in_progress'
                                    ? 'default'
                                    : s.status === 'draft'
                                    ? 'warning'
                                    : 'secondary'
                                }
                                dot
                              >
                                {s.status === 'completed'
                                  ? 'Completed'
                                  : s.status === 'in_progress'
                                  ? 'Live'
                                  : s.status === 'draft'
                                  ? 'Ready'
                                  : s.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-right pr-1">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleResume(s)}
                              >
                                {s.status === 'completed' ? 'View Report' : 'Resume'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Quick Interview Presets */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Interview Presets</CardTitle>
              <CardDescription>
                Targeted configurations for common roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onClick={() => onNavigate('configure')}
                className="p-3.5 rounded-md border border-border hover:border-primary-border bg-surface-raised hover:bg-card cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-small font-semibold text-foreground group-hover:text-primary transition-colors">
                    Senior Java Backend Engineer
                  </h5>
                  <Badge variant="secondary" className="font-mono text-caption">
                    60 min
                  </Badge>
                </div>
                <p className="text-caption text-muted-foreground">
                  Concurrency, Spring transactions, Kafka offset management, MySQL optimization, 2 DSA challenges.
                </p>
              </div>

              <div
                onClick={() => onNavigate('configure')}
                className="p-3.5 rounded-md border border-border hover:border-primary-border bg-surface-raised hover:bg-card cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-small font-semibold text-foreground group-hover:text-primary transition-colors">
                    Distributed Systems Architect
                  </h5>
                  <Badge variant="secondary" className="font-mono text-caption">
                    90 min
                  </Badge>
                </div>
                <p className="text-caption text-muted-foreground">
                  High-throughput architecture, Saga pattern, JVM profiling, distributed caching, fault tolerance.
                </p>
              </div>

              <div
                onClick={() => onNavigate('configure')}
                className="p-3.5 rounded-md border border-border hover:border-primary-border bg-surface-raised hover:bg-card cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-small font-semibold text-foreground group-hover:text-primary transition-colors">
                    Core Java & DSA Assessment
                  </h5>
                  <Badge variant="secondary" className="font-mono text-caption">
                    45 min
                  </Badge>
                </div>
                <p className="text-caption text-muted-foreground">
                  Collections internals, memory model, Streams, multi-threading and algorithmic coding.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
