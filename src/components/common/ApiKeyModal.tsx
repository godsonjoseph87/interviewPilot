import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Bot, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const { settings, updateApiKey } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateApiKey(apiKeyInput.trim(), true);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 600);
  };

  const isConnected = !!settings.geminiApiKey;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-accent-2-subtle border border-accent-2-border text-accent-2 flex items-center justify-center font-semibold shrink-0">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <span>Gemini AI Connection</span>
        </div>
      }
      description="Configure your Google Gemini API key to power adaptive questions and copilot assistance."
    >
      <form onSubmit={handleSave} className="space-y-4">
        {isConnected ? (
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card card-surface ai-surface text-caption">
            <div className="flex items-center gap-2 text-accent-2 font-medium">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-2" />
              </span>
              <span>AI Connected & Ready</span>
            </div>
            <span className="font-mono text-muted-foreground">Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3.5 rounded-lg border border-border bg-card card-surface ai-surface text-caption text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-muted-foreground mr-1" />
            <span>Not Connected — using calibrated local mocks</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-caption font-semibold text-foreground">
            API Key
          </label>
          <Input
            type="password"
            placeholder="Enter Gemini API key (AIzaSy...)"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="font-mono text-small"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!apiKeyInput.trim()}
          >
            {isSaved ? (
              <span className="flex items-center gap-1.5 text-success-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Saved</span>
              </span>
            ) : (
              'Save Key'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
