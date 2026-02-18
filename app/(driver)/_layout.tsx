import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function DriverLayout() {
  return (
    <RoleGate allow={['DRIVER']}>
      <Stack>
        <Stack.Screen name="deliveries/index" options={{ title: es.navigation.driverDeliveries }} />
        <Stack.Screen
          name="deliveries/[id]"
          options={{ title: es.navigation.driverDeliveryDetail }}
        />
      </Stack>
    </RoleGate>
  );
}
