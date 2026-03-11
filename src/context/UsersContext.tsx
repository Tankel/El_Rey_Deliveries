import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { hashPassword, isPasswordHashed } from '@/core/security/password';
import { AdminUser, AdminUserInput, AdminUserUpdate } from '@/models/AdminUser';

type ActionResult = {
  ok: boolean;
  message: string;
};

type UsersContextValue = {
  users: AdminUser[];
  isHydrated: boolean;
  createUser: (payload: AdminUserInput) => Promise<ActionResult>;
  updateUser: (userId: string, payload: AdminUserUpdate) => Promise<ActionResult>;
  deleteUser: (userId: string) => ActionResult;
  resetToDemoUsers: () => Promise<ActionResult>;
};

const USERS_STORAGE_KEY = 'mvp.admin.users';
const UsersContext = createContext<UsersContextValue | undefined>(undefined);

const USERS_SEED: AdminUser[] = [
  {
    id: 'admin-demo',
    username: 'admin-demo',
    password: 'admin123',
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
    password: 'cliente123',
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
    password: 'driver123',
    fullName: 'Juan Perez',
    email: 'driver-juan@elrey.local',
    phone: '+52 555 000 0003',
    role: 'DRIVER',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

function buildUsersSeed(): AdminUser[] {
  const createdAt = new Date().toISOString();
  return USERS_SEED.map((item) => ({ ...item, createdAt }));
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function normalizeUser(user: AdminUser): Promise<AdminUser> {
  const normalizedPassword = user.password?.trim();
  if (!normalizedPassword) {
    return {
      ...user,
      password: await hashPassword(`invalid-${user.id}`),
    };
  }

  if (isPasswordHashed(normalizedPassword)) {
    return {
      ...user,
      password: normalizedPassword,
    };
  }

  return {
    ...user,
    password: await hashPassword(normalizedPassword),
  };
}

export function UsersProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<AdminUser[]>(buildUsersSeed());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await jsonStorage.read<AdminUser[]>(USERS_STORAGE_KEY, buildUsersSeed());
      const normalizedUsers = await Promise.all(stored.map((item) => normalizeUser(item)));
      setUsers(normalizedUsers);
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
      createUser: async (payload: AdminUserInput) => {
        if (!payload.username.trim()) {
          return { ok: false, message: 'El username es obligatorio.' };
        }
        if (!payload.fullName.trim()) {
          return { ok: false, message: 'El nombre completo es obligatorio.' };
        }
        if (!payload.password.trim()) {
          return { ok: false, message: 'La contraseña es obligatoria.' };
        }
        if (payload.password.trim().length < 6) {
          return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
        }

        const username = payload.username.trim().toLowerCase();
        const exists = users.some((user) => user.username === username);
        if (exists) {
          return { ok: false, message: 'Ese username ya existe.' };
        }
        const passwordHash = await hashPassword(payload.password.trim());

        const next: AdminUser = {
          ...payload,
          id: slugify(username) || `user-${Date.now()}`,
          username,
          password: passwordHash,
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [next, ...prev]);
        return { ok: true, message: 'Usuario creado.' };
      },
      updateUser: async (userId: string, payload: AdminUserUpdate) => {
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

        if (payload.password?.trim() && payload.password.trim().length < 6) {
          return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
        }
        const passwordHash = payload.password?.trim()
          ? await hashPassword(payload.password.trim())
          : current.password;

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
                  password: passwordHash,
                }
              : user,
          ),
        );
        return { ok: true, message: 'Usuario actualizado.' };
      },
      deleteUser: (userId: string) => {
        const target = users.find((user) => user.id === userId);
        if (!target) {
          return { ok: false, message: 'Usuario no encontrado.' };
        }

        if (target.role === 'ADMIN') {
          const activeAdmins = users.filter(
            (user) => user.role === 'ADMIN' && user.isActive && user.id !== userId,
          ).length;
          if (activeAdmins === 0) {
            return { ok: false, message: 'No puedes eliminar al ultimo admin activo.' };
          }
        }

        setUsers((prev) => prev.filter((user) => user.id !== userId));
        return { ok: true, message: 'Usuario eliminado.' };
      },
      resetToDemoUsers: async () => {
        const demoUsers = await Promise.all(buildUsersSeed().map((item) => normalizeUser(item)));
        setUsers(demoUsers);
        return { ok: true, message: 'Usuarios demo restaurados.' };
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
