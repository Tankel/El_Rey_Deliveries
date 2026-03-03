import { Stack } from 'expo-router';
import { es } from '@/i18n/es';

export default function ClientHomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: es.navigation.clientHome, headerShown: false }}
      />
      <Stack.Screen
        name="products/[id]"
        options={{
          title: es.navigation.productDetail,
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
