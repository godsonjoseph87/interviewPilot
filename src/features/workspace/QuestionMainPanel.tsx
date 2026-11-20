import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Check,
  Edit3,
  Layers,
  MinusCircle,
  XCircle,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { regenerateQuestion, generateCustomQuestion } from '@/services/ai';
import { formatDuration } from '@/lib/utils';
import type { Question, ContextualAlternative, EvaluationStatus, QuestionEvaluation } from '@/types';

export function QuestionMainPanel() {
  const {
    questions,
    currentQuestionIndex,
    replaceQuestion,
    addQuestionAlternative,
    session,
    evaluations,
    setQuestionEvaluation,
    setQuestionNotes,
    nextQuestion,
    prevQuestion,
    questionElapsedSeconds,
    contextualAlternatives,
    selectedQuestionVersions,
    selectQuestionVersion,
    addCandidateContext,
    adaptUpcomingQuestions,
    isAdaptingQuestions,
    adaptError,
  } = useInterviewSessionStore();

  const question: Question | undefined = questions[currentQuestionIndex];

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [isCustomReplaceModalOpen, setIsCustomReplaceModalOpen] = useState(false);
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customReplaceError, setCustomReplaceError] = useState<string | null>(null);
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);
  const [adaptSuccessNotice, setAdaptSuccessNotice] = useState<string | null>(null);
  const [adaptValidationNotice, setAdaptValidationNotice] = useState<string | null>(null);

  // Current question evaluation state
  const currentEval: QuestionEvaluation | undefined = question
    ? evaluations[question.id]
    : undefined;

  const maxScore = question?.maxScore || 10;
  const halfScore = Math.round(maxScore * 0.5); // 5 points for standard 10pt question

  const [notesInput, setNotesInput] = useState(currentEval?.interviewerNotes || '');
  const [customScoreInput, setCustomScoreInput] = useState<number>(
    currentEval?.status === 'partially_correct'
      ? (currentEval.score ?? halfScore)
      : currentEval?.status === 'correct'
        ? maxScore
        : currentEval?.status === 'incorrect' || currentEval?.status === 'skipped'
          ? 0
          : halfScore
  );

  // Sync notes & custom score when active question changes
  useEffect(() => {
    if (currentEval) {
      setNotesInput(currentEval.interviewerNotes || '');
      if (currentEval.status === 'partially_correct') {
        setCustomScoreInput(currentEval.score ?? halfScore);
      } else if (currentEval.status === 'correct') {
        setCustomScoreInput(maxScore);
      } else if (currentEval.status === 'incorrect' || currentEval.status === 'skipped') {
        setCustomScoreInput(0);
      } else {
        setCustomScoreInput(halfScore);
      }
    } else {
      setNotesInput('');
      setCustomScoreInput(halfScore);
    }
  }, [question?.id, currentEval?.status, currentEval?.score, halfScore, maxScore]);

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
        Select a question from the sidebar to inspect details.
      </div>
    );
  }

  const currentStatus: EvaluationStatus = currentEval?.status || 'pending';

  const alternatives: ContextualAlternative[] = contextualAlternatives[question.id] || [];
  const selectedVersionId = selectedQuestionVersions[question.id] || 'original';
  const isContextualActive = selectedVersionId !== 'original';
  const activeAlt = alternatives.find((a) => a.id === selectedVersionId) || alternatives[0];

  // Active question prompt & rubrics based on selected version
  const activePrompt = isContextualActive && activeAlt ? activeAlt.question : question.question;
  const activeExpectedAnswer = isContextualActive && activeAlt ? activeAlt.expectedAnswer : question.expectedAnswer;
  const activeRubric = isContextualActive && activeAlt ? activeAlt.evaluationRubric : question.evaluationRubric;
  const activeEvaluationPoints = isContextualActive && activeAlt ? activeAlt.evaluationPoints : question.evaluationPoints;
  const activeCommonMistakes = isContextualActive && activeAlt ? activeAlt.commonMistakes : question.commonMistakes;
  const activeRedFlags = isContextualActive && activeAlt ? activeAlt.redFlags : question.redFlags;
  const activeFollowUps = isContextualActive && activeAlt ? activeAlt.followUpQuestions : question.followUpQuestions;
  const activeDifficulty = isContextualActive && activeAlt ? activeAlt.difficulty : question.difficulty;

  // Evaluation marking handler
  const handleEvaluationClick = async (status: EvaluationStatus) => {
    let score = 0;
    if (status === 'correct') {
      score = maxScore;
      setCustomScoreInput(maxScore);
    } else if (status === 'partially_correct') {
      score = halfScore; // 5 pts
      setCustomScoreInput(halfScore);
    } else if (status === 'incorrect') {
      score = 0;
      setCustomScoreInput(0);
    } else if (status === 'skipped') {
      score = 0;
    }

    await setQuestionEvaluation(question.id, status, score, notesInput);
    setIsSavedIndicator(true);
    setTimeout(() => setIsSavedIndicator(false), 1500);
  };

  const handleNotesChange = (text: string) => {
    setNotesInput(text);
    setQuestionNotes(question.id, text);
    setIsSavedIndicator(true);
    setTimeout(() => setIsSavedIndicator(false), 1200);
  };

  const handleCustomScoreChange = (score: number) => {
    const valid = Math.min(maxScore, Math.max(0, score));
    setCustomScoreInput(valid);
    if (currentStatus === 'partially_correct' || currentStatus === 'correct') {
      setQuestionEvaluation(question.id, currentStatus, valid, notesInput);
    }
  };

  const handleOpenRegenerateModal = () => {
    if (!session || !question) return;
    if (question.number === 1) return;
    setRegenError(null);
    setIsRegenerateModalOpen(true);
  };

  const handleOpenCustomReplaceModal = () => {
    if (!session || !question) return;
    setCustomReplaceError(null);
    setCustomQuestionInput('');
    setIsCustomReplaceModalOpen(true);
  };

  const handleConfirmRegenerateQuestion = async () => {
    if (!session || !question) return;

    setIsRegenerating(true);
    setRegenError(null);

    try {
      const avoidTitles = [
        ...questions.map((q) => q.title),
        ...(contextualAlternatives[question.id] || []).map((a) => a.title),
      ];
      const newQuestion = await regenerateQuestion(
        {
          existingQuestion: question,
          topic: question.topic,
          category: question.category,
          difficulty: session.difficulty,
          avoidQuestionTitles: avoidTitles,
        },
        true
      );

      // Save as ContextualAlternative so the original question is NOT deleted!
      const alternative: ContextualAlternative = {
        id: `alt_regen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sessionId: session.id,
        originalQuestionId: question.id,
        title: newQuestion.title,
        question: newQuestion.question,
        category: newQuestion.category,
        difficulty: newQuestion.difficulty,
        projectContextUsed: 'Fresh AI Alternative',
        reasonForAdaptation: 'Interviewer regenerated question with Gemini',
        expectedAnswer: newQuestion.expectedAnswer,
        evaluationPoints: newQuestion.evaluationPoints,
        commonMistakes: newQuestion.commonMistakes,
        redFlags: newQuestion.redFlags,
        followUpQuestions: newQuestion.followUpQuestions,
        suggestedTimeMinutes: newQuestion.suggestedTimeMinutes,
        evaluationRubric: newQuestion.evaluationRubric,
        competency: newQuestion.category,
        isCustomEdited: false,
      };

      await addQuestionAlternative(question.id, alternative);
      setIsRegenerateModalOpen(false);
    } catch (err: any) {
      console.error('Failed to regenerate single question:', err);
      setRegenError(err?.message || 'Failed to regenerate question.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleConfirmCustomReplace = async () => {
    if (!session || !question || !customQuestionInput.trim()) return;

    setIsGeneratingCustom(true);
    setCustomReplaceError(null);

    try {
      const customAlt = await generateCustomQuestion(
        {
          sessionId: session.id,
          originalQuestion: question,
          customPrompt: customQuestionInput.trim(),
          candidateName: session.candidateName,
          jobPosition: session.jobPosition,
          totalExperience: session.totalExperience,
          difficulty: session.difficulty,
        },
        true
      );

      await addQuestionAlternative(question.id, customAlt);
      setIsCustomReplaceModalOpen(false);
      setCustomQuestionInput('');
    } catch (err: any) {
      console.error('Failed to replace with custom question:', err);
      setCustomReplaceError(err?.message || 'Failed to generate custom question.');
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleRegenerateUpcoming = async () => {
    const textToAdapt = notesInput.trim();
    if (!textToAdapt) {
      setAdaptValidationNotice("Please type in the candidate's self-introduction details or key expertise areas (e.g., 5 yrs Java, microservices, Kafka, Spring Boot, Online shopping application) into the notes first.");
      setTimeout(() => setAdaptValidationNotice(null), 6000);
      return;
    }

    try {
      setAdaptSuccessNotice(null);
      setAdaptValidationNotice(null);
      await addCandidateContext(textToAdapt);
      await adaptUpcomingQuestions();
      setAdaptSuccessNotice('Upcoming questions (Q2 onwards) regenerated! You now have both the Original and Newly Generated questions as options in the left tab.');
      setTimeout(() => setAdaptSuccessNotice(null), 8000);
    } catch (e: any) {
      console.error('Failed to adapt upcoming questions:', e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-[10%] pt-[80px] pb-16 space-y-6">
      {/* 1. Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center">
            Question #{question.number} of {questions.length}
          </Badge>
          <Badge variant="secondary" className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center">
            {question.category}
          </Badge>
          <Badge
            variant={
              activeDifficulty.toLowerCase() === 'hard'
                ? 'destructive'
                : activeDifficulty.toLowerCase() === 'medium'
                  ? 'warning'
                  : 'success'
            }
            className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center capitalize"
          >
            {activeDifficulty}
          </Badge>

          {/* AI Contextual / Custom Version Switcher (Clean Pill Toggle) */}
          {alternatives.length > 0 && activeAlt && (
            <div className="h-8 inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-zinc-900 border border-stone-200/80 dark:border-white/20 ml-1 gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => selectQuestionVersion(question.id, 'original')}
                className={`h-7 px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center transition-all cursor-pointer ${selectedVersionId === 'original'
                  ? 'bg-white text-stone-950 shadow-xs border border-stone-300 font-bold dark:bg-zinc-800 dark:text-white dark:border-white/40'
                  : 'text-stone-600 hover:text-stone-950 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                title="Switch back to original question"
              >
                Original Question
              </button>
              <button
                type="button"
                onClick={() => selectQuestionVersion(question.id, activeAlt.id)}
                className={`h-7 px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${selectedVersionId === activeAlt.id
                  ? 'bg-amber-500/20 text-amber-950 border border-amber-400 shadow-xs font-bold dark:bg-zinc-800 dark:text-white dark:border-white/40'
                  : 'text-stone-600 hover:text-stone-950 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                title={activeAlt.isCustomEdited ? 'Switch to custom replacement question' : 'Switch to newly generated question'}
              >
                {activeAlt.isCustomEdited ? (
                  <>
                    <Edit3 className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
                    <span>Custom Question</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
                    <span>Newly Generated</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Target & Max Score Chip with matching h-8 height */}
          <div className="h-8 px-3 rounded-lg border border-stone-200/80 dark:border-white/20 bg-stone-50/80 dark:bg-zinc-900 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
            <span>Target: {question.suggestedTimeMinutes}m</span>
            <span className="opacity-40">•</span>
            <span>Max {maxScore} pts</span>
          </div>

          {/* Replace with Custom Question Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCustomReplaceModal}
            disabled={isGeneratingCustom || isRegenerating}
            className="h-8 px-4 min-w-[105px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 rounded-lg border-amber-300/80 bg-white hover:bg-amber-50/70 text-stone-800 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm"
            title={`Replace Question #${question.number} with your own custom question`}
          >
            <Edit3 className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
            <span>Replace</span>
          </Button>

          {question.number !== 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenRegenerateModal}
              disabled={isRegenerating || isGeneratingCustom}
              className="h-8 px-4 min-w-[105px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 rounded-lg border-amber-300/80 bg-white hover:bg-amber-50/70 text-stone-800 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm"
              title={`Regenerate Question #${question.number} with a fresh alternative`}
            >
              <RotateCw className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
              <span>Regenerate</span>
            </Button>
          )}
        </div>
      </div>

      {regenError && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          {regenError}
        </div>
      )}

      {/* 2. THE QUESTION IS THE MAIN HEADING */}
      <div className="space-y-2">
        {isContextualActive && activeAlt && (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            {activeAlt.isCustomEdited ? (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                <span>Custom Replacement Question (Interviewer Question)</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Contextual Question (Tailored to Candidate's Experience)</span>
              </>
            )}
          </div>
        )}
        <h1 className="text-base sm:text-lg lg:text-xl font-semibold tracking-tight text-foreground leading-relaxed select-text">
          {activePrompt}
        </h1>
        <p className="text-xs text-muted-foreground font-mono">
          Topic: {question.topic}
        </p>
      </div>

      {/* 3. TWO-COLUMN RESPONSIVE WORKSPACE: Left = Answer & Key Points, Right = Notes & Scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Reference Guide (Expected Answer + Key Points + Red Flags) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Expected Answer Card */}
          <div className="rounded-xl border border-amber-200/70 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="px-5 py-3 border-b border-amber-200/60 bg-amber-50/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                <span>Expected Answer & Technical Architecture</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-300/40 font-semibold">
                Reference Guide
              </span>
            </div>
            <div className="p-5 text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line select-text">
              <p>{activeExpectedAnswer}</p>
              {activeRubric && (
                <div className="mt-3.5 p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-stone-900">
                  <strong className="text-foreground">Scoring Rubric: </strong>
                  {activeRubric}
                </div>
              )}
            </div>
          </div>

          {/* Key Evaluation Points to Look For */}
          <div className="rounded-xl border border-amber-200/70 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="px-5 py-3 border-b border-amber-200/60 bg-amber-50/40 flex items-center gap-2 text-sm font-bold text-foreground">
              <Layers className="h-4 w-4 text-amber-600" />
              <span>Key Points to Look For</span>
            </div>
            <div className="p-5 space-y-2">
              <ul className="space-y-2">
                {activeEvaluationPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-900">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pitfalls & Red Flags */}
          {((activeRedFlags && activeRedFlags.length > 0) || (activeCommonMistakes && activeCommonMistakes.length > 0)) && (
            <div className="rounded-xl border border-stone-200/90 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-5 py-3 border-b border-stone-200/80 bg-stone-50/90 flex items-center gap-2 text-sm font-bold text-stone-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Common Mistakes & Red Flags</span>
              </div>
              <div className="p-5 space-y-4">
                {activeCommonMistakes && activeCommonMistakes.length > 0 && (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100/90 border border-amber-300 text-amber-950 font-bold text-xs">
                      <span>Frequent Mistakes:</span>
                    </div>
                    <ul className="space-y-2 pl-1">
                      {activeCommonMistakes.map((m, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-900 leading-relaxed font-normal">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeRedFlags && activeRedFlags.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-stone-100">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-100/90 border border-rose-300 text-rose-950 font-bold text-xs">
                      <span>Critical Red Flags:</span>
                    </div>
                    <ul className="space-y-2 pl-1">
                      {activeRedFlags.map((rf, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-900 leading-relaxed font-normal">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
                          <span>{rf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Follow-up Probing Questions */}
          {activeFollowUps && activeFollowUps.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/30 space-y-2.5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                <span>Probing Follow-Up Questions (Deep Dives)</span>
              </div>
              <div className="space-y-2">
                {activeFollowUps.map((fq, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white border border-amber-200/60 text-xs sm:text-sm text-stone-900 flex items-start gap-2 shadow-xs hover:shadow-sm transition-shadow duration-200"
                  >
                    <span className="font-mono text-amber-700 font-bold shrink-0">{i + 1}.</span>
                    <span className="leading-relaxed">{fq}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Notes & Evaluation */}
        <div className="lg:col-span-5 space-y-5">
          {/* Notes to Take Card */}
          <div className="rounded-xl border border-amber-200/70 bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-foreground">Interviewer Observation Notes</h3>
              </div>
              {isSavedIndicator ? (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-fade-in">
                  <Check className="h-3 w-3" />
                  <span>Autosaved</span>
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Auto-saves locally
                </span>
              )}
            </div>

            <Textarea
              value={notesInput}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Record candidate's explanation, architecture mentioned, technical depth, strengths, or gaps..."
              rows={8}
              className="text-xs sm:text-sm leading-relaxed resize-y min-h-[160px] bg-stone-50/60 border-amber-200/60 focus:bg-white"
            />

            {/* Candidate Key Areas & Adaptation Trigger (Question 1 Specific) */}
            {question.number === 1 && (
              <div className="pt-3 border-t border-amber-200/70 space-y-2.5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-400/10 to-yellow-500/10 border border-amber-300/80 space-y-1">
                  <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Candidate Self-Intro & Key Expertise Areas</span>
                  </span>
                  <p className="text-[11px] text-stone-700 leading-relaxed">
                    Type candidate details above (e.g. <em>5 year java experience, microservices, Kafka, Spring boot, Payment system, Online shopping application</em>). When done, click below to re-generate Q2 onwards tailored to these projects as an "or" option.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleRegenerateUpcoming}
                  disabled={isAdaptingQuestions}
                  isLoading={isAdaptingQuestions}
                  className="w-full h-9 text-xs font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 shadow-xs hover:from-amber-600 hover:to-yellow-600"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {isAdaptingQuestions
                      ? 'Re-generating Upcoming Questions...'
                      : 'Re-generate Upcoming Questions (Match Candidate Background)'}
                  </span>
                </Button>

                {adaptValidationNotice && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2 shadow-2xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                      {adaptValidationNotice}
                    </p>
                  </div>
                )}

                {adaptSuccessNotice && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-start gap-2 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-emerald-900 font-medium">
                      {adaptSuccessNotice}
                    </p>
                  </div>
                )}

                {adaptError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs">
                    {adaptError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evaluation Rating & Marks Card */}
          <div className="rounded-xl border border-amber-200/70 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Score Response
              </label>
              <span className="text-xs font-mono font-bold text-foreground">
                {currentEval?.score !== undefined ? currentEval.score : customScoreInput} / {maxScore} pts
              </span>
            </div>

            {/* Quick Action Rating Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleEvaluationClick('correct')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-sm ${currentStatus === 'correct'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800'
                  : 'bg-stone-50/80 border-border/60 hover:border-emerald-500/40 text-muted-foreground hover:text-foreground'
                  }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Correct ({maxScore} pts)</span>
              </button>

              <button
                type="button"
                onClick={() => handleEvaluationClick('partially_correct')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-sm ${currentStatus === 'partially_correct'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-900'
                  : 'bg-stone-50/80 border-border/60 hover:border-amber-400 text-muted-foreground hover:text-foreground'
                  }`}
              >
                <MinusCircle className="h-4 w-4 text-amber-600" />
                <span>Partial ({halfScore} pts)</span>
              </button>

              <button
                type="button"
                onClick={() => handleEvaluationClick('incorrect')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-sm ${currentStatus === 'incorrect'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-800'
                  : 'bg-stone-50/80 border-border/60 hover:border-rose-400 text-muted-foreground hover:text-foreground'
                  }`}
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Incorrect (0 pts)</span>
              </button>

              <button
                type="button"
                onClick={() => handleEvaluationClick('skipped')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-sm ${currentStatus === 'skipped'
                  ? 'bg-stone-200 border-stone-400 text-stone-800'
                  : 'bg-stone-50/80 border-border/60 hover:border-stone-400 text-muted-foreground hover:text-foreground'
                  }`}
              >
                <SkipForward className="h-4 w-4 text-stone-600" />
                <span>Skip (Exclude)</span>
              </button>
            </div>

            {/* Score adjustment slider */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>Awarded Points:</span>
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
                className="w-full h-1.5 bg-amber-100/70 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Question Controls & Navigation */}
          <div className="rounded-xl border border-amber-200/70 bg-white p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Time:</span>
              <span className="font-bold text-foreground">{formatDuration(questionElapsedSeconds)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="h-8 px-4 min-w-[85px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={nextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="h-8 px-4 min-w-[85px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Regenerate Question Confirmation Modal */}
      <Modal
        isOpen={isRegenerateModalOpen}
        onClose={() => !isRegenerating && setIsRegenerateModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800">
              <RotateCw className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Regenerate Question #{question.number}
              </h3>
              <p className="text-xs text-muted-foreground">
                Replace with a fresh alternative technical question
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
            Do you want to regenerate <strong>Question #{question.number}</strong> with a fresh alternative?
          </p>

          <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="font-semibold text-amber-900">{question.category}</span>
              <span className="font-mono text-[11px] text-stone-500">Topic: {question.topic}</span>
            </div>
            <p className="text-xs text-stone-900 font-medium line-clamp-2">
              "{question.title}"
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            A new practical technical question matching this topic and target difficulty ({session?.difficulty || 'medium'}) will be generated. Your original question will be safely preserved, allowing you to switch back at any time with one click.
          </p>

          {regenError && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 text-xs">
              {regenError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegenerateModalOpen(false)}
              disabled={isRegenerating}
              className="h-8 px-4 min-w-[85px] text-xs font-semibold rounded-lg border-stone-300 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirmRegenerateQuestion}
              disabled={isRegenerating}
              isLoading={isRegenerating}
              className="h-8 px-4 min-w-[125px] text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 hover:from-amber-600 hover:to-yellow-600 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 rounded-lg"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Yes, Regenerate Question</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Replace Question with Custom Question Modal */}
      <Modal
        isOpen={isCustomReplaceModalOpen}
        onClose={() => !isGeneratingCustom && setIsCustomReplaceModalOpen(false)}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800 dark:bg-white/10 dark:border-white/30 dark:text-white">
              <Edit3 className="h-4 w-4 text-amber-600 dark:text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Replace Question #{question.number} with Custom Question
              </h3>
              <p className="text-xs text-muted-foreground">
                Input your replacement question; AI will formulate the answers and key points
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            Enter your custom question or problem statement below. Google Gemini will automatically generate the comprehensive model answer, scoring rubric, and key check points to evaluate the candidate on.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Interviewer Question / Prompt</span>
              <span className="text-[11px] text-muted-foreground font-normal">Category: {question.category}</span>
            </label>
            <Textarea
              value={customQuestionInput}
              onChange={(e) => setCustomQuestionInput(e.target.value)}
              placeholder="e.g. How does Kafka consumer group rebalance work under eager vs cooperative sticky protocols, and how do you minimize partition revocation lag?"
              rows={5}
              disabled={isGeneratingCustom}
              className="text-xs sm:text-sm leading-relaxed resize-y min-h-[120px] bg-background border-border focus:border-primary"
            />
          </div>

          <div className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 dark:border-white/20 dark:bg-zinc-900/60 text-xs space-y-1">
            <div className="font-semibold text-amber-900 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
              <span>Non-Destructive Question Switcher</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Your original question will be safely preserved. You can switch back and forth between the original and this custom replacement question at any time.
            </p>
          </div>

          {customReplaceError && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
              {customReplaceError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCustomReplaceModalOpen(false)}
              disabled={isGeneratingCustom}
              className="h-8 px-4 min-w-[85px] text-xs font-semibold rounded-lg border-stone-300 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirmCustomReplace}
              disabled={isGeneratingCustom || !customQuestionInput.trim()}
              isLoading={isGeneratingCustom}
              className="h-8 px-4 min-w-[125px] text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 hover:from-amber-600 hover:to-yellow-600 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 rounded-lg"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate & Replace Question</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
