import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OrderStatus } from '@/types/domain';
import { useOrders } from '@/state/OrdersContext';

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    CONFIRMADO: 'Confirmado',
    EN_PREPARACION: 'En preparacion',
    ASIGNADO: 'Asignado',
    ACEPTADO_REPARTIDOR: 'Aceptado',
    EN_CAMINO: 'En camino',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
  };
  return labels[status];
}

function statusStyle(status: OrderStatus) {
  if (status === 'ENTREGADO') {
    return { bg: '#ecfdf5', border: '#34d399', text: '#065f46' };
  }
  if (status === 'CANCELADO') {
    return { bg: '#fee2e2', border: '#f87171', text: '#991b1b' };
  }
  return { bg: '#eff6ff', border: '#60a5fa', text: '#1e3a8a' };
}

export default function ClientOrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { orders } = useOrders();
  const order = orders.find((item) => item.id === params.id);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Pedido no encontrado.</Text>
      </View>
    );
  }

  const badge = statusStyle(order.status);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle de pedido</Text>
      <Text style={styles.orderId}>{order.id}</Text>

      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
        <Text style={[styles.statusText, { color: badge.text }]}>{statusLabel(order.status)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Direccion</Text>
        <Text>{order.address}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Repartidor</Text>
        <Text>{order.assignedDriverName ?? 'Aun sin asignar'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Actualizado</Text>
        <Text>{new Date(order.updatedAt).toLocaleString('es-MX')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  backButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  backButtonText: {
    fontWeight: '700',
    color: '#111827',
  },
  orderId: {
    color: '#374151',
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
  },
  total: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
});
