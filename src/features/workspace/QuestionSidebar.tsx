import React from 'react';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Code2,
  Clock,
  Square,
  FileDown,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { formatDuration } from '@/lib/utils';
import type { QuestionEvaluation } from '@/types';

interface QuestionSidebarProps {
  onOpenDsaModal?: () => void;
  onEndInterview?: () => void;
  onExportQuestionsPdf?: () => void;
}

export function QuestionSidebar({ onOpenDsaModal, onEndInterview, onExportQuestionsPdf }: QuestionSidebarProps) {
  const {
    session,
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    evaluations,
    dsaProblems,
    dsaSubmissions,
    contextualAlternatives,
    selectedQuestionVersions,
    totalElapsedSeconds,
    activeSection,
    currentDsaIndex,
    setActiveSection,
    setCurrentDsaIndex,
  } = useInterviewSessionStore();

  if (!session) return null;

  // Calculate progress
  const evalList = Object.values(evaluations);
  const completedCount = evalList.filter(
    (e) => e.status === 'correct' || e.status === 'partially_correct' || e.status === 'incorrect'
  ).length;
  const skippedCount = evalList.filter((e) => e.status === 'skipped').length;
  const totalQuestions = questions.length;
  const progressPct = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-surface flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Candidate Profile Header */}
      <div className="p-4 border-b border-border bg-surface-raised">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-primary-subtle border border-primary-border text-primary flex items-center justify-center font-semibold text-small shrink-0">
            {session.candidateName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-small font-semibold text-foreground truncate">
              {session.candidateName}
            </h3>
            <p className="text-caption text-muted-foreground truncate">
              {session.jobPosition}
            </p>
            <div className="flex items-center gap-2 pt-0.5 text-caption text-subtle-foreground font-mono tabular-nums">
              <span>{session.totalExperience} exp</span>
              <span>•</span>
              <span className="capitalize">{session.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex justify-between text-caption font-medium">
            <span className="text-foreground">Progress</span>
            <span className="text-primary font-mono font-semibold tabular-nums">
              {completedCount} / {totalQuestions} answered
            </span>
          </div>
          <ProgressBar value={progressPct} />
          {skippedCount > 0 && (
            <p className="text-caption text-muted-foreground italic">
              {skippedCount} question{skippedCount > 1 ? 's' : ''} skipped (excluded)
            </p>
          )}
        </div>
      </div>

      {/* Questions Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="px-2 py-1 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
          Technical Questions
        </div>

        {questions.map((q, index) => {
          const isSelected = activeSection === 'technical' && currentQuestionIndex === index;
          const ev: QuestionEvaluation | undefined = evaluations[q.id];
          const status = ev?.status || 'pending';
          const alts = contextualAlternatives[q.id] || [];
          const selectedVer = selectedQuestionVersions[q.id] || 'original';
          const alt = alts.find((a) => a.id === selectedVer) || alts[0];
          const isAdaptedActive = selectedVer !== 'original' && !!alt;
          const displayTitle = isAdaptedActive ? alt.title : q.title;

          // Helper for status icon
          const renderStatusIcon = (st: string, num: number) => {
            if (st === 'correct') return <CheckCircle2 className="h-4 w-4 text-success" />;
            if (st === 'partially_correct') return <MinusCircle className="h-4 w-4 text-warning" />;
            if (st === 'incorrect') return <XCircle className="h-4 w-4 text-danger" />;
            if (st === 'skipped') return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
            return (
              <div className="h-4 w-4 rounded-full border border-border flex items-center justify-center text-caption font-mono text-muted-foreground">
                {num}
              </div>
            );
          };

          return (
            <div
              key={q.id}
              onClick={() => {
                setActiveSection('technical');
                setCurrentQuestionIndex(index);
              }}
              className={`p-2.5 rounded-lg border text-caption cursor-pointer transition-colors flex items-start gap-2.5 select-none ${
                isSelected
                  ? 'border-primary bg-primary-subtle text-foreground font-semibold shadow-xs'
                  : 'border-border bg-card hover:border-border-strong hover:bg-surface-raised text-foreground'
              }`}
            >
              <div className="mt-0.5 shrink-0">{renderStatusIcon(status, index + 1)}</div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium truncate">
                    Q{index + 1}. {displayTitle}
                  </span>
                  {status !== 'pending' && ev?.score !== undefined && (
                    <span className="font-mono text-primary font-semibold tabular-nums shrink-0">
                      {ev.score}pt
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span className="truncate max-w-[130px]">{q.category}</span>
                  <span>•</span>
                  <span className="tabular-nums">{q.suggestedTimeMinutes}m</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* DSA Coding Problems Section */}
        {dsaProblems.length > 0 && (
          <div className="pt-3 space-y-1.5">
            <div className="px-2 py-1 text-caption font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>DSA Coding</span>
              <span className="font-mono text-caption text-primary">Targeted</span>
            </div>

            {dsaProblems.map((prob, dsaIdx) => {
              const isSelected = activeSection === 'dsa' && currentDsaIndex === dsaIdx;
              const sub = dsaSubmissions[prob.id];
              const isReviewed = !!sub?.review;

              return (
                <div
                  key={prob.id}
                  onClick={() => {
                    setActiveSection('dsa');
                    setCurrentDsaIndex(dsaIdx);
                  }}
                  className={`p-2.5 rounded-lg border text-caption cursor-pointer transition-colors flex items-start gap-2.5 select-none ${
                    isSelected
                      ? 'border-primary bg-primary-subtle text-foreground font-semibold shadow-xs'
                      : 'border-border bg-card hover:border-border-strong hover:bg-surface-raised text-foreground'
                  }`}
                >
                  <div className="p-1 rounded bg-surface-raised text-muted-foreground shrink-0 mt-0.5">
                    <Code2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium truncate">
                        DSA {dsaIdx + 1}. {prob.title}
                      </span>
                      {isReviewed && (
                        <span className="font-mono text-success-foreground bg-success-subtle px-1.5 py-0.5 rounded border border-success-border font-semibold tabular-nums shrink-0">
                          {sub.review?.interviewerAdjustedScore ?? sub.review?.overallScore100}pt
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                      <span className="font-mono text-primary font-medium">{prob.expectedTimeComplexity}</span>
                      <span>•</span>
                      <span className="tabular-nums">{prob.suggestedTimeMinutes}m</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-border bg-surface-raised flex items-center justify-between text-caption shrink-0">
        <div className="flex items-center gap-1.5 text-muted-foreground font-mono tabular-nums">
          <Clock className="h-3 w-3 text-primary" />
          <span>{formatDuration(totalElapsedSeconds)} {session.status === 'draft' ? '(Ready)' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onExportQuestionsPdf && (
            <Button
              variant="outline"
              size="xs"
              onClick={onExportQuestionsPdf}
              leftIcon={<FileDown className="h-3 w-3 text-muted-foreground" />}
              title="Download Questions & Answers Guide PDF"
            >
              PDF
            </Button>
          )}
          {onEndInterview && (
            <Button
              variant="outline"
              size="xs"
              onClick={onEndInterview}
              leftIcon={<Square className="h-2.5 w-2.5 fill-danger text-danger" />}
              className="border-danger-border text-danger-foreground hover:bg-danger-subtle"
              title="Stop interview session early"
            >
              End
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
