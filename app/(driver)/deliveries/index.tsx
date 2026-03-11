import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DriverNotificationsBell } from '@/components/driver/DriverNotificationsBell';
import { Order, OrderStatus } from '@/types/domain';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

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
    return { bg: colors.successBg, border: colors.successBorder, text: colors.success };
  }
  if (status === 'CANCELADO') {
    return { bg: colors.dangerBg, border: colors.dangerBorder, text: colors.danger };
  }
  return { bg: colors.infoBg, border: colors.infoBorder, text: colors.info };
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
  const { user } = useAuth();
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
        <Text style={styles.headerHint}>Mis Entregas</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: 10,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerHint: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: typography.body,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: colors.primaryText,
  },
  listContent: {
    gap: 10,
    paddingBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  address: {
    color: colors.textSecondary,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

