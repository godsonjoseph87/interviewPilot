import React, { useEffect, useState } from 'react';
import {
  Users,
  Award,
  Clock,
  Sparkles,
  PlusCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Settings as SettingsIcon,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
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
    <div className="space-y-6 animate-fade-in w-full px-[10%] pt-[80px] pb-16">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl border border-amber-200/80 bg-white p-6 sm:p-8 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-400/15 via-yellow-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-300/60 text-amber-800 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Technical Interviewer Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.name?.split(' ')[0] || 'Interviewer'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conduct structured, high-signal technical interviews with adaptive intelligence and automated scoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => onNavigate('configure')}
              className="flex items-center gap-2 text-sm font-semibold shadow-md shadow-amber-500/25"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Start New Interview</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('settings')}
              className="text-xs sm:text-sm"
            >
              <SettingsIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Interviews"
          value={totalInterviews}
          subtitle={`${completedInterviews} completed evaluation cycles`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Average Score"
          value={scores.length > 0 ? `${avgScore}%` : 'N/A'}
          subtitle={scores.length > 0 ? 'Across completed interviews' : 'No scored sessions yet'}
          icon={<Award className="h-5 w-5" />}
        />
        <StatCard
          title="Positive Hire Rate"
          value={reports.length > 0 ? `${Math.round((hiresCount / reports.length) * 100)}%` : 'N/A'}
          subtitle={`${hiresCount} Strong Hire / Hire recommendations`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Avg Interview Duration"
          value={
            reports.length > 0
              ? `${Math.round(reports.reduce((acc, r) => acc + (r.actualDurationSeconds || 0), 0) / (reports.length * 60))}m`
              : '60m'
          }
          subtitle="Target 60-minute benchmark"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Active in-progress alert banner if session exists */}
      {activeSession && (activeSession.status === 'in_progress' || activeSession.status === 'paused' || activeSession.status === 'draft') && (
        <div className="p-4 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-yellow-500/10 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-300/60 flex items-center justify-center text-amber-800">
              <Play className="h-5 w-5 fill-current text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {activeSession.status === 'draft'
                    ? 'Interview Session Ready to Start'
                    : activeSession.status === 'paused'
                    ? 'Paused Interview Session'
                    : 'Active Interview in Progress'}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    activeSession.status === 'draft'
                      ? 'bg-amber-500'
                      : activeSession.status === 'paused'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500 animate-ping'
                  }`}
                />
              </div>
              <h4 className="text-base font-bold text-foreground">
                {activeSession.candidateName} — {activeSession.jobPosition}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {activeSession.status !== 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEndConfirmOpen(true)}
                className="h-9 px-4 text-xs font-bold border-rose-300 text-rose-700 bg-white hover:bg-rose-50 hover:text-rose-900 inline-flex items-center justify-center gap-1.5 rounded-lg shadow-xs hover:shadow-sm whitespace-nowrap shrink-0"
              >
                <Square className="h-3.5 w-3.5 mr-1.5 text-rose-600 fill-rose-600" />
                <span>End Interview</span>
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => onNavigate('workspace')}
              className="h-9 px-4 text-xs font-bold inline-flex items-center justify-center gap-1.5 rounded-lg shrink-0 shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 whitespace-nowrap"
            >
              <span>{activeSession.status === 'draft' ? 'Open Workspace & Start' : 'Resume Interview Workspace'}</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* End Ongoing Session Modal on Dashboard */}
      <Modal
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        title={
          <div className="flex items-center gap-2 text-rose-700">
            <Square className="h-4 w-4 fill-rose-600 text-rose-600" />
            <span>End Active Interview Session</span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
            Are you sure you want to stop the interview session with{' '}
            <strong className="text-stone-950 font-bold">{activeSession?.candidateName}</strong> ({activeSession?.jobPosition})?
          </p>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2 text-xs">
            <span className="font-bold text-stone-900 block">Available options:</span>
            <ul className="space-y-1.5 text-stone-700 list-disc list-inside">
              <li>
                <strong>Open in Workspace:</strong> Evaluate answers and conclude with a partial report.
              </li>
              <li>
                <strong>Abort Session:</strong> Permanently ends this interview and marks it as ended early in history.
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEndConfirmOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
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
              className="text-xs border-rose-300 text-rose-700 bg-white hover:bg-rose-50 hover:text-rose-900 font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
              <span>Abort Session</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setIsEndConfirmOpen(false);
                onNavigate('workspace');
              }}
              className="text-xs font-semibold"
            >
              <span>Open in Workspace</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Two Column Section: Recent Sessions & Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Interviews Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Interview Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Candidate interview records and evaluation scores
                </CardDescription>
              </div>
              {sessions.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('history')}
                  className="text-xs text-amber-700 hover:text-amber-800"
                >
                  View All ({sessions.length})
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading interview records from local database...
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    No interviews conducted yet
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Start your first technical interview to evaluate candidates with AI-powered questions, rubrics, and DSA reviews.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => onNavigate('configure')}
                    className="mt-2 text-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                    <span>Create First Interview</span>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground uppercase tracking-wider font-semibold">
                        <th className="pb-3 pl-1">Candidate</th>
                        <th className="pb-3">Position & Exp</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Score / Verdict</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-1">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {sessions.slice(0, 5).map((s) => {
                        const report = reportMap.get(s.id);
                        const rec =
                          report?.interviewerOverrideRecommendation || report?.hiringRecommendation;

                        return (
                          <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                            <td className="py-3 pl-1">
                              <span className="font-semibold text-foreground block">
                                {s.candidateName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {s.candidateEmail || 'No email provided'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-foreground block">{s.jobPosition}</span>
                              <span className="text-[11px] text-muted-foreground">
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
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                  s.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : s.status === 'in_progress'
                                    ? 'bg-primary/10 text-primary'
                                    : s.status === 'draft'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-secondary text-muted-foreground'
                                }`}
                              >
                                {s.status === 'completed'
                                  ? 'Completed'
                                  : s.status === 'in_progress'
                                  ? 'Live'
                                  : s.status === 'draft'
                                  ? 'Ready'
                                  : s.status}
                              </span>
                            </td>
                            <td className="py-3 text-right pr-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResume(s)}
                                className="text-xs h-7 px-2.5"
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

        {/* Right Info Box (4 cols): Quick Start Guide & Hiring Stats */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Quick Interview Presets
              </CardTitle>
              <CardDescription className="text-xs">
                Targeted configurations for backend roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onClick={() => onNavigate('configure')}
                className="p-3.5 rounded-xl border border-amber-200/70 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/70 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-foreground group-hover:text-amber-800">
                    Senior Java Backend Engineer
                  </h5>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-300/40">
                    60 min
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Focus: Concurrency, Spring Transactions, Kafka Offset Management, MySQL Locks, 2 DSA problems.
                </p>
              </div>

              <div
                onClick={() => onNavigate('configure')}
                className="p-3.5 rounded-xl border border-amber-200/70 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/70 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-foreground group-hover:text-amber-800">
                    Backend / Distributed Architect
                  </h5>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-300/40">
                    90 min
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Focus: High throughput system design, Saga pattern, JVM profiling, distributed caching & resiliency.
                </p>
              </div>

              <div
                onClick={() => onNavigate('configure')}
                className="p-3.5 rounded-xl border border-amber-200/70 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/70 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-foreground group-hover:text-amber-800">
                    Core Java & DSA Assessment
                  </h5>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-300/40">
                    45 min
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Focus: Collections internals, memory model, Streams, multi-threading and algorithmic coding.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

