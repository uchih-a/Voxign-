export type Role = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: { id: number; name: Role };
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface RefreshRequest {
  refresh_token: string;
}
