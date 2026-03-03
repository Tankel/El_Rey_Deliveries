import { Stack } from 'expo-router';
import { es } from '@/i18n/es';

export default function ClientOrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: es.navigation.myOrders }} />
      <Stack.Screen name="[id]" options={{ title: es.navigation.orderDetail }} />
    </Stack>
  );
}
