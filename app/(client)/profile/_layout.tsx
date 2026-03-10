import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';

export default function ClientProfileLayout() {
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
