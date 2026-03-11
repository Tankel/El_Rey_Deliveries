import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCart } from '@/context/CartContext';
import { PaymentMethod } from '@/types/domain';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

const METHODS: PaymentMethod[] = ['TARJETA', 'EFECTIVO', 'TRANSFERENCIA'];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function PaymentSimulationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lng?: string;
    validatedBy?: 'GOOGLE' | 'MANUAL';
    placeId?: string;
  }>();
  const { items, subtotal, totalSavings, confirmOrder } = useCart();
  const { showToast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>('TARJETA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const address = typeof params.address === 'string' ? params.address : '';
  const lat = Number(typeof params.lat === 'string' ? params.lat : Number.NaN);
  const lng = Number(typeof params.lng === 'string' ? params.lng : Number.NaN);
  const validatedBy = params.validatedBy === 'GOOGLE' ? 'GOOGLE' : 'MANUAL';
  const placeId = typeof params.placeId === 'string' ? params.placeId : '';
  const hasDeliveryLocation = address.trim().length > 0 && Number.isFinite(lat) && Number.isFinite(lng);

  const productsCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );

  const submitPayment = () => {
    if (items.length === 0) {
      showToast({ message: 'No hay productos en el carrito.', type: 'error' });
      router.back();
      return;
    }
    if (!hasDeliveryLocation) {
      showToast({ message: 'Primero confirma un domicilio valido.', type: 'error' });
      router.replace('/(client)/checkout-address');
      return;
    }

    Alert.alert(
      'Confirmar pago',
      `Metodo: ${method}. Total: ${formatCurrency(subtotal)}. Deseas confirmar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsSubmitting(true);
            const result = confirmOrder({
              address,
              deliveryLocation: {
                formattedAddress: address,
                lat,
                lng,
                placeId: placeId || undefined,
                validatedBy,
                validatedAt: new Date().toISOString(),
              },
              notes: `Pago simulado confirmado (${method}).`,
              paymentMethod: method,
              paymentStatus: 'PAGADO_SIMULADO',
            });
            showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
            await new Promise((resolve) => setTimeout(resolve, 220));
            setIsSubmitting(false);
            if (result.ok) {
              router.replace('/(client)/orders');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simulacion de pago</Text>
      <Text style={styles.subtitle}>Confirma tu metodo y revisa el resumen antes de generar el pedido.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Productos</Text>
          <Text style={styles.value}>{productsCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.value}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ahorro</Text>
          <Text style={styles.value}>{formatCurrency(totalSavings)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Domicilio</Text>
          <Text style={[styles.value, styles.addressValue]} numberOfLines={2}>
            {hasDeliveryLocation ? address : 'No validado'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Metodo de pago</Text>
        <View style={styles.methodsRow}>
          {METHODS.map((item) => {
            const selected = item === method;
            return (
              <Pressable
                key={item}
                style={[styles.methodChip, selected && styles.methodChipSelected]}
                onPress={() => setMethod(item)}
              >
                <Text style={[styles.methodText, selected && styles.methodTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <PrimaryButton
        label="Pagar y confirmar pedido"
        loading={isSubmitting}
        loadingLabel="Confirmando..."
        disabled={!hasDeliveryLocation}
        onPress={submitPayment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textMuted,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: typography.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '800',
    maxWidth: '60%',
    textAlign: 'right',
  },
  addressValue: {
    fontSize: 12,
    lineHeight: 16,
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  methodChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  methodText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  methodTextSelected: {
    color: colors.primaryText,
  },
});
