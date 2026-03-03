import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DriverNotificationsBell } from '@/components/driver/DriverNotificationsBell';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';

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
    padding: 16,
    gap: 10,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    color: '#4b5563',
    fontSize: 12,
  },
  assignmentList: {
    gap: 8,
    paddingBottom: 10,
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  assignmentId: {
    color: '#111827',
    fontWeight: '700',
  },
  assignmentMeta: {
    color: '#4b5563',
    fontSize: 12,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
