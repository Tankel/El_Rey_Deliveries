import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';
import { standardStackScreenOptions } from '@/navigation/stackOptions';

export default function ClientOrdersLayout() {
  return (
    <Stack screenOptions={standardStackScreenOptions}>
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
