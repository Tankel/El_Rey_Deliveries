import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useOrders } from '@/state/OrdersContext';

export default function AdminOrdersScreen() {
  const { orders } = useOrders();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/(admin)/orders/${item.id}`} style={styles.item}>
            <Text style={styles.itemTitle}>{item.id}</Text>
            <Text>
              {item.clientName} | {item.status}
            </Text>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 10,
  },
  itemTitle: { fontWeight: '600' },
});
