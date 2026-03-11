import { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Order, OrderStatus } from '@/types/domain';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { SearchField } from '@/ui/components/atoms/SearchField';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

type OrderFilter = 'TODOS' | 'ACTIVOS' | 'FINALIZADOS';

const FILTERS: OrderFilter[] = ['TODOS', 'ACTIVOS', 'FINALIZADOS'];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function applyFilter(orders: Order[], filter: OrderFilter) {
  if (filter === 'TODOS') {
    return orders;
  }
  if (filter === 'FINALIZADOS') {
    return orders.filter((item) => item.status === 'ENTREGADO' || item.status === 'CANCELADO');
  }

  return orders.filter((item) => item.status !== 'ENTREGADO' && item.status !== 'CANCELADO');
}

export default function ClientOrdersScreen() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [filter, setFilter] = useState<OrderFilter>('TODOS');

  const clientOrders = useMemo(
    () =>
      orders
        .filter((order) => order.clientId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, user?.id],
  );

  const filteredOrders = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    return applyFilter(clientOrders, filter).filter((order) => {
      if (!normalized) {
        return true;
      }
      return (
        order.id.toLowerCase().includes(normalized) ||
        order.address.toLowerCase().includes(normalized) ||
        statusLabel(order.status).toLowerCase().includes(normalized)
      );
    });
  }, [clientOrders, debouncedQuery, filter]);

  const activeCount = clientOrders.filter(
    (item) => item.status !== 'ENTREGADO' && item.status !== 'CANCELADO',
  ).length;
  const deliveredCount = clientOrders.filter((item) => item.status === 'ENTREGADO').length;

  const renderItem = useCallback(({ item }: { item: Order }) => <OrderRow item={item} />, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis pedidos</Text>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total: {clientOrders.length}</Text>
        <Text style={styles.summaryText}>Activos: {activeCount}</Text>
        <Text style={styles.summaryText}>Entregados: {deliveredCount}</Text>
      </View>

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por folio, estatus o direccion"
        style={styles.search}
      />

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
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text>No hay pedidos para este filtro.</Text>
          </View>
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
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
  summary: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  summaryText: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  search: {
    minHeight: 42,
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
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextSelected: {
    color: colors.primaryText,
  },
  listContent: {
    paddingBottom: 14,
    gap: 10,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    gap: spacing.sm,
  },
  cardHeader: {
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
  dateText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  addressText: {
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailHint: {
    color: colors.link,
    fontWeight: '600',
  },
});

const OrderRow = memo(function OrderRow({ item }: { item: Order }) {
  const badge = statusStyle(item.status);
  return (
    <Link href={`/(client)/orders/${item.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cardHeader}>
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
        <Text style={styles.dateText}>Creado: {formatDate(item.createdAt)}</Text>
        <Text style={styles.addressText}>{item.address}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
          <Text style={styles.detailHint}>Ver detalle</Text>
        </View>
      </Pressable>
    </Link>
  );
});

