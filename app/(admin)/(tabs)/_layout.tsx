import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AdminTabsLayout() {
  return (
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
          title: 'Panel admin',
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
    </Tabs>
  );
}
