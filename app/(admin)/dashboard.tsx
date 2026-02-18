import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';

export default function AdminDashboardScreen() {
  const { signOut } = useAuth();
  const { orders } = useOrders();

  const pending = orders.filter((order) => order.status === 'PENDIENTE').length;
  const inRoute = orders.filter((order) => order.status === 'EN_CAMINO').length;
  const delivered = orders.filter((order) => order.status === 'ENTREGADO').length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.admin.dashboardTitle}</Text>
      <Text>
        {es.admin.pending}: {pending}
      </Text>
      <Text>
        {es.admin.inRoute}: {inRoute}
      </Text>
      <Text>
        {es.admin.delivered}: {delivered}
      </Text>
      <Link href="/(admin)/orders">{es.admin.manageOrders}</Link>
      <PrimaryButton label={es.common.logout} onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '700' },
});
