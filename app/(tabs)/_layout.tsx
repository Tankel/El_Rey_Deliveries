import { Redirect } from 'expo-router';
import { useAuth } from '@/state/AuthContext';
import { getHomeRouteByRole } from '@/utils/routing';

export default function TabsLayout() {
  const { user, isHydrated } = useAuth();

  if (!isHydrated) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getHomeRouteByRole(user.role)} />;
}
