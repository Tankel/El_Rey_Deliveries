import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

export default function AdminOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { orders, drivers, assignDriver, updateStatus } = useOrders();
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
        <Text>{es.orders.notFound}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{order.id}</Text>
      <Text>
        {es.adminOrders.titleClient}: {order.clientName}
      </Text>
      <Text>
        {es.adminOrders.titleStatus}: {order.status}
      </Text>
      <Text>
        {es.adminOrders.titleAddress}: {order.address}
      </Text>
      <Text>
        {es.adminOrders.titleDriver}: {order.assignedDriverName ?? es.adminOrders.noDriver}
      </Text>

      <PrimaryButton
        label={es.adminOrders.confirmOrder}
        loading={pendingAction === 'confirm'}
        loadingLabel={es.adminOrders.confirming}
        onPress={() => showActionResult('confirm', () => updateStatus(order.id, 'CONFIRMADO'))}
      />
      <PrimaryButton
        label={es.adminOrders.markPreparing}
        loading={pendingAction === 'prepare'}
        loadingLabel={es.adminOrders.updating}
        onPress={() => showActionResult('prepare', () => updateStatus(order.id, 'EN_PREPARACION'))}
      />
      <PrimaryButton
        label={es.adminOrders.markOnRoute}
        loading={pendingAction === 'route'}
        loadingLabel={es.adminOrders.updating}
        onPress={() => showActionResult('route', () => updateStatus(order.id, 'EN_CAMINO'))}
      />
      <PrimaryButton
        label={es.adminOrders.markDelivered}
        loading={pendingAction === 'delivered'}
        loadingLabel={es.adminOrders.updating}
        onPress={() => showActionResult('delivered', () => updateStatus(order.id, 'ENTREGADO'))}
      />
      <PrimaryButton
        label={`Asignar ${drivers[0].name}`}
        loading={pendingAction === 'assign-1'}
        loadingLabel={es.adminOrders.assigning}
        onPress={() => showActionResult('assign-1', () => assignDriver(order.id, drivers[0].id))}
      />
      <PrimaryButton
        label={`Asignar ${drivers[1].name}`}
        loading={pendingAction === 'assign-2'}
        loadingLabel={es.adminOrders.assigning}
        onPress={() => showActionResult('assign-2', () => assignDriver(order.id, drivers[1].id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
