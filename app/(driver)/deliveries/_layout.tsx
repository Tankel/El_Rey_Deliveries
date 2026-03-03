import { Stack } from 'expo-router';
import { es } from '@/i18n/es';

export default function DriverDeliveriesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: es.navigation.driverDeliveries }} />
      <Stack.Screen name="[id]" options={{ title: es.navigation.driverDeliveryDetail }} />
    </Stack>
  );
}
