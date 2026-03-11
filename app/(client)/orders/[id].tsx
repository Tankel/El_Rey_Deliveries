import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ORDER_STATUSES, OrderStatus } from '@/types/domain';
import { buildOrderTrackingInsight, formatEtaLabel } from '@/services/insights/orderTracking';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

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
    return { bg: colors.successBg, border: colors.successBorder, text: colors.success };
  }
  if (status === 'CANCELADO') {
    return { bg: colors.dangerBg, border: colors.dangerBorder, text: colors.danger };
  }
  return { bg: colors.infoBg, border: colors.infoBorder, text: colors.info };
}

export default function ClientOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
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

  if (order.clientId !== user?.id) {
    return (
      <View style={styles.container}>
        <Text>No tienes permisos para ver este pedido.</Text>
      </View>
    );
  }

  const badge = statusStyle(order.status);
  const tracking = buildOrderTrackingInsight(order, orders);

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

      {tracking.isActive ? (
        <View style={styles.card}>
          <Text style={styles.timelineTitle}>Rastreo inteligente</Text>
          <Text style={styles.label}>ETA estimado</Text>
          <Text style={styles.etaValue}>{formatEtaLabel(tracking.etaMinutes)}</Text>
          <Text style={styles.label}>
            Siguiente hito: {tracking.nextMilestone ? statusLabel(tracking.nextMilestone) : 'Sin hito'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${tracking.progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{tracking.progressPercent}% de avance</Text>
        </View>
      ) : null}

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
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  total: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  etaValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.link,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  timelineTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: typography.body,
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
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  timelineDotReached: {
    backgroundColor: colors.infoBorder,
    borderColor: colors.link,
  },
  timelineDotCurrent: {
    backgroundColor: colors.link,
    borderColor: colors.info,
  },
  timelineTextBlock: {
    gap: 2,
    flex: 1,
  },
  timelineStatus: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  timelineStatusCurrent: {
    color: colors.textPrimary,
  },
  timelineDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
