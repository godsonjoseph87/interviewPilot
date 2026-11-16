import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  KeyRound,
  Cpu,
  Sliders,
  Sun,
  Moon,
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Info,
  ExternalLink,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  AVAILABLE_MODELS,
  DURATION_OPTIONS,
  DIFFICULTY_LEVELS,
  TECHNICAL_TOPICS,
} from '@/lib/constants';
import {
  exportDatabaseBackup,
  importDatabaseBackup,
  clearAllLocalData,
} from '@/services/db/exportImport';
import { ENV_GOOGLE_CLIENT_ID, ENV_GOOGLE_CLIENT_SECRET, ENV_GEMINI_API_KEY } from '@/lib/env';
import type { Difficulty } from '@/types';

export function SettingsPage() {
  const { settings, updateSettings, updateApiKey, setTheme } = useSettingsStore();
  const { user } = useAuthStore();

  // Local Form States
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saveKeyLocally, setSaveKeyLocally] = useState(settings.saveKeyLocally);
  const [selectedModel, setSelectedModel] = useState(settings.geminiModel || 'gemini-2.5-flash');
  const [customModelId, setCustomModelId] = useState('');
  const [googleClientId, setGoogleClientId] = useState(settings.googleClientId || '');

  // Defaults
  const [defaultDuration, setDefaultDuration] = useState(settings.defaultDuration || 60);
  const [defaultDifficulty, setDefaultDifficulty] = useState<Difficulty>(
    settings.defaultDifficulty || 'hard'
  );
  const [defaultTopics, setDefaultTopics] = useState<string[]>(
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

  // Status feedback
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save API key
    await updateApiKey(apiKeyInput.trim(), saveKeyLocally);

    // Save other settings
    const activeModel = customModelId.trim() ? customModelId.trim() : selectedModel;
    await updateSettings({
      geminiModel: activeModel,
      googleClientId: googleClientId.trim(),
      defaultDuration,
      defaultDifficulty,
      defaultTopics,
    });

    setSaveSuccessMsg('Settings saved successfully.');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleExportBackup = async () => {
    try {
      const jsonBackup = await exportDatabaseBackup();
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `InterviewPilot_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export local backup.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importDatabaseBackup(text);
      if (result.success) {
        alert(result.message);
      } else {
        alert(`Import Error: ${result.message}`);
      }
    } catch (err: any) {
      alert(`Failed to import file: ${err?.message || 'Invalid format'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    await clearAllLocalData();
    setIsClearDataModalOpen(false);
    alert('Local database successfully cleared.');
  };

  const toggleTopic = (id: string) => {
    if (defaultTopics.includes(id)) {
      if (defaultTopics.length === 1) return;
      setDefaultTopics(defaultTopics.filter((t) => t !== id));
    } else {
      setDefaultTopics([...defaultTopics, id]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 text-xs font-semibold mb-2">
            <SettingsIcon className="h-3.5 w-3.5" />
            <span>Preferences & Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Application Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure Google Gemini credentials, model routing, UI themes, and local storage backups.
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* Section 1: Gemini API Credentials */}
        <Card className="border-border/80">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-base font-semibold">
                  Google Gemini API Integration
                </CardTitle>
              </div>
              {apiKeyInput && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {apiKeyInput === ENV_GEMINI_API_KEY ? 'Loaded from .env' : 'Custom Configured'}
                </span>
              )}
            </div>
            <CardDescription className="text-xs">
              Direct browser-to-Google Gemini API credentials
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* Security Warning Callout */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200/90 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Security Notice: Browser-Based Execution</span>
              </div>
              <p className="leading-relaxed">
                InterviewPilot AI operates entirely inside your web browser. No API key is ever embedded into source code or build files. When you enter a key here, requests are sent directly from your browser to Google GenAI servers.
              </p>
              <p className="leading-relaxed font-semibold">
                Warning: Browser-based API keys can theoretically be extracted by anyone with access to this browser's Developer Tools. We recommend using a key restricted to Google Gemini API or keeping it strictly in-memory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Gemini API Key
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                <span>Direct client integration with official @google/genai SDK</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline font-medium"
                >
                  <span>Google AI Studio Key Console</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="persistKeySetting"
                checked={saveKeyLocally}
                onChange={(e) => setSaveKeyLocally(e.target.checked)}
                className="mt-0.5 rounded border-border bg-card text-cyan-500 focus:ring-cyan-500 h-4 w-4"
              />
              <label htmlFor="persistKeySetting" className="text-xs text-muted-foreground cursor-pointer leading-snug">
                <span className="font-semibold text-foreground">
                  Persist API key locally in this browser (IndexedDB & LocalStorage)
                </span>
                <br />
                If left unchecked, your key will be retained only in session memory and cleared when the window is closed.
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Section: Google Identity & OAuth */}
        <Card className="border-border/80">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-base font-semibold">
                  Google Identity Services (OAuth)
                </CardTitle>
              </div>
              {googleClientId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {googleClientId === ENV_GOOGLE_CLIENT_ID ? 'Loaded from .env' : 'Custom Configured'}
                </span>
              )}
            </div>
            <CardDescription className="text-xs">
              Client configuration for Google sign-in on the login screen
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Google Client ID
              </label>
              <Input
                placeholder="xyz.apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                Detected from <code className="text-cyan-400 font-mono">.env</code> (<code className="text-cyan-400 font-mono">GOOGLE_CLIENT_ID</code>). Used by Google Identity Services SDK to render the sign-in button.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Google Cloud Console Configuration:</p>
              <p className="leading-relaxed">
                Ensure <code className="text-cyan-300 font-mono">http://localhost:5173</code> is listed under <strong>Authorized JavaScript origins</strong> in your Google Cloud OAuth 2.0 Client credentials.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Gemini Model Selection */}
        <Card className="border-border/80">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-violet-400" />
              <CardTitle className="text-base font-semibold">
                Gemini Model Selection
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Select or customize the active Google Gemini model ID
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_MODELS.map((m) => {
                const isSelected = selectedModel === m.id && !customModelId;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      setCustomModelId('');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/10 shadow-sm'
                        : 'border-border/70 hover:border-border bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{m.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-cyan-300">
                        {m.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground block mt-1">
                      {m.id}
                    </span>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Custom Model Override (Optional)
              </label>
              <Input
                placeholder="e.g. gemini-2.5-flash or experimental model ID"
                value={customModelId}
                onChange={(e) => setCustomModelId(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Leave empty to use the selected standard model above.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Interview Defaults */}
        <Card className="border-border/80">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-base font-semibold">
                Default Interview Parameters
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Pre-populated settings when launching a new technical interview
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Default Duration
                </label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs font-medium focus-visible:outline-none"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Default Difficulty
                </label>
                <select
                  value={defaultDifficulty}
                  onChange={(e) => setDefaultDifficulty(e.target.value as Difficulty)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs font-medium focus-visible:outline-none"
                >
                  {DIFFICULTY_LEVELS.map((dl) => (
                    <option key={dl.id} value={dl.id}>
                      {dl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Default Topics Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-foreground">
                  Default Technical Topics ({defaultTopics.length} selected)
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {TECHNICAL_TOPICS.map((topic) => {
                  const isChecked = defaultTopics.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`p-2 rounded-lg border cursor-pointer select-none flex items-center gap-2.5 transition-colors ${
                        isChecked
                          ? 'border-cyan-500/50 bg-cyan-950/20 text-foreground'
                          : 'border-border/60 bg-card/40 text-muted-foreground opacity-75'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-border text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5"
                      />
                      <span className="truncate">{topic.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Theme Preferences */}
        <Card className="border-border/80">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-base font-semibold">Appearance & Theme</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-3.5 rounded-xl border text-center transition-all capitalize font-semibold text-xs flex items-center justify-center gap-2 ${
                    settings.theme === t
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                      : 'border-border/70 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {t === 'dark' && <Moon className="h-4 w-4" />}
                  {t === 'light' && <Sun className="h-4 w-4" />}
                  {t === 'system' && <Cpu className="h-4 w-4" />}
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Local Data Management (Export / Import / Clear) */}
        <Card className="border-border/80">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base font-semibold">
                Local Database & Backup Management
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Manage IndexedDB sessions, evaluations, and reports stored in this browser
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Storage Boundary:</strong> All interviews are stored inside your browser's IndexedDB. Data does not synchronize across separate browsers or incognito profiles unless exported and imported.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportBackup}
                className="text-xs flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export Local Backup (JSON)</span>
              </Button>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5 text-violet-400" />
                  <span>Import Backup (JSON)</span>
                </Button>
              </label>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsClearDataModalOpen(true)}
                className="text-xs flex items-center gap-1.5 ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Local Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Button type="submit" size="lg" className="text-xs sm:text-sm font-semibold">
            Save All Settings
          </Button>
        </div>
      </form>

      {/* Clear Data Modal */}
      <Modal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        title="Clear Local Database"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            This will permanently erase all saved interview sessions, questions, evaluations, DSA submissions, and generated reports stored in IndexedDB on this browser.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearDataModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
            >
              Permanently Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

