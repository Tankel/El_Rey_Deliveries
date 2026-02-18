import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function ClientLayout() {
  return (
    <RoleGate allow={['CLIENT']}>
      <Stack>
        <Stack.Screen name="home" options={{ title: es.navigation.clientHome }} />
        <Stack.Screen name="orders/index" options={{ title: es.navigation.myOrders }} />
        <Stack.Screen name="orders/[id]" options={{ title: es.navigation.orderDetail }} />
      </Stack>
    </RoleGate>
  );
}
