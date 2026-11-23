import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  RotateCw,
  Sparkles,
  Send,
  Copy,
  Check,
  Clock,
  Layers,
  FileQuestion,
  AlertTriangle,
  Lightbulb,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { RichMarkdown, cleanAssistantText } from '@/components/common/RichMarkdown';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { regenerateDsaProblem, askInterviewerAssistant, evaluateDsaSubmission } from '@/services/ai';
import { formatDuration } from '@/lib/utils';
import type { DsaProblem } from '@/types';

export function DsaMainPanel() {
  const {
    session,
    dsaProblems,
    currentDsaIndex,
    dsaSubmissions,
    submitDsaCode,
    updateDsaInterviewerScore,
    replaceDsaProblem,
  } = useInterviewSessionStore();

  const problem: DsaProblem | undefined = dsaProblems[currentDsaIndex];
  const submission = problem ? dsaSubmissions[problem.id] : undefined;

  // Local state
  const [candidateCode, setCandidateCode] = useState(submission?.code || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [interviewerScore, setInterviewerScore] = useState<number>(
    submission?.review?.interviewerAdjustedScore ?? submission?.review?.overallScore100 ?? 80
  );

  // Gemini Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `Hello! I am your AI Interviewer Copilot for this problem. Ask me anything about "${problem?.title || 'this problem'}", such as hints to provide, checking candidate approaches, or complexity analysis.`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  // Auto-scroll logic for Gemini Chat Window
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom('smooth');
    const t1 = setTimeout(() => scrollToBottom('smooth'), 50);
    const t2 = setTimeout(() => scrollToBottom('smooth'), 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [chatMessages, isAssistantThinking]);

  if (!problem) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
        No DSA problem selected.
      </div>
    );
  }

  const dsaLanguage = submission?.language || session?.dsaLanguage || 'java';

  // Copy working code to clipboard
  const handleCopyCode = async () => {
    if (problem.workingCode) {
      await navigator.clipboard.writeText(problem.workingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Refresh / Regenerate this specific DSA problem
  const handleRefreshProblem = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const avoidTitles = dsaProblems.map((p) => p.title);
      const fresh = await regenerateDsaProblem(
        {
          existingProblem: problem,
          language: dsaLanguage,
          difficulty: session?.difficulty || 'hard',
          avoidTitles,
        },
        true // allow calibrated fallback if API key missing
      );
      await replaceDsaProblem(problem.id, fresh);
      setCandidateCode('');
      setChatMessages([
        {
          sender: 'assistant',
          text: `Problem refreshed! I am ready to assist you with the new challenge: "${fresh.title}".`,
        },
      ]);
    } catch (err: any) {
      console.error('Failed to refresh DSA problem:', err);
      setRefreshError(err?.message || 'Failed to generate a new DSA problem.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Send message to Gemini Assistant
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim() || isAssistantThinking) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: textToSend.trim() }];
    setChatMessages(newMessages);
    if (!queryText) setChatInput('');
    setIsAssistantThinking(true);
    requestAnimationFrame(() => scrollToBottom('smooth'));

    try {
      const reply = await askInterviewerAssistant(
        {
          problem,
          userQuery: textToSend.trim(),
          chatHistory: chatMessages,
        },
        true // allow mock fallback if API key missing
      );

      const cleanReply = cleanAssistantText(reply);
      setChatMessages([...newMessages, { sender: 'assistant', text: cleanReply }]);
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } catch (err: any) {
      setChatMessages([
        ...newMessages,
        {
          sender: 'assistant',
          text: `Error communicating with Gemini: ${err?.message || 'Please check your network connection and try again.'}`,
        },
      ]);
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } finally {
      setIsAssistantThinking(false);
    }
  };

  // Run AI review on candidate's code submission
  const handleEvaluateCandidateCode = async () => {
    if (!candidateCode.trim()) {
      alert("Please paste or type the candidate's code first.");
      return;
    }
    setIsEvaluating(true);
    try {
      const review = await evaluateDsaSubmission(
        {
          problem,
          language: dsaLanguage,
          code: candidateCode,
        },
        true
      );
      await submitDsaCode(problem.id, dsaLanguage, candidateCode, review);
      setInterviewerScore(review.overallScore100);
    } catch (err: any) {
      alert(`Evaluation failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Header Bar: Meta & Problem Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center">
            DSA Problem #{problem.number || currentDsaIndex + 1} of {dsaProblems.length}
          </Badge>
          <Badge variant="outline" className="h-8 px-3 rounded-md text-xs font-mono inline-flex items-center">
            {dsaLanguage.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="h-8 px-3 rounded-md text-xs inline-flex items-center">
            Non-Graph Algorithm
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 px-3 rounded-md border border-border bg-surface-raised inline-flex items-center gap-2 text-xs font-mono tabular-nums text-muted-foreground shadow-xs">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Target: {problem.suggestedTimeMinutes}m</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshProblem}
            disabled={isRefreshing}
            isLoading={isRefreshing}
            className="text-xs font-semibold"
            title="Generate a completely new non-graph DSA problem"
          >
            <RotateCw className="h-3.5 w-3.5 mr-1 text-primary" />
            <span>Refresh Problem</span>
          </Button>
        </div>
      </div>

      {refreshError && (
        <div className="p-3 rounded-lg border border-danger-border bg-danger-subtle text-danger text-xs">
          {refreshError}
        </div>
      )}

      {/* 2. Problem Title as Main Heading */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
          {problem.title}
        </h1>
        <p className="text-xs text-muted-foreground font-mono">
          Optimal Complexity: <span className="font-semibold text-primary">{problem.expectedTimeComplexity}</span> time • <span className="font-semibold text-primary">{problem.expectedSpaceComplexity}</span> space
        </p>
      </div>

      {/* 3. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Problem Details, Interviewer Guide, & Working Solution (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Problem Statement Card */}
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileQuestion className="h-4 w-4 text-primary" />
              <span>Problem Statement & Constraints</span>
            </div>
            <div className="p-5 space-y-4 text-xs sm:text-sm text-foreground leading-relaxed">
              <p className="whitespace-pre-line">{problem.description}</p>

              {/* Sample Inputs and Outputs */}
              {problem.sampleInputs && problem.sampleInputs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Sample Examples:
                  </span>
                  <div className="space-y-2">
                    {problem.sampleInputs.map((inp, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-surface-raised border border-border text-xs font-mono space-y-1">
                        <div>
                          <span className="text-primary font-semibold">Input: </span>
                          <span className="text-foreground">{inp}</span>
                        </div>
                        {problem.sampleOutputs?.[i] && (
                          <div>
                            <span className="text-success font-semibold">Output: </span>
                            <span className="text-foreground">{problem.sampleOutputs[i]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edge Cases to Test */}
              {problem.edgeCases && problem.edgeCases.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <span className="text-xs font-semibold text-danger uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                    <span>Critical Edge Cases to Test:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.edgeCases.map((ec, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-danger-subtle border border-danger-border text-danger text-xs font-mono"
                      >
                        {ec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interviewer Explanation Guide Card */}
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              <span>Interviewer Explanation & Algorithmic Guide</span>
            </div>
            <div className="p-5 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line space-y-3">
              {problem.detailedExplanation ? (
                <div className="prose prose-sm max-w-none text-foreground">
                  {problem.detailedExplanation}
                </div>
              ) : (
                <div className="space-y-2">
                  <p><strong>Expected Approach:</strong> {problem.expectedApproach}</p>
                  <p><strong>Target Time Complexity:</strong> {problem.expectedTimeComplexity}</p>
                  <p><strong>Target Space Complexity:</strong> {problem.expectedSpaceComplexity}</p>
                </div>
              )}
            </div>
          </div>

          {/* Optimal Working Code Solution Card with Full Code Editor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground px-1">
              <Code2 className="h-4 w-4 text-primary" />
              <span>Optimal Working Code Solution ({dsaLanguage.toUpperCase()})</span>
            </div>
            <CodeEditor
              value={problem.workingCode || '// No reference code available'}
              language={dsaLanguage}
              fileName={`OptimalSolution.${dsaLanguage === 'python' ? 'py' : dsaLanguage === 'cpp' ? 'cpp' : dsaLanguage === 'javascript' ? 'js' : 'java'}`}
              readOnly={true}
              allowEditToggle={true}
              minHeight="280px"
              maxHeight="520px"
            />
          </div>
        </div>

        {/* Right Column: AI Assistant Chat & Candidate Code Scoring (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Gemini Chat Assistant Card */}
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs flex flex-col h-[400px]">
            <div className="px-4 py-2.5 border-b border-border bg-surface flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Interviewer Copilot</h3>
              </div>
              <Badge variant="outline" className="text-caption font-mono">
                Gemini
              </Badge>
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 border-b border-border bg-surface-raised flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="text-muted-foreground text-caption shrink-0">Quick Probes:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('What are 3 subtle hints I can give if candidate is stuck?')}
                className="px-2 py-0.5 rounded-full bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border whitespace-nowrap text-caption transition-colors"
              >
                Hints to give
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('What is the brute force approach and its time/space complexity?')}
                className="px-2 py-0.5 rounded-full bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border whitespace-nowrap text-caption transition-colors"
              >
                Brute force
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('How can I test the edge cases for this problem?')}
                className="px-2 py-0.5 rounded-full bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border whitespace-nowrap text-caption transition-colors"
              >
                Edge tests
              </button>
            </div>

            {/* Chat Messages Body */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs leading-relaxed">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="h-6 w-6 rounded-md bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${msg.sender === 'user'
                      ? 'bg-primary-subtle text-primary border border-primary/30 font-medium'
                      : 'bg-surface-raised border border-border text-foreground'
                      }`}
                  >
                    {msg.sender === 'assistant' ? (
                      <RichMarkdown content={msg.text} />
                    ) : (
                      <p className="whitespace-pre-line">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isAssistantThinking && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs italic">
                  <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span>Gemini is analyzing problem context...</span>
                </div>
              )}
              <div ref={chatMessagesEndRef} className="h-0 w-0" />
            </div>

            {/* Chat Input Bar */}
            <div className="p-2.5 border-t border-border bg-surface flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Gemini about candidate's approach, hints, complexities..."
                className="flex-1 text-xs px-3 py-2 rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleSendMessage()}
                disabled={isAssistantThinking || !chatInput.trim()}
                className="h-8 px-3 text-xs font-semibold"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Candidate Code Submission & Scoring Card */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Candidate Code Submission</h3>
              </div>
              <span className="text-caption font-mono text-muted-foreground">{dsaLanguage}</span>
            </div>

            <CodeEditor
              value={candidateCode}
              onChange={(val) => {
                setCandidateCode(val);
                submitDsaCode(problem.id, dsaLanguage, val, submission?.review);
              }}
              language={dsaLanguage}
              fileName={`CandidateSubmission.${dsaLanguage === 'python' ? 'py' : dsaLanguage === 'cpp' ? 'cpp' : dsaLanguage === 'javascript' ? 'js' : 'java'}`}
              readOnly={false}
              allowEditToggle={false}
              minHeight="220px"
              maxHeight="380px"
            />

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEvaluateCandidateCode}
                disabled={isEvaluating || !candidateCode.trim()}
                isLoading={isEvaluating}
                className="text-xs font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <span>Analyze with AI</span>
              </Button>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-foreground">Interviewer Score:</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={interviewerScore}
                  onChange={(e) => {
                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                    setInterviewerScore(val);
                    updateDsaInterviewerScore(problem.id, val);
                  }}
                  className="w-16 h-8 text-xs font-mono tabular-nums font-bold px-2 rounded-md border border-input bg-card text-center text-foreground"
                />
                <span className="text-xs font-mono text-muted-foreground">/ 100</span>
              </div>
            </div>

            {submission?.review && (
              <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>AI Review Summary</span>
                  <span className="font-mono text-primary">{submission.review.overallScore100} / 100</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{submission.review.interviewerSummary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
