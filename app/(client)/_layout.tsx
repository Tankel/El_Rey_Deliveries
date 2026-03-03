import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function ClientLayout() {
  return (
    <RoleGate allow={['CLIENT']}>
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
            name="home"
            options={{
              title: es.navigation.clientHome,
              tabBarLabel: 'Inicio',
              tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="cart"
            options={{
              title: es.navigation.cart,
              tabBarLabel: 'Carrito',
              tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="orders"
            options={{
              title: es.navigation.myOrders,
              tabBarLabel: 'Pedidos',
              tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: es.navigation.profile,
              tabBarLabel: 'Perfil',
              tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
            }}
          />
        </Tabs>
      </SafeAreaView>
    </RoleGate>
  );
}
