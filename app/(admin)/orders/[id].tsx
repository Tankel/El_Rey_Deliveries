import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ORDER_STATUSES, OrderStatus } from '@/types/domain';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

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

export default function AdminOrderDetailScreen() {
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
        <Text style={styles.label}>Metodo de pago</Text>
        <Text>{order.paymentMethod ?? 'N/A'}</Text>
        <Text style={styles.label}>Estatus de pago</Text>
        <Text>{order.paymentStatus ?? 'N/A'}</Text>
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
            onPress={() => {
              Alert.alert(
                'Cancelar pedido',
                'Confirmas la cancelacion de este pedido?',
                [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Si, cancelar',
                    style: 'destructive',
                    onPress: () =>
                      showActionResult('status-cancel', () =>
                        updateStatus(order.id, 'CANCELADO', { actorRole: 'ADMIN' }),
                      ),
                  },
                ],
              );
            }}
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
                onPress={() => {
                  Alert.alert(
                    'Accion avanzada',
                    `Cambiar estado manualmente a "${statusLabel(status)}"?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Aplicar',
                        style: 'destructive',
                        onPress: () =>
                          showActionResult(`force-${status}`, () => forceStatus(order.id, status)),
                      },
                    ],
                  );
                }}
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
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  orderId: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    color: colors.textMuted,
  },
  totalText: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primaryText,
  },
  helpText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  confirmButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  cancelButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.danger,
    fontWeight: '700',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advancedToggleText: {
    color: colors.link,
    fontWeight: '700',
  },
});
