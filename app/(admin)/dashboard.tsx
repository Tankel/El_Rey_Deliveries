import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminNotificationsBell } from '@/components/admin/AdminNotificationsBell';
import { useCatalog } from '@/context/CatalogContext';
import { useUsers } from '@/context/UsersContext';
import { exportAdminWorkbook } from '@/services/export/adminWorkbook';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { useToast } from '@/ui/feedback/ToastContext';

const palette = {
  yellow: '#FFD400',
  gold: '#FFC300',
  orange: '#FF8C00',
  deepOrange: '#FF5F00',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  card: '#ffffff',
};

type MetricCardProps = {
  value: number | string;
  label: string;
  accent: string;
};

function MetricCard({ value, label, accent }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const { orders } = useOrders();
  const { users } = useUsers();
  const { products } = useCatalog();
  const { auditLog } = useAuth();
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
  const failedLogins = auditLog.filter((item) => item.action === 'LOGIN_FAILED').length;

  const exportXlsx = async () => {
    const result = await exportAdminWorkbook({
      orders,
      users,
      products,
      kpis: [
        { indicador: 'Pedidos pendientes', valor: pending },
        { indicador: 'Pedidos en camino', valor: activeRoute },
        { indicador: 'Pedidos asignados', valor: assigned },
        { indicador: 'Pedidos entregados', valor: delivered },
        { indicador: 'Pedidos cancelados', valor: cancelled },
        { indicador: 'Venta entregada', valor: deliveredRevenue.toFixed(2) },
        { indicador: 'Usuarios activos', valor: activeUsers },
        { indicador: 'Intentos fallidos login', valor: failedLogins },
      ],
    });
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBarCard}>
        <View>
          <Text style={styles.title}>Panel Admin</Text>
          <Text style={styles.subtitle}>Control operativo y supervision del sistema</Text>
        </View>
        <AdminNotificationsBell />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard value={pending} label="Pendientes" accent={palette.yellow} />
        <MetricCard value={assigned} label="Asignados" accent={palette.gold} />
        <MetricCard value={activeRoute} label="En camino" accent={palette.orange} />
        <MetricCard value={delivered} label="Entregados" accent={palette.deepOrange} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Resumen rapido</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Venta entregada</Text>
          <Text style={styles.summaryValue}>${deliveredRevenue.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Usuarios activos</Text>
          <Text style={styles.summaryValue}>{activeUsers}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Login fallido</Text>
          <Text style={styles.summaryValue}>{failedLogins}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Modulos</Text>
        <Link href="/(admin)/orders" asChild>
          <Pressable style={styles.navButton}>
            <Text style={styles.navButtonText}>Pedidos ({orders.length})</Text>
            <Text style={styles.navButtonArrow}>›</Text>
          </Pressable>
        </Link>
        <Link href="/(admin)/users" asChild>
          <Pressable style={styles.navButton}>
            <Text style={styles.navButtonText}>Usuarios ({users.length})</Text>
            <Text style={styles.navButtonArrow}>›</Text>
          </Pressable>
        </Link>
        <Link href="/(admin)/products" asChild>
          <Pressable style={styles.navButton}>
            <Text style={styles.navButtonText}>Productos ({products.length})</Text>
            <Text style={styles.navButtonArrow}>›</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Exportacion</Text>
        <Pressable style={styles.primaryButton} onPress={exportXlsx}>
          <Text style={styles.primaryButtonText}>Exportar XLSX (pedidos, usuarios, productos, KPIs)</Text>
        </Pressable>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Bitacora de acceso</Text>
        {auditLog.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.logItem}>
            <Text style={styles.logAction}>{item.action}</Text>
            <Text style={styles.logMeta}>{item.username} - {new Date(item.at).toLocaleString('es-MX')}</Text>
            <Text style={styles.logMessage}>{item.message}</Text>
          </View>
        ))}
        {auditLog.length === 0 ? <Text style={styles.emptyText}>Sin eventos de autenticacion.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  topBarCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    color: palette.muted,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  metricAccent: {
    width: 36,
    height: 4,
    borderRadius: 999,
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: palette.text,
  },
  metricLabel: {
    color: '#4b5563',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    backgroundColor: palette.card,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  summaryLabel: {
    color: '#374151',
    fontWeight: '600',
  },
  summaryValue: {
    color: palette.text,
    fontWeight: '800',
  },
  navButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButtonText: {
    color: palette.text,
    fontWeight: '700',
  },
  navButtonArrow: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 10,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '800',
  },
  logItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 2,
    backgroundColor: '#f8fafc',
  },
  logAction: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
  },
  logMeta: {
    color: '#6b7280',
    fontSize: 12,
  },
  logMessage: {
    color: '#374151',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
