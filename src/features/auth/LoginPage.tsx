import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
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
      {/* Ambient background atmosphere */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-glow-indigo" />
        <div className="ambient-glow-teal" />
        <div className="ambient-grid" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-subtle border border-primary-border text-primary shadow-xs mb-1">
            <Terminal className="h-6 w-6" />
          </div>

          <div className="text-caption uppercase tracking-[0.12em] text-muted-foreground font-medium">
            Technical Interview Platform
          </div>

          <h1 className="text-display font-display font-semibold tracking-tight text-foreground">
            Run <span className="font-serif italic font-normal bg-gradient-to-r from-primary to-accent-2 bg-clip-text text-transparent">sharper</span> interviews
          </h1>
          <p className="text-body text-muted-foreground max-w-xs mx-auto">
            Live copilot, deterministic rubrics, and automated engineering evaluations.
          </p>
        </div>

        {/* Clean Auth Card */}
        <Card className="p-6 sm:p-8 border border-border bg-card shadow-lg rounded-xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-h3 font-semibold text-foreground tracking-tight">
              Sign In to Continue
            </h2>
            <p className="text-caption text-muted-foreground">
              Access your technical workspaces, scoring rubrics, and AI evaluation tools.
            </p>
          </div>

          {/* Official Google Sign-In Container */}
          <div className="py-2 flex flex-col items-center justify-center min-h-[56px] space-y-3">
            {!isGisReady && effectiveClientId && (
              <div className="h-10 w-[300px] rounded-full border border-border bg-surface-raised flex items-center justify-center text-caption text-muted-foreground animate-pulse font-medium">
                Initializing Google Sign-In...
              </div>
            )}

            <div
              className={`flex justify-center ${!isGisReady ? 'hidden' : ''}`}
              ref={googleBtnRef}
            />

            {!effectiveClientId && (
              <div className="p-3 rounded-md border border-border bg-surface-raised text-muted-foreground text-caption text-center w-full">
                Google Sign-In is unavailable in this environment. You can continue with a guest session below.
              </div>
            )}
          </div>

          {/* Fallback / Local Sandbox Sign-in Button */}
          <div className="space-y-3">
            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-border w-full" />
              <span className="bg-card px-2 text-caption font-mono uppercase tracking-widest text-subtle-foreground">
                or
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => signInAsDemo('Senior Tech Interviewer', 'interviewer@interviewpilot.ai')}
              className="w-full flex items-center justify-center gap-2"
              leftIcon={<UserCheck className="h-4 w-4 text-primary" />}
            >
              Continue with Guest Session (Local Sandbox)
            </Button>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-center gap-1.5 text-caption text-subtle-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>Client-side sandbox • Zero external data persistence</span>
          </div>
        </Card>

        {/* Subtle footer */}
        <div className="text-center text-caption text-subtle-foreground font-mono">
          <span>InterviewPilot AI • Engineering Interview Suite</span>
        </div>
      </div>
    </div>
  );
}
