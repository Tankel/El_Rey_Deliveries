import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';

export default function ClientOrdersScreen() {
  const { user } = useAuth();
  const { orders } = useOrders();

  const clientOrders = orders.filter((order) => order.clientId === user?.id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.navigation.myOrders}</Text>
      <FlatList
        data={clientOrders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>{es.client.noOrders}</Text>}
        renderItem={({ item }) => (
          <Link href={`/(client)/orders/${item.id}`} style={styles.item}>
            <Text style={styles.itemTitle}>{item.id}</Text>
            <Text>
              {item.status} | ${item.total}
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
