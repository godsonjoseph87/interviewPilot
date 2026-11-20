import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  FileText,
  Download,
  Play,
  ArrowUpDown,
  AlertCircle,
  PlusCircle,
  CheckCircle,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { db, deleteFullSession } from '@/services/db';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { generateReportPdf } from '@/services/pdf/reportPdfGenerator';
import { generateQuestionsPdf } from '@/services/pdf/questionBankPdfGenerator';
import type { InterviewSession, FinalReport } from '@/types';
import { formatDate } from '@/lib/utils';
import { HIRING_RECOMMENDATIONS } from '@/lib/constants';

interface HistoryPageProps {
  onOpenReport: (reportId: string) => void;
  onResumeSession: (sessionId: string) => void;
  onCreateNew: () => void;
}

export function HistoryPage({
  onOpenReport,
  onResumeSession,
  onCreateNew,
}: HistoryPageProps) {
  const { loadSessionFromDb } = useInterviewSessionStore();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [reports, setReports] = useState<Record<string, FinalReport>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Deletion Modal
  const [sessionToDelete, setSessionToDelete] = useState<InterviewSession | null>(null);

  const loadData = async () => {
    try {
      const storedSessions = await db.sessions.toArray();
      const storedReports = await db.reports.toArray();

      const repMap: Record<string, FinalReport> = {};
      storedReports.forEach((r) => {
        repMap[r.sessionId] = r;
      });

      setSessions(storedSessions);
      setReports(repMap);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    await deleteFullSession(sessionToDelete.id);
    setSessionToDelete(null);
    await loadData();
  };

  const handleAction = async (s: InterviewSession) => {
    if (s.status === 'completed' && s.reportId) {
      onOpenReport(s.reportId);
    } else {
      await loadSessionFromDb(s.id);
      onResumeSession(s.id);
    }
  };

  // Filter and sort
  const filteredSessions = sessions.filter((s) => {
    const report = reports[s.id];
    const rec = report?.interviewerOverrideRecommendation || report?.hiringRecommendation || '';

    // Search query
    const matchesSearch =
      s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.jobPosition.toLowerCase().includes(searchQuery.toLowerCase());

    // Recommendation filter
    const matchesRec =
      filterRecommendation === 'all' ||
      rec.toLowerCase() === filterRecommendation.toLowerCase();

    // Status filter
    const matchesStatus =
      filterStatus === 'all' || s.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesRec && matchesStatus;
  });

  filteredSessions.sort((a, b) => {
    if (sortBy === 'date') {
      const diff = (a.createdAt || 0) - (b.createdAt || 0);
      return sortOrder === 'desc' ? -diff : diff;
    }
    if (sortBy === 'name') {
      return sortOrder === 'desc'
        ? b.candidateName.localeCompare(a.candidateName)
        : a.candidateName.localeCompare(b.candidateName);
    }
    if (sortBy === 'score') {
      const scoreA = reports[a.id]?.overallScore100 || 0;
      const scoreB = reports[b.id]?.overallScore100 || 0;
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    }
    return 0;
  });

  const handleDownloadQA = async (session: InterviewSession) => {
    try {
      const questions = await db.questions.where('sessionId').equals(session.id).sortBy('number');
      const dsaProblems = await db.dsaProblems.where('sessionId').equals(session.id).toArray();
      const rawAlternatives = await db.contextualAlternatives.where('sessionId').equals(session.id).toArray();
      const contextualAlternatives: Record<string, any[]> = {};
      rawAlternatives.forEach((alt) => {
        if (!contextualAlternatives[alt.originalQuestionId]) {
          contextualAlternatives[alt.originalQuestionId] = [];
        }
        contextualAlternatives[alt.originalQuestionId].push(alt);
      });
      const rawEvaluations = await db.evaluations.where('sessionId').equals(session.id).toArray();
      const evaluations: Record<string, any> = {};
      rawEvaluations.forEach((ev) => {
        evaluations[ev.questionId] = ev;
      });

      generateQuestionsPdf({
        session,
        questions,
        dsaProblems,
        contextualAlternatives,
        evaluations,
      });
    } catch (err) {
      console.error('Failed to download Q&A PDF:', err);
      alert('Failed to generate Q&A Guide PDF.');
    }
  };

  return (
    <div className="w-full px-[10%] pt-[80px] pb-16 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-300/50 text-amber-800 text-xs font-semibold mb-2">
            <History className="h-3.5 w-3.5 text-amber-600" />
            <span>Local IndexedDB Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Interview History & Archives
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisit past technical interviews, inspect detailed question evaluations, and export PDF reports.
          </p>
        </div>

        <Button
          size="sm"
          onClick={onCreateNew}
          className="h-8 px-4 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg shadow-md shadow-amber-500/20"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Interview</span>
        </Button>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-1">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search candidate or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Hiring Verdict Filter */}
          <div>
            <select
              value={filterRecommendation}
              onChange={(e) => setFilterRecommendation(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs focus-visible:outline-none"
            >
              <option value="all">All Recommendations</option>
              {HIRING_RECOMMENDATIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.value}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs focus-visible:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex h-9 flex-1 rounded-lg border border-input bg-card px-2.5 text-xs focus-visible:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Candidate Name</option>
            </select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              title={`Order: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
              Loading sessions from local database...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                No matching interview sessions found
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery || filterRecommendation !== 'all' || filterStatus !== 'all'
                  ? 'Try clearing your search query or adjusting your filters.'
                  : 'Start your first candidate interview to populate your history.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-secondary/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="py-3.5 pl-4">Candidate</th>
                    <th className="py-3.5">Position & Experience</th>
                    <th className="py-3.5">Interview Date</th>
                    <th className="py-3.5">Score</th>
                    <th className="py-3.5">Hiring Verdict</th>
                    <th className="py-3.5">Status</th>
                    <th className="py-3.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredSessions.map((s) => {
                    const report = reports[s.id];
                    const rec =
                      report?.interviewerOverrideRecommendation || report?.hiringRecommendation;

                    return (
                      <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 pl-4">
                          <span className="font-bold text-foreground block">
                            {s.candidateName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {s.candidateEmail || 'No email'}
                          </span>
                        </td>

                        <td className="py-3">
                          <span className="text-foreground block">{s.jobPosition}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {s.totalExperience} exp • {s.difficulty}
                          </span>
                        </td>

                        <td className="py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(s.createdAt)}
                        </td>

                        <td className="py-3 font-mono">
                          {report ? (
                            <ScoreBadge score={report.overallScore100} size="sm" />
                          ) : (
                            <span className="text-muted-foreground italic">In Progress</span>
                          )}
                        </td>

                        <td className="py-3">
                          {rec ? (
                            <ScoreBadge recommendation={rec} size="sm" />
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </td>

                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              s.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-300'
                                : s.status === 'in_progress'
                                ? 'bg-amber-500/10 text-amber-800 border border-amber-300'
                                : s.status === 'paused'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : s.status === 'draft'
                                ? 'bg-amber-500/10 text-amber-700 border border-amber-300'
                                : s.status === 'abandoned'
                                ? 'bg-rose-50 text-rose-800 border border-rose-300'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {s.status === 'completed'
                              ? 'Completed'
                              : s.status === 'in_progress'
                              ? 'In Progress'
                              : s.status === 'paused'
                              ? 'Paused'
                              : s.status === 'draft'
                              ? 'Ready to Start'
                              : s.status === 'abandoned'
                              ? 'Ended Early'
                              : s.status}
                          </span>
                        </td>

                        <td className="py-3 text-right pr-4 space-x-1 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(s)}
                            className="text-xs h-7 px-2.5"
                          >
                            {s.status === 'completed' ? 'Open Report' : 'Resume'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadQA(s)}
                            className="h-7 w-7 p-0 text-amber-700 hover:text-amber-900 hover:bg-amber-500/10"
                            title="Download Questions & Answers Guide PDF"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>

                          {report && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateReportPdf(report)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Download Report PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSessionToDelete(s)}
                            className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            title="Delete Interview Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete the interview session for{' '}
            <strong className="text-foreground">{sessionToDelete?.candidateName}</strong>?
            This will permanently remove the questions, candidate evaluations, DSA submissions, and final reports from your local browser database.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionToDelete(null)}
              className="h-8 px-4 text-xs font-semibold rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-8 px-4 text-xs font-bold rounded-lg"
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

