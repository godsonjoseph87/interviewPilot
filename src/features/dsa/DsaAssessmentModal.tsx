import React, { useState } from 'react';
import {
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Sliders,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { DSA_LANGUAGES } from '@/lib/constants';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { evaluateDsaSubmission } from '@/services/ai';
import type { DsaProblem, DsaSubmission } from '@/types';

interface DsaAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProblemIndex?: number;
}

export function DsaAssessmentModal({
  isOpen,
  onClose,
  selectedProblemIndex = 0,
}: DsaAssessmentModalProps) {
  const { dsaProblems, dsaSubmissions, submitDsaCode, updateDsaInterviewerScore, session } =
    useInterviewSessionStore();

  const [activeTab, setActiveTab] = useState<number>(selectedProblemIndex);
  const currentProblem: DsaProblem | undefined = dsaProblems[activeTab] || dsaProblems[0];

  const existingSub: DsaSubmission | undefined = currentProblem
    ? dsaSubmissions[currentProblem.id]
    : undefined;

  const defaultLang = session?.dsaLanguage || 'java';
  const defaultTemplate =
    DSA_LANGUAGES.find((l) => l.id === defaultLang)?.template || '// Write solution here\n';

  const [selectedLang, setSelectedLang] = useState<string>(existingSub?.language || defaultLang);
  const [candidateCode, setCandidateCode] = useState<string>(existingSub?.code || defaultTemplate);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Score override state
  const [adjustedScoreInput, setAdjustedScoreInput] = useState<number>(
    existingSub?.review?.interviewerAdjustedScore ?? existingSub?.review?.overallScore100 ?? 85
  );
  const [interviewerNotes, setInterviewerNotes] = useState<string>(
    existingSub?.review?.interviewerNotes || ''
  );
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Sync state when switching problems
  const handleSelectProblem = (idx: number) => {
    setActiveTab(idx);
    const prob = dsaProblems[idx];
    if (prob) {
      const sub = dsaSubmissions[prob.id];
      if (sub) {
        setSelectedLang(sub.language);
        setCandidateCode(sub.code);
        setAdjustedScoreInput(sub.review?.interviewerAdjustedScore ?? sub.review?.overallScore100 ?? 80);
        setInterviewerNotes(sub.review?.interviewerNotes || '');
      } else {
        setSelectedLang(defaultLang);
        setCandidateCode(defaultTemplate);
      }
    }
  };

  const handleResetCode = () => {
    const langObj = DSA_LANGUAGES.find((l) => l.id === selectedLang);
    setCandidateCode(langObj?.template || '');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(candidateCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEvaluate = async () => {
    if (!currentProblem) return;
    if (!candidateCode.trim() || candidateCode.length < 15) {
      alert('Please paste or write the candidate code before submitting for evaluation.');
      return;
    }

    setIsEvaluating(true);
    setEvalError(null);

    try {
      const review = await evaluateDsaSubmission(
        {
          problem: currentProblem,
          language: selectedLang,
          code: candidateCode,
        },
        true // allow mock fallback if no API key
      );

      await submitDsaCode(currentProblem.id, selectedLang, candidateCode, review);
      setAdjustedScoreInput(review.interviewerAdjustedScore);
    } catch (err: any) {
      console.error('DSA evaluation error:', err);
      setEvalError(err?.message || 'Failed to evaluate code with AI.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveScoreOverride = async () => {
    if (!currentProblem || !existingSub?.review) return;
    await updateDsaInterviewerScore(currentProblem.id, adjustedScoreInput, interviewerNotes);
    alert('Interviewer score adjustment saved.');
  };

  if (!currentProblem) {
    return null;
  }

  const review = existingSub?.review;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="full"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary-subtle text-primary border border-primary/20">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-foreground">Data Structures & Algorithms Assessment</span>
            <span className="text-xs text-muted-foreground block font-normal">
              Problem {activeTab + 1} of {dsaProblems.length}: {currentProblem.title}
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Problem Tabs */}
        {dsaProblems.length > 1 && (
          <div className="flex items-center gap-2 border-b border-border pb-3">
            {dsaProblems.map((prob, idx) => {
              const hasSub = !!dsaSubmissions[prob.id]?.review;
              const isSelected = activeTab === idx;
              return (
                <button
                  key={prob.id}
                  onClick={() => handleSelectProblem(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-primary-subtle text-primary border border-primary/30 shadow-xs'
                      : 'text-muted-foreground hover:bg-muted border border-transparent'
                  }`}
                >
                  <span>Problem {idx + 1}: {prob.title}</span>
                  {hasSub ? (
                    <span className="h-2 w-2 rounded-full bg-success" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 2-Column Layout: Left = Problem Statement & Expected Approach; Right = Code Submission & AI Review */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Problem Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Problem Card */}
            <div className="p-4 rounded-lg border border-border bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <Badge variant="default">Problem #{currentProblem.number}</Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>Suggested: {currentProblem.suggestedTimeMinutes} mins</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  {currentProblem.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">
                  {currentProblem.description}
                </p>
              </div>

              {/* Constraints */}
              {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Constraints:
                  </span>
                  <ul className="list-disc list-inside text-xs text-muted-foreground font-mono space-y-0.5">
                    {currentProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample IO */}
              {currentProblem.sampleInputs && currentProblem.sampleInputs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border text-xs">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Sample Test Cases:
                  </span>
                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border font-mono space-y-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Input: </span>
                      <span className="text-primary font-semibold">{currentProblem.sampleInputs[0]}</span>
                    </div>
                    {currentProblem.sampleOutputs && currentProblem.sampleOutputs[0] && (
                      <div>
                        <span className="text-muted-foreground">Output: </span>
                        <span className="text-success font-semibold">{currentProblem.sampleOutputs[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Expected Approach & Complexity Reference (Interviewer Reference) */}
            <div className="p-4 rounded-lg border border-primary/20 bg-primary-subtle space-y-2.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Interviewer Reference: Expected Optimal Solution</span>
              </div>

              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Optimal Approach: </strong>
                  {currentProblem.expectedApproach}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="text-xs text-muted-foreground block">Time Complexity</span>
                    <span className="text-primary font-bold">{currentProblem.expectedTimeComplexity}</span>
                  </div>
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="text-xs text-muted-foreground block">Space Complexity</span>
                    <span className="text-primary font-bold">{currentProblem.expectedSpaceComplexity}</span>
                  </div>
                </div>

                {currentProblem.edgeCases && currentProblem.edgeCases.length > 0 && (
                  <div className="pt-1">
                    <strong className="text-foreground text-xs block mb-1">Critical Edge Cases:</strong>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                      {currentProblem.edgeCases.map((ec, i) => (
                        <li key={i}>{ec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & AI Review Results (7 cols) */}
          <div className="lg:col-span-7 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Code Input Card */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground">Language:</span>
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="h-8 rounded-md border border-input bg-card px-2 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {DSA_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title="Copy code"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCode}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title="Reset template"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Interactive Code Editor with Syntax Highlighting & Line Numbers */}
              <div className="p-0 border-b border-border">
                <CodeEditor
                  value={candidateCode}
                  onChange={(val) => setCandidateCode(val)}
                  language={selectedLang}
                  fileName={`Solution.${selectedLang === 'python' ? 'py' : selectedLang === 'cpp' ? 'cpp' : selectedLang === 'javascript' ? 'js' : 'java'}`}
                  readOnly={false}
                  allowEditToggle={false}
                  minHeight="320px"
                  maxHeight="500px"
                />
              </div>

              {/* Submit Review CTA */}
              <div className="flex items-center justify-between p-3 bg-surface">
                <span className="text-xs text-muted-foreground">
                  Static analysis reviews correctness, complexities, edge cases & code quality.
                </span>
                <Button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  isLoading={isEvaluating}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2 text-xs font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Submit for AI Review</span>
                </Button>
              </div>
            </div>

            {/* Evaluation Error */}
            {evalError && (
              <div className="p-3 rounded-lg border border-danger-border bg-danger-subtle text-danger text-xs">
                {evalError}
              </div>
            )}

            {/* AI Review Results Panel (Displays after evaluation) */}
            {review && (
              <div className="p-5 rounded-lg border border-border bg-card space-y-5 shadow-xs animate-fade-in">
                {/* Score Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        AI Code Review Verdict
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-subtle text-primary border border-primary/30 font-bold font-mono">
                        AI Score: {review.overallScore100} / 100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {review.interviewerSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">Adjusted Score:</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={adjustedScoreInput}
                      onChange={(e) => setAdjustedScoreInput(Number(e.target.value))}
                      className="w-16 h-8 text-xs font-mono font-bold text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveScoreOverride}
                      className="h-8 text-xs"
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {/* Rubric Breakdown Grid (6 dimensions) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-xs">Correctness (35%)</span>
                      <span className="font-bold text-foreground font-mono">{review.logicalCorrectnessScore} / 35</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${(review.logicalCorrectnessScore / 35) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-xs">Algorithm (20%)</span>
                      <span className="font-bold text-foreground font-mono">{review.algorithmSelectionScore} / 20</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(review.algorithmSelectionScore / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-xs">Time Comp (15%)</span>
                      <span className="font-bold text-foreground font-mono">{review.timeComplexityScore} / 15</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-info rounded-full"
                        style={{ width: `${(review.timeComplexityScore / 15) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-xs">Space Comp (10%)</span>
                      <span className="font-bold text-foreground font-mono">{review.spaceComplexityScore} / 10</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(review.spaceComplexityScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-xs">Edge Cases (10%)</span>
                      <span className="font-bold text-foreground font-mono">{review.edgeCaseHandlingScore} / 10</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${(review.edgeCaseHandlingScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground text-xs">Code Quality (10%)</span>
                      <span className="font-bold text-foreground font-mono">{review.codeQualityScore} / 10</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(review.codeQualityScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis Text */}
                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <h5 className="font-bold text-foreground mb-1">Detailed Static Evaluation:</h5>
                    <p className="text-muted-foreground bg-surface-raised p-2.5 rounded-md border border-border">
                      {review.detailedEvaluation}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-foreground mb-1">Complexity Analysis:</h5>
                    <p className="text-muted-foreground font-mono text-xs bg-surface-raised p-2.5 rounded-md border border-border">
                      {review.complexityAnalysis}
                    </p>
                  </div>

                  {review.potentialLogicalErrors && review.potentialLogicalErrors.length > 0 && (
                    <div>
                      <h5 className="font-bold text-danger mb-1">Potential Logical Bugs (Static Analysis):</h5>
                      <ul className="list-disc list-inside text-danger text-xs bg-danger-subtle p-2.5 rounded-md border border-danger-border space-y-1">
                        {review.potentialLogicalErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.missingEdgeCases && review.missingEdgeCases.length > 0 && (
                    <div>
                      <h5 className="font-bold text-warning mb-1">Missing Edge Cases:</h5>
                      <ul className="list-disc list-inside text-warning text-xs bg-warning-subtle p-2.5 rounded-md border border-warning-border space-y-1">
                        {review.missingEdgeCases.map((ec, i) => (
                          <li key={i}>{ec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.improvementSuggestions && review.improvementSuggestions.length > 0 && (
                    <div>
                      <h5 className="font-bold text-info mb-1">Improvement Suggestions:</h5>
                      <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                        {review.improvementSuggestions.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interviewer Notes for this problem */}
                  <div className="pt-2">
                    <label className="block font-bold text-foreground mb-1">
                      Interviewer Comments for Problem {activeTab + 1}:
                    </label>
                    <Textarea
                      value={interviewerNotes}
                      onChange={(e) => setInterviewerNotes(e.target.value)}
                      placeholder="Candidate demonstrated good linked list pointer manipulation; struggled initially with TTL expiration logic..."
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} size="sm">
            Close Assessment View
          </Button>

          <div className="flex items-center gap-2">
            {activeTab < dsaProblems.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSelectProblem(activeTab + 1)}
                className="flex items-center gap-1.5"
              >
                <span>Proceed to Problem {activeTab + 2}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Done Reviewing DSA</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

