import axios, { AxiosInstance } from 'axios';
import { tokenManager } from '../utils/tokenManager';
import { authStore } from '../stores/authStore';
import type { AuthTokens } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add authorization header
client.interceptors.request.use((config) => {
  const accessToken = authStore.getState().accessToken;

  // 🔍 ADD THESE:
  console.log("[client.ts] →", config.method?.toUpperCase(), config.url);
  console.log("[client.ts] accessToken present:", !!accessToken);
  if (accessToken) {
    console.log("[client.ts] Token preview:", accessToken.slice(0, 30) + "...");
  } else {
    console.warn("[client.ts] ⚠️ No access token — Authorization header will NOT be set");
  }

  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Response interceptor — handle 401 and refresh token
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth endpoints
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch(() => {
            authStore.getState().clearAuth();
            return Promise.reject(error);
          });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefresh();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<AuthTokens>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { access_token } = response.data;
        authStore.getState().setTokens(access_token, refreshToken);
        client.defaults.headers.common.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        return client(originalRequest);
      } catch (err) {
        processQueue(err);
        authStore.getState().clearAuth();
        tokenManager.clearAllTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
