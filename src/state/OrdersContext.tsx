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

type OrdersContextValue = {
  drivers: DriverProfile[];
  orders: Order[];
  createOrder: (payload: CreateOrderPayload) => ActionResult;
  assignDriver: (orderId: string, driverId: string) => ActionResult;
  updateStatus: (orderId: string, nextStatus: OrderStatus) => ActionResult;
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

  useEffect(() => {
    const hydrate = async () => {
      const storedOrders = await jsonStorage.read<Order[]>(ORDERS_STORAGE_KEY, initialOrders);
      setOrders(storedOrders);
    };

    hydrate();
  }, []);

  useEffect(() => {
    void jsonStorage.write(ORDERS_STORAGE_KEY, orders);
  }, [orders]);

  const value = useMemo<OrdersContextValue>(
    () => ({
      drivers: initialDrivers,
      orders,
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
      updateStatus: (orderId: string, nextStatus: OrderStatus) => {
        const order = orders.find((item) => item.id === orderId);
        if (!order) {
          return { ok: false, message: es.orders.notFound };
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
    }),
    [orders],
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
