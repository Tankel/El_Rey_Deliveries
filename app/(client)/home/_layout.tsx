import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';

export default function ClientHomeLayout() {
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
        options={{ title: es.navigation.clientHome, headerShown: false }}
      />
      <Stack.Screen
        name="products/[id]"
        options={{
          title: es.navigation.productDetail,
          headerLeft: () => <UnifiedHeaderBack label="Inicio" fallbackHref="/(client)/home" />,
          headerBackVisible: false,
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
