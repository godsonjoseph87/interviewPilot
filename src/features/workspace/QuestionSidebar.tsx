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

  const dsaEvaluatedCount = Object.values(dsaSubmissions).filter((s) => !!s.review).length;

  return (
    <aside className="w-80 shrink-0 border-r border-amber-200/70 bg-white dark:border-white/20 dark:bg-black flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Candidate Profile Header */}
      <div className="p-4 border-b border-amber-200/70 bg-amber-50/30 dark:border-white/20 dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-300 text-amber-900 dark:from-zinc-800 dark:to-zinc-900 dark:border-white/30 dark:text-white flex items-center justify-center font-bold text-sm shrink-0">
            {session.candidateName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground truncate">
              {session.candidateName}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {session.jobPosition}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
              <span>{session.totalExperience} exp</span>
              <span>•</span>
              <span className="capitalize">{session.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-foreground">Progress</span>
            <span className="text-amber-800 dark:text-zinc-200 font-mono font-bold">
              {completedCount} / {totalQuestions} answered
            </span>
          </div>
          <ProgressBar value={progressPct} />
          {skippedCount > 0 && (
            <p className="text-[10px] text-amber-700 dark:text-zinc-400 italic">
              {skippedCount} question{skippedCount > 1 ? 's' : ''} skipped (excluded from score)
            </p>
          )}
        </div>
      </div>

      {/* Questions Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
            if (st === 'correct') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            if (st === 'partially_correct') return <MinusCircle className="h-4 w-4 text-amber-500" />;
            if (st === 'incorrect') return <XCircle className="h-4 w-4 text-rose-500" />;
            if (st === 'skipped') return <MinusCircle className="h-4 w-4 text-amber-400" />;
            return (
              <div className="h-4 w-4 rounded-full border border-stone-300 dark:border-white/20 flex items-center justify-center text-[10px] font-mono text-stone-500 dark:text-zinc-400">
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
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/15 shadow-xs font-semibold text-stone-950 dark:border-white dark:bg-zinc-800 dark:text-white'
                  : 'border-stone-200/80 hover:border-amber-300 bg-white text-stone-800 shadow-xs hover:shadow-sm dark:border-white/10 dark:bg-black dark:text-zinc-300 dark:hover:border-white/30'
              }`}
            >
              {/* Status Indicator Icon */}
              <div className="mt-0.5 shrink-0">{renderStatusIcon(status, index + 1)}</div>

              {/* Title & Category */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold truncate">
                    Q{index + 1}. {displayTitle}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {status !== 'pending' && ev?.score !== undefined && (
                      <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-zinc-200">
                        {ev.score}pt
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                  <span className="truncate max-w-[130px]">{q.category}</span>
                  <span>•</span>
                  <span>{q.suggestedTimeMinutes}m</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* DSA Coding Problems Section (Directly integrated, no popup) */}
        {dsaProblems.length > 0 && (
          <div className="pt-3 space-y-1.5">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>DSA Coding Assessment</span>
              <span className="text-[10px] font-mono text-amber-700 dark:text-zinc-400 font-bold">No graphs</span>
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
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/20 text-stone-950 shadow-xs ring-2 ring-amber-500/40 font-semibold dark:border-white dark:bg-zinc-800 dark:text-white dark:ring-white/30'
                      : 'border-amber-200/70 bg-white hover:border-amber-300 hover:bg-amber-50/40 text-stone-800 shadow-xs hover:shadow-sm dark:border-white/10 dark:bg-black dark:text-zinc-300 dark:hover:border-white/30'
                  }`}
                >
                  <div className="p-1 rounded bg-amber-500/20 text-amber-800 dark:bg-white/10 dark:text-white shrink-0 mt-0.5">
                    <Code2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold truncate">
                        DSA {dsaIdx + 1}. {prob.title}
                      </span>
                      {isReviewed && (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-zinc-800 dark:text-white px-1.5 py-0.2 rounded border border-emerald-200 dark:border-white/30">
                          {sub.review?.interviewerAdjustedScore ?? sub.review?.overallScore100}pt
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-mono text-amber-800 dark:text-zinc-300 font-bold">{prob.expectedTimeComplexity}</span>
                      <span>•</span>
                      <span>{prob.suggestedTimeMinutes}m</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer with Stop/End Action */}
      <div className="p-3 border-t border-amber-200/70 bg-amber-50/40 dark:border-white/20 dark:bg-zinc-950 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-stone-600 dark:text-zinc-400 font-mono text-[11px]">
          <Clock className="h-3 w-3 text-amber-600 dark:text-white" />
          <span>{formatDuration(totalElapsedSeconds)} {session.status === 'draft' ? '(Ready)' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          {onExportQuestionsPdf && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportQuestionsPdf}
              className="h-7 px-2.5 text-[11px] font-semibold border-amber-300/80 bg-white hover:bg-amber-50/70 text-amber-900 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 shadow-xs hover:shadow-sm"
              title="Download Questions & Answers Guide PDF"
            >
              <FileDown className="h-3 w-3 text-amber-600 dark:text-white" />
              <span>Q&A PDF</span>
            </Button>
          )}
          {onEndInterview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEndInterview}
              className="h-7 px-2.5 text-[11px] font-bold border-rose-300/80 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs hover:shadow-sm"
              title="Stop interview session early"
            >
              <Square className="h-2.5 w-2.5 fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400" />
              <span>End</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

