import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';
import { standardStackScreenOptions } from '@/navigation/stackOptions';

export default function ClientProfileLayout() {
  return (
    <Stack screenOptions={standardStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: es.navigation.profile, headerShown: false }}
      />
      <Stack.Screen
        name="billing"
        options={{
          title: 'Facturas',
          headerLeft: () => <UnifiedHeaderBack label="Perfil" fallbackHref="/(client)/profile" />,
          headerBackVisible: false,
          headerBackButtonDisplayMode: 'default',
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          title: 'Soporte y ayuda',
          headerLeft: () => <UnifiedHeaderBack label="Perfil" fallbackHref="/(client)/profile" />,
          headerBackVisible: false,
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
