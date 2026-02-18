import { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/state/AuthContext';
import { UserRole } from '@/types/domain';
import { getHomeRouteByRole } from '@/utils/routing';

type Props = PropsWithChildren<{
  allow: UserRole[];
}>;

export function RoleGate({ allow, children }: Props) {
  const { user, isAuthenticated, isHydrated } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!allow.includes(user.role)) {
    return <Redirect href={getHomeRouteByRole(user.role)} />;
  }

  return children;
}
