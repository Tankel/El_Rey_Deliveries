import { apiClient } from '@/services/api/client';
import { AccountProfile, AccountProfileUpdate, SavedAddress } from '@/models/AccountProfile';

export function getMyProfile() {
  return apiClient.get<{ profile: AccountProfile }>('/profiles/me');
}

export function updateMyProfile(payload: AccountProfileUpdate) {
  return apiClient.put<{ ok: boolean; message: string; profile: AccountProfile }>('/profiles/me', payload);
}

export function addMyAddress(payload: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>) {
  return apiClient.post<{ ok: boolean; message: string; profile: AccountProfile }>('/profiles/me/addresses', payload);
}

export function removeMyAddress(addressId: string) {
  return apiClient.delete<{ ok: boolean; message: string; profile: AccountProfile }>(`/profiles/me/addresses/${addressId}`);
}

export function setMyDefaultAddress(addressId: string) {
  return apiClient.patch<{ ok: boolean; message: string; profile: AccountProfile }>(`/profiles/me/addresses/${addressId}/default`);
}
