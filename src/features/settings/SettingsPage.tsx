import React, { useState, useRef } from 'react';
import {
  Cpu,
  Sliders,
  Sun,
  Moon,
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  AVAILABLE_MODELS,
  DEFAULT_GEMINI_MODEL,
  DURATION_OPTIONS,
  DIFFICULTY_LEVELS,
  TECHNICAL_TOPICS,
} from '@/lib/constants';
import {
  exportDatabaseBackup,
  importDatabaseBackup,
  clearAllLocalData,
} from '@/services/db/exportImport';
import type { Difficulty } from '@/types';

export function SettingsPage() {
  const { settings, updateSettings, setTheme } = useSettingsStore();

  // Local Form States
  const [selectedModel, setSelectedModel] = useState(settings.geminiModel || DEFAULT_GEMINI_MODEL);
  const [customModelId, setCustomModelId] = useState('');

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

    // Save model and interview defaults
    const activeModel = customModelId.trim() ? customModelId.trim() : selectedModel;
    await updateSettings({
      geminiModel: activeModel,
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <PageHeader
        title="Application Settings"
        description="Configure model routing, default interview parameters, UI themes, and local storage backups."
        actions={
          saveSuccessMsg ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success-subtle border border-success-border text-success text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>{saveSuccessMsg}</span>
            </div>
          ) : undefined
        }
      />

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Gemini Model Selection */}
        <Card>
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
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
                    className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary-subtle text-foreground shadow-xs'
                        : 'border-border hover:border-primary/40 bg-surface-raised text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{m.name}</span>
                      <span
                        className={`text-caption font-mono font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-surface text-muted-foreground border border-border'
                        }`}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <span className="text-caption font-mono text-muted-foreground block mt-1">
                      {m.id}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-foreground">
                Custom Model Override (Optional)
              </label>
              <Input
                placeholder="e.g. gemini-3.8-flash or experimental model ID"
                value={customModelId}
                onChange={(e) => setCustomModelId(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-caption text-muted-foreground">
                Leave empty to use the selected standard model above.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Interview Defaults */}
        <Card>
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
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
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Default Technical Topics ({defaultTopics.length} selected)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {TECHNICAL_TOPICS.map((topic) => {
                  const isChecked = defaultTopics.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`p-2 rounded-lg border cursor-pointer select-none flex items-center gap-2.5 transition-colors ${
                        isChecked
                          ? 'border-primary bg-primary-subtle text-foreground shadow-xs'
                          : 'border-border bg-surface-raised text-muted-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-border text-primary focus:ring-ring accent-primary h-3.5 w-3.5"
                      />
                      <span className="truncate text-xs font-medium">{topic.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Theme Preferences */}
        <Card>
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-base font-semibold">Appearance & Theme</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-3 rounded-lg border text-center transition-colors capitalize font-semibold text-xs flex items-center justify-center gap-2 ${
                    settings.theme === t
                      ? 'border-primary bg-primary-subtle text-primary shadow-xs'
                      : 'border-border bg-surface-raised hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {t === 'dark' && <Moon className="h-4 w-4" />}
                  {t === 'light' && <Sun className="h-4 w-4 text-primary" />}
                  {t === 'system' && <Cpu className="h-4 w-4" />}
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Local Data Management (Export / Import / Clear) */}
        <Card>
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Local Database & Backup Management
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Manage IndexedDB sessions, evaluations, and reports stored in this browser
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="p-3.5 rounded-lg bg-primary-subtle border border-primary/20 flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
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
                leftIcon={<Download className="h-3.5 w-3.5 text-primary" />}
              >
                Export Local Backup (JSON)
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
                  leftIcon={<Upload className="h-3.5 w-3.5 text-primary" />}
                >
                  Import Backup (JSON)
                </Button>
              </label>

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setIsClearDataModalOpen(true)}
                className="ml-auto"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Clear All Local Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="submit" variant="primary" size="md">
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
          <p className="text-body text-muted-foreground leading-relaxed">
            This will permanently erase all saved interview sessions, questions, evaluations, DSA submissions, and generated reports stored in IndexedDB on this browser.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearDataModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
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
