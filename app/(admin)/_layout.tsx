import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function AdminLayout() {
  return (
    <RoleGate allow={['ADMIN']}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top']}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#0f172a',
            tabBarInactiveTintColor: '#64748b',
            tabBarStyle: {
              height: 62,
              paddingTop: 6,
              paddingBottom: 8,
              backgroundColor: '#ffffff',
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: es.navigation.adminDashboard,
              tabBarLabel: 'Inicio',
              tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil admin',
              tabBarLabel: 'Perfil',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-circle-outline" color={color} size={size} />
              ),
            }}
          />

          <Tabs.Screen
            name="orders"
            options={{
              href: null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="users"
            options={{
              href: null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="products"
            options={{
              href: null,
              headerShown: false,
            }}
          />
        </Tabs>
      </SafeAreaView>
    </RoleGate>
  );
}
