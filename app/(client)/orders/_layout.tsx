import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';

export default function ClientOrdersLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        gestureEnabled: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
        headerTitleStyle: { color: '#111827', fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: es.navigation.myOrders, headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: es.navigation.orderDetail,
          headerLeft: () => <UnifiedHeaderBack label="Pedidos" fallbackHref="/(client)/orders" />,
          headerBackVisible: false,
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
