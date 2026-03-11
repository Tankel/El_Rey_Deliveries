import { describe, expect, it } from 'vitest';
import { Product } from '@/models/Product';
import { buildStockAlerts } from '@/services/insights/stockAlerts';
import { Order } from '@/types/domain';

function buildProduct(overrides: Partial<Product>): Product {
  return {
    id: 'prod-1',
    name: 'Refresco Cola',
    brand: 'Cola',
    image: 'https://example.com/cola.jpg',
    price: 189,
    originalPrice: 210,
    discountPercent: 10,
    unit: 'ml',
    sizeValue: 355,
    quantityPerPack: 24,
    containerType: 'Lata',
    packaging: 'Caja',
    seller: 'El Rey',
    description: 'Demo',
    category: 'Bebidas',
    stock: 8,
    ...overrides,
  };
}

function buildOrder(overrides: Partial<Order>): Order {
  const now = new Date().toISOString();
  return {
    id: 'order-1',
    clientId: 'client-1',
    clientName: 'Cliente',
    address: 'Direccion',
    status: 'ENTREGADO',
    total: 100,
    createdAt: now,
    updatedAt: now,
    items: [
      {
        productId: 'prod-1',
        productName: 'Refresco Cola',
        quantity: 8,
        unitPrice: 10,
        lineTotal: 80,
      },
    ],
    ...overrides,
  };
}

describe('stockAlerts', () => {
  it('marca OUT cuando el stock es 0', () => {
    const alerts = buildStockAlerts({
      products: [buildProduct({ stock: 0 })],
      orders: [],
      lookbackDays: 14,
      lowStockThreshold: 5,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe('OUT');
  });

  it('recomienda reabasto cuando la cobertura es baja', () => {
    const orders = [buildOrder({ createdAt: new Date().toISOString() })];
    const alerts = buildStockAlerts({
      products: [buildProduct({ stock: 3 })],
      orders,
      lookbackDays: 7,
      lowStockThreshold: 2,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe('WARNING');
    expect((alerts[0]?.recommendedRestock ?? 0) > 0).toBe(true);
  });

  it('no alerta productos con cobertura estable', () => {
    const orders = [buildOrder({ items: [{ productId: 'prod-1', productName: 'Refresco Cola', quantity: 2, unitPrice: 10, lineTotal: 20 }] })];
    const alerts = buildStockAlerts({
      products: [buildProduct({ stock: 120 })],
      orders,
      lookbackDays: 14,
      lowStockThreshold: 5,
    });

    expect(alerts).toHaveLength(0);
  });
});
