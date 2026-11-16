import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyRound, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const { settings, updateApiKey } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [saveLocally, setSaveLocally] = useState(settings.saveKeyLocally);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateApiKey(apiKeyInput.trim(), saveLocally);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-cyan-400" />
          <span>Configure Gemini API Key</span>
        </div>
      }
      description="Enter your Google Gemini API key to enable live AI question generation, DSA code reviews, and evaluation reports."
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Security Notice Box */}
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200/90 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Browser-Based Security Notice</span>
          </div>
          <p className="leading-relaxed">
            This is a client-side web application running entirely in your browser. Any API key entered here communicates directly from your browser to Google Gemini API endpoints without passing through any third-party backend servers.
          </p>
          <p className="leading-relaxed font-medium">
            Keys can be kept strictly in memory for this session, or saved into your browser's local storage.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Gemini API Key
          </label>
          <Input
            type="password"
            placeholder="AIzaSy..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="font-mono text-sm"
            autoFocus
          />
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>Get an API key from Google AI Studio</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              <span>Get API Key</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="saveLocallyCheck"
            checked={saveLocally}
            onChange={(e) => setSaveLocally(e.target.checked)}
            className="mt-0.5 rounded border-border bg-card text-cyan-500 focus:ring-cyan-500"
          />
          <label htmlFor="saveLocallyCheck" className="text-xs text-muted-foreground leading-snug cursor-pointer">
            <span className="font-semibold text-foreground">Save key locally in this browser</span>
            <br />
            If unchecked, the key will only be held in memory and will be erased when the tab closes.
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!apiKeyInput.trim()}>
            {isSaved ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                <span>Saved</span>
              </span>
            ) : (
              'Save Key & Continue'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

