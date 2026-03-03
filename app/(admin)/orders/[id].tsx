import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ORDER_STATUSES, OrderStatus } from '@/types/domain';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

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

export default function AdminOrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { orders, drivers, confirmOrderWithDriver, updateStatus, forceStatus } = useOrders();
  const { showToast } = useToast();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const order = orders.find((item) => item.id === params.id);

  const showActionResult = async (
    key: string,
    action: () => { ok: boolean; message: string },
  ) => {
    setPendingAction(key);
    const result = action();
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    await new Promise((resolve) => setTimeout(resolve, 220));
    setPendingAction(null);
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Pedido no encontrado.</Text>
      </View>
    );
  }

  const badge = statusStyle(order.status);
  const canCancel = order.status !== 'ENTREGADO' && order.status !== 'CANCELADO';
  const isPending = order.status === 'PENDIENTE';
  const selectedDriverName = drivers.find((item) => item.id === selectedDriverId)?.name ?? null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Volver</Text>
      </Pressable>
      <Text style={styles.title}>Gestion de pedido</Text>
      <Text style={styles.orderId}>{order.id}</Text>

      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
        <Text style={[styles.statusText, { color: badge.text }]}>{statusLabel(order.status)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Cliente</Text>
        <Text>{order.clientName}</Text>
        <Text style={styles.label}>Direccion</Text>
        <Text>{order.address}</Text>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.totalText}>${order.total.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accion principal</Text>
        {isPending ? (
          <>
            <Text style={styles.helpText}>
              Para confirmar el pedido debes asignar repartidor en esta misma accion.
            </Text>
            <View style={styles.chipsWrap}>
              {drivers.map((driver) => {
                const selected = selectedDriverId === driver.id;
                return (
                  <Pressable
                    key={driver.id}
                    onPress={() => setSelectedDriverId(driver.id)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{driver.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <PrimaryButton
              label={selectedDriverName ? `Asignar y confirmar (${selectedDriverName})` : 'Asignar y confirmar'}
              loading={pendingAction === 'confirm-with-driver'}
              loadingLabel="Confirmando..."
              disabled={!selectedDriverId}
              onPress={() =>
                showActionResult('confirm-with-driver', () =>
                  confirmOrderWithDriver(order.id, selectedDriverId ?? ''),
                )
              }
            />
          </>
        ) : (
          <Text style={styles.helpText}>
            Pedido confirmado. El repartidor debe llevar los siguientes estados operativos.
          </Text>
        )}
        {canCancel ? (
          <Pressable
            style={styles.cancelButton}
            onPress={() => showActionResult('status-cancel', () => updateStatus(order.id, 'CANCELADO'))}
          >
            <Text style={styles.cancelButtonText}>Cancelar pedido</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable
          style={styles.advancedToggle}
          onPress={() => setShowAdvancedActions((prev) => !prev)}
        >
          <Text style={styles.cardTitle}>Acciones avanzadas (admin)</Text>
          <Text style={styles.advancedToggleText}>{showAdvancedActions ? 'Ocultar' : 'Mostrar'}</Text>
        </Pressable>
        {showAdvancedActions ? (
          <View style={styles.chipsWrap}>
            {ORDER_STATUSES.map((status) => (
              <Pressable
                key={status}
                onPress={() =>
                  showActionResult(`force-${status}`, () => forceStatus(order.id, status))
                }
                style={styles.chip}
              >
                <Text style={styles.chipText}>{statusLabel(status)}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.helpText}>
            Usa esta seccion solo para corregir errores operativos.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  orderId: {
    color: '#4b5563',
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
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    color: '#6b7280',
  },
  totalText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  chipText: {
    fontWeight: '600',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  helpText: {
    color: '#6b7280',
    fontSize: 12,
  },
  confirmButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16a34a',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  cancelButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#991b1b',
    fontWeight: '700',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advancedToggleText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
});
