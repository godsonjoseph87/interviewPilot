import React from 'react';
import {
  User,
  CheckCircle2,
  HelpCircle,
  XCircle,
  MinusCircle,
  Code2,
  Briefcase,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import type { QuestionEvaluation } from '@/types';

interface QuestionSidebarProps {
  onOpenDsaModal: () => void;
}

export function QuestionSidebar({ onOpenDsaModal }: QuestionSidebarProps) {
  const {
    session,
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    evaluations,
    dsaProblems,
    dsaSubmissions,
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
    <aside className="w-80 shrink-0 border-r border-border/80 bg-card/70 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Candidate Profile Header */}
      <div className="p-4 border-b border-border/60 bg-secondary/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
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
            <span className="text-cyan-400 font-mono">
              {completedCount} / {totalQuestions} answered
            </span>
          </div>
          <ProgressBar value={progressPct} />
          {skippedCount > 0 && (
            <p className="text-[10px] text-amber-400 italic">
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
          const isSelected = currentQuestionIndex === index;
          const ev: QuestionEvaluation | undefined = evaluations[q.id];
          const status = ev?.status || 'pending';

          return (
            <div
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                isSelected
                  ? 'border-cyan-500/70 bg-cyan-950/25 shadow-sm'
                  : 'border-border/50 hover:border-border hover:bg-secondary/40 bg-card/40'
              }`}
            >
              {/* Status Indicator Icon */}
              <div className="mt-0.5 shrink-0">
                {status === 'correct' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
                {status === 'partially_correct' && (
                  <MinusCircle className="h-4 w-4 text-cyan-400" />
                )}
                {status === 'incorrect' && (
                  <XCircle className="h-4 w-4 text-rose-400" />
                )}
                {status === 'skipped' && (
                  <MinusCircle className="h-4 w-4 text-amber-400" />
                )}
                {status === 'pending' && (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-semibold truncate ${
                      isSelected ? 'text-cyan-300' : 'text-foreground'
                    }`}
                  >
                    Q{index + 1}. {q.title}
                  </span>
                  {status !== 'pending' && ev?.score !== undefined && (
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {ev.score}pt
                    </span>
                  )}
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

        {/* DSA Section Shortcut Button */}
        {dsaProblems.length > 0 && (
          <div className="pt-3">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              DSA Coding Assessment
            </div>
            <div
              onClick={onOpenDsaModal}
              className="p-3 rounded-xl border border-violet-500/30 bg-violet-950/20 hover:bg-violet-950/35 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block group-hover:text-violet-300 transition-colors">
                    DSA Coding Problems
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {dsaEvaluatedCount} of {dsaProblems.length} reviewed by AI
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-semibold">
                Open
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

