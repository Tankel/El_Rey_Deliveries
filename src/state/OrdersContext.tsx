import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { ORDER_ALLOWED_TRANSITIONS } from '@/domain/rules/orderRules';
import {
  assignOrderDriver,
  createOrder,
  DriverProfile,
  forceOrderStatus,
  listOrderNotifications,
  listOrders,
  markAllOrderNotificationsRead,
  markOrderNotificationsRead,
  OrderNotification,
  UpdateOrderStatusOptions,
  updateOrderStatus,
} from '@/services/api/endpoints/orders';
import {
  DeliveryLocation,
  DeliveryRecipientRelation,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '@/types/domain';
import { useAuth } from './AuthContext';

type CreateOrderPayload = {
  clientId: string;
  clientName: string;
  address: string;
  deliveryLocation?: DeliveryLocation;
  total: number;
  notes?: string;
  items?: OrderItem[];
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

type UpdateStatusOptions = {
  actorId?: string;
  actorRole?: UserRole;
  deliveryNote?: string;
  deliveryRecipientName?: string;
  deliveryRecipientRelation?: DeliveryRecipientRelation;
  deliveryRecipientId?: string;
  deliveryOtp?: string;
  deliveryPhotoUri?: string;
};

type OrdersContextValue = {
  drivers: DriverProfile[];
  orders: Order[];
  notifications: OrderNotification[];
  unreadNotificationsCount: number;
  isHydrated: boolean;
  refreshOrders: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  createOrder: (payload: CreateOrderPayload) => Promise<ActionResult>;
  assignDriver: (orderId: string, driverId: string) => Promise<ActionResult>;
  confirmOrderWithDriver: (orderId: string, driverId: string) => Promise<ActionResult>;
  updateStatus: (orderId: string, nextStatus: OrderStatus, options?: UpdateStatusOptions) => Promise<ActionResult>;
  forceStatus: (orderId: string, nextStatus: OrderStatus) => Promise<ActionResult>;
  getAllowedNextStatuses: (orderId: string) => OrderStatus[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  markNotificationsRead: (notificationIds: string[]) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshOrders = async () => {
    try {
      const response = await listOrders();
      setOrders(response.items);
      setDrivers(response.drivers);
    } catch {
      setOrders([]);
      setDrivers([]);
    } finally {
      setIsHydrated(true);
    }
  };

  const refreshNotifications = async () => {
    try {
      const response = await listOrderNotifications();
      setNotifications(response.items);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    void refreshOrders();
    void refreshNotifications();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      setDrivers([]);
      setNotifications([]);
      setIsHydrated(true);
      return;
    }
    void refreshOrders();
    void refreshNotifications();
  }, [isAuthenticated, user?.id]);

  const value = useMemo<OrdersContextValue>(
    () => ({
      drivers,
      orders,
      notifications,
      isHydrated,
      unreadNotificationsCount: notifications.filter((item) => !item.read && item.audience === 'ADMIN').length,
      refreshOrders,
      refreshNotifications,
      createOrder: async (payload) => {
        try {
          const response = await createOrder({
            ...payload,
            items: payload.items ?? [],
          });
          setOrders((prev) => [response.order, ...prev]);
          await refreshNotifications();
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear pedido.' };
        }
      },
      assignDriver: async (orderId, driverId) => {
        try {
          const response = await assignOrderDriver(orderId, driverId);
          setOrders((prev) => prev.map((item) => (item.id === orderId ? response.order : item)));
          await refreshNotifications();
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo asignar repartidor.' };
        }
      },
      confirmOrderWithDriver: async (orderId, driverId) => {
        try {
          const assignResponse = await assignOrderDriver(orderId, driverId);
          const updateResponse = await forceOrderStatus(orderId, 'ASIGNADO');
          setOrders((prev) =>
            prev.map((item) => {
              if (item.id !== orderId) {
                return item;
              }
              return updateResponse.order ?? assignResponse.order;
            }),
          );
          await refreshNotifications();
          return { ok: true, message: `Pedido confirmado y asignado a ${assignResponse.order.assignedDriverName ?? 'repartidor'}.` };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo confirmar pedido.' };
        }
      },
      updateStatus: async (orderId, nextStatus, options) => {
        try {
          const requestOptions: UpdateOrderStatusOptions = {
            ...(options ?? {}),
          };
          const response = await updateOrderStatus(orderId, nextStatus, requestOptions);
          setOrders((prev) => prev.map((item) => (item.id === orderId ? response.order : item)));
          await refreshNotifications();
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar pedido.' };
        }
      },
      forceStatus: async (orderId, nextStatus) => {
        try {
          const response = await forceOrderStatus(orderId, nextStatus);
          setOrders((prev) => prev.map((item) => (item.id === orderId ? response.order : item)));
          await refreshNotifications();
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo forzar estado.' };
        }
      },
      getAllowedNextStatuses: (orderId) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return [];
        }
        return ORDER_ALLOWED_TRANSITIONS[order.status] ?? [];
      },
      markNotificationRead: async (notificationId) => {
        await markOrderNotificationsRead([notificationId]);
        setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));
      },
      markNotificationsRead: async (notificationIds) => {
        if (!notificationIds.length) {
          return;
        }
        await markOrderNotificationsRead(notificationIds);
        const setIds = new Set(notificationIds);
        setNotifications((prev) => prev.map((item) => (setIds.has(item.id) ? { ...item, read: true } : item)));
      },
      markAllNotificationsRead: async () => {
        await markAllOrderNotificationsRead();
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      },
    }),
    [drivers, isHydrated, notifications, orders],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used inside OrdersProvider');
  }
  return context;
}
