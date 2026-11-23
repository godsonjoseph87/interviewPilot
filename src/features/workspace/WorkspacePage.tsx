import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileCheck,
  AlertTriangle,
  Code2,
  Clock,
  Compass,
  FileQuestion,
  Play,
  Pause,
  Square,
  Trash2,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { QuestionSidebar } from './QuestionSidebar';
import { QuestionMainPanel } from './QuestionMainPanel';
import { LiveContextPanel } from './LiveContextPanel';
import { CopilotProbesWidget } from './CopilotProbesWidget';
import { DsaMainPanel } from '@/features/dsa/DsaMainPanel';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { calculateInterviewScores } from '@/services/scoring/scoreCalculator';
import { generateFinalInterviewReport } from '@/services/ai';
import { generateQuestionsPdf } from '@/services/pdf/questionBankPdfGenerator';
import { formatDuration } from '@/lib/utils';
import type { FinalReport } from '@/types';

interface WorkspacePageProps {
  onFinishSuccess: (reportId: string) => void;
  onExit: () => void;
}

export function WorkspacePage({ onFinishSuccess, onExit }: WorkspacePageProps) {
  const {
    session,
    questions,
    evaluations,
    dsaProblems,
    dsaSubmissions,
    totalElapsedSeconds,
    finishInterview,
    abandonInterview,
    pauseAndExit,
    clearActiveSession,
    contextHistory,
    consolidatedContext,
    contextualAlternatives,
    selectedQuestionVersions,
    copilotProbes,
    isPaused,
    startInterview,
    togglePauseTimer,
    tickTimers,
    activeSection,
    setActiveSection,
  } = useInterviewSessionStore();

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'question' | 'context' | 'copilot'>('question');
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [excludeUnaskedQuestions, setExcludeUnaskedQuestions] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportGenStep, setReportGenStep] = useState('');
  const [reportGenError, setReportGenError] = useState<string | null>(null);

  // Reliable overall session interval timer
  useEffect(() => {
    const timer = setInterval(() => {
      tickTimers();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimers]);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <h3 className="text-h3 font-semibold text-foreground">
          No Active Interview Session Found
        </h3>
        <p className="text-caption text-muted-foreground max-w-sm leading-relaxed">
          Please configure a new technical interview or select an existing session from the dashboard.
        </p>
        <Button onClick={onExit} variant="primary" size="sm">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Pre-calculate statistics for confirmation modal
  const evalList = Object.values(evaluations);
  const evaluatedCount = evalList.filter(
    (e) => e.status === 'correct' || e.status === 'partially_correct' || e.status === 'incorrect'
  ).length;
  const skippedCount = evalList.filter((e) => e.status === 'skipped').length;
  const pendingCount = questions.length - evaluatedCount - skippedCount;
  const dsaReviewedCount = Object.values(dsaSubmissions).filter((s) => !!s.review).length;

  const handleConfirmFinish = async (excludePending = false) => {
    setIsGeneratingReport(true);
    setReportGenError(null);
    setReportGenStep('Computing deterministic scoring rubrics in browser...');

    try {
      await new Promise((r) => setTimeout(r, 300));

      const scores = calculateInterviewScores(
        questions,
        evalList,
        Object.values(dsaSubmissions),
        { excludePending }
      );

      setReportGenStep('Synthesizing evaluation report with Google Gemini...');

      // Prepare questions summary based on the ACTUAL question asked (Original vs Contextual)
      const questionsSummary = questions.map((q) => {
        const ev = evaluations[q.id];
        const selectedVer = ev?.selectedVersion || selectedQuestionVersions[q.id] || 'original';
        const isContextual = selectedVer !== 'original';
        const alt = (contextualAlternatives[q.id] || []).find((a) => a.id === selectedVer);

        return {
          questionTitle: isContextual && alt ? alt.title : q.title,
          category: q.category,
          difficulty: isContextual && alt ? alt.difficulty : q.difficulty,
          evaluationStatus: ev?.status || 'pending',
          scoreAwarded: ev?.score || 0,
          maxScore: q.maxScore || 10,
          interviewerNotes: ev?.interviewerNotes || '',
        };
      });

      // Prepare DSA summary
      const dsaSummary = dsaProblems.map((p) => {
        const sub = dsaSubmissions[p.id];
        return {
          problemTitle: p.title,
          language: sub?.language || session.dsaLanguage,
          candidateCode: sub?.code || '',
          aiScore: sub?.review?.overallScore100 || 0,
          interviewerScore: sub?.review?.interviewerAdjustedScore || 0,
          notes: sub?.review?.interviewerNotes,
        };
      });

      const reportResult = await generateFinalInterviewReport(
        {
          candidateName: session.candidateName,
          jobPosition: session.jobPosition,
          totalExperience: session.totalExperience,
          relevantJavaExperience: session.relevantJavaExperience,
          difficulty: session.difficulty,
          durationMinutes: session.durationMinutes,
          actualDurationSeconds: totalElapsedSeconds,
          interviewerName: session.interviewerName,
          questionsSummary,
          dsaSummary,
          calculatedOverallScore: scores.overallScore100,
          calculatedCategoryScores: scores.categoryScores,
        },
        true // allow calibrated mock fallback if no API key
      );

      setReportGenStep('Persisting report in local database...');

      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const finalReport: FinalReport = {
        id: reportId,
        sessionId: session.id,
        candidateName: session.candidateName,
        jobPosition: session.jobPosition,
        totalExperience: session.totalExperience,
        interviewerName: session.interviewerName,
        interviewDate: Date.now(),
        durationMinutes: session.durationMinutes,
        actualDurationSeconds: totalElapsedSeconds,
        candidateOverview:
          excludePending && pendingCount > 0
            ? `${reportResult.candidateOverview}\n\n[Note: Interview was concluded early after ${evaluatedCount} of ${questions.length} scheduled technical questions were evaluated.]`
            : reportResult.candidateOverview,
        overallScore100: scores.overallScore100,
        categoryScores: scores.categoryScores,
        competencies: reportResult.competencies,
        technicalStrengths: reportResult.technicalStrengths,
        technicalWeaknesses: reportResult.technicalWeaknesses,
        areasForImprovement: reportResult.areasForImprovement,
        practicalEngineeringCompetency: reportResult.practicalEngineeringCompetency,
        candidateContextSummary: consolidatedContext
          ? {
            domain: consolidatedContext.domain,
            technologies: consolidatedContext.technologies,
            architecture: consolidatedContext.architecture,
            workflows: consolidatedContext.communication,
            historyCount: contextHistory.length,
          }
          : undefined,
        detailedQuestionAssessment: questions.map((q) => {
          const ev = evaluations[q.id];
          const selectedVer = ev?.selectedVersion || selectedQuestionVersions[q.id] || 'original';
          const isContextual = selectedVer !== 'original';
          const alt = (contextualAlternatives[q.id] || []).find((a) => a.id === selectedVer);

          return {
            questionId: q.id,
            questionTitle: isContextual && alt ? alt.title : q.title,
            category: q.category,
            interviewerEvaluation: ev?.status || 'pending',
            scoreAwarded: ev?.score || 0,
            maxScore: q.maxScore || 10,
            notes: ev?.interviewerNotes || '',
            isContextual,
            contextualAlternativeId: isContextual && alt ? alt.id : undefined,
            adaptedQuestionText: isContextual && alt ? alt.question : undefined,
            originalQuestionText: q.question,
            reasonForSelection:
              ev?.versionSelectionReason || (isContextual && alt ? alt.reasonForAdaptation : undefined),
            projectContextUsed: isContextual && alt ? alt.projectContextUsed : undefined,
          };
        }),
        dsaAssessment: {
          summary: reportResult.dsaSummary,
          problems: dsaProblems.map((p) => {
            const sub = dsaSubmissions[p.id];
            return {
              problemTitle: p.title,
              language: sub?.language || session.dsaLanguage,
              aiScore: sub?.review?.overallScore100 || 0,
              interviewerScore:
                sub?.review?.interviewerAdjustedScore ?? sub?.review?.overallScore100 ?? 0,
              summary: sub?.review?.interviewerSummary || 'Assessed by interviewer.',
              timeComplexity: sub?.review?.complexityAnalysis || p.expectedTimeComplexity,
              spaceComplexity: p.expectedSpaceComplexity,
            };
          }),
        },
        hiringRecommendation: reportResult.hiringRecommendation,
        generatedAt: Date.now(),
      };

      await finishInterview(finalReport);

      setIsGeneratingReport(false);
      setIsFinishConfirmOpen(false);
      setIsEndModalOpen(false);
      onFinishSuccess(reportId);
    } catch (err: any) {
      console.error('Final report generation error:', err);
      setIsGeneratingReport(false);
      setReportGenError(err?.message || 'Failed to synthesize final evaluation report.');
    }
  };

  const handlePauseAndExit = async () => {
    await pauseAndExit();
    setIsEndModalOpen(false);
    onExit();
  };

  const handleAbortSession = async () => {
    await abandonInterview();
    clearActiveSession();
    setIsEndModalOpen(false);
    onExit();
  };

  const handleOpenEndModal = () => {
    if (!isPaused) togglePauseTimer();
    setIsEndModalOpen(true);
  };

  const handleExportQuestionsPdf = () => {
    if (!session) return;
    generateQuestionsPdf({
      session,
      questions,
      dsaProblems,
      contextualAlternatives,
      evaluations,
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background">
      {/* 1. Left Sidebar: Candidate Profile, Questions, & Progress */}
      <QuestionSidebar
        onEndInterview={handleOpenEndModal}
        onExportQuestionsPdf={handleExportQuestionsPdf}
      />

      {/* 2. Main Full-Width Workspace Panel */}
      <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
        {/* Workspace Top Header Bar: Tabs on Left, Session Controls & Timers on Right */}
        <div className="px-6 py-2.5 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-raised border border-border">
            <button
              type="button"
              onClick={() => {
                setActiveSection('technical');
                setActiveWorkspaceTab('question');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeSection === 'technical' && activeWorkspaceTab === 'question'
                  ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <FileQuestion className="h-3.5 w-3.5 text-primary" />
              <span>Technical Questions</span>
            </button>

            {dsaProblems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveSection('dsa');
                  setActiveWorkspaceTab('question');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
                  activeSection === 'dsa' && activeWorkspaceTab === 'question'
                    ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span>DSA Coding ({dsaProblems.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('context')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeWorkspaceTab === 'context'
                  ? 'bg-primary-subtle text-primary shadow-xs border border-primary/30 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Live Candidate Context</span>
              {contextHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-xs font-mono font-semibold">
                  {contextHistory.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('copilot')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeWorkspaceTab === 'copilot'
                  ? 'bg-primary-subtle text-primary shadow-xs border border-primary/30 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-primary" />
              <span>Interviewer Copilot</span>
              {copilotProbes.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-xs font-mono font-semibold">
                  {copilotProbes.length}
                </span>
              )}
            </button>
          </div>

          {/* Right Session Controls & Timers */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Overall Interview Session Stopwatch */}
            <div className="h-8 px-3.5 rounded-md border border-border bg-surface-raised inline-flex items-center gap-2 text-xs font-mono tabular-nums text-muted-foreground shadow-xs whitespace-nowrap shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                {formatDuration(totalElapsedSeconds)}
              </span>
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                / {session.durationMinutes}:00 {session.status === 'draft' ? '(Ready)' : ''}
              </span>
            </div>

            {/* Export Questions & Answers Guide PDF */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportQuestionsPdf}
              className="text-xs font-semibold"
              title="Download all questions, expected answers, key check points and solutions as a PDF"
            >
              <FileDown className="h-3.5 w-3.5 mr-1 text-primary shrink-0" />
              <span>Export Q&A PDF</span>
            </Button>

            {/* If interview is in draft (questions generated, waiting to start), show Start Interview button */}
            {session.status === 'draft' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={startInterview}
                className="text-xs font-semibold"
                title="Start the interview and begin timer"
              >
                <Play className="h-3.5 w-3.5 fill-current mr-1 shrink-0" />
                <span>Start Interview</span>
              </Button>
            ) : (
              <>
                {/* Pause / Resume Button */}
                <Button
                  variant={isPaused ? 'primary' : 'outline'}
                  size="sm"
                  onClick={togglePauseTimer}
                  className="text-xs font-semibold"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current mr-1 shrink-0" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5 mr-1 text-primary shrink-0" />
                      <span>Pause</span>
                    </>
                  )}
                </Button>

                {/* End Interview Button (Stop in between) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEndModal}
                  className="text-xs font-semibold text-danger border-danger-border hover:bg-danger-subtle"
                  title="Stop or end this ongoing interview in between"
                >
                  <Square className="h-3 w-3 mr-1 fill-danger text-danger shrink-0" />
                  <span>End Interview</span>
                </Button>

                {/* Conclude & Generate Final Report */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsFinishConfirmOpen(true)}
                  className="text-xs font-semibold"
                >
                  <FileCheck className="h-3.5 w-3.5 mr-1 shrink-0" />
                  <span>Finish Interview</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Pre-Interview Readiness Banner */}
        {session.status === 'draft' && (
          <div className="bg-primary-subtle border-b border-primary/20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>
                Questions generated and ready for review! The interview timer is currently stopped at 00:00. When you are ready to begin with the candidate, click <strong>Start Interview</strong>.
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={startInterview}
              className="text-xs font-semibold"
            >
              <Play className="h-3 w-3 fill-current mr-1" />
              <span>Start Interview</span>
            </Button>
          </div>
        )}

        {/* Tab Content Display */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeWorkspaceTab === 'question' && (
            activeSection === 'dsa' ? <DsaMainPanel /> : <QuestionMainPanel />
          )}
          {activeWorkspaceTab === 'context' && (
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
              <LiveContextPanel />
            </div>
          )}
          {activeWorkspaceTab === 'copilot' && (
            <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
              <CopilotProbesWidget />
            </div>
          )}
        </div>
      </div>

      {/* Finish Interview Confirmation Modal */}
      <Modal
        isOpen={isFinishConfirmOpen}
        onClose={() => !isGeneratingReport && setIsFinishConfirmOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-success" />
            <span className="font-semibold text-foreground">Finish Interview & Generate Evaluation Report</span>
          </div>
        }
      >
        <div className="space-y-5">
          <p className="text-body text-muted-foreground leading-relaxed">
            You are about to conclude the technical interview session for{' '}
            <strong className="text-foreground">{session.candidateName}</strong> ({session.jobPosition}).
          </p>

          {/* Session Summary Stats Box */}
          <div className="p-4 rounded-lg border border-border bg-surface-raised space-y-2.5 text-xs">
            <span className="font-semibold text-foreground uppercase tracking-wider text-xs block">
              Interview Evaluation Summary:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-md bg-card border border-border">
                <span className="text-muted-foreground block text-xs">Answered Questions</span>
                <span className="text-sm font-bold text-foreground font-mono tabular-nums">
                  {evaluatedCount} / {questions.length}
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-card border border-border">
                <span className="text-muted-foreground block text-xs">DSA Problems Reviewed</span>
                <span className="text-sm font-bold text-foreground font-mono tabular-nums">
                  {dsaReviewedCount} / {dsaProblems.length}
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-card border border-border">
                <span className="text-muted-foreground block text-xs">Skipped Questions</span>
                <span className="text-sm font-bold text-warning font-mono tabular-nums">
                  {skippedCount} (excluded)
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-card border border-border">
                <span className="text-muted-foreground block text-xs">Total Elapsed Duration</span>
                <span className="text-sm font-bold text-primary font-mono tabular-nums">
                  {Math.round(totalElapsedSeconds / 60)} mins
                </span>
              </div>
            </div>

            {pendingCount > 0 && (
              <p className="text-xs text-warning pt-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Notice: <strong>{pendingCount} questions</strong> are still pending an evaluation score.
                </span>
              </p>
            )}
          </div>

          {/* Option: Exclude Unasked Questions */}
          {pendingCount > 0 && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface cursor-pointer select-none">
              <input
                type="checkbox"
                checked={excludeUnaskedQuestions}
                onChange={(e) => setExcludeUnaskedQuestions(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground block">
                  Conclude Interview Early (Exclude unasked questions from score denominator)
                </span>
                <p className="text-caption text-muted-foreground leading-normal">
                  Recommended if the interview ended early. Candidate will only be scored on questions they actually answered, rather than receiving 0 for unreached questions.
                </p>
              </div>
            </label>
          )}

          {/* Report Generation Progress Overlay */}
          {isGeneratingReport ? (
            <div className="p-6 text-center space-y-3 bg-surface-raised rounded-lg border border-border">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-foreground font-mono font-medium">
                {reportGenStep}
              </p>
              <p className="text-caption text-muted-foreground">
                Analyzing completed technical questions, notes & DSA assessments...
              </p>
            </div>
          ) : (
            <>
              {reportGenError && (
                <div className="p-3 rounded-lg border border-danger-border bg-danger-subtle text-danger text-xs">
                  {reportGenError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFinishConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleConfirmFinish(excludeUnaskedQuestions)}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Synthesize & View Report</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* End / Stop Interview Modal (Interviewer can pause, abort, or generate report early) */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => !isGeneratingReport && setIsEndModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4 text-danger fill-danger" />
            <span className="font-semibold text-foreground">Stop / Conclude Ongoing Interview</span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-body text-muted-foreground leading-relaxed">
            The interview timer is currently paused. You have conducted{' '}
            <strong className="text-foreground">{formatDuration(totalElapsedSeconds)}</strong> with{' '}
            <strong className="text-foreground">{session.candidateName}</strong> ({evaluatedCount} of {questions.length} questions evaluated).
          </p>

          {isGeneratingReport ? (
            <div className="p-6 text-center space-y-3 bg-surface-raised rounded-lg border border-border">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-foreground font-mono font-medium">
                {reportGenStep}
              </p>
              <p className="text-caption text-muted-foreground">
                Analyzing completed technical questions, notes & DSA assessments...
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 pt-2 border-t border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Choose how to stop this interview:
              </span>

              {/* Action 1: End & Generate Report */}
              <div className="p-3 rounded-lg border border-border bg-card hover:bg-surface-raised transition-colors flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>End & Generate Evaluation Report</span>
                  </div>
                  <p className="text-caption text-muted-foreground leading-tight">
                    Conclude now and synthesize an evaluation report based on evaluated questions.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleConfirmFinish(excludeUnaskedQuestions)}
                  className="shrink-0"
                >
                  Generate Report
                </Button>
              </div>

              {/* Action 2: Pause & Save for Later */}
              <div className="p-3 rounded-lg border border-border bg-card hover:bg-surface-raised transition-colors flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Pause className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Pause & Save for Later</span>
                  </div>
                  <p className="text-caption text-muted-foreground leading-tight">
                    Save current responses and timer. You can resume this session anytime from Dashboard.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseAndExit}
                  className="shrink-0"
                >
                  Save & Exit
                </Button>
              </div>

              {/* Action 3: Discard / Mark Ended Early */}
              <div className="p-3 rounded-lg border border-danger-border bg-danger-subtle hover:bg-danger-subtle/80 transition-colors flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-semibold text-danger flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5 text-danger shrink-0" />
                    <span>Discard / Abort Interview</span>
                  </div>
                  <p className="text-caption text-danger/80 leading-tight">
                    Stop this session without a report. Marked as ended early in history.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAbortSession}
                  className="shrink-0 border-danger-border text-danger hover:bg-danger/10"
                >
                  Abort Session
                </Button>
              </div>

              {/* Cancel Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEndModalOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel & Continue Interview
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
