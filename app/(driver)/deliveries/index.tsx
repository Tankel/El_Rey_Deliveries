import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';

export default function DriverDeliveriesScreen() {
  const { user, signOut } = useAuth();
  const { orders } = useOrders();

  const driverOrders = orders.filter((order) => order.assignedDriverId === user?.id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.navigation.driverDeliveries}</Text>
      <PrimaryButton label={es.common.logout} onPress={signOut} />
      <FlatList
        data={driverOrders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>{es.driver.noAssignedOrders}</Text>}
        renderItem={({ item }) => (
          <Link href={`/(driver)/deliveries/${item.id}`} style={styles.item}>
            <Text style={styles.itemTitle}>{item.id}</Text>
            <Text>
              {item.address} | {item.status}
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
