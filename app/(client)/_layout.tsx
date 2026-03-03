import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function ClientLayout() {
  return (
    <RoleGate allow={['CLIENT']}>
      <Tabs
        screenOptions={{
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
          name="profile/index"
          options={{
            title: es.navigation.profile,
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
          }}
        />

        <Tabs.Screen
          name="products/[id]"
          options={{ title: es.navigation.productDetail, href: null }}
        />
        <Tabs.Screen
          name="billing"
          options={{ title: 'Facturas', href: null }}
        />
        <Tabs.Screen
          name="support"
          options={{ title: 'Soporte y ayuda', href: null }}
        />
      </Tabs>
    </RoleGate>
  );
}
