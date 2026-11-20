import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Sparkles,
  Shield,
  Brain,
  Code2,
  Layers,
  Lock,
  UserCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ENV_GOOGLE_CLIENT_ID } from '@/lib/env';

declare global {
  interface Window {
    google?: any;
  }
}

export function LoginPage() {
  const { signInWithGoogleCredential, signInAsDemo } = useAuthStore();
  const { settings } = useSettingsStore();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const effectiveClientId = settings.googleClientId || ENV_GOOGLE_CLIENT_ID || '';
  const [isGisReady, setIsGisReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!effectiveClientId) return;

    let attempts = 0;
    let intervalId: any;

    const initGoogleIdentity = () => {
      attempts++;
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: effectiveClientId,
            callback: (response: any) => {
              if (response?.credential && isMounted) {
                signInWithGoogleCredential(response.credential);
              }
            },
            auto_select: false,
          });

          // Safely reset content without triggering React DOM removeChild crashes
          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';

            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              shape: 'pill',
              text: 'continue_with',
              width: 300,
            });
          }

          if (isMounted) setIsGisReady(true);
          if (intervalId) clearInterval(intervalId);
        } catch (err) {
          console.warn('Google Identity Services notice:', err);
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
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [effectiveClientId, signInWithGoogleCredential]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      {/* Subtle golden background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-400/15 via-yellow-300/20 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 shadow-lg shadow-amber-500/25 mb-1">
            <Terminal className="h-7 w-7 text-stone-950" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              InterviewPilot <span className="gold-gradient-text">AI</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              AI-Powered Technical Interview Management & Real-Time Copilot
            </p>
          </div>
        </div>

        {/* Clean Login Card */}
        <Card className="p-8 border-amber-200/80 bg-white shadow-xl rounded-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Sign In to Continue
            </h2>
            <p className="text-xs text-muted-foreground">
              Authentication is required to access your interview workspace, candidate evaluation rubrics, and Gemini AI tools.
            </p>
          </div>

          {/* Official Google Sign-In Container */}
          <div className="py-2 flex flex-col items-center justify-center min-h-[56px] space-y-3">
            {!isGisReady && effectiveClientId && (
              <div className="h-11 w-[300px] rounded-full border border-amber-200 bg-amber-50/50 flex items-center justify-center text-xs text-amber-800 animate-pulse font-medium">
                Initializing Google Sign-In...
              </div>
            )}

            <div
              className={`flex justify-center ${!isGisReady ? 'hidden' : ''}`}
              ref={googleBtnRef}
            />

            {!effectiveClientId && (
              <div className="p-3 rounded-xl border border-border/70 bg-secondary/30 text-muted-foreground text-xs text-center w-full">
                Google Sign-In is unavailable. You can continue with Guest Session below.
              </div>
            )}
          </div>

          {/* Fallback / Local Development Sign-in Button */}
          <div className="pt-2">
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-border/80 w-full" />
              <span className="bg-white px-2 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => signInAsDemo('Senior Tech Interviewer', 'interviewer@interviewpilot.ai')}
              className="w-full text-xs font-semibold border-amber-300/80 bg-amber-50/50 hover:bg-amber-100/70 text-stone-900 flex items-center justify-center gap-2 h-10 rounded-xl transition-colors"
            >
              <UserCheck className="h-4 w-4 text-amber-700" />
              <span>Continue with Guest Session (Local Sandbox)</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-border/60 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Secure client-side sandbox • Zero server storage</span>
          </div>
        </Card>

        {/* Subtle footer tag */}
        <div className="text-center text-xs text-muted-foreground font-mono">
          <span>InterviewPilot AI • Engineering Interview Suite</span>
        </div>
      </div>
    </div>
  );
}
