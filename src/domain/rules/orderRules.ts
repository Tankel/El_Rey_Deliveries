import { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/domain';

type RuleResult = {
  ok: boolean;
  message: string;
};

export const ORDER_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ASIGNADO', 'CANCELADO'],
  ASIGNADO: ['ACEPTADO_REPARTIDOR', 'CANCELADO'],
  ACEPTADO_REPARTIDOR: ['EN_CAMINO', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export function canTransition(current: OrderStatus, next: OrderStatus) {
  return ORDER_ALLOWED_TRANSITIONS[current].includes(next);
}

export function requiresPrepayment(method: PaymentMethod) {
  return method === 'TARJETA' || method === 'TRANSFERENCIA';
}

export function validatePaymentForTransition(
  paymentMethod: PaymentMethod | undefined,
  paymentStatus: PaymentStatus | undefined,
  nextStatus: OrderStatus,
): RuleResult {
  if (nextStatus === 'CANCELADO') {
    return { ok: true, message: 'ok' };
  }

  const method = paymentMethod ?? 'EFECTIVO';
  const status = paymentStatus ?? 'PENDIENTE_PAGO';

  if (status === 'RECHAZADO') {
    return {
      ok: false,
      message: 'No puedes avanzar el pedido porque el pago fue rechazado.',
    };
  }

  if (requiresPrepayment(method) && status !== 'PAGADO_SIMULADO') {
    return {
      ok: false,
      message: 'Este pedido requiere pago confirmado antes de avanzar.',
    };
  }

  return { ok: true, message: 'ok' };
}

