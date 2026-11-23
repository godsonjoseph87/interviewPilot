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
  Check,
  FileCheck,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
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
    startInterview,
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
  const halfScore = Math.round(maxScore * 0.5); // 5 points for standard 10pt question

  const handleEvaluationClick = async (status: EvaluationStatus) => {
    let score = 0;
    if (status === 'correct') {
      score = maxScore;
      setCustomScoreInput(maxScore);
    } else if (status === 'partially_correct') {
      score = halfScore; // Explicitly 5 pts
      setCustomScoreInput(halfScore);
    } else if (status === 'incorrect') {
      score = 0;
      setCustomScoreInput(0);
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
    <aside className="w-84 lg:w-96 shrink-0 border-l border-border bg-card flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Timers & Pause/Resume Header */}
      <div className="p-4 border-b border-border bg-surface space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block">
              Total Elapsed Time
            </span>
            <div className="flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {formatDuration(totalElapsedSeconds)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {session.durationMinutes}:00
              </span>
            </div>
          </div>

          {session.status === 'draft' ? (
            <Button
              variant="success"
              size="sm"
              onClick={startInterview}
              className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start</span>
            </Button>
          ) : (
            <Button
              variant={isPaused ? 'primary' : 'outline'}
              size="sm"
              onClick={togglePauseTimer}
              className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Question-Specific Timer */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Time on current question:</span>
          </span>
          <span className="font-mono tabular-nums font-bold text-foreground">
            {formatDuration(questionElapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Main Scrollable Body: Scoring & Notes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Scoring Status Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Candidate Evaluation
            </label>
            {isSavedIndicator && (
              <span className="text-xs text-success flex items-center gap-1 font-medium animate-fade-in">
                <Check className="h-3 w-3" />
                <span>Saved</span>
              </span>
            )}
          </div>

          {/* Quick Score Buttons (Grid) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleEvaluationClick('correct')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentStatus === 'correct'
                  ? 'bg-success-subtle border-success text-success shadow-xs'
                  : 'bg-surface-raised border-border hover:border-success/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Correct ({maxScore} pts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleEvaluationClick('partially_correct')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentStatus === 'partially_correct'
                  ? 'bg-primary-subtle border-primary text-primary shadow-xs'
                  : 'bg-surface-raised border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <MinusCircle className="h-4 w-4 text-primary" />
              <span>Partial ({halfScore} pts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleEvaluationClick('incorrect')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentStatus === 'incorrect'
                  ? 'bg-danger-subtle border-danger text-danger shadow-xs'
                  : 'bg-surface-raised border-border hover:border-danger/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <XCircle className="h-4 w-4 text-danger" />
              <span>Incorrect (0 pts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleEvaluationClick('skipped')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                currentStatus === 'skipped'
                  ? 'bg-warning-subtle border-warning text-warning shadow-xs'
                  : 'bg-surface-raised border-border hover:border-warning/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <SkipForward className="h-4 w-4 text-warning" />
              <span>Skip (Exclude)</span>
            </button>
          </div>

          {/* Fine-Tuning Score Slider / Override */}
          <div className="p-3 rounded-lg border border-border bg-surface-raised space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span>Adjust Awarded Marks:</span>
              </span>
              <span className="font-mono tabular-nums font-bold text-foreground">
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
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Live Candidate Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Interviewer Observation Notes
          </label>
          <Textarea
            value={notesInput}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Type observations, code snippets cited by the candidate, gaps, or notable strong explanations..."
            rows={8}
            className="text-xs leading-relaxed"
          />
          <p className="text-caption text-muted-foreground italic">
            Changes auto-save locally to IndexedDB as you type.
          </p>
        </div>
      </div>

      {/* Navigation & Completion Footer */}
      <div className="p-4 border-t border-border bg-surface space-y-2.5">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex-1 h-8 text-xs font-semibold"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            <span>Previous</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="flex-1 h-8 text-xs font-semibold"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onFinishInterviewRequest}
          className="w-full h-9 text-xs font-semibold flex items-center justify-center gap-2"
        >
          <FileCheck className="h-4 w-4" />
          <span>Finish Interview & Generate Report</span>
        </Button>
      </div>
    </aside>
  );
}
