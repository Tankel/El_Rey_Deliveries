import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AdminNotificationsBell } from '@/components/admin/AdminNotificationsBell';
import { Order, OrderStatus } from '@/types/domain';
import { buildOrderTrackingInsight, formatEtaLabel } from '@/services/insights/orderTracking';
import { useOrders } from '@/state/OrdersContext';
import { SearchField } from '@/ui/components/atoms/SearchField';
import { useToast } from '@/ui/feedback/ToastContext';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

type OrderFilter = 'TODOS' | 'PENDIENTES' | 'ACTIVOS' | 'FINALIZADOS' | 'CANCELADOS';

const FILTERS: OrderFilter[] = ['TODOS', 'PENDIENTES', 'ACTIVOS', 'FINALIZADOS', 'CANCELADOS'];

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
    return { bg: colors.successBg, border: colors.successBorder, text: colors.success };
  }
  if (status === 'CANCELADO') {
    return { bg: colors.dangerBg, border: colors.dangerBorder, text: colors.danger };
  }
  return { bg: colors.infoBg, border: colors.infoBorder, text: colors.info };
}

function applyFilter(status: OrderStatus, filter: OrderFilter) {
  if (filter === 'TODOS') {
    return true;
  }
  if (filter === 'ACTIVOS') {
    return status !== 'ENTREGADO' && status !== 'CANCELADO';
  }
  if (filter === 'PENDIENTES') {
    return status === 'PENDIENTE';
  }
  if (filter === 'FINALIZADOS') {
    return status === 'ENTREGADO';
  }
  return status === 'CANCELADO';
}

export default function AdminOrdersScreen() {
  const { orders, updateStatus } = useOrders();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [filter, setFilter] = useState<OrderFilter>('TODOS');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter((order) => applyFilter(order.status, filter))
      .filter((order) => {
        if (!normalized) {
          return true;
        }
        return (
          order.id.toLowerCase().includes(normalized) ||
          order.clientName.toLowerCase().includes(normalized) ||
          order.address.toLowerCase().includes(normalized)
        );
      });
  }, [debouncedQuery, filter, orders]);

  const handleCancel = useCallback(
    (orderId: string) => {
      Alert.alert(
        'Cancelar pedido',
        `Se cancelara el pedido ${orderId}. Esta accion impacta la operacion.`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Si, cancelar',
            style: 'destructive',
            onPress: async () => {
              const result = await updateStatus(orderId, 'CANCELADO', { actorRole: 'ADMIN' });
              showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
            },
          },
        ],
      );
    },
    [showToast, updateStatus],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredOrders)[number] }) => (
      <AdminOrderRow item={item} allOrders={orders} onCancel={handleCancel} />
    ),
    [handleCancel, orders],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pedidos</Text>
        <AdminNotificationsBell />
      </View>
      <View style={styles.searchRow}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por folio, cliente o direccion"
          style={[styles.searchInput, styles.searchInputFlex]}
        />
        <Pressable style={styles.filterButton} onPress={() => setShowFilters((prev) => !prev)}>
          <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {showFilters ? (
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
      ) : null}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay pedidos para ese filtro.</Text>}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  searchInputFlex: {
    flex: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
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
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  metaText: {
    color: colors.textSecondary,
  },
  etaText: {
    color: colors.link,
    fontWeight: '700',
    fontSize: 12,
  },
  totalText: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
  },
  actionText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cancelButton: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  cancelText: {
    color: colors.danger,
  },
});

const AdminOrderRow = memo(function AdminOrderRow({
  item,
  allOrders,
  onCancel,
}: {
  item: Order;
  allOrders: Order[];
  onCancel: (orderId: string) => void;
}) {
  const badge = statusStyle(item.status);
  const canCancel = item.status !== 'ENTREGADO' && item.status !== 'CANCELADO';
  const tracking = buildOrderTrackingInsight(item, allOrders);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.orderId}>{item.id}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Text style={[styles.statusText, { color: badge.text }]}>{statusLabel(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.metaText}>Cliente: {item.clientName}</Text>
      <Text style={styles.metaText}>{item.address}</Text>
      <Text style={styles.metaText}>
        Pago: {item.paymentMethod ?? 'N/A'} - {item.paymentStatus ?? 'N/A'}
      </Text>
      {tracking.isActive ? <Text style={styles.etaText}>ETA aprox: {formatEtaLabel(tracking.etaMinutes)}</Text> : null}
      <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>

      <View style={styles.actions}>
        <Link href={`/(admin)/orders/${item.id}`} asChild>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionText}>Gestionar</Text>
          </Pressable>
        </Link>
        {canCancel ? (
          <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={() => onCancel(item.id)}>
            <Text style={[styles.actionText, styles.cancelText]}>Cancelar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});
