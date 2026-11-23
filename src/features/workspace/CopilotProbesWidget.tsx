import React, { useState } from 'react';
import {
  Compass,
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
import type { CopilotCategory } from '@/types';

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
        return <ShieldAlert className="h-3.5 w-3.5 text-warning" />;
      case 'Data Consistency':
        return <Database className="h-3.5 w-3.5 text-primary" />;
      case 'Performance':
        return <Gauge className="h-3.5 w-3.5 text-info" />;
      case 'Practical Implementation':
        return <Wrench className="h-3.5 w-3.5 text-success" />;
      default:
        return <Compass className="h-3.5 w-3.5 text-primary" />;
    }
  };

  const getCategoryBadgeVariant = (cat: CopilotCategory): 'default' | 'secondary' | 'warning' | 'info' | 'success' => {
    switch (cat) {
      case 'Reliability':
        return 'warning';
      case 'Data Consistency':
        return 'default';
      case 'Performance':
        return 'info';
      case 'Practical Implementation':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="p-5 rounded-lg border border-border bg-card card-surface ai-surface space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-accent-2-subtle border border-accent-2-border text-accent-2 flex items-center justify-center font-semibold shrink-0">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-small font-semibold text-foreground flex items-center gap-2">
              <span>AI Interviewer Copilot</span>
              <Badge variant="ai" className="text-caption font-mono">
                Suggested Probes
              </Badge>
            </h3>
            <p className="text-caption text-muted-foreground">
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
            leftIcon={<RefreshCw className="h-3 w-3" />}
          >
            Refresh Probes
          </Button>

          {copilotProbes.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => clearCopilotProbes()}
              className="text-danger-foreground hover:bg-danger-subtle"
              title="Clear probes"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {copilotError && (
        <div className="p-2.5 rounded-md border border-danger-border bg-danger-subtle text-danger-foreground text-caption">
          {copilotError}
        </div>
      )}

      {copilotProbes.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-caption text-muted-foreground max-w-sm mx-auto">
            Add candidate explanations in the Live Context tab to automatically generate deep-dive probing questions across Reliability, Consistency, Performance, and Implementation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {copilotProbes.map((probe) => (
            <div
              key={probe.id}
              className="p-3.5 rounded-md border border-border bg-surface-raised space-y-2.5 flex flex-col justify-between shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant={getCategoryBadgeVariant(probe.category)} className="gap-1 text-caption">
                    {getCategoryIcon(probe.category)}
                    <span>{probe.category}</span>
                  </Badge>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(probe.id, probe.probeQuestion)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                      title="Copy probe question"
                      aria-label="Copy probe question"
                    >
                      {copiedId === probe.id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {onAppendToNotes && (
                      <button
                        type="button"
                        onClick={() => onAppendToNotes(`[Copilot Probe - ${probe.category}]: ${probe.probeQuestion}`)}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-surface transition-colors"
                        title="Append to interviewer notes"
                        aria-label="Append to interviewer notes"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-small font-medium text-foreground leading-relaxed select-text">
                  "{probe.probeQuestion}"
                </p>
              </div>

              <div className="text-caption text-muted-foreground border-t border-border pt-1.5 font-mono">
                <span className="font-sans font-semibold text-foreground">Why ask: </span>
                <span>{probe.rationale}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
