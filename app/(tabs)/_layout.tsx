import { Redirect, Tabs } from 'expo-router';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: es.navigation.home }} />
      <Tabs.Screen name="pedidos" options={{ title: es.navigation.orders }} />
      <Tabs.Screen name="clientes" options={{ title: es.navigation.clients }} />
      <Tabs.Screen name="inventario" options={{ title: es.navigation.inventory }} />
      <Tabs.Screen name="perfil" options={{ title: es.navigation.profile }} />
    </Tabs>
  );
}
