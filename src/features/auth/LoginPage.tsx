import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Shield,
  Sparkles,
  Cpu,
  Brain,
  CheckCircle2,
  Code2,
  Layers,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ENV_GOOGLE_CLIENT_ID, ENV_GOOGLE_CLIENT_SECRET } from '@/lib/env';

declare global {
  interface Window {
    google?: any;
  }
}

export function LoginPage() {
  const { signInWithGoogleCredential, signInAsDemo } = useAuthStore();
  const { settings, updateSettings } = useSettingsStore();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [customName, setCustomName] = useState('Alex Vance, Principal Engineer');
  const [customEmail, setCustomEmail] = useState('alex.vance@techcorp.io');
  const effectiveClientId = settings.googleClientId || ENV_GOOGLE_CLIENT_ID || '';
  const [googleClientInput, setGoogleClientInput] = useState(effectiveClientId);
  const [showConfigClientId, setShowConfigClientId] = useState(false);
  const [isGisReady, setIsGisReady] = useState(false);

  useEffect(() => {
    if (!effectiveClientId) return;

    let intervalId: any;
    let attempts = 0;

    const initGoogleIdentity = () => {
      attempts++;
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: effectiveClientId,
            callback: (response: any) => {
              if (response.credential) {
                signInWithGoogleCredential(response.credential);
              }
            },
            auto_select: false,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_black',
              size: 'large',
              shape: 'rectangular',
              text: 'signin_with',
              width: 320,
            });
          }
          setIsGisReady(true);
          if (intervalId) clearInterval(intervalId);
        } catch (err) {
          console.warn('Google Identity Services initialization notice:', err);
        }
      } else if (attempts > 30 && intervalId) {
        clearInterval(intervalId);
      }
    };

    initGoogleIdentity();
    if (!window.google?.accounts?.id) {
      intervalId = setInterval(initGoogleIdentity, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [effectiveClientId, signInWithGoogleCredential]);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ googleClientId: googleClientInput.trim() });
    setShowConfigClientId(false);
  };

  const handleDemoSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signInAsDemo(customName, customEmail);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center relative overflow-hidden">
      {/* Decorative gradient glow elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Brand & Value Proposition */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Driven Technical Interview Copilot</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-0.5 shadow-xl shadow-cyan-500/25">
                <div className="h-full w-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                  <Terminal className="h-7 w-7 text-cyan-400" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                InterviewPilot AI
              </h1>
            </div>

            <p className="text-xl text-muted-foreground font-normal max-w-xl leading-relaxed">
              Conduct structured, high-signal engineering interviews for Senior Java Backend Engineers and Software Architects with Google Gemini.
            </p>
          </div>

          {/* Key Capabilities Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Brain className="h-4 w-4 text-cyan-400" />
                <span>Production-Centric Questions</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Replaces trivia with real distributed systems crashes, JVM leaks, Kafka offsets, and race conditions.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Code2 className="h-4 w-4 text-violet-400" />
                <span>AI DSA Code Evaluation</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluates correctness, algorithm choice, time/space complexity, and missing edge cases.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>Deterministic Scoring</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Objective category weighting in the browser combined with Gemini qualitative synthesis.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>100% Client-Side Persistence</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stores your interviews, rubrics, and PDF exports securely in IndexedDB via Dexie.js.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5">
          <Card className="p-6 sm:p-8 border-border/80 bg-card/90 backdrop-blur-md shadow-2xl relative">
            <div className="space-y-6">
              <div className="border-b border-border/60 pb-4">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  Sign In as Interviewer
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Authenticate your interviewer profile to start or review sessions.
                </p>
              </div>

              {/* Google Identity Services Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Option 1: Google Identity Services
                  </label>
                  {effectiveClientId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="h-3 w-3" />
                      <span>Client ID Active</span>
                    </span>
                  )}
                </div>

                {effectiveClientId ? (
                  <div className="space-y-2">
                    <div className="flex justify-center py-2" ref={googleBtnRef}>
                      {!isGisReady && (
                        <div className="h-10 w-full max-w-xs rounded-lg border border-border/80 bg-secondary/50 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                          Loading Google Sign-in...
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                      <span className="font-mono truncate max-w-[220px]">
                        ID: {effectiveClientId.slice(0, 24)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowConfigClientId(!showConfigClientId)}
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        {showConfigClientId ? 'Hide' : 'Change'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-dashed border-border bg-secondary/30 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Google OAuth Client ID is not configured yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConfigClientId(!showConfigClientId)}
                      className="text-xs"
                    >
                      {showConfigClientId ? 'Hide Configuration' : 'Configure Google Client ID'}
                    </Button>
                  </div>
                )}

                {showConfigClientId && (
                  <form onSubmit={handleSaveClientId} className="space-y-2 pt-2 border-t border-border/50">
                    <label className="text-xs text-foreground font-medium">Google Client ID</label>
                    <Input
                      placeholder="xyz.apps.googleusercontent.com"
                      value={googleClientInput}
                      onChange={(e) => setGoogleClientInput(e.target.value)}
                      className="text-xs font-mono"
                    />
                    <Button type="submit" size="sm" className="w-full text-xs">
                      Save Client ID
                    </Button>
                  </form>
                )}
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-border/80 w-full" />
                <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  OR
                </span>
                <div className="border-t border-border/80 w-full" />
              </div>

              {/* Option 2: Interviewer Quick Sign-In */}
              <form onSubmit={handleDemoSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Option 2: Interviewer Identity Profile
                  </label>
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-xs text-foreground font-medium">Interviewer Full Name</span>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Maya Chen, Staff Engineer"
                        required
                        className="text-sm mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-foreground font-medium">Interviewer Email</span>
                      <Input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="e.g. maya@enterprise.org"
                        required
                        className="text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2">
                  <span>Enter Interview Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              {/* Security Disclosure Notice */}
              <div className="pt-2 border-t border-border/50 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Frontend Architecture Notice:</strong> Authentication serves as an interviewer identity and personalization profile. All interview state and API configurations are kept strictly in your local browser sandbox.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

