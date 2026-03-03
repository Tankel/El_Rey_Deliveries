import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';

export default function DriverLayout() {
  const { user } = useAuth();
  const { notifications } = useOrders();
  const unreadDriverNotifications = notifications.filter(
    (item) =>
      item.audience === 'DRIVER' && item.targetUserId === user?.id && !item.read,
  ).length;

  return (
    <RoleGate allow={['DRIVER']}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#111827',
            tabBarInactiveTintColor: '#6b7280',
            tabBarStyle: {
              height: 62,
              paddingTop: 6,
              paddingBottom: 8,
            },
          }}
        >
          <Tabs.Screen
            name="deliveries"
            options={{
              title: es.navigation.driverDeliveries,
              tabBarLabel: 'Entregas',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="car-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: es.navigation.driverInbox,
              tabBarLabel: 'Nuevas',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="notifications-outline" color={color} size={size} />
              ),
              tabBarBadge: unreadDriverNotifications > 0 ? unreadDriverNotifications : undefined,
            }}
          />
        </Tabs>
      </SafeAreaView>
    </RoleGate>
  );
}
