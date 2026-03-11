import { ORDER_STATUSES, Order, OrderStatus } from '@/types/domain';

export type OrderTrackingInsight = {
  orderId: string;
  isActive: boolean;
  progressPercent: number;
  etaMinutes: number | null;
  nextMilestone: OrderStatus | null;
  currentStatusAt: string;
};

const DELIVERY_FLOW: OrderStatus[] = ORDER_STATUSES.filter((status) => status !== 'CANCELADO');
const MINUTE_MS = 60 * 1000;

const FALLBACK_REMAINING_MINUTES: Partial<Record<OrderStatus, number>> = {
  PENDIENTE: 70,
  CONFIRMADO: 58,
  EN_PREPARACION: 45,
  ASIGNADO: 34,
  ACEPTADO_REPARTIDOR: 26,
  EN_CAMINO: 18,
};

function median(items: number[]) {
  if (!items.length) {
    return null;
  }
  const sorted = [...items].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function getStatusTimestamp(order: Order, status: OrderStatus) {
  const found = order.statusHistory?.find((entry) => entry.status === status);
  if (found?.at) {
    return found.at;
  }
  if (order.status === status) {
    return order.updatedAt;
  }
  return null;
}

function getDeliveredTimestamp(order: Order) {
  const found = order.statusHistory?.find((entry) => entry.status === 'ENTREGADO');
  return found?.at ?? (order.status === 'ENTREGADO' ? order.updatedAt : null);
}

function buildStatusBenchmarks(orders: Order[]) {
  const tracker = new Map<OrderStatus, number[]>();
  const deliveredOrders = orders.filter((order) => order.status === 'ENTREGADO');

  deliveredOrders.forEach((order) => {
    const deliveredAt = getDeliveredTimestamp(order);
    if (!deliveredAt) {
      return;
    }
    const deliveredTs = new Date(deliveredAt).getTime();
    DELIVERY_FLOW.forEach((status) => {
      if (status === 'ENTREGADO') {
        return;
      }
      const statusAt = getStatusTimestamp(order, status);
      if (!statusAt) {
        return;
      }
      const statusTs = new Date(statusAt).getTime();
      const diffMinutes = Math.max(1, Math.round((deliveredTs - statusTs) / MINUTE_MS));
      if (diffMinutes <= 0 || !Number.isFinite(diffMinutes)) {
        return;
      }
      const next = tracker.get(status) ?? [];
      next.push(diffMinutes);
      tracker.set(status, next);
    });
  });

  const benchmarks = new Map<OrderStatus, number>();
  tracker.forEach((samples, status) => {
    const value = median(samples);
    if (value !== null) {
      benchmarks.set(status, Math.max(3, Math.round(value)));
    }
  });

  return benchmarks;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function buildOrderTrackingInsight(order: Order, allOrders: Order[], nowDate = new Date()): OrderTrackingInsight {
  const now = nowDate.getTime();
  const isActive = order.status !== 'ENTREGADO' && order.status !== 'CANCELADO';
  const currentStatusAt = getStatusTimestamp(order, order.status) ?? order.updatedAt ?? order.createdAt;

  if (order.status === 'ENTREGADO') {
    return {
      orderId: order.id,
      isActive: false,
      progressPercent: 100,
      etaMinutes: 0,
      nextMilestone: null,
      currentStatusAt,
    };
  }

  if (order.status === 'CANCELADO') {
    return {
      orderId: order.id,
      isActive: false,
      progressPercent: 0,
      etaMinutes: null,
      nextMilestone: null,
      currentStatusAt,
    };
  }

  const benchmarks = buildStatusBenchmarks(allOrders);
  const statusBenchmark =
    benchmarks.get(order.status) ?? FALLBACK_REMAINING_MINUTES[order.status] ?? 20;
  const elapsedCurrent = Math.max(
    0,
    Math.round((now - new Date(currentStatusAt).getTime()) / MINUTE_MS),
  );
  const etaMinutes = Math.max(3, Math.round(statusBenchmark - elapsedCurrent));

  const statusIndex = DELIVERY_FLOW.indexOf(order.status);
  const lastFlowIndex = DELIVERY_FLOW.length - 1;
  const segmentSize = 100 / lastFlowIndex;
  const baseProgress = Math.max(0, statusIndex) * segmentSize;
  const segmentProgress = clamp(elapsedCurrent / statusBenchmark, 0, 1) * segmentSize;
  const progressPercent = clamp(Math.round(baseProgress + segmentProgress), 4, 99);

  return {
    orderId: order.id,
    isActive,
    progressPercent,
    etaMinutes,
    nextMilestone: DELIVERY_FLOW[statusIndex + 1] ?? null,
    currentStatusAt,
  };
}

export function formatEtaLabel(etaMinutes: number | null) {
  if (etaMinutes === null) {
    return 'Sin ETA';
  }
  if (etaMinutes <= 1) {
    return 'Menos de 1 min';
  }
  if (etaMinutes < 60) {
    return `${etaMinutes} min`;
  }
  const hours = Math.floor(etaMinutes / 60);
  const minutes = etaMinutes % 60;
  return `${hours} h ${minutes} min`;
}
