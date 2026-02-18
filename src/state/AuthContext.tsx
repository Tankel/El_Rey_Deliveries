import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { UserRole } from '@/types/domain';

type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
};

type SignInPayload = {
  username: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  signIn: (payload: SignInPayload | string, roleArg?: UserRole) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = 'mvp.auth.session';

function createUserFromPayload(payload: SignInPayload): AuthUser {
  const fallbackUsername =
    payload.role === 'DRIVER' ? 'driver-juan' : payload.role === 'CLIENT' ? 'cliente-demo' : 'admin-demo';
  const normalizedUsername = payload.username.trim() || fallbackUsername;

  return {
    id: normalizedUsername.toLowerCase().replace(/\s+/g, '-'),
    username: normalizedUsername,
    role: payload.role,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const storedUser = await jsonStorage.read<AuthUser | null>(AUTH_STORAGE_KEY, null);
      setUser(storedUser);
      setIsHydrated(true);
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(AUTH_STORAGE_KEY, user);
  }, [isHydrated, user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isHydrated,
      signIn: (payload: SignInPayload | string, roleArg?: UserRole) => {
        if (typeof payload === 'string') {
          setUser(
            createUserFromPayload({
              username: payload,
              role: roleArg ?? 'ADMIN',
            }),
          );
          return;
        }

        setUser(createUserFromPayload(payload));
      },
      signOut: () => setUser(null),
    }),
    [isHydrated, user],
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
