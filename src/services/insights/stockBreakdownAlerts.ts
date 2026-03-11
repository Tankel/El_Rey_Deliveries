import { Product } from '@/models/Product';
import { Order } from '@/types/domain';
import { StockAlertSeverity } from '@/services/insights/stockAlerts';

export type StockBreakdownDimension = 'CATEGORY' | 'SELLER';

export type StockBreakdownAlert = {
  id: string;
  dimension: StockBreakdownDimension;
  key: string;
  severity: StockAlertSeverity;
  productCount: number;
  totalStock: number;
  averageDailyDemand: number;
  daysToStockout: number | null;
  recommendedRestock: number;
};

type BuildStockBreakdownAlertsInput = {
  products: Product[];
  orders: Order[];
  lookbackDays?: number;
};

type GroupAccumulator = {
  key: string;
  dimension: StockBreakdownDimension;
  productCount: number;
  totalStock: number;
  demand: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function severityRank(severity: StockAlertSeverity) {
  if (severity === 'OUT') return 0;
  if (severity === 'CRITICAL') return 1;
  if (severity === 'WARNING') return 2;
  return 3;
}

function getSeverity(totalStock: number, daysToStockout: number | null): StockAlertSeverity | null {
  if (totalStock <= 0) {
    return 'OUT';
  }
  if (daysToStockout === null) {
    return null;
  }
  if (daysToStockout <= 3) {
    return 'CRITICAL';
  }
  if (daysToStockout <= 7) {
    return 'WARNING';
  }
  if (daysToStockout <= 14) {
    return 'WATCH';
  }
  return null;
}

function buildDemandByProduct(orders: Order[], lookbackDays: number) {
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

  return demandByProduct;
}

function buildGroups(products: Product[], demandByProduct: Map<string, number>, dimension: StockBreakdownDimension) {
  const groups = new Map<string, GroupAccumulator>();

  products.forEach((product) => {
    const key = dimension === 'CATEGORY' ? product.category : product.seller;
    const current = groups.get(key) ?? {
      key,
      dimension,
      productCount: 0,
      totalStock: 0,
      demand: 0,
    };

    current.productCount += 1;
    current.totalStock += Math.max(0, product.stock ?? 0);
    current.demand += demandByProduct.get(product.id) ?? 0;
    groups.set(key, current);
  });

  return groups;
}

export function buildStockBreakdownAlerts({
  products,
  orders,
  lookbackDays = 21,
}: BuildStockBreakdownAlertsInput): StockBreakdownAlert[] {
  const demandByProduct = buildDemandByProduct(orders, lookbackDays);
  const categoryGroups = buildGroups(products, demandByProduct, 'CATEGORY');
  const sellerGroups = buildGroups(products, demandByProduct, 'SELLER');
  const merged = [...Array.from(categoryGroups.values()), ...Array.from(sellerGroups.values())];
  const alerts: StockBreakdownAlert[] = [];

  merged.forEach((group) => {
    const averageDailyDemand = group.demand / lookbackDays;
    const daysToStockout =
      averageDailyDemand > 0
        ? Number((group.totalStock / averageDailyDemand).toFixed(1))
        : null;
    const severity = getSeverity(group.totalStock, daysToStockout);
    if (!severity) {
      return;
    }

    const targetCoverage = severity === 'OUT' || severity === 'CRITICAL' ? 14 : 10;
    const projected = Math.ceil(averageDailyDemand * targetCoverage);
    const recommendedRestock = Math.max(projected - group.totalStock, 0);

    alerts.push({
      id: `${group.dimension}-${group.key}`,
      dimension: group.dimension,
      key: group.key,
      severity,
      productCount: group.productCount,
      totalStock: group.totalStock,
      averageDailyDemand: Number(averageDailyDemand.toFixed(2)),
      daysToStockout,
      recommendedRestock,
    });
  });

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
