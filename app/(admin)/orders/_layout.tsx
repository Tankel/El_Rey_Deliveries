import { Stack } from 'expo-router';
import { es } from '@/i18n/es';

export default function AdminOrdersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: es.navigation.adminOrders,
          headerBackButtonDisplayMode: 'default',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: es.navigation.adminOrderDetail,
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
