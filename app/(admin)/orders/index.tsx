import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AdminNotificationsBell } from '@/components/admin/AdminNotificationsBell';
import { OrderStatus } from '@/types/domain';
import { useOrders } from '@/state/OrdersContext';
import { useToast } from '@/ui/feedback/ToastContext';

type OrderFilter = 'TODOS' | 'ACTIVOS' | 'FINALIZADOS' | 'CANCELADOS';

const FILTERS: OrderFilter[] = ['TODOS', 'ACTIVOS', 'FINALIZADOS', 'CANCELADOS'];

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

function applyFilter(status: OrderStatus, filter: OrderFilter) {
  if (filter === 'TODOS') {
    return true;
  }
  if (filter === 'ACTIVOS') {
    return status !== 'ENTREGADO' && status !== 'CANCELADO';
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
  const [filter, setFilter] = useState<OrderFilter>('TODOS');

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
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
  }, [filter, orders, query]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pedidos</Text>
        <AdminNotificationsBell />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por folio, cliente o direccion"
        placeholderTextColor="#6b7280"
        style={styles.searchInput}
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
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay pedidos para ese filtro.</Text>}
        renderItem={({ item }) => {
          const badge = statusStyle(item.status);
          const canCancel = item.status !== 'ENTREGADO' && item.status !== 'CANCELADO';
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
              <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>

              <View style={styles.actions}>
                <Link href={`/(admin)/orders/${item.id}`} asChild>
                  <Pressable style={styles.actionButton}>
                    <Text style={styles.actionText}>Gestionar</Text>
                  </Pressable>
                </Link>
                {canCancel ? (
                  <Pressable
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => {
                      const result = updateStatus(item.id, 'CANCELADO', { actorRole: 'ADMIN' });
                      showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
                    }}
                  >
                    <Text style={[styles.actionText, styles.cancelText]}>Cancelar</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  filterText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#ffffff',
  },
  listContent: {
    gap: 10,
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
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
  metaText: {
    color: '#4b5563',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  cancelText: {
    color: '#991b1b',
  },
});
