import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { es } from '@/i18n/es';
import { RoleGate } from '@/navigation/RoleGate';

export default function DriverLayout() {
  return (
    <RoleGate allow={['DRIVER']}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top']}>
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
              tabBarLabel: 'Inicio',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: es.navigation.profile,
              tabBarLabel: 'Perfil',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-circle-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: es.navigation.driverInbox,
              href: null,
              headerShown: true,
              headerBackButtonDisplayMode: 'default',
            }}
          />
        </Tabs>
      </SafeAreaView>
    </RoleGate>
  );
}

