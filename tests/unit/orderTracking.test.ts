import { describe, expect, it } from 'vitest';
import { buildOrderTrackingInsight, formatEtaLabel } from '@/services/insights/orderTracking';
import { Order } from '@/types/domain';

function buildOrder(overrides: Partial<Order>): Order {
  const now = new Date().toISOString();
  return {
    id: 'order-1',
    clientId: 'client-1',
    clientName: 'Cliente',
    address: 'Direccion',
    status: 'EN_CAMINO',
    total: 100,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      { status: 'PENDIENTE', at: now },
      { status: 'EN_CAMINO', at: now },
    ],
    ...overrides,
  };
}

describe('orderTracking', () => {
  it('devuelve 100% para pedidos entregados', () => {
    const deliveredAt = new Date().toISOString();
    const order = buildOrder({
      status: 'ENTREGADO',
      statusHistory: [
        { status: 'PENDIENTE', at: deliveredAt },
        { status: 'ENTREGADO', at: deliveredAt },
      ],
    });
    const result = buildOrderTrackingInsight(order, [order]);
    expect(result.progressPercent).toBe(100);
    expect(result.etaMinutes).toBe(0);
  });

  it('calcula ETA para pedidos activos', () => {
    const now = Date.now();
    const active = buildOrder({
      id: 'active',
      status: 'EN_CAMINO',
      statusHistory: [
        { status: 'PENDIENTE', at: new Date(now - 50 * 60 * 1000).toISOString() },
        { status: 'EN_CAMINO', at: new Date(now - 5 * 60 * 1000).toISOString() },
      ],
    });
    const delivered1 = buildOrder({
      id: 'd1',
      status: 'ENTREGADO',
      statusHistory: [
        { status: 'PENDIENTE', at: new Date(now - 80 * 60 * 1000).toISOString() },
        { status: 'EN_CAMINO', at: new Date(now - 30 * 60 * 1000).toISOString() },
        { status: 'ENTREGADO', at: new Date(now - 5 * 60 * 1000).toISOString() },
      ],
    });

    const result = buildOrderTrackingInsight(active, [active, delivered1], new Date(now));
    expect(result.isActive).toBe(true);
    expect((result.etaMinutes ?? 0) > 0).toBe(true);
    expect(result.progressPercent >= 4).toBe(true);
    expect(result.nextMilestone).toBe('ENTREGADO');
  });

  it('formatea ETA de forma legible', () => {
    expect(formatEtaLabel(15)).toBe('15 min');
    expect(formatEtaLabel(61)).toBe('1 h 1 min');
    expect(formatEtaLabel(null)).toBe('Sin ETA');
  });
});
