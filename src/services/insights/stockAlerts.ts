import { Product } from '@/models/Product';
import { Order } from '@/types/domain';

export type StockAlertSeverity = 'OUT' | 'CRITICAL' | 'WARNING' | 'WATCH';

export type StockAlert = {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailyDemand: number;
  daysToStockout: number | null;
  severity: StockAlertSeverity;
  recommendedRestock: number;
};

type BuildStockAlertsInput = {
  products: Product[];
  orders: Order[];
  lookbackDays?: number;
  lowStockThreshold?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function severityRank(severity: StockAlertSeverity) {
  if (severity === 'OUT') return 0;
  if (severity === 'CRITICAL') return 1;
  if (severity === 'WARNING') return 2;
  return 3;
}

export function buildStockAlerts({
  products,
  orders,
  lookbackDays = 14,
  lowStockThreshold = 5,
}: BuildStockAlertsInput): StockAlert[] {
  const since = Date.now() - lookbackDays * DAY_MS;
  const demandByProduct = new Map<string, number>();

  orders
    .filter((order) => order.status !== 'CANCELADO')
    .filter((order) => new Date(order.createdAt).getTime() >= since)
    .forEach((order) => {
      (order.items ?? []).forEach((item) => {
        demandByProduct.set(item.productId, (demandByProduct.get(item.productId) ?? 0) + item.quantity);
      });
    });

  const alerts: StockAlert[] = [];

  for (const product of products) {
    const currentStock = product.stock ?? 0;
    const totalDemand = demandByProduct.get(product.id) ?? 0;
    const averageDailyDemand = totalDemand / lookbackDays;
    const daysToStockout =
      averageDailyDemand > 0 ? Number((currentStock / averageDailyDemand).toFixed(1)) : null;

    let severity: StockAlertSeverity | null = null;
    if (currentStock <= 0) {
      severity = 'OUT';
    } else if (currentStock <= lowStockThreshold) {
      severity = 'CRITICAL';
    } else if (daysToStockout !== null && daysToStockout <= 3) {
      severity = 'WARNING';
    } else if (daysToStockout !== null && daysToStockout <= 7) {
      severity = 'WATCH';
    }

    if (!severity) {
      continue;
    }

    const targetCoverageDays = severity === 'OUT' || severity === 'CRITICAL' ? 14 : 10;
    const demandProjection = Math.ceil(averageDailyDemand * targetCoverageDays);
    const fallbackRestock = Math.max(lowStockThreshold * 2 - currentStock, 0);
    const recommendedRestock = Math.max(demandProjection - currentStock, fallbackRestock);

    alerts.push({
      productId: product.id,
      productName: product.name,
      currentStock,
      averageDailyDemand: Number(averageDailyDemand.toFixed(2)),
      daysToStockout,
      severity,
      recommendedRestock,
    });
  }

  return alerts.sort((a, b) => {
    const bySeverity = severityRank(a.severity) - severityRank(b.severity);
    if (bySeverity !== 0) {
      return bySeverity;
    }
    const aDays = a.daysToStockout ?? Number.POSITIVE_INFINITY;
    const bDays = b.daysToStockout ?? Number.POSITIVE_INFINITY;
    return aDays - bDays;
  });
}

