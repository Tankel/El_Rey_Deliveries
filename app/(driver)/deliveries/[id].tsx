import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ORDER_STATUSES, OrderStatus } from '@/types/domain';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {es.driver.deliveryPrefix} {order.id}
      </Text>
      <Text style={styles.meta}>Direccion: {order.address}</Text>
      <Text style={styles.meta}>Estado actual: {statusLabel(order.status)}</Text>
      <Text style={styles.meta}>Repartidor: {order.assignedDriverName ?? 'Sin asignar'}</Text>

      {!isOwner ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{es.driver.onlyOwnerCanUpdate}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{es.driver.nextAction}</Text>
        {nextAction && isOwner ? (
          <>
            {nextAction.nextStatus === 'ENTREGADO' ? (
              <View style={styles.proofForm}>
                <Text style={styles.inputLabel}>{es.driver.proofNoteLabel}</Text>
                <TextInput
                  value={deliveryNote}
                  onChangeText={setDeliveryNote}
                  placeholder={es.driver.proofNotePlaceholder}
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.textArea]}
                  multiline
                />
                <Text style={styles.inputLabel}>{es.driver.proofOtpLabel}</Text>
                <TextInput
                  value={deliveryOtp}
                  onChangeText={setDeliveryOtp}
                  placeholder="Ej. 123456"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />
                <Text style={styles.inputLabel}>{es.driver.proofPhotoLabel}</Text>
                <TextInput
                  value={deliveryPhotoUri}
                  onChangeText={setDeliveryPhotoUri}
                  placeholder="https://..."
                  placeholderTextColor="#6b7280"
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
    padding: 16,
    gap: 10,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    color: '#374151',
  },
  warningBox: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
  },
  warningText: {
    color: '#991b1b',
    fontWeight: '600',
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
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  noActionText: {
    color: '#6b7280',
  },
  proofForm: {
    gap: 6,
  },
  inputLabel: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#111827',
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
    borderColor: '#9ca3af',
    backgroundColor: '#ffffff',
  },
  timelineDotReached: {
    backgroundColor: '#bfdbfe',
    borderColor: '#3b82f6',
  },
  timelineDotCurrent: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  timelineTextBlock: {
    gap: 2,
    flex: 1,
  },
  timelineStatus: {
    color: '#374151',
    fontWeight: '600',
  },
  timelineStatusCurrent: {
    color: '#111827',
  },
  timelineDate: {
    color: '#6b7280',
    fontSize: 12,
  },
});
