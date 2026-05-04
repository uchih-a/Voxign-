import client from './client';
import type { User, Role } from '../types/auth';
import type { PaginatedResponse } from '../types/api';

export interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await client.get<User>('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await client.put<User>('/users/me', data);
    return response.data;
  },

  updatePassword: async (data: UpdatePasswordRequest): Promise<void> => {
    await client.put('/users/me/password', data);
  },

  listUsers: async (
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<User>> => {
    const response = await client.get<PaginatedResponse<User>>('/users/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await client.get<User>(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateProfileRequest): Promise<User> => {
    const response = await client.put<User>(`/users/${id}`, data);
    return response.data;
  },

  updateUserRole: async (id: string, role: Role): Promise<User> => {
    const response = await client.put<User>(`/users/${id}/role`, { role });
    return response.data;
  },

  deactivateUser: async (id: string): Promise<void> => {
    await client.delete(`/users/${id}`);
  },
};
