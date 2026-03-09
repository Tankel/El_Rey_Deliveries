import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminNotificationsBell } from '@/components/admin/AdminNotificationsBell';
import { useCatalog } from '@/context/CatalogContext';
import { useUsers } from '@/context/UsersContext';
import { useOrders } from '@/state/OrdersContext';
import { useToast } from '@/ui/feedback/ToastContext';

function asCsv(headers: string[], rows: Array<Array<string | number>>) {
  const head = headers.join(',');
  const body = rows.map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(','));
  return [head, ...body].join('\n');
}

export default function AdminDashboardScreen() {
  const { orders } = useOrders();
  const { users } = useUsers();
  const { products } = useCatalog();
  const { showToast } = useToast();

  const pending = orders.filter((order) => order.status === 'PENDIENTE').length;
  const activeRoute = orders.filter((order) => order.status === 'EN_CAMINO').length;
  const delivered = orders.filter((order) => order.status === 'ENTREGADO').length;
  const cancelled = orders.filter((order) => order.status === 'CANCELADO').length;
  const assigned = orders.filter((order) => order.status === 'ASIGNADO').length;
  const deliveredRevenue = orders
    .filter((order) => order.status === 'ENTREGADO')
    .reduce((acc, item) => acc + item.total, 0);
  const activeUsers = users.filter((item) => item.isActive).length;

  const exportOrdersCsv = () => {
    const csv = asCsv(
      ['id', 'cliente', 'estado', 'total', 'direccion', 'repartidor', 'actualizado'],
      orders.map((item) => [
        item.id,
        item.clientName,
        item.status,
        item.total,
        item.address,
        item.assignedDriverName ?? '',
        item.updatedAt,
      ]),
    );
    console.log('CSV_ORDERS\n' + csv);
    showToast({ type: 'success', message: 'CSV de pedidos generado (ver consola).' });
  };

  const exportUsersCsv = () => {
    const csv = asCsv(
      ['id', 'username', 'nombre', 'rol', 'activo', 'correo', 'telefono'],
      users.map((item) => [
        item.id,
        item.username,
        item.fullName,
        item.role,
        item.isActive ? 'si' : 'no',
        item.email,
        item.phone,
      ]),
    );
    console.log('CSV_USERS\n' + csv);
    showToast({ type: 'success', message: 'CSV de usuarios generado (ver consola).' });
  };

  const exportProductsCsv = () => {
    const csv = asCsv(
      ['id', 'nombre', 'marca', 'categoria', 'precio', 'stock', 'descuento'],
      products.map((item) => [
        item.id,
        item.name,
        item.brand,
        item.category,
        item.price,
        item.stock ?? 0,
        item.discountPercent,
      ]),
    );
    console.log('CSV_PRODUCTS\n' + csv);
    showToast({ type: 'success', message: 'CSV de productos generado (ver consola).' });
  };

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
          <Text style={styles.kpiValue}>{assigned}</Text>
          <Text style={styles.kpiLabel}>Asignados</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{delivered}</Text>
          <Text style={styles.kpiLabel}>Entregados</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{cancelled}</Text>
          <Text style={styles.kpiLabel}>Cancelados</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>${deliveredRevenue.toFixed(0)}</Text>
          <Text style={styles.kpiLabel}>Venta entregada</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{activeUsers}</Text>
          <Text style={styles.kpiLabel}>Usuarios activos</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{products.length}</Text>
          <Text style={styles.kpiLabel}>Productos</Text>
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
        <Link href="/(admin)/profile" asChild>
          <Pressable style={styles.navCard}>
            <Text style={styles.navTitle}>Perfil admin</Text>
            <Text style={styles.navMeta}>Configuracion y cierre de sesion</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exportaciones (CSV)</Text>
        <Pressable style={styles.exportBtn} onPress={exportOrdersCsv}>
          <Text style={styles.exportBtnText}>Exportar pedidos</Text>
        </Pressable>
        <Pressable style={styles.exportBtn} onPress={exportUsersCsv}>
          <Text style={styles.exportBtnText}>Exportar usuarios</Text>
        </Pressable>
        <Pressable style={styles.exportBtn} onPress={exportProductsCsv}>
          <Text style={styles.exportBtnText}>Exportar productos</Text>
        </Pressable>
      </View>
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
  exportBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exportBtnText: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
