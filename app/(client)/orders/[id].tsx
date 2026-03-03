import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ORDER_STATUSES, OrderStatus } from '@/types/domain';
import { useOrders } from '@/state/OrdersContext';

const CLIENT_TIMELINE_STATUSES = ORDER_STATUSES.filter(
  (status) => status !== 'PENDIENTE' && status !== 'CANCELADO',
);

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
  const params = useLocalSearchParams<{ id: string }>();
  const { orders } = useOrders();
  const order = orders.find((item) => item.id === params.id);

  const historyMap = useMemo(() => {
    const map = new Map<OrderStatus, string>();
    (order?.statusHistory ?? []).forEach((entry) => {
      if (!map.has(entry.status)) {
        map.set(entry.status, entry.at);
      }
    });
    return map;
  }, [order?.statusHistory]);

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Pedido no encontrado.</Text>
      </View>
    );
  }

  const badge = statusStyle(order.status);

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <View style={styles.card}>
        <Text style={styles.timelineTitle}>Timeline</Text>
        {CLIENT_TIMELINE_STATUSES.map((status) => {
          const reached = historyMap.has(status);
          const isCurrent = status === order.status;

          return (
            <View key={status} style={styles.timelineRow}>
              <View
                style={[
                  styles.timelineDot,
                  reached && styles.timelineDotReached,
                  isCurrent && styles.timelineDotCurrent,
                ]}
              />
              <View style={styles.timelineTextBlock}>
                <Text style={[styles.timelineStatus, isCurrent && styles.timelineStatusCurrent]}>
                  {statusLabel(status)}
                </Text>
                <Text style={styles.timelineDate}>
                  {reached ? new Date(historyMap.get(status) ?? '').toLocaleString('es-MX') : 'Pendiente'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
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
  timelineTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    marginTop: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#9ca3af',
    backgroundColor: '#ffffff',
  },
  timelineDotReached: {
    backgroundColor: '#bfdbfe',
    borderColor: '#3b82f6',
  },
  timelineDotCurrent: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  timelineTextBlock: {
    gap: 2,
    flex: 1,
  },
  timelineStatus: {
    color: '#374151',
    fontWeight: '600',
  },
  timelineStatusCurrent: {
    color: '#111827',
  },
  timelineDate: {
    color: '#6b7280',
    fontSize: 12,
  },
});
