import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Clock,
  Code2,
  Sliders,
  CheckCircle,
  ArrowRight,
  User,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
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

  // Form State
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

  // Track elapsed timer during AI synthesis
  useEffect(() => {
    let timer: any;
    if (isGenerating) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating]);

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
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

  const computeDurationBreakdown = () => {
    const hasDsa = selectedTopics.includes('dsa');
    const dsaMins = hasDsa ? (dsaProblemCount === 1 ? 15 : dsaProblemCount === 2 ? 22 : 30) : 0;
    const introMins = 5;
    const remainingForTopics = Math.max(15, durationMinutes - introMins - dsaMins);
    const nonDsaTopics = selectedTopics.filter((t) => t !== 'dsa');
    const perTopicMinutes =
      nonDsaTopics.length > 0
        ? Math.max(4, Math.round(remainingForTopics / nonDsaTopics.length))
        : 6;

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
        true
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

      await initNewSession(
        newSession,
        customizedQuestions,
        MOCK_DSA_PROBLEMS.slice(0, dsaProblemCount)
      );
      onStartSession(sessionId);
    } catch (err: any) {
      console.error('Failed to initialize fallback session:', err);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
        {/* Page Header */}
        <PageHeader
          eyebrow="Interview Designer"
          title="Configure New Interview"
          description="Specify candidate profile, duration, difficulty, and technical focus areas."
          actions={
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="md" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleStartInterview}
                disabled={isGenerating}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Generate & Start
              </Button>
            </div>
          }
        />

        {/* Error notification if generation failed */}
        {generationError && (
          <div className="p-4 rounded-lg border border-danger-border bg-danger-subtle text-danger-foreground text-caption sm:text-small flex items-start justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-foreground">Interview Generation Notice</p>
                  <p className="mt-0.5 whitespace-pre-line text-caption text-muted-foreground leading-relaxed font-mono">
                    {generationError}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={handleStartWithCalibratedQuestions}
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Start with Calibrated Question Bank (Instant)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleStartInterview}
                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  >
                    Retry Gemini AI
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setGenerationError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Generating Overlay Modal if active */}
        {isGenerating &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
            >
              <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center space-y-6 shadow-overlay animate-rise-in">
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary-subtle border border-primary-border flex items-center justify-center text-primary shadow-xs">
                  <Sparkles className="h-6 w-6 animate-spin" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-surface-raised border border-border text-caption text-muted-foreground font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{settings.geminiModel || 'gemini-2.5-flash'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Clock className="h-3 w-3" />
                      {elapsedSeconds}s
                    </span>
                  </div>

                  <h3 className="text-h3 font-semibold text-foreground tracking-tight">
                    Generating Technical Interview
                  </h3>
                  <p className="text-small text-primary font-mono font-medium">
                    {generationStep}
                  </p>
                  <p className="text-caption text-muted-foreground pt-1 leading-relaxed">
                    Synthesizing interview questions, evaluation rubrics, and DSA challenges via Gemini.
                  </p>
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300 w-full" />
                </div>

                {elapsedSeconds >= 12 && (
                  <div className="pt-3 border-t border-border animate-fade-in space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGenerating(false);
                        handleStartWithCalibratedQuestions();
                      }}
                      className="text-caption text-primary hover:underline transition-colors font-medium cursor-pointer"
                    >
                      Need to start immediately? Launch with Calibrated Bank &rarr;
                    </button>
                    <p className="text-caption text-muted-foreground">
                      Instantly opens workspace with calibrated senior Java & DSA questions.
                    </p>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

        <form onSubmit={handleStartInterview} className="space-y-8">
          {/* Section 1: Candidate Details */}
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle>1. Candidate Information</CardTitle>
              </div>
              <CardDescription>
                Candidate profile details used to calibrate scenario depth and complexity
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-caption font-semibold text-foreground mb-1.5">
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
                <label className="block text-caption font-semibold text-foreground mb-1.5">
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
                <label className="block text-caption font-semibold text-foreground mb-1.5">
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
                <label className="block text-caption font-semibold text-foreground mb-1.5">
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
                <label className="block text-caption font-semibold text-foreground mb-1.5">
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
                <label className="block text-caption font-semibold text-foreground mb-1.5">
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
                <label className="block text-caption font-semibold text-foreground mb-1.5">
                  Candidate Resume Context & Background (Optional)
                </label>
                <Textarea
                  value={candidateBackground}
                  onChange={(e) => setCandidateBackground(e.target.value)}
                  placeholder="Paste notable achievements, technologies, high scale claims, or architecture patterns from the candidate's resume..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Calibration (Difficulty & Duration) */}
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle>2. Duration & Difficulty Level</CardTitle>
              </div>
              <CardDescription>
                Configure pace, depth, and duration targets
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Difficulty Selection */}
              <div>
                <label className="block text-caption font-semibold text-foreground mb-2">
                  Target Interview Difficulty
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {DIFFICULTY_LEVELS.map((lvl) => {
                    const isSelected = difficulty === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setDifficulty(lvl.id as Difficulty)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-subtle shadow-xs'
                            : 'border-border bg-card hover:border-border-strong hover:bg-surface-raised'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-small font-semibold ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {lvl.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-caption text-muted-foreground leading-relaxed">
                          {lvl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-caption font-semibold text-foreground mb-2">
                  Total Allocated Duration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DURATION_OPTIONS.map((dur) => {
                    const isSelected = durationMinutes === dur.value;
                    return (
                      <div
                        key={dur.value}
                        onClick={() => setDurationMinutes(dur.value)}
                        className={`p-3.5 rounded-lg border cursor-pointer text-center transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-subtle shadow-xs'
                            : 'border-border bg-card hover:border-border-strong hover:bg-surface-raised'
                        }`}
                      >
                        <span
                          className={`text-small font-semibold block ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {dur.label}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          Approx. {dur.questionsTarget} questions + DSA
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Duration Breakdown Bar */}
              <div className="p-4 rounded-lg border border-border bg-surface-raised space-y-2">
                <div className="flex items-center justify-between text-caption">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Time Allocation Schedule ({durationMinutes} Minutes Total)</span>
                  </span>
                  <span className="text-muted-foreground font-mono tabular-nums">
                    ~{breakdown.perTopicMinutes} min per topic
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-center text-caption">
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="font-semibold text-foreground block">5 min</span>
                    <span className="text-muted-foreground">Introduction</span>
                  </div>
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="font-semibold text-foreground block">8 min</span>
                    <span className="text-muted-foreground">Java & OOP</span>
                  </div>
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="font-semibold text-foreground block">10 min</span>
                    <span className="text-muted-foreground">Spring Boot</span>
                  </div>
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="font-semibold text-foreground block">8 min</span>
                    <span className="text-muted-foreground">Kafka & DB</span>
                  </div>
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="font-semibold text-foreground block">10 min</span>
                    <span className="text-muted-foreground">Architecture</span>
                  </div>
                  <div className="p-2 rounded-md bg-card border border-border">
                    <span className="font-semibold text-foreground block">7 min</span>
                    <span className="text-muted-foreground">Incidents</span>
                  </div>
                  <div className="p-2 rounded-md bg-primary-subtle border border-primary-border">
                    <span className="font-semibold text-primary block">{breakdown.dsaMins} min</span>
                    <span className="text-muted-foreground">DSA Coding</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Technical Topics Multi-Select */}
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <div>
                    <CardTitle>3. Technical Competency Topics</CardTitle>
                    <CardDescription>
                      Selected ({selectedTopics.length} / {TECHNICAL_TOPICS.length}) topics to generate questions for
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-caption">
                  <button
                    type="button"
                    onClick={handleSelectDefaultTopics}
                    className="text-primary hover:underline font-medium"
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
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked
                          ? 'border-primary bg-primary-subtle shadow-xs'
                          : 'border-border bg-card hover:border-border-strong hover:bg-surface-raised'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground font-bold'
                            : 'border-input bg-surface'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-small font-medium text-foreground block">
                          {index + 1}. {topic.name}
                        </span>
                        <p className="text-caption text-muted-foreground leading-snug">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: DSA & Advanced Directives */}
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle>4. DSA & Advanced Directives</CardTitle>
              </div>
              <CardDescription>
                Customize algorithmic coding assessment and custom interviewer instructions
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-caption font-semibold text-foreground mb-1.5">
                    Candidate's Preferred DSA Language
                  </label>
                  <Select
                    value={dsaLanguage}
                    onChange={(e) => setDsaLanguage(e.target.value)}
                  >
                    {DSA_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-caption font-semibold text-foreground mb-1.5">
                    Number of DSA Problems
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setDsaProblemCount(num)}
                        className={`flex-1 py-1.5 rounded-md text-caption font-medium border transition-colors ${
                          dsaProblemCount === num
                            ? 'border-primary bg-primary-subtle text-primary font-semibold'
                            : 'border-border bg-card hover:bg-surface-raised text-muted-foreground'
                        }`}
                      >
                        {num} {num === 1 ? 'Problem' : 'Problems'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-md border border-border bg-surface-raised">
                    <div>
                      <span className="text-small font-medium text-foreground block">
                        Generate Follow-Up Questions
                      </span>
                      <span className="text-caption text-muted-foreground">
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

                  <div className="flex items-center justify-between p-3 rounded-md border border-border bg-surface-raised">
                    <div>
                      <span className="text-small font-medium text-foreground block">
                        Prioritize Real-World Production Scenarios
                      </span>
                      <span className="text-caption text-muted-foreground">
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
                <label className="block text-caption font-semibold text-foreground mb-1.5">
                  Custom Interviewer Instructions
                </label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Focus on high write contention, Redis eviction policies, and zero downtime schema migrations..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sticky Summary / Action Footer */}
          <div className="sticky bottom-0 z-20 py-4 border-t border-border bg-surface/90 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel & Return to Dashboard
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isGenerating}
              className="w-full sm:w-auto"
              leftIcon={<Sparkles className="h-4 w-4" />}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Generate Questions & Launch Workspace
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
