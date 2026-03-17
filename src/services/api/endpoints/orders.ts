import { apiClient } from '@/services/api/client';
import { DeliveryRecipientRelation, Order, OrderStatus, UserRole } from '@/types/domain';

export type CreateOrderRequest = {
  clientId: string;
  clientName: string;
  address: string;
  deliveryLocation?: Order['deliveryLocation'];
  total: number;
  notes?: string;
  items: NonNullable<Order['items']>;
  paymentMethod?: Order['paymentMethod'];
  paymentStatus?: Order['paymentStatus'];
};

export type UpdateOrderStatusOptions = {
  actorId?: string;
  actorRole?: UserRole;
  deliveryNote?: string;
  deliveryRecipientName?: string;
  deliveryRecipientRelation?: DeliveryRecipientRelation;
  deliveryRecipientId?: string;
  deliveryOtp?: string;
  deliveryPhotoUri?: string;
};

export type DriverProfile = {
  id: string;
  name: string;
};

export type OrderNotification = {
  id: string;
  orderId: string;
  type: 'NEW_ORDER' | 'DRIVER_ASSIGNED' | 'ORDER_CANCELLED';
  audience: 'ADMIN' | 'DRIVER';
  targetUserId?: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export function listOrders() {
  return apiClient.get<{ items: Order[]; drivers: DriverProfile[] }>('/orders');
}

export function createOrder(payload: CreateOrderRequest) {
  return apiClient.post<{ ok: boolean; message: string; order: Order }>('/orders', payload);
}

export function updateOrderStatus(orderId: string, status: OrderStatus, options?: UpdateOrderStatusOptions) {
  return apiClient.patch<{ ok: boolean; message: string; order: Order }>(`/orders/${orderId}/status`, {
    status,
    ...(options ?? {}),
  });
}

export function forceOrderStatus(orderId: string, status: OrderStatus) {
  return apiClient.patch<{ ok: boolean; message: string; order: Order }>(`/orders/${orderId}/force-status`, {
    status,
  });
}

export function assignOrderDriver(orderId: string, driverId: string) {
  return apiClient.patch<{ ok: boolean; message: string; order: Order }>(`/orders/${orderId}/assign-driver`, {
    driverId,
  });
}

export function listOrderNotifications() {
  return apiClient.get<{ items: OrderNotification[] }>('/orders/notifications');
}

export function markOrderNotificationsRead(notificationIds: string[]) {
  return apiClient.patch<{ ok: boolean; message: string }>('/orders/notifications/read', {
    notificationIds,
  });
}

export function markAllOrderNotificationsRead() {
  return apiClient.patch<{ ok: boolean; message: string }>('/orders/notifications/read-all');
}
