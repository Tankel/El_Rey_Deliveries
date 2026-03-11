import { Product } from '@/models/Product';
import { OrderItem } from '@/types/domain';

export type StockPlanEntry = {
  productId: string;
  productName: string;
  currentStock: number;
  nextStock: number;
  quantity: number;
};

export type StockPlanResult = {
  ok: boolean;
  message: string;
  entries: StockPlanEntry[];
};

export function buildReserveStockPlan(items: OrderItem[], products: Product[]): StockPlanResult {
  const entries: StockPlanEntry[] = [];
  const quantities = new Map<string, { productName: string; quantity: number }>();

  for (const item of items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return { ok: false, message: `Cantidad invalida para ${item.productName}.`, entries: [] };
    }
    const previous = quantities.get(item.productId);
    quantities.set(item.productId, {
      productName: item.productName,
      quantity: (previous?.quantity ?? 0) + item.quantity,
    });
  }

  for (const [productId, quantityData] of quantities.entries()) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) {
      return { ok: false, message: `Producto no encontrado: ${quantityData.productName}.`, entries: [] };
    }
    const currentStock = product.stock ?? 0;
    if (currentStock < quantityData.quantity) {
      return {
        ok: false,
        message: `Stock insuficiente para ${product.name}. Disponible: ${currentStock}.`,
        entries: [],
      };
    }

    entries.push({
      productId: product.id,
      productName: product.name,
      quantity: quantityData.quantity,
      currentStock,
      nextStock: currentStock - quantityData.quantity,
    });
  }

  return { ok: true, message: 'ok', entries };
}

export function buildReleaseStockPlan(items: OrderItem[], products: Product[]) {
  const entries: StockPlanEntry[] = [];
  const quantities = new Map<string, { productName: string; quantity: number }>();

  for (const item of items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      continue;
    }
    const previous = quantities.get(item.productId);
    quantities.set(item.productId, {
      productName: item.productName,
      quantity: (previous?.quantity ?? 0) + item.quantity,
    });
  }

  for (const [productId, quantityData] of quantities.entries()) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) {
      continue;
    }
    const currentStock = product.stock ?? 0;

    entries.push({
      productId: product.id,
      productName: product.name,
      quantity: quantityData.quantity,
      currentStock,
      nextStock: currentStock + quantityData.quantity,
    });
  }

  return entries;
}

