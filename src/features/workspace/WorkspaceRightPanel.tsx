import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  MinusCircle,
  XCircle,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  FileCheck,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { formatDuration } from '@/lib/utils';
import type { EvaluationStatus, QuestionEvaluation } from '@/types';

interface WorkspaceRightPanelProps {
  onFinishInterviewRequest: () => void;
}

export function WorkspaceRightPanel({
  onFinishInterviewRequest,
}: WorkspaceRightPanelProps) {
  const {
    session,
    questions,
    currentQuestionIndex,
    evaluations,
    setQuestionEvaluation,
    setQuestionNotes,
    nextQuestion,
    prevQuestion,
    totalElapsedSeconds,
    questionElapsedSeconds,
    isPaused,
    togglePauseTimer,
    tickTimers,
  } = useInterviewSessionStore();

  const currentQuestion = questions[currentQuestionIndex];
  const currentEval: QuestionEvaluation | undefined = currentQuestion
    ? evaluations[currentQuestion.id]
    : undefined;

  const [notesInput, setNotesInput] = useState(currentEval?.interviewerNotes || '');
  const [customScoreInput, setCustomScoreInput] = useState<number>(
    currentEval?.score ?? 5
  );
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  // Sync notes when active question changes
  useEffect(() => {
    if (currentEval) {
      setNotesInput(currentEval.interviewerNotes || '');
      setCustomScoreInput(currentEval.score ?? 5);
    } else {
      setNotesInput('');
      setCustomScoreInput(5);
    }
  }, [currentQuestion?.id, currentEval]);

  // Reliable interval timer
  useEffect(() => {
    const timer = setInterval(() => {
      tickTimers();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimers]);

  if (!currentQuestion || !session) return null;

  const maxScore = currentQuestion.maxScore || 10;
  const currentStatus = currentEval?.status || 'pending';

  const handleEvaluationClick = async (status: EvaluationStatus) => {
    let score = 0;
    if (status === 'correct') {
      score = maxScore;
    } else if (status === 'partially_correct') {
      score = customScoreInput !== undefined ? customScoreInput : Math.round(maxScore * 0.5);
    } else if (status === 'incorrect') {
      score = 0;
    } else if (status === 'skipped') {
      score = 0;
    }

    await setQuestionEvaluation(currentQuestion.id, status, score, notesInput);
    setIsSavedIndicator(true);
    setTimeout(() => setIsSavedIndicator(false), 1500);
  };

  const handleNotesChange = (text: string) => {
    setNotesInput(text);
    // Debounced autosave
    setQuestionNotes(currentQuestion.id, text);
  };

  const handleCustomScoreChange = (score: number) => {
    const valid = Math.min(maxScore, Math.max(0, score));
    setCustomScoreInput(valid);
    if (currentStatus === 'partially_correct' || currentStatus === 'correct') {
      setQuestionEvaluation(currentQuestion.id, currentStatus, valid, notesInput);
    }
  };

  return (
    <aside className="w-84 lg:w-96 shrink-0 border-l border-border/80 bg-card/70 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Timers & Pause/Resume Header */}
      <div className="p-4 border-b border-border/60 bg-secondary/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Total Elapsed Time
            </span>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-black tracking-tight text-foreground">
                {formatDuration(totalElapsedSeconds)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {session.durationMinutes}:00
              </span>
            </div>
          </div>

          <Button
            variant={isPaused ? 'default' : 'outline'}
            size="sm"
            onClick={togglePauseTimer}
            className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5 fill-current text-slate-950" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-400" />
                <span>Pause</span>
              </>
            )}
          </Button>
        </div>

        {/* Current Question Stopwatch */}
        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-card/60 border border-border/50 font-mono">
          <span className="text-muted-foreground flex items-center gap-1.5 font-sans">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Question Timer:</span>
          </span>
          <span className="font-bold text-cyan-300">
            {formatDuration(questionElapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Main Controls Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Evaluation Controls */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Evaluate Response
            </label>
            {isSavedIndicator && (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-fade-in">
                <Check className="h-3 w-3" />
                <span>Autosaved</span>
              </span>
            )}
          </div>

          {/* Quick Action Evaluation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleEvaluationClick('correct')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                currentStatus === 'correct'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-secondary/40 border-border/60 hover:border-emerald-500/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Correct ({maxScore} pts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleEvaluationClick('partially_correct')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                currentStatus === 'partially_correct'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-secondary/40 border-border/60 hover:border-cyan-500/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <MinusCircle className="h-4 w-4 text-cyan-400" />
              <span>Partial ({customScoreInput} pts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleEvaluationClick('incorrect')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                currentStatus === 'incorrect'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                  : 'bg-secondary/40 border-border/60 hover:border-rose-500/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <XCircle className="h-4 w-4 text-rose-400" />
              <span>Incorrect (0 pts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleEvaluationClick('skipped')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                currentStatus === 'skipped'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-secondary/40 border-border/60 hover:border-amber-500/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <SkipForward className="h-4 w-4 text-amber-400" />
              <span>Skip (Exclude)</span>
            </button>
          </div>

          {/* Fine-Tuning Score Slider / Override */}
          <div className="p-3 rounded-xl border border-border/60 bg-secondary/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span>Adjust Awarded Marks:</span>
              </span>
              <span className="font-mono font-bold text-foreground">
                {currentEval?.score !== undefined ? currentEval.score : customScoreInput} / {maxScore}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={maxScore}
              step={1}
              value={currentEval?.score !== undefined ? currentEval.score : customScoreInput}
              onChange={(e) => handleCustomScoreChange(Number(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Live Candidate Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Interviewer Observation Notes
          </label>
          <Textarea
            value={notesInput}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Type observations, code snippets cited by the candidate, gaps, or notable strong explanations..."
            rows={8}
            className="text-xs leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground italic">
            Changes auto-save locally to IndexedDB as you type.
          </p>
        </div>
      </div>

      {/* Navigation & Completion Footer */}
      <div className="p-4 border-t border-border/60 bg-secondary/30 space-y-2.5">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            <span>Previous</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="flex-1 text-xs"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <Button
          variant="success"
          size="default"
          onClick={onFinishInterviewRequest}
          className="w-full text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <FileCheck className="h-4 w-4" />
          <span>Finish Interview & Generate Report</span>
        </Button>
      </div>
    </aside>
  );
}

