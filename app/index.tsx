import { Redirect } from 'expo-router';
import { useAuth } from '@/state/AuthContext';
import { getHomeRouteByRole } from '@/utils/routing';

export default function IndexScreen() {
  const { user, isAuthenticated, isHydrated } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getHomeRouteByRole(user.role)} />;
}
