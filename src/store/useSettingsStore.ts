import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '@/services/db';
import { setApiKey, getApiKey, isKeyPersisted, clearApiKey } from '@/services/storage/keyStorage';
import { setAIModel } from '@/services/ai';
import { ENV_GOOGLE_CLIENT_ID } from '@/lib/env';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  loadSettings: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateApiKey: (key: string, persist: boolean) => Promise<void>;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    ...DEFAULT_SETTINGS,
    geminiApiKey: getApiKey(),
    saveKeyLocally: isKeyPersisted(),
  },
  isLoading: true,

  loadSettings: async () => {
    try {
      const dbSettings = await getSettings();
      const currentKey = getApiKey();
      const persisted = isKeyPersisted();

      const merged: AppSettings = {
        ...dbSettings,
        googleClientId: dbSettings.googleClientId || ENV_GOOGLE_CLIENT_ID || '',
        geminiApiKey: currentKey || dbSettings.geminiApiKey || '',
        saveKeyLocally: persisted || dbSettings.saveKeyLocally,
      };

      if (merged.geminiApiKey) {
        setApiKey(merged.geminiApiKey, merged.saveKeyLocally);
      }
      if (merged.geminiModel) {
        setAIModel(merged.geminiModel);
      }

      // Apply theme
      applyTheme(merged.theme);

      set({ settings: merged, isLoading: false });
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };

    if (newSettings.geminiModel) {
      setAIModel(newSettings.geminiModel);
    }
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }

    set({ settings: updated });
    await saveSettings(updated);
  },

  updateApiKey: async (key: string, persist: boolean) => {
    const current = get().settings;
    if (key.trim()) {
      setApiKey(key, persist);
    } else {
      clearApiKey();
    }

    const updated: AppSettings = {
      ...current,
      geminiApiKey: key.trim(),
      saveKeyLocally: persist,
    };

    set({ settings: updated });
    await saveSettings({
      geminiApiKey: persist ? key.trim() : '',
      saveKeyLocally: persist,
    });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    get().updateSettings({ theme });
  },
}));

function applyTheme(theme: 'dark' | 'light' | 'system') {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  } else if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
}
