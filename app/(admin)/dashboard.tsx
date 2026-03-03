import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminNotificationsBell } from '@/components/admin/AdminNotificationsBell';
import { useCatalog } from '@/context/CatalogContext';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';

export default function AdminDashboardScreen() {
  const { signOut } = useAuth();
  const { orders } = useOrders();
  const { users } = useUsers();
  const { products } = useCatalog();

  const pending = orders.filter((order) => order.status === 'PENDIENTE').length;
  const activeRoute = orders.filter((order) => order.status === 'EN_CAMINO').length;
  const delivered = orders.filter((order) => order.status === 'ENTREGADO').length;
  const cancelled = orders.filter((order) => order.status === 'CANCELADO').length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Panel Admin</Text>
        <AdminNotificationsBell />
      </View>
      <Text style={styles.subtitle}>Resumen rapido de operacion</Text>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{pending}</Text>
          <Text style={styles.kpiLabel}>Pendientes</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{activeRoute}</Text>
          <Text style={styles.kpiLabel}>En camino</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{delivered}</Text>
          <Text style={styles.kpiLabel}>Entregados</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{cancelled}</Text>
          <Text style={styles.kpiLabel}>Cancelados</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestion</Text>
        <Link href="/(admin)/orders" asChild>
          <Pressable style={styles.navCard}>
            <Text style={styles.navTitle}>Pedidos</Text>
            <Text style={styles.navMeta}>Total: {orders.length}</Text>
          </Pressable>
        </Link>
        <Link href="/(admin)/users" asChild>
          <Pressable style={styles.navCard}>
            <Text style={styles.navTitle}>Usuarios</Text>
            <Text style={styles.navMeta}>Total: {users.length}</Text>
          </Pressable>
        </Link>
        <Link href="/(admin)/products" asChild>
          <Pressable style={styles.navCard}>
            <Text style={styles.navTitle}>Productos</Text>
            <Text style={styles.navMeta}>Total: {products.length}</Text>
          </Pressable>
        </Link>
      </View>

      <PrimaryButton label="Cerrar sesion" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    color: '#6b7280',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  kpiLabel: {
    color: '#4b5563',
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  navCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  navTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  navMeta: {
    color: '#4b5563',
  },
});
