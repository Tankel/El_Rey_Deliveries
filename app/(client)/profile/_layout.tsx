import { Stack } from 'expo-router';
import { es } from '@/i18n/es';

export default function ClientProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: es.navigation.profile, headerShown: false }}
      />
      <Stack.Screen
        name="billing"
        options={{
          title: 'Facturas',
          headerBackButtonDisplayMode: 'default',
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          title: 'Soporte y ayuda',
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
