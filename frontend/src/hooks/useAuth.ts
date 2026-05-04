import { useCallback } from 'react';
import { authApi } from '../api/auth';
import { authStore } from '../stores/authStore';
import { tokenManager } from '../utils/tokenManager';

export const useAuth = () => {
  const loginMutation = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password });
    authStore.getState().setTokens(tokens.access_token, tokens.refresh_token);

    const user = await authApi.getProfile();
    authStore.getState().setUser(user);

    return { tokens, user };
  }, []);

  const registerMutation = useCallback(async (email: string, password: string, fullName: string) => {
    const tokens = await authApi.register({ email, password, full_name: fullName });
    authStore.getState().setTokens(tokens.access_token, tokens.refresh_token);

    const user = await authApi.getProfile();
    authStore.getState().setUser(user);

    return { tokens, user };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authStore.getState().clearAuth();
      tokenManager.clearAllTokens();
    }
  }, []);

  return {
    loginMutation,
    registerMutation,
    logout,
  };
};