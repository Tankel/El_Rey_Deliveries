import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

export default function DriverDeliveryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { orders, updateStatus } = useOrders();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const order = orders.find((item) => item.id === params.id);

  const showActionResult = async (
    key: string,
    action: () => { ok: boolean; message: string },
  ) => {
    setPendingAction(key);
    const result = action();
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    await new Promise((resolve) => setTimeout(resolve, 250));
    setPendingAction(null);
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>{es.driver.noDelivery}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {es.driver.deliveryPrefix} {order.id}
      </Text>
      <Text>
        {es.adminOrders.titleStatus}: {order.status}
      </Text>
      <Text>
        {es.adminOrders.titleAddress}: {order.address}
      </Text>
      <PrimaryButton
        label={es.driver.acceptDelivery}
        loading={pendingAction === 'accept'}
        loadingLabel={es.driver.loadingUpdate}
        onPress={() =>
          showActionResult('accept', () => updateStatus(order.id, 'ACEPTADO_REPARTIDOR'))
        }
      />
      <PrimaryButton
        label={es.driver.startRoute}
        loading={pendingAction === 'route'}
        loadingLabel={es.driver.loadingUpdate}
        onPress={() => showActionResult('route', () => updateStatus(order.id, 'EN_CAMINO'))}
      />
      <PrimaryButton
        label={es.driver.confirmDelivery}
        loading={pendingAction === 'delivered'}
        loadingLabel={es.driver.loadingUpdate}
        onPress={() => showActionResult('delivered', () => updateStatus(order.id, 'ENTREGADO'))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
