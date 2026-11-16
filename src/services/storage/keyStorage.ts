// Key storage management with in-memory fallback and security warnings
import { ENV_GEMINI_API_KEY } from '@/lib/env';

let inMemoryApiKey: string = '';

const LOCAL_STORAGE_KEY = 'interviewpilot_gemini_key';

export function setApiKey(key: string, persist: boolean = false): void {
  const trimmed = key.trim();
  inMemoryApiKey = trimmed;

  if (persist && trimmed) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, trimmed);
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  } else {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }
}

export function getApiKey(): string {
  if (inMemoryApiKey) {
    return inMemoryApiKey;
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      inMemoryApiKey = saved;
      return saved;
    }
  } catch (e) {
    // ignore
  }

  // Fall back to environment variable if configured in .env
  if (ENV_GEMINI_API_KEY) {
    inMemoryApiKey = ENV_GEMINI_API_KEY;
    return ENV_GEMINI_API_KEY;
  }

  return '';
}

export function clearApiKey(): void {
  inMemoryApiKey = '';
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

export function isKeyPersisted(): boolean {
  try {
    return !!localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch {
    return false;
  }
}

export function isEnvKey(): boolean {
  const current = getApiKey();
  return !!(current && current === ENV_GEMINI_API_KEY);
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return '********';
  return `${key.slice(0, 6)}...${key.slice(-6)}`;
}
