import { Stack } from 'expo-router';
import { es } from '@/i18n/es';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';
import { standardStackScreenOptions } from '@/navigation/stackOptions';

export default function ClientHomeLayout() {
  return (
    <Stack screenOptions={standardStackScreenOptions}>
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
