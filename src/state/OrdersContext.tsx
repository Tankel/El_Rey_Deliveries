import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { es } from '@/i18n/es';
import {
  DeliveryProof,
  DriverProfile,
  Order,
  OrderStatus,
  OrderStatusHistoryEntry,
  UserRole,
} from '@/types/domain';

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

type UpdateStatusOptions = {
  actorId?: string;
  actorRole?: UserRole;
  deliveryNote?: string;
  deliveryOtp?: string;
  deliveryPhotoUri?: string;
};

type OrderNotificationAudience = 'ADMIN' | 'DRIVER';
type OrderNotificationType = 'NEW_ORDER' | 'DRIVER_ASSIGNED' | 'ORDER_CANCELLED';

type OrderNotification = {
  id: string;
  orderId: string;
  type: OrderNotificationType;
  audience: OrderNotificationAudience;
  targetUserId?: string;
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
  updateStatus: (orderId: string, nextStatus: OrderStatus, options?: UpdateStatusOptions) => ActionResult;
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
    statusHistory: [
      {
        status: 'PENDIENTE',
        at: now,
      },
    ],
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

function toIsoNow() {
  return new Date().toISOString();
}

function normalizeOrder(order: Order): Order {
  const createdAt = order.createdAt ?? toIsoNow();
  const updatedAt = order.updatedAt ?? createdAt;
  const history: OrderStatusHistoryEntry[] = order.statusHistory?.length
    ? order.statusHistory
    : [
        {
          status: 'PENDIENTE',
          at: createdAt,
        },
      ];

  const hasCurrentStatus = history.some((entry) => entry.status === order.status);
  const statusHistory = hasCurrentStatus
    ? history
    : [
        ...history,
        {
          status: order.status,
          at: updatedAt,
        },
      ];

  return {
    ...order,
    createdAt,
    updatedAt,
    statusHistory,
  };
}

function normalizeNotification(
  notification: Partial<OrderNotification> & Pick<OrderNotification, 'id' | 'orderId' | 'message' | 'createdAt'>,
): OrderNotification {
  return {
    id: notification.id,
    orderId: notification.orderId,
    message: notification.message,
    createdAt: notification.createdAt,
    read: Boolean(notification.read),
    audience: notification.audience ?? 'ADMIN',
    type: notification.type ?? 'NEW_ORDER',
    targetUserId: notification.targetUserId,
  };
}

function appendStatusHistory(
  order: Order,
  status: OrderStatus,
  timestamp: string,
  meta?: Pick<OrderStatusHistoryEntry, 'byRole' | 'byUserId' | 'note'>,
) {
  const history = order.statusHistory ?? [];
  const last = history[history.length - 1];
  if (last?.status === status) {
    return history;
  }
  return [
    ...history,
    {
      status,
      at: timestamp,
      byRole: meta?.byRole,
      byUserId: meta?.byUserId,
      note: meta?.note,
    },
  ];
}

function buildDriverAssignmentNotification(orderId: string, driver: DriverProfile, timestamp: string) {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    orderId,
    type: 'DRIVER_ASSIGNED' as const,
    audience: 'DRIVER' as const,
    targetUserId: driver.id,
    message: `Se te asigno el pedido ${orderId}.`,
    createdAt: timestamp,
    read: false,
  };
}

function buildDriverCancelledNotification(order: Order, timestamp: string) {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    orderId: order.id,
    type: 'ORDER_CANCELLED' as const,
    audience: 'DRIVER' as const,
    targetUserId: order.assignedDriverId,
    message: `El pedido ${order.id} fue cancelado.`,
    createdAt: timestamp,
    read: false,
  };
}

function buildDeliveryProof(
  timestamp: string,
  options?: UpdateStatusOptions,
): DeliveryProof | null {
  const note = options?.deliveryNote?.trim();
  const otp = options?.deliveryOtp?.trim();
  const photoUri = options?.deliveryPhotoUri?.trim();
  if (!note) {
    return null;
  }
  if (!otp && !photoUri) {
    return null;
  }

  return {
    note,
    otp,
    photoUri,
    capturedAt: timestamp,
    capturedByUserId: options?.actorId,
  };
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
      setOrders(storedOrders.map((order) => normalizeOrder(order)));
      setNotifications(storedNotifications.map((notification) => normalizeNotification(notification)));
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
      unreadNotificationsCount: notifications.filter((item) => !item.read && item.audience === 'ADMIN').length,
      createOrder: (payload: CreateOrderPayload) => {
        const timestamp = toIsoNow();
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
          statusHistory: [
            {
              status: 'PENDIENTE',
              at: timestamp,
              byRole: 'CLIENT',
              byUserId: payload.clientId,
            },
          ],
        };
        setOrders((prev) => [nextOrder, ...prev]);
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            orderId: nextOrder.id,
            type: 'NEW_ORDER',
            audience: 'ADMIN',
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
        const timestamp = toIsoNow();

        if (!(order.status === 'EN_PREPARACION' || order.status === 'CONFIRMADO' || order.status === 'PENDIENTE')) {
          return {
            ok: false,
            message: es.orders.assignInvalid,
          };
        }

        setOrders((prev) =>
          prev.map((item) => {
            if (item.id !== orderId) {
              return item;
            }

            if (item.status === 'EN_PREPARACION' || item.status === 'CONFIRMADO') {
              return {
                ...item,
                assignedDriverId: driver.id,
                assignedDriverName: driver.name,
                status: 'ASIGNADO',
                updatedAt: timestamp,
                statusHistory: appendStatusHistory(item, 'ASIGNADO', timestamp, {
                  byRole: 'ADMIN',
                }),
              };
            }

            return {
              ...item,
              assignedDriverId: driver.id,
              assignedDriverName: driver.name,
              updatedAt: timestamp,
            };
          }),
        );

        setNotifications((prev) => [
          buildDriverAssignmentNotification(orderId, driver, timestamp),
          ...prev,
        ]);

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

        const timestamp = toIsoNow();
        setOrders((prev) =>
          prev.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  status: 'ASIGNADO',
                  assignedDriverId: driver.id,
                  assignedDriverName: driver.name,
                  updatedAt: timestamp,
                  statusHistory: appendStatusHistory(item, 'ASIGNADO', timestamp, {
                    byRole: 'ADMIN',
                  }),
                }
              : item,
          ),
        );
        setNotifications((prev) => [buildDriverAssignmentNotification(orderId, driver, timestamp), ...prev]);
        return { ok: true, message: `Pedido confirmado y asignado a ${driver.name}.` };
      },
      updateStatus: (orderId: string, nextStatus: OrderStatus, options?: UpdateStatusOptions) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, message: es.orders.notFound };
        }

        const isDriverTransition =
          nextStatus === 'ACEPTADO_REPARTIDOR' || nextStatus === 'EN_CAMINO' || nextStatus === 'ENTREGADO';
        const isAdminActor = options?.actorRole === 'ADMIN';
        const isAssignedDriverActor =
          options?.actorRole === 'DRIVER' && order.assignedDriverId === options.actorId;

        if (isDriverTransition && !isAdminActor && !isAssignedDriverActor) {
          return {
            ok: false,
            message: 'Solo el repartidor asignado puede ejecutar ese cambio de estado.',
          };
        }

        if (options?.actorRole === 'DRIVER' && order.assignedDriverId !== options.actorId) {
          return {
            ok: false,
            message: 'No puedes cambiar este pedido porque esta asignado a otro repartidor.',
          };
        }
        if (options?.actorRole === 'DRIVER' && nextStatus === 'CANCELADO') {
          return {
            ok: false,
            message: 'El repartidor no puede cancelar pedidos.',
          };
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

        const timestamp = toIsoNow();
        const deliveryProof = nextStatus === 'ENTREGADO' ? buildDeliveryProof(timestamp, options) : null;

        if (nextStatus === 'ENTREGADO' && !deliveryProof) {
          return {
            ok: false,
            message: 'Para marcar ENTREGADO agrega una nota y una foto o un OTP.',
          };
        }

        setOrders((prev) =>
          prev.map((item) =>
            item.id === orderId && canTransition(item.status, nextStatus)
              ? {
                  ...item,
                  status: nextStatus,
                  updatedAt: timestamp,
                  statusHistory: appendStatusHistory(item, nextStatus, timestamp, {
                    byRole: options?.actorRole,
                    byUserId: options?.actorId,
                    note: options?.deliveryNote?.trim(),
                  }),
                  deliveryProof: nextStatus === 'ENTREGADO' ? deliveryProof ?? item.deliveryProof : item.deliveryProof,
                }
              : item,
          ),
        );

        if (nextStatus === 'CANCELADO' && order.assignedDriverId) {
          setNotifications((prev) => [buildDriverCancelledNotification(order, timestamp), ...prev]);
        }

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

        const timestamp = toIsoNow();
        setOrders((prev) =>
          prev.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  status: nextStatus,
                  updatedAt: timestamp,
                  statusHistory: appendStatusHistory(item, nextStatus, timestamp, {
                    byRole: 'ADMIN',
                  }),
                }
              : item,
          ),
        );

        if (nextStatus === 'CANCELADO' && order.assignedDriverId) {
          setNotifications((prev) => [buildDriverCancelledNotification(order, timestamp), ...prev]);
        }

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
