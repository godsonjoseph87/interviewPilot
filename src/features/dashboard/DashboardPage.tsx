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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
  const { session: activeSession, loadSessionFromDb } = useInterviewSessionStore();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Technical Interviewer Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Interviewer'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Design, conduct, and evaluate structured technical interviews for Java Backend Engineers and Software Architects with Google Gemini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => onNavigate('configure')}
              className="flex items-center gap-2 text-sm font-semibold shadow-xl shadow-cyan-500/20"
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
      {activeSession && activeSession.status === 'in_progress' && (
        <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/30 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Active Interview in Progress
                </span>
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                {activeSession.candidateName} — {activeSession.jobPosition}
              </h4>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => onNavigate('workspace')}
            className="text-xs sm:text-sm font-semibold shrink-0"
          >
            <span>Resume Interview Workspace</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}

      {/* Two Column Section: Recent Sessions & Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Interviews Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Interview Sessions
                </CardTitle>
                <CardDescription className="text-xs">
                  Locally stored candidate interviews recorded in IndexedDB
                </CardDescription>
              </div>
              {sessions.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('history')}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
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
                                    ? 'bg-cyan-500/10 text-cyan-400'
                                    : 'bg-secondary text-muted-foreground'
                                }`}
                              >
                                {s.status === 'completed'
                                  ? 'Completed'
                                  : s.status === 'in_progress'
                                  ? 'Live'
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
          <Card className="border-border/80">
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
                className="p-3 rounded-xl border border-border/70 hover:border-cyan-500/40 bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-foreground group-hover:text-cyan-300">
                    Senior Java Backend Engineer
                  </h5>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                    60 min
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Focus: Concurrency, Spring Transactions, Kafka Offset Management, MySQL Locks, 2 DSA problems.
                </p>
              </div>

              <div
                onClick={() => onNavigate('configure')}
                className="p-3 rounded-xl border border-border/70 hover:border-violet-500/40 bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-foreground group-hover:text-violet-300">
                    Backend / Distributed Architect
                  </h5>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">
                    90 min
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Focus: High throughput system design, Saga pattern, JVM profiling, distributed caching & resiliency.
                </p>
              </div>

              <div
                onClick={() => onNavigate('configure')}
                className="p-3 rounded-xl border border-border/70 hover:border-blue-500/40 bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-foreground group-hover:text-blue-300">
                    Core Java & DSA Assessment
                  </h5>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    45 min
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Focus: Collections internals, memory model, Streams, multi-threading and algorithmic coding.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hiring Recommendations Distribution */}
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Hiring Decisions Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Strong Hire', 'Hire', 'Lean Hire', 'Lean No Hire', 'No Hire'].map((rec) => {
                const count = reports.filter(
                  (r) => (r.interviewerOverrideRecommendation || r.hiringRecommendation) === rec
                ).length;
                const pct = reports.length > 0 ? Math.round((count / reports.length) * 100) : 0;

                return (
                  <div key={rec} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground">{rec}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rec === 'Strong Hire'
                            ? 'bg-emerald-500'
                            : rec === 'Hire'
                            ? 'bg-cyan-500'
                            : rec === 'Lean Hire'
                            ? 'bg-blue-500'
                            : rec === 'Lean No Hire'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

