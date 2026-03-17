import { apiClient } from '@/services/api/client';
import { UserRole } from '@/types/domain';

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type AuthAuditEvent = {
  id: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT';
  username: string;
  role?: UserRole;
  message: string;
  at: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export function login(payload: LoginRequest) {
  return apiClient.post<LoginResponse>('/auth/login', payload);
}

export function getMe() {
  return apiClient.get<{ user: AuthUser }>('/auth/me');
}

export function logout() {
  return apiClient.post<{ ok: boolean; message: string }>('/auth/logout');
}

export function getAuditLog() {
  return apiClient.get<{ items: AuthAuditEvent[] }>('/auth/audit-log');
}

export function resetDemoData() {
  return apiClient.post<{ ok: boolean; message: string }>('/auth/reset-demo');
}
