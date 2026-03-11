import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';
import { colors } from '@/ui/theme/tokens';

export default function ClientLayout() {
  const { itemCount } = useCart();

  return (
    <RoleGate allow={['CLIENT']}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.textPrimary,
            tabBarInactiveTintColor: colors.textMuted,
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
              tabBarBadge: itemCount > 0 ? itemCount : undefined,
              tabBarBadgeStyle: {
                backgroundColor: colors.danger,
                color: colors.primaryText,
                fontWeight: '700',
              },
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
          <Tabs.Screen
            name="payment"
            options={{
              href: null,
              title: 'Simulacion de pago',
              headerShown: true,
              headerBackButtonDisplayMode: 'default',
            }}
          />
        </Tabs>
      </SafeAreaView>
    </RoleGate>
  );
}

