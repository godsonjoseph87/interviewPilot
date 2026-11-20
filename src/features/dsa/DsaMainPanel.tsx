import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  RotateCw,
  Sparkles,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  FileQuestion,
  AlertTriangle,
  Lightbulb,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
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
    <div className="flex-1 overflow-y-auto min-h-0 px-[10%] pt-[80px] pb-16 space-y-6 animate-fade-in select-text">
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* 1. Header Bar: Meta & Problem Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-200/70 dark:border-white/20">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="h-8 px-3 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 inline-flex items-center">
              DSA Problem #{problem.number || currentDsaIndex + 1} of {dsaProblems.length}
            </Badge>
            <Badge variant="outline" className="h-8 px-3 rounded-lg text-xs font-mono border-amber-300 text-amber-900 bg-amber-50 dark:border-white/20 dark:bg-zinc-900 dark:text-white inline-flex items-center">
              {dsaLanguage.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="h-8 px-3 rounded-lg text-xs inline-flex items-center">
              Non-Graph Algorithm
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 px-3 rounded-lg border border-stone-200/80 dark:border-white/20 bg-stone-50/80 dark:bg-zinc-900 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
              <span>Target: {problem.suggestedTimeMinutes}m</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshProblem}
              disabled={isRefreshing}
              isLoading={isRefreshing}
              className="h-8 px-4 min-w-[130px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 rounded-lg border-amber-300/80 text-stone-800 bg-white hover:bg-amber-50 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-xs hover:shadow-sm"
              title="Generate a completely new non-graph DSA problem"
            >
              <RotateCw className="h-3.5 w-3.5 text-amber-600 dark:text-white" />
              <span>Refresh Problem</span>
            </Button>
          </div>
        </div>

        {refreshError && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-50 text-rose-800 text-xs">
            {refreshError}
          </div>
        )}

        {/* 2. Problem Title as Main Heading */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-snug">
            {problem.title}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Optimal Complexity: <span className="font-bold text-amber-700">{problem.expectedTimeComplexity}</span> time • <span className="font-bold text-amber-700">{problem.expectedSpaceComplexity}</span> space
          </p>
        </div>

        {/* 3. Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Problem Details, Interviewer Guide, & Working Solution (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Problem Statement Card */}
            <div className="rounded-xl border border-amber-200/70 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-5 py-3 border-b border-amber-200/60 bg-amber-50/40 flex items-center gap-2 text-sm font-bold text-stone-900">
                <FileQuestion className="h-4 w-4 text-amber-600" />
                <span>Problem Statement & Constraints</span>
              </div>
              <div className="p-5 space-y-4 text-xs sm:text-sm text-stone-900 leading-relaxed">
                <p className="whitespace-pre-line">{problem.description}</p>

      {/* 2. Problem Title as Main Heading */}
      <div className="space-y-1">
        <h1 className="text-base sm:text-lg lg:text-xl font-semibold tracking-tight text-foreground leading-snug">
          {problem.title}
        </h1>
        <p className="text-xs text-muted-foreground font-mono">
          Optimal Complexity: <span className="font-bold text-amber-700">{problem.expectedTimeComplexity}</span> time • <span className="font-bold text-amber-700">{problem.expectedSpaceComplexity}</span> space
        </p>
      </div>

                {/* Sample Inputs and Outputs */}
                {problem.sampleInputs && problem.sampleInputs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-950 uppercase tracking-wider block">
                      Sample Examples:
                    </span>
                    <div className="space-y-2">
                      {problem.sampleInputs.map((inp, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-mono space-y-1">
                          <div>
                            <span className="text-amber-800 font-bold">Input: </span>
                            <span className="text-stone-900">{inp}</span>
                          </div>
                          {problem.sampleOutputs?.[i] && (
                            <div>
                              <span className="text-emerald-800 font-bold">Output: </span>
                              <span className="text-stone-900">{problem.sampleOutputs[i]}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edge Cases to Test */}
                {problem.edgeCases && problem.edgeCases.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span>Critical Edge Cases to Test:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {problem.edgeCases.map((ec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-[11px]"
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
            <div className="rounded-xl border border-amber-200/70 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-5 py-3 border-b border-amber-200/60 bg-amber-50/40 flex items-center gap-2 text-sm font-bold text-stone-900">
                <Layers className="h-4 w-4 text-amber-600" />
                <span>Interviewer Explanation & Algorithmic Guide</span>
              </div>
              <div className="p-5 text-xs sm:text-sm text-stone-900 leading-relaxed whitespace-pre-line space-y-3">
                {problem.detailedExplanation ? (
                  <div className="prose prose-sm max-w-none text-stone-900">
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

            {/* Optimal Working Code Solution Card */}
            <div className="rounded-xl border border-stone-200/90 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                  <Code2 className="h-4 w-4 text-amber-600" />
                  <span>Optimal Working Code Solution ({dsaLanguage.toUpperCase()})</span>
                </div>
                {problem.workingCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-7 px-2 text-xs flex items-center gap-1 text-stone-700 hover:text-stone-950 shadow-2xs hover:shadow-xs"
                    title="Copy working solution to clipboard"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-stone-600" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="p-4 bg-slate-950 overflow-x-auto text-slate-100 font-mono text-xs leading-relaxed max-h-96">
                <pre>{problem.workingCode || '// Working code will be generated by AI or is available in standard libraries.'}</pre>
              </div>
            </div>
          </div>

          {/* Right Column: Gemini Chat Assistant & Candidate Code Evaluation (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Gemini Chat Assistant Window */}
            <div className="rounded-xl border border-amber-300/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-[460px]">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-amber-200 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-800">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-stone-950">Gemini Interviewer Copilot</h3>
                    <p className="text-[10px] text-stone-500">Live problem guidance & candidate analysis</p>
                  </div>
                </div>
                <Badge variant="accent" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-900 border-amber-300">
                  AI Live
                </Badge>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-3 py-2 border-b border-stone-100 bg-stone-50/80 flex items-center gap-1.5 overflow-x-auto shrink-0 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleSendMessage('What progressive hints can I give the candidate if they get stuck?')}
                  className="px-2 py-1 rounded-md bg-white border border-amber-200 hover:border-amber-400 text-stone-800 whitespace-nowrap transition-all shadow-2xs hover:shadow-xs flex items-center gap-1"
                >
                  <Lightbulb className="h-3 w-3 text-amber-600" />
                  <span>Give Hint</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('What is the optimal time and space complexity with trade-offs?')}
                  className="px-2 py-1 rounded-md bg-white border border-amber-200 hover:border-amber-400 text-stone-800 whitespace-nowrap transition-all shadow-2xs hover:shadow-xs flex items-center gap-1"
                >
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span>Complexity</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('What edge cases should I test against the candidate code?')}
                  className="px-2 py-1 rounded-md bg-white border border-amber-200 hover:border-amber-400 text-stone-800 whitespace-nowrap transition-all shadow-2xs hover:shadow-xs flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3 text-rose-600" />
                  <span>Edge Cases</span>
                </button>
              </div>

              {/* Messages Scroll Area */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 text-xs scroll-smooth"
              >
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] p-3 rounded-xl leading-relaxed text-xs ${msg.sender === 'user'
                        ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none whitespace-pre-line'
                        : 'bg-stone-50 border border-stone-200 text-stone-900 rounded-tl-none shadow-2xs'
                        }`}
                    >
                      {msg.sender === 'assistant' ? (
                        <RichMarkdown content={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                {isAssistantThinking && (
                  <div className="flex items-center gap-2 text-stone-500 text-xs italic">
                    <div className="h-3 w-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                    <span>Gemini is analyzing problem context...</span>
                  </div>
                )}
                <div ref={chatMessagesEndRef} className="h-0 w-0" />
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask Gemini about candidate's approach, hints, complexities..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={isAssistantThinking || !chatInput.trim()}
                  className="h-8 px-3 text-xs font-bold"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Candidate Code Submission & Scoring Card */}
            <div className="rounded-xl border border-amber-200/70 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-stone-900">Candidate Code Submission</h3>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">{dsaLanguage}</span>
              </div>

              <Textarea
                value={candidateCode}
                onChange={(e) => {
                  setCandidateCode(e.target.value);
                  submitDsaCode(problem.id, dsaLanguage, e.target.value, submission?.review);
                }}
                placeholder={`Paste or type candidate's ${dsaLanguage} code here to review correctness, edge cases, and time/space complexity...`}
                rows={8}
                className="font-mono text-xs leading-relaxed bg-slate-950 text-slate-100 border-stone-800"
              />

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEvaluateCandidateCode}
                  disabled={isEvaluating || !candidateCode.trim()}
                  isLoading={isEvaluating}
                  className="text-xs font-semibold border-amber-300 text-stone-800 bg-white hover:bg-amber-50 shadow-xs hover:shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                  <span>Analyze with AI</span>
                </Button>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-stone-700">Interviewer Score:</label>
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
                    className="w-16 h-8 text-xs font-mono font-bold px-2 rounded-lg border border-stone-200 bg-stone-50 text-center"
                  />
                  <span className="text-xs font-mono text-stone-500">/ 100</span>
                </div>
              </div>

              {submission?.review && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span>AI Review Summary</span>
                    <span>{submission.review.overallScore100} / 100</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">{submission.review.interviewerSummary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
