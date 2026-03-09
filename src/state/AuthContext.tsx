import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { useUsers } from '@/context/UsersContext';
import { UserRole } from '@/types/domain';

type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
};

type SignInPayload = {
  username: string;
  password: string;
};

type AuthAuditAction = 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT';

type AuthAuditEvent = {
  id: string;
  action: AuthAuditAction;
  username: string;
  role?: UserRole;
  message: string;
  at: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  auditLog: AuthAuditEvent[];
  isAuthenticated: boolean;
  isHydrated: boolean;
  signIn: (payload: SignInPayload) => ActionResult;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = 'mvp.auth.session';
const AUTH_AUDIT_STORAGE_KEY = 'mvp.auth.audit-log';

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function buildAuditEvent(
  action: AuthAuditAction,
  username: string,
  message: string,
  role?: UserRole,
): AuthAuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    action,
    username,
    role,
    message,
    at: new Date().toISOString(),
  };
}

function toAuthUser(payload: { id: string; username: string; role: UserRole; fullName: string }): AuthUser {
  return {
    id: payload.id,
    username: payload.username,
    role: payload.role,
    fullName: payload.fullName,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const { users, isHydrated: areUsersHydrated } = useUsers();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [auditLog, setAuditLog] = useState<AuthAuditEvent[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const [storedUser, storedAudit] = await Promise.all([
        jsonStorage.read<AuthUser | null>(AUTH_STORAGE_KEY, null),
        jsonStorage.read<AuthAuditEvent[]>(AUTH_AUDIT_STORAGE_KEY, []),
      ]);
      setUser(storedUser);
      setAuditLog(storedAudit);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(AUTH_STORAGE_KEY, user);
  }, [isHydrated, user]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(AUTH_AUDIT_STORAGE_KEY, auditLog);
  }, [auditLog, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !areUsersHydrated || !user) {
      return;
    }
    const sourceUser = users.find((item) => item.id === user.id);
    if (!sourceUser || !sourceUser.isActive) {
      setAuditLog((prev) => [
        buildAuditEvent(
          'LOGOUT',
          user.username,
          'Sesion cerrada por usuario eliminado/inactivo.',
          user.role,
        ),
        ...prev,
      ]);
      setUser(null);
      return;
    }

    if (
      sourceUser.username !== user.username ||
      sourceUser.role !== user.role ||
      sourceUser.fullName !== user.fullName
    ) {
      setUser(toAuthUser(sourceUser));
    }
  }, [areUsersHydrated, isHydrated, user, users]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      auditLog,
      isAuthenticated: Boolean(user),
      isHydrated: isHydrated && areUsersHydrated,
      signIn: (payload: SignInPayload) => {
        const username = normalizeUsername(payload.username);
        if (!username) {
          return { ok: false, message: 'Ingresa usuario.' };
        }
        if (!payload.password.trim()) {
          return { ok: false, message: 'Ingresa contraseña.' };
        }

        const target = users.find((item) => item.username === username);
        if (!target) {
          const audit = buildAuditEvent('LOGIN_FAILED', username, 'Usuario no encontrado.');
          setAuditLog((prev) => [audit, ...prev]);
          return { ok: false, message: 'Usuario o contraseña incorrectos.' };
        }
        if (!target.isActive) {
          const audit = buildAuditEvent('LOGIN_FAILED', username, 'Usuario inactivo.', target.role);
          setAuditLog((prev) => [audit, ...prev]);
          return { ok: false, message: 'Tu usuario esta inactivo.' };
        }
        if (target.password !== payload.password) {
          const audit = buildAuditEvent('LOGIN_FAILED', username, 'Contraseña incorrecta.', target.role);
          setAuditLog((prev) => [audit, ...prev]);
          return { ok: false, message: 'Usuario o contraseña incorrectos.' };
        }

        setUser(toAuthUser(target));
        const audit = buildAuditEvent('LOGIN_SUCCESS', username, 'Inicio de sesion exitoso.', target.role);
        setAuditLog((prev) => [audit, ...prev]);
        return { ok: true, message: 'Bienvenido.' };
      },
      signOut: () => {
        if (user) {
          const audit = buildAuditEvent('LOGOUT', user.username, 'Cierre de sesion manual.', user.role);
          setAuditLog((prev) => [audit, ...prev]);
        }
        setUser(null);
      },
    }),
    [areUsersHydrated, auditLog, isHydrated, user, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
