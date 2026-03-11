import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';
import { standardStackScreenOptions } from '@/navigation/stackOptions';

export default function DriverDeliveriesLayout() {
  return (
    <Stack screenOptions={standardStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: es.navigation.driverDeliveries, headerShown: false }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: es.navigation.driverDeliveryDetail,
          headerLeft: () => <UnifiedHeaderBack label="Entregas" fallbackHref="/(driver)/deliveries" />,
          headerBackVisible: false,
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
