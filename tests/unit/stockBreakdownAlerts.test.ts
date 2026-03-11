import { describe, expect, it } from 'vitest';
import { Product } from '@/models/Product';
import { buildStockBreakdownAlerts } from '@/services/insights/stockBreakdownAlerts';
import { Order } from '@/types/domain';

function buildProduct(overrides: Partial<Product>): Product {
  return {
    id: 'prod-1',
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
    seller: 'Proveedor Uno',
    description: 'Demo',
    category: 'Bebidas',
    stock: 4,
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
        quantity: 10,
        unitPrice: 20,
        lineTotal: 200,
      },
    ],
    ...overrides,
  };
}

describe('stockBreakdownAlerts', () => {
  it('genera alertas por categoria y proveedor', () => {
    const products = [
      buildProduct({ id: 'prod-1', category: 'Bebidas', seller: 'Prov A', stock: 2 }),
      buildProduct({ id: 'prod-2', category: 'Bebidas', seller: 'Prov A', stock: 3 }),
      buildProduct({ id: 'prod-3', category: 'Snacks', seller: 'Prov B', stock: 20 }),
    ];
    const orders = [
      buildOrder({
        items: [
          { productId: 'prod-1', productName: 'Refresco Cola', quantity: 8, unitPrice: 10, lineTotal: 80 },
          { productId: 'prod-2', productName: 'Agua', quantity: 7, unitPrice: 10, lineTotal: 70 },
        ],
      }),
    ];

    const alerts = buildStockBreakdownAlerts({
      products,
      orders,
      lookbackDays: 7,
    });

    expect(alerts.length > 0).toBe(true);
    expect(alerts.some((item) => item.dimension === 'CATEGORY')).toBe(true);
    expect(alerts.some((item) => item.dimension === 'SELLER')).toBe(true);
  });

  it('no crea alertas cuando no hay riesgo de quiebre', () => {
    const products = [buildProduct({ stock: 500 })];
    const orders = [buildOrder({ items: [{ productId: 'prod-1', productName: 'Refresco Cola', quantity: 1, unitPrice: 20, lineTotal: 20 }] })];
    const alerts = buildStockBreakdownAlerts({
      products,
      orders,
      lookbackDays: 14,
    });
    expect(alerts).toHaveLength(0);
  });
});
