import { describe, expect, it } from 'vitest';
import {
  ORDER_ALLOWED_TRANSITIONS,
  canTransition,
  validatePaymentForTransition,
} from '@/domain/rules/orderRules';

describe('orderRules', () => {
  it('define transiciones validas desde PENDIENTE', () => {
    expect(ORDER_ALLOWED_TRANSITIONS.PENDIENTE).toEqual(['CONFIRMADO', 'CANCELADO']);
  });

  it('permite transicion valida', () => {
    expect(canTransition('ASIGNADO', 'ACEPTADO_REPARTIDOR')).toBe(true);
  });

  it('bloquea transicion invalida', () => {
    expect(canTransition('PENDIENTE', 'ENTREGADO')).toBe(false);
  });

  it('bloquea avanzar si pago fue rechazado', () => {
    const result = validatePaymentForTransition('EFECTIVO', 'RECHAZADO', 'CONFIRMADO');
    expect(result.ok).toBe(false);
  });

  it('permite avanzar con pago contra entrega pendiente', () => {
    const result = validatePaymentForTransition('TARJETA', 'PENDIENTE_PAGO', 'ASIGNADO');
    expect(result.ok).toBe(true);
  });

  it('permite cancelar incluso sin pago confirmado', () => {
    const result = validatePaymentForTransition('TRANSFERENCIA', 'PENDIENTE_PAGO', 'CANCELADO');
    expect(result.ok).toBe(true);
  });
});
