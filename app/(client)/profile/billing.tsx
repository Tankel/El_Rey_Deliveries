import { FlatList, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

type Invoice = {
  id: string;
  period: string;
  amount: number;
  status: 'PAGADA' | 'PENDIENTE';
};

const LOCAL_INVOICES: Invoice[] = [
  { id: 'FAC-2026-001', period: 'Enero 2026', amount: 2890, status: 'PAGADA' },
  { id: 'FAC-2026-002', period: 'Febrero 2026', amount: 3150, status: 'PENDIENTE' },
];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function BillingScreen() {
  const { showToast } = useToast();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Facturas</Text>
      <FlatList
        data={LOCAL_INVOICES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.invoiceId}>{item.id}</Text>
            <Text>{item.period}</Text>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.status}>Estado: {item.status}</Text>
            <PrimaryButton
              label="Descargar PDF"
              onPress={() =>
                showToast({
                  type: 'success',
                  message: `Descarga simulada para ${item.id}.`,
                })
              }
            />
          </View>
        )}
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
  listContent: {
    gap: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  invoiceId: {
    fontWeight: '700',
    color: '#111827',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  status: {
    color: '#4b5563',
  },
});
