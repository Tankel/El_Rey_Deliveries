import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DriverNotificationsBell } from '@/components/driver/DriverNotificationsBell';
import { Order, OrderStatus } from '@/types/domain';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';

type DeliveryFilter = 'ACTIVAS' | 'COMPLETADAS' | 'CANCELADAS';

const FILTERS: DeliveryFilter[] = ['ACTIVAS', 'COMPLETADAS', 'CANCELADAS'];

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

function statusTone(status: OrderStatus) {
  if (status === 'ENTREGADO') {
    return { bg: '#ecfdf5', border: '#34d399', text: '#065f46' };
  }
  if (status === 'CANCELADO') {
    return { bg: '#fee2e2', border: '#f87171', text: '#991b1b' };
  }
  return { bg: '#eff6ff', border: '#60a5fa', text: '#1e3a8a' };
}

function applyFilter(order: Order, filter: DeliveryFilter) {
  if (filter === 'ACTIVAS') {
    return order.status !== 'ENTREGADO' && order.status !== 'CANCELADO';
  }
  if (filter === 'COMPLETADAS') {
    return order.status === 'ENTREGADO';
  }
  return order.status === 'CANCELADO';
}

export default function DriverDeliveriesScreen() {
  const { user, signOut } = useAuth();
  const { orders } = useOrders();
  const [filter, setFilter] = useState<DeliveryFilter>('ACTIVAS');

  const driverOrders = useMemo(
    () =>
      orders
        .filter((order) => order.assignedDriverId === user?.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [orders, user?.id],
  );

  const filteredOrders = useMemo(
    () => driverOrders.filter((order) => applyFilter(order, filter)),
    [driverOrders, filter],
  );

  const renderItem = useCallback(
    ({ item }: { item: Order }) => {
      const tone = statusTone(item.status);
      return (
        <Link href={`/(driver)/deliveries/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Text style={[styles.badgeText, { color: tone.text }]}>{statusLabel(item.status)}</Text>
              </View>
            </View>
            <Text style={styles.address}>{item.address}</Text>
            <Text style={styles.meta}>
              Actualizado: {new Date(item.updatedAt).toLocaleString('es-MX')}
            </Text>
          </Pressable>
        </Link>
      );
    },
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerHint}>Panel operativo</Text>
        <DriverNotificationsBell />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const selected = item === filter;
          return (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        ListEmptyComponent={<Text style={styles.emptyText}>{es.driver.noAssignedOrders}</Text>}
      />
      <PrimaryButton label={es.common.logout} onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 10,
    backgroundColor: '#f9fafb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerHint: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  filterChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterText: {
    color: '#374151',
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#ffffff',
  },
  listContent: {
    gap: 10,
    paddingBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    color: '#111827',
    fontWeight: '700',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  address: {
    color: '#374151',
  },
  meta: {
    color: '#6b7280',
    fontSize: 12,
  },
});
