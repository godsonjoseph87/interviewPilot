import React, { useState } from 'react';
import {
  Sparkles,
  Terminal,
  History,
  Settings as SettingsIcon,
  PlusCircle,
  Sun,
  Moon,
  Key,
  LogOut,
  User,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { ApiKeyModal } from '@/components/common/ApiKeyModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Navbar({ currentTab, setCurrentTab }: NavbarProps) {
  const { user, signOut } = useAuthStore();
  const { settings, setTheme } = useSettingsStore();
  const { session } = useInterviewSessionStore();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const hasApiKey = !!settings.geminiApiKey;
  const isDark = settings.theme !== 'light';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-0.5 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                  InterviewPilot
                </span>
                <span className="text-xs font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground hidden sm:block tracking-wide">
                Technical Interview Platform
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('configure')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'configure'
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
              <span>New Interview</span>
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'history'
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <History className="h-3.5 w-3.5 text-blue-400" />
              <span>History</span>
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentTab === 'settings'
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <SettingsIcon className="h-3.5 w-3.5 text-violet-400" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Active Interview Resume Button */}
            {session && (session.status === 'in_progress' || session.status === 'paused') && currentTab !== 'workspace' && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setCurrentTab('workspace')}
                className="animate-pulse flex items-center gap-1.5 text-xs font-semibold"
              >
                <Radio className="h-3.5 w-3.5 text-cyan-300" />
                <span>Resume Live Session</span>
              </Button>
            )}

            {/* API Key Status Pill */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                hasApiKey
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
              }`}
              title={hasApiKey ? 'Gemini API Key Configured' : 'Configure Gemini API Key'}
            >
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-mono">
                {hasApiKey ? 'Gemini Connected' : 'Set API Key'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Profile / Logout */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-secondary/70 transition-colors"
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-8 w-8 rounded-full border border-border/80 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    {user?.name?.slice(0, 2).toUpperCase() || 'IP'}
                  </div>
                )}
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/80 bg-card p-2 shadow-xl z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-border/60">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {user?.name || 'Interviewer'}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {user?.email || 'Logged in'}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setCurrentTab('settings');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-foreground/90 hover:bg-muted flex items-center gap-2"
                      >
                        <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </>
  );
}

