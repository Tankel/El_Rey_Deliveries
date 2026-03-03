import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';

export function DriverNotificationsBell() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, markNotificationRead } = useOrders();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const panelX = useRef(new Animated.Value(360)).current;

  const driverNotifications = useMemo(
    () =>
      notifications
        .filter((item) => item.audience === 'DRIVER' && item.targetUserId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, user?.id],
  );

  const unreadCount = driverNotifications.filter((item) => !item.read).length;

  const openPanel = () => {
    setOpen(true);
    Animated.timing(panelX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(panelX, {
      toValue: 360,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  return (
    <>
      <Pressable style={styles.bellButton} onPress={openPanel}>
        <Ionicons name="notifications-outline" size={24} color="#111827" />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={open} animationType="none" transparent onRequestClose={closePanel}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closePanel} />
          <Animated.View
            style={[
              styles.panel,
              {
                paddingTop: Math.max(insets.top + 10, 20),
                paddingBottom: Math.max(insets.bottom + 12, 20),
                transform: [{ translateX: panelX }],
              },
            ]}
          >
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{es.driver.notificationsTitle}</Text>
              <Pressable onPress={closePanel}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>

            {unreadCount > 0 ? (
              <Pressable
                style={styles.markAllButton}
                onPress={() =>
                  driverNotifications
                    .filter((item) => !item.read)
                    .forEach((item) => markNotificationRead(item.id))
                }
              >
                <Text style={styles.markAllButtonText}>{es.driver.markAllAsRead}</Text>
              </Pressable>
            ) : null}

            <ScrollView contentContainerStyle={styles.panelBody}>
              {driverNotifications.length === 0 ? (
                <Text style={styles.emptyText}>{es.driver.noNotifications}</Text>
              ) : (
                driverNotifications.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.notificationItem, !item.read && styles.unreadItem]}
                    onPress={() => {
                      markNotificationRead(item.id);
                      closePanel();
                      router.push(`/(driver)/deliveries/${item.orderId}`);
                    }}
                  >
                    <Text style={styles.notificationText}>{item.message}</Text>
                    <Text style={styles.notificationDate}>
                      {new Date(item.createdAt).toLocaleString('es-MX')}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -5,
    top: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17,24,39,0.15)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: 320,
    maxWidth: '86%',
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
    paddingHorizontal: 12,
    gap: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  markAllButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  markAllButtonText: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 12,
  },
  panelBody: {
    gap: 8,
    paddingBottom: 12,
  },
  emptyText: {
    color: '#6b7280',
  },
  notificationItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  unreadItem: {
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  notificationText: {
    color: '#111827',
    fontWeight: '600',
  },
  notificationDate: {
    color: '#6b7280',
    fontSize: 12,
  },
});
