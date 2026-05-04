import { create } from 'zustand';
import type { User, Role } from '../types/auth';
import { tokenManager } from '../utils/tokenManager';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
  getRole: () => Role | null;
}

export const authStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: false,

  setTokens: (access: string, refresh: string) => {
    tokenManager.setRefresh(refresh);
    set({ accessToken: access });
  },

  setUser: (user: User) => {
    set({ user });
  },

  clearAuth: () => {
    tokenManager.clearAllTokens();
    set({ accessToken: null, user: null });
  },

  isAdmin: () => {
    const state = get();
    return state.user?.role?.name === 'admin';
  },

  isAuthenticated: () => {
    const state = get();
    return state.accessToken !== null && state.user !== null;
  },

  getRole: () => {
    const state = get();
    return state.user?.role?.name ?? null;
  },
}));
