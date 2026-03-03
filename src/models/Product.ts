export type ProductUnit = 'ml' | 'g' | 'pz' | 'l' | 'kg';

export type ProductCategory = 'Bebidas' | 'Snacks' | 'Abarrotes' | 'Promociones';

export type Product = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  unit: ProductUnit;
  sizeValue: number;
  quantityPerPack: number;
  containerType: string;
  packaging: string;
  seller: string;
  description: string;
  category: ProductCategory;
  stock?: number;
};

export function computeDiscountPercent(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || originalPrice <= price) {
    return 0;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatProductPresentation(product: Pick<Product, 'quantityPerPack' | 'sizeValue' | 'unit'>) {
  return `${product.quantityPerPack} pzs - ${product.sizeValue} ${product.unit}`;
}
