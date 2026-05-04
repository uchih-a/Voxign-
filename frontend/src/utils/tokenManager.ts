const TOKEN_KEY = 'asl_refresh_token';

export const tokenManager = {
  getRefresh: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setRefresh: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearRefresh: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  clearAllTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};
