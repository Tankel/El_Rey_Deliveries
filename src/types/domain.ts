export type UserRole = 'CLIENT' | 'ADMIN' | 'DRIVER';

export type OrderStatus =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'ASIGNADO'
  | 'ACEPTADO_REPARTIDOR'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

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
