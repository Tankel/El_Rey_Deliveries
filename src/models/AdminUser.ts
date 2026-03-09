import { UserRole } from '@/types/domain';

export type AdminUser = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type AdminUserInput = Omit<AdminUser, 'id' | 'createdAt'>;

export type AdminUserUpdate = Partial<AdminUserInput>;
