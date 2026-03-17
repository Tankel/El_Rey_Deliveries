import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AdminUser, AdminUserInput, AdminUserUpdate } from '@/models/AdminUser';
import {
  createUser as createUserRequest,
  deleteUser as deleteUserRequest,
  listUsers,
  updateUser as updateUserRequest,
} from '@/services/api/endpoints/users';
import { resetDemoData } from '@/services/api/endpoints/auth';
import { useAuth } from '@/state/AuthContext';

type ActionResult = {
  ok: boolean;
  message: string;
};

type UsersContextValue = {
  users: AdminUser[];
  isHydrated: boolean;
  refreshUsers: () => Promise<void>;
  createUser: (payload: AdminUserInput) => Promise<ActionResult>;
  updateUser: (userId: string, payload: AdminUserUpdate) => Promise<ActionResult>;
  deleteUser: (userId: string) => Promise<ActionResult>;
  resetToDemoUsers: () => Promise<ActionResult>;
};

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export function UsersProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshUsers = async () => {
    try {
      const response = await listUsers();
      setUsers(response.items);
    } catch {
      setUsers([]);
    } finally {
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    void refreshUsers();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      return;
    }
    void refreshUsers();
  }, [isAuthenticated, user?.id, user?.role]);

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      isHydrated,
      refreshUsers,
      createUser: async (payload) => {
        try {
          const response = await createUserRequest(payload);
          setUsers((prev) => [response.user, ...prev.filter((item) => item.id !== response.user.id)]);
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear usuario.' };
        }
      },
      updateUser: async (userId, payload) => {
        try {
          const response = await updateUserRequest(userId, payload);
          setUsers((prev) => prev.map((item) => (item.id === userId ? response.user : item)));
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar usuario.' };
        }
      },
      deleteUser: async (userId) => {
        try {
          const response = await deleteUserRequest(userId);
          setUsers((prev) => prev.filter((item) => item.id !== userId));
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo eliminar usuario.' };
        }
      },
      resetToDemoUsers: async () => {
        try {
          const response = await resetDemoData();
          await refreshUsers();
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudieron restaurar datos demo.' };
        }
      },
    }),
    [isHydrated, users],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used inside UsersProvider');
  }
  return context;
}
