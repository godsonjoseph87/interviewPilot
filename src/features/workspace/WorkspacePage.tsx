import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileCheck,
  AlertTriangle,
  Code2,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Compass,
  FileQuestion,
  Layers,
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
        <AlertTriangle className="h-12 w-12 text-amber-400" />
        <h3 className="text-lg font-bold text-foreground">
          No Active Interview Session Found
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Please configure a new technical interview or select an existing session from the dashboard.
        </p>
        <Button onClick={onExit} size="sm">
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
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* 1. Left Sidebar: Candidate Profile, Questions, & Progress */}
      <QuestionSidebar
        onEndInterview={handleOpenEndModal}
        onExportQuestionsPdf={handleExportQuestionsPdf}
      />

      {/* 2. Main Full-Width Workspace Panel */}
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Workspace Top Header Bar: Tabs on Left, Session Controls & Timers on Right */}
        <div className="px-6 py-2.5 border-b border-amber-200/70 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveSection('technical');
                setActiveWorkspaceTab('question');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeSection === 'technical' && activeWorkspaceTab === 'question'
                ? 'bg-white text-stone-950 shadow-xs border border-amber-300 font-bold'
                : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                }`}
            >
              <FileQuestion className="h-3.5 w-3.5 text-amber-600" />
              <span>Technical Questions</span>
            </button>

            {dsaProblems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveSection('dsa');
                  setActiveWorkspaceTab('question');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeSection === 'dsa' && activeWorkspaceTab === 'question'
                  ? 'bg-white text-stone-950 shadow-xs border border-amber-300 font-bold'
                  : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                  }`}
              >
                <Code2 className="h-3.5 w-3.5 text-amber-600" />
                <span>DSA Coding ({dsaProblems.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('context')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeWorkspaceTab === 'context'
                ? 'bg-amber-500/20 text-amber-900 shadow-xs border border-amber-400 font-bold'
                : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Live Candidate Context</span>
              {contextHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-900 text-[10px] font-mono font-bold">
                  {contextHistory.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('copilot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeWorkspaceTab === 'copilot'
                ? 'bg-amber-500/15 text-amber-900 shadow-xs border border-amber-400 font-bold'
                : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                }`}
            >
              <Compass className="h-3.5 w-3.5 text-amber-600" />
              <span>Interviewer Copilot</span>
              {copilotProbes.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-900 text-[10px] font-mono font-bold">
                  {copilotProbes.length}
                </span>
              )}
            </button>
          </div>

          {/* Right Session Controls & Timers */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Overall Interview Session Stopwatch */}
            <div className="h-8 px-3.5 rounded-lg border border-stone-200/80 dark:border-white/20 bg-stone-50/80 dark:bg-zinc-900 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground shadow-2xs whitespace-nowrap shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-white shrink-0" />
              <span className="font-bold text-foreground">
                {formatDuration(totalElapsedSeconds)}
              </span>
              <span className="text-muted-foreground text-[11px] whitespace-nowrap">
                / {session.durationMinutes}:00 {session.status === 'draft' ? '(Ready)' : ''}
              </span>
            </div>

            {/* Export Questions & Answers Guide PDF */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportQuestionsPdf}
              className="h-8 px-4 min-w-[125px] text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70 text-stone-800 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm whitespace-nowrap shrink-0"
              title="Download all questions, expected answers, key check points and solutions as a PDF"
            >
              <FileDown className="h-3.5 w-3.5 text-amber-600 dark:text-white shrink-0" />
              <span>Export Q&A PDF</span>
            </Button>

            {/* If interview is in draft (questions generated, waiting to start), show Start Interview button */}
            {session.status === 'draft' ? (
              <Button
                variant="default"
                size="sm"
                onClick={startInterview}
                className="h-8 px-4 min-w-[125px] text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/40 cursor-pointer whitespace-nowrap shrink-0"
                title="Start the interview and begin timer"
              >
                <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                <span>Start Interview</span>
              </Button>
            ) : (
              <>
                {/* Pause / Resume Button */}
                <Button
                  variant={isPaused ? 'default' : 'outline'}
                  size="sm"
                  onClick={togglePauseTimer}
                  className="h-8 px-4 min-w-[125px] text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70 text-stone-800 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm whitespace-nowrap shrink-0"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5 text-amber-600 dark:text-white shrink-0" />
                      <span>Pause</span>
                    </>
                  )}
                </Button>

                {/* End Interview Button (Stop in between) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEndModal}
                  className="h-8 px-4 min-w-[125px] text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 border-rose-300/90 bg-rose-50/60 hover:bg-rose-100 text-rose-800 hover:text-rose-950 transition-all shadow-xs hover:shadow-sm dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300 whitespace-nowrap shrink-0"
                  title="Stop or end this ongoing interview in between"
                >
                  <Square className="h-3 w-3 text-rose-600 fill-rose-600 dark:text-rose-400 dark:fill-rose-400 shrink-0" />
                  <span>End Interview</span>
                </Button>

                {/* Conclude & Generate Final Report */}
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setIsFinishConfirmOpen(true)}
                  className="h-8 px-4 min-w-[125px] text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg shadow-emerald-600/20 whitespace-nowrap shrink-0"
                >
                  <FileCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Finish Interview</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Pre-Interview Readiness Banner */}
        {session.status === 'draft' && (
          <div className="bg-amber-500/10 border-b border-amber-300/60 dark:bg-zinc-900 dark:border-white/20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-2xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-white animate-pulse" />
              <span>
                Questions generated and ready for review! The interview timer is currently stopped at 00:00. When you are ready to begin with the candidate, click <strong>Start Interview</strong>.
              </span>
            </div>
            <Button
              size="sm"
              onClick={startInterview}
              className="h-8 px-4 text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-sm cursor-pointer rounded-lg"
            >
              <Play className="h-3 w-3 fill-current" />
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
            <div className="flex-1 overflow-y-auto px-[10%] pt-[80px] pb-16">
              <LiveContextPanel />
            </div>
          )}
          {activeWorkspaceTab === 'copilot' && (
            <div className="flex-1 overflow-y-auto px-[10%] pt-[80px] pb-16">
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
            <FileCheck className="h-5 w-5 text-emerald-400" />
            <span>Finish Interview & Generate Evaluation Report</span>
          </div>
        }
      >
        <div className="space-y-5">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            You are about to conclude the technical interview session for{' '}
            <strong className="text-foreground">{session.candidateName}</strong> ({session.jobPosition}).
          </p>

          {/* Session Summary Stats Box */}
          <div className="p-4 rounded-xl border border-border/80 bg-secondary/30 space-y-2.5 text-xs">
            <span className="font-bold text-foreground uppercase tracking-wider text-[11px] block">
              Interview Evaluation Summary:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-card border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Answered Questions</span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {evaluatedCount} / {questions.length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border/50">
                <span className="text-muted-foreground block text-[11px]">DSA Problems Reviewed</span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {dsaReviewedCount} / {dsaProblems.length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Skipped Questions</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {skippedCount} (excluded)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border/50">
                <span className="text-muted-foreground block text-[11px]">Total Elapsed Duration</span>
                <span className="text-sm font-bold text-cyan-300 font-mono">
                  {Math.round(totalElapsedSeconds / 60)} mins
                </span>
              </div>
            </div>

            {pendingCount > 0 && (
              <p className="text-[11px] text-amber-400/90 pt-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {pendingCount} question{pendingCount > 1 ? 's are' : ' is'} currently marked pending.
                </span>
              </p>
            )}
          </div>

          {/* Error Message if report generation failed */}
          {reportGenError && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
              {reportGenError}
            </div>
          )}

          {/* Generating Loading State */}
          {isGeneratingReport ? (
            <div className="p-6 text-center space-y-3 bg-secondary/20 rounded-xl border border-cyan-500/30">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <p className="text-xs text-cyan-300 font-mono font-medium animate-pulse">
                {reportGenStep}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Analyzing technical competencies across Java, Kafka, Spring, MySQL, System Design & DSA...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFinishConfirmOpen(false)}
                className="h-8 px-4 text-xs font-semibold rounded-lg"
              >
                Continue Interview
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleConfirmFinish(false)}
                className="h-8 px-4 text-xs font-bold rounded-lg inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Sparkles className="h-4 w-4" />
                <span>Confirm & Generate Final Report</span>
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* End Ongoing Interview Modal (Stop in between) */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => !isGeneratingReport && setIsEndModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-rose-700">
            <Square className="h-4 w-4 fill-rose-600 text-rose-600" />
            <span>End Ongoing Interview Session</span>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl border border-rose-200/90 bg-rose-50/60 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Stop Interview in Progress
              </span>
            </div>
            <p className="text-xs text-stone-900 leading-relaxed">
              You are stopping the interview session with{' '}
              <strong className="text-stone-950 font-bold">{session.candidateName}</strong> ({session.jobPosition}) before completing all scheduled questions.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-muted-foreground block">Answered</span>
              <span className="text-sm font-bold text-stone-900 font-mono">
                {evaluatedCount} / {questions.length}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-muted-foreground block">Remaining</span>
              <span className="text-sm font-bold text-amber-700 font-mono">
                {pendingCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-muted-foreground block">DSA Reviewed</span>
              <span className="text-sm font-bold text-stone-900 font-mono">
                {dsaReviewedCount} / {dsaProblems.length}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-muted-foreground block">Elapsed Time</span>
              <span className="text-sm font-bold text-stone-900 font-mono">
                {formatDuration(totalElapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Option for unasked questions */}
          {pendingCount > 0 && evaluatedCount > 0 && (
            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="excludePendingCheckbox"
                checked={excludeUnaskedQuestions}
                onChange={(e) => setExcludeUnaskedQuestions(e.target.checked)}
                className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="excludePendingCheckbox" className="text-xs text-stone-900 leading-normal cursor-pointer select-none">
                <span className="font-bold text-stone-950 block">Exclude {pendingCount} unasked question{pendingCount > 1 ? 's' : ''} from score calculation</span>
                Score candidate fairly based only on questions evaluated so far, rather than penalizing unreached questions with 0 points.
              </label>
            </div>
          )}

          {/* Error Message if report generation failed */}
          {reportGenError && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 text-xs">
              {reportGenError}
            </div>
          )}

          {/* Report Generating Spinner */}
          {isGeneratingReport ? (
            <div className="p-6 text-center space-y-3 bg-amber-50/40 rounded-xl border border-amber-300/60">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
              <p className="text-xs text-amber-900 font-mono font-medium animate-pulse">
                {reportGenStep}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Analyzing completed technical questions, notes & DSA assessments...
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 pt-2 border-t border-stone-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Choose how to stop this interview:
              </span>

              {/* Action 1: End & Generate Report */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>End & Generate Evaluation Report</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    Conclude now and synthesize an evaluation report based on evaluated questions.
                  </p>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleConfirmFinish(excludeUnaskedQuestions)}
                  className="h-8 px-4 min-w-[120px] text-xs font-bold rounded-lg inline-flex items-center justify-center shrink-0"
                >
                  Generate Report
                </Button>
              </div>

              {/* Action 2: Pause & Save for Later */}
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Pause className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Pause & Save for Later</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    Save current responses and timer. You can resume this session anytime from Dashboard.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseAndExit}
                  className="h-8 px-4 min-w-[120px] text-xs font-semibold rounded-lg inline-flex items-center justify-center shrink-0 border-amber-300 text-stone-800 bg-white hover:bg-amber-50"
                >
                  Save & Exit
                </Button>
              </div>

              {/* Action 3: Discard / Mark Ended Early */}
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>Discard / Abort Interview</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    Stop this session without a report. Marked as ended early in history.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAbortSession}
                  className="h-8 px-4 min-w-[120px] text-xs font-semibold rounded-lg inline-flex items-center justify-center shrink-0 border-rose-300 text-rose-700 bg-white hover:bg-rose-100 hover:text-rose-900"
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

