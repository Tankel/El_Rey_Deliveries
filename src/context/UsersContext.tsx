import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { AdminUser, AdminUserInput, AdminUserUpdate } from '@/models/AdminUser';

type ActionResult = {
  ok: boolean;
  message: string;
};

type UsersContextValue = {
  users: AdminUser[];
  isHydrated: boolean;
  createUser: (payload: AdminUserInput) => ActionResult;
  updateUser: (userId: string, payload: AdminUserUpdate) => ActionResult;
  deleteUser: (userId: string) => ActionResult;
};

const USERS_STORAGE_KEY = 'mvp.admin.users';
const UsersContext = createContext<UsersContextValue | undefined>(undefined);

const USERS_SEED: AdminUser[] = [
  {
    id: 'admin-demo',
    username: 'admin-demo',
    fullName: 'Administrador Demo',
    email: 'admin@elrey.local',
    phone: '+52 555 000 0001',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cliente-demo',
    username: 'cliente-demo',
    fullName: 'Cliente Demo',
    email: 'cliente@elrey.local',
    phone: '+52 555 000 0002',
    role: 'CLIENT',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'driver-juan',
    username: 'driver-juan',
    fullName: 'Juan Perez',
    email: 'driver-juan@elrey.local',
    phone: '+52 555 000 0003',
    role: 'DRIVER',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function UsersProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<AdminUser[]>(USERS_SEED);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await jsonStorage.read<AdminUser[]>(USERS_STORAGE_KEY, USERS_SEED);
      setUsers(stored);
      setIsHydrated(true);
    };
    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(USERS_STORAGE_KEY, users);
  }, [isHydrated, users]);

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      isHydrated,
      createUser: (payload: AdminUserInput) => {
        if (!payload.username.trim()) {
          return { ok: false, message: 'El username es obligatorio.' };
        }
        if (!payload.fullName.trim()) {
          return { ok: false, message: 'El nombre completo es obligatorio.' };
        }

        const username = payload.username.trim().toLowerCase();
        const exists = users.some((user) => user.username === username);
        if (exists) {
          return { ok: false, message: 'Ese username ya existe.' };
        }

        const next: AdminUser = {
          ...payload,
          id: slugify(username) || `user-${Date.now()}`,
          username,
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [next, ...prev]);
        return { ok: true, message: 'Usuario creado.' };
      },
      updateUser: (userId: string, payload: AdminUserUpdate) => {
        const current = users.find((user) => user.id === userId);
        if (!current) {
          return { ok: false, message: 'Usuario no encontrado.' };
        }

        const nextUsername = payload.username?.trim().toLowerCase();
        if (nextUsername) {
          const duplicate = users.some((user) => user.id !== userId && user.username === nextUsername);
          if (duplicate) {
            return { ok: false, message: 'Ese username ya existe.' };
          }
        }

        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  ...payload,
                  username: nextUsername ?? user.username,
                  fullName: payload.fullName?.trim() ?? user.fullName,
                  email: payload.email?.trim() ?? user.email,
                  phone: payload.phone?.trim() ?? user.phone,
                }
              : user,
          ),
        );
        return { ok: true, message: 'Usuario actualizado.' };
      },
      deleteUser: (userId: string) => {
        const exists = users.some((user) => user.id === userId);
        if (!exists) {
          return { ok: false, message: 'Usuario no encontrado.' };
        }
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        return { ok: true, message: 'Usuario eliminado.' };
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
