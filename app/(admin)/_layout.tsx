import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function AdminLayout() {
  return (
    <RoleGate allow={['ADMIN']}>
      <Stack>
        <Stack.Screen name="dashboard" options={{ title: es.navigation.adminDashboard }} />
        <Stack.Screen name="orders/index" options={{ title: es.navigation.adminOrders }} />
        <Stack.Screen name="orders/[id]" options={{ title: es.navigation.adminOrderDetail }} />
      </Stack>
    </RoleGate>
  );
}
