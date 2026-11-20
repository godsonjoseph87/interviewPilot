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
  Bot,
  LogOut,
  User,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { getApiKey } from '@/services/storage/keyStorage';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Navbar({ currentTab, setCurrentTab }: NavbarProps) {
  const { user, signOut } = useAuthStore();
  const { settings, setTheme } = useSettingsStore();
  const { session } = useInterviewSessionStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const hasApiKey = !!settings.geminiApiKey || !!getApiKey();
  const isDark = settings.theme !== 'light';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-amber-200/70 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="w-full px-[10%] h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="h-9 w-9 rounded-xl p-0.5 shadow-md shadow-amber-500/25 dark:shadow-none bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 dark:bg-none dark:bg-black dark:border dark:border-white/40 group-hover:scale-105 transition-all">
              <div className="h-full w-full rounded-[10px] bg-white dark:bg-black flex items-center justify-center">
                <Terminal className="h-5 w-5 text-amber-600 dark:text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-stone-900 dark:text-white">
                  InterviewPilot
                </span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-800 border border-amber-300 dark:bg-zinc-900 dark:text-white dark:border-white/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-zinc-400 hidden sm:block tracking-wide">
                Technical Interview Platform
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-amber-50/60 p-1 rounded-xl border border-amber-200/60">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentTab === 'dashboard'
                ? 'bg-white text-stone-950 shadow-xs border border-amber-300 font-bold'
                : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('configure')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${currentTab === 'configure'
                ? 'bg-white text-stone-950 shadow-xs border border-amber-300 font-bold'
                : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>New Interview</span>
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${currentTab === 'history'
                ? 'bg-white text-stone-950 shadow-xs border border-amber-300 font-bold'
                : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                }`}
            >
              <History className="h-3.5 w-3.5 text-amber-600" />
              <span>History</span>
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${currentTab === 'settings'
                ? 'bg-white text-stone-950 shadow-xs border border-amber-300 font-bold'
                : 'text-stone-600 hover:text-stone-950 hover:bg-white/60'
                }`}
            >
              <SettingsIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Active Interview Resume Button */}
            {session && (session.status === 'in_progress' || session.status === 'paused' || session.status === 'draft') && currentTab !== 'workspace' && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setCurrentTab('workspace')}
                className="h-8 px-3.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 animate-pulse"
              >
                <Radio className="h-3.5 w-3.5 text-emerald-300" />
                <span>{session.status === 'draft' ? 'Enter Workspace (Ready)' : 'Resume Live Session'}</span>
              </Button>
            )}

            {/* AI Connection Status Indicator */}
            <div
              className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${hasApiKey
                ? 'ai-status-connected bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm shadow-emerald-500/10'
                : 'ai-status-disconnected bg-stone-100/60 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 opacity-50'
                }`}
              title={hasApiKey ? 'Gemini AI: Connected' : 'Gemini AI: Not Connected'}
              aria-label={hasApiKey ? 'Gemini AI: Connected' : 'Gemini AI: Not Connected'}
            >
              <Bot className="h-4 w-4" />
              {hasApiKey && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>

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
                  <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs">
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
    </>
  );
}

