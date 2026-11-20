import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ShieldAlert,
  Database,
  Gauge,
  Wrench,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import type { CopilotProbe, CopilotCategory } from '@/types';

interface CopilotProbesWidgetProps {
  onAppendToNotes?: (text: string) => void;
}

export function CopilotProbesWidget({ onAppendToNotes }: CopilotProbesWidgetProps) {
  const {
    copilotProbes,
    isGeneratingCopilotProbes,
    copilotError,
    contextHistory,
    generateCopilotProbesForText,
    clearCopilotProbes,
    currentQuestionIndex,
    questions,
  } = useInterviewSessionStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateFresh = () => {
    if (contextHistory.length === 0) {
      alert('Please enter candidate context or explanations first.');
      return;
    }
    const latestText = contextHistory.slice(-2).map((c) => c.text).join('. ');
    generateCopilotProbesForText(latestText);
  };

  const getCategoryIcon = (cat: CopilotCategory) => {
    switch (cat) {
      case 'Reliability':
        return <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />;
      case 'Data Consistency':
        return <Database className="h-3.5 w-3.5 text-primary" />;
      case 'Performance':
        return <Gauge className="h-3.5 w-3.5 text-violet-400" />;
      case 'Practical Implementation':
        return <Wrench className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <Compass className="h-3.5 w-3.5 text-primary" />;
    }
  };

  const getCategoryBadgeClass = (cat: CopilotCategory) => {
    switch (cat) {
      case 'Reliability':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Data Consistency':
        return 'bg-primary/15 text-primary border-primary/30';
      case 'Performance':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'Practical Implementation':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="p-5 rounded-2xl border border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>AI Interviewer Copilot</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-300/60 text-amber-900 font-semibold">
                Suggested Probes
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Deep-dive technical follow-ups generated in real time based on what the candidate just explained.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateFresh}
            disabled={isGeneratingCopilotProbes || contextHistory.length === 0}
            isLoading={isGeneratingCopilotProbes}
            className="h-7 text-xs flex items-center gap-1.5 hover:border-violet-500/40"
          >
            <RefreshCw className="h-3 w-3 text-violet-400" />
            <span>Refresh Probes</span>
          </Button>

          {copilotProbes.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => clearCopilotProbes()}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-400"
              title="Clear probes"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {copilotError && (
        <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
          {copilotError}
        </div>
      )}

      {copilotProbes.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add candidate explanations in the Live Context tab to automatically generate deep-dive probing questions across Reliability, Consistency, Performance, and Implementation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {copilotProbes.map((probe) => (
            <div
              key={probe.id}
              className="p-3.5 rounded-xl border border-border/80 bg-secondary/30 hover:bg-secondary/50 transition-all space-y-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                      probe.category
                    )}`}
                  >
                    {getCategoryIcon(probe.category)}
                    <span>{probe.category}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(probe.id, probe.probeQuestion)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy probe question"
                    >
                      {copiedId === probe.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {onAppendToNotes && (
                      <button
                        type="button"
                        onClick={() => onAppendToNotes(`[Copilot Probe - ${probe.category}]: ${probe.probeQuestion}`)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Append to interviewer notes"
                      >
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed select-text">
                  "{probe.probeQuestion}"
                </p>
              </div>

              <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-1.5 font-mono">
                <span className="text-muted-foreground font-sans font-bold">Why ask: </span>
                <span>{probe.rationale}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

