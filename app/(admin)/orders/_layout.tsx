import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';

export default function AdminOrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
        headerTitleStyle: { color: '#111827', fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: es.navigation.adminOrders,
          headerBackButtonDisplayMode: 'default',
          animation: 'slide_from_right',
          headerLeft: () => <UnifiedHeaderBack label="Inicio" fallbackHref="/(admin)/(tabs)/dashboard" />,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: es.navigation.adminOrderDetail,
          headerLeft: () => <UnifiedHeaderBack label="Pedidos" fallbackHref="/(admin)/orders" />,
          headerBackVisible: false,
          headerBackButtonDisplayMode: 'default',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
