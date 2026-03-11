import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DeliveryRecipientRelation, ORDER_STATUSES, OrderStatus } from '@/types/domain';
import { es } from '@/i18n/es';
import { buildOrderTrackingInsight, formatEtaLabel } from '@/services/insights/orderTracking';
import { pickAndStoreImage } from '@/services/media/localImagePicker';
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

const RECIPIENT_RELATIONS: DeliveryRecipientRelation[] = [
  'CLIENTE',
  'ENCARGADO',
  'FAMILIAR',
  'PORTERIA',
  'OTRO',
];

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
  const [deliveryRecipientName, setDeliveryRecipientName] = useState('');
  const [deliveryRecipientRelation, setDeliveryRecipientRelation] = useState<DeliveryRecipientRelation | null>(null);
  const [deliveryRecipientId, setDeliveryRecipientId] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [deliveryPhotoUri, setDeliveryPhotoUri] = useState('');

  const order = orders.find((item) => item.id === params.id);

  const isOwner = order?.assignedDriverId === user?.id;
  const nextAction = order ? DRIVER_FLOW[order.status] ?? null : null;
  const deliveryProofValid =
    deliveryNote.trim().length >= 8 &&
    deliveryRecipientName.trim().length >= 3 &&
    Boolean(deliveryRecipientRelation) &&
    (deliveryOtp.trim().length > 0 || deliveryPhotoUri.trim().length > 0);
  const trackingInsight = order ? buildOrderTrackingInsight(order, orders) : null;

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

  const pickPhoto = async () => {
    const result = await pickAndStoreImage('delivery-proof');
    if (!result.ok) {
      if (!result.cancelled) {
        showToast({ message: result.message, type: 'error' });
      }
      return;
    }
    setDeliveryPhotoUri(result.uri ?? '');
    showToast({ message: 'Foto de entrega adjuntada.', type: 'success' });
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

      {trackingInsight?.isActive ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rastreo operativo</Text>
          <Text style={styles.meta}>ETA estimado: {formatEtaLabel(trackingInsight.etaMinutes)}</Text>
          <Text style={styles.meta}>
            Siguiente hito: {trackingInsight.nextMilestone ? statusLabel(trackingInsight.nextMilestone) : 'Sin hito'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${trackingInsight.progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{trackingInsight.progressPercent}% completado</Text>
        </View>
      ) : null}

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
                  placeholder="Describe entrega y condicion (minimo 8 caracteres)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.textArea]}
                  multiline
                />
                <Text style={styles.inputHelper}>
                  {deliveryNote.trim().length >= 8 ? 'Nota valida' : 'Faltan detalles de entrega'}
                </Text>
                <Text style={styles.inputLabel}>Nombre de quien recibe</Text>
                <TextInput
                  value={deliveryRecipientName}
                  onChangeText={setDeliveryRecipientName}
                  placeholder="Nombre completo receptor"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>Relacion con pedido</Text>
                <View style={styles.chipsWrap}>
                  {RECIPIENT_RELATIONS.map((relation) => {
                    const selected = relation === deliveryRecipientRelation;
                    return (
                      <Pressable
                        key={relation}
                        onPress={() => setDeliveryRecipientRelation(relation)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{relation}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.inputLabel}>ID receptor (opcional)</Text>
                <TextInput
                  value={deliveryRecipientId}
                  onChangeText={setDeliveryRecipientId}
                  placeholder="IFE/INE o referencia"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
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
                <View style={styles.photoActions}>
                  <Pressable style={styles.photoButton} onPress={pickPhoto}>
                    <Text style={styles.photoButtonText}>Seleccionar foto</Text>
                  </Pressable>
                  {deliveryPhotoUri ? (
                    <Pressable
                      style={styles.photoClearButton}
                      onPress={() => setDeliveryPhotoUri('')}
                    >
                      <Text style={styles.photoClearText}>Quitar</Text>
                    </Pressable>
                  ) : null}
                </View>
                {deliveryPhotoUri ? (
                  <Image source={{ uri: deliveryPhotoUri }} style={styles.photoPreview} resizeMode="cover" />
                ) : (
                  <Text style={styles.inputHelper}>Adjunta foto o captura OTP para cerrar la entrega.</Text>
                )}
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
                    deliveryRecipientName,
                    deliveryRecipientRelation: deliveryRecipientRelation ?? undefined,
                    deliveryRecipientId,
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
          <Text style={styles.meta}>Recibe: {order.deliveryProof.recipientName}</Text>
          <Text style={styles.meta}>Relacion: {order.deliveryProof.recipientRelation}</Text>
          <Text style={styles.meta}>ID receptor: {order.deliveryProof.recipientId ?? 'No capturado'}</Text>
          <Text style={styles.meta}>OTP: {order.deliveryProof.otp ?? 'No capturado'}</Text>
          {order.deliveryProof.photoUri ? (
            <Image source={{ uri: order.deliveryProof.photoUri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <Text style={styles.meta}>Foto: No capturada</Text>
          )}
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
  inputHelper: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -2,
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
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextSelected: {
    color: colors.primaryText,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  photoButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photoButtonText: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  photoClearButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  photoClearText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  photoPreview: {
    width: '100%',
    height: 170,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    marginTop: 4,
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
