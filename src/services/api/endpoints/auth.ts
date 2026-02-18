import { apiClient } from '@/services/api/client';
import { UserRole } from '@/types/domain';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
};

export function login(payload: LoginRequest) {
  return apiClient.post<LoginResponse>('/auth/login', payload);
}
