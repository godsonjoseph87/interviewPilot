import { create } from 'zustand';
import type { UserProfile } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  signInWithGoogleCredential: (credential: string) => void;
  signInAsDemo: (name?: string, email?: string) => void;
  signOut: () => void;
  initAuth: () => void;
}

const AUTH_STORAGE_KEY = 'interviewpilot_auth_user';

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  initAuth: () => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        set({ isAuthenticated: true, user });
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      set({ isAuthenticated: true, user });
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      set({ isAuthenticated: false, user: null });
    }
  },

  signInWithGoogleCredential: (credential: string) => {
    try {
      // Decode JWT payload (standard Google GIS token format)
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      const user: UserProfile = {
        name: payload.name || 'Technical Interviewer',
        email: payload.email || '',
        picture: payload.picture,
        sub: payload.sub,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      set({ isAuthenticated: true, user });
    } catch (err) {
      console.error('Failed to parse Google credential token:', err);
      // Fallback demo sign in if token parsing failed
      const fallbackUser: UserProfile = {
        name: 'Technical Interviewer',
        email: 'interviewer@interviewpilot.ai',
      };
      set({ isAuthenticated: true, user: fallbackUser });
    }
  },

  signInAsDemo: (name = 'Senior Tech Interviewer', email = 'interviewer@engineering.org') => {
    const user: UserProfile = {
      name,
      email,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    set({ isAuthenticated: true, user });
  },

  signOut: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    set({ isAuthenticated: false, user: null });
  },
}));

