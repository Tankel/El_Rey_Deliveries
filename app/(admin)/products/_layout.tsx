import { Stack } from 'expo-router';
import { UnifiedHeaderBack } from '@/navigation/UnifiedHeaderBack';

export default function AdminProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#111827',
        headerTitleStyle: { color: '#111827', fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Productos',
          headerBackButtonDisplayMode: 'default',
          animation: 'slide_from_right',
          headerLeft: () => <UnifiedHeaderBack label="Inicio" fallbackHref="/(admin)/(tabs)/dashboard" />,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
