import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { useOrders } from '@/state/OrdersContext';

export default function ClientOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { orders } = useOrders();
  const order = orders.find((item) => item.id === params.id);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>{es.orders.notFound}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {es.client.detailPrefix} {order.id}
      </Text>
      <Text>
        {es.adminOrders.titleStatus}: {order.status}
      </Text>
      <Text>
        {es.adminOrders.titleAddress}: {order.address}
      </Text>
      <Text>Total: ${order.total}</Text>
      <Text>
        {es.adminOrders.titleDriver}: {order.assignedDriverName ?? es.adminOrders.noDriver}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
