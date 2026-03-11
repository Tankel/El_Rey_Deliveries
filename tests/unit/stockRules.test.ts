import { describe, expect, it } from 'vitest';
import { buildReleaseStockPlan, buildReserveStockPlan } from '@/domain/rules/stockRules';
import { Product } from '@/models/Product';
import { OrderItem } from '@/types/domain';

const products: Product[] = [
  {
    id: 'prod-cola',
    name: 'Refresco Cola',
    brand: 'Cola',
    image: 'https://example.com/cola.jpg',
    price: 20,
    originalPrice: 25,
    discountPercent: 20,
    unit: 'ml',
    sizeValue: 355,
    quantityPerPack: 24,
    containerType: 'Botella',
    packaging: 'Caja',
    seller: 'El Rey',
    description: 'Demo',
    category: 'Bebidas',
    stock: 10,
  },
];

const items: OrderItem[] = [
  {
    productId: 'prod-cola',
    productName: 'Refresco Cola',
    quantity: 3,
    unitPrice: 20,
    lineTotal: 60,
  },
];

describe('stockRules', () => {
  it('genera plan de reserva cuando hay stock', () => {
    const result = buildReserveStockPlan(items, products);
    expect(result.ok).toBe(true);
    expect(result.entries[0]?.nextStock).toBe(7);
  });

  it('falla si no hay stock suficiente', () => {
    const result = buildReserveStockPlan(
      [{ ...items[0], quantity: 99 }],
      products,
    );
    expect(result.ok).toBe(false);
  });

  it('genera plan de liberacion de stock', () => {
    const release = buildReleaseStockPlan(items, products);
    expect(release[0]?.nextStock).toBe(13);
  });
});

