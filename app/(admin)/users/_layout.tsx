import { Stack } from 'expo-router';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';
import { standardStackScreenOptions } from '@/navigation/stackOptions';

export default function AdminUsersLayout() {
  return (
    <Stack screenOptions={standardStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Usuarios',
          headerBackButtonDisplayMode: 'default',
          animation: 'slide_from_right',
          headerLeft: () => <UnifiedHeaderBack label="Inicio" fallbackHref="/(admin)/(tabs)/dashboard" />,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
