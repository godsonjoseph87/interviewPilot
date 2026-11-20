import React, { useState } from 'react';
import {
  Sparkles,
  PlusCircle,
  RotateCcw,
  Layers,
  Cpu,
  GitBranch,
  Radio,
  AlertCircle,
  HelpCircle,
  History,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';

export function LiveContextPanel() {
  const {
    session,
    questions,
    currentQuestionIndex,
    evaluations,
    contextHistory,
    consolidatedContext,
    isAdaptingQuestions,
    adaptError,
    addCandidateContext,
    clearCandidateContextHistory,
    adaptUpcomingQuestions,
    contextualAlternatives,
  } = useInterviewSessionStore();

  const [inputText, setInputText] = useState('');
  const [showInferredDetails, setShowInferredDetails] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  if (!session) return null;

  // Calculate upcoming questions count
  const upcomingCount = questions.filter((q, idx) => {
    const ev = evaluations[q.id];
    return idx >= currentQuestionIndex && (!ev || ev.status === 'pending');
  }).length;

  const totalAltsCount = Object.values(contextualAlternatives).flat().length;

  const handleAddContext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    await addCandidateContext(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleAddContext();
    }
  };

  const handleClearHistory = () => {
    if (contextHistory.length === 0) return;
    setIsClearModalOpen(true);
  };

  const handleConfirmClearHistory = () => {
    clearCandidateContextHistory();
    setIsClearModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl border border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Live Candidate Context</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-300/60 text-amber-900 font-semibold">
                  Adaptive Intelligence
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Capture the candidate's real-world systems, tech stack, and architectures to adapt upcoming questions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono border-amber-200/70 bg-white">
              {contextHistory.length} context {contextHistory.length === 1 ? 'note' : 'notes'}
            </Badge>
            {totalAltsCount > 0 && (
              <Badge variant="success" className="text-xs font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{totalAltsCount} alternatives ready</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2.5 pt-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Add Candidate Explanation / Project Disclosures:</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Press <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-border text-[10px] font-mono">Ctrl+Enter</kbd> to save
            </span>
          </label>

          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Worked on an online shopping application with Spring Boot microservices, Kafka for order messaging, MySQL for inventory, and Hibernate for persistence. Handled flash-sale concurrency..."
            className="min-h-[90px] text-xs sm:text-sm font-sans resize-y bg-stone-50/50 border-amber-200/60 focus:bg-white"
          />

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleAddContext()}
                disabled={!inputText.trim()}
                className="h-8 text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add Context</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputText('')}
                disabled={!inputText.trim()}
                className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear Input</span>
              </Button>
            </div>

            {/* Adapt Action Button */}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => adaptUpcomingQuestions()}
              disabled={isAdaptingQuestions || contextHistory.length === 0 || upcomingCount === 0}
              isLoading={isAdaptingQuestions}
              className="h-8 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {isAdaptingQuestions
                  ? 'Analyzing & Adapting Questions...'
                  : `Adapt Upcoming Questions (${upcomingCount})`}
              </span>
            </Button>
          </div>

          {adaptError && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{adaptError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Consolidated Project Summary */}
      {consolidatedContext && (
        <div className="p-5 rounded-2xl border border-amber-200/70 bg-white space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" />
              <h4 className="text-sm font-bold text-foreground">
                Consolidated Candidate Architecture & Context
              </h4>
            </div>
            <Badge variant="outline" className="text-xs font-mono text-amber-900 border-amber-300/60 bg-amber-500/10">
              Domain: {consolidatedContext.domain}
            </Badge>
          </div>

          {/* Extracted Entities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Technologies Used */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Cpu className="h-3.5 w-3.5 text-blue-400" />
                <span>Identified Technologies & Frameworks</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.technologies.length > 0 ? (
                  consolidatedContext.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium"
                    >
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">None identified yet</span>
                )}
              </div>
            </div>

            {/* Architecture Patterns */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <GitBranch className="h-3.5 w-3.5 text-violet-400" />
                <span>Architectural Patterns</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.architecture.length > 0 ? (
                  consolidatedContext.architecture.map((arch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30 font-medium"
                    >
                      {arch}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">None identified yet</span>
                )}
              </div>
            </div>

            {/* Communication & Workflows */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                <span>Communication & Workflows</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.communication.length > 0 ? (
                  consolidatedContext.communication.map((comm, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                    >
                      {comm}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">None identified yet</span>
                )}
              </div>
            </div>

            {/* Business Capabilities */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Business Capabilities</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.businessCapabilities.length > 0 ? (
                  consolidatedContext.businessCapabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium"
                    >
                      {cap}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">None identified yet</span>
                )}
              </div>
            </div>
          </div>

          {/* AI-Inferred Scenarios & Clarifications (Strictly distinguished from facts) */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInferredDetails(!showInferredDetails)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 uppercase tracking-wider transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              <span>AI-Inferred Scenarios & Clarification Probes</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                ({showInferredDetails ? 'Hide' : 'Show'})
              </span>
            </button>

            {showInferredDetails && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 text-xs animate-fade-in">
                <div className="text-[11px] text-primary font-mono flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded">
                  <span>ℹ Note: These scenarios are AI-inferred possibilities for technical probing, not verified candidate accomplishments.</span>
                </div>

                {consolidatedContext.potentialScenarios.length > 0 && (
                  <div>
                    <span className="font-bold text-foreground block mb-1">
                      Target High-Value Technical Scenarios:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {consolidatedContext.potentialScenarios.map((sc, i) => (
                        <li key={i}>{sc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {consolidatedContext.clarificationProbes.length > 0 && (
                  <div>
                    <span className="font-bold text-foreground block mb-1">
                      Recommended Clarification Probes (Verify Candidate Depth):
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-foreground/90 font-medium">
                      {consolidatedContext.clarificationProbes.map((pr, i) => (
                        <li key={i}>{pr}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chronological Context History Log */}
      <div className="p-5 rounded-2xl border border-amber-200/70 bg-white space-y-3 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-bold text-foreground">
              Candidate Context History ({contextHistory.length})
            </h4>
          </div>

          {contextHistory.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear History</span>
            </Button>
          )}
        </div>

        {contextHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No context notes recorded yet. Add disclosures as the candidate speaks about their past systems.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {contextHistory.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span className="font-semibold text-primary">Entry #{idx + 1}</span>
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-foreground text-xs leading-relaxed select-text font-sans">
                  "{entry.text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Context History Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-rose-600" />
            <span>Clear Context History</span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
            Are you sure you want to clear all candidate context notes ({contextHistory.length})? Previously generated question alternatives will remain available.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsClearModalOpen(false)}
              className="text-xs px-3.5 border-stone-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmClearHistory}
              className="text-xs px-4 font-bold flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
