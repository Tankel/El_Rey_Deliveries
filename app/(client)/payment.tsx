import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCart } from '@/context/CartContext';
import { PaymentMethod } from '@/types/domain';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

const METHODS: PaymentMethod[] = ['TARJETA', 'EFECTIVO', 'TRANSFERENCIA'];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function PaymentSimulationScreen() {
  const router = useRouter();
  const { items, subtotal, totalSavings, confirmOrder } = useCart();
  const { showToast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>('TARJETA');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        onPress={submitPayment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: {
    color: '#4b5563',
    fontWeight: '600',
  },
  value: {
    color: '#111827',
    fontWeight: '800',
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  methodChipSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  methodText: {
    color: '#374151',
    fontWeight: '700',
  },
  methodTextSelected: {
    color: '#ffffff',
  },
});
