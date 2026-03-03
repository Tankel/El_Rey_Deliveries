import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { es } from '@/i18n/es';
import { DriverProfile, Order, OrderStatus } from '@/types/domain';

type CreateOrderPayload = {
  clientId: string;
  clientName: string;
  address: string;
  total: number;
  notes?: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

type OrderNotification = {
  id: string;
  orderId: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type OrdersContextValue = {
  drivers: DriverProfile[];
  orders: Order[];
  notifications: OrderNotification[];
  unreadNotificationsCount: number;
  createOrder: (payload: CreateOrderPayload) => ActionResult;
  assignDriver: (orderId: string, driverId: string) => ActionResult;
  confirmOrderWithDriver: (orderId: string, driverId: string) => ActionResult;
  updateStatus: (orderId: string, nextStatus: OrderStatus) => ActionResult;
  forceStatus: (orderId: string, nextStatus: OrderStatus) => ActionResult;
  getAllowedNextStatuses: (orderId: string) => OrderStatus[];
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
};

const initialDrivers: DriverProfile[] = [
  { id: 'driver-juan', name: 'Juan Perez' },
  { id: 'driver-marta', name: 'Marta Diaz' },
];

const now = new Date().toISOString();
const initialOrders: Order[] = [
  {
    id: 'order-1001',
    clientId: 'cliente-demo',
    clientName: 'Cliente Demo',
    address: 'Av. Central 123',
    status: 'PENDIENTE',
    total: 320,
    createdAt: now,
    updatedAt: now,
  },
];

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);
const ORDERS_STORAGE_KEY = 'mvp.orders.items';
const ORDER_NOTIFICATIONS_STORAGE_KEY = 'mvp.orders.notifications';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ASIGNADO', 'CANCELADO'],
  ASIGNADO: ['ACEPTADO_REPARTIDOR', 'CANCELADO'],
  ACEPTADO_REPARTIDOR: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

function canTransition(current: OrderStatus, next: OrderStatus) {
  return allowedTransitions[current].includes(next);
}

export function OrdersProvider({ children }: PropsWithChildren) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  useEffect(() => {
    const hydrate = async () => {
      const storedOrders = await jsonStorage.read<Order[]>(ORDERS_STORAGE_KEY, initialOrders);
      const storedNotifications = await jsonStorage.read<OrderNotification[]>(
        ORDER_NOTIFICATIONS_STORAGE_KEY,
        [],
      );
      setOrders(storedOrders);
      setNotifications(storedNotifications);
    };

    hydrate();
  }, []);

  useEffect(() => {
    void jsonStorage.write(ORDERS_STORAGE_KEY, orders);
  }, [orders]);

  useEffect(() => {
    void jsonStorage.write(ORDER_NOTIFICATIONS_STORAGE_KEY, notifications);
  }, [notifications]);

  const value = useMemo<OrdersContextValue>(
    () => ({
      drivers: initialDrivers,
      orders,
      notifications,
      unreadNotificationsCount: notifications.filter((item) => !item.read).length,
      createOrder: (payload: CreateOrderPayload) => {
        const timestamp = new Date().toISOString();
        const nextOrder: Order = {
          id: `order-${Date.now()}`,
          clientId: payload.clientId,
          clientName: payload.clientName,
          address: payload.address,
          total: payload.total,
          notes: payload.notes,
          status: 'PENDIENTE',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        setOrders((prev) => [nextOrder, ...prev]);
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            orderId: nextOrder.id,
            message: `Nuevo pedido recibido: ${nextOrder.id}`,
            createdAt: timestamp,
            read: false,
          },
          ...prev,
        ]);
        return { ok: true, message: es.orders.created };
      },
      assignDriver: (orderId: string, driverId: string) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, message: es.orders.notFound };
        }
        const driver = initialDrivers.find((item) => item.id === driverId);
        if (!driver) {
          return { ok: false, message: es.orders.driverNotFound };
        }
        if (!(order.status === 'EN_PREPARACION' || order.status === 'CONFIRMADO')) {
          if (order.status === 'PENDIENTE') {
            setOrders((prev) =>
              prev.map((item) =>
                item.id === orderId
                  ? {
                      ...item,
                      assignedDriverId: driver.id,
                      assignedDriverName: driver.name,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            );
            return { ok: true, message: `Repartidor ${driver.name} asignado.` };
          }
          return {
            ok: false,
            message: es.orders.assignInvalid,
          };
        }
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId && (order.status === 'EN_PREPARACION' || order.status === 'CONFIRMADO')
              ? {
                  ...order,
                  assignedDriverId: driver.id,
                  assignedDriverName: driver.name,
                  status: 'ASIGNADO',
                  updatedAt: new Date().toISOString(),
                }
              : order,
          ),
        );
        return { ok: true, message: es.orders.assigned(driver.name) };
      },
      confirmOrderWithDriver: (orderId: string, driverId: string) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, message: es.orders.notFound };
        }
        if (order.status !== 'PENDIENTE') {
          return { ok: false, message: 'Solo se puede confirmar desde estado Pendiente.' };
        }
        const driver = initialDrivers.find((item) => item.id === driverId);
        if (!driver) {
          return { ok: false, message: es.orders.driverNotFound };
        }

        setOrders((prev) =>
          prev.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  status: 'ASIGNADO',
                  assignedDriverId: driver.id,
                  assignedDriverName: driver.name,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        return { ok: true, message: `Pedido confirmado y asignado a ${driver.name}.` };
      },
      updateStatus: (orderId: string, nextStatus: OrderStatus) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, message: es.orders.notFound };
        }
        if (nextStatus === 'CONFIRMADO' && !order.assignedDriverId) {
          return {
            ok: false,
            message: 'Debes asignar un repartidor antes de confirmar el pedido.',
          };
        }
        if (order.status === nextStatus) {
          return { ok: false, message: es.orders.alreadyInStatus(nextStatus) };
        }
        if (!canTransition(order.status, nextStatus)) {
          return {
            ok: false,
            message: es.orders.invalidTransition(order.status, nextStatus),
          };
        }
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId && canTransition(order.status, nextStatus)
              ? {
                  ...order,
                  status: nextStatus,
                  updatedAt: new Date().toISOString(),
                }
              : order,
          ),
        );
        return { ok: true, message: es.orders.updated(nextStatus) };
      },
      forceStatus: (orderId: string, nextStatus: OrderStatus) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, message: es.orders.notFound };
        }
        if (order.status === nextStatus) {
          return { ok: false, message: es.orders.alreadyInStatus(nextStatus) };
        }
        setOrders((prev) =>
          prev.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  status: nextStatus,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        return { ok: true, message: `Estado forzado a ${nextStatus}.` };
      },
      getAllowedNextStatuses: (orderId: string) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return [];
        }
        return allowedTransitions[order.status];
      },
      markNotificationRead: (notificationId: string) => {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? {
                  ...item,
                  read: true,
                }
              : item,
          ),
        );
      },
      markAllNotificationsRead: () => {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      },
    }),
    [notifications, orders],
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
