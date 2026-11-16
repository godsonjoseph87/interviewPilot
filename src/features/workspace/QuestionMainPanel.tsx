import React, { useState } from 'react';
import {
  HelpCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { regenerateQuestion } from '@/services/ai';
import type { Question } from '@/types';

export function QuestionMainPanel() {
  const { questions, currentQuestionIndex, replaceQuestion, session } =
    useInterviewSessionStore();

  const question: Question | undefined = questions[currentQuestionIndex];

  // Collapsible toggle states (Expected answer hidden by default per Section 6)
  const [showExpectedAnswer, setShowExpectedAnswer] = useState(false);
  const [showRubricPoints, setShowRubricPoints] = useState(true);
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
        Select a question from the sidebar to inspect details.
      </div>
    );
  }

  const handleRegenerateThisQuestion = async () => {
    if (!session) return;
    if (question.number === 1) {
      alert('Question 1 is the mandatory professional walkthrough and cannot be replaced.');
      return;
    }

    const confirmRegen = window.confirm(
      `Do you want to regenerate Question #${question.number} (${question.title}) with a fresh alternative?`
    );
    if (!confirmRegen) return;

    setIsRegenerating(true);
    setRegenError(null);

    try {
      const avoidTitles = questions.map((q) => q.title);
      const newQuestion = await regenerateQuestion(
        {
          existingQuestion: question,
          topic: question.topic,
          category: question.category,
          difficulty: session.difficulty,
          avoidQuestionTitles: avoidTitles,
        },
        true // allow fallback
      );

      await replaceQuestion(question.id, newQuestion);
      setShowExpectedAnswer(false);
    } catch (err: any) {
      console.error('Failed to regenerate single question:', err);
      setRegenError(err?.message || 'Failed to replace question.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs px-2.5 py-0.5">
            Question #{question.number} of {questions.length}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            {question.category}
          </Badge>
          <Badge
            variant={
              question.difficulty.toLowerCase() === 'hard'
                ? 'destructive'
                : question.difficulty.toLowerCase() === 'medium'
                ? 'warning'
                : 'success'
            }
            className="text-[11px] capitalize"
          >
            {question.difficulty}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Target: {question.suggestedTimeMinutes} mins</span>
            <span>•</span>
            <span>Max {question.maxScore} pts</span>
          </div>

          {question.number !== 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateThisQuestion}
              disabled={isRegenerating}
              isLoading={isRegenerating}
              className="text-xs h-7 px-2.5 flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:border-cyan-500/40"
              title="Replace this question with a fresh alternative"
            >
              <RotateCw className="h-3 w-3 text-cyan-400" />
              <span>Regenerate Question</span>
            </Button>
          )}
        </div>
      </div>

      {regenError && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          {regenError}
        </div>
      )}

      {/* Main Question Card */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {question.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Topic: {question.topic}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-secondary/50 via-card to-cyan-950/20 shadow-md">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1.5">
            Interviewer Prompt:
          </span>
          <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed select-text">
            "{question.question}"
          </p>
        </div>
      </div>

      {/* Collapsible Expected Answer (Hidden by default - Interviewer Reference Material) */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExpectedAnswer(!showExpectedAnswer)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-secondary/30 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            {showExpectedAnswer ? (
              <EyeOff className="h-4 w-4 text-cyan-400" />
            ) : (
              <Eye className="h-4 w-4 text-cyan-400" />
            )}
            <span>Expected Answer & Technical Architecture</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold uppercase">
              Interviewer Only
            </span>
          </div>

          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            {showExpectedAnswer ? 'Collapse' : 'Show Answer'}
            {showExpectedAnswer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {showExpectedAnswer && (
          <div className="p-5 border-t border-border/60 bg-slate-950/40 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 animate-fade-in select-text">
            <p className="whitespace-pre-line">{question.expectedAnswer}</p>
            {question.evaluationRubric && (
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 text-xs text-muted-foreground">
                <strong className="text-foreground">Scoring Rubric: </strong>
                {question.evaluationRubric}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Key Evaluation Points */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRubricPoints(!showRubricPoints)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-secondary/30 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Key Evaluation Points to Look For</span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            {showRubricPoints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {showRubricPoints && (
          <div className="p-5 border-t border-border/60 space-y-2.5 animate-fade-in">
            <ul className="space-y-2">
              {question.evaluationPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Collapsible Red Flags & Common Pitfalls */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRedFlags(!showRedFlags)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-secondary/30 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Common Pitfalls & Architectural Red Flags</span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            {showRedFlags ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {showRedFlags && (
          <div className="p-5 border-t border-border/60 space-y-4 animate-fade-in text-xs sm:text-sm">
            {question.commonMistakes && question.commonMistakes.length > 0 && (
              <div>
                <h5 className="font-bold text-amber-300 mb-1.5 text-xs uppercase tracking-wider">
                  Frequent Mistakes:
                </h5>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {question.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {question.redFlags && question.redFlags.length > 0 && (
              <div>
                <h5 className="font-bold text-rose-400 mb-1.5 text-xs uppercase tracking-wider">
                  Critical Red Flags:
                </h5>
                <ul className="list-disc list-inside text-rose-300/90 space-y-1">
                  {question.redFlags.map((rf, i) => (
                    <li key={i}>{rf}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Follow-up Probing Questions */}
      {question.followUpQuestions && question.followUpQuestions.length > 0 && (
        <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-950/15 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <MessageSquare className="h-4 w-4" />
            <span>Probing Follow-Up Questions (Deep Dives)</span>
          </div>
          <div className="space-y-2">
            {question.followUpQuestions.map((fq, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-card/60 border border-blue-500/20 text-xs text-foreground font-medium flex items-start gap-2.5"
              >
                <span className="font-mono text-cyan-400 font-bold shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{fq}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

