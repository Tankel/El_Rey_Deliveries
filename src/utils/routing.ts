import { UserRole } from '@/types/domain';

export function getHomeRouteByRole(role: UserRole): string {
  if (role === 'CLIENT') {
    return '/(client)/home';
  }
  if (role === 'DRIVER') {
    return '/(driver)/deliveries';
  }
  return '/(admin)/dashboard';
}
