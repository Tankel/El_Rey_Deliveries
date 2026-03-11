import { Product } from '@/models/Product';
import { Order } from '@/types/domain';

export type ReorderSuggestion = {
  productId: string;
  productName: string;
  image: string;
  price: number;
  suggestedQuantity: number;
  averageQuantity: number;
  daysSinceLastPurchase: number;
  confidence: number;
  reason: string;
};

type BuildReorderSuggestionsInput = {
  products: Product[];
  orders: Order[];
  clientId: string;
  lookbackDays?: number;
  maxItems?: number;
};

type AggregatedDemand = {
  totalQuantity: number;
  orderCount: number;
  lastPurchaseAt: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toWholeDays(ms: number) {
  return Math.max(1, Math.floor(ms / DAY_MS));
}

function getReason(orderCount: number, daysSinceLastPurchase: number) {
  if (orderCount >= 4 && daysSinceLastPurchase <= 30) {
    return 'Compra frecuente';
  }
  if (daysSinceLastPurchase <= 14) {
    return 'Reposicion recomendada';
  }
  return 'Basado en historial';
}

export function buildReorderSuggestions({
  products,
  orders,
  clientId,
  lookbackDays = 90,
  maxItems = 6,
}: BuildReorderSuggestionsInput): ReorderSuggestion[] {
  if (!clientId.trim()) {
    return [];
  }

  const since = Date.now() - lookbackDays * DAY_MS;
  const productById = new Map(products.map((product) => [product.id, product]));
  const demandByProduct = new Map<string, AggregatedDemand>();

  orders
    .filter((order) => order.clientId === clientId)
    .filter((order) => order.status !== 'CANCELADO')
    .filter((order) => new Date(order.createdAt).getTime() >= since)
    .forEach((order) => {
      const orderTimestamp = new Date(order.createdAt).getTime();
      (order.items ?? []).forEach((item) => {
        if (!productById.has(item.productId)) {
          return;
        }
        const current = demandByProduct.get(item.productId);
        if (!current) {
          demandByProduct.set(item.productId, {
            totalQuantity: item.quantity,
            orderCount: 1,
            lastPurchaseAt: orderTimestamp,
          });
          return;
        }
        demandByProduct.set(item.productId, {
          totalQuantity: current.totalQuantity + item.quantity,
          orderCount: current.orderCount + 1,
          lastPurchaseAt: Math.max(current.lastPurchaseAt, orderTimestamp),
        });
      });
    });

  const ranked: Array<ReorderSuggestion & { score: number }> = [];
  const now = Date.now();

  demandByProduct.forEach((demand, productId) => {
    const product = productById.get(productId);
    if (!product) {
      return;
    }
    if ((product.stock ?? 0) <= 0) {
      return;
    }

    const daysSinceLastPurchase = toWholeDays(now - demand.lastPurchaseAt);
    const averageQuantity = demand.totalQuantity / demand.orderCount;
    const suggestedQuantity = Math.max(1, Math.round(averageQuantity));
    const recency = clamp(1 - daysSinceLastPurchase / lookbackDays, 0, 1);
    const frequency = clamp(demand.orderCount / 6, 0, 1);
    const quantitySignal = clamp(averageQuantity / 8, 0, 1);
    const confidence = Math.round((recency * 0.45 + frequency * 0.4 + quantitySignal * 0.15) * 100);
    const score = recency * 5 + frequency * 4 + quantitySignal * 1.5;

    ranked.push({
      productId: product.id,
      productName: product.name,
      image: product.image,
      price: product.price,
      suggestedQuantity,
      averageQuantity: Number(averageQuantity.toFixed(2)),
      daysSinceLastPurchase,
      confidence,
      reason: getReason(demand.orderCount, daysSinceLastPurchase),
      score,
    });
  });

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(({ score: _score, ...suggestion }) => suggestion);
}
