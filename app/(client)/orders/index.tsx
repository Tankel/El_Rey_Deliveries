import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Order, OrderStatus } from '@/types/domain';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';

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
    return { bg: '#ecfdf5', border: '#34d399', text: '#065f46' };
  }
  if (status === 'CANCELADO') {
    return { bg: '#fee2e2', border: '#f87171', text: '#991b1b' };
  }
  return { bg: '#eff6ff', border: '#60a5fa', text: '#1e3a8a' };
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
  const [filter, setFilter] = useState<OrderFilter>('TODOS');

  const clientOrders = useMemo(
    () =>
      orders
        .filter((order) => order.clientId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, user?.id],
  );

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
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
  }, [clientOrders, filter, query]);

  const activeCount = clientOrders.filter(
    (item) => item.status !== 'ENTREGADO' && item.status !== 'CANCELADO',
  ).length;
  const deliveredCount = clientOrders.filter((item) => item.status === 'ENTREGADO').length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis pedidos</Text>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total: {clientOrders.length}</Text>
        <Text style={styles.summaryText}>Activos: {activeCount}</Text>
        <Text style={styles.summaryText}>Entregados: {deliveredCount}</Text>
      </View>

      <TextInput
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
        renderItem={({ item }) => {
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
        }}
        contentContainerStyle={styles.listContent}
      />
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
  summary: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  summaryText: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: '600',
    color: '#374151',
  },
  search: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    fontWeight: '600',
    color: '#4b5563',
  },
  filterTextSelected: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 14,
    gap: 10,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  dateText: {
    color: '#6b7280',
    fontSize: 13,
  },
  addressText: {
    color: '#374151',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  detailHint: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
});
