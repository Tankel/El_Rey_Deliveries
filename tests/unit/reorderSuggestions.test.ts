import { describe, expect, it } from 'vitest';
import { Product } from '@/models/Product';
import { buildReorderSuggestions } from '@/services/insights/reorderSuggestions';
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
    stock: 20,
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
        quantity: 4,
        unitPrice: 10,
        lineTotal: 40,
      },
    ],
    ...overrides,
  };
}

describe('reorderSuggestions', () => {
  it('genera sugerencias para el cliente correcto', () => {
    const products = [
      buildProduct({ id: 'prod-1' }),
      buildProduct({ id: 'prod-2', name: 'Agua Natural' }),
    ];
    const orders = [
      buildOrder({
        id: 'order-a',
        clientId: 'client-1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { productId: 'prod-1', productName: 'Refresco Cola', quantity: 3, unitPrice: 10, lineTotal: 30 },
        ],
      }),
      buildOrder({
        id: 'order-b',
        clientId: 'client-1',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { productId: 'prod-2', productName: 'Agua Natural', quantity: 2, unitPrice: 12, lineTotal: 24 },
        ],
      }),
      buildOrder({
        id: 'order-c',
        clientId: 'client-x',
        items: [{ productId: 'prod-1', productName: 'Refresco Cola', quantity: 9, unitPrice: 10, lineTotal: 90 }],
      }),
    ];

    const suggestions = buildReorderSuggestions({
      products,
      orders,
      clientId: 'client-1',
      lookbackDays: 30,
      maxItems: 5,
    });

    expect(suggestions.length).toBe(2);
    expect(suggestions[0]?.productId).toBe('prod-1');
    expect((suggestions[0]?.suggestedQuantity ?? 0) > 0).toBe(true);
  });

  it('ignora productos sin stock', () => {
    const products = [buildProduct({ id: 'prod-1', stock: 0 })];
    const orders = [buildOrder({ clientId: 'client-1' })];
    const suggestions = buildReorderSuggestions({
      products,
      orders,
      clientId: 'client-1',
      lookbackDays: 30,
    });

    expect(suggestions).toHaveLength(0);
  });

  it('ignora pedidos cancelados', () => {
    const products = [buildProduct({ id: 'prod-1', stock: 10 })];
    const orders = [buildOrder({ clientId: 'client-1', status: 'CANCELADO' })];
    const suggestions = buildReorderSuggestions({
      products,
      orders,
      clientId: 'client-1',
      lookbackDays: 30,
    });

    expect(suggestions).toHaveLength(0);
  });
});
