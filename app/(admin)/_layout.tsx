import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function AdminLayout() {
  return (
    <RoleGate allow={['ADMIN']}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
        <Stack>
          <Stack.Screen
            name="dashboard"
            options={{ title: es.navigation.adminDashboard, headerShown: false }}
          />
          <Stack.Screen
            name="orders/index"
            options={{
              title: es.navigation.adminOrders,
              headerShown: true,
              headerBackButtonDisplayMode: 'default',
            }}
          />
          <Stack.Screen
            name="orders/[id]"
            options={{
              title: es.navigation.adminOrderDetail,
              headerBackButtonDisplayMode: 'default',
            }}
          />
          <Stack.Screen
            name="users/index"
            options={{ title: 'Usuarios', headerShown: true, headerBackButtonDisplayMode: 'default' }}
          />
          <Stack.Screen
            name="products/index"
            options={{ title: 'Productos', headerShown: true, headerBackButtonDisplayMode: 'default' }}
          />
        </Stack>
      </SafeAreaView>
    </RoleGate>
  );
}
