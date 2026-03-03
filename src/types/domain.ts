export type UserRole = 'CLIENT' | 'ADMIN' | 'DRIVER';

export const ORDER_STATUSES = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_PREPARACION',
  'ASIGNADO',
  'ACEPTADO_REPARTIDOR',
  'EN_CAMINO',
  'ENTREGADO',
  'CANCELADO',
] as const;

export type OrderStatus =
  (typeof ORDER_STATUSES)[number];

export type Order = {
  id: string;
  clientId: string;
  clientName: string;
  address: string;
  notes?: string;
  status: OrderStatus;
  total: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  createdAt: string;
  updatedAt: string;
};

export type DriverProfile = {
  id: string;
  name: string;
};
