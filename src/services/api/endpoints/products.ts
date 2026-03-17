import { apiClient } from '@/services/api/client';
import { Product } from '@/models/Product';

type ProductInput = Omit<Product, 'id' | 'discountPercent'>;
type ProductUpdate = Partial<Omit<Product, 'id'>>;

export function listProducts() {
  return apiClient.get<{
    items: Product[];
    containerTypeOptions: string[];
    packagingOptions: string[];
  }>('/products');
}

export function createProduct(payload: ProductInput) {
  return apiClient.post<{ ok: boolean; message: string; product: Product }>('/products', payload);
}

export function updateProduct(productId: string, payload: ProductUpdate) {
  return apiClient.put<{ ok: boolean; message: string; product: Product }>(`/products/${productId}`, payload);
}

export function deleteProduct(productId: string) {
  return apiClient.delete<{ ok: boolean; message: string }>(`/products/${productId}`);
}
