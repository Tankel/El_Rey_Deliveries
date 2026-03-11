import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DriverNotificationsBell } from '@/components/driver/DriverNotificationsBell';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { colors, radius, spacing } from '@/ui/theme/tokens';

export default function DriverInboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();

  const newAssignments = useMemo(
    () =>
      orders
        .filter((item) => item.assignedDriverId === user?.id && item.status === 'ASIGNADO')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [orders, user?.id],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{es.navigation.driverInbox}</Text>
        <DriverNotificationsBell />
      </View>
      <Text style={styles.helperText}>{es.driver.onlyAssignmentsInfo}</Text>
      <FlatList
        data={newAssignments}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No tienes nuevas asignaciones.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.assignmentCard}
            onPress={() => router.push(`/(driver)/deliveries/${item.id}`)}
          >
            <Text style={styles.assignmentId}>{item.id}</Text>
            <Text style={styles.assignmentMeta}>{item.address}</Text>
            <Text style={styles.assignmentMeta}>
              Actualizado: {new Date(item.updatedAt).toLocaleString('es-MX')}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.assignmentList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: 10,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  assignmentList: {
    gap: spacing.sm,
    paddingBottom: 10,
  },
  assignmentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: radius.lg,
    padding: 10,
    gap: 4,
  },
  assignmentId: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  assignmentMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
});

