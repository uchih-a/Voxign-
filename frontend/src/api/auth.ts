import client from './client';
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthTokens> => {
    const response = await client.post<AuthTokens>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthTokens> => {
    const response = await client.post<AuthTokens>('/auth/register', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await client.post<AuthTokens>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    const response = await client.get<User>('/users/me');
    return response.data;
  },
};
