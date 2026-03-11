import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ORDER_STATUSES, OrderStatus } from '@/types/domain';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

const DRIVER_FLOW: Partial<Record<OrderStatus, { nextStatus: OrderStatus; label: string }>> = {
  ASIGNADO: { nextStatus: 'ACEPTADO_REPARTIDOR', label: es.driver.acceptDelivery },
  ACEPTADO_REPARTIDOR: { nextStatus: 'EN_CAMINO', label: es.driver.startRoute },
  EN_CAMINO: { nextStatus: 'ENTREGADO', label: es.driver.confirmDelivery },
};

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

export default function DriverDeliveryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { orders, updateStatus } = useOrders();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [deliveryPhotoUri, setDeliveryPhotoUri] = useState('');

  const order = orders.find((item) => item.id === params.id);

  const isOwner = order?.assignedDriverId === user?.id;
  const nextAction = order ? DRIVER_FLOW[order.status] ?? null : null;
  const deliveryProofValid = deliveryNote.trim().length > 0 && (deliveryOtp.trim().length > 0 || deliveryPhotoUri.trim().length > 0);

  const historyMap = useMemo(() => {
    const map = new Map<OrderStatus, string>();
    (order?.statusHistory ?? []).forEach((entry) => {
      if (!map.has(entry.status)) {
        map.set(entry.status, entry.at);
      }
    });
    return map;
  }, [order?.statusHistory]);

  const showActionResult = async (
    key: string,
    action: () => { ok: boolean; message: string },
  ) => {
    setPendingAction(key);
    const result = action();
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    await new Promise((resolve) => setTimeout(resolve, 250));
    setPendingAction(null);
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>{es.driver.noDelivery}</Text>
      </View>
    );
  }

  if (!isOwner) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>{es.driver.onlyOwnerCanUpdate}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {es.driver.deliveryPrefix} {order.id}
      </Text>
      <Text style={styles.meta}>Direccion: {order.address}</Text>
      <Text style={styles.meta}>Estado actual: {statusLabel(order.status)}</Text>
      <Text style={styles.meta}>Repartidor: {order.assignedDriverName ?? 'Sin asignar'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{es.driver.nextAction}</Text>
        {nextAction ? (
          <>
            {nextAction.nextStatus === 'ENTREGADO' ? (
              <View style={styles.proofForm}>
                <Text style={styles.inputLabel}>{es.driver.proofNoteLabel}</Text>
                <TextInput
                  value={deliveryNote}
                  onChangeText={setDeliveryNote}
                  placeholder={es.driver.proofNotePlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.textArea]}
                  multiline
                />
                <Text style={styles.inputLabel}>{es.driver.proofOtpLabel}</Text>
                <TextInput
                  value={deliveryOtp}
                  onChangeText={setDeliveryOtp}
                  placeholder="Ej. 123456"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>{es.driver.proofPhotoLabel}</Text>
                <TextInput
                  value={deliveryPhotoUri}
                  onChangeText={setDeliveryPhotoUri}
                  placeholder="https://..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
            ) : null}
            <PrimaryButton
              label={nextAction.label}
              loading={pendingAction === 'next-action'}
              loadingLabel={es.driver.loadingUpdate}
              disabled={nextAction.nextStatus === 'ENTREGADO' && !deliveryProofValid}
              onPress={() =>
                showActionResult('next-action', () =>
                  updateStatus(order.id, nextAction.nextStatus, {
                    actorId: user?.id,
                    actorRole: 'DRIVER',
                    deliveryNote,
                    deliveryOtp,
                    deliveryPhotoUri,
                  }),
                )
              }
            />
          </>
        ) : (
          <Text style={styles.noActionText}>{es.driver.noActionAvailable}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{es.driver.timelineTitle}</Text>
        {ORDER_STATUSES.map((status) => {
          const isCurrent = status === order.status;
          const reached = historyMap.has(status);
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
                  {reached
                    ? new Date(historyMap.get(status) ?? '').toLocaleString('es-MX')
                    : 'Pendiente'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {order.deliveryProof ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{es.driver.proofTitle}</Text>
          <Text style={styles.meta}>Nota: {order.deliveryProof.note}</Text>
          <Text style={styles.meta}>OTP: {order.deliveryProof.otp ?? 'No capturado'}</Text>
          <Text style={styles.meta}>Foto: {order.deliveryProof.photoUri ?? 'No capturada'}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: 10,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    color: colors.textSecondary,
  },
  warningBox: {
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: 10,
  },
  warningText: {
    color: colors.danger,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: typography.body,
  },
  noActionText: {
    color: colors.textMuted,
  },
  proofForm: {
    gap: 6,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
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
