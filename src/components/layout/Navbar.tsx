import React, { useState } from 'react';
import {
  Terminal,
  History,
  Settings as SettingsIcon,
  PlusCircle,
  Sun,
  Moon,
  Bot,
  LogOut,
  Radio,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useInterviewSessionStore } from '@/store/useInterviewSessionStore';
import { getApiKey } from '@/services/storage/keyStorage';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'configure', label: 'New Interview', icon: PlusCircle },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

export function Navbar({ currentTab, setCurrentTab }: NavbarProps) {
  const { user, signOut } = useAuthStore();
  const { settings, setTheme } = useSettingsStore();
  const { session } = useInterviewSessionStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const hasApiKey = !!settings.geminiApiKey || !!getApiKey();
  const isDark = settings.theme !== 'light';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-xl shadow-xs">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo & Brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => setCurrentTab('dashboard')}
        >
          <div className="h-8 w-8 rounded-md bg-primary-subtle border border-primary-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-small tracking-tight text-foreground">
              InterviewPilot
            </span>
            <Badge variant="ai" className="text-caption px-1.5 py-0 font-mono">
              AI
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs (Segmented Control) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-lg border border-border bg-surface-raised">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentTab(item.id)}
                className={`px-3 py-1.5 rounded-md text-small font-medium inline-flex items-center gap-1.5 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? 'bg-primary-subtle text-primary border border-primary-border/60 shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions Cluster */}
        <div className="flex items-center gap-2">
          {/* Active Session Pill with soft teal live ping */}
          {session &&
            (session.status === 'in_progress' ||
              session.status === 'paused' ||
              session.status === 'draft') &&
            currentTab !== 'workspace' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentTab('workspace')}
                className="h-8 border-accent-2-border bg-accent-2-subtle text-accent-2 hover:bg-accent-2-subtle/80 font-medium"
              >
                <span className="relative flex h-2 w-2 mr-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-2" />
                </span>
                <span>{session.status === 'draft' ? 'Ready to Start' : 'Resume Session'}</span>
              </Button>
            )}

          {/* AI Connection Status */}
          <Tooltip content={hasApiKey ? 'Gemini AI: Connected' : 'Gemini AI: Not Connected'}>
            <div
              className={`h-8 w-8 rounded-md border flex items-center justify-center transition-colors ${
                hasApiKey
                  ? 'border-accent-2-border bg-accent-2-subtle text-accent-2'
                  : 'border-border bg-surface-raised text-muted-foreground'
              }`}
              aria-label={hasApiKey ? 'Gemini AI: Connected' : 'Gemini AI: Not Connected'}
            >
              <Bot className="h-4 w-4" />
            </div>
          </Tooltip>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="h-8 w-8 rounded-md border border-border bg-surface-raised flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Toggle color theme"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-0.5 rounded-md hover:bg-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-7 w-7 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="h-7 w-7 rounded-md bg-primary-subtle border border-primary-border text-primary flex items-center justify-center font-medium text-caption">
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
                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-card p-1.5 shadow-md z-50 animate-scale-in text-caption">
                  <div className="px-2.5 py-2 border-b border-border">
                    <p className="font-semibold text-foreground truncate">
                      {user?.name || 'Interviewer'}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {user?.email || 'Logged in'}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setCurrentTab('settings');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-foreground hover:bg-surface-raised flex items-center gap-2 transition-colors"
                    >
                      <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-danger-foreground hover:bg-danger-subtle flex items-center gap-2 transition-colors"
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
  );
}
