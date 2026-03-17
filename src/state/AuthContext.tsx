import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthAuditEvent,
  getAuditLog,
  getMe,
  login,
  logout,
} from '@/services/api/endpoints/auth';
import { clearSessionStore, loadSessionStore, saveSessionStore } from '@/state/sessionStore';
import { setApiAuthToken } from '@/services/api/client';
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

type ActionResult = {
  ok: boolean;
  message: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  auditLog: AuthAuditEvent[];
  isAuthenticated: boolean;
  isHydrated: boolean;
  signIn: (payload: SignInPayload) => Promise<ActionResult>;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(payload: { id: string; username: string; role: UserRole; fullName: string }): AuthUser {
  return {
    id: payload.id,
    username: payload.username,
    role: payload.role,
    fullName: payload.fullName,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [auditLog, setAuditLog] = useState<AuthAuditEvent[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshAuditLog = async (role?: UserRole) => {
    if (role !== 'ADMIN') {
      setAuditLog([]);
      return;
    }
    try {
      const response = await getAuditLog();
      setAuditLog(response.items);
    } catch {
      setAuditLog([]);
    }
  };

  const refreshAuthState = async () => {
    try {
      const stored = await loadSessionStore();
      if (!stored?.token) {
        setUser(null);
        setAuditLog([]);
        return;
      }

      setApiAuthToken(stored.token);
      const me = await getMe();
      const nextUser = toAuthUser(me.user);
      setUser(nextUser);
      await refreshAuditLog(nextUser.role);
    } catch {
      setApiAuthToken(null);
      setUser(null);
      setAuditLog([]);
      await clearSessionStore();
    }
  };

  useEffect(() => {
    const hydrate = async () => {
      await refreshAuthState();
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      auditLog,
      isAuthenticated: Boolean(user),
      isHydrated,
      refreshAuthState,
      signIn: async (payload: SignInPayload) => {
        if (!payload.username.trim()) {
          return { ok: false, message: 'Ingresa usuario.' };
        }
        if (!payload.password.trim()) {
          return { ok: false, message: 'Ingresa contrasena.' };
        }

        try {
          const response = await login({
            username: payload.username.trim().toLowerCase(),
            password: payload.password,
          });
          setApiAuthToken(response.token);
          await saveSessionStore(response.token);

          const nextUser = toAuthUser(response.user);
          setUser(nextUser);
          await refreshAuditLog(nextUser.role);
          return { ok: true, message: 'Bienvenido.' };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : 'No fue posible iniciar sesion.',
          };
        }
      },
      signOut: async () => {
        try {
          await logout();
        } catch {
          // Ignore logout network errors and clear local session anyway.
        }
        setApiAuthToken(null);
        setUser(null);
        setAuditLog([]);
        await clearSessionStore();
      },
    }),
    [auditLog, isHydrated, user],
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
