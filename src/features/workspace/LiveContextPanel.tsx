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
  History,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Kbd } from '@/components/ui/Kbd';
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
      <div className="p-5 rounded-lg border border-border bg-card card-surface space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-accent-2-subtle border border-accent-2-border text-accent-2 flex items-center justify-center font-semibold shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-small font-semibold text-foreground flex items-center gap-2">
                <span>Live Candidate Context</span>
                <Badge variant="ai" className="text-caption font-mono">
                  Adaptive AI
                </Badge>
              </h3>
              <p className="text-caption text-muted-foreground">
                Capture the candidate's real-world systems, tech stack, and architectures to adapt upcoming questions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {contextHistory.length} context {contextHistory.length === 1 ? 'note' : 'notes'}
            </Badge>
            {totalAltsCount > 0 && (
              <Badge variant="success" className="font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{totalAltsCount} alternatives ready</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2 pt-1">
          <label className="text-caption font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Add Candidate Explanation / Project Disclosures:</span>
            <span className="text-caption text-muted-foreground font-normal">
              Press <Kbd>Ctrl+Enter</Kbd> to save
            </span>
          </label>

          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Worked on an online shopping application with Spring Boot microservices, Kafka for order messaging, MySQL for inventory, and Hibernate for persistence. Handled flash-sale concurrency..."
            className="min-h-[90px]"
          />

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleAddContext()}
                disabled={!inputText.trim()}
                leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
              >
                Add Context
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputText('')}
                disabled={!inputText.trim()}
                leftIcon={<RotateCcw className="h-3 w-3" />}
              >
                Clear Input
              </Button>
            </div>

            {/* Adapt Action Button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => adaptUpcomingQuestions()}
              disabled={isAdaptingQuestions || contextHistory.length === 0 || upcomingCount === 0}
              isLoading={isAdaptingQuestions}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            >
              {isAdaptingQuestions
                ? 'Analyzing & Adapting Questions...'
                : `Adapt Upcoming Questions (${upcomingCount})`}
            </Button>
          </div>

          {adaptError && (
            <div className="p-3 rounded-md border border-danger-border bg-danger-subtle text-danger-foreground text-caption flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{adaptError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Consolidated Project Summary */}
      {consolidatedContext && (
        <div className="p-5 rounded-lg border border-border bg-card space-y-4 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h4 className="text-small font-semibold text-foreground">
                Consolidated Candidate Architecture & Context
              </h4>
            </div>
            <Badge variant="secondary" className="font-mono text-caption">
              Domain: {consolidatedContext.domain}
            </Badge>
          </div>

          {/* Extracted Entities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-caption">
            {/* Technologies Used */}
            <div className="p-3 rounded-md bg-surface-raised border border-border space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-caption">
                <Cpu className="h-3.5 w-3.5 text-info" />
                <span>Identified Technologies & Frameworks</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.technologies.length > 0 ? (
                  consolidatedContext.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-info-subtle text-info-foreground border border-info-border font-medium"
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
            <div className="p-3 rounded-md bg-surface-raised border border-border space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-caption">
                <GitBranch className="h-3.5 w-3.5 text-primary" />
                <span>Architectural Patterns</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.architecture.length > 0 ? (
                  consolidatedContext.architecture.map((arch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary-border font-medium"
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
            <div className="p-3 rounded-md bg-surface-raised border border-border space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-caption">
                <Radio className="h-3.5 w-3.5 text-success" />
                <span>Communication & Workflows</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.communication.length > 0 ? (
                  consolidatedContext.communication.map((comm, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-success-subtle text-success-foreground border border-success-border font-medium"
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
            <div className="p-3 rounded-md bg-surface-raised border border-border space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-caption">
                <Zap className="h-3.5 w-3.5 text-warning" />
                <span>Business Capabilities</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {consolidatedContext.businessCapabilities.length > 0 ? (
                  consolidatedContext.businessCapabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-warning-subtle text-warning-foreground border border-warning-border font-medium"
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

          {/* AI-Inferred Scenarios & Clarifications */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInferredDetails(!showInferredDetails)}
              className="text-caption font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 uppercase tracking-wider transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              <span>AI-Inferred Scenarios & Clarification Probes</span>
              <span className="text-caption text-subtle-foreground font-normal">
                ({showInferredDetails ? 'Hide' : 'Show'})
              </span>
            </button>

            {showInferredDetails && (
              <div className="p-4 rounded-md border border-border bg-surface-raised space-y-3 text-caption animate-fade-in">
                <div className="text-caption text-muted-foreground font-mono flex items-center gap-1.5">
                  <span>ℹ Note: These scenarios are AI-inferred possibilities for technical probing, not verified candidate claims.</span>
                </div>

                {consolidatedContext.potentialScenarios.length > 0 && (
                  <div>
                    <span className="font-semibold text-foreground block mb-1">
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
                    <span className="font-semibold text-foreground block mb-1">
                      Recommended Clarification Probes (Verify Depth):
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
      <div className="p-5 rounded-lg border border-border bg-card space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h4 className="text-small font-semibold text-foreground">
              Candidate Context History ({contextHistory.length})
            </h4>
          </div>

          {contextHistory.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearHistory}
              leftIcon={<Trash2 className="h-3 w-3 text-danger" />}
              className="text-danger-foreground hover:bg-danger-subtle"
            >
              Clear History
            </Button>
          )}
        </div>

        {contextHistory.length === 0 ? (
          <div className="py-6 text-center text-caption text-muted-foreground">
            No context notes recorded yet. Add disclosures as the candidate speaks about their past systems.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {contextHistory.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-3 rounded-md bg-surface-raised border border-border text-caption space-y-1"
              >
                <div className="flex items-center justify-between text-caption text-muted-foreground font-mono">
                  <span className="font-semibold text-primary">Entry #{idx + 1}</span>
                  <span className="tabular-nums">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-foreground leading-relaxed select-text font-sans">
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
        title="Clear Context History"
        description="Are you sure you want to clear all candidate context notes? Previously generated question alternatives will remain available."
      >
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsClearModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirmClearHistory}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Clear History
          </Button>
        </div>
      </Modal>
    </div>
  );
}
