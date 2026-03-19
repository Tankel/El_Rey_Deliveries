import { describe, expect, it } from 'vitest';
import { canTransition, validatePaymentForTransition } from '@/domain/rules/orderRules';
import { buildReleaseStockPlan, buildReserveStockPlan } from '@/domain/rules/stockRules';
import { Product } from '@/models/Product';
import { OrderItem } from '@/types/domain';

function applyStock(entries: Array<{ productId: string; nextStock: number }>, source: Product[]) {
  const map = new Map(source.map((product) => [product.id, { ...product }]));
  for (const entry of entries) {
    const product = map.get(entry.productId);
    if (product) {
      product.stock = entry.nextStock;
    }
  }
  return Array.from(map.values());
}

describe('order lifecycle integration', () => {
  it('reserva stock al crear y lo libera al cancelar', () => {
    const initialProducts: Product[] = [
      {
        id: 'prod-1',
        name: 'Agua',
        brand: 'Demo',
        image: 'https://example.com/agua.jpg',
        price: 10,
        originalPrice: 12,
        discountPercent: 16,
        unit: 'ml',
        sizeValue: 600,
        quantityPerPack: 1,
        containerType: 'Botella',
        packaging: 'Unidad',
        seller: 'El Rey',
        description: 'Demo',
        category: 'Bebidas',
        stock: 8,
      },
    ];

    const items: OrderItem[] = [
      {
        productId: 'prod-1',
        productName: 'Agua',
        quantity: 2,
        unitPrice: 10,
        lineTotal: 20,
      },
    ];

    const reserve = buildReserveStockPlan(items, initialProducts);
    expect(reserve.ok).toBe(true);

    const afterReserve = applyStock(reserve.entries, initialProducts);
    expect(afterReserve[0]?.stock).toBe(6);

    expect(canTransition('PENDIENTE', 'CONFIRMADO')).toBe(true);
    expect(canTransition('CONFIRMADO', 'ENTREGADO')).toBe(false);

    const paymentValidation = validatePaymentForTransition('TERMINAL', 'PENDIENTE_PAGO', 'ASIGNADO');
    expect(paymentValidation.ok).toBe(true);

    const release = buildReleaseStockPlan(items, afterReserve);
    const afterCancel = applyStock(release, afterReserve);
    expect(afterCancel[0]?.stock).toBe(8);
  });
});
