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
        <div className="flex items-center gap-2">
          <Bot className={`h-5 w-5 ${isConnected ? 'text-emerald-500' : 'text-stone-400'}`} />
          <span>Gemini AI</span>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {isConnected ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Connected & Ready</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-border text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-stone-400" />
            <span>Not Connected</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            API Key
          </label>
          <Input
            type="password"
            placeholder="Enter Gemini API key (AIzaSy...)"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="font-mono text-sm"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-semibold rounded-lg"
          >
            Close
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!apiKeyInput.trim()}
            className="h-8 px-4 text-xs font-bold rounded-lg"
          >
            {isSaved ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="h-4 w-4" />
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
