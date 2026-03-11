export type UserRole = 'CLIENT' | 'ADMIN' | 'DRIVER';
export type PaymentMethod = 'TARJETA' | 'EFECTIVO' | 'TRANSFERENCIA';
export type PaymentStatus = 'PENDIENTE_PAGO' | 'PAGADO_SIMULADO' | 'RECHAZADO';
export type DeliveryRecipientRelation = 'CLIENTE' | 'ENCARGADO' | 'FAMILIAR' | 'PORTERIA' | 'OTRO';
export type AddressValidationProvider = 'GOOGLE' | 'MANUAL';

export type DeliveryLocation = {
  formattedAddress: string;
  placeId?: string;
  lat: number;
  lng: number;
  validatedBy: AddressValidationProvider;
  validatedAt: string;
};

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

export type OrderStatusHistoryEntry = {
  status: OrderStatus;
  at: string;
  byRole?: UserRole;
  byUserId?: string;
  note?: string;
};

export type DeliveryProof = {
  note: string;
  recipientName: string;
  recipientRelation: DeliveryRecipientRelation;
  recipientId?: string;
  otp?: string;
  photoUri?: string;
  capturedAt: string;
  capturedByUserId?: string;
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  clientId: string;
  clientName: string;
  address: string;
  notes?: string;
  status: OrderStatus;
  total: number;
  items?: OrderItem[];
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  deliveryProof?: DeliveryProof;
  deliveryLocation?: DeliveryLocation;
  stockReservedAt?: string;
  stockReleasedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DriverProfile = {
  id: string;
  name: string;
};
