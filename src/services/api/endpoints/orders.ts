import { apiClient } from '@/services/api/client';
import { Order, OrderStatus } from '@/types/domain';

type CreateOrderRequest = {
  address: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

export function listOrders() {
  return apiClient.get<Order[]>('/orders');
}

export function createOrder(payload: CreateOrderRequest) {
  return apiClient.post<Order>('/orders', payload);
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  return apiClient.patch<Order>(`/orders/${orderId}/status`, { status });
}

export function assignOrderDriver(orderId: string, driverId: string) {
  return apiClient.patch<Order>(`/orders/${orderId}/assign-driver`, { driverId });
}
