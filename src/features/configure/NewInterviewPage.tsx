import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Clock,
  Code2,
  Sliders,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  User,
  Mail,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import {
  TECHNICAL_TOPICS,
  DIFFICULTY_LEVELS,
  DURATION_OPTIONS,
  DSA_LANGUAGES,
} from '@/lib/constants';
import type { Difficulty, InterviewSession } from '@/types';
import { generateInterviewQuestions } from '@/services/ai';
import { MOCK_QUESTIONS, MOCK_DSA_PROBLEMS } from '@/services/ai/mockData';

interface NewInterviewPageProps {
  onStartSession: (sessionId: string) => void;
  onCancel: () => void;
}

export function NewInterviewPage({ onStartSession, onCancel }: NewInterviewPageProps) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { initNewSession } = useInterviewSessionStore();

  // Form State (Clean empty states with clear placeholder hints)
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [totalExperience, setTotalExperience] = useState('');
  const [relevantJavaExperience, setRelevantJavaExperience] = useState('');
  const [interviewerName, setInterviewerName] = useState(user?.name || '');
  const [candidateBackground, setCandidateBackground] = useState('');

  // Automatically populate interviewer name from Google login
  useEffect(() => {
    if (user?.name && !interviewerName) {
      setInterviewerName(user.name);
    }
  }, [user?.name]);

  const [difficulty, setDifficulty] = useState<Difficulty>(settings.defaultDifficulty || 'hard');
  const [durationMinutes, setDurationMinutes] = useState<number>(settings.defaultDuration || 60);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    settings.defaultTopics || [
      'java_oop',
      'java_collections',
      'java_concurrency',
      'spring_boot',
      'microservices',
      'kafka_messaging',
      'mysql_optimization',
      'system_design',
      'real_world_problems',
      'dsa',
    ]
  );

  const [customInstructions, setCustomInstructions] = useState('');
  const [dsaLanguage, setDsaLanguage] = useState('java');
  const [dsaProblemCount, setDsaProblemCount] = useState(2);
  const [enableFollowUps, setEnableFollowUps] = useState(true);
  const [enableScenarios, setEnableScenarios] = useState(true);

  // Generation & Status State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Auto-scroll to top, lock page scrolling, and track live elapsed generation timer
  useEffect(() => {
    let timer: any;
    if (isGenerating) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      window.scrollTo({ top: 0, behavior: 'smooth' });
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        if (timer) clearInterval(timer);
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isGenerating]);

  // Toggle topics
  const handleToggleTopic = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      if (selectedTopics.length === 1) return; // keep at least one
      setSelectedTopics(selectedTopics.filter((t) => t !== topicId));
    } else {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  const handleSelectAllTopics = () => {
    setSelectedTopics(TECHNICAL_TOPICS.map((t) => t.id));
  };

  const handleSelectDefaultTopics = () => {
    setSelectedTopics([
      'java_oop',
      'java_collections',
      'java_concurrency',
      'spring_boot',
      'microservices',
      'kafka_messaging',
      'mysql_optimization',
      'system_design',
      'real_world_problems',
      'dsa',
    ]);
  };

  // Compute dynamic duration breakdown
  const computeDurationBreakdown = () => {
    const total = durationMinutes;
    const introMins = 5;
    const dsaMins = selectedTopics.includes('dsa') ? (total === 30 ? 10 : total === 45 ? 12 : total === 60 ? 15 : 20) : 0;
    const remainingForTopics = Math.max(10, total - introMins - dsaMins);

    const nonDsaTopics = selectedTopics.filter((t) => t !== 'dsa');
    const perTopicMinutes = nonDsaTopics.length > 0 ? Math.max(4, Math.round(remainingForTopics / nonDsaTopics.length)) : 6;

    return {
      introMins,
      dsaMins,
      perTopicMinutes,
      nonDsaCount: nonDsaTopics.length,
    };
  };

  const breakdown = computeDurationBreakdown();

  const handleStartInterview = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!candidateName.trim()) {
      alert('Candidate name is required.');
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStep('Validating interview parameters...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setGenerationStep('Connecting to Google Gemini API...');

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const finalCandidateName = candidateName.trim();
      const finalJobPosition = jobPosition.trim() || 'Senior Java Backend Engineer';
      const finalExperience = totalExperience.trim() || '5+ Years';
      const finalJavaExp = relevantJavaExperience.trim() || '4+ Years';
      const finalInterviewer = interviewerName.trim() || user?.name || 'Technical Interviewer';

      setGenerationStep('Synthesizing structured questions & scenario challenges...');

      const result = await generateInterviewQuestions(
        {
          candidateName: finalCandidateName,
          jobPosition: finalJobPosition,
          totalExperience: finalExperience,
          relevantJavaExperience: finalJavaExp,
          candidateBackground: candidateBackground.trim() || undefined,
          difficulty,
          durationMinutes,
          selectedTopics,
          customInstructions: customInstructions.trim() || undefined,
          dsaProblemCount,
          enableFollowUps,
          enableScenarios,
          dsaLanguage,
        },
        true // Allow calibrated senior mock if no API key is set yet
      );

      setGenerationStep('Validating schema and category distributions...');
      await new Promise((r) => setTimeout(r, 300));

      setGenerationStep('Persisting session into local IndexedDB database...');

      const newSession: InterviewSession = {
        id: sessionId,
        candidateName: finalCandidateName,
        candidateEmail: candidateEmail.trim() || undefined,
        jobPosition: finalJobPosition,
        totalExperience: finalExperience,
        relevantJavaExperience: finalJavaExp,
        interviewerName: finalInterviewer,
        candidateBackground: candidateBackground.trim() || undefined,
        difficulty,
        durationMinutes,
        selectedTopics,
        customInstructions: customInstructions.trim() || undefined,
        dsaLanguage,
        dsaProblemCount,
        enableFollowUps,
        enableScenarios,
        status: 'draft',
        createdAt: Date.now(),
        startedAt: 0,
        totalElapsedSeconds: 0,
        currentQuestionIndex: 0,
      };

      await initNewSession(newSession, result.questions, result.dsaProblems);

      setGenerationStep('Finalizing workspace setup...');
      await new Promise((r) => setTimeout(r, 300));

      setIsGenerating(false);
      onStartSession(sessionId);
    } catch (err: any) {
      console.error('Question generation failed:', err);
      setIsGenerating(false);
      setGenerationError(err?.message || 'Failed to generate questions with AI.');
    }
  };

  const handleStartWithCalibratedQuestions = async () => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const finalCandidateName = candidateName.trim() || 'Candidate';
      const finalJobPosition = jobPosition.trim() || 'Senior Java Backend Engineer';
      const finalExperience = totalExperience.trim() || '5+ Years';
      const finalJavaExp = relevantJavaExperience.trim() || '4+ Years';
      const finalInterviewer = interviewerName.trim() || user?.name || 'Technical Interviewer';

      const customizedQuestions = MOCK_QUESTIONS.map((q) => ({
        ...q,
        id: `q_${Date.now()}_${q.number}`,
      }));

      const newSession: InterviewSession = {
        id: sessionId,
        candidateName: finalCandidateName,
        candidateEmail: candidateEmail.trim() || undefined,
        jobPosition: finalJobPosition,
        totalExperience: finalExperience,
        relevantJavaExperience: finalJavaExp,
        interviewerName: finalInterviewer,
        candidateBackground: candidateBackground.trim() || undefined,
        difficulty,
        durationMinutes,
        selectedTopics,
        customInstructions: customInstructions.trim() || undefined,
        dsaLanguage,
        dsaProblemCount,
        enableFollowUps,
        enableScenarios,
        status: 'draft',
        createdAt: Date.now(),
        startedAt: 0,
        totalElapsedSeconds: 0,
        currentQuestionIndex: 0,
      };

      await initNewSession(newSession, customizedQuestions, MOCK_DSA_PROBLEMS.slice(0, dsaProblemCount));
      onStartSession(sessionId);
    } catch (err: any) {
      console.error('Failed to initialize fallback session:', err);
    }
  };

  return (
    <>
      <div className="w-full px-[10%] pt-[80px] pb-16 animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold mb-2">
              <Sliders className="h-3.5 w-3.5" />
              <span>Interview Designer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Configure New Interview
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Specify candidate profile, duration, difficulty, and technical focus areas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStartInterview}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate & Start</span>
            </Button>
          </div>
        </div>

        {/* Error notification if generation failed */}
        {generationError && (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs sm:text-sm flex items-start justify-between gap-4 shadow-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-rose-200">Interview Generation Notice</p>
                  <p className="mt-0.5 whitespace-pre-line text-xs text-rose-300/90 leading-relaxed font-mono">
                    {generationError}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStartWithCalibratedQuestions}
                    className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Start with Calibrated Senior Question Bank (Instant)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartInterview}
                    className="text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Gemini AI (90s Timeout)</span>
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGenerationError(null)}
              className="text-xs text-rose-300 shrink-0"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Generating Overlay Modal if active - Portaled directly to document.body to ensure perfect viewport centering & scroll lock */}
        {isGenerating &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl overscroll-none overflow-hidden touch-none select-none"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-6 shadow-2xl animate-scale-in">
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-400/30 animate-ping" />
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Sparkles className="h-8 w-8 text-stone-950 animate-spin" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-300/60 text-xs text-amber-800 font-mono font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>{settings.geminiModel || 'gemini-3.5-flash-lite'}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {elapsedSeconds}s
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground tracking-tight">
                    Generating Technical Interview
                  </h3>
                  <p className="text-sm text-amber-700 font-mono font-semibold animate-pulse">
                    {generationStep}
                  </p>
                  <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                    Synthesizing interview questions, evaluation rubrics, and DSA coding challenges via Google Gemini.
                  </p>
                </div>

                <div className="h-2 w-full bg-amber-100/70 rounded-full overflow-hidden border border-amber-200">
                  <div className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-full animate-pulse-slow w-full" />
                </div>

                {/* Instant fallback option if API request takes longer than 12 seconds */}
                {elapsedSeconds >= 12 && (
                  <div className="pt-3 border-t border-border animate-fade-in space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGenerating(false);
                        handleStartWithCalibratedQuestions();
                      }}
                      className="text-xs text-primary hover:text-primary/80 underline underline-offset-4 transition-colors font-medium cursor-pointer"
                    >
                      Need to start immediately? Launch with Senior Question Bank &rarr;
                    </button>
                    <p className="text-[10px] text-muted-foreground">
                      Instantly opens workspace with calibrated senior Java & DSA questions without waiting.
                    </p>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

        <form onSubmit={handleStartInterview} className="space-y-8">
          {/* Section 1: Candidate Details */}
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-semibold">1. Candidate Information</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Candidate profile details used by Gemini to calibrate scenario complexity
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Candidate Full Name *
                </label>
                <Input
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Daniel Miller"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Candidate Email (Optional)
                </label>
                <Input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="e.g. daniel@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Target Job Position *
                </label>
                <Input
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="e.g. Senior Java Backend Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Total Professional Experience *
                </label>
                <Input
                  value={totalExperience}
                  onChange={(e) => setTotalExperience(e.target.value)}
                  placeholder="e.g. 6.5 Years"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Relevant Java / Backend Experience *
                </label>
                <Input
                  value={relevantJavaExperience}
                  onChange={(e) => setRelevantJavaExperience(e.target.value)}
                  placeholder="e.g. 5.5 Years"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Interviewer Name *
                </label>
                <Input
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  required
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Candidate Resume Context & Background (Optional)
                </label>
                <Textarea
                  value={candidateBackground}
                  onChange={(e) => setCandidateBackground(e.target.value)}
                  placeholder="Paste notable achievements, technologies, high scale claims, or architecture patterns from the candidate's resume..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Interview Calibration (Difficulty & Duration) */}
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-semibold">2. Duration & Difficulty Level</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configure pace, depth, and duration targets
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Target Interview Difficulty
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {DIFFICULTY_LEVELS.map((lvl) => {
                    const isSelected = difficulty === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setDifficulty(lvl.id as Difficulty)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border/70 hover:border-border bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {lvl.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {lvl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Total Allocated Duration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DURATION_OPTIONS.map((dur) => {
                    const isSelected = durationMinutes === dur.value;
                    return (
                      <div
                        key={dur.value}
                        onClick={() => setDurationMinutes(dur.value)}
                        className={`p-3.5 rounded-xl border cursor-pointer text-center transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border/70 hover:border-border bg-secondary/30'
                        }`}
                      >
                        <span className={`text-sm font-bold block ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {dur.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Approx. {dur.questionsTarget} questions + DSA
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Duration Breakdown Bar */}
              <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Time Allocation Schedule ({durationMinutes} Minutes Total)</span>
                  </span>
                  <span className="text-muted-foreground font-mono">
                    ~{breakdown.perTopicMinutes} min per technical topic
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-center text-xs">
                  <div className="p-2 rounded-lg bg-secondary/60 border border-border/50">
                    <span className="font-bold text-foreground block">5 min</span>
                    <span className="text-[10px] text-muted-foreground">Introduction</span>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/60 border border-border/50">
                    <span className="font-bold text-foreground block">8 min</span>
                    <span className="text-[10px] text-muted-foreground">Java & OOP</span>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/60 border border-border/50">
                    <span className="font-bold text-foreground block">10 min</span>
                    <span className="text-[10px] text-muted-foreground">Spring Boot</span>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/60 border border-border/50">
                    <span className="font-bold text-foreground block">8 min</span>
                    <span className="text-[10px] text-muted-foreground">Kafka & DB</span>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/60 border border-border/50">
                    <span className="font-bold text-foreground block">10 min</span>
                    <span className="text-[10px] text-muted-foreground">Architecture</span>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/60 border border-border/50">
                    <span className="font-bold text-foreground block">7 min</span>
                    <span className="text-[10px] text-muted-foreground">Incidents</span>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/25">
                    <span className="font-bold text-primary block">{breakdown.dsaMins} min</span>
                    <span className="text-[10px] text-muted-foreground">DSA Coding</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Technical Topics Multi-Select */}
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-amber-600" />
                  <div>
                    <CardTitle className="text-base font-semibold">
                      3. Technical Competency Topics
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Selected ({selectedTopics.length} / {TECHNICAL_TOPICS.length}) topics to generate questions for
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectDefaultTopics}
                    className="text-amber-800 hover:underline font-semibold"
                  >
                    Select Default (10)
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={handleSelectAllTopics}
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    Select All
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {TECHNICAL_TOPICS.map((topic, index) => {
                  const isChecked = selectedTopics.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => handleToggleTopic(topic.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked
                          ? 'border-amber-400 bg-amber-50/70 shadow-xs'
                          : 'border-border/60 hover:border-amber-200 bg-white opacity-80'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                          isChecked
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-400 text-stone-950 font-bold'
                            : 'border-border bg-white'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            {index + 1}. {topic.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: DSA & Custom Directives */}
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-semibold">4. DSA & Advanced Directives</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Customize algorithmic coding assessment and custom interviewer prompt directives
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Candidate's Preferred DSA Language
                  </label>
                  <select
                    value={dsaLanguage}
                    onChange={(e) => setDsaLanguage(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {DSA_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Number of DSA Problems
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setDsaProblemCount(num)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          dsaProblemCount === num
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border/70 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {num} {num === 1 ? 'Problem' : 'Problems'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-secondary/30">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Generate Follow-Up Questions
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Include 1-2 probing sub-questions per topic
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableFollowUps}
                      onChange={(e) => setEnableFollowUps(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-secondary/30">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Prioritize Real-World Production Scenarios
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Frame questions around outages, deadlocks, and latency
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableScenarios}
                      onChange={(e) => setEnableScenarios(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Custom Interviewer Instructions
                </label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Focus on high write contention, Redis eviction policies, and zero downtime schema migrations..."
                  rows={6}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-10 px-5 text-sm font-semibold rounded-lg w-full sm:w-auto"
            >
              Cancel & Return to Dashboard
            </Button>

            <Button
              type="submit"
              disabled={isGenerating}
              className="h-10 px-5 text-sm font-bold rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Questions & Launch Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

