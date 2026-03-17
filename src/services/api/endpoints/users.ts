import { apiClient } from '@/services/api/client';
import { AdminUser, AdminUserInput, AdminUserUpdate } from '@/models/AdminUser';

export function listUsers() {
  return apiClient.get<{ items: AdminUser[] }>('/users');
}

export function createUser(payload: AdminUserInput) {
  return apiClient.post<{ ok: boolean; message: string; user: AdminUser }>('/users', payload);
}

export function updateUser(userId: string, payload: AdminUserUpdate) {
  return apiClient.put<{ ok: boolean; message: string; user: AdminUser }>(`/users/${userId}`, payload);
}

export function deleteUser(userId: string) {
  return apiClient.delete<{ ok: boolean; message: string }>(`/users/${userId}`);
}
