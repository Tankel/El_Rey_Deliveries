import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminNotificationsBell } from '@/components/admin/AdminNotificationsBell';
import { useCatalog } from '@/context/CatalogContext';
import { useUsers } from '@/context/UsersContext';
import { exportAdminPdfReport } from '@/services/export/adminPdfReport';
import { exportAdminWorkbook } from '@/services/export/adminWorkbook';
import { buildOrderTrackingInsight, formatEtaLabel } from '@/services/insights/orderTracking';
import { buildStockBreakdownAlerts } from '@/services/insights/stockBreakdownAlerts';
import { buildStockAlerts, StockAlertSeverity } from '@/services/insights/stockAlerts';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { useToast } from '@/ui/feedback/ToastContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

const palette = {
  yellow: '#FFD400',
  gold: '#FFC300',
  orange: '#FF8C00',
  deepOrange: '#FF5F00',
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

function getSeverityLabel(severity: StockAlertSeverity) {
  if (severity === 'OUT') return 'Sin stock';
  if (severity === 'CRITICAL') return 'Critico';
  if (severity === 'WARNING') return 'Riesgo alto';
  return 'Monitorear';
}

function getSeverityStyles(severity: StockAlertSeverity) {
  if (severity === 'OUT') {
    return {
      backgroundColor: colors.dangerBg,
      borderColor: colors.dangerBorder,
      textColor: colors.danger,
    };
  }
  if (severity === 'CRITICAL') {
    return {
      backgroundColor: colors.warningBg,
      borderColor: colors.warningBorder,
      textColor: colors.warning,
    };
  }
  if (severity === 'WARNING') {
    return {
      backgroundColor: colors.infoBg,
      borderColor: colors.infoBorder,
      textColor: colors.info,
    };
  }
  return {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    textColor: colors.textSecondary,
  };
}

function formatDaysToStockout(daysToStockout: number | null) {
  if (daysToStockout === null) {
    return 'Sin demanda reciente';
  }
  return `${daysToStockout.toFixed(1)} dias`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
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
  const paidOrders = orders.filter((order) => order.paymentStatus === 'PAGADO_SIMULADO').length;
  const pendingPayments = orders.filter((order) => order.paymentStatus === 'PENDIENTE_PAGO').length;
  const stockAlerts = useMemo(
    () => buildStockAlerts({ products, orders, lookbackDays: 21, lowStockThreshold: 6 }),
    [orders, products],
  );
  const stockBreakdownAlerts = useMemo(
    () => buildStockBreakdownAlerts({ products, orders, lookbackDays: 21 }),
    [orders, products],
  );
  const activeTracking = useMemo(
    () =>
      orders
        .filter((order) => order.status !== 'ENTREGADO' && order.status !== 'CANCELADO')
        .map((order) => ({
          order,
          tracking: buildOrderTrackingInsight(order, orders),
        }))
        .sort((a, b) => (a.tracking.etaMinutes ?? Number.POSITIVE_INFINITY) - (b.tracking.etaMinutes ?? Number.POSITIVE_INFINITY))
        .slice(0, 5),
    [orders],
  );
  const criticalStockAlerts = stockAlerts.filter(
    (item) => item.severity === 'OUT' || item.severity === 'CRITICAL',
  ).length;
  const criticalBreakdownAlerts = stockBreakdownAlerts.filter(
    (item) => item.severity === 'OUT' || item.severity === 'CRITICAL',
  ).length;

  const kpis = [
    { indicador: 'Pedidos pendientes', valor: pending },
    { indicador: 'Pedidos en camino', valor: activeRoute },
    { indicador: 'Pedidos asignados', valor: assigned },
    { indicador: 'Pedidos entregados', valor: delivered },
    { indicador: 'Pedidos cancelados', valor: cancelled },
    { indicador: 'Venta entregada', valor: deliveredRevenue.toFixed(2) },
    { indicador: 'Usuarios activos', valor: activeUsers },
    { indicador: 'Intentos fallidos login', valor: failedLogins },
    { indicador: 'Pagos confirmados', valor: paidOrders },
    { indicador: 'Pagos pendientes', valor: pendingPayments },
    { indicador: 'Alertas stock criticas', valor: criticalStockAlerts },
    { indicador: 'Quiebres categoria/proveedor', valor: criticalBreakdownAlerts },
  ];

  const exportXlsx = async () => {
    const result = await exportAdminWorkbook({
      orders,
      users,
      products,
      kpis,
    });
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
  };

  const exportPdf = async () => {
    const result = await exportAdminPdfReport({
      orders,
      users,
      products,
      kpis,
    });
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>Panel Admin</Text>
        <View style={styles.bellWrap}>
          <AdminNotificationsBell />
        </View>
      </View>
      <View style={styles.topBarCard}>
        <Text style={styles.subtitle}>Control operativo y supervision del sistema</Text>
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
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pagos confirmados</Text>
          <Text style={styles.summaryValue}>{paidOrders}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pagos pendientes</Text>
          <Text style={styles.summaryValue}>{pendingPayments}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Alertas de stock</Text>
          <Text style={styles.summaryValue}>{stockAlerts.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Alertas por categoria/proveedor</Text>
          <Text style={styles.summaryValue}>{stockBreakdownAlerts.length}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Rastreo activo (ETA)</Text>
        {activeTracking.map(({ order, tracking }) => (
          <View key={order.id} style={styles.alertItem}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertName}>{order.id}</Text>
              <Text style={styles.alertEta}>ETA {formatEtaLabel(tracking.etaMinutes)}</Text>
            </View>
            <Text style={styles.alertMeta}>
              Cliente: {order.clientName} | Estado: {order.status}
            </Text>
            <Text style={styles.alertMeta}>
              Siguiente hito: {tracking.nextMilestone ?? 'Sin hito'} | Progreso: {tracking.progressPercent}%
            </Text>
          </View>
        ))}
        {activeTracking.length === 0 ? (
          <Text style={styles.emptyText}>No hay pedidos activos para rastrear.</Text>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Alertas predictivas de stock</Text>
          <Pressable style={styles.inlineLinkButton} onPress={() => router.push('/(admin)/products')}>
            <Text style={styles.inlineLinkText}>Ver productos</Text>
          </Pressable>
        </View>
        {stockAlerts.slice(0, 6).map((alert) => {
          const tone = getSeverityStyles(alert.severity);
          return (
            <View key={alert.productId} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertName}>{alert.productName}</Text>
                <View
                  style={[
                    styles.alertBadge,
                    {
                      backgroundColor: tone.backgroundColor,
                      borderColor: tone.borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.alertBadgeText, { color: tone.textColor }]}>
                    {getSeverityLabel(alert.severity)}
                  </Text>
                </View>
              </View>
              <Text style={styles.alertMeta}>
                Stock actual: {alert.currentStock} | Cobertura: {formatDaysToStockout(alert.daysToStockout)}
              </Text>
              <Text style={styles.alertMeta}>
                Demanda diaria: {alert.averageDailyDemand} | Reabasto sugerido: +{alert.recommendedRestock}
              </Text>
            </View>
          );
        })}
        {stockAlerts.length === 0 ? (
          <Text style={styles.emptyText}>Sin alertas por ahora. El stock esta estable.</Text>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Quiebres por categoria y proveedor</Text>
        {stockBreakdownAlerts.slice(0, 6).map((alert) => {
          const tone = getSeverityStyles(alert.severity);
          return (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertName}>
                  {alert.dimension === 'CATEGORY' ? 'Categoria' : 'Proveedor'}: {alert.key}
                </Text>
                <View
                  style={[
                    styles.alertBadge,
                    {
                      backgroundColor: tone.backgroundColor,
                      borderColor: tone.borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.alertBadgeText, { color: tone.textColor }]}>
                    {getSeverityLabel(alert.severity)}
                  </Text>
                </View>
              </View>
              <Text style={styles.alertMeta}>
                Productos: {alert.productCount} | Stock total: {alert.totalStock}
              </Text>
              <Text style={styles.alertMeta}>
                Cobertura: {formatDaysToStockout(alert.daysToStockout)} | Reabasto sugerido: +{alert.recommendedRestock}
              </Text>
            </View>
          );
        })}
        {stockBreakdownAlerts.length === 0 ? (
          <Text style={styles.emptyText}>Sin riesgo de quiebre por categoria/proveedor.</Text>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Modulos</Text>
        <Pressable style={styles.navButton} onPress={() => router.push('/(admin)/orders')}>
          <Text style={styles.navButtonText}>Pedidos ({orders.length})</Text>
          <Text style={styles.navButtonArrow}>{'>'}</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={() => router.push('/(admin)/users')}>
          <Text style={styles.navButtonText}>Usuarios ({users.length})</Text>
          <Text style={styles.navButtonArrow}>{'>'}</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={() => router.push('/(admin)/products')}>
          <Text style={styles.navButtonText}>Productos ({products.length})</Text>
          <Text style={styles.navButtonArrow}>{'>'}</Text>
        </Pressable>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Exportacion</Text>
        <Pressable style={styles.primaryButton} onPress={exportXlsx}>
          <Text style={styles.primaryButtonText}>Exportar XLSX (pedidos, usuarios, productos, KPIs)</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={exportPdf}>
          <Text style={styles.secondaryButtonText}>Exportar PDF (incluye pagos)</Text>
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
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bellWrap: {
    minWidth: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topBarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textMuted,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: typography.caption,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inlineLinkButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
  inlineLinkText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  alertItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: colors.surfaceMuted,
    gap: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  alertName: {
    color: colors.textPrimary,
    fontWeight: '800',
    flex: 1,
  },
  alertBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  alertMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  alertEta: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  navButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  navButtonArrow: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: colors.primaryText,
    textAlign: 'center',
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
  },
  logItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    gap: 2,
    backgroundColor: colors.surfaceMuted,
  },
  logAction: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  logMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  logMessage: {
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
