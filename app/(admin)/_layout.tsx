import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoleGate } from '@/navigation/RoleGate';
import { colors } from '@/ui/theme/tokens';

export default function AdminLayout() {
  return (
    <RoleGate allow={['ADMIN']}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="users" />
          <Stack.Screen name="products" />
        </Stack>
      </SafeAreaView>
    </RoleGate>
  );
}
