import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { usePedidos } from '@/features/pedidos/hooks/usePedidos';
import { es } from '@/i18n/es';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';

export default function PedidosScreen() {
  const { pedidos, loadPedidos, createPedido, isLoading } = usePedidos();

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.orders.title}</Text>
      <PrimaryButton
        label={es.orders.demoCreate}
        onPress={() =>
          createPedido({
            clienteNombre: 'Cliente Demo',
            total: 1500,
          })
        }
      />
      <Text>{isLoading ? es.common.loading : es.orders.count(pedidos.length)}</Text>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.clienteNombre}</Text>
            <Text>
              ${item.total} | {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemTitle: { fontWeight: '600' },
});
