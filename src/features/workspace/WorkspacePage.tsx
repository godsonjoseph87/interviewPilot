import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { QuestionSidebar } from './QuestionSidebar';
import { QuestionMainPanel } from './QuestionMainPanel';
import { WorkspaceRightPanel } from './WorkspaceRightPanel';
import { DsaAssessmentModal } from '@/features/dsa/DsaAssessmentModal';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { calculateInterviewScores } from '@/services/scoring/scoreCalculator';
import { generateFinalInterviewReport } from '@/services/ai';
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
  } = useInterviewSessionStore();

  const [isDsaModalOpen, setIsDsaModalOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportGenStep, setReportGenStep] = useState('');
  const [reportGenError, setReportGenError] = useState<string | null>(null);

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

  const handleConfirmFinish = async () => {
    setIsGeneratingReport(true);
    setReportGenError(null);
    setReportGenStep('Computing deterministic scoring rubrics in browser...');

    try {
      await new Promise((r) => setTimeout(r, 300));

      const scores = calculateInterviewScores(questions, evalList, Object.values(dsaSubmissions));

      setReportGenStep('Synthesizing evaluation report with Google Gemini...');

      // Prepare questions summary
      const questionsSummary = questions.map((q) => {
        const ev = evaluations[q.id];
        return {
          questionTitle: q.title,
          category: q.category,
          difficulty: q.difficulty,
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
        candidateOverview: reportResult.candidateOverview,
        overallScore100: scores.overallScore100,
        categoryScores: scores.categoryScores,
        competencies: reportResult.competencies,
        technicalStrengths: reportResult.technicalStrengths,
        technicalWeaknesses: reportResult.technicalWeaknesses,
        areasForImprovement: reportResult.areasForImprovement,
        practicalEngineeringCompetency: reportResult.practicalEngineeringCompetency,
        detailedQuestionAssessment: questions.map((q) => {
          const ev = evaluations[q.id];
          return {
            questionId: q.id,
            questionTitle: q.title,
            category: q.category,
            interviewerEvaluation: ev?.status || 'pending',
            scoreAwarded: ev?.score || 0,
            maxScore: q.maxScore || 10,
            notes: ev?.interviewerNotes || '',
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
      onFinishSuccess(reportId);
    } catch (err: any) {
      console.error('Final report generation error:', err);
      setIsGeneratingReport(false);
      setReportGenError(err?.message || 'Failed to synthesize final evaluation report.');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* 3-Panel Full Screen Workspace Layout */}
      {/* 1. Left Sidebar: Candidate Profile, Questions, & DSA Shortcut */}
      <QuestionSidebar onOpenDsaModal={() => setIsDsaModalOpen(true)} />

      {/* 2. Main Question & Rubric Content Panel */}
      <QuestionMainPanel />

      {/* 3. Right Evaluation & Stopwatch Panel */}
      <WorkspaceRightPanel
        onFinishInterviewRequest={() => setIsFinishConfirmOpen(true)}
      />

      {/* DSA Assessment Modal */}
      <DsaAssessmentModal
        isOpen={isDsaModalOpen}
        onClose={() => setIsDsaModalOpen(false)}
      />

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
              >
                Continue Interview
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleConfirmFinish}
                className="flex items-center gap-2 font-semibold shadow-lg shadow-emerald-600/20"
              >
                <Sparkles className="h-4 w-4" />
                <span>Confirm & Generate Final Report</span>
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

