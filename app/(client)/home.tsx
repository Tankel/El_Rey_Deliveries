import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

export default function ClientHomeScreen() {
  const { user, signOut } = useAuth();
  const { createOrder } = useOrders();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.client.title}</Text>
      <Text>
        {es.client.greeting}, {user?.username}
      </Text>
      <PrimaryButton
        label={es.orders.demoCreate}
        loading={isCreating}
        loadingLabel="Creando..."
        onPress={async () => {
          setIsCreating(true);
          const result = createOrder({
            clientId: user?.id ?? 'cliente-demo',
            clientName: user?.username ?? 'Cliente Demo',
            address: 'Calle Demo 100',
            total: 250,
            notes: 'Pedido creado desde home cliente',
          });
          showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
          await new Promise((resolve) => setTimeout(resolve, 250));
          setIsCreating(false);
        }}
      />
      <Link href="/(client)/orders">{es.client.goToOrders}</Link>
      <PrimaryButton label={es.common.logout} onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
